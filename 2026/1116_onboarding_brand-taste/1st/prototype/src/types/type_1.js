/* type_1.js — 취향 선택 · 브랜드: 첫 화면(브랜드 선택)
   파일 구성 (Type_1.html에서 이 순서로 불러옴)
   - type_1.js         1~10  브랜드 선택 화면 + 공통 MDS 스프링 값(MDS_SPRING)
   - type_1_loading.js 11    로딩 화면
   - type_1_pages.js   12~13 혜택(랜딩) 페이지 · 무신사 홈
   구성
   1. AI 아이콘 모션
   2. thumbPress   — 썸네일 누름 판정만 (down · release · click · longpress)
   3. 썸네일 누름 스케일 — down 0.9 / release 1
   4. 브랜드 선택 — thumbPress 'click'으로 선택 ↔ 해제 (딤·체크 모션은 CSS)
   5. 롱프레스 툴팁 — thumbPress 'longpress'에 붙어서 사라짐
   6. 추천 브랜드 — 선택하면 비슷한 브랜드 3개가 바로 뒤에 들어옴 (기존 썸네일은 밀리고, 새 썸네일은 스태거로 등장)
   7. 타이틀·하단 버튼 문구 — 선택 수에 따라
   8. 스낵바 — 선택 없이 하단 버튼을 누르면 (MDS 2.5 Snackbar 인터랙션 정의)
   9. 다이얼로그 — '다음에 할게요'를 누르면 (딤 블랙 60%)
   10. 바텀시트 — 썸네일 롱프레스 (spring.gentle, 딤·X로 닫기) */

/* MDS 스프링 (mds-motion.css의 --mds-motion-spring-* 와 같은 값). 모든 모듈이 이 값을 씀 */
var MDS_SPRING = {
    normal: { type: 'spring', stiffness: 815, damping: 54 },
    bouncy: { type: 'spring', stiffness: 322, damping: 26 },
    elastic: { type: 'spring', stiffness: 550, damping: 24 },
    gentle: { type: 'spring', stiffness: 438, damping: 40 }
};

/* 1. AI 아이콘: 랜딩 즉시 등장(마크업의 .is-entrance) → 등장이 끝나면 루프 */
(function () {
    var icon = document.querySelector('.brand-caption .ai-icon');
    if (!icon) return;
    icon.addEventListener('animationend', function (e) {
        if (e.target !== icon || e.animationName !== 'aiEntranceRotate' || !icon.classList.contains('is-entrance')) return;
        icon.classList.replace('is-entrance', 'is-loop');
    });
})();

/* 2. thumbPress: 썸네일(.brand-button) 누름 판정
   이벤트 (콜백 인자: button, e)
   - down      손가락·마우스를 댐
   - release   뗌 또는 취소 (항상 down 다음에 한 번) → 눌림 표시 되돌리기용
   - click     짧게 누르고 뗌 (롱프레스·스크롤·벗어남이 아닐 때만)
   - longpress 0.5초 누름 (그 뒤 떼도 click은 안 옴)
   취소: 10px 넘게 움직임 · 스크롤 시작(pointercancel) · 마우스가 버튼 밖으로 나감
   사용: thumbPress.on('click', function (button) { ... }); */
