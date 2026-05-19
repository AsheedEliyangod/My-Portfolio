import { useMemo } from "react";
import { useGame } from "../state/GameContext.jsx";
import { portfolio } from "../data/portfolio.js";
import { isPhoneDevice } from "../utils/device.js";

const SOCIAL_SVGS = {
  github: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.38 7.86 10.9.57.1.78-.25.78-.55v-1.93C5.73 21.1 5.04 18.9 5.04 18.9c-.52-1.33-1.27-1.68-1.27-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.75 1.18 1.75 1.18 1.02 1.75 2.67 1.24 3.33.95.1-.74.4-1.24.72-1.53-2.53-.29-5.19-1.27-5.19-5.64 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.45.11-3.02 0 0 .96-.31 3.15 1.17a10.93 10.93 0 0 1 5.74 0c2.19-1.48 3.15-1.17 3.15-1.17.62 1.57.23 2.73.11 3.02.73.8 1.18 1.82 1.18 3.07 0 4.38-2.67 5.35-5.21 5.63.41.35.78 1.04.78 2.1v3.12c0 .3.2.66.79.55C20.21 21.38 23.5 17.08 23.5 12 23.5 5.73 18.27.5 12 .5z" />
    </svg>
  ),
  itch: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3.13 1.6C1.74 2.4.04 4.18 0 5.9v1.03c0 1.3.59 2.44 1.57 3.2a1.85 1.85 0 0 0 2.1 0C4.67 9.37 5.25 8.23 5.25 6.93v-.2C5.27 7.8 5.86 8.9 6.84 9.65a1.85 1.85 0 0 0 2.1 0c.98-.74 1.56-1.87 1.56-3.15v-.34c0 1.28.58 2.41 1.56 3.15a1.85 1.85 0 0 0 2.1 0c.98-.74 1.57-1.87 1.57-3.15v.2c0 1.3.58 2.44 1.56 3.2a1.85 1.85 0 0 0 2.1 0C20.37 8.8 21 7.7 21 6.43V5.9C20.96 4.18 19.26 2.4 17.87 1.6 16.3.72 10.63 0 10.5 0S4.7.72 3.13 1.6zM8 12.6c-.44 0-3.42.28-5 1.5v6.4c0 .83.67 1.5 1.5 1.5h12c.83 0 1.5-.67 1.5-1.5v-6.4c-1.58-1.22-4.56-1.5-5-1.5-.55 0-1.14.77-2.5.77S8.55 12.6 8 12.6z" />
    </svg>
  ),
  linkedin: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM.5 8.5h4V24h-4V8.5zm7.5 0h3.83v2.13h.06c.53-1 1.84-2.13 3.79-2.13C19.61 8.5 21 10.73 21 15v9h-4v-8.13c0-1.93-.03-4.41-2.69-4.41-2.69 0-3.1 2.1-3.1 4.27V24H8V8.5z" />
    </svg>
  ),
  email: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
    </svg>
  ),
};

export function HUD() {
  const {
    hint,
    mode,
    nearDock,
    nearPanel,
    activePanel,
    currentIsland,
    triggerMobileDock,
    triggerMobilePanel
  } = useGame();
  const isPhone = useMemo(() => isPhoneDevice(), []);

  // Which mobile action button to show (mutually exclusive states)
  const showDockBtn   = isPhone && nearDock  && !activePanel;
  const showPanelBtn  = isPhone && nearPanel && !activePanel && mode === "walk";

  return (
    <div className="hud-root pointer-events-none absolute inset-0 z-20">

      {/* Top-left: name watermark */}
      <div className="pointer-events-auto absolute left-4 top-4">
        <div className="hud-nametag">
          <div className="hud-nametag-name">{portfolio.name}</div>
          <div className="hud-nametag-role">Game Dev · UI/UX · 3D</div>
        </div>
      </div>

      {/* Top-right: mode chip */}
      <div className="pointer-events-none absolute right-4 top-4">
        <div className="hud-mode-chip">
          {mode === "ship" ? "⛵ Sailing" : "🚶 Walking"}
        </div>
      </div>

      {/* ── PC hint text — hidden when panel is open ─────────────────────── */}
      {!isPhone && !activePanel && (
        <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2">
          <div className="hud-hint" aria-live="polite">{hint}</div>
        </div>
      )}

      {/* ── Mobile: Exit / Board ship button ─────────────────────────────── */}
      {showDockBtn && (
        <div className="pointer-events-auto absolute left-1/2 -translate-x-1/2 z-30 mobile-dock-btn-wrap">
          <button
            id="mobile-dock-btn"
            className="mobile-dock-btn"
            onPointerDown={(e) => { e.stopPropagation(); triggerMobileDock(); }}
          >
            {mode === "ship" ? "⚓  Exit Ship" : "⛵  Board Ship"}
          </button>
        </div>
      )}

      {/* ── Mobile: Open section panel button ────────────────────────────── */}
      {showPanelBtn && (
        <div className="pointer-events-auto absolute left-1/2 -translate-x-1/2 z-30 mobile-dock-btn-wrap">
          <button
            id="mobile-panel-btn"
            className="mobile-dock-btn mobile-panel-btn"
            onPointerDown={(e) => { e.stopPropagation(); triggerMobilePanel(); }}
          >
            🔍&nbsp;&nbsp;Open {currentIsland?.label}
          </button>
        </div>
      )}

      {/* Bottom-right: social icons */}
      <div className="pointer-events-auto absolute bottom-4 right-4">
        <div className="hud-socials">
          {portfolio.contact.map((item) => (
            <a
              key={item.label}
              href={item.href}
              target="_blank"
              rel="noreferrer"
              title={item.label}
              className="hud-social-btn"
            >
              {SOCIAL_SVGS[item.icon]}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
