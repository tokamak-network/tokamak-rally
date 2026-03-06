import Phaser from 'phaser';
import { CARS, CAR_PIXELS } from './Cars.js';

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

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
        g.generateTexture(`car_${car.id}`, 20, 30);
        g.destroy();
      }
    }
    // Also generate default 'car_player' as alpine_white
    const g2 = this.add.graphics();
    this.px(g2, CAR_PIXELS['alpine_white'], 2);
    g2.generateTexture('car_player', 20, 30);
    g2.destroy();
  }

  genBackgrounds() {
    // DESERT — warm orange sand with ripple lines
    let g = this.add.graphics();
    g.fillStyle(0xe8b84b); g.fillRect(0,0,64,64);
    g.fillStyle(0xd4a03a, 0.5);
    for (let y = 0; y < 64; y += 8) g.fillRect(0, y, 64, 1);
    g.fillStyle(0xf0c860, 0.3);
    g.fillRect(5,10,12,1); g.fillRect(30,25,18,1); g.fillRect(15,45,14,1);
    g.generateTexture('bg_desert', 64, 64); g.destroy();

    // CANYON — deep red layered rock
    g = this.add.graphics();
    g.fillStyle(0x8b3a2a); g.fillRect(0,0,64,64);
    g.fillStyle(0x9b4a35,0.6); g.fillRect(0,0,64,16);
    g.fillStyle(0x7a2a1a,0.4); g.fillRect(0,16,64,16);
    g.fillStyle(0xa05030,0.5); g.fillRect(0,32,64,16);
    g.fillStyle(0x6b2015,0.3); g.fillRect(0,48,64,16);
    g.generateTexture('bg_canyon', 64, 64); g.destroy();

    // RIVERBED — cracked dry earth
    g = this.add.graphics();
    g.fillStyle(0xb8a080); g.fillRect(0,0,64,64);
    g.lineStyle(1, 0x8a7560, 0.5);
    g.beginPath();
    g.moveTo(0,20); g.lineTo(32,24); g.lineTo(64,18);
    g.moveTo(0,45); g.lineTo(28,50); g.lineTo(64,42);
    g.moveTo(20,0); g.lineTo(24,32); g.lineTo(18,64);
    g.moveTo(48,0); g.lineTo(44,35); g.lineTo(50,64);
    g.strokePath();
    g.generateTexture('bg_riverbed', 64, 64); g.destroy();

    // MOUNTAIN — blue-grey with snow
    g = this.add.graphics();
    g.fillStyle(0x6a7080); g.fillRect(0,0,64,64);
    g.fillStyle(0x5a6070,0.5); g.fillRect(0,0,32,32); g.fillRect(32,32,32,32);
    g.fillStyle(0x7a8090,0.3); g.fillRect(32,0,32,32); g.fillRect(0,32,32,32);
    g.fillStyle(0xd0d8e0,0.2); g.fillRect(10,5,20,4); g.fillRect(40,40,16,3);
    g.generateTexture('bg_mountain', 64, 64); g.destroy();

    // SPRINT — golden sunset
    g = this.add.graphics();
    g.fillStyle(0xdaa520); g.fillRect(0,0,64,64);
    g.fillStyle(0xf0c040,0.3);
    for (let y = 0; y < 64; y += 12) g.fillRect(0, y, 64, 3);
    g.generateTexture('bg_sprint', 64, 64); g.destroy();
  }

  genScenery() {
    const _ = 0;
    let g;

    // === CACTUS — clear saguaro shape ===
    g = this.add.graphics();
    const CG=0x2d8c4e, CD=0x1a6b35, CL=0x4aaf6a;
    this.px(g, [
      [_,_,_,_,_,CG,CG,_,_,_,_,_],
      [_,_,_,_,CG,CL,CG,CG,_,_,_,_],
      [_,_,_,_,CG,CG,CG,CG,_,_,_,_],
      [_,_,_,_,CG,CL,CG,CG,_,_,_,_],
      [_,CG,_,_,CG,CG,CG,CG,_,_,CG,_],
      [CG,CL,CG,_,CG,CL,CG,CG,_,CG,CL,CG],
      [CG,CG,CG,_,CG,CG,CG,CG,_,CG,CG,CG],
      [_,CG,CG,CG,CG,CL,CG,CG,CG,CG,CG,_],
      [_,_,_,_,CG,CG,CG,CG,_,_,_,_],
      [_,_,_,_,CG,CL,CG,CG,_,_,_,_],
      [_,_,_,_,CD,CD,CD,CD,_,_,_,_],
      [_,_,_,_,CD,CD,CD,CD,_,_,_,_],
    ], 2);
    g.generateTexture('cactus', 24, 24); g.destroy();

    // === DRY BUSH — clearly a scrubby bush ===
    g = this.add.graphics();
    const BG=0x8a9a30, BD=0x6a7a20, BL=0xaabc40;
    this.px(g, [
      [_,_,_,BG,BL,BG,_,_],
      [_,BG,BL,BG,BG,BL,BG,_],
      [BG,BG,BG,BL,BG,BG,BG,BG],
      [_,BG,BL,BG,BG,BL,BG,_],
      [_,_,BD,BG,BG,BD,_,_],
      [_,_,_,BD,BD,_,_,_],
    ], 2);
    g.generateTexture('bush_dry', 16, 12); g.destroy();

    // === GREEN BUSH (riverbed) ===
    g = this.add.graphics();
    const GG=0x3a8a4a, GL=0x5aaa6a, GD=0x2a6a3a;
    this.px(g, [
      [_,_,GG,GL,GG,_,_],
      [_,GG,GL,GG,GL,GG,_],
      [GG,GL,GG,GL,GG,GL,GG],
      [_,GG,GL,GG,GL,GG,_],
      [_,_,GD,GG,GD,_,_],
      [_,_,_,GD,_,_,_],
    ], 2);
    g.generateTexture('bush_green', 14, 12); g.destroy();

    // === DESERT ROCK — tan/brown, clear rock shape ===
    g = this.add.graphics();
    this.px(g, [
      [_,_,0x9a8a6a,0x9a8a6a,_,_],
      [_,0x8a7a5a,0xaa9a7a,0x9a8a6a,0x8a7a5a,_],
      [0x7a6a4a,0x8a7a5a,0xaa9a7a,0x9a8a6a,0x8a7a5a,0x7a6a4a],
      [_,0x7a6a4a,0x8a7a5a,0x8a7a5a,0x7a6a4a,_],
      [_,_,0x6a5a3a,0x6a5a3a,_,_],
    ], 3);
    g.generateTexture('rock_desert', 18, 15); g.destroy();

    // === RED ROCK (canyon) ===
    g = this.add.graphics();
    this.px(g, [
      [_,_,0x9a4a30,0x9a4a30,_,_],
      [_,0x8a3a20,0xaa5a40,0x9a4a30,0x8a3a20,_],
      [0x7a2a15,0x8a3a20,0xaa5a40,0x9a4a30,0x8a3a20,0x7a2a15],
      [_,0x7a2a15,0x8a3a20,0x8a3a20,0x7a2a15,_],
    ], 3);
    g.generateTexture('rock_red', 18, 12); g.destroy();

    // === GREY ROCK (riverbed/mountain) ===
    g = this.add.graphics();
    this.px(g, [
      [_,0x8a8a8a,0x9a9a9a,_],
      [0x7a7a7a,0x9a9a9a,0xaaaaaa,0x8a8a8a],
      [0x6a6a6a,0x8a8a8a,0x9a9a9a,0x7a7a7a],
      [_,0x6a6a6a,0x7a7a7a,_],
    ], 3);
    g.generateTexture('rock_grey', 12, 12); g.destroy();

    // === SKULL (desert detail — clear and cool) ===
    g = this.add.graphics();
    const S=0xe8e0d0, SD=0xc8c0b0;
    this.px(g, [
      [_,_,S,S,S,S,_,_],
      [_,S,S,S,S,S,S,_],
      [S,S,SD,S,S,SD,S,S],
      [S,S,_,S,S,_,S,S],
      [_,S,S,SD,SD,S,S,_],
      [_,_,S,_,_,S,_,_],
      [_,_,_,S,S,_,_,_],
    ], 2);
    g.generateTexture('skull', 16, 14); g.destroy();

    // === CANYON SPIRE — jagged rock spire ===
    g = this.add.graphics();
    const CS1=0x8b3520, CS2=0x9b4530, CS3=0x6b2510, CS4=0xa05535;
    this.px(g, [
      [_,_,_,_,CS1,_,_,_,_,_],
      [_,_,_,CS1,CS2,CS1,_,_,_,_],
      [_,_,CS3,CS1,CS4,CS2,CS1,_,_,_],
      [_,_,CS3,CS2,CS4,CS2,CS1,_,_,_],
      [_,CS3,CS1,CS2,CS4,CS2,CS1,CS3,_,_],
      [_,CS3,CS1,CS4,CS2,CS4,CS2,CS3,_,_],
      [CS3,CS1,CS2,CS4,CS2,CS4,CS1,CS3,CS1,_],
      [CS3,CS1,CS2,CS2,CS4,CS2,CS1,CS3,CS1,_],
      [CS3,CS1,CS1,CS2,CS2,CS1,CS1,CS3,CS1,CS3],
      [_,CS3,CS1,CS1,CS1,CS1,CS3,CS3,CS3,_],
      [_,_,CS3,CS3,CS3,CS3,CS3,_,_,_],
    ], 3);
    g.generateTexture('canyon_wall', 30, 33); g.destroy();

    // === BOULDER RED (canyon) — irregular rocky shape ===
    g = this.add.graphics();
    this.px(g, [
      [_,_,_,_,0x8a3a25,0x9a4a35,_,_],
      [_,_,0x7a2a15,0x8a3a25,0x9a4a35,0xaa5a45,0x8a3a25,_],
      [_,0x6a2010,0x8a3a25,0xaa5a45,0x9a4a35,0x8a3a25,0x7a2a15,0x6a2010],
      [0x5a1a0a,0x7a2a15,0x9a4a35,0x8a3a25,0xaa5a45,0x9a4a35,0x7a2a15,_],
      [_,0x6a2010,0x7a2a15,0x8a3a25,0x7a2a15,0x6a2010,_,_],
      [_,_,_,0x5a1a0a,0x6a2010,_,_,_],
    ], 3);
    g.generateTexture('boulder_red', 24, 18); g.destroy();

    // === DEAD TREE — bleached white branches ===
    g = this.add.graphics();
    const T=0xb0a080, TL=0xc8b898;
    this.px(g, [
      [_,_,T,_,_,_,TL,_],
      [_,T,TL,_,_,TL,T,_],
      [_,_,T,_,_,T,_,_],
      [_,_,_,T,T,_,_,_],
      [_,_,_,T,T,_,_,_],
      [_,_,_,T,T,_,_,_],
      [_,_,_,T,T,_,_,_],
      [_,_,_,T,TL,_,_,_],
    ], 2);
    g.generateTexture('dead_tree', 16, 16); g.destroy();

    // === PINE TREE (mountain) ===
    g = this.add.graphics();
    const PG=0x1a4a25, PL=0x2a6a35, PD=0x0a3015, PT=0x5a3a15;
    this.px(g, [
      [_,_,_,PD,PD,_,_,_],
      [_,_,PD,PG,PG,PD,_,_],
      [_,PD,PG,PL,PL,PG,PD,_],
      [PD,PG,PL,PG,PG,PL,PG,PD],
      [_,_,PD,PG,PG,PD,_,_],
      [_,PD,PG,PL,PL,PG,PD,_],
      [PD,PG,PL,PG,PG,PL,PG,PD],
      [_,_,_,PT,PT,_,_,_],
      [_,_,_,PT,PT,_,_,_],
    ], 2);
    g.generateTexture('pine_tree', 16, 18); g.destroy();

    // === MOUNTAIN ROCK — blue-grey with snow cap ===
    g = this.add.graphics();
    const MR=0x5a6070, ML=0x7a8090, MD=0x4a5060, MS=0xd0d8e8;
    this.px(g, [
      [_,_,_,MS,MS,MS,_,_,_],
      [_,_,MS,ML,ML,MS,MS,_,_],
      [_,MR,ML,ML,MR,ML,MR,MR,_],
      [MR,MR,ML,MR,MD,MR,ML,MR,MR],
      [MD,MR,MR,MD,MD,MD,MR,MR,MD],
      [_,MD,MD,MD,MD,MD,MD,MD,_],
    ], 3);
    g.generateTexture('mountain_rock', 27, 18); g.destroy();

    // === SNOW PATCH (mountain) ===
    g = this.add.graphics();
    g.fillStyle(0xd8e0e8, 0.5);
    g.fillCircle(8,6,7);
    g.fillStyle(0xe8f0f8, 0.3);
    g.fillCircle(9,5,5);
    g.generateTexture('snow_patch', 16, 12); g.destroy();

    // === PALM (oasis) ===
    g = this.add.graphics();
    const PaT=0x8b5e14, PaL=0x1a8a30, PaH=0x2aaa40;
    this.px(g, [
      [_,_,PaL,PaL,_,_,PaL,PaL,_,_],
      [_,PaL,PaH,PaL,PaL,PaL,PaL,PaH,PaL,_],
      [PaL,PaH,PaL,PaL,PaH,PaH,PaL,PaL,PaH,PaL],
      [_,PaL,PaL,PaL,PaH,PaH,PaL,PaL,PaL,_],
      [_,_,_,_,PaT,PaT,_,_,_,_],
      [_,_,_,_,PaT,PaT,_,_,_,_],
      [_,_,_,_,PaT,PaT,_,_,_,_],
      [_,_,_,_,PaT,PaT,_,_,_,_],
    ], 2);
    g.generateTexture('palm', 20, 16); g.destroy();

    // Flags
    g = this.add.graphics();
    g.fillStyle(0x666666); g.fillRect(2,0,3,28);
    for (let r=0;r<5;r++) for (let c=0;c<5;c++) {
      g.fillStyle((r+c)%2===0?0xffffff:0xe63946);
      g.fillRect(5+c*4,1+r*4,4,4);
    }
    g.generateTexture('cp_flag', 26, 28); g.destroy();

    g = this.add.graphics();
    for (let r=0;r<4;r++) for (let c=0;c<24;c++) {
      g.fillStyle((r+c)%2===0?0xffffff:0x111111);
      g.fillRect(c*6,r*5,6,5);
    }
    g.generateTexture('finish_banner', 144, 20); g.destroy();

    // Warning sign
    g = this.add.graphics();
    g.fillStyle(0xf4d35e);
    g.fillTriangle(10,0,0,18,20,18);
    g.fillStyle(0x222222);
    g.fillTriangle(10,4,3,16,17,16);
    g.fillStyle(0xf4d35e);
    g.fillRect(9,7,2,5); g.fillRect(9,13,2,2);
    g.generateTexture('warning_sign', 20, 20); g.destroy();
  }

  genObstacles() {
    let g;

    // Sand pile — golden mound, dark outline
    g = this.add.graphics();
    const _ = 0;
    this.px(g, [
      [_,_,_,0xf0d070,0xf0d070,0xf0d070,_,_,_],
      [_,0xdab050,0xe8c060,0xf0d070,0xf0d070,0xe8c060,0xdab050,_,_],
      [0xc4a040,0xdab050,0xe8c060,0xf0d070,0xe8c060,0xdab050,0xc4a040,0xb09030,_],
      [_,0xb09030,0xc4a040,0xdab050,0xc4a040,0xb09030,_,_,_],
    ], 2);
    g.generateTexture('obs_sand_pile', 18, 8); g.destroy();

    // Tumbleweed — spiky ball
    g = this.add.graphics();
    g.fillStyle(0x8b6530); g.fillCircle(8,8,7);
    g.lineStyle(1, 0x6b4520, 0.8); g.strokeCircle(8,8,7);
    g.lineStyle(1, 0x7a5525);
    [0,60,120,180,240,300].forEach(a => {
      const r = Phaser.Math.DegToRad(a);
      g.beginPath();
      g.moveTo(8+Math.cos(r)*3, 8+Math.sin(r)*3);
      g.lineTo(8+Math.cos(r)*8, 8+Math.sin(r)*8);
      g.strokePath();
    });
    g.generateTexture('obs_tumbleweed', 16, 16); g.destroy();

    // Small rock on road — dark with red accent
    g = this.add.graphics();
    this.px(g, [
      [_,_,0x5a4a3a,0x5a4a3a,_],
      [0x4a3a2a,0x6a5a4a,0x7a3030,0x6a5a4a,0x4a3a2a],
      [_,0x4a3a2a,0x5a4a3a,0x4a3a2a,_],
    ], 3);
    g.generateTexture('obs_small_rock', 15, 9); g.destroy();

    // Fallen rock — large dark boulder
    g = this.add.graphics();
    this.px(g, [
      [_,_,0x5a3020,0x5a3020,0x5a3020,_,_],
      [_,0x4a2010,0x6a4030,0x7a5040,0x6a4030,0x4a2010,_],
      [0x3a1508,0x4a2010,0x6a4030,0x7a5040,0x6a4030,0x4a2010,0x3a1508],
      [_,0x3a1508,0x4a2010,0x5a3020,0x4a2010,0x3a1508,_],
    ], 3);
    g.generateTexture('obs_fallen_rock', 21, 12); g.destroy();

    // Rock debris
    g = this.add.graphics();
    g.fillStyle(0x5a3525); g.fillCircle(4,8,3); g.fillCircle(12,5,4);
    g.fillCircle(20,9,3); g.fillCircle(10,13,3);
    g.fillStyle(0x6a4535,0.6); g.fillCircle(5,7,2); g.fillCircle(13,4,2);
    g.generateTexture('obs_rock_debris', 24, 16); g.destroy();

    // Puddle — bright blue, very clear
    g = this.add.graphics();
    g.fillStyle(0x3a8aaa,0.8); g.fillCircle(14,8,11);
    g.fillStyle(0x4aaacc,0.6); g.fillCircle(13,7,8);
    g.fillStyle(0x6accee,0.3); g.fillCircle(12,6,5);
    g.lineStyle(1, 0x2a6a8a, 0.5); g.strokeCircle(14,8,11);
    g.generateTexture('obs_puddle', 28, 18); g.destroy();

    // Mud patch — brown wet area
    g = this.add.graphics();
    g.fillStyle(0x3a2a15,0.8); g.fillCircle(16,10,12);
    g.fillStyle(0x4a3a20,0.5); g.fillCircle(15,9,9);
    g.fillStyle(0x6a5a30,0.3); g.fillCircle(14,8,5);
    g.lineStyle(1, 0x2a1a0a, 0.4); g.strokeCircle(16,10,12);
    g.generateTexture('obs_mud_patch', 30, 22); g.destroy();

    // Log — clear wooden log
    g = this.add.graphics();
    this.px(g, [
      [_,_,0x6a4a20,0x7a5a30,0x7a5a30,0x7a5a30,0x7a5a30,0x6a4a20,_,_],
      [0x5a3a10,0x6a4a20,0x8a6a40,0x9a7a50,0x8a6a40,0x9a7a50,0x8a6a40,0x7a5a30,0x6a4a20,0x5a3a10],
      [_,_,0x5a3a10,0x6a4a20,0x6a4a20,0x6a4a20,0x6a4a20,0x5a3a10,_,_],
    ], 2);
    g.generateTexture('obs_log', 20, 6); g.destroy();

    // Rock slide — pile of grey rocks
    g = this.add.graphics();
    g.fillStyle(0x5a5a60); g.fillCircle(8,12,6);
    g.fillCircle(18,8,8); g.fillCircle(28,14,5);
    g.fillStyle(0x6a6a70,0.6); g.fillCircle(10,11,4); g.fillCircle(20,7,5);
    g.fillStyle(0x7a7a80,0.3); g.fillCircle(18,6,3);
    g.lineStyle(1, 0x4a4a50, 0.3); g.strokeCircle(18,8,8);
    g.generateTexture('obs_rock_slide', 36, 22); g.destroy();

    // Pothole — dark circle
    g = this.add.graphics();
    g.fillStyle(0x3a3a38,0.8); g.fillCircle(10,8,9);
    g.fillStyle(0x2a2a28,0.5); g.fillCircle(10,8,6);
    g.fillStyle(0x1a1a18,0.3); g.fillCircle(10,8,3);
    g.lineStyle(1, 0x4a4a45, 0.4); g.strokeCircle(10,8,9);
    g.generateTexture('obs_pothole', 20, 18); g.destroy();

    // === TOKAMAK LOGO — blue striped torus obstacle ===
    g = this.add.graphics();
    const B1=0x4a90e2, B2=0x3b82f6, B3=0x2563eb, BW=0xffffff, BD=0x1d4ed8;
    this.px(g, [
      [_,_,_,_,B1,B2,B1,B2,B1,_,_,_,_],
      [_,_,B1,B2,BW,B1,BW,B2,BW,B1,_,_,_],
      [_,B2,BW,B1,B2,BW,B1,BW,B2,BW,B1,_,_],
      [B1,BW,B2,_,_,_,_,_,B1,BW,B2,B1,_],
      [B2,B1,_,_,_,_,_,_,_,B2,BW,B2,_],
      [B1,B2,_,_,_,_,_,_,_,B1,B2,B1,_],
      [_,B1,B2,_,_,_,_,_,B2,BW,B1,_,_],
      [_,_,B2,B1,BW,B2,BW,B1,BW,B2,_,_,_],
      [_,_,_,B2,B1,BW,B2,B1,B2,_,_,_,_],
    ], 2);
    g.generateTexture('obs_tokamak', 26, 18); g.destroy();

    // Dust particle
    g = this.add.graphics();
    g.fillStyle(0xd4b880,0.6); g.fillCircle(3,3,3);
    g.generateTexture('dust_particle', 6, 6); g.destroy();
  }

  genUI() {
    const g = this.add.graphics();
    g.fillStyle(0xe63946, 0.2); g.fillRect(0,0,800,600);
    g.generateTexture('time_warning', 800, 600); g.destroy();
  }
}
