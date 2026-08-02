---
name: rmbti-orchestrator
description: 법원경매 투자성향 테스트(3축 8유형)를 설계·제작·개선하는 에이전트 팀 오케스트레이터. 성향 축 설계 → 문항/채점 → 유형 콘텐츠 → 검색조건 매핑 → 웹 화면 → 정합성 검증을 조율한다. "경매 투자성향 테스트/MBTI 만들어줘", "투자성향 진단", "경매 성향 유형", "테스트 다시/업데이트/수정/보완", "유형 추가", "문항만 다시", "결과화면 개선", "규제 반영", "검색조건/물건검색 기준 생성·수정" 같은 요청 시 반드시 이 스킬을 사용하라. 단순 개념 질문은 직접 응답 가능.
---

# 법원경매 투자성향 테스트 오케스트레이터

법원경매 물건을 고를 때 쓰는 **투자성향 테스트**를 에이전트 팀으로 설계·제작한다.
산출물: 웹 테스트(단일 HTML) + 유형 콘텐츠 + 채점 규칙 + **진단 결과 → 법원경매 검색조건 변환**.

**실행 모드:** 에이전트 팀 (파이프라인 + 생성-검증). 6명: typology-architect, diagnostic-designer, content-writer, search-criteria-mapper, web-builder, qa.

## v2 고정 계약 (2026-07-25)

이 세 가지는 팀 전원이 그대로 따른다. 바꾸려면 리더가 전 산출물 영향을 먼저 검토한다.

1. **경매 단독 트랙.** 매매 트랙은 폐기(`_workspace/_v1/`에 보관).
2. **3축 8유형.** `A-` + 권리(S/R) + 손품(E/H) + 출구(K/P). 축 순서 고정.
3. **성향과 사실의 분리.** 예산·지역·주택 보유 수·경험은 **점수에 넣지 않는다.** 검색조건 계산과 경고에만 쓴다.

> 왜: 자금·지역을 축에 넣으면 "현실"이 "취향"으로 둔갑해 모순 유형이 생긴다(v1에서 16유형 중 6개가 희귀/모순이었다).

## 산출물 지도

| 파일 | 담당 | 역할 |
|---|---|---|
| `_workspace/00_regulations.md` | (고정) | 대출·세금 규제 수치의 **유일한 출처**. 기억으로 쓰지 말 것 |
| `_workspace/01_typology.md` | typology-architect | 축·유형 정본 |
| `_workspace/02_diagnostic.json` | diagnostic-designer | 문항 9 · 사실 입력 4 · 유형 8 · 플래그. **웹의 데이터 원본** |
| `_workspace/02_scoring.md` | diagnostic-designer | 채점 규칙(사람이 읽는 문서) |
| `_workspace/03_profiles.md` | content-writer | 유형 콘텐츠 서술 원칙(정본은 JSON의 `types[]`) |
| `_workspace/04_search_criteria.md/.json` | search-criteria-mapper | 검색조건 변환 규칙 + 골든 케이스 |
| `index.html` / `부동산투자성향테스트.html` | web-builder | 동일 내용 2부 (배포용/작업용) |
| `_workspace/99_qa_report.md` | qa | 검증 결과 |

## Phase 0: 컨텍스트 확인

- `_workspace/`에 산출물 없음 → **초기 실행**(전체 파이프라인)
- 산출물 있음 + 부분 수정 요청("문항만 다시", "이 유형 보완") → **부분 재실행**(해당 에이전트만 + 다운스트림 정합성 재검증)
- 산출물 있음 + 축 재설계 요구 → 기존을 `_workspace/_v{n}/`로 옮기고 **새 실행**

축·유형 코드를 건드리는 변경은 문항·콘텐츠·검색조건·웹 **전부**에 영향한다. 사용자에게 범위를 먼저 알린다.

## Phase 1: 팀 구성 & 작업 분배

`TeamCreate`로 6인 팀. 모든 Agent 호출에 `model: "opus"` 명시. `TaskCreate`로 의존성 등록:

