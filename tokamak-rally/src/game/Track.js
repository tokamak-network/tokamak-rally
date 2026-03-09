/**
 * Track v0.8 — Redesigned course with zone-appropriate curve ratios
 * ~122 waypoints. Inspired by WRC stage maps.
 * Sand 70:30 straight/curve, Canyon 40:60, Riverbed 50:50,
 * Mountain 30:70, Sprint 60:40.
 */

export const TRACK_CONFIG = {
  name: 'Stage 1: Sahara Crossing',

  waypoints: [
    // ===== ZONE 1: DESERT (0-25) — Open, long straights, gentle sweepers =====
    [500, 14200],   // 0  START
    [500, 13950],   // 1  straight north
    [500, 13700],   // 2  long straight
    [520, 13450],   // 3  gentle drift right
    [580, 13200],   // 4
    [700, 13000],   // 5  gentle right bend
    [850, 12850],   // 6
    [1000, 12750],  // 7  long diagonal straight
    [1200, 12650],  // 8
    [1400, 12580],  // 9
    [1550, 12480],  // 10 gentle left sweep
    [1600, 12280],  // 11
    [1580, 12080],  // 12 straightens north
    [1550, 11850],  // 13
    [1580, 11620],  // 14 gentle right
    [1680, 11420],  // 15
    [1820, 11280],  // 16 wide sweeper right
    [1950, 11200],  // 17
    [2100, 11180],  // 18 long straight east
    [2300, 11180],  // 19
    [2450, 11140],  // 20 gentle left
    [2550, 11040],  // 21
    [2600, 10880],  // 22 north
    [2580, 10680],  // 23
    [2520, 10500],  // 24 gentle left curve
    [2400, 10350],  // 25
    // CP1
    [2300, 10180],  // 26 << CP1: Dune Ridge

    // ===== ZONE 2: CANYON (27-52) — Tight, technical, hairpins =====
    [2250, 10000],  // 27 entry
    [2300, 9850],   // 28
    // Hairpin 1 — tight right
    [2400, 9700],   // 29
    [2500, 9580],   // 30
    [2550, 9430],   // 31
    [2500, 9290],   // 32 apex
    [2380, 9220],   // 33
    [2250, 9260],   // 34 exit
    // Short straight
    [2180, 9100],   // 35
    // Chicane (S-curve)
    [2250, 8950],   // 36
    [2150, 8820],   // 37
    [2250, 8680],   // 38
    // Hairpin 2 — tight left
    [2350, 8530],   // 39
    [2400, 8370],   // 40
    [2350, 8220],   // 41 apex
    [2200, 8150],   // 42
    [2060, 8200],   // 43 exit
    // C-curve (180° turnaround)
    [1950, 8080],   // 44
    [1900, 7900],   // 45
    [1920, 7730],   // 46 apex
    [2050, 7640],   // 47
    [2200, 7660],   // 48
    // Tight esses exit
    [2320, 7540],   // 49
    [2250, 7400],   // 50
    [2350, 7260],   // 51
    // CP2
    [2400, 7080],   // 52 << CP2: Canyon Exit

    // ===== ZONE 3: RIVERBED (53-73) — Winding, irregular 50:50 =====
    [2450, 6880],   // 53
    [2550, 6700],   // 54 straight segment
    [2700, 6560],   // 55
    // Sweeper right
    [2900, 6450],   // 56
    [3050, 6380],   // 57
    [3150, 6260],   // 58 curve tightens
    // Winding section
    [3100, 6080],   // 59 left
    [3000, 5940],   // 60
    [3080, 5780],   // 61 right
    [3200, 5650],   // 62
    // C-curve
    [3300, 5490],   // 63
    [3320, 5310],   // 64
    [3240, 5160],   // 65 apex
    [3100, 5100],   // 66
    [2960, 5150],   // 67
    // Quick esses
    [2880, 5000],   // 68
    [2960, 4860],   // 69
    [2880, 4720],   // 70
    [2820, 4560],   // 71 straight exit
    [2800, 4380],   // 72
    // CP3
    [2800, 4200],   // 73 << CP3: Oasis

    // ===== ZONE 4: MOUNTAIN (74-97) — Switchbacks, hairpins dominant =====
    [2780, 4000],   // 74
    [2730, 3840],   // 75
    // Switchback 1 — right then left
    [2650, 3680],   // 76
    [2500, 3580],   // 77 right
    [2350, 3520],   // 78
    [2500, 3380],   // 79 switch left
    [2680, 3300],   // 80
    // Hairpin (180° right)
    [2800, 3180],   // 81
    [2850, 3020],   // 82
    [2780, 2870],   // 83 apex
    [2620, 2800],   // 84
    [2480, 2850],   // 85 exit
    // Switchback 2
    [2380, 2710],   // 86
    [2480, 2560],   // 87 switch
    [2650, 2480],   // 88
    [2580, 2320],   // 89 switch back
    [2420, 2240],   // 90
    // Hairpin (180° left)
    [2320, 2100],   // 91
    [2300, 1930],   // 92
    [2380, 1780],   // 93 apex
    [2530, 1720],   // 94
    [2680, 1770],   // 95
    // Short exit to summit
    [2780, 1640],   // 96
    // CP4
    [2850, 1480],   // 97 << CP4: Summit

    // ===== ZONE 5: SPRINT (98-121) — Fast paved, flowing curves =====
    [2950, 1340],   // 98
    [3100, 1240],   // 99  long straight diagonal
    [3300, 1160],   // 100
    [3550, 1100],   // 101
    // Sweeper right
    [3800, 1080],   // 102
    [4000, 1120],   // 103
    [4150, 1100],   // 104
    // Gentle S
    [4350, 1060],   // 105 straight
    [4550, 1020],   // 106
    [4750, 1060],   // 107 gentle left
    [4900, 1020],   // 108
    // Long straight
    [5100, 980],    // 109
    [5350, 960],    // 110
    [5600, 950],    // 111
    // Medium right curve
    [5800, 980],    // 112
    [5950, 1050],   // 113
    [6080, 1000],   // 114 straightens
    // Final straight
    [6250, 960],    // 115
    [6450, 940],    // 116
    [6650, 930],    // 117
    // Gentle curve to finish
    [6850, 950],    // 118
    [7050, 1000],   // 119
    [7200, 1060],   // 120
    // FINISH
    [7350, 1100],   // 121
  ],

  checkpoints: [
    { waypointIndex: 26, timeBonus: 22000, name: 'CP1: Dune Ridge' },
    { waypointIndex: 52, timeBonus: 20000, name: 'CP2: Canyon Exit' },
    { waypointIndex: 73, timeBonus: 20000, name: 'CP3: Oasis' },
    { waypointIndex: 97, timeBonus: 22000, name: 'CP4: Summit' },
  ],

  zones: [
    {
      name: 'desert', fromWP: 0, toWP: 26,
      bgTile: 'bg_desert',
      roadType: 'sand',
      roadColor: 0xb89060, roadBorder: 0x9a7040,
      trackWidth: 110,
      scenery: ['cactus', 'bush_dry', 'rock_desert'],
      sceneryDensity: 2,
    },
    {
      name: 'canyon', fromWP: 26, toWP: 52,
      bgTile: 'bg_canyon',
      roadType: 'dirt',
      roadColor: 0x8a7555, roadBorder: 0x6a5535,
      trackWidth: 75,
      scenery: ['canyon_wall', 'rock_red'],
      sceneryDensity: 3,
    },
    {
      name: 'riverbed', fromWP: 52, toWP: 73,
      bgTile: 'bg_riverbed',
      roadType: 'dirt',
      roadColor: 0x8a7555, roadBorder: 0x6a5a40,
      trackWidth: 100,
      scenery: ['dead_tree', 'bush_green', 'rock_grey'],
      sceneryDensity: 2,
    },
    {
      name: 'mountain', fromWP: 73, toWP: 97,
      bgTile: 'bg_mountain',
      roadType: 'rocky',
      roadColor: 0x5a5a55, roadBorder: 0x4a4a45,
      trackWidth: 80,
      scenery: ['pine_tree', 'mountain_rock', 'snow_patch'],
      sceneryDensity: 2,
    },
    {
      name: 'sprint', fromWP: 97, toWP: 121,
      bgTile: 'bg_sprint',
      roadType: 'paved',
      roadColor: 0x3a3a42, roadBorder: 0x5a5a62,
      trackWidth: 120,
      scenery: ['bush_green', 'bush_dry'],
      sceneryDensity: 2,
    },
  ],

  startX: 500, startY: 14150, startAngle: -90,
  initialTime: 35000,

  roadPhysics: {
    paved:   { accel: 243, friction: 0.990, turn: 110, label: 'PAVED' },
    dirt:    { accel: 188, friction: 0.978, turn: 130, label: 'DIRT' },
    sand:    { accel: 141, friction: 0.965, turn: 115, label: 'SAND' },
    rocky:   { accel: 122, friction: 0.960, turn: 140, label: 'ROCKY' },
    offroad: { accel: 83,  friction: 0.945, turn: 85,  label: 'OFF-ROAD' },
  },

  obstacleConfig: {
    desert:   { types: ['obs_sand_pile', 'obs_tumbleweed', 'obs_small_rock'], density: 0.22 },
    canyon:   { types: ['obs_fallen_rock', 'obs_rock_debris', 'obs_small_rock'], density: 0.25 },
    riverbed: { types: ['obs_puddle', 'obs_mud_patch', 'obs_log'], density: 0.22 },
    mountain: { types: ['obs_rock_slide', 'obs_pothole', 'obs_fallen_rock'], density: 0.28 },
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
