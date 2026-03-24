import Phaser from 'phaser';
import { CARS, CAR_PIXELS } from './Cars.js';

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    this.load.image('tokamak_logo', '/tokamak-logo-cropped.png');
    this.load.image('tokamak_logo_white', '/tokamak-logo-white.png');

    // v2 배경 타일 (legacy)
    this.load.image('v2_bg_desert', '/assets/v2/tiles/bg_desert.png');
    this.load.image('v2_bg_canyon', '/assets/v2/tiles/bg_canyon.png');
    this.load.image('v2_bg_riverbed', '/assets/v2/tiles/bg_riverbed.png');
    this.load.image('v2_bg_mountain', '/assets/v2/tiles/bg_mountain.png');
    this.load.image('v2_bg_sprint', '/assets/v2/tiles/bg_sprint.png');

    // v3 배경 타일 (프로그래매틱 픽셀아트)
    this.load.image('v3_bg_desert', '/assets/v3/tiles/bg_desert.png');
    this.load.image('v3_bg_canyon', '/assets/v3/tiles/bg_canyon.png');
    this.load.image('v3_bg_riverbed', '/assets/v3/tiles/bg_riverbed.png');
    this.load.image('v3_bg_mountain', '/assets/v3/tiles/bg_mountain.png');
    this.load.image('v3_bg_sprint', '/assets/v3/tiles/bg_sprint.png');

    // v3 배리어
    this.load.image('v3_barrier_desert', '/assets/v3/barriers/barrier_desert.png');
    this.load.image('v3_barrier_canyon', '/assets/v3/barriers/barrier_canyon.png');
    this.load.image('v3_barrier_riverbed', '/assets/v3/barriers/barrier_riverbed.png');
    this.load.image('v3_barrier_mountain', '/assets/v3/barriers/barrier_mountain.png');
    this.load.image('v3_barrier_sprint', '/assets/v3/barriers/barrier_sprint.png');

    // v3 오브젝트 — desert
    this.load.image('v3_desert_cactus', '/assets/v3/objects/desert/cactus.png');
    this.load.image('v3_desert_rock_sm', '/assets/v3/objects/desert/rock_sm.png');
    this.load.image('v3_desert_rock_lg', '/assets/v3/objects/desert/rock_lg.png');
    this.load.image('v3_desert_scrub', '/assets/v3/objects/desert/scrub.png');
    this.load.image('v3_desert_hut', '/assets/v3/objects/desert/hut.png');
    this.load.image('v3_desert_cow', '/assets/v3/objects/desert/cow.png');
    this.load.image('v3_desert_fence', '/assets/v3/objects/desert/fence.png');
    this.load.image('v3_desert_skull', '/assets/v3/objects/desert/skull.png');

    // v3 오브젝트 — canyon
    this.load.image('v3_canyon_cliff', '/assets/v3/objects/canyon/cliff.png');
    this.load.image('v3_canyon_pillar', '/assets/v3/objects/canyon/pillar.png');
    this.load.image('v3_canyon_debris', '/assets/v3/objects/canyon/debris.png');
    this.load.image('v3_canyon_arch', '/assets/v3/objects/canyon/arch.png');
    this.load.image('v3_canyon_bush', '/assets/v3/objects/canyon/bush.png');

    // v3 오브젝트 — riverbed
    this.load.image('v3_riverbed_tree', '/assets/v3/objects/riverbed/tree.png');
    this.load.image('v3_riverbed_bush', '/assets/v3/objects/riverbed/bush.png');
    this.load.image('v3_riverbed_reeds', '/assets/v3/objects/riverbed/reeds.png');
    this.load.image('v3_riverbed_boulder', '/assets/v3/objects/riverbed/boulder.png');
    this.load.image('v3_riverbed_bridge', '/assets/v3/objects/riverbed/bridge.png');

    // v3 오브젝트 — mountain
    this.load.image('v3_mountain_pine', '/assets/v3/objects/mountain/pine.png');
    this.load.image('v3_mountain_cabin', '/assets/v3/objects/mountain/cabin.png');
    this.load.image('v3_mountain_rock', '/assets/v3/objects/mountain/rock.png');
    this.load.image('v3_mountain_snowman', '/assets/v3/objects/mountain/snowman.png');
    this.load.image('v3_mountain_pole', '/assets/v3/objects/mountain/pole.png');

    // v3 오브젝트 — sprint
    this.load.image('v3_sprint_building_tall', '/assets/v3/objects/sprint/building_tall.png');
    this.load.image('v3_sprint_building_low', '/assets/v3/objects/sprint/building_low.png');
    this.load.image('v3_sprint_lamp', '/assets/v3/objects/sprint/lamp.png');
    this.load.image('v3_sprint_tire_wall', '/assets/v3/objects/sprint/tire_wall.png');
    this.load.image('v3_sprint_grandstand', '/assets/v3/objects/sprint/grandstand.png');
    this.load.image('v3_sprint_ad_board', '/assets/v3/objects/sprint/ad_board.png');
    this.load.image('v3_sprint_billboard', '/assets/v3/objects/sprint/billboard.png');

    // v2 차량 (Cars.js ID에 맞춤)
    this.load.image('v2_car_alpine_white', '/assets/v2/cars/car_alpine_white.png');
    this.load.image('v2_car_hyper_blue', '/assets/v2/cars/car_hyper_blue.png');
    this.load.image('v2_car_puma_orange', '/assets/v2/cars/car_puma_orange.png');
    this.load.image('v2_car_tundra_red', '/assets/v2/cars/car_tundra_red.png');
    this.load.image('v2_car_volt_green', '/assets/v2/cars/car_volt_green.png');

    // v2 배리어
    this.load.image('v2_barrier_desert', '/assets/v2/barriers/barrier_desert.png');
    this.load.image('v2_barrier_canyon', '/assets/v2/barriers/barrier_canyon.png');
    this.load.image('v2_barrier_riverbed', '/assets/v2/barriers/barrier_riverbed.png');
    this.load.image('v2_barrier_mountain', '/assets/v2/barriers/barrier_mountain.png');
    this.load.image('v2_barrier_sprint', '/assets/v2/barriers/barrier_sprint.png');

    // v2 오브젝트 — desert
    this.load.image('v2_desert_cactus', '/assets/v2/objects/desert/desert_cactus.png');
    this.load.image('v2_desert_scrub', '/assets/v2/objects/desert/desert_scrub.png');
    this.load.image('v2_desert_rock', '/assets/v2/objects/desert/desert_rock.png');
    this.load.image('v2_desert_cow', '/assets/v2/objects/desert/desert_cow.png');
    this.load.image('v2_desert_hut', '/assets/v2/objects/desert/desert_hut.png');

    // v2 오브젝트 — canyon
    this.load.image('v2_canyon_pillar', '/assets/v2/objects/canyon/canyon_pillar.png');
    this.load.image('v2_canyon_debris', '/assets/v2/objects/canyon/canyon_debris.png');
    this.load.image('v2_canyon_reflector', '/assets/v2/objects/canyon/canyon_reflector.png');
    this.load.image('v2_canyon_cliff', '/assets/v2/objects/canyon/canyon_cliff.png');

    // v2 오브젝트 — riverbed
    this.load.image('v2_riverbed_reeds', '/assets/v2/objects/riverbed/riverbed_reeds.png');
    this.load.image('v2_riverbed_bridge', '/assets/v2/objects/riverbed/riverbed_bridge.png');
    this.load.image('v2_riverbed_boulder', '/assets/v2/objects/riverbed/riverbed_boulder.png');
    this.load.image('v2_riverbed_bird', '/assets/v2/objects/riverbed/riverbed_bird.png');

    // v2 오브젝트 — mountain
    this.load.image('v2_mountain_pine', '/assets/v2/objects/mountain/mountain_pine.png');
    this.load.image('v2_mountain_rock', '/assets/v2/objects/mountain/mountain_rock.png');
    this.load.image('v2_mountain_cabin', '/assets/v2/objects/mountain/mountain_cabin.png');
    this.load.image('v2_mountain_snowman', '/assets/v2/objects/mountain/mountain_snowman.png');
    this.load.image('v2_mountain_turbine', '/assets/v2/objects/mountain/mountain_turbine.png');

    // v2 오브젝트 — sprint
    this.load.image('v2_sprint_building', '/assets/v2/objects/sprint/sprint_building.png');
    this.load.image('v2_sprint_lamp', '/assets/v2/objects/sprint/sprint_lamp.png');
    this.load.image('v2_sprint_tires', '/assets/v2/objects/sprint/sprint_tires.png');
    this.load.image('v2_sprint_billboard', '/assets/v2/objects/sprint/sprint_billboard.png');
    this.load.image('v2_sprint_grandstand', '/assets/v2/objects/sprint/sprint_grandstand.png');
  }

  create() {
    this.genAllCars();
    this.genBackgrounds();
    this.genScenery();
    this.genObstacles();
    this.genUI();
    this.scene.start('Menu');
  }

  px(g, pixels, s = 2) {
    for (let y = 0; y < pixels.length; y++)
      for (let x = 0; x < pixels[y].length; x++) {
        const c = pixels[y][x];
        if (c !== 0) { g.fillStyle(c); g.fillRect(x*s, y*s, s, s); }
      }
  }

  genAllCars() {
    for (const car of CARS) {
      const g = this.add.graphics();
      const pixels = CAR_PIXELS[car.id];
      if (pixels) {
        this.px(g, pixels, 2);
        g.generateTexture(`car_${car.id}`, 40, 56);
        g.destroy();
      }
    }
    const g2 = this.add.graphics();
    this.px(g2, CAR_PIXELS['alpine_white'], 2);
    g2.generateTexture('car_player', 40, 56);
    g2.destroy();
  }

  genBackgrounds() {
    const S = 128; // tile size — larger for more detail
    let g;

    // ====== DESERT — Bright warm sand matching cactus base color ======
    g = this.add.graphics();
    // Layer 1: Base gradient — bright warm sand (#c8a060 ~ #d4b878)
    for (let y = 0; y < S; y++) {
      const t = y / S;
      const r = Math.floor(0xd0 + (0xc4-0xd0)*t + Math.sin(y*0.15)*4);
      const gv = Math.floor(0xb0 + (0xa0-0xb0)*t + Math.sin(y*0.12)*3);
      const b = Math.floor(0x68 + (0x58-0x68)*t + Math.sin(y*0.1)*3);
      g.fillStyle((Math.max(0,Math.min(255,r))<<16)|(Math.max(0,Math.min(255,gv))<<8)|Math.max(0,Math.min(255,b)));
      g.fillRect(0, y, S, 1);
    }
    // Layer 2: Dune ridge crests — golden highlights with wave pattern
    g.fillStyle(0xdcbc70, 0.2);
    for (let y = 6; y < S; y += 16) {
      for (let x = 0; x < S; x++) {
        const wave = Math.sin(x*0.06+y*0.015)*4;
        g.fillRect(x, y+wave, 1, 2);
      }
    }
    // Layer 3: Shadow valleys between dunes (lighter than before)
    g.fillStyle(0xb89050, 0.15);
    for (let y = 12; y < S; y += 16) {
      for (let x = 0; x < S; x++) {
        const wave = Math.sin(x*0.05+y*0.025)*3;
        g.fillRect(x, y+wave, 1, 2);
      }
    }
    // Layer 4: Fine sand ripples (wind-blown texture)
    g.fillStyle(0xd8b870, 0.18);
    for (let y = 2; y < S; y += 4) {
      const startX = (y*7)%S;
      g.fillRect(startX, y, 15+((y*3)%10), 1);
      g.fillRect((startX+50)%S, y+1, 10+((y*5)%8), 1);
    }
    // Layer 5: Stipple noise — 1px dots for dithered texture
    for (let i = 0; i < 150; i++) {
      const px = (i*41+13)%S, py = (i*53+7)%S;
      g.fillStyle([0xd0a860,0xc49850,0xccaa58,0xba9048,0xd8b068,0xc4a050][i%6], 0.3);
      g.fillRect(px, py, 1, 1);
    }
    // Layer 6: Scattered pebbles (2px dots)
    for (let i = 0; i < 30; i++) {
      const px = (i*37+19)%S, py = (i*61+11)%S;
      g.fillStyle([0xa08040,0x907030,0xb09050][i%3], 0.35);
      g.fillRect(px, py, 2, 1+(i%3===0?1:0));
    }
    // Layer 7: Tire track marks
    g.fillStyle(0xb08848, 0.1);
    for (let y = 10; y < S; y += 20) {
      g.fillRect(40, y, 2, 6); g.fillRect(48, y+3, 2, 6);
      g.fillRect(85, y+5, 2, 6); g.fillRect(93, y+8, 2, 6);
    }
    // Layer 8: Wind-blown highlight streaks
    g.fillStyle(0xe8c880, 0.08);
    for (let y = 0; y < S; y += 7) {
      const sx = (y*11+5)%S;
      g.fillRect(sx, y, 20+((y*3)%12), 1);
    }
    g.generateTexture('bg_desert', S, S); g.destroy();

    // ====== CANYON — red-orange sandstone with cracks and layered strata ======
    g = this.add.graphics();
    // Layer 1: Base red-orange sandstone gradient
    for (let y = 0; y < S; y++) {
      const t = y / S;
      const r = Math.floor(0xb8 + (0xa0-0xb8)*t + Math.sin(y*0.2+3)*6);
      const gv = Math.floor(0x70 + (0x58-0x70)*t + Math.sin(y*0.15+1)*5);
      const b = Math.floor(0x35 + (0x25-0x35)*t + Math.sin(y*0.12)*3);
      g.fillStyle((Math.max(0,Math.min(255,r))<<16)|(Math.max(0,Math.min(255,gv))<<8)|Math.max(0,Math.min(255,b)));
      g.fillRect(0, y, S, 1);
    }
    // Layer 2: Rock strata bands (horizontal, varying color)
    for (let band = 0; band < 5; band++) {
      const by = band * 26 + 8;
      g.fillStyle([0xa06030,0xb07040,0x905528,0xc08048,0x8a4a20][band], 0.18);
      g.fillRect(0, by, S, 3);
      g.fillStyle([0x8a5025,0x9a6035,0x7a4518,0xaa7038,0x7a3a18][band], 0.12);
      g.fillRect(0, by+3, S, 2);
    }
    // Layer 3: Crack patterns (short dark lines at angles)
    g.fillStyle(0x5a3018, 0.25);
    const cracks = [[15,20,8,1],[45,55,1,10],[80,30,6,1],[60,85,1,8],[100,65,7,1],[25,100,1,7],[110,15,5,1]];
    cracks.forEach(([cx,cy,cw,ch]) => g.fillRect(cx,cy,cw,ch));
    // Layer 4: Sand patches between rocks
    g.fillStyle(0xc8a068, 0.2);
    g.fillRect(40,20,20,12); g.fillRect(5,50,15,10); g.fillRect(80,35,18,12);
    g.fillRect(60,90,22,14); g.fillRect(20,100,16,10);
    // Layer 5: Rock patches — irregular shapes
    g.fillStyle(0x9a5a30, 0.3);
    g.fillRect(10,15,14,8); g.fillRect(55,40,18,10); g.fillRect(90,80,16,9);
    g.fillStyle(0x8a4a22, 0.25);
    g.fillRect(12,17,10,5); g.fillRect(57,42,14,6); g.fillRect(92,82,12,5);
    // Layer 6: Stipple noise for dithered sandstone texture
    for (let i = 0; i < 120; i++) {
      const px = (i*43+17)%S, py = (i*61+23)%S;
      g.fillStyle([0x7a4a25,0x8a5a35,0x6a3a18,0x9a6a40,0xa07045,0x704020][i%6], 0.4);
      g.fillRect(px, py, 1+(i%3===0?1:0), 1);
    }
    // Layer 7: Shadow spots
    g.fillStyle(0x4a2a10, 0.15);
    g.fillRect(25,32,6,4); g.fillRect(68,58,8,5); g.fillRect(42,88,7,4);
    g.fillRect(100,22,5,4); g.fillRect(15,75,6,3);
    // Layer 8: Highlight spots (sun-bleached rock)
    g.fillStyle(0xd0a060, 0.1);
    g.fillRect(35,8,10,4); g.fillRect(78,48,8,3); g.fillRect(8,88,9,4);
    g.generateTexture('bg_canyon', S, S); g.destroy();

    // ====== RIVERBED — grey-blue gravel with moss, puddle shimmer, river stones ======
    g = this.add.graphics();
    // Layer 1: Base grey-blue gravel gradient
    for (let y = 0; y < S; y++) {
      const t = y / S;
      const r = Math.floor(0x7a + (0x6a-0x7a)*t + Math.sin(y*0.18)*4);
      const gv = Math.floor(0x7e + (0x6e-0x7e)*t + Math.sin(y*0.14+1)*4);
      const b = Math.floor(0x82 + (0x72-0x82)*t + Math.sin(y*0.11+2)*3);
      g.fillStyle((Math.max(0,Math.min(255,r))<<16)|(Math.max(0,Math.min(255,gv))<<8)|Math.max(0,Math.min(255,b)));
      g.fillRect(0, y, S, 1);
    }
    // Layer 2: Dense gravel stipple noise
    for (let i = 0; i < 150; i++) {
      const px = (i*41+17)%S, py = (i*59+23)%S;
      g.fillStyle([0x8a8a85,0x6a6a62,0x9a9a8e,0x5a5a52,0x7a7a74,0x8888880][i%6], 0.45);
      g.fillRect(px, py, 1+(i%3===0?1:0), 1+(i%4===0?1:0));
    }
    // Layer 3: Water puddle areas with shimmer
    g.fillStyle(0x4a5a68, 0.3);
    g.fillRect(20,25,25,18); g.fillRect(70,60,22,16); g.fillRect(5,85,20,14);
    g.fillStyle(0x6a8a9a, 0.15);
    g.fillRect(24,28,12,3); g.fillRect(74,63,10,3); g.fillRect(9,88,9,3);
    g.fillStyle(0x9abace, 0.08);
    g.fillRect(26,29,6,1); g.fillRect(76,64,5,1); g.fillRect(11,89,5,1);
    // Layer 4: Green moss patches
    g.fillStyle(0x4a8a3a, 0.25);
    g.fillRect(55,10,22,16); g.fillRect(95,50,20,14); g.fillRect(10,70,18,12);
    g.fillStyle(0x3a7a2a, 0.2);
    g.fillRect(57,12,16,10); g.fillRect(97,52,14,9); g.fillRect(12,72,13,8);
    // Layer 5: Yellow-green moss on wet edges
    g.fillStyle(0x7a9a50, 0.15);
    g.fillRect(22,42,8,4); g.fillRect(68,78,10,5); g.fillRect(100,95,8,4);
    // Layer 6: Larger rounded river stones
    g.fillStyle(0x6a6a5a, 0.5);
    g.fillRect(38,38,5,4); g.fillRect(80,22,6,5); g.fillRect(48,92,5,4);
    g.fillRect(110,40,4,4); g.fillRect(15,55,5,3);
    g.fillStyle(0x7a7a6a, 0.3);
    g.fillRect(39,39,3,2); g.fillRect(81,23,4,3); g.fillRect(49,93,3,2);
    // Layer 7: Fine gravel 1px scatter
    for (let i = 0; i < 80; i++) {
      const px = (i*37+29)%S, py = (i*47+13)%S;
      g.fillStyle([0x757570,0x656560,0x858580][i%3], 0.3);
      g.fillRect(px, py, 1, 1);
    }
    // Layer 8: Subtle wet sheen highlights
    g.fillStyle(0xaabbcc, 0.06);
    g.fillRect(30,30,8,2); g.fillRect(78,68,6,2); g.fillRect(12,92,7,2);
    g.generateTexture('bg_riverbed', S, S); g.destroy();

    // ====== MOUNTAIN — deep green forest floor with moss, leaf litter, dappled light ======
    g = this.add.graphics();
    // Layer 1: Base deep green-brown gradient
    for (let y = 0; y < S; y++) {
      const t = y / S;
      const r = Math.floor(0x38 + (0x30-0x38)*t + Math.sin(y*0.2+2)*5);
      const gv = Math.floor(0x50 + (0x44-0x50)*t + Math.sin(y*0.15+1)*6);
      const b = Math.floor(0x26 + (0x20-0x26)*t + Math.sin(y*0.12)*3);
      g.fillStyle((Math.max(0,Math.min(255,r))<<16)|(Math.max(0,Math.min(255,gv))<<8)|Math.max(0,Math.min(255,b)));
      g.fillRect(0, y, S, 1);
    }
    // Layer 2: Moss patches (lush green)
    g.fillStyle(0x3a6a2a, 0.3);
    g.fillRect(8,5,20,14); g.fillRect(60,40,24,16); g.fillRect(85,85,22,16);
    g.fillRect(30,65,16,10); g.fillRect(100,20,18,12);
    g.fillStyle(0x4a7a3a, 0.2);
    g.fillRect(10,7,14,8); g.fillRect(62,42,18,10); g.fillRect(87,87,16,10);
    // Layer 3: Leaf litter stipple (brown dots)
    for (let i = 0; i < 80; i++) {
      const px = (i*37+11)%S, py = (i*53+7)%S;
      g.fillStyle([0x5a4a20,0x4a3a15,0x6a5a28,0x3a2a10,0x5a4018,0x4a3510][i%6], 0.35);
      g.fillRect(px, py, 1+(i%2), 1);
    }
    // Layer 4: Exposed rock patches
    g.fillStyle(0x5a5a50, 0.35);
    g.fillRect(42,18,10,6); g.fillRect(5,50,8,5); g.fillRect(75,100,10,6);
    for (let i = 0; i < 12; i++) {
      const px = (i*43+19)%S, py = (i*61+31)%S;
      g.fillRect(px, py, 2+(i%2), 2);
    }
    // Layer 5: Exposed dirt/mud
    g.fillStyle(0x5a4020, 0.18);
    g.fillRect(48,22,12,6); g.fillRect(8,55,8,5); g.fillRect(80,105,10,6);
    // Layer 6: Green stipple noise for forest floor texture
    for (let i = 0; i < 100; i++) {
      const px = (i*47+23)%S, py = (i*41+17)%S;
      g.fillStyle([0x3a5a28,0x2a4a18,0x4a6a30,0x354e22][i%4], 0.25);
      g.fillRect(px, py, 1, 1);
    }
    // Layer 7: Dappled light (bright spots through canopy)
    g.fillStyle(0x6a9a4a, 0.12);
    g.fillRect(20,25,8,6); g.fillRect(70,55,10,7); g.fillRect(45,90,9,6);
    g.fillRect(95,40,7,5); g.fillRect(15,80,8,5);
    g.fillStyle(0x80aa58, 0.08);
    g.fillRect(22,27,4,3); g.fillRect(72,57,5,3); g.fillRect(47,92,4,3);
    // Layer 8: Dark undergrowth shadows
    g.fillStyle(0x1a2a10, 0.1);
    g.fillRect(55,15,12,6); g.fillRect(110,70,10,5); g.fillRect(25,105,11,5);
    g.generateTexture('bg_mountain', S, S); g.destroy();

    // ====== SPRINT — dark asphalt/concrete city circuit zone ======
    g = this.add.graphics();
    // Base: dark asphalt grey
    for (let y = 0; y < S; y++) {
      const t = y / S;
      const v = Math.floor(0x4a + (0x42-0x4a)*t + Math.sin(y*0.2)*3);
      g.fillStyle((v<<16)|(v<<8)|v);
      g.fillRect(0, y, S, 1);
    }
    // Asphalt aggregate noise — stipple pattern (1px dots)
    for (let i = 0; i < 200; i++) {
      const px = (i*41+17)%S, py = (i*59+23)%S;
      const shade = [0x555558, 0x3a3a3e, 0x4e4e52, 0x424246, 0x505054, 0x383840][i%6];
      g.fillStyle(shade, 0.5);
      g.fillRect(px, py, 1+(i%3===0?1:0), 1);
    }
    // Subtle concrete seam lines (horizontal, faint)
    g.fillStyle(0x555558, 0.12);
    for (let y = 31; y < S; y += 32) {
      g.fillRect(0, y, S, 1);
    }
    // Vertical seam lines (faint)
    g.fillStyle(0x555558, 0.08);
    for (let x = 63; x < S; x += 64) {
      g.fillRect(x, 0, 1, S);
    }
    // Oil stain patches (very subtle dark spots)
    g.fillStyle(0x2a2a30, 0.15);
    g.fillRect(20,40,12,8); g.fillRect(80,90,10,6); g.fillRect(55,15,8,5);
    // Worn patches (slightly lighter concrete)
    g.fillStyle(0x5a5a5e, 0.1);
    g.fillRect(40,60,16,10); g.fillRect(90,20,14,8); g.fillRect(10,100,12,8);
    // Drain grate marks
    g.fillStyle(0x333338, 0.2);
    g.fillRect(100,70,6,3); g.fillRect(30,10,6,3);
    // 2px noise scatter for texture richness
    for (let i = 0; i < 80; i++) {
      const px = (i*53+29)%S, py = (i*37+41)%S;
      g.fillStyle(i%2===0 ? 0x4a4a50 : 0x3e3e44, 0.3);
      g.fillRect(px, py, 2, 1);
    }
    g.generateTexture('bg_sprint', S, S); g.destroy();
  }

  genScenery() {
    const _ = 0;
    let g;

    // === CACTUS — large saguaro with spines, shadow, flower ===
    g = this.add.graphics();
    const CG=0x2d8c4e, CD=0x1a6b35, CL=0x4aaf6a, CH=0x5cc87a, CS=0x157a30,
          CF=0xe83050, CY=0xf4d35e, CSh=0x0f5525;
    this.px(g, [
      [_,_,_,_,_,_,CG,CH,_,_,_,_,_,_],
      [_,_,_,_,_,CG,CL,CH,CG,_,_,_,_,_],
      [_,_,_,_,_,CG,CL,CG,CG,CF,_,_,_,_],
      [_,_,_,_,_,CG,CG,CL,CG,_,_,_,_,_],
      [_,_,_,_,_,CD,CG,CL,CG,_,_,_,_,_],
      [_,CG,_,_,_,CD,CG,CG,CG,_,_,_,CG,_],
      [CG,CL,CH,_,_,CG,CL,CG,CG,_,_,CH,CL,CG],
      [CG,CG,CG,_,_,CG,CG,CL,CG,_,_,CG,CG,CG],
      [CS,CG,CL,CG,_,CD,CG,CG,CG,_,CG,CL,CG,CS],
      [_,CG,CG,CG,CG,CG,CL,CG,CG,CG,CG,CG,CG,_],
      [_,_,CS,_,_,CD,CG,CL,CG,CD,_,_,CS,_],
      [_,_,_,_,_,CSh,CG,CG,CG,CSh,_,_,_,_],
      [_,_,_,_,_,CSh,CD,CG,CD,CSh,_,_,_,_],
      [_,_,_,_,_,CSh,CD,CD,CD,CSh,_,_,_,_],
      [_,_,_,_,_,CSh,CD,CD,CD,CSh,_,_,_,_],
      [_,_,_,_,_,_,CSh,CSh,CSh,_,_,_,_,_],
    ], 2);
    g.generateTexture('cactus', 28, 32); g.destroy();

    // === DRY BUSH — detailed scrubby bush with branches ===
    g = this.add.graphics();
    const BG=0x8a9a30, BD=0x6a7a20, BL=0xaabc40, BH=0xc0d455, BSh=0x556818, BBr=0x6a5020;
    this.px(g, [
      [_,_,_,_,BL,BH,BL,_,_,_,_,_],
      [_,_,_,BG,BL,BG,BH,BG,_,_,_,_],
      [_,_,BG,BL,BH,BL,BG,BL,BG,_,_,_],
      [_,BG,BH,BG,BL,BH,BL,BG,BH,BG,_,_],
      [BG,BL,BG,BH,BG,BL,BG,BH,BG,BL,BG,_],
      [BD,BG,BL,BG,BD,BG,BD,BG,BL,BG,BD,_],
      [_,BD,BG,BD,BSh,BG,BSh,BD,BG,BD,_,_],
      [_,_,BSh,BBr,BD,BBr,BD,BBr,BSh,_,_,_],
      [_,_,_,_,BBr,BD,BBr,_,_,_,_,_],
      [_,_,_,_,_,BBr,_,_,_,_,_,_],
    ], 2);
    g.generateTexture('bush_dry', 24, 20); g.destroy();

    // === GREEN BUSH (riverbed) ===
    g = this.add.graphics();
    const GG=0x3a8a4a, GL=0x5aaa6a, GD=0x2a6a3a, GH=0x70c080, GSh=0x1a5028, GBr=0x4a3818;
    this.px(g, [
      [_,_,_,_,GL,GH,_,_,_,_],
      [_,_,_,GG,GH,GL,GG,_,_,_],
      [_,_,GG,GL,GG,GH,GL,GG,_,_],
      [_,GG,GH,GL,GG,GL,GG,GH,GG,_],
      [GG,GL,GG,GH,GL,GG,GH,GL,GG,GG],
      [GD,GG,GL,GG,GD,GL,GD,GG,GL,GD],
      [_,GD,GG,GD,GSh,GG,GSh,GD,GG,_],
      [_,_,GSh,GBr,GD,GBr,GD,GBr,_,_],
      [_,_,_,_,GBr,GD,GBr,_,_,_],
      [_,_,_,_,_,GBr,_,_,_,_],
    ], 2);
    g.generateTexture('bush_green', 20, 20); g.destroy();

    // === DESERT ROCK — tan/brown with cracks and highlight ===
    g = this.add.graphics();
    const DR1=0xaa9a7a, DR2=0x9a8a6a, DR3=0x8a7a5a, DR4=0x7a6a4a, DR5=0x6a5a3a,
          DRH=0xbbaa88, DRSh=0x5a4a2a, DRC=0x635530;
    this.px(g, [
      [_,_,_,DR2,DRH,DR2,_,_,_],
      [_,_,DR3,DR1,DRH,DR1,DR3,_,_],
      [_,DR4,DR2,DRH,DR1,DRH,DR2,DR4,_],
      [DR5,DR3,DR1,DRC,DRH,DR1,DR2,DR3,DR5],
      [DR5,DR4,DR2,DR1,DR2,DRC,DR3,DR4,DR5],
      [_,DR5,DR3,DR2,DR3,DR4,DR5,_,_],
      [_,_,DRSh,DR4,DR5,DRSh,_,_,_],
    ], 3);
    g.generateTexture('rock_desert', 27, 21); g.destroy();

    // === RED ROCK (canyon) ===
    g = this.add.graphics();
    const RR1=0xaa5a40, RR2=0x9a4a30, RR3=0x8a3a20, RR4=0x7a2a15, RR5=0x6a2010,
          RRH=0xbb6a50, RRSh=0x551a08, RRC=0x4a1508;
    this.px(g, [
      [_,_,_,RR2,RRH,RR2,_,_,_],
      [_,_,RR3,RR1,RRH,RR1,RR3,_,_],
      [_,RR4,RR2,RRH,RR1,RR2,RR3,RR4,_],
      [RR5,RR3,RR1,RRC,RRH,RR1,RR2,RR3,RR5],
      [RR5,RR4,RR2,RR3,RR2,RRC,RR3,RR4,RR5],
      [_,RR5,RR3,RR4,RR3,RR5,RRSh,_,_],
      [_,_,RRSh,RR5,RRSh,_,_,_,_],
    ], 3);
    g.generateTexture('rock_red', 27, 21); g.destroy();

    // === GREY ROCK (riverbed/mountain) with moss ===
    g = this.add.graphics();
    const GR1=0xaaaaaa, GR2=0x9a9a9a, GR3=0x8a8a8a, GR4=0x7a7a7a, GR5=0x6a6a6a,
          GRH=0xbbbbbb, GRSh=0x5a5a5a, GRM=0x5a7a50;
    this.px(g, [
      [_,_,_,GR2,GRH,GR2,_,_],
      [_,_,GR3,GR1,GRH,GR1,GR3,_],
      [_,GR4,GR2,GRH,GR1,GR2,GR4,_],
      [GR5,GR3,GR1,GR2,GRM,GR3,GR4,GR5],
      [GR5,GR4,GR2,GR3,GR2,GR4,GR5,_],
      [_,GR5,GRSh,GR4,GR5,GRSh,_,_],
    ], 3);
    g.generateTexture('rock_grey', 24, 18); g.destroy();

    // === SKULL — detailed with jaw, teeth, eye sockets ===
    g = this.add.graphics();
    const S=0xe8e0d0, SL=0xf0ece0, SD=0xc8c0b0, SSh=0xa8a090, ST=0xd8d0c0, SJ=0xb8b0a0;
    this.px(g, [
      [_,_,_,S,SL,SL,S,_,_,_],
      [_,_,S,SL,SL,SL,SL,S,_,_],
      [_,S,SL,SL,S,S,SL,SL,S,_],
      [S,SL,SD,SSh,S,S,SSh,SD,SL,S],
      [S,SL,_,SSh,ST,ST,SSh,_,SL,S],
      [_,S,SL,SD,ST,ST,SD,SL,S,_],
      [_,S,SL,S,_,_,S,SL,S,_],
      [_,_,S,SD,SJ,SJ,SD,S,_,_],
      [_,_,_,SJ,SSh,SSh,SJ,_,_,_],
      [_,_,_,_,SJ,SJ,_,_,_,_],
    ], 2);
    g.generateTexture('skull', 20, 20); g.destroy();

    // === CANYON WALL — small angular rock formation (not bread!) ===
    g = this.add.graphics();
    const CW1=0xa87838, CW2=0x906828, CW3=0x785820, CW4=0x604818, CWSh=0x4a3510, CWH=0xc09048;
    // 8×8 pixel art at 2x = 16×16 rendered — small, angular
    this.px(g, [
      [_,_,CW3,CW2,CW1,CWH,_,_],
      [_,CW4,CW2,CWH,CW1,CW2,CW3,_],
      [CW4,CW3,CW1,CW2,CWH,CW1,CW3,CW4],
      [CWSh,CW4,CW2,CW1,CW2,CW3,CW4,CWSh],
      [_,CWSh,CW3,CW2,CW3,CW4,CWSh,_],
      [_,_,CWSh,CW4,CW4,CWSh,_,_],
    ], 2);
    g.generateTexture('canyon_wall', 16, 12); g.destroy();

    // === BOULDER RED (canyon) — irregular with color variation ===
    g = this.add.graphics();
    const BR1=0xaa5a45, BR2=0x9a4a35, BR3=0x8a3a25, BR4=0x7a2a15, BR5=0x6a2010,
          BRH=0xbb6a55, BRSh=0x5a1a0a, BRC=0x4a1508;
    this.px(g, [
      [_,_,_,_,_,BR2,BRH,BR2,_,_],
      [_,_,_,BR4,BR3,BR1,BRH,BR2,BR3,_],
      [_,_,BR5,BR3,BR1,BRH,BR1,BR2,BR4,BR5],
      [_,BR5,BR3,BRH,BR1,BR2,BRH,BR1,BR3,BR5],
      [BRSh,BR4,BR2,BR1,BRH,BR1,BR2,BR3,BR4,BRC],
      [_,BR5,BR3,BR4,BR2,BRC,BR3,BR4,BR5,_],
      [_,_,BRSh,BR5,BR4,BR5,BRSh,_,_,_],
    ], 3);
    g.generateTexture('boulder_red', 30, 21); g.destroy();

    // === DEAD TREE — detailed with texture, moss hints ===
    g = this.add.graphics();
    const T=0xb0a080, TL=0xc8b898, TD=0x908060, TSh=0x706040, TM=0x6a8a50;
    this.px(g, [
      [_,_,TL,_,_,_,_,_,_,TL,_,_],
      [_,T,TL,_,_,_,_,_,TL,T,_,_],
      [_,_,T,TD,_,_,_,TD,T,_,_,_],
      [_,_,_,T,T,_,T,T,_,_,_,_],
      [_,_,_,_,T,TL,T,_,_,_,_,_],
      [_,_,_,_,T,TL,T,_,_,_,_,_],
      [_,_,_,_,TD,T,TD,_,_,_,_,_],
      [_,_,_,_,TD,T,TD,_,_,_,_,_],
      [_,_,_,_,TD,TL,TD,_,_,_,_,_],
      [_,_,_,_,TSh,T,TSh,_,_,_,_,_],
      [_,_,_,_,TSh,TD,TSh,_,_,_,_,_],
      [_,_,_,_,TSh,TM,TSh,_,_,_,_,_],
      [_,_,_,_,_,TSh,_,_,_,_,_,_],
    ], 2);
    g.generateTexture('dead_tree', 24, 26); g.destroy();

    // === PINE TREE (mountain) — layered with snow + shadow underneath ===
    g = this.add.graphics();
    // Ground shadow (ellipse beneath tree)
    g.fillStyle(0x0a1a08, 0.3);
    g.fillEllipse(12, 30, 18, 6);
    const PG=0x1a4a25, PL=0x2a6a35, PD=0x0a3015, PT=0x5a3a15, PTd=0x4a2a0a,
          PH=0x3a8a45, PSn=0xd8e8f0, PSh=0x082510;
    this.px(g, [
      [_,_,_,_,_,PD,PD,_,_,_,_,_],
      [_,_,_,_,PD,PSn,PSn,PD,_,_,_,_],
      [_,_,_,PD,PG,PL,PL,PG,PD,_,_,_],
      [_,_,PSh,PG,PL,PH,PH,PL,PG,PSh,_,_],
      [_,PSh,PD,PG,PH,PL,PL,PH,PG,PD,PSh,_],
      [_,_,_,_,PD,PSn,PSn,PD,_,_,_,_],
      [_,_,_,PD,PG,PL,PL,PG,PD,_,_,_],
      [_,_,PSh,PG,PL,PH,PH,PL,PG,PSh,_,_],
      [_,PSh,PD,PG,PH,PL,PL,PH,PG,PD,PSh,_],
      [PSh,PD,PG,PL,PH,PG,PG,PH,PL,PG,PD,PSh],
      [_,_,_,_,_,PT,PT,_,_,_,_,_],
      [_,_,_,_,_,PT,PTd,_,_,_,_,_],
      [_,_,_,_,_,PTd,PT,_,_,_,_,_],
    ], 2);
    g.generateTexture('pine_tree', 24, 34); g.destroy();

    // === MOUNTAIN ROCK — blue-grey with snow cap, more detail ===
    g = this.add.graphics();
    const MR=0x5a6070, ML=0x7a8090, MD=0x4a5060, MS=0xd0d8e8,
          MH=0x8a90a0, MSh=0x3a4050, MSL=0xe0e8f0, MRm=0x6a7080;
    this.px(g, [
      [_,_,_,_,MS,MSL,MS,_,_,_,_],
      [_,_,_,MS,MSL,MS,MSL,MS,_,_,_],
      [_,_,MS,ML,MH,ML,MH,ML,MS,_,_],
      [_,MR,ML,MH,ML,MR,ML,MH,ML,MR,_],
      [MR,MRm,ML,MR,MD,MRm,MD,MR,ML,MRm,MR],
      [MD,MR,MRm,MD,MSh,MD,MSh,MD,MRm,MR,MD],
      [MSh,MD,MR,MD,MSh,MSh,MSh,MD,MR,MD,MSh],
      [_,MSh,MD,MSh,MSh,MSh,MSh,MSh,MD,MSh,_],
    ], 3);
    g.generateTexture('mountain_rock', 33, 24); g.destroy();

    // === SNOW PATCH (mountain) — sparkle effect ===
    g = this.add.graphics();
    g.fillStyle(0xd0d8e8, 0.45);
    g.fillCircle(10,7,9);
    g.fillStyle(0xe0e8f0, 0.35);
    g.fillCircle(11,6,6);
    g.fillStyle(0xf0f4ff, 0.25);
    g.fillCircle(9,5,3);
    // Sparkle dots
    g.fillStyle(0xffffff, 0.6);
    g.fillRect(6,4,1,1); g.fillRect(12,3,1,1); g.fillRect(14,7,1,1);
    g.fillRect(8,8,1,1); g.fillRect(4,6,1,1);
    g.generateTexture('snow_patch', 20, 14); g.destroy();

    // === PALM — detailed leaves with multiple layers, textured trunk, shadow ===
    g = this.add.graphics();
    // Ground shadow
    g.fillStyle(0x0a1a08, 0.25);
    g.fillEllipse(12, 28, 16, 5);
    const PaT=0x8b5e14, PaTd=0x704a0e, PaTl=0xa67018, PaL=0x1a8a30, PaH=0x2aaa40,
          PaLd=0x0e6a20, PaCo=0x7a5a20, PaCoH=0x8a6a28, PaLx=0x35c050, PaTr=0x604008;
    this.px(g, [
      [_,PaLd,_,PaL,_,_,_,_,PaL,_,PaLd,_],
      [PaLd,PaL,PaLd,PaH,PaL,_,_,PaL,PaH,PaLd,PaL,PaLd],
      [_,PaLd,PaL,PaH,PaLx,PaL,PaL,PaLx,PaH,PaL,PaLd,_],
      [PaLd,PaL,PaH,PaL,PaH,PaLx,PaLx,PaH,PaL,PaH,PaL,PaLd],
      [PaL,PaH,PaLx,PaL,PaH,PaL,PaL,PaH,PaL,PaLx,PaH,PaL],
      [_,PaL,PaH,PaL,PaCo,PaCoH,PaCoH,PaCo,PaL,PaH,PaL,_],
      [_,_,PaL,PaLd,PaCoH,PaCo,PaCo,PaCoH,PaLd,PaL,_,_],
      [_,_,_,_,_,PaT,PaTl,_,_,_,_,_],
      [_,_,_,_,_,PaTd,PaT,_,_,_,_,_],
      [_,_,_,_,_,PaT,PaTr,_,_,_,_,_],
      [_,_,_,_,_,PaTd,PaT,_,_,_,_,_],
      [_,_,_,_,_,PaT,PaTl,_,_,_,_,_],
      [_,_,_,_,_,PaTd,PaTr,_,_,_,_,_],
    ], 2);
    g.generateTexture('palm', 24, 30); g.destroy();

    // Flags — detailed checker pattern
    g = this.add.graphics();
    g.fillStyle(0x555555); g.fillRect(2,0,3,32);
    g.fillStyle(0x777777); g.fillRect(3,0,1,32);
    for (let r=0;r<7;r++) for (let c=0;c<6;c++) {
      g.fillStyle((r+c)%2===0?0xffffff:0xe63946);
      g.fillRect(5+c*4,1+r*4,4,4);
    }
    // Flag shadow
    g.fillStyle(0x000000, 0.1); g.fillRect(5,1,24,28);
    g.generateTexture('cp_flag', 30, 32); g.destroy();

    // Finish banner — wider, sharper checkerboard
    g = this.add.graphics();
    for (let r=0;r<5;r++) for (let c=0;c<28;c++) {
      g.fillStyle((r+c)%2===0?0xffffff:0x111111);
      g.fillRect(c*6,r*5,6,5);
    }
    // Top/bottom border
    g.fillStyle(0xe63946); g.fillRect(0,0,168,1); g.fillRect(0,24,168,1);
    g.generateTexture('finish_banner', 168, 25); g.destroy();

    // === STONE WALL (sprint zone roadside) ===
    g = this.add.graphics();
    const SW1=0x8a8a80, SW2=0x7a7a70, SW3=0x6a6a60, SW4=0x5a5a50, SWH=0x9a9a90;
    // Low stone wall, 12x4 at 2x = 24x8
    this.px(g, [
      [SW3,SW2,SWH,SW1,SW2,SW3,SW1,SWH,SW2,SW3,SW2,SW1],
      [SW4,SW3,SW2,SWH,SW1,SW2,SWH,SW1,SW3,SW2,SW3,SW4],
      [SW3,SW4,SW3,SW2,SW3,SW4,SW2,SW3,SW4,SW3,SW4,SW3],
      [SW4,SW4,SW4,SW3,SW4,SW3,SW4,SW4,SW3,SW4,SW3,SW4],
    ], 2);
    g.generateTexture('stone_wall', 24, 8); g.destroy();

    // === GRANDSTAND — small bleacher section for sprint zone ===
    g = this.add.graphics();
    const GS1=0x8a8a80, GS2=0x7a7a70, GS3=0x6a6a60, GSt=0x9a9a90;
    // 3 tiered rows
    g.fillStyle(GS3); g.fillRect(0, 0, 20, 3);
    g.fillStyle(GS2); g.fillRect(1, 3, 18, 3);
    g.fillStyle(GS1); g.fillRect(2, 6, 16, 3);
    g.fillStyle(GSt); g.fillRect(3, 9, 14, 2);
    // Tiny colored dots for seated crowd
    const seatColors = [0xe63946,0x1a8aff,0xf4d35e,0x2dd4a8,0xff6b35,0xffffff];
    for (let row = 0; row < 3; row++) {
      for (let seat = 0; seat < 5; seat++) {
        g.fillStyle(seatColors[(row*5+seat)%6]);
        g.fillRect(3+seat*3, row*3+1, 2, 1);
      }
    }
    g.generateTexture('grandstand', 20, 11); g.destroy();

    // Warning sign
    g = this.add.graphics();
    g.fillStyle(0xf4d35e);
    g.fillTriangle(12,0,0,22,24,22);
    g.fillStyle(0x222222);
    g.fillTriangle(12,4,3,20,21,20);
    g.fillStyle(0xf4d35e);
    g.fillRect(11,8,2,6); g.fillRect(11,16,2,2);
    g.generateTexture('warning_sign', 24, 24); g.destroy();

    // === CROWD PERSON — simple top-down spectator (various colors) ===
    const crowdColors = [0xe63946, 0x1a8aff, 0xf4d35e, 0x2dd4a8, 0xff6b35, 0xffffff, 0x8855cc];
    for (let ci = 0; ci < crowdColors.length; ci++) {
      g = this.add.graphics();
      const cc = crowdColors[ci];
      const skin = 0xe8c090;
      // Head (circle-ish)
      g.fillStyle(skin); g.fillRect(2,0,4,4);
      // Hair
      g.fillStyle(0x3a2a18); g.fillRect(2,0,4,1);
      // Body/shirt
      g.fillStyle(cc); g.fillRect(1,4,6,5);
      // Arms
      g.fillStyle(cc); g.fillRect(0,5,1,3); g.fillRect(7,5,1,3);
      // Legs
      g.fillStyle(0x2b2d42); g.fillRect(2,9,2,3); g.fillRect(4,9,2,3);
      g.generateTexture(`crowd_${ci}`, 8, 12); g.destroy();
    }

    // === CROWD with raised arms (cheering) ===
    for (let ci = 0; ci < crowdColors.length; ci++) {
      g = this.add.graphics();
      const cc = crowdColors[ci];
      const skin = 0xe8c090;
      g.fillStyle(skin); g.fillRect(2,2,4,4);
      g.fillStyle(0x3a2a18); g.fillRect(2,2,4,1);
      // Raised arms
      g.fillStyle(skin); g.fillRect(0,0,1,3); g.fillRect(7,0,1,3);
      g.fillStyle(cc); g.fillRect(1,6,6,5);
      g.fillStyle(0x2b2d42); g.fillRect(2,11,2,3); g.fillRect(4,11,2,3);
      g.generateTexture(`crowd_cheer_${ci}`, 8, 14); g.destroy();
    }
  }

  genObstacles() {
    let g;
    const _ = 0;

    // Sand pile — golden mound with shadow and highlight
    g = this.add.graphics();
    const SP1=0xf0d070, SP2=0xe8c060, SP3=0xdab050, SP4=0xc4a040, SP5=0xb09030,
          SPH=0xf8e088, SPSh=0xa08028;
    this.px(g, [
      [_,_,_,_,SP2,SPH,SP1,SP2,_,_,_],
      [_,_,SP3,SP2,SPH,SP1,SPH,SP2,SP3,_,_],
      [_,SP4,SP3,SP2,SP1,SPH,SP1,SP2,SP3,SP4,_],
      [SP5,SP4,SP3,SP2,SP1,SP2,SP3,SP4,SP5,SPSh,_],
      [_,SP5,SP4,SP3,SP4,SP3,SP4,SP5,SPSh,_,_],
    ], 2);
    g.generateTexture('obs_sand_pile', 22, 10); g.destroy();

    // Tumbleweed — spiky ball with depth
    g = this.add.graphics();
    g.fillStyle(0x8b6530); g.fillCircle(9,9,8);
    g.fillStyle(0x9a7540, 0.5); g.fillCircle(8,7,5);
    g.fillStyle(0x6b4520, 0.4); g.fillCircle(11,11,4);
    g.lineStyle(1, 0x6b4520, 0.8); g.strokeCircle(9,9,8);
    g.lineStyle(1, 0x7a5525);
    [0,45,90,135,180,225,270,315].forEach(a => {
      const r = Phaser.Math.DegToRad(a);
      g.beginPath();
      g.moveTo(9+Math.cos(r)*3, 9+Math.sin(r)*3);
      g.lineTo(9+Math.cos(r)*9, 9+Math.sin(r)*9);
      g.strokePath();
    });
    g.generateTexture('obs_tumbleweed', 18, 18); g.destroy();

    // Small rock on road
    g = this.add.graphics();
    const SR1=0x7a6a5a, SR2=0x6a5a4a, SR3=0x5a4a3a, SR4=0x4a3a2a, SRH=0x8a7a6a, SRA=0x7a3030;
    this.px(g, [
      [_,_,_,SR2,SRH,SR2,_],
      [_,SR3,SR2,SRA,SRH,SR1,SR3],
      [SR4,SR3,SR1,SRH,SR2,SR3,SR4],
      [_,SR4,SR3,SR2,SR3,SR4,_],
    ], 3);
    g.generateTexture('obs_small_rock', 21, 12); g.destroy();

    // Fallen rock — large dark boulder
    g = this.add.graphics();
    const FR1=0x7a5040, FR2=0x6a4030, FR3=0x5a3020, FR4=0x4a2010, FR5=0x3a1508,
          FRH=0x8a6050, FRSh=0x2a0a04;
    this.px(g, [
      [_,_,_,FR2,FRH,FR2,FR2,_,_],
      [_,_,FR3,FR1,FRH,FR1,FR2,FR3,_],
      [_,FR4,FR2,FRH,FR1,FRH,FR2,FR3,FR4],
      [FR5,FR3,FR1,FR2,FRH,FR2,FR1,FR3,FR5],
      [_,FR4,FR2,FR3,FR2,FR3,FR4,FRSh,_],
      [_,_,FR5,FR4,FR5,FRSh,_,_,_],
    ], 3);
    g.generateTexture('obs_fallen_rock', 27, 18); g.destroy();

    // Rock debris
    g = this.add.graphics();
    g.fillStyle(0x5a3525); g.fillCircle(5,10,4); g.fillCircle(14,6,5);
    g.fillCircle(24,10,4); g.fillCircle(12,15,3);
    g.fillStyle(0x6a4535,0.6); g.fillCircle(6,9,3); g.fillCircle(15,5,3);
    g.fillStyle(0x7a5545,0.3); g.fillCircle(14,4,2); g.fillCircle(5,8,2);
    g.fillStyle(0x4a2515,0.4); g.fillCircle(24,11,2); g.fillCircle(12,16,2);
    g.generateTexture('obs_rock_debris', 28, 20); g.destroy();

    // Puddle — bright blue with depth (smaller)
    g = this.add.graphics();
    g.fillStyle(0x2a6a8a,0.7); g.fillCircle(12,8,10);
    g.fillStyle(0x3a8aaa,0.6); g.fillCircle(11,7,8);
    g.fillStyle(0x4aaacc,0.5); g.fillCircle(10,6,5);
    g.fillStyle(0x6accee,0.3); g.fillCircle(9,5,3);
    g.fillStyle(0x8aeeff,0.2); g.fillCircle(9,5,1);
    g.lineStyle(1, 0x2a6a8a, 0.4); g.strokeCircle(12,8,10);
    g.generateTexture('obs_puddle', 24, 16); g.destroy();

    // Mud patch — brown wet area (smaller)
    g = this.add.graphics();
    g.fillStyle(0x2a1a0a,0.7); g.fillCircle(12,9,10);
    g.fillStyle(0x3a2a15,0.6); g.fillCircle(11,8,8);
    g.fillStyle(0x4a3a20,0.4); g.fillCircle(10,7,6);
    g.fillStyle(0x6a5a30,0.25); g.fillCircle(10,7,4);
    g.fillStyle(0x8a7a40,0.15); g.fillCircle(9,6,2);
    g.lineStyle(1, 0x2a1a0a, 0.35); g.strokeCircle(12,9,10);
    g.generateTexture('obs_mud_patch', 24, 18); g.destroy();

    // Log — clear wooden log with rings
    g = this.add.graphics();
    const LG1=0x9a7a50, LG2=0x8a6a40, LG3=0x7a5a30, LG4=0x6a4a20, LG5=0x5a3a10,
          LGH=0xaa8a60, LGR=0x6a5a35;
    this.px(g, [
      [_,_,_,LG3,LG2,LGH,LG2,LG2,LGH,LG3,_,_],
      [_,LG5,LG4,LG2,LGH,LG1,LGH,LG1,LGH,LG2,LG4,LG5],
      [LG5,LG4,LG3,LGR,LG2,LGH,LG2,LGH,LG2,LGR,LG3,LG5],
      [_,LG5,LG4,LG3,LG4,LG3,LG4,LG3,LG4,LG3,LG5,_],
    ], 2);
    g.generateTexture('obs_log', 24, 8); g.destroy();

    // Rock slide — pile of grey rocks (smaller)
    g = this.add.graphics();
    g.fillStyle(0x5a5a60); g.fillCircle(6,11,5);
    g.fillCircle(15,7,7); g.fillCircle(24,11,5);
    g.fillStyle(0x6a6a70,0.6); g.fillCircle(7,10,4); g.fillCircle(16,6,5);
    g.fillStyle(0x7a7a80,0.3); g.fillCircle(15,5,3); g.fillCircle(7,9,2);
    g.fillStyle(0x8a8a90,0.2); g.fillCircle(16,4,2);
    g.lineStyle(1, 0x4a4a50, 0.3); g.strokeCircle(15,7,7);
    g.fillStyle(0x4a4a50,0.4); g.fillCircle(24,12,2);
    g.generateTexture('obs_rock_slide', 30, 18); g.destroy();

    // Pothole — dark circle with edge
    g = this.add.graphics();
    g.fillStyle(0x4a4a45,0.6); g.fillCircle(12,10,11);
    g.fillStyle(0x3a3a38,0.7); g.fillCircle(12,10,8);
    g.fillStyle(0x2a2a28,0.5); g.fillCircle(12,10,5);
    g.fillStyle(0x1a1a18,0.4); g.fillCircle(12,10,2);
    g.lineStyle(1, 0x5a5a55, 0.3); g.strokeCircle(12,10,11);
    g.generateTexture('obs_pothole', 24, 22); g.destroy();

    // === TOKAMAK LOGO — enhanced blue striped torus with 3D feel ===
    g = this.add.graphics();
    const B1=0x4a90e2, B2=0x3b82f6, B3=0x2563eb, BW=0xffffff, BD=0x1d4ed8,
          BH=0x6ab0ff, BSh=0x1a3aaa, BM=0x5098ee, BWs=0xddecff;
    this.px(g, [
      [_,_,_,_,_,B1,BM,B2,BM,B1,_,_,_,_,_],
      [_,_,_,B1,BM,BH,BW,BH,BW,BH,BM,B1,_,_,_],
      [_,_,B2,BH,BW,BM,BH,BW,BM,BW,BH,B2,_,_,_],
      [_,B1,BH,BW,BWs,_,_,_,_,BWs,BW,BH,B1,_,_],
      [B1,BM,BH,_,_,_,_,_,_,_,BH,BM,B2,_,_],
      [B2,B1,BM,_,_,_,_,_,_,_,BM,B2,BSh,_,_],
      [BD,B2,BSh,_,_,_,_,_,_,_,BSh,BD,BSh,_,_],
      [_,BD,B2,BSh,_,_,_,_,BSh,B2,BD,_,_,_,_],
      [_,_,BD,B2,BM,B1,BM,B2,BD,BSh,_,_,_,_,_],
      [_,_,_,BD,BSh,B2,BD,BSh,BSh,_,_,_,_,_,_],
    ], 2);
    g.generateTexture('obs_tokamak', 30, 20); g.destroy();

    // Dust particle (sand)
    g = this.add.graphics();
    g.fillStyle(0xd4b880,0.5); g.fillCircle(4,4,4);
    g.fillStyle(0xe8cc98,0.3); g.fillCircle(3,3,2);
    g.generateTexture('dust_particle', 8, 8); g.destroy();

    // Canyon dust (reddish)
    g = this.add.graphics();
    g.fillStyle(0xaa6040,0.5); g.fillCircle(4,4,4);
    g.fillStyle(0xcc8060,0.3); g.fillCircle(3,3,2);
    g.generateTexture('dust_canyon', 8, 8); g.destroy();

    // Water splash (blue)
    g = this.add.graphics();
    g.fillStyle(0x4aaacc,0.6); g.fillCircle(4,4,4);
    g.fillStyle(0x8aeeff,0.4); g.fillCircle(3,3,2);
    g.generateTexture('splash_particle', 8, 8); g.destroy();

    // Snow particle
    g = this.add.graphics();
    g.fillStyle(0xe8f0f8,0.7); g.fillCircle(3,3,3);
    g.fillStyle(0xffffff,0.5); g.fillCircle(2,2,1);
    g.generateTexture('snow_particle', 6, 6); g.destroy();

    // Tire smoke (grey-white)
    g = this.add.graphics();
    g.fillStyle(0xcccccc,0.4); g.fillCircle(5,5,5);
    g.fillStyle(0xeeeeee,0.25); g.fillCircle(4,4,3);
    g.generateTexture('smoke_particle', 10, 10); g.destroy();

    // Skidmark segment (dark)
    g = this.add.graphics();
    g.fillStyle(0x222222,0.3); g.fillRect(0,0,4,4);
    g.generateTexture('skid_particle', 4, 4); g.destroy();
  }

  genUI() {
    const g = this.add.graphics();
    g.fillStyle(0xe63946, 0.2); g.fillRect(0,0,800,600);
    g.generateTexture('time_warning', 800, 600); g.destroy();
  }
}
