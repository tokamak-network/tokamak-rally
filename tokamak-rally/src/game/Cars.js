/**
 * Car definitions — v0.6: per-road-type maxSpeed, no maxSpeedMul
 */

export const CARS = [
  {
    id: 'alpine_white',
    name: 'ALPINE GT',
    team: 'Team Tokamak',
    desc: 'Balanced all-rounder. No weakness, no dominance.',
    color: '#f1faee',
    stats: {
      topSpeed: 6,
      cornering: 6,
      acceleration: 6,
      braking: 6,
      recovery: 6,
    },
    physics: {
      accelMul: 1.0,
      turnMul: 1.0,
      brakeMul: 1.0,
      obstaclePenaltyMul: 1.0,
      offroadMul: 1.0,
      roadMaxSpeed: { paved: 383, dirt: 317, sand: 262, rocky: 231, offroad: 179 },
    },
  },
  {
    id: 'hyper_blue',
    name: 'HYPER-N',
    team: 'Blue Shell Racing',
    desc: 'Extreme top speed. Weak cornering — for brave drivers.',
    color: '#1a8aff',
    stats: {
      topSpeed: 9,
      cornering: 4,
      acceleration: 7,
      braking: 5,
      recovery: 5,
    },
    physics: {
      accelMul: 1.1,
      turnMul: 0.82,
      brakeMul: 0.9,
      obstaclePenaltyMul: 1.0,
      offroadMul: 0.9,
      roadMaxSpeed: { paved: 455, dirt: 345, sand: 276, rocky: 238, offroad: 162 },
    },
  },
  {
    id: 'puma_orange',
    name: 'PUMA RS',
    team: 'M-Sport Rally',
    desc: 'Best cornering & braking. Slower on straights.',
    color: '#ff6b35',
    stats: {
      topSpeed: 5,
      cornering: 9,
      acceleration: 5,
      braking: 8,
      recovery: 5,
    },
    physics: {
      accelMul: 0.95,
      turnMul: 1.2,
      brakeMul: 1.25,
      obstaclePenaltyMul: 1.0,
      offroadMul: 0.95,
      roadMaxSpeed: { paved: 352, dirt: 307, sand: 255, rocky: 224, offroad: 173 },
    },
  },
  {
    id: 'tundra_red',
    name: 'TUNDRA X',
    team: 'Nordic Motorsport',
    desc: 'Tank-like durability. Obstacles barely slow it down.',
    color: '#e63946',
    stats: {
      topSpeed: 5,
      cornering: 5,
      acceleration: 5,
      braking: 6,
      recovery: 10,
    },
    physics: {
      accelMul: 0.95,
      turnMul: 0.95,
      brakeMul: 1.05,
      obstaclePenaltyMul: 0.5,
      offroadMul: 1.3,
      roadMaxSpeed: { paved: 369, dirt: 314, sand: 266, rocky: 238, offroad: 235 },
    },
  },
  {
    id: 'volt_green',
    name: 'VOLT EV',
    team: 'Electra Rally',
    desc: 'Insane acceleration. Burns out at top speed.',
    color: '#2dd4a8',
    stats: {
      topSpeed: 5,
      cornering: 6,
      acceleration: 10,
      braking: 7,
      recovery: 4,
    },
    physics: {
      accelMul: 1.35,
      turnMul: 1.0,
      brakeMul: 1.1,
      obstaclePenaltyMul: 1.15,
      offroadMul: 0.85,
      roadMaxSpeed: { paved: 362, dirt: 300, sand: 252, rocky: 217, offroad: 162 },
    },
  },
];

