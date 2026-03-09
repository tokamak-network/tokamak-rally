# TOKAMAK Rally — Graphics Upgrade Task

## Context
This is a Phaser.js top-down rally racing game. ALL graphics are generated programmatically in `src/game/BootScene.js` using Phaser Graphics API (fillRect, fillCircle, etc.) — NO external image files.

Key files:
- `src/game/BootScene.js` — generates all textures (backgrounds, cars, obstacles, scenery)
- `src/game/Cars.js` — car definitions + pixel art arrays (14×20 grid, 2x scale = 28×40 rendered)
- `src/game/RaceScene.js` — main game loop, obstacle placement, scenery placement, particles
- `src/game/Track.js` — 113 waypoints defining the course, zones, checkpoints, road physics
- `src/game/UIScene.js` — HUD overlay
- `src/game/MenuScene.js` — car selection menu

## IMPORTANT CONSTRAINTS
1. Everything is programmatic pixel art — no external image files allowed
2. Car rotation is handled by Phaser's built-in sprite rotation (NOT pre-rendered directions)
3. The game must continue to work at 800×600 resolution with 1.5x camera zoom
4. The seeded RNG for obstacle placement in RaceScene.js must be preserved (mulberry32, seed 20260309)
5. Keep all existing game mechanics (drift, checkpoint, time-attack) intact
6. Keep the 5 cars with their existing physics/stats — only upgrade visuals

## Tasks (in priority order)

### P0-1: Zone Background Textures (BootScene.genBackgrounds)
Upgrade the 64×64 tile textures for each zone. Current ones are too simple.

Target style: "Art of Rally" — rich color palettes with subtle texture detail.

**Sand Zone**: Golden sand with ripple patterns, wind marks, gravel dots. Palette: #E8C44A, #D4A832, #C49225, #A67B20, #8B6914
**Canyon Zone**: Red layered rock strata with cracks, shadows. Palette: #C25A2E, #A84520, #8B3618, #6D2A12, #4A1D0E
**Riverbed Zone**: Cracked earth with gravel, moisture hints, green moss. Palette: #7A8B6E, #5C7A8B, #3A8EC4 (water), #A09080 (gravel)
**Mountain Zone**: Blue-grey rock with snow patches, ice. Palette: #E8E8F0 (snow), #6B8A6E (trees), #8090A0, #4A5A6A, #2A3A4A
**Sprint Zone**: Asphalt road with grass edges. Palette: #555555 (asphalt), #333333, #4CAF50 (grass), #FFFFFF (lines), #FF6B00

### P0-2: Car Sprite Upgrade (Cars.js)
Increase car sprites from 14×20 to **20×28** pixels (2x scale = 40×56 rendered).
- More body detail: visible headlights, taillights, hood lines, side mirrors hint
- Team livery patterns with more color variation
- Update BootScene.genAllCars() scale and dimensions
- Update MenuScene car preview if needed
- Update RaceScene player sprite creation

### P1-1: Zone-Specific Obstacles
REVERT from single `obs_tokamak` to zone-specific obstacles:
- **Sand**: sand_pile, cactus_small, tumbleweed
- **Canyon**: fallen_rock, rock_debris, boulder_red  
- **Riverbed**: puddle, mud_patch, log
- **Mountain**: rock_slide, snow_drift, ice_patch
- **Sprint**: cone, tire_barrier

Update in BootScene.genObstacles(), Track.js obstacleConfig, and RaceScene.placeRoadObstacles().
Each obstacle type needs appropriate penalty values (puddle/ice = less speed loss but sliding, rocks = more penalty).
KEEP the seeded RNG placement system.

### P1-2: Course Layout Redesign (Track.js)
Redesign the 113 waypoints to create more varied driving experience:
- **Sand**: 70% straight, 30% gentle curves — open desert feel
- **Canyon**: 40% straight, 60% tight turns — narrow and technical  
- **Riverbed**: 50/50 mix — irregular winding path
- **Mountain**: 30% straight, 70% hairpins and switchbacks — most technical
- **Sprint**: 60% straight, 40% medium curves — fast finish

Keep 5 zones, 4 checkpoints, same zone order. Aim for ~120 waypoints total.
Keep track widths per zone and road physics the same.

### P2-1: Particle Effects
Add zone-specific particles in RaceScene:
- **Dust trail**: Sand/Canyon — particles behind car, color matches terrain
- **Water splash**: Riverbed — blue particles when hitting puddles
- **Snow particles**: Mountain — falling snow ambient effect
- **Tire smoke**: Sprint — white/grey on drift
- **Universal drift smoke**: All zones — enhanced dust/smoke during SPACE drift

Generate particle textures in BootScene. Use Phaser particle emitters.

### P2-2: Zone Transition Blending
When crossing zone boundaries, briefly blend background colors for smooth transition.
Could be done via camera fade or overlay tinting.

## DO NOT CHANGE
- Game resolution (800×600)
- Camera zoom (1.5x)
- Drift mechanics in RaceScene
- Wallet/leaderboard integration
- UIScene HUD layout
- MenuScene layout (except car preview size if car sprites change)
- Display speed factor (0.38)

## Testing
After changes, run `npx vite build` to verify no errors.
