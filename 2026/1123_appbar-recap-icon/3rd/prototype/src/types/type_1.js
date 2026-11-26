/* Type 1 전용 동작 — 리캡 아이콘 로티 (스토어별 헤더)
   헤더(게이트웨이 로티 · 검색창 · 탭) · 바텀네비 · FAB 동작은 src/common/storeheader · bottomnavi */

/* 인덱스 OPTIONS 카드 '아이콘' · '지면' → 프로토타입
   값은 common.js protoOptions가 <html data-icon · data-store>에 넣음 (인덱스 · 주소 ?opt-icon=checkin&opt-store=kids · 폰 동기화 모두 같은 길)
   - 아이콘(recap 로티 · checkin 뱃지 · still 정지 이미지 · none 없음): .phone 에 data-icon (+ 체크인이면 is-checkin) → type_1.css 가 아이콘 자리를 바꿈 + 'iconchange' 이벤트
   - 스토어 8개: common.js setStore → 'storechange' (헤더 색 · 로고 · 로티가 알아서 바뀜)
   - 마이(my): 스토어가 아님 → .phone 에 is-my (type_1.css 가 마이 앱바 · 마이 콘텐츠로 바꿈) + 'mychange' 이벤트 (detail: 켜짐 여부)
     스토어는 직전 것을 그대로 둠 (마이에서 다른 지면으로 가면 그 스토어로) */
(function () {
  var phone = document.querySelector('.phone');
  var root = document.documentElement;
  if (!phone) return;

  /* 브라우저 상단(사파리 주소창 · 상태바, 안드로이드 크롬 툴바) 색 = 지금 지면의 헤더 색 (<meta name="theme-color">)
     뷰티 · 킥스는 헤더가 그라디언트 · 체크무늬라 스토어 단색으로 */
  var THEME_COLOR = {
    musinsa: '#1A1B1F', beauty: '#F2665E', sports: '#FFFFFF', outlet: '#B90000',
    kids: '#3734B8', boutique: '#0000FF', kicks: '#009FF9', used: '#F7E74B',
    my: '#F5F5F5'
  };
  var themeMeta = document.querySelector('meta[name="theme-color"]');
  function syncTheme() {
    var color = THEME_COLOR[phone.classList.contains('is-my') ? 'my' : phone.dataset.store];
    if (themeMeta && color) themeMeta.setAttribute('content', color);
  }
  window.addEventListener('storechange', syncTheme);
  window.addEventListener('mychange', syncTheme);

  /* 바텀네비 선택: 스토어 지면은 홈, 마이페이지는 마이 (이동 모션은 bottomnavi.js bottomNavi.select) */
  function syncNavi(instant) {
    if (!window.bottomNavi) return;
    window.bottomNavi.select(phone.classList.contains('is-my') ? 'my' : 'home', { instant: instant === true });
  }
  window.addEventListener('mychange', syncNavi);

  function sync() {
    var store = root.getAttribute('data-store');
    var my = store === 'my';
    if (!my && store && store !== phone.dataset.store && window.setStore) window.setStore(store);
    /* 아이콘 자리 상태: recap(로티) · checkin(뱃지 모션) · still(정지 이미지) · none(없음) */
    var icon = root.getAttribute('data-icon') || 'recap';
    if (icon !== phone.dataset.icon) {
      phone.dataset.icon = icon;
      phone.classList.toggle('is-checkin', icon === 'checkin');
      window.dispatchEvent(new CustomEvent('iconchange', { detail: icon }));
    }
    if (my !== phone.classList.contains('is-my')) {
      phone.classList.toggle('is-my', my);
      window.dispatchEvent(new CustomEvent('mychange', { detail: my }));
    }
  }
  sync();
  syncTheme();
  syncNavi(true); /* 처음 상태는 모션 없이 */
  new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ['data-store', 'data-icon'] });
})();

