/* 스크롤 주체: 모바일(터치)은 문서 전체(window) → 사파리 주소창이 줄어듦, PC는 폰 프레임 안 .scroll-area
   common.css 모바일 미디어쿼리와 같은 조건. type_2.js·type_3.js, index.html(휠 넘기기)에서도 사용 */
var pageScroll = (function () {
    var isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
    var scrollArea = document.querySelector('.scroll-area');
    return {
        isTouch: isTouch,
        target: isTouch ? window : scrollArea,
        get: function () { return isTouch ? window.scrollY : scrollArea.scrollTop; },
        set: function (value) {
            if (isTouch) window.scrollTo(0, value);
            else scrollArea.scrollTop = value;
        },
        /* 다른 곳(폰 바깥·index 바탕)에서 받은 휠 이벤트만큼 스크롤 (deltaMode: 0 px / 1 줄 / 2 페이지) */
        scrollByWheel: function (e) {
            var unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1;
            this.set(this.get() + e.deltaY * unit);
            window.dispatchEvent(new Event('pagescroll:wheel')); /* 탑버튼 스프링 스크롤 중단용 */
        }
    };
})();

/* PC: 폰 바깥(바탕·그림자 여백·헤더 등)에서 굴린 세로 휠도 폰 안 스크롤로 넘김. 터치 기기는 문서 스크롤이라 제외 */
(function () {
    if (pageScroll.isTouch) return;
    var scrollArea = document.querySelector('.scroll-area');
    window.addEventListener('wheel', function (e) {
        if (!e.deltaY || scrollArea.contains(e.target)) return; /* 폰 스크롤 영역 안은 브라우저 기본 스크롤 */
        e.preventDefault();
        pageScroll.scrollByWheel(e);
    }, { passive: false });
})();

