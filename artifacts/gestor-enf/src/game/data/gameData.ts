import * as Phaser from 'phaser';
import { MAP_COLS, MAP_ROWS, TILE_SIZE, TILE_ID, NUM_TILES, ROOM_FLOOR_COLORS, CAREER_LEVELS } from '../constants';

// ─── HELPER ───────────────────────────────────────────────────────────────────
function fill(map: number[][], r1: number, c1: number, r2: number, c2: number, t: number) {
  for (let r = r1; r <= r2; r++)
    for (let c = c1; c <= c2; c++)
      map[r][c] = t;
}

// ─── MAP GENERATION ───────────────────────────────────────────────────────────
// HUAP/UFF inspired layout (76 cols × 50 rows)
// Sectors: Reception, Emergency, Pharmacy, Lab, Radiology, Admin (north wing)
//          CME, Break/Nutrition, Ward, ICU, Nursing (middle wing)
//          Outpatient, Maternity, Oncology, Rehab, Psych (south wing)
export function generateMapTiles(): number[][] {
  const { GARDEN, WALL, CORRIDOR, ICU, PHARMACY, ADMIN, WARD, BREAK, NURSING,
    RECEPTION, EMERGENCY, LAB, RADIOLOGY, CME, MATERNITY, ONCOLOGY, REHAB,
    OUTPATIENT, PSYCH } = TILE_ID;

  const map: number[][] = Array.from({ length: MAP_ROWS }, () => Array(MAP_COLS).fill(GARDEN));

  // ── Outer hospital walls
  fill(map, 1, 1, 1, 74, WALL);   // north outer
  fill(map, 48, 1, 48, 74, WALL); // south outer
  fill(map, 1, 1, 48, 1, WALL);   // west outer
  fill(map, 1, 74, 48, 74, WALL); // east outer

  // ── Fill hospital interior with CORRIDOR
  fill(map, 2, 2, 47, 73, CORRIDOR);

  // ══════════════════════════════════════
  // NORTH WING (rows 2-12)
  // ══════════════════════════════════════
  fill(map, 2, 2,  12, 11, RECEPTION);
  fill(map, 2, 12, 12, 12, WALL);
  fill(map, 2, 13, 12, 24, EMERGENCY);
  fill(map, 2, 25, 12, 25, WALL);
  fill(map, 2, 26, 12, 36, PHARMACY);
  fill(map, 2, 37, 12, 37, WALL);
  fill(map, 2, 38, 12, 49, LAB);
  fill(map, 2, 50, 12, 50, WALL);
  fill(map, 2, 51, 12, 61, RADIOLOGY);
  fill(map, 2, 62, 12, 62, WALL);
  fill(map, 2, 63, 12, 73, ADMIN);

  // North wing south wall
  fill(map, 13, 2, 13, 73, WALL);

  // Doors through row 13 (north→corridor)
  map[13][6]  = CORRIDOR; map[13][7]  = CORRIDOR; // RECEPTION
  map[13][18] = CORRIDOR; map[13][19] = CORRIDOR; // EMERGENCY
  map[13][30] = CORRIDOR; map[13][31] = CORRIDOR; // PHARMACY
  map[13][43] = CORRIDOR; map[13][44] = CORRIDOR; // LAB
  map[13][55] = CORRIDOR; map[13][56] = CORRIDOR; // RADIOLOGY
  map[13][67] = CORRIDOR; map[13][68] = CORRIDOR; // ADMIN

  // Corridor 1: rows 14-15 (already CORRIDOR)

  // ══════════════════════════════════════
  // MIDDLE WING (rows 16-26)
  // ══════════════════════════════════════
  // North wall of middle wing
  fill(map, 16, 2, 16, 73, WALL);

  fill(map, 17, 2,  26, 10, CME);
  fill(map, 17, 11, 26, 11, WALL);
  fill(map, 17, 12, 26, 22, BREAK);
  fill(map, 17, 23, 26, 23, WALL);
  fill(map, 17, 24, 26, 37, WARD);
  fill(map, 17, 38, 26, 38, WALL);
  fill(map, 17, 39, 26, 52, ICU);
  fill(map, 17, 53, 26, 53, WALL);
  fill(map, 17, 54, 26, 73, NURSING);

  // Doors through row 16 (corridor→middle wing)
  map[16][5]  = CORRIDOR; map[16][6]  = CORRIDOR; // CME
  map[16][16] = CORRIDOR; map[16][17] = CORRIDOR; // BREAK
  map[16][30] = CORRIDOR; map[16][31] = CORRIDOR; // WARD
  map[16][44] = CORRIDOR; map[16][45] = CORRIDOR; // ICU
  map[16][62] = CORRIDOR; map[16][63] = CORRIDOR; // NURSING

  // South wall of middle wing
  fill(map, 27, 2, 27, 73, WALL);

  // Doors through row 27
  map[27][5]  = CORRIDOR; map[27][6]  = CORRIDOR; // CME
  map[27][16] = CORRIDOR; map[27][17] = CORRIDOR; // BREAK
  map[27][30] = CORRIDOR; map[27][31] = CORRIDOR; // WARD
  map[27][44] = CORRIDOR; map[27][45] = CORRIDOR; // ICU
  map[27][62] = CORRIDOR; map[27][63] = CORRIDOR; // NURSING

  // Corridor 2: rows 28-29

  // ══════════════════════════════════════
  // SOUTH WING (rows 30-41)
  // ══════════════════════════════════════
  fill(map, 30, 2, 30, 73, WALL); // north wall

  fill(map, 31, 2,  41, 13, OUTPATIENT);
  fill(map, 31, 14, 41, 14, WALL);
  fill(map, 31, 15, 41, 26, MATERNITY);
  fill(map, 31, 27, 41, 27, WALL);
  fill(map, 31, 28, 41, 41, ONCOLOGY);
  fill(map, 31, 42, 41, 42, WALL);
  fill(map, 31, 43, 41, 55, REHAB);
  fill(map, 31, 56, 41, 56, WALL);
  fill(map, 31, 57, 41, 73, PSYCH);

  // Doors through row 30
  map[30][7]  = CORRIDOR; map[30][8]  = CORRIDOR; // OUTPATIENT
  map[30][20] = CORRIDOR; map[30][21] = CORRIDOR; // MATERNITY
  map[30][34] = CORRIDOR; map[30][35] = CORRIDOR; // ONCOLOGY
  map[30][48] = CORRIDOR; map[30][49] = CORRIDOR; // REHAB
  map[30][64] = CORRIDOR; map[30][65] = CORRIDOR; // PSYCH

  // South wall of south wing
  fill(map, 42, 2, 42, 73, WALL);

  // Doors through row 42 (into courtyard corridor)
  map[42][7]  = CORRIDOR; map[42][8]  = CORRIDOR;
  map[42][20] = CORRIDOR; map[42][21] = CORRIDOR;
  map[42][34] = CORRIDOR; map[42][35] = CORRIDOR;
  map[42][48] = CORRIDOR; map[42][49] = CORRIDOR;
  map[42][64] = CORRIDOR; map[42][65] = CORRIDOR;

  // Courtyard: rows 43-47 (interior garden)
  fill(map, 43, 2, 47, 73, GARDEN);
  // Courtyard path through center
  fill(map, 43, 33, 47, 42, CORRIDOR);

  return map;
}

