# 3_success · 조건달성 (스탬프 10개 선물) — 모션 가이드

> 개발 전달용 모션 가이드입니다. 경로는 `prototypes/` 폴더 기준입니다.

- 프로토타입: `3_success.html`
- Figma: https://www.figma.com/design/cIgBZWB46ht7WvX5kbPkgx/%EC%95%B1%ED%85%8C%ED%81%AC-2.0?node-id=79075-224680
- 수정일: 2026-11-19

## 전달 범위

| 항목 | 처리 |
|---|---|
| 상품 부유모션 | **코드로 처리** (아래 1) |
| 콘페티 | **로티 제공**, 1회 재생 (`3_success/lottie/confetti.json`) |

---

## 핵심

- 스탬프 10개를 모아 선물을 받은 화면입니다.
- **상품 이미지가 살짝 떠서 기울며 계속 움직이고**(부유), 화면 진입 후 **콘페티가 1회** 터집니다.

## 1. 상품 부유 (반복)

| 레이어 | 움직임 | 주기 |
|---|---|---|
| `achieve__float` | 위아래 ±2px | 4.5s |
| `achieve__rotate-x` | X축 회전 ±3° | 5s |
| `achieve__rotate-y` | Y축 회전 ±5° | 7s |

- 세 움직임을 각각 다른 주기로 겹쳐 같은 동작이 반복돼 보이지 않게 했습니다. 이징 `ease-in-out`, 원근 `perspective: 300px`.
- 모바일 외곽 계단 현상 방지를 위해 마지막 회전 면(`rotate-y`)에 투명 여백 2px + `transform-style: flat` 을 줍니다.
- '동작 줄이기'가 켜져 있으면 부유 모션을 끕니다(`prefers-reduced-motion: reduce`).

## 2. 콘페티 로티

| 항목 | 값 |
|---|---|
| 파일 | `3_success/lottie/confetti.json` (1_checkin 과 같은 로티) |
| 표시 크기 | 311 × 207 |
| 위치 | 상품 이미지 중앙 |
| 시작 | 페이지 로드 0.5s 뒤 1회 |

## 리소스

| 파일 | 설명 |
|---|---|
| `3_success.html` | 마크업 |
| `3_success/3_success.css` | 상품 부유 · 콘페티 영역 |
| `3_success/3_success.js` | 콘페티 재생 스크립트 |
| `3_success/img/product.webp` | 상품 이미지 (390 × 390 → 130 × 130) |
| `3_success/img/info.png` | 하단 안내 텍스트·버튼 (837 × 573 → 279 × 191) |

---
🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
