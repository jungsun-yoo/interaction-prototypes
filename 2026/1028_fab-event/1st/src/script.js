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

/* 이미지 드래그·롱프레스 메뉴 방지: CSS로 안 막히는 브라우저(Firefox, Android Chrome) 대응 */
(function () {
    function blockOnImage(e) {
        if (e.target.tagName === 'IMG') e.preventDefault();
    }
    document.addEventListener('dragstart', blockOnImage);
    document.addEventListener('contextmenu', blockOnImage);
})();
