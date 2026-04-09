/**
 * Track v4.0 — 8-direction parts-based track system
 * Supports N/NE/E/SE/S/SW/W/NW directions, 45° and 90° turns,
 * diagonal straights, and hairpins.
 */

// ---- Direction Helpers (8-direction) ----
const DIR_VECTORS = {
  north:     { dx: 0,     dy: -1 },
  northeast: { dx: 0.707, dy: -0.707 },
  east:      { dx: 1,     dy: 0 },
  southeast: { dx: 0.707, dy: 0.707 },
  south:     { dx: 0,     dy: 1 },
  southwest: { dx: -0.707, dy: 0.707 },
  west:      { dx: -1,    dy: 0 },
  northwest: { dx: -0.707, dy: -0.707 },
};

const DIR_RIGHT = {
  north: 'east', northeast: 'southeast', east: 'south', southeast: 'southwest',
  south: 'west', southwest: 'northwest', west: 'north', northwest: 'northeast',
};
const DIR_LEFT = {
  north: 'west', northeast: 'northwest', east: 'north', southeast: 'northeast',
  south: 'east', southwest: 'southeast', west: 'south', northwest: 'southwest',
};

const DIR_45_RIGHT = {
  north: 'northeast', northeast: 'east', east: 'southeast', southeast: 'south',
  south: 'southwest', southwest: 'west', west: 'northwest', northwest: 'north',
};
const DIR_45_LEFT = {
  north: 'northwest', northwest: 'west', west: 'southwest', southwest: 'south',
  south: 'southeast', southeast: 'east', east: 'northeast', northeast: 'north',
};

const DIR_RIGHT_VEC = {
  north:     { dx: 1,     dy: 0 },
  northeast: { dx: 0.707, dy: 0.707 },
  east:      { dx: 0,     dy: 1 },
  southeast: { dx: -0.707, dy: 0.707 },
  south:     { dx: -1,    dy: 0 },
  southwest: { dx: -0.707, dy: -0.707 },
  west:      { dx: 0,     dy: -1 },
  northwest: { dx: 0.707, dy: -0.707 },
};

// ---- Part Types ----
const partTypes = {
  straight:      { fwdDist: 512, xShift: 0 },
  straight_h:    { fwdDist: 512, xShift: 0 },
  diag_straight: { fwdDist: 512, xShift: 0 },
  hairpin_l:     { fwdDist: 800, xShift: -600 },
  hairpin_r:     { fwdDist: 800, xShift: 600 },
  turn_45_l:     { turnRadius: 200, turnAngle: Math.PI / 4 },
  turn_45_r:     { turnRadius: 200, turnAngle: Math.PI / 4 },
  turn_90_l:     { turnRadius: 200, turnAngle: Math.PI / 2 },
  turn_90_r:     { turnRadius: 200, turnAngle: Math.PI / 2 },
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
    bgColor: 0xC4A06C, roadColor: 0x8B6B3A, edgeColor: 0x7a5a20,
    roadType: 'dirt', trackWidth: 100, barrierColor: 0x7a5a20,
    barrierStyle: 'wood_fence', label: 'Transition',
    transition: { from: 'desert', to: 'canyon' },
  },
  canyon: {
    bgColor: 0x8B6914, roadColor: 0x7B5B2A, edgeColor: 0x6a4a30,
    roadType: 'dirt', trackWidth: 100, barrierColor: 0x6a4a30,
    barrierStyle: 'metal_guardrail', label: 'Canyon',
  },
  trans_canyon_riverbed: {
    bgColor: 0x6B8B3A, roadColor: 0x6B6B3A, edgeColor: 0x5a6a20,
    roadType: 'dirt', trackWidth: 100, barrierColor: 0x5a6a20,
    barrierStyle: 'metal_guardrail', label: 'Transition',
    transition: { from: 'canyon', to: 'riverbed' },
  },
  riverbed: {
    bgColor: 0x4A7A4A, roadColor: 0x7B6B3A, edgeColor: 0x6a5a30,
    roadType: 'dirt', trackWidth: 100, barrierColor: 0x6a5a30,
    barrierStyle: 'wood_fence', label: 'Riverbed',
  },
  trans_riverbed_mountain: {
    bgColor: 0x6A8A6A, roadColor: 0x8B8B7A, edgeColor: 0x7a7a70,
    roadType: 'rocky', trackWidth: 100, barrierColor: 0x7a7a70,
    barrierStyle: 'wood_fence', label: 'Transition',
    transition: { from: 'riverbed', to: 'mountain' },
  },
  mountain: {
    bgColor: 0xE8E8F0, roadColor: 0xB0B0A8, edgeColor: 0x8a8a80,
    roadType: 'rocky', trackWidth: 100, barrierColor: 0x8a8a80,
    barrierStyle: 'stone_wall', label: 'Mountain',
  },
  trans_mountain_sprint: {
    bgColor: 0xA0A0A8, roadColor: 0x606060, edgeColor: 0x888888,
    roadType: 'paved', trackWidth: 100, barrierColor: 0x888888,
    barrierStyle: 'stone_wall', label: 'Transition',
    transition: { from: 'mountain', to: 'sprint' },
  },
  sprint: {
    bgColor: 0x3A3A42, roadColor: 0x2A2A2A, edgeColor: 0x888888,
    roadType: 'paved', trackWidth: 100, barrierColor: 0x888888,
    barrierStyle: 'jersey_barrier', label: 'Sprint',
  },
};

