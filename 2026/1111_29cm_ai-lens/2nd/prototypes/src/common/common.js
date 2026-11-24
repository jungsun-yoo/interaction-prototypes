/* 스크롤 주체: 모바일(터치)은 폰 안 .scroll-area, PC도 폰 프레임 안 .scroll-area
   index.html(폰 바깥 휠 넘기기)에서 window.pageScroll을 사용 */
var pageScroll = (function () {
    var isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
    var scrollArea = document.querySelector('.scroll-area');
    return {
        isTouch: isTouch,
        target: scrollArea,
        get: function () { return scrollArea ? scrollArea.scrollTop : 0; },
        set: function (value) { if (scrollArea) scrollArea.scrollTop = value; },
        /* 다른 곳(폰 바깥·index 바탕)에서 받은 휠 이벤트만큼 스크롤 (deltaMode: 0 px / 1 줄 / 2 페이지) */
        scrollByWheel: function (e) {
            var unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1;
            this.set(this.get() + e.deltaY * unit);
            window.dispatchEvent(new Event('pagescroll:wheel'));
        }
    };
})();

/* PC: 폰 바깥(바탕·그림자 여백)에서 굴린 세로 휠도 폰 안 스크롤로 넘김 */
(function () {
    var scrollArea = document.querySelector('.scroll-area');
    if (pageScroll.isTouch || !scrollArea) return;
    window.addEventListener('wheel', function (e) {
        if (!e.deltaY || scrollArea.contains(e.target)) return;
        e.preventDefault();
        pageScroll.scrollByWheel(e);
    }, { passive: false });
})();

/* 페이지 제목: 인덱스(../index.html) CONFIG.title을 그대로 씀 → 브라우저 탭·홈 화면에 추가 기본 이름
   인덱스 안 iframe이면 부모 CONFIG를 바로 읽고, 혼자 열리면(모바일·깃헙 페이지) index.html을 읽어 title 값만 꺼냄
   실패하면 Type_N.html의 <title> 그대로 */
(function () {
    function apply(title) {
        if (!title) return;
        document.title = title;
        var meta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
        if (meta) meta.setAttribute('content', title);
    }
    try {
        if (window.parent !== window && window.parent.CONFIG) { apply(window.parent.CONFIG.title); return; }
    } catch (e) { /* 다른 출처면 부모를 못 읽음 → 아래에서 파일로 읽기 */ }
    if (!window.fetch) return;
    /* 인덱스 위치: 기본 ../index.html, 폴더가 한 단계 더 깊으면 <html data-index-path="../../index.html">, 빈 값이면 읽지 않음(전달용 zip) */
    var indexPath = document.documentElement.getAttribute('data-index-path');
    if (indexPath === null) indexPath = '../index.html';
    if (!indexPath) return;
    fetch(indexPath, { cache: 'no-cache' })
        .then(function (res) { return res.ok ? res.text() : ''; })
        .then(function (html) {
            var match = html.match(/var CONFIG = \{[\s\S]*?\btitle:\s*'([^']*)'/);
            if (match) apply(match[1]);
        })
        .catch(function () {});
})();

/* 페이지 로딩: 화면에 쓰는 이미지·폰트(+ data-preload 파일)를 미리 받은 뒤 시작 (모양은 common.css '페이지 로딩')
   - 0.3초 안에 준비되면 로딩 표시 없이 바로 시작 (새로고침·다시 재생은 브라우저가 기억해 둔 파일이라 보통 이 경우)
   - 0.3초를 넘기면 로고 로딩 표시 → 준비되면 0.1s linear 페이드로 사라짐 (상태바도 이때 함께 나타남)
   - 못 받은 파일이 있어도 끝난 것으로 셈 · 최대 5초 뒤에는 무조건 시작 · 못 받은 파일은 콘솔에 남김
   - 사용: 진입 모션은 protoReady.then(function () { …시작… }) 안에서 시작 (그래야 첫 부분이 가림막 뒤에서 지나가지 않음)
     모션으로 나타날 요소는 CSS에서 처음부터 숨긴 상태(opacity 0 등)로 둘 것 — 페이드 0.1s 동안 기본 모습이 비치지 않게
     신호는 화면이 다 보인 뒤에 옴: 로딩을 보여 줬으면 페이드(0.1s)가 끝난 뒤, 아니면 바로 → '랜딩 0.5초 후' = 화면이 보이고 0.5초 후
   - 끄기: <html data-loading="off"> / 더 기다릴 파일: <html data-preload="src/lottie/a.json, src/img/b.png">
   - 시험 모드: 주소 뒤 ?loading=slow (2초) 또는 ?loading=3 (초) → 일부러 그만큼 늦게 준비시켜 로딩·페이드를 확인
     인덱스 주소에 붙여도 됨 (예: /1st/?loading=slow#type1 → 안의 프로토타입에 적용). 다시 재생(R)해도 유지 */
