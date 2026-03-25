# Exact Parts & Zone Data (from Jaden)

## parts[] array

```javascript
parts: [
    // === ZONE 1: DESERT ===
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
    // === TRANSITION: DESERT→CANYON ===
    { type: 'straight', zone: 'trans_desert_canyon' },
    // === ZONE 2: CANYON ===
    { type: 'straight', zone: 'canyon' },
    { type: 'curve_r', zone: 'canyon' },
    { type: 'straight', zone: 'canyon' },
    { type: 'hairpin_l', zone: 'canyon' },
    { type: 'straight', zone: 'canyon' },
    { type: 's_curve', zone: 'canyon' },
    { type: 'straight', zone: 'canyon' },
    // === TRANSITION: CANYON→RIVERBED ===
    { type: 'straight', zone: 'trans_canyon_riverbed' },
    // === ZONE 3: RIVERBED ===
    { type: 'straight', zone: 'riverbed' },
    { type: 'curve_l', zone: 'riverbed' },
    { type: 'curve_r', zone: 'riverbed' },
    { type: 'straight', zone: 'riverbed' },
    { type: 'hairpin_r', zone: 'riverbed' },
    { type: 'straight', zone: 'riverbed' },
    { type: 'curve_l', zone: 'riverbed' },
    { type: 'straight', zone: 'riverbed' },
    // === TRANSITION: RIVERBED→MOUNTAIN ===
    { type: 'straight', zone: 'trans_riverbed_mountain' },
    // === ZONE 4: MOUNTAIN ===
    { type: 'straight', zone: 'mountain' },
    { type: 'curve_l', zone: 'mountain' },
    { type: 'straight', zone: 'mountain' },
    { type: 'curve_r', zone: 'mountain' },
    { type: 'straight', zone: 'mountain' },
    { type: 'hairpin_l', zone: 'mountain' },
    { type: 'straight', zone: 'mountain' },
    // === TRANSITION: MOUNTAIN→SPRINT ===
    { type: 'straight', zone: 'trans_mountain_sprint' },
    // === ZONE 5: SPRINT ===
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
    { type: 'straight', zone: 'sprint' }, // FINISH
    { type: 'straight', zone: 'sprint' }, // post-finish extension
],
```

## zoneConfig

```javascript
zoneConfig: {
    desert:                 { bgColor: 0xD2B48C, roadColor: 0x9B7B4A, roadType: 'sand', barrierColor: 0x8a6a30, label: 'Desert' },
    trans_desert_canyon:    { bgColor: 0xC4A06C, roadColor: 0x8B6B3A, roadType: 'dirt', barrierColor: 0x7a5a20, label: 'Transition' },
    canyon:                 { bgColor: 0x8B6914, roadColor: 0x7B5B2A, roadType: 'dirt', barrierColor: 0x6a4a30, label: 'Canyon' },
    trans_canyon_riverbed:  { bgColor: 0x6B8B3A, roadColor: 0x6B6B3A, roadType: 'dirt', barrierColor: 0x5a6a20, label: 'Transition' },
    riverbed:               { bgColor: 0x4A7A4A, roadColor: 0x7B6B3A, roadType: 'dirt', barrierColor: 0x6a5a30, label: 'Riverbed' },
    trans_riverbed_mountain:{ bgColor: 0x6A8A6A, roadColor: 0x8B8B7A, roadType: 'rocky', barrierColor: 0x7a7a70, label: 'Transition' },
    mountain:               { bgColor: 0xE8E8F0, roadColor: 0xB0B0A8, roadType: 'rocky', barrierColor: 0x8a8a80, label: 'Mountain' },
    trans_mountain_sprint:  { bgColor: 0xA0A0A8, roadColor: 0x606060, roadType: 'paved', barrierColor: 0x888888, label: 'Transition' },
    sprint:                 { bgColor: 0x3A3A42, roadColor: 0x2A2A2A, roadType: 'paved', barrierColor: 0x888888, label: 'Sprint' },
},
```

## RaceScene.js changes
- Remove: drawBackground(), drawTrack(), placeScenery(), old placeBarriers()
- Add: renderTrackParts() with sub-methods: renderPartBackground(), renderPartRoad(), renderPartCurbs(), renderPartBarrier(), collectBarrierSegments()
- Barrier collision in updateCar() already uses this._barrierSegments

## BootScene.js changes
- Remove: v5_bg_* preloads, v5_road_* preloads
- Keep: v2_car_*, particles, tokamak logos, cow/bird

## Checkpoints
- Auto-detect zone transition points as checkpoint positions
- finishWP = second-to-last sprint straight's start waypoint
