# Type_2 · 무배당발 플러스오더 로고 — 모션 가이드

> 개발 전달용 모션 가이드입니다. 사용자 조작 없이 저절로 재생되는 로고 연출만 다룹니다.

- 프로토타입: `Type_2.html`
- Figma: https://www.figma.com/design/ZdWUOnr0E59S3h717fTFpo/-26-3Q--%EC%A1%B0%EA%B1%B4%EB%8B%AC%EC%84%B1-%ED%95%A0%EC%9D%B8---%ED%94%8C%EB%9F%AC%EC%8A%A4%EC%98%A4%EB%8D%94?node-id=3800-432484
- Jira:
- 수정일: 2026-11-24

## 전달 범위

| 항목 | 처리 |
|---|---|
| 로고 모션 (트럭 · 심볼) | **로티 제공**: `src/lottie/logo_plusdelivery-plusorder.json` |
| 1회 재생 뒤 구간 반복 | **코드로 처리**: 아래 1 |

---

## 이 화면의 핵심 모션 — 이것만 구현

1. **로고 로티 재생**: 처음 1회 전체 재생 후 `loopStart ~ loopEnd` 마커 구간을 무한 반복 (1)

- 그 외 파일은 **프로토타입 확인용**이라 옮기지 않습니다. 해당 파일: 주문서 레이아웃 `order.css` · 목업 이미지 · 공통 `common.*`의 폰 프레임 · 상태바 · 페이지 로딩 · 폰 동기화.
- **실서비스로 바꿀 값**: 없음

---

## 1. 로고 로티 재생

| 항목 | 값 |
|---|---|
| 대상 | TitleSection 로고 자리 (제목 줄 왼쪽, "혜택가 상품" 앞) |
| 크기 | 123 × 14 (로티 원본 369 × 42 = 3배) |
| 파일 | `logo_plusdelivery-plusorder.json` · 60fps · 0 ~ 870 프레임 |
| 트리거 | 화면이 보일 때 |
| 1회 재생 | 0 → 870 프레임 전체 (약 14.5초): 트럭이 로고 전체를 2번 지나감 |
| 반복 | `loopStart`(480) ~ `loopEnd`(869) 마커 구간 무한 반복 (약 6.5초): 심볼 안에서만 트럭이 지나감 |
| 동작 줄이기 | 시스템 '동작 줄이기'가 켜져 있으면 재생하지 않고 `loopEnd` 프레임(완성된 로고)에 멈춤 |
| 비고 | 반복 구간은 숫자 대신 **마커 이름**으로 읽음 → 디자인에서 마커 위치를 바꿔도 코드는 그대로 |

```js
// 웹 (lottie-web)
const anim = lottie.loadAnimation({ container, renderer: 'svg', loop: false, autoplay: false, path: 'logo_plusdelivery-plusorder.json' });

anim.addEventListener('DOMLoaded', () => {
  const markers = anim.animationData.markers || [];
  const frameOf = (name, fallback) => (markers.find((m) => m.cm === name) || { tm: fallback }).tm;
  const loopStart = frameOf('loopStart', 0);                                   // 480
  const loopEnd = Math.min(frameOf('loopEnd', anim.totalFrames - 1) + 1, anim.totalFrames); // 870

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    anim.goToAndStop(loopEnd - 1, true);
    return;
  }
  anim.addEventListener('complete', function onFirstDone() {   // 1회 재생이 끝나면 구간 반복으로
    anim.removeEventListener('complete', onFirstDone);
    anim.loop = true;
    anim.playSegments([loopStart, loopEnd], true);
  });
  anim.playSegments([0, loopEnd], true);
});
```

- iOS · Android 로티도 같은 방식입니다. 처음엔 전체를 1회 재생하고, 끝나면 마커 `loopStart` ~ `loopEnd` 구간을 반복합니다.
