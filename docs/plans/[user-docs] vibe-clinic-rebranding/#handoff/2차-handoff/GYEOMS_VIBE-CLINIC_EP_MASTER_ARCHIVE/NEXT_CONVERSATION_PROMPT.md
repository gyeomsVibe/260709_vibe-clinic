# 새 대화창 첫 지시문 (아래 전체를 복사해 붙여넣으세요)

---

[세션 인계 — Vibe Clinic 2차 EP: 폴더 탐색기 재건축 직후]

너는 이전 세션을 데이터 손실 없이 이어받는다. 나를 '윤겸스'라 부르고 한국어로 답해라.

■ 신뢰 기준 (2차 EP 아카이브)
- 경로: D:\D_Workspace_NB\-google-workspace\-antigravity-workspace\260709_vibe-clinic\docs\plans\[user-docs] vibe-clinic-rebranding\#handoff\2차-handoff\GYEOMS_VIBE-CLINIC_EP_MASTER_ARCHIVE\
- 먼저 README.md → HANDOFF_SPECIFICATION.json → CONTRADICTION_LEDGER.json 순서로 읽어라.
- CHECKSUMS_SHA256.txt 로 아카이브 무결성을 검증하라 (PowerShell Get-FileHash, '[user-docs]' 경로는 -LiteralPath 필수).
- EP는 스냅샷이다. 코드는 항상 현재 작업 트리를 다시 읽어 확인해라 (코드 > 테스트 > 실측 E2E > 해시 > 문서).

■ 마지막 확인 상태 (2026-07-18)
- 구조: backend/ + frontend/(+legacy-v1) + shared/api-contract.md(단일 진실원) + docs/plans/, npm workspaces. HEAD 92564fb == origin/main.
- npm test 45/45. MIA 코어(진단 재검·원인후보·회귀게이트·자동롤백·약화차단·수동처방·치료원장·치료버튼) 전부 가동.
- ★ 핵심 미커밋: 폴더 선택 OS 대화창을 **완전 삭제**하고(5개 변형 전부 Windows 포그라운드 정책 벽으로 실패 — 문서 58 §3, 재시도 금지) **웹 내장 폴더 탐색기**(GET /api/fs/list + V2 모달)로 재건축한 세트 전체. 테스트 45/45·린트 0·빌드·브라우저 E2E까지 검증 완료 상태로 **커밋 승인만 대기 중**이다.

■ 반드시 먼저 할 일 (오판 방지)
1) WORKSPACE_MAP.md + CLAUDE.md 읽고 경계 준수
2) git status --short && git log --oneline -5 && npm test — 미커밋 세트가 그대로인지 확인 (병렬 세션이 이미 커밋했을 수도 있음)
3) 기획 폴더의 58번 이후 새 번호 문서 확인 (병렬 세션 활동 파악, 문서보다 코드 실측 우선)
4) CONTRADICTION_LEDGER 의 U1(커밋 승인)부터 순서대로 처리

■ 즉시 작업 순서
1. [U1] 재건축 세트 커밋을 나에게 승인받고 커밋 (push는 또 별도 승인)
2. [U2] 내 대시보드 서버 재시작 안내 (구 서버는 [선택]에서 500 남)
3. [U3] 문서 58의 전 기능 감사 A~H 전수검토 재개

■ 승인 게이트 (매번 별도, 일반화 금지)
- 삭제·이동 / 커밋 / 병합 / push / publish·배포 / 실 API 키 입력·저장 / 패키지 설치
- 로컬 수정·로컬 테스트는 세션 승인 범위. .env·비밀키는 읽지도 출력하지도 마라.

■ 금지 사항 (이번 세션에서 실패로 확정된 것)
- OS 대화창 포그라운드 방식 재시도 금지 (아키텍처 벽)
- 'Project: configured' 로그에 절대경로 복원 금지 (프라이버시 회귀 테스트가 지킴)
- 문서 60의 "C4 치료 완료" 주장 신뢰 금지 (SUPERSEDED)
- 진단·테스트 약화로 가짜 통과 금지 / git clean·reset --hard 금지

■ 보고 형식 (고정 6분류)
실행한 것 / 발견한 것 / 수정한 것 / 다시 실행한 검증 / 아직 실행하지 않은 것 / 다음 승인 필요 항목

지금은 코드를 바꾸지 말고, 위 '반드시 먼저 할 일' 1~4를 실행해 현재 상태 재확인 결과를 6분류로 보고한 뒤, U1 커밋 승인 여부를 나에게 물어봐라.
