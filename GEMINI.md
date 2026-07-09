# VIBE_CHECK_AUTORUN_MODE

> Antigravity / Gemini 계열 에이전트용 프로젝트 점검 모드 규칙.
> Claude Code는 동일한 모드를 `.claude/skills/vibe-check/SKILL.md`로 사용한다.
> 두 파일의 트리거와 규칙은 항상 동일하게 유지한다.

## Trigger phrases

- "이 프로젝트 점검해서 교정해줘" (기본 권장)
- "원터치 점검해줘"
- "vibe-check 해줘"
- "자가진단 MCP 적용해줘"
- "진단 돌리고 실패한 것 고쳐줘"

## Approval model (승인 구조)

사용자는 세부 단계가 아니라 **큰 문턱만** 승인한다.

1. **세션 승인 (한 번)** — 로컬 파일 읽기/생성/수정, package-lock 재생성,
   로컬 테스트 실행, MCP smoke test, VSIX 로컬 재빌드까지 일괄 허용.
2. **설치/패키지 명령 승인 (실행 전 짧은 확인)** — `npm install`, `npm pack`,
   `vsce package`처럼 의존성을 바꾸거나 오래 걸리는 명령은 실행 전에 한 줄로 확인받는다.
3. **절대 금지 (자동 실행 불가)** — 아래는 사용자가 별도로 명시 승인하기 전에는 하지 않는다.
   - `git push` / `npm publish` / GitHub release 생성 / 실제 배포
   - 실제 API key 요청·입력·저장·출력
   - 원격 저장소 상태를 "최종 검증됨 / release-ready"로 선언

## Behavior

1. Confirm project root and current git state.
2. Check vibe-diagnosis availability (MCP tools or `npx vibe-diag`).
3. If `.vibe-diagnosis/` is missing → `init_diagnostics`.
4. If it already exists → init is idempotent: existing files are untouched,
   only `.gitignore` entry and MCP config are reinforced.
5. `list_diagnostics` — confirm diagnostic files and schema validity.
6. `run_diagnostics` — capture `overallStatus` and `healthPercent`.
7. Explain failures in beginner-friendly Korean (원인 후보 2~3개로 좁히기).
   Check `read_error_pattern` first for known recurring patterns.
8. Repair with the minimal related fix only:
   **1 failure → 1 cause → smallest fix → re-run → report.**
   Never weaken a `.diag.js` file to force a pass.
9. `run_diagnostics` again — success is judged only by the re-run result.
10. If the mistake is likely to repeat → `write_error_pattern`
    (filename `ERR_NNN_slug.md`, no path separators).
11. Optionally `open_dashboard` (binds to 127.0.0.1 only).
12. Report executed and unexecuted checks separately.

## State separation (혼동 금지)

다음 상태를 절대 한 덩어리로 취급하지 않는다 (상세: `STATE_BOUNDARY.md`):

- 업로드/원본 ZIP 상태 · 현재 작업 트리 · GitHub 원격 · VSIX 산출물 · node_modules · npm 배포본

## Report format

- 실행한 것 / 발견한 것 / 수정한 것 / 다시 실행한 검증 / 아직 실행하지 않은 것 / 다음 승인 필요 항목

## Never

- push, publish, release 생성
- production-ready / release-ready 선언 (측정 근거 없이)
- 실제 API key 요청·저장
- 실행하지 않은 검증을 실행했다고 보고
