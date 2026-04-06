/**
 * Track v3.0 — Parts-based track system
 * Track is defined as a sequence of "parts" (straight, curve, turn, hairpin, etc.)
 * Waypoints are auto-generated from parts for backward compatibility.
 * Phase 1: Programmatic rendering (solid colors + patterns)
 * Phase 2: DALL-E image replacement
 */

// ---- Direction Helpers ----
const DIR_VECTORS = {
  north: { dx: 0, dy: -1 },
  south: { dx: 0, dy: 1 },
  east:  { dx: 1, dy: 0 },
  west:  { dx: -1, dy: 0 },
};

const DIR_RIGHT = { north: 'east', east: 'south', south: 'west', west: 'north' };
const DIR_LEFT  = { north: 'west', west: 'south', south: 'east', east: 'north' };

const DIR_RIGHT_VEC = {
  north: { dx: 1, dy: 0 },
  east:  { dx: 0, dy: 1 },
  south: { dx: -1, dy: 0 },
  west:  { dx: 0, dy: -1 },
};

// ---- Part Types ----
const partTypes = {
  straight:   { width: 256, height: 512, fwdDist: 512, xShift: 0 },
  curve_l:    { width: 256, height: 512, fwdDist: 512, xShift: -40 },
  curve_r:    { width: 256, height: 512, fwdDist: 512, xShift: 40 },
  s_curve:    { width: 256, height: 512, fwdDist: 512, xShift: 0 },
  hairpin_l:  { width: 256, height: 512, fwdDist: 512, xShift: -80 },
  hairpin_r:  { width: 256, height: 512, fwdDist: 512, xShift: 80 },
  turn_90_l:  { width: 512, height: 512, turnRadius: 200 },
  turn_90_r:  { width: 512, height: 512, turnRadius: 200 },
  straight_h: { width: 512, height: 256, fwdDist: 512, xShift: 0 },
};

// ---- Zone Configuration ----
const zoneConfig = {
  desert: {
    bgColor: 0xD2B48C,
    roadColor: 0x9B7B4A,
    edgeColor: 0x8a6a30,
    roadType: 'sand',
    trackWidth: 100,
    barrierColor: 0x8a6a30,
    barrierStyle: 'wood_fence',
    label: 'Desert',
  },
  trans_desert_canyon: {
    bgColor: 0xC4A06C,
    roadColor: 0x8B6B3A,
    edgeColor: 0x7a5a20,
    roadType: 'dirt',
    trackWidth: 100,
    barrierColor: 0x7a5a20,
    barrierStyle: 'wood_fence',
    label: 'Transition',
    transition: { from: 'desert', to: 'canyon' },
  },
  canyon: {
    bgColor: 0x8B6914,
    roadColor: 0x7B5B2A,
    edgeColor: 0x6a4a30,
    roadType: 'dirt',
    trackWidth: 100,
    barrierColor: 0x6a4a30,
    barrierStyle: 'metal_guardrail',
    label: 'Canyon',
  },
  trans_canyon_riverbed: {
    bgColor: 0x6B8B3A,
    roadColor: 0x6B6B3A,
    edgeColor: 0x5a6a20,
    roadType: 'dirt',
    trackWidth: 100,
    barrierColor: 0x5a6a20,
    barrierStyle: 'metal_guardrail',
    label: 'Transition',
    transition: { from: 'canyon', to: 'riverbed' },
  },
  riverbed: {
    bgColor: 0x4A7A4A,
    roadColor: 0x7B6B3A,
    edgeColor: 0x6a5a30,
    roadType: 'dirt',
    trackWidth: 100,
    barrierColor: 0x6a5a30,
    barrierStyle: 'wood_fence',
    label: 'Riverbed',
  },
  trans_riverbed_mountain: {
    bgColor: 0x6A8A6A,
    roadColor: 0x8B8B7A,
    edgeColor: 0x7a7a70,
    roadType: 'rocky',
    trackWidth: 100,
    barrierColor: 0x7a7a70,
    barrierStyle: 'wood_fence',
    label: 'Transition',
    transition: { from: 'riverbed', to: 'mountain' },
  },
  mountain: {
    bgColor: 0xE8E8F0,
    roadColor: 0xB0B0A8,
    edgeColor: 0x8a8a80,
    roadType: 'rocky',
    trackWidth: 100,
    barrierColor: 0x8a8a80,
    barrierStyle: 'stone_wall',
    label: 'Mountain',
  },
  trans_mountain_sprint: {
    bgColor: 0xA0A0A8,
    roadColor: 0x606060,
    edgeColor: 0x888888,
    roadType: 'paved',
    trackWidth: 100,
    barrierColor: 0x888888,
    barrierStyle: 'stone_wall',
    label: 'Transition',
    transition: { from: 'mountain', to: 'sprint' },
  },
  sprint: {
    bgColor: 0x3A3A42,
    roadColor: 0x2A2A2A,
    edgeColor: 0x888888,
    roadType: 'paved',
    trackWidth: 100,
    barrierColor: 0x888888,
    barrierStyle: 'jersey_barrier',
    label: 'Sprint',
  },
};

