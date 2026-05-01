import { useEffect, useLayoutEffect, useRef, useState } from "react";
import * as Phaser from "phaser";
import { createGameConfig } from "./game/config";
import { AppUI } from "./ui/AppUI";

function getLandscapeStyle(): React.CSSProperties {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const isMobile = Math.min(vw, vh) < 768;
  const isPortrait = vh > vw;

  if (!isMobile || !isPortrait) {
    // Desktop / already landscape — fill viewport normally
    return { position: "fixed", inset: 0 };
  }

  // Portrait mobile with rotation lock: rotate the wrapper so the
  // game fills the screen in landscape orientation.
  // Logical size of the wrapper: vh × vw (swapped = landscape)
  // Position it so its center aligns with the viewport center.
  return {
    position: "fixed",
    width: `${vh}px`,
    height: `${vw}px`,
    top: `${(vh - vw) / 2}px`,
    left: `${(vw - vh) / 2}px`,
    transform: "rotate(90deg)",
    transformOrigin: "center center",
  };
}

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  // Compute once synchronously so the DOM is correct on first paint
  const [wrapperStyle, setWrapperStyle] = useState<React.CSSProperties>(
    () => getLandscapeStyle()
  );

  // Re-calculate on resize / orientation change
  useEffect(() => {
    // Try to lock orientation via API (works in Chrome Android PWA / fullscreen)
    const orientation = screen.orientation as ScreenOrientation & {
      lock?: (o: string) => Promise<void>;
    };
    if (orientation?.lock) {
      orientation.lock("landscape").catch(() => {});
    }

    const onResize = () => {
      setWrapperStyle(getLandscapeStyle());
      // Give the DOM time to reflow before asking Phaser to re-fit
      setTimeout(() => gameRef.current?.scale.refresh(), 80);
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);

  // Init Phaser after the wrapper dimensions are in the DOM (useLayoutEffect
  // runs synchronously after DOM mutations, before paint)
  useLayoutEffect(() => {
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
      const menu = gameRef.current.scene.getScene("MenuScene") as any;
      if (menu && menu.startGame) {
        menu.startGame();
      }
    }
  };

  return (
    <div style={wrapperStyle} className="overflow-hidden bg-[#0a0a0f]">
      {/* Phaser Canvas Container */}
      <div
        id="game-container"
        ref={containerRef}
        className="absolute inset-0 z-0"
      />

      {/* React UI / Router overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <AppUI onStartGame={handleStartGame} />
      </div>
    </div>
  );
}
