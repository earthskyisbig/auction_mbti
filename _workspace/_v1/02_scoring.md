# 채점 로직 (02_scoring.md)

> 데이터 계약: `02_maemae.json`, `02_gyeongmae.json`. 본 문서는 web-builder가 동일하게 JS로 구현하고 QA가 재현 검증하는 **결정적(deterministic) 채점 규칙**이다. 모호함 없이 따른다.
>
> **스키마 v1.1 변경점(규제 경고 반영)**: 매매·경매 양 트랙 profile_inputs에 `region_regulated`(규제/비규제/모름)를 추가했고, 매매에는 `ownership`도 추가했다. 이들은 **축 점수 0점**(flags 평가 전용)이라 유형 코드 체계·축·기존 문항은 불변이다. 매매 트랙에 `flags[]`가 신설됐다. 자세한 규제 flag 규칙은 §4-1, 골든 케이스는 §5(GC-4/GC-5) 참조.

---

## 0. 코드 체계 (01_typology.md 고정 계약)

| 트랙 | 접두 | 축 순서(고정) | 극 코드 |
|---|---|---|---|
| 매매 | `M-` | RISK → HORIZON → BASIS → CAPITAL | S/A · H/T · R/P · G/E (대문자) |
| 경매 | `A-` | FUND → DIFFICULTY → REGION → PURPOSE | s/b · c/x · n/w · r/f (소문자) |

유형 코드 = 접두 + (축 순서대로 우세 극 코드). 예: `M-SHRG`, `A-scnr`.

---

## 1. 점수 집계 (축별 합산)

1. 각 축마다 두 극의 점수 누적기를 0으로 시작한다.
2. **일반 문항(questions)**: 사용자가 고른 선택지의 `score` 객체 `{극코드: 점수}`를 해당 축 누적기에 더한다. 일반 문항은 모두 한 극에 **+2**.
3. **경매 profile_inputs**: `axis` 필드가 있는 입력(투자자금→FUND, 투자용도→PURPOSE, 투자지역→REGION, 경매경험→DIFFICULTY)은 선택지의 `score`를 같은 방식으로 해당 축에 더한다. profile 점수는 **+2 또는 +1**(graduated), 중급(`inter`) 등 빈 `score:{}`는 0점.
   - `axis` 필드가 없는 입력(주택보유상황 `ownership`, 규제지역여부 `region_regulated`)은 **점수 기여 없음** — 순수 개인화·규제판정 변수.
4. profile_inputs의 선택값(`value`)은 **점수와 무관하게 `profile` 객체로 따로 저장**한다(개인화 플래그·가이드용). 두 역할(축 기여 / 개인화 저장)은 분리된다.
5. **매매 트랙 profile_inputs(v1.1 신설)**: 매매는 `ownership`·`region_regulated` 두 입력만 가지며 **둘 다 `axis` 없음 → 축 점수 0점**. 즉 매매의 유형 코드는 일반문항 16개로만 결정되고, 규제 입력은 오직 flags 평가에만 쓰인다(유형 체계 불변).

### 축별 측정 항목 수 (균형 확인)
| 트랙·축 | 일반문항 | profile | 합계 |
|---|---|---|---|
| 매매 RISK / HORIZON / BASIS / CAPITAL | 각 4 | 0 (ownership·region_regulated은 축 0점) | 각 4 |
| 경매 FUND | 2 | 1(투자자금) | 3 |
| 경매 DIFFICULTY | 3 | 1(경매경험, 약기여) | 4 |
| 경매 REGION | 2 | 1(투자지역) | 3 |
| 경매 PURPOSE | 3 | 1(투자용도) | 4 |

모두 3~5 범위 — 단일 문항 편향 없음.

---

## 2. 우세 극 결정 + 동점 처리 (tie-break)

각 축에서 `pole_a` 점수와 `pole_b` 점수를 비교한다.

