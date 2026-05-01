import * as Phaser from 'phaser';
import { TILE_SIZE, Direction } from '../constants';
import type { NPCDef, GameState, DialogueDef } from '../data/gameData';

const NPC_SPEED = 55;

export class NPC extends Phaser.Physics.Arcade.Sprite {
  readonly def: NPCDef;
  private direction: Direction = 'down';
  private stepTimer = 0;
  private stepFrame = 0;
  private readonly STEP_INTERVAL = 280;
  private waypointIdx = 0;
  private waitTimer = 0;
  private isWaiting = false;
  private exclamationMark: Phaser.GameObjects.Text | null = null;
  private nameLabel: Phaser.GameObjects.Text | null = null;
  private hasMission = false;

  private interactionBubble: Phaser.GameObjects.Text | null = null;
  private interactionBubbleTimer = 0;

  private lastX = 0;
  private lastY = 0;
  private stuckTimer = 0;
  private readonly STUCK_THRESHOLD = 1500;

  // Track how many times the player has talked to this NPC (for dialogue rotation)
  private conversationCount = 0;

  constructor(scene: Phaser.Scene, def: NPCDef) {
    const x = (def.startCol + 0.5) * TILE_SIZE;
    const y = (def.startRow + 0.5) * TILE_SIZE;
    super(scene, x, y, def.spriteKey);
    this.def = def;

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(10);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(16, 14);
    body.setOffset(14, 46);
    body.setImmovable(false);
    this.setFrame(0);

    this.lastX = x;
    this.lastY = y;

    const roleColors: Record<string, string> = {
      doctor: '#3498db', nurse: '#2ecc71', technician: '#9b59b6',
      admin: '#f39c12', receptionist: '#1abc9c', other: '#bdc3c7',
    };
    const nameCol = roleColors[def.role] || '#ffffff';

    this.nameLabel = scene.add.text(x, y - 36, def.name, {
      fontFamily: "'VT323', monospace",
      fontSize: '14px',
      color: nameCol,
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5, 1).setDepth(20);

    this.interactionBubble = scene.add.text(x, y - 64, '', {
      fontFamily: 'sans-serif',
      fontSize: '16px',
    }).setOrigin(0.5, 1).setDepth(21).setVisible(false);

    const roleTag = scene.add.text(x, y - 48, def.title, {
      fontFamily: "'VT323', monospace",
      fontSize: '11px',
      color: '#aaaaaa',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5, 1).setDepth(20).setVisible(false);
    this.setData('roleTag', roleTag);

    this.exclamationMark = scene.add.text(x, y - 56, '!', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '14px',
      color: '#ffdd00',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5, 1).setDepth(21).setVisible(false);
  }

  setHasMission(has: boolean) {
    this.hasMission = has;
    this.exclamationMark?.setVisible(has);
  }

  updateMissionStatus(state: GameState) {
    const anyActive = this.def.missionIds.some(id => !state.completedMissions.includes(id));
    this.setHasMission(anyActive);
  }

  update(delta: number) {
    if (this.def.patrolPoints.length < 2) return;

    if (this.isWaiting) {
      this.waitTimer -= delta;

      if (this.interactionBubble?.visible) {
        this.interactionBubbleTimer -= delta;
        if (this.interactionBubbleTimer <= 0) {
          this.interactionBubble.setVisible(false);
        } else {
          const floatY = Math.sin(this.scene.time.now / 200) * 2;
          this.interactionBubble.setY(this.y - this.displayHeight / 2 - 32 + floatY);
        }
      }

      if (this.waitTimer <= 0) {
        this.isWaiting = false;
        this.waypointIdx = (this.waypointIdx + 1) % this.def.patrolPoints.length;
        this.interactionBubble?.setVisible(false);
      }
      (this.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
      this.updateFrame(delta, false);
      this.updateLabels();
      return;
    }

    const target = this.def.patrolPoints[this.waypointIdx];
    const tx = (target.col + 0.5) * TILE_SIZE;
    const ty = (target.row + 0.5) * TILE_SIZE;
    const dx = tx - this.x, dy = ty - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const movedDelta = Math.hypot(this.x - this.lastX, this.y - this.lastY);
    if (movedDelta < 0.5 && dist > 12) {
      this.stuckTimer += delta;
      if (this.stuckTimer >= this.STUCK_THRESHOLD) {
        this.stuckTimer = 0;
        this.waypointIdx = (this.waypointIdx + 1) % this.def.patrolPoints.length;
        this.lastX = this.x; this.lastY = this.y;
        return;
      }
    } else {
      this.stuckTimer = 0;
    }
    this.lastX = this.x;
    this.lastY = this.y;

    if (dist < 12) {
      (this.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
      this.setPosition(tx, ty);
      this.isWaiting = true;
      this.waitTimer = Phaser.Math.Between(2000, 5000);

      let facedPoint: any = null;
      if (this.scene) {
        const gs = this.scene as any;
        if (gs.interactionPoints) {
          for (const pt of gs.interactionPoints) {
            const ndx = pt.x - this.x;
            const ndy = pt.y - this.y;
            if (Math.abs(ndx) <= 34 && Math.abs(ndy) <= 34) {
              if (Math.abs(ndx) > Math.abs(ndy)) {
                this.direction = ndx > 0 ? 'right' : 'left';
              } else {
                this.direction = ndy > 0 ? 'down' : 'up';
              }
              facedPoint = pt;
              break;
            }
          }
        }
      }

      if (!facedPoint) {
        if (Math.random() < 0.4) this.direction = 'up';
        else if (Math.random() < 0.2) this.direction = 'down';
        else if (Math.random() < 0.2) this.direction = 'left';
        else this.direction = 'right';

        if (Math.random() < 0.2) {
          this.interactionBubble?.setText(Math.random() > 0.5 ? '...' : '?').setVisible(true);
          this.interactionBubbleTimer = 2000;
        }
      } else {
        const typeMap: Record<string, string[]> = {
          'work': ['💻', '📋', '📁'],
          'inspect': ['🔬', '📊', '👁'],
          'sit': ['...', '💤'],
          'rest': ['☕', '🍱', '...'],
        };
        const icons = typeMap[facedPoint.type] || ['...'];
        const icon = icons[Math.floor(Math.random() * icons.length)];
        this.interactionBubble?.setText(icon).setVisible(true);
        this.interactionBubbleTimer = this.waitTimer * 0.8;
      }
      this.updateFrame(delta, false);
    } else {
      const vx = (dx / dist) * NPC_SPEED;
      const vy = (dy / dist) * NPC_SPEED;
      (this.body as Phaser.Physics.Arcade.Body).setVelocity(vx, vy);

      if (Math.abs(vx) > Math.abs(vy)) {
        this.direction = vx > 0 ? 'right' : 'left';
      } else {
        this.direction = vy > 0 ? 'down' : 'up';
      }
      this.updateFrame(delta, true);
    }

    this.updateLabels();
  }

  private updateLabels() {
    const offsetY = -this.displayHeight / 2 - 12;
    this.nameLabel?.setPosition(this.x, this.y + offsetY);

    const roleTag = this.getData('roleTag') as Phaser.GameObjects.Text | null;
    roleTag?.setPosition(this.x, this.y + offsetY - 12);

    const exclY = this.y + offsetY - (roleTag ? 22 : 10);
    this.exclamationMark?.setPosition(this.x, exclY);

    if (this.exclamationMark?.visible) {
      const floatY = Math.sin(this.scene.time.now / 400) * 3;
      this.exclamationMark.setY(exclY + floatY);
    }
  }

  private updateFrame(delta: number, moving: boolean) {
    if (moving) {
      this.stepTimer += delta;
      if (this.stepTimer >= this.STEP_INTERVAL) {
        this.stepTimer = 0;
        this.stepFrame = this.stepFrame === 1 ? 2 : 1;
      }
    } else {
      this.stepFrame = 0;
      this.stepTimer = 0;
    }
    const dirBase: Record<Direction, number> = { down: 0, up: 3, left: 6, right: 9 };
    this.setFrame(dirBase[this.direction] + this.stepFrame);
  }

  getActiveMission(state: GameState) {
    return this.def.missionIds.find(id => !state.completedMissions.includes(id));
  }

  /** Returns dialogue with choices shuffled — order changes every conversation */
  getDialogue(state: GameState): DialogueDef {
    let found: DialogueDef | null = null;

    // If NPC has dialogue pools, rotate through them
    if (this.def.dialoguePools) {
      const poolIdx = this.conversationCount % this.def.dialoguePools.length;
      const pool = this.def.dialoguePools[poolIdx];
      for (const d of pool) {
        if (!d.condition || d.condition(state)) { found = d; break; }
      }
      if (!found) found = pool[pool.length - 1];
    } else {
      for (const d of this.def.dialogues) {
        if (!d.condition || d.condition(state)) { found = d; break; }
      }
      if (!found) found = this.def.dialogues[this.def.dialogues.length - 1];
    }

    this.conversationCount++;

    // Shuffle choices so correct answer is never in a predictable position
    const shuffledChoices = shuffleArray([...found.choices]);
    return { ...found, choices: shuffledChoices };
  }

  destroy(fromScene?: boolean) {
    this.nameLabel?.destroy();
    this.exclamationMark?.destroy();
    (this.getData('roleTag') as Phaser.GameObjects.Text | null)?.destroy();
    super.destroy(fromScene);
  }
}

function shuffleArray<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
