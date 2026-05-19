import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import * as THREE from "three";

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [mode, setMode] = useState("ship");
  const [nearDock, setNearDock] = useState(false);
  const [nearPanel, setNearPanel] = useState(false);
  const [activePanel, setActivePanel] = useState(null);
  const [hint, setHint] = useState("Sail toward an island");
  // Which island the player is currently walking on (null = on ship)
  const [currentIsland, setCurrentIsland] = useState(null);

  const ship = useRef({
    position: new THREE.Vector3(0, 0.35, 54),
    rotation: Math.PI,
    speed: 0
  });
  const player = useRef({
    position: new THREE.Vector3(0, 0.52, 12),
    rotation: Math.PI,
    speed: 0
  });
  const camera = useRef({ yaw: Math.PI, pitch: -0.22 });
  const input = useRef({
    keys: {},
    mobile: { x: 0, y: 0, active: false },
    look: { x: 0, y: 0 }
  });

  // Mobile dock trigger – set by HUD tap button, consumed by Ship/PlayerController each frame
  const mobileDock = useRef({ triggered: false });
  const triggerMobileDock = useCallback(() => { mobileDock.current.triggered = true; }, []);

  // Mobile panel-open trigger
  const mobilePanel = useRef({ triggered: false });
  const triggerMobilePanel = useCallback(() => { mobilePanel.current.triggered = true; }, []);

  const openPanel  = useCallback((panel) => setActivePanel(panel), []);
  const closePanel = useCallback(() => setActivePanel(null), []);
  const setMobileInput = useCallback((mobile) => { input.current.mobile = mobile; }, []);
  const setTouchLook   = useCallback((look)   => { input.current.look   = look;   }, []);

  const value = useMemo(
    () => ({
      mode, setMode,
      nearDock, setNearDock,
      nearPanel, setNearPanel,
      hint, setHint,
      activePanel, openPanel, closePanel,
      currentIsland, setCurrentIsland,
      ship, player, camera, input,
      setMobileInput, setTouchLook,
      mobileDock, triggerMobileDock,
      mobilePanel, triggerMobilePanel
    }),
    [activePanel, closePanel, currentIsland, hint, mode, nearDock, nearPanel,
     openPanel, setMobileInput, setTouchLook, triggerMobileDock, triggerMobilePanel]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error("useGame must be used inside GameProvider");
  return context;
}
