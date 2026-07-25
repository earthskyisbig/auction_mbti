# Mono Signal — 이식용 디자인 시스템

이 저장소의 웹앱에서 쓰는 디자인 시스템을 **다른 프로젝트에 그대로 옮겨 쓸 수 있게** 뽑아낸 것입니다.

> 🔗 **스타일가이드(살아있는 문서)**: https://earthskyisbig.github.io/auction_mbti/design-system/
> 컴포넌트를 실제로 보고, 각 블록의 코드를 버튼 하나로 복사할 수 있습니다.

---

## 1. 설치

빌드 도구·프레임워크·npm 필요 없습니다. **두 줄**입니다.

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css">
<link rel="stylesheet" href="mono-signal.css">
```

```html
<html lang="ko" data-theme="dark">
  <body class="ms"> ... </body>
</html>
```

- `data-theme`이 없으면 **다크**로 동작합니다.
- 모든 클래스에 `ms-` 접두어가 붙어 기존 스타일과 충돌하지 않습니다.
- 토큰(`--ms-*`)만 가져다 쓰고 컴포넌트는 직접 짜도 됩니다.

`mono-signal.css` 한 파일만 복사하면 끝입니다. (Pretendard를 자체 호스팅하려면 jsDelivr 링크를 로컬 경로로 바꾸세요.)

---

## 2. 색

액센트는 **하나**입니다. 시안과 살몬은 의미가 사라지면 안 되는 곳(정보 구분·경고)에만 씁니다.

| 역할 | 토큰 | 다크 | 라이트 |
|---|---|---|---|
| 배경 | `--ms-bg` | `#0b0b0d` | `#f3f4ef` |
| 표면 (카드) | `--ms-surface` | `#141417` | `#ffffff` |
| 표면 2 (칩·코드) | `--ms-surface2` | `#1b1b20` | `#e9ebe5` |
| 테두리 | `--ms-line2` | `#33333b` | `#c5c9bd` |
| 본문 | `--ms-ink` | `#f4f4f5` | `#151713` |
| 보조 텍스트 | `--ms-mut` | `#9a9aa2` | `#676b61` |
| **액센트** | `--ms-accent` | **`#c8fa46`** | **`#151713`** |
| 보조 · 정보 | `--ms-cyan` | `#5fe3d0` | `#1f6b60` |
| 보조 · 경고 | `--ms-danger` | `#ff9d85` | `#a8402a` |

각 색에는 배경용 `-soft`, 테두리용 `-line` 변형이 있습니다 (`--ms-accent-soft` 등).

> ⚠️ **라이트 모드에 라임을 남기지 마세요.** 밝은 배경 위 라임은 대비가 무너집니다. 액센트가 근-검정으로 바뀌는 것이 이 시스템의 규칙입니다.

---

## 3. 서체

**Pretendard 하나**로 제목·본문·라벨을 모두 처리합니다. 서체를 늘리는 대신 **굵기 대비(800 ↔ 450)와 자간**으로 위계를 만듭니다.

| 역할 | 굵기 | 자간 |
|---|---|---|
| h1 | 800 | `-0.035em` |
| h2 | 800 | `-0.025em` |
| h3 · 카드 제목 | 750 | `-0.025em` |
| 본문 | 450 | `-0.01em` |
| 섹션 라벨 | 700 | `0.09em` + `uppercase` |

> ⚠️ Pretendard에는 **진짜 이탤릭이 없습니다.** `font-style:italic`을 쓰면 브라우저가 억지로 기울여 그려 품질이 떨어집니다. 강조는 굵기나 색으로 하세요.

---

## 4. 컴포넌트

| 클래스 | 쓰임 |
|---|---|
| `.ms-btn` `--primary` `--ghost` `--sm` | 버튼 |
| `.ms-chip` `.is-on` | 다중 선택 칩 |
| `.ms-tag` `--accent` `--cyan` `--danger` `--mute` `--solid` | 상태 라벨 |
| `.ms-card` | 표면 패널 |
| `.ms-note` `--info` `--warn` `--danger` | 알림 (심각도 3단) |
| `.ms-readme` | **"이건 무엇을 보는 것인가"** 안내 한 줄 |
| `.ms-adv` | 접이식 상세 (고급 정보 숨김) |
| `.ms-kv` | 키-값 표 |
| `.ms-code` | 코드 블록 |
| **`.ms-flow`** | **흐름 맵 — 지금 어느 단계인지** |
| **`.ms-spec`** | **스펙트럼 — 어느 쪽으로 얼마나** |
| `.ms-layer` `--1` `--2` | 레이어 헤더 |
| `.ms-steps` | 단계 목록 (`--cut` / `--up` 라벨 지원) |
| `.ms-field` `.ms-input` `.ms-select` `.ms-hint` | 입력 |
| `.ms-progress` `.ms-bar` `.ms-toast` | 진행·피드백 |
| `.ms-theme-toggle` | 우상단 다크/라이트 토글 |
| `.ms-glow` | 히어로 배경 글로우 |

