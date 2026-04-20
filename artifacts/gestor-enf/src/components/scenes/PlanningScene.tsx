import { motion } from "framer-motion";

export function PlanningScene() {
  return (
    <div className="relative w-full h-56 overflow-hidden rounded-2xl bg-gradient-to-b from-indigo-950 to-blue-950 select-none">
      {/* Floor */}
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-blue-950" />
      {/* Ceiling */}
      <div className="absolute top-0 left-0 right-0 h-3 bg-indigo-900" />

      {/* Large calendar on wall */}
      <div className="absolute top-6 right-10 w-32 h-28 bg-white/90 rounded-lg border-2 border-indigo-300/50 p-1.5">
        <div className="bg-indigo-600 text-white text-[7px] font-bold text-center py-0.5 rounded mb-1">
          AGENDA
        </div>
        <div className="grid grid-cols-7 gap-px text-[5px] text-gray-500 font-medium text-center">
          {['D','S','T','Q','Q','S','S'].map((d,i) => <div key={i}>{d}</div>)}
          {Array.from({length:28}).map((_, i) => (
            <motion.div
              key={i}
              className={`rounded-sm text-center ${i === 14 ? 'bg-indigo-500 text-white' : i === 7 || i === 21 ? 'bg-red-400/80 text-white' : 'text-gray-600'}`}
              animate={i === 14 ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.05 }}
            >
              {i + 1}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Gantt-style board */}
      <div className="absolute top-5 left-6 w-36 h-24 bg-slate-800/90 rounded-lg border border-indigo-400/30 p-2">
        <div className="text-indigo-300 text-[7px] font-bold mb-2 uppercase tracking-wide">Plano de Ação</div>
        {[
          { label: 'Escala', w: '70%', color: 'bg-emerald-500' },
          { label: 'Treino', w: '45%', color: 'bg-blue-500' },
          { label: 'Auditoria', w: '85%', color: 'bg-yellow-500' },
          { label: 'Relatório', w: '30%', color: 'bg-purple-500' },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-1 mb-1.5">
            <span className="text-[6px] text-white/50 w-10 shrink-0">{item.label}</span>
            <div className="flex-1 bg-slate-700/50 rounded-full h-1.5">
              <motion.div
                className={`${item.color} h-full rounded-full`}
                initial={{ width: 0 }}
                animate={{ width: item.w }}
                transition={{ duration: 1.5, delay: i * 0.3, repeat: Infinity, repeatType: 'reverse', repeatDelay: 2 }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Characters */}
      <motion.div
        className="absolute bottom-12"
        style={{ left: '45%' }}
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <PlannerCharacter />
      </motion.div>

      <motion.div
        className="absolute bottom-12"
        style={{ left: '58%' }}
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.7 }}
      >
        <AssistantCharacter />
      </motion.div>

      {/* Floating checklist */}
      <motion.div
        className="absolute top-5 right-[44%] bg-white/90 rounded p-1.5 shadow-lg"
        animate={{ y: [0, -4, 0], rotate: [0, 1, 0] }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        {['✓ Protocolo', '✓ Escala', '○ Relatório'].map((item, i) => (
          <div key={i} className={`text-[7px] font-medium ${item.startsWith('✓') ? 'text-emerald-600' : 'text-gray-500'}`}>
            {item}
          </div>
        ))}
      </motion.div>

      {/* Clock */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2">
        <ClockSprite />
      </div>

      {/* Notification badge */}
      <motion.div
        className="absolute bottom-4 right-6"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
      >
        <div className="bg-orange-500/20 border border-orange-400/40 rounded px-2 py-1 text-xs text-orange-300">
          📅 3 ações pendentes
        </div>
      </motion.div>
    </div>
  );
}

function ClockSprite() {
  return (
    <motion.div animate={{ rotate: 360 }} transition={{ duration: 60, repeat: Infinity, ease: "linear" }}>
      <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
        <circle cx="15" cy="15" r="13" fill="white" stroke="#4a5568" strokeWidth="1.5" />
        <line x1="15" y1="15" x2="15" y2="6" stroke="#2d3748" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="15" y1="15" x2="21" y2="15" stroke="#e53e3e" strokeWidth="1" strokeLinecap="round" />
        <circle cx="15" cy="15" r="1.5" fill="#2d3748" />
        {[0,30,60,90,120,150,180,210,240,270,300,330].map((deg, i) => (
          <line
            key={i}
            x1={15 + 10 * Math.sin(deg * Math.PI / 180)}
            y1={15 - 10 * Math.cos(deg * Math.PI / 180)}
            x2={15 + 12 * Math.sin(deg * Math.PI / 180)}
            y2={15 - 12 * Math.cos(deg * Math.PI / 180)}
            stroke={i % 3 === 0 ? "#2d3748" : "#a0aec0"}
            strokeWidth={i % 3 === 0 ? 1.5 : 0.8}
          />
        ))}
      </svg>
    </motion.div>
  );
}

function PlannerCharacter() {
  return (
    <svg width="26" height="50" viewBox="0 0 26 50" fill="none">
      <circle cx="13" cy="7" r="6" fill="#FDDBB4" />
      <rect x="8" y="2" width="10" height="3" rx="1.5" fill="#6b46c1" />
      <circle cx="11" cy="7" r="0.9" fill="#4a3728" />
      <circle cx="15" cy="7" r="0.9" fill="#4a3728" />
      <path d="M11 10 Q13 11.5 15 10" stroke="#c05621" strokeWidth="1" fill="none" />
      <rect x="5" y="14" width="16" height="16" rx="3" fill="#6b46c1" />
      <rect x="1" y="14" width="4" height="10" rx="2" fill="#6b46c1" />
      <rect x="21" y="14" width="4" height="10" rx="2" fill="#6b46c1" />
      <circle cx="3" cy="24" r="2" fill="#FDDBB4" />
      {/* Pointer in hand */}
      <rect x="22" y="18" width="1.5" height="12" rx="0.75" fill="#d69e2e" />
      <polygon points="22.75,18 25,22 20.5,22" fill="#d69e2e" />
      <circle cx="23" cy="27" r="2" fill="#FDDBB4" />
      <rect x="7" y="30" width="5" height="17" rx="2" fill="#4c1d95" />
      <rect x="14" y="30" width="5" height="17" rx="2" fill="#4c1d95" />
    </svg>
  );
}

function AssistantCharacter() {
  return (
    <svg width="22" height="45" viewBox="0 0 22 45" fill="none">
      <circle cx="11" cy="6" r="5.5" fill="#f0c8a0" />
      <path d="M5 3 Q11 -1 17 3" fill="#92400e" />
      <circle cx="9.5" cy="6.5" r="0.8" fill="#4a3728" />
      <circle cx="12.5" cy="6.5" r="0.8" fill="#4a3728" />
      <rect x="4" y="13" width="14" height="15" rx="3" fill="#0891b2" />
      <rect x="0" y="13" width="4" height="10" rx="2" fill="#0891b2" />
      <rect x="18" y="13" width="4" height="10" rx="2" fill="#0891b2" />
      <circle cx="2" cy="23" r="2" fill="#f0c8a0" />
      {/* Notebook */}
      <rect x="16" y="18" width="8" height="10" rx="1" fill="#fef3c7" stroke="#d97706" strokeWidth="0.5" />
      <rect x="17" y="20" width="6" height="0.75" rx="0.3" fill="#6b7280" />
      <rect x="17" y="22" width="4" height="0.75" rx="0.3" fill="#6b7280" />
      <rect x="17" y="24" width="5" height="0.75" rx="0.3" fill="#6b7280" />
      <circle cx="20" cy="27" r="2" fill="#f0c8a0" />
      <rect x="6" y="28" width="4" height="14" rx="2" fill="#164e63" />
      <rect x="12" y="28" width="4" height="14" rx="2" fill="#164e63" />
    </svg>
  );
}
