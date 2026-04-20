/**
 * Case-specific animated scenes — one per case, each mirroring the scenario text.
 */
import { motion } from "framer-motion";

// ─── Shared primitives ────────────────────────────────────────────────────────

function Floor({ color = "#1e293b", tiles = 12 }: { color?: string; tiles?: number }) {
  return (
    <>
      <div className="absolute bottom-0 left-0 right-0 h-12" style={{ background: color }} />
      {Array.from({ length: tiles }).map((_, i) => (
        <div
          key={i}
          className="absolute bottom-0 h-12 border-r border-white/5"
          style={{ left: `${(i / tiles) * 100}%`, width: `${100 / tiles}%` }}
        />
      ))}
    </>
  );
}

function Ceiling({ color = "#0f172a" }: { color?: string }) {
  return <div className="absolute top-0 left-0 right-0 h-4" style={{ background: color }} />;
}

function NurseBody({ skin = "#FDDBB4", uniform = "white", accent = "#3182ce" }: { skin?: string; uniform?: string; accent?: string }) {
  return (
    <svg width="26" height="50" viewBox="0 0 26 50" fill="none">
      <circle cx="13" cy="8" r="6.5" fill={skin} />
      <rect x="8" y="2" width="10" height="5" rx="1" fill="white" />
      <rect x="11" y="0.5" width="4" height="3" rx="1" fill="white" />
      <rect x="11.5" y="1" width="3" height="2" fill="#e53e3e" rx="0.5" />
      <circle cx="10.5" cy="8" r="1" fill="#4a3728" />
      <circle cx="15.5" cy="8" r="1" fill="#4a3728" />
      <rect x="5" y="16" width="16" height="16" rx="3" fill={uniform} />
      <rect x="1" y="16" width="4" height="11" rx="2" fill={uniform} />
      <rect x="21" y="16" width="4" height="11" rx="2" fill={uniform} />
      <circle cx="3" cy="27" r="2.5" fill={skin} />
      <circle cx="23" cy="27" r="2.5" fill={skin} />
      <rect x="7" y="32" width="5" height="15" rx="2" fill={accent} />
      <rect x="14" y="32" width="5" height="15" rx="2" fill={accent} />
    </svg>
  );
}

function ManagerBody({ skin = "#FDDBB4" }: { skin?: string }) {
  return (
    <svg width="26" height="50" viewBox="0 0 26 50" fill="none">
      <circle cx="13" cy="8" r="6.5" fill={skin} />
      <path d="M6 4 Q13 -1 20 4" fill="#1a202c" />
      <circle cx="10.5" cy="8" r="1" fill="#4a3728" />
      <circle cx="15.5" cy="8" r="1" fill="#4a3728" />
      <path d="M10.5 11 Q13 12.5 15.5 11" stroke="#c05621" strokeWidth="1" fill="none" />
      <rect x="5" y="16" width="16" height="16" rx="3" fill="#2d3748" />
      <rect x="11" y="16" width="4" height="16" fill="#4a5568" />
      <rect x="10.5" y="18" width="1.5" height="14" fill="#e2e8f0" />
      <rect x="14" y="18" width="1.5" height="14" fill="#e2e8f0" />
      <rect x="10.5" y="20" width="5" height="3" rx="0.5" fill="#e53e3e" />
      <rect x="1" y="16" width="4" height="11" rx="2" fill="#2d3748" />
      <rect x="21" y="16" width="4" height="11" rx="2" fill="#2d3748" />
      <circle cx="3" cy="27" r="2.5" fill={skin} />
      <circle cx="23" cy="27" r="2.5" fill={skin} />
      <rect x="7" y="32" width="5" height="15" rx="2" fill="#1a202c" />
      <rect x="14" y="32" width="5" height="15" rx="2" fill="#1a202c" />
    </svg>
  );
}

function ExhaustedNurse({ skin = "#FDDBB4" }: { skin?: string }) {
  return (
    <svg width="26" height="50" viewBox="0 0 26 50" fill="none">
      <circle cx="13" cy="8" r="6.5" fill={skin} />
      <rect x="8" y="2" width="10" height="5" rx="1" fill="white" />
      <rect x="11" y="0.5" width="4" height="3" rx="1" fill="white" />
      <rect x="11.5" y="1" width="3" height="2" fill="#e53e3e" rx="0.5" />
      {/* Tired eyes */}
      <line x1="9.5" y1="8" x2="11.5" y2="8" stroke="#4a3728" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="14.5" y1="8" x2="16.5" y2="8" stroke="#4a3728" strokeWidth="1.5" strokeLinecap="round" />
      {/* Frown */}
      <path d="M10.5 11.5 Q13 10 15.5 11.5" stroke="#c05621" strokeWidth="1" fill="none" />
      {/* Bags under eyes */}
      <path d="M9 9.5 Q10.5 10.5 12 9.5" stroke="#a0aec0" strokeWidth="0.8" fill="none" />
      <path d="M14 9.5 Q15.5 10.5 17 9.5" stroke="#a0aec0" strokeWidth="0.8" fill="none" />
      <rect x="5" y="16" width="16" height="16" rx="3" fill="white" />
      <rect x="1" y="16" width="4" height="11" rx="2" fill="white" />
      <rect x="21" y="16" width="4" height="11" rx="2" fill="white" />
      <circle cx="3" cy="27" r="2.5" fill={skin} />
      <circle cx="23" cy="27" r="2.5" fill={skin} />
      <rect x="7" y="32" width="5" height="15" rx="2" fill="#3182ce" />
      <rect x="14" y="32" width="5" height="15" rx="2" fill="#3182ce" />
    </svg>
  );
}