// ---- Parts Definition ----
const parts = [
  // === ZONE 1: DESERT (넓은 사바나, 완만한 조합) ===
  { type: 'straight', zone: 'desert' },
  { type: 'straight', zone: 'desert' },
  { type: 'curve_l', zone: 'desert' },
  { type: 'straight', zone: 'desert' },
  { type: 'curve_r', zone: 'desert' },
  { type: 'straight', zone: 'desert' },
  { type: 's_curve', zone: 'desert' },
  { type: 'straight', zone: 'desert' },
  { type: 'hairpin_r', zone: 'desert' },
  { type: 'straight', zone: 'desert' },

  // === TRANSITION: DESERT → CANYON ===
  { type: 'straight', zone: 'trans_desert_canyon' },

  // === ZONE 2: CANYON (좁고 거친, 헤어핀+S커브) ===
  { type: 'straight', zone: 'canyon' },
  { type: 'curve_r', zone: 'canyon' },
  { type: 'straight', zone: 'canyon' },
  { type: 'hairpin_l', zone: 'canyon' },
  { type: 'straight', zone: 'canyon' },
  { type: 's_curve', zone: 'canyon' },
  { type: 'straight', zone: 'canyon' },

  // === TRANSITION: CANYON → RIVERBED ===
  { type: 'straight', zone: 'trans_canyon_riverbed' },

  // === ZONE 3: RIVERBED (습지, 중간 난이도) ===
  { type: 'straight', zone: 'riverbed' },
  { type: 'curve_l', zone: 'riverbed' },
  { type: 'curve_r', zone: 'riverbed' },
  { type: 'straight', zone: 'riverbed' },
  { type: 'hairpin_r', zone: 'riverbed' },
  { type: 'straight', zone: 'riverbed' },
  { type: 'curve_l', zone: 'riverbed' },
  { type: 'straight', zone: 'riverbed' },

  // === TRANSITION: RIVERBED → MOUNTAIN ===
  { type: 'straight', zone: 'trans_riverbed_mountain' },

  // === ZONE 4: MOUNTAIN (산악, turn_90 사용 금지) ===
  { type: 'straight', zone: 'mountain' },
  { type: 'curve_l', zone: 'mountain' },
  { type: 'straight', zone: 'mountain' },
  { type: 'curve_r', zone: 'mountain' },
  { type: 'straight', zone: 'mountain' },
  { type: 'hairpin_l', zone: 'mountain' },
  { type: 'straight', zone: 'mountain' },

  // === TRANSITION: MOUNTAIN → SPRINT ===
  { type: 'straight', zone: 'trans_mountain_sprint' },

  // === ZONE 5: SPRINT (도심 격자, 직선+90도) ===
  { type: 'straight', zone: 'sprint' },
  { type: 'straight', zone: 'sprint' },
  { type: 'turn_90_r', zone: 'sprint' },
  { type: 'straight_h', zone: 'sprint' },
  { type: 'turn_90_l', zone: 'sprint' },
  { type: 'straight', zone: 'sprint' },
  { type: 'straight', zone: 'sprint' },
  { type: 'turn_90_l', zone: 'sprint' },
  { type: 'straight_h', zone: 'sprint' },
  { type: 'turn_90_r', zone: 'sprint' },
  { type: 'straight', zone: 'sprint' },
  { type: 'straight', zone: 'sprint' },  // FINISH
  { type: 'straight', zone: 'sprint' },  // post-finish extension
];

