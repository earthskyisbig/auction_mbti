# 05. 2레이어 데이터 모델 개편 설계안

**작성일:** 2026-07-25
**상태:** ✅ 구현 완료 (S1~S7) · 셀프테스트 15/15 통과
**목적:** 단순 성향 테스트 → 법원경매 검색/필터/분석 시스템의 기반 모델로 개편

## 0. 결정 기록

구현 전 3가지 갈림길을 근거와 함께 검토하고 아래로 확정했다.

| 갈림길 | 결정 | 근거 |
|---|---|---|
| **축 개편 범위** | 신규 4축을 **미니설문으로 분리** 추가, 레거시 16유형 유지 | 유형명이 검색값으로 지어져 있어(“**동네** 안전 낙찰러”=REGION `n`, “**소액** 특수 단타러”=FUND `s`) FUND·REGION을 빼면 16→4유형으로 붕괴하고 콘텐츠 15,339자가 죽는다. 공유 URL이 `{'q:g1':0}` 형태의 **문항ID 기반**이라 모르는 ID를 무시하므로, 신규 문항을 메인 설문 밖에 두면 기존 설문·공유링크가 무손상이다. |
| **파일 구조** | **단일 HTML 유지** | README가 “설치 불필요, 단일 파일”을 기능으로 명시. `publish.sh`도 파일 1개만 복사한다. (분할 시 `file://`가 깨지는 것은 ES module에 한하고 일반 script는 동작하지만, “파일 하나 건네주면 끝”이라는 강점을 잃는다.) |
| **구현 범위** | **S1~S7 전체** | 미니설문 분리로 S5의 기존 동작 파괴 위험이 사라져 전체 구현이 안전해졌다. |

> ⚠️ **원본 파일 주의:** `publish.sh`가 `cp 부동산투자성향테스트.html index.html`을 수행한다.
> **원본은 `부동산투자성향테스트.html`이고 `index.html`은 생성물**이다. 수정은 반드시 원본 쪽에 한다.

---

## 1. 현재 구조 분석

### 1.1 물리 구조

전체가 `index.html` 단일 파일 869줄이다. 백엔드·DB·API·인증이 **존재하지 않는다.**

| 구간 | 내용 |
|---|---|
| L10–216 | `<style>` 인라인 CSS |
| L219–257 | 3개 화면 (`screen-start` / `screen-quiz` / `screen-result`) |
| L260 | `const DATA` — 트랙 2종 × (axes, questions, profile_inputs, flags, types 16) |
| L261 | `const PROFILES` — 32유형 강점/약점/맹점 콘텐츠 |
| L262 | `const GUIDES` — 32유형 활용 가이드 |
| L263–319 | `scoreTrack()` 채점 엔진 |
| L353–354 | `state` 전역 (track, steps, stepIndex, answers, profile) |
| L384–444 | 설문 진행 / `finishQuiz()` |
| L492–586 | `renderResult()` |
| L604–712 | **`computeSearchCriteria()`** — 검색조건 산출 |
| L714–799 | 검색조건 카드 렌더 / JSON 내보내기 |
| L819–862 | `saveToURL()` / `tryRestore()` — URL base64 + localStorage |

배포는 GitHub Pages 정적 호스팅. README가 "설치 불필요, 단일 파일"을 기능으로 명시하고 있고 `file://`로 직접 열리므로, **ES module 분할은 CORS로 file:// 실행을 깨뜨린다.** 단일 파일 유지가 제약이다.

### 1.2 현재 "모델"의 실체

```
DATA.gyeongmae = {
  axis_order: ['FUND','DIFFICULTY','REGION','PURPOSE'],
  axes:       [ {id, label, pole_a{code,label,desc}, pole_b{...}, default_pole} × 4 ],
  questions:  [ {id, axis, text, options[{label, score{poleCode:n}}]} × 10 ],
  profile_inputs: [ fund_size, purpose, region_pref, ownership, experience, region_regulated ],
  flags:      [ {when:{...}, level:'danger|warn|info', message} × 13 ],
  types:      [ {code:'A-scnr', name, keywords[], summary, rare?} × 16 ]
}
```

`scoreTrack()`은 `questions`와 `profile_inputs`의 점수를 **하나의 tally에 합산**해 축 극(pole)을 정한다.

### 1.3 문제점

**P1 — 체질과 검색값이 같은 축에 섞여 있다.**
경매 4축 중 `FUND`(자금규모)와 `REGION`(지역범위)은 투자 체질이 아니라 **매번 바뀌는 검색 조건**이다. 축 정의 레벨에서 두 레이어가 뒤섞여 있다.

