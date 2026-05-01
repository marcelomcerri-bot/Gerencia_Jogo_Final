import * as Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SCENES } from './constants';
import { BootScene }   from './scenes/BootScene';
import { MenuScene }   from './scenes/MenuScene';
import { GameScene }   from './scenes/GameScene';
import { HUDScene }    from './scenes/HUDScene';
import { DialogScene } from './scenes/DialogScene';

export function createGameConfig(parent: HTMLElement): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent,
    backgroundColor: '#0a0a0f',
    pixelArt: true,
    antialias: false,
    roundPixels: true,
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
    scale: {
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
