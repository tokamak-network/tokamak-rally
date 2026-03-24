/**
 * Sprint Zone Rework — high-detail assets
 * Much larger, more detailed than Phase 2
 */
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'public', 'assets', 'v3');

function save(canvas, ...parts) {
  const p = path.join(OUT, ...parts);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, canvas.toBuffer('image/png'));
  console.log('  ✓', parts.join('/'));
}

// Sprint palette
const SP = {
  asphalt: '#2A2A2E', asphaltL: '#353538', asphaltD: '#1E1E22',
  curb_r: '#CC2222', curb_w: '#EEEEEE',
  line_y: '#CCAA33', line_w: '#DDDDDD',
  concrete: '#707478', concreteL: '#888C90', concreteD: '#585C60',
  metal: '#909498', metalD: '#606468',
  building_base: '#484C54', building_mid: '#585C64', building_top: '#686C74',
  window_lit: '#88BBDD', window_warm: '#DDAA55', window_dark: '#2A2E34',
  tokamak_blue: '#1E3A5F', tokamak_accent: '#4A90E2',
  crowd: ['#DD3333','#2266CC','#EEEE44','#22BB88','#FF6633','#FFFFFF','#AA44CC','#FF77AA',
          '#44AAFF','#FF4488','#88DD44','#FFAA22','#6644FF','#22DDDD','#DD6688','#AABB44'],
};

function noise(ctx, x, y, w, h, colors, density = 0.3) {
  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      if (Math.random() < density) {
        ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
        ctx.fillRect(x + px, y + py, 1, 1);
      }
    }
  }
}

