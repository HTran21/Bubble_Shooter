import Phaser from "phaser";

export default class GameScene extends Phaser.Scene {
  private shooterX!: number;
  private shooterY!: number;
  private shooterGfx!: Phaser.GameObjects.Graphics;

  private currentBubble!: Phaser.GameObjects.Graphics;
  private bubbleRadius: number = 20;

  private aimLine!: Phaser.GameObjects.Graphics;

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
  }

  private spawnNewBubble() {
    //check current bubble
    if (this.currentBubble) {
      this.currentBubble.destroy();
    }

    //random colors
    const colors = [0xf97070, 0x70f9a0, 0x709ff9, 0xf9f970];
    const bubbleColor = Phaser.Utils.Array.GetRandom(colors);

    //create new graphics
    this.currentBubble = this.add.graphics();
    this.currentBubble.fillStyle(bubbleColor, 1);
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
}