// ─── CASE 001: A Escala Problemática ─────────────────────────────────────────
export function Case001Scene() {
  return (
    <div className="relative w-full h-56 overflow-hidden rounded-2xl select-none"
      style={{ background: "linear-gradient(to bottom, #1e293b 0%, #0f172a 100%)" }}>
      <Ceiling />
      <Floor tiles={14} />

      {/* Schedule board on wall */}
      <div className="absolute top-5 left-6 w-44 h-28 bg-white/95 rounded-lg border-2 border-blue-300/50 p-2">
        <div className="bg-blue-600 text-white text-[7px] font-bold text-center py-0.5 rounded mb-1.5">
          ESCALA — TURNO MANHÃ
        </div>
        <div className="grid grid-cols-7 gap-0.5 text-[5.5px]">
          {["TEC 1","TEC 2","TEC 3","TEC 4","TEC 5","TEC 6"].map((name, i) => (
            <div key={name} className="col-span-7 flex items-center gap-1 mb-0.5">
              <span className="text-gray-600 w-7 shrink-0 font-medium">{name}</span>
              {i < 4 ? (
                <span className="bg-emerald-500 text-white text-[5px] px-1 py-0.5 rounded font-bold">✓ OK</span>
              ) : (
                <motion.span
                  className="bg-red-500 text-white text-[5px] px-1 py-0.5 rounded font-bold"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                >
                  ✗ ATESTADO
                </motion.span>
              )}
            </div>
          ))}
        </div>
        <div className="mt-1 text-[6px] text-red-600 font-bold">⚠ 2 AUSÊNCIAS — ESCALA CRÍTICA</div>
      </div>

      {/* Alert banner */}
      <motion.div
        className="absolute top-5 right-5 bg-red-600/90 border border-red-400/50 text-white text-[9px] font-bold px-2.5 py-1.5 rounded-lg"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
      >
        📱 2 ATESTADOS<br />
        <span className="text-[8px] font-normal">ocupação: 93%</span>
      </motion.div>

      {/* Phone ringing */}
      <motion.div
        className="absolute bottom-16 right-8"
        animate={{ rotate: [-8, 8, -8] }}
        transition={{ duration: 0.3, repeat: Infinity }}
      >
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <rect x="4" y="4" width="20" height="20" rx="4" fill="#4a5568" />
          <rect x="6" y="7" width="16" height="12" rx="1" fill="#48bb78" />
          <circle cx="14" cy="22" r="2" fill="#718096" />
          <text x="14" y="13" textAnchor="middle" fontSize="6" fill="white">📞</text>
        </svg>
      </motion.div>
      <motion.div
        className="absolute bottom-14 right-2 text-yellow-300 text-[9px] font-bold"
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 0.6, repeat: Infinity }}
      >
        RING!
      </motion.div>

      {/* Manager stressed at desk */}
      <motion.div
        className="absolute bottom-12 left-[50%]"
        animate={{ x: [0, 2, -2, 0] }}
        transition={{ duration: 0.5, repeat: Infinity }}
      >
        <ManagerBody />
      </motion.div>

      {/* Remaining staff */}
      {[60, 70].map((pct, i) => (
        <motion.div
          key={i}
          className="absolute bottom-12"
          style={{ left: `${pct}%` }}
          animate={{ y: [0, -2, 0] }}
          transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.2 }}
        >
          <NurseBody />
        </motion.div>
      ))}

      {/* Isolation sign */}
      <div className="absolute bottom-12 left-[30%]">
        <div className="w-10 h-12 bg-yellow-500/20 border-2 border-yellow-400/60 rounded flex items-center justify-center">
          <div className="text-[8px] text-yellow-300 font-bold text-center">ISOL.<br/>CONT.</div>
        </div>
      </div>

      {/* Stress cloud */}
      <motion.div
        className="absolute bottom-[8.5rem] left-[46%] text-[9px] text-red-300 font-bold"
        animate={{ opacity: [0, 1, 1, 0], y: [5, 0, 0, -8] }}
        transition={{ duration: 2.5, repeat: Infinity }}
      >
        😰 O que faço?!
      </motion.div>
    </div>
  );
}

