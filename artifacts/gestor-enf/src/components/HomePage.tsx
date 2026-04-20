import { motion } from "framer-motion";
import { CASES, CATEGORIES, type Category } from "@/data/cases";
import { getLevelForPoints, type PlayerProgress } from "@/data/gameState";
import { HeroScene } from "./HeroScene";
import { SceneSelector } from "./scenes/SceneSelector";

interface HomePageProps {
  progress: PlayerProgress;
  onSelectCase: (caseId: string) => void;
}

const DIFF_LABELS = { facil: "Fácil", medio: "Médio", dificil: "Difícil" };
const DIFF_COLORS = {
  facil: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  medio: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  dificil: "bg-red-500/20 text-red-300 border-red-500/30",
};

export function HomePage({ progress, onSelectCase }: HomePageProps) {
  const currentLevel = getLevelForPoints(progress.totalPoints);
  const completedCount = progress.completedCases.length;
  const accuracyRate =
    progress.totalAttempted > 0
      ? Math.round((progress.correctAnswers / progress.totalAttempted) * 100)
      : 0;

  const categoryCounts = CASES.reduce((acc, c) => {
    acc[c.category] = (acc[c.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const completedByCategory = progress.completedCases.reduce((acc, id) => {
    const c = CASES.find((x) => x.id === id);
    if (c) acc[c.category] = (acc[c.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Animated Hero */}
      <HeroScene />

      {/* Intro text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-white/50 text-sm text-center max-w-xl mx-auto mb-8"
      >
        Enfrente situações reais dos serviços de saúde e tome decisões gerenciais
        fundamentadas em{" "}
        <span className="text-teal-300">Kurcgant</span> e{" "}
        <span className="text-teal-300">Marquis & Huston</span>.
      </motion.p>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10"
      >
        {[
          { label: "Nível Atual", value: currentLevel.title, sub: `Nível ${currentLevel.level}`, icon: "⭐" },
          { label: "Pontos Totais", value: `${progress.totalPoints}`, sub: "pontos acumulados", icon: "🎯" },
          { label: "Casos Resolvidos", value: `${completedCount}/${CASES.length}`, sub: "casos concluídos", icon: "📋" },
          { label: "Precisão", value: `${accuracyRate}%`, sub: "taxa de acerto", icon: "✅" },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            whileHover={{ scale: 1.03, y: -2 }}
            className="bg-teal-800/40 border border-teal-700/40 rounded-2xl p-4 text-center cursor-default"
          >
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-white font-bold text-sm sm:text-base leading-tight">{stat.value}</div>
            <div className="text-teal-300/60 text-xs mt-0.5">{stat.sub}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Achievements */}
      {progress.achievements.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-10"
        >
          <h2 className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-3">
            Conquistas Desbloqueadas
          </h2>
          <div className="flex flex-wrap gap-2">
            {progress.achievements.map((a) => (
              <motion.div
                key={a}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.05 }}
                className="bg-yellow-500/10 border border-yellow-400/30 rounded-full px-3 py-1 text-xs text-yellow-300 font-medium cursor-default"
              >
                {a}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Categories */}
      <div className="mb-8">
        <h2 className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-4">
          Categorias
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {(Object.entries(CATEGORIES) as [Category, (typeof CATEGORIES)[Category]][]).map(([key, cat]) => {
            const total = categoryCounts[key] || 0;
            const done = completedByCategory[key] || 0;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            return (
              <motion.div
                key={key}
                whileHover={{ scale: 1.02 }}
                className="bg-teal-800/30 border border-teal-700/30 rounded-xl p-3 cursor-default"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{cat.icon}</span>
                  <span className="text-white/80 text-sm font-medium">{cat.label}</span>
                  <span className="ml-auto text-white/40 text-xs">{done}/{total}</span>
                </div>
                <div className="w-full bg-teal-900/50 rounded-full h-1.5">
                  <motion.div
                    className={`h-full rounded-full ${cat.color} transition-all duration-500`}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1, delay: 0.3 }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Case List with mini scene thumbnails */}
      <div>
        <h2 className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-4">
          Casos Clínico-Gerenciais
        </h2>
        <div className="grid gap-4">
          {CASES.map((c, i) => {
            const completed = progress.completedCases.includes(c.id);
            const cat = CATEGORIES[c.category];
            return (
              <motion.button
                key={c.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 * i }}
                whileHover={{ scale: 1.01, y: -2 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => onSelectCase(c.id)}
                className={`w-full text-left rounded-2xl border overflow-hidden transition-all duration-200 group
                  ${completed
                    ? "border-emerald-500/40 bg-emerald-900/10"
                    : "border-teal-700/40 bg-teal-800/20 hover:border-teal-500/50"
                  }`}
              >
                <div className="flex items-stretch">
                  {/* Mini animated scene thumbnail */}
                  <div className="w-40 sm:w-52 shrink-0 relative overflow-hidden" style={{ height: "110px" }}>
                    <div className="absolute top-0 left-0" style={{ width: "500px", transform: "scale(0.31)", transformOrigin: "top left" }}>
                      <SceneSelector caseId={c.id} category={c.category} />
                    </div>
                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-teal-900/60" />
                    {completed && (
                      <div className="absolute inset-0 bg-emerald-900/30 flex items-center justify-center">
                        <span className="text-3xl">✅</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-4 min-w-0">
                    <div className="flex items-start gap-2 flex-wrap mb-1.5">
                      <span className="text-white font-semibold text-sm group-hover:text-teal-200 transition-colors leading-tight">
                        {c.title}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      <span className={`text-xs px-1.5 py-0.5 rounded-full border ${DIFF_COLORS[c.difficulty]}`}>
                        {DIFF_LABELS[c.difficulty]}
                      </span>
                      {completed && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Concluído
                        </span>
                      )}
                    </div>
                    <p className="text-white/50 text-xs line-clamp-2 leading-relaxed">{c.scenario}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs">{cat.icon}</span>
                      <span className="text-xs text-teal-400">{cat.label}</span>
                      <span className="text-white/30 text-xs">•</span>
                      <span className="text-xs text-yellow-400/70">
                        até {c.choices.find((x) => x.isCorrect)?.points} pts
                      </span>
                      <span className="ml-auto text-teal-400 group-hover:text-teal-300 text-sm transition-colors">→</span>
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
