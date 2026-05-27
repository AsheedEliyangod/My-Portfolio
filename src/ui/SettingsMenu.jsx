import { useEffect, useState } from "react";
import { isPhoneDevice } from "../utils/device.js";

const DEFAULT_SETTINGS = {
  graphics: "balanced",
  sound: false,
  mouseSensitivity: 50,
  mobileSensitivity: 46,
  fpsLimit: "60",
};

function loadSettings() {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem("portfolio-settings") || "{}") };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function SettingsMenu({ open, onClose }) {
  const [settings, setSettings] = useState(loadSettings);
  const isPhone = isPhoneDevice();

  useEffect(() => {
    localStorage.setItem("portfolio-settings", JSON.stringify(settings));
  }, [settings]);

  if (!open) return null;

  const update = (key, value) => setSettings((current) => ({ ...current, [key]: value }));

  return (
    <div className="settings-backdrop" onPointerDown={onClose}>
      <section className="settings-panel" onPointerDown={(event) => event.stopPropagation()}>
        <div className="settings-header">
          <div>
            <div className="settings-eyebrow">Game Settings</div>
            <h2 className="settings-title">Performance & Controls</h2>
          </div>
          <button className="settings-close" onClick={onClose} aria-label="Close settings">x</button>
        </div>

        <label className="settings-row">
          <span>Graphics quality</span>
          <select value={settings.graphics} onChange={(event) => update("graphics", event.target.value)}>
            <option value="low">Low</option>
            <option value="balanced">Balanced</option>
            <option value="high">High</option>
          </select>
        </label>

        <label className="settings-row">
          <span>{isPhone ? "Mobile sensitivity" : "Mouse sensitivity"}</span>
          <input
            type="range"
            min="20"
            max="90"
            value={isPhone ? settings.mobileSensitivity : settings.mouseSensitivity}
            onChange={(event) => update(isPhone ? "mobileSensitivity" : "mouseSensitivity", Number(event.target.value))}
          />
        </label>

        <label className="settings-row">
          <span>FPS limit</span>
          <select value={settings.fpsLimit} onChange={(event) => update("fpsLimit", event.target.value)}>
            <option value="30">30 FPS</option>
            <option value="45">45 FPS</option>
            <option value="60">60 FPS</option>
          </select>
        </label>

        <label className="settings-toggle">
          <input
            type="checkbox"
            checked={settings.sound}
            onChange={(event) => update("sound", event.target.checked)}
          />
          <span>Sound enabled</span>
        </label>

        <button className="settings-action" onClick={() => document.documentElement.requestFullscreen?.()}>
          Fullscreen
        </button>
      </section>
    </div>
  );
}
