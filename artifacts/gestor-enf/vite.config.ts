import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorModal from "@replit/vite-plugin-runtime-error-modal";
import { cartographer } from "@replit/vite-plugin-cartographer";
import type { Plugin } from "vite";
import { WebSocketServer, WebSocket as WsSocket } from "ws";
import type { IncomingMessage } from "http";

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
  screenshot?: string;
}

function roomApiPlugin(): Plugin {
  const rooms = new Map<string, Map<string, PlayerState>>();

  // .unref() prevents this interval from keeping the Node.js process alive during
  // `vite build` — without it, the build never exits and Netlify times out.
  setInterval(() => {
    const now = Date.now();
    for (const [roomCode, players] of rooms) {
      for (const [playerId, player] of players) {
        if (now - player.lastSeen > 90000) players.delete(playerId);
      }
      if (players.size === 0) rooms.delete(roomCode);
    }
  }, 30000).unref();

  return {
    name: "room-api",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith("/__rooms")) return next();

        res.setHeader("Content-Type", "application/json");
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");

        if (req.method === "OPTIONS") {
          res.statusCode = 204;
          return res.end();
        }

        const urlPath = (req.url ?? "").replace(/\?.*$/, "");
        const segments = urlPath
          .replace("/__rooms/", "")
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
            online: now - p.lastSeen < 7000,
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
            const { screenshot, ...rest } = data as Partial<PlayerState> & { screenshot?: string };
            const update: PlayerState = { ...player, ...rest, lastSeen: Date.now() };
            // Store screenshot for HTTP live-view fallback (size-capped)
            if (typeof screenshot === "string" && screenshot.length < 80000) {
              update.screenshot = screenshot;
            }
            room.set(playerId, update);
            return res.end(JSON.stringify({ ok: true }));
          }

          next();
        });
      });
    },
  };
}

interface WsStudentEntry {
  ws: WsSocket;
  playerName: string;
  latestJpeg?: Buffer;
  latestStats?: Record<string, unknown>;
}

// Binary frame protocol (both directions):
//   [4 bytes uint32 LE: headerLen][JSON header bytes][JPEG bytes]
function buildBinaryFrame(header: Record<string, unknown>, jpeg: Buffer): Buffer {
  const headerBytes = Buffer.from(JSON.stringify(header), "utf8");
  const out = Buffer.allocUnsafe(4 + headerBytes.length + jpeg.length);
  out.writeUInt32LE(headerBytes.length, 0);
  headerBytes.copy(out, 4);
  jpeg.copy(out, 4 + headerBytes.length);
  return out;
}

function parseBinaryFrame(raw: Buffer): { header: Record<string, unknown>; jpeg: Buffer } | null {
  try {
    if (raw.length < 4) return null;
    const headerLen = raw.readUInt32LE(0);
    if (4 + headerLen > raw.length) return null;
    const header = JSON.parse(raw.subarray(4, 4 + headerLen).toString("utf8")) as Record<string, unknown>;
    const jpeg = raw.subarray(4 + headerLen);
    return { header, jpeg };
  } catch { return null; }
}

function screenSharePlugin(): Plugin {
  return {
    name: "screen-share",
    configureServer(server) {
      const wss = new WebSocketServer({ noServer: true });
      const students = new Map<string, WsStudentEntry>();
      const professors = new Set<WsSocket>();

      wss.on("connection", (ws: WsSocket, req: IncomingMessage) => {
        const rawQuery = req.url?.includes("?")
          ? req.url.split("?")[1]
          : "";
        const q = new URLSearchParams(rawQuery);
        const role = q.get("role");
        const playerId = q.get("id") ?? "";
        const playerName = decodeURIComponent(q.get("name") ?? "Estudante");

        if (role === "professor") {
          professors.add(ws);

          // Send each student's latest frame to the new professor
          for (const [pid, student] of students) {
            if (student.latestJpeg && ws.readyState === WsSocket.OPEN) {
              try {
                const outBuf = buildBinaryFrame(
                  { type: "frame", playerId: pid, playerName: student.playerName, ...(student.latestStats ?? {}) },
                  student.latestJpeg
                );
                ws.send(outBuf);
              } catch { /* ignore */ }
            }
          }

          ws.on("close", () => professors.delete(ws));
          ws.on("error", () => professors.delete(ws));

        } else if (role === "student" && playerId) {
          students.set(playerId, { ws, playerName });

          ws.on("message", (raw: Buffer, isBinary: boolean) => {
            const entry = students.get(playerId);
            if (!entry) return;

            if (isBinary) {
              const parsed = parseBinaryFrame(raw);
              if (!parsed) return;
              const { header, jpeg } = parsed;
              if (header.type !== "frame") return;

              entry.latestJpeg = jpeg;
              if (header.stats) entry.latestStats = header.stats as Record<string, unknown>;

              const outBuf = buildBinaryFrame(
                { type: "frame", playerId, playerName: entry.playerName, ...(entry.latestStats ?? {}) },
                jpeg
              );

              for (const prof of professors) {
                if (prof.readyState === WsSocket.OPEN) {
                  try { prof.send(outBuf); } catch { /* ignore */ }
                }
              }
            }
          });

          const onLeave = () => {
            students.delete(playerId);
            const leaveStr = JSON.stringify({ type: "leave", playerId });
            for (const prof of professors) {
              if (prof.readyState === WsSocket.OPEN) {
                try { prof.send(leaveStr); } catch { /* ignore */ }
              }
            }
          };
          ws.on("close", onLeave);
          ws.on("error", onLeave);
        }
      });

      server.httpServer!.on(
        "upgrade",
        (request: IncomingMessage, socket: unknown, head: Buffer) => {
          if (request.url?.startsWith("/__screen-ws")) {
            wss.handleUpgrade(
              request,
              socket as import("stream").Duplex,
              head,
              (ws) => {
                wss.emit("connection", ws, request);
              }
            );
          }
        }
      );
    },
  };
}

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    roomApiPlugin(),
    screenSharePlugin(),
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
