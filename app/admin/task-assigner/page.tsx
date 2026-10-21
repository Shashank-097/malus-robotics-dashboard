"use client";

// PM TOOL REPO — src/app/admin/task-assigner/page.tsx
// Light, simple task assigner. A task can now be assigned to 1, 2 or 3 people (assignees[]).
// owner / ownerId are still saved as the FIRST assignee so older code keeps working.
// Legacy rows (only owner / ownerId) are still matched and displayed.

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties, FormEvent, ReactNode } from "react";
import { ChevronRight, Plus, RefreshCw, X } from "lucide-react";
import {
  AppShell, Avatar, StatusPill, normStatus, isOverdue, fmt, PENDING, STATUS_COLOR, PRIORITY_COLOR,
  type StatusName,
} from "@/components/ui-kit";

type Priority = "Low" | "Medium" | "High" | "Critical";
type Filter = "pending" | "done" | "all" | StatusName;
type SortKey = "due" | "priority" | "status" | "newest";
type View = "project" | "list";

interface Employee { employeeId: string; name: string; department?: string }
interface Assignee { id: string; name: string }
interface Task {
  _id?: string; id?: string; ownerId?: string; owner?: string; assignees?: Assignee[];
  projectId?: string; projectName?: string;
  stage?: string; status?: string; priority?: string; startDate?: string; endDate?: string; location?: string;
  customer?: string; actionTaken?: string; pendingPoints?: string; remarks?: string;
}
interface TaskForm {
  projectId: string; projectName: string; stage: string; startDate: string; endDate: string;
  priority: Priority; location: string; customer: string; pendingPoints: string; remarks: string;
}
interface Project {
  key: string; id: string; name: string; tasks: Task[];
  total: number; pending: number; done: number; overdue: number; pct: number; owners: string[];
}

const STATUSES: StatusName[] = ["Open", "In Process", "Hold", "Closed", "N.A."];
const KPIS: StatusName[] = ["Open", "In Process", "Hold", "Closed"];
const PRIORITIES: Priority[] = ["Low", "Medium", "High", "Critical"];
const PRIORITY_RANK: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
const STATUS_RANK: Record<StatusName, number> = { "In Process": 0, Open: 1, Hold: 2, Closed: 3, "N.A.": 4 };
const SORT_LABEL: Record<SortKey, string> = { due: "Due date", priority: "Priority", status: "Status", newest: "Newest first" };
const NO_PROJECT = "__none__";
const MAX_ASSIGNEES = 3;
const SLOT_LABELS = ["Assign to", "Second member (optional)", "Third member (optional)"];

/* ---------------- helpers ---------------- */

function normalizeTasks(data: unknown): Task[] {
  if (Array.isArray(data)) return data as Task[];
  const d = data as Record<string, unknown> | null;
  const list = d?.progress ?? d?.items ?? d?.data ?? d?.tasks;
  return Array.isArray(list) ? (list as Task[]) : [];
}

const clean = (s?: string) => (s || "").trim().toLowerCase();

// New rows use assignees[]; older rows fall back to the single owner / ownerId.
function getAssignees(t: Task): Assignee[] {
  if (t.assignees?.length) return t.assignees;
  return t.owner || t.ownerId ? [{ id: t.ownerId || "", name: t.owner || "" }] : [];
}

// id first; fall back to the free-text name for rows created before ids existed.
function belongs(t: Task, emp: { employeeId: string; name: string }): boolean {
  return getAssignees(t).some((a) =>
    a.id ? clean(a.id) === clean(emp.employeeId) : !!a.name && clean(a.name) === clean(emp.name)
  );
}

const projectKeyOf = (t: Task) => (t.projectId || t.projectName || "").trim() || NO_PROJECT;

