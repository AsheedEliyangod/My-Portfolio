import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";
import * as THREE from "three";

export function ImportedWorldModel({
  url,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  targetSize = 4,
  yOffset = 0
}) {
  const { scene } = useGLTF(url);

  const { model, scale, offset } = useMemo(() => {
    const clone = cloneSkeleton(scene);
    clone.traverse((child) => {
      if (!child.isMesh) return;
      child.castShadow    = true;
      child.receiveShadow = true;
      if (child.material) {
        child.material.roughness  = Math.max(child.material.roughness ?? 0.58, 0.5);
        child.material.needsUpdate = true;
      }
    });

    const box    = new THREE.Box3().setFromObject(clone);
    const size   = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    const footprint       = Math.max(size.x, size.z, 0.001);
    const normalizedScale = targetSize / footprint;
    // yOffset is in MODEL units before scale, so we divide by scale to keep it in world units
    const normalizedOffset = new THREE.Vector3(
      -center.x,
      -box.min.y + yOffset / normalizedScale,
      -center.z
    );

    return { model: clone, scale: normalizedScale, offset: normalizedOffset };
  }, [scene, targetSize, yOffset]);

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <primitive object={model} position={offset} />
    </group>
  );
}

useGLTF.preload("/models/beach_003.glb");
useGLTF.preload("/models/lowpoly_island.glb");
useGLTF.preload("/models/harbor_house_fixed.glb");
useGLTF.preload("/models/coconut_tree.glb");
