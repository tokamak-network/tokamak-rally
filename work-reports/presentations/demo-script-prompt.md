# Demo Script Prompt for Claude Sonnet 4.6

아래 프롬프트를 Claude에 붙여넣으세요:

---

너는 발표 스크립트 작성 전문가야. 아래 정보를 바탕으로 **10분 내부 데모 발표 스크립트**를 한국어로 작성해줘.

## 발표자
- Jaden (공준웅), Tokamak Network Directing Manager
- 청중: 팀 내부 (Kevin 대표 포함, 개발자 + 비개발자 혼합)
- 톤: 전문적이지만 편안한, 실무 중심

## 발표 구조
두 제품을 각 5분씩, 총 10분. 각 제품마다:
1. 한 줄 소개 (이 도구가 뭔지)
2. 지난주 주요 업데이트 (기능 중심, 기술 디테일 최소화)
3. 라이브 데모 시나리오 (화면에서 뭘 보여줄지)
4. 다음 단계

---

## 제품 1: Biweekly Report Generator
**한 줄**: GitHub 데이터 기반으로 격주 보고서를 자동 생성하는 도구

### 지난주 주요 업데이트
- **Kevin 피드백 전면 반영**: Contributors 제거, "Repository" → "Project", "Lines Changed" → "Code Changes" 용어 통일
- **모든 정렬 기준을 코드 체인지 내림차순으로 변경** (알파벳순 폐기)
- **숫자 풀 표기** (4.9M → 4,900,000)
- **Commits 관련 지표 전면 제거** (AI 시대에 커밋 수는 의미 없음)
- **Stats Bar 재설계**: Code Changes → Net Growth → Active Projects (3개)
- **Landscape 카드 리디자인**: 2열 그리드, 각 프로젝트별 코드 체인지 수치 표시
- **Productivity Metrics 삭제** (1인당 생산성 외부 노출 불필요)
- **AI 생성 시 병렬 15 워커로 성능 개선**
- **Biweekly #2 발간 완료** (2026-02-01~02-15, 67 projects, 4,898,658 code changes)

### 데모 시나리오
1. localhost:3000 접속 → 리포트 생성 화면 보여주기
2. 기존 Biweekly #2 HTML 열어서 Stats Bar, Landscape 카드, Category Focus 보여주기
3. 숫자 포맷, 정렬 방식, 용어 변경 포인트 짚기
4. GitHub에 푸시된 마크다운 버전 언급

---

## 제품 2: Tokamak Hiring System (HR Automation)
**한 줄**: 개발자 소싱부터 결과물 기반 채용 평가까지 자동화하는 내부 도구

### 지난주 주요 업데이트
- **Developer Sourcing (구 LinkedIn Sourcing)**: Google/Brave 검색 + GitHub API로 블록체인 개발자 자동 탐색
- **GitHub Social Accounts 연동**: GitHub 프로필에 LinkedIn 링크가 있는 개발자 자동 매칭 (164명 중 33명 LinkedIn 발견)
- **New 뱃지**: 검색 시 신규 후보자 구분 표시
- **Outreach 워크플로우**: 템플릿 선택 → 메시지 편집 → 클립보드 복사 → LinkedIn 프로필 열기 → Mark as Sent
- **아웃리치 템플릿 개편**: AI 생산성 강조 + 결과물 기반 채용 프로세스 안내 (EN/KR)
- **팀-후보자 매칭 엔진 (신규)**: 후보자 스킬 자동 추출 → 팀원 전문 분야와 매칭률(%) 계산 → 리뷰어 자동 추천
- **후보자 상태 관리**: discovered → contacted → responded / rejected 파이프라인
- **팀 프로필 자동 스캔**: GitHub 활동 분석으로 14명 팀원의 expertise areas, 주요 레포, 언어 자동 프로파일링
- **Track B 평가**: 이력서 대신 실제 결과물(코드)로 5개 차원 AI 평가

### 데모 시나리오
1. localhost:3001 접속 → Developer Sourcing 페이지
2. 키워드 검색 실행 → 후보자 목록, New 뱃지, 점수, Open to Work 표시
3. Prepare Outreach 클릭 → 템플릿 모달 (EN/KR 전환, 메시지 편집)
4. Candidates 페이지 → 가상 후보자 Alex Kim 클릭
5. Team Matching 섹션: 추출된 스킬 (ZK 60%, L2 60%, Solidity 30%) → 추천 리뷰어 Top 3
6. Team 페이지: 14명 팀원 프로필, expertise 분포

### 현재 수치
- 총 후보자: 192명 (DB)
- 검색 소스: Brave Search + GitHub API
- 팀 프로필: 14명 자동 프로파일링 완료
- 아웃리치 템플릿: 9개 (EN/KR)

---

## 작성 요구사항
- 각 섹션별로 **실제 말할 대사**를 작성 (발표 스크립트 형태)
- 화면 전환 시점을 [화면: xxx] 로 표시
- 시간 배분 가이드 포함
- 기술 용어는 비개발자도 이해할 수 있게 풀어서 설명
- Kevin이 중시하는 "숫자 임팩트"를 강조하는 톤
- 자연스러운 한국어 구어체 (읽는 느낌이 아닌 말하는 느낌)
