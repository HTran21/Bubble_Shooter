import Phaser from "phaser";

export default class GameScene extends Phaser.Scene {
  private shooterX!: number;
  private shooterY!: number;
  private shooterGfx!: Phaser.GameObjects.Graphics;

  private currentBubble!: Phaser.GameObjects.Graphics;
  private bubbleRadius: number = 20;

  private aimLine!: Phaser.GameObjects.Graphics;

  private activeBubble?: {
    x: number;
    y: number;
    r: number;
    velocityX: number;
    velocityY: number;
    gfx: Phaser.GameObjects.Graphics;
    color: number;
  };

  private currentBubbleColor!: number;
  private colors = [0xf97070, 0x70f9a0, 0x709ff9, 0xf9f970];
  private speed = 300;

  constructor() {
    super("game");
  }

  create() {
    // shooter
    this.shooterX = this.scale.width / 2;
    this.shooterY = this.scale.height - 48;

    this.shooterGfx = this.add.graphics();
    this.shooterGfx.fillStyle(0xffffff, 0.2);
    this.shooterGfx.fillCircle(this.shooterX, this.shooterY, 22);

    //current bubble
    this.spawnNewBubble();

    //line shooter
    this.aimLine = this.add.graphics({
      lineStyle: { width: 2, color: 0xffffff },
    });

    //listen mouse event
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      this.drawAimLine(pointer.x, pointer.y);
    });

    //listen mouse click
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.shootBubble(pointer.x, pointer.y);
    });
  }

  private spawnNewBubble() {
    //check current bubble
    if (this.currentBubble) {
      this.currentBubble.destroy();
    }

    //random colors
    this.currentBubbleColor = Phaser.Utils.Array.GetRandom(this.colors);

    //create new graphics
    this.currentBubble = this.add.graphics();
    this.currentBubble.fillStyle(this.currentBubbleColor, 1);
    this.currentBubble.fillCircle(
      this.shooterX,
      this.shooterY,
      this.bubbleRadius
    );
  }

  private drawAimLine(mouseX: number, mouseY: number) {
    this.aimLine.clear();
    this.aimLine.beginPath();
    this.aimLine.moveTo(this.shooterX, this.shooterY);
    this.aimLine.lineTo(mouseX, mouseY);
    this.aimLine.strokePath();
  }

  private shootBubble(mouseX: number, mouseY: number) {
    //if there are bubble fly then can't shoot
    if (this.activeBubble) return;

    //Caculate direction vector(1)
    const dx = mouseX - this.shooterX;
    const dy = mouseY - this.shooterY;
    const lenght = Math.sqrt(dx * dx + dy * dy);
    const vx = dx / lenght;
    const vy = dy / lenght;

    //equivalent (1)
    // const angle = Phaser.Math.Angle.Between(
    //   this.shooterX,
    //   this.shooterY,
    //   mouseX,
    //   mouseY
    // );
    // const vx = Math.cos(angle);
    // const vy = Math.sin(angle);

    //create bubble
    const gfx = this.add.graphics();
    gfx.fillStyle(this.currentBubbleColor, 1);
    gfx.fillCircle(this.shooterX, this.shooterY, this.bubbleRadius);

    this.activeBubble = {
      x: this.shooterX,
      y: this.shooterY,
      r: this.bubbleRadius,
      velocityX: vx * this.speed,
      velocityY: vy * this.speed,
      gfx,
      color: this.currentBubbleColor,
    };

    //spawn new bubble to shooter
    this.spawnNewBubble();
  }

  update(time: number, delta: number) {
    if (!this.activeBubble) return;

    const dt = delta / 1000;

    //move bubble
    this.activeBubble.x += this.activeBubble.velocityX * dt;
    this.activeBubble.y += this.activeBubble.velocityY * dt;

    //redraw bubble
    this.activeBubble.gfx.clear();
    this.activeBubble.gfx.fillStyle(this.activeBubble.color, 1);
    this.activeBubble.gfx.fillCircle(
      this.activeBubble.x,
      this.activeBubble.y,
      this.activeBubble.r
    );

    //if bubble touch the top edge
    if (this.activeBubble.y - this.activeBubble.r <= 0) {
      this.activeBubble.velocityX = 0;
      this.activeBubble.velocityY = 0;
    }

    // if bubble touch the left/right edge
    if (
      this.activeBubble.x - this.activeBubble.r <= 0 ||
      this.activeBubble.x + this.activeBubble.r >= this.scale.width
    ) {
      this.activeBubble.velocityX *= -1;
    }

    //if bubble touch the bottom edge
    if (this.activeBubble.y + this.activeBubble.r >= this.scale.height) {
      this.activeBubble.velocityY *= -1;
    }
  }
}
