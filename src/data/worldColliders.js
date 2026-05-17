import * as THREE from "three";

export const PLAYER_RADIUS = 0.16;
export const SHIP_RADIUS   = 3.4;   // ship hull collision vs dock/island

// ---------------------------------------------------------------------------
// Per-island colliders in LOCAL space (island group origin = 0,0,0).
// Covers: buildings, dock, barrels, totems, boulders, coconut trees.
// ---------------------------------------------------------------------------
export const localIslandColliders = {
  // ── About Island ───────────────────────────────────────────────────────────
  about: [
    // ── Island terrain (large circle stops ship from sailing through) ──────────
    { id: "island-terrain",  pos: new THREE.Vector2(  0,    0),   r: 12.9, shipOnly: true },
    // Harbor house
    { id: "harbor-house",   pos: new THREE.Vector2(  0,   -1.5), r: 3.15 },
    // Dock center-line — wide soft wall so player can't walk off end
    { id: "dock-center",    pos: new THREE.Vector2(  0,   12.8), r: 1.6 },
    // Dock side posts
    { id: "dock-post-l",    pos: new THREE.Vector2( -1.2,  9.8), r: 0.28 },
    { id: "dock-post-r",    pos: new THREE.Vector2(  1.2,  9.8), r: 0.28 },
    // Barrels cluster
    { id: "barrel-a",       pos: new THREE.Vector2( -2.8,  7.5), r: 0.42 },
    { id: "barrel-b",       pos: new THREE.Vector2( -2.2,  7.6), r: 0.42 },
    { id: "barrel-c",       pos: new THREE.Vector2(  2.5,  7.4), r: 0.42 },
    // Totems
    { id: "totem-l",        pos: new THREE.Vector2( -4.2,  1.2), r: 0.32 },
    { id: "totem-r",        pos: new THREE.Vector2(  4.0,  0.8), r: 0.32 },
    // Coconut trees
    { id: "tree-a",         pos: new THREE.Vector2(  5.6, -4.7), r: 0.78 },
    { id: "tree-b",         pos: new THREE.Vector2(  7.7,  1.4), r: 0.78 },
    { id: "tree-c",         pos: new THREE.Vector2( -7.8,  5.1), r: 0.78 },
    { id: "tree-d",         pos: new THREE.Vector2( -1.8, -8.1), r: 0.78 },
    // Rocks
    { id: "rock-a",         pos: new THREE.Vector2(  8,    5),   r: 0.7  },
    { id: "rock-b",         pos: new THREE.Vector2( -9,   -2),   r: 0.7  },
    { id: "rock-c",         pos: new THREE.Vector2(  3,   -8),   r: 0.7  },
    { id: "rock-d",         pos: new THREE.Vector2( -5,    7),   r: 0.7  },
  ],

  // ── Skills Island ──────────────────────────────────────────────────────────
  skills: [
    // ── Island terrain ────────────────────────────────────────────────────────
    { id: "island-terrain",  pos: new THREE.Vector2(  0,    0),   r: 12.9, shipOnly: true },
    // Totem tower (merged into one large cylinder)
    { id: "totem-tower",    pos: new THREE.Vector2(  0,   -2.0), r: 0.52 },
    // Dock
    { id: "dock-center",    pos: new THREE.Vector2(  0,   12.8), r: 1.6  },
    { id: "dock-post-l",    pos: new THREE.Vector2( -1.2,  9.8), r: 0.28 },
    { id: "dock-post-r",    pos: new THREE.Vector2(  1.2,  9.8), r: 0.28 },
    // Barrel pair
    { id: "barrel-a",       pos: new THREE.Vector2(  3.0, -1.0), r: 0.42 },
    { id: "barrel-b",       pos: new THREE.Vector2(  3.5, -1.2), r: 0.42 },
    // Coconut trees
    { id: "tree-a",         pos: new THREE.Vector2(  4.5,  2.5), r: 0.78 },
    { id: "tree-b",         pos: new THREE.Vector2( -4.5,  2.0), r: 0.78 },
    { id: "tree-c",         pos: new THREE.Vector2(  2.0, -5.5), r: 0.78 },
    // Boulders / rocks
    { id: "boulder",        pos: new THREE.Vector2( -3.0, -4.0), r: 0.72 },
    { id: "rock-a",         pos: new THREE.Vector2(  7,   -3),   r: 0.7  },
    { id: "rock-b",         pos: new THREE.Vector2( -7,    4),   r: 0.7  },
  ],

  // ── Projects Island ────────────────────────────────────────────────────────
  projects: [
    // ── Island terrain ────────────────────────────────────────────────────────
    { id: "island-terrain",  pos: new THREE.Vector2(  0,    0),   r: 12.9, shipOnly: true },
    // Harbor house
    { id: "harbor-house",   pos: new THREE.Vector2(  0.5, -2.0), r: 3.0  },
    // Dock
    { id: "dock-center",    pos: new THREE.Vector2(  0,   12.8), r: 1.6  },
    { id: "dock-post-l",    pos: new THREE.Vector2( -1.2,  9.8), r: 0.28 },
    { id: "dock-post-r",    pos: new THREE.Vector2(  1.2,  9.8), r: 0.28 },
    // Totem
    { id: "totem",          pos: new THREE.Vector2(  4.5,  1.5), r: 0.32 },
    // Barrel cluster
    { id: "barrel-a",       pos: new THREE.Vector2( -2.5,  1.2), r: 0.42 },
    { id: "barrel-b",       pos: new THREE.Vector2( -2.0,  0.8), r: 0.42 },
    { id: "barrel-c",       pos: new THREE.Vector2( -3.0,  0.6), r: 0.42 },
    // Trees
    { id: "tree-a",         pos: new THREE.Vector2( -5.0,  3.0), r: 0.78 },
    { id: "tree-b",         pos: new THREE.Vector2(  5.0, -4.0), r: 0.78 },
    { id: "tree-c",         pos: new THREE.Vector2( -4.5, -3.5), r: 0.78 },
    // Boulders / rocks
    { id: "boulder-a",      pos: new THREE.Vector2(  5.5,  3.0), r: 0.72 },
    { id: "boulder-b",      pos: new THREE.Vector2( -4.0,  5.0), r: 0.58 },
    { id: "rock-a",         pos: new THREE.Vector2(  6,    5),   r: 0.7  },
    { id: "rock-b",         pos: new THREE.Vector2( -6,   -3),   r: 0.7  },
  ],

  // ── Resume Island ──────────────────────────────────────────────────────────
  resume: [
    // ── Island terrain ────────────────────────────────────────────────────────
    { id: "island-terrain",  pos: new THREE.Vector2(  0,    0),   r: 12.9, shipOnly: true },
    // Stone arch posts (thin pillar radius)
    { id: "arch-l",         pos: new THREE.Vector2( -1.2, -2.0), r: 0.30 },
    { id: "arch-r",         pos: new THREE.Vector2(  1.2, -2.0), r: 0.30 },
    // Scroll slab
    { id: "slab",           pos: new THREE.Vector2(  0.0, -3.2), r: 0.9  },
    // Dock
    { id: "dock-center",    pos: new THREE.Vector2(  0,   12.8), r: 1.6  },
    { id: "dock-post-l",    pos: new THREE.Vector2( -1.2,  9.8), r: 0.28 },
    { id: "dock-post-r",    pos: new THREE.Vector2(  1.2,  9.8), r: 0.28 },
    // Totems
    { id: "totem-l",        pos: new THREE.Vector2( -4.5,  0.5), r: 0.32 },
    { id: "totem-r",        pos: new THREE.Vector2(  4.5,  0.5), r: 0.32 },
    // Trees
    { id: "tree-a",         pos: new THREE.Vector2(  4.5,  3.0), r: 0.78 },
    { id: "tree-b",         pos: new THREE.Vector2( -5.0, -4.0), r: 0.78 },
    { id: "tree-c",         pos: new THREE.Vector2( -3.5,  4.0), r: 0.78 },
    // Boulder / rocks
    { id: "boulder",        pos: new THREE.Vector2(  3.0, -5.5), r: 0.72 },
    { id: "rock-a",         pos: new THREE.Vector2(  6,   -3),   r: 0.7  },
    { id: "rock-b",         pos: new THREE.Vector2( -6,    4),   r: 0.7  },
  ],

  // ── Contact Island ─────────────────────────────────────────────────────────
  contact: [
    // ── Island terrain ────────────────────────────────────────────────────────
    { id: "island-terrain",  pos: new THREE.Vector2(  0,    0),   r: 12.9, shipOnly: true },
    // Fire pit
    { id: "fire-pit",       pos: new THREE.Vector2(  0.0, -2.5), r: 1.05 },
    // Dock
    { id: "dock-center",    pos: new THREE.Vector2(  0,   12.8), r: 1.6  },
    { id: "dock-post-l",    pos: new THREE.Vector2( -1.2,  9.8), r: 0.28 },
    { id: "dock-post-r",    pos: new THREE.Vector2(  1.2,  9.8), r: 0.28 },
    // Totems
    { id: "totem-l",        pos: new THREE.Vector2( -4.0, -1.5), r: 0.32 },
    { id: "totem-r",        pos: new THREE.Vector2(  4.0, -1.5), r: 0.32 },
    // Trees
    { id: "tree-a",         pos: new THREE.Vector2(  3.5, -4.5), r: 0.78 },
    { id: "tree-b",         pos: new THREE.Vector2( -3.5, -3.5), r: 0.78 },
    { id: "tree-c",         pos: new THREE.Vector2(  0.5, -6.0), r: 0.78 },
    // Boulder / rocks
    { id: "boulder",        pos: new THREE.Vector2( -3.0,  4.5), r: 0.72 },
    { id: "rock-a",         pos: new THREE.Vector2(  5,    4),   r: 0.7  },
    { id: "rock-b",         pos: new THREE.Vector2( -5,   -4),   r: 0.7  },
    { id: "rock-c",         pos: new THREE.Vector2(  0,   -6),   r: 0.7  },
  ],
};

// ---------------------------------------------------------------------------
// Resolve player ↔ island colliders
// ---------------------------------------------------------------------------
export function resolveWorldCollisions(position, island) {
  if (!island) return;
  const colliders = localIslandColliders[island.id] ?? [];
  for (const c of colliders) {
    if (c.shipOnly) continue; // island-terrain only blocks ships, not the walking player
    const dx = position.x - (island.worldPos.x + c.pos.x);
    const dz = position.z - (island.worldPos.z + c.pos.y);
    const dist = Math.hypot(dx, dz);
    const min  = c.r + PLAYER_RADIUS;
    if (dist > 0.0001 && dist < min) {
      const push = min - dist;
      position.x += (dx / dist) * push;
      position.z += (dz / dist) * push;
    }
  }
}

// ---------------------------------------------------------------------------
// Resolve ship ↔ island/dock colliders  (called from ShipController)
// – Pushes the ship's position out of overlapping colliders
// – Also zeros the approaching component of the velocity vector so the ship
//   doesn't clip through on the next frame (pass velocity as THREE.Vector2)
// ---------------------------------------------------------------------------
const SHIP_BLOCK_IDS = new Set([
  "island-terrain",
  "harbor-house", "dock-center", "dock-post-l", "dock-post-r",
  "totem-tower", "arch-l", "arch-r", "fire-pit", "slab"
]);

export function resolveShipCollisions(shipState, islands) {
  for (const island of islands) {
    const colliders = localIslandColliders[island.id] ?? [];
    for (const c of colliders) {
      if (!SHIP_BLOCK_IDS.has(c.id)) continue;
      const dx = shipState.position.x - (island.worldPos.x + c.pos.x);
      const dz = shipState.position.z - (island.worldPos.z + c.pos.y);
      const dist = Math.hypot(dx, dz);
      const min  = c.r + SHIP_RADIUS;
      if (dist > 0.0001 && dist < min) {
        const push = min - dist;
        shipState.position.x += (dx / dist) * push;
        shipState.position.z += (dz / dist) * push;
        // Dampen speed on collision
        shipState.speed *= 0.25;
      }
    }
  }
}
