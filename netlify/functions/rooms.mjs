/**
 * Netlify Function v2 — Room API for Modo Professor
 *
 * Uses Netlify Blobs for persistent state across function instances.
 * Each player is stored under key "${roomCode}::${playerId}".
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
      status: 404,
      headers: CORS,
    });
  }

  const store = getStore("rooms");
  const now = Date.now();
  const prefix = `${roomCode}::`;

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
      return new Response(JSON.stringify({ players: [], _error: String(e) }), {
        headers: CORS,
      });
    }
  }

  // ── POST endpoints — parse body ───────────────────────────────────────────
  let data = {};
  try {
    data = await req.json();
  } catch { /* ignore */ }

  // ── POST /__rooms/:roomCode/join ──────────────────────────────────────────
  if (req.method === "POST" && action === "join") {
    const playerName = (data.playerName || "Estudante").slice(0, 32);
    const playerId = `${now}-${Math.random().toString(36).slice(2, 8)}`;
    const player = {
      playerId,
      playerName,
      lastSeen: now,
      currentRoom: "Corredor",
      prestige: 0,
      energy: 100,
      stress: 0,
      level: "Estagiária",
      completedMissions: 0,
      lastActivity: "Iniciou o jogo",
      shiftTime: 0,
    };
    await store.set(`${prefix}${playerId}`, JSON.stringify(player));
    return new Response(JSON.stringify({ playerId }), { headers: CORS });
  }

  // ── POST /__rooms/:roomCode/heartbeat ─────────────────────────────────────
  if (req.method === "POST" && action === "heartbeat") {
    const { playerId, screenshot, ...rest } = data;
    if (!playerId) {
      return new Response(JSON.stringify({ error: "Missing playerId" }), {
        status: 400,
        headers: CORS,
      });
    }
    const key = `${prefix}${playerId}`;
    const existing = await store.get(key, { type: "json" }).catch(() => null);
    if (!existing) {
      return new Response(JSON.stringify({ error: "Player not found" }), {
        status: 404,
        headers: CORS,
      });
    }
    const update = { ...existing, ...rest, lastSeen: now };
    if (typeof screenshot === "string" && screenshot.length < 80_000) {
      update.screenshot = screenshot;
    }
    await store.set(key, JSON.stringify(update));
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
