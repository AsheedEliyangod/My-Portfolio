import { Float, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { isPhoneDevice } from "../utils/device.js";
import { ImportedWorldModel } from "./ImportedWorldModel.jsx";

export const ISLANDS = [
  { id: "about", label: "Developer House", worldPos: new THREE.Vector3(-46, 0, -46), color: "#7df9ff" },
  { id: "projects", label: "Project Foundry", worldPos: new THREE.Vector3(-72, 0, 10), color: "#ffb86b" },
  { id: "skills", label: "Neon Tech District", worldPos: new THREE.Vector3(64, 0, -20), color: "#72ffb7" },
  { id: "resume", label: "Certification Observatory", worldPos: new THREE.Vector3(-34, 0, 62), color: "#ff7edb" },
  { id: "contact", label: "Comms Spire", worldPos: new THREE.Vector3(58, 0, 56), color: "#b8a8ff" },
];

const SECRET_LOCATIONS = [
  { label: "Hidden shader shrine", position: [18, 0.2, -82], color: "#7df9ff" },
  { label: "Abandoned build cache", position: [-78, 0.2, -58], color: "#ff7edb" },
  { label: "Quiet render lookout", position: [84, 0.2, 22], color: "#ffb86b" },
];

function seeded(index) {
  return THREE.MathUtils.euclideanModulo(Math.sin(index * 91.17) * 43758.5453, 1);
}

function makeTerrainTexture() {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  const image = ctx.createImageData(canvas.width, canvas.height);
  for (let y = 0; y < canvas.height; y += 1) {
    for (let x = 0; x < canvas.width; x += 1) {
      const n1 = Math.sin(x * 0.07) * Math.cos(y * 0.05);
      const n2 = Math.sin((x + y) * 0.025);
      const n3 = seeded(x + y * canvas.width);
      const v = 0.5 + n1 * 0.18 + n2 * 0.16 + (n3 - 0.5) * 0.18;
      const i = (y * canvas.width + x) * 4;
      image.data[i] = 33 + v * 34;
      image.data[i + 1] = 43 + v * 46;
      image.data[i + 2] = 30 + v * 26;
      image.data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(5, 5);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeSandTexture() {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  const image = ctx.createImageData(canvas.width, canvas.height);
  for (let y = 0; y < canvas.height; y += 1) {
    for (let x = 0; x < canvas.width; x += 1) {
      const n = Math.sin(x * 0.12) * 0.12 + Math.cos(y * 0.09) * 0.1 + (seeded(x * 3 + y * 11) - 0.5) * 0.24;
      const wet = Math.sin((x + y) * 0.018) * 0.08;
      const i = (y * canvas.width + x) * 4;
      image.data[i] = 132 + (n + wet) * 38;
      image.data[i + 1] = 112 + n * 30;
      image.data[i + 2] = 77 + n * 22;
      image.data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 8);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function terrainHeight(x, z) {
  const center = new THREE.Vector2(0, 8);
  const radius = Math.hypot(x - center.x, z - center.y);
  const northRidge = Math.exp(-((x - 26) ** 2 + (z + 52) ** 2) / 1450) * 5.8;
  const westCliff = Math.exp(-((x + 78) ** 2 + (z + 20) ** 2) / 920) * 4.5;
  const forestHill = Math.exp(-((x - 8) ** 2 + (z + 74) ** 2) / 1200) * 3.8;
  const softRoll = Math.sin(x * 0.055) * Math.cos(z * 0.045) * 0.9;
  const detail = Math.sin((x + z) * 0.16) * 0.22 + Math.cos((x - z) * 0.11) * 0.18;
  const beachFalloff = THREE.MathUtils.smoothstep(radius, 90, 116) * 3.8;
  const rawHeight = northRidge + westCliff + forestHill + softRoll + detail - beachFalloff - 0.2;
  const shelfBlend = THREE.MathUtils.smoothstep(radius, 82, 104);
  const coastDrop = THREE.MathUtils.smoothstep(radius, 104, 118) * 1.55;
  const coastalFloor = THREE.MathUtils.lerp(0.22, -0.1, shelfBlend) - coastDrop;
  return Math.max(rawHeight, coastalFloor);
}

function makeCoastBandGeometry({ inner, outer, thetaStart, thetaLength, radialSegments = 3, angleSegments = 160, lift = 0.018 }) {
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];

  for (let a = 0; a <= angleSegments; a += 1) {
    const angleT = a / angleSegments;
    const theta = thetaStart + thetaLength * angleT;
    for (let r = 0; r <= radialSegments; r += 1) {
      const radiusT = r / radialSegments;
      const radius = THREE.MathUtils.lerp(inner, outer, radiusT);
      const x = Math.cos(theta) * radius;
      const z = 8 + Math.sin(theta) * radius;
      positions.push(x, terrainHeight(x, z) + lift, z);
      normals.push(0, 1, 0);
      uvs.push(angleT, radiusT);
    }
  }

  const row = radialSegments + 1;
  for (let a = 0; a < angleSegments; a += 1) {
    for (let r = 0; r < radialSegments; r += 1) {
      const i = a * row + r;
      indices.push(i, i + row, i + 1, i + 1, i + row, i + row + 1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function Terrain() {
  const texture = useMemo(() => makeTerrainTexture(), []);
  const geometry = useMemo(() => {
    const geo = new THREE.CircleGeometry(118, 192);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i += 1) {
      const x = pos.getX(i);
      const z = pos.getZ(i) + 8;
      pos.setY(i, terrainHeight(x, z));
      pos.setZ(i, z);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <mesh receiveShadow geometry={geometry}>
      <meshStandardMaterial
        map={texture}
        color="#2f3d2a"
        roughness={0.94}
        metalness={0.02}
      />
    </mesh>
  );
}

function Road({ from, to, width = 2.0, color = "#24272a" }) {
  const dx = to[0] - from[0];
  const dz = to[1] - from[1];
  const length = Math.hypot(dx, dz);
  const mid = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2];
  const rotation = Math.atan2(dx, dz);
  return (
    <mesh receiveShadow position={[mid[0], 0.17, mid[1]]} rotation={[0, rotation, 0]} scale={[width, 0.04, length]}>
      <boxGeometry />
      <meshStandardMaterial color={color} roughness={0.7} metalness={0.08} />
    </mesh>
  );
}

function NeonStrip({ position, rotation = [0, 0, 0], color = "#7df9ff", size = [3, 0.05, 0.05] }) {
  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3.2} toneMapped={false} />
    </mesh>
  );
}

function LightBeam({ position, color = "#7df9ff", height = 10, radius = 2.8 }) {
  return (
    <mesh position={position} rotation={[Math.PI, 0, 0]}>
      <coneGeometry args={[radius, height, 32, 1, true]} />
      <meshBasicMaterial color={color} transparent opacity={0.08} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  );
}

function StreetLight({ position, rotation = 0, color = "#ffd19a" }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh castShadow position={[0, 2.1, 0]}>
        <cylinderGeometry args={[0.07, 0.1, 4.2, 12]} />
        <meshStandardMaterial color="#16181a" roughness={0.42} metalness={0.7} />
      </mesh>
      <mesh castShadow position={[0, 4.25, 0.44]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.055, 0.055, 0.95, 12]} />
        <meshStandardMaterial color="#16181a" roughness={0.38} metalness={0.75} />
      </mesh>
      <mesh position={[0, 4.25, 0.9]}>
        <sphereGeometry args={[0.18, 16, 10]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.4} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 4.1, 0.9]} color={color} intensity={5.6} distance={15} />
      <LightBeam position={[0, 3.0, 0.9]} color={color} height={5.2} radius={1.9} />
    </group>
  );
}

function StreetLighting() {
  const lights = [
    [-2.8, 78, 0], [2.8, 65, Math.PI], [-2.8, 51, 0], [2.8, 38, Math.PI],
    [-10, 22, -0.6], [-23, 6, -0.6], [-39, -15, -0.6], [-55, -34, -0.6],
    [14, 17, 0.78], [29, 7, 0.78], [45, -6, 0.78], [58, -16, 0.78],
    [-22, 45, -0.8], [-30, 56, -0.8], [20, 42, 1.15], [40, 50, 1.15],
  ];

  return (
    <group>
      {lights.map(([x, z, rot], index) => (
        <StreetLight key={index} position={[x, 0.2, z]} rotation={rot} color={index % 4 === 0 ? "#8df7ff" : "#ffd19a"} />
      ))}
    </group>
  );
}

function AsphaltNetwork() {
  return (
    <group>
      <Road from={[0, 93]} to={[0, 18]} width={2.7} />
      <Road from={[0, 18]} to={[-46, -46]} width={2.2} />
      <Road from={[-18, 28]} to={[-72, 10]} width={2.05} />
      <Road from={[0, 18]} to={[64, -20]} width={2.15} />
      <Road from={[-8, 36]} to={[-34, 62]} width={1.9} />
      <Road from={[8, 36]} to={[58, 56]} width={1.9} />
      <Road from={[-72, 10]} to={[-84, -40]} width={1.35} color="#1f2623" />
      <Road from={[64, -20]} to={[88, 24]} width={1.35} color="#1f2623" />
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.19, 18]}>
        <ringGeometry args={[7.2, 9.5, 128]} />
        <meshStandardMaterial color="#202429" roughness={0.66} metalness={0.12} />
      </mesh>
    </group>
  );
}

function GlassTower({ position, height = 10, color = "#7df9ff", scale = [4, 1, 4] }) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow position={[0, height / 2, 0]} scale={[scale[0], height, scale[2]]}>
        <boxGeometry />
        <meshStandardMaterial color="#10151c" roughness={0.26} metalness={0.56} />
      </mesh>
      <mesh position={[0, height * 0.56, scale[2] / 2 + 0.035]} scale={[scale[0] * 0.74, height * 0.54, 0.06]}>
        <boxGeometry />
        <meshStandardMaterial color="#070b10" emissive={color} emissiveIntensity={0.32} roughness={0.12} metalness={0.7} transparent opacity={0.72} />
      </mesh>
      {[0.25, 0.5, 0.75].map((p) => (
        <NeonStrip key={p} position={[0, height * p, scale[2] / 2 + 0.08]} color={color} size={[scale[0] * 0.8, 0.06, 0.06]} />
      ))}
      <pointLight position={[0, height * 0.72, 2.2]} color={color} intensity={8} distance={height * 2.2} />
    </group>
  );
}

