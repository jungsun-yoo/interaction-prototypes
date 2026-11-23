# 하이라이트 보더 — 모션 가이드

> 개발 전달용 모션 가이드입니다. 값은 MDS 모션 토큰(`src/common/mds-motion.css`) · MDS 2.0 컬러 기준입니다.
> 여러 화면에서 같이 쓰는 **공통 효과**입니다. 첫 적용: 무신사 홈 퀵메뉴 1번 항목(`Type_1.html`).

- 코드: `src/common/highlightborder/highlightborder.css` (웹). 앱은 아래 4 '앱 구현'
- 기준: 무신사 칩스 · 아웃라인탭에 적용된 하이라이트 효과와 같음 = 2024 가이드 `border-ani.html` 의 **CSS background 타입**
  - 칩스: 무신사 웹 카테고리 필터칩 '스토어'에서 운영 코드를 직접 확인 (2026-11-23)
  - 아웃라인탭: 같은 효과로 전달받음 (운영 코드는 직접 확인하지 않음)
- 수정일: 2026-11-23

## 전달 범위

| 항목 | 처리 |
|---|---|
| 테두리 그라디언트 흐름 | **코드로 처리** (CSS 배경 위치 애니메이션, 아래 1) |
| 로티 · 이미지 | 없음 |

---

## 이 화면의 핵심 모션 — 이것만 구현

1. **하이라이트 보더 흐름** — 3s · `mds.power1.easeIn` · 무한 반복 (본문 1)

그 외 파일은 프로토타입 확인용입니다 (`common.*` 폰 프레임 · 상태바, 퀵메뉴 이미지 · 목업 등).
실서비스로 바꿀 값: 어느 항목에 켤지(퀵메뉴 1~4번 중 운영에서 지정) — 프로토타입은 1번에 고정.

---

## 1. 하이라이트 보더 흐름

### 한눈에

액자 뒤에 액자보다 1px 큰 그라디언트 종이를 대고, 액자 바탕이 안쪽을 덮어 **가장자리 1px 만** 그라디언트가 보이게 합니다. 그 종이를 옆으로 밀어 테두리 위로 빛이 흐르는 것처럼 보이게 합니다. 테두리 선을 그리거나 회전시키지 않습니다.

```
 ┌──────────────────────────┐  ← ::before  그라디언트 판 (요소보다 테두리 두께만큼 큼, z -2)
 │┌────────────────────────┐│
 ││ ::after  요소 바탕(흰색) ││  ← 테두리 안쪽을 덮음 (z -1)
 ││   [아이콘] 글자          ││  ← 요소 내용 (가장 위)
 │└────────────────────────┘│
 └──────────────────────────┘
   └ 1px 틈 = 투명 테두리 자리 → 여기로만 그라디언트가 보임
```

### 값

| 항목 | 값 |
|---|---|
| 테두리 두께 | 1px |
| 모서리 | 바깥 4px · 안쪽 3px (바깥 − 두께) |
| 그라디언트 | 145°, gray300 `#E0E0E0` 13.15% → `#98F3FF` 31.72% → blue `#245EFF` 50.28% → `#98F3FF` 68.85% → gray300 `#E0E0E0` 87.42% |
| 그라디언트 크기 | 가로 300% · 세로 100% (요소 폭의 3배로 깔고 반복) |
| 움직임 | `background-position-x` 300% → 0 |
| 시간 · 이징 | 3s · `mds.power1.easeIn` (`cubic-bezier(0.11, 0, 0.5, 0)`) · 무한 반복 |
| 안쪽 바탕 | 요소 원래 바탕색 (퀵메뉴는 흰색 `#FFF`. 무신사 웹 필터칩은 gray100 `#F5F5F5`) |

`#98F3FF` 는 MDS 팔레트에 없는 색이라 값으로 적었습니다 (MDS 하이라이트 `#A3F8FB` 와 다름. 운영 중인 값 그대로).

### 움직임 풀이

