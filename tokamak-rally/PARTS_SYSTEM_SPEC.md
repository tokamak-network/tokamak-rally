# 트랙 파츠 시스템 — Phase 1: 프로그래매틱 프로토타입

## 개요
현재 도로 렌더링 방식(배경 타일 깔기 → 그 위에 도로 그리기 → 오브젝트 산포)을 **파츠 기반 시스템**으로 전면 교체한다.
장난감 기차 레일처럼, 미리 정의된 파츠(직선, 커브, 90도 회전 등)를 이어붙여 트랙을 구성한다.

Phase 1 목표: 프로그래매틱 렌더링(단색+패턴)으로 파츠 시스템의 구조를 검증한다.
이후 Phase 2에서 DALL-E 이미지로 그래픽을 교체할 예정이므로, 렌더링 코드는 이미지 교체가 쉽도록 설계한다.

## 핵심 수치
- 게임 해상도: 800×600
- 카메라 줌: 2.3x
- 가시 영역: ~348×261 게임 픽셀
- 도로 폭: 100px (전 존 통일, Phase 1에서는 단순화)
- 파츠 폭: 256px (도로 100px + 좌우 배경 각 78px)
- 파츠 높이: 직선/커브 = 512px, 90도 회전/헤어핀 = 512×512px
- 도로가 가시 영역의 약 29%를 차지하고, 좌우 배경이 나머지를 채운다.
- 줌 2.3x에서 한 화면에 파츠 약 1~2개가 보인다.

## 파츠 카탈로그

### 수직 파츠 (입구 ↑, 출구 ↑) — 256×512px
| ID | 이름 | 도로 형태 | 설명 |
|----|------|-----------|------|
| straight | 직선 | 중앙 수직선 | 기본 파츠. 가장 많이 사용 |
| curve_l | 완만 좌커브 | 하단 중앙→상단 좌측으로 완만 곡선 | x 오프셋 약 -40px |
| curve_r | 완만 우커브 | 하단 중앙→상단 우측으로 완만 곡선 | x 오프셋 약 +40px |
| s_curve | S커브 | S자 곡선 | 좌→우→중앙 또는 우→좌→중앙 |
| hairpin_l | U자 좌 헤어핀 | 좌측으로 U턴 | 입구↑, 출구↑, x 오프셋 -80px |
| hairpin_r | U자 우 헤어핀 | 우측으로 U턴 | 입구↑, 출구↑, x 오프셋 +80px |

### 회전 파츠 — 512×512px
| ID | 이름 | 도로 형태 | 입구→출구 |
|----|------|-----------|-----------| 
| turn_90_l | 90도 좌회전 | 1/4 원호 | ↑ → ← (9시) |
| turn_90_r | 90도 우회전 | 1/4 원호 | ↑ → → (3시) |

### 수평 파츠 (90도 회전 사이 연결용) — 512×256px
| ID | 이름 | 도로 형태 | 입구→출구 |
|----|------|-----------|-----------| 
| straight_h | 수평 직선 | 중앙 수평선 | → → → 또는 ← ← ← |

## 연결 규칙

### 기본 원칙
- 모든 커브/변주 후 12시 방향 직선 복귀 (핸드오프 문서 핵심 원칙)
- 파츠의 출구 방향과 다음 파츠의 입구 방향이 일치해야 한다
- 90도 회전 파츠는 반드시 보완 쌍으로 사용해야 12시 복귀 가능

### 자유 연결 파츠 (출구 ↑)
straight, curve_l, curve_r, s_curve, hairpin_l, hairpin_r
→ 이 파츠들은 출구가 모두 12시이므로 서로 자유롭게 이어붙일 수 있다.

### 쌍 필수 파츠 (출구 ←/→)
turn_90_l, turn_90_r는 단독으로 12시 복귀 불가. 반드시 아래 패턴으로 사용:
```
... → turn_90_r → straight_h → turn_90_l → straight → ...  (오른쪽 이동 후 12시 복귀)
... → turn_90_l → straight_h → turn_90_r → straight → ...  (왼쪽 이동 후 12시 복귀)
```

### 연결 검증 함수
트랙 정의 시 연결 규칙 위반을 자동 감지하는 함수를 구현하라:
```javascript
function validateTrack(parts) {
  let direction = 'north';
  for (const part of parts) {
    const exitDir = getExitDirection(part.type, direction);
    if (exitDir === null) {
      console.error(`Invalid connection: ${part.type} cannot accept ${direction} entry`);
      return false;
    }
    direction = exitDir;
  }
  if (direction !== 'north') {
    console.warn(`Track ends facing ${direction}, not north`);
  }
  return true;
}
```

## 파츠 데이터 구조

### Track.js 변경
기존 waypoints[] 배열을 parts[] 배열로 교체한다. 
기존 유틸리티 함수(isOnTrack, getTrackProgress, checkCheckpoint, checkFinish)와의 호환을 위해 parts에서 waypoints를 자동 생성한다.

```javascript
export const TRACK_CONFIG = {
  name: 'Stage 1: Sahara Crossing',
  
  partTypes: {
    straight:   { width: 256, height: 512, entry: 'north', exit: 'north', xShift: 0 },
    curve_l:    { width: 256, height: 512, entry: 'north', exit: 'north', xShift: -40 },
    curve_r:    { width: 256, height: 512, entry: 'north', exit: 'north', xShift: 40 },
    s_curve:    { width: 256, height: 512, entry: 'north', exit: 'north', xShift: 0 },
    hairpin_l:  { width: 256, height: 512, entry: 'north', exit: 'north', xShift: -80 },
    hairpin_r:  { width: 256, height: 512, entry: 'north', exit: 'north', xShift: 80 },
    turn_90_l:  { width: 512, height: 512, entry: 'north', exit: 'west', xShift: 0 },
    turn_90_r:  { width: 512, height: 512, entry: 'north', exit: 'east', xShift: 0 },
    straight_h: { width: 512, height: 256, entry: 'east', exit: 'east', xShift: 0 },
  },
  
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
    // CP1
    
    // === ZONE 2: CANYON ===
    { type: 'straight', zone: 'canyon' },
    { type: 'curve_r', zone: 'canyon' },
    { type: 'curve_l', zone: 'canyon' },
    { type: 'straight', zone: 'canyon' },
    { type: 'turn_90_r', zone: 'canyon' },
    { type: 'straight_h', zone: 'canyon' },
    { type: 'turn_90_l', zone: 'canyon' },
    { type: 'straight', zone: 'canyon' },
    // CP2
    
    // === ZONE 3: RIVERBED ===
    { type: 'straight', zone: 'riverbed' },
    { type: 's_curve', zone: 'riverbed' },
    { type: 'straight', zone: 'riverbed' },
    { type: 'curve_l', zone: 'riverbed' },
    { type: 'curve_r', zone: 'riverbed' },
    { type: 'straight', zone: 'riverbed' },
    { type: 'hairpin_l', zone: 'riverbed' },
    { type: 'straight', zone: 'riverbed' },
    // CP3
    
    // === ZONE 4: MOUNTAIN ===
    { type: 'straight', zone: 'mountain' },
    { type: 'curve_l', zone: 'mountain' },
    { type: 'straight', zone: 'mountain' },
    { type: 'hairpin_r', zone: 'mountain' },
    { type: 'curve_r', zone: 'mountain' },
    { type: 'straight', zone: 'mountain' },
    // CP4
    
    // === ZONE 5: SPRINT ===
    { type: 'straight', zone: 'sprint' },
    { type: 'straight', zone: 'sprint' },
    { type: 'turn_90_r', zone: 'sprint' },
    { type: 'straight_h', zone: 'sprint' },
    { type: 'turn_90_l', zone: 'sprint' },
    { type: 'straight', zone: 'sprint' },
    { type: 'turn_90_l', zone: 'sprint' },
    { type: 'straight_h', zone: 'sprint' },
    { type: 'turn_90_r', zone: 'sprint' },
    { type: 'straight', zone: 'sprint' },
    { type: 'straight', zone: 'sprint' }, // FINISH
  ],
  
  zones: { /* zone별 색상/텍스처/물리 정보 */ },
  
  roadWidth: 100,
  startX: 2000,
  startY: 14200,
};
```

### 웨이포인트 자동 생성
```javascript
function generateWaypoints(config) {
  const waypoints = [];
  let x = config.startX;
  let y = config.startY;
  let direction = 'north'; // current heading
  
  for (const part of config.parts) {
    const type = config.partTypes[part.type];
    const pts = generatePartWaypoints(part.type, x, y, direction);
    waypoints.push(...pts);
    // Update position for next part
    const exit = getPartExit(part.type, x, y, direction);
    x = exit.x;
    y = exit.y;
    direction = exit.direction;
  }
  
  return waypoints;
}
```

## 렌더링 (RaceScene.js)

### drawTrackParts() — drawBackground() + drawTrack() 통합

기존 drawBackground()와 drawTrack()을 하나로 합친다.
각 파츠를 순회하며:
1. 파츠의 월드 좌표 계산
2. 좌 배경 + 도로 + 우 배경을 한번에 렌더링
3. 배리어/커브 마킹 적용

```javascript
drawTrackParts() {
  const config = this.track;
  let x = config.startX;
  let y = config.startY;
  let direction = 'north';
  
  for (const part of config.parts) {
    this.renderPart(part, x, y, direction);
    const exit = getPartExit(part.type, x, y, direction);
    x = exit.x; y = exit.y; direction = exit.direction;
  }
}
```

### Phase 1 프로그래매틱 렌더링
각 파츠를 Graphics 오브젝트로 그린다:

```javascript
renderPart(part, x, y, direction) {
  const zone = this.track.zones[part.zone];
  const g = this.add.graphics().setDepth(1);
  
  // 1. 좌우 배경 (존 색상으로 채우기)
  g.fillStyle(zone.bgColor, 1);
  g.fillRect(worldX - 128, worldY - 256, 78, 512);  // 좌 배경
  g.fillRect(worldX + 50, worldY - 256, 78, 512);   // 우 배경
  
  // 2. 도로 (존 도로 색상)
  g.fillStyle(zone.roadColor, 1);
  g.fillRect(worldX - 50, worldY - 256, 100, 512);   // 도로
  
  // 3. 도로 경계선
  g.lineStyle(2, zone.edgeColor, 0.8);
  g.strokeRect(worldX - 50, worldY - 256, 100, 512);
  
  // 4. 중앙선 (점선)
  // ... 파츠 타입별 곡선 처리 ...
  
  // Phase 2에서 이 부분을 this.add.image(x, y, partTextureKey)로 교체
}
```

### Phase 2 이미지 교체 준비
Phase 2에서는 renderPart()의 내부만 교체하면 된다:
```javascript
renderPart(part, x, y, direction) {
  const textureKey = `part_${part.type}_${part.zone}`;
  if (this.textures.exists(textureKey)) {
    // Phase 2: DALL-E 이미지 사용
    this.add.image(worldX, worldY, textureKey).setDepth(1);
  } else {
    // Phase 1: 프로그래매틱 폴백
    this.renderPartProgrammatic(part, x, y, direction);
  }
}
```

## 존 설정

```javascript
zones: {
  desert: {
    bgColor: 0xD4A574,      // 모래색
    roadColor: 0xB89060,     // 흙길
    edgeColor: 0x8B6914,     // 경계
    sideDetails: 'sand',     // Phase 1: 모래 패턴
    roadType: 'sand',
  },
  canyon: {
    bgColor: 0x8B4513,      // 붉은 암벽
    roadColor: 0x7A6550,     // 돌길
    edgeColor: 0x5A4530,
    sideDetails: 'rock_wall',
    roadType: 'dirt',
  },
  riverbed: {
    bgColor: 0x5A7A4A,      // 초록 풀밭
    roadColor: 0x6A5A40,     // 진흙길
    edgeColor: 0x4A3A28,
    sideDetails: 'grass',
    roadType: 'dirt',
  },
  mountain: {
    bgColor: 0x6A7A8A,      // 회색 바위
    roadColor: 0x7A6050,     // 바위길
    edgeColor: 0x4A4A50,
    sideDetails: 'snow_rock',
    roadType: 'rocky',
  },
  sprint: {
    bgColor: 0x3A3A42,      // 어두운 도시
    roadColor: 0x484850,     // 아스팔트
    edgeColor: 0x606068,
    sideDetails: 'urban',
    roadType: 'paved',
  },
}
```

## 변경 금지
- 드리프트 메카닉 로직
- 시드 RNG 장애물 배치 시스템 (mulberry32, seed 20260309)
- 월렛/리더보드 연동
- 차량 물리 스탯 수치
- 표시 속도 계수 0.38
- 카메라 줌 2.3x
- BootScene의 genScenery(), genObstacles() 코드 (에셋 생성)
- UIScene 전체

## 구현 순서
1. Track.js에 partTypes + parts[] + generateWaypoints() 구현
2. validateTrack() 구현
3. RaceScene.js에 drawTrackParts() 구현 (프로그래매틱)
4. 기존 drawBackground(), drawTrack() 호출을 drawTrackParts()로 교체
5. placeBarriers()를 파츠 기반으로 업데이트
6. 체크포인트/피니시를 파츠 기반으로 업데이트
7. isOnTrack 등 유틸리티가 자동 생성된 waypoints와 호환되는지 확인
8. 전 존 플레이 테스트

## 커밋
각 단계별 git commit + push
커밋 메시지: `feat: parts-system [단계] 설명`
