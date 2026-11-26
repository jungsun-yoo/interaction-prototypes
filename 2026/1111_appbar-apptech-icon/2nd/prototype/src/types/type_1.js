/* Type 1 전용 동작
   각 영역(앱바 · 헤더 · 빅배너 · 퀵메뉴 · 캠페인 섹션 · 광고판 · FAB · 바텀네비 등)은 src/common/영역.js */

/* 인덱스 OPTIONS 카드 → 프로토타입 (프로토타입 안에는 옵션창을 두지 않음 · 공용 틀 규칙)
   '이벤트 아이콘'(checkin) · '스토어'(store) 값은 common.js protoOptions가 <html data-checkin · data-store>에 넣음
   (인덱스 · 주소 ?opt-checkin=static&opt-store=kids · 폰 동기화 모두 같은 길)
   - 이벤트 아이콘 상태(checkin): badge 배지 모션 · lottie 로티로 재생 · static 정지 이미지 · off 없음
     .phone[data-checkin]에 넣고 'checkinchange' 이벤트 (detail: 상태). off 면 is-no-checkin (type_1.css가 체크인 칸을 숨김)
     lottie: 체크인 아이콘 로티 파일이 없어 프로토타입은 정지 핀으로 보여 줌 (동전 로티 딜레이만 다름)
   - 스토어: common.js setStore → 'storechange' */
(function () {
  var MODES = ['badge', 'lottie', 'static', 'off'];
  var phone = document.querySelector('.phone');
  var root = document.documentElement;
  if (!phone) return;

  function modeFromOptions() {
    var value = root.getAttribute('data-checkin');
    return MODES.indexOf(value) === -1 ? 'badge' : value;
  }
  function apply(mode) {
    phone.dataset.checkin = mode;
    phone.classList.toggle('is-no-checkin', mode === 'off');
  }

  window.getCheckinMode = function () { return phone.dataset.checkin; };

  function syncStore() {
    var store = root.getAttribute('data-store');
    if (store && store !== phone.dataset.store && window.setStore) window.setStore(store);
  }
  syncStore();
  apply(modeFromOptions()); /* 처음 값 (이벤트 없이) */
  new MutationObserver(function () {
    syncStore();
    var mode = modeFromOptions();
    if (mode === phone.dataset.checkin) return;
    apply(mode);
    window.dispatchEvent(new CustomEvent('checkinchange', { detail: mode }));
  }).observe(root, { attributes: true, attributeFilter: ['data-store', 'data-checkin'] });
})();

/* 앱바 체크인 "이벤트" 배지 모션 (모양 · 시간 값은 type_1.css 변수)
   랜딩 1초 후 등장(scale 0→1 mds.spring.bouncy + opacity 0→1 0.15s linear)
   → 등장 모션이 끝나고 3초 노출 → 사라짐(scale 1→0 spring.bouncy + opacity 1→0 0.15s linear)
   → 완전히 사라진 뒤 6초 후 다시 등장, 반복. 중심점은 배지 좌하단
   처음 열 때 · 전문관이 바뀔 때('storechange') 처음부터 다시
   필요: Motion (CDN) */
(function () {
  var badge = document.getElementById('checkinBadge');
  if (!badge || !window.Motion) return;

  var run = 0;        /* 다시 시작하면 이전 순서를 버리기 위한 번호 */
  var animation = null;
  var timer = null;

  function cssNumber(name) {
    return parseFloat(getComputedStyle(badge).getPropertyValue(name));
  }

  function wait(seconds, id) {
    return new Promise(function (resolve) {
      timer = setTimeout(function () { if (id === run) resolve(); }, seconds * 1000);
    });
  }

  function animate(scale, opacity, id) {
    animation = Motion.animate(badge, { scale: scale, opacity: opacity }, {
      scale: { type: 'spring', stiffness: cssNumber('--checkin-badge-spring-stiffness'), damping: cssNumber('--checkin-badge-spring-damping') },
      opacity: { duration: cssNumber('--checkin-badge-fade'), ease: 'linear' }
    });
    return animation.then(function () {
      if (id !== run) return new Promise(function () {}); /* 다시 시작됐으면 여기서 멈춤 */
    });
  }

  function loop(id) {
    return animate([0, 1], [0, 1], id)
      .then(function () { return wait(cssNumber('--checkin-badge-show'), id); })
      .then(function () {
        animate([1, 0], [1, 0], id); /* 스프링이 끝나길 기다리지 않음: 투명도가 0이 된 순간 = 완전히 사라짐 */
        return wait(cssNumber('--checkin-badge-fade'), id);
      })
      .then(function () { return wait(cssNumber('--checkin-badge-hide'), id); })
      .then(function () { return loop(id); });
  }

  function start() {
    run += 1;
    var id = run;
    clearTimeout(timer);
    if (animation) animation.stop();
    Motion.animate(badge, { scale: 0, opacity: 0 }, { duration: 0 });
    if (window.getCheckinMode() !== 'badge') return; /* 배지 모션은 이벤트 아이콘이 '배지 모션'일 때만 */
    wait(cssNumber('--checkin-badge-first-delay'), id).then(function () { return loop(id); });
  }

  window.addEventListener('storechange', start);
  window.addEventListener('checkinchange', start); /* 상태를 바꾸면 랜딩처럼 1초 후 첫 등장부터 */
  (window.protoReady || Promise.resolve()).then(start); /* 처음 랜딩은 페이지 로딩이 끝난 뒤부터 (common.js) */
})();