/* ── 앱바 아이콘 로티 설정 ──
   리캡 아이콘 로티 (지면별 색 파일 — 아래 RECAP_FILE · 옵션 '동일 로티 사용'을 켜면 모든 지면 white · 원본 appbar_2026recap_색.json 의 용량 최적화본)
     280×280 · 60fps · 450프레임 = 7.5초 · 원본 속도 · 바탕 투명. 색 구분은 앱테크 코인과 같음 (STORE_COLOR)
     랜딩하자마자 0프레임부터 재생 → 끝나면 쉬지 않고 계속 루핑
   앱테크 코인 (스토어 아이콘 색별 파일: white · black · kids / 마이 앱바는 항상 black)
     랜딩 후 딜레이 동안 첫 프레임에서 정지 → 재생 시작 → 계속 루핑
     딜레이 기준 = 코인 옆(왼쪽) 아이콘 자리의 상태 (COIN_DELAY)
       뱃지 모션이 있을 때 (체크인 + "이벤트" 배지)  4.5초
       로티일 때 (리캡 로티)                         2.8초
       아이콘이 없을 때                              0초
       정지 이미지일 때                              0초   (리캡 로티 파일을 못 불러와 정지 이미지로 보일 때도 같음)
   랜딩 = 처음 열기 · 지면 전환(스토어 · 마이) · 아이콘 옵션 전환 · 동일 로티 사용 전환 · 리캡/체크인 아이콘 누름 → 모두 처음부터 다시

   체크인 "이벤트" 배지 (26-1106 체크인진입모션 값)
     랜딩 1초 후 등장(scale 0→1 mds.spring.bouncy + opacity 0→1 0.15s linear) → 3초 노출
     → 사라짐(같은 이징 반대로) → 6초 후 다시 등장, 반복 (값은 type_1.css --checkin-badge-*)
     필요: Motion (CDN) */
var VERSION = '?v=20261125-45';
/* 스토어 → 아이콘 색 (흰 아이콘 white · 검정 아이콘 black · 키즈 주황 kids). 리캡 로티 · 앱테크 코인이 같이 씀 */
var STORE_COLOR = {
  musinsa: 'white', beauty: 'white', outlet: 'white', boutique: 'white', kicks: 'white',
  sports: 'black', used: 'black',
  kids: 'kids'
};
var MY_COLOR = 'black'; /* 마이 앱바 */

/* 리캡 로티: 지면 → 파일 (ic_appbar_recap_<값>.json)
     무신사 · 뷰티 · 아울렛 · 부티크 · 킥스   white
     스포츠 · 유즈드 · 마이                   black mat (ic_appbar_recap_black_mat_thin.json)
     키즈                                     kids
   인덱스 옵션 '동일 로티 사용'(<html data-same-lottie="on">)을 켜면 모든 지면이 white
   (폴더의 black · black_mat · gray · gray_mat · white_mat 은 색 시험 때 쓰던 파일 — 지금은 안 씀) */
var RECAP_FILE = {
  musinsa: 'white', beauty: 'white', outlet: 'white', boutique: 'white', kicks: 'white',
  sports: 'black_mat_thin', used: 'black_mat_thin', my: 'black_mat_thin',
  kids: 'kids'
};
var RECAP_SAME = 'white'; /* 동일 로티 사용 */
var RECAP_LOTTIE = {
  path: function (color) { return 'src/lottie/ic_appbar_recap_' + color + '.json' + VERSION; }
};
var APPTECH_LOTTIE = {
  path: function (color) { return 'src/lottie/ic_appbar_apptech_' + color + '.json' + VERSION; }
};
/* 코인 재생 딜레이 (초): 옆 아이콘 자리 상태별 */
var COIN_DELAY = { checkin: 4.5, recap: 2.8, none: 0, still: 0 };

/* 로티 하나를 불러와 { ready, animation } 으로 돌려줌 (루핑, 자동 재생 안 함)
   ready : 불러오면 true, 파일이 없거나 실패하거나 다 불러오기 전에 지워지면 false 로 끝나는 Promise */
