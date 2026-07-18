# GYEOMS Vibe Clinic — Foundation Working Draft (작업 기반 문서)

> Status: `VERIFIED_RESULT` (커밋 대기분 제외) · 기준: 2026-07-18 · 이 문서는 "지금 프로젝트가 어떤 모습인가"의 한 장짜리 지도다.

## 1. 제품이 하는 일 (한 문단)

**Vibe Clinic 2.0.1** — 바이브코딩 프로젝트 자가 진단·치료 프레임워크. 프로젝트의 `.vibe-clinic/diagnostics/*.clinic.js|cjs` 를 실행해 건강 상태를 진단하고(OK/WARNING/ERROR + 확진/의심 + 원인 후보), 실패를 AI/로컬 규칙으로 **처방→승인→적용→재진단 검증**까지 수행한다. 완치 판정은 오직 재진단 OK + 회귀 0 (`VERIFIED_RESULT`) — 치료가 다른 진단을 부수면 **자동 롤백**된다. CLI(`vibe-clinic`/`vbc`)·웹 대시보드(V1 legacy·V2 정식)·MCP 서버(3개 AI 도구 연동)로 제공.

## 2. 저장소 지도

```text
260709_vibe-clinic/            # 유일한 대표 저장소 (HEAD 92564fb == origin/main)
├─ backend/                    # Node 무빌드: src(엔진 9종)·bin(CLI)·mcp-server·test(45개)
├─ frontend/                   # React+Vite V2 정식 (src/AppV2.jsx + components/hooks/api)
│  └─ legacy-v1/dashboard-ui/  # V1 보존 (유지보수 최소)
├─ shared/api-contract.md      # ★ API 단일 진실원 (17개 엔드포인트 + 소유권 규칙)
├─ docs/plans/[user-docs] vibe-clinic-rebranding/   # 번호 문서 0~60 + #handoff/
├─ examples/calculator/        # 데모 프로젝트
├─ WORKSPACE_MAP.md · CLAUDE.md # 경계·승인 규칙 (작업 전 필독)
└─ package.json                # npm workspaces + backend:*/frontend:* 스크립트
```

관련 외부: `260709_vibe-clinic-support/`(복구 보관소), `260714_gyeoms-ai-agent`(별도 repo, push 완료).

## 3. 코어 파이프라인 (MIA 이식 완료)

진단: Flaky Gate(실패 자동 재검 → 확진 2/2·의심 1/2) → triage 원인 후보(≤3) → prescription(진단 자체 처방)
치료: 전략(auto/local/ai) → 약화 차단(BLOCKED_WEAKENING) → 승인 적용 → 전체 재진단 → 회귀 시 자동 롤백(409/ROLLED_BACK) → 치료 원장 + CURE 패턴 축적 → 💉 치료 버튼(cureAll 배치)
보안: 마스킹 키 덮어쓰기 방지 · **/.vibe-clinic/config.json ignore · Origin/경로탈출/1MiB 가드

## 4. 이번 세션의 마지막 작업 (★ 미커밋)

**폴더 선택 아키텍처 교체** — OS 대화창(PowerShell) 5개 변형 전부 실패(Windows 포그라운드 정책 벽, 문서 58 §3) → 윤겸스 A안 승인 → `folder-picker.ps1` **삭제**, `POST /api/project/select` → 410, **`GET /api/fs/list`**(읽기 전용 폴더 목록) + **V2 폴더 탐색 모달** 신설. 검증: 45/45 · 린트 0 · 빌드 · 브라우저 E2E 완주(탐색→선택→프로젝트 변경→자동 진단 연쇄). **커밋 승인 대기 = 다음 세션 1번 과제.**

## 5. 명령어 요약

```bash
npm test                # backend 45/45
npm run test:self       # 저장소 자가진단 (Health 100%)
npm run frontend:build  # V2 빌드 → backend/src/dist-v2
run-dashboard.bat       # 대시보드 (V1: /v1, V2: /v2, 포트 7700)
node backend/bin/vibe-clinic.js dashboard --cwd <대상> --port 7700 --ui v2
```

## 6. 남은 일 (우선순위)

U1 커밋 승인 → U2 서버 재시작 안내 → U3 전 기능 감사 A~H → U4 V2 프론트 테스트(vitest 승인 필요) → U8 프라이버시 로그 절충안. 상세: CONTRADICTION_LEDGER.json
