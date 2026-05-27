import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "../state/GameContext.jsx";
import { clampLength2D } from "../utils/math.js";
import { resolveBicycleCollisions } from "../data/worldColliders.js";
import { terrainHeight, ISLANDS } from "../world/Island.jsx";

const BIKE_TRIGGER_RADIUS = 5.6;
const MAX_SPEED = 12.2;
const ACCELERATION = 7.2;
const BRAKING = 12.4;
const DRAG = 1.08;
const TURN_RATE = 1.28;
const WHEEL_RADIUS = 0.34;
const PEDAL_GEAR_RATIO = 2.05;

function dampAngle(current, target, lambda, delta) {
  const twoPi = Math.PI * 2;
  const difference = THREE.MathUtils.euclideanModulo(target - current + Math.PI, twoPi) - Math.PI;
  return current + difference * (1 - Math.exp(-lambda * delta));
}

function smootherStep(t) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function nearestIsland(position, fallback) {
  return ISLANDS.reduce((nearest, island) => {
    const distance = position.distanceTo(island.worldPos);
    return distance < nearest.distance ? { island, distance } : nearest;
  }, { island: fallback ?? ISLANDS[0], distance: Infinity }).island;
}

export function BikeController() {
  const {
    mode,
    setMode,
    player,
    bike,
    input,
    camera,
    activePanel,
    setHint,
    currentIsland,
    setCurrentIsland,
    setNearBike,
    mobileBike
  } = useGame();

  const velocity = useRef(0);
  const steer = useRef(0);
  const mountClock = useRef(0);
  const dismountClock = useRef(0);
  const mountStart = useRef(new THREE.Vector3());
  const mountStartRot = useRef(0);

  useFrame(({ clock }, delta) => {
    const step = Math.min(delta, 1 / 30);
    const b = bike.current;
    const keys = input.current.keys;
    const mobile = input.current.mobile;

    if (mode === "walk") {
      b.position.y = terrainHeight(b.position.x, b.position.z) - 0.04;
      const distanceToBike = player.current.position.distanceTo(b.position);
      const nearBike = distanceToBike < BIKE_TRIGGER_RADIUS && !activePanel;
      setNearBike(nearBike);
      if (nearBike) {
        setHint("Press E to Ride Bicycle");
        if (keys.KeyE || mobileBike.current.triggered) {
          const right = new THREE.Vector3(Math.cos(b.rotation), 0, -Math.sin(b.rotation));
          const toPlayer = player.current.position.clone().sub(b.position);
          b.mountSide = Math.sign(toPlayer.dot(right)) || -1;
          mountClock.current = 0;
          mountStart.current.copy(player.current.position);
          mountStartRot.current = player.current.rotation;
          velocity.current = 0;
          b.speed = 0;
          b.riderBlend = 0;
          b.riderPose = "mount";
          b.transitionTime = 0;
          setMode("mountBike");
          setNearBike(false);
          keys.KeyE = false;
          mobileBike.current.triggered = false;
        }
      }
      return;
    }

    if (mode === "mountBike") {
      mountClock.current += step;
      const t = THREE.MathUtils.clamp(mountClock.current / 1.36, 0, 1);
      const ease = smootherStep(t);
      const mountTarget = new THREE.Vector3(
        b.position.x,
        terrainHeight(b.position.x, b.position.z) + 0.68,
        b.position.z
      );
      player.current.position.lerpVectors(mountStart.current, mountTarget, ease);
      player.current.rotation = dampAngle(mountStartRot.current, b.rotation, 8, step);
      player.current.speed = 0;
      player.current.animationState = "MountBike";
      b.riderBlend = ease;
      b.riderPose = "mount";
      b.transitionTime = t;
      b.steer = THREE.MathUtils.damp(b.steer, 0, 8, step);
      b.lean = THREE.MathUtils.damp(b.lean, 0, 8, step);
      camera.current.yaw = dampAngle(camera.current.yaw, b.rotation, 2.4, step);
      camera.current.pitch = THREE.MathUtils.damp(camera.current.pitch, -0.16, 2.8, step);
      if (t >= 1) {
        setMode("bike");
        camera.current.yaw = b.rotation;
        camera.current.pitch = -0.16;
      }
      return;
    }

    if (mode === "dismountBike") {
      dismountClock.current += step;
      const t = THREE.MathUtils.clamp(dismountClock.current / 1.18, 0, 1);
      const ease = smootherStep(t);
      b.riderBlend = 1 - ease;
      b.riderPose = "dismount";
      velocity.current = THREE.MathUtils.damp(velocity.current, 0, 5.5, step);
      b.speed = velocity.current;
      b.transitionTime = 1 - t;
      const dismountSide = b.mountSide || 1;
      const side = new THREE.Vector3(Math.cos(b.rotation), 0, -Math.sin(b.rotation)).multiplyScalar(1.55 * dismountSide);
      player.current.position.set(
        b.position.x + side.x * ease,
        terrainHeight(b.position.x + side.x * ease, b.position.z + side.z * ease) + 0.68,
        b.position.z + side.z * ease
      );
      player.current.rotation = b.rotation;
      player.current.animationState = "DismountBike";
      if (t >= 1) {
        player.current.speed = 0;
        player.current.animationState = "Idle";
        setCurrentIsland(nearestIsland(player.current.position, currentIsland));
        setMode("walk");
      }
      return;
    }

    if (mode !== "bike") return;

    setNearBike(false);
    const stick = clampLength2D(mobile.x, mobile.y);
    const forwardInput = activePanel ? 0 : mobile.active
      ? -stick.y
      : (keys.KeyW || keys.ArrowUp ? 1 : 0) + (keys.KeyS || keys.ArrowDown ? -1 : 0);
    const steerInput = activePanel ? 0 : mobile.active
      ? -stick.x
      : (keys.KeyA || keys.ArrowLeft ? 1 : 0) + (keys.KeyD || keys.ArrowRight ? -1 : 0);

    const targetSteer = THREE.MathUtils.clamp(steerInput, -1, 1);
    steer.current = THREE.MathUtils.damp(steer.current, targetSteer, 4.2, step);
    const inputForce = forwardInput > 0 ? forwardInput * ACCELERATION : forwardInput * BRAKING;
    velocity.current += inputForce * step;
    velocity.current -= velocity.current * DRAG * step * (forwardInput === 0 ? 1 : 0.32);
    if (forwardInput === 0 && Math.abs(velocity.current) < 0.045) velocity.current = 0;
    velocity.current = THREE.MathUtils.clamp(velocity.current, -3.4, MAX_SPEED);

    const controlSpeed01 = THREE.MathUtils.clamp(Math.abs(velocity.current) / MAX_SPEED, 0, 1);
    b.rotation += steer.current * TURN_RATE * (0.12 + controlSpeed01 * 0.88) * Math.sign(velocity.current || 1) * step;
    const previousX = b.position.x;
    const previousZ = b.position.z;
    b.position.x += Math.sin(b.rotation) * velocity.current * step;
    b.position.z += Math.cos(b.rotation) * velocity.current * step;

    const collision = resolveBicycleCollisions(b);
    if (collision.hit) {
      const correctionLength = Math.hypot(collision.correctionX, collision.correctionZ);
      if (correctionLength > 0.0001) {
        const nx = collision.correctionX / correctionLength;
        const nz = collision.correctionZ / correctionLength;
        const direction = Math.sign(velocity.current || 1);
        const moveX = Math.sin(b.rotation) * direction;
        const moveZ = Math.cos(b.rotation) * direction;
        const headOnImpact = moveX * nx + moveZ * nz < -0.22;
        velocity.current *= headOnImpact ? -0.1 : 0.42;
        steer.current *= 0.35;
        b.lean = THREE.MathUtils.damp(b.lean, 0, 10, step);
      }
    }

    const movedX = b.position.x - previousX;
    const movedZ = b.position.z - previousZ;
    const signedTravel = movedX * Math.sin(b.rotation) + movedZ * Math.cos(b.rotation);
    const actualVelocity = signedTravel / Math.max(step, 0.0001);
    const speed01 = THREE.MathUtils.clamp(Math.abs(actualVelocity) / MAX_SPEED, 0, 1);
    const ground = terrainHeight(b.position.x, b.position.z);
    const terrainBounce = (
      Math.sin(clock.elapsedTime * 6.2 + b.position.x * 0.11 + b.position.z * 0.08) * 0.045 +
      Math.sin(clock.elapsedTime * 11.4 + b.position.x * 0.03) * 0.018
    ) * speed01;
    b.position.y = ground - 0.04;
    b.speed = actualVelocity;
    b.steer = steer.current;
    b.lean = THREE.MathUtils.damp(b.lean, -steer.current * (0.08 + speed01 * 0.28), 5.8, step);
    b.suspension = THREE.MathUtils.damp(b.suspension, terrainBounce, 7.5, step);
    const wheelAngularDelta = signedTravel / WHEEL_RADIUS;
    b.wheelSpin = THREE.MathUtils.euclideanModulo(b.wheelSpin - wheelAngularDelta, Math.PI * 2);
    b.pedalAngle = THREE.MathUtils.euclideanModulo(b.pedalAngle - wheelAngularDelta / PEDAL_GEAR_RATIO, Math.PI * 2);
    b.riderBlend = THREE.MathUtils.damp(b.riderBlend, 1, 7, step);
    b.riderPose = Math.abs(actualVelocity) < 0.18 ? "bikeStop" : "cycle";
    b.transitionTime = 1;

    player.current.position.set(b.position.x, b.position.y + 0.28, b.position.z);
    player.current.rotation = b.rotation;
    player.current.speed = Math.abs(actualVelocity);
    player.current.isRunning = false;
    player.current.animationState = Math.abs(actualVelocity) < 0.25 ? "BikeStop" : "Cycle";
    setCurrentIsland(nearestIsland(b.position, currentIsland));
    setHint(Math.abs(actualVelocity) < 0.3 ? "Pedal with W / dismount with E" : "Cycling - E to dismount");

    if (!activePanel && (keys.KeyE || mobileBike.current.triggered)) {
      b.mountSide = b.mountSide || 1;
      dismountClock.current = 0;
      setMode("dismountBike");
      keys.KeyE = false;
      mobileBike.current.triggered = false;
    }
  });

  return null;
}
