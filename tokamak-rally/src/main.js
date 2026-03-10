import Phaser from 'phaser';
import { BootScene } from './game/BootScene.js';
import { RaceScene } from './game/RaceScene.js';
import { UIScene } from './game/UIScene.js';
import { MenuScene } from './game/MenuScene.js';
import { LeaderboardScene } from './game/LeaderboardScene.js';
import { soundEngine } from './game/SoundEngine.js';

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
  scene: [BootScene, MenuScene, RaceScene, UIScene, LeaderboardScene],
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  }
};

// Destroy any existing game/audio instance (handles HMR and refresh edge cases)
soundEngine.destroy();
if (window.__TOKAMAK_GAME) {
  window.__TOKAMAK_GAME.destroy(true);
  window.__TOKAMAK_GAME = null;
}

// Clear any leftover canvases in the container
const container = document.getElementById('game-container');
if (container) {
  container.innerHTML = '';
}

const game = new Phaser.Game(config);
window.__TOKAMAK_GAME = game;

// Handle Vite HMR — destroy game on module hot replacement
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    soundEngine.destroy();
    if (window.__TOKAMAK_GAME) {
      window.__TOKAMAK_GAME.destroy(true);
      window.__TOKAMAK_GAME = null;
    }
  });
  import.meta.hot.accept();
}
