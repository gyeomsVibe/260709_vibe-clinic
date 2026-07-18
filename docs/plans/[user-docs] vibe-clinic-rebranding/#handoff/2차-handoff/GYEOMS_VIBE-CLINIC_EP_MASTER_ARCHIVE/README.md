# GYEOMS_VIBE-CLINIC_EP_MASTER_ARCHIVE (2차 Handoff)

포렌식급 마스터 아카이브 Evidence Pack — 이전 세션(2026-07-15~18)을 **데이터 손실 없이** 새 대화창에서 이어가기 위한 인계 패키지.

- 생성: 2026-07-18, Claude Fable 5 (Claude Code) as Context Compiler
- 기준: ①재현성 ②증거 원본성 ③무결성 ④버전/결정 이력 ⑤다음 작업 복구성

## 사용법 (새 대화창)

1. **`NEXT_CONVERSATION_PROMPT.md` 의 내용을 새 대화창의 첫 메시지로 붙여넣는다.** ← 이것 하나로 충분
2. 새 에이전트는 그 지시에 따라 이 폴더를 찾아 README → HANDOFF_SPECIFICATION → CONTRADICTION_LEDGER 순으로 읽고, 해시 검증 후 U1(커밋 승인)부터 재개한다.

## 파일 구성

| 파일 | 역할 |
|---|---|
| `vibe-clinic_EP_master_archive.json` | 마스터 인덱스 (envelope + 정본 해시 + 구성요소 해시) |
| `SOURCE_MANIFEST.json` | 소스 28건 인벤토리 (S1~S5 계층, working-tree SHA-256, 커밋 상태) |
| `CLAIM_MAPPING.json` | 검증된 사실 10건 — 소스 ID와 관계형 연결 |
| `CONTRADICTION_LEDGER.json` | 미결 과제 U1~U8 + 환경 제약 (오판 방지) |
| `DECISION_HISTORY.json` | 결정 이력 D1~D10 + 기억할 실패 4건 |
| `HANDOFF_SPECIFICATION.json` | 복구 절차·상속 제약·즉시 작업 순위 |
| `GYEOMS_FOUNDATION_WORKING_DRAFT.md` | 프로젝트 현재 모습 한 장 지도 |
| `NEXT_CONVERSATION_PROMPT.md` | ★ 새창 첫 지시문 (복사-붙여넣기) |
| `CHECKSUMS_SHA256.txt` | 이 아카이브 전 파일의 SHA-256 |
| `source_files/015_현재_대화창_전체_대화_로그.md` | 세션 서사 전체 로그 (막 1~7) |

## 무결성 검증

```powershell
# 아카이브 자체 검증 (경로의 [user-docs] 때문에 -LiteralPath 필수)
Get-Content -LiteralPath .\CHECKSUMS_SHA256.txt | ForEach-Object {
  $h,$f = $_ -split '  ',2
  $actual = (Get-FileHash -LiteralPath $f -Algorithm SHA256).Hash.ToLower()
  if ($actual -ne $h) { "MISMATCH: $f" } else { "OK: $f" }
}
```

소스 코드 검증은 `SOURCE_MANIFEST.json` 의 해시와 대조 (불일치 = EP 이후 변경 → 재독 필요).

## 정직 고지 (원안 대비 조정)

- `source_files/` 의 "001~014 원본 지식 JSON/DOCX" 템플릿 항목: 이 프로젝트의 원본 증거는 **git 저장소 자체**이므로 사본 중복 대신 SOURCE_MANIFEST 의 해시 참조로 대체했다 (증거 원본성은 git 히스토리 + 해시로 보장, 중복 사본은 오히려 drift 위험).
- 015 의 `.pdf` 판형: 이 환경에 PDF 변환 도구 승인이 없어 `.md` 단일 판으로 제공. 내용 손실 없음.
- 대화 축어록이 아닌 **결정·증거 중심 재구성**이다 — 축어록은 Claude Code 세션 로그(호스트 앱)가 원본이며, 이 로그는 그 요약이 아니라 인계에 필요한 전부를 담은 서사다.
