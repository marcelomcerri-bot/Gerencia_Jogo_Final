# Gestor ENF - Nursing Management Educational RPG

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
- `artifacts/gestor-enf/src/data/cases.ts` - Game scenario content
- `artifacts/gestor-enf/vite.config.ts` - Vite configuration
- `artifacts/api-server/src/app.ts` - Express app setup
- `lib/db/src/index.ts` - Database connection
