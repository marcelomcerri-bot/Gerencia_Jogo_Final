import { motion } from "framer-motion";

export function MeetingRoomScene() {
  return (
    <div className="relative w-full h-56 overflow-hidden rounded-2xl bg-gradient-to-b from-amber-950 to-stone-900 select-none">
      {/* Back wall */}
      <div className="absolute top-0 left-0 right-0 bottom-14 bg-gradient-to-b from-amber-900/40 to-stone-800/50" />
      {/* Floor */}
      <div className="absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-b from-amber-900/60 to-stone-950" />
      {/* Floor reflection lines */}
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="absolute bottom-0 h-14 border-r border-amber-700/10" style={{ left: `${i * 10}%`, width: "10%" }} />
      ))}
      {/* Window */}
      <div className="absolute top-6 right-8 w-20 h-14 bg-sky-300/20 border-2 border-amber-700/40 rounded">
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
          {[0,1,2,3].map(i => <div key={i} className="border border-amber-700/20" />)}
        </div>
        <motion.div
          className="absolute inset-0 bg-yellow-200/10"
          animate={{ opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      </div>

      {/* Whiteboard */}
      <div className="absolute top-4 left-8 w-28 h-20 bg-gray-100/90 border-2 border-gray-400/50 rounded">
        <div className="p-1.5">
          <div className="text-gray-400 text-[7px] font-bold mb-1">PLANEJAMENTO</div>
          <div className="space-y-1">
            <div className="h-0.5 bg-blue-400/60 rounded w-3/4" />
            <div className="h-0.5 bg-red-400/60 rounded w-1/2" />
            <div className="h-0.5 bg-green-400/60 rounded w-2/3" />
          </div>
          <div className="mt-2 text-[6px] text-gray-500">→ Meta: 98%</div>
        </div>
        <motion.div
          className="absolute bottom-0 right-0 w-2 h-2 bg-blue-400/80 rounded-sm"
          animate={{ x: [-2, 0, -2] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </div>

      {/* Table */}
      <div className="absolute bottom-14 left-1/2 -translate-x-1/2 w-64 h-5 bg-gradient-to-b from-amber-700 to-amber-900 rounded-lg border border-amber-600/50" />
      <div className="absolute bottom-14 left-1/2 -translate-x-1/2 w-56 h-2 bg-amber-600/30 rounded-lg" />

      {/* Table leg */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-14 bg-amber-800/60" />

      {/* Characters around table */}
      <div className="absolute bottom-[4.2rem] left-[20%]">
        <ConflictPersonA />
      </div>
      <motion.div
        className="absolute bottom-[4.2rem] left-[40%]"
        animate={{ rotate: [0, 2, 0, -2, 0] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
      >
        <ManagerCharacter />
      </motion.div>
      <div className="absolute bottom-[4.2rem] left-[60%]">
        <ConflictPersonB />
      </div>
      <div className="absolute bottom-[4.2rem] left-[76%]">
        <SittingPerson color="#48bb78" />
      </div>

      {/* Speech bubbles */}
      <motion.div
        className="absolute bottom-[8rem] left-[17%]"
        animate={{ opacity: [0, 1, 1, 0], y: [5, 0, 0, -5] }}
        transition={{ duration: 3, repeat: Infinity, times: [0, 0.2, 0.7, 1] }}
      >
        <SpeechBubble text="Discordo!" color="red" />
      </motion.div>
      <motion.div
        className="absolute bottom-[8rem] left-[57%]"
        animate={{ opacity: [0, 1, 1, 0], y: [5, 0, 0, -5] }}
        transition={{ duration: 3, repeat: Infinity, delay: 1.5, times: [0, 0.2, 0.7, 1] }}
      >
        <SpeechBubble text="Ouçam-se!" color="teal" />
      </motion.div>

      {/* Papers on table */}
      <div className="absolute bottom-[4.8rem] left-1/2 -translate-x-1/2 flex gap-2">
        {[0,1,2].map(i => (
          <div key={i} className="w-6 h-8 bg-white/80 rounded border border-gray-300/50 rotate-1">
            <div className="p-0.5 space-y-0.5">
              <div className="h-0.5 bg-gray-400/40 rounded" />
              <div className="h-0.5 bg-gray-400/40 rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConflictPersonA() {
  return (
    <motion.div animate={{ x: [-1, 1, -1] }} transition={{ duration: 0.8, repeat: Infinity }}>
      <svg width="22" height="44" viewBox="0 0 22 44" fill="none">
        <circle cx="11" cy="7" r="6" fill="#FDDBB4" />
        <rect x="6" y="2" width="10" height="5" rx="2" fill="#744210" />
        <circle cx="9" cy="7" r="0.9" fill="#4a3728" />
        <circle cx="13" cy="7" r="0.9" fill="#4a3728" />
        <path d="M9 10 Q11 9 13 10" stroke="#c05621" strokeWidth="1" fill="none" />
        <rect x="4" y="14" width="14" height="16" rx="3" fill="#c53030" />
        <rect x="0" y="14" width="4" height="11" rx="2" fill="#c53030" />
        <rect x="18" y="14" width="4" height="11" rx="2" fill="#c53030" />
        <circle cx="2" cy="25" r="2" fill="#FDDBB4" />
        <circle cx="20" cy="25" r="2" fill="#FDDBB4" />
        <rect x="6" y="30" width="4" height="11" rx="2" fill="#2c5282" />
        <rect x="12" y="30" width="4" height="11" rx="2" fill="#2c5282" />
      </svg>
    </motion.div>
  );
}

function ConflictPersonB() {
  return (
    <motion.div animate={{ x: [1, -1, 1] }} transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}>
      <svg width="22" height="44" viewBox="0 0 22 44" fill="none">
        <circle cx="11" cy="7" r="6" fill="#c8906a" />
        <rect x="6" y="2" width="10" height="3" rx="1.5" fill="#2d3748" />
        <path d="M6 5 Q11 1 16 5" fill="#2d3748" />
        <circle cx="9" cy="7" r="0.9" fill="#4a3728" />
        <circle cx="13" cy="7" r="0.9" fill="#4a3728" />
        <path d="M9 11 Q11 10 13 11" stroke="#c05621" strokeWidth="1" fill="none" />
        <rect x="4" y="14" width="14" height="16" rx="3" fill="#2b6cb0" />
        <rect x="0" y="14" width="4" height="11" rx="2" fill="#2b6cb0" />
        <rect x="18" y="14" width="4" height="11" rx="2" fill="#2b6cb0" />
        <circle cx="2" cy="25" r="2" fill="#c8906a" />
        <circle cx="20" cy="25" r="2" fill="#c8906a" />
        <rect x="6" y="30" width="4" height="11" rx="2" fill="#1a202c" />
        <rect x="12" y="30" width="4" height="11" rx="2" fill="#1a202c" />
      </svg>
    </motion.div>
  );
}

function ManagerCharacter() {
  return (
    <svg width="24" height="46" viewBox="0 0 24 46" fill="none">
      <circle cx="12" cy="7" r="6.5" fill="#FDDBB4" />
      <path d="M5 4 Q12 -1 19 4" fill="#1a202c" />
      <circle cx="10" cy="7" r="1" fill="#4a3728" />
      <circle cx="14" cy="7" r="1" fill="#4a3728" />
      <path d="M10 10.5 Q12 12 14 10.5" stroke="#c05621" strokeWidth="1" fill="none" />
      {/* Manager suit */}
      <rect x="4" y="15" width="16" height="17" rx="3" fill="#2d3748" />
      <rect x="10" y="15" width="4" height="17" fill="#4a5568" />
      <rect x="9" y="16" width="1.5" height="16" fill="#e2e8f0" />
      <rect x="13.5" y="16" width="1.5" height="16" fill="#e2e8f0" />
      <rect x="9.5" y="18" width="5" height="3" rx="0.5" fill="#e53e3e" />
      <rect x="0" y="15" width="4" height="12" rx="2" fill="#2d3748" />
      <rect x="20" y="15" width="4" height="12" rx="2" fill="#2d3748" />
      <circle cx="2" cy="27" r="2.5" fill="#FDDBB4" />
      <circle cx="22" cy="27" r="2.5" fill="#FDDBB4" />
      <rect x="6" y="32" width="5" height="11" rx="2" fill="#1a202c" />
      <rect x="13" y="32" width="5" height="11" rx="2" fill="#1a202c" />
      <ellipse cx="8.5" cy="43" rx="4" ry="2.5" fill="#0d0d0d" />
      <ellipse cx="15.5" cy="43" rx="4" ry="2.5" fill="#0d0d0d" />
    </svg>
  );
}

function SittingPerson({ color }: { color: string }) {
  return (
    <svg width="22" height="38" viewBox="0 0 22 38" fill="none">
      <circle cx="11" cy="7" r="5.5" fill="#FDDBB4" />
      <circle cx="9.5" cy="7" r="0.8" fill="#4a3728" />
      <circle cx="12.5" cy="7" r="0.8" fill="#4a3728" />
      <rect x="4" y="13" width="14" height="14" rx="3" fill={color} />
      <rect x="0" y="13" width="4" height="10" rx="2" fill={color} />
      <rect x="18" y="13" width="4" height="10" rx="2" fill={color} />
      <rect x="6" y="27" width="10" height="8" rx="2" fill="#2c5282" />
    </svg>
  );
}

function SpeechBubble({ text, color }: { text: string; color: string }) {
  const bg = color === "red" ? "bg-red-500/90" : "bg-teal-600/90";
  return (
    <div className={`${bg} text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap`}>
      {text}
    </div>
  );
}
