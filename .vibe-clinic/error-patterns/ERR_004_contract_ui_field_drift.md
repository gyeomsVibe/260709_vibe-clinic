# ERR_004 — 계약 필드와 UI 가정이 어긋나 조용히 기능이 죽는다

## 증상 (같은 뿌리, 다른 얼굴)

두 사례 모두 **에러도 경고도 없이** 기능만 사라졌다. 테스트는 전부 통과했다.

1. **치료 리포트가 비어 있다** — cure-all 실행 후 "manual 4 / unprescribable 6" 숫자는 나오는데
   상세 목록이 `[]`. 어느 진단이 왜 그렇게 분류됐는지 알 수 없어 다음 조치를 정할 수 없다.
2. **BYOK 저장 후 AI가 전부 실패한다** — 설정 화면에서 프로바이더를 고르고 저장하면
   이후 모든 AI 호출이 `Unknown provider` 로 죽는다.

## 근본 원인 — 서버가 주는 필드와 UI가 찾는 필드가 다르다

### 사례 1: 없는 필드를 찾는다

```jsx
// UI
JSON.stringify(cureAllReport?.results || cureAllReport?.items || [])
```

응답의 실제 최상위 필드는 `summary, cured, rolledBack, manual, blocked, unprescribable, held, finalResults`.
`results` 도 `items` 도 존재하지 않으므로 **항상 마지막 폴백인 `[]`** 가 찍힌다.
폴백이 있어서 예외도 나지 않고, 화면은 "결과가 없다"처럼 보인다.

### 사례 2: 표시용 값을 식별자로 쓴다

```js
// 서버: { id: 'gemini', name: 'Google Gemini' }
// UI
return { value: provider?.name || provider?.id }   // → 'Google Gemini'
```

백엔드는 `PROVIDERS[provider]` 로 **키(id)** 를 찾는다. 저장된 값이 `'Google Gemini'` 라
조회가 undefined 가 되고 `Unknown provider` 로 던진다. 저장 자체는 200 으로 성공하기 때문에
사용자는 무엇이 잘못됐는지 알 수 없다.

## 왜 테스트가 못 잡았나

- 백엔드 테스트는 API를 **직접** 호출한다. 그때는 `provider: 'gemini'` 처럼 올바른 값을 코드에 적어 넣는다.
  UI를 거쳐 만들어지는 값은 검증 범위 밖이다.
- 프론트엔드 테스트가 0건이라 렌더링·정규화 계층에는 자동 검증이 아예 없다.
- 두 결함 모두 **폴백이 있어 예외가 안 난다.** 조용히 기능만 빠진다.

## 해결

- cure-all 리포트: 실제 분류 필드(`cured`/`rolledBack`/`manual`/`blocked`/`unprescribable`/`held`)를
  섹션으로 나눠 `diagId` 와 사유(`summary`/`reason`/`error`)를 함께 보여준다.
- 프로바이더: `value` 는 `id`, `label` 은 `name` 으로 분리한다. 표시 문자열을 식별자로 쓰지 않는다.

## 재발 방지 체크리스트

- 서버 응답에서 필드를 꺼낼 때 **계약서(`shared/api-contract.md`)의 필드명을 눈으로 대조**한다. 기억으로 쓰지 않는다.
- `a || b || []` 폴백을 쓸 때, 폴백이 **정상 경로를 가리는 것은 아닌지** 확인한다. 빈 배열이 늘 나오면 필드명이 틀렸을 가능성이 크다.
- 드롭다운·선택 위젯은 **표시명과 저장값을 항상 분리**한다.
- 저장 API가 200 이어도 끝이 아니다. **저장한 값을 실제로 쓰는 경로까지** 한 번 통과시켜 본다.
- UI를 거쳐 만들어지는 값은 백엔드 단위 테스트로 덮이지 않는다 — 프론트 테스트 도입 전까지는 실서버 클릭으로 확인한다.

## 실측 근거 (2026-07-24)

- 리포트: 수정 전 모달의 `<pre>` 가 `[]`. 수정 후 "수동 처방 필요 4"(f01·f02·f04·f05), "처방 불가 6"(f03·f06~f10)로 사유까지 표시.
- 프로바이더: 서버 `{id:'gemini', name:'Google Gemini'}` → 수정 전 저장값 `'Google Gemini'`, 수정 후 `'gemini'`. 4종 전부 id 로 저장됨을 임시 프로젝트에서 확인.
