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

  /* 배지 시점을 알림 → 아래 앱테크 영상이 맞춰 재생 ('checkinbadge', detail: 'hidden' 완전히 사라짐 · 'reappear' 다시 등장) */
  function notify(moment) {
    window.dispatchEvent(new CustomEvent('checkinbadge', { detail: moment }));
  }

  function loop(id, first) {
    if (!first) notify('reappear');
    return animate([0, 1], [0, 1], id)
      .then(function () { return wait(cssNumber('--checkin-badge-show'), id); })
      .then(function () {
        animate([1, 0], [1, 0], id); /* 스프링이 끝나길 기다리지 않음: 투명도가 0이 된 순간 = 완전히 사라짐 */
        return wait(cssNumber('--checkin-badge-fade'), id);
      })
      .then(function () {
        notify('hidden');
        return wait(cssNumber('--checkin-badge-hide'), id);
      })
      .then(function () { return loop(id, false); });
  }

  function start() {
    run += 1;
    var id = run;
    clearTimeout(timer);
    if (animation) animation.stop();
    Motion.animate(badge, { scale: 0, opacity: 0 }, { duration: 0 });
    wait(cssNumber('--checkin-badge-first-delay'), id).then(function () { return loop(id, true); });
  }

  window.addEventListener('storechange', start);
  start();
})();

/* 무신사 스토어: 앱테크 아이콘 영상 2개(무신사 · 광고판용)를 체크인 배지에 맞춰 함께 재생
   랜딩 직후엔 둘 다 첫 프레임에서 멈춤 → 배지가 처음 완전히 사라지면 둘 다 재생 시작, 이후 루프
   영상 길이(_290, 290프레임 ≒ 9.67초) = 배지 한 바퀴(등장 0.52 + 노출 3 + 사라짐 0.15 + 대기 6)
   길이가 소수점이라 조금씩 밀리지 않게, 배지가 사라질 때마다 둘 다 0초로 다시 맞춤. 배지가 다시 등장할 때는 건드리지 않음
   광고판 진입 · 이탈은 투명도만 바꿈(type_1.css) → 재생은 끊기지 않고 두 영상이 같은 시점을 유지
   두 영상은 HTML에 data-manual이 있어 storeheader.js가 건드리지 않음. 다른 전문관은 storeheader.js 그대로 */
(function () {
  var phone = document.querySelector('.phone');
  var videos = [].slice.call(document.querySelectorAll('.appbar-reward-video[data-manual]'));
  if (!videos.length) return;

  function hold() { /* 둘 다 첫 프레임에서 대기 (다른 전문관이면 그냥 멈춤) */
    videos.forEach(function (video) {
      video.pause();
      video.currentTime = 0;
    });
  }

  function playFromStart(event) {
    if (phone.dataset.store !== 'musinsa' || event.detail !== 'hidden') return; /* 배지가 완전히 사라졌을 때만 */
    videos.forEach(function (video) {
      video.currentTime = 0;
      var playing = video.play();
      if (playing) playing.catch(function () {});
    });
  }

  window.addEventListener('storechange', hold);
  window.addEventListener('checkinbadge', playFromStart);
  hold();
})();
