import { motion } from "framer-motion";

export function EthicsScene() {
  return (
    <div className="relative w-full h-56 overflow-hidden rounded-2xl bg-gradient-to-b from-stone-900 to-slate-900 select-none">
      {/* Floor */}
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-stone-900" />
      <div className="absolute top-0 left-0 right-0 h-3 bg-stone-800" />

      {/* Bookcase left */}
      <div className="absolute top-4 left-2 w-20 h-36">
        <div className="w-full h-full bg-amber-900/60 border border-amber-800/50 rounded p-1 grid grid-cols-4 gap-0.5 content-start">
          {['bg-red-600','bg-blue-700','bg-green-700','bg-yellow-600','bg-purple-700','bg-red-800','bg-teal-700','bg-orange-700',
            'bg-blue-800','bg-pink-700','bg-red-700','bg-green-800','bg-yellow-700','bg-indigo-700','bg-teal-600','bg-amber-600'].map((c,i)=>(
            <div key={i} className={`${c} rounded-sm h-6 opacity-80`} />
          ))}
        </div>
      </div>

      {/* Scales of justice - animated */}
      <motion.div
        className="absolute top-8 left-1/2 -translate-x-1/2"
        animate={{ rotate: [0, 3, -3, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <JusticeScales />
      </motion.div>

      {/* Desk */}
      <div className="absolute bottom-12 left-[25%] right-[10%] h-5 bg-gradient-to-b from-amber-800 to-amber-900 rounded-t-lg border border-amber-700/50" />
      <div className="absolute bottom-0 left-[26%] w-3 h-12 bg-amber-900/70" />
      <div className="absolute bottom-0 right-[11%] w-3 h-12 bg-amber-900/70" />

      {/* Documents on desk */}
      <div className="absolute bottom-[4.5rem] left-[30%] flex gap-1.5">
        {[{r: -3}, {r: 2}, {r: -1}].map(({ r }, i) => (
          <div key={i} className="w-8 h-10 bg-white/85 rounded border border-gray-300/50" style={{ transform: `rotate(${r}deg)` }}>
            <div className="p-0.5 space-y-0.5">
              <div className="h-0.5 bg-gray-500/50 rounded" />
              <div className="h-0.5 bg-gray-500/50 rounded w-2/3" />
              <div className="h-0.5 bg-gray-500/50 rounded" />
              <div className="h-0.5 bg-gray-500/50 rounded w-3/4" />
            </div>
          </div>
        ))}
        <div className="w-6 h-8 bg-red-100/90 rounded border border-red-300/50" style={{ transform: 'rotate(4deg)' }}>
          <div className="p-0.5 text-[5px] text-red-600 font-bold">CONF.</div>
        </div>
      </div>

      {/* Manager at desk */}
      <motion.div
        className="absolute bottom-12 left-[52%]"
        animate={{ y: [0, -1, 0] }}
        transition={{ duration: 2.5, repeat: Infinity }}
      >
        <ManagerAtDesk />
      </motion.div>

      {/* Thinking bubble */}
      <motion.div
        className="absolute bottom-[9rem] left-[58%]"
        animate={{ opacity: [0, 1, 1, 0], scale: [0.8, 1, 1, 0.8] }}
        transition={{ duration: 5, repeat: Infinity }}
      >
        <div className="bg-white/90 border border-gray-300/50 rounded-2xl p-2 text-[8px] text-gray-700 font-medium max-w-[80px]">
          <div className="text-center">Ética ou punição?</div>
          <div className="text-center text-gray-400 mt-0.5">⚖️</div>
        </div>
      </motion.div>

      {/* Warning envelope */}
      <motion.div
        className="absolute top-6 right-6"
        animate={{ y: [0, -3, 0], rotate: [-2, 2, -2] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <div className="w-10 h-7 bg-amber-100/90 border border-amber-400/50 rounded relative">
          <div className="absolute inset-0 flex items-center justify-center text-[8px]">📨</div>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-[6px] text-white flex items-center justify-center font-bold">!</div>
        </div>
      </motion.div>

      {/* COREN plaque */}
      <div className="absolute top-6 right-24 bg-blue-900/50 border border-blue-500/30 rounded px-2 py-1">
        <div className="text-[7px] text-blue-300 font-bold">COREN</div>
        <div className="text-[6px] text-blue-400/60">Código de Ética</div>
      </div>
    </div>
  );
}

function JusticeScales() {
  return (
    <svg width="80" height="60" viewBox="0 0 80 60" fill="none">
      {/* Center post */}
      <rect x="38" y="10" width="4" height="35" fill="#d4a96a" />
      <circle cx="40" cy="10" r="4" fill="#d4a96a" />
      {/* Beam */}
      <rect x="10" y="18" width="60" height="3" rx="1.5" fill="#b7791f" />
      {/* Left chain */}
      <line x1="20" y1="21" x2="20" y2="35" stroke="#b7791f" strokeWidth="1.5" strokeDasharray="2 1" />
      {/* Right chain */}
      <line x1="60" y1="21" x2="60" y2="35" stroke="#b7791f" strokeWidth="1.5" strokeDasharray="2 1" />
      {/* Left pan */}
      <ellipse cx="20" cy="37" rx="10" ry="3" fill="#d4a96a" stroke="#b7791f" strokeWidth="1" />
      <rect x="11" y="34" width="18" height="3" rx="1" fill="#d4a96a" />
      {/* Right pan */}
      <ellipse cx="60" cy="37" rx="10" ry="3" fill="#d4a96a" stroke="#b7791f" strokeWidth="1" />
      <rect x="51" y="34" width="18" height="3" rx="1" fill="#d4a96a" />
      {/* Base */}
      <rect x="30" y="44" width="20" height="4" rx="2" fill="#b7791f" />
      <rect x="33" y="48" width="14" height="3" rx="1.5" fill="#92400e" />
      {/* Items on pans */}
      <circle cx="17" cy="33" r="2" fill="#f6e05e" />
      <circle cx="63" cy="31" r="2.5" fill="#fc8181" />
      <circle cx="63" cy="31" r="1.5" fill="#e53e3e" />
    </svg>
  );
}

function ManagerAtDesk() {
  return (
    <svg width="26" height="50" viewBox="0 0 26 50" fill="none">
      <circle cx="13" cy="7" r="6.5" fill="#FDDBB4" />
      <rect x="8" y="2" width="10" height="4" rx="2" fill="#1a202c" />
      <path d="M8 6 Q13 2 18 6" fill="#1a202c" />
      <circle cx="11" cy="7.5" r="1" fill="#4a3728" />
      <circle cx="15" cy="7.5" r="1" fill="#4a3728" />
      {/* Glasses */}
      <rect x="9" y="7" width="4" height="2.5" rx="1.25" stroke="#4a5568" strokeWidth="0.8" fill="none" />
      <rect x="13.5" y="7" width="4" height="2.5" rx="1.25" stroke="#4a5568" strokeWidth="0.8" fill="none" />
      <line x1="9" y1="8.25" x2="8" y2="8.25" stroke="#4a5568" strokeWidth="0.8" />
      <line x1="17.5" y1="8.25" x2="18.5" y2="8.25" stroke="#4a5568" strokeWidth="0.8" />
      <line x1="13" y1="8.25" x2="13.5" y2="8.25" stroke="#4a5568" strokeWidth="0.8" />
      {/* Suit */}
      <rect x="4" y="15" width="18" height="15" rx="3" fill="#1a365d" />
      <rect x="10" y="15" width="3" height="15" fill="#2a4a7f" />
      <rect x="13" y="15" width="3" height="15" fill="#2a4a7f" />
      <rect x="9.5" y="17" width="7" height="3" rx="0.5" fill="#c53030" />
      {/* Arms forward on desk */}
      <rect x="0" y="15" width="4" height="10" rx="2" fill="#1a365d" />
      <rect x="22" y="15" width="4" height="10" rx="2" fill="#1a365d" />
      <circle cx="2" cy="25" r="2.5" fill="#FDDBB4" />
      <circle cx="24" cy="25" r="2.5" fill="#FDDBB4" />
      {/* Legs (seated) */}
      <rect x="7" y="30" width="5" height="8" rx="2" fill="#1a202c" />
      <rect x="14" y="30" width="5" height="8" rx="2" fill="#1a202c" />
    </svg>
  );
}
