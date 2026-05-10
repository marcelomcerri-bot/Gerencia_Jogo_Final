/**
 * Netlify Function v2 — Room API for Modo Professor
 *
 * Routes (all under /__rooms/*):
 *   GET  /__rooms/:roomCode/players
 *   POST /__rooms/:roomCode/join
 *   POST /__rooms/:roomCode/heartbeat        (stats only, no screenshot)
 *   POST /__rooms/:roomCode/screenshot/:pid  (raw JPEG body → blob)
 *   GET  /__rooms/:roomCode/screenshot/:pid  (serves image/jpeg directly)
 *
 * Player blobs: key = "p/{roomCode}/{playerId}"  (stats JSON, no screenshot)
 * Screenshot blobs: key = "ss/{roomCode}/{playerId}"  (base64 JPEG string)
 *
 * Stale players (> 90 s) are deleted from the blob store during GET /players.
 */

import { getStore } from "@netlify/blobs";

const STALE_MS  = 90_000;
const ONLINE_MS =  7_000;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store, no-cache, must-revalidate",
  "Pragma": "no-cache",
};
const JSON_CORS = { ...CORS, "Content-Type": "application/json" };

/** Read and JSON-parse a blob; returns null on any error */
async function readJson(store, key) {
  try {
    const raw = await store.get(key);
    if (raw == null) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

export default async function handler(req, context) {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

  /* ── path parsing ───────────────────────────────────────────────────────── */
  const pathname = (() => {
    try { return new URL(req.url).pathname; } catch { return req.url; }
  })();

  // /__rooms/:roomCode/:action[/:extra]
  const m = pathname.match(/\/__rooms\/([^/]+)\/([^/]+)(?:\/([^/]+))?/);
  if (!m) return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: JSON_CORS });

  const roomCode = m[1];
  const action   = m[2];
  const extra    = m[3] ?? null; // present for screenshot/:playerId

  let store;
  try { store = getStore("rooms"); }
  catch (e) {
    return new Response(JSON.stringify({ error: "Store unavailable", detail: String(e) }),
      { status: 503, headers: JSON_CORS });
  }

  const now    = Date.now();
  const pPfx   = `p/${roomCode}/`;   // player JSON blobs
  const ssPfx  = `ss/${roomCode}/`;  // screenshot blobs

  /* ═══════════════════════════════════════════════════════════════════════════
     GET /__rooms/:roomCode/players
  ══════════════════════════════════════════════════════════════════════════════ */
  if (req.method === "GET" && action === "players") {
    try {
      const { blobs } = await store.list({ prefix: pPfx });
      const pairs = await Promise.all(
        blobs.map(async (b) => ({ key: b.key, player: await readJson(store, b.key) }))
      );

      // Delete stale blobs (> 90 s) and their screenshots in the background
      const stale = pairs.filter(({ player }) => player && now - player.lastSeen >= STALE_MS);
      if (stale.length) {
        Promise.all([
          ...stale.map(({ key }) => store.delete(key).catch(() => {})),
          ...stale.map(({ player }) =>
            store.delete(`${ssPfx}${player.playerId}`).catch(() => {})),
        ]);
      }

      const players = pairs
        .filter(({ player }) => player && now - player.lastSeen < STALE_MS)
        .map(({ player }) => ({ ...player, online: now - player.lastSeen < ONLINE_MS }));

      return new Response(JSON.stringify({ players }), { headers: JSON_CORS });
    } catch (e) {
      return new Response(JSON.stringify({ players: [], _error: String(e) }), { headers: JSON_CORS });
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     GET /__rooms/:roomCode/screenshot/:playerId  →  image/jpeg
  ══════════════════════════════════════════════════════════════════════════════ */
  if (req.method === "GET" && action === "screenshot" && extra) {
    try {
      const raw = await store.get(`${ssPfx}${extra}`);
      if (!raw) return new Response(null, { status: 404, headers: CORS });

      // raw is stored as a base64 string; decode to binary
      const binary = atob(raw);
      const bytes  = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

      return new Response(bytes, {
        headers: {
          "Content-Type": "image/jpeg",
          "Cache-Control": "no-store, no-cache, must-revalidate",
          "Pragma": "no-cache",
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch (e) {
      return new Response(null, { status: 500 });
    }
  }

  /* ── POST body parsing ──────────────────────────────────────────────────── */

  /* ═══════════════════════════════════════════════════════════════════════════
     POST /__rooms/:roomCode/screenshot/:playerId  ←  raw image/jpeg body
  ══════════════════════════════════════════════════════════════════════════════ */
  if (req.method === "POST" && action === "screenshot" && extra) {
    try {
      const ab     = await req.arrayBuffer();
      if (ab.byteLength < 500 || ab.byteLength > 200_000) {
        return new Response(JSON.stringify({ error: "Invalid size" }), { status: 400, headers: JSON_CORS });
      }
      // Encode to base64 string for safe blob storage (avoids binary encoding issues)
      const bytes  = new Uint8Array(ab);
      let   b64    = "";
      const chunk  = 8192;
      for (let i = 0; i < bytes.length; i += chunk) {
        b64 += String.fromCharCode(...bytes.subarray(i, i + chunk));
      }
      b64 = btoa(b64);
      await store.set(`${ssPfx}${extra}`, b64);
      return new Response(JSON.stringify({ ok: true }), { headers: JSON_CORS });
    } catch (e) {
      return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: JSON_CORS });
    }
  }

  /* JSON body for join / heartbeat */
  let data = {};
  try { data = await req.json(); } catch { /* ignore */ }

  /* ═══════════════════════════════════════════════════════════════════════════
     POST /__rooms/:roomCode/join
  ══════════════════════════════════════════════════════════════════════════════ */
  if (req.method === "POST" && action === "join") {
    const playerName = (data.playerName || "Estudante").slice(0, 32);
    const playerId   = `${now}-${Math.random().toString(36).slice(2, 8)}`;
    const player = {
      playerId, playerName, lastSeen: now,
      currentRoom: "Corredor", prestige: 0, energy: 100, stress: 0,
      level: "Estagiária", completedMissions: 0, lastActivity: "Iniciou o jogo", shiftTime: 0,
    };
    try {
      await store.set(`${pPfx}${playerId}`, JSON.stringify(player));
    } catch (e) {
      return new Response(JSON.stringify({ error: "Store write failed", detail: String(e) }),
        { status: 503, headers: JSON_CORS });
    }
    return new Response(JSON.stringify({ playerId }), { headers: JSON_CORS });
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     POST /__rooms/:roomCode/heartbeat  (stats only — screenshot sent separately)
  ══════════════════════════════════════════════════════════════════════════════ */
  if (req.method === "POST" && action === "heartbeat") {
    const { playerId, screenshot: _ignored, ...rest } = data; // eslint-disable-line no-unused-vars
    if (!playerId) {
      return new Response(JSON.stringify({ error: "Missing playerId" }), { status: 400, headers: JSON_CORS });
    }
    const key      = `${pPfx}${playerId}`;
    const existing = await readJson(store, key);

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
    try {
      await store.set(key, JSON.stringify(update));
    } catch (e) {
      return new Response(JSON.stringify({ error: "Store write failed", detail: String(e) }),
        { status: 503, headers: JSON_CORS });
    }
    return new Response(JSON.stringify({ ok: true }), { headers: JSON_CORS });
  }

  return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: JSON_CORS });
}

export const config = {
  path: "/__rooms/*",
};
