/* bigbanner.js — 빅배너: 슬라이드 무한 롤링 (속도·대기는 bigbanner.css의 --big-banner-speed · --big-banner-delay)
   배너 내용은 아래 BIG_BANNERS만 바꾸면 됨 / 필요: Swiper 11 (CDN) */
(function () {
  var BIG_BANNERS = [
    /* 무신사 홈 추천 빅배너 맨 앞 3개 (2026-11-15 musinsa.com 기준) */
    { image: 'src/img/banner/BigBanner_1.jpg', title: '겨울 슈즈 브랜드\n최대 30% 쿠폰', subtitle: '스부, 크록스 외' },
    { image: 'src/img/banner/BigBanner_2.jpg', title: '그랜드 오픈 기념\n20% 쿠폰 혜택', subtitle: '무신사 뷰티 성수' },
    { image: 'src/img/banner/BigBanner_3.jpg', title: '무배당발 인기 패딩\n최대 50% 할인', subtitle: '함께 만나는 플러스오더 혜택' }
  ];
  var BIG_BANNER_TOTAL = 34; /* 인디케이터 뒤 숫자: 프로토타입용 고정값. 앞 숫자는 실제 현재 배너 번호 */
  var MIN_LOOP_SLIDES = 6;   /* 배너가 적으면 루프가 양옆 슬라이드를 못 채움 → 목록을 반복해 최소 개수 확보 */

  var banner = document.querySelector('.big-banner');
  if (!banner || typeof Swiper === 'undefined') return;
  var wrapper = banner.querySelector('.swiper-wrapper');

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
    img.alt = data.title || data.subtitle || 'Big Banner ' + (index + 1);
    slide.appendChild(img);

    var text = document.createElement('div');
    text.className = 'big-banner-text';
    if (data.title) text.appendChild(createText('big-banner-title', data.title));
    if (data.subtitle) text.appendChild(createText('big-banner-subtitle', data.subtitle));
    slide.appendChild(text);
    return slide;
  }

  var slideCount = Math.ceil(MIN_LOOP_SLIDES / BIG_BANNERS.length) * BIG_BANNERS.length;
  for (var i = 0; i < slideCount; i++) {
    wrapper.appendChild(createSlide(BIG_BANNERS[i % BIG_BANNERS.length], i % BIG_BANNERS.length));
  }

  /* 인디케이터: "현재 / 전체" + 화살표. 슬라이드와 함께 움직이지 않고 가운데 배너 우하단에 고정 */
  var pagination = document.createElement('div');
  pagination.className = 'big-banner-pagination';
  var paginationText = document.createElement('span');
  var paginationIcon = document.createElement('img');
  paginationIcon.src = 'src/img/banner/ic_arrow_right_12.svg';
  paginationIcon.alt = '';
  paginationIcon.width = 12;
  paginationIcon.height = 12;
  pagination.appendChild(paginationText);
  pagination.appendChild(paginationIcon);

  /* 키즈 전용 플러스 아이콘 (보임 여부는 bigbanner.css) */
  var paginationPlus = document.createElement('div');
  paginationPlus.className = 'big-banner-plus';
  paginationPlus.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 3.2V12.8M3.2 8H12.8" stroke="#FF5F00" stroke-width="1.3"/></svg>';
  pagination.appendChild(paginationPlus);
  banner.appendChild(pagination);

  function updatePagination(swiper) {
    paginationText.textContent = (swiper.realIndex % BIG_BANNERS.length + 1) + ' / ' + BIG_BANNER_TOTAL;
  }

  var style = getComputedStyle(banner);
  var swiper = new Swiper(banner, {
    slidesPerView: 'auto',
    centeredSlides: true,
    loop: true,
    speed: parseFloat(style.getPropertyValue('--big-banner-speed')) * 1000,
    autoplay: {
      delay: parseFloat(style.getPropertyValue('--big-banner-delay')) * 1000,
      disableOnInteraction: false
    },
    on: {
      init: updatePagination,
      realIndexChange: updatePagination
    }
  });

  /* 광고판에서 돌아올 때: 숨겨진 동안 창 크기가 바뀌었을 때 대비 */
  var phone = document.querySelector('.phone');
  var isAdBoard = false;
  window.addEventListener('adboardchange', function () {
    var active = phone.classList.contains('is-ad-board');
    if (active === isAdBoard) return;
    isAdBoard = active;
    if (!active) swiper.update();
  });
})();