var thumbPress = (function () {
    var LONG_PRESS = 500;    // 롱프레스 인정 시간 (ms)
    var MOVE_TOLERANCE = 10; // 이만큼 움직이면 누름 취소 (스크롤로 봄)
    var listeners = { down: [], release: [], click: [], longpress: [] };
    var press = null;        // { button, pointerId, x, y, timer, long }

    function emit(type, button, e) {
        listeners[type].forEach(function (fn) { fn(button, e); });
    }

    function end(e, isUp) {
        if (!press || (e && e.pointerId !== press.pointerId)) return;
        var done = press;
        press = null;
        clearTimeout(done.timer);
        emit('release', done.button, e);
        if (isUp && !done.long) emit('click', done.button, e);
    }

    function onDown(e) {
        if (e.button !== undefined && e.button !== 0) return; // 마우스 왼쪽·터치만
        if (press) end(null, false);
        var button = e.currentTarget;
        press = { button: button, pointerId: e.pointerId, x: e.clientX, y: e.clientY, long: false, timer: null };
        press.timer = setTimeout(function () {
            if (!press || press.button !== button) return;
            press.long = true;
            emit('longpress', button, e);
        }, LONG_PRESS);
        emit('down', button, e);
    }

    function onMove(e) {
        if (!press || e.pointerId !== press.pointerId) return;
        if (Math.abs(e.clientX - press.x) > MOVE_TOLERANCE || Math.abs(e.clientY - press.y) > MOVE_TOLERANCE) end(e, false);
    }

    /* 버튼 하나에 누름 판정 붙이기 (처음 있던 썸네일 + 나중에 추천으로 들어온 썸네일) */
    function bind(button) {
        button.addEventListener('pointerdown', onDown);
        button.addEventListener('pointermove', onMove);
        button.addEventListener('pointerup', function (e) { end(e, true); });
        button.addEventListener('pointercancel', function (e) { end(e, false); }); // 터치 스크롤 시작
        button.addEventListener('pointerleave', function (e) { end(e, false); });  // 마우스가 밖으로
        button.addEventListener('contextmenu', function (e) { e.preventDefault(); }); // 롱프레스 기본 메뉴 막기
    }
    [].forEach.call(document.querySelectorAll('.brand-button'), bind);

    return {
        on: function (type, fn) { if (listeners[type]) listeners[type].push(fn); },
        bind: bind
    };
})();

/* 3. 썸네일 누름 스케일: down 0.9 / release 1 (스프링 · mds.spring.normal) */
(function () {
    if (!window.Motion) return;
    var PRESS_SCALE = 0.9;
    var MOTION = MDS_SPRING.normal; // mds.spring.normal

    function scaleThumb(button, to) {
        var thumb = button.querySelector('.brand-thumb');
        if (thumb) Motion.animate(thumb, { scale: to }, MOTION);
    }

    thumbPress.on('down', function (button) { scaleThumb(button, PRESS_SCALE); });
    thumbPress.on('release', function (button) { scaleThumb(button, 1); });
})();

/* 4. 브랜드 선택: 클릭하면 선택 ↔ 다시 클릭하면 해제 (Figma thumb 284:148873)
   선택 모션은 모두 CSS 애니메이션 (.is-selected, type_1.css) — 여기서는 클래스만 붙였다 뗌
     딤 스케일 0 → 1, 0.3s mds.motion.power3.easeOut
     체크 딜레이 없이 0.3s 동안: 그리기 · 스케일 1.5 → 1 · 굵기 4 → 2 (출석체크 ic_daily_check 스타일, 체크 모양은 Figma)
   해제: .is-selected가 빠지면서 딤·체크 모두 바로 사라짐
   'brandpage:reset'(혜택 페이지로 넘어간 뒤)이면 선택을 모두 풀고 처음 상태로 (뒤로 가면 초기화된 브랜드 선택)
   선택이 바뀔 때마다 document에 'brandselect:change' 이벤트
     detail: { selected: 선택한 순서대로 브랜드 이름 배열, button: 방금 누른 버튼, on: 선택이면 true } — 타이틀·버튼·추천 브랜드에서 사용 */
var brandSelect = (function () {
    var order = []; // 선택한 순서 (타이틀의 "OO 외 N개"는 지금 남은 것 중 가장 먼저 고른 브랜드)

    function selected() {
        return order.map(function (b) { return b.dataset.brand; });
    }

    function toggle(button) {
        var on = button.getAttribute('aria-pressed') !== 'true';
        button.setAttribute('aria-pressed', String(on));
        button.classList.toggle('is-selected', on); // 딤·체크 CSS 애니메이션 시작·제거
        order = order.filter(function (b) { return b !== button; });
        if (on) order.push(button);
        document.dispatchEvent(new CustomEvent('brandselect:change', { detail: { selected: selected(), button: button, on: on } }));
    }

    thumbPress.on('click', toggle);

    /* 선택한 순서대로의 썸네일 버튼 */
    function selectedButtons() { return order.slice(); }

    /* 처음 상태로: 선택 모두 해제 → 타이틀 · 버튼 문구도 처음으로 (변경 이벤트, selected 빈 배열) */
    document.addEventListener('brandpage:reset', function () {
        order.forEach(function (b) {
            b.setAttribute('aria-pressed', 'false');
            b.classList.remove('is-selected');
        });
        order = [];
        document.dispatchEvent(new CustomEvent('brandselect:change', { detail: { selected: [], button: null, on: false } }));
    });

    return { selected: selected, selectedButtons: selectedButtons };
})();

