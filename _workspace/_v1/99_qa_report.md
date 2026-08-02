# 99_QA_REPORT — 정합성 교차 검증 (경계면 비교)

> 검증일: 2026-07-01 · 검증자: QA 에이전트
> 방식: 존재 확인이 아닌 **경계면 교차 비교**. 골든 케이스는 HTML 내 실제 채점 JS(`SCORE_FN`)를 Node로 추출 실행해 재현.

## 종합 판정: **전 항목 통과 (PASS)** — 불일치 0건

| # | 검증 항목 | 결과 |
|---|---|---|
| 1 | 축 ↔ 문항 매핑 | PASS |
| 2 | 유형 코드 일관성 (4개 소스) | PASS |
| 3 | 채점 재현 (골든3 + 샘플2) | PASS |
| 4 | 경매 5변수 반영 | PASS |
| 5 | 콘텐츠 품질 | PASS |
| + | HTML 임베드 DATA == JSON 정본 | PASS (byte-equal) |

---

## 1. 축 ↔ 문항 (PASS)
- 매매 4축 모두 일반문항 4개씩 측정: RISK=q1~4, HORIZON=q5~8, BASIS=q9~12, CAPITAL=q13~16.
- 경매 4축 측정수(일반+profile): FUND 3(g1,g2+fund_size), DIFFICULTY 4(g3~5+experience), REGION 3(g6,g7+region_pref), PURPOSE 4(g8~10+purpose). 전 축 3~5 범위 — scoring.md §1 표와 일치.
- 존재하지 않는 축을 가리키는 문항/profile: **없음**.
- `types[].axes` 시퀀스가 코드 문자열과 100% 일치 (mismatch 0/32).
- `axis_order` 집합 == `axes[].id` 집합 (양 트랙).

## 2. 유형 코드 일관성 (PASS)
4개 소스(01_typology.md · 02_*.json `types[]` · 03_profiles.md 헤더 · 03_strategy_guide.md 헤더)에서 매매 16 + 경매 16 = **32 코드 집합이 완전 동일**. 한 곳에만 있거나 철자가 다른 코드: 없음.

## 3. 채점 재현 (PASS) — HTML `SCORE_FN` 실제 실행
| 케이스 | 기대 | 실제(HTML JS) | 일치 |
|---|---|---|---|
| GC-1 매매 전(全)안정 | M-SHRE, borderline 없음, S8/H8/R8/E8 | M-SHRE, [], S8 H8 R8 E8 | ✓ |
| GC-2 매매 동점 | M-ATPG, borderline=[CAPITAL], G4/E4 | M-ATPG, [CAPITAL], G4 E4 | ✓ |
| GC-3 경매 다주택+단타 | A-bxwf, 양도세 warn 1건만 | A-bxwf, flags=[warn] (양도세 중과) | ✓ |
| SAMPLE-1 손채점 혼합 매매 | M-STRE (S6/T6/R6/E6) | M-STRE, S6 T6 R6 E6 | ✓ |
| SAMPLE-2 손채점 경매 초보+소액특수 | A-sxnf, danger+warn | A-sxnf, [danger, warn] (초보·특수 / 소액·특수) | ✓ |

- 동점→default_pole(G) 확정 + borderline 표기 정확.
- profile 점수(graduated +2/+1)·`inter` 빈 score 0점·ownership 무기여 처리 정확.
- 플래그 AND 결합·복수 노출·level 정렬(danger→warn→info) 정확.

## 4. 경매 5변수 반영 (PASS)
- 투자자금→fund_size(axis FUND), 투자용도→purpose(axis PURPOSE), 투자지역→region_pref(axis REGION), 경매경험→experience(axis DIFFICULTY), 주택보유상황→ownership(축 무기여·순수 개인화) — 5개 모두 `profile_inputs`에 존재.
- 가이드: 주택보유/경매경험은 [개인화 경고] 공통 골격 + 유형별 강조로 반영. 자금/용도/지역은 축(유형 구조) 자체로 반영(다주택·무주택·초보·숙련 문구 모두 존재).

## 5. 콘텐츠 품질 (PASS)
- 32유형 전부 프로필에 **강점+약점+맹점(⚠️)** 보유 (칭찬 일색 아님 — 희귀/위험형엔 강경고).
- 32유형 전부 활용 가이드에 **체크리스트** + 적합물건/함정/매도(또는 명도·입찰) 전략 보유.