function DeveloperHouse() {
  return (
    <group position={[-46, 0.22, -46]}>
      <mesh castShadow receiveShadow position={[0, 2.2, 0]} scale={[12, 4.4, 8]}>
        <boxGeometry />
        <meshStandardMaterial color="#111820" roughness={0.24} metalness={0.5} />
      </mesh>
      <mesh castShadow position={[-2, 5.1, -0.6]} rotation={[0, 0, -0.11]} scale={[13.2, 0.42, 8.8]}>
        <boxGeometry />
        <meshStandardMaterial color="#242b32" roughness={0.34} metalness={0.64} />
      </mesh>
      <mesh position={[0, 2.35, 4.05]} scale={[9.6, 2.4, 0.08]}>
        <boxGeometry />
        <meshStandardMaterial color="#0c141a" emissive="#6de8ff" emissiveIntensity={0.34} metalness={0.8} roughness={0.14} transparent opacity={0.75} />
      </mesh>
      <mesh receiveShadow position={[0, 0.02, 6.8]} scale={[13, 0.06, 7]}>
        <boxGeometry />
        <meshStandardMaterial color="#15181a" roughness={0.72} metalness={0.1} />
      </mesh>
      <NeonStrip position={[0, 5.48, 4.46]} color="#7df9ff" size={[11.5, 0.08, 0.08]} />
      <Text position={[0, 5.88, 4.55]} fontSize={0.58} color="#eafcff" anchorX="center" anchorY="middle">
        DEV HOUSE
      </Text>
      <ImportedWorldModel url="/models/stan_house_fixed.glb" position={[9.5, 0.2, -5.5]} rotation={[0, -0.52, 0]} targetSize={8.5} />
      <pointLight position={[-3.8, 2.2, 4.8]} color="#ffc98a" intensity={9} distance={18} />
      <LightBeam position={[0, 4.4, 5.2]} color="#7df9ff" height={8} radius={3.2} />
      <pointLight position={[0, 5.4, 5.2]} color="#7df9ff" intensity={18} distance={28} />
    </group>
  );
}