- **pole_a > pole_b** → `pole_a.code` 채택
- **pole_b > pole_a** → `pole_b.code` 채택
- **동점(pole_a == pole_b)** → 해당 축의 **`default_pole`**(= 축 정의의 첫 번째 극, 매매 S/H/R/G · 경매 s/c/n/r)을 채택하고, 그 축을 **경계형(borderline)** 으로 표시한다.

`default_pole` 값(JSON에 명시):
| 트랙 | 축 | default_pole |
|---|---|---|
| 매매 | RISK / HORIZON / BASIS / CAPITAL | S / H / R / G |
| 경매 | FUND / DIFFICULTY / REGION / PURPOSE | s / c / n / r |

경계형 축은 결과 화면에서 "이 축은 거의 반반이었어요"식으로 표기할 수 있도록 web-builder에 `borderline_axes: [축id...]` 배열로 전달한다(코드 자체는 default_pole로 확정).

---

## 3. 유형 코드 조합

`axis_order` 순서대로 각 축의 우세 극 코드를 이어 붙이고, 트랙 접두를 앞에 둔다.

```
maemae:    "M-" + RISK + HORIZON + BASIS + CAPITAL      // 예: "M-SHRE"
gyeongmae: "A-" + FUND + DIFFICULTY + REGION + PURPOSE  // 예: "A-bxwf"
```

이 코드로 `types[]`에서 객체를 찾아 결과(name/keywords/summary)를 렌더링한다. 16조합은 모두 `types[]`에 존재하므로 미스가 발생할 수 없다.

---

## 4. 경매 개인화 플래그 (profile 기반 경고/안내)

채점 후, `profile`(보유상황·용도·자금·지역·경험)과 **확정된 유형 코드/축 극**을 입력으로 `flags[]` 규칙을 평가한다. `when` 객체의 **모든** 조건이 충족되면 해당 플래그를 결과에 노출한다(AND 결합). 여러 플래그가 동시에 켜질 수 있다.

`when` 키 해석:
- `ownership` / `purpose` / `fund_size` / `region_pref` / `experience` / `region_regulated` → 저장된 `profile.<id>`의 `value`와 일치 비교.
- `axis_FUND` / `axis_DIFFICULTY` / `axis_CAPITAL` / ... → **확정된 그 축의 우세 극 코드**와 일치 비교.
- `type_code` → **확정된 유형 코드**와 일치 비교.

`level`: `info`(안내) < `warn`(주의) < `danger`(강경고). 결과 화면에서 색·아이콘 강도로 구분. **복수 플래그가 동시에 켜지면 level 순(danger→warn→info)으로 정렬해 표시**한다.

평가해야 할 규칙(요약, 정확한 문구는 JSON `flags[]`):
| 조건 | level | 취지 |
|---|---|---|
| ownership=multi & purpose=flip | warn | 다주택 단기매각 → 양도세 중과 |
| ownership=multi & purpose=rent | warn | 다주택 추가 보유 → 취득세 중과·종부세 |
| ownership=multi & purpose=reside | warn | 다주택 실거주 취득도 중과 영향 |
| ownership=none & purpose=reside | info | 생애최초 감면·대출우대 / 실거주 의무 확인 |
| experience=novice & axis_DIFFICULTY=x | **danger** | 초보가 특수물건 → 강경고 |
| axis_FUND=s & axis_DIFFICULTY=x | warn | 소액+특수 자금-난이도 충돌, 예비비 |
| type_code=A-sxwf | **danger** | 소액·특수·전국·단타 과욕 패턴 |
| type_code=A-bcwf | info | 대액을 안전물건 단타에 → 자본 비효율 |

> 위 8개는 v1.0 기존(세금·경험·과욕 패턴) 플래그로 **유지**한다. v1.1에서 규제(대출·규제지역) 플래그를 추가했다 → §4-1.

---

## 4-1. 규제 경고 플래그 (v1.1 신설 — `00_regulations.md` grounding 근거)