// ---- Turn arc computation (generalized for 8 directions) ----
const R = 200; // turn radius — sharp corners, drift required

function computeTurnArc(entryDir, turnAngle, turnDirection) {
  const rv = DIR_RIGHT_VEC[entryDir];
  if (turnDirection === 'right') {
    const sa = Math.atan2(rv.dy, -rv.dx);
    const ea = sa - turnAngle;
    const cdx = R * rv.dx, cdy = R * rv.dy;
    const edx = cdx + R * Math.cos(ea);
    const edy = cdy - R * Math.sin(ea);
    let exitDir;
    if (turnAngle > Math.PI / 4 + 0.1) exitDir = DIR_RIGHT[entryDir];
    else exitDir = DIR_45_RIGHT[entryDir];
    return { cdx, cdy, sa, ea, exitDir, edx, edy };
  } else {
    const sa = Math.atan2(-rv.dy, rv.dx);
    const ea = sa + turnAngle;
    const cdx = -R * rv.dx, cdy = -R * rv.dy;
    const edx = cdx + R * Math.cos(ea);
    const edy = cdy - R * Math.sin(ea);
    let exitDir;
    if (turnAngle > Math.PI / 4 + 0.1) exitDir = DIR_LEFT[entryDir];
    else exitDir = DIR_45_LEFT[entryDir];
    return { cdx, cdy, sa, ea, exitDir, edx, edy };
  }
}

// ---- Layout Builder (common logic) ----
const SAFE_GAP = 200; // minimum distance between non-adjacent road segments

function buildFromSkeleton(skeleton, startX, startY) {
  const d = 'desert';
  const result = [];
  const allWaypoints = [];
  let x = startX, y = startY, dir = 'north';
  const cpIndices = [];

  function addPart(type) {
    const part = { type, zone: d };
    const pts = generatePartWaypoints(type, x, y, dir);
    const newStartIdx = allWaypoints.length;
    for (let ni = 0; ni < pts.length; ni++) {
      const newIdx = newStartIdx + ni;
      for (let ei = 0; ei < allWaypoints.length; ei++) {
        if (Math.abs(newIdx - ei) < 8) continue;
        const dx = pts[ni][0] - allWaypoints[ei][0];
        const dy = pts[ni][1] - allWaypoints[ei][1];
        if (dx*dx + dy*dy < SAFE_GAP * SAFE_GAP) {
          return false;
        }
      }
    }
    result.push(part);
    if (result.length === 1) allWaypoints.push(...pts);
    else for (let i = 1; i < pts.length; i++) allWaypoints.push(pts[i]);
    const exit = getPartExit(type, x, y, dir);
    x = exit.x; y = exit.y; dir = exit.direction;
    return true;
  }

  function addStraightsUntilSafe(nextType, maxTries) {
    if (addPart(nextType)) return true;
    const straightType = (dir === 'east' || dir === 'west') ? 'straight_h' :
                         (dir === 'northeast' || dir === 'northwest' || dir === 'southeast' || dir === 'southwest') ? 'diag_straight' :
                         'straight';
    for (let t = 0; t < (maxTries || 10); t++) {
      addPart(straightType);
      if (addPart(nextType)) return true;
    }
    console.error(`[Layout] Could not place ${nextType} after ${maxTries || 10} straights`);
    return false;
  }

  for (const item of skeleton) {
    if (item.startsWith('CP')) {
      addPart('straight');
      cpIndices.push(result.length - 1);
      continue;
    }
    if (item === 'straight' || item === 'straight_h' || item === 'diag_straight') {
      addPart(item);
    } else {
      addStraightsUntilSafe(item, 8);
    }
  }

  console.log(`[Layout] Generated ${result.length} parts, ${cpIndices.length} CPs`);
  return { parts: result, cpIndices };
}