**P2 — 검색값이 채점 엔진을 오염시킨다.**
`scoreTrack()` L278–285에서 `profile_inputs`(자금·지역·용도)의 `score`가 성향 문항 점수와 **같은 tally에 합산**된다. 즉 "이번에 자금이 5천만원"이라는 일시적 조건이 "이 사람은 소액분산형 체질"이라는 영구적 판정을 바꾼다.

**P3 — 검색값 모델이 아예 없다.**
`computeSearchCriteria(r, sido, sigungu)` (L604) 시그니처가 증거다. 시·군·구를 담을 자리가 모델에 없어서 **함수 인자로 따로 새어 들어오고**, 실제 값은 결과화면 DOM(`#sc-sido`, `#sc-sigungu`)에만 존재한다. 새 검색차원을 추가할 때마다 인자와 DOM이 함께 늘어나는 구조다.

**P4 — MBTI가 후처리 규칙이 아니라 값 생성기다.**
L604–712 한 함수 안에서 축 판정 + 규제 계산 + 가격 산출 + 자산유형 결정 + 메모 작성이 전부 일어난다. 108줄짜리 하드코딩 분기이며, "안전형이면 선순위 임차인 제외" 같은 **규칙을 규칙으로 표현할 자리가 없다.**

**P5 — 저장 단위가 "1회 진단 결과" 하나뿐이다.**
`localStorage['rmbti_last']`에 **단수 payload**만 저장된다. 프리셋 다건 저장·재사용·수정 구조가 없다.

**P6 — 최저가율(최저가/감정가) 차원이 없다.**
현재 9개 차원에 감정가 대비 비율이 없다. courtauction 사이트 필터에도 없으므로 결과 후처리로 구현해야 한다.

**P7 — DB 연결 접점이 없다.**
`auction_item`·`market_comps` 등과 붙일 때 필요한 컬럼명/타입/제약이 어디에도 선언돼 있지 않다.

---

## 2. 새 2레이어 구조

```
┌─ Layer 1: InvestorProfile (체질) ──────────────────┐
│  잘 안 바뀜. 설문으로 1회 산출 후 재사용.           │
│  4축 → 제외규칙 / 가중치 / 추천·비추천 스타일       │
│  ※ 직접 검색값을 만들지 않는다                     │
└────────────────────┬──────────────────────────────┘
                     │ 프리셋(preset) 역할
                     ▼
┌─ Layer 2: FilterMode (이번 검색조건) ──────────────┐
│  매번 바뀜. 저장 가능한 프리셋 다건.                │
│  예산·지역·자산유형·유찰수·최저가율·규제·주체·목적   │
└────────────────────┬──────────────────────────────┘
                     ▼
        buildSearchQuery(profile, filterMode)
                     ▼
   { query, exclusions, weights, postFilters, rationale }
                     ▼
        향후: auction_item DB / 자동검색 / 알림
```

**역할 분리 원칙**

| | Layer 1 InvestorProfile | Layer 2 FilterMode |
|---|---|---|
| 변경 주기 | 드묾 (체질) | 매 검색 |
| 산출물 | 제외규칙·가중치·스타일 | 실제 쿼리 파라미터 |
| 개수 | 사용자당 1 | 사용자당 N (프리셋) |
| 검색값 보유 | **없음** | 전부 |

### 2.1 축 재정의 (P1 해소)

현재 4축 중 2축이 검색값이므로 재배치한다.

| 현재 축 | 판정 | 이동처 |
|---|---|---|
| `FUND` 자금 s/b | 검색값 | → Layer 2 `budget_min/max` |
| `REGION` 지역 n/w | 검색값 | → Layer 2 `region_json` |
| `DIFFICULTY` 난이도 c/x | **체질** | → Layer 1 `RIGHTS` |
| `PURPOSE` 용도 r/f | 혼재 | → Layer 1 `PROFIT` + `HORIZON`로 분리 |

**신규 Layer 1 4축** (코드 prefix `IP-`)

| 축 | pole_a | pole_b | 출처 |
|---|---|---|---|
| `RIGHTS` 권리 | `S` 권리안정형 | `R` 권리감수형 | 기존 DIFFICULTY 문항 재사용 |
| `EVICTION` 명도 | `A` 명도회피형 | `E` 명도실행형 | **신규 문항 필요** |
| `PROFIT` 수익 | `C` 현금흐름형 | `G` 차익형 | PURPOSE 일부 + 신규 문항 |
| `HORIZON` 기간 | `L` 장기보유형 | `T` 단기회전형 | PURPOSE 일부 + 신규 문항 |

