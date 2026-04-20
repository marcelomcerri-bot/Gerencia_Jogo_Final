import { motion } from "framer-motion";

export function ICUScene() {
  return (
    <div className="relative w-full h-56 overflow-hidden rounded-2xl bg-gradient-to-b from-blue-950 to-slate-900 select-none">
      {/* Floor */}
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-slate-800" />
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="absolute bottom-0 h-12 border-r border-blue-900/30" style={{ left: `${i * 8.4}%`, width: "8.4%" }} />
      ))}
      {/* Ceiling light strips */}
      <div className="absolute top-0 left-0 right-0 h-3 bg-blue-900" />
      {[15, 45, 75].map(x => (
        <motion.div
          key={x}
          className="absolute top-3 h-2 w-16 bg-blue-200/80 rounded-b"
          style={{ left: `${x}%` }}
          animate={{ opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity, delay: x / 100 }}
        />
      ))}

      {/* Hospital bed 1 */}
      <div className="absolute bottom-12 left-[5%]">
        <HospitalBed />
        {/* Beeping monitor */}
        <div className="absolute -top-12 -right-2">
          <Monitor />
        </div>
      </div>

      {/* Hospital bed 2 */}
      <div className="absolute bottom-12 left-[45%]">
        <HospitalBed />
        <div className="absolute -top-12 -right-2">
          <Monitor />
        </div>
      </div>

      {/* IV pole */}
      <motion.div
        className="absolute bottom-12 left-[38%]"
        animate={{ rotate: [-1, 1, -1] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <IVPole />
      </motion.div>
      <motion.div
        className="absolute bottom-12 left-[78%]"
        animate={{ rotate: [1, -1, 1] }}
        transition={{ duration: 3, repeat: Infinity, delay: 1 }}
      >
        <IVPole />
      </motion.div>

      {/* Nurse attending patient */}
      <motion.div
        className="absolute bottom-12 left-[28%]"
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <NurseSideView />
      </motion.div>

      {/* Doctor checking chart */}
      <motion.div
        className="absolute bottom-12 left-[67%]"
        animate={{ x: [0, 2, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <DoctorClipboard />
      </motion.div>

      {/* Blinking alert */}
      <motion.div
        className="absolute top-6 left-1/2 -translate-x-1/2"
        animate={{ scale: [1, 1.05, 1], opacity: [1, 0.7, 1] }}
        transition={{ duration: 0.8, repeat: Infinity }}
      >
        <div className="bg-red-500/80 text-white text-xs font-bold px-3 py-1 rounded-full border border-red-300/50">
          ⚡ Monitor: Alerta
        </div>
      </motion.div>

      {/* EKG line animation */}
      <div className="absolute bottom-4 left-8 right-8">
        <svg width="100%" height="20" viewBox="0 0 300 20">
          <motion.path
            d="M0,10 L30,10 L40,2 L50,18 L60,10 L80,10 L90,2 L100,18 L110,10 L130,10 L140,2 L150,18 L160,10 L180,10 L190,2 L200,18 L210,10 L230,10 L240,2 L250,18 L260,10 L280,10 L290,2 L300,18"
            stroke="#22d3ee"
            strokeWidth="1.5"
            fill="none"
            strokeDasharray="400"
            animate={{ strokeDashoffset: [400, -400] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
        </svg>
      </div>
    </div>
  );
}

function HospitalBed() {
  return (
    <svg width="80" height="50" viewBox="0 0 80 50" fill="none">
      {/* Bed frame */}
      <rect x="2" y="20" width="76" height="10" rx="2" fill="#e2e8f0" />
      <rect x="2" y="28" width="76" height="5" rx="1" fill="#cbd5e0" />
      {/* Legs */}
      <rect x="5" y="33" width="4" height="14" rx="1" fill="#a0aec0" />
      <rect x="71" y="33" width="4" height="14" rx="1" fill="#a0aec0" />
      {/* Headboard */}
      <rect x="0" y="8" width="8" height="22" rx="2" fill="#4299e1" />
      {/* Pillow */}
      <rect x="4" y="12" width="22" height="10" rx="3" fill="white" />
      {/* Patient head */}
      <circle cx="14" cy="12" r="5" fill="#FDDBB4" />
      <circle cx="12.5" cy="11.5" r="0.7" fill="#4a3728" />
      <circle cx="15.5" cy="11.5" r="0.7" fill="#4a3728" />
      {/* Blanket */}
      <rect x="10" y="20" width="66" height="9" rx="2" fill="#bee3f8" />
      <rect x="10" y="20" width="66" height="3" rx="1" fill="#90cdf4" />
      {/* Wheels */}
      <circle cx="8" cy="47" r="3" fill="#718096" />
      <circle cx="72" cy="47" r="3" fill="#718096" />
    </svg>
  );
}

function Monitor() {
  return (
    <motion.div animate={{ opacity: [1, 0.8, 1] }} transition={{ duration: 0.5, repeat: Infinity }}>
      <svg width="36" height="32" viewBox="0 0 36 32" fill="none">
        <rect x="2" y="2" width="32" height="22" rx="2" fill="#1a202c" stroke="#4a5568" strokeWidth="1" />
        <rect x="4" y="4" width="28" height="18" rx="1" fill="#0d1117" />
        {/* EKG line on screen */}
        <path d="M5 13 L10 13 L12 8 L14 18 L16 13 L21 13 L23 8 L25 18 L27 13 L31 13" stroke="#22c55e" strokeWidth="1.5" fill="none" />
        {/* Numbers */}
        <text x="5" y="9" fill="#22c55e" fontSize="4" fontFamily="monospace">72</text>
        <text x="18" y="9" fill="#f59e0b" fontSize="4" fontFamily="monospace">98%</text>
        <rect x="12" y="24" width="12" height="4" rx="1" fill="#4a5568" />
        <rect x="16" y="28" width="4" height="4" rx="0.5" fill="#4a5568" />
      </svg>
    </motion.div>
  );
}

function IVPole() {
  return (
    <svg width="16" height="60" viewBox="0 0 16 60" fill="none">
      <rect x="7" y="8" width="2" height="48" fill="#a0aec0" />
      <circle cx="8" cy="8" r="4" fill="#e2e8f0" />
      <rect x="2" y="54" width="12" height="4" rx="1" fill="#718096" />
      <ellipse cx="8" cy="10" rx="5" ry="6" fill="#bee3f8" stroke="#90cdf4" strokeWidth="1" />
      {/* IV line */}
      <path d="M8 16 Q8 28 4 40" stroke="#bee3f8" strokeWidth="1" fill="none" strokeDasharray="2 1" />
    </svg>
  );
}

function NurseSideView() {
  return (
    <svg width="22" height="48" viewBox="0 0 22 48" fill="none">
      <circle cx="11" cy="7" r="6" fill="#FDDBB4" />
      <rect x="7" y="2" width="8" height="4" rx="1" fill="white" />
      <rect x="9" y="0" width="4" height="3" rx="1" fill="white" />
      <rect x="9.5" y="1" width="3" height="2" fill="#e53e3e" rx="0.5" />
      <rect x="4" y="14" width="14" height="17" rx="3" fill="white" />
      <rect x="18" y="14" width="4" height="10" rx="2" fill="white" />
      <circle cx="20" cy="24" r="2" fill="#FDDBB4" />
      {/* Holding medicine */}
      <rect x="18" y="20" width="5" height="7" rx="1" fill="#fbbf24" />
      <rect x="19" y="18" width="3" height="3" rx="0.5" fill="#d97706" />
      <rect x="4" y="31" width="6" height="14" rx="2" fill="#3182ce" />
      <rect x="12" y="31" width="6" height="14" rx="2" fill="#3182ce" />
    </svg>
  );
}

function DoctorClipboard() {
  return (
    <svg width="26" height="50" viewBox="0 0 26 50" fill="none">
      <circle cx="13" cy="7" r="6" fill="#FDDBB4" />
      <rect x="7" y="2" width="12" height="5" rx="2" fill="#4a3728" />
      <circle cx="11" cy="7" r="1" fill="#4a3728" />
      <circle cx="15" cy="7" r="1" fill="#4a3728" />
      <rect x="4" y="14" width="18" height="16" rx="3" fill="white" />
      <rect x="0" y="14" width="4" height="11" rx="2" fill="white" />
      <rect x="22" y="14" width="4" height="11" rx="2" fill="white" />
      <circle cx="2" cy="25" r="2" fill="#FDDBB4" />
      {/* Clipboard */}
      <rect x="20" y="10" width="10" height="15" rx="1" fill="#e8d5b0" />
      <rect x="23" y="8" width="4" height="3" rx="1" fill="#d4a96a" />
      <rect x="21.5" y="13" width="7" height="1" rx="0.5" fill="#888" />
      <rect x="21.5" y="15" width="5" height="1" rx="0.5" fill="#888" />
      <rect x="21.5" y="17" width="6" height="1" rx="0.5" fill="#888" />
      <rect x="21.5" y="19" width="4" height="1" rx="0.5" fill="#888" />
      <circle cx="24" cy="25" r="2" fill="#FDDBB4" />
      <rect x="6" y="30" width="6" height="17" rx="2" fill="#2c5282" />
      <rect x="14" y="30" width="6" height="17" rx="2" fill="#2c5282" />
    </svg>
  );
}
