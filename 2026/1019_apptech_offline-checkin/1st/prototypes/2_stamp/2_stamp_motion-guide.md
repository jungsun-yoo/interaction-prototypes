# 2_stamp · 스탬프 적립 보드 — 모션 가이드

> 개발 전달용 모션 가이드입니다. 경로는 `prototypes/` 폴더 기준입니다.

- 프로토타입: `2_stamp.html`
- Figma: https://www.figma.com/design/cIgBZWB46ht7WvX5kbPkgx/%EC%95%B1%ED%85%8C%ED%81%AC-2.0?node-id=79075-224680
- 수정일: 2026-11-19

## 전달 범위

| 항목 | 처리 |
|---|---|
| 스탬프 스케일 모션 | **코드로 처리** (아래 1) |
| 콘페티 | **로티 제공** (`2_stamp/lottie/stampConfetti.json`) |
| 반복 | 콘페티 재생과 스탬프 모션을 **동시에 반복 재생** (아래 3) |

---

## 핵심

- 적립된 스탬프 마크에서 **스탬프 이미지 스케일 모션**과 **콘페티 로티(stampConfetti)** 가 **동시에** 시작합니다.
- 두 모션은 **3.2초 간격으로 계속 반복**됩니다.
- 매 반복마다 두 모션을 **0초부터 함께 다시 시작**합니다. 각자 따로 루프를 돌리지 않으므로 반복 횟수와 관계없이 싱크가 어긋나지 않습니다.

---

## 타임라인 (한 주기 = 3.2초)

| 구간 | 스탬프 스케일 | 콘페티 로티 |
|---|---|---|
| 0 ~ 0.5s | 재생 (100 → 90 → 110 → 100%) | 재생 |
| 0.5 ~ 2.5s | 100% 유지 | 재생 |
| 2.5 ~ 3.2s | 100% 유지 | 정지 (마지막 프레임, 보이는 입자 없음) |
| 3.2s | **둘 다 0초부터 다시 시작** | |

---

## 1. 스탬프 이미지 스케일 모션

| 항목 | 값 |
|---|---|
| 대상 | 적립된 스탬프 마크 이미지 (64 × 64) |
| 기준점 | 이미지 중앙 (`transform-origin: center`) |
| 길이 | 0.5s, 1회 재생 (반복은 아래 3번의 주기로 처리) |
| 이징 | 모든 구간 `cubic-bezier(0.333, 0, 0.667, 1)` — MDS `power1-easeInOut` |

| 시간 | 0s | 0.117s (7f) | 0.267s (16f) | 0.5s |
|---|---|---|---|---|
| scale | 100% | 90% | 110% | 100% |

```css
:root {
  --mds-motion-power1-easeInOut: cubic-bezier(0.33, 0, 0.67, 1);
}

.stamp__mark-img.is-playing {
  animation: stampPop 0.5s var(--mds-motion-power1-easeInOut) both;
}

@keyframes stampPop {
  0%      { transform: scale(1); }
  23.333% { transform: scale(0.9); }   /* 0.117s (7f) */
  53.333% { transform: scale(1.1); }   /* 0.267s (16f) */
  100%    { transform: scale(1); }     /* 0.5s */
}
```

## 2. 콘페티 로티 (stampConfetti)

| 항목 | 값 |
|---|---|
| 파일 | `2_stamp/lottie/stampConfetti.json` |
| 원본 크기 | 360 × 360 (3배수) |
| 표시 크기 | **120 × 120** |
| 반복 | 로티 자체 반복 끔 (`loop: false`) — 반복은 아래 3번의 주기로 처리 |
| 위치 | 스탬프 이미지 **중앙 기준**, 스탬프 위에 겹침 (스탬프보다 상하좌우 28px씩 큼) |
| 터치 | 통과 (`pointer-events: none`) |

- 첫 프레임과 마지막 프레임에는 보이는 입자가 없습니다. 재생이 끝나고 다음 주기까지 대기하는 동안 화면에 입자가 남지 않습니다.

```css
.stamp__mark-lottie {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 120px;
  height: 120px;
  transform: translate(-50%, -50%);
  pointer-events: none;
}
```

---

## 3. 동시 실행 · 3.2초 반복

1. 로티 데이터 로드가 끝나면(`DOMLoaded`) 첫 주기를 바로 시작합니다.
2. 한 주기 = 로티를 0프레임부터 재생 + 스탬프 스케일을 처음부터 재생.
3. 이후 `REPEAT_INTERVAL`(3200ms)마다 2번을 반복합니다.

```js
const REPEAT_INTERVAL = 3200; // 반복 간격(ms)

const confetti = lottie.loadAnimation({
  container: document.getElementById('stampConfetti'),
  renderer: 'svg',
  loop: false,
  autoplay: false,
  path: '2_stamp/lottie/stampConfetti.json'
});

let stampPop = null;
const playCycle = () => {
  confetti.goToAndPlay(0, true);                 // 로티 0프레임부터
  if (!stampPop) {
    stampImg.classList.add('is-playing');        // 첫 주기: 스케일 애니메이션 시작
    stampPop = stampImg.getAnimations().find((a) => a.animationName === 'stampPop') || null;
  } else {
    stampPop.currentTime = 0;                    // 이후 주기: 처음부터 다시
    stampPop.play();
  }
};

confetti.addEventListener('DOMLoaded', () => {
  playCycle();
  setInterval(playCycle, REPEAT_INTERVAL);
});
```

---

## 구현 시 참고

- **반복 간격은 로티 길이(약 2.5s)보다 길어야** 합니다. 더 짧으면 로티가 끝나기 전에 다시 시작합니다.
- 스탬프 스케일(0.5s)은 반복 간격과 상관없이 같은 속도로 재생됩니다. 간격을 바꿔도 키프레임 수정은 필요 없습니다.
- 화면을 벗어나거나 앱이 백그라운드로 가면 반복을 멈추고, 돌아왔을 때 새 주기로 시작하는 것을 권장합니다. 브라우저가 숨겨진 탭의 타이머를 늦추기 때문입니다.
- 접근성: 사용자 기기에서 '동작 줄이기'가 켜져 있으면(`prefers-reduced-motion: reduce`) 두 모션을 모두 생략하는 것을 권장합니다.
- 로티 길이는 150프레임으로 2.5초입니다. 반복에는 영향이 없습니다.

## 리소스

| 파일 | 설명 |
|---|---|
| `2_stamp.html` | 마크업 |
| `2_stamp/2_stamp.css` | 스탬프 스케일 키프레임, 로티 영역 |
| `2_stamp/2_stamp.js` | 반복 재생 스크립트 |
| `2_stamp/img/boardContent.png` | 스탬프 보드 (1029 × 1197, 3배수 → 343 × 399) |
| `2_stamp/lottie/stampConfetti.json` | 콘페티 로티 |
| `2_stamp/img/stamp-mark/*.png` | 매장별 스탬프 이미지 (192 × 192, 3배수 → 64 × 64 표시) |

---
🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
