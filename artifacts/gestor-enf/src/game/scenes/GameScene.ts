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
import { playMusic, fadeOutMusic } from '../utils/audio';

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
  private escKey!: Phaser.Input.Keyboard.Key;

  private timeAccum = 0;
  private currentRoom: number = TILE_ID.CORRIDOR;
  private nearbyNPC: NPC | null = null;
  private isDialogOpen = false;
  private isCrisisOpen = false;
  
  private energyTimer = 0;
  private energyRestoreTimer = 0;
  private stressDecayTimer = 0;
  private lastHudEmit = 0;
  private crisisTimer = 0;
  private nextCrisisTime = 0;

  // Ambient lights/decor
  private darkOverlay!: Phaser.GameObjects.RenderTexture;
  private glowBrush!: Phaser.GameObjects.Sprite;
  private additiveLightGroup!: Phaser.GameObjects.Group;
  
  private ambientGfx!: Phaser.GameObjects.Graphics;
  private propColliders: Phaser.Physics.Arcade.StaticGroup | null = null;
  public interactionPoints: Array<{ x: number; y: number; type: 'work' | 'sit' | 'inspect' | 'rest' }> = [];

  constructor() { super({ key: SCENES.GAME }); }

  create() {
    // Raise the Arcade physics maxDelta from its default (1/60 s ≈ 16ms) to
    // 100ms so that at 30fps the physics step uses the real ~33ms delta
    // instead of being capped to half, which caused persistent 0.5x speed.
    (this.physics.world as any).maxDelta = 0.1;

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

    this.scene.launch(SCENES.HUD);
    this.cameras.main.fadeIn(700);
    playMusic('game');

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

    // Bake both static Graphics into RenderTextures so they render as a
    // single drawImage/draw call per frame instead of hundreds of shape commands.
    const worldW = MAP_COLS * TILE_SIZE;
    const worldH = MAP_ROWS * TILE_SIZE;

    const ambientRT = this.add.renderTexture(0, 0, worldW, worldH).setOrigin(0, 0).setDepth(1);
    ambientRT.draw(this.ambientGfx, 0, 0);
    this.ambientGfx.destroy();

    const propsRT = this.add.renderTexture(0, 0, worldW, worldH).setOrigin(0, 0).setDepth(2);
    propsRT.draw(propsGfx, 0, 0);
    propsGfx.destroy();
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

    for (let r = r1 + 1; r < r2; r += 2) {
      for (let c = c1 + 1; c < c2; c += 2) {
        const bx = c * TILE_SIZE, by = r * TILE_SIZE;
        
        if (tid === TILE_ID.WARD || tid === TILE_ID.ICU || tid === TILE_ID.MATERNITY) {
          if (c % 3 === 0) {
            this.drawHospitalBed(g, bx, by, tid === TILE_ID.ICU);
            this.interactionPoints.push({ x: bx, y: by, type: 'inspect' });
          }
        } else if (tid === TILE_ID.ADMIN || tid === TILE_ID.RECEPTION) {
          if (c % 4 === 1 && r % 3 === 1) {
            this.drawOfficeDesk(g, bx, by);
            this.interactionPoints.push({ x: bx, y: by, type: 'work' });
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
        } else if (tid === TILE_ID.EMERGENCY) {
           // Trauma stretchers along one wall, defibrillator near entrance
           if (c % 3 === 0 && r % 2 === 0) {
             this.drawTraumaStretcher(g, bx, by);
             this.interactionPoints.push({ x: bx, y: by, type: 'inspect' });
           }
           if (r === r1 + 1 && c === c1 + 1) {
             this.drawDefibrillator(g, bx, by);
             this.interactionPoints.push({ x: bx, y: by, type: 'work' });
           }
        } else if (tid === TILE_ID.RADIOLOGY) {
           // One CT scanner centerpiece + supporting cabinets
           if (r === r1 + 2 && c === c1 + 2) {
             this.drawCTScanner(g, bx, by);
             this.interactionPoints.push({ x: bx, y: by, type: 'work' });
           } else if (r === r2 - 1 && c % 3 === 0) {
             this.drawCabinet(g, bx, by);
           }
        } else if (tid === TILE_ID.NURSING) {
           // Long counter desk + filing cabinets (the central nursing station)
           if (r === r1 + 1 && c % 3 === 0) {
             this.drawNursingDesk(g, bx, by);
             this.interactionPoints.push({ x: bx, y: by, type: 'work' });
           } else if (r === r2 - 1 && c % 3 === 0) {
             this.drawFilingCabinet(g, bx, by);
           }
        } else if (tid === TILE_ID.OUTPATIENT) {
           // Exam tables in a row with chairs scattered
           if (c % 3 === 0 && r % 2 === 0) {
             this.drawExamTable(g, bx, by);
             this.interactionPoints.push({ x: bx, y: by, type: 'inspect' });
           }
           if (c === c2 - 1 && r === r1 + 1) this.drawPottedPlant(g, bx, by);
        } else if (tid === TILE_ID.PSYCH) {
           // Therapy sofa + plants for a calm atmosphere
           if (r === r1 + 1 && c === c1 + 1) {
             this.drawTherapySofa(g, bx, by);
             this.interactionPoints.push({ x: bx, y: by, type: 'sit' });
           } else if (c % 3 === 0 && r === r2 - 1) {
             this.drawTherapyPlant(g, bx, by);
           }
        }
      }
    }
  }

  private drawTraumaStretcher(g: Phaser.GameObjects.Graphics, bx: number, by: number) {
    this.addPropCollision(bx + 2, by + 2, 28, 44);
    g.fillStyle(0x000000, 0.2); g.fillRoundedRect(bx + 5, by + 5, 26, 42, 4);
    g.fillStyle(0x95a5a6, 1); g.fillRoundedRect(bx + 3, by + 2, 26, 44, 3);
    g.fillStyle(0xecf0f1, 1); g.fillRoundedRect(bx + 5, by + 5, 22, 38, 2);
    g.fillStyle(0xc0392b, 0.9); g.fillRoundedRect(bx + 5, by + 18, 22, 25, 2); // red trauma blanket
    g.fillStyle(0xffffff, 1); g.fillRoundedRect(bx + 7, by + 7, 18, 9, 3);
    // IV pole
    g.fillStyle(0xbdc3c7, 1); g.fillRect(bx + 30, by - 4, 3, 28);
    g.fillStyle(0xecf0f1, 0.9); g.fillRoundedRect(bx + 28, by - 10, 7, 12, 2);
    // Wheels
    g.fillStyle(0x2c3e50, 1);
    g.fillCircle(bx + 6, by + 47, 2);
    g.fillCircle(bx + 26, by + 47, 2);
  }

  private drawDefibrillator(g: Phaser.GameObjects.Graphics, bx: number, by: number) {
    this.addPropCollision(bx, by, 24, 24);
    g.fillStyle(0x000000, 0.25); g.fillRoundedRect(bx + 2, by + 2, 24, 24, 4);
    g.fillStyle(0xf1c40f, 1); g.fillRoundedRect(bx, by, 24, 24, 4);
    // Screen
    g.fillStyle(0x2c3e50, 1); g.fillRoundedRect(bx + 4, by + 4, 16, 8, 2);
    g.fillStyle(0x00ff88, 0.7); g.fillRect(bx + 6, by + 6, 12, 4);
    // Heart icon
    g.fillStyle(0xe74c3c, 1);
    g.fillCircle(bx + 10, by + 17, 2);
    g.fillCircle(bx + 14, by + 17, 2);
    g.fillTriangle(bx + 8, by + 18, bx + 16, by + 18, bx + 12, by + 22);
    // Status LED on lid
    const led = this.add.sprite(bx + 21, by + 3, 'red_led').setDepth(3).setOrigin(0.5);
    this.tweens.add({ targets: led, alpha: 0.2, duration: 700, yoyo: true, repeat: -1 });
  }

  private drawCTScanner(g: Phaser.GameObjects.Graphics, bx: number, by: number) {
    this.addPropCollision(bx, by, 64, 32);
    g.fillStyle(0x000000, 0.25); g.fillRoundedRect(bx + 4, by + 4, 64, 32, 8);
    g.fillStyle(0xecf0f1, 1); g.fillRoundedRect(bx, by, 64, 32, 8); // housing
    g.fillStyle(0xbdc3c7, 1); g.fillRoundedRect(bx + 4, by + 4, 56, 24, 6);
    // Bore
    g.fillStyle(0x2c3e50, 1); g.fillCircle(bx + 32, by + 16, 11);
    g.fillStyle(0x1abc9c, 0.45); g.fillCircle(bx + 32, by + 16, 8);
    g.fillStyle(0x16a085, 0.9); g.fillCircle(bx + 32, by + 16, 4);
    // Patient table sliding out
    g.fillStyle(0x95a5a6, 1); g.fillRect(bx + 24, by + 28, 16, 6);
    // Branding stripe
    g.fillStyle(0x3498db, 1); g.fillRect(bx, by + 30, 64, 2);
  }

  private drawNursingDesk(g: Phaser.GameObjects.Graphics, bx: number, by: number) {
    this.addPropCollision(bx, by, 64, 18);
    g.fillStyle(0x000000, 0.2); g.fillRect(bx + 3, by + 3, 64, 18);
    g.fillStyle(0xecf0f1, 1); g.fillRoundedRect(bx, by, 64, 14, 3); // counter top
    g.fillStyle(0xbdc3c7, 1); g.fillRect(bx, by + 14, 64, 4); // edge
    // Two monitors
    g.fillStyle(0x2c3e50, 1);
    g.fillRect(bx + 8, by + 2, 14, 9);
    g.fillRect(bx + 42, by + 2, 14, 9);
    g.fillStyle(0x3498db, 0.7);
    g.fillRect(bx + 9, by + 3, 12, 7);
    g.fillRect(bx + 43, by + 3, 12, 7);
    // Phone
    g.fillStyle(0xe74c3c, 1); g.fillRoundedRect(bx + 28, by + 4, 8, 5, 1);
    g.fillStyle(0x2c3e50, 1); g.fillRect(bx + 30, by + 5, 4, 1);
  }

  private drawExamTable(g: Phaser.GameObjects.Graphics, bx: number, by: number) {
    this.addPropCollision(bx, by, 28, 32);
    g.fillStyle(0x000000, 0.18); g.fillRoundedRect(bx + 3, by + 3, 28, 32, 3);
    g.fillStyle(0x95a5a6, 1); g.fillRoundedRect(bx, by, 28, 32, 3);
    g.fillStyle(0xfdebd0, 1); g.fillRoundedRect(bx + 2, by + 2, 24, 28, 3);
    // Paper roll at head end
    g.fillStyle(0xffffff, 0.95); g.fillRect(bx + 2, by + 2, 24, 5);
    g.fillStyle(0xecf0f1, 1); g.fillRect(bx + 2, by + 7, 24, 1);
    // BP cuff hanging
    g.fillStyle(0x2c3e50, 1); g.fillRoundedRect(bx + 10, by + 14, 8, 4, 1);
  }

  private drawTherapySofa(g: Phaser.GameObjects.Graphics, bx: number, by: number) {
    this.addPropCollision(bx, by, 36, 18);
    g.fillStyle(0x000000, 0.18); g.fillRoundedRect(bx + 3, by + 3, 36, 18, 4);
    g.fillStyle(0x6c5ce7, 1); g.fillRoundedRect(bx, by, 36, 18, 4);
    g.fillStyle(0x8e7cc9, 1); g.fillRoundedRect(bx + 2, by + 2, 32, 8, 3); // backrest
    // Seat seams
    g.fillStyle(0x4a3a99, 1);
    g.fillRect(bx + 12, by + 3, 1, 12);
    g.fillRect(bx + 24, by + 3, 1, 12);
    // Throw pillow
    g.fillStyle(0xfdcb6e, 1); g.fillRoundedRect(bx + 4, by + 10, 7, 6, 2);
  }

  private drawTherapyPlant(g: Phaser.GameObjects.Graphics, bx: number, by: number) {
    this.addPropCollision(bx + 6, by + 6, 20, 20);
    g.fillStyle(0x000000, 0.2); g.fillCircle(bx + 16, by + 18, 12);
    g.fillStyle(0x8e44ad, 1); g.fillRect(bx + 11, by + 14, 10, 10);
    // Tall fronds
    g.fillStyle(0x27ae60, 1); g.fillTriangle(bx + 16, by - 4, bx + 8, by + 16, bx + 24, by + 16);
    g.fillStyle(0x2ecc71, 0.85); g.fillTriangle(bx + 16, by, bx + 11, by + 14, bx + 21, by + 14);
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
    
    // Patient (Head) - occasionally absent, but mostly present
    if (Math.random() < 0.8) {
      g.fillStyle(0xf5c5a3, 1); // skin color
      g.beginPath(); g.arc(bx + 16, by + 12, 6, 0, Math.PI * 2); g.fill();
    }

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
      { col: 6, row: 2,   text: 'RECEPCAO & TRIAGEM' },
      { col: 18, row: 2,  text: 'PRONTO-SOCORRO' },
      { col: 30, row: 2,  text: 'FARMACIA' },
      { col: 43, row: 2,  text: 'LABORATORIO' },
      { col: 55, row: 2,  text: 'IMAGEM' },
      { col: 67, row: 2,  text: 'DIRETORIA' },
      { col: 5, row: 17,  text: 'CME' },
      { col: 16, row: 17, text: 'COPA & NUTRICAO' },
      { col: 30, row: 17, text: 'ENFERMARIA' },
      { col: 45, row: 17, text: 'UTI ADULTO' },
      { col: 63, row: 17, text: 'POSTO ENF. CENTRAL' },
      { col: 7, row: 31,  text: 'AMBULATORIO' },
      { col: 20, row: 31, text: 'MATERNIDADE' },
      { col: 34, row: 31, text: 'ONCOLOGIA' },
      { col: 48, row: 31, text: 'REABILITACAO' },
      { col: 64, row: 31, text: 'SAUDE MENTAL' },
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
    this.mKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.M);
    this.escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    this.escKey.on('down', () => this.pauseGame());
  }

  public pauseGame() {
    if (this.isDialogOpen || this.isCrisisOpen) return;
    saveGame(this.state);
    
    // Navigate to Pause Menu via React and pause the scenes
    if ((window as any).reactNavigate) {
       (window as any).reactNavigate('/pause');
       this.scene.pause('HUDScene');
       this.scene.pause('GameScene');
    }
  }

  // ─── CAMERA ───────────────────────────────────────────────────────────────
  private setupCamera() {
    // lerpX/Y=1 snaps camera to player each frame — correct for pixel-art and
    // avoids sub-pixel interpolation math on every update.
    this.cameras.main
      .startFollow(this.player, true, 1, 1)
      .setZoom(CAMERA_ZOOM)
      .setBounds(0, 0, MAP_COLS * TILE_SIZE, MAP_ROWS * TILE_SIZE)
      .setRoundPixels(true);
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
    
    this.isCrisisOpen = true;
    const hud = this.scene.get('HUDScene') as any;
    if (hud) {
      hud.showCrisisOverlay(event, (choiceIdx: number) => {
        this.resolveCrisis(event, choiceIdx);
      });
    }

    this.state.crisisCount = (this.state.crisisCount || 0) + 1;
    this.scheduleCrisis();
  }

  public resolveCrisis(event: CrisisEvent, choiceIdx: number) {
    if (!this.isCrisisOpen) return;
    this.isCrisisOpen = false;

    const choice = event.choices[choiceIdx];

    // Apply effects
    this.state.prestige = Math.max(0, this.state.prestige + choice.prestigeEffect);
    this.state.energy = Math.max(0, Math.min(100, this.state.energy + choice.energyEffect));
    this.state.stress = Math.max(0, Math.min(100, (this.state.stress || 0) + choice.stressEffect));
    this.state.decisionLog = [...(this.state.decisionLog || []), `${event.id}:${choiceIdx}`].slice(-20);

    const hud = this.scene.get('HUDScene') as any;
    if (hud) {
       hud.showCrisisFeedback(choice.feedback, choice.correct, choice.prestigeEffect);
    }

    // Show prestige change
    const colorStr = choice.prestigeEffect >= 0 ? '#2ecc71' : '#e74c3c';
    this.showFloatingText(this.player.x, this.player.y - 40, `${choice.prestigeEffect >= 0 ? '+' : ''}${choice.prestigeEffect} pts`, colorStr, 28);
    this.emitHudUpdate();
  }


  private getVPad() {
    const hud = this.scene.get('HUDScene') as any;
    return hud?.virtualPad || { up: false, down: false, left: false, right: false, sprint: false, actionJustPressed: false, missionJustPressed: false, menuJustPressed: false };
  }

  // ─── UPDATE ───────────────────────────────────────────────────────────────
  update(time: number, rawDelta: number) {
    // Cap delta to 40ms (25fps minimum) to prevent startup stutter / speed ramp
    const delta = Math.min(rawDelta, 40);
    const vpad = this.getVPad();

    // Check menu key early (even if dialog/crisis is open, though pause usually blocks this, let's keep it safe)
    if (Phaser.Input.Keyboard.JustDown(this.escKey) || vpad.menuJustPressed) {
      if (vpad.menuJustPressed) vpad.menuJustPressed = false;
      this.pauseGame();
    }

    if (this.isDialogOpen || this.isCrisisOpen) {
       // if dialogue is open, maybe they press action to advance it?
       // The DialogScene handles its own input. But we should reset action just in case.
       if (vpad.actionJustPressed) vpad.actionJustPressed = false;
       return;
    }

    // Movement
    const up    = this.cursors.up.isDown    || this.wasd.up.isDown || vpad.up;
    const down  = this.cursors.down.isDown  || this.wasd.down.isDown || vpad.down;
    const left  = this.cursors.left.isDown  || this.wasd.left.isDown || vpad.left;
    const right = this.cursors.right.isDown || this.wasd.right.isDown || vpad.right;
    const sprint = (this.shiftKey.isDown || vpad.sprint) && this.state.energy > 10;
    this.player.move(up, down, left, right, delta, sprint);

    // NPC AI update
    for (const npc of this.npcs) npc.update(delta);

    // Detect nearby NPC
    this.detectNearbyNPC();

    // Interaction
    if ((Phaser.Input.Keyboard.JustDown(this.eKey) || vpad.actionJustPressed) && this.nearbyNPC) {
      if (vpad.actionJustPressed) vpad.actionJustPressed = false;
      this.openDialog(this.nearbyNPC);
    } else {
       if (vpad.actionJustPressed) vpad.actionJustPressed = false;
    }

    // Mission overlay toggle
    if (Phaser.Input.Keyboard.JustDown(this.mKey) || vpad.missionJustPressed) {
      if (vpad.missionJustPressed) vpad.missionJustPressed = false;
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
        this.showFloatingText(this.player.x, this.player.y - 30, '+6 NRG', '#f1c40f');
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

    // HUD update (throttled)
    if (time - this.lastHudEmit > 300) {
      this.lastHudEmit = time;
      this.emitHudUpdate();
    }
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
    const prevProgress = { ...this.state.missionProgress };
    const prevCompleted = [...this.state.completedMissions];

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

        // Surface mission acceptance/completion right in the world so it never feels silent
        for (const id of npc.def.missionIds) {
          const wasInProgress = !!prevProgress[id];
          const isInProgress = !!this.state.missionProgress[id];
          const wasCompleted = prevCompleted.includes(id);
          const isCompleted = this.state.completedMissions.includes(id);
          const mission = MISSIONS.find(m => m.id === id);
          if (!mission) continue;
          if (!wasInProgress && isInProgress && !isCompleted) {
            this.showFloatingText(this.player.x, this.player.y - 60, `[+] Nova missao: ${mission.title}`, '#1abc9c', 18);
          } else if (!wasCompleted && isCompleted) {
            this.showFloatingText(this.player.x, this.player.y - 60, `[OK] Concluida: ${mission.title}`, '#2ecc71', 18);
          }
        }
      },
    });
  }

  private checkMilestones() {
    if (this.state.completedMissions.length === MISSIONS.length) {
      this.showFloatingText(this.player.x, this.player.y - 60, '[PARABENS] TODAS AS MISSOES CONCLUIDAS!', '#f1c40f', 24);
    }
  }

  private toggleMissionOverlay() {
    const hud = this.scene.get('HUDScene') as any;
    if (hud) {
      hud.toggleMissionOverlay(this.state);
    }
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
