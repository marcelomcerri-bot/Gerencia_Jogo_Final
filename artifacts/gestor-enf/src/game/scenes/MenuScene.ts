import * as Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SCENES } from '../constants';

export class MenuScene extends Phaser.Scene {
  constructor() { super({ key: SCENES.MENU }); }

  create() {
    const cx = GAME_WIDTH / 2;

    // ── Background: real HUAP/UFF photo (cover-fit, with subtle pan)
    if (this.textures.exists('huap_photo')) {
      const tex = this.textures.get('huap_photo').getSourceImage() as HTMLImageElement;
      const iw = tex.width || 1280;
      const ih = tex.height || 720;
      // cover-fit: scale to fill the canvas, keep aspect
      const scale = Math.max(GAME_WIDTH / iw, GAME_HEIGHT / ih) * 1.05;
      const photo = this.add.image(cx, GAME_HEIGHT / 2, 'huap_photo')
        .setOrigin(0.5)
        .setScale(scale)
        .setDepth(0);
      // Subtle Ken-Burns style pan
      this.tweens.add({
        targets: photo,
        scale: scale * 1.06,
        duration: 12000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    } else {
      // Fallback: solid hospital-blue background
      this.add.rectangle(cx, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0a1628).setDepth(0);
    }

    // ── Top dim gradient (improves title legibility)
    const topDim = this.textures.createCanvas('__menu_top_dim', GAME_WIDTH, 320) as Phaser.Textures.CanvasTexture;
    if (topDim) {
      const tctx = topDim.getContext();
      const tg = tctx.createLinearGradient(0, 0, 0, 320);
      tg.addColorStop(0, 'rgba(8, 22, 40, 0.92)');
      tg.addColorStop(1, 'rgba(8, 22, 40, 0)');
      tctx.fillStyle = tg;
      tctx.fillRect(0, 0, GAME_WIDTH, 320);
      topDim.refresh();
      this.add.image(GAME_WIDTH / 2, 160, '__menu_top_dim').setDepth(1);
    }

    // ── Bottom dim gradient (improves credits legibility & button contrast)
    const botDim = this.textures.createCanvas('__menu_bot_dim', GAME_WIDTH, 280) as Phaser.Textures.CanvasTexture;
    if (botDim) {
      const bctx = botDim.getContext();
      const bg = bctx.createLinearGradient(0, 0, 0, 280);
      bg.addColorStop(0, 'rgba(8, 22, 40, 0)');
      bg.addColorStop(1, 'rgba(8, 22, 40, 0.95)');
      bctx.fillStyle = bg;
      bctx.fillRect(0, 0, GAME_WIDTH, 280);
      botDim.refresh();
      this.add.image(GAME_WIDTH / 2, GAME_HEIGHT - 140, '__menu_bot_dim').setDepth(1);
    }

    // ── Hospital identification badge (top-left)
    const badgeBg = this.add.graphics().setDepth(2);
    badgeBg.fillStyle(0x0a1628, 0.85);
    badgeBg.fillRoundedRect(20, 20, 300, 56, 10);
    badgeBg.lineStyle(2, 0x1abc9c, 0.9);
    badgeBg.strokeRoundedRect(20, 20, 300, 56, 10);

    this.add.text(36, 30, 'HOSPITAL UNIVERSITÁRIO', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '10px',
      color: '#1abc9c',
    }).setDepth(3);
    this.add.text(36, 50, 'ANTÔNIO PEDRO  ·  HUAP / UFF', {
      fontFamily: "'VT323', monospace",
      fontSize: '20px',
      color: '#ecf0f1',
    }).setDepth(3);

    // ── TITLE
    const titleText = this.add.text(cx, 110, 'GESTOR ENF', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '52px',
      color: '#fff9e6',
    }).setOrigin(0.5).setDepth(3);
    titleText.setShadow(4, 4, '#000', 4, true, true);

    this.tweens.add({
      targets: titleText,
      y: 100,
      duration: 2400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const subTitle = this.add.text(cx, 168, 'GERÊNCIA HOSPITALAR  ·  RPG EDUCATIVO 2D', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '13px',
      color: '#1abc9c',
    }).setOrigin(0.5).setDepth(3);
    subTitle.setShadow(2, 2, '#000', 3, true, true);

    // Decorative pulse cross (top-right)
    const crossBg = this.add.graphics().setDepth(2);
    crossBg.fillStyle(0xe74c3c, 0.85);
    crossBg.fillRoundedRect(GAME_WIDTH - 76, 20, 56, 56, 10);
    const crossSym = this.add.text(GAME_WIDTH - 48, 48, '+', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '38px',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(3);
    this.tweens.add({
      targets: crossSym, scale: 1.15, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    // ── Subtle medical particle ambience
    this.createMedicalParticles();

    // ── Credits
    this.add.text(cx, GAME_HEIGHT - 40, 'Baseado em: Kurcgant (2016) · Marquis & Huston (2015) · COFEN', {
      fontFamily: "'VT323', monospace",
      fontSize: '18px',
      color: '#ffeaa7',
    }).setOrigin(0.5).setShadow(1, 1, '#000', 2).setDepth(3);

    this.add.text(cx, GAME_HEIGHT - 18, 'Use os botões à direita para começar', {
      fontFamily: "'VT323', monospace",
      fontSize: '16px',
      color: '#bdc3c7',
    }).setOrigin(0.5).setShadow(1, 1, '#000', 2).setDepth(3);

    // Version
    this.add.text(GAME_WIDTH - 16, GAME_HEIGHT - 16, 'v3.1 HUAP', {
      fontFamily: "'VT323', monospace",
      fontSize: '18px',
      color: '#ffeaa7',
    }).setOrigin(1, 1).setShadow(1, 1, '#000', 2).setDepth(3);

    // Camera fade in
    this.cameras.main.fadeIn(900);
  }

  private createMedicalParticles() {
    for (let i = 0; i < 12; i++) {
      const isHeart = Math.random() > 0.5;
      const char = isHeart ? '♥' : '+';
      const color = isHeart ? '#e74c3c' : '#1abc9c';

      const p = this.add.text(
        Phaser.Math.Between(0, GAME_WIDTH),
        Phaser.Math.Between(GAME_HEIGHT / 2, GAME_HEIGHT),
        char,
        {
          fontFamily: isHeart ? 'sans-serif' : "'Press Start 2P', monospace",
          fontSize: Phaser.Math.Between(12, 22) + 'px',
          color,
        }
      ).setAlpha(0).setDepth(2);

      this.tweens.add({
        targets: p,
        y: '-=180',
        x: `+=${Phaser.Math.Between(-30, 30)}`,
        alpha: { start: 0, from: Phaser.Math.FloatBetween(0.3, 0.7), to: 0 },
        scale: { start: 0.5, to: 1.4 },
        duration: Phaser.Math.Between(5000, 9000),
        delay: Phaser.Math.Between(0, 4000),
        repeat: -1,
        onRepeat: () => {
          p.setY(Phaser.Math.Between(GAME_HEIGHT / 2 + 100, GAME_HEIGHT + 50));
          p.setX(Phaser.Math.Between(0, GAME_WIDTH));
        },
      });
    }
  }
}
