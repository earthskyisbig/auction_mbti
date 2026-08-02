---
name: publish-site
description: 경매 투자성향 테스트 웹(index.html)을 사본(부동산투자성향테스트.html)과 동기화하고, 사용자가 원할 때만 GitHub에 커밋·푸시해 공개 사이트(GitHub Pages)를 갱신하는 방법. "사이트 배포", "index 동기화", "배포해줘", "공개 사이트 업데이트", "Pages 갱신"을 요청할 때 사용하라.
---

# 사이트 배포 (동기화 → 푸시)

`index.html`이 정본이고 `부동산투자성향테스트.html`은 같은 내용의 사본이다. GitHub Pages는 `index.html`을 서빙한다.

## ⚠️ 먼저 확인 — 브랜치와 의사

이 리포는 **공개(PUBLIC)**다. 푸시하면 즉시 공개 사이트에 반영된다.

1. **현재 브랜치를 확인한다.** `lecture-base`(실습용) 등 `main`이 아닌 브랜치에서 작업 중이면 **푸시하지 않는다.** 실습 산출물을 공개본에 덮어쓰는 사고가 난다.
   ```bash
   git branch --show-current
   ```
2. **사용자가 배포를 명시적으로 원할 때만** 실행한다. 웹만 재빌드한 상황이면 스크립트를 돌리지 말고 배포 여부를 물어라.
3. 배포 전 로컬에서 한 번 열어 확인한다(`python -m http.server 8899`).

## 하는 일 (scripts/publish.sh)

1. `index.html` → `부동산투자성향테스트.html` 동기화(두 파일 내용 일치)
2. `git add -A` (`_workspace/` 산출물 포함)
3. 변경 없으면 커밋·푸시 생략
4. 변경 있으면 커밋 후 `origin main` 푸시

```bash
.claude/skills/publish-site/scripts/publish.sh ["커밋 메시지"]
```

메시지를 생략하면 타임스탬프가 붙는다. 의미 있는 변경이면 메시지를 넘겨라(예: `publish.sh "3축 8유형 개편"`).

> 스크립트가 v1 기준(`부동산투자성향테스트.html` → `index.html` 방향)이면 **복사 방향을 뒤집어** 갱신한다. v2는 `index.html`이 정본이다.

## 배포 후

- 공개 URL: https://earthskyisbig.github.io/auction_mbti/ (반영까지 1~2분)
- 확인: `curl -s -o /dev/null -w "%{http_code}" https://earthskyisbig.github.io/auction_mbti/`

## 확장

리모트·브랜치가 바뀌면 `scripts/publish.sh`의 `git push origin main`과 이 문서의 URL을 갱신한다.