// ─── TILESET TEXTURE ─────────────────────────────────────────────────────────
export function createTilesetTexture(scene: Phaser.Scene) {
  const W = TILE_SIZE;
  const key = 'tiles';
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const ct = scene.textures.createCanvas(key, W * NUM_TILES, W) as Phaser.Textures.CanvasTexture;
  const ctx = ct.getContext();

  const drawTile = (i: number, cb: (x: number) => void) => { cb(i * W); };

  /** Large-format polished floor tiles — classic hospital look */
  const bigTileFloor = (x: number, c1: string, c2: string, grout = '#9aa', glossAlpha = 0.18) => {
    const half = W / 2;
    ctx.fillStyle = c1; ctx.fillRect(x, 0, half, half);
    ctx.fillStyle = c2; ctx.fillRect(x + half, 0, half, half);
    ctx.fillStyle = c2; ctx.fillRect(x, half, half, half);
    ctx.fillStyle = c1; ctx.fillRect(x + half, half, half, half);
    // Grout lines
    ctx.strokeStyle = grout; ctx.lineWidth = 0.8; ctx.globalAlpha = 0.55;
    ctx.strokeRect(x + 0.5, 0.5, W - 1, W - 1);
    ctx.beginPath(); ctx.moveTo(x + half, 0); ctx.lineTo(x + half, W); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, half); ctx.lineTo(x + W, half); ctx.stroke();
    ctx.globalAlpha = 1;
    // Specular gloss highlight (top-left corner of each tile)
    ctx.fillStyle = `rgba(255,255,255,${glossAlpha})`;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + half * 0.55, 0);
    ctx.lineTo(x, half * 0.55); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + half, half);
    ctx.lineTo(x + half + half * 0.55, half);
    ctx.lineTo(x + half, half + half * 0.55); ctx.closePath(); ctx.fill();
  };

  /**
   * Clean pixel-art floor tile matching the reference UTI image style:
   * bright uniform base color + thin grout line + subtle top-left specular.
   */
  const pixelArtFloor = (x: number, base: string, grout: string, highlightAlpha = 0.15) => {
    ctx.fillStyle = base;
    ctx.fillRect(x, 0, W, W);
    // Thin grout lines (1px border + center cross)
    ctx.strokeStyle = grout; ctx.lineWidth = 1; ctx.globalAlpha = 0.5;
    ctx.strokeRect(x + 0.5, 0.5, W - 1, W - 1);
    ctx.globalAlpha = 1;
    // Specular highlight — small triangle top-left
    ctx.fillStyle = `rgba(255,255,255,${highlightAlpha})`;
    ctx.beginPath();
    ctx.moveTo(x, 0); ctx.lineTo(x + W * 0.45, 0); ctx.lineTo(x, W * 0.45);
    ctx.closePath(); ctx.fill();
    // Bottom-right subtle shadow
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    ctx.beginPath();
    ctx.moveTo(x + W, W); ctx.lineTo(x + W - W * 0.35, W); ctx.lineTo(x + W, W - W * 0.35);
    ctx.closePath(); ctx.fill();
  };

  /** Wainscot-patterned wall (horizontal relief bands) */
  const wallTile = (x: number, topCol: string, bandLight: string, bandDark: string, baseCol: string) => {
    // Full background
    ctx.fillStyle = topCol; ctx.fillRect(x, 0, W, W);
    // Raised wainscot panels (3 bands)
    const bands = 3;
    const bh = Math.floor((W - 4) / bands);
    for (let b = 0; b < bands; b++) {
      const by = b * bh + 1;
      const ox = b % 2 === 0 ? 0 : W / 2;
      for (let bx = ox; bx < W + W / 2; bx += W) {
        if (bx >= W) break;
        const pw = Math.min(W / 2 - 2, W - bx - 1);
        if (pw <= 0) continue;
        // Panel highlight top
        ctx.fillStyle = bandLight; ctx.fillRect(x + bx, by, pw, 1);
        // Panel body
        ctx.fillStyle = topCol; ctx.fillRect(x + bx + 1, by + 1, pw - 2, bh - 3);
        // Panel shadow bottom
        ctx.fillStyle = bandDark; ctx.fillRect(x + bx, by + bh - 2, pw, 2);
      }
    }
    // Top edge / crown molding
    ctx.fillStyle = 'rgba(255,255,255,0.65)'; ctx.fillRect(x, 0, W, 2);
    ctx.fillStyle = bandDark; ctx.fillRect(x, 2, W, 1);
    // Baseboard
    ctx.fillStyle = baseCol; ctx.fillRect(x, W - 6, W, 4);
    ctx.fillStyle = bandDark; ctx.fillRect(x, W - 2, W, 2);
    // Depth shadow at base
    const shadowGrad = ctx.createLinearGradient(x, W - 8, x, W);
    shadowGrad.addColorStop(0, 'rgba(0,0,0,0)');
    shadowGrad.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = shadowGrad; ctx.fillRect(x, W - 8, W, 8);
  };

  /** 0 — GARDEN: rich grass with blade texture */
  drawTile(TILE_ID.GARDEN, x => {
    // Base green
    const g = ctx.createLinearGradient(x, 0, x, W);
    g.addColorStop(0, '#4a9a58'); g.addColorStop(1, '#3d8549');
    ctx.fillStyle = g; ctx.fillRect(x, 0, W, W);
    // Blades (deterministic pseudo-random)
    const seeds = [3,11,19,7,23,5,17,29,13,2,8,25,15,27,6,21,4,16,10,22];
    for (let j = 0; j < seeds.length; j++) {
      const gx = (seeds[j] * 31 + j * 7) % (W - 2);
      const gy = (seeds[j] * 17 + j * 11) % (W - 5);
      ctx.fillStyle = j % 3 === 0 ? '#5db46a' : (j % 3 === 1 ? '#3a7a46' : '#6ec47a');
      ctx.fillRect(x + gx, gy, 1, 3 + (j % 3));
    }
    // Flowers (deterministic)
    const flowerPos = [[4,6],[20,3],[8,22],[26,14],[13,27],[29,9]];
    const flowerCols = ['#ffb3ba','#fff9b0','#ffccaa','#c8e8ff','#ffaaee','#aaffcc'];
    for (let f = 0; f < flowerPos.length; f++) {
      ctx.fillStyle = flowerCols[f % flowerCols.length];
      ctx.fillRect(x + flowerPos[f][0], flowerPos[f][1], 2, 2);
      // Center
      ctx.fillStyle = '#ffff88';
      ctx.fillRect(x + flowerPos[f][0] + 0, flowerPos[f][1] + 0, 1, 1);
    }
    // Path: subtle soil strip at bottom edge
    ctx.fillStyle = 'rgba(120,80,40,0.1)'; ctx.fillRect(x, W - 3, W, 3);
  });

  /** 1 — WALL */
  drawTile(TILE_ID.WALL, x => {
    wallTile(x, '#f2ede0', '#faf8f0', '#ccc5b0', '#c0b89a');
  });

  /** 2 — CORRIDOR: bright cream tile (clean hospital look) */
  drawTile(TILE_ID.CORRIDOR, x => {
    pixelArtFloor(x, '#f5f1e8', '#c8c0a8', 0.18);
  });

  /** 3 — ICU: clinical bright white with subtle teal grout (matches reference image) */
  drawTile(TILE_ID.ICU, x => {
    pixelArtFloor(x, '#f0f8f8', '#9ecece', 0.20);
    // Very subtle cross watermark
    ctx.fillStyle = 'rgba(26,188,156,0.07)';
    ctx.fillRect(x + 13, 6, 6, 20); ctx.fillRect(x + 6, 13, 20, 6);
  });

  /** 4 — PHARMACY: clean lavender tile */
  drawTile(TILE_ID.PHARMACY, x => {
    pixelArtFloor(x, '#ede8f8', '#b8a8d8', 0.15);
    // Small green cross
    ctx.fillStyle = 'rgba(46,204,113,0.25)';
    ctx.fillRect(x + 14, 8, 4, 16); ctx.fillRect(x + 8, 14, 16, 4);
  });

  /** 5 — ADMIN: warm parquet wood planks */
  drawTile(TILE_ID.ADMIN, x => {
    ctx.fillStyle = '#9b6b42'; ctx.fillRect(x, 0, W, W);
    const plankH = 8;
    const plankCols = ['#9b6b42','#8c5e38','#a8734a','#956342'];
    for (let row = 0; row < Math.ceil(W / plankH); row++) {
      ctx.fillStyle = plankCols[row % plankCols.length];
      ctx.fillRect(x, row * plankH, W, plankH - 1);
      const offset = row % 2 === 0 ? 0 : W / 2;
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      for (let seg = offset; seg < W + W / 2; seg += W / 2) {
        if (seg < W) ctx.fillRect(x + seg, row * plankH, 1, plankH - 1);
      }
    }
    ctx.fillStyle = 'rgba(255,200,100,0.08)';
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + W / 3, 0); ctx.lineTo(x, W / 3); ctx.closePath(); ctx.fill();
  });

  /** 6 — WARD: soft lavender tile */
  drawTile(TILE_ID.WARD, x => {
    pixelArtFloor(x, '#ede8f5', '#b8a8cc', 0.14);
  });

  /** 7 — BREAK/NUTRITION: clean white tile */
  drawTile(TILE_ID.BREAK, x => {
    pixelArtFloor(x, '#f8f8f5', '#b8b8b0', 0.12);
  });

  /** 8 — NURSING: mint/teal tile */
  drawTile(TILE_ID.NURSING, x => {
    pixelArtFloor(x, '#e8f8f0', '#88c8a8', 0.18);
    ctx.fillStyle = 'rgba(26,188,156,0.12)';
    ctx.fillRect(x + 9, 9, 4, 14); ctx.fillRect(x + 19, 9, 4, 14);
    ctx.fillRect(x + 9, 15, 14, 4);
  });

  /** 9 — RECEPTION: warm golden cream tile */
  drawTile(TILE_ID.RECEPTION, x => {
    pixelArtFloor(x, '#fdf5d8', '#c8a840', 0.20);
  });

  /** 10 — EMERGENCY: urgent warm red tile */
  drawTile(TILE_ID.EMERGENCY, x => {
    pixelArtFloor(x, '#fde8e8', '#d04040', 0.1);
    // Emergency cross stripe
    ctx.fillStyle = 'rgba(200,40,40,0.12)';
    ctx.fillRect(x + 13, 2, 6, W - 4); ctx.fillRect(x + 2, 13, W - 4, 6);
  });

  /** 11 — LAB: clean blue-white tile */
  drawTile(TILE_ID.LAB, x => {
    pixelArtFloor(x, '#e8f0fd', '#8090c0', 0.18);
  });

  /** 12 — RADIOLOGY: deep blue tile */
  drawTile(TILE_ID.RADIOLOGY, x => {
    pixelArtFloor(x, '#e8ecfc', '#6070a0', 0.20);
  });

  /** 13 — CME: sterile grey-white tile */
  drawTile(TILE_ID.CME, x => {
    pixelArtFloor(x, '#f0f0f4', '#9098b0', 0.14);
  });

  /** 14 — MATERNITY: soft rosy pink tile */
  drawTile(TILE_ID.MATERNITY, x => {
    pixelArtFloor(x, '#fce8ee', '#c87898', 0.14);
    // Heart watermark
    ctx.fillStyle = 'rgba(220,80,120,0.10)';
    const hx = x + W/2, hy = W/2;
    ctx.beginPath(); ctx.arc(hx - 4, hy - 2, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(hx + 4, hy - 2, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(hx - 8, hy); ctx.lineTo(hx, hy + 8); ctx.lineTo(hx + 8, hy); ctx.closePath(); ctx.fill();
  });

  /** 15 — ONCOLOGY: teal mint tile */
  drawTile(TILE_ID.ONCOLOGY, x => {
    pixelArtFloor(x, '#e8f8f0', '#44a878', 0.18);
    // Ribbon awareness loop
    ctx.strokeStyle = 'rgba(26,188,156,0.2)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(x + W/2, W/2, 8, 0, Math.PI * 2); ctx.stroke();
  });

  /** 16 — REHAB: warm yellow tile */
  drawTile(TILE_ID.REHAB, x => {
    pixelArtFloor(x, '#fdf8e0', '#c0a020', 0.15);
  });

  /** 17 — OUTPATIENT: soft sky-blue tile */
  drawTile(TILE_ID.OUTPATIENT, x => {
    pixelArtFloor(x, '#eaf4fc', '#6090b0', 0.18);
  });

  /** 18 — PSYCH: soothing lavender tile */
  drawTile(TILE_ID.PSYCH, x => {
    pixelArtFloor(x, '#f0e8fc', '#9060c0', 0.12);
  });

  ct.refresh();
  return ct;
}

// ─── TYPES ────────────────────────────────────────────────────────────────────
export interface NPCDef {
  id: string;
  name: string;
  title: string;
  role: 'doctor' | 'nurse' | 'technician' | 'admin' | 'receptionist' | 'other';
  spriteKey: string;
  startCol: number;
  startRow: number;
  patrolPoints: { col: number; row: number }[];
  bodyColor: number;
  coatColor: number;
  hairColor: number;
  skinColor?: number;
  dialogues: DialogueDef[];
  /** Optional rotating dialogue pools — each pool is shown in sequence across conversations */
  dialoguePools?: DialogueDef[][];
  missionIds: string[];
  schedule: { hour: number; col: number; row: number }[];
}

export interface DialogueDef {
  id: string;
  condition?: (state: GameState) => boolean;
  text: string[];
  choices: DialogueChoice[];
}

export interface DialogueChoice {
  text: string;
  effect?: (state: GameState) => Partial<GameState>;
  missionEffect?: string;
  next?: string;
  tooltip?: string;
  /** When true, the choice represents the best nursing management decision */
  correct?: boolean;
  /** Feedback shown when the student makes this choice */
  feedback?: string;
}

export interface GameState {
  prestige: number;
  energy: number;
  stress: number;
  completedMissions: string[];
  missionProgress: Record<string, number>;
  relationships: Record<string, number>;
  gameTime: number;
  day: number;
  crisisCount: number;
  decisionLog: string[];
  unlockedSectors: string[];
}

export interface MissionDef {
  id: string;
  title: string;
  description: string;
  category: string;
  prestige: number;
  steps: number;
  prerequisiteIds: string[];
  pedagogy: string;
  pedagogyRef: string;
}

export interface CrisisEvent {
  id: string;
  title: string;
  description: string;
  urgent: boolean;
  choices: CrisisChoice[];
  minCareerLevel: number;
}

export interface CrisisChoice {
  text: string;
  tooltip?: string;
  correct: boolean;
  prestigeEffect: number;
  energyEffect: number;
  stressEffect: number;
  feedback: string;
}

// ─── CAREER SYSTEM ────────────────────────────────────────────────────────────
export function getLevelInfo(prestige: number) {
  let level = 0;
  for (let i = CAREER_LEVELS.length - 1; i >= 0; i--) {
    if (prestige >= CAREER_LEVELS[i].minPrestige) { level = i; break; }
  }
  const current = CAREER_LEVELS[level];
  const next = CAREER_LEVELS[Math.min(level + 1, CAREER_LEVELS.length - 1)];
  const toNext = level < CAREER_LEVELS.length - 1 ? next.minPrestige - prestige : 0;
  return { level, title: current.title, toNext, nextTitle: next.title };
}

// ─── CRISIS EVENTS ────────────────────────────────────────────────────────────
export const CRISIS_EVENTS: CrisisEvent[] = [
  {
    id: 'codigo_azul',
    title: '🚨 CÓDIGO AZUL — Parada Cardiorrespiratória',
    description: 'Paciente da Enfermaria Clínica entrou em parada! A equipe precisa de liderança imediata.',
    urgent: true,
    minCareerLevel: 0,
    choices: [
      {
        text: 'Acionar imediatamente o carrinho de parada e ligar para o médico de plantão',
        tooltip: 'Conduta correta: protocolo ACLS e acionamento da equipe',
        correct: true,
        prestigeEffect: 50, energyEffect: -20, stressEffect: 15,
        feedback: 'Excelente! O acionamento imediato do protocolo ACLS salva vidas. (Marquis & Huston, 2015)',
      },
      {
        text: 'Aguardar outros membros da equipe chegarem antes de agir',
        tooltip: 'Cada minuto conta em uma PCR',
        correct: false,
        prestigeEffect: -20, energyEffect: -5, stressEffect: 20,
        feedback: 'Atenção: em PCR, o início imediato do RCP é fundamental. Não espere — lidere! (Kurcgant, 2016)',
      },
      {
        text: 'Chamar o técnico de enfermagem e delegá-lo para iniciar o protocolo',
        tooltip: 'Delegação inadequada em situação crítica',
        correct: false,
        prestigeEffect: -10, energyEffect: -5, stressEffect: 25,
        feedback: 'A liderança do enfermeiro é indispensável em situações críticas. A delegação precisa ser supervisionada.',
      },
    ],
  },
  {
    id: 'falta_funcionario',
    title: '⚠️ FUNCIONÁRIO FALTOU — Turno Descoberto',
    description: '2 técnicos de enfermagem faltaram sem aviso. O próximo turno começa em 30 minutos.',
    urgent: false,
    minCareerLevel: 0,
    choices: [
      {
        text: 'Contatar técnicos em folga compensatória e oferecer banco de horas extra',
        tooltip: 'Gestão eficiente de escala por banco de horas',
        correct: true,
        prestigeEffect: 40, energyEffect: -10, stressEffect: 10,
        feedback: 'Ótimo! O banco de horas é uma ferramenta de gestão de escala prevista na CLT e reconhecida por Kurcgant (2016).',
      },
      {
        text: 'Cobrir você mesma junto com quem está de plantão',
        tooltip: 'Sobrecarregar a equipe atual aumenta risco de erro',
        correct: false,
        prestigeEffect: 10, energyEffect: -25, stressEffect: 30,
        feedback: 'A sobrecarga da equipe é fator de risco para erros. O dimensionamento adequado é papel do gerente (COFEN).',
      },
      {
        text: 'Notificar a Diretoria e registrar o evento em ata',
        tooltip: 'Necessário, mas insuficiente sem ação imediata',
        correct: false,
        prestigeEffect: 15, energyEffect: -5, stressEffect: 15,
        feedback: 'A notificação é importante, mas o enfermeiro gerente deve resolver o problema operacionalmente também.',
      },
    ],
  },
  {
    id: 'queda_paciente',
    title: 'QUEDA DE PACIENTE — Evento Adverso Notificado',
    description: 'Um paciente caiu da cama na Enfermaria. Família está presente e exige explicações.',
    urgent: false,
    minCareerLevel: 0,
    choices: [
      {
        text: 'Avaliar o paciente, preencher o REAS, notificar a gestão e conversar com a família com transparência',
        tooltip: 'Protocolo completo: avaliação + notificação + comunicação',
        correct: true,
        prestigeEffect: 45, energyEffect: -15, stressEffect: 10,
        feedback: 'Parabéns! A notificação de eventos adversos é fundamental na cultura de segurança do paciente (OMS/PNSP).',
      },
      {
        text: 'Registrar o evento internamente apenas, sem comunicar a família agora',
        tooltip: 'A falta de transparência viola direitos do paciente',
        correct: false,
        prestigeEffect: -15, energyEffect: -10, stressEffect: 20,
        feedback: 'A comunicação transparente com pacientes e famílias é um princípio ético e legal. Não omita informações.',
      },
      {
        text: 'Acalmar a família e verificar se o paciente está bem antes de qualquer registro',
        tooltip: 'Confortar é importante, mas registro imediato é obrigatório',
        correct: false,
        prestigeEffect: 15, energyEffect: -8, stressEffect: 15,
        feedback: 'O acolhimento à família é correto, mas o registro e notificação devem ser simultâneos, não posteriores.',
      },
    ],
  },
  {
    id: 'superlotacao_ps',
    title: 'SUPERLOTACAO — Pronto-Socorro em Colapso',
    description: 'O PS tem 40% mais pacientes que a capacidade. Macas no corredor, equipe esgotada.',
    urgent: true,
    minCareerLevel: 1,
    choices: [
      {
        text: 'Acionar protocolo de superlotação: triagem de Manchester rigorosa + alta precoce de internados elegíveis',
        tooltip: 'Protocolo estruturado de gestão de fluxo',
        correct: true,
        prestigeEffect: 55, energyEffect: -20, stressEffect: 20,
        feedback: 'Excelente gestão de fluxo! O Manchester Triage System e a gestão de leitos são estratégias comprovadas.',
      },
      {
        text: 'Fechar temporariamente o PS para novos atendimentos',
        tooltip: 'Fechamento do PS é decisão complexa e pode ser ilegal',
        correct: false,
        prestigeEffect: -30, energyEffect: -5, stressEffect: 30,
        feedback: 'O fechamento do PS é medida extrema e exige autorização da direção e órgãos competentes.',
      },
      {
        text: 'Realocar toda a equipe disponível do hospital para o PS',
        tooltip: 'Descobre outros setores, podendo causar mais eventos adversos',
        correct: false,
        prestigeEffect: -10, energyEffect: -15, stressEffect: 25,
        feedback: 'A realocação total expõe outros setores ao risco. É necessário um plano de contingência proporcional.',
      },
    ],
  },
  {
    id: 'erro_medicacao',
    title: 'NEAR-MISS — Erro de Medicação Evitado',
    description: 'Um técnico quase administrou a dose errada de heparina. Descoberto na conferência dupla.',
    urgent: false,
    minCareerLevel: 0,
    choices: [
      {
        text: 'Elogiar a conferência dupla, notificar o near-miss e usar como caso educativo na próxima reunião de equipe',
        tooltip: 'Cultura de segurança positiva: aprendizado sem punição',
        correct: true,
        prestigeEffect: 50, energyEffect: -10, stressEffect: 5,
        feedback: 'Excelente! O near-miss notificado é uma oportunidade de aprendizado. Cultura de segurança sem culpa (OMS).',
      },
      {
        text: 'Advertir o técnico por quase cometer o erro',
        tooltip: 'Punição após near-miss reduz notificações futuras',
        correct: false,
        prestigeEffect: -20, energyEffect: -5, stressEffect: 15,
        feedback: 'A punição em near-miss inibe notificações futuras, aumentando o risco real. Use o modelo de aprendizado.',
      },
      {
        text: 'Registrar internamente mas não comunicar à equipe para não criar ansiedade',
        tooltip: 'A ocultação de near-misses é prejudicial à segurança',
        correct: false,
        prestigeEffect: -10, energyEffect: -5, stressEffect: 10,
        feedback: 'Compartilhar near-misses com a equipe é fundamental para aprendizado coletivo e prevenção (PNSP).',
      },
    ],
  },
  {
    id: 'falta_material',
    title: '📦 FALTA DE MATERIAL — Estoque Crítico',
    description: 'Acaban as luvas estéreis. Centro cirúrgico aguarda procedimento urgente.',
    urgent: true,
    minCareerLevel: 0,
    choices: [
      {
        text: 'Contatar farmácia, compras e solicitar empréstimo emergencial de outro hospital da rede',
        tooltip: 'Solução multissetorial e eficiente',
        correct: true,
        prestigeEffect: 45, energyEffect: -15, stressEffect: 10,
        feedback: 'Perfeito! A articulação intersetorial e a rede de apoio são fundamentais na gestão hospitalar.',
      },
      {
        text: 'Adiar o procedimento até a chegada do material pedido normalmente',
        tooltip: 'Adiar procedimento urgente causa dano ao paciente',
        correct: false,
        prestigeEffect: -25, energyEffect: -5, stressEffect: 20,
        feedback: 'Adiar procedimentos urgentes compromete a segurança. Sempre busque soluções alternativas primeiro.',
      },
      {
        text: 'Usar material similar disponível não estéril com protocolo adaptado',
        tooltip: 'Improvisação pode causar infecção grave',
        correct: false,
        prestigeEffect: -30, energyEffect: -10, stressEffect: 30,
        feedback: 'Jamais improvise com material não estéril em cirurgia. A esterilização é imperativa (ANVISA/CME).',
      },
    ],
  },
  {
    id: 'conflito_equipe',
    title: '🤝 CONFLITO — Desentendimento entre Enfermeiras',
    description: 'Duas enfermeiras estão em conflito aberto, afetando o clima da equipe no turno.',
    urgent: false,
    minCareerLevel: 0,
    choices: [
      {
        text: 'Realizar mediação individual com cada parte, depois reunião conjunta com foco na comunicação não-violenta',
        tooltip: 'Abordagem estruturada de gestão de conflitos',
        correct: true,
        prestigeEffect: 45, energyEffect: -20, stressEffect: 10,
        feedback: 'Excelente! A mediação é a ferramenta mais eficaz na gestão de conflitos interpessoais (Marquis & Huston).',
      },
      {
        text: 'Ignorar o conflito; as profissionais são adultas e devem se resolver sozinhas',
        tooltip: 'Conflitos não geridos escalam e afetam a assistência',
        correct: false,
        prestigeEffect: -20, energyEffect: 0, stressEffect: 20,
        feedback: 'Conflitos não geridos afetam a qualidade da assistência e o bem-estar da equipe. Intervenção é essencial.',
      },
      {
        text: 'Transferir uma das enfermeiras para outro setor para resolver o conflito',
        tooltip: 'Transferência evita, mas não resolve o conflito',
        correct: false,
        prestigeEffect: 5, energyEffect: -10, stressEffect: 15,
        feedback: 'A transferência pode mascarar o conflito sem resolução real. A mediação deve ser tentada primeiro.',
      },
    ],
  },
  {
    id: 'infeccao_hospitalar',
    title: '🦠 ALERTA — Infecção Hospitalar em Cluster',
    description: 'CCIH notificou 3 casos de infecção por Klebsiella em leitos adjacentes da UTI.',
    urgent: true,
    minCareerLevel: 2,
    choices: [
      {
        text: 'Isolar os pacientes, reforçar protocolo de higienização das mãos e acionar a CCIH para investigação',
        tooltip: 'Medidas imediatas de controle de infecção',
        correct: true,
        prestigeEffect: 60, energyEffect: -20, stressEffect: 15,
        feedback: 'Perfeito! O isolamento e a higienização das mãos são as principais medidas de controle (ANVISA/CCIH).',
      },
      {
        text: 'Aumentar a limpeza do ambiente e aguardar mais resultados antes de tomar medidas',
        tooltip: 'A espera em cluster de infecção é perigosa',
        correct: false,
        prestigeEffect: -20, energyEffect: -5, stressEffect: 20,
        feedback: 'Em cluster de infecção hospitalar, as medidas de controle devem ser imediatas, não aguardar confirmação.',
      },
      {
        text: 'Transferir os pacientes infectados para outro andar do hospital',
        tooltip: 'Transferência sem isolamento adequado pode disseminar o patógeno',
        correct: false,
        prestigeEffect: -15, energyEffect: -10, stressEffect: 25,
        feedback: 'A transferência sem isolamento adequado pode disseminar o patógeno. Isole in loco primeiro.',
      },
    ],
  },
  {
    id: 'transferencia_urgente',
    title: '🚐 TRANSFERÊNCIA — Paciente Crítico Precisa Ser Transferido',
    description: 'Paciente da UTI precisa de cirurgia cardíaca especializada em outro hospital. Família aguarda.',
    urgent: false,
    minCareerLevel: 1,
    choices: [
      {
        text: 'Acionar Central de Regulação, preparar sumário de transferência completo e comunicar família',
        tooltip: 'Protocolo completo de transferência segura',
        correct: true,
        prestigeEffect: 50, energyEffect: -15, stressEffect: 10,
        feedback: 'Excelente! O sumário de transferência e a comunicação familiar são fundamentais para continuidade do cuidado.',
      },
      {
        text: 'Contatar diretamente o outro hospital e organizar o transporte sem acionar a regulação',
        tooltip: 'A regulação é obrigatória para transferências pelo SUS',
        correct: false,
        prestigeEffect: -10, energyEffect: -10, stressEffect: 15,
        feedback: 'A Central de Regulação é o fluxo correto para transferências no SUS. Bypasse pode gerar problemas legais.',
      },
      {
        text: 'Orientar a família a buscar o serviço por conta própria pois não há regulação disponível',
        tooltip: 'Abandono assistencial — inadmissível',
        correct: false,
        prestigeEffect: -40, energyEffect: -5, stressEffect: 30,
        feedback: 'Orientar família a buscar serviço por conta própria é abandono assistencial, vedado pelo Código de Ética.',
      },
    ],
  },
  {
    id: 'indicadores_qualidade',
    title: '📊 AUDITORIA — Indicadores Abaixo da Meta',
    description: 'Os indicadores de qualidade do mês mostram aumento de 30% em eventos adversos. A diretoria quer explicações.',
    urgent: false,
    minCareerLevel: 2,
    choices: [
      {
        text: 'Apresentar análise crítica dos dados, identificar causas raiz e propor plano de ação (PDCA)',
        tooltip: 'Abordagem profissional e científica na gestão da qualidade',
        correct: true,
        prestigeEffect: 65, energyEffect: -20, stressEffect: 10,
        feedback: 'Excelente! A análise de causa raiz e o ciclo PDCA são ferramentas padrão da gestão de qualidade em saúde.',
      },
      {
        text: 'Justificar os indicadores pelo aumento do volume de pacientes e solicitar mais recursos',
        tooltip: 'Justificativa válida mas incompleta sem plano de ação',
        correct: false,
        prestigeEffect: 10, energyEffect: -10, stressEffect: 15,
        feedback: 'A justificativa é parcialmente válida, mas sem plano de ação demonstra falta de proatividade na gestão.',
      },
      {
        text: 'Questionar a metodologia dos indicadores e sugerir revisão dos critérios de medição',
        tooltip: 'Contestar dados sem análise é evasão da responsabilidade',
        correct: false,
        prestigeEffect: -15, energyEffect: -5, stressEffect: 20,
        feedback: 'Contestar indicadores sem evidência é evasão. O enfermeiro gerente deve responder com propostas de melhoria.',
      },
    ],
  },
];

// ─── NPC DEFINITIONS ──────────────────────────────────────────────────────────
export const NPC_DEFS: NPCDef[] = [
  {
    id: 'ana_recepcionista',
    name: 'Ana Beatriz',
    title: 'Recepcionista Chefe',
    role: 'receptionist',
    spriteKey: 'npc_ana',
    startCol: 6, startRow: 7,
    bodyColor: 0xffffff, coatColor: 0xa0c8d8, hairColor: 0x6b3a2a, skinColor: 0xf5c5a3,
    patrolPoints: [
      { col: 6, row: 7 }, { col: 3, row: 7 }, { col: 3, row: 11 }, { col: 9, row: 11 },
    ],
    schedule: [
      { hour: 7, col: 6, row: 7 }, { hour: 19, col: 6, row: 7 },
    ],
    missionIds: ['triagem_ps', 'fluxo_recepcao'],
    dialogues: [
      {
        id: 'intro',
        condition: (s) => !s.missionProgress['triagem_ps'],
        text: [
          'Bom dia! O Pronto-Socorro está com fila grande hoje.',
          'Temos 12 pacientes aguardando triagem desde as 6h.',
          'O Sistema Manchester está com problemas. Preciso de apoio!',
        ],
        choices: [
          {
            text: 'Vou implementar o protocolo de Manchester agora.',
            tooltip: 'Classificação de Risco de Manchester — padrão nacional',
            effect: (s) => ({ prestige: s.prestige + 20, stress: s.stress + 5 }),
            missionEffect: 'triagem_ps:start',
          },
          {
            text: 'Chame mais um técnico para ajudar na triagem.',
            tooltip: 'Boa medida de suporte',
            effect: (s) => ({ prestige: s.prestige + 10 }),
            missionEffect: 'triagem_ps:start',
          },
        ],
      },
      {
        id: 'fluxo_start',
        condition: (s) => s.completedMissions.includes('triagem_ps') && !s.missionProgress['fluxo_recepcao'],
        text: [
          'Com o Manchester funcionando bem, o fluxo melhorou muito!',
          'Agora preciso de ajuda para organizar o sistema de agendamentos.',
          'Muitos pacientes chegam sem marcação no ambulatório.',
        ],
        choices: [
          {
            text: 'Vamos criar um protocolo de acolhimento integrado.',
            effect: (s) => ({ prestige: s.prestige + 25 }),
            missionEffect: 'fluxo_recepcao:start',
          },
        ],
      },
      {
        id: 'idle',
        text: [
          'A recepção está muito mais organizada, obrigada!',
          'O fluxo de atendimento é o coração do hospital.',
        ],
        choices: [{ text: 'Fico feliz em ouvir isso, Ana!' }],
      },
    ],
    dialoguePools: [
      // Pool 1: Classificação de Risco de Manchester (Kurcgant cap.6)
      [{
        id: 'pool1',
        text: [
          'Precisamos de uma decisão rápida aqui na triagem!',
          'Paciente chegou com dor torácica há 30 minutos, sudorese fria, PA 90x60.',
          'Qual é a classificação correta pelo Protocolo de Manchester?',
        ],
        choices: [
          { text: 'Vermelho — emergência, atendimento imediato sem espera.', correct: true, tooltip: 'Dor torácica + instabilidade hemodinâmica = código vermelho (MTS)', feedback: 'Correto! Sinais de choque + dor torácica = categoria vermelha no Manchester. Risco de IAM iminente. (Manchester Triage Group, 2014)', effect: (s) => ({ prestige: s.prestige + 25 }) },
          { text: 'Laranja — muito urgente, atendimento em até 10 minutos.', correct: false, tooltip: 'Atenção à instabilidade hemodinâmica presente', feedback: 'Quase! A instabilidade hemodinâmica (PA 90x60 + sudorese) eleva para vermelho, não laranja. (MTS, 2014)', effect: (s) => ({ prestige: s.prestige + 8 }) },
          { text: 'Amarelo — urgente, atendimento em até 60 minutos.', correct: false, tooltip: 'Esse quadro não pode aguardar 60 minutos', feedback: 'Incorreto. Dor torácica com choque não pode esperar. O tempo é miocárdio! (ACLS 2020)', effect: (s) => ({ prestige: s.prestige + 2 }) },
          { text: 'Verde — pouco urgente, aguarda na fila padrão.', correct: false, tooltip: 'Triagem inadequada pode custar a vida do paciente', feedback: 'Perigoso! Subtriar esse quadro pode ser fatal. Revise o Protocolo de Manchester. (Kurcgant, 2016)', effect: (s) => ({ prestige: s.prestige - 5 }) },
        ],
      }],
      // Pool 2: Acolhimento com Classificação de Risco — PNH (cap.6)
      [{
        id: 'pool2',
        text: [
          'Chegou uma senhora idosa sozinha, confusa, sem cartão do SUS.',
          'A fila está grande e a equipe está sobrecarregada.',
          'Qual deve ser o primeiro passo segundo a Política Nacional de Humanização?',
        ],
        choices: [
          { text: 'Realizar o acolhimento com escuta qualificada e classificação de risco imediatamente.', correct: true, tooltip: 'PNH: acolhimento independente da situação documental', feedback: 'Correto! O acolhimento com classificação de risco é a porta de entrada da PNH. Nenhum paciente pode ser recusado. (MS, HumanizaSUS 2009)', effect: (s) => ({ prestige: s.prestige + 25 }) },
          { text: 'Solicitar documento de identidade antes de prosseguir com o atendimento.', correct: false, feedback: 'Incorreto. A ausência de documentos nunca justifica a recusa de atendimento (Art. 196, CF/88).', effect: (s) => ({ prestige: s.prestige + 0 }) },
          { text: 'Encaminhar para serviço social e aguardar resolução do cadastro.', correct: false, feedback: 'Incompleto. Primeiro classifique o risco — só depois o serviço social pode agir.', effect: (s) => ({ prestige: s.prestige + 5 }) },
          { text: 'Chamar familiar por telefone e aguardar responsável antes de atender.', correct: false, feedback: 'Incorreto. Paciente confuso pode estar em risco. Avalie primeiro, busque familiar depois.', effect: (s) => ({ prestige: s.prestige + 2 }) },
        ],
      }],
      // Pool 3: Fluxo de Atendimento — gestão de filas (Kurcgant cap.4)
      [{
        id: 'pool3',
        text: [
          'O tempo médio de espera na recepção subiu para 4 horas.',
          'Pacientes estão saindo sem ser atendidos — evasão hospitalar.',
          'Qual intervenção de gestão é mais eficaz para reduzir o tempo de espera?',
        ],
        choices: [
          { text: 'Mapear o fluxo atual (fluxograma), identificar gargalos e redistribuir recursos nos pontos críticos.', correct: true, tooltip: 'Análise de processos: ferramenta de gestão de fluxo (Kurcgant cap.4)', feedback: 'Excelente! O mapeamento de fluxo e análise de gargalos é a base da gestão científica de processos hospitalares. (Kurcgant, 2016 cap.4)', effect: (s) => ({ prestige: s.prestige + 28 }) },
          { text: 'Contratar mais recepcionistas para atender mais rápido.', correct: false, feedback: 'Apenas aumentar pessoal sem mapear o processo raramente resolve o problema e aumenta custos.', effect: (s) => ({ prestige: s.prestige + 5 }) },
          { text: 'Colocar aviso na entrada pedindo que pacientes não urgentes busquem UBS.', correct: false, feedback: 'Medida paliativa. Sem triagem adequada, pode negar atendimento a pacientes que precisam.', effect: (s) => ({ prestige: s.prestige + 3 }) },
          { text: 'Reduzir o horário de atendimento para concentrar a equipe.', correct: false, feedback: 'Reduzir horário aumenta a concentração de demanda nos picos, piorando o problema.', effect: (s) => ({ prestige: s.prestige + 0 }) },
        ],
      }],
    ],
  },
  {
    id: 'enf_carlos',
    name: 'Enf. Carlos',
    title: 'Enfermeiro do Pronto-Socorro',
    role: 'nurse',
    spriteKey: 'npc_carlos',
    startCol: 18, startRow: 7,
    bodyColor: 0xffffff, coatColor: 0xe74c3c, hairColor: 0x2c1810, skinColor: 0xd4a574,
    patrolPoints: [
      { col: 18, row: 7 }, { col: 14, row: 7 }, { col: 14, row: 11 }, { col: 22, row: 11 },
    ],
    schedule: [
      { hour: 7, col: 18, row: 7 }, { hour: 19, col: 18, row: 7 },
    ],
    missionIds: ['protocolo_sepse', 'superlotacao_ps'],
    dialogues: [
      {
        id: 'sepse_intro',
        condition: (s) => !s.missionProgress['protocolo_sepse'],
        text: [
          'Precisamos urgente de um protocolo de sepse aqui no PS!',
          'Já tivemos 3 casos este mês com diagnóstico tardio.',
          'A Bundle de Sepse do Einstein pode ser adaptada para o HUAP.',
        ],
        choices: [
          {
            text: 'Vamos implementar a Bundle de 1h e 3h agora!',
            tooltip: 'Bundles de sepse reduzem mortalidade em 20-40%',
            effect: (s) => ({ prestige: s.prestige + 30, stress: s.stress + 10 }),
            missionEffect: 'protocolo_sepse:start',
          },
          {
            text: 'Preciso estudar o protocolo antes de implementar.',
            effect: (s) => ({ prestige: s.prestige + 15 }),
            missionEffect: 'protocolo_sepse:start',
          },
        ],
      },
      {
        id: 'superlot_intro',
        condition: (s) => s.completedMissions.includes('protocolo_sepse') && !s.missionProgress['superlotacao_ps'],
        text: [
          'Protocolo de sepse funcionando. Mas o PS está cheio de novo!',
          'Precisamos de um plano de contingência para superlotação.',
          'O Ministério da Saúde recomenda o protocolo de overcrowding.',
        ],
        choices: [
          {
            text: 'Vou propor o protocolo para a Diretoria.',
            effect: (s) => ({ prestige: s.prestige + 35 }),
            missionEffect: 'superlotacao_ps:start',
          },
        ],
      },
      {
        id: 'idle',
        text: [
          'O PS está mais organizado agora.',
          'Cada segundo importa aqui. Obrigado pelo apoio!',
        ],
        choices: [{ text: 'Continue o ótimo trabalho, Carlos!' }],
      },
    ],
    dialoguePools: [
      [{
        id: 'pool1_carlos',
        text: [
          'Temos um paciente com suspeita de sepse — PA 80x50, febre 39°C, lactato 3,2.',
          'O residente pediu para aguardar mais exames antes de iniciar antibiótico.',
          'Como gerente, qual é a conduta correta baseada na Bundle de Sepse?',
        ],
        choices: [
          { text: 'Iniciar antibiótico em até 1 hora, coletar hemoculturas, repor volemia conforme bundle de 1h.', correct: true, tooltip: 'Bundle de sepse: antibiótico na 1ª hora reduz mortalidade em 7% por hora de atraso', feedback: 'Perfeito! A Bundle de 1h da Surviving Sepsis Campaign (2018) é mandatória: antibiótico < 1h, hemocultura, lactato e reposição volêmica.', effect: (s) => ({ prestige: s.prestige + 30, stress: s.stress + 5 }) },
          { text: 'Aguardar resultado de hemograma e PCR para confirmar sepse antes de antibiótico.', correct: false, feedback: 'Incorreto. Em sepse, cada hora de atraso do antibiótico aumenta a mortalidade em ~7%. Não aguarde exames.', effect: (s) => ({ prestige: s.prestige + 3 }) },
          { text: 'Solicitar parecer da infectologia antes de iniciar qualquer tratamento.', correct: false, feedback: 'Perigoso! O parecer pode demorar horas. A bundle de sepse não pode aguardar. Trate empiricamente.', effect: (s) => ({ prestige: s.prestige + 2 }) },
          { text: 'Transferir para UTI e aguardar o intensivista decidir o tratamento.', correct: false, feedback: 'Incompleto. A bundle deve ser iniciada no PS imediatamente, não pode aguardar a UTI.', effect: (s) => ({ prestige: s.prestige + 5 }) },
        ],
      }],
      [{
        id: 'pool2_carlos',
        text: [
          'A equipe está com 3 técnicos de enfermagem para atender 18 pacientes no PS.',
          'Segundo o COFEN, qual é o dimensionamento mínimo para o Pronto-Socorro?',
          'Preciso da sua orientação para justificar mais contratações à direção.',
        ],
        choices: [
          { text: 'Resolução COFEN 543/2017: no mínimo 1 enfermeiro para cada 10 pacientes em unidade de urgência.', correct: true, tooltip: 'Resolução COFEN 543/2017 — parâmetros de dimensionamento', feedback: 'Correto! A Resolução COFEN 543/2017 estabelece parâmetros mínimos. No PS de média/alta complexidade: 1 enf./10 pacientes. Use isso para fundamentar a solicitação. (Kurcgant, 2016 cap.10)', effect: (s) => ({ prestige: s.prestige + 28 }) },
          { text: 'Não há regulamentação específica; cada hospital define seus próprios parâmetros.', correct: false, feedback: 'Incorreto. A Resolução COFEN 543/2017 define parâmetros mínimos para dimensionamento em todos os setores.', effect: (s) => ({ prestige: s.prestige + 0 }) },
          { text: 'O importante é ter pelo menos 1 enfermeiro de plantão, independente do número de pacientes.', correct: false, feedback: 'Insuficiente. A legislação estabelece relação quantitativa enfermeiro/paciente específica por setor e complexidade.', effect: (s) => ({ prestige: s.prestige + 2 }) },
          { text: 'O dimensionamento é calculado pela direção hospitalar com base no orçamento disponível.', correct: false, feedback: 'Errado. O COFEN define parâmetros técnicos mínimos que devem ser respeitados independente do orçamento.', effect: (s) => ({ prestige: s.prestige + 0 }) },
        ],
      }],
      [{
        id: 'pool3_carlos',
        text: [
          'Acabei de discutir com a médica plantonista sobre a conduta de um paciente.',
          'Ela ignorou minha observação sobre o risco de broncoaspiração.',
          'Como o enfermeiro gerente deve lidar com conflitos multiprofissionais?',
        ],
        choices: [
          { text: 'Comunicar a observação por escrito no prontuário e, se necessário, escalar ao chefe médico com dados clínicos.', correct: true, tooltip: 'Comunicação estruturada e documentada: SBAR/I-PASS', feedback: 'Correto! A comunicação efetiva via SBAR (Situação-Background-Avaliação-Recomendação) e registro no prontuário protegem o paciente e o profissional. (Kurcgant cap.5 — Conflitos)', effect: (s) => ({ prestige: s.prestige + 25 }) },
          { text: 'Aceitar a decisão médica e não interferir — a responsabilidade é dela.', correct: false, feedback: 'Incorreto. O enfermeiro tem responsabilidade autônoma pela segurança do paciente. Omitir-se é negligência.', effect: (s) => ({ prestige: s.prestige - 5 }) },
          { text: 'Relatar imediatamente ao COREN como desentendimento multiprofissional.', correct: false, feedback: 'Precipitado. O COREN é para questões éticas graves. Primeiro tente a comunicação direta estruturada.', effect: (s) => ({ prestige: s.prestige + 2 }) },
          { text: 'Falar com outros colegas sobre o comportamento da médica para obter apoio.', correct: false, feedback: 'Incorreto. Fofoca profissional piora o clima e viola princípios éticos. Comunique-se diretamente.', effect: (s) => ({ prestige: s.prestige - 3 }) },
        ],
      }],
    ],
  },
  {
    id: 'joao_farmaceutico',
    name: 'Farm. João',
    title: 'Farmacêutico Hospitalar',
    role: 'technician',
    spriteKey: 'npc_joao',
    startCol: 30, startRow: 7,
    bodyColor: 0xffffff, coatColor: 0x9b59b6, hairColor: 0x1a1a1a, skinColor: 0xf5c5a3,
    patrolPoints: [
      { col: 30, row: 7 }, { col: 27, row: 7 }, { col: 27, row: 11 }, { col: 34, row: 11 },
    ],
    schedule: [
      { hour: 8, col: 30, row: 7 }, { hour: 16, col: 30, row: 11 },
    ],
    missionIds: ['estoque_farmacia', 'reconciliacao_medicamentosa'],
    dialogues: [
      {
        id: 'estoque_intro',
        condition: (s) => !s.missionProgress['estoque_farmacia'],
        text: [
          'Oi! Estamos com estoque crítico de medicamentos vasoativos.',
          'Norepinefrina, Vasopressina e Midazolam abaixo de 20%.',
          'Para a UTI, isso é uma situação de risco gravíssimo!',
        ],
        choices: [
          {
            text: 'Vou fazer o levantamento e autorizar compra emergencial.',
            tooltip: 'Gestão ativa de estoque farmacêutico',
            effect: (s) => ({ prestige: s.prestige + 25 }),
            missionEffect: 'estoque_farmacia:start',
          },
          {
            text: 'Quais critérios definem o ponto de ressuprimento?',
            effect: (s) => ({ prestige: s.prestige + 15 }),
            missionEffect: 'estoque_farmacia:start',
          },
        ],
      },
      {
        id: 'reconciliacao_intro',
        condition: (s) => s.completedMissions.includes('estoque_farmacia') && !s.missionProgress['reconciliacao_medicamentosa'],
        text: [
          'Obrigado pela agilidade no estoque!',
          'Agora preciso de apoio para implementar a Reconciliação Medicamentosa.',
          'É requisito da ONA e reduz eventos adversos em 70%!',
        ],
        choices: [
          {
            text: 'Vamos começar pelo PS e UTI, que são áreas críticas.',
            effect: (s) => ({ prestige: s.prestige + 40 }),
            missionEffect: 'reconciliacao_medicamentosa:start',
          },
        ],
      },
      {
        id: 'idle',
        text: [
          'A farmácia agora tem rastreabilidade total dos medicamentos!',
          'Use-me como referência em dúvidas de fármacos.',
        ],
        choices: [{ text: 'Ótimo trabalho, João!' }],
      },
    ],
    dialoguePools: [
      [{
        id: 'pool1_joao',
        text: [
          'Precisamos revisar o estoque de medicamentos da UTI.',
          'Temos itens A, B e C com perfis de custo e giro muito diferentes.',
          'Qual metodologia de gestão de estoque é mais indicada? (Kurcgant cap.12)',
        ],
        choices: [
          { text: 'Curva ABC: itens A = 80% do custo (controle rigoroso), B = 15%, C = 5% (controle menor).', correct: true, tooltip: 'Curva ABC — ferramenta padrão de gestão de materiais hospitalares', feedback: 'Excelente! A Curva ABC é a principal ferramenta de gestão de estoque em saúde. Itens A exigem controle diário, B semanal, C mensal. (Kurcgant, 2016 cap.12)', effect: (s) => ({ prestige: s.prestige + 28 }) },
          { text: 'Comprar em grande quantidade para garantir estoque de 6 meses e evitar falta.', correct: false, feedback: 'Incorreto. Estoques excessivos geram custos de armazenamento, vencimento e capital imobilizado. (Kurcgant cap.12)', effect: (s) => ({ prestige: s.prestige + 3 }) },
          { text: 'Priorizar os medicamentos mais utilizados pelos médicos, independente do custo.', correct: false, feedback: 'Incompleto. O uso sem análise de custo-efetividade não é gestão racional de recursos. (Kurcgant cap.14)', effect: (s) => ({ prestige: s.prestige + 5 }) },
          { text: 'Terceirizar todo o estoque para uma empresa de logística hospitalar.', correct: false, feedback: 'Pode ser uma solução, mas não substitui o conhecimento do método ABC para controle e rastreabilidade.', effect: (s) => ({ prestige: s.prestige + 1 }) },
        ],
      }],
      [{
        id: 'pool2_joao',
        text: [
          'Um paciente chegou da enfermaria usando 12 medicamentos crônicos diferentes.',
          'Na admissão, o prescritor só registrou 7 no sistema hospitalar.',
          'O que o protocolo de Reconciliação Medicamentosa determina fazer?',
        ],
        choices: [
          { text: 'Obter a lista completa de medicamentos do paciente (anamnese farmacológica) e reconciliar com a prescrição hospitalar.', correct: true, tooltip: 'OMS — 5ª Meta Internacional: reconciliação medicamentosa', feedback: 'Correto! A Reconciliação Medicamentosa é a 3ª Meta da OMS para Segurança do Paciente. Previne até 70% dos erros na transição do cuidado. (Kurcgant cap.6)', effect: (s) => ({ prestige: s.prestige + 30 }) },
          { text: 'Suspender todos os medicamentos crônicos durante a internação para evitar interações.', correct: false, feedback: 'Perigoso! Suspensão abrupta pode causar síndrome de abstinência, descompensação de doenças crônicas.', effect: (s) => ({ prestige: s.prestige - 5 }) },
          { text: 'Manter apenas os 7 medicamentos registrados e documentar que o paciente não soube informar os demais.', correct: false, feedback: 'Incorreto. O farmacêutico deve investigar ativamente a lista completa em múltiplas fontes.', effect: (s) => ({ prestige: s.prestige + 0 }) },
          { text: 'Encaminhar para o médico decidir quais medicamentos manter sem levantamento ativo.', correct: false, feedback: 'Incompleto. A reconciliação ativa é responsabilidade multiprofissional — farmácia e enfermagem atuam juntos.', effect: (s) => ({ prestige: s.prestige + 4 }) },
        ],
      }],
      [{
        id: 'pool3_joao',
        text: [
          'A equipe de enfermagem quer guardar medicamentos vasoativos na gaveta da enfermaria.',
          'Qual é a regulamentação sobre armazenamento de medicamentos de alta vigilância?',
          '(Kurcgant cap.12 — Gestão de Recursos Materiais)',
        ],
        choices: [
          { text: 'Medicamentos de alta vigilância devem ficar em área controlada, com dupla checagem de acesso e identificação especial — não em gaveta aberta.', correct: true, tooltip: 'ANVISA/ISMP — medicamentos de alta vigilância exigem barreiras de segurança', feedback: 'Perfeito! O ISMP Brasil e a ANVISA exigem que medicamentos de alta vigilância (vasoativos, eletrólitos concentrados, insulina) tenham controle especial de acesso e identificação diferenciada. (Kurcgant cap.12)', effect: (s) => ({ prestige: s.prestige + 28 }) },
          { text: 'Não há restrição específica; basta manter o frasco com rótulo correto.', correct: false, feedback: 'Incorreto. Medicamentos de alta vigilância têm regulamentação específica do ISMP para prevenção de erros graves.', effect: (s) => ({ prestige: s.prestige - 3 }) },
          { text: 'Podem ficar na gaveta desde que a chave esteja com o enfermeiro responsável.', correct: false, feedback: 'Insuficiente. A chave com o enfermeiro não basta — são necessárias barreiras de dupla checagem e identificação visual especial.', effect: (s) => ({ prestige: s.prestige + 3 }) },
          { text: 'Guardar em geladeira separada é suficiente para qualquer medicamento de risco.', correct: false, feedback: 'Incompleto. Refrigeração é necessária para alguns, mas não substitui os protocolos de alta vigilância do ISMP.', effect: (s) => ({ prestige: s.prestige + 2 }) },
        ],
      }],
    ],
  },
  {
    id: 'tec_laboratorio',
    name: 'Tec. Renata',
    title: 'Técnica de Laboratório',
    role: 'technician',
    spriteKey: 'npc_renata',
    startCol: 43, startRow: 7,
    bodyColor: 0xffffff, coatColor: 0x3498db, hairColor: 0x8b4513, skinColor: 0xf0d5b0,
    patrolPoints: [
      { col: 43, row: 7 }, { col: 40, row: 7 }, { col: 40, row: 11 }, { col: 46, row: 11 },
    ],
    schedule: [
      { hour: 7, col: 43, row: 7 }, { hour: 15, col: 43, row: 11 },
    ],
    missionIds: ['resultados_criticos', 'coleta_sistematizada'],
    dialogues: [
      {
        id: 'criticos_intro',
        condition: (s) => !s.missionProgress['resultados_criticos'],
        text: [
          'Bom dia! Temos um problema sério com comunicação de resultados críticos.',
          'Os enfermeiros às vezes demoram horas para receber resultados urgentes.',
          'Precisamos de um protocolo de valores críticos com o LACP.',
        ],
        choices: [
          {
            text: 'Vamos criar um fluxo de comunicação imediata de valores críticos.',
            tooltip: 'Protocolo de valores críticos é requisito da acreditação',
            effect: (s) => ({ prestige: s.prestige + 30 }),
            missionEffect: 'resultados_criticos:start',
          },
        ],
      },
      {
        id: 'coleta_intro',
        condition: (s) => s.completedMissions.includes('resultados_criticos') && !s.missionProgress['coleta_sistematizada'],
        text: [
          'Protocolo de valores críticos funcionando bem!',
          'Agora precisamos padronizar a coleta de sangue nos leitos.',
          'Muitos tubos chegam sem identificação correta.',
        ],
        choices: [
          {
            text: 'Vou treinar a equipe de enfermagem sobre coleta correta.',
            effect: (s) => ({ prestige: s.prestige + 25 }),
            missionEffect: 'coleta_sistematizada:start',
          },
        ],
      },
      {
        id: 'idle',
        text: [
          'O laboratório está com tempo de entrega muito melhor!',
          'Identificação correta do paciente é vital na coleta.',
        ],
        choices: [{ text: 'Continue esse excelente trabalho!' }],
      },
    ],
    dialoguePools: [
      [{
        id: 'pool1_renata',
        text: [
          'Chegou um resultado de potássio = 6,8 mEq/L de um paciente da UTI.',
          'O enfermeiro de plantão não foi avisado ainda — já passaram 45 minutos.',
          'O que o protocolo de valores críticos determina nesta situação?',
        ],
        choices: [
          { text: 'Comunicação imediata (< 30 min) ao enfermeiro/médico responsável, com registro documentado do horário e nome de quem recebeu.', correct: true, tooltip: 'JCI/ONA: comunicação de valores críticos em até 30 minutos', feedback: 'Correto! Potássio 6,8 é criticamente alto (risco de PCR). A JCI e ONA exigem comunicação ativa em < 30 min com documentação completa. (Kurcgant cap.6)', effect: (s) => ({ prestige: s.prestige + 30 }) },
          { text: 'Registrar no sistema e aguardar o enfermeiro verificar no próximo acesso.', correct: false, feedback: 'Perigoso! Potássio 6,8 pode causar arritmia fatal em minutos. O contato ativo e imediato é mandatório.', effect: (s) => ({ prestige: s.prestige - 5 }) },
          { text: 'Ligar para o setor e deixar recado com qualquer funcionário disponível.', correct: false, feedback: 'Insuficiente. O protocolo exige confirmação de recebimento por profissional habilitado, não apenas "recado deixado".', effect: (s) => ({ prestige: s.prestige + 3 }) },
          { text: 'Enviar e-mail para o plantonista com o resultado e aguardar retorno.', correct: false, feedback: 'E-mail não garante comunicação imediata. Valores críticos exigem contato direto por telefone/pessoalmente.', effect: (s) => ({ prestige: s.prestige + 0 }) },
        ],
      }],
      [{
        id: 'pool2_renata',
        text: [
          'Três tubos chegaram sem etiqueta de identificação do paciente.',
          'A coleta foi feita pelo técnico de plantão na enfermaria.',
          'Qual é a conduta correta segundo as metas de segurança do paciente?',
        ],
        choices: [
          { text: 'Descartar os tubos e notificar a equipe para nova coleta com identificação adequada — nunca processar amostra sem identificação.', correct: true, tooltip: 'OMS 1ª Meta: identificação correta do paciente', feedback: 'Correto! A 1ª Meta da OMS para Segurança do Paciente é a identificação correta. Amostras sem ID nunca devem ser processadas — risco de trocar resultados entre pacientes. (Kurcgant cap.6)', effect: (s) => ({ prestige: s.prestige + 28 }) },
          { text: 'Processar os tubos e tentar identificar depois pelo registro da coleta.', correct: false, feedback: 'Perigoso! Processar amostra sem identificação pode gerar troca de resultados com consequências graves para o paciente.', effect: (s) => ({ prestige: s.prestige - 8 }) },
          { text: 'Telefonar para o setor e perguntar qual paciente foi coletado naquele horário.', correct: false, feedback: 'Insuficiente. A confirmação verbal não garante segurança. O protocolo exige identificação no ponto de coleta.', effect: (s) => ({ prestige: s.prestige + 4 }) },
          { text: 'Processar e colocar como "identificação pendente" no sistema até esclarecer.', correct: false, feedback: 'Incorreto. Resultados "pendentes" sem ID podem ser consultados erroneamente por outro paciente.', effect: (s) => ({ prestige: s.prestige + 1 }) },
        ],
      }],
      [{
        id: 'pool3_renata',
        text: [
          'O laboratório quer implantar um sistema informatizado de gestão de amostras.',
          'A diretora perguntou quais critérios deve considerar na escolha do sistema.',
          'Com base em Sistemas de Informação em Saúde (Kurcgant cap.7), o que é prioritário?',
        ],
        choices: [
          { text: 'Interoperabilidade com o prontuário eletrônico (integração PEP-LIS), rastreabilidade de amostras e tempo de resposta para valores críticos.', correct: true, tooltip: 'Kurcgant cap.7 — Sistemas de Informação: integração e rastreabilidade como critérios-chave', feedback: 'Excelente! A integração PEP-LIS, rastreabilidade e alertas de valores críticos são os critérios fundamentais para segurança do paciente em SIS. (Kurcgant cap.7)', effect: (s) => ({ prestige: s.prestige + 30 }) },
          { text: 'O sistema mais barato que atenda às necessidades básicas de registro.', correct: false, feedback: 'Custo é critério, mas não pode ser o único. Sistemas inadequados geram erros que custam mais que o economizado.', effect: (s) => ({ prestige: s.prestige + 2 }) },
          { text: 'O sistema mais utilizado no mercado, independente da integração com os outros sistemas.', correct: false, feedback: 'Popularidade sem integração cria ilhas de informação. A interoperabilidade é critério essencial. (Kurcgant cap.7)', effect: (s) => ({ prestige: s.prestige + 3 }) },
          { text: 'Qualquer sistema cloud é suficiente; o importante é a interface ser fácil de usar.', correct: false, feedback: 'Usabilidade é importante, mas segurança de dados, integração e conformidade com LGPD são igualmente críticos.', effect: (s) => ({ prestige: s.prestige + 1 }) },
        ],
      }],
    ],
  },
  {
    id: 'dr_radiologista',
    name: 'Dr. Farias',
    title: 'Médico Radiologista',
    role: 'doctor',
    spriteKey: 'npc_farias',
    startCol: 55, startRow: 7,
    bodyColor: 0xffffff, coatColor: 0xe8f4f8, hairColor: 0x708090, skinColor: 0xf5c5a3,
    patrolPoints: [
      { col: 55, row: 7 }, { col: 52, row: 7 }, { col: 52, row: 11 }, { col: 58, row: 11 },
    ],
    schedule: [
      { hour: 8, col: 55, row: 7 }, { hour: 17, col: 55, row: 7 },
    ],
    missionIds: ['laudo_urgente'],
    dialogues: [
      {
        id: 'laudo_intro',
        condition: (s) => !s.missionProgress['laudo_urgente'],
        text: [
          'Boa tarde. Temos acúmulo de exames aguardando laudo urgente.',
          'O fluxo de solicitação está desorganizado.',
          'Preciso que a enfermagem ajude a priorizar as solicitações críticas.',
        ],
        choices: [
          {
            text: 'Criaremos um sistema de priorização por cor de urgência.',
            effect: (s) => ({ prestige: s.prestige + 20 }),
            missionEffect: 'laudo_urgente:start',
          },
        ],
      },
      {
        id: 'idle',
        text: [
          'Com a priorização, os exames críticos saem em menos de 2 horas.',
          'A enfermagem é fundamental no fluxo diagnóstico.',
        ],
        choices: [{ text: 'Ótima parceria, doutor!' }],
      },
    ],
    dialoguePools: [
      [{
        id: 'pool1_farias',
        text: [
          'A fila de laudos de TC está com 6 horas de atraso.',
          'Um paciente com suspeita de AVC está aguardando resultado há 2 horas.',
          'Qual deve ser a prioridade segundo gestão de fluxo diagnóstico?',
        ],
        choices: [
          { text: 'Priorizar o paciente com suspeita de AVC imediatamente — janela terapêutica de 4,5 horas é crítica.', correct: true, tooltip: 'AVC: janela terapêutica de 4,5h para trombólise (SBN)', feedback: 'Correto! Em AVC isquêmico a janela é de 4,5h para trombólise. A priorização por criticidade clínica deve sobrepor a ordem de chegada. (Kurcgant cap.4)', effect: (s) => ({ prestige: s.prestige + 28 }) },
          { text: 'Seguir a ordem de chegada — qualquer exceção gera reclamação dos outros pacientes.', correct: false, feedback: 'Incorreto. A priorização clínica é eticamente mandatória. Prioridade nunca é simplesmente pela ordem de chegada.', effect: (s) => ({ prestige: s.prestige - 5 }) },
          { text: 'Contatar o médico solicitante e pedir que aguarde mais 2 horas para a fila normalizar.', correct: false, feedback: 'Perigoso! Em 2 horas a janela terapêutica do AVC pode ter encerrado. Priorize imediatamente.', effect: (s) => ({ prestige: s.prestige + 0 }) },
          { text: 'Transferir o paciente para outro hospital com tomógrafo disponível.', correct: false, feedback: 'Desnecessário se o tomógrafo está disponível. Priorize o laudo urgente e realize o exame já.', effect: (s) => ({ prestige: s.prestige + 3 }) },
        ],
      }],
      [{
        id: 'pool2_farias',
        text: [
          'Um técnico pediu para usar o TC sem EPIs adequados para "economizar tempo".',
          'Qual é a conduta correta do gerente de enfermagem sobre Gestão de Recursos Físicos?',
          '(Kurcgant cap.13 — Gestão de Recursos Físicos e Ambientais)',
        ],
        choices: [
          { text: 'Interromper o procedimento, garantir uso de EPIs e registrar a situação como potencial evento adverso.', correct: true, tooltip: 'CNEN/ANVISA: proteção radiológica é obrigatória', feedback: 'Correto! A proteção radiológica é regulamentada pela CNEN. O gerente deve garantir compliance com normas de segurança independente de "ganhar tempo". (Kurcgant cap.13)', effect: (s) => ({ prestige: s.prestige + 28 }) },
          { text: 'Permitir uma vez, mas registrar como advertência informal ao técnico.', correct: false, feedback: 'Incorreto. Exposição à radiação sem EPI é irreversível. Não há "uma vez" aceitável para este tipo de risco.', effect: (s) => ({ prestige: s.prestige - 5 }) },
          { text: 'Solicitar ao técnico que treine outros colegas sobre uso correto de EPIs.', correct: false, feedback: 'Treinamento é correto mas insuficiente agora. Primeiro interrompa a situação de risco.', effect: (s) => ({ prestige: s.prestige + 5 }) },
          { text: 'Consultar o manual do equipamento para confirmar se EPI é realmente necessário.', correct: false, feedback: 'Desnecessário. A norma CNEN é clara: EPIs são obrigatórios em área de radiação ionizante.', effect: (s) => ({ prestige: s.prestige + 2 }) },
        ],
      }],
      [{
        id: 'pool3_farias',
        text: [
          'O equipamento de ressonância está quebrado há 15 dias aguardando manutenção.',
          'Qual é a responsabilidade do enfermeiro gerente nessa situação?',
          '(Kurcgant cap.13 — Gestão de Recursos Físicos)',
        ],
        choices: [
          { text: 'Registrar o problema formalmente, notificar a direção, mapear o impacto assistencial e acompanhar o prazo de manutenção.', correct: true, tooltip: 'Gestão de recursos físicos: papel do enfermeiro gerente (Kurcgant cap.13)', feedback: 'Correto! O enfermeiro gerente é responsável por notificar, documentar e acompanhar a resolução de falhas em recursos físicos que impactam a assistência. (Kurcgant cap.13)', effect: (s) => ({ prestige: s.prestige + 25 }) },
          { text: 'Aguardar que a engenharia hospitalar resolva sozinha sem intervenção da enfermagem.', correct: false, feedback: 'Incorreto. A enfermagem gerencial deve acompanhar ativamente a resolução de falhas de equipamentos que impactam pacientes.', effect: (s) => ({ prestige: s.prestige + 0 }) },
          { text: 'Comunicar verbalmente ao chefe e continuar sem registro formal.', correct: false, feedback: 'Insuficiente. O registro formal é necessário para rastreabilidade, auditoria e responsabilidade legal.', effect: (s) => ({ prestige: s.prestige + 4 }) },
          { text: 'Comprar um novo equipamento sem passar pela direção para agilizar.', correct: false, feedback: 'Incorreto. Compras hospitalares têm fluxo de autorização específico. A aquisição independente pode configurar irregularidade.', effect: (s) => ({ prestige: s.prestige - 3 }) },
        ],
      }],
    ],
  },
  {
    id: 'diretora_alves',
    name: 'Diretora Alves',
    title: 'Diretora de Enfermagem',
    role: 'admin',
    spriteKey: 'npc_diretora',
    startCol: 67, startRow: 7,
    bodyColor: 0x2c3e50, coatColor: 0x34495e, hairColor: 0x7f8c8d, skinColor: 0xf5c5a3,
    patrolPoints: [
      { col: 67, row: 7 }, { col: 64, row: 7 }, { col: 64, row: 11 }, { col: 70, row: 11 },
    ],
    schedule: [
      { hour: 9, col: 67, row: 7 }, { hour: 14, col: 38, row: 14 }, { hour: 17, col: 67, row: 7 },
    ],
    missionIds: ['escala_plantao', 'orcamento', 'acreditacao_ona', 'pesquisa_indicadores'],
    dialogues: [
      {
        id: 'escala_intro',
        condition: (s) => !s.missionProgress['escala_plantao'],
        text: [
          'Bom dia! Seja bem-vinda ao HUAP.',
          'Sou a Diretora de Enfermagem. Temos muito trabalho pela frente.',
          'A primeira prioridade: precisamos reorganizar a escala de plantão.',
          'Temos déficit de pessoal nos turnos da tarde. Fale com a Enf. Maria.',
        ],
        choices: [
          {
            text: 'Pode contar comigo. Vou resolver a escala.',
            tooltip: 'Dimensionamento de pessoal é função do enfermeiro gerente',
            effect: (s) => ({ prestige: s.prestige + 25 }),
            missionEffect: 'escala_plantao:start',
          },
          {
            text: 'Quais são os critérios de dimensionamento vigentes?',
            tooltip: 'Boa pergunta! COFEN Res. 543/2017',
            effect: (s) => ({ prestige: s.prestige + 15 }),
            missionEffect: 'escala_plantao:start',
          },
        ],
      },
      {
        id: 'orcamento_intro',
        condition: (s) => s.completedMissions.length >= 3 && !s.missionProgress['orcamento'],
        text: [
          'Excelente progresso! Preciso de mais um favor.',
          'Os custos operacionais estão 18% acima do orçado este trimestre.',
          'Você pode coordenar a revisão dos processos em todos os setores?',
        ],
        choices: [
          {
            text: 'Claro. Vou mapear os desperdícios com análise ABC.',
            effect: (s) => ({ prestige: s.prestige + 40 }),
            missionEffect: 'orcamento:start',
          },
        ],
      },
      {
        id: 'acreditacao_intro',
        condition: (s) => s.completedMissions.length >= 6 && !s.missionProgress['acreditacao_ona'],
        text: [
          'A ONA fará visita de acreditação em 60 dias!',
          'Precisamos organizar toda a documentação, protocolos e indicadores.',
          'Isso é crucial para o futuro do HUAP como hospital de ensino.',
        ],
        choices: [
          {
            text: 'Vou liderar a preparação. Começamos pela UTI e PS.',
            effect: (s) => ({ prestige: s.prestige + 60 }),
            missionEffect: 'acreditacao_ona:start',
          },
        ],
      },
      {
        id: 'idle',
        text: [
          'Continue o excelente trabalho.',
          'O HUAP precisa de enfermeiras gerentes como você.',
        ],
        choices: [{ text: 'Obrigada, diretora!' }],
      },
    ],
    dialoguePools: [
      [{
        id: 'pool1_diretora',
        text: [
          'Precisamos escolher a abordagem para o planejamento estratégico do HUAP.',
          'Temos três horizontes possíveis: operacional (1 ano), tático (2-3 anos), estratégico (5 anos).',
          'Como enfermeira gerente, qual deve ser o foco prioritário agora? (Kurcgant cap.4)',
        ],
        choices: [
          { text: 'Planejamento integrado nos três horizontes, com ações imediatas alinhadas ao plano estratégico de longo prazo.', correct: true, tooltip: 'Kurcgant cap.4: planejamento em múltiplos horizontes temporais integrados', feedback: 'Excelente! O planejamento eficaz articula os três horizontes. Ações operacionais devem ser coerentes com o plano estratégico. (Kurcgant, 2016 cap.4)', effect: (s) => ({ prestige: s.prestige + 35 }) },
          { text: 'Focar apenas no plano operacional — problemas diários são mais urgentes que metas de 5 anos.', correct: false, feedback: 'Visão de curto prazo isolada gera "apagão de incêndios" permanente. Sem estratégia, ações perdem coerência. (Kurcgant cap.4)', effect: (s) => ({ prestige: s.prestige + 5 }) },
          { text: 'Aguardar o planejamento da diretoria antes de tomar qualquer decisão.', correct: false, feedback: 'Passividade gerencial. O enfermeiro gerente participa ativamente do planejamento, não apenas executa. (Kurcgant cap.4)', effect: (s) => ({ prestige: s.prestige + 2 }) },
          { text: 'Contratar consultoria externa para elaborar o plano estratégico completo.', correct: false, feedback: 'Consultoria pode apoiar, mas o planejamento deve ser participativo — construído com a equipe interna. (Kurcgant cap.4)', effect: (s) => ({ prestige: s.prestige + 3 }) },
        ],
      }],
      [{
        id: 'pool2_diretora',
        text: [
          'A cultura organizacional do HUAP mostra resistência a mudanças.',
          'Como gerente você quer implementar novos protocolos, mas a equipe resiste.',
          'Qual abordagem de gestão da mudança é mais eficaz? (Kurcgant cap.1)',
        ],
        choices: [
          { text: 'Envolver a equipe no diagnóstico e construção da mudança, legitimando o processo com os próprios trabalhadores.', correct: true, tooltip: 'Kurcgant cap.1: cultura organizacional e gestão participativa da mudança', feedback: 'Perfeito! Mudanças sustentáveis são construídas com participação da equipe. A resistência é menor quando os trabalhadores se sentem coautores. (Kurcgant cap.1)', effect: (s) => ({ prestige: s.prestige + 35 }) },
          { text: 'Implementar as mudanças de forma mandatória com apoio da diretoria.', correct: false, feedback: 'Implementação autoritária gera resistência passiva e boicote velado. A adesão precisa ser conquistada. (Kurcgant cap.1)', effect: (s) => ({ prestige: s.prestige + 5 }) },
          { text: 'Aguardar que a equipe amadureça e aceite as mudanças naturalmente.', correct: false, feedback: 'Passividade. Mudanças positivas exigem liderança ativa — não acontecem espontaneamente. (Kurcgant cap.1)', effect: (s) => ({ prestige: s.prestige + 0 }) },
          { text: 'Substituir os profissionais que resistem à mudança por outros mais receptivos.', correct: false, feedback: 'Extremo e contraproducente. Substituição sem gestão do processo perpetua a cultura resistente. (Kurcgant cap.1)', effect: (s) => ({ prestige: s.prestige - 5 }) },
        ],
      }],
      [{
        id: 'pool3_diretora',
        text: [
          'Os custos operacionais do hospital subiram 22% este trimestre.',
          'A diretoria pede corte de 15% nos gastos de enfermagem.',
          'Como gerente, como você aborda o corte sem comprometer a assistência? (Kurcgant cap.14)',
        ],
        choices: [
          { text: 'Mapear custos fixos e variáveis, identificar desperdícios com custo-benefício, propor cortes nos processos — nunca no dimensionamento mínimo de pessoal.', correct: true, tooltip: 'Kurcgant cap.14: gestão de custos em enfermagem — análise antes do corte', feedback: 'Excelente! A análise de custos (Kurcgant cap.14) exige identificação de desperdícios e não pode comprometer o dimensionamento mínimo seguro de pessoal (COFEN 543/2017).', effect: (s) => ({ prestige: s.prestige + 38 }) },
          { text: 'Cortar horas extras e contratos temporários imediatamente para atingir a meta de 15%.', correct: false, feedback: 'Cortar pessoal sem análise pode aumentar eventos adversos e no longo prazo custar mais com complicações.', effect: (s) => ({ prestige: s.prestige + 5 }) },
          { text: 'Recusar o corte alegando que qualquer redução é perigosa para os pacientes.', correct: false, feedback: 'Recusar sem análise é irresponsável. O gerente deve apresentar alternativas fundamentadas, não apenas recusar.', effect: (s) => ({ prestige: s.prestige + 3 }) },
          { text: 'Reduzir insumos e materiais de proteção para cumprir a meta rapidamente.', correct: false, feedback: 'Reduzir EPIs e materiais de proteção aumenta infecções e eventos adversos, gerando custo muito maior. (ANVISA)', effect: (s) => ({ prestige: s.prestige - 8 }) },
        ],
      }],
    ],
  },
  {
    id: 'tec_rosa_cme',
    name: 'Tec. Rosa',
    title: 'Supervisora da CME',
    role: 'technician',
    spriteKey: 'npc_rosa',
    startCol: 5, startRow: 21,
    bodyColor: 0xffffff, coatColor: 0xe0e4ec, hairColor: 0x4a3728, skinColor: 0xd4a574,
    patrolPoints: [
      { col: 5, row: 21 }, { col: 3, row: 21 }, { col: 3, row: 24 }, { col: 8, row: 24 },
    ],
    schedule: [
      { hour: 7, col: 5, row: 21 }, { hour: 15, col: 5, row: 21 },
    ],
    missionIds: ['cme_protocolo', 'rastreabilidade_esterilizacao'],
    dialogues: [
      {
        id: 'cme_intro',
        condition: (s) => !s.missionProgress['cme_protocolo'],
        text: [
          'Oi! Temos problema com o controle de materiais na CME.',
          'Os kits cirúrgicos não estão sendo rastreados corretamente.',
          'Isso viola a RDC 15/2012 da ANVISA!',
        ],
        choices: [
          {
            text: 'Vamos implantar o sistema de rastreabilidade por lote agora.',
            tooltip: 'RDC 15/2012: obrigatoriedade de rastreabilidade na CME',
            effect: (s) => ({ prestige: s.prestige + 35 }),
            missionEffect: 'cme_protocolo:start',
          },
        ],
      },
      {
        id: 'idle',
        text: [
          'A rastreabilidade da CME é uma questão de segurança do paciente!',
          'Material mal esterilizado causa infecções graves.',
        ],
        choices: [{ text: 'Trabalho essencial, Rosa!' }],
      },
    ],
    dialoguePools: [
      [{
        id: 'pool1_rosa',
        text: [
          'Encontramos uma caixa de pinças cirúrgicas com embalagem violada no armário.',
          'A cirurgia está marcada daqui a 1 hora e o material já foi separado.',
          'O que determina a RDC 15/2012 da ANVISA nesta situação?',
        ],
        choices: [
          { text: 'Devolver o material para reprocessamento imediato — embalagem violada = material não estéril, independente do prazo da cirurgia.', correct: true, tooltip: 'RDC 15/2012: integridade da embalagem = garantia de esterilidade', feedback: 'Correto! A RDC 15/2012 é clara: a integridade da embalagem é garantia de esterilidade. Material com embalagem violada deve ser reprocessado sem exceção. (Kurcgant cap.12)', effect: (s) => ({ prestige: s.prestige + 32 }) },
          { text: 'Usar o material nessa cirurgia e reforçar a vigilância pós-operatória para infecção.', correct: false, feedback: 'Perigoso! Usar material de esterilidade incerta é risco grave de infecção cirúrgica. A RDC 15/2012 não permite exceções.', effect: (s) => ({ prestige: s.prestige - 10 }) },
          { text: 'Limpar a embalagem com álcool 70% e avaliar visualmente se o material parece íntegro.', correct: false, feedback: 'Incorreto. Álcool na embalagem não reestabelece esterilidade. A RDC é clara: embalagem violada = reprocessamento.', effect: (s) => ({ prestige: s.prestige - 5 }) },
          { text: 'Adiar a cirurgia por 24 horas para aguardar novo material.', correct: false, feedback: 'Desnecessário se houver material de reserva. Acione o estoque de reserva ou realize reprocessamento emergencial.', effect: (s) => ({ prestige: s.prestige + 5 }) },
        ],
      }],
      [{
        id: 'pool2_rosa',
        text: [
          'A CME quer implantar rastreabilidade por código de barras em todos os instrumentais.',
          'Qual é o critério mínimo de rastreabilidade exigido pela RDC 15/2012?',
          '(Kurcgant cap.12 — Gestão de Recursos Materiais)',
        ],
        choices: [
          { text: 'Identificar o lote de esterilização, o equipamento usado, o operador, a data/hora e o destino de cada item processado.', correct: true, tooltip: 'RDC 15/2012: rastreabilidade completa do processo de esterilização', feedback: 'Perfeito! A RDC 15/2012 exige rastreabilidade completa: lote, autoclave, operador, data e destino. O código de barras facilita, mas o conteúdo mínimo é regulamentado.', effect: (s) => ({ prestige: s.prestige + 30 }) },
          { text: 'Registrar apenas o tipo de material e a data de esterilização.', correct: false, feedback: 'Insuficiente. Sem identificar o equipamento e operador, não é possível rastrear falhas em caso de infecção.', effect: (s) => ({ prestige: s.prestige + 3 }) },
          { text: 'Não há obrigatoriedade — rastreabilidade é recomendação, não exigência legal.', correct: false, feedback: 'Incorreto. A RDC 15/2012 da ANVISA tem força de lei e exige rastreabilidade do processo de esterilização.', effect: (s) => ({ prestige: s.prestige - 3 }) },
          { text: 'Guardar as embalagens usadas por 30 dias como evidência do processo.', correct: false, feedback: 'Insuficiente. Guardar embalagem não substitui o registro formal de rastreabilidade exigido pela RDC 15/2012.', effect: (s) => ({ prestige: s.prestige + 2 }) },
        ],
      }],
      [{
        id: 'pool3_rosa',
        text: [
          'O autoclave da CME reprovnou no teste Bowie-Dick esta manhã.',
          'Há 40 pacientes cirúrgicos marcados para hoje.',
          'Qual é a conduta imediata correta?',
        ],
        choices: [
          { text: 'Interditar o autoclave, acionar manutenção imediatamente, notificar o CC e verificar material esterilizado no turno anterior para rastreamento.', correct: true, tooltip: 'Teste Bowie-Dick negativo = autoclave interditado imediatamente (RDC 15/2012)', feedback: 'Correto! Falha no Bowie-Dick indica problemas de remoção de ar — compromete esterilização. Interdição imediata e rastreamento retroativo são obrigatórios. (RDC 15/2012)', effect: (s) => ({ prestige: s.prestige + 35 }) },
          { text: 'Repetir o teste Bowie-Dick mais uma vez antes de tomar qualquer decisão.', correct: false, feedback: 'Não se repete Bowie-Dick para "confirmar". Falha = interdição imediata. Uma segunda falha só adiciona atraso perigoso.', effect: (s) => ({ prestige: s.prestige + 5 }) },
          { text: 'Continuar usando o autoclave e comunicar a falha apenas ao final do dia.', correct: false, feedback: 'Perigoso! Material processado em autoclave com falha não é confiável. Todas as cirurgias estariam em risco.', effect: (s) => ({ prestige: s.prestige - 15 }) },
          { text: 'Usar esterilização a frio com glutaraldeído para todos os materiais do dia.', correct: false, feedback: 'Glutaraldeído não substitui vapor para todos os materiais e tem restrições da ANVISA. Acione contingência planejada.', effect: (s) => ({ prestige: s.prestige + 2 }) },
        ],
      }],
    ],
  },
  {
    id: 'nutricionista_clara',
    name: 'Nutr. Clara',
    title: 'Nutricionista Clínica',
    role: 'other',
    spriteKey: 'npc_clara',
    startCol: 16, startRow: 21,
    bodyColor: 0xffffff, coatColor: 0xfde68a, hairColor: 0xd4a017, skinColor: 0xf5c5a3,
    patrolPoints: [
      { col: 16, row: 21 }, { col: 13, row: 21 }, { col: 13, row: 24 }, { col: 20, row: 24 },
    ],
    schedule: [
      { hour: 7, col: 16, row: 21 }, { hour: 12, col: 16, row: 21 },
    ],
    missionIds: ['terapia_nutricional', 'protocolo_dieta'],
    dialogues: [
      {
        id: 'nutricao_intro',
        condition: (s) => !s.missionProgress['terapia_nutricional'],
        text: [
          'Bom dia! Você é a nova gerente de enfermagem?',
          'Precisamos urgente do protocolo de Terapia Nutricional na UTI.',
          'Muitos pacientes estão sem nutrição adequada nos primeiros 3 dias!',
        ],
        choices: [
          {
            text: 'Vamos implementar o protocolo ASPEN de nutrição enteral precoce.',
            tooltip: 'ASPEN: início em 24-48h para pacientes críticos',
            effect: (s) => ({ prestige: s.prestige + 30, energy: Math.min(s.energy + 10, 100) }),
            missionEffect: 'terapia_nutricional:start',
          },
        ],
      },
      {
        id: 'idle',
        text: [
          'A nutrição adequada reduz complicações e tempo de internação!',
          'Descanse um pouco — a copa está sempre disponível.',
        ],
        choices: [{ text: 'Obrigada, Clara! Boa dica.' }],
      },
    ],
    dialoguePools: [
      [{
        id: 'pool1_clara',
        text: [
          'Paciente crítico, 72h de internação na UTI, ainda sem dieta por ordem médica.',
          'O residente disse que vai "aguardar a estabilização hemodinâmica" antes de nutrir.',
          'Qual é a recomendação baseada em evidências para nutrição em terapia intensiva?',
        ],
        choices: [
          { text: 'Iniciar nutrição enteral precoce em 24–48h mesmo em pacientes com instabilidade hemodinâmica relativa, conforme ASPEN/ESPEN.', correct: true, tooltip: 'ASPEN/ESPEN: nutrição enteral precoce em 24-48h reduz mortalidade e complicações', feedback: 'Correto! As diretrizes ASPEN (2016) e ESPEN recomendam nutrição enteral em 24–48h. Esperar "estabilização completa" aumenta catabolismo e piora desfechos. (Kurcgant cap.9 — equipe multiprofissional)', effect: (s) => ({ prestige: s.prestige + 30, energy: Math.min((s as any).energy + 5, 100) }) },
          { text: 'Aguardar 5–7 dias para iniciar dieta parenteral total como estratégia mais segura.', correct: false, feedback: 'Incorreto. Jejum prolongado é danoso. Nutrição enteral é preferida à parenteral sempre que houver trato funcionante.', effect: (s) => ({ prestige: s.prestige + 2 }) },
          { text: 'Não intervir — a decisão de nutrir é exclusivamente médica, enfermagem não tem papel.', correct: false, feedback: 'Incorreto. A terapia nutricional é decisão multiprofissional. Enfermagem e nutrição têm papel ativo na equipe de EMTN.', effect: (s) => ({ prestige: s.prestige + 0 }) },
          { text: 'Iniciar nutrição oral, pois é mais fisiológica e o paciente deve se alimentar normalmente.', correct: false, feedback: 'Paciente crítico entubado não pode receber nutrição oral. Enteral por sonda é a via indicada.', effect: (s) => ({ prestige: s.prestige + 2 }) },
        ],
      }],
      [{
        id: 'pool2_clara',
        text: [
          'A triagem nutricional identificou 60% dos pacientes internados com risco nutricional.',
          'Qual instrumento validado é mais adequado para triagem nutricional em adultos hospitalizados?',
          '(Kurcgant cap.9 — Equipe Multiprofissional)',
        ],
        choices: [
          { text: 'NRS-2002 (Nutritional Risk Screening) — validado especificamente para pacientes hospitalizados adultos.', correct: true, tooltip: 'NRS-2002: ferramenta recomendada pela ESPEN para triagem hospitalar', feedback: 'Excelente! O NRS-2002 é o instrumento recomendado pela ESPEN para triagem nutricional hospitalar em adultos. O MNA é para idosos e o MUST para ambientes gerais. (ESPEN 2017)', effect: (s) => ({ prestige: s.prestige + 28 }) },
          { text: 'IMC abaixo de 18,5 — critério simples e acessível para qualquer equipe.', correct: false, feedback: 'IMC isolado é insuficiente para triagem nutricional hospitalar. Não avalia dinamismo do quadro clínico.', effect: (s) => ({ prestige: s.prestige + 3 }) },
          { text: 'MNA (Mini Nutritional Assessment) — ferramenta universal para qualquer paciente.', correct: false, feedback: 'O MNA é validado especificamente para idosos. Para adultos hospitalizados em geral, use o NRS-2002.', effect: (s) => ({ prestige: s.prestige + 5 }) },
          { text: 'Albumina sérica abaixo de 3g/dL como único critério de risco nutricional.', correct: false, feedback: 'Albumina é marcador inflamatório — em infecção aguda cai por redistribuição, não por desnutrição. Não é critério isolado.', effect: (s) => ({ prestige: s.prestige + 2 }) },
        ],
      }],
      [{
        id: 'pool3_clara',
        text: [
          'O médico prescreveu dieta parenteral total para um paciente com abdome funcionante.',
          'Como membro da EMTN (Equipe de Terapia Nutricional), qual é sua responsabilidade?',
          '(Kurcgant cap.9 — Trabalho em Equipe Multiprofissional)',
        ],
        choices: [
          { text: 'Levar o caso à EMTN, apresentar evidências de que nutrição enteral é preferível e propor mudança de conduta fundamentada.', correct: true, tooltip: 'EMTN: decisão multiprofissional baseada em evidências (RDC 63/2000)', feedback: 'Correto! A RDC 63/2000 da ANVISA regulamenta a EMTN. Decisões nutricionais devem ser multiprofissionais e baseadas em evidências. O profissional de saúde deve contestar condutas inadequadas. (Kurcgant cap.9)', effect: (s) => ({ prestige: s.prestige + 30 }) },
          { text: 'Aceitar a prescrição médica sem questionar — hierarquia deve ser respeitada.', correct: false, feedback: 'Incorreto. Hierarquia não justifica silêncio diante de condutas que prejudicam o paciente. A EMTN é espaço de decisão colegiada.', effect: (s) => ({ prestige: s.prestige - 5 }) },
          { text: 'Não preparar a nutrição parenteral como forma de protesto silencioso.', correct: false, feedback: 'Recusa sem comunicação é abandono. O correto é comunicar o questionamento formalmente na EMTN.', effect: (s) => ({ prestige: s.prestige - 8 }) },
          { text: 'Instalar a parenteral e registrar no prontuário que foi contra a conduta.', correct: false, feedback: 'Registro de discordância é importante, mas insuficiente. O questionamento deve ser feito antes da administração, não depois.', effect: (s) => ({ prestige: s.prestige + 5 }) },
        ],
      }],
    ],
  },
  {
    id: 'enf_maria',
    name: 'Enf. Maria',
    title: 'Supervisora de Enfermagem',
    role: 'nurse',
    spriteKey: 'npc_maria',
    startCol: 63, startRow: 21,
    bodyColor: 0xffffff, coatColor: 0xa7f3d0, hairColor: 0x2c1810, skinColor: 0xf5c5a3,
    patrolPoints: [
      { col: 63, row: 21 }, { col: 60, row: 21 }, { col: 60, row: 24 }, { col: 66, row: 24 },
    ],
    schedule: [
      { hour: 7, col: 63, row: 21 }, { hour: 14, col: 63, row: 21 },
    ],
    missionIds: ['escala_plantao', 'ronda_enfermaria', 'capacitacao_sae', 'passagem_plantao'],
    dialogues: [
      {
        id: 'escala_help',
        condition: (s) => s.missionProgress['escala_plantao'] === 1,
        text: [
          'Estava esperando por você! Temos 7 enfermeiros disponíveis amanhã.',
          'Mas 3 precisam de folga compensatória por horas extras acumuladas.',
          'E 2 estão em período de plantão noturno seguido — risco de erro!',
          'Como quer organizar a escala dentro da Resolução COFEN 543/2017?',
        ],
        choices: [
          {
            text: 'Priorizar os que têm mais horas extras acumuladas para folga.',
            tooltip: 'Princípio de equidade na gestão de escala (Kurcgant)',
            effect: (s) => ({ prestige: s.prestige + 45 }),
            missionEffect: 'escala_plantao:complete',
          },
          {
            text: 'Seguir critério de antiguidade como regra geral.',
            effect: (s) => ({ prestige: s.prestige + 25 }),
            missionEffect: 'escala_plantao:complete',
          },
        ],
      },
      {
        id: 'ronda_intro',
        condition: (s) => !s.missionProgress['ronda_enfermaria'],
        text: [
          'A ronda de enfermagem está atrasada hoje.',
          'Os 28 pacientes da Enfermaria Clínica precisam de avaliação sistemática.',
          'Sem ronda estruturada, aumenta risco de eventos adversos.',
        ],
        choices: [
          {
            text: 'Vamos fazer a ronda agora com protocolo de SOAP.',
            tooltip: 'Ronda estruturada reduz eventos adversos em 30%',
            effect: (s) => ({ prestige: s.prestige + 30, energy: Math.max(s.energy - 15, 0) }),
            missionEffect: 'ronda_enfermaria:complete',
          },
          {
            text: 'Em breve. Estou resolvendo outra situação urgente.',
            effect: (s) => ({ prestige: s.prestige + 5, stress: s.stress + 10 }),
          },
        ],
      },
      {
        id: 'capacitacao_intro',
        condition: (s) => s.completedMissions.length >= 3 && !s.missionProgress['capacitacao_sae'],
        text: [
          'A equipe precisa muito de capacitação em SAE (Sistematização da Assistência).',
          'A implementação do Processo de Enfermagem é obrigatória pelo COFEN.',
          'Você pode coordenar um treinamento para as equipes do HUAP?',
        ],
        choices: [
          {
            text: 'Sim! Vou organizar para próxima semana com apoio do HU.',
            tooltip: 'SAE: Lei 7.498/86 e Resolução COFEN 358/2009',
            effect: (s) => ({ prestige: s.prestige + 40 }),
            missionEffect: 'capacitacao_sae:start',
          },
        ],
      },
      {
        id: 'idle',
        text: [
          'O plantão está bem organizado hoje. Obrigada!',
          'A comunicação entre turnos é a base da segurança.',
        ],
        choices: [{ text: 'Boa gestão, Maria!' }],
      },
    ],
    dialoguePools: [
      [{
        id: 'pool1_maria',
        text: [
          'Precisamos calcular o dimensionamento de pessoal para a Enfermaria Clínica.',
          '28 leitos, SCP médio = 18,2 pontos/paciente/dia, índice de segurança técnica 15%.',
          'Usando a metodologia de Gaidzinski, qual é o total de profissionais necessários? (Kurcgant cap.10)',
        ],
        choices: [
          { text: 'Calcular: horas necessárias = (pontos × fator de complexidade) ÷ horas diárias × IST. O cálculo deve contemplar coberturas de folgas e férias.', correct: true, tooltip: 'Gaidzinski (1998) — metodologia padrão de dimensionamento de enfermagem no Brasil (Kurcgant cap.10)', feedback: 'Excelente! A metodologia de Gaidzinski (1998) é a referência para dimensionamento de enfermagem no Brasil, adaptada pela Resolução COFEN 543/2017. IST de 15% cobre ausenteísmo. (Kurcgant, 2016 cap.10)', effect: (s) => ({ prestige: s.prestige + 35 }) },
          { text: 'Calcular 1 técnico para cada 4 pacientes e 1 enfermeiro para cada 8 — regra simples e prática.', correct: false, feedback: 'Regra simplificada não considera carga de trabalho real. O COFEN exige cálculo pelo SCP para validar o dimensionamento. (COFEN 543/2017)', effect: (s) => ({ prestige: s.prestige + 5 }) },
          { text: 'Basear no número de funcionários disponíveis e ajustar conforme necessidade diária.', correct: false, feedback: 'Incorreto. O dimensionamento baseado na disponibilidade — não na necessidade — perpetua déficits estruturais.', effect: (s) => ({ prestige: s.prestige + 2 }) },
          { text: 'Usar o número de funcionários do mês anterior como referência, ajustando por férias.', correct: false, feedback: 'Método inaceitável. Referência histórica sem análise de carga de trabalho não reflete a necessidade real.', effect: (s) => ({ prestige: s.prestige + 0 }) },
        ],
      }],
      [{
        id: 'pool2_maria',
        text: [
          'Duas enfermeiras do plantão estão em conflito aberto — afetando a equipe toda.',
          'Uma acusa a outra de não dividir as atividades de forma equitativa.',
          'Como supervisora de enfermagem, qual é a sua abordagem? (Kurcgant cap.5)',
        ],
        choices: [
          { text: 'Realizar mediação individual com cada parte, levantar os fatos objetivamente e depois promover reunião conjunta com foco em solução, não em culpa.', correct: true, tooltip: 'Kurcgant cap.5 — Negociação e Gestão de Conflitos: mediação estruturada', feedback: 'Correto! A mediação estruturada (individual → conjunta) é a estratégia mais eficaz para conflitos interpessoais. Foco na solução e comunicação não-violenta. (Kurcgant cap.5)', effect: (s) => ({ prestige: s.prestige + 32 }) },
          { text: 'Reunir as duas ao mesmo tempo e exigir que se entendam imediatamente.', correct: false, feedback: 'Reunião conjunta sem preparo individual frequentemente escala o conflito. Ouça cada parte separadamente primeiro.', effect: (s) => ({ prestige: s.prestige + 3 }) },
          { text: 'Ignorar o conflito — profissionais adultas devem resolver seus próprios problemas.', correct: false, feedback: 'Incorreto. Conflitos não geridos afetam a qualidade da assistência e o bem-estar da equipe. A intervenção é responsabilidade gerencial. (Kurcgant cap.5)', effect: (s) => ({ prestige: s.prestige - 5 }) },
          { text: 'Transferir a profissional mais resistente para outro setor para eliminar o conflito.', correct: false, feedback: 'Transferência sem resolução do conflito apenas desloca o problema. A mediação deve ser tentada primeiro.', effect: (s) => ({ prestige: s.prestige + 3 }) },
        ],
      }],
      [{
        id: 'pool3_maria',
        text: [
          'A equipe de enfermagem não está realizando a Sistematização da Assistência de Enfermagem (SAE) adequadamente.',
          'Os registros no prontuário estão incompletos — sem diagnósticos nem prescrições de enfermagem.',
          'Qual é o respaldo legal para exigir a implementação da SAE? (Kurcgant cap.3)',
        ],
        choices: [
          { text: 'Lei 7.498/86 (Exercício Profissional) + Resolução COFEN 358/2009 — SAE é obrigatória e privativa do enfermeiro.', correct: true, tooltip: 'Resolução COFEN 358/2009: SAE obrigatória em todas as instituições de saúde', feedback: 'Correto! A Res. COFEN 358/2009 torna a SAE obrigatória em todos os ambientes de saúde. A Lei 7.498/86 define o Processo de Enfermagem como atividade privativa do enfermeiro. (Kurcgant cap.3)', effect: (s) => ({ prestige: s.prestige + 30 }) },
          { text: 'SAE é apenas uma recomendação acadêmica — não tem força de lei obrigatória.', correct: false, feedback: 'Incorreto. A Resolução COFEN 358/2009 tem força normativa — é obrigatória. Descumpri-la sujeita a sanções éticas.', effect: (s) => ({ prestige: s.prestige - 5 }) },
          { text: 'A obrigatoriedade é da Lei 9.394/96 (LDB) — responsabilidade das escolas de enfermagem.', correct: false, feedback: 'Incorreto. A LDB trata de educação, não da prática profissional. O respaldo é a Lei 7.498/86 e Res. COFEN 358/2009.', effect: (s) => ({ prestige: s.prestige + 0 }) },
          { text: 'Cada hospital decide se implementa SAE conforme suas necessidades e cultura organizacional.', correct: false, feedback: 'Incorreto. A COFEN 358/2009 é clara: SAE é obrigatória independente das preferências institucionais.', effect: (s) => ({ prestige: s.prestige - 2 }) },
        ],
      }],
    ],
  },
  {
    id: 'dr_oliveira',
    name: 'Dr. Oliveira',
    title: 'Médico Chefe da UTI',
    role: 'doctor',
    spriteKey: 'npc_dr',
    startCol: 45, startRow: 21,
    bodyColor: 0xffffff, coatColor: 0xe8f4f8, hairColor: 0x4a3728, skinColor: 0xf5c5a3,
    patrolPoints: [
      { col: 45, row: 21 }, { col: 40, row: 21 }, { col: 40, row: 25 }, { col: 50, row: 25 },
    ],
    schedule: [
      { hour: 8, col: 45, row: 21 }, { hour: 14, col: 38, row: 14 },
    ],
    missionIds: ['protocolo_sepse', 'acreditacao_ona', 'indicadores_qualidade'],
    dialogues: [
      {
        id: 'protocolo_start',
        condition: (s) => s.completedMissions.includes('protocolo_sepse') && !s.missionProgress['indicadores_qualidade'],
        text: [
          'Excelente trabalho com o protocolo de sepse!',
          'Agora precisamos monitorar indicadores de qualidade da UTI.',
          'Taxa de infecção, mortalidade e tempo de ventilação mecânica.',
        ],
        choices: [
          {
            text: 'Vou criar um dashboard de indicadores com a TI.',
            effect: (s) => ({ prestige: s.prestige + 50 }),
            missionEffect: 'indicadores_qualidade:start',
          },
        ],
      },
      {
        id: 'intro',
        condition: (s) => !s.completedMissions.includes('protocolo_sepse'),
        text: [
          'Bom dia! Você deve ser a nova enfermeira gerente.',
          'A UTI do HUAP atende pacientes de altíssima complexidade.',
          'Precisamos trabalhar juntos no protocolo de sepse — é urgente!',
        ],
        choices: [
          {
            text: 'Pode contar comigo, doutor. Vamos começar!',
            effect: (s) => ({ prestige: s.prestige + 20 }),
          },
        ],
      },
      {
        id: 'idle',
        text: [
          'A UTI está bem gerenciada. Continue assim!',
          'O enfermeiro gerente é essencial na terapia intensiva.',
        ],
        choices: [{ text: 'Trabalhamos bem em equipe, doutor!' }],
      },
    ],
    dialoguePools: [
      [{
        id: 'pool1_oliveira',
        text: [
          'Vamos revisar os indicadores de qualidade da UTI este mês.',
          'A taxa de infecção de corrente sanguínea associada a cateter (ICSAC) está em 6,2/1000 cateteres-dia.',
          'Qual meta é recomendada pelos protocolos de segurança do paciente? (Kurcgant cap.6)',
        ],
        choices: [
          { text: 'Meta: < 2/1000 cateteres-dia (benchmarking NHSN/CDC). Revisar técnica de inserção, manutenção e critério de retirada do cateter.', correct: true, tooltip: 'NHSN/CDC: meta ICSAC < 2/1000 cateteres-dia em UTI', feedback: 'Correto! A meta NHSN/CDC para ICSAC em UTI é < 2/1000 cateteres-dia. Com 6,2, o setor está 3× acima do benchmark. Revisão do bundle de cateter é urgente. (Kurcgant cap.6)', effect: (s) => ({ prestige: s.prestige + 35 }) },
          { text: 'Qualquer taxa abaixo de 10/1000 é aceitável para UTI de alta complexidade.', correct: false, feedback: 'Incorreto. A meta de 10/1000 é muito acima do benchmark. A ONA e NHSN não aceitam essa margem como satisfatória.', effect: (s) => ({ prestige: s.prestige + 2 }) },
          { text: 'Indicadores de infecção hospitalar não são de responsabilidade da enfermagem, apenas da CCIH.', correct: false, feedback: 'Incorreto. Enfermagem é corresponsável pelos indicadores — a CCIH reporta, mas a prevenção é executada pela equipe assistencial.', effect: (s) => ({ prestige: s.prestige - 3 }) },
          { text: 'Taxa de 6,2 é esperada para UTI nível III — não é necessário nenhuma intervenção urgente.', correct: false, feedback: 'Errado. Toda ICSAC é potencialmente evitável. A abordagem zero-tolerância é o padrão atual de qualidade. (IHI/NHSN)', effect: (s) => ({ prestige: s.prestige + 0 }) },
        ],
      }],
      [{
        id: 'pool2_oliveira',
        text: [
          'A equipe multiprofissional da UTI está discutindo sobre o modelo de passagem de plantão.',
          'Qual método de comunicação estruturada reduz mais erros na transição de cuidados?',
          '(Kurcgant cap.9 — Trabalho em Equipe)',
        ],
        choices: [
          { text: 'SBAR (Situação, Background, Avaliação, Recomendação) — ferramenta validada internacionalmente para comunicação de alta complexidade.', correct: true, tooltip: 'SBAR: padrão internacional OMS para comunicação na passagem de plantão', feedback: 'Correto! O SBAR (ou ISBAR com Identificação) é recomendado pela OMS e Joint Commission. Reduz erros de comunicação em até 60% na passagem de plantão. (Kurcgant cap.9)', effect: (s) => ({ prestige: s.prestige + 30 }) },
          { text: 'Comunicação verbal informal entre enfermeiros é suficiente — documentação demora muito.', correct: false, feedback: 'Perigoso. Comunicação informal sem estrutura é a principal causa de eventos adversos na transição de cuidado.', effect: (s) => ({ prestige: s.prestige - 5 }) },
          { text: 'Entregar um resumo impresso e o profissional que chega lê sozinho sem discussão.', correct: false, feedback: 'Insuficiente. A troca bidirecional de informações é essencial — dúvidas devem ser esclarecidas no momento.', effect: (s) => ({ prestige: s.prestige + 3 }) },
          { text: 'Cada profissional verifica o prontuário eletrônico no início do turno sem passagem formal.', correct: false, feedback: 'O prontuário não captura situações emergentes. A passagem ativa é necessária para informações críticas recentes.', effect: (s) => ({ prestige: s.prestige + 4 }) },
        ],
      }],
      [{
        id: 'pool3_oliveira',
        text: [
          'Um familiar exige que a equipe utilize tratamento experimental não aprovado no paciente.',
          'O paciente está sedado e não pode expressar sua vontade.',
          'Qual é a conduta ético-legal correta? (Kurcgant cap.2 — Ética em Enfermagem)',
        ],
        choices: [
          { text: 'Explicar que tratamentos devem ter embasamento ético-científico, consultar o Comitê de Ética e documentar a decisão no prontuário.', correct: true, tooltip: 'Código de Ética dos Profissionais de Enfermagem (COFEN 564/2017) — autonomia e beneficência', feedback: 'Correto! O Código de Ética COFEN 564/2017 e a Resolução CFM 1.995/2012 orientam: o familiar não tem poder de exigir tratamento não-indicado. Comitê de Ética é a instância adequada. (Kurcgant cap.2)', effect: (s) => ({ prestige: s.prestige + 35 }) },
          { text: 'Aplicar o tratamento para evitar conflito com a família e possível processo judicial.', correct: false, feedback: 'Perigoso! Tratamentos sem embasamento podem causar dano. O medo de processo não justifica prática não-ética.', effect: (s) => ({ prestige: s.prestige - 10 }) },
          { text: 'Negar categoricamente sem explicação — é decisão médica, não da família.', correct: false, feedback: 'A negativa sem diálogo é eticamente inadequada. O familiar deve ser acolhido e orientado sobre os critérios de decisão.', effect: (s) => ({ prestige: s.prestige + 3 }) },
          { text: 'Consultar apenas o médico plantonista e seguir o que ele decidir.', correct: false, feedback: 'Insuficiente para questões éticas complexas. O Comitê de Ética existe exatamente para casos como esse.', effect: (s) => ({ prestige: s.prestige + 4 }) },
        ],
      }],
    ],
  },
  {
    id: 'dra_santos',
    name: 'Dra. Santos',
    title: 'Oncologista / Hematologista',
    role: 'doctor',
    spriteKey: 'npc_santos',
    startCol: 34, startRow: 36,
    bodyColor: 0xffffff, coatColor: 0xd5f5e3, hairColor: 0x1a1a1a, skinColor: 0xd4a574,
    patrolPoints: [
      { col: 34, row: 36 }, { col: 30, row: 36 }, { col: 30, row: 40 }, { col: 38, row: 40 },
    ],
    schedule: [
      { hour: 8, col: 34, row: 36 }, { hour: 16, col: 34, row: 40 },
    ],
    missionIds: ['quimioterapia_segura', 'cuidados_paliativos'],
    dialogues: [
      {
        id: 'quimio_intro',
        condition: (s) => !s.missionProgress['quimioterapia_segura'],
        text: [
          'Precisamos implementar o protocolo de quimioterapia segura.',
          'O INCA recomenda dupla checagem antes de toda administração.',
          'Um erro em quimio pode ser fatal. Precisamos do seu apoio!',
        ],
        choices: [
          {
            text: 'Vou treinar a equipe de oncologia com checklist duplo.',
            tooltip: 'Protocolo de dupla checagem em quimioterapia — INCA',
            effect: (s) => ({ prestige: s.prestige + 40 }),
            missionEffect: 'quimioterapia_segura:start',
          },
        ],
      },
      {
        id: 'paliativos_intro',
        condition: (s) => s.completedMissions.includes('quimioterapia_segura') && !s.missionProgress['cuidados_paliativos'],
        text: [
          'Precisamos de um protocolo de cuidados paliativos para pacientes terminais.',
          'Muitos ficam sem suporte adequado de dor e conforto.',
          'A OMS reconhece paliação como direito humano fundamental.',
        ],
        choices: [
          {
            text: 'Vamos criar uma equipe multiprofissional de paliativos.',
            effect: (s) => ({ prestige: s.prestige + 50 }),
            missionEffect: 'cuidados_paliativos:start',
          },
        ],
      },
      {
        id: 'idle',
        text: [
          'A oncologia precisa de enfermagem especializada e compassiva.',
          'Obrigada pelo suporte à nossa equipe!',
        ],
        choices: [{ text: 'É um privilégio trabalhar aqui!' }],
      },
    ],
    dialoguePools: [
      [{
        id: 'pool1_santos',
        text: [
          'Vamos administrar quimioterapia em um paciente com linfoma de alto grau.',
          'O protocolo exige dupla checagem antes da administração.',
          'Quais são os 5 critérios obrigatórios da dupla checagem em quimioterapia? (INCA/OMS)',
        ],
        choices: [
          { text: 'Verificar: identidade do paciente, medicamento correto, dose, via e hora — seguindo os 5 certos expandidos para quimioterapia.', correct: true, tooltip: 'INCA: dupla checagem dos 5 certos em quimioterapia + protocolo correto', feedback: 'Correto! Em quimioterapia, os "5 certos" (paciente, medicamento, dose, via, hora) são verificados por 2 profissionais independentes. Erro pode ser fatal. (Kurcgant cap.6 — Qualidade e Segurança)', effect: (s) => ({ prestige: s.prestige + 35 }) },
          { text: 'Verificar apenas o nome do paciente e o frasco — o resto é responsabilidade da farmácia.', correct: false, feedback: 'Perigoso! Todos os 5 critérios devem ser verificados pela enfermagem antes da administração, independente da farmácia.', effect: (s) => ({ prestige: s.prestige - 10 }) },
          { text: 'A dupla checagem é recomendação, não obrigação — basta que um profissional confira.', correct: false, feedback: 'Incorreto. A dupla checagem é obrigatória para medicamentos de alta vigilância como quimioterápicos. (ANVISA/ISMP)', effect: (s) => ({ prestige: s.prestige - 3 }) },
          { text: 'Verificar apenas o peso do paciente para confirmar a dose calculada está correta.', correct: false, feedback: 'Insuficiente. Peso é um critério de cálculo, não substitui a verificação completa dos 5 certos na beira do leito.', effect: (s) => ({ prestige: s.prestige + 3 }) },
        ],
      }],
      [{
        id: 'pool2_santos',
        text: [
          'Uma paciente com câncer de mama avançado está com dor crônica intensa (EVA 8/10).',
          'O médico ainda não prescreveu analgesia adequada.',
          'Qual é a responsabilidade da enfermagem segundo cuidados paliativos? (Kurcgant cap.2 — Ética)',
        ],
        choices: [
          { text: 'Registrar a avaliação de dor no prontuário, notificar o médico de forma estruturada (SBAR) e advogado pelos direitos do paciente ao controle de dor.', correct: true, tooltip: 'OMS: controle de dor é direito humano — enfermagem é advogada do paciente', feedback: 'Correto! O controle de dor é direito reconhecido pela OMS em cuidados paliativos. A enfermagem tem papel ativo de avaliação, registro e advocacia, não apenas de administrar quando prescrito. (Kurcgant cap.2)', effect: (s) => ({ prestige: s.prestige + 30 }) },
          { text: 'Aguardar passagem de plantão para comunicar ao próximo médico que assumir.', correct: false, feedback: 'Incorreto. Dor intensa (EVA 8/10) é urgência — não pode aguardar troca de turno.', effect: (s) => ({ prestige: s.prestige - 5 }) },
          { text: 'Administrar medicação analgésica que a paciente tomava em casa sem prescrição hospitalar.', correct: false, feedback: 'Ilegal e perigoso. Administração sem prescrição é infração ética e legal, mesmo com boa intenção.', effect: (s) => ({ prestige: s.prestige - 10 }) },
          { text: 'Explicar para a paciente que é preciso aguardar — a prescrição é exclusivamente médica.', correct: false, feedback: 'Passividade inaceitável. Enfermagem deve agir ativamente pela resolução do problema, não apenas comunicar limitações.', effect: (s) => ({ prestige: s.prestige + 0 }) },
        ],
      }],
      [{
        id: 'pool3_santos',
        text: [
          'A família de um paciente em fase terminal pede para "fazer tudo" e não aceita discutir cuidados paliativos.',
          'O paciente previamente havia expressado querer conforto sem medidas extraordinárias.',
          'Como abordar essa situação segundo a ética em enfermagem? (Kurcgant cap.2)',
        ],
        choices: [
          { text: 'Valorizar a autonomia prévia do paciente, conduzir reunião familiar com equipe multiprofissional e facilitar processo de elaboração do luto antecipatório.', correct: true, tooltip: 'Kurcgant cap.2: princípio da autonomia e cuidado centrado no paciente', feedback: 'Correto! O princípio da autonomia (vontade prévia do paciente) deve prevalecer. A reunião familiar multiprofissional e o acompanhamento do luto antecipatório são boas práticas de cuidados paliativos. (Kurcgant cap.2)', effect: (s) => ({ prestige: s.prestige + 35 }) },
          { text: 'Atender o pedido da família e iniciar todas as medidas de suporte para evitar conflito.', correct: false, feedback: 'Incorreto. Priorizar o pedido da família sobre a vontade do paciente viola o princípio de autonomia. (Kurcgant cap.2)', effect: (s) => ({ prestige: s.prestige - 5 }) },
          { text: 'Informar que a decisão é exclusivamente médica e que a enfermagem não tem papel nessa discussão.', correct: false, feedback: 'Incorreto. A enfermagem tem papel central nos cuidados paliativos e nas discussões sobre fim de vida. (Kurcgant cap.2)', effect: (s) => ({ prestige: s.prestige + 0 }) },
          { text: 'Acionar juridicamente a família para garantir a vontade do paciente de forma compulsória.', correct: false, feedback: 'Desnecessário como primeira medida. A mediação multiprofissional e o diálogo devem ser esgotados primeiro.', effect: (s) => ({ prestige: s.prestige + 2 }) },
        ],
      }],
    ],
  },
  {
    id: 'enf_pedro',
    name: 'Enf. Pedro',
    title: 'Enfermeiro da Maternidade',
    role: 'nurse',
    spriteKey: 'npc_pedro',
    startCol: 20, startRow: 36,
    bodyColor: 0xffffff, coatColor: 0xfce8ef, hairColor: 0x5c4033, skinColor: 0xd4a574,
    patrolPoints: [
      { col: 20, row: 36 }, { col: 16, row: 36 }, { col: 16, row: 40 }, { col: 24, row: 40 },
    ],
    schedule: [
      { hour: 7, col: 20, row: 36 }, { hour: 19, col: 20, row: 40 },
    ],
    missionIds: ['banco_leite', 'humanizacao_parto'],
    dialogues: [
      {
        id: 'banco_leite_intro',
        condition: (s) => !s.missionProgress['banco_leite'],
        text: [
          'Bom dia! O Banco de Leite do HUAP precisa de reestruturação.',
          'A coleta, processamento e distribuição estão abaixo da norma.',
          'A RDC 171/2006 da ANVISA é rigorosa nesse quesito.',
        ],
        choices: [
          {
            text: 'Vou revisar os protocolos do Banco de Leite imediatamente.',
            tooltip: 'RDC 171/2006: norma técnica para Bancos de Leite Humano',
            effect: (s) => ({ prestige: s.prestige + 35 }),
            missionEffect: 'banco_leite:start',
          },
        ],
      },
      {
        id: 'humanizacao_intro',
        condition: (s) => s.completedMissions.includes('banco_leite') && !s.missionProgress['humanizacao_parto'],
        text: [
          'Precisamos implementar práticas de humanização do parto aqui!',
          'O projeto Humaniza-HUAP está esperando aprovação da Diretoria.',
          'Inclui: doula, música, acompanhante, posição verticalizada.',
        ],
        choices: [
          {
            text: 'Vou apresentar o projeto para a Diretora Alves.',
            effect: (s) => ({ prestige: s.prestige + 45 }),
            missionEffect: 'humanizacao_parto:start',
          },
        ],
      },
      {
        id: 'idle',
        text: [
          'A maternidade é lugar de vida e emoção.',
          'Humanização é a essência da nossa prática aqui.',
        ],
        choices: [{ text: 'Bela missão, Pedro!' }],
      },
    ],
    dialoguePools: [
      [{
        id: 'pool1_pedro',
        text: [
          'O Banco de Leite do HUAP precisa de adequação urgente.',
          'Qual é a temperatura correta de armazenamento do leite humano cru no BLH?',
          '(RDC 171/2006 ANVISA — Bancos de Leite Humano)',
        ],
        choices: [
          { text: 'Leite cru: refrigerado a -3 a 5°C por até 12h ou congelado a -18°C. Leite pasteurizado: 2 a 6°C por até 12h.', correct: true, tooltip: 'RDC 171/2006 ANVISA: temperatura e tempo de armazenamento no BLH', feedback: 'Correto! A RDC 171/2006 da ANVISA é rigorosa sobre temperatura do BLH. Leite cru deve ser coletado e processado no prazo — qualquer desvio implica descarte obrigatório.', effect: (s) => ({ prestige: s.prestige + 28 }) },
          { text: 'Temperatura ambiente é suficiente por até 4 horas — é leite materno, não um medicamento.', correct: false, feedback: 'Perigoso! Leite humano em temperatura ambiente cresce bactérias rapidamente. A RDC 171/2006 é muito estrita sobre controle térmico.', effect: (s) => ({ prestige: s.prestige - 8 }) },
          { text: 'Qualquer refrigeração abaixo de 10°C é aceitável — o importante é não congelar.', correct: false, feedback: 'Incorreto. A faixa exata é -3 a 5°C para cru e 2 a 6°C para pasteurizado. Temperatura de 10°C não é adequada.', effect: (s) => ({ prestige: s.prestige + 2 }) },
          { text: 'O tempo não importa se o leite foi coletado em condições estéreis.', correct: false, feedback: 'Incorreto. Mesmo em condições estéreis, o tempo e a temperatura são determinantes para a segurança do receptor.', effect: (s) => ({ prestige: s.prestige + 0 }) },
        ],
      }],
      [{
        id: 'pool2_pedro',
        text: [
          'Uma parturiente deseja ter seu companheiro presente durante o trabalho de parto.',
          'A equipe diz que "a norma do hospital" não permite acompanhante na sala de parto.',
          'Qual é o respaldo legal para garantir esse direito? (Humanização)',
        ],
        choices: [
          { text: 'Lei 11.108/2005 — garante à parturiente o direito a acompanhante durante trabalho de parto, parto e pós-parto imediato em serviços do SUS.', correct: true, tooltip: 'Lei 11.108/2005: direito à presença de acompanhante no parto — SUS', feedback: 'Correto! A Lei 11.108/2005 garante o direito ao acompanhante no parto em todos os serviços do SUS. Normas internas não podem contrariar lei federal. (PNH/MS)', effect: (s) => ({ prestige: s.prestige + 30 }) },
          { text: 'Não há lei específica — a decisão é do obstetra responsável pelo parto.', correct: false, feedback: 'Incorreto. A Lei 11.108/2005 é clara e de cumprimento obrigatório. O obstetra não pode negar esse direito.', effect: (s) => ({ prestige: s.prestige - 3 }) },
          { text: 'O acompanhante pode entrar apenas se a parturiente estiver em risco de vida.', correct: false, feedback: 'Incorreto. O direito é incondicional — não depende do estado clínico da parturiente.', effect: (s) => ({ prestige: s.prestige + 0 }) },
          { text: 'Depende do protocolo interno de cada hospital — cada instituição define suas regras.', correct: false, feedback: 'Incorreto. Protocolos internos não podem contrariar lei federal. A Lei 11.108/2005 prevalece sobre qualquer norma interna.', effect: (s) => ({ prestige: s.prestige - 2 }) },
        ],
      }],
      [{
        id: 'pool3_pedro',
        text: [
          'Uma mãe adolescente está com dificuldade para amamentar seu recém-nascido.',
          'O bebê está perdendo peso acima do permitido no 3º dia de vida.',
          'Qual é a conduta prioritária da enfermagem no Alojamento Conjunto?',
        ],
        choices: [
          { text: 'Avaliar a pega, posição e frequência das mamadas, orientar a mãe com técnica demonstrativa e acionar o suporte de lactação (BLH/IBCLC) se necessário.', correct: true, tooltip: 'OMS/MS: aleitamento materno — papel da enfermagem no suporte ativo no alojamento conjunto', feedback: 'Correto! A avaliação ativa da amamentação (pega, posição, frequência) e o suporte técnico são responsabilidade da equipe de enfermagem. Perda > 10% do peso neonatal exige ação imediata. (OMS/IMALAC)', effect: (s) => ({ prestige: s.prestige + 30 }) },
          { text: 'Oferecer complementação com fórmula para recuperar o peso rapidamente.', correct: false, feedback: 'Incorreto como primeira conduta. Suplementação sem avaliação adequada da amamentação pode comprometer o aleitamento materno exclusivo desnecessariamente.', effect: (s) => ({ prestige: s.prestige + 3 }) },
          { text: 'Orientar a mãe a oferecer o seio de hora em hora e não se preocupar com o peso.', correct: false, feedback: 'Insuficiente. Perda de > 10% do peso ao 3º dia é sinal de alerta que requer avaliação técnica — não apenas reasseguramento verbal.', effect: (s) => ({ prestige: s.prestige + 4 }) },
          { text: 'Comunicar ao pediatra e aguardar orientação médica antes de qualquer intervenção.', correct: false, feedback: 'Passivo demais. A avaliação da amamentação é competência da enfermagem — não requer aguardar médico para iniciar suporte.', effect: (s) => ({ prestige: s.prestige + 5 }) },
        ],
      }],
    ],
  },
  {
    id: 'paciente_uti_1',
    name: 'Sr. João',
    title: 'Paciente (UTI)',
    role: 'other',
    spriteKey: 'npc_patient_1',
    startCol: 44, startRow: 24,
    bodyColor: 0xe0f2fe, coatColor: 0x95a5a6, hairColor: 0xd3d3d3, skinColor: 0xf5c5a3,
    patrolPoints: [{ col: 44, row: 24 }],  // Doesn't move, in bed
    schedule: [{ hour: 0, col: 44, row: 24 }],
    missionIds: [],
    dialogues: [{
      id: 'idle',
      text: ['(Bip... bip... bip...)', 'Agradeço pelo cuidado... estou me sentindo mais seguro.'],
      choices: [{ text: 'Pode descansar.'}]
    }]
  },
  {
    id: 'paciente_enf_1',
    name: 'Dona Maria',
    title: 'Paciente (Enfermaria)',
    role: 'other',
    spriteKey: 'npc_patient_2',
    startCol: 36, startRow: 18,
    bodyColor: 0xe0f2fe, coatColor: 0x95a5a6, hairColor: 0x6e2c00, skinColor: 0xd4a574,
    patrolPoints: [{ col: 36, row: 18 }],  // Doesn't move
    schedule: [{ hour: 0, col: 36, row: 18 }],
    missionIds: [],
    dialogues: [{
      id: 'idle',
      text: ['Sabe se o médico vai passar hoje?', 'O almoço do hospital até que não está ruim.'],
      choices: [{ text: 'O médico já deve passar, Dona Maria.'}]
    }]
  },
  {
    id: 'visitante_1',
    name: 'Roberto',
    title: 'Visitante (Recepção)',
    role: 'other',
    spriteKey: 'npc_patient_3',
    startCol: 6, startRow: 11,
    bodyColor: 0xffffff, coatColor: 0xc0392b, hairColor: 0x111111, skinColor: 0x8d6e63,
    patrolPoints: [{ col: 6, row: 11 }, { col: 10, row: 11 }, { col: 8, row: 9 }],
    schedule: [{ hour: 9, col: 6, row: 11 }],
    missionIds: [],
    dialogues: [{
      id: 'idle',
      text: ['Bom dia, eu queria informações sobre a internação.', 'A senhora poderia me ajudar?'],
      choices: [{ text: 'Claro, por favor se dirija à recepção.'}]
    }]
  }
];

// ─── MISSION DEFINITIONS ──────────────────────────────────────────────────────
export const MISSIONS: MissionDef[] = [
  {
    id: 'escala_plantao',
    title: 'Escala de Plantão',
    description: 'Organizar a escala de enfermagem conforme a Resolução COFEN 543/2017.',
    category: 'Dimensionamento de Pessoal',
    prestige: 120,
    steps: 2,
    prerequisiteIds: [],
    pedagogy: 'A elaboração de escalas considera: SCP, grau de dependência dos pacientes e quadro de pessoal. O dimensionamento é responsabilidade do enfermeiro gerente.',
    pedagogyRef: 'Kurcgant (2016) — Gerenciamento em Enfermagem, p. 82-95',
  },
  {
    id: 'triagem_ps',
    title: 'Sistema de Triagem Manchester',
    description: 'Implementar o Protocolo Manchester de Classificação de Risco no Pronto-Socorro.',
    category: 'Segurança do Paciente',
    prestige: 100,
    steps: 1,
    prerequisiteIds: [],
    pedagogy: 'O Protocolo Manchester estratifica pacientes em 5 categorias (vermelho/laranja/amarelo/verde/azul), garantindo atendimento por prioridade clínica.',
    pedagogyRef: 'Manchester Triage Group (2014) — Triagem no Serviço de Urgência',
  },
  {
    id: 'protocolo_sepse',
    title: 'Bundle de Sepse',
    description: 'Implementar a Bundle de 1h e 3h para diagnóstico e tratamento precoce da sepse.',
    category: 'Segurança do Paciente',
    prestige: 130,
    steps: 1,
    prerequisiteIds: [],
    pedagogy: 'A Bundle de Sepse (Surviving Sepsis Campaign, 2018) prevê: lactato sérico, hemoculturas, antibióticos, reposição volêmica nas primeiras horas.',
    pedagogyRef: 'Surviving Sepsis Campaign (2018) — Hour-1 Bundle',
  },
  {
    id: 'estoque_farmacia',
    title: 'Gestão de Estoque Farmacêutico',
    description: 'Garantir o resuprimento de medicamentos críticos com ponto de pedido definido.',
    category: 'Gestão de Materiais',
    prestige: 110,
    steps: 1,
    prerequisiteIds: [],
    pedagogy: 'A gestão de estoque pelo ponto de pedido e curva ABC evita desabastecimento de medicamentos críticos, garantindo a continuidade do cuidado.',
    pedagogyRef: 'Chiavenato (2014) — Administração: Teoria, Processo e Prática',
  },
  {
    id: 'ronda_enfermaria',
    title: 'Ronda de Enfermagem Estruturada',
    description: 'Implementar ronda sistematizada com protocolo SOAP em todos os leitos.',
    category: 'Qualidade Assistencial',
    prestige: 90,
    steps: 1,
    prerequisiteIds: [],
    pedagogy: 'A ronda estruturada de enfermagem reduz em até 30% os eventos adversos e melhora a satisfação do paciente (JCAHO, 2011).',
    pedagogyRef: 'Marquis & Huston (2015) — Administração e Liderança em Enfermagem',
  },
  {
    id: 'cme_protocolo',
    title: 'Protocolo CME — RDC 15/2012',
    description: 'Adequar a Central de Material Esterilizado às exigências da ANVISA.',
    category: 'Controle de Infecção',
    prestige: 115,
    steps: 1,
    prerequisiteIds: ['estoque_farmacia'],
    pedagogy: 'A RDC 15/2012 estabelece protocolos obrigatórios de limpeza, desinfecção e esterilização de artigos médico-hospitalares reutilizáveis.',
    pedagogyRef: 'ANVISA — RDC 15, de 15 de março de 2012',
  },
  {
    id: 'reconciliacao_medicamentosa',
    title: 'Reconciliação Medicamentosa',
    description: 'Implementar reconciliação medicamentosa na admissão, transferência e alta.',
    category: 'Segurança do Paciente',
    prestige: 125,
    steps: 1,
    prerequisiteIds: ['estoque_farmacia'],
    pedagogy: 'A Reconciliação Medicamentosa é um processo formal de obtenção da lista de todos os medicamentos do paciente, prevenindo discrepâncias e erros na transição do cuidado.',
    pedagogyRef: 'OMS — 5 Metas Internacionais de Segurança do Paciente',
  },
  {
    id: 'resultados_criticos',
    title: 'Protocolo de Valores Críticos',
    description: 'Criar fluxo de comunicação imediata de resultados laboratoriais críticos.',
    category: 'Segurança do Paciente',
    prestige: 105,
    steps: 1,
    prerequisiteIds: [],
    pedagogy: 'A comunicação efetiva de valores críticos é uma das Metas Internacionais de Segurança da JCI/ONA, exigindo resposta em menos de 30 minutos.',
    pedagogyRef: 'Joint Commission International (2021) — Accreditation Standards',
  },
  {
    id: 'capacitacao_sae',
    title: 'Capacitação em SAE',
    description: 'Treinar toda a equipe de enfermagem na Sistematização da Assistência de Enfermagem.',
    category: 'Educação e Desenvolvimento',
    prestige: 140,
    steps: 1,
    prerequisiteIds: ['escala_plantao'],
    pedagogy: 'A SAE é o método científico de trabalho da enfermagem, composto por: Coleta de dados, Diagnóstico, Planejamento, Implementação e Avaliação (COFEN 358/2009).',
    pedagogyRef: 'Resolução COFEN 358/2009 — SAE / Processo de Enfermagem',
  },
  {
    id: 'fluxo_recepcao',
    title: 'Fluxo de Acolhimento Integrado',
    description: 'Organizar o sistema de acolhimento e agendamento do ambulatório do HUAP.',
    category: 'Gestão de Fluxo',
    prestige: 100,
    steps: 1,
    prerequisiteIds: ['triagem_ps'],
    pedagogy: 'O Acolhimento com Classificação de Risco integra a Política Nacional de Humanização (PNH) e reorganiza o fluxo de atendimento para reduzir esperas.',
    pedagogyRef: 'Ministério da Saúde — HumanizaSUS: Acolhimento e Classificação de Risco (2009)',
  },
  {
    id: 'superlotacao_ps',
    title: 'Plano de Contingência — Superlotação',
    description: 'Desenvolver protocolo de contingência para situações de overcrowding no PS.',
    category: 'Gestão de Crise',
    prestige: 135,
    steps: 1,
    prerequisiteIds: ['triagem_ps'],
    pedagogy: 'O protocolo de overcrowding inclui: ativação de leitos extras, alta precoce de internados estáveis, redirecionamento de fluxo e comunicação com regulação.',
    pedagogyRef: 'Derlet & Richards (2000) — Overcrowding in Emergency Departments: ACEP',
  },
  {
    id: 'laudo_urgente',
    title: 'Priorização de Exames Urgentes',
    description: 'Criar sistema de priorização por criticidade para laudos radiológicos.',
    category: 'Gestão de Fluxo',
    prestige: 95,
    steps: 1,
    prerequisiteIds: [],
    pedagogy: 'A priorização de exames por cor (vermelho/amarelo/verde) melhora o tempo de resposta diagnóstica e a segurança do paciente crítico.',
    pedagogyRef: 'ACR — American College of Radiology: Appropriateness Criteria',
  },
  {
    id: 'orcamento',
    title: 'Auditoria de Custos Hospitalares',
    description: 'Realizar análise ABC de custos operacionais e propor plano de eficiência.',
    category: 'Gestão Financeira',
    prestige: 150,
    steps: 1,
    prerequisiteIds: ['estoque_farmacia', 'escala_plantao'],
    pedagogy: 'A análise ABC classifica itens por valor de gasto, focando esforços nos itens A (80% do gasto). Ferramentas como custeio por atividade (ABC Costing) permitem decisões baseadas em dados.',
    pedagogyRef: 'Kurcgant (2016) — Gerenciamento em Enfermagem, cap. 12',
  },
  {
    id: 'indicadores_qualidade',
    title: 'Dashboard de Indicadores de Qualidade',
    description: 'Implementar monitoramento contínuo de indicadores assistenciais na UTI.',
    category: 'Qualidade e Segurança',
    prestige: 160,
    steps: 1,
    prerequisiteIds: ['protocolo_sepse', 'ronda_enfermaria'],
    pedagogy: 'Indicadores de qualidade como TPI (Taxa de Parada Intra-hospitalar), IRAS (Infecções Relacionadas), e VMI são essenciais para avaliação da performance assistencial.',
    pedagogyRef: 'OPAS/OMS — Indicadores Hospitalares (2008); ONA (2018)',
  },
  {
    id: 'acreditacao_ona',
    title: 'Preparação para Acreditação ONA',
    description: 'Preparar o HUAP para visita de acreditação da Organização Nacional de Acreditação.',
    category: 'Qualidade e Acreditação',
    prestige: 220,
    steps: 1,
    prerequisiteIds: ['indicadores_qualidade', 'cme_protocolo'],
    pedagogy: 'A Acreditação ONA certifica hospitais em 3 níveis: acreditado, acreditado com excelência, acreditado com excelência plena. Envolve 20 seções e centenas de requisitos.',
    pedagogyRef: 'ONA — Manual de Acreditação Hospitalar (2018)',
  },
  {
    id: 'terapia_nutricional',
    title: 'Protocolo de Nutrição Enteral Precoce',
    description: 'Implementar protocolo ASPEN de nutrição enteral nas primeiras 48h para pacientes da UTI.',
    category: 'Cuidado Clínico',
    prestige: 110,
    steps: 1,
    prerequisiteIds: [],
    pedagogy: 'O início precoce da nutrição enteral (dentro de 24-48h da admissão na UTI) reduz complicações infecciosas, tempo de ventilação e mortalidade (ASPEN/ESPEN 2016).',
    pedagogyRef: 'ASPEN — Clinical Guidelines: Nutrition Support Therapy (2016)',
  },
  {
    id: 'quimioterapia_segura',
    title: 'Protocolo de Quimioterapia Segura',
    description: 'Implementar dupla checagem e protocolo de segurança em oncologia.',
    category: 'Segurança do Paciente',
    prestige: 145,
    steps: 1,
    prerequisiteIds: ['resultados_criticos'],
    pedagogy: 'O processo de dupla checagem independente antes da administração de quimioterápicos reduz erros em 80% e é mandatório pelo INCA e ANVISA.',
    pedagogyRef: 'INCA — Manual de Segurança em Quimioterapia (2019)',
  },
  {
    id: 'banco_leite',
    title: 'Reestruturação do Banco de Leite',
    description: 'Adequar o Banco de Leite Humano às normas da ANVISA (RDC 171/2006).',
    category: 'Saúde Materno-Infantil',
    prestige: 120,
    steps: 1,
    prerequisiteIds: [],
    pedagogy: 'Os Bancos de Leite Humano do Brasil são referência mundial. A RDC 171/2006 normatiza toda a cadeia: coleta, pasteurização, controle microbiológico e distribuição.',
    pedagogyRef: 'ANVISA — RDC 171/2006; MS — Rede BLH-BR',
  },
  {
    id: 'cuidados_paliativos',
    title: 'Equipe de Cuidados Paliativos',
    description: 'Estruturar equipe multiprofissional para cuidados paliativos no HUAP.',
    category: 'Humanização e Ética',
    prestige: 165,
    steps: 1,
    prerequisiteIds: ['quimioterapia_segura'],
    pedagogy: 'Os Cuidados Paliativos visam aliviar sofrimento e melhorar qualidade de vida de pacientes com doenças que ameaçam a vida. Envolvem equipe multiprofissional e família.',
    pedagogyRef: 'OMS (2002) — Palliative Care Definition; CFM Resolução 1.805/2006',
  },
  {
    id: 'humanizacao_parto',
    title: 'Humanização do Parto',
    description: 'Implementar práticas de humanização no pré-parto e parto do HUAP.',
    category: 'Humanização e Ética',
    prestige: 130,
    steps: 1,
    prerequisiteIds: ['banco_leite'],
    pedagogy: 'O Parto Humanizado (HumanizaSUS/PNH) inclui: direito ao acompanhante, posição de escolha, doula, música ambiente, respeito à fisiologia do parto e autonomia da mulher.',
    pedagogyRef: 'Ministério da Saúde — Humanização do Parto e do Nascimento (2014)',
  },
  {
    id: 'coleta_sistematizada',
    title: 'Padronização da Coleta Laboratorial',
    description: 'Treinar equipe de enfermagem em técnicas corretas de coleta e identificação de amostras.',
    category: 'Educação e Desenvolvimento',
    prestige: 95,
    steps: 1,
    prerequisiteIds: ['resultados_criticos'],
    pedagogy: 'A correta identificação do paciente na coleta e o manuseio adequado das amostras são etapas pré-analíticas críticas para confiabilidade dos resultados laboratoriais.',
    pedagogyRef: 'SBPC/ML — Manual de Coleta de Amostras Biológicas (2013)',
  },
  {
    id: 'passagem_plantao',
    title: 'Protocolo de Passagem de Plantão SBAR',
    description: 'Implementar o modelo SBAR (Situação-Background-Avaliação-Recomendação) na passagem de plantão.',
    category: 'Comunicação Segura',
    prestige: 105,
    steps: 1,
    prerequisiteIds: [],
    pedagogy: 'O SBAR é uma ferramenta padronizada de comunicação estruturada que reduz erros na passagem de plantão, recomendada pela OMS e Joint Commission.',
    pedagogyRef: 'JCAHO (2006) — SBAR Technique for Communication; OMS',
  },
  {
    id: 'pesquisa_indicadores',
    title: 'Pesquisa em Indicadores de Enfermagem',
    description: 'Conduzir pesquisa sobre indicadores de qualidade para apresentação na Semana de Monitoria da UFF.',
    category: 'Pesquisa e Ensino',
    prestige: 200,
    steps: 1,
    prerequisiteIds: ['indicadores_qualidade', 'capacitacao_sae'],
    pedagogy: 'A pesquisa em enfermagem fortalece a prática baseada em evidências. Os indicadores NDNQI (Nursing-Sensitive Quality Indicators) são referência internacional.',
    pedagogyRef: 'ANA — NDNQI: Nursing Sensitive Quality Indicators; UFF — Semana de Monitoria',
  },
];
