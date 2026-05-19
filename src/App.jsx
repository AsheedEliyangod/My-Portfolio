import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Preload, Stats } from "@react-three/drei";
import { AnimatePresence } from "framer-motion";
import { World } from "./world/World.jsx";
import { CameraRig } from "./systems/CameraRig.jsx";
import { GameProvider, useGame } from "./state/GameContext.jsx";
import { HUD } from "./ui/HUD.jsx";
import { Modal } from "./ui/Modal.jsx";
import { MobileJoystick } from "./ui/MobileJoystick.jsx";
import { TouchLookPad } from "./ui/TouchLookPad.jsx";
import { LoadingScreen } from "./ui/LoadingScreen.jsx";
import { isPhoneDevice } from "./utils/device.js";

function Scene() {
  const isPhone = useMemo(() => isPhoneDevice(), []);

  return (
    <Canvas
      shadows={!isPhone}
      dpr={isPhone ? [0.75, 1] : [1, 1.75]}
      camera={{ position: [0, 7, 16], fov: 50, near: 0.1, far: 520 }}
      gl={{ antialias: !isPhone, powerPreference: isPhone ? "default" : "high-performance" }}
    >
      <color attach="background" args={["#8bc8e8"]} />
      <fog attach="fog" args={["#8bc8e8", isPhone ? 28 : 34, isPhone ? 140 : 190]} />
      <Suspense fallback={null}>
        <World />
        <CameraRig />
        {!isPhone ? <Environment preset="sunset" /> : null}
        {!isPhone ? <Preload all /> : null}
      </Suspense>
      {/* LoadingScreen reads useProgress which only works inside Canvas */}
      {import.meta.env.DEV && false ? <Stats /> : null}
    </Canvas>
  );
}

function Shell() {
  const { activePanel, closePanel, setMobileInput, setTouchLook } = useGame();
  const isPhone = useMemo(() => isPhoneDevice(), []);

  return (
    <main className="relative h-full w-full bg-ink text-white">
      <Scene />
      {/* Cinematic loader — must be outside Canvas but inside the R3F tree so useProgress works */}
      <LoadingScreen />
      <HUD />
      {isPhone ? <MobileJoystick onMove={setMobileInput} /> : null}
      {isPhone ? <TouchLookPad onLook={setTouchLook} /> : null}
      <AnimatePresence>
        {activePanel ? <Modal panel={activePanel} onClose={closePanel} /> : null}
      </AnimatePresence>
    </main>
  );
}

export default function App() {
  return (
    <GameProvider>
      <Shell />
    </GameProvider>
  );
}
