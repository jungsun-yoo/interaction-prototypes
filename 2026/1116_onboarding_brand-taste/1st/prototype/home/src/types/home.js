/* Type 1 전용 동작
   각 영역(앱바 · 헤더 · 빅배너 · 퀵메뉴 · 캠페인 섹션 · 광고판 · FAB · 바텀네비 등)은 src/common/영역.js */

/* 체크인 아이콘 켜기 · 끄기 (옵션 컨트롤 '이벤트 아이콘' 체크박스 → window.setCheckin)
   끄면 .phone에 is-no-checkin (type_1.css가 체크인 칸을 숨김) + 'checkinchange' 이벤트 (detail: 켜짐 여부)
   주소 ?checkin=0 이면 꺼진 채로 열림 (새로고침 · QR 공유에도 유지) */
(function () {
  var phone = document.querySelector('.phone');
  if (!phone) return;
  phone.classList.toggle('is-no-checkin', new URLSearchParams(location.search).get('checkin') === '0');

  window.isCheckinOn = function () { return !phone.classList.contains('is-no-checkin'); };
  window.setCheckin = function (on) {
    if (on === window.isCheckinOn()) return;
    phone.classList.toggle('is-no-checkin', !on);
    var url = new URL(location.href);
    if (on) url.searchParams.delete('checkin');
    else url.searchParams.set('checkin', '0');
    history.replaceState(null, '', url);
    window.dispatchEvent(new CustomEvent('checkinchange', { detail: on }));
  };
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

  /* 배지 시점을 알림 → 아래 앱테크 영상이 맞춰 재생 ('checkinbadge', detail: 'hidden' 완전히 사라짐 · 'reappear' 다시 등장) */
  function notify(moment) {
    window.dispatchEvent(new CustomEvent('checkinbadge', { detail: moment }));
  }

  function loop(id, first) {
    if (!first) notify('reappear');
    return animate([0, 1], [0, 1], id)
      .then(function () { return wait(cssNumber('--checkin-badge-show'), id); })
      .then(function () {
        animate([1, 0], [1, 0], id); /* 스프링이 끝나길 기다리지 않음: 투명도가 0이 된 순간 = 완전히 사라짐 */
        return wait(cssNumber('--checkin-badge-fade'), id);
      })
      .then(function () {
        notify('hidden');
        return wait(cssNumber('--checkin-badge-hide'), id);
      })
      .then(function () { return loop(id, false); });
  }

  function start() {
    run += 1;
    var id = run;
    clearTimeout(timer);
    if (animation) animation.stop();
    Motion.animate(badge, { scale: 0, opacity: 0 }, { duration: 0 });
    if (!window.isCheckinOn()) return; /* 체크인 아이콘이 없으면 배지 모션 없음 */
    wait(cssNumber('--checkin-badge-first-delay'), id).then(function () { return loop(id, true); });
  }

  window.addEventListener('storechange', start);
  window.addEventListener('checkinchange', start); /* 다시 켜면 랜딩처럼 1초 후 첫 등장부터 */
  start();
})();

/* 모든 스토어: 아이콘 색별 앱테크 아이콘 로티(src/lottie/ic_appbar_apptech_white · black · kids.json)를 체크인 배지에 맞춰 재생
   어떤 스토어가 어떤 파일인지는 LOTTIE_FILES (앱바 아이콘 색 --store-icon과 같게). 파일이 바뀌는 스토어로 가면 다시 불러옴
   재생 기준 (체크인 아이콘 켜짐 여부, window.isCheckinOn)
   - 체크인 아이콘 있음: 랜딩 직후엔 첫 프레임에서 멈춤 → 배지가 투명도로 완전히 사라지면 재생 시작, 이후 루프
     로티 길이(291프레임 ≒ 9.7초) ≒ 배지 한 바퀴(등장 0.52 + 노출 3 + 사라짐 0.15 + 대기 6)
     조금씩 밀리지 않게, 배지가 사라질 때마다 0프레임부터 다시 재생. 배지가 다시 등장할 때는 건드리지 않음
   - 체크인 아이콘 없음: 랜딩(처음 열기 · 스토어 전환 · 체크박스 끔)하자마자 0프레임부터 루프 재생
   배경이 투명해서 광고판 진입 · 이탈 때도 같은 로티를 끊김 없이 계속 재생
   필요: lottie-web (CDN) */
(function () {
  var LOTTIE_FILES = { /* 스토어 → 로티 (흰 아이콘 white · 검정 아이콘 black · 키즈 주황 kids) */
    musinsa: 'white', beauty: 'white', outlet: 'white', boutique: 'white', kicks: 'white',
    sports: 'black', used: 'black',
    kids: 'kids'
  };
  var DEFAULT_FILE = 'white';
  var VERSION = '?v=20261111-27';
  var phone = document.querySelector('.phone');
  var container = document.getElementById('rewardLottie');
  if (!container || !window.lottie) return;

  var animation = null;
  var loadedFile = null;

  /* 랜딩 시작점: 체크인 있으면 첫 프레임에서 대기(배지 기다림), 없으면 바로 루프 재생 */
  function land() {
    if (!animation || !animation.isLoaded) return;
    if (window.isCheckinOn()) animation.goToAndStop(0, true);
    else animation.goToAndPlay(0, true);
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
    animation.addEventListener('DOMLoaded', land);
  }

  function playFromStart(event) {
    if (!animation || !window.isCheckinOn() || event.detail !== 'hidden') return; /* 체크인 있음: 배지가 완전히 사라졌을 때만 */
    animation.goToAndPlay(0, true);
  }

  window.addEventListener('storechange', load);
  window.addEventListener('checkinchange', land);
  window.addEventListener('checkinbadge', playFromStart);
  load();
})();

