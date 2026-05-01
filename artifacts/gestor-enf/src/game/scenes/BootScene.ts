import * as Phaser from 'phaser';
import { TILE_SIZE, SCENES } from '../constants';
import { createTilesetTexture, NPC_DEFS } from '../data/gameData';

const SPR_W = 44;
const SPR_H = 64;
const FRAMES = 12;

// ── Canvas helper: rounded rect (fill) ────────────────────────────────────────
function rrFill(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  if (w < 0 || h < 0) return;
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
  ctx.fill();
}

// ── Canvas helper: rounded rect (stroke) ──────────────────────────────────────
function rrStroke(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  if (w < 0 || h < 0) return;
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
  ctx.stroke();
}

export class BootScene extends Phaser.Scene {
  constructor() { super({ key: SCENES.BOOT }); }

  preload() {
    const W = this.scale.width, H = this.scale.height;
    const barBg = this.add.graphics();
    barBg.fillStyle(0x2c3e50, 1);
    barBg.fillRoundedRect(W / 2 - 250, H / 2 - 15, 500, 30, 8);
    const barFill = this.add.graphics();
    const loadLabel = this.add.text(W / 2, H / 2 - 40, 'CARREGANDO HUAP...', {
      fontFamily: 'monospace', fontSize: '14px', color: '#1abc9c',
    }).setOrigin(0.5);
    this.load.on('progress', (v: number) => {
      barFill.clear();
      barFill.fillStyle(0x1abc9c, 1);
      barFill.fillRoundedRect(W / 2 - 248, H / 2 - 13, 496 * v, 26, 6);
    });
    void loadLabel;

    // HUAP/UFF cover images
    const base = (import.meta as any).env?.BASE_URL || '/';
    this.load.image('huap_photo', `${base}assets/huap.png`);
    this.load.image('huap_pixelart', `${base}assets/huap_pixelart.png`);
  }

  create() {
    createTilesetTexture(this);
    this.createPlayerSprite();
    this.createNPCSprites();
    this.createPortraits();
    this.createPixelTexture();
    this.createLightTextures();
    this.createPixelizedHuap();
    this.scene.start(SCENES.MENU);
  }

  // ── Render the loaded HUAP photo as a true pixel-art mural ───────────────
  private createPixelizedHuap() {
    if (!this.textures.exists('huap_photo')) return;
    const img = this.textures.get('huap_photo').getSourceImage() as HTMLImageElement;
    if (!img || !img.width) return;

    const TARGET_W = 1280, TARGET_H = 720;
    const PIX_W = 256, PIX_H = 144; // 5x downsample → chunky pixel grid

    const small = document.createElement('canvas');
    small.width = PIX_W; small.height = PIX_H;
    const sctx = small.getContext('2d')!;
    sctx.imageSmoothingEnabled = false;

    // Cover-fit: crop to target aspect
    const sR = img.width / img.height;
    const dR = PIX_W / PIX_H;
    let sx = 0, sy = 0, sw = img.width, sh = img.height;
    if (sR > dR) { sw = img.height * dR; sx = (img.width - sw) / 2; }
    else { sh = img.width / dR; sy = (img.height - sh) / 2; }
    sctx.drawImage(img, sx, sy, sw, sh, 0, 0, PIX_W, PIX_H);

    // Quantize to a limited palette + pop saturation in midtones
    const data = sctx.getImageData(0, 0, PIX_W, PIX_H);
    const px = data.data;
    const LEVELS = 6;
    const step = 255 / (LEVELS - 1);
    for (let i = 0; i < px.length; i += 4) {
      let r = Math.round(px[i]     / step) * step;
      let g = Math.round(px[i + 1] / step) * step;
      let b = Math.round(px[i + 2] / step) * step;
      const lum = (r + g + b) / 3;
      if (lum > 80 && lum < 210) {
        r = Math.max(0, Math.min(255, r + Math.round((r - lum) * 0.30)));
        g = Math.max(0, Math.min(255, g + Math.round((g - lum) * 0.30)));
        b = Math.max(0, Math.min(255, b + Math.round((b - lum) * 0.30)));
      }
      // Subtle warm cast — gives the brutalist façade a sunlit feel
      r = Math.min(255, r + 6);
      g = Math.min(255, g + 2);
      px[i] = r; px[i + 1] = g; px[i + 2] = b;
    }
    sctx.putImageData(data, 0, 0);

    // Upscale with nearest-neighbour for crisp pixels
    if (this.textures.exists('huap_pixel')) this.textures.remove('huap_pixel');
    const big = this.textures.createCanvas('huap_pixel', TARGET_W, TARGET_H) as Phaser.Textures.CanvasTexture;
    const ctx = big.getContext();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(small, 0, 0, TARGET_W, TARGET_H);
    big.refresh();
  }

  // ── LIGHT TEXTURES (For Lag-Free WebGL) ──────────────────────────────────
  private createLightTextures() {
    // Soft radial glow (white to transparent)
    const glowD = 256;
    const ctGlow = this.textures.createCanvas('light_glow', glowD, glowD) as Phaser.Textures.CanvasTexture;
    const ctxG = ctGlow.getContext();
    const grad = ctxG.createRadialGradient(glowD / 2, glowD / 2, 0, glowD / 2, glowD / 2, glowD / 2);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.2, 'rgba(255,255,255,0.8)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctxG.fillStyle = grad;
    ctxG.beginPath(); ctxG.arc(glowD / 2, glowD / 2, glowD / 2, 0, Math.PI * 2); ctxG.fill();
    ctGlow.refresh();

    // Red LED for monitors
    const ctLed = this.textures.createCanvas('red_led', 4, 4) as Phaser.Textures.CanvasTexture;
    const ctxLed = ctLed.getContext();
    ctxLed.fillStyle = '#ff0000'; ctxLed.fillRect(0, 0, 4, 4);
    ctxLed.fillStyle = '#ffffff'; ctxLed.fillRect(1, 1, 2, 2);
    ctLed.refresh();
  }

  // ── PLAYER SPRITE ─────────────────────────────────────────────────────────
  private createPlayerSprite() {
    const key = 'player';
    if (this.textures.exists(key)) this.textures.remove(key);
    const ct = this.textures.createCanvas(key, SPR_W * FRAMES, SPR_H) as Phaser.Textures.CanvasTexture;
    const ctx = ct.getContext();

    for (let dir = 0; dir < 4; dir++) {
      for (let step = 0; step < 3; step++) {
        this.drawCharacter(ctx, dir * 3 + step, dir, step, {
          skin: '#f5c5a3', coat: '#1abc9c', coatDark: '#16a085',
          hair: '#2c1a12', shoe: '#2c3e50', role: 'nurse', isPlayer: true,
        });
      }
    }
    ct.refresh();
    for (let i = 0; i < FRAMES; i++) ct.add(i, 0, i * SPR_W, 0, SPR_W, SPR_H);
  }

  // ── NPC SPRITES ───────────────────────────────────────────────────────────
  private createNPCSprites() {
    for (const def of NPC_DEFS) {
      const key = def.spriteKey;
      if (this.textures.exists(key)) this.textures.remove(key);
      const ct = this.textures.createCanvas(key, SPR_W * FRAMES, SPR_H) as Phaser.Textures.CanvasTexture;
      const ctx = ct.getContext();

      const hex = (n: number) => `rgb(${(n >> 16) & 0xff},${(n >> 8) & 0xff},${n & 0xff})`;
      const darker = (n: number, p = 0.25) => {
        const r = Math.max(0, ((n >> 16) & 0xff) * (1 - p)) | 0;
        const g = Math.max(0, ((n >> 8) & 0xff) * (1 - p)) | 0;
        const b = Math.max(0, (n & 0xff) * (1 - p)) | 0;
        return `rgb(${r},${g},${b})`;
      };

      for (let dir = 0; dir < 4; dir++) {
        for (let step = 0; step < 3; step++) {
          this.drawCharacter(ctx, dir * 3 + step, dir, step, {
            skin: def.skinColor ? hex(def.skinColor) : '#f5c5a3',
            coat: hex(def.coatColor),
            coatDark: darker(def.coatColor),
            hair: hex(def.hairColor),
            shoe: '#11151a',
            role: def.role,
            isPlayer: false,
          });
        }
      }
      ct.refresh();
      for (let i = 0; i < FRAMES; i++) ct.add(i, 0, i * SPR_W, 0, SPR_W, SPR_H);
    }
  }

  // ── SHARED CHARACTER DRAWING ───────────────────────────────────────────────
  private drawCharacter(
    ctx: CanvasRenderingContext2D,
    fi: number, dir: number, step: number,
    c: { skin: string; coat: string; coatDark: string; hair: string; shoe: string; role: string; isPlayer: boolean },
  ) {
    const x = fi * SPR_W;
    ctx.clearRect(x, 0, SPR_W, SPR_H);

    const isDown = dir === 0, isUp = dir === 1;
    const isLeft = dir === 2, isRight = dir === 3;
    const isLR = isLeft || isRight;
    const moving = step > 0;
    const facing = isRight ? 1 : -1;

    // Enhanced animation amplitude
    const legA = moving ? (step === 1 ? 5 : -5) : 0;
    const legB = -legA;
    const armA = moving ? (step === 1 ? 4 : -4) : 0;
    const bob = moving ? (step === 1 ? -1.5 : 1.5) : 0;
    const cx = x + SPR_W / 2;

    // Body Y-offset for taller sprites
    const oy = 12;

    // Shadow
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.ellipse(cx, 48 + oy, 13, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;

    // Shoes
    ctx.fillStyle = c.shoe;
    if (isLR) {
      rrFill(ctx, cx - 3 + facing * legA, 44 + bob + oy, 12, 6, 2.5);
      rrFill(ctx, cx - 11 - facing * legA, 44 + bob + oy, 12, 6, 2.5);
    } else {
      rrFill(ctx, cx - 11, 45 + bob + oy, 9, 6, 2.5);
      rrFill(ctx, cx + 2, 45 + bob + oy, 9, 6, 2.5);
    }

    // Legs / Pants
    ctx.fillStyle = c.coatDark; // Use darker tone for trousers/scrubs
    if (isLR) {
      rrFill(ctx, cx - 6 + facing * legA, 26 + bob + oy, 8, 20, 2);
      rrFill(ctx, cx + 1 - facing * legA, 26 + bob + oy, 8, 20, 2);
    } else {
      rrFill(ctx, cx - 10, 26 + bob + legA + oy, 8, 20, 2);
      rrFill(ctx, cx + 2, 26 + bob + legB + oy, 8, 20, 2);
    }

    // Torso / Scrub Top
    ctx.fillStyle = c.coat;
    rrFill(ctx, cx - 12, 11 + bob + oy, 24, 18, 4);
    // Torso Shading (bottom edge)
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(cx - 12, 26 + bob + oy, 24, 3);

    // V-neck underlay
    if (!isUp) {
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.beginPath();
      ctx.moveTo(cx - 4, 11 + bob + oy); ctx.lineTo(cx + 4, 11 + bob + oy);
      ctx.lineTo(cx, 19 + bob + oy); ctx.closePath(); ctx.fill();
    }

    // Doctor white lapels / Coat
    if (c.role === 'doctor') {
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      if (!isUp) {
        ctx.beginPath();
        ctx.moveTo(cx - 4, 11 + bob + oy); ctx.lineTo(cx - 12, 21 + bob + oy); 
        ctx.lineTo(cx - 12, 11 + bob + oy); ctx.closePath(); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx + 4, 11 + bob + oy); ctx.lineTo(cx + 12, 21 + bob + oy); 
        ctx.lineTo(cx + 12, 11 + bob + oy); ctx.closePath(); ctx.fill();
      }
      // White coat extending down
      rrFill(ctx, cx - 13, 11 + bob + oy, 5, 26, 2);
      rrFill(ctx, cx + 8, 11 + bob + oy, 5, 26, 2);
      if (isUp || isLR) {
        ctx.fillRect(cx - 12, 11 + bob + oy, 24, 26);
      }
    }

    // Badge
    if (!isUp && (c.role === 'nurse' || c.role === 'admin' || c.role === 'receptionist' || c.isPlayer)) {
      ctx.fillStyle = '#e74c3c';
      rrFill(ctx, cx - 9, 16 + bob + oy, 5, 7, 1.5);
      ctx.fillStyle = '#fff';
      ctx.fillRect(cx - 8, 17 + bob + oy, 3, 3);
    }

    // Stethoscope
    if (!isUp && (c.role === 'nurse' || c.role === 'doctor' || c.isPlayer)) {
      ctx.strokeStyle = '#2c3e50'; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.arc(cx, 19 + bob + oy, 5, 0, Math.PI); ctx.stroke();
      ctx.fillStyle = '#2c3e50';
      ctx.beginPath(); ctx.arc(cx + 5, 24 + bob + oy, 2, 0, Math.PI*2); ctx.fill();
    }

    // Arms
    ctx.fillStyle = (c.role === 'doctor') ? '#ffffff' : c.coat;
    if (isLR) {
      rrFill(ctx, cx - 16, 13 + bob + armA + oy, 8, 16, 4);
      rrFill(ctx, cx + 9, 13 + bob - armA + oy, 8, 16, 4);
      // Shading
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      ctx.fillRect(cx - 16, 26 + bob + armA + oy, 8, 3);
      ctx.fillRect(cx + 9, 26 + bob - armA + oy, 8, 3);
    } else {
      rrFill(ctx, cx - 16, 13 + bob + armA + oy, 7, 16, 3.5);
      rrFill(ctx, cx + 9, 13 + bob - armA + oy, 7, 16, 3.5);
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      ctx.fillRect(cx - 16, 26 + bob + armA + oy, 7, 3);
      ctx.fillRect(cx + 9, 26 + bob - armA + oy, 7, 3);
    }

    // Clipboard (admin)
    if (c.role === 'admin' && !isUp) {
      const clipX = isRight ? cx + 13 : isLeft ? cx - 18 : cx + 11;
      ctx.fillStyle = '#f1c40f';
      rrFill(ctx, clipX, 15 + bob + oy, 8, 11, 1);
      ctx.fillStyle = '#2c3e50';
      ctx.fillRect(clipX + 1, 18 + bob + oy, 6, 1);
      ctx.fillRect(clipX + 1, 21 + bob + oy, 6, 1);
      ctx.fillRect(clipX + 1, 24 + bob + oy, 6, 1);
    }

    // Hands
    ctx.fillStyle = c.skin;
    if (isLR) {
      ctx.beginPath(); ctx.arc(cx - 12, 30 + bob + armA + oy, 4.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + 13, 30 + bob - armA + oy, 4.5, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.beginPath(); ctx.arc(cx - 12.5, 30 + bob + oy, 4.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + 12.5, 30 + bob + oy, 4.5, 0, Math.PI * 2); ctx.fill();
    }

    // Neck
    ctx.fillStyle = c.skin;
    ctx.fillRect(cx - 4, 6 + bob + oy, 8, 7);
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(cx - 4, 10 + bob + oy, 8, 3);

    // Head
    ctx.fillStyle = c.skin;
    ctx.beginPath(); ctx.ellipse(cx, bob + oy, 11, 12, 0, 0, Math.PI * 2); ctx.fill();

    // Head shading
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.beginPath(); ctx.ellipse(cx + 7, 1 + bob + oy, 4, 9, 0.3, 0, Math.PI * 2); ctx.fill();

    // Hair
    ctx.fillStyle = c.hair;
    const isBald = (c.role === 'admin' && c.skin === '#8d5524');
    const hasBeard = (c.role === 'doctor' && c.skin === '#e0ac69');
    
    if (!isBald) {
      if (isDown) {
        ctx.beginPath(); ctx.ellipse(cx, -1 + bob + oy, 11, 6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillRect(cx - 11, -1 + bob + oy, 22, 6);
        if (c.role === 'nurse' || c.isPlayer) {
          ctx.beginPath(); ctx.arc(cx, -6 + bob + oy, 6, 0, Math.PI * 2); ctx.fill(); // neat bun
        } else if (c.role === 'receptionist') {
          ctx.fillRect(cx - 11.5, 4 + bob + oy, 7, 10);
          ctx.fillRect(cx + 4.5, 4 + bob + oy, 7, 10);
        }
      } else if (isUp) {
        ctx.beginPath(); ctx.ellipse(cx, -1 + bob + oy, 11, 7, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillRect(cx - 11, -1 + bob + oy, 22, 13);
        if (c.role === 'receptionist') {
          ctx.fillRect(cx - 12, 6 + bob + oy, 24, 12);
        }
      } else {
        const hdir = facing > 0 ? -1 : 1;
        ctx.beginPath(); ctx.ellipse(cx + hdir * 2, bob + oy, 11, 9, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillRect(cx - 11, bob + oy, 22, 9);
        if (c.role === 'receptionist') {
           ctx.fillRect(cx - hdir * 2 - 6, 4 + bob + oy, 12, 11);
        }
      }
    }

    // Face features
    if (!isUp) {
      ctx.fillStyle = '#2c3e50';
      if (isDown) {
        // Eyes
        ctx.fillRect(cx - 5.5, 4 + bob + oy, 3.5, 3.5); ctx.fillRect(cx + 2, 4 + bob + oy, 3.5, 3.5);
        ctx.fillStyle = '#fff';
        ctx.fillRect(cx - 5.5, 4 + bob + oy, 1.5, 1.5); ctx.fillRect(cx + 2, 4 + bob + oy, 1.5, 1.5);
        ctx.fillStyle = '#c47a5a';
        ctx.fillRect(cx - 2, 9 + bob + oy, 4, 2); // nose
        ctx.fillStyle = 'rgba(210,80,80,0.25)';
        ctx.beginPath(); ctx.arc(cx - 7.5, 9 + bob + oy, 2.5, 0, Math.PI*2); ctx.fill(); // blush L
        ctx.beginPath(); ctx.arc(cx + 7.5, 9 + bob + oy, 2.5, 0, Math.PI*2); ctx.fill(); // blush R
      } else if (isLeft) {
        ctx.fillRect(cx - 7, 5 + bob + oy, 3.5, 3.5);
        ctx.fillStyle = '#fff'; ctx.fillRect(cx - 7, 5 + bob + oy, 1.5, 1.5);
        ctx.fillStyle = '#c47a5a'; ctx.fillRect(cx - 9, 9 + bob + oy, 3.5, 2); // nose profile
      } else {
        ctx.fillRect(cx + 3.5, 5 + bob + oy, 3.5, 3.5);
        ctx.fillStyle = '#fff'; ctx.fillRect(cx + 3.5, 5 + bob + oy, 1.5, 1.5);
        ctx.fillStyle = '#c47a5a'; ctx.fillRect(cx + 5.5, 9 + bob + oy, 3.5, 2); // nose profile
      }
    }

    // Beard
    if (hasBeard && !isUp) {
       ctx.fillStyle = c.hair;
       if (isDown) {
          ctx.beginPath(); ctx.arc(cx, 12 + bob + oy, 5, 0, Math.PI); ctx.fill();
          ctx.fillRect(cx - 5, 10 + bob + oy, 10, 4);
       } else {
          const fx = isLeft ? cx - 7 : cx + 3;
          ctx.fillRect(fx, 10 + bob + oy, 4, 6);
       }
    }

    // Glasses (doctor or admin)
    if ((c.role === 'doctor' || c.role === 'admin') && isDown && !isBald) {
      ctx.strokeStyle = '#2c3e50'; ctx.lineWidth = 1.5;
      rrStroke(ctx, cx - 8, 3 + bob + oy, 6, 5, 2);
      rrStroke(ctx, cx + 2, 3 + bob + oy, 6, 5, 2);
      ctx.beginPath(); ctx.moveTo(cx - 2, 5 + bob + oy); ctx.lineTo(cx + 2, 5 + bob + oy); ctx.stroke();
    }

    // Nurse cap 
    if ((c.role === 'nurse' || c.isPlayer) && !isUp) {
      ctx.fillStyle = '#ffffff';
      rrFill(ctx, cx - 8, -4 + bob + oy, 16, 5, 1);
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(cx - 8, -2 + bob + oy, 16, 2.5);
    }
  }

  // ── PORTRAITS ─────────────────────────────────────────────────────────────
  private createPortraits() {
    for (const def of NPC_DEFS) {
      const key = `portrait_${def.id}`;
      if (this.textures.exists(key)) this.textures.remove(key);
      const ct = this.textures.createCanvas(key, 90, 90) as Phaser.Textures.CanvasTexture;
      const ctx = ct.getContext();

      const hex = (n: number) => `rgb(${(n >> 16) & 0xff},${(n >> 8) & 0xff},${n & 0xff})`;
      const skinC = def.skinColor ? hex(def.skinColor) : '#f5c5a3';
      const coatC = hex(def.coatColor);
      const hairC = hex(def.hairColor);
      const r0 = (def.coatColor >> 16) & 0xff;
      const g0 = (def.coatColor >> 8) & 0xff;
      const b0 = def.coatColor & 0xff;

      // BG
      ctx.fillStyle = '#f8fafc'; ctx.fillRect(0, 0, 90, 90);
      const bgGrad = ctx.createLinearGradient(0, 0, 90, 90);
      bgGrad.addColorStop(0, `rgba(${r0},${g0},${b0},0.1)`);
      bgGrad.addColorStop(1, `rgba(${r0},${g0},${b0},0.38)`);
      ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, 90, 90);

      // Grid lines
      ctx.strokeStyle = 'rgba(0,0,0,0.04)'; ctx.lineWidth = 0.5;
      for (let j = 0; j < 90; j += 10) {
        ctx.beginPath(); ctx.moveTo(j, 0); ctx.lineTo(j, 90); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(90, j); ctx.stroke();
      }

      // Shoulders
      ctx.fillStyle = coatC;
      ctx.beginPath();
      ctx.moveTo(0, 90); ctx.lineTo(0, 58);
      ctx.bezierCurveTo(5, 50, 35, 48, 45, 50);
      ctx.bezierCurveTo(55, 48, 85, 50, 90, 58);
      ctx.lineTo(90, 90); ctx.closePath(); ctx.fill();

      // Doctor lapels
      if (def.role === 'doctor') {
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.beginPath(); ctx.moveTo(42, 50); ctx.lineTo(0, 62); ctx.lineTo(0, 50); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(48, 50); ctx.lineTo(90, 62); ctx.lineTo(90, 50); ctx.closePath(); ctx.fill();
      }

      // V-neck
      ctx.fillStyle = skinC;
      ctx.beginPath(); ctx.moveTo(40, 50); ctx.lineTo(45, 60); ctx.lineTo(50, 50); ctx.closePath(); ctx.fill();

      // Neck
      ctx.fillStyle = skinC; rrFill(ctx, 38, 38, 14, 16, 4);

      // Head
      ctx.fillStyle = skinC;
      ctx.beginPath(); ctx.ellipse(45, 25, 18, 22, 0, 0, Math.PI * 2); ctx.fill();

      // Hair
      ctx.fillStyle = hairC;
      ctx.beginPath(); ctx.ellipse(45, 8, 18, 12, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(27, 8, 36, 18);

      // Eyes
      ctx.fillStyle = '#2c3e50';
      ctx.fillRect(36, 22, 5, 4); ctx.fillRect(49, 22, 5, 4);
      ctx.fillStyle = '#fff';
      ctx.fillRect(36, 22, 2, 2); ctx.fillRect(49, 22, 2, 2);

      // Eyebrows
      ctx.fillStyle = hairC;
      ctx.fillRect(35, 18, 8, 2); ctx.fillRect(47, 18, 8, 2);

      // Nose
      ctx.fillStyle = 'rgba(160,80,50,0.3)';
      ctx.beginPath(); ctx.arc(45, 30, 2, 0, Math.PI * 2); ctx.fill();

      // Smile
      ctx.strokeStyle = '#c47a5a'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(45, 35, 6, 0.2, Math.PI - 0.2); ctx.stroke();

      // Glasses (doctor)
      if (def.role === 'doctor') {
        ctx.strokeStyle = '#7f8c8d'; ctx.lineWidth = 1.5;
        rrStroke(ctx, 34, 20, 9, 6, 2);
        rrStroke(ctx, 47, 20, 9, 6, 2);
        ctx.beginPath(); ctx.moveTo(43, 23); ctx.lineTo(47, 23); ctx.stroke();
      }

      // Stethoscope
      if (def.role === 'doctor' || def.role === 'nurse') {
        ctx.strokeStyle = '#2c3e50'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(45, 58, 8, 0, Math.PI); ctx.stroke();
        ctx.beginPath(); ctx.arc(45, 66, 4, 0, Math.PI * 2); ctx.stroke();
      }

      // Badge
      if (def.role === 'nurse' || def.role === 'admin' || def.role === 'receptionist') {
        ctx.fillStyle = '#e74c3c';
        rrFill(ctx, 28, 52, 14, 18, 2);
        ctx.fillStyle = '#fff';
        ctx.fillRect(30, 56, 10, 2); ctx.fillRect(30, 60, 8, 2); ctx.fillRect(30, 64, 10, 2);
      }

      ct.refresh();
    }

    // Player portrait
    const pk = 'portrait_player';
    if (!this.textures.exists(pk)) {
      const ct = this.textures.createCanvas(pk, 90, 90) as Phaser.Textures.CanvasTexture;
      const ctx = ct.getContext();
      ctx.fillStyle = '#e0faf4'; ctx.fillRect(0, 0, 90, 90);
      ctx.fillStyle = '#1abc9c';
      ctx.beginPath(); ctx.moveTo(0, 90); ctx.lineTo(0, 58);
      ctx.bezierCurveTo(5, 50, 35, 48, 45, 50);
      ctx.bezierCurveTo(55, 48, 85, 50, 90, 58);
      ctx.lineTo(90, 90); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#f5c5a3';
      ctx.beginPath(); ctx.ellipse(45, 25, 18, 22, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(38, 38, 14, 14);
      ctx.fillStyle = '#4a3728';
      ctx.beginPath(); ctx.ellipse(45, 8, 18, 12, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(27, 8, 36, 16);
      ctx.beginPath(); ctx.arc(45, -4, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2c3e50'; ctx.fillRect(36, 22, 5, 4); ctx.fillRect(49, 22, 5, 4);
      ctx.fillStyle = '#e74c3c'; ctx.fillRect(27, 3, 36, 3);
      ct.refresh();
    }
  }

  // ── PIXEL TEXTURE ─────────────────────────────────────────────────────────
  private createPixelTexture() {
    const key = 'pixel';
    if (this.textures.exists(key)) this.textures.remove(key);
    const ct = this.textures.createCanvas(key, TILE_SIZE, TILE_SIZE) as Phaser.Textures.CanvasTexture;
    ct.getContext().fillStyle = '#fff'; ct.getContext().fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    ct.refresh();
  }
}
