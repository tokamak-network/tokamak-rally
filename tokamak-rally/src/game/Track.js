/**
 * Track v2.0 — "Straight is default, corners are variation"
 * Thrash Rally inspired. Primary direction: NORTH (↑12 o'clock).
 * Each zone has 2-3 variation sections (S-curves, hairpins).
 * All variations exit back to 12 o'clock straight.
 * Hairpins are smooth U-arcs, never sharp V-turns.
 */

export const TRACK_CONFIG = {
  name: 'Stage 1: Sahara Crossing',

  waypoints: [
    // ===== ZONE 1: DESERT (0-34) — Wide open, S-curves + gentle hairpins =====
    // --- Straight north from start ---
    [2000, 14200],  // 0  START
    [2000, 13950],  // 1
    [2000, 13700],  // 2
    [2000, 13450],  // 3

    // --- S-curve 1: right diagonal → left diagonal ---
    [2050, 13250],  // 4  enter right
    [2110, 13070],  // 5
    [2150, 12890],  // 6  right apex
    [2110, 12710],  // 7  transition
    [2050, 12540],  // 8
    [2000, 12370],  // 9  center
    [1950, 12200],  // 10 enter left
    [1890, 12030],  // 11
    [1850, 11860],  // 12 left apex
    [1890, 11690],  // 13
    [1950, 11520],  // 14
    [2000, 11350],  // 15 back to center — straight

    // --- Straight recovery ---
    [2000, 11100],  // 16
    [2000, 10850],  // 17

    // --- S-curve 2: left then right ---
    [1950, 10650],  // 18
    [1890, 10470],  // 19
    [1850, 10300],  // 20 left apex
    [1890, 10130],  // 21
    [1950, 9970],   // 22
    [2000, 9810],   // 23 center
    [2050, 9650],   // 24
    [2110, 9480],   // 25
    [2150, 9310],   // 26 right apex
    [2110, 9140],   // 27
    [2050, 8980],   // 28
    [2000, 8820],   // 29 back to center

    // --- Straight to CP1 ---
    [2000, 8570],   // 30
    [2000, 8320],   // 31
    [2000, 8070],   // 32
    [2000, 7820],   // 33 << CP1: Dune Ridge
    [2000, 7570],   // 34

    // ===== TRANSITION: DESERT→CANYON (35-38) =====
    [2000, 7370],   // 35
    [2000, 7170],   // 36
    [2000, 6970],   // 37
    [2000, 6770],   // 38

    // ===== ZONE 2: CANYON (39-56) — Narrow gorge, tight S-curves =====
    // --- Straight into gorge ---
    [2000, 6570],   // 39
    [2000, 6320],   // 40
    [2000, 6070],   // 41

    // --- S-curve through canyon ---
    [2040, 5890],   // 42
    [2090, 5720],   // 43
    [2120, 5560],   // 44 right apex
    [2090, 5400],   // 45
    [2040, 5240],   // 46
    [2000, 5080],   // 47 center
    [1960, 4920],   // 48
    [1910, 4760],   // 49
    [1880, 4600],   // 50 left apex
    [1910, 4440],   // 51
    [1960, 4280],   // 52
    [2000, 4120],   // 53 back to center

    // --- Straight ---
    [2000, 3870],   // 54
    [2000, 3620],   // 55
    [2000, 3370],   // 56 << CP2: Canyon Exit

    // ===== TRANSITION: CANYON→RIVERBED (57-60) =====
    [2000, 3170],   // 57
    [2000, 2970],   // 58
    [2000, 2770],   // 59
    [2000, 2570],   // 60

    // ===== ZONE 3: RIVERBED (61-83) — Tree-lined, flowing S-curves =====
    // --- Straight ---
    [2000, 2370],   // 61
    [2000, 2120],   // 62

    // --- S-curve 1 ---
    [2060, 1930],   // 63
    [2130, 1750],   // 64
    [2170, 1580],   // 65 right apex
    [2130, 1410],   // 66
    [2060, 1250],   // 67
    [2000, 1090],   // 68 center
    [1940, 930],    // 69
    [1870, 770],    // 70
    [1830, 610],    // 71 left apex
    [1870, 450],    // 72
    [1940, 290],    // 73
    [2000, 130],    // 74 back to center

    // --- Short straight ---
    [2000, -70],    // 75

    // --- Hairpin right (smooth U-arc) ---
    [2060, -230],   // 76 enter
    [2150, -370],   // 77
    [2250, -470],   // 78
    [2310, -580],   // 79 apex east
    [2250, -690],   // 80
    [2150, -790],   // 81
    [2060, -870],   // 82
    [2000, -950],   // 83 exit — back to 12 o'clock

    // --- Straight to CP3 ---
    [2000, -1150],  // 84
    [2000, -1350],  // 85 << CP3: Riverbed Crossing

    // ===== TRANSITION: RIVERBED→MOUNTAIN (86-89) =====
    [2000, -1550],  // 86
    [2000, -1750],  // 87
    [2000, -1950],  // 88
    [2000, -2150],  // 89

    // ===== ZONE 4: MOUNTAIN (90-114) — Switchbacks with smooth U-arcs =====
    // --- Straight climb ---
    [2000, -2350],  // 90
    [2000, -2600],  // 91
    [2000, -2850],  // 92

    // --- S-curve 1 (gentle) ---
    [2050, -3030],  // 93
    [2100, -3200],  // 94
    [2130, -3370],  // 95 right apex
    [2100, -3540],  // 96
    [2050, -3700],  // 97
    [2000, -3860],  // 98 center
    [1950, -4020],  // 99
    [1900, -4180],  // 100
    [1870, -4340],  // 101 left apex
    [1900, -4500],  // 102
    [1950, -4660],  // 103
    [2000, -4820],  // 104 back to center

    // --- Short straight ---
    [2000, -5020],  // 105

    // --- Hairpin left (smooth U-arc) ---
    [1940, -5180],  // 106 enter
    [1860, -5330],  // 107
    [1770, -5440],  // 108
    [1700, -5530],  // 109 apex west
    [1770, -5640],  // 110
    [1860, -5750],  // 111
    [1940, -5850],  // 112
    [2000, -5950],  // 113 exit — back to 12 o'clock

    // --- Straight to CP4 ---
    [2000, -6150],  // 114 << CP4: Summit

    // ===== TRANSITION: MOUNTAIN→SPRINT (115-118) =====
    [2000, -6350],  // 115
    [2000, -6550],  // 116
    [2000, -6750],  // 117
    [2000, -6950],  // 118

    // ===== ZONE 5: SPRINT (119-161) — City circuit: always progressing north (Y decreasing) =====
    // Zigzag layout with 90° corners, no U-turns, always moving upward

    // --- Straight north ---
    [2000, -7150],  // 119
    [2000, -7400],  // 120
    [2000, -7650],  // 121
    [2000, -7900],  // 122
    [2000, -8150],  // 123

    // --- 90° right turn (smooth arc east) ---
    [2060, -8320],  // 124
    [2160, -8440],  // 125
    [2300, -8510],  // 126
    [2450, -8540],  // 127

    // --- Short east straight ---
    [2700, -8540],  // 128
    [2950, -8540],  // 129

    // --- 90° left turn (smooth arc north) ---
    [3120, -8600],  // 130
    [3250, -8720],  // 131
    [3320, -8880],  // 132
    [3340, -9050],  // 133

    // --- Straight north ---
    [3340, -9300],  // 134
    [3340, -9550],  // 135
    [3340, -9800],  // 136

    // --- 90° left turn (smooth arc west) ---
    [3280, -9970],  // 137
    [3160, -10090], // 138
    [3000, -10150], // 139
    [2840, -10170], // 140

    // --- Short west straight ---
    [2590, -10170], // 141
    [2340, -10170], // 142

    // --- 90° right turn (smooth arc north) ---
    [2170, -10230], // 143
    [2060, -10350], // 144
    [2000, -10510], // 145
    [1980, -10680], // 146

    // --- Straight north ---
    [1980, -10930], // 147
    [1980, -11180], // 148
    [1980, -11430], // 149

    // --- 90° right turn (smooth arc east) ---
    [2040, -11600], // 150
    [2150, -11720], // 151
    [2300, -11790], // 152
    [2460, -11810], // 153

    // --- Short east straight ---
    [2710, -11810], // 154
    [2960, -11810], // 155

    // --- 90° left turn (smooth arc north) ---
    [3130, -11870], // 156
    [3250, -11990], // 157
    [3320, -12150], // 158

    // --- FINISH LINE ---
    [3340, -12350], // 159 FINISH

    // --- Road continues after finish (for visual continuity) ---
    [3340, -12600], // 160
    [3340, -12850]  // 161
  ],

  checkpoints: [
    { waypointIndex: 33, timeBonus: 15000, name: 'CP1: Dune Ridge' },
    { waypointIndex: 56, timeBonus: 15000, name: 'CP2: Canyon Exit' },
    { waypointIndex: 85, timeBonus: 15000, name: 'CP3: Riverbed Crossing' },
    { waypointIndex: 114, timeBonus: 15000, name: 'CP4: Summit' },
  ],

  zones: [
    {
      name: 'desert', fromWP: 0, toWP: 34,
      bgTile: 'v5_bg_desert',
      roadTexture: 'v5_road_dirt',
      roadType: 'sand',
      roadColor: 0xb89060, roadBorder: 0x9a7040,
      trackWidth: 110,
      scenery: [],
      sceneryDensity: 5,
      barrierStyle: 'wood_fence',
    },
    {
      name: 'trans_desert_canyon', fromWP: 34, toWP: 39,
      bgTile: 'v5_bg_desert',
      roadTexture: 'v5_road_dirt',
      roadType: 'dirt',
      roadColor: 0xa08050, roadBorder: 0x806030,
      trackWidth: 95,
      scenery: [],
      sceneryDensity: 5,
      barrierStyle: 'wood_fence',
      transition: { from: 'desert', to: 'canyon' },
    },
    {
      name: 'canyon', fromWP: 39, toWP: 56,
      bgTile: 'v5_bg_canyon',
      roadTexture: 'v5_road_dirt',
      roadType: 'dirt',
      roadColor: 0x8a7555, roadBorder: 0x6a5535,
      trackWidth: 75,
      scenery: [],
      sceneryDensity: 5,
      barrierStyle: 'metal_guardrail',
    },
    {
      name: 'trans_canyon_riverbed', fromWP: 56, toWP: 61,
      bgTile: 'v5_bg_canyon',
      roadTexture: 'v5_road_dirt',
      roadType: 'dirt',
      roadColor: 0x827050, roadBorder: 0x625540,
      trackWidth: 88,
      scenery: [],
      sceneryDensity: 5,
      barrierStyle: 'metal_guardrail',
      transition: { from: 'canyon', to: 'riverbed' },
    },
    {
      name: 'riverbed', fromWP: 61, toWP: 85,
      bgTile: 'v5_bg_riverbed',
      roadTexture: 'v5_road_dirt',
      roadType: 'dirt',
      roadColor: 0x7a6a50, roadBorder: 0x5a4a35,
      trackWidth: 100,
      scenery: [],
      sceneryDensity: 6,
      barrierStyle: 'wood_fence',
    },
    {
      name: 'trans_riverbed_mountain', fromWP: 85, toWP: 90,
      bgTile: 'v5_bg_riverbed',
      roadTexture: 'v5_road_dirt',
      roadType: 'rocky',
      roadColor: 0x6a5a40, roadBorder: 0x4a3a28,
      trackWidth: 90,
      scenery: [],
      sceneryDensity: 5,
      barrierStyle: 'wood_fence',
      transition: { from: 'riverbed', to: 'mountain' },
    },
    {
      name: 'mountain', fromWP: 90, toWP: 114,
      bgTile: 'v5_bg_mountain',
      roadTexture: 'v5_road_snow',
      roadType: 'rocky',
      roadColor: 0x7a5538, roadBorder: 0x5a3a22,
      trackWidth: 80,
      scenery: [],
      sceneryDensity: 6,
      barrierStyle: 'stone_wall',
    },
    {
      name: 'trans_mountain_sprint', fromWP: 114, toWP: 119,
      bgTile: 'v5_bg_mountain',
      roadTexture: 'v5_road_asphalt',
      roadType: 'paved',
      roadColor: 0x585860, roadBorder: 0x505058,
      trackWidth: 100,
      scenery: [],
      sceneryDensity: 5,
      barrierStyle: 'stone_wall',
      transition: { from: 'mountain', to: 'sprint' },
    },
    {
      name: 'sprint', fromWP: 119, toWP: 161,
      bgTile: 'v5_bg_sprint',
      roadTexture: 'v5_road_asphalt',
      roadType: 'paved',
      roadColor: 0x484850, roadBorder: 0x606068,
      trackWidth: 120,
      scenery: [],
      sceneryDensity: 7,
      barrierStyle: 'jersey_barrier',
    },
  ],

  startX: 2000, startY: 14150, startAngle: -90,
  initialTime: 120000,
  finishWP: 159,

  roadPhysics: {
    paved:   { accel: 243, friction: 0.990, turn: 110, label: 'PAVED' },
    dirt:    { accel: 188, friction: 0.978, turn: 130, label: 'DIRT' },
    sand:    { accel: 141, friction: 0.965, turn: 115, label: 'SAND' },
    rocky:   { accel: 122, friction: 0.960, turn: 140, label: 'ROCKY' },
    offroad: { accel: 83,  friction: 0.945, turn: 85,  label: 'OFF-ROAD' },
  },

  obstacleConfig: {
    desert:   { types: ['obs_sand_pile', 'obs_tumbleweed', 'obs_small_rock'], density: 0.22 },
    trans_desert_canyon: { types: ['obs_sand_pile', 'obs_fallen_rock', 'obs_small_rock'], density: 0.20 },
    canyon:   { types: ['obs_fallen_rock', 'obs_rock_debris', 'obs_small_rock'], density: 0.25 },
    trans_canyon_riverbed: { types: ['obs_fallen_rock', 'obs_puddle', 'obs_small_rock'], density: 0.20 },
    riverbed: { types: ['obs_puddle', 'obs_mud_patch', 'obs_log'], density: 0.22 },
    trans_riverbed_mountain: { types: ['obs_puddle', 'obs_rock_slide', 'obs_small_rock'], density: 0.22 },
    mountain: { types: ['obs_rock_slide', 'obs_pothole', 'obs_fallen_rock'], density: 0.28 },
    trans_mountain_sprint: { types: ['obs_pothole', 'obs_small_rock'], density: 0.18 },
    sprint:   { types: ['obs_small_rock', 'obs_pothole'], density: 0.15 },
  },
};

