import { Float } from "@react-three/drei";
import * as THREE from "three";
import { ImportedWorldModel } from "./ImportedWorldModel.jsx";

// ---------------------------------------------------------------------------
// Island layout – 5 islands spread around the ocean
// ---------------------------------------------------------------------------
export const ISLANDS = [
  { id: "about",    label: "About",    worldPos: new THREE.Vector3(  0,  0,   0), color: "#65d6ff" },
  { id: "skills",   label: "Skills",   worldPos: new THREE.Vector3( 68,  0, -62), color: "#7dffbe" },
  { id: "projects", label: "Projects", worldPos: new THREE.Vector3(-62,  0, -60), color: "#ffce6a" },
  { id: "resume",   label: "Resume",   worldPos: new THREE.Vector3( 72,  0,  58), color: "#ff8ccc" },
  { id: "contact",  label: "Contact",  worldPos: new THREE.Vector3(-72,  0,  56), color: "#b4a7ff" },
];

// ---------------------------------------------------------------------------
// Shared beach terrain used on every island
// y=-0.8 → sand surface aligns with player walk height (world y≈0.52)
// ---------------------------------------------------------------------------
function BeachTerrain({ rotation = [0, 0, 0] }) {
  return (
    <ImportedWorldModel
      url="/models/beach_003.glb"
      position={[0, -0.1, 0]}
      rotation={rotation}
      targetSize={26}
      yOffset={0}
    />
  );
}

// ---------------------------------------------------------------------------
// Coconut Tree — replaces all procedural Tree / PalmTree instances
// ---------------------------------------------------------------------------
function CoconutTree({ position, scale = 1, rotY = 0 }) {
  return (
    <ImportedWorldModel
      url="/models/coconut_tree.glb"
      position={position}
      rotation={[0, rotY, 0]}
      targetSize={4.1 * scale}
    />
  );
}

// ---------------------------------------------------------------------------
// Shared primitives (no external GLBs — fast render)
// ---------------------------------------------------------------------------
function Lantern({ position }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.68, 0]}>
        <cylinderGeometry args={[0.035, 0.045, 1.35, 8]} />
        <meshStandardMaterial color="#2b2118" />
      </mesh>
      <Float speed={2.2} floatIntensity={0.08}>
        <mesh position={[0, 1.42, 0]}>
          <sphereGeometry args={[0.13, 16, 12]} />
          <meshStandardMaterial color="#ffcc72" emissive="#ff9b2f" emissiveIntensity={2.2} />
        </mesh>
      </Float>
      <pointLight position={[0, 1.42, 0]} color="#ffb454" intensity={6} distance={6} />
    </group>
  );
}