function ProjectFoundry() {
  return (
    <group position={[-72, 0.32, 10]}>
      <mesh castShadow receiveShadow position={[0, 2.8, 0]} scale={[15, 5.6, 10]}>
        <boxGeometry />
        <meshStandardMaterial color="#17191c" roughness={0.42} metalness={0.42} />
      </mesh>
      <mesh position={[0, 3.25, 5.05]} scale={[12.8, 2.25, 0.08]}>
        <boxGeometry />
        <meshStandardMaterial color="#080b10" emissive="#ffb86b" emissiveIntensity={0.58} metalness={0.35} roughness={0.2} />
      </mesh>
      <Text position={[0, 3.32, 5.14]} fontSize={0.54} color="#fff1df" anchorX="center" anchorY="middle">
        PROJECT FOUNDRY
      </Text>
      <NeonStrip position={[0, 5.95, 5.28]} color="#ffb86b" size={[14.2, 0.1, 0.1]} />
      <spotLight position={[0, 8.8, 7.6]} color="#ffb86b" intensity={22} distance={30} angle={0.5} penumbra={0.85} />
      <LightBeam position={[0, 6.0, 6.0]} color="#ffb86b" height={10} radius={4.6} />
      <ImportedWorldModel url="/models/astronomers_abode_fixed.glb" position={[-12, 0.28, -8]} rotation={[0, 0.8, 0]} targetSize={10} />
    </group>
  );
}