function loadIconLottie(container, path) {
  var animation = lottie.loadAnimation({
    container: container,
    renderer: 'svg',
    loop: true,
    autoplay: false,
    path: path
  });
  var ready = new Promise(function (resolve) {
    animation.addEventListener('DOMLoaded', function () {
      animation.goToAndStop(0, true);
      resolve(true);
    });
    animation.addEventListener('data_failed', function () { resolve(false); });
    animation.addEventListener('destroy', function () { resolve(false); });
  });
  return { animation: animation, ready: ready };
}

(function () {
  var phone = document.querySelector('.phone');
  var recapBox = document.getElementById('recapLottie');
  var apptechBox = document.getElementById('rewardLottie');
  var recapIcon = document.getElementById('recapIcon');
  if (!phone || !recapBox || !apptechBox || !window.lottie) return;

  /* 스토어 헤더의 리캡 · 코인: 스토어 색에 맞는 파일 (loadIcons) */
  var recap = { config: RECAP_LOTTIE, box: recapBox, color: null, lottie: null, loaded: false };
  var apptech = { config: APPTECH_LOTTIE, box: apptechBox, color: null, lottie: null, loaded: false };
  var myBox = document.getElementById('myRewardLottie');
  var myRecapBox = document.getElementById('myRecapLottie');
  var myRecapIcon = document.getElementById('myRecapIcon');
  /* 마이 앱바의 리캡 · 코인(검정): 마이를 처음 고를 때 불러옴 */
  var myRecap = { config: RECAP_LOTTIE, box: myRecapBox, color: null, lottie: null, loaded: false };
  var myApptech = { config: APPTECH_LOTTIE, box: myBox, color: null, lottie: null, loaded: false };
  var root = document.documentElement;
  var items = [recap, apptech, myRecap, myApptech];
  var timers = [];
  var landed = false; /* 페이지 로딩이 끝났는지 (그 전엔 첫 프레임에서 멈춰 둠) */

  function track(item) {
    var current = item.lottie;
    return current.ready.then(function (loaded) {
      if (item.lottie === current) item.loaded = loaded;
    });
  }

  /* 로티 하나를 그 색 파일로. 이미 그 색이면 다시 불러오지 않음 */
  function setColor(item, color) {
    if (!item.box || color === item.color) return Promise.resolve();
    item.color = color;
    item.loaded = false;
    if (item.lottie) item.lottie.animation.destroy();
    item.lottie = loadIconLottie(item.box, item.config.path(color));
    return track(item);
  }

  /* 지금 지면 · 옵션에 맞는 색으로 리캡 · 코인 로티를 맞춤
     - 코인: 스토어 색 (STORE_COLOR) / 마이 앱바는 검정. 리캡: 지면별 파일 (RECAP_FILE)
     - 마이 앱바 로티는 마이를 한 번이라도 고른 뒤부터 불러옴
     - 인덱스 옵션 '동일 로티 사용'(<html data-same-lottie="on">): 리캡 로티만 모든 지면에서 white 로 (코인은 그대로 색별) */
  function loadIcons() {
    var store = phone.dataset.store;
    var storeColor = STORE_COLOR[store] || 'white';
    var same = root.getAttribute('data-same-lottie') === 'on';
    var jobs = [setColor(recap, same ? RECAP_SAME : RECAP_FILE[store] || 'white'), setColor(apptech, storeColor)];
    if (phone.classList.contains('is-my') || myRecap.lottie) {
      jobs.push(setColor(myRecap, same ? RECAP_SAME : RECAP_FILE.my), setColor(myApptech, MY_COLOR));
    }
    return Promise.all(jobs).then(function () {
      /* 리캡 로티 파일 없음 → 정지 아이콘 */
      recapIcon.classList.toggle('is-still', !recap.loaded);
      if (myRecapIcon && myRecap.lottie) myRecapIcon.classList.toggle('is-still', !myRecap.loaded);
    });
  }

  /* ── 체크인 "이벤트" 배지 (스토어 헤더 · 마이 앱바 두 곳을 같이 움직임) ── */
  var badges = [].slice.call(document.querySelectorAll('.appbar-checkin-badge'));
  var badgeRun = 0;      /* 다시 시작하면 이전 순서를 버리기 위한 번호 */
  var badgeMotion = null;
  var badgeTimer = null;

  function badgeNumber(name) {
    return parseFloat(getComputedStyle(badges[0]).getPropertyValue(name));
  }
  function badgeWait(seconds, id) {
    return new Promise(function (resolve) {
      badgeTimer = setTimeout(function () { if (id === badgeRun) resolve(); }, seconds * 1000);
    });
  }
  /* from → to 로 페이드(linear) + 스케일(spring) 동시 진행 */
  function badgeAnimate(from, to) {
    badgeMotion = Motion.animate(badges, { opacity: [from, to], scale: [from, to] }, {
      opacity: { duration: badgeNumber('--checkin-badge-fade'), ease: 'linear' },
      scale: {
        type: 'spring',
        stiffness: badgeNumber('--checkin-badge-spring-stiffness'),
        damping: badgeNumber('--checkin-badge-spring-damping')
      }
    });
    return badgeMotion;
  }
  function badgeStop() {
    badgeRun += 1;
    clearTimeout(badgeTimer);
    if (badgeMotion) badgeMotion.stop();
    if (window.Motion && badges.length) Motion.animate(badges, { opacity: 0, scale: 0 }, { duration: 0 });
  }
  function badgeStart() {
    badgeStop();
    if (!window.Motion || !badges.length) return;
    var id = badgeRun;
    function loop() {
      if (id !== badgeRun) return;
      badgeAnimate(0, 1).then(function () { return badgeWait(badgeNumber('--checkin-badge-show'), id); })
        .then(function () {
          badgeAnimate(1, 0); /* 스프링이 끝나길 기다리지 않음: 투명도가 0이 된 순간 = 완전히 사라짐 */
          return badgeWait(badgeNumber('--checkin-badge-fade'), id);
        })
        .then(function () { return badgeWait(badgeNumber('--checkin-badge-hide'), id); })
        .then(loop);
    }
    badgeWait(badgeNumber('--checkin-badge-first-delay'), id).then(loop);
  }

  function start() {
    var icon = phone.dataset.icon || 'recap';
    var recaps = [recap, myRecap];
    var coins = [apptech, myApptech];
    timers.forEach(clearTimeout);
    timers = [];
    items.forEach(function (item) { if (item.loaded) item.lottie.animation.goToAndStop(0, true); });

    /* 아이콘 자리 */
    if (icon === 'checkin') badgeStart();
    else badgeStop();
    if (icon === 'recap') {
      recaps.forEach(function (item) { if (item.loaded) item.lottie.animation.goToAndPlay(0, true); });
    }

    /* 코인: 옆 아이콘 상태에 맞는 딜레이 뒤 루핑. 리캡인데 로티 파일을 못 불러와 정지 이미지로 보이면 정지 이미지 기준 */
    var state = icon === 'recap' && !recap.loaded ? 'still' : icon;
    var delay = COIN_DELAY[state] || 0;
    timers = coins.filter(function (item) { return item.loaded; }).map(function (item) {
      var animation = item.lottie.animation;
      return setTimeout(function () { animation.goToAndPlay(0, true); }, delay * 1000);
    });
  }

  function reload() {
    loadIcons().then(function () { if (landed) start(); });
  }
  window.addEventListener('storechange', reload);
  window.addEventListener('mychange', reload);
  new MutationObserver(reload).observe(root, { attributes: true, attributeFilter: ['data-same-lottie'] });

  window.addEventListener('iconchange', function () { if (landed) start(); });
  [].forEach.call(document.querySelectorAll('.appbar-icon--checkin'), function (icon) {
    icon.addEventListener('click', function () { if (landed) start(); });
  });

  Promise.all([loadIcons(), window.protoReady || Promise.resolve()]).then(function () {
    landed = true;
    window.playRecapIcon = start;
    recapIcon.addEventListener('click', start);
    if (myRecapIcon) myRecapIcon.addEventListener('click', start);
    start();
  });
})();