/* 5. 롱프레스 툴팁: 랜딩 0.5초 후 등장 → 5초 유지 → 사라짐
   사라지는 조건 (먼저 일어난 것 하나): 5초 경과 · 툴팁 탭 · 상태바 아래 85 영역 진입(스크롤) · 썸네일 롱프레스 · 썸네일 선택 */
(function () {
    var tooltip = document.querySelector('.longpress-tooltip');
    var scrollArea = document.querySelector('.scroll-area');
    var phone = document.querySelector('.phone');
    if (!tooltip || !window.Motion) return;

    var TIMING = {
        enterDelay: 500,   // 랜딩 후 등장까지
        hold: 5000,        // 등장(페이드 완료) 후 유지
        fade: 0.1          // 페이드 인·아웃 (linear)
    };
    var TOP_ZONE = 85;     // 상태바 아래 이 높이 안으로 툴팁이 들어오면 사라짐
    var SCALE_FROM = 0.75;
    var ELASTIC = MDS_SPRING.elastic; // mds.spring.elastic

    var state = 'waiting'; // waiting → visible → gone
    var enterTimer = null;
    var holdTimer = null;
    var running = [];

    function stopRunning() {
        running.forEach(function (a) { if (a && a.stop) a.stop(); });
        running = [];
    }

    /* 스케일(스프링)과 페이드(0.1s linear)를 동시에 */
    function play(scaleTo, opacityTo) {
        stopRunning();
        running = [
            Motion.animate(tooltip, { scale: scaleTo }, ELASTIC),
            Motion.animate(tooltip, { opacity: opacityTo }, { duration: TIMING.fade, ease: 'linear' })
        ];
    }

    /* 툴팁 윗선이 상태바 아래 85 안에 있는지 (상태바 높이는 PC 45 / 모바일 0) */
    function inTopZone() {
        var statusBarH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--status-bar-h')) || 0;
        var top = tooltip.getBoundingClientRect().top - phone.getBoundingClientRect().top;
        return top < statusBarH + TOP_ZONE;
    }

    function show() {
        enterTimer = null;
        if (state !== 'waiting') return;
        if (inTopZone()) { state = 'gone'; return; } // 등장 전에 이미 스크롤로 올라갔으면 안 띄움
        state = 'visible';
        tooltip.classList.add('is-visible');
        play([SCALE_FROM, 1], [0, 1]);
        holdTimer = setTimeout(hide, TIMING.fade * 1000 + TIMING.hold); // 페이드가 끝난 뒤 5초
    }

    function hide() {
        if (state === 'gone') return;
        clearTimeout(enterTimer);
        clearTimeout(holdTimer);
        var wasVisible = state === 'visible';
        state = 'gone';
        tooltip.classList.remove('is-visible');
        if (wasVisible) play(SCALE_FROM, 0);
    }

    /* ② 툴팁 탭 */
    tooltip.addEventListener('click', function (e) {
        e.stopPropagation();
        hide();
    });

    /* ③ 스크롤: 툴팁은 콘텐츠와 같이 움직이고, 상단 85 영역에 들어오면 사라짐 */
    if (scrollArea) {
        scrollArea.addEventListener('scroll', function () {
            if (state === 'visible' && inTopZone()) hide();
        }, { passive: true });
    }

    /* ④ 썸네일 롱프레스 (판정은 thumbPress) */
    thumbPress.on('longpress', hide);

    /* ⑤ 썸네일 선택 (해제할 때는 그대로) */
    document.addEventListener('brandselect:change', function (e) {
        if (e.detail.on) hide();
    });

    /* ① 랜딩 0.5초 후 등장 (5초 후 자동 사라짐은 show 안에서) */
    enterTimer = setTimeout(show, TIMING.enterDelay);
})();

