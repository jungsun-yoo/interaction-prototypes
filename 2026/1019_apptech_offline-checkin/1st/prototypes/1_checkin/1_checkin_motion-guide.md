# 1_checkin · 체크인 (스탬프 → 코인) — 모션 가이드

> 개발 전달용 모션 가이드입니다. 경로는 `prototypes/` 폴더 기준입니다.

- 프로토타입: `1_checkin.html`
- Figma: https://www.figma.com/design/cIgBZWB46ht7WvX5kbPkgx/%EC%95%B1%ED%85%8C%ED%81%AC-2.0?node-id=79075-224680
- 수정일: 2026-11-19

## 전달 범위

| 항목 | 처리 |
|---|---|
| 콘페티 | **로티 제공** (`1_checkin/lottie/confetti.json`) |
| 스탬프 · 무신사머니 코인 | **코드로 처리** (아래 1~3, 5) |

---

## 핵심

- 매장에서 체크인하면 **매장 스탬프가 "쾅" 찍히고**, 그 스탬프가 **Y축으로 뒤집히며 무신사머니 코인으로 바뀝니다.**
- 코인으로 바뀌는 시점에 **콘페티가 1회** 터집니다.
- 전체 시퀀스는 **반복 없이 1회** 재생되며 약 **1.5초**에 동작이 끝나고, 콘페티는 그 뒤에도 끝까지 재생됩니다(약 2.7초).
- 2D 도장(스탬프)과 3D 코인을 자연스럽게 잇기 위해, **스탬프와 코인을 한 장의 앞면·뒷면**으로 두고 뒤집는 방식으로 구현했습니다.

---

## 타임라인 (시퀀스 시작 기준)

| 시간 | 스탬프 | 코인 | 기타 |
|---|---|---|---|
| 0 → 0.3s | 140% → **90%** 로 눌림, 투명 0 → 100% | 숨김 | |
| 0.3 → 0.6s | 90% → 100% 로 복귀 | 숨김 | **잔상** 시작 (0.3 → 1.4s) |
| 1.0s | Y축 회전 시작 (0° → -180°) | | |
| **1.25s** (90°) | 숨김 | **나타남** | 면 교체 |
| **1.3s** | | | **콘페티 시작** (약 2.7초) |
| 1.5s | | 회전 끝, 정면 | 시퀀스 동작 종료 |

> 프로토타입에서는 로드 완료 후 **0.5초** 뒤에 시퀀스를 시작합니다(`START_DELAY`). 실제 앱에서는 **체크인 완료 다이얼로그가 열린 시점**을 0초로 맞추는 것을 권장합니다.

---

## 레이어 구조

```
checkin__visual            ← .is-playing 이 붙으면 시퀀스 시작, 타이밍 변수(--t-*) 보관
├─ checkin__glow           배경 글로우 (정적, 모션 없음)
├─ checkin__token          스탬프/코인 자리 110×110
│  └─ checkin__press       1) 스탬프 쾅 — 눌림 스케일 (2D)
│     ├─ checkin__echo     2) 잔상 — 스탬프와 같은 이미지, 스탬프 뒤에서 커지며 사라짐 (회전 안 함)
│     └─ checkin__stage    원근(perspective 300px) — 3D 는 이 안에서만
│        └─ checkin__flip  3) Y축 뒤집기
│           ├─ face--stamp 앞면: 매장 스탬프 이미지 (+ 등장 투명도)
│           └─ face--coin  뒷면: 코인 이미지 (미리 rotateY(180deg))
└─ checkin__confetti       4) 콘페티 로티 (코인 위, 코인 중심보다 24px 아래)
```

---

## 1. 스탬프 쾅 (press)

| 항목 | 값 |
|---|---|
| 대상 | `checkin__press` (스탬프 + 잔상을 함께 스케일) |
| 길이 | 0.6s |
| 키 | 0s **140%** → 0.3s **90%** → 0.6s **100%** |
| 이징 | 0 → 0.3s `cubic-bezier(1, 0, 0.8, 1)` (천천히 → 빠르게 "쾅") / 0.3 → 0.6s `cubic-bezier(0.2, 0, 0, 1)` (빠르게 → 천천히 복귀) |
| 등장 | 스탬프 이미지 투명 0 → 100%, 0.3s, linear |

```css
.is-playing .checkin__press { animation: stampPress 0.6s both; }

@keyframes stampPress {
  0%   { scale: 1.4; animation-timing-function: cubic-bezier(1, 0, 0.8, 1); }
  50%  { scale: 0.9; animation-timing-function: cubic-bezier(0.2, 0, 0, 1); }
  100% { scale: 1; }
}

.is-playing .checkin__stamp { animation: stampFade 0.3s linear both; }
```

> 시작 전에는 스탬프가 보이지 않도록 `.checkin__stamp { opacity: 0 }` 이 기본값입니다.

---

## 2. 스탬프 잔상 (echo)

| 항목 | 값 |
|---|---|
| 대상 | `checkin__echo` (현재 스탬프와 같은 이미지) |
| 시작 / 길이 | 0.3s (`--t-echo`, 스탬프가 가장 눌린 순간) / 1.1s |
| 크기 | 100% → 120%, `cubic-bezier(0.167, 0.167, 0.2, 1)` |
| 투명도 | 50% → 0, `cubic-bezier(0.167, 0.167, 0.667, 1)` |
| 겹침 | 스탬프 **뒤**, 회전하지 않음 |