## 6. 추가 확인
- HTML 임베드 `DATA.maemae`/`DATA.gyeongmae`가 정본 JSON과 **정렬 키 기준 완전 동일** → 데이터 드리프트 없음.

---

## 결론
경계면 불일치 **0건**. 수정 대상 에이전트 없음. 리더에게 **정합성 검증 완료** 보고.

---
---

# 99_QA_REPORT — 규제 반영(v1.1 부분 재실행) 재검증

> 재검증일: 2026-07-01 · 검증자: QA 에이전트
> 범위: 규제 변경분 집중 + 회귀(기존 깨짐) 확인. 골든 케이스 GC-1~5는 HTML 내 실제 `SCORE_FN`을 Node로 추출 실행해 재현.
> 검증 대상: 00_regulations.md, 01_typology.md, 02_maemae.json(v1.1), 02_gyeongmae.json(v1.1), 02_scoring.md, 03_strategy_guide.md, 부동산투자성향테스트.html

## 종합 판정: **전 항목 통과 (PASS)** — 불일치 0건 / 비차단 관찰 1건

| # | 재검증 항목 | 결과 |
|---|---|---|
| 1 | 회귀: 32 코드 4소스 일치 · 16문항/축/GC-1~3 불변 | PASS |
| 2 | 규제 flag 정합 (JSON ↔ scoring.md ↔ HTML, 매매7/경매13) | PASS |
| 3 | 채점 재현 GC-1~5 (규제 포함, HTML SCORE_FN 실행) | PASS |
| 4 | 규제 근거 정합 (00_regulations.md only · [불확실] 보존 · 면책) | PASS (관찰 1건) |
| 5 | profile 입력 (region_regulated +매매 ownership · unknown 선택지) | PASS |

---

## 1. 회귀 — 기존 구조 불변 (PASS)
- **32 유형코드 4소스 완전 일치**: 01_typology(32) · JSON types[](16+16) · 03_profiles(32) · 03_strategy_guide(32) — 집합·철자 동일, 한쪽에만 존재/오타 0건.
- **문항·축 불변**: 매매 일반문항 16개(q1~q16, RISK/HORIZON/BASIS/CAPITAL 각 4) · 경매 일반문항 10개(g1~g10) + profile, axis_order·default_pole 불변. 규제 입력은 모두 축 0점(매매 ownership·region_regulated score 키 없음 / 경매 region_regulated score 키 없음) → 유형 코드 체계 불변 확인.
- **GC-1~3 불변 재현**: GC-1 `M-SHRE` S8/H8/R8/E8 borderline 없음 · GC-2 `M-ATPG` borderline=[CAPITAL] G4/E4 · GC-3 `A-bxwf` 양도세 warn 1건만. 모두 v1.0과 동일.

## 2. 규제 flag 정합 (PASS)
- **flag 개수**: 매매 `flags[]` **7개** (scoring.md §4-1 매매 표 7행과 1:1) · 경매 `flags[]` **13개** = 기존 8 + 규제 신설 5 (region_regulated 조건 flag 정확히 5개). scoring.md 명시치와 일치.
- **조건·level 일치**: scoring.md §4-1 매매 7행 / 경매 5행의 (ownership·region_regulated·axis_CAPITAL) 조건과 level(info/warn/danger)이 JSON `when`/`level`과 전부 일치. `axis_CAPITAL=G & region_regulated=regulated → info` 포함.
- **HTML 임베드 무드리프트**: HTML `DATA.maemae`/`DATA.gyeongmae`를 추출해 정본 JSON과 구조 비교 → `JSON.stringify` **완전 동일(identical: true)**. flags 7/13 그대로 임베드, byte drift 없음.
- **HTML 평가 로직**: `key.indexOf('axis_')===0 → poles[축]`, `type_code → code`, 그 외 → `profileValues[key]` 비교. AND 결합·복수 노출·level(danger0→warn1→info2) 정렬 — scoring.md와 동일.

