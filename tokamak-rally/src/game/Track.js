/**
 * Track v0.6 — Extreme A-to-B Rally with C-curves, chicanes, hairpins
 * 115 waypoints. No straight >300px. Every zone has 180° turns.
 */

export const TRACK_CONFIG = {
  name: 'Stage 1: Sahara Crossing',

  waypoints: [
    // ===== ZONE 1: DESERT — Sand, aggressive S-curves & C-turn =====
    [500, 14000],   // 0 START
    [500, 13750],   // 1
    [530, 13550],   // 2
    [620, 13400],   // 3 right bend
    [780, 13300],   // 4
    [900, 13150],   // 5
    [820, 12980],   // 6 chicane left
    [650, 12880],   // 7
    [520, 12750],   // 8
    [450, 12550],   // 9
    [520, 12350],   // 10 chicane right
    [700, 12250],   // 11
    [850, 12100],   // 12
    // C-curve (180° turnaround)
    [950, 11920],   // 13
    [980, 11740],   // 14
    [920, 11580],   // 15 apex
    [780, 11500],   // 16
    [620, 11520],   // 17
    [500, 11620],   // 18
    // Back north after C
    [450, 11450],   // 19
    [500, 11250],   // 20
    [650, 11100],   // 21
    [850, 11000],   // 22
    [1050, 10900],  // 23
    // Tight S through dunes
    [1150, 10700],  // 24
    [1050, 10520],  // 25
    [1150, 10350],  // 26
    [1300, 10250],  // 27
    // CP1
    [1350, 10050],  // 28 << CP1: Dune Ridge

    // ===== ZONE 2: CANYON — Narrow, hairpins, C-curves =====
    [1400, 9850],   // 29
    [1500, 9650],   // 30
    // Hairpin 1 (tight right)
    [1650, 9480],   // 31
    [1750, 9300],   // 32
    [1700, 9120],   // 33 apex
    [1550, 9050],   // 34
    [1400, 9100],   // 35
    // Chicane
    [1300, 8950],   // 36
    [1400, 8800],   // 37
    [1300, 8650],   // 38
    // C-curve (180° back east)
    [1200, 8480],   // 39
    [1150, 8300],   // 40
    [1200, 8130],   // 41 apex
    [1350, 8020],   // 42
    [1520, 8000],   // 43
    // Hairpin 2 (tight left)
    [1650, 7850],   // 44
    [1700, 7670],   // 45
    [1600, 7520],   // 46 apex
    [1420, 7480],   // 47
    // Quick chicane exit
    [1350, 7300],   // 48
    [1450, 7150],   // 49
    [1550, 7000],   // 50
    [1650, 6820],   // 51
    [1750, 6650],   // 52
    // CP2
    [1800, 6450],   // 53 << CP2: Canyon Exit

    // ===== ZONE 3: RIVERBED — Flowing curves, C-turn, chicanes =====
    [1850, 6250],   // 54
    [1950, 6050],   // 55
    [2100, 5900],   // 56
    // Sweeper right
    [2300, 5800],   // 57
    [2500, 5750],   // 58
    // C-curve (180° south-to-north)
    [2650, 5650],   // 59
    [2750, 5500],   // 60
    [2700, 5320],   // 61 apex
    [2550, 5250],   // 62
    [2400, 5300],   // 63
    // Chicane
    [2300, 5150],   // 64
    [2400, 5000],   // 65
    [2300, 4850],   // 66
    // Quick esses
    [2200, 4680],   // 67
    [2350, 4530],   // 68
    [2250, 4380],   // 69
    [2150, 4230],   // 70
    // CP3
    [2200, 4030],   // 71 << CP3: Oasis

    // ===== ZONE 4: MOUNTAIN — Tight switchbacks, C-curve =====
    [2200, 3830],   // 72
    [2150, 3630],   // 73
    // Switchback 1
    [2050, 3450],   // 74
    [1900, 3320],   // 75
    [2050, 3170],   // 76 switch
    [2250, 3080],   // 77
    // C-curve (180°)
    [2400, 2950],   // 78
    [2450, 2780],   // 79
    [2380, 2620],   // 80 apex
    [2220, 2550],   // 81
    [2080, 2600],   // 82
    // Switchback 2
    [2000, 2450],   // 83
    [2100, 2280],   // 84 switch
    [2280, 2200],   // 85
    [2200, 2050],   // 86 switch
    [2050, 1950],   // 87
    // Summit chicane
    [2100, 1780],   // 88
    [2250, 1650],   // 89
    [2350, 1480],   // 90
    [2500, 1350],   // 91
    // CP4
    [2650, 1200],   // 92 << CP4: Summit

    // ===== ZONE 5: SPRINT — Paved, fast but with curves =====
    [2850, 1100],   // 93
    [3100, 1020],   // 94
    [3350, 980],    // 95
    // Sweeper right
    [3600, 960],    // 96
    [3800, 1000],   // 97
    // Chicane
    [3950, 950],    // 98
    [4100, 1000],   // 99
    [4250, 940],    // 100
    // Gentle S
    [4450, 920],    // 101
    [4650, 960],    // 102
    [4850, 920],    // 103
    // Slight kink
    [5050, 900],    // 104
    [5250, 940],    // 105
    [5450, 910],    // 106
    // Final approach
    [5650, 880],    // 107
    [5850, 850],    // 108
    [6050, 830],    // 109
    // Gentle curve to finish
    [6250, 850],    // 110
    [6450, 900],    // 111
    // FINISH
    [6600, 950],    // 112
  ],

  checkpoints: [
    { waypointIndex: 28, timeBonus: 22000, name: 'CP1: Dune Ridge' },
    { waypointIndex: 53, timeBonus: 20000, name: 'CP2: Canyon Exit' },
    { waypointIndex: 71, timeBonus: 20000, name: 'CP3: Oasis' },
    { waypointIndex: 92, timeBonus: 22000, name: 'CP4: Summit' },
  ],

  zones: [
    {
      name: 'desert', fromWP: 0, toWP: 28,
      bgTile: 'bg_desert',
      roadType: 'sand',
      roadColor: 0xc4a060, roadBorder: 0xa88040,
      trackWidth: 110,
      scenery: ['cactus', 'bush_dry', 'rock_desert'],
      sceneryDensity: 2,
    },
    {
      name: 'canyon', fromWP: 28, toWP: 53,
      bgTile: 'bg_canyon',
      roadType: 'dirt',
      roadColor: 0x7a5535, roadBorder: 0x5a3520,
      trackWidth: 75,
      scenery: ['canyon_wall', 'rock_red'],
      sceneryDensity: 3,
    },
    {
      name: 'riverbed', fromWP: 53, toWP: 71,
      bgTile: 'bg_riverbed',
      roadType: 'dirt',
      roadColor: 0x8a7555, roadBorder: 0x6a5a40,
      trackWidth: 100,
      scenery: ['dead_tree', 'bush_green', 'rock_grey'],
      sceneryDensity: 2,
    },
    {
      name: 'mountain', fromWP: 71, toWP: 92,
      bgTile: 'bg_mountain',
      roadType: 'rocky',
      roadColor: 0x5a5a55, roadBorder: 0x4a4a45,
      trackWidth: 80,
      scenery: ['pine_tree', 'mountain_rock', 'snow_patch'],
      sceneryDensity: 2,
    },
    {
      name: 'sprint', fromWP: 92, toWP: 112,
      bgTile: 'bg_sprint',
      roadType: 'paved',
      roadColor: 0x3a3a42, roadBorder: 0x5a5a62,
      trackWidth: 120,
      scenery: ['bush_green', 'bush_dry'],
      sceneryDensity: 2,
    },
  ],

  startX: 500, startY: 13950, startAngle: -90,
  initialTime: 35000,

  roadPhysics: {
    paved:   { accel: 243, friction: 0.990, turn: 110, label: 'PAVED' },
    dirt:    { accel: 188, friction: 0.978, turn: 130, label: 'DIRT' },
    sand:    { accel: 141, friction: 0.965, turn: 115, label: 'SAND' },
    rocky:   { accel: 122, friction: 0.960, turn: 140, label: 'ROCKY' },
    offroad: { accel: 83,  friction: 0.945, turn: 85,  label: 'OFF-ROAD' },
  },

  obstacleConfig: {
    desert:   { types: ['obs_sand_pile', 'obs_tumbleweed', 'obs_tokamak'], density: 0.22 },
    canyon:   { types: ['obs_fallen_rock', 'obs_rock_debris', 'obs_tokamak'], density: 0.25 },
    riverbed: { types: ['obs_puddle', 'obs_mud_patch', 'obs_log', 'obs_tokamak'], density: 0.22 },
    mountain: { types: ['obs_rock_slide', 'obs_pothole', 'obs_tokamak'], density: 0.28 },
    sprint:   { types: ['obs_small_rock', 'obs_tokamak'], density: 0.15 },
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