- 배경 위치 `%` 는 `(요소 폭 − 그림 폭) × %` 만큼 그림을 옮깁니다. 그림 폭이 3배(300%)라 `(1 − 3) × 폭 × %` → 300% 일 때 −6배 폭, 0% 일 때 0.
- 그래서 3초 동안 그라디언트가 **왼쪽에서 오른쪽으로 요소 폭의 6배** 이동합니다. 그림은 3배 폭 단위로 반복되므로 **한 번 반복에 파란 빛이 두 번** 지나갑니다.
- `power1.easeIn` 이라 처음엔 느리게 시작해 끝으로 갈수록 빨라집니다 (첫 번째 빛은 천천히, 두 번째는 빠르게). 끝 위치(0)와 처음 위치(300%)는 무늬가 같은 자리여서 반복할 때 끊김이 없습니다.

화면 확인 (2026-11-23, 프로토타입 1번 항목): 이동 진행률(이징 적용 전)별로 멈춰 놓고 비교하면 0% · 50% · 100%, 25% · 75%, 37.5% · 87.5% 가 각각 같은 모습입니다 → 진행률 50% 마다 무늬가 한 바퀴, 한 번 반복에 두 번.

| 이동 진행률 | 파란 빛 위치 |
|---|---|
| 0% · 50% · 100% | 오른쪽 끝 (오른쪽 아래 모서리) |
| 12.5% · 62.5% | 없음 (하늘색 · 회색만) |
| 25% · 75% | 왼쪽 |
| 37.5% · 87.5% | 가운데 아래 → 오른쪽 위 |

실제 시간으로는 이징 때문에 첫 바퀴(진행률 0 → 50%)에 약 2.1초, 두 번째 바퀴(50 → 100%)에 약 0.9초가 걸립니다 (`cubic-bezier(0.11, 0, 0.5, 0)` 에서 진행률 50% 가 되는 시점 ≈ 70%).

---

## 2. 코드

### 쓰는 법

테두리를 줄 요소에 클래스 하나만 붙입니다.

```html
<span class="quick-menu-item highlight-border">…</span>
```

요소 바탕이 흰색이 아니면 안쪽 바탕만 맞춥니다.

```css
.filter-chip.highlight-border { --highlight-border-bg: var(--mds-color-gray100); }
```

### CSS 전체

```css
.highlight-border {
  --highlight-border-width: 1px;
  --highlight-border-radius: 4px;
  --highlight-border-bg: #fff;
  --highlight-border-duration: 3s;
  --highlight-border-easing: var(--mds-motion-power1-easeIn);
  --highlight-border-gradient: linear-gradient(145deg,
    var(--mds-color-gray300) 13.15%, #98F3FF 31.72%, var(--mds-color-blue) 50.28%,
    #98F3FF 68.85%, var(--mds-color-gray300) 87.42%);

  position: relative;
  isolation: isolate;
  border: var(--highlight-border-width) solid transparent;
  border-radius: var(--highlight-border-radius);
}
.highlight-border::before {              /* 뒤판: 그라디언트 */
  content: '';
  position: absolute;
  inset: calc(var(--highlight-border-width) * -1);
  z-index: -2;
  border-radius: var(--highlight-border-radius);
  background-image: var(--highlight-border-gradient);
  background-size: 300% 100%;
  background-position: 300% 0;
  animation: highlight-border-flow var(--highlight-border-duration) var(--highlight-border-easing) infinite;
  pointer-events: none;
}
.highlight-border::after {               /* 앞판: 요소 바탕 */
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  border-radius: calc(var(--highlight-border-radius) - var(--highlight-border-width));
  background: var(--highlight-border-bg);
  pointer-events: none;
}
@keyframes highlight-border-flow {
  0%   { background-position: 300% 0; }
  100% { background-position: 0 0; }
}
```

### 바꿀 수 있는 값 (CSS 변수)

| 변수 | 기본값 | 바꿀 때 |
|---|---|---|
| `--highlight-border-bg` | `#fff` | 요소 바탕이 흰색이 아닐 때 (반드시 원래 바탕과 같게) |
| `--highlight-border-radius` | `4px` | 요소 모서리가 다를 때 |
| `--highlight-border-width` | `1px` | 두께를 바꿀 때 (기본 가이드는 1px) |
| `--highlight-border-duration` · `--highlight-border-easing` · `--highlight-border-gradient` | 위 값 | 바꾸지 않음 (공통 효과 값) |

### 하나씩 왜 이렇게 했나

