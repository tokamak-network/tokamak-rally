# TOKAMAK Rally — Tokenomics Design v2

> Updated 2026-03-10. Burn 제거, Tokamon 패턴 차용.

## 기본 원칙
- **토큰**: TOKAMAK (TON) — Tokamak Network 네이티브 토큰
- **네트워크**: Sepolia (테스트넷) → Titan L2 (프로덕션)
- **소각(burn) 없음** — TON 소각은 네트워크 거버넌스 레벨의 결정이므로 게임 단독으로 시행하지 않음
- **무료 플레이 기본** — 지갑 없이 플레이 가능, 지갑은 리더보드/토너먼트 참가 시에만 필요

## 토큰 플로우

### Free Play (현재)
```
플레이어 → 레이스 → 기록 제출 (가스비만) → 리더보드
```
- 참가비 없음, 상금 없음
- 순수 타임어택 경쟁
- Sepolia 테스트넷 ETH로 가스비 충당

### Tournament Mode (향후)
```
참가자 N명 × Entry Fee → Prize Pool
  ├── 90% → 우승자 배분 (1위 50%, 2위 30%, 3위 10%)
  └── 10% → 운영자 (서버/인프라 유지)
```

| 항목 | 비율 | 설명 |
|------|------|------|
| 우승자 배분 | 90% | 1위 50%, 2위 30%, 3위 10% |
| 운영자 | 10% | 인프라 + 운영 비용 |

## Tokamon에서 차용한 패턴

### 1. UUPS Upgradeable 컨트랙트
- 테스트넷 → 메인넷 전환 시 로직 업그레이드 가능
- OpenZeppelin `UUPSUpgradeable` + `Initializable` 사용
- admin만 업그레이드 권한 보유

### 2. 역할 분리 (Role Separation)
| 역할 | 권한 | 설명 |
|------|------|------|
| `admin` | 컨트랙트 업그레이드, 역할 변경 | 오너 (multisig 권장) |
| `resultSubmitter` | 레이스 결과 제출 | 서버 백엔드 |
| `payoutManager` | 상금 배분 실행 | 별도 키 or timelock |

→ Tokamon의 `admin` / `claimManager` 분리 패턴과 동일

### 3. 쿨다운 메커니즘
- 같은 토너먼트 연속 참가 제한 (기본 1시간)
- 어뷰징 방지: 동일 지갑 멀티 엔트리 차단
- Tokamon의 `cooldown` + `claimLastTime` 패턴 차용

### 4. 스탬프 보너스 (Retention)
- N회 레이스 완주 시 추가 TON 보너스
- 예: 10레이스 완주 → 보너스 0.5 TON
- Tokamon의 `stampGoal` + `stampBonus` 개념 차용
- 재방문/재플레이 유도 장치

## 컨트랙트 아키텍처 (계획)

```
RallyLeaderboard (현재, Sepolia)
  └── submitRecord() / getRecord() / setNickname()

RallyTournament (향후, Titan L2)
  ├── createTournament(entryFee, maxPlayers, duration)
  ├── enterTournament(tournamentId) payable
  ├── submitResult(tournamentId, time, carId, replayHash) — onlyResultSubmitter
  ├── finalizeTournament(tournamentId) — onlyPayoutManager
  │     ├── 90% → winners
  │     └── 10% → operator
  ├── stampCount(address) / stampBonus()
  └── cooldownRemaining(address, tournamentId)
```

## 마이그레이션 경로

| 단계 | 네트워크 | 기능 | 토큰 |
|------|----------|------|------|
| Phase 1 (현재) | Sepolia | 리더보드만 | 없음 (가스비만) |
| Phase 2 | Sepolia | 토너먼트 테스트 | 테스트 TON |
| Phase 3 | Titan L2 | 프로덕션 토너먼트 | TOKAMAK (TON) |

## 참고
- Tokamon 레포: https://github.com/tokamak-network/tokamon
- Tokamon 컨트랙트: `Tokamon.sol` — UUPS, 역할 분리, 쿨다운, 스탬프 보너스 패턴 참고
- TON 소각 히스토리: 네트워크 레벨에서도 드문 사례 → 게임 단독 소각 부적절
