// PM TOOL REPO — src/app/page.tsx
// Light, flat landing page. No 3D, no animation libraries, no dependency on @/components/fx.

import Link from "next/link";
import {
  ArrowRight, Bot, CheckCircle2, ClipboardList, FileText, LayoutDashboard, ShieldCheck, Upload,
} from "lucide-react";

const features = [
  { icon: FileText, title: "Report submission", text: "Submit issue reports and project updates in one structured, consistent format." },
  { icon: Upload, title: "Excel upload", text: "Upload daily project status sheets and store the data securely in MongoDB." },
  { icon: ClipboardList, title: "Task assignment", text: "Assign work to employees by project. Tasks appear on the Employee Portal." },
  { icon: LayoutDashboard, title: "Admin dashboard", text: "Track status, owners, due dates and progress across every project." },
];

const sample = [
  { name: "Riverside Tower", status: "In process", color: "#f2693c", pct: 65 },
  { name: "Metro Line Ext.", status: "Open", color: "#4b44b3", pct: 20 },
  { name: "Harbor Bridge", status: "Closed", color: "#1fa86a", pct: 100 },
];

const css = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
.lp{--ink:#1b1b2f;--muted:#5f6178;--line:#e6e7ef;--bg:#f6f7fb;--card:#fff;--primary:#4b44b3;--primary-d:#3b3597;--soft:#eef0f8;
  background:var(--bg);color:var(--ink);font-family:'Plus Jakarta Sans',system-ui,sans-serif;min-height:100vh;-webkit-font-smoothing:antialiased}
