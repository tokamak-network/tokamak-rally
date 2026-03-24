/**
 * Phase 1: Background Tiles (128×128) + Barriers (64×16)
 * Programmatic pixel art — no AI, no transparency issues
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

// Seeded random for reproducibility
let seed = 42;
function rng() { seed = (seed * 16807 + 0) % 2147483647; return (seed - 1) / 2147483646; }

function noise(ctx, w, h, colors, density = 0.3) {
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (rng() < density) {
        ctx.fillStyle = colors[Math.floor(rng() * colors.length)];
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
}

// ============================================================
// BACKGROUND TILES (128×128, fully opaque, tileable)
// ============================================================

function genBgDesert() {
  const c = createCanvas(128, 128), ctx = c.getContext('2d');
  // Base sand
  ctx.fillStyle = '#D4A574';
  ctx.fillRect(0, 0, 128, 128);
  // Sand variation layers
  noise(ctx, 128, 128, ['#C99B68', '#DFAE7A', '#BF8F5C'], 0.35);
  // Wind ripple lines (horizontal, subtle)
  ctx.globalAlpha = 0.15;
  for (let y = 0; y < 128; y += 6 + Math.floor(rng() * 8)) {
    ctx.fillStyle = rng() > 0.5 ? '#B8864E' : '#E0B87E';
    const yOff = Math.floor(rng() * 3);
    for (let x = 0; x < 128; x++) {
      const wave = Math.sin(x * 0.08 + yOff) * 1.5;
      ctx.fillRect(x, y + Math.round(wave), 1, 1);
    }
  }
  ctx.globalAlpha = 1.0;
  // Occasional darker grains (pebbles)
  noise(ctx, 128, 128, ['#8B7355', '#7A6245'], 0.03);
  save(c, 'tiles', 'bg_desert.png');
}

function genBgCanyon() {
  const c = createCanvas(128, 128), ctx = c.getContext('2d');
  // Base reddish-brown rock
  ctx.fillStyle = '#8B5E3C';
  ctx.fillRect(0, 0, 128, 128);
  // Horizontal stratification layers
  for (let y = 0; y < 128; y += 3 + Math.floor(rng() * 5)) {
    const shade = rng();
    ctx.fillStyle = shade > 0.6 ? '#6B4423' : shade > 0.3 ? '#A0522D' : '#7A5033';
    ctx.fillRect(0, y, 128, 2 + Math.floor(rng() * 3));
  }
  // Rock texture noise
  noise(ctx, 128, 128, ['#5C3A1E', '#9B6B4A', '#6B4423', '#B07548'], 0.25);
  // Cracks
  ctx.globalAlpha = 0.3;
  ctx.strokeStyle = '#3E2415';
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    let cx = rng() * 128, cy = rng() * 128;
    ctx.moveTo(cx, cy);
    for (let j = 0; j < 6; j++) {
      cx += (rng() - 0.5) * 20;
      cy += rng() * 15;
      ctx.lineTo(cx, cy);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1.0;
  save(c, 'tiles', 'bg_canyon.png');
}

function genBgRiverbed() {
  const c = createCanvas(128, 128), ctx = c.getContext('2d');
  // Base grass green
  ctx.fillStyle = '#4A7A3A';
  ctx.fillRect(0, 0, 128, 128);
  // Grass texture — short strokes
  for (let y = 0; y < 128; y += 2) {
    for (let x = 0; x < 128; x += 2) {
      if (rng() > 0.3) {
        const g = ['#3D6B2E', '#5A8A48', '#6B9B55', '#2E5A1E', '#4A7A3A'];
        ctx.fillStyle = g[Math.floor(rng() * g.length)];
        ctx.fillRect(x, y, 1 + Math.floor(rng() * 2), 1 + Math.floor(rng() * 2));
      }
    }
  }
  // Dirt patches
  ctx.globalAlpha = 0.4;
  for (let i = 0; i < 5; i++) {
    const dx = rng() * 100, dy = rng() * 100;
    const dr = 8 + rng() * 12;
    ctx.fillStyle = '#7A6B55';
    ctx.beginPath();
    ctx.ellipse(dx, dy, dr, dr * 0.7, rng() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1.0;
  // Small flowers/details
  noise(ctx, 128, 128, ['#8FBC8F', '#FFE4B5'], 0.02);
  save(c, 'tiles', 'bg_riverbed.png');
}

function genBgMountain() {
  const c = createCanvas(128, 128), ctx = c.getContext('2d');
  // Snow-covered ground
  ctx.fillStyle = '#E8EEF0';
  ctx.fillRect(0, 0, 128, 128);
  // Snow texture — subtle blue shadows
  noise(ctx, 128, 128, ['#D0DCE0', '#F0F8FF', '#C8D8E0', '#E0EAF0', '#B8C8D4'], 0.4);
  // Ice patches
  ctx.globalAlpha = 0.2;
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = '#A0C0D8';
    ctx.beginPath();
    ctx.ellipse(rng() * 128, rng() * 128, 10 + rng() * 15, 6 + rng() * 10, rng() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1.0;
  // Exposed rock patches
  noise(ctx, 128, 128, ['#708090', '#5F6B7A'], 0.03);
  save(c, 'tiles', 'bg_mountain.png');
}

function genBgSprint() {
  const c = createCanvas(128, 128), ctx = c.getContext('2d');
  // Dark asphalt
  ctx.fillStyle = '#3A3A3A';
  ctx.fillRect(0, 0, 128, 128);
  // Asphalt texture — fine grain
  noise(ctx, 128, 128, ['#333333', '#404040', '#4A4A4A', '#353535', '#2E2E2E'], 0.5);
  // Cracks
  ctx.globalAlpha = 0.25;
  ctx.strokeStyle = '#252525';
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    let cx = rng() * 128, cy = rng() * 128;
    ctx.moveTo(cx, cy);
    for (let j = 0; j < 5; j++) {
      cx += (rng() - 0.5) * 30;
      cy += (rng() - 0.5) * 30;
      ctx.lineTo(cx, cy);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1.0;
  // Oil stains
  ctx.globalAlpha = 0.08;
  for (let i = 0; i < 2; i++) {
    ctx.fillStyle = '#1A1A2E';
    ctx.beginPath();
    ctx.ellipse(rng() * 128, rng() * 128, 8 + rng() * 10, 4 + rng() * 6, rng() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1.0;
  save(c, 'tiles', 'bg_sprint.png');
}

// ============================================================
// BARRIERS (64×16)
// ============================================================

function genBarrierDesert() {
  const c = createCanvas(64, 16), ctx = c.getContext('2d');
  // Red-white striped curbing (Thrash Rally style)
  const stripeW = 8;
  for (let x = 0; x < 64; x += stripeW) {
    ctx.fillStyle = (x / stripeW) % 2 === 0 ? '#DD2222' : '#F5F5F5';
    ctx.fillRect(x, 0, stripeW, 16);
  }
  // Top highlight
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fillRect(0, 0, 64, 2);
  // Bottom shadow
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(0, 14, 64, 2);
  // Scuff marks
  noise(ctx, 64, 16, ['rgba(0,0,0,0.15)'], 0.05);
  save(c, 'barriers', 'barrier_desert.png');
}

function genBarrierCanyon() {
  const c = createCanvas(64, 16), ctx = c.getContext('2d');
  // Stone wall
  ctx.fillStyle = '#7A6B55';
  ctx.fillRect(0, 0, 64, 16);
  // Stone blocks
  const stones = [0, 10, 22, 36, 48, 58];
  stones.forEach((sx, i) => {
    const sw = (i < stones.length - 1 ? stones[i + 1] - sx : 64 - sx) - 1;
    const shade = 0.8 + rng() * 0.4;
    const r = Math.floor(122 * shade), g = Math.floor(107 * shade), b = Math.floor(85 * shade);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(sx, 1, sw, 14);
    // Mortar line
    ctx.fillStyle = '#5A4E3C';
    ctx.fillRect(sx + sw, 0, 1, 16);
  });
  // Top/bottom mortar
  ctx.fillStyle = '#5A4E3C';
  ctx.fillRect(0, 0, 64, 1);
  ctx.fillRect(0, 15, 64, 1);
  noise(ctx, 64, 16, ['#6B5D48', '#8A7B65'], 0.1);
  save(c, 'barriers', 'barrier_canyon.png');
}

function genBarrierRiverbed() {
  const c = createCanvas(64, 16), ctx = c.getContext('2d');
  // Wooden guardrail
  ctx.fillStyle = '#8B6E4E';
  ctx.fillRect(0, 0, 64, 16);
  // Wood grain (horizontal lines)
  for (let y = 0; y < 16; y += 2 + Math.floor(rng() * 3)) {
    ctx.fillStyle = rng() > 0.5 ? '#7A5E3E' : '#9B7E5E';
    ctx.fillRect(0, y, 64, 1);
  }
  // Posts
  for (let x = 0; x < 64; x += 16) {
    ctx.fillStyle = '#6B4E33';
    ctx.fillRect(x, 0, 3, 16);
    ctx.fillStyle = '#A08060';
    ctx.fillRect(x + 1, 0, 1, 16);
  }
  // Top cap
  ctx.fillStyle = '#7A5E3E';
  ctx.fillRect(0, 0, 64, 2);
  ctx.fillStyle = '#A08060';
  ctx.fillRect(0, 0, 64, 1);
  save(c, 'barriers', 'barrier_riverbed.png');
}

function genBarrierMountain() {
  const c = createCanvas(64, 16), ctx = c.getContext('2d');
  // Metal guardrail with snow
  ctx.fillStyle = '#A0A0A0';
  ctx.fillRect(0, 0, 64, 12);
  // Snow on top
  ctx.fillStyle = '#F0F8FF';
  ctx.fillRect(0, 0, 64, 5);
  noise(ctx, 64, 5, ['#E0EAF0', '#D0DCE0'], 0.2);
  // Metal texture
  for (let y = 5; y < 12; y += 2) {
    ctx.fillStyle = y % 4 === 0 ? '#B0B0B0' : '#909090';
    ctx.fillRect(0, y, 64, 1);
  }
  // Posts
  for (let x = 0; x < 64; x += 20) {
    ctx.fillStyle = '#707070';
    ctx.fillRect(x, 3, 2, 13);
  }
  // Bottom shadow on ground
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.fillRect(0, 12, 64, 4);
  save(c, 'barriers', 'barrier_mountain.png');
}

function genBarrierSprint() {
  const c = createCanvas(64, 16), ctx = c.getContext('2d');
  // Concrete jersey barrier (bottom) + catch fence (top)
  // Concrete base
  ctx.fillStyle = '#888888';
  ctx.fillRect(0, 8, 64, 8);
  ctx.fillStyle = '#999999';
  ctx.fillRect(0, 8, 64, 2);
  ctx.fillStyle = '#777777';
  ctx.fillRect(0, 14, 64, 2);
  // Red-white stripe on concrete face
  for (let x = 0; x < 64; x += 8) {
    ctx.fillStyle = (x / 8) % 2 === 0 ? '#CC3333' : '#EEEEEE';
    ctx.fillRect(x, 10, 8, 3);
  }
  // Metal catch fence (top half)
  ctx.fillStyle = '#606060';
  ctx.fillRect(0, 0, 64, 8);
  // Diamond mesh pattern
  ctx.strokeStyle = '#808080';
  ctx.lineWidth = 0.5;
  for (let x = 0; x < 68; x += 4) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 8, 8);
    ctx.moveTo(x, 8);
    ctx.lineTo(x + 8, 0);
    ctx.stroke();
  }
  // Fence posts
  for (let x = 0; x < 64; x += 16) {
    ctx.fillStyle = '#505050';
    ctx.fillRect(x, 0, 2, 16);
  }
  save(c, 'barriers', 'barrier_sprint.png');
}

// ============================================================
// RUN
// ============================================================
console.log('Phase 1: Generating background tiles + barriers...\n');

console.log('Background tiles:');
genBgDesert();
genBgCanyon();
genBgRiverbed();
genBgMountain();
genBgSprint();

console.log('\nBarriers:');
genBarrierDesert();
genBarrierCanyon();
genBarrierRiverbed();
genBarrierMountain();
genBarrierSprint();

console.log('\n✅ Phase 1 complete! 10 assets generated.');