```
T1 (typology-architect)     축·유형 매트릭스              → 01_typology.md
T2 (diagnostic-designer)    문항 9 + 채점 [dep: T1]        → 02_diagnostic.json, 02_scoring.md
T3 (content-writer)         유형 콘텐츠 [dep: T1]          → 02_diagnostic.json의 types[], 03_profiles.md
T4 (search-criteria-mapper) 검색조건 규칙 [dep: T1, T2]    → 04_search_criteria.md/.json
T5 (web-builder)            웹 화면 [dep: T2, T3, T4]      → index.html
T6 (qa)                     경계면 검증 [각 산출물 직후]    → 99_qa_report.md
```

T2·T3은 T1 후 **병렬**. T4는 T2의 사실 입력 목록이 확정돼야 시작. T5는 셋 다 끝나야 시작.

## Phase 2: 데이터 흐름

```
typology-architect ─01_typology.md─┬─> diagnostic-designer ─02_diagnostic.json─┐
                                   ├─> content-writer ─types[]/03_profiles.md──┤
                                   └─> search-criteria-mapper ─04_*.json───────┤
                                                                               ▼
                                                              web-builder ─> index.html
   qa: 각 산출물 직후 교차검증 (코드 일관 / 채점 재현 / 골든 케이스 / 규제 출처 / 톤)
```

**데이터 전달**: 파일 기반(`_workspace/`) + 메시지 기반(코드 체계·스키마 공유) + 태스크 기반(진행 상태).

**깨지면 안 되는 것:**
1. 유형 코드는 typology-architect가 정본.
2. `02_diagnostic.json` 스키마는 `diagnostic-engine/references/data-schema.md` 준수. web-builder가 그대로 소비.
3. 검색조건 계산식은 `04_search_criteria.json`이 정본. 웹 JS는 이를 재현하고, **qa는 골든 케이스로 원 단위까지 대조**한다.
4. 규제 수치는 `00_regulations.md`에서만 인용하고 신뢰도 표기를 지우지 않는다.

## Phase 3: 종합 & 인도

QA 통과 후 리더가 종합해 사용자에게 보고한다: HTML 경로와 여는 법 / 유형 8개 요약 / 골든 케이스 검증 결과 / `_workspace/` 중간 산출물 위치.

**공개 사이트 반영(선택):** `publish-site` 스킬로 index.html 동기화·푸시. 푸시는 외부 공개 행위이므로 **사용자가 배포를 원할 때만** 실행한다.

## 에러 핸들링

- 에이전트 1회 재시도 후 재실패 → 결과 없이 진행하고 최종 보고에 누락 명시.
- 유형 모순(content-writer 발견) → 삭제 말고 typology-architect에 피드백.
- 채점·검색조건 불일치(qa 발견) → **JSON이 정본**, web-builder가 JS 수정. JSON을 웹에 맞추지 않는다.
- 규제 수치 출처 불명 → 해당 문구 삭제하고 `00_regulations.md` 확인 후 재작성.

## 테스트 시나리오

**정상 흐름:** "경매 투자성향 테스트 만들어줘" → T1 3축 → T2/T3 병렬 → T4 검색조건 → T5 웹 → QA → 인도.
검증: 8유형 전부 도달 가능 / 골든 케이스 4건이 웹 계산과 일치 / 초보+모험형 조합에서 안전장치 배너가 뜨고 특수조건이 해제됨.

**에러 흐름:** QA가 "웹 가격 상한 ≠ 골든 G3(530,140,000 기대인데 623,700,000 출력)" 발견 → 예비비 계수 누락 확인 → web-builder가 JS 수정 → 재검증 통과. JSON은 수정하지 않음.

## 재실행 키워드

"다시/재실행/업데이트/수정/보완/추가", "문항만 다시", "이 유형만 고쳐", "결과화면 개선", "검색조건 바꿔", "이전 결과 기반으로" → Phase 0에서 부분/새 실행 판별.
