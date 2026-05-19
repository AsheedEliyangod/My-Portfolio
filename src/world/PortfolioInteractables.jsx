import { Billboard, Float, Html, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { portfolio } from "../data/portfolio.js";
import { useGame } from "../state/GameContext.jsx";
import { isPhoneDevice } from "../utils/device.js";
import { ISLANDS } from "./Island.jsx";

// ---------------------------------------------------------------------------
// One glowing interaction panel per island.
// The panel is placed at the island's LOCAL centre (so group offset handles world pos).
// ---------------------------------------------------------------------------
function Panel({ item }) {
  const ref = useRef();
  const { openPanel } = useGame();

  useFrame(({ clock }) => {
    ref.current.material.emissiveIntensity = 0.65 + Math.sin(clock.elapsedTime * 2.2) * 0.2;
  });

  // panel floats above the island centre, slightly toward the player spawn
  const panelPos = [0, 2.6, 2.0];

  return (
    <Float speed={1.6} floatIntensity={0.22}>
      <Billboard position={panelPos}>
        <mesh ref={ref} onClick={() => openPanel(item.id)} castShadow>
          <boxGeometry args={[2.4, 1.1, 0.06]} />
          <meshStandardMaterial
            color="#102337"
            emissive={item.color}
            emissiveIntensity={0.7}
            roughness={0.38}
            metalness={0.18}
            transparent
            opacity={0.92}
          />
        </mesh>
        <Text
          position={[0, 0.06, 0.06]}
          fontSize={0.28}
          maxWidth={2.0}
          textAlign="center"
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          {item.label}
        </Text>
        <Html position={[0, -0.76, 0]} center distanceFactor={12} className="pointer-events-none">
          <div className="rounded border border-white/20 bg-black/30 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-white/80">
            E / Tap
          </div>
        </Html>
      </Billboard>
    </Float>
  );
}

// ---------------------------------------------------------------------------
// Orbiting skill tags — lives on the Skills island
// ---------------------------------------------------------------------------
function SkillOrbit() {
  const group = useRef();
  const labels = useMemo(() => portfolio.skills.technical.map((s) => s.name), []);
  useFrame(({ clock }) => {
    group.current.rotation.y = clock.elapsedTime * 0.16;
  });
  return (
    <group ref={group} position={[0, 1.4, -2.0]}>
      {labels.map((label, index) => {
        const angle = (index / labels.length) * Math.PI * 2;
        return (
          <Billboard
            key={label}
            position={[Math.cos(angle) * 2.5, 0.2 + Math.sin(index) * 0.3, Math.sin(angle) * 2.5]}
          >
            <mesh>
              <planeGeometry args={[1.15, 0.36]} />
              <meshStandardMaterial
                color="#081828"
                emissive="#1af0bf"
                emissiveIntensity={0.52}
                transparent
                opacity={0.72}
                side={THREE.DoubleSide}
              />
            </mesh>
            <Text position={[0, 0, 0.01]} fontSize={0.105} color="#eafffb" anchorX="center" anchorY="middle">
              {label}
            </Text>
          </Billboard>
        );
      })}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Render all panels, each offset by their island's world position
// ---------------------------------------------------------------------------
function sameIds(a, b) {
  return a.size === b.size && [...a].every((id) => b.has(id));
}

export function PortfolioInteractables() {
  const { mode, ship, player } = useGame();
  const isPhone = useMemo(() => isPhoneDevice(), []);
  const checkTimer = useRef(0);
  const [visibleIds, setVisibleIds] = useState(() => new Set(ISLANDS.map((island) => island.id)));

  useFrame((_, delta) => {
    if (!isPhone) return;
    checkTimer.current += delta;
    if (checkTimer.current < 0.45) return;
    checkTimer.current = 0;

    const subject = mode === "ship" ? ship.current.position : player.current.position;
    const next = new Set(
      ISLANDS
        .filter((island) => subject.distanceTo(island.worldPos) < 105)
        .map((island) => island.id)
    );

    setVisibleIds((current) => (sameIds(current, next) ? current : next));
  });

  return (
    <>
      {ISLANDS.map((island) => (
        isPhone && !visibleIds.has(island.id) ? null : (
          <group key={island.id} position={[island.worldPos.x, 0, island.worldPos.z]}>
            <Panel item={island} />
            {/* Extra ambient light per island so panels are visible */}
            <pointLight position={[0, 3, 2]} color={island.color} intensity={isPhone ? 5 : 8} distance={14} />
            {/* Skill orbit decoration only on Skills island */}
            {island.id === "skills" && <SkillOrbit />}
          </group>
        )
      ))}
    </>
  );
}
