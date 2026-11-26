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

/* 바텀네비 선택 이동: bottomNavi.select('my') — 선택 표시(타원 딤)가 그 항목으로 스프링 이동하고, 아이콘이 활성 이미지로 바뀜
   - 항목 이름은 HTML 의 .nav-item[data-nav] (cate · snap · home · like · my). 순번(0~4)으로도 고를 수 있음
   - 이동: mds.spring.normal (값은 bottomnavi.css .nav-selection 의 --nav-select-spring-*). 위치는 % 라 화면 너비가 달라도 맞음
   - 아이콘은 이동을 시작할 때 바로 바뀜 (.is-active → bottomnavi.css 가 기본 / 활성 이미지를 바꿈)
   - bottomNavi.select(name, { instant: true }) : 모션 없이 바로 (처음 상태 맞출 때)
   - bottomNavi.current() : 지금 선택된 이름
   필요: Motion (CDN). 없으면 모션 없이 바로 옮김 */
window.bottomNavi = (function () {
  var navigation = document.querySelector('.navigation');
  var pill = document.querySelector('.nav-selection');
  var items = [].slice.call(document.querySelectorAll('.nav-items .nav-item'));
  var motion = null;
  if (!navigation || !pill || !items.length) return { select: function () {}, current: function () { return null; } };

  function find(target) {
    if (typeof target === 'number') return items[target] || null;
    return items.filter(function (item) { return item.getAttribute('data-nav') === target; })[0] || null;
  }
  /* 항목 가운데의 가로 위치 (네비게이션 너비 대비 %) */
  function centerOf(item) {
    var nav = navigation.getBoundingClientRect();
    var rect = item.getBoundingClientRect();
    return (rect.left + rect.width / 2 - nav.left) / nav.width * 100;
  }
  function pillCenter() {
    var nav = navigation.getBoundingClientRect();
    var rect = pill.getBoundingClientRect();
    return (rect.left + rect.width / 2 - nav.left) / nav.width * 100;
  }
  function cssNumber(name) {
    return parseFloat(getComputedStyle(pill).getPropertyValue(name));
  }
  function current() {
    var active = items.filter(function (item) { return item.classList.contains('is-active'); })[0];
    return active ? active.getAttribute('data-nav') : null;
  }

  function select(target, options) {
    var item = find(target);
    if (!item) return;
    items.forEach(function (other) { other.classList.toggle('is-active', other === item); });
    var from = pillCenter(); /* 이동 중에 다시 불려도 지금 위치에서 이어서 */
    var to = centerOf(item);
    if (motion) motion.stop();
    if ((options && options.instant) || !window.Motion || Math.abs(to - from) < 0.01) {
      pill.style.left = to + '%';
      return;
    }
    motion = Motion.animate(from, to, {
      type: 'spring',
      stiffness: cssNumber('--nav-select-spring-stiffness'),
      damping: cssNumber('--nav-select-spring-damping'),
      onUpdate: function (value) { pill.style.left = value + '%'; }
    });
  }

  return { select: select, current: current };
})();
