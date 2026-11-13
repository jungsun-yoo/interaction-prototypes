/* ════════════════════════════════════════════════════
   controls.js — 옵션창 Inner Glow · Light
   - 슬라이더·입력창 → 로딩 화면(.lens-screen)의 CSS 변수 (data-glow-var 이름)
   - 기본값은 values.css 값을 그대로 읽음. 리셋 아이콘은 그 옵션창 값만 values.css 기본으로 되돌림
   - 켜기/끄기 체크박스(Light On): 끄면 화면에 data-off-class
   - 주소에 값이 있으면(?lightSize=400 …) 그 값으로 시작
   사람이 바꾼 값은 'aiphoto:change' 이벤트로 알림 (sync.js가 받아 QR·휴대폰에 전달)
   다른 파일에서 쓰는 것: AIPhoto.controls.params() · apply(params)
   ════════════════════════════════════════════════════ */
(function () {
    var screen = document.querySelector('.lens-screen');
    var fields = document.querySelectorAll('.lens-controls [data-glow-var]');
    var resets = document.querySelectorAll('.lens-controls [data-reset]');
    var toggles = document.querySelectorAll('.lens-controls [data-toggle-param]');
    var each = function (list, fn) { Array.prototype.forEach.call(list, fn); };

    function emit() {
        document.dispatchEvent(new CustomEvent('aiphoto:change', { detail: { action: 'option' } }));
    }

    function defaultOf(name) {               /* 덮어쓴 값 없이 values.css가 정한 기본값 */
        return parseFloat(getComputedStyle(screen).getPropertyValue(name)) || 0;
    }
    function show(field, value) {
        var step = parseFloat(field.querySelector('input[type="number"]').step) || 1;
        var digits = step < 1 ? String(step).split('.')[1].length : 0;
        field.querySelector('input[type="range"]').value = value;
        field.querySelector('input[type="number"]').value = value.toFixed(digits);
    }
    function setValue(field, raw) {
        var range = field.querySelector('input[type="range"]');
        var n = parseFloat(raw);
        if (isNaN(n)) n = parseFloat(range.value);                     /* 잘못 입력하면 이전 값 유지 */
        n = Math.min(parseFloat(range.max), Math.max(parseFloat(range.min), n));
        screen.style.removeProperty(field.dataset.glowVar);
        if (n !== defaultOf(field.dataset.glowVar)) screen.style.setProperty(field.dataset.glowVar, n + field.dataset.unit);   /* 기본값과 같으면 덮어쓰지 않음 */
        show(field, n);
    }
    function resetValue(field) {
        screen.style.removeProperty(field.dataset.glowVar);
        show(field, defaultOf(field.dataset.glowVar));
    }
    function setToggle(box, on) {
        box.checked = on;
        screen.classList.toggle(box.dataset.offClass, !on);
    }
    function resetPanel(panel) {             /* panel 을 주면 그 옵션창만, 없으면 전부 */
        each(fields, function (f) { if (!panel || panel.contains(f)) resetValue(f); });
        each(toggles, function (box) { if (!panel || panel.contains(box)) setToggle(box, true); });
    }

    /* 지금 값 중 기본값과 다른 것만 (주소·동기화용): { lightSize: '400', light: '0', … } */
    function params() {
        var out = {};
        each(fields, function (f) {
            var v = screen.style.getPropertyValue(f.dataset.glowVar);
            if (v) out[f.dataset.param] = String(parseFloat(v));
        });
        each(toggles, function (box) { if (!box.checked) out[box.dataset.toggleParam] = '0'; });
        return out;
    }
    /* 받은 값 적용: 들어온 항목은 그 값, 빠진 항목은 기본값 */
    function apply(p) {
        each(fields, function (f) {
            if (p[f.dataset.param] != null) setValue(f, p[f.dataset.param]);
            else resetValue(f);
        });
        each(toggles, function (box) { setToggle(box, p[box.dataset.toggleParam] !== '0'); });
    }

    if (screen) {
        each(fields, function (f) {
            f.querySelector('input[type="range"]').addEventListener('input', function (e) { setValue(f, e.target.value); emit(); });
            f.querySelector('input[type="number"]').addEventListener('change', function (e) { setValue(f, e.target.value); emit(); });
        });
        each(resets, function (btn) {
            btn.addEventListener('click', function () { resetPanel(btn.closest('.lens-control')); emit(); });
        });
        each(toggles, function (box) {
            box.addEventListener('change', function () { setToggle(box, box.checked); emit(); });
        });

        /* 시작: 기본값을 옵션창에 표시하고, 주소에 값이 있으면 그 값으로 */
        resetPanel();
        var url = new URLSearchParams(location.search);
        var fromUrl = {};
        each(fields, function (f) { if (url.has(f.dataset.param)) fromUrl[f.dataset.param] = url.get(f.dataset.param); });
        each(toggles, function (box) { if (url.has(box.dataset.toggleParam)) fromUrl[box.dataset.toggleParam] = url.get(box.dataset.toggleParam); });
        apply(fromUrl);
    }

    window.AIPhoto.controls = {
        params: screen ? params : function () { return {}; },
        apply: screen ? apply : function () {}
    };
})();
