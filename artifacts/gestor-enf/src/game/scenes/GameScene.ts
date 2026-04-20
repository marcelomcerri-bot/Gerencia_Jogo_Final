import * as Phaser from 'phaser';
import {
  TILE_SIZE, MAP_COLS, MAP_ROWS,
  CAMERA_ZOOM, SCENES, EVENTS, EVENTS as EV,
  INTERACTION_DISTANCE, GAME_MINUTES_PER_SECOND, ROOM_NAMES, TILE_ID,
} from '../constants';
import { generateMapTiles, NPC_DEFS, MISSIONS, CRISIS_EVENTS, getLevelInfo } from '../data/gameData';
import type { GameState, CrisisEvent } from '../data/gameData';
import { Player } from '../objects/Player';
import { NPC } from '../objects/NPC';
import { loadGame, saveGame } from '../utils/save';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private npcs: NPC[] = [];
  private mapData: number[][] = [];
  private wallLayer?: Phaser.Physics.Arcade.StaticGroup;
  private state!: GameState;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { up: Phaser.Input.Keyboard.Key; down: Phaser.Input.Keyboard.Key; left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key };
  private shiftKey!: Phaser.Input.Keyboard.Key;
  private eKey!: Phaser.Input.Keyboard.Key;
  private mKey!: Phaser.Input.Keyboard.Key;

  private timeAccum = 0;
  private currentRoom: number = TILE_ID.CORRIDOR;
  private nearbyNPC: NPC | null = null;
  private isDialogOpen = false;
  private isCrisisOpen = false;
  private missionOverlay: Phaser.GameObjects.Container | null = null;
  private crisisOverlay: Phaser.GameObjects.Container | null = null;

  private energyTimer = 0;
  private energyRestoreTimer = 0;
  private stressDecayTimer = 0;
  private lastHudEmit = 0;
  private crisisTimer = 0;
  private nextCrisisTime = 0;

  // Ambient lights/decor
  private ambientGfx!: Phaser.GameObjects.Graphics;
  private propColliders: Phaser.Physics.Arcade.StaticGroup | null = null;
  public interactionPoints: Array<{ x: number; y: number; type: 'work' | 'sit' | 'inspect' | 'rest' }> = [];

  // Lighting overlay
  private darkOverlay!: Phaser.GameObjects.RenderTexture;
  private glowBrush!: Phaser.GameObjects.Sprite;
  private additiveLightGroup!: Phaser.GameObjects.Group;
  private lightPoints: Array<{ x: number, y: number, radius: number, intensity: number, color?: number }> = [];

  constructor() { super({ key: SCENES.GAME }); }

  create() {
    this.state = loadGame();
    this.mapData = generateMapTiles();

    this.buildTilemap();
    this.buildWalls();
    this.propColliders = this.physics.add.staticGroup();
    this.buildEnvironmentalDecor();
    this.buildRoomLabels();
    this.spawnPlayer();
    this.spawnNPCs();
    this.setupInput();
    this.setupCamera();
    this.buildLighting();
    this.createVignette();

    this.scene.launch(SCENES.HUD);
    this.cameras.main.fadeIn(700);

    // Auto-save every 30s
    this.time.addEvent({ delay: 30000, loop: true, callback: () => saveGame(this.state) });

    // Schedule first crisis event (1-2 game minutes = 20-40s real)
    this.scheduleCrisis();

    this.emitHudUpdate();
    this.mKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.M);
  }

  // ─── TILEMAP ──────────────────────────────────────────────────────────────
  private buildTilemap() {
    const map = this.make.tilemap({ data: this.mapData, tileWidth: TILE_SIZE, tileHeight: TILE_SIZE });
    const tileset = map.addTilesetImage('tiles', 'tiles', TILE_SIZE, TILE_SIZE, 0, 0);
    if (!tileset) return;
    const layer = map.createLayer(0, tileset, 0, 0);
    if (!layer) return;
    layer.setDepth(0);
    this.physics.world.setBounds(0, 0, MAP_COLS * TILE_SIZE, MAP_ROWS * TILE_SIZE);
  }

  private buildWalls() {
    this.wallLayer = this.physics.add.staticGroup();
    for (let row = 0; row < MAP_ROWS; row++) {
      let startCol = -1;
      for (let col = 0; col <= MAP_COLS; col++) {
        const isBlocked = col < MAP_COLS && (this.mapData[row][col] === TILE_ID.WALL || this.mapData[row][col] === TILE_ID.GARDEN);
        if (isBlocked && startCol === -1) {
          startCol = col;
        } else if (!isBlocked && startCol !== -1) {
          const len = col - startCol;
          const wx = (startCol + len / 2) * TILE_SIZE;
          const wy = (row + 0.5) * TILE_SIZE;
          const body = this.wallLayer!.create(wx, wy, 'pixel') as Phaser.Physics.Arcade.Image;
          body.setVisible(false).setDisplaySize(len * TILE_SIZE, TILE_SIZE).refreshBody();
          startCol = -1;
        }
      }
    }
  }

  // ─── ENVIRONMENTAL DECOR & PROPS ───────────────────────────────────────────
  private buildEnvironmentalDecor() {
    this.ambientGfx = this.add.graphics().setDepth(1);
    const propsGfx = this.add.graphics().setDepth(2);

    // Deterministic room parsing
    const visited = Array.from({ length: MAP_ROWS }, () => Array(MAP_COLS).fill(false));

    for (let r = 0; r < MAP_ROWS; r++) {
      for (let c = 0; c < MAP_COLS; c++) {
        if (visited[r][c] || this.mapData[r][c] === TILE_ID.WALL || this.mapData[r][c] === TILE_ID.CORRIDOR) {
          visited[r][c] = true;
          continue;
        }

        const tid = this.mapData[r][c];
        // BFS to find room bounds
        let minR = r, maxR = r, minC = c, maxC = c;
        const q: [number, number][] = [[r, c]];
        visited[r][c] = true;

        while (q.length > 0) {
          const [cr, cc] = q.shift()!;
          if (cr < minR) minR = cr; if (cr > maxR) maxR = cr;
          if (cc < minC) minC = cc; if (cc > maxC) maxC = cc;

          const neighbors = [[1,0],[-1,0],[0,1],[0,-1]];
          for (const [dr, dc] of neighbors) {
            const nr = cr + dr, nc = cc + dc;
            if (nr >= 0 && nr < MAP_ROWS && nc >= 0 && nc < MAP_COLS && !visited[nr][nc] && this.mapData[nr][nc] === tid) {
              visited[nr][nc] = true;
              q.push([nr, nc]);
            }
          }
        }

        this.populateRoom(propsGfx, tid, minR, maxR, minC, maxC);
      }
    }

    // Walls, Corridors & Gardens pass
    for (let r = 0; r < MAP_ROWS; r++) {
      for (let c = 0; c < MAP_COLS; c++) {
        const tid = this.mapData[r][c];
        const bx = c * TILE_SIZE, by = r * TILE_SIZE;

        // Wall ambient drop shadow on the south tile floor
        if (tid === TILE_ID.WALL && r < MAP_ROWS - 1 && this.mapData[r+1][c] !== TILE_ID.WALL) {
           this.ambientGfx.fillStyle(0x000000, 0.15); // soft drop shadow
           this.ambientGfx.fillRect(bx, by + TILE_SIZE, TILE_SIZE, 8);
           this.ambientGfx.fillStyle(0x000000, 0.05);
           this.ambientGfx.fillRect(bx, by + TILE_SIZE + 8, TILE_SIZE, 4);
        }

        if (tid === TILE_ID.GARDEN) {
           if ((c % 4 === 0 && r % 4 === 0) && Math.random() < 0.6) {
             this.drawTree(propsGfx, bx, by);
           } else if (Math.random() < 0.05) {
             this.drawBush(propsGfx, bx, by);
           }
        } else if (tid === TILE_ID.CORRIDOR) {
           // Lights in corridor
           if (c % 6 === 0 && r % 6 === 0) {
              this.lightPoints.push({ x: bx + 16, y: by + 16, radius: 100, intensity: 0.3 });
           }
           // Hand sanitizer on north walls
           if (this.mapData[r-1] && this.mapData[r-1][c] === TILE_ID.WALL && c % 4 === 0) {
              this.drawHandSanitizer(propsGfx, bx, by);
           }
           // Occasional bench or bin
           if (Math.random() < 0.02 && this.isNearWall(r, c)) {
             this.drawBench(propsGfx, bx, by);
           }
        }
      }
    }
  }

  private isNearWall(r: number, c: number): boolean {
    if (r<=0 || r>=MAP_ROWS-1 || c<=0 || c>=MAP_COLS-1) return false;
    return this.mapData[r-1][c]===TILE_ID.WALL || this.mapData[r+1][c]===TILE_ID.WALL || this.mapData[r][c-1]===TILE_ID.WALL || this.mapData[r][c+1]===TILE_ID.WALL;
  }

  private addPropCollision(bx: number, by: number, w: number, h: number) {
     if (!this.propColliders) return;
     const body = this.propColliders.create(bx + w/2, by + h/2, 'pixel') as Phaser.Physics.Arcade.Image;
     body.setVisible(false).setDisplaySize(w, h).refreshBody();
  }

  // Draw enhanced props
  private populateRoom(g: Phaser.GameObjects.Graphics, tid: number, r1: number, r2: number, c1: number, c2: number) {
    const w = c2 - c1 + 1;
    const h = r2 - r1 + 1;
    
    // Choose light color based on room
    let roomColor = 0xffffff;
    if (tid === TILE_ID.ICU || tid === TILE_ID.EMERGENCY) roomColor = 0xcceeff; // clinical blue
    else if (tid === TILE_ID.WARD || tid === TILE_ID.MATERNITY) roomColor = 0xffeedd; // warm
    else if (tid === TILE_ID.GARDEN) roomColor = 0xddffdd; // outdoor green
    else if (tid === TILE_ID.RECEPTION || tid === TILE_ID.ADMIN) roomColor = 0xfffae6; // desk light

    // Room center light
    const cx = (c1 + w/2) * TILE_SIZE;
    const cy = (r1 + h/2) * TILE_SIZE;
    this.lightPoints.push({ x: cx, y: cy, radius: Math.max(w, h) * 20, intensity: 0.25, color: roomColor });

    for (let r = r1 + 1; r < r2; r += 2) {
      for (let c = c1 + 1; c < c2; c += 2) {
        const bx = c * TILE_SIZE, by = r * TILE_SIZE;
        
        if (tid === TILE_ID.WARD || tid === TILE_ID.ICU || tid === TILE_ID.MATERNITY) {
          if (c % 3 === 0) {
            this.drawHospitalBed(g, bx, by, tid === TILE_ID.ICU);
            this.interactionPoints.push({ x: bx, y: by, type: 'inspect' });
            if (tid === TILE_ID.ICU) this.lightPoints.push({ x: bx+16, y: by+16, radius: 45, intensity: 0.35, color: 0xa8ffe3 }); // green monitor glow
          }
        } else if (tid === TILE_ID.ADMIN || tid === TILE_ID.RECEPTION) {
          if (c % 4 === 1 && r % 3 === 1) {
            this.drawOfficeDesk(g, bx, by);
            this.interactionPoints.push({ x: bx, y: by, type: 'work' });
            this.lightPoints.push({ x: bx+16, y: by+16, radius: 60, intensity: 0.3, color: 0xaaccff }); // blue screen glow
          } else if (tid === TILE_ID.RECEPTION && c % 2 === 0 && r % 3 === 0) {
            this.drawWaitingChairs(g, bx, by);
            this.interactionPoints.push({ x: bx, y: by, type: 'sit' });
          } else if (tid === TILE_ID.ADMIN && c % 3 === 0 && r === r2 - 1) {
            this.drawFilingCabinet(g, bx, by);
          }
          if (c === c2 - 1 && r === r1 + 1) {
             this.drawPottedPlant(g, bx, by);
          }
        } else if (tid === TILE_ID.LAB || tid === TILE_ID.CME || tid === TILE_ID.PHARMACY) {
          if (r === r1 + 1 && c % 3 === 0) {
            this.drawLabCounter(g, bx, by, c2-c1 > 4 ? 64 : 32);
            this.interactionPoints.push({ x: bx, y: by, type: 'work' });
          } else if (r === r2 - 1 && c % 3 === 0) {
            this.drawCabinet(g, bx, by);
          }
        } else if (tid === TILE_ID.BREAK) {
           if (r === r1 + 2 && c === c1 + 2) {
             this.drawDiningTable(g, bx, by);
             this.interactionPoints.push({ x: bx, y: by, type: 'rest' });
           }
           if (r === r2 - 1 && c === c1 + 1) this.drawVendingMachine(g, bx, by);
        } else if (tid === TILE_ID.ONCOLOGY || tid === TILE_ID.REHAB) {
           if (c % 3 === 0) {
             this.drawChemoChair(g, bx, by);
             this.interactionPoints.push({ x: bx, y: by, type: 'inspect' });
           }
        }
      }
    }
  }

  private drawPottedPlant(g: Phaser.GameObjects.Graphics, bx: number, by: number) {
    this.addPropCollision(bx + 6, by + 6, 20, 20);
    g.fillStyle(0x000000, 0.2); g.fillCircle(bx + 16, by + 18, 12);
    g.fillStyle(0x8e44ad, 1); g.fillRect(bx + 10, by + 12, 12, 14); // Pot
    g.fillStyle(0x27ae60, 1); g.fillCircle(bx + 16, by + 8, 10); // Leaves
    g.fillStyle(0x2ecc71, 1); g.fillCircle(bx + 12, by + 12, 8); // Leaves
  }

  private drawFilingCabinet(g: Phaser.GameObjects.Graphics, bx: number, by: number) {
    this.addPropCollision(bx, by, 32, 16);
    g.fillStyle(0x000000, 0.2); g.fillRect(bx + 2, by + 2, 32, 16);
    g.fillStyle(0x7f8c8d, 1); g.fillRect(bx, by, 32, 16);
    g.fillStyle(0x95a5a6, 1); g.fillRect(bx + 2, by + 2, 12, 12);
    g.fillStyle(0x95a5a6, 1); g.fillRect(bx + 18, by + 2, 12, 12);
  }

  private drawWaitingChairs(g: Phaser.GameObjects.Graphics, bx: number, by: number) {
    this.addPropCollision(bx, by, 32, 16);
    g.fillStyle(0x000000, 0.2); g.fillRect(bx + 2, by + 4, 32, 14);
    // Frame
    g.fillStyle(0xbdc3c7, 1); g.fillRect(bx, by + 6, 32, 4);
    // Chairs (blue)
    g.fillStyle(0x2980b9, 1); 
    g.fillRoundedRect(bx + 2, by, 12, 14, 2);
    g.fillRoundedRect(bx + 18, by, 12, 14, 2);
  }

  private drawHandSanitizer(g: Phaser.GameObjects.Graphics, bx: number, by: number) {
    // Drawn projecting from the north wall down into the corridor
    g.fillStyle(0x000000, 0.3); g.fillRect(bx + 14, by - 6, 6, 12); // shadow
    g.fillStyle(0xecf0f1, 1); g.fillRoundedRect(bx + 12, by - 8, 8, 12, 2); // body
    g.fillStyle(0xbdc3c7, 1); g.fillRect(bx + 14, by + 4, 4, 2); // nozzle
    g.fillStyle(0x7f8c8d, 1); g.fillRect(bx + 13, by - 4, 6, 4); // logo
  }

  // --- Prop drawing routines (isometric-ish / top-down with shadow) ---
  private drawHospitalBed(g: Phaser.GameObjects.Graphics, bx: number, by: number, hasMonitor: boolean) {
    this.addPropCollision(bx + 2, by + 2, 28, 44);
    // Shadow
    g.fillStyle(0x000000, 0.2); g.fillRoundedRect(bx + 5, by + 5, 26, 42, 4);
    // Bed frame
    g.fillStyle(0xbdc3c7, 1); g.fillRoundedRect(bx + 3, by + 2, 26, 44, 3);
    // Mattress
    g.fillStyle(0xecf0f1, 1); g.fillRoundedRect(bx + 5, by + 5, 22, 38, 2);
    // Blanket (blue/green)
    g.fillStyle(hasMonitor ? 0x16a085 : 0x2980b9, 0.85); g.fillRoundedRect(bx + 5, by + 20, 22, 23, 2);
    // Pillow
    g.fillStyle(0xffffff, 1); g.fillRoundedRect(bx + 7, by + 7, 18, 10, 3);
    // Bedside table
    g.fillStyle(0x95a5a6, 1); g.fillRect(bx - 10, by + 4, 10, 12);
    
    if (hasMonitor) {
      // Monitor
      g.fillStyle(0x2c3e50, 1); g.fillRect(bx - 9, by + 2, 8, 10);
      g.fillStyle(0x00ff88, 0.5); g.fillRect(bx - 8, by + 3, 6, 6);
      
      const led = this.add.sprite(bx - 5 + 0.5, by + 1 + 0.5, 'red_led').setDepth(3).setOrigin(0.5);
      this.tweens.add({ targets: led, alpha: 0.1, duration: 600, yoyo: true, repeat: -1 });
    }
  }

  private drawOfficeDesk(g: Phaser.GameObjects.Graphics, bx: number, by: number) {
    this.addPropCollision(bx, by, 32, 24);
    g.fillStyle(0x000000, 0.15); g.fillRect(bx + 2, by + 2, 32, 24);
    g.fillStyle(0xc6a55c, 1); g.fillRect(bx, by, 32, 14); // desk top
    g.fillStyle(0xa6853c, 1); g.fillRect(bx, by+14, 32, 3); // desk edge
    // PC
    g.fillStyle(0x2c3e50, 1); g.fillRect(bx + 4, by + 2, 14, 8);
    g.fillStyle(0x3498db, 0.8); g.fillRect(bx + 5, by + 3, 12, 6);
    g.fillStyle(0x7f8c8d, 1); g.fillRect(bx + 4, by + 11, 14, 2); // keyboard
    // Chair
    g.fillStyle(0x34495e, 1); g.fillRoundedRect(bx + 8, by + 18, 12, 10, 3);
  }

  private drawLabCounter(g: Phaser.GameObjects.Graphics, bx: number, by: number, width: number) {
    this.addPropCollision(bx, by, width, 18);
    g.fillStyle(0x000000, 0.15); g.fillRect(bx + 2, by + 2, width, 18);
    g.fillStyle(0xd5e8c8, 1); g.fillRect(bx, by, width, 14);
    // Microscope/Equipment
    g.fillStyle(0x2c3e50, 1); g.fillRect(bx + 6, by + 2, 8, 10);
    g.fillStyle(0x95a5a6, 1); g.fillCircle(bx + 10, by + 6, 3);
  }

  private drawCabinet(g: Phaser.GameObjects.Graphics, bx: number, by: number) {
    this.addPropCollision(bx, by, 24, 16);
    g.fillStyle(0x000000, 0.2); g.fillRect(bx + 2, by + 2, 24, 16);
    g.fillStyle(0xbdc3c7, 1); g.fillRect(bx, by, 24, 14); // top
    g.fillStyle(0x7f8c8d, 1); g.fillRect(bx, by + 14, 24, 2); // shadow/edge
    g.fillStyle(0x95a5a6, 1); g.fillRect(bx + 2, by + 2, 8, 10); g.fillRect(bx + 14, by + 2, 8, 10);
  }

  private drawDiningTable(g: Phaser.GameObjects.Graphics, bx: number, by: number) {
    this.addPropCollision(bx, by, 32, 24);
    g.fillStyle(0x000000, 0.15); g.fillRoundedRect(bx + 2, by + 2, 32, 24, 4);
    g.fillStyle(0xe8c87a, 1); g.fillRoundedRect(bx, by, 32, 24, 4);
    // Chairs
    g.fillStyle(0x8B6914, 1);
    g.fillRoundedRect(bx + 4, by - 6, 8, 6, 2);
    g.fillRoundedRect(bx + 20, by - 6, 8, 6, 2);
    g.fillRoundedRect(bx + 4, by + 24, 8, 6, 2);
    g.fillRoundedRect(bx + 20, by + 24, 8, 6, 2);
  }

  private drawVendingMachine(g: Phaser.GameObjects.Graphics, bx: number, by: number) {
    this.addPropCollision(bx, by, 16, 24);
    g.fillStyle(0x000000, 0.2); g.fillRect(bx + 2, by + 2, 16, 24);
    g.fillStyle(0xe74c3c, 1); g.fillRect(bx, by, 16, 24);
    g.fillStyle(0x87d3f8, 0.6); g.fillRect(bx + 2, by + 2, 12, 12); // glass
  }

  private drawChemoChair(g: Phaser.GameObjects.Graphics, bx: number, by: number) {
    this.addPropCollision(bx, by, 20, 24);
    g.fillStyle(0x000000, 0.2); g.fillRoundedRect(bx + 2, by + 2, 20, 24, 5);
    g.fillStyle(0x4a9e7e, 1); g.fillRoundedRect(bx, by, 20, 20, 5); // seat
    g.fillStyle(0x3a8e6e, 1); g.fillRoundedRect(bx, by+14, 20, 10, 3); // footrest
    // IV Pole
    g.fillStyle(0xbdc3c7, 1); g.fillRect(bx + 22, by - 4, 3, 28);
    g.fillStyle(0xecf0f1, 0.8); g.fillRoundedRect(bx + 20, by - 10, 7, 12, 2); // bag
  }

  private drawTree(g: Phaser.GameObjects.Graphics, bx: number, by: number) {
     this.addPropCollision(bx + 10, by + 10, 12, 12);
     g.fillStyle(0x000000, 0.2); g.fillCircle(bx + 18, by + 18, 16);
     g.fillStyle(0x27ae60, 1); g.fillCircle(bx + 16, by + 14, 16);
     g.fillStyle(0x2ecc71, 0.8); g.fillCircle(bx + 12, by + 10, 10);
  }

  private drawBush(g: Phaser.GameObjects.Graphics, bx: number, by: number) {
     g.fillStyle(0x000000, 0.15); g.fillCircle(bx + 16, by + 18, 10);
     g.fillStyle(0x2ecc71, 1); g.fillCircle(bx + 16, by + 16, 10);
  }

  private drawBench(g: Phaser.GameObjects.Graphics, bx: number, by: number) {
     g.fillStyle(0x000000, 0.15); g.fillRect(bx + 2, by + 2, 28, 12);
     g.fillStyle(0xd35400, 1); g.fillRoundedRect(bx, by, 28, 10, 2);
     g.fillStyle(0xa04000, 1); g.fillRect(bx, by + 4, 28, 2);
  }

  // ─── LIGHTING OVERLAY ──────────────────────────────────────────────────────
  // Lighting overlay
  private buildLighting() {
    const w = this.scale.width;
    const h = this.scale.height;
    
    // Create the dark screen overlay
    this.darkOverlay = this.add.renderTexture(0, 0, w, h);
    this.darkOverlay.setOrigin(0, 0);
    this.darkOverlay.setDepth(90).setScrollFactor(0); // Fixed to camera

    // Create a brush for erasing
    this.glowBrush = this.make.sprite({ key: 'light_glow', add: false });
    this.glowBrush.setOrigin(0.5, 0.5);

    // Create the additive group for colored ambient lights
    this.additiveLightGroup = this.add.group();
  }

  // ─── ROOM LABELS ─────────────────────────────────────────────────────────
  private buildRoomLabels() {
    const labels: { col: number; row: number; text: string }[] = [
      { col: 6, row: 2,   text: '🚪 Recepção & Triagem' },
      { col: 18, row: 2,  text: '🚑 Pronto-Socorro' },
      { col: 30, row: 2,  text: '💊 Farmácia' },
      { col: 43, row: 2,  text: '🔬 Laboratório' },
      { col: 55, row: 2,  text: '📷 Imagem' },
      { col: 67, row: 2,  text: '🗂️ Diretoria' },
      { col: 5, row: 17,  text: '🔧 CME' },
      { col: 16, row: 17, text: '☕ Copa & Nutrição' },
      { col: 30, row: 17, text: '🛏️ Enfermaria' },
      { col: 45, row: 17, text: '🫀 UTI Adulto' },
      { col: 63, row: 17, text: '📋 Posto Enf. Central' },
      { col: 7, row: 31,  text: '🏥 Ambulatório' },
      { col: 20, row: 31, text: '👶 Maternidade' },
      { col: 34, row: 31, text: '💉 Oncologia' },
      { col: 48, row: 31, text: '🏃 Reabilitação' },
      { col: 64, row: 31, text: '🧠 Saúde Mental' },
    ];

    for (const lbl of labels) {
      this.add.text((lbl.col + 0.5) * TILE_SIZE, lbl.row * TILE_SIZE + 6, lbl.text, {
        fontFamily: "'VT323', monospace",
        fontSize: '14px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3,
      }).setOrigin(0.5, 0).setDepth(2).setAlpha(0.75);
    }
  }

  // ─── SPAWN ────────────────────────────────────────────────────────────────
  private spawnPlayer() {
    const startX = (7 + 0.5) * TILE_SIZE;
    const startY = (14 + 0.5) * TILE_SIZE;
    this.player = new Player(this, startX, startY);
    if (this.wallLayer) this.physics.add.collider(this.player, this.wallLayer);
    if (this.propColliders) this.physics.add.collider(this.player, this.propColliders);
  }

  private spawnNPCs() {
    for (const def of NPC_DEFS) {
      const npc = new NPC(this, def);
      if (this.wallLayer) this.physics.add.collider(npc, this.wallLayer);
      if (this.propColliders) this.physics.add.collider(npc, this.propColliders);
      npc.updateMissionStatus(this.state);
      this.npcs.push(npc);
    }
  }

  // ─── INPUT ────────────────────────────────────────────────────────────────
  private setupInput() {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      up:    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down:  this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left:  this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.shiftKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.eKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC).on('down', () => {
      if (this.isDialogOpen || this.isCrisisOpen) return;
      saveGame(this.state);
      this.cameras.main.fadeOut(400, 0, 0, 0, (_c: unknown, p: number) => {
        if (p === 1) this.scene.start(SCENES.MENU);
      });
    });
  }

  // ─── CAMERA ───────────────────────────────────────────────────────────────
  private setupCamera() {
    this.cameras.main
      .startFollow(this.player, true, 0.08, 0.08)
      .setZoom(CAMERA_ZOOM)
      .setBounds(0, 0, MAP_COLS * TILE_SIZE, MAP_ROWS * TILE_SIZE);
  }

  // ─── VIGNETTE ─────────────────────────────────────────────────────────────
  private createVignette() {
    const W = this.scale.width, H = this.scale.height;
    if (this.textures.exists('__vignette')) this.textures.remove('__vignette');
    const ct = this.textures.createCanvas('__vignette', W, H) as Phaser.Textures.CanvasTexture;
    const ctx = ct.getContext();
    const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.9);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ct.refresh();
    this.add.image(W / 2, H / 2, '__vignette').setDepth(100).setScrollFactor(0);
  }

  // ─── CRISIS SYSTEM ────────────────────────────────────────────────────────
  private scheduleCrisis() {
    // Next crisis in 60-120 game minutes (= 20-40 real seconds at 3 min/sec)
    this.nextCrisisTime = this.state.gameTime + Phaser.Math.Between(60, 120);
  }

  private triggerCrisis() {
    if (this.isCrisisOpen || this.isDialogOpen) {
      this.scheduleCrisis(); return;
    }

    const available = CRISIS_EVENTS.filter(e => {
      const lvl = getLevelInfo(this.state.prestige).level;
      return e.minCareerLevel <= lvl;
    });
    if (available.length === 0) { this.scheduleCrisis(); return; }

    const event = available[Phaser.Math.Between(0, available.length - 1)];
    this.showCrisisOverlay(event);
    this.state.crisisCount = (this.state.crisisCount || 0) + 1;
    this.scheduleCrisis();
  }

  private showCrisisOverlay(event: CrisisEvent) {
    this.isCrisisOpen = true;

    const W = this.scale.width, H = this.scale.height;
    const panelW = 680, panelH = 420;

    const container = this.add.container(W / 2, H / 2).setDepth(500).setScrollFactor(0);

    // Dimmer
    const dimmer = this.add.rectangle(0, 0, W * 2, H * 2, 0x000000, 0.7).setScrollFactor(0).setDepth(499);

    // Panel bg
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.5);
    shadow.fillRoundedRect(-panelW / 2 + 8, -panelH / 2 + 8, panelW, panelH, 16);

    const bg = this.add.graphics();
    bg.fillStyle(event.urgent ? 0x1a0505 : 0x0a1a2e, 1);
    bg.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 16);
    bg.lineStyle(4, event.urgent ? 0xe74c3c : 0xf39c12, 1);
    bg.strokeRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 16);

    // Urgent pulse effect
    if (event.urgent) {
      this.tweens.add({
        targets: bg, alpha: 0.85, duration: 300, yoyo: true, repeat: 5,
      });
    }

    // Title
    const titleText = this.add.text(0, -panelH / 2 + 30, event.title, {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '13px',
      color: event.urgent ? '#ff6b6b' : '#f39c12',
      wordWrap: { width: panelW - 40 },
      align: 'center',
    }).setOrigin(0.5);

    // Description
    const desc = this.add.text(0, -panelH / 2 + 75, event.description, {
      fontFamily: "'VT323', monospace",
      fontSize: '22px',
      color: '#ecf0f1',
      wordWrap: { width: panelW - 60 },
      align: 'center',
    }).setOrigin(0.5);

    // Choices
    const choiceItems: Phaser.GameObjects.GameObject[] = [];
    const startY = -panelH / 2 + 145;
    const btnH = 68;
    const btnW = panelW - 60;

    event.choices.forEach((choice, idx) => {
      const cy = startY + idx * (btnH + 8);

      const btnBg = this.add.graphics();
      btnBg.fillStyle(0x1e3a5f, 1);
      btnBg.fillRoundedRect(-btnW / 2, cy - btnH / 2, btnW, btnH, 8);
      btnBg.lineStyle(2, 0x3498db, 1);
      btnBg.strokeRoundedRect(-btnW / 2, cy - btnH / 2, btnW, btnH, 8);

      const numTxt = this.add.text(-btnW / 2 + 16, cy, `${idx + 1}`, {
        fontFamily: "'Press Start 2P', monospace",
        fontSize: '13px',
        color: '#f39c12',
      }).setOrigin(0, 0.5);

      const choiceTxt = this.add.text(-btnW / 2 + 36, cy, choice.text, {
        fontFamily: "'VT323', monospace",
        fontSize: '20px',
        color: '#ecf0f1',
        wordWrap: { width: btnW - 50 },
        lineSpacing: 2,
      }).setOrigin(0, 0.5);

      // Interactive zone
      const zone = this.add.zone(-btnW / 2, cy - btnH / 2, btnW, btnH).setOrigin(0)
        .setInteractive({ cursor: 'pointer' });

      zone.on('pointerover', () => {
        btnBg.clear();
        btnBg.fillStyle(0x2563a8, 1);
        btnBg.fillRoundedRect(-btnW / 2, cy - btnH / 2, btnW, btnH, 8);
        btnBg.lineStyle(3, 0xf1c40f, 1);
        btnBg.strokeRoundedRect(-btnW / 2, cy - btnH / 2, btnW, btnH, 8);
      });

      zone.on('pointerout', () => {
        btnBg.clear();
        btnBg.fillStyle(0x1e3a5f, 1);
        btnBg.fillRoundedRect(-btnW / 2, cy - btnH / 2, btnW, btnH, 8);
        btnBg.lineStyle(2, 0x3498db, 1);
        btnBg.strokeRoundedRect(-btnW / 2, cy - btnH / 2, btnW, btnH, 8);
      });

      zone.on('pointerdown', () => this.resolveCrisis(event, idx, container, dimmer));
      this.input.keyboard?.once(`keydown-${idx + 1}`, () => this.resolveCrisis(event, idx, container, dimmer));

      choiceItems.push(btnBg, numTxt, choiceTxt, zone);
    });

    // Countdown timer bar
    const timerBg = this.add.graphics();
    timerBg.fillStyle(0x2c3e50, 1);
    timerBg.fillRoundedRect(-panelW / 2 + 20, panelH / 2 - 30, panelW - 40, 15, 7);

    const timerFill = this.add.graphics();
    const timerDur = event.urgent ? 15000 : 25000;
    let elapsed = 0;

    const timerUpdate = () => {
      elapsed += 200;
      const pct = Math.max(0, 1 - elapsed / timerDur);
      const col = pct > 0.5 ? 0x2ecc71 : pct > 0.25 ? 0xf39c12 : 0xe74c3c;
      timerFill.clear();
      timerFill.fillStyle(col, 1);
      timerFill.fillRoundedRect(-panelW / 2 + 20, panelH / 2 - 30, (panelW - 40) * pct, 15, 7);
      if (pct === 0 && this.isCrisisOpen) {
        // Auto-resolve with worst choice on timeout
        this.resolveCrisis(event, event.choices.length - 1, container, dimmer);
      }
    };

    const timerEvent = this.time.addEvent({ delay: 200, repeat: timerDur / 200, callback: timerUpdate });

    container.add([shadow, bg, titleText, desc, ...choiceItems, timerBg, timerFill]);

    // Animate in
    container.setScale(0.9).setAlpha(0);
    this.tweens.add({ targets: container, scale: 1, alpha: 1, duration: 250, ease: 'Back.easeOut' });

    container.setData('timerEvent', timerEvent);
    this.crisisOverlay = container;
  }

  private resolveCrisis(event: CrisisEvent, choiceIdx: number, container: Phaser.GameObjects.Container, dimmer: Phaser.GameObjects.Rectangle) {
    if (!this.isCrisisOpen) return;
    this.isCrisisOpen = false;

    const choice = event.choices[choiceIdx];
    const timerEv = container.getData('timerEvent') as Phaser.Time.TimerEvent;
    timerEv?.remove();

    // Apply effects
    this.state.prestige = Math.max(0, this.state.prestige + choice.prestigeEffect);
    this.state.energy = Math.max(0, Math.min(100, this.state.energy + choice.energyEffect));
    this.state.stress = Math.max(0, Math.min(100, (this.state.stress || 0) + choice.stressEffect));
    this.state.decisionLog = [...(this.state.decisionLog || []), `${event.id}:${choiceIdx}`].slice(-20);

    // Show feedback panel
    this.showCrisisFeedback(choice.feedback, choice.correct, choice.prestigeEffect, container, dimmer);
  }

  private showCrisisFeedback(text: string, correct: boolean, pts: number, crisisContainer: Phaser.GameObjects.Container, dimmer: Phaser.GameObjects.Rectangle) {
    // Remove crisis panel
    this.tweens.add({
      targets: crisisContainer, alpha: 0, y: crisisContainer.y - 20, duration: 200,
      onComplete: () => crisisContainer.destroy(),
    });

    const W = this.scale.width, H = this.scale.height;
    const fbW = 600, fbH = 140;
    const fb = this.add.container(W / 2, H / 2 - 80).setDepth(501).setScrollFactor(0);

    const bg = this.add.graphics();
    bg.fillStyle(correct ? 0x0a2a1a : 0x2a0a0a, 1);
    bg.fillRoundedRect(-fbW / 2, -fbH / 2, fbW, fbH, 12);
    bg.lineStyle(3, correct ? 0x2ecc71 : 0xe74c3c, 1);
    bg.strokeRoundedRect(-fbW / 2, -fbH / 2, fbW, fbH, 12);

    const icon = this.add.text(-fbW / 2 + 30, 0, correct ? '✅' : '⚠️', { fontSize: '32px' }).setOrigin(0, 0.5);

    const ptsSign = pts >= 0 ? '+' : '';
    const ptsLabel = this.add.text(-fbW / 2 + 70, -fbH / 2 + 18,
      `${correct ? 'CORRETO!' : 'ATENÇÃO!'} ${ptsSign}${pts} pts`, {
        fontFamily: "'Press Start 2P', monospace",
        fontSize: '11px',
        color: correct ? '#2ecc71' : '#e74c3c',
      });

    const feedTxt = this.add.text(-fbW / 2 + 70, -fbH / 2 + 48, text, {
      fontFamily: "'VT323', monospace",
      fontSize: '19px',
      color: '#ecf0f1',
      wordWrap: { width: fbW - 90 },
    });

    fb.add([bg, icon, ptsLabel, feedTxt]);
    fb.setScale(0.9).setAlpha(0);
    this.tweens.add({
      targets: fb, scale: 1, alpha: 1, duration: 250, ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: [fb, dimmer], alpha: 0, duration: 400, delay: 4000,
          onComplete: () => { fb.destroy(); dimmer.destroy(); this.crisisOverlay = null; },
        });
      },
    });

    // Show prestige change
    const colorStr = pts >= 0 ? '#2ecc71' : '#e74c3c';
    this.showFloatingText(this.player.x, this.player.y - 40, `${pts >= 0 ? '+' : ''}${pts} pts`, colorStr, 28);
    this.emitHudUpdate();
  }

  // ─── UPDATE ───────────────────────────────────────────────────────────────
  update(time: number, delta: number) {
    if (this.isDialogOpen || this.isCrisisOpen) return;

    // Movement
    const up    = this.cursors.up.isDown    || this.wasd.up.isDown;
    const down  = this.cursors.down.isDown  || this.wasd.down.isDown;
    const left  = this.cursors.left.isDown  || this.wasd.left.isDown;
    const right = this.cursors.right.isDown || this.wasd.right.isDown;
    const sprint = this.shiftKey.isDown && this.state.energy > 10;
    this.player.move(up, down, left, right, delta, sprint);

    // NPC AI update
    for (const npc of this.npcs) npc.update(delta);

    // Detect nearby NPC
    this.detectNearbyNPC();

    // Interaction
    if (Phaser.Input.Keyboard.JustDown(this.eKey) && this.nearbyNPC) {
      this.openDialog(this.nearbyNPC);
    }

    // Mission overlay toggle
    if (Phaser.Input.Keyboard.JustDown(this.mKey)) {
      this.toggleMissionOverlay();
    }

    // Game time advance
    this.timeAccum += delta;
    if (this.timeAccum >= 1000) {
      this.timeAccum -= 1000;
      this.state.gameTime += GAME_MINUTES_PER_SECOND;
      if (this.state.gameTime >= 1440) {
        this.state.gameTime -= 1440;
        this.state.day = (this.state.day || 1) + 1;
      }
    }

    // Crisis timer
    this.crisisTimer += delta;
    if (this.crisisTimer >= 1000) {
      this.crisisTimer -= 1000;
      if (this.state.gameTime >= this.nextCrisisTime) {
        this.triggerCrisis();
      }
    }

    // Energy depletion (every 6s = 1 point; sprint costs more)
    this.energyTimer += delta;
    const energyDrain = sprint ? 3000 : 7000;
    if (this.energyTimer >= energyDrain && this.state.energy > 0) {
      this.energyTimer = 0;
      this.state.energy = Math.max(0, this.state.energy - 1);
    }

    // Room detection
    const col = Math.floor(this.player.x / TILE_SIZE);
    const row = Math.floor(this.player.y / TILE_SIZE);
    const tileId = (row >= 0 && row < MAP_ROWS && col >= 0 && col < MAP_COLS)
      ? this.mapData[row][col] : TILE_ID.CORRIDOR;

    // Break room: restore energy and reduce stress
    if (tileId === TILE_ID.BREAK) {
      this.energyRestoreTimer += delta;
      if (this.energyRestoreTimer >= 1500 && this.state.energy < 100) {
        this.energyRestoreTimer = 0;
        this.state.energy = Math.min(100, this.state.energy + 6);
        this.showFloatingText(this.player.x, this.player.y - 30, '+6 ⚡', '#f1c40f');
      }
      // Also reduce stress
      this.stressDecayTimer += delta;
      if (this.stressDecayTimer >= 3000 && this.state.stress > 0) {
        this.stressDecayTimer = 0;
        this.state.stress = Math.max(0, this.state.stress - 3);
      }
    } else {
      this.energyRestoreTimer = 0;
      this.stressDecayTimer = 0;
    }

    // Garden: gentle stress reduction
    if (tileId === TILE_ID.GARDEN) {
      this.stressDecayTimer += delta;
      if (this.stressDecayTimer >= 5000 && this.state.stress > 0) {
        this.stressDecayTimer = 0;
        this.state.stress = Math.max(0, this.state.stress - 1);
      }
    }

    // Room change event
    if (tileId !== this.currentRoom) {
      this.currentRoom = tileId;
      const roomName = ROOM_NAMES[tileId] || '';
      if (roomName) this.events.emit(EV.ROOM_CHANGE, roomName);
    }

    // Update Lighting
    this.updateLighting();

    // HUD update (throttled)
    if (time - this.lastHudEmit > 300) {
      this.lastHudEmit = time;
      this.emitHudUpdate();
    }
  }

  private updateLighting() {
    const cam = this.cameras.main;
    const w = this.scale.width;
    const h = this.scale.height;
    
    // Fill the screen with semi-transparent dark blue/black
    this.darkOverlay.clear();
    this.darkOverlay.fill(0x0a101f, 0.90);

    const px = this.player.x - cam.worldView.x;
    const py = this.player.y - cam.worldView.y;

    // Clear previous frame's additive lights
    this.additiveLightGroup.clear(true, true);

    // Use glow brush to erase light spots extremely fast natively
    const drawLight = (lx: number, ly: number, targetRadius: number, intensity: number, color?: number) => {
      // Glow texture is 256x256, so base radius is 128
      const scale = targetRadius / 128;
      this.glowBrush.setScale(scale);
      this.glowBrush.setAlpha(intensity);
      this.glowBrush.setPosition(lx, ly);
      this.darkOverlay.erase(this.glowBrush);

      // If it's a colored light, add an additive Sprite to physically tint the room in the world
      if (color !== undefined) {
         const cl = this.additiveLightGroup.create(lx + cam.worldView.x, ly + cam.worldView.y, 'light_glow') as Phaser.GameObjects.Sprite;
         cl.setScale(scale).setTint(color).setAlpha(intensity * 0.45).setBlendMode(Phaser.BlendModes.ADD).setDepth(89);
      }
    };

    // Static lights
    for (const lp of this.lightPoints) {
       const lx = lp.x - cam.worldView.x;
       const ly = lp.y - cam.worldView.y;
       // Only draw if on screen
       if (lx > -lp.radius && lx < w + lp.radius && ly > -lp.radius && ly < h + lp.radius) {
         drawLight(lx, ly, lp.radius, lp.intensity, lp.color);
       }
    }

    // Player light
    drawLight(px, py, 140, 1);
  }

  // ─── HELPERS ──────────────────────────────────────────────────────────────
  private detectNearbyNPC() {
    let closest: NPC | null = null, minDist = INTERACTION_DISTANCE;
    for (const npc of this.npcs) {
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.x, npc.y);
      if (d < minDist) { minDist = d; closest = npc; }
    }
    if (closest !== this.nearbyNPC) {
      this.nearbyNPC = closest;
      if (closest) {
        this.events.emit(EV.INTERACTION_HINT, `[E] Falar com ${closest.def.name}`);
      } else {
        this.events.emit(EV.INTERACTION_HINT, 'WASD/Setas: Mover  |  SHIFT: Correr  |  E: Interagir  |  M: Missões  |  ESC: Menu');
      }
    }
  }

  private openDialog(npc: NPC) {
    this.isDialogOpen = true;
    const dialogue = npc.getDialogue(this.state);
    this.scene.launch(SCENES.DIALOG, {
      npcDef: npc.def,
      dialogue,
      state: this.state,
      onClose: (updates: Partial<GameState>) => {
        this.state = { ...this.state, ...updates };
        this.isDialogOpen = false;
        for (const n of this.npcs) n.updateMissionStatus(this.state);
        saveGame(this.state);
        this.emitHudUpdate();
        this.events.emit(EV.INTERACTION_HINT, '');
        this.checkMilestones();
      },
    });
  }

  private checkMilestones() {
    if (this.state.completedMissions.length === MISSIONS.length) {
      this.showFloatingText(this.player.x, this.player.y - 60, '🏆 TODAS AS MISSÕES CONCLUÍDAS!', '#f1c40f', 24);
    }
  }

  private toggleMissionOverlay() {
    if (this.missionOverlay) { this.missionOverlay.destroy(); this.missionOverlay = null; return; }

    const W = this.scale.width, H = this.scale.height;
    const panelW = 520, panelH = Math.min(560, H - 80);
    const c = this.add.container(W / 2, H / 2).setDepth(300).setScrollFactor(0);

    const bg = this.add.graphics();
    bg.fillStyle(0x0a0f1e, 0.97);
    bg.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 16);
    bg.lineStyle(3, 0x1abc9c, 1);
    bg.strokeRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 16);

    const title = this.add.text(0, -panelH / 2 + 22, '📋  MISSÕES  DO  HUAP', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '11px',
      color: '#1abc9c',
    }).setOrigin(0.5);

    const lvInfo = getLevelInfo(this.state.prestige);
    const careerTxt = this.add.text(0, -panelH / 2 + 44,
      `${lvInfo.title} · ⭐ ${this.state.prestige} pts`, {
        fontFamily: "'VT323', monospace",
        fontSize: '19px',
        color: '#f1c40f',
      }).setOrigin(0.5);

    const closeBtn = this.add.text(panelW / 2 - 18, -panelH / 2 + 16, '✕', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '11px',
      color: '#e74c3c',
    }).setInteractive({ cursor: 'pointer' })
      .on('pointerdown', () => { c.destroy(); this.missionOverlay = null; });

    const items: Phaser.GameObjects.Text[] = [];
    let y = -panelH / 2 + 68;

    // Group by category
    const categories = [...new Set(MISSIONS.map(m => m.category))];
    for (const cat of categories) {
      const catMissions = MISSIONS.filter(m => m.category === cat);
      const catLabel = this.add.text(-panelW / 2 + 14, y, `── ${cat}`, {
        fontFamily: "'Press Start 2P', monospace",
        fontSize: '8px',
        color: '#7f8c8d',
      });
      items.push(catLabel);
      y += 16;

      for (const m of catMissions) {
        const done = this.state.completedMissions.includes(m.id);
        const active = !!this.state.missionProgress[m.id] && !done;
        const locked = !done && !active && m.prerequisiteIds.some(id => !this.state.completedMissions.includes(id));

        const icon = done ? '✅' : active ? '▶' : locked ? '🔒' : '○';
        const col = done ? '#2ecc71' : active ? '#f1c40f' : locked ? '#636e72' : '#bdc3c7';

        const line = this.add.text(-panelW / 2 + 14, y, `${icon} ${m.title} (+${m.prestige}pts)`, {
          fontFamily: "'VT323', monospace",
          fontSize: '17px',
          color: col,
        });
        items.push(line);
        y += 19;
      }
      y += 4;
    }

    const done = this.state.completedMissions.length;
    const total = MISSIONS.length;
    const pct = (done / total * 100) | 0;

    const prog = this.add.text(0, panelH / 2 - 22,
      `Progresso: ${done}/${total} (${pct}%)  |  Stress: ${Math.floor(this.state.stress || 0)}%`, {
        fontFamily: "'VT323', monospace",
        fontSize: '16px',
        color: '#bdc3c7',
      }).setOrigin(0.5);

    c.add([bg, title, careerTxt, closeBtn, ...items, prog]);
    this.mKey.once('down', () => { c.destroy(); this.missionOverlay = null; });
    this.missionOverlay = c;
  }

  private emitHudUpdate() {
    const activeMission = MISSIONS.find(m =>
      this.state.missionProgress[m.id] && !this.state.completedMissions.includes(m.id)
    );
    this.events.emit(EVENTS.HUD_UPDATE, {
      state: this.state,
      playerX: this.player.x,
      playerY: this.player.y,
      activeMission: activeMission?.title,
    });
  }

  private showFloatingText(x: number, y: number, msg: string, color: string, size = 22) {
    const txt = this.add.text(x, y, msg, {
      fontFamily: "'VT323', monospace",
      fontSize: `${size}px`,
      color,
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(50);
    this.tweens.add({
      targets: txt, y: y - 50, alpha: 0, duration: 1800,
      ease: 'Power2', onComplete: () => txt.destroy(),
    });
  }
}
