/* Type 1 전용 동작
   각 영역(앱바 · 헤더 · 빅배너 · 퀵메뉴 · 캠페인 섹션 · 광고판 · FAB · 바텀네비 등)은 src/common/영역.js */

/* 앱바 체크인 "이벤트" 배지 모션 (모양 · 시간 값은 type_1.css 변수)
   랜딩 1초 후 등장(scale 0→1 mds.spring.bouncy + opacity 0→1 0.15s linear)
   → 등장 모션이 끝나고 3초 노출 → 사라짐(scale 1→0 spring.bouncy + opacity 1→0 0.15s linear)
   → 완전히 사라진 뒤 6초 후 다시 등장, 반복. 중심점은 배지 좌하단
   처음 열 때 · 전문관이 바뀔 때('storechange') 처음부터 다시
   필요: Motion (CDN) */
(function () {
  var badge = document.getElementById('checkinBadge');
  if (!badge || !window.Motion) return;

  var run = 0;        /* 다시 시작하면 이전 순서를 버리기 위한 번호 */
  var animation = null;
  var timer = null;

  function cssNumber(name) {
    return parseFloat(getComputedStyle(badge).getPropertyValue(name));
  }

  function wait(seconds, id) {
    return new Promise(function (resolve) {
      timer = setTimeout(function () { if (id === run) resolve(); }, seconds * 1000);
    });
  }

  function animate(scale, opacity, id) {
    animation = Motion.animate(badge, { scale: scale, opacity: opacity }, {
      scale: { type: 'spring', stiffness: cssNumber('--checkin-badge-spring-stiffness'), damping: cssNumber('--checkin-badge-spring-damping') },
      opacity: { duration: cssNumber('--checkin-badge-fade'), ease: 'linear' }
    });
    return animation.then(function () {
      if (id !== run) return new Promise(function () {}); /* 다시 시작됐으면 여기서 멈춤 */
    });
  }

  function loop(id) {
    return animate([0, 1], [0, 1], id)
      .then(function () { return wait(cssNumber('--checkin-badge-show'), id); })
      .then(function () {
        animate([1, 0], [1, 0], id); /* 스프링이 끝나길 기다리지 않음: 투명도가 0이 된 순간 = 완전히 사라짐 */
        return wait(cssNumber('--checkin-badge-fade') + cssNumber('--checkin-badge-hide'), id);
      })
      .then(function () { return loop(id); });
  }

  function start() {
    run += 1;
    var id = run;
    clearTimeout(timer);
    if (animation) animation.stop();
    Motion.animate(badge, { scale: 0, opacity: 0 }, { duration: 0 });
    wait(cssNumber('--checkin-badge-first-delay'), id).then(function () { return loop(id); });
  }

  window.addEventListener('storechange', start);
  start();
})();