// ---- Layout Generators ----

function generateEasyLayout() {
  const skeleton = [
    // SS1: diagonal high-speed + C1 90° right
    'straight', 'straight',
    'turn_45_r', 'diag_straight', 'diag_straight', 'diag_straight', 'diag_straight', 'turn_45_l',
    'straight', 'straight',
    'turn_90_r', 'straight_h', 'straight_h', 'straight_h', 'straight_h', 'turn_90_l',
    'CP1',
    // SS2: C2 90°R + diagonal
    'straight', 'straight',
    'turn_90_r', 'straight_h', 'turn_90_l',
    'straight', 'turn_45_l', 'diag_straight', 'diag_straight', 'turn_45_r',
    'straight', 'straight',
    'turn_45_l', 'diag_straight', 'diag_straight', 'diag_straight', 'turn_45_r',
    'CP2',
    // SS3: simple 90° pair
    'straight', 'straight',
    'turn_90_r', 'straight_h', 'straight_h', 'straight_h', 'straight_h', 'turn_90_l',
    'CP3',
    // SS4: hairpin + C7 diagonal finish
    'straight', 'straight', 'straight',
    'hairpin_r',
    'straight',
    'turn_45_l', 'diag_straight', 'diag_straight', 'diag_straight', 'turn_45_r',
    'CP4',
    // FINISH
    'straight', 'straight', 'straight',
  ];
  return buildFromSkeleton(skeleton, 2000, 14200);
}

function generateNormalLayout() {
  const skeleton = [
    // SS1: diagonal → chicane → Z-corner
    'straight', 'straight',
    'turn_45_r', 'diag_straight', 'diag_straight', 'diag_straight', 'turn_45_l',
    'straight', 'straight',
    'turn_90_r', 'straight_h', 'straight_h', 'straight_h', 'turn_90_l',
    'straight',
    'turn_45_r', 'turn_90_l',  // Z-corner: N→NE→NW
    'diag_straight', 'turn_45_r',  // NW recover to N
    'CP1',

    // SS2: chicane → NW weave → chicane → NW weave
    'straight', 'straight',
    'turn_90_r', 'straight_h', 'turn_90_l',
    'straight',
    'turn_45_l', 'diag_straight', 'diag_straight', 'turn_45_r',
    'straight', 'straight',
    'turn_90_r', 'straight_h', 'straight_h', 'turn_90_l',
    'straight',
    'turn_45_l', 'diag_straight', 'diag_straight', 'diag_straight', 'turn_45_r',
    'CP2',

    // SS3: chicane → violent S → Z-corner → chicane
    'straight', 'straight',
    'turn_90_r', 'straight_h', 'straight_h', 'straight_h', 'turn_90_l',
    'straight', 'straight',
    'turn_90_r', 'turn_90_l',  // violent S: N→E→N
    'straight', 'straight',
    'turn_45_r', 'turn_90_l',  // Z-corner
    'diag_straight', 'turn_45_r',  // NW recover
    'straight',
    'turn_90_r', 'straight_h', 'straight_h', 'straight_h', 'turn_90_l',
    'CP3',

    // SS4: hairpin → diagonal → chicane
    'straight', 'straight', 'straight',
    'hairpin_r',
    'straight',
    'turn_45_l', 'diag_straight', 'diag_straight', 'turn_45_r',
    'straight',
    'turn_90_r', 'straight_h', 'straight_h', 'turn_90_l',
    'CP4',
    'straight', 'straight', 'straight',
  ];
  return buildFromSkeleton(skeleton, 2000, 16200);
}