/* 6. 추천 브랜드: 브랜드를 "선택"하면 비슷한 브랜드 3개가 그 바로 뒤에 들어옴 (디자이너 샘플 분석)
   - 추천 데이터: 프로토타입이라 처음 있던 20개(이름+썸네일)에서 무작위 3개를 씀
     누른 브랜드 자신과 3개 안의 겹침만 빼고, 그리드에 이미 있는 브랜드와는 겹쳐도 됨
   - 해제할 때는 안 들어옴. 썸네일 하나당 한 번만 (다시 선택해도 또 안 들어옴)
   - 추천으로 들어온 브랜드도 선택하면 그 아래에 또 추천이 들어옴
   - 해제해도 들어온 추천 브랜드는 그대로 남음
   모션
   - 기존 썸네일: 원래 자리 → 밀려난 새 자리 (mds.spring.normal)
   - 화면 포커싱: 새 썸네일 3개가 보이는 영역(앱바 아래 ~ 하단 버튼 영역 위, 여백 16) 밖이면
     선택 순간 3개 전체가 보이도록 필요한 만큼만 스크롤 (0.4s mds power3.easeInOut, 밀림과 동시). 이미 보이면 그대로
     스크롤 중 사용자가 만지면 멈춤
   - 새 썸네일 3개: 0.2s 뒤부터 0.1s 간격으로 스케일 0 → 1 (1·2번째 mds.spring.normal, 3번째 mds.spring.bouncy) + 투명도 0 → 1 (0.2s linear) */