.lp *{box-sizing:border-box}
.lp a{color:inherit;text-decoration:none}
.lp .wrap{max-width:1120px;margin:0 auto;padding:0 24px}
.lp .nav{background:rgba(255,255,255,.9);backdrop-filter:blur(8px);border-bottom:1px solid var(--line);position:sticky;top:0;z-index:20}
.lp .nav .wrap{display:flex;align-items:center;justify-content:space-between;height:68px}
.lp .brand{display:flex;align-items:center;gap:12px;font-weight:700;font-size:18px;letter-spacing:-.01em}
.lp .mark{display:inline-flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:11px;background:var(--primary);color:#fff}
.lp .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border-radius:12px;padding:12px 22px;font-weight:600;font-size:15px;transition:background-color .2s ease,box-shadow .2s ease,transform .2s ease;border:1px solid transparent}
.lp .btn.primary{background:var(--primary);color:#fff;box-shadow:0 1px 2px rgba(59,53,151,.3)}
.lp .btn.primary:hover{background:var(--primary-d);box-shadow:0 6px 16px rgba(75,68,179,.25);transform:translateY(-1px)}
.lp .btn.ghost{background:#fff;border-color:var(--line);color:var(--ink)}
.lp .btn.ghost:hover{background:var(--soft)}
.lp .btn.sm{padding:9px 16px;font-size:14px}
.lp a:focus-visible{outline:3px solid #b9b4f5;outline-offset:2px}
.lp .hero{display:grid;gap:48px;align-items:center;padding:72px 0 64px}
@media(min-width:960px){.lp .hero{grid-template-columns:1.05fr .95fr;padding:96px 0 88px}}
.lp .tag{display:inline-flex;align-items:center;gap:8px;background:#fff;border:1px solid var(--line);border-radius:999px;padding:6px 14px;font-size:13px;font-weight:600;color:var(--primary)}
.lp .dot{width:7px;height:7px;border-radius:50%;background:#1fa86a}
.lp h1{font-size:clamp(34px,5vw,54px);line-height:1.08;letter-spacing:-.03em;font-weight:800;margin:20px 0 18px}
.lp .lead{font-size:18px;line-height:1.65;color:var(--muted);max-width:520px}
.lp .checks{display:flex;flex-wrap:wrap;gap:10px 22px;margin-top:30px;color:var(--muted);font-size:14px;font-weight:500}
.lp .checks span{display:inline-flex;align-items:center;gap:7px}
.lp .checks svg{color:#1fa86a}
.lp .panel{background:var(--card);border:1px solid var(--line);border-radius:20px;box-shadow:0 20px 50px rgba(40,40,100,.08);padding:24px}
.lp .tiles{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:18px 0 22px}
.lp .tile{background:var(--bg);border-radius:14px;padding:14px}
.lp .tile b{display:block;font-size:26px;font-weight:700;letter-spacing:-.02em;line-height:1.1}
.lp .tile span{font-size:12px;color:var(--muted);font-weight:500}
.lp .prow{display:grid;grid-template-columns:1fr auto;gap:8px 12px;align-items:center;padding:12px 0;border-top:1px solid var(--line)}
.lp .pill{font-size:12px;font-weight:600;padding:4px 10px;border-radius:999px}
.lp .bar{grid-column:1/-1;height:7px;border-radius:99px;background:var(--soft);overflow:hidden}
.lp .bar i{display:block;height:100%;border-radius:99px}
.lp .section{padding:8px 0 88px}
.lp .section h2{font-size:clamp(26px,3.4vw,34px);letter-spacing:-.02em;font-weight:800;margin-bottom:10px}
.lp .grid{display:grid;gap:20px;margin-top:36px;grid-template-columns:repeat(auto-fit,minmax(230px,1fr))}
.lp .fcard{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:26px;transition:box-shadow .25s ease,transform .25s ease,border-color .25s ease}
.lp .fcard:hover{box-shadow:0 14px 34px rgba(40,40,100,.08);transform:translateY(-2px);border-color:#d9daea}
.lp .ficon{display:inline-flex;align-items:center;justify-content:center;width:46px;height:46px;border-radius:13px;background:var(--soft);color:var(--primary)}
.lp .fcard h3{font-size:17px;font-weight:700;margin:18px 0 8px;letter-spacing:-.01em}
.lp .fcard p{font-size:15px;line-height:1.6;color:var(--muted)}
.lp .band{background:var(--card);border:1px solid var(--line);border-radius:22px;padding:36px;display:flex;flex-wrap:wrap;gap:20px;align-items:center;justify-content:space-between;margin-bottom:80px}
.lp .band h3{font-size:22px;font-weight:700;letter-spacing:-.02em}
.lp footer{border-top:1px solid var(--line);background:#fff;padding:24px 0;color:var(--muted);font-size:14px}
.lp footer .wrap{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px}
@media (prefers-reduced-motion:reduce){.lp *{transition:none!important}}
`;

export default function HomePage() {
  return (
    <main className="lp">
      <style>{css}</style>

      <header className="nav">
        <div className="wrap">
          <Link href="/" className="brand">
            <span className="mark"><Bot size={21} /></span>
            Malus Robotics
          </Link>
          <Link href="/admin/login" className="btn primary sm">
            <ShieldCheck size={16} /> Admin login
          </Link>
        </div>
      </header>

      <div className="wrap">
        <section className="hero">
          <div>
            <span className="tag"><span className="dot" /> Internal project portal</span>
            <h1>Project progress tracking, made simple.</h1>
            <p className="lead">
              Manage reports, upload Excel progress sheets, assign tasks and monitor daily work
              updates from one secure portal.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 32 }}>
              <Link href="/admin/login" className="btn primary">Admin login <ArrowRight size={18} /></Link>
            </div>
            <p style={{ marginTop: 14, fontSize: 14, color: "var(--muted)" }}>
              Access is restricted to authorised administrators.
            </p>
            <div className="checks">
              <span><CheckCircle2 size={16} /> Secure sessions</span>
              <span><CheckCircle2 size={16} /> Excel to MongoDB</span>
              <span><CheckCircle2 size={16} /> Live dashboard</span>
            </div>
          </div>

          {/* Static, flat preview of the dashboard (sample data) */}
          <div className="panel" aria-label="Dashboard preview with sample data">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <b style={{ fontSize: 18, fontWeight: 700 }}>Project overview</b>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>Sample data</span>
            </div>
            <div className="tiles">
              <div className="tile"><b>12</b><span>Open</span></div>
              <div className="tile"><b>8</b><span>In process</span></div>
              <div className="tile"><b>31</b><span>Closed</span></div>
            </div>
            {sample.map((p) => (
              <div key={p.name} className="prow">
                <span style={{ fontWeight: 600, fontSize: 15 }}>{p.name}</span>
                <span className="pill" style={{ color: p.color, background: p.color + "1a" }}>{p.status}</span>
                <span className="bar"><i style={{ width: `${p.pct}%`, background: p.color }} /></span>
              </div>
            ))}
          </div>
        </section>

        <section className="section" aria-labelledby="features">
          <h2 id="features">Everything your team needs</h2>
          <p style={{ color: "var(--muted)", fontSize: 17 }}>One place for reporting, tracking and assigning work.</p>
          <div className="grid">
            {features.map(({ icon: Icon, title, text }) => (
              <div key={title} className="fcard">
                <span className="ficon"><Icon size={22} /></span>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="band">
          <div>
            <h3>Ready to review today&apos;s progress?</h3>
            <p style={{ color: "var(--muted)", marginTop: 4 }}>Sign in to open the dashboard.</p>
          </div>
          <Link href="/admin/login" className="btn primary">Admin login <ArrowRight size={18} /></Link>
        </div>
      </div>

      <footer>
        <div className="wrap">
          <span>© {new Date().getFullYear()} Malus Robotics. All rights reserved.</span>
          <span>Internal use only</span>
        </div>
      </footer>
    </main>
  );
}