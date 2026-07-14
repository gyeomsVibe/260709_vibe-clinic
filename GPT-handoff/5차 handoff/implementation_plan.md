# vibe-diagnosis 원격 저장소 정합성 패치 계획 (Remote Consistency Patch)

본 계획은 기존 패치 이후 원격 저장소(GitHub main)와 로컬 파일 간의 문서, 스크립트, 설치 규칙상에 존재하는 정합성 결함 4건을 교정하고, 직접 push 권한을 명시하여 최종적으로 안전하게 원격 반영을 마치기 위한 계획입니다.

## User Review Required

> [!IMPORTANT]
> **원격 git push 승인**:
> 로컬 검증(테스트)이 성공적으로 완료되면, 최종적으로 `git push origin main` 명령어를 직접 수행하여 GitHub 원격 브랜치에 변경 사항을 즉시 동기화합니다.
>
> **의존성 및 스크립트 검증**:
> 수정된 npx fallback 명령어와 Claude Code용 설치 스크립트(`install_claude_vibe_check.ps1`/`.sh`)의 병합 안정성을 검증하기 위해 임시 디렉토리를 사용하는 스모크 테스트를 수행합니다.

## 금지 사항 (Hard Limits)
- `npm publish` 금지
- GitHub release 생성 및 VSIX marketplace 배포 금지
- Render 배포 금지
- API Key 노출/저장 금지
- 강제 푸시(`git push -f`) 금지

---

## Proposed Changes

### 1. CLI npx 가이드 예시 교정

#### [MODIFY] [README.md](file:///d:/D_Workspace_NB/-google-workspace/-antigravity-workspace/260709_vibe-diagnosis/README.md) & [README.ko.md](file:///d:/D_Workspace_NB/-google-workspace/-antigravity-workspace/260709_vibe-diagnosis/README.ko.md)
- CLI 섹션 등에서 안내되는 `npx vibe-diag ...` 구문을 `npx -y --package=vibe-diagnosis vibe-diag ...` 구조로 모두 수정합니다.
- 패키지명(`vibe-diagnosis`)과 바이너리명(`vibe-diag`)의 불일치로 인해 캐시 없는 새 환경에서 오동작하는 문제를 가이드 수준에서 전면 방지합니다.

### 2. Claude 설치 패키지 스모크 테스트 스크립트 교정

#### [MODIFY] [verify_vibe_check_temp.ps1](file:///d:/D_Workspace_NB/-google-workspace/-antigravity-workspace/260709_vibe-diagnosis/claude_vibe_check_mode/scripts/verify_vibe_check_temp.ps1) & [verify_vibe_check_temp.sh](file:///d:/D_Workspace_NB/-google-workspace/-antigravity-workspace/260709_vibe-diagnosis/claude_vibe_check_mode/scripts/verify_vibe_check_temp.sh)
- 스크립트 내부의 `npx vibe-diagnosis init` / `npx vibe-diagnosis run` 호출부를 `npx -y --package=vibe-diagnosis vibe-diag init` / `npx -y --package=vibe-diagnosis vibe-diag run`으로 수정합니다.

### 3. Claude 설치 스크립트의 마커(Marker) 병합 로직 교정

#### [MODIFY] [install_claude_vibe_check.ps1](file:///d:/D_Workspace_NB/-google-workspace/-antigravity-workspace/260709_vibe-diagnosis/claude_vibe_check_mode/install_claude_vibe_check.ps1) & [install_claude_vibe_check.sh](file:///d:/D_Workspace_NB/-google-workspace/-antigravity-workspace/260709_vibe-diagnosis/claude_vibe_check_mode/install_claude_vibe_check.sh)
- `CLAUDE.md` 병합 시 외부 스니펫 파일 자체의 마커 포함 여부와 무관하게, 스크립트 레벨에서 확실하게 `$start`/`$end` (또는 `START`/`END`) 마커를 감싸서 치환/삽입하도록 정합화합니다.
- 예시: 치환 시 `$start + "`n" + $snippet.Trim() + "`n" + $end` 형태로 가공하여 반영함으로써 마커 소실로 인한 무한 증식 현상을 구조적으로 차단합니다.

#### [MODIFY] [CLAUDE.md.snippet](file:///d:/D_Workspace_NB/-google-workspace/-antigravity-workspace/260709_vibe-diagnosis/claude_vibe_check_mode/global/CLAUDE.md.snippet)
- 스니펫 내부에서 물리적으로 하드코딩되어 있던 시작/종료 HTML 주석 마커(`<!-- VIBE_CHECK_GLOBAL_RULES_START -->` 등)를 제거합니다.

### 4. 에이전트 Direct Push 정책 명문화

#### [MODIFY] [GEMINI.md](file:///d:/D_Workspace_NB/-google-workspace/-antigravity-workspace/260709_vibe-diagnosis/GEMINI.md) & [SKILL.md](file:///d:/D_Workspace_NB/-google-workspace/-antigravity-workspace/260709_vibe-diagnosis/.claude/skills/vibe-check/SKILL.md)
- `Approval model (승인 구조)` 및 `Never` 정책 부분에 다음과 같은 Direct GitHub Push 예외 조건을 추가합니다:
  - "세션 승인 또는 최초 계약 단계에서 휴먼 오너의 직접 푸시 동의가 완료된 세션에 한해, 로컬 검증 통과 후 `git push origin main`을 직접 수행할 수 있다."
- Antigravity 및 Claude Code 에이전트의 원격 직접 push 동작 기준을 명문화하여 정합성을 맞춥니다.

---

## Verification Plan

### Automated Tests
- `npm test`, `npm run test:self`, `npm run test:example`를 실행하여 10개 코어 테스트 및 진단 확인

### Claude 설치 스크립트 안정성 검증
- 전역 파일(`~/.claude/CLAUDE.md`)을 직접 훼손하지 않기 위해 임시 환경 변수(`$env:USERPROFILE` 또는 `$HOME` 경로 등)를 임시 임의 경로로 우회 설정하거나 dry-run 방식으로 `install_claude_vibe_check` 스크립트를 기동하여, 병합 로직의 동작 방식(마커 유지 및 중복 삽입 차단)이 원활한지 안전한 범위에서 확인합니다.

### Commit & Push Plan
1. 모든 정합화 패치 작업을 완료한 뒤, 변경된 내용들을 Git 로컬 커밋으로 구성합니다.
2. 최종 `git push origin main` 명령을 직접 기동하여 GitHub 원격 저장소와 완전히 정합화시킵니다.
3. 최종 6분류 보고서를 작성하여 보고합니다.
