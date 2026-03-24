/**
 * Phase A: Crop individual sprites from DALL-E sprite sheets
 * - Auto-detect objects on black background
 * - Remove black background → transparent PNG
 * - Resize to game resolution
 */
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'public', 'assets', 'v4');

async function save(canvas, ...parts) {
  const p = path.join(OUT, ...parts);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, canvas.toBuffer('image/png'));
  console.log(`  ✓ ${parts.join('/')} (${canvas.width}×${canvas.height})`);
}

// Remove near-black pixels → transparent
function removeBlackBg(ctx, w, h, threshold = 15) {
  const id = ctx.getImageData(0, 0, w, h);
  const d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i] < threshold && d[i+1] < threshold && d[i+2] < threshold) {
      d[i+3] = 0; // make transparent
    }
  }
  ctx.putImageData(id, 0, 0);
}

// Find bounding box of non-transparent content
function findBounds(ctx, w, h) {
  const id = ctx.getImageData(0, 0, w, h);
  const d = id.data;
  let minX = w, minY = h, maxX = 0, maxY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (d[(y * w + x) * 4 + 3] > 20) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

// Crop region from image, remove black bg, resize
async function cropSprite(img, region, targetW, targetH, ...outPath) {
  // First crop the region
  const c1 = createCanvas(region.w, region.h);
  const ctx1 = c1.getContext('2d');
  ctx1.drawImage(img, region.x, region.y, region.w, region.h, 0, 0, region.w, region.h);
  
  // Remove black background
  removeBlackBg(ctx1, region.w, region.h, 15);
  
  // Find tight bounds
  const bounds = findBounds(ctx1, region.w, region.h);
  if (bounds.w < 2 || bounds.h < 2) {
    console.log(`  ⚠ Empty crop for ${outPath.join('/')}, skipping`);
    return;
  }
  
  // Crop to bounds with padding (8px min)
  const pad = 8;
  const bx = Math.max(0, bounds.x - pad);
  const by = Math.max(0, bounds.y - pad);
  const bw = Math.min(region.w - bx, bounds.w + pad * 2);
  const bh = Math.min(region.h - by, bounds.h + pad * 2);
  const c2 = createCanvas(bw, bh);
  const ctx2 = c2.getContext('2d');
  ctx2.drawImage(c1, bx, by, bw, bh, 0, 0, bw, bh);
  
  // Resize to target
  const c3 = createCanvas(targetW, targetH);
  const ctx3 = c3.getContext('2d');
  ctx3.imageSmoothingEnabled = true;
  ctx3.imageSmoothingQuality = 'high';
  ctx3.drawImage(c2, 0, 0, bw, bh, 0, 0, targetW, targetH);
  
  await save(c3, ...outPath);
}

// Auto-detect grid of sprites in a sheet
function detectGrid(img, rows, cols) {
  const cellW = Math.floor(img.width / cols);
  const cellH = Math.floor(img.height / rows);
  const regions = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      regions.push({ x: c * cellW, y: r * cellH, w: cellW, h: cellH });
    }
  }
  return regions;
}

const MEDIA = '/Users/junwoong/.openclaw/media/inbound';

