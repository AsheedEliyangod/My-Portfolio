import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useGame } from "../state/GameContext.jsx";
import { waveHeight } from "../utils/math.js";

// ---------------------------------------------------------------------------
// Enhanced Wake — directional water-flow trail visible when ship moves
// Features:
//   • Two side-bow V-waves that spread outward as they trail back
//   • Centre foam trail of fading rings  
//   • All opacity / spread driven by ship speed so it's invisible at rest
// ---------------------------------------------------------------------------
const WAKE_COUNT = 12;

function Wake({ shipRef }) {
  const foamGroup   = useRef();
  const bowLGroup   = useRef();
  const bowRGroup   = useRef();
  const speedRef    = useRef(0);

  useFrame(({ clock }) => {
    const ship  = shipRef.current;
    const speed = ship ? Math.abs(ship.speed) : 0;
    // Smooth the speed value to avoid jitter
    speedRef.current = THREE.MathUtils.lerp(speedRef.current, speed, 0.12);
    const s    = speedRef.current;
    const norm = Math.min(s / 4.5, 1.0);   // 0..1 at max speed
    const t    = clock.elapsedTime;

    // ── Centre foam rings ───────────────────────────────────────────────────
    if (foamGroup.current) {
      foamGroup.current.children.forEach((mesh, i) => {
        // Each ring moves backward and expands as it ages
        const phase  = (t * 1.6 + i * (4 / WAKE_COUNT)) % 4;
        const age    = phase / 4;                    // 0 = fresh, 1 = old
        const zPos   = -(0.6 + age * 5.5);           // trails behind
        const scl    = 0.5 + age * 1.8;

        mesh.position.z      = zPos;
        mesh.scale.setScalar(scl);
        mesh.material.opacity = norm * Math.max(0, 0.38 - age * 0.42);
      });
    }

    // ── Port (left) V-wave ─────────────────────────────────────────────────
    if (bowLGroup.current) {
      bowLGroup.current.children.forEach((mesh, i) => {
        const phase = (t * 1.8 + i * 0.28) % 1;
        const age   = phase;
        mesh.position.set(
          -(0.55 + age * 2.4),          // spread left
          0.03,
          -(0.5  + age * 3.8)           // drift back
        );
        mesh.scale.x = 0.18 + age * 0.7;
        mesh.scale.z = 0.06 + age * 0.12;
        mesh.material.opacity = norm * Math.max(0, 0.55 - age * 0.62);
      });
    }

    // ── Starboard (right) V-wave ───────────────────────────────────────────
    if (bowRGroup.current) {
      bowRGroup.current.children.forEach((mesh, i) => {
        const phase = (t * 1.8 + i * 0.28) % 1;
        const age   = phase;
        mesh.position.set(
          0.55 + age * 2.4,
          0.03,
          -(0.5 + age * 3.8)
        );
        mesh.scale.x = 0.18 + age * 0.7;
        mesh.scale.z = 0.06 + age * 0.12;
        mesh.material.opacity = norm * Math.max(0, 0.55 - age * 0.62);
      });
    }
  });

  const BOW_COUNT = 6;

  // Shared material instances — transparent, no depth-write so they layer nicely
  const foamMat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: "#e8fffc", transparent: true, opacity: 0, depthWrite: false }),
    []
  );
  const bowMat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: "#d0f5ee", transparent: true, opacity: 0, depthWrite: false }),
    []
  );

  return (
    <group>
      {/* Centre foam rings */}
      <group ref={foamGroup}>
        {Array.from({ length: WAKE_COUNT }).map((_, i) => (
          <mesh key={i} rotation-x={-Math.PI / 2} material={foamMat.clone()}>
            <ringGeometry args={[0.28, 0.52, 20]} />
          </mesh>
        ))}
      </group>

      {/* Port bow-wave strips */}
      <group ref={bowLGroup}>
        {Array.from({ length: BOW_COUNT }).map((_, i) => (
          <mesh key={i} rotation-x={-Math.PI / 2} rotation-z={0.38} material={bowMat.clone()}>
            <planeGeometry args={[1, 0.14]} />
          </mesh>
        ))}
      </group>

      {/* Starboard bow-wave strips */}
      <group ref={bowRGroup}>
        {Array.from({ length: BOW_COUNT }).map((_, i) => (
          <mesh key={i} rotation-x={-Math.PI / 2} rotation-z={-0.38} material={bowMat.clone()}>
            <planeGeometry args={[1, 0.14]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Ship model — auto-normalised from the GLB
// ---------------------------------------------------------------------------
function ShipModel() {
  const { scene } = useGLTF("/models/empty_ship.glb");

  const { model, scale, offset, rotationY } = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child) => {
      if (!child.isMesh) return;
      child.castShadow = true;
      child.receiveShadow = true;
      if (child.material) {
        child.material.roughness = Math.max(child.material.roughness ?? 0.55, 0.48);
        child.material.needsUpdate = true;
      }
    });

    const box    = new THREE.Box3().setFromObject(clone);
    const size   = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    const longestSide     = Math.max(size.x, size.z, 0.001);
    const targetLength    = 7.0;
    const normalizedScale = targetLength / longestSide;
    const bottom          = box.min.y;
    const normalizedOffset = new THREE.Vector3(-center.x, -bottom, -center.z);
    const turnLongestAxisForward = size.x > size.z ? Math.PI / 2 : 0;

    return {
      model: clone,
      scale: normalizedScale,
      offset: normalizedOffset,
      rotationY: turnLongestAxisForward + Math.PI,
    };
  }, [scene]);

  return (
    <group scale={scale} rotation-y={rotationY}>
      <primitive object={model} position={offset} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// Ship — combines model + bob + wake
// ---------------------------------------------------------------------------
export function Ship() {
  const group = useRef();
  const lean = useRef(0);
  const pitch = useRef(0);
  const { ship, mode } = useGame();

  useFrame(({ clock }, delta) => {
    const state = ship.current;
    const t = clock.elapsedTime;
    const y = waveHeight(state.position.x, state.position.z, t) - 0.22;
    const speed = Math.min(Math.abs(state.speed || 0) / 3.35, 1);
    const targetLean = -(state.turnInput || 0) * (0.08 + speed * 0.13);
    const targetPitch = -(state.throttle || 0) * 0.045 + Math.sin(t * 1.35) * 0.018;
    lean.current = THREE.MathUtils.damp(lean.current, targetLean, 3.2, delta);
    pitch.current = THREE.MathUtils.damp(pitch.current, targetPitch, 2.4, delta);
    group.current.position.set(state.position.x, y, state.position.z);
    group.current.rotation.set(
      pitch.current + Math.sin(t * 1.7) * 0.025,
      state.rotation,
      lean.current + Math.sin(t * 1.25) * 0.026
    );
  });

  return (
    <group ref={group}>
      <ShipModel />
      {/* Wake is always mounted — Wake hides itself when speed is 0 */}
      <Wake shipRef={ship} />
    </group>
  );
}

useGLTF.preload("/models/empty_ship.glb");
