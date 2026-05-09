import {
  HashRouter,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { hasSave, clearSave } from "../game/utils/save";
import { playSound } from "../game/utils/audio";
import { ProfessorView } from "./ProfessorView";

export function AppUI({
  onStartGame,
  isMobile = false,
  mobileScale = 1,
}: {
  onStartGame: () => void;
  isMobile?: boolean;
  mobileScale?: number;
}) {
  return (
    <HashRouter>
      <RoutesWrapper
        onStartGame={onStartGame}
        isMobile={isMobile}
        mobileScale={mobileScale}
      />
    </HashRouter>
  );
}

function RoutesWrapper({
  onStartGame,
  isMobile,
  mobileScale,
}: {
  onStartGame: () => void;
  isMobile: boolean;
  mobileScale: number;
}) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    (window as any).reactNavigate = navigate;
    return () => {
      delete (window as any).reactNavigate;
    };
  }, [navigate]);

  const inGame =
    location.pathname !== "/" &&
    location.pathname !== "/pause" &&
    location.pathname !== "/professor";

  return (
    <>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={<HomeMenu onStartGame={onStartGame} />}
          />
          <Route path="/pause" element={<PauseMenu />} />
          <Route path="/professor" element={<ProfessorView />} />
        </Routes>
      </AnimatePresence>

      {isMobile && inGame && <MobileControls mobileScale={mobileScale} />}
    </>
  );
}

// ---------------------------------------------------------------------------
// Join modal — shown before NOVO JOGO; collects player name + optional room code
// ---------------------------------------------------------------------------

function JoinModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: (playerName: string, roomCode: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [err, setErr] = useState("");

  const handleJoin = async () => {
    const playerName = name.trim() || "Estudante";
    const roomCode = code.trim().toUpperCase();
    setErr("");

    if (roomCode) {
      setJoining(true);
      try {
        const res = await fetch(`/api/rooms/${encodeURIComponent(roomCode)}/join`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerName }),
        });
        if (!res.ok) throw new Error("Falha ao entrar na sala");
        const data = await res.json();
        (window as any).sessionRoom = { code: roomCode, playerId: data.playerId };
      } catch {
        setErr("Não foi possível conectar ao servidor. Verifique o código.");
        setJoining(false);
        return;
      }
    } else {
      delete (window as any).sessionRoom;
    }

    onConfirm(playerName, roomCode);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 pointer-events-auto"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <motion.div
        initial={{ scale: 0.92, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 20 }}
        className="rounded-2xl p-8 max-w-sm w-full mx-4 flex flex-col gap-5"
        style={{ background: "#0a1628", border: "3px solid #1abc9c" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          className="text-center"
          style={{
            fontFamily: "'Press Start 2P', monospace",
            color: "#1abc9c",
            fontSize: 13,
          }}
        >
          NOVO JOGO
        </h2>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-mono text-gray-400">
            Seu nome (opcional)
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Estudante"
            autoFocus
            maxLength={24}
            className="px-3 py-2.5 rounded-lg text-white font-mono text-sm focus:outline-none"
            style={{
              background: "#0d1f35",
              border: "2px solid #1abc9c44",
              caretColor: "#1abc9c",
            }}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-mono text-gray-400">
            Código da turma{" "}
            <span className="text-gray-600">(deixe em branco para jogar sozinho)</span>
          </label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            placeholder="Ex: TURMA-A"
            maxLength={20}
            className="px-3 py-2.5 rounded-lg text-white font-mono text-sm focus:outline-none tracking-widest"
            style={{
              background: "#0d1f35",
              border: "2px solid #1abc9c44",
              caretColor: "#1abc9c",
            }}
          />
          <p className="text-xs font-mono text-gray-600">
            Peça o código ao seu professor para que ele possa acompanhar.
          </p>
        </div>

        {err && (
          <p className="text-red-400 font-mono text-xs text-center">{err}</p>
        )}

        <div className="flex gap-3 mt-1">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-lg font-mono text-sm transition-colors"
            style={{
              background: "transparent",
              border: "2px solid #1e3a50",
              color: "#6b8fa8",
            }}
          >
            VOLTAR
          </button>
          <button
            onClick={handleJoin}
            disabled={joining}
            className="flex-1 py-3 rounded-lg font-mono font-bold text-sm transition-opacity"
            style={{
              background: "#1abc9c",
              color: "#fff",
              opacity: joining ? 0.5 : 1,
            }}
          >
            {joining ? "ENTRANDO..." : "JOGAR"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Home menu
// ---------------------------------------------------------------------------

function HomeMenu({ onStartGame }: { onStartGame: () => void }) {
  const navigate = useNavigate();
  const [showHelp, setShowHelp] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  const handleJoinConfirm = (_playerName: string, _roomCode: string) => {
    playSound("click");
    clearSave();
    onStartGame();
    navigate("/game");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 pointer-events-none"
    >
      {!showHelp ? (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-4 pointer-events-auto w-80">
          {hasSave() && (
            <motion.button
              onMouseEnter={() => playSound("hover")}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                playSound("click");
                onStartGame();
                navigate("/game");
              }}
              className="flex items-center justify-center gap-3 bg-indigo-500 text-white px-8 py-4 rounded-xl shadow-[0_4px_0_#312e81] border-2 border-white font-['Press_Start_2P',_monospace] tracking-widest text-sm hover:bg-indigo-400"
            >
              CONTINUAR
            </motion.button>
          )}

          <motion.button
            onMouseEnter={() => playSound("hover")}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              playSound("click");
              setShowJoin(true);
            }}
            className="flex items-center justify-center gap-3 bg-[#1abc9c] text-white px-8 py-4 rounded-xl shadow-[0_4px_0_#0e6252] border-2 border-white font-['Press_Start_2P',_monospace] tracking-widest text-sm hover:bg-[#1dd2af]"
          >
            NOVO JOGO
          </motion.button>

          <motion.button
            onMouseEnter={() => playSound("hover")}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              playSound("click");
              setShowHelp(true);
            }}
            className="flex items-center justify-center gap-3 bg-[#f39c12] text-white px-8 py-4 rounded-xl shadow-[0_4px_0_#a66705] border-2 border-white font-['Press_Start_2P',_monospace] tracking-widest text-sm hover:bg-[#f4a62a]"
          >
            COMO JOGAR
          </motion.button>

          <motion.button
            onMouseEnter={() => playSound("hover")}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              playSound("click");
              navigate("/professor");
            }}
            className="flex items-center justify-center gap-3 text-white px-8 py-4 rounded-xl border-2 border-white font-['Press_Start_2P',_monospace] tracking-widest text-sm"
            style={{
              background: "#2c3e70",
              boxShadow: "0 4px 0 #1a2348",
            }}
          >
            🎓 MODO PROFESSOR
          </motion.button>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto bg-[#0a1628]/95 border-4 border-teal-500 rounded-2xl p-8 max-w-lg w-full shadow-2xl flex flex-col items-center gap-6"
        >
          <h2 className="text-2xl font-mono text-teal-400 font-bold">
            COMO JOGAR — HUAP/UFF
          </h2>
          <div className="text-teal-50 font-mono text-sm space-y-2 text-center">
            <p>🎮 WASD / Setas — Mover</p>
            <p>🏃 SHIFT — Correr (consome energia)</p>
            <p>💬 E — Falar com NPC / Interagir</p>
            <p>📋 M — Ver missões e progresso</p>
            <p>⏸️ ESC — Pausar / Voltar ao menu</p>
            <br />
            <p>
              Explore o HUAP, fale com os profissionais e complete missões para
              ganhar Prestígio.
            </p>
            <br />
            <p className="text-orange-400">
              🚨 CRISES: Eventos aleatórios precisam de decisão rápida — escolha
              com cuidado!
            </p>
            <p className="text-green-400">⚡ Energia: descanse na Copa (+6/s)</p>
            <p className="text-red-400">😰 Estresse: reduza no jardim ou copa</p>
          </div>
          <motion.button
            onMouseEnter={() => playSound("hover")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              playSound("click");
              setShowHelp(false);
            }}
            className="mt-4 px-8 py-3 rounded-lg bg-teal-600/20 text-teal-300 border-2 border-teal-500/50 hover:bg-teal-500 hover:text-white font-mono font-bold"
          >
            VOLTAR
          </motion.button>
        </motion.div>
      )}

      {/* Join modal — rendered as overlay outside the main button group */}
      <AnimatePresence>
        {showJoin && (
          <JoinModal
            onConfirm={handleJoinConfirm}
            onCancel={() => setShowJoin(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function PauseMenu() {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
      animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
      exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 pointer-events-auto"
    >
      <div className="bg-[#0a1628] border-4 border-teal-500 rounded-2xl p-8 max-w-sm w-full shadow-2xl flex flex-col items-center gap-6">
        <h2 className="text-3xl font-mono text-teal-400 font-bold mb-4">
          PAUSADO
        </h2>

        <motion.button
          onMouseEnter={() => playSound("hover")}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            playSound("click");
            navigate("/game");
            (window as any).phaserGame?.scene.resume("GameScene");
            (window as any).phaserGame?.scene.resume("HUDScene");
          }}
          className="w-full py-4 rounded-lg bg-teal-600/20 text-teal-300 border-2 border-teal-500/50 hover:bg-teal-500 hover:text-white font-mono font-bold text-lg transition-colors"
        >
          RETOMAR JOGO
        </motion.button>

        <motion.button
          onMouseEnter={() => playSound("hover")}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            playSound("click");
            navigate("/");
            (window as any).phaserGame?.scene.stop("HUDScene");
            (window as any).phaserGame?.scene.stop("DialogScene");
            (window as any).phaserGame?.scene.stop("GameScene");
            (window as any).phaserGame?.scene.start("MenuScene");
          }}
          className="w-full py-4 rounded-lg bg-red-600/20 text-red-400 border-2 border-red-500/50 hover:bg-red-500 hover:text-white font-mono font-bold text-lg transition-colors"
        >
          SAIR PARA MENU
        </motion.button>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Mobile D-Pad controls
// ---------------------------------------------------------------------------

type PadKey =
  | "up"
  | "down"
  | "left"
  | "right"
  | "sprint"
  | "actionJustPressed"
  | "missionJustPressed"
  | "menuJustPressed";

function setVPad(key: PadKey, value: boolean) {
  if (!(window as any).virtualPad) {
    (window as any).virtualPad = {
      up: false,
      down: false,
      left: false,
      right: false,
      sprint: false,
      actionJustPressed: false,
      missionJustPressed: false,
      menuJustPressed: false,
    };
  }
  (window as any).virtualPad[key] = value;
}

function DPadBtn({
  label,
  padKey,
  style,
  color = "#1abc9c",
}: {
  label: string;
  padKey: PadKey;
  style?: React.CSSProperties;
  color?: string;
}) {
  const pressing = useRef(false);

  const press = () => {
    pressing.current = true;
    setVPad(padKey, true);
  };
  const release = () => {
    pressing.current = false;
    setVPad(padKey, false);
  };

  return (
    <button
      onPointerDown={press}
      onPointerUp={release}
      onPointerLeave={release}
      onPointerCancel={release}
      style={{
        position: "absolute",
        width: 56,
        height: 56,
        borderRadius: 10,
        background: "rgba(10,22,40,0.80)",
        border: `2px solid ${color}`,
        color,
        fontFamily: "monospace",
        fontSize: 20,
        fontWeight: "bold",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        touchAction: "none",
        userSelect: "none",
        WebkitUserSelect: "none",
        cursor: "pointer",
        ...style,
      }}
    >
      {label}
    </button>
  );
}

function FireBtn({
  label,
  padKey,
  color,
  style,
}: {
  label: string;
  padKey: PadKey;
  color: string;
  style?: React.CSSProperties;
}) {
  const fire = (e: React.PointerEvent) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    setVPad(padKey, true);
    setTimeout(() => setVPad(padKey, false), 80);
  };

  return (
    <button
      onPointerDown={fire}
      style={{
        position: "absolute",
        width: 60,
        height: 60,
        borderRadius: "50%",
        background: "rgba(10,22,40,0.80)",
        border: `3px solid ${color}`,
        color: "#fff",
        fontFamily: "monospace",
        fontSize: 11,
        fontWeight: "bold",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        touchAction: "none",
        userSelect: "none",
        WebkitUserSelect: "none",
        cursor: "pointer",
        textAlign: "center",
        lineHeight: 1.2,
        ...style,
      }}
    >
      {label}
    </button>
  );
}

