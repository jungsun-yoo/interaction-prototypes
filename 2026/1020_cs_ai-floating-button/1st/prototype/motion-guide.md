# AIFloating · AI 실시간 채팅 문의 버튼 — 모션 가이드

> 개발 전달용 모션 가이드입니다. 사용자 조작 없이 화면이 열리면 저절로 재생되는 연출만 다룹니다.
> 이징 값은 MDS 모션 토큰(`src/common/mds-motion.css`) 기준입니다.

- 지면: 1:1 문의 내역 / FAQ(고객문의) 바텀 플로팅 버튼
- 프로토타입: `Final.html` (확정 버전)
- 코드: `src/types/ai_floating.css` (버튼 스타일 + 모션 전부, JS 없음)
- 아이콘: `src/img/IconAI.png` (54×54, 3배 · 화면 18×18)
- Figma: [인터랙션 가이드 2.0 · CS AI 버튼](https://www.figma.com/design/ulzq2p4qrgcYi0k89u4Kjp/%EC%9D%B8%ED%84%B0%EB%9E%99%EC%85%98-%EA%B0%80%EC%9D%B4%EB%93%9C-2.0?node-id=11921-61109)
- 수정일: 2026-11-20

## 전달 범위

| 항목 | 처리 |
|---|---|
| AI Border (강조형) | **코드로 처리** · 그라디언트 고정, 모션 없음 (아래 1) |
| AI Title 텍스트 | **코드로 처리** · CSS 애니메이션 (아래 2) |
| AI Icon | **코드로 처리** · CSS 애니메이션 (아래 3), 이미지는 PNG 제공 |

로티 파일은 없습니다.

## 구조

```html
<button class="ai-btn" type="button">
  <img class="ai-btn-icon" src="IconAI.png" width="18" height="18" alt="">
  <span class="ai-btn-text">AI 실시간 채팅 문의</span>
</button>
```

- 버튼: 패딩 12 / 16, 아이콘과 텍스트 사이 2, 모서리 4
- 텍스트: 14 / 20, Medium(500)
- 바텀 플로팅 영역(상단 구분선 · 홈 인디케이터)은 MDS ButtonFloating 그대로 사용

---

## 1. AI Border — 강조형, 모션 없음

| 항목 | 값 |
|---|---|
| 대상 | `.ai-btn` 테두리 1px |
| 색 | `linear-gradient(148deg, #86BAFF 0%, #E476FF 43.75%, #878FFF 100%)` |
| 모션 | 없음 (고정) |

테두리는 `border: 1px solid transparent` 위에 흰 배경(`padding-box`)과 그라디언트(`border-box`)를 겹쳐 그립니다. 그라디언트 값은 CSS 변수 `--ai-btn-border` 하나로 관리합니다.

## 2. AI Title — 그라디언트 이동 + 쉬머

글자에 그라디언트 두 겹을 입히고(`background-clip: text`) 각각 위치를 움직입니다. 두 애니메이션은 동시에 시작해 계속 반복합니다.

| 항목 | 그라디언트 이동 | 쉬머 (빛 효과) |
|---|---|---|
| 그라디언트 | `90deg, #3060FF 0% → #9860FF 50% → #3060FF 100%` (크기 200%) | `100deg, 투명 → 흰색 80% → 투명` (크기 50%) |
| 움직임 | 위치 200% → 0% | 위치 -100% → 200% |
| 시간 | 4s, 무한 반복 | 7s, 무한 반복 |
| 이징 | linear | 0 ~ 2% 대기 → 2 ~ 22% `power3.easeInOut` 으로 지나감 → 22 ~ 100% 대기 |

- 위치 값은 `@property` 로 등록한 변수(`--ai-text-move-x`, `--ai-text-shimmer-x`)를 움직입니다. `@property` 가 없는 환경에서는 글자가 고정 그라디언트로 보입니다.
- 쉬머 7초 중 실제로 빛이 지나가는 시간은 약 1.4초(2 ~ 22%)입니다.

## 3. AI Icon — 등장 1회 → 루프

`transform-origin: center`. 등장이 끝나면 바로 루프로 이어집니다. CSS 에서는 루프 애니메이션에 등장 시간만큼(1.3s) 지연을 주어 연결합니다.

### 등장 (1회, 1.3s)

Scale 과 Rotate 는 동시에 시작하고 구간별 이징이 다릅니다. opacity 는 바꾸지 않습니다.

| 시점 | Scale | 이징 | Rotate | 이징 |
|---|---|---|---|---|
| 0% | 0 | `power3.easeInOut` | -140deg | `cubic-bezier(0.33, 0, 0.2, 0.8)` |
| 25% | 1.2 (오버슈트) | `power1.easeInOut` | | |
| 33% | | | -20deg (오버슈트) | `cubic-bezier(0.5, 1, 0.36, 1)` |
| 100% | 1 | | 0deg | |

Rotate 의 두 곡선은 MDS 토큰에 없는 이 아이콘 전용 값입니다. 토큰으로 바꾸지 않습니다.

### 루프 (등장 직후부터 무한 반복)

Scale 과 Rotate 의 주기를 일부러 다르게 둡니다 (3.5s / 12s). 반복이 눈에 띄지 않게 하려는 것이라 주기를 맞추지 않습니다.

**Scale** — 3.5s, 전 구간 `power1.easeInOut`

| 시점 | 0% | 25% | 75% | 100% |
|---|---|---|---|---|
| Scale | 1 | 0.8 | 1.2 | 1 |

**Rotate** — 12s

| 시점 | Rotate | 다음 구간 이징 |
|---|---|---|
| 0% | 0deg | `power2.easeInOut` |
| 16.67% | 115deg | `power1.easeInOut` |
| 33.33% | 90deg (115 → 90 오버슈트) | `power1.easeInOut` |
| 50% | 0deg | `power1.easeInOut` (50 ~ 66.67% 정지) |
| 66.67% | 0deg | `power2.easeInOut` |
| 83.33% | -30deg | `power1.easeInOut` |
| 100% | 0deg | |

### 트리거

- 등장: 버튼이 화면에 나타날 때 1회
- 루프: 등장이 끝난 직후 시작, 버튼이 사라질 때까지 반복
- 등장 도중 버튼이 사라지면 루프로 넘어가지 않고 끝냅니다

---

## MDS 모션 토큰 값

| 토큰 | 값 |
|---|---|
| `power1.easeInOut` | `cubic-bezier(.33, 0, .67, 1)` |
| `power2.easeInOut` | `cubic-bezier(.6, 0, .4, 1)` |
| `power3.easeInOut` | `cubic-bezier(.33, 0, .2, 1)` |
