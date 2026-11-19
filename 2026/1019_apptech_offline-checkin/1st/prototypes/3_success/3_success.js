/* 3_success.js — 조건달성
   상품 부유 모션은 CSS(3_success.css)에서 계속 재생, 콘페티 로티는 페이지 로드 후 CONFETTI_DELAY 뒤 1회 재생 */
(function () {
    var CONFETTI_DELAY = 500; // 페이지 로드 후 재생 지연(ms)

    var confetti = lottie.loadAnimation({
        container: document.getElementById('confetti'),
        renderer: 'svg',
        loop: false,
        autoplay: false,
        path: '3_success/lottie/confetti.json'
    });

    // 로드 완료 + 로티 데이터 준비가 모두 끝난 뒤 재생
    var confettiReady = new Promise(function (resolve) {
        if (confetti.isLoaded) resolve();
        else confetti.addEventListener('DOMLoaded', resolve);
    });

    var pageLoaded = document.readyState === 'complete'
        ? Promise.resolve()
        : new Promise(function (resolve) { window.addEventListener('load', resolve); });

    Promise.all([pageLoaded, confettiReady]).then(function () {
        setTimeout(function () { confetti.play(); }, CONFETTI_DELAY);
    });
})();
