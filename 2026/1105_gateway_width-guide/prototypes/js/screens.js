// 기기·환경 데이터

// 기기 시스템 영역: 뷰포트(w×h) 밖에 붙는 기기 UI 이미지 목록
// side 'left' / 'right' = 뷰포트 왼쪽 / 오른쪽 (size = 너비, 폰 전체 높이)
//      'top' / 'bottom' = 뷰포트 위 / 아래 (size = 높이, 뷰포트 너비)
// src 대신 color 를 주면 단색 영역 (예: 앱 레터박스 검정)
// 폰 전체 = (left + w + right) × (top + h + bottom)
export const SYSTEM_AREAS = {
  'duo-front': [{ side: 'right', size: 84, src: 'src/img/device/duo_front_right_app.png' }],
  'duo-front-mw': [
    { side: 'right', size: 84, src: 'src/img/device/duo_front_right.png' },
    { side: 'bottom', size: 98, src: 'src/img/device/duo_front_browser.png' },
  ],
  'duo-landscape-mw': [{ side: 'top', size: 132, src: 'src/img/device/duo_landscape_browser.png' }],
  // 앱은 951 화면 가운데 375 로만 표시, 양옆 288 은 검정
  'duo-landscape-app': [
    { side: 'left', size: 288, color: '#000' },
    { side: 'right', size: 288, color: '#000' },
  ],
  // 폴드8 전면 삼성인터넷: 상단 브라우저 90 + 하단 시스템 96
  'fold8-front-samsung': [
    { side: 'top', size: 90, src: 'src/img/device/fold8_front_browser_samsung.png' },
    { side: 'bottom', size: 96, src: 'src/img/device/fold8_front_system_samsung.png' },
  ],
  // 폴드8 전면 앱: 하단 시스템(내비게이션) 48
  'fold8-front-app': [
    { side: 'bottom', size: 48, src: 'src/img/device/fold8_front_system.png' },
  ],
  // 폴드8 전면 크롬: 상단 브라우저 98 + 하단 시스템(내비게이션) 48
  'fold8-front-chrome': [
    { side: 'top', size: 98, src: 'src/img/device/fold8_front_browser.png' },
    { side: 'bottom', size: 48, src: 'src/img/device/fold8_front_system.png' },
  ],
  // 폴드8 펼침 가로: 하단 시스템 48 은 삼성·크롬·앱 공통, 상단 브라우저는 삼성 88 / 크롬 136
  'fold8-landscape-samsung': [
    { side: 'top', size: 88, src: 'src/img/device/fold8_landscape_browser_samsung.png' },
    { side: 'bottom', size: 48, src: 'src/img/device/fold8_landscape_system.png' },
  ],
  'fold8-landscape-chrome': [
    { side: 'top', size: 136, src: 'src/img/device/fold8_landscape_browser.png' },
    { side: 'bottom', size: 48, src: 'src/img/device/fold8_landscape_system.png' },
  ],
  'fold8-landscape-app': [
    { side: 'bottom', size: 48, src: 'src/img/device/fold8_landscape_system.png' },
  ],
  // 폴드8 펼침 세로: 하단 시스템 48 은 삼성·크롬·앱 공통, 상단 브라우저는 삼성 87 / 크롬 136
  'fold8-portrait-samsung': [
    { side: 'top', size: 87, src: 'src/img/device/fold8_portrait_browser_samsung.png' },
    { side: 'bottom', size: 48, src: 'src/img/device/fold8_portrait_system.png' },
  ],
  'fold8-portrait-chrome': [
    { side: 'top', size: 136, src: 'src/img/device/fold8_portrait_browser.png' },
    { side: 'bottom', size: 48, src: 'src/img/device/fold8_portrait_system.png' },
  ],
  'fold8-portrait-app': [
    { side: 'bottom', size: 48, src: 'src/img/device/fold8_portrait_system.png' },
  ],
  'duo-portrait-mw': [{ side: 'top', size: 132, src: 'src/img/device/duo_portrait_browser.png' }],
  // 앱은 669×951 화면 가로·세로 가운데 375×667 로만 표시, 나머지는 검정
  'duo-portrait-app': [
    { side: 'left', size: 147, color: '#000' },
    { side: 'right', size: 147, color: '#000' },
    { side: 'top', size: 142, color: '#000' },
    { side: 'bottom', size: 142, color: '#000' },
  ],
};
// Screen 목록. w·h = 뷰포트 크기
// status = App 에서 게이트웨이가 덮는 상태바 높이 (MW 는 브라우저가 상태바를 처리하므로 0)
// system = SYSTEM_AREAS 키 (있으면 뷰포트 옆에 시스템 영역 이미지 표시)
// mw = MW 에서만 달라지는 값 (예: 하단 브라우저만큼 뷰포트 높이가 줄어듦)
export const SCREENS = [
  {
    group: 'iPhone',
    envs: null, // 환경 분기 없음 (상태바 덮는 형태)
    noSideDim: true, // 게이트웨이가 화면보다 좁아져 좌우 딤이 보이면 안 되는 기종
    items: [
      { name: 'iPhone 13 mini', w: 375, h: 812, status: 50 },
      { name: 'iPhone 16', w: 393, h: 852, status: 59 },
      { name: 'iPhone Pro', w: 402, h: 874, status: 62 },
      { name: 'iPhone Pro Max', w: 440, h: 956, status: 62 },
    ],
  },
  {
    group: 'iPhone Duo',
    envs: ['mw', 'app'],
    items: [
      // 스크린 466×678 = 뷰포트 382 + 우측 시스템 영역 84
      // MW 는 하단 브라우저 98 만큼 뷰포트 높이 580
      {
        name: '전면', w: 382, h: 678, status: 16, system: 'duo-front',
        // warn: AS-IS 에서 문제가 되는 화면 (버튼에 경고 표시)
        //   slots 에 적은 구좌가 모두 노출될 때만 하단이 잘려서 그때만 표시
        mw: {
          h: 580, system: 'duo-front-mw',
          warn: { text: 'AS-IS: 게이트웨이 하단이 잘림', slots: ['strip', 'ad'] },
        },
      },
      // 스크린 951×669. MW 는 상단 브라우저 132 만큼 뷰포트 높이 537
      // App 은 전체 검정 + 가운데 375×669 에만 앱 표시
      {
        name: '펼침 · 가로', w: 951, h: 669, status: 16,
        mw: { h: 537, system: 'duo-landscape-mw' },
        app: { w: 375, system: 'duo-landscape-app' },
      },
      // 스크린 669×951. MW 는 상단 브라우저 132 만큼 뷰포트 높이 819
      // App 은 전체 검정 + 가로·세로 가운데 375×667 에만 앱 표시
      {
        name: '펼침 · 세로', w: 669, h: 951, status: 16,
        mw: { h: 819, system: 'duo-portrait-mw' },
        app: { w: 375, h: 667, system: 'duo-portrait-app' },
      },
    ],
  },
  {
    group: 'Galaxy Z Fold8',
    envs: ['samsung', 'chrome', 'app'],
    items: [
      // 스크린 475×751. 브라우저별 상단·하단 영역을 빼고 뷰포트 높이
      // 삼성: 751 - 90 - 96 = 565 / 크롬: 751 - 98 - 48 = 605 / 앱: 751 - 48 = 703 (상태바 42)
      {
        name: '전면', w: 475, h: 751, status: 42,
        samsung: { h: 565, system: 'fold8-front-samsung' },
        chrome: { h: 605, system: 'fold8-front-chrome' },
        app: { h: 703, system: 'fold8-front-app' },
      },
      // 스크린 932×704. 하단 시스템 48 공통
      // 삼성: 704 - 88 - 48 = 568 / 크롬: 704 - 136 - 48 = 520 / 앱: 704 - 48 = 656 (상태바 40)
      {
        name: '펼침 · 가로', w: 932, h: 704, status: 40,
        samsung: { h: 568, system: 'fold8-landscape-samsung' },
        chrome: { h: 520, system: 'fold8-landscape-chrome' },
        app: { h: 656, system: 'fold8-landscape-app' },
      },
      // 스크린 704×932. 하단 시스템 48 공통
      // 삼성: 932 - 87 - 48 = 797 / 크롬: 932 - 136 - 48 = 748 / 앱: 932 - 48 = 884 (상태바 40)
      {
        name: '펼침 · 세로', w: 704, h: 932, status: 40,
        samsung: { h: 797, system: 'fold8-portrait-samsung' },
        chrome: { h: 748, system: 'fold8-portrait-chrome' },
        app: { h: 884, system: 'fold8-portrait-app' },
      },
    ],
  },
];
// 환경별 값. 웹(MW·삼성·크롬)은 상단 상태바를 브라우저가 처리하므로 0, item[환경키] 로 뷰포트·시스템 영역을 덮어씀
// App 은 item.status 상태바, item.app 으로 덮어씀
const valuesFor = (key, status) => (item) => {
  const o = item[key] || {};
  return { w: o.w ?? item.w, h: o.h ?? item.h, s: status(item), sys: o.system ?? item.system ?? '' };
};
export const ENV_DEFS = {
  mw: { label: 'MW', isWeb: true, valuesOf: valuesFor('mw', () => 0) },
  samsung: { label: '삼성', isWeb: true, valuesOf: valuesFor('samsung', () => 0) },
  chrome: { label: '크롬', isWeb: true, valuesOf: valuesFor('chrome', () => 0) },
  app: { label: 'App', isWeb: false, valuesOf: valuesFor('app', (item) => item.status) },
};