## 3. 채점 재현 — 규제 포함 (PASS) · HTML SCORE_FN 실제 실행
| 케이스 | 기대 (scoring.md §5) | 실제 (HTML JS) | 일치 |
|---|---|---|---|
| GC-1 매매 전안정 | M-SHRE / borderline [] | M-SHRE / [] | ✓ |
| GC-2 매매 동점 | M-ATPG / [CAPITAL] / G4 E4 | M-ATPG / [CAPITAL] / G4 E4 | ✓ |
| GC-3 경매 다주택+단타 | A-bxwf / warn 1건 | A-bxwf / warn 1건 | ✓ |
| **GC-4** 매매 다주택+규제지역 | M-ATPG / **danger,warn,warn,info (4건)** / CAPITAL=G | M-ATPG / danger,warn,warn,info / CAPITAL=G | ✓ |
| **GC-5** 경매 무주택+규제지역 | A-scnr / **warn,info,info,info (4건)** / (a)대출+(b)토허 동시 | A-scnr / warn,info,info,info | ✓ |

- **GC-4**: ① danger(다주택 규제지역 추가구입 LTV 0%) ② warn(취득세 8~12%+양도세 중과·한시배제 확인필요) ③ warn(토허 2년실거주·갭차단·자금조달계획서) ④ **info(axis_CAPITAL=G 의존 — 레버리지 성향 vs 규제지역 차입제한)**. axis_CAPITAL=G 의존 info **정상 발동** 확인. level 정렬 danger→warn→info 정확.
- **GC-5**: warn(경매 (a) 대출규제 동일적용) + info(무주택 실거주 생애최초) + info(경매 (b) 토허 면제) + info(무주택 규제지역 경락 LTV40%+전입). **(a)대출 경고와 (b)토허 면제 안내가 동시 노출** → D절 "두 갈래" 설계 재현 확인. HTML은 추가로 `region_regulated==='regulated'`일 때 (a)/(b) 분리 안내 `reg-note` 배너도 렌더.

## 4. 규제 근거 정합 (PASS · 비차단 관찰 1건)
- **출처 단일성**: strategy_guide R-0~R-4의 모든 수치(6억 한도·LTV 0%·50%→40%·15억초과 4억/25억초과 2억·서울25구+경기12곳·취득세 8/12·양도세 +20/+30%p·DSR40%·6·30 구리/동탄/기흥)가 00_regulations.md(A-1~A-5·B-1~B-4·C·D·E)로 역추적됨. 임의 수치 없음.
- **[불확실] 보존**: ① 다주택 양도세 중과 한시배제(~2026-05-09) 종료/연장 ② 6·30 신규지정 범위·효력일(화성 동탄) ③ 처분조건부 1주택 LTV(50%vs40%) ④ 취득세 중과 완화 ⑤ 경락대출 금융사 취급기준 — 전부 "확인 필요/금융기관 확인" 문구로 단정 회피. flag 메시지·R-1~R-4·HTML(`[불확실-확인필요]` 배지) 모두 일관 표기.
- **면책 보존**: 00_regulations.md(머리말) · strategy_guide R-4 · HTML(`자문이 아닙니다` 라인 + flag-foot 각주 + REG_SUMMARY 출처표기) 3중 보존.
- **6·30 신규지정 우회**: 구리·동탄·기흥을 단정적 "규제지역"으로 박지 않고 사용자가 `region_regulated`를 직접 선택하게 함 → grounding 불확실성 우회 설계 확인.
- **[비차단 관찰 OBS-1]**: 경매 기존(v1.0) flag `ownership=multi & purpose=flip`의 "1년 미만 70%·2년 미만 60%" 단기 양도세율은 00_regulations.md에 표로 명시되지 않음(B-3엔 보유수별 중과 골격만). 단 이는 **규제 재실행 범위 밖의 기존 flag**이며 일반적 단기보유 세율이라 차단 사유 아님. 권고: 차기 업데이트 시 해당 세율도 grounding 문서 B-3에 출처와 함께 추가하면 "수치는 00_regulations.md only" 원칙이 완전해짐. → 대상: diagnostic-designer(flag 문구) / 후속 보강 시 00 작성자.

