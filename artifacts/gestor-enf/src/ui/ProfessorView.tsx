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
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "#111c2e" }}>
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
      {/* Card header */}
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

      {/* Card body */}
      <div className="px-4 py-3 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400 font-mono truncate pr-2">
            📍 {player.currentRoom}
          </span>
          <span className="text-xs font-mono font-bold whitespace-nowrap" style={{ color }}>
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
          <span className="text-gray-500">✅ {player.completedMissions} missões</span>
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
  const [roomInput, setRoomInput] = useState("");
  const [activeCode, setActiveCode] = useState("");
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [error, setError] = useState("");
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchPlayers = useCallback(async (code: string) => {
    try {
      const res = await fetch(`/api/rooms/${encodeURIComponent(code)}/players`);
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();
      setPlayers(data.players ?? []);
      setLastRefresh(new Date());
      setError("");
    } catch {
      setError("Erro de conexão com o servidor");
    }
  }, []);

  useEffect(() => {
    if (!activeCode) return;
    fetchPlayers(activeCode);
    const id = setInterval(() => fetchPlayers(activeCode), 3000);
    return () => clearInterval(id);
  }, [activeCode, fetchPlayers]);

  const enter = () => {
    const code = roomInput.trim().toUpperCase();
    if (!code) return;
    setActiveCode(code);
  };

  const onlineCount = players.filter((p) => p.online).length;

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden"
      style={{ background: "#060e1a" }}
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
            fontSize: "clamp(10px, 2vw, 16px)",
          }}
        >
          MODO PROFESSOR
        </h1>
        {activeCode && lastRefresh && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-gray-600">
              {lastRefresh.toLocaleTimeString()}
            </span>
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          </div>
        )}
      </div>

      {/* Main content */}
      {!activeCode ? (
        /* ── Room code entry screen ── */
        <div className="flex flex-col items-center justify-center flex-1 gap-5 p-8">
          <div className="text-6xl mb-2">👩‍🏫</div>
          <p
            className="font-mono text-lg font-bold"
            style={{ color: "#1abc9c" }}
          >
            Código da turma
          </p>
          <p className="font-mono text-sm text-center max-w-xs" style={{ color: "#4a6a5a" }}>
            Informe o código que os alunos usarão ao iniciar o jogo.
            <br />
            Exemplo: <strong style={{ color: "#1abc9c" }}>TURMA-A</strong>
          </p>
          <div className="flex gap-3 mt-1">
            <input
              value={roomInput}
              onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && enter()}
              placeholder="TURMA-A"
              autoFocus
              className="px-4 py-3 rounded-lg text-white font-mono text-lg w-44 focus:outline-none"
              style={{
                background: "#0d1f35",
                border: "2px solid #1abc9c44",
                caretColor: "#1abc9c",
              }}
            />
            <button
              onClick={enter}
              disabled={!roomInput.trim()}
              className="px-6 py-3 rounded-lg font-mono font-bold transition-opacity"
              style={{
                background: "#1abc9c",
                color: "#fff",
                opacity: roomInput.trim() ? 1 : 0.35,
              }}
            >
              ENTRAR
            </button>
          </div>
          {error && (
            <p className="text-red-400 font-mono text-sm">{error}</p>
          )}
        </div>
      ) : (
        /* ── Dashboard ── */
        <div className="flex-1 overflow-auto p-5">
          {/* Dashboard sub-header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <span
                className="font-mono font-bold text-lg"
                style={{ color: "#1abc9c" }}
              >
                Turma:{" "}
                <span
                  className="px-2 py-0.5 rounded text-base"
                  style={{ background: "#1abc9c22", color: "#1abc9c" }}
                >
                  {activeCode}
                </span>
              </span>
              <span className="font-mono text-sm text-gray-500">
                {onlineCount}/{players.length} online
              </span>
            </div>
            <button
              onClick={() => {
                setActiveCode("");
                setPlayers([]);
                setRoomInput("");
              }}
              className="font-mono text-xs text-gray-600 hover:text-gray-300 transition-colors"
            >
              trocar turma
            </button>
          </div>

          {error && (
            <p className="text-red-400 font-mono text-sm text-center mb-4">
              {error}
            </p>
          )}

          {players.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <div className="text-5xl opacity-40">⏳</div>
              <p className="font-mono text-lg text-gray-600">
                Aguardando jogadores...
              </p>
              <p className="font-mono text-sm text-center text-gray-700">
                Peça aos alunos para usar o código{" "}
                <span
                  className="font-bold"
                  style={{ color: "#1abc9c" }}
                >
                  {activeCode}
                </span>{" "}
                ao iniciar um novo jogo
              </p>
            </div>
          ) : (
            <div className={`grid gap-4 ${gridClass(players.length)}`}>
              <AnimatePresence mode="popLayout">
                {players.map((p, i) => (
                  <PlayerCard key={p.playerId} player={p} index={i} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
