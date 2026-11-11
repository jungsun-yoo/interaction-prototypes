/* type_3.js — 사진 검색 가이드
   로티: 화면 진입과 함께 tutorial_lens.json 재생, 무한 반복
   index 다시 재생(R)으로 처음부터 */
(function () {
    var box = document.getElementById('guideLottie');
    if (!box || !window.lottie) return;

    lottie.loadAnimation({
        container: box,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: 'src/img/tutorial_lens.json?t=' + Date.now() /* 로티를 다시 내보내도 바로 반영되게 캐시 방지 */
    });
})();
