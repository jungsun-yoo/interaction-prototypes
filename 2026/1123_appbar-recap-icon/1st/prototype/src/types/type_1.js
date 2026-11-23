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
            var exit = animateBadge(1, 0);               /* 퇴장 */
            await wait(cssNumber('--checkin-badge-fade'));
            if (id !== runId) return;
            notify('hidden');                            /* 투명도 0 = 완전히 사라짐 → 앱테크 로티 재생 시작 */
            await exit;
            if (id !== runId) return;
            await wait(timing('rest'));
        }
    }

    /* 배지 시점을 알림 → 아래 앱테크 로티가 맞춰 재생 ('checkinbadge', detail: 'restart' 처음부터 · 'hidden' 완전히 사라짐) */
    function notify(moment) {
        window.dispatchEvent(new CustomEvent('checkinbadge', { detail: moment }));
    }

    function restart() {
        notify('restart');
        runId++;
        clearTimeout(timer);
        if (current) current.stop();
        Motion.animate(badge, { opacity: 0, scale: 0 }, { duration: 0 }); /* 숨긴 상태에서 다시 시작 */
        loop();
    }

    /* 뱃지 문구: 인덱스 옵션 카드 '문구' (<html data-badge-text="event | 2026 | log | recap">)
       문구가 바뀌면 글자를 바꾸고 배지를 처음(딜레이)부터 다시 재생 */
    var BADGE_TEXT = { event: '이벤트', '2026': '2026', log: '쇼핑로그', recap: 'RECAP' };
    function applyText() {
        var text = BADGE_TEXT[document.documentElement.getAttribute('data-badge-text')] || BADGE_TEXT.event;
        if (badge.textContent === text) return false;
        badge.textContent = text;
        placeBadge();
        return true;
    }

    /* 배지 위치: 기본은 아이콘 칸 왼쪽에서 15px. 오른쪽 끝은 "이벤트" 배지의 끝(15 + 27 = 42px)이 최대
       문구가 길어 42px를 넘으면 넘는 만큼 왼쪽으로 옮겨 오른쪽 끝을 42px에 맞춤 (폭은 스케일과 무관한 offsetWidth) */
    var BADGE_LEFT = 15;
    var BADGE_MAX_RIGHT = 42;
    function placeBadge() {
        badge.style.left = Math.min(BADGE_LEFT, BADGE_MAX_RIGHT - badge.offsetWidth) + 'px';
    }
    applyText();
    new MutationObserver(function () { if (applyText()) restart(); })
        .observe(document.documentElement, { attributes: true, attributeFilter: ['data-badge-text'] });

    window.playCheckinBadge = restart;
    checkin.addEventListener('click', restart);
    document.fonts.ready.then(function () { placeBadge(); restart(); }); /* 폰트 적용 후 폭을 재서 위치를 잡고 시작 */
})();

/* 앱테크 아이콘 로티 (26-1105 앱테크진입점모션 2nd 와 같은 규칙)
   랜딩 직후엔 첫 프레임에서 멈춤 → 배지가 완전히 사라지면 0프레임부터 재생, 이후 루프
   로티 길이(291프레임 ≒ 9.7초) ≒ 배지 한 바퀴. 밀리지 않게 배지가 사라질 때마다 0프레임부터 다시 재생
   필요: lottie-web (CDN) */
(function () {
    var container = document.getElementById('rewardLottie');
    if (!container || !window.lottie) return;
    var animation = lottie.loadAnimation({
        container: container,
        renderer: 'svg',
        loop: true,
        autoplay: false,
        path: 'src/lottie/ic_appbar_apptech_white.json?v=20261123-09'
    });
    animation.addEventListener('DOMLoaded', function () {
        container.parentNode.classList.add('is-lottie');
        animation.goToAndStop(0, true);
    });
    window.addEventListener('checkinbadge', function (event) {
        if (!animation.isLoaded) return;
        if (event.detail === 'hidden') animation.goToAndPlay(0, true);
        else animation.goToAndStop(0, true);
    });
})();
