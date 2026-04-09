import Phaser from 'phaser';
import { TRACK_CONFIG, buildTrackConfig, isOnTrack, getTrackProgress, getZoneByIndex, checkCheckpoint, checkFinish, zoneConfig, DIR_VECTORS } from './Track.js';
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
    this.selectedTrackId = (data && data.trackId) || 'easy';
    this.selectedCar = CARS.find(c => c.id === this.selectedCarId) || CARS[0];
  }

  create() {
    this.track = buildTrackConfig(this.selectedTrackId);
    this.cameras.main.setBackgroundColor(0xD2B48C);
    this._animals = [];
    this._birdTimer = 5000 + Math.random() * 8000;

    this.renderTrackParts();
    this.placeCheckpoints();
    this.setupCornerHUD();
    // this.placeRoadObstacles(); // obstacles removed — focus on racing

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
      started: false, finished: false, finishing: false, timedOut: false,
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
    const TILE_SIZE = 512;
    const ROAD_PAD = 400; // how far from road center to place bg tiles

    // Collect tile positions per zone, avoiding bounding-box overlap
    // Instead of bounding box, place tiles near each waypoint segment
    const sortedZones = [...this.track.zones].sort((a, b) => {
      if (a.transition && !b.transition) return 1;
      if (!a.transition && b.transition) return -1;
      return a.fromWP - b.fromWP;
    });

    for (const zone of sortedZones) {
      // Skip desert zones — rendered by renderDesertParts()
      if (zone.name === 'desert' || zone.name === 'trans_desert_canyon') continue;

      const s = zone.fromWP, e = Math.min(zone.toWP, wp.length - 1);

      // Collect unique tile grid positions near the road
      const tileSet = new Set();
      for (let i = s; i <= e; i++) {
        const cx = wp[i][0], cy = wp[i][1];
        // Cover area around this waypoint
        const gxMin = Math.floor((cx - ROAD_PAD) / TILE_SIZE);
        const gxMax = Math.floor((cx + ROAD_PAD) / TILE_SIZE);
        const gyMin = Math.floor((cy - ROAD_PAD) / TILE_SIZE);
        const gyMax = Math.floor((cy + ROAD_PAD) / TILE_SIZE);
        for (let gx = gxMin; gx <= gxMax; gx++) {
          for (let gy = gyMin; gy <= gyMax; gy++) {
            tileSet.add(`${gx},${gy}`);
          }
        }
      }

      if (zone.transition) {
        const fromTile = zone.bgTile;
        const toZone = this.track.zones.find(z => z.name === zone.transition.to);
        const toTile = toZone ? toZone.bgTile : zone.bgTile;
        // Compute progress based on waypoint index (not Y position — avoids overlap issues)
        const totalWP = e - s;

        for (const key of tileSet) {
          const [gx, gy] = key.split(',').map(Number);
          const x = gx * TILE_SIZE, y = gy * TILE_SIZE;
          // Find nearest waypoint to determine blend progress
          let minDist = Infinity, nearestIdx = s;
          for (let i = s; i <= e; i++) {
            const dx = wp[i][0] - (x + TILE_SIZE/2), dy = wp[i][1] - (y + TILE_SIZE/2);
            const d = dx*dx + dy*dy;
            if (d < minDist) { minDist = d; nearestIdx = i; }
          }
          const p = totalWP > 0 ? Phaser.Math.Clamp((nearestIdx - s) / totalWP, 0, 1) : 0;
          this.add.sprite(x, y, fromTile).setOrigin(0).setDepth(0).setAlpha(1 - p);
          this.add.sprite(x, y, toTile).setOrigin(0).setDepth(0).setAlpha(p);
        }
      } else {
        for (const key of tileSet) {
          const [gx, gy] = key.split(',').map(Number);
          this.add.sprite(gx * TILE_SIZE, gy * TILE_SIZE, zone.bgTile).setOrigin(0).setDepth(0);
        }
      }
    }
  }

  drawTrack() {
    const wp = this.track.waypoints;
    const TEX_SIZE = 512; // road texture tile size

    for (const zone of this.track.zones) {
      // Skip desert zones — rendered by renderDesertParts()
      if (zone.name === 'desert' || zone.name === 'trans_desert_canyon') continue;

      const s = Math.max(0, zone.fromWP);
      const e = Math.min(zone.toWP+1, wp.length);
      const w = zone.trackWidth || 100;
      const halfW = w / 2;

      // Subdivide waypoints at sharp corners using Catmull-Rom interpolation
      const rawPts = [];
      for (let i = s; i < e; i++) rawPts.push([wp[i][0], wp[i][1]]);
      const subPts = [rawPts[0]];
      for (let i = 1; i < rawPts.length; i++) {
        if (i < rawPts.length - 1) {
          const dx1 = rawPts[i][0]-rawPts[i-1][0], dy1 = rawPts[i][1]-rawPts[i-1][1];
          const dx2 = rawPts[i+1][0]-rawPts[i][0], dy2 = rawPts[i+1][1]-rawPts[i][1];
          const a1 = Math.atan2(dy1, dx1), a2 = Math.atan2(dy2, dx2);
          let dAngle = Math.abs(a2 - a1);
          if (dAngle > Math.PI) dAngle = 2*Math.PI - dAngle;
          if (dAngle > Math.PI/6) { // >30°: Catmull-Rom subdivision
            const steps = Math.ceil(dAngle / (Math.PI/18)); // ~10° per step for smoother curves
            // Catmull-Rom control points: P0, P1 (prev), P2 (current), P3 (next)
            const p0 = rawPts[Math.max(0, i-2)];
            const p1 = rawPts[i-1];
            const p2 = rawPts[i];
            const p3 = rawPts[Math.min(rawPts.length-1, i+1)];
            for (let t = 1; t <= steps; t++) {
              const u = t / (steps + 1);
              const u2 = u * u, u3 = u2 * u;
              // Catmull-Rom spline (centripetal, alpha=0.5 simplified to uniform)
              const x = 0.5 * ((2*p1[0]) + (-p0[0]+p2[0])*u + (2*p0[0]-5*p1[0]+4*p2[0]-p3[0])*u2 + (-p0[0]+3*p1[0]-3*p2[0]+p3[0])*u3);
              const y = 0.5 * ((2*p1[1]) + (-p0[1]+p2[1])*u + (2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*u2 + (-p0[1]+3*p1[1]-3*p2[1]+p3[1])*u3);
              subPts.push([x, y]);
            }
          }
        }
        subPts.push(rawPts[i]);
      }

      // Compute smoothed normals on subdivided points
      const normals = [];
      for (let i = 0; i < subPts.length; i++) {
        let nx = 0, ny = 0;
        if (i > 0) {
          const dx = subPts[i][0]-subPts[i-1][0], dy = subPts[i][1]-subPts[i-1][1];
          const l = Math.sqrt(dx*dx+dy*dy) || 1;
          nx += -dy/l; ny += dx/l;
        }
        if (i < subPts.length-1) {
          const dx = subPts[i+1][0]-subPts[i][0], dy = subPts[i+1][1]-subPts[i][1];
          const l = Math.sqrt(dx*dx+dy*dy) || 1;
          nx += -dy/l; ny += dx/l;
        }
        const l = Math.sqrt(nx*nx+ny*ny) || 1;
        normals.push([nx/l, ny/l]);
      }
      // Use subPts instead of wp[s..e] for road rendering below
      const roadPts = subPts;

      // ===== TEXTURED ROAD SURFACE via CanvasTexture =====
      const roadTex = zone.roadTexture || null;
      if (roadTex && this.textures.exists(roadTex)) {
        // Get bounding box for this zone's road (using subdivided points)
        let minX=Infinity, maxX=-Infinity, minY=Infinity, maxY=-Infinity;
        for (let i = 0; i < roadPts.length; i++) {
          const ni = normals[i];
          const lx = roadPts[i][0] - ni[0]*halfW, ly = roadPts[i][1] - ni[1]*halfW;
          const rx = roadPts[i][0] + ni[0]*halfW, ry = roadPts[i][1] + ni[1]*halfW;
          minX = Math.min(minX, lx, rx); maxX = Math.max(maxX, lx, rx);
          minY = Math.min(minY, ly, ry); maxY = Math.max(maxY, ly, ry);
        }
        const PAD = 10;
        minX = Math.floor(minX - PAD); minY = Math.floor(minY - PAD);
        maxX = Math.ceil(maxX + PAD); maxY = Math.ceil(maxY + PAD);
        const cw = maxX - minX, ch = maxY - minY;

        // Get source texture image data
        const srcTex = this.textures.get(roadTex);
        const srcImg = srcTex.getSourceImage();

        // Create offscreen canvas
        const canvas = document.createElement('canvas');
        canvas.width = cw; canvas.height = ch;
        const ctx = canvas.getContext('2d');

        // Create repeating pattern from road texture
        const pattern = srcImg ? ctx.createPattern(srcImg, 'repeat') : null;
        if (!pattern) {
          // Fallback: solid color road
          const fg = this.add.graphics().setDepth(1);
          fg.lineStyle(w, zone.roadColor || 0x888888);
          fg.beginPath(); fg.moveTo(wp[s][0],wp[s][1]);
          for (let ii=s+1;ii<e;ii++) fg.lineTo(wp[ii][0],wp[ii][1]);
          fg.strokePath();
          continue; // skip to next zone — don't render canvas texture
        }

        // Draw each segment as a textured quad (using subdivided points)
        let cumDist = 0;
        for (let i = 0; i < roadPts.length - 1; i++) {
          const ni0 = normals[i], ni1 = normals[i+1];
          // Quad corners (in canvas-local coords)
          const tl = [roadPts[i][0] - ni0[0]*halfW - minX, roadPts[i][1] - ni0[1]*halfW - minY];
          const tr = [roadPts[i][0] + ni0[0]*halfW - minX, roadPts[i][1] + ni0[1]*halfW - minY];
          const bl = [roadPts[i+1][0] - ni1[0]*halfW - minX, roadPts[i+1][1] - ni1[1]*halfW - minY];
          const br = [roadPts[i+1][0] + ni1[0]*halfW - minX, roadPts[i+1][1] + ni1[1]*halfW - minY];

          // Check for degenerate/flipped quad (cross product check)
          const cross = (tr[0]-tl[0])*(bl[1]-tl[1]) - (tr[1]-tl[1])*(bl[0]-tl[0]);
          if (Math.abs(cross) < 1) continue; // skip degenerate quads

          // Segment direction for pattern transform
          const dx = roadPts[i+1][0] - roadPts[i][0], dy = roadPts[i+1][1] - roadPts[i][1];
          const segLen = Math.sqrt(dx*dx + dy*dy);
          if (segLen < 0.5) { continue; } // skip zero-length segments
          const angle = Math.atan2(dy, dx);
          const cx = (roadPts[i][0] + roadPts[i+1][0]) / 2 - minX;
          const cy = (roadPts[i][1] + roadPts[i+1][1]) / 2 - minY;

          ctx.save();
          // Clip to the quad shape
          ctx.beginPath();
          ctx.moveTo(tl[0], tl[1]);
          ctx.lineTo(tr[0], tr[1]);
          ctx.lineTo(br[0], br[1]);
          ctx.lineTo(bl[0], bl[1]);
          ctx.closePath();
          ctx.clip();

          // Set pattern transform: rotate pattern to align with road direction
          // and offset to create seamless tiling along road length
          const m = new DOMMatrix();
          m.translateSelf(cx, cy);
          m.rotateSelf((angle + Math.PI/2) * 180 / Math.PI); // road texture is vertical (top-down)
          m.translateSelf(-w/2, -cumDist % TEX_SIZE);
          pattern.setTransform(m);

          ctx.fillStyle = pattern;
          ctx.fillRect(0, 0, cw, ch);
          ctx.restore();

          cumDist += segLen;
        }

        // Add to Phaser as a CanvasTexture
        const texKey = 'road_canvas_' + zone.name;
        if (this.textures.exists(texKey)) this.textures.remove(texKey);
        this.textures.addCanvas(texKey, canvas);
        this.add.image(minX, minY, texKey).setOrigin(0).setDepth(1);

      } else {
        // Fallback: solid color road
        const g = this.add.graphics().setDepth(1);
        g.lineStyle(w+20, zone.roadBorder, 0.4);
        g.beginPath(); g.moveTo(wp[s][0],wp[s][1]);
        for (let i=s+1;i<e;i++) g.lineTo(wp[i][0],wp[i][1]);
        g.strokePath();
        g.lineStyle(w, zone.roadColor);
        g.beginPath(); g.moveTo(wp[s][0],wp[s][1]);
        for (let i=s+1;i<e;i++) g.lineTo(wp[i][0],wp[i][1]);
        g.strokePath();
      }

      // ===== ROAD EDGE MARKINGS (curbs) — use original waypoints =====
      // Compute normals for original wp (not subdivided)
      const curbNormals = [];
      for (let i = s; i < e; i++) {
        let nx = 0, ny = 0;
        if (i > s) { const dx=wp[i][0]-wp[i-1][0],dy=wp[i][1]-wp[i-1][1]; const l=Math.sqrt(dx*dx+dy*dy)||1; nx+=-dy/l; ny+=dx/l; }
        if (i < e-1) { const dx=wp[i+1][0]-wp[i][0],dy=wp[i+1][1]-wp[i][1]; const l=Math.sqrt(dx*dx+dy*dy)||1; nx+=-dy/l; ny+=dx/l; }
        const l=Math.sqrt(nx*nx+ny*ny)||1;
        curbNormals.push([nx/l, ny/l]);
      }
      const g = this.add.graphics().setDepth(2);
      if (zone.roadType === 'paved') {
        for (const side of [-1, 1]) {
          g.lineStyle(3, 0xdddddd, 0.6);
          g.beginPath();
          const n0 = curbNormals[0];
          g.moveTo(wp[s][0]+n0[0]*side*(halfW+1), wp[s][1]+n0[1]*side*(halfW+1));
          for (let i = s+1; i < e; i++) {
            const ni = curbNormals[i-s];
            g.lineTo(wp[i][0]+ni[0]*side*(halfW+1), wp[i][1]+ni[1]*side*(halfW+1));
          }
          g.strokePath();
        }
      } else {
        const CURB_DASH = 10, CURB_W = 4;
        for (const side of [-1, 1]) {
          const edgePts = [];
          for (let i = s; i < e; i++) {
            const ni = curbNormals[i-s];
            edgePts.push([wp[i][0]+ni[0]*side*(halfW+2), wp[i][1]+ni[1]*side*(halfW+2)]);
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
    }

    // --- START ZONE: extend road behind start + start line ---
    const wp0 = wp[0], wp1 = wp[1];
    const startAngle = Math.atan2(wp1[1]-wp0[1], wp1[0]-wp0[0]) * 180 / Math.PI + 90;
    const startZone = this.track.zones[0];
    const startRoadLen = 600;
    const startDir = { dx: wp1[0]-wp0[0], dy: wp1[1]-wp0[1] };
    const startDirLen = Math.sqrt(startDir.dx**2 + startDir.dy**2) || 1;
    const startUx = startDir.dx/startDirLen, startUy = startDir.dy/startDirLen;
    const startNx = -startUy, startNy = startUx;
    const startW = startZone.trackWidth || 100;

    // Road extension behind start
    const gStartRoad = this.add.graphics().setDepth(1);
    const startRoadColor = zoneConfig[startZone.name]?.roadColor || 0x9B7B4A;
    const startEdgeColor = zoneConfig[startZone.name]?.edgeColor || 0x8a6a30;
    const behindX = wp0[0] - startUx * startRoadLen;
    const behindY = wp0[1] - startUy * startRoadLen;
    gStartRoad.lineStyle(startW + 20, startEdgeColor, 0.4);
    gStartRoad.beginPath();
    gStartRoad.moveTo(behindX, behindY);
    gStartRoad.lineTo(wp0[0], wp0[1]);
    gStartRoad.strokePath();
    gStartRoad.lineStyle(startW, startRoadColor, 1);
    gStartRoad.beginPath();
    gStartRoad.moveTo(behindX, behindY);
    gStartRoad.lineTo(wp0[0], wp0[1]);
    gStartRoad.strokePath();

    // Curbs on extended road
    const gStartCurb = this.add.graphics().setDepth(2);
    for (const side of [-1, 1]) {
      let curbDist = 0;
      const CURB_DASH = 10;
      const steps = 30;
      for (let i = 0; i < steps; i++) {
        const t = i / steps;
        const cx = behindX + (wp0[0]-behindX)*t + startNx*side*(startW/2+2);
        const cy = behindY + (wp0[1]-behindY)*t + startNy*side*(startW/2+2);
        const nx = behindX + (wp0[0]-behindX)*(i+1)/steps + startNx*side*(startW/2+2);
        const ny = behindY + (wp0[1]-behindY)*(i+1)/steps + startNy*side*(startW/2+2);
        const isRed = (Math.floor(curbDist / CURB_DASH) % 2 === 0);
        gStartCurb.lineStyle(4, isRed ? 0xCC0000 : 0xFFFFFF, 0.7);
        gStartCurb.beginPath(); gStartCurb.moveTo(cx, cy); gStartCurb.lineTo(nx, ny); gStartCurb.strokePath();
        curbDist += startRoadLen / steps;
      }
    }

    // Start line: checkered pattern
    const gStartLine = this.add.graphics().setDepth(3);
    const SQ_S = 10;
    const startRows = 3;
    const startCols = Math.ceil(startW / SQ_S);
    for (let r = 0; r < startRows; r++) {
      for (let c = 0; c < startCols; c++) {
        const isBlack = (r + c) % 2 === 0;
        gStartLine.fillStyle(isBlack ? 0x222222 : 0xFFFFFF, 0.85);
        const sx = wp0[0] + startNx * (c * SQ_S - startW/2 + SQ_S/2) + startUx * (r * SQ_S - (startRows*SQ_S)/2 + SQ_S/2);
        const sy = wp0[1] + startNy * (c * SQ_S - startW/2 + SQ_S/2) + startUy * (r * SQ_S - (startRows*SQ_S)/2 + SQ_S/2);
        gStartLine.fillRect(sx - SQ_S/2, sy - SQ_S/2, SQ_S, SQ_S);
      }
    }

    // Start banner
    const startBanner = this.add.sprite(wp0[0], wp0[1], 'finish_banner').setDepth(4).setAngle(startAngle);
    startBanner.displayWidth = startW + 20;
    startBanner.scaleY = startBanner.scaleX;

    this.add.text(wp0[0], wp0[1] - 30, 'START', {
      fontSize:'14px', fontFamily:'monospace', color:'#FFFFFF', fontStyle:'bold',
      stroke:'#000000', strokeThickness:3,
    }).setOrigin(0.5).setDepth(5);

    // FINISH LINE at WP 159 (actual finish detection point)
    const finIdx = 157;
    const wFin = wp[finIdx], wFinPrev = wp[finIdx - 1];
    const finAngle = Math.atan2(wFin[1]-wFinPrev[1], wFin[0]-wFinPrev[0]) * 180 / Math.PI + 90;
    const finZone = this.track.zones[this.track.zones.length - 1];
    const finTrackW = finZone.trackWidth || 120;

    // Checkered finish line pattern (drawn with Graphics)
    const finDx = wFin[0]-wFinPrev[0], finDy = wFin[1]-wFinPrev[1];
    const finLen = Math.sqrt(finDx*finDx+finDy*finDy) || 1;
    const finNx = -finDy/finLen, finNy = finDx/finLen; // perpendicular to road
    const finUx = finDx/finLen, finUy = finDy/finLen; // along road

    const checkerG = this.add.graphics().setDepth(3);
    const SQ = 10; // checker square size
    const rows = 3;
    const cols = Math.ceil(finTrackW / SQ);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const isBlack = (r + c) % 2 === 0;
        checkerG.fillStyle(isBlack ? 0x000000 : 0xffffff, 0.9);
        // Position each square relative to finish line center
        const cx = wFin[0] + finNx * (c * SQ - finTrackW/2 + SQ/2) + finUx * (r * SQ - (rows*SQ)/2 + SQ/2);
        const cy = wFin[1] + finNy * (c * SQ - finTrackW/2 + SQ/2) + finUy * (r * SQ - (rows*SQ)/2 + SQ/2);
        checkerG.fillRect(cx - SQ/2, cy - SQ/2, SQ, SQ);
      }
    }

    // Finish banner (checkered) — spans road width
    const finBanner = this.add.sprite(wFin[0], wFin[1], 'finish_banner').setDepth(4).setAngle(finAngle);
    finBanner.displayWidth = finTrackW + 20;
    finBanner.scaleY = finBanner.scaleX;

    // FINISH text below checkered line
    this.add.text(wFin[0], wFin[1] + 20, '🏁 FINISH', {
      fontSize:'18px',fontFamily:'monospace',color:'#e63946',fontStyle:'bold',stroke:'#000',strokeThickness:3,
    }).setOrigin(0.5).setDepth(5);

    // Barrier collision data is now collected in placeBarriers() → this._barrierSegments
  }

  drawSprintOverlay() {
    // v5: Road texture handles surface detail. Only curbs remain (drawn in drawTrack).
    // Sprint-specific overlay removed — v5 asphalt texture already has center lines.
  }

  // ---- Utility: compute smoothed normals for a waypoint range ----
  computeNormals(waypoints, startWP, endWP) {
    const normals = [];
    for (let i = startWP; i < endWP; i++) {
      let nx = 0, ny = 0;
      if (i > startWP) {
        const dx = waypoints[i][0] - waypoints[i-1][0], dy = waypoints[i][1] - waypoints[i-1][1];
        const l = Math.sqrt(dx*dx + dy*dy) || 1;
        nx += -dy/l; ny += dx/l;
      }
      if (i < endWP - 1) {
        const dx = waypoints[i+1][0] - waypoints[i][0], dy = waypoints[i+1][1] - waypoints[i][1];
        const l = Math.sqrt(dx*dx + dy*dy) || 1;
        nx += -dy/l; ny += dx/l;
      }
      const l = Math.sqrt(nx*nx + ny*ny) || 1;
      normals.push([nx/l, ny/l]);
    }
    return normals;
  }

  // ---- Parts-based rendering: Desert zone ----
  renderTrackParts() {
    const wp = this.track.waypoints;
    const allZones = this.track.zones;
    this._desertBarrierSegments = [];

    if (allZones.length === 0) return;

    const startWP = allZones[0].fromWP;
    const endWP = Math.min(allZones[allZones.length - 1].toWP, wp.length);
    const baseHalfW = 50; // default roadWidth 100 / 2
    const bgHalfW = 350; // expanded for dramatic curves

    // Dynamic road width map (wider at corners)
    const halfWAt = () => baseHalfW; // fixed road width

    // Open field segments (no barriers)
    const openSegs = this.track.openFieldSegments || [];
    const isOpenField = (wpIdx) => {
      for (const seg of openSegs) {
        if (wpIdx >= seg[0] && wpIdx <= seg[1]) return true;
      }
      return false;
    };

    // Compute normals for the full track
    const normals = this.computeNormals(wp, startWP, endWP);

    // Seeded RNG for deterministic terrain detail
    let detailSeed = 12345;
    const detailRng = () => {
      detailSeed = (detailSeed * 16807 + 0) % 2147483647;
      return detailSeed / 2147483647;
    };

    // Helper: extract RGB components from hex color
    const hexRGB = (c) => [(c >> 16) & 0xFF, (c >> 8) & 0xFF, c & 0xFF];
    const rgbHex = (r, g, b) => (r << 16) | (g << 8) | b;

    // ===== 0. BASE FILL — cover entire world with desert bg =====
    const gBase = this.add.graphics().setDepth(-1);
    gBase.fillStyle(0xD2B48C, 1);
    gBase.fillRect(-5000, -15000, 25000, 35000);

    // ===== 0.5 UV-MAPPED TEXTURE for all parts =====
    if (this.textures.exists('tile_desert_bg')) {
      this._renderBgTextures(wp, normals, startWP, baseHalfW, 'tile_desert_bg');
    }
    if (this.textures.exists('tile_dalle_straight')) {
      this._renderTrackTextures(wp, normals, startWP, baseHalfW, 'tile_dalle_straight');
    }

    // ===== 1. BACKGROUND (depth 0) =====
    for (const zone of allZones) {
      const s = zone.fromWP, e = Math.min(zone.toWP, wp.length);
      const zc = zoneConfig[zone.name];
      const isTransition = zc && zc.transition;
      const totalWP = e - s;
      const zoneBg = zc ? zc.bgColor : 0xD2B48C;

      const gBg = this.add.graphics().setDepth(0);

      for (let i = s; i < e - 1; i++) {
        const ni = normals[i - startWP];
        const niNext = normals[Math.min(i + 1 - startWP, normals.length - 1)];

        let bgColor = zoneBg;
        if (isTransition && totalWP > 0) {
          const fromZc = zoneConfig[zc.transition.from];
          const toZc = zoneConfig[zc.transition.to];
          if (fromZc && toZc) {
            const p = (i - s) / totalWP;
            const [r1, g1, b1] = hexRGB(fromZc.bgColor);
            const [r2, g2, b2] = hexRGB(toZc.bgColor);
            bgColor = rgbHex(
              Math.round(r1 + (r2 - r1) * p),
              Math.round(g1 + (g2 - g1) * p),
              Math.round(b1 + (b2 - b1) * p)
            );
          }
        }

        for (const side of [-1, 1]) {
          const innerOff = halfWAt(i) + 2;
          const innerOffN = halfWAt(i+1) + 2;
          const outerOff = bgHalfW;
          const ix = wp[i][0] + ni[0] * side * innerOff;
          const iy = wp[i][1] + ni[1] * side * innerOff;
          const ox = wp[i][0] + ni[0] * side * outerOff;
          const oy = wp[i][1] + ni[1] * side * outerOff;
          const ixN = wp[i+1][0] + niNext[0] * side * innerOffN;
          const iyN = wp[i+1][1] + niNext[1] * side * innerOffN;
          const oxN = wp[i+1][0] + niNext[0] * side * outerOff;
          const oyN = wp[i+1][1] + niNext[1] * side * outerOff;

          gBg.fillStyle(bgColor, 1);
          gBg.beginPath();
          gBg.moveTo(ix, iy); gBg.lineTo(ox, oy);
          gBg.lineTo(oxN, oyN); gBg.lineTo(ixN, iyN);
          gBg.closePath(); gBg.fillPath();
        }
      }

      // Road edge grass/dirt line — darkened strip just outside road
      const gEdge = this.add.graphics().setDepth(0);
      const edgeStripColor = zoneBg > 0x808080 ? 0x907840 : 0x505050;
      for (const side of [-1, 1]) {
        gEdge.lineStyle(5, edgeStripColor, 0.35);
        gEdge.beginPath();
        const ni0 = normals[s - startWP];
        gEdge.moveTo(wp[s][0] + ni0[0] * side * (halfWAt(s) + 4), wp[s][1] + ni0[1] * side * (halfWAt(s) + 4));
        for (let i = s + 1; i < e; i++) {
          const ni = normals[i - startWP];
          gEdge.lineTo(wp[i][0] + ni[0] * side * (halfWAt(i) + 4), wp[i][1] + ni[1] * side * (halfWAt(i) + 4));
        }
        gEdge.strokePath();
      }

      // Terrain detail: dense layered objects (small grains + shrubs + rocks)
      const detailColor1 = zoneBg > 0x808080 ? 0xA08850 : 0x606060;
      const detailColor2 = zoneBg > 0x808080 ? 0xC4A06C : 0x808080;
      const detailColor3 = zoneBg > 0x808080 ? 0x8A7040 : 0x4A4A4A;
      const gDetail = this.add.graphics().setDepth(0);
      for (let i = s; i < e; i += 2) {
        const ni = normals[i - startWP];
        // 10 details per segment (denser than before)
        for (let d = 0; d < 10; d++) {
          const side = detailRng() > 0.5 ? 1 : -1;
          const offset = halfWAt(i) + 4 + detailRng() * (bgHalfW - halfWAt(i) - 8);
          const along = (detailRng() - 0.5) * 60;
          const dx = wp[i][0] + ni[0] * side * offset;
          const dy = wp[i][1] + ni[1] * side * offset;
          const fwd = i < e - 1 ?
            [wp[i+1][0] - wp[i][0], wp[i+1][1] - wp[i][1]] : [0, -1];
          const fLen = Math.sqrt(fwd[0]*fwd[0] + fwd[1]*fwd[1]) || 1;
          const px = dx + (fwd[0]/fLen) * along;
          const py = dy + (fwd[1]/fLen) * along;

          const roll = detailRng();
          if (roll > 0.85) {
            // Large rock/bush (rare)
            const r = 12 + detailRng() * 6;
            gDetail.fillStyle(detailColor3, 0.25);
            gDetail.fillCircle(px, py, r);
            gDetail.fillStyle(detailColor1, 0.15);
            gDetail.fillCircle(px - 2, py - 2, r * 0.7);
          } else if (roll > 0.55) {
            // Medium shrub
            const r = 6 + detailRng() * 5;
            gDetail.fillStyle(detailColor1, 0.2);
            gDetail.fillCircle(px, py, r);
          } else {
            // Small grain
            const r = 2 + detailRng() * 3;
            gDetail.fillStyle(detailColor2, 0.3);
            gDetail.fillCircle(px, py, r);
          }
        }
      }

      // Barrier-adjacent detail: small rocks/grass near barrier line
      const gBarrierDetail = this.add.graphics().setDepth(0);
      for (let i = s; i < e; i += 3) {
        const ni = normals[i - startWP];
        for (const side of [-1, 1]) {
          if (detailRng() > 0.4) continue;
          const bOff = halfWAt(i) + 10 + detailRng() * 8;
          const bx = wp[i][0] + ni[0] * side * bOff;
          const by = wp[i][1] + ni[1] * side * bOff;
          const r = 2 + detailRng() * 3;
          gBarrierDetail.fillStyle(detailColor3, 0.3);
          gBarrierDetail.fillCircle(bx, by, r);
        }
      }
    }

    // ===== 2. ROAD (depth 1) — disabled: UV texture covers road =====
    const USE_VECTOR_ROAD = false;
    if (USE_VECTOR_ROAD) {
      const gRoad = this.add.graphics().setDepth(1);
      for (const zone of allZones) {
        const s = zone.fromWP, e = Math.min(zone.toWP, wp.length);
        const zc = zoneConfig[zone.name];
        const isTransition = zc && zc.transition;
        const totalWP = e - s;
        const roadColor = zc ? zc.roadColor : 0x9B7B4A;
        const edgeColor = zc ? zc.edgeColor : 0x8a6a30;

        gRoad.lineStyle(120, edgeColor, 0.4);
        gRoad.beginPath();
        gRoad.moveTo(wp[s][0], wp[s][1]);
        for (let i = s + 1; i < e; i++) gRoad.lineTo(wp[i][0], wp[i][1]);
        gRoad.strokePath();

        if (isTransition) {
          const fromZc = zoneConfig[zc.transition.from];
          const toZc = zoneConfig[zc.transition.to];
          if (fromZc && toZc) {
            const [r1, g1, b1] = hexRGB(fromZc.roadColor);
            const [r2, g2, b2] = hexRGB(toZc.roadColor);
            for (let i = s; i < e - 1; i++) {
              const p = totalWP > 0 ? (i - s) / totalWP : 0;
              const blended = rgbHex(
                Math.round(r1 + (r2 - r1) * p),
                Math.round(g1 + (g2 - g1) * p),
                Math.round(b1 + (b2 - b1) * p)
              );
              gRoad.lineStyle(100, blended, 1);
              gRoad.beginPath();
              gRoad.moveTo(wp[i][0], wp[i][1]);
              gRoad.lineTo(wp[i+1][0], wp[i+1][1]);
              gRoad.strokePath();
            }
          }
        } else {
          gRoad.lineStyle(100, roadColor, 1);
          gRoad.beginPath();
          gRoad.moveTo(wp[s][0], wp[s][1]);
          for (let i = s + 1; i < e; i++) gRoad.lineTo(wp[i][0], wp[i][1]);
          gRoad.strokePath();
        }
      }
    }

    // ===== 3. CURB MARKERS (depth 2) =====
    const CURB_DASH = 10, CURB_W = 4;
    for (const zone of allZones) {
      const s = zone.fromWP, e = Math.min(zone.toWP, wp.length);
      const gCurb = this.add.graphics().setDepth(2);

      for (const side of [-1, 1]) {
        const edgePts = [];
        for (let i = s; i < e; i++) {
          const ni = normals[i - startWP];
          edgePts.push([wp[i][0] + ni[0] * side * (halfWAt(i) + 2), wp[i][1] + ni[1] * side * (halfWAt(i) + 2)]);
        }
        let curbDist = 0;
        for (let i = 0; i < edgePts.length - 1; i++) {
          const dx = edgePts[i+1][0] - edgePts[i][0], dy = edgePts[i+1][1] - edgePts[i][1];
          const segLen = Math.sqrt(dx*dx + dy*dy);
          if (segLen < 1) continue;
          const ux = dx/segLen, uy = dy/segLen;
          let pos = 0;
          while (pos < segLen) {
            const step = Math.min(CURB_DASH, segLen - pos);
            const isRed = (Math.floor(curbDist / CURB_DASH) % 2 === 0);
            gCurb.lineStyle(CURB_W, isRed ? 0xCC0000 : 0xFFFFFF, 0.7);
            const x1 = edgePts[i][0] + ux * pos, y1 = edgePts[i][1] + uy * pos;
            const x2 = edgePts[i][0] + ux * (pos + step), y2 = edgePts[i][1] + uy * (pos + step);
            gCurb.beginPath(); gCurb.moveTo(x1, y1); gCurb.lineTo(x2, y2); gCurb.strokePath();
            pos += step;
            curbDist += step;
          }
        }
      }
    }

    // ===== 4. BARRIERS — wood fence with open-field toggle (depth 3) =====
    for (const zone of allZones) {
      const s = zone.fromWP, e = Math.min(zone.toWP, wp.length);
      const zc = zoneConfig[zone.name];
      const barrierColor = zc ? zc.barrierColor : 0x8B6914;
      const fenceColor = ((barrierColor >> 1) & 0x7F7F7F);

      // Collect barrier collision data (with dynamic width)
      for (let i = s; i < e; i++) {
        if (isOpenField(i)) continue; // no collision in open field
        const ni = normals[i - startWP];
        const bDist = halfWAt(i) + 8;
        this._desertBarrierSegments.push({
          x: wp[i][0], y: wp[i][1], nx: ni[0], ny: ni[1], dist: bDist
        });
      }

      const bPos = (i, side) => {
        const ni = normals[i - startWP];
        const bDist = halfWAt(i) + 8;
        return [wp[i][0] + ni[0] * side * bDist, wp[i][1] + ni[1] * side * bDist];
      };

      // Draw barriers in segments, skipping open-field waypoints
      for (const side of [-1, 1]) {
        // Build runs of non-open-field waypoints
        let runStart = -1;
        for (let i = s; i <= e; i++) {
          const open = (i >= e) || isOpenField(i);
          if (!open && runStart < 0) { runStart = i; continue; }
          if (open && runStart >= 0) {
            // Draw fence for this run [runStart, i)
            const rs = runStart, re = i;

            // Rails
            for (const railOff of [-2, 2]) {
              const gRail = this.add.graphics().setDepth(3);
              gRail.lineStyle(2, barrierColor, 0.9);
              gRail.beginPath();
              const [sx, sy] = bPos(rs, side);
              const n0 = normals[rs - startWP];
              gRail.moveTo(sx + n0[0] * railOff, sy + n0[1] * railOff);
              for (let j = rs + 1; j < re; j++) {
                const [px, py] = bPos(j, side);
                const ni = normals[j - startWP];
                gRail.lineTo(px + ni[0] * railOff, py + ni[1] * railOff);
              }
              gRail.strokePath();
            }

            // Main fence line
            const gFence = this.add.graphics().setDepth(3);
            gFence.lineStyle(4, fenceColor, 0.9);
            gFence.beginPath();
            const [fsx, fsy] = bPos(rs, side);
            gFence.moveTo(fsx, fsy);
            for (let j = rs + 1; j < re; j++) {
              const [px, py] = bPos(j, side);
              gFence.lineTo(px, py);
            }
            gFence.strokePath();

            // Posts every 30px
            const gPosts = this.add.graphics().setDepth(3);
            gPosts.fillStyle(barrierColor, 1);
            let dist = 0;
            for (let j = rs; j < re - 1; j++) {
              const dx = wp[j+1][0] - wp[j][0], dy = wp[j+1][1] - wp[j][1];
              dist += Math.sqrt(dx*dx + dy*dy);
              if (dist >= 30) {
                dist = 0;
                const [px, py] = bPos(j + 1, side);
                gPosts.fillCircle(px, py, 3);
              }
            }

            runStart = -1;
          }
        }
      }
    }

    // ===== 4b. TIRE WALLS at corners (depth 4) =====
    const tireWalls = this.track.tireWalls || [];
    for (const tw of tireWalls) {
      const wi = tw.wpIndex;
      if (wi >= wp.length) continue;
      const ni = normals[wi - startWP];
      if (!ni) continue;
      const bDist = halfWAt(wi) + 12;
      const tx = wp[wi][0] + ni[0] * tw.side * bDist;
      const ty = wp[wi][1] + ni[1] * tw.side * bDist;
      const numTires = tw.type === 'large' ? 5 : 3;
      const tireR = 8;
      const gTire = this.add.graphics().setDepth(4);

      // Stack tires perpendicular to road
      for (let t = 0; t < numTires; t++) {
        const offset = (t - (numTires - 1) / 2) * tireR * 1.6;
        // Get road direction for perpendicular stacking
        const prevWP = Math.max(0, wi - 1);
        const nextWP = Math.min(wp.length - 1, wi + 1);
        const rdx = wp[nextWP][0] - wp[prevWP][0];
        const rdy = wp[nextWP][1] - wp[prevWP][1];
        const rlen = Math.sqrt(rdx * rdx + rdy * rdy) || 1;
        const px = tx + (rdx / rlen) * offset;
        const py = ty + (rdy / rlen) * offset;

        // White tire with red stripe
        gTire.fillStyle(0xFFFFFF, 0.9);
        gTire.fillCircle(px, py, tireR);
        gTire.fillStyle(0xCC0000, 0.9);
        gTire.fillCircle(px, py, tireR * 0.6);
        gTire.fillStyle(0x333333, 0.8);
        gTire.fillCircle(px, py, tireR * 0.3);
      }
    }

    // --- START ZONE: extend road behind start + start line ---
    const wp0s = wp[0], wp1s = wp[1];
    const sAngle = Math.atan2(wp1s[1]-wp0s[1], wp1s[0]-wp0s[0]) * 180 / Math.PI + 90;
    const sZone = this.track.zones[0];
    const sRoadLen = 600;
    const sDir = { dx: wp1s[0]-wp0s[0], dy: wp1s[1]-wp0s[1] };
    const sDirLen = Math.sqrt(sDir.dx**2 + sDir.dy**2) || 1;
    const sUx = sDir.dx/sDirLen, sUy = sDir.dy/sDirLen;
    const sNx = -sUy, sNy = sUx;
    const sW = sZone.trackWidth || 100;

    const gStartRoad = this.add.graphics().setDepth(1);
    const sRoadColor = zoneConfig[sZone.name]?.roadColor || 0x9B7B4A;
    const sEdgeColor = zoneConfig[sZone.name]?.edgeColor || 0x8a6a30;
    const behindX = wp0s[0] - sUx * sRoadLen;
    const behindY = wp0s[1] - sUy * sRoadLen;
    gStartRoad.lineStyle(sW + 20, sEdgeColor, 0.4);
    gStartRoad.beginPath(); gStartRoad.moveTo(behindX, behindY); gStartRoad.lineTo(wp0s[0], wp0s[1]); gStartRoad.strokePath();
    gStartRoad.lineStyle(sW, sRoadColor, 1);
    gStartRoad.beginPath(); gStartRoad.moveTo(behindX, behindY); gStartRoad.lineTo(wp0s[0], wp0s[1]); gStartRoad.strokePath();

    // Curbs on extended road
    const gStartCurb = this.add.graphics().setDepth(2);
    for (const side of [-1, 1]) {
      let cDist = 0;
      const CDASH = 10, cSteps = 30;
      for (let ci = 0; ci < cSteps; ci++) {
        const t0 = ci / cSteps, t1 = (ci+1) / cSteps;
        const cx0 = behindX + (wp0s[0]-behindX)*t0 + sNx*side*(sW/2+2);
        const cy0 = behindY + (wp0s[1]-behindY)*t0 + sNy*side*(sW/2+2);
        const cx1 = behindX + (wp0s[0]-behindX)*t1 + sNx*side*(sW/2+2);
        const cy1 = behindY + (wp0s[1]-behindY)*t1 + sNy*side*(sW/2+2);
        gStartCurb.lineStyle(4, (Math.floor(cDist / CDASH) % 2 === 0) ? 0xCC0000 : 0xFFFFFF, 0.7);
        gStartCurb.beginPath(); gStartCurb.moveTo(cx0, cy0); gStartCurb.lineTo(cx1, cy1); gStartCurb.strokePath();
        cDist += sRoadLen / cSteps;
      }
    }

    // Start line: checkered pattern
    const gStartLine = this.add.graphics().setDepth(3);
    const sSQ = 10, sRows = 3, sCols = Math.ceil(sW / sSQ);
    for (let r = 0; r < sRows; r++) {
      for (let c = 0; c < sCols; c++) {
        gStartLine.fillStyle((r + c) % 2 === 0 ? 0x222222 : 0xFFFFFF, 0.85);
        const sx = wp0s[0] + sNx * (c * sSQ - sW/2 + sSQ/2) + sUx * (r * sSQ - (sRows*sSQ)/2 + sSQ/2);
        const sy = wp0s[1] + sNy * (c * sSQ - sW/2 + sSQ/2) + sUy * (r * sSQ - (sRows*sSQ)/2 + sSQ/2);
        gStartLine.fillRect(sx - sSQ/2, sy - sSQ/2, sSQ, sSQ);
      }
    }

    // Start banner + text
    const startBnr = this.add.sprite(wp0s[0], wp0s[1], 'finish_banner').setDepth(4).setAngle(sAngle);
    startBnr.displayWidth = sW + 20; startBnr.scaleY = startBnr.scaleX;
    this.add.text(wp0s[0], wp0s[1] - 30, 'START', {
      fontSize:'14px', fontFamily:'monospace', color:'#FFFFFF', fontStyle:'bold',
      stroke:'#000000', strokeThickness:3,
    }).setOrigin(0.5).setDepth(5);

    // --- FINISH LINE ---
    const finWP = this.track.finishWP;
    const wFin = wp[finWP], wFinPrev = wp[finWP - 1];
    const fAngle = Math.atan2(wFin[1]-wFinPrev[1], wFin[0]-wFinPrev[0]) * 180 / Math.PI + 90;
    const fZone = this.track.zones[this.track.zones.length - 1];
    const fW = fZone.trackWidth || 100;
    const fDx = wFin[0]-wFinPrev[0], fDy = wFin[1]-wFinPrev[1];
    const fLen = Math.sqrt(fDx*fDx+fDy*fDy) || 1;
    const fNx = -fDy/fLen, fNy = fDx/fLen;
    const fUx = fDx/fLen, fUy = fDy/fLen;

    const checkerG = this.add.graphics().setDepth(3);
    const fSQ = 10, fRows = 3, fCols = Math.ceil(fW / fSQ);
    for (let r = 0; r < fRows; r++) {
      for (let c = 0; c < fCols; c++) {
        checkerG.fillStyle((r + c) % 2 === 0 ? 0x000000 : 0xFFFFFF, 0.9);
        const fx = wFin[0] + fNx * (c * fSQ - fW/2 + fSQ/2) + fUx * (r * fSQ - (fRows*fSQ)/2 + fSQ/2);
        const fy = wFin[1] + fNy * (c * fSQ - fW/2 + fSQ/2) + fUy * (r * fSQ - (fRows*fSQ)/2 + fSQ/2);
        checkerG.fillRect(fx - fSQ/2, fy - fSQ/2, fSQ, fSQ);
      }
    }

    const finBnr = this.add.sprite(wFin[0], wFin[1], 'finish_banner').setDepth(4).setAngle(fAngle);
    finBnr.displayWidth = fW + 20; finBnr.scaleY = finBnr.scaleX;
    this.add.text(wFin[0], wFin[1] + 20, 'FINISH', {
      fontSize:'18px', fontFamily:'monospace', color:'#e63946', fontStyle:'bold',
      stroke:'#000', strokeThickness:3,
    }).setOrigin(0.5).setDepth(5);
  }

  // ---- Canvas 2D background UV texture mapping (both sides of road) ----
  _renderBgTextures(wp, normals, startWP, halfW, tileKey) {
    const texFrame = this.textures.getFrame(tileKey);
    if (!texFrame) return;
    const texImg = texFrame.source.image;
    const texW = texFrame.width;
    const texH = texFrame.height;

    function drawTri(ctx, img, u0, v0, u1, v1, u2, v2, x0, y0, x1, y1, x2, y2) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.lineTo(x2, y2);
      ctx.closePath();
      ctx.clip();
      const du1 = u1 - u0, dv1 = v1 - v0;
      const du2 = u2 - u0, dv2 = v2 - v0;
      const dx1 = x1 - x0, dy1 = y1 - y0;
      const dx2 = x2 - x0, dy2 = y2 - y0;
      const det = du1 * dv2 - du2 * dv1;
      if (Math.abs(det) < 0.001) { ctx.restore(); return; }
      const a = (dx1 * dv2 - dx2 * dv1) / det;
      const c = (du1 * dx2 - du2 * dx1) / det;
      const b = (dy1 * dv2 - dy2 * dv1) / det;
      const d = (du1 * dy2 - du2 * dy1) / det;
      const e = x0 - a * u0 - c * v0;
      const f = y0 - b * u0 - d * v0;
      ctx.setTransform(a, b, c, d, e, f);
      ctx.drawImage(img, 0, 0);
      ctx.restore();
    }

    // Tiled texture for V-repeat
    const maxPartLen = 1000;
    const tilesNeeded = Math.ceil(maxPartLen / texH) + 1;
    const tiledCanvas = document.createElement('canvas');
    tiledCanvas.width = texW;
    tiledCanvas.height = texH * tilesNeeded;
    const tiledCtx = tiledCanvas.getContext('2d');
    for (let t = 0; t < tilesNeeded; t++) {
      tiledCtx.drawImage(texImg, 0, t * texH);
    }

    const bgOuterW = 200; // background extends 200px beyond road edge
    const OD = 1.0;

    let partIdx = 0;
    for (const pb of this.track.partBounds) {
      const drawEnd = Math.min(pb.endWP + 1, wp.length - 1);

      // Bounds including outer background
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (let i = pb.startWP; i <= drawEnd; i++) {
        const ni = normals[i - startWP];
        if (!ni) continue;
        for (const side of [-1, 1]) {
          const px = wp[i][0] + ni[0] * side * (halfW + bgOuterW + 10);
          const py = wp[i][1] + ni[1] * side * (halfW + bgOuterW + 10);
          if (px < minX) minX = px; if (px > maxX) maxX = px;
          if (py < minY) minY = py; if (py > maxY) maxY = py;
        }
      }
      const pad = 4;
      minX -= pad; minY -= pad; maxX += pad; maxY += pad;
      const cw = Math.ceil(maxX - minX);
      const ch = Math.ceil(maxY - minY);
      if (cw < 1 || ch < 1 || cw > 4096 || ch > 4096) continue;

      const canvas = document.createElement('canvas');
      canvas.width = cw;
      canvas.height = ch;
      const ctx = canvas.getContext('2d');

      let vAccum = 0;
      for (let i = pb.startWP; i <= drawEnd - 1 && i + 1 < wp.length; i++) {
        const ni = normals[i - startWP];
        const niNext = normals[i + 1 - startWP];
        if (!ni || !niNext) continue;

        const segDx = wp[i+1][0] - wp[i][0];
        const segDy = wp[i+1][1] - wp[i][1];
        const segLen = Math.sqrt(segDx * segDx + segDy * segDy);
        if (segLen < 0.5) { vAccum += segLen; continue; }

        const ux = segDx / segLen, uy = segDy / segLen;
        const v0 = vAccum - OD;
        const v1 = vAccum + segLen + OD;

        // Draw left and right background strips
        for (const side of [-1, 1]) {
          // Inner edge (road boundary)
          const iax = wp[i][0] + ni[0] * side * halfW - ux * OD - minX;
          const iay = wp[i][1] + ni[1] * side * halfW - uy * OD - minY;
          const ibx = wp[i+1][0] + niNext[0] * side * halfW + ux * OD - minX;
          const iby = wp[i+1][1] + niNext[1] * side * halfW + uy * OD - minY;

          // Outer edge (background boundary)
          const oax = wp[i][0] + ni[0] * side * (halfW + bgOuterW) - ux * OD - minX;
          const oay = wp[i][1] + ni[1] * side * (halfW + bgOuterW) - uy * OD - minY;
          const obx = wp[i+1][0] + niNext[0] * side * (halfW + bgOuterW) + ux * OD - minX;
          const oby = wp[i+1][1] + niNext[1] * side * (halfW + bgOuterW) + uy * OD - minY;

          // Triangle A: inner-top → outer-top → inner-bottom
          drawTri(ctx, tiledCanvas, 0,v0, texW,v0, 0,v1, iax,iay, oax,oay, ibx,iby);
          // Triangle B: outer-top → outer-bottom → inner-bottom
          drawTri(ctx, tiledCanvas, texW,v0, texW,v1, 0,v1, oax,oay, obx,oby, ibx,iby);
        }
        vAccum += segLen;
      }

      const texKey2 = '__bg_part_' + (partIdx++) + '_' + Date.now();
      this.textures.addCanvas(texKey2, canvas);
      this.add.image(minX, minY, texKey2).setOrigin(0, 0).setDepth(0.5);
    }
    console.log('[UV-BG] rendered', partIdx, 'background parts');
  }

  // ---- Canvas 2D affine triangle texture mapping for all parts ----
  _renderTrackTextures(wp, normals, startWP, halfW, tileKey) {
    const texFrame = this.textures.getFrame(tileKey);
    if (!texFrame) return;
    const texImg = texFrame.source.image;
    const texW = texFrame.width;
    const texH = texFrame.height;

    // drawTriangle: affine map 3 UV points to 3 screen points
    function drawTri(ctx, img, u0, v0, u1, v1, u2, v2, x0, y0, x1, y1, x2, y2) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.lineTo(x2, y2);
      ctx.closePath();
      ctx.clip();

      const du1 = u1 - u0, dv1 = v1 - v0;
      const du2 = u2 - u0, dv2 = v2 - v0;
      const dx1 = x1 - x0, dy1 = y1 - y0;
      const dx2 = x2 - x0, dy2 = y2 - y0;
      const det = du1 * dv2 - du2 * dv1;
      if (Math.abs(det) < 0.001) { ctx.restore(); return; }

      const a = (dx1 * dv2 - dx2 * dv1) / det;
      const c = (du1 * dx2 - du2 * dx1) / det;
      const b = (dy1 * dv2 - dy2 * dv1) / det;
      const d = (du1 * dy2 - du2 * dy1) / det;
      const e = x0 - a * u0 - c * v0;
      const f = y0 - b * u0 - d * v0;

      ctx.setTransform(a, b, c, d, e, f);
      ctx.drawImage(img, 0, 0);
      ctx.restore();
    }

    // Create vertically tiled texture (hairpin can be ~800px long)
    const maxPartLen = 1000;
    const tilesNeeded = Math.ceil(maxPartLen / texH) + 1;
    const tiledCanvas = document.createElement('canvas');
    tiledCanvas.width = texW;
    tiledCanvas.height = texH * tilesNeeded;
    const tiledCtx = tiledCanvas.getContext('2d');
    for (let t = 0; t < tilesNeeded; t++) {
      tiledCtx.drawImage(texImg, 0, t * texH);
    }

    let partIdx = 0;
    for (const pb of this.track.partBounds) {
      // Include next WP to bridge gap between parts
      const drawEnd = Math.min(pb.endWP + 1, wp.length - 1);

      // Compute bounds for this part
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (let i = pb.startWP; i <= drawEnd; i++) {
        const ni = normals[i - startWP];
        if (!ni) continue;
        for (const side of [-1, 1]) {
          const px = wp[i][0] + ni[0] * side * (halfW + 5);
          const py = wp[i][1] + ni[1] * side * (halfW + 5);
          if (px < minX) minX = px; if (px > maxX) maxX = px;
          if (py < minY) minY = py; if (py > maxY) maxY = py;
        }
      }
      const pad = 4;
      minX -= pad; minY -= pad; maxX += pad; maxY += pad;
      const cw = Math.ceil(maxX - minX);
      const ch = Math.ceil(maxY - minY);
      if (cw < 1 || ch < 1 || cw > 4096 || ch > 4096) continue;

      const canvas = document.createElement('canvas');
      canvas.width = cw;
      canvas.height = ch;
      const ctx = canvas.getContext('2d');

      // Method 3: fill with road average color as safety net
      ctx.fillStyle = '#8B7B4A';
      ctx.fillRect(0, 0, cw, ch);
      ctx.globalCompositeOperation = 'source-over';

      const OD = 1.0; // overDraw pixels to eliminate seams
      let vAccum = 0;
      for (let i = pb.startWP; i <= drawEnd - 1 && i + 1 < wp.length; i++) {
        const ni = normals[i - startWP];
        const niNext = normals[i + 1 - startWP];
        if (!ni || !niNext) continue;

        const segDx = wp[i+1][0] - wp[i][0];
        const segDy = wp[i+1][1] - wp[i][1];
        const segLen = Math.sqrt(segDx * segDx + segDy * segDy);
        if (segLen < 0.5) { vAccum += segLen; continue; }

        // Road direction unit vector
        const ux = segDx / segLen, uy = segDy / segLen;

        // Method 1: overDraw — extend quad by OD pixels in road direction
        const tlx = wp[i][0] + ni[0] * halfW - ux * OD - minX;
        const tly = wp[i][1] + ni[1] * halfW - uy * OD - minY;
        const trx = wp[i][0] - ni[0] * halfW - ux * OD - minX;
        const try_ = wp[i][1] - ni[1] * halfW - uy * OD - minY;
        const blx = wp[i+1][0] + niNext[0] * halfW + ux * OD - minX;
        const bly = wp[i+1][1] + niNext[1] * halfW + uy * OD - minY;
        const brx = wp[i+1][0] - niNext[0] * halfW + ux * OD - minX;
        const bry = wp[i+1][1] - niNext[1] * halfW + uy * OD - minY;

        const v0 = vAccum - OD;
        const v1 = vAccum + segLen + OD;

        // Triangle A: TL→TR→BL
        drawTri(ctx, tiledCanvas, 0,v0, texW,v0, 0,v1, tlx,tly, trx,try_, blx,bly);
        // Triangle B: TR→BR→BL
        drawTri(ctx, tiledCanvas, texW,v0, texW,v1, 0,v1, trx,try_, brx,bry, blx,bly);
        vAccum += segLen;
      }

      // Clip canvas to actual road shape to remove background fill outside road
      const clipCanvas = document.createElement('canvas');
      clipCanvas.width = cw;
      clipCanvas.height = ch;
      const clipCtx = clipCanvas.getContext('2d');

      // Draw road mask
      clipCtx.beginPath();
      for (let i = pb.startWP; i <= drawEnd; i++) {
        const ni = normals[i - startWP];
        if (!ni) continue;
        const px = wp[i][0] + ni[0] * (halfW + 1) - minX;
        const py = wp[i][1] + ni[1] * (halfW + 1) - minY;
        if (i === pb.startWP) clipCtx.moveTo(px, py); else clipCtx.lineTo(px, py);
      }
      for (let i = drawEnd; i >= pb.startWP; i--) {
        const ni = normals[i - startWP];
        if (!ni) continue;
        const px = wp[i][0] - ni[0] * (halfW + 1) - minX;
        const py = wp[i][1] - ni[1] * (halfW + 1) - minY;
        clipCtx.lineTo(px, py);
      }
      clipCtx.closePath();
      clipCtx.clip();
      clipCtx.drawImage(canvas, 0, 0);

      const texKey2 = '__uv_part_' + (partIdx++) + '_' + Date.now();
      this.textures.addCanvas(texKey2, clipCanvas);
      this.add.image(minX, minY, texKey2).setOrigin(0, 0).setDepth(1.5);
    }
    console.log('[UV] rendered', partIdx, 'parts (all types) with per-part canvas');
  }

  placeBarriers() {
    const wp = this.track.waypoints;
    this._barrierSegments = [];

    for (const zone of this.track.zones) {
      // Skip desert zones — rendered by renderDesertParts()
      if (zone.name === 'desert' || zone.name === 'trans_desert_canyon') continue;

      const s = Math.max(0, zone.fromWP);
      const e = Math.min(zone.toWP + 1, wp.length);
      const halfW = (zone.trackWidth || 100) / 2;
      const barrierDist = halfW + 8;
      const style = zone.barrierStyle || 'wood_fence';

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

      // Collect collision data for all zones
      for (let i = s; i < e; i++) {
        const ni = normals[i - s];
        this._barrierSegments.push({
          x: wp[i][0], y: wp[i][1], nx: ni[0], ny: ni[1], dist: barrierDist
        });
      }

      // Helper: get barrier point position
      const bPos = (i, side) => {
        const ni = normals[i - s];
        return [wp[i][0] + ni[0] * side * barrierDist, wp[i][1] + ni[1] * side * barrierDist];
      };

      // Helper: segment angle at waypoint
      const segAngle = (i) => {
        const ii = Math.min(i, e - 2);
        const jj = Math.max(ii, s);
        const next = Math.min(jj + 1, e - 1);
        return Math.atan2(wp[next][1] - wp[jj][1], wp[next][0] - wp[jj][0]);
      };

      for (const side of [-1, 1]) {
        if (style === 'wood_fence') {
          // === Wood fence: brown posts + 2 horizontal rails ===
          // Rails
          for (const railOff of [-2, 2]) {
            const g = this.add.graphics().setDepth(3);
            g.lineStyle(2, 0x8B6914, 0.9);
            g.beginPath();
            const [sx, sy] = bPos(s, side);
            const n0 = normals[0];
            g.moveTo(sx + n0[0] * railOff, sy + n0[1] * railOff);
            for (let i = s + 1; i < e; i++) {
              const [px, py] = bPos(i, side);
              const ni = normals[i - s];
              g.lineTo(px + ni[0] * railOff, py + ni[1] * railOff);
            }
            g.strokePath();
          }
          // Posts every 30px
          let dist = 0;
          for (let i = s; i < e - 1; i++) {
            const dx = wp[i+1][0]-wp[i][0], dy = wp[i+1][1]-wp[i][1];
            dist += Math.sqrt(dx*dx+dy*dy);
            if (dist >= 30) {
              dist = 0;
              const [px, py] = bPos(i + 1, side);
              const angle = segAngle(i + 1);
              const g = this.add.graphics().setDepth(3);
              g.fillStyle(0x6B4226, 1);
              g.save && g.save();
              // Draw post as rotated rect
              const cos = Math.cos(angle), sin = Math.sin(angle);
              const hw = 2, hh = 4;
              g.fillRect(px - hw, py - hh, 4, 8);
            }
          }

        } else if (style === 'metal_guardrail') {
          // === Metal guardrail: grey rail + highlight + supports ===
          const g = this.add.graphics().setDepth(3);
          // Main rail
          g.lineStyle(6, 0x808080, 0.95);
          g.beginPath();
          const [sx, sy] = bPos(s, side);
          g.moveTo(sx, sy);
          for (let i = s + 1; i < e; i++) {
            const [px, py] = bPos(i, side);
            g.lineTo(px, py);
          }
          g.strokePath();
          // Highlight
          const gh = this.add.graphics().setDepth(3);
          gh.lineStyle(1, 0xC0C0C0, 0.5);
          gh.beginPath();
          const ni0 = normals[0];
          gh.moveTo(sx - ni0[0] * side * 1, sy - ni0[1] * side * 1);
          for (let i = s + 1; i < e; i++) {
            const [px, py] = bPos(i, side);
            const ni = normals[i - s];
            gh.lineTo(px - ni[0] * side * 1, py - ni[1] * side * 1);
          }
          gh.strokePath();
          // Supports every 40px
          let dist = 0;
          for (let i = s; i < e - 1; i++) {
            const dx = wp[i+1][0]-wp[i][0], dy = wp[i+1][1]-wp[i][1];
            dist += Math.sqrt(dx*dx+dy*dy);
            if (dist >= 40) {
              dist = 0;
              const [px, py] = bPos(i + 1, side);
              const gs = this.add.graphics().setDepth(3);
              gs.fillStyle(0x606060, 1);
              gs.fillRect(px - 1.5, py - 3, 3, 6);
            }
          }

        } else if (style === 'stone_wall') {
          // === Stone wall: thick grey base + snow top + division lines ===
          const g = this.add.graphics().setDepth(3);
          // Base
          g.lineStyle(10, 0x787878, 0.9);
          g.beginPath();
          const [sx, sy] = bPos(s, side);
          g.moveTo(sx, sy);
          for (let i = s + 1; i < e; i++) {
            const [px, py] = bPos(i, side);
            g.lineTo(px, py);
          }
          g.strokePath();
          // Snow top
          const gs = this.add.graphics().setDepth(3);
          gs.lineStyle(3, 0xE8E8F0, 0.4);
          gs.beginPath();
          const ni0s = normals[0];
          gs.moveTo(sx - ni0s[0] * side * 2, sy - ni0s[1] * side * 2);
          for (let i = s + 1; i < e; i++) {
            const [px, py] = bPos(i, side);
            const ni = normals[i - s];
            gs.lineTo(px - ni[0] * side * 2, py - ni[1] * side * 2);
          }
          gs.strokePath();
          // Stone division lines every 20px
          let dist = 0;
          for (let i = s; i < e - 1; i++) {
            const dx = wp[i+1][0]-wp[i][0], dy = wp[i+1][1]-wp[i][1];
            dist += Math.sqrt(dx*dx+dy*dy);
            if (dist >= 20) {
              dist = 0;
              const [px, py] = bPos(i + 1, side);
              const ni = normals[Math.min(i + 1 - s, normals.length - 1)];
              const gd = this.add.graphics().setDepth(3);
              gd.lineStyle(2, 0x585858, 0.7);
              gd.beginPath();
              gd.moveTo(px - ni[0] * side * 5, py - ni[1] * side * 5);
              gd.lineTo(px + ni[0] * side * 5, py + ni[1] * side * 5);
              gd.strokePath();
            }
          }

        } else if (style === 'jersey_barrier') {
          // === Jersey barrier: concrete base + red/white stripes + highlight ===
          const g = this.add.graphics().setDepth(3);
          // Concrete base
          g.lineStyle(10, 0xCCCCCC, 0.95);
          g.beginPath();
          const [sx, sy] = bPos(s, side);
          g.moveTo(sx, sy);
          for (let i = s + 1; i < e; i++) {
            const [px, py] = bPos(i, side);
            g.lineTo(px, py);
          }
          g.strokePath();
          // Red/white stripe dashes every 12px (6px each)
          let dist = 0;
          let stripeIdx = 0;
          for (let i = s; i < e - 1; i++) {
            const dx = wp[i+1][0]-wp[i][0], dy = wp[i+1][1]-wp[i][1];
            const segLen = Math.sqrt(dx*dx+dy*dy);
            const steps = Math.ceil(segLen / 3);
            for (let t = 0; t < steps; t++) {
              const frac = t / steps;
              const px = wp[i][0] + dx * frac, py = wp[i][1] + dy * frac;
              dist += 3;
              if (dist >= 12) { dist = 0; stripeIdx++; }
              const ni = normals[Math.min(i - s, normals.length - 1)];
              const bx = px + ni[0] * side * barrierDist;
              const by = py + ni[1] * side * barrierDist;
              if (dist < 6) {
                const gs = this.add.graphics().setDepth(3);
                gs.fillStyle(stripeIdx % 2 === 0 ? 0xCC0000 : 0xFFFFFF, 0.9);
                gs.fillRect(bx - 1.5, by - 5, 3, 10);
              }
            }
          }
          // Top highlight
          const gt = this.add.graphics().setDepth(3);
          gt.lineStyle(1, 0xFFFFFF, 0.3);
          gt.beginPath();
          const ni0t = normals[0];
          gt.moveTo(sx - ni0t[0] * side * 2, sy - ni0t[1] * side * 2);
          for (let i = s + 1; i < e; i++) {
            const [px, py] = bPos(i, side);
            const ni = normals[i - s];
            gt.lineTo(px - ni[0] * side * 2, py - ni[1] * side * 2);
          }
          gt.strokePath();

          // Sprint streetlights: every 5 waypoints, outside barrier
          if (zone.name === 'sprint') {
            for (let i = s; i < e; i += 5) {
              const ni = normals[i - s];
              const lx = wp[i][0] + ni[0] * side * (barrierDist + 5);
              const ly = wp[i][1] + ni[1] * side * (barrierDist + 5);
              const angle = segAngle(i);
              // Pole
              const gp = this.add.graphics().setDepth(3);
              gp.lineStyle(2, 0x404040, 1);
              gp.beginPath();
              gp.moveTo(lx, ly);
              gp.lineTo(lx + ni[0] * side * 12, ly + ni[1] * side * 12);
              gp.strokePath();
              // Light glow
              const tipX = lx + ni[0] * side * 12, tipY = ly + ni[1] * side * 12;
              const gl = this.add.graphics().setDepth(3);
              gl.fillStyle(0xFFDD44, 0.15);
              gl.fillCircle(tipX, tipY, 8);
              gl.fillStyle(0xFFDD44, 0.7);
              gl.fillCircle(tipX, tipY, 3);
            }
          }
        }
      }
    }

  }

  setupCornerHUD() {
    // Bent arrow drawn on a HUD graphics layer (screen-fixed, above car)
    this._navGfx = this.add.graphics().setScrollFactor(0).setDepth(200).setVisible(false);
    console.log(`[HUD] Nav arrows ready, ${(this.track.arrowHints || []).length} hints`);
  }

  updateCornerHUD() {
    const hints = this.track.arrowHints;
    if (!hints || !this.carState) return;
    const car = this.carState;

    // Show distance = speed × 0.5s, minimum 120px (more lead time for braking)
    const showDist = Math.max(120, Math.abs(car.speed) * 0.5);

    let showHint = null, showDst = Infinity;
    for (const h of hints) {
      const dx = h.x - car.x, dy = h.y - car.y;
      const d = Math.sqrt(dx*dx + dy*dy);
      if (d < showDist && d > 10 && d < showDst) {
        const carRad = Phaser.Math.DegToRad(car.angle);
        const dot = dx * Math.cos(carRad) + dy * Math.sin(carRad);
        if (dot > 0) {
          showDst = d;
          showHint = h;
        }
      }
    }

    this._navGfx.clear();
    if (showHint) {
      this._navGfx.setVisible(true);
      const cx = 400, cy = 260;
      const sz = 22;

      const ea = showHint.entryAngle;
      const xa = showHint.exitAngle;

      const tailX = cx - Math.cos(ea) * sz;
      const tailY = cy - Math.sin(ea) * sz;
      const midX = cx, midY = cy;
      const headX = cx + Math.cos(xa) * sz;
      const headY = cy + Math.sin(xa) * sz;

      // White outline (thick)
      this._navGfx.lineStyle(10, 0xFFFFFF, 0.9);
      this._navGfx.beginPath();
      this._navGfx.moveTo(tailX, tailY);
      this._navGfx.lineTo(midX, midY);
      this._navGfx.lineTo(headX, headY);
      this._navGfx.strokePath();

      // Red body (thick)
      this._navGfx.lineStyle(6, 0xCC0000, 0.95);
      this._navGfx.beginPath();
      this._navGfx.moveTo(tailX, tailY);
      this._navGfx.lineTo(midX, midY);
      this._navGfx.lineTo(headX, headY);
      this._navGfx.strokePath();

      // Arrowhead triangle
      const triSz = 12;
      const tipX = headX + Math.cos(xa) * triSz;
      const tipY = headY + Math.sin(xa) * triSz;
      const px = -Math.sin(xa) * triSz * 0.6;
      const py = Math.cos(xa) * triSz * 0.6;
      this._navGfx.fillStyle(0xFFFFFF, 0.9);
      this._navGfx.fillTriangle(tipX + Math.cos(xa)*2, tipY + Math.sin(xa)*2,
        headX + px + Math.cos(xa)*2, headY + py + Math.sin(xa)*2,
        headX - px + Math.cos(xa)*2, headY - py + Math.sin(xa)*2);
      this._navGfx.fillStyle(0xCC0000, 0.95);
      this._navGfx.fillTriangle(tipX, tipY, headX + px, headY + py, headX - px, headY - py);
    } else {
      this._navGfx.setVisible(false);
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
    // v5: All old scenery assets removed — v5 DALL-E background tiles handle visuals
    // Future: add v5-style scenery if needed
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

  placeRoadObstacles() { this.obstacles = []; }

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

    // Finishing: car auto-drives forward off screen
    if (this.raceState.finishing) {
      const dt = delta / 1000;
      const car = this.carState;
      car.speed = Math.min(car.speed + 300 * dt, 250);
      const moveRad = Phaser.Math.DegToRad(car.moveAngle);
      car.x += Math.cos(moveRad) * car.speed * dt;
      car.y += Math.sin(moveRad) * car.speed * dt;
      this.player.x = car.x;
      this.player.y = car.y;
      this.player.angle = car.angle - 90;
      return;
    }

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
    // this.checkObstacles(); // obstacles removed
    this.checkProgress();
    this.checkZoneChange();
    this.updateCornerHUD();

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

    // obstacles removed — no rotation needed

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

    // Barrier collision — all zones (Canyon~Sprint via placeBarriers)
    if (this._barrierSegments && this._barrierSegments.length > 0) {
      // Find closest barrier segment to car (use spatial check for perf)
      let minD = Infinity, closest = null;
      for (const seg of this._barrierSegments) {
        const d = (car.x - seg.x) ** 2 + (car.y - seg.y) ** 2;
        if (d < minD) { minD = d; closest = seg; }
      }
      if (closest && minD < 200 * 200) {
        const dx = car.x - closest.x, dy = car.y - closest.y;
        const perpDist = dx * closest.nx + dy * closest.ny;
        const absDist = Math.abs(perpDist);
        if (absDist > closest.dist - 5) {
          const sign = perpDist > 0 ? 1 : -1;
          const pushDist = closest.dist - 8;
          const alongX = dx - perpDist * closest.nx;
          const alongY = dy - perpDist * closest.ny;
          car.x = closest.x + alongX + closest.nx * sign * pushDist;
          car.y = closest.y + alongY + closest.ny * sign * pushDist;
          car.speed *= 0.4;
        }
      }
    }

    // Barrier collision — Desert zone (via renderDesertParts)
    if (this._desertBarrierSegments && this._desertBarrierSegments.length > 0) {
      let minD = Infinity, closest = null;
      for (const seg of this._desertBarrierSegments) {
        const d = (car.x - seg.x) ** 2 + (car.y - seg.y) ** 2;
        if (d < minD) { minD = d; closest = seg; }
      }
      if (closest && minD < 200 * 200) {
        const dx = car.x - closest.x, dy = car.y - closest.y;
        const perpDist = dx * closest.nx + dy * closest.ny;
        const absDist = Math.abs(perpDist);
        if (absDist > closest.dist - 5) {
          const sign = perpDist > 0 ? 1 : -1;
          const pushDist = closest.dist - 8;
          const alongX = dx - perpDist * closest.nx;
          const alongY = dy - perpDist * closest.ny;
          car.x = closest.x + alongX + closest.nx * sign * pushDist;
          car.y = closest.y + alongY + closest.ny * sign * pushDist;
          car.speed *= 0.4;
        }
      }
    }
  }

  checkObstacles() {}

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
    if(!rs.finished && !rs.finishing && this._checkLineCross(car.prevX, car.prevY, car.x, car.y, this.track.waypoints)){
      rs.finishing = true;
      rs.finishTime = rs.elapsedTime;
      this.cameras.main.stopFollow();
      soundEngine.playFinish();
      this.time.delayedCall(2000, () => {
        rs.finished = true;
        soundEngine.stopAll();
        soundEngine.stopBGM();
        this.showFinish();
      });
    }
  }

  _checkLineCross(px, py, cx, cy, wp) {
    // Check if car crossed the finish line (perpendicular line at finish waypoint)
    const fIdx = this.track.finishWP ?? (wp.length - 1);
    const last = wp[fIdx], prev = wp[fIdx - 1];
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
      this.scene.restart({ carId: this.selectedCarId, trackId: this.selectedTrackId });
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
