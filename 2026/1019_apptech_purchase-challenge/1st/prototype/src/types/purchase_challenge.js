/* purchase_challenge.js — 구매 챌린지 */
// 구매 챌린지 — 주문 금액 · 구매확정 금액 · 단계 게이지 모션
//
// 데이터: challenge.play({ order, confirmed }) — 서버에서 받은 금액만 넘기면 아래가 자동으로 맞춰진다
//   · 회색 게이지 = 주문 금액, 파란 게이지 = 구매확정 금액
//     (단계 금액 간격이 달라서, 단계 아이콘 중심을 기준점으로 구간별 비율로 길이를 계산)
//   · 체크: 구매확정 금액이 도달한 단계 — 파란 게이지가 아이콘 중심을 지나는 순간 팝
//   · 티켓: 구매확정 금액의 다음 단계 — 주문 금액이 그 단계에 도달했을 때만, 파란 게이지 모션이 끝난 뒤 팝
//     예) 주문 50만 · 확정 10만 → 파란 게이지는 2~3단계 사이, 티켓은 3단계(15만)
//   · 초기값은 PurchaseChallenge.html 의 data-target (주문 502,900 / 확정 192,300 — 피그마 게이지 길이에 맞춘 값)
//
// 순서: 0원 홀드(0.25s) → 주문 금액 카운트업 + 회색 게이지(1.0s)
//       └ 0.3s 뒤 구매확정 금액 카운트업 + 파란 게이지 + 체크 팝(1.5s) → 티켓 팝
// 이징은 MDS motion 토큰(mds-motion.js), 숫자 롤링은 amount-counter.js