| 코드 | 이유 |
|---|---|
| `border: 1px solid transparent` | 테두리 자리 1px 를 비워 둡니다. 요소 크기는 원래 테두리가 있을 때와 같습니다. 요소에 원래 테두리가 없었다면 사방 1px 씩 커집니다. |
| `::before` `inset: -1px` | 가상 요소의 기준은 테두리 **안쪽**이라, 테두리 두께만큼 밖으로 늘려야 테두리 자리까지 덮습니다. |
| `::after` `inset: 0` · 모서리 3px | 테두리 안쪽만 바탕으로 덮어 1px 만 남깁니다. 바깥 모서리 4 − 두께 1 = 3 이어야 모서리 두께도 1px 로 고릅니다. |
| `z-index: -2 / -1` + `isolation: isolate` | 두 판을 요소 내용(아이콘 · 글자) **뒤**에 둡니다. `isolation` 이 없으면 음수 z-index 판이 요소 밖(부모 바탕 뒤)으로 내려가 안 보입니다. |
| `background-size: 300%` + 위치 이동 | 그라디언트를 3배로 깔아 일부만 보이게 하고, 위치만 옮겨 빛이 흐르는 것처럼 보이게 합니다. 회전 · 마스크가 없어 지원 브라우저가 넓습니다. |
| 변수 이름 | 그라디언트 · 시간 · 이징은 공통 값이라 바꾸지 않고, 요소마다 다른 바탕 · 모서리만 변수로 엽니다. |

### 무신사 웹 · 2024 가이드와 비교

| | 무신사 웹 (운영) | 2024 가이드 background 타입 | 이 코드 |
|---|---|---|---|
| 그라디언트 · 크기 · 시간 · 이징 | 위 값 | 같음 | 같음 |
| 만드는 곳 | 요소 자신의 `::before` · `::after` | 요소 안에 `div.border` 를 추가하고 그 `::before` · `::after` | 요소 자신의 `::before` · `::after` (운영과 같음) |
| 모서리 자르기 | 판마다 radius | 요소 `overflow: hidden` | 판마다 radius (요소 바깥 그림자 · 툴팁이 잘리지 않음) |
| 안쪽 바탕 | gray100 고정 | gray100 고정 | 변수 (`--highlight-border-bg`) |

2024 가이드의 다른 타입(**CSS translate**: 그라디언트 판 2장을 `transform` 으로 1.5s 에 흘림, 투명도 50%)은 운영에 쓰이지 않았고 이 코드에도 없습니다.

---

## 3. 주의

- **요소 안에 `::before` · `::after` 를 이미 쓰고 있으면 겹칩니다.** 그런 요소는 안쪽에 감싸는 요소를 하나 두고 거기에 클래스를 붙입니다.
- **안쪽 바탕색을 꼭 맞춥니다.** 요소 바탕과 `--highlight-border-bg` 가 다르면 안쪽 색이 바뀌어 보입니다.
- **성능:** 배경 위치 애니메이션은 매 프레임 그 요소를 다시 그립니다. 한 화면에 몇 개(퀵메뉴 1~4번) 정도는 문제없지만, 목록 전체처럼 수십 개에 켜는 용도는 아닙니다.
- **움직임 줄이기 설정:** 운영 코드에는 없습니다. 필요하면 아래를 추가해 OS '동작 줄이기'를 켠 사용자에게는 멈춘 그라디언트 테두리만 보입니다.

  ```css
  @media (prefers-reduced-motion: reduce) {
    .highlight-border::before { animation: none; }
  }
  ```
- **불러오는 순서:** `highlightborder.css` 는 각 영역 CSS **뒤에** 불러옵니다. 요소에 원래 있던 테두리 색(gray200 등)을 투명으로 덮어야 하기 때문입니다.

---

## 4. 앱 구현 (iOS · Android)

웹과 같은 모습이 나오게 하는 방법입니다. 플랫폼 코드는 프로토타입에서 실행해 보지 않았으므로 **방법 · API 안내**로 봐 주세요.

### 플랫폼 공통 — 이렇게 만들면 웹과 같음

웹의 '배경을 3배로 깔고 위치 이동'은 아래와 똑같습니다.

