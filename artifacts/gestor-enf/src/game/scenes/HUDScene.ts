import * as Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SCENES, EVENTS, MAP_COLS, MAP_ROWS, TILE_SIZE, CAREER_LEVELS } from '../constants';
import { getLevelInfo } from '../data/gameData';
import type { GameState } from '../data/gameData';
import { generateMapTiles, ROOM_FLOOR_COLORS_HUD } from './HUDMinimapHelper';

const MM_SCALE = 3;
const MM_W = MAP_COLS * MM_SCALE;
const MM_H = MAP_ROWS * MM_SCALE;
const MM_X = GAME_WIDTH - 12 - MM_W;
const MM_Y = 12;

export class HUDScene extends Phaser.Scene {
  // Time / shift
  private timeText!: Phaser.GameObjects.Text;
  private dayText!: Phaser.GameObjects.Text;
  private shiftIcon!: Phaser.GameObjects.Text;

  // Energy
  private energyBarFill!: Phaser.GameObjects.Graphics;
  private energyValText!: Phaser.GameObjects.Text;

  // Stress
  private stressBarFill!: Phaser.GameObjects.Graphics;
  private stressValText!: Phaser.GameObjects.Text;

  // Career
  private prestigeText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private careerBarFill!: Phaser.GameObjects.Graphics;

  // Mission
  private missionText!: Phaser.GameObjects.Text;

  // Minimap
  private minimapGfx!: Phaser.GameObjects.Graphics;
  private playerDot!: Phaser.GameObjects.Graphics;
  private mapData: number[][] = [];

  // Hint + room
  private hintText!: Phaser.GameObjects.Text;
  private roomLabel!: Phaser.GameObjects.Text;
  private roomLabelBg!: Phaser.GameObjects.Graphics;

  // Alert banner
  private alertBanner: Phaser.GameObjects.Container | null = null;

  constructor() { super({ key: SCENES.HUD, active: false }); }

  create() {
    this.mapData = generateMapTiles();
    this.buildMinimap();
    this.buildTopBar();
    this.buildBottomHint();
    this.buildRoomLabel();

    const gameScene = this.scene.get(SCENES.GAME);
    gameScene.events.on(EVENTS.HUD_UPDATE, this.onHudUpdate, this);
    gameScene.events.on(EVENTS.INTERACTION_HINT, this.onHint, this);
    gameScene.events.on(EVENTS.ROOM_CHANGE, this.onRoomChange, this);
  }

  // ── MINIMAP ───────────────────────────────────────────────────────────────
  private buildMinimap() {
    // Shadow
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.4);
    shadow.fillRoundedRect(MM_X - 2, MM_Y - 2, MM_W + 16, MM_H + 24, 10);

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(0x1a252f, 1);
    bg.fillRoundedRect(MM_X - 6, MM_Y - 6, MM_W + 12, MM_H + 28, 10);
    bg.lineStyle(2, 0xf39c12, 1);
    bg.strokeRoundedRect(MM_X - 6, MM_Y - 6, MM_W + 12, MM_H + 28, 10);

    this.minimapGfx = this.add.graphics();
    this.drawMinimap();

    // Player dot (animated)
    this.playerDot = this.add.graphics().setDepth(5);

    // Label
    this.add.text(MM_X + MM_W / 2, MM_Y + MM_H + 8, 'MAPA HUAP', {
      fontFamily: 'monospace', fontSize: '9px', color: '#f39c12', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5, 0);
  }

  private drawMinimap() {
    this.minimapGfx.clear();
    for (let r = 0; r < MAP_ROWS; r++) {
      for (let c = 0; c < MAP_COLS; c++) {
        const tid = this.mapData[r][c];
        const col = ROOM_FLOOR_COLORS_HUD[tid] ?? 0x333344;
        this.minimapGfx.fillStyle(col, 1);
        this.minimapGfx.fillRect(MM_X + c * MM_SCALE, MM_Y + r * MM_SCALE, MM_SCALE, MM_SCALE);
      }
    }
  }

  // ── TOP BAR ───────────────────────────────────────────────────────────────
  private buildTopBar() {
    const barW = MM_X - 28;
    const barH = 76;
    const bx = 14, by = 12;

    // Shadow
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.3);
    shadow.fillRoundedRect(bx + 4, by + 4, barW, barH, 14);

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(0x0a1628, 0.96);
    bg.fillRoundedRect(bx, by, barW, barH, 14);
    bg.lineStyle(2, 0x1abc9c, 0.8);
    bg.strokeRoundedRect(bx, by, barW, barH, 14);

    // ── Section: Day/Time ──
    const secBg1 = this.add.graphics();
    secBg1.fillStyle(0x152840, 1);
    secBg1.fillRoundedRect(bx + 8, by + 7, 128, barH - 14, 8);

    this.shiftIcon = this.add.text(bx + 16, by + 20, '☀️', { fontSize: '20px' });

    this.dayText = this.add.text(bx + 42, by + 16, 'DIA 1', {
      fontFamily: 'monospace', fontSize: '10px', color: '#3498db',
    });

