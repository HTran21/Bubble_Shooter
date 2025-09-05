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
  private speed = 600;

  //Variable grid
  private grid: { color: number }[][] = [];
  private COLS = 11;
  private ROWS = 13;
  private TOP_PAD = 60;
  private ROW_H = Math.floor(this.bubbleRadius * Math.sqrt(3));
  private LEFT_PAD!: number;
  private RIGHT_PAD!: number;
  private gridGraphics!: Phaser.GameObjects.Graphics;

  constructor() {
    super("game");
  }

  create() {
    this.LEFT_PAD = Math.floor(
      (this.scale.width - this.COLS * this.bubbleRadius * 2) / 2
    );
    this.RIGHT_PAD = Math.floor(this.scale.width - this.LEFT_PAD);

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

    // draw grid

    this.gridGraphics = this.add.graphics();

    for (let row = 0; row < this.ROWS; row++) {
      this.grid[row] = [];
      // for (let col = 0; col < this.COLS; col++) {
      //   this.grid[row][col] = { color: 0xffffff };
      // }
    }

    this.drawGrid();
  }

  private drawGrid() {
    this.gridGraphics.clear();
    for (let row = 0; row < this.ROWS; row++) {
      for (let col = 0; col < this.COLS; col++) {
        const cell = this.grid[row][col];
        if (!cell) continue;
        const x =
          this.LEFT_PAD +
          col * this.bubbleRadius * 2 +
          this.bubbleRadius +
          (row % 2 === 1 ? this.bubbleRadius : 0);
        const y = this.TOP_PAD + row * this.ROW_H + this.bubbleRadius;
        this.gridGraphics.fillStyle(cell.color, 1);
        this.gridGraphics.fillCircle(x, y, this.bubbleRadius);
      }
    }
  }

  //Convert row and col to coordinates in canva
  private cellToWorld(row: number, col: number) {
    const xOffset = row % 2 === 0 ? 0 : this.bubbleRadius;
    const x =
      col * this.bubbleRadius * 2 + xOffset + this.LEFT_PAD + this.bubbleRadius;
    const y = row * this.ROW_H + this.TOP_PAD + this.bubbleRadius;
    return { x, y };
  }
  //Return neighbors of bubble already exist
  private getNeighbors(row: number, col: number) {
    const even = row % 2 === 0;
    const dist = even
      ? [
          [-1, 0],
          [-1, -1],
          [0, -1],
          [0, 1],
          [1, 0],
          [1, -1],
        ]
      : [
          [-1, 0],
          [-1, 1],
          [0, -1],
          [0, 1],
          [1, 0],
          [1, 1],
        ];

    return dist
      .map(([dr, dc]) => [row + dr, col + dc])
      .filter(([r, c]) => r >= 0 && r < this.ROWS && c >= 0 && c < this.COLS);
  }

  private findBestEmptyNeighbor(row: number, col: number, bubble: any) {
    let best = null;
    let minDist = Number.MAX_VALUE;

    for (const [nr, nc] of this.getNeighbors(row, col)) {
      if (this.grid[nr][nc]) continue;
      const { x, y } = this.cellToWorld(nr, nc);
      const dx = bubble.x - x;
      const dy = bubble.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) {
        minDist = dist;
        best = { row: nr, col: nc, x, y };
      }
    }
    return best;
  }

  // private getGridPosition(x: number, y: number) {
  //   //row nearest
  //   const row = Math.floor((y - this.TOP_PAD) / this.ROW_H);
  //   //offset
  //   const rowOffset = row % 2 === 1 ? this.bubbleRadius : 0;
  //   //col nearest
  //   const col = Math.floor(
  //     (x - this.LEFT_PAD - rowOffset) / (this.bubbleRadius * 2)
  //   );
  //   return { row, col };
  // }

  private placeBubbleToGrid(
    bubble: typeof this.activeBubble,
    row?: number,
    col?: number
  ) {
    if (!bubble) return;

    // const { row, col } = this.getGridPosition(bubble.x, bubble.y);

    if (row === undefined || col === undefined) {
      row = Math.floor((bubble.y - this.TOP_PAD) / this.ROW_H);
      const rowOffset = row % 2 === 0 ? 0 : this.bubbleRadius;
      col = Math.floor(
        (bubble.x - this.LEFT_PAD + rowOffset) / (this.bubbleRadius * 2)
      );
    }

    if (row >= 0 && row < this.ROWS && col >= 0 && col <= this.COLS) {
      this.grid[row][col] = { color: bubble.color };
    }

    // delete bubble flying
    bubble.gfx.destroy();
    this.activeBubble = undefined;

    // redraw grid
    this.drawGrid();
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

  private checkCollisionWithGrid() {
    if (!this.activeBubble) return;

    for (let row = 0; row < this.ROWS; row++) {
      for (let col = 0; col < this.COLS; col++) {
        const cell = this.grid[row][col];
        if (!cell) continue;

        const { x, y } = this.cellToWorld(row, col);
        const dx = this.activeBubble.x - x;
        const dy = this.activeBubble.y - y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= this.bubbleRadius * 2 - 2) {
          const best = this.findBestEmptyNeighbor(row, col, this.activeBubble);
          if (best) {
            this.placeBubbleToGrid(
              { ...this.activeBubble, x: best.x, y: best.y },
              best.row,
              best.col
            );
          }
          return;
        }
      }
    }
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

    // if bubble touch the left/right edge
    if (
      this.activeBubble.x - this.activeBubble.r <= this.LEFT_PAD ||
      this.activeBubble.x + this.activeBubble.r >= this.RIGHT_PAD
    ) {
      this.activeBubble.velocityX *= -1;
    }

    //if bubble touch the bottom edge
    if (this.activeBubble.y + this.activeBubble.r >= this.scale.height) {
      this.activeBubble.velocityY *= -1;
    }

    //if bubble touch the top edge
    if (this.activeBubble.y - this.activeBubble.r <= this.TOP_PAD) {
      // this.activeBubble.velocityX = 0;
      // this.activeBubble.velocityY = 0;
      // this.activeBubble.y = this.TOP_PAD + this.activeBubble.r;
      this.placeBubbleToGrid(this.activeBubble);
    }

    this.checkCollisionWithGrid();
  }
}