/* 취향선택브랜드: 홈 진입 시 '내 취향 브랜드 맞춤 추천' 모듈로 자동 스크롤 (포커싱)
   - 홈이 보일 때마다 Type_1.html homePage.show가 window.homeReset(맨 위로) → 0.35초 페이드 인 → 끝나면(= 페이지 랜딩) window.homeFocus → 0.5초 뒤
     모듈이 헤더 아래 보이는 영역의 가운데에 오도록 스크롤. 0.4초, MDS 2.0 power3.easeInOut (cubic-bezier(0.33, 0, 0.2, 1))
   - 조건 (명세 필수): 자동 스크롤 중에는 상단 헤더 고정 (<html class="is-header-hold">, storeheader.js가 접힘을 건너뜀)
                      자동 스크롤이 끝나면 원래 홈처럼: 사용자가 내리면 그 자리부터 헤더가 접히고 탭은 스티키
                      바텀 네비게이션 · FAB은 자동 스크롤이 시작되면 사라짐 (아래로 스크롤할 때와 같은 상태)
   - 자동 스크롤 중 사용자가 만지거나 휠을 굴리면 멈춤
   필요: common.js (pageScroll), Motion (CDN) */
(function () {
  var DELAY = 500;    /* 페이지 랜딩(페이드 인 끝) 후 대기 (ms) */
  var DURATION = 0.4; /* 이동 시간 (s) */
  var EASE = [0.33, 0, 0.2, 1]; /* mds power3.easeInOut */
  var moduleEl = document.querySelector('.taste-brand');
  var header = document.querySelector('.header');
  var phone = document.querySelector('.phone');
  var navigation = document.querySelector('.navigation');
  var fab = document.querySelector('.fab');

  /* 바텀 네비게이션 · FAB 보이기/숨기기 (bottomnavi.js의 스크롤 방향 규칙과 같은 상태) */
  function setBottomVisible(visible) {
    if (navigation) navigation.style.opacity = visible ? '1' : '0';
    if (fab) fab.classList.toggle('is-hidden', !visible);
  }
  if (!moduleEl || !header || !window.Motion) return;

  var timer = null;
  var run = null;

  var root = document.documentElement;
  /* 자동 스크롤이 끝나거나 멈추면 헤더는 원래 홈 규칙으로 (지금 위치를 기준으로 맞춘 뒤 고정을 풂) */
  function releaseHeader() {
    if (window.storeHeader) storeHeader.sync();
    root.classList.remove('is-header-hold');
  }
  /* 자동 스크롤이 돌고 있을 때(대기 · 이동 · 헤더 고정 중)만 멈춤. 평소 휠 · 터치는 건드리지 않음
     (평소에도 기준 위치를 맞추면 휠 스크롤마다 접힘이 사라져 헤더가 거의 접히지 않음) */
  function stop() {
    var active = timer || run || root.classList.contains('is-header-hold');
    clearTimeout(timer);
    timer = null;
    if (run) { run.stop(); run = null; }
    if (active) releaseHeader();
  }

  /* 모듈 가운데가 (헤더 아래 ~ 화면 아래) 가운데에 오는 스크롤 위치 */
  function targetScroll() {
    var top = header.getBoundingClientRect().bottom;
    var bottom = pageScroll.isTouch ? window.innerHeight : phone.getBoundingClientRect().bottom;
    var rect = moduleEl.getBoundingClientRect();
    return pageScroll.get() + (rect.top + rect.height / 2) - (top + (bottom - top) / 2);
  }

  /* 처음 상태: 맨 위 · 헤더 고정 · 바텀 네비 보임 (페이드 인 전에 부름) */
  window.homeReset = function () {
    stop();
    if (window.storeHeader) storeHeader.reset(); else header.style.setProperty('--header-offset', '0px'); /* 헤더: 펼친 처음 위치 */
    pageScroll.set(0);
    setBottomVisible(true);   /* 랜딩: 맨 위라 보임 */
  };

  /* 랜딩(페이드 인 끝)부터 0.5초 뒤 자동 스크롤 */
  window.homeFocus = function () {
    window.homeReset();
    timer = setTimeout(function () {
      timer = null;
      setBottomVisible(false); /* 자동 스크롤 시작 → 바텀 네비게이션 사라짐 */
      root.classList.add('is-header-hold'); /* 자동 스크롤 동안 헤더 고정 */
      run = Motion.animate(pageScroll.get(), Math.max(0, targetScroll()), {
        duration: DURATION,
        ease: EASE,
        onUpdate: pageScroll.set
      });
      run.then(function () {
        run = null;
        requestAnimationFrame(function () { requestAnimationFrame(releaseHeader); }); /* 마지막 스크롤 이벤트가 지나간 뒤 */
      });
    }, DELAY);
  };

  pageScroll.target.addEventListener('touchstart', stop, { passive: true });
  pageScroll.target.addEventListener('wheel', stop, { passive: true });
  window.addEventListener('pagescroll:wheel', stop);
})();