function Barrel({ position, rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow>
        <cylinderGeometry args={[0.28, 0.24, 0.55, 10]} />
        <meshStandardMaterial color="#7a4f2e" roughness={0.82} />
      </mesh>
      {[-0.12, 0.12].map((y, i) => (
        <mesh key={i} position={[0, y, 0]}>
          <torusGeometry args={[0.265, 0.028, 8, 14]} />
          <meshStandardMaterial color="#3a2a1a" metalness={0.4} roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

function Totem({ position, color = "#c87941" }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.18, 0.22, 1.6, 8]} />
        <meshStandardMaterial color="#7a5632" roughness={0.8} />
      </mesh>
      <mesh castShadow position={[0, 1.85, 0]}>
        <cylinderGeometry args={[0.16, 0.18, 0.7, 8]} />
        <meshStandardMaterial color="#6b4828" roughness={0.78} />
      </mesh>
      <mesh castShadow position={[0, 1.9, 0.16]}>
        <boxGeometry args={[0.26, 0.22, 0.06]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} roughness={0.5} />
      </mesh>
      {[-0.07, 0.07].map((x, i) => (
        <mesh key={i} castShadow position={[x, 1.96, 0.19]}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshStandardMaterial color="#111" emissive="#ffdd44" emissiveIntensity={0.8} />
        </mesh>
      ))}
    </group>
  );
}

function Rock({ position, index }) {
  return (
    <mesh castShadow receiveShadow position={position} rotation={[0.4, index, 0.12]} scale={[0.9, 0.42, 0.65]}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#8d8d82" roughness={0.85} />
    </mesh>
  );
}

function Boulder({ position, scale = 1 }) {
  return (
    <mesh castShadow receiveShadow position={position} scale={scale}>
      <sphereGeometry args={[0.7, 7, 5]} />
      <meshStandardMaterial color="#9a9690" roughness={0.9} />
    </mesh>
  );
}

// Dock planks + piles – also used as ship-collision boundary
function Dock() {
  return (
    <group position={[0, 0.06, 9.8]}>
      {Array.from({ length: 9 }).map((_, index) => (
        <mesh key={index} castShadow receiveShadow position={[0, 0.08, index * 0.82]} scale={[2.2, 0.16, 0.31]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={index % 2 ? "#8a6242" : "#765438"} roughness={0.78} />
        </mesh>
      ))}
      {[-1.2, 1.2].map((x) =>
        [0.1, 3.2, 6.2].map((z) => (
          <mesh key={`${x}-${z}`} castShadow position={[x, 0.62, z]}>
            <cylinderGeometry args={[0.09, 0.11, 1.3, 8]} />
            <meshStandardMaterial color="#4f3827" />
          </mesh>
        ))
      )}
    </group>
  );
}

// ---------------------------------------------------------------------------
// About Island
// ---------------------------------------------------------------------------
function AboutIsland() {
  return (
    <group>
      <BeachTerrain />
      <Dock />
      <ImportedWorldModel
        url="/models/harbor_house_fixed.glb"
        position={[0, 0.52, -1.5]}
        rotation={[0, -0.12, 0]}
        targetSize={9.4}
      />
      <Totem position={[-4.2, 0.52, 1.2]} color="#65d6ff" />
      <Totem position={[ 4.0, 0.52, 0.8]} color="#65d6ff" />
      <Barrel position={[-2.8, 0.52, 7.5]} />
      <Barrel position={[-2.2, 0.52, 7.6]} rotation={[1.5, 0, 0.3]} />
      <Barrel position={[ 2.5, 0.52, 7.4]} />
      <Lantern position={[-1.4, 0.52, 10.0]} />
      <Lantern position={[ 1.4, 0.52, 10.0]} />
      <CoconutTree position={[ 5.6, 0.52, -4.7]} scale={1.2} rotY={0.4} />
      <CoconutTree position={[ 7.7, 0.52,  1.4]} scale={0.95} rotY={1.1} />
      <CoconutTree position={[-7.8, 0.52,  5.1]} scale={1.1} rotY={2.5} />
      <CoconutTree position={[-1.8, 0.52, -8.1]} scale={0.9} rotY={0.8} />
      {[[8, 0.52, 5], [-9, 0.52, -2], [3, 0.52, -8], [-5, 0.52, 7]].map((pos, i) => (
        <Rock key={i} position={pos} index={i} />
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Skills Island — observatory tower theme
// ---------------------------------------------------------------------------
function SkillsIsland() {
  return (
    <group>
      <BeachTerrain rotation={[0, 0.8, 0]} />
      <Dock />
      <ImportedWorldModel
        url="/models/harbor_house_fixed.glb"
        position={[-3.5, 0.52, -3.5]}
        rotation={[0, 1.2, 0]}
        targetSize={9.4}
      />
      <Totem position={[0,   0.52, -2.0]} color="#7dffbe" />
      <Totem position={[0,   2.22, -2.0]} color="#7dffbe" />
      <Totem position={[0,   3.92, -2.0]} color="#7dffbe" />
      <mesh position={[0, 5.72, -2.0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.1, 0.06, 8, 24]} />
        <meshStandardMaterial color="#7dffbe" emissive="#7dffbe" emissiveIntensity={1.4} />
      </mesh>
      <pointLight position={[0, 5.72, -2.0]} color="#7dffbe" intensity={12} distance={10} />
      <CoconutTree position={[ 4.5, 0.52,  2.5]} scale={1.3} rotY={0.0} />
      <CoconutTree position={[-4.5, 0.52,  2.0]} scale={1.1} rotY={1.8} />
      <CoconutTree position={[ 2.0, 0.52, -5.5]} scale={0.9} rotY={3.0} />
      <Barrel position={[ 3.0, 0.52, -1.0]} />
      <Barrel position={[ 3.5, 0.52, -1.2]} rotation={[0, 0.5, 0]} />
      <Lantern position={[-1.2, 0.52, 9.8]} />
      <Lantern position={[ 1.2, 0.52, 9.8]} />
      {[[7, 0.52, -3], [-7, 0.52, 4]].map((pos, i) => <Rock key={i} position={pos} index={i + 2} />)}
      <Boulder position={[-3.0, 0.52, -4.0]} scale={0.9} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// Projects Island
// ---------------------------------------------------------------------------
function ProjectsIsland() {
  return (
    <group>
      <BeachTerrain rotation={[0, 1.6, 0]} />
      <Dock />
      <ImportedWorldModel
        url="/models/harbor_house_fixed.glb"
        position={[0.5, 0.52, -2.0]}
        rotation={[0, -0.75, 0]}
        targetSize={9.4}
      />
      <Totem position={[ 4.5, 0.52, 1.5]} color="#ffce6a" />
      <Barrel position={[-2.5, 0.52, 1.2]} />
      <Barrel position={[-2.0, 0.52, 0.8]} rotation={[0, 0.8, 0]} />
      <Barrel position={[-3.0, 0.52, 0.6]} rotation={[1.4, 0, 0.2]} />
      <Lantern position={[-1.2, 0.52, 9.8]} />
      <Lantern position={[ 1.2, 0.52, 9.8]} />
      <CoconutTree position={[-5, 0.52,  3]} scale={1.0} rotY={2.2} />
      <CoconutTree position={[ 5, 0.52, -4]} scale={1.15} rotY={0.6} />
      <CoconutTree position={[-4.5, 0.52, -3.5]} scale={1.0} rotY={1.3} />
      {[[6, 0.52, 5], [-6, 0.52, -3]].map((pos, i) => <Rock key={i} position={pos} index={i + 4} />)}
      <Boulder position={[ 5.5, 0.52, 3.0]} scale={1.1} />
      <Boulder position={[-4.0, 0.52, 5.0]} scale={0.7} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// Resume Island
// ---------------------------------------------------------------------------
function ResumeIsland() {
  return (
    <group>
      <BeachTerrain rotation={[0, 2.4, 0]} />
      <Dock />
      <ImportedWorldModel
        url="/models/harbor_house_fixed.glb"
        position={[3.5, 0.52, 1.5]}
        rotation={[0, -0.8, 0]}
        targetSize={9.4}
      />
      {[-1.2, 1.2].map((x, i) => (
        <mesh key={i} castShadow position={[x, 0.52 + 1.1, -2.0]} scale={[0.32, 2.2, 0.32]}>
          <boxGeometry />
          <meshStandardMaterial color="#7a7868" roughness={0.9} />
        </mesh>
      ))}
      <mesh castShadow position={[0, 0.52 + 2.38, -2.0]} scale={[2.82, 0.32, 0.32]}>
        <boxGeometry />
        <meshStandardMaterial color="#7a7868" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0, 0.52 + 0.65, -3.2]} rotation={[-0.25, 0, 0]}>
        <boxGeometry args={[1.6, 1.1, 0.1]} />
        <meshStandardMaterial color="#e8d8a0" roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.52 + 0.65, -3.14]} rotation={[-0.25, 0, 0]}>
        <boxGeometry args={[1.4, 0.9, 0.01]} />
        <meshStandardMaterial color="#ff8ccc" emissive="#ff8ccc" emissiveIntensity={0.3} />
      </mesh>
      <pointLight position={[0, 2.1, -3.0]} color="#ff8ccc" intensity={8} distance={7} />
      <Totem position={[-4.5, 0.52, 0.5]} color="#ff8ccc" />
      <Totem position={[ 4.5, 0.52, 0.5]} color="#ff8ccc" />
      <Lantern position={[-1.2, 0.52, 9.6]} />
      <Lantern position={[ 1.2, 0.52, 9.6]} />
      <CoconutTree position={[4.5, 0.52,  3]} scale={1.0} rotY={0.9} />
      <CoconutTree position={[-5, 0.52, -4]} scale={0.9} rotY={2.8} />
      <CoconutTree position={[-3.5, 0.52, 4.0]} scale={1.1} rotY={1.5} />
      {[[6, 0.52, -3], [-6, 0.52, 4]].map((pos, i) => <Rock key={i} position={pos} index={i + 6} />)}
      <Boulder position={[ 3.0, 0.52, -5.5]} scale={0.85} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// Contact Island — beacon fire theme
// ---------------------------------------------------------------------------
function ContactIsland() {
  return (
    <group>
      <BeachTerrain rotation={[0, 3.2, 0]} />
      <Dock />
      <ImportedWorldModel
        url="/models/harbor_house_fixed.glb"
        position={[-3.5, 0.52, 1.5]}
        rotation={[0, 2.2, 0]}
        targetSize={9.4}
      />
      <mesh castShadow position={[0, 0.52 + 0.16, -2.5]}>
        <cylinderGeometry args={[0.8, 1.0, 0.32, 10]} />
        <meshStandardMaterial color="#5a4530" roughness={0.85} />
      </mesh>
      {[0, 1.05, 2.1].map((angle, i) => (
        <mesh key={i} castShadow
          position={[Math.cos(angle) * 0.5, 0.52 + 0.34, -2.5 + Math.sin(angle) * 0.5]}
          rotation={[0.4, angle, 0.5]}
        >
          <cylinderGeometry args={[0.08, 0.09, 0.9, 6]} />
          <meshStandardMaterial color="#4a2f18" roughness={0.9} />
        </mesh>
      ))}
      <Float speed={3} floatIntensity={0.18}>
        <mesh position={[0, 0.52 + 0.75, -2.5]}>
          <coneGeometry args={[0.32, 0.9, 6]} />
          <meshStandardMaterial color="#ff6b2b" emissive="#ff4500" emissiveIntensity={2.8} transparent opacity={0.75} />
        </mesh>
      </Float>
      <pointLight position={[0, 2.1, -2.5]} color="#ff8844" intensity={24} distance={14} />
      <Totem position={[-4.0, 0.52, -1.5]} color="#b4a7ff" />
      <Totem position={[ 4.0, 0.52, -1.5]} color="#b4a7ff" />
      <CoconutTree position={[ 3.5, 0.52, -4.5]} scale={1.2} rotY={0.2} />
      <CoconutTree position={[-3.5, 0.52, -3.5]} scale={1.0} rotY={2.0} />
      <CoconutTree position={[ 0.5, 0.52, -6.0]} scale={0.9} rotY={1.1} />
      <Lantern position={[-1.2, 0.52, 9.6]} />
      <Lantern position={[ 1.2, 0.52, 9.6]} />
      {[[5, 0.52, 4], [-5, 0.52, -4], [0, 0.52, -6]].map((pos, i) => <Rock key={i} position={pos} index={i + 8} />)}
      <Boulder position={[-3.0, 0.52, 4.5]} scale={0.8} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// Master export
// ---------------------------------------------------------------------------
const ISLAND_COMPONENTS = [AboutIsland, SkillsIsland, ProjectsIsland, ResumeIsland, ContactIsland];

export function Island() {
  return (
    <>
      {ISLANDS.map((island, index) => {
        const Comp = ISLAND_COMPONENTS[index];
        return (
          <group key={island.id} position={[island.worldPos.x, -0.18, island.worldPos.z]}>
            <Comp />
          </group>
        );
      })}
    </>
  );
}
