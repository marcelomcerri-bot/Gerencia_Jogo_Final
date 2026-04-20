import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  angle: number;
  color: string;
  size: number;
  speed: number;
}

interface PointExplosionProps {
  points: number;
  isCorrect: boolean;
  trigger: number;
}

function getTier(points: number, isCorrect: boolean) {
  if (!isCorrect) return "wrong";
  if (points >= 100) return "perfect";
  if (points >= 50) return "good";
  return "partial";
}

const TIER_CONFIG = {
  perfect: {
    colors: ["#fbbf24", "#f59e0b", "#34d399", "#6ee7b7", "#a78bfa", "#f472b6", "#fff"],
    particleCount: 28,
    label: "PERFEITO!",
    labelColor: "#fbbf24",
    emoji: "🌟",
    bgFlash: "rgba(251,191,36,0.15)",
  },
  good: {
    colors: ["#34d399", "#6ee7b7", "#fbbf24", "#a3e635"],
    particleCount: 16,
    label: "Muito bem!",
    labelColor: "#34d399",
    emoji: "✅",
    bgFlash: "rgba(52,211,153,0.1)",
  },
  partial: {
    colors: ["#fb923c", "#fbbf24", "#f87171"],
    particleCount: 8,
    label: "Parcial",
    labelColor: "#fb923c",
    emoji: "💡",
    bgFlash: "rgba(251,146,60,0.1)",
  },
  wrong: {
    colors: ["#f87171", "#ef4444", "#fca5a5"],
    particleCount: 6,
    label: "Incorreto",
    labelColor: "#f87171",
    emoji: "❌",
    bgFlash: "rgba(239,68,68,0.12)",
  },
};

export function PointExplosion({ points, isCorrect, trigger }: PointExplosionProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [show, setShow] = useState(false);
  const [tier, setTier] = useState<keyof typeof TIER_CONFIG>("good");
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (trigger === 0) return;
    const t = getTier(points, isCorrect) as keyof typeof TIER_CONFIG;
    setTier(t);
    const cfg = TIER_CONFIG[t];
    const ps: Particle[] = Array.from({ length: cfg.particleCount }, (_, i) => ({
      id: Date.now() + i,
      x: 0,
      y: 0,
      angle: (360 / cfg.particleCount) * i + (Math.random() - 0.5) * 25,
      color: cfg.colors[Math.floor(Math.random() * cfg.colors.length)],
      size: t === "perfect" ? 6 + Math.random() * 5 : 4 + Math.random() * 3,
      speed: t === "perfect" ? 90 + Math.random() * 60 : 50 + Math.random() * 40,
    }));
    setParticles(ps);
    setShow(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setShow(false), t === "perfect" ? 1800 : 1400);
    return () => clearTimeout(timerRef.current);
  }, [trigger]);

  const cfg = TIER_CONFIG[tier];

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Screen flash */}
          <motion.div
            className="fixed inset-0 pointer-events-none z-40"
            style={{ background: cfg.bgFlash }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.4 }}
          />

          <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
            {/* Center score pop */}
            <motion.div
              className="absolute text-center"
              initial={{ scale: 0.3, opacity: 0, y: 0 }}
              animate={{ scale: [0.3, 1.5, 1.2], opacity: [0, 1, 1, 0], y: [0, -20, -60] }}
              exit={{ opacity: 0 }}
              transition={{ duration: tier === "perfect" ? 1.6 : 1.2, times: [0, 0.3, 0.6, 1] }}
            >
              <div
                className="text-4xl font-black leading-none"
                style={{
                  color: cfg.labelColor,
                  textShadow: `0 0 30px ${cfg.labelColor}80, 0 2px 4px rgba(0,0,0,0.8)`,
                }}
              >
                {isCorrect ? "+" : ""}{points}
              </div>
              <div className="text-sm font-bold mt-1" style={{ color: cfg.labelColor, opacity: 0.9 }}>
                {cfg.label}
              </div>
            </motion.div>

            {/* Emoji burst for perfect */}
            {tier === "perfect" && (
              <motion.div
                className="absolute text-5xl"
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: [0, 1.8, 1.4, 0], rotate: [-30, 10, -10, 0] }}
                transition={{ duration: 1.4, times: [0, 0.3, 0.6, 1] }}
              >
                {cfg.emoji}
              </motion.div>
            )}

            {/* Particles */}
            {particles.map((p) => {
              const rad = (p.angle * Math.PI) / 180;
              return (
                <motion.div
                  key={p.id}
                  className="absolute rounded-full"
                  style={{
                    width: p.size,
                    height: p.size,
                    backgroundColor: p.color,
                    boxShadow: `0 0 6px ${p.color}`,
                  }}
                  initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                  animate={{
                    x: Math.cos(rad) * p.speed,
                    y: Math.sin(rad) * p.speed - 30,
                    scale: 0,
                    opacity: 0,
                  }}
                  transition={{ duration: tier === "perfect" ? 1.1 : 0.85, ease: "easeOut" }}
                />
              );
            })}

            {/* Ring burst for perfect */}
            {tier === "perfect" && (
              <motion.div
                className="absolute rounded-full border-4 border-yellow-400/60"
                initial={{ width: 0, height: 0, opacity: 1 }}
                animate={{ width: 200, height: 200, opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            )}

            {/* Wrong: shake warning banner */}
            {tier === "wrong" && (
              <motion.div
                className="absolute bg-red-700/90 border border-red-400/60 rounded-2xl px-6 py-3"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{
                  scale: [0.8, 1, 1, 0.9],
                  opacity: [0, 1, 1, 0],
                  x: [0, -10, 10, -10, 10, 0],
                }}
                transition={{ duration: 1.2, times: [0, 0.15, 0.7, 1], x: { duration: 0.4, delay: 0.15 } }}
              >
                <div className="text-white font-bold text-sm text-center">Reveja o conceito! 📚</div>
                <div className="text-red-200/70 text-xs text-center mt-0.5">Veja o feedback pedagógico</div>
              </motion.div>
            )}

            {/* Partial: info banner */}
            {tier === "partial" && (
              <motion.div
                className="absolute bg-orange-700/80 border border-orange-400/50 rounded-2xl px-5 py-2.5"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: [0.8, 1, 1, 0.9], opacity: [0, 1, 1, 0] }}
                transition={{ duration: 1.3, times: [0, 0.2, 0.7, 1] }}
              >
                <div className="text-white font-bold text-sm text-center">Quase lá! 💡</div>
                <div className="text-orange-200/70 text-xs text-center mt-0.5">Havia uma opção melhor</div>
              </motion.div>
            )}
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
