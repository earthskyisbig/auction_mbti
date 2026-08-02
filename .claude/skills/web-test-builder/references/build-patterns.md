# 웹 화면 구현 패턴 (v2)

실제 구현은 `index.html`이 정본이다. 아래는 그 구조를 요약한 것이며, 새로 만들거나 크게 고칠 때 참고한다.

## 1. 데이터 임베드 (단일 파일)

```html
<script>
const AXES      = [ /* 02_diagnostic.json의 axes */ ];
const QUESTIONS = [ /* questions — 축당 3문항, 선택지 2개 */ ];
const TYPES     = { "A-SEK": { name, summary, keywords, fit, trap, checklist, first } /* 8개 */ };
const BUDGETS   = [ {v:'u50', label:'5,000만 원 이하', top:50000000}, ... ];
const SIDO / SIGUNGU / REGULATED_GG = /* 지역 + 규제 판정 목록 (00_regulations.md §E) */;
const FLAG_DEFS = [ { id, level, title, msg, test: s => /* 조건 함수 */ } ];
</script>
```

JSON을 그대로 붙이되, `flags[].when`(선언형)은 임베드 시 `test` **함수**로 바꾼다. 조건 평가기를 따로 만들 필요가 없고, 조건이 한눈에 읽힌다.

```js
{ id:'novice_risk', level:'danger', test: s => s.experience==='novice' && s.code[2]==='R' }
```

`s`는 `{code, budget, ownership, experience, regulated}`. **코드 인덱스 주의** — `"A-SHP"`에서 `[2]`=권리, `[3]`=손품, `[4]`=출구.

## 2. 상태와 채점

```js
const state = { budget:null, sido:null, sigungu:null, ownership:null, experience:null, answers:{} };

function computeCode(){
  // 축별로 극 점수 합산 → 우세 극. 축당 3문항이므로 동점 없음.
  // 반환: { code:'A-SHP', strength:{RIGHTS:3, WORK:2, EXIT:3} }  // 2 = 약간 기울어짐
}
```

`state`를 전역에 두면 브라우저 콘솔·자동화에서 골든 케이스를 그대로 돌릴 수 있다(QA가 이 방식으로 검증한다).

## 3. 검색조건 계산 (`04_search_criteria.json` 재현)

```js
function computeCriteria(){
  const regKey = regulated===true ? 'regulated' : regulated===false ? 'normal' : 'unknown';
  const ltv    = MULT[regKey][ownership];
  let coef = 1.0;
  if(W==='H') coef *= 0.85;          // 수리·이사비
  if(R==='R') coef *= 0.9;           // 소송·장기화
  const priceMax = Math.floor(budgetTop * ltv * coef / 10000) * 10000;   // 만 원 단위 내림
  ...
  return { code, priceMax, priceMin, fail, failWhy, rights, overridden, types, area, ... };
}
```

**`failWhy`·`coefWhy` 같은 "왜 이 값인가" 배열을 함께 반환**한다. 결과 화면에서 조건마다 근거 한 줄을 보여주는 데 쓰고, QA가 어느 규칙이 걸렸는지 확인하는 데도 쓴다.

## 4. 렌더링

- 화면 전환: `.screen` + `.active` 클래스 토글, 전환 시 `scrollTo(0,0)`.
- 사실 입력 화면은 **입력이 바뀔 때마다 전체 재렌더**한다(시/도를 바꾸면 시군구 목록과 규제 배지가 함께 갱신되어야 한다). 재렌더 후 이벤트를 다시 바인딩한다.
- 질문 화면: 선택 즉시 `setTimeout(nextQ, 220)`으로 자동 진행하되, `이전` 버튼으로 되돌아갈 수 있게 한다.
- 결과 화면: 문자열 조합으로 한 번에 `innerHTML`. 사용자 입력이 들어가는 자리는 `esc()`로 이스케이프.
- 플래그는 `danger → warn → info` 순으로 정렬해 위험한 것부터 읽히게 한다.

## 5. 자주 나는 실수

| 실수 | 증상 | 예방 |
|---|---|---|
| `const`를 쓰는 위치보다 아래에 선언 | 결과 화면이 통째로 안 뜸(TDZ ReferenceError) | 표 데이터를 만들기 **전에** 라벨 변수를 선언 |
| 유찰 0회를 "0회 이상"으로 표기 | 사용자가 필터 의미를 오해 | "제한 없음(신건도 포함)"으로 표기 |
| 계산식을 JSON과 다르게 구현 | 골든 케이스 불일치 | JSON이 정본. 웹을 고친다 |
| `file://`로 자동화 검증 시도 | 브라우저가 접근 차단 | `python -m http.server 8899`로 띄운다 |
| 결과에 `undefined` 노출 | 데이터 키 오타 | 렌더 후 `innerHTML.indexOf('undefined')` 검사 |

## 6. 검증 스니펫

```js
// 8유형 전부 도달 가능한가
const codes = new Set();
['S','R'].forEach(a=>['E','H'].forEach(b=>['K','P'].forEach(c=>{
  QUESTIONS.forEach(q=>{ const w = q.axis==='RIGHTS'?a:q.axis==='WORK'?b:c;
    state.answers[q.id] = q.opts.findIndex(o=>o.pole===w); });
  codes.add(computeCode().code);
})));
console.log(codes.size === 8);
```
