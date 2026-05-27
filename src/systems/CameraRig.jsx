import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "../state/GameContext.jsx";

const target = new THREE.Vector3();
const ideal = new THREE.Vector3();

function dampAngle(current, targetAngle, lambda, delta) {
  const twoPi = Math.PI * 2;
  const difference = THREE.MathUtils.euclideanModulo(targetAngle - current + Math.PI, twoPi) - Math.PI;
  return current + difference * (1 - Math.exp(-lambda * delta));
}

export function CameraRig() {
  const { camera: threeCamera, gl } = useThree();
  const { mode, ship, player, bike, camera, input, activePanel } = useGame();
  const pointer = useRef({ dragging: false, x: 0, y: 0 });

  useEffect(() => {
    const element = gl.domElement;
    const down = (event) => {
      pointer.current.dragging = true;
      pointer.current.x = event.clientX;
      pointer.current.y = event.clientY;
    };
    const move = (event) => {
      if (!pointer.current.dragging || activePanel) return;
      const dx = event.clientX - pointer.current.x;
      const dy = event.clientY - pointer.current.y;
      camera.current.yaw -= dx * 0.004;
      camera.current.pitch = THREE.MathUtils.clamp(camera.current.pitch - dy * 0.0025, -0.55, 0.18);
      pointer.current.x = event.clientX;
      pointer.current.y = event.clientY;
    };
    const up = () => {
      pointer.current.dragging = false;
    };
    element.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      element.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [activePanel, camera, gl.domElement]);

  useFrame((_, delta) => {
    if (!activePanel) {
      const look = input.current.look;
      camera.current.yaw -= look.x * 0.018;
      camera.current.pitch = THREE.MathUtils.clamp(camera.current.pitch - look.y * 0.012, -0.55, 0.18);
    }

    // The same follow rig serves both vehicles and walking; only offset changes.
    const cycling = mode === "bike" || mode === "mountBike" || mode === "dismountBike";
    const subject = mode === "ship" ? ship.current : cycling ? bike.current : player.current;
    const bikeSpeed01 = cycling ? THREE.MathUtils.clamp(Math.abs(bike.current.speed) / 12.2, 0, 1) : 0;
    const lookQuiet = Math.abs(input.current.look.x) + Math.abs(input.current.look.y) < 0.015;
    if (mode === "bike" && !activePanel && !pointer.current.dragging && lookQuiet && bikeSpeed01 > 0.08) {
      camera.current.yaw = dampAngle(camera.current.yaw, bike.current.rotation, 0.85 + bikeSpeed01 * 0.75, delta);
    }
    target.set(
      subject.position.x,
      mode === "ship"
        ? subject.position.y + 1.2
        : cycling
          ? subject.position.y + THREE.MathUtils.lerp(1.24, 1.55, bikeSpeed01)
          : subject.position.y + 0.72,
      subject.position.z
    );
    const distance = mode === "ship" ? 20 : cycling ? THREE.MathUtils.lerp(8.9, 11.8, bikeSpeed01) : 6.4;
    const height = mode === "ship" ? 7.2 : cycling ? THREE.MathUtils.lerp(3.6, 4.7, bikeSpeed01) : 3.2;
    ideal.set(
      target.x - Math.sin(camera.current.yaw) * distance,
      target.y + height + camera.current.pitch * 5,
      target.z - Math.cos(camera.current.yaw) * distance
    );
    const followSpeed = mode === "ship" ? 4.2 : cycling ? THREE.MathUtils.lerp(7.2, 5.2, bikeSpeed01) : 7.5;
    threeCamera.position.lerp(ideal, 1 - Math.exp(-delta * followSpeed));
    threeCamera.lookAt(target);
  });

  return null;
}
