import Phaser from 'phaser';
import { TRACK_CONFIG, isOnTrack, getTrackProgress, getZoneByIndex, checkCheckpoint, checkFinish } from './Track.js';
import { CARS } from './Cars.js';
import { wallet } from '../web3/wallet.js';
import { soundEngine } from './SoundEngine.js';

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
    this._animals = [];
    this._birdTimer = 5000 + Math.random() * 8000;

    this.drawBackground();
    this.drawTrack();
    this.drawSprintOverlay();
    this.placeBarriers();
    this.placeScenery();
    this.placeCheckpoints();
    this.placeRoadObstacles();

    const carTexture = this.textures.exists(`v2_car_${this.selectedCarId}`) ? `v2_car_${this.selectedCarId}` : `car_${this.selectedCarId}`;
    this.player = this.add.sprite(this.track.startX, this.track.startY, carTexture)
      .setOrigin(0.5).setDepth(10).setScale(0.85);

    this.dustEmitter = this.add.particles(0, 0, 'dust_particle', {
      speed: { min: 20, max: 70 },
      scale: { start: 1.5, end: 0.3 },
      alpha: { start: 0.7, end: 0 },
      lifespan: 700, frequency: -1, emitting: false,
    }).setDepth(9);
    this._dustTimer = 0;

    // Drift smoke emitter
    this.driftSmoke = this.add.particles(0, 0, 'smoke_particle', {
      speed: { min: 10, max: 30 },
      scale: { start: 1.2, end: 0 },
      alpha: { start: 0.5, end: 0 },
      lifespan: 600, frequency: 20, emitting: false,
    });

    // Snow ambient emitter (mountain zone only)
    this.snowEmitter = this.add.particles(0, 0, 'snow_particle', {
      speed: { min: 5, max: 20 },
      angle: { min: 240, max: 300 },
      scale: { start: 0.8, end: 0.2 },
      alpha: { start: 0.6, end: 0 },
      lifespan: 3000, frequency: 80, emitting: false,
    }).setDepth(15);

    // Zone dust texture mapping
    this._zoneDustTextures = {
      desert: 'dust_particle', canyon: 'dust_canyon', riverbed: 'dust_particle',
      mountain: 'snow_particle', sprint: 'smoke_particle',
      trans_desert_canyon: 'dust_canyon', trans_canyon_riverbed: 'dust_particle',
      trans_riverbed_mountain: 'snow_particle', trans_mountain_sprint: 'smoke_particle',
    };

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

    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setZoom(2.3);
    this.cameras.main.setFollowOffset(0, 0); // will be updated dynamically

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

    // Initialize sound engine
    soundEngine.init();
    soundEngine.resume();

    // ESC during gameplay → back to menu
    this.input.keyboard.on('keydown-ESC', () => {
      if (!this.raceState.finished && !this.raceState.timedOut) {
        soundEngine.stopAll(); soundEngine.stopBGM();
        this.scene.stop('UI');
        this.scene.stop('Race');
        this.scene.start('Menu');
      }
    });
  }

  drawBackground() {
    const wp = this.track.waypoints;
    // Map zone names to bgTile keys
    const zoneBgMap = {};
    for (const z of this.track.zones) { zoneBgMap[z.name] = z.bgTile; }

    for (const zone of this.track.zones) {
      let minX=Infinity, maxX=-Infinity, minY=Infinity, maxY=-Infinity;
      for (let i=zone.fromWP; i<=Math.min(zone.toWP, wp.length-1); i++) {
        minX=Math.min(minX,wp[i][0]); maxX=Math.max(maxX,wp[i][0]);
        minY=Math.min(minY,wp[i][1]); maxY=Math.max(maxY,wp[i][1]);
      }
      minX-=500; maxX+=500; minY-=500; maxY+=500;

      if (zone.transition) {
        // Transition zone: blend two background tiles
        const fromTile = zone.bgTile;
        const toZone = this.track.zones.find(z => z.name === zone.transition.to);
        const toTile = toZone ? toZone.bgTile : zone.bgTile;
        // Compute zone center Y for progress calculation
        const zoneMinY = Math.min(...Array.from({length: zone.toWP - zone.fromWP + 1}, (_, k) => wp[zone.fromWP + k] ? wp[zone.fromWP + k][1] : Infinity));
        const zoneMaxY = Math.max(...Array.from({length: zone.toWP - zone.fromWP + 1}, (_, k) => wp[zone.fromWP + k] ? wp[zone.fromWP + k][1] : -Infinity));
        const zoneMidY = (zoneMinY + zoneMaxY) / 2;
        const zoneSpanY = Math.max(zoneMaxY - zoneMinY, 1);

        for (let x=minX; x<maxX; x+=128) {
          for (let y=minY; y<maxY; y+=128) {
            // Progress based on Y position relative to zone span
            const progress = Phaser.Math.Clamp((y - zoneMinY) / zoneSpanY, 0, 1);
            // Waypoints go top to bottom (decreasing Y = forward), so invert if needed
            const midWP = Math.floor((zone.fromWP + zone.toWP) / 2);
            const goingUp = wp[zone.fromWP][1] > wp[zone.toWP][1];
            const p = goingUp ? (1 - progress) : progress;
            this.add.sprite(x, y, fromTile).setOrigin(0).setDepth(0).setAlpha(1 - p);
            this.add.sprite(x, y, toTile).setOrigin(0).setDepth(0).setAlpha(p);
          }
        }
      } else {
        for (let x=minX; x<maxX; x+=128)
          for (let y=minY; y<maxY; y+=128)
            this.add.sprite(x, y, zone.bgTile).setOrigin(0).setDepth(0);
      }
    }
  }

  drawTrack() {
    const wp = this.track.waypoints;
    for (const zone of this.track.zones) {
      const g = this.add.graphics().setDepth(1);
      const s = Math.max(0, zone.fromWP);
      const e = Math.min(zone.toWP+1, wp.length);
      const w = zone.trackWidth || 100;

      // Outer border
      g.lineStyle(w+20, zone.roadBorder, 0.4);
      g.beginPath(); g.moveTo(wp[s][0],wp[s][1]);
      for (let i=s+1;i<e;i++) g.lineTo(wp[i][0],wp[i][1]);
      g.strokePath();

      // Road surface
      g.lineStyle(w, zone.roadColor);
      g.beginPath(); g.moveTo(wp[s][0],wp[s][1]);
      for (let i=s+1;i<e;i++) g.lineTo(wp[i][0],wp[i][1]);
      g.strokePath();

      // Compute smoothed normals at each waypoint (averaged from adjacent segments)
      const normals = [];
      for (let i = s; i < e; i++) {
        let nx = 0, ny = 0;
        if (i > s) {
          const dx = wp[i][0]-wp[i-1][0], dy = wp[i][1]-wp[i-1][1];
          const l = Math.sqrt(dx*dx+dy*dy) || 1;
          nx += -dy/l; ny += dx/l;
        }
        if (i < e-1) {
          const dx = wp[i+1][0]-wp[i][0], dy = wp[i+1][1]-wp[i][1];
          const l = Math.sqrt(dx*dx+dy*dy) || 1;
          nx += -dy/l; ny += dx/l;
        }
        const l = Math.sqrt(nx*nx+ny*ny) || 1;
        normals.push([nx/l, ny/l]);
      }

      // Road edge markings — smooth lines using averaged normals
      if (zone.roadType === 'paved') {
        // Sprint: solid white edge lines
        for (const side of [-1, 1]) {
          g.lineStyle(3, 0xdddddd, 0.6);
          g.beginPath();
          const n0 = normals[0];
          g.moveTo(wp[s][0]+n0[0]*side*(w/2+1), wp[s][1]+n0[1]*side*(w/2+1));
          for (let i = s+1; i < e; i++) {
            const ni = normals[i-s];
            g.lineTo(wp[i][0]+ni[0]*side*(w/2+1), wp[i][1]+ni[1]*side*(w/2+1));
          }
          g.strokePath();
        }
      } else {
        // Non-paved: red-white curb dashes along smoothed edge path
        const CURB_DASH = 10, CURB_W = 4;
        for (const side of [-1, 1]) {
          // Build edge polyline from smoothed normals
          const edgePts = [];
          for (let i = s; i < e; i++) {
            const ni = normals[i-s];
            edgePts.push([wp[i][0]+ni[0]*side*(w/2+2), wp[i][1]+ni[1]*side*(w/2+2)]);
          }
          let curbDist = 0;
          for (let i = 0; i < edgePts.length - 1; i++) {
            const dx = edgePts[i+1][0]-edgePts[i][0], dy = edgePts[i+1][1]-edgePts[i][1];
            const segLen = Math.sqrt(dx*dx+dy*dy);
            if (segLen < 1) continue;
            const ux = dx/segLen, uy = dy/segLen;
            let pos = 0;
            while (pos < segLen) {
              const step = Math.min(CURB_DASH, segLen - pos);
              const isRed = (Math.floor(curbDist / CURB_DASH) % 2 === 0);
              g.lineStyle(CURB_W, isRed ? 0xcc3333 : 0xeeeeee, 0.7);
              const x1 = edgePts[i][0]+ux*pos, y1 = edgePts[i][1]+uy*pos;
              const x2 = edgePts[i][0]+ux*(pos+step), y2 = edgePts[i][1]+uy*(pos+step);
              g.beginPath(); g.moveTo(x1,y1); g.lineTo(x2,y2); g.strokePath();
              pos += step;
              curbDist += step;
            }
          }
        }
      }

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
        // Subtle rut marks — dashed, not solid lines
        g.lineStyle(1, 0x5a4525, 0.15);
        const RUT_DASH = 15, RUT_GAP = 20;
        for (const off of [-12, 12]) {
          let rutDist = 0;
          let drawing = true;
          for (let i = s; i < e-1; i++) {
            const dx = wp[i+1][0]-wp[i][0], dy = wp[i+1][1]-wp[i][1];
            const segLen = Math.sqrt(dx*dx+dy*dy);
            if (segLen < 1) continue;
            const ux = dx/segLen, uy = dy/segLen;
            const ni = normals[i-s];
            let pos = 0;
            while (pos < segLen) {
              const phase = drawing ? RUT_DASH : RUT_GAP;
              const left = phase - (rutDist % phase);
              const step = Math.min(left, segLen - pos);
              if (drawing) {
                g.beginPath();
                g.moveTo(wp[i][0]+ux*pos+ni[0]*off, wp[i][1]+uy*pos+ni[1]*off);
                g.lineTo(wp[i][0]+ux*(pos+step)+ni[0]*off, wp[i][1]+uy*(pos+step)+ni[1]*off);
                g.strokePath();
              }
              pos += step; rutDist += step;
              if (rutDist % phase < 0.01) drawing = !drawing;
            }
          }
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

    // Finish line direction vectors
    const fdx = wLast[0]-wPrev[0], fdy = wLast[1]-wPrev[1];
    const flen = Math.sqrt(fdx*fdx+fdy*fdy) || 1;
    const fnx = -fdy/flen, fny = fdx/flen; // perpendicular to road
    const fux = fdx/flen, fuy = fdy/flen; // along road direction

    // Sprint zone: barrier collision data (visuals now handled by drawSprintOverlay + placeScenery)
    const sprintZone = this.track.zones.find(z => z.name === 'sprint');
    this._sprintBarrierSegments = [];
    if (sprintZone) {
      const BDIST = 75;
      for (let i = sprintZone.fromWP; i <= Math.min(sprintZone.toWP, wp.length-1); i++) {
        let nx = 0, ny = 0;
        if (i > sprintZone.fromWP && i < wp.length) {
          const dx1 = wp[i][0]-wp[i-1][0], dy1 = wp[i][1]-wp[i-1][1];
          const l1 = Math.sqrt(dx1*dx1+dy1*dy1) || 1;
          nx -= dy1/l1; ny += dx1/l1;
        }
        if (i < Math.min(sprintZone.toWP, wp.length-1)) {
          const dx2 = wp[i+1][0]-wp[i][0], dy2 = wp[i+1][1]-wp[i][1];
          const l2 = Math.sqrt(dx2*dx2+dy2*dy2) || 1;
          nx -= dy2/l2; ny += dx2/l2;
        }
        const l = Math.sqrt(nx*nx+ny*ny) || 1;
        this._sprintBarrierSegments.push({
          x: wp[i][0], y: wp[i][1], nx: nx/l, ny: ny/l, dist: BDIST
        });
      }
    }

    // Finish line: banners on both sides of track (parallel to road, NOT crossing it)
    // Placed along the road direction at the finish area, outside track boundaries
    const FBW = 50, FBH = 14;
    const finRoadAngle = Math.atan2(fuy, fux); // along-road angle for banner rotation
    for (const side of [-1, 1]) {
      const bDist = 75; // perpendicular distance from track center
      for (let j = -3; j <= 3; j++) {
        const bx = wLast[0] + fnx*side*bDist + fux*j*FBW;
        const by = wLast[1] + fny*side*bDist + fuy*j*FBW;
        const isBlue = (j + 4) % 2 === 0;
        const bg = this.add.graphics().setDepth(5);
        bg.fillStyle(isBlue ? 0x2a6ddb : 0xffffff, 0.95);
        bg.fillRect(-FBW/2, -FBH/2, FBW, FBH);
        bg.x = bx; bg.y = by; bg.rotation = finRoadAngle;
      }
    }

    // Finish crowd behind banners — dense packed crowd
    for (let side of [-1, 1]) {
      for (let row = 0; row < 5; row++) {
        const baseDist = 88 + row * 10;
        for (let j = 0; j < 8; j++) {
          const along = (j - 3.5) * 14 + (Math.random()-0.5)*5;
          const cx = wLast[0] + fnx*side*baseDist + fux*along;
          const cy = wLast[1] + fny*side*baseDist + fuy*along;
          const isCheer = Math.random() > 0.35;
          const ci = Math.floor(Math.random()*7);
          const tex = isCheer ? `crowd_cheer_${ci}` : `crowd_${ci}`;
          this.add.sprite(cx, cy, tex).setDepth(4).setScale(1.8+Math.random()*0.6);
        }
      }
    }
  }

  drawSprintOverlay() {
    // Sprint zone: additional road surface detail (curb strips, shoulder texture)
    const wp = this.track.waypoints;
    const spZone = this.track.zones.find(z => z.name === 'sprint');
    if (!spZone) return;

    const spS = spZone.fromWP, spE = Math.min(spZone.toWP, wp.length-1);
    const w = spZone.trackWidth || 120;
    const halfW = w / 2;
    const g = this.add.graphics().setDepth(1.5);

    // Compute normals
    const normals = [];
    for (let i = spS; i <= spE; i++) {
      let nx = 0, ny = 0;
      if (i > spS) { const dx = wp[i][0]-wp[i-1][0], dy = wp[i][1]-wp[i-1][1]; const l = Math.sqrt(dx*dx+dy*dy)||1; nx += -dy/l; ny += dx/l; }
      if (i < spE) { const dx = wp[i+1][0]-wp[i][0], dy = wp[i+1][1]-wp[i][1]; const l = Math.sqrt(dx*dx+dy*dy)||1; nx += -dy/l; ny += dx/l; }
      const l = Math.sqrt(nx*nx+ny*ny)||1;
      normals.push([nx/l, ny/l]);
    }

    // Curb strips (red-white) at road edges
    for (let i = spS; i < spE; i++) {
      const [x1,y1] = wp[i], [x2,y2] = wp[i+1];
      const dx = x2-x1, dy = y2-y1, segLen = Math.sqrt(dx*dx+dy*dy);
      if (segLen < 1) continue;
      const ux = dx/segLen, uy = dy/segLen;
      const ni = normals[i - spS];

      // Draw red-white curb dashes at edges
      for (const side of [-1, 1]) {
        const edgeDist = halfW + 2;
        let d = 0;
        while (d < segLen) {
          const step = Math.min(8, segLen - d);
          const isRed = Math.floor(d / 8) % 2 === 0;
          g.lineStyle(6, isRed ? 0xCC2222 : 0xEEEEEE, 0.8);
          const sx = x1 + ux*d + ni[0]*side*edgeDist;
          const sy = y1 + uy*d + ni[1]*side*edgeDist;
          const ex = x1 + ux*(d+step) + ni[0]*side*edgeDist;
          const ey = y1 + uy*(d+step) + ni[1]*side*edgeDist;
          g.beginPath(); g.moveTo(sx, sy); g.lineTo(ex, ey); g.strokePath();
          d += step;
        }
      }

      // Shoulder (grey strip between curb and barrier)
      for (const side of [-1, 1]) {
        g.lineStyle(12, 0x555558, 0.4);
        const sd = halfW + 8;
        g.beginPath();
        g.moveTo(x1 + ni[0]*side*sd, y1 + ni[1]*side*sd);
        g.lineTo(x2 + normals[i+1-spS][0]*side*sd, y2 + normals[i+1-spS][1]*side*sd);
        g.strokePath();
      }
    }

    // Pit lane markings (dashed white lines on road surface)
    g.lineStyle(2, 0xDDDDDD, 0.3);
    for (let i = spS; i < spE; i++) {
      const [x1,y1] = wp[i], [x2,y2] = wp[i+1];
      const dx = x2-x1, dy = y2-y1, segLen = Math.sqrt(dx*dx+dy*dy);
      if (segLen < 1) continue;
      const ux = dx/segLen, uy = dy/segLen;
      // Dashed center line
      let d = 0;
      while (d < segLen) {
        const step = Math.min(10, segLen - d);
        if (Math.floor(d / 10) % 2 === 0) {
          g.beginPath();
          g.moveTo(x1 + ux*d, y1 + uy*d);
          g.lineTo(x1 + ux*(d+step), y1 + uy*(d+step));
          g.strokePath();
        }
        d += step;
      }
    }
  }

  placeBarriers() {
    const wp = this.track.waypoints;
    for (const zone of this.track.zones) {
      if (!zone.barrierTile) continue;
      const s = Math.max(0, zone.fromWP);
      const e = Math.min(zone.toWP + 1, wp.length);
      const halfW = (zone.trackWidth || 100) / 2;
      const barrierDist = halfW + 10;

      // Compute smoothed normals
      const normals = [];
      for (let i = s; i < e; i++) {
        let nx = 0, ny = 0;
        if (i > s) {
          const dx = wp[i][0]-wp[i-1][0], dy = wp[i][1]-wp[i-1][1];
          const l = Math.sqrt(dx*dx+dy*dy) || 1;
          nx += -dy/l; ny += dx/l;
        }
        if (i < e-1) {
          const dx = wp[i+1][0]-wp[i][0], dy = wp[i+1][1]-wp[i][1];
          const l = Math.sqrt(dx*dx+dy*dy) || 1;
          nx += -dy/l; ny += dx/l;
        }
        const l = Math.sqrt(nx*nx+ny*ny) || 1;
        normals.push([nx/l, ny/l]);
      }

      const colors = {
        desert: 0x8a6a30, canyon: 0x6a4a30, riverbed: 0x6a5a30,
        mountain: 0x8a8a80, sprint: 0x888888
      };
      const barrierColor = colors[zone.name] || 0x888888;

      for (const side of [-1, 1]) {
        const g = this.add.graphics().setDepth(2);
        g.lineStyle(8, barrierColor, 0.9);
        g.beginPath();
        const n0 = normals[0];
        g.moveTo(wp[s][0]+n0[0]*side*barrierDist, wp[s][1]+n0[1]*side*barrierDist);
        for (let i = s+1; i < e; i++) {
          const ni = normals[i-s];
          g.lineTo(wp[i][0]+ni[0]*side*barrierDist, wp[i][1]+ni[1]*side*barrierDist);
        }
        g.strokePath();

        // Post markers every 60px
        let dist = 0;
        for (let i = s; i < e-1; i++) {
          const dx = wp[i+1][0]-wp[i][0], dy = wp[i+1][1]-wp[i][1];
          const segLen = Math.sqrt(dx*dx+dy*dy);
          dist += segLen;
          if (dist >= 60) {
            dist = 0;
            const ni = normals[Math.min(i+1-s, normals.length-1)];
            const px = wp[i+1][0]+ni[0]*side*barrierDist;
            const py = wp[i+1][1]+ni[1]*side*barrierDist;
            const post = this.add.graphics().setDepth(2);
            post.fillStyle(barrierColor, 1);
            post.fillCircle(px, py, 3);
          }
        }
      }
    }
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

    // Object scale map — v3 assets (pixel art, already appropriately sized)
    const scaleMap = {
      // Desert
      'v3_desert_cactus': 1.0, 'v3_desert_scrub': 1.0, 'v3_desert_rock_sm': 1.0,
      'v3_desert_rock_lg': 1.0, 'v3_desert_cow': 1.0, 'v3_desert_hut': 1.0,
      'v3_desert_fence': 1.0, 'v3_desert_skull': 1.0,
      // Canyon
      'v4_canyon_wall': 1.0, 'v4_canyon_pillar': 1.0, 'v3_canyon_debris': 1.0,
      'v3_canyon_arch': 1.0, 'v3_canyon_bush': 1.0,
      // Riverbed
      'v3_riverbed_tree': 1.0, 'v3_riverbed_bush': 1.0, 'v3_riverbed_reeds': 1.0,
      'v3_riverbed_boulder': 1.0, 'v3_riverbed_bridge': 1.0,
      // Mountain
      'v4_mountain_pine': 1.0, 'v3_mountain_cabin': 1.0, 'v3_mountain_rock': 1.0,
      'v3_mountain_snowman': 1.0, 'v3_mountain_pole': 1.0,
      // Sprint
      'v3_sprint_building_tall': 1.0, 'v3_sprint_building_low': 1.0,
      'v3_sprint_lamp': 1.0, 'v3_sprint_tire_wall': 1.0,
      'v3_sprint_grandstand': 1.0, 'v3_sprint_ad_board': 1.0, 'v3_sprint_billboard': 1.0,
      // Legacy v2 (fallback)
      'v2_mountain_cabin': 1.0, 'v2_mountain_pine': 0.9, 'v2_mountain_rock': 0.7,
      'v2_mountain_snowman': 0.28, 'v2_mountain_turbine': 1.2,
      'v2_desert_hut': 0.8, 'v2_desert_cow': 0.85, 'v2_desert_cactus': 0.7,
      'v2_desert_scrub': 0.5, 'v2_desert_rock': 0.6,
      'v2_canyon_pillar': 0.9, 'v2_canyon_debris': 0.6, 'v2_canyon_reflector': 0.5, 'v2_canyon_cliff': 1.0,
      'v2_riverbed_reeds': 0.7, 'v2_riverbed_boulder': 0.6, 'v2_riverbed_bridge': 0.9,
      'v2_sprint_building': 1.0, 'v2_sprint_lamp': 0.7, 'v2_sprint_billboard': 0.9,
      'v2_sprint_tires': 0.6, 'v2_sprint_grandstand': 1.0,
    };

    let turbineCount = 0; // limit turbines

    // Place scenery WELL OUTSIDE road — minimum gap = halfW + 50
    for (let i=0; i<wp.length-1; i++) {
      const zone = getZoneByIndex(i, this.track.zones);
      const [x1,y1]=wp[i],[x2,y2]=wp[i+1];
      const halfW = (zone.trackWidth||100)/2;
      const items = zone.scenery||['rock_grey'];
      const count = zone.sceneryDensity||3;
      const dx=x2-x1, dy=y2-y1, len=Math.sqrt(dx*dx+dy*dy);
      if (len<1) continue;
      const nx=-dy/len, ny=dx/len;
      for (let j=0;j<count;j++) {
        const t=Math.random();
        const bx=x1+dx*t, by=y1+dy*t;
        const side = Math.random() > 0.5 ? 1 : -1;
        const dist = halfW + 70 + Math.random()*150;
        const ox = bx + nx*side*dist, oy = by + ny*side*dist;
        let tex = items[Math.floor(Math.random()*items.length)];

        // Limit turbines to 2 total (legacy)
        if (tex === 'v2_mountain_turbine') {
          if (turbineCount >= 2) { tex = 'v4_mountain_pine'; }
          else { turbineCount++; }
        }

        const sc = scaleMap[tex] || 0.8;
        const spr = this.add.sprite(ox, oy, tex).setDepth(2).setScale(sc);

        // Track cows for animation
        if (tex === 'v4_desert_cow' || tex === 'v3_desert_cow' || tex === 'v2_desert_cow') {
          const dir = Math.random() > 0.5 ? 1 : -1;
          spr.setFlipX(dir < 0);
          this._animals.push({ type: 'cow', sprite: spr, baseX: ox, baseY: oy, dir, offset: Math.random() * Math.PI * 2 });
        }
      }
    }

    // === CANYON — continuous cliff walls along road edges ===
    const canyonZone = this.track.zones.find(z => z.name === 'canyon');
    if (canyonZone) {
      const cS = canyonZone.fromWP, cE = Math.min(canyonZone.toWP, wp.length-1);
      const cHalfW = (canyonZone.trackWidth || 75) / 2;

      // Compute normals
      const cNormals = [];
      for (let i = cS; i <= cE; i++) {
        let nx = 0, ny = 0;
        if (i > cS) { const dx = wp[i][0]-wp[i-1][0], dy = wp[i][1]-wp[i-1][1]; const l = Math.sqrt(dx*dx+dy*dy)||1; nx += -dy/l; ny += dx/l; }
        if (i < cE) { const dx = wp[i+1][0]-wp[i][0], dy = wp[i+1][1]-wp[i][1]; const l = Math.sqrt(dx*dx+dy*dy)||1; nx += -dy/l; ny += dx/l; }
        const l = Math.sqrt(nx*nx+ny*ny)||1;
        cNormals.push([nx/l, ny/l]);
      }

      // Layer 1: Continuous cliff wall — seamless, every segment both sides
      for (let i = cS; i < cE; i++) {
        const [x1,y1] = wp[i], [x2,y2] = wp[i+1];
        const dx = x2-x1, dy = y2-y1, segLen = Math.sqrt(dx*dx+dy*dy);
        if (segLen < 1) continue;
        const segAngle = Math.atan2(dy, dx);
        const ni = cNormals[i - cS];

        for (const side of [-1, 1]) {
          // Wall base: directly at road edge + small gap
          const wallDist = cHalfW + 20;
          const wx = x1 + ni[0]*side*wallDist + dx*0.5;
          const wy = y1 + ni[1]*side*wallDist + dy*0.5;
          this.add.sprite(wx, wy, 'v4_canyon_wall')
            .setDepth(2).setRotation(segAngle).setScale(1.0);

          // Second wall row (slightly farther, slightly higher depth for layering)
          const wall2Dist = cHalfW + 50;
          const w2x = x1 + ni[0]*side*wall2Dist + dx*0.5;
          const w2y = y1 + ni[1]*side*wall2Dist + dy*0.5;
          this.add.sprite(w2x, w2y, 'v4_canyon_rock')
            .setDepth(1).setScale(0.9 + Math.random()*0.2);
        }
      }

      // Layer 2: Pillars on top of walls — every 3 waypoints
      for (let i = cS; i < cE; i += 3) {
        const ni = cNormals[i - cS];
        const side = (Math.floor((i - cS) / 3) % 2 === 0) ? 1 : -1;
        const pd = cHalfW + 35;
        const px = wp[i][0] + ni[0]*side*pd;
        const py = wp[i][1] + ni[1]*side*pd;
        this.add.sprite(px, py, 'v4_canyon_pillar').setDepth(3).setScale(1.0);
      }

      // Layer 3: Arch every ~8 waypoints (spanning or decorative)
      for (let i = cS + 4; i < cE - 4; i += 8) {
        const ni = cNormals[i - cS];
        const side = (Math.floor((i - cS) / 8) % 2 === 0) ? 1 : -1;
        const ad = cHalfW + 45;
        this.add.sprite(wp[i][0] + ni[0]*side*ad, wp[i][1] + ni[1]*side*ad, 'v4_canyon_arch')
          .setDepth(3).setScale(1.0);
      }

      // Layer 4: Debris/dead bush in gaps — small scatter between walls
      for (let i = cS; i < cE; i += 2) {
        const ni = cNormals[i - cS];
        for (const side of [-1, 1]) {
          if (Math.random() > 0.5) {
            const dd = cHalfW + 60 + Math.random()*40;
            const tex = Math.random() > 0.5 ? 'v4_canyon_debris_sm' : 'v4_canyon_dead_bush';
            this.add.sprite(wp[i][0] + ni[0]*side*dd, wp[i][1] + ni[1]*side*dd, tex)
              .setDepth(2).setScale(0.8 + Math.random()*0.3);
          }
        }
      }
    }

    // Riverbed — green vegetation along banks
    const rbZone = this.track.zones.find(z => z.name === 'riverbed');
    if (rbZone) {
      for (let i = rbZone.fromWP; i < Math.min(rbZone.toWP, wp.length-1); i++) {
        const [x1,y1]=wp[i],[x2,y2]=wp[i+1];
        const dx=x2-x1, dy=y2-y1, len=Math.sqrt(dx*dx+dy*dy);
        if (len<1) continue;
        const nx=-dy/len, ny=dx/len;
        for (let side of [-1, 1]) {
          for (let j=0;j<2;j++) {
            const t = j/2 + Math.random()*0.4;
            if (t > 1) continue;
            const d = 100/2 + 35 + Math.random()*50;
            const tex = Math.random() > 0.4 ? 'bush_green' : 'rock_grey';
            this.add.sprite(x1+dx*t+nx*side*d, y1+dy*t+ny*side*d, tex)
              .setDepth(2).setScale(0.8+Math.random()*0.4);
          }
        }
      }
    }

    // Oasis palms around CP3 — far from road
    const cp3wp = this.track.checkpoints[2].waypointIndex;
    if (cp3wp < wp.length) {
      const cp3 = wp[cp3wp];
      for (let i=0;i<14;i++) {
        const a=Math.random()*Math.PI*2, d=80+Math.random()*100;
        this.add.sprite(cp3[0]+Math.cos(a)*d,cp3[1]+Math.sin(a)*d,'palm').setDepth(2);
      }
    }

    // === SPRINT ZONE REWORK — structured city environment ===
    const spZone = this.track.zones.find(z => z.name === 'sprint');
    if (spZone) {
      const spS = spZone.fromWP, spE = Math.min(spZone.toWP, wp.length-1);
      const spHalfW = (spZone.trackWidth||100)/2;

      // Compute normals for sprint zone
      const spNormals = [];
      for (let i = spS; i <= spE; i++) {
        let nnx = 0, nny = 0;
        if (i > spS) { const dx = wp[i][0]-wp[i-1][0], dy = wp[i][1]-wp[i-1][1]; const l = Math.sqrt(dx*dx+dy*dy)||1; nnx += -dy/l; nny += dx/l; }
        if (i < spE) { const dx = wp[i+1][0]-wp[i][0], dy = wp[i+1][1]-wp[i][1]; const l = Math.sqrt(dx*dx+dy*dy)||1; nnx += -dy/l; nny += dx/l; }
        const l = Math.sqrt(nnx*nnx+nny*nny)||1;
        spNormals.push([nnx/l, nny/l]);
      }

      // === Sprint layered city: Road → Barrier → Fence → Grandstand → Buildings ===

      // L1: Jersey barriers — continuous wall at road edge
      for (let i = spS; i < spE; i++) {
        const [x1,y1] = wp[i], [x2,y2] = wp[i+1];
        const dx = x2-x1, dy = y2-y1;
        if (Math.sqrt(dx*dx+dy*dy) < 1) continue;
        const segAngle = Math.atan2(dy, dx);
        const ni = spNormals[i - spS];
        for (const side of [-1, 1]) {
          const bd = spHalfW + 12;
          this.add.sprite(x1+ni[0]*side*bd+dx*0.5, y1+ni[1]*side*bd+dy*0.5, 'v4_sprint_jersey')
            .setDepth(4).setRotation(segAngle).setScale(1.0);
        }
      }

      // L2: Catch fence — continuous behind barriers
      for (let i = spS; i < spE; i++) {
        const [x1,y1] = wp[i], [x2,y2] = wp[i+1];
        const segAngle = Math.atan2(y2-y1, x2-x1);
        const ni = spNormals[i - spS];
        for (const side of [-1, 1]) {
          this.add.sprite(x1+ni[0]*side*(spHalfW+25)+(x2-x1)*0.5, y1+ni[1]*side*(spHalfW+25)+(y2-y1)*0.5, 'v4_sprint_fence')
            .setDepth(3).setRotation(segAngle).setScale(1.0);
        }
      }

      // L3: Grandstands — every 5 WPs, alternating sides
      for (let i = spS; i < spE; i += 5) {
        const ni = spNormals[i - spS];
        const [x1,y1] = wp[i], [x2,y2] = wp[Math.min(i+1, spE)];
        const segAngle = Math.atan2(y2-y1, x2-x1);
        const side = (Math.floor((i-spS)/5) % 2 === 0) ? 1 : -1;
        this.add.sprite(wp[i][0]+ni[0]*side*(spHalfW+42), wp[i][1]+ni[1]*side*(spHalfW+42), 'v4_sprint_grandstand')
          .setDepth(2).setRotation(segAngle).setScale(1.0);
      }

      // L4: Street lights — both sides, every 3 WPs
      for (let i = spS; i < spE; i += 3) {
        const ni = spNormals[i - spS];
        for (const side of [-1, 1]) {
          this.add.sprite(wp[i][0]+ni[0]*side*(spHalfW+35), wp[i][1]+ni[1]*side*(spHalfW+35), 'v4_sprint_light')
            .setDepth(3).setScale(1.0);
        }
      }

      // L5: Buildings — GRID ALIGNED in rows, both sides
      const bldgFront = ['v4_sprint_office','v4_sprint_hotel','v4_sprint_apartment','v4_sprint_restaurant','v4_sprint_shopping'];
      const bldgBack = ['v4_sprint_skyscraper','v4_sprint_skyscraper_sm','v4_sprint_office','v4_sprint_apartment'];
      for (const side of [-1, 1]) {
        // Row 1: front row — every WP, tight (like a street wall)
        for (let i = spS; i < spE; i++) {
          const ni = spNormals[i - spS];
          const tex = bldgFront[(i + (side>0?0:3)) % bldgFront.length];
          this.add.sprite(wp[i][0]+ni[0]*side*(spHalfW+70), wp[i][1]+ni[1]*side*(spHalfW+70), tex)
            .setDepth(1).setScale(1.0);
        }
        // Row 2: behind front row
        for (let i = spS; i < spE; i++) {
          const ni = spNormals[i - spS];
          const tex = bldgBack[(i + (side>0?1:2)) % bldgBack.length];
          this.add.sprite(wp[i][0]+ni[0]*side*(spHalfW+120), wp[i][1]+ni[1]*side*(spHalfW+120), tex)
            .setDepth(0.5).setScale(1.0);
        }
        // Row 3: far skyline — sparser
        for (let i = spS; i < spE; i += 2) {
          const ni = spNormals[i - spS];
          this.add.sprite(wp[i][0]+ni[0]*side*(spHalfW+170), wp[i][1]+ni[1]*side*(spHalfW+170), 'v4_sprint_skyscraper')
            .setDepth(0).setScale(1.0);
        }
      }

      // L6: Banner arches over road — every 8 WPs
      for (let i = spS+3; i < spE-3; i += 8) {
        const [x1,y1] = wp[i], [x2,y2] = wp[Math.min(i+1, spE)];
        this.add.sprite(wp[i][0], wp[i][1], 'v4_sprint_banner')
          .setDepth(8).setRotation(Math.atan2(y2-y1, x2-x1) + Math.PI/2).setScale(1.0);
      }

      // L7: Tire stacks at sharp corners
      for (let i = spS+1; i < spE-1; i++) {
        const [xp,yp] = wp[i-1], [xc,yc] = wp[i], [xn,yn] = wp[i+1];
        const cross = (xc-xp)*(yn-yc) - (yc-yp)*(xn-xc);
        const mag = Math.sqrt((xc-xp)**2+(yc-yp)**2) * Math.sqrt((xn-xc)**2+(yn-yc)**2);
        if (mag > 0 && Math.abs(cross/mag) > 0.12) {
          const ni = spNormals[i-spS];
          const ts = cross > 0 ? -1 : 1;
          this.add.sprite(xc+ni[0]*ts*(spHalfW+16), yc+ni[1]*ts*(spHalfW+16), 'v4_sprint_tires')
            .setDepth(4).setScale(1.0);
        }
      }

      // L8: Cones/generators between fence and grandstand
      for (let i = spS; i < spE; i += 4) {
        const ni = spNormals[i-spS];
        const side = (i%8<4) ? 1 : -1;
        const tex = Math.random() > 0.6 ? 'v4_sprint_cones' : 'v4_sprint_generator';
        this.add.sprite(wp[i][0]+ni[0]*side*(spHalfW+52), wp[i][1]+ni[1]*side*(spHalfW+52), tex)
          .setDepth(2).setScale(0.8);
      }
    }

    // Mountain — trees on both sides, well clear of road
    const mtZone = this.track.zones.find(z => z.name === 'mountain');
    if (mtZone) {
      for (let i = mtZone.fromWP; i < Math.min(mtZone.toWP, wp.length-1); i += 2) {
        const [x1,y1]=wp[i],[x2,y2]=wp[i+1];
        const dx=x2-x1, dy=y2-y1, len=Math.sqrt(dx*dx+dy*dy);
        if (len<1) continue;
        const nx=-dy/len, ny=dx/len;
        const halfW = 80/2;
        for (let side of [-1, 1]) {
          // Single row of trees — far from road
          for (let j=0;j<2;j++) {
            const t = j/2 + Math.random()*0.4;
            if (t > 1) continue;
            const d = halfW + 60 + Math.random()*50;
            this.add.sprite(x1+dx*t+nx*side*d, y1+dy*t+ny*side*d, 'v4_mountain_pine')
              .setDepth(2).setScale(0.6+Math.random()*0.3);
          }
          // Background tree (further out, subtle)
          if (Math.random() > 0.5) {
            const t2 = Math.random();
            const d2 = halfW + 120 + Math.random()*60;
            this.add.sprite(x1+dx*t2+nx*side*d2, y1+dy*t2+ny*side*d2, 'v4_mountain_pine')
              .setDepth(1).setScale(0.8+Math.random()*0.3).setAlpha(0.5);
          }
        }
      }
    }

    // Mountain→Sprint tunnel removed — smooth zone transition only

    // Podium/press removed — finish line banner only
  }

  // Seeded PRNG (mulberry32) — ensures identical obstacle layout every attempt
  _seededRng(seed) {
    let s = seed | 0;
    return () => {
      s = (s + 0x6D2B79F5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  placeRoadObstacles() {
    this.obstacles = [];
    const rng = this._seededRng(20260309); // fixed seed — same layout every run
    const wp = this.track.waypoints;
    const penaltyMap = {
      obs_tokamak: 0.55, obs_sand_pile: 0.7, obs_tumbleweed: 0.8,
      obs_fallen_rock: 0.5, obs_rock_debris: 0.6, obs_small_rock: 0.75,
      obs_puddle: 0.7, obs_mud_patch: 0.65, obs_log: 0.55,
      obs_rock_slide: 0.45, obs_pothole: 0.65,
    };
    const radiusMap = {
      obs_tokamak: 9, obs_sand_pile: 8, obs_tumbleweed: 6,
      obs_fallen_rock: 10, obs_rock_debris: 10, obs_small_rock: 7,
      obs_puddle: 11, obs_mud_patch: 12, obs_log: 9,
      obs_rock_slide: 14, obs_pothole: 8,
    };

    for (const zone of this.track.zones) {
      const cfg = this.track.obstacleConfig[zone.name];
      if (!cfg) continue;
      for (let i=zone.fromWP; i<Math.min(zone.toWP,wp.length-1); i++) {
        if (rng() > cfg.density) continue;
        const [x1,y1]=wp[i],[x2,y2]=wp[i+1];
        const t=0.15+rng()*0.7;
        const bx=x1+(x2-x1)*t, by=y1+(y2-y1)*t;
        const dx=x2-x1,dy=y2-y1,len=Math.sqrt(dx*dx+dy*dy);
        if (len<1) continue;
        const nx=-dy/len,ny=dx/len;
        const hw=(zone.trackWidth||100)/2;
        const edgeBias = (rng() > 0.5 ? 1 : -1) * (0.3 + rng() * 0.4) * hw;
        const ox=bx+nx*edgeBias, oy=by+ny*edgeBias;
        const type=cfg.types[Math.floor(rng()*cfg.types.length)];
        const sprite=this.add.sprite(ox,oy,type).setDepth(5).setScale(0.7);
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
        else if(count===0){this.countdownText.setText('GO!').setColor('#e63946');this.raceState.started=true;soundEngine.startBGM();}
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
      this.raceState.timeRemaining=0;this.raceState.timedOut=true;soundEngine.stopAll();soundEngine.stopBGM();this.showTimeOut();return;
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
    this.player.angle=this.carState.angle-90;

    // Camera look-ahead: offset toward movement direction at high speed
    const spd = Math.abs(this.carState.speed);
    const lookAhead = Math.min(spd / 3, 80); // max 80px ahead
    const moveRad = Phaser.Math.DegToRad(this.carState.moveAngle);
    this.cameras.main.setFollowOffset(-Math.cos(moveRad)*lookAhead, -Math.sin(moveRad)*lookAhead);

    // Zone-adaptive dust particles
    const zoneName = this.currentZoneName || 'desert';
    const dustTex = this._zoneDustTextures[zoneName] || 'dust_particle';
    if (this.dustEmitter.texture.key !== dustTex) {
      try { this.dustEmitter.setTexture(dustTex); } catch(e) {}
    }

    // Dust trail on unpaved roads (sand, dirt, rocky, offroad) — emits behind the car
    const isUnpaved = this._currentRoadType && this._currentRoadType !== 'paved';
    const carSpd = Math.abs(this.carState.speed);
    this._dustTimer = (this._dustTimer || 0) + dt;
    if (isUnpaved && carSpd > 15) {
      // Determine emit interval & count based on speed/drift
      let dustInterval, dustCount;
      if (this.carState.drifting) { dustInterval = 0.04; dustCount = 3; }
      else if (carSpd > 80) { dustInterval = 0.06; dustCount = 2; }
      else { dustInterval = 0.12; dustCount = 1; }

      if (this._dustTimer >= dustInterval) {
        this._dustTimer = 0;
        const dustDist = 28;
        const mRad = Phaser.Math.DegToRad(this.carState.moveAngle + 180);
        const dustX = this.carState.x + Math.cos(mRad) * dustDist;
        const dustY = this.carState.y + Math.sin(mRad) * dustDist;
        this.dustEmitter.emitParticleAt(dustX, dustY, dustCount);
      }
    }

    // Drift smoke
    if (this.carState.drifting && Math.abs(this.carState.speed) > 40) {
      this.driftSmoke.emitting = true;
      this.driftSmoke.setPosition(this.carState.x, this.carState.y);
    } else {
      this.driftSmoke.emitting = false;
    }

    // Mountain snow ambient
    if (zoneName === 'mountain') {
      this.snowEmitter.emitting = true;
      this.snowEmitter.setPosition(
        this.carState.x + (Math.random() - 0.5) * 600,
        this.carState.y - 300
      );
    } else {
      this.snowEmitter.emitting = false;
    }

    // Cow animation — directional walking with bob
    if (this._animals) {
      for (const a of this._animals) {
        if (a.type === 'cow') {
          a.sprite.x += a.dir * 0.3;
          a.sprite.y = a.baseY + Math.sin(time * 0.003 + a.offset) * 1.5;
          a.sprite.setFlipX(a.dir < 0);
          if (Math.abs(a.sprite.x - a.baseX) > 80) a.dir *= -1;
        }
      }
    }

    // Bird flight — periodic diagonal fly-across in riverbed zone
    if (this._birdTimer !== undefined && this.currentZoneName === 'riverbed') {
      this._birdTimer -= delta;
      if (this._birdTimer <= 0) {
        this._birdTimer = 8000 + Math.random() * 12000;
        const cam = this.cameras.main;
        const bx = cam.scrollX - 100;
        const by = cam.scrollY + Math.random() * 600;
        if (this.textures.exists('v2_riverbed_bird')) {
          const bird = this.add.sprite(bx, by, 'v2_riverbed_bird').setDepth(20).setScale(0.8);
          this.tweens.add({
            targets: bird, x: bx + 1000, y: by - 300,
            duration: 4000, onComplete: () => bird.destroy()
          });
        }
      }
    }

    this.obstacles.forEach(o=>{if(o.type==='obs_tokamak')o.sprite.angle+=2;});

    // Sound updates
    const result = isOnTrack(this.carState.x, this.carState.y, this.track.waypoints, this.track.zones);
    const cp = this.selectedCar.physics;
    const sRoadType = this._currentRoadType || 'offroad';
    soundEngine.updateEngine(this.carState.speed, cp.roadMaxSpeed[sRoadType] || 400);
    soundEngine.updateOffroad(!result.onTrack, this.carState.speed, this.currentZoneName);
    soundEngine.updateDrift(this.carState.drifting, this.carState.speed, this.carState.driftAngle);
    soundEngine.updateBrake(this.cursors.down.isDown, this.carState.speed);

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
    // Off-road: apply offroadMul AND additional deceleration penalty
    const effectiveFriction = result.onTrack ? phys.friction : (phys.friction * cp.offroadMul * 0.92);

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

    // Sprint zone banner wall barrier — banners act as solid walls
    if (this._sprintBarrierSegments && this._sprintBarrierSegments.length > 0) {
      // Find closest barrier segment to car
      let minD = Infinity, closest = null;
      for (const seg of this._sprintBarrierSegments) {
        const d = (car.x - seg.x) ** 2 + (car.y - seg.y) ** 2;
        if (d < minD) { minD = d; closest = seg; }
      }
      if (closest && minD < 150 * 150) {
        const dx = car.x - closest.x, dy = car.y - closest.y;
        const perpDist = dx * closest.nx + dy * closest.ny; // signed distance across road
        const absDist = Math.abs(perpDist);
        if (absDist > closest.dist - 5) {
          // Push car back to barrier edge
          const sign = perpDist > 0 ? 1 : -1;
          const pushDist = closest.dist - 8;
          // Project car position: keep along-road component, clamp perpendicular
          const alongX = dx - perpDist * closest.nx;
          const alongY = dy - perpDist * closest.ny;
          car.x = closest.x + alongX + closest.nx * sign * pushDist;
          car.y = closest.y + alongY + closest.ny * sign * pushDist;
          car.speed *= 0.4; // bounce off wall
        }
      }
    }
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
        soundEngine.playHit();
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
        soundEngine.playCheckpoint();
      }
    }
    // Finish: must cross the finish line (perpendicular to road at last waypoint)
    if(!rs.finished && this._checkLineCross(car.prevX, car.prevY, car.x, car.y, this.track.waypoints)){
      rs.finished=true;soundEngine.stopAll();soundEngine.stopBGM();soundEngine.playFinish();this.showFinish();
    }
  }

  _checkLineCross(px, py, cx, cy, wp) {
    // Check if car crossed the finish line (perpendicular line at last waypoint)
    const last = wp[wp.length-1], prev = wp[wp.length-2];
    const dx = last[0]-prev[0], dy = last[1]-prev[1];
    const len = Math.sqrt(dx*dx+dy*dy) || 1;
    const nx = -dy/len, ny = dx/len; // perpendicular
    const halfW = 80;
    // Finish line endpoints
    const lx1 = last[0]+nx*halfW, ly1 = last[1]+ny*halfW;
    const lx2 = last[0]-nx*halfW, ly2 = last[1]-ny*halfW;
    // Check segment intersection between car movement and finish line
    const d1x = cx-px, d1y = cy-py;
    const d2x = lx2-lx1, d2y = ly2-ly1;
    const cross = d1x*d2y - d1y*d2x;
    if (Math.abs(cross) < 0.001) return false;
    const t = ((lx1-px)*d2y - (ly1-py)*d2x) / cross;
    const u = ((lx1-px)*d1y - (ly1-py)*d1x) / cross;
    // Also require car to be near the finish area (within 150px)
    const distToFinish = Math.sqrt((cx-last[0])**2+(cy-last[1])**2);
    return t >= 0 && t <= 1 && u >= 0 && u <= 1 && distToFinish < 150;
  }

  checkZoneChange(){
    const p=getTrackProgress(this.carState.x,this.carState.y,this.track.waypoints);
    const z=getZoneByIndex(p.index,this.track.zones);
    if(z.name!==this.currentZoneName){
      this.currentZoneName=z.name;
      const labels={desert:'🏜️ DESERT',canyon:'🪨 ROCKY CANYON',riverbed:'🏞️ DRIED RIVERBED',mountain:'⛰️ MOUNTAIN PASS',sprint:'🏁 FINAL SPRINT',trans_desert_canyon:'🏜️→🪨 ENTERING CANYON',trans_canyon_riverbed:'🪨→🏞️ RIVERBED APPROACH',trans_riverbed_mountain:'🏞️→⛰️ MOUNTAIN CLIMB',trans_mountain_sprint:'⛰️→🏁 CITY APPROACH'};
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
    this.addRestart(this.raceState);
  }

  showFinish(){
    const rs=this.raceState;
    this.add.text(400,190,'🏁 STAGE CLEAR!',{fontSize:'44px',fontFamily:'monospace',color:'#f4d35e',fontStyle:'bold',stroke:'#000',strokeThickness:5}).setOrigin(0.5).setScrollFactor(0).setDepth(100);
    this.add.text(400,250,`Total: ${this.fmt(rs.elapsedTime)}`,{fontSize:'28px',fontFamily:'monospace',color:'#f1faee',stroke:'#000',strokeThickness:2}).setOrigin(0.5).setScrollFactor(0).setDepth(100);
    this.add.text(400,290,`Time Left: ${this.fmt(rs.timeRemaining)}`,{fontSize:'18px',fontFamily:'monospace',color:'#2d6a4f'}).setOrigin(0.5).setScrollFactor(0).setDepth(100);
    let sp=''; rs.checkpointTimes.forEach((t,i)=>{sp+=`CP${i+1}: ${this.fmt(t)}  `;});
    this.add.text(400,330,sp,{fontSize:'13px',fontFamily:'monospace',color:'#a89070'}).setOrigin(0.5).setScrollFactor(0).setDepth(100);

    this.addRestart(rs);
  }

  addRestart(rs){
    // Build bottom action line dynamically
    let actionParts = [];

    // Submit button (only on finish with wallet)
    if (rs && rs.finished && wallet.connected) {
      if (wallet.isContractReady()) {
        actionParts.push('S: Submit Record');
      }
    }
    actionParts.push('ENTER: Retry');
    actionParts.push('ESC: Menu');

    const actionStr = '[ ' + actionParts.join('  |  ') + ' ]';
    const rt=this.add.text(400,440,actionStr,{fontSize:'16px',fontFamily:'monospace',color:'#f4d35e'}).setOrigin(0.5).setScrollFactor(0).setDepth(100);
    this.tweens.add({targets:rt,alpha:0.3,duration:500,yoyo:true,repeat:-1});

    this.input.keyboard.removeAllListeners('keydown-ENTER');
    this.input.keyboard.removeAllListeners('keydown-ESC');
    this.input.keyboard.removeAllListeners('keydown-S');

    // Submit handler
    if (rs && rs.finished && wallet.connected && wallet.isContractReady()) {
      const doSubmit = async () => {
        rt.setText('[ Submitting...  |  ENTER: Retry  |  ESC: Menu ]');
        try {
          const txHash = await wallet.submitRecord(Math.floor(rs.elapsedTime), this.selectedCarId);
          const shortTx = `${txHash.slice(0, 10)}...${txHash.slice(-6)}`;
          rt.setText(`✓ Submitted (${shortTx})  [ ENTER: Retry  |  ESC: Menu  |  L: Leaderboard ]`);
          this.input.keyboard.once('keydown-L', () => {
            this.scene.stop('UI');
            this.scene.stop('Race');
            this.scene.start('Leaderboard');
          });
        } catch (e) {
          rt.setText('[ S: Retry Submit  |  ENTER: Retry  |  ESC: Menu ]');
          this.input.keyboard.once('keydown-S', doSubmit);
        }
      };
      this.input.keyboard.once('keydown-S', doSubmit);
    }

    this.input.keyboard.once('keydown-ENTER', () => {
      soundEngine.stopAll(); soundEngine.stopBGM();
      this.scene.stop('UI');
      this.scene.restart({ carId: this.selectedCarId });
    });
    this.input.keyboard.once('keydown-ESC', () => {
      soundEngine.stopAll(); soundEngine.stopBGM();
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