> **출처 원칙**: 모든 규제 수치는 `_workspace/00_regulations.md`(출처·신뢰도 표기 grounding 문서)만 근거로 한다. 기억으로 쓰지 않는다. grounding이 `[불확실]`로 둔 항목은 문구에 "확인 필요"를 넣어 단정하지 않는다.
>
> **평가 방식**: §4와 동일. `when`의 모든 조건 AND 결합, 복수 동시 노출 허용, level(danger→warn→info) 정렬. `region_regulated`는 `profile` 비교 키, `axis_CAPITAL` 등은 확정 극 비교 키.

### 매매 트랙 규제 플래그 (`02_maemae.json > flags[]`, 7개)
| 조건(AND) | level | 취지 | 근거(00_regulations.md) |
|---|---|---|---|
| ownership=none & region_regulated=regulated | info | 규제지역 무주택 LTV 40%+6개월 전입의무(생애최초 70%)·DSR 40% | A-2 / B-1 |
| ownership=one & region_regulated=regulated | warn | 1주택 추가구입 미처분 시 주담대 금지(LTV 0%) 가능, 처분조건부 LTV는 **확인 필요** | A-1 / B-1[불확실] |
| ownership=multi & region_regulated=regulated | **danger** | 다주택 규제지역 추가구입 주담대 전면 금지(LTV 0%) | A-1 / B-1 |
| ownership=multi & region_regulated=regulated | warn | 취득세 8~12% 중과 + 양도세 +20~30%p 중과 가능(중과 한시배제 종료/연장 **확인 필요**) | B-2 / B-3[불확실] |
| region_regulated=regulated | warn | 토허: 2년 실거주·갭투자 차단·자금조달계획서 의무 | A-3 / B-4 |
| axis_CAPITAL=G & region_regulated=regulated | info | 레버리지 성향인데 규제지역 LTV 40%·6억 한도·DSR 40%로 차입 제한 | B-1 / A-3 |
| region_regulated=unknown | info | 규제 여부부터 국토부 페이지에서 확인 권고 | E |

### 경매 트랙 규제 플래그 (`02_gyeongmae.json > flags[]`에 5개 추가, 기존 8개 뒤)
| 조건(AND) | level | 취지 | 근거(D절 중심) |
|---|---|---|---|
| region_regulated=regulated | warn | **(a) 대출규제 동일 적용**: 경락잔금대출도 규제지역 LTV·다주택 금지·DSR 40% → 자금계획 경고(금융사별 취급기준 **확인 필요**) | D / A-1 |
| region_regulated=regulated | info | **(b) 토허 면제**: 경매는 2년 실거주·갭투자차단·자금조달계획서 면제(규제 회피 가능) → 단 수요 쏠림으로 **고가낙찰 주의** | D |
| ownership=multi & region_regulated=regulated | **danger** | 다주택 규제지역 추가낙찰 → 경락대출도 LTV 0% 적용 가능(금융사 **확인 필요**) | D / A-1 |
| ownership=none & region_regulated=regulated | info | 규제지역 무주택 경락대출 LTV 40%+전입의무 가능, 단 토허 실거주의무는 면제 | A-2 / D |
| region_regulated=unknown | info | 물건 소재지 규제 여부부터 확인 권고 | E |

> **경매 (a)/(b) 분리 원칙(D절 핵심)**: 규제지역 경매는 "대출은 규제 동일(경고)"과 "토허·실거주 의무는 면제(안내)"를 **반드시 두 갈래로 분리** 표시한다. 한쪽만 보여주면 오해를 부른다.
>
> **신뢰도 전파 점검**: `[불확실]` 항목 — 처분조건부 1주택 LTV(B-1), 다주택 양도세 중과 한시배제 종료(B-3), 6·30 신규지정 범위(A-5), 경락대출 금융사별 취급(D) — 은 모두 문구에 "확인 필요/금융기관 확인"을 포함했다. 6·30 신규지정 지역(구리·동탄·기흥)을 단정적으로 "규제지역이다"라고 박지 않고, 사용자가 `region_regulated`를 직접 선택하게 하여 grounding 불확실성을 우회한다.

