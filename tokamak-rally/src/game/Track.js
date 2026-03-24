/**
 * Track v1.0 — "Straight is default, corners are variation"
 * Inspired by Thrash Rally (Neo Geo). Primary direction: NORTH (↑12 o'clock).
 * Every corner exits back to straight. Min 50% straight per zone.
 * ~120 waypoints. Desert→Canyon→Riverbed→Mountain→Sprint.
 */

export const TRACK_CONFIG = {
  name: 'Stage 1: Sahara Crossing',

  waypoints: [
    // ===== ZONE 1: DESERT (0-24) — Wide open, mostly straight north =====
    // Long straight → gentle right sweep → straight → gentle left sweep → straight
    [2000, 14200],  // 0  START — straight north
    [2000, 13950],  // 1
    [2000, 13700],  // 2
    [2000, 13450],  // 3
    [2000, 13200],  // 4
    [2000, 12950],  // 5  long straight done
    // Gentle right sweep (diagonal NE)
    [2060, 12750],  // 6
    [2140, 12560],  // 7
    [2200, 12380],  // 8  apex
    // Return to straight north
    [2220, 12150],  // 9
    [2220, 11900],  // 10
    [2220, 11650],  // 11
    [2220, 11400],  // 12
    // Gentle left sweep (diagonal NW)
    [2160, 11200],  // 13
    [2080, 11020],  // 14
    [2020, 10840],  // 15 apex
    // Return to straight north
    [2000, 10600],  // 16
    [2000, 10350],  // 17
    [2000, 10100],  // 18
    [2000, 9850],   // 19
    [2000, 9600],   // 20
    [2000, 9350],   // 21
    [2000, 9100],   // 22
    // CP1
    [2000, 8850],   // 23 << CP1: Dune Ridge

    // ===== TRANSITION: DESERT→CANYON (24-27) =====
    [2000, 8600],   // 24
    [2000, 8400],   // 25
    [2000, 8200],   // 26
    [2000, 8000],   // 27

    // ===== ZONE 2: CANYON (28-48) — Narrow gorge, straight with one hairpin =====
    // Long straight between cliff walls (like Thrash Rally canyon screenshot)
    [2000, 7800],   // 28
    [2000, 7550],   // 29
    [2000, 7300],   // 30
    [2000, 7050],   // 31
    [2000, 6800],   // 32
    [2000, 6550],   // 33
    // Right sweep through narrow pass
    [2080, 6350],   // 34
    [2180, 6180],   // 35
    [2250, 6000],   // 36 apex
    // Straight north
    [2250, 5750],   // 37
    [2250, 5500],   // 38
    [2250, 5250],   // 39
    // Left sweep back to center
    [2180, 5060],   // 40
    [2080, 4880],   // 41
    [2000, 4700],   // 42 apex
    // Straight north exit
    [2000, 4450],   // 43
    [2000, 4200],   // 44
    [2000, 3950],   // 45
    // CP2
    [2000, 3700],   // 46 << CP2: Canyon Exit

    // ===== TRANSITION: CANYON→RIVERBED (47-50) =====
    [2000, 3500],   // 47
    [2000, 3300],   // 48
    [2000, 3100],   // 49
    [2000, 2900],   // 50

    // ===== ZONE 3: RIVERBED (51-71) — Bamboo/tree-lined, gentle S-curves =====
    // Straight north
    [2000, 2700],   // 51
    [2000, 2450],   // 52
    [2000, 2200],   // 53
    [2000, 1950],   // 54
    // Gentle S-curve: right then left
    [2060, 1750],   // 55
    [2130, 1570],   // 56
    [2160, 1400],   // 57 right apex
    [2130, 1230],   // 58
    [2060, 1060],   // 59
    [2000, 900],    // 60 center
    [1940, 730],    // 61
    [1870, 560],    // 62
    [1840, 390],    // 63 left apex
    [1870, 220],    // 64
    [1940, 60],     // 65
    // Straight north
    [2000, -120],   // 66
    [2000, -370],   // 67
    [2000, -620],   // 68
    [2000, -870],   // 69
    // CP3
    [2000, -1100],  // 70 << CP3: Riverbed Crossing

    // ===== TRANSITION: RIVERBED→MOUNTAIN (71-74) =====
    [2000, -1300],  // 71
    [2000, -1500],  // 72
    [2000, -1700],  // 73
    [2000, -1900],  // 74

    // ===== ZONE 4: MOUNTAIN (75-96) — Switchbacks but wider arcs =====
    // Straight climb
    [2000, -2100],  // 75
    [2000, -2350],  // 76
    [2000, -2600],  // 77
    // Wide U-turn right (hairpin, smooth arc)
    [2080, -2800],  // 78
    [2200, -2950],  // 79
    [2350, -3030],  // 80 apex east
    [2200, -3110],  // 81
    [2080, -3260],  // 82
    // Straight north
    [2000, -3450],  // 83
    [2000, -3700],  // 84
    [2000, -3950],  // 85
    // Wide U-turn left (hairpin, smooth arc)
    [1920, -4150],  // 86
    [1800, -4300],  // 87
    [1650, -4380],  // 88 apex west
    [1800, -4460],  // 89
    [1920, -4610],  // 90
    // Straight north to summit
    [2000, -4800],  // 91
    [2000, -5050],  // 92
    [2000, -5300],  // 93
    // CP4
    [2000, -5550],  // 94 << CP4: Summit

    // ===== TRANSITION: MOUNTAIN→SPRINT (95-98) =====
    [2000, -5750],  // 95
    [2000, -5950],  // 96
    [2000, -6150],  // 97
    [2000, -6350],  // 98

    // ===== ZONE 5: SPRINT (99-120) — City grid: straights + 90° corners =====
    // Long straight north
    [2000, -6550],  // 99
    [2000, -6800],  // 100
    [2000, -7050],  // 101
    [2000, -7300],  // 102
    [2000, -7550],  // 103
    [2000, -7800],  // 104
    // 90° right turn (smooth arc)
    [2080, -7980],  // 105
    [2220, -8100],  // 106
    [2400, -8140],  // 107 apex
    // Straight east
    [2650, -8140],  // 108
    [2900, -8140],  // 109
    [3150, -8140],  // 110
    // 90° left turn (smooth arc north)
    [3330, -8060],  // 111
    [3450, -7920],  // 112
    [3490, -7740],  // 113 apex
    // Straight north
    [3490, -7490],  // 114
    [3490, -7240],  // 115
    [3490, -6990],  // 116
    [3490, -6740],  // 117
    [3490, -6490],  // 118
    [3490, -6240],  // 119
    // FINISH
    [3490, -5990],  // 120
  ],

  checkpoints: [
    { waypointIndex: 23, timeBonus: 15000, name: 'CP1: Dune Ridge' },
    { waypointIndex: 46, timeBonus: 15000, name: 'CP2: Canyon Exit' },
    { waypointIndex: 70, timeBonus: 15000, name: 'CP3: Riverbed Crossing' },
    { waypointIndex: 94, timeBonus: 15000, name: 'CP4: Summit' },
  ],

  zones: [
    {
      name: 'desert', fromWP: 0, toWP: 22,
      bgTile: 'v3_bg_desert',
      roadType: 'sand',
      roadColor: 0xb89060, roadBorder: 0x9a7040,
      trackWidth: 110,
      scenery: ['v4_desert_cactus_tall','v4_desert_cactus_barrel','v4_desert_rock_sm','v4_desert_rock_lg','v4_desert_bush','v4_desert_tumbleweed','v4_desert_hut','v4_desert_fence','v4_desert_cow','v4_desert_dry_grass'],
      sceneryDensity: 5,
      barrierTile: 'v3_barrier_desert',
    },
    {
      name: 'trans_desert_canyon', fromWP: 22, toWP: 28,
      bgTile: 'v3_bg_desert',
      roadType: 'dirt',
      roadColor: 0xa08050, roadBorder: 0x806030,
      trackWidth: 95,
      scenery: ['v4_desert_rock_lg','v4_desert_rock_sm','v4_canyon_pillar','v4_canyon_rock','v4_canyon_dead_bush','v4_desert_dry_grass'],
      sceneryDensity: 5,
      barrierTile: 'v3_barrier_canyon',
      transition: { from: 'desert', to: 'canyon' },
    },
    {
      name: 'canyon', fromWP: 28, toWP: 45,
      bgTile: 'v3_bg_canyon',
      roadType: 'dirt',
      roadColor: 0x8a7555, roadBorder: 0x6a5535,
      trackWidth: 75,
      scenery: ['v4_canyon_pillar','v4_canyon_debris_sm','v4_canyon_wall','v4_canyon_arch','v4_canyon_dead_bush','v4_canyon_rock','v4_canyon_debris_lg'],
      sceneryDensity: 5,
      barrierTile: 'v3_barrier_canyon',
    },
    {
      name: 'trans_canyon_riverbed', fromWP: 45, toWP: 51,
      bgTile: 'v3_bg_canyon',
      roadType: 'dirt',
      roadColor: 0x827050, roadBorder: 0x625540,
      trackWidth: 88,
      scenery: ['v4_canyon_debris_sm','v4_canyon_dead_bush','v4_riverbed_reeds','v4_riverbed_rock','v4_riverbed_bush'],
      sceneryDensity: 5,
      barrierTile: 'v3_barrier_riverbed',
      transition: { from: 'canyon', to: 'riverbed' },
    },
    {
      name: 'riverbed', fromWP: 51, toWP: 69,
      bgTile: 'v3_bg_riverbed',
      roadType: 'dirt',
      roadColor: 0x7a6a50, roadBorder: 0x5a4a35,
      trackWidth: 100,
      scenery: ['v4_riverbed_tree','v4_riverbed_bush','v4_riverbed_reeds','v4_riverbed_rock','v4_riverbed_puddle','v4_riverbed_log','v4_riverbed_tree','v4_riverbed_bird'],
      sceneryDensity: 6,
      barrierTile: 'v3_barrier_riverbed',
    },
    {
      name: 'trans_riverbed_mountain', fromWP: 69, toWP: 75,
      bgTile: 'v3_bg_riverbed',
      roadType: 'rocky',
      roadColor: 0x6a5a40, roadBorder: 0x4a3a28,
      trackWidth: 90,
      scenery: ['v4_riverbed_rock','v4_riverbed_bush','v4_mountain_rock_snow','v4_mountain_pine','v4_mountain_sign'],
      sceneryDensity: 5,
      barrierTile: 'v3_barrier_mountain',
      transition: { from: 'riverbed', to: 'mountain' },
    },
    {
      name: 'mountain', fromWP: 75, toWP: 93,
      bgTile: 'v3_bg_mountain',
      roadType: 'rocky',
      roadColor: 0x7a5538, roadBorder: 0x5a3a22,
      trackWidth: 80,
      scenery: ['v4_mountain_pine','v4_mountain_rock_snow','v4_mountain_cabin','v4_mountain_snowman','v4_mountain_bush','v4_mountain_sign_arrow','v4_mountain_rock_flat','v4_mountain_snow_pile','v4_mountain_pine'],
      sceneryDensity: 6,
      barrierTile: 'v3_barrier_mountain',
    },
    {
      name: 'trans_mountain_sprint', fromWP: 93, toWP: 99,
      bgTile: 'v3_bg_mountain',
      roadType: 'paved',
      roadColor: 0x585860, roadBorder: 0x505058,
      trackWidth: 100,
      scenery: ['v4_mountain_rock_snow','v4_sprint_light','v4_sprint_restaurant','v4_mountain_sign'],
      sceneryDensity: 5,
      barrierTile: 'v3_barrier_sprint',
      transition: { from: 'mountain', to: 'sprint' },
    },
    {
      name: 'sprint', fromWP: 99, toWP: 120,
      bgTile: 'v3_bg_sprint',
      roadType: 'paved',
      roadColor: 0x484850, roadBorder: 0x606068,
      trackWidth: 120,
      scenery: ['v4_sprint_office','v4_sprint_hotel','v4_sprint_apartment','v4_sprint_skyscraper','v4_sprint_restaurant','v4_sprint_cones','v4_sprint_tires','v4_sprint_generator'],
      sceneryDensity: 7,
      barrierTile: 'v3_barrier_sprint',
    },
  ],

  startX: 2000, startY: 14150, startAngle: -90,
  initialTime: 120000,

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

export function checkFinish(x, y, waypoints) {
  const f = waypoints[waypoints.length - 1];
  return Math.sqrt((x-f[0])**2 + (y-f[1])**2) < 100;
}

function distToSeg(px,py,x1,y1,x2,y2) {
  const dx=x2-x1,dy=y2-y1,l2=dx*dx+dy*dy;
  if(l2===0)return Math.sqrt((px-x1)**2+(py-y1)**2);
  let t=Math.max(0,Math.min(1,((px-x1)*dx+(py-y1)*dy)/l2));
  return Math.sqrt((px-(x1+t*dx))**2+(py-(y1+t*dy))**2);
}