예시 코드: `IP-SACL` (권리안정·명도회피·현금흐름·장기보유), `IP-REGT` (권리감수·명도실행·차익·단기회전)

**16유형 콘텐츠를 새로 쓰지 않는다.** 각 **극(pole)** 이 규칙 조각을 들고, 조합 시 합성한다. 이게 요청서의 "MBTI는 프리셋 역할"에 정확히 대응하며 16×콘텐츠 조합폭발을 피한다.

```js
RIGHTS.pole_a /* S 권리안정형 */ = {
  exclusions: ['유치권','법정지상권','지분매각','대지권미등기','선순위임차인'],
  weights:    { rights_clean: +3, has_special_condition: -5 },
  recommend:  ['말소기준권리 이하 전부 소멸 물건'],
  avoid:      ['권리 쟁점 2개 이상 물건']
}
```

합성 = 제외규칙 **합집합** + 가중치 **합산**.

### 2.2 하위호환 — 파생 + 미니설문 (제약 1·2 대응)

기존 32유형(`A-scnr` 등)의 `PROFILES`/`GUIDES` 콘텐츠는 **그대로 유지**한다.
`InvestorProfile`은 `legacy_code`에 기존 코드를 계속 담고, 결과화면(화면 A)은 지금처럼 렌더하며 신규 축은 그 **아래 섹션으로 추가**된다.

신규 4축의 값은 두 경로로 채운다.

| 축 | 파생 경로 (메인 설문 재해석) | 미니설문 |
|---|---|---|
| `RIGHTS` | 경매 `DIFFICULTY` c→S / x→R · 매매 `RISK` S→S / A→R | — |
| `PROFIT` | 경매 `PURPOSE` + `purpose` 입력(rent→C, flip→G) · 매매 `BASIS`+`CAPITAL` | ip4 |
| `HORIZON` | 경매 `PURPOSE` r→L / f→T · 매매 `HORIZON` H→L / T→T | ip5 |
| `EVICTION` | **파생 불가** (약한 사전값만: `DIFFICULTY`=x, `experience`) | ip1·ip2·ip3 |

미니설문 5문항은 **메인 설문에 합류시키지 않는다.** 별도 화면(`screen-mini`)에서 검색조건을 만들 때 선택적으로 묻는다. 따라서:

- 기존 경매 10문항 / 매매 16문항은 **한 글자도 바뀌지 않았다**
- 기존 공유 URL(`?r=`)은 **그대로 같은 결과를 낸다**
- 미측정 축은 `axis_coverage`에 `unmeasured`로 표시되고 화면에 경고가 뜬다 — 조용히 기본값을 쓰지 않는다

`axis_coverage` 값: `measured`(미니설문 직접 측정) / `derived`(기존 답변에서 파생) / `unmeasured`(기본값).

---

## 3. 스키마

### 3.1 InvestorProfile (Layer 1)

| 필드 | 타입 | 비고 |
|---|---|---|
| `id` | string(uuid) | 클라 생성 |
| `user_id` | string\|null | **현재 null 고정**, 인증 도입 시 채움 |
| `schema_version` | int | 마이그레이션용 |
| `mbti_code` | string | `IP-SACL` |
| `rights_axis` | `'S'\|'R'` | |
| `eviction_axis` | `'A'\|'E'` | |
| `profit_axis` | `'C'\|'G'` | |
| `horizon_axis` | `'L'\|'T'` | |
| `risk_preferences_json` | object | 합성된 `{exclusions[], weights{}, recommend[], avoid[]}` |
| `label` | string | 합성 별명 |
| `description` | string | 합성 설명 |
| `legacy_track` | `'maemae'\|'gyeongmae'` | 하위호환 |
| `legacy_code` | string | `A-scnr` — 기존 콘텐츠 렌더용 |
| `answers_json` | object | 재채점용 원본 응답 |
| `created_at` / `updated_at` | ISO8601 | |

**불변식:** 이 레코드에는 예산·지역·자산유형이 **들어가지 않는다.** (P1 재발 방지)

### 3.2 FilterMode / SearchPreset (Layer 2)

