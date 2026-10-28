(function () {
    var scrollArea = document.querySelector('.scroll-area');
    var header = document.querySelector('.header');
    var navigation = document.querySelector('.navigation');
    var fab = document.querySelector('.fab');
    var fabTop = document.querySelector('.fab-top');

    /* 모바일에서 safe area top 측정: 임시 요소로 env() 실제 px 값을 읽음 */
    var safeAreaTop = 0;
    if (window.innerWidth <= 429) {
        var safeDiv = document.createElement('div');
        safeDiv.style.cssText = 'position:fixed;top:0;height:env(safe-area-inset-top,0px);width:1px;pointer-events:none;visibility:hidden;';
        document.body.appendChild(safeDiv);
        safeAreaTop = safeDiv.offsetHeight;
        document.body.removeChild(safeDiv);
    }

    var HEADER_HEIGHT = 88 + safeAreaTop; /* appbar(52) + search-bar(36) + safe-area-top(모바일) */
    var lastScrollTop = 0;
    var currentOffset = 0;

    scrollArea.addEventListener('scroll', function () {
        var scrollTop = this.scrollTop;
        var delta = scrollTop - lastScrollTop;

        // 헤더: 스크롤 오프셋에 1:1 직접 추적 (음수 오버스크롤 시 0으로 고정)
        var offset = Math.min(0, Math.max(-HEADER_HEIGHT, -scrollTop));
        header.style.transform = 'translateY(' + offset + 'px)';

        // fab-top: scrollTop 100px 이상이면 페이드인
        if (scrollTop >= 100) {
        fabTop.classList.add('is-visible');
        } else {
        fabTop.classList.remove('is-visible');
        }

        if (scrollTop <= 0) {
        navigation.style.opacity = '1';
        fab.classList.remove('is-hidden');
        lastScrollTop = 0;
        return;
        }

        if (delta > 0) {
        // 스크롤 다운: navigation 페이드아웃, fab 내려감
        navigation.style.opacity = '0';
        fab.classList.add('is-hidden');
        } else {
        // 스크롤 업: navigation 페이드인, fab 올라옴
        navigation.style.opacity = '1';
        fab.classList.remove('is-hidden');
        }

        lastScrollTop = scrollTop;
    }, { passive: true });
})();

/* 최근 본 상품: 고정(hold) → 위로 롤링(roll) 무한 반복. 시간은 style.css .fab-recent 변수 */
(function () {
    var recent = document.querySelector('.fab-recent');
    var images = recent.querySelectorAll('img');
    if (images.length < 2) return;

    var style = getComputedStyle(recent);
    var HOLD_MS = parseFloat(style.getPropertyValue('--fab-recent-hold')) * 1000;
    var ROLL_MS = parseFloat(style.getPropertyValue('--fab-recent-roll')) * 1000;
    var index = 0;

    function roll() {
        var current = images[index];
        index = (index + 1) % images.length;
        var next = images[index];

        // 이전에 위로 나간 이미지를 transition 없이 아래 대기 위치로 되돌린 뒤 진입
        next.classList.add('is-instant');
        next.classList.remove('is-leaving');
        void next.offsetHeight;
        next.classList.remove('is-instant');

        current.classList.remove('is-current');
        current.classList.add('is-leaving');
        next.classList.add('is-current');

        setTimeout(roll, ROLL_MS + HOLD_MS);
    }

    setTimeout(roll, HOLD_MS);
})();

/* 아우터 페스티벌 로티: 자동재생 + 루핑 (lottie_svg를 script.js보다 먼저 로드) */
(function () {
    var container = document.querySelector('.content-lottie');
    if (!container || typeof lottie === 'undefined') return;

    lottie.loadAnimation({
        container: container,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: 'src/img/outerfestival.json'
    });
})();

/* 이미지 드래그·롱프레스 메뉴 방지: CSS로 안 막히는 브라우저(Firefox, Android Chrome) 대응 */
(function () {
    function blockOnImage(e) {
        if (e.target.tagName === 'IMG') e.preventDefault();
    }
    document.addEventListener('dragstart', blockOnImage);
    document.addEventListener('contextmenu', blockOnImage);
})();
