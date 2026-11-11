/* type_1.js — 검색아이콘 툴팁 + 로티
   툴팁: 화면 진입 0.4초 뒤 등장, 4초 노출 후 사라짐
   로티: 툴팁 등장과 동시에 재생 시작, 무한 반복 (그 전에는 첫 프레임에 멈춰 있음)
   index 다시 재생(R)으로 처음부터 */
(function () {
    var tip = document.getElementById('searchTip');
    var icon = document.getElementById('searchIcon');
    if (!tip || !icon || !window.lottie) return;

    var anim = lottie.loadAnimation({
        container: icon,
        renderer: 'svg',
        loop: true,
        autoplay: false,
        path: 'src/img/ic_search-lens.json?t=' + Date.now() /* 로티를 다시 내보내도 바로 반영되게 캐시 방지 */
    });

    var TIP_DELAY = 400;   /* 툴팁 등장까지 (ms) */
    var TIP_HOLD = 4000;   /* 툴팁 노출 유지 */

    setTimeout(function () {
        tip.classList.add('is-on');
        anim.play();                                                          /* 툴팁 등장과 동시에 로티 재생 */
        setTimeout(function () { tip.classList.remove('is-on'); }, TIP_HOLD);
    }, TIP_DELAY);
})();
