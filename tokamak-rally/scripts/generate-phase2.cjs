/**
 * Phase 2: All zone objects — programmatic pixel art
 * Every object uses its zone's v3 background palette for base/shadow/blending
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

// ============================================================
// ZONE PALETTES (extracted from v3 bg tiles)
// ============================================================
const PAL = {
  desert: {
    bg1: '#D4A574', bg2: '#C99B68', bg3: '#BF8F5C', bg4: '#B8864E',
    shadow: '#8B7355', dark: '#7A6245',
  },
  canyon: {
    bg1: '#8B5E3C', bg2: '#A0522D', bg3: '#6B4423', bg4: '#7A5033',
    shadow: '#3E2415', dark: '#5C3A1E',
  },
  riverbed: {
    bg1: '#4A7A3A', bg2: '#3D6B2E', bg3: '#5A8A48', bg4: '#6B9B55',
    shadow: '#2E5A1E', dark: '#1A4A12',
  },
  mountain: {
    bg1: '#E8EEF0', bg2: '#D0DCE0', bg3: '#C8D8E0', bg4: '#B8C8D4',
    shadow: '#708090', dark: '#5F6B7A',
  },
  sprint: {
    bg1: '#3A3A3A', bg2: '#333333', bg3: '#404040', bg4: '#4A4A4A',
    shadow: '#252525', dark: '#1A1A1A',
  },
};

function hex(s) {
  const m = s.match(/^#(..)(..)(..)$/);
  return [parseInt(m[1],16), parseInt(m[2],16), parseInt(m[3],16)];
}

function rgb(r,g,b) { return `rgb(${r},${g},${b})`; }

function blend(c1hex, c2hex, t) {
  const [r1,g1,b1] = hex(c1hex);
  const [r2,g2,b2] = hex(c2hex);
  return rgb(
    Math.round(r1+(r2-r1)*t),
    Math.round(g1+(g2-g1)*t),
    Math.round(b1+(b2-b1)*t)
  );
}

// Draw ground shadow ellipse blended with zone bg
function groundShadow(ctx, cx, cy, rx, ry, zoneBg) {
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = blend(zoneBg, '#000000', 0.3);
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.15;
  ctx.fillStyle = blend(zoneBg, '#000000', 0.15);
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx + 2, ry + 1, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Edge blending: 1px semi-transparent zone bg color around edges
function edgeBlend(ctx, w, h, zoneBg) {
  const id = ctx.getImageData(0, 0, w, h);
  const d = id.data;
  const [br, bg, bb] = hex(zoneBg);
  const copy = new Uint8ClampedArray(d);

  for (let y = 1; y < h-1; y++) {
    for (let x = 1; x < w-1; x++) {
      const i = (y * w + x) * 4;
      if (copy[i+3] > 0) { // pixel has content
        // Check if any neighbor is transparent
        const neighbors = [
          ((y-1)*w+x)*4, ((y+1)*w+x)*4,
          (y*w+x-1)*4, (y*w+x+1)*4
        ];
        for (const ni of neighbors) {
          if (copy[ni+3] === 0) {
            // This is an edge pixel — blend toward bg
            d[i] = Math.round(d[i] * 0.7 + br * 0.3);
            d[i+1] = Math.round(d[i+1] * 0.7 + bg * 0.3);
            d[i+2] = Math.round(d[i+2] * 0.7 + bb * 0.3);
            break;
          }
        }
      }
    }
  }
  ctx.putImageData(id, 0, 0);
}

// ============================================================
// DESERT OBJECTS
// ============================================================

function desertCactus() {
  const W = 28, H = 44;
  const c = createCanvas(W, H), ctx = c.getContext('2d');
  const P = PAL.desert;

  // Ground shadow
  groundShadow(ctx, 14, 40, 10, 4, P.bg1);

  // Trunk
  const trunk = '#2D7A3E';
  const trunkD = '#1A5E2A';
  const trunkL = '#40A055';
  const trunkH = '#55BB68';

  // Main trunk
  ctx.fillStyle = trunkD; ctx.fillRect(11, 10, 6, 28);
  ctx.fillStyle = trunk; ctx.fillRect(12, 10, 4, 28);
  ctx.fillStyle = trunkL; ctx.fillRect(13, 10, 2, 28);
  ctx.fillStyle = trunkH; ctx.fillRect(13, 12, 1, 20);

  // Left arm
  ctx.fillStyle = trunkD; ctx.fillRect(5, 16, 6, 4);
  ctx.fillStyle = trunk; ctx.fillRect(5, 17, 6, 2);
  ctx.fillStyle = trunkD; ctx.fillRect(5, 12, 4, 5);
  ctx.fillStyle = trunk; ctx.fillRect(6, 12, 2, 5);
  ctx.fillStyle = trunkL; ctx.fillRect(6, 13, 1, 3);

  // Right arm
  ctx.fillStyle = trunkD; ctx.fillRect(17, 20, 6, 4);
  ctx.fillStyle = trunk; ctx.fillRect(17, 21, 6, 2);
  ctx.fillStyle = trunkD; ctx.fillRect(19, 16, 4, 5);
  ctx.fillStyle = trunk; ctx.fillRect(20, 16, 2, 5);
  ctx.fillStyle = trunkL; ctx.fillRect(20, 17, 1, 3);

  // Top
  ctx.fillStyle = trunk; ctx.fillRect(12, 8, 4, 3);
  ctx.fillStyle = trunkL; ctx.fillRect(13, 7, 2, 2);
  ctx.fillStyle = trunkH; ctx.fillRect(13, 7, 1, 1);

  // Spines (tiny dots)
  ctx.fillStyle = '#8BC89A';
  [[10,14],[16,14],[10,22],[16,22],[10,30],[16,30],
   [4,14],[8,14],[18,20],[24,20],[20,18],[6,18]].forEach(([x,y]) => {
    ctx.fillRect(x, y, 1, 1);
  });

  // Base blending: 2px at bottom fading to bg
  ctx.fillStyle = blend(P.bg1, trunkD, 0.5);
  ctx.fillRect(11, 37, 6, 1);
  ctx.fillStyle = blend(P.bg1, trunkD, 0.3);
  ctx.fillRect(10, 38, 8, 1);

  edgeBlend(ctx, W, H, P.bg1);
  save(c, 'objects', 'desert', 'cactus.png');
}

function desertRockSm() {
  const W = 24, H = 20;
  const c = createCanvas(W, H), ctx = c.getContext('2d');
  const P = PAL.desert;
  groundShadow(ctx, 12, 16, 9, 3, P.bg1);

  // Rock body — desert-toned
  ctx.fillStyle = '#A08860'; ctx.beginPath();
  ctx.moveTo(4, 15); ctx.lineTo(6, 6); ctx.lineTo(12, 3);
  ctx.lineTo(18, 5); ctx.lineTo(20, 14); ctx.closePath(); ctx.fill();
  // Highlight
  ctx.fillStyle = '#B8A070';
  ctx.beginPath();
  ctx.moveTo(8, 12); ctx.lineTo(10, 5); ctx.lineTo(14, 4);
  ctx.lineTo(16, 8); ctx.closePath(); ctx.fill();
  // Dark crack
  ctx.strokeStyle = '#7A6840'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(10, 6); ctx.lineTo(12, 12); ctx.stroke();
  // Top highlight pixel
  ctx.fillStyle = '#C8B880'; ctx.fillRect(11, 3, 2, 1);

  edgeBlend(ctx, W, H, P.bg1);
  save(c, 'objects', 'desert', 'rock_sm.png');
}

function desertRockLg() {
  const W = 44, H = 36;
  const c = createCanvas(W, H), ctx = c.getContext('2d');
  const P = PAL.desert;
  groundShadow(ctx, 22, 32, 18, 4, P.bg1);

  // Large rock cluster
  const colors = ['#9A8058', '#8A7048', '#7A6038', '#A89068', '#B8A078'];
  // Main mass
  ctx.fillStyle = colors[0];
  ctx.beginPath();
  ctx.moveTo(4, 30); ctx.lineTo(6, 12); ctx.lineTo(15, 5);
  ctx.lineTo(28, 3); ctx.lineTo(38, 8); ctx.lineTo(40, 28);
  ctx.closePath(); ctx.fill();

  // Layer highlights
  ctx.fillStyle = colors[3];
  ctx.beginPath();
  ctx.moveTo(10, 25); ctx.lineTo(12, 10); ctx.lineTo(22, 5);
  ctx.lineTo(32, 7); ctx.lineTo(34, 20); ctx.closePath(); ctx.fill();

  ctx.fillStyle = colors[4];
  ctx.beginPath();
  ctx.moveTo(16, 18); ctx.lineTo(18, 8); ctx.lineTo(26, 6);
  ctx.lineTo(30, 12); ctx.closePath(); ctx.fill();

  // Dark crevices
  ctx.strokeStyle = '#5A4828'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(15, 8); ctx.lineTo(18, 22); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(30, 10); ctx.lineTo(32, 24); ctx.stroke();

  // Strata lines
  ctx.strokeStyle = '#8A7850'; ctx.lineWidth = 0.5;
  for (let y = 10; y < 28; y += 5) {
    ctx.beginPath(); ctx.moveTo(6, y); ctx.lineTo(38, y + 2); ctx.stroke();
  }

  edgeBlend(ctx, W, H, P.bg1);
  save(c, 'objects', 'desert', 'rock_lg.png');
}

function desertScrub() {
  const W = 18, H = 14;
  const c = createCanvas(W, H), ctx = c.getContext('2d');
  const P = PAL.desert;
  groundShadow(ctx, 9, 12, 6, 2, P.bg1);

  // Dry scrub — muted yellow-green
  const cols = ['#8A8A30', '#7A7A28', '#9A9A3A', '#6A6A20'];
  for (let i = 0; i < 12; i++) {
    ctx.fillStyle = cols[i % cols.length];
    const x = 3 + Math.cos(i * 0.8) * 5 + Math.random() * 3;
    const y = 4 + Math.sin(i * 1.2) * 3 + Math.random() * 2;
    ctx.fillRect(x, y, 2, 2);
  }
  // Stem
  ctx.fillStyle = '#6A5020';
  ctx.fillRect(8, 9, 2, 3);

  edgeBlend(ctx, W, H, P.bg1);
  save(c, 'objects', 'desert', 'scrub.png');
}

function desertHut() {
  const W = 36, H = 32;
  const c = createCanvas(W, H), ctx = c.getContext('2d');
  const P = PAL.desert;
  groundShadow(ctx, 18, 28, 14, 4, P.bg1);

  // Mud hut — desert palette
  // Walls
  ctx.fillStyle = '#B89868'; ctx.fillRect(6, 12, 24, 16);
  ctx.fillStyle = '#C8A878'; ctx.fillRect(7, 12, 22, 14);
  // Roof (thatched)
  ctx.fillStyle = '#8A7040';
  ctx.beginPath();
  ctx.moveTo(2, 14); ctx.lineTo(18, 4); ctx.lineTo(34, 14); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#9A8050';
  ctx.beginPath();
  ctx.moveTo(4, 14); ctx.lineTo(18, 6); ctx.lineTo(32, 14); ctx.closePath(); ctx.fill();
  // Thatch texture
  ctx.strokeStyle = '#7A6030'; ctx.lineWidth = 0.5;
  for (let x = 6; x < 30; x += 3) {
    ctx.beginPath(); ctx.moveTo(x, 13); ctx.lineTo(18, 5 + Math.random()); ctx.stroke();
  }
  // Door
  ctx.fillStyle = '#5A4020'; ctx.fillRect(15, 18, 6, 10);
  ctx.fillStyle = '#4A3018'; ctx.fillRect(16, 19, 4, 8);
  // Window
  ctx.fillStyle = '#3A2818'; ctx.fillRect(24, 16, 4, 4);

  // Base blending
  ctx.fillStyle = blend(P.bg1, '#B89868', 0.4);
  ctx.fillRect(5, 27, 26, 1);

  edgeBlend(ctx, W, H, P.bg1);
  save(c, 'objects', 'desert', 'hut.png');
}

function desertCow() {
  const W = 22, H = 18;
  const c = createCanvas(W, H), ctx = c.getContext('2d');
  const P = PAL.desert;
  groundShadow(ctx, 11, 15, 8, 2, P.bg1);

  // Top-down cow
  const body = '#E8DCC0';
  const spots = '#6A4A2A';
  const head = '#D8CCB0';

  // Body oval
  ctx.fillStyle = body;
  ctx.beginPath(); ctx.ellipse(11, 10, 8, 5, 0, 0, Math.PI * 2); ctx.fill();
  // Spots
  ctx.fillStyle = spots;
  ctx.fillRect(6, 8, 4, 3); ctx.fillRect(14, 9, 3, 3); ctx.fillRect(10, 6, 3, 2);
  // Head
  ctx.fillStyle = head;
  ctx.beginPath(); ctx.ellipse(11, 4, 3, 2.5, 0, 0, Math.PI * 2); ctx.fill();
  // Ears
  ctx.fillStyle = '#C8B8A0'; ctx.fillRect(7, 3, 2, 1); ctx.fillRect(13, 3, 2, 1);
  // Legs (tiny)
  ctx.fillStyle = '#C8B8A0';
  ctx.fillRect(5, 14, 2, 2); ctx.fillRect(15, 14, 2, 2);
  ctx.fillRect(8, 14, 2, 2); ctx.fillRect(12, 14, 2, 2);
  // Tail
  ctx.fillStyle = '#A8986A'; ctx.fillRect(10, 14, 1, 3);

  edgeBlend(ctx, W, H, P.bg1);
  save(c, 'objects', 'desert', 'cow.png');
}

function desertFence() {
  const W = 48, H = 14;
  const c = createCanvas(W, H), ctx = c.getContext('2d');
  const P = PAL.desert;

  // Wooden fence posts + rails
  const wood = '#8A6A3A'; const woodL = '#A08050'; const woodD = '#6A4A20';
  // Posts
  for (let x = 0; x < 48; x += 12) {
    ctx.fillStyle = woodD; ctx.fillRect(x, 2, 3, 12);
    ctx.fillStyle = wood; ctx.fillRect(x+1, 2, 1, 12);
  }
  // Rails
  ctx.fillStyle = wood; ctx.fillRect(0, 4, 48, 2);
  ctx.fillStyle = woodL; ctx.fillRect(0, 4, 48, 1);
  ctx.fillStyle = wood; ctx.fillRect(0, 9, 48, 2);
  ctx.fillStyle = woodL; ctx.fillRect(0, 9, 48, 1);

  // Ground blend
  ctx.fillStyle = blend(P.bg1, woodD, 0.3);
  ctx.fillRect(0, 13, 48, 1);

  save(c, 'objects', 'desert', 'fence.png');
}

function desertSkull() {
  const W = 14, H = 12;
  const c = createCanvas(W, H), ctx = c.getContext('2d');
  const P = PAL.desert;
  groundShadow(ctx, 7, 10, 5, 2, P.bg1);

  ctx.fillStyle = '#E8DCC8';
  ctx.beginPath(); ctx.ellipse(7, 5, 5, 4, 0, 0, Math.PI * 2); ctx.fill();
  // Eye sockets
  ctx.fillStyle = '#4A3A28'; ctx.fillRect(4, 4, 2, 2); ctx.fillRect(8, 4, 2, 2);
  // Jaw
  ctx.fillStyle = '#D0C4B0'; ctx.fillRect(5, 8, 4, 2);
  ctx.fillStyle = '#4A3A28'; ctx.fillRect(6, 8, 1, 1); ctx.fillRect(8, 8, 1, 1);

  edgeBlend(ctx, W, H, P.bg1);
  save(c, 'objects', 'desert', 'skull.png');
}

// ============================================================
// CANYON OBJECTS
// ============================================================

function canyonCliff() {
  const W = 52, H = 68;
  const c = createCanvas(W, H), ctx = c.getContext('2d');
  const P = PAL.canyon;
  groundShadow(ctx, 26, 64, 22, 5, P.bg1);

  // Large cliff face
  const layers = ['#8B5E3C','#7A4E2C','#6B4423','#A0522D','#9A6A40','#5C3A1E'];
  // Main body
  ctx.fillStyle = layers[0];
  ctx.beginPath();
  ctx.moveTo(4, 64); ctx.lineTo(8, 10); ctx.lineTo(20, 2);
  ctx.lineTo(36, 4); ctx.lineTo(46, 12); ctx.lineTo(48, 62);
  ctx.closePath(); ctx.fill();

  // Strata
  for (let y = 8; y < 60; y += 6) {
    ctx.fillStyle = layers[Math.floor(Math.random() * layers.length)];
    ctx.globalAlpha = 0.4;
    ctx.fillRect(6, y, 40, 3);
  }
  ctx.globalAlpha = 1;

  // Highlight face
  ctx.fillStyle = '#B07548';
  ctx.globalAlpha = 0.3;
  ctx.beginPath();
  ctx.moveTo(12, 56); ctx.lineTo(16, 8); ctx.lineTo(30, 5);
  ctx.lineTo(38, 14); ctx.lineTo(36, 50); ctx.closePath(); ctx.fill();
  ctx.globalAlpha = 1;

  // Cracks
  ctx.strokeStyle = P.shadow; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(20, 10); ctx.lineTo(24, 40); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(34, 15); ctx.lineTo(30, 50); ctx.stroke();

  edgeBlend(ctx, W, H, P.bg1);
  save(c, 'objects', 'canyon', 'cliff.png');
}

function canyonPillar() {
  const W = 22, H = 52;
  const c = createCanvas(W, H), ctx = c.getContext('2d');
  const P = PAL.canyon;
  groundShadow(ctx, 11, 48, 9, 3, P.bg1);

  ctx.fillStyle = '#7A5033'; ctx.fillRect(5, 6, 12, 42);
  ctx.fillStyle = '#8B5E3C'; ctx.fillRect(6, 6, 10, 40);
  ctx.fillStyle = '#9A6A42'; ctx.fillRect(7, 6, 6, 38);
  // Cap
  ctx.fillStyle = '#6B4423'; ctx.fillRect(3, 4, 16, 4);
  ctx.fillStyle = '#8B5E3C'; ctx.fillRect(4, 2, 14, 3);
  // Strata
  ctx.strokeStyle = '#5C3A1E'; ctx.lineWidth = 0.5;
  for (let y = 10; y < 46; y += 5) {
    ctx.beginPath(); ctx.moveTo(5, y); ctx.lineTo(17, y+1); ctx.stroke();
  }

  edgeBlend(ctx, W, H, P.bg1);
  save(c, 'objects', 'canyon', 'pillar.png');
}

function canyonDebris() {
  const W = 28, H = 16;
  const c = createCanvas(W, H), ctx = c.getContext('2d');
  const P = PAL.canyon;
  groundShadow(ctx, 14, 13, 10, 3, P.bg1);

  const cols = ['#8B5E3C','#7A4E2C','#6B4423','#9A6A40'];
  // Scattered rocks
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = cols[i % cols.length];
    const x = 3 + i * 4 + Math.random() * 2;
    const y = 4 + Math.random() * 5;
    const r = 2 + Math.random() * 2;
    ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.7, 0, 0, Math.PI * 2); ctx.fill();
  }

  edgeBlend(ctx, W, H, P.bg1);
  save(c, 'objects', 'canyon', 'debris.png');
}

function canyonArch() {
  const W = 60, H = 44;
  const c = createCanvas(W, H), ctx = c.getContext('2d');
  const P = PAL.canyon;
  groundShadow(ctx, 30, 40, 24, 4, P.bg1);

  // Left pillar
  ctx.fillStyle = '#7A5033'; ctx.fillRect(4, 8, 12, 32);
  ctx.fillStyle = '#8B5E3C'; ctx.fillRect(5, 8, 10, 30);
  // Right pillar
  ctx.fillStyle = '#7A5033'; ctx.fillRect(44, 8, 12, 32);
  ctx.fillStyle = '#8B5E3C'; ctx.fillRect(45, 8, 10, 30);
  // Arch top
  ctx.fillStyle = '#6B4423';
  ctx.beginPath();
  ctx.moveTo(4, 10); ctx.quadraticCurveTo(30, -4, 56, 10);
  ctx.lineTo(56, 16); ctx.quadraticCurveTo(30, 4, 4, 16);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#8B5E3C';
  ctx.beginPath();
  ctx.moveTo(6, 12); ctx.quadraticCurveTo(30, 0, 54, 12);
  ctx.lineTo(54, 15); ctx.quadraticCurveTo(30, 4, 6, 15);
  ctx.closePath(); ctx.fill();

  edgeBlend(ctx, W, H, P.bg1);
  save(c, 'objects', 'canyon', 'arch.png');
}

function canyonBush() {
  const W = 18, H = 14;
  const c = createCanvas(W, H), ctx = c.getContext('2d');
  const P = PAL.canyon;
  groundShadow(ctx, 9, 12, 6, 2, P.bg1);

  // Dry brown-green bush
  const cols = ['#6A6A28','#5A5A20','#7A7A30','#4A4A18'];
  for (let i = 0; i < 10; i++) {
    ctx.fillStyle = cols[i % cols.length];
    const x = 3 + Math.cos(i * 0.9) * 4 + Math.random() * 3;
    const y = 3 + Math.sin(i * 1.3) * 3 + Math.random() * 2;
    ctx.fillRect(x, y, 2 + (i%3===0?1:0), 2);
  }
  ctx.fillStyle = '#5A3A18'; ctx.fillRect(8, 10, 2, 2);

  edgeBlend(ctx, W, H, P.bg1);
  save(c, 'objects', 'canyon', 'bush.png');
}

// ============================================================
// RIVERBED OBJECTS
// ============================================================

function riverbedTree() {
  const W = 32, H = 42;
  const c = createCanvas(W, H), ctx = c.getContext('2d');
  const P = PAL.riverbed;
  groundShadow(ctx, 16, 38, 12, 4, P.bg1);

  // Trunk
  ctx.fillStyle = '#5A3A18'; ctx.fillRect(14, 22, 5, 16);
  ctx.fillStyle = '#6A4A28'; ctx.fillRect(15, 22, 3, 16);
  ctx.fillStyle = '#7A5A38'; ctx.fillRect(15, 24, 1, 10);
  // Canopy layers
  const greens = ['#2A6A3A','#3A8A4A','#4A9A5A','#5AAA6A','#2A5A2A'];
  ctx.fillStyle = greens[4];
  ctx.beginPath(); ctx.ellipse(16, 14, 14, 12, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = greens[0];
  ctx.beginPath(); ctx.ellipse(16, 12, 12, 10, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = greens[1];
  ctx.beginPath(); ctx.ellipse(14, 11, 8, 7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = greens[2];
  ctx.beginPath(); ctx.ellipse(15, 9, 5, 4, 0, 0, Math.PI * 2); ctx.fill();
  // Light dapples
  ctx.fillStyle = greens[3]; ctx.globalAlpha = 0.4;
  ctx.fillRect(10, 8, 3, 2); ctx.fillRect(18, 12, 2, 2); ctx.fillRect(12, 15, 3, 2);
  ctx.globalAlpha = 1;

  edgeBlend(ctx, W, H, P.bg1);
  save(c, 'objects', 'riverbed', 'tree.png');
}

function riverbedBush() {
  const W = 18, H = 16;
  const c = createCanvas(W, H), ctx = c.getContext('2d');
  const P = PAL.riverbed;
  groundShadow(ctx, 9, 13, 7, 2, P.bg1);

  const greens = ['#3A7A4A','#4A8A5A','#5A9A6A','#2A6A3A'];
  ctx.fillStyle = greens[3];
  ctx.beginPath(); ctx.ellipse(9, 8, 7, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = greens[0];
  ctx.beginPath(); ctx.ellipse(9, 7, 6, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = greens[1];
  ctx.beginPath(); ctx.ellipse(8, 6, 4, 3, 0, 0, Math.PI * 2); ctx.fill();
  // Light spots
  ctx.fillStyle = greens[2]; ctx.globalAlpha = 0.5;
  ctx.fillRect(6, 5, 2, 2); ctx.fillRect(10, 7, 2, 1);
  ctx.globalAlpha = 1;

  edgeBlend(ctx, W, H, P.bg1);
  save(c, 'objects', 'riverbed', 'bush.png');
}

function riverbedReeds() {
  const W = 14, H = 24;
  const c = createCanvas(W, H), ctx = c.getContext('2d');
  const P = PAL.riverbed;

  const cols = ['#5A8A3A','#4A7A2A','#6A9A4A','#3A6A1A'];
  // Reeds
  for (let i = 0; i < 5; i++) {
    ctx.strokeStyle = cols[i % cols.length]; ctx.lineWidth = 1.5;
    const x = 3 + i * 2;
    ctx.beginPath();
    ctx.moveTo(x, 22);
    ctx.quadraticCurveTo(x + Math.sin(i) * 2, 12, x + Math.sin(i*1.5) * 3, 2);
    ctx.stroke();
    // Tip
    ctx.fillStyle = '#8AAA5A';
    ctx.fillRect(x + Math.sin(i*1.5) * 3 - 0.5, 1, 2, 2);
  }
  // Base water
  ctx.fillStyle = blend(P.bg1, '#4A7090', 0.3);
  ctx.globalAlpha = 0.4;
  ctx.fillRect(0, 20, 14, 4);
  ctx.globalAlpha = 1;

  save(c, 'objects', 'riverbed', 'reeds.png');
}

function riverbedBoulder() {
  const W = 24, H = 20;
  const c = createCanvas(W, H), ctx = c.getContext('2d');
  const P = PAL.riverbed;
  groundShadow(ctx, 12, 16, 9, 3, P.bg1);

  // Grey-green mossy boulder
  ctx.fillStyle = '#7A7A6A';
  ctx.beginPath();
  ctx.moveTo(4, 16); ctx.lineTo(6, 6); ctx.lineTo(12, 3);
  ctx.lineTo(18, 5); ctx.lineTo(20, 15); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#8A8A7A';
  ctx.beginPath();
  ctx.moveTo(8, 13); ctx.lineTo(10, 5); ctx.lineTo(15, 4);
  ctx.lineTo(17, 10); ctx.closePath(); ctx.fill();
  // Moss
  ctx.fillStyle = '#4A7A3A'; ctx.globalAlpha = 0.5;
  ctx.fillRect(6, 10, 4, 3); ctx.fillRect(14, 8, 3, 3);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#9A9A8A'; ctx.fillRect(11, 3, 2, 1);

  edgeBlend(ctx, W, H, P.bg1);
  save(c, 'objects', 'riverbed', 'boulder.png');
}

function riverbedBridge() {
  const W = 64, H = 24;
  const c = createCanvas(W, H), ctx = c.getContext('2d');
  const P = PAL.riverbed;

  const wood = '#7A5A30'; const woodD = '#5A3A18'; const woodL = '#9A7A48';
  // Planks
  for (let x = 0; x < 64; x += 8) {
    ctx.fillStyle = x % 16 === 0 ? wood : woodD;
    ctx.fillRect(x, 6, 7, 12);
    ctx.fillStyle = woodL;
    ctx.fillRect(x + 1, 7, 5, 1);
  }
  // Rails
  ctx.fillStyle = woodD; ctx.fillRect(0, 4, 64, 3);
  ctx.fillStyle = woodL; ctx.fillRect(0, 4, 64, 1);
  ctx.fillStyle = woodD; ctx.fillRect(0, 17, 64, 3);
  ctx.fillStyle = woodL; ctx.fillRect(0, 17, 64, 1);
  // Posts
  for (let x = 0; x < 64; x += 16) {
    ctx.fillStyle = woodD; ctx.fillRect(x, 2, 3, 20);
    ctx.fillStyle = wood; ctx.fillRect(x+1, 2, 1, 20);
  }

  save(c, 'objects', 'riverbed', 'bridge.png');
}

// ============================================================
// MOUNTAIN OBJECTS
// ============================================================

function mountainPine() {
  const W = 26, H = 42;
  const c = createCanvas(W, H), ctx = c.getContext('2d');
  const P = PAL.mountain;
  groundShadow(ctx, 13, 38, 10, 3, P.bg1);

  // Trunk
  ctx.fillStyle = '#5A3A18'; ctx.fillRect(11, 28, 4, 10);
  ctx.fillStyle = '#6A4A28'; ctx.fillRect(12, 28, 2, 10);
  // Snow-dusted evergreen layers
  const green = '#1A4A25'; const greenL = '#2A6A35'; const snow = '#E8F0F4';
  // Layer 1 (top)
  ctx.fillStyle = green;
  ctx.beginPath(); ctx.moveTo(13, 4); ctx.lineTo(7, 14); ctx.lineTo(19, 14); ctx.closePath(); ctx.fill();
  ctx.fillStyle = snow; ctx.globalAlpha = 0.4;
  ctx.beginPath(); ctx.moveTo(13, 4); ctx.lineTo(9, 10); ctx.lineTo(17, 10); ctx.closePath(); ctx.fill();
  ctx.globalAlpha = 1;
  // Layer 2
  ctx.fillStyle = green;
  ctx.beginPath(); ctx.moveTo(13, 10); ctx.lineTo(4, 22); ctx.lineTo(22, 22); ctx.closePath(); ctx.fill();
  ctx.fillStyle = greenL; ctx.globalAlpha = 0.5;
  ctx.beginPath(); ctx.moveTo(13, 12); ctx.lineTo(8, 19); ctx.lineTo(18, 19); ctx.closePath(); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = snow; ctx.globalAlpha = 0.3;
  ctx.beginPath(); ctx.moveTo(13, 10); ctx.lineTo(7, 16); ctx.lineTo(19, 16); ctx.closePath(); ctx.fill();
  ctx.globalAlpha = 1;
  // Layer 3
  ctx.fillStyle = green;
  ctx.beginPath(); ctx.moveTo(13, 18); ctx.lineTo(2, 30); ctx.lineTo(24, 30); ctx.closePath(); ctx.fill();
  ctx.fillStyle = snow; ctx.globalAlpha = 0.25;
  ctx.beginPath(); ctx.moveTo(13, 18); ctx.lineTo(5, 24); ctx.lineTo(21, 24); ctx.closePath(); ctx.fill();
  ctx.globalAlpha = 1;

  edgeBlend(ctx, W, H, P.bg1);
  save(c, 'objects', 'mountain', 'pine.png');
}

function mountainCabin() {
  const W = 40, H = 32;
  const c = createCanvas(W, H), ctx = c.getContext('2d');
  const P = PAL.mountain;
  groundShadow(ctx, 20, 28, 16, 4, P.bg1);

  // Cabin body
  ctx.fillStyle = '#7A5A30'; ctx.fillRect(6, 14, 28, 14);
  ctx.fillStyle = '#8A6A40'; ctx.fillRect(7, 14, 26, 12);
  // Log texture
  for (let y = 15; y < 26; y += 3) {
    ctx.fillStyle = y % 6 === 0 ? '#7A5A30' : '#6A4A20';
    ctx.fillRect(7, y, 26, 1);
  }
  // Roof
  ctx.fillStyle = '#5A3A18';
  ctx.beginPath(); ctx.moveTo(2, 16); ctx.lineTo(20, 6); ctx.lineTo(38, 16); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#6A4A28';
  ctx.beginPath(); ctx.moveTo(4, 16); ctx.lineTo(20, 8); ctx.lineTo(36, 16); ctx.closePath(); ctx.fill();
  // Snow on roof
  ctx.fillStyle = '#E8F0F4'; ctx.globalAlpha = 0.6;
  ctx.beginPath(); ctx.moveTo(6, 16); ctx.lineTo(20, 8); ctx.lineTo(34, 16); ctx.closePath(); ctx.fill();
  ctx.globalAlpha = 1;
  // Door
  ctx.fillStyle = '#4A2A10'; ctx.fillRect(17, 20, 6, 8);
  // Window
  ctx.fillStyle = '#8AB8D0'; ctx.fillRect(10, 18, 4, 4);
  ctx.fillStyle = '#3A2A18'; ctx.fillRect(11.5, 18, 1, 4); ctx.fillRect(10, 19.5, 4, 1);
  // Chimney
  ctx.fillStyle = '#5A4A3A'; ctx.fillRect(28, 6, 4, 10);
  // Smoke
  ctx.fillStyle = '#B0B8C0'; ctx.globalAlpha = 0.3;
  ctx.fillRect(29, 3, 2, 3); ctx.fillRect(30, 1, 2, 2);
  ctx.globalAlpha = 1;

  edgeBlend(ctx, W, H, P.bg1);
  save(c, 'objects', 'mountain', 'cabin.png');
}

function mountainRock() {
  const W = 24, H = 20;
  const c = createCanvas(W, H), ctx = c.getContext('2d');
  const P = PAL.mountain;
  groundShadow(ctx, 12, 16, 9, 3, P.bg1);

  // Blue-grey rock with snow cap
  ctx.fillStyle = '#6A7080';
  ctx.beginPath();
  ctx.moveTo(4, 16); ctx.lineTo(6, 6); ctx.lineTo(12, 3);
  ctx.lineTo(18, 5); ctx.lineTo(20, 15); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#7A8090';
  ctx.beginPath();
  ctx.moveTo(8, 13); ctx.lineTo(10, 5); ctx.lineTo(14, 4); ctx.lineTo(16, 10); ctx.closePath(); ctx.fill();
  // Snow cap
  ctx.fillStyle = '#E8F0F4'; ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.moveTo(8, 6); ctx.lineTo(12, 2); ctx.lineTo(16, 5); ctx.lineTo(14, 8); ctx.lineTo(10, 8);
  ctx.closePath(); ctx.fill();
  ctx.globalAlpha = 1;

  edgeBlend(ctx, W, H, P.bg1);
  save(c, 'objects', 'mountain', 'rock.png');
}

function mountainSnowman() {
  const W = 14, H = 22;
  const c = createCanvas(W, H), ctx = c.getContext('2d');
  const P = PAL.mountain;
  groundShadow(ctx, 7, 19, 5, 2, P.bg1);

  // Bottom ball
  ctx.fillStyle = '#E0E8F0';
  ctx.beginPath(); ctx.ellipse(7, 16, 5, 4, 0, 0, Math.PI * 2); ctx.fill();
  // Middle ball
  ctx.fillStyle = '#E4ECF2';
  ctx.beginPath(); ctx.ellipse(7, 11, 4, 3, 0, 0, Math.PI * 2); ctx.fill();
  // Head
  ctx.fillStyle = '#E8F0F4';
  ctx.beginPath(); ctx.ellipse(7, 6, 3, 3, 0, 0, Math.PI * 2); ctx.fill();
  // Eyes
  ctx.fillStyle = '#2A2A2A'; ctx.fillRect(5, 5, 1, 1); ctx.fillRect(8, 5, 1, 1);
  // Carrot nose
  ctx.fillStyle = '#E87020'; ctx.fillRect(6, 6, 2, 1);
  // Hat
  ctx.fillStyle = '#2A2A2A'; ctx.fillRect(4, 2, 6, 2); ctx.fillRect(5, 0, 4, 2);
  // Arms (sticks)
  ctx.strokeStyle = '#5A3A18'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(3, 11); ctx.lineTo(0, 8); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(11, 11); ctx.lineTo(14, 8); ctx.stroke();
  // Scarf
  ctx.fillStyle = '#DD3333'; ctx.fillRect(4, 8, 6, 1);

  edgeBlend(ctx, W, H, P.bg1);
  save(c, 'objects', 'mountain', 'snowman.png');
}

function mountainPole() {
  const W = 10, H = 28;
  const c = createCanvas(W, H), ctx = c.getContext('2d');
  const P = PAL.mountain;

  // Ski pole / sign post
  ctx.fillStyle = '#8A8A8A'; ctx.fillRect(4, 2, 2, 24);
  ctx.fillStyle = '#AAAAAA'; ctx.fillRect(5, 2, 1, 24);
  // Sign
  ctx.fillStyle = '#DD3333'; ctx.fillRect(1, 2, 8, 6);
  ctx.fillStyle = '#FFFFFF';
  // Arrow
  ctx.beginPath(); ctx.moveTo(3, 5); ctx.lineTo(7, 5); ctx.lineTo(6, 3);
  ctx.moveTo(7, 5); ctx.lineTo(6, 7);
  ctx.lineWidth = 1; ctx.strokeStyle = '#FFFFFF'; ctx.stroke();
  // Snow on top
  ctx.fillStyle = '#E8F0F4'; ctx.fillRect(1, 1, 8, 2);
  ctx.globalAlpha = 0.5; ctx.fillRect(0, 2, 10, 1);
  ctx.globalAlpha = 1;

  edgeBlend(ctx, W, H, P.bg1);
  save(c, 'objects', 'mountain', 'pole.png');
}

// ============================================================
// SPRINT OBJECTS
// ============================================================

function sprintBuildingTall() {
  const W = 44, H = 68;
  const c = createCanvas(W, H), ctx = c.getContext('2d');
  const P = PAL.sprint;

  // Building body
  ctx.fillStyle = '#5A5A60'; ctx.fillRect(2, 4, 40, 62);
  ctx.fillStyle = '#686870'; ctx.fillRect(3, 4, 38, 60);
  // Windows (grid)
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 3; col++) {
      const lit = Math.random() > 0.3;
      ctx.fillStyle = lit ? '#AACCEE' : '#3A3A40';
      ctx.fillRect(6 + col * 12, 8 + row * 7, 8, 5);
      if (lit) {
        ctx.fillStyle = '#CCDDFF'; ctx.globalAlpha = 0.4;
        ctx.fillRect(7 + col * 12, 9 + row * 7, 3, 2);
        ctx.globalAlpha = 1;
      }
    }
  }
  // Roof edge
  ctx.fillStyle = '#4A4A50'; ctx.fillRect(1, 2, 42, 3);
  ctx.fillStyle = '#7A7A80'; ctx.fillRect(2, 2, 40, 1);
  // AC units on roof
  ctx.fillStyle = '#505058'; ctx.fillRect(8, 0, 6, 3); ctx.fillRect(28, 0, 6, 3);

  edgeBlend(ctx, W, H, P.bg1);
  save(c, 'objects', 'sprint', 'building_tall.png');
}

function sprintBuildingLow() {
  const W = 40, H = 32;
  const c = createCanvas(W, H), ctx = c.getContext('2d');
  const P = PAL.sprint;

  ctx.fillStyle = '#606068'; ctx.fillRect(2, 8, 36, 22);
  ctx.fillStyle = '#6A6A72'; ctx.fillRect(3, 8, 34, 20);
  // Storefront
  ctx.fillStyle = '#8AAAC0'; ctx.fillRect(6, 14, 12, 10);
  ctx.fillStyle = '#4A4A50'; ctx.fillRect(22, 14, 8, 14);
  // Awning
  ctx.fillStyle = '#CC4444'; ctx.fillRect(4, 12, 16, 3);
  ctx.fillStyle = '#DD5555'; ctx.fillRect(4, 12, 16, 1);
  // Sign
  ctx.fillStyle = '#DDDD88'; ctx.fillRect(24, 10, 10, 3);
  // Roof
  ctx.fillStyle = '#505058'; ctx.fillRect(1, 6, 38, 3);

  edgeBlend(ctx, W, H, P.bg1);
  save(c, 'objects', 'sprint', 'building_low.png');
}

function sprintLamp() {
  const W = 10, H = 28;
  const c = createCanvas(W, H), ctx = c.getContext('2d');
  const P = PAL.sprint;

  // Pole
  ctx.fillStyle = '#606060'; ctx.fillRect(4, 6, 2, 20);
  ctx.fillStyle = '#707070'; ctx.fillRect(5, 6, 1, 20);
  // Base
  ctx.fillStyle = '#505050'; ctx.fillRect(2, 24, 6, 3);
  // Lamp head
  ctx.fillStyle = '#808080'; ctx.fillRect(2, 4, 6, 3);
  // Light glow
  ctx.fillStyle = '#FFEE88'; ctx.globalAlpha = 0.6;
  ctx.beginPath(); ctx.ellipse(5, 8, 4, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 0.3;
  ctx.beginPath(); ctx.ellipse(5, 10, 6, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
  // Light source
  ctx.fillStyle = '#FFFFCC'; ctx.fillRect(3, 6, 4, 1);

  edgeBlend(ctx, W, H, P.bg1);
  save(c, 'objects', 'sprint', 'lamp.png');
}

function sprintTireWall() {
  const W = 36, H = 14;
  const c = createCanvas(W, H), ctx = c.getContext('2d');
  const P = PAL.sprint;

  // Stack of tires
  for (let i = 0; i < 4; i++) {
    const x = 2 + i * 8;
    ctx.fillStyle = '#2A2A2A';
    ctx.beginPath(); ctx.ellipse(x + 4, 8, 4, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3A3A3A';
    ctx.beginPath(); ctx.ellipse(x + 4, 8, 3, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1A1A1A';
    ctx.beginPath(); ctx.ellipse(x + 4, 8, 1.5, 1.5, 0, 0, Math.PI * 2); ctx.fill();
  }
  // Color stripes (alternating red/white)
  ctx.fillStyle = '#DD3333'; ctx.fillRect(2, 4, 32, 1);
  ctx.fillStyle = '#EEEEEE'; ctx.fillRect(2, 5, 32, 1);

  edgeBlend(ctx, W, H, P.bg1);
  save(c, 'objects', 'sprint', 'tire_wall.png');
}

function sprintGrandstand() {
  const W = 68, H = 36;
  const c = createCanvas(W, H), ctx = c.getContext('2d');
  const P = PAL.sprint;

  // Structure (tiered concrete)
  ctx.fillStyle = '#5A5A5A'; ctx.fillRect(0, 24, 68, 12);
  ctx.fillStyle = '#606060'; ctx.fillRect(2, 18, 64, 8);
  ctx.fillStyle = '#666666'; ctx.fillRect(4, 12, 60, 8);
  ctx.fillStyle = '#6A6A6A'; ctx.fillRect(6, 6, 56, 8);

  // Crowd (colored dots)
  const colors = ['#DD3333','#3388DD','#DDDD44','#33CC88','#FF6633','#FFFFFF','#AA55CC','#FF88AA'];
  for (let row = 0; row < 4; row++) {
    const y = 8 + row * 6;
    const xStart = 4 + row * 2;
    const count = 14 - row;
    for (let i = 0; i < count; i++) {
      ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
      ctx.fillRect(xStart + i * 4, y, 3, 3);
      // Head
      ctx.fillStyle = '#E0C090';
      ctx.fillRect(xStart + i * 4 + 0.5, y - 2, 2, 2);
    }
  }

  // Roof
  ctx.fillStyle = '#4A4A50'; ctx.fillRect(4, 2, 60, 4);
  ctx.fillStyle = '#5A5A60'; ctx.fillRect(5, 2, 58, 2);

  edgeBlend(ctx, W, H, P.bg1);
  save(c, 'objects', 'sprint', 'grandstand.png');
}

function sprintAdBoard() {
  const W = 52, H = 16;
  const c = createCanvas(W, H), ctx = c.getContext('2d');
  const P = PAL.sprint;

  // Board frame
  ctx.fillStyle = '#505050'; ctx.fillRect(0, 0, 52, 16);
  // Tokamak blue background
  ctx.fillStyle = '#1E3A5F'; ctx.fillRect(2, 2, 48, 12);
  // "TOKAMAK" text approx
  ctx.fillStyle = '#FFFFFF'; ctx.font = '8px monospace';
  ctx.fillText('TOKAMAK', 6, 11);
  // Blue accent line
  ctx.fillStyle = '#4A90E2'; ctx.fillRect(2, 13, 48, 1);
  // Supports
  ctx.fillStyle = '#404040';
  ctx.fillRect(4, 14, 2, 2); ctx.fillRect(46, 14, 2, 2);

  edgeBlend(ctx, W, H, P.bg1);
  save(c, 'objects', 'sprint', 'ad_board.png');
}

function sprintBillboard() {
  const W = 48, H = 18;
  const c = createCanvas(W, H), ctx = c.getContext('2d');
  const P = PAL.sprint;

  ctx.fillStyle = '#404040'; ctx.fillRect(0, 0, 48, 14);
  ctx.fillStyle = '#2A5A8A'; ctx.fillRect(2, 2, 44, 10);
  ctx.fillStyle = '#FFFFFF'; ctx.font = '7px monospace';
  ctx.fillText('TOKAMAK NETWORK', 3, 9);
  // Legs
  ctx.fillStyle = '#353535';
  ctx.fillRect(6, 14, 2, 4); ctx.fillRect(40, 14, 2, 4);

  edgeBlend(ctx, W, H, P.bg1);
  save(c, 'objects', 'sprint', 'billboard.png');
}

// ============================================================
// RUN ALL
// ============================================================
console.log('Phase 2: Generating zone objects...\n');

console.log('Desert objects:');
desertCactus();
desertRockSm();
desertRockLg();
desertScrub();
desertHut();
desertCow();
desertFence();
desertSkull();

console.log('\nCanyon objects:');
canyonCliff();
canyonPillar();
canyonDebris();
canyonArch();
canyonBush();

console.log('\nRiverbed objects:');
riverbedTree();
riverbedBush();
riverbedReeds();
riverbedBoulder();
riverbedBridge();

console.log('\nMountain objects:');
mountainPine();
mountainCabin();
mountainRock();
mountainSnowman();
mountainPole();

console.log('\nSprint objects:');
sprintBuildingTall();
sprintBuildingLow();
sprintLamp();
sprintTireWall();
sprintGrandstand();
sprintAdBoard();
sprintBillboard();

console.log('\n✅ Phase 2 complete! 30 object assets generated.');
