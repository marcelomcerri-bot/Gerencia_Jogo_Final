import * as Phaser from 'phaser';
import { PLAYER_SPEED, PLAYER_SPRINT_SPEED, Direction } from '../constants';

export class Player extends Phaser.Physics.Arcade.Sprite {
  private direction: Direction = 'down';
  private isMoving = false;
  private stepTimer = 0;
  private stepFrame = 0;
  private readonly STEP_INTERVAL = 110;
  private isSprinting = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(10);
    this.setCollideWorldBounds(true);
    const body = this.body as Phaser.Physics.Arcade.Body;
    // Body aligned with character's visual feet (drawn at groundY=68 in the 128px canvas)
    // offsetY = 68 - 7 = 61 (centers a 14px body at the feet baseline)
    body.setSize(14, 14);
    body.setOffset(15, 61);
    this.setFrame(0);
  }

  move(up: boolean, down: boolean, left: boolean, right: boolean, delta: number, sprint = false) {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);

    let dx = 0, dy = 0;
    if (left)  dx -= 1;
    if (right) dx += 1;
    if (up)    dy -= 1;
    if (down)  dy += 1;

    if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }

    this.isSprinting = sprint && (dx !== 0 || dy !== 0);
    const speed = this.isSprinting ? PLAYER_SPRINT_SPEED : PLAYER_SPEED;
    body.setVelocity(dx * speed, dy * speed);

    this.isMoving = dx !== 0 || dy !== 0;

    if (right && Math.abs(dx) >= Math.abs(dy)) this.direction = 'right';
    else if (left && Math.abs(dx) >= Math.abs(dy)) this.direction = 'left';
    else if (down) this.direction = 'down';
    else if (up)   this.direction = 'up';

    this.updateAnimation(delta);
  }

  private updateAnimation(delta: number) {
    const interval = this.isSprinting ? 75 : this.STEP_INTERVAL;
    if (this.isMoving) {
      this.stepTimer += delta;
      if (this.stepTimer >= interval) {
        this.stepTimer -= interval;
        this.stepFrame = (this.stepFrame + 1) % 6;
      }
    } else {
      this.stepFrame = 0;
      this.stepTimer = 0;
    }
    const dirBase: Record<Direction, number> = { down: 0, up: 6, right: 12, left: 18 };
    this.setFrame(dirBase[this.direction] + this.stepFrame);
  }

  getDirection(): Direction { return this.direction; }
  isCurrentlyMoving(): boolean { return this.isMoving; }
  isCurrentlySprinting(): boolean { return this.isSprinting; }
}
