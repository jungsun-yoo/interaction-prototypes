/* storeheader.js — 헤더 동작: 헤더 접힘 · 탭 선택 (모양은 storeheader.css, 로티 재생은 common.js 의 [data-lottie]) */

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
    /* 음수 오버스크롤은 0으로 고정 */
    var offset = Math.min(0, Math.max(-COLLAPSE, -pageScroll.get()));
    header.style.setProperty('--header-offset', offset + 'px');
  }, { passive: true });
})();

/* 탭: 추천 · 광고탭만 클릭 (.is-clickable)
   광고탭을 고르면 .phone에 is-ad-board를 붙이고 'adboardchange' 이벤트를 보냄 (광고판 화면은 pan/) */
(function () {
  var phone = document.querySelector('.phone');
  var tabUnderline = document.querySelector('.tab-underline');
  if (!tabUnderline) return;

  function selectTab(item) {
    [].forEach.call(tabUnderline.querySelectorAll('.tab-item'), function (tab) {
      tab.classList.toggle('is-selected', tab === item);
      if (tab === item) tab.setAttribute('aria-current', 'page');
      else tab.removeAttribute('aria-current');
    });
    phone.classList.toggle('is-ad-board', item.classList.contains('tab-item--ad'));
    window.dispatchEvent(new Event('adboardchange'));
  }

  tabUnderline.addEventListener('click', function (event) {
    var item = event.target.closest('.tab-item.is-clickable');
    if (item) selectTab(item);
  });
})();
