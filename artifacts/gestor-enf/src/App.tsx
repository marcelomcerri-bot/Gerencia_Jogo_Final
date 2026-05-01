import { useEffect, useLayoutEffect, useRef, useState } from "react";
import * as Phaser from "phaser";
import { createGameConfig } from "./game/config";
import { AppUI } from "./ui/AppUI";
import { GAME_WIDTH, GAME_HEIGHT } from "./game/constants";

// ---------------------------------------------------------------------------
// Layout helpers
// ---------------------------------------------------------------------------

function isPortraitMobile() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  return Math.min(vw, vh) < 768 && vh > vw;
}

/**
 * Compute all layout values needed for portrait-mobile landscape rotation.
 *
 * Strategy (portrait-mobile only):
 *   1. Outer wrapper  – landscape dims (vh × vw), rotated 90° to fill portrait screen.
 *   2. Inner scaler   – game natural resolution (1280×720), CSS-scaled down to fit the
 *                       landscape area and centred within the outer wrapper.
 *   3. Phaser uses Scale.NONE so it never calls getBoundingClientRect(); the canvas is
 *      always exactly GAME_WIDTH × GAME_HEIGHT CSS pixels, and all downscaling is CSS-only.
 */
function getPortraitLayout() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Available landscape area (the portrait screen rotated 90°)
  const lw = vh; // landscape width  = phone height
  const lh = vw; // landscape height = phone width

  // Scale factor to fit game resolution into landscape area (maintain aspect ratio)
  const scale = Math.min(lw / GAME_WIDTH, lh / GAME_HEIGHT);

  // Visual game size after scaling
  const scaledW = GAME_WIDTH * scale;  // e.g. 640
  const scaledH = GAME_HEIGHT * scale; // e.g. 360

  // Outer wrapper: landscape-sized, centred in the portrait viewport, then rotated
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

  // Inner scaler: game at native resolution (1280×720), CSS-scaled and centred.
  //
  // With transform-origin: top left, scale() shrinks from the top-left corner.
  // So we just position the top-left of the element so that the shrunken visual
  // content ends up centred in the outer wrapper.
  //   left = (lw - scaledW) / 2   e.g. (780 - 640) / 2 = 70 px
  //   top  = (lh - scaledH) / 2   e.g. (360 - 360) / 2 = 0 px
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [portrait, setPortrait] = useState(() => isPortraitMobile());

  // Attempt OS-level orientation lock (works in Chrome Android PWA / fullscreen)
  useEffect(() => {
    const ori = screen.orientation as ScreenOrientation & {
      lock?: (o: string) => Promise<void>;
    };
    ori?.lock?.("landscape").catch(() => {});

    const onResize = () => setPortrait(isPortraitMobile());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Init (or re-init) Phaser whenever the portrait flag changes
  useLayoutEffect(() => {
    if (!containerRef.current) return;

    // Destroy previous instance if orientation changed
    if (gameRef.current) {
      gameRef.current.destroy(true);
      gameRef.current = null;
    }

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
    const menu = gameRef.current?.scene.getScene("MenuScene") as any;
    if (menu?.startGame) menu.startGame();
  };

  // -------------------------------------------------------------------------
  // Portrait mobile: outer rotate + inner scale wrappers
  // -------------------------------------------------------------------------
  if (portrait) {
    const { outerStyle, innerStyle } = getPortraitLayout();

    return (
      <div style={outerStyle}>
        <div style={innerStyle}>
          {/* Phaser canvas injected here (Scale.NONE → 1280×720 CSS px) */}
          <div
            id="game-container"
            ref={containerRef}
            style={{ position: "absolute", inset: 0 }}
          />
          {/* React UI rendered in the same 1280×720 logical space */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 10,
              pointerEvents: "none",
            }}
          >
            <AppUI onStartGame={handleStartGame} />
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