function buildProjects(list: Task[]): Project[] {
  const map = new Map<string, Project>();
  for (const t of list) {
    const key = projectKeyOf(t);
    let p = map.get(key);
    if (!p) {
      p = {
        key, id: key === NO_PROJECT ? "" : (t.projectId || "").trim(),
        name: key === NO_PROJECT ? "No project" : (t.projectName || t.projectId || "").trim(),
        tasks: [], total: 0, pending: 0, done: 0, overdue: 0, pct: 0, owners: [],
      };
      map.set(key, p);
    }
    p.tasks.push(t);
    const s = normStatus(t.status);
    if (s !== "N.A.") p.total++;
    if (PENDING.includes(s)) p.pending++;
    if (s === "Closed") p.done++;
    if (isOverdue(t)) p.overdue++;
    for (const a of getAssignees(t)) if (a.name && !p.owners.includes(a.name)) p.owners.push(a.name);
  }
  const out = Array.from(map.values());
  out.forEach((p) => { p.pct = p.total ? Math.round((p.done / p.total) * 100) : 0; });
  // Most urgent first: overdue, then most pending work, "No project" last.
  return out.sort((a, b) =>
    (a.key === NO_PROJECT ? 1 : 0) - (b.key === NO_PROJECT ? 1 : 0) ||
    b.overdue - a.overdue || b.pending - a.pending || a.name.localeCompare(b.name));
}

function sortTasks(list: Task[], key: SortKey): Task[] {
  const dueMs = (t: Task) => {
    const d = t.endDate ? new Date(t.endDate).getTime() : NaN;
    return isNaN(d) ? Infinity : d;
  };
  return [...list].sort((a, b) => {
    if (key === "priority") return (PRIORITY_RANK[a.priority ?? ""] ?? 9) - (PRIORITY_RANK[b.priority ?? ""] ?? 9) || dueMs(a) - dueMs(b);
    if (key === "status") return STATUS_RANK[normStatus(a.status)] - STATUS_RANK[normStatus(b.status)] || dueMs(a) - dueMs(b);
    if (key === "newest") return String(b._id || b.id || "").localeCompare(String(a._id || a.id || ""));
    return dueMs(a) - dueMs(b);
  });
}

function Field({ label, id, children }: { label: string; id: string; children: ReactNode }) {
  return (
    <div>
      <label className="lbl" htmlFor={id}>{label}</label>
      {children}
    </div>
  );
}

function TaskRow({ t, showOwner }: { t: Task; showOwner: boolean }) {
  const late = isOverdue(t);
  const sc = STATUS_COLOR[normStatus(t.status)];
  const names = getAssignees(t).map((a) => a.name).filter(Boolean).join(", ");
  return (
    <li className="grid gap-3 sm:grid-cols-[1fr_auto] items-center p-4" style={{ background: "#fff", border: "1px solid var(--line)", borderLeft: `4px solid ${sc}`, borderRadius: 12 }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 15 }} className="break-words">{t.stage || "Untitled task"}</div>
        <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>{[showOwner ? names : "", t.customer, t.location].filter(Boolean).join(" · ") || "No extra details"}</div>
        {t.pendingPoints && <div style={{ fontSize: 13, marginTop: 6 }}><span className="muted">Pending: </span>{t.pendingPoints}</div>}
        {t.actionTaken && <div style={{ fontSize: 13, marginTop: 4 }}><span className="muted">Action taken: </span>{t.actionTaken}</div>}
      </div>
      <div className="flex sm:flex-col sm:items-end items-center gap-2 flex-wrap">
        <StatusPill status={t.status} />
        <span style={{ fontSize: 13, color: late ? "#d92d3a" : "var(--muted)", fontWeight: late ? 600 : 400 }}>Due {fmt(t.endDate)}{late ? " · overdue" : ""}</span>
        {t.priority && <span style={{ fontSize: 12, fontWeight: 600, color: PRIORITY_COLOR[t.priority] || "var(--muted)" }}>{t.priority} priority</span>}
      </div>
    </li>
  );
}

const EMPTY: TaskForm = {
  projectId: "", projectName: "", stage: "", startDate: "", endDate: "",
  priority: "Medium", location: "", customer: "", pendingPoints: "", remarks: "",
};

/* ---------------- page ---------------- */

export default function TaskAssignerPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [empError, setEmpError] = useState("");
  const [selected, setSelected] = useState("");
  const [filter, setFilter] = useState<Filter>("pending");
  const [query, setQuery] = useState("");
  const [drawer, setDrawer] = useState(false);

  const [projectFilter, setProjectFilter] = useState("");
  const [sort, setSort] = useState<SortKey>("due");
  const [view, setView] = useState<View>("project");
  const [taskQuery, setTaskQuery] = useState("");

  // employeeIds picked for the 3 assignee slots ("" = empty slot)
  const [assignedIds, setAssignedIds] = useState<string[]>(["", "", ""]);
  const [projectPick, setProjectPick] = useState("");
  const [department, setDepartment] = useState("");
  const [uploadedBy, setUploadedBy] = useState("");
  const [status, setStatus] = useState<StatusName>("Open");
  const [form, setForm] = useState<TaskForm>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const setField = <K extends keyof TaskForm>(k: K, v: TaskForm[K]) => setForm((p) => ({ ...p, [k]: v }));

  const loadTasks = useCallback(async () => {
    try {
      const r = await fetch("/api/progress", { cache: "no-store" });
      setTasks(normalizeTasks(await r.json()));
    } catch { /* keep last good list */ }
  }, []);

  const loadEmployees = useCallback(async () => {
    try {
      const r = await fetch("/api/employees", { cache: "no-store" });
      const d: { success?: boolean; employees?: Employee[]; message?: string } = await r.json();
      if (d.success) { setEmployees(d.employees || []); setEmpError(""); }
      else setEmpError(d.message || "Could not load employees.");
    } catch { setEmpError("Could not reach the employees API."); }
  }, []);

  useEffect(() => {
    Promise.all([loadEmployees(), loadTasks()]).finally(() => setLoading(false));
    const id = setInterval(loadTasks, 30000);
    return () => clearInterval(id);
  }, [loadEmployees, loadTasks]);

  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawer(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawer]);

  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(""), 5000);
    return () => clearTimeout(id);
  }, [notice]);

  /* ---------------- derived ---------------- */

  const selectedEmp = employees.find((e) => e.employeeId === selected);
  const scoped = useMemo(() => (selectedEmp ? tasks.filter((t) => belongs(t, selectedEmp)) : tasks), [tasks, selectedEmp]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const t of scoped) { const s = normStatus(t.status); c[s] = (c[s] || 0) + 1; }
    return c;
  }, [scoped]);

  const pendingCount = PENDING.reduce((n, s) => n + (counts[s] || 0), 0);
  const doneCount = counts["Closed"] || 0;
  const pct = pendingCount + doneCount ? Math.round((doneCount / (pendingCount + doneCount)) * 100) : 0;
  const overdueCount = useMemo(() => scoped.filter(isOverdue).length, [scoped]);

  // pending tasks per employee (a shared task counts for every assignee)
  const perEmp = useMemo(() => {
    const m: Record<string, number> = {};
    for (const emp of employees) {
      const n = tasks.filter((t) => PENDING.includes(normStatus(t.status)) && belongs(t, emp)).length;
      if (n) m[emp.employeeId] = n;
    }
    return m;
  }, [tasks, employees]);

  const projects = useMemo(() => buildProjects(scoped), [scoped]);
  const realProjects = projects.filter((p) => p.key !== NO_PROJECT);
  const knownProjects = useMemo(() => buildProjects(tasks).filter((p) => p.key !== NO_PROJECT), [tasks]);

  useEffect(() => {
    if (projectFilter && !projects.some((p) => p.key === projectFilter)) setProjectFilter("");
  }, [projects, projectFilter]);

  const shown = useMemo(() => {
    const q = taskQuery.trim().toLowerCase();
    return sortTasks(scoped.filter((t) => {
      const s = normStatus(t.status);
      if (filter === "pending" && !PENDING.includes(s)) return false;
      if (filter === "done" && s !== "Closed") return false;
      if (filter !== "all" && filter !== "pending" && filter !== "done" && s !== filter) return false;
      if (projectFilter && projectKeyOf(t) !== projectFilter) return false;
      const names = getAssignees(t).map((a) => a.name).join(" ");
      if (q && !`${t.stage} ${t.projectName} ${t.projectId} ${names} ${t.customer}`.toLowerCase().includes(q)) return false;
      return true;
    }), sort);
  }, [scoped, filter, projectFilter, taskQuery, sort]);

  const groups = useMemo(() => {
    const byKey = new Map<string, Task[]>();
    for (const t of shown) { const k = projectKeyOf(t); byKey.set(k, [...(byKey.get(k) || []), t]); }
    return projects.filter((p) => byKey.has(p.key)).map((p) => ({ project: p, tasks: byKey.get(p.key)! }));
  }, [projects, shown]);

  const roster = employees.filter((e) => (e.name + e.employeeId + (e.department || "")).toLowerCase().includes(query.toLowerCase()));
  const activeTab = filter === "pending" || filter === "done" || filter === "all" ? filter : "";

  /* ---------------- actions ---------------- */

  function openDrawer() {
    setError("");
    if (selected) setAssignedIds([selected, "", ""]);
    setDrawer(true);
  }

  // Set one slot, then close any gaps so the filled slots always come first.
  function setSlot(i: number, v: string) {
    setAssignedIds((prev) => {
      const next = [...prev];
      next[i] = v;
      const filled = next.filter(Boolean);
      return [...filled, ...Array(MAX_ASSIGNEES - filled.length).fill("")];
    });
  }

  function pickProject(v: string) {
    setProjectPick(v);
    if (v === "__new__" || !v) { setForm((p) => ({ ...p, projectId: "", projectName: "" })); return; }
    const p = knownProjects.find((x) => x.key === v);
    if (p) setForm((f) => ({ ...f, projectId: p.id, projectName: p.name }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const picked = assignedIds
      .filter(Boolean)
      .map((id) => employees.find((x) => x.employeeId === id))
      .filter((x): x is Employee => !!x);

    if (!picked.length) return setError("Choose at least one person for this task.");
    if (!form.projectId.trim() && !form.projectName.trim()) return setError("Choose a project, or create a new one.");
    if (!form.stage.trim()) return setError("Describe the task before assigning it.");

    const first = picked[0];
    setSubmitting(true);
    try {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form, status,
          assignees: picked.map((p) => ({ id: p.employeeId, name: p.name })),
          ownerId: first.employeeId,
          owner: first.name,
          department: department || first.department || "",
          uploadedBy,
          seenByOwner: false,
          date: new Date().toISOString().slice(0, 10),
        }),
      });
      const data: { success?: boolean; message?: string } = await res.json();
      if (data.success) {
        setNotice(`Task assigned to ${picked.map((p) => p.name).join(", ")}. It shows on their portal now.`);
        setForm((p) => ({ ...EMPTY, priority: p.priority, startDate: p.startDate, endDate: p.endDate, projectId: p.projectId, projectName: p.projectName }));
        setSelected(first.employeeId);
        setFilter("pending");
        setDrawer(false);
        await loadTasks();
      } else {
        setError(data.message || "Could not assign the task. Check the fields and try again.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error. The task was not assigned.");
    }
    setSubmitting(false);
  }

  const firstName = selectedEmp?.name.split(" ")[0];

  return (
    <AppShell
      outside={drawer && (
        <div className="fixed inset-0 z-40 flex justify-end" role="dialog" aria-modal="true" aria-label="Assign task">
          <div className="scrim absolute inset-0" style={{ background: "rgba(20,20,45,.4)" }} onClick={() => setDrawer(false)} />
          <form onSubmit={handleSubmit} className="drawer relative w-full max-w-[480px] h-full overflow-y-auto p-7" style={{ background: "#fff", color: "var(--ink)", borderLeft: "1px solid var(--line)" }}>
            <div className="card-h" style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 22 }}>Assign task</h2>
              <button type="button" className="btn ghost sm" onClick={() => setDrawer(false)} aria-label="Close"><X size={16} /></button>
            </div>

            <div className="grid gap-4">
              {/* Up to 3 assignees: the next slot appears once the previous one is filled */}
              {[0, 1, 2].map((i) => {
                if (i > 0 && !assignedIds[i - 1]) return null;
                const takenElsewhere = assignedIds.filter((id, j) => id && j !== i);
                return (
                  <Field key={i} id={`owner${i}`} label={SLOT_LABELS[i]}>
                    <select id={`owner${i}`} className="inp" value={assignedIds[i]} onChange={(e) => setSlot(i, e.target.value)}>
                      <option value="">{i === 0 ? "Select employee" : "None"}</option>
                      {employees.filter((emp) => !takenElsewhere.includes(emp.employeeId)).map((emp) => (
                        <option key={emp.employeeId} value={emp.employeeId}>
                          {emp.name} ({emp.employeeId}){emp.department ? ` · ${emp.department}` : ""}
                        </option>
                      ))}
                    </select>
                  </Field>
                );
              })}
              <p className="muted" style={{ fontSize: 12, marginTop: -8 }}>
                {assignedIds.filter(Boolean).length}/{MAX_ASSIGNEES} assigned · all of them see this task on their portal
              </p>

              <Field label="Project" id="proj">
                <select id="proj" className="inp" value={projectPick} onChange={(e) => pickProject(e.target.value)}>
                  <option value="">Select project</option>
                  {knownProjects.map((p) => <option key={p.key} value={p.key}>{p.id ? `${p.id} · ` : ""}{p.name}</option>)}
                  <option value="__new__">+ New project</option>
                </select>
              </Field>

              {projectPick === "__new__" && (
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Project ID" id="pid"><input id="pid" className="inp" value={form.projectId} onChange={(e) => setField("projectId", e.target.value)} /></Field>
                  <Field label="Project name" id="pname"><input id="pname" className="inp" value={form.projectName} onChange={(e) => setField("projectName", e.target.value)} /></Field>
                </div>
              )}

              <Field label="Task" id="stage">
                <textarea id="stage" className="inp" rows={3} placeholder="What needs to be done" value={form.stage} onChange={(e) => setField("stage", e.target.value)} />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Start" id="sd"><input id="sd" type="date" className="inp" value={form.startDate} onChange={(e) => setField("startDate", e.target.value)} /></Field>
                <Field label="Due" id="ed"><input id="ed" type="date" className="inp" value={form.endDate} onChange={(e) => setField("endDate", e.target.value)} /></Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Priority" id="pri">
                  <select id="pri" className="inp" value={form.priority} onChange={(e) => setField("priority", e.target.value as Priority)}>
                    {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </Field>
                <Field label="Initial status" id="st">
                  <select id="st" className="inp" value={status} onChange={(e) => setStatus(e.target.value as StatusName)}>
                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Location" id="loc"><input id="loc" className="inp" value={form.location} onChange={(e) => setField("location", e.target.value)} /></Field>
                <Field label="Customer" id="cust"><input id="cust" className="inp" value={form.customer} onChange={(e) => setField("customer", e.target.value)} /></Field>
              </div>

              <Field label="Department" id="dept"><input id="dept" className="inp" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Defaults to the first assignee's department" /></Field>
              <Field label="Pending points" id="pp"><textarea id="pp" className="inp" rows={2} value={form.pendingPoints} onChange={(e) => setField("pendingPoints", e.target.value)} /></Field>
              <Field label="Remarks" id="rem"><textarea id="rem" className="inp" rows={2} value={form.remarks} onChange={(e) => setField("remarks", e.target.value)} /></Field>
              <Field label="Assigned by" id="by"><input id="by" className="inp" value={uploadedBy} onChange={(e) => setUploadedBy(e.target.value)} /></Field>

              {error && <div role="alert" style={{ background: "#fdecec", color: "#b42318", border: "1px solid #f7cfcf", borderRadius: 11, padding: "10px 13px", fontSize: 14 }}>{error}</div>}

              <button type="submit" className="btn primary block" disabled={submitting}>{submitting ? "Assigning…" : "Assign task"}</button>
            </div>
          </form>
        </div>
      )}
    >
      <div className="head">
        <div>
          <h1>Task assigner</h1>
          <p>
            {selectedEmp ? `Showing ${selectedEmp.name}'s work` : "Showing the whole team"} · {pendingCount} pending · {pct}% complete{overdueCount ? ` · ${overdueCount} overdue` : ""}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn ghost" onClick={() => { loadEmployees(); loadTasks(); }}><RefreshCw size={16} /> Refresh</button>
          <button className="btn primary" onClick={openDrawer} disabled={!employees.length}><Plus size={16} /> {firstName ? `Assign to ${firstName}` : "Assign task"}</button>
        </div>
      </div>

      {notice && <div role="status" style={{ marginBottom: 20, padding: "12px 16px", background: "#e8f7ee", color: "#14795f", border: "1px solid #c9ebd6", borderRadius: 12, fontSize: 14, fontWeight: 500 }}>{notice}</div>}

      {/* Status summary (click to filter) */}
      <div className="kpis">
        {KPIS.map((s) => (
          <button key={s} className={`kpi ${filter === s ? "on" : ""}`} style={{ "--kc": STATUS_COLOR[s] } as CSSProperties} aria-pressed={filter === s} onClick={() => setFilter(filter === s ? "pending" : s)}>
            <span className="kl"><span className="kd" /> {s}</span>
            <div className="kn">{counts[s] || 0}</div>
            <small>{selectedEmp ? selectedEmp.name : "Whole team"}</small>
          </button>
        ))}
        <div className="kpi" style={{ cursor: "default", "--kc": "#1b1b2f" } as CSSProperties}>
          <span className="kl"><span className="kd" /> Projects</span>
          <div className="kn">{realProjects.length}</div>
          <small>{employees.length} people</small>
        </div>
      </div>

      <div className="cols">
        <div className="stack">
          {/* Project tracker */}
          {projects.length > 0 && (
            <section className="card" aria-label="Projects">
              <div className="card-h">
                <div><h2>Projects</h2><p className="sub">Progress by project · click one to filter the tasks below</p></div>
                {projectFilter && <button className="btn ghost sm" onClick={() => setProjectFilter("")}>Show all</button>}
              </div>
              <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))" }}>
                {projects.map((p) => {
                  const active = projectFilter === p.key;
                  return (
                    <button key={p.key} type="button" aria-pressed={active} onClick={() => setProjectFilter(active ? "" : p.key)}
                      style={{ textAlign: "left", font: "inherit", color: "inherit", cursor: "pointer", background: active ? "var(--soft)" : "#fff", border: `1px solid ${active ? "var(--primary)" : "var(--line)"}`, borderRadius: 14, padding: 16, transition: "background-color .2s ease,border-color .2s ease,transform .2s ease" }}>
                      <div className="truncate" style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</div>
                      <div className="muted truncate" style={{ fontSize: 12, marginBottom: 12 }}>{p.id || "No project ID"}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span className="pb" role="progressbar" aria-valuenow={p.pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${p.name} ${p.pct}% done`}><i style={{ width: `${p.pct}%` }} /></span>
                        <span style={{ fontSize: 13, fontWeight: 700 }}>{p.pct}%</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginTop: 8 }}>
                        <span className="muted">{p.done}/{p.total} closed</span>
                        <span style={{ color: p.overdue ? "#d92d3a" : "var(--muted)", fontWeight: p.overdue ? 600 : 400 }}>{p.pending} open{p.overdue ? ` · ${p.overdue} overdue` : ""}</span>
                      </div>
                      {p.owners.length > 0 && (
                        <div style={{ display: "flex", marginTop: 12 }} aria-label={`People: ${p.owners.join(", ")}`}>
                          {p.owners.slice(0, 4).map((o, i) => (
                            <span key={o} style={{ marginLeft: i ? -8 : 0, border: "2px solid #fff", borderRadius: 99, display: "inline-flex" }}><Avatar name={o} size={26} /></span>
                          ))}
                          {p.owners.length > 4 && <span className="muted" style={{ fontSize: 12, marginLeft: 8, alignSelf: "center" }}>+{p.owners.length - 4}</span>}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Tasks */}
          <section className="card" aria-label="Tasks">
            <div className="card-h" style={{ flexWrap: "wrap" }}>
              <div><h2>Tasks <span className="muted" style={{ fontSize: 14, fontWeight: 500 }}>({shown.length})</span></h2>
                <p className="sub">{projectFilter ? `Filtered to ${projects.find((p) => p.key === projectFilter)?.name || "one project"}` : "All projects"}</p></div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {([["pending", "Pending"], ["done", "Completed"], ["all", "All"]] as const).map(([k, label]) => (
                  <button key={k} className={`chip ${activeTab === k ? "on" : ""}`} onClick={() => setFilter(k)}>{label}</button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]" style={{ marginBottom: 16 }}>
              <input className="inp" placeholder="Search tasks, project, person or customer" aria-label="Search tasks" value={taskQuery} onChange={(e) => setTaskQuery(e.target.value)} />
              <select className="inp" aria-label="Sort tasks" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
                {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => <option key={k} value={k}>Sort: {SORT_LABEL[k]}</option>)}
              </select>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button className={`chip ${view === "project" ? "on" : ""}`} onClick={() => setView("project")}>By project</button>
                <button className={`chip ${view === "list" ? "on" : ""}`} onClick={() => setView("list")}>Flat list</button>
              </div>
            </div>

            {loading ? (
              <p className="muted" style={{ padding: "28px 0", fontSize: 14 }}>Loading tasks…</p>
            ) : shown.length === 0 ? (
              <div className="empty">
                {selectedEmp && scoped.length === 0
                  ? `No tasks are assigned to ${selectedEmp.name} yet. Use Assign task to give them work.`
                  : filter === "done"
                  ? "No completed tasks yet. They appear here when an employee marks a task Closed in the portal."
                  : "Nothing matches these filters. Try All, or clear the project and search."}
                {scoped.length > 0 && filter !== "all" && (
                  <div style={{ marginTop: 12 }}><button className="btn ghost sm" onClick={() => { setFilter("all"); setProjectFilter(""); setTaskQuery(""); }}>Show all {scoped.length} tasks</button></div>
                )}
              </div>
            ) : view === "list" ? (
              <ul className="grid gap-3">{shown.map((t, i) => <TaskRow key={t._id || t.id || i} t={t} showOwner={!selectedEmp} />)}</ul>
            ) : (
              <div className="grid gap-4">
                {groups.map(({ project: p, tasks: pt }) => (
                  <details key={p.key} open style={{ background: "var(--bg)", borderRadius: 14, padding: 12 }}>
                    <summary className="flex items-center gap-3" style={{ padding: 6 }}>
                      <span className="chev"><ChevronRight size={18} /></span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span className="truncate" style={{ display: "block", fontWeight: 700, fontSize: 16 }}>{p.name}</span>
                        <span className="muted truncate" style={{ display: "block", fontSize: 12 }}>{p.id || "No project ID"} · {pt.length} shown · {p.pct}% done</span>
                      </span>
                      {p.overdue > 0 && <span className="pill" style={{ color: "#d92d3a", background: "#d92d3a1a" }}>{p.overdue} overdue</span>}
                    </summary>
                    <ul className="grid gap-3" style={{ marginTop: 10 }}>{pt.map((t, i) => <TaskRow key={t._id || t.id || i} t={t} showOwner={!selectedEmp} />)}</ul>
                  </details>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* ================= EMPLOYEES ================= */}
        <aside className="card" aria-label="Employees">
          <div className="card-h">
            <div><h2>Employees</h2><p className="sub">{employees.length} from the Employee Portal · pick one</p></div>
            {selected && <button className="btn ghost sm" onClick={() => { setSelected(""); setProjectFilter(""); }}>Clear</button>}
          </div>
          <input className="inp" style={{ marginBottom: 10 }} placeholder="Search name, ID or department" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search employees" />
          {empError && <div role="alert" style={{ background: "#fdecec", color: "#b42318", borderRadius: 10, padding: 10, fontSize: 13, marginBottom: 8 }}>{empError}</div>}
          <ul style={{ maxHeight: 620, overflowY: "auto" }}>
            {roster.map((emp) => {
              const active = selected === emp.employeeId;
              const n = perEmp[emp.employeeId] || 0;
              return (
                <li key={emp.employeeId}>
                  <button className={`row ${active ? "on" : ""}`} aria-pressed={active}
                    onClick={() => { setSelected(active ? "" : emp.employeeId); setFilter("pending"); setProjectFilter(""); }}>
                    <Avatar name={emp.name} size={40} />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span className="truncate" style={{ display: "block", fontWeight: 600, fontSize: 14 }}>{emp.name}</span>
                      <span className="muted truncate" style={{ display: "block", fontSize: 12 }}>{emp.department || "No department"} · {emp.employeeId}</span>
                    </span>
                    {n > 0 && <span className="count">{n}</span>}
                  </button>
                </li>
              );
            })}
            {!roster.length && !empError && !loading && <li className="muted" style={{ fontSize: 14, padding: "20px 0" }}>No employee matches that search.</li>}
          </ul>
        </aside>
      </div>
    </AppShell>
  );
}
