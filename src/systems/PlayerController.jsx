import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "../state/GameContext.jsx";
import { clampLength2D } from "../utils/math.js";
import { PLAYER_RADIUS, resolveParkedBicycleCollision, resolveWorldCollisions } from "../data/worldColliders.js";
import { ISLANDS, terrainHeight } from "../world/Island.jsx";

const PANEL_LOCAL = new THREE.Vector3(0, 1.1, 6.2);
const PANEL_RADIUS = 9.4;
const DOCK_LOCAL_Z = 96.5;
const DOCK_TRIGGER = 6.4;
const BIKE_PRIORITY_RADIUS = 5.6;

const WALK_SPEED = 2.05;
const RUN_SPEED = 4.45;
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
    bike,
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
    const activeLocation = ISLANDS.reduce((nearest, island) => {
      const distance = state.position.distanceTo(island.worldPos);
      return distance < nearest.distance ? { island, distance } : nearest;
    }, { island: currentIsland ?? ISLANDS[0], distance: Infinity }).island;

    if (activeLocation && activeLocation !== currentIsland) {
      setCurrentIsland(activeLocation);
    }

    state.position.x += velocity.current.x * step;
    state.position.z += velocity.current.y * step;
    const collision = resolveWorldCollisions(state.position, activeLocation, PLAYER_RADIUS);
    const bikeCollision = !activePanel && state.position.distanceTo(bike.current.position) < 3.2
      ? resolveParkedBicycleCollision(state.position, bike.current, PLAYER_RADIUS)
      : null;
    if (bikeCollision?.hit) {
      collision.hit = true;
      collision.correctionX += bikeCollision.correctionX;
      collision.correctionZ += bikeCollision.correctionZ;
      collision.hits += bikeCollision.hits;
    }
    if (collision.hit) {
      const correctionLength = Math.hypot(collision.correctionX, collision.correctionZ);
      if (correctionLength > 0.0001) {
        const nx = collision.correctionX / correctionLength;
        const nz = collision.correctionZ / correctionLength;
        const inwardSpeed = velocity.current.x * nx + velocity.current.y * nz;
        if (inwardSpeed < 0) {
          velocity.current.x -= nx * inwardSpeed;
          velocity.current.y -= nz * inwardSpeed;
        }
        velocity.current.multiplyScalar(0.82);
      }
    }

    state.position.y = terrainHeight(state.position.x, state.position.z) + 0.72;

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

    if (!activeLocation) return;

    const panelWorld = new THREE.Vector3(
      activeLocation.worldPos.x + PANEL_LOCAL.x,
      state.position.y,
      activeLocation.worldPos.z + PANEL_LOCAL.z
    );
    const dockWorld = new THREE.Vector3(
      0,
      state.position.y,
      DOCK_LOCAL_Z
    );
    const nearPanel = state.position.distanceTo(panelWorld) < PANEL_RADIUS;
    const nearDock = state.position.distanceTo(dockWorld) < DOCK_TRIGGER;
    const nearBike = state.position.distanceTo(bike.current.position) < BIKE_PRIORITY_RADIUS && !activePanel;

    if (nearBike) {
      setNearPanel(false);
      setNearDock(false);
      setHint("Press E to Ride Bicycle");
      mobilePanel.current.triggered = false;
      mobileDock.current.triggered = false;
      return;
    }

    if (nearPanel && !nearDock) {
      setHint(`Press E to inspect ${activeLocation.label}`);
      setNearPanel(true);
      if (!activePanel && (keys.KeyE || mobilePanel.current.triggered)) {
        openPanel(activeLocation.id);
        keys.KeyE = false;
        mobilePanel.current.triggered = false;
      }
    } else if (nearDock) {
      setNearPanel(false);
      setHint("Press E to board ship");
      if (keys.KeyE || mobileDock.current.triggered) {
        setMode("ship");
        setNearDock(true);
        ship.current.position.set(0, 0.35, DOCK_LOCAL_Z + 10);
        ship.current.rotation = Math.PI;
        setCurrentIsland(null);
        keys.KeyE = false;
        mobileDock.current.triggered = false;
      }
    } else {
      setNearPanel(false);
      setHint(`Explore the ${activeLocation.label}`);
    }
  });

  return null;
}
