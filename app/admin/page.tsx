"use client";

// PM TOOL REPO — src/app/admin/page.tsx
// Light, simple overview. Behaviour kept: middleware-guarded access, /api/progress,
// daily sheet save, search + status filter + pagination, open a project, AlertCenter.
// Logout (with the "logged out safely" flash) now lives in the shared header (ui-kit).

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2, ChevronLeft, ChevronRight, FileText, History, Loader2, MapPin, Plus, RefreshCw, Search,
  Upload, Users, X, XCircle,
} from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import {
  AppShell, Avatar, StatusPill, normStatus, isOverdue, fmt, PENDING, STATUS_COLOR, PRIORITY_COLOR,
} from "@/components/ui-kit";

type Report = {
  _id: string; projectId?: string; projectName?: string; owner?: string; ownerId?: string;
  status?: string; priority?: string; location?: string; customer?: string; stage?: string;
  department?: string; uploadedBy?: string; endDate?: string;
};
type Activity = { _id: string; title?: string; description?: string; time?: string };
type Toast = { id: number; kind: "success" | "error"; message: string };

const FILTERS = ["All", "Open", "In Process", "Hold", "Closed", "N.A."];
const KPIS = ["Open", "In Process", "Hold", "Closed"];
const PAGE_SIZE = 10;
const COLS = { "--cols": "2.2fr 1fr 1.3fr .9fr 1fr" } as CSSProperties;

