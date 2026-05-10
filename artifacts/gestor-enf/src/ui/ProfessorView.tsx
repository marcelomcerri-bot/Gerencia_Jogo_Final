import { useState, useEffect, useCallback } from "react";
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
  screenshot?: string;
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
      transition={{ duration: 0.25 }}
      className="flex flex-col overflow-hidden rounded-xl border-2 min-w-0"
      style={{
        borderColor: player.online ? color : "#1e2d40",
        background: "#0b1929",
      }}
    >
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{ background: `${color}18` }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm font-mono flex-shrink-0 text-white"
          style={{ background: color }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-mono font-bold text-sm truncate">
            {player.playerName}
          </p>
          <p className="text-xs font-mono truncate" style={{ color }}>
            {player.level}
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{
              background: player.online ? "#2ecc71" : "#4a5568",
              boxShadow: player.online ? "0 0 7px #2ecc71" : "none",
            }}
          />
          <span className="text-xs font-mono text-gray-500">
            {player.online ? "online" : "offline"}
          </span>
        </div>
      </div>

      <div className="px-4 py-3 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400 font-mono truncate pr-2">
            📍 {player.currentRoom}
          </span>
          <span
            className="text-xs font-mono font-bold whitespace-nowrap"
            style={{ color }}
          >
            ⭐ {player.prestige} pts
          </span>
        </div>

        <StatBar
          value={player.energy}
          color="#2ecc71"
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
          <span className="text-gray-600">🕐 {formatTime(player.shiftTime)}</span>
        </div>

        <div
          className="px-2 py-1.5 rounded text-xs text-gray-400 font-mono truncate"
          style={{ background: "#060e1a" }}
        >
          {player.lastActivity}
        </div>
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

// ─── Live screen grid layout ───────────────────────────────────────────────
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
  player: PlayerData;
  index: number;
}) {
  const color = CARD_COLORS[index % CARD_COLORS.length];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className="relative overflow-hidden rounded-lg"
      style={{
        border: `2px solid ${player.online ? color : "#1e2d40"}`,
        background: "#030912",
        aspectRatio: "16/9",
      }}
    >
      {/* Screenshot or placeholder */}
      {player.screenshot ? (
        <img
          src={player.screenshot}
          alt={`Tela de ${player.playerName}`}
          className="w-full h-full object-cover"
          style={{ display: "block" }}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2">
          <div className="text-3xl opacity-20">🖥️</div>
          <p className="text-xs font-mono text-gray-600">
            {player.online ? "Aguardando captura…" : "Offline"}
          </p>
        </div>
      )}

      {/* Top overlay: name + online dot */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center gap-2 px-3 py-1.5"
        style={{
          background: "linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, transparent 100%)",
        }}
      >
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{
            background: player.online ? "#2ecc71" : "#4a5568",
            boxShadow: player.online ? "0 0 6px #2ecc71" : "none",
          }}
        />
        <span
          className="font-mono font-bold text-xs truncate"
          style={{ color: player.online ? color : "#4a5568" }}
        >
          {player.playerName}
        </span>
        <span className="text-xs font-mono text-gray-400 ml-auto flex-shrink-0">
          {player.level}
        </span>
      </div>

      {/* Bottom overlay: stats bar */}
      <div
        className="absolute bottom-0 left-0 right-0 flex items-center gap-3 px-3 py-1.5"
        style={{
          background: "linear-gradient(to top, rgba(0,0,0,0.80) 0%, transparent 100%)",
        }}
      >
        {/* Energy */}
        <div className="flex items-center gap-1 min-w-0 flex-1">
          <span className="text-xs">⚡</span>
          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "#111c2e" }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.max(0, Math.min(100, player.energy))}%`,
                background: player.energy > 50 ? "#2ecc71" : player.energy > 25 ? "#f39c12" : "#e74c3c",
              }}
            />
          </div>
        </div>
        {/* Stress */}
        <div className="flex items-center gap-1 min-w-0 flex-1">
          <span className="text-xs">😰</span>
          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "#111c2e" }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.max(0, Math.min(100, player.stress))}%`,
                background: player.stress > 70 ? "#e74c3c" : player.stress > 40 ? "#f39c12" : "#2ecc71",
              }}
            />
          </div>
        </div>
        {/* Prestige */}
        <span className="text-xs font-mono whitespace-nowrap flex-shrink-0" style={{ color }}>
          ⭐ {player.prestige}
        </span>
        {/* Room */}
        <span className="text-xs font-mono text-gray-400 truncate flex-shrink-0 max-w-[80px]">
          📍 {player.currentRoom}
        </span>
      </div>

      {/* Offline overlay */}
      {!player.online && (
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

export function ProfessorView() {
  const navigate = useNavigate();
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [error, setError] = useState("");
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<"dashboard" | "live">("dashboard");

  const fetchPlayers = useCallback(async () => {
    try {
      const res = await fetch("/__rooms/GLOBAL/players");
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();
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

  const onlineCount = players.filter((p) => p.online).length;

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
          <div
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ background: error ? "#e74c3c" : "#2ecc71" }}
          />
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
        {players.length > onlineCount && (
          <span className="text-xs font-mono text-gray-700">
            + {players.length - onlineCount} offline
          </span>
        )}
        {error && (
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
        {players.length === 0 ? (
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
            style={liveGridStyle(players.length)}
          >
            <AnimatePresence mode="popLayout">
              {players.map((p, i) => (
                <LiveScreenPanel key={p.playerId} player={p} index={i} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