(function () {
  'use strict';

  const MOTION = {
    order: {
      total: 1000,          // 주문금액 카운트업 + 회색 게이지 전체 길이
      staggerRatio: 0.3,    // 첫 자리 ~ 마지막 자리 시작 간격이 전체에서 차지하는 비율
      widthRatio: 0.7,      // 숫자 폭이 다 넓어지는 시점 (전체 대비)
      commaRatio: 0.15,     // 쉼표가 나타나기 시작하는 시점 (전체 대비)
      easing: mds.motion.ease.css,
      gageEasing: mds.motion.ease.css,
    },
    confirmed: {
      delay: 300,           // 주문 금액 모션 시작 후 이만큼 뒤에 시작
      total: 1500,          // 구매확정 금액 카운트업 + 파란 게이지 전체 길이
      staggerRatio: 0.3,
      widthRatio: 0.7,
      commaRatio: 0.15,
      easing: mds.motion.ease.css,
      gageEasing: mds.motion.power3.easeInOut.css,
    },
    // 체크 팝: 파란 게이지 앞쪽이 아이콘 중심을 지나는 순간 scale 0 → 1 — MDS back.easeOut
    check: {
      duration: 360,
      easing: mds.motion.back.easeOut.css,
    },
    // 티켓 팝: 구매확정 금액 모션이 끝나면 scale 0 → 1 — MDS back.easeOut
    ticket: {
      duration: 360,
      easing: mds.motion.back.easeOut.css,
    },
    // 재생할 때마다 0원 상태로 잠깐 멈췄다가 시작
    startHold: 250,
  };

  // 금액 자릿수로 AmountCounter 타이밍을 계산한다
  function counterTiming(amount, { total, staggerRatio, widthRatio, commaRatio, easing }) {
    const digits = String(Math.max(0, Math.floor(amount))).length;
    const staggerSpan = digits > 1 ? total * staggerRatio : 0;
    return {
      easing,
      stagger: digits > 1 ? staggerSpan / (digits - 1) : 0,
      duration: total - staggerSpan,
      widthDelay: 0,
      widthDuration: total * widthRatio,
      commaDelay: total * commaRatio,
      commaDuration: total * 0.2,
    };
  }

  const els = {
    progress: document.querySelector('.progress'),
    gage: document.querySelector('.progress__gage'),
    orderAmount: document.querySelector('[data-role="order-amount"]'),
    confirmedAmount: document.querySelector('[data-role="confirmed-amount"]'),
    gageBlue: document.querySelector('[data-role="gage-blue"]'),
    gageGray: document.querySelector('[data-role="gage-gray"]'),
    ticket: document.querySelector('[data-role="ticket"]'),
    steps: document.querySelectorAll('.step'),
  };

  const parseAmount = (text) => Number(String(text).replace(/[^0-9]/g, '')) || 0;
  const formatAmount = (value) => Math.round(value).toLocaleString('ko-KR');

  // 금액 데이터 정리 — 0 이상 정수, 구매확정 금액은 주문 금액을 넘지 않는다
  function normalizeAmounts({ order, confirmed }) {
    const toAmount = (value) => Math.max(0, Math.floor(Number(value) || 0));
    const nextOrder = toAmount(order);
    return { order: nextOrder, confirmed: Math.min(toAmount(confirmed), nextOrder) };
  }

  // 목표 금액 — 초기값은 HTML data-target, 서버 데이터는 play() 로 넘긴다
  // (프로토타입 확인용) 인덱스 옵션 카드에서 금액을 바꾸면 <html data-order · data-confirmed> 값이 우선
  const root = document.documentElement;
  const readAmounts = () => normalizeAmounts({
    order: root.dataset.order ?? parseAmount(els.orderAmount.dataset.target),
    confirmed: root.dataset.confirmed ?? parseAmount(els.confirmedAmount.dataset.target),
  });
  let target = readAmounts();

  // 현재 금액 — 최초 0원
  let state = { order: 0, confirmed: 0 };

  // 단계별 기준점: { amount, x } — x 는 게이지 트랙 왼쪽 기준 아이콘 중심(px)
  function stageCenterX(step) {
    const marker = step.firstElementChild.getBoundingClientRect();
    return marker.left + marker.width / 2 - els.gage.getBoundingClientRect().left;
  }

  function getStagePoints() {
    return [...els.steps].map((step) => ({
      amount: Number(step.dataset.amount),
      x: stageCenterX(step),
    }));
  }

  // 금액 → 게이지 길이(px)
  function amountToWidth(amount) {
    const points = getStagePoints();
    const first = points[0];
    const last = points[points.length - 1];
    if (amount <= first.amount) return 0;
    if (amount >= last.amount) return els.gage.clientWidth;

    const end = points.findIndex((p) => amount <= p.amount);
    const from = points[end - 1];
    const to = points[end];
    const ratio = (amount - from.amount) / (to.amount - from.amount);
    return from.x + (to.x - from.x) * ratio;
  }

  // 바는 --gage-start(1단계 아이콘 중심)에서 시작하므로, 끝점 위치에서 시작점을 뺀 만큼이 바 길이
  function barWidth(bar, amount) {
    return Math.max(0, amountToWidth(amount) - bar.offsetLeft);
  }

  function renderGage() {
    els.progress.style.setProperty('--gage-gray', `${barWidth(els.gageGray, state.order)}px`);
    els.progress.style.setProperty('--gage-blue', `${barWidth(els.gageBlue, state.confirmed)}px`);
  }

  function renderAmounts() {
    els.orderAmount.textContent = formatAmount(state.order);
    els.confirmedAmount.textContent = formatAmount(state.confirmed);
  }

  // 금액 즉시 변경 (모션 없이)
  function setAmounts(amounts) {
    state = normalizeAmounts(amounts);
    renderAmounts();
    renderGage();
  }

  // ---------- Motion ----------
  let running = [];
  let playId = 0;

  function stopMotion() {
    running.forEach((item) => item.finish()); // 카운터 · 게이지 모두 finish() 로 끝 상태로 보낸다
    running = [];
  }

  // 게이지 바를 현재 길이에서 목표 금액 길이까지 채운다
  function animateGage(bar, toAmount, { duration, easing }) {
    const from = bar.getBoundingClientRect().width;
    const to = barWidth(bar, toAmount);
    return bar.animate(
      [{ width: `${from}px` }, { width: `${to}px` }],
      { duration, easing, fill: 'both' },
    );
  }

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const popTargets = () => [...document.querySelectorAll('.step__mark'), els.ticket];

  function pop(el, motion) {
    el.animate(
      [{ transform: 'scale(0)' }, { transform: 'scale(1)' }],
      { ...motion, fill: 'forwards' },
    );
  }

  // 게이지 바가 각 단계 아이콘 중심을 지나는 순간 요소를 팝한다 (매 프레임 실제 바 길이로 판정)
  // selector: 단계 안에서 팝할 요소, toAmount: 게이지 목표 금액 — 그 금액 이하 단계만 팝
  function popAlong(bar, { selector, toAmount, motion }, token) {
    const pending = [...els.steps]
      .filter((step) => step.querySelector(selector) && Number(step.dataset.amount) <= toAmount)
      .map((step) => ({ el: step.querySelector(selector), x: stageCenterX(step) }));

    return new Promise((resolve) => {
      const tick = () => {
        if (token !== playId) return resolve();
        const front = bar.offsetLeft + bar.getBoundingClientRect().width; // 바 앞쪽 끝 (트랙 기준)
        while (pending.length && front >= pending[0].x - 0.5) pop(pending.shift().el, motion);
        // fill 로 남아 있는 끝난 애니메이션은 제외하고, 아직 움직이는 중인지로 판단한다
        const moving = bar.getAnimations().some((a) => a.playState === 'running' || a.pending);
        if (pending.length && moving) {
          requestAnimationFrame(tick);
          return;
        }
        pending.splice(0).forEach(({ el }) => pop(el, motion)); // 게이지가 끝까지 닿지 못한 단계 (반올림 오차·0원)
        resolve();
      };
      requestAnimationFrame(tick);
    });
  }

  // 금액 0 → 목표 카운트업 + 게이지 채움 (+ 채우는 동안 실행할 작업)
  async function playAmountIntro({ key, amountEl, bar, motion, during }, token) {
    const counter = new AmountCounter(amountEl, {
      ...counterTiming(target[key], motion),
      amount: target[key],
      fromZero: true,
    });
    const gage = animateGage(bar, target[key], { duration: motion.total, easing: motion.gageEasing });
    // 두 인트로가 겹쳐 돌기 때문에 이 인트로가 만든 것만 따로 관리한다
    const own = [counter, gage];
    running.push(...own);

    const tasks = [counter.play(), gage.finished];
    if (during) tasks.push(during());
    await Promise.all(tasks).catch(() => {});
    if (token !== playId) return false; // 도중에 다시 재생됨

    // 모션 종료 후 실제 상태로 확정 (게이지는 CSS 변수로 넘기고 애니메이션 해제)
    state = { ...state, [key]: target[key] };
    renderGage();
    gage.cancel();
    running = running.filter((item) => !own.includes(item));
    return true;
  }

  // 인트로 1: 주문 금액 + 회색 게이지
  const playOrderIntro = (token) => playAmountIntro({
    key: 'order',
    amountEl: els.orderAmount,
    bar: els.gageGray,
    motion: MOTION.order,
  }, token);

  // 인트로 2: 구매확정 금액 + 파란 게이지 + 체크 팝
  const playConfirmedIntro = (token) => playAmountIntro({
    key: 'confirmed',
    amountEl: els.confirmedAmount,
    bar: els.gageBlue,
    motion: MOTION.confirmed,
    during: () => popAlong(els.gageBlue, {
      selector: '.step__mark', toAmount: target.confirmed, motion: MOTION.check,
    }, token),
  }, token);

  function reset() {
    stopMotion();
    els.gageGray.getAnimations().forEach((a) => a.cancel());
    els.gageBlue.getAnimations().forEach((a) => a.cancel());
    popTargets().forEach((el) => el.getAnimations().forEach((a) => a.cancel()));
    setAmounts({ order: 0, confirmed: 0 });
  }

  // 티켓 단계: 구매확정 금액이 아직 못 간 첫 단계 — 주문 금액이 그 단계에 도달했을 때만 (없으면 null)
  function getTicketStage({ order, confirmed }) {
    const next = [...els.steps].find((step) => Number(step.dataset.amount) > confirmed);
    return next && order >= Number(next.dataset.amount) ? next : null;
  }

  async function playIntro() {
    const token = ++playId;
    reset();

    // 티켓을 이번 데이터의 단계 마커로 옮겨 둔다 (scale 0 상태라 보이지 않음)
    const ticketStage = getTicketStage(target);
    if (ticketStage) ticketStage.querySelector('.step__marker').append(els.ticket);

    await wait(MOTION.startHold);
    if (token !== playId) return;

    playOrderIntro(token);
    await wait(MOTION.confirmed.delay);
    if (token !== playId) return;
    // 티켓은 주문 금액 모션 길이와 상관없이 파란 게이지(구매확정) 모션이 끝나면 등장
    const confirmedDone = await playConfirmedIntro(token);
    if (token !== playId || !confirmedDone) return;

    // 티켓: 파란 게이지 모션이 끝난 뒤 팝
    if (ticketStage) pop(els.ticket, MOTION.ticket);
  }

  // 서버 데이터로 다시 재생 — challenge.play({ order: 500000, confirmed: 100000 })
  function play(amounts = target) {
    target = normalizeAmounts(amounts);
    return playIntro();
  }

  // 화면 너비가 바뀌면 단계 위치가 달라지므로 다시 계산
  new ResizeObserver(renderGage).observe(els.gage);

  // 화면을 탭하면 처음부터 다시 재생 (프로토타입 확인용)
  document.addEventListener('click', (event) => {
    if (event.target.closest('button')) return;
    playIntro();
  });

  // (프로토타입 확인용) 옵션 카드 금액이 바뀌면 그 금액으로 다시 재생
  // 슬라이더를 끄는 동안 계속 다시 시작하지 않도록 마지막 변경 0.25초 뒤 한 번만, 같은 금액이면 건너뜀
  let optionTimer;
  new MutationObserver(() => {
    clearTimeout(optionTimer);
    optionTimer = setTimeout(() => {
      const next = readAmounts();
      if (next.order !== target.order || next.confirmed !== target.confirmed) play(next);
    }, 250);
  }).observe(root, { attributes: true, attributeFilter: ['data-order', 'data-confirmed'] });

  // 폰트가 준비된 뒤 시작 — 숫자 폭을 실제 글꼴로 재야 롤링 칸이 맞는다
  document.fonts.ready.then(playIntro);

  window.challenge = { play };
})();
