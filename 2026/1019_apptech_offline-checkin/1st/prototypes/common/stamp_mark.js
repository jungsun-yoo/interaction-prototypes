/* stamp_mark.js — 매장 스탬프 이미지 (체크인 · 스탬프 공통)
   인덱스 옵션 카드 '스탬프' 값이 <html data-mark="kicks"> 로 들어오면 그 매장 이미지로 바꿈
   이미지 폴더는 불러오는 script 의 data-base 로 지정: <script src="common/stamp_mark.js" data-base="1_checkin/img/stamp-mark/">
   사용: stampMark.src(stampMark.current())  /  stampMark.onChange(function (name) { ... }) */
var stampMark = (function () {
    var MARKS = ['store', 'standard', 'beauty', 'outlet', 'kicks', 'run', '29home', '29kids', 'empty'];
    var DEFAULT_MARK = 'store';
    var root = document.documentElement;
    var BASE = (document.currentScript && document.currentScript.dataset.base) || 'img/stamp-mark/';
    var listeners = [];
    var last = null;

    function current() {
        var value = root.getAttribute('data-mark');
        return MARKS.indexOf(value) > -1 ? value : DEFAULT_MARK;
    }

    function src(name) {
        return BASE + name + '.png';
    }

    /* 같은 값이 다시 들어오면(옵션 동기화 등) 무시하고, 실제로 바뀔 때만 알림 */
    new MutationObserver(function () {
        var name = current();
        if (name === last) return;
        last = name;
        listeners.forEach(function (fn) { fn(name); });
    }).observe(root, { attributes: true, attributeFilter: ['data-mark'] });

    last = current();

    return {
        MARKS: MARKS,
        current: current,
        src: src,
        onChange: function (fn) { listeners.push(fn); }
    };
})();
