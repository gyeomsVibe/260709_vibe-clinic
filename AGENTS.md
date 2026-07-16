# Vibe Clinic Agent Boundary

모든 에이전트는 작업 전에 루트의 `WORKSPACE_MAP.md`를 읽는다.

- 대표 저장소는 현재 폴더 하나뿐이다.
- 상위 폴더의 다른 프로젝트는 작업 범위에서 제외한다.
- 사용자 미커밋 변경을 보존한다.
- Git worktree를 탐색기로 이동하거나 삭제하지 않는다.
- 삭제·이동·이름 변경, 커밋, 병합, push는 각각 별도 승인 후 실행한다.
- 복구 자료는 복사 후 SHA-256 검증이 끝나기 전 원본을 제거하지 않는다.
- `.env`, 인증키, 토큰 및 자격증명 파일을 읽지 않는다.
## Repository Partition

- `backend/`: 실행 엔진, CLI, MCP, 테스트. MCP 진입점은 `backend/mcp-server/index.js`다.
- `frontend/`: 정식 V2 UI와 `legacy-v1/` 보관 UI다.
- `shared/`: API 계약의 단일 진실원이다.
- `docs/`: `plans/`, `handoff/`, `operations/`, `assets/`만 둔다.
- `integrations/`: `vscode-extension/`, `claude-vibe-check/`만 둔다.

## User-authored material safeguard

- 사용자 저장 자료의 이동·이름 변경·삭제 전에는 이전 절대경로, 새 절대경로, 이유, 복구 방법을 먼저 고지하고 명시적 승인을 받는다.
- `docs/operations/agent-reference-path-migration.md`의 경로 전환표를 참조한다. 이전 경로를 자동으로 추정하거나 사용자 자료를 임의로 정리하지 않는다.