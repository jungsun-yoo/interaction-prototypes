/* storeheader.js — 전문관 헤더 동작: 헤더 접힘 · 앱바 게이트웨이 로티 · 검색창 문구·렌즈 · 탭 (모양은 storeheader.css)
   전문관이 바뀌면('storechange') 각 부분이 알아서 바뀜 */

/* 헤더: 스크롤하면 헤더가 앱바 + 검색창만큼 올라가 탭이 상태바 밑에 붙음 (스크롤에 1:1 추적)
   광고판 진입 · 이탈('adboardchange') 때 처음 위치로
   필요: common.js (pageScroll), storeheader.css의 높이 변수 */
(function () {
  var header = document.querySelector('.header');
  if (!header) return;

  /* 모바일 safe area top: 임시 요소로 env() 실제 px 값을 읽음 */
  var safeAreaTop = 0;
  if (pageScroll.isTouch) {
    var safeDiv = document.createElement('div');
    safeDiv.style.cssText = 'position:fixed;top:0;height:env(safe-area-inset-top,0px);width:1px;pointer-events:none;visibility:hidden;';
    document.body.appendChild(safeDiv);
    safeAreaTop = safeDiv.offsetHeight;
    document.body.removeChild(safeDiv);
  }

  var headerStyle = getComputedStyle(header);
  var COLLAPSE = parseFloat(headerStyle.getPropertyValue('--appbar-h')) + parseFloat(headerStyle.getPropertyValue('--search-h')) + safeAreaTop;

  window.addEventListener('adboardchange', function () {
    header.style.setProperty('--header-offset', '0px');
  });

  pageScroll.target.addEventListener('scroll', function () {
    if (document.documentElement.classList.contains('is-header-fixed')) return; /* 헤더 고정 (취향선택브랜드 홈: home.js) */
    /* 음수 오버스크롤은 0으로 고정. 배경 보정(storeheader.css)도 이 값을 씀 */
    var offset = Math.min(0, Math.max(-COLLAPSE, -pageScroll.get()));
    header.style.setProperty('--header-offset', offset + 'px');
  }, { passive: true });
})();

/* 앱바: 게이트웨이 버튼 로티. 전문관마다 파일이 다름 (로고 · 아이콘 색은 storeheader.css)
   필요: common.js (playLottie), lottie-web / 전문관이 바뀌면 'storechange'로 다시 재생 */
(function () {
  var GATEWAY_FILES = {
    musinsa: 'ic_gateway_affordance',
    sports: 'ic_gateway_affordance_player',
    kids: 'ic_gateway_affordance_kids',
    used: 'ic_gateway_affordance_used'
  };
  var DEFAULT_FILE = 'ic_gateway_affordance_vertical'; /* 나머지 전문관 */

  var phone = document.querySelector('.phone');
  var gateway = document.getElementById('appbarGateway');
  var animation = null;
  if (!gateway) return;

  function apply() {
    if (animation) animation.destroy();
    animation = playLottie(gateway, GATEWAY_FILES[phone.dataset.store] || DEFAULT_FILE);
  }

  window.addEventListener('storechange', apply);
  apply();
})();

/* 검색창: 문구 · 렌즈 로티. 전문관마다 문구가 다르고 렌즈는 무신사만 (모양은 storeheader.css)
   필요: common.js (playLottie), lottie-web / 전문관이 바뀌면 'storechange'로 다시 적용 */
(function () {
  var SEARCH_TEXTS = {
    musinsa: '무탠다드 시즌오프 최대 80% 할인',
    beauty: '뷰티 상품을 검색해 보세요',
    sports: '스포츠/레저 상품을 검색해 보세요',
    outlet: '아울렛 상품을 검색해 보세요',
    kids: '무탠다드 시즌오프 최대 80% 할인',
    boutique: '부티크 상품을 검색해 보세요',
    kicks: '신발 상품을 검색해 보세요',
    used: 'USED 상품을 검색해 보세요'
  };
  var LENS_STORE = 'musinsa'; /* 렌즈 아이콘은 무신사만 */

  var phone = document.querySelector('.phone');
  var searchText = document.getElementById('searchText');
  var lens = document.getElementById('searchLens');
  var lensAnimation = null;

  /* 렌즈 로티: 무신사에서만 재생, 다른 전문관에서는 제거 */
  function updateLens(store) {
    if (store === LENS_STORE) {
      if (!lensAnimation) lensAnimation = playLottie(lens, 'lens_default');
      return;
    }
    if (lensAnimation) {
      lensAnimation.destroy();
      lensAnimation = null;
    }
  }

  function apply() {
    var store = phone.dataset.store;
    if (searchText) searchText.textContent = SEARCH_TEXTS[store] || '';
    if (lens) updateLens(store);
  }

  window.addEventListener('storechange', apply);
  apply();
})();

/* 탭: 추천 · 광고탭만 클릭, 광고탭 로티는 전문관마다 다름 (모양은 storeheader.css)
   광고탭을 고르면 .phone에 is-ad-board를 붙이고 'adboardchange' 이벤트를 보냄 (광고판 화면은 pan/)
   전문관이 바뀌면('storechange') 광고탭 로티를 바꾸고 추천판부터
   필요: common.js (playLottie), lottie-web */
(function () {
  var AD_FILES = { /* 광고탭 로티: 밝은 배경은 black, 키즈는 전용, 나머지는 white */
    sports: 'ADTab_black',
    used: 'ADTab_black',
    kids: 'ADTab_kids'
  };
  var DEFAULT_AD_FILE = 'ADTab_white';

  var phone = document.querySelector('.phone');
  var tabUnderline = document.querySelector('.tab-underline');
  var tabRecommend = document.getElementById('tabRecommend');
  var tabAdLottie = document.getElementById('tabAdLottie');
  var adAnimation = null;
  if (!tabUnderline) return;

  function playAd() {
    if (!tabAdLottie) return;
    if (adAnimation) adAnimation.destroy();
    adAnimation = playLottie(tabAdLottie, AD_FILES[phone.dataset.store] || DEFAULT_AD_FILE);
  }

  /* 탭 선택 전환 (광고탭 외에는 화면 전환 없음) */
  function selectTab(item) {
    [].forEach.call(tabUnderline.querySelectorAll('.tab-item'), function (tab) {
      tab.classList.toggle('is-selected', tab === item);
      if (tab === item) tab.setAttribute('aria-current', 'page');
      else tab.removeAttribute('aria-current');
    });
    phone.classList.toggle('is-ad-board', item.classList.contains('tab-item--ad')); /* 광고판 화면 · 헤더색 (헤더색 제외 전문관은 CSS에서 처리) */
    window.dispatchEvent(new Event('adboardchange'));
  }

  tabUnderline.addEventListener('click', function (event) {
    var item = event.target.closest('.tab-item.is-clickable');
    if (item) selectTab(item);
  });

  window.addEventListener('storechange', function () {
    playAd();
    if (tabRecommend) selectTab(tabRecommend); /* 스토어가 바뀌면 추천판부터 */
  });
  playAd();
})();
