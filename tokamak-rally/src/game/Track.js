/**
 * Track v0.8 — Redesigned course with zone-appropriate curve ratios
 * ~122 waypoints. Inspired by WRC stage maps.
 * Sand 70:30 straight/curve, Canyon 40:60, Riverbed 50:50,
 * Mountain 30:70, Sprint 60:40.
 */

export const TRACK_CONFIG = {
  name: 'Stage 1: Sahara Crossing',

  waypoints: [
    // ===== ZONE 1: DESERT (0-24) — Sweepers, kinks. One-way flow NE =====
    [500, 14200],   // 0  START
    [500, 13950],   // 1
    [550, 13700],   // 2  slight right
    [680, 13500],   // 3  sweeper right
    [850, 13380],   // 4
    [1050, 13300],  // 5  straight east
    [1280, 13250],  // 6
    [1500, 13150],  // 7  gentle right
    [1680, 13000],  // 8
    [1800, 12800],  // 9  north
    [1850, 12580],  // 10
    [1830, 12380],  // 11 kink left
    [1750, 12200],  // 12
    [1700, 12000],  // 13 S-curve
    [1780, 11820],  // 14 right
    [1920, 11700],  // 15
    [2100, 11620],  // 16 NE
    [2300, 11560],  // 17
    [2480, 11480],  // 18 sweeper right
    [2600, 11340],  // 19
    [2650, 11150],  // 20 north
    [2620, 10950],  // 21 kink left
    [2550, 10760],  // 22
    [2550, 10560],  // 23 straight N
    [2580, 10360],  // 24
    // CP1
    [2600, 10160],  // 25 << CP1: Dune Ridge

    // ===== ZONE 2: CANYON (26-49) — Hairpins + chicanes, always progressing NW =====
    [2580, 9960],   // 26 entry south
    [2500, 9800],   // 27 left bend
    [2350, 9700],   // 28
    [2200, 9650],   // 29 west
    // Hairpin right (turn back east)
    [2100, 9540],   // 30
    [2100, 9380],   // 31 apex
    [2220, 9280],   // 32
    [2380, 9250],   // 33 east
    // Chicane
    [2500, 9140],   // 34
    [2420, 9020],   // 35 left
    [2520, 8900],   // 36 right
    [2440, 8780],   // 37 left
    // Hairpin left
    [2500, 8620],   // 38
    [2480, 8460],   // 39 apex
    [2350, 8380],   // 40
    [2200, 8400],   // 41 west
    [2060, 8340],   // 42
    // S-curve exit
    [1960, 8200],   // 43
    [2020, 8050],   // 44 right
    [2150, 7940],   // 45
    [2280, 7850],   // 46 NE
    [2380, 7720],   // 47
    [2400, 7540],   // 48
    // CP2
    [2380, 7360],   // 49 << CP2: Canyon Exit

    // ===== ZONE 3: RIVERBED (50-72) — Winding S-curves, progressing west =====
    [2320, 7180],   // 50 entry
    [2200, 7060],   // 51 left
    [2050, 6980],   // 52 west
    [1880, 6940],   // 53
    [1720, 6870],   // 54 sweeper right
    [1620, 6740],   // 55
    [1600, 6560],   // 56 north
    [1650, 6380],   // 57 kink right
    [1780, 6260],   // 58
    [1900, 6160],   // 59 NE
    // S-curve
    [1960, 5980],   // 60
    [1880, 5830],   // 61 left
    [1950, 5680],   // 62 right
    [1880, 5530],   // 63 left
    [1920, 5370],   // 64 right
    // Gentle sweeper north
    [2020, 5220],   // 65
    [2100, 5060],   // 66
    [2050, 4900],   // 67 kink left
    [1950, 4760],   // 68
    [1920, 4580],   // 69
    [1960, 4400],   // 70
    [2050, 4240],   // 71
    // CP3
    [2100, 4060],   // 72 << CP3: Oasis

    // ===== ZONE 4: MOUNTAIN (73-96) — Switchback zigzags, progressing north =====
    [2080, 3880],   // 73 entry
    [2020, 3720],   // 74
    // Switchback 1 — hairpin right
    [1920, 3600],   // 75
    [1780, 3540],   // 76 west
    [1650, 3520],   // 77 apex
    [1580, 3400],   // 78
    [1650, 3280],   // 79 turn back east
    [1800, 3200],   // 80
    [1960, 3160],   // 81
    // Switchback 2 — hairpin left
    [2100, 3080],   // 82
    [2180, 2940],   // 83 apex
    [2100, 2820],   // 84
    [1950, 2780],   // 85 west
    [1800, 2750],   // 86
    // Switchback 3 — hairpin right
    [1680, 2650],   // 87
    [1660, 2500],   // 88 apex
    [1760, 2380],   // 89
    [1900, 2320],   // 90 east
    [2050, 2280],   // 91
    // Final climb north
    [2120, 2140],   // 92
    [2080, 1980],   // 93
    [2120, 1820],   // 94
    [2180, 1660],   // 95
    // CP4
    [2200, 1500],   // 96 << CP4: Summit

    // ===== ZONE 5: SPRINT (97-120) — Fast paved, flowing east =====
    [2280, 1350],   // 97
    [2420, 1250],   // 98 diagonal SE
    [2600, 1180],   // 99
    [2820, 1140],   // 100 straight east
    [3060, 1120],   // 101
    // Sweeper right
    [3280, 1150],   // 102
    [3480, 1220],   // 103
    [3640, 1180],   // 104 exit
    // Chicane
    [3820, 1120],   // 105
    [3980, 1200],   // 106 left
    [4140, 1120],   // 107 right
    // Medium straight
    [4340, 1100],   // 108
    [4560, 1080],   // 109
    // Sweeper left
    [4760, 1120],   // 110
    [4920, 1200],   // 111
    [5060, 1140],   // 112 exit
    // Short straight
    [5260, 1100],   // 113
    [5480, 1080],   // 114
    // Gentle right
    [5680, 1120],   // 115
    [5840, 1180],   // 116
    [5960, 1120],   // 117
    // Final straight to finish
    [6160, 1080],   // 118
    [6400, 1060],   // 119
    // FINISH
    [6620, 1050],   // 120
  ],

  checkpoints: [
    { waypointIndex: 25, timeBonus: 15000, name: 'CP1: Dune Ridge' },
    { waypointIndex: 49, timeBonus: 15000, name: 'CP2: Canyon Exit' },
    { waypointIndex: 72, timeBonus: 15000, name: 'CP3: Oasis' },
    { waypointIndex: 96, timeBonus: 15000, name: 'CP4: Summit Tunnel' },
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
      name: 'canyon', fromWP: 28, toWP: 46,
      bgTile: 'v3_bg_canyon',
      roadType: 'dirt',
      roadColor: 0x8a7555, roadBorder: 0x6a5535,
      trackWidth: 75,
      scenery: ['v4_canyon_pillar','v4_canyon_debris_sm','v4_canyon_wall','v4_canyon_arch','v4_canyon_dead_bush','v4_canyon_rock','v4_canyon_debris_lg'],
      sceneryDensity: 5,
      barrierTile: 'v3_barrier_canyon',
    },
    {
      name: 'trans_canyon_riverbed', fromWP: 46, toWP: 52,
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
      name: 'riverbed', fromWP: 52, toWP: 69,
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

  startX: 500, startY: 14150, startAngle: -90,
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
