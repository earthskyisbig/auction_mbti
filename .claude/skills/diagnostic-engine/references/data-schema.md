# 진단 데이터 스키마 (고정 계약) — v2

`_workspace/02_diagnostic.json`의 표준 구조. diagnostic-designer·content-writer가 생성하고 web-builder가 소비한다.
**필드명과 중첩 구조를 바꾸지 말 것.** 확장이 필요하면 새 필드를 추가하되 기존 필드는 유지하고, `version`을 올려 web-builder에 알린다.

## 파일 구조

```json
{
  "version": "2.0",
  "track": "auction",
  "track_label": "법원경매 투자성향",
  "code_prefix": "A-",
  "axis_order": ["RIGHTS", "WORK", "EXIT"],

  "scoring": {
    "questions_per_axis": 3,
    "rule": "각 문항은 한쪽 극에 1점. 축별 3문항이므로 3:0 또는 2:1로 결정되며 동점은 없다.",
    "strength": { "3": "뚜렷함", "2": "약간 기울어짐" }
  },

  "axes": [
    {
      "id": "RIGHTS",
      "label": "권리 리스크",
      "question": "서류가 복잡한 물건, 들어갈래요?",
      "pole_a": { "code": "S", "name": "안전형", "desc": "권리가 깨끗한 물건만 본다" },
      "pole_b": { "code": "R", "name": "모험형", "desc": "복잡해도 싸면 들어간다" }
    }
    // 축마다 하나. default_pole 없음 — 축당 3문항이라 동점이 발생하지 않는다.
  ],

  // 사실 입력 — 점수에 기여하지 않는다. 검색조건 계산과 플래그에만 쓴다.
  "facts": [
    {
      "id": "budget",
      "label": "예산",
      "text": "경매에 넣을 수 있는 내 돈(대출 제외)은 얼마인가요?",
      "help": "대출은 자동으로 더해 계산합니다.",
      "options": [
        { "value": "u50", "label": "5,000만 원 이하", "equity_top": 50000000 }
      ]
    },
    {
      "id": "region", "label": "지역", "text": "...", "type": "region_picker"
      // 시/도 + 시군구 → 규제 여부 자동 판정(00_regulations.md §E). 사용자에게 규제 여부를 묻지 않는다.
    }
    // ownership(none/one/multi), experience(novice/inter/expert)도 동일 형식
  ],

  "questions": [
    {
      "id": "q1",
      "axis": "RIGHTS",                     // axes[].id 중 하나
      "text": "비슷한 집 두 개가 나왔습니다. 어느 쪽에 입찰할까요?",
      "options": [                          // 반드시 2개
        { "pole": "S", "label": "2억 원. 서류가 깨끗해 낙찰만 받으면 끝. 대신 경쟁자가 많다." },
        { "pole": "R", "label": "1억 4천만 원. 서류에 걸리는 게 하나 있어 확인이 필요하다. 대신 경쟁자가 거의 없다." }
      ]
    }
    // 선택지는 pole 코드만 갖는다(1점 고정). 가중치 필드 없음 — 채점을 단순·결정적으로 유지한다.
  ],

  "types": [
    {
      "code": "A-SEK",
      "axes": { "RIGHTS": "S", "WORK": "E", "EXIT": "K" },
      "name": "속 편한 월세 대장",
      "summary": "2~3문장 정체성",
      "keywords": ["권리 단순", "공실 선호", "임대 수익", "저관여"],   // 4개
      "fit": ["...", "...", "..."],          // 잘 맞는 물건 3개
      "trap": "가장 큰 함정 — 유형마다 달라야 한다",
      "checklist": ["...", "...", "..."],     // 숫자로 답할 수 있는 질문 3개
      "first_step": "지금 당장 할 일"
    }
    // 가능한 모든 조합(3축 = 8개). "rare" 플래그가 필요한 조합이 생기면 축 설계가 잘못된 것이다.
  ],

  "flags": [
    {
      "id": "novice_risk",
      "level": "danger",                     // danger | warn | info
      "when": { "experience": "novice", "axis": { "RIGHTS": "R" } },
      "title": "초보 안전장치가 켜졌습니다",
      "message": "..."
    }
    // when은 사실 입력 값과 축 코드의 조합으로만 쓴다.
    // 값이 배열이면 OR: { "ownership": ["one", "multi"] }
    // regulated: true | "unknown" 사용 가능(지역에서 자동 판정된 값)
  ],

  "disclaimer": "결과 화면에 항상 노출",
  "regulations_ref": "00_regulations.md (기준일 YYYY-MM-DD)"
}
```

## 일관성 규칙 (QA가 검사)

- `types[].code` == `code_prefix` + `axis_order` 순서대로 `types[].axes`의 극 코드.
- 모든 `questions[].axis`는 `axes[].id`에 존재하고, **축마다 정확히 3문항**.
- 모든 `questions[].options`는 **정확히 2개**이며 `pole`은 그 축의 두 극 중 하나.
- `types[]` 집합 == `01_typology.md`의 유형 == `03_profiles.md` 표 == `04_search_criteria.json` 골든 케이스가 쓰는 코드.
- `facts[]`의 어떤 값도 채점에 쓰이지 않는다(웹 JS에서 교차 확인).
- `flags[].when`이 참조하는 사실 id는 `facts[].id`에 존재.