(function () {
    var grid = document.querySelector('.brand-grid');
    if (!grid || !window.Motion) return;

    /* 추천 후보: 처음 있던 브랜드 (이름 + 썸네일 짝). Figma에 스노우피크 어패럴이 두 번 있어 이름 기준으로 하나만 */
    var POOL = [];
    [].forEach.call(grid.querySelectorAll('.brand-button'), function (b) {
        var name = b.dataset.brand;
        if (POOL.some(function (p) { return p.name === name; })) return;
        POOL.push({ name: name, img: b.querySelector('.brand-thumb img').getAttribute('src') });
    });
    var COUNT = 3;

    /* 누른 브랜드를 뺀 후보에서 서로 다른 3개를 무작위로 */
    function pickRandom(exceptName) {
        var candidates = POOL.filter(function (p) { return p.name !== exceptName; });
        var picked = [];
        while (picked.length < COUNT && candidates.length) {
            picked.push(candidates.splice(Math.floor(Math.random() * candidates.length), 1)[0]);
        }
        return picked;
    }

    var MOVE = MDS_SPRING.normal;          // mds.spring.normal
    var ENTER = [
        MDS_SPRING.normal,                 // 1번째 mds.spring.normal
        MDS_SPRING.normal,                 // 2번째 mds.spring.normal
        MDS_SPRING.bouncy                  // 3번째 mds.spring.bouncy
    ];
    var ENTER_DELAY = 0.2;   // 기존 썸네일이 밀리기 시작하고 나서
    var STAGGER = 0.1;
    var FADE = 0.2;
    var expanded = new WeakSet(); // 이미 추천을 펼친 썸네일 (이름이 겹칠 수 있어 버튼 기준)

    /* 화면 포커싱: 새 썸네일들이 보이는 영역 안에 들어오도록 스크롤 */
    var scrollArea = document.querySelector('#brandPage .scroll-area');
    var bottomBar = document.querySelector('#brandPage .bottom-button');
    var FOCUS_MARGIN = 16;
    var FOCUS_SCROLL = { duration: 0.4, ease: [0.33, 0, 0.2, 1] }; // mds power3.easeInOut
    var focusRun = null;
    function stopFocus() { if (focusRun) { focusRun.stop(); focusRun = null; } }
    if (scrollArea) {
        scrollArea.addEventListener('touchstart', stopFocus, { passive: true });
        scrollArea.addEventListener('wheel', stopFocus, { passive: true });
    }

    function focusItems(items) {
        if (!scrollArea || !items.length) return;
        /* 레이아웃 위치(스크롤 내용 기준). 새 칸은 scale(0)이라 offsetTop으로 잼 */
        var top = Math.min.apply(null, items.map(function (li) { return li.offsetTop; }));
        var bottom = Math.max.apply(null, items.map(function (li) { return li.offsetTop + li.offsetHeight; }));
        var areaRect = scrollArea.getBoundingClientRect();
        var visibleH = (bottomBar ? bottomBar.getBoundingClientRect().top : areaRect.bottom) - areaRect.top;
        var from = scrollArea.scrollTop;
        var target = from;
        if (bottom > from + visibleH - FOCUS_MARGIN) target = bottom - visibleH + FOCUS_MARGIN; /* 아래로 가려짐 → 올림 */
        else if (top < from + FOCUS_MARGIN) target = top - FOCUS_MARGIN;                       /* 위로 가려짐 → 내림 */
        target = Math.max(0, Math.min(scrollArea.scrollHeight - scrollArea.clientHeight, target));
        if (Math.abs(target - from) < 1) return;
        stopFocus();
        focusRun = Motion.animate(from, target, Object.assign({
            onUpdate: function (v) { scrollArea.scrollTop = v; }
        }, FOCUS_SCROLL));
    }

    /* 처음 있던 썸네일 하나를 틀로 써서 새 썸네일을 만듦 (툴팁·선택 상태는 빼고) */
    var template = grid.querySelector('.brand-item').cloneNode(true);
    var tip = template.querySelector('.longpress-tooltip');
    if (tip) tip.remove();

    function makeItem(brand) {
        var li = template.cloneNode(true);
        var button = li.querySelector('.brand-button');
        button.dataset.brand = brand.name;
        button.setAttribute('aria-pressed', 'false');
        button.classList.remove('is-selected');
        li.querySelector('.brand-name').textContent = brand.name;
        li.querySelector('.brand-thumb img').setAttribute('src', brand.img);
        li.style.opacity = '0';
        li.style.transform = 'scale(0)';
        li.dataset.recommended = 'true'; // 추천으로 들어온 칸 (처음 상태로 돌릴 때 지움)
        thumbPress.bind(button);
        return li;
    }

    function expand(button) {
        if (expanded.has(button)) return;
        expanded.add(button);
        var brands = pickRandom(button.dataset.brand);
        if (!brands.length) return;

        /* FLIP: 넣기 전 위치를 기억 → 넣은 뒤 새 위치와의 차이만큼 되돌려 놓고 0으로 */
        var items = [].slice.call(grid.querySelectorAll('.brand-item'));
        var before = items.map(function (li) { return li.getBoundingClientRect(); });

        var anchor = button.closest('.brand-item');
        var added = brands.map(makeItem);
        added.reduce(function (prev, li) { prev.after(li); return li; }, anchor);

        items.forEach(function (li, i) {
            var now = li.getBoundingClientRect();
            var dx = before[i].left - now.left;
            var dy = before[i].top - now.top;
            if (dx || dy) Motion.animate(li, { x: [dx, 0], y: [dy, 0] }, MOVE);
        });

        focusItems(added); // 새 칸 3개가 화면 안에서 등장하도록 (밀림과 동시)

        added.forEach(function (li, i) {
            var delay = ENTER_DELAY + STAGGER * i;
            var spring = ENTER[Math.min(i, ENTER.length - 1)];
            Motion.animate(li, { scale: [0, 1] }, Object.assign({ delay: delay }, spring));
            Motion.animate(li, { opacity: [0, 1] }, { duration: FADE, ease: 'linear', delay: delay });
        });
    }

    document.addEventListener('brandselect:change', function (e) {
        if (e.detail.on) expand(e.detail.button);
    });

    /* 처음 상태로: 추천으로 들어온 칸을 지우고 다시 펼칠 수 있게 */
    document.addEventListener('brandpage:reset', function () {
        [].forEach.call(grid.querySelectorAll('.brand-item[data-recommended]'), function (li) { li.remove(); });
        expanded = new WeakSet();
    });
})();

/* 7. 타이틀·하단 버튼 문구: 선택 수에 따라 (디자이너 샘플 규칙)
   0개   처음 타이틀 / "브랜드를 선택해 주세요"
   1개   "[커버낫]을 선택했습니다."           (을·를은 받침에 따라 자동)
   2~3개 "[커버낫 외 N개] 브랜드를 선택했습니다."  (이름 = 지금 남은 것 중 가장 먼저 선택한 브랜드)
   4개~  "[N개] 브랜드를 선택했습니다."
   1개 이상이면 2줄째 "또 관심 있는 브랜드가 있나요?" / 버튼 "N개 선택하고 추천받기" ([ ]는 파란 강조)
   긴 브랜드명: 1줄째가 한 줄에 들어가도록 브랜드명만 뒤를 "…"로 자름 (디자이너 샘플: "디스커버리 익… 외 1개")
                "외 N개"·문장 끝은 그대로, 조사는 원래 이름 받침 기준 */
