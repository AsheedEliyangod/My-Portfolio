import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const WATER_LEVEL = -0.34;
const ISLAND_CENTER_Z = 8;
const SHORE_INNER_RADIUS = 98;
const OCEAN_OUTER_RADIUS = 430;

const oceanVertexShader = `
  uniform float uTime;
  uniform float uInnerRadius;
  varying vec2 vUv;
  varying float vWave;
  varying float vShore;
  varying float vDepth;
  varying float vAngle;

  void main() {
    vUv = uv;
    vec3 p = position;
    float radius = length(p.xy);
    vDepth = smoothstep(uInnerRadius, uInnerRadius + 145.0, radius);
    vShore = 1.0 - smoothstep(uInnerRadius + 2.0, uInnerRadius + 34.0, radius);
    vAngle = atan(p.y, p.x);

    float longSwell = sin(p.x * 0.018 + p.y * 0.011 + uTime * 0.34) * 0.42;
    float crossSwell = cos(p.y * 0.026 - uTime * 0.28) * 0.28;
    float shoreRipple = sin(radius * 0.22 - uTime * 1.55 + sin(vAngle * 7.0) * 1.2) * 0.18 * vShore;
    float wave = (longSwell + crossSwell) * mix(0.32, 1.0, vDepth) + shoreRipple;
    p.z += wave;
    vWave = wave;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const oceanFragmentShader = `
  uniform float uTime;
  uniform vec3 uDeep;
  uniform vec3 uMid;
  uniform vec3 uShallow;
  varying vec2 vUv;
  varying float vWave;
  varying float vShore;
  varying float vDepth;
  varying float vAngle;

  float band(float value, float width) {
    return smoothstep(1.0 - width, 1.0, value);
  }

  void main() {
    vec3 color = mix(uShallow, uMid, smoothstep(0.0, 0.55, vDepth));
    color = mix(color, uDeep, smoothstep(0.45, 1.0, vDepth));
    color += vec3(0.08, 0.18, 0.22) * max(vWave, 0.0);

    float windLines = band(sin((vUv.x * 54.0 + vUv.y * 26.0) + uTime * 0.9), 0.08) * 0.08;
    float shorePulse = sin(vAngle * 36.0 + uTime * 0.55) * 0.5 + 0.5;
    float shoreFoam = vShore * band(sin(vUv.y * 95.0 - uTime * 2.2 + shorePulse * 2.4), 0.14);
    float softFoam = vShore * smoothstep(0.08, 0.92, shorePulse) * 0.22;
    color += vec3(0.7, 0.94, 1.0) * (windLines + shoreFoam * 0.58 + softFoam);

    float alpha = mix(0.88, 0.96, vDepth);
    alpha = mix(alpha, 0.76, vShore * 0.45);
    gl_FragColor = vec4(color, alpha);
  }
