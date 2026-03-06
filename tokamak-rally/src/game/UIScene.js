import Phaser from 'phaser';

export class UIScene extends Phaser.Scene {
  constructor() { super('UI'); }

  create() {
    // === TIMER (center top, prominent) ===
    this.timeBg = this.add.graphics().setDepth(200);
    this.timeBg.fillStyle(0x000000, 0.7);
    this.timeBg.fillRoundedRect(270, 6, 260, 52, 8);

    this.timeLabel = this.add.text(400, 14, 'TIME REMAINING', {
      fontSize: '9px', fontFamily: 'monospace', color: '#a89070', letterSpacing: 2,
    }).setOrigin(0.5, 0).setDepth(201);

    this.timeText = this.add.text(400, 28, '0:30.000', {
      fontSize: '28px', fontFamily: 'monospace', color: '#f4d35e', fontStyle: 'bold',
    }).setOrigin(0.5, 0).setDepth(201);

    // === SPEED (left) ===
    const leftBg = this.add.graphics().setDepth(200);
    leftBg.fillStyle(0x000000, 0.6);
    leftBg.fillRoundedRect(10, 6, 130, 70, 8);

    this.speedText = this.add.text(75, 14, '0', {
      fontSize: '32px', fontFamily: 'monospace', color: '#f1faee', fontStyle: 'bold',
    }).setOrigin(0.5, 0).setDepth(201);

    this.add.text(75, 48, 'km/h', {
      fontSize: '10px', fontFamily: 'monospace', color: '#888',
    }).setOrigin(0.5, 0).setDepth(201);

    this.speedBar = this.add.graphics().setDepth(201);

    // Road type indicator
    this.roadTypeText = this.add.text(75, 62, 'SAND', {
      fontSize: '10px', fontFamily: 'monospace', color: '#d4a76a', fontStyle: 'bold',
    }).setOrigin(0.5, 0).setDepth(201);

    // Max speed indicator
    this.maxSpeedText = this.add.text(75, 82, '', {
      fontSize: '9px', fontFamily: 'monospace', color: '#666',
    }).setOrigin(0.5, 0).setDepth(201);

    // === CHECKPOINTS (right) ===
    const rightBg = this.add.graphics().setDepth(200);
    rightBg.fillStyle(0x000000, 0.6);
    rightBg.fillRoundedRect(638, 6, 152, 52, 8);

    this.cpLabel = this.add.text(714, 12, 'CHECKPOINTS', {
      fontSize: '9px', fontFamily: 'monospace', color: '#a89070', letterSpacing: 1,
    }).setOrigin(0.5, 0).setDepth(201);

    this.cpText = this.add.text(714, 28, '0 / 4', {
      fontSize: '24px', fontFamily: 'monospace', color: '#2d6a4f', fontStyle: 'bold',
    }).setOrigin(0.5, 0).setDepth(201);

    // === PROGRESS BAR (bottom) ===
    this.progressBg = this.add.graphics().setDepth(200);
    this.progressBar = this.add.graphics().setDepth(201);

    this.add.text(48, 576, 'START', {
      fontSize: '8px', fontFamily: 'monospace', color: '#666',
    }).setOrigin(0, 0.5).setDepth(201);

    this.add.text(752, 576, 'FINISH', {
      fontSize: '8px', fontFamily: 'monospace', color: '#666',
    }).setOrigin(1, 0.5).setDepth(201);

    this.progressPct = this.add.text(400, 576, '', {
      fontSize: '10px', fontFamily: 'monospace', color: '#f4d35e', fontStyle: 'bold',
    }).setOrigin(0.5, 0.5).setDepth(202);

    // Zone colors for progress bar
    this.zoneBarColors = {
      desert: 0xe8b84b,
      canyon: 0x8b3a2a,
      riverbed: 0xb8a080,
      mountain: 0x6a7080,
      sprint: 0xdaa520,
    };

    // Drift indicator
    this.driftText = this.add.text(400, 70, '◉ DRIFT', {
      fontSize: '14px', fontFamily: 'monospace', color: '#e63946', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(201).setAlpha(0);

    // Elapsed (small)
    this.elapsedText = this.add.text(20, 555, '', {
      fontSize: '9px', fontFamily: 'monospace', color: '#555',
    }).setDepth(201);

    // Road type colors
    this.roadColors = {
      PAVED: '#8a8aff', DIRT: '#c4a060', SAND: '#e8b84b',
      ROCKY: '#7a7a80', 'OFF-ROAD': '#e63946',
    };

    this.events.on('raceUpdate', (d) => this.updateHUD(d));
  }

  updateHUD(d) {
    const spd = Math.floor(d.speed);
    this.speedText.setText(spd.toString());

    // Time
    this.timeText.setText(this.fmt(d.timeRemaining));
    if (d.timeRemaining < 8000) this.timeText.setColor('#e63946');
    else if (d.timeRemaining < 15000) this.timeText.setColor('#ff8c42');
    else this.timeText.setColor('#f4d35e');

    // CPs
    this.cpText.setText(`${d.checkpointsPassed} / ${d.totalCheckpoints}`);
    this.cpText.setColor(d.checkpointsPassed >= d.totalCheckpoints ? '#f4d35e' : '#2d6a4f');

    // Road type
    this.roadTypeText.setText(d.roadType);
    this.roadTypeText.setColor(this.roadColors[d.roadType] || '#d4a76a');

    // Max speed
    const maxSpd = Math.floor(d.maxSpeed || 137);
    this.maxSpeedText.setText(`MAX: ${maxSpd}`);

    // Speed bar (vertical)
    this.speedBar.clear();
    this.speedBar.fillStyle(0x222222, 0.5);
    this.speedBar.fillRect(144, 10, 8, 62);
    const ratio = Math.min(spd / maxSpd, 1);
    const barH = 60 * ratio;
    let barCol = 0x2d6a4f;
    if (ratio > 0.9) barCol = 0xe63946;
    else if (ratio > 0.7) barCol = 0xf4d35e;
    this.speedBar.fillStyle(barCol, 0.8);
    this.speedBar.fillRect(145, 70 - barH, 6, barH);

    // Progress bar — zone colored
    this.progressBg.clear();
    this.progressBg.fillStyle(0x000000, 0.5);
    this.progressBg.fillRoundedRect(46, 568, 708, 16, 4);

    // Zone segments
    const zoneRanges = [
      { from: 0, to: 0.19, name: 'desert' },
      { from: 0.19, to: 0.38, name: 'canyon' },
      { from: 0.38, to: 0.57, name: 'riverbed' },
      { from: 0.57, to: 0.78, name: 'mountain' },
      { from: 0.78, to: 1.0, name: 'sprint' },
    ];
    for (const zr of zoneRanges) {
      const x = 48 + 704 * zr.from;
      const w = 704 * (zr.to - zr.from);
      this.progressBg.fillStyle(this.zoneBarColors[zr.name], 0.3);
      this.progressBg.fillRect(x, 570, w, 12);
    }

    // Player position
    this.progressBar.clear();
    const px = 48 + 704 * d.progress;
    this.progressBar.fillStyle(0xf4d35e);
    this.progressBar.fillTriangle(px, 568, px-4, 564, px+4, 564); // arrow
    this.progressBar.fillRect(px-1, 570, 3, 12);

    // CP markers
    const cpPos = [0.19, 0.38, 0.57, 0.78];
    for (let i = 0; i < cpPos.length; i++) {
      const cx = 48 + 704 * cpPos[i];
      this.progressBar.fillStyle(i < d.checkpointsPassed ? 0x2d6a4f : 0x888888);
      this.progressBar.fillRect(cx-1, 568, 3, 16);
    }

    this.progressPct.setText(`${Math.floor(d.progress * 100)}%`);

    // Drift
    this.driftText.setAlpha(d.drifting ? 0.9 : 0);

    // Elapsed
    this.elapsedText.setText(`ELAPSED: ${this.fmtShort(d.elapsedTime)}`);
  }

  fmt(ms) {
    if (ms<0) ms=0;
    const s=ms/1000;
    return `${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,'0')}.${Math.floor((s%1)*1000).toString().padStart(3,'0')}`;
  }
  fmtShort(ms) {
    const s=ms/1000;
    return `${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,'0')}`;
  }
}
