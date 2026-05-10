/**
 * Netlify Function v2 — Room API for Modo Professor
 *
 * Handles: GET  /__rooms/:roomCode/players
 *          POST /__rooms/:roomCode/join
 *          POST /__rooms/:roomCode/heartbeat
 *
 * State is kept in module-level memory. While serverless functions can scale
 * across instances, Netlify typically reuses the same warm instance for
 * low-traffic classroom sessions, making this reliable for a single class.
 * Players inactive for >90 s are purged on every request.
 */

const rooms = new Map();

function cleanup() {
  const now = Date.now();
  for (const [code, players] of rooms) {
    for (const [id, p] of players) {
      if (now - p.lastSeen > 90000) players.delete(id);
    }
    if (players.size === 0) rooms.delete(code);
  }
}

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default async function handler(req, context) {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  const { roomCode, action } = context.params ?? {};
  if (!roomCode || !action) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: CORS,
    });
  }

  cleanup();

  if (!rooms.has(roomCode)) rooms.set(roomCode, new Map());
  const room = rooms.get(roomCode);

  // ── GET /__rooms/:roomCode/players ────────────────────────────────────────
  if (req.method === "GET" && action === "players") {
    const now = Date.now();
    const players = [...room.values()].map((p) => ({
      ...p,
      online: now - p.lastSeen < 20000,
    }));
    return new Response(JSON.stringify({ players }), { headers: CORS });
  }

  // ── POST endpoints — parse body ───────────────────────────────────────────
  let data = {};
  try {
    data = await req.json();
  } catch {
    /* ignore parse errors */
  }

  // ── POST /__rooms/:roomCode/join ──────────────────────────────────────────
  if (req.method === "POST" && action === "join") {
    const playerName = (data.playerName || "Estudante").slice(0, 32);
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
    return new Response(JSON.stringify({ playerId }), { headers: CORS });
  }

  // ── POST /__rooms/:roomCode/heartbeat ─────────────────────────────────────
  if (req.method === "POST" && action === "heartbeat") {
    const playerId = data.playerId;
    if (!playerId || !room.has(playerId)) {
      return new Response(JSON.stringify({ error: "Player not found" }), {
        status: 404,
        headers: CORS,
      });
    }
    const player = room.get(playerId);
    room.set(playerId, { ...player, ...data, lastSeen: Date.now() });
    return new Response(JSON.stringify({ ok: true }), { headers: CORS });
  }

  return new Response(JSON.stringify({ error: "Not found" }), {
    status: 404,
    headers: CORS,
  });
}

export const config = {
  path: "/__rooms/:roomCode/:action",
};