var protoReady = (function () {
    var root = document.documentElement;
    var SLOW_MS = 300;
    var MAX_MS = 5000;
    var FADE_MS = 100; /* common.css 페이지 로딩 페이드(0.1s linear)와 같게 */
    var missing = [];
    var slowTimer = null;
    var resolveReady;
    var ready = new Promise(function (resolve) { resolveReady = resolve; });

    function finish() {
        if (root.classList.contains('proto-ready')) return;
        clearTimeout(slowTimer);
        root.classList.add('proto-ready'); /* 가림막 치움 (로딩을 보여 줬으면 여기서 페이드 시작) */
        if (missing.length) console.warn('[protoReady] 불러오지 못한 파일:', missing);
        /* 준비 끝 신호는 화면이 다 보인 뒤: 페이드가 있으면 끝난 다음, 없으면 같은 순간에 바로
           (바로 보낼 때는 가림막이 걷힌 화면이 그려지기 전에 모션 시작 코드가 먼저 돎) */
        function signal() {
            root.classList.add('proto-play'); /* CSS 진입 애니메이션 시작 표시 (common.css '페이지 로딩' 참고) */
            window.dispatchEvent(new Event('proto:ready'));
            resolveReady();
        }
        if (root.classList.contains('proto-slow')) setTimeout(signal, FADE_MS);
        else signal();
    }

    if (root.getAttribute('data-loading') === 'off') { finish(); return ready; }

    /* 시험 모드: ?loading=slow | 초 — 이 화면 주소 또는 감싸고 있는 인덱스 주소에서 읽음 */
    function testDelayMs() {
        var value = new URLSearchParams(location.search).get('loading');
        try {
            if (!value && window.parent !== window) value = new URLSearchParams(window.parent.location.search).get('loading');
        } catch (e) { /* 다른 출처면 인덱스 주소를 못 읽음 */ }
        if (!value) return 0;
        var seconds = value === 'slow' ? 2 : parseFloat(value);
        return isFinite(seconds) && seconds > 0 ? Math.min(seconds, 30) * 1000 : 0;
    }
    var testMs = testDelayMs();
    if (testMs) console.info('[protoReady] 시험 모드: ' + testMs / 1000 + '초 늦게 준비');

    /* 한 파일 기다리기: 받음·실패 모두 "끝" */
    function waitFile(url) {
        return new Promise(function (resolve) {
            if (/\.(png|jpe?g|gif|webp|avif|svg)(\?|$)/i.test(url)) {
                var img = new Image();
                img.onload = resolve;
                img.onerror = function () { missing.push(url); resolve(); };
                img.src = url;
            } else {
                fetch(url).then(function (res) { if (!res.ok) missing.push(url); })
                    .catch(function () { missing.push(url); }).then(resolve);
            }
        });
    }
    /* 화면의 <img>: 이미 끝났으면 바로, 아니면 load·error 를 기다림 */
    function waitImage(img) {
        if (img.complete) {
            if (img.currentSrc && !img.naturalWidth) missing.push(img.currentSrc);
            return Promise.resolve();
        }
        return new Promise(function (resolve) {
            img.addEventListener('load', resolve, { once: true });
            img.addEventListener('error', function () { missing.push(img.currentSrc || img.src); resolve(); }, { once: true });
        });
    }

    var extra = (root.getAttribute('data-preload') || '').split(',')
        .map(function (s) { return s.trim(); }).filter(Boolean);
    var tasks = [].map.call(document.images, waitImage).concat(extra.map(waitFile));
    if (document.fonts && document.fonts.ready) tasks.push(document.fonts.ready);
    if (testMs) tasks.push(new Promise(function (resolve) { setTimeout(resolve, testMs); }));

    /* 기준 시간은 페이지를 열기 시작한 때부터 (앞의 CDN 스크립트를 받는 시간도 포함) */
    var elapsed = window.performance ? performance.now() : 0;
    slowTimer = setTimeout(function () { root.classList.add('proto-slow'); }, Math.max(0, SLOW_MS - elapsed));
    setTimeout(finish, Math.max(0, Math.max(MAX_MS, testMs + 500) - elapsed)); /* 시험 모드가 5초보다 길면 그만큼 기다림 */
    Promise.all(tasks).then(finish, finish);

    return ready;
})();

