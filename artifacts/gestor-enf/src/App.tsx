import { useEffect, useRef } from "react";
import * as Phaser from "phaser";
import { createGameConfig } from "./game/config";

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;
    const config = createGameConfig(containerRef.current);
    gameRef.current = new Phaser.Game(config);
    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return <div id="game-container" ref={containerRef} />;
}
