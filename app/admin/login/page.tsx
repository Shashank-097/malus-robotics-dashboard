"use client";

// PM TOOL REPO — src/app/admin/login/page.tsx
// Light, flat login. Same auth flow as before (POST /api/admin/login, flash message, redirect to /admin).

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, ArrowRight, Bot, CheckCircle2, Eye, EyeOff, Loader2, Lock, ShieldCheck, User,
} from "lucide-react";

const css = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
.lg{--ink:#1b1b2f;--muted:#5f6178;--line:#e1e2ec;--bg:#f6f7fb;--card:#fff;--primary:#4b44b3;--primary-d:#3b3597;--soft:#eef0f8;
  background:var(--bg);color:var(--ink);font-family:'Plus Jakarta Sans',system-ui,sans-serif;min-height:100vh;-webkit-font-smoothing:antialiased}
.lg *{box-sizing:border-box}
.lg a{color:inherit;text-decoration:none}
.lg .shell{min-height:100vh;display:grid}
@media(min-width:960px){.lg .shell{grid-template-columns:1fr 1fr}}
.lg .side{display:none;background:#fff;border-right:1px solid var(--line);padding:48px 56px;flex-direction:column;justify-content:space-between}
@media(min-width:960px){.lg .side{display:flex}}
.lg .brand{display:flex;align-items:center;gap:12px;font-weight:700;font-size:18px;letter-spacing:-.01em}
.lg .mark{display:inline-flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:11px;background:var(--primary);color:#fff}
.lg .side h2{font-size:clamp(30px,3.2vw,40px);line-height:1.12;letter-spacing:-.03em;font-weight:800;margin-bottom:14px}
.lg .side p.lead{font-size:17px;line-height:1.65;color:var(--muted);max-width:420px}
.lg .points{margin-top:28px;display:grid;gap:14px;font-size:15px;color:var(--muted);font-weight:500}
.lg .points span{display:flex;align-items:center;gap:10px}
.lg .points svg{color:#1fa86a;flex-shrink:0}
.lg .main{display:flex;flex-direction:column;justify-content:center;align-items:center;padding:32px 20px}
.lg .back{display:inline-flex;align-items:center;gap:8px;font-size:14px;font-weight:600;color:var(--muted);margin-bottom:20px;align-self:flex-start;max-width:420px;width:100%}
.lg .back:hover{color:var(--ink)}
.lg .wrapcol{width:100%;max-width:420px}
.lg .card{background:var(--card);border:1px solid var(--line);border-radius:20px;box-shadow:0 20px 50px rgba(40,40,100,.07);padding:36px 32px}
@media(max-width:480px){.lg .card{padding:28px 20px}}
.lg .icon{display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;border-radius:14px;background:var(--soft);color:var(--primary)}
.lg h1{font-size:26px;font-weight:800;letter-spacing:-.02em;margin:16px 0 6px}
.lg .sub{font-size:15px;color:var(--muted);line-height:1.5}
.lg label{display:block;font-size:14px;font-weight:600;margin-bottom:7px}
.lg .field{position:relative}
.lg .field .lead-i{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:#8b8da3;pointer-events:none}
.lg .input{width:100%;height:50px;border-radius:12px;border:1px solid var(--line);background:#fff;color:var(--ink);padding:0 14px 0 42px;font:500 15px 'Plus Jakarta Sans',sans-serif;transition:border-color .2s ease,box-shadow .2s ease}
.lg .input::placeholder{color:#a3a5b8}
.lg .input:hover{border-color:#cfd0df}
.lg .input:focus{outline:none;border-color:var(--primary);box-shadow:0 0 0 4px rgba(75,68,179,.12)}
.lg .eye{position:absolute;right:6px;top:50%;transform:translateY(-50%);width:38px;height:38px;border:0;background:none;border-radius:9px;color:#8b8da3;cursor:pointer;display:inline-flex;align-items:center;justify-content:center}
.lg .eye:hover{background:var(--soft);color:var(--ink)}
.lg .btn{width:100%;height:50px;border:0;border-radius:12px;background:var(--primary);color:#fff;font:600 16px 'Plus Jakarta Sans',sans-serif;display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;transition:background-color .2s ease,box-shadow .2s ease,transform .2s ease}
.lg .btn:hover:not(:disabled){background:var(--primary-d);box-shadow:0 8px 18px rgba(75,68,179,.25);transform:translateY(-1px)}
.lg .btn:disabled{opacity:.55;cursor:not-allowed}
.lg .btn.ok{background:#1fa86a;opacity:1}
.lg .err{background:#fdecec;color:#b42318;border:1px solid #f7cfcf;border-radius:12px;padding:11px 14px;font-size:14px;font-weight:500}
.lg .flash{display:flex;align-items:center;gap:8px;background:#e8f7ee;color:#14795f;border:1px solid #c9ebd6;border-radius:12px;padding:11px 14px;font-size:14px;font-weight:500;margin-bottom:18px}
.lg .foot{margin-top:18px;text-align:center;font-size:13px;color:var(--muted)}
.lg button:focus-visible,.lg a:focus-visible{outline:3px solid #b9b4f5;outline-offset:2px}
.lg .shake{animation:lgshake .4s ease}
@keyframes lgshake{0%,100%{transform:none}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}
@media (prefers-reduced-motion:reduce){.lg *{animation:none!important;transition:none!important}}
`;

export default function AdminLoginPage() {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [shakeKey, setShakeKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [flash, setFlash] = useState("");

  // Message left behind by the logout button on the dashboard.
  useEffect(() => {
    try {
      if (sessionStorage.getItem("adminFlash") === "loggedout") {
        setFlash("You have been logged out safely.");
        sessionStorage.removeItem("adminFlash");
      }
    } catch {}
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading || done) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: employeeId.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        try {
          localStorage.setItem("currentUser", JSON.stringify(data.user));
          sessionStorage.setItem("adminJustLoggedIn", "1");
        } catch {}
        setDone(true);
        setLoading(false);
        setTimeout(() => {
          router.push("/admin");
          router.refresh();
        }, 600);
        return;
      }

      setError(data.error || "Login failed. Please try again.");
      setShakeKey((k) => k + 1);
    } catch {
      setError("Network error. Please try again.");
      setShakeKey((k) => k + 1);
    }
    setLoading(false);
  }

  return (
    <main className="lg">
      <style>{css}</style>
      <div className="shell">
        {/* Brand panel (desktop) */}
        <aside className="side">
          <Link href="/" className="brand">
            <span className="mark"><Bot size={21} /></span>
            Malus Robotics
          </Link>
          <div>
            <h2>Welcome back.</h2>
            <p className="lead">
              Sign in to review project status, upload progress sheets and keep every team on track.
            </p>
            <div className="points">
              <span><CheckCircle2 size={18} /> Live project and task status</span>
              <span><CheckCircle2 size={18} /> Excel sheet uploads and daily reports</span>
              <span><CheckCircle2 size={18} /> Task assignment synced to the Employee Portal</span>
            </div>
          </div>
          <span style={{ fontSize: 13, color: "var(--muted)" }}>© {new Date().getFullYear()} Malus Robotics</span>
        </aside>

        {/* Form */}
        <section className="main">
          <div className="wrapcol">
            <Link href="/" className="back"><ArrowLeft size={16} /> Back to home</Link>

            <div className="card">
              <div key={shakeKey} className={shakeKey ? "shake" : ""}>
                <span className="icon"><ShieldCheck size={24} /></span>
                <h1>Admin login</h1>
                <p className="sub">Sign in with your employee ID and password.</p>

                <div style={{ height: 24 }} />

                {flash && (
                  <p role="status" className="flash"><CheckCircle2 size={16} /> {flash}</p>
                )}

                <form onSubmit={handleSubmit} noValidate style={{ display: "grid", gap: 18 }}>
                  <div>
                    <label htmlFor="employeeId">Employee ID</label>
                    <div className="field">
                      <User size={18} className="lead-i" />
                      <input
                        id="employeeId" className="input" type="text" autoComplete="username" autoFocus required
                        value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} placeholder="MRPL-2026-0000"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="password">Password</label>
                    <div className="field">
                      <Lock size={18} className="lead-i" />
                      <input
                        id="password" className="input" type={showPassword ? "text" : "password"} autoComplete="current-password" required
                        value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password"
                        style={{ paddingRight: 50 }}
                      />
                      <button type="button" className="eye" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Hide password" : "Show password"}>
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {error && <p role="alert" className="err">{error}</p>}

                  <button type="submit" className={`btn ${done ? "ok" : ""}`} disabled={loading || done || !employeeId || !password}>
                    {done ? (<><CheckCircle2 size={18} /> Access granted</>)
                      : loading ? (<><Loader2 size={18} className="animate-spin" /> Signing in…</>)
                      : (<>Sign in <ArrowRight size={18} /></>)}
                  </button>
                </form>
              </div>
            </div>

            <p className="foot">Access is restricted to authorised administrators.</p>
          </div>
        </section>
      </div>
    </main>
  );
}