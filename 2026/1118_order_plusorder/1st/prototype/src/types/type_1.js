/* type_1.js — 주문서 · 무배당발 플러스오더
   모션은 TitleSection(.plus-title)에만 넣는다
   - 로고 모션: 심볼 트럭(퀵필터 plusdelivery) + 글자 그라디언트(서브웨이 필터 타이틀)를 같은 주기 3.867초로 함께 반복
     (type_1.css .plus-logo-truck · .plus-logo-gradient). 둘 다 .plus-logo.is-play 하나로 동시에 시작해 어긋나지 않음 */
(function () {
    var logo = document.querySelector('.plus-logo');
    if (!logo) return;

    /* is-play 를 뗐다 붙여야 CSS 애니메이션이 0% 부터 다시 시작 (퀵필터 playIcon 과 같은 방식) */
    function playLogo(once) {
        logo.classList.remove('is-play', 'is-once');
        void logo.offsetWidth;
        logo.classList.toggle('is-once', !!once);
        logo.classList.add('is-play');
    }

    window.plusLogoMotion = { play: playLogo };
    playLogo(false);
})();
