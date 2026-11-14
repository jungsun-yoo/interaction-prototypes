/* type_1_loading.js — 로딩 화면 (type_1.js 다음에 불러옴: MDS_SPRING · brandSelect 사용) */

/* 11. 로딩 화면: 브랜드를 선택하고 넘어갈 때 (Figma 299:151314)
   - 썸네일은 선택한 순서대로 최대 3개 (뒤에 선택한 것이 위로 겹침)
   - 썸네일 등장: 화면이 나타나는 순간부터 0.2s 간격(개수와 상관없이)으로 스케일 0 → 1 + 투명도 0 → 1 (0.2s linear)
     마지막 썸네일만 mds.spring.bouncy, 나머지는 mds.spring.normal
     한 개씩 묶음에 붙음 → 묶음이 늘 화면 가운데. 첫 썸네일은 가운데에서 나오고,
     다음 썸네일이 붙을 때 앞의 것들이 새 자리로 밀려남 (FLIP, mds.spring.normal — 추천 브랜드 밀림과 같은 값)
   - 타이틀 시작: 마지막 썸네일이 나오기 시작하고 0.2s 뒤 (1개 0.2s · 2개 0.4s · 3개 0.6s)
   - 타이틀 "취향이 분명하시네요!"
     글자: 위치(Y) 6 아래 → 제자리 (mds.spring.bouncy) + 투명도 0 → 1 (0.2s linear) 동시에. 마스크 없이 그대로 보이며 올라옴
     글자 간격 0.04s (공백은 간격을 차지하지 않음)
     "!": 마지막 글자 "요"가 시작하고 0.1s 뒤, 제자리에서 스케일 0 → 1 (하단 중앙 기준, mds.spring.elastic)
   - 들어가는 흐름: 브랜드를 1개 이상 선택하고 하단 버튼("N개 선택하고 추천받기")을 누르면 로딩 화면
     (0개면 스낵바 — 8번). 로딩 화면이 나오고 노출 시간 뒤 'loading:done' → 랜딩 페이지로 (12번)
   - 노출 시간: 조건 — 로딩 화면은 최소 3초 노출. 옵션 '로딩 화면 노출 시간' 3~8초 (0.5초 단위, <html data-loading-hold="ms">)
   - 옵션 '로딩 화면 바로보기' (<html data-loading-preview="on">): 켜면 랜딩하자마자 로딩 화면만 보여 줌
     이때 썸네일은 앞에서부터 옵션 '로딩 썸네일 개수'(1~3)만큼. 끄면 로딩 화면을 닫고 첫 화면부터
   - 옵션을 바꾸면 로딩 화면을 처음부터 다시 재생
   - AI 아이콘 로딩: IconAILoading IMG+CSS 원본 (is-playing 동안 1.8s 루프) */
var loadingScreen = (function () {
    var screen = document.getElementById('loadingScreen');
    var stack = document.getElementById('loadingStack');
    if (!screen || !stack) return null;
    var MAX = 3;
    var NORMAL = MDS_SPRING.normal; // mds.spring.normal
    var BOUNCY = MDS_SPRING.bouncy; // mds.spring.bouncy (마지막 썸네일)
    var STAGGER = 0.2;      // 썸네일 간격
    var FADE = 0.2;
    var ELASTIC = MDS_SPRING.elastic; // mds.spring.elastic (마지막 "!")
    var TITLE_GAP = 0.2;      // 마지막 썸네일 시작 → 타이틀 시작
    var CHAR_STAGGER = 0.04;  // 글자 간격
    var BANG_GAP = 0.1;       // "요" 시작 → "!" 시작
    var CHAR_RISE = 6;        // 글자가 올라오는 거리 (px)
    var CHAR_FADE = { duration: 0.2, ease: 'linear' }; // 글자 투명도 0 → 1

    /* 타이틀을 글자 단위 span으로 (공백도 한 칸) */
    var title = screen.querySelector('.loading-title');
    var chars = [];
    if (title) {
        var text = title.textContent;
        title.textContent = '';
        title.setAttribute('aria-label', text);
        Array.from(text).forEach(function (ch) {
            var span = document.createElement('span');
            span.className = 'loading-char';
            span.setAttribute('aria-hidden', 'true');
            span.textContent = ch === ' ' ? '\u00A0' : ch;
            title.appendChild(span);
            chars.push(span);
        });
    }

    var titleRuns = [];

    function stopTitle() {
        titleRuns.forEach(function (a) { if (a && a.stop) a.stop(); });
        titleRuns = [];
    }

    function isSpace(span) { return span.textContent === '\u00A0'; }

    /* 썸네일 count개일 때 마지막 썸네일이 시작하는 시점 (s) */
    function lastThumbAt(count) {
        return Math.max(count - 1, 0) * STAGGER;
    }

    function playTitle(count) {
        if (!window.Motion || !chars.length) return;
        stopTitle();
        /* 글자는 Y 위치(bouncy), "!"만 스케일(elastic) */
        title.classList.add('is-rise');
        var rise = CHAR_RISE;
        var delay = lastThumbAt(count) + TITLE_GAP;
        chars.forEach(function (span, i) {
            var isBang = i === chars.length - 1;
            if (i > 0 && !isSpace(span)) delay += isBang ? BANG_GAP : CHAR_STAGGER; // 공백은 간격 없음, "!"는 따로
            if (isBang) {
                span.style.transform = 'scale(0)';          // 시작 상태를 먼저
                titleRuns.push(Motion.animate(span, { scale: [0, 1] }, Object.assign({ delay: delay }, ELASTIC)));
            } else {
                span.style.transform = 'translateY(' + rise + 'px)';
                span.style.opacity = '0';                   // 시작 상태를 먼저
                titleRuns.push(Motion.animate(span, { y: [rise, 0] }, Object.assign({ delay: delay }, BOUNCY)));
                titleRuns.push(Motion.animate(span, { opacity: [0, 1] }, Object.assign({ delay: delay }, CHAR_FADE)));
            }
        });
    }

    function thumbOf(button) {
        return { name: button.dataset.brand, img: button.querySelector('.brand-thumb img').getAttribute('src') };
    }

    var thumbTimers = [];

    function render(brands) {
        thumbTimers.forEach(clearTimeout);
        thumbTimers = [];
        stack.textContent = '';
        return brands.slice(0, MAX).map(function (b) {
            var item = document.createElement('div');
            item.className = 'loading-thumb';
            var img = document.createElement('img');
            img.src = b.img;
            img.alt = b.name;
            img.width = 64;
            img.height = 64;
            item.appendChild(img);
            item.style.opacity = '0';               // 시작 상태를 먼저 → 첫 프레임 번쩍임 없음
            item.style.transform = 'scale(0)';
            return item;                            // 아직 붙이지 않음 (차례가 되면 붙임)
        });
    }

    /* 차례가 된 썸네일을 묶음 끝에 붙임: 앞의 것들은 원래 자리 → 새 자리로 (FLIP) */
    function addThumb(item, isLast) {
        var before = [].map.call(stack.children, function (el) { return el.getBoundingClientRect().left; });
        stack.appendChild(item);
        if (!window.Motion) { item.style.opacity = ''; item.style.transform = ''; return; }
        [].forEach.call(stack.children, function (el, i) {
            if (el === item) return;
            var dx = before[i] - el.getBoundingClientRect().left;
            if (dx) Motion.animate(el, { x: [dx, 0] }, NORMAL);
        });
        Motion.animate(item, { scale: [0, 1] }, isLast ? BOUNCY : NORMAL);
        Motion.animate(item, { opacity: [0, 1] }, { duration: FADE, ease: 'linear' });
    }

    function playThumbs(items) {
        var stagger = STAGGER;
        items.forEach(function (item, i) {
            var isLast = i === items.length - 1;
            if (i === 0) addThumb(item, isLast);
            else thumbTimers.push(setTimeout(function () { addThumb(item, isLast); }, stagger * i * 1000));
        });
    }

    /* 옵션 '로딩 썸네일 개수' (미리보기용) */
    function previewCount() {
        var n = parseInt(document.documentElement.getAttribute('data-thumb-count'), 10);
        return n >= 1 && n <= MAX ? n : MAX;
    }

    var lastButtons = [];

    /* buttons: 선택한 순서대로의 썸네일 버튼 */
    function show(buttons) {
        lastButtons = buttons;
        var items = render(buttons.map(thumbOf));
        screen.hidden = false;
        playThumbs(items);
        playTitle(items.length);
    }
    function hide() { screen.hidden = true; }

    /* 옵션 '로딩 화면 바로보기' */
    function isPreview() { return document.documentElement.getAttribute('data-loading-preview') === 'on'; }
    function previewButtons() { return [].slice.call(document.querySelectorAll('.brand-button'), 0, previewCount()); }

    function syncPreview() {
        if (isPreview()) show(previewButtons());
        else if (!screen.hidden) hide();
    }
    if (isPreview()) show(previewButtons());

    /* 옵션(바로보기·썸네일 개수)이 바뀌면 로딩 화면을 처음부터 다시 재생 → 바로 비교 */
    new MutationObserver(syncPreview).observe(document.documentElement, { attributes: true, attributeFilter: ['data-loading-preview', 'data-thumb-count'] });

    /* 첫 화면에서 이어지는 흐름: 1개 이상 선택하고 하단 버튼 → 로딩 → 랜딩 페이지 */
    var LOADING_HOLD_MIN = 3000;     // 조건: 로딩 화면은 최소 3초 노출 (ms). 실제로는 3초가 지나고 추천 결과가 오면 넘어감
    var LOADING_HOLD_DEFAULT = 5000; // 옵션 값이 없을 때 (인덱스 옵션 기본값과 같게)
    function loadingHold() {
        var ms = parseInt(document.documentElement.getAttribute('data-loading-hold'), 10);
        return Math.max(LOADING_HOLD_MIN, isFinite(ms) ? ms : LOADING_HOLD_DEFAULT);
    }
    var doneTimer = null;
    var cta = document.getElementById('ctaButton');
    if (cta) cta.addEventListener('click', function () {
        var buttons = brandSelect.selectedButtons();
        if (!buttons.length) return;
        show(buttons);
        clearTimeout(doneTimer);
        doneTimer = setTimeout(function () {
            document.dispatchEvent(new CustomEvent('loading:done'));
        }, loadingHold());
    });

    return { show: show, hide: hide };
})();
