import Phaser from 'phaser';
import { CARS } from './Cars.js';
import { wallet } from '../web3/wallet.js';

export class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  create() {
    this.selectedCar = 0;
    const cx = 400;

    const bg = this.add.graphics();
    bg.fillStyle(0x1a0f00); bg.fillRect(0,0,800,600);
    bg.fillStyle(0x2a1a08,0.8); bg.fillRect(0,0,800,180);
    bg.fillStyle(0xd4a76a,0.08);
    bg.fillEllipse(200,550,500,160);
    bg.fillEllipse(600,560,400,130);

    // Title
    this.add.text(cx,50,'TOKAMAK',{
      fontSize:'56px',fontFamily:'monospace',color:'#f4d35e',fontStyle:'bold',
    }).setOrigin(0.5);
    this.add.text(cx,105,'R  A  L  L  Y',{
      fontSize:'40px',fontFamily:'monospace',color:'#e63946',fontStyle:'bold',
    }).setOrigin(0.5);
    this.add.text(cx,142,'Blockchain Time Attack · Point-to-Point',{
      fontSize:'12px',fontFamily:'monospace',color:'#d4a76a',
    }).setOrigin(0.5);

    // === CAR SELECTION ===
    const selBox = this.add.graphics();
    selBox.fillStyle(0x0a0a15,0.85);
    selBox.fillRoundedRect(40,165,720,280,10);
    selBox.lineStyle(1,0xf4d35e,0.3);
    selBox.strokeRoundedRect(40,165,720,280,10);

    this.add.text(cx,180,'◈ SELECT YOUR MACHINE',{
      fontSize:'16px',fontFamily:'monospace',color:'#f4d35e',fontStyle:'bold',
    }).setOrigin(0.5);

    // Car preview sprite (1.75x scale, clear of text)
    const previewTex0 = this.textures.exists(`v2_car_${CARS[0].id}`) ? `v2_car_${CARS[0].id}` : `car_${CARS[0].id}`;
    this.carPreview = this.add.sprite(cx, 230, previewTex0).setScale(0.98).setDepth(5).setFlipY(true);

    // Car name (below sprite with gap)
    this.carNameText = this.add.text(cx, 290, '', {
      fontSize:'20px',fontFamily:'monospace',fontStyle:'bold',
    }).setOrigin(0.5);

    // Team name
    this.carTeamText = this.add.text(cx, 312, '', {
      fontSize:'11px',fontFamily:'monospace',color:'#888',
    }).setOrigin(0.5);

    // Description
    this.carDescText = this.add.text(cx, 330, '', {
      fontSize:'11px',fontFamily:'monospace',color:'#a89070',
    }).setOrigin(0.5);

    // Stat bars — clean layout
    this.statLabels = ['TOP SPEED', 'CORNERING', 'ACCEL', 'BRAKING', 'RECOVERY'];
    this.statKeys = ['topSpeed', 'cornering', 'acceleration', 'braking', 'recovery'];
    this.statBars = [];
    this.statTexts = [];
    this.statBarBgs = [];

    const statStartY = 348;
    const labelX = 165;
    const barX = 175;
    const barW = 240;
    const barH = 8;

    for (let i = 0; i < 5; i++) {
      const y = statStartY + i * 16;
      this.add.text(labelX, y, this.statLabels[i], {
        fontSize:'10px',fontFamily:'monospace',color:'#888',
      }).setOrigin(1, 0.5);

      const barBg = this.add.graphics();
      barBg.fillStyle(0x333333); barBg.fillRect(barX, y - barH/2, barW, barH);
      this.statBarBgs.push(barBg);

      const bar = this.add.graphics();
      this.statBars.push(bar);

      const txt = this.add.text(barX + barW + 8, y, '', {
        fontSize:'10px',fontFamily:'monospace',color:'#ccc',
      }).setOrigin(0, 0.5);
      this.statTexts.push(txt);
    }

    // Nav arrows
    this.add.text(120, 230, '◀', {
      fontSize:'36px',fontFamily:'monospace',color:'#f4d35e',
    }).setOrigin(0.5).setInteractive().on('pointerdown', () => this.changeCar(-1));

    this.add.text(680, 230, '▶', {
      fontSize:'36px',fontFamily:'monospace',color:'#f4d35e',
    }).setOrigin(0.5).setInteractive().on('pointerdown', () => this.changeCar(1));

    // switch hint removed

    // === STAGE INFO (compact) ===
    const infoBox = this.add.graphics();
    infoBox.fillStyle(0x2a1a08,0.7);
    infoBox.fillRoundedRect(40,455,720,80,8);

