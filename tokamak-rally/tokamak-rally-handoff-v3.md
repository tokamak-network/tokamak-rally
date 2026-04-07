# TOKAMAK Rally — 핸드오프 문서 v3.0

**최종 업데이트: 2026-04-06**

## 프로젝트 개요

- Thrash Rally(네오지오, 1991) 모티브 탑다운 랠리 레이싱 게임
- 기술 스택: Phaser.js 3.90 + Vite 7, 800×600, 카메라 줌 2.3x
- GitHub: https://github.com/tokamak-network/tokamak-rally
- 게임 코드: `tokamak-rally/tokamak-rally/` 하위

---

## 확정 사항 (변경 금지)

### 파츠 11종 (이것만 사용)

**직선 3종:**
- `straight` — 수직 직선
- `straight_h` — 수평 직선
- `diag_straight` — 대각선 직선 (진입 방향에 따라 NE/NW/SE/SW)

**코너 6종:**
- `turn_45_r` / `turn_45_l` — 45도 회전 (대각선↔수직/수평 전환용)
- `turn_90_r` / `turn_90_l` — 90도 회전 (핵심 드리프트 포인트)
- `turn_135_r` / `turn_135_l` — 135도 회전 (급커브, 드리프트 극대화)

**헤어핀 2종:**
- `hairpin_r` / `hairpin_l` — U턴

### 물리/게임 파라미터 (변경 금지)

- turnRadius (R): 200 (날카로운 코너)
- 드리프트 메카닉 로직 (moveAngle/bodyAngle)
- 차량 물리 스탯 (Cars.js의 stats, physics)
- roadMaxSpeed/accel: 1.5배 적용 완료 (Tokamak GT sand 180km/h)
- 표시 속도 계수: 0.38
- 카메라 줌: 2.3x
- friction, turn 값
- 월렛/리더보드 연동

### 코스 정책

- 코너 ~70% : 직선 ~30% 비율
- 대각선 직선이 기본 (Thrash Rally 패턴)
- 단일 Desert 스테이지 (roadType: sand, 표시: DESERT)
- 체크포인트 4개, 이름: CP1~CP4
- 장애물(obstacles) 시스템 제거됨
- 메뉴 하단: "DESERT RALLY · 4 Checkpoints"

---

## 코너 번호 체계 (C1~C7)

Thrash Rally 스테이지1 영상 129프레임 분석 기반:

| # | 유형 | 파츠 | 설명 |
|---|------|------|------|
| C1 | 90도 우 | turn_90_r | 대각선 직선 후 날카로운 우회전 |
| C2 | 90도 우 | turn_90_r | 오픈필드에서 우회전 (화살표 동반) |
| C3 | 135도 좌 | turn_135_l | 급커브 좌회전, 드리프트 필수 |
| C4 | 45도 좌 | turn_45_l | 대각선→수직 전환 |
| C5 | 90도 우 | turn_90_r | 대각선에서 꺾이는 코너 |
| C6 | 90도 우 | turn_90_r | 수직→수평, 매우 날카로움 |
| C7 | 45도 좌 | turn_45_l | 대각선→수직 복귀 |

---

## 현재 구현 상태

### 완료

- [x] 8방향 시스템 (N/NE/E/SE/S/SW/W/NW)
- [x] 파츠 11종 partTypes 정의
- [x] generatePartWaypoints() — 11종 지원
- [x] getExitDirection() / getPartExit() — 11종 지원
- [x] R=200 적용
- [x] 전 차량 속도 1.5배
- [x] 장애물 시스템 제거
- [x] 단일 Desert 존 통합
- [x] renderTrackParts() — 전체 존 파츠 렌더링
- [x] 커브 배경 빈틈 수정 (base fill)
- [x] HUD 네비게이션 화살표 (꺾인 화살표, setScrollFactor(0))
- [x] C1~C7 기반 레이아웃 구현
- [x] thrash-rally-reference.md 레포 저장

### 미해결 (즉시)

- [ ] 트랙 겹침 1곳 남음 — 수평 이동 거리 부족으로 도로 교차
- [ ] 화살표 두께/타이밍 미세 조정 (본체 10px, 0.3초 전)
- [ ] 메뉴 텍스트 "DESERT RALLY" 반영 여부 확인
- [ ] s_curve/curve_l/curve_r 잔존 코드 정리 확인

---

## 겹침 문제 근본 원인

- 트랙 좌우 폭이 좁으면(~5000px) 동/서 왕복 시 같은 x좌표에서 도로 겹침
- turn_90 후 straight_h가 부족하면 수평 이동 거리 부족
- 연속 같은 방향 turn_90 (예: turn_90_l→turn_90_l)은 U턴 생성 → 겹침 유발
- **해결: straight_h 최소 4개(2048px) 확보, 겹침 검증 200px 기준**

---

## HUD 화살표 설계

- **형태:** 꺾인 화살표 (↱ ↰) — 꼬리=진입방향, 머리=탈출방향
- **위치:** 차량 바로 위 30~40px (setScrollFactor(0), 화면 중앙 기준)
- **타이밍:** 코너 0.3초 전 표시, 코너 지나면 즉시 사라짐
- **크기:** 본체 10px, 테두리 14px, 삼각형 머리 20px, 전체 45px
- **색상:** 빨간 본체 + 흰 테두리, 반투명 배경 원 (검정 alpha 0.3)
- **데이터:** arrowHints에 entryAngle + exitAngle 포함

---

## 레퍼런스 분석 요약

**상세: thrash-rally-reference.md 참조**

### Thrash Rally 핵심 원칙

1. 대각선 직선이 기본 (30~45도)
2. 도로폭 동적 변경 (넓은 코너=드리프트 유도)
3. 코너 예고 화살표 (빨간, 곡선형, 차량 2~3배 크기)
4. 배리어 유무 구간마다 다름
5. 배경 밀도 극히 높음
6. 한 스테이지 내 도로 유형 전환
7. 짧은 헤어핀 = 드리프트 극대화
8. 점프대, 나무다리 존재
9. 스타트/피니시 연출 (관중, 배너)
10. AI 차량 경쟁 (6대)

---

## 적용 우선순위

### 즉시 (현재)

- 트랙 겹침 해결
- 화살표 두께/타이밍 조정
- 메뉴/체크포인트 정리

### 단기

- 도로폭 동적 변경
- 짧은 헤어핀 (드리프트 극대화)
- 배리어 유무 토글 (오픈 필드 구간)
- 도로 유형 전환
- 타이어벽/코너 보호물

### 중기 (그래픽 확정 후 = Phase 2)

- DALL-E 이미지로 파츠 그래픽 교체
- 점프대, 나무다리
- 배경 밀도 증가
- AI 차량 경쟁
- 스타트/피니시 연출

### 장기

- 멀티 스테이지 (사막/정글/설산/해안/도시)
- Y자 분기
- 드리프트 부스트/스코어링/콤보
- 드리프트 이펙트 강화

---

## 드리프트 강화 아이디어 (추후 구현)

1. **드리프트 부스트** — 드리프트 유지 시간에 비례하여 종료 후 속도 부스트
2. **드리프트 스코어링** — 각도×시간으로 스코어 계산
3. **드리프트 이펙트** — 타이어 스모크 파티클, 화면 살짝 기울기
4. **드리프트 존** — 특정 코너에 보너스 구간 표시
5. **연속 드리프트 콤보** — 코너 연속 드리프트 시 배율 증가

---

## 레포 내 주요 파일

- `src/game/Track.js` — 파츠 시스템, 웨이포인트, 레이아웃, 겹침 검증
- `src/game/RaceScene.js` — 렌더링, 충돌, HUD 화살표, 게임 루프
- `src/game/Cars.js` — 차량 정의 (roadMaxSpeed 1.5배 적용됨)
- `src/game/UIScene.js` — HUD (속도계, 타이머, 체크포인트)
- `src/game/MenuScene.js` — 차량 선택, 스테이지 설명
- `thrash-rally-reference.md` — 레퍼런스 분석 문서
- `PARTS_SYSTEM_SPEC.md` — 파츠 시스템 설계 (일부 구버전 내용 포함)
- `reference-frames/` — Thrash Rally 프레임 19장