    this.timeText = this.add.text(bx + 42, by + 32, '08:00', {
      fontFamily: "'VT323', monospace", fontSize: '28px', color: '#f1c40f',
    });

    // ── Section: Energy ──
    const secBg2 = this.add.graphics();
    secBg2.fillStyle(0x152840, 1);
    secBg2.fillRoundedRect(bx + 148, by + 7, 178, barH - 14, 8);

    this.add.text(bx + 156, by + 16, '⚡ ENERGIA', {
      fontFamily: 'monospace', fontSize: '10px', color: '#2ecc71',
    });

    const energyBg = this.add.graphics();
    energyBg.fillStyle(0x0a1628, 1);
    energyBg.fillRoundedRect(bx + 156, by + 36, 130, 16, 8);

    this.energyBarFill = this.add.graphics();

    this.energyValText = this.add.text(bx + 220, by + 27, '100%', {
      fontFamily: "'VT323', monospace", fontSize: '16px', color: '#2ecc71',
    }).setOrigin(0.5, 0);

    // ── Section: Stress ──
    const secBg3 = this.add.graphics();
    secBg3.fillStyle(0x152840, 1);
    secBg3.fillRoundedRect(bx + 338, by + 7, 168, barH - 14, 8);

    this.add.text(bx + 346, by + 16, '😰 ESTRESSE', {
      fontFamily: 'monospace', fontSize: '10px', color: '#e74c3c',
    });

    const stressBg = this.add.graphics();
    stressBg.fillStyle(0x0a1628, 1);
    stressBg.fillRoundedRect(bx + 346, by + 36, 120, 16, 8);

    this.stressBarFill = this.add.graphics();

    this.stressValText = this.add.text(bx + 406, by + 27, '0%', {
      fontFamily: "'VT323', monospace", fontSize: '16px', color: '#e74c3c',
    }).setOrigin(0.5, 0);

    // ── Section: Career ──
    const secBg4 = this.add.graphics();
    secBg4.fillStyle(0x152840, 1);
    secBg4.fillRoundedRect(bx + 518, by + 7, 200, barH - 14, 8);

    this.prestigeText = this.add.text(bx + 526, by + 13, '⭐ 0 pts', {
      fontFamily: "'VT323', monospace", fontSize: '24px', color: '#f39c12',
    });

    this.levelText = this.add.text(bx + 526, by + 38, 'Estagiária', {
      fontFamily: 'monospace', fontSize: '10px', color: '#95a5a6',
    });

    const careerBg = this.add.graphics();
    careerBg.fillStyle(0x0a1628, 1);
    careerBg.fillRoundedRect(bx + 526, by + 54, 180, 8, 4);

    this.careerBarFill = this.add.graphics();

