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
  private lastActivity = 'Explorando o hospital';

  // Native interval handle — immune to Phaser clock throttling in background tabs
  private _heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  // WebSocket screen-share stream
  private _screenWs: WebSocket | null = null;
  private _screenFrameRAF: number = 0;
  private _screenEncoding = false;

  // HTTP fallback: when WS is unavailable (e.g. Netlify), post screenshots to dedicated endpoint
  private _screenShareFallback = false;
  private _screenshotInterval: ReturnType<typeof setInterval> | null = null;
  private _screenshotBusy = false; // prevent overlapping encodes

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

    // Professor mode: heartbeat for stats (native setInterval → not throttled in background tabs)
    this._heartbeatInterval = setInterval(() => this.broadcastState(), 2500);

    // Screen-share WebSocket: start connecting (retries until sessionRoom is ready)
    this._initScreenShare();

    this.events.once(Phaser.Core.Events.DESTROY, () => {
      if (this._heartbeatInterval !== null) {
        clearInterval(this._heartbeatInterval);
        this._heartbeatInterval = null;
      }
      this._destroyScreenShare();
    });

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
    const midC = Math.floor((c1 + c2) / 2);
    const midR = Math.floor((r1 + r2) / 2);

    // ── ICU — highly-monitored beds with ventilators and IV poles
    if (tid === TILE_ID.ICU) {
      let bedCol = c1 + 1;
      while (bedCol < c2 - 1) {
        const bx = bedCol * TILE_SIZE, by = (r1 + 1) * TILE_SIZE;
        this.drawHospitalBed(g, bx, by, true);
        this.interactionPoints.push({ x: bx, y: by, type: 'inspect' });
        this.drawVentilator(g, bx + 34, by - 2);
        this.drawIVPole(g, bx - 14, by + 8);
        bedCol += 4;
      }
      // Central nursing monitor strip
      const mx = midC * TILE_SIZE;
      this.drawNursingDesk(g, (c1 + 1) * TILE_SIZE, (r2 - 2) * TILE_SIZE);
      this.interactionPoints.push({ x: mx, y: (r2 - 2) * TILE_SIZE, type: 'work' });
    }

    // ── WARD — regular beds with bedside tables, IV poles
    else if (tid === TILE_ID.WARD) {
      let bedCol = c1 + 1;
      let row = r1 + 1;
      while (bedCol < c2 - 1) {
        const bx = bedCol * TILE_SIZE, by = row * TILE_SIZE;
        this.drawHospitalBed(g, bx, by, false);
        this.interactionPoints.push({ x: bx, y: by, type: 'inspect' });
        this.drawIVPole(g, bx - 12, by + 6);
        bedCol += 4;
        if (bedCol >= c2 - 1 && row === r1 + 1) { bedCol = c1 + 1; row = r2 - 4; }
      }
      // Filing cabinet + plant
      this.drawFilingCabinet(g, (c2 - 2) * TILE_SIZE, (r1 + 2) * TILE_SIZE);
      this.drawPottedPlant(g, (c1 + 1) * TILE_SIZE, (r2 - 2) * TILE_SIZE);
    }

    // ── MATERNITY — maternity beds + bassinets + soft decor
    else if (tid === TILE_ID.MATERNITY) {
      let bedCol = c1 + 1;
      while (bedCol < c2 - 1) {
        const bx = bedCol * TILE_SIZE, by = (r1 + 1) * TILE_SIZE;
        this.drawMaternityBed(g, bx, by);
        this.interactionPoints.push({ x: bx, y: by, type: 'inspect' });
        this.drawBassinet(g, bx + 36, by + 4);
        bedCol += 5;
      }
      // Breast pump station on one side
      this.drawBreastPumpStation(g, (c2 - 2) * TILE_SIZE, (r1 + 2) * TILE_SIZE);
      this.interactionPoints.push({ x: (c2 - 2) * TILE_SIZE, y: (r1 + 2) * TILE_SIZE, type: 'work' });
      this.drawPottedPlant(g, (c1 + 1) * TILE_SIZE, (r2 - 2) * TILE_SIZE);
    }

    // ── EMERGENCY — crash carts, trauma stretchers, defibrillators
    else if (tid === TILE_ID.EMERGENCY) {
      // Trauma bays along top
      let col = c1 + 1;
      while (col < c2 - 1) {
        this.drawTraumaStretcher(g, col * TILE_SIZE, (r1 + 1) * TILE_SIZE);
        this.interactionPoints.push({ x: col * TILE_SIZE, y: (r1 + 1) * TILE_SIZE, type: 'inspect' });
        this.drawCrashCart(g, col * TILE_SIZE + 36, (r1 + 1) * TILE_SIZE);
        col += 5;
      }
      // Defibrillator on wall
      this.drawDefibrillator(g, (c1 + 1) * TILE_SIZE, (r2 - 2) * TILE_SIZE);
      this.interactionPoints.push({ x: (c1 + 1) * TILE_SIZE, y: (r2 - 2) * TILE_SIZE, type: 'work' });
      // Triage desk
      this.drawOfficeDesk(g, midC * TILE_SIZE, midR * TILE_SIZE);
      this.interactionPoints.push({ x: midC * TILE_SIZE, y: midR * TILE_SIZE, type: 'work' });
    }

    // ── PHARMACY — tall shelving units + dispensing counter
    else if (tid === TILE_ID.PHARMACY) {
      // Dispensing counter along top
      for (let c = c1 + 1; c < c2 - 1; c += 2) {
        this.drawLabCounter(g, c * TILE_SIZE, (r1 + 1) * TILE_SIZE, TILE_SIZE * 2 - 4);
        this.interactionPoints.push({ x: c * TILE_SIZE, y: (r1 + 1) * TILE_SIZE, type: 'work' });
      }
      // Shelving units (tall cabinets)
      for (let c = c1 + 1; c < c2 - 1; c += 2) {
        this.drawShelvingUnit(g, c * TILE_SIZE, (r2 - 2) * TILE_SIZE);
      }
      this.drawRefrigerator(g, (c2 - 2) * TILE_SIZE, (r1 + 2) * TILE_SIZE);
    }

    // ── LAB — benches with microscopes, centrifuges
    else if (tid === TILE_ID.LAB) {
      // Lab bench top
      for (let c = c1 + 1; c < c2 - 1; c += 3) {
        this.drawLabBench(g, c * TILE_SIZE, (r1 + 1) * TILE_SIZE);
        this.interactionPoints.push({ x: c * TILE_SIZE, y: (r1 + 1) * TILE_SIZE, type: 'work' });
      }
      // Centrifuge + analyzer bottom row
      this.drawCentrifuge(g, (c1 + 1) * TILE_SIZE, (r2 - 2) * TILE_SIZE);
      this.drawBioanalyzer(g, (c1 + 4) * TILE_SIZE, (r2 - 2) * TILE_SIZE);
      this.interactionPoints.push({ x: (c1 + 1) * TILE_SIZE, y: (r2 - 2) * TILE_SIZE, type: 'work' });
      this.drawFilingCabinet(g, (c2 - 2) * TILE_SIZE, (r2 - 2) * TILE_SIZE);
    }

    // ── CME — autoclaves, sterilization counters
    else if (tid === TILE_ID.CME) {
      this.drawAutoclave(g, (c1 + 1) * TILE_SIZE, (r1 + 1) * TILE_SIZE);
      this.interactionPoints.push({ x: (c1 + 1) * TILE_SIZE, y: (r1 + 1) * TILE_SIZE, type: 'work' });
      if (c2 - c1 > 4) {
        this.drawAutoclave(g, (c1 + 4) * TILE_SIZE, (r1 + 1) * TILE_SIZE);
      }
      for (let c = c1 + 1; c < c2 - 1; c += 2) {
        this.drawLabCounter(g, c * TILE_SIZE, (r2 - 2) * TILE_SIZE, TILE_SIZE * 2 - 4);
        this.interactionPoints.push({ x: c * TILE_SIZE, y: (r2 - 2) * TILE_SIZE, type: 'work' });
      }
      this.drawShelvingUnit(g, (c2 - 2) * TILE_SIZE, midR * TILE_SIZE);
    }

    // ── ADMIN/DIRETORIA — executive desks, filing cabinets, plants
    else if (tid === TILE_ID.ADMIN) {
      this.drawExecutiveDesk(g, midC * TILE_SIZE, midR * TILE_SIZE);
      this.interactionPoints.push({ x: midC * TILE_SIZE, y: midR * TILE_SIZE, type: 'work' });
      this.drawOfficeDesk(g, (c1 + 1) * TILE_SIZE, (r1 + 2) * TILE_SIZE);
      this.interactionPoints.push({ x: (c1 + 1) * TILE_SIZE, y: (r1 + 2) * TILE_SIZE, type: 'work' });
      this.drawFilingCabinet(g, (c2 - 2) * TILE_SIZE, (r1 + 2) * TILE_SIZE);
      this.drawFilingCabinet(g, (c2 - 2) * TILE_SIZE, (r1 + 4) * TILE_SIZE);
      this.drawPottedPlant(g, (c1 + 1) * TILE_SIZE, (r2 - 2) * TILE_SIZE);
      this.drawPottedPlant(g, (c2 - 2) * TILE_SIZE, (r2 - 2) * TILE_SIZE);
      this.drawWaitingChairs(g, midC * TILE_SIZE, (r2 - 2) * TILE_SIZE);
      this.interactionPoints.push({ x: midC * TILE_SIZE, y: (r2 - 2) * TILE_SIZE, type: 'sit' });
    }

    // ── RECEPTION — reception counter, waiting area
    else if (tid === TILE_ID.RECEPTION) {
      this.drawReceptionCounter(g, (c1 + 1) * TILE_SIZE, (r1 + 1) * TILE_SIZE, c2 - c1 - 2);
      this.interactionPoints.push({ x: midC * TILE_SIZE, y: (r1 + 1) * TILE_SIZE, type: 'work' });
      // Waiting chairs in rows
      for (let c = c1 + 1; c < c2 - 1; c += 3) {
        this.drawWaitingChairs(g, c * TILE_SIZE, (r2 - 2) * TILE_SIZE);
        this.interactionPoints.push({ x: c * TILE_SIZE, y: (r2 - 2) * TILE_SIZE, type: 'sit' });
      }
      this.drawPottedPlant(g, (c2 - 2) * TILE_SIZE, (r2 - 2) * TILE_SIZE);
      this.drawPottedPlant(g, (c1 + 1) * TILE_SIZE, (r2 - 2) * TILE_SIZE);
    }

    // ── BREAK/NUTRITION — dining tables, vending, kitchenette
    else if (tid === TILE_ID.BREAK) {
      this.drawDiningTable(g, (c1 + 1) * TILE_SIZE, (r1 + 2) * TILE_SIZE);
      this.interactionPoints.push({ x: (c1 + 1) * TILE_SIZE, y: (r1 + 2) * TILE_SIZE, type: 'rest' });
      if (c2 - c1 > 5) {
        this.drawDiningTable(g, (c1 + 4) * TILE_SIZE, (r1 + 2) * TILE_SIZE);
        this.interactionPoints.push({ x: (c1 + 4) * TILE_SIZE, y: (r1 + 2) * TILE_SIZE, type: 'rest' });
      }
      this.drawVendingMachine(g, (c2 - 2) * TILE_SIZE, (r1 + 1) * TILE_SIZE);
      this.drawKitchenCounter(g, (c1 + 1) * TILE_SIZE, (r2 - 2) * TILE_SIZE, c2 - c1 - 2);
      this.drawPottedPlant(g, (c2 - 2) * TILE_SIZE, (r2 - 2) * TILE_SIZE);
    }

    // ── NURSING STATION — long counter, monitors, filing cabinets
    else if (tid === TILE_ID.NURSING) {
      this.drawNursingDesk(g, (c1 + 1) * TILE_SIZE, (r1 + 1) * TILE_SIZE);
      this.interactionPoints.push({ x: (c1 + 1) * TILE_SIZE, y: (r1 + 1) * TILE_SIZE, type: 'work' });
      if (c2 - c1 > 4) {
        this.drawNursingDesk(g, (c1 + 4) * TILE_SIZE, (r1 + 1) * TILE_SIZE);
        this.interactionPoints.push({ x: (c1 + 4) * TILE_SIZE, y: (r1 + 1) * TILE_SIZE, type: 'work' });
      }
      // Filing cabinets along back wall
      for (let c = c1 + 1; c < c2 - 1; c += 3) {
        this.drawFilingCabinet(g, c * TILE_SIZE, (r2 - 2) * TILE_SIZE);
      }
      this.drawCrashCart(g, (c2 - 2) * TILE_SIZE, (r1 + 1) * TILE_SIZE);
    }

    // ── RADIOLOGY — CT scanner + control room + cabinets
    else if (tid === TILE_ID.RADIOLOGY) {
      this.drawCTScanner(g, (c1 + 2) * TILE_SIZE, (r1 + 1) * TILE_SIZE);
      this.interactionPoints.push({ x: (c1 + 2) * TILE_SIZE, y: (r1 + 1) * TILE_SIZE, type: 'work' });
      this.drawXRayViewer(g, (c2 - 3) * TILE_SIZE, (r1 + 1) * TILE_SIZE);
      this.interactionPoints.push({ x: (c2 - 3) * TILE_SIZE, y: (r1 + 1) * TILE_SIZE, type: 'work' });
      this.drawOfficeDesk(g, midC * TILE_SIZE, (r2 - 2) * TILE_SIZE);
      this.interactionPoints.push({ x: midC * TILE_SIZE, y: (r2 - 2) * TILE_SIZE, type: 'work' });
      this.drawCabinet(g, (c1 + 1) * TILE_SIZE, (r2 - 2) * TILE_SIZE);
    }

    // ── ONCOLOGY — chemo chairs + IV poles
    else if (tid === TILE_ID.ONCOLOGY) {
      for (let c = c1 + 1; c < c2 - 1; c += 3) {
        this.drawChemoChair(g, c * TILE_SIZE, (r1 + 1) * TILE_SIZE);
        this.interactionPoints.push({ x: c * TILE_SIZE, y: (r1 + 1) * TILE_SIZE, type: 'inspect' });
        this.drawIVPole(g, c * TILE_SIZE + 24, (r1 + 1) * TILE_SIZE - 4);
        if (c + 3 < c2 - 1) {
          this.drawChemoChair(g, (c + 1) * TILE_SIZE, (r2 - 3) * TILE_SIZE);
          this.interactionPoints.push({ x: (c + 1) * TILE_SIZE, y: (r2 - 3) * TILE_SIZE, type: 'inspect' });
        }
      }
      this.drawNursingDesk(g, midC * TILE_SIZE, (r2 - 2) * TILE_SIZE);
      this.interactionPoints.push({ x: midC * TILE_SIZE, y: (r2 - 2) * TILE_SIZE, type: 'work' });
    }

    // ── REHAB — exercise equipment, parallel bars
    else if (tid === TILE_ID.REHAB) {
      this.drawParallelBars(g, (c1 + 1) * TILE_SIZE, midR * TILE_SIZE);
      this.interactionPoints.push({ x: (c1 + 1) * TILE_SIZE, y: midR * TILE_SIZE, type: 'sit' });
      this.drawExerciseMat(g, midC * TILE_SIZE, (r1 + 2) * TILE_SIZE);
      this.interactionPoints.push({ x: midC * TILE_SIZE, y: (r1 + 2) * TILE_SIZE, type: 'inspect' });
      this.drawOfficeDesk(g, (c2 - 2) * TILE_SIZE, (r1 + 2) * TILE_SIZE);
      this.interactionPoints.push({ x: (c2 - 2) * TILE_SIZE, y: (r1 + 2) * TILE_SIZE, type: 'work' });
      this.drawPottedPlant(g, (c1 + 1) * TILE_SIZE, (r2 - 2) * TILE_SIZE);
    }

    // ── OUTPATIENT — exam tables, doctor desk
    else if (tid === TILE_ID.OUTPATIENT) {
      for (let c = c1 + 1; c < c2 - 1; c += 3) {
        this.drawExamTable(g, c * TILE_SIZE, (r1 + 1) * TILE_SIZE);
        this.interactionPoints.push({ x: c * TILE_SIZE, y: (r1 + 1) * TILE_SIZE, type: 'inspect' });
      }
      this.drawOfficeDesk(g, midC * TILE_SIZE, (r2 - 2) * TILE_SIZE);
      this.interactionPoints.push({ x: midC * TILE_SIZE, y: (r2 - 2) * TILE_SIZE, type: 'work' });
      this.drawPottedPlant(g, (c2 - 2) * TILE_SIZE, (r2 - 2) * TILE_SIZE);
      this.drawWaitingChairs(g, (c1 + 1) * TILE_SIZE, (r2 - 2) * TILE_SIZE);
      this.interactionPoints.push({ x: (c1 + 1) * TILE_SIZE, y: (r2 - 2) * TILE_SIZE, type: 'sit' });
    }

    // ── PSYCH — therapy sofas, plants, calm decor
    else if (tid === TILE_ID.PSYCH) {
      this.drawTherapySofa(g, (c1 + 1) * TILE_SIZE, (r1 + 2) * TILE_SIZE);
      this.interactionPoints.push({ x: (c1 + 1) * TILE_SIZE, y: (r1 + 2) * TILE_SIZE, type: 'sit' });
      this.drawTherapySofa(g, midC * TILE_SIZE, (r1 + 2) * TILE_SIZE);
      this.interactionPoints.push({ x: midC * TILE_SIZE, y: (r1 + 2) * TILE_SIZE, type: 'sit' });
      this.drawOfficeDesk(g, (c2 - 2) * TILE_SIZE, (r1 + 2) * TILE_SIZE);
      this.interactionPoints.push({ x: (c2 - 2) * TILE_SIZE, y: (r1 + 2) * TILE_SIZE, type: 'work' });
      this.drawTherapyPlant(g, (c1 + 1) * TILE_SIZE, (r2 - 2) * TILE_SIZE);
      this.drawTherapyPlant(g, (c2 - 2) * TILE_SIZE, (r2 - 2) * TILE_SIZE);
      this.drawPottedPlant(g, midC * TILE_SIZE, (r2 - 2) * TILE_SIZE);
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
    this.addPropCollision(bx, by, 70, 20);

    // ── Drop shadow
    g.fillStyle(0x000000, 0.18); g.fillRect(bx + 3, by + 3, 70, 20);

    // ── Desk body (teal-accented, like reference image)
    g.fillStyle(0x1abc9c, 1); g.fillRoundedRect(bx, by, 70, 18, 3); // teal front panel
    g.fillStyle(0xe8f8f4, 1); g.fillRoundedRect(bx + 2, by + 2, 66, 12, 2); // cream work surface
    g.fillStyle(0x16a085, 1); g.fillRect(bx, by + 14, 70, 4); // teal baseboard

    // ── Left monitor
    g.fillStyle(0x1a1a2e, 1); g.fillRoundedRect(bx + 6, by - 10, 18, 12, 2);
    g.fillStyle(0x001020, 1); g.fillRect(bx + 7, by - 9, 16, 9);
    // Monitor screen content (patient data look)
    g.fillStyle(0x00ff88, 0.7); g.fillRect(bx + 8, by - 7, 8, 1); // header bar
    g.fillStyle(0x00ccee, 0.5); g.fillRect(bx + 8, by - 5, 5, 1);
    g.fillRect(bx + 8, by - 3, 7, 1);
    g.fillRect(bx + 8, by - 1, 4, 1);
    // Monitor stand
    g.fillStyle(0x888888, 1); g.fillRect(bx + 14, by + 2, 2, 2);

    // ── Right monitor
    g.fillStyle(0x1a1a2e, 1); g.fillRoundedRect(bx + 44, by - 10, 18, 12, 2);
    g.fillStyle(0x001020, 1); g.fillRect(bx + 45, by - 9, 16, 9);
    g.fillStyle(0x00ff88, 0.7); g.fillRect(bx + 46, by - 7, 8, 1);
    g.fillStyle(0x00ccee, 0.5); g.fillRect(bx + 46, by - 5, 5, 1);
    g.fillRect(bx + 46, by - 3, 7, 1);
    g.fillStyle(0x888888, 1); g.fillRect(bx + 52, by + 2, 2, 2);

    // ── Clipboard on desk
    g.fillStyle(0xf0f0e0, 1); g.fillRoundedRect(bx + 28, by + 3, 10, 8, 1);
    g.fillStyle(0x888888, 1); g.fillRect(bx + 30, by + 4, 6, 1);
    g.fillRect(bx + 30, by + 6, 6, 1);
    g.fillRect(bx + 30, by + 8, 4, 1);

    // ── Small desk plant (right side, teal pot)
    g.fillStyle(0x1abc9c, 1); g.fillRoundedRect(bx + 62, by + 4, 6, 6, 1); // pot
    g.fillStyle(0x27ae60, 1);
    g.beginPath(); g.arc(bx + 65, by + 1, 5, 0, Math.PI * 2); g.fill();
    g.fillStyle(0x2ecc71, 0.8);
    g.beginPath(); g.arc(bx + 63, by + 3, 3, 0, Math.PI * 2); g.fill();
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
    this.addPropCollision(bx + 6, by + 14, 20, 18);
    // ── Shadow
    g.fillStyle(0x000000, 0.15); g.fillEllipse(bx + 16, by + 36, 22, 6);
    // ── Pot (terracotta/brown — drawn as triangle approximation)
    g.fillStyle(0x8b5e3c, 1);
    g.fillTriangle(bx + 9, by + 24, bx + 25, by + 24, bx + 23, by + 36);
    g.fillTriangle(bx + 9, by + 24, bx + 11, by + 36, bx + 23, by + 36);
    // ── Pot rim
    g.fillStyle(0xa0704a, 1); g.fillRoundedRect(bx + 8, by + 20, 18, 4, 2);
    g.fillStyle(0xc0906a, 0.5); g.fillRect(bx + 9, by + 21, 16, 1); // highlight
    // ── Soil (visible inside rim)
    g.fillStyle(0x3a2010, 1); g.fillEllipse(bx + 17, by + 24, 14, 4);
    // ── Tall tropical leaves (like the reference image plant)
    // Main leaf left
    g.fillStyle(0x27ae60, 1);
    g.fillTriangle(bx + 16, by + 22, bx + 4, by - 2, bx + 12, by + 14);
    // Main leaf right
    g.fillTriangle(bx + 16, by + 22, bx + 28, by - 2, bx + 20, by + 14);
    // Center leaf (tallest)
    g.fillTriangle(bx + 16, by + 20, bx + 16, by - 8, bx + 20, by + 12);
    // Secondary leaves
    g.fillStyle(0x2ecc71, 1);
    g.fillTriangle(bx + 16, by + 20, bx + 6, by + 6, bx + 14, by + 16);
    g.fillTriangle(bx + 16, by + 20, bx + 26, by + 6, bx + 18, by + 16);
    // Leaf vein highlights
    g.lineStyle(0.8, 0x1a8a42, 0.5);
    g.beginPath(); g.moveTo(bx + 16, by + 20); g.lineTo(bx + 10, by + 2); g.strokePath();
    g.beginPath(); g.moveTo(bx + 16, by + 20); g.lineTo(bx + 22, by + 2); g.strokePath();
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
    this.addPropCollision(bx + 2, by + 2, 28, 48);

    // ── Drop shadow
    g.fillStyle(0x000000, 0.18); g.fillRoundedRect(bx + 4, by + 6, 28, 48, 4);

    // ── Bed frame (light metal/white)
    g.fillStyle(0xe8e8e8, 1); g.fillRoundedRect(bx + 2, by + 2, 28, 48, 4);
    g.fillStyle(0xd0d0d0, 1); g.fillRect(bx + 2, by + 44, 28, 6); // foot rail shadow

    // ── Head rail (teal bar, like reference)
    g.fillStyle(0x1abc9c, 1); g.fillRoundedRect(bx + 2, by + 2, 28, 4, 2);

    // ── Mattress
    g.fillStyle(0xf8f8f8, 1); g.fillRoundedRect(bx + 4, by + 6, 24, 40, 2);

    // ── Pillow (white)
    g.fillStyle(0xffffff, 1); g.fillRoundedRect(bx + 6, by + 8, 20, 10, 3);
    g.fillStyle(0xdde8e8, 0.5); g.fillRect(bx + 7, by + 9, 18, 1); // pillow crease

    // ── Teal blanket (matches reference — 1abc9c teal)
    const blanketColor = hasMonitor ? 0x16a085 : 0x1abc9c;
    g.fillStyle(blanketColor, 0.88); g.fillRoundedRect(bx + 4, by + 24, 24, 22, 2);
    // Blanket fold highlight
    g.fillStyle(0xffffff, 0.18); g.fillRect(bx + 4, by + 24, 24, 2);

    // ── Awareness ribbon on blanket (small loop, white)
    g.fillStyle(0xffffff, 0.55);
    g.fillRoundedRect(bx + 12, by + 30, 8, 6, 3);
    g.fillStyle(blanketColor, 0.88); g.fillRoundedRect(bx + 14, by + 32, 4, 3, 1);

    // ── Patient head
    if (Math.random() < 0.75) {
      g.fillStyle(0xf5c5a3, 1);
      g.beginPath(); g.arc(bx + 16, by + 13, 5, 0, Math.PI * 2); g.fill();
      // Hair
      g.fillStyle(0x4a3020, 1);
      g.fillRect(bx + 11, by + 8, 10, 4);
      g.beginPath(); g.arc(bx + 16, by + 13, 5, Math.PI, 0); g.fill();
    }

    // ── Foot rail (silver bar)
    g.fillStyle(0xc0c8c8, 1); g.fillRect(bx + 4, by + 48, 24, 3);

    // ── Bedside table (right side)
    g.fillStyle(0xd8e0e0, 1); g.fillRoundedRect(bx + 32, by + 8, 12, 14, 2);
    g.fillStyle(0xc8d0d0, 1); g.fillRect(bx + 32, by + 20, 12, 2);

    // ── Monitor with heart-rate waveform
    if (hasMonitor) {
      // Monitor stand (on bedside table)
      g.fillStyle(0x2c3e50, 1); g.fillRect(bx + 34, by - 2, 10, 8);
      g.fillStyle(0x111111, 1); g.fillRoundedRect(bx + 33, by - 4, 12, 8, 2);
      // Screen (green waveform)
      g.fillStyle(0x001800, 1); g.fillRect(bx + 34, by - 3, 10, 6);
      g.fillStyle(0x00ff88, 0.9);
      g.fillRect(bx + 34, by, 2, 1);
      g.fillRect(bx + 36, by - 2, 1, 4);
      g.fillRect(bx + 37, by + 1, 2, 1);
      g.fillRect(bx + 39, by, 1, 1);
      g.fillRect(bx + 40, by - 1, 1, 2);
      g.fillRect(bx + 41, by, 2, 1);

      const led = this.add.sprite(bx + 43, by - 4, 'red_led').setDepth(3).setOrigin(0.5);
      this.tweens.add({ targets: led, alpha: 0.1, duration: 500, yoyo: true, repeat: -1 });
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

  // ─── NEW SPECIALISED PROPS ──────────────────────────────────────────────────

  private drawVentilator(g: Phaser.GameObjects.Graphics, bx: number, by: number) {
    this.addPropCollision(bx, by, 24, 28);
    g.fillStyle(0x000000, 0.25); g.fillRoundedRect(bx + 2, by + 2, 24, 28, 4);
    g.fillStyle(0xecf0f1, 1); g.fillRoundedRect(bx, by, 24, 28, 4);
    // Screen
    g.fillStyle(0x2c3e50, 1); g.fillRoundedRect(bx + 3, by + 3, 18, 10, 2);
    g.fillStyle(0x00ff88, 0.6); g.fillRect(bx + 4, by + 4, 16, 8);
    // Waveform line
    g.lineStyle(1, 0x00ff88, 1);
    g.beginPath(); g.moveTo(bx + 4, by + 8); g.lineTo(bx + 8, by + 8);
    g.lineTo(bx + 9, by + 5); g.lineTo(bx + 10, by + 11); g.lineTo(bx + 11, by + 8);
    g.lineTo(bx + 20, by + 8); g.strokePath();
    // Dials
    g.fillStyle(0x95a5a6, 1);
    g.fillCircle(bx + 6, by + 19, 4);
    g.fillCircle(bx + 18, by + 19, 4);
    g.fillStyle(0x7f8c8d, 1);
    g.fillCircle(bx + 6, by + 19, 2);
    g.fillCircle(bx + 18, by + 19, 2);
    // Tube outlet
    g.fillStyle(0xbdc3c7, 1); g.fillRect(bx + 10, by + 27, 4, 6);
    g.fillStyle(0xecf0f1, 0.8); g.fillRoundedRect(bx + 8, by + 32, 8, 4, 2);
  }

  private drawIVPole(g: Phaser.GameObjects.Graphics, bx: number, by: number) {
    // Slim IV pole with bag
    g.fillStyle(0xbdc3c7, 1); g.fillRect(bx + 5, by - 2, 3, 36);
    // Bag
    g.fillStyle(0x000000, 0.2); g.fillRoundedRect(bx + 2, by - 14, 9, 14, 3);
    g.fillStyle(0xd6eaf8, 0.9); g.fillRoundedRect(bx + 1, by - 15, 9, 14, 3);
    g.fillStyle(0xaed6f1, 0.7); g.fillRect(bx + 3, by - 13, 5, 8);
    // Base
    g.fillStyle(0x95a5a6, 1); g.fillRect(bx + 1, by + 33, 11, 3);
    g.fillCircle(bx + 6, by + 36, 4);
  }

  private drawMaternityBed(g: Phaser.GameObjects.Graphics, bx: number, by: number) {
    this.addPropCollision(bx + 2, by + 2, 28, 44);
    // Shadow
    g.fillStyle(0x000000, 0.18); g.fillRoundedRect(bx + 5, by + 5, 26, 42, 4);
    // Frame — soft pink/beige
    g.fillStyle(0xf8c8d0, 1); g.fillRoundedRect(bx + 3, by + 2, 26, 44, 3);
    // Mattress
    g.fillStyle(0xfef9f0, 1); g.fillRoundedRect(bx + 5, by + 5, 22, 38, 2);
    // Blanket — rose pink
    g.fillStyle(0xf48fb1, 0.8); g.fillRoundedRect(bx + 5, by + 20, 22, 23, 2);
    // Pillow
    g.fillStyle(0xffffff, 1); g.fillRoundedRect(bx + 7, by + 7, 18, 10, 3);
    // Patient head
    g.fillStyle(0xf5c5a3, 1); g.beginPath(); g.arc(bx + 16, by + 12, 6, 0, Math.PI * 2); g.fill();
    // Side rail (safety)
    g.lineStyle(2, 0xf8bbd0, 1);
    g.strokeRect(bx + 5, by + 5, 22, 38);
    // IV hook on footboard
    g.fillStyle(0xbdc3c7, 1); g.fillRect(bx + 30, by + 2, 2, 20);
  }

  private drawBassinet(g: Phaser.GameObjects.Graphics, bx: number, by: number) {
    this.addPropCollision(bx, by, 20, 22);
    g.fillStyle(0x000000, 0.15); g.fillRoundedRect(bx + 2, by + 2, 20, 22, 5);
    // Base — white with blue trim
    g.fillStyle(0xffffff, 1); g.fillRoundedRect(bx, by, 20, 22, 5);
    g.lineStyle(2, 0x90caf9, 1); g.strokeRoundedRect(bx, by, 20, 22, 5);
    // Mattress
    g.fillStyle(0xe3f2fd, 1); g.fillRoundedRect(bx + 2, by + 2, 16, 18, 3);
    // Baby
    g.fillStyle(0xfce4ec, 1); g.fillRoundedRect(bx + 5, by + 5, 10, 8, 3);
    // Legs
    g.fillStyle(0xbdc3c7, 1); g.fillRect(bx + 3, by + 20, 3, 8);
    g.fillRect(bx + 14, by + 20, 3, 8);
  }

  private drawBreastPumpStation(g: Phaser.GameObjects.Graphics, bx: number, by: number) {
    this.addPropCollision(bx, by, 28, 20);
    g.fillStyle(0x000000, 0.2); g.fillRoundedRect(bx + 2, by + 2, 28, 20, 3);
    g.fillStyle(0xecf0f1, 1); g.fillRoundedRect(bx, by, 28, 20, 3);
    // Device box
    g.fillStyle(0xd0e8f5, 1); g.fillRoundedRect(bx + 4, by + 3, 12, 10, 2);
    // Screen
    g.fillStyle(0x2c3e50, 1); g.fillRoundedRect(bx + 5, by + 4, 8, 6, 1);
    g.fillStyle(0x00ccff, 0.5); g.fillRect(bx + 6, by + 5, 6, 4);
    // Tube coil
    g.lineStyle(2, 0xaed6f1, 1);
    g.beginPath(); g.arc(bx + 22, by + 10, 5, 0, Math.PI * 2); g.strokePath();
    // Label
    g.fillStyle(0x7f8c8d, 1); g.fillRect(bx + 4, by + 15, 20, 3);
  }

  private drawCrashCart(g: Phaser.GameObjects.Graphics, bx: number, by: number) {
    this.addPropCollision(bx, by, 20, 28);
    g.fillStyle(0x000000, 0.25); g.fillRoundedRect(bx + 2, by + 2, 20, 28, 3);
    g.fillStyle(0xe74c3c, 1); g.fillRoundedRect(bx, by, 20, 28, 3);
    // Drawers
    g.fillStyle(0xc0392b, 1);
    g.fillRect(bx + 2, by + 6, 16, 5);
    g.fillRect(bx + 2, by + 13, 16, 5);
    g.fillRect(bx + 2, by + 20, 16, 5);
    // Drawer handles
    g.fillStyle(0xecf0f1, 1);
    g.fillRect(bx + 8, by + 8, 4, 2);
    g.fillRect(bx + 8, by + 15, 4, 2);
    g.fillRect(bx + 8, by + 22, 4, 2);
    // Top tray
    g.fillStyle(0xbdc3c7, 1); g.fillRect(bx, by, 20, 4);
    // Wheels
    g.fillStyle(0x2c3e50, 1);
    g.fillCircle(bx + 4, by + 28, 3);
    g.fillCircle(bx + 16, by + 28, 3);
    // Lock indicator
    const locked = this.add.sprite(bx + 17, by + 2, 'red_led').setDepth(3).setOrigin(0.5);
    this.tweens.add({ targets: locked, alpha: 0.15, duration: 900, yoyo: true, repeat: -1 });
  }

  private drawShelvingUnit(g: Phaser.GameObjects.Graphics, bx: number, by: number) {
    this.addPropCollision(bx, by, 32, 24);
    g.fillStyle(0x000000, 0.2); g.fillRect(bx + 2, by + 2, 32, 24);
    g.fillStyle(0xd5d8dc, 1); g.fillRect(bx, by, 32, 24);
    // Shelf dividers
    g.fillStyle(0xaab7b8, 1);
    g.fillRect(bx, by + 8, 32, 2);
    g.fillRect(bx, by + 16, 32, 2);
    // Items on shelves (coloured blocks = medicine boxes)
    const colors = [0x3498db, 0xe74c3c, 0x2ecc71, 0xf39c12, 0x9b59b6];
    for (let i = 0; i < 5; i++) {
      g.fillStyle(colors[i % colors.length], 0.9); g.fillRect(bx + 2 + i * 6, by + 2, 5, 5);
    }
    for (let i = 0; i < 4; i++) {
      g.fillStyle(colors[(i + 2) % colors.length], 0.85); g.fillRect(bx + 2 + i * 7, by + 10, 6, 5);
    }
    for (let i = 0; i < 5; i++) {
      g.fillStyle(colors[(i + 1) % colors.length], 0.9); g.fillRect(bx + 2 + i * 6, by + 18, 5, 5);
    }
  }

  private drawRefrigerator(g: Phaser.GameObjects.Graphics, bx: number, by: number) {
    this.addPropCollision(bx, by, 20, 28);
    g.fillStyle(0x000000, 0.2); g.fillRoundedRect(bx + 2, by + 2, 20, 28, 3);
    g.fillStyle(0xecf0f1, 1); g.fillRoundedRect(bx, by, 20, 28, 3);
    // Blue tint = medicine fridge
    g.fillStyle(0xd6eaf8, 0.5); g.fillRect(bx + 2, by + 2, 16, 24);
    // Handle
    g.fillStyle(0xbdc3c7, 1); g.fillRect(bx + 16, by + 8, 3, 8);
    // Temp readout
    g.fillStyle(0x2c3e50, 1); g.fillRoundedRect(bx + 3, by + 18, 12, 6, 1);
    g.fillStyle(0x00ff88, 0.8); g.fillRect(bx + 4, by + 19, 10, 4);
    // Split line
    g.lineStyle(1, 0xbdc3c7, 1); g.strokeRect(bx + 2, by + 13, 16, 1);
  }

  private drawLabBench(g: Phaser.GameObjects.Graphics, bx: number, by: number) {
    this.addPropCollision(bx, by, TILE_SIZE * 3 - 4, 18);
    const w = TILE_SIZE * 3 - 4;
    g.fillStyle(0x000000, 0.15); g.fillRect(bx + 2, by + 2, w, 18);
    g.fillStyle(0xd5e8c8, 1); g.fillRect(bx, by, w, 14); // counter
    g.fillStyle(0xaec6a3, 1); g.fillRect(bx, by + 14, w, 4); // edge
    // Microscope
    g.fillStyle(0x2c3e50, 1); g.fillRect(bx + 6, by + 2, 10, 10);
    g.fillStyle(0x95a5a6, 1); g.fillCircle(bx + 11, by + 6, 3);
    g.fillStyle(0x3498db, 0.6); g.fillCircle(bx + 11, by + 6, 2);
    // Test tube rack
    g.fillStyle(0xecf0f1, 1); g.fillRect(bx + 24, by + 4, 18, 7);
    for (let i = 0; i < 4; i++) {
      const tc = [0xe74c3c, 0xf39c12, 0x3498db, 0x2ecc71][i];
      g.fillStyle(tc, 0.9); g.fillRoundedRect(bx + 26 + i * 4, by + 5, 3, 6, 1);
    }
    // Beaker
    g.fillStyle(0xd6eaf8, 0.7); g.fillRoundedRect(bx + 50, by + 3, 8, 9, 2);
    g.lineStyle(1, 0x85c1e9, 1); g.strokeRoundedRect(bx + 50, by + 3, 8, 9, 2);
  }

  private drawCentrifuge(g: Phaser.GameObjects.Graphics, bx: number, by: number) {
    this.addPropCollision(bx, by, 24, 20);
    g.fillStyle(0x000000, 0.2); g.fillRoundedRect(bx + 2, by + 2, 24, 20, 5);
    g.fillStyle(0xecf0f1, 1); g.fillRoundedRect(bx, by, 24, 20, 5);
    // Lid with circular rotor
    g.fillStyle(0xbdc3c7, 1); g.fillCircle(bx + 12, by + 10, 8);
    g.fillStyle(0x95a5a6, 1); g.fillCircle(bx + 12, by + 10, 5);
    g.fillStyle(0x7f8c8d, 1); g.fillCircle(bx + 12, by + 10, 2);
    // Spokes
    g.lineStyle(1, 0x7f8c8d, 1);
    for (let a = 0; a < 6; a++) {
      const angle = (a / 6) * Math.PI * 2;
      g.beginPath(); g.moveTo(bx + 12, by + 10);
      g.lineTo(bx + 12 + Math.cos(angle) * 5, by + 10 + Math.sin(angle) * 5);
      g.strokePath();
    }
    // Power button
    g.fillStyle(0x2ecc71, 1); g.fillCircle(bx + 20, by + 3, 2);
  }

  private drawBioanalyzer(g: Phaser.GameObjects.Graphics, bx: number, by: number) {
    this.addPropCollision(bx, by, 28, 20);
    g.fillStyle(0x000000, 0.2); g.fillRoundedRect(bx + 2, by + 2, 28, 20, 3);
    g.fillStyle(0xd6eaf8, 1); g.fillRoundedRect(bx, by, 28, 20, 3);
    // Screen
    g.fillStyle(0x2c3e50, 1); g.fillRoundedRect(bx + 3, by + 3, 14, 10, 2);
    g.fillStyle(0x1abc9c, 0.6); g.fillRect(bx + 4, by + 4, 12, 8);
    // Bar chart on screen
    g.fillStyle(0x1abc9c, 1);
    g.fillRect(bx + 5, by + 9, 2, 3);
    g.fillRect(bx + 8, by + 7, 2, 5);
    g.fillRect(bx + 11, by + 8, 2, 4);
    g.fillRect(bx + 14, by + 6, 2, 6);
    // Sample slot
    g.fillStyle(0x7f8c8d, 1); g.fillRect(bx + 20, by + 6, 6, 6);
    g.fillStyle(0xe74c3c, 0.7); g.fillRect(bx + 21, by + 7, 4, 4);
  }

  private drawAutoclave(g: Phaser.GameObjects.Graphics, bx: number, by: number) {
    this.addPropCollision(bx, by, 30, 28);
    g.fillStyle(0x000000, 0.25); g.fillRoundedRect(bx + 2, by + 2, 30, 28, 5);
    g.fillStyle(0xecf0f1, 1); g.fillRoundedRect(bx, by, 30, 28, 5);
    // Cylindrical door
    g.fillStyle(0xbdc3c7, 1); g.fillCircle(bx + 15, by + 13, 10);
    g.fillStyle(0x7f8c8d, 1); g.fillCircle(bx + 15, by + 13, 7);
    g.fillStyle(0x95a5a6, 1); g.fillCircle(bx + 15, by + 13, 4);
    // Handle
    g.fillStyle(0x34495e, 1); g.fillRect(bx + 25, by + 10, 4, 6);
    // Status panel
    g.fillStyle(0x2c3e50, 1); g.fillRoundedRect(bx + 2, by + 23, 20, 4, 1);
    g.fillStyle(0x2ecc71, 1); g.fillCircle(bx + 5, by + 25, 1);
    g.fillStyle(0xf39c12, 1); g.fillCircle(bx + 10, by + 25, 1);
    // Pressure gauge
    g.fillStyle(0xecf0f1, 1); g.fillCircle(bx + 25, by + 22, 4);
    g.lineStyle(1, 0x7f8c8d, 1); g.strokeCircle(bx + 25, by + 22, 4);
    g.lineStyle(2, 0xe74c3c, 1);
    g.beginPath(); g.moveTo(bx + 25, by + 22); g.lineTo(bx + 27, by + 20); g.strokePath();
  }

  private drawExecutiveDesk(g: Phaser.GameObjects.Graphics, bx: number, by: number) {
    this.addPropCollision(bx, by, 48, 28);
    g.fillStyle(0x000000, 0.2); g.fillRect(bx + 2, by + 2, 48, 28);
    g.fillStyle(0x7d4f1e, 1); g.fillRoundedRect(bx, by, 48, 18, 4); // rich mahogany top
    g.fillStyle(0x5d3a13, 1); g.fillRect(bx, by + 18, 48, 4); // edge
    // Monitor
    g.fillStyle(0x2c3e50, 1); g.fillRect(bx + 16, by + 2, 16, 10);
    g.fillStyle(0x3498db, 0.8); g.fillRect(bx + 17, by + 3, 14, 8);
    g.fillStyle(0x2c3e50, 1); g.fillRect(bx + 22, by + 13, 4, 3);
    // Name plate
    g.fillStyle(0xd4ac0d, 1); g.fillRect(bx + 4, by + 7, 10, 3);
    // Pen holder
    g.fillStyle(0x5d3a13, 1); g.fillRect(bx + 38, by + 3, 6, 8);
    g.fillStyle(0x2c3e50, 1); g.fillRect(bx + 40, by + 1, 2, 3);
    g.fillRect(bx + 42, by + 2, 2, 2);
    // Chair
    g.fillStyle(0x2c3e50, 1); g.fillRoundedRect(bx + 12, by + 22, 24, 12, 5);
    g.fillStyle(0x1a252f, 1); g.fillRoundedRect(bx + 14, by + 24, 20, 8, 4);
  }

  private drawReceptionCounter(g: Phaser.GameObjects.Graphics, bx: number, by: number, widthTiles: number) {
    const w = widthTiles * TILE_SIZE;
    this.addPropCollision(bx, by, w, 20);
    g.fillStyle(0x000000, 0.15); g.fillRect(bx + 2, by + 2, w, 20);
    g.fillStyle(0xfdebd0, 1); g.fillRoundedRect(bx, by, w, 15, 4); // warm counter
    g.fillStyle(0xe8c4a0, 1); g.fillRect(bx, by + 15, w, 4);
    // Monitors
    const numMonitors = Math.min(3, Math.floor(widthTiles / 3));
    for (let i = 0; i < numMonitors; i++) {
      const mx = bx + 10 + i * (w / numMonitors);
      g.fillStyle(0x2c3e50, 1); g.fillRect(mx, by + 2, 14, 9);
      g.fillStyle(0x27ae60, 0.7); g.fillRect(mx + 1, by + 3, 12, 7);
    }
    // Bell
    g.fillStyle(0xf39c12, 1); g.fillCircle(bx + w - 14, by + 8, 5);
    g.fillStyle(0xe67e22, 1); g.fillRect(bx + w - 17, by + 12, 6, 2);
  }

  private drawKitchenCounter(g: Phaser.GameObjects.Graphics, bx: number, by: number, widthTiles: number) {
    const w = widthTiles * TILE_SIZE;
    this.addPropCollision(bx, by, w, 16);
    g.fillStyle(0x000000, 0.12); g.fillRect(bx + 2, by + 2, w, 16);
    g.fillStyle(0x717d7e, 1); g.fillRect(bx, by, w, 12);
    g.fillStyle(0x5d6d7e, 1); g.fillRect(bx, by + 12, w, 4);
    // Sink
    g.fillStyle(0x85c1e9, 0.5); g.fillRoundedRect(bx + 4, by + 2, 14, 8, 2);
    g.lineStyle(1, 0x7fb3d3, 1); g.strokeRoundedRect(bx + 4, by + 2, 14, 8, 2);
    g.fillStyle(0xbdc3c7, 1); g.fillRect(bx + 10, by + 1, 2, 3); // faucet
    // Microwave
    if (w > 48) {
      g.fillStyle(0x2c3e50, 1); g.fillRoundedRect(bx + 24, by + 2, 18, 8, 2);
      g.fillStyle(0x34495e, 1); g.fillRoundedRect(bx + 25, by + 3, 12, 6, 1);
      g.fillStyle(0x1abc9c, 0.5); g.fillRect(bx + 26, by + 4, 10, 4);
    }
  }

  private drawXRayViewer(g: Phaser.GameObjects.Graphics, bx: number, by: number) {
    this.addPropCollision(bx, by, 32, 24);
    g.fillStyle(0x000000, 0.2); g.fillRoundedRect(bx + 2, by + 2, 32, 24, 3);
    g.fillStyle(0x1a252f, 1); g.fillRoundedRect(bx, by, 32, 24, 3);
    // Light box
    g.fillStyle(0xe8f8ff, 0.85); g.fillRoundedRect(bx + 2, by + 2, 28, 18, 2);
    // X-ray silhouette
    g.fillStyle(0xaed6f1, 0.4); g.fillRoundedRect(bx + 8, by + 4, 16, 14, 2);
    // Ribcage lines
    g.lineStyle(1, 0x2c3e50, 0.5);
    for (let i = 0; i < 4; i++) {
      g.beginPath(); g.moveTo(bx + 10, by + 5 + i * 3); g.lineTo(bx + 22, by + 5 + i * 3); g.strokePath();
    }
    // Controls
    g.fillStyle(0x34495e, 1); g.fillRect(bx + 2, by + 20, 28, 3);
    g.fillStyle(0x3498db, 0.8); g.fillCircle(bx + 6, by + 21, 2);
    g.fillStyle(0xf39c12, 0.8); g.fillCircle(bx + 12, by + 21, 2);
  }

  private drawParallelBars(g: Phaser.GameObjects.Graphics, bx: number, by: number) {
    this.addPropCollision(bx, by, 48, 32);
    // Two rails
    g.fillStyle(0x7f8c8d, 1);
    g.fillRoundedRect(bx, by + 12, 48, 4, 2);
    g.fillRoundedRect(bx, by + 24, 48, 4, 2);
    // Vertical posts
    g.fillStyle(0x95a5a6, 1);
    g.fillRect(bx + 2, by + 12, 4, 16);
    g.fillRect(bx + 20, by + 12, 4, 16);
    g.fillRect(bx + 42, by + 12, 4, 16);
    // Floor mats
    g.fillStyle(0x27ae60, 0.6); g.fillRoundedRect(bx + 4, by + 28, 40, 6, 2);
    // Height labels
    g.fillStyle(0xaab7b8, 1); g.fillRect(bx, by + 6, 4, 6);
    g.fillStyle(0xaab7b8, 1); g.fillRect(bx, by + 28, 4, 6);
  }

  private drawExerciseMat(g: Phaser.GameObjects.Graphics, bx: number, by: number) {
    this.addPropCollision(bx, by, 40, 24);
    g.fillStyle(0x000000, 0.15); g.fillRoundedRect(bx + 2, by + 2, 40, 24, 4);
    g.fillStyle(0x27ae60, 0.85); g.fillRoundedRect(bx, by, 40, 24, 4);
    // Stripes
    g.lineStyle(2, 0x1e8449, 0.6);
    for (let i = 4; i < 40; i += 8) {
      g.beginPath(); g.moveTo(bx + i, by); g.lineTo(bx + i, by + 24); g.strokePath();
    }
    // Center cross
    g.lineStyle(2, 0x1abc9c, 0.4);
    g.beginPath(); g.moveTo(bx + 20, by); g.lineTo(bx + 20, by + 24); g.strokePath();
    g.beginPath(); g.moveTo(bx, by + 12); g.lineTo(bx + 40, by + 12); g.strokePath();
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
    this.lastActivity = `Respondendo a uma crise: ${event.title}`;
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
    const h = hud?.virtualPad ?? {};
    const w = (window as any).virtualPad ?? {};
    const pad = {
      up:                 !!(h.up   || w.up),
      down:               !!(h.down || w.down),
      left:               !!(h.left || w.left),
      right:              !!(h.right || w.right),
      sprint:             !!(h.sprint || w.sprint),
      actionJustPressed:  !!(h.actionJustPressed  || w.actionJustPressed),
      missionJustPressed: !!(h.missionJustPressed || w.missionJustPressed),
      menuJustPressed:    !!(h.menuJustPressed    || w.menuJustPressed),
    };
    // Proxy: writing "false" on a JustPressed key also clears the original sources
    const clearJust = (key: 'actionJustPressed' | 'missionJustPressed' | 'menuJustPressed') => {
      if (h[key]) h[key] = false;
      if ((window as any).virtualPad?.[key]) (window as any).virtualPad[key] = false;
    };
    return new Proxy(pad, {
      set(target, prop, value) {
        (target as any)[prop] = value;
        if (value === false && (prop === 'actionJustPressed' || prop === 'missionJustPressed' || prop === 'menuJustPressed')) {
          clearJust(prop as any);
        }
        return true;
      }
    });
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
       // Stop player movement completely while dialog/crisis is open
       this.player.move(false, false, false, false, delta);
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
      if (roomName) {
        this.events.emit(EV.ROOM_CHANGE, roomName);
        this.lastActivity = `Entrou em ${roomName}`;
      }
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

  // ─── Screen-share WebSocket ───────────────────────────────────────────────

  private _initScreenShare() {
    const tryConnect = () => {
      const room = (window as any).sessionRoom as { code: string; playerId: string; playerName?: string } | undefined;
      if (this._screenWs) return; // already connected/connecting
      if (room?.code && room?.playerId) {
        this._connectScreenShare(room.playerId, room.playerName ?? 'Estudante');
      } else {
        setTimeout(tryConnect, 600);
      }
    };
    setTimeout(tryConnect, 600);
  }

  private _connectScreenShare(playerId: string, playerName: string) {
    if (this._screenWs) return;
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${proto}//${location.host}/__screen-ws?role=student&id=${encodeURIComponent(playerId)}&name=${encodeURIComponent(playerName)}`;
    const ws = new WebSocket(url);
    this._screenWs = ws;

    // If WS never opens within 6s, switch to HTTP screenshot fallback
    const failTimer = setTimeout(() => {
      if (ws.readyState !== WebSocket.OPEN) {
        this._screenShareFallback = true;
        ws.close();
        this._startFallbackCapture();
      }
    }, 6000);

    ws.onopen = () => {
      clearTimeout(failTimer);
      this._screenShareFallback = false;
      this._startFrameCapture();
    };

    ws.onclose = () => {
      // Do NOT clear failTimer here — if WS fails before opening, the timer
      // must still fire so the HTTP screenshot fallback is activated.
      // Only onopen clears it (WS actually succeeded).
      this._screenWs = null;
      if (this._screenFrameRAF) { cancelAnimationFrame(this._screenFrameRAF); this._screenFrameRAF = 0; }
      this._screenEncoding = false;
      // Only auto-reconnect WS if not in fallback mode
      if (!this._screenShareFallback) {
        setTimeout(() => {
          const room = (window as any).sessionRoom as { code: string; playerId: string; playerName?: string } | undefined;
          if (room?.code && room?.playerId) {
            this._connectScreenShare(room.playerId, room.playerName ?? 'Estudante');
          }
        }, 2000);
      }
    };

    ws.onerror = () => ws.close();
  }

  private _startFallbackCapture() {
    if (this._screenshotInterval) return;
    // 500 ms — best achievable on Netlify serverless (~2 fps after blob round-trip)
    this._screenshotInterval = setInterval(() => this._captureFallbackScreenshot(), 500);
  }

  private async _captureFallbackScreenshot() {
    if (this._screenshotBusy) return; // previous encode still in flight
    const room = (window as any).sessionRoom as { code: string; playerId: string } | undefined;
    if (!room?.code || !room?.playerId) return;
    const src = this.game.canvas;
    if (!src || src.width === 0 || src.height === 0) return;
    this._screenshotBusy = true;
    try {
      // 640×360 at quality 0.50 gives clear visuals (~15-40 KB raw JPEG)
      const bitmap = await createImageBitmap(src, {
        resizeWidth: 640,
        resizeHeight: 360,
        resizeQuality: 'medium',
      });
      const offscreen = new OffscreenCanvas(640, 360);
      offscreen.getContext('2d')!.drawImage(bitmap, 0, 0);
      bitmap.close();
      const blob = await offscreen.convertToBlob({ type: 'image/jpeg', quality: 0.50 });
      if (blob.size < 1000 || blob.size > 200_000) return;
      // POST raw JPEG binary directly — no base64 encoding on the client
      fetch(`/__rooms/${encodeURIComponent(room.code)}/screenshot/${encodeURIComponent(room.playerId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'image/jpeg' },
        body: blob,
      }).catch(() => {}); // fire-and-forget, never interrupt gameplay
    } catch { /* silent */ } finally {
      this._screenshotBusy = false;
    }
  }

  // rAF capture loop — encodes async via OffscreenCanvas so the game loop
  // is never blocked. Only one encode in flight at a time (_screenEncoding flag).
  private _startFrameCapture() {
    const loop = () => {
      this._screenFrameRAF = requestAnimationFrame(loop);
      const ws = this._screenWs;
      if (!ws || ws.readyState !== WebSocket.OPEN || this._screenEncoding) return;
      if (ws.bufferedAmount > 24576) return; // 24 KB: drop frame if buffer building up
      this._screenEncoding = true;
      this._captureAndSendFrame(ws).finally(() => { this._screenEncoding = false; });
    };
    this._screenFrameRAF = requestAnimationFrame(loop);
  }

  private async _captureAndSendFrame(ws: WebSocket) {
    try {
      const src = this.game.canvas;
      if (!src || src.width === 0 || src.height === 0) return;

      // createImageBitmap with resize runs off the main thread — zero game impact.
      const bitmap = await createImageBitmap(src, {
        resizeWidth: 512,
        resizeHeight: 288,
        resizeQuality: 'medium',
      });

      // convertToBlob (JPEG encode) also runs off main thread.
      const offscreen = new OffscreenCanvas(512, 288);
      offscreen.getContext('2d')!.drawImage(bitmap, 0, 0);
      bitmap.close();
      const blob = await offscreen.convertToBlob({ type: 'image/jpeg', quality: 0.8 });

      // Re-check after async work
      if (!this._screenWs || this._screenWs.readyState !== WebSocket.OPEN) return;
      if (this._screenWs.bufferedAmount > 24576) return;
      if (blob.size < 2000) return; // blank frame guard

      // Build binary frame: [uint32 headerLen LE][JSON header bytes][JPEG bytes]
      const levelInfo = getLevelInfo(this.state.prestige);
      const header = {
        type: 'frame',
        stats: {
          currentRoom: ROOM_NAMES[this.currentRoom] || 'Corredor',
          prestige: this.state.prestige,
          energy: Math.round(this.state.energy),
          stress: Math.round(this.state.stress || 0),
          level: levelInfo.title ?? `Nível ${levelInfo.level}`,
          completedMissions: this.state.completedMissions.length,
          lastActivity: this.lastActivity,
          shiftTime: Math.floor(this.state.gameTime / 60),
        },
      };
      const headerBytes = new TextEncoder().encode(JSON.stringify(header));
      const jpegBytes = new Uint8Array(await blob.arrayBuffer());

      const combined = new Uint8Array(4 + headerBytes.length + jpegBytes.length);
      new DataView(combined.buffer).setUint32(0, headerBytes.length, true);
      combined.set(headerBytes, 4);
      combined.set(jpegBytes, 4 + headerBytes.length);

      this._screenWs.send(combined.buffer);
    } catch { /* silent — never interrupt gameplay */ }
  }

  private _destroyScreenShare() {
    if (this._screenFrameRAF) { cancelAnimationFrame(this._screenFrameRAF); this._screenFrameRAF = 0; }
    if (this._screenWs) { this._screenWs.onclose = null; this._screenWs.close(); this._screenWs = null; }
    if (this._screenshotInterval) { clearInterval(this._screenshotInterval); this._screenshotInterval = null; }
    this._screenEncoding = false;
    this._pendingScreenshot = null;
  }

  private async broadcastState() {
    const room = (window as any).sessionRoom as { code: string; playerId: string; playerName?: string } | undefined;
    if (!room?.code || !room?.playerId) return;
    const levelInfo = getLevelInfo(this.state.prestige);
    const roomName = ROOM_NAMES[this.currentRoom] || 'Corredor';
    try {
      const payload: Record<string, unknown> = {
        playerId: room.playerId,
        currentRoom: roomName,
        prestige: this.state.prestige,
        energy: Math.round(this.state.energy),
        stress: Math.round(this.state.stress || 0),
        level: levelInfo.title ?? `Nível ${levelInfo.level}`,
        completedMissions: this.state.completedMissions.length,
        lastActivity: this.lastActivity,
        shiftTime: Math.floor(this.state.gameTime / 60),
      };
      const res = await fetch(`/__rooms/${encodeURIComponent(room.code)}/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      // If the server lost our state (e.g. after a Netlify cold start), re-register
      if (res.status === 404) {
        const register = (window as any).__registerInRoom as ((code: string, name: string) => Promise<boolean>) | undefined;
        if (register) await register(room.code, room.playerName ?? 'Estudante');
      }
    } catch { /* silent — never interrupt gameplay */ }
  }

  private openDialog(npc: NPC) {
    this.isDialogOpen = true;
    this.lastActivity = `Falando com ${npc.def.name}`;
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
