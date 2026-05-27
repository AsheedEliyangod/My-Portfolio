import { Billboard, Float, Html, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { portfolio } from "../data/portfolio.js";
import { useGame } from "../state/GameContext.jsx";
import { ISLANDS } from "./Island.jsx";

function AnimatedScreen({ item, subtitle }) {
  const screen = useRef();
  const scanline = useRef();
  const { activePanel, openPanel } = useGame();

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (screen.current) {
      screen.current.material.emissiveIntensity = 1.5 + Math.sin(t * 2.4 + item.worldPos.x) * 0.35;
    }
    if (scanline.current) {
      scanline.current.position.y = -0.46 + ((t * 0.34) % 0.92);
    }
  });

  return (
    <Float speed={1.1} floatIntensity={0.12}>
      <Billboard position={[item.worldPos.x, 5.2, item.worldPos.z + 6.2]}>
        <group onClick={() => openPanel(item.id)}>
          <mesh ref={screen} castShadow>
            <boxGeometry args={[4.1, 1.8, 0.08]} />
            <meshStandardMaterial
              color="#050b11"
              emissive={item.color}
              emissiveIntensity={1.55}
              roughness={0.18}
              metalness={0.45}
              transparent
              opacity={0.92}
              toneMapped={false}
            />
          </mesh>
          <mesh ref={scanline} position={[0, 0, 0.052]}>
            <boxGeometry args={[3.7, 0.04, 0.015]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.36} depthWrite={false} />
          </mesh>
          <Text position={[0, 0.32, 0.085]} fontSize={0.28} maxWidth={3.5} textAlign="center" color="#f5fdff" anchorX="center" anchorY="middle">
            {item.label}
          </Text>
          <Text position={[0, -0.24, 0.085]} fontSize={0.14} maxWidth={3.45} textAlign="center" color="#b7cad6" anchorX="center" anchorY="middle">
            {subtitle}
          </Text>
        </group>
        {!activePanel ? (
          <Html position={[0, -1.28, 0]} center distanceFactor={12} className="pointer-events-none">
            <div className="world-tooltip">E / Tap to inspect</div>
          </Html>
        ) : null}
      </Billboard>
    </Float>
  );
}

function SkillOrbit() {
  const group = useRef();
  const skillsZone = ISLANDS.find((item) => item.id === "skills").worldPos;
  const labels = useMemo(() => portfolio.skills.technical.slice(0, 9).map((s) => s.name), []);
  useFrame(({ clock }) => {
    if (group.current) group.current.rotation.y = clock.elapsedTime * 0.2;
  });

  return (
    <group ref={group} position={[skillsZone.x, 4.4, skillsZone.z]}>
      {labels.map((label, index) => {
        const angle = (index / labels.length) * Math.PI * 2;
        return (
          <Billboard key={label} position={[Math.cos(angle) * 5.1, Math.sin(index * 1.8) * 0.34, Math.sin(angle) * 5.1]}>
            <mesh>
              <planeGeometry args={[1.35, 0.38]} />
              <meshStandardMaterial color="#050b0d" emissive="#72ffb7" emissiveIntensity={0.68} transparent opacity={0.82} side={THREE.DoubleSide} />
            </mesh>
            <Text position={[0, 0, 0.012]} fontSize={0.1} color="#edfff7" anchorX="center" anchorY="middle">
              {label}
            </Text>
          </Billboard>
        );
      })}
    </group>
  );
}

function ProjectBillboards() {
  const group = useRef();
  const projectsZone = ISLANDS.find((item) => item.id === "projects").worldPos;
  useFrame(({ clock }) => {
    if (group.current) group.current.position.y = 0.1 + Math.sin(clock.elapsedTime * 0.9) * 0.05;
  });

  return (
    <group ref={group} position={[projectsZone.x, 4.4, projectsZone.z + 9.6]}>
      {portfolio.projects.slice(0, 3).map((project, index) => (
        <Billboard key={project.id} position={[(index - 1) * 3.2, 0, 0]}>
          <mesh>
            <boxGeometry args={[2.65, 1.42, 0.06]} />
            <meshStandardMaterial color="#080b10" emissive={project.color} emissiveIntensity={0.82} metalness={0.35} roughness={0.28} />
          </mesh>
          <Text position={[0, 0.24, 0.05]} fontSize={0.16} maxWidth={2.2} textAlign="center" color="#ffffff" anchorX="center" anchorY="middle">
            {project.title}
          </Text>
          <Text position={[0, -0.25, 0.05]} fontSize={0.09} maxWidth={2.25} textAlign="center" color="#cbd6df" anchorX="center" anchorY="middle">
            {project.tags.join(" / ")}
          </Text>
        </Billboard>
      ))}
    </group>
  );
}

const subtitles = {
  about: "About Me / developer profile / interactive origin point",
  projects: "Projects / playable builds / animated case studies",
  skills: "Skills / tools / production workflow",
  resume: "Experience / certifications / resume download",
  contact: "Contact / GitHub / social links / mail channel",
};

export function PortfolioInteractables() {
  return (
    <>
      {ISLANDS.map((item) => (
        <group key={item.id}>
          <AnimatedScreen item={item} subtitle={subtitles[item.id]} />
          <pointLight position={[item.worldPos.x, 6.4, item.worldPos.z + 5.5]} color={item.color} intensity={7.5} distance={24} />
        </group>
      ))}
      <SkillOrbit />
      <ProjectBillboards />
    </>
  );
}
