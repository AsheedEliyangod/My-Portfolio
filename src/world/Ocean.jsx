import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";
import * as THREE from "three";

const tiles = [[0, 0]];
const WATER_SIZE = 430;

function WaterTile({ position, index }) {
  const root = useRef();
  const { scene } = useGLTF("/models/small_flat_cube_of_water.glb");

  const { model, scale, offset, materials } = useMemo(() => {
    const clone = cloneSkeleton(scene);
    const collectedMaterials = new Set();

    clone.traverse((child) => {
      if (!child.isMesh) return;
      child.receiveShadow = true;
      child.castShadow = false;
      if (child.material) {
        const material = child.material.clone();
        material.transparent = true;
        material.opacity = 0.78;
        material.roughness = Math.min(material.roughness ?? 0.35, 0.38);
        material.metalness = Math.max(material.metalness ?? 0, 0.05);
        material.side = THREE.DoubleSide;
        child.material = material;
        collectedMaterials.add(material);
      }
    });

    const box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    const footprint = Math.max(size.x, size.z, 0.001);
    const normalizedScale = WATER_SIZE / footprint;
    const normalizedOffset = new THREE.Vector3(-center.x, -box.max.y - 0.03 / normalizedScale, -center.z);

    return {
      model: clone,
      scale: normalizedScale,
      offset: normalizedOffset,
      materials: [...collectedMaterials]
    };
  }, [scene]);

  useFrame(({ clock }) => {
    const time = clock.elapsedTime;
    root.current.position.y = Math.sin(time * 0.7 + index) * 0.035;
    root.current.rotation.z = Math.sin(time * 0.18 + index) * 0.006;
    root.current.rotation.x = Math.cos(time * 0.16 + index) * 0.004;

    for (const material of materials) {
      for (const mapName of ["map", "normalMap", "roughnessMap"]) {
        const map = material[mapName];
        if (!map) continue;
        map.wrapS = THREE.RepeatWrapping;
        map.wrapT = THREE.RepeatWrapping;
        map.repeat.set(18, 18);
        map.offset.x = (time * 0.018 + index * 0.03) % 1;
        map.offset.y = (time * 0.011 + index * 0.02) % 1;
      }
    }
  });

  return (
    <group ref={root} position={[position[0], 0.04, position[1]]} scale={[scale, 0.035, scale]}>
      <primitive object={model} position={offset} />
    </group>
  );
}

export function Ocean() {
  return (
    <group>
      {tiles.map((position, index) => (
        <WaterTile key={`${position[0]}-${position[1]}`} position={position} index={index} />
      ))}
    </group>
  );
}

useGLTF.preload("/models/small_flat_cube_of_water.glb");