// ---- Turn arc configurations (pre-computed for each direction) ----
const R = 200; // turn radius

// point on arc: (cx + R*cos(θ), cy - R*sin(θ))  [game coords, Y-down]
const TURN_90_R_CFG = {
  north: { cdx: +R, cdy: 0,  sa: Math.PI,     ea: Math.PI/2,       exitDir: 'east',  edx: +R, edy: -R },
  east:  { cdx: 0,  cdy: +R, sa: Math.PI/2,   ea: 0,               exitDir: 'south', edx: +R, edy: +R },
  south: { cdx: -R, cdy: 0,  sa: 0,           ea: -Math.PI/2,      exitDir: 'west',  edx: -R, edy: +R },
  west:  { cdx: 0,  cdy: -R, sa: -Math.PI/2,  ea: -Math.PI,        exitDir: 'north', edx: -R, edy: -R },
};

const TURN_90_L_CFG = {
  north: { cdx: -R, cdy: 0,  sa: 0,           ea: Math.PI/2,       exitDir: 'west',  edx: -R, edy: -R },
  east:  { cdx: 0,  cdy: -R, sa: -Math.PI/2,  ea: 0,               exitDir: 'north', edx: +R, edy: -R },
  south: { cdx: +R, cdy: 0,  sa: Math.PI,     ea: 3*Math.PI/2,     exitDir: 'east',  edx: +R, edy: +R },
  west:  { cdx: 0,  cdy: +R, sa: Math.PI/2,   ea: Math.PI,         exitDir: 'south', edx: -R, edy: +R },
};

// ---- Exit Direction ----
function getExitDirection(type, entryDir) {
  switch (type) {
    case 'straight':
    case 'curve_l':
    case 'curve_r':
    case 's_curve':
    case 'hairpin_l':
    case 'hairpin_r':
    case 'straight_h':
      return entryDir;
    case 'turn_90_r':
      return DIR_RIGHT[entryDir];
    case 'turn_90_l':
      return DIR_LEFT[entryDir];
    default:
      return entryDir;
  }
}

// ---- Part Exit Position ----
function getPartExit(type, x, y, direction) {
  const fwd = DIR_VECTORS[direction];
  const right = DIR_RIGHT_VEC[direction];
  const pt = partTypes[type];
  const exitDir = getExitDirection(type, direction);

  if (type === 'turn_90_r') {
    const cfg = TURN_90_R_CFG[direction];
    return { x: x + cfg.edx, y: y + cfg.edy, direction: exitDir };
  }
  if (type === 'turn_90_l') {
    const cfg = TURN_90_L_CFG[direction];
    return { x: x + cfg.edx, y: y + cfg.edy, direction: exitDir };
  }

  // Linear parts: move forward by fwdDist, shift perpendicular by xShift
  const dist = pt.fwdDist;
  const shift = pt.xShift;
  return {
    x: x + fwd.dx * dist + right.dx * shift,
    y: y + fwd.dy * dist + right.dy * shift,
    direction: exitDir,
  };
}

// ---- Bezier helpers ----
function quadBezier(p0, p1, p2, t) {
  const mt = 1 - t;
  return [
    mt*mt*p0[0] + 2*mt*t*p1[0] + t*t*p2[0],
    mt*mt*p0[1] + 2*mt*t*p1[1] + t*t*p2[1],
  ];
}

function cubicBezier(p0, p1, p2, p3, t) {
  const mt = 1 - t;
  return [
    mt*mt*mt*p0[0] + 3*mt*mt*t*p1[0] + 3*mt*t*t*p2[0] + t*t*t*p3[0],
    mt*mt*mt*p0[1] + 3*mt*mt*t*p1[1] + 3*mt*t*t*p2[1] + t*t*t*p3[1],
  ];
}

