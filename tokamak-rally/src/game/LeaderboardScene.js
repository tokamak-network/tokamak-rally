import Phaser from 'phaser';
import { wallet } from '../web3/wallet.js';

export class LeaderboardScene extends Phaser.Scene {
  constructor() { super('Leaderboard'); }

  create() {
    const cx = 400;

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(0x0a0a15); bg.fillRect(0, 0, 800, 600);
    bg.fillStyle(0xf4d35e, 0.05);
    bg.fillRoundedRect(30, 30, 740, 540, 12);
    bg.lineStyle(1, 0xf4d35e, 0.3);
    bg.strokeRoundedRect(30, 30, 740, 540, 12);

    // Title
    this.add.text(cx, 60, '🏆 LEADERBOARD', {
      fontSize: '32px', fontFamily: 'monospace', color: '#f4d35e', fontStyle: 'bold',
    }).setOrigin(0.5);

    // Header row
    const headerY = 110;
    this.add.text(70, headerY, '#', { fontSize: '13px', fontFamily: 'monospace', color: '#888' });
    this.add.text(110, headerY, 'PLAYER', { fontSize: '13px', fontFamily: 'monospace', color: '#888' });
    this.add.text(420, headerY, 'TIME', { fontSize: '13px', fontFamily: 'monospace', color: '#888' });
    this.add.text(560, headerY, 'CAR', { fontSize: '13px', fontFamily: 'monospace', color: '#888' });

    // Divider
    const divider = this.add.graphics();
    divider.lineStyle(1, 0xf4d35e, 0.2);
    divider.beginPath(); divider.moveTo(60, headerY + 18); divider.lineTo(740, headerY + 18); divider.strokePath();

    // Loading text
    this.statusText = this.add.text(cx, 300, '', {
      fontSize: '16px', fontFamily: 'monospace', color: '#a89070',
    }).setOrigin(0.5);

    this.rowTexts = [];

    if (!wallet.isContractReady()) {
      this.statusText.setText('Leaderboard will be available\nafter contract deployment').setAlign('center');
    } else {
      this.statusText.setText('Loading...');
      this.loadRecords();
    }

    // Back hint
    const backText = this.add.text(cx, 560, '[ ESC: Back to Menu ]', {
      fontSize: '16px', fontFamily: 'monospace', color: '#f4d35e',
    }).setOrigin(0.5);
    this.tweens.add({ targets: backText, alpha: 0.3, duration: 500, yoyo: true, repeat: -1 });

    this.input.keyboard.once('keydown-ESC', () => {
      this.scene.start('Menu');
    });
  }

  async loadRecords() {
    try {
      const records = await wallet.getAllRecords();
      if (records.length === 0) {
        this.statusText.setText('No records yet. Be the first!');
        return;
      }

      // Group by player best time
      const bestMap = new Map();
      for (const r of records) {
        const addr = r.player.toLowerCase();
        if (!bestMap.has(addr) || r.time < bestMap.get(addr).time) {
          bestMap.set(addr, r);
        }
      }

      // Sort by time
      const sorted = [...bestMap.values()].sort((a, b) => a.time - b.time);
      this.statusText.setText('');

      const startY = 140;
      const max = Math.min(sorted.length, 15);
      for (let i = 0; i < max; i++) {
        const r = sorted[i];
        const y = startY + i * 24;
        const isMe = wallet.address && r.player.toLowerCase() === wallet.address.toLowerCase();
        const color = isMe ? '#f4d35e' : '#f1faee';
        const rankColors = ['#f4d35e', '#c0c0c0', '#cd7f32'];

        const rank = i < 3 ? ['🥇', '🥈', '🥉'][i] : `${i + 1}`;
        this.add.text(70, y, rank, { fontSize: '14px', fontFamily: 'monospace', color: rankColors[i] || '#888' });

        const shortAddr = `${r.player.slice(0, 6)}...${r.player.slice(-4)}`;
        this.add.text(110, y, shortAddr, {
          fontSize: '14px', fontFamily: 'monospace', color,
          fontStyle: isMe ? 'bold' : 'normal',
        });

        this.add.text(420, y, this.fmt(r.time), {
          fontSize: '14px', fontFamily: 'monospace', color,
        });

        this.add.text(560, y, r.carId.replace('_', ' '), {
          fontSize: '12px', fontFamily: 'monospace', color: '#a89070',
        });

        if (isMe) {
          const highlight = this.add.graphics();
          highlight.fillStyle(0xf4d35e, 0.08);
          highlight.fillRoundedRect(55, y - 4, 690, 22, 4);
        }
      }
    } catch (e) {
      this.statusText.setText('Failed to load leaderboard\n' + (e.message || ''));
    }
  }

  fmt(ms) {
    if (ms < 0) ms = 0;
    const s = ms / 1000;
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}.${Math.floor((s % 1) * 1000).toString().padStart(3, '0')}`;
  }
}