/* 뒤에서 받기: 첫 화면이 보인 뒤(protoReady) 다음 페이지 이미지 등을 조용히 받아 둠 → 첫 화면은 빨리, 이동할 땐 이미 받아진 상태
   적는 법 (둘 다 선택)
   - <img data-src="src/img/detail.png" …> : src 대신 data-src 로 적은 이미지는 처음엔 받지 않고(첫 화면 로딩이 기다리지 않음) 준비 끝 뒤에 받음
       숨겨 둔 다음 페이지(.proto-page[hidden])의 이미지에 씀. 크기는 CSS로 고정해 둘 것 (빈 자리 커짐 방지)
   - <html data-prefetch="src/img/a.png, src/lottie/b.json"> : <img> 가 아닌 파일(로티 json · CSS 배경 · JS가 나중에 넣는 이미지)
   이동하기 전에 확실히 받아 두고 싶으면
     protoPrefetch.wait(다음페이지요소).then(function () { protoPage.push(뒤, 앞); });
     → 그 요소 안 이미지가 다 받아지면(실패 포함, 최대 5초) 진행. 이미 받아졌으면 바로 */
var protoPrefetch = (function () {
    var root = document.documentElement;
    var WAIT_MAX_MS = 5000;
    var started = false;
    var files = {}; /* 주소 → Promise (data-prefetch 파일) */

    function loadFile(url) {
        if (files[url]) return files[url];
        files[url] = new Promise(function (resolve) {
            if (/\.(png|jpe?g|gif|webp|avif|svg)(\?|$)/i.test(url)) {
                var img = new Image();
                img.fetchPriority = 'low';
                img.onload = img.onerror = resolve;
                img.src = url;
            } else {
                fetch(url, { priority: 'low' }).then(resolve, resolve);
            }
        });
        return files[url];
    }

    /* data-src 이미지에 src 를 넣어 받기 시작 */
    function startImage(img) {
        if (!img.dataset.src || img.getAttribute('src')) return;
        img.fetchPriority = 'low';
        img.src = img.dataset.src;
    }

    function start() {
        if (started) return;
        started = true;
        [].forEach.call(document.querySelectorAll('img[data-src]'), startImage);
        (root.getAttribute('data-prefetch') || '').split(',')
            .map(function (s) { return s.trim(); }).filter(Boolean).forEach(loadFile);
    }

    function waitImage(img) {
        startImage(img); /* 아직 시작 전이면 지금 받기 시작 */
        if (img.complete && img.getAttribute('src')) return Promise.resolve();
        return new Promise(function (resolve) {
            img.addEventListener('load', resolve, { once: true });
            img.addEventListener('error', resolve, { once: true });
        });
    }

    /* 요소(페이지) 안 이미지 또는 주소 목록이 다 받아질 때까지 (최대 5초) */
    function wait(target) {
        var tasks;
        if (typeof target === 'string' || Array.isArray(target)) {
            tasks = [].concat(target).map(loadFile);
        } else {
            var el = target || document;
            var imgs = el.tagName === 'IMG' ? [el] : [].slice.call(el.querySelectorAll('img'));
            tasks = imgs.filter(function (img) { return img.dataset.src || img.getAttribute('src'); }).map(waitImage);
        }
        return Promise.race([
            Promise.all(tasks),
            new Promise(function (resolve) { setTimeout(resolve, WAIT_MAX_MS); })
        ]);
    }

    /* 화면이 보인 뒤 + 페이지 스크립트가 다 돈 뒤(DOMContentLoaded)에 시작
       로딩을 끄면(data-loading="off", 개발 전달 zip) protoReady 가 바로 끝나 common.js 뒤 스크립트가 만드는 data-src 이미지를 놓칠 수 있음 */
    var parsed = document.readyState === 'loading'
        ? new Promise(function (resolve) { document.addEventListener('DOMContentLoaded', resolve, { once: true }); })
        : Promise.resolve();
    Promise.all([window.protoReady || Promise.resolve(), parsed]).then(start);
    return { wait: wait, start: start };
})();

