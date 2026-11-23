/* campaign.js — 캠페인 섹션 (모양은 campaign.css, 헤더 로티 재생은 common.js 의 [data-lottie])
   플로팅 문구: --campaign-promo-interval마다 다음 문구로 교차 (남은 시간은 고정값, 페이드는 campaign.css) */
(function () {
  [].forEach.call(document.querySelectorAll('.campaign-section-promo'), function (promo) {
    var items = promo.querySelectorAll('.campaign-section-promo-item');
    if (items.length < 2) return;
    var interval = parseFloat(getComputedStyle(promo).getPropertyValue('--campaign-promo-interval')) * 1000;
    var index = 0;

    setInterval(function () {
      items[index].classList.remove('is-active');
      index = (index + 1) % items.length;
      items[index].classList.add('is-active');
    }, interval);
  });
})();
