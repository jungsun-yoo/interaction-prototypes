# 이벤트 FAB 인터랙션 가이드

앱 홈 좌측 하단 이벤트 FAB(무신사 체크인)의 인터랙션 기준입니다.

- **기준 코드:** `src/types/type_1.js`, `src/types/type_1.css`
- **수치 변경:** 모든 값은 `type_1.css`의 `.fab-event` 변수에서 바꿉니다.
- **이미지:** `src/img/FAB_Checkin.png` (204×228, @3x), 화면 표시 크기 68×76

## 1. 상태

FAB는 share 버튼 위 12px, 좌측 기준으로 배치합니다. 이동 값은 open 위치 기준입니다.

| 상태 | 화면에 보이는 양 | X 이동 | 회전 | 언제 |
|---|---|---|---|---|
| `out` | 0% | -78px | 0° | 페이지 진입 직후 |
| `open` | 100% | 0 | 0° | 등장, 사용자가 꺼냄, 상단 도착 |
| `hide` | 30% | -57.6px | 10° | 스크롤을 내릴 때 |
| `peek` | 45% | -47.4px | 12° | 스크롤을 올릴 때 |

X 이동 값 = `-(FAB 너비 × (1 - 보이는 양) + 좌측 여백 10px)`

## 2. 동작 흐름

| 트리거 | 변화 | 모션 | 유지 후 동작 |
|---|---|---|---|
| 페이지 진입 | `out` → 0.5초 뒤 `open` | `mds.spring.bouncy` | 2초 뒤 `hide` |
| 스크롤 내림 | → `hide` | `mds.spring.bouncy` | - |
| 스크롤 올림 | → `peek` | `mds.spring.bouncy` | - |
| 페이지 상단 도착 | → `open` | `mds.spring.bouncy` | 2초 뒤 `hide` |
| 숨은 상태에서 클릭 | → `open` | `mds.spring.normal` | 3초 뒤 마지막 숨김 상태 |
| 숨은 상태에서 드래그 | 손가락을 따라 이동 | 없음(1:1 추적) | 3장 참고 |

- 등장 중(`out`부터 첫 `hide`까지)에는 스크롤에 반응하지 않습니다.
- 꺼낸 상태에서 스크롤하면 유지 시간을 기다리지 않고 바로 스크롤 방향대로 숨습니다.
- 꺼낸 상태에서 FAB를 누르면 유지 시간이 다시 시작됩니다.
- 마지막 숨김 상태는 꺼내기 직전의 `hide` 또는 `peek`입니다.

## 3. 드래그

숨은 상태(`hide`, `peek`)에서 오른쪽으로 끌어 꺼냅니다.

| 항목 | 값 | 설명 |
|---|---|---|
| 드래그 판단 | 4px | 이보다 적게 움직이면 클릭으로 처리 |
| 열림 기준 | 30% | 꺼낸 정도가 이 값 이상이면 `open` |
| 튕김 속도 | 0.4px/ms | 오른쪽으로 이보다 빠르면 꺼낸 정도와 관계없이 `open` |
| 튕김 판단 시간 | 0.1초 | 마지막 움직임 후 이 시간이 지나 놓으면 튕김으로 보지 않음 |
| 끝을 넘어 끌 때 | 0.2배 | open 위치를 넘으면 저항을 줌 |

- 끄는 동안 회전은 꺼낸 정도에 비례해 0°로 줄어듭니다.
- 놓았을 때 기준을 넘으면 `open`, 넘지 못하면 원래 숨김 상태로 돌아갑니다. 둘 다 `mds.spring.normal`입니다.
- 세로 스크롤은 그대로 동작해야 합니다(`touch-action: pan-y`).
- 드래그를 놓을 때 발생하는 클릭은 무시합니다.

## 4. 클릭과 링크

| 상태 | 클릭 결과 |
|---|---|
| `hide`, `peek` | 꺼내기만 함(링크 안 열림) |
| `open` | 링크를 새 창으로 열기 |
| `out` | 반응 없음 |

- 첫 등장과 상단 도착으로 펼쳐진 동안에도 클릭하면 링크가 열립니다.


## 5. 모션 값
- **가이드링크:** `https://www.figma.com/design/oSeWgRf3JXSk6AvrceXTUN/MDS-2.0-Specimen?node-id=18455-38812&t=0cmppl22KL0yQlLQ-4`

| 토큰 | 웹(stiffness / damping) | iOS(duration / dampingRatio) | Android(stiffness / dampingRatio) |
|---|---|---|---|
| `mds.spring.bouncy` | 322 / 26 | 0.5s / 0.75 | 600 / 0.75 |
| `mds.spring.normal` | 815 / 54 | 0.3s / 1 | 1200 / 1 |

이벤트 FAB는 부모 `.fab` 안에 있어, 스크롤을 내릴 때 FAB 영역이 내려가는 움직임도 함께 따라갑니다.

## 6. 변수 목록

| 변수 | 값 | 내용 |
|---|---|---|
| `--fab-event-intro-delay` | 0.5s | 진입 후 등장까지 대기 |
| `--fab-event-intro-hold` | 2s | 첫 등장 유지 시간 |
| `--fab-event-top-hold` | 2s | 상단 도착 유지 시간 |
| `--fab-event-reveal-hold` | 3s | 클릭·드래그로 꺼낸 뒤 유지 시간 |
| `--fab-event-hide-visible` / `-rotate` | 0.3 / 10deg | `hide` 상태 |
| `--fab-event-peek-visible` / `-rotate` | 0.45 / 12deg | `peek` 상태 |
| `--fab-event-edge-offset` | 10px | 화면 왼쪽 끝 ~ FAB 왼쪽 끝 |
| `--fab-event-drag-slop` | 4px | 드래그 판단 거리 |
| `--fab-event-drag-threshold` | 0.3 | 드래그 열림 기준 |
| `--fab-event-drag-fling-velocity` | 0.4 | 튕김 속도(px/ms) |
| `--fab-event-drag-fling-window` | 0.1s | 튕김 판단 시간 |
| `--fab-event-drag-overshoot` | 0.2 | 끝을 넘어 끌 때 따라오는 비율 |
| `--fab-event-top-threshold` | 0px | 이 스크롤 위치 이하면 상단 도착 |

## 7. 구현 시 확인할 점

프로토타입에서 정해지지 않았거나 실기기로 확인하지 못한 항목입니다.

- **iOS 상단 바운스:** 상단에서 숨은 뒤 화면을 아래로 당기면 scroll 이벤트로 FAB가 다시 열릴 수 있습니다. 실기기에서 확인이 필요합니다.
- **넓은 화면:** 화면 폭이 600px을 넘는 터치 기기에서는 콘텐츠 영역 바깥 여백에 숨은 FAB가 보입니다. 태블릿을 지원한다면 처리가 필요합니다.
- **접근성:** 프로토타입은 `<div>` 클릭입니다. 실제 구현에서는 키보드와 스크린리더로 쓸 수 있어야 합니다.
- **앱 웹뷰:** 프로토타입은 `window.open`으로 새 창을 엽니다. 앱에서는 앱의 화면 이동 방식에 맞춰야 합니다.
