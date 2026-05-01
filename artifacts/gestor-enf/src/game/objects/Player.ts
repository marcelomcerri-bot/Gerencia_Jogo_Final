import * as Phaser from 'phaser';
import { PLAYER_SPEED, PLAYER_SPRINT_SPEED, Direction } from '../constants';

export class Player extends Phaser.Physics.Arcade.Sprite {
  private direction: Direction = 'down';
  private isMoving = false;
  private stepTimer = 0;
  private stepFrame = 0;
  private readonly STEP_INTERVAL = 190;
  private isSprinting = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(10);
    this.setCollideWorldBounds(true);
    const body = this.body as Phaser.Physics.Arcade.Body;
    // Tight feet-only body — offset tuned for 44×128 sprite (feet near bottom)
    body.setSize(16, 14);
    body.setOffset(14, 110);
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
    const interval = this.isSprinting ? 130 : this.STEP_INTERVAL;
    if (this.isMoving) {
      this.stepTimer += delta;
      if (this.stepTimer >= interval) {
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

  getDirection(): Direction { return this.direction; }
  isCurrentlyMoving(): boolean { return this.isMoving; }
  isCurrentlySprinting(): boolean { return this.isSprinting; }
}
