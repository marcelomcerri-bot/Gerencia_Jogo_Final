import { motion } from "framer-motion";

export function FinancialScene() {
  return (
    <div className="relative w-full h-56 overflow-hidden rounded-2xl bg-gradient-to-b from-emerald-950 to-slate-900 select-none">
      {/* Floor */}
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-emerald-950" />
      <div className="absolute top-0 left-0 right-0 h-3 bg-emerald-900" />

      {/* Large screen/monitor with chart */}
      <div className="absolute top-5 left-4 w-44 h-32 bg-slate-800/90 border-2 border-emerald-700/40 rounded-xl p-2">
        <div className="text-emerald-400 text-[7px] font-bold uppercase tracking-wide mb-1">Orçamento Mensal</div>
        <BarChartMini />
        <div className="mt-1 flex gap-3">
          <div className="text-[6px] text-emerald-400">● Previsto</div>
          <div className="text-[6px] text-red-400">● Realizado</div>
        </div>
      </div>

      {/* Second monitor - pie chart area */}
      <div className="absolute top-5 right-4 w-32 h-32 bg-slate-800/90 border-2 border-emerald-700/40 rounded-xl p-2">
        <div className="text-emerald-400 text-[7px] font-bold uppercase mb-1">Distribuição</div>
        <PieChartMini />
        <div className="mt-1 space-y-0.5">
          {[['Pessoal','bg-blue-500','52%'],['Mat.','bg-emerald-500','28%'],['Outros','bg-yellow-500','20%']].map(([l,c,v])=>(
            <div key={l} className="flex items-center gap-1">
              <div className={`w-1.5 h-1.5 rounded-sm ${c}`} />
              <span className="text-[6px] text-white/50">{l}</span>
              <span className="text-[6px] text-white/70 ml-auto">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Alert banner */}
      <motion.div
        className="absolute top-[8.5rem] left-4 right-4 bg-red-900/40 border border-red-500/40 rounded-lg px-3 py-1.5 flex items-center gap-2"
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <span className="text-red-400 text-sm">⚠</span>
        <div>
          <div className="text-red-300 text-[8px] font-bold">Orçamento excedido em 28%</div>
          <div className="text-red-400/60 text-[7px]">Materiais e insumos — Período atual</div>
        </div>
        <div className="ml-auto text-red-300 text-[9px] font-bold">+R$8.400</div>
      </motion.div>

      {/* Stressed character at desk */}
      <motion.div
        className="absolute bottom-12 left-[38%]"
        animate={{ y: [0, -2, 0], rotate: [0, 1, 0, -1, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <StressedFinanceChar />
      </motion.div>

      {/* Flying money symbols */}
      {[{ x: '60%', delay: 0 }, { x: '70%', delay: 1 }, { x: '50%', delay: 2 }].map(({ x, delay }, i) => (
        <motion.div
          key={i}
          className="absolute text-green-400 text-sm font-bold pointer-events-none"
          style={{ left: x, bottom: '3rem' }}
          animate={{ y: [-10, -50, -90], opacity: [0, 1, 0], x: [0, 10, 20] }}
          transition={{ duration: 2, delay, repeat: Infinity, repeatDelay: 2 }}
        >
          R$
        </motion.div>
      ))}

      {/* Calculator */}
      <motion.div
        className="absolute bottom-14 right-8"
        animate={{ rotate: [0, 2, 0, -2, 0] }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        <Calculator />
      </motion.div>
    </div>
  );
}

function BarChartMini() {
  const bars = [
    { prev: 60, real: 58 },
    { prev: 65, real: 70 },
    { prev: 62, real: 80 },
    { prev: 60, real: 77 },
  ];
  const labels = ['Jan', 'Fev', 'Mar', 'Abr'];
  return (
    <div className="flex items-end gap-1 h-16">
      {bars.map(({ prev, real }, i) => (
        <div key={i} className="flex gap-px items-end flex-1">
          <motion.div
            className="bg-emerald-500/70 rounded-sm flex-1"
            style={{ height: `${prev}%` }}
            animate={{ height: [`${prev * 0.3}%`, `${prev}%`] }}
            transition={{ duration: 1, delay: i * 0.2 }}
          />
          <motion.div
            className="bg-red-400/80 rounded-sm flex-1"
            style={{ height: `${real}%` }}
            animate={{ height: [`${real * 0.3}%`, `${real}%`] }}
            transition={{ duration: 1, delay: i * 0.2 + 0.1 }}
          />
        </div>
      ))}
      <div className="absolute bottom-0 flex gap-1">
        {labels.map(l => <span key={l} className="text-[5px] text-white/30">{l}</span>)}
      </div>
    </div>
  );
}

function PieChartMini() {
  return (
    <svg width="60" height="60" viewBox="0 0 60 60">
      {/* Pie sections */}
      <path d="M30 30 L30 5 A25 25 0 0 1 30 5 L30 30" fill="#3b82f6" />
      <path d="M30 30 L30 5 A25 25 0 0 1 54.3 42.5 L30 30" fill="#3b82f6" />
      <path d="M30 30 L54.3 42.5 A25 25 0 0 1 12.8 48.8 L30 30" fill="#10b981" />
      <path d="M30 30 L12.8 48.8 A25 25 0 0 1 30 5 L30 30" fill="#f59e0b" />
      <circle cx="30" cy="30" r="10" fill="#1e293b" />
      <motion.circle
        cx="30" cy="30" r="25"
        fill="none"
        stroke="white"
        strokeWidth="0.5"
        opacity="0.2"
        animate={{ rotate: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      />
    </svg>
  );
}

function StressedFinanceChar() {
  return (
    <svg width="28" height="52" viewBox="0 0 28 52" fill="none">
      <circle cx="14" cy="8" r="7" fill="#FDDBB4" />
      <rect x="8" y="3" width="12" height="4" rx="2" fill="#2d3748" />
      {/* Stressed eyes */}
      <path d="M10 8 L12 7 L11 9" stroke="#4a3728" strokeWidth="1" fill="none" />
      <path d="M16 8 L18 7 L17 9" stroke="#4a3728" strokeWidth="1" fill="none" />
      {/* Worried mouth */}
      <path d="M11 11.5 Q14 10 17 11.5" stroke="#c05621" strokeWidth="1" fill="none" />
      {/* Sweat drop */}
      <ellipse cx="20" cy="6" rx="1.5" ry="2" fill="#93c5fd" opacity="0.8" />
      {/* Suit */}
      <rect x="5" y="16" width="18" height="17" rx="3" fill="#1e3a5f" />
      <rect x="11" y="16" width="2.5" height="17" fill="#2a4a7f" />
      <rect x="13.5" y="16" width="2.5" height="17" fill="#2a4a7f" />
      {/* Loosened tie */}
      <polygon points="14,17 16,21 14,26 12,21" fill="#c53030" />
      {/* Hand on head */}
      <rect x="1" y="16" width="4" height="8" rx="2" fill="#1e3a5f" />
      <circle cx="3" cy="14" r="3" fill="#FDDBB4" />
      <rect x="22" y="16" width="4" height="12" rx="2" fill="#1e3a5f" />
      <circle cx="24" cy="28" r="2" fill="#FDDBB4" />
      <rect x="7" y="33" width="6" height="16" rx="2" fill="#1a202c" />
      <rect x="15" y="33" width="6" height="16" rx="2" fill="#1a202c" />
    </svg>
  );
}

function Calculator() {
  return (
    <svg width="28" height="36" viewBox="0 0 28 36" fill="none">
      <rect x="1" y="1" width="26" height="34" rx="3" fill="#374151" stroke="#4b5563" strokeWidth="1" />
      <rect x="3" y="3" width="22" height="8" rx="2" fill="#1f2937" />
      <text x="6" y="9" fill="#22c55e" fontSize="5" fontFamily="monospace">8.400</text>
      {[3,3,3].map((_, row) => (
        Array.from({length: 3}).map((_, col) => (
          <rect
            key={`${row}-${col}`}
            x={3 + col * 8}
            y={14 + row * 7}
            width="6"
            height="5"
            rx="1"
            fill="#4b5563"
          />
        ))
      )).flat()}
      <rect x="19" y="14" width="6" height="5" rx="1" fill="#ef4444" />
      <rect x="19" y="28" width="6" height="12" rx="1" fill="#22c55e" />
    </svg>
  );
}
