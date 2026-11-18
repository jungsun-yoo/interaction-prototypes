/* type_1.js — 체크인 아이콘 뱃지 */

/* 게이트웨이 버튼 로티: 자동재생 · 무한루프 */
(function () {
    var container = document.getElementById('appbarGateway');
    if (!container || !window.lottie) return;
    lottie.loadAnimation({
        container: container,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: 'src/lottie/ic_gateway_affordance.json'
    });
})();

/* 이벤트 배지 루프 (중심점 좌하단)
   등장: 페이드인 0.15s linear + 스케일 0 → 1 (mds.spring.bouncy)
   퇴장: 같은 이징으로 반대로 (페이드아웃 + 스케일 1 → 0 동시 시작)
   최초 1초 딜레이 → 등장 완료 → 3초 노출 → 퇴장 완료 → 6초 대기 → 다시 등장 … 무한 반복
   페이지 로드 시 시작, 체크인 아이콘을 누르면 처음(딜레이)부터 다시
   값은 매 단계마다 다시 읽으므로 인덱스 옵션 카드 변경이 다음 단계부터 바로 반영됨 */
(function () {
    var badge = document.getElementById('checkinBadge');
    var checkin = document.querySelector('.appbar-icon--checkin');
    if (!badge || !window.Motion) return;
    var current = null; /* 진행 중인 모션 */
    var timer = null;   /* 대기 타이머 */
    var runId = 0;      /* 루프 재시작 시 이전 루프 중단용 */

    function cssNumber(name) {
        return parseFloat(getComputedStyle(badge).getPropertyValue(name));
    }

    /* 타이밍(초): 인덱스 옵션 카드 값(--opt-badge-*, ms)이 있으면 그 값, 없으면 type_1.css 기본값 */
    function timing(key) {
        var ms = cssNumber('--opt-badge-' + key);
        return isFinite(ms) ? ms / 1000 : cssNumber('--checkin-badge-' + key);
    }

    /* from → to 로 페이드(linear) + 스케일(spring) 동시 진행 */
    function animateBadge(from, to) {
        current = Motion.animate(badge, { opacity: [from, to], scale: [from, to] }, {
            opacity: { duration: cssNumber('--checkin-badge-fade'), ease: 'linear' },
            scale: {
                type: 'spring',
                stiffness: cssNumber('--checkin-badge-spring-stiffness'),
                damping: cssNumber('--checkin-badge-spring-damping')
            }
        });
        return current.finished;
    }

    function wait(seconds) {
        return new Promise(function (resolve) { timer = setTimeout(resolve, seconds * 1000); });
    }

    async function loop() {
        var id = ++runId;
        await wait(timing('delay'));  /* 최초 딜레이 */
        while (id === runId) {
            await animateBadge(0, 1);                    /* 등장 */
            if (id !== runId) return;
            await wait(timing('hold'));
            if (id !== runId) return;
            await animateBadge(1, 0);                    /* 퇴장 */
            if (id !== runId) return;
            await wait(timing('rest'));
        }
    }

    function restart() {
        runId++;
        clearTimeout(timer);
        if (current) current.stop();
        Motion.animate(badge, { opacity: 0, scale: 0 }, { duration: 0 }); /* 숨긴 상태에서 다시 시작 */
        loop();
    }

    window.playCheckinBadge = restart;
    checkin.addEventListener('click', restart);
    document.fonts.ready.then(restart); /* 폰트 적용 후 시작해 배지 폭이 바뀌지 않게 */
})();
