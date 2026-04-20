# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Gestor ENF Game (`artifacts/gestor-enf`)

2D hospital management game built with Phaser 3 + React + TypeScript. Targeting Stardew Valley-quality visuals.

### Architecture
- All graphics are procedurally generated via **Canvas API** — no external image files
- **BootScene.ts** — Generates all sprite textures: chibi-style characters (24×28px, 12 frames: 3×4 directions), NPC portraits (64×64px)
- **gameData.ts** — `createTilesetTexture()` creates all 11 tile types (32×32px each); `NPC_DEFS` and `MISSIONS` data
- **GameScene.ts** — Main game loop, world map (50×36 tiles), room decoration via `buildEnvironmentalDecor()`
- **MenuScene.ts** — Animated sunset menu with gradient background (Canvas API), hospital silhouette, moon, stars, clouds
- **HUDScene.ts** — Parallel scene for HUD (energy bar, minimap, time, prestige)
- **DialogScene.ts** — NPC interaction dialog with typewriter effect, choice buttons, pedagogic notes
- **constants.ts** — TILE_IDs, ROOM_NAMES, GAME_WIDTH/HEIGHT (1280×720), CAMERA_ZOOM (1.6x)

### Critical Constraints
- Texture keys must stay the same: `'player'`, `'tiles'`, `'portrait_X'`, `'pixel'`
- Frame numbers 0-11 must remain (animations break otherwise)
- Use `textures.createCanvas()` for gradient effects — `fillGradientStyle()` only works in WebGL mode
- Add `if (this.textures.exists(key)) this.textures.remove(key)` before creating canvas textures to avoid reload errors

### Visual Improvements Made (v2.0)
- Sunset gradient background on menu (Canvas API radial/linear gradients)
- Hospital silhouette with randomly lit windows, moon, clouds, stars, medical particles
- Chibi character sprites with shading, facial expressions, textured hair, detailed uniforms
- Rich tile textures: grass with flowers, wood grain floors, diamond patterns, wainscoting on walls
- Environmental decor: beds, ICU equipment (with pulsing light), desks, plants per room type
- Vignette overlay via canvas radial gradient
- Polished HUD with rounded containers, animated player dot, energy bar
- Dialog box with pattern portrait background, choice buttons, pedagogic note popup
