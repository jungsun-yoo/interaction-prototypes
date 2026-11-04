/* Type_2 전용 스크립트 (Type_2.html에서 common.js 다음에 로드) */
/* FAB 이벤트(Type_2) 카드 2장. 상태: out(화면 밖) · open(한 자리에 합쳐져 한 장, 두 이미지 페이드 롤링) · hide(겹쳐서 살짝) · peek(겹쳐서 좀 더)
   이동·드래그·그림자는 Type_1과 같고, open일 때만 카드1을 페이드 아웃·인해서 이미지를 번갈아 보여 줌.
   out에서 시작 → 0.5초 뒤 open → 3초 유지 → hide.
   이후 스크롤 내리면 hide, 올리면 peek. 인트로(진입~hide) 동안은 스크롤·클릭에 반응하지 않음.
   hide·peek에서 카드를 클릭하거나 오른쪽으로 드래그하면 open(spring.normal).
   스크롤로 페이지 상단에 도착하면 open(spring.normal, 꺼낸 것처럼), 3초 뒤 hide.
   사용자가 꺼내면(클릭·드래그) 자동으로 숨지 않고, 스크롤할 때까지 open·롤링 유지 → 스크롤 방향대로 숨김.
   수치는 type_2.css 변수(--fab-event-[상태]-[카드]-x / -y / -rotate)에서 읽음 */
