/* 2_stamp.js — 스탬프 적립 보드
   stampConfetti 로티 + 스탬프 스케일(stampPop) — REPEAT_INTERVAL 마다 둘을 처음부터 함께 재생
   인덱스 옵션 카드 '스탬프'를 바꾸면 그 매장 스탬프 이미지로 바뀜 (common/stamp_mark.js) */
(function () {
    var STAMP_CONFETTI_PATH = '2_stamp/lottie/stampConfetti.json';
    var REPEAT_INTERVAL = 3200; // 반복 재생 간격(ms)
    var stampImg = document.getElementById('stampMark');

    stampImg.src = stampMark.src(stampMark.current());
    stampMark.onChange(function (name) { stampImg.src = stampMark.src(name); });

    var confetti = lottie.loadAnimation({
        container: document.getElementById('stampConfetti'),
        renderer: 'svg',
        loop: false,
        autoplay: false,
        path: STAMP_CONFETTI_PATH
    });

    var stampPop = null;
    function playCycle() {
        confetti.goToAndPlay(0, true);
        if (!stampPop) {
            stampImg.classList.add('is-playing');
            stampPop = stampImg.getAnimations().find(function (a) { return a.animationName === 'stampPop'; }) || null;
        } else {
            stampPop.currentTime = 0;
            stampPop.play();
        }
    }

    confetti.addEventListener('DOMLoaded', function () {
        playCycle();
        setInterval(playCycle, REPEAT_INTERVAL);
    });
})();
