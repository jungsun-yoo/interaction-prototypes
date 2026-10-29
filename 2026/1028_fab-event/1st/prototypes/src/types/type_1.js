/* Type_1 전용 스크립트 (Type_1.html에서 common.js 다음에 로드) */
/* FAB 이벤트(로티): 왼쪽 밖 → 등장 → 2초 홀딩 → 1회 재생 → loopStart~loopEnd 반복. 프로토타입이라 진입할 때마다 재생 */
(function () {
  var ENTER_DELAY_MS = 500; /* 랜딩 후 등장 시작까지 */
  var ENTER_MS = 500; /* 등장 시간 — type_1.css transition과 같게 */
  var HOLD_MS = 2000; /* 등장 완료 후 로티 재생까지 */
  var eventEl = document.querySelector('.fab-event');

  var anim = lottie.loadAnimation({
    container: eventEl,
    renderer: 'svg',
    loop: false,
    autoplay: false,
    path: 'src/lottie/FAB_1.json'
  });

  function markerFrame(name) {
    var marker = (anim.animationData.markers || []).filter(function (m) { return m.cm === name; })[0];
    return marker ? marker.tm : null;
  }

  function loopBetweenMarkers() {
    var start = markerFrame('loopStart');
    var end = markerFrame('loopEnd');
    if (start === null || end === null) return;
    anim.loop = true;
    anim.playSegments([start, end], true);
  }

  function runTimeline() {
    anim.goToAndStop(0, true);
    setTimeout(function () {
      eventEl.classList.add('is-entered');
      setTimeout(function () {
        anim.addEventListener('complete', loopBetweenMarkers);
        anim.play();
      }, ENTER_MS + HOLD_MS);
    }, ENTER_DELAY_MS);
  }

  var pageLoaded = document.readyState === 'complete';
  var lottieLoaded = false;
  function startWhenReady() {
    if (pageLoaded && lottieLoaded) runTimeline();
  }
  window.addEventListener('load', function () { pageLoaded = true; startWhenReady(); });
  anim.addEventListener('DOMLoaded', function () { lottieLoaded = true; startWhenReady(); });
})();
