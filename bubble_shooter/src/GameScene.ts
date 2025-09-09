import Phaser from "phaser";

export default class GameScene extends Phaser.Scene {
  private shooterX!: number;
  private shooterY!: number;
  private shooterGfx!: Phaser.GameObjects.Graphics;

  private currentBubble!: Phaser.GameObjects.Image;
  private nextBubble!: Phaser.GameObjects.Image;
  private bubbleRadius: number = 20;

  private aimLine!: Phaser.GameObjects.Graphics;

  private activeBubble?: {
    x: number;
    y: number;
    r: number;
    velocityX: number;
    velocityY: number;
    gfx: Phaser.GameObjects.Image;
    color: string;
  };

  private currentBubbleColor!: string;
  private nextBubbleColor!: string;
  private colors = [
    "bubble_red",
    "bubble_yellow",
    "bubble_blue",
    "bubble_green",
  ];
  private speed = 600;

  //Variable grid
  // private grid: { color: number }[][] = [];
  // private grid: { color: string }[][] = [];
  private grid: (
    | { color: string; image: Phaser.GameObjects.Image }
    | undefined
  )[][] = [];

  private COLS = 11;
  private ROWS = 13;
  private TOP_PAD = 60;
  private ROW_H = Math.floor(this.bubbleRadius * Math.sqrt(3));
  private LEFT_PAD!: number;
  private RIGHT_PAD!: number;
  // private gridGraphics!: Phaser.GameObjects.Graphics;

  private shotsFired = 0;
  private shotsPerNewRow = 5;
  private pendingNewRow = false;

  private rowOffset = 0;

  constructor() {
    super("game");
  }

  preload() {
    this.load.image("backgroundImage", "/Football_Field.jpg");
    this.load.image("bubble_red", "/bubbles/BM.png");
    this.load.image("bubble_blue", "/bubbles/MC.png");
    this.load.image("bubble_green", "/bubbles/TOT.png");
    this.load.image("bubble_yellow", "/bubbles/DM.png");
  }

  create() {
    //Background Image
    this.add
      .image(this.scale.width / 2, this.scale.height / 2, "backgroundImage")
      .setOrigin(0.5, 0.5)
      .setDisplaySize(this.scale.width, this.scale.height);

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
    this.nextBubbleColor = Phaser.Utils.Array.GetRandom(this.colors);
    this.nextBubble = this.add
      .image(this.shooterX - 60, this.shooterY, this.nextBubbleColor)
      .setDisplaySize(this.bubbleRadius * 2, this.bubbleRadius * 2);
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

    // this.gridGraphics = this.add.graphics();

    for (let row = 0; row < this.ROWS; row++) {
      this.grid[row] = [];
      // for (let col = 0; col < this.COLS; col++) {
      //   this.grid[row][col] = { color: 0xffffff };
      // }
    }

    // this.drawGrid();
    this.generateInitialGrid(5);
  }

