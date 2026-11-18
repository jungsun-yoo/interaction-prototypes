# 프로토타입 인덱스 — 인터랙션 정의

> 개발 전달용 인터랙션 명세입니다. 값은 MDS 모션 토큰(`src/common/mds-motion.css`) 기준입니다.
> 모션 라이브러리: **Motion** (motion.dev) — 웹 `motion`, React `motion/react`. 스프링 값은 두 환경 공통입니다.

- 프로토타입: `Type_2.html`
- Figma:
- Jira:
- 수정일: 2026-11-10

---

## Type 1

### 1. 카드 등장

| 항목 | 값 |
|---|---|
| 대상 | `.sample-card` (5개) |
| 트리거 | 화면 진입 |
| 속성 | opacity `0 → 1`, translateY `16px → 0` |
| 모션 | spring · `mds.spring.bouncy` (stiffness 322 / damping 26) |
| 딜레이 | 시작 0.3s, 카드마다 +0.06s (stagger) |

```js
// 웹 (바닐라)
Motion.animate('.sample-card', { opacity: [0, 1], y: [16, 0] }, {
  type: 'spring', stiffness: 322, damping: 26,
  delay: Motion.stagger(0.06, { startDelay: 0.3 })
});
```

```jsx
// React
<motion.div
  initial={{ opacity: 0, y: 16 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ type: 'spring', stiffness: 322, damping: 26, delay: 0.3 + index * 0.06 }}
/>
```

---

## 항목 추가 양식

### N. (인터랙션 이름)

| 항목 | 값 |
|---|---|
| 대상 | |
| 트리거 | (탭 · 스크롤 · 진입 · 시간 등) |
| 속성 | (opacity · transform · color 등, from → to) |
| 모션 | (spring 토큰 이름 또는 duration + easing 토큰) |
| 딜레이 | |
| 비고 | |
