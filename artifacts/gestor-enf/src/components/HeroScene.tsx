import { motion } from "framer-motion";

export function HeroScene() {
  return (
    <div className="relative w-full h-44 overflow-hidden rounded-2xl mb-8 select-none"
      style={{ background: "linear-gradient(135deg, #0d3d30 0%, #0a2a40 50%, #1a0d3d 100%)" }}
    >
      {/* Animated grid floor */}
      <div className="absolute bottom-0 left-0 right-0 h-16"
        style={{ background: "linear-gradient(to top, rgba(0,200,150,0.08) 0%, transparent 100%)" }}
      />
      {/* Grid lines */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="absolute bottom-0 h-16 border-r border-teal-400/10 w-[12.5%]" style={{ left: `${i * 12.5}%` }} />
      ))}
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="absolute left-0 right-0 border-t border-teal-400/10" style={{ bottom: `${i * 20}px` }} />
      ))}

      {/* Stars / particles */}
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-white/30"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 60}%`,
          }}
          animate={{ opacity: [0.1, 0.6, 0.1], scale: [1, 1.3, 1] }}
          transition={{ duration: 2 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 2 }}
        />
      ))}

      {/* Hospital building in the back */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2">
        <HospitalBuilding />
      </div>

      {/* Ambulance */}
      <motion.div
        className="absolute bottom-2"
        animate={{ x: [-100, 500] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
      >
        <Ambulance />
      </motion.div>

      {/* Walking character left to right */}
      <motion.div
        className="absolute bottom-2"
        animate={{ x: [-50, 420], scaleX: [1, 1, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear", repeatDelay: 3, delay: 2 }}
      >
        <WalkingNurse />
      </motion.div>

      {/* Walking doctor right to left */}
      <motion.div
        className="absolute bottom-2 right-0"
        animate={{ x: [0, -480], scaleX: [-1, -1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear", repeatDelay: 1, delay: 4 }}
        style={{ scaleX: -1 }}
      >
        <WalkingDoctor />
      </motion.div>

      {/* Floating stats */}
      {[
        { label: "Kurcgant", x: "8%", y: "12%", delay: 0 },
        { label: "Marquis & Huston", x: "65%", y: "8%", delay: 0.5 },
        { label: "Gerência II", x: "38%", y: "18%", delay: 1 },
      ].map(({ label, x, y, delay }) => (
        <motion.div
          key={label}
          className="absolute text-[9px] text-teal-300/60 font-medium px-2 py-0.5 rounded-full border border-teal-500/20 bg-teal-900/30"
          style={{ left: x, top: y }}
          animate={{ y: [0, -4, 0], opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 3 + delay, repeat: Infinity, delay }}
        />
      ))}

      {/* Title overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <motion.div
            className="text-5xl mb-2"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            🏥
          </motion.div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight"
            style={{ textShadow: "0 0 40px rgba(52,211,153,0.4)" }}
          >
            GestorEnf
          </h1>
          <p className="text-teal-300/80 text-xs font-medium mt-1">
            Simulador de Gerência de Enfermagem II
          </p>
        </motion.div>
      </div>

      {/* Red cross pulse */}
      <motion.div
        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center"
        animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <div className="text-red-400 text-xl font-black">✚</div>
      </motion.div>
    </div>
  );
}

function HospitalBuilding() {
  return (
    <svg width="120" height="70" viewBox="0 0 120 70" fill="none" opacity="0.5">
      {/* Main building */}
      <rect x="20" y="15" width="80" height="55" fill="#1a2744" />
      <rect x="20" y="15" width="80" height="8" fill="#2d4a8a" />
      {/* Windows */}
      {[30, 50, 70, 90].map(x => [20, 32, 44].map(y => (
        <motion.rect
          key={`${x}-${y}`}
          x={x - 5} y={y} width="10" height="8" rx="1"
          fill={Math.random() > 0.5 ? "#fbbf24" : "#1e3a6e"}
          animate={{ opacity: [0.8, 0.4, 0.8] }}
          transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
        />
      )))}
      {/* Entrance */}
      <rect x="50" y="52" width="20" height="18" rx="2" fill="#1e3a6e" />
      {/* Sign */}
      <rect x="38" y="8" width="44" height="9" rx="1" fill="#2d6a4f" />
      <text x="60" y="15" textAnchor="middle" fill="white" fontSize="5" fontWeight="bold">HOSPITAL</text>
      {/* Cross */}
      <rect x="58" y="2" width="4" height="10" fill="#ef4444" rx="1" />
      <rect x="54" y="5" width="12" height="4" fill="#ef4444" rx="1" />
      {/* Side wings */}
      <rect x="0" y="30" width="20" height="40" fill="#162038" />
      <rect x="100" y="30" width="20" height="40" fill="#162038" />
    </svg>
  );
}

function Ambulance() {
  return (
    <svg width="60" height="28" viewBox="0 0 60 28" fill="none">
      <rect x="2" y="8" width="50" height="18" rx="3" fill="white" />
      <rect x="2" y="8" width="14" height="18" rx="3" fill="#e2e8f0" />
      {/* Red stripe */}
      <rect x="2" y="14" width="50" height="4" fill="#ef4444" />
      {/* Cross */}
      <rect x="28" y="10" width="3" height="8" fill="#ef4444" />
      <rect x="24" y="13" width="11" height="3" fill="#ef4444" />
      {/* Windows */}
      <rect x="4" y="10" width="10" height="6" rx="1" fill="#7dd3fc" />
      <rect x="40" y="10" width="10" height="6" rx="1" fill="#7dd3fc" />
      {/* Wheels */}
      <circle cx="12" cy="26" r="5" fill="#374151" />
      <circle cx="44" cy="26" r="5" fill="#374151" />
      <circle cx="12" cy="26" r="2" fill="#6b7280" />
      <circle cx="44" cy="26" r="2" fill="#6b7280" />
      {/* Siren */}
      <rect x="20" y="4" width="12" height="5" rx="1" fill="#fbbf24" />
      <motion.rect
        x="20" y="4" width="6" height="5" rx="1" fill="#ef4444"
        animate={{ opacity: [1, 0, 1] }}
        transition={{ duration: 0.4, repeat: Infinity }}
      />
    </svg>
  );
}

function WalkingNurse() {
  return (
    <motion.div
      animate={{ y: [0, -2, 0] }}
      transition={{ duration: 0.35, repeat: Infinity }}
    >
      <svg width="18" height="36" viewBox="0 0 18 36" fill="none">
        <circle cx="9" cy="5" r="4.5" fill="#FDDBB4" />
        <rect x="5.5" y="1.5" width="7" height="3" rx="1" fill="white" />
        <rect x="7.5" y="0" width="3" height="2.5" rx="1" fill="white" />
        <rect x="8" y="0.5" width="2" height="1.5" fill="#e53e3e" />
        <rect x="3" y="10" width="12" height="12" rx="2" fill="white" />
        <rect x="0" y="10" width="3" height="8" rx="1.5" fill="white" />
        <rect x="15" y="10" width="3" height="8" rx="1.5" fill="white" />
        <rect x="5" y="22" width="3" height="9" rx="1.5" fill="#3182ce" />
        <rect x="10" y="22" width="3" height="9" rx="1.5" fill="#3182ce" />
      </svg>
    </motion.div>
  );
}

function WalkingDoctor() {
  return (
    <motion.div
      animate={{ y: [0, -2, 0] }}
      transition={{ duration: 0.4, repeat: Infinity }}
    >
      <svg width="16" height="34" viewBox="0 0 16 34" fill="none">
        <circle cx="8" cy="5" r="4" fill="#FDDBB4" />
        <rect x="3" y="9" width="10" height="11" rx="2" fill="white" />
        <rect x="0" y="9" width="3" height="8" rx="1.5" fill="white" />
        <rect x="13" y="9" width="3" height="8" rx="1.5" fill="white" />
        <rect x="4" y="20" width="3" height="10" rx="1.5" fill="#2c5282" />
        <rect x="9" y="20" width="3" height="10" rx="1.5" fill="#2c5282" />
      </svg>
    </motion.div>
  );
}
