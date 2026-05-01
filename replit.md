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

### v3.1 — Bug-Fix Pass (2026-04-26)
- **Tailwind**: added missing `@import "tailwindcss"` in `src/index.css` (without it the menu buttons rendered invisible).
- **Cover photo**: `BootScene` now preloads `public/assets/huap.png` (copied from `attached_assets/image_1777241237948.png`); `MenuScene` was rewritten to display this real HUAP/UFF facade with cover-fit + Ken-Burns pan, top/bottom dim gradients, hospital ID badge, and decorative pulse cross.
- **Menu UI**: removed `pt-16` and `justify-center` from `AppUI`; the menu buttons are now anchored to the right-center (`right-[8%] top-1/2 -translate-y-1/2`), and the help panel is centered absolutely.
- **QTE**: `HUDScene` crisis timer extended from 40s → 90s for readability.
- **Walking & stuck NPCs**: `Player` and `NPC` physics bodies were tightened to feet-only (`16×14` at offset `14,46`) so characters no longer snag on door jambs/props. NPC `update()` now uses a 12px waypoint tolerance (was 4) and a 1500ms stuck-recovery that auto-skips a waypoint when the NPC barely moves.
- **Dialog feedback**: replaced the generic fallbacks in `DialogScene` with role-aware feedback pools (doctor, nurse, technician, admin, receptionist, other) for `start` / `complete` / `idle` outcomes.

### v3.2 — Full Dialogue Pools + Room Equipment Overhaul (2026-05-01)
**Dialogue Pools (all 12 NPCs):**
- All 12 NPCs now have 3 `dialoguePools` each (9 total MCQ questions per NPC), all grounded in Kurcgant (2016) chapters, with `correct`, `feedback`, `tooltip`, and `effect` fields.
- New NPCs completed: `dr_oliveira` (ICSAC/SBAR/ética), `dra_santos` (dupla-checagem quimioterapia/dor paliativa/autonomia), `enf_pedro` (RDC171/Lei11108/aleitamento materno).
- `NPC.ts` getDialogue() rotates pools by `conversationCount % pools.length`; choices are Fisher-Yates shuffled each conversation.

**Room Equipment (GameScene.ts):**
- `populateRoom()` completely rewritten: each room now has hand-placed, semantically correct equipment instead of a grid loop.
- 18 new drawing methods added: `drawVentilator`, `drawIVPole`, `drawMaternityBed`, `drawBassinet`, `drawBreastPumpStation`, `drawCrashCart`, `drawShelvingUnit`, `drawRefrigerator`, `drawLabBench`, `drawCentrifuge`, `drawBioanalyzer`, `drawAutoclave`, `drawExecutiveDesk`, `drawReceptionCounter`, `drawKitchenCounter`, `drawXRayViewer`, `drawParallelBars`, `drawExerciseMat`.
- ICU: ventilators + IV poles beside each bed, central nursing desk. MATERNITY: pink beds + bassinets + breast pump station. EMERGENCY: crash carts + defibrillators + triage desk. PHARMACY: dispensing counters + tall shelving + medicine fridge. LAB: microscope bench + centrifuge + bioanalyzer. CME: dual autoclaves + sterilization counters. RADIOLOGY: CT scanner + X-ray viewer lightbox. REHAB: parallel bars + exercise mats. ADMIN: executive desk + filing cabinets + waiting chairs. RECEPTION: reception counter with bells + waiting chair rows.

**TypeScript:**
- Fixed `TS7030` in `AchievementToast.tsx` (missing `return undefined`).
- Fixed `TS2554` in `PointExplosion.tsx` (`useRef` now initialized with `undefined` argument).
- Full `tsc --noEmit` passes with zero errors.
