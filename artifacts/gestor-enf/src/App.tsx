import { useEffect, useRef } from "react";
import * as Phaser from "phaser";
import { createGameConfig } from "./game/config";
import { AppUI } from "./ui/AppUI";

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    // We instantiate Phaser ONCE. It runs independently underneath the React Router overlay.
    if (!containerRef.current || gameRef.current) return;
    const config = createGameConfig(containerRef.current);
    const game = new Phaser.Game(config);
    gameRef.current = game;
    (window as any).phaserGame = game;

    return () => {
      game.destroy(true);
      gameRef.current = null;
      delete (window as any).phaserGame;
    };
  }, []);

  const handleStartGame = () => {
    if (gameRef.current) {
      // In Phaser, the MenuScene shows the buttons. But we will hide them there
      // and use React buttons instead to trigger transition.
      const menu = gameRef.current.scene.getScene('MenuScene') as any;
      if (menu && menu.startGame) {
         menu.startGame();
      }
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0a0a0f]">
      {/* Phaser Canvas Container */}
      <div id="game-container" ref={containerRef} className="absolute inset-0 z-0" />
      
      {/* React UI / Router overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <AppUI onStartGame={handleStartGame} />
      </div>
    </div>
  );
}
