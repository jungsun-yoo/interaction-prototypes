/* type_1_pages.js — 혜택(랜딩) 페이지 · 무신사 홈 (type_1_loading.js 다음에 불러옴: protoPage · loading:done 사용) */

/* 12. 랜딩 페이지: 신규 가입 혜택 (Figma 302:198803) — 로딩이 끝나면 새 페이지로 이동
   - 전환: iOS 내비게이션 push / 뒤로 가기(앱바 화살표) pop — common.js protoPage (iPhone 녹화 실측값)
   - 옵션 '혜택페이지 바로보기' (<html data-landing-preview="on">): 켜면 바로 진입 모션으로 랜딩 페이지, 끄면 즉시 첫 페이지 */
var landingPage = (function () {
    var brandPage = document.getElementById('brandPage');
    var page = document.getElementById('landingPage');
    if (!brandPage || !page || !window.protoPage) return null;
    var isOpen = false;

    /* 혜택 페이지가 다 들어오면 뒤에 있는 첫 페이지를 처음 상태로 ('brandpage:reset')
       → 뒤로 가면 로딩 화면이 아니라 초기화된 브랜드 선택 화면 (선택 · 추천 · 타이틀 · 스크롤 모두 처음) */
    function resetBrandPage() {
        if (window.loadingScreen) loadingScreen.hide();
        var scrollArea = brandPage.querySelector('.scroll-area');
        if (scrollArea) scrollArea.scrollTop = 0;
        document.dispatchEvent(new CustomEvent('brandpage:reset'));
    }

    function push() {
        if (isOpen) return;
        isOpen = true;
        protoPage.push(brandPage, page).then(function () { if (isOpen) resetBrandPage(); });
    }
    function pop() {
        if (!isOpen) return;
        isOpen = false;
        protoPage.pop(brandPage, page);
    }
    function reset() {
        isOpen = false;
        protoPage.reset(brandPage, page);
    }

    document.addEventListener('loading:done', push);
    document.getElementById('landingBack').addEventListener('click', pop);

    /* 옵션 '혜택페이지 바로보기' */
    var PREVIEW_DELAY = 300; // 켜고 나서 진입 모션이 보이도록 잠깐 뒤에 시작 (ms)
    var previewTimer = null;
    function isPreview() { return document.documentElement.getAttribute('data-landing-preview') === 'on'; }
    function syncPreview() {
        clearTimeout(previewTimer);
        reset();
        if (isPreview()) previewTimer = setTimeout(push, PREVIEW_DELAY);
    }
    if (isPreview()) previewTimer = setTimeout(push, PREVIEW_DELAY);
    new MutationObserver(syncPreview).observe(document.documentElement, { attributes: true, attributeFilter: ['data-landing-preview'] });

    return { push: push, pop: pop, reset: reset };
})();

/* 13. 무신사 홈: home/Home.html (26-1105 [앱바] 앱테크진입점모션 2nd의 무신사 홈 — 헤더 · 메인판 탭 · 검색창 · 빅배너 ·
   하이라이트 퀵메뉴 · 퀵메뉴 · 캠페인 섹션 · 바텀네비 + FAB). 전문관 · 광고판 진입은 뺌. 홈 안에서 스크롤
   - 혜택 페이지(웹뷰) 앱바의 홈 버튼 → 홈(네이티브)으로 이동: 전환 모션 없이 바로 바뀜 (점프)
   - 옵션 '홈 화면 바로보기' (<html data-home-preview="on">): 켜면 바로 홈, 끄면 숨김
   - iframe은 처음 보일 때 불러옴 (안 쓰면 로티 · 배너를 불러오지 않음)
   - 홈 랜딩: 기존 화면은 바로 사라지고(빈 화면 #F5F5F5) 홈이 0.35초 페이드 인 (opacity 0 → 1, linear). 네이티브 화면으로 이동이라 푸시 없음
     페이드 인이 끝난 시점 = 홈 랜딩 (처음 불러오는 중이면 다 불러온 뒤 페이드 인 시작)
   - 홈 랜딩(페이드 인 끝) 0.5초 뒤 취향 브랜드 모듈이 화면 가운데로 자동 스크롤 (0.4초 power3.easeInOut, home.js, 헤더는 고정) */
var homePage = (function () {
    var phone = document.querySelector('.phone');
    var page = document.getElementById('homePage');
    var frame = document.getElementById('homeFrame');
    if (!page || !frame) return null;
    var SRC = 'home/Home.html?embed=1&v=20261115-12';
    var HOME_FADE = 0.35; // 홈 랜딩 페이드 인 (s)

    var fadeRun = null;

    /* 홈 iframe이 다 불러와지면 실행 (이미 불러왔으면 바로) */
    function whenReady(fn) {
        var win = frame.contentWindow;
        if (win && win.homeFocus && win.document.readyState === 'complete') fn(win);
        else frame.addEventListener('load', function () { fn(frame.contentWindow); }, { once: true });
    }

    /* 진입: 기존 화면은 바로 가려지고(빈 화면) → 홈 처음 상태(맨 위)로 페이드 인 → 끝나면 랜딩 → 취향 브랜드 모듈로 자동 스크롤 (home.js) */
    function show() {
        var wasHidden = page.hidden;
        if (!frame.getAttribute('src')) frame.setAttribute('src', SRC);
        page.hidden = false;
        phone.classList.add('is-home');
        if (!wasHidden) return;
        if (fadeRun) fadeRun.stop();
        frame.style.opacity = '0'; // 빈 화면부터 (첫 프레임 번쩍임 없음)
        whenReady(function (win) {
            if (win.homeReset) win.homeReset(); // 맨 위 · 헤더 고정 · 바텀 네비 보임
            if (!window.Motion) { frame.style.opacity = ''; if (win.homeFocus) win.homeFocus(); return; }
            fadeRun = Motion.animate(frame, { opacity: [0, 1] }, { duration: HOME_FADE, ease: 'linear' });
            fadeRun.then(function () { if (!page.hidden && win.homeFocus) win.homeFocus(); });
        });
    }
    function hide() {
        if (fadeRun) fadeRun.stop();
        page.hidden = true;
        phone.classList.remove('is-home');
    }

    function isPreview() { return document.documentElement.getAttribute('data-home-preview') === 'on'; }
    function syncPreview() { if (isPreview()) show(); else hide(); }
    syncPreview();
    new MutationObserver(syncPreview).observe(document.documentElement, { attributes: true, attributeFilter: ['data-home-preview'] });

    var landingHome = document.getElementById('landingHome');
    if (landingHome) landingHome.addEventListener('click', show);

    return { show: show, hide: hide };
})();
