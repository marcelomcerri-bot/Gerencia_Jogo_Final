/**
 * Netlify Function v2 — Room API for Modo Professor
 *
 * Uses Netlify Blobs for persistent state across function instances.
 * Each player is stored under key "{roomCode}/{playerId}".
 * Heartbeat is an upsert — creates the player if not found, so there is
 * never a 404 loop due to cold-start or key-not-found edge cases.
 *
 * Handles: GET  /__rooms/:roomCode/players
 *          POST /__rooms/:roomCode/join
 *          POST /__rooms/:roomCode/heartbeat
 */

import { getStore } from "@netlify/blobs";

const STALE_MS = 90_000;

const CORS = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store, no-cache, must-revalidate",
  "Pragma": "no-cache",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default async function handler(req, context) {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  let roomCode = context.params?.roomCode;
  let action   = context.params?.action;

  if (!roomCode || !action) {
    try {
      const pathname = new URL(req.url).pathname;
      const m = pathname.match(/\/__rooms\/([^/]+)\/([^/]+)/);
      if (m) { roomCode = m[1]; action = m[2]; }
    } catch { /* ignore */ }
  }

  if (!roomCode || !action) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404, headers: CORS,
    });
  }

  let store;
  try {
    store = getStore("rooms");
  } catch (e) {
    return new Response(JSON.stringify({ error: "Store unavailable", detail: String(e) }), {
      status: 503, headers: CORS,
    });
  }

  const now = Date.now();
  // Use "/" as separator — safe for Netlify Blobs path-style keys
  const prefix = `${roomCode}/`;

  // ── GET /__rooms/:roomCode/players ────────────────────────────────────────
  if (req.method === "GET" && action === "players") {
    try {
      const { blobs } = await store.list({ prefix });
      const all = await Promise.all(
        blobs.map((b) => store.get(b.key, { type: "json" }).catch(() => null))
      );
      const players = all
        .filter((p) => p !== null && now - p.lastSeen < STALE_MS)
        .map((p) => ({ ...p, online: now - p.lastSeen < 7000 }));
      return new Response(JSON.stringify({ players }), { headers: CORS });
    } catch (e) {
      return new Response(JSON.stringify({ players: [], _error: String(e) }), { headers: CORS });
    }
  }

  // ── POST endpoints — parse body ───────────────────────────────────────────
  let data = {};
  try { data = await req.json(); } catch { /* ignore */ }

  // ── POST /__rooms/:roomCode/join ──────────────────────────────────────────
  if (req.method === "POST" && action === "join") {
    const playerName = (data.playerName || "Estudante").slice(0, 32);
    const playerId = `${now}-${Math.random().toString(36).slice(2, 8)}`;
    const player = {
      playerId, playerName, lastSeen: now,
      currentRoom: "Corredor", prestige: 0, energy: 100, stress: 0,
      level: "Estagiária", completedMissions: 0, lastActivity: "Iniciou o jogo", shiftTime: 0,
    };
    try {
      await store.set(`${prefix}${playerId}`, JSON.stringify(player));
    } catch (e) {
      return new Response(JSON.stringify({ error: "Store write failed", detail: String(e) }), {
        status: 503, headers: CORS,
      });
    }
    return new Response(JSON.stringify({ playerId }), { headers: CORS });
  }

  // ── POST /__rooms/:roomCode/heartbeat ─────────────────────────────────────
  // Heartbeat is an upsert: if the player blob is missing (cold start, etc.)
  // we create it from the heartbeat data rather than returning 404.
  if (req.method === "POST" && action === "heartbeat") {
    const { playerId, screenshot, ...rest } = data;
    if (!playerId) {
      return new Response(JSON.stringify({ error: "Missing playerId" }), {
        status: 400, headers: CORS,
      });
    }
    const key = `${prefix}${playerId}`;

    let existing = null;
    try { existing = await store.get(key, { type: "json" }); } catch { /* treat as missing */ }

    // Upsert: create a fresh entry if blob wasn't found
    const base = existing || {
      playerId,
      playerName: rest.playerName || "Estudante",
      lastSeen: now,
      currentRoom: "Corredor",
      prestige: 0, energy: 100, stress: 0,
      level: "Estagiária", completedMissions: 0,
      lastActivity: "Jogando", shiftTime: 0,
    };

    const update = { ...base, ...rest, lastSeen: now };
    if (typeof screenshot === "string" && screenshot.length < 80_000) {
      update.screenshot = screenshot;
    }

    try {
      await store.set(key, JSON.stringify(update));
    } catch (e) {
      return new Response(JSON.stringify({ error: "Store write failed", detail: String(e) }), {
        status: 503, headers: CORS,
      });
    }

    return new Response(JSON.stringify({ ok: true }), { headers: CORS });
  }

  return new Response(JSON.stringify({ error: "Not found" }), {
    status: 404, headers: CORS,
  });
}

export const config = {
  path: "/__rooms/:roomCode/:action",
};
