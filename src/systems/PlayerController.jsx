import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "../state/GameContext.jsx";
import { clampLength2D } from "../utils/math.js";
import { resolveWorldCollisions } from "../data/worldColliders.js";

const ISLAND_WALK_RADIUS = 14.8;
const PANEL_LOCAL = new THREE.Vector3(0, 1.1, 2.0);
const PANEL_RADIUS = 5.5;
const DOCK_LOCAL_Z = 12.0;
const DOCK_TRIGGER = 2.8;

const WALK_SPEED = 1.05;
const RUN_SPEED = 1.75;
const ACCELERATION = 12;
const DECELERATION = 16;
const ROTATION_DAMPING = 12;

function dampAngle(current, target, lambda, delta) {
  const twoPi = Math.PI * 2;
  const difference = THREE.MathUtils.euclideanModulo(target - current + Math.PI, twoPi) - Math.PI;
  return current + difference * (1 - Math.exp(-lambda * delta));
}

export function PlayerController() {
  const {
    mode,
    player,
    ship,
    input,
    camera,
    openPanel,
    setHint,
    activePanel,
    setMode,
    setNearDock,
    currentIsland,
    setCurrentIsland,
    mobileDock,
    mobilePanel,
    setNearPanel
  } = useGame();

  const velocity = useRef(new THREE.Vector2());
  const desiredVelocity = useRef(new THREE.Vector2());

  useFrame((_, delta) => {
    if (mode !== "walk") return;
    const step = Math.min(delta, 1 / 30);

    const state = player.current;
    const keys = input.current.keys;
    const mobile = input.current.mobile;

    const keyX = (keys.KeyD || keys.ArrowRight ? 1 : 0) + (keys.KeyA || keys.ArrowLeft ? -1 : 0);
    const keyY = (keys.KeyW || keys.ArrowUp ? 1 : 0) + (keys.KeyS || keys.ArrowDown ? -1 : 0);
    const stick = clampLength2D(mobile.x, mobile.y);
    const ix = mobile.active ? stick.x : keyX;
    const iy = mobile.active ? -stick.y : keyY;
    const moving = Math.hypot(ix, iy) > 0.06 && !activePanel;
    const running = moving && !mobile.active && (keys.ShiftLeft || keys.ShiftRight);
    state.animationState = moving ? (running ? "Run" : "Walk") : "Idle";

    desiredVelocity.current.set(0, 0);

    if (moving) {
      const yaw = camera.current.yaw;
      const forwardX = Math.sin(yaw);
      const forwardZ = Math.cos(yaw);
      const rightX = -Math.cos(yaw);
      const rightZ = Math.sin(yaw);

      let dx = forwardX * iy + rightX * ix;
      let dz = forwardZ * iy + rightZ * ix;
      const length = Math.hypot(dx, dz);
      if (length > 0.001) {
        dx /= length;
        dz /= length;
      }

      desiredVelocity.current.set(dx, dz).multiplyScalar(running ? RUN_SPEED : WALK_SPEED);
    }

    velocity.current.lerp(
      desiredVelocity.current,
      1 - Math.exp(-step * (moving ? ACCELERATION : DECELERATION))
    );

    const previousX = state.position.x;
    const previousZ = state.position.z;

    state.position.x += velocity.current.x * step;
    state.position.z += velocity.current.y * step;
    resolveWorldCollisions(state.position, currentIsland);

    state.position.y = 0.52;

    if (currentIsland) {
      const offsetX = state.position.x - currentIsland.worldPos.x;
      const offsetZ = state.position.z - currentIsland.worldPos.z;
      const radius = Math.hypot(offsetX, offsetZ);
      if (radius > ISLAND_WALK_RADIUS) {
        state.position.x = currentIsland.worldPos.x + (offsetX / radius) * ISLAND_WALK_RADIUS;
        state.position.z = currentIsland.worldPos.z + (offsetZ / radius) * ISLAND_WALK_RADIUS;
      }
    }

    const actualX = state.position.x - previousX;
    const actualZ = state.position.z - previousZ;
    const actualSpeed = Math.hypot(actualX, actualZ) / Math.max(step, 0.0001);

    state.speed = actualSpeed;
    state.isRunning = running && actualSpeed > WALK_SPEED * 0.7;
    state.moveAmount = THREE.MathUtils.clamp(actualSpeed / RUN_SPEED, 0, 1);

    if (actualSpeed > 0.025) {
      state.rotation = dampAngle(
        state.rotation,
        Math.atan2(actualX, actualZ),
        ROTATION_DAMPING,
        step
      );
    }

    if (!currentIsland) return;

    const panelWorld = new THREE.Vector3(
      currentIsland.worldPos.x + PANEL_LOCAL.x,
      state.position.y,
      currentIsland.worldPos.z + PANEL_LOCAL.z
    );
    const dockWorld = new THREE.Vector3(
      currentIsland.worldPos.x,
      state.position.y,
      currentIsland.worldPos.z + DOCK_LOCAL_Z
    );
    const nearPanel = state.position.distanceTo(panelWorld) < PANEL_RADIUS;
    const nearDock = state.position.distanceTo(dockWorld) < DOCK_TRIGGER;

    if (nearPanel && !nearDock) {
      setHint(`Press E to open ${currentIsland.label}`);
      setNearPanel(true);
      if (!activePanel && (keys.KeyE || mobilePanel.current.triggered)) {
        openPanel(currentIsland.id);
        keys.KeyE = false;
        mobilePanel.current.triggered = false;
      }
    } else if (nearDock) {
      setNearPanel(false);
      setHint("Press E to board ship");
      if (keys.KeyE || mobileDock.current.triggered) {
        setMode("ship");
        setNearDock(true);
        ship.current.position.set(currentIsland.worldPos.x, 0.35, currentIsland.worldPos.z + 22);
        ship.current.rotation = Math.PI;
        setCurrentIsland(null);
        keys.KeyE = false;
        mobileDock.current.triggered = false;
      }
    } else {
      setNearPanel(false);
      setHint(`Explore the ${currentIsland.label} island`);
    }
  });

  return null;
}
