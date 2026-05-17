import { useProgress } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";

// ─── Key cap component ────────────────────────────────────────────────────────
function Key({ label, wide = false, arrow = false }) {
  return (
    <span
      className={`intro-key${wide ? " intro-key--wide" : ""}${arrow ? " intro-key--arrow" : ""}`}
    >
      {label}
    </span>
  );
}

// ─── Instruction row ─────────────────────────────────────────────────────────
function Row({ keys, desc, delay = 0 }) {
  return (
    <div className="intro-row" style={{ animationDelay: `${delay}s` }}>
      <div className="intro-keys">{keys}</div>
      <span className="intro-desc">{desc}</span>
    </div>
  );
}

// ─── Game Intro Overlay (Bruno Simon style) ───────────────────────────────────
function GameIntro({ onDismiss }) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    // Slight delay after loading screen fades for a clean transition
    const t = setTimeout(() => setVisible(true), 120);
    return () => clearTimeout(t);
  }, []);

  function dismiss() {
    setLeaving(true);
    setTimeout(onDismiss, 700);
  }

  // Auto-dismiss after 9 s
  useEffect(() => {
    const t = setTimeout(dismiss, 9000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`intro-overlay${visible ? " intro-visible" : ""}${leaving ? " intro-leaving" : ""}`}
      onClick={dismiss}
    >
      <div className="intro-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="intro-header">
          <div className="intro-eyebrow">Controls</div>
          <div className="intro-title">How to Play</div>
        </div>

        {/* Controls */}
        <div className="intro-controls">
          {/* WASD / Arrows */}
          <Row
            delay={0.08}
            desc="Move around"
            keys={
              <>
                <div className="intro-wasd">
                  <div className="intro-wasd-top"><Key label="W" /></div>
                  <div className="intro-wasd-bot">
                    <Key label="A" /><Key label="S" /><Key label="D" />
                  </div>
                </div>
                <span className="intro-or">or</span>
                <div className="intro-arrows">
                  <div className="intro-wasd-top"><Key label="↑" arrow /></div>
                  <div className="intro-wasd-bot">
                    <Key label="←" arrow /><Key label="↓" arrow /><Key label="→" arrow />
                  </div>
                </div>
              </>
            }
          />

          <Row
            delay={0.18}
            desc="Interact / board ship"
            keys={<Key label="E" />}
          />

          <Row
            delay={0.28}
            desc="Look around"
            keys={
              <span className="intro-mouse">
                <svg viewBox="0 0 28 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="1" y="1" width="26" height="40" rx="13" stroke="currentColor" strokeWidth="2"/>
                  <line x1="14" y1="1" x2="14" y2="18" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="14" cy="24" r="3" fill="currentColor" opacity="0.6"/>
                </svg>
                <span>Drag</span>
              </span>
            }
          />

          <Row
            delay={0.38}
            desc="Zoom camera"
            keys={
              <span className="intro-mouse intro-mouse--scroll">
                <svg viewBox="0 0 28 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="1" y="1" width="26" height="40" rx="13" stroke="currentColor" strokeWidth="2"/>
                  <line x1="14" y1="1" x2="14" y2="18" stroke="currentColor" strokeWidth="2"/>
                  <path d="M14 10 L11 6 M14 10 L17 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M14 20 L11 24 M14 20 L17 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span>Scroll</span>
              </span>
            }
          />
        </div>

        {/* Footer hint */}
        <div className="intro-footer">
          Sail to an island · dock · explore
        </div>

        <button className="intro-dismiss" onClick={dismiss}>
          Start Exploring
        </button>
      </div>
    </div>
  );
}

// ─── Main Loading Screen ──────────────────────────────────────────────────────
export function LoadingScreen() {
  const { progress, active } = useProgress();
  const [ready, setReady]     = useState(false);
  const [started, setStarted] = useState(false);
  const [hidden, setHidden]   = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const timerRef              = useRef(null);

  // Detect load completion
  useEffect(() => {
    if (!active && progress === 100 && !ready) {
      timerRef.current = setTimeout(() => setReady(true), 300);
    }
    return () => clearTimeout(timerRef.current);
  }, [active, progress, ready]);

  // After user clicks Start → fade out loader, then show intro
  useEffect(() => {
    if (started) {
      const hideId   = setTimeout(() => setHidden(true),    1200);
      const introId  = setTimeout(() => setShowIntro(true), 900);
      return () => { clearTimeout(hideId); clearTimeout(introId); };
    }
  }, [started]);

  return (
    <>
      {/* ── Loading / title overlay ── */}
      {!hidden && (
        <div className={`loader-overlay${started ? " loader-fade-out" : ""}`}>
          <div className="loader-glow" />

          <div className="loader-particles">
            {Array.from({ length: 18 }).map((_, i) => (
              <span key={i} className="loader-dot" style={{ "--i": i }} />
            ))}
          </div>

          <div className="loader-center">
            <div className="loader-title-block">
              <div className="loader-eyebrow">Game Dev · UI/UX · 3D</div>
              <div className="loader-title">Asheed&nbsp;Eliyangod</div>
              <div className="loader-subtitle">Ocean World Portfolio</div>
            </div>

            {!ready && (
              <>
                <div className="loader-bar-wrap">
                  <div className="loader-bar-fill" style={{ width: `${progress}%` }} />
                </div>
                <div className="loader-pct">{Math.round(progress)}&thinsp;%</div>
              </>
            )}

            {ready && !started && (
              <button className="loader-start-btn" onClick={() => setStarted(true)}>
                Start Experience
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Game intro / controls overlay ── */}
      {showIntro && <GameIntro onDismiss={() => setShowIntro(false)} />}
    </>
  );
}
