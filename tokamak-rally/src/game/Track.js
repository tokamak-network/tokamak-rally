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
  hairpin_l:     { fwdDist: 512, xShift: -400 },
  hairpin_r:     { fwdDist: 512, xShift: 400 },
  turn_90_l:     { turnRadius: 400, turnAngle: Math.PI / 2 },
  turn_90_r:     { turnRadius: 400, turnAngle: Math.PI / 2 },
  turn_45_l:     { turnRadius: 400, turnAngle: Math.PI / 4 },
  turn_45_r:     { turnRadius: 400, turnAngle: Math.PI / 4 },
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
const R = 400; // turn radius (wide enough to prevent inner-corner overlap)

function computeTurnArc(entryDir, turnAngle, turnDirection) {
  const rv = DIR_RIGHT_VEC[entryDir];
  if (turnDirection === 'right') {
    const sa = Math.atan2(rv.dy, -rv.dx);
    const ea = sa - turnAngle;
    const cdx = R * rv.dx, cdy = R * rv.dy;
    const edx = cdx + R * Math.cos(ea);
    const edy = cdy - R * Math.sin(ea);
    let exitDir;
    if (turnAngle === Math.PI / 2) exitDir = DIR_RIGHT[entryDir];
    else exitDir = DIR_45_RIGHT[entryDir];
    return { cdx, cdy, sa, ea, exitDir, edx, edy };
  } else {
    const sa = Math.atan2(-rv.dy, rv.dx);
    const ea = sa + turnAngle;
    const cdx = -R * rv.dx, cdy = -R * rv.dy;
    const edx = cdx + R * Math.cos(ea);
    const edy = cdy - R * Math.sin(ea);
    let exitDir;
    if (turnAngle === Math.PI / 2) exitDir = DIR_LEFT[entryDir];
    else exitDir = DIR_45_LEFT[entryDir];
    return { cdx, cdy, sa, ea, exitDir, edx, edy };
  }
}