  private generateInitialGrid(rows: number) {
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < this.COLS; col++) {
        const colorKey = Phaser.Utils.Array.GetRandom(this.colors);
        const { x, y } = this.cellToWorld(row, col);

        const img = this.add
          .image(x, y, colorKey)
          .setDisplaySize(this.bubbleRadius * 2, this.bubbleRadius * 2);

        this.grid[row][col] = { color: colorKey, image: img };
      }
    }
  }

  // private drawGrid() {
  //   this.gridGraphics.clear();
  //   for (let row = 0; row < this.ROWS; row++) {
  //     for (let col = 0; col < this.COLS; col++) {
  //       const cell = this.grid[row][col];
  //       if (!cell) continue;
  //       const x =
  //         this.LEFT_PAD +
  //         col * this.bubbleRadius * 2 +
  //         this.bubbleRadius +
  //         (row % 2 === 1 ? this.bubbleRadius : 0);
  //       const y = this.TOP_PAD + row * this.ROW_H + this.bubbleRadius;
  //       // this.gridGraphics.fillStyle(cell.color, 1);
  //       // this.gridGraphics.fillCircle(x, y, this.bubbleRadius);
  //       this.add
  //         .image(x, y, cell.color)
  //         .setDisplaySize(this.bubbleRadius * 2, this.bubbleRadius * 2);
  //     }
  //   }
  // }

  //Convert row and col to coordinates in canva
  private cellToWorld(row: number, col: number) {
    // const xOffset = row % 2 === 0 ? 0 : this.bubbleRadius;
    const xOffset = (row + this.rowOffset) % 2 === 0 ? 0 : this.bubbleRadius;
    // const x =
    //   col * this.bubbleRadius * 2 + xOffset + this.LEFT_PAD + this.bubbleRadius;
    const x = col * this.bubbleRadius * 2 + xOffset + this.LEFT_PAD;
    const y = row * this.ROW_H + this.TOP_PAD + this.bubbleRadius;
    return { x, y };
  }

  //Return neighbors of bubble already exist
  private getNeighbors(row: number, col: number) {
    // const even = row % 2 === 0;
    const even = (row + this.rowOffset) % 2 === 0;
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

  //BFS: find cluster bubbles of the same color
  bfsFindGroup(startRow: number, startCol: number) {
    const startCell = this.grid[startRow][startCol];
    if (!startCell) return [];

    const color = startCell.color;
    const visited = new Set<string>();
    const queue: [number, number][] = [[startRow, startCol]];
    const group: [number, number][] = [];

    while (queue.length > 0) {
      const [row, col] = queue.shift()!;
      const key = `${row},${col}`;

      if (visited.has(key)) continue;
      visited.add(key);

      const cell = this.grid[row][col];
      if (!cell || cell.color !== color) continue;

      group.push([row, col]);

      for (const [nr, nc] of this.getNeighbors(row, col)) {
        if (!visited.has(`${nr},${nc}`)) {
          queue.push([nr, nc]);
        }
      }
    }
    return group;
  }

  // private removeGroup(group: [number, number][]) {
  //   for (const [row, col] of group) {
  //     const cell = this.grid[row][col];
  //     if (cell) {
  //       const { x, y } = this.cellToWorld(row, col);
  //       this.children.getChildren().forEach((child) => {
  //         if (
  //           child instanceof Phaser.GameObjects.Image &&
  //           Math.abs(child.x - x) < this.bubbleRadius &&
  //           Math.abs(child.y - y) < this.bubbleRadius
  //         ) {
  //           console.log("Children destroy", child);
  //           child.destroy();
  //         }
  //       });

  //       //delete value from grid
  //       this.grid[row][col] = undefined as any;
  //     }
  //   }
  //   this.drawGrid();
  // }

  private removeGroup(group: [number, number][]) {
    for (const [row, col] of group) {
      const cell = this.grid[row][col];
      if (cell) {
        cell.image.destroy();
        this.grid[row][col] = undefined;
      }
    }
  }

  private removeFloatingBubbles() {
    const visited = new Set<string>();
    const queue: [number, number][] = [];

    for (let col = 0; col < this.COLS; col++) {
      const cell = this.grid[0][col];
      if (cell) {
        const key = `0,${col}`;
        visited.add(key);
        queue.push([0, col]);
      }
    }

    while (queue.length > 0) {
      const [r, c] = queue.shift()!;
      for (const [nr, nc] of this.getNeighbors(r, c)) {
        const key = `${nr},${nc}`;
        if (visited.has(key)) continue;
        const neighbors = this.grid[nr][nc];
        if (!neighbors) continue;
        visited.add(key);
        queue.push([nr, nc]);
      }
    }

    for (let row = 0; row < this.ROWS; row++) {
      for (let col = 0; col < this.COLS; col++) {
        const cell = this.grid[row][col];
        if (!cell) continue;
        const key = `${row},${col}`;
        if (!visited.has(key)) {
          cell.image.destroy();
          this.grid[row][col] = undefined;
        }
      }
    }
  }

  private showGameOverPopup() {
    const width = this.scale.width;
    const height = this.scale.height;

    const overlay = this.add
      .rectangle(width / 2, height / 2, width, height, 0x000000, 0.5)
      .setDepth(1000);

    const text = this.add
      .text(width / 2, height / 2 - 40, "Game over", {
        fontSize: "32px",
        color: "#ffffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(1000);

    const subText = this.add
      .text(width / 2, height / 2, "Click to start", {
        fontSize: "20px",
        color: "#ffffff",
      })
      .setOrigin(0.5)
      .setDepth(1001);

    this.input.on("pointerdown", () => {
      window.location.reload();
    });
  }

  private checkOverGame(row: number) {
    if (row >= this.ROWS - 1) {
      this.showGameOverPopup();
    }
  }

  private addNewRow() {
    const newRow: { color: string; image: Phaser.GameObjects.Image }[] = [];

    for (let col = 0; col < this.COLS; col++) {
      const colorKey = Phaser.Utils.Array.GetRandom(this.colors);
      const { x, y } = this.cellToWorld(0, col);

      const img = this.add
        .image(x, y, colorKey)
        .setDisplaySize(this.bubbleRadius * 2, this.bubbleRadius * 2);

      newRow[col] = { color: colorKey, image: img };
    }

    this.grid.unshift(newRow);

    this.rowOffset = 1 - this.rowOffset;

    while (this.grid.length > this.ROWS) {
      const removed = this.grid.pop();
      if (removed) {
        for (const cell of removed) {
          cell?.image.destroy();
        }
      }
    }

    for (let row = 0; row < this.ROWS; row++) {
      for (let col = 0; col < this.COLS; col++) {
        const cell = this.grid[row][col];
        if (cell && cell.image) {
          const { x, y } = this.cellToWorld(row, col);
          cell.image.setPosition(x, y);
        }
      }
    }

    for (let col = 0; col < this.COLS; col++) {
      if (this.grid[this.ROWS - 1] && this.grid[this.ROWS - 1][col]) {
        this.showGameOverPopup();
        break;
      }
    }
  }

  private placeBubbleToGrid(
    bubble: typeof this.activeBubble,
    row?: number,
    col?: number
  ) {
    if (!bubble) return;

    if (row === undefined || col === undefined) {
      row = Math.floor((bubble.y - this.TOP_PAD) / this.ROW_H);
      // const rowOffset = row % 2 === 0 ? 0 : this.bubbleRadius;
      const rowXOffset =
        (row + this.rowOffset) % 2 === 0 ? 0 : this.bubbleRadius;
      col = Math.floor(
        (bubble.x - this.LEFT_PAD + rowXOffset) / (this.bubbleRadius * 2)
      );
    }

    if (row >= 0 && row < this.ROWS && col >= 0 && col < this.COLS) {
      this.checkOverGame(row);

      const { x, y } = this.cellToWorld(row, col);

      const img = this.add
        .image(x, y, bubble.color)
        .setDisplaySize(this.bubbleRadius * 2, this.bubbleRadius * 2);

      this.grid[row][col] = { color: bubble.color, image: img };

      // tìm nhóm cùng màu
      const group = this.bfsFindGroup(row, col);
      if (group.length >= 3) {
        this.removeGroup(group);
        this.removeFloatingBubbles();
      }
    }

    // hủy bubble bay
    bubble.gfx.destroy();
    this.activeBubble = undefined;

    if (this.pendingNewRow) {
      this.addNewRow();
      this.pendingNewRow = false;
    }
  }

  private spawnNewBubble() {
    //check current bubble
    if (this.currentBubble) {
      this.currentBubble.destroy();
    }

    //random colors
    this.currentBubbleColor = this.nextBubbleColor;

    this.currentBubble = this.add
      .image(this.shooterX, this.shooterY, this.currentBubbleColor)
      .setDisplaySize(this.bubbleRadius * 2, this.bubbleRadius * 2);

    this.nextBubbleColor = Phaser.Utils.Array.GetRandom(this.colors);
    this.nextBubble.setTexture(this.nextBubbleColor);
  }

  private drawAimLine(mouseX: number, mouseY: number) {
    this.aimLine.clear();
    this.aimLine.beginPath();
    this.aimLine.moveTo(this.shooterX, this.shooterY);
    this.aimLine.lineTo(mouseX, mouseY);
    this.aimLine.strokePath();
  }

  private shootBubble(mouseX: number, mouseY: number) {
    if (this.activeBubble) return;

    //Caculate direction vector(1)
    // const dx = mouseX - this.shooterX;
    // const dy = mouseY - this.shooterY;
    // const lenght = Math.sqrt(dx * dx + dy * dy);
    // const vx = dx / lenght;
    // const vy = dy / lenght;

    // Tính góc
    let angle = Phaser.Math.Angle.Between(
      this.shooterX,
      this.shooterY,
      mouseX,
      mouseY
    );

    if (angle > 0) angle *= -1;

    // Velocity
    const vx = Math.cos(angle);
    const vy = Math.sin(angle);

    const gfx = this.add
      .image(this.shooterX, this.shooterY, this.currentBubbleColor)
      .setDisplaySize(this.bubbleRadius * 2, this.bubbleRadius * 2);

    this.activeBubble = {
      x: this.shooterX,
      y: this.shooterY,
      r: this.bubbleRadius,
      velocityX: vx * this.speed,
      velocityY: vy * this.speed,
      gfx,
      color: this.currentBubbleColor,
    };

    this.spawnNewBubble();
    this.shotsFired++;
    console.log("Shot fired", this.shotsFired);

    if (this.shotsFired >= this.shotsPerNewRow) {
      this.shotsFired = 0;
      // this.addNewRow();
      this.pendingNewRow = true;
    }
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
    // this.activeBubble.gfx.clear();
    // this.activeBubble.gfx.fillStyle(this.activeBubble.color, 1);
    // this.activeBubble.gfx.fillCircle(
    //   this.activeBubble.x,
    //   this.activeBubble.y,
    //   this.activeBubble.r
    // );
    this.activeBubble.gfx.setPosition(this.activeBubble.x, this.activeBubble.y);

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
      return;
    }

    this.checkCollisionWithGrid();
  }
}
