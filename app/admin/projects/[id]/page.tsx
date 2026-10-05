"use client";

// ============================================================
// PM TOOL REPO — src/app/admin/projects/[id]/page.tsx
//
// Same soft theme as the admin dashboard and Task Assigner.
//   - The project CODE is the headline (big, in the hero card); the name is
//     the supporting line.
//   - Four clear cards: Assignment & status, Schedule, Project details, Notes.
//   - "Assigned to" is a live employee picker. It saves ownerId (employeeId)
//     together with the name, so the Task Assigner page and the Employee
//     Portal pick the change up.
//   - GSAP: intro sequence, edit-mode transition, modal and toast motion.
//     Respects prefers-reduced-motion.
//
// npm i gsap
// ============================================================

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import gsap from "gsap";
import { ArrowLeft, Trash2, Loader2, CheckCircle2, XCircle, X, AlertTriangle, Pencil } from "lucide-react";
import EmployeePicker from "@/components/EmployeePicker";

type Report = {
  _id: string;
  date?: string;
  uploadedBy?: string;
  projectId?: string;
  projectName?: string;
  owner?: string;
  ownerId?: string;
  status?: string;
  remarks?: string;
  startDate?: string;
  endDate?: string;
  priority?: string;
  location?: string;
  customer?: string;
  stage?: string;
  department?: string;
  pendingPoints?: string;
  actionTaken?: string;
  lastUpdated?: string;
};

type Toast = { id: number; kind: "success" | "error"; message: string };

const STAGE_OPTIONS = ["Technical Proposal", "Waiting for PO", "Commercial Proposal", "Pre Sales", "N.A"];
const STATUS_OPTIONS = ["Open", "In Process", "Hold", "Closed", "N.A."];
const PRIORITY_OPTIONS = ["High", "Medium", "Low", "N.A."];

const STATUS_COLOR: Record<string, string> = {
  Open: "#4b44b3",
  "In Process": "#f2805a",
  Hold: "#d49a00",
  Closed: "#1fa88f",
  "N.A.": "#8a8ca5",
};
const AVATAR = ["#f2805a", "#4b44b3", "#1fa88f", "#d49a00", "#8b5cf6", "#3b82f6"];

