import { motion } from "framer-motion";

export function HospitalCorridorScene() {
  return (
    <div className="relative w-full h-56 overflow-hidden rounded-2xl bg-gradient-to-b from-slate-700 to-slate-800 select-none">
      {/* Floor */}
      <div className="absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-b from-slate-600 to-slate-700" />
      {/* Floor tiles */}
      {Array.from({ length: 14 }).map((_, i) => (
        <div key={i} className="absolute bottom-0 h-14 border-r border-slate-500/20" style={{ left: `${i * 7.2}%`, width: "7.2%" }} />
      ))}
      {/* Ceiling */}
      <div className="absolute top-0 left-0 right-0 h-4 bg-slate-600" />
      {/* Wall panels */}
      <div className="absolute top-4 left-0 right-0 h-8 bg-teal-900/30" />
      <div className="absolute top-12 left-0 right-0 bottom-14 bg-slate-700" />

      {/* Doors */}
      {[12, 42, 72].map((x) => (
        <div key={x} className="absolute bottom-14" style={{ left: `${x}%` }}>
          <div className="w-10 h-16 bg-teal-800/70 border-2 border-teal-700/50 rounded-t-lg relative">
            <div className="absolute right-1.5 top-1/2 w-1 h-1 rounded-full bg-yellow-400/80" />
          </div>
        </div>
      ))}

      {/* Lights on ceiling */}
      {[20, 50, 80].map((x) => (
        <div key={x} className="absolute top-4" style={{ left: `${x}%` }}>
          <div className="w-8 h-2 bg-yellow-200/90 rounded-b-sm" />
          <div className="absolute inset-0 bg-yellow-200/20 blur-sm rounded-full scale-150" />
        </div>
      ))}

      {/* Nurse character - walking */}
      <motion.div
        className="absolute bottom-14"
        animate={{ x: [0, 180, 180, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear", times: [0, 0.45, 0.55, 1] }}
        style={{ left: "10%" }}
      >
        <NurseSprite />
      </motion.div>

      {/* Patient in wheelchair */}
      <motion.div
        className="absolute bottom-14"
        animate={{ x: [200, 0, 0, 200] }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear", times: [0, 0.4, 0.6, 1] }}
        style={{ left: "50%" }}
      >
        <WheelchairPatient />
      </motion.div>

      {/* Doctor walking */}
      <motion.div
        className="absolute bottom-14"
        animate={{ x: [0, -60, -60, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear", times: [0, 0.4, 0.6, 1] }}
        style={{ left: "75%" }}
      >
        <DoctorSprite />
      </motion.div>

      {/* Medical cart */}
      <motion.div
        className="absolute bottom-14 left-[85%]"
        animate={{ x: [0, -20, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <MedicalCart />
      </motion.div>

      {/* Alert sign */}
      <motion.div
        className="absolute top-6 right-6"
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <div className="bg-red-500/20 border border-red-400/50 rounded px-2 py-1 text-xs text-red-300 font-bold">
          ⚠ UTI
        </div>
      </motion.div>
    </div>
  );
}

function NurseSprite() {
  return (
    <motion.div
      animate={{ y: [0, -2, 0] }}
      transition={{ duration: 0.4, repeat: Infinity }}
    >
      <svg width="28" height="52" viewBox="0 0 28 52" fill="none">
        {/* Head */}
        <circle cx="14" cy="9" r="7" fill="#FDDBB4" />
        {/* Nurse cap */}
        <rect x="8" y="3" width="12" height="5" rx="1" fill="white" />
        <rect x="12" y="1" width="4" height="3" rx="1" fill="white" />
        <rect x="12.5" y="2" width="3" height="2" fill="#e53e3e" rx="0.5" />
        {/* Eyes */}
        <circle cx="11" cy="9" r="1" fill="#4a3728" />
        <circle cx="17" cy="9" r="1" fill="#4a3728" />
        {/* Body - uniform */}
        <rect x="6" y="17" width="16" height="18" rx="3" fill="white" />
        <rect x="9" y="17" width="10" height="4" fill="#3182ce" />
        {/* Cross on uniform */}
        <rect x="12" y="20" width="4" height="1.5" fill="#e53e3e" />
        <rect x="13.5" y="18.5" width="1.5" height="4.5" fill="#e53e3e" />
        {/* Arms */}
        <rect x="0" y="17" width="6" height="14" rx="3" fill="white" />
        <rect x="22" y="17" width="6" height="14" rx="3" fill="white" />
        {/* Hands */}
        <circle cx="3" cy="31" r="3" fill="#FDDBB4" />
        <circle cx="25" cy="31" r="3" fill="#FDDBB4" />
        {/* Clipboard in hand */}
        <rect x="20" y="27" width="8" height="10" rx="1" fill="#e8d5b0" />
        <rect x="21" y="29" width="6" height="1" rx="0.5" fill="#888" />
        <rect x="21" y="31" width="4" height="1" rx="0.5" fill="#888" />
        <rect x="21" y="33" width="5" height="1" rx="0.5" fill="#888" />
        {/* Legs */}
        <rect x="8" y="35" width="6" height="14" rx="2" fill="#3182ce" />
        <rect x="14" y="35" width="6" height="14" rx="2" fill="#3182ce" />
        {/* Shoes */}
        <ellipse cx="11" cy="49" rx="5" ry="3" fill="#2d3748" />
        <ellipse cx="17" cy="49" rx="5" ry="3" fill="#2d3748" />
      </svg>
    </motion.div>
  );
}

function DoctorSprite() {
  return (
    <motion.div
      animate={{ y: [0, -2, 0] }}
      transition={{ duration: 0.35, repeat: Infinity }}
    >
      <svg width="26" height="50" viewBox="0 0 26 50" fill="none">
        <circle cx="13" cy="8" r="7" fill="#FDDBB4" />
        {/* Hair */}
        <rect x="6" y="3" width="14" height="4" rx="2" fill="#4a3728" />
        <circle cx="10" cy="8" r="1" fill="#4a3728" />
        <circle cx="16" cy="8" r="1" fill="#4a3728" />
        {/* White coat */}
        <rect x="5" y="16" width="16" height="18" rx="3" fill="white" />
        <rect x="8" y="16" width="5" height="16" fill="#e2e8f0" />
        <rect x="13" y="16" width="5" height="16" fill="#e2e8f0" />
        {/* Stethoscope */}
        <path d="M8 20 Q7 25 8 26 Q9 27 10 26" stroke="#718096" strokeWidth="1.5" fill="none" />
        <circle cx="10" cy="27" r="2" fill="#718096" />
        {/* Arms */}
        <rect x="0" y="16" width="5" height="12" rx="2.5" fill="white" />
        <rect x="21" y="16" width="5" height="12" rx="2.5" fill="white" />
        <circle cx="2.5" cy="28" r="2.5" fill="#FDDBB4" />
        <circle cx="23.5" cy="28" r="2.5" fill="#FDDBB4" />
        {/* Pants */}
        <rect x="7" y="34" width="5" height="13" rx="2" fill="#2c5282" />
        <rect x="14" y="34" width="5" height="13" rx="2" fill="#2c5282" />
        <ellipse cx="9.5" cy="47" rx="4.5" ry="2.5" fill="#1a202c" />
        <ellipse cx="16.5" cy="47" rx="4.5" ry="2.5" fill="#1a202c" />
      </svg>
    </motion.div>
  );
}

function WheelchairPatient() {
  return (
    <svg width="40" height="44" viewBox="0 0 40 44" fill="none">
      {/* Wheelchair wheels */}
      <circle cx="10" cy="38" r="6" stroke="#718096" strokeWidth="2" fill="none" />
      <circle cx="34" cy="38" r="6" stroke="#718096" strokeWidth="2" fill="none" />
      <circle cx="10" cy="38" r="2" fill="#718096" />
      <circle cx="34" cy="38" r="2" fill="#718096" />
      {/* Spokes */}
      <line x1="10" y1="32" x2="10" y2="44" stroke="#718096" strokeWidth="1" />
      <line x1="4" y1="38" x2="16" y2="38" stroke="#718096" strokeWidth="1" />
      <line x1="34" y1="32" x2="34" y2="44" stroke="#718096" strokeWidth="1" />
      <line x1="28" y1="38" x2="40" y2="38" stroke="#718096" strokeWidth="1" />
      {/* Frame */}
      <path d="M10 32 L10 22 L34 22 L34 32" stroke="#718096" strokeWidth="2" fill="none" />
      <path d="M10 32 L34 32" stroke="#718096" strokeWidth="2" />
      {/* Seat back */}
      <rect x="14" y="14" width="16" height="12" rx="2" fill="#a0aec0" />
      {/* Patient */}
      <circle cx="22" cy="9" r="5.5" fill="#FDDBB4" />
      <circle cx="20" cy="9" r="0.8" fill="#4a3728" />
      <circle cx="24" cy="9" r="0.8" fill="#4a3728" />
      {/* Gown */}
      <rect x="16" y="15" width="12" height="10" rx="2" fill="#bee3f8" />
    </svg>
  );
}

function MedicalCart() {
  return (
    <svg width="30" height="38" viewBox="0 0 30 38" fill="none">
      <rect x="2" y="4" width="26" height="26" rx="2" fill="#e2e8f0" stroke="#cbd5e0" strokeWidth="1.5" />
      <rect x="2" y="4" width="26" height="8" rx="2" fill="#4299e1" />
      <rect x="5" y="8" width="8" height="2" rx="1" fill="white" />
      <rect x="5" y="14" width="20" height="1.5" rx="0.75" fill="#a0aec0" />
      <rect x="5" y="18" width="20" height="1.5" rx="0.75" fill="#a0aec0" />
      <rect x="5" y="22" width="20" height="1.5" rx="0.75" fill="#a0aec0" />
      <circle cx="8" cy="34" r="4" fill="#718096" />
      <circle cx="22" cy="34" r="4" fill="#718096" />
      <circle cx="8" cy="34" r="2" fill="#4a5568" />
      <circle cx="22" cy="34" r="2" fill="#4a5568" />
      <rect x="12" y="0" width="6" height="6" rx="1" fill="#e2e8f0" stroke="#cbd5e0" strokeWidth="1" />
    </svg>
  );
}
