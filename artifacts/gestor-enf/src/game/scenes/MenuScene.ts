import * as Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SCENES } from '../constants';
import { hasSave, clearSave } from '../utils/save';

const SKY_TOP    = 0x1a1a6e;
const SKY_MID    = 0x6b35a3;
const SKY_BOTTOM = 0xe8744a;
const PEACH      = 0xffc67a;
const TEAL_ACCENT = 0x1abc9c;
const WHITE = 0xffffff;

export class MenuScene extends Phaser.Scene {
  constructor() { super({ key: SCENES.MENU }); }

  create() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    // ── Background gradient (Canvas API — works in both WebGL and Canvas mode)
    if (this.textures.exists('__menu_bg')) this.textures.remove('__menu_bg');
    if (this.textures.exists('__menu_hz')) this.textures.remove('__menu_hz');
    const bgCanvas = this.textures.createCanvas('__menu_bg', GAME_WIDTH, GAME_HEIGHT) as Phaser.Textures.CanvasTexture;
    const bgCtx = bgCanvas.getContext();
    const grad = bgCtx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    grad.addColorStop(0,    '#0d0d3f');  // deep midnight blue
    grad.addColorStop(0.35, '#3b1f6e');  // dark purple
    grad.addColorStop(0.6,  '#8e3a8c');  // warm magenta-purple
    grad.addColorStop(0.8,  '#e8744a');  // warm sunset orange
    grad.addColorStop(1,    '#ffc67a');  // peach horizon
    bgCtx.fillStyle = grad;
    bgCtx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    bgCanvas.refresh();
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, '__menu_bg');

    // ── Stars
    for (let i = 0; i < 50; i++) {
      const x = Phaser.Math.Between(0, GAME_WIDTH);
      const y = Phaser.Math.Between(0, GAME_HEIGHT / 2);
      const star = this.add.circle(x, y, Phaser.Math.FloatBetween(0.5, 1.5), 0xffffff, Phaser.Math.FloatBetween(0.2, 0.8));
      this.tweens.add({
        targets: star,
        alpha: 0,
        duration: Phaser.Math.Between(1000, 3000),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 2000)
      });
    }

    // ── Sun/Moon
    const sun = this.add.circle(GAME_WIDTH - 200, 200, 60, 0xffeaa7, 0.9);
    const sunGlow = this.add.circle(GAME_WIDTH - 200, 200, 80, 0xffeaa7, 0.3);
    this.tweens.add({
      targets: sunGlow,
      scale: 1.2,
      alpha: 0.1,
      duration: 3000,
      yoyo: true,
      repeat: -1
    });

    // ── Clouds
    for (let i = 0; i < 4; i++) {
      const g = this.add.graphics({ fillStyle: { color: 0xffffff, alpha: 0.2 } });
      g.fillEllipse(0, 0, 100, 30);
      g.fillEllipse(-30, 10, 80, 25);
      g.fillEllipse(30, 5, 70, 20);
      const cloud = this.add.container(Phaser.Math.Between(-100, GAME_WIDTH), Phaser.Math.Between(50, 250), [g]);
      this.tweens.add({
        targets: cloud,
        x: GAME_WIDTH + 150,
        duration: Phaser.Math.Between(30000, 50000),
        repeat: -1,
        onRepeat: () => { cloud.x = -150; }
      });
    }

    // ── Horizon glow (warm haze behind hospital — Canvas API)
    const hzCanvas = this.textures.createCanvas('__menu_hz', GAME_WIDTH, 160) as Phaser.Textures.CanvasTexture;
    const hzCtx = hzCanvas.getContext();
    const hzGrad = hzCtx.createLinearGradient(0, 0, 0, 160);
    hzGrad.addColorStop(0, 'rgba(255,198,122,0.0)');
    hzGrad.addColorStop(0.3, 'rgba(232,116,74,0.6)');
    hzGrad.addColorStop(1, 'rgba(10,0,20,0.0)');
    hzCtx.fillStyle = hzGrad;
    hzCtx.fillRect(0, 0, GAME_WIDTH, 160);
    hzCanvas.refresh();
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT * 0.55 + 40, '__menu_hz');

    // ── Hospital silhouette (bottom section, below buttons)
    this.drawHospitalSilhouette(cx, 630);

    // ── Decorative Plants at bottom
    this.drawPlants();

    // ── Animated floor grid lines
    const gridGfx = this.add.graphics();
    const GRID = 64;
    for (let x = 0; x < GAME_WIDTH; x += GRID) {
      gridGfx.lineStyle(1, 0xffffff, 0.05);
      gridGfx.lineBetween(x, GAME_HEIGHT - 200, x, GAME_HEIGHT);
    }
    for (let y = GAME_HEIGHT - 200; y < GAME_HEIGHT; y += GRID/2) {
      gridGfx.lineStyle(1, 0xffffff, 0.05);
      gridGfx.lineBetween(0, y, GAME_WIDTH, y);
    }

    // ── Particle cross symbols (medical)
    this.createMedicalParticles();

    // ── TITLE
    const titleText = this.add.text(cx, 150, 'GESTOR ENF', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '56px',
      color: '#fff9e6',
    }).setOrigin(0.5);
    titleText.setShadow(4, 4, '#d35400', 0, false, true);
    
    // Title floating animation
    this.tweens.add({
      targets: titleText,
      y: 140,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    const subTitle = this.add.text(cx, 210, 'GERÊNCIA HOSPITALAR 2D', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '16px',
      color: '#1abc9c',
    }).setOrigin(0.5);
    subTitle.setShadow(2, 2, '#2c3e50', 0, false, true);

    // ── Buttons (positioned above hospital silhouette)
    const btnY = 310;
    const btnSpacing = 72;

    this.createButton(cx, btnY, 'NOVO JOGO', 0x1abc9c, 0x16a085, () => {
      clearSave();
      this.startGame();
    });

    if (hasSave()) {
      this.createButton(cx, btnY + btnSpacing, 'CONTINUAR', 0x9b59b6, 0x8e44ad, () => {
        this.startGame();
      });
    }

    this.createButton(cx, btnY + btnSpacing * (hasSave() ? 2 : 1), 'COMO JOGAR', 0xe67e22, 0xd35400, () => {
      this.showHelp();
    });

    // ── Credits line
    this.add.text(cx, GAME_HEIGHT - 24, 'Baseado em: Kurcgant (2016) · Marquis & Huston (2015) · COFEN', {
      fontFamily: "'VT323', monospace",
      fontSize: '18px',
      color: '#ffeaa7',
    }).setOrigin(0.5).setShadow(1, 1, '#000', 2);

    // ── Version
    this.add.text(GAME_WIDTH - 16, GAME_HEIGHT - 16, 'v3.0 HUAP', {
      fontFamily: "'VT323', monospace",
      fontSize: '18px',
      color: '#ffeaa7',
    }).setOrigin(1, 1).setShadow(1, 1, '#000', 2);

    // Camera fade in
    this.cameras.main.fadeIn(1000);
  }

  private drawHospitalSilhouette(cx: number, cy: number) {
    const g = this.add.graphics();
    const baseColor = 0x2c3e50;
    
    // Back buildings
    g.fillStyle(0x34495e, 0.8);
    g.fillRect(cx - 300, cy - 60, 150, 180);
    g.fillRect(cx + 150, cy - 40, 120, 160);
    
    // Main building
    g.fillStyle(baseColor);
    g.fillRoundedRect(cx - 220, cy - 100, 440, 220, 8);
    
    // Tower
    g.fillStyle(baseColor);
    g.fillRoundedRect(cx - 50, cy - 180, 100, 100, 4);
    
    // Roof lines
    g.fillStyle(0xe74c3c);
    g.fillRect(cx - 230, cy - 100, 460, 12);
    g.fillRect(cx - 60, cy - 180, 120, 8);

    // Cross
    g.fillStyle(0xe74c3c);
    g.fillRoundedRect(cx - 12, cy - 160, 24, 60, 4);
    g.fillRoundedRect(cx - 30, cy - 142, 60, 24, 4);
    
    // Windows
    const windowCols = 8;
    const windowRows = 3;
    for (let r = 0; r < windowRows; r++) {
      for (let c = 0; c < windowCols; c++) {
        const wx = cx - 180 + c * 50;
        const wy = cy - 50 + r * 40;
        // Randomly lit windows
        if (Math.random() > 0.3) {
          g.fillStyle(0xf1c40f); // Lit
          g.fillRoundedRect(wx, wy, 24, 28, 2);
          g.fillStyle(0xffeaa7, 0.5);
          g.fillRect(wx + 2, wy + 2, 8, 24); // Window reflection
        } else {
          g.fillStyle(0x1a252f); // Dark
          g.fillRoundedRect(wx, wy, 24, 28, 2);
        }
      }
    }
  }

  private drawPlants() {
    const g = this.add.graphics();
    g.fillStyle(0x27ae60);
    for(let i=0; i<30; i++) {
      const px = Math.random() * GAME_WIDTH;
      const py = GAME_HEIGHT - Math.random() * 40;
      g.fillCircle(px, py, Math.random() * 15 + 10);
      g.fillStyle(0x2ecc71);
      g.fillCircle(px-5, py-5, Math.random() * 10 + 5);
      g.fillStyle(0x27ae60);
    }
  }

  private createMedicalParticles() {
    for (let i = 0; i < 15; i++) {
      const isHeart = Math.random() > 0.5;
      const char = isHeart ? '♥' : '+';
      const color = isHeart ? '#e74c3c' : '#1abc9c';
      
      const p = this.add.text(
        Phaser.Math.Between(0, GAME_WIDTH),
        Phaser.Math.Between(GAME_HEIGHT/2, GAME_HEIGHT),
        char,
        {
          fontFamily: isHeart ? 'sans-serif' : "'Press Start 2P', monospace",
          fontSize: Phaser.Math.Between(12, 24) + 'px',
          color: color,
        }
      ).setAlpha(0);

      this.tweens.add({
        targets: p,
        y: '-=150',
        x: `+=${Phaser.Math.Between(-30, 30)}`,
        alpha: { start: 0, from: Phaser.Math.FloatBetween(0.4, 0.8), to: 0 },
        scale: { start: 0.5, to: 1.5 },
        duration: Phaser.Math.Between(4000, 8000),
        delay: Phaser.Math.Between(0, 4000),
        repeat: -1,
        onRepeat: () => {
          p.setY(Phaser.Math.Between(GAME_HEIGHT/2 + 100, GAME_HEIGHT + 50));
          p.setX(Phaser.Math.Between(0, GAME_WIDTH));
        }
      });
    }
  }

  private createButton(
    x: number, y: number, label: string,
    color1: number, color2: number, callback: () => void
  ) {
    const W = 300, H = 54;
    const container = this.add.container(x, y);

    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.3);
    shadow.fillRoundedRect(4, 4, W, H, 12);
    shadow.setPosition(-W/2, -H/2);

    const bg = this.add.graphics();
    bg.fillStyle(color1, 1);
    bg.fillRoundedRect(0, 0, W, H, 12);
    // Top highlight strip
    bg.fillStyle(0xffffff, 0.12);
    bg.fillRoundedRect(0, 0, W, H * 0.45, 12);
    bg.setPosition(-W/2, -H/2);

    const border = this.add.graphics();
    border.lineStyle(3, 0xffffff, 0.8);
    border.strokeRoundedRect(0, 0, W, H, 12);
    border.setPosition(-W/2, -H/2);

    const txt = this.add.text(0, 0, label, {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '14px',
      color: '#ffffff',
    }).setOrigin(0.5);
    txt.setShadow(2, 2, '#000', 0, false, true);

    container.add([shadow, bg, border, txt]);
    container.setSize(W, H).setInteractive({ cursor: 'pointer' });

    container.on('pointerover', () => {
      this.tweens.add({ targets: container, scale: 1.05, y: y - 4, duration: 150, ease: 'Back.easeOut' });
      border.lineStyle(4, 0xffeaa7, 1);
      border.strokeRoundedRect(0, 0, W, H, 12);
    });

    container.on('pointerout', () => {
      this.tweens.add({ targets: container, scale: 1, y: y, duration: 150, ease: 'Back.easeOut' });
      border.clear();
      border.lineStyle(3, 0xffffff, 0.8);
      border.strokeRoundedRect(0, 0, W, H, 12);
    });

    container.on('pointerdown', () => {
      this.tweens.add({ targets: container, scale: 0.95, duration: 100, yoyo: true });
      this.cameras.main.flash(200, 255, 255, 255, false);
      this.time.delayedCall(150, callback);
    });
  }

  private startGame() {
    this.cameras.main.fadeOut(800, 0, 0, 0, (_cam: unknown, progress: number) => {
      if (progress === 1) {
        this.scene.start(SCENES.GAME);
      }
    });
  }

  private showHelp() {
    const overlay = this.add.rectangle(
      GAME_WIDTH / 2, GAME_HEIGHT / 2,
      GAME_WIDTH, GAME_HEIGHT,
      0x000000, 0.8
    ).setDepth(50).setInteractive();

    const panel = this.add.graphics().setDepth(51);
    panel.fillStyle(0x34495e, 1);
    panel.fillRoundedRect(GAME_WIDTH/2 - 300, GAME_HEIGHT/2 - 250, 600, 500, 16);
    panel.lineStyle(4, 0x1abc9c, 1);
    panel.strokeRoundedRect(GAME_WIDTH/2 - 300, GAME_HEIGHT/2 - 250, 600, 500, 16);

    const helpText = [
      'COMO JOGAR  —  HUAP/UFF',
      '',
      '🎮 WASD / Setas — Mover',
      '🏃 SHIFT — Correr (consome energia)',
      '💬 E — Falar com NPC / Interagir',
      '📋 M — Ver missões e progresso',
      '⏸️ ESC — Pausar / Voltar ao menu',
      '',
      'Explore o HUAP, fale com os profissionais',
      'e complete missões para ganhar Prestígio.',
      '',
      '🚨 CRISES: Eventos aleatórios precisam de',
      'decisão rápida — escolha com cuidado!',
      '',
      '⚡ Energia: descanse na Copa (+6/s)',
      '😰 Estresse: reduza no jardim ou copa',
      '',
      'Feedback pedagógico baseado em:',
      'Kurcgant · COFEN · ONA · OMS/PNSP',
      '',
      '  [ Clique para fechar ]',
    ].join('\n');

    const txt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, helpText, {
      fontFamily: "'VT323', monospace",
      fontSize: '26px',
      color: '#ffeaa7',
      align: 'center',
      lineSpacing: 8,
    }).setOrigin(0.5).setDepth(52);

    const close = () => { overlay.destroy(); panel.destroy(); txt.destroy(); };
    overlay.on('pointerdown', close);
    this.input.keyboard?.once('keydown-ESC', close);
  }
}
