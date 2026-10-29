/* Type_3 전용 스크립트 (Type_3.html에서 common.js 다음에 로드) */
/* FAB 이벤트(Type_3): 탑버튼이 나오는 100px 이상 스크롤하면 옆으로 숨김, 그 위에서는 전체 노출.
   숨김 중 노출 정도는 스크롤 방향별(내릴 때 / 올릴 때). 이동·회전은 Motion spring.bouncy, 수치는 type_3.css 변수에서 읽음 */
(function () {
  var HIDE_SCROLL_TOP = 100; /* common.js fab-top 노출 기준과 같게 */
  var eventEl = document.querySelector('.fab-event');
  var state = 'full'; /* 'full' | 'down' | 'up' */
  var lastScrollTop = 0;

  function cssNumber(name) {
    return parseFloat(getComputedStyle(eventEl).getPropertyValue(name));
  }

  function hideTarget(direction) {
    var width = cssNumber('--fab-event-w');
    var visible = cssNumber('--fab-event-hide-visible-' + direction);
    var edge = cssNumber('--fab-event-edge-offset');
    return { x: -(width * (1 - visible) + edge), rotate: cssNumber('--fab-event-hide-rotate') };
  }

  function springOptions() {
    return {
      type: 'spring',
      stiffness: cssNumber('--fab-event-hide-spring-stiffness'),
      damping: cssNumber('--fab-event-hide-spring-damping')
    };
  }

  function setState(next) {
    if (next === state) return;
    state = next;
    Motion.animate(eventEl, next === 'full' ? { x: 0, rotate: 0 } : hideTarget(next), springOptions());
  }

  pageScroll.target.addEventListener('scroll', function () { /* pageScroll: common.js */
    var scrollTop = pageScroll.get();
    var delta = scrollTop - lastScrollTop;
    lastScrollTop = scrollTop;

    if (scrollTop < HIDE_SCROLL_TOP) {
      setState('full');
    } else if (delta > 0) {
      setState('down');
    } else if (delta < 0) {
      setState('up');
    }
  }, { passive: true });
})();