function generateHardLayout() {
  const skeleton = [
    // SS1: fast start → Z-corner → chicane
    'straight', 'straight',
    'turn_45_r', 'diag_straight', 'diag_straight', 'turn_45_l',
    'straight',
    'turn_45_r', 'turn_90_l',  // Z-corner
    'diag_straight', 'turn_45_r',  // NW recover
    'straight',
    'turn_90_r', 'straight_h', 'straight_h', 'turn_90_l',
    'CP1',

    // SS2: triple chicane → deep Z → diagonal
    'straight', 'straight',
    'turn_45_r', 'diag_straight', 'turn_45_l',
    'straight',
    'turn_45_r', 'diag_straight', 'turn_45_l',
    'straight',
    'turn_45_r', 'diag_straight', 'turn_45_l',
    'straight', 'straight',
    'turn_90_r', 'turn_45_l',  // deep Z: N→E→NE
    'diag_straight', 'diag_straight', 'turn_45_l',  // NE recover to N
    'straight',
    'turn_45_l', 'diag_straight', 'diag_straight', 'diag_straight', 'turn_45_r',
    'CP2',

    // SS3: double violent S → Z-corner → diagonal
    'straight', 'straight',
    'turn_90_r', 'turn_90_l',  // violent S: N→E→N
    'straight', 'straight',
    'turn_90_l', 'turn_90_r',  // reverse violent S: N→W→N
    'straight', 'straight',
    'turn_45_r', 'turn_90_l',  // Z-corner
    'diag_straight', 'turn_45_r',  // NW recover
    'straight',
    'turn_45_l', 'diag_straight', 'diag_straight', 'diag_straight', 'turn_45_r',
    'CP3',

    // SS4: dual hairpins → Z-corner → chicane
    'straight', 'straight',
    'hairpin_r',
    'straight', 'straight',
    'turn_90_r', 'straight_h', 'straight_h', 'turn_90_l',
    'straight',
    'hairpin_l',
    'straight', 'straight',
    'turn_45_l', 'diag_straight', 'diag_straight', 'turn_45_r',
    'straight',
    'turn_45_r', 'turn_90_l',  // final Z-corner
    'diag_straight', 'turn_45_r',  // NW recover
    'straight',
    'turn_90_r', 'straight_h', 'straight_h', 'turn_90_l',
    'CP4',
    'straight', 'straight', 'straight',
  ];
  return buildFromSkeleton(skeleton, 2000, 18200);
}

// ---- Track Layouts ----
const TRACK_LAYOUTS = {
  easy:   { name: 'Desert Rally — Easy',   generator: generateEasyLayout,   initialTime: 120000 },
  normal: { name: 'Desert Rally — Normal', generator: generateNormalLayout, initialTime: 130000 },
  hard:   { name: 'Desert Rally — Hard',   generator: generateHardLayout,   initialTime: 140000 },
};

export function getTrackIds() { return Object.keys(TRACK_LAYOUTS); }
export function getTrackInfo(id) { return TRACK_LAYOUTS[id]; }