(function () {
    var title = document.querySelector('.appbar-title');
    var cta = document.getElementById('ctaButton');
    if (!title || !cta) return;
    var initialTitle = title.innerHTML;
    var initialCta = cta.textContent;

    /* 마지막 글자 받침 있으면 '을', 없으면 '를' (한글이 아니면 '를') */
    function objectJosa(word) {
        var code = word.charCodeAt(word.length - 1) - 0xAC00;
        return code >= 0 && code <= 11171 && code % 28 !== 0 ? '을' : '를';
    }

    /* 1줄째에 쓸 수 있는 폭 (제목 폭 - 오른쪽 여백). 글자 폭은 캔버스로 같은 글꼴로 잼 */
    var ctx = document.createElement('canvas').getContext('2d');
    function textWidth(text) {
        var cs = getComputedStyle(title);
        ctx.font = cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
        return ctx.measureText(text).width;
    }
    function lineWidth() {
        var cs = getComputedStyle(title);
        return title.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    }
    /* name + after 가 한 줄에 들어가도록 name만 뒤에서부터 줄이고 "…" */
    function fitName(name, after) {
        var max = lineWidth() - 1;
        if (textWidth(name + after) <= max) return name;
        var chars = Array.from(name);
        while (chars.length > 1) {
            chars.pop();
            var cut = chars.join('').replace(/\s+$/, '') + '…';
            if (textWidth(cut + after) <= max) return cut;
        }
        return chars.join('') + '…';
    }

    function setTitle(emText, rest) {
        title.textContent = '';
        var em = document.createElement('em');
        em.className = 'appbar-em';
        em.textContent = emText;
        title.appendChild(em);
        title.appendChild(document.createTextNode(rest));
        title.appendChild(document.createElement('br'));
        title.appendChild(document.createTextNode('또 관심 있는 브랜드가 있나요?'));
    }

    document.addEventListener('brandselect:change', function (e) {
        var list = e.detail.selected;
        var n = list.length;
        if (n === 0) {
            title.innerHTML = initialTitle;
            cta.textContent = initialCta;
        } else {
            if (n === 1) {
                var rest1 = objectJosa(list[0]) + ' 선택했습니다.';
                setTitle(fitName(list[0], rest1), rest1);
            } else if (n <= 3) {
                var others = ' 외 ' + (n - 1) + '개';
                var rest2 = ' 브랜드를 선택했습니다.';
                setTitle(fitName(list[0], others + rest2) + others, rest2);
            }
            else setTitle(n + '개', ' 브랜드를 선택했습니다.');
            cta.textContent = n + '개 선택하고 추천받기';
        }
        cta.classList.toggle('is-selected', n > 0);
    });
})();

/* 8. 스낵바: 아무것도 선택하지 않고 하단 버튼을 누르면 등장
   MDS 2.5 토큰 재설계 > Snackbar 컴포넌트 "인터랙션 정의" 그대로
   - 이징은 2개만: Position mds.spring.bouncy (322 / 26) · Opacity linear 0.15s
   - 포지션: 목표 = 지금 자리(하단 102) / 시작 = 목표에서 자기 높이만큼 아래 (px 고정 아님, 높이로 계산). Y축만
   - 등장: 시작 위치 + 투명도 0 → 위치(bouncy)·투명도(0.15s) 동시에
   - 유지: 등장 "완료" 시점부터 3초 후 자동 퇴장
   - 퇴장: 등장의 역행 (위치 → 시작 위치 bouncy, 투명도 1 → 0)
   - 드래그: 아래로만, 손가락 1:1, 자기 높이까지만(러버밴드 없음), 투명도 1 유지
             놓을 때 자기 높이의 50% 이상 → 퇴장 / 미만 → 목표 위치로 복귀(bouncy). 드래그 중에는 자동 퇴장 대기 멈춤
   - 연속 등장: 가이드에 정의 없음 → 떠 있는 동안 다시 누르면 무시 (2026-11-14 결정) */