| 필드 | 타입 | courtauction | 비고 |
|---|---|---|---|
| `id` | string(uuid) | | |
| `user_id` | string\|null | | 현재 null |
| `investor_profile_id` | string\|null | | Layer 1 참조 |
| `schema_version` | int | | |
| `name` | string | | "경기 아파트 단기매매형" |
| `budget_min` / `budget_max` | int(원) | | **내 가용 자금** (자기자본+대출) |
| `min_price_min` / `min_price_max` | int(원) | ✅ 필터 | **물건 최저매각가** 검색범위. budget에서 유도, 수동 override 가능 |
| `region_json` | `{sido, sigungu[], scope}` | ✅ 필터 | |
| `asset_types_json` | string[] | ✅ 필터 | 아파트/빌라/오피스텔/상가/토지/근생/다가구 |
| `fail_count_min` / `fail_count_max` | int | ✅ min만 | max는 후처리 |
| `min_discount_ratio` / `max_discount_ratio` | float 0~1 | ❌ | **최저가/감정가** — 결과 후처리 (P6) |
| `area_min_m2` / `area_max_m2` | int | ✅ 필터 | |
| `regulation_mode` | `include\|exclude\|only\|unknown` | ❌ | 후처리 + region 조정 |
| `entity_type` | `individual\|corp` | ❌ | 세금·대출 계산 입력 |
| `housing_status` | `none\|one\|multi` | ❌ | 세금·대출 계산 입력 |
| `investment_goal` | `reside\|flip\|hold\|rental\|redev\|land_comp` | ❌ | 자산유형 기본값·가중치 |
| `ops_mode` | `passive\|semi\|active` | ❌ | 운영 개입도 → 명도·특수물건 허용도 |
| `extra_cost_tolerance` | `low\|mid\|high` | ❌ | 명도비·유치권합의·수리비 허용도 |
| `is_saved_preset` | bool | | false=임시 작업본 |
| `created_at` / `updated_at` | ISO8601 | | |

**`budget` vs `min_price` 구분이 중요하다.** budget은 내가 넣을 수 있는 돈, min_price는 물건의 최저매각가. 현재 `computeSearchCriteria()`의 `equity × LTV배수 × 보수계수` 로직(L613–633)이 정확히 budget→min_price 변환기이며, 이를 **유도 함수**로 보존하되 사용자가 결과를 덮어쓸 수 있게 한다.

### 3.3 필드 정의는 선언적 스키마로 (제약 3)

하드코딩 대신 `FILTER_MODE_SCHEMA` 배열에 `{key, type, label, options[], default, site_filterable, db_column, group}`을 선언하고, **입력 폼·검증·쿼리 빌더·JSON 내보내기가 전부 이 하나를 읽는다.** 차원 추가 = 배열에 항목 하나 추가.

---

## 4. 병합 엔진

```js
buildSearchQuery(profile, filterMode) → {
  query:       { /* courtauction에 그대로 넘길 필터 */ },
  exclusions:  [ /* profile이 강제하는 제외 규칙 */ ],
  postFilters: [ /* 사이트로 못 거르는 후처리 (최저가율·규제지역 등) */ ],
  weights:     { /* 랭킹 가중치 */ },
  rationale:   [ /* 왜 이 값이 됐는지 — 감사 추적 */ ]
}
```

**적용 순서 (요청서 5번)**

1. FilterMode → `query` 기본값 채움
2. Profile `exclusions` → `query.special_conditions`에서 제외 (예: `RIGHTS=S` → 선순위임차인 제외)
3. `EVICTION=A` → 점유미상·명도난이도 높음 제외
4. `HORIZON=L` → 재개발 플래그 가점 (`weights.redev += 3`)
5. `ops_mode` / `extra_cost_tolerance`가 profile 규칙을 **완화/강화** (이번 검색에 한해)
6. 모든 결정을 `rationale[]`에 기록

**충돌 규칙:** Layer 2(이번 검색)가 Layer 1(체질)을 override할 수 있되, override 시 `rationale`에 경고를 남긴다. 예: 권리안정형인데 `ops_mode=active`로 특수물건을 허용하면 "체질과 다른 선택"을 표시.

---

## 5. 저장 / 마이그레이션 (제약 1)

백엔드가 없으므로 localStorage를 **DB 테이블처럼** 쓰되, 컬럼명을 미래 DB와 1:1로 맞춘다.

```
localStorage['rmbti.v2.profiles']  → InvestorProfile[]
localStorage['rmbti.v2.presets']   → FilterMode[]
localStorage['rmbti.v2.meta']      → { schema_version }
localStorage['rmbti_last']         → (레거시, 읽기 전용 보존)
```