    // ── Section: Active Mission ──
    const missionW = barW - 728;
    if (missionW > 80) {
      const secBg5 = this.add.graphics();
      secBg5.fillStyle(0x152840, 1);
      secBg5.fillRoundedRect(bx + 730, by + 7, missionW - 16, barH - 14, 8);

      this.add.text(bx + 738, by + 14, '📋 MISSÃO ATIVA', {
        fontFamily: 'monospace', fontSize: '10px', color: '#1abc9c',
      });

      this.missionText = this.add.text(bx + 738, by + 32, '', {
        fontFamily: "'VT323', monospace", fontSize: '18px', color: '#1abc9c',
        wordWrap: { width: missionW - 32 },
        lineSpacing: 0,
      });
    } else {
      // Fallback if not enough space
      this.missionText = this.add.text(0, 0, '').setVisible(false);
    }
  }

  // ── BOTTOM HINT ───────────────────────────────────────────────────────────
  private buildBottomHint() {
    const W = 720, H = 34;
    const bg = this.add.graphics();
    bg.fillStyle(0x0a1628, 0.92);
    bg.fillRoundedRect(GAME_WIDTH / 2 - W / 2, GAME_HEIGHT - H - 10, W, H, 17);
    bg.lineStyle(2, 0xf39c12, 0.7);
    bg.strokeRoundedRect(GAME_WIDTH / 2 - W / 2, GAME_HEIGHT - H - 10, W, H, 17);

    this.hintText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - H / 2 - 10,
      'WASD/Setas: Mover  |  SHIFT: Correr  |  E: Interagir  |  M: Missões  |  ESC: Menu', {
        fontFamily: "'VT323', monospace", fontSize: '19px', color: '#f39c12',
      }).setOrigin(0.5);
  }

  // ── ROOM LABEL ────────────────────────────────────────────────────────────
  private buildRoomLabel() {
    this.roomLabelBg = this.add.graphics().setAlpha(0);
    this.roomLabel = this.add.text(GAME_WIDTH / 2, 115, '', {
      fontFamily: "'Press Start 2P', monospace", fontSize: '14px', color: '#ffffff',
    }).setOrigin(0.5).setAlpha(0);
  }

  // ── UPDATE HANDLERS ───────────────────────────────────────────────────────
  private onHudUpdate(data: { state: GameState; playerX: number; playerY: number; activeMission?: string }) {
    const { state, playerX, playerY, activeMission } = data;

    // Time & day
    const totalMin = Math.floor(state.gameTime) % 1440;
    const h = Math.floor(totalMin / 60), m = totalMin % 60;
    this.timeText.setText(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);

    const shiftName = h >= 7 && h < 15 ? 'MANHÃ' : h >= 15 && h < 23 ? 'TARDE' : 'NOITE';
    this.dayText.setText(`DIA ${state.day} · ${shiftName}`);
    this.shiftIcon.setText(h >= 7 && h < 15 ? '☀️' : h >= 15 && h < 23 ? '🌆' : '🌙');

    // Energy bar
    const bx = 14, by = 12, barH = 76;
    const ep = Math.max(0, Math.min(1, (state.energy || 0) / 100));
    const eColor = ep > 0.5 ? 0x2ecc71 : ep > 0.25 ? 0xf1c40f : 0xe74c3c;
    this.energyBarFill.clear();
    this.energyBarFill.fillStyle(eColor, 1);
    this.energyBarFill.fillRoundedRect(bx + 156, by + 36, 130 * ep, 16, 8);
    this.energyValText.setText(`${Math.round((state.energy || 0))}%`).setColor(
      ep > 0.5 ? '#2ecc71' : ep > 0.25 ? '#f1c40f' : '#e74c3c'
    );

    // Stress bar
    const sp = Math.max(0, Math.min(1, (state.stress || 0) / 100));
    const sColor = sp < 0.3 ? 0x2ecc71 : sp < 0.6 ? 0xf1c40f : 0xe74c3c;
    this.stressBarFill.clear();
    this.stressBarFill.fillStyle(sColor, 1);
    this.stressBarFill.fillRoundedRect(bx + 346, by + 36, 120 * sp, 16, 8);
    this.stressValText.setText(`${Math.round((state.stress || 0))}%`).setColor(
      sp < 0.3 ? '#2ecc71' : sp < 0.6 ? '#f1c40f' : '#e74c3c'
    );

    // Career
    const lvInfo = getLevelInfo(state.prestige);
    this.prestigeText.setText(`⭐ ${state.prestige} pts`);
    this.levelText.setText(lvInfo.title);

    // Career progress bar
    const cur = CAREER_LEVELS[lvInfo.level];
    const nxt = CAREER_LEVELS[Math.min(lvInfo.level + 1, CAREER_LEVELS.length - 1)];
    const careerPct = lvInfo.level >= CAREER_LEVELS.length - 1 ? 1
      : (state.prestige - cur.minPrestige) / (nxt.minPrestige - cur.minPrestige);
    this.careerBarFill.clear();
    this.careerBarFill.fillStyle(0xf39c12, 1);
    this.careerBarFill.fillRoundedRect(bx + 526, by + 54, 180 * Math.min(1, careerPct), 8, 4);

    // Active mission
    if (activeMission) {
      this.missionText.setText(activeMission).setColor('#1abc9c');
    } else {
      this.missionText.setText('Nenhuma ativa — pressione M').setColor('#636e72');
    }

    // Minimap player dot
    this.playerDot.clear();
    const dotX = MM_X + (playerX / TILE_SIZE) * MM_SCALE;
    const dotY = MM_Y + (playerY / TILE_SIZE) * MM_SCALE;
    const pulse = 0.5 + 0.5 * Math.sin(this.time.now / 300);
    this.playerDot.fillStyle(0xffffff, 1);
    this.playerDot.fillCircle(dotX, dotY, 3);
    this.playerDot.fillStyle(0x1abc9c, pulse);
    this.playerDot.fillCircle(dotX, dotY, 5);
  }

  private onHint(msg: string) {
    this.hintText.setText(msg);
  }

  private onRoomChange(roomName: string) {
    this.tweens.killTweensOf([this.roomLabel, this.roomLabelBg]);

    this.roomLabel.setText(roomName);
    const tw = this.roomLabel.width + 48;

    this.roomLabelBg.clear();
    this.roomLabelBg.fillStyle(0x0a1628, 0.95);
    this.roomLabelBg.fillRoundedRect(GAME_WIDTH / 2 - tw / 2, 100, tw, 36, 12);
    this.roomLabelBg.lineStyle(3, 0x1abc9c, 1);
    this.roomLabelBg.strokeRoundedRect(GAME_WIDTH / 2 - tw / 2, 100, tw, 36, 12);

    this.roomLabelBg.setY(-40).setAlpha(0);
    this.roomLabel.setY(80).setAlpha(0);

    this.tweens.add({
      targets: [this.roomLabelBg, this.roomLabel], y: '+=40', alpha: 1,
      duration: 350, ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: [this.roomLabelBg, this.roomLabel], alpha: 0, y: '-+=12',
          duration: 500, delay: 2500,
        });
      },
    });
  }
}
