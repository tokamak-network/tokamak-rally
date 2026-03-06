import Phaser from 'phaser';
import { BootScene } from './game/BootScene.js';
import { RaceScene } from './game/RaceScene.js';
import { UIScene } from './game/UIScene.js';
import { MenuScene } from './game/MenuScene.js';

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  backgroundColor: '#1a1a2e',
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    }
  },
  scene: [BootScene, MenuScene, RaceScene, UIScene],
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  }
};

const game = new Phaser.Game(config);
