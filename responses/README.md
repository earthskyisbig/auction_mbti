# responses/ — 테스트 응답 저장 폴더

웹 화면에서 **💾 결과 저장 (JSON)** 을 누르면 여기에 파일이 쌓입니다.

```
20260803-142802-A-SHP.json   응답 1건 = 파일 1개 (저장시각-유형코드)
_all.jsonl                    전체 누적 (한 줄에 한 건, 분석·집계용)
```

## 이 폴더에 바로 저장하려면 서버를 켜세요

브라우저는 보안상 아무 폴더에나 파일을 쓸 수 없습니다. 프로젝트 폴더에 **직접** 저장하려면:

```bash
python save_server.py            # http://127.0.0.1:8899/index.html
```

띄운 뒤 그 주소로 접속해 테스트하면 저장 버튼이 이 폴더에 바로 씁니다.

서버 없이 `index.html`을 그냥 열어도 저장은 됩니다 — 다만 **저장 위치를 직접 고르는 창**이 뜨거나(크롬 계열) **다운로드 폴더**로 떨어집니다.

## JSON 구조

| 키 | 내용 |
|---|---|
| `saved_at` | 저장 시각 |
| `facts` | 입력한 조건 — 예산·지역·규제여부(자동판정)·주택 보유 수·경험 |
| `answers` | 9문항 각각의 축·선택한 극·고른 문장 |
| `type` | 유형 코드·이름·축별 기울기(3=뚜렷함 / 2=약간 기울어짐) |
| `criteria` | 계산된 검색조건 전체 + 가격 상한 계산식 |
| `flags` | 표시된 경고 목록(id·수준·제목) |

## 집계 예시

```bash
# 유형별 응답 수
python -c "import json; from collections import Counter; print(Counter(json.loads(l)['type']['code'] for l in open('responses/_all.jsonl', encoding='utf-8')))"
```

> 응답 파일(`*.json`, `_all.jsonl`)은 `.gitignore`에 있어 커밋되지 않습니다. 개인이 입력한 조건이므로 공유 전에 내용을 한 번 확인하세요.