// ============================================================
// 1. ROAD TILE (128×128) — detailed asphalt with lane markings
// ============================================================
function sprintRoadTile() {
  const W = 128, H = 128;
  const c = createCanvas(W, H), ctx = c.getContext('2d');

  // Base asphalt
  ctx.fillStyle = SP.asphalt;
  ctx.fillRect(0, 0, W, H);

  // Aggregate texture — multi-layer noise for realism
  noise(ctx, 0, 0, W, H, [SP.asphaltL, SP.asphaltD, '#323236', '#2E2E32', '#262628'], 0.55);

  // Subtle tire wear streaks (longitudinal)
  ctx.globalAlpha = 0.06;
  ctx.fillStyle = '#1A1A1E';
  for (let x = 28; x < W; x += 32) {
    ctx.fillRect(x, 0, 4, H);
    ctx.fillRect(x + 12, 0, 3, H);
  }
  ctx.globalAlpha = 1;

  // Micro-cracks
  ctx.strokeStyle = '#1E1E22';
  ctx.lineWidth = 0.5;
  ctx.globalAlpha = 0.15;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    let cx = Math.random() * W, cy = Math.random() * H;
    ctx.moveTo(cx, cy);
    for (let j = 0; j < 4; j++) {
      cx += (Math.random() - 0.5) * 20;
      cy += (Math.random() - 0.5) * 20;
      ctx.lineTo(cx, cy);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  save(c, 'objects', 'sprint', 'road_tile.png');
}

// ============================================================
// 2. BUILDING — Office Tower (64×128, tall glass/concrete)
// ============================================================
function sprintBuildingOffice() {
  const W = 64, H = 128;
  const c = createCanvas(W, H), ctx = c.getContext('2d');

  // Main structure
  ctx.fillStyle = '#4A5060';
  ctx.fillRect(0, 0, W, H);

  // Facade panels (darker/lighter alternating vertical strips)
  for (let x = 0; x < W; x += 8) {
    ctx.fillStyle = x % 16 === 0 ? '#505868' : '#444C58';
    ctx.fillRect(x, 0, 7, H);
  }

  // Windows grid — 6 columns × 14 rows
  const winW = 6, winH = 5, winGapX = 10, winGapY = 8, padX = 5, padY = 6;
  for (let row = 0; row < 14; row++) {
    for (let col = 0; col < 6; col++) {
      const wx = padX + col * winGapX;
      const wy = padY + row * winGapY;
      
      const r = Math.random();
      if (r > 0.6) {
        // Lit window — blue-white
        ctx.fillStyle = SP.window_lit;
        ctx.fillRect(wx, wy, winW, winH);
        // Inner glow
        ctx.fillStyle = '#AADDFF';
        ctx.globalAlpha = 0.3;
        ctx.fillRect(wx + 1, wy + 1, winW - 2, winH - 2);
        ctx.globalAlpha = 1;
        // Reflection highlight (top-left corner)
        ctx.fillStyle = '#CCEEFF';
        ctx.globalAlpha = 0.4;
        ctx.fillRect(wx, wy, 2, 1);
        ctx.globalAlpha = 1;
      } else if (r > 0.3) {
        // Warm lit
        ctx.fillStyle = SP.window_warm;
        ctx.fillRect(wx, wy, winW, winH);
        ctx.fillStyle = '#FFCC77';
        ctx.globalAlpha = 0.3;
        ctx.fillRect(wx + 1, wy + 1, winW - 2, winH - 2);
        ctx.globalAlpha = 1;
      } else {
        // Dark/unlit
        ctx.fillStyle = SP.window_dark;
        ctx.fillRect(wx, wy, winW, winH);
        // Faint reflection
        ctx.fillStyle = '#3A4048';
        ctx.fillRect(wx, wy, winW, 1);
      }
      // Window frame
      ctx.strokeStyle = '#3A3E48';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(wx - 0.5, wy - 0.5, winW + 1, winH + 1);
    }
  }

  // Roof edge
  ctx.fillStyle = '#3A3E48';
  ctx.fillRect(0, 0, W, 3);
  // Roof equipment
  ctx.fillStyle = '#404448';
  ctx.fillRect(8, 0, 10, 4);   // AC unit 1
  ctx.fillRect(44, 0, 8, 3);   // AC unit 2
  ctx.fillStyle = '#DD2222';
  ctx.fillRect(28, 0, 2, 2);   // Warning light
  ctx.fillStyle = '#FF4444';
  ctx.globalAlpha = 0.5;
  ctx.fillRect(27, 0, 4, 1);   // Light glow
  ctx.globalAlpha = 1;

  // Ground floor (darker, shop/entrance)
  ctx.fillStyle = '#363A42';
  ctx.fillRect(0, H - 12, W, 12);
  // Entrance
  ctx.fillStyle = '#88AACC';
  ctx.globalAlpha = 0.6;
  ctx.fillRect(24, H - 10, 16, 8);
  ctx.globalAlpha = 1;
  // Awning
  ctx.fillStyle = SP.tokamak_blue;
  ctx.fillRect(20, H - 12, 24, 3);

  // Edge shadow (right side, simulating depth)
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.fillRect(W - 2, 0, 2, H);

  save(c, 'objects', 'sprint', 'building_office.png');
}

// ============================================================
// 3. BUILDING — Commercial/Shop (48×64, lower with signage)
// ============================================================
function sprintBuildingShop() {
  const W = 48, H = 64;
  const c = createCanvas(W, H), ctx = c.getContext('2d');

  // Wall
  ctx.fillStyle = '#5A6068';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#626870';
  ctx.fillRect(1, 1, W - 2, H - 2);

  // Windows — 4 col × 5 row
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 4; col++) {
      const wx = 4 + col * 11;
      const wy = 12 + row * 10;
      const lit = Math.random() > 0.35;
      ctx.fillStyle = lit ? (Math.random() > 0.5 ? SP.window_lit : SP.window_warm) : SP.window_dark;
      ctx.fillRect(wx, wy, 8, 6);
      if (lit) {
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(wx, wy, 8, 1);
      }
    }
  }

  // Sign banner at top
  ctx.fillStyle = SP.tokamak_blue;
  ctx.fillRect(2, 2, W - 4, 8);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 6px monospace';
  ctx.fillText('TOKAMAK', 6, 8);

  // Ground floor shopfront
  ctx.fillStyle = '#88BBCC';
  ctx.globalAlpha = 0.5;
  ctx.fillRect(4, H - 14, 18, 12);
  ctx.fillRect(26, H - 14, 18, 12);
  ctx.globalAlpha = 1;
  // Door
  ctx.fillStyle = '#3A4048';
  ctx.fillRect(20, H - 14, 8, 12);

  // Edge detail
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.fillRect(W - 1, 0, 1, H);

  save(c, 'objects', 'sprint', 'building_shop.png');
}