**마이그레이션 경로**

1. 앱 시작 시 `rmbti.v2.meta` 없음 + `rmbti_last` 있음 → 레거시 감지
2. `rmbti_last`의 답안을 `scoreTrack()`으로 재채점 → `legacy_code` 확보
3. 축 파생 규칙으로 신규 4축 유도, `EVICTION`은 미응답이므로 `default_pole` + **"미측정" 플래그**
4. `InvestorProfile` 1건 생성, `rmbti_last`는 **삭제하지 않는다** (롤백 가능)
5. URL `?r=` 공유링크는 **기존 포맷 그대로 계속 동작** — `tryRestore()` 유지

레포지토리 계층(`ProfileStore`/`PresetStore`)을 두어 `list/get/save/remove` 인터페이스만 노출한다. 나중에 내부를 `fetch('/api/...')`로 바꾸면 호출부는 무변경.

---

## 6. 영향 범위

### 프론트

| 대상 | 변경 |
|---|---|
| `screen-start` | 진입 분기 추가 (진단하기 / 바로 검색하기 / 프리셋) |
| `screen-quiz` | **거의 무변경.** 신규 축 문항만 `questions`에 추가 |
| `screen-result` (화면 A) | 기존 유지 + 신규 4축 섹션 + "검색조건 만들기 →" CTA |
| `screen-filter` (화면 B) | **신규** — FilterMode 입력 폼 (스키마 기반 자동 생성) |
| `screen-presets` (화면 C) | **신규** — 프리셋 목록/저장/수정/재사용 |
| `computeSearchCriteria()` | **레거시 어댑터로 강등** — FilterMode 기본값 시딩용 |
| 검색조건 카드 | `buildSearchQuery()` 결과를 렌더하도록 교체 |

### 백엔드

현재 없음. 이번 작업에서 **신설하지 않았다.** 대신 JSON Schema로 계약만 확정해, 향후 `auction_item` / `market_comps` / `auction_document` / `analysis_result` 연결 시 컬럼 매핑이 이미 정해져 있게 했다.

| 파일 | 내용 |
|---|---|
| `_workspace/05_investor_profile.schema.json` | Layer 1 · 18속성 · `x-db-table: investor_profile` |
| `_workspace/05_filter_mode.schema.json` | Layer 2 · 26속성 · `x-db-table: filter_mode` |

두 파일은 **손으로 쓰지 않는다.** `_workspace/tools/gen_schema.js`가 앱 안의 `IP_AXES` / `FM_FIELDS` 선언에서 파생시키므로, 코드와 스키마가 어긋날 수 없다. 각 속성에 `x-db-column`(DB 컬럼명)과 `x-site-filterable`(courtauction 직접 필터 여부)을 실어 두었고, Layer 1에는 `x-forbidden-keys`로 **검색값이 들어오면 안 되는 키 목록**을 명시해 P1 재발을 막는다.

### UX 방향 (요청서)

MBTI는 **배경 설정**, 실제 검색은 FilterMode 화면. 따라서 진단을 아직 안 한 사용자도 **화면 B로 바로 진입 가능**해야 하며, 이때 profile은 "미설정"으로 두고 제외규칙 없이 순수 필터만 적용한다.

---

## 7. 검증 방법

1. **회귀:** 기존 `?r=` 공유 URL 3건이 개편 전후 **동일한 결과화면**을 렌더하는지
2. **골든:** `04_search_criteria.json`의 `golden` 케이스 3건(G1~G3)이 레거시 어댑터 경로에서 기존과 동일한 9개 차원을 산출하는지
3. **레이어 격리:** `InvestorProfile` 레코드에 예산/지역 키가 존재하지 않음을 단정
4. **불변식:** FilterMode만 바꾸고 Profile 고정 시 `mbti_code`가 변하지 않음 (P2 해소 확인)
5. **마이그레이션:** 레거시 `rmbti_last`가 있는 상태로 로드 → Profile 1건 생성 + 레거시 키 보존
6. **프리셋 왕복:** 저장 → 재로드 → `buildSearchQuery()` 출력이 저장 시점과 동일
7. **스키마 왕복:** FilterMode → JSON → 파싱 → 동일 객체

단일 HTML 제약상 별도 테스트 러너를 붙이지 않고, `?selftest=1` 진입 시 위 단정을 실행해 화면에 리포트하는 인라인 하네스로 구현한다.

