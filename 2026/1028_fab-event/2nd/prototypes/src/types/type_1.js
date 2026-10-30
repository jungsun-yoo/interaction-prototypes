/* Type_1 전용 스크립트 (Type_1.html에서 common.js 다음에 로드) */
/* FAB 이벤트(이미지 디졸브): 제자리에서 시작 → 홀딩 → FAB_roll_1 ↔ FAB_roll_2 디졸브 반복. 우상단 닫기 버튼으로 숨김.
   홀딩·디졸브 시간은 type_1.css 변수에서 읽음. 프로토타입이라 진입할 때마다 재생 */
(function () {
  var eventEl = document.querySelector('.fab-event');

  function cssMs(name) {
    return parseFloat(getComputedStyle(eventEl).getPropertyValue(name)) * 1000; /* '2s' → 2000 */
  }

  /* delay 뒤 디졸브, 이후 hold + duration 간격으로 반복 */
  function dissolveAfter(delay) {
    setTimeout(function () {
      eventEl.classList.toggle('is-next');
      dissolveAfter(cssMs('--fab-event-dissolve-duration') + cssMs('--fab-event-dissolve-hold'));
    }, delay);
  }

  function runTimeline() {
    dissolveAfter(cssMs('--fab-event-dissolve-hold')); /* 랜딩 후 hold만큼 머문 뒤 첫 전환 */
  }

  /* 닫기: 페이드아웃 후 숨김 (프로토타입이라 새로고침하면 다시 나옴) */
  eventEl.querySelector('.fab-event-close').addEventListener('click', function () {
    eventEl.classList.add('is-closed');
  });

  if (document.readyState === 'complete') runTimeline();
  else window.addEventListener('load', runTimeline);
})();
