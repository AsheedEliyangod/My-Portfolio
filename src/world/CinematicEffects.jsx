import { useEffect, useMemo } from "react";
import { extend, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { isPhoneDevice } from "../utils/device.js";

extend({ EffectComposer, RenderPass, UnrealBloomPass, OutputPass });

export function CinematicEffects() {
  const { gl, scene, camera, size } = useThree();
  const isPhone = useMemo(() => isPhoneDevice(), []);
  const composer = useMemo(() => {
    const next = new EffectComposer(gl);
    next.addPass(new RenderPass(scene, camera));
    if (!isPhone) {
      next.addPass(new UnrealBloomPass(new THREE.Vector2(size.width, size.height), 0.48, 0.72, 0.18));
    } else {
      next.addPass(new UnrealBloomPass(new THREE.Vector2(size.width, size.height), 0.18, 0.55, 0.28));
    }
    next.addPass(new OutputPass());
    return next;
  }, [camera, gl, isPhone, scene, size.height, size.width]);

  useEffect(() => {
    composer.setSize(size.width, size.height);
    composer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isPhone ? 1 : 1.5));
  }, [composer, isPhone, size.height, size.width]);

  useFrame(() => {
    composer.render();
  }, 1);

  return null;
}
