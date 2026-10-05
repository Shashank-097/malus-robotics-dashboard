"use client";

import {
  useEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import {
  Bot,
  FileText,
  Upload,
  LayoutDashboard,
  ShieldCheck,
  BarChart3,
  type LucideIcon,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Shared styles for the home + login pages                           */
/* ------------------------------------------------------------------ */
const css = `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');

.fx{--indigo:#4b44b3;--indigo-d:#3b3597;--orange:#f2805a;--yellow:#f6c344;
  position:relative;min-height:100vh;overflow:hidden;color:#fff;
  font-family:Poppins,system-ui,sans-serif;
  background:
    radial-gradient(1100px 650px at 75% -10%,#3a2f9e 0%,transparent 60%),
    radial-gradient(900px 600px at -10% 110%,#5b2a9a 0%,transparent 55%),
    #0b0b1f}
.fx *{box-sizing:border-box}

/* ---------- background ---------- */
.fx-bg{position:absolute;inset:0;overflow:hidden;pointer-events:none}
.fx-orb{position:absolute;border-radius:50%;filter:blur(90px);opacity:.5;animation:fxFloat 14s ease-in-out infinite}
.fx-orb.a{width:460px;height:460px;background:#7c3aed;top:-140px;left:-120px}
.fx-orb.b{width:420px;height:420px;background:#4b44b3;bottom:-120px;right:-100px;animation-delay:-5s}
.fx-orb.c{width:260px;height:260px;background:#f2805a;top:38%;right:16%;opacity:.2;animation-delay:-9s}
@keyframes fxFloat{0%,100%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(40px,-30px,0) scale(1.12)}}
.fx-grid{position:absolute;left:-50%;width:200%;bottom:-6%;height:52%;
  background-image:linear-gradient(rgba(246,195,68,.16) 1px,transparent 1px),linear-gradient(90deg,rgba(125,110,255,.28) 1px,transparent 1px);
  background-size:64px 64px;transform:perspective(520px) rotateX(62deg);transform-origin:50% 100%;
  -webkit-mask-image:linear-gradient(to top,#000 0%,transparent 85%);mask-image:linear-gradient(to top,#000 0%,transparent 85%);
  animation:fxGrid 5s linear infinite}
@keyframes fxGrid{to{background-position:0 64px,0 0}}
.fx-dot{position:absolute;border-radius:50%;background:#fff;opacity:0;animation:fxTwinkle 6s ease-in-out infinite}
@keyframes fxTwinkle{0%,100%{opacity:0;transform:translateY(0)}50%{opacity:.7;transform:translateY(-18px)}}

/* ---------- entrance ---------- */
.fx-in{opacity:0;transform:translateY(24px);animation:fxIn .85s cubic-bezier(.2,.7,.2,1) forwards;animation-delay:var(--d,0s)}
@keyframes fxIn{to{opacity:1;transform:none}}

/* ---------- text ---------- */
.fx-grad{background:linear-gradient(90deg,#c7c2ff,#f6c344,#f2805a,#c7c2ff);background-size:300% 100%;
  -webkit-background-clip:text;background-clip:text;color:transparent;animation:fxGradMove 8s linear infinite}
@keyframes fxGradMove{to{background-position:300% 0}}
.fx-pulse{width:8px;height:8px;border-radius:50%;background:#34d399;animation:fxPulse 2s infinite}
@keyframes fxPulse{0%{box-shadow:0 0 0 0 rgba(52,211,153,.7)}70%{box-shadow:0 0 0 9px rgba(52,211,153,0)}100%{box-shadow:0 0 0 0 rgba(52,211,153,0)}}

/* ---------- glass + tilt ---------- */
.fx-tilt{position:relative;border-radius:26px;transform-style:preserve-3d;
  transform:perspective(900px) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg));
  transition:transform .25s ease-out}
.fx-tilt > *:not(.fx-glass-bg):not(.fx-glare){position:relative}
.fx-glass-bg{position:absolute;inset:0;border-radius:inherit;
  background:linear-gradient(145deg,rgba(255,255,255,.13),rgba(255,255,255,.04));
  border:1px solid rgba(255,255,255,.18);
  -webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px);
  box-shadow:0 30px 60px rgba(5,5,30,.45),inset 0 1px 0 rgba(255,255,255,.25)}
.fx-glare{position:absolute;inset:0;border-radius:inherit;pointer-events:none;opacity:0;transition:opacity .25s;
  background:radial-gradient(420px circle at var(--gx,50%) var(--gy,0%),rgba(255,255,255,.16),transparent 45%)}
.fx-tilt:hover .fx-glare{opacity:1}
.fx-chip{width:52px;height:52px;border-radius:16px;display:grid;place-items:center;
  background:linear-gradient(135deg,#f2805a,#f6c344);box-shadow:0 12px 24px rgba(242,128,90,.45);transform:translateZ(46px)}

/* ---------- buttons ---------- */
.fx-btn{position:relative;overflow:hidden;display:inline-flex;align-items:center;justify-content:center;gap:10px;
  border:0;cursor:pointer;border-radius:16px;padding:15px 28px;font:700 15px Poppins,sans-serif;color:#fff;text-decoration:none;
  background:linear-gradient(135deg,#f2805a,#f6a04a);
  box-shadow:0 14px 30px rgba(242,128,90,.45),inset 0 1px 0 rgba(255,255,255,.4),0 4px 0 #c75f3a;
  transition:transform .18s,box-shadow .18s,background .3s}
.fx-btn:hover{transform:translateY(-3px)}
.fx-btn:active{transform:translateY(2px);box-shadow:0 6px 14px rgba(242,128,90,.4),inset 0 1px 0 rgba(255,255,255,.4),0 1px 0 #c75f3a}
.fx-btn::after{content:"";position:absolute;top:0;left:-70%;width:50%;height:100%;
  background:linear-gradient(100deg,transparent,rgba(255,255,255,.55),transparent);transform:skewX(-20deg);transition:left .6s}
.fx-btn:hover::after{left:130%}
.fx-btn:disabled{opacity:.6;cursor:not-allowed;transform:none}
.fx-btn.ok{background:linear-gradient(135deg,#10b981,#34d399);box-shadow:0 14px 30px rgba(16,185,129,.45),inset 0 1px 0 rgba(255,255,255,.4),0 4px 0 #0b8f63}
.fx-btn:focus-visible,.fx-pill:focus-visible,.fx-back:focus-visible{outline:3px solid var(--yellow);outline-offset:3px}
.fx-pill{display:inline-flex;align-items:center;gap:8px;border-radius:999px;padding:9px 18px;font:600 13px Poppins,sans-serif;color:#fff;text-decoration:none;
  background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.22);transition:background .2s,transform .2s}
.fx-pill:hover{background:rgba(255,255,255,.2);transform:translateY(-2px)}
.fx-chipline{display:inline-flex;align-items:center;gap:8px;border-radius:999px;padding:8px 14px;font:500 12px Poppins,sans-serif;color:#d9d6ff;
  background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14)}
.fx-chipline svg{color:var(--yellow)}
.fx-back{display:inline-flex;align-items:center;gap:8px;font:500 13px Poppins,sans-serif;color:#cfcaff;text-decoration:none;transition:color .2s,transform .2s}
.fx-back:hover{color:#fff;transform:translateX(-3px)}

/* ---------- form ---------- */
.fx-field{position:relative}
.fx-field .lead{position:absolute;left:15px;top:50%;transform:translateY(-50%);color:rgba(255,255,255,.55);transition:color .2s;pointer-events:none}
.fx-field:focus-within .lead{color:var(--yellow)}
.fx-input{width:100%;padding:14px 14px 14px 46px;border-radius:14px;background:rgba(255,255,255,.07);
  border:1.5px solid rgba(255,255,255,.14);color:#fff;font:500 14px Poppins,sans-serif;outline:none;
  transition:border-color .2s,box-shadow .2s,background .2s}
.fx-input::placeholder{color:rgba(255,255,255,.38)}
.fx-input:focus{border-color:var(--yellow);background:rgba(255,255,255,.1);box-shadow:0 0 0 4px rgba(246,195,68,.18)}
.fx-input:-webkit-autofill{-webkit-text-fill-color:#fff;caret-color:#fff;box-shadow:0 0 0 1000px #2c2878 inset;transition:background-color 9999s}
.fx-eye{position:absolute;right:6px;top:50%;transform:translateY(-50%);border:0;background:none;color:rgba(255,255,255,.6);cursor:pointer;padding:9px;border-radius:10px;transition:color .2s,background .2s}
.fx-eye:hover{color:#fff;background:rgba(255,255,255,.1)}
.fx-eye:focus-visible{outline:3px solid var(--yellow)}
.fx-error{border-radius:12px;padding:11px 14px;font:500 13px Poppins,sans-serif;color:#ffd4d4;background:rgba(229,72,77,.18);border:1px solid rgba(229,72,77,.45);animation:fxIn .3s forwards}
.fx-flash{display:flex;align-items:center;gap:8px;border-radius:12px;padding:11px 14px;font:500 13px Poppins,sans-serif;color:#c9f7e3;background:rgba(16,185,129,.18);border:1px solid rgba(52,211,153,.45);animation:fxIn .4s forwards}
.fx-shake{animation:fxShake .5s}
@keyframes fxShake{10%,90%{transform:translateX(-2px)}20%,80%{transform:translateX(4px)}30%,50%,70%{transform:translateX(-8px)}40%,60%{transform:translateX(8px)}}
.fx-spin{animation:fxSpinFlat 1s linear infinite}
@keyframes fxSpinFlat{to{transform:rotate(360deg)}}

/* ---------- 3D cube scene ---------- */
.fx-scene{position:relative;display:grid;place-items:center;width:min(460px,82vw);aspect-ratio:1;perspective:1100px;--s:clamp(120px,24vw,170px)}
.fx-parallax{position:relative;width:100%;height:100%;display:grid;place-items:center;transform-style:preserve-3d;
  transform:rotateX(var(--py,0deg)) rotateY(var(--px,0deg));transition:transform .2s ease-out}
.fx-holder{position:relative;display:grid;place-items:center;transform-style:preserve-3d;animation:fxBob 5s ease-in-out infinite}
@keyframes fxBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
.fx-cube{--h:calc(var(--s) / 2);position:relative;width:var(--s);height:var(--s);transform-style:preserve-3d;animation:fxSpin 18s linear infinite}
@keyframes fxSpin{from{transform:rotateX(-24deg) rotateY(0deg)}to{transform:rotateX(-24deg) rotateY(360deg)}}
.fx-cube.core{--h:calc(var(--s) * .21);position:absolute;width:calc(var(--s) * .42);height:calc(var(--s) * .42);animation:fxSpinRev 9s linear infinite}
@keyframes fxSpinRev{from{transform:rotateX(20deg) rotateY(360deg)}to{transform:rotateX(20deg) rotateY(0deg)}}
.fx-face{position:absolute;inset:0;display:grid;place-items:center;border-radius:18px;color:#fff;
  background:linear-gradient(145deg,rgba(255,255,255,.22),rgba(255,255,255,.04));
  border:1px solid rgba(255,255,255,.35);box-shadow:inset 0 0 40px rgba(124,108,255,.4)}
.core .fx-face{border-radius:8px;background:linear-gradient(145deg,rgba(242,128,90,.95),rgba(246,195,68,.75));
  border-color:rgba(255,255,255,.55);box-shadow:0 0 32px rgba(242,128,90,.85)}
.fx-ring{position:absolute;border-radius:50%;border:1px solid rgba(255,255,255,.22);transform-style:preserve-3d}
.fx-ring::after{content:"";position:absolute;top:-5px;left:50%;width:10px;height:10px;margin-left:-5px;border-radius:50%;background:var(--yellow);box-shadow:0 0 16px var(--yellow)}
.fx-ring.r1{width:96%;height:96%;animation:fxRing1 14s linear infinite}
.fx-ring.r2{width:74%;height:74%;animation:fxRing2 10s linear infinite}
.fx-ring.r2::after{background:var(--orange);box-shadow:0 0 16px var(--orange)}
@keyframes fxRing1{from{transform:rotateX(72deg) rotateZ(0deg)}to{transform:rotateX(72deg) rotateZ(360deg)}}
@keyframes fxRing2{from{transform:rotateX(72deg) rotateY(24deg) rotateZ(360deg)}to{transform:rotateX(72deg) rotateY(24deg) rotateZ(0deg)}}
.fx-shadow{position:absolute;bottom:4%;width:42%;height:26px;border-radius:50%;filter:blur(8px);
  background:radial-gradient(closest-side,rgba(0,0,0,.6),transparent);animation:fxShadow 5s ease-in-out infinite}
@keyframes fxShadow{0%,100%{transform:scale(1);opacity:.9}50%{transform:scale(.82);opacity:.6}}

@media (prefers-reduced-motion:reduce){
  .fx *,.fx *::before,.fx *::after{animation:none!important;transition:none!important}
  .fx-in{opacity:1!important;transform:none!important}
}
`;

export function FxStyles() {
  return <style>{css}</style>;
}

/* ------------------------------------------------------------------ */
/*  Animated background: orbs, perspective grid, twinkling dots        */
/* ------------------------------------------------------------------ */
const DOTS = Array.from({ length: 18 }, (_, i) => ({
  l: (i * 37 + 11) % 100,
  t: (i * 53 + 7) % 90,
  d: (i * 0.7) % 6,
  s: 2 + (i % 3),
}));

export function Aurora() {
  return (
    <div aria-hidden className="fx-bg">
      <div className="fx-orb a" />
      <div className="fx-orb b" />
      <div className="fx-orb c" />
      <div className="fx-grid" />
      {DOTS.map((d, i) => (
        <span
          key={i}
          className="fx-dot"
          style={{ left: `${d.l}%`, top: `${d.t}%`, width: d.s, height: d.s, animationDelay: `${d.d}s` }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Card that tilts toward the pointer, with a moving glare            */
/* ------------------------------------------------------------------ */
export function TiltCard({
  children,
  className = "",
  max = 9,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const move = (e: ReactPointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || e.pointerType === "touch") return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty("--rx", `${(0.5 - py) * max * 2}deg`);
    el.style.setProperty("--ry", `${(px - 0.5) * max * 2}deg`);
    el.style.setProperty("--gx", `${px * 100}%`);
    el.style.setProperty("--gy", `${py * 100}%`);
  };

  const leave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  };

  return (
    <div ref={ref} className={`fx-tilt ${className}`} onPointerMove={move} onPointerLeave={leave}>
      <span className="fx-glass-bg" aria-hidden />
      {children}
      <span className="fx-glare" aria-hidden />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Spinning glass cube with an orange core and orbiting rings         */
/* ------------------------------------------------------------------ */
const FACES: { Icon: LucideIcon; t: string }[] = [
  { Icon: Bot, t: "rotateY(0deg)" },
  { Icon: FileText, t: "rotateY(90deg)" },
  { Icon: Upload, t: "rotateY(180deg)" },
  { Icon: LayoutDashboard, t: "rotateY(-90deg)" },
  { Icon: BarChart3, t: "rotateX(90deg)" },
  { Icon: ShieldCheck, t: "rotateX(-90deg)" },
];

export function Cube3D() {
  const ref = useRef<HTMLDivElement>(null);

  // The whole scene leans toward the pointer.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    if (!el) return;
    const onMove = (e: PointerEvent) => {
      const x = e.clientX / window.innerWidth - 0.5;
      const y = e.clientY / window.innerHeight - 0.5;
      el.style.setProperty("--px", `${x * 28}deg`);
      el.style.setProperty("--py", `${-y * 22}deg`);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <div className="fx-scene" aria-hidden>
      <div ref={ref} className="fx-parallax">
        <div className="fx-ring r1" />
        <div className="fx-ring r2" />
        <div className="fx-holder">
          <div className="fx-cube">
            {FACES.map(({ Icon, t }, i) => (
              <div key={i} className="fx-face" style={{ transform: `${t} translateZ(var(--h))` }}>
                <Icon size={40} strokeWidth={1.6} />
              </div>
            ))}
            <div className="fx-cube core">
              {FACES.map(({ t }, i) => (
                <div key={i} className="fx-face" style={{ transform: `${t} translateZ(var(--h))` }} />
              ))}
            </div>
          </div>
        </div>
        <div className="fx-shadow" />
      </div>
    </div>
  );
}