export default function AdminPage() {
  const router = useRouter();

  const [reports, setReports] = useState<Report[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [hour, setHour] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [isLoadingReports, setIsLoadingReports] = useState(true);
  const [isSavingSheet, setIsSavingSheet] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const pushToast = (kind: Toast["kind"], message: string) => {
    const id = Date.now() + Math.random();
    setToasts((p) => [...p, { id, kind, message }]);
    window.setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  };

  useEffect(() => {
    const h = window.setTimeout(() => setDebouncedSearch(search), 250);
    return () => window.clearTimeout(h);
  }, [search]);
  useEffect(() => setPage(1), [debouncedSearch, filter]);

  const fetchReports = async () => {
    setIsLoadingReports(true);
    try {
      const res = await fetch("/api/progress", { cache: "no-store" });
      const data = await res.json();
      if (data.success) setReports(data.progress || []);
      else pushToast("error", data.message || "Could not load projects");
    } catch {
      pushToast("error", "Could not reach the server to load projects");
    } finally {
      setIsLoadingReports(false);
    }
  };

  const fetchActivities = async () => {
    try {
      const res = await fetch("/api/activity", { cache: "no-store" });
      const data = await res.json();
      if (data.success) setActivities(data.activities || []);
    } catch { /* activity feed is optional */ }
  };

  useEffect(() => {
    // Access is enforced by middleware (signed session cookie).
    // localStorage is only used to show the admin's name / ID.
    let user = null;
    try { user = JSON.parse(localStorage.getItem("currentUser") || "null"); } catch {}
    setCurrentUser(user || { name: "Admin", role: "admin" });
    setHour(new Date().getHours());
    fetchReports();
    fetchActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = () => { fetchReports(); fetchActivities(); };

  const saveDailyProgress = async () => {
    setIsSavingSheet(true);
    try {
      const res = await fetch("/api/save-daily-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ savedBy: currentUser?.employeeId || "Admin" }),
      });
      const data = await res.json();
      if (!data.success) { pushToast("error", data.message || "Unable to save daily progress"); return; }
      pushToast("success", data.message || "Today's sheet saved");
      await fetchActivities();
    } catch {
      pushToast("error", "Error saving daily progress");
    } finally {
      setIsSavingSheet(false);
    }
  };

  /* ---------------- derived ---------------- */

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of reports) { const s = normStatus(r.status); c[s] = (c[s] || 0) + 1; }
    return c;
  }, [reports]);

  const total = reports.length;
  const closed = counts["Closed"] || 0;
  const pct = total ? Math.round((closed / total) * 100) : 0;
  const overdue = useMemo(() => reports.filter(isOverdue).length, [reports]);
  const pieData = Object.keys(counts).map((name) => ({ name, value: counts[name] }));

  const filteredReports = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    return reports.filter((r) => {
      const fields = [r.projectName, r.owner, r.projectId, r.uploadedBy, r.customer, r.status, r.stage, r.priority, r.department, r.location];
      return fields.some((f) => (f || "").toLowerCase().includes(q)) && (filter === "All" || normStatus(r.status) === filter);
    });
  }, [reports, debouncedSearch, filter]);

  const totalPages = Math.max(1, Math.ceil(filteredReports.length / PAGE_SIZE));
  const pagedReports = filteredReports.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const workload = useMemo(() => {
    const m: Record<string, number> = {};
    for (const r of reports) {
      if (!PENDING.includes(normStatus(r.status))) continue;
      const o = r.owner?.trim() || "Unassigned";
      m[o] = (m[o] || 0) + 1;
    }
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [reports]);

  const greeting = hour === null ? "Welcome" : hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = (currentUser?.name || "Admin").split(" ")[0];

  return (
    <AppShell
      outside={
        <div className="fixed bottom-5 right-5 z-[60] grid gap-2" aria-live="polite">
          {toasts.map((t) => (
            <div key={t.id} className="flex items-center gap-2.5 px-4 py-3 text-[14px] font-medium"
              style={{ borderRadius: 12, boxShadow: "0 12px 30px rgba(30,30,80,.18)", background: t.kind === "success" ? "#e8f7ee" : "#fdecec", color: t.kind === "success" ? "#14795f" : "#b42318", border: "1px solid rgba(0,0,0,.05)" }}>
              {t.kind === "success" ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
              {t.message}
              <button onClick={() => setToasts((p) => p.filter((x) => x.id !== t.id))} aria-label="Dismiss" className="border-0 bg-transparent cursor-pointer" style={{ color: "inherit" }}><X size={13} /></button>
            </div>
          ))}
        </div>
      }
    >
      <div className="head">
        <div>
          <h1>Overview</h1>
          <p>{greeting}, {firstName}. Here&apos;s where your projects stand today.</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn ghost" onClick={handleRefresh}><RefreshCw size={16} className={isLoadingReports ? "animate-spin" : ""} /> Refresh</button>
          <button className="btn primary" onClick={() => router.push("/admin/projects/new")}><Plus size={16} /> Add project</button>
        </div>
      </div>

      {/* Summary */}
      <div className="kpis">
        <button className={`kpi ${filter === "All" ? "on" : ""}`} style={{ "--kc": "#1b1b2f" } as CSSProperties} aria-pressed={filter === "All"} onClick={() => setFilter("All")}>
          <span className="kl"><span className="kd" /> Total projects</span>
          <div className="kn">{total}</div>
          <small>{pct}% closed{overdue ? ` · ${overdue} overdue` : ""}</small>
        </button>
        {KPIS.map((s) => (
          <button key={s} className={`kpi ${filter === s ? "on" : ""}`} style={{ "--kc": STATUS_COLOR[s] } as CSSProperties} aria-pressed={filter === s} onClick={() => setFilter(filter === s ? "All" : s)}>
            <span className="kl"><span className="kd" /> {s}</span>
            <div className="kn">{counts[s] || 0}</div>
            <small>{total ? Math.round(((counts[s] || 0) / total) * 100) : 0}% of all</small>
          </button>
        ))}
      </div>

      <div className="cols">
        {/* ================= PROJECTS ================= */}
        <section className="card" aria-label="Projects" style={{ minWidth: 0 }}>
          <div className="card-h" style={{ flexWrap: "wrap" }}>
            <div>
              <h2>Projects</h2>
              <p className="sub">{filteredReports.length} of {reports.length} shown · click a row to open it</p>
            </div>
            <div style={{ position: "relative", width: "100%", maxWidth: 300 }}>
              <Search size={15} className="muted" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
              <input className="inp" style={{ paddingLeft: 36, paddingRight: search ? 34 : 13 }} placeholder="Search project, owner, ID, customer"
                value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search projects" />
              {search && (
                <button onClick={() => setSearch("")} aria-label="Clear search" className="muted"
                  style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", border: 0, background: "none", cursor: "pointer" }}><X size={15} /></button>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
            {FILTERS.map((f) => (
              <button key={f} className={`chip ${filter === f ? "on" : ""}`} onClick={() => setFilter(f)}>{f === "All" ? "All statuses" : f}</button>
            ))}
          </div>

          <div style={{ overflowX: "auto" }}>
            <div style={{ minWidth: 680 }}>
              <div className="thead" style={COLS}><span>Project</span><span>Status</span><span>Owner</span><span>Priority</span><span>Due</span></div>

              {isLoadingReports && Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="trow" style={{ ...COLS, cursor: "default" }}>
                  {Array.from({ length: 5 }).map((__, j) => <span key={j} className="animate-pulse" style={{ height: 14, borderRadius: 7, background: "var(--soft)" }} />)}
                </div>
              ))}

              {!isLoadingReports && pagedReports.map((r) => {
                const late = isOverdue(r);
                return (
                  <button key={r._id} type="button" className="trow" style={COLS} onClick={() => router.push(`/admin/projects/${r._id}`)}>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: "block", fontWeight: 600, fontSize: 15 }} className="truncate">{r.projectName || "Untitled project"}</span>
                      <span className="muted truncate" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                        <span style={{ fontWeight: 600, color: "var(--primary)" }}>{r.projectId || "No code"}</span>
                        {(r.customer || r.location) && <><span>·</span><MapPin size={12} />{r.customer || r.location}</>}
                      </span>
                    </span>
                    <span><StatusPill status={r.status} /></span>
                    <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                      <Avatar name={r.owner || "?"} size={28} />
                      <span className="truncate" style={{ fontSize: 14 }}>{r.owner || "Unassigned"}</span>
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: PRIORITY_COLOR[r.priority || ""] || "var(--muted)" }}>{r.priority || "—"}</span>
                    <span style={{ fontSize: 14, color: late ? "#d92d3a" : "inherit", fontWeight: late ? 600 : 400 }}>{fmt(r.endDate)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {!isLoadingReports && filteredReports.length === 0 && (
            <div className="empty" style={{ marginTop: 14 }}>
              {debouncedSearch || filter !== "All" ? "No project matches. Clear the search or filter." : "No projects yet. Use Add project to create the first one."}
            </div>
          )}

          {!isLoadingReports && filteredReports.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16 }}>
              <p className="muted" style={{ fontSize: 13 }}>Page {page} of {totalPages}</p>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn ghost sm" aria-label="Previous page" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}><ChevronLeft size={16} /></button>
                <button className="btn ghost sm" aria-label="Next page" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}><ChevronRight size={16} /></button>
              </div>
            </div>
          )}
        </section>

        {/* ================= SIDE ================= */}
        <aside className="stack" aria-label="Actions, team and activity">
          <section className="card">
            <div className="card-h"><h2>Quick actions</h2></div>
            <div style={{ display: "grid", gap: 10 }}>
              <button className="btn ghost" onClick={saveDailyProgress} disabled={isSavingSheet} style={{ justifyContent: "flex-start" }}>
                {isSavingSheet ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Save today&apos;s sheet
              </button>
              <Link href="/upload" className="btn ghost" style={{ justifyContent: "flex-start" }}><Upload size={16} /> Upload Excel sheet</Link>
              <Link href="/submit-report" className="btn ghost" style={{ justifyContent: "flex-start" }}><FileText size={16} /> Submit report</Link>
              <Link href="/admin/daily-reports" className="btn ghost" style={{ justifyContent: "flex-start" }}><History size={16} /> Previous reports</Link>
            </div>
          </section>

          <section className="card">
            <div className="card-h">
              <div><h2>Team workload</h2><p className="sub">Pending tasks per owner</p></div>
            </div>
            {workload.length === 0 ? (
              <div className="empty">Nothing pending right now.</div>
            ) : (
              <ul style={{ maxHeight: 280, overflowY: "auto" }}>
                {workload.map(([name, n]) => (
                  <li key={name}>
                    <Link href="/admin/task-assigner" className="row">
                      <Avatar name={name} size={36} />
                      <span className="truncate" style={{ flex: 1, minWidth: 0, fontWeight: 600, fontSize: 14 }}>{name}</span>
                      <span className="count">{n}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/admin/task-assigner" className="btn ghost sm" style={{ marginTop: 12 }}><Users size={15} /> Open task assigner</Link>
          </section>

          <section className="card">
            <div className="card-h"><div><h2>Status mix</h2><p className="sub">{closed} of {total} closed</p></div></div>
            <div style={{ height: 210 }}>
              {total === 0 ? (
                <div className="empty">No project data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3} stroke="#fff" strokeWidth={2}>
                      {pieData.map((e) => <Cell key={e.name} fill={STATUS_COLOR[e.name] || STATUS_COLOR["N.A."]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e6e7ef", boxShadow: "0 8px 24px rgba(30,30,80,.1)", fontSize: 13 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          {activities.length > 0 && (
            <section className="card">
              <div className="card-h"><h2>Recent activity</h2></div>
              <ul>
                {activities.slice(0, 5).map((a) => (
                  <li key={a._id} className="feed">
                    <div style={{ fontWeight: 600 }}>{a.title || "Update"}</div>
                    {a.description && <div className="muted">{a.description}</div>}
                    {a.time && <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{fmt(a.time)}</div>}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </AppShell>
  );
}