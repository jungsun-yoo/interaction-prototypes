/* autoplay.js — FLOW 자동 재생 공통 엔진 (26-1116 취향선택브랜드에서 공통으로 옮김)
   - 화면 코드는 건드리지 않고, 회색 원(터치 표시)이 누를 곳으로 이동 → 멈춤 → 누름(작아졌다 커짐 + 물결) → 실제 탭 신호를 보냄
   - 인덱스 오른쪽 FLOW 카드의 [자동 재생] 버튼이 protoAutoplay.start(끝났을 때 콜백) / stop() 을 부름
   - 시나리오는 프로젝트마다 src/types/type_N_autoplay.js 에서 등록. 등록 전에는 FLOW 버튼이 비활성(흐리게)
       protoAutoplay.scenario(function (play) {
           return play.wait(0.2)
               .then(function () { return play.scrollTo(400); })
               .then(function () { return play.tap('#ctaButton'); })
               .then(function () { return play.wait(1.2); });
       }, { scrollArea: '.scroll-area', bottomBar: '.order-floating' });
   - play 도구 (모두 Promise, 정지하면 중간에 멈춤)
       wait(초) · tap(요소|선택자|함수, 좌표함수?) · longPress(요소…) · scrollTo(px) · scrollIntoView(요소…)
       moveTo({x, y}) · hide() · waitEvent('이벤트이름') · point(요소) · phone · scrollArea · SPEED
   필요: Motion (CDN) */