- 잔상은 `press` 안에 있어 스탬프의 눌림 스케일(90% → 100%)이 함께 곱해집니다.
- 스탬프 이미지가 바뀌면 잔상 이미지도 같은 것으로 바꿔야 합니다.

---

## 3. Y축 뒤집기 (flip)

| 항목 | 값 |
|---|---|
| 대상 | `checkin__flip` |
| 시작 / 길이 | 1.0s (`--t-flip`) / 0.5s (`--d-flip`) |
| 회전 | `rotateY(0deg)` → `rotateY(-180deg)`, **반동 없음** |
| 이징 | `cubic-bezier(0.6, 0, 0.4, 1)` — MDS `power2-easeInOut` |
| 원근 | `perspective: 300px` (`checkin__stage`) |
| 면 교체 | 뒤집기 **50%(1.25s, 90°)** 에서 스탬프 숨김 / 코인 표시 (즉시 전환) |

```css
.is-playing .checkin__flip {
  animation: tokenFlip var(--d-flip) var(--t-flip) var(--mds-motion-power2-easeInOut) both;
}

@keyframes tokenFlip {
  from { transform: rotateY(0deg); }
  to   { transform: rotateY(-180deg); }
}

/* 90° 순간에 면 교체 */
@keyframes faceHide { 0%, 50% { opacity: 1; } 50.1%, 100% { opacity: 0; } }
@keyframes faceShow { 0%, 50% { opacity: 0; } 50.1%, 100% { opacity: 1; } }
```

- 코인 면은 미리 `rotateY(180deg)` 로 뒤집어 두어, 회전이 끝나면(-180°) 정면을 봅니다.
- 90° 는 카드가 가장 얇게 보이는 순간이라 교체가 눈에 띄지 않습니다.

---

## 4. 콘페티 로티

| 항목 | 값 |
|---|---|
| 파일 | `1_checkin/lottie/confetti.json` (622 × 414, 60fps, 162프레임 ≈ 2.7s) |
| 표시 크기 | **311 × 207** (원본의 50%) |
| 위치 | 코인 중심 기준, **24px 아래** |
| 겹침 | 코인 **위** |
| 시작 | **1.3s** (`--t-confetti`), 반복 없음 |

---

## 5. 재생 · 다시 재생

```js
// 시퀀스를 처음부터 재생
const playSequence = () => {
  visual.classList.remove('is-playing');
  void visual.offsetWidth;                 // CSS 애니메이션을 처음부터 다시 시작
  visual.classList.add('is-playing');
  confetti.goToAndStop(0, true);
  setTimeout(() => confetti.goToAndPlay(0, true), cssTimeMs('--t-confetti'));
};
```

- 단계별 시작 시간은 CSS 변수 하나로 관리합니다. JS 는 `--t-confetti` 를 읽어 로티 시작을 맞춥니다.

| 변수 | 값 | 의미 |
|---|---|---|
| `--t-echo` | 0.3s | 잔상 시작 |
| `--t-flip` | 1.0s | 뒤집기 시작 |
| `--d-flip` | 0.5s | 뒤집기 길이 |
| `--t-confetti` | 1.3s | 콘페티 시작 |

---

## 구현 시 참고

- **잔상이 회전 중 앞으로 튀는 문제 방지**: 잔상과 스탬프를 같은 3D 공간에 두면 깊이(Z) 정렬 때문에 회전 시작 시 잔상이 스탬프 앞으로 올라옵니다. 원근(3D)은 `stage` 안에서만 적용하고, `press`·잔상은 2D 로 두어 **레이어 순서로** 겹치게 했습니다.
- **회전 시작 순간 튐 방지**: `checkin__flip` 에 `will-change: transform` 을 주어 회전이 시작될 때 레이어가 새로 만들어지며 깜빡이는 것을 막았습니다.
- **모바일 외곽 계단 현상 방지**: 회전하는 앞·뒷면에 투명 여백 2px(`inset: -2px; padding: 2px`)을 두어, 안티앨리어싱이 없는 레이어 경계가 이미지 테두리에 걸리지 않게 했습니다.
- **스케일은 `scale` 개별 속성**을 사용합니다(transform 과 독립). 지원 범위: iOS Safari 14.5+, Chrome 104+.
- 접근성: 기기에서 '동작 줄이기'(`prefers-reduced-motion: reduce`)가 켜져 있으면 시퀀스를 생략하고 **코인 최종 상태만** 보여주는 것을 권장합니다(프로토타입에는 미적용).

## 리소스

| 파일 | 설명 |
|---|---|
| `1_checkin.html` | 마크업 |
| `1_checkin/1_checkin.css` | 스탬프 쾅 · 잔상 · 뒤집기 · 콘페티 영역 |
| `1_checkin/1_checkin.js` | 시퀀스 재생 스크립트 |
| `1_checkin/img/stamp-mark/*.png` | 매장별 스탬프 (192 × 192 → 110 × 110 표시) |
| `1_checkin/img/coin.png` | 무신사머니 코인 (330 × 330, 3배수 → 110 × 110 표시) |
| `1_checkin/img/info.png` | 하단 안내 텍스트·버튼 (837 × 570, 3배수 → 279 × 190) |
| `1_checkin/lottie/confetti.json` | 콘페티 로티 |

> 인덱스 오른쪽 옵션 카드의 **스탬프** 선택은 프로토타입 확인용(매장별 스탬프 미리보기)이며 실제 구현 대상이 아닙니다.

---
🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
