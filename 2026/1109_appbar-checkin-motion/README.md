# 앱바 체크인 진입 모션 — 프로토타입

PC에서 모바일 프로토타입을 폰 프레임으로 보고, QR로 실제 폰에서 바로 열어 보는 구조입니다. (interaction-prototypes 공유 틀 5th 기반)

- `index.html`: 보여주는 틀입니다. 좌측 정보 패널(제목·Figma 링크), 가운데 폰 프레임, QR, 다시 재생·새 창 툴바, 툴바 아래 **모션 컨트롤 패널**이 있습니다. **PC 전용**입니다.
- `prototypes/Type_1.html`: 실제 프로토타입 화면입니다. 혼자 열어도 동작합니다 (컨트롤 패널 없이 기본값으로 재생). 모바일에서는 이 파일을 직접 엽니다.

## 폴더 구조

```
_html/
├─ index.html              보여주는 틀 (CONFIG · CONTROLS만 수정)
├─ README.md
├─ lib/                    index 전용 라이브러리 (QR)
└─ prototypes/
   ├─ Type_1.html          체크인 아이콘 뱃지 모션 화면
   └─ src/
      ├─ common/mds-motion.css   MDS 모션 토큰
      ├─ lib/              lottie · motion
      ├─ img/              이미지 (appbar 로고 · 체크인 핀)
      ├─ lottie/           게이트웨이 버튼 Lottie
      └─ page.png          배경 화면 (1125×2436 @3x)
```

## 모션 값

| 항목 | 값 | 위치 |
|---|---|---|
| 최초 딜레이 | 1초 | `Type_1.html` `:root` `--checkin-badge-delay` (패널에서 조절) |
| 노출 유지 | 3초 | `--checkin-badge-hold` (패널에서 조절) |
| 사라진 후 대기 | 6초 | `--checkin-badge-rest` (패널에서 조절) |
| 페이드 | 0.15초 linear | `--checkin-badge-fade` (고정) |
| 스케일 | 0 ↔ 1, mds.spring.bouncy (322 / 26), 중심점 좌하단 | `--checkin-badge-spring-*` (고정) |

패널에서 바꾼 값은 다시 재생(R)해도 유지되고, `기본값`을 누르면 `Type_1.html`의 CSS 값으로 돌아갑니다. 새로고침하면 기본값으로 시작합니다.

## 수정할 때

- 파일을 고치면 `index.html` `CONFIG.version`과 `Type_1.html` 안의 `?v=` 값을 같이 올립니다.
- 같은 와이파이 폰으로 볼 때는 `CONFIG.qrHost`에 PC의 내부 IP를 적습니다.

## 로컬에서 보기

```bash
python3 -m http.server 8765
```

브라우저에서 `http://localhost:8765/`를 엽니다.

## 배포 (GitHub Pages)

[interaction-prototypes](https://github.com/jungsun-yoo/interaction-prototypes) 저장소의 `2026/1109_appbar-checkin-motion/` 폴더에 `_html` 안의 내용을 그대로 올립니다.

- 공유 주소: https://jungsun-yoo.github.io/interaction-prototypes/2026/1109_appbar-checkin-motion/
- 배포된 주소에서는 QR이 GitHub Pages 주소로 만들어지므로 링크와 QR을 그대로 공유하면 됩니다.