---

## 5. 골든 케이스 (QA·web-builder 재현 검증 기준 — 실제 계산으로 검증됨)

아래 케이스는 위 규칙을 코드로 돌려 산출을 확인한 값이다. JS 구현이 동일 입력에 동일 출력을 내야 한다. GC-1~3은 v1.0 기존 케이스로 **유지**, GC-4~5는 v1.1 규제 플래그 검증용 신규 케이스다.

### GC-1 · 매매 → `M-SHRE` (현금 실속 거주형)
모든 답을 안정/장기/실거주/자기자본 쪽으로 선택.
- 입력: q1=확정후진입(S), q2=검증동네(S), q3=버틴다(S), q4=손실축소(S) / q5=5년+(H), q6=계속보유(H), q7=비과세활용(H), q8=시간트리거(H) / q9=내가살수있는곳(R), q10=생활조건(R), q11=한채지키기(R), q12=거부감(R) / q13=한채안전(E), q14=갭피함(E), q15=안흔들림(E), q16=보수적(E)
- 집계: RISK S8/A0→**S** · HORIZON H8/T0→**H** · BASIS R8/P0→**R** · CAPITAL G0/E8→**E**
- **결과: `M-SHRE`**, borderline 없음.

### GC-2 · 매매(동점 케이스) → `M-ATPG` (고위험 회전 트레이더)
공격/단기/순수투자로 일관, 자금 축만 레버리지·자기자본 2:2 동점.
- 입력: RISK 4문항 모두 A / HORIZON 4문항 모두 T / BASIS 4문항 모두 P / CAPITAL → q13=레버두채(G), q14=갭적극(G), q15=신경쓰임(E), q16=보수적(E)
- 집계: RISK A8→**A** · HORIZON T8→**T** · BASIS P8→**P** · CAPITAL **G4/E4 동점 → default_pole G** (CAPITAL = borderline)
- **결과: `M-ATPG`**, `borderline_axes: ["CAPITAL"]`.

### GC-3 · 경매(profile+플래그) → `A-bxwf` (전업 특수물건 전문가)
- 일반문항: g1=집중(b), g2=집중(b) / g3=복잡물건(x), g4=적극도전(x), g5=감수(x) / g6=추적(w), g7=원격(w) / g8=되팔기(f), g9=단기(f), g10=매각(f)
- profile: 투자자금=3억이상(b+2), 투자용도=단기매각(f+2 / value=flip), 투자지역=전국(w+2 / value=nation), 주택보유=다주택(value=multi, 점수0), 경매경험=숙련(x+1 / value=expert)
- 집계: FUND s0/b6→**b** · DIFFICULTY c0/x7→**x** · REGION n0/w6→**w** · PURPOSE r0/f8→**f**
- **결과: `A-bxwf`**, borderline 없음.
- **켜지는 플래그**:
  - `ownership=multi & purpose=flip` → **warn**: 다주택 단기매각 양도세 중과.
  - `axis_FUND=s & axis_DIFFICULTY=x` → 미발동(FUND가 b이므로).
  - `experience=novice & axis_DIFFICULTY=x` → 미발동(숙련이므로). → 이 케이스는 양도세 경고 1건만 노출.
  - 규제 플래그: `region_regulated`를 grounding 케이스(GC-3 원본)에서는 응답하지 않은 것으로 보아 미발동.

