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

  const drawTile = (i: number, cb: (x: number) => void) => {
    const x = i * W;
    cb(x);
  };

  // Helper: draw subtle grid lines
  const gridLines = (ctx: CanvasRenderingContext2D, x: number, gridColor: string, alpha = 0.12) => {
    ctx.strokeStyle = gridColor;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = 0.5;
    for (let gx = x; gx < x + W; gx += 8) {
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, W); ctx.stroke();
    }
    for (let gy = 0; gy < W; gy += 8) {
      ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x + W, gy); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  };

  // Helper: checker pattern
  const checker = (ctx: CanvasRenderingContext2D, x: number, c1: string, c2: string, size = 8) => {
    for (let row = 0; row < W / size; row++) {
      for (let col = 0; col < W / size; col++) {
        ctx.fillStyle = (row + col) % 2 === 0 ? c1 : c2;
        ctx.fillRect(x + col * size, row * size, size, size);
      }
    }
  };

  // 0: GARDEN
  drawTile(TILE_ID.GARDEN, x => {
    ctx.fillStyle = '#5aa96a'; ctx.fillRect(x, 0, W, W);
    // Grass texture
    ctx.fillStyle = '#4a9058';
    for (let j = 0; j < 20; j++) {
      const gx = (j * 37) % (W - 2); const gy = (j * 23) % (W - 4);
      ctx.fillRect(x + gx, gy, 1, 3);
    }
    // Occasional flowers
    if (Math.random() > 0.6) {
      ctx.fillStyle = Math.random() > 0.5 ? '#ffb3ba' : '#fff9b0';
      const fx = 4 + (Math.random() * (W - 8)) | 0;
      const fy = 4 + (Math.random() * (W - 8)) | 0;
      ctx.fillRect(x + fx, fy, 3, 3);
    }
  });

  // 1: WALL - clean hospital wall with wainscoting
  drawTile(TILE_ID.WALL, x => {
    // Floor area behind the wall (minimal)
    ctx.fillStyle = '#0a0a0a'; ctx.fillRect(x, 0, W, W);
    
    // Front face (Wall protruding up into the camera)
    ctx.fillStyle = '#f0ede4'; ctx.fillRect(x, 0, W, W - 8);
    
    // Wainscoting pattern (horizontal bands)
    ctx.fillStyle = '#e8e4d8';
    for (let row = 0; row < 3; row++) {
      const ox = row % 2 === 0 ? 0 : 8;
      for (let bx = ox; bx < W; bx += 16) {
        ctx.fillRect(x + bx, row * 8, 14, 6);
      }
    }
    
    // Top molding strip (3D depth cue)
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x, 0, W, 3);
    ctx.fillStyle = '#d4cfc0'; ctx.fillRect(x, 3, W, 1);
    
    // Baseboard and 3D floor cutoff
    ctx.fillStyle = '#c8c0b0'; ctx.fillRect(x, W - 12, W, 4);
    ctx.fillStyle = '#a09880'; ctx.fillRect(x, W - 8, W, 2);
    
    // Depth shadow going down to the floor
    const grad = ctx.createLinearGradient(x, W - 6, x, W);
    grad.addColorStop(0, 'rgba(0,0,0,0.8)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(x, W - 6, W, 6);
  });

  // 2: CORRIDOR - warm marble/linoleum
  drawTile(TILE_ID.CORRIDOR, x => {
    ctx.fillStyle = '#ede8d8'; ctx.fillRect(x, 0, W, W);
    // Large tile grid
    ctx.strokeStyle = '#d8d2c0'; ctx.lineWidth = 0.8; ctx.globalAlpha = 0.8;
    ctx.strokeRect(x + 0.5, 0.5, W - 1, W - 1);
    ctx.strokeRect(x + W/2, 0, 0.5, W);
    ctx.strokeRect(x, W/2, W, 0.5);
    ctx.globalAlpha = 1;
    // Highlight on top-left
    ctx.fillStyle = '#f8f4e8'; ctx.fillRect(x, 0, W/2, W/2);
    ctx.fillStyle = '#ede8d8'; ctx.fillRect(x, 0, W/2, W/2);
    // Center dot accent
    ctx.fillStyle = '#d4cebc'; ctx.fillRect(x + 14, 14, 4, 4);
    
    // Diagonal Glossy reflection line effect
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath(); ctx.moveTo(x+W-8, 0); ctx.lineTo(x+W, 0); ctx.lineTo(x+8, W); ctx.lineTo(x, W); ctx.fill();
  });

  // 3: ICU - clinical blue
  drawTile(TILE_ID.ICU, x => {
    checker(ctx, x, '#b8e8ee', '#aadde4');
    // Cross symbol
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(x + 13, 8, 6, 16); ctx.fillRect(x + 8, 13, 16, 6);
    gridLines(ctx, x, '#89c8d0');
  });

  // 4: PHARMACY - purple/green cross
  drawTile(TILE_ID.PHARMACY, x => {
    ctx.fillStyle = '#c4a8e0'; ctx.fillRect(x, 0, W, W);
    ctx.fillStyle = '#b898d0'; ctx.fillRect(x, 0, W/2, W/2);
    ctx.fillStyle = '#c4a8e0'; ctx.fillRect(x + W/2, W/2, W/2, W/2);
    // Green cross
    ctx.fillStyle = 'rgba(80,200,100,0.5)';
    ctx.fillRect(x + 13, 7, 6, 18); ctx.fillRect(x + 7, 13, 18, 6);
    gridLines(ctx, x, '#9878b8');
  });

  // 5: ADMIN - warm wood floor
  drawTile(TILE_ID.ADMIN, x => {
    ctx.fillStyle = '#8e5e3b'; ctx.fillRect(x, 0, W, W);
    ctx.fillStyle = '#7a4e30';
    for(let j=0; j<W/4; j++) {
        ctx.fillRect(x, j*4, W, 1); // planks
    }
  });

  // 6: WARD - soft purple/lavender
  drawTile(TILE_ID.WARD, x => {
    checker(ctx, x, '#d8d0f0', '#cfc8e8', 16);
    gridLines(ctx, x, '#a898c8', 0.15);
    // Small diamond center
    ctx.fillStyle = 'rgba(160,140,210,0.3)';
    ctx.beginPath(); ctx.moveTo(x + 16, 4); ctx.lineTo(x + 28, 16);
    ctx.lineTo(x + 16, 28); ctx.lineTo(x + 4, 16); ctx.closePath(); ctx.fill();
  });

  // 7: BREAK/NUTRITION - break kitchen tile
  drawTile(TILE_ID.BREAK, x => {
    ctx.fillStyle = '#dcdde1'; ctx.fillRect(x, 0, W, W);
    checker(ctx, x, '#f5f6fa', '#dcdde1', W / 4);
    gridLines(ctx, x, '#7f8fa6', 0.4);
  });

  // 8: NURSING - mint green
  drawTile(TILE_ID.NURSING, x => {
    ctx.fillStyle = '#9cecca'; ctx.fillRect(x, 0, W, W);
    ctx.fillStyle = '#88e0b8';
    for (let row = 0; row < 4; row++) {
      ctx.fillRect(x, row * 8, W, 1);
    }
    // H (hospital) motif
    ctx.fillStyle = 'rgba(50,180,120,0.2)';
    ctx.fillRect(x + 8, 8, 3, 16); ctx.fillRect(x + 21, 8, 3, 16);
    ctx.fillRect(x + 8, 15, 16, 3);
    gridLines(ctx, x, '#50a878', 0.1);
  });

  // 9: RECEPTION - warm cream
  drawTile(TILE_ID.RECEPTION, x => {
    checker(ctx, x, '#fef0c0', '#f8e8a8', 16);
    ctx.fillStyle = 'rgba(200,160,40,0.2)';
    ctx.beginPath(); ctx.moveTo(x + 16, 0); ctx.lineTo(x + W, 16);
    ctx.lineTo(x + 16, W); ctx.lineTo(x, 16); ctx.closePath(); ctx.fill();
    gridLines(ctx, x, '#c0a840', 0.1);
  });

  // 10: EMERGENCY - red alert
  drawTile(TILE_ID.EMERGENCY, x => {
    ctx.fillStyle = '#f8a8a8'; ctx.fillRect(x, 0, W, W);
    ctx.fillStyle = '#f09090';
    // Arrow pattern
    ctx.globalAlpha = 0.25;
    for (let row = 0; row < 2; row++) {
      ctx.fillStyle = '#e06060';
      ctx.beginPath();
      ctx.moveTo(x + 4, row * 16 + 4); ctx.lineTo(x + 16, row * 16 + 10);
      ctx.lineTo(x + 4, row * 16 + 16); ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + 16, row * 16 + 4); ctx.lineTo(x + 28, row * 16 + 10);
      ctx.lineTo(x + 16, row * 16 + 16); ctx.closePath(); ctx.fill();
    }
    ctx.globalAlpha = 1;
    gridLines(ctx, x, '#d04040', 0.1);
  });

  // 11: LAB - clean white/blue
  drawTile(TILE_ID.LAB, x => {
    ctx.fillStyle = '#c8ddf8'; ctx.fillRect(x, 0, W, W);
    checker(ctx, x, '#c0d8f8', '#b8d0f0', 8);
    // Hex pattern
    ctx.fillStyle = 'rgba(100,140,220,0.15)';
    ctx.beginPath(); ctx.arc(x + 16, 16, 8, 0, Math.PI * 2); ctx.fill();
    gridLines(ctx, x, '#8090c0', 0.12);
  });

  // 12: RADIOLOGY - dark blue/indigo
  drawTile(TILE_ID.RADIOLOGY, x => {
    checker(ctx, x, '#b8c8f8', '#c0ccf8', 16);
    ctx.fillStyle = 'rgba(80,80,220,0.12)';
    ctx.fillRect(x + 6, 6, 20, 20);
    gridLines(ctx, x, '#6070a0');
  });

  // 13: CME - clean white/grey
  drawTile(TILE_ID.CME, x => {
    ctx.fillStyle = '#e4e8f0'; ctx.fillRect(x, 0, W, W);
    checker(ctx, x, '#e0e4ec', '#d8dce8', 8);
    ctx.fillStyle = 'rgba(100,110,140,0.1)';
    // Autoclave symbol (circle)
    ctx.beginPath(); ctx.arc(x + 16, 16, 8, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(100,120,160,0.2)'; ctx.lineWidth = 2; ctx.stroke();
  });

  // 14: MATERNITY - soft pink
  drawTile(TILE_ID.MATERNITY, x => {
    ctx.fillStyle = '#f8c8d4'; ctx.fillRect(x, 0, W, W);
    ctx.fillStyle = '#f0b8c4';
    for (let row = 0; row < 4; row++) ctx.fillRect(x, row * 8, W, 1);
    // Heart motif
    ctx.fillStyle = 'rgba(220,80,120,0.15)';
    ctx.beginPath();
    ctx.arc(x + 12, 14, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 20, 14, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(x + 8, 16, 16, 10);
  });

  // 15: ONCOLOGY - mint/teal green
  drawTile(TILE_ID.ONCOLOGY, x => {
    ctx.fillStyle = '#a8e8d0'; ctx.fillRect(x, 0, W, W);
    checker(ctx, x, '#a0e0c8', '#98d8c0', 16);
    ctx.fillStyle = 'rgba(50,150,120,0.15)';
    ctx.beginPath(); ctx.arc(x + 16, 16, 10, 0, Math.PI * 2); ctx.fill();
    gridLines(ctx, x, '#40a878', 0.1);
  });

  // 16: REHAB - warm yellow/orange
  drawTile(TILE_ID.REHAB, x => {
    ctx.fillStyle = '#fef0b0'; ctx.fillRect(x, 0, W, W);
    ctx.fillStyle = '#f8e090';
    for (let row = 0; row < 4; row++) ctx.fillRect(x, row * 8, W, 1);
    // Running figure (simplified)
    ctx.fillStyle = 'rgba(180,140,20,0.12)';
    ctx.fillRect(x + 10, 6, 12, 20);
    gridLines(ctx, x, '#c0a020', 0.1);
  });

  // 17: OUTPATIENT - light blue
  drawTile(TILE_ID.OUTPATIENT, x => {
    ctx.fillStyle = '#c8e8f8'; ctx.fillRect(x, 0, W, W);
    checker(ctx, x, '#c0e0f0', '#b8d8e8', 16);
    gridLines(ctx, x, '#6090b0', 0.12);
  });

  // 18: PSYCH - soft lavender
  drawTile(TILE_ID.PSYCH, x => {
    ctx.fillStyle = '#e4d0f8'; ctx.fillRect(x, 0, W, W);
    ctx.fillStyle = '#d8c0f0';
    for (let row = 0; row < 4; row++) ctx.fillRect(x, row * 8, W, 1);
    ctx.fillStyle = 'rgba(140,80,200,0.1)';
    ctx.beginPath(); ctx.arc(x + 16, 16, 8, 0, Math.PI * 2); ctx.fill();
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
