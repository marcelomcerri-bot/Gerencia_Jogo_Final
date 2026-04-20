import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FAQ } from "@/data/cases";

interface FAQViewProps {
  onBack: () => void;
}

export function FAQView({ onBack }: FAQViewProps) {
  const [open, setOpen] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = FAQ.filter(
    (f) =>
      f.question.toLowerCase().includes(search.toLowerCase()) ||
      f.answer.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-teal-400 hover:text-teal-300 text-sm mb-6 transition-colors"
      >
        ← Voltar
      </button>

      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-white mb-2">Banco de Dúvidas</h1>
        <p className="text-white/50 text-sm mb-6">
          Conceitos essenciais de Gerência de Enfermagem II com embasamento teórico.
        </p>

        <div className="mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar dúvidas..."
            className="w-full bg-teal-800/40 border border-teal-700/40 rounded-xl px-4 py-3 text-white placeholder-white/30 outline-none focus:border-teal-500/60 transition-colors text-sm"
          />
        </div>

        <div className="space-y-3">
          {filtered.map((faq, i) => (
            <motion.div
              key={faq.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              className="bg-teal-800/30 border border-teal-700/40 rounded-2xl overflow-hidden"
            >
              <button
                onClick={() => setOpen(open === faq.id ? null : faq.id)}
                className="w-full text-left px-5 py-4 flex items-center gap-3 hover:bg-teal-700/20 transition-colors"
              >
                <span className="text-teal-400 text-lg shrink-0">❓</span>
                <span className="text-white font-medium text-sm flex-1">{faq.question}</span>
                <span className="text-white/40 shrink-0 transition-transform duration-200" style={{ transform: open === faq.id ? "rotate(180deg)" : "rotate(0deg)" }}>
                  ▼
                </span>
              </button>

              <AnimatePresence>
                {open === faq.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 pt-1 border-t border-teal-700/30">
                      <p className="text-white/80 text-sm leading-relaxed mb-4">{faq.answer}</p>
                      <div className="flex items-start gap-2 bg-blue-900/20 border border-blue-700/30 rounded-xl p-3">
                        <span className="text-blue-400 text-sm">📚</span>
                        <p className="text-blue-300/80 text-xs">{faq.reference}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-12 text-white/40">
              Nenhuma dúvida encontrada para "{search}"
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
