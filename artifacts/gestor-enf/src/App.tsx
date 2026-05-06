import { useEffect, useLayoutEffect, useRef, useState } from "react";
import * as Phaser from "phaser";
import { createGameConfig } from "./game/config";
import { AppUI } from "./ui/AppUI";
import { GAME_WIDTH, GAME_HEIGHT } from "./game/constants";

function isPortraitMobile() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  return Math.min(vw, vh) < 768 && vh > vw;
}

/**
 * Compute layout values for portrait-mobile landscape rotation.
 *
 * Strategy:
 *   1. Outer wrapper  – landscape dims (vh × vw), rotated 90° CW to fill portrait screen.
 *   2. Inner scaler   – game natural resolution (1280×720), CSS-scaled to fit the
 *                       landscape area and centred within the outer wrapper.
 *   3. AppUI overlay  – placed INSIDE the inner scaler so all menus/controls are in
 *                       game (landscape) coordinate space and appear correctly oriented.
 *   4. Phaser uses Scale.NONE; the canvas is always exactly GAME_WIDTH×GAME_HEIGHT CSS px.
 */
function getPortraitLayout() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const lw = vh;
  const lh = vw;

  const scale = Math.min(lw / GAME_WIDTH, lh / GAME_HEIGHT);

  const scaledW = GAME_WIDTH * scale;
  const scaledH = GAME_HEIGHT * scale;

  const outerStyle: React.CSSProperties = {
    position: "fixed",
    width: `${lw}px`,
    height: `${lh}px`,
    top: `${(vh - lh) / 2}px`,
    left: `${(vw - lw) / 2}px`,
    transform: "rotate(90deg)",
    transformOrigin: "center center",
    overflow: "hidden",
    background: "#0a0a0f",
  };

  const innerStyle: React.CSSProperties = {
    position: "absolute",
    width: `${GAME_WIDTH}px`,
    height: `${GAME_HEIGHT}px`,
    left: `${(lw - scaledW) / 2}px`,
    top: `${(lh - scaledH) / 2}px`,
    transform: `scale(${scale})`,
    transformOrigin: "top left",
  };

  return { outerStyle, innerStyle, scale };
}

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [portrait, setPortrait] = useState(() => isPortraitMobile());

  useEffect(() => {
    const ori = screen.orientation as ScreenOrientation & {
      lock?: (o: string) => Promise<void>;
    };
    ori?.lock?.("landscape").catch(() => {});

    const onResize = () => setPortrait(isPortraitMobile());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useLayoutEffect(() => {
    if (!containerRef.current) return;

    if (gameRef.current) {
      gameRef.current.destroy(true);
      gameRef.current = null;
    }

    (window as any).__portraitMobile = portrait;

    const config = createGameConfig(
      containerRef.current,
      portrait ? "none" : "fit"
    );
    const game = new Phaser.Game(config);
    gameRef.current = game;
    (window as any).phaserGame = game;

    return () => {
      game.destroy(true);
      gameRef.current = null;
      delete (window as any).phaserGame;
    };
  }, [portrait]);

  const handleStartGame = () => {
    if ((window as any).triggerStartGame) {
      (window as any).triggerStartGame();
    } else {
      const menu = gameRef.current?.scene.getScene("MenuScene") as any;
      if (menu?.startGame) menu.startGame();
    }
  };

  // -------------------------------------------------------------------------
  // Portrait mobile: AppUI lives INSIDE the rotated+scaled wrapper so all
  // menus and controls render in landscape (game) coordinate space.
  // Modern Chrome Android correctly maps touch events through CSS transforms.
  // -------------------------------------------------------------------------
  if (portrait) {
    const { outerStyle, innerStyle, scale } = getPortraitLayout();

    return (
      <div style={outerStyle}>
        <div style={innerStyle}>
          <div id="game-container" ref={containerRef} style={{ position: "absolute", inset: 0 }} />
          <div style={{ position: "absolute", inset: 0, zIndex: 100, pointerEvents: "none" }}>
            <AppUI onStartGame={handleStartGame} isMobile={true} mobileScale={scale} />
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Desktop / landscape: normal Scale.FIT fills the viewport
  // -------------------------------------------------------------------------
  return (
    <div
      style={{ position: "fixed", inset: 0 }}
      className="overflow-hidden bg-[#0a0a0f]"
    >
      <div id="game-container" ref={containerRef} className="absolute inset-0 z-0" />
      <div className="absolute inset-0 z-10 pointer-events-none">
        <AppUI onStartGame={handleStartGame} />
      </div>
    </div>
  );
}
