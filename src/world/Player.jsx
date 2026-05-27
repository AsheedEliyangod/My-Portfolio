import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { RealCharacter } from "./RealCharacter.jsx";
import { useGame } from "../state/GameContext.jsx";

function poseFromState(state) {
  if (state.animationState === "Run") return "run";
  if (state.animationState === "Walk") return "walk";
  if (state.animationState === "MountBike") return "mount";
  if (state.animationState === "DismountBike") return "dismount";
  return "idle";
}

export function Player() {
  const group = useRef();
  const movementLight = useRef();
  const stride = useRef(0);
  const visualTimer = useRef(0);
  const [visual, setVisual] = useState({ pose: "idle", angle: 0, speed: 0 });
  const { mode, player } = useGame();

  useFrame((_, delta) => {
    const state = player.current;
    group.current.position.copy(state.position);
    group.current.rotation.y = state.rotation;
    stride.current += Math.max(0.8, Math.abs(state.speed) * 2.5) * delta;
    const movementAmount = Math.min(1, Math.abs(state.speed) / 6);
    if (movementLight.current) movementLight.current.intensity = 0.1 + movementAmount * 0.45;
    visualTimer.current += delta;
    if (visualTimer.current > 1 / 30) {
      visualTimer.current = 0;
      setVisual({ pose: poseFromState(state), angle: stride.current, speed: state.speed });
    }
  });

  const hideWalkAvatar = mode === "bike" || mode === "mountBike" || mode === "dismountBike";

  return (
    <group ref={group}>
      {!hideWalkAvatar ? (
        <>
          <RealCharacter
            pose={visual.pose}
            cycleAngle={visual.angle}
            speed={visual.speed}
            scale={1.06}
            position={[0, -0.72, 0]}
          />
          <pointLight ref={movementLight} position={[0, 1.48, 0]} color="#9cecff" intensity={0.12} distance={2.5} />
        </>
      ) : null}
    </group>
  );
}
