"use client";

// PM TOOL REPO — src/components/fieldex.tsx
// Shared theme + building blocks used by /admin and /admin/task-assigner.

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/* ---------------- tokens & helpers ---------------- */

export type Theme = "light" | "dark";
export type StatusName = "Open" | "In Process" | "Hold" | "Closed" | "N.A.";

export const PENDING: StatusName[] = ["Open", "In Process", "Hold"];
export const STATUS_COLOR: Record<string, string> = {
  Open: "#7a52f0", "In Process": "#f2693c", Hold: "#d49a00", Closed: "#1fa86a", "N.A.": "#8a8ca5",
};
export const PRIORITY_COLOR: Record<string, string> = {
  Low: "#8a8ca5", Medium: "#7a52f0", High: "#f2693c", Critical: "#e5484d",
};
export const PALETTE = ["#9b5cf0", "#f08a24", "#4a8cf0", "#e8b020", "#2fb36b", "#e5484d"];
const AVATAR = ["#9b5cf0", "#f08a24", "#4a8cf0", "#2fb36b", "#e8b020", "#e5484d"];

export const stagger = (i: number) => ({ "--i": i }) as CSSProperties;

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

export function relTime(d?: string): string {
  if (!d) return "";
  const t = new Date(d).getTime();
  if (isNaN(t)) return "";
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h} h ago` : fmt(d);
}

export function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";
}

export function useTheme(): [Theme, (t: Theme) => void] {
  const [theme, setTheme] = useState<Theme>("light");
  useEffect(() => {
    try {
      const t = localStorage.getItem("pm-theme");
      if (t === "dark" || t === "light") setTheme(t);
    } catch { /* ignore */ }
  }, []);
  const set = (t: Theme) => {
    setTheme(t);
    try { localStorage.setItem("pm-theme", t); } catch { /* ignore */ }
  };
  return [theme, set];
}

function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setM(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return m;
}

function useCountUp(to: number) {
  const [v, setV] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    const start = from.current;
    if (start === to || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setV(to); from.current = to; return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / 800);
      const val = Math.round(start + (to - start) * (1 - Math.pow(1 - p, 3)));
      setV(val); from.current = val;
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return v;
}

/* ---------------- icons ---------------- */

const ICONS: Record<string, string> = {
  overview: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
  chart: "M3 3v18h18M7 15l4-4 3 3 5-6",
  clipboard: "M9 4h6v3H9zM7 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1M8 12h8M8 16h5",
  upload: "M12 16V4M7 9l5-5 5 5M4 20h16",
  file: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h6",
  users: "M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0zM4 21a8 8 0 0 1 16 0",
  userplus: "M15 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0zM3 21a7 7 0 0 1 14 0M19 8v6M16 11h6",
  save: "M5 4h11l3 3v13H5zM8 4v6h8V4M8 20v-6h8v6",
  history: "M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 2",
  moon: "M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z",
  sun: "M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4",
  logout: "M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4M16 8l4 4-4 4M20 12H9",
  plus: "M12 5v14M5 12h14",
  search: "M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16zM21 21l-4.3-4.3",
  refresh: "M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7",
  check: "M5 13l4 4L19 7",
  close: "M6 6l12 12M18 6L6 18",
  pause: "M9 5v14M15 5v14",
  clock: "M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
  list: "M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01",
  chevron: "M9 6l6 6-6 6",
  pin: "M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11zM12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  arrow: "M5 12h14M13 6l6 6-6 6",
};

export function Icon({ name, size = 20 }: { name: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  );
}

export function Avatar({ name, size = 44, tile = false }: { name: string; size?: number; tile?: boolean }) {
  const idx = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR.length;
  return (
    <span
      className="inline-flex items-center justify-center shrink-0 font-semibold text-white"
      style={{
        width: size, height: size, borderRadius: tile ? size / 3 : size / 2, fontSize: size * 0.36,
        background: tile ? `linear-gradient(135deg, ${AVATAR[idx]}, ${AVATAR[idx]}aa)` : AVATAR[idx],
      }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}

function Logo() {
  return (
    <span className="inline-flex items-center gap-3">
      <svg width="46" height="46" viewBox="0 0 48 48" aria-hidden="true">
        <path d="M26 3C12 6 5 21 11 36c4 8 14 11 23 6 9-5 12-22-8-39z" fill="#a9d22b" />
        <path d="M24 8c-7 10-8 22 2 36" fill="none" stroke="#6f9a14" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M17 14c-3 8-2 17 5 27" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span className="text-[26px] font-medium tracking-tight">Malus</span>
    </span>
  );
}

/* ---------------- shell + top bar ---------------- */

const NAV = [
  { href: "/admin", label: "Overview", icon: "overview" },
  { href: "/admin/progress", label: "Status", icon: "chart" },
  { href: "/admin/task-assigner", label: "Assigner", icon: "clipboard" },
  { href: "/upload", label: "Upload", icon: "upload" },
  { href: "/submit-report", label: "Reports", icon: "file" },
];

export function TopBar({ user, theme, setTheme, onLogout }: {
  user: { name?: string; employeeId?: string } | null;
  theme: Theme; setTheme: (t: Theme) => void; onLogout?: () => void;
}) {
  const pathname = usePathname();
  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <Logo />
      <nav aria-label="Admin navigation" className="flex items-center gap-3 order-3 w-full overflow-x-auto py-1 lg:order-none lg:w-auto">
        {NAV.map((n) => {
          const on = pathname === n.href;
          return (
            <Link key={n.href} href={n.href} title={n.label} aria-label={n.label} aria-current={on ? "page" : undefined} className={`navc ${on ? "on" : ""}`}>
              <Icon name={n.icon} size={22} />
              {on && <span className="text-[16px] font-medium">{n.label}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-3 mr-2">
          <Avatar name={user?.name || "Admin"} size={48} />
          <div className="leading-tight">
            <div className="text-[17px] font-medium">{user?.name || "Admin"}</div>
            <div className="text-[13px]" style={{ color: "var(--muted)" }}>{user?.employeeId || "Project manager"}</div>
          </div>
        </div>
        {onLogout && (
          <button className="round" onClick={onLogout} aria-label="Log out" title="Log out"><Icon name="logout" size={20} /></button>
        )}
        <div className="seg" role="group" aria-label="Theme">
          <button className={theme === "dark" ? "on" : ""} aria-pressed={theme === "dark"} onClick={() => setTheme("dark")} aria-label="Dark theme"><Icon name="moon" size={20} /></button>
          <button className={theme === "light" ? "on" : ""} aria-pressed={theme === "light"} onClick={() => setTheme("light")} aria-label="Light theme"><Icon name="sun" size={20} /></button>
        </div>
      </div>
    </header>
  );
}

export function FxRoot({ theme, children, outside }: { theme: Theme; children: ReactNode; outside?: ReactNode }) {
  return (
    <div className="fx" data-theme={theme}>
      <style>{css}</style>
      <div className="shell">{children}</div>
      {outside}
    </div>
  );
}

/* ---------------- building blocks ---------------- */

export function Stat({ label, value, badge, tone }: { label: string; value: number; badge?: string; tone: "purple" | "lime" | "navy" | "coral" }) {
  const n = useCountUp(value);
  return (
    <div className="stat">
      <div className="text-[15px]" style={{ color: "var(--muted)" }}>{label}</div>
      <div className="flex items-center gap-2 mt-1">
        <span className="stat-n">{n}</span>
        {badge && <span className={`badge ${tone}`}>{badge}</span>}
      </div>
    </div>
  );
}

export function StatusPill({ status }: { status?: string }) {
  const s = normStatus(status);
  const c = STATUS_COLOR[s];
  return <span className="spill" style={{ color: c, background: c + "1f" }}>{s}</span>;
}

export function Tabs({ items, value, onChange }: { items: { key: string; label: string }[]; value: string; onChange: (k: string) => void }) {
  return (
    <div className="tabs" role="tablist">
      {items.map((i) => (
        <button key={i.key} role="tab" aria-selected={value === i.key} className={`tab ${value === i.key ? "on" : ""}`} onClick={() => onChange(i.key)}>{i.label}</button>
      ))}
    </div>
  );
}

export function Bar({ pct }: { pct: number }) {
  const m = useMounted();
  return (
    <span className="pb" role="progressbar" aria-valuenow={Math.max(0, pct)} aria-valuemin={0} aria-valuemax={100}>
      <i style={{ width: `${m ? Math.max(0, pct) : 0}%` }} />
    </span>
  );
}

export function BarChart({ data, avg, activeKey, onSelect }: {
  data: { key: string; label: string; pct: number; title?: string }[];
  avg?: number; activeKey?: string; onSelect?: (key: string) => void;
}) {
  const m = useMounted();
  const top = data.length ? Math.max(...data.map((d) => d.pct)) : 0;
  const hi = activeKey || (top > 0 ? data.find((d) => d.pct === top)?.key : undefined);
  return (
    <div>
      <div className="plot">
        {[100, 80, 60, 40, 20, 0].map((g) => (
          <div key={g} className="gl" style={{ bottom: `${g}%` }}><span>{g}</span></div>
        ))}
        {avg !== undefined && avg > 0 && <div className="avg" style={{ bottom: `${avg}%` }} aria-hidden="true" />}
        <div className="bars">
          {data.map((d) => {
            const Tag = onSelect ? "button" : "div";
            return (
              <Tag key={d.key} className="col" title={d.title} onClick={onSelect ? () => onSelect(d.key) : undefined}
                {...(onSelect ? { type: "button" as const, "aria-pressed": hi === d.key } : {})}>
                <span className="bar" style={{ height: `${m ? Math.max(d.pct, 4) : 0}%` }}>
                  <span className={`bpill ${hi === d.key ? "hi" : ""}`}>{d.pct}%</span>
                </span>
              </Tag>
            );
          })}
        </div>
      </div>
      <div className="xl">{data.map((d) => <span key={d.key}>{d.label}</span>)}</div>
    </div>
  );
}

export function Donut({ data, onSelect }: { data: { name: string; value: number; color: string }[]; onSelect?: (name: string) => void }) {
  const m = useMounted();
  const [hover, setHover] = useState<string | null>(null);
  const total = data.reduce((a, d) => a + d.value, 0);
  const C = 2 * Math.PI * 70;
  let cum = 0;
  const cur = data.find((d) => d.name === hover);
  return (
    <div className="flex items-center gap-5 flex-wrap">
      <svg width="190" height="190" viewBox="0 0 200 200" role="img" aria-label="Status mix">
        <circle cx="100" cy="100" r="70" fill="none" stroke="var(--soft)" strokeWidth="34" />
        {total > 0 && data.map((d) => {
          const len = (d.value / total) * C;
          const seg = Math.max(0, len - (data.length > 1 ? 3 : 0));
          const off = -cum;
          cum += len;
          return (
            <circle key={d.name} cx="100" cy="100" r="70" fill="none" stroke={d.color}
              strokeWidth={hover === d.name ? 40 : 34} strokeDasharray={`${m ? seg : 0} ${C}`} strokeDashoffset={off}
              transform="rotate(-90 100 100)" style={{ transition: "stroke-dasharray .9s cubic-bezier(.2,.8,.2,1), stroke-width .2s", cursor: "pointer" }}
              onMouseEnter={() => setHover(d.name)} onMouseLeave={() => setHover(null)} onClick={() => onSelect?.(d.name)} />
          );
        })}
        <text x="100" y="98" textAnchor="middle" fontSize="30" fontWeight="300" fill="var(--ink)" fontFamily="Urbanist,sans-serif">{cur ? cur.value : total}</text>
        <text x="100" y="120" textAnchor="middle" fontSize="12" fill="var(--muted)" fontFamily="Urbanist,sans-serif">{cur ? cur.name : "total"}</text>
      </svg>
      <ul className="grid gap-2 text-[14px] min-w-[130px]">
        {data.map((d) => (
          <li key={d.name}>
            <button type="button" className="legend" onMouseEnter={() => setHover(d.name)} onMouseLeave={() => setHover(null)} onClick={() => onSelect?.(d.name)}>
              <span style={{ width: 10, height: 10, borderRadius: 5, background: d.color }} />
              <span className="flex-1 text-left">{d.name}</span>
              <span className="font-medium">{d.value}</span>
            </button>
          </li>
        ))}
        {data.length === 0 && <li style={{ color: "var(--muted)" }}>No data yet</li>}
      </ul>
    </div>
  );
}

/* ---------------- stylesheet ---------------- */

const css = `
@import url('https://fonts.googleapis.com/css2?family=Urbanist:wght@300;400;500;600;700&display=swap');
.fx{--page:#b9b6d1;--shell:#ebebf0;--card:#fff;--act:rgba(255,255,255,.62);--soft:#f2f2f7;--ink:#15151f;--muted:#6f6f82;--line:#e4e4ec;
  --purple:#a14dff;--lime:#b7e229;--navy:#1a1640;--coral:#f4623a;--ok:#e8f7ee;--ok-ink:#1b8a52;
  --bar-a:#dcc1ff;--bar-b:#f3eaff;--tab-bg:#1a1640;--tab-ink:#fff;--shadow:0 1px 0 rgba(255,255,255,.9) inset,0 12px 32px rgba(60,50,120,.07);
  background:var(--page);color:var(--ink);font-family:Urbanist,system-ui,sans-serif;min-height:100vh;padding:clamp(10px,3vw,48px);
  transition:background-color .35s ease,color .35s ease}
