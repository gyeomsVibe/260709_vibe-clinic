# 로컬 CLI 명령 복구 계획서 (LOCAL CLI COMMAND RESTORE)

PowerShell 환경에서 외부 레지스트리 패키지 의존 실행 시 발생하는 내부/외부 명령 오류를 근절하기 위해, 가이드 문서, 기동 스크립트 및 VS Code 확장 프로그램에서 npm/npx 원격 호출 설계를 모두 배제하고 로컬 소스 실행 기준(`node ./bin/vibe-diag.js`)으로 완전히 롤백합니다.

---

## Proposed Changes

### 1. 가이드 문서 및 규칙 복구
- **[MODIFY] [README.md](file:///d:/D_Workspace_NB/-google-workspace/-antigravity-workspace/260709_vibe-diagnosis/README.md) & [README.ko.md](file:///d:/D_Workspace_NB/-google-workspace/-antigravity-workspace/260709_vibe-diagnosis/README.ko.md)**:
  - CLI 및 대시보드 기동 예제 코드를 모두 `node ./bin/vibe-diag.js ...` (Windows는 `node .\bin\vibe-diag.js ...`) 형식의 로컬 실행형으로 롤백합니다.
  - npm registry 기반의 npx / npm exec 명령어가 기재되어 있던 부분을 전부 제거합니다.
- **[MODIFY] [GEMINI.md](file:///d:/D_Workspace_NB/-google-workspace/-antigravity-workspace/260709_vibe-diagnosis/GEMINI.md)**:
  - availability 가이드 문구를 `Check vibe-diagnosis availability (MCP tools or local CLI node ./bin/vibe-diag.js).` 로 수정합니다.
  - 수정 후 `npm run sync:rules`를 기동하여 로컬 및 전역 **[.claude/skills/vibe-check/SKILL.md](file:///d:/D_Workspace_NB/-google-workspace/-antigravity-workspace/260709_vibe-diagnosis/.claude/skills/vibe-check/SKILL.md)**에 변경 룰을 전파 및 동기화합니다.

### 2. 검증 스크립트 로컬 롤백
- **[MODIFY] [verify_vibe_check_temp.ps1](file:///d:/D_Workspace_NB/-google-workspace/-antigravity-workspace/260709_vibe-diagnosis/claude_vibe_check_mode/scripts/verify_vibe_check_temp.ps1)**:
  - 임시 폴더에서 npx/npm exec을 호출하던 부분을 제거합니다.
  - 대신 프로젝트 루트의 로컬 파일인 `$PSScriptRoot\..\..\bin\vibe-diag.js`를 node로 찾아 직접 실행하도록 교정합니다.
- **[MODIFY] [verify_vibe_check_temp.sh](file:///d:/D_Workspace_NB/-google-workspace/-antigravity-workspace/260709_vibe-diagnosis/claude_vibe_check_mode/scripts/verify_vibe_check_temp.sh)**:
  - 쉘 스크립트 기준 경로 상위에 위치한 `bin/vibe-diag.js`를 node로 로컬 기동하도록 변경합니다.

### 3. VS Code 확장 프로그램 CLI fallback 정교화
- **[MODIFY] [extension.js](file:///d:/D_Workspace_NB/-google-workspace/-antigravity-workspace/260709_vibe-diagnosis/vscode-extension/src/extension.js)**:
  - `resolveVibeDiagInvocation`에서 npx/npm registry fallback 구문을 완전히 도려냅니다.
  - 1) 개발 중인 자체 패키지, 2) workspace 내 `bin/vibe-diag.js` 로컬 소스, 3) workspace 내 `node_modules`에 기 설치된 로컬 패키지 순으로 찾고, 발견되지 않으면 `null`을 반환합니다.
  - `runVibeDiag` 기동 시 `inv`가 없으면 레지스트리 실행을 강제 포기하고, `"vibe-diagnosis local CLI not found. Open the vibe-diagnosis repository or configure MCP/local CLI path."` 에러 콜백을 명시적으로 발생시킵니다.

---

## Verification Plan

### Manual Verification
1. **PowerShell에서 로컬 대시보드 기동 및 포트 변경 테스트**:
   - `node .\bin\vibe-diag.js dashboard` 명령어로 포트 `7700` 기동 확인 후 API 호출
   - `node .\bin\vibe-diag.js dashboard --port 8080` 명령어로 포트 `8080` 기동 확인 후 API 호출
2. **API Endpoint 수신 확인 (`curl.exe`)**:
   - `curl.exe -s -X POST http://localhost:7700/api/run` 및 `8080` 확인 후 정상 JSON 응답 확인

### Automated Tests
1. **전체 단위 테스트 실행 및 통과 입증**:
   - `npm test`
   - `npm run test:self`
   - `npm run test:example`