`;

const foamVertexShader = `
  uniform float uTime;
  varying vec2 vUv;
  varying float vBand;

  void main() {
    vUv = uv;
    vec3 p = position;
    float radius = length(p.xy);
    vBand = smoothstep(0.12, 0.5, uv.y) * (1.0 - smoothstep(0.68, 1.0, uv.y));
    p.z += sin(radius * 0.34 - uTime * 1.8) * 0.035;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const foamFragmentShader = `
  uniform float uTime;
  varying vec2 vUv;
  varying float vBand;

  void main() {
    float streaks = smoothstep(0.48, 1.0, sin(vUv.x * 115.0 + vUv.y * 18.0 - uTime * 1.7));
    float broken = smoothstep(0.28, 0.92, sin(vUv.x * 29.0 - uTime * 0.4) * 0.5 + 0.5);
    float alpha = vBand * streaks * broken * 0.34;
    gl_FragColor = vec4(0.78, 0.96, 1.0, alpha);
  }
`;

const harborVertexShader = `
  uniform float uTime;
  varying vec2 vUv;
  varying float vWave;

  void main() {
    vUv = uv;
    vec3 p = position;
    float wave = sin(p.x * 0.28 + uTime * 0.72) * 0.035 + cos(p.y * 0.2 - uTime * 0.48) * 0.025;
    p.z += wave;
    vWave = wave;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const harborFragmentShader = `
  uniform float uTime;
  varying vec2 vUv;
  varying float vWave;

  void main() {
    vec3 deep = vec3(0.035, 0.11, 0.16);
    vec3 calm = vec3(0.09, 0.24, 0.29);
    vec3 color = mix(deep, calm, smoothstep(-0.04, 0.05, vWave));
    float reflection = smoothstep(0.88, 1.0, sin(vUv.y * 42.0 + uTime * 0.9)) * 0.1;
    float foam = smoothstep(0.93, 1.0, sin((vUv.x + vUv.y) * 60.0 - uTime * 1.2)) * 0.1;
    color += vec3(0.55, 0.9, 1.0) * (reflection + foam);
    gl_FragColor = vec4(color, 0.76);
  }
`;

function AnimatedShaderMaterial({ materialRef, uniforms, vertexShader, fragmentShader, opacity = true }) {
  return (
    <shaderMaterial
      ref={materialRef}
      uniforms={uniforms}
      vertexShader={vertexShader}
      fragmentShader={fragmentShader}
      transparent={opacity}
      depthWrite={false}
      side={THREE.DoubleSide}
    />
  );
}

function HarborWaterPlane({ position, scale, rotation = 0 }) {
  const material = useRef();
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  useFrame(({ clock }) => {
    if (material.current) material.current.uniforms.uTime.value = clock.elapsedTime;
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, rotation]} position={position} scale={scale} receiveShadow>
      <planeGeometry args={[1, 1, 28, 28]} />
      <AnimatedShaderMaterial
        materialRef={material}
        uniforms={uniforms}
        vertexShader={harborVertexShader}
        fragmentShader={harborFragmentShader}
      />
    </mesh>
  );
}

function ShorelineFoam() {
  const material = useRef();
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  useFrame(({ clock }) => {
    if (material.current) material.current.uniforms.uTime.value = clock.elapsedTime;
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, WATER_LEVEL + 0.055, ISLAND_CENTER_Z]}>
      <ringGeometry args={[SHORE_INNER_RADIUS - 1.2, SHORE_INNER_RADIUS + 7.4, 256, 8]} />
      <AnimatedShaderMaterial
        materialRef={material}
        uniforms={uniforms}
        vertexShader={foamVertexShader}
        fragmentShader={foamFragmentShader}
      />
    </mesh>
  );
}

export function Ocean() {
  const material = useRef();
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uInnerRadius: { value: SHORE_INNER_RADIUS },
    uDeep: { value: new THREE.Color("#03101f") },
    uMid: { value: new THREE.Color("#0b2d3c") },
    uShallow: { value: new THREE.Color("#1a6070") },
  }), []);

  useFrame(({ clock }) => {
    if (material.current) material.current.uniforms.uTime.value = clock.elapsedTime;
  });

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, WATER_LEVEL, ISLAND_CENTER_Z]} receiveShadow>
        <ringGeometry args={[SHORE_INNER_RADIUS, OCEAN_OUTER_RADIUS, 288, 44]} />
        <AnimatedShaderMaterial
          materialRef={material}
          uniforms={uniforms}
          vertexShader={oceanVertexShader}
          fragmentShader={oceanFragmentShader}
        />
      </mesh>
      <ShorelineFoam />
      <HarborWaterPlane position={[-9.1, WATER_LEVEL + 0.04, 105]} scale={[8.2, 28, 1]} rotation={0.02} />
      <HarborWaterPlane position={[9.1, WATER_LEVEL + 0.04, 107]} scale={[8.2, 27, 1]} rotation={-0.02} />
      <HarborWaterPlane position={[0, WATER_LEVEL + 0.035, 117.5]} scale={[24, 7.8, 1]} />
    </group>
  );
}
