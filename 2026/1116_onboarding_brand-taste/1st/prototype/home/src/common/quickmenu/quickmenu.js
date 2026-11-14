/* quickmenu.js — 2줄 퀵메뉴 스크롤 보간
   스크롤 길이는 짧은 줄 기준이고, 긴 줄은 진행률만큼 더 이동해 양끝이 항상 맞음.
   짧은 줄이 화면에 다 들어와 스크롤이 없으면 긴 줄 기준으로 스크롤.
   이미지가 1장인 퀵메뉴(하이라이트 · 1줄)는 보간 없이 그냥 스크롤
   전문관 · 광고판 · 창 크기가 바뀌면 다시 계산 */
(function () {
  var scrollers = [].filter.call(document.querySelectorAll('.quick-menu'), function (scroller) {
    return scroller.querySelectorAll('img').length > 1;
  });

  function setup(scroller) {
    var rows = scroller.querySelector('.quick-menu-rows');
    var images = rows.querySelectorAll('img');
    var style = getComputedStyle(rows);
    var padding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
    var widths = [].map.call(images, function (image) { return parseFloat(image.getAttribute('width')); });
    var viewWidth = scroller.clientWidth;
    if (!viewWidth) return; /* 다른 전문관이라 숨겨진 상태 */

    var shortest = Math.min.apply(null, widths) + padding;
    var longest = Math.max.apply(null, widths) + padding;
    var contentWidth = shortest > viewWidth ? shortest : longest;
    rows.style.width = contentWidth + 'px';

    scroller.quickMenu = {
      images: images,
      maxScroll: Math.max(0, contentWidth - viewWidth),
      rowMax: widths.map(function (width) { return Math.max(0, width + padding - viewWidth); })
    };
    update(scroller);
  }

  function update(scroller) {
    var state = scroller.quickMenu;
    if (!state) return;
    var scrollLeft = Math.min(Math.max(scroller.scrollLeft, 0), state.maxScroll); /* iOS 고무줄 스크롤 구간 제외 */
    var progress = state.maxScroll ? scrollLeft / state.maxScroll : 0;
    [].forEach.call(state.images, function (image, index) {
      image.style.transform = 'translateX(' + (scrollLeft - progress * state.rowMax[index]) + 'px)';
    });
  }

  function refresh() {
    scrollers.forEach(setup);
  }

  scrollers.forEach(function (scroller) {
    scroller.addEventListener('scroll', function () { update(scroller); }, { passive: true });
  });
  window.addEventListener('resize', refresh);
  window.addEventListener('storechange', refresh);
  window.addEventListener('adboardchange', refresh);
  refresh();
})();
