import * as Phaser from 'phaser';
import { TILE_SIZE, SCENES } from '../constants';
import { createTilesetTexture, NPC_DEFS } from '../data/gameData';

const SPR_W = 44;
const SPR_H = 128;
const FRAMES = 12;

function rrFill(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  if (w < 1 || h < 1) return;
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

function rrStroke(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  if (w < 1 || h < 1) return;
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

function darken(hex: string, amount = 0.2): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, ((n >> 16) & 0xff) * (1 - amount)) | 0;
  const g = Math.max(0, ((n >> 8) & 0xff) * (1 - amount)) | 0;
  const b = Math.max(0, (n & 0xff) * (1 - amount)) | 0;
  return `rgb(${r},${g},${b})`;
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

    const base = (import.meta as any).env?.BASE_URL || '/';
    this.load.image('huap_photo', `${base}assets/huap.png`);
    this.load.image('huap_pixelart', `${base}assets/huap_pixelart.png`);
    this.load.image('nurses_sprite', `${base}assets/nurses_sprite.png`);
  }

  create() {
    createTilesetTexture(this);
    // Use new sprite-sheet-based character creation if texture loaded, else fallback
    if (this.textures.exists('nurses_sprite')) {
      this.createPlayerSpriteFromSheet();
      this.createNPCSpritesFromSheet();
    } else {
      this.createPlayerSprite();
      this.createNPCSprites();
    }
    this.createPortraits();
    this.createPixelTexture();
    this.createLightTextures();
    this.createPixelizedHuap();
    this.scene.start(SCENES.MENU);
  }

  private createPixelizedHuap() {
    if (!this.textures.exists('huap_photo')) return;
    const img = this.textures.get('huap_photo').getSourceImage() as HTMLImageElement;
    if (!img || !img.width) return;

    const TARGET_W = 1280, TARGET_H = 720;
    const PIX_W = 256, PIX_H = 144;

    const small = document.createElement('canvas');
    small.width = PIX_W; small.height = PIX_H;
    const sctx = small.getContext('2d')!;
    sctx.imageSmoothingEnabled = false;

    const sR = img.width / img.height;
    const dR = PIX_W / PIX_H;
    let sx = 0, sy = 0, sw = img.width, sh = img.height;
    if (sR > dR) { sw = img.height * dR; sx = (img.width - sw) / 2; }
    else { sh = img.width / dR; sy = (img.height - sh) / 2; }
    sctx.drawImage(img, sx, sy, sw, sh, 0, 0, PIX_W, PIX_H);

    const data = sctx.getImageData(0, 0, PIX_W, PIX_H);
    const px = data.data;
    const LEVELS = 6;
    const step = 255 / (LEVELS - 1);
    for (let i = 0; i < px.length; i += 4) {
      let r = Math.round(px[i] / step) * step;
      let g = Math.round(px[i + 1] / step) * step;
      let b = Math.round(px[i + 2] / step) * step;
      const lum = (r + g + b) / 3;
      if (lum > 80 && lum < 210) {
        r = Math.max(0, Math.min(255, r + Math.round((r - lum) * 0.30)));
        g = Math.max(0, Math.min(255, g + Math.round((g - lum) * 0.30)));
        b = Math.max(0, Math.min(255, b + Math.round((b - lum) * 0.30)));
      }
      r = Math.min(255, r + 6); g = Math.min(255, g + 2);
      px[i] = r; px[i + 1] = g; px[i + 2] = b;
    }
    sctx.putImageData(data, 0, 0);

    if (this.textures.exists('huap_pixel')) this.textures.remove('huap_pixel');
    const big = this.textures.createCanvas('huap_pixel', TARGET_W, TARGET_H) as Phaser.Textures.CanvasTexture;
    const ctx = big.getContext();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(small, 0, 0, TARGET_W, TARGET_H);
    big.refresh();
  }

  private createLightTextures() {
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

    const ctLed = this.textures.createCanvas('red_led', 4, 4) as Phaser.Textures.CanvasTexture;
    const ctxLed = ctLed.getContext();
    ctxLed.fillStyle = '#ff2222'; ctxLed.fillRect(0, 0, 4, 4);
    ctxLed.fillStyle = '#ff9999'; ctxLed.fillRect(1, 1, 2, 2);
    ctLed.refresh();
  }

  private createPlayerSprite() {
    const key = 'player';
    if (this.textures.exists(key)) this.textures.remove(key);
    const ct = this.textures.createCanvas(key, SPR_W * FRAMES, SPR_H) as Phaser.Textures.CanvasTexture;
    const ctx = ct.getContext();

    for (let dir = 0; dir < 4; dir++) {
      for (let step = 0; step < 3; step++) {
        this.drawCharacter(ctx, dir * 3 + step, dir, step, {
          skin: '#f5c5a3', coat: '#1abc9c', coatDark: '#12876b',
          pants: '#0e6b55', hair: '#2c1a12', shoe: '#1a0f08',
          role: 'nurse', isPlayer: true,
        });
      }
    }
    ct.refresh();
    for (let i = 0; i < FRAMES; i++) ct.add(i, 0, i * SPR_W, 0, SPR_W, SPR_H);
  }

  private createNPCSprites() {
    for (const def of NPC_DEFS) {
      const key = def.spriteKey;
      if (this.textures.exists(key)) this.textures.remove(key);
      const ct = this.textures.createCanvas(key, SPR_W * FRAMES, SPR_H) as Phaser.Textures.CanvasTexture;
      const ctx = ct.getContext();

      const hexRgb = (n: number) => `rgb(${(n >> 16) & 0xff},${(n >> 8) & 0xff},${n & 0xff})`;
      const hexDark = (n: number, p = 0.3) => {
        const r = Math.max(0, ((n >> 16) & 0xff) * (1 - p)) | 0;
        const g = Math.max(0, ((n >> 8) & 0xff) * (1 - p)) | 0;
        const b = Math.max(0, (n & 0xff) * (1 - p)) | 0;
        return `rgb(${r},${g},${b})`;
      };
      const pantsDark = (n: number) => hexDark(n, 0.45);

      for (let dir = 0; dir < 4; dir++) {
        for (let step = 0; step < 3; step++) {
          this.drawCharacter(ctx, dir * 3 + step, dir, step, {
            skin: def.skinColor ? hexRgb(def.skinColor) : '#f5c5a3',
            coat: hexRgb(def.coatColor),
            coatDark: hexDark(def.coatColor),
            pants: pantsDark(def.coatColor),
            hair: hexRgb(def.hairColor),
            shoe: '#1a1008',
            role: def.role,
            isPlayer: false,
          });
        }
      }
      ct.refresh();
      for (let i = 0; i < FRAMES; i++) ct.add(i, 0, i * SPR_W, 0, SPR_W, SPR_H);
    }
  }

  // ── SPRITE SHEET CHARACTER CREATION ──────────────────────────────────────

  /**
   * Remove near-white background from the nurses sprite sheet so
   * characters have transparent backgrounds in-game.
   */
  private buildTransparentSheet(img: HTMLImageElement): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, img.width, img.height);
    const px = imageData.data;
    for (let i = 0; i < px.length; i += 4) {
      const r = px[i], g = px[i + 1], b = px[i + 2];
      const brightness = (r + g + b) / 3;
      if (brightness > 238) {
        px[i + 3] = 0; // fully transparent
      } else if (brightness > 210) {
        // smooth edge anti-aliasing
        px[i + 3] = Math.round((238 - brightness) / 28 * 255);
      }
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }

  /**
   * Draw one character frame from the sprite sheet into the target canvas.
   * sheetRow: 0=female, 1=male
   * sheetCol: 0-4=front walk, 5-9=side walk (facing right)
   * flipX: mirror horizontally (for left-facing)
   */
  private drawSheetFrame(
    ctx: CanvasRenderingContext2D,
    sheet: HTMLCanvasElement,
    gameFrame: number,
    sheetCol: number,
    sheetRow: number,
    flipX: boolean,
  ) {
    const COLS = 10, ROWS = 2;
    const frameW = sheet.width / COLS;
    const frameH = sheet.height / ROWS;
    const srcX = sheetCol * frameW;
    const srcY = sheetRow * frameH;
    const destX = gameFrame * SPR_W;

    if (flipX) {
      ctx.save();
      ctx.translate(destX + SPR_W, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(sheet, srcX, srcY, frameW, frameH, 0, 0, SPR_W, SPR_H);
      ctx.restore();
    } else {
      ctx.drawImage(sheet, srcX, srcY, frameW, frameH, destX, 0, SPR_W, SPR_H);
    }
  }

  private createPlayerSpriteFromSheet() {
    const key = 'player';
    if (this.textures.exists(key)) this.textures.remove(key);

    const imgEl = this.textures.get('nurses_sprite').getSourceImage() as HTMLImageElement;
    const sheet = this.buildTransparentSheet(imgEl);

    const ct = this.textures.createCanvas(key, SPR_W * FRAMES, SPR_H) as Phaser.Textures.CanvasTexture;
    const ctx = ct.getContext();

    // Female nurse = row 0. Front cols 0-4, side cols 5-9 (facing right).
    // Game frames: down(0-2), up(3-5), left(6-8), right(9-11)
    // [gameFrame, sheetCol, sheetRow, flipX]
    const map: [number, number, number, boolean][] = [
      [0, 2, 0, false], // down idle
      [1, 1, 0, false], // down step1
      [2, 3, 0, false], // down step2
      [3, 2, 0, false], // up idle (no back view, reuse front)
      [4, 1, 0, false], // up step1
      [5, 3, 0, false], // up step2
      [6, 5, 0, true],  // left idle (side frame, flipped)
      [7, 6, 0, true],  // left step1
      [8, 7, 0, true],  // left step2
      [9, 5, 0, false], // right idle (side frame)
      [10, 6, 0, false],// right step1
      [11, 7, 0, false],// right step2
    ];

    for (const [gf, sc, sr, fx] of map) {
      this.drawSheetFrame(ctx, sheet, gf, sc, sr, fx);
    }
    ct.refresh();
    for (let i = 0; i < FRAMES; i++) ct.add(i, 0, i * SPR_W, 0, SPR_W, SPR_H);
  }

  private createNPCSpritesFromSheet() {
    const imgEl = this.textures.get('nurses_sprite').getSourceImage() as HTMLImageElement;
    const sheet = this.buildTransparentSheet(imgEl);

    // Male nurse = row 1. Same column layout as female.
    const map: [number, number, number, boolean][] = [
      [0, 2, 1, false],
      [1, 1, 1, false],
      [2, 3, 1, false],
      [3, 2, 1, false],
      [4, 1, 1, false],
      [5, 3, 1, false],
      [6, 5, 1, true],
      [7, 6, 1, true],
      [8, 7, 1, true],
      [9, 5, 1, false],
      [10, 6, 1, false],
      [11, 7, 1, false],
    ];

    for (const def of NPC_DEFS) {
      const key = def.spriteKey;
      if (this.textures.exists(key)) this.textures.remove(key);
      const ct = this.textures.createCanvas(key, SPR_W * FRAMES, SPR_H) as Phaser.Textures.CanvasTexture;
      const ctx = ct.getContext();

      for (const [gf, sc, sr, fx] of map) {
        this.drawSheetFrame(ctx, sheet, gf, sc, sr, fx);
      }
      ct.refresh();
      for (let i = 0; i < FRAMES; i++) ct.add(i, 0, i * SPR_W, 0, SPR_W, SPR_H);
    }
  }

  // ── COMPLETE CHARACTER DRAWING SYSTEM ─────────────────────────────────────
  private drawCharacter(
    ctx: CanvasRenderingContext2D,
    fi: number, dir: number, step: number,
    c: { skin: string; coat: string; coatDark: string; pants: string; hair: string; shoe: string; role: string; isPlayer: boolean },
  ) {
    const x = fi * SPR_W;
    ctx.clearRect(x, 0, SPR_W, SPR_H);

    const isDown = dir === 0, isUp = dir === 1;
    const isLeft = dir === 2, isRight = dir === 3;
    const isLR = isLeft || isRight;
    const moving = step > 0;
    const facing = isRight ? 1 : -1;

    // Walk cycle parameters — improved amplitude and natural gait
    const stride = moving ? (step === 1 ? 8 : -8) : 0;    // leg stride
    const strideB = -stride;                                 // opposite leg
    const armSwing = moving ? (step === 1 ? 7 : -7) : 0;  // arm counter-swing
    const armSwingB = -armSwing;
    const bob = moving ? (step === 1 ? -2 : 1) : 0;       // vertical bob
    const tilt = moving && isLR ? (step === 1 ? 0.5 : -0.5) : 0; // subtle torso tilt
    const cx = x + SPR_W / 2;

    // Character anchor point (feet at row ~58)
    const groundY = 54;
    const bodyBase = groundY + bob; // feet baseline

    // ── SHADOW ──────────────────────────────────────────────────────────────
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(cx + (isLR ? facing * stride * 0.1 : 0), groundY + 2, 11, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // ── FEET / SHOES ─────────────────────────────────────────────────────────
    ctx.fillStyle = c.shoe;
    if (isLR) {
      // Front foot
      const ffx = cx - 2 + facing * (stride * 0.7);
      const bfx = cx - 2 - facing * (stride * 0.5);
      // Back foot (slightly lighter for depth)
      ctx.globalAlpha = 0.7;
      rrFill(ctx, bfx - 5, bodyBase - 4, 12, 5, 2);
      ctx.globalAlpha = 1;
      rrFill(ctx, ffx - 4, bodyBase - 4, 13, 5, 2);
      // Toe highlight
      ctx.fillStyle = darken(c.shoe, -0.4);
      ctx.fillRect(ffx + 8, bodyBase - 3, 2, 2);
    } else {
      // Down/Up view: two feet side by side with stride
      const leftFoot = bodyBase + (moving ? stride * 0.5 : 0);
      const rightFoot = bodyBase + (moving ? strideB * 0.5 : 0);
      rrFill(ctx, cx - 12, leftFoot - 4, 10, 5, 2);
      rrFill(ctx, cx + 2, rightFoot - 4, 10, 5, 2);
    }

    // ── LEGS / PANTS ──────────────────────────────────────────────────────────
    if (isLR) {
      // Back leg (drawn first = behind)
      ctx.fillStyle = darken(c.pants, 0.2);
      const bLegX = cx - 4 - facing * (stride * 0.45);
      rrFill(ctx, bLegX, bodyBase - 23, 7, 20, 3);
      // Front leg
      ctx.fillStyle = c.pants;
      const fLegX = cx - 3 + facing * (stride * 0.55);
      rrFill(ctx, fLegX, bodyBase - 23, 8, 20, 3);
      // Knee highlight on front leg
      ctx.fillStyle = darken(c.pants, -0.15);
      ctx.fillRect(fLegX + 1, bodyBase - 18, 4, 3);
    } else {
      // Front view: two legs
      ctx.fillStyle = c.pants;
      const leftLegY = bodyBase - 22 + (moving ? stride * 0.5 : 0);
      const rightLegY = bodyBase - 22 + (moving ? strideB * 0.5 : 0);
      rrFill(ctx, cx - 12, leftLegY, 9, 22, 3);
      rrFill(ctx, cx + 3, rightLegY, 9, 22, 3);
      // Leg shading
      ctx.fillStyle = darken(c.pants, 0.2);
      ctx.fillRect(cx - 3, leftLegY + 14, 2, 8);
      ctx.fillRect(cx + 10, rightLegY + 14, 2, 8);
    }

    // ── TORSO / UNIFORM TOP ───────────────────────────────────────────────────
    const torsoY = bodyBase - 44 + bob * 0.4;
    const torsoW = isLR ? 20 : 23;
    const torsoH = 22;
    const torsoX = cx - torsoW / 2;

    // Save/restore for tilt
    if (tilt !== 0 && isLR) {
      ctx.save();
      ctx.translate(cx, torsoY + torsoH / 2);
      ctx.rotate(tilt * 0.06);
      ctx.translate(-cx, -(torsoY + torsoH / 2));
    }

    // Torso shadow/depth
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(torsoX + 2, torsoY + 2, torsoW, torsoH);

    // Main torso
    ctx.fillStyle = c.coat;
    rrFill(ctx, torsoX, torsoY, torsoW, torsoH, 4);

    // Torso shading — sides and bottom
    ctx.fillStyle = c.coatDark;
    if (isLR) {
      // Side shading (back side darker)
      const shadeSide = facing > 0 ? torsoX : torsoX + torsoW - 4;
      rrFill(ctx, shadeSide, torsoY, 4, torsoH, 2);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(torsoX, torsoY + torsoH - 4, torsoW, 4);

    // V-neck underlay
    if (!isUp) {
      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      ctx.beginPath();
      if (isLR) {
        const vx = facing > 0 ? torsoX + 4 : torsoX + torsoW - 8;
        ctx.moveTo(vx, torsoY + 1);
        ctx.lineTo(vx + 4, torsoY + 1);
        ctx.lineTo(vx + 2, torsoY + 8);
        ctx.closePath();
      } else {
        ctx.moveTo(cx - 3, torsoY + 1);
        ctx.lineTo(cx + 3, torsoY + 1);
        ctx.lineTo(cx, torsoY + 9);
        ctx.closePath();
      }
      ctx.fill();
    }

    // Doctor white coat
    if (c.role === 'doctor') {
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      if (isLR) {
        rrFill(ctx, facing > 0 ? torsoX - 2 : torsoX + torsoW - 3, torsoY, 5, torsoH + 2, 2);
      } else if (!isUp) {
        rrFill(ctx, torsoX - 2, torsoY, 5, torsoH + 2, 2);
        rrFill(ctx, torsoX + torsoW - 3, torsoY, 5, torsoH + 2, 2);
        // Lapels
        ctx.beginPath();
        ctx.moveTo(cx - 2, torsoY + 1); ctx.lineTo(cx - 10, torsoY + 10);
        ctx.lineTo(cx - 10, torsoY + 1); ctx.closePath(); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx + 2, torsoY + 1); ctx.lineTo(cx + 10, torsoY + 10);
        ctx.lineTo(cx + 10, torsoY + 1); ctx.closePath(); ctx.fill();
      }
    }

    // Pocket detail
    if (!isUp) {
      ctx.fillStyle = darken(c.coat, 0.1);
      if (isLR) {
        const px2 = facing > 0 ? torsoX + torsoW - 7 : torsoX + 1;
        rrFill(ctx, px2, torsoY + 12, 5, 4, 1);
      } else {
        rrFill(ctx, cx + 3, torsoY + 12, 5, 4, 1);
      }
    }

    // Stethoscope
    if (!isUp && (c.role === 'nurse' || c.role === 'doctor' || c.isPlayer)) {
      ctx.strokeStyle = '#1a252f'; ctx.lineWidth = 1.8;
      if (isLR) {
        const stX = facing > 0 ? cx - 3 : cx - 2;
        ctx.beginPath(); ctx.arc(stX, torsoY + 8, 4, 0, Math.PI); ctx.stroke();
        ctx.fillStyle = '#1a252f';
        ctx.beginPath(); ctx.arc(stX + 4 * facing, torsoY + 12, 2.5, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.beginPath(); ctx.arc(cx, torsoY + 8, 5, 0, Math.PI); ctx.stroke();
        ctx.fillStyle = '#1a252f';
        ctx.beginPath(); ctx.arc(cx + 5, torsoY + 13, 2.5, 0, Math.PI * 2); ctx.fill();
      }
    }

    // ID Badge
    if (!isUp && (c.role === 'nurse' || c.role === 'admin' || c.role === 'receptionist' || c.isPlayer)) {
      const bdgX = isLR ? (facing > 0 ? cx - 10 : cx + 4) : cx - 11;
      ctx.fillStyle = '#e74c3c';
      rrFill(ctx, bdgX, torsoY + 5, 6, 8, 1);
      ctx.fillStyle = '#fff';
      ctx.fillRect(bdgX + 1, torsoY + 7, 4, 1);
      ctx.fillRect(bdgX + 1, torsoY + 9, 3, 1);
      ctx.fillRect(bdgX + 1, torsoY + 11, 4, 1);
    }

    // Clipboard (admin)
    if (c.role === 'admin' && !isUp) {
      const clipX = isRight ? cx + torsoW / 2 + 1 : isLeft ? cx - torsoW / 2 - 9 : cx + 10;
      const clipY = torsoY + 4;
      ctx.fillStyle = '#e8c97a';
      rrFill(ctx, clipX, clipY, 9, 13, 1);
      ctx.fillStyle = '#5d4037';
      ctx.fillRect(clipX + 2, clipY + 2, 5, 1);
      ctx.fillRect(clipX + 2, clipY + 5, 5, 1);
      ctx.fillRect(clipX + 2, clipY + 8, 4, 1);
      ctx.fillStyle = '#2c3e50';
      rrFill(ctx, clipX + 3, clipY - 1, 3, 3, 1);
    }

    if (tilt !== 0 && isLR) ctx.restore();

    // ── ARMS ──────────────────────────────────────────────────────────────────
    const armY = torsoY + 2;
    const armH = 18;

    if (isLR) {
      // Back arm
      const backArmX = facing > 0 ? torsoX - 5 : torsoX + torsoW - 1;
      ctx.fillStyle = darken(c.role === 'doctor' ? '#ffffff' : c.coat, 0.25);
      rrFill(ctx, backArmX, armY + armSwingB, 7, armH, 3);
      // Front arm
      const frontArmX = facing > 0 ? torsoX + torsoW - 2 : torsoX - 6;
      ctx.fillStyle = c.role === 'doctor' ? '#f0f0f0' : c.coat;
      rrFill(ctx, frontArmX, armY + armSwing, 7, armH, 3);
    } else {
      ctx.fillStyle = c.role === 'doctor' ? '#f0f0f0' : c.coat;
      rrFill(ctx, cx - 16, armY + armSwing, 7, armH, 3);
      rrFill(ctx, cx + 9, armY + armSwingB, 7, armH, 3);
      // Arm shading
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      ctx.fillRect(cx - 16, armY + armH - 3 + armSwing, 7, 3);
      ctx.fillRect(cx + 9, armY + armH - 3 + armSwingB, 7, 3);
    }

    // ── HANDS ─────────────────────────────────────────────────────────────────
    ctx.fillStyle = c.skin;
    if (isLR) {
      const fhY = armY + armH + armSwing - 1;
      const bhY = armY + armH + armSwingB - 1;
      const fhX = facing > 0 ? torsoX + torsoW - 1 : torsoX - 4;
      const bhX = facing > 0 ? torsoX - 3 : torsoX + torsoW - 3;
      ctx.globalAlpha = 0.75;
      ctx.beginPath(); ctx.arc(bhX + 3.5, bhY + 4, 4, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.arc(fhX + 3.5, fhY + 4, 4.5, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.beginPath(); ctx.arc(cx - 12, armY + armH + armSwing + 3, 4.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + 13, armY + armH + armSwingB + 3, 4.5, 0, Math.PI * 2); ctx.fill();
    }

    // ── NECK ─────────────────────────────────────────────────────────────────
    const neckY = torsoY - 7;
    ctx.fillStyle = c.skin;
    if (isLR) {
      rrFill(ctx, cx - 3, neckY, 7, 9, 2);
    } else {
      rrFill(ctx, cx - 4, neckY, 8, 9, 2);
    }
    // Neck shadow
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.fillRect(isLR ? cx - 3 : cx - 4, neckY + 5, isLR ? 7 : 8, 3);

    // ── HEAD ──────────────────────────────────────────────────────────────────
    const headCX = cx + (isLR ? facing * 1.5 : 0);
    const headCY = torsoY - 13 + bob * 0.3;
    const headRX = isLR ? 9 : 11;
    const headRY = isLR ? 11 : 12;

    // Head shadow
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.beginPath(); ctx.ellipse(headCX + 2, headCY + 2, headRX, headRY, 0, 0, Math.PI * 2); ctx.fill();

    // Head base
    ctx.fillStyle = c.skin;
    ctx.beginPath(); ctx.ellipse(headCX, headCY, headRX, headRY, 0, 0, Math.PI * 2); ctx.fill();

    // Head highlight
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath(); ctx.ellipse(headCX - headRX * 0.3, headCY - headRY * 0.3, headRX * 0.5, headRY * 0.4, 0, 0, Math.PI * 2); ctx.fill();

    // ── HAIR ──────────────────────────────────────────────────────────────────
    const isBald = false;
    if (!isBald) {
      ctx.fillStyle = c.hair;
      if (isDown) {
        ctx.beginPath(); ctx.ellipse(headCX, headCY - 6, headRX, 7, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillRect(headCX - headRX, headCY - 6, headRX * 2, 7);
        if (c.role === 'nurse' || c.isPlayer) {
          // Bun
          ctx.beginPath(); ctx.arc(headCX, headCY - 14, 5, 0, Math.PI * 2); ctx.fill();
        } else if (c.role === 'receptionist') {
          // Long hair
          ctx.fillRect(headCX - headRX - 1, headCY, 7, 11);
          ctx.fillRect(headCX + headRX - 5, headCY, 7, 11);
        }
      } else if (isUp) {
        ctx.beginPath(); ctx.ellipse(headCX, headCY - 5, headRX + 1, 8, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillRect(headCX - headRX - 1, headCY - 5, (headRX + 1) * 2, 14);
        if (c.role === 'nurse' || c.isPlayer) {
          ctx.beginPath(); ctx.arc(headCX, headCY - 15, 5, 0, Math.PI * 2); ctx.fill();
        }
      } else {
        // Side profile hair
        const hdir = facing;
        ctx.beginPath(); ctx.ellipse(headCX - hdir * 2, headCY - 5, headRX + 2, 8, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillRect(headCX - headRX - 1, headCY - 5, (headRX + 2) * 2, 10);
        if (c.role === 'nurse' || c.isPlayer) {
          ctx.beginPath(); ctx.arc(headCX - hdir * 2, headCY - 13, 5, 0, Math.PI * 2); ctx.fill();
        }
        // Sideburn/ear area
        ctx.fillRect(headCX + hdir * (headRX - 3), headCY, 4, 8);
      }
    }

    // ── NURSE CAP / HAT ───────────────────────────────────────────────────────
    if ((c.role === 'nurse' || c.isPlayer) && !isUp) {
      ctx.fillStyle = '#ffffff';
      rrFill(ctx, headCX - 9, headCY - 18, 18, 6, 1);
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(headCX - 9, headCY - 15, 18, 2.5);
    }

    // ── FACE FEATURES ────────────────────────────────────────────────────────
    if (!isUp) {
      const eyeY = headCY - 1;
      const noseY = headCY + 4;
      const mouthY = headCY + 8;

      if (isDown) {
        // Eyes
        ctx.fillStyle = '#1a2530';
        ctx.fillRect(headCX - 5.5, eyeY - 1, 4, 4);
        ctx.fillRect(headCX + 1.5, eyeY - 1, 4, 4);
        // Eye whites
        ctx.fillStyle = '#fff';
        ctx.fillRect(headCX - 5.5, eyeY - 1, 2, 2);
        ctx.fillRect(headCX + 1.5, eyeY - 1, 2, 2);
        // Pupils
        ctx.fillStyle = '#000';
        ctx.fillRect(headCX - 4, eyeY, 2, 2);
        ctx.fillRect(headCX + 3, eyeY, 2, 2);
        // Eyebrows
        ctx.fillStyle = c.hair;
        ctx.fillRect(headCX - 6, eyeY - 3, 5, 1.5);
        ctx.fillRect(headCX + 1, eyeY - 3, 5, 1.5);
        // Nose
        ctx.fillStyle = darken(c.skin, 0.18);
        ctx.beginPath(); ctx.arc(headCX, noseY, 1.5, 0, Math.PI * 2); ctx.fill();
        // Blush
        ctx.fillStyle = 'rgba(220,100,100,0.22)';
        ctx.beginPath(); ctx.arc(headCX - 6.5, eyeY + 3, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(headCX + 6.5, eyeY + 3, 2.5, 0, Math.PI * 2); ctx.fill();
        // Smile
        ctx.strokeStyle = darken(c.skin, 0.25); ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(headCX, mouthY, 3.5, 0.1, Math.PI - 0.1); ctx.stroke();
      } else if (isLeft) {
        // Profile: left side
        ctx.fillStyle = '#1a2530';
        ctx.fillRect(headCX - 7, eyeY - 1, 3.5, 3.5);
        ctx.fillStyle = '#fff';
        ctx.fillRect(headCX - 7, eyeY - 1, 1.5, 1.5);
        ctx.fillStyle = c.hair;
        ctx.fillRect(headCX - 8, eyeY - 4, 5, 1.5);
        // Nose profile
        ctx.fillStyle = darken(c.skin, 0.22);
        rrFill(ctx, headCX - headRX, noseY - 1, 4, 3, 1);
        // Ear
        ctx.fillStyle = darken(c.skin, 0.08);
        ctx.beginPath(); ctx.arc(headCX + 7, headCY + 1, 3, 0, Math.PI * 2); ctx.fill();
        // Mouth
        ctx.strokeStyle = darken(c.skin, 0.25); ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(headCX - 4, mouthY, 2.5, 0, Math.PI); ctx.stroke();
      } else {
        // Profile: right side
        ctx.fillStyle = '#1a2530';
        ctx.fillRect(headCX + 3.5, eyeY - 1, 3.5, 3.5);
        ctx.fillStyle = '#fff';
        ctx.fillRect(headCX + 3.5, eyeY - 1, 1.5, 1.5);
        ctx.fillStyle = c.hair;
        ctx.fillRect(headCX + 3, eyeY - 4, 5, 1.5);
        ctx.fillStyle = darken(c.skin, 0.22);
        rrFill(ctx, headCX + headRX - 3, noseY - 1, 4, 3, 1);
        ctx.fillStyle = darken(c.skin, 0.08);
        ctx.beginPath(); ctx.arc(headCX - 7, headCY + 1, 3, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = darken(c.skin, 0.25); ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(headCX + 4, mouthY, 2.5, 0, Math.PI); ctx.stroke();
      }
    }

    // ── GLASSES (doctor / admin) ───────────────────────────────────────────────
    if ((c.role === 'doctor' || c.role === 'admin') && isDown) {
      ctx.strokeStyle = '#4a5568'; ctx.lineWidth = 1.5;
      rrStroke(ctx, headCX - 9, headCY - 3, 7, 5, 2);
      rrStroke(ctx, headCX + 2, headCY - 3, 7, 5, 2);
      ctx.beginPath(); ctx.moveTo(headCX - 2, headCY); ctx.lineTo(headCX + 2, headCY); ctx.stroke();
    }
  }

  // ── PORTRAITS ─────────────────────────────────────────────────────────────
  private createPortraits() {
    for (const def of NPC_DEFS) {
      const key = `portrait_${def.id}`;
      if (this.textures.exists(key)) this.textures.remove(key);
      const ct = this.textures.createCanvas(key, 90, 90) as Phaser.Textures.CanvasTexture;
      const ctx = ct.getContext();

      const hexRgb = (n: number) => `rgb(${(n >> 16) & 0xff},${(n >> 8) & 0xff},${n & 0xff})`;
      const skinC = def.skinColor ? hexRgb(def.skinColor) : '#f5c5a3';
      const coatC = hexRgb(def.coatColor);
      const hairC = hexRgb(def.hairColor);
      const r0 = (def.coatColor >> 16) & 0xff;
      const g0 = (def.coatColor >> 8) & 0xff;
      const b0 = def.coatColor & 0xff;

      // Background gradient
      ctx.fillStyle = '#f8fafc'; ctx.fillRect(0, 0, 90, 90);
      const bgGrad = ctx.createLinearGradient(0, 0, 90, 90);
      bgGrad.addColorStop(0, `rgba(${r0},${g0},${b0},0.08)`);
      bgGrad.addColorStop(1, `rgba(${r0},${g0},${b0},0.35)`);
      ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, 90, 90);

      // Grid
      ctx.strokeStyle = 'rgba(0,0,0,0.04)'; ctx.lineWidth = 0.5;
      for (let j = 0; j < 90; j += 10) {
        ctx.beginPath(); ctx.moveTo(j, 0); ctx.lineTo(j, 90); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(90, j); ctx.stroke();
      }

      // Shoulders
      ctx.fillStyle = coatC;
      ctx.beginPath();
      ctx.moveTo(0, 90); ctx.lineTo(0, 60);
      ctx.bezierCurveTo(5, 52, 35, 50, 45, 52);
      ctx.bezierCurveTo(55, 50, 85, 52, 90, 60);
      ctx.lineTo(90, 90); ctx.closePath(); ctx.fill();

      // Doctor lapels
      if (def.role === 'doctor') {
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.beginPath(); ctx.moveTo(42, 52); ctx.lineTo(0, 65); ctx.lineTo(0, 52); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(48, 52); ctx.lineTo(90, 65); ctx.lineTo(90, 52); ctx.closePath(); ctx.fill();
      }

      // Stethoscope
      if (def.role === 'doctor' || def.role === 'nurse') {
        ctx.strokeStyle = '#1a252f'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(45, 62, 9, 0, Math.PI); ctx.stroke();
        ctx.fillStyle = '#1a252f';
        ctx.beginPath(); ctx.arc(45, 71, 4, 0, Math.PI * 2); ctx.fill();
      }

      // V-neck
      ctx.fillStyle = skinC;
      ctx.beginPath(); ctx.moveTo(40, 52); ctx.lineTo(45, 62); ctx.lineTo(50, 52); ctx.closePath(); ctx.fill();

      // Neck
      ctx.fillStyle = skinC; rrFill(ctx, 38, 40, 14, 16, 4);

      // Head
      ctx.fillStyle = skinC;
      ctx.beginPath(); ctx.ellipse(45, 26, 19, 22, 0, 0, Math.PI * 2); ctx.fill();
      // Head highlight
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.beginPath(); ctx.ellipse(38, 18, 8, 10, -0.3, 0, Math.PI * 2); ctx.fill();

      // Hair
      ctx.fillStyle = hairC;
      ctx.beginPath(); ctx.ellipse(45, 9, 19, 13, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(26, 9, 38, 18);

      // Eyebrows
      ctx.fillStyle = hairC;
      ctx.fillRect(33, 19, 9, 2); ctx.fillRect(48, 19, 9, 2);

      // Eyes
      ctx.fillStyle = '#1a2530';
      ctx.fillRect(34, 23, 6, 5); ctx.fillRect(50, 23, 6, 5);
      ctx.fillStyle = '#fff';
      ctx.fillRect(34, 23, 2.5, 2.5); ctx.fillRect(50, 23, 2.5, 2.5);
      ctx.fillStyle = '#000';
      ctx.fillRect(36, 24, 3, 3); ctx.fillRect(52, 24, 3, 3);

      // Nose
      ctx.fillStyle = darken(skinC, 0.14);
      ctx.beginPath(); ctx.arc(45, 31, 2, 0, Math.PI * 2); ctx.fill();

      // Smile
      ctx.strokeStyle = darken(skinC, 0.22); ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.arc(45, 37, 6, 0.15, Math.PI - 0.15); ctx.stroke();

      // Blush
      ctx.fillStyle = 'rgba(220,80,80,0.18)';
      ctx.beginPath(); ctx.arc(33, 33, 4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(57, 33, 4, 0, Math.PI * 2); ctx.fill();

      // Glasses
      if (def.role === 'doctor') {
        ctx.strokeStyle = '#4a5568'; ctx.lineWidth = 1.8;
        rrStroke(ctx, 33, 21, 10, 7, 2.5);
        rrStroke(ctx, 47, 21, 10, 7, 2.5);
        ctx.beginPath(); ctx.moveTo(43, 24); ctx.lineTo(47, 24); ctx.stroke();
      }

      // Nurse cap
      if (def.role === 'nurse') {
        ctx.fillStyle = '#ffffff';
        rrFill(ctx, 26, 4, 38, 7, 1);
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(26, 7, 38, 2.5);
      }

      // Badge
      if (def.role === 'nurse' || def.role === 'admin' || def.role === 'receptionist') {
        ctx.fillStyle = '#e74c3c';
        rrFill(ctx, 27, 55, 15, 20, 2);
        ctx.fillStyle = '#fff';
        ctx.fillRect(29, 59, 11, 2); ctx.fillRect(29, 63, 9, 2); ctx.fillRect(29, 67, 11, 2);
      }

      ct.refresh();
    }

    // Player portrait
    const pk = 'portrait_player';
    if (!this.textures.exists(pk)) {
      const ct = this.textures.createCanvas(pk, 90, 90) as Phaser.Textures.CanvasTexture;
      const ctx = ct.getContext();
      ctx.fillStyle = '#e0faf4'; ctx.fillRect(0, 0, 90, 90);
      const grad = ctx.createLinearGradient(0, 0, 90, 90);
      grad.addColorStop(0, 'rgba(26,188,156,0.1)');
      grad.addColorStop(1, 'rgba(26,188,156,0.35)');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, 90, 90);
      // Shoulders
      ctx.fillStyle = '#1abc9c';
      ctx.beginPath();
      ctx.moveTo(0, 90); ctx.lineTo(0, 60);
      ctx.bezierCurveTo(5, 52, 35, 50, 45, 52);
      ctx.bezierCurveTo(55, 50, 85, 52, 90, 60);
      ctx.lineTo(90, 90); ctx.closePath(); ctx.fill();
      // Stethoscope
      ctx.strokeStyle = '#1a252f'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(45, 62, 9, 0, Math.PI); ctx.stroke();
      ctx.fillStyle = '#1a252f'; ctx.beginPath(); ctx.arc(45, 71, 4, 0, Math.PI * 2); ctx.fill();
      // Head/neck/hair
      ctx.fillStyle = '#f5c5a3';
      ctx.beginPath(); ctx.ellipse(45, 26, 19, 22, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(38, 40, 14, 14);
      ctx.fillStyle = '#2c1a12';
      ctx.beginPath(); ctx.ellipse(45, 9, 19, 13, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(26, 9, 38, 18);
      ctx.beginPath(); ctx.arc(45, -2, 6, 0, Math.PI * 2); ctx.fill();
      // Cap
      ctx.fillStyle = '#ffffff'; rrFill(ctx, 26, 4, 38, 7, 1);
      ctx.fillStyle = '#e74c3c'; ctx.fillRect(26, 7, 38, 2.5);
      // Eyes
      ctx.fillStyle = '#1a2530'; ctx.fillRect(34, 23, 6, 5); ctx.fillRect(50, 23, 6, 5);
      ctx.fillStyle = '#fff'; ctx.fillRect(34, 23, 2.5, 2.5); ctx.fillRect(50, 23, 2.5, 2.5);
      ct.refresh();
    }
  }

  private createPixelTexture() {
    const key = 'pixel';
    if (this.textures.exists(key)) this.textures.remove(key);
    const ct = this.textures.createCanvas(key, TILE_SIZE, TILE_SIZE) as Phaser.Textures.CanvasTexture;
    ct.getContext().fillStyle = '#fff'; ct.getContext().fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    ct.refresh();
  }
}