// ---- Parts Definition (single desert stage) ----
// Snake pattern: always north, detours alternate east/west. NEVER crosses itself.
const parts = [
  // ========================================
  // 구간 1: START → CP1 — 직선 + 동쪽 우회
  // ========================================
  { type: 'straight',   zone: 'desert' },  // idx0
  { type: 'straight',   zone: 'desert' },  // idx1
  { type: 'straight',   zone: 'desert' },  // idx2
  { type: 'straight',   zone: 'desert' },  // idx3  풀 스피드
  { type: 'turn_90_r',  zone: 'desert' },  // idx4  → E
  { type: 'straight_h', zone: 'desert' },  // idx5  동쪽
  { type: 'straight_h', zone: 'desert' },  // idx6  동쪽 (넓게)
  { type: 'turn_90_l',  zone: 'desert' },  // idx7  → N
  { type: 'straight',   zone: 'desert' },  // idx8
  { type: 'straight',   zone: 'desert' },  // idx9
  { type: 'straight',   zone: 'desert' },  // idx10
  { type: 'straight',   zone: 'desert' },  // idx11 CP1

  // ========================================
  // 구간 2: CP1 → CP2 — 서쪽 우회 + 헤어핀
  // ========================================
  { type: 'straight',   zone: 'desert' },  // idx12
  { type: 'straight',   zone: 'desert' },  // idx13
  { type: 'turn_90_l',  zone: 'desert' },  // idx14 → W
  { type: 'straight_h', zone: 'desert' },  // idx15 서쪽
  { type: 'turn_90_r',  zone: 'desert' },  // idx16 → N
  { type: 'straight',   zone: 'desert' },  // idx17
  { type: 'straight',   zone: 'desert' },  // idx18
  { type: 'straight',   zone: 'desert' },  // idx19 풀 스피드
  { type: 'hairpin_r',  zone: 'desert' },  // idx20 우 U턴!
  { type: 'straight',   zone: 'desert' },  // idx21
  { type: 'straight',   zone: 'desert' },  // idx22
  { type: 'straight',   zone: 'desert' },  // idx23 CP2

  // ========================================
  // 구간 3: CP2 → CP3 — 동쪽 긴 우회
  // ========================================
  { type: 'straight',   zone: 'desert' },  // idx24
  { type: 'straight',   zone: 'desert' },  // idx25
  { type: 'straight',   zone: 'desert' },  // idx26 풀 스피드
  { type: 'turn_90_r',  zone: 'desert' },  // idx27 → E
  { type: 'straight_h', zone: 'desert' },  // idx28 동쪽
  { type: 'straight_h', zone: 'desert' },  // idx29 동쪽
  { type: 'straight_h', zone: 'desert' },  // idx30 동쪽 (길게)
  { type: 'turn_90_l',  zone: 'desert' },  // idx31 → N
  { type: 'straight',   zone: 'desert' },  // idx32
  { type: 'straight',   zone: 'desert' },  // idx33
  { type: 'straight',   zone: 'desert' },  // idx34
  { type: 'straight',   zone: 'desert' },  // idx35 CP3

  // ========================================
  // 구간 4: CP3 → CP4 — 서쪽 우회 + 헤어핀
  // ========================================
  { type: 'straight',   zone: 'desert' },  // idx36
  { type: 'straight',   zone: 'desert' },  // idx37
  { type: 'turn_90_l',  zone: 'desert' },  // idx38 → W
  { type: 'straight_h', zone: 'desert' },  // idx39 서쪽
  { type: 'straight_h', zone: 'desert' },  // idx40 서쪽
  { type: 'turn_90_r',  zone: 'desert' },  // idx41 → N
  { type: 'straight',   zone: 'desert' },  // idx42
  { type: 'hairpin_l',  zone: 'desert' },  // idx43 좌 U턴!
  { type: 'straight',   zone: 'desert' },  // idx44
  { type: 'straight',   zone: 'desert' },  // idx45
  { type: 'straight',   zone: 'desert' },  // idx46
  { type: 'straight',   zone: 'desert' },  // idx47 CP4

  // ========================================
  // 구간 5: CP4 → FINISH — 동쪽 우회 후 피니시
  // ========================================
  { type: 'straight',   zone: 'desert' },  // idx48
  { type: 'turn_90_r',  zone: 'desert' },  // idx49 → E
  { type: 'straight_h', zone: 'desert' },  // idx50 동쪽
  { type: 'turn_90_l',  zone: 'desert' },  // idx51 → N
  { type: 'straight',   zone: 'desert' },  // idx52
  { type: 'straight',   zone: 'desert' },  // idx53
  { type: 'straight',   zone: 'desert' },  // idx54 FINISH
  { type: 'straight',   zone: 'desert' },  // idx55 연장
];

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

  if (type === 'turn_90_r' || type === 'turn_45_r') {
    const arc = computeTurnArc(direction, pt.turnAngle, 'right');
    return { x: x + arc.edx, y: y + arc.edy, direction: exitDir };
  }
  if (type === 'turn_90_l' || type === 'turn_45_l') {
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
    const arcR = 50; // tight 90° arc radius
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

    // Phase 4: second 90° arc (side → fwd direction, continues forward)
    const a2cx = hStartX + right.dx * side * horizLen + fwd.dx * (-arcR);
    const a2cy = hStartY + right.dy * side * horizLen + fwd.dy * (-arcR);
    for (let i = 0; i <= 4; i++) {
      const t = i / 4;
      const cos_t = Math.cos(t * Math.PI / 2);
      const sin_t = Math.sin(t * Math.PI / 2);
      pts.push([
        a2cx + (fwd.dx * arcR) * cos_t + (right.dx * side * arcR) * sin_t,
        a2cy + (fwd.dy * arcR) * cos_t + (right.dy * side * arcR) * sin_t
      ]);
    }

    // Phase 5: straight exit (fwd direction, offset by shift)
    const exitX = a2cx + right.dx * side * arcR;
    const exitY = a2cy + right.dy * side * arcR;
    for (let i = 1; i <= 2; i++) {
      const t = i / 3;
      pts.push([exitX + fwd.dx * legLen * t, exitY + fwd.dy * legLen * t]);
    }
  } else if (type === 'turn_90_r' || type === 'turn_45_r') {
    const arc = computeTurnArc(direction, pt.turnAngle, 'right');
    const cx = x + arc.cdx, cy = y + arc.cdy;
    const numPts = type === 'turn_90_r' ? 8 : 5;
    for (let i = 0; i < numPts; i++) {
      const t = i / numPts;
      const angle = arc.sa + (arc.ea - arc.sa) * t;
      pts.push([cx + R * Math.cos(angle), cy - R * Math.sin(angle)]);
    }
  } else if (type === 'turn_90_l' || type === 'turn_45_l') {
    const arc = computeTurnArc(direction, pt.turnAngle, 'left');
    const cx = x + arc.cdx, cy = y + arc.cdy;
    const numPts = type === 'turn_90_l' ? 8 : 5;
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
function generateCheckpoints(partBounds) {
  const cpDefs = [
    { partIdx: 11,  name: 'CP1', timeBonus: 15000 },
    { partIdx: 23,  name: 'CP2', timeBonus: 15000 },
    { partIdx: 35,  name: 'CP3', timeBonus: 15000 },
    { partIdx: 47,  name: 'CP4', timeBonus: 15000 },
  ];
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

// ---- Generate corner arrow hints ----
function generateArrowHints(partsList, waypointsArr, partBoundsArr) {
  const hints = [];
  for (let i = 0; i < partsList.length; i++) {
    const type = partsList[i].type;
    if (!type.startsWith('turn_') && !type.startsWith('hairpin')) continue;

    const isRight = type.includes('_r');
    const bounds = partBoundsArr[i];
    const arrowWP = Math.max(0, bounds.startWP - 4);

    let severity = 'mild';
    if (type.includes('90')) severity = 'sharp';
    if (type.includes('hairpin')) severity = 'hairpin';

    // Compute road direction at arrow position
    const nextWP = Math.min(arrowWP + 1, waypointsArr.length - 1);
    const fdx = waypointsArr[nextWP][0] - waypointsArr[arrowWP][0];
    const fdy = waypointsArr[nextWP][1] - waypointsArr[arrowWP][1];
    const roadAngle = Math.atan2(fdy, fdx);

    hints.push({
      x: waypointsArr[arrowWP][0],
      y: waypointsArr[arrowWP][1],
      direction: isRight ? 'right' : 'left',
      severity,
      roadAngle,
    });
  }
  return hints;
}

// ---- Build TRACK_CONFIG ----
const START_X = 2000;
const START_Y = 14200;

const { waypoints, partBounds } = generateWaypoints(parts, START_X, START_Y);
const zones = generateZones(partBounds);
const checkpoints = generateCheckpoints(partBounds);
const arrowHints = generateArrowHints(parts, waypoints, partBounds);

const finishWP = waypoints.length - 4;

// ---- Road overlap check ----
const MIN_ROAD_GAP = 120; // road width(100) + barrier(20)
let overlapCount = 0;
for (let i = 0; i < waypoints.length; i += 4) {
  for (let j = i + 20; j < waypoints.length; j += 4) {
    const dx = waypoints[i][0] - waypoints[j][0];
    const dy = waypoints[i][1] - waypoints[j][1];
    const d = Math.sqrt(dx*dx + dy*dy);
    if (d < MIN_ROAD_GAP) overlapCount++;
  }
}
if (overlapCount > 0) console.warn(`[Track] WARNING: ${overlapCount} road overlap points (gap < ${MIN_ROAD_GAP}px)`);
else console.log('[Track] No road overlaps detected');

const trackValid = validateTrack(parts);
console.log(`[Track] Parts: ${parts.length}, Waypoints: ${waypoints.length}, Zones: ${zones.length}, Valid: ${trackValid}`);
console.log(`[Track] Zone breakdown:`, zones.map(z => `${z.name}(WP ${z.fromWP}-${z.toWP})`).join(', '));
console.log(`[Track] Checkpoints:`, checkpoints.map(cp => `${cp.name}@WP${cp.waypointIndex}`).join(', '));
console.log(`[Track] Finish WP: ${finishWP}, Total track length: ${Math.round(Math.sqrt((waypoints[waypoints.length-1][0]-waypoints[0][0])**2+(waypoints[waypoints.length-1][1]-waypoints[0][1])**2))}px`);

export const TRACK_CONFIG = {
  name: 'Desert Rally',

  partTypes,
  parts,
  partBounds,
  zoneConfig,

  waypoints,
  zones,
  checkpoints,
  arrowHints,
  finishWP,

  startX: START_X,
  startY: START_Y,
  startAngle: -90,
  initialTime: 120000,
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

export { getPartExit, getExitDirection, generatePartWaypoints, zoneConfig, DIR_VECTORS, DIR_RIGHT_VEC, DIR_RIGHT, DIR_LEFT, DIR_45_RIGHT, DIR_45_LEFT, R as TURN_RADIUS };

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