// ---- Waypoint Generation per Part ----
function generatePartWaypoints(type, x, y, direction) {
  const fwd = DIR_VECTORS[direction];
  const right = DIR_RIGHT_VEC[direction];
  const pts = [];

  if (type === 'straight' || type === 'straight_h') {
    // 4 evenly spaced points over 512px
    const dist = partTypes[type].fwdDist;
    for (let i = 0; i < 4; i++) {
      const t = i / 4;
      pts.push([x + fwd.dx * dist * t, y + fwd.dy * dist * t]);
    }
  } else if (type === 'curve_l' || type === 'curve_r') {
    // Quadratic bezier, 8 points
    const shift = partTypes[type].xShift;
    const dist = partTypes[type].fwdDist;
    const p0 = [x, y];
    const p1 = [x + fwd.dx * dist * 0.5 + right.dx * shift * 1.3,
                y + fwd.dy * dist * 0.5 + right.dy * shift * 1.3];
    const p2 = [x + fwd.dx * dist + right.dx * shift,
                y + fwd.dy * dist + right.dy * shift];
    for (let i = 0; i < 8; i++) {
      const t = i / 8;
      pts.push(quadBezier(p0, p1, p2, t));
    }
  } else if (type === 's_curve') {
    // S-curve: cubic bezier, 10 points
    const dist = partTypes[type].fwdDist;
    const sway = 50; // how far the S sways
    const p0 = [x, y];
    const p1 = [x + right.dx * sway + fwd.dx * dist * 0.25,
                y + right.dy * sway + fwd.dy * dist * 0.25];
    const p2 = [x - right.dx * sway + fwd.dx * dist * 0.75,
                y - right.dy * sway + fwd.dy * dist * 0.75];
    const p3 = [x + fwd.dx * dist, y + fwd.dy * dist];
    for (let i = 0; i < 10; i++) {
      const t = i / 10;
      pts.push(cubicBezier(p0, p1, p2, p3, t));
    }
  } else if (type === 'hairpin_l' || type === 'hairpin_r') {
    // U-shaped curve, 12 points via cubic bezier
    const shift = partTypes[type].xShift;
    const dist = partTypes[type].fwdDist;
    // Swing out wide then come back
    const p0 = [x, y];
    const p1 = [x + right.dx * shift * 1.8 + fwd.dx * dist * 0.3,
                y + right.dy * shift * 1.8 + fwd.dy * dist * 0.3];
    const p2 = [x + right.dx * shift * 1.8 + fwd.dx * dist * 0.7,
                y + right.dy * shift * 1.8 + fwd.dy * dist * 0.7];
    const p3 = [x + right.dx * shift + fwd.dx * dist,
                y + right.dy * shift + fwd.dy * dist];
    for (let i = 0; i < 12; i++) {
      const t = i / 12;
      pts.push(cubicBezier(p0, p1, p2, p3, t));
    }
  } else if (type === 'turn_90_r') {
    const cfg = TURN_90_R_CFG[direction];
    const cx = x + cfg.cdx, cy = y + cfg.cdy;
    for (let i = 0; i < 8; i++) {
      const t = i / 8;
      const angle = cfg.sa + (cfg.ea - cfg.sa) * t;
      pts.push([cx + R * Math.cos(angle), cy - R * Math.sin(angle)]);
    }
  } else if (type === 'turn_90_l') {
    const cfg = TURN_90_L_CFG[direction];
    const cx = x + cfg.cdx, cy = y + cfg.cdy;
    for (let i = 0; i < 8; i++) {
      const t = i / 8;
      const angle = cfg.sa + (cfg.ea - cfg.sa) * t;
      pts.push([cx + R * Math.cos(angle), cy - R * Math.sin(angle)]);
    }
  }

  return pts;
}

