"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Bell, BellRing, CheckCheck, X, Clock, PartyPopper } from "lucide-react";

type Activity = { _id: string; title?: string; description?: string; time?: string };
type Item = Activity & { ts: number };
type ToastItem = { id: string; title: string; body?: string };
type Away = { items: Item[]; fresh: boolean };

const LAST_SEEN = "adminLastSeen"; // set when you log out or mark alerts as read
const JUST_LOGGED_IN = "adminJustLoggedIn"; // set by the login page
const POLL_MS = 30_000;

/** Call on logout so the next login can show "what happened while you were away". */
export function stampLastSeen() {
  try {
    localStorage.setItem(LAST_SEEN, String(Date.now()));
  } catch {}
}

function tsOf(a: Activity): number {
  const t = a.time ? Date.parse(a.time) : NaN;
  if (!isNaN(t)) return t;
  // Fall back to the creation time embedded in a MongoDB ObjectId.
  const n = a._id ? parseInt(a._id.slice(0, 8), 16) : NaN;
  return isNaN(n) ? 0 : n * 1000;
}

function ago(ts: number) {
  if (!ts) return "";
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return new Date(ts).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

// Everything below is rendered in a portal on <body>, so it must not rely on
// the dashboard's scoped (.tk) styles or CSS variables.
const css = `
.al-badge{background:#f2805a;color:#fff;border-radius:999px;font:700 10px Poppins,sans-serif;min-width:18px;height:18px;display:inline-grid;place-items:center;padding:0 5px}
.al-ring{transform-origin:50% 0;animation:alRing 2.6s ease-in-out infinite}
@keyframes alRing{0%,60%,100%{transform:rotate(0)}65%{transform:rotate(14deg)}70%{transform:rotate(-12deg)}75%{transform:rotate(8deg)}80%{transform:rotate(-6deg)}85%{transform:rotate(0)}}
.al-root{font-family:Poppins,system-ui,sans-serif;color:#20203a}
.al-root *{box-sizing:border-box}
.al-panel{position:fixed;width:min(380px,calc(100vw - 24px));z-index:1000;background:#fff;border-radius:22px;box-shadow:0 24px 60px rgba(75,68,179,.3);overflow:hidden;animation:alPop .18s ease-out}
@keyframes alPop{from{opacity:0;transform:translateY(-6px) scale(.98)}to{opacity:1;transform:none}}
.al-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:14px 16px;border-bottom:1px solid #eceef5}
.al-list{max-height:min(380px,60vh);overflow-y:auto;margin:0;padding:0;list-style:none}
.al-row{display:flex;gap:12px;padding:12px 16px;border-bottom:1px solid #f1f2f8}
.al-row.new{background:#f7f6ff}
.al-dot{width:9px;height:9px;border-radius:50%;margin-top:6px;flex:none;background:#d9dbe8}
.al-row.new .al-dot{background:#f2805a}
.al-mini{border:0;background:none;color:#4b44b3;font:600 12px Poppins,sans-serif;cursor:pointer;display:inline-flex;align-items:center;gap:6px;padding:6px 8px;border-radius:10px}
.al-mini:hover:not(:disabled){background:#eceafb}
.al-mini:disabled{opacity:.5;cursor:default}
.al-overlay{position:fixed;inset:0;z-index:1100;background:rgba(32,32,58,.55);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);display:grid;place-items:center;padding:16px;animation:alFade .2s}
@keyframes alFade{from{opacity:0}to{opacity:1}}
.al-modal{width:min(480px,100%);background:#fff;border-radius:28px;overflow:hidden;box-shadow:0 30px 80px rgba(20,16,80,.45);animation:alModal .45s cubic-bezier(.2,.9,.25,1.1)}
@keyframes alModal{from{opacity:0;transform:translateY(30px) scale(.92)}to{opacity:1;transform:none}}
.al-cta{border:0;border-radius:16px;background:#f2805a;color:#fff;font:700 15px Poppins,sans-serif;padding:14px 18px;cursor:pointer;width:100%;box-shadow:0 12px 24px rgba(242,128,90,.45);transition:transform .15s,background .2s}
.al-cta:hover{background:#ee7148;transform:translateY(-2px)}
.al-cta:focus-visible,.al-mini:focus-visible,.al-x:focus-visible{outline:3px solid #f2805a;outline-offset:2px}
.al-toasts{position:fixed;top:16px;right:16px;z-index:1200;display:grid;gap:10px;width:min(340px,calc(100vw - 32px))}
.al-toast{display:flex;gap:12px;align-items:flex-start;background:#fff;border-radius:16px;padding:12px 14px;box-shadow:0 14px 36px rgba(75,68,179,.3);border-left:5px solid #f2805a;animation:alSlide .35s cubic-bezier(.2,.8,.2,1)}
@keyframes alSlide{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:none}}
.al-x{border:0;background:none;cursor:pointer;color:#8a8ca5;border-radius:8px;padding:2px}
@media (prefers-reduced-motion:reduce){.al-ring,.al-panel,.al-modal,.al-toast,.al-overlay{animation:none}}
`;

export default function AlertCenter() {
  const [items, setItems] = useState<Item[]>([]);
  const [unread, setUnread] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);
  const [away, setAway] = useState<Away | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 12 });
  const known = useRef<Set<string> | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  const pushToasts = useCallback((list: ToastItem[]) => {
    if (!list.length) return;
    setToasts((p) => [...p, ...list]);
    window.setTimeout(
      () => setToasts((p) => p.filter((x) => !list.some((y) => y.id === x.id))),
      7000
    );
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/activity", { cache: "no-store" });
      const data = await res.json();
      if (!data.success) return;

      const list: Item[] = (data.activities || [])
        .map((a: Activity) => ({ ...a, ts: tsOf(a) }))
        .sort((a: Item, b: Item) => b.ts - a.ts)
        .slice(0, 30);
      setItems(list);

      if (known.current === null) {
        // First load of this page view.
        known.current = new Set(list.map((i) => i._id));
        let last = 0;
        let justLoggedIn = false;
        try {
          last = Number(localStorage.getItem(LAST_SEEN) || 0);
          justLoggedIn = sessionStorage.getItem(JUST_LOGGED_IN) === "1";
          sessionStorage.removeItem(JUST_LOGGED_IN);
        } catch {}

        // New since last logout; on a first-ever login, treat the latest 5 as new.
        const fresh = last ? list.filter((i) => i.ts > last) : list.slice(0, 5);
        setUnread(new Set(fresh.map((i) => i._id)));

        // Always pop up right after login.
        if (justLoggedIn) {
          setAway({
            items: fresh.length ? fresh : list.slice(0, 5),
            fresh: fresh.length > 0,
          });
        }
      } else {
        // Later polls: anything we haven't seen is a live update.
        const seen = known.current;
        const novel = list.filter((i) => !seen.has(i._id));
        if (novel.length) {
          novel.forEach((i) => seen.add(i._id));
          setUnread((p) => new Set([...p, ...novel.map((i) => i._id)]));
          pushToasts(
            novel.slice(0, 3).map((n) => ({
              id: n._id,
              title: n.title || "New update",
              body: n.description,
            }))
          );
        }
      }
    } catch {
      /* alerts are best-effort */
    }
  }, [pushToasts]);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  // Keep the dropdown glued under the Alerts button.
  const place = useCallback(() => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    setPos({ top: r.bottom + 10, right: Math.max(12, window.innerWidth - r.right) });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, place]);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || btnRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Escape closes the login popup too.
  useEffect(() => {
    if (!away) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && dismissAway();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [away]);

  const markAllRead = () => {
    setUnread(new Set());
    stampLastSeen();
  };

  function dismissAway() {
    setAway(null);
    markAllRead();
  }

  const row = (a: Item, isNew: boolean) => (
    <li key={a._id} className={`al-row ${isNew ? "new" : ""}`}>
      <span className="al-dot" aria-hidden />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{a.title || "Update"}</div>
        {a.description && (
          <div style={{ fontSize: 12, color: "#8a8ca5", marginTop: 2 }}>{a.description}</div>
        )}
        <div style={{ fontSize: 11, color: "#8a8ca5", marginTop: 4, display: "flex", gap: 4, alignItems: "center" }}>
          <Clock size={11} /> {ago(a.ts)}
        </div>
      </div>
    </li>
  );

  return (
    <>
      <style>{css}</style>

      <button
        ref={btnRef}
        className="pill"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`Alerts${unread.size ? `, ${unread.size} unread` : ""}`}
      >
        {unread.size > 0 ? <BellRing size={14} className="al-ring" /> : <Bell size={14} />}
        Alerts
        {unread.size > 0 && <span className="al-badge">{unread.size > 9 ? "9+" : unread.size}</span>}
      </button>

      {mounted &&
        createPortal(
          <div className="al-root">
            {/* Dropdown list */}
            {open && (
              <div
                ref={panelRef}
                className="al-panel"
                style={{ top: pos.top, right: pos.right }}
                role="region"
                aria-label="Recent alerts"
              >
                <div className="al-head">
                  <span style={{ fontWeight: 600, fontSize: 15 }}>Recent updates</span>
                  <button className="al-mini" onClick={markAllRead} disabled={unread.size === 0}>
                    <CheckCheck size={14} /> Mark all read
                  </button>
                </div>
                {items.length === 0 ? (
                  <p style={{ padding: "28px 16px", textAlign: "center", fontSize: 13, color: "#8a8ca5" }}>
                    No updates yet.
                  </p>
                ) : (
                  <ul className="al-list">{items.map((a) => row(a, unread.has(a._id)))}</ul>
                )}
              </div>
            )}

            {/* Popup shown on every login */}
            {away && (
              <div className="al-overlay" role="dialog" aria-modal="true" aria-labelledby="al-away-title" onClick={dismissAway}>
                <div className="al-modal" onClick={(e) => e.stopPropagation()}>
                  <div
                    style={{
                      padding: "24px 24px 20px",
                      color: "#fff",
                      background: "linear-gradient(160deg,#4b44b3 0%,#3b3597 100%)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {away.items.length ? <BellRing size={22} /> : <PartyPopper size={22} />}
                      <h2 id="al-away-title" style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>
                        {away.fresh ? "While you were away" : away.items.length ? "Latest updates" : "All caught up"}
                      </h2>
                    </div>
                    <p style={{ fontSize: 13, opacity: 0.85, margin: "6px 0 0" }}>
                      {away.fresh
                        ? `${away.items.length} new ${away.items.length === 1 ? "update" : "updates"} since you last logged out.`
                        : away.items.length
                        ? "Nothing new since you logged out. Here is the most recent activity."
                        : "There is no activity to show yet."}
                    </p>
                  </div>

                  {away.items.length > 0 && (
                    <ul className="al-list" style={{ maxHeight: 300 }}>
                      {away.items.slice(0, 8).map((a) => row(a, away.fresh))}
                    </ul>
                  )}
                  {away.items.length > 8 && (
                    <p style={{ fontSize: 12, color: "#8a8ca5", padding: "10px 24px 0", margin: 0 }}>
                      +{away.items.length - 8} more in the Alerts menu.
                    </p>
                  )}

                  <div style={{ padding: 20 }}>
                    <button className="al-cta" onClick={dismissAway} autoFocus>
                      Got it
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Live toasts while you're logged in */}
            <div className="al-toasts" aria-live="polite">
              {toasts.map((t) => (
                <div key={t.id} className="al-toast">
                  <BellRing size={18} style={{ color: "#f2805a", flex: "none", marginTop: 2 }} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{t.title}</div>
                    {t.body && <div style={{ fontSize: 12, color: "#8a8ca5", marginTop: 2 }}>{t.body}</div>}
                  </div>
                  <button
                    className="al-x"
                    onClick={() => setToasts((p) => p.filter((x) => x.id !== t.id))}
                    aria-label="Dismiss"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}