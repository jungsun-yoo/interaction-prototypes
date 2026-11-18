/* 스크롤 주체: 모바일(터치)은 문서 전체(window) → 사파리 주소창이 줄어듦, PC는 폰 프레임 안 .scroll-area
   common.css 모바일 미디어쿼리와 같은 조건. type_1.js, index.html(폰 바깥 휠 넘기기)에서 window.pageScroll을 사용 */
var pageScroll = (function () {
    var isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
    var scrollArea = document.querySelector('.scroll-area');
    return {
        isTouch: isTouch,
        target: isTouch ? window : scrollArea,
        get: function () { return isTouch ? window.scrollY : scrollArea.scrollTop; },
        set: function (value) {
            if (isTouch) window.scrollTo(0, value);
            else scrollArea.scrollTop = value;
        },
        /* 다른 곳(폰 바깥·index 바탕)에서 받은 휠 이벤트만큼 스크롤 (deltaMode: 0 px / 1 줄 / 2 페이지) */
        scrollByWheel: function (e) {
            var unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1;
            this.set(this.get() + e.deltaY * unit);
            window.dispatchEvent(new Event('pagescroll:wheel')); /* 탑버튼 스프링 스크롤 중단용 */
        }
    };
})();

/* 스크롤 방향: 맨 위('top') · 내림('down') · 올림('up')을 알려줌 (bottomnavi.js) */
function onScrollDirection(callback) {
    var lastScrollTop = 0;
    pageScroll.target.addEventListener('scroll', function () {
        var scrollTop = pageScroll.get();
        if (scrollTop <= 0) {
            lastScrollTop = 0;
            callback('top', scrollTop);
            return;
        }
        callback(scrollTop - lastScrollTop > 0 ? 'down' : 'up', scrollTop);
        lastScrollTop = scrollTop;
    }, { passive: true });
}

/* 로티 공통: src/lottie/파일.json을 자동재생 · 무한루프 (lottie-web CDN 필요) */
function playLottie(container, file) {
    return lottie.loadAnimation({
        container: container,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: 'src/lottie/' + file + '.json'
    });
}

/* PC: 폰 바깥(바탕·그림자 여백·헤더 등)에서 굴린 세로 휠도 폰 안 스크롤로 넘김. 터치 기기는 문서 스크롤이라 제외 */
(function () {
    var scrollArea = document.querySelector('.scroll-area');
    if (pageScroll.isTouch || !scrollArea) return;
    window.addEventListener('wheel', function (e) {
        if (!e.deltaY || scrollArea.contains(e.target)) return; /* 폰 스크롤 영역 안은 브라우저 기본 스크롤 */
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
    fetch('../index.html', { cache: 'no-cache' })
        .then(function (res) { return res.ok ? res.text() : ''; })
        .then(function (html) {
            var match = html.match(/var CONFIG = \{[\s\S]*?\btitle:\s*'([^']*)'/);
            if (match) apply(match[1]);
        })
        .catch(function () {});
})();

/* 전문관 전환: .phone의 data-store를 바꾸고 'storechange' 이벤트를 보냄 → 각 영역(storeheader · quickmenu 등)이 알아서 바뀜
   처음 전문관은 주소의 ?store=값 → 없으면 HTML의 data-store. index.html 버튼은 window.setStore를 호출
   영역 js는 이 뒤에 불러오고, 불러올 때 지금 data-store로 그려 둠 */
(function () {
  var STORES = ['musinsa', 'beauty', 'sports', 'outlet', 'kids', 'boutique', 'kicks', 'used'];
  var phone = document.querySelector('.phone');

  function setStore(store) {
    if (STORES.indexOf(store) === -1) return;
    phone.dataset.store = store;
    window.dispatchEvent(new Event('storechange'));
  }

  window.setStore = setStore;

  var requested = new URLSearchParams(location.search).get('store');
  if (STORES.indexOf(requested) !== -1 && requested !== phone.dataset.store) setStore(requested);
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
    }

    var fromUrl = {};
    new URLSearchParams(location.search).forEach(function (value, key) {
        if (key.indexOf('opt-') === 0) fromUrl[key.slice(4)] = value;
    });
    apply(fromUrl);

    var inIndex = false;
    try { inIndex = window.parent !== window && !!window.parent.CONFIG; } catch (e) { /* 다른 출처 */ }
    if (!inIndex && window.EventSource) {
        /* scope: 인덱스 폴더 (/1st/prototype/Type_1.html → /1st) */
        var scope = location.pathname.replace(/\/[^\/]*$/, '').replace(/\/prototypes?$/, '') || '/';
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
            var onlyIndex = msg.type === 'change' && (msg.files || []).every(function (f) { return /\/index\.html$/.test(f) && f.split('/').length === 3; });
            if ((msg.type === 'replay' || msg.type === 'change') && !onlyIndex) location.reload();
        };
        live.onerror = function () {
            if (live.readyState === EventSource.CLOSED) live.close();
        };
    }

    return { apply: apply };
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
