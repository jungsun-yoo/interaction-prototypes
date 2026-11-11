/* type_2.js — [검색] 검색창 렌즈아이콘 툴팁 + 로티
   툴팁: 홈(type_1.js)과 같음. 화면 진입 0.4초 뒤 등장, 4초 노출 후 사라짐
   로티: 툴팁 등장과 동시에 lens_emphasis 1회 재생 → 끝나면 lens_default 무한 반복
         (그 전에는 lens_emphasis 첫 프레임에 멈춰 있음)
   index 다시 재생(R)으로 처음부터 */
(function () {
    var tip = document.getElementById('searchTip');
    var emphasisEl = document.getElementById('lensEmphasis');
    var defaultEl = document.getElementById('lensDefault');
    if (!tip || !emphasisEl || !defaultEl || !window.lottie) return;

    var TIP_DELAY = 400;   /* 툴팁 등장까지 (ms) */
    var TIP_HOLD = 4000;   /* 툴팁 노출 유지 */
    var nocache = '?t=' + Date.now(); /* 로티를 다시 내보내도 바로 반영되게 캐시 방지 */

    var emphasis = lottie.loadAnimation({
        container: emphasisEl,
        renderer: 'svg',
        loop: false,
        autoplay: false,
        path: 'src/img/lens_emphasis.json' + nocache
    });
    /* 기본 루프는 미리 불러와 숨겨 둠 → 강조가 끝나는 순간 깜빡임 없이 바꿈 */
    var idle = lottie.loadAnimation({
        container: defaultEl,
        renderer: 'svg',
        loop: true,
        autoplay: false,
        path: 'src/img/lens_default.json' + nocache
    });

    emphasis.addEventListener('complete', function () {
        defaultEl.hidden = false;
        emphasisEl.hidden = true;
        idle.goToAndPlay(0, true);
    });

    setTimeout(function () {
        tip.classList.add('is-on');
        emphasis.play();                                                      /* 툴팁 등장과 동시에 강조 로티 재생 */
        setTimeout(function () { tip.classList.remove('is-on'); }, TIP_HOLD);
    }, TIP_DELAY);
})();