### 실행 방법

```bash
# 1) 브라우저 — 앱 안에서 바로
#    index.html 을 열고 URL 뒤에 ?selftest=1
#    (예: http://127.0.0.1:8731/index.html?selftest=1)

# 2) CI/헤드리스 — Node 스텁 하네스 (브라우저 없이, 실패 시 exit 1)
node _workspace/tools/selftest_node.js 부동산투자성향테스트.html

# 3) JSON Schema 재생성 (스키마는 손으로 쓰지 않고 코드에서 파생시킨다)
node _workspace/tools/gen_schema.js 부동산투자성향테스트.html _workspace
```

### 검증 결과 (2026-07-25)

셀프테스트 **15/15 통과** (Node 하네스 + 실제 Chrome 양쪽). 추가로 E2E 수동 검증:

| 검증 | 결과 |
|---|---|
| 경매 설문 16스텝 완주 → 결과화면 | `A-scnr` 렌더 + `IP-SACL` 섹션 병존, 「경매 활용 가이드」 유지 |
| v1 사용자 마이그레이션 | `A-bcnf` → `IP-SEGT` 생성, 검색값 유입 0건, 레거시 키 보존, 재실행 시 중복 생성 없음(멱등) |
| 미니설문 5문항 | `EVICTION` coverage `derived` → `measured` 승격 |
| 화면 B | 6그룹 21필드 렌더, 레거시 어댑터 시딩(최저가 상한 7,500만 = 5천만 × LTV1.67 × 0.9) |
| 쿼리 생성 (`IP-SEGT` 기준) | 제외 7건 · 후처리 8건 · 가중치 9개 · 근거 5줄, JSON 내보내기 정상 |
| 화면 C | 프리셋 저장 → 목록 → 재로드 왕복 정상 |

---

## 8. 단계별 실행 순서 — 전부 완료

| 단계 | 내용 | 기존 동작 영향 | 상태 |
|---|---|---|---|
| S1 | 스키마 선언 + 스토어 계층 + 마이그레이션 | 없음 (추가만) | ✅ |
| S2 | `buildSearchQuery()` + 레거시 어댑터 | 없음 | ✅ |
| S3 | 화면 B (FilterMode 입력) | 없음 (신규 화면) | ✅ |
| S4 | 화면 C (프리셋) | 없음 (신규 화면) | ✅ |
| S5 | 신규 4축 **미니설문**(분리) + 결과화면 섹션 추가 | 화면 A에 섹션 추가 | ✅ |
| S6 | 검색 카드를 `buildSearchQuery()` 주 경로로 전환 | 레거시 카드는 「간이 추천」으로 병존 | ✅ |
| S7 | 셀프테스트 하네스 (`?selftest=1` + Node) | 없음 | ✅ |

S6에서 기존 `computeSearchCriteria()` 카드를 **삭제하지 않았다.** `00_regulations.md`에 근거를 둔 규제 메모가 붙어 있어 정보 손실이 크기 때문이다. 「간이 추천 · 레거시 규칙」으로 라벨링해 남기고, 주 경로는 `buildSearchQuery()`로 옮겼다. 같은 함수는 `seedFilterModeFromLegacy()`에서 FilterMode 기본값 생성기로도 재사용된다.

---

## 9. 향후 연결 지점

이번 작업에서 백엔드를 신설하지 않았으므로, 연결 시 참고할 접점만 정리한다.

| 대상 | 접점 |
|---|---|
| `auction_item` | `buildSearchQuery().query` → WHERE 절, `.postFilters` → 애플리케이션 레벨 필터 |
| 랭킹 | `.weights` → 물건 피처(`rights_clean`, `discount_ratio`, `vacant`, `redev_flag` …)와 내적 |
| `market_comps` | `min_price_max`는 검색 상한일 뿐 — 낙찰 상한선은 시세 역산으로 별도 산출 필요 |
| `auction_document` | `exclusions`의 특수조건은 매각물건명세서·현황조사서 파싱 결과와 대조 |
| `analysis_result` | `_meta.investor_profile_id` + `filter_mode_id`로 분석 이력 추적 |
| 자동검색·알림 | `is_saved_preset=true`인 FilterMode가 스케줄 실행 단위. `updated_at` 이후 신규 물건만 push |

**스토어 교체 경로:** `makeStore()`의 `list/get/save/remove` 내부만 `fetch('/api/...')`로 바꾸면 호출부는 무변경이다.