// ─── CASE 002: O Conflito na Equipe ──────────────────────────────────────────
export function Case002Scene() {
  return (
    <div className="relative w-full h-56 overflow-hidden rounded-2xl select-none"
      style={{ background: "linear-gradient(to bottom, #3b1f0a 0%, #1c0f05 100%)" }}>
      <Ceiling color="#2d1505" />
      <Floor color="#2d1505" tiles={10} />

      {/* Meeting table */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-72 h-6 bg-gradient-to-b from-amber-700 to-amber-900 rounded-xl border border-amber-600/50 shadow-lg" />
      <div className="absolute bottom-[3.2rem] left-1/2 -translate-x-1/2 w-2 h-12 bg-amber-800/70" />

      {/* Papers on table */}
      {[-20, 0, 20].map((offset, i) => (
        <div key={i}
          className="absolute bottom-[4.2rem]"
          style={{ left: `calc(50% + ${offset}px - 12px)`, transform: `rotate(${(i - 1) * 4}deg)` }}
        >
          <div className="w-5 h-7 bg-white/85 rounded shadow">
            <div className="p-0.5 space-y-0.5">
              <div className="h-0.5 bg-gray-400/60 rounded" />
              <div className="h-0.5 bg-gray-400/60 rounded w-2/3" />
            </div>
          </div>
        </div>
      ))}

      {/* Whiteboard */}
      <div className="absolute top-4 left-4 w-32 h-20 bg-gray-100/90 border-2 border-gray-400/50 rounded p-1.5">
        <div className="text-[7px] font-bold text-gray-500 mb-1">PROTOCOLO — DEBATE</div>
        <div className="text-[6px] text-blue-600">→ Método A</div>
        <div className="text-[6px] text-red-600">→ Método B</div>
        <div className="h-0.5 bg-gray-400/30 my-1" />
        <div className="text-[5px] text-gray-400">⚡ Em disputa há 3 semanas</div>
      </div>

      {/* Conflict person A — angry */}
      <motion.div
        className="absolute bottom-[4.2rem] left-[18%]"
        animate={{ x: [-2, 2, -2], rotate: [-3, 3, -3] }}
        transition={{ duration: 0.5, repeat: Infinity }}
      >
        <svg width="24" height="46" viewBox="0 0 24 46" fill="none">
          <circle cx="12" cy="7" r="6" fill="#FDDBB4" />
          <rect x="7" y="2" width="10" height="4" rx="2" fill="#744210" />
          <circle cx="9.5" cy="7" r="1" fill="#4a3728" />
          <circle cx="14.5" cy="7" r="1" fill="#4a3728" />
          <path d="M9 5.5 L10.5 6.5" stroke="#c53030" strokeWidth="1" />
          <path d="M15 5.5 L13.5 6.5" stroke="#c53030" strokeWidth="1" />
          <path d="M9.5 11 Q12 9.5 14.5 11" stroke="#c53030" strokeWidth="1.2" fill="none" />
          <rect x="4" y="14" width="16" height="16" rx="3" fill="#c53030" />
          <rect x="0" y="14" width="4" height="11" rx="2" fill="#c53030" />
          <rect x="20" y="14" width="4" height="11" rx="2" fill="#c53030" />
          <circle cx="2" cy="25" r="2" fill="#FDDBB4" />
          <circle cx="22" cy="25" r="2" fill="#FDDBB4" />
          <rect x="6" y="30" width="4" height="13" rx="2" fill="#2c5282" />
          <rect x="14" y="30" width="4" height="13" rx="2" fill="#2c5282" />
        </svg>
      </motion.div>
      <motion.div
        className="absolute bottom-[7.5rem] left-[14%] bg-red-500/90 text-white text-[7px] font-bold px-1.5 py-0.5 rounded-full"
        animate={{ opacity: [0, 1, 1, 0], y: [4, 0, 0, -6] }}
        transition={{ duration: 2.5, repeat: Infinity }}
      >
        Discordo!
      </motion.div>

      {/* Manager mediating — center */}
      <motion.div
        className="absolute bottom-[4.2rem] left-[44%]"
        animate={{ rotate: [0, 1.5, 0, -1.5, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <ManagerBody />
      </motion.div>
      <motion.div
        className="absolute bottom-[7.5rem] left-[40%] bg-teal-600/90 text-white text-[7px] font-bold px-1.5 py-0.5 rounded-full"
        animate={{ opacity: [0, 1, 1, 0], y: [4, 0, 0, -6] }}
        transition={{ duration: 2.5, repeat: Infinity, delay: 1.2 }}
      >
        Ouçam-se!
      </motion.div>

      {/* Conflict person B — also upset */}
      <motion.div
        className="absolute bottom-[4.2rem] left-[64%]"
        animate={{ x: [2, -2, 2], rotate: [3, -3, 3] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
      >
        <svg width="24" height="46" viewBox="0 0 24 46" fill="none">
          <circle cx="12" cy="7" r="6" fill="#c8906a" />
          <path d="M6 5 Q12 1 18 5" fill="#2d3748" />
          <circle cx="9.5" cy="7" r="1" fill="#4a3728" />
          <circle cx="14.5" cy="7" r="1" fill="#4a3728" />
          <path d="M9 5.5 L10.5 6.5" stroke="#c53030" strokeWidth="1" />
          <path d="M15 5.5 L13.5 6.5" stroke="#c53030" strokeWidth="1" />
          <path d="M9.5 11 Q12 9.5 14.5 11" stroke="#c53030" strokeWidth="1.2" fill="none" />
          <rect x="4" y="14" width="16" height="16" rx="3" fill="#2b6cb0" />
          <rect x="0" y="14" width="4" height="11" rx="2" fill="#2b6cb0" />
          <rect x="20" y="14" width="4" height="11" rx="2" fill="#2b6cb0" />
          <circle cx="2" cy="25" r="2" fill="#c8906a" />
          <circle cx="22" cy="25" r="2" fill="#c8906a" />
          <rect x="6" y="30" width="4" height="13" rx="2" fill="#1a202c" />
          <rect x="14" y="30" width="4" height="13" rx="2" fill="#1a202c" />
        </svg>
      </motion.div>
      <motion.div
        className="absolute bottom-[7.5rem] left-[62%] bg-orange-500/90 text-white text-[7px] font-bold px-1.5 py-0.5 rounded-full"
        animate={{ opacity: [0, 1, 1, 0], y: [4, 0, 0, -6] }}
        transition={{ duration: 2.5, repeat: Infinity, delay: 0.6 }}
      >
        É injusto!
      </motion.div>

      {/* Observer sitting */}
      <div className="absolute bottom-[4.2rem] left-[80%]">
        <svg width="22" height="40" viewBox="0 0 22 40" fill="none">
          <circle cx="11" cy="7" r="5.5" fill="#FDDBB4" />
          <circle cx="9.5" cy="7" r="0.8" fill="#4a3728" />
          <circle cx="12.5" cy="7" r="0.8" fill="#4a3728" />
          <rect x="4" y="13" width="14" height="14" rx="3" fill="#48bb78" />
          <rect x="0" y="13" width="4" height="10" rx="2" fill="#48bb78" />
          <rect x="18" y="13" width="4" height="10" rx="2" fill="#48bb78" />
          <rect x="6" y="27" width="10" height="10" rx="2" fill="#2c5282" />
        </svg>
      </div>

      {/* Tension sparks between the two */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute bottom-[6rem]"
          style={{ left: `${32 + i * 4}%` }}
          animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
          transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.15 }}
        >
          <span className="text-yellow-300 text-[10px]">⚡</span>
        </motion.div>
      ))}
    </div>
  );
}

// ─── CASE 003: A Meta de Qualidade (ICSACVC) ──────────────────────────────────
export function Case003Scene() {
  return (
    <div className="relative w-full h-56 overflow-hidden rounded-2xl select-none"
      style={{ background: "linear-gradient(to bottom, #0c1a2e 0%, #071020 100%)" }}>
      <Ceiling color="#0a1628" />
      <Floor color="#132240" tiles={10} />

      {/* Hospital bed with patient and CVC */}
      <div className="absolute bottom-12 left-[8%]">
        <svg width="100" height="56" viewBox="0 0 100 56" fill="none">
          <rect x="2" y="22" width="96" height="12" rx="2" fill="#2d3748" />
          <rect x="2" y="32" width="96" height="6" rx="1" fill="#1a202c" />
          <rect x="4" y="38" width="5" height="16" rx="1" fill="#4a5568" />
          <rect x="91" y="38" width="5" height="16" rx="1" fill="#4a5568" />
          <rect x="0" y="8" width="10" height="28" rx="2" fill="#4299e1" />
          <rect x="3" y="12" width="28" height="12" rx="3" fill="white" />
          <circle cx="17" cy="13" r="6" fill="#FDDBB4" />
          <circle cx="15.5" cy="12.5" r="0.8" fill="#4a3728" />
          <circle cx="18.5" cy="12.5" r="0.8" fill="#4a3728" />
          <rect x="10" y="22" width="80" height="11" rx="2" fill="#bee3f8" />
          {/* CVC line */}
          <path d="M5 14 Q20 18 30 22" stroke="#f6ad55" strokeWidth="1.5" fill="none" strokeDasharray="3 1" />
          <circle cx="5" cy="14" r="2" fill="#f6ad55" />
          <circle cx="10" cy="54" r="3" fill="#718096" />
          <circle cx="90" cy="54" r="3" fill="#718096" />
        </svg>
      </div>

      {/* IV pole */}
      <div className="absolute bottom-12 left-[35%]">
        <svg width="18" height="62" viewBox="0 0 18 62" fill="none">
          <rect x="8" y="8" width="2" height="50" fill="#a0aec0" />
          <circle cx="9" cy="8" r="5" fill="#e2e8f0" />
          <rect x="2" y="56" width="14" height="4" rx="1" fill="#718096" />
          <ellipse cx="9" cy="10" rx="6" ry="7" fill="#bee3f8" stroke="#90cdf4" strokeWidth="1" />
          <path d="M9 17 Q9 30 6 44" stroke="#bee3f8" strokeWidth="1" fill="none" strokeDasharray="2 1" />
        </svg>
      </div>

      {/* Infection rate chart — going UP */}
      <div className="absolute top-4 right-4 w-40 h-28 bg-slate-800/90 border border-slate-600/50 rounded-lg p-2">
        <div className="text-[7px] text-red-300 font-bold mb-1">ICSACVC — Taxa por 1000 cat/dia</div>
        <svg width="130" height="60" viewBox="0 0 130 60">
          {/* Grid */}
          {[0, 1, 2, 3].map((i) => (
            <line key={i} x1="10" y1={10 + i * 12} x2="125" y2={10 + i * 12}
              stroke="#4a5568" strokeWidth="0.5" strokeDasharray="3 2" />
          ))}
          {/* Target line */}
          <line x1="10" y1="46" x2="125" y2="46" stroke="#22c55e" strokeWidth="1" strokeDasharray="4 2" />
          <text x="115" y="44" fontSize="5" fill="#22c55e">2.1</text>
          {/* Actual line — going up */}
          <motion.path
            d="M10,46 L35,43 L60,38 L85,28 L110,14"
            stroke="#ef4444"
            strokeWidth="2"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
          />
          {/* Points */}
          {[[10, 46], [35, 43], [60, 38], [85, 28], [110, 14]].map(([x, y], i) => (
            <motion.circle key={i} cx={x} cy={y} r="2.5" fill="#ef4444"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
          <text x="100" y="12" fontSize="6" fill="#ef4444" fontWeight="bold">4.8</text>
          <text x="5" y="50" fontSize="5" fill="#a0aec0">meta</text>
        </svg>
        <motion.div
          className="text-[7px] text-red-400 font-bold text-center"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        >
          ↑ +128% acima da meta
        </motion.div>
      </div>

      {/* Nurse with auditoria clipboard */}
      <motion.div
        className="absolute bottom-12 left-[45%]"
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <NurseBody />
      </motion.div>
      <div className="absolute bottom-[5rem] left-[44%]">
        <div className="w-10 h-7 bg-white/90 border border-gray-400/50 rounded p-0.5 shadow">
          <div className="text-[5px] text-gray-600 font-bold">AUDIT.</div>
          <div className="h-0.5 bg-gray-300 rounded mb-0.5" />
          <div className="h-0.5 bg-red-400 rounded w-3/4" />
          <div className="h-0.5 bg-red-400 rounded w-1/2" />
        </div>
      </div>

      {/* Monitor blinking alert */}
      <motion.div
        className="absolute top-5 left-1/2 -translate-x-1/2"
        animate={{ scale: [1, 1.06, 1], opacity: [1, 0.7, 1] }}
        transition={{ duration: 0.7, repeat: Infinity }}
      >
        <div className="bg-red-500/80 text-white text-[9px] font-bold px-3 py-1 rounded-full">
          ⚠ INFECÇÃO — ICSACVC ELEVADA
        </div>
      </motion.div>
    </div>
  );
}

// ─── CASE 004: A Denúncia Anônima (noturno) ───────────────────────────────────
export function Case004Scene() {
  return (
    <div className="relative w-full h-56 overflow-hidden rounded-2xl select-none"
      style={{ background: "linear-gradient(to bottom, #0a0a1a 0%, #05050f 100%)" }}>
      {/* Stars */}
      {Array.from({ length: 15 }).map((_, i) => (
        <motion.div key={i} className="absolute w-0.5 h-0.5 rounded-full bg-white"
          style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 30}%` }}
          animate={{ opacity: [0.2, 0.8, 0.2] }}
          transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
        />
      ))}
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-slate-900" />
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="absolute bottom-0 h-12 border-r border-white/5" style={{ left: `${(i / 12) * 100}%` }} />
      ))}

      {/* Night — "NOTURNO" sign */}
      <div className="absolute top-4 right-4 bg-indigo-900/80 border border-indigo-500/50 rounded px-2 py-1">
        <div className="text-[9px] text-indigo-200 font-bold">🌙 PLANTÃO NOTURNO</div>
        <div className="text-[7px] text-indigo-300/70">02:30h</div>
      </div>

      {/* Sleeping technician in chair — left area */}
      <motion.div
        className="absolute bottom-12 left-[15%]"
        animate={{ y: [0, 1, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg width="36" height="50" viewBox="0 0 36 50" fill="none">
          {/* Chair */}
          <rect x="5" y="26" width="26" height="20" rx="2" fill="#4a5568" />
          <rect x="0" y="26" width="5" height="16" rx="2" fill="#718096" />
          <rect x="31" y="26" width="5" height="16" rx="2" fill="#718096" />
          {/* Person slumped */}
          <circle cx="18" cy="14" r="6.5" fill="#FDDBB4" />
          <rect x="14" y="8" width="8" height="4" rx="1" fill="white" />
          {/* Closed eyes (sleeping) */}
          <path d="M14 14 Q15.5 15 17 14" stroke="#4a3728" strokeWidth="1.2" fill="none" />
          <path d="M19 14 Q20.5 15 22 14" stroke="#4a3728" strokeWidth="1.2" fill="none" />
          {/* Body slumped forward */}
          <rect x="10" y="20" width="16" height="14" rx="3" fill="white" />
          <rect x="6" y="20" width="4" height="10" rx="2" fill="white" />
          <rect x="26" y="20" width="4" height="10" rx="2" fill="white" />
          {/* Legs */}
          <rect x="12" y="34" width="5" height="10" rx="2" fill="#2c5282" />
          <rect x="19" y="34" width="5" height="10" rx="2" fill="#2c5282" />
        </svg>
      </motion.div>

      {/* ZZZ bubbles */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute text-white/70 font-bold"
          style={{ left: `${22 + i * 4}%`, bottom: `${7 + i * 1.5}rem`, fontSize: `${8 + i * 2}px` }}
          animate={{ opacity: [0, 0.8, 0], y: [0, -12, -20], scale: [0.8, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.7 }}
        >
          Z
        </motion.div>
      ))}

      {/* Caixa de sugestões */}
      <div className="absolute bottom-12 left-[38%]">
        <div className="w-12 h-10 bg-amber-800/80 border border-amber-600/50 rounded relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-1.5 bg-amber-600/80 rounded" />
          <div className="text-[5px] text-amber-200/80 font-bold text-center mt-3">CAIXA<br/>SUGEST.</div>
          <motion.div
            className="absolute -top-3 -right-2 text-[9px]"
            animate={{ rotate: [-5, 5, -5], y: [0, -2, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            📩
          </motion.div>
        </div>
      </div>

      {/* Manager watching from doorway */}
      <motion.div
        className="absolute bottom-12 right-[18%]"
        animate={{ x: [0, 2, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <ManagerBody />
      </motion.div>

      {/* Manager's thought bubble */}
      <motion.div
        className="absolute bottom-[8rem] right-[14%] bg-slate-800/90 border border-slate-600/50 rounded-full px-2 py-1"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <span className="text-[8px] text-white/80">🔍 Observando...</span>
      </motion.div>

      {/* Door frame on right */}
      <div className="absolute bottom-0 right-[12%] w-12 h-32">
        <div className="absolute left-0 top-0 w-1.5 h-full bg-amber-800/60" />
        <div className="absolute right-0 top-0 w-1.5 h-full bg-amber-800/60" />
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-800/60" />
      </div>

      {/* Moon */}
      <div className="absolute top-3 left-6 text-2xl">🌙</div>
    </div>
  );
}

// ─── CASE 005: O Orçamento em Xeque ──────────────────────────────────────────
export function Case005Scene() {
  return (
    <div className="relative w-full h-56 overflow-hidden rounded-2xl select-none"
      style={{ background: "linear-gradient(to bottom, #1a120a 0%, #0f0a05 100%)" }}>
      <Ceiling color="#1a120a" />
      <Floor color="#1a0f06" tiles={10} />

      {/* Office desk */}
      <div className="absolute bottom-12 left-[20%] w-72 h-4 bg-amber-800/70 rounded border border-amber-700/50" />
      <div className="absolute bottom-[3.5rem] left-[40%] w-2 h-12 bg-amber-900/60" />
      <div className="absolute bottom-[3.5rem] left-[78%] w-2 h-12 bg-amber-900/60" />

      {/* Budget chart on wall */}
      <div className="absolute top-4 left-5 w-40 h-28 bg-white/92 rounded-lg border-2 border-gray-400/50 p-2">
        <div className="text-[7px] text-gray-700 font-bold mb-1">ORÇAMENTO — INSUMOS</div>
        <svg width="128" height="60" viewBox="0 0 128 60">
          {/* Y axis */}
          <line x1="15" y1="5" x2="15" y2="50" stroke="#e2e8f0" strokeWidth="1" />
          <line x1="15" y1="50" x2="125" y2="50" stroke="#e2e8f0" strokeWidth="1" />
          {/* Budget bar (planned) */}
          <rect x="25" y="20" width="22" height="30" fill="#3182ce" rx="1" />
          <text x="36" y="18" textAnchor="middle" fontSize="6" fill="#3182ce">100%</text>
          <text x="36" y="57" textAnchor="middle" fontSize="5" fill="#718096">Prev.</text>
          {/* Actual bar (overspent) */}
          <motion.rect x="60" width="22" fill="#ef4444" rx="1"
            initial={{ height: 0, y: 50 }}
            animate={{ height: 38, y: 12 }}
            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1, repeatType: "reverse" }}
          />
          <motion.text x="71" textAnchor="middle" fontSize="6" fill="#ef4444" fontWeight="bold"
            animate={{ opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
          >
            <tspan dy="-14" y="12">128%</tspan>
          </motion.text>
          <text x="71" y="57" textAnchor="middle" fontSize="5" fill="#718096">Real</text>
          {/* Overshoot indicator */}
          <motion.line x1="15" y1="20" x2="125" y2="20" stroke="#3182ce" strokeWidth="0.8" strokeDasharray="3 2"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </svg>
        <motion.div
          className="text-[7px] text-red-600 font-bold text-center"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        >
          ↑ 28% acima do previsto
        </motion.div>
      </div>

      {/* Flying coins / money */}
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          className="absolute text-yellow-400 text-sm"
          style={{ left: `${30 + i * 8}%`, bottom: "40%" }}
          animate={{
            y: [0, -30, -60],
            x: [0, (i % 2 === 0 ? 10 : -10)],
            opacity: [0, 1, 0],
            rotate: [0, 180, 360],
          }}
          transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.35 }}
        >
          💸
        </motion.div>
      ))}

      {/* Manager at desk with laptop */}
      <motion.div
        className="absolute bottom-[4rem] left-[48%]"
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <ManagerBody />
      </motion.div>

      {/* Laptop on desk */}
      <div className="absolute bottom-[4.8rem] left-[43%]">
        <svg width="30" height="22" viewBox="0 0 30 22" fill="none">
          <rect x="3" y="2" width="24" height="16" rx="1" fill="#1a202c" />
          <rect x="4" y="3" width="22" height="14" rx="0.5" fill="#0d1117" />
          <path d="M3 14 L0 22 L30 22 L27 14" fill="#2d3748" />
          {/* Screen showing red chart */}
          <path d="M5 13 L9 11 L13 8 L17 5" stroke="#ef4444" strokeWidth="1" fill="none" />
          <text x="16" y="8" fontSize="4" fill="#ef4444">↑!</text>
        </svg>
      </div>

      {/* Finance director coming */}
      <motion.div
        className="absolute bottom-12 right-[15%]"
        animate={{ x: [30, 0] }}
        transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
      >
        <svg width="24" height="46" viewBox="0 0 24 46" fill="none">
          <circle cx="12" cy="7" r="6" fill="#FDDBB4" />
          <path d="M6 3 Q12 -1 18 3" fill="#374151" />
          <circle cx="9.5" cy="7" r="0.9" fill="#4a3728" />
          <circle cx="14.5" cy="7" r="0.9" fill="#4a3728" />
          <rect x="4" y="14" width="16" height="16" rx="3" fill="#374151" />
          <rect x="0" y="14" width="4" height="11" rx="2" fill="#374151" />
          <rect x="20" y="14" width="4" height="11" rx="2" fill="#374151" />
          <circle cx="2" cy="25" r="2" fill="#FDDBB4" />
          <circle cx="22" cy="25" r="2" fill="#FDDBB4" />
          <rect x="6" y="30" width="4" height="13" rx="2" fill="#1f2937" />
          <rect x="14" y="30" width="4" height="13" rx="2" fill="#1f2937" />
        </svg>
      </motion.div>

      <motion.div
        className="absolute bottom-[7.5rem] right-[13%] bg-amber-600/90 text-white text-[7px] font-bold px-1.5 py-0.5 rounded"
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        Reunião urgente!
      </motion.div>

      {/* Surge icon */}
      <div className="absolute top-4 right-4 bg-red-900/50 border border-red-500/50 rounded p-1.5">
        <div className="text-red-300 text-[9px] font-bold">📈 Surto × 2</div>
        <div className="text-red-300/70 text-[7px]">Ocupação: 96%</div>
      </div>
    </div>
  );
}

// ─── CASE 006: A Nova Protocolo (prevenção de quedas) ─────────────────────────
export function Case006Scene() {
  return (
    <div className="relative w-full h-56 overflow-hidden rounded-2xl select-none"
      style={{ background: "linear-gradient(to bottom, #1e1b4b 0%, #0f0e2b 100%)" }}>
      <Ceiling color="#1e1b4b" />
      <Floor color="#1a1940" tiles={10} />

      {/* Classroom setup */}
      {/* Screen/projector at front */}
      <div className="absolute top-4 left-8 w-44 h-26 bg-white/90 border-2 border-indigo-400/50 rounded-lg p-2">
        <div className="bg-indigo-600 text-white text-[7px] font-bold text-center py-0.5 rounded mb-1">
          ESCALA DE MORSE — RISCO DE QUEDAS
        </div>
        {[
          { label: "Histórico de quedas", score: "25" },
          { label: "Diagnóstico sec.", score: "15" },
          { label: "Auxílio deamb.", score: "15" },
          { label: "Medicação IV", score: "20" },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-1 mb-0.5">
            <span className="text-[5px] text-gray-600 flex-1">{item.label}</span>
            <span className="text-[5px] text-indigo-600 font-bold">{item.score}</span>
          </div>
        ))}
        <div className="mt-1 border-t border-gray-200/50 pt-0.5">
          <div className="text-[5px] text-red-600 font-bold">≥45: ALTO RISCO → Sinalizar leito</div>
        </div>
      </div>

      {/* Presenter (manager) with pointer */}
      <motion.div
        className="absolute bottom-12 left-[50%]"
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <ManagerBody />
      </motion.div>

      {/* Pointer arm */}
      <motion.div
        className="absolute bottom-[5.5rem] left-[47%]"
        animate={{ rotate: [-5, 5, -5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <svg width="30" height="6" viewBox="0 0 30 6" fill="none">
          <rect x="0" y="2" width="28" height="2" rx="1" fill="#d69e2e" />
          <polygon points="28,0 30,3 28,6" fill="#d69e2e" />
        </svg>
      </motion.div>

      {/* Team members attending */}
      {[62, 72, 82].map((pct, i) => (
        <motion.div
          key={i}
          className="absolute bottom-12"
          style={{ left: `${pct}%` }}
          animate={{ y: [0, -1, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
        >
          <NurseBody skin={i === 1 ? "#c8906a" : "#FDDBB4"} />
        </motion.div>
      ))}

      {/* Fall warning bed sign */}
      <motion.div
        className="absolute bottom-12 left-[32%]"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <div className="w-10 h-12 bg-yellow-400/20 border-2 border-yellow-400/70 rounded flex flex-col items-center justify-center gap-1">
          <span className="text-lg">🟡</span>
          <div className="text-[5px] text-yellow-300 font-bold text-center">RISCO<br/>QUEDA</div>
        </div>
      </motion.div>

      {/* Calendar showing weekend */}
      <div className="absolute top-4 right-4 w-28 h-20 bg-white/90 border-2 border-indigo-300/50 rounded p-1.5">
        <div className="bg-indigo-600 text-white text-[6px] font-bold text-center py-0.5 rounded mb-1">
          IMPLEMENTAR: SEG
        </div>
        <div className="grid grid-cols-7 gap-px text-[5px] text-center">
          {["D","S","T","Q","Q","S","S"].map((d, i) => (
            <div key={i} className={i === 5 || i === 6 ? "text-red-500 font-bold" : "text-gray-500"}>{d}</div>
          ))}
          {[5, 6, 7, 8, 9, 10, 11].map((d) => (
            <motion.div key={d}
              className={`rounded-sm ${d === 8 ? "bg-indigo-500 text-white" : d === 10 || d === 11 ? "bg-orange-400/80 text-white" : "text-gray-600"}`}
              animate={d === 8 ? { scale: [1, 1.15, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
            >{d}</motion.div>
          ))}
        </div>
        <div className="mt-1 text-[5px] text-orange-600 font-bold text-center">✓ TREINAR NO FDS</div>
      </div>

      {/* Notification */}
      <motion.div
        className="absolute bottom-4 right-4"
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
      >
        <div className="bg-orange-500/20 border border-orange-400/40 rounded px-2 py-0.5 text-[8px] text-orange-300 font-medium">
          📅 Prazo: 4 dias
        </div>
      </motion.div>
    </div>
  );
}

// ─── CASE 007: A Avaliação de Desempenho ─────────────────────────────────────
export function Case007Scene() {
  return (
    <div className="relative w-full h-56 overflow-hidden rounded-2xl select-none"
      style={{ background: "linear-gradient(to bottom, #1a1a2e 0%, #0f0f1a 100%)" }}>
      <Ceiling color="#1a1a2e" />
      <Floor color="#15152a" tiles={8} />

      {/* Office table */}
      <div className="absolute bottom-12 left-[28%] w-48 h-4 bg-amber-900/70 rounded border border-amber-700/50" />
      <div className="absolute bottom-[3.5rem] left-[46%] w-2 h-12 bg-amber-900/60" />
      <div className="absolute bottom-[3.5rem] left-[70%] w-2 h-12 bg-amber-900/60" />

      {/* Performance evaluation form on table */}
      <div className="absolute bottom-[4.8rem] left-[35%] w-20 h-14 bg-white/90 border border-gray-400/50 rounded p-1 shadow">
        <div className="text-[5.5px] font-bold text-gray-700 text-center mb-0.5">AVALIAÇÃO 2024</div>
        {[
          { label: "Técnica", score: 9.2, color: "bg-emerald-500" },
          { label: "Comunicação", score: 4.1, color: "bg-red-500" },
          { label: "Coleguismo", score: 6.8, color: "bg-yellow-500" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-0.5 mb-0.5">
            <span className="text-[4.5px] text-gray-500 w-12">{item.label}</span>
            <div className="flex-1 bg-gray-200 rounded-full h-1">
              <div className={`${item.color} h-full rounded-full`} style={{ width: `${item.score * 10}%` }} />
            </div>
            <span className="text-[4px] text-gray-600 w-4 text-right">{item.score}</span>
          </div>
        ))}
        <div className="text-[4.5px] text-red-600 font-bold mt-0.5">⚠ 3 queixas formais</div>
      </div>

      {/* Manager evaluating */}
      <motion.div
        className="absolute bottom-[4.2rem] left-[30%]"
        animate={{ rotate: [0, 1, 0, -1, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <ManagerBody />
      </motion.div>

      {/* Nurse being evaluated — nervous */}
      <motion.div
        className="absolute bottom-[4.2rem] left-[60%]"
        animate={{ y: [0, -1, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <svg width="26" height="50" viewBox="0 0 26 50" fill="none">
          <circle cx="13" cy="8" r="6.5" fill="#FDDBB4" />
          <rect x="8" y="2" width="10" height="5" rx="1" fill="white" />
          <rect x="11" y="0.5" width="4" height="3" rx="1" fill="white" />
          <rect x="11.5" y="1" width="3" height="2" fill="#e53e3e" rx="0.5" />
          <circle cx="10.5" cy="8" r="1" fill="#4a3728" />
          <circle cx="15.5" cy="8" r="1" fill="#4a3728" />
          {/* Worried brow */}
          <path d="M9 6 L11 7" stroke="#c05621" strokeWidth="0.8" />
          <path d="M15 7 L17 6" stroke="#c05621" strokeWidth="0.8" />
          {/* Nervous smile (straight line) */}
          <line x1="10.5" y1="11" x2="15.5" y2="11" stroke="#c05621" strokeWidth="0.9" />
          <rect x="5" y="16" width="16" height="16" rx="3" fill="white" />
          <rect x="1" y="16" width="4" height="11" rx="2" fill="white" />
          <rect x="21" y="16" width="4" height="11" rx="2" fill="white" />
          <circle cx="3" cy="27" r="2.5" fill="#FDDBB4" />
          <circle cx="23" cy="27" r="2.5" fill="#FDDBB4" />
          <rect x="7" y="32" width="5" height="15" rx="2" fill="#3182ce" />
          <rect x="14" y="32" width="5" height="15" rx="2" fill="#3182ce" />
        </svg>
      </motion.div>

      {/* Question marks above nurse's head */}
      {["?", "?"].map((q, i) => (
        <motion.div key={i}
          className="absolute text-white/50 font-bold text-sm"
          style={{ left: `${64 + i * 3}%`, bottom: "9rem" }}
          animate={{ opacity: [0, 0.7, 0], y: [0, -8, -15] }}
          transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.6 }}
        >{q}</motion.div>
      ))}

      {/* Excellent badges */}
      <div className="absolute top-4 left-6 bg-emerald-800/50 border border-emerald-500/40 rounded p-1.5">
        <div className="text-[7px] text-emerald-300 font-bold">👍 Pontos Fortes</div>
        <div className="text-[6px] text-emerald-200/70">Técnica excelente</div>
        <div className="text-[6px] text-emerald-200/70">Dedicação alta</div>
      </div>

      <div className="absolute top-4 right-6 bg-red-900/50 border border-red-500/40 rounded p-1.5">
        <div className="text-[7px] text-red-300 font-bold">⚠ Para Desenvolver</div>
        <div className="text-[6px] text-red-200/70">Comunicação</div>
        <div className="text-[6px] text-red-200/70">3 queixas formais</div>
      </div>

      {/* Development plan */}
      <motion.div
        className="absolute bottom-4 left-1/2 -translate-x-1/2"
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="bg-indigo-700/50 border border-indigo-500/40 rounded px-3 py-1 text-[8px] text-indigo-200 font-medium">
          📋 Construindo Plano de Desenvolvimento
        </div>
      </motion.div>
    </div>
  );
}

// ─── CASE 008: A Sobrecarga do Plantão ───────────────────────────────────────
export function Case008Scene() {
  return (
    <div className="relative w-full h-56 overflow-hidden rounded-2xl select-none"
      style={{ background: "linear-gradient(to bottom, #1c1010 0%, #110808 100%)" }}>
      <Ceiling color="#1c1010" />
      <Floor color="#1a0f0f" tiles={10} />

      {/* Meeting table */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-80 h-5 bg-gradient-to-b from-stone-700 to-stone-800 rounded-xl border border-stone-600/50" />
      <div className="absolute bottom-[3.4rem] left-1/2 -translate-x-1/2 w-2 h-12 bg-stone-800/70" />

      {/* Team members around table — all exhausted */}
      {[15, 28, 42, 58, 72, 84].map((pct, i) => (
        <motion.div
          key={i}
          className="absolute bottom-[4.2rem]"
          style={{ left: `${pct}%` }}
          animate={{ y: [0, -1, 0] }}
          transition={{ duration: 2 + i * 0.3, repeat: Infinity, delay: i * 0.2 }}
        >
          <ExhaustedNurse skin={i % 3 === 0 ? "#c8906a" : "#FDDBB4"} />
        </motion.div>
      ))}

      {/* One person speaking up (standing) */}
      <motion.div
        className="absolute bottom-[4.2rem] left-[40%]"
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <svg width="26" height="52" viewBox="0 0 26 52" fill="none">
          <circle cx="13" cy="8" r="6.5" fill="#FDDBB4" />
          <rect x="8" y="2" width="10" height="5" rx="1" fill="white" />
          <rect x="11" y="0.5" width="4" height="3" rx="1" fill="white" />
          <rect x="11.5" y="1" width="3" height="2" fill="#e53e3e" rx="0.5" />
          <circle cx="10.5" cy="8" r="1.2" fill="#4a3728" />
          <circle cx="15.5" cy="8" r="1.2" fill="#4a3728" />
          <path d="M10 12 Q13 13.5 16 12" stroke="#c05621" strokeWidth="1.2" fill="none" />
          <rect x="5" y="16" width="16" height="16" rx="3" fill="white" />
          {/* Arm raised */}
          <rect x="21" y="10" width="4" height="14" rx="2" fill="white" style={{ transform: "rotate(-30deg)", transformOrigin: "21px 10px" }} />
          <circle cx="24" cy="10" r="2.5" fill="#FDDBB4" />
          <rect x="1" y="16" width="4" height="11" rx="2" fill="white" />
          <circle cx="3" cy="27" r="2.5" fill="#FDDBB4" />
          <rect x="7" y="32" width="5" height="17" rx="2" fill="#3182ce" />
          <rect x="14" y="32" width="5" height="17" rx="2" fill="#3182ce" />
        </svg>
      </motion.div>

      {/* Speech from speaker */}
      <motion.div
        className="absolute bottom-[9rem] left-[36%] bg-orange-700/90 border border-orange-400/50 text-white text-[7px] font-medium px-2 py-1 rounded-xl max-w-[120px]"
        animate={{ opacity: [0, 1, 1, 0], scale: [0.9, 1, 1, 0.9] }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        "Estamos sobrecarregados e esgotados!"
      </motion.div>

      {/* Burden indicators */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute text-base"
          style={{ left: `${18 + i * 25}%`, bottom: "10rem" }}
          animate={{ opacity: [0.3, 0.8, 0.3], y: [0, -4, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.6 }}
        >
          😩
        </motion.div>
      ))}

      {/* Manager listening */}
      <motion.div
        className="absolute bottom-[4.2rem] left-[8%]"
        animate={{ rotate: [0, 1, 0, -1, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <ManagerBody />
      </motion.div>

      {/* Data proposal */}
      <div className="absolute top-4 right-4 w-36 h-20 bg-slate-800/80 border border-slate-600/40 rounded-lg p-2">
        <div className="text-[7px] text-slate-300 font-bold mb-1">📊 Dados para Diretoria</div>
        <div className="text-[5.5px] text-slate-400 leading-tight">
          • Quadro: -2 profissionais<br />
          • Sem reposição: 4 meses<br />
          • Risco: alta rotatividade<br />
          • Solução: negociação
        </div>
        <motion.div
          className="mt-1 text-[6px] text-emerald-400 font-bold"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          → Advocacy técnico
        </motion.div>
      </div>

      {/* Reduction notice */}
      <div className="absolute top-4 left-4 bg-red-900/50 border border-red-500/40 rounded p-1.5">
        <div className="text-[7px] text-red-300 font-bold">⚠ Reestruturação</div>
        <div className="text-[6px] text-red-200/70">-2 prof. sem reposição</div>
        <div className="text-[6px] text-red-200/70">4 meses sem mudança</div>
      </div>
    </div>
  );
}

// ─── CASE 009: O Erro de Medicação ───────────────────────────────────────────
export function Case009Scene() {
  return (
    <div className="relative w-full h-56 overflow-hidden rounded-2xl select-none"
      style={{ background: "linear-gradient(to bottom, #0c1a2e 0%, #071020 100%)" }}>
      <Ceiling color="#0a1628" />
      <Floor color="#132240" tiles={10} />

      {/* Hospital bed */}
      <div className="absolute bottom-12 left-[5%]">
        <svg width="110" height="60" viewBox="0 0 110 60" fill="none">
          <rect x="2" y="22" width="106" height="12" rx="2" fill="#2d3748" />
          <rect x="2" y="32" width="106" height="6" rx="1" fill="#1a202c" />
          <rect x="4" y="38" width="5" height="18" rx="1" fill="#4a5568" />
          <rect x="101" y="38" width="5" height="18" rx="1" fill="#4a5568" />
          <rect x="0" y="8" width="10" height="28" rx="2" fill="#4299e1" />
          <rect x="3" y="12" width="28" height="12" rx="3" fill="white" />
          {/* Patient head - sleepy */}
          <circle cx="17" cy="13" r="6" fill="#FDDBB4" />
          <path d="M14 13 Q15.5 14 17 13" stroke="#4a3728" strokeWidth="1" fill="none" />
          <path d="M18 13 Q19.5 14 21 13" stroke="#4a3728" strokeWidth="1" fill="none" />
          {/* Groggy eyes */}
          <line x1="14" y1="11.5" x2="16" y2="11.5" stroke="#4a3728" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="18.5" y1="11.5" x2="20.5" y2="11.5" stroke="#4a3728" strokeWidth="1.2" strokeLinecap="round" />
          <rect x="10" y="22" width="90" height="11" rx="2" fill="#bee3f8" />
          <circle cx="8" cy="56" r="4" fill="#718096" />
          <circle cx="102" cy="56" r="4" fill="#718096" />
        </svg>
      </div>

      {/* Monitor */}
      <div className="absolute bottom-[7rem] left-[35%]">
        <motion.div animate={{ opacity: [1, 0.7, 1] }} transition={{ duration: 0.5, repeat: Infinity }}>
          <svg width="44" height="36" viewBox="0 0 44 36" fill="none">
            <rect x="2" y="2" width="40" height="26" rx="2" fill="#1a202c" stroke="#4a5568" strokeWidth="1" />
            <rect x="4" y="4" width="36" height="22" rx="1" fill="#0d1117" />
            <path d="M5 15 L12 15 L14 8 L17 22 L19 15 L26 15 L28 8 L31 22 L33 15 L39 15" stroke="#22c55e" strokeWidth="1.5" fill="none" />
            <text x="6" y="10" fill="#22c55e" fontSize="5" fontFamily="monospace">SpO2: 94%</text>
            <rect x="16" y="28" width="12" height="4" rx="1" fill="#4a5568" />
            <rect x="20" y="32" width="4" height="4" rx="0.5" fill="#4a5568" />
          </svg>
        </motion.div>
      </div>

      {/* Medication cart with WRONG dose highlighted */}
      <motion.div
        className="absolute bottom-12 left-[38%]"
        animate={{ rotate: [-2, 2, -2] }}
        transition={{ duration: 0.3, repeat: Infinity }}
      >
        <svg width="36" height="46" viewBox="0 0 36 46" fill="none">
          <rect x="2" y="4" width="32" height="32" rx="2" fill="#e2e8f0" stroke="#ef4444" strokeWidth="2" />
          <rect x="2" y="4" width="32" height="10" rx="2" fill="#ef4444" />
          <text x="18" y="12" textAnchor="middle" fill="white" fontSize="6" fontWeight="bold">MORFINA</text>
          <rect x="5" y="18" width="26" height="2" rx="1" fill="#a0aec0" />
          <rect x="5" y="24" width="26" height="2" rx="1" fill="#a0aec0" />
          <text x="18" y="22" textAnchor="middle" fill="#ef4444" fontSize="7" fontWeight="bold">10mg ✗</text>
          <text x="18" y="32" textAnchor="middle" fill="#48bb78" fontSize="6">Correto: 2mg</text>
          <circle cx="8" cy="42" r="4" fill="#718096" />
          <circle cx="28" cy="42" r="4" fill="#718096" />
        </svg>
      </motion.div>

      {/* Shocked nurse */}
      <motion.div
        className="absolute bottom-12 left-[52%]"
        animate={{ x: [-3, 3, -3] }}
        transition={{ duration: 0.2, repeat: Infinity, repeatType: "reverse" }}
      >
        <svg width="26" height="50" viewBox="0 0 26 50" fill="none">
          <circle cx="13" cy="8" r="6.5" fill="#FDDBB4" />
          <rect x="8" y="2" width="10" height="5" rx="1" fill="white" />
          <rect x="11" y="0.5" width="4" height="3" rx="1" fill="white" />
          <rect x="11.5" y="1" width="3" height="2" fill="#e53e3e" rx="0.5" />
          {/* Shocked O mouth */}
          <circle cx="13" cy="11.5" r="2" fill="#e53e3e" />
          {/* Wide eyes */}
          <circle cx="10" cy="7.5" r="1.8" fill="white" />
          <circle cx="16" cy="7.5" r="1.8" fill="white" />
          <circle cx="10" cy="7.5" r="1" fill="#4a3728" />
          <circle cx="16" cy="7.5" r="1" fill="#4a3728" />
          <rect x="5" y="16" width="16" height="16" rx="3" fill="white" />
          <rect x="1" y="16" width="4" height="11" rx="2" fill="white" />
          {/* Hands to face */}
          <rect x="21" y="12" width="4" height="8" rx="2" fill="white" style={{ transform: "rotate(-40deg)", transformOrigin: "21px 16px" }} />
          <circle cx="24" cy="12" r="2.5" fill="#FDDBB4" />
          <circle cx="3" cy="27" r="2.5" fill="#FDDBB4" />
          <rect x="7" y="32" width="5" height="15" rx="2" fill="#3182ce" />
          <rect x="14" y="32" width="5" height="15" rx="2" fill="#3182ce" />
        </svg>
      </motion.div>

      {/* Alarm */}
      <motion.div
        className="absolute top-5 left-1/2 -translate-x-1/2"
        animate={{ scale: [1, 1.08, 1], opacity: [1, 0.7, 1] }}
        transition={{ duration: 0.5, repeat: Infinity }}
      >
        <div className="bg-red-600/90 text-white text-[9px] font-bold px-3 py-1 rounded-full border border-red-300/50">
          🚨 ERRO DE MEDICAÇÃO — MORFINA 10mg (Prev. 2mg)
        </div>
      </motion.div>

      {/* Family member in corridor */}
      <motion.div
        className="absolute bottom-12 right-[8%]"
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <svg width="22" height="44" viewBox="0 0 22 44" fill="none">
          <circle cx="11" cy="7" r="5.5" fill="#c8906a" />
          <path d="M5 3 Q11 -1 17 3" fill="#92400e" />
          <circle cx="9.5" cy="7" r="0.8" fill="#4a3728" />
          <circle cx="12.5" cy="7" r="0.8" fill="#4a3728" />
          <path d="M9 11 Q11 10 13 11" stroke="#c05621" strokeWidth="0.8" fill="none" />
          <rect x="4" y="13" width="14" height="13" rx="3" fill="#6b46c1" />
          <rect x="0" y="13" width="4" height="9" rx="2" fill="#6b46c1" />
          <rect x="18" y="13" width="4" height="9" rx="2" fill="#6b46c1" />
          <rect x="6" y="26" width="4" height="13" rx="2" fill="#4a3728" />
          <rect x="12" y="26" width="4" height="13" rx="2" fill="#4a3728" />
        </svg>
      </motion.div>
      <div className="absolute bottom-[7.5rem] right-[6%] bg-purple-900/70 border border-purple-500/40 rounded px-1.5 py-0.5 text-[7px] text-purple-200">
        Familiar no corredor
      </div>

      {/* Notification form */}
      <motion.div
        className="absolute top-4 right-4 w-28 bg-blue-900/60 border border-blue-500/40 rounded p-1.5"
        animate={{ scale: [1, 1.03, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="text-[6px] text-blue-300 font-bold">📋 Notificar Incidente</div>
        <div className="text-[5.5px] text-blue-200/70 mt-0.5">• Notificar sistema</div>
        <div className="text-[5.5px] text-blue-200/70">• Apoiar profissional</div>
        <div className="text-[5.5px] text-blue-200/70">• Análise de processo</div>
      </motion.div>
    </div>
  );
}

// ─── CASE 010: Educação Continuada ───────────────────────────────────────────
export function Case010Scene() {
  return (
    <div className="relative w-full h-56 overflow-hidden rounded-2xl select-none"
      style={{ background: "linear-gradient(to bottom, #0c1f0c 0%, #071507 100%)" }}>
      <Ceiling color="#0c1f0c" />
      <Floor color="#0a1a0a" tiles={10} />

      {/* Budget board */}
      <div className="absolute top-4 left-5 w-44 h-30 bg-white/92 border-2 border-emerald-400/50 rounded-lg p-2">
        <div className="bg-emerald-700 text-white text-[7px] font-bold text-center py-0.5 rounded mb-1">
          ORÇAMENTO: R$ 5.000 / semestre
        </div>
        {[
          { name: "🌿 Cuidados Paliativos", cost: 1800, priority: "alta", chosen: true },
          { name: "⚙ Ventilação Mecânica", cost: 2200, priority: "urgente", chosen: true },
          { name: "🏛 Congresso Enf.", cost: 5600, priority: "baixa", chosen: false },
        ].map((item) => (
          <div key={item.name} className={`mb-1 p-0.5 rounded border ${item.chosen ? "bg-emerald-100/80 border-emerald-400/50" : "bg-red-50/80 border-red-400/30 opacity-70"}`}>
            <div className="flex items-center gap-1">
              <span className="text-[5.5px] flex-1 font-medium text-gray-700">{item.name}</span>
              <span className={`text-[4.5px] px-0.5 rounded font-bold ${item.priority === "urgente" ? "bg-red-500 text-white" : item.priority === "alta" ? "bg-orange-400 text-white" : "bg-gray-400 text-white"}`}>
                {item.priority}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[4.5px] text-gray-500">R$ {item.cost.toLocaleString()}</span>
              {item.chosen ? <span className="text-emerald-600 text-[5px] font-bold ml-auto">✓ Prioridade</span> : <span className="text-red-600 text-[5px] ml-auto">✗ Caro</span>}
            </div>
          </div>
        ))}
        <motion.div
          className="text-[6px] text-emerald-700 font-bold mt-0.5"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          💰 Total alocado: R$ 4.000 ✓
        </motion.div>
      </div>

      {/* Manager planning */}
      <motion.div
        className="absolute bottom-12 left-[52%]"
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <ManagerBody />
      </motion.div>

      {/* Team members */}
      {[62, 72, 80].map((pct, i) => (
        <motion.div key={i}
          className="absolute bottom-12"
          style={{ left: `${pct}%` }}
          animate={{ y: [0, -1, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.3 }}
        >
          <NurseBody skin={i === 1 ? "#c8906a" : "#FDDBB4"} />
        </motion.div>
      ))}

      {/* Ventilator alarm (urgency context) */}
      <motion.div
        className="absolute top-4 right-4 bg-red-900/60 border border-red-500/50 rounded p-1.5"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 0.8, repeat: Infinity }}
      >
        <div className="text-[7px] text-red-300 font-bold">⚠ Urgência</div>
        <div className="text-[5.5px] text-red-200/70">2 alarmes de ventilação</div>
        <div className="text-[5.5px] text-red-200/70">mal configurados</div>
      </motion.div>

      {/* Floating percentage */}
      <div className="absolute bottom-12 right-[14%]">
        <div className="bg-teal-800/50 border border-teal-500/40 rounded p-1.5 text-center">
          <div className="text-[6px] text-teal-300">70% da equipe</div>
          <div className="text-[5.5px] text-teal-200/70">quer paliativos</div>
        </div>
      </div>

      {/* Priority priority arrow */}
      <motion.div
        className="absolute bottom-5 left-1/2 -translate-x-1/2"
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="bg-emerald-700/40 border border-emerald-500/40 rounded px-3 py-1 text-[8px] text-emerald-300 font-medium">
          📚 Priorizar: Segurança + Perfil assistencial
        </div>
      </motion.div>
    </div>
  );
}
