# Gestor ENF - Nursing Management Educational RPG

## Recent Changes (May 2026)
- **Dialogue choices**: Completely redesigned from a scattered diagonal layout to a clean full-width vertical stack above the dialogue box. Includes backdrop, numbered badge with teal accent, keyboard shortcuts `[1]`-`[4]`, and yellow highlight on hover.
- **Character sprites**: Slimmed down significantly — torso reduced from 23px→17px (front) and 20px→14px (side), arms from 7px→5px, groundY lowered from 72→68. All proportions are more pixel-art appropriate. Physics body offsets updated to match (setOffset(15,61)).
- **16 unique NPC hair styles + visual profiles**: CharVisual interface with build/height/gender/age/accessory per character, drawHair() method with 16 named styles.
- **Game start fix**: MenuScene exposes `window.triggerStartGame`, App.tsx calls it as primary path.

## Overview

An interactive 2D RPG educational game focused on nursing management in real healthcare scenarios (HUAP/UFF). Players make managerial decisions across categories like leadership, HR, quality, ethics, and finance.

## Tech Stack

### Frontend (`artifacts/gestor-enf`)
- **React 19** + **Vite 7** - UI framework and build tool
- **Phaser 3** - 2D game engine for the interactive game canvas
- **Tailwind CSS 4** - Styling
- **Radix UI** - UI components
- **Framer Motion** - Animations
- **React Router** (HashRouter) - Client-side routing
- **TanStack React Query** - Data fetching
- **Zod** - Data validation

### Backend (`artifacts/api-server`)
- **Express 5** - API server
- **Drizzle ORM** + **PostgreSQL** - Database layer
- **Pino** - Logging

### Shared Libraries (`lib/`)
- `lib/api-spec` - OpenAPI spec + orval codegen
- `lib/api-zod` - Generated Zod schemas
- `lib/api-client-react` - Generated React Query client
- `lib/db` - Drizzle + PostgreSQL connection

## Project Structure

```
artifacts/
  gestor-enf/        # Frontend Phaser/React game app
    public/assets/   # Game assets: huap.png, nurses_sprite.png, portrait PNGs
  api-server/        # Express backend API
lib/
  api-spec/          # OpenAPI YAML + orval config
  api-zod/           # Generated Zod types
  api-client-react/  # Generated React Query hooks
  db/                # Database connection & schema
scripts/             # Utility scripts
```

## Development

The app runs as a pnpm monorepo. The main workflow starts the Vite dev server:

```
PORT=5000 BASE_PATH=/ pnpm --filter @workspace/gestor-enf run dev
```

App is available at port 5000.

## Database

Uses Replit's built-in PostgreSQL. Connection via `DATABASE_URL` environment variable (automatically set by Replit). Schema managed with Drizzle ORM.

## Key Files

- `artifacts/gestor-enf/src/App.tsx` - Main app entry, mounts Phaser
- `artifacts/gestor-enf/src/ui/AppUI.tsx` - React UI overlay shell
- `artifacts/gestor-enf/src/game/scenes/BootScene.ts` - Sprite/texture creation, character drawing
- `artifacts/gestor-enf/src/game/scenes/GameScene.ts` - Main game scene
- `artifacts/gestor-enf/src/game/scenes/DialogScene.ts` - NPC dialog/portrait system
- `artifacts/gestor-enf/src/game/data/gameData.ts` - Tileset generation, NPC definitions, game data
- `artifacts/gestor-enf/src/game/objects/Player.ts` - Player movement and physics
- `artifacts/gestor-enf/src/game/objects/NPC.ts` - NPC behavior and physics
- `artifacts/gestor-enf/vite.config.ts` - Vite configuration
- `artifacts/api-server/src/app.ts` - Express app setup
- `lib/db/src/index.ts` - Database connection

## Character Sprite System

### Sprite Sheet Format
- Canvas: 44×128 px per frame, 24 frames (6 per direction: down/up/right/left)
- DRAW_W=40, DRAW_H=76 — drawn characters fill most of the 44px canvas
- groundY=72 — feet baseline for procedural drawing
- Physics body offset: Y=65 (groundY−7), X=14

### Primary path: nurses_sprite.png
When `nurses_sprite.png` exists in public/assets/, characters are extracted from it using pixel coordinate mappings (FRAME_COLS × CHAR_ROWS) and scaled into the game format.

### Fallback path: procedural drawing
`BootScene.drawCharacter()` draws pixel-art characters using canvas 2D API.
- 6-frame smooth walk cycle using sinusoidal animation (sin-based stride/bob/arm swing)
- Stardew Valley-style proportions: large round head (rx=11−13, ry=13−14), compact torso

## Portrait System

- NPC portraits are 90×90 px textures with key `portrait_<npcId>`
- Primary: AI-generated PNGs loaded from `public/assets/portrait_<role>.png` are used when available
- Fallback: procedural pixel-art portraits drawn in `BootScene.createPortraits()`
- Used in `DialogScene.ts` when talking to NPCs

## Visual Style (Premium Target)
- Stardew Valley / Project Hospital aesthetic
- Hospital palette: warm white, teal (#1abc9c), soft grays, warm wood
- Tileset: premium floor tiles with specular highlights, grout lines, vertical wash gradients
- Wall tiles: 3D wainscot panels with crown molding and ambient occlusion shadows
- Characters: bigger proportions, sinusoidal 6-frame animation, role-specific uniforms

## Bug Fixes Applied
1. **Physics body offset** corrected: Y=65 (was 47→110) aligns hitbox with visual feet at groundY=72
2. **Player movement during dialogs/crises** fixed: velocity zeroed and movement gated
3. **NPC movement during dialogs** fixed: update loop returns early during active dialog
4. **6-frame animation** fixed: procedural sprites now correctly fill all 24 frames (was 12)
5. **Frame index mapping** fixed: dir×6+step (was dir×3+step), matches Player.ts dirBase offsets
