import { HashRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { hasSave, clearSave } from "../game/utils/save";
import { playSound } from "../game/utils/audio";

export function AppUI({ onStartGame }: { onStartGame: () => void }) {
  return (
    <HashRouter>
      <RoutesWrapper onStartGame={onStartGame} />
    </HashRouter>
  );
}

function RoutesWrapper({ onStartGame }: { onStartGame: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();

  // Expose navigation to window for Phaser to trigger pauses
  useEffect(() => {
    (window as any).reactNavigate = navigate;
    return () => { delete (window as any).reactNavigate; }
  }, [navigate]);

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<HomeMenu onStartGame={onStartGame} />} />
        <Route path="/pause" element={<PauseMenu />} />
      </Routes>
    </AnimatePresence>
  );
}

function HomeMenu({ onStartGame }: { onStartGame: () => void }) {
  const navigate = useNavigate();
  const [showHelp, setShowHelp] = useState(false);
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 pointer-events-none"
    >
        {/* We place interactive UI over the Phaser menu scene (which plays in bg) */}
        {!showHelp ? (
          <div className="absolute right-[8%] top-1/2 -translate-y-1/2 flex flex-col gap-4 pointer-events-auto w-80">
            {hasSave() && (
              <motion.button 
                onMouseEnter={() => playSound('hover')}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  playSound('click');
                  onStartGame();
                  navigate('/game');
                }}
                className="flex items-center justify-center gap-3 bg-indigo-500 text-white px-8 py-4 rounded-xl shadow-[0_4px_0_#312e81] border-2 border-white font-['Press_Start_2P',_monospace] tracking-widest text-sm hover:bg-indigo-400"
              >
                CONTINUAR
              </motion.button>
            )}

            <motion.button 
              onMouseEnter={() => playSound('hover')}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                playSound('click');
                clearSave();
                onStartGame();
                navigate('/game');
              }}
              className="flex items-center justify-center gap-3 bg-[#1abc9c] text-white px-8 py-4 rounded-xl shadow-[0_4px_0_#0e6252] border-2 border-white font-['Press_Start_2P',_monospace] tracking-widest text-sm hover:bg-[#1dd2af]"
            >
              NOVO JOGO
            </motion.button>

            <motion.button 
              onMouseEnter={() => playSound('hover')}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                playSound('click');
                setShowHelp(true);
              }}
              className="flex items-center justify-center gap-3 bg-[#f39c12] text-white px-8 py-4 rounded-xl shadow-[0_4px_0_#a66705] border-2 border-white font-['Press_Start_2P',_monospace] tracking-widest text-sm hover:bg-[#f4a62a]"
            >
              COMO JOGAR
            </motion.button>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto bg-[#0a1628]/95 border-4 border-teal-500 rounded-2xl p-8 max-w-lg w-full shadow-2xl flex flex-col items-center gap-6"
          >
            <h2 className="text-2xl font-mono text-teal-400 font-bold">COMO JOGAR — HUAP/UFF</h2>
            <div className="text-teal-50 font-mono text-sm space-y-2 text-center">
              <p>🎮 WASD / Setas — Mover</p>
              <p>🏃 SHIFT — Correr (consome energia)</p>
              <p>💬 E — Falar com NPC / Interagir</p>
              <p>📋 M — Ver missões e progresso</p>
              <p>⏸️ ESC — Pausar / Voltar ao menu</p>
              <br/>
              <p>Explore o HUAP, fale com os profissionais e complete missões para ganhar Prestígio.</p>
              <br/>
              <p className="text-orange-400">🚨 CRISES: Eventos aleatórios precisam de decisão rápida — escolha com cuidado!</p>
              <p className="text-green-400">⚡ Energia: descanse na Copa (+6/s)</p>
              <p className="text-red-400">😰 Estresse: reduza no jardim ou copa</p>
            </div>
            <motion.button 
               onMouseEnter={() => playSound('hover')}
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.95 }}
               onClick={() => {
                 playSound('click');
                 setShowHelp(false);
               }}
               className="mt-4 px-8 py-3 rounded-lg bg-teal-600/20 text-teal-300 border-2 border-teal-500/50 hover:bg-teal-500 hover:text-white font-mono font-bold"
            >
              VOLTAR
            </motion.button>
          </motion.div>
        )}
    </motion.div>
  );
}

function PauseMenu() {
  const navigate = useNavigate();
  return (
    <motion.div 
      initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
      animate={{ opacity: 1, backdropFilter: 'blur(8px)' }}
      exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 pointer-events-auto"
    >
      <div className="bg-[#0a1628] border-4 border-teal-500 rounded-2xl p-8 max-w-sm w-full shadow-2xl flex flex-col items-center gap-6">
        <h2 className="text-3xl font-mono text-teal-400 font-bold mb-4">PAUSADO</h2>
        
        <motion.button 
           onMouseEnter={() => playSound('hover')}
           whileHover={{ scale: 1.02 }}
           whileTap={{ scale: 0.98 }}
           onClick={() => {
              playSound('click');
              navigate('/game');
              (window as any).phaserGame?.scene.resume('GameScene');
              (window as any).phaserGame?.scene.resume('HUDScene');
           }}
           className="w-full py-4 rounded-lg bg-teal-600/20 text-teal-300 border-2 border-teal-500/50 hover:bg-teal-500 hover:text-white font-mono font-bold text-lg transition-colors"
        >
          RETOMAR JOGO
        </motion.button>

        <motion.button 
           onMouseEnter={() => playSound('hover')}
           whileHover={{ scale: 1.02 }}
           whileTap={{ scale: 0.98 }}
           onClick={() => {
              playSound('click');
              navigate('/');
              (window as any).phaserGame?.scene.stop('HUDScene');
              (window as any).phaserGame?.scene.stop('DialogScene');
              (window as any).phaserGame?.scene.stop('GameScene');
              (window as any).phaserGame?.scene.start('MenuScene');
           }}
           className="w-full py-4 rounded-lg bg-red-600/20 text-red-400 border-2 border-red-500/50 hover:bg-red-500 hover:text-white font-mono font-bold text-lg transition-colors"
        >
          SAIR PARA MENU
        </motion.button>
      </div>
    </motion.div>
  );
}
