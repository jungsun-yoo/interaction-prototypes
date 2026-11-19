# 프로토타입 공유 템플릿

PC에서 여러 타입의 모바일 프로토타입을 나란히 비교하고, QR로 실제 폰에서 바로 열어 보는 구조입니다.

- `index.html`: 보여주는 틀입니다. 좌측 목록, 가운데 폰 프레임, QR, 다시 재생·새 창 툴바가 들어 있습니다. **PC 전용**입니다.
- `prototypes/`: 실제 프로토타입 화면입니다. 각 `Type_N.html`은 혼자 열어도 동작합니다. 모바일에서는 이 파일을 직접 엽니다.

## 폴더 구조

```
_html/
├─ index.html              보여주는 틀 (CONFIG만 수정)
├─ README.md
├─ lib/                    index 전용 라이브러리 (QR)
└─ prototypes/
   ├─ Type_1.html …        타입별 화면
   └─ src/
      ├─ common/           모든 타입 공통 (새 프로젝트에 통째로 복사)
      │  ├─ common.css     공통 스타일 (맨 위에 기기 크기 변수)
      │  ├─ common.js      공통 동작 (스크롤, 빅배너, 헤더 등)
      │  └─ mds-motion.css MDS 모션 토큰
      ├─ types/            타입별 (css·js가 나란히)
      │  ├─ type_N.css
      │  └─ type_N.js
      ├─ lib/              lottie · motion · swiper
      ├─ img/              이미지 (png · jpg · svg)
      └─ lottie/           Lottie JSON
```

파일 이름은 `Type_N.html` ↔ `types/type_N.css` ↔ `types/type_N.js`처럼 짝을 맞춥니다.

## 새 프로젝트에서 바꿀 곳

1. **`index.html` 상단 `CONFIG`**
   - `title`, `sub`, `label`: 패널과 브라우저 탭에 표시되는 제목입니다.
   - `version`: 파일을 수정하면 올립니다. `prototypes/*.html` 안의 `?v=` 값과 같게 맞춥니다.
   - `qrHost`: 로컬(localhost)에서 볼 때 QR에 넣을 내 PC의 내부 IP입니다.
   - `figma`, `jira`: 링크입니다. 항목별로 다르면 `items`에 따로 적습니다.
   - `items`: 타입 목록입니다. 한 줄에 한 타입씩 적고, `id`는 주소의 `#id`가 됩니다.
2. **`prototypes/src/common/common.css` 맨 위 `:root`**: Figma 프레임에 맞춰 적습니다.
   - `--phone-w`, `--phone-h`: PC에서 보는 폰 크기입니다. index 프레임은 이 값을 읽어 자동으로 맞춰집니다.
   - `--phone-radius`, `--status-bar-h`, `--phone-safe-bottom`: 폰 모서리, 상태바 높이, 하단 안전영역입니다.
   - `--mobile-max-w`: 실제 폰·태블릿에서 화면 최대 너비입니다.
3. **`img/StatusBar.png`**: 폰 너비를 바꾸면 Figma에서 같은 너비로 다시 추출합니다.

## 타입 추가

1. 기존 `Type_N.html`을 복사해 `Type_4.html`을 만듭니다.
2. `types/type_4.css`와 `types/type_4.js`를 만들고, `Type_4.html`의 연결을 바꿉니다.
3. `index.html`의 `CONFIG.items`에 한 줄을 추가합니다.

## 로컬에서 보기

```bash
python3 -m http.server 8765
```

브라우저에서 `http://localhost:8765/`를 엽니다. 같은 와이파이의 폰으로 보려면 `CONFIG.qrHost`에 PC의 IP를 적고 QR을 찍습니다.

## 배포 (GitHub Pages)

프로토타입은 GitHub `jungsun-yoo` 계정의 [interaction-prototypes](https://github.com/jungsun-yoo/interaction-prototypes) 저장소에 올리고, GitHub Pages 주소로 공유합니다.

1. 저장소의 `YYYY/MMDD_이름/차수/` 폴더에 `_html` 안의 내용을 그대로 올립니다.
2. 커밋 후 Pages 배포가 끝나면 아래 주소로 열립니다.
   `https://jungsun-yoo.github.io/interaction-prototypes/YYYY/MMDD_이름/차수/`
   - 예: https://jungsun-yoo.github.io/interaction-prototypes/2026/1028_fab-event/1st/
3. 배포된 주소에서는 QR이 이 GitHub Pages 주소로 만들어지므로, 링크와 QR을 그대로 공유하면 됩니다.
