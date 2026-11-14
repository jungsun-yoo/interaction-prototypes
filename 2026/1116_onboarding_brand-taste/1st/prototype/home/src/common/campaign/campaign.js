/* campaign.js — 캠페인 섹션 (모양은 campaign.css)
   헤더 로티: 섹션마다 data-lottie 파일을 자동재생 · 무한루프
   플로팅 문구: --campaign-promo-interval마다 다음 문구로 교차 (남은 시간은 고정값, 페이드는 campaign.css)
   필요: common.js (playLottie), lottie-web */
(function () {
  [].forEach.call(document.querySelectorAll('.campaign-section-lottie'), function (container) {
    playLottie(container, container.dataset.lottie);
  });

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