// ---- Utility Functions ----

export function getZoneByIndex(wpIndex, zones) {
  for (const z of zones) {
    if (wpIndex >= z.fromWP && wpIndex < z.toWP) return z;
  }
  return zones[zones.length - 1];
}

export function isOnTrack(x, y, waypoints, zones) {
  for (let i = 0; i < waypoints.length - 1; i++) {
    const zone = getZoneByIndex(i, zones);
    const halfW = (zone.trackWidth || 100) / 2;
    const dist = distToSeg(x, y, waypoints[i][0], waypoints[i][1], waypoints[i+1][0], waypoints[i+1][1]);
    if (dist < halfW) return { onTrack: true, zone };
  }
  return { onTrack: false, zone: null };
}

export function getTrackProgress(x, y, waypoints) {
  let minDist = Infinity, closestIdx = 0;
  for (let i = 0; i < waypoints.length; i++) {
    const d = Math.sqrt((x-waypoints[i][0])**2 + (y-waypoints[i][1])**2);
    if (d < minDist) { minDist = d; closestIdx = i; }
  }
  return { index: closestIdx, distance: minDist, progress: closestIdx / (waypoints.length - 1) };
}

export function checkCheckpoint(x, y, cp, waypoints) {
  const wp = waypoints[cp.waypointIndex];
  return Math.sqrt((x-wp[0])**2 + (y-wp[1])**2) < 100;
}

export function checkFinish(x, y, waypoints, config) {
  const fIdx = config?.finishWP ?? (waypoints.length - 1);
  const f = waypoints[fIdx];
  return Math.sqrt((x-f[0])**2 + (y-f[1])**2) < 100;
}

function distToSeg(px,py,x1,y1,x2,y2) {
  const dx=x2-x1,dy=y2-y1,l2=dx*dx+dy*dy;
  if(l2===0)return Math.sqrt((px-x1)**2+(py-y1)**2);
  let t=Math.max(0,Math.min(1,((px-x1)*dx+(py-y1)*dy)/l2));
  return Math.sqrt((px-(x1+t*dx))**2+(py-(y1+t*dy))**2);
}
