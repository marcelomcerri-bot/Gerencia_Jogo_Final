import * as Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from './constants';
import { BootScene }   from './scenes/BootScene';
import { MenuScene }   from './scenes/MenuScene';
import { GameScene }   from './scenes/GameScene';
import { HUDScene }    from './scenes/HUDScene';
import { DialogScene } from './scenes/DialogScene';

export function createGameConfig(
  parent: HTMLElement,
  scaleMode: 'fit' | 'none' = 'fit'
): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent,
    backgroundColor: '#0a0a0f',
    pixelArt: true,
    antialias: false,
    roundPixels: true,
    render: {
      preserveDrawingBuffer: true,
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
        fixedStep: false,
        fps: 60,
      },
    },
    scene: [BootScene, MenuScene, GameScene, HUDScene, DialogScene],
    scale: scaleMode === 'none'
      ? {
          // Scale.NONE: Phaser does NOT measure the parent via getBoundingClientRect.
          // The canvas is exactly GAME_WIDTH × GAME_HEIGHT CSS pixels.
          // We handle all scaling/centering via CSS transforms on wrapper elements.
          mode: Phaser.Scale.NONE,
          width: GAME_WIDTH,
          height: GAME_HEIGHT,
        }
      : {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
          width: GAME_WIDTH,
          height: GAME_HEIGHT,
        },
    input: {
      keyboard: true,
      mouse: true,
      touch: true,
    },
  };
}
