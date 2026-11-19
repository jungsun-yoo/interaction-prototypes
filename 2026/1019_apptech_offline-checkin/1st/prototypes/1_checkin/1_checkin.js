/* 1_checkin.js — 체크인 시퀀스 (1회): 스탬프 쾅 → 뒤집혀 코인 → 콘페티
   단계별 시간은 1_checkin.css 의 .checkin__visual 변수(--t-*)에서 관리, 콘페티는 --t-confetti 에 맞춰 재생
   인덱스 옵션 카드 '스탬프'를 바꾸면 그 매장 스탬프로 처음부터 다시 재생 (common/stamp_mark.js) */
(function () {
    var START_DELAY = 500; // 페이지 로드 후 시퀀스 시작 지연(ms)
    var CONFETTI_PATH = '1_checkin/lottie/confetti.json';
    var visual = document.querySelector('.checkin__visual');
    var stampImg = document.getElementById('stampMark');
    var echoImg = document.getElementById('stampEcho');

    function cssTimeMs(name) {
        return parseFloat(getComputedStyle(visual).getPropertyValue(name)) * 1000;
    }

    // 콘페티 로티 — 불러오지 못해도 나머지 시퀀스는 재생
    var confettiReady = new Promise(function (resolve) {
        var anim = lottie.loadAnimation({
            container: document.getElementById('coinConfetti'),
            renderer: 'svg',
            loop: false,
            autoplay: false,
            path: CONFETTI_PATH
        });
        anim.addEventListener('DOMLoaded', function () { resolve(anim); });
        anim.addEventListener('data_failed', function () { resolve(null); });
    });

    var pageLoaded = document.readyState === 'complete'
        ? Promise.resolve()
        : new Promise(function (resolve) { window.addEventListener('load', resolve); });

    var confetti = null;
    var startTimer = null;
    var confettiTimer = null;

    // 시퀀스를 처음부터 재생 (스탬프를 바꿀 때도 호출)
    function playSequence() {
        clearTimeout(startTimer);
        clearTimeout(confettiTimer);
        visual.classList.remove('is-playing');
        void visual.offsetWidth; // CSS 애니메이션을 처음부터 다시 시작
        visual.classList.add('is-playing');
        if (confetti) {
            confetti.goToAndStop(0, true);
            confettiTimer = setTimeout(function () { confetti.goToAndPlay(0, true); }, cssTimeMs('--t-confetti'));
        }
    }

    // 매장 스탬프 이미지 (스탬프 + 잔상)
    function setMark(name) {
        stampImg.src = stampMark.src(name);
        echoImg.src = stampMark.src(name);
    }

    setMark(stampMark.current());

    // 옵션 카드에서 스탬프를 바꾸면 새 이미지가 준비된 뒤 시퀀스를 처음부터 다시 재생
    stampMark.onChange(function (name) {
        setMark(name);
        stampImg.decode().catch(function () {}).then(playSequence);
    });

    Promise.all([pageLoaded, confettiReady]).then(function (result) {
        confetti = result[1];
        startTimer = setTimeout(playSequence, START_DELAY);
    });
})();
