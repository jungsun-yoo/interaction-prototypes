/* type_1.js — Type 1 전용 동작
   1. 로티 버전: [data-lottie] 칸마다 src/lottie/<이름>.json 을 반복 재생
   2. 무배당발 탭(TabOutlinedItem): 누르면 선택 ↔ 미선택 (aria-pressed)
      명세 6장 — 상태가 바뀌면 모션을 처음(0초)부터 다시 재생 (로티 · CSS 둘 다) */
(function () {
    var lottieAnims = [];   /* { el, anim } */

    if (window.lottie) {
        [].forEach.call(document.querySelectorAll('[data-lottie]'), function (el) {
            lottieAnims.push({
                el: el,
                anim: lottie.loadAnimation({
                    container: el,
                    renderer: 'svg',
                    loop: true,
                    autoplay: true,
                    path: './src/lottie/' + el.dataset.lottie + '.json'
                })
            });
        });
    }

    function restartMotion(root) {
        /* 로티: 0프레임부터 다시 */
        lottieAnims.forEach(function (item) {
            if (root.contains(item.el)) item.anim.goToAndPlay(0, true);
        });
        /* CSS: is-play 를 뗐다 붙여야 0% 부터 다시 시작 */
        var boxes = root.querySelectorAll('.mbdb-icon-motion');
        [].forEach.call(boxes, function (box) { box.classList.remove('is-play'); });
        void root.offsetWidth;
        [].forEach.call(boxes, function (box) { box.classList.add('is-play'); });
    }

    /* 지면 탭: 고른 지면만 보이고, 그 지면 모션을 처음부터 다시 */
    var surfaceTabs = document.querySelectorAll('.surface-tab');
    [].forEach.call(surfaceTabs, function (tab) {
        tab.addEventListener('click', function () {
            var surface = tab.dataset.surface;
            [].forEach.call(surfaceTabs, function (t) { t.setAttribute('aria-selected', String(t === tab)); });
            [].forEach.call(document.querySelectorAll('.cmp-row[data-surface]'), function (row) {
                row.hidden = row.dataset.surface !== surface;
                if (!row.hidden) restartMotion(row);
            });
        });
    });

    [].forEach.call(document.querySelectorAll('button.mbdb-tab'), function (tab) {
        tab.addEventListener('click', function () {
            var next = tab.getAttribute('aria-pressed') !== 'true';
            tab.setAttribute('aria-pressed', String(next));
            restartMotion(tab);
        });
    });
})();
