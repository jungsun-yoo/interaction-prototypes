/* Type_2 전용 스크립트 (Type_2.html에서 common.js 다음에 로드) */
/* FAB 이벤트(Type_2) 상태: out(화면 밖) · open(전부 보임) · hide(살짝만 보임, 20%) · peek(좀 더 나옴, 35%)
   out에서 시작 → 0.5초 뒤 open → 3초 유지 → hide.
   이후 스크롤 내리면 hide, 올리면 peek. 인트로(진입~hide) 동안은 스크롤·클릭에 반응하지 않음.
   hide·peek에서 클릭하거나 오른쪽으로 드래그하면 open(spring.normal).
   스크롤로 페이지 상단에 도착하면 open(spring.bouncy), 3초 뒤 hide.
   꺼낸 뒤 3초간 스크롤·반응이 없으면 마지막 숨김 상태로, 그 전에 스크롤하면 스크롤 방향대로 숨김.
   수치는 type_2.css 변수(--fab-event-[상태]-visible / -rotate)에서 읽음 */
(function () {
  var eventEl = document.querySelector('.fab-event');
  var state = 'out'; /* 'out' | 'open' | 'hide' | 'peek' */
  var lastScrollTop = pageScroll.get();
  var introActive = true; /* 인트로 동안 스크롤·클릭 무시 */

  function cssNumber(name) {
    return parseFloat(getComputedStyle(eventEl).getPropertyValue(name));
  }

  function cssMs(name) {
    return cssNumber(name) * 1000; /* '0.5s' → 500 */
  }

  function stateTarget(name) { /* name: 'out' | 'hide' | 'peek' */
    var width = cssNumber('--fab-event-w');
    var visible = cssNumber('--fab-event-' + name + '-visible');
    var edge = cssNumber('--fab-event-edge-offset');
    return { x: -(width * (1 - visible) + edge), rotate: cssNumber('--fab-event-' + name + '-rotate') };
  }

  function springOptions(kind) { /* kind: 'auto'(bouncy) | 'tap'(normal) */
    return {
      type: 'spring',
      stiffness: cssNumber('--fab-event-' + kind + '-spring-stiffness'),
      damping: cssNumber('--fab-event-' + kind + '-spring-damping')
    };
  }

  var anim = null;

  function moveTo(target, kind) {
    if (anim) anim.stop();
    anim = Motion.animate(eventEl, target, springOptions(kind));
  }

  var lastHidden = 'hide'; /* 꺼낸 뒤 돌아갈 마지막 숨김 상태 (hide | peek) */
  var revealTimer = null;

  function setState(next, kind) {
    if (next === state) return;
    clearTimeout(revealTimer);
    state = next;
    if (next === 'hide' || next === 'peek') lastHidden = next;
    moveTo(next === 'open' ? { x: 0, rotate: 0 } : stateTarget(next), kind || 'auto');
  }

  /* 사용자가 꺼낸 뒤 일정 시간 반응이 없으면 마지막 숨김 상태로 */
  var revealAfter = null; /* 꺼낸 뒤 돌아갈 상태를 정해 둔 경우 (상단 도착 → 'hide'), 없으면 lastHidden */

  function startRevealTimer() {
    clearTimeout(revealTimer);
    revealTimer = setTimeout(function () { setState(revealAfter || lastHidden); }, cssMs('--fab-event-reveal-hold'));
  }

  function reveal(kind, after) { /* kind: 'tap'(클릭·드래그, normal) | 'auto'(상단 도착, bouncy) / after: 돌아갈 숨김 상태 */
    revealAfter = after || null;
    setState('open', kind);
    startRevealTimer();
  }

  /* 시작: out에 바로 배치 */
  Motion.animate(eventEl, stateTarget('out'), { duration: 0 });

  /* 인트로: 대기 → open → 유지 → hide */
  var introDelay = cssMs('--fab-event-intro-delay');
  setTimeout(function () { setState('open'); }, introDelay);
  setTimeout(function () {
    introActive = false;
    setState('hide');
  }, introDelay + cssMs('--fab-event-intro-hold'));

  /* hide·peek에서 클릭: open (spring.normal), 3초간 반응 없으면 다시 숨김 */
  var dragged = false;
  eventEl.addEventListener('click', function () {
    if (dragged || introActive) return; /* 드래그 끝의 클릭, 인트로 중 클릭은 무시 */
    reveal('tap');
  });

  /* hide·peek에서 오른쪽으로 드래그: 손가락을 따라 나오고, 놓으면 기준 이상이면 open, 아니면 원래 숨김으로 복귀 */
  var drag = null;
  eventEl.addEventListener('dragstart', function (event) { event.preventDefault(); });

  eventEl.addEventListener('pointerdown', function (event) {
    if (state === 'open' && revealTimer) startRevealTimer(); /* 꺼낸 상태에서 누르면 대기 시간 다시 */
    if (state === 'open' || state === 'out') return;
    var from = stateTarget(state);
    drag = { id: event.pointerId, startX: event.clientX, from: from, x: from.x, lastX: event.clientX, lastT: event.timeStamp, velocity: 0 };
    dragged = false;
    eventEl.setPointerCapture(event.pointerId); /* 보이는 부분이 좁아 손가락이 벗어나도 계속 받음 */
  });

  eventEl.addEventListener('pointermove', function (event) {
    if (!drag || event.pointerId !== drag.id) return;
    var dx = event.clientX - drag.startX;
    if (!dragged) {
      if (Math.abs(dx) < cssNumber('--fab-event-drag-slop')) return;
      dragged = true;
      if (anim) anim.stop();
    }
    var x = drag.from.x + dx;
    if (x > 0) x *= cssNumber('--fab-event-drag-overshoot'); /* 끝을 넘으면 저항 */
    x = Math.max(x, drag.from.x);
    var progress = 1 - Math.min(x, 0) / drag.from.x; /* 0: 숨김 → 1: open */
    var dt = event.timeStamp - drag.lastT;
    if (dt > 0) drag.velocity = (event.clientX - drag.lastX) / dt;
    drag.lastX = event.clientX;
    drag.lastT = event.timeStamp;
    drag.x = x;
    Motion.animate(eventEl, { x: x, rotate: drag.from.rotate * (1 - progress) }, { duration: 0 });
  });

  function endDrag(event) {
    if (!drag || event.pointerId !== drag.id) return;
    var wasDragged = dragged;
    var progress = 1 - Math.min(drag.x, 0) / drag.from.x;
    var flung = drag.velocity > cssNumber('--fab-event-drag-fling-velocity');
    drag = null;
    if (!wasDragged) return;
    setTimeout(function () { dragged = false; }, 0); /* 이어지는 click 무시한 뒤 해제 */
    if (progress >= cssNumber('--fab-event-drag-threshold') || flung) {
      reveal('tap');
    } else {
      moveTo(stateTarget(state), 'tap');
    }
  }
  eventEl.addEventListener('pointerup', endDrag);
  eventEl.addEventListener('pointercancel', endDrag);

  /* index 조절 창에서 변수를 바꾸면 'tune' 이벤트 → 지금 숨김 상태 위치를 바로 다시 맞춤 */
  eventEl.addEventListener('tune', function () {
    if (drag || state === 'open') return;
    if (anim) anim.stop();
    Motion.animate(eventEl, stateTarget(state), { duration: 0 });
  });

  pageScroll.target.addEventListener('scroll', function () { /* pageScroll: common.js */
    var scrollTop = pageScroll.get();
    var delta = scrollTop - lastScrollTop;
    lastScrollTop = scrollTop;
    if (introActive) return;

    if (scrollTop <= cssNumber('--fab-event-top-threshold')) {
      /* 페이지 상단 도착: open, 3초 뒤 hide (iOS 바운스로 생기는 아래 방향 이벤트도 여기서 무시) */
      if (state !== 'open') reveal('auto', 'hide');
    } else if (delta > 0) {
      setState('hide');
    } else if (delta < 0) {
      setState('peek');
    }
  }, { passive: true });
})();
