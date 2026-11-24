/* type_1.js — 리캡 아이콘 로티 */

/* 게이트웨이 버튼 로티: 자동재생 · 무한루프 */
(function () {
    var container = document.getElementById('appbarGateway');
    if (!container || !window.lottie) return;
    lottie.loadAnimation({
        container: container,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: 'src/lottie/ic_gateway_affordance.json'
    });
})();

/* ── 앱바 아이콘 로티 설정 ──
   리캡 아이콘 로티 (280×280 · 60fps · 581프레임 ≒ 9.7초 · 용량 최적화본: 이미지 4배 해상도 WebP) — 인덱스 옵션 카드 '전환 타입'으로 고름
     디졸브 스위치   <html data-mode-dissolve="on">  + 문구 data-dissolve-type="log | recap"
     상하전환 스위치 <html data-mode-slide="on">     + 문구 data-slide-type="log | recap | mix"
     (스위치는 둘 중 하나만 켜짐. 둘 다 끄면 로티 없이 정지 아이콘)
       log   : 2026 ↔ 쇼핑로그
       recap : 2026 ↔ RECAP
       mix   : 2026 → RECAP → 쇼핑로그 → 2026 (상하전환만)
     랜딩하자마자 0프레임부터 재생 → 끝나면 쉬지 않고 계속 루핑
   앱테크 코인
     랜딩 후 4.5초 동안 첫 프레임에서 정지 → 재생 시작 → 계속 루핑
   delay : 화면이 보인 뒤 첫 재생까지 (초). 그동안은 첫 프레임에서 정지
   로티 파일을 못 불러오면 정지 아이콘으로 보임 */
var RECAP_LOTTIE = {
    paths: {
        dissolve: {
            log: 'src/lottie/ic_appbar_recap_dissolve_log.json?v=20261124-16',
            recap: 'src/lottie/ic_appbar_recap_dissolve_recap.json?v=20261124-16'
        },
        slide: {
            log: 'src/lottie/ic_appbar_recap_slide_log.json?v=20261124-16',
            recap: 'src/lottie/ic_appbar_recap_slide_recap.json?v=20261124-16',
            mix: 'src/lottie/ic_appbar_recap_slide_mix.json?v=20261124-16'
        }
    },
    delay: 0
};
var APPTECH_LOTTIE = {
    path: 'src/lottie/ic_appbar_apptech_white.json?v=20261124-16',
    delay: 4.5
};

/* 로티 하나를 불러와 { ready, animation } 으로 돌려줌 (루핑, 자동 재생 안 함)
   ready : 불러오면 true, 파일이 없거나 실패하면 false 로 끝나는 Promise
   불러오면 칸에 is-lottie 를 붙이고 실패하면 뗌 (앱테크: is-lottie 면 아래 정지 아이콘 숨김 · 리캡은 is-still 로 따로 처리) */
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
            container.parentNode.classList.add('is-lottie');
            animation.goToAndStop(0, true);
            resolve(true);
        });
        animation.addEventListener('data_failed', function () {
            container.parentNode.classList.remove('is-lottie');
            resolve(false);
        });
    });
    return { animation: animation, ready: ready };
}

/* 재생: 로티마다 첫 프레임에서 delay 만큼 멈춰 있다가 0프레임부터 루핑 (설정은 위 RECAP_LOTTIE · APPTECH_LOTTIE)
   리캡 아이콘을 누르거나 옵션(전환 타입 · 문구)을 바꾸면 둘 다 처음(delay)부터 다시 */
(function () {
    var recapBox = document.getElementById('recapLottie');
    var apptechBox = document.getElementById('rewardLottie');
    var recapIcon = document.getElementById('recapIcon');
    var root = document.documentElement;
    if (!recapBox || !apptechBox || !window.lottie) return;

    /* 지금 옵션에 맞는 리캡 로티 파일. 스위치가 둘 다 꺼져 있으면 '' (정지 아이콘) */
    function recapPath() {
        var mode = root.getAttribute('data-mode-dissolve') === 'on' ? 'dissolve'
            : root.getAttribute('data-mode-slide') === 'on' ? 'slide' : '';
        if (!mode) return '';
        return RECAP_LOTTIE.paths[mode][root.getAttribute('data-' + mode + '-type')] || RECAP_LOTTIE.paths[mode].log;
    }

    var recap = { config: RECAP_LOTTIE, path: null, lottie: null, loaded: false };
    var apptech = { config: APPTECH_LOTTIE, lottie: loadIconLottie(apptechBox, APPTECH_LOTTIE.path), loaded: false };
    var items = [recap, apptech];
    var timers = [];
    var started = false; /* 화면이 보인 뒤부터 true */

    function start() {
        timers.forEach(clearTimeout);
        timers = items.filter(function (item) { return item.loaded; }).map(function (item) {
            var animation = item.lottie.animation;
            animation.goToAndStop(0, true);
            return setTimeout(function () { animation.goToAndPlay(0, true); }, item.config.delay * 1000);
        });
    }

    function track(item) {
        var current = item.lottie;
        return current.ready.then(function (loaded) {
            if (item.lottie === current) item.loaded = loaded;
        });
    }

    /* 리캡 로티를 지금 옵션에 맞는 파일로 바꿔 끼움. 끝나면(불러옴 · 실패 · 없음) 끝나는 Promise */
    function loadRecap() {
        var path = recapPath();
        if (path === recap.path) return Promise.resolve(false);
        recap.path = path;
        recap.loaded = false;
        if (recap.lottie) recap.lottie.animation.destroy();
        recap.lottie = null;
        recapIcon.classList.toggle('is-still', !path); /* 스위치를 둘 다 끔 → 정지 아이콘 */
        if (!path) return Promise.resolve(true);
        recap.lottie = loadIconLottie(recapBox, path);
        return track(recap).then(function () {
            if (recap.path === path) recapIcon.classList.toggle('is-still', !recap.loaded); /* 파일 없음 → 정지 아이콘 */
            return true;
        });
    }

    /* 옵션은 여러 속성이 한꺼번에 바뀌므로 한 번만 처리 */
    var pending = false;
    new MutationObserver(function () {
        if (pending) return;
        pending = true;
        Promise.resolve().then(function () {
            pending = false;
            loadRecap().then(function (changed) { if (changed && started) start(); });
        });
    }).observe(root, { attributes: true, attributeFilter: ['data-mode-dissolve', 'data-mode-slide', 'data-dissolve-type', 'data-slide-type'] });

    Promise.all([loadRecap(), track(apptech), window.protoReady || Promise.resolve()]).then(function () {
        started = true;
        window.playRecapIcon = start;
        recapIcon.addEventListener('click', start);
        start();
    });
})();
