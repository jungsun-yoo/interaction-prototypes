/* ════════════════════════════════════════════════════
   result.js — 29CM 분석 결과 화면
   - 상품 좌표 데이터(aiPhotoAnalysis.html의 lensResultData)로 밝은 창·모서리·파형 점·썸네일·상품 리스트를 만듦
   - 썸네일·점을 누르면 포커스 창·모서리가 values.css --lens-focus-* 로 이동, 상품 리스트는 바로 전환
   - 사진 축소·창·모서리 움직임은 frameMotion()이 매 프레임 한꺼번에 그림 (result.css는 시작·끝 상태만 정함)
   다른 파일에서 쓰는 것: AIPhoto.result.frameMotion · stopMotion · selectItem · firstId
   ════════════════════════════════════════════════════ */
(function () {
    var rootStyle = getComputedStyle(document.documentElement);
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------- 한 프레임 모션: 사진·밝은 창·모서리를 같은 프레임에서 같이 움직임 ----------
       clip-path는 브라우저가 별도 스레드에서 그려 CSS transition으로는 left/top(모서리)과 어긋나 보일 수 있음
       → 시작 상태와 끝 상태(CSS가 정함)를 읽어 두고, 그 사이를 requestAnimationFrame으로 직접 채움 */
    function cssTime(name) {                    /* :root의 '0.4s'·'400ms' → ms */
        var v = rootStyle.getPropertyValue(name).trim();
        var n = parseFloat(v) || 0;
        return /ms$/.test(v) ? n : n * 1000;
    }
    var KEYWORD_EASE = {
        'linear': [0, 0, 1, 1], 'ease': [0.25, 0.1, 0.25, 1], 'ease-in': [0.42, 0, 1, 1],
        'ease-out': [0, 0, 0.58, 1], 'ease-in-out': [0.42, 0, 0.58, 1]
    };
    function cssEasing(name) {                  /* :root의 cubic-bezier(...) 또는 키워드 → 진행률 함수 */
        var v = rootStyle.getPropertyValue(name).trim();
        var m = v.match(/cubic-bezier\(([^)]+)\)/);
        var p = m ? m[1].split(',').map(parseFloat) : (KEYWORD_EASE[v] || KEYWORD_EASE.ease);
        return bezier(p[0], p[1], p[2], p[3]);
    }
    function bezier(x1, y1, x2, y2) {           /* CSS cubic-bezier와 같은 곡선 */
        function a(p1, p2) { return 1 - 3 * p2 + 3 * p1; }
        function b(p1, p2) { return 3 * p2 - 6 * p1; }
        function c(p1) { return 3 * p1; }
        function at(t, p1, p2) { return ((a(p1, p2) * t + b(p1, p2)) * t + c(p1)) * t; }
        function slope(t, p1, p2) { return 3 * a(p1, p2) * t * t + 2 * b(p1, p2) * t + c(p1); }
        return function (x) {
            if (x <= 0) return 0;
            if (x >= 1) return 1;
            var t = x;
            for (var i = 0; i < 8; i++) {       /* 뉴턴법으로 x에 해당하는 t 찾기 */
                var d = at(t, x1, x2) - x;
                var s = slope(t, x1, x2);
                if (Math.abs(d) < 1e-6 || !s) break;
                t -= d / s;
            }
            return at(Math.min(1, Math.max(0, t)), y1, y2);
        };
    }

    var motionEls = (function () {
        var box = document.getElementById('lensResultPhoto');
        if (!box) return [];
        return [
            { role: 'photo', el: box.querySelector('.crop-photo:not(.crop-reveal)'), props: ['top', 'width', 'height'] },
            { role: 'photo', el: box.querySelector('.crop-dim'), props: ['top', 'width', 'height'] },
            { role: 'reveal', el: box.querySelector('.crop-reveal'), props: ['top', 'width', 'height', 'opacity', 'clipPath'] },
            { role: 'corner', anchor: [9, 1], el: box.querySelector('.crop-corner.is-tr'), props: ['top', 'left', 'opacity'] },
            { role: 'corner', anchor: [1, 9], el: box.querySelector('.crop-corner.is-bl'), props: ['top', 'left', 'opacity'] }
        ].filter(function (m) { return m.el; });
    })();

    function parseInset(v) {                    /* 'inset(a b c d round r)' → [위, 오른쪽, 아래, 왼쪽, 모서리] */
        var m = (v || '').match(/inset\(([^)]*)\)/);
        if (!m) return null;
        var parts = m[1].split('round');
        var n = parts[0].trim().split(/\s+/).map(parseFloat);
        var t = n[0], r = n.length > 1 ? n[1] : t, b = n.length > 2 ? n[2] : t, l = n.length > 3 ? n[3] : r;
        var rad = parts[1] ? parseFloat(parts[1]) : 0;
        return [t, r, b, l, rad];
    }
    function readState() {
        return motionEls.map(function (m) {
            var cs = getComputedStyle(m.el);
            var o = {};
            m.props.forEach(function (p) { o[p] = p === 'clipPath' ? parseInset(cs.clipPath) : parseFloat(cs[p]); });
            return o;
        });
    }
    /* zoom: 사진 내용 배율 (로딩 화면 숨쉬기·랜딩 중에 완료하면 그 순간 배율에서 1로 같이 줄어듦, 없으면 1)
       사진·딤·밝은 창은 가운데 기준 scale, 사진·딤은 틀 밖으로 넘친 만큼 잘라 틀 크기 유지,
       모서리는 같은 배율로 가운데 기준 위치만 옮겨 창과 맞물리게 함 */
    function writeState(state, zoom) {
        var z = zoom || 1;
        var frame = state[0] || {};                          /* 사진 틀 (top·width·height) */
        var cx = AREA_W / 2, cy = (frame.top || 0) + (frame.height || 0) / 2;
        motionEls.forEach(function (m, i) {
            var v = state[i];
            m.props.forEach(function (p) {
                var x = v[p];
                if (p === 'clipPath') {
                    if (x) m.el.style.clipPath = 'inset(' + x[0] + 'px ' + x[1] + 'px ' + x[2] + 'px ' + x[3] + 'px round ' + x[4] + 'px)';
                } else if (!isNaN(x)) {
                    m.el.style[p] = p === 'opacity' ? x : x + 'px';
                }
            });
            if (z === 1) {
                if (m.role !== 'corner') { m.el.style.transform = ''; if (m.role === 'photo') m.el.style.clipPath = ''; }
                return;
            }
            if (m.role === 'photo' || m.role === 'reveal') {
                m.el.style.transform = 'translateX(-50%) scale(' + z + ')';
                if (m.role === 'photo') {                    /* 커진 만큼 잘라 보이는 틀은 그대로 */
                    var ex = v.width * (1 - 1 / z) / 2, ey = v.height * (1 - 1 / z) / 2;
                    m.el.style.clipPath = 'inset(' + ey + 'px ' + ex + 'px)';
                }
            } else if (m.role === 'corner') {
                var ax = v.left + m.anchor[0], ay = v.top + m.anchor[1];
                m.el.style.left = (cx + (ax - cx) * z - m.anchor[0]) + 'px';
                m.el.style.top = (cy + (ay - cy) * z - m.anchor[1]) + 'px';
            }
        });
    }
    function clearInline() {
        motionEls.forEach(function (m) {
            m.props.forEach(function (p) { m.el.style[p] = ''; });
            m.el.style.transform = '';
            m.el.style.clipPath = '';
        });
    }
    function mix(a, b, k) { return a + (b - a) * k; }
    function between(from, to, k) {
        return from.map(function (f, i) {
            var o = {};
            Object.keys(f).forEach(function (p) {
                var a = f[p], b = to[i][p];
                if (p === 'clipPath') o[p] = (a && b) ? a.map(function (x, j) { return mix(x, b[j], k); }) : b;
                else o[p] = mix(a, b, k);
            });
            return o;
        });
    }

    var motionFrame = null;
    /* applyChange(): 클래스·data-focus를 바꾸는 함수. 지금 보이는 상태에서 바뀐 뒤 상태까지 duration 동안 같이 이동 */
    function frameMotion(applyChange, durationName, easingName, zoomFrom) {
        var z0 = zoomFrom || 1;
        var from = readState();                 /* 지금 화면에 보이는 값 (이동 중이면 그 중간값) */
        cancelAnimationFrame(motionFrame);
        clearInline();
        applyChange();
        var to = readState();                   /* CSS가 정한 끝 상태 */
        var duration = reduceMotion ? 0 : cssTime(durationName);
        if (!duration) return;                  /* 0이면 바로 끝 상태 */
        var ease = cssEasing(easingName);
        var start = null;
        writeState(from, z0);
        function step(now) {
            if (start === null) start = now;
            var k = Math.min(1, (now - start) / duration);
            if (k >= 1) { clearInline(); return; }   /* 끝: 인라인을 지우면 CSS 끝 상태 그대로 */
            var e = ease(k);
            writeState(between(from, to, e), mix(z0, 1, e));
            motionFrame = requestAnimationFrame(step);
        }
        motionFrame = requestAnimationFrame(step);
    }
    function stopMotion() { cancelAnimationFrame(motionFrame); clearInline(); }

    /* ---------- AI 분석 결과(상품 좌표) → 화면 위치 ----------
       lensResultData(aiPhotoAnalysis.html)의 상품마다 box(상품 영역)·point(파형 점)를 사진 원본 기준 0~1 비율로 받음
       사진이 사진 틀에 object-fit: cover 로 들어가므로, 확대 배율과 잘린 양을 계산해 틀 안 px로 바꿈 */
    var photo = document.getElementById('lensResultPhoto');
    var pointsBox = document.getElementById('lensResultPoints');
    var thumbsBox = document.getElementById('lensResultThumbs');
    var listsBox = document.getElementById('lensResultLists');
    var data = readData();
    var items = data.items;
    var firstId = items.length ? items[0].id : '';

    /* 사진 틀 (result.css와 같은 값): 결과 186.03×280 (영역 위 6), 로딩 크기 390×520 (영역 위 52), 영역 너비 390 */
    var AREA_W = 390;
    var FRAME_END = { w: 186.03, h: 280, top: 6 };
    var FRAME_START = { w: 390, h: 520, top: 52 };
    var WINDOW_RADIUS = 4;       /* 밝은 창 모서리 둥글기 */
    var WINDOW_MIN = 24;         /* 아주 작은 상품도 창이 이 크기보다 작아지지 않게 */
    var POINT_SIZE = 14;         /* 파형 점 지름 */

    function readData() {
        var el = document.getElementById('lensResultData');
        try {
            var d = JSON.parse(el ? el.textContent : '{}');
            var list = (d.items || []).filter(function (it) {
                return it && it.id && it.box && [it.box.x, it.box.y, it.box.w, it.box.h].every(function (v) { return typeof v === 'number'; });
            });
            return { image: d.image || '', items: list };
        } catch (e) {
            console.error('lensResultData를 읽지 못했어요:', e);
            return { image: '', items: [] };
        }
    }

    function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }
    function n2(v) { return Math.round(v * 100) / 100; }

    /* 틀 크기와 사진 원본 크기로 cover 배치 계산 */
    function frameGeom(f, iw, ih) {
        var scale = Math.max(f.w / iw, f.h / ih);
        var dw = iw * scale, dh = ih * scale;
        return { left: (AREA_W - f.w) / 2, top: f.top, w: f.w, h: f.h, dw: dw, dh: dh, ox: (dw - f.w) / 2, oy: (dh - f.h) / 2 };
    }
    function toFrame(g, nx, ny) { return { x: nx * g.dw - g.ox, y: ny * g.dh - g.oy }; }   /* 비율 좌표 → 틀 안 px */

    /* 상품 영역 → 틀 안 창 (틀 밖으로 잘린 부분은 잘라 냄, 최소 크기 보장) */
    function windowRect(g, box) {
        var a = toFrame(g, box.x, box.y), b = toFrame(g, box.x + box.w, box.y + box.h);
        var x1 = clamp(a.x, 0, g.w), y1 = clamp(a.y, 0, g.h), x2 = clamp(b.x, 0, g.w), y2 = clamp(b.y, 0, g.h);
        var cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
        var w = Math.min(g.w, Math.max(WINDOW_MIN, x2 - x1)), h = Math.min(g.h, Math.max(WINDOW_MIN, y2 - y1));
        x1 = clamp(cx - w / 2, 0, g.w - w); y1 = clamp(cy - h / 2, 0, g.h - h);
        return { x1: x1, y1: y1, x2: x1 + w, y2: y1 + h };
    }
    function insetOf(g, r, radius) {
        return 'inset(' + n2(r.y1) + 'px ' + n2(g.w - r.x2) + 'px ' + n2(g.h - r.y2) + 'px ' + n2(r.x1) + 'px round ' + radius + 'px)';
    }
    function cornerRules(sel, g, r) {      /* 모서리 상자(10×10)의 선이 창 모서리에 오도록 */
        return sel + ' .crop-corner.is-tr{top:' + n2(g.top + r.y1 - 1) + 'px;left:' + n2(g.left + r.x2 - 9) + 'px}' +
               sel + ' .crop-corner.is-bl{top:' + n2(g.top + r.y2 - 9) + 'px;left:' + n2(g.left + r.x1 - 1) + 'px}';
    }

    /* 상품별 위치 규칙을 <style id="lensFocusStyle">로 넣음 → frameMotion이 CSS 끝 상태로 읽어 움직임 */
    function layout(iw, ih) {
        if (!iw || !ih) return;
        var gEnd = frameGeom(FRAME_END, iw, ih), gStart = frameGeom(FRAME_START, iw, ih);
        var css = '';
        items.forEach(function (it) {
            var sel = '#lensResultPhoto[data-focus="' + CSS.escape(it.id) + '"]';
            var end = windowRect(gEnd, it.box);
            /* 진입 시작점: 상품 가운데가 로딩 크기 사진 위에서 놓이는 한 점 */
            var c = toFrame(gStart, it.box.x + it.box.w / 2, it.box.y + it.box.h / 2);
            var start = { x1: c.x, y1: c.y, x2: c.x, y2: c.y };
            css += sel + ' .crop-reveal{clip-path:' + insetOf(gEnd, end, WINDOW_RADIUS) + '}' + cornerRules(sel, gEnd, end);
            css += '.lens-result.is-sheet-down ' + sel + ' .crop-reveal{clip-path:' + insetOf(gStart, start, 0) + '}' +
                   cornerRules('.lens-result.is-sheet-down ' + sel, gStart, start);
            /* 파형 점: point가 없으면 상품 영역 가운데 */
            var p = it.point || { x: it.box.x + it.box.w / 2, y: it.box.y + it.box.h / 2 };
            var pp = toFrame(gEnd, p.x, p.y);
            var dot = pointsBox && pointsBox.querySelector('[data-focus="' + CSS.escape(it.id) + '"]');
            if (dot) {
                dot.style.left = n2(gEnd.left + clamp(pp.x, 0, gEnd.w) - POINT_SIZE / 2) + 'px';
                dot.style.top = n2(gEnd.top + clamp(pp.y, 0, gEnd.h) - POINT_SIZE / 2) + 'px';
            }
        });
        var style = document.getElementById('lensFocusStyle');
        if (!style) {
            style = document.createElement('style');
            style.id = 'lensFocusStyle';
            document.head.appendChild(style);
        }
        style.textContent = css;
    }

    /* 상품마다 파형 점·썸네일·상품 리스트를 만듦 */
    function buildItems() {
        var dotSrc = pointsBox ? pointsBox.dataset.dot : '';
        items.forEach(function (it, i) {
            var label = it.name || ('찾은 상품 ' + (i + 1));
            if (pointsBox) {
                var dot = document.createElement('button');
                dot.className = 'crop-point';
                dot.type = 'button';
                dot.dataset.focus = it.id;
                dot.setAttribute('aria-label', label + ' 보기');
                dot.innerHTML = '<img src="' + dotSrc + '" width="14" height="14" alt="">';
                dot.addEventListener('click', function () { selectItem(it.id, true); });
                pointsBox.appendChild(dot);
            }
            if (thumbsBox) {
                var thumb = document.createElement('button');
                thumb.className = 'lens-result-thumb';
                thumb.type = 'button';
                thumb.setAttribute('role', 'tab');
                thumb.dataset.focus = it.id;
                thumb.innerHTML = '<img src="' + (it.thumb || '') + '" width="52" height="52" alt="' + label + '">';
                thumb.addEventListener('click', function () { selectItem(it.id, true); });
                thumbsBox.appendChild(thumb);
            }
            if (listsBox) {
                var list = document.createElement('img');
                list.className = 'lens-result-list';
                list.dataset.focus = it.id;
                list.src = it.list || '';
                list.width = 390;
                list.height = 308;
                list.alt = label + ' 비슷한 상품 목록';
                listsBox.appendChild(list);
            }
        });
    }

    /* 상품 선택: 썸네일·점·리스트 표시를 바꾸고, 사진의 포커스 창·모서리를 이동 (animate=false면 바로) */
    function selectItem(id, animate) {
        if (!photo) return;
        Array.prototype.forEach.call(document.querySelectorAll('.lens-result-thumb'), function (t) {
            var on = t.dataset.focus === id;
            t.classList.toggle('is-selected', on);
            t.setAttribute('aria-selected', on ? 'true' : 'false');
        });
        Array.prototype.forEach.call(document.querySelectorAll('.lens-result-list'), function (l) {
            l.classList.toggle('is-on', l.dataset.focus === id);     /* 바텀시트 안: 모션 없이 바로 전환 */
        });
        Array.prototype.forEach.call(document.querySelectorAll('.lens-result-photo .crop-point'), function (p) {
            p.classList.toggle('is-current', p.dataset.focus === id); /* 선택된 상품의 점은 숨김 */
        });
        if (photo.dataset.focus === id) return;
        if (animate) frameMotion(function () { photo.dataset.focus = id; }, '--lens-focus-duration', '--lens-focus-easing');
        else photo.dataset.focus = id;
    }

    (function initResult() {
        Array.prototype.forEach.call(document.querySelectorAll('#lensResultPhoto .crop-photo'), function (img) { img.src = data.image; });
        buildItems();
        selectItem(firstId, false);
        var img = photo && photo.querySelector('.crop-photo');
        if (!img) return;
        function run() { layout(img.naturalWidth, img.naturalHeight); }
        if (img.complete && img.naturalWidth) run();
        else img.addEventListener('load', run, { once: true });
    })();

    window.AIPhoto = window.AIPhoto || {};
    window.AIPhoto.result = {
        frameMotion: frameMotion,
        stopMotion: stopMotion,
        selectItem: selectItem,
        firstId: firstId
    };
})();
