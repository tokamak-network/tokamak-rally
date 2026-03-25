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
      const s = Math.max(0, zone.fromWP);
      const e = Math.min(zone.toWP+1, wp.length);
      const w = zone.trackWidth || 100;
      const halfW = w / 2;

      // Subdivide waypoints at sharp corners (>30° angle change) for smooth quads
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
          if (dAngle > Math.PI/6) { // >30°: insert midpoints
            const steps = Math.ceil(dAngle / (Math.PI/12)); // subdivide into ~15° steps
            for (let t = 1; t <= steps; t++) {
              const frac = t / (steps + 1);
              subPts.push([
                rawPts[i-1][0] + (rawPts[i][0]-rawPts[i-1][0]) * (1-frac*0.5) + (rawPts[i+1][0]-rawPts[i][0]) * frac*0.5,
                rawPts[i-1][1] + (rawPts[i][1]-rawPts[i-1][1]) * (1-frac*0.5) + (rawPts[i+1][1]-rawPts[i][1]) * frac*0.5,
              ]);
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

    // START/FINISH — rotate banners perpendicular to road direction, scale to track width
    const wp0 = wp[0], wp1 = wp[1];
    const startAngle = Math.atan2(wp1[1]-wp0[1], wp1[0]-wp0[0]) * 180 / Math.PI + 90;
    const startZone = this.track.zones[0];
    const startBanner = this.add.sprite(wp0[0], wp0[1], 'finish_banner').setDepth(3).setAngle(startAngle);
    startBanner.displayWidth = (startZone.trackWidth || 110) + 20; // match road width + curb margin
    startBanner.scaleY = startBanner.scaleX; // maintain aspect ratio
    this.add.text(wp0[0], wp0[1]-40, '▶ START', {
      fontSize:'16px',fontFamily:'monospace',color:'#f4d35e',fontStyle:'bold',stroke:'#000',strokeThickness:2,
    }).setOrigin(0.5).setDepth(3);

    // FINISH LINE at WP 159 (actual finish detection point)
    const finIdx = 159;
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

    // Finish banner
    const finBanner = this.add.sprite(wFin[0], wFin[1], 'finish_banner').setDepth(4).setAngle(finAngle);
    finBanner.displayWidth = finTrackW + 20;
    finBanner.scaleY = finBanner.scaleX;
    this.add.text(wFin[0], wFin[1]-40, '🏁 FINISH', {
      fontSize:'18px',fontFamily:'monospace',color:'#e63946',fontStyle:'bold',stroke:'#000',strokeThickness:3,
    }).setOrigin(0.5).setDepth(4);

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
          this.add.sprite(cx, cy, tex).setDepth(4).setScale(2.0);
        }
      }
    }
  }

  drawSprintOverlay() {
    // v5: Road texture handles surface detail. Only curbs remain (drawn in drawTrack).
    // Sprint-specific overlay removed — v5 asphalt texture already has center lines.
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
