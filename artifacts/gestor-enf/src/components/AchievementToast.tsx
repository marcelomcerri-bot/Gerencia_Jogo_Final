import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface AchievementToastProps {
  achievement: { title: string; description: string; icon: string } | null;
  onDone: () => void;
}

export function AchievementToast({ achievement, onDone }: AchievementToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (achievement) {
      setVisible(true);
      const t = setTimeout(() => {
        setVisible(false);
        setTimeout(onDone, 400);
      }, 3000);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [achievement]);

  return (
    <AnimatePresence>
      {visible && achievement && (
        <motion.div
          initial={{ opacity: 0, y: -60, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -40, scale: 0.9 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-yellow-400 text-yellow-900 rounded-2xl px-6 py-3 shadow-2xl flex items-center gap-3 max-w-xs"
        >
          <span className="text-2xl">{achievement.icon}</span>
          <div>
            <div className="font-bold text-sm">Conquista desbloqueada!</div>
            <div className="text-xs font-semibold">{achievement.title}</div>
            <div className="text-xs opacity-70">{achievement.description}</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
