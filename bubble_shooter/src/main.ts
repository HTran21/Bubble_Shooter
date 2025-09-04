import Phaser from "phaser";
import GameScene from "./GameScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: "#12161c",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [GameScene],
};

// new Phaser.Game(config);
window.addEventListener("load", () => {
  new Phaser.Game(config);
});