/* 프로토타입 옵션: 인덱스 오른쪽 옵션 컨트롤 값 → <html data-옵션이름="값"> (CSS가 :root[data-옵션="값"] 으로 받음)
   값이 들어오는 길
   ① 주소 ?opt-옵션=값 — QR·새 창으로 열 때
   ② 인덱스 안 iframe이면 인덱스가 protoOptions.apply()를 바로 부름
   ③ 혼자 열린 화면(모바일)은 서버 /api/options/stream 으로 실시간 (proto_server.py, 없으면 조용히 건너뜀)
   ④ 혼자 열린 화면은 /api/live/stream 도 받아, 파일 저장 때 새로 불러옴 (인덱스 ▶ 동기화가 켜져 있을 때만) */
var protoOptions = (function () {
    var root = document.documentElement;
    var KEY_RE = /^[a-z][a-z0-9-]{0,30}$/;
    var VALUE_RE = /^[A-Za-z0-9_.-]{1,40}$/; /* 슬라이더 소수 값(0.15) 때문에 . 허용 */
    var NUMBER_RE = /^-?\d+(\.\d+)?$/;

    /* 숫자 값(슬라이더 · 숫자 선택)은 CSS 변수 --opt-옵션 으로도 넣음 (단위 없음 → calc(var(--opt-speed) * 1ms)) */
    function apply(options) {
        Object.keys(options || {}).forEach(function (key) {
            var value = options[key];
            if (!(KEY_RE.test(key) && typeof value === 'string' && VALUE_RE.test(value))) return;
            root.setAttribute('data-' + key, value);
            if (NUMBER_RE.test(value)) root.style.setProperty('--opt-' + key, value);
        });
        /* 값이 바뀐 걸 JS 로 알아야 하는 프로토타입용 (타이머 등): window 'proto-options' 이벤트 */
        try { window.dispatchEvent(new CustomEvent('proto-options', { detail: { options: options || {} } })); } catch (e) { /* 아주 옛 브라우저 */ }
    }
    /* 인덱스 옵션 카드 버튼 → window 'proto-action' 이벤트 (e.detail.id). 인덱스가 바로 부르거나, 폰은 서버 라이브 신호로 */
    function action(id) {
        if (typeof id !== 'string' || !KEY_RE.test(id)) return;
        try { window.dispatchEvent(new CustomEvent('proto-action', { detail: { id: id } })); } catch (e) { /* 아주 옛 브라우저 */ }
    }
    /* 프로토타입 상태 → 인덱스 옵션 카드 상태 표시 { id, status }: protoOptions.report({ state: '로딩 완료' }). 인덱스 밖(폰)에서는 아무 일 없음 */
    function report(values) {
        if (window.parent === window || !values || typeof values !== 'object') return;
        try { window.parent.postMessage({ type: 'proto-status', values: values }, location.origin); } catch (e) { /* 다른 출처 */ }
    }
    /* 지금 옵션 값 (<html data-id>) */
    function get(id) { return root.getAttribute('data-' + id); }

    var fromUrl = {};
    new URLSearchParams(location.search).forEach(function (value, key) {
        if (key.indexOf('opt-') === 0) fromUrl[key.slice(4)] = value;
    });
    apply(fromUrl);

    var inIndex = false;
    try { inIndex = window.parent !== window && !!window.parent.CONFIG; } catch (e) { /* 다른 출처 */ }
    if (!inIndex && window.EventSource) {
        /* scope: 인덱스 폴더 (/1st/prototype/Type_1.html → /1st) */
        /* prototype(s)/ 아래 한 단계 더 깊은 화면(/1st/prototype/aiPhotoAnalysis/index.html)도 → /1st */
        var scope = (/\/prototypes?\//.test(location.pathname)
            ? location.pathname.replace(/\/prototypes?\/.*$/, '')
            : location.pathname.replace(/\/[^\/]*$/, '')) || '/';
        var stream = new EventSource('/api/options/stream?scope=' + encodeURIComponent(scope));
        stream.onmessage = function (e) {
            try { apply(JSON.parse(e.data)); } catch (err) { /* 잘못된 값은 무시 */ }
        };
        stream.onerror = function () {
            if (stream.readyState === EventSource.CLOSED) stream.close(); /* 정적 서버(깃헙 페이지 등)면 연결 포기 */
        };

        /* 라이브: 파일 저장 또는 인덱스 ▶ 동기화를 다시 켤 때 → 이 화면(폰)을 새로 불러옴
           인덱스에서 동기화를 끄면 서버가 아무 신호도 보내지 않음 (옵션 스트림도 같음)
           인덱스 파일(index.html)만 바뀐 경우는 폰 화면과 상관없어 건너뜀 */
        var live = new EventSource('/api/live/stream?role=phone&scope=' + encodeURIComponent(scope));
        live.onmessage = function (e) {
            var msg;
            try { msg = JSON.parse(e.data); } catch (err) { return; }
            if (msg.type === 'action') { action(msg.id); return; } /* 인덱스 옵션 카드 버튼 */
            var onlyIndex = msg.type === 'change' && (msg.files || []).every(function (f) { return /\/index\.html$/.test(f) && f.split('/').length === 3; });
            if ((msg.type === 'replay' || msg.type === 'change') && !onlyIndex) location.reload();
        };
        live.onerror = function () {
            if (live.readyState === EventSource.CLOSED) live.close();
        };
    }

    return { apply: apply, action: action, report: report, get: get };
})();