var snackbar = (function () {
    var bar = document.getElementById('snackbar');
    var cta = document.getElementById('ctaButton');
    if (!bar || !cta || !window.Motion) return null;

    var BOUNCY = MDS_SPRING.bouncy; // mds.spring.bouncy
    var FADE = { duration: 0.15, ease: 'linear' };
    var HOLD = 3000;          // 등장 완료 후 자동 퇴장까지
    var DISMISS_RATIO = 0.5;  // 드래그 퇴장 판정선 (자기 높이의 50%)

    var state = 'hidden';     // hidden → entering → shown → leaving → hidden
    var holdTimer = null;
    var drag = null;          // { pointerId, startY, startOffset }
    var current = 0;          // 지금 y 오프셋 (0 = 목표, height = 시작)

    function height() { return bar.offsetHeight; }

    /* 지금 위치(current)에서 y로. opts 없으면 바로 옮김 (드래그 1:1) */
    function moveTo(y, opts) {
        var from = current;
        current = y;
        return Motion.animate(bar, { y: opts ? [from, y] : y }, opts || { duration: 0 });
    }

    function startHold() {
        clearTimeout(holdTimer);
        holdTimer = setTimeout(hide, HOLD);
    }

    function show() {
        if (state !== 'hidden') return; // 연속 등장: 떠 있는 동안은 무시
        state = 'entering';
        /* 숨김을 풀기 전에 시작 상태(자기 높이만큼 아래 + 투명)를 먼저 잡아 둠 → 첫 프레임에 번쩍이지 않게 */
        bar.style.opacity = '0';
        bar.style.visibility = 'hidden';
        bar.hidden = false;
        current = height();                     // 시작 위치 = 자기 높이만큼 아래
        bar.style.transform = 'translateY(' + current + 'px)';
        bar.style.visibility = '';
        var move = moveTo(0, BOUNCY);           // 위치·투명도 동시에
        Motion.animate(bar, { opacity: [0, 1] }, FADE);
        move.then(function () {
            if (state !== 'entering') return;
            state = 'shown';
            startHold();                        // 등장 완료 시점부터 3초
        });
    }

    function hide() {
        if (state === 'hidden' || state === 'leaving') return;
        clearTimeout(holdTimer);
        state = 'leaving';
        var move = moveTo(height(), BOUNCY);
        Motion.animate(bar, { opacity: [1, 0] }, FADE);
        move.then(function () {
            if (state !== 'leaving') return;
            state = 'hidden';
            bar.hidden = true;
        });
    }

    /* 드래그 (아래로만) */
    bar.addEventListener('pointerdown', function (e) {
        if (state !== 'shown' && state !== 'entering') return;
        clearTimeout(holdTimer);
        drag = { pointerId: e.pointerId, startY: e.clientY, startOffset: current };
        bar.setPointerCapture(e.pointerId);
    });
    bar.addEventListener('pointermove', function (e) {
        if (!drag || e.pointerId !== drag.pointerId) return;
        var y = Math.max(0, Math.min(height(), drag.startOffset + e.clientY - drag.startY)); // 위로는 0에서 클램프, 아래로는 자기 높이까지
        moveTo(y);
    });
    function release(e) {
        if (!drag || e.pointerId !== drag.pointerId) return;
        drag = null;
        if (current >= height() * DISMISS_RATIO) {
            hide();
        } else {
            state = 'shown';
            moveTo(0, BOUNCY);
            startHold();
        }
    }
    bar.addEventListener('pointerup', release);
    bar.addEventListener('pointercancel', release);

    /* 아무것도 선택하지 않고 하단 버튼을 누르면 */
    cta.addEventListener('click', function () {
        if (brandSelect.selected().length === 0) show();
    });

    return { show: show, hide: hide };
})();

/* 9. 다이얼로그: '다음에 할게요'를 누르면 등장 (Figma 295:151182)
   다이얼로그 인터랙션 가이드 (2026-11-14 전달) — 모두 mds.spring.normal (815 / 54)
   - show: 스케일 1.06 → 1 · 투명도 0 → 1
   - hide: 스케일 1 → 1 (그대로) · 투명도 1 → 0
   - 딤(블랙 60%)은 가이드에 없어서 투명도 linear 0.15s
   - 지금은 버튼 연결 없이, 딤·다이얼로그 어디를 눌러도 닫힘 */
