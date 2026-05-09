import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorModal from "@replit/vite-plugin-runtime-error-modal";
import { cartographer } from "@replit/vite-plugin-cartographer";
import type { Plugin } from "vite";

const port = process.env.PORT ? Number(process.env.PORT) : 3000;
const basePath = process.env.BASE_PATH || "/";

interface PlayerState {
  playerId: string;
  playerName: string;
  lastSeen: number;
  currentRoom: string;
  prestige: number;
  energy: number;
  stress: number;
  level: string;
  completedMissions: number;
  lastActivity: string;
  shiftTime: number;
}

function roomApiPlugin(): Plugin {
  const rooms = new Map<string, Map<string, PlayerState>>();

  setInterval(() => {
    const now = Date.now();
    for (const [roomCode, players] of rooms) {
      for (const [playerId, player] of players) {
        if (now - player.lastSeen > 90000) players.delete(playerId);
      }
      if (players.size === 0) rooms.delete(roomCode);
    }
  }, 30000);

  return {
    name: "room-api",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith("/api/rooms")) return next();

        res.setHeader("Content-Type", "application/json");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");

        if (req.method === "OPTIONS") {
          res.statusCode = 204;
          return res.end();
        }

        const urlPath = (req.url ?? "").replace(/\?.*$/, "");
        const segments = urlPath
          .replace("/api/rooms/", "")
          .split("/")
          .filter(Boolean);
        const roomCode = segments[0];
        const action = segments[1];

        if (!roomCode || !action) return next();

        if (req.method === "GET" && action === "players") {
          const room = rooms.get(roomCode);
          if (!room) return res.end(JSON.stringify({ players: [] }));
          const now = Date.now();
          const players = [...room.values()].map((p) => ({
            ...p,
            online: now - p.lastSeen < 20000,
          }));
          return res.end(JSON.stringify({ players }));
        }

        let body = "";
        req.on("data", (chunk: Buffer) => {
          body += chunk.toString();
        });
        req.on("end", () => {
          let data: Record<string, unknown> = {};
          try {
            data = JSON.parse(body);
          } catch {
            /* ignore */
          }

          if (!rooms.has(roomCode)) rooms.set(roomCode, new Map());
          const room = rooms.get(roomCode)!;

          if (req.method === "POST" && action === "join") {
            const playerName = (data.playerName as string) || "Estudante";
            const playerId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
            room.set(playerId, {
              playerId,
              playerName,
              lastSeen: Date.now(),
              currentRoom: "Corredor",
              prestige: 0,
              energy: 100,
              stress: 0,
              level: "Estagiária",
              completedMissions: 0,
              lastActivity: "Iniciou o jogo",
              shiftTime: 0,
            });
            return res.end(JSON.stringify({ playerId }));
          }

          if (req.method === "POST" && action === "heartbeat") {
            const playerId = data.playerId as string;
            if (!playerId || !room.has(playerId)) {
              res.statusCode = 404;
              return res.end(JSON.stringify({ error: "Player not found" }));
            }
            const player = room.get(playerId)!;
            room.set(playerId, {
              ...player,
              ...(data as Partial<PlayerState>),
              lastSeen: Date.now(),
            });
            return res.end(JSON.stringify({ ok: true }));
          }

          next();
        });
      });
    },
  };
}

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    roomApiPlugin(),
    ...(process.env.NODE_ENV !== "production"
      ? [runtimeErrorModal(), cartographer()]
      : []),
  ],
  optimizeDeps: {
    include: ["phaser"],
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(
        import.meta.dirname,
        "..",
        "..",
        "attached_assets",
      ),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    // Phaser alone is ~1 MB; raise the warning threshold to avoid noise.
    chunkSizeWarningLimit: 2000,
  },
  server: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
    hmr: process.env.DISABLE_HMR !== "true",
    fs: {
      strict: false,
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