/* 모든 스토어: 아이콘 색별 앱테크 아이콘 로티(src/lottie/ic_appbar_apptech_white · black · kids.json)
   어떤 스토어가 어떤 파일인지는 LOTTIE_FILES (앱바 아이콘 색 --store-icon과 같게). 파일이 바뀌는 스토어로 가면 다시 불러옴
   재생 타이밍 (2026-11-26 변경): 랜딩 후 이벤트 아이콘 상태별 딜레이 → 0프레임부터 재생 → 계속 루핑
     배지 모션 4.5초 · 로티 2.8초 · 정지 이미지 0초 · 없음 0초 (값은 type_1.css --apptech-delay-*)
     딜레이 동안은 첫 프레임에서 멈춤. 재생을 시작한 뒤에는 배지가 사라지거나 다시 나와도 건드리지 않음
     랜딩: 처음 열기(페이지 로딩 끝) · 스토어 전환 · 이벤트 아이콘 상태 변경
   배경이 투명해서 광고판 진입 · 이탈 때도 같은 로티를 끊김 없이 계속 재생
   필요: lottie-web (CDN) */
(function () {
  var LOTTIE_FILES = { /* 스토어 → 로티 (흰 아이콘 white · 검정 아이콘 black · 키즈 주황 kids) */
    musinsa: 'white', beauty: 'white', outlet: 'white', boutique: 'white', kicks: 'white',
    sports: 'black', used: 'black',
    kids: 'kids'
  };
  var DEFAULT_FILE = 'white';
  var VERSION = '?v=20261126-01';
  var phone = document.querySelector('.phone');
  var container = document.getElementById('rewardLottie');
  if (!container || !window.lottie) return;

  var animation = null;
  var loadedFile = null;
  var landed = false; /* 페이지 로딩이 끝났는지 (그 전엔 첫 프레임에서 멈춰 둠) */
  var landedAt = 0;   /* 마지막 랜딩 시각 (로티 파일을 늦게 받아도 딜레이는 랜딩부터 셈) */
  var timer = null;

  function delayOf(mode) {
    var value = parseFloat(getComputedStyle(phone).getPropertyValue('--apptech-delay-' + mode));
    return isNaN(value) ? 0 : value;
  }

  /* 랜딩: 첫 프레임에서 멈춤 → 이벤트 아이콘 상태별 딜레이 뒤 0프레임부터 루프 재생 */
  function land() {
    landedAt = Date.now();
    schedule();
  }
  function schedule() {
    clearTimeout(timer);
    if (!animation || !animation.isLoaded) return;
    animation.goToAndStop(0, true);
    if (!landed) return;
    var left = delayOf(window.getCheckinMode()) * 1000 - (Date.now() - landedAt);
    timer = setTimeout(function () { animation.goToAndPlay(0, true); }, Math.max(0, left));
  }

  /* 지금 스토어의 로티를 불러와 랜딩. 같은 파일을 쓰는 스토어끼리 옮길 땐 다시 불러오지 않음 */
  function load() {
    var file = LOTTIE_FILES[phone.dataset.store] || DEFAULT_FILE;
    if (file === loadedFile && animation) {
      land();
      return;
    }
    if (animation) animation.destroy();
    loadedFile = file;
    animation = lottie.loadAnimation({
      container: container,
      renderer: 'svg',
      loop: true,
      autoplay: false,
      path: 'src/lottie/ic_appbar_apptech_' + file + '.json' + VERSION
    });
    animation.addEventListener('DOMLoaded', schedule);
    land();
  }

  window.addEventListener('storechange', load);
  window.addEventListener('checkinchange', land);
  load();
  /* 처음 랜딩은 페이지 로딩이 끝난 뒤 (common.js). 그 전엔 체크인이 없어도 첫 프레임에서 멈춰 있음 */
  (window.protoReady || Promise.resolve()).then(function () { landed = true; land(); });
})();