var skipDialog = (function () {
    var layer = document.getElementById('skipDialogLayer');
    var trigger = document.querySelector('.skip-button');
    if (!layer || !trigger || !window.Motion) return null;
    var dim = layer.querySelector('.dialog-dim');
    var box = layer.querySelector('.dialog');

    var NORMAL = MDS_SPRING.normal; // mds.spring.normal
    var DIM_FADE = { duration: 0.15, ease: 'linear' };
    var SCALE_FROM = 1.06;
    var open = false;

    function show() {
        if (open) return;
        open = true;
        dim.style.opacity = '0';                 // 숨김을 풀기 전에 시작 상태 → 첫 프레임 번쩍임 없음
        box.style.opacity = '0';
        box.style.transform = 'scale(' + SCALE_FROM + ')';
        layer.hidden = false;
        Motion.animate(dim, { opacity: [0, 1] }, DIM_FADE);
        Motion.animate(box, { scale: [SCALE_FROM, 1], opacity: [0, 1] }, NORMAL);
        box.querySelector('.dialog-button.is-primary').focus({ preventScroll: true });
    }

    function hide() {
        if (!open) return;
        open = false;
        Motion.animate(dim, { opacity: [1, 0] }, DIM_FADE);
        Motion.animate(box, { opacity: [1, 0] }, NORMAL).then(function () { // 스케일은 1 그대로
            if (!open) layer.hidden = true;
        });
        trigger.focus({ preventScroll: true });
    }

    trigger.addEventListener('click', show);
    layer.addEventListener('click', hide); // 딤·다이얼로그·버튼 어디를 눌러도 닫힘

    return { show: show, hide: hide };
})();

/* 10. 바텀시트: 어떤 썸네일이든 롱프레스하면 등장 (Figma 290:150996, 내용은 어나더오피스 하나)
   - 등장·퇴장 모두 mds.spring.gentle (438 / 40) — 시스템 가이드. 시트는 자기 높이만큼 아래 ↔ 제자리
   - 딤(블랙 60%)은 투명도 linear 0.15s
   - 딤 또는 닫기(X)를 누르면 퇴장
   - 열릴 때마다 제목 AI 아이콘 등장 → 루프 다시 재생 (IconAI 가이드: 활성화 시점에 등장) */
var brandSheet = (function () {
    var layer = document.getElementById('brandSheetLayer');
    if (!layer || !window.Motion) return null;
    var dim = layer.querySelector('.sheet-dim');
    var sheet = layer.querySelector('.sheet');
    var icon = layer.querySelector('.ai-icon');

    var GENTLE = MDS_SPRING.gentle; // mds.spring.gentle
    var DIM_FADE = { duration: 0.15, ease: 'linear' };
    var open = false;

    function playIcon() {
        if (!icon) return;
        icon.classList.remove('is-entrance', 'is-loop');
        void icon.offsetWidth; // 클래스를 다시 붙여도 처음부터 재생되게
        icon.classList.add('is-entrance');
    }
    if (icon) {
        icon.addEventListener('animationend', function (e) {
            if (e.target !== icon || e.animationName !== 'aiEntranceRotate' || !icon.classList.contains('is-entrance')) return;
            icon.classList.replace('is-entrance', 'is-loop');
        });
    }

    function show() {
        if (open) return;
        open = true;
        dim.style.opacity = '0';                  // 숨김을 풀기 전에 시작 상태 → 첫 프레임 번쩍임 없음
        sheet.style.transform = 'translateY(100%)';
        layer.hidden = false;
        var h = sheet.offsetHeight;
        Motion.animate(dim, { opacity: [0, 1] }, DIM_FADE);
        Motion.animate(sheet, { y: [h, 0] }, GENTLE);
        playIcon();
    }

    function hide() {
        if (!open) return;
        open = false;
        Motion.animate(dim, { opacity: [1, 0] }, DIM_FADE);
        Motion.animate(sheet, { y: [0, sheet.offsetHeight] }, GENTLE).then(function () {
            if (open) return;
            layer.hidden = true;
            if (icon) icon.classList.remove('is-entrance', 'is-loop');
        });
    }

    thumbPress.on('longpress', show);
    dim.addEventListener('click', hide);
    layer.querySelector('.sheet-close').addEventListener('click', hide);

    return { show: show, hide: hide };
})();