function MobileControls({ mobileScale = 1 }: { mobileScale?: number }) {
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const handler = (e: Event) =>
      setDialogOpen((e as CustomEvent<{ active: boolean }>).detail.active);
    window.addEventListener("dialogactive", handler);
    return () => window.removeEventListener("dialogactive", handler);
  }, []);

  if (dialogOpen) return null;

  const cs = 1 / Math.max(0.1, mobileScale);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 200,
      }}
    >
      {/* D-Pad — bottom-left */}
      <div
        style={{
          position: "absolute",
          left: 24,
          bottom: 24,
          width: 180,
          height: 180,
          pointerEvents: "auto",
          transform: `scale(${cs})`,
          transformOrigin: "bottom left",
        }}
      >
        <DPadBtn label="▲" padKey="up" style={{ left: 62, top: 0 }} />
        <DPadBtn label="▼" padKey="down" style={{ left: 62, bottom: 0 }} />
        <DPadBtn label="◀" padKey="left" style={{ left: 0, top: 62 }} />
        <DPadBtn label="▶" padKey="right" style={{ right: 0, top: 62 }} />
        <DPadBtn
          label="RUN"
          padKey="sprint"
          style={{ left: 62, top: 62, fontSize: 12 }}
          color="#f39c12"
        />
      </div>

      {/* Action buttons — bottom-right */}
      <div
        style={{
          position: "absolute",
          right: 24,
          bottom: 24,
          width: 160,
          height: 160,
          pointerEvents: "auto",
          transform: `scale(${cs})`,
          transformOrigin: "bottom right",
        }}
      >
        <FireBtn
          label="FALAR"
          padKey="actionJustPressed"
          color="#f39c12"
          style={{ right: 0, top: 20 }}
        />
        <FireBtn
          label="MISSÃO"
          padKey="missionJustPressed"
          color="#9b59b6"
          style={{ left: 0, bottom: 0 }}
        />
        <FireBtn
          label="PAUSA"
          padKey="menuJustPressed"
          color="#e74c3c"
          style={{ right: 0, bottom: 0 }}
        />
      </div>
    </div>
  );
}