var protoAutoplay = (function () {
    var EASE = [0.33, 0, 0.2, 1]; // MDS 2.0 power3.easeInOut
    var SPEED = {
        appear: 0.2,  // 원 나타남 · 사라짐 (s)
        move: 0.5,    // 원이 다음 누를 곳으로 이동
        hover: 0.3,   // 누르기 전 멈춤 — 보는 사람이 위치를 알아챔
        press: 0.12,  // 누름
        scroll: 0.9,  // 스크롤
        longPress: 0.7 // 롱프레스 누르고 있는 시간 (보통 판정 0.5초보다 조금 길게)
    };

    var phone = document.querySelector('.phone');
    var scenarioFn = null;
    var settings = {};
    var touch = null;
    var runId = 0;
    var runs = [];

    function scenario(fn, options) {
        scenarioFn = typeof fn === 'function' ? fn : null;
        settings = options || {};
    }
    function ready() { return !!(scenarioFn && phone && window.Motion); }

    function ensureTouch() {
        if (touch) return touch;
        touch = document.createElement('div');
        touch.className = 'autoplay-touch';
        touch.setAttribute('aria-hidden', 'true');
        touch.innerHTML = '<span class="autoplay-ripple"></span>';
        phone.appendChild(touch);
        return touch;
    }
    function track(animation) { runs.push(animation); return animation; }
    function placeTouch(pt) { var t = ensureTouch(); t.style.left = pt.x + 'px'; t.style.top = pt.y + 'px'; }
    function currentPoint() {
        var t = ensureTouch();
        return t.style.left ? { x: parseFloat(t.style.left), y: parseFloat(t.style.top) } : null;
    }
    function resolveEl(target) {
        if (typeof target === 'function') return target();
        if (typeof target === 'string') return document.querySelector(target);
        return target || null;
    }
    function pick(selectorOrEl, fallback) {
        return resolveEl(selectorOrEl) || (fallback ? document.querySelector(fallback) : null);
    }

    /* 한 번의 재생에서 쓰는 도구 (정지하면 id 가 달라져 이어지는 단계가 멈춤) */
    function makePlay(id) {
        var area = pick(settings.scrollArea, '.scroll-area');

        function alive() { if (id !== runId) throw 'stopped'; }
        function wait(seconds) {
            return new Promise(function (resolve, reject) {
                setTimeout(function () { if (id === runId) resolve(); else reject('stopped'); }, seconds * 1000);
            });
        }
        /* 요소 가운데 좌표 (폰 기준) */
        function point(el) {
            var r = el.getBoundingClientRect(), p = phone.getBoundingClientRect();
            return { x: r.left + r.width / 2 - p.left, y: r.top + r.height / 2 - p.top };
        }
        /* 원을 pt로 옮김 (처음이거나 숨어 있으면 그 자리에서 나타남). 위치는 left/top, transform 은 누름 스케일이 씀 */
        function moveTo(pt) {
            var from = currentPoint(), t = ensureTouch();
            if (!from || t.style.opacity !== '1') {
                placeTouch(pt);
                t.style.opacity = '1';
                return track(Motion.animate(t, { opacity: [0, 1], scale: [0.6, 1] }, { duration: SPEED.appear, ease: EASE })).then(alive);
            }
            return track(Motion.animate(t, { left: [from.x + 'px', pt.x + 'px'], top: [from.y + 'px', pt.y + 'px'] }, { duration: SPEED.move, ease: EASE }))
                .then(function () { alive(); placeTouch(pt); });
        }
        function pointerOpts(pt) {
            var p = phone.getBoundingClientRect();
            return { bubbles: true, cancelable: true, clientX: pt.x + p.left, clientY: pt.y + p.top, pointerId: 99, isPrimary: true, button: 0, pointerType: 'touch' };
        }
        /* 이동 → 멈춤 → 누름(작아짐) → 뗌(커지며 물결) 순간에 실제 탭 (실제 앱처럼 손을 뗄 때 반응) */
        function tap(target, pointFn) {
            var el = resolveEl(target);
            if (!el) return Promise.resolve();
            var pt = pointFn ? pointFn(el) : point(el);
            return moveTo(pt)
                .then(function () { return wait(SPEED.hover); })
                .then(function () {
                    track(Motion.animate(ensureTouch(), { scale: [1, 0.82] }, { duration: SPEED.press, ease: EASE }));
                    return wait(SPEED.press);
                })
                .then(function () {
                    var t = ensureTouch(), opts = pointerOpts(pt);
                    track(Motion.animate(t, { scale: [0.82, 1] }, { duration: SPEED.press, ease: EASE }));
                    track(Motion.animate(t.firstChild, { scale: [1, 1.8], opacity: [0.9, 0] }, { duration: 0.4, ease: 'linear' }));
                    el.dispatchEvent(new PointerEvent('pointerdown', opts));
                    el.dispatchEvent(new PointerEvent('pointerup', opts));
                    el.dispatchEvent(new MouseEvent('click', opts));
                    return wait(SPEED.press);
                });
        }
        /* 롱프레스: 눌러서 작아진 채 유지(물결이 천천히 퍼짐) → 뗌. click 은 보내지 않음 */
        function longPress(target) {
            var el = resolveEl(target);
            if (!el) return Promise.resolve();
            var pt = point(el), opts = pointerOpts(pt);
            return moveTo(pt)
                .then(function () { return wait(SPEED.hover); })
                .then(function () {
                    var t = ensureTouch();
                    track(Motion.animate(t, { scale: [1, 0.82] }, { duration: SPEED.press, ease: EASE }));
                    track(Motion.animate(t.firstChild, { scale: [1, 2.2], opacity: [0.9, 0] }, { duration: SPEED.longPress, ease: 'linear' }));
                    el.dispatchEvent(new PointerEvent('pointerdown', opts));
                    return wait(SPEED.longPress);
                })
                .then(function () {
                    el.dispatchEvent(new PointerEvent('pointerup', opts));
                    track(Motion.animate(ensureTouch(), { scale: [0.82, 1] }, { duration: SPEED.press, ease: EASE }));
                    return wait(SPEED.press);
                });
        }
        /* 스크롤: 원이 손가락처럼 반대 방향으로 끌림 + 스크롤 영역이 MDS 이징으로 이동 */
        function scrollTo(target, scrollEl) {
            var box = scrollEl || area;
            if (!box) return Promise.resolve();
            var from = box.scrollTop, max = box.scrollHeight - box.clientHeight;
            target = Math.max(0, Math.min(max, target));
            if (Math.abs(target - from) < 2) return Promise.resolve();
            var p = phone.getBoundingClientRect(), down = target > from;
            var start = { x: p.width / 2, y: down ? p.height * 0.72 : p.height * 0.3 };
            var end = { x: p.width / 2, y: down ? p.height * 0.3 : p.height * 0.72 };
            return moveTo(start).then(function () {
                var t = ensureTouch();
                track(Motion.animate(t, { scale: [1, 0.88] }, { duration: SPEED.press, ease: EASE }));
                track(Motion.animate(t, { left: [start.x + 'px', end.x + 'px'], top: [start.y + 'px', end.y + 'px'] }, { duration: SPEED.scroll, ease: EASE }));
                return track(Motion.animate(from, target, { duration: SPEED.scroll, ease: EASE, onUpdate: function (v) { box.scrollTop = v; } }));
            }).then(function () {
                alive();
                placeTouch(end);
                track(Motion.animate(ensureTouch(), { scale: [0.88, 1] }, { duration: SPEED.press, ease: EASE }));
            });
        }
        /* 요소가 보이도록 스크롤 (이미 보이면 그대로). 하단 고정 버튼(settings.bottomBar) 위까지를 보이는 영역으로 봄 */
        function scrollIntoView(target, scrollEl) {
            var el = resolveEl(target), box = scrollEl || area;
            if (!el || !box) return Promise.resolve();
            var a = box.getBoundingClientRect(), r = el.getBoundingClientRect();
            var bar = settings.bottomBar ? document.querySelector(settings.bottomBar) : null;
            var visibleBottom = bar ? bar.getBoundingClientRect().top : a.bottom;
            if (r.top >= a.top + 8 && r.bottom <= visibleBottom - 8) return Promise.resolve();
            return scrollTo(box.scrollTop + (r.top - a.top) - (visibleBottom - a.top - r.height) / 2, box);
        }
        function hide() {
            if (touch) Motion.animate(touch, { opacity: 0 }, { duration: SPEED.appear });
            return Promise.resolve();
        }
        /* 화면 코드가 보내는 이벤트를 기다림 (예: 로딩이 끝나 다음 페이지로) */
        function waitEvent(name) {
            return new Promise(function (resolve, reject) {
                document.addEventListener(name, function () { if (id === runId) resolve(); else reject('stopped'); }, { once: true });
            });
        }

        return {
            wait: wait, tap: tap, longPress: longPress, scrollTo: scrollTo, scrollIntoView: scrollIntoView,
            moveTo: moveTo, hide: hide, waitEvent: waitEvent, point: point,
            phone: phone, scrollArea: area, SPEED: SPEED, EASE: EASE
        };
    }

    function stop() {
        runId += 1;
        runs.forEach(function (a) { if (a && a.stop) a.stop(); });
        runs = [];
        if (touch) touch.style.opacity = '0';
    }

    function start(onDone) {
        stop();
        if (!ready()) { if (onDone) onDone(); return; }
        var id = runId;
        Promise.resolve()
            .then(function () { return scenarioFn(makePlay(id)); })
            .then(function () { if (id === runId) { if (touch) Motion.animate(touch, { opacity: 0 }, { duration: SPEED.appear }); if (onDone) onDone(); } })
            .catch(function (e) { if (e !== 'stopped') { if (window.console) console.warn('autoplay', e); if (onDone) onDone(); } });
    }

    return { scenario: scenario, ready: ready, start: start, stop: stop, SPEED: SPEED };
})();