(function () {
    var header = document.querySelector('.header');
    var navigation = document.querySelector('.navigation');
    var fab = document.querySelector('.fab');
    var fabTop = document.querySelector('.fab-top');

    /* 모바일에서 safe area top 측정: 임시 요소로 env() 실제 px 값을 읽음 */
    var safeAreaTop = 0;
    if (pageScroll.isTouch) {
        var safeDiv = document.createElement('div');
        safeDiv.style.cssText = 'position:fixed;top:0;height:env(safe-area-inset-top,0px);width:1px;pointer-events:none;visibility:hidden;';
        document.body.appendChild(safeDiv);
        safeAreaTop = safeDiv.offsetHeight;
        document.body.removeChild(safeDiv);
    }

    var HEADER_HEIGHT = 88 + safeAreaTop; /* appbar(52) + search-bar(36) + safe-area-top(모바일) */
    var lastScrollTop = 0;

    pageScroll.target.addEventListener('scroll', function () {
        var scrollTop = pageScroll.get();
        var delta = scrollTop - lastScrollTop;

        // 헤더: 스크롤 오프셋에 1:1 직접 추적 (음수 오버스크롤 시 0으로 고정)
        var offset = Math.min(0, Math.max(-HEADER_HEIGHT, -scrollTop));
        header.style.transform = 'translateY(' + offset + 'px)';

        // fab-top: scrollTop 100px 이상이면 페이드인
        fabTop.classList.toggle('is-visible', scrollTop >= 100);

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

/* FAB 탑버튼 */
(function () {
    var fabTop = document.querySelector('.fab-top');
    var scrolling = null;

    function cssNumber(name) {
        return parseFloat(getComputedStyle(fabTop).getPropertyValue(name));
    }

    function stopScrolling() {
        if (scrolling) {
            scrolling.stop();
            scrolling = null;
        }
    }

    fabTop.addEventListener('click', function () {
        stopScrolling();
        scrolling = Motion.animate(pageScroll.get(), 0, {
            type: 'spring',
            stiffness: cssNumber('--fab-top-spring-stiffness'),
            damping: cssNumber('--fab-top-spring-damping'),
            onUpdate: pageScroll.set
        });
    });

    pageScroll.target.addEventListener('touchstart', stopScrolling, { passive: true });
    pageScroll.target.addEventListener('wheel', stopScrolling, { passive: true });
    window.addEventListener('pagescroll:wheel', stopScrolling); /* 폰 바깥·index에서 넘어온 휠 */
})();

/* FAB 최근 본 상품 */
(function () {
    var recent = document.querySelector('.fab-recent');
    var images = recent.querySelectorAll('img');
    if (images.length < 2) return;

    var style = getComputedStyle(recent);
    var HOLD_MS = parseFloat(style.getPropertyValue('--fab-recent-hold')) * 1000; // 이미지 고정 2.5초
    var ROLL_MS = parseFloat(style.getPropertyValue('--fab-recent-roll')) * 1000; // 이미지 전환 0.6초
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

/* 빅배너 */
(function () {
    var BIG_BANNERS = [
        { image: 'src/img/BigBanner_1.jpg', title: '그랜드 오픈 기념\n20% 쿠폰 혜택', subtitle: '무신사 뷰티 홍대' },
        { image: 'src/img/BigBanner_2.jpg', title: '', subtitle: '무탠 슈퍼세일 최대 80% 할인' },
        { image: 'src/img/BigBanner_3.jpg', title: '오늘이 마지막 혜택', subtitle: '아우터 페스티벌' }
    ];
    var BIG_BANNER_TOTAL = 35; /* 인디케이터 뒤 숫자(전체 개수) — 프로토타입용 고정값. 앞 숫자는 실제 현재 배너 번호 */

    var banner = document.querySelector('.big-banner');
    if (!banner || typeof Swiper === 'undefined' || BIG_BANNERS.length === 0) return;

    function createText(className, text) {
        var p = document.createElement('p');
        p.className = className;
        p.textContent = text;
        return p;
    }

    function createSlide(data, index) {
        var slide = document.createElement('div');
        slide.className = 'swiper-slide';
        var img = document.createElement('img');
        img.src = data.image;
        img.alt = data.title || 'Big Banner ' + (index + 1);
        slide.appendChild(img);

        if (data.title || data.subtitle) {
            var text = document.createElement('div');
            text.className = 'big-banner-text';
            if (data.title) text.appendChild(createText('big-banner-title', data.title));
            if (data.subtitle) text.appendChild(createText('big-banner-subtitle', data.subtitle));
            slide.appendChild(text);
        }
        return slide;
    }

    // 배너가 적으면 Swiper 루프가 양옆 슬라이드를 못 채움 → 목록을 반복해 최소 개수 확보
    var MIN_LOOP_SLIDES = 6;
    var wrapper = banner.querySelector('.swiper-wrapper');
    var slideCount = BIG_BANNERS.length > 1
        ? Math.ceil(MIN_LOOP_SLIDES / BIG_BANNERS.length) * BIG_BANNERS.length
        : 1;
    for (var i = 0; i < slideCount; i++) {
        var index = i % BIG_BANNERS.length;
        wrapper.appendChild(createSlide(BIG_BANNERS[index], index));
    }

    // 이미지 인디케이터 (피그마 993:27919): "현재 / 전체" + 화살표. 슬라이드와 같이 움직이지 않고 가운데 배너 우하단에 고정
    var pagination = document.createElement('div');
    pagination.className = 'big-banner-pagination';
    var paginationText = document.createElement('span');
    var paginationIcon = document.createElement('img');
    paginationIcon.src = 'src/img/ic_arrow_right_12.svg';
    paginationIcon.alt = '';
    paginationIcon.width = 12;
    paginationIcon.height = 12;
    pagination.appendChild(paginationText);
    pagination.appendChild(paginationIcon);
    banner.appendChild(pagination);

    function updatePagination(swiper) {
        paginationText.textContent = (swiper.realIndex % BIG_BANNERS.length + 1) + ' / ' + BIG_BANNER_TOTAL;
    }

    var style = getComputedStyle(banner);
    new Swiper(banner, {
        slidesPerView: 'auto',
        centeredSlides: true,
        loop: BIG_BANNERS.length > 1,
        speed: parseFloat(style.getPropertyValue('--big-banner-speed')) * 1000,
        autoplay: BIG_BANNERS.length > 1 && {
            delay: parseFloat(style.getPropertyValue('--big-banner-delay')) * 1000,
            disableOnInteraction: false
        },
        on: {
            init: updatePagination,
            realIndexChange: updatePagination
        }
    });
})();

/* 캠페인 섹션 헤더 로티  */
(function () {
    var container = document.querySelector('.content-lottie');
    if (!container || typeof lottie === 'undefined') return;

    lottie.loadAnimation({
        container: container,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: 'src/lottie/outerfestival.json'
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