### 시그니처 두 개

이 시스템을 다른 것과 구별되게 만드는 요소입니다.

**흐름 맵** — 여러 단계를 거치는 제품에서 지금 어디쯤인지 보여줍니다. 화면마다 같은 지도를 같은 자리에 반복해 두면, 각 화면이 전체의 한 칸으로 읽힙니다.

**스펙트럼** — 이분법 라벨(A형/B형) 대신 **어느 쪽으로 얼마나** 기울었는지를 위치로 보여줍니다. 가운데에 가까우면 "거의 반반"을 띄워 단정을 피합니다.

```js
// 마커 위치 — 양 끝에서 점이 트랙 밖으로 나가므로 클램프한다
const pct = Math.max(4, Math.min(96, Math.round(b / (a + b) * 100)));
```

---

## 5. 테마 토글

`localStorage`에 선택값만 기억하고, 기본은 다크입니다. OS 설정을 따르지 않습니다 (이 시스템은 다크가 기본 정체성이라서).

```js
const KEY = 'ms.theme';
function applyTheme(t){ document.documentElement.setAttribute('data-theme', t); }

let t = null;
try { t = localStorage.getItem(KEY); } catch(e) {}
applyTheme(t === 'light' || t === 'dark' ? t : 'dark');

toggleBtn.onclick = () => {
  const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  applyTheme(next);
  try { localStorage.setItem(KEY, next); } catch(e) {}
};
```

버튼 라벨은 **누르면 갈 모드**를 표시합니다 (다크일 때 "Light").

---

## 6. 쓸 때 지킬 것

1. **액센트는 하나.** 라임을 여기저기 쓰면 강조가 사라집니다. 한 화면에서 서너 군데면 충분합니다.
2. **라이트 모드에 라임 금지.** 액센트를 근-검정으로 바꿉니다.
3. **데이터 앞에 안내 한 줄.** `.ms-readme`로 "이건 무엇을 보는 것인가"를 먼저 말합니다.
4. **내부 자료구조는 접습니다.** 배열·키 이름을 그대로 노출하지 말고 `.ms-adv` 안에 넣고, 바깥에는 그게 무슨 일을 하는지 문장으로 씁니다.
5. **이분법 대신 스펙트럼.** 값이 연속적이면 라벨 하나로 찍지 말고, 애매하면 애매하다고 표시합니다.
6. **단계가 있으면 지도를 반복합니다.**
7. **사용자 문구에 개발 용어 금지.** 스키마명·API명 대신 무엇을 어디에 넣는지로 씁니다.
8. **서체를 늘리지 않습니다.**

---

## 7. 접근성 · 반응형

기본으로 들어가 있습니다.

- 키보드 포커스 링 (`:focus-visible` → 액센트 2px)
- `prefers-reduced-motion` 존중 (애니메이션 사실상 정지)
- 640px 이하에서 흐름 맵은 세로로 쌓이고 화살표가 회전, 스펙트럼·레이어 헤더도 단일 컬럼으로 전환
- `@media print`에서 토글·진행바·토스트 숨김

---

## 8. 출처

이 시스템은 `mono-signal-guide-deck` 스킬의 **시각 언어**(색·서체·선·여백·다크·라이트 토글)에서 출발했습니다. 다만 그 스킬은 16:9 슬라이드 덱용이라 슬라이드 무대·키보드 전용 네비·클릭 이동 금지 같은 규칙이 함께 있는데, 인터랙티브 웹앱에서는 그 구조를 쓰면 앱이 동작하지 않으므로 **제외했습니다.**

흐름 맵·스펙트럼·`.ms-readme`·`.ms-layer`·`.ms-steps`는 이 앱에서 새로 만든 것입니다.
