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
      {/* Header */}
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

      {/* Body */}
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

export function ProfessorView() {
  const navigate = useNavigate();
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [error, setError] = useState("");
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

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
    const id = setInterval(fetchPlayers, 3000);
    return () => clearInterval(id);
  }, [fetchPlayers]);

  const onlineCount = players.filter((p) => p.online).length;

  return (
    /* pointer-events-auto is critical: this sits inside a pointer-events-none shell in App.tsx */
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

      {/* Stats bar */}
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
          <span className="text-xs font-mono text-red-500 ml-auto">{error}</span>
        )}
      </div>

      {/* Dashboard */}
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
        ) : (
          <div className={`grid gap-4 w-full ${gridClass(players.length)}`}>
            <AnimatePresence mode="popLayout">
              {players.map((p, i) => (
                <PlayerCard key={p.playerId} player={p} index={i} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
