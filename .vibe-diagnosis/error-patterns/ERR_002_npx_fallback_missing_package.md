# ERR_002: VS Code 확장 npx 폴백 패키지명 불일치 오류

## 현상 및 증상
- 개발용 저장소 외부의 프로젝트에서 VS Code 확장(`vibe-diagnosis-vscode`)을 통해 `Vibe Diagnosis: Run`, `Vibe Diagnosis: Init`, `Vibe Diagnosis: Open Dashboard` 등의 명령을 실행할 때 CLI 도구 호출에 실패함.
- 터미널 출력 및 로그에 `npx: 에러` 또는 `404 Not Found (vibe-diag)` 에러가 발생함.

---

## 원인 분석
1. **바이너리명과 패키지명 불일치**:
   - `vibe-diagnosis` 자가진단 프레임워크의 npm 패키지 이름은 `vibe-diagnosis`이나, 정의된 CLI 바이너리 명칭은 `vibe-diag`입니다.
2. **잘못된 npx 호출 방식**:
   - 기존의 VS Code 확장 소스 코드에서는 로컬 바이너리가 없을 경우 `npx vibe-diag ...` 또는 `npx -y vibe-diagnosis ...`를 기본 fallback으로 실행했습니다.
   - `npx vibe-diag`는 npm registry에 존재하지 않는 `vibe-diag` 패키지를 찾기 때문에 404 에러로 실패합니다.
   - `npx vibe-diagnosis`는 패키지는 받아오지만 내부에서 패키지명과 같은 `vibe-diagnosis` 바이너리를 실행하려 시도하므로, `vibe-diag` 바이너리를 찾지 못해 실행에 실패합니다.
3. **캐시 의존성 문제**:
   - 개발자 로컬 PC에서는 mcp-server 설치 과정 등에서 `vibe-diagnosis` 캐시가 남아있어 우연히 실행되는 것처럼 보였으나, 캐시가 없는 새로운 환경에서는 완전히 실패하게 됩니다.

---

## 해결 방법 (교정 내용)
`npx` 호출 방식을 명시적 패키지 타겟팅 방식으로 수정합니다.

- **기존 방식**:
  ```bash
  npx vibe-diag run --json --cwd <workspace>
  # 또는
  npx -y vibe-diagnosis run --json --cwd <workspace>
  ```
- **개선 방식**:
  ```bash
  npx -y --package=vibe-diagnosis vibe-diag run --json --cwd <workspace>
  ```
  `--package=vibe-diagnosis` 옵션을 주어 다운로드받을 패키지명을 명확히 지정하고, 실제 실행 파일은 패키지 내의 `vibe-diag` 바이너리로 명시하여 호출합니다.

---

## 예방 및 검증 방법
- 향후 CLI 바이너리명과 패키지명이 다른 라이브러리/도구를 VS Code 확장 프로그램 등에서 `npx` fallback으로 호출할 때는 반드시 `npx -y --package=<package_name> <bin_name>` 표준 실행 형식을 따르도록 강제합니다.
- 패키지 수동 배포 후 캐시가 없는 도커 컨테이너 또는 가상 머신 환경에서 해당 npx 명령어가 정상적으로 실행되는지 통합 테스트를 수행합니다.
