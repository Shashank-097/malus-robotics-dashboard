"use client";

// PM TOOL REPO — src/components/ui-kit.tsx
// Shared light theme for /admin and /admin/task-assigner. Matches the landing + login pages.
// Provides: AppShell (header + nav + logout + page container), Avatar, StatusPill, helpers.
// Needs your existing "@/components/AlertCenter" (default export + stampLastSeen).

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, Bot, ClipboardList, FileText, LayoutDashboard, LogOut, Upload } from "lucide-react";
import AlertCenter, { stampLastSeen } from "@/components/AlertCenter";

/* ---------------- shared helpers ---------------- */

export type StatusName = "Open" | "In Process" | "Hold" | "Closed" | "N.A.";
export const PENDING: StatusName[] = ["Open", "In Process", "Hold"];

export const STATUS_COLOR: Record<string, string> = {
  Open: "#4b44b3", "In Process": "#d9730d", Hold: "#b7860b", Closed: "#15955f", "N.A.": "#6b6e85",
};
export const PRIORITY_COLOR: Record<string, string> = {
  Low: "#6b6e85", Medium: "#4b44b3", High: "#d9730d", Critical: "#d92d3a",
};
const AVATAR = ["#4b44b3", "#d9730d", "#15955f", "#2b7de9", "#8b5cf6", "#c2410c"];

// Maps any status text (including the old employee-portal values) onto the five PM statuses.
export function normStatus(s?: string): StatusName {
  const v = (s || "").toLowerCase().trim();
  if (!v || v === "open" || v.includes("not started")) return "Open";
  if (v.includes("process") || v.includes("progress")) return "In Process";
  if (v.includes("hold")) return "Hold";
  if (v.includes("closed") || v.includes("complet") || v === "done") return "Closed";
  if (v === "n.a." || v === "na" || v === "n/a") return "N.A.";
  return "Open";
}

export function isOverdue(t: { status?: string; endDate?: string }): boolean {
  const s = normStatus(t.status);
  if (s === "Closed" || s === "N.A." || !t.endDate) return false;
  const due = new Date(t.endDate);
  return !isNaN(due.getTime()) && due < new Date(new Date().toDateString());
}

export function fmt(d?: string): string {
  if (!d) return "No date";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? "No date" : dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";
}

export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const idx = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR.length;
  return (
    <span className="inline-flex items-center justify-center shrink-0 font-semibold text-white"
      style={{ width: size, height: size, borderRadius: size / 2, background: AVATAR[idx], fontSize: size * 0.38 }} aria-hidden="true">
      {initials(name)}
    </span>
  );
}

export function StatusPill({ status }: { status?: string }) {
  const s = normStatus(status);
  const c = STATUS_COLOR[s];
  return <span className="pill" style={{ color: c, background: c + "1a" }}>{s}</span>;
}

/* ---------------- shell ---------------- */

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/progress", label: "Status", icon: BarChart3 },
  { href: "/admin/task-assigner", label: "Assigner", icon: ClipboardList },
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/submit-report", label: "Reports", icon: FileText },
];

export function AppShell({ children, outside }: { children: ReactNode; outside?: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ name?: string; employeeId?: string } | null>(null);

  useEffect(() => {
    try { setUser(JSON.parse(localStorage.getItem("currentUser") || "null")); } catch { /* ignore */ }
  }, []);

  async function logout() {
    try { await fetch("/api/admin/logout", { method: "POST" }); } catch {}
    stampLastSeen();
    try { sessionStorage.setItem("adminFlash", "loggedout"); } catch {}
    try { localStorage.removeItem("currentUser"); } catch {}
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="ui">
      <style>{css}</style>
      <header className="top">
        <div className="top-in">
          <Link href="/admin" className="brand">
            <span className="mark"><Bot size={20} /></span>
            Malus Robotics
          </Link>

          <nav className="nav" aria-label="Admin navigation">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className={pathname === href ? "on" : ""} aria-current={pathname === href ? "page" : undefined}>
                <Icon size={17} /> {label}
              </Link>
            ))}
          </nav>

          <div className="top-right">
            <AlertCenter />
            <span className="who">
              <Avatar name={user?.name || "Admin"} size={34} />
              <span className="who-t">
                <b>{user?.name || "Admin"}</b>
                <small>{user?.employeeId || "Administrator"}</small>
              </span>
            </span>
            <button className="btn ghost sm" onClick={logout}><LogOut size={16} /> Log out</button>
          </div>
        </div>
      </header>
      <div className="page">{children}</div>
      {outside}
    </div>
  );
}

