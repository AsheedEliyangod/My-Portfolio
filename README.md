# Cinematic 3D Portfolio

A playable ocean portfolio prototype built with React, Vite, Three.js, React Three Fiber, Drei, TailwindCSS, and Framer Motion.

## What is included

- Large procedural ocean with moving waves, fog, sky, and cinematic lighting
- Sailboat spawn with WASD movement, third-person camera, floating motion, and wake particles
- Dock interaction that switches from ship mode to walking mode
- Camera-relative walking controller for island exploration
- Tropical island with dock, house, trees, rocks, lanterns, grass, and hologram panels
- Portfolio interactions for About, Skills, Projects, Resume, and Contact
- Mobile joystick and touch-look control surfaces
- Responsive HUD and modal overlays

## Run

Install dependencies, then start Vite:

```bash
pnpm install
pnpm dev
```

Build and preview production output:

```bash
pnpm build
pnpm preview
```

This workspace also includes `scripts/serve-dist.mjs`, a tiny static server for environments where you want to serve the built `dist` folder directly.

## Customize

Edit portfolio content in `src/data/portfolio.js`. Replace `public/resume.txt` with your real resume, or update the resume URL in the data file.
