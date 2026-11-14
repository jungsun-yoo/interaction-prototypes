/* autoplay.js — 자동 재생 (오토플레이). 기존 화면 코드는 건드리지 않고, 실제 누름 신호만 보냄
   - 인덱스 옵션 카드의 '자동 재생' 버튼 → window.protoAutoplay.start(끝났을 때 콜백) / stop()
   - 화면 위 회색 원(터치 표시)이 누를 곳으로 먼저 이동 → 잠깐 멈춤 → 누름(작아졌다 커짐 + 물결) → 실제 탭
   - 시나리오는 아래 STEPS 목록. 한 번 돌고 홈 랜딩에서 끝
     1. 스크롤 → '다음에 할게요' → 다이얼로그 → 닫기
     2. 하단 버튼(선택 0개) → 스낵바
     3. 위로 스크롤 → 썸네일 롱프레스 → 바텀시트 → 딤을 눌러 닫기 → 브랜드 3개 차례로 선택
     4. 하단 버튼 → 로딩 → 혜택 페이지
     5. 혜택 페이지 홈 아이콘 → 홈 랜딩 (페이드 인 · 자동 스크롤까지 보고 끝)
   필요: Motion (CDN), type_1*.js가 만든 화면 */
var protoAutoplay = (function () {
    var EASE = [0.33, 0, 0.2, 1]; // MDS 2.0 power3.easeInOut
    var SPEED = {
        appear: 0.2,      // 원 나타남 · 사라짐 (s)
        move: 0.5,        // 원이 다음 누를 곳으로 이동 (s)
        hover: 0.3,       // 누르기 전 멈춤 (s) — 보는 사람이 위치를 알아챔
        press: 0.12,      // 누름 (s)
        scroll: 0.9,      // 스크롤 (s)
        dialogView: 1.2,  // 다이얼로그 보여 주기 (s)
        afterClose: 0.8,  // 닫힌 뒤 (s)
        snackbarView: 1.6,
        longPress: 0.7,     // 롱프레스 누르고 있는 시간 (판정 0.5초보다 조금 길게)
        sheetView: 1.8,     // 바텀시트 보여 주기
        betweenBrands: 1.0, // 브랜드 선택 사이 (추천 브랜드 등장을 보여 줌)
        landingView: 1.4,   // 혜택 페이지가 다 들어온 뒤
        homeView: 2.0       // 홈 랜딩 뒤 (페이드 인 + 자동 스크롤을 보고 끝)
    };

    var phone = document.querySelector('.phone');
    var scrollArea = document.querySelector('#brandPage .scroll-area');
    var touch = null;
    var runId = 0;
    var runs = [];

    /* ── 기본 동작 ── */
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
    function wait(seconds, id) {
        return new Promise(function (resolve, reject) {
            setTimeout(function () { if (id === runId) resolve(); else reject('stopped'); }, seconds * 1000);
        });
    }
    function alive(id) { if (id !== runId) throw 'stopped'; }

    /* 요소 가운데 좌표 (폰 기준) */
    function pointOf(el) {
        var r = el.getBoundingClientRect(), p = phone.getBoundingClientRect();
        return { x: r.left + r.width / 2 - p.left, y: r.top + r.height / 2 - p.top };
    }
    /* 위치는 left/top (transform은 Motion의 누름 스케일이 씀) */
    function placeTouch(pt) { var t = ensureTouch(); t.style.left = pt.x + 'px'; t.style.top = pt.y + 'px'; }
    function currentPoint() {
        var t = ensureTouch();
        return t.style.left ? { x: parseFloat(t.style.left), y: parseFloat(t.style.top) } : null;
    }

    /* 원을 pt로 옮김 (처음이면 그 자리에서 나타남) */
    function moveTo(pt, id) {
        var from = currentPoint();
        var t = ensureTouch();
        if (!from || t.style.opacity !== '1') {
            placeTouch(pt);
            t.style.opacity = '1';
            return track(Motion.animate(t, { opacity: [0, 1], scale: [0.6, 1] }, { duration: SPEED.appear, ease: EASE })).then(function () { alive(id); });
        }
        return track(Motion.animate(t, { left: [from.x + 'px', pt.x + 'px'], top: [from.y + 'px', pt.y + 'px'] }, { duration: SPEED.move, ease: EASE })).then(function () {
            alive(id);
            placeTouch(pt);
        });
    }

    /* 실제 탭: pointerdown → pointerup → click (thumbPress 판정과 같은 순서) */
    function dispatchTap(el, pt) {
        var p = phone.getBoundingClientRect();
        var opts = { bubbles: true, cancelable: true, clientX: pt.x + p.left, clientY: pt.y + p.top, pointerId: 99, isPrimary: true, button: 0, pointerType: 'touch' };
        el.dispatchEvent(new PointerEvent('pointerdown', opts));
        el.dispatchEvent(new PointerEvent('pointerup', opts));
        el.dispatchEvent(new MouseEvent('click', opts));
    }

    /* 누를 곳으로 이동 → 멈춤 → 누름 표시 + 실제 탭 */
    function tap(getEl, id, pointFn) {
        var el = getEl();
        if (!el) return Promise.resolve();
        var pt = pointFn ? pointFn(el) : pointOf(el);
        return moveTo(pt, id)
            .then(function () { return wait(SPEED.hover, id); })
            .then(function () {
                var t = ensureTouch(), ripple = t.firstChild;
                track(Motion.animate(t, { scale: [1, 0.82, 1] }, { duration: SPEED.press * 2, ease: EASE }));
                track(Motion.animate(ripple, { scale: [1, 1.8], opacity: [0.9, 0] }, { duration: 0.4, ease: 'linear' }));
                dispatchTap(el, pt);
                return wait(SPEED.press * 2, id);
            });
    }

    /* 롱프레스: 이동 → 멈춤 → 눌러서 작아진 채 유지(물결이 천천히 퍼짐) → 뗌. click은 보내지 않음 (thumbPress가 롱프레스로 판정) */
    function longPress(getEl, id) {
        var el = getEl();
        if (!el) return Promise.resolve();
        var pt = pointOf(el);
        var p = phone.getBoundingClientRect();
        var opts = { bubbles: true, cancelable: true, clientX: pt.x + p.left, clientY: pt.y + p.top, pointerId: 99, isPrimary: true, button: 0, pointerType: 'touch' };
        return moveTo(pt, id)
            .then(function () { return wait(SPEED.hover, id); })
            .then(function () {
                var t = ensureTouch(), ripple = t.firstChild;
                track(Motion.animate(t, { scale: [1, 0.82] }, { duration: SPEED.press, ease: EASE }));
                track(Motion.animate(ripple, { scale: [1, 2.2], opacity: [0.9, 0] }, { duration: SPEED.longPress, ease: 'linear' }));
                el.dispatchEvent(new PointerEvent('pointerdown', opts));
                return wait(SPEED.longPress, id);
            })
            .then(function () {
                el.dispatchEvent(new PointerEvent('pointerup', opts));
                track(Motion.animate(ensureTouch(), { scale: [0.82, 1] }, { duration: SPEED.press, ease: EASE }));
                return wait(SPEED.press, id);
            });
    }

    /* 스크롤: 원이 손가락처럼 반대 방향으로 끌림 + 스크롤 영역이 MDS 이징으로 이동 */
    function scrollTo(target, id) {
        var from = scrollArea.scrollTop;
        var max = scrollArea.scrollHeight - scrollArea.clientHeight;
        target = Math.max(0, Math.min(max, target));
        if (Math.abs(target - from) < 2) return Promise.resolve();
        var h = phone.getBoundingClientRect().height, w = phone.getBoundingClientRect().width;
        var down = target > from; // 내용을 아래로(손가락은 위로)
        var start = { x: w / 2, y: down ? h * 0.72 : h * 0.3 };
        var end = { x: w / 2, y: down ? h * 0.3 : h * 0.72 };
        return moveTo(start, id).then(function () {
            var t = ensureTouch();
            track(Motion.animate(t, { scale: [1, 0.88] }, { duration: SPEED.press, ease: EASE }));
            track(Motion.animate(t, { left: [start.x + 'px', end.x + 'px'], top: [start.y + 'px', end.y + 'px'] }, { duration: SPEED.scroll, ease: EASE }));
            return track(Motion.animate(from, target, { duration: SPEED.scroll, ease: EASE, onUpdate: function (v) { scrollArea.scrollTop = v; } }));
        }).then(function () {
            alive(id);
            placeTouch(end);
            track(Motion.animate(ensureTouch(), { scale: [0.88, 1] }, { duration: SPEED.press, ease: EASE }));
        });
    }

    /* 요소가 스크롤 영역 안에 보이도록 (이미 보이면 그대로) */
    function scrollIntoView(el, id) {
        var a = scrollArea.getBoundingClientRect(), r = el.getBoundingClientRect();
        var bottomBar = document.querySelector('#brandPage .bottom-button');
        var visibleBottom = bottomBar ? bottomBar.getBoundingClientRect().top : a.bottom;
        if (r.top >= a.top + 8 && r.bottom <= visibleBottom - 8) return Promise.resolve();
        return scrollTo(scrollArea.scrollTop + (r.top - a.top) - (visibleBottom - a.top - r.height) / 2, id);
    }

    function hideTouch() {
        if (!touch) return;
        Motion.animate(touch, { opacity: 0 }, { duration: SPEED.appear });
    }

    /* 다른 데서 이벤트가 오길 기다림 (예: 로딩이 끝나 혜택 페이지로) */
    function waitEvent(name, id) {
        return new Promise(function (resolve, reject) {
            document.addEventListener(name, function () { if (id === runId) resolve(); else reject('stopped'); }, { once: true });
        });
    }

    /* ── 시나리오 ── */
    function scenario(id) {
        var buttons = [].slice.call(document.querySelectorAll('.brand-button'));
        var picks = buttons.slice(0, 3);   // 처음 화면의 앞 3개 (추천이 끼어들어도 그 버튼 그대로)
        var longTarget = buttons[3];       // 롱프레스로 바텀시트를 보여 줄 썸네일 (첫 줄 4번째)
        var sheetLayer = document.getElementById('brandSheetLayer');
        var dialogLayer = document.getElementById('skipDialogLayer');
        return Promise.resolve()
            /* 1. 스크롤 → 다음에 할게요 → 다이얼로그 → 딤을 눌러 닫기 */
            .then(function () { return scrollTo(scrollArea.scrollHeight, id); })
            .then(function () { return tap(function () { return document.querySelector('.skip-button'); }, id); })
            .then(function () { return wait(SPEED.dialogView, id); })
            .then(function () {
                return tap(function () { return dialogLayer; }, id, function () { // 다이얼로그 아래 딤
                    var d = dialogLayer.querySelector('.dialog').getBoundingClientRect(), p = phone.getBoundingClientRect();
                    return { x: p.width / 2, y: Math.min(p.height - 120, d.bottom - p.top + 90) };
                });
            })
            .then(function () { return wait(SPEED.afterClose, id); })
            /* 2. 선택 없이 하단 버튼 → 스낵바 */
            .then(function () { return tap(function () { return document.getElementById('ctaButton'); }, id); })
            .then(function () { return wait(SPEED.snackbarView, id); })
            /* 3. 맨 위로 → 롱프레스 → 바텀시트 → 딤을 눌러 닫기 → 브랜드 3개 차례로 */
            .then(function () { return scrollTo(0, id); })
            .then(function () { return longPress(function () { return longTarget; }, id); })
            .then(function () { return wait(SPEED.sheetView, id); })
            .then(function () {
                return tap(function () { return sheetLayer.querySelector('.sheet-dim'); }, id, function () { // 시트 위 딤
                    var sh = sheetLayer.querySelector('.sheet').getBoundingClientRect(), p = phone.getBoundingClientRect();
                    return { x: p.width / 2, y: Math.max(80, (sh.top - p.top) / 2) };
                });
            })
            .then(function () { return wait(SPEED.afterClose, id); })
            .then(function () {
                return picks.reduce(function (chain, button) {
                    return chain
                        .then(function () { return scrollIntoView(button, id); })
                        .then(function () { return tap(function () { return button; }, id); })
                        .then(function () { return wait(SPEED.betweenBrands, id); });
                }, Promise.resolve());
            })
            /* 4. 하단 버튼 → 로딩 → (노출 시간 뒤) 혜택 페이지 */
            .then(function () {
                var done = waitEvent('loading:done', id);
                return tap(function () { return document.getElementById('ctaButton'); }, id)
                    .then(function () { hideTouch(); return done; });
            })
            .then(function () { return wait(SPEED.landingView, id); })
            /* 5. 혜택 페이지 홈 아이콘 → 홈 랜딩 */
            .then(function () { return tap(function () { return document.getElementById('landingHome'); }, id); })
            .then(function () { hideTouch(); return wait(SPEED.homeView + 1.25, id); }); // 페이드 인 0.35 + 대기 0.5 + 스크롤 0.4
    }

    function stop() {
        runId += 1;
        runs.forEach(function (a) { if (a && a.stop) a.stop(); });
        runs = [];
        if (touch) touch.style.opacity = '0';
    }

    function start(onDone) {
        stop();
        if (!window.Motion || !scrollArea) { if (onDone) onDone(); return; }
        var id = runId;
        scenario(id)
            .then(function () { if (id === runId && onDone) onDone(); })
            .catch(function (e) { if (e !== 'stopped') { if (window.console) console.warn('autoplay', e); if (onDone) onDone(); } });
    }

    return { start: start, stop: stop, SPEED: SPEED };
})();