/* ---------------- stylesheet ---------------- */

const css = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
.ui{--ink:#1b1b2f;--muted:#5f6178;--line:#e6e7ef;--bg:#f6f7fb;--card:#fff;--primary:#4b44b3;--primary-d:#3b3597;--soft:#eef0f8;
  font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:var(--bg);color:var(--ink);min-height:100vh;-webkit-font-smoothing:antialiased}
.ui *{box-sizing:border-box}
.ui a{color:inherit;text-decoration:none}
.ui .muted{color:var(--muted)}
.ui .top{background:#fff;border-bottom:1px solid var(--line);position:sticky;top:0;z-index:30}
.ui .top-in{max-width:1280px;margin:0 auto;padding:0 24px;display:flex;align-items:center;gap:20px;min-height:68px;flex-wrap:wrap}
.ui .brand{display:flex;align-items:center;gap:12px;font-weight:700;font-size:17px;letter-spacing:-.01em;white-space:nowrap}
.ui .mark{display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:10px;background:var(--primary);color:#fff}
.ui .nav{display:flex;gap:4px;flex:1;overflow-x:auto}
.ui .nav a{display:inline-flex;align-items:center;gap:8px;padding:9px 14px;border-radius:10px;font-size:14px;font-weight:600;color:var(--muted);white-space:nowrap;transition:background-color .2s ease,color .2s ease}
.ui .nav a:hover{background:var(--soft);color:var(--ink)}
.ui .nav a.on{background:var(--soft);color:var(--primary)}
.ui .top-right{display:flex;align-items:center;gap:12px}
.ui .who{display:flex;align-items:center;gap:10px}
.ui .who-t{display:flex;flex-direction:column;line-height:1.2}
.ui .who-t b{font-size:14px;font-weight:600}
.ui .who-t small{font-size:12px;color:var(--muted)}
@media(max-width:900px){.ui .nav{order:3;flex-basis:100%;padding-bottom:10px}}
@media(max-width:640px){.ui .who-t{display:none}.ui .top-in{padding:0 16px}}

.ui .page{max-width:1280px;margin:0 auto;padding:32px 24px 72px;animation:uifade .4s ease both}
@media(max-width:640px){.ui .page{padding:24px 16px 56px}}
.ui .head{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:24px}
.ui h1{font-size:clamp(26px,3.4vw,34px);font-weight:800;letter-spacing:-.025em;line-height:1.15}
.ui .head p{color:var(--muted);font-size:16px;margin-top:6px}
.ui h2{font-size:18px;font-weight:700;letter-spacing:-.01em}
.ui .card{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:22px;box-shadow:0 1px 2px rgba(30,30,80,.03)}
.ui .card-h{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:16px}
.ui .sub{font-size:14px;color:var(--muted);margin-top:2px}

.ui .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border-radius:11px;padding:10px 18px;font:600 14px 'Plus Jakarta Sans',sans-serif;border:1px solid transparent;cursor:pointer;transition:background-color .2s ease,box-shadow .2s ease,transform .2s ease,border-color .2s ease;white-space:nowrap}
.ui .btn.primary{background:var(--primary);color:#fff;box-shadow:0 1px 2px rgba(59,53,151,.3)}
.ui .btn.primary:hover:not(:disabled){background:var(--primary-d);box-shadow:0 6px 16px rgba(75,68,179,.22);transform:translateY(-1px)}
.ui .btn.ghost{background:#fff;border-color:var(--line);color:var(--ink)}
.ui .btn.ghost:hover:not(:disabled){background:var(--soft)}
.ui .btn.sm{padding:8px 14px}
.ui .btn:disabled{opacity:.55;cursor:not-allowed}
.ui .btn.block{width:100%;padding:14px 18px;font-size:15px}
.ui button:focus-visible,.ui a:focus-visible,.ui summary:focus-visible,.ui select:focus-visible{outline:3px solid #b9b4f5;outline-offset:2px}
.ui .chip{border:1px solid var(--line);background:#fff;color:var(--ink);border-radius:999px;padding:7px 15px;font:600 13px 'Plus Jakarta Sans',sans-serif;cursor:pointer;transition:background-color .2s ease,border-color .2s ease,color .2s ease}
.ui .chip:hover{background:var(--soft)}
.ui .chip.on{background:var(--primary);border-color:var(--primary);color:#fff}
.ui .inp{width:100%;background:#fff;color:var(--ink);border:1px solid var(--line);border-radius:11px;padding:11px 13px;font:500 14px 'Plus Jakarta Sans',sans-serif;transition:border-color .2s ease,box-shadow .2s ease}
.ui .inp:hover{border-color:#cfd0df}
.ui .inp:focus{outline:none;border-color:var(--primary);box-shadow:0 0 0 4px rgba(75,68,179,.12)}
.ui .lbl{display:block;font-size:13px;font-weight:600;margin-bottom:6px}
.ui .pill{display:inline-block;font-size:12px;font-weight:600;padding:4px 11px;border-radius:999px;white-space:nowrap}

.ui .kpis{display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));margin-bottom:24px}
.ui .kpi{text-align:left;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:18px;cursor:pointer;font:inherit;color:inherit;transition:border-color .2s ease,box-shadow .2s ease,transform .2s ease}
.ui .kpi:hover{transform:translateY(-2px);box-shadow:0 10px 24px rgba(30,30,80,.07)}
.ui .kpi.on{border-color:var(--kc);box-shadow:0 0 0 3px color-mix(in srgb,var(--kc) 18%,transparent)}
.ui .kpi .kl{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;color:var(--muted)}
.ui .kpi .kd{width:9px;height:9px;border-radius:50%;background:var(--kc)}
.ui .kpi .kn{font-size:32px;font-weight:700;letter-spacing:-.02em;line-height:1.1;margin-top:10px}
.ui .kpi small{font-size:12px;color:var(--muted)}
.ui .cols{display:grid;gap:20px;align-items:start}
@media(min-width:1100px){.ui .cols{grid-template-columns:minmax(0,1fr) 340px}}
.ui .stack{display:grid;gap:20px;min-width:0}

.ui .thead,.ui .trow{display:grid;grid-template-columns:var(--cols);gap:14px;align-items:center;padding:12px 14px}
.ui .thead{font-size:13px;font-weight:600;color:var(--muted);border-bottom:1px solid var(--line)}
.ui .trow{width:100%;border:0;border-bottom:1px solid var(--line);background:none;font:inherit;color:inherit;text-align:left;cursor:pointer;transition:background-color .15s ease}
.ui .trow:hover{background:#f9faff}
.ui .trow:last-child{border-bottom:0}
.ui .empty{padding:32px 16px;text-align:center;color:var(--muted);background:var(--bg);border-radius:12px;font-size:14px}
.ui .row{display:flex;align-items:center;gap:12px;width:100%;padding:10px;border-radius:12px;border:0;background:none;color:inherit;font:inherit;text-align:left;cursor:pointer;transition:background-color .15s ease}
.ui .row:hover,.ui .row.on{background:var(--soft)}
.ui .count{font-size:12px;font-weight:700;color:var(--primary);background:var(--soft);border-radius:999px;padding:3px 10px}
.ui .pb{display:block;height:7px;border-radius:99px;background:var(--soft);overflow:hidden;flex:1;min-width:50px}
.ui .pb>i{display:block;height:100%;border-radius:99px;background:var(--primary);transition:width .8s cubic-bezier(.2,.8,.2,1)}
.ui .feed{padding:12px 0;border-bottom:1px solid var(--line);font-size:14px}
.ui .feed:last-child{border-bottom:0;padding-bottom:0}
.ui details>summary{list-style:none;cursor:pointer}
.ui details>summary::-webkit-details-marker{display:none}
.ui details[open] .chev{transform:rotate(90deg)}
.ui .chev{transition:transform .2s ease;display:inline-flex;color:var(--primary)}
.ui .scrim{animation:uifade .2s ease both}
.ui .drawer{animation:uislide .25s cubic-bezier(.2,.8,.2,1) both}
@keyframes uifade{from{opacity:0}to{opacity:1}}
@keyframes uislide{from{transform:translateX(40px);opacity:0}to{transform:none;opacity:1}}
@media (prefers-reduced-motion:reduce){.ui *{animation:none!important;transition:none!important}}
`;