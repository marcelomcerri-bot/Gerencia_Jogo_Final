import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { type Case, CATEGORIES } from "@/data/cases";
import { SceneSelector } from "./scenes/SceneSelector";
import { PointExplosion } from "./PointExplosion";

interface CaseViewProps {
  gameCase: Case;
  alreadyCompleted: boolean;
  onAnswer: (choiceId: string, points: number, isCorrect: boolean) => void;
  onBack: () => void;
}

const DIFF_COLORS = {
  facil: "text-emerald-300 border-emerald-500/30 bg-emerald-500/10",
  medio: "text-yellow-300 border-yellow-500/30 bg-yellow-500/10",
  dificil: "text-red-300 border-red-500/30 bg-red-500/10",
};
const DIFF_LABELS = { facil: "Fácil", medio: "Médio", dificil: "Difícil" };

export function CaseView({ gameCase, alreadyCompleted, onAnswer, onBack }: CaseViewProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const [explosionTrigger, setExplosionTrigger] = useState(0);
  const [explosionPoints, setExplosionPoints] = useState(0);
  const [explosionCorrect, setExplosionCorrect] = useState(false);

  const cat = CATEGORIES[gameCase.category];
  const selectedChoice = gameCase.choices.find((c) => c.id === selected);

  function handleSelect(id: string) {
    if (showFeedback || alreadyCompleted) return;
    setSelected(id);
  }

  function handleConfirm() {
    if (!selected || showFeedback) return;
    const choice = gameCase.choices.find((c) => c.id === selected)!;
    setShowFeedback(true);
    setExplosionPoints(choice.points);
    setExplosionCorrect(choice.isCorrect);
    setExplosionTrigger((t) => t + 1);
    onAnswer(choice.id, choice.points, choice.isCorrect);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <PointExplosion points={explosionPoints} isCorrect={explosionCorrect} trigger={explosionTrigger} />

      {/* Back */}
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={onBack}
        className="flex items-center gap-2 text-teal-400 hover:text-teal-300 text-sm mb-6 transition-colors"
      >
        ← Voltar aos casos
      </motion.button>

      {/* Animated Scene Illustration */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <SceneSelector caseId={gameCase.id} category={gameCase.category} />
      </motion.div>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <span className="text-2xl">{cat.icon}</span>
          <span className="text-teal-300 text-sm font-medium">{cat.label}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full border ${DIFF_COLORS[gameCase.difficulty]}`}>
            {DIFF_LABELS[gameCase.difficulty]}
          </span>
          {alreadyCompleted && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Já respondido
            </span>
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{gameCase.title}</h1>
        <div className="flex flex-wrap gap-2">
          {gameCase.keywords.map((kw) => (
            <span key={kw} className="text-xs px-2 py-0.5 rounded-full bg-teal-800/50 text-teal-300/70 border border-teal-700/30">
              {kw}
            </span>
          ))}
        </div>
      </motion.div>

      {/* Scenario */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="bg-teal-800/30 border border-teal-700/40 rounded-2xl p-5 mb-4">
        <h2 className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-3">Cenário</h2>
        <p className="text-white/90 leading-relaxed text-sm sm:text-base">{gameCase.scenario}</p>
      </motion.div>

      {/* Context toggle */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mb-6">
        <button
          onClick={() => setShowContext(!showContext)}
          className="text-sm text-teal-400 hover:text-teal-300 flex items-center gap-1 transition-colors"
        >
          <motion.span animate={{ rotate: showContext ? 90 : 0 }} transition={{ duration: 0.2 }}>▶</motion.span>
          Informações do Contexto
        </button>
        <AnimatePresence>
          {showContext && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 bg-blue-900/20 border border-blue-700/30 rounded-xl p-4">
                <p className="text-white/80 text-sm leading-relaxed">{gameCase.context}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Question */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="mb-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h2 className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-3">Decisão Gerencial</h2>
          <p className="text-white font-medium leading-relaxed">{gameCase.question}</p>
        </div>
      </motion.div>

      {/* Choices */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="space-y-3 mb-6">
        {gameCase.choices.map((choice, i) => {
          let borderClass = "border-teal-700/40 bg-teal-800/20 hover:border-teal-500/50 hover:bg-teal-800/40";
          if (selected === choice.id && !showFeedback) borderClass = "border-teal-400 bg-teal-700/40";
          if (showFeedback || alreadyCompleted) {
            if (choice.isCorrect) borderClass = "border-emerald-400 bg-emerald-900/30";
            else if (selected === choice.id && !choice.isCorrect) borderClass = "border-red-400 bg-red-900/30";
            else borderClass = "border-teal-700/20 bg-teal-800/10 opacity-40";
          }

          return (
            <motion.button
              key={choice.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i + 0.3 }}
              whileHover={!showFeedback && !alreadyCompleted ? { scale: 1.01, x: 4 } : {}}
              whileTap={!showFeedback && !alreadyCompleted ? { scale: 0.99 } : {}}
              onClick={() => handleSelect(choice.id)}
              disabled={showFeedback || alreadyCompleted}
              className={`w-full text-left rounded-xl border p-4 transition-all duration-200 ${borderClass} ${showFeedback || alreadyCompleted ? "cursor-default" : "cursor-pointer"}`}
            >
              <div className="flex items-start gap-3">
                <span className={`shrink-0 w-6 h-6 rounded-full border text-xs font-bold flex items-center justify-center mt-0.5
                  ${showFeedback || alreadyCompleted
                    ? choice.isCorrect ? "border-emerald-400 text-emerald-300 bg-emerald-500/20"
                    : selected === choice.id ? "border-red-400 text-red-300 bg-red-500/20"
                    : "border-white/20 text-white/30"
                    : selected === choice.id ? "border-teal-400 text-teal-300 bg-teal-500/20"
                    : "border-white/30 text-white/50"}`}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                <p className="text-white/85 text-sm leading-relaxed">{choice.text}</p>
                {(showFeedback || alreadyCompleted) && choice.isCorrect && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="shrink-0 text-emerald-400 ml-auto text-lg"
                  >
                    ✓
                  </motion.span>
                )}
                {showFeedback && selected === choice.id && !choice.isCorrect && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="shrink-0 text-red-400 ml-auto text-lg"
                  >
                    ✗
                  </motion.span>
                )}
              </div>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Confirm */}
      {!showFeedback && !alreadyCompleted && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <motion.button
            onClick={handleConfirm}
            disabled={!selected}
            whileHover={selected ? { scale: 1.02 } : {}}
            whileTap={selected ? { scale: 0.98 } : {}}
            className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200
              ${selected ? "bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white shadow-lg cursor-pointer" : "bg-teal-900/40 text-white/30 cursor-not-allowed"}`}
          >
            {selected ? "Confirmar Decisão" : "Selecione uma alternativa"}
          </motion.button>
        </motion.div>
      )}

      {/* Feedback */}
      <AnimatePresence>
        {(showFeedback || alreadyCompleted) && selectedChoice && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-4">
            {/* Result banner */}
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className={`rounded-2xl p-4 border ${selectedChoice.isCorrect ? "bg-emerald-900/30 border-emerald-500/40" : "bg-red-900/20 border-red-500/30"}`}
            >
              <div className="flex items-center gap-3 mb-2">
                <motion.span
                  className="text-3xl"
                  initial={{ rotate: -20, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {selectedChoice.isCorrect ? "🎉" : "💡"}
                </motion.span>
                <div>
                  <div className={`font-bold ${selectedChoice.isCorrect ? "text-emerald-300" : "text-red-300"}`}>
                    {selectedChoice.isCorrect ? "Excelente decisão!" : "Não foi a melhor escolha"}
                  </div>
                  <div className="text-xs text-white/50">{selectedChoice.points} pontos ganhos</div>
                </div>
                <motion.div
                  className="ml-auto text-2xl font-black"
                  initial={{ scale: 0, y: 10 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ delay: 0.3, type: "spring" }}
                  style={{ color: selectedChoice.isCorrect ? "#fbbf24" : "#f87171" }}
                >
                  +{selectedChoice.points}
                </motion.div>
              </div>
            </motion.div>

            {/* Feedback text */}
            <div className="bg-teal-800/30 border border-teal-700/40 rounded-2xl p-5">
              <h3 className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-3">Feedback Pedagógico</h3>
              <p className="text-white/90 text-sm leading-relaxed mb-4">{selectedChoice.feedback}</p>
              <div className="flex items-start gap-2 bg-blue-900/20 border border-blue-700/30 rounded-xl p-3">
                <span className="text-blue-400 shrink-0 text-sm">📚</span>
                <p className="text-blue-300/80 text-xs leading-relaxed">{selectedChoice.reference}</p>
              </div>
            </div>

            {/* Learning objective */}
            <div className="bg-purple-900/20 border border-purple-700/30 rounded-xl p-4">
              <h3 className="text-purple-300/70 text-xs font-semibold uppercase tracking-widest mb-2">Objetivo de Aprendizagem</h3>
              <p className="text-white/80 text-sm">{gameCase.learningObjective}</p>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onBack}
              className="w-full py-3 rounded-xl font-semibold text-sm bg-teal-700/60 hover:bg-teal-600/60 text-white transition-colors"
            >
              Voltar aos Casos →
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {alreadyCompleted && !selected && (
        <div className="mt-4 text-center text-white/50 text-sm">
          Selecione uma alternativa para ver o feedback completo.
        </div>
      )}
    </div>
  );
}
