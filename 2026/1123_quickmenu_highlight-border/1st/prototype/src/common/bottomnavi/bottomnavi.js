/* bottomnavi.js — 바텀네비 + FAB

   바텀네비: 스크롤을 내리면 페이드아웃, 올리거나 맨 위면 다시 보임 (모양은 bottomnavi.css)
   광고판 진입 · 이탈('adboardchange') 때 처음 상태로
   필요: common.js (onScrollDirection) */
(function () {
  var navigation = document.querySelector('.navigation');
  if (!navigation) return;

  onScrollDirection(function (direction) {
    navigation.style.opacity = direction === 'down' ? '0' : '1';
  });

  window.addEventListener('adboardchange', function () {
    navigation.style.opacity = '1';
  });
})();

/* FAB (모양은 bottomnavi.css의 FAB 구간)
   스크롤: 내리면 FAB가 내려가 숨고, 올리거나 맨 위면 다시 올라옴. 맨 위로 버튼은 100 이상 내려야 보임
   맨 위로: 스프링으로 맨 위까지 (사용자가 다시 스크롤하면 중단)
   최근 본 상품: 이미지가 위로 넘어가며 교체 (시간은 bottomnavi.css의 --fab-recent-hold · --fab-recent-roll)
   광고판 진입 · 이탈('adboardchange') 때 처음 상태로
   필요: common.js (pageScroll · onScrollDirection), Motion (CDN) */

/* 스크롤 연동 */
(function () {
  var fab = document.querySelector('.fab');
  var fabTop = document.querySelector('.fab-top');
  var FAB_TOP_SHOW_AT = 100; /* 탑버튼이 나타나는 스크롤 위치 */
  if (!fab) return;

  onScrollDirection(function (direction, scrollTop) {
    if (fabTop) fabTop.classList.toggle('is-visible', scrollTop >= FAB_TOP_SHOW_AT);
    fab.classList.toggle('is-hidden', direction === 'down');
  });

  window.addEventListener('adboardchange', function () {
    fab.classList.remove('is-hidden');
    if (fabTop) fabTop.classList.remove('is-visible');
  });
})();

/* 맨 위로 */
(function () {
  var fabTop = document.querySelector('.fab-top');
  var scrolling = null;
  if (!fabTop) return;

  function cssNumber(name) {
    return parseFloat(getComputedStyle(fabTop).getPropertyValue(name));
  }

  function stopScrolling() {
    if (scrolling) {
      scrolling.stop();
      scrolling = null;
    }
  }

  fabTop.addEventListener('click', function () {
    stopScrolling();
    scrolling = Motion.animate(pageScroll.get(), 0, {
      type: 'spring',
      stiffness: cssNumber('--fab-top-spring-stiffness'),
      damping: cssNumber('--fab-top-spring-damping'),
      onUpdate: pageScroll.set
    });
  });

  pageScroll.target.addEventListener('touchstart', stopScrolling, { passive: true });
  pageScroll.target.addEventListener('wheel', stopScrolling, { passive: true });
  window.addEventListener('pagescroll:wheel', stopScrolling); /* 폰 바깥·index에서 넘어온 휠 */
})();

/* 최근 본 상품 */
(function () {
  var recent = document.querySelector('.fab-recent');
  if (!recent) return;
  var images = recent.querySelectorAll('img');
  if (images.length < 2) return;

  var style = getComputedStyle(recent);
  var HOLD_MS = parseFloat(style.getPropertyValue('--fab-recent-hold')) * 1000;
  var ROLL_MS = parseFloat(style.getPropertyValue('--fab-recent-roll')) * 1000;
  var index = 0;

  function roll() {
    var current = images[index];
    index = (index + 1) % images.length;
    var next = images[index];

    /* 이전에 위로 나간 이미지를 transition 없이 아래 대기 위치로 되돌린 뒤 진입 */
    next.classList.add('is-instant');
    next.classList.remove('is-leaving');
    void next.offsetHeight;
    next.classList.remove('is-instant');

    current.classList.remove('is-current');
    current.classList.add('is-leaving');
    next.classList.add('is-current');

    setTimeout(roll, ROLL_MS + HOLD_MS);
  }

  setTimeout(roll, HOLD_MS);
})();
