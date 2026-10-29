/* Type_2 전용 스크립트 (Type_2.html에서 common.js 다음에 로드) */
/* FAB 이벤트(Type_2): 기본은 왼쪽으로 숨긴 상태(일부만 노출)
   - 페이지 로드: 화면 왼쪽 밖 → 펼침(enter 스프링) → auto-close 후 자동으로 숨김
   - 스크롤로 상단(hide-scroll-top 미만)에 들어오면: 펼침(peek 시간·이징) → peek-hold 후 숨김 / 상단을 벗어나면 바로 숨김
   - 숨김 중 누르거나 오른쪽으로 끌면 펼침(자동으로 닫히지 않음), 거기서 rehide-distance 이상 스크롤하면 숨김
   수치·스프링은 type_2.css 변수에서 읽음 */
(function () {
  var eventEl = document.querySelector('.fab-event');
  var entered = false;
  var hidden = false;
  var inTop = true; /* 스크롤이 상단 구간(hide-scroll-top 미만)에 있는지 */
  var revealedAt = null; /* 누르기·드래그로 펼친 시점의 스크롤 위치 */
  var anim = null;
  var autoCloseTimer = null;
  var openId = 0; /* 자동 닫힘 예약이 최신 펼침에 대한 것인지 확인 */
  var drag = null; /* 드래그 중: { pointerId, startX, baseX, moved, x } */
  var suppressClick = false; /* 드래그 직후 발생하는 click 무시 */

  function cssNumber(name) {
    return parseFloat(getComputedStyle(eventEl).getPropertyValue(name));
  }

  function spring(prefix) {
    return {
      type: 'spring',
      stiffness: cssNumber('--fab-event-' + prefix + '-spring-stiffness'),
      damping: cssNumber('--fab-event-' + prefix + '-spring-damping')
    };
  }

  /* 화면에 visible 폭만 남기는 x (fab 좌측 패딩만큼 더 밀어야 화면 끝에 맞음) */
  function hideX() {
    return -(eventEl.offsetWidth - cssNumber('--fab-event-hide-visible') + cssNumber('--fab-event-edge-offset'));
  }

  function currentX() {
    return new DOMMatrixReadOnly(getComputedStyle(eventEl).transform).m41;
  }

  /* 상단 복귀 펼침: 시간 + cubic-bezier 이징 (CSS 변수의 cubic-bezier(...)를 숫자 4개로) */
  function peekTransition() {
    var ease = getComputedStyle(eventEl).getPropertyValue('--fab-event-peek-ease').match(/-?[\d.]+/g).map(Number);
    return { duration: cssNumber('--fab-event-peek-duration'), ease: ease };
  }

  /* fromX(없으면 지금 위치)에서 목표 x로 이동 (진행 중인 애니메이션은 멈추고 이어서)
     transition: 스프링 이름('hide' 등) 또는 Motion 옵션 객체 */
  function animateTo(x, transition, fromX) {
    if (anim) anim.stop();
    var options = typeof transition === 'string' ? spring(transition) : transition;
    anim = Motion.animate(eventEl, { x: [fromX === undefined ? currentX() : fromX, x] }, options);
    return anim;
  }

  function cancelAutoClose() {
    clearTimeout(autoCloseTimer);
    autoCloseTimer = null;
    openId++;
  }

  function setHiddenClass(value) {
    hidden = value;
    eventEl.classList.toggle('is-hidden', value); /* 이미지·화살표 전환 (type_2.css) */
  }

  function close() {
    cancelAutoClose();
    if (hidden) return;
    setHiddenClass(true);
    animateTo(hideX(), 'hide');
  }

  /* 펼침. holdVar(CSS 변수 이름)가 있으면 펼침 모션이 끝나고 그 시간 뒤 자동으로 숨김 */
  function open(transition, holdVar, fromX) {
    cancelAutoClose();
    setHiddenClass(false);
    var id = openId;
    animateTo(0, transition, fromX).then(function () {
      if (!holdVar || id !== openId || hidden) return;
      autoCloseTimer = setTimeout(close, cssNumber(holdVar) * 1000);
    });
  }

  function enter() {
    var offscreenX = -(eventEl.offsetWidth + cssNumber('--fab-event-edge-offset'));
    setTimeout(function () {
      entered = true;
      if (inTop) {
        open('enter', '--fab-event-auto-close', offscreenX);
      } else {
        setHiddenClass(true);
        animateTo(hideX(), 'enter', offscreenX);
      }
    }, cssNumber('--fab-event-enter-delay') * 1000);
  }

  function reveal(fromX) {
    revealedAt = pageScroll.get();
    open('reveal', null, fromX); /* 누르기·드래그로 꺼낼 때는 spring.normal, 자동으로 닫히지 않음 */
  }

  eventEl.addEventListener('click', function () {
    if (suppressClick) { suppressClick = false; return; }
    if (hidden && entered) reveal();
  });

  /* 드래그로 꺼내기: 숨김 중 오른쪽으로 끌면 손가락을 따라오고, 놓을 때 drag-reveal 비율 이상이면 펼침 */
  eventEl.addEventListener('pointerdown', function (e) {
    if (!hidden || !entered) return;
    drag = { pointerId: e.pointerId, startX: e.clientX, baseX: currentX(), moved: false, x: currentX() };
    eventEl.setPointerCapture(e.pointerId);
  });

  eventEl.addEventListener('pointermove', function (e) {
    if (!drag || e.pointerId !== drag.pointerId) return;
    var dx = e.clientX - drag.startX;
    if (!drag.moved) {
      if (Math.abs(dx) < cssNumber('--fab-event-drag-start')) return;
      drag.moved = true;
      if (anim) anim.stop();
    }
    var from = hideX();
    var x = Math.min(0, Math.max(from, drag.baseX + dx));
    drag.x = x;
    eventEl.style.transform = 'translateX(' + x + 'px)';
    eventEl.classList.toggle('is-hidden', (x - from) / -from < cssNumber('--fab-event-drag-reveal'));
  });

  function endDrag(e) {
    if (!drag || e.pointerId !== drag.pointerId) return;
    var d = drag;
    drag = null;
    if (!d.moved) return; /* 거의 안 움직였으면 click으로 처리 */
    suppressClick = true;
    setTimeout(function () { suppressClick = false; }, 0); /* click이 안 오는 경우(pointercancel) 대비 */
    var from = hideX();
    if ((d.x - from) / -from >= cssNumber('--fab-event-drag-reveal')) {
      reveal(d.x);
    } else {
      setHiddenClass(true);
      animateTo(from, 'hide', d.x);
    }
  }
  eventEl.addEventListener('pointerup', endDrag);
  eventEl.addEventListener('pointercancel', endDrag);

  pageScroll.target.addEventListener('scroll', function () { /* pageScroll: common.js */
    var scrollTop = pageScroll.get();
    var nowInTop = scrollTop < cssNumber('--fab-event-hide-scroll-top');
    if (nowInTop !== inTop) {
      inTop = nowInTop;
      revealedAt = null;
      if (!entered || drag) return;
      if (inTop) open(peekTransition(), '--fab-event-peek-hold'); /* 상단에 들어오면 0.5s power3 easeOut으로 펼쳤다가 닫힘 */
      else close();
      return;
    }
    if (revealedAt !== null && Math.abs(scrollTop - revealedAt) >= cssNumber('--fab-event-rehide-distance')) {
      revealedAt = null;
      close();
    }
  }, { passive: true });

  inTop = pageScroll.get() < cssNumber('--fab-event-hide-scroll-top');
  if (document.readyState === 'complete') enter();
  else window.addEventListener('load', enter);
})();
