import { useAnimations, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

const PROVIDED_CHARACTER_MODEL = "/models/female_stylized_character.glb";
const IDLE_MODEL = "/models/Idle.glb";
const WALK_MODEL = "/models/female_walking.glb";
const RUN_MODEL = "/models/Running.glb";

const animatedPoses = new Set(["idle", "walk", "run"]);

function lockRootTravel(clip) {
  const cleaned = clip.clone();
  cleaned.tracks = cleaned.tracks.map((track) => {
    if (!track.name.toLowerCase().includes("hips.position")) return track;
    const values = track.values.slice();
    const baseX = values[0];
    const baseY = values[1];
    const baseZ = values[2];
    for (let index = 0; index < values.length; index += 3) {
      values[index] = baseX;
      values[index + 1] = baseY + (values[index + 1] - baseY) * 0.42;
      values[index + 2] = baseZ;
    }
    return new THREE.VectorKeyframeTrack(track.name, track.times.slice(), values);
  });
  cleaned.optimize();
  return cleaned;
}

function namedClip(gltf, name, lockTravel = false) {
  const clip = gltf.animations?.[0]?.clone();
  if (!clip) return null;
  const prepared = lockTravel ? lockRootTravel(clip) : clip;
  prepared.name = name;
  return prepared;
}

function collectModelMaterials(scene) {
  const materials = [];
  scene.traverse((child) => {
    if (!child.isMesh && !child.isSkinnedMesh) return;
    const list = Array.isArray(child.material) ? child.material : [child.material];
    list.forEach((material) => {
      if (material) materials.push(material);
    });
  });
  return materials;
}

function polishMaterial(material) {
  if (!material) return material;
  const clone = material.clone();
  clone.roughness = Math.max(clone.roughness ?? 0.5, 0.55);
  clone.metalness = Math.min(clone.metalness ?? 0.1, 0.22);
  clone.envMapIntensity = 0.75;
  return clone;
}

function findBone(bones, name) {
  return bones.find((bone) => bone.name.toLowerCase().includes(name.toLowerCase()));
}

function rememberRestPose(root) {
  root.traverse((child) => {
    if (!child.isBone) return;
    child.userData.restRotation = child.rotation.clone();
    child.userData.restPosition = child.position.clone();
  });
}

function setBone(bone, x = 0, y = 0, z = 0, delta = 1, amount = 1) {
  if (!bone?.userData.restRotation) return;
  const rest = bone.userData.restRotation;
  bone.rotation.x = THREE.MathUtils.damp(bone.rotation.x, rest.x + x * amount, 16, delta);
  bone.rotation.y = THREE.MathUtils.damp(bone.rotation.y, rest.y + y * amount, 16, delta);
  bone.rotation.z = THREE.MathUtils.damp(bone.rotation.z, rest.z + z * amount, 16, delta);
}

function setBonePosition(bone, x = 0, y = 0, z = 0, delta = 1, amount = 1) {
  if (!bone?.userData.restPosition) return;
  const rest = bone.userData.restPosition;
  bone.position.x = THREE.MathUtils.damp(bone.position.x, rest.x + x * amount, 13, delta);
  bone.position.y = THREE.MathUtils.damp(bone.position.y, rest.y + y * amount, 13, delta);
  bone.position.z = THREE.MathUtils.damp(bone.position.z, rest.z + z * amount, 13, delta);
}

export function RealCharacter({
  pose = "idle",
  cycleAngle = 0,
  speed = 0,
  riding = false,
  lean = 0,
  steer = 0,
  ridingBlend = 1,
  scale = 1,
  position = [0, 0, 0]
}) {
  const group = useRef();
  const root = useRef();
  const currentAction = useRef(null);
  const props = useRef({ pose, cycleAngle, speed, riding, lean, steer, ridingBlend });

  const provided = useGLTF(PROVIDED_CHARACTER_MODEL);
  const idle = useGLTF(IDLE_MODEL);
  const walk = useGLTF(WALK_MODEL);
  const run = useGLTF(RUN_MODEL);

  const providedMaterials = useMemo(() => collectModelMaterials(provided.scene), [provided.scene]);

  const scene = useMemo(() => {
    const cloned = cloneSkeleton(idle.scene);
    rememberRestPose(cloned);
    let meshIndex = 0;
    cloned.traverse((child) => {
      if (child.isMesh || child.isSkinnedMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          const polished = materials.map((material, materialIndex) => {
            const source = providedMaterials[(meshIndex + materialIndex) % Math.max(providedMaterials.length, 1)] ?? material;
            return polishMaterial(source);
          });
          child.material = Array.isArray(child.material) ? polished : polished[0];
        }
        meshIndex += 1;
      }
    });
    cloned.userData.sourceCharacterModel = PROVIDED_CHARACTER_MODEL;
    return cloned;
  }, [idle.scene, providedMaterials]);

  const clips = useMemo(() => {
    return [
      namedClip(idle, "idle"),
      namedClip(walk, "walk", true),
      namedClip(run, "run", true)
    ].filter(Boolean);
  }, [idle, walk, run]);

  const bones = useMemo(() => {
    const allBones = [];
    scene.traverse((child) => {
      if (child.isBone) allBones.push(child);
    });

    return {
      hips: findBone(allBones, "hips"),
      spine: findBone(allBones, "spine"),
      spine1: findBone(allBones, "spine1"),
      spine2: findBone(allBones, "spine2"),
      neck: findBone(allBones, "neck"),
      leftShoulder: findBone(allBones, "leftshoulder"),
      leftArm: findBone(allBones, "leftarm"),
      leftForeArm: findBone(allBones, "leftforearm"),
      leftHand: findBone(allBones, "lefthand"),
      rightShoulder: findBone(allBones, "rightshoulder"),
      rightArm: findBone(allBones, "rightarm"),
      rightForeArm: findBone(allBones, "rightforearm"),
      rightHand: findBone(allBones, "righthand"),
      leftUpLeg: findBone(allBones, "leftupleg"),
      leftLeg: findBone(allBones, "leftleg"),
      leftFoot: findBone(allBones, "leftfoot"),
      rightUpLeg: findBone(allBones, "rightupleg"),
      rightLeg: findBone(allBones, "rightleg"),
      rightFoot: findBone(allBones, "rightfoot")
    };
  }, [scene]);

  const { actions } = useAnimations(clips, group);

  useEffect(() => {
    props.current = { pose, cycleAngle, speed, riding, lean, steer, ridingBlend };
  }, [pose, cycleAngle, speed, riding, lean, steer, ridingBlend]);

  useEffect(() => {
    const active = animatedPoses.has(pose) ? pose : "idle";
    const next = actions[active];
    if (!next) return;
    next.reset().fadeIn(0.24).play();
    if (currentAction.current && currentAction.current !== next) {
      currentAction.current.fadeOut(0.24);
    }
    currentAction.current = next;
  }, [actions, pose]);

  useFrame((_, delta) => {
    const state = props.current;
    const ridingAmount = state.riding ? THREE.MathUtils.clamp(state.ridingBlend ?? 1, 0, 1) : 0;
    const speed01 = THREE.MathUtils.clamp(Math.abs(state.speed) / 12.2, 0, 1);
    if (actions.walk) actions.walk.timeScale = THREE.MathUtils.clamp(Math.abs(state.speed) / 2.2, 0.74, 1.24);
    if (actions.run) actions.run.timeScale = THREE.MathUtils.clamp(Math.abs(state.speed) / 4.2, 0.9, 1.42);
    if (actions.idle) actions.idle.timeScale = ridingAmount ? 0 : 0.92;

    if (root.current) {
      if (ridingAmount) {
        root.current.rotation.x = THREE.MathUtils.damp(
          root.current.rotation.x,
          -0.09 - speed01 * 0.035,
          7,
          delta
        );
        root.current.rotation.z = THREE.MathUtils.damp(root.current.rotation.z, state.lean * 0.28, 7, delta);
        root.current.position.y = THREE.MathUtils.damp(
          root.current.position.y,
          -0.055,
          11,
          delta
        );
      } else {
        root.current.rotation.x = THREE.MathUtils.damp(root.current.rotation.x, 0, 12, delta);
        root.current.rotation.z = THREE.MathUtils.damp(root.current.rotation.z, 0, 12, delta);
        root.current.position.y = THREE.MathUtils.damp(root.current.position.y, 0, 12, delta);
      }
    }

    if (!ridingAmount) return;

    const steering = THREE.MathUtils.clamp(state.steer ?? 0, -1, 1);
    const relaxedSteer = steering * 0.04;

    setBonePosition(bones.hips, 0, -0.035, -0.015, delta, ridingAmount);
    setBone(bones.hips, -0.045, 0, -state.lean * 0.14, delta, ridingAmount);
    setBone(bones.spine, -0.08, 0, -state.lean * 0.1, delta, ridingAmount);
    setBone(bones.spine1, -0.06, 0, -state.lean * 0.07, delta, ridingAmount);
    setBone(bones.spine2, -0.025, 0, -state.lean * 0.045, delta, ridingAmount);
    setBone(bones.neck, 0.05, -steering * 0.02, state.lean * 0.035, delta, ridingAmount);
    setBone(bones.leftShoulder, 0.03, 0.03, 0.08, delta, ridingAmount);
    setBone(bones.rightShoulder, 0.03, -0.03, -0.08, delta, ridingAmount);
    setBone(bones.leftArm, -0.52, -0.08 + relaxedSteer, 0.16, delta, ridingAmount);
    setBone(bones.rightArm, -0.52, 0.08 + relaxedSteer, -0.16, delta, ridingAmount);
    setBone(bones.leftForeArm, -0.74, 0.02, -0.24, delta, ridingAmount);
    setBone(bones.rightForeArm, -0.74, -0.02, 0.24, delta, ridingAmount);
    setBone(bones.leftHand, 0.08, -0.03, 0.05, delta, ridingAmount);
    setBone(bones.rightHand, 0.08, 0.03, -0.05, delta, ridingAmount);
    setBone(bones.leftUpLeg, -0.72, 0.02, -0.06, delta, ridingAmount);
    setBone(bones.rightUpLeg, -0.72, -0.02, 0.06, delta, ridingAmount);
    setBone(bones.leftLeg, 1.05, 0.01, 0.03, delta, ridingAmount);
    setBone(bones.rightLeg, 1.05, -0.01, -0.03, delta, ridingAmount);
    setBone(bones.leftFoot, -0.38, 0.04, -0.02, delta, ridingAmount);
    setBone(bones.rightFoot, -0.38, -0.04, 0.02, delta, ridingAmount);
  });

  return (
    <group ref={group} scale={scale} position={position}>
      <group ref={root}>
        <primitive object={scene} />
      </group>
    </group>
  );
}

useGLTF.preload(IDLE_MODEL);
useGLTF.preload(WALK_MODEL);
useGLTF.preload(RUN_MODEL);
useGLTF.preload(PROVIDED_CHARACTER_MODEL);
