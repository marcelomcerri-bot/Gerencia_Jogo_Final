import * as Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SCENES, EVENTS, MAP_COLS, MAP_ROWS, TILE_SIZE, CAREER_LEVELS } from '../constants';
import { getLevelInfo, MISSIONS } from '../data/gameData';
import type { GameState, CrisisEvent } from '../data/gameData';
import { generateMapTiles, ROOM_FLOOR_COLORS_HUD } from './HUDMinimapHelper';

const MM_SCALE = 3;
const MM_W = MAP_COLS * MM_SCALE;
const MM_H = MAP_ROWS * MM_SCALE;
const MM_X = GAME_WIDTH - 12 - MM_W;
const MM_Y = 12;

import { playSound } from '../utils/audio';

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

  // Overlays
  private alertBanner: Phaser.GameObjects.Container | null = null;
  private crisisOverlay: Phaser.GameObjects.Container | null = null;
  private missionOverlay: Phaser.GameObjects.Container | null = null;
  
  // Mobile Controls
  public virtualPad = { up: false, down: false, left: false, right: false, sprint: false, actionJustPressed: false, missionJustPressed: false, menuJustPressed: false };

  constructor() { super({ key: SCENES.HUD, active: false }); }

  create() {
    this.mapData = generateMapTiles();
    this.buildMinimap();
    this.buildTopBar();
    this.buildBottomHint();
    this.buildRoomLabel();

    if (!this.sys.game.device.os.desktop || window.innerWidth < 1000) {
      this.buildMobileControls();
    }

    const gameScene = this.scene.get(SCENES.GAME);
    gameScene.events.on(EVENTS.HUD_UPDATE, this.onHudUpdate, this);
    gameScene.events.on(EVENTS.INTERACTION_HINT, this.onHint, this);
    gameScene.events.on(EVENTS.ROOM_CHANGE, this.onRoomChange, this);
  }

  private buildMobileControls() {
    const isMobile = true;
    if (isMobile) {
      this.hintText.setVisible(false); // Hide text hints on mobile
    }

    const padBaseX = 140;
    const padBaseY = GAME_HEIGHT - 140;

    // Helper to create a D-pad button
    const createBtn = (x: number, y: number, w: number, h: number, key: 'up'|'down'|'left'|'right'|'sprint', label: string) => {
      const zone = this.add.zone(x, y, w, h).setOrigin(0.5).setInteractive();
      const bg = this.add.graphics();
      bg.fillStyle(0x0a1628, 0.7);
      bg.fillRoundedRect(x - w/2, y - h/2, w, h, 10);
      bg.lineStyle(2, 0x1abc9c, 0.5);
      bg.strokeRoundedRect(x - w/2, y - h/2, w, h, 10);
      
      const txt = this.add.text(x, y, label, { fontFamily: 'monospace', fontSize: '24px', fontStyle: 'bold', color: '#1abc9c' }).setOrigin(0.5);

      zone.on('pointerdown', () => { this.virtualPad[key] = true; bg.clear().fillStyle(0x1abc9c, 0.7).fillRoundedRect(x - w/2, y - h/2, w, h, 10); txt.setColor('#ffffff'); });
      const unpress = () => { this.virtualPad[key] = false; bg.clear().fillStyle(0x0a1628, 0.7).fillRoundedRect(x - w/2, y - h/2, w, h, 10); bg.lineStyle(2, 0x1abc9c, 0.5).strokeRoundedRect(x - w/2, y - h/2, w, h, 10); txt.setColor('#1abc9c'); };
      zone.on('pointerup', unpress);
      zone.on('pointerout', unpress);
    };

    createBtn(padBaseX, padBaseY - 80, 60, 60, 'up', 'W');
    createBtn(padBaseX, padBaseY + 80, 60, 60, 'down', 'S');
    createBtn(padBaseX - 80, padBaseY, 60, 60, 'left', 'A');
    createBtn(padBaseX + 80, padBaseY, 60, 60, 'right', 'D');

    // Run Button
    createBtn(padBaseX + 160, padBaseY + 80, 80, 60, 'sprint', 'RUN');

    // Action Buttons
    const actionBaseX = GAME_WIDTH - 140;
    
    const createFireBtn = (x: number, y: number, r: number, key: 'actionJustPressed'|'missionJustPressed'|'menuJustPressed', label: string, color: number) => {
      const zone = this.add.zone(x, y, r*2, r*2).setOrigin(0.5);
      zone.setInteractive(new Phaser.Geom.Circle(r, r, r), Phaser.Geom.Circle.Contains);
      
      const bg = this.add.graphics();
      bg.fillStyle(0x0a1628, 0.7);
      bg.fillCircle(x, y, r);
      bg.lineStyle(3, color, 0.7);
      bg.strokeCircle(x, y, r);
      
      const txt = this.add.text(x, y, label, { fontFamily: 'monospace', fontSize: '20px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5);

      zone.on('pointerdown', () => { 
        this.virtualPad[key] = true; 
        // Auto reset false to simulate "JustPressed" after 1 frame, but for now we'll check it in GameScene and reset it there
        bg.clear().fillStyle(color, 0.7).fillCircle(x, y, r); 
      });
      const unpress = () => { 
        this.virtualPad[key] = false; 
        bg.clear().fillStyle(0x0a1628, 0.7).fillCircle(x, y, r); 
        bg.lineStyle(3, color, 0.7).strokeCircle(x, y, r); 
      };
      zone.on('pointerup', unpress);
      zone.on('pointerout', unpress);
    };

    createFireBtn(actionBaseX, padBaseY, 40, 'actionJustPressed', 'FALAR', 0xf39c12);
    createFireBtn(actionBaseX - 90, padBaseY + 60, 35, 'missionJustPressed', 'MISSÃO', 0x9b59b6);
    createFireBtn(actionBaseX - 30, padBaseY - 80, 35, 'menuJustPressed', 'PAUSA', 0xe74c3c);
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

      this.add.text(bx + 738, by + 12, '📋 MISSÃO ATIVA', {
        fontFamily: 'monospace', fontSize: '10px', color: '#1abc9c',
      });

      this.missionText = this.add.text(bx + 738, by + 28, '', {
        fontFamily: "'VT323', monospace", fontSize: '18px', color: '#1abc9c',
        wordWrap: { width: missionW - 32 },
        maxLines: 2,
        lineSpacing: -2,
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
  private onRoomChange(roomName: string) {
    if (!roomName) return;
    this.roomLabel.setText(roomName);
    const w = this.roomLabel.width + 40;
    this.roomLabelBg.clear();
    this.roomLabelBg.fillStyle(0x0a1628, 0.9);
    this.roomLabelBg.fillRoundedRect(GAME_WIDTH / 2 - w / 2, 95, w, 40, 10);
    this.roomLabelBg.lineStyle(2, 0x3498db, 0.8);
    this.roomLabelBg.strokeRoundedRect(GAME_WIDTH / 2 - w / 2, 95, w, 40, 10);

    this.tweens.killTweensOf([this.roomLabel, this.roomLabelBg]);
    this.roomLabel.setAlpha(1);
    this.roomLabelBg.setAlpha(1);

    this.tweens.add({
      targets: [this.roomLabel, this.roomLabelBg],
      alpha: 0,
      delay: 2500,
      duration: 1000,
    });
  }

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

  public showCrisisOverlay(event: CrisisEvent, resolveCallback: (idx: number) => void) {
    if (this.crisisOverlay) return;

    playSound('pulse');

    const W = this.scale.width, H = this.scale.height;
    const panelW = 680, panelH = 420;

    const container = this.add.container(W / 2, H / 2).setDepth(500);

    // Dimmer
    const dimmer = this.add.rectangle(0, 0, W * 2, H * 2, 0x000000, 0.7).setInteractive().setDepth(499);

    // Panel bg
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.5);
    shadow.fillRoundedRect(-panelW / 2 + 8, -panelH / 2 + 8, panelW, panelH, 16);

    const bg = this.add.graphics();
    bg.fillStyle(event.urgent ? 0x1a0505 : 0x0a1a2e, 1);
    bg.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 16);
    bg.lineStyle(4, event.urgent ? 0xe74c3c : 0xf39c12, 1);
    bg.strokeRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 16);

    if (event.urgent) {
      this.tweens.add({ targets: bg, alpha: 0.85, duration: 300, yoyo: true, repeat: 5 });
    }

    const titleText = this.add.text(0, -panelH / 2 + 30, event.title, {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '13px',
      color: event.urgent ? '#ff6b6b' : '#f39c12',
      wordWrap: { width: panelW - 40 },
      align: 'center',
    }).setOrigin(0.5);

    const desc = this.add.text(0, -panelH / 2 + 75, event.description, {
      fontFamily: "'VT323', monospace",
      fontSize: '22px',
      color: '#ecf0f1',
      wordWrap: { width: panelW - 60 },
      align: 'center',
    }).setOrigin(0.5);

    const choiceItems: Phaser.GameObjects.GameObject[] = [];
    const startY = -panelH / 2 + 145;
    const btnH = 68;
    const btnW = panelW - 60;

    let isResolved = false;

    event.choices.forEach((choice, idx) => {
      const cy = startY + idx * (btnH + 8);

      const btnBg = this.add.graphics();
      btnBg.fillStyle(0x1e3a5f, 1);
      btnBg.fillRoundedRect(-btnW / 2, cy - btnH / 2, btnW, btnH, 8);
      btnBg.lineStyle(2, 0x3498db, 1);
      btnBg.strokeRoundedRect(-btnW / 2, cy - btnH / 2, btnW, btnH, 8);

      const numTxt = this.add.text(-btnW / 2 + 16, cy, `${idx + 1}`, {
        fontFamily: "'Press Start 2P', monospace", fontSize: '13px', color: '#f39c12',
      }).setOrigin(0, 0.5);

      const choiceTxt = this.add.text(-btnW / 2 + 36, cy, choice.text, {
        fontFamily: "'VT323', monospace", fontSize: '20px', color: '#ecf0f1',
        wordWrap: { width: btnW - 50 }, lineSpacing: 2,
      }).setOrigin(0, 0.5);

      const zone = this.add.zone(-btnW / 2, cy - btnH / 2, btnW, btnH).setOrigin(0).setInteractive({ cursor: 'pointer' });

      zone.on('pointerover', () => {
        playSound('hover');
        btnBg.clear().fillStyle(0x2563a8, 1).fillRoundedRect(-btnW / 2, cy - btnH / 2, btnW, btnH, 8)
          .lineStyle(3, 0xf1c40f, 1).strokeRoundedRect(-btnW / 2, cy - btnH / 2, btnW, btnH, 8);
      });

      zone.on('pointerout', () => {
        btnBg.clear().fillStyle(0x1e3a5f, 1).fillRoundedRect(-btnW / 2, cy - btnH / 2, btnW, btnH, 8)
          .lineStyle(2, 0x3498db, 1).strokeRoundedRect(-btnW / 2, cy - btnH / 2, btnW, btnH, 8);
      });

      const onSelect = () => {
        if (isResolved) return;
        isResolved = true;
        playSound('click');
        container.getData('timerEvent')?.remove();
        container.destroy();
        dimmer.destroy();
        this.crisisOverlay = null;
        resolveCallback(idx);
      };

      zone.on('pointerdown', onSelect);
      this.input.keyboard?.once(`keydown-${idx + 1}`, onSelect);

      choiceItems.push(btnBg, numTxt, choiceTxt, zone);
    });

    const timerBg = this.add.graphics().fillStyle(0x2c3e50, 1)
      .fillRoundedRect(-panelW / 2 + 20, panelH / 2 - 30, panelW - 40, 15, 7);
    const timerFill = this.add.graphics();
    const timerDur = 90000; // 90 seconds — gives players time to read and decide carefully
    let elapsed = 0;

    const timerUpdate = () => {
      elapsed += 200;
      const pct = Math.max(0, 1 - elapsed / timerDur);
      const col = pct > 0.5 ? 0x2ecc71 : pct > 0.25 ? 0xf39c12 : 0xe74c3c;
      timerFill.clear().fillStyle(col, 1)
        .fillRoundedRect(-panelW / 2 + 20, panelH / 2 - 30, (panelW - 40) * pct, 15, 7);
      
      if (pct === 0 && !isResolved) {
        isResolved = true;
        container.getData('timerEvent')?.remove();
        container.destroy();
        dimmer.destroy();
        this.crisisOverlay = null;
        resolveCallback(event.choices.length - 1);
      }
    };

    const timerEvent = this.time.addEvent({ delay: 200, repeat: timerDur / 200, callback: timerUpdate });
    container.add([shadow, bg, titleText, desc, ...choiceItems, timerBg, timerFill]);
    container.setScale(0.9).setAlpha(0);
    this.tweens.add({ targets: container, scale: 1, alpha: 1, duration: 250, ease: 'Back.easeOut' });
    container.setData('timerEvent', timerEvent);
    this.crisisOverlay = container;
  }

  public showCrisisFeedback(text: string, correct: boolean, pts: number) {
    if (correct) playSound('success');
    else playSound('error');

    const W = this.scale.width, H = this.scale.height;
    const fbW = 600, fbH = 140;
    const fb = this.add.container(W / 2, H / 2 - 80).setDepth(501);

    const bg = this.add.graphics().fillStyle(correct ? 0x0a2a1a : 0x2a0a0a, 1)
      .fillRoundedRect(-fbW / 2, -fbH / 2, fbW, fbH, 12).lineStyle(3, correct ? 0x2ecc71 : 0xe74c3c, 1)
      .strokeRoundedRect(-fbW / 2, -fbH / 2, fbW, fbH, 12);

    const icon = this.add.text(-fbW / 2 + 30, 0, correct ? '✅' : '⚠️', { fontSize: '32px' }).setOrigin(0, 0.5);

    const ptsSign = pts >= 0 ? '+' : '';
    const ptsLabel = this.add.text(-fbW / 2 + 70, -fbH / 2 + 18,
      `${correct ? 'CORRETO!' : 'ATENÇÃO!'} ${ptsSign}${pts} pts`, {
        fontFamily: "'Press Start 2P', monospace", fontSize: '11px', color: correct ? '#2ecc71' : '#e74c3c',
      });

    const feedTxt = this.add.text(-fbW / 2 + 70, -fbH / 2 + 48, text, {
      fontFamily: "'VT323', monospace", fontSize: '19px', color: '#ecf0f1', wordWrap: { width: fbW - 90 },
    });

    fb.add([bg, icon, ptsLabel, feedTxt]);
    fb.setScale(0.9).setAlpha(0);
    
    this.tweens.add({
      targets: fb, scale: 1, alpha: 1, duration: 250, ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: fb, alpha: 0, duration: 400, delay: 4000,
          onComplete: () => fb.destroy()
        });
      },
    });
  }

  public toggleMissionOverlay(state: GameState) {
    if (this.missionOverlay) {
      playSound('click');
      this.missionOverlay.destroy();
      this.missionOverlay = null;
      return;
    }
    
    playSound('hover');

    const W = this.scale.width, H = this.scale.height;
    const panelW = 520, panelH = Math.min(560, H - 80);
    const c = this.add.container(W / 2, H / 2).setDepth(300);

    const bg = this.add.graphics();
    bg.fillStyle(0x0a0f1e, 0.97).fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 16)
      .lineStyle(3, 0x1abc9c, 1).strokeRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 16);

    const title = this.add.text(0, -panelH / 2 + 22, '📋  MISSÕES  DO  HUAP', {
      fontFamily: "'Press Start 2P', monospace", fontSize: '11px', color: '#1abc9c',
    }).setOrigin(0.5);

    const lvInfo = getLevelInfo(state.prestige);
    const careerTxt = this.add.text(0, -panelH / 2 + 44,
      `${lvInfo.title} · ⭐ ${state.prestige} pts`, {
        fontFamily: "'VT323', monospace", fontSize: '19px', color: '#f1c40f',
      }).setOrigin(0.5);

    const closeBtn = this.add.text(panelW / 2 - 18, -panelH / 2 + 16, '✕', {
      fontFamily: "'Press Start 2P', monospace", fontSize: '11px', color: '#e74c3c',
    }).setInteractive({ cursor: 'pointer' })
      .on('pointerdown', () => { playSound('click'); c.destroy(); this.missionOverlay = null; });

    const items: Phaser.GameObjects.Text[] = [];
    let y = -panelH / 2 + 68;

    const categories = [...new Set(MISSIONS.map(m => m.category))];
    for (const cat of categories) {
      const catMissions = MISSIONS.filter(m => m.category === cat);
      const catLabel = this.add.text(-panelW / 2 + 14, y, `── ${cat}`, {
        fontFamily: "'Press Start 2P', monospace", fontSize: '8px', color: '#7f8c8d',
      });
      items.push(catLabel);
      y += 16;

      for (const m of catMissions) {
        const done = state.completedMissions.includes(m.id);
        const active = !!state.missionProgress[m.id] && !done;
        const locked = !done && !active && m.prerequisiteIds.some(id => !state.completedMissions.includes(id));

        const icon = done ? '✅' : active ? '▶' : locked ? '🔒' : '○';
        const col = done ? '#2ecc71' : active ? '#f1c40f' : locked ? '#636e72' : '#bdc3c7';

        const line = this.add.text(-panelW / 2 + 14, y, `${icon} ${m.title} (+${m.prestige}pts)`, {
          fontFamily: "'VT323', monospace", fontSize: '17px', color: col,
        });
        items.push(line);
        y += 19;
      }
      y += 4;
    }

    const done = state.completedMissions.length;
    const total = MISSIONS.length;
    const pct = (done / total * 100) | 0;

    const prog = this.add.text(0, panelH / 2 - 22,
      `Progresso: ${done}/${total} (${pct}%)  |  Stress: ${Math.floor(state.stress || 0)}%`, {
        fontFamily: "'VT323', monospace", fontSize: '16px', color: '#bdc3c7',
      }).setOrigin(0.5);

    c.add([bg, title, careerTxt, closeBtn, ...items, prog]);
    c.setScale(0.9).setAlpha(0);
    this.tweens.add({ targets: c, scale: 1, alpha: 1, duration: 200, ease: 'Back.easeOut' });

    this.input.keyboard?.once('keydown-M', () => {
       if (this.missionOverlay) { playSound('click'); c.destroy(); this.missionOverlay = null; }
    });

    this.missionOverlay = c;
  }
}