/* 페이지 전환: iOS 내비게이션 push(새 페이지로) / pop(뒤로) — iPhone 화면 녹화 실측 (2026-11-14)
   - 스프링 stiffness 650 · damping 56 (mass 1, 감쇠비 ≈ 1.1 → 튕김 없음, 95% 0.22s · 99% 0.32s). push·pop 같은 값
   - 새(앞) 페이지: 오른쪽 바깥(너비 100%) ↔ 제자리
   - 뒤 페이지: 너비의 30%만큼 왼쪽으로 + 검정 10% 덮개 (앞 페이지 움직임에 비례). 상태바(네이티브)는 움직이지 않음
   - 페이지 요소: 폰 안에서 class="proto-page" (position absolute · inset 0). 앞 페이지를 뒤 페이지보다 위 층(z-index)에 둠
   - 사용: protoPage.push(뒤, 앞)  /  protoPage.pop(뒤, 앞) → 끝나면 앞 페이지 hidden  /  protoPage.reset(뒤, 앞) 모션 없이 처음으로
   - Motion(motion@14) 필요. 없으면 모션 없이 상태만 바뀜 */
var protoPage = (function () {
    var SPRING = { type: 'spring', stiffness: 650, damping: 56 };
    var BACK_SHIFT = 0.3;
    var BACK_DIM = 0.1;
    var runs = [];

    function stop() {
        runs.forEach(function (a) { if (a && a.stop) a.stop(); });
        runs = [];
    }
    function dimOf(back) {
        var dim = back.querySelector(':scope > .proto-page-dim');
        if (!dim) {
            dim = document.createElement('div');
            dim.className = 'proto-page-dim';
            dim.setAttribute('aria-hidden', 'true');
            back.appendChild(dim);
        }
        return dim;
    }
    function animate(el, keyframes) {
        var run = window.Motion.animate(el, keyframes, SPRING);
        runs.push(run);
        return run;
    }

    function push(back, front) {
        stop();
        var w = back.getBoundingClientRect().width;
        var dim = dimOf(back);
        front.style.transform = 'translateX(' + w + 'px)'; // 시작 상태를 먼저 (첫 프레임 번쩍임 없음)
        front.hidden = false;
        if (!window.Motion) {
            front.style.transform = '';
            back.style.transform = 'translateX(' + (-w * BACK_SHIFT) + 'px)';
            dim.style.opacity = String(BACK_DIM);
            return Promise.resolve();
        }
        animate(back, { x: [0, -w * BACK_SHIFT] });
        animate(dim, { opacity: [0, BACK_DIM] });
        return animate(front, { x: [w, 0] });
    }

    function pop(back, front) {
        stop();
        var w = back.getBoundingClientRect().width;
        var dim = dimOf(back);
        if (!window.Motion) { reset(back, front); return Promise.resolve(); }
        animate(back, { x: [-w * BACK_SHIFT, 0] });
        animate(dim, { opacity: [BACK_DIM, 0] });
        var out = animate(front, { x: [0, w] });
        return out.then(function () { front.hidden = true; });
    }

    function reset(back, front) {
        stop();
        back.style.transform = '';
        dimOf(back).style.opacity = '0';
        front.style.transform = '';
        front.hidden = true;
    }

    return { push: push, pop: pop, reset: reset, SPRING: SPRING };
})();