function TechDistrict() {
  const buildings = [
    [-10, 2, 12, "#72ffb7", [4.2, 1, 4.2]],
    [-3, -4, 18, "#7df9ff", [4.8, 1, 4.8]],
    [6, -1, 14, "#b8a8ff", [4.1, 1, 4.1]],
    [13, 5, 10, "#ff7edb", [3.8, 1, 3.8]],
    [3, 8, 8, "#ffb86b", [3.6, 1, 3.6]],
  ];
  return (
    <group position={[64, 0.32, -20]}>
      {buildings.map(([x, z, h, color, scale]) => (
        <GlassTower key={`${x}-${z}`} position={[x, 0, z]} height={h} color={color} scale={scale} />
      ))}
      <mesh receiveShadow position={[2, 0.04, 1]} scale={[21, 0.05, 18]}>
        <boxGeometry />
        <meshStandardMaterial color="#101519" roughness={0.68} metalness={0.14} />
      </mesh>
      <Text position={[2, 6.6, 10.3]} fontSize={0.52} color="#f2fffb" anchorX="center" anchorY="middle">
        NEON TECH DISTRICT
      </Text>
      <LightBeam position={[0, 8, 2]} color="#72ffb7" height={14} radius={6.4} />
    </group>
  );
}

function CertificationObservatory() {
  const ring = useRef();
  useFrame(({ clock }) => {
    if (ring.current) ring.current.rotation.y = clock.elapsedTime * 0.34;
  });
  return (
    <group position={[-34, 0.5, 62]}>
      <ImportedWorldModel url="/models/astronomers_abode_fixed.glb" position={[0, 0, 0]} rotation={[0, -0.35, 0]} targetSize={16} />
      <mesh castShadow receiveShadow position={[0, 2.2, 7.2]} scale={[11, 4.4, 3]}>
        <boxGeometry />
        <meshStandardMaterial color="#1a1520" roughness={0.48} metalness={0.28} />
      </mesh>
      <mesh position={[0, 2.6, 8.76]} scale={[8.8, 1.9, 0.08]}>
        <boxGeometry />
        <meshStandardMaterial color="#ff7edb" emissive="#ff7edb" emissiveIntensity={0.82} toneMapped={false} />
      </mesh>
      <Text position={[0, 2.62, 8.86]} fontSize={0.42} color="#210818" anchorX="center" anchorY="middle">
        CERTS / RESUME
      </Text>
      <group ref={ring} position={[0, 8.2, -1]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[4.6, 0.04, 12, 128]} />
          <meshStandardMaterial color="#ff7edb" emissive="#ff7edb" emissiveIntensity={2.4} toneMapped={false} />
        </mesh>
      </group>
      <pointLight position={[0, 6, 6]} color="#ff7edb" intensity={12} distance={24} />
      <LightBeam position={[0, 7.5, 7.5]} color="#ff7edb" height={10} radius={4.8} />
    </group>
  );
}

