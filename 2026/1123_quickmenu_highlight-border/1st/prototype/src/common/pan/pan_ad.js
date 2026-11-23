/* pan_ad.js — 광고판(판 > 광고) 진입 · 이탈 ('adboardchange', 보내는 곳은 storeheader/storeheader.js의 탭)
   진입 · 이탈 때 스크롤은 맨 위부터 (모바일은 html에도 is-ad-board를 붙여 문서 스크롤을 막음, pan_ad.css)
   배너 노티스 등장: 진입할 때마다 재생. 무신사 스낵바 등장 모션 —
   요소 높이만큼 아래에서 spring.bouncy로 올라오고, 투명도는 0.15s linear로 페이드인 (값은 pan_ad.css 변수)
   필요: common.js (pageScroll), Motion (CDN) */
(function () {
  var phone = document.querySelector('.phone');
  var notice = document.querySelector('.ad-board-notice');
  var isAdBoard = false;
  var entering = null;

  function cssNumber(name) {
    return parseFloat(getComputedStyle(notice).getPropertyValue(name));
  }

  function playNotice() {
    if (!notice) return;
    notice.style.opacity = '0'; /* 모션 시작 전 한 프레임 깜빡임 방지 */
    entering = Motion.animate(notice, { y: [notice.offsetHeight, 0], opacity: [0, 1] }, {
      y: { type: 'spring', stiffness: cssNumber('--ad-notice-spring-stiffness'), damping: cssNumber('--ad-notice-spring-damping') },
      opacity: { duration: cssNumber('--ad-notice-fade'), ease: 'linear' }
    });
  }

  window.addEventListener('adboardchange', function () {
    var active = phone.classList.contains('is-ad-board');
    if (active === isAdBoard) return;
    isAdBoard = active;
    document.documentElement.classList.toggle('is-ad-board', active);
    pageScroll.set(0);

    if (entering) entering.stop();
    entering = null;
    if (active) playNotice();
  });
})();
