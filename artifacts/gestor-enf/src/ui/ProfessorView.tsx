import { useState, useEffect, useCallback, useRef, useReducer } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface PlayerData {
  playerId: string;
  playerName: string;
  online: boolean;
  currentRoom: string;
  prestige: number;
  energy: number;
  stress: number;
  level: string;
  completedMissions: number;
  lastActivity: string;
  shiftTime: number;
}

interface LivePlayerData extends PlayerData {
  screenshot?: string;
  wsOnline: boolean;
}

const CARD_COLORS = [
  "#1abc9c",
  "#3498db",
  "#9b59b6",
  "#e67e22",
  "#e74c3c",
  "#27ae60",
  "#f39c12",
  "#2980b9",
];

function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function StatBar({
  value,
  color,
  label,
  display,
}: {
  value: number;
  color: string;
  label: string;
  display: string;
}) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-xs text-gray-500 font-mono">{label}</span>
        <span className="text-xs font-mono" style={{ color }}>
          {display}
        </span>
      </div>
      <div
        className="h-2 rounded-full overflow-hidden"
        style={{ background: "#111c2e" }}
      >
        <motion.div
          className="h-full rounded-full"
          animate={{ width: `${Math.max(0, Math.min(100, value))}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{ background: color }}
        />
      </div>
    </div>
  );
}

function PlayerCard({ player, index }: { player: PlayerData; index: number }) {
  const color = CARD_COLORS[index % CARD_COLORS.length];
  const initials = player.playerName.slice(0, 2).toUpperCase();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.93 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.88 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0d1e30 0%, #091526 100%)",
        border: `1.5px solid ${player.online ? color + "55" : "#1e2d40"}`,
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-mono font-bold text-sm"
          style={{ background: player.online ? color + "22" : "#1e2d40", color: player.online ? color : "#4a5568" }}
        >
          {initials}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-mono font-bold text-sm truncate" style={{ color: player.online ? "#e2e8f0" : "#4a5568" }}>
            {player.playerName}
          </span>
          <div className="flex items-center gap-1.5">
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: player.online ? "#2ecc71" : "#4a5568",
                boxShadow: player.online ? "0 0 5px #2ecc71" : "none",
              }}
            />
            <span className="text-xs font-mono text-gray-500">
              {player.online ? player.level : "Offline"}
            </span>
          </div>
        </div>
        <div className="ml-auto text-right flex-shrink-0">
          <div className="font-mono font-bold text-sm" style={{ color }}>
            {player.prestige} pts
          </div>
          <div className="text-xs font-mono text-gray-600">{formatTime(player.shiftTime)}</div>
        </div>
      </div>

      {/* Bars */}
      <StatBar
        value={player.energy}
        color={player.energy > 50 ? "#2ecc71" : player.energy > 25 ? "#f39c12" : "#e74c3c"}
        label="⚡ Energia"
        display={`${Math.round(player.energy)}%`}
      />
      <StatBar
        value={player.stress}
        color={player.stress > 70 ? "#e74c3c" : "#f39c12"}
        label="😰 Estresse"
        display={`${Math.round(player.stress)}%`}
      />

      <div className="flex justify-between items-center text-xs font-mono">
        <span className="text-gray-500">
          ✅ {player.completedMissions} missões
        </span>
        <span className="text-gray-600">📍 {player.currentRoom}</span>
      </div>

      <div
        className="px-2 py-1.5 rounded text-xs text-gray-400 font-mono truncate"
        style={{ background: "#060e1a" }}
      >
        {player.lastActivity}
      </div>
    </motion.div>
  );
}

function gridClass(n: number): string {
  if (n <= 1) return "grid-cols-1 max-w-sm mx-auto";
  if (n <= 2) return "grid-cols-2";
  if (n <= 4) return "grid-cols-2";
  if (n <= 6) return "grid-cols-3";
  return "grid-cols-4";
}

function liveGridStyle(n: number): React.CSSProperties {
  if (n === 1) return { gridTemplateColumns: "1fr" };
  if (n === 2) return { gridTemplateColumns: "1fr 1fr" };
  if (n <= 4) return { gridTemplateColumns: "1fr 1fr" };
  if (n <= 6) return { gridTemplateColumns: "1fr 1fr 1fr" };
  return { gridTemplateColumns: "1fr 1fr 1fr 1fr" };
}

function LiveScreenPanel({
  player,
  index,
}: {
  player: LivePlayerData;
  index: number;
}) {
  const color = CARD_COLORS[index % CARD_COLORS.length];
  const isOnline = player.wsOnline;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className="relative overflow-hidden rounded-lg"
      style={{
        border: `2px solid ${isOnline ? color : "#1e2d40"}`,
        background: "#030912",
        aspectRatio: "16/9",
      }}
    >
      {player.screenshot ? (
        <img
          src={player.screenshot}
          alt={`Tela de ${player.playerName}`}
          className="w-full h-full"
          style={{ display: "block", objectFit: "fill" }}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2">
          <div className="text-3xl opacity-20">🖥️</div>
          <p className="text-xs font-mono text-gray-600">
            {isOnline ? "Aguardando captura…" : "Offline"}
          </p>
        </div>
      )}

      {/* Top: name + dot */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center gap-2 px-3 py-1.5"
        style={{
          background: "linear-gradient(to bottom, rgba(0,0,0,0.78) 0%, transparent 100%)",
        }}
      >
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{
            background: isOnline ? "#2ecc71" : "#4a5568",
            boxShadow: isOnline ? "0 0 6px #2ecc71" : "none",
          }}
        />
        <span
          className="font-mono font-bold text-xs truncate"
          style={{ color: isOnline ? color : "#4a5568" }}
        >
          {player.playerName}
        </span>
        <span className="text-xs font-mono text-gray-400 ml-auto flex-shrink-0">
          {player.level}
        </span>
      </div>

      {/* Bottom: stats */}
      <div
        className="absolute bottom-0 left-0 right-0 flex items-center gap-3 px-3 py-1.5"
        style={{
          background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, transparent 100%)",
        }}
      >
        <div className="flex items-center gap-1 min-w-0 flex-1">
          <span className="text-xs">⚡</span>
          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "#111c2e" }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.max(0, Math.min(100, player.energy))}%`,
                background: player.energy > 50 ? "#2ecc71" : player.energy > 25 ? "#f39c12" : "#e74c3c",
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>
        <div className="flex items-center gap-1 min-w-0 flex-1">
          <span className="text-xs">😰</span>
          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "#111c2e" }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.max(0, Math.min(100, player.stress))}%`,
                background: player.stress > 70 ? "#e74c3c" : player.stress > 40 ? "#f39c12" : "#2ecc71",
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>
        <span className="text-xs font-mono flex-shrink-0" style={{ color }}>
          ⭐ {player.prestige}
        </span>
        <span className="text-xs font-mono text-gray-400 truncate flex-shrink-0 max-w-[80px]">
          📍 {player.currentRoom}
        </span>
      </div>

      {/* Offline dim overlay */}
      {!isOnline && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.55)" }}
        >
          <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">
            Offline
          </span>
        </div>
      )}
    </motion.div>
  );
}

// ─── Main ProfessorView ───────────────────────────────────────────────────────

interface WsFrame {
  playerId: string;
  playerName: string;
  screenshot: string;
  currentRoom?: string;
  prestige?: number;
  energy?: number;
  stress?: number;
  level?: string;
  completedMissions?: number;
  lastActivity?: string;
  shiftTime?: number;
  ts: number;
}

export function ProfessorView() {
  const navigate = useNavigate();
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [error, setError] = useState("");
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<"dashboard" | "live">("dashboard");

  // WebSocket live frames: playerId → latest WsFrame
  const wsFramesRef = useRef<Map<string, WsFrame>>(new Map());
  const [, forceRender] = useReducer((x: number) => x + 1, 0);
  const rafRef = useRef<number>(0);
  const wsRef = useRef<WebSocket | null>(null);

  // Schedule a re-render via rAF (batches multiple arriving frames into one render)
  const scheduleRender = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      forceRender();
    });
  }, []);

  // ── WebSocket connection for live view ─────────────────────────────────────
  useEffect(() => {
    if (viewMode !== "live") {
      if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(); wsRef.current = null; }
      return;
    }

    let ws: WebSocket;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let alive = true;

    const connect = () => {
      if (!alive) return;
      const proto = location.protocol === "https:" ? "wss:" : "ws:";
      ws = new WebSocket(`${proto}//${location.host}/__screen-ws?role=professor`);
      wsRef.current = ws;

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data as string) as { type: string } & Record<string, unknown>;
          if (msg.type === "frame") {
            const f = msg as unknown as Omit<WsFrame, "ts"> & { stats?: Record<string, unknown> };
            wsFramesRef.current.set(f.playerId, {
              playerId: f.playerId,
              playerName: f.playerName,
              screenshot: f.screenshot,
              currentRoom: (f.stats?.currentRoom ?? f.currentRoom) as string | undefined,
              prestige: (f.stats?.prestige ?? f.prestige) as number | undefined,
              energy: (f.stats?.energy ?? f.energy) as number | undefined,
              stress: (f.stats?.stress ?? f.stress) as number | undefined,
              level: (f.stats?.level ?? f.level) as string | undefined,
              completedMissions: (f.stats?.completedMissions ?? f.completedMissions) as number | undefined,
              lastActivity: (f.stats?.lastActivity ?? f.lastActivity) as string | undefined,
              shiftTime: (f.stats?.shiftTime ?? f.shiftTime) as number | undefined,
              ts: Date.now(),
            });
            scheduleRender();
          } else if (msg.type === "leave") {
            wsFramesRef.current.delete(msg.playerId as string);
            scheduleRender();
          }
        } catch { /* ignore */ }
      };

      ws.onclose = () => {
        wsRef.current = null;
        if (alive) reconnectTimer = setTimeout(connect, 2000);
      };
      ws.onerror = () => ws.close();
    };

    connect();

    return () => {
      alive = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(); wsRef.current = null; }
    };
  }, [viewMode, scheduleRender]);

  // ── HTTP polling for dashboard stats ──────────────────────────────────────
  const fetchPlayers = useCallback(async () => {
    try {
      const res = await fetch("/__rooms/GLOBAL/players");
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json() as { players: PlayerData[] };
      setPlayers(data.players ?? []);
      setLastRefresh(new Date());
      setError("");
    } catch {
      setError("Erro de conexão");
    }
  }, []);

  useEffect(() => {
    fetchPlayers();
    const id = setInterval(fetchPlayers, 1500);
    return () => clearInterval(id);
  }, [fetchPlayers]);

  // ── Merge WebSocket frames with HTTP player list for live view ─────────────
  const wsOnlineThreshold = 5000; // ms — if no frame in 5s, player is offline
  const now = Date.now();

  const livePlayers: LivePlayerData[] = (() => {
    const frames = wsFramesRef.current;
    const frameIds = [...frames.keys()];
    const httpIds = players.map((p) => p.playerId);

    // All known player IDs (union)
    const allIds = [...new Set([...httpIds, ...frameIds])];

    return allIds.map((id) => {
      const httpP = players.find((p) => p.playerId === id);
      const frame = frames.get(id);
      const wsOnline = !!frame && now - frame.ts < wsOnlineThreshold;

      return {
        playerId: id,
        playerName: frame?.playerName ?? httpP?.playerName ?? "Estudante",
        online: httpP?.online ?? wsOnline,
        wsOnline,
        currentRoom: frame?.currentRoom ?? httpP?.currentRoom ?? "—",
        prestige: frame?.prestige ?? httpP?.prestige ?? 0,
        energy: frame?.energy ?? httpP?.energy ?? 100,
        stress: frame?.stress ?? httpP?.stress ?? 0,
        level: frame?.level ?? httpP?.level ?? "—",
        completedMissions: frame?.completedMissions ?? httpP?.completedMissions ?? 0,
        lastActivity: frame?.lastActivity ?? httpP?.lastActivity ?? "—",
        shiftTime: frame?.shiftTime ?? httpP?.shiftTime ?? 0,
        screenshot: frame?.screenshot,
      };
    });
  })();

  const displayPlayers = viewMode === "live" ? livePlayers : players;
  const onlineCount = viewMode === "live"
    ? livePlayers.filter((p) => p.wsOnline).length
    : players.filter((p) => p.online).length;
  const wsConnected = wsRef.current?.readyState === WebSocket.OPEN;

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden pointer-events-auto"
      style={{ background: "#060e1a", zIndex: 200 }}
    >
      {/* Top bar */}
      <div
        className="flex items-center gap-4 px-6 py-4 border-b flex-shrink-0"
        style={{ borderColor: "#0e2a1e", background: "#0a1628" }}
      >
        <button
          onClick={() => navigate("/")}
          className="font-mono text-sm hover:opacity-70 transition-opacity"
          style={{ color: "#1abc9c" }}
        >
          ← VOLTAR
        </button>
        <h1
          className="flex-1 text-center"
          style={{
            fontFamily: "'Press Start 2P', monospace",
            color: "#1abc9c",
            fontSize: "clamp(10px, 2vw, 15px)",
          }}
        >
          MODO PROFESSOR
        </h1>
        <div className="flex items-center gap-2">
          {lastRefresh && (
            <span className="text-xs font-mono text-gray-600">
              {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          {viewMode === "live" ? (
            <div
              className="w-2 h-2 rounded-full"
              style={{
                background: wsConnected ? "#2ecc71" : "#e74c3c",
                boxShadow: wsConnected ? "0 0 6px #2ecc71" : "none",
                animation: wsConnected ? "pulse 2s infinite" : "none",
              }}
            />
          ) : (
            <div
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: error ? "#e74c3c" : "#2ecc71" }}
            />
          )}
        </div>
      </div>

      {/* Stats + view toggle bar */}
      <div
        className="flex items-center gap-6 px-6 py-3 border-b flex-shrink-0"
        style={{ borderColor: "#0e2a1e", background: "#081420" }}
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl font-mono font-bold" style={{ color: "#1abc9c" }}>
            {onlineCount}
          </span>
          <span className="text-sm font-mono text-gray-500">
            {onlineCount === 1 ? "jogador online" : "jogadores online"}
          </span>
        </div>
        {displayPlayers.length > onlineCount && (
          <span className="text-xs font-mono text-gray-700">
            + {displayPlayers.length - onlineCount} offline
          </span>
        )}
        {error && viewMode === "dashboard" && (
          <span className="text-xs font-mono text-red-500">{error}</span>
        )}

        {/* View toggle */}
        <div className="ml-auto flex items-center gap-1 rounded-lg overflow-hidden border" style={{ borderColor: "#1e3a5f" }}>
          <button
            onClick={() => setViewMode("dashboard")}
            className="px-4 py-1.5 text-xs font-mono transition-colors"
            style={{
              background: viewMode === "dashboard" ? "#1abc9c" : "transparent",
              color: viewMode === "dashboard" ? "#060e1a" : "#4a7a9b",
            }}
          >
            📊 Dashboard
          </button>
          <button
            onClick={() => setViewMode("live")}
            className="px-4 py-1.5 text-xs font-mono transition-colors"
            style={{
              background: viewMode === "live" ? "#1abc9c" : "transparent",
              color: viewMode === "live" ? "#060e1a" : "#4a7a9b",
            }}
          >
            📺 Telas ao Vivo
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto p-5">
        {displayPlayers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="text-6xl opacity-30">👩‍🏫</div>
            <p className="font-mono text-lg text-gray-600">
              Nenhum jogador ativo no momento
            </p>
            <p className="font-mono text-sm text-gray-700 text-center">
              Assim que os alunos iniciarem o jogo,
              <br />
              eles aparecerão aqui automaticamente.
            </p>
          </div>
        ) : viewMode === "dashboard" ? (
          <div className={`grid gap-4 w-full ${gridClass(players.length)}`}>
            <AnimatePresence mode="popLayout">
              {players.map((p, i) => (
                <PlayerCard key={p.playerId} player={p} index={i} />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div
            className="grid gap-3 w-full h-full"
            style={liveGridStyle(livePlayers.length)}
          >
            <AnimatePresence mode="popLayout">
              {livePlayers.map((p, i) => (
                <LiveScreenPanel key={p.playerId} player={p} index={i} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