// ---- Exit Direction ----
function getExitDirection(type, entryDir) {
  switch (type) {
    case 'straight':
    case 'straight_h':
    case 'diag_straight':
    case 'hairpin_l':
    case 'hairpin_r':
      return entryDir;
    case 'turn_90_r':
      return DIR_RIGHT[entryDir];
    case 'turn_90_l':
      return DIR_LEFT[entryDir];
    case 'turn_45_r':
      return DIR_45_RIGHT[entryDir];
    case 'turn_45_l':
      return DIR_45_LEFT[entryDir];
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

  if (type.startsWith('turn_') && type.endsWith('_r')) {
    const arc = computeTurnArc(direction, pt.turnAngle, 'right');
    return { x: x + arc.edx, y: y + arc.edy, direction: exitDir };
  }
  if (type.startsWith('turn_') && type.endsWith('_l')) {
    const arc = computeTurnArc(direction, pt.turnAngle, 'left');
    return { x: x + arc.edx, y: y + arc.edy, direction: exitDir };
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
  const pt = partTypes[type];
  const pts = [];

  if (type === 'straight' || type === 'straight_h' || type === 'diag_straight') {
    const dist = pt.fwdDist;
    for (let i = 0; i < 4; i++) {
      const t = i / 4;
      pts.push([x + fwd.dx * dist * t, y + fwd.dy * dist * t]);
    }
  } else if (type === 'hairpin_l' || type === 'hairpin_r') {
    // Sharp ㄷ-shaped hairpin: straight → 90° arc → horizontal → 90° arc → straight
    const shift = pt.xShift; // ±200
    const dist = pt.fwdDist; // 512
    const side = type === 'hairpin_r' ? 1 : -1;
    const arcR = 200; // 90° arc radius — large enough for safe gap
    const legLen = (dist - 2 * arcR) / 2; // straight leg length before/after arcs
    const horizLen = Math.abs(shift) - 2 * arcR; // horizontal section length

    // Phase 1: straight entry (fwd direction)
    for (let i = 0; i < 3; i++) {
      const t = i / 3;
      pts.push([x + fwd.dx * legLen * t, y + fwd.dy * legLen * t]);
    }

    // Phase 2: first 90° arc (fwd → side direction)
    const a1cx = x + fwd.dx * legLen + right.dx * side * arcR;
    const a1cy = y + fwd.dy * legLen + right.dy * side * arcR;
    for (let i = 0; i <= 4; i++) {
      const t = i / 4;
      // Rotate from -side*right back to fwd direction by 90°
      const cos_t = Math.cos(t * Math.PI / 2);
      const sin_t = Math.sin(t * Math.PI / 2);
      pts.push([
        a1cx + (-right.dx * side * arcR) * cos_t + (fwd.dx * arcR) * sin_t,
        a1cy + (-right.dy * side * arcR) * cos_t + (fwd.dy * arcR) * sin_t
      ]);
    }

    // Phase 3: horizontal section (side direction)
    const hStartX = a1cx + fwd.dx * arcR;
    const hStartY = a1cy + fwd.dy * arcR;
    for (let i = 1; i <= 3; i++) {
      const t = i / 4;
      pts.push([
        hStartX + right.dx * side * horizLen * t,
        hStartY + right.dy * side * horizLen * t
      ]);
    }

    // Phase 4: second 90° arc (side → fwd direction, U-turn back)
    const a2cx = hStartX + right.dx * side * horizLen + fwd.dx * arcR;
    const a2cy = hStartY + right.dy * side * horizLen + fwd.dy * arcR;
    for (let i = 0; i <= 4; i++) {
      const t = i / 4;
      const cos_t = Math.cos(t * Math.PI / 2);
      const sin_t = Math.sin(t * Math.PI / 2);
      pts.push([
        a2cx + (-fwd.dx * arcR) * cos_t + (right.dx * side * arcR) * sin_t,
        a2cy + (-fwd.dy * arcR) * cos_t + (right.dy * side * arcR) * sin_t
      ]);
    }

    // Phase 5: straight exit (fwd direction, offset by shift)
    const exitX = a2cx + right.dx * side * arcR;
    const exitY = a2cy + right.dy * side * arcR;
    for (let i = 1; i <= 2; i++) {
      const t = i / 3;
      pts.push([exitX + fwd.dx * legLen * t, exitY + fwd.dy * legLen * t]);
    }
  } else if (type.startsWith('turn_') && type.endsWith('_r')) {
    const arc = computeTurnArc(direction, pt.turnAngle, 'right');
    const cx = x + arc.cdx, cy = y + arc.cdy;
    const numPts = Math.max(6, Math.round(pt.turnAngle / (Math.PI / 8)));
    for (let i = 0; i < numPts; i++) {
      const t = i / numPts;
      const angle = arc.sa + (arc.ea - arc.sa) * t;
      pts.push([cx + R * Math.cos(angle), cy - R * Math.sin(angle)]);
    }
  } else if (type.startsWith('turn_') && type.endsWith('_l')) {
    const arc = computeTurnArc(direction, pt.turnAngle, 'left');
    const cx = x + arc.cdx, cy = y + arc.cdy;
    const numPts = Math.max(6, Math.round(pt.turnAngle / (Math.PI / 8)));
    for (let i = 0; i < numPts; i++) {
      const t = i / numPts;
      const angle = arc.sa + (arc.ea - arc.sa) * t;
      pts.push([cx + R * Math.cos(angle), cy - R * Math.sin(angle)]);
    }
  }

  return pts;
}

// ---- Full Waypoint Generation ----
function generateWaypoints(partsList, startX, startY) {
  const waypoints = [];
  const partBounds = [];
  let x = startX, y = startY, direction = 'north';

  for (let pi = 0; pi < partsList.length; pi++) {
    const part = partsList[pi];
    const pts = generatePartWaypoints(part.type, x, y, direction);
    const startWP = waypoints.length;

    if (pi === 0) {
      waypoints.push(...pts);
    } else {
      for (let i = 1; i < pts.length; i++) {
        waypoints.push(pts[i]);
      }
    }

    const endWP = waypoints.length - 1;
    partBounds.push({ partIndex: pi, startWP, endWP, zone: part.zone, type: part.type });

    const exit = getPartExit(part.type, x, y, direction);
    x = exit.x; y = exit.y; direction = exit.direction;
  }

  waypoints.push([x, y]);
  const lastFwd = DIR_VECTORS[direction];
  waypoints.push([x + lastFwd.dx * 250, y + lastFwd.dy * 250]);
  waypoints.push([x + lastFwd.dx * 500, y + lastFwd.dy * 500]);

  return { waypoints, partBounds };
}

// ---- Generate zone array ----
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
    currentZone.toWP = partBounds[partBounds.length - 1].endWP + 3;
    zones.push(currentZone);
  }

  return zones;
}