(function () {
  var eventEl = document.querySelector('.fab-event');
  var cards = [eventEl.querySelector('.fab-event-card-1'), eventEl.querySelector('.fab-event-card-2')];
  var OPEN = [{ x: 0, y: 0, rotate: 0 }, { x: 0, y: 0, rotate: 0 }];
  var state = 'out'; /* 'out' | 'open' | 'hide' | 'peek' */
  var lastScrollTop = pageScroll.get();
  var introActive = true; /* 인트로 동안 스크롤·클릭 무시 */

  function cssNumber(name) {
    return parseFloat(getComputedStyle(eventEl).getPropertyValue(name));
  }

  function cssMs(name) {
    return cssNumber(name) * 1000; /* '0.5s' → 500 */
  }

  function stateTargets(name) { /* name: 'out' | 'open' | 'hide' | 'peek' → [카드1, 카드2] */
    if (name === 'open') return OPEN;
    return [1, 2].map(function (n) {
      var prefix = '--fab-event-' + name + '-' + n + '-';
      return { x: cssNumber(prefix + 'x'), y: cssNumber(prefix + 'y'), rotate: cssNumber(prefix + 'rotate') };
    });
  }

  function springOptions(kind) { /* kind: 'auto'(bouncy) | 'tap'(normal) */
    return {
      type: 'spring',
      stiffness: cssNumber('--fab-event-' + kind + '-spring-stiffness'),
      damping: cssNumber('--fab-event-' + kind + '-spring-damping')
    };
  }

  var anims = [];

  function stopAnims() {
    anims.forEach(function (anim) { anim.stop(); });
    anims = [];
  }

  /* 카드1 그림자 투명도 = 겹친 정도 (1: hide·peek, 0: open·out). 카드와 같은 스프링으로 움직여 함께 나타나고 사라짐 */
  var shadowAmount = 0;

  function setShadow(amount) {
    shadowAmount = Math.min(Math.max(amount, 0), 1); /* 스프링이 넘쳐도 0~1 */
    eventEl.style.setProperty('--fab-event-shadow-amount', shadowAmount);
  }

  function shadowFor(name) {
    return name === 'hide' || name === 'peek' ? 1 : 0;
  }

  function moveTo(targets, kind, shadow) {
    stopAnims();
    anims = cards.map(function (card, i) { return Motion.animate(card, targets[i], springOptions(kind)); });
    anims.push(Motion.animate(shadowAmount, shadow, Object.assign(springOptions(kind), { onUpdate: setShadow })));
  }

  function placeAt(targets, shadow) {
    cards.forEach(function (card, i) { Motion.animate(card, targets[i], { duration: 0 }); });
    setShadow(shadow);
  }

  /* open 롤링: open에 들어오면 hold 뒤부터 카드1 페이드 토글 반복, open을 벗어나면 멈추고 카드1을 다시 보이게 (겹친 모양) */
  var rollTimer = null;

  function rollAfter(delay) {
    rollTimer = setTimeout(function () {
      eventEl.classList.toggle('is-next');
      rollAfter(cssMs('--fab-event-dissolve-duration') + cssMs('--fab-event-dissolve-hold'));
    }, delay);
  }

  function setRolling(on) {
    clearTimeout(rollTimer);
    if (on) rollAfter(cssMs('--fab-event-dissolve-hold'));
    else eventEl.classList.remove('is-next');
  }

  var lastHidden = 'hide'; /* 꺼낸 뒤 돌아갈 마지막 숨김 상태 (hide | peek) */
  var revealTimer = null;

  function setState(next, kind) {
    if (next === state) return;
    clearTimeout(revealTimer);
    state = next;
    if (next === 'hide' || next === 'peek') lastHidden = next;
    setRolling(next === 'open');
    moveTo(stateTargets(next), kind || 'auto', shadowFor(next));
  }

  /* 사용자가 꺼낸 뒤 일정 시간 반응이 없으면 마지막 숨김 상태로 */
  var revealAfter = null; /* 꺼낸 뒤 돌아갈 상태를 정해 둔 경우 (상단 도착 → 'hide'), 없으면 lastHidden */

  function startRevealTimer() {
    clearTimeout(revealTimer);
    revealTimer = setTimeout(function () { setState(revealAfter || lastHidden); }, cssMs('--fab-event-reveal-hold'));
  }

  function reveal(kind, after) { /* kind: 'tap'(클릭·드래그·상단 도착, normal) | 'auto'(bouncy) / after: 돌아갈 숨김 상태 */
    revealAfter = after || null;
    setState('open', kind);
    if (after) {
      startRevealTimer(); /* 상단 도착: 3초 뒤 hide */
    } else {
      revealTimer = null; /* 사용자가 꺼냄(클릭·드래그): 자동으로 숨지 않고 스크롤할 때까지 open·롤링 유지 */
    }
  }

  /* 시작: out에 바로 배치 */
  placeAt(stateTargets('out'), shadowFor('out'));

  /* 인트로: 대기 → open → 유지 → hide */
  var introDelay = cssMs('--fab-event-intro-delay');
  setTimeout(function () { setState('open'); }, introDelay);
  setTimeout(function () {
    introActive = false;
    setState('hide');
  }, introDelay + cssMs('--fab-event-intro-hold'));

  /* 클릭: open(펼친 상태)이면 링크를 새 창으로 (한 장으로 합쳐지므로 .fab-event의 data-href 하나, Type_2.html),
     hide·peek이면 open (spring.normal), 스크롤할 때까지 유지 */
  var dragged = false;
  eventEl.addEventListener('click', function (event) {
    if (dragged) return; /* 드래그 끝의 클릭은 무시 */
    if (state === 'open') {
      if (eventEl.dataset.href) window.open(eventEl.dataset.href, '_blank', 'noopener');
      return;
    }
    if (introActive) return; /* 인트로 중 클릭은 무시 */
    reveal('tap');
  });

  /* hide·peek에서 오른쪽으로 드래그: 두 카드가 손가락을 따라 open 쪽으로 함께 나오고,
     놓으면 기준 이상이면 open, 아니면 원래 숨김으로 복귀.
     꺼낸 정도(progress)는 카드2의 가로 이동 기준 (0: 숨김 → 1: open) */
  var drag = null;
  eventEl.addEventListener('dragstart', function (event) { event.preventDefault(); });

  function lerp(a, b, t) { return a + (b - a) * t; }

  function dragTargets(from, progress) {
    var clamped = Math.min(progress, 1);
    var over = Math.max(progress - 1, 0) * -from[1].x * cssNumber('--fab-event-drag-overshoot'); /* 끝을 넘으면 저항 */
    return from.map(function (t) {
      return { x: lerp(t.x, 0, clamped) + over, y: lerp(t.y, 0, clamped), rotate: lerp(t.rotate, 0, clamped) };
    });
  }

  eventEl.addEventListener('pointerdown', function (event) {
    if (state === 'open' && revealTimer) startRevealTimer(); /* 꺼낸 상태에서 누르면 대기 시간 다시 */
    if (state === 'open' || state === 'out') return;
    drag = { id: event.pointerId, startX: event.clientX, from: stateTargets(state), progress: 0, lastX: event.clientX, lastT: event.timeStamp, velocity: 0 };
    dragged = false;
    event.target.setPointerCapture(event.pointerId); /* 보이는 부분이 좁아 손가락이 벗어나도 계속 받음 */
  });

  eventEl.addEventListener('pointermove', function (event) {
    if (!drag || event.pointerId !== drag.id) return;
    var dx = event.clientX - drag.startX;
    if (!dragged) {
      if (Math.abs(dx) < cssNumber('--fab-event-drag-slop')) return;
      dragged = true;
      stopAnims();
    }
    drag.progress = Math.max(dx / -drag.from[1].x, 0);
    var dt = event.timeStamp - drag.lastT;
    if (dt > 0) drag.velocity = (event.clientX - drag.lastX) / dt;
    drag.lastX = event.clientX;
    drag.lastT = event.timeStamp;
    placeAt(dragTargets(drag.from, drag.progress), 1 - Math.min(drag.progress, 1)); /* 꺼낸 만큼 그림자 옅어짐 */
  });

  function endDrag(event) {
    if (!drag || event.pointerId !== drag.id) return;
    var wasDragged = dragged;
    var progress = drag.progress;
    var flung = drag.velocity > cssNumber('--fab-event-drag-fling-velocity');
    drag = null;
    if (!wasDragged) return;
    setTimeout(function () { dragged = false; }, 0); /* 이어지는 click 무시한 뒤 해제 */
    if (progress >= cssNumber('--fab-event-drag-threshold') || flung) {
      reveal('tap');
    } else {
      moveTo(stateTargets(state), 'tap', shadowFor(state));
    }
  }
  eventEl.addEventListener('pointerup', endDrag);
  eventEl.addEventListener('pointercancel', endDrag);

  pageScroll.target.addEventListener('scroll', function () { /* pageScroll: common.js */
    var scrollTop = pageScroll.get();
    var delta = scrollTop - lastScrollTop;
    lastScrollTop = scrollTop;
    if (introActive) return;

    if (scrollTop <= cssNumber('--fab-event-top-threshold')) {
      /* 페이지 상단 도착: open, 3초 뒤 hide (iOS 바운스로 생기는 아래 방향 이벤트도 여기서 무시) */
      if (state !== 'open') reveal('tap', 'hide'); /* 꺼낸 것처럼 spring.normal */
    } else if (delta > 0) {
      setState('hide');
    } else if (delta < 0) {
      setState('peek');
    }
  }, { passive: true });
})();
