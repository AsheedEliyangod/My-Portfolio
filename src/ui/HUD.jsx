import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { useGame } from "../state/GameContext.jsx";
import { portfolio } from "../data/portfolio.js";
import { isPhoneDevice } from "../utils/device.js";
import { SettingsMenu } from "./SettingsMenu.jsx";

const SOCIAL_SVGS = {
  github: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.38 7.86 10.9.57.1.78-.25.78-.55v-1.93C5.73 21.1 5.04 18.9 5.04 18.9c-.52-1.33-1.27-1.68-1.27-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.75 1.18 1.75 1.18 1.02 1.75 2.67 1.24 3.33.95.1-.74.4-1.24.72-1.53-2.53-.29-5.19-1.27-5.19-5.64 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.45.11-3.02 0 0 .96-.31 3.15 1.17a10.93 10.93 0 0 1 5.74 0c2.19-1.48 3.15-1.17 3.15-1.17.62 1.57.23 2.73.11 3.02.73.8 1.18 1.82 1.18 3.07 0 4.38-2.67 5.35-5.21 5.63.41.35.78 1.04.78 2.1v3.12c0 .3.2.66.79.55C20.21 21.38 23.5 17.08 23.5 12 23.5 5.73 18.27.5 12 .5z" />
    </svg>
  ),
  itch: <span className="hud-social-letter">it</span>,
  linkedin: <span className="hud-social-letter">in</span>,
  email: <span className="hud-social-letter">@</span>,
};

export function HUD() {
  const {
    hint,
    mode,
    nearDock,
    nearPanel,
    nearBike,
    activePanel,
    currentIsland,
    triggerMobileDock,
    triggerMobilePanel,
    triggerMobileBike
  } = useGame();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const root = useRef(null);
  const isPhone = useMemo(() => isPhoneDevice(), []);

  useEffect(() => {
    if (!root.current) return;
    gsap.fromTo(
      root.current.querySelectorAll(".hud-nametag, .hud-mode-chip, .hud-settings-btn, .hud-socials"),
      { y: -10, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.72, ease: "power3.out", stagger: 0.06 }
    );
  }, []);

  const showDockBtn = isPhone && nearDock && !activePanel;
  const showPanelBtn = isPhone && nearPanel && !activePanel && mode === "walk";
  const showBikeBtn = isPhone && !activePanel && (nearBike || mode === "bike");
  const modeLabel =
    mode === "ship" ? "Sailing" :
    mode === "bike" || mode === "mountBike" || mode === "dismountBike" ? "Cycling" :
    "Walking";

  return (
    <div ref={root} className="hud-root pointer-events-none absolute inset-0 z-20">
      <div className="pointer-events-auto absolute left-4 top-4">
        <div className="hud-nametag">
          <div className="hud-nametag-name">Cinematic Developer Island</div>
          <div className="hud-nametag-role">{portfolio.name} / Game Dev / WebGL</div>
        </div>
      </div>

      <div className="pointer-events-auto absolute right-4 top-4 flex items-center gap-2">
        <div className="hud-mode-chip">{modeLabel}</div>
        <button className="hud-settings-btn" onClick={() => setSettingsOpen(true)}>Settings</button>
      </div>

      {!isPhone && !activePanel && (
        <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 text-center">
          <div className="hud-hint" aria-live="polite">{hint}</div>
          <div className="hud-controls-line">WASD move/ride | Mouse look | Shift sprint | E interact/dismount</div>
        </div>
      )}

      {isPhone && !activePanel && (
        <div className="pointer-events-none absolute left-1/2 top-20 -translate-x-1/2 text-center">
          <div className="hud-hint">Joystick move | Drag camera | Tap action</div>
        </div>
      )}

      {showDockBtn && (
        <div className="pointer-events-auto absolute left-1/2 -translate-x-1/2 z-30 mobile-dock-btn-wrap">
          <button
            id="mobile-dock-btn"
            className="mobile-dock-btn"
            onPointerDown={(event) => {
              event.stopPropagation();
              triggerMobileDock();
            }}
          >
            {mode === "ship" ? "Exit Ship" : "Enter Ship"}
          </button>
        </div>
      )}

      {showPanelBtn && (
        <div className="pointer-events-auto absolute left-1/2 -translate-x-1/2 z-30 mobile-dock-btn-wrap">
          <button
            id="mobile-panel-btn"
            className="mobile-dock-btn mobile-panel-btn"
            onPointerDown={(event) => {
              event.stopPropagation();
              triggerMobilePanel();
            }}
          >
            Open {currentIsland?.label}
          </button>
        </div>
      )}

      {showBikeBtn && (
        <div className="pointer-events-auto absolute left-1/2 -translate-x-1/2 z-30 mobile-bike-btn-wrap">
          <button
            id="mobile-bike-btn"
            className="mobile-dock-btn mobile-bike-btn"
            onPointerDown={(event) => {
              event.stopPropagation();
              triggerMobileBike();
            }}
          >
            {mode === "bike" ? "Dismount" : "Ride Bicycle"}
          </button>
        </div>
      )}

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

      <SettingsMenu open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
