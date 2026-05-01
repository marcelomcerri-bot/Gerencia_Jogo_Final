import * as Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SCENES } from '../constants';
import { playMusic, fadeOutMusic } from '../utils/audio';

export class MenuScene extends Phaser.Scene {
  private starting = false;

  constructor() { super({ key: SCENES.MENU }); }

  public startGame() {
    if (this.starting) return;
    this.starting = true;
    fadeOutMusic(700);
    this.cameras.main.fadeOut(600, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(SCENES.GAME);
    });
  }

  create() {
    this.starting = false;
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    // ── Background: full-screen pixel art hospital image ──────────────────────
    const bgKey = this.textures.exists('huap_pixelart')
      ? 'huap_pixelart'
      : this.textures.exists('huap_pixel') ? 'huap_pixel'
      : this.textures.exists('huap_photo') ? 'huap_photo' : null;

    if (bgKey) {
      const bg = this.add.image(cx, cy, bgKey)
        .setOrigin(0.5)
        .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
        .setDepth(0);
      this.tweens.add({
        targets: bg,
        scaleX: bg.scaleX * 1.07,
        scaleY: bg.scaleY * 1.07,
        duration: 20000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    } else {
      this.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x040c1c).setDepth(0);
    }

    // ── Gradient overlay for readability ─────────────────────────────────────
    if (!this.textures.exists('__menu_overlay')) {
      const ovTex = this.textures.createCanvas('__menu_overlay', GAME_WIDTH, GAME_HEIGHT) as Phaser.Textures.CanvasTexture;
      const oc = ovTex.getContext();
      const og = oc.createLinearGradient(0, 0, 0, GAME_HEIGHT);
      og.addColorStop(0,    'rgba(4,12,28,0.82)');
      og.addColorStop(0.30, 'rgba(4,12,28,0.35)');
      og.addColorStop(0.68, 'rgba(4,12,28,0.35)');
      og.addColorStop(1,    'rgba(4,12,28,0.90)');
      oc.fillStyle = og;
      oc.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      ovTex.refresh();
    }
    this.add.image(cx, cy, '__menu_overlay').setDepth(1);

    // ── Vignette ──────────────────────────────────────────────────────────────
    if (!this.textures.exists('__menu_vignette')) {
      const vTex = this.textures.createCanvas('__menu_vignette', GAME_WIDTH, GAME_HEIGHT) as Phaser.Textures.CanvasTexture;
      const vc = vTex.getContext();
      const vg = vc.createRadialGradient(cx, cy, GAME_HEIGHT * 0.20, cx, cy, GAME_HEIGHT * 0.80);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, 'rgba(0,0,0,0.75)');
      vc.fillStyle = vg;
      vc.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      vTex.refresh();
    }
    this.add.image(cx, cy, '__menu_vignette').setDepth(2);

    // ── CRT Scanlines ─────────────────────────────────────────────────────────
    if (!this.textures.exists('__menu_scan')) {
      const sTex = this.textures.createCanvas('__menu_scan', GAME_WIDTH, GAME_HEIGHT) as Phaser.Textures.CanvasTexture;
      const sc = sTex.getContext();
      sc.fillStyle = 'rgba(0,0,0,0.20)';
      for (let y = 0; y < GAME_HEIGHT; y += 4) sc.fillRect(0, y, GAME_WIDTH, 2);
      sTex.refresh();
    }
    this.add.image(cx, cy, '__menu_scan').setDepth(9).setAlpha(1);

    // ── Glitch / CRT flicker line ─────────────────────────────────────────────
    const flickerGfx = this.add.graphics().setDepth(9);
    this.time.addEvent({
      delay: Phaser.Math.Between(4000, 9000),
      loop: true,
      callback: () => {
        flickerGfx.clear();
        flickerGfx.fillStyle(0xffffff, 0.06);
        flickerGfx.fillRect(0, Phaser.Math.Between(80, GAME_HEIGHT - 80), GAME_WIDTH, Phaser.Math.Between(1, 3));
        this.time.delayedCall(120, () => flickerGfx.clear());
      },
    });

    // ── Hospital badge (top-left) ─────────────────────────────────────────────
    const BW = 346, BH = 70, BX = 16, BY = 16;
    const badgeBg = this.add.graphics().setDepth(3);
    badgeBg.fillStyle(0x040c1c, 0.90);
    badgeBg.fillRoundedRect(BX, BY, BW, BH, 10);
    badgeBg.lineStyle(2, 0x1abc9c, 1);
    badgeBg.strokeRoundedRect(BX, BY, BW, BH, 10);

    // Accent left bar
    const accentGfx = this.add.graphics().setDepth(4);
    accentGfx.fillStyle(0x1abc9c, 1);
    accentGfx.fillRect(BX + 10, BY + 10, 3, BH - 20);

    // Logos column
    this.add.text(BX + 20, BY + 10, 'MEC', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '7px', color: '#1abc9c',
    }).setDepth(4);
    this.add.text(BX + 20, BY + 27, 'UFF', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '7px', color: '#7f8c8d',
    }).setDepth(4);

    // Separator vertical
    accentGfx.fillStyle(0x1abc9c, 0.4);
    accentGfx.fillRect(BX + 56, BY + 10, 1, BH - 20);

    // Text block
    this.add.text(BX + 65, BY + 9, 'HOSPITAL UNIVERSITÁRIO', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '8px', color: '#bdc3c7',
    }).setDepth(4);
    this.add.text(BX + 65, BY + 27, 'ANTÔNIO PEDRO', {
      fontFamily: "'VT323', monospace",
      fontSize: '28px', color: '#1abc9c',
    }).setDepth(4);
    this.add.text(BX + 65, BY + 53, 'HUAP  /  UFF  —  Niterói · RJ', {
      fontFamily: "'VT323', monospace",
      fontSize: '16px', color: '#636e72',
    }).setDepth(4);

    // ── Red cross (top-right) ─────────────────────────────────────────────────
    const CX2 = GAME_WIDTH - 82, CY2 = BY;
    const crossGfx = this.add.graphics().setDepth(3);
    crossGfx.fillStyle(0xc0392b, 0.92);
    crossGfx.fillRoundedRect(CX2, CY2, 66, BH, 10);
    crossGfx.lineStyle(2, 0xe74c3c, 1);
    crossGfx.strokeRoundedRect(CX2, CY2, 66, BH, 10);
    const crossSym = this.add.text(CX2 + 33, CY2 + BH / 2, '+', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '36px', color: '#ffffff',
    }).setOrigin(0.5).setDepth(4);
    this.tweens.add({ targets: crossSym, scale: 1.18, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // ── TITLE ─────────────────────────────────────────────────────────────────
    const titleY = 148;
    // Shadow layer
    this.add.text(cx + 4, titleY + 4, 'GESTOR  ENF', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '60px', color: '#051510',
    }).setOrigin(0.5).setDepth(3).setAlpha(0.8);

    const title = this.add.text(cx, titleY, 'GESTOR  ENF', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '60px', color: '#f0fff8',
    }).setOrigin(0.5).setDepth(4);
    title.setShadow(0, 0, '#16e8a0', 22, true, true);

    this.tweens.add({
      targets: title,
      y: titleY - 7,
      duration: 3000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Title pixel glitch shimmer
    this.time.addEvent({
      delay: 4500,
      loop: true,
      callback: () => {
        this.tweens.add({
          targets: title, alpha: 0.78, duration: 60, yoyo: true, repeat: 2,
          onComplete: () => title.setAlpha(1),
        });
      },
    });

    // Subtitle
    const sub = this.add.text(cx, 212, 'GERÊNCIA HOSPITALAR  ·  RPG EDUCATIVO 2D', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '11px', color: '#1abc9c',
    }).setOrigin(0.5).setDepth(4);
    sub.setShadow(0, 0, '#000', 6, true, true);

    // Decorative rules
    const rule = this.add.graphics().setDepth(3);
    rule.lineStyle(1, 0x1abc9c, 0.35);
    rule.lineBetween(cx - 440, 232, cx + 440, 232);
    rule.lineStyle(1, 0x1abc9c, 0.15);
    rule.lineBetween(cx - 440, 235, cx + 440, 235);

    // ── Floating particles ────────────────────────────────────────────────────
    this.createMedicalParticles();

    // ── Bottom credits bar ────────────────────────────────────────────────────
    const credBg = this.add.graphics().setDepth(3);
    credBg.fillStyle(0x040c1c, 0.80);
    credBg.fillRect(0, GAME_HEIGHT - 58, GAME_WIDTH, 58);
    credBg.lineStyle(1, 0x1abc9c, 0.25);
    credBg.lineBetween(0, GAME_HEIGHT - 58, GAME_WIDTH, GAME_HEIGHT - 58);

    this.add.text(cx, GAME_HEIGHT - 40, 'Baseado em: Kurcgant (2016)  ·  Marquis & Huston (2015)  ·  COFEN', {
      fontFamily: "'VT323', monospace",
      fontSize: '18px', color: '#ffeaa7',
    }).setOrigin(0.5).setShadow(1, 1, '#000', 2).setDepth(4);

    this.add.text(cx, GAME_HEIGHT - 18, 'Pressione  NOVO JOGO  ou  CONTINUAR  para  começar', {
      fontFamily: "'VT323', monospace",
      fontSize: '17px', color: '#7f8c8d',
    }).setOrigin(0.5).setDepth(4);

    this.add.text(GAME_WIDTH - 14, GAME_HEIGHT - 14, 'v3.1  HUAP', {
      fontFamily: "'VT323', monospace",
      fontSize: '16px', color: '#4a5568',
    }).setOrigin(1, 1).setDepth(4);

    // ── Start 8-bit menu music ────────────────────────────────────────────────
    playMusic('menu');

    // ── Camera fade in ────────────────────────────────────────────────────────
    this.cameras.main.fadeIn(1100);
  }

  private createMedicalParticles() {
    const items = [
      { char: '+',  color: '#1abc9c', font: "'Press Start 2P', monospace" },
      { char: '♥',  color: '#e74c3c', font: 'sans-serif' },
      { char: '✚',  color: '#27ae60', font: 'sans-serif' },
      { char: '○',  color: '#3498db', font: 'sans-serif' },
      { char: '+',  color: '#1abc9c', font: "'Press Start 2P', monospace" },
      { char: '◆',  color: '#f39c12', font: 'sans-serif' },
    ];

    for (let i = 0; i < 20; i++) {
      const item = items[i % items.length];
      const p = this.add.text(
        Phaser.Math.Between(30, GAME_WIDTH - 30),
        Phaser.Math.Between(GAME_HEIGHT * 0.55, GAME_HEIGHT + 60),
        item.char,
        { fontFamily: item.font, fontSize: Phaser.Math.Between(10, 22) + 'px', color: item.color }
      ).setAlpha(0).setDepth(5);

      this.tweens.add({
        targets: p,
        y: `-=${Phaser.Math.Between(200, 360)}`,
        x: `+=${Phaser.Math.Between(-60, 60)}`,
        alpha: { from: 0, to: Phaser.Math.FloatBetween(0.20, 0.60) },
        scale: { from: 0.3, to: 1.3 },
        duration: Phaser.Math.Between(7000, 14000),
        delay: Phaser.Math.Between(0, 6000),
        repeat: -1,
        ease: 'Power1',
        onRepeat: () => {
          p.setY(Phaser.Math.Between(GAME_HEIGHT * 0.60, GAME_HEIGHT + 80));
          p.setX(Phaser.Math.Between(30, GAME_WIDTH - 30));
          p.setAlpha(0).setScale(0.3);
        },
      });
    }
  }
}
