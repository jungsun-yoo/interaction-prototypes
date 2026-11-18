/* type_3.js — 주문서 · 무배당발 플러스오더 Type 3
   TitleSection 로고 = 로티 (src/lottie/type_3_logo.json, 60fps · 0 ~ 840) — Type 2 와 같은 재생 방식, + 마크가 로고 위로 올라감
   재생: 처음 한 번 0 → loopEnd 까지 재생 → 그다음부터 loopStart ~ loopEnd 구간만 계속 반복
   구간은 로티 마커 이름(loopStart · loopEnd)에서 읽음 → 마커 위치가 바뀌어도 그대로 동작
   동작 줄이기 설정이면 재생하지 않고 loopEnd 프레임(완성된 로고)에 멈춤 */
(function () {
    var box = document.getElementById('plusLogoLottie');
    if (!box || !window.lottie) return;

    var anim = lottie.loadAnimation({
        container: box,
        renderer: 'svg',
        loop: false,
        autoplay: false,
        path: './src/lottie/type_3_logo.json?v=20261118-03'
    });

    function markerFrame(name, fallback) {
        var list = (anim.animationData && anim.animationData.markers) || [];
        for (var i = 0; i < list.length; i++) {
            if (list[i].cm === name) return list[i].tm;
        }
        return fallback;
    }

    anim.addEventListener('DOMLoaded', function () {
        var lastFrame = anim.totalFrames;                       // op (960)
        var loopStart = markerFrame('loopStart', 0);            // 480
        var loopEnd = Math.min(markerFrame('loopEnd', lastFrame - 1) + 1, lastFrame); // 959 → 구간 끝 960

        if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) {
            anim.goToAndStop(loopEnd - 1, true);
            return;
        }

        /* 1회 재생이 끝나면 구간 반복으로 전환 (한 번만) */
        anim.addEventListener('complete', function onFirstDone() {
            anim.removeEventListener('complete', onFirstDone);
            anim.loop = true;
            anim.playSegments([loopStart, loopEnd], true);
        });
        anim.playSegments([0, loopEnd], true);

        window.plusLogoLottie = { anim: anim, loopStart: loopStart, loopEnd: loopEnd };
    });
})();
