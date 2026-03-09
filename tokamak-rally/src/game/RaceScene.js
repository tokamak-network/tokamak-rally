import Phaser from 'phaser';
import { TRACK_CONFIG, isOnTrack, getTrackProgress, getZoneByIndex, checkCheckpoint, checkFinish } from './Track.js';
import { CARS } from './Cars.js';
import { wallet } from '../web3/wallet.js';

export class RaceScene extends Phaser.Scene {
  constructor() { super('Race'); }

  init(data) {
    this.carState = null;
    this.raceState = null;
    this.obstacles = [];
    this.selectedCarId = (data && data.carId) || 'alpine_white';
    this.selectedCar = CARS.find(c => c.id === this.selectedCarId) || CARS[0];
  }

  create() {
    this.track = TRACK_CONFIG;
    this.cameras.main.setBackgroundColor(0xe8b84b);

    this.drawBackground();
    this.drawTrack();
    this.placeScenery();
    this.placeCheckpoints();
    this.placeRoadObstacles();

    this.player = this.add.sprite(this.track.startX, this.track.startY, `car_${this.selectedCarId}`)
      .setOrigin(0.5).setDepth(10);

    this.dustEmitter = this.add.particles(0, 0, 'dust_particle', {
      speed: { min: 15, max: 50 },
      scale: { start: 1, end: 0 },
      alpha: { start: 0.6, end: 0 },
      lifespan: 400, frequency: 40, emitting: false,
    });

    this.carState = {
      x: this.track.startX, y: this.track.startY,
      angle: this.track.startAngle, speed: 0,
      moveAngle: this.track.startAngle, // actual movement direction
      prevX: this.track.startX, prevY: this.track.startY,
      drifting: false, driftAngle: 0, driftBoost: 0,
      hitCooldown: 0,
    };

    this.raceState = {
      started: false, finished: false, timedOut: false,
      timeRemaining: this.track.initialTime,
      elapsedTime: 0,
      checkpointsPassed: 0,
      totalCheckpoints: this.track.checkpoints.length,
      checkpointTimes: [],
    };

    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setZoom(1.5);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.countdownText = this.add.text(400, 300, '3', {
      fontSize: '96px', fontFamily: 'monospace', color: '#f4d35e',
      fontStyle: 'bold', stroke: '#000', strokeThickness: 6,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100);

    this.warningOverlay = this.add.sprite(400, 300, 'time_warning')
      .setScrollFactor(0).setDepth(90).setAlpha(0);

    this.cpPopup = this.add.text(400, 200, '', {
      fontSize: '28px', fontFamily: 'monospace', color: '#2d6a4f',
      fontStyle: 'bold', stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100).setAlpha(0);

    this.hitFlash = this.add.text(400, 260, '💥', {
      fontSize: '32px',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100).setAlpha(0);

    this.zoneAnnounce = this.add.text(400, 140, '', {
      fontSize: '22px', fontFamily: 'monospace', color: '#f4d35e',
      fontStyle: 'bold', stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100).setAlpha(0);

    this.currentZoneName = 'desert';
    this._currentRoadLabel = 'SAND';
    this._currentZone = this.track.zones[0];
    this._currentRoadType = 'sand';

    this.startCountdown();

    if (this.scene.isActive('UI')) {
      this.scene.stop('UI');
    }
    this.scene.launch('UI');
  }

  drawBackground() {
    const wp = this.track.waypoints;
    for (const zone of this.track.zones) {
      let minX=Infinity, maxX=-Infinity, minY=Infinity, maxY=-Infinity;
      for (let i=zone.fromWP; i<=Math.min(zone.toWP, wp.length-1); i++) {
        minX=Math.min(minX,wp[i][0]); maxX=Math.max(maxX,wp[i][0]);
        minY=Math.min(minY,wp[i][1]); maxY=Math.max(maxY,wp[i][1]);
      }
      minX-=500; maxX+=500; minY-=500; maxY+=500;
      for (let x=minX; x<maxX; x+=64)
        for (let y=minY; y<maxY; y+=64)
          this.add.sprite(x, y, zone.bgTile).setOrigin(0).setDepth(0);
    }
  }

  drawTrack() {
    const wp = this.track.waypoints;
    for (const zone of this.track.zones) {
      const g = this.add.graphics().setDepth(1);
      const s = Math.max(0, zone.fromWP);
      const e = Math.min(zone.toWP+1, wp.length);
      const w = zone.trackWidth || 100;

      // Border
      g.lineStyle(w+16, zone.roadBorder, 0.5);
      g.beginPath(); g.moveTo(wp[s][0],wp[s][1]);
      for (let i=s+1;i<e;i++) g.lineTo(wp[i][0],wp[i][1]);
      g.strokePath();

      // Road
      g.lineStyle(w, zone.roadColor);
      g.beginPath(); g.moveTo(wp[s][0],wp[s][1]);
      for (let i=s+1;i<e;i++) g.lineTo(wp[i][0],wp[i][1]);
      g.strokePath();

      // Road details by type
      if (zone.roadType === 'paved') {
        // Center yellow dashes only — cumulative distance based for uniform spacing
        g.lineStyle(2, 0xf4d35e, 0.4);
        const DASH_LEN = 12, GAP_LEN = 13;
        let drawing = true;
        let segRemain = 0;
        for (let i = s; i < e - 1; i++) {
          const dx = wp[i+1][0] - wp[i][0], dy = wp[i+1][1] - wp[i][1];
          const segLen = Math.sqrt(dx*dx + dy*dy);
          if (segLen < 1) continue;
          const ux = dx / segLen, uy = dy / segLen;
          let pos = 0;
          while (pos < segLen) {
            const phase = drawing ? DASH_LEN : GAP_LEN;
            const left = phase - segRemain;
            const step = Math.min(left, segLen - pos);
            if (drawing) {
              const x1 = wp[i][0] + ux * pos, y1 = wp[i][1] + uy * pos;
              const x2 = wp[i][0] + ux * (pos + step), y2 = wp[i][1] + uy * (pos + step);
              g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.strokePath();
            }
            pos += step;
            segRemain += step;
            if (segRemain >= phase) {
              segRemain = 0;
              drawing = !drawing;
            }
          }
        }
      } else if (zone.roadType === 'sand') {
        g.lineStyle(1, 0xb89050, 0.2);
        for (let i=s;i<e-1;i++) {
          const dx=wp[i+1][0]-wp[i][0],dy=wp[i+1][1]-wp[i][1];
          const len=Math.sqrt(dx*dx+dy*dy),nx=-dy/len,ny=dx/len;
          for (let j=0;j<len;j+=18) {
            const t=j/len,cx=wp[i][0]+dx*t,cy=wp[i][1]+dy*t;
            g.beginPath();
            g.moveTo(cx+nx*w*0.3,cy+ny*w*0.3);
            g.lineTo(cx-nx*w*0.3,cy-ny*w*0.3);
            g.strokePath();
          }
        }
      } else if (zone.roadType === 'dirt') {
        g.lineStyle(2, 0x5a4525, 0.2);
        for (const off of [-12,12]) {
          g.beginPath(); g.moveTo(wp[s][0]+off,wp[s][1]);
          for (let i=s+1;i<e;i++) g.lineTo(wp[i][0]+off,wp[i][1]);
          g.strokePath();
        }
      }
    }

    // START/FINISH — rotate banners perpendicular to road direction
    const wp0 = wp[0], wp1 = wp[1];
    const startAngle = Math.atan2(wp1[1]-wp0[1], wp1[0]-wp0[0]) * 180 / Math.PI + 90;
    this.add.sprite(wp0[0], wp0[1], 'finish_banner').setDepth(3).setAngle(startAngle);
    this.add.text(wp0[0], wp0[1]-40, '▶ START', {
      fontSize:'16px',fontFamily:'monospace',color:'#f4d35e',fontStyle:'bold',stroke:'#000',strokeThickness:2,
    }).setOrigin(0.5).setDepth(3);

    const wLast = wp[wp.length-1], wPrev = wp[wp.length-2];
    const finAngle = Math.atan2(wLast[1]-wPrev[1], wLast[0]-wPrev[0]) * 180 / Math.PI + 90;
    this.add.sprite(wLast[0], wLast[1], 'finish_banner').setDepth(3).setAngle(finAngle);
    this.add.text(wLast[0], wLast[1]-40, '🏁 FINISH', {
      fontSize:'16px',fontFamily:'monospace',color:'#e63946',fontStyle:'bold',stroke:'#000',strokeThickness:2,
    }).setOrigin(0.5).setDepth(3);
  }

  placeCheckpoints() {
    const wp = this.track.waypoints;
    for (const cp of this.track.checkpoints) {
      const idx = cp.waypointIndex;
      const p = wp[idx];
      // Get road direction at checkpoint
      const pPrev = wp[Math.max(0, idx-1)];
      const pNext = wp[Math.min(wp.length-1, idx+1)];
      const dx = pNext[0]-pPrev[0], dy = pNext[1]-pPrev[1];
      const len = Math.sqrt(dx*dx+dy*dy) || 1;
      const nx = -dy/len, ny = dx/len; // perpendicular
      // Place flags on road edges
      this.add.sprite(p[0]+nx*55, p[1]+ny*55, 'cp_flag').setDepth(3);
      this.add.sprite(p[0]-nx*55, p[1]-ny*55, 'cp_flag').setDepth(3);
      // Draw bar across road
      const bar = this.add.graphics().setDepth(3);
      bar.lineStyle(4, 0xe63946, 0.6);
      bar.beginPath();
      bar.moveTo(p[0]+nx*55, p[1]+ny*55);
      bar.lineTo(p[0]-nx*55, p[1]-ny*55);
      bar.strokePath();
      this.add.text(p[0],p[1]-30,cp.name,{
        fontSize:'12px',fontFamily:'monospace',color:'#fff',stroke:'#000',strokeThickness:3,fontStyle:'bold',
      }).setOrigin(0.5).setDepth(3);
    }
  }

  placeScenery() {
    const wp = this.track.waypoints;
    for (let i=0; i<wp.length-1; i++) {
      const zone = getZoneByIndex(i, this.track.zones);
      const [x1,y1]=wp[i],[x2,y2]=wp[i+1];
      const halfW = (zone.trackWidth||100)/2;
      const items = zone.scenery||['rock_grey'];
      const count = zone.sceneryDensity||3;
      for (let j=0;j<count;j++) {
        const t=Math.random();
        const bx=x1+(x2-x1)*t, by=y1+(y2-y1)*t;
        const ang=Math.random()*Math.PI*2;
        const dist=halfW+25+Math.random()*160;
        const type=items[Math.floor(Math.random()*items.length)];
        this.add.sprite(bx+Math.cos(ang)*dist, by+Math.sin(ang)*dist, type).setDepth(2);
      }
    }

    // Dense canyon walls
    const canyonZone = this.track.zones.find(z => z.name === 'canyon');
    if (canyonZone) {
      for (let i = canyonZone.fromWP + 1; i < Math.min(canyonZone.toWP, wp.length); i++) {
        const zone = getZoneByIndex(i, this.track.zones);
        const halfW = (zone.trackWidth||100)/2;
        for (let side=0;side<2;side++) {
          const [x,y]=wp[i];
          const a=side===0?-Math.PI/2+Math.random()*0.5:Math.PI/2+Math.random()*0.5;
          const d=halfW+5+Math.random()*25;
          this.add.sprite(x+Math.cos(a)*d,y+Math.sin(a)*d,'canyon_wall').setDepth(2).setScale(0.6+Math.random()*0.7);
        }
      }
    }

    // Oasis palms around CP3
    const cp3wp = this.track.checkpoints[2].waypointIndex;
    if (cp3wp < wp.length) {
      const cp3 = wp[cp3wp];
      for (let i=0;i<14;i++) {
        const a=Math.random()*Math.PI*2, d=50+Math.random()*80;
        this.add.sprite(cp3[0]+Math.cos(a)*d,cp3[1]+Math.sin(a)*d,'palm').setDepth(2);
      }
    }

    // Mountain pines
    const mtZone = this.track.zones.find(z => z.name === 'mountain');
    if (mtZone) {
      for (let i = mtZone.fromWP + 1; i < Math.min(mtZone.toWP, wp.length); i++) {
        const [x,y]=wp[i];
        for (let j=0;j<2;j++) {
          const a=Math.random()*Math.PI*2, d=60+Math.random()*120;
          this.add.sprite(x+Math.cos(a)*d,y+Math.sin(a)*d,'pine_tree').setDepth(2);
        }
      }
    }
  }

  placeRoadObstacles() {
    this.obstacles = [];
    const wp = this.track.waypoints;
    const penaltyMap = { obs_tokamak: 0.6 };
    const radiusMap = { obs_tokamak: 11 };

    for (const zone of this.track.zones) {
      const cfg = this.track.obstacleConfig[zone.name];
      if (!cfg) continue;
      for (let i=zone.fromWP; i<Math.min(zone.toWP,wp.length-1); i++) {
        if (Math.random() > cfg.density) continue;
        const [x1,y1]=wp[i],[x2,y2]=wp[i+1];
        const t=0.15+Math.random()*0.7;
        const bx=x1+(x2-x1)*t, by=y1+(y2-y1)*t;
        const dx=x2-x1,dy=y2-y1,len=Math.sqrt(dx*dx+dy*dy);
        if (len<1) continue;
        const nx=-dy/len,ny=dx/len;
        const hw=(zone.trackWidth||100)/2;
        const off=(Math.random()-0.5)*hw*1.0;
        const ox=bx+nx*off, oy=by+ny*off;
        const type=cfg.types[Math.floor(Math.random()*cfg.types.length)];
        const sprite=this.add.sprite(ox,oy,type).setDepth(5);
        this.obstacles.push({x:ox,y:oy,radius:radiusMap[type]||9,type,penalty:penaltyMap[type]||0.6,sprite});
      }
    }
  }

  startCountdown() {
    let count=3;
    this.time.addEvent({
      delay:1000, repeat:3,
      callback:()=>{
        count--;
        if(count>0) this.countdownText.setText(count.toString());
        else if(count===0){this.countdownText.setText('GO!').setColor('#e63946');this.raceState.started=true;}
        else this.countdownText.setVisible(false);
      }
    });
  }

  update(time, delta) {
    if(!this.raceState||!this.raceState.started||this.raceState.finished||this.raceState.timedOut) return;
    const dt=delta/1000;
    this.raceState.elapsedTime+=delta;
    this.raceState.timeRemaining-=delta;

    if(this.raceState.timeRemaining<=0){
      this.raceState.timeRemaining=0;this.raceState.timedOut=true;this.showTimeOut();return;
    }

    if(this.raceState.timeRemaining<10000)
      this.warningOverlay.setAlpha(Math.sin(time*0.01)*0.15+0.15);
    else this.warningOverlay.setAlpha(0);

    if(this.carState.hitCooldown>0) this.carState.hitCooldown-=delta;

    this.handleInput(dt);
    this.updateCar(dt);
    this.checkObstacles();
    this.checkProgress();
    this.checkZoneChange();

    this.player.x=this.carState.x; this.player.y=this.carState.y;
    this.player.angle=this.carState.angle+90;

    if(Math.abs(this.carState.speed)>25){
      this.dustEmitter.emitting=true;
      this.dustEmitter.setPosition(this.carState.x,this.carState.y);
      // Extra dust when drifting — use try/catch for particle API compat
      try {
        if(this.carState.drifting){
          this.dustEmitter.frequency=15;
        } else {
          this.dustEmitter.frequency=40;
        }
      } catch(e){}
    } else this.dustEmitter.emitting=false;

    this.obstacles.forEach(o=>{if(o.type==='obs_tokamak')o.sprite.angle+=2;});
    this.emitUI();
  }

  handleInput(dt) {
    const car=this.carState;
    const result=isOnTrack(car.x,car.y,this.track.waypoints,this.track.zones);
    let phys;
    const cp = this.selectedCar.physics;
    let roadType = 'offroad';
    if(result.onTrack&&result.zone){
      phys=this.track.roadPhysics[result.zone.roadType]||this.track.roadPhysics.dirt;
      roadType = result.zone.roadType;
      this._currentRoadLabel=phys.label;this._currentZone=result.zone;
    } else {
      phys=this.track.roadPhysics.offroad;
      this._currentRoadLabel='OFF-ROAD';this._currentZone=null;
    }
    this._currentRoadType = roadType;

    // Recovery boost: higher recovery stat = faster accel after obstacle hit
    const recoveryBoost = (car.hitCooldown > 0) ? (1 + (this.selectedCar.stats.recovery / 10) * 0.6) : 1;
    const effectiveAccel = phys.accel * cp.accelMul * recoveryBoost;
    const effectiveMax = cp.roadMaxSpeed[roadType] || 400;
    const effectiveTurn = phys.turn * cp.turnMul;
    const effectiveBrake = 400 * cp.brakeMul;
    const effectiveFriction = result.onTrack ? phys.friction : phys.friction * cp.offroadMul;

    // Accel / Brake
    if(this.cursors.up.isDown) car.speed+=effectiveAccel*dt;
    else if(this.cursors.down.isDown) car.speed-=effectiveBrake*dt;
    else car.speed*=effectiveFriction;

    // Drift boost on release
    if(car.driftBoost>0){
      car.speed+=car.driftBoost;
      car.driftBoost=0;
    }

    car.speed=Phaser.Math.Clamp(car.speed,-80,effectiveMax);
    if(Math.abs(car.speed)<3&&!this.cursors.up.isDown)car.speed=0;

    // Steering
    const spd=Math.abs(car.speed);
    if(spd>8){
      const sr=Math.min(spd/150,1);
      let steerDir=0;
      if(this.cursors.left.isDown) steerDir=-1;
      if(this.cursors.right.isDown) steerDir=1;

      if(this.spaceKey.isDown && spd>50 && steerDir!==0){
        // === DRIFT MODE ===
        if(!car.drifting){
          // Initiate drift — lock slide direction
          car.drifting=true;
          car.driftAngle=0;
        }
        // Car body rotates faster (2x turn rate)
        const driftTurn=effectiveTurn*2.0*sr;
        car.angle+=steerDir*driftTurn*dt;
        // Slide angle grows — difference between body and movement direction
        car.driftAngle+=steerDir*effectiveTurn*0.8*dt;
        car.driftAngle=Phaser.Math.Clamp(car.driftAngle,-45,45);
        // Minimal speed loss during drift (was 0.96, now 0.993)
        car.speed*=0.993;
        // Movement direction lags behind body angle (slide!)
        car.moveAngle+=(car.angle-car.moveAngle)*0.04;
      } else {
        // === NORMAL MODE ===
        if(car.drifting){
          // Drift release — award boost based on accumulated drift angle
          const driftIntensity=Math.abs(car.driftAngle)/45;
          car.driftBoost=driftIntensity*spd*0.15; // up to 15% speed boost
          car.drifting=false;
          car.driftAngle=0;
        }
        const turn=effectiveTurn*sr;
        car.angle+=steerDir*turn*dt;
        // Movement direction snaps toward body angle
        car.moveAngle+=(car.angle-car.moveAngle)*0.15;
      }
    } else {
      if(car.drifting){car.drifting=false;car.driftAngle=0;}
      car.moveAngle=car.angle;
    }
  }

  updateCar(dt){
    const car=this.carState;
    // Move along moveAngle (not body angle) — creates slide effect
    const moveRad=Phaser.Math.DegToRad(car.moveAngle);
    car.prevX=car.x;car.prevY=car.y;
    car.x+=Math.cos(moveRad)*car.speed*dt;
    car.y+=Math.sin(moveRad)*car.speed*dt;
  }

  checkObstacles(){
    if(this.carState.hitCooldown>0)return;
    const car=this.carState;
    for(const o of this.obstacles){
      const d=Math.sqrt((car.x-o.x)**2+(car.y-o.y)**2);
      if(d<o.radius+10){
        const effectivePenalty = 1 - (1 - o.penalty) * this.selectedCar.physics.obstaclePenaltyMul;
        car.speed *= effectivePenalty;
        car.hitCooldown=800;
        this.hitFlash.setAlpha(1);
        this.tweens.add({targets:this.hitFlash,alpha:0,duration:500});
        this.cameras.main.shake(200,0.006);
        const a=Math.atan2(car.y-o.y,car.x-o.x);
        car.x+=Math.cos(a)*6;car.y+=Math.sin(a)*6;
        break;
      }
    }
  }

  checkProgress(){
    const car=this.carState,rs=this.raceState;
    if(rs.checkpointsPassed<this.track.checkpoints.length){
      const cp=this.track.checkpoints[rs.checkpointsPassed];
      if(checkCheckpoint(car.x,car.y,cp,this.track.waypoints)){
        rs.checkpointsPassed++;rs.timeRemaining+=cp.timeBonus;
        rs.checkpointTimes.push(rs.elapsedTime);
        this.showCPPopup(cp);
      }
    }
    if(checkFinish(car.x,car.y,this.track.waypoints)){rs.finished=true;this.showFinish();}
  }

  checkZoneChange(){
    const p=getTrackProgress(this.carState.x,this.carState.y,this.track.waypoints);
    const z=getZoneByIndex(p.index,this.track.zones);
    if(z.name!==this.currentZoneName){
      this.currentZoneName=z.name;
      const labels={desert:'🏜️ DESERT',canyon:'🪨 ROCKY CANYON',riverbed:'🏞️ DRIED RIVERBED',mountain:'⛰️ MOUNTAIN PASS',sprint:'🏁 FINAL SPRINT'};
      const cp = this.selectedCar.physics;
      const maxSpd = Math.floor((cp.roadMaxSpeed[z.roadType] || 400) * 0.38);
      const roadLabels = this.track.roadPhysics[z.roadType] ? this.track.roadPhysics[z.roadType].label : z.roadType;
      this.zoneAnnounce.setText(`${labels[z.name]||z.name}\n${roadLabels} · Max ${maxSpd} km/h`).setAlpha(1);
      this.tweens.add({targets:this.zoneAnnounce,alpha:0,duration:3000,delay:500});
    }
  }

  showCPPopup(cp){
    this.cpPopup.setText(`✓ ${cp.name}\n+${(cp.timeBonus/1000).toFixed(0)}s`).setAlpha(1).setY(200);
    this.tweens.add({targets:this.cpPopup,alpha:0,y:160,duration:2500});
  }

  showTimeOut(){
    this.warningOverlay.setAlpha(0.35);
    const p=getTrackProgress(this.carState.x,this.carState.y,this.track.waypoints);
    this.add.text(400,240,'⏱ TIME OUT',{fontSize:'48px',fontFamily:'monospace',color:'#e63946',fontStyle:'bold',stroke:'#000',strokeThickness:5}).setOrigin(0.5).setScrollFactor(0).setDepth(100);
    this.add.text(400,300,`Progress: ${Math.floor(p.progress*100)}%  |  CP: ${this.raceState.checkpointsPassed}/${this.raceState.totalCheckpoints}`,{fontSize:'18px',fontFamily:'monospace',color:'#f1faee'}).setOrigin(0.5).setScrollFactor(0).setDepth(100);
    this.addRestart();
  }

  showFinish(){
    const rs=this.raceState;
    this.add.text(400,190,'🏁 STAGE CLEAR!',{fontSize:'44px',fontFamily:'monospace',color:'#f4d35e',fontStyle:'bold',stroke:'#000',strokeThickness:5}).setOrigin(0.5).setScrollFactor(0).setDepth(100);
    this.add.text(400,250,`Total: ${this.fmt(rs.elapsedTime)}`,{fontSize:'28px',fontFamily:'monospace',color:'#f1faee',stroke:'#000',strokeThickness:2}).setOrigin(0.5).setScrollFactor(0).setDepth(100);
    this.add.text(400,290,`Time Left: ${this.fmt(rs.timeRemaining)}`,{fontSize:'18px',fontFamily:'monospace',color:'#2d6a4f'}).setOrigin(0.5).setScrollFactor(0).setDepth(100);
    let sp=''; rs.checkpointTimes.forEach((t,i)=>{sp+=`CP${i+1}: ${this.fmt(t)}  `;});
    this.add.text(400,330,sp,{fontSize:'13px',fontFamily:'monospace',color:'#a89070'}).setOrigin(0.5).setScrollFactor(0).setDepth(100);

    // Leaderboard submit button
    if (wallet.connected) {
      if (!wallet.isContractReady()) {
        this.add.text(400, 370, 'Leaderboard coming soon', {
          fontSize: '13px', fontFamily: 'monospace', color: '#5a4a3a',
        }).setOrigin(0.5).setScrollFactor(0).setDepth(100);
      } else {
        const submitText = this.add.text(400, 370, '[ S: Submit to Leaderboard ]', {
          fontSize: '15px', fontFamily: 'monospace', color: '#2d6a4f',
        }).setOrigin(0.5).setScrollFactor(0).setDepth(100).setInteractive({ useHandCursor: true });

        const doSubmit = async () => {
          submitText.setText('Submitting...').setColor('#f4d35e').removeInteractive();
          try {
            const txHash = await wallet.submitRecord(Math.floor(rs.elapsedTime), this.selectedCarId);
            const shortTx = `${txHash.slice(0, 10)}...${txHash.slice(-6)}`;
            submitText.setText(`✓ Record submitted! Tx: ${shortTx}`).setColor('#2d6a4f');
          } catch (e) {
            submitText.setText('✗ Failed — press S to retry').setColor('#e63946');
            this.input.keyboard.once('keydown-S', doSubmit);
          }
        };

        submitText.on('pointerdown', doSubmit);
        this.input.keyboard.once('keydown-S', doSubmit);
      }
    }

    this.addRestart();
  }

  addRestart(){
    const rt=this.add.text(400,440,'[ ENTER: Retry  |  ESC: Menu ]',{fontSize:'16px',fontFamily:'monospace',color:'#f4d35e'}).setOrigin(0.5).setScrollFactor(0).setDepth(100);
    this.tweens.add({targets:rt,alpha:0.3,duration:500,yoyo:true,repeat:-1});

    this.input.keyboard.removeAllListeners('keydown-ENTER');
    this.input.keyboard.removeAllListeners('keydown-ESC');

    this.input.keyboard.once('keydown-ENTER', () => {
      this.scene.stop('UI');
      this.scene.restart({ carId: this.selectedCarId });
    });
    this.input.keyboard.once('keydown-ESC', () => {
      this.scene.stop('UI');
      this.scene.stop('Race');
      this.scene.start('Menu');
    });
  }

  emitUI(){
    const car=this.carState,rs=this.raceState;
    const p=getTrackProgress(car.x,car.y,this.track.waypoints);
    const cp = this.selectedCar.physics;
    const roadType = this._currentRoadType || 'offroad';
    const currentMax = cp.roadMaxSpeed[roadType] || 400;
    const uiScene = this.scene.get('UI');
    if (uiScene && uiScene.events) {
      uiScene.events.emit('raceUpdate',{
        speed: Math.abs(car.speed) * 0.38,
        maxSpeed: currentMax * 0.38,
        carName:this.selectedCar.name,
        timeRemaining:rs.timeRemaining,elapsedTime:rs.elapsedTime,
        checkpointsPassed:rs.checkpointsPassed,totalCheckpoints:rs.totalCheckpoints,
        roadType:this._currentRoadLabel||'SAND',zoneName:this.currentZoneName,
        progress:p.progress,drifting:car.drifting,driftAngle:car.driftAngle||0,finished:rs.finished,timedOut:rs.timedOut,
      });
    }
  }

  fmt(ms){if(ms<0)ms=0;const s=ms/1000;return `${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,'0')}.${Math.floor((s%1)*1000).toString().padStart(3,'0')}`;}
}