    this.add.text(cx,470,'STAGE 1: SAHARA CROSSING  ·  5 Zones  ·  4 Checkpoints',{
      fontSize:'13px',fontFamily:'monospace',color:'#f1faee',
    }).setOrigin(0.5);

    this.add.text(cx,490,'🏜️Sand→ 🪨Canyon→ 🏞️Riverbed→ ⛰️Mountain→ 🏁Sprint',{
      fontSize:'11px',fontFamily:'monospace',color:'#8b7355',
    }).setOrigin(0.5);

    this.add.text(cx,510,'⚠ Obstacles = speed penalty  |  CPs extend time  |  20s initial',{
      fontSize:'10px',fontFamily:'monospace',color:'#d4a76a',
    }).setOrigin(0.5);

    // Controls
    this.add.text(cx,540,'↑Accel  ↓Brake  ←→Steer  SPACE Drift',{
      fontSize:'12px',fontFamily:'monospace',color:'#5a4a3a',
    }).setOrigin(0.5);

    // Start + Leaderboard on same line
    const startText = this.add.text(cx,568,'[ ENTER: Start  |  L: Leaderboard ]',{
      fontSize:'18px',fontFamily:'monospace',color:'#f4d35e',
    }).setOrigin(0.5);
    this.tweens.add({targets:startText,alpha:0.2,duration:700,yoyo:true,repeat:-1});

    this.add.text(780,588,'v0.7.0',{fontSize:'10px',fontFamily:'monospace',color:'#3a2510'}).setOrigin(1,1);

    // === WALLET CONNECT (top-right) ===
    this.walletText = this.add.text(770, 16, '[ Connect Wallet ]', {
      fontSize: '12px', fontFamily: 'monospace', color: '#f4d35e',
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });

    this.walletStatus = this.add.graphics();

    if (wallet.connected) {
      this.updateWalletDisplay();
    }

    this.walletText.on('pointerdown', () => {
      if (wallet.connected) return;
      this.walletText.setText('Connecting...');
      wallet.connect().then(() => {
        this.updateWalletDisplay();
      }).catch((err) => {
        const msg = err.message.includes('MetaMask') ? 'MetaMask not found' : 'Connection failed';
        this.walletText.setText(msg).setColor('#e63946');
        this.time.delayedCall(2000, () => {
          this.walletText.setText('[ Connect Wallet ]').setColor('#f4d35e');
        });
      });
    });

    // Input
    this.input.keyboard.on('keydown-LEFT', () => this.changeCar(-1));
    this.input.keyboard.on('keydown-RIGHT', () => this.changeCar(1));
    this.input.keyboard.once('keydown-ENTER', () => this.startRace());
    this.input.keyboard.once('keydown-SPACE', () => this.startRace());
    this.input.keyboard.on('keydown-L', () => {
      this.scene.start('Leaderboard');
    });

    this.updateCarDisplay();
  }

  changeCar(dir) {
    this.selectedCar = (this.selectedCar + dir + CARS.length) % CARS.length;
    this.updateCarDisplay();
  }

  updateCarDisplay() {
    const car = CARS[this.selectedCar];
    const texKey = this.textures.exists(`v2_car_${car.id}`) ? `v2_car_${car.id}` : `car_${car.id}`;
    this.carPreview.setTexture(texKey);
    this.carNameText.setText(car.name).setColor(car.color);
    this.carTeamText.setText(car.team);
    this.carDescText.setText(car.desc);

    // Stat bars
    const statColors = {
      topSpeed: 0x4a9aff,
      cornering: 0xff8040,
      acceleration: 0x40e8b0,
      braking: 0xf4d35e,
      recovery: 0xe63946,
    };

    const barX = 175, barW = 240, barH = 8, statStartY = 348;
    for (let i = 0; i < 5; i++) {
      const key = this.statKeys[i];
      const val = car.stats[key];
      const y = statStartY + i * 16;
      this.statBars[i].clear();
      this.statBars[i].fillStyle(statColors[key] || 0xf4d35e, 0.9);
      this.statBars[i].fillRect(barX, y - barH/2, val / 10 * barW, barH);
      this.statTexts[i].setText(val + '/10');
    }
  }

  updateWalletDisplay() {
    this.walletText.setText(wallet.getShortAddress()).setColor('#2d6a4f');
    this.walletStatus.clear();
    this.walletStatus.fillStyle(0x2d6a4f);
    const bounds = this.walletText.getBounds();
    this.walletStatus.fillCircle(bounds.x - 10, bounds.y + 7, 4);
  }

  startRace() {
    this.scene.start('Race', { carId: CARS[this.selectedCar].id });
    this.scene.start('UI');
  }
}