// Pixel art definitions for each car (10x15 grid, 2x scale = 20x30)
export const CAR_PIXELS = {
  alpine_white: (() => {
    const _=0,W=0xf1faee,R=0xe63946,B=0x1d3557,Y=0xf4d35e,D=0x2b2d42,G=0x6c757d,L=0xa8dadc,O=0xff6b35;
    return [
      [_,_,_,Y,Y,Y,Y,_,_,_],
      [_,_,G,W,W,W,W,G,_,_],
      [_,D,D,W,R,R,W,D,D,_],
      [_,D,D,B,B,B,B,D,D,_],
      [_,D,D,B,L,L,B,D,D,_],
      [_,_,G,W,R,R,W,G,_,_],
      [_,_,_,W,R,R,W,_,_,_],
      [_,_,_,W,R,R,W,_,_,_],
      [_,_,_,W,R,R,W,_,_,_],
      [_,_,G,W,R,R,W,G,_,_],
      [_,D,D,W,R,R,W,D,D,_],
      [_,D,D,W,R,R,W,D,D,_],
      [_,D,D,W,W,W,W,D,D,_],
      [_,_,G,O,G,G,O,G,_,_],
      [_,_,_,O,_,_,O,_,_,_],
    ];
  })(),
  hyper_blue: (() => {
    const _=0,Bl=0x1a8aff,Bd=0x0a5acc,Bk=0x0a3a88,W=0xffffff,R=0xe63946,D=0x2b2d42,G=0x555566,Y=0xf4d35e;
    return [
      [_,_,_,Y,Y,Y,Y,_,_,_],
      [_,_,G,Bl,Bl,Bl,Bl,G,_,_],
      [_,D,D,Bl,W,W,Bl,D,D,_],
      [_,D,D,Bk,Bk,Bk,Bk,D,D,_],
      [_,D,D,Bk,0x88bbff,0x88bbff,Bk,D,D,_],
      [_,_,G,Bl,R,R,Bl,G,_,_],
      [_,_,_,Bl,R,R,Bl,_,_,_],
      [_,_,_,Bd,Bl,Bl,Bd,_,_,_],
      [_,_,_,Bd,Bl,Bl,Bd,_,_,_],
      [_,_,G,Bd,R,R,Bd,G,_,_],
      [_,D,D,Bl,Bl,Bl,Bl,D,D,_],
      [_,D,D,Bl,R,R,Bl,D,D,_],
      [_,D,D,Bd,Bd,Bd,Bd,D,D,_],
      [_,_,G,R,G,G,R,G,_,_],
      [_,_,_,R,_,_,R,_,_,_],
    ];
  })(),
  puma_orange: (() => {
    const _=0,O=0xff6b35,Od=0xcc5020,Ob=0xff8855,W=0xffffff,Bl=0x1a3a6a,D=0x2b2d42,G=0x555566,Y=0xf4d35e;
    return [
      [_,_,_,Y,Y,Y,Y,_,_,_],
      [_,_,G,O,O,O,O,G,_,_],
      [_,D,D,O,Bl,Bl,O,D,D,_],
      [_,D,D,Bl,Bl,Bl,Bl,D,D,_],
      [_,D,D,Bl,0x6688aa,0x6688aa,Bl,D,D,_],
      [_,_,G,O,Ob,Ob,O,G,_,_],
      [_,_,_,O,W,W,O,_,_,_],
      [_,_,_,Od,O,O,Od,_,_,_],
      [_,_,_,Od,O,O,Od,_,_,_],
      [_,_,G,Od,Ob,Ob,Od,G,_,_],
      [_,D,D,O,O,O,O,D,D,_],
      [_,D,D,O,W,W,O,D,D,_],
      [_,D,D,Od,Od,Od,Od,D,D,_],
      [_,_,G,W,G,G,W,G,_,_],
      [_,_,_,W,_,_,W,_,_,_],
    ];
  })(),
  tundra_red: (() => {
    const _=0,R=0xe63946,Rd=0xb02030,Rb=0xff5566,W=0xffffff,Bk=0x1a1a2e,D=0x2b2d42,G=0x555566,Y=0xf4d35e;
    return [
      [_,_,_,Y,Y,Y,Y,_,_,_],
      [_,_,G,R,R,R,R,G,_,_],
      [_,D,D,R,W,W,R,D,D,_],
      [_,D,D,Bk,Bk,Bk,Bk,D,D,_],
      [_,D,D,Bk,0x8888aa,0x8888aa,Bk,D,D,_],
      [_,_,G,R,W,W,R,G,_,_],
      [_,_,_,Rd,R,R,Rd,_,_,_],
      [_,_,_,Rd,W,W,Rd,_,_,_],
      [_,_,_,Rd,R,R,Rd,_,_,_],
      [_,_,G,Rd,W,W,Rd,G,_,_],
      [_,D,D,R,R,R,R,D,D,_],
      [_,D,D,R,W,W,R,D,D,_],
      [_,D,D,Rd,Rd,Rd,Rd,D,D,_],
      [_,_,G,Rb,G,G,Rb,G,_,_],
      [_,_,_,Rb,_,_,Rb,_,_,_],
    ];
  })(),
  volt_green: (() => {
    const _=0,Gr=0x2dd4a8,Gd=0x1aaa80,Gb=0x55ffcc,W=0xffffff,Bk=0x1a2a2a,D=0x2b2d42,G=0x555566,Y=0xf4d35e;
    return [
      [_,_,_,Y,Y,Y,Y,_,_,_],
      [_,_,G,Gr,Gr,Gr,Gr,G,_,_],
      [_,D,D,Gr,Bk,Bk,Gr,D,D,_],
      [_,D,D,Bk,Bk,Bk,Bk,D,D,_],
      [_,D,D,Bk,0x88ddcc,0x88ddcc,Bk,D,D,_],
      [_,_,G,Gr,Gb,Gb,Gr,G,_,_],
      [_,_,_,Gd,Gr,Gr,Gd,_,_,_],
      [_,_,_,Gd,W,W,Gd,_,_,_],
      [_,_,_,Gd,Gr,Gr,Gd,_,_,_],
      [_,_,G,Gd,Gb,Gb,Gd,G,_,_],
      [_,D,D,Gr,Gr,Gr,Gr,D,D,_],
      [_,D,D,Gr,Gb,Gb,Gr,D,D,_],
      [_,D,D,Gd,Gd,Gd,Gd,D,D,_],
      [_,_,G,W,G,G,W,G,_,_],
      [_,_,_,W,_,_,W,_,_,_],
    ];
  })(),
};