## 5. profile 입력 (PASS)
- 매매 `profile_inputs`: `ownership`(none/one/multi) + `region_regulated`(regulated/normal/**unknown=잘 모르겠다**) 둘 다 존재, 축 0점.
- 경매 `profile_inputs`: 기존 5변수 + `region_regulated`(regulated/normal/**unknown**) 추가, 축 0점.
- HTML "잘 모르겠다"(unknown 선택지) 2건(매매1·경매1) 임베드 확인. unknown 선택 시 `region_regulated=unknown → info(국토부 페이지 확인 권고)` flag 발동(양 트랙 존재).

---

## 재검증 결론
규제 반영(v1.1) 경계면 불일치 **0건**, 회귀 깨짐 **0건**. GC-1~5 전부 HTML 실제 채점 JS로 재현됨(특히 GC-4 axis_CAPITAL=G 의존 info, GC-5 경매 a/b 두 갈래 동시 노출 확인). 비차단 관찰 OBS-1(기존 flag 단기세율 grounding 보강 권고) 외 **수정 대상 에이전트 없음**. 리더에게 **규제 재검증 완료** 보고.

---
---

# 99_QA_REPORT — 6·30 관보 원문 확정 반영(부분 재실행) 재검증

> 재검증일: 2026-07-01 · 검증자: QA 에이전트
> 변경 범위(선언): 규제 grounding 문서 A-5/E/F/G절 + 가이드 R-0/R-4 + HTML 규제 요약 텍스트만. 채점·문항·유형·flags 미변경 전제 검증.
> 골든 케이스 GC-1~5는 HTML 내 실제 `SCORE_FN`을 Node로 추출 실행해 재현.

## 종합 판정: **전 항목 통과 (PASS)** — 차단 불일치 0건 / 비차단 관찰 2건

| # | 재검증 항목 | 결과 |
|---|---|---|
| 1 | 회귀: GC-1~5 재현 · 32코드 4소스 · 문항 · flags(매매7/경매13) · DATA v1.1 불변 | PASS |
| 2 | 근거 정합: 6·30 사실(지역명·효력일·토허기간·아파트·도정법§39)이 A-5/E절과 일치 | PASS |
| 3 | 신뢰도 일관: 6·30 = 관보 원문 확정, 세 곳 옛 [불확실] 잔존 0 | PASS (관찰 1건) |
| 4 | 미해결 5항목 + 면책 세 곳 보존 | PASS |

---

## 1. 회귀 — 채점·구조 불변 (PASS)
HTML 임베드 `DATA`/`SCORE_FN`을 추출해 실제 실행 (`scratchpad/run.js`):

| 케이스 | 기대 (scoring.md §5) | 실제 (HTML JS) | 일치 |
|---|---|---|---|
| GC-1 매매 전안정 | M-SHRE / border [] / S8 H8 R8 E8 / flags 0 | M-SHRE / [] / 8 8 8 8 / [] | ✓ |
| GC-2 매매 동점 | M-ATPG / border [CAPITAL] / G4 E4 | M-ATPG / [CAPITAL] / 4 4 / [] | ✓ |
| GC-3 경매 다주택+단타 | A-bxwf / warn 1건 | A-bxwf / [warn] n=1 | ✓ |
| GC-4 매매 다주택+규제지역 | M-ATPG / CAPITAL=G / danger,warn,warn,info(4) | M-ATPG / G / [danger,warn,warn,info] n=4 | ✓ |
| GC-5 경매 무주택+규제지역 | A-scnr / warn,info,info,info(4) | A-scnr / [warn,info,info,info] n=4 | ✓ |

- **32 유형코드 4소스 완전 일치**: 01_typology(32)·JSON types[](16+16)·03_profiles(32)·03_strategy_guide(32) — 집합·철자 동일, 누락/오타 0건.
- **문항 불변**: 매매 q1~q16(16)·경매 g1~g10(10) + profile. **flags 개수 매매 7 / 경매 13** 그대로. **DATA `version`=1.1**(매매·경매) 유지. HTML 임베드 `DATA`가 정본 JSON과 동일(flags·문항·types byte 일치).
- 결론: 규제 텍스트만 바뀌고 **채점·문항·유형·flags 전부 불변** 확인.

## 2. 근거 정합 — 6·30 사실 (PASS)
가이드 R-0(line 20)·R-4(line 66)와 HTML 규제 요약(REG_SUMMARY R-0/R-4)의 6·30 사실이 갱신된 `00_regulations.md` A-5(line 66~78)·E절(line 181~185)과 **정확히 일치**:

| 사실 | 00 A-5/E | guide R-0/R-4 | HTML | 일치 |
|---|---|---|---|---|
| 지역명 | 화성시 동탄구·용인시 기흥구·구리시 | 동일 | 동일 | ✓ |
| 조정·투과 효력일 | 2026-07-01 (공고 2026-882/883호) | 동일 | 동일 | ✓ |
| 토허 기간·대상 | 2026-07-05~2027-12-31, 아파트 (공고 2026-1792호) | 동일 | 동일 | ✓ |
| 조합원 지위제한 | 도정법 §39 (투과) | 도정법 §39 | 도정법 §39 | ✓ |
| 명칭 정정 | "화성시 동탄구"로 확정("동탄2 등" 정정) | 동일 | 동일 | ✓ |

- 임의 추가·과장 없음. 면적(170.50㎢/81.64/55.52/33.34)은 00에만 상세 기재, 가이드·HTML은 핵심사실만 인용 — 축소는 허용(과장 아님).

## 3. 신뢰도 일관성 (PASS · 관찰 1건)
- 6·30이 세 곳 모두 **관보 원문 확정**으로 통일: 00 = `[확인됨/출처있음 — 관보 원문]`(line 66·68·69·74·181·207), guide = `[확인됨 — 관보 원문]`(line 20·66), HTML = `[확인됨 — 관보 원문]`(GZ 배지, line 416).
- 세 곳의 6·30 항목에 옛 `[불확실]` 잔존 **0건**. 00 G절 line 207은 "~~6·30 신규지정 정확 범위~~ — 해결됨"으로 취소선 처리.
- **[비차단 관찰 OBS-2]** 라벨 토큰 차이: 00은 자기 범례(`[확인됨/출처있음]`)에 "— 관보 원문"을 붙여 `[확인됨/출처있음 — 관보 원문]`, guide·HTML은 자기 범례(`[확인됨]`)에 붙여 `[확인됨 — 관보 원문]`. **문서별 범례 규약 차이일 뿐 의미(관보 확정) 동일**하며 각 문서 내부적으로 일관. 사용자 명시 표기(`[확인됨 — 관보 원문]`)와 문자열을 완전 통일하려면 00의 토큰을 정렬하면 됨(선택). → 대상: 00 작성자(규제 grounding).

## 4. 미해결 항목 + 면책 보존 (PASS)
나머지 불확실 5항목이 세 곳에서 모두 "확인 필요/금융기관 확인"으로 보존됨:

| 미해결 항목 | 00 | guide | HTML |
|---|---|---|---|
| ① 양도세 중과 한시배제(~2026-05-09) 종료/연장 | B-3·G절 | R-1·R-4 | R-1·R-4 |
| ② 처분조건부 1주택 규제지역 LTV(50% vs 40%) | B-1·G절 | R-1·R-4 | R-1·R-4 |
| ③ 취득세 중과 완화 입법 | B-2·G절 | R-1·R-4 | R-1·R-4 |
| ④ 경락잔금대출 금융사별 취급기준 | D·G절 | R-2·R-4 | R-2·R-4 |
| ⑤ 9·7 보증료 차등·임대사업자 세부 | A-2·G절 | R-4 | R-4 |

- 면책 3중 보존: 00 머리말(line 10) · guide R-4(line 68) · HTML(reg-disc + reg-src 라인). 모두 "세무·법률 자문 아님, 전문가 확인" 명시.

## 5. 비차단 관찰 (차단 아님 — 보고만)
- **[OBS-1 / 잔존]** `02_scoring.md` line 128 "신뢰도 전파 점검" 주석이 여전히 "6·30 신규지정 범위(A-5)"를 `[불확실]` 항목으로 열거. 6·30은 관보로 확정됐으므로 **이 prose 주석은 outdated**. 단 (i) scoring.md는 이번 변경 범위 밖(동결 대상)이고 (ii) flag 로직 자체는 6·30을 단정하지 않고 `region_regulated` 사용자 선택으로 우회하는 설계가 유효하므로 **채점에 영향 없음**. 차기 scoring 갱신 시 해당 주석에서 A-5를 미해결 목록에서 제외 권고. → 대상: diagnostic-designer.
- **[OBS-3]** `00_regulations.md` B-4 line 126(섹션 B, 변경 범위 밖)은 "재건축·재개발 조합원 지위양도 금지"를 `[확인됨 — 6·30 보도 기준]` + `[불확실-추가확인필요]`로 표기. A-5가 동일 사항(도정법 §39 조합원 지위제한)을 관보로 확정했으므로 **A-5와 B-4 사이 표기 강도 불일치**. 단 B-4의 불확실은 "3년 전매제한" 기간 수치·단지별 차이에 더 무게가 있어 완전한 모순은 아님. 차기 보강 시 B-4의 조합원 지위 부분을 A-5(관보) 기준으로 정렬 권고. → 대상: 00 작성자.

## 6·30 재검증 결론
선언된 변경 범위(A-5/E/F/G·R-0/R-4·HTML 규제 요약)의 6·30 관보 확정이 세 곳에서 **정합**하고, 채점·문항·유형·flags는 **완전 불변**(GC-1~5 재현, v1.1 유지). 차단 불일치 **0건**. 비차단 관찰 3건(OBS-1 scoring 주석 잔존 / OBS-2 라벨 토큰 차이 / OBS-3 B-4 표기 강도)은 모두 변경 범위 밖 prose이며 채점·핵심 사실에 영향 없음 → **수정 강제 대상 없음**(권고만). 리더에게 **6·30 정합성 검증 완료** 보고.

---
---

# 99_QA_REPORT — 신규 기능(경매 검색조건 생성) 반영 재검증

> 재검증일: 2026-07-01 · 검증자: QA 에이전트
> 변경 범위(선언): 신규 `04_search_criteria.md/.json`, HTML에 검색조건 카드 + JSON 내보내기 추가. 기존 채점·문항·유형·flags·규제요약 **미변경 전제** 검증.
> 실행: HTML 내 실제 JS(`DATA`·`SCORE_FN`·`computeSearchCriteria`·`scFmtKRW`)를 Node로 라인 추출·실행(`scratchpad/harness.js`, `reg.js`) → 채점 회귀 + 검색조건 골든 재현.

## 종합 판정: **회귀·근거 통과 / 검색조건 골든 expect 불일치 2건 → search-criteria-mapper 수정 필요**

| # | 재검증 항목 | 결과 |
|---|---|---|
| 1 | 회귀: GC-1~5 재현·32코드·문항·flags(매매7/경매13)·DATA v1.1 불변 | PASS |
| 2 | 검색조건 정합: 04 json 유형/입력 참조가 정본과 일치 | PASS (골든 expect 예외 아래) |
| 3 | 검색조건 재현: HTML `computeSearchCriteria` 골든 G1~G3 | **구현 PASS / json golden expect FAIL 2건** |
| 4 | 규제 근거: LTV배수·세금·토허 = 00_regulations.md only, 면책 보존 | PASS |
| 5 | web-builder 관찰(보수계수 들쭉날쭉) 판정 | **확인됨 — json expect 수정 대상** |

---

## 1. 회귀 — 채점·구조 완전 불변 (PASS)
HTML 임베드 `DATA`/`SCORE_FN`을 추출해 실제 실행:

| 케이스 | 기대 (scoring.md §5) | 실제 (HTML JS) | 일치 |
|---|---|---|---|
| GC-1 매매 전안정 | M-SHRE / border [] | M-SHRE / [] | ✓ |
| GC-2 매매 동점 | M-ATPG / [CAPITAL] | M-ATPG / [CAPITAL] | ✓ |
| GC-3 경매 다주택+단타 | A-bxwf / warn 1건 | A-bxwf / [warn] | ✓ |
| GC-4 매매 다주택+규제 | M-ATPG / danger,warn,warn,info(4) | 동일 | ✓ |
| GC-5 경매 무주택+규제 | A-scnr / warn,info,info,info(4) | 동일 | ✓ |

- **DATA 무드리프트**: `DATA.gyeongmae` == 정본 `02_gyeongmae.json` **`JSON.stringify` 완전 동일(byte-equal, true)**. version 매매/경매 **1.1** 유지, 문항 매매16/경매10, **flags 매매7/경매13**, types 16+16=**32**, 32코드 집합 동일. 검색조건 기능 추가가 기존 데이터·채점을 건드리지 않음 확인.

## 2. 검색조건 정합 — 참조 무결성 (PASS)
- **유형코드**: 04 golden `type`(G1 A-scnr / G2 A-scnf / G3 A-scnr) 전부 `02_gyeongmae.json types[]`에 존재. 새 유형코드 창작 **없음**.
- **profile 입력값**: fund_size(u50/u150) · purpose(reside/flip) · region_pref(home) · ownership(none/multi) · experience(novice/inter) · region_regulated(normal/regulated) — 전부 `02_gyeongmae.json profile_inputs` 정의 값. 없는 입력·값 창작 **없음**. `equity_top_by_fund_band`(u50/u150/u300/o300)도 fund_size 옵션값과 일치.
- **차원 분리**: 9개 dimensions 중 사이트 필터 O = region·property_type·price_min·price_max·min_fail_count·rights_difficulty·area_pyeong / 참고(notes) = regulated_preference·notes. HTML `scDim` 배지([필터 O]/[참고])와 04.json `site_filterable`/`notes_only_not_filterable` **일치**. 모든 차원이 필터 또는 notes로 귀속됨(누락 0).

## 3. 검색조건 재현 — HTML `computeSearchCriteria` 실제 실행 (핵심)

| 골든 | 입력 | 구현 산출(공식 정본) | md §4 헤드라인 | json `expect.price_max` | 판정 |
|---|---|---|---|---|---|
| **G1** | 경기·비규제·5천·무주택·실거주·초보 | price_max **150,000,000**(=5천×3.33×0.9) / min_fail 1 / safe | ~1.5억 | 150,000,000 | **3자 일치 ✓** |
| **G2** | 서울·규제·1.5억·다주택·단타·중급 | price_max **135,000,000**(=1.5억×1.0×0.9, LTV0) / min_fail 3 / safe | ~1.35억 | **150,000,000** | 구현=md ✓ / **json FAIL** |
| **G3** | 서울·규제·5천·무주택·실거주·초보 | price_max **75,000,000**(=5천×1.67×0.9, LTV40) / min_fail 2 / safe / alt 150,000,000(생애최초 LTV70) | ~0.75억(0.75~0.83) | **83,000,000** | 구현=md ✓ / **json FAIL** |

- **핵심 요구 검증 — G1(비규제) ↔ G3(규제) 반토막**: 동일 유형·자금(5천)·무주택인데 **비규제 price_max 1.5억 → 규제 0.75억으로 정확히 반토막**(LTV 70%→40%, ×3.33→×1.67). 구현이 정확히 재현. + G3 min_fail 규제 +1로 1→2. + 생애최초 LTV70 분기 alt(150,000,000)도 노출. **PASS**.
- **G2(다주택+규제, LTV0) 자기자본 기준**: `ltvMult('regulated')`가 own≠none이면 1.0 반환 → 전액 자기자본(×1.0) 전제. min_fail=3(base1+flip1+규제1). **자기자본 기준 산정 PASS**.
- **구현의 보수계수 일관성**: `fundSafety`(FUND=s→0.9)가 G1/G2/G3 **전부 곱해짐**(150M·135M·75M 모두 ×0.9 반영). md §4 헤드라인표(1.5/1.35/0.75)와 **완전 일치**. → 구현은 정본 공식대로 결정적.

## 4. 규제 근거 정합 (PASS)
검색조건에 등장하는 규제 수치를 `00_regulations.md`로 역추적, 임의 단정 없음:

| 검색조건 수치 | 근거(00_regulations.md) | 확인 |
|---|---|---|
| 비규제 LTV 70% → ×3.33 | C절·B-1 line 92("비규제 70%") | ✓ |
| 규제 무주택 LTV 40% → ×1.67 | A-2 line 33·B-1 line 92("무주택 LTV 40%")·line 135 | ✓ |
| 규제 다주택/1주택미처분 LTV 0% → ×1.0 | A-1 line 20·B-1 line 94~95("주담대 금지 LTV 0%") | ✓ |
| 생애최초 LTV 70% 분기 | A-1 line 22·B-1 line 92 | ✓ |
| 취득세 8~12% 중과 | B-2 line 105~107 | ✓ |
| 6개월 전입의무·DSR 40% | line 23·86·97 | ✓ |
| 토허 2년 실거주·자금조달계획서 = 경매 면제 | A-4 line 50·72·125(토허 대상=아파트, 경락은 토지거래허가 대상 거래 아님) | ✓ |

- **[불확실] 보존**: json price 규칙이 "처분조건부 1주택은 50% 표현 혼재[불확실]"를 명시(구현은 보수적으로 LTV0=×1.0 처리). 경락대출 금융사별 상이도 notes로 단정 회피.
- **면책 3중 보존**: 04.md(line 8) · 04.json(`disclaimer`) · HTML `computeSearchCriteria` notes 말미(line 699) + `searchCriteriaJSON._meta.disclaimer`. "투자·세무·법률 자문 아님, 전문가 확인" 명시.

## 5. web-builder 관찰 판정 (핵심) — **확인됨**
web-builder 관찰("04.json `expect.price_max`가 G1/G2/G3에서 보수계수 적용이 들쭉날쭉, G2/G3 상단값 미적용")은 **정확**.

- **판정 근거**: 정본은 **공식(rules)**이며 `price_max = equity_top × LTV배수 × safety(FUND=s→0.9)`. 구현(`computeSearchCriteria`)·04.md §4 헤드라인표·04.json `rules.price`가 모두 이 공식에 일치. 그런데 **04.json `golden[].expect.price_max`만** G2/G3에서 보수계수 0.9를 빠뜨린 **상단값(range 상한)**을 박아 자기 규칙과 모순:
  - **G2**: rules대로면 150,000,000×1.0×**0.9**=135,000,000. `price_calc` 문자열도 "≈ 135,000,000~150,000,000"이라 써놓고 `expect.price_max`엔 상한 **150,000,000** 기입 → 0.9 미적용.
  - **G3**: rules대로면 50,000,000×1.67×**0.9**=75,000,000. `price_calc`도 "≈ 75,000,000~83,000,000"인데 `expect.price_max`엔 상한 **83,000,000**(=×0.9 미적용) 기입.
  - G1만 우연히 일치(149,850,000→반올림 150,000,000이 상한과 같음).
- **어느 쪽이 맞나**: **구현 + md 헤드라인표(1.5/1.35/0.75억)가 정본**. `expect.price_max`(150M/83M)가 오류. → **json golden expect 수정 필요**.

### ▶ 수정 요청 (대상: search-criteria-mapper) — 04_search_criteria.json
1. **G2** `golden[1].expect.price_max`: `150000000` → **`135000000`** (rules: 1.5억×1.0×0.9. md §4 헤드라인 1.35억과 일치).
2. **G3** `golden[2].expect.price_max`: `83000000` → **`75000000`** (rules: 5천×1.67×0.9. md §4 헤드라인 0.75억과 일치. 생애최초 alt 150,000,000은 별도 유지).
3. (부수) **property_type golden expect 불일치** — `fund_modifier` 규칙(소액=base+`[다세대주택,연립주택,오피스텔,도시형생활주택]`) 산출과 golden `expect.property_type`가 어긋남. 구현 산출: G1/G3=`["아파트","다세대주택","연립주택","오피스텔","도시형생활주택"]`(5), G2=`["아파트","오피스텔","다세대주택","연립주택","도시형생활주택"]`(5). 반면 json expect: G1/G2=`도시형생활주택` 누락(4), G3=`["오피스텔","다세대주택","아파트(소형·외곽)"]`(라벨 변형·항목 누락). 규칙 산출로 통일 권고. → search-criteria-mapper.
   - min_fail_count·price_min·rights_difficulty golden expect는 구현과 **일치**(수정 불요).

## 신규기능 재검증 결론
회귀(GC-1~5·32코드·문항·flags 7/13·DATA v1.1) **완전 불변** — 검색조건 기능 추가가 기존 채점을 오염시키지 않음. `computeSearchCriteria` 구현은 **정본 공식대로 결정적**이며 G1↔G3 규제 반토막(1.5→0.75억)·G2 LTV0 자기자본 기준을 정확 재현, 규제 수치는 00_regulations.md에만 근거·면책 보존. **차단 이슈**: `04_search_criteria.json`의 golden `expect.price_max`(G2·G3) 및 `property_type`(G1~G3)가 자기 rules/구현/md헤드라인과 불일치 → **search-criteria-mapper가 json golden expect를 rules 산출값으로 정정**해야 함(구현·md·HTML 출력은 정확하므로 수정 불요). 리더에게 **검색조건 정합성 검증 완료 — json golden 2(+1)건 수정 필요** 보고.
