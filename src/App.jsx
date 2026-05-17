import { Suspense, useEffect, useState } from "react";
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

function Scene() {
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ position: [0, 7, 16], fov: 50, near: 0.1, far: 520 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
    >
      <color attach="background" args={["#8bc8e8"]} />
      <fog attach="fog" args={["#8bc8e8", 34, 190]} />
      <Suspense fallback={null}>
        <World />
        <CameraRig />
        <Environment preset="sunset" />
        <Preload all />
      </Suspense>
      {/* LoadingScreen reads useProgress which only works inside Canvas */}
      {import.meta.env.DEV && false ? <Stats /> : null}
    </Canvas>
  );
}

function Shell() {
  const [joystick, setJoystick] = useState({ x: 0, y: 0, active: false });
  const [lookDelta, setLookDelta] = useState({ x: 0, y: 0 });
  const { activePanel, closePanel, setMobileInput, setTouchLook } = useGame();

  useEffect(() => setMobileInput(joystick), [joystick, setMobileInput]);
  useEffect(() => setTouchLook(lookDelta), [lookDelta, setTouchLook]);

  return (
    <main className="relative h-full w-full bg-ink text-white">
      <Scene />
      {/* Cinematic loader — must be outside Canvas but inside the R3F tree so useProgress works */}
      <LoadingScreen />
      <HUD />
      <MobileJoystick onMove={setJoystick} />
      <TouchLookPad onLook={setLookDelta} />
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