const css = `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
.tk{--bg:#dfe2e8;--ink:#20203a;--muted:#8a8ca5;--indigo:#4b44b3;--indigo-d:#3b3597;--orange:#f2805a;--yellow:#f6c344;--soft:#f4f5fa;
  background:var(--bg);color:var(--ink);font-family:Poppins,system-ui,sans-serif;min-height:100vh}
.tk *{box-sizing:border-box}
.tk .shell{background:#fff;border-radius:40px;box-shadow:0 20px 60px rgba(75,68,179,.10)}
.tk .soft{background:#fff;border-radius:22px;box-shadow:0 12px 32px rgba(75,68,179,.09)}
.tk .hero{background:linear-gradient(160deg,var(--indigo) 0%,var(--indigo-d) 100%);color:#fff;border-radius:28px;box-shadow:0 22px 44px rgba(75,68,179,.35)}
.tk .pill{border:0;border-radius:999px;padding:9px 20px;background:var(--soft);color:var(--ink);font:600 12px Poppins,sans-serif;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:8px}
.tk .pill.on{background:var(--orange);color:#fff;box-shadow:0 8px 18px rgba(242,128,90,.4)}
.tk .pill.danger{color:#b42318;background:#fdecec}
.tk .pill:disabled{opacity:.6;cursor:not-allowed}
.tk .inp{width:100%;background:var(--soft);color:var(--ink);border:2px solid transparent;border-radius:12px;padding:10px 12px;font:500 13px Poppins,sans-serif}
.tk .inp:focus{outline:none;border-color:var(--indigo);background:#fff}
.tk .inp.err{border-color:#e5484d}
.tk .lbl{display:block;font-size:12px;font-weight:600;color:var(--muted);margin-bottom:6px}
.tk button:focus-visible,.tk a:focus-visible{outline:3px solid var(--orange);outline-offset:2px}
.tk .navbar{background:var(--indigo);border-radius:999px;box-shadow:0 18px 40px rgba(59,53,151,.45)}
`;

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";
}

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const idx = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR.length;
  return (
    <span
      className="inline-flex items-center justify-center shrink-0 font-bold text-white"
      style={{ width: size, height: size, borderRadius: size / 2.6, background: AVATAR[idx], fontSize: size * 0.34 }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}

function fmt(d?: string) {
  if (!d) return "";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? d : dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

const emptyReport = (uploadedBy: string): Report => ({
  _id: "", projectId: "", projectName: "", startDate: "", endDate: "", priority: "", location: "",
  customer: "", stage: "", department: "", owner: "", ownerId: "", pendingPoints: "", actionTaken: "",
  uploadedBy, status: "Open", remarks: "", date: new Date().toLocaleDateString("en-GB"), lastUpdated: "",
});

// ---- small field helpers: one component renders both view and edit state ----

function Row({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="lbl">
        {label}
        {required && <span style={{ color: "#e5484d" }}> *</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-[12px]" style={{ color: "#b42318" }}>{error}</p>}
    </div>
  );
}

function View({ value, strong }: { value?: string; strong?: boolean }) {
  return (
    <div className={`min-h-[38px] flex items-center text-[14px] ${strong ? "font-semibold" : "font-medium"} whitespace-pre-wrap`}>
      {value?.trim() ? value : <span style={{ color: "var(--muted)", fontWeight: 400 }}>Not set</span>}
    </div>
  );
}

function Card({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <section className="g-sec soft p-6">
      <h2 className="text-[18px] font-semibold leading-tight">{title}</h2>
      <p className="text-[12px] mb-5" style={{ color: "var(--muted)" }}>{hint}</p>
      <div className="grid gap-4">{children}</div>
    </section>
  );
}

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const projectId = params?.id;
  const isNew = projectId === "new";

  const rootRef = useRef<HTMLDivElement>(null);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isEditing, setIsEditing] = useState(isNew);
  const [snapshot, setSnapshot] = useState<Report | null>(null);

  const pushToast = (kind: Toast["kind"], message: string) => {
    const id = Date.now() + Math.random();
    setToasts((p) => [...p, { id, kind, message }]);
    window.setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("currentUser") || "null");
    if (!user || user.role !== "admin") {
      router.push("/login");
      return;
    }
    setCurrentUser(user);

    if (isNew) {
      setReport(emptyReport(user?.name || user?.email || "Admin"));
      return;
    }

    // No get-by-id endpoint yet, so match from the list. Swap for
    // /api/progress/${projectId} when one exists.
    const loadReport = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/progress", { cache: "no-store" });
        const data = await res.json();
        if (data.success) {
          const match = (data.progress || []).find((r: Report) => r._id === projectId);
          if (match) setReport(match);
          else setNotFound(true);
        } else {
          pushToast("error", data.message || "Could not load this project");
        }
      } catch {
        pushToast("error", "Could not reach the server");
      } finally {
        setIsLoading(false);
      }
    };

    loadReport();
    setIsEditing(isNew);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, projectId, isNew]);

  const set = <K extends keyof Report>(k: K, v: Report[K]) => setReport((r) => (r ? { ...r, [k]: v } : r));

  const handleStartEdit = () => {
    setSnapshot(report);
    setFieldErrors({});
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (isNew) return router.push("/admin");
    if (snapshot) setReport(snapshot);
    setFieldErrors({});
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!report || isSaving) return;

    const errors: Record<string, string> = {};
    if (!report.projectId?.trim()) errors.projectId = "Enter the project code";
    if (!report.projectName?.trim()) errors.projectName = "Enter the project name";
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      pushToast("error", "Fix the highlighted fields to save");
      return;
    }
    setFieldErrors({});

    const finalUploadedBy = report.uploadedBy || currentUser?.email || currentUser?.name || "Admin";

    setIsSaving(true);
    try {
      const res = await fetch("/api/progress", {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: report._id,
          projectId: report.projectId,
          projectName: report.projectName,
          startDate: report.startDate,
          endDate: report.endDate,
          priority: report.priority,
          location: report.location,
          customer: report.customer,
          stage: report.stage,
          department: report.department,
          owner: report.owner,
          ownerId: report.ownerId || "",
          pendingPoints: report.pendingPoints,
          actionTaken: report.actionTaken,
          uploadedBy: finalUploadedBy,
          status: report.status,
          remarks: report.remarks,
          date: new Date().toLocaleDateString("en-GB"),
        }),
      });
      const data = await res.json();
      if (!data.success) {
        pushToast("error", data.message || "Save failed");
        return;
      }
      pushToast("success", isNew ? "Project added" : "Project updated");
      if (isNew) {
        const newId = data.progress?._id || data.id;
        router.push(newId ? `/admin/projects/${newId}` : "/admin");
      } else {
        setIsEditing(false);
        setSnapshot(null);
      }
    } catch {
      pushToast("error", "Unable to save project");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!report) return;
    setIsDeleting(true);
    try {
      const res = await fetch("/api/progress", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: report._id }),
      });
      const data = await res.json();
      if (!data.success) {
        pushToast("error", data.message || "Delete failed");
        return;
      }
      router.push("/admin");
    } catch {
      pushToast("error", "Unable to delete project");
    } finally {
      setIsDeleting(false);
      setConfirmingDelete(false);
    }
  };

  // Cmd/Ctrl+S saves while editing.
  useEffect(() => {
    if (!isEditing) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // ---------------- GSAP ----------------
  const ready = !isLoading && !!report && !notFound;
  const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (!ready || reduced()) return;
    const ctx = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .from(".g-top > *", { opacity: 0, y: -12, stagger: 0.07, duration: 0.4 })
        .from(".g-hero", { opacity: 0, y: 24, scale: 0.98, duration: 0.6 }, "-=0.2")
        .from(".g-sec", { opacity: 0, y: 26, stagger: 0.1, duration: 0.55 }, "-=0.35");
    }, rootRef);
    return () => ctx.revert();
  }, [ready]);

  useEffect(() => {
    if (!isEditing || reduced()) return;
    const ctx = gsap.context(() => {
      gsap.from(".g-editbar", { y: 80, opacity: 0, duration: 0.45, ease: "back.out(1.4)" });
      gsap.fromTo(".g-sec", { y: 8 }, { y: 0, duration: 0.4, stagger: 0.05, ease: "power2.out", clearProps: "transform" });
    }, rootRef);
    return () => ctx.revert();
  }, [isEditing]);

  useEffect(() => {
    if (!confirmingDelete || reduced()) return;
    const ctx = gsap.context(() => {
      gsap.from(".g-overlay", { opacity: 0, duration: 0.2 });
      gsap.from(".g-modal", { opacity: 0, scale: 0.92, y: 12, duration: 0.3, ease: "back.out(1.6)" });
    }, rootRef);
    return () => ctx.revert();
  }, [confirmingDelete]);

  useEffect(() => {
    if (!toasts.length || reduced()) return;
    const ctx = gsap.context(() => {
      gsap.from(".g-toast:last-child", { x: 40, opacity: 0, duration: 0.35, ease: "power3.out" });
    }, rootRef);
    return () => ctx.revert();
  }, [toasts.length]);

  const sc = STATUS_COLOR[report?.status ?? ""] || STATUS_COLOR["N.A."];
  const err = (k: string) => (fieldErrors[k] ? "inp err" : "inp");

  return (
    <div ref={rootRef} className="tk p-3 sm:p-6 pb-32">
      <style>{css}</style>

      <div className="shell max-w-[1100px] mx-auto p-5 sm:p-9">
        {/* Top row */}
        <div className="g-top flex items-center justify-between gap-3 mb-6">
          <Link href="/admin" className="pill"><ArrowLeft size={14} /> All projects</Link>
          {!isEditing && !isNew && report && (
            <div className="flex gap-2">
              <button className="pill danger" onClick={() => setConfirmingDelete(true)}><Trash2 size={14} /> Delete</button>
              <button className="pill on" onClick={handleStartEdit}><Pencil size={14} /> Edit project</button>
            </div>
          )}
        </div>

        {isLoading && (
          <div className="grid gap-5">
            <div className="h-44 rounded-[28px] animate-pulse" style={{ background: "var(--soft)" }} />
            <div className="grid gap-5 lg:grid-cols-2">
              {[0, 1, 2, 3].map((i) => <div key={i} className="h-56 rounded-[22px] animate-pulse" style={{ background: "var(--soft)" }} />)}
            </div>
          </div>
        )}

        {!isLoading && notFound && (
          <div className="py-16 text-center" style={{ background: "var(--soft)", borderRadius: 22 }}>
            <AlertTriangle size={26} className="mx-auto" style={{ color: "var(--muted)" }} />
            <p className="mt-3 text-[15px] font-semibold">Project not found</p>
            <p className="text-[13px] mt-1" style={{ color: "var(--muted)" }}>It may have been deleted, or the link is out of date.</p>
            <Link href="/admin" className="pill on mt-5"><ArrowLeft size={14} /> Back to projects</Link>
          </div>
        )}

        {ready && report && (
          <>
            {/* Hero: the project code is the headline */}
            <section className="g-hero hero p-7 mb-6 grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] items-center" aria-label="Project summary">
              <div className="min-w-0">
                <div className="text-[12px] font-medium opacity-75 mb-1">Project code</div>
                <div className="text-[40px] sm:text-[52px] font-bold leading-none tracking-tight break-words">
                  {report.projectId?.trim() || (isNew ? "New project" : "No code")}
                </div>
                <div className="text-[16px] mt-3 opacity-90 truncate">{report.projectName?.trim() || "Untitled project"}</div>
              </div>

              <div className="grid gap-3 justify-items-start md:justify-items-end">
                <span className="text-[12px] font-bold px-4 py-1.5" style={{ background: "#fff", color: sc, borderRadius: 999 }}>
                  {report.status || "N.A."}
                </span>
                <div className="flex items-center gap-2">
                  <Avatar name={report.owner || "?"} size={32} />
                  <span className="text-[14px] font-semibold">{report.owner || "Unassigned"}</span>
                </div>
                <div className="text-[12px] opacity-80">
                  {report.endDate ? `Due ${fmt(report.endDate)}` : "No due date"}
                  {report.priority ? ` · ${report.priority} priority` : ""}
                </div>
              </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card title="Assignment & status" hint="Who owns this project and where it stands">
                <Row label="Assigned to">
                  {isEditing ? (
                    <EmployeePicker
                      inputClassName="inp"
                      value={{ ownerId: report.ownerId, owner: report.owner }}
                      onChange={({ ownerId, owner }) => setReport((r) => (r ? { ...r, ownerId, owner } : r))}
                    />
                  ) : (
                    <>
                      <div className="min-h-[38px] flex items-center gap-2.5">
                        {report.owner ? <Avatar name={report.owner} size={30} /> : null}
                        <span className="text-[14px] font-semibold">
                          {report.owner || <span style={{ color: "var(--muted)", fontWeight: 400 }}>Not set</span>}
                        </span>
                        {report.ownerId && <span className="text-[11px]" style={{ color: "var(--muted)" }}>{report.ownerId}</span>}
                      </div>
                      {report.owner && !report.ownerId && (
                        <p className="text-[11px] mt-1" style={{ color: "#d49a00" }}>
                          Not linked to an employee account. Edit and pick from the list so it shows on the Task Assigner.
                        </p>
                      )}
                    </>
                  )}
                </Row>

                <Row label="Status">
                  {isEditing ? (
                    <select className="inp" value={report.status || ""} onChange={(e) => set("status", e.target.value)}>
                      <option value="">Select status</option>
                      {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  ) : (
                    <div className="min-h-[38px] flex items-center">
                      <span className="text-[12px] font-semibold px-3 py-1" style={{ color: sc, background: sc + "1f", borderRadius: 999 }}>
                        {report.status || "N.A."}
                      </span>
                    </div>
                  )}
                </Row>

                <Row label="Stage">
                  {isEditing ? (
                    <select className="inp" value={report.stage || ""} onChange={(e) => set("stage", e.target.value)}>
                      <option value="">Select stage</option>
                      {STAGE_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  ) : <View value={report.stage} />}
                </Row>

                <Row label="Uploaded by">
                  {isEditing ? (
                    <input className="inp" value={report.uploadedBy || ""} onChange={(e) => set("uploadedBy", e.target.value)} />
                  ) : <View value={report.uploadedBy} />}
                </Row>
              </Card>

              <Card title="Schedule" hint="Dates, priority and department">
                <div className="grid grid-cols-2 gap-4">
                  <Row label="Start date">
                    {isEditing ? (
                      <input type="date" className="inp" value={report.startDate || ""} onChange={(e) => set("startDate", e.target.value)} />
                    ) : <View value={fmt(report.startDate)} />}
                  </Row>
                  <Row label="End date">
                    {isEditing ? (
                      <input type="date" className="inp" value={report.endDate || ""} onChange={(e) => set("endDate", e.target.value)} />
                    ) : <View value={fmt(report.endDate)} />}
                  </Row>
                </div>
                <Row label="Priority">
                  {isEditing ? (
                    <select className="inp" value={report.priority || ""} onChange={(e) => set("priority", e.target.value)}>
                      <option value="">Select priority</option>
                      {PRIORITY_OPTIONS.map((p) => <option key={p}>{p}</option>)}
                    </select>
                  ) : <View value={report.priority} />}
                </Row>
                <Row label="Department">
                  {isEditing ? (
                    <input className="inp" value={report.department || ""} onChange={(e) => set("department", e.target.value)} />
                  ) : <View value={report.department} />}
                </Row>
              </Card>

              <Card title="Project details" hint="Code, name, customer and site">
                <Row label="Project code" required error={fieldErrors.projectId}>
                  {isEditing ? (
                    <input className={err("projectId")} value={report.projectId || ""} onChange={(e) => set("projectId", e.target.value)} />
                  ) : <View value={report.projectId} strong />}
                </Row>
                <Row label="Project name" required error={fieldErrors.projectName}>
                  {isEditing ? (
                    <input className={err("projectName")} value={report.projectName || ""} onChange={(e) => set("projectName", e.target.value)} />
                  ) : <View value={report.projectName} />}
                </Row>
                <div className="grid grid-cols-2 gap-4">
                  <Row label="Customer">
                    {isEditing ? (
                      <input className="inp" value={report.customer || ""} onChange={(e) => set("customer", e.target.value)} />
                    ) : <View value={report.customer} />}
                  </Row>
                  <Row label="Location">
                    {isEditing ? (
                      <input className="inp" value={report.location || ""} onChange={(e) => set("location", e.target.value)} />
                    ) : <View value={report.location} />}
                  </Row>
                </div>
              </Card>

              <Card title="Notes" hint="What was done, what is pending, anything else">
                <Row label="Action taken">
                  {isEditing ? (
                    <textarea className="inp" rows={3} placeholder="What has been done" value={report.actionTaken || ""} onChange={(e) => set("actionTaken", e.target.value)} />
                  ) : <View value={report.actionTaken} />}
                </Row>
                <Row label="Issues / pending points">
                  {isEditing ? (
                    <textarea className="inp" rows={3} placeholder="What is blocking or pending" value={report.pendingPoints || ""} onChange={(e) => set("pendingPoints", e.target.value)} />
                  ) : <View value={report.pendingPoints} />}
                </Row>
                <Row label="Remarks">
                  {isEditing ? (
                    <textarea className="inp" rows={3} value={report.remarks || ""} onChange={(e) => set("remarks", e.target.value)} />
                  ) : <View value={report.remarks} />}
                </Row>
              </Card>
            </div>

            {!isNew && report.lastUpdated && (
              <p className="text-[12px] mt-6" style={{ color: "var(--muted)" }}>Last updated {report.lastUpdated}</p>
            )}
          </>
        )}
      </div>

      {/* Edit bar */}
      {isEditing && ready && (
        <div className="g-editbar navbar fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 pl-5 pr-2.5 py-2.5 z-30 max-w-[calc(100vw-24px)]">
          <span className="text-white text-[12px] font-medium hidden sm:inline">{isNew ? "New project" : "Editing project"}</span>
          <button className="pill" onClick={handleCancelEdit} disabled={isSaving}>Cancel</button>
          <button className="pill on" onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 size={14} className="animate-spin" />}
            {isNew ? "Add project" : "Save changes"}
          </button>
        </div>
      )}

      {/* Delete confirmation */}
      {confirmingDelete && report && (
        <div className="g-overlay fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(32,32,58,.5)" }} onClick={() => !isDeleting && setConfirmingDelete(false)}>
          <div className="g-modal soft w-full max-w-md p-6" role="dialog" aria-modal="true" aria-label="Delete project" onClick={(e) => e.stopPropagation()}>
            <span className="inline-flex items-center justify-center" style={{ width: 44, height: 44, borderRadius: 14, background: "#fdecec", color: "#b42318" }}>
              <AlertTriangle size={20} />
            </span>
            <h2 className="text-[18px] font-semibold mt-4">Delete {report.projectId || "this project"}?</h2>
            <p className="text-[13px] mt-1.5" style={{ color: "var(--muted)" }}>
              This permanently removes {report.projectName || "the project"} and its history. You can't undo it.
            </p>
            <div className="flex justify-end gap-2 mt-6">
              <button className="pill" onClick={() => setConfirmingDelete(false)} disabled={isDeleting}>Keep project</button>
              <button className="pill" style={{ background: "#e5484d", color: "#fff" }} onClick={handleDelete} disabled={isDeleting}>
                {isDeleting && <Loader2 size={14} className="animate-spin" />}
                Delete project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div className="fixed bottom-24 right-5 z-[60] grid gap-2" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="g-toast flex items-center gap-2.5 px-4 py-3 text-[13px] font-medium"
            style={{
              borderRadius: 14,
              boxShadow: "0 12px 30px rgba(75,68,179,.2)",
              background: t.kind === "success" ? "#e6f7f3" : "#fdecec",
              color: t.kind === "success" ? "#14795f" : "#b42318",
            }}
          >
            {t.kind === "success" ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            {t.message}
            <button onClick={() => setToasts((p) => p.filter((x) => x.id !== t.id))} aria-label="Dismiss" className="border-0 bg-transparent cursor-pointer" style={{ color: "inherit" }}>
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}