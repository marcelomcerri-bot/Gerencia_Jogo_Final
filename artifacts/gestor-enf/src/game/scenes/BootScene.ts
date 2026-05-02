import * as Phaser from 'phaser';
import { TILE_SIZE, SCENES } from '../constants';
import { createTilesetTexture, NPC_DEFS } from '../data/gameData';

const SPR_W = 44;
const SPR_H = 128;
const FRAMES = 24; // 6 frames × 4 directions (down, up, right, left)

// Size at which the sprite is drawn inside the 44×128 canvas.
// groundY=72 → DRAW_H must be ≥72 so feet from the sheet align with the physics body (offset 65).
const DRAW_W = 40;  // visual width (centered in 44px canvas → 2px padding each side)
const DRAW_H = 76;  // visual height — feet of source image land at ≈y=76, physics body offset=65
const DRAW_X_OFF = Math.round((SPR_W - DRAW_W) / 2); // horizontal centering offset

// New sprite sheet pixel coordinates (measured from 1704×923 source image)
const FRAME_COLS = [
  { x1: 168, x2: 233 },
  { x1: 276, x2: 344 },
  { x1: 386, x2: 457 },
  { x1: 498, x2: 567 },
  { x1: 611, x2: 678 },
  { x1: 719, x2: 787 },
];
const CHAR_ROWS = {
  female: {
    front: [14, 160] as [number, number],
    side:  [173, 307] as [number, number],
    back:  [321, 457] as [number, number],
  },
  male: {
    front: [496, 628] as [number, number],
    side:  [645, 770] as [number, number],
    back:  [784, 908] as [number, number],
  },
};

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
  let r: number, g: number, b: number;
  if (hex.startsWith('rgb')) {
    const m = hex.match(/\d+/g)!;
    r = +m[0]; g = +m[1]; b = +m[2];
  } else {
    const n = parseInt(hex.replace('#', ''), 16);
    r = (n >> 16) & 0xff; g = (n >> 8) & 0xff; b = n & 0xff;
  }
  r = Math.max(0, Math.min(255, r * (1 - amount))) | 0;
  g = Math.max(0, Math.min(255, g * (1 - amount))) | 0;
  b = Math.max(0, Math.min(255, b * (1 - amount))) | 0;
  return `rgb(${r},${g},${b})`;
}

// ── CHARACTER VISUAL PROFILES ─────────────────────────────────────────────────
interface CharVisual {
  gender: 'male' | 'female';
  hairStyle: string;
  build: 'slim' | 'medium' | 'stocky';
  groundYOff: number;
  age: 'young' | 'adult' | 'senior';
  accessory: 'none' | 'glasses' | 'surgical_cap' | 'mask';
  nurseCap: boolean;
}

const DEFAULT_VISUAL: CharVisual = {
  gender: 'male', hairStyle: 'short_neat', build: 'medium', groundYOff: 0,
  age: 'adult', accessory: 'none', nurseCap: false,
};

const CHAR_VISUALS: Record<string, CharVisual> = {
  player:        { gender: 'female', hairStyle: 'bun',              build: 'medium', groundYOff:  0, age: 'adult',  accessory: 'none',         nurseCap: true  },
  npc_ana:       { gender: 'female', hairStyle: 'bob',              build: 'medium', groundYOff:  3, age: 'adult',  accessory: 'none',         nurseCap: false },
  npc_carlos:    { gender: 'male',   hairStyle: 'low_fade',         build: 'medium', groundYOff: -2, age: 'adult',  accessory: 'none',         nurseCap: false },
  npc_joao:      { gender: 'male',   hairStyle: 'curly_top',        build: 'slim',   groundYOff:  0, age: 'young',  accessory: 'glasses',      nurseCap: false },
  npc_renata:    { gender: 'female', hairStyle: 'ponytail',         build: 'medium', groundYOff:  0, age: 'adult',  accessory: 'none',         nurseCap: false },
  npc_farias:    { gender: 'male',   hairStyle: 'receding',         build: 'stocky', groundYOff: -4, age: 'senior', accessory: 'none',         nurseCap: false },
  npc_diretora:  { gender: 'female', hairStyle: 'updo',             build: 'medium', groundYOff:  0, age: 'senior', accessory: 'glasses',      nurseCap: false },
  npc_rosa:      { gender: 'female', hairStyle: 'afro_short',       build: 'stocky', groundYOff:  4, age: 'adult',  accessory: 'surgical_cap', nurseCap: false },
  npc_clara:     { gender: 'female', hairStyle: 'loose_long',       build: 'slim',   groundYOff:  0, age: 'young',  accessory: 'none',         nurseCap: false },
  npc_maria:     { gender: 'female', hairStyle: 'high_pony',        build: 'medium', groundYOff:  2, age: 'adult',  accessory: 'none',         nurseCap: false },
  npc_dr:        { gender: 'male',   hairStyle: 'business',         build: 'medium', groundYOff: -4, age: 'adult',  accessory: 'none',         nurseCap: false },
  npc_santos:    { gender: 'female', hairStyle: 'long_tied',        build: 'slim',   groundYOff: -2, age: 'adult',  accessory: 'none',         nurseCap: false },
  npc_pedro:     { gender: 'male',   hairStyle: 'short_wavy',       build: 'slim',   groundYOff:  0, age: 'young',  accessory: 'none',         nurseCap: false },
  npc_patient_1: { gender: 'male',   hairStyle: 'bald',             build: 'stocky', groundYOff:  2, age: 'senior', accessory: 'none',         nurseCap: false },
  npc_patient_2: { gender: 'female', hairStyle: 'short_curly_gray', build: 'stocky', groundYOff:  3, age: 'senior', accessory: 'none',         nurseCap: false },
  npc_patient_3: { gender: 'male',   hairStyle: 'short_neat',       build: 'medium', groundYOff:  0, age: 'adult',  accessory: 'none',         nurseCap: false },
};

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
    this.load.image('portrait_img_nurse', `${base}assets/portrait_nurse_f.png`);
    this.load.image('portrait_img_doctor', `${base}assets/portrait_doctor_m.png`);
    this.load.image('portrait_img_admin', `${base}assets/portrait_admin_f.png`);
    this.load.image('portrait_img_receptionist', `${base}assets/portrait_receptionist.png`);
  }

  create() {
    createTilesetTexture(this);
    // Always use procedural sprite system for full visual diversity.
    // The sprite-sheet approach only has 2 designs (male/female) — all NPCs looked identical.
    this.createPlayerSprite();
    this.createNPCSprites();
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
    const visual = CHAR_VISUALS[key] ?? DEFAULT_VISUAL;

    for (let dir = 0; dir < 4; dir++) {
      for (let step = 0; step < 6; step++) {
        this.drawCharacter(ctx, dir * 6 + step, dir, step, {
          skin: '#f5c5a3', coat: '#1abc9c', coatDark: '#12876b',
          pants: '#0e6b55', hair: '#2c1a12', shoe: '#1a0f08',
          role: 'nurse', isPlayer: true, visual,
        });
      }
    }
    ct.refresh();
    for (let i = 0; i < FRAMES; i++) ct.add(i, 0, i * SPR_W, 0, SPR_W, SPR_H);
  }

  private createNPCSprites() {
    const hexRgb = (n: number) => `rgb(${(n >> 16) & 0xff},${(n >> 8) & 0xff},${n & 0xff})`;
    const hexDark = (n: number, p = 0.3) => {
      const r = Math.max(0, ((n >> 16) & 0xff) * (1 - p)) | 0;
      const g = Math.max(0, ((n >> 8) & 0xff) * (1 - p)) | 0;
      const b = Math.max(0, (n & 0xff) * (1 - p)) | 0;
      return `rgb(${r},${g},${b})`;
    };
    const pantsDark = (n: number) => hexDark(n, 0.45);

    for (const def of NPC_DEFS) {
      const key = def.spriteKey;
      if (this.textures.exists(key)) this.textures.remove(key);
      const ct = this.textures.createCanvas(key, SPR_W * FRAMES, SPR_H) as Phaser.Textures.CanvasTexture;
      const ctx = ct.getContext();
      const visual = CHAR_VISUALS[key] ?? DEFAULT_VISUAL;

      for (let dir = 0; dir < 4; dir++) {
        for (let step = 0; step < 6; step++) {
          this.drawCharacter(ctx, dir * 6 + step, dir, step, {
            skin: def.skinColor ? hexRgb(def.skinColor) : '#f5c5a3',
            coat: hexRgb(def.coatColor),
            coatDark: hexDark(def.coatColor),
            pants: pantsDark(def.coatColor),
            hair: hexRgb(def.hairColor),
            shoe: '#1a1008',
            role: def.role,
            isPlayer: false,
            visual,
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
   * Draw one frame from the new sprite sheet using exact pixel coordinates.
   * colSpec: {x1, x2} pixel range in source for this frame column
   * rowSpec: [y1, y2] pixel range in source for this direction row
   * flipX: mirror horizontally (for left-facing)
   */
  private drawNewSheetFrame(
    ctx: CanvasRenderingContext2D,
    sheet: HTMLCanvasElement,
    gameFrame: number,
    colSpec: { x1: number; x2: number },
    rowSpec: [number, number],
    flipX: boolean,
  ) {
    const srcX = colSpec.x1;
    const srcY = rowSpec[0];
    const srcW = colSpec.x2 - colSpec.x1 + 1;
    const srcH = rowSpec[1] - rowSpec[0] + 1;
    // Destination: draw the character into a DRAW_W×DRAW_H area
    // centred horizontally and top-anchored inside the SPR_W×SPR_H canvas.
    const slotX = gameFrame * SPR_W; // left edge of this frame slot in the atlas
    const destX = slotX + DRAW_X_OFF;
    const destY = 0;

    if (flipX) {
      ctx.save();
      ctx.translate(slotX + SPR_W - DRAW_X_OFF, destY);
      ctx.scale(-1, 1);
      ctx.drawImage(sheet, srcX, srcY, srcW, srcH, 0, 0, DRAW_W, DRAW_H);
      ctx.restore();
    } else {
      ctx.drawImage(sheet, srcX, srcY, srcW, srcH, destX, destY, DRAW_W, DRAW_H);
    }
  }

  private buildCharSprite(key: string, rows: { front: [number,number]; side: [number,number]; back: [number,number] }, sheet: HTMLCanvasElement) {
    if (this.textures.exists(key)) this.textures.remove(key);
    const ct = this.textures.createCanvas(key, SPR_W * FRAMES, SPR_H) as Phaser.Textures.CanvasTexture;
    const ctx = ct.getContext();

    // Game frame layout: down(0-5)=front, up(6-11)=back, right(12-17)=side, left(18-23)=side flipped
    for (let f = 0; f < 6; f++) {
      this.drawNewSheetFrame(ctx, sheet, f,      FRAME_COLS[f], rows.front, false); // down
      this.drawNewSheetFrame(ctx, sheet, 6 + f,  FRAME_COLS[f], rows.back,  false); // up
      this.drawNewSheetFrame(ctx, sheet, 12 + f, FRAME_COLS[f], rows.side,  false); // right
      this.drawNewSheetFrame(ctx, sheet, 18 + f, FRAME_COLS[f], rows.side,  true);  // left (mirrored)
    }

    ct.refresh();
    for (let i = 0; i < FRAMES; i++) ct.add(i, 0, i * SPR_W, 0, SPR_W, SPR_H);
  }

  private createPlayerSpriteFromSheet() {
    const imgEl = this.textures.get('nurses_sprite').getSourceImage() as HTMLImageElement;
    const sheet = this.buildTransparentSheet(imgEl);
    this.buildCharSprite('player', CHAR_ROWS.female, sheet);
  }

  private createNPCSpritesFromSheet() {
    const imgEl = this.textures.get('nurses_sprite').getSourceImage() as HTMLImageElement;
    const sheet = this.buildTransparentSheet(imgEl);

    for (const def of NPC_DEFS) {
      this.buildCharSprite(def.spriteKey, CHAR_ROWS.male, sheet);
    }
  }

  // ── COMPLETE CHARACTER DRAWING SYSTEM ─────────────────────────────────────
  private drawCharacter(
    ctx: CanvasRenderingContext2D,
    fi: number, dir: number, step: number,
    c: { skin: string; coat: string; coatDark: string; pants: string; hair: string; shoe: string; role: string; isPlayer: boolean; visual: CharVisual },
  ) {
    const x = fi * SPR_W;
    ctx.clearRect(x, 0, SPR_W, SPR_H);

    const { visual } = c;
    const isDown = dir === 0, isUp = dir === 1;
    const isLeft = dir === 2, isRight = dir === 3;
    const isLR = isLeft || isRight;
    const moving = step > 0;
    const facing = isRight ? 1 : -1;

    const phase = moving ? (step - 1) * (Math.PI * 2 / 5) : 0;
    const stride = moving ? Math.sin(phase) * 8 : 0;
    const strideB = -stride;
    const armSwing = moving ? -Math.sin(phase) * 7 : 0;
    const armSwingB = -armSwing;
    const bob = moving ? -Math.abs(Math.sin(phase)) * 1.5 : 0;
    const tilt = moving && isLR ? Math.sin(phase) * 0.5 : 0;
    const cx = x + SPR_W / 2;

    // Build-based width adjustments
    const buildOff = visual.build === 'slim' ? -2 : visual.build === 'stocky' ? 3 : 0;
    const legW1 = 7 + (buildOff > 0 ? 2 : 0);
    const legW2 = 8 + (buildOff > 0 ? 2 : 0);

    // Height adjustment via groundY offset
    const groundY = 72 + visual.groundYOff;
    const bodyBase = groundY + bob;

    // ── SHADOW ──────────────────────────────────────────────────────────────
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(cx + (isLR ? facing * stride * 0.1 : 0), groundY + 2, 11 + buildOff, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // ── FEET / SHOES ─────────────────────────────────────────────────────────
    ctx.fillStyle = c.shoe;
    if (isLR) {
      const ffx = cx - 2 + facing * (stride * 0.7);
      const bfx = cx - 2 - facing * (stride * 0.5);
      ctx.globalAlpha = 0.7;
      rrFill(ctx, bfx - 5, bodyBase - 4, 12, 5, 2);
      ctx.globalAlpha = 1;
      rrFill(ctx, ffx - 4, bodyBase - 4, 13, 5, 2);
      ctx.fillStyle = darken(c.shoe, -0.4);
      ctx.fillRect(ffx + 8, bodyBase - 3, 2, 2);
    } else {
      const leftFoot = bodyBase + (moving ? stride * 0.5 : 0);
      const rightFoot = bodyBase + (moving ? strideB * 0.5 : 0);
      rrFill(ctx, cx - 12, leftFoot - 4, 10, 5, 2);
      rrFill(ctx, cx + 2, rightFoot - 4, 10, 5, 2);
    }

    // ── LEGS / PANTS ──────────────────────────────────────────────────────────
    if (isLR) {
      ctx.fillStyle = darken(c.pants, 0.2);
      const bLegX = cx - 4 - facing * (stride * 0.45);
      rrFill(ctx, bLegX, bodyBase - 23, legW1, 20, 3);
      ctx.fillStyle = c.pants;
      const fLegX = cx - 3 + facing * (stride * 0.55);
      rrFill(ctx, fLegX, bodyBase - 23, legW2, 20, 3);
      ctx.fillStyle = darken(c.pants, -0.15);
      ctx.fillRect(fLegX + 1, bodyBase - 18, 4, 3);
    } else {
      ctx.fillStyle = c.pants;
      const leftLegY = bodyBase - 22 + (moving ? stride * 0.5 : 0);
      const rightLegY = bodyBase - 22 + (moving ? strideB * 0.5 : 0);
      rrFill(ctx, cx - 12, leftLegY, 8 + buildOff, 22, 3);
      rrFill(ctx, cx + 3 + buildOff, rightLegY, 8 + buildOff, 22, 3);
      ctx.fillStyle = darken(c.pants, 0.2);
      ctx.fillRect(cx - 3, leftLegY + 14, 2, 8);
      ctx.fillRect(cx + 10 + buildOff, rightLegY + 14, 2, 8);
    }

    // ── TORSO / UNIFORM TOP ───────────────────────────────────────────────────
    const torsoY = bodyBase - 44 + bob * 0.4;
    const torsoW = (isLR ? 20 : 23) + buildOff;
    const torsoH = 22;
    const torsoX = cx - torsoW / 2;

    if (tilt !== 0 && isLR) {
      ctx.save();
      ctx.translate(cx, torsoY + torsoH / 2);
      ctx.rotate(tilt * 0.06);
      ctx.translate(-cx, -(torsoY + torsoH / 2));
    }

    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(torsoX + 2, torsoY + 2, torsoW, torsoH);
    ctx.fillStyle = c.coat;
    rrFill(ctx, torsoX, torsoY, torsoW, torsoH, 4);
    ctx.fillStyle = c.coatDark;
    if (isLR) {
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
        ctx.moveTo(vx, torsoY + 1); ctx.lineTo(vx + 4, torsoY + 1); ctx.lineTo(vx + 2, torsoY + 8);
        ctx.closePath();
      } else {
        ctx.moveTo(cx - 3, torsoY + 1); ctx.lineTo(cx + 3, torsoY + 1); ctx.lineTo(cx, torsoY + 9);
        ctx.closePath();
      }
      ctx.fill();
    }

    // Doctor white coat lapels
    if (c.role === 'doctor') {
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      if (isLR) {
        rrFill(ctx, facing > 0 ? torsoX - 2 : torsoX + torsoW - 3, torsoY, 5, torsoH + 2, 2);
      } else if (!isUp) {
        rrFill(ctx, torsoX - 2, torsoY, 5, torsoH + 2, 2);
        rrFill(ctx, torsoX + torsoW - 3, torsoY, 5, torsoH + 2, 2);
        ctx.beginPath();
        ctx.moveTo(cx - 2, torsoY + 1); ctx.lineTo(cx - 10, torsoY + 10); ctx.lineTo(cx - 10, torsoY + 1); ctx.closePath(); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx + 2, torsoY + 1); ctx.lineTo(cx + 10, torsoY + 10); ctx.lineTo(cx + 10, torsoY + 1); ctx.closePath(); ctx.fill();
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
      const backArmX = facing > 0 ? torsoX - 5 : torsoX + torsoW - 1;
      ctx.fillStyle = darken(c.role === 'doctor' ? '#ffffff' : c.coat, 0.25);
      rrFill(ctx, backArmX, armY + armSwingB, 7, armH, 3);
      const frontArmX = facing > 0 ? torsoX + torsoW - 2 : torsoX - 6;
      ctx.fillStyle = c.role === 'doctor' ? '#f0f0f0' : c.coat;
      rrFill(ctx, frontArmX, armY + armSwing, 7, armH, 3);
    } else {
      ctx.fillStyle = c.role === 'doctor' ? '#f0f0f0' : c.coat;
      rrFill(ctx, cx - 16, armY + armSwing, 7, armH, 3);
      rrFill(ctx, cx + 9, armY + armSwingB, 7, armH, 3);
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
    if (isLR) { rrFill(ctx, cx - 3, neckY, 7, 9, 2); }
    else { rrFill(ctx, cx - 4, neckY, 8, 9, 2); }
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.fillRect(isLR ? cx - 3 : cx - 4, neckY + 5, isLR ? 7 : 8, 3);

    // ── HEAD ──────────────────────────────────────────────────────────────────
    const headCX = cx + (isLR ? facing * 1.5 : 0);
    const headCY = torsoY - 15 + bob * 0.3;
    // Stocky build → slightly wider head; slim → slightly narrower
    const headRX = (isLR ? 11 : 13) + (buildOff > 0 ? 1 : buildOff < 0 ? -1 : 0);
    const headRY = isLR ? 13 : 14;

    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.beginPath(); ctx.ellipse(headCX + 2, headCY + 2, headRX, headRY, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = c.skin;
    ctx.beginPath(); ctx.ellipse(headCX, headCY, headRX, headRY, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath(); ctx.ellipse(headCX - headRX * 0.3, headCY - headRY * 0.3, headRX * 0.5, headRY * 0.4, 0, 0, Math.PI * 2); ctx.fill();

    // ── HAIR ──────────────────────────────────────────────────────────────────
    // Surgical cap overrides all hair
    if (visual.accessory === 'surgical_cap') {
      ctx.fillStyle = '#daeeff';
      ctx.beginPath(); ctx.ellipse(headCX, headCY - 3, headRX + 3, headRY + 2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(headCX - headRX - 3, headCY - 2, (headRX + 3) * 2, 8);
      ctx.fillStyle = '#b8d9f5';
      ctx.fillRect(headCX - headRX - 4, headCY + 3, (headRX + 4) * 2, 4);
      if (isLR) {
        ctx.fillStyle = '#b8d9f5';
        ctx.fillRect(headCX + facing * (headRX + 1), headCY - 1, 5, 3);
      }
    } else {
      ctx.fillStyle = c.hair;
      this.drawHair(ctx, visual.hairStyle, c.hair, headCX, headCY, headRX, headRY, isDown, isUp, isLR, facing);
    }

    // ── NURSE CAP (player only) ───────────────────────────────────────────────
    if (visual.nurseCap && !isUp) {
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
      const isFemale = visual.gender === 'female';
      const isSenior = visual.age === 'senior';

      if (isDown) {
        // Eyes
        ctx.fillStyle = '#1a2530';
        ctx.fillRect(headCX - 5.5, eyeY - 1, 4, 4);
        ctx.fillRect(headCX + 1.5, eyeY - 1, 4, 4);
        ctx.fillStyle = '#fff';
        ctx.fillRect(headCX - 5.5, eyeY - 1, 2, 2);
        ctx.fillRect(headCX + 1.5, eyeY - 1, 2, 2);
        ctx.fillStyle = '#000';
        ctx.fillRect(headCX - 4, eyeY, 2, 2);
        ctx.fillRect(headCX + 3, eyeY, 2, 2);
        // Eyebrows
        ctx.fillStyle = c.hair;
        if (isSenior) {
          ctx.fillStyle = '#aaaaaa';
        }
        ctx.fillRect(headCX - 6, eyeY - 3, 5, isFemale ? 1 : 1.5);
        ctx.fillRect(headCX + 1, eyeY - 3, 5, isFemale ? 1 : 1.5);
        // Nose
        ctx.fillStyle = darken(c.skin, 0.18);
        ctx.beginPath(); ctx.arc(headCX, noseY, 1.5, 0, Math.PI * 2); ctx.fill();
        // Blush (female only)
        if (isFemale) {
          ctx.fillStyle = 'rgba(220,100,100,0.22)';
          ctx.beginPath(); ctx.arc(headCX - 6.5, eyeY + 3, 2.5, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(headCX + 6.5, eyeY + 3, 2.5, 0, Math.PI * 2); ctx.fill();
        }
        // Mouth
        ctx.strokeStyle = darken(c.skin, 0.25); ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(headCX, mouthY, 3.5, 0.1, Math.PI - 0.1); ctx.stroke();
        // Senior wrinkle lines
        if (isSenior) {
          ctx.strokeStyle = darken(c.skin, 0.15); ctx.lineWidth = 0.8;
          ctx.beginPath(); ctx.moveTo(headCX - 7, eyeY + 4); ctx.lineTo(headCX - 4, eyeY + 4); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(headCX + 4, eyeY + 4); ctx.lineTo(headCX + 7, eyeY + 4); ctx.stroke();
        }
      } else if (isLeft) {
        ctx.fillStyle = '#1a2530';
        ctx.fillRect(headCX - 7, eyeY - 1, 3.5, 3.5);
        ctx.fillStyle = '#fff';
        ctx.fillRect(headCX - 7, eyeY - 1, 1.5, 1.5);
        ctx.fillStyle = isSenior ? '#aaaaaa' : c.hair;
        ctx.fillRect(headCX - 8, eyeY - 4, 5, isFemale ? 1 : 1.5);
        ctx.fillStyle = darken(c.skin, 0.22);
        rrFill(ctx, headCX - headRX, noseY - 1, 4, 3, 1);
        ctx.fillStyle = darken(c.skin, 0.08);
        ctx.beginPath(); ctx.arc(headCX + 7, headCY + 1, 3, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = darken(c.skin, 0.25); ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(headCX - 4, mouthY, 2.5, 0, Math.PI); ctx.stroke();
      } else {
        ctx.fillStyle = '#1a2530';
        ctx.fillRect(headCX + 3.5, eyeY - 1, 3.5, 3.5);
        ctx.fillStyle = '#fff';
        ctx.fillRect(headCX + 3.5, eyeY - 1, 1.5, 1.5);
        ctx.fillStyle = isSenior ? '#aaaaaa' : c.hair;
        ctx.fillRect(headCX + 3, eyeY - 4, 5, isFemale ? 1 : 1.5);
        ctx.fillStyle = darken(c.skin, 0.22);
        rrFill(ctx, headCX + headRX - 3, noseY - 1, 4, 3, 1);
        ctx.fillStyle = darken(c.skin, 0.08);
        ctx.beginPath(); ctx.arc(headCX - 7, headCY + 1, 3, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = darken(c.skin, 0.25); ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(headCX + 4, mouthY, 2.5, 0, Math.PI); ctx.stroke();
      }
    }

    // ── GLASSES ───────────────────────────────────────────────────────────────
    if (visual.accessory === 'glasses' && !isUp) {
      ctx.strokeStyle = '#3d4f6e'; ctx.lineWidth = 1.5;
      if (isDown) {
        rrStroke(ctx, headCX - 9, headCY - 3, 7, 5, 2);
        rrStroke(ctx, headCX + 2, headCY - 3, 7, 5, 2);
        ctx.beginPath(); ctx.moveTo(headCX - 2, headCY); ctx.lineTo(headCX + 2, headCY); ctx.stroke();
      } else if (isLeft) {
        rrStroke(ctx, headCX - 9, headCY - 3, 7, 5, 2);
        ctx.beginPath(); ctx.moveTo(headCX - 2, headCY); ctx.lineTo(headCX + 2, headCY); ctx.stroke();
      } else {
        rrStroke(ctx, headCX + 2, headCY - 3, 7, 5, 2);
        ctx.beginPath(); ctx.moveTo(headCX - 2, headCY); ctx.lineTo(headCX + 2, headCY); ctx.stroke();
      }
    }
  }

  // ── 16 UNIQUE HAIR STYLES ─────────────────────────────────────────────────
  private drawHair(
    ctx: CanvasRenderingContext2D,
    style: string,
    hair: string,
    hcx: number, hcy: number, hrx: number, hry: number,
    isDown: boolean, isUp: boolean, isLR: boolean, facing: number,
  ) {
    ctx.fillStyle = hair;
    const isUD = isDown || isUp;

    switch (style) {

      case 'bun': {
        // Classic bun on top — player style
        if (isUD) {
          ctx.beginPath(); ctx.ellipse(hcx, hcy - 6, hrx, 7, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillRect(hcx - hrx, hcy - 6, hrx * 2, 7);
          ctx.beginPath(); ctx.arc(hcx, hcy - hry - 3, 5, 0, Math.PI * 2); ctx.fill();
        } else {
          ctx.beginPath(); ctx.ellipse(hcx, hcy - 5, hrx + 1, 7, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillRect(hcx - hrx - 1, hcy - 5, (hrx + 1) * 2, 10);
          ctx.beginPath(); ctx.arc(hcx - facing * 2, hcy - hry - 2, 5, 0, Math.PI * 2); ctx.fill();
          ctx.fillRect(hcx + facing * (hrx - 3), hcy, 4, 7);
        }
        break;
      }

      case 'bob': {
        // Ana — chin-length bob, side panels
        if (isDown) {
          ctx.beginPath(); ctx.ellipse(hcx, hcy - 5, hrx + 1, 7, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillRect(hcx - hrx - 1, hcy - 5, (hrx + 1) * 2, 12);
          ctx.fillRect(hcx - hrx - 2, hcy, 5, 12);
          ctx.fillRect(hcx + hrx - 2, hcy, 5, 12);
          // Straight bottom edge
          ctx.fillRect(hcx - hrx - 2, hcy + 9, (hrx + 2) * 2, 3);
        } else if (isUp) {
          ctx.beginPath(); ctx.ellipse(hcx, hcy - 5, hrx + 1, 8, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillRect(hcx - hrx - 1, hcy - 5, (hrx + 1) * 2, 14);
          ctx.fillRect(hcx - hrx - 2, hcy, 5, 10);
          ctx.fillRect(hcx + hrx - 2, hcy, 5, 10);
        } else {
          ctx.beginPath(); ctx.ellipse(hcx, hcy - 5, hrx + 2, 7, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillRect(hcx - hrx - 1, hcy - 5, (hrx + 2) * 2, 12);
          const backX = facing > 0 ? hcx - hrx - 4 : hcx + hrx;
          ctx.fillRect(backX, hcy, 6, 12);
          ctx.fillRect(hcx + facing * (hrx - 2), hcy, 4, 5);
        }
        break;
      }

      case 'low_fade': {
        // Carlos — very short sides, slight flat top
        if (isUD) {
          ctx.beginPath(); ctx.ellipse(hcx, hcy - 8, hrx - 1, 4, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillRect(hcx - hrx + 1, hcy - 8, (hrx - 1) * 2, 5);
          ctx.globalAlpha = 0.45;
          ctx.fillRect(hcx - hrx - 1, hcy - 1, 3, 5);
          ctx.fillRect(hcx + hrx - 2, hcy - 1, 3, 5);
          ctx.globalAlpha = 1;
        } else {
          ctx.beginPath(); ctx.ellipse(hcx, hcy - 7, hrx - 1, 4, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillRect(hcx - hrx + 1, hcy - 7, hrx * 2, 5);
          ctx.globalAlpha = 0.45;
          ctx.fillRect(hcx + facing * (hrx - 1), hcy - 1, 3, 4);
          ctx.globalAlpha = 1;
        }
        break;
      }

      case 'curly_top': {
        // João — pile of curls on top
        const curl = (cx2: number, cy2: number, r: number) => {
          ctx.beginPath(); ctx.arc(cx2, cy2, r, 0, Math.PI * 2); ctx.fill();
        };
        if (isUD) {
          curl(hcx - 6, hcy - hry, 5);
          curl(hcx + 4, hcy - hry - 1, 5);
          curl(hcx - 1, hcy - hry - 3, 4);
          curl(hcx + 8, hcy - hry + 2, 4);
          curl(hcx - 8, hcy - hry + 2, 4);
          ctx.fillRect(hcx - hrx + 2, hcy - hry, hrx * 2 - 3, 7);
          ctx.globalAlpha = 0.4;
          ctx.fillRect(hcx - hrx, hcy, 4, 3);
          ctx.fillRect(hcx + hrx - 3, hcy, 4, 3);
          ctx.globalAlpha = 1;
        } else {
          curl(hcx - facing, hcy - hry - 2, 5);
          curl(hcx - facing * 4, hcy - hry, 4);
          curl(hcx + facing * 3, hcy - hry, 4);
          ctx.fillRect(hcx - hrx, hcy - hry, hrx * 2, 5);
          ctx.globalAlpha = 0.45;
          ctx.fillRect(hcx + facing * (hrx - 2), hcy, 3, 3);
          ctx.globalAlpha = 1;
        }
        break;
      }

      case 'ponytail': {
        // Renata — hair cap + ponytail at the back/nape
        if (isDown) {
          ctx.beginPath(); ctx.ellipse(hcx, hcy - 6, hrx, 7, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillRect(hcx - hrx, hcy - 6, hrx * 2, 7);
          ctx.globalAlpha = 0.6;
          ctx.fillRect(hcx - 3, hcy + 1, 6, 14);
          ctx.globalAlpha = 1;
        } else if (isUp) {
          ctx.beginPath(); ctx.ellipse(hcx, hcy - 6, hrx, 8, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillRect(hcx - hrx, hcy - 6, hrx * 2, 14);
          ctx.fillRect(hcx - 4, hcy + 3, 8, 18);
          ctx.fillRect(hcx - 3, hcy + 18, 6, 7);
          ctx.fillStyle = '#2c2c2c';
          ctx.fillRect(hcx - 4, hcy + 3, 8, 3);
          ctx.fillStyle = hair;
        } else {
          ctx.beginPath(); ctx.ellipse(hcx - facing, hcy - 5, hrx + 1, 7, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillRect(hcx - hrx - 1, hcy - 5, (hrx + 1) * 2, 10);
          const tailX = facing > 0 ? hcx - hrx - 3 : hcx + hrx - 2;
          ctx.fillRect(tailX, hcy, 5, 17);
          ctx.fillRect(tailX + 1, hcy + 14, 3, 7);
          ctx.fillStyle = '#2c2c2c';
          ctx.fillRect(tailX, hcy, 5, 3);
          ctx.fillStyle = hair;
          ctx.fillRect(hcx + facing * (hrx - 3), hcy, 4, 5);
        }
        break;
      }

      case 'receding': {
        // Farias — receding hairline, thin sides and back, bald crown
        if (isDown) {
          ctx.globalAlpha = 0.65;
          ctx.fillRect(hcx - hrx - 1, hcy - 3, 5, 7);
          ctx.fillRect(hcx + hrx - 3, hcy - 3, 5, 7);
          ctx.globalAlpha = 1;
          ctx.fillRect(hcx - hrx + 2, hcy - hry + 1, 6, 3);
          ctx.fillRect(hcx + hrx - 7, hcy - hry + 1, 6, 3);
        } else if (isUp) {
          ctx.fillRect(hcx - hrx, hcy - 6, hrx * 2, 14);
          ctx.fillRect(hcx - hrx - 1, hcy - 3, 5, 8);
          ctx.fillRect(hcx + hrx - 3, hcy - 3, 5, 8);
        } else {
          const backX = facing > 0 ? hcx - hrx - 2 : hcx + hrx - 2;
          ctx.fillRect(backX, hcy - 3, 5, 11);
          ctx.globalAlpha = 0.6;
          ctx.fillRect(backX, hcy - 7, 5, 4);
          ctx.globalAlpha = 1;
          ctx.fillRect(hcx - hrx + 1, hcy - hry + 1, hrx * 2 - 2, 2);
        }
        break;
      }

      case 'updo': {
        // Diretora — formal updo, hair piled high
        if (isUD) {
          ctx.beginPath(); ctx.ellipse(hcx, hcy - 6, hrx, 7, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillRect(hcx - hrx, hcy - 6, hrx * 2, 7);
          ctx.beginPath(); ctx.ellipse(hcx, hcy - hry - 5, 9, 7, 0, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.ellipse(hcx - 5, hcy - hry - 3, 5, 4, 0, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.ellipse(hcx + 5, hcy - hry - 3, 5, 4, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.13)';
          ctx.beginPath(); ctx.ellipse(hcx - 2, hcy - hry - 6, 4, 3, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = hair;
        } else {
          ctx.beginPath(); ctx.ellipse(hcx, hcy - 5, hrx + 1, 7, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillRect(hcx - hrx - 1, hcy - 5, (hrx + 1) * 2, 10);
          ctx.beginPath(); ctx.ellipse(hcx - facing * 2, hcy - hry - 4, 8, 6, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillRect(hcx + facing * (hrx - 2), hcy, 3, 6);
        }
        break;
      }

      case 'afro_short': {
        // Rosa — rounded short afro, wider than head
        const ar = hrx + 4;
        if (isUD) {
          ctx.beginPath(); ctx.ellipse(hcx, hcy - 3, ar, hry + 3, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = darken(hair, 0.18);
          for (let i = 0; i < 6; i++) {
            const ax = hcx + (i % 3 - 1) * 8;
            const ay = hcy - 5 + (i < 3 ? 0 : -7);
            ctx.beginPath(); ctx.arc(ax, ay, 1.5, 0, Math.PI * 2); ctx.fill();
          }
          ctx.fillStyle = hair;
        } else {
          ctx.beginPath(); ctx.ellipse(hcx, hcy - 3, ar, hry + 3, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = darken(hair, 0.18);
          ctx.beginPath(); ctx.arc(hcx - facing * 5, hcy - 6, 2, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(hcx + facing * 2, hcy - 10, 2, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = hair;
        }
        break;
      }

      case 'loose_long': {
        // Clara — long loose hair past shoulders
        if (isDown) {
          ctx.beginPath(); ctx.ellipse(hcx, hcy - 5, hrx + 2, 8, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillRect(hcx - hrx - 2, hcy - 5, (hrx + 2) * 2, 28);
          ctx.fillRect(hcx - hrx - 3, hcy, 6, 22);
          ctx.fillRect(hcx + hrx - 2, hcy, 6, 22);
        } else if (isUp) {
          ctx.beginPath(); ctx.ellipse(hcx, hcy - 5, hrx + 2, 8, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillRect(hcx - hrx - 2, hcy - 5, (hrx + 2) * 2, 28);
          ctx.fillRect(hcx - hrx - 3, hcy, 6, 20);
          ctx.fillRect(hcx + hrx - 2, hcy, 6, 20);
        } else {
          ctx.beginPath(); ctx.ellipse(hcx, hcy - 5, hrx + 3, 8, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillRect(hcx - hrx - 2, hcy - 5, (hrx + 3) * 2, 12);
          const backX = facing > 0 ? hcx - hrx - 5 : hcx + hrx - 1;
          ctx.fillRect(backX, hcy, 7, 24);
          ctx.fillRect(backX, hcy + 21, 5, 8);
          const frontX = facing > 0 ? hcx + hrx - 3 : hcx - hrx - 3;
          ctx.fillRect(frontX, hcy, 5, 18);
          ctx.fillRect(hcx + facing * (hrx - 1), hcy, 3, 8);
        }
        break;
      }

      case 'high_pony': {
        // Maria — high ponytail gathered at top
        if (isDown) {
          ctx.beginPath(); ctx.ellipse(hcx, hcy - 5, hrx, 7, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillRect(hcx - hrx, hcy - 5, hrx * 2, 8);
          ctx.beginPath(); ctx.ellipse(hcx, hcy - hry - 2, 4, 7, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillRect(hcx - 3, hcy - hry + 3, 6, 10);
          ctx.fillStyle = '#2c2c2c';
          ctx.fillRect(hcx - 4, hcy - hry - 2, 8, 3);
          ctx.fillStyle = hair;
        } else if (isUp) {
          ctx.beginPath(); ctx.ellipse(hcx, hcy - 5, hrx, 7, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillRect(hcx - hrx, hcy - 5, hrx * 2, 14);
          ctx.beginPath(); ctx.ellipse(hcx, hcy - hry, 4, 9, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#2c2c2c';
          ctx.fillRect(hcx - 4, hcy - hry, 8, 3);
          ctx.fillStyle = hair;
        } else {
          ctx.beginPath(); ctx.ellipse(hcx, hcy - 5, hrx + 1, 7, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillRect(hcx - hrx - 1, hcy - 5, (hrx + 1) * 2, 8);
          ctx.fillRect(hcx + facing * (hrx - 3), hcy, 4, 6);
          ctx.beginPath(); ctx.ellipse(hcx - facing * 2, hcy - hry - 2, 4, 7, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillRect(hcx - facing * 4, hcy - hry + 3, 5, 12);
          ctx.fillRect(hcx - facing * 5, hcy - hry + 13, 4, 7);
          ctx.fillStyle = '#2c2c2c';
          ctx.fillRect(hcx - facing * 5, hcy - hry - 3, 8, 3);
          ctx.fillStyle = hair;
        }
        break;
      }

      case 'business': {
        // Dr. Oliveira — side-parted professional male
        if (isDown) {
          ctx.beginPath(); ctx.ellipse(hcx, hcy - 7, hrx, 6, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillRect(hcx - hrx, hcy - 7, hrx * 2, 6);
          ctx.fillStyle = 'rgba(0,0,0,0.07)';
          ctx.fillRect(hcx - 2, hcy - hry, 2, 6);
          ctx.fillStyle = hair;
        } else if (isUp) {
          ctx.beginPath(); ctx.ellipse(hcx, hcy - 6, hrx, 7, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillRect(hcx - hrx, hcy - 6, hrx * 2, 10);
        } else {
          ctx.beginPath(); ctx.ellipse(hcx - facing, hcy - 7, hrx, 6, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillRect(hcx - hrx - 1, hcy - 7, hrx * 2 + 2, 6);
          const sweptX = facing > 0 ? hcx + hrx - 4 : hcx - hrx;
          ctx.fillRect(sweptX, hcy - 5, 4, 4);
          ctx.globalAlpha = 0.5;
          ctx.fillRect(hcx + facing * (hrx - 1), hcy, 3, 3);
          ctx.globalAlpha = 1;
        }
        break;
      }

      case 'long_tied': {
        // Dra. Santos — long hair pulled back, low bun at nape
        if (isDown) {
          ctx.beginPath(); ctx.ellipse(hcx, hcy - 6, hrx + 1, 7, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillRect(hcx - hrx - 1, hcy - 6, (hrx + 1) * 2, 8);
          ctx.fillRect(hcx - hrx - 2, hcy, 4, 6);
          ctx.fillRect(hcx + hrx - 1, hcy, 4, 6);
          ctx.beginPath(); ctx.arc(hcx, hcy + 7, 5, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#1a1a1a';
          ctx.fillRect(hcx - 5, hcy + 6, 10, 2);
          ctx.fillStyle = hair;
        } else if (isUp) {
          ctx.beginPath(); ctx.ellipse(hcx, hcy - 5, hrx + 1, 8, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillRect(hcx - hrx - 1, hcy - 5, (hrx + 1) * 2, 14);
          ctx.beginPath(); ctx.ellipse(hcx, hcy + 7, 6, 7, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#1a1a1a';
          ctx.fillRect(hcx - 6, hcy + 5, 12, 2);
          ctx.fillStyle = hair;
        } else {
          ctx.beginPath(); ctx.ellipse(hcx - facing, hcy - 5, hrx + 1, 7, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillRect(hcx - hrx - 1, hcy - 5, (hrx + 1) * 2, 10);
          ctx.fillRect(hcx + facing * (hrx - 2), hcy, 4, 6);
          const bunX = facing > 0 ? hcx - hrx - 3 : hcx + hrx - 2;
          ctx.beginPath(); ctx.ellipse(bunX + 3, hcy + 6, 5, 5, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#1a1a1a';
          ctx.fillRect(bunX, hcy + 4, 6, 2);
          ctx.fillStyle = hair;
        }
        break;
      }

      case 'short_wavy': {
        // Pedro — short with slight wave texture
        if (isUD) {
          ctx.beginPath(); ctx.ellipse(hcx, hcy - 7, hrx, 5, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillRect(hcx - hrx, hcy - 7, hrx * 2, 6);
          ctx.fillStyle = darken(hair, 0.15);
          ctx.fillRect(hcx - 5, hcy - 9, 4, 2);
          ctx.fillRect(hcx + 1, hcy - 10, 4, 2);
          ctx.fillRect(hcx - 2, hcy - 8, 3, 2);
          ctx.fillStyle = hair;
          ctx.globalAlpha = 0.55;
          ctx.fillRect(hcx - hrx - 1, hcy, 4, 3);
          ctx.fillRect(hcx + hrx - 2, hcy, 4, 3);
          ctx.globalAlpha = 1;
        } else {
          ctx.beginPath(); ctx.ellipse(hcx, hcy - 7, hrx, 5, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillRect(hcx - hrx, hcy - 7, hrx * 2, 6);
          ctx.fillStyle = darken(hair, 0.15);
          ctx.fillRect(hcx - facing * 3, hcy - 9, 4, 2);
          ctx.fillStyle = hair;
          ctx.globalAlpha = 0.55;
          ctx.fillRect(hcx + facing * (hrx - 2), hcy, 3, 3);
          ctx.globalAlpha = 1;
        }
        break;
      }

      case 'bald': {
        // Sr. João — completely bald
        // No hair drawn at all; ear will be shown by face section
        break;
      }

      case 'short_curly_gray': {
        // Dona Maria — short tight curls, elderly
        const tc = (cx3: number, cy3: number, r3: number) => {
          ctx.beginPath(); ctx.arc(cx3, cy3, r3, 0, Math.PI * 2); ctx.fill();
        };
        if (isUD) {
          tc(hcx - 7, hcy - hry + 1, 4);
          tc(hcx, hcy - hry - 1, 4);
          tc(hcx + 7, hcy - hry + 1, 4);
          tc(hcx - 4, hcy - hry - 3, 3);
          tc(hcx + 4, hcy - hry - 3, 3);
          ctx.fillRect(hcx - hrx + 2, hcy - hry + 1, (hrx - 2) * 2, 4);
          ctx.globalAlpha = 0.55;
          ctx.fillRect(hcx - hrx, hcy, 5, 4);
          ctx.fillRect(hcx + hrx - 4, hcy, 5, 4);
          ctx.globalAlpha = 1;
        } else {
          tc(hcx - facing * 2, hcy - hry, 4);
          tc(hcx - facing * 6, hcy - hry + 2, 3);
          tc(hcx + facing * 3, hcy - hry + 1, 3);
          ctx.fillRect(hcx - hrx + 1, hcy - hry + 1, hrx * 2 - 2, 4);
          ctx.globalAlpha = 0.55;
          ctx.fillRect(hcx + facing * (hrx - 3), hcy, 4, 4);
          ctx.globalAlpha = 1;
        }
        break;
      }

      case 'short_neat':
      default: {
        // Roberto — clean short male cut
        if (isUD) {
          ctx.beginPath(); ctx.ellipse(hcx, hcy - 7, hrx - 1, 5, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillRect(hcx - hrx + 1, hcy - 7, (hrx - 1) * 2, 5);
          ctx.globalAlpha = 0.45;
          ctx.fillRect(hcx - hrx, hcy - 2, 4, 3);
          ctx.fillRect(hcx + hrx - 3, hcy - 2, 4, 3);
          ctx.globalAlpha = 1;
        } else {
          ctx.beginPath(); ctx.ellipse(hcx, hcy - 7, hrx - 1, 5, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillRect(hcx - hrx + 1, hcy - 7, (hrx - 1) * 2, 5);
          ctx.globalAlpha = 0.45;
          ctx.fillRect(hcx + facing * (hrx - 2), hcy - 2, 3, 3);
          ctx.globalAlpha = 1;
        }
        break;
      }

    }
  }

  // ── PORTRAITS ─────────────────────────────────────────────────────────────
  private createPortraits() {
    // Map role → loaded AI portrait image key
    const rolePortraitImg: Record<string, string> = {
      nurse: 'portrait_img_nurse',
      doctor: 'portrait_img_doctor',
      admin: 'portrait_img_admin',
      receptionist: 'portrait_img_receptionist',
    };

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

      // Try to use the AI-generated portrait PNG for this role
      const imgKey = rolePortraitImg[def.role];
      if (imgKey && this.textures.exists(imgKey)) {
        const src = this.textures.get(imgKey).getSourceImage() as HTMLImageElement;
        if (src && src.width) {
          // Rounded clip mask
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(0, 0, 90, 90, 10);
          ctx.clip();
          ctx.drawImage(src, 0, 0, 90, 90);
          ctx.restore();
          // Subtle colored tint overlay to unify with game palette
          ctx.fillStyle = `rgba(${r0},${g0},${b0},0.12)`;
          ctx.beginPath(); ctx.roundRect(0, 0, 90, 90, 10); ctx.fill();
          ct.refresh();
          continue;
        }
      }

      // ── Fallback: procedural pixel-art portrait ──────────────────────────
      // Background gradient
      ctx.fillStyle = '#f0f5f8'; ctx.fillRect(0, 0, 90, 90);
      const bgGrad = ctx.createLinearGradient(0, 0, 90, 90);
      bgGrad.addColorStop(0, `rgba(${r0},${g0},${b0},0.10)`);
      bgGrad.addColorStop(1, `rgba(${r0},${g0},${b0},0.40)`);
      ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, 90, 90);

      // Subtle dot grid
      ctx.fillStyle = 'rgba(0,0,0,0.04)';
      for (let gy = 4; gy < 90; gy += 8) for (let gx = 4; gx < 90; gx += 8) {
        ctx.fillRect(gx, gy, 1, 1);
      }

      // Shoulders — wider and more realistic
      ctx.fillStyle = coatC;
      ctx.beginPath();
      ctx.moveTo(-5, 90); ctx.lineTo(-5, 58);
      ctx.bezierCurveTo(2, 50, 32, 48, 45, 51);
      ctx.bezierCurveTo(58, 48, 88, 50, 95, 58);
      ctx.lineTo(95, 90); ctx.closePath(); ctx.fill();
      // Shoulder shadow
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.beginPath();
      ctx.moveTo(-5, 90); ctx.lineTo(-5, 68);
      ctx.bezierCurveTo(2, 62, 32, 60, 45, 63);
      ctx.bezierCurveTo(58, 60, 88, 62, 95, 68);
      ctx.lineTo(95, 90); ctx.closePath(); ctx.fill();

      // Doctor white coat lapels
      if (def.role === 'doctor') {
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.beginPath(); ctx.moveTo(40, 51); ctx.lineTo(-5, 68); ctx.lineTo(-5, 51); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(50, 51); ctx.lineTo(95, 68); ctx.lineTo(95, 51); ctx.closePath(); ctx.fill();
      }

      // Stethoscope
      if (def.role === 'doctor' || def.role === 'nurse') {
        ctx.strokeStyle = '#1a252f'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(45, 64, 10, 0, Math.PI); ctx.stroke();
        ctx.fillStyle = '#2c3e50';
        ctx.beginPath(); ctx.arc(45, 74, 4.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath(); ctx.arc(45, 74, 2, 0, Math.PI * 2); ctx.fill();
      }

      // V-neck skin visible
      ctx.fillStyle = skinC;
      ctx.beginPath(); ctx.moveTo(38, 51); ctx.lineTo(45, 64); ctx.lineTo(52, 51); ctx.closePath(); ctx.fill();

      // Neck
      ctx.fillStyle = skinC; rrFill(ctx, 37, 38, 16, 16, 5);
      ctx.fillStyle = darken(skinC, 0.1);
      ctx.fillRect(37, 50, 16, 4);

      // Head — bigger and more proportional
      ctx.fillStyle = skinC;
      ctx.beginPath(); ctx.ellipse(45, 24, 21, 23, 0, 0, Math.PI * 2); ctx.fill();
      // Subtle cheek shading
      ctx.fillStyle = darken(skinC, 0.06);
      ctx.beginPath(); ctx.ellipse(30, 28, 6, 8, 0.2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(60, 28, 6, 8, -0.2, 0, Math.PI * 2); ctx.fill();
      // Head highlight
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.beginPath(); ctx.ellipse(36, 14, 9, 10, -0.3, 0, Math.PI * 2); ctx.fill();

      // Hair — fuller and more volumetric
      ctx.fillStyle = hairC;
      ctx.beginPath(); ctx.ellipse(45, 7, 22, 14, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(24, 7, 42, 20);
      // Hair shine
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.beginPath(); ctx.ellipse(38, 5, 8, 5, -0.2, 0, Math.PI * 2); ctx.fill();

      // Eyebrows — arched
      ctx.strokeStyle = darken(hairC, 0.15); ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(31, 17); ctx.quadraticCurveTo(36, 13, 41, 17); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(49, 17); ctx.quadraticCurveTo(54, 13, 59, 17); ctx.stroke();

      // Eyes — larger and more expressive
      ctx.fillStyle = '#1a2530';
      rrFill(ctx, 32, 20, 9, 7, 3);
      rrFill(ctx, 49, 20, 9, 7, 3);
      ctx.fillStyle = '#fff';
      ctx.fillRect(32, 20, 3.5, 3); ctx.fillRect(49, 20, 3.5, 3);
      ctx.fillStyle = '#000';
      ctx.fillRect(35, 21, 4, 4); ctx.fillRect(52, 21, 4, 4);
      // Eye sparkle
      ctx.fillStyle = '#fff';
      ctx.fillRect(36, 21, 1.5, 1.5); ctx.fillRect(53, 21, 1.5, 1.5);

      // Nose — subtle
      ctx.fillStyle = darken(skinC, 0.13);
      ctx.beginPath(); ctx.arc(45, 32, 2.5, 0, Math.PI * 2); ctx.fill();

      // Warm smile
      ctx.strokeStyle = darken(skinC, 0.20); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(45, 38, 7, 0.2, Math.PI - 0.2); ctx.stroke();

      // Blush cheeks
      ctx.fillStyle = 'rgba(220,80,80,0.16)';
      ctx.beginPath(); ctx.ellipse(31, 33, 5, 3.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(59, 33, 5, 3.5, 0, 0, Math.PI * 2); ctx.fill();

      // Glasses (doctor/admin)
      if (def.role === 'doctor' || def.role === 'admin') {
        ctx.strokeStyle = '#4a5568'; ctx.lineWidth = 2;
        rrStroke(ctx, 31, 19, 12, 9, 3);
        rrStroke(ctx, 47, 19, 12, 9, 3);
        ctx.beginPath(); ctx.moveTo(43, 23); ctx.lineTo(47, 23); ctx.stroke();
      }

      // Nurse cap
      if (def.role === 'nurse') {
        ctx.fillStyle = '#ffffff';
        rrFill(ctx, 24, 2, 42, 8, 2);
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(24, 6, 42, 3);
        // Cap highlight
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillRect(24, 2, 42, 2);
      }

      // ID Badge
      if (def.role === 'nurse' || def.role === 'admin' || def.role === 'receptionist') {
        ctx.fillStyle = '#e74c3c';
        rrFill(ctx, 24, 57, 18, 22, 2);
        ctx.fillStyle = '#fff';
        ctx.fillRect(26, 61, 14, 2); ctx.fillRect(26, 65, 12, 2); ctx.fillRect(26, 69, 14, 2);
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(24, 57, 18, 3);
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