### GC-4 · 매매(규제 플래그) → `M-ATPG` (고위험 회전 트레이더) + 다주택·규제지역
공격/단기/순수투자/레버리지로 일관(자금 축 q13~16 모두 G), 규제 입력은 다주택·규제지역.
- 일반문항: RISK 4문항 A / HORIZON 4문항 T / BASIS 4문항 P / CAPITAL 4문항 모두 G
- profile: ownership=multi, region_regulated=regulated (둘 다 축 0점)
- 집계: RISK A8→**A** · HORIZON T8→**T** · BASIS P8→**P** · CAPITAL G8→**G**
- **결과: `M-ATPG`**, borderline 없음.
- **켜지는 플래그(level 정렬, 4건)**:
  1. `ownership=multi & region_regulated=regulated` → **danger**: 규제지역 다주택 추가구입 주담대 금지(LTV 0%).
  2. `ownership=multi & region_regulated=regulated` → **warn**: 취득세 8~12% + 양도세 +20~30%p 중과 가능(한시배제 종료/연장 확인 필요).
  3. `region_regulated=regulated` → **warn**: 토허 2년 실거주·갭투자 차단·자금조달계획서.
  4. `axis_CAPITAL=G & region_regulated=regulated` → **info**: 레버리지 성향 vs 규제지역 차입 제한.
- 의미: 풀레버리지·단타 성향(M-ATPG)이 규제지역에서 다주택으로 들어가면 대출 0%·세금 중과·실거주 의무가 겹쳐 전략 자체가 막힘 → danger 우선 노출.

### GC-5 · 경매(규제 플래그) → `A-scnr` (동네 안전 낙찰러) + 무주택·규제지역
연고지 안전물건 실수요, 소액·초보, 규제지역.
- 일반문항: g1=s, g2=s / g3=c, g4=c, g5=c / g6=n, g7=n / g8=r, g9=r, g10=r
- profile: 투자자금=~5천(s+2 / u50), 투자용도=실거주(r+2 / reside), 투자지역=연고지(n+2 / home), 주택보유=무주택(value=none, 0점), 경매경험=초보(c+1 / novice), 규제지역여부=규제지역(value=regulated, 0점)
- 집계: FUND s6/b0→**s** · DIFFICULTY c7/x0→**c** · REGION n6/w0→**n** · PURPOSE r8/f0→**r**
- **결과: `A-scnr`**, borderline 없음.
- **켜지는 플래그(level 정렬, 4건)**:
  1. `region_regulated=regulated` → **warn**: 경매도 대출규제 동일 적용(경락잔금대출 LTV·DSR), 자금계획 경고. (a)
  2. `ownership=none & purpose=reside`(기존) → **info**: 무주택 실거주 생애최초 감면·대출우대 / 실거주 의무 확인.
  3. `region_regulated=regulated` → **info**: 경매는 토허 실거주·갭·자금조달계획서 면제(규제회피 가능)이나 고가낙찰 주의. (b)
  4. `ownership=none & region_regulated=regulated` → **info**: 규제지역 무주택 경락대출 LTV 40%+전입의무 가능, 토허 실거주의무는 면제.
- 미발동: 다주택·flip·특수물건·과욕 패턴 플래그. 초보지만 DIFFICULTY=c라 `experience=novice & axis_DIFFICULTY=x` 미발동.
- 의미: 경매 (a)대출 경고 / (b)토허 면제 안내가 **함께** 노출되어 D절의 "두 갈래" 설계가 그대로 확인됨.

---

## 6. 결정성 체크리스트 (web-builder/QA 공통)
- [ ] 모든 일반문항 1택 필수, profile_inputs 1택 필수(미응답 시 진행 차단).
- [ ] 동점은 항상 default_pole로 확정 + borderline 표기. 임의 랜덤·후순위 가중 금지.
- [ ] 코드 조합 순서는 axis_order 고정. 대소문자(매매 대문자/경매 소문자) 보존.
- [ ] profile value는 점수와 별개로 저장 → 플래그 평가에 사용.
- [ ] 플래그는 AND 결합, 복수 동시 노출 허용, level 순서로 정렬 표시.
