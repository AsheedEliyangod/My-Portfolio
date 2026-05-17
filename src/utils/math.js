import * as THREE from "three";

export const tmpVec3 = new THREE.Vector3();

export function clampLength2D(x, y) {
  const length = Math.hypot(x, y);
  if (length <= 1) return { x, y };
  return { x: x / length, y: y / length };
}

export function waveHeight(x, z, time) {
  return (
    Math.sin(x * 0.13 + time * 0.85) * 0.18 +
    Math.sin(z * 0.11 + time * 1.05) * 0.15 +
    Math.sin((x + z) * 0.055 + time * 0.55) * 0.28
  );
}

export function ease(current, target, factor) {
  return THREE.MathUtils.lerp(current, target, 1 - Math.exp(-factor));
}