// ---- Full Waypoint Generation ----
function generateWaypoints(partsList, startX, startY) {
  const waypoints = [];
  const partBounds = []; // { partIndex, startWP, endWP, zone }
  let x = startX, y = startY, direction = 'north';

  for (let pi = 0; pi < partsList.length; pi++) {
    const part = partsList[pi];
    const pts = generatePartWaypoints(part.type, x, y, direction);
    const startWP = waypoints.length;

    if (pi === 0) {
      // Include all points for first part
      waypoints.push(...pts);
    } else {
      // Skip first point (overlaps with previous exit)
      for (let i = 1; i < pts.length; i++) {
        waypoints.push(pts[i]);
      }
    }

    const endWP = waypoints.length - 1;
    partBounds.push({ partIndex: pi, startWP, endWP, zone: part.zone, type: part.type });

    const exit = getPartExit(part.type, x, y, direction);
    x = exit.x; y = exit.y; direction = exit.direction;
  }

  // Add final exit point as last waypoint
  waypoints.push([x, y]);
  // Also add a couple extra for visual continuity
  const lastFwd = DIR_VECTORS[direction];
  waypoints.push([x + lastFwd.dx * 250, y + lastFwd.dy * 250]);
  waypoints.push([x + lastFwd.dx * 500, y + lastFwd.dy * 500]);

  return { waypoints, partBounds };
}

// ---- Generate zone array (backward compatible) ----
function generateZones(partBounds) {
  const zones = [];
  let currentZone = null;

  for (const pb of partBounds) {
    if (!currentZone || currentZone.name !== pb.zone) {
      if (currentZone) {
        currentZone.toWP = pb.startWP;
        zones.push(currentZone);
      }
      const zc = zoneConfig[pb.zone];
      currentZone = {
        name: pb.zone,
        fromWP: pb.startWP,
        toWP: 0,
        roadType: zc.roadType,
        roadColor: zc.roadColor,
        roadBorder: zc.edgeColor,
        trackWidth: zc.trackWidth,
        bgColor: zc.bgColor,
        edgeColor: zc.edgeColor,
        barrierStyle: zc.barrierStyle,
        scenery: [],
        sceneryDensity: 5,
        transition: zc.transition || null,
      };
    }
  }
  if (currentZone) {
    currentZone.toWP = partBounds[partBounds.length - 1].endWP + 3; // +3 for continuation points
    zones.push(currentZone);
  }

  return zones;
}

// ---- Generate checkpoints at zone transitions ----
function generateCheckpoints(partBounds) {
  // CP at the boundary between each main zone and its transition zone
  const mainZones = ['desert', 'canyon', 'riverbed', 'mountain'];
  const cpNames = ['CP1: Dune Ridge', 'CP2: Canyon Exit', 'CP3: Riverbed Crossing', 'CP4: Summit'];
  const checkpoints = [];

  for (let z = 0; z < mainZones.length; z++) {
    const zoneName = mainZones[z];
    // Find last partBound of this zone
    let lastPB = null;
    for (const pb of partBounds) {
      if (pb.zone === zoneName) lastPB = pb;
    }
    if (lastPB) {
      checkpoints.push({
        waypointIndex: lastPB.endWP,
        timeBonus: 15000,
        name: cpNames[z],
      });
    }
  }

  return checkpoints;
}

// ---- Validate track connections ----
export function validateTrack(partsList) {
  let direction = 'north';
  for (let i = 0; i < partsList.length; i++) {
    const part = partsList[i];
    const type = part.type;

    // Check entry compatibility
    if (type === 'straight' && direction !== 'north' && direction !== 'south') {
      // straight can technically work in any vertical direction
      // but for safety, allow only north/south
    }
    if (type === 'straight_h' && direction !== 'east' && direction !== 'west') {
      console.error(`Part ${i} (${type}): cannot accept ${direction} entry, needs east/west`);
      return false;
    }

    const exitDir = getExitDirection(type, direction);
    if (!exitDir) {
      console.error(`Part ${i} (${type}): invalid exit from ${direction} entry`);
      return false;
    }
    direction = exitDir;
  }
  if (direction !== 'north') {
    console.warn(`Track ends facing ${direction}, not north`);
  }
  return true;
}

// ---- Build TRACK_CONFIG ----
const START_X = 2000;
const START_Y = 14200;

