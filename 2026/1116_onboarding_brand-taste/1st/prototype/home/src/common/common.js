/* 스크롤 주체: 모바일(터치)은 문서 전체(window) → 사파리 주소창이 줄어듦, PC는 폰 프레임 안 .scroll-area
   common.css 모바일 미디어쿼리와 같은 조건. type_1.js, index.html(폰 바깥 휠 넘기기)에서 window.pageScroll을 사용 */
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

/* 스크롤 방향: 맨 위('top') · 내림('down') · 올림('up')을 알려줌 (bottomnavi.js) */
function onScrollDirection(callback) {
    var lastScrollTop = 0;
    pageScroll.target.addEventListener('scroll', function () {
        var scrollTop = pageScroll.get();
        if (scrollTop <= 0) {
            lastScrollTop = 0;
            callback('top', scrollTop);
            return;
        }
        callback(scrollTop - lastScrollTop > 0 ? 'down' : 'up', scrollTop);
        lastScrollTop = scrollTop;
    }, { passive: true });
}

/* 로티 공통: src/lottie/파일.json을 자동재생 · 무한루프 (lottie-web CDN 필요) */
function playLottie(container, file) {
    return lottie.loadAnimation({
        container: container,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: 'src/lottie/' + file + '.json'
    });
}

/* PC: 폰 바깥(바탕·그림자 여백·헤더 등)에서 굴린 세로 휠도 폰 안 스크롤로 넘김. 터치 기기는 문서 스크롤이라 제외 */
(function () {
    var scrollArea = document.querySelector('.scroll-area');
    if (pageScroll.isTouch || !scrollArea) return;
    window.addEventListener('wheel', function (e) {
        if (!e.deltaY || scrollArea.contains(e.target)) return; /* 폰 스크롤 영역 안은 브라우저 기본 스크롤 */
        e.preventDefault();
        pageScroll.scrollByWheel(e);
    }, { passive: false });
})();

/* 페이지 제목: 인덱스(../index.html) CONFIG.title을 그대로 씀 → 브라우저 탭·홈 화면에 추가 기본 이름
   인덱스 안 iframe이면 부모 CONFIG를 바로 읽고, 혼자 열리면(모바일·깃헙 페이지) index.html을 읽어 title 값만 꺼냄
   실패하면 Type_N.html의 <title> 그대로 */
(function () {
    function apply(title) {
        if (!title) return;
        document.title = title;
        var meta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
        if (meta) meta.setAttribute('content', title);
    }
    try {
        if (window.parent !== window && window.parent.CONFIG) { apply(window.parent.CONFIG.title); return; }
    } catch (e) { /* 다른 출처면 부모를 못 읽음 → 아래에서 파일로 읽기 */ }
    if (!window.fetch || document.documentElement.classList.contains('is-embed')) return; /* 취향선택브랜드 iframe 안: 인덱스가 두 단계 위라 읽지 않음 */
    fetch('../index.html', { cache: 'no-cache' })
        .then(function (res) { return res.ok ? res.text() : ''; })
        .then(function (html) {
            var match = html.match(/var CONFIG = \{[\s\S]*?\btitle:\s*'([^']*)'/);
            if (match) apply(match[1]);
        })
        .catch(function () {});
})();

/* 전문관 전환: .phone의 data-store를 바꾸고 'storechange' 이벤트를 보냄 → 각 영역(storeheader · quickmenu 등)이 알아서 바뀜
   처음 전문관은 주소의 ?store=값 → 없으면 HTML의 data-store. index.html 버튼은 window.setStore를 호출
   영역 js는 이 뒤에 불러오고, 불러올 때 지금 data-store로 그려 둠 */
(function () {
  var STORES = ['musinsa', 'beauty', 'sports', 'outlet', 'kids', 'boutique', 'kicks', 'used'];
  var phone = document.querySelector('.phone');

  function setStore(store) {
    if (STORES.indexOf(store) === -1) return;
    phone.dataset.store = store;
    window.dispatchEvent(new Event('storechange'));
  }

  window.setStore = setStore;

  var requested = new URLSearchParams(location.search).get('store');
  if (STORES.indexOf(requested) !== -1 && requested !== phone.dataset.store) setStore(requested);
})();
