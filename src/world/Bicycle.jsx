import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { forwardRef, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useGame } from "../state/GameContext.jsx";
import { RealCharacter } from "./RealCharacter.jsx";

const up = new THREE.Vector3(0, 1, 0);
const BIKE_VISUAL_SCALE = 1;

function Tube({ from, to, radius = 0.04, material }) {
  const { position, quaternion, length } = useMemo(() => {
    const start = new THREE.Vector3(from[0], from[1], from[2]);
    const end = new THREE.Vector3(to[0], to[1], to[2]);
    const mid = start.clone().add(end).multiplyScalar(0.5);
    const dir = end.clone().sub(start).normalize();
    return {
      position: mid.toArray(),
      quaternion: new THREE.Quaternion().setFromUnitVectors(up, dir),
      length: start.distanceTo(end)
    };
  }, [from, to]);

  return (
    <mesh castShadow position={position} quaternion={quaternion} material={material}>
      <cylinderGeometry args={[radius, radius, length, 12]} />
    </mesh>
  );
}

const Wheel = forwardRef(function Wheel({ position, material, rimMaterial, treadMaterial, reflectorMaterial }, ref) {
  return (
    <group position={position}>
      <group ref={ref}>
        <mesh castShadow rotation-y={Math.PI / 2}>
          <torusGeometry args={[0.34, 0.026, 14, 54]} />
          <primitive object={rimMaterial} attach="material" />
        </mesh>
        <mesh castShadow rotation-y={Math.PI / 2}>
          <torusGeometry args={[0.27, 0.009, 8, 42]} />
          <primitive object={material} attach="material" />
        </mesh>
        {Array.from({ length: 16 }).map((_, index) => {
          const a = (index / 16) * Math.PI * 2;
          return (
            <Tube
              key={`spoke-${index}`}
              from={[0, 0, 0]}
              to={[0, Math.cos(a) * 0.31, Math.sin(a) * 0.31]}
              radius={0.0045}
              material={material}
            />
          );
        })}
        {Array.from({ length: 18 }).map((_, index) => {
          const a = (index / 18) * Math.PI * 2;
          return (
            <mesh
              key={`tread-${index}`}
              castShadow
              position={[0, Math.cos(a) * 0.35, Math.sin(a) * 0.35]}
              rotation={[a, 0, 0]}
            >
              <boxGeometry args={[0.085, 0.018, 0.064]} />
              <primitive object={treadMaterial} attach="material" />
            </mesh>
          );
        })}
        {[0, Math.PI].map((a, index) => (
          <mesh
            key={`reflector-${index}`}
            position={[0.038, Math.cos(a) * 0.25, Math.sin(a) * 0.25]}
            rotation={[a, 0, 0]}
          >
            <boxGeometry args={[0.026, 0.075, 0.048]} />
            <primitive object={reflectorMaterial} attach="material" />
          </mesh>
        ))}
      </group>
    </group>
  );
});

function PedalSet({ metal, rubber, crankRef }) {
  return (
    <group ref={crankRef}>
      <Tube from={[0, 0.38, -0.04]} to={[-0.18, 0.2, -0.04]} radius={0.014} material={metal} />
      <Tube from={[0, 0.38, -0.04]} to={[0.18, 0.2, -0.04]} radius={0.014} material={metal} />
      <mesh castShadow position={[-0.27, 0.2, -0.04]} scale={[0.26, 0.035, 0.12]}>
        <boxGeometry />
        <primitive object={rubber} attach="material" />
      </mesh>
      <mesh castShadow position={[0.27, 0.2, -0.04]} scale={[0.26, 0.035, 0.12]}>
        <boxGeometry />
        <primitive object={rubber} attach="material" />
      </mesh>
      <mesh castShadow position={[0, 0.38, -0.04]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.055, 0.055, 0.035, 16]} />
        <primitive object={metal} attach="material" />
      </mesh>
    </group>
  );
}

