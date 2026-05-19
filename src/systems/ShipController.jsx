import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "../state/GameContext.jsx";
import { clampLength2D } from "../utils/math.js";
import { ISLANDS } from "../world/Island.jsx";
import { resolveShipCollisions } from "../data/worldColliders.js";

const DOCK_POINTS = ISLANDS.map((island) =>
  new THREE.Vector3(island.worldPos.x, 0, island.worldPos.z + 14)
);
const DOCK_TRIGGER_RADIUS = 8.0;

const MAX_THRUST = 6.0;
const MAX_SPEED = 32.0;
const WATER_DRAG = 0.978;
const TURN_RATE = 0.52;
const DRIFT_ALIGN = 0.028;
const REVERSE_FACTOR = 0.28;
const WAVE_PUSH = 0.012;
const INPUT_SMOOTHING = 2.6;

export function ShipController() {
  const {
    mode,
    setMode,
    ship,
    player,
    input,
    camera,
    setNearDock,
    setHint,
    activePanel,
    setCurrentIsland,
    mobileDock
  } = useGame();

  const velocity = useRef(new THREE.Vector2(0, 0));
  const heading = useRef(Math.PI);
  const throttle = useRef(0);
  const rudder = useRef(0);

  useFrame(({ clock }, delta) => {
    if (mode !== "ship") return;
    const step = Math.min(delta, 1 / 30);

    const state = ship.current;
    const keys = input.current.keys;
    const mobile = input.current.mobile;

    const stick = clampLength2D(mobile.x, mobile.y);
    const forwardInput = mobile.active
      ? -stick.y
      : (keys.KeyW || keys.ArrowUp ? 1 : 0) + (keys.KeyS || keys.ArrowDown ? -1 : 0);
    const turnInput = mobile.active
      ? -stick.x
      : (keys.KeyA || keys.ArrowLeft ? 1 : 0) + (keys.KeyD || keys.ArrowRight ? -1 : 0);

    throttle.current = THREE.MathUtils.damp(
      throttle.current,
      THREE.MathUtils.clamp(forwardInput, -1, 1),
      INPUT_SMOOTHING,
      step
    );
    rudder.current = THREE.MathUtils.damp(
      rudder.current,
      THREE.MathUtils.clamp(turnInput, -1, 1),
      INPUT_SMOOTHING,
      step
    );

    const headingX = Math.sin(heading.current);
    const headingZ = Math.cos(heading.current);
    const forwardSpeed = velocity.current.x * headingX + velocity.current.y * headingZ;
    const speedFactor = THREE.MathUtils.smoothstep(Math.abs(forwardSpeed), 0.15, MAX_SPEED);

    heading.current += rudder.current * TURN_RATE * (0.12 + speedFactor * 0.88) * step;
    state.rotation = heading.current;

    const force = throttle.current > 0
      ? throttle.current * MAX_THRUST
      : throttle.current * MAX_THRUST * REVERSE_FACTOR;

    velocity.current.x += Math.sin(heading.current) * force * step;
    velocity.current.y += Math.cos(heading.current) * force * step;

    const dragFactor = Math.pow(WATER_DRAG, step * 60);
    velocity.current.multiplyScalar(dragFactor);

    const alignedX = Math.sin(heading.current) * forwardSpeed;
    const alignedZ = Math.cos(heading.current) * forwardSpeed;
    velocity.current.x = THREE.MathUtils.lerp(velocity.current.x, alignedX, DRIFT_ALIGN);
    velocity.current.y = THREE.MathUtils.lerp(velocity.current.y, alignedZ, DRIFT_ALIGN);

    const time = clock.elapsedTime;
    velocity.current.x += Math.sin(time * 0.18) * WAVE_PUSH * step;
    velocity.current.y += Math.cos(time * 0.22) * WAVE_PUSH * step;

    const speed = velocity.current.length();
    if (speed > MAX_SPEED) velocity.current.multiplyScalar(MAX_SPEED / speed);

    state.position.x += velocity.current.x * step;
    state.position.z += velocity.current.y * step;
    state.position.y = 0.35;
    state.position.clamp(
      new THREE.Vector3(-220, 0.35, -220),
      new THREE.Vector3(220, 0.35, 220)
    );

    state.speed = velocity.current.x * Math.sin(heading.current) + velocity.current.y * Math.cos(heading.current);
    state.turnInput = rudder.current;
    state.throttle = throttle.current;
    state.velocity = velocity.current.length();

    const preX = state.position.x;
    const preZ = state.position.z;
    resolveShipCollisions(state, ISLANDS);
    const pushX = state.position.x - preX;
    const pushZ = state.position.z - preZ;
    if (pushX !== 0 || pushZ !== 0) {
      const length = Math.hypot(pushX, pushZ);
      if (length > 0.0001) {
        const normalX = pushX / length;
        const normalZ = pushZ / length;
        const dot = velocity.current.x * normalX + velocity.current.y * normalZ;
        if (dot < 0) {
          velocity.current.x -= dot * normalX;
          velocity.current.y -= dot * normalZ;
        }
      }
      velocity.current.multiplyScalar(0.12);
    }

    let nearestIsland = null;
    let nearestDistance = Infinity;
    for (let index = 0; index < DOCK_POINTS.length; index += 1) {
      const distance = state.position.distanceTo(DOCK_POINTS[index]);
      if (distance < DOCK_TRIGGER_RADIUS && distance < nearestDistance) {
        nearestDistance = distance;
        nearestIsland = ISLANDS[index];
      }
    }

    const isNear = nearestIsland !== null;
    setNearDock(isNear);
    setHint(isNear ? `Press E to dock at ${nearestIsland.label} island` : "Sail toward an island");

    const dockTriggered = isNear && (keys.KeyE || mobileDock.current.triggered);
    if (!activePanel && dockTriggered) {
      setMode("walk");
      velocity.current.set(0, 0);
      throttle.current = 0;
      rudder.current = 0;
      state.speed = 0;
      state.velocity = 0;
      player.current.position.set(nearestIsland.worldPos.x, 0.52, nearestIsland.worldPos.z + 12);
      player.current.rotation = Math.PI;
      camera.current.yaw = Math.PI;
      camera.current.pitch = 0;
      setCurrentIsland(nearestIsland);
      setHint(`Explore the ${nearestIsland.label} island`);
      keys.KeyE = false;
      mobileDock.current.triggered = false;
    }
  });

  return null;
}