const { waypoints, partBounds } = generateWaypoints(parts, START_X, START_Y);
const zones = generateZones(partBounds);
const checkpoints = generateCheckpoints(partBounds);

// Finish WP: 3 waypoints before the absolute end (last part's end)
const finishWP = waypoints.length - 4;

// Validate on load
const trackValid = validateTrack(parts);
console.log(`[Track] Parts: ${parts.length}, Waypoints: ${waypoints.length}, Zones: ${zones.length}, Valid: ${trackValid}`);
console.log(`[Track] Zone breakdown:`, zones.map(z => `${z.name}(WP ${z.fromWP}-${z.toWP})`).join(', '));
console.log(`[Track] Checkpoints:`, checkpoints.map(cp => `${cp.name}@WP${cp.waypointIndex}`).join(', '));
console.log(`[Track] Finish WP: ${finishWP}, Total track length: ${Math.round(Math.sqrt((waypoints[waypoints.length-1][0]-waypoints[0][0])**2+(waypoints[waypoints.length-1][1]-waypoints[0][1])**2))}px`);

export const TRACK_CONFIG = {
  name: 'Stage 1: Sahara Crossing',

  // Parts system (new)
  partTypes,
  parts,
  partBounds,
  zoneConfig,

  // Auto-generated (backward compatible)
  waypoints,
  zones,
  checkpoints,
  finishWP,

  startX: START_X,
  startY: START_Y,
  startAngle: -90,
  initialTime: 120000,
  roadWidth: 100,

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

// Export helper to get part exit (used by RaceScene for rendering)
export { getPartExit, getExitDirection, generatePartWaypoints, zoneConfig, DIR_VECTORS, DIR_RIGHT_VEC, DIR_RIGHT, DIR_LEFT, R as TURN_RADIUS };

// ---- Utility Functions (backward compatible) ----

export function getZoneByIndex(wpIndex, zonesArr) {
  for (const z of zonesArr) {
    if (wpIndex >= z.fromWP && wpIndex < z.toWP) return z;
  }
  return zonesArr[zonesArr.length - 1];
}

export function isOnTrack(x, y, waypointsArr, zonesArr) {
  for (let i = 0; i < waypointsArr.length - 1; i++) {
    const zone = getZoneByIndex(i, zonesArr);
    const halfW = (zone.trackWidth || 100) / 2;
    const dist = distToSeg(x, y, waypointsArr[i][0], waypointsArr[i][1], waypointsArr[i+1][0], waypointsArr[i+1][1]);
    if (dist < halfW) return { onTrack: true, zone };
  }
  return { onTrack: false, zone: null };
}

export function getTrackProgress(x, y, waypointsArr) {
  let minDist = Infinity, closestIdx = 0;
  for (let i = 0; i < waypointsArr.length; i++) {
    const d = Math.sqrt((x-waypointsArr[i][0])**2 + (y-waypointsArr[i][1])**2);
    if (d < minDist) { minDist = d; closestIdx = i; }
  }
  return { index: closestIdx, distance: minDist, progress: closestIdx / (waypointsArr.length - 1) };
}

export function checkCheckpoint(x, y, cp, waypointsArr) {
  const wp = waypointsArr[cp.waypointIndex];
  return Math.sqrt((x-wp[0])**2 + (y-wp[1])**2) < 100;
}

export function checkFinish(x, y, waypointsArr, config) {
  const fIdx = config?.finishWP ?? (waypointsArr.length - 1);
  const f = waypointsArr[fIdx];
  return Math.sqrt((x-f[0])**2 + (y-f[1])**2) < 100;
}

function distToSeg(px,py,x1,y1,x2,y2) {
  const dx=x2-x1,dy=y2-y1,l2=dx*dx+dy*dy;
  if(l2===0)return Math.sqrt((px-x1)**2+(py-y1)**2);
  let t=Math.max(0,Math.min(1,((px-x1)*dx+(py-y1)*dy)/l2));
  return Math.sqrt((px-(x1+t*dx))**2+(py-(y1+t*dy))**2);
}