.fx[data-theme=dark]{--page:#0b0a13;--shell:#14131e;--card:#1d1c2a;--act:rgba(255,255,255,.04);--soft:#262536;--ink:#f1f0fa;--muted:#9c9bb2;--line:#2d2c3f;
  --bar-a:#6a43b0;--bar-b:#2e2447;--ok:#13301f;--ok-ink:#5fd392;--tab-bg:#7a52f0;--tab-ink:#fff;--shadow:0 12px 32px rgba(0,0,0,.35)}
.fx *{box-sizing:border-box}
.fx .shell{max-width:1400px;margin:0 auto;background:var(--shell);border-radius:clamp(26px,4vw,48px);padding:clamp(18px,3vw,40px);transition:background-color .35s ease;animation:fxin .5s ease both}
.fx .card,.fx .act,.fx .navc,.fx .round,.fx .seg,.fx .tabs,.fx .inp,.fx .chip,.fx .spill{transition:background-color .35s ease,border-color .25s ease,color .25s ease,box-shadow .25s ease,transform .25s ease}
.fx .card{background:var(--card);border-radius:28px;padding:clamp(18px,2vw,28px);box-shadow:var(--shadow);animation:fxrise .55s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--i,0)*55ms + 120ms);min-width:0}
.fx .card h2{font-size:26px;font-weight:500;letter-spacing:-.01em;line-height:1.15}
.fx .sub{color:var(--muted);font-size:15px;margin-top:2px}
.fx .rule{border:0;border-top:1px solid var(--line);margin:18px 0}
.fx .muted{color:var(--muted)}
.fx .eyebrow{font-size:17px;color:var(--muted);text-transform:uppercase;letter-spacing:.01em}
.fx .greet{font-size:clamp(34px,5vw,56px);font-weight:300;letter-spacing:-.025em;line-height:1.05;margin:10px 0 12px}
.fx .stat-n{font-size:clamp(38px,4.4vw,58px);font-weight:300;line-height:1;letter-spacing:-.02em}
.fx .badge{font-size:12px;font-weight:500;padding:5px 10px;border-radius:9px;white-space:nowrap}
.fx .badge.purple{background:#7a5cf0;color:#fff}.fx .badge.lime{background:var(--lime);color:#243300}
.fx .badge.navy{background:var(--navy);color:#fff}.fx .badge.coral{background:var(--coral);color:#fff}
.fx[data-theme=dark] .badge.navy{background:#3a3956}
.fx .okpill{display:inline-flex;align-items:center;gap:10px;padding:16px 22px;border-radius:18px;background:var(--ok);color:var(--ok-ink);border:1px solid rgba(31,157,85,.22);font-weight:500;font-size:17px}

.fx .navc{display:inline-flex;align-items:center;justify-content:center;gap:10px;height:54px;min-width:54px;border-radius:999px;border:1px solid var(--line);color:var(--ink);text-decoration:none;flex-shrink:0;background:transparent}
.fx .navc:hover{background:var(--card);transform:translateY(-1px)}
.fx .navc.on{background:var(--card);border-color:transparent;padding:0 24px;box-shadow:var(--shadow)}
.fx .round{display:inline-flex;align-items:center;justify-content:center;width:54px;height:54px;border-radius:50%;border:0;background:var(--card);color:var(--ink);cursor:pointer;box-shadow:var(--shadow)}
.fx .round:hover{transform:translateY(-1px)}
.fx .seg{display:inline-flex;background:var(--card);border-radius:999px;padding:5px;gap:2px;box-shadow:var(--shadow)}
.fx .seg button{width:44px;height:44px;border-radius:50%;border:0;background:none;color:var(--muted);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;transition:background-color .25s ease,color .25s ease}
.fx .seg button.on{background:var(--soft);color:var(--ink)}

.fx .act{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;height:116px;border-radius:22px;background:var(--act);border:1px solid transparent;color:var(--ink);font:500 17px Urbanist,sans-serif;cursor:pointer;text-decoration:none;animation:fxrise .5s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--i,0)*45ms + 80ms)}
.fx .act:hover:not(:disabled){background:var(--card);box-shadow:var(--shadow);transform:translateY(-3px)}
.fx .act.on{background:var(--card);border-color:var(--purple)}
.fx .act:disabled{opacity:.55;cursor:not-allowed}

.fx .inp{width:100%;background:var(--soft);color:var(--ink);border:2px solid transparent;border-radius:14px;padding:12px 14px;font:500 15px Urbanist,sans-serif}
.fx .inp:focus{outline:none;border-color:var(--purple);background:var(--card)}
.fx select.inp{appearance:auto}
.fx .lbl{display:block;font-size:14px;font-weight:600;color:var(--muted);margin-bottom:6px}
.fx .chip{border:1px solid var(--line);background:transparent;color:var(--ink);border-radius:999px;padding:8px 16px;font:500 14px Urbanist,sans-serif;cursor:pointer}
.fx .chip:hover{background:var(--soft)}
.fx .chip.on{background:var(--tab-bg);color:var(--tab-ink);border-color:transparent}
.fx .cta{border:0;border-radius:16px;background:var(--tab-bg);color:var(--tab-ink);font:600 17px Urbanist,sans-serif;padding:16px 18px;cursor:pointer;width:100%;display:flex;align-items:center;justify-content:center;gap:8px;transition:filter .2s ease,transform .2s ease}
.fx .cta:hover:not(:disabled){filter:brightness(1.15);transform:translateY(-1px)}
.fx .cta:disabled{opacity:.6;cursor:not-allowed}
.fx button:focus-visible,.fx a:focus-visible,.fx summary:focus-visible,.fx select:focus-visible{outline:3px solid var(--purple);outline-offset:2px}

.fx .tabs{display:flex;background:var(--soft);border-radius:20px;padding:6px;gap:4px}
.fx .tab{flex:1;border:0;background:none;padding:12px 8px;border-radius:15px;font:500 16px Urbanist,sans-serif;color:var(--muted);cursor:pointer;transition:background-color .25s ease,color .25s ease}
.fx .tab.on{background:var(--tab-bg);color:var(--tab-ink)}

.fx .spill{display:inline-block;font-size:13px;font-weight:600;padding:5px 12px;border-radius:999px;white-space:nowrap}
.fx .pb{display:block;height:9px;border-radius:99px;background:var(--soft);overflow:hidden;flex:1;min-width:60px}
.fx .pb>i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#d9b6ff,var(--purple));transition:width 1s cubic-bezier(.2,.8,.2,1)}

.fx .plot{position:relative;height:230px;margin-left:36px}
.fx .gl{position:absolute;left:0;right:0;border-top:1px dashed var(--line)}
.fx .gl span{position:absolute;left:-36px;top:-9px;font-size:13px;color:var(--muted);letter-spacing:.08em}
.fx .avg{position:absolute;left:0;right:0;border-top:2px dashed #6a2fc9;z-index:2;pointer-events:none}
.fx .bars{position:absolute;inset:0;display:flex;align-items:flex-end;gap:12px;z-index:1}
.fx .col{flex:1;height:100%;display:flex;align-items:flex-end;border:0;background:none;padding:0;cursor:default;font:inherit;color:inherit;min-width:0}
.fx button.col{cursor:pointer}
.fx .bar{position:relative;display:block;width:100%;border-radius:16px;background:linear-gradient(var(--bar-a),var(--bar-b));transition:height 1s cubic-bezier(.2,.8,.2,1)}
.fx .bpill{position:absolute;top:-15px;left:50%;transform:translateX(-50%);padding:7px 11px;border-radius:12px;font-size:14px;font-weight:500;color:#2a1850;background:linear-gradient(#d8b4ff,#bb90f7);box-shadow:0 6px 14px rgba(150,90,240,.28);transition:background .25s ease}
.fx .bpill.hi{background:var(--lime);color:#243300;box-shadow:0 6px 16px rgba(160,200,20,.4)}
.fx .xl{display:flex;gap:12px;margin:10px 0 0 36px}
.fx .xl span{flex:1;text-align:center;font-size:13px;letter-spacing:.08em;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.fx .legend{display:flex;align-items:center;gap:10px;width:100%;border:0;background:none;color:inherit;font:inherit;padding:4px 6px;border-radius:10px;cursor:pointer}
.fx .legend:hover{background:var(--soft)}

.fx .seg-bar{display:flex;gap:6px}
.fx .seg-bar i{display:block;height:7px;border-radius:99px;transition:flex-grow .9s cubic-bezier(.2,.8,.2,1)}
.fx .row{display:flex;align-items:center;gap:14px;padding:11px 8px;border-radius:16px;border:0;background:none;width:100%;color:inherit;font:inherit;text-align:left;cursor:pointer}
.fx .row:hover,.fx .row.on{background:var(--soft)}

.fx .th,.fx .tr{display:grid;grid-template-columns:var(--cols);gap:14px;align-items:center;padding:14px 10px}
.fx .th{color:var(--muted);font-size:16px;border-bottom:1px solid var(--line)}
.fx .tr{border:0;border-bottom:1px solid var(--line);background:none;width:100%;color:inherit;font:inherit;text-align:left;cursor:pointer;border-radius:0}
.fx .tr:hover,.fx .tr.on{background:var(--soft);border-radius:14px}
.fx .feed{display:flex;gap:14px;padding:15px 4px;border-bottom:1px solid var(--line)}
.fx .feed:last-child{border-bottom:0}
.fx .empty{padding:36px 16px;text-align:center;color:var(--muted);background:var(--soft);border-radius:20px;font-size:15px}
.fx details>summary{list-style:none;cursor:pointer}
.fx details>summary::-webkit-details-marker{display:none}
.fx details[open] .chev{transform:rotate(90deg)}
.fx .chev{transition:transform .2s ease;display:inline-flex}
.fx .drawer{animation:fxslide .28s cubic-bezier(.2,.8,.2,1)}
.fx .scrim{animation:fxfade .25s ease both}
@keyframes fxin{from{opacity:0}to{opacity:1}}
@keyframes fxrise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes fxslide{from{transform:translateX(48px);opacity:0}to{transform:none;opacity:1}}
@keyframes fxfade{from{opacity:0}to{opacity:1}}
@media (prefers-reduced-motion:reduce){.fx *,.fx *::before{animation:none!important;transition:none!important}}
`;