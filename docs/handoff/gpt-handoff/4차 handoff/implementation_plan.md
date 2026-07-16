# vibe-diagnosis 논스톱 완료 구현 계획 (VSIX 1.1.3 & npx 폴백 수정)

본 계획은 이전 검증에서 발견된 VSIX의 npx fallback 결함을 수정하고, 버전을 1.1.3으로 올려 VSIX 재빌드 및 관련 문서를 동기화한 뒤, 전체 검증을 통과하여 최종적으로 기존 원격 GitHub 저장소(`gyeomsVibe/260709_vibe-diagnosis`)로 `git push`하기 위한 마감 계획입니다.

## User Review Required

> [!IMPORTANT]
> **원격 git push 승인**:
> 최종 로컬 검증(테스트 완료)을 통과하면, 이번 논스톱 승인 계약에 의거하여 현재 origin/main에 해당하는 원격 브랜치로 `git push origin main`을 직접 수행합니다.
>
> **1회성 외부 의존성 변경 승인**:
> 패키지 버전 상향에 따른 lockfile 갱신(`npm install`) 및 VSIX 빌드(`npx vsce package`)를 수행합니다.

## 금지 사항 (Hard Limits)
- `npm publish` 절대 금지 (기존 Rejard 계정 소유)
- GitHub release 생성 및 VSIX marketplace 배포 금지
- Render 배포 금지
- API Key의 직접 노출/저장/요청 금지

---

## Proposed Changes

### 1. vscode-extension 코어 수정

#### [MODIFY] [extension.js](file:///d:/D_Workspace_NB/-google-workspace/-antigravity-workspace/260709_vibe-diagnosis/vscode-extension/src/extension.js)
- `resolveVibeDiagInvocation` 함수 내의 npx fallback 실행 명령어 변경:
  - 기존: `return { file: 'npx', args: ['-y', 'vibe-diagnosis', ...cliArgs], shell: true };`
  - 변경: `return { file: 'npx', args: ['-y', '--package=vibe-diagnosis', 'vibe-diag', ...cliArgs], shell: true };`
  - 이유: `vibe-diagnosis` 패키지는 bin 명칭이 `vibe-diag`이므로, command로 `vibe-diagnosis`를 넘기면 npx가 해당 패키지 내의 동일명 바이너리를 찾지 못해 실행에 실패합니다. `--package=vibe-diagnosis` 옵션으로 패키지를 지정하고 바이너리를 `vibe-diag`로 타겟팅하여 캐시가 없는 새로운 환경에서도 정상 동작하도록 고칩니다.

### 2. 버전 정책 상향 및 정합화 (1.1.3)

#### [MODIFY] [package.json](file:///d:/D_Workspace_NB/-google-workspace/-antigravity-workspace/260709_vibe-diagnosis/vscode-extension/package.json)
- `"version"` 값을 `"1.1.3"`으로 상향 조정합니다.

#### [MODIFY] [package-lock.json](file:///d:/D_Workspace_NB/-google-workspace/-antigravity-workspace/260709_vibe-diagnosis/vscode-extension/package-lock.json)
- `vscode-extension` 폴더에서 `npm install`을 실행하여 `package-lock.json`에 1.1.3 버전 변경 사항을 동기화시킵니다.

#### [MODIFY] [CHANGELOG.md](file:///d:/D_Workspace_NB/-google-workspace/-antigravity-workspace/260709_vibe-diagnosis/vscode-extension/CHANGELOG.md)
- `1.1.3` 섹션을 추가하고 npx fallback 수정 내용을 상세히 기술합니다.

#### [MODIFY] [README.md](file:///d:/D_Workspace_NB/-google-workspace/-antigravity-workspace/260709_vibe-diagnosis/README.md) & [README.ko.md](file:///d:/D_Workspace_NB/-google-workspace/-antigravity-workspace/260709_vibe-diagnosis/README.ko.md)
- VSIX 수동 설치 가이드에서 `vibe-diagnosis-vscode-1.1.2.vsix`를 `vibe-diagnosis-vscode-1.1.3.vsix`로 수정합니다.

#### [MODIFY] [STATE_BOUNDARY.md](file:///d:/D_Workspace_NB/-google-workspace/-antigravity-workspace/260709_vibe-diagnosis/STATE_BOUNDARY.md)
- VSIX 산출물 목록에 1.1.3 빌드 추가 및 상태 갱신 기록을 추가합니다.

#### [MODIFY] [AGENT_PATCH_QUEUE.md](file:///d:/D_Workspace_NB/-google-workspace/-antigravity-workspace/260709_vibe-diagnosis/AGENT_PATCH_QUEUE.md)
- npx 폴백 결함 수정 항목 및 VSIX 버전을 1.1.3으로 갱신하고 상태를 완료로 변경합니다.

#### [NEW] [ERR_002_npx_fallback_missing_package.md](file:///d:/D_Workspace_NB/-google-workspace/-antigravity-workspace/260709_vibe-diagnosis/.vibe-diagnosis/error-patterns/ERR_002_npx_fallback_missing_package.md)
- 패키지명과 바이너리명이 일치하지 않아 npx fallback 시 발생하던 404/실행 오류 증상 및 해결 방안(npx `--package` 명시)을 문서화하여 에러 패턴으로 추가합니다.

---

## Verification Plan

### Automated Tests
- `npm test`를 실행하여 10개 코어 테스트 통과 여부 검증
- `npm run test:self` 및 `npm run test:example`를 실행하여 진단 엔진 정상 작동 재확인

### Smoke & Integration Tests
1. **MCP smoke test**:
   - `mcp-server` 폴더 내의 `node test-mcp.cjs`를 실행하여 JSON-RPC 프로토콜을 통과하는지 검증
2. **Dashboard & HTTP API smoke test**:
   - 대시보드를 백그라운드로 기동하여 `http://localhost:7700/api/run`에 HTTP 요청을 보내 로그를 기록하고, 검증 완료 후 안전하게 프로세스 종료
3. **Auto Repair 안전 차단 검증**:
   - BYOK API key 미설정 시 Auto Repair 명령을 날려 실호출 없이 "BYOK not configured" 안전 차단 동작이 수행되는지 로그로 확인
4. **VSIX 빌드 확인**:
   - `npx vsce package` 명령을 사용해 `vibe-diagnosis-vscode-1.1.3.vsix`가 정상 생성되는지 크기 및 존재 유무 확인 (순정 VS Code 미설치 기기이므로 GUI 실동작 테스트는 미실행으로 유지 및 명시)

### Commit & Push Plan
1. 변경 사항들을 의미 단위로 나누어 로컬 git 커밋을 구성합니다.
2. 최종 검증 통과를 확인한 후 `git push origin main`을 실행하여 원격 저장소에 업로드합니다.
3. 최종 6분류 보고서를 사용자에게 리포트합니다.