// ============================================================
// 4. BUILDING — Apartment (56×96)
// ============================================================
function sprintBuildingApt() {
  const W = 56, H = 96;
  const c = createCanvas(W, H), ctx = c.getContext('2d');

  // Base structure with balcony recesses
  ctx.fillStyle = '#606870';
  ctx.fillRect(0, 0, W, H);

  // Balcony recesses (every other floor)
  for (let row = 0; row < 10; row++) {
    const wy = 6 + row * 9;
    if (row % 2 === 0) {
      ctx.fillStyle = '#505860';
      ctx.fillRect(2, wy, W - 4, 7);
    }
    // Windows per floor
    for (let col = 0; col < 5; col++) {
      const wx = 4 + col * 10;
      const lit = Math.random() > 0.3;
      ctx.fillStyle = lit ? (Math.random() > 0.5 ? SP.window_lit : SP.window_warm) : SP.window_dark;
      ctx.fillRect(wx, wy + 1, 7, 4);
      if (lit) {
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(wx, wy + 1, 3, 1);
      }
    }
    // Balcony railing (horizontal line)
    if (row % 2 === 0) {
      ctx.fillStyle = '#808890';
      ctx.fillRect(2, wy + 6, W - 4, 1);
    }
  }

  // Roof
  ctx.fillStyle = '#4A4E58';
  ctx.fillRect(0, 0, W, 4);
  // Water tank
  ctx.fillStyle = '#505458';
  ctx.fillRect(20, 0, 16, 5);
  ctx.fillStyle = '#5A5E68';
  ctx.fillRect(21, 0, 14, 3);

  // Ground floor
  ctx.fillStyle = '#444850';
  ctx.fillRect(0, H - 8, W, 8);
  ctx.fillStyle = '#505458';
  ctx.fillRect(22, H - 7, 12, 6); // entrance

  save(c, 'objects', 'sprint', 'building_apt.png');
}

// ============================================================
// 5. GRANDSTAND — Large structure (96×48, tiered with crowd)
// ============================================================
function sprintGrandstandLarge() {
  const W = 96, H = 48;
  const c = createCanvas(W, H), ctx = c.getContext('2d');

  // Steel frame structure
  const tiers = 5;
  const tierH = 7;
  for (let t = 0; t < tiers; t++) {
    const y = H - (t + 1) * tierH;
    const indent = t * 3;
    const tw = W - indent * 2;

    // Concrete tier
    ctx.fillStyle = t % 2 === 0 ? '#606468' : '#585C60';
    ctx.fillRect(indent, y, tw, tierH);
    // Top edge highlight
    ctx.fillStyle = '#6A6E72';
    ctx.fillRect(indent, y, tw, 1);
    // Front shadow
    ctx.fillStyle = '#4A4E52';
    ctx.fillRect(indent, y + tierH - 1, tw, 1);

    // Crowd seated on this tier
    const seatSpacing = 4;
    const numSeats = Math.floor((tw - 4) / seatSpacing);
    for (let s = 0; s < numSeats; s++) {
      const sx = indent + 2 + s * seatSpacing;
      const sy = y + 1;

      // Body (colored shirt)
      const color = SP.crowd[Math.floor(Math.random() * SP.crowd.length)];
      ctx.fillStyle = color;
      ctx.fillRect(sx, sy + 2, 3, 3);

      // Head (skin tone — varied)
      const skinTones = ['#E8C090','#D4A070','#F0D0A0','#C09060','#8A6040'];
      ctx.fillStyle = skinTones[Math.floor(Math.random() * skinTones.length)];
      ctx.fillRect(sx + 0.5, sy, 2, 2);

      // Hair (dark)
      ctx.fillStyle = Math.random() > 0.3 ? '#2A1A0A' : '#5A4A30';
      ctx.fillRect(sx + 0.5, sy, 2, 1);
    }
  }

  // Roof canopy
  ctx.fillStyle = '#3A3E44';
  ctx.fillRect(0, 0, W, 5);
  ctx.fillStyle = '#444850';
  ctx.fillRect(1, 1, W - 2, 3);
  // Support pillars
  ctx.fillStyle = '#505458';
  ctx.fillRect(3, 0, 2, H);
  ctx.fillRect(W - 5, 0, 2, H);
  ctx.fillRect(Math.floor(W/2) - 1, 0, 2, H);

  save(c, 'objects', 'sprint', 'grandstand_lg.png');
}

// ============================================================
// 6. BANNER ARCH (spans across road, 160×40)
// ============================================================
function sprintBannerArch() {
  const W = 160, H = 40;
  const c = createCanvas(W, H), ctx = c.getContext('2d');

  // Support pillars (left + right, bottom portion)
  ctx.fillStyle = '#606468';
  ctx.fillRect(0, 10, 8, 30);   // left
  ctx.fillRect(W - 8, 10, 8, 30); // right
  ctx.fillStyle = '#6A6E72';
  ctx.fillRect(1, 10, 6, 28);
  ctx.fillRect(W - 7, 10, 6, 28);

  // Cross beam (top)
  ctx.fillStyle = '#505458';
  ctx.fillRect(0, 6, W, 8);
  ctx.fillStyle = '#5A5E64';
  ctx.fillRect(1, 7, W - 2, 6);

  // Banner hanging from beam
  ctx.fillStyle = SP.tokamak_blue;
  ctx.fillRect(12, 8, W - 24, 18);
  // Banner border
  ctx.fillStyle = SP.tokamak_accent;
  ctx.fillRect(12, 8, W - 24, 2);
  ctx.fillRect(12, 24, W - 24, 2);

  // "TOKAMAK NETWORK" text
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('TOKAMAK NETWORK', W / 2, 21);

  // Logo placeholder (circle)
  ctx.fillStyle = SP.tokamak_accent;
  ctx.beginPath();
  ctx.arc(W / 2 - 50, 17, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(W / 2 + 50, 17, 5, 0, Math.PI * 2);
  ctx.fill();

  // Light fixtures hanging from beam
  ctx.fillStyle = '#FFEE88';
  ctx.globalAlpha = 0.7;
  for (let x = 20; x < W - 20; x += 14) {
    ctx.fillRect(x, 26, 3, 2);
    // Light glow
    ctx.globalAlpha = 0.15;
    ctx.beginPath();
    ctx.ellipse(x + 1.5, 30, 5, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.7;
  }
  ctx.globalAlpha = 1;

  save(c, 'objects', 'sprint', 'banner_arch.png');
}

// ============================================================
// 7. CONCRETE BARRIER — Jersey wall (64×20, detailed)
// ============================================================
function sprintJerseyBarrier() {
  const W = 64, H = 20;
  const c = createCanvas(W, H), ctx = c.getContext('2d');

  // Jersey barrier profile (trapezoidal)
  ctx.fillStyle = SP.concrete;
  ctx.beginPath();
  ctx.moveTo(0, H);
  ctx.lineTo(2, 4);
  ctx.lineTo(W - 2, 4);
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fill();

  // Top surface
  ctx.fillStyle = SP.concreteL;
  ctx.fillRect(2, 4, W - 4, 3);

  // Front face gradient
  ctx.fillStyle = SP.concreteD;
  ctx.fillRect(3, H - 4, W - 6, 4);

  // Red-white stripe
  for (let x = 0; x < W; x += 8) {
    ctx.fillStyle = (x / 8) % 2 === 0 ? SP.curb_r : SP.curb_w;
    ctx.fillRect(x + 2, 8, 7, 4);
  }

  // Scuffs/wear
  noise(ctx, 3, 5, W - 6, H - 8, ['rgba(0,0,0,0.08)', 'rgba(255,255,255,0.04)'], 0.1);

  // Joint lines (vertical seams between segments)
  ctx.fillStyle = '#5A5E64';
  ctx.fillRect(31, 4, 1, H - 4);

  save(c, 'objects', 'sprint', 'jersey_barrier.png');
}

// ============================================================
// 8. CATCH FENCE (64×32, chain-link on poles)
// ============================================================
function sprintCatchFence() {
  const W = 64, H = 32;
  const c = createCanvas(W, H), ctx = c.getContext('2d');

  // Poles
  for (let x = 0; x < W; x += 16) {
    ctx.fillStyle = SP.metalD;
    ctx.fillRect(x, 0, 3, H);
    ctx.fillStyle = SP.metal;
    ctx.fillRect(x + 1, 0, 1, H);
  }

  // Chain-link mesh
  ctx.strokeStyle = '#808488';
  ctx.lineWidth = 0.5;
  ctx.globalAlpha = 0.6;
  for (let x = -H; x < W + H; x += 4) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + H, H);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + H, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Top rail
  ctx.fillStyle = SP.metalD;
  ctx.fillRect(0, 0, W, 2);
  ctx.fillStyle = SP.metal;
  ctx.fillRect(0, 0, W, 1);

  save(c, 'objects', 'sprint', 'catch_fence.png');
}

// ============================================================
// 9. STREET LIGHT (12×48, tall lamp post)
// ============================================================
function sprintStreetLight() {
  const W = 16, H = 52;
  const c = createCanvas(W, H), ctx = c.getContext('2d');

  // Pole
  ctx.fillStyle = '#606468';
  ctx.fillRect(7, 12, 3, 38);
  ctx.fillStyle = '#6A6E72';
  ctx.fillRect(8, 12, 1, 38);

  // Base plate
  ctx.fillStyle = '#505458';
  ctx.fillRect(4, 48, 9, 4);
  ctx.fillStyle = '#5A5E64';
  ctx.fillRect(5, 48, 7, 2);

  // Lamp arm (horizontal)
  ctx.fillStyle = '#606468';
  ctx.fillRect(4, 10, 12, 2);
  // Lamp head
  ctx.fillStyle = '#707478';
  ctx.fillRect(2, 6, 6, 5);
  ctx.fillRect(10, 6, 6, 5);

  // Light (warm glow)
  ctx.fillStyle = '#FFEE88';
  ctx.fillRect(3, 10, 4, 2);
  ctx.fillRect(11, 10, 4, 2);

  // Light cone glow
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = '#FFEE88';
  ctx.beginPath();
  ctx.moveTo(3, 12); ctx.lineTo(-2, 30); ctx.lineTo(9, 30); ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(11, 12); ctx.lineTo(7, 30); ctx.lineTo(18, 30); ctx.closePath(); ctx.fill();
  ctx.globalAlpha = 1;

  save(c, 'objects', 'sprint', 'street_light.png');
}

// ============================================================
// 10. TIRE STACK (24×16, colored tire wall)
// ============================================================
function sprintTireStack() {
  const W = 28, H = 18;
  const c = createCanvas(W, H), ctx = c.getContext('2d');

  // Bottom row (3 tires)
  for (let i = 0; i < 3; i++) {
    const tx = 2 + i * 9;
    ctx.fillStyle = '#1A1A1E';
    ctx.beginPath(); ctx.ellipse(tx + 4, 12, 5, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2A2A2E';
    ctx.beginPath(); ctx.ellipse(tx + 4, 12, 3.5, 3.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0E0E12';
    ctx.beginPath(); ctx.ellipse(tx + 4, 12, 1.5, 1.5, 0, 0, Math.PI * 2); ctx.fill();
  }
  // Top row (2 tires)
  for (let i = 0; i < 2; i++) {
    const tx = 6 + i * 9;
    ctx.fillStyle = '#1A1A1E';
    ctx.beginPath(); ctx.ellipse(tx + 4, 5, 5, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2A2A2E';
    ctx.beginPath(); ctx.ellipse(tx + 4, 5, 3.5, 3.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0E0E12';
    ctx.beginPath(); ctx.ellipse(tx + 4, 5, 1.5, 1.5, 0, 0, Math.PI * 2); ctx.fill();
  }

  // Color stripe (alternating red/white painted on)
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = '#DD2222';
  ctx.fillRect(0, 9, W, 2);
  ctx.fillStyle = '#EEEEEE';
  ctx.fillRect(0, 11, W, 1);
  ctx.fillStyle = '#DD2222';
  ctx.fillRect(0, 2, W, 2);
  ctx.globalAlpha = 1;

  save(c, 'objects', 'sprint', 'tire_stack.png');
}

// ============================================================
// 11. CURB STRIP (tileable, 128×8)
// ============================================================
function sprintCurbStrip() {
  const W = 128, H = 8;
  const c = createCanvas(W, H), ctx = c.getContext('2d');

  for (let x = 0; x < W; x += 8) {
    ctx.fillStyle = (x / 8) % 2 === 0 ? SP.curb_r : SP.curb_w;
    ctx.fillRect(x, 0, 8, H);
  }
  // Top highlight
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fillRect(0, 0, W, 1);
  // Bottom shadow
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.fillRect(0, H - 1, W, 1);

  save(c, 'objects', 'sprint', 'curb_strip.png');
}

// ============================================================
// RUN
// ============================================================
console.log('Sprint Zone Rework — generating high-detail assets...\n');

sprintRoadTile();
sprintBuildingOffice();
sprintBuildingShop();
sprintBuildingApt();
sprintGrandstandLarge();
sprintBannerArch();
sprintJerseyBarrier();
sprintCatchFence();
sprintStreetLight();
sprintTireStack();
sprintCurbStrip();

console.log('\n✅ Sprint rework: 11 high-detail assets generated.');