1. **그라디언트 타일 1장:** 크기 = 요소 폭 **W** × 3, 요소 높이 **H** (테두리 포함 바깥 크기). 그 안에 145° 그라디언트 (색 · 위치는 1의 값 표).
2. **띠:** 타일 3장을 가로로 이어 붙임 → 폭 9W.
3. **잘라 보이기:** 띠를 요소 테두리 모양(두께 1, 바깥 모서리 4)으로만 보이게 잘라냄 (마스크 · 클립).
4. **이동:** 띠의 x 위치를 **−6W → 0** 으로 3s · `mds.power1.easeIn` · 무한 반복. 끝 위치와 처음 위치는 무늬가 같아 끊김 없음.
5. 테두리 안쪽은 원래 요소 바탕이 그대로 보임 (테두리만 그리면 안쪽을 덮을 필요 없음).

145° 그라디언트의 시작 · 끝점 (타일 기준, 웹 `linear-gradient` 계산과 같음):

```
a = 145°, 타일 폭 Tw = 3W, 높이 H
방향 (dx, dy) = (sin a, −cos a)        // 0° = 위, 시계 방향. y 는 아래로 +  → (0.574, 0.819)
길이 L = |Tw · sin a| + |H · cos a|
가운데 C = (Tw / 2, H / 2)
시작 = C − (dx, dy) · L / 2,  끝 = C + (dx, dy) · L / 2
색 위치 13.15% · 31.72% · 50.28% · 68.85% · 87.42% 는 시작 → 끝 사이 비율
```

### iOS (UIKit · Core Animation)

| 단계 | API |
|---|---|
| 타일 · 띠 | `CAGradientLayer` 3개 (각 3W × H, `startPoint` · `endPoint` 는 위 시작 · 끝점을 0~1 로 나눈 값, `locations` = 색 위치) 를 담는 컨테이너 `CALayer` (9W × H) |
| 잘라 보이기 | 요소 레이어에 `mask` = `CAShapeLayer` (`path` = 1px 안쪽으로 0.5 들인 둥근 사각형, 모서리 3.5 · `lineWidth` 1 · `strokeColor` 불투명 · `fillColor` 투명). 띠 컨테이너는 이 마스크를 가진 레이어 안에 |
| 이동 | `CABasicAnimation(keyPath: "transform.translation.x")` from −6W to 0, `duration` 3, `repeatCount = .infinity`, `timingFunction` = MDS `power1.easeIn` (`CAMediaTimingFunction(controlPoints: 0.11, 0, 0.5, 0)`) |
| 크기 바뀜 | `layoutSubviews` 에서 W · H 로 타일 · 마스크 경로를 다시 계산 |

SwiftUI 라면: `LinearGradient` 3장을 `HStack(spacing: 0)` 으로 이어 `offset(x:)` 를 애니메이션하고, `.mask(RoundedRectangle(cornerRadius: 4).strokeBorder(lineWidth: 1))` 로 테두리 모양만 보이게.

### Android (Jetpack Compose)

| 단계 | API |
|---|---|
| 진행률 | `rememberInfiniteTransition().animateFloat(0f, 1f, infiniteRepeatable(tween(3000, easing = CubicBezierEasing(0.11f, 0f, 0.5f, 0f))))` (MDS `power1.easeIn`) → 띠 x = −6W × (1 − 진행률) |
| 잘라 보이기 | `Modifier.drawWithCache` 에서 테두리 모양 `Path` 를 만들고 (바깥 둥근 사각형 − 1px 안쪽 둥근 사각형, `PathOperation.Difference`) `clipPath(path)` |
| 타일 · 띠 | 클립 안에서 `drawRect(brush, topLeft = Offset(x + 3W × i, 0f), size = Size(3W, H))` 를 i = 0, 1, 2 로 3번. `brush` = `Brush.linearGradient(colorStops = 색 위치 to 색, start, end)` — 시작 · 끝점은 위 공식 + 타일 x |

`Modifier.border(brush = …)` 에 `TileMode.Repeated` 로 한 번에 그리는 방법도 있지만, 반복이 그라디언트 방향(사선)으로 일어나 웹의 가로 반복과 빛의 간격 · 속도가 조금 달라집니다. 웹과 똑같이 하려면 위처럼 타일 3장을 그립니다.

### 플랫폼 공통 확인 항목

- 테두리 두께 1 (pt · dp), 바깥 모서리 4, 안쪽 모서리 3
- 3초 동안 왼쪽 → 오른쪽으로 파란 빛이 두 번 (첫 번째 약 2.1초, 두 번째 약 0.9초)
- 반복할 때 끊기거나 튀지 않음
