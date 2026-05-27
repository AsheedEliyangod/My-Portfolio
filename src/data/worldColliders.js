import * as THREE from "three";

export const PLAYER_RADIUS = 0.32;
export const BICYCLE_RADIUS = 0.28;
export const SHIP_RADIUS = 3.4;

const WORLD_CENTER = new THREE.Vector2(0, 8);
const WORLD_BOUNDARY_RADIUS = 109;
const MAIN_ISLAND_CENTER = new THREE.Vector2(0, 8);
const MAIN_ISLAND_SHIP_RADIUS = 100;

const ISLAND_ROOTS = {
  about: new THREE.Vector2(-46, -46),
  projects: new THREE.Vector2(-72, 10),
  skills: new THREE.Vector2(64, -20),
  resume: new THREE.Vector2(-34, 62),
  contact: new THREE.Vector2(58, 56),
};

function seeded(index) {
  return THREE.MathUtils.euclideanModulo(Math.sin(index * 91.17) * 43758.5453, 1);
}

function circle(id, x, z, r, response = 1) {
  return { id, type: "circle", x, z, r, response };
}

function box(id, x, z, hx, hz, rotation = 0, response = 1) {
  return { id, type: "box", x, z, hx, hz, rotation, response };
}

export const localIslandColliders = {
  about: [
    box("developer-house", 0, 0, 6.0, 4.05),
    box("developer-deck", 0, 6.8, 6.45, 3.45),
    circle("guest-house", 9.5, -5.5, 3.4),
  ],
  projects: [
    box("studio-building", 0, 0, 7.55, 5.05),
    circle("project-annex", -12, -8, 4.25),
  ],
  skills: [
    circle("tower-left", -10, 2, 2.15),
    circle("tower-mid", -3, -4, 2.45),
    circle("tower-right", 6, -1, 2.1),
    circle("tower-edge", 13, 5, 1.95),
    circle("tower-front", 3, 8, 1.85),
  ],
  resume: [
    circle("observatory", 0, 0, 5.8),
    box("archive", 0, 7.2, 5.45, 1.55),
  ],
  contact: [
    circle("comms-tower", 0, 0, 3.35),
  ],
};

const streetLights = [
  [-2.8, 78], [2.8, 65], [-2.8, 51], [2.8, 38],
  [-10, 22], [-23, 6], [-39, -15], [-55, -34],
  [14, 17], [29, 7], [45, -6], [58, -16],
  [-22, 45], [-30, 56], [20, 42], [40, 50],
].map(([x, z], index) => circle(`street-light-${index}`, x, z, 0.22));

const harborPosts = [
  ...[-2.8, 2.8].flatMap((x) => [-3.6, 1.2, 6, 10.8, 15.6, 20.4, 24.2].map((z) => [x, z])),
  ...[-12.8, -4.2, 4.2, 12.8].map((x) => [x, -2.15]),
].map(([x, localZ], index) => circle(`harbor-post-${index}`, x, 92 + localZ, 0.21));

const dockLamps = [
  ...[-7.8, -2.5, 2.5, 7.8].map((x) => [x, -3.4]),
  ...[-2.85, 2.85].map((x) => [x, 17.8]),
].map(([x, localZ], index) => circle(`dock-lamp-${index}`, x, 92 + localZ, 0.26));

const harborProps = [
  box("harbor-left-edge", -15.2, 101.5, 0.42, 12.6),
  box("harbor-right-edge", 15.2, 101.5, 0.42, 12.6),
  box("harbor-left-boat-01", -9.7, 100.2, 1.08, 2.85, -0.08),
  box("harbor-right-boat", 9.8, 107.6, 1.08, 2.85, 0.08),
  box("harbor-left-boat-02", -9.3, 114, 1.08, 2.85, 0.05),
  circle("crate-stack-left", -9.2, 85.3, 0.78),
  circle("crate-stack-right", 8.4, 84.5, 0.78),
  circle("crate-stack-pier", 4.6, 94.5, 0.68),
];

const cliffRocks = [
  ...[-82, -56, -28, 36, 74].map((x, index) => circle(
    `north-cliff-rock-${index}`,
    x,
    -93 + seeded(index) * 16,
    2.8 + seeded(index + 2) * 1.4
  )),
  ...[-84, -62, 70, 88].map((z, index) => circle(
    `west-cliff-rock-${index}`,
    -100 + seeded(index + 20) * 12,
    z,
    3.0
  )),
];

const rockField = Array.from({ length: 55 }, (_, index) => {
  const angle = seeded(index + 600) * Math.PI * 2;
  const radius = 48 + seeded(index + 700) * 62;
  const x = Math.cos(angle) * radius;
  const z = 8 + Math.sin(angle) * radius;
  const sx = 0.7 + seeded(index) * 2.4;
  const sz = 0.7 + seeded(index + 2) * 2.2;
  return circle(`field-rock-${index}`, x, z, Math.max(sx, sz) * 0.48);
});

const treeTrunks = Array.from({ length: 70 }, (_, index) => {
  const cluster = index % 3;
  const base = cluster === 0 ? [-10, -72] : cluster === 1 ? [62, 18] : [-62, -36];
  const spread = cluster === 0 ? [48, 30] : cluster === 1 ? [34, 56] : [30, 35];
  const x = base[0] + (seeded(index) - 0.5) * spread[0];
  const z = base[1] + (seeded(index + 100) - 0.5) * spread[1];
  const scale = 0.72 + seeded(index + 200) * 0.92;
  return circle(`forest-tree-${index}`, x, z, 0.22 + scale * 0.12, 0.85);
});

const palms = [
  circle("harbor-palm-left", -16, 82, 0.38),
  circle("harbor-palm-mid", 13, 88, 0.4),
  circle("harbor-palm-right", 28, 77, 0.36),
];

const secretLocations = [
  circle("hidden-shader-shrine", 18, -82, 1.15),
  circle("abandoned-build-cache", -78, -58, 1.15),
  circle("quiet-render-lookout", 84, 22, 1.15),
];

export const globalColliders = [
  ...Object.entries(localIslandColliders).flatMap(([id, colliders]) => {
    const root = ISLAND_ROOTS[id];
    return colliders.map((collider) => (
      collider.type === "box"
        ? box(`${id}-${collider.id}`, root.x + collider.x, root.y + collider.z, collider.hx, collider.hz, collider.rotation ?? 0)
        : circle(`${id}-${collider.id}`, root.x + collider.x, root.y + collider.z, collider.r)
    ));
  }),
  ...streetLights,
  ...harborPosts,
  ...dockLamps,
  ...harborProps,
  ...cliffRocks,
  ...rockField,
  ...treeTrunks,
  ...palms,
  ...secretLocations,
];

function resolveCircle(position, collider, radius) {
  const min = collider.r + radius;
  const dx = position.x - collider.x;
  const dz = position.z - collider.z;
  if (Math.abs(dx) > min || Math.abs(dz) > min) return null;
  const dist = Math.hypot(dx, dz);
  if (dist >= min) return null;
  if (dist < 0.0001) return { x: min, z: 0, strength: collider.response ?? 1 };
  const push = (min - dist) * (collider.response ?? 1);
  return { x: (dx / dist) * push, z: (dz / dist) * push, strength: collider.response ?? 1 };
}

function resolveBox(position, collider, radius) {
  const sin = Math.sin(-(collider.rotation ?? 0));
  const cos = Math.cos(-(collider.rotation ?? 0));
  const dx = position.x - collider.x;
  const dz = position.z - collider.z;
  const lx = dx * cos - dz * sin;
  const lz = dx * sin + dz * cos;
  const hx = collider.hx + radius;
  const hz = collider.hz + radius;
  if (Math.abs(lx) > hx || Math.abs(lz) > hz) return null;

  const overlapX = hx - Math.abs(lx);
  const overlapZ = hz - Math.abs(lz);
  let px = 0;
  let pz = 0;
  if (overlapX < overlapZ) {
    px = (lx >= 0 ? 1 : -1) * overlapX;
  } else {
    pz = (lz >= 0 ? 1 : -1) * overlapZ;
  }

  const rotSin = Math.sin(collider.rotation ?? 0);
  const rotCos = Math.cos(collider.rotation ?? 0);
  return {
    x: (px * rotCos - pz * rotSin) * (collider.response ?? 1),
    z: (px * rotSin + pz * rotCos) * (collider.response ?? 1),
    strength: collider.response ?? 1
  };
}

function resolveBoundary(position, radius) {
  const dx = position.x - WORLD_CENTER.x;
  const dz = position.z - WORLD_CENTER.y;
  const dist = Math.hypot(dx, dz);
  const max = WORLD_BOUNDARY_RADIUS - radius;
  if (dist <= max) return null;
  if (dist < 0.0001) return { x: 0, z: -max };
  const targetX = WORLD_CENTER.x + (dx / dist) * max;
  const targetZ = WORLD_CENTER.y + (dz / dist) * max;
  return { x: targetX - position.x, z: targetZ - position.z };
}

export function resolveWorldCollisions(position, _island = null, radius = PLAYER_RADIUS) {
  const result = { hit: false, correctionX: 0, correctionZ: 0, hits: 0 };
  for (const collider of globalColliders) {
    const correction = collider.type === "box"
      ? resolveBox(position, collider, radius)
      : resolveCircle(position, collider, radius);
    if (!correction) continue;
    position.x += correction.x;
    position.z += correction.z;
    result.hit = true;
    result.hits += 1;
    result.correctionX += correction.x;
    result.correctionZ += correction.z;
  }

  const boundary = resolveBoundary(position, radius);
  if (boundary) {
    position.x += boundary.x;
    position.z += boundary.z;
    result.hit = true;
    result.hits += 1;
    result.correctionX += boundary.x;
    result.correctionZ += boundary.z;
  }

  return result;
}

function bikePointToWorld(bikeState, localX, localZ) {
  const sin = Math.sin(bikeState.rotation);
  const cos = Math.cos(bikeState.rotation);
  return new THREE.Vector3(
    bikeState.position.x + localX * cos + localZ * sin,
    bikeState.position.y,
    bikeState.position.z - localX * sin + localZ * cos
  );
}

export function resolveBicycleCollisions(bikeState) {
  const probes = [
    { localX: 0, localZ: -0.62, radius: 0.24, weight: 0.42 },
    { localX: 0, localZ: 0.62, radius: 0.24, weight: 0.42 },
    { localX: 0, localZ: -0.04, radius: 0.22, weight: 0.16 },
  ];
  const result = { hit: false, correctionX: 0, correctionZ: 0, hits: 0 };

  for (const probe of probes) {
    const world = bikePointToWorld(bikeState, probe.localX, probe.localZ);
    const collision = resolveWorldCollisions(world, null, probe.radius);
    if (!collision.hit) continue;
    const x = collision.correctionX * probe.weight;
    const z = collision.correctionZ * probe.weight;
    bikeState.position.x += x;
    bikeState.position.z += z;
    result.hit = true;
    result.hits += collision.hits;
    result.correctionX += x;
    result.correctionZ += z;
  }

  return result;
}

export function resolveParkedBicycleCollision(position, bikeState, radius = PLAYER_RADIUS) {
  const probes = [
    { localX: 0, localZ: -0.62, radius: 0.18 },
    { localX: 0, localZ: 0.62, radius: 0.18 },
    { localX: 0, localZ: -0.04, radius: 0.16 },
  ];
  const result = { hit: false, correctionX: 0, correctionZ: 0, hits: 0 };

  for (const probe of probes) {
    const point = bikePointToWorld(bikeState, probe.localX, probe.localZ);
    const correction = resolveCircle(position, circle("parked-bike", point.x, point.z, probe.radius), radius);
    if (!correction) continue;
    position.x += correction.x;
    position.z += correction.z;
    result.hit = true;
    result.hits += 1;
    result.correctionX += correction.x;
    result.correctionZ += correction.z;
  }

  return result;
}

export function resolveShipCollisions(shipState) {
  const dx = shipState.position.x - MAIN_ISLAND_CENTER.x;
  const dz = shipState.position.z - MAIN_ISLAND_CENTER.y;
  const dist = Math.hypot(dx, dz);
  const min = MAIN_ISLAND_SHIP_RADIUS + SHIP_RADIUS;
  if (dist > 0.0001 && dist < min) {
    const push = min - dist;
    shipState.position.x += (dx / dist) * push;
    shipState.position.z += (dz / dist) * push;
    shipState.speed *= 0.25;
  }
}
