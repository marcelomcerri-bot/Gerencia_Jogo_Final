import { motion } from "framer-motion";
import { getLevelForPoints, getNextLevel, type PlayerProgress } from "@/data/gameState";
import { LEVELS } from "@/data/gameState";

interface GameHeaderProps {
  progress: PlayerProgress;
  onReset: () => void;
  onShowFAQ: () => void;
  onGoHome: () => void;
}

export function GameHeader({ progress, onReset, onShowFAQ, onGoHome }: GameHeaderProps) {
  const currentLevel = getLevelForPoints(progress.totalPoints);
  const nextLevel = getNextLevel(progress.totalPoints);

  const levelPercent = nextLevel
    ? Math.round(
        ((progress.totalPoints - currentLevel.minPoints) /
          (nextLevel.minPoints - currentLevel.minPoints)) *
          100
      )
    : 100;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-teal-700/40 bg-teal-900/95 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4 flex-wrap">
        <button
          onClick={onGoHome}
          className="flex items-center gap-2 text-white font-bold text-lg hover:text-teal-300 transition-colors"
        >
          <span className="text-2xl">🏥</span>
          <span className="hidden sm:block">GestorEnf</span>
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-teal-300 uppercase tracking-wide">
              Nível {currentLevel.level}
            </span>
            <span className="text-xs text-white/80">{currentLevel.title}</span>
            <span className="ml-auto text-xs font-bold text-yellow-300">
              {progress.totalPoints} pts
            </span>
          </div>
          <div className="w-full bg-teal-800/60 rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-teal-400 to-emerald-400"
              initial={{ width: 0 }}
              animate={{ width: `${levelPercent}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-white/70">
          {progress.currentStreak > 1 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1 bg-orange-500/20 border border-orange-400/30 rounded-full px-2 py-0.5"
            >
              <span>🔥</span>
              <span className="text-orange-300 font-bold">{progress.currentStreak}</span>
            </motion.div>
          )}
          <button
            onClick={onShowFAQ}
            className="px-3 py-1.5 rounded-lg bg-teal-800/60 hover:bg-teal-700/60 text-white/80 hover:text-white transition-colors text-xs font-medium"
          >
            Banco de Dúvidas
          </button>
          <button
            onClick={onReset}
            className="px-3 py-1.5 rounded-lg bg-red-900/30 hover:bg-red-800/40 text-red-300 hover:text-red-200 transition-colors text-xs font-medium"
          >
            Reiniciar
          </button>
        </div>
      </div>
    </header>
  );
}
