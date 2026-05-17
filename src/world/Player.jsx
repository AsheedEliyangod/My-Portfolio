import { useEffect, useMemo, useRef } from "react";
import { useAnimations, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";
import * as THREE from "three";
import { useGame } from "../state/GameContext.jsx";

const CHARACTER_HEIGHT = 0.38;

function removeHorizontalRootMotion(clip) {
  const cleaned = clip.clone();
  cleaned.tracks = cleaned.tracks.map((track) => {
    if (!track.name.includes("mixamorig_Hips.position")) return track;

    const values = track.values.slice();
    const baseX = values[0];
    const baseY = values[1];
    const baseZ = values[2];
    for (let index = 0; index < values.length; index += 3) {
      values[index] = baseX;
      values[index + 1] = baseY + (values[index + 1] - baseY) * 0.45;
      values[index + 2] = baseZ;
    }
    return new THREE.VectorKeyframeTrack(track.name, track.times.slice(), values);
  });
  cleaned.optimize();
  return cleaned;
}

function CharacterModel() {
  const characterRoot = useRef();
  const activeAction = useRef(null);
  const activeState = useRef("Idle");
  const smoothedSpeed = useRef(0);
  const { player } = useGame();
  const idleGlb = useGLTF("/models/Idle.glb");
  const walkingGlb = useGLTF("/models/female_walking.glb");

  const { model, scale, offset } = useMemo(() => {
    const clone = cloneSkeleton(idleGlb.scene);
    clone.position.set(0, 0, 0);
    clone.rotation.set(0, 0, 0);
    clone.scale.set(1, 1, 1);
    clone.traverse((child) => {
      if (!child.isMesh) return;
      child.castShadow = true;
      child.receiveShadow = true;
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((material) => {
        if (!material) return;
        material.roughness = Math.max(material.roughness ?? 0.5, 0.45);
        material.needsUpdate = true;
      });
    });

    const box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3();
    const hipsPosition = new THREE.Vector3();
    box.getSize(size);
    clone.updateMatrixWorld(true);
    clone.getObjectByName("mixamorig_Hips")?.getWorldPosition(hipsPosition);

    const targetHeight = CHARACTER_HEIGHT;
    return {
      model: clone,
      scale: targetHeight / Math.max(size.y, 0.001),
      // The controller root is the capsule center projected to the ground.
      // Align the animated hips/root to that XZ point so parent rotation turns
      // the character in-place instead of swinging the mesh around an offset.
      offset: new THREE.Vector3(-hipsPosition.x, -box.min.y, -hipsPosition.z)
    };
  }, [idleGlb.scene]);

  const clips = useMemo(() => {
    const idleClip = idleGlb.animations?.[0]?.clone();
    const walkClip = walkingGlb.animations?.[0] ? removeHorizontalRootMotion(walkingGlb.animations[0]) : null;
    const runClip = walkClip?.clone();

    const prepared = [];
    if (idleClip) {
      idleClip.name = "Idle";
      prepared.push(idleClip);
    }
    if (walkClip) {
      walkClip.name = "Walk";
      prepared.push(walkClip);
    }
    if (runClip) {
      runClip.name = "Run";
      prepared.push(runClip);
    }
    return prepared;
  }, [idleGlb.animations, walkingGlb.animations]);

  const { actions } = useAnimations(clips, characterRoot);

  useEffect(() => {
    const idle = actions.Idle;
    if (!idle) return undefined;
    idle.reset().setLoop(THREE.LoopRepeat).fadeIn(0.35).play();
    idle.enabled = true;
    activeAction.current = idle;
    activeState.current = "Idle";
    return () => idle.stop();
  }, [actions]);

  useFrame((_, delta) => {
    smoothedSpeed.current = THREE.MathUtils.damp(smoothedSpeed.current, Math.abs(player.current.speed), 10, delta);
    const speed = smoothedSpeed.current;
    const nextState = player.current.animationState || (speed < 0.04 ? "Idle" : player.current.isRunning ? "Run" : "Walk");
    const next = actions[nextState];
    if (!next) return;

    next.setLoop(THREE.LoopRepeat);
    if (nextState === "Idle") {
      next.timeScale = 1;
    } else if (nextState === "Walk") {
      next.timeScale = THREE.MathUtils.damp(
        next.timeScale || 1,
        THREE.MathUtils.clamp(speed / 0.98, 0.78, 1.05),
        8,
        delta
      );
    } else {
      next.timeScale = THREE.MathUtils.damp(
        next.timeScale || 1.25,
        THREE.MathUtils.clamp(speed / 1.45, 1.1, 1.38),
        8,
        delta
      );
    }

    if (next === activeAction.current) return;

    if ((activeState.current === "Walk" && nextState === "Run") || (activeState.current === "Run" && nextState === "Walk")) {
      next.time = activeAction.current?.time ?? next.time;
    } else {
      next.reset();
    }

    next.enabled = true;
    next.fadeIn(0.32).play();
    activeAction.current?.fadeOut(0.32);
    activeAction.current = next;
    activeState.current = nextState;
  });

  return (
    <group ref={characterRoot} scale={[scale, scale, scale]}>
      <group position={offset}>
        <primitive object={model} />
      </group>
    </group>
  );
}

export function Player() {
  const group = useRef();
  const visualAnchor = useRef();
  const movementLight = useRef();
  const { player } = useGame();

  useFrame(() => {
    const state = player.current;
    group.current.position.copy(state.position);
    group.current.rotation.y = state.rotation;
    const movementAmount = Math.min(1, Math.abs(state.speed) / 5);
    visualAnchor.current.position.set(0, 0, 0);
    visualAnchor.current.rotation.set(0, 0, 0);
    movementLight.current.intensity = 0.12 + movementAmount * 0.38;
  });

  return (
    <group ref={group}>
      <group ref={visualAnchor}>
        <CharacterModel />
      </group>
      <pointLight ref={movementLight} position={[0, CHARACTER_HEIGHT * 1.5, 0]} color="#9cecff" intensity={0.12} distance={1.4} />
    </group>
  );
}

useGLTF.preload("/models/Idle.glb");
useGLTF.preload("/models/female_walking.glb");