function CommsSpire() {
  const ring = useRef();
  useFrame(({ clock }) => {
    if (ring.current) ring.current.rotation.y = clock.elapsedTime * 0.55;
  });
  return (
    <group position={[58, 0.32, 56]}>
      <mesh castShadow receiveShadow position={[0, 6.6, 0]} scale={[3.4, 13.2, 3.4]}>
        <cylinderGeometry args={[1, 1.35, 1, 20]} />
        <meshStandardMaterial color="#141925" roughness={0.32} metalness={0.52} />
      </mesh>
      <group ref={ring} position={[0, 13.9, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[5.6, 0.055, 10, 128]} />
          <meshStandardMaterial color="#b8a8ff" emissive="#b8a8ff" emissiveIntensity={2.8} toneMapped={false} />
        </mesh>
      </group>
      <Text position={[0, 7.6, 2.55]} fontSize={0.45} color="#f4f0ff" anchorX="center" anchorY="middle">
        CONTACT UPLINK
      </Text>
      <pointLight position={[0, 13, 0]} color="#b8a8ff" intensity={18} distance={32} />
      <LightBeam position={[0, 10.5, 0]} color="#b8a8ff" height={16} radius={5.2} />
    </group>
  );
}

function ForestTree({ position, scale = 1, rotation = 0 }) {
  return (
    <group position={position} scale={scale} rotation={[0, rotation, 0]}>
      <mesh castShadow position={[0, 1.7, 0]}>
        <cylinderGeometry args={[0.22, 0.36, 3.4, 12]} />
        <meshStandardMaterial color="#261b12" roughness={0.9} />
      </mesh>
      {[2.9, 3.9, 4.85].map((y, i) => (
        <mesh key={y} castShadow position={[0, y, 0]} scale={[1 - i * 0.16, 1.1, 1 - i * 0.16]}>
          <coneGeometry args={[1.55, 2.35, 16]} />
          <meshStandardMaterial color={i === 0 ? "#16291a" : "#0f2117"} roughness={0.82} />
        </mesh>
      ))}
    </group>
  );
}

function Bush({ position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      {[0, 1.7, 3.4].map((angle, index) => (
        <mesh key={angle} castShadow position={[Math.cos(angle) * 0.42, 0.42, Math.sin(angle) * 0.34]} scale={[1.1, 0.62, 0.85]}>
          <sphereGeometry args={[0.72, 12, 8]} />
          <meshStandardMaterial color={index === 0 ? "#1d3b25" : "#18321f"} roughness={0.88} />
        </mesh>
      ))}
    </group>
  );
}

function GrassTufts() {
  const ref = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const isPhone = useMemo(() => isPhoneDevice(), []);
  const tufts = useMemo(() => {
    const count = isPhone ? 110 : 320;
    return Array.from({ length: count }, (_, index) => {
      const angle = seeded(index + 2400) * Math.PI * 2;
      const radius = 12 + seeded(index + 2500) * 78;
      const x = Math.cos(angle) * radius;
      const z = 8 + Math.sin(angle) * radius;
      return {
        x,
        z,
        scale: 0.45 + seeded(index + 2600) * 0.65,
        rot: seeded(index + 2700) * Math.PI * 2
      };
    });
  }, [isPhone]);

  useEffect(() => {
    if (!ref.current) return;
    tufts.forEach((tuft, index) => {
      dummy.position.set(tuft.x, terrainHeight(tuft.x, tuft.z) + 0.2, tuft.z);
      dummy.rotation.set(0.08, tuft.rot, -0.05);
      dummy.scale.set(tuft.scale, tuft.scale, tuft.scale);
      dummy.updateMatrix();
      ref.current.setMatrixAt(index, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  }, [dummy, tufts]);

  return (
    <instancedMesh ref={ref} args={[null, null, tufts.length]} castShadow receiveShadow>
      <coneGeometry args={[0.055, 0.52, 5]} />
      <meshStandardMaterial color="#28462d" roughness={0.86} metalness={0.01} />
    </instancedMesh>
  );
}

function RockField() {
  const rocks = useMemo(() => {
    return Array.from({ length: 55 }, (_, index) => {
      const angle = seeded(index + 600) * Math.PI * 2;
      const radius = 48 + seeded(index + 700) * 62;
      return {
        position: [
          Math.cos(angle) * radius,
          -0.05,
          8 + Math.sin(angle) * radius,
        ],
        scale: [0.7 + seeded(index) * 2.4, 0.45 + seeded(index + 1) * 1.2, 0.7 + seeded(index + 2) * 2.2],
        rotation: [seeded(index + 3) * 0.7, seeded(index + 4) * Math.PI, seeded(index + 5) * 0.45],
      };
    });
  }, []);

  return (
    <group>
      {rocks.map((rock, index) => (
        <mesh key={index} castShadow receiveShadow position={rock.position} rotation={rock.rotation} scale={rock.scale}>
          <dodecahedronGeometry args={[1, 1]} />
          <meshStandardMaterial color={index % 3 === 0 ? "#59605c" : "#454b48"} roughness={0.9} metalness={0.04} />
        </mesh>
      ))}
    </group>
  );
}

function ForestAndFoliage() {
  const isPhone = useMemo(() => isPhoneDevice(), []);
  const treeCount = isPhone ? 70 : 180;
  const bushCount = isPhone ? 70 : 170;

  const trees = useMemo(() => {
    return Array.from({ length: treeCount }, (_, index) => {
      const cluster = index % 3;
      const base = cluster === 0 ? [-10, -72] : cluster === 1 ? [62, 18] : [-62, -36];
      const spread = cluster === 0 ? [48, 30] : cluster === 1 ? [34, 56] : [30, 35];
      const x = base[0] + (seeded(index) - 0.5) * spread[0];
      const z = base[1] + (seeded(index + 100) - 0.5) * spread[1];
      return { x, z, scale: 0.72 + seeded(index + 200) * 0.92, rot: seeded(index + 300) * Math.PI * 2 };
    });
  }, [treeCount]);

  const bushes = useMemo(() => {
    return Array.from({ length: bushCount }, (_, index) => {
      const angle = seeded(index + 900) * Math.PI * 2;
      const radius = 18 + seeded(index + 940) * 88;
      const x = Math.cos(angle) * radius;
      const z = 8 + Math.sin(angle) * radius;
      return { x, z, scale: 0.45 + seeded(index + 950) * 0.9 };
    });
  }, [bushCount]);

  return (
    <group>
      {trees.map((tree, index) => (
        <ForestTree key={index} position={[tree.x, 0.1, tree.z]} scale={tree.scale} rotation={tree.rot} />
      ))}
      {bushes.map((bush, index) => (
        <Bush key={index} position={[bush.x, 0.12, bush.z]} scale={bush.scale} />
      ))}
      <ImportedWorldModel url="/models/coconut_tree.glb" position={[-16, 0.15, 82]} rotation={[0, 0.4, 0]} targetSize={11} />
      <ImportedWorldModel url="/models/coconut_tree.glb" position={[13, 0.15, 88]} rotation={[0, 1.2, 0]} targetSize={12} />
      <ImportedWorldModel url="/models/coconut_tree.glb" position={[28, 0.15, 77]} rotation={[0, -0.7, 0]} targetSize={10} />
    </group>
  );
}

function HarborPost({ position, tall = false }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, tall ? 0.82 : 0.58, 0]}>
        <cylinderGeometry args={[0.16, 0.22, tall ? 1.64 : 1.16, 12]} />
        <meshStandardMaterial color="#24180f" roughness={0.86} metalness={0.04} />
      </mesh>
      <mesh castShadow position={[0, tall ? 1.68 : 1.2, 0]}>
        <sphereGeometry args={[0.19, 12, 8]} />
        <meshStandardMaterial color="#51341f" roughness={0.72} />
      </mesh>
    </group>
  );
}

function DockLamp({ position }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.055, 0.075, 2.4, 10]} />
        <meshStandardMaterial color="#18120d" roughness={0.48} metalness={0.42} />
      </mesh>
      <mesh position={[0, 2.54, 0]}>
        <sphereGeometry args={[0.2, 16, 10]} />
        <meshStandardMaterial color="#ffd39a" emissive="#ffad55" emissiveIntensity={2.8} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 2.45, 0]} color="#ffc47d" intensity={8} distance={16} />
      <LightBeam position={[0, 1.9, 0]} color="#ffc47d" height={4.4} radius={1.4} />
    </group>
  );
}