async function main() {
  console.log('Phase A: Cropping DALL-E sprite sheets...\n');

  // ========== file_209: Sprint buildings 6-pack (3×2 grid) ==========
  console.log('Sprint Buildings (file_209):');
  const img209 = await loadImage(path.join(MEDIA, 'file_209---6b534607-1e0c-4d4f-81ef-9f86333398b3.jpg'));
  const grid209 = detectGrid(img209, 2, 3);
  const spBuildings = [
    { name: 'office_tower', targetW: 64, targetH: 96 },
    { name: 'hotel', targetW: 72, targetH: 88 },
    { name: 'shopping_center', targetW: 80, targetH: 56 },
    { name: 'apartment', targetW: 72, targetH: 80 },
    { name: 'skyscraper_sm', targetW: 40, targetH: 96 },
    { name: 'restaurant', targetW: 56, targetH: 56 },
  ];
  for (let i = 0; i < 6; i++) {
    await cropSprite(img209, grid209[i], spBuildings[i].targetW, spBuildings[i].targetH,
      'objects', 'sprint', `${spBuildings[i].name}.png`);
  }

  // ========== file_210: Sprint skyscraper single ==========
  console.log('\nSprint Skyscraper (file_210):');
  const img210 = await loadImage(path.join(MEDIA, 'file_210---88deb2e9-03bc-4e54-8fcc-515135f07798.jpg'));
  await cropSprite(img210, { x: 0, y: 0, w: img210.width, h: img210.height }, 48, 128,
    'objects', 'sprint', 'skyscraper.png');

  // ========== file_211: Desert objects 11-pack (3×4 grid, last cell may be empty) ==========
  console.log('\nDesert Objects (file_211):');
  const img211 = await loadImage(path.join(MEDIA, 'file_211---a5881004-180c-4077-a50e-119208c01714.jpg'));
  const grid211 = detectGrid(img211, 3, 4);
  const desertObjs = [
    { name: 'cactus_tall', targetW: 32, targetH: 48 },
    { name: 'cactus_barrel', targetW: 28, targetH: 28 },
    { name: 'rock_lg', targetW: 44, targetH: 36 },
    { name: 'rock_sm', targetW: 36, targetH: 28 },
    { name: 'bush', targetW: 28, targetH: 24 },
    { name: 'tumbleweed', targetW: 28, targetH: 28 },
    { name: 'hut', targetW: 40, targetH: 36 },
    { name: 'fence', targetW: 40, targetH: 24 },
    { name: 'cow_stand', targetW: 48, targetH: 40 },
    { name: 'cow_rest', targetW: 48, targetH: 36 },
    { name: 'dry_grass', targetW: 24, targetH: 24 },
  ];
  // Process non-cow desert objects normally
  for (let i = 0; i < Math.min(desertObjs.length, grid211.length); i++) {
    if (desertObjs[i].name === 'cow_stand' || desertObjs[i].name === 'cow_rest') continue;
    await cropSprite(img211, grid211[i], desertObjs[i].targetW, desertObjs[i].targetH,
      'objects', 'desert', `${desertObjs[i].name}.png`);
  }
  // Cows need manual regions — heads extend beyond grid cell
  // cow_stand head is at x~80 in source, need to start from x:0
  await cropSprite(img211, { x: 0, y: 520, w: 310, h: 310 }, 52, 44,
    'objects', 'desert', 'cow_stand.png');
  // cow_rest in col 1 (x starts at 320)
  await cropSprite(img211, { x: 320, y: 520, w: 310, h: 310 }, 52, 40,
    'objects', 'desert', 'cow_rest.png');

  // ========== file_212: Canyon objects 7-pack (roughly 3×3, 2 empty) ==========
  console.log('\nCanyon Objects (file_212):');
  const img212 = await loadImage(path.join(MEDIA, 'file_212---40685842-a38a-4712-8ef4-a814a79308f0.jpg'));
  const grid212 = detectGrid(img212, 3, 3);
  const canyonObjs = [
    { name: 'pillar', targetW: 36, targetH: 52 },
    { name: 'wall_long', targetW: 64, targetH: 36 },
    { name: 'rock_cluster', targetW: 44, targetH: 36 },
    { name: 'arch', targetW: 56, targetH: 44 },
    { name: 'debris_sm', targetW: 28, targetH: 24 },
    { name: 'barrier', targetW: 48, targetH: 24 },
    // row 3: empty, small rocks, dead bush
    { name: 'debris_lg', targetW: 24, targetH: 20 },
    { name: 'dead_bush', targetW: 32, targetH: 28 },
  ];
  // Grid has 9 cells, 1st is empty-ish for row3 col1
  for (let i = 0; i < Math.min(canyonObjs.length, grid212.length); i++) {
    await cropSprite(img212, grid212[i], canyonObjs[i].targetW, canyonObjs[i].targetH,
      'objects', 'canyon', `${canyonObjs[i].name}.png`);
  }

  // ========== file_213: Mountain objects (3×4 grid-ish, ~10 items) ==========
  console.log('\nMountain Objects (file_213):');
  const img213 = await loadImage(path.join(MEDIA, 'file_213---7ff2d2bf-723b-43d9-a9aa-550d9e36f066.jpg'));
  const grid213 = detectGrid(img213, 3, 4);
  const mtObjs = [
    { name: 'bush_green', targetW: 36, targetH: 32 },
    { name: 'pine_snow', targetW: 40, targetH: 48 },
    { name: 'rock_snow', targetW: 40, targetH: 36 },
    { name: 'cabin', targetW: 48, targetH: 40 },
    { name: 'snowman', targetW: 28, targetH: 32 },
    { name: 'sign_post', targetW: 24, targetH: 28 },
    { name: 'sign_arrow', targetW: 24, targetH: 28 },
    // row3
    { name: 'rock_flat', targetW: 44, targetH: 28 },
    { name: 'stone_wall', targetW: 48, targetH: 24 },
    { name: 'snow_pile', targetW: 36, targetH: 20 },
  ];
  for (let i = 0; i < Math.min(mtObjs.length, grid213.length); i++) {
    await cropSprite(img213, grid213[i], mtObjs[i].targetW, mtObjs[i].targetH,
      'objects', 'mountain', `${mtObjs[i].name}.png`);
  }

  // ========== file_214: Riverbed objects (3×3 grid, ~9 items) ==========
  console.log('\nRiverbed Objects (file_214):');
  const img214 = await loadImage(path.join(MEDIA, 'file_214---62cb7840-29b2-4875-9eec-0104d1709570.jpg'));
  const grid214 = detectGrid(img214, 3, 3);
  const rbObjs = [
    { name: 'tree', targetW: 40, targetH: 40 },
    { name: 'reeds', targetW: 24, targetH: 32 },
    { name: 'mossy_rock', targetW: 36, targetH: 32 },
    { name: 'fence', targetW: 40, targetH: 24 },
    { name: 'puddle', targetW: 44, targetH: 28 },
    { name: 'bush_wide', targetW: 40, targetH: 28 },
    { name: 'log_moss', targetW: 48, targetH: 24 },
    { name: 'log_plain', targetW: 48, targetH: 24 },
    { name: 'bird', targetW: 20, targetH: 16 },
  ];
  for (let i = 0; i < Math.min(rbObjs.length, grid214.length); i++) {
    await cropSprite(img214, grid214[i], rbObjs[i].targetW, rbObjs[i].targetH,
      'objects', 'riverbed', `${rbObjs[i].name}.png`);
  }

  // ========== file_215: Sprint misc objects (3×3 grid) ==========
  console.log('\nSprint Misc Objects (file_215):');
  const img215 = await loadImage(path.join(MEDIA, 'file_215---9b9e70f0-59af-4755-8c8b-dd21303fc8ba.jpg'));
  const grid215 = detectGrid(img215, 3, 3);
  // Row1: grandstand, jersey barrier, catch fence
  // Row2: street light, tokamak banner, tire stack, generator
  // Row3: tires flat, cones, generator small
  // Adjust: it's more like 3×4 layout based on image
  const grid215_r2 = detectGrid(img215, 3, 4);
  
  const spMiscObjs = [
    // Use 3×3 for row 1
    { grid: grid215, idx: 0, name: 'grandstand', targetW: 80, targetH: 40 },
    { grid: grid215, idx: 1, name: 'jersey_barrier', targetW: 56, targetH: 28 },
    { grid: grid215, idx: 2, name: 'catch_fence', targetW: 56, targetH: 32 },
  ];
  for (const obj of spMiscObjs) {
    await cropSprite(img215, obj.grid[obj.idx], obj.targetW, obj.targetH,
      'objects', 'sprint', `${obj.name}.png`);
  }

  // Row 2 & 3 — use 4-column grid for better alignment
  const spMisc2 = [
    { name: 'street_light', targetW: 16, targetH: 40 },
    { name: 'banner_arch', targetW: 80, targetH: 36 },
    { name: 'tire_stack', targetW: 28, targetH: 24 },
    { name: 'generator', targetW: 36, targetH: 28 },
    { name: 'tires_flat', targetW: 28, targetH: 20 },
    { name: 'cones', targetW: 24, targetH: 20 },
    { name: 'generator_sm', targetW: 32, targetH: 28 },
  ];
  for (let i = 0; i < Math.min(spMisc2.length, grid215_r2.length - 4); i++) {
    await cropSprite(img215, grid215_r2[i + 4], spMisc2[i].targetW, spMisc2[i].targetH,
      'objects', 'sprint', `${spMisc2[i].name}.png`);
  }

  console.log('\n✅ Phase A complete!');
  
  // List all generated files
  console.log('\nGenerated files:');
  const walk = (dir, prefix = '') => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.isDirectory()) walk(path.join(dir, e.name), prefix + e.name + '/');
      else if (e.name.endsWith('.png')) console.log(`  ${prefix}${e.name}`);
    }
  };
  walk(path.join(OUT, 'objects'));
}

main().catch(e => { console.error(e); process.exit(1); });