// ---- Generate checkpoints at specific part indices ----
function generateCheckpoints(partBounds, cpIndices) {
  const cpDefs = cpIndices.map((idx, i) => ({
    partIdx: idx, name: `CP${i + 1}`, timeBonus: 15000,
  }));
  const checkpoints = [];
  for (const cp of cpDefs) {
    if (cp.partIdx < partBounds.length) {
      checkpoints.push({
        waypointIndex: partBounds[cp.partIdx].endWP,
        timeBonus: cp.timeBonus,
        name: cp.name,
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

// ---- Generate arrow events with combination pattern detection ----
function generateArrowHints(partsList, waypointsArr, partBoundsArr) {
  const events = [];
  const isTurn = (t) => t && (t.startsWith('turn_') || t.startsWith('hairpin'));
  const isStraightType = (t) => t === 'straight' || t === 'straight_h' || t === 'diag_straight';

  // Collect turn indices
  const turnIndices = [];
  for (let i = 0; i < partsList.length; i++) {
    if (isTurn(partsList[i].type)) turnIndices.push(i);
  }

  const consumed = new Set();

  // Pass 1: detect combinations (higher priority)
  for (let ti = 0; ti < turnIndices.length; ti++) {
    const i = turnIndices[ti];
    if (consumed.has(i)) continue;
    const type = partsList[i].type;

    // Check for chicane: 3+ alternating turns with only diag_straight between
    if (ti + 2 < turnIndices.length) {
      const j = turnIndices[ti+1], k = turnIndices[ti+2];
      const t1 = partsList[i].type, t2 = partsList[j].type, t3 = partsList[k].type;
      const alt1 = t1.includes('_r') && t2.includes('_l') && t3.includes('_r');
      const alt2 = t1.includes('_l') && t2.includes('_r') && t3.includes('_l');
      if (alt1 || alt2) {
        // Check only straights/diags between them
        let allStraight = true;
        for (let m = i+1; m < k; m++) {
          if (!isStraightType(partsList[m].type) && !isTurn(partsList[m].type)) { allStraight = false; break; }
        }
        if (allStraight && k - i <= 8) {
          consumed.add(i); consumed.add(j); consumed.add(k);
          events.push({
            type: 'arrow_chicane',
            startWP: partBoundsArr[i].startWP,
            endWP: partBoundsArr[k].endWP,
          });
          ti += 2; // skip consumed
          continue;
        }
      }
    }

    // Check for S-curve or Z-corner: 2 consecutive turns
    if (ti + 1 < turnIndices.length) {
      const j = turnIndices[ti+1];
      if (consumed.has(j)) continue;
      const t1 = partsList[i].type, t2 = partsList[j].type;
      // Check no straight between (allow diag_straight for Z recovery)
      let onlyDiagBetween = true;
      for (let m = i+1; m < j; m++) {
        if (!isStraightType(partsList[m].type)) { onlyDiagBetween = false; break; }
      }
      const gap = j - i;
      const isR1 = t1.includes('_r'), isR2 = t2.includes('_r');

      if (isR1 !== isR2 && gap <= 4) {
        // Opposite directions = S or Z
        const is90_1 = t1.includes('90'), is90_2 = t2.includes('90');
        const is45_1 = t1.includes('45'), is45_2 = t2.includes('45');

        let comboType;
        if (is90_1 && is90_2 && gap <= 2) {
          // Violent S: 90→90 opposite, no gap
          comboType = isR1 ? 'arrow_s_rl' : 'arrow_s_lr';
        } else if ((is45_1 && is90_2) || (is90_1 && is45_2)) {
          // Z-corner: 45→90 or 90→45
          comboType = isR1 ? 'arrow_z_rl' : 'arrow_z_lr';
        } else if (is45_1 && is45_2 && gap <= 2) {
          // Quick flick: 45→45 opposite
          comboType = isR1 ? 'arrow_s_rl' : 'arrow_s_lr';
        }

        if (comboType) {
          consumed.add(i); consumed.add(j);
          events.push({
            type: comboType,
            startWP: partBoundsArr[i].startWP,
            endWP: partBoundsArr[j].endWP,
          });
          ti++; // skip consumed
          continue;
        }
      }
    }
  }

  // Pass 2: individual turns not consumed by combos
  for (const i of turnIndices) {
    if (consumed.has(i)) continue;
    const type = partsList[i].type;
    let arrowType;
    if (type === 'turn_45_r') arrowType = 'arrow_45_r';
    else if (type === 'turn_45_l') arrowType = 'arrow_45_l';
    else if (type === 'turn_90_r') arrowType = 'arrow_90_r';
    else if (type === 'turn_90_l') arrowType = 'arrow_90_l';
    else if (type === 'hairpin_r') arrowType = 'arrow_hairpin_r';
    else if (type === 'hairpin_l') arrowType = 'arrow_hairpin_l';
    else continue;

    events.push({
      type: arrowType,
      startWP: partBoundsArr[i].startWP,
      endWP: partBoundsArr[i].endWP,
    });
  }

  // Sort by startWP
  events.sort((a, b) => a.startWP - b.startWP);

  // Add world coordinates and show distance
  const SHOW_AHEAD = 300; // show arrow 300px before corner
  for (const ev of events) {
    // Find WP that's ~300px before startWP along the track
    let accumDist = 0;
    let showWP = ev.startWP;
    for (let w = ev.startWP; w > 0; w--) {
      const dx = waypointsArr[w][0] - waypointsArr[w-1][0];
      const dy = waypointsArr[w][1] - waypointsArr[w-1][1];
      accumDist += Math.sqrt(dx*dx + dy*dy);
      if (accumDist >= SHOW_AHEAD) { showWP = w-1; break; }
    }
    ev.showWP = showWP;
    ev.x = waypointsArr[showWP][0];
    ev.y = waypointsArr[showWP][1];
  }

  console.log('[Arrows]', events.length, 'events:', events.map(e => e.type).join(', '));
  return events;
}

// ---- Open-field segments (no barriers) ----
function generateOpenFieldSegments(partsList, partBoundsArr) {
  const segments = [];
  let runStart = -1;
  let runCount = 0;
  for (let i = 0; i < partsList.length; i++) {
    const type = partsList[i].type;
    if (type === 'diag_straight' || (type === 'straight' && i > 0 && i < partsList.length - 3)) {
      if (runStart < 0) runStart = i;
      runCount++;
    } else {
      if (runCount >= 3 && runStart >= 0) {
        segments.push([
          partBoundsArr[runStart].startWP,
          partBoundsArr[runStart + runCount - 1].endWP
        ]);
      }
      runStart = -1;
      runCount = 0;
    }
  }
  if (runCount >= 3 && runStart >= 0) {
    segments.push([
      partBoundsArr[runStart].startWP,
      partBoundsArr[runStart + runCount - 1].endWP
    ]);
  }
  return segments;
}

// ---- Tire wall positions (corner outsides) ----
function generateTireWalls(partsList, partBoundsArr, waypointsArr) {
  const walls = [];
  for (let i = 0; i < partsList.length; i++) {
    const type = partsList[i].type;
    if (!type.startsWith('turn_90') && !type.startsWith('hairpin')) continue;
    const pb = partBoundsArr[i];
    const isRight = type.includes('_r');
    const midWP = Math.floor((pb.startWP + pb.endWP) / 2);
    if (midWP < waypointsArr.length) {
      walls.push({
        wpIndex: midWP,
        side: isRight ? 1 : -1,
        type: type.startsWith('hairpin') ? 'large' : 'small',
      });
    }
  }
  return walls;
}

// ---- Road overlap check ----
const MIN_ROAD_GAP = 200;
function checkOverlaps(wp) {
  const errors = [];
  for (let i = 0; i < wp.length; i++) {
    for (let j = i + 8; j < wp.length; j++) {
      const dx = wp[i][0] - wp[j][0], dy = wp[i][1] - wp[j][1];
      if (dx*dx + dy*dy < MIN_ROAD_GAP * MIN_ROAD_GAP) {
        errors.push({ wi: i, wj: j, dist: Math.round(Math.sqrt(dx*dx+dy*dy)) });
      }
    }
  }
  return errors;
}

// ---- Build TRACK_CONFIG dynamically ----
export function buildTrackConfig(trackId) {
  const layout = TRACK_LAYOUTS[trackId || 'easy'];
  const { parts, cpIndices } = layout.generator();

  const startX = parts.length > 0 ? 2000 : 2000;
  const startY = trackId === 'hard' ? 18200 : trackId === 'normal' ? 16200 : 14200;

  const { waypoints, partBounds } = generateWaypoints(parts, startX, startY);
  const zones = generateZones(partBounds);
  const checkpoints = generateCheckpoints(partBounds, cpIndices);
  const arrowHints = generateArrowHints(parts, waypoints, partBounds);
  const openFieldSegments = generateOpenFieldSegments(parts, partBounds);
  const tireWalls = generateTireWalls(parts, partBounds, waypoints);
  const finishWP = waypoints.length - 4;

  const overlapErrors = checkOverlaps(waypoints);
  if (overlapErrors.length > 0) {
    console.error(`[Overlap] ERROR: ${overlapErrors.length} conflicts found (< ${MIN_ROAD_GAP}px)`);
    overlapErrors.slice(0, 5).forEach(e =>
      console.error(`  WP${e.wi} ↔ WP${e.wj} = ${e.dist}px`)
    );
  } else {
    console.log(`[Overlap] 0 conflicts found (${MIN_ROAD_GAP}px threshold) ✓`);
  }

  const trackValid = validateTrack(parts);
  console.log(`[Track:${trackId}] Parts: ${parts.length}, WPs: ${waypoints.length}, Zones: ${zones.length}, Valid: ${trackValid}`);

  return {
    name: layout.name,
    partTypes,
    parts,
    partBounds,
    zoneConfig,
    waypoints,
    zones,
    checkpoints,
    arrowHints,
    openFieldSegments,
    tireWalls,
    finishWP,
    startX,
    startY,
    startAngle: -90,
    initialTime: layout.initialTime,
    roadWidth: 100,
    roadPhysics: {
      paved:   { accel: 365, friction: 0.990, turn: 110, label: 'PAVED' },
      dirt:    { accel: 282, friction: 0.978, turn: 130, label: 'DIRT' },
      sand:    { accel: 212, friction: 0.965, turn: 115, label: 'DESERT' },
      rocky:   { accel: 183, friction: 0.960, turn: 140, label: 'ROCKY' },
      offroad: { accel: 125, friction: 0.945, turn: 85,  label: 'OFF-ROAD' },
    },
    obstacleConfig: {},
  };
}

// Default export for backward compatibility
export const TRACK_CONFIG = buildTrackConfig('easy');

export { getPartExit, getExitDirection, generatePartWaypoints, zoneConfig, DIR_VECTORS, DIR_RIGHT_VEC, DIR_RIGHT, DIR_LEFT, DIR_45_RIGHT, DIR_45_LEFT, R as TURN_RADIUS, TRACK_LAYOUTS };

// ---- Utility Functions ----

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