function RopeLine({ position, rotation = [Math.PI / 2, 0, 0], length = 3.5 }) {
  return (
    <mesh castShadow position={position} rotation={rotation}>
      <cylinderGeometry args={[0.045, 0.045, length, 8]} />
      <meshStandardMaterial color="#8a6748" roughness={0.92} metalness={0.02} />
    </mesh>
  );
}

function HarborCrates({ position }) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow position={[0, 0.28, 0]} scale={[1.15, 0.56, 1.05]}>
        <boxGeometry />
        <meshStandardMaterial color="#5a3f28" roughness={0.82} metalness={0.03} />
      </mesh>
      <mesh castShadow receiveShadow position={[1.03, 0.18, 0.44]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.35, 0.35, 0.7, 16]} />
        <meshStandardMaterial color="#4a3020" roughness={0.84} />
      </mesh>
      <mesh castShadow receiveShadow position={[-0.78, 0.2, -0.62]} rotation={[Math.PI / 2, 0.25, 0]}>
        <cylinderGeometry args={[0.28, 0.32, 0.58, 14]} />
        <meshStandardMaterial color="#3d2a1d" roughness={0.86} />
      </mesh>
    </group>
  );
}

function HarborBoat({ position, rotation = 0, color = "#17212a" }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh castShadow receiveShadow position={[0, 0.28, 0]} scale={[1.2, 0.34, 3.2]}>
        <capsuleGeometry args={[0.62, 1.8, 5, 16]} />
        <meshStandardMaterial color={color} roughness={0.46} metalness={0.18} />
      </mesh>
      <mesh castShadow position={[0, 0.58, 0.1]} scale={[0.86, 0.22, 1.45]}>
        <boxGeometry />
        <meshStandardMaterial color="#d7c7ac" roughness={0.62} metalness={0.04} />
      </mesh>
      <mesh position={[0, 0.72, -0.92]} scale={[0.5, 0.05, 0.52]}>
        <boxGeometry />
        <meshStandardMaterial color="#7df9ff" emissive="#4cecff" emissiveIntensity={1.2} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Harbor() {
  return (
    <group position={[0, 0.08, 92]}>
      <mesh receiveShadow position={[0, -0.17, 8.5]} scale={[34, 0.08, 33]}>
        <boxGeometry />
        <meshStandardMaterial color="#292d2b" roughness={0.92} metalness={0.04} />
      </mesh>
      {[-16, -11, 11, 16].map((x, index) => (
        <mesh key={`riprap-${index}`} castShadow receiveShadow position={[x, 0.05, 5 + seeded(index + 3100) * 18]} rotation={[0.14, seeded(index + 3200) * Math.PI, -0.08]} scale={[3.8, 1.1, 2.4]}>
          <dodecahedronGeometry args={[1, 1]} />
          <meshStandardMaterial color="#3d4440" roughness={0.95} metalness={0.03} />
        </mesh>
      ))}
      <mesh receiveShadow position={[0, -0.08, -7.2]} scale={[25, 0.42, 9.2]}>
        <boxGeometry />
        <meshStandardMaterial color="#34312d" roughness={0.9} metalness={0.04} />
      </mesh>
      {Array.from({ length: 14 }).map((_, index) => (
        <mesh key={`quay-${index}`} castShadow receiveShadow position={[-11.7 + index * 1.8, 0.18, -2.15]} scale={[0.85, 0.34, 1.05]}>
          <boxGeometry />
          <meshStandardMaterial color={index % 2 ? "#4d4a43" : "#383631"} roughness={0.88} metalness={0.05} />
        </mesh>
      ))}
      <mesh receiveShadow position={[0, 0.14, 9.4]} scale={[5.4, 0.2, 29]}>
        <boxGeometry />
        <meshStandardMaterial color="#281b12" roughness={0.82} metalness={0.03} />
      </mesh>
      {Array.from({ length: 31 }).map((_, index) => (
        <mesh key={`main-plank-${index}`} castShadow receiveShadow position={[0, 0.29, -4.1 + index * 0.9]} scale={[5.95, 0.11, 0.32]}>
          <boxGeometry />
          <meshStandardMaterial color={index % 2 ? "#4b3423" : "#5a402a"} roughness={0.76} metalness={0.03} />
        </mesh>
      ))}
      {[-8.4, 8.4].map((x) =>
        [4.6, 12.6, 20.2].map((z, index) => (
          <mesh key={`side-${x}-${z}`} castShadow receiveShadow position={[x, 0.24, z]} scale={[9.2, 0.18, 2.2]}>
            <boxGeometry />
            <meshStandardMaterial color={index % 2 ? "#332217" : "#3d2a1c"} roughness={0.78} metalness={0.04} />
          </mesh>
        ))
      )}
      {[-2.8, 2.8].map((x) =>
        [-3.6, 1.2, 6, 10.8, 15.6, 20.4, 24.2].map((z) => (
          <HarborPost key={`post-${x}-${z}`} position={[x, 0.35, z]} tall={z < 0} />
        ))
      )}
      {[-12.8, -4.2, 4.2, 12.8].map((x) => (
        <HarborPost key={`seawall-post-${x}`} position={[x, 0.2, -2.15]} tall />
      ))}
      {[-1.2, 3.6, 8.4, 13.2, 18, 22.8].map((z) => (
        <RopeLine key={`rope-left-${z}`} position={[-2.8, 1.05, z]} length={3.9} />
      ))}
      {[-1.2, 3.6, 8.4, 13.2, 18, 22.8].map((z) => (
        <RopeLine key={`rope-right-${z}`} position={[2.8, 1.05, z]} length={3.9} />
      ))}
      {[-5.8, 5.8].map((x) =>
        [6.4, 14.4, 21.4].map((z) => (
          <RopeLine key={`slip-rope-${x}-${z}`} position={[x, 0.82, z]} rotation={[0, 0, Math.PI / 2]} length={4.4} />
        ))
      )}
      <HarborBoat position={[-9.7, -0.05, 8.2]} rotation={-0.08} color="#16212b" />
      <HarborBoat position={[9.8, -0.05, 15.6]} rotation={0.08} color="#24202b" />
      <HarborBoat position={[-9.3, -0.05, 22.0]} rotation={0.05} color="#102521" />
      <HarborCrates position={[-9.2, 0.22, -6.7]} />
      <HarborCrates position={[8.4, 0.22, -7.5]} />
      <HarborCrates position={[4.6, 0.28, 2.5]} />
      {[-7.8, -2.5, 2.5, 7.8].map((x) => <DockLamp key={`lamp-${x}`} position={[x, 0.18, -3.4]} />)}
      {[-2.85, 2.85].map((x) => <DockLamp key={`pier-lamp-${x}`} position={[x, 0.34, 17.8]} />)}
      <mesh receiveShadow position={[0, 0.16, -11.9]} scale={[24, 0.18, 1.2]}>
        <boxGeometry />
        <meshStandardMaterial color="#272c2e" roughness={0.86} metalness={0.08} />
      </mesh>
      <NeonStrip position={[0, 0.35, -11.25]} color="#7df9ff" size={[20, 0.055, 0.055]} />
      <pointLight position={[0, 2.4, -8]} color="#7df9ff" intensity={13} distance={34} />
    </group>
  );
}

function BeachSector({ thetaStart, thetaLength, sandTexture, inner = 86, outer = 104, wet = false }) {
  const geometry = useMemo(() => makeCoastBandGeometry({
    inner,
    outer,
    thetaStart,
    thetaLength,
    radialSegments: wet ? 2 : 4,
    angleSegments: 150,
    lift: wet ? 0.026 : 0.018
  }), [inner, outer, thetaStart, thetaLength, wet]);

  return (
    <mesh receiveShadow geometry={geometry}>
      <meshStandardMaterial
        map={sandTexture}
        color={wet ? "#6f6653" : "#a98d62"}
        roughness={wet ? 0.56 : 0.92}
        metalness={wet ? 0.04 : 0.02}
        transparent={wet}
        opacity={wet ? 0.56 : 1}
      />
    </mesh>
  );
}

function BeachesAndCliffs() {
  const sandTexture = useMemo(() => makeSandTexture(), []);
  return (
    <group>
      <BeachSector thetaStart={0} thetaLength={4.05} sandTexture={sandTexture} inner={84} outer={103.5} />
      <BeachSector thetaStart={5.36} thetaLength={Math.PI * 2 - 5.36} sandTexture={sandTexture} inner={84} outer={103.5} />
      <BeachSector thetaStart={0} thetaLength={4.05} sandTexture={sandTexture} inner={96} outer={105.5} wet />
      <BeachSector thetaStart={5.36} thetaLength={Math.PI * 2 - 5.36} sandTexture={sandTexture} inner={96} outer={105.5} wet />
      {[-82, -56, -28, 36, 74].map((x, index) => (
        <mesh key={index} castShadow receiveShadow position={[x, 1.4 + index * 0.14, -93 + seeded(index) * 16]} rotation={[0.2, seeded(index + 10) * Math.PI, -0.12]} scale={[7 + seeded(index + 2) * 4, 2.8 + seeded(index + 3) * 2, 4 + seeded(index + 4) * 3]}>
          <dodecahedronGeometry args={[1, 1]} />
          <meshStandardMaterial color="#4b514d" roughness={0.92} />
        </mesh>
      ))}
      {[-84, -62, 70, 88].map((z, index) => (
        <mesh key={z} castShadow receiveShadow position={[-100 + seeded(index + 20) * 12, 2.1, z]} rotation={[0.18, 0.5, 0.08]} scale={[5, 5.2, 8]}>
          <dodecahedronGeometry args={[1, 1]} />
          <meshStandardMaterial color="#545956" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function SecretLocations() {
  return (
    <group>
      {SECRET_LOCATIONS.map((secret) => (
        <Float key={secret.label} speed={1.25} floatIntensity={0.16}>
          <group position={secret.position}>
            <mesh castShadow>
              <icosahedronGeometry args={[1.4, 2]} />
              <meshStandardMaterial color="#111820" emissive={secret.color} emissiveIntensity={0.7} roughness={0.26} metalness={0.55} />
            </mesh>
            <Text position={[0, 2.1, 0]} fontSize={0.3} color="#dffbff" anchorX="center" anchorY="middle">
              {secret.label}
            </Text>
            <pointLight position={[0, 2, 0]} color={secret.color} intensity={5} distance={12} />
          </group>
        </Float>
      ))}
    </group>
  );
}

function AmbientParticles() {
  const ref = useRef();
  const positions = useMemo(() => {
    const data = new Float32Array(560 * 3);
    for (let i = 0; i < 560; i += 1) {
      const radius = 18 + seeded(i + 1200) * 126;
      const angle = seeded(i + 1300) * Math.PI * 2;
      data[i * 3] = Math.cos(angle) * radius;
      data[i * 3 + 1] = 2 + seeded(i + 1400) * 20;
      data[i * 3 + 2] = 8 + Math.sin(angle) * radius;
    }
    return data;
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = clock.elapsedTime * 0.006;
    ref.current.position.y = Math.sin(clock.elapsedTime * 0.24) * 0.18;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#8edcff" size={0.075} transparent opacity={0.32} depthWrite={false} />
    </points>
  );
}

function HologramBeacon({ item }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.material.opacity = 0.18 + Math.sin(clock.elapsedTime * 2.1 + item.worldPos.x) * 0.05;
  });
  return (
    <Float speed={1.15} floatIntensity={0.08}>
      <group position={[item.worldPos.x, 0.28, item.worldPos.z]}>
        <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[4.3, 4.65, 128]} />
          <meshBasicMaterial color={item.color} transparent opacity={0.2} depthWrite={false} />
        </mesh>
        <pointLight position={[0, 3.4, 0]} color={item.color} intensity={5} distance={18} />
      </group>
    </Float>
  );
}

export function Island() {
  const isPhone = useMemo(() => isPhoneDevice(), []);

  return (
    <group>
      <Terrain />
      <BeachesAndCliffs />
      <AsphaltNetwork />
      <StreetLighting />
      <DeveloperHouse />
      <ProjectFoundry />
      <TechDistrict />
      <CertificationObservatory />
      <CommsSpire />
      <ForestAndFoliage />
      <GrassTufts />
      <RockField />
      <Harbor />
      <SecretLocations />
      {ISLANDS.map((item) => <HologramBeacon key={item.id} item={item} />)}
      {!isPhone ? <AmbientParticles /> : null}
    </group>
  );
}