export function Bicycle() {
  const root = useRef();
  const suspension = useRef();
  const rearWheel = useRef();
  const frontSteer = useRef();
  const frontWheel = useRef();
  const crank = useRef();
  const rider = useRef();
  const visualTimer = useRef(0);
  const [riderVisual, setRiderVisual] = useState({ angle: 0, speed: 0, pose: "bikeStop", blend: 0, lean: 0, steer: 0 });
  const { bike, mode } = useGame();

  const materials = useMemo(() => ({
    frame: new THREE.MeshStandardMaterial({ color: "#101820", roughness: 0.32, metalness: 0.72 }),
    metal: new THREE.MeshStandardMaterial({ color: "#a9b6bd", roughness: 0.28, metalness: 0.84 }),
    tire: new THREE.MeshStandardMaterial({ color: "#050607", roughness: 0.72, metalness: 0.05 }),
    tread: new THREE.MeshStandardMaterial({ color: "#1a2024", roughness: 0.86, metalness: 0.03 }),
    accent: new THREE.MeshStandardMaterial({ color: "#76f7ff", emissive: "#28dfff", emissiveIntensity: 1.4, toneMapped: false }),
    reflector: new THREE.MeshStandardMaterial({ color: "#ffb86b", emissive: "#ff8a2b", emissiveIntensity: 1.8, toneMapped: false }),
    rubber: new THREE.MeshStandardMaterial({ color: "#050607", roughness: 0.75 }),
  }), []);

  useFrame((_, delta) => {
    const state = bike.current;
    root.current.position.copy(state.position);
    root.current.rotation.set(0, state.rotation, state.lean);
    suspension.current.position.y = state.suspension;
    rearWheel.current.rotation.x = state.wheelSpin;
    frontWheel.current.rotation.x = state.wheelSpin;
    frontSteer.current.rotation.y = state.steer * 0.42;
    crank.current.rotation.x = 0;
    if (rider.current) {
      const blend = THREE.MathUtils.clamp(state.riderBlend, 0, 1);
      const transition = 1 - blend;
      const side = state.riderPose === "dismount" ? (state.mountSide || 1) : (state.mountSide || -1);
      const speed01 = THREE.MathUtils.clamp(Math.abs(state.speed) / 12, 0, 1);
      const breathing = Math.sin(state.wheelSpin * 0.35) * 0.003 * speed01;
      const mountLift = Math.sin(blend * Math.PI) * (state.riderPose === "mount" ? 0.08 : 0.05);
      rider.current.position.set(
        side * transition * 0.58,
        0.035 + breathing + transition * 0.06 + mountLift,
        -0.31 - transition * 0.28
      );
      rider.current.rotation.y = side * transition * 0.34;
      rider.current.rotation.x = -0.1 * blend - speed01 * 0.018;
      rider.current.rotation.z = state.lean * 0.16 + side * transition * 0.04;
      rider.current.scale.setScalar(1);
    }
    visualTimer.current += delta;
    if (visualTimer.current > 1 / 30) {
      visualTimer.current = 0;
      setRiderVisual({
        angle: 0,
        speed: state.speed,
        pose: state.riderPose || (Math.abs(state.speed) < 0.25 ? "bikeStop" : "cycle"),
        blend: state.riderBlend,
        lean: state.lean,
        steer: state.steer
      });
    }
  });

  const state = bike.current;
  const showRider = mode === "bike" || mode === "mountBike" || mode === "dismountBike";

  return (
    <group ref={root}>
      <group ref={suspension} scale={BIKE_VISUAL_SCALE}>
        <Wheel
          ref={rearWheel}
          position={[0, 0.36, -0.62]}
          material={materials.metal}
          rimMaterial={materials.tire}
          treadMaterial={materials.tread}
          reflectorMaterial={materials.reflector}
        />
        <group ref={frontSteer} position={[0, 0.36, 0.62]}>
          <Wheel
            ref={frontWheel}
            position={[0, 0, 0]}
            material={materials.metal}
            rimMaterial={materials.tire}
            treadMaterial={materials.tread}
            reflectorMaterial={materials.reflector}
          />
        </group>
        <Tube from={[0, 0.36, -0.62]} to={[0, 0.72, -0.04]} radius={0.035} material={materials.frame} />
        <Tube from={[0, 0.36, 0.62]} to={[0, 0.72, -0.04]} radius={0.035} material={materials.frame} />
        <Tube from={[0, 0.36, -0.62]} to={[0, 1.03, -0.3]} radius={0.033} material={materials.frame} />
        <Tube from={[0, 1.03, -0.3]} to={[0, 0.72, -0.04]} radius={0.033} material={materials.frame} />
        <Tube from={[0, 1.03, -0.3]} to={[0, 0.98, 0.42]} radius={0.033} material={materials.frame} />
        <Tube from={[0, 0.36, 0.62]} to={[0, 0.98, 0.42]} radius={0.033} material={materials.frame} />
        <Tube from={[-0.42, 1.0, 0.38]} to={[0.42, 1.0, 0.38]} radius={0.03} material={materials.metal} />
        <Tube from={[0, 0.98, 0.42]} to={[0, 1.08, 0.48]} radius={0.027} material={materials.metal} />
        <mesh castShadow position={[0, 1.05, -0.3]} scale={[0.42, 0.06, 0.24]}>
          <boxGeometry />
          <primitive object={materials.rubber} attach="material" />
        </mesh>
        <PedalSet metal={materials.metal} rubber={materials.rubber} crankRef={crank} />
        <mesh position={[0, 0.52, -0.02]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.22, 0.01, 8, 40]} />
          <primitive object={materials.accent} attach="material" />
        </mesh>
        {showRider ? (
          <group ref={rider} position={[0, 0.03, -0.31]}>
            <RealCharacter
              pose={riderVisual.pose}
              cycleAngle={riderVisual.angle}
              speed={riderVisual.speed}
              riding
              lean={riderVisual.lean}
              steer={riderVisual.steer}
              ridingBlend={riderVisual.blend}
              scale={1}
            />
          </group>
        ) : null}
        <pointLight position={[0, 1.15, 1.8]} color="#7df9ff" intensity={1.7} distance={5} />
      </group>
      {!showRider ? (
        <Text position={[0, 2.3, 0]} fontSize={0.26} color="#e8fdff" anchorX="center" anchorY="middle">
          Bicycle
        </Text>
      ) : null}
    </group>
  );
}
