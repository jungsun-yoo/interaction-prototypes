# [앱바] 체크인 진입 모션 — 인터랙션 정의

> 개발 전달용 인터랙션 명세입니다. 값은 MDS 모션 토큰(`src/common/mds-motion.css`) 기준입니다.
> 모션 라이브러리: **Motion** (motion.dev) — 웹 `motion`, React `motion/react`. 스프링 값은 두 환경 공통입니다.

- 프로토타입: `Type_1.html` (체크인 아이콘 뱃지)
- Figma: https://www.figma.com/design/cIgBZWB46ht7WvX5kbPkgx/%EC%95%B1%ED%85%8C%ED%81%AC-2.0?node-id=94581-190492&t=bMzi9SwUtEkRnqF0-4
- Jira:
- 수정일: 2026-11-09

---

## Type 1 — 체크인 아이콘 뱃지

### 1. "이벤트" 배지 등장·퇴장 루프

| 항목 | 값 |
|---|---|
| 대상 | 앱바 체크인 아이콘의 "이벤트" 배지 (`.appbar-checkin-badge`) |
| 트리거 | 화면 진입 시 자동 시작 · 체크인 아이콘을 누르면 처음(딜레이)부터 다시 |
| 속성 | opacity `0 → 1`, scale `0 → 1` (퇴장은 반대) |
| 중심점 | 좌하단 (`transform-origin: left bottom`) |
| 페이드 | 0.15s · linear (고정) |
| 스케일 | spring · `mds.spring.bouncy` (stiffness 322 / damping 26) (고정) |
| 최초 딜레이 | 1초 |
| 노출 유지 | 3초 (등장 완료 후) |
| 사라진 후 대기 | 6초 (퇴장 완료 후) |
| 반복 | 무한 (딜레이 → 등장 → 유지 → 퇴장 → 대기 → 등장 …) |

- 페이드와 스케일은 동시에 시작합니다.
- 딜레이·유지·대기는 프로토타입 인덱스의 모션 컨트롤 패널에서 조절해 볼 수 있습니다. 조절값은 다음 단계부터 반영되고, `기본값`을 누르면 위 값으로 돌아갑니다.

```js
// 웹 (바닐라) — 등장
Motion.animate(badge, { opacity: [0, 1], scale: [0, 1] }, {
  opacity: { duration: 0.15, ease: 'linear' },
  scale: { type: 'spring', stiffness: 322, damping: 26 }
});
// 퇴장은 [1, 0]으로 같은 설정
```

```jsx
// React
<motion.span
  style={{ transformOrigin: 'left bottom' }}
  initial={{ opacity: 0, scale: 0 }}
  animate={visible ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
  transition={{
    opacity: { duration: 0.15, ease: 'linear' },
    scale: { type: 'spring', stiffness: 322, damping: 26 }
  }}
/>
```

### 2. 게이트웨이 버튼 로티

| 항목 | 값 |
|---|---|
| 대상 | 로고 오른쪽 게이트웨이 버튼 (`ic_gateway_affordance.json`) |
| 트리거 | 화면 진입 시 자동 재생 |
| 반복 | 무한 루프 |

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
