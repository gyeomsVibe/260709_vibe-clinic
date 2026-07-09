---
name: vibe-check
description: 승인 기반 원터치 자가진단 점검 모드(VIBE_CHECK_AUTORUN_MODE). "이 프로젝트 점검해서 교정해줘", "원터치 점검해줘", "vibe-check 해줘", "자가진단 MCP 적용해줘", "진단 돌리고 실패한 것 고쳐줘" 요청 시 사용. 사용자는 큰 승인만 하고, 에이전트가 상태 분리 → 진단 → 최소 수정 → 재진단 → 분리 보고까지 자동 수행한다.
---

# vibe-check — VIBE_CHECK_AUTORUN_MODE

## 정의

"원터치"는 **사용자 입력이 한 번**이라는 뜻이지, 내부 검증 단계가 하나라는 뜻이 아니다.
사용자는 감독(승인만), 에이전트는 작업자(계획→수정→검증→보고), vibe-diagnosis MCP는 검사 도구다.
Antigravity/Gemini 계열은 동일 규칙을 루트 `GEMINI.md`로 사용한다 — 두 파일의 트리거·규칙은 항상 동일하게 유지한다.

## 승인 구조 (핵심)

사용자가 세부 단계를 승인할 필요 없다. **큰 문턱 3개만** 구분한다.

| 승인 레벨 | 대상 | 방식 |
|---|---|---|
| 1. 세션 승인 | 로컬 파일 읽기/생성/수정, package-lock 재생성, 로컬 테스트, MCP smoke test, VSIX 로컬 재빌드 | 모드 시작 시 **한 번** |
| 2. 설치/패키지 명령 | `npm install`, `npm pack`, `vsce package` 등 의존성 변경·장시간 명령 | 실행 전 **한 줄 확인** |
| 3. 절대 금지 | `git push`, `npm publish`, release 생성, 실제 배포, 실제 API key 요청·저장, "release-ready" 선언 | 사용자가 원해도 **별도 명시 승인 없이는 실행 금지** |

## 역할 구분 (혼동 금지)

- **MCP** = AI가 누를 수 있는 버튼 묶음. MCP가 코드를 고치는 것이 아니다.
  MCP는 **진단을 실행하고, 교정 흐름을 호출**한다.
- **Runner** = 실제 진단 실행기 (`src/runner.js`)
- **Repairer** = 실패한 파일을 BYOK AI로 고치는 로직 (`src/repairer.js`)
- **Dashboard** = 결과를 보는 화면

## 자동 실행 묶음 (Phase A~E)

승인 후 아래 5개 묶음을 순서대로 자동 수행한다.

### Phase A. 상태 분리
`STATE_BOUNDARY.md` 확인/갱신. 원본 ZIP · 작업 트리 · GitHub 원격 · VSIX · node_modules를
절대 한 덩어리로 취급하지 않는다. 패치 순서는 `AGENT_PATCH_QUEUE.md`에 기록.

### Phase B. 초기화/보강
1. 프로젝트 루트와 `.vibe-diagnosis/` 존재 여부 확인.
2. 없으면 **`init_diagnostics`**. 있으면 멱등 보강만 수행됨
   (기존 파일 불변, `.gitignore`/MCP 설정만 보강).

### Phase C. 진단 실행
3. **`list_diagnostics`** — 진단 목록과 스키마 유효성 확인.
4. **`run_diagnostics`** — `overallStatus`와 `healthPercent` 확보.

### Phase D. 실패 교정 루프
5. **실패 분석** — ERROR/WARNING의 `details`로 원인 후보를 2~3개로 좁힌다.
   `read_error_pattern`으로 과거 동일 패턴을 먼저 확인한다.
6. **최소 수정** — 원칙: **1 failure → 1 cause → smallest fix → re-run → report.**
   진단 파일(.diag.js)을 약화시켜 통과시키는 것은 금지.
7. **`run_diagnostics` 재실행** — OK 판정은 재실행 결과 기준.
8. **`write_error_pattern`** — 반복 가능성이 있는 실패면 기록.
   filename은 `ERR_NNN_slug.md` 형식, 경로 구분자 금지.
9. **`open_dashboard`** — 필요 시 (127.0.0.1 전용).

### Phase E. 결과 보고
아래 "보고 형식" 6분류로 보고하고 종료한다.

## Auto Repair 경계 (반드시 인지)

- Auto Repair는 **전체 파일 치환** 방식이다 (부분 패치가 아님).
- 수정 전 `.bak` 백업을 만든다.
- 수정 후 해당 진단을 다시 실행한다.
- OK 판정은 **재실행 결과** 기준이다.
- BYOK 미설정 시 Auto Repair는 동작하지 않으며, 에이전트가 직접 최소 수정한다.

## 금지

- 원격 push / publish / 배포·릴리즈 선언 금지 (별도 명시 승인 필요)
- production-ready / release-ready 선언 금지 (측정 근거 없이)
- 실제 API key 요청·저장·출력 금지
- 진단 기준 완화로 "통과 위장" 금지
- 실행하지 않은 검증을 실행했다고 보고 금지

## 보고 형식 (6분류 고정)

1. **실행한 것**
2. **발견한 것**
3. **수정한 것**
4. **다시 실행한 검증**
5. **아직 실행하지 않은 것**
6. **다음 승인 필요 항목**
