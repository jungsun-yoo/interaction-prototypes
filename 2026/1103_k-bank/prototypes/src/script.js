// start가 있으면 해당 위치에서 재생하고, 없으면 자동 재생합니다. loop는 반복 여부만 결정합니다.
const sectionLotties = [
    { id: 'section_01', file: 'appIcons.json', loop: true },
    { id: 'section_02', file: 'benefit.json', loop: false, start: 'center 90%' },
    { id: 'section_03', file: 'specialcard.json', loop: true },
    { id: 'section_04', file: 'cashback.json', loop: false, start: '80% 90%'},
    { id: 'section_05', file: 'graph.json', loop: false, start: 'center 90%', renderer: 'canvas' },
    { id: 'section_06', file: 'percent.json', loop: false, start: '75% 80%' },
    { id: 'section_07', file: 'everyday.json', loop: false, start: '70% 90%' },
    { id: 'section_08', file: 'checkcard.json', loop: false, start: '70% 90%' },
];
const sectionAnimations = new Map();
const sectionControllers = new Map();

/* 스크롤 주체: 모바일(터치)은 문서 전체(window), PC는 폰 프레임 안 .scroll-area
   style.css 미디어쿼리와 같은 조건. ../index.html(바탕 휠 넘기기)에서도 사용 */
var pageScroll = (function () {
    var isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
    var scrollArea = document.querySelector('.scroll-area');
    return {
        isTouch: isTouch,
        target: isTouch ? window : scrollArea,
        get: function () { return isTouch ? window.scrollY : scrollArea.scrollTop; },
        set: function (value) {
            if (isTouch) window.scrollTo(0, value);
            else scrollArea.scrollTop = value;
        },
        /* 다른 곳(폰 바깥·index 바탕)에서 받은 휠 이벤트만큼 스크롤 (deltaMode: 0 px / 1 줄 / 2 페이지) */
        scrollByWheel: function (e) {
            var unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1;
            this.set(this.get() + e.deltaY * unit);
        }
    };
})();

/* PC: 폰 바깥(그림자 여백·리셋 버튼 등)에서 굴린 세로 휠도 폰 안 스크롤로 넘김 */
if (!pageScroll.isTouch) {
    window.addEventListener('wheel', (e) => {
        if (!e.deltaY || pageScroll.target.contains(e.target)) return;
        e.preventDefault();
        pageScroll.scrollByWheel(e);
    }, { passive: false });
}

gsap.registerPlugin(ScrollTrigger);
// PC에서는 트리거 위치를 .scroll-area 스크롤 기준으로 계산합니다.
if (!pageScroll.isTouch) ScrollTrigger.defaults({ scroller: pageScroll.target });

// 같은 프레임의 여러 로딩 완료 알림은 한 번의 위치 재계산으로 모읍니다.
let scrollTriggerRefreshFrame = null;
function queueScrollTriggerRefresh() {
    if (scrollTriggerRefreshFrame !== null) return;
    scrollTriggerRefreshFrame = requestAnimationFrame(() => {
        scrollTriggerRefreshFrame = null;
        ScrollTrigger.refresh();
    });
}

function watchSectionImages() {
    document.querySelectorAll('main img').forEach((image) => {
        if (image.complete) {
            queueScrollTriggerRefresh();
            return;
        }
        function onSettled() {
            image.removeEventListener('load', onSettled);
            image.removeEventListener('error', onSettled);
            queueScrollTriggerRefresh();
        }
        image.addEventListener('load', onSettled);
        image.addEventListener('error', onSettled);
    });
}

function initSectionLottie(config) {
    const container = document.getElementById(config.id);
    if (!container || sectionAnimations.has(config.id)) return;

    const hasTrigger = config.start != null && config.start !== '';
    const animation = lottie.loadAnimation({
        container,
        renderer: config.renderer ?? 'svg',
        loop: config.loop,
        autoplay: !hasTrigger,
        path: `./src/lottie/${config.file}`
    });
    sectionAnimations.set(config.id, animation);

    let ready = false;
    let started = false;
    let trigger = null;
    let resetPending = false;

    function killTrigger() {
        if (trigger) trigger.kill();
        trigger = null;
    }

    function playOnce() {
        if (started) return;
        started = true;
        animation.play();
    }

    function armTrigger() {
        if (!ready || !hasTrigger) return;
        killTrigger();
        trigger = ScrollTrigger.create({
            id: config.id.replace(/^section_/, ''),
            trigger: container,
            start: config.start,
            markers: config.markers ?? false,
            once: true,
            onEnter: playOnce
        });
        // 로딩 전에 시작 위치를 지났거나 스크롤 위치가 복원된 경우도 처리합니다.
        if (trigger.scroll() >= trigger.start) {
            playOnce();
            killTrigger();
        }
    }

    function resetAnimation() {
        started = false;
        if (!ready) {
            resetPending = true;
            return;
        }
        resetPending = false;
        if (!hasTrigger) {
            animation.goToAndPlay(0, true);
        } else {
            animation.goToAndStop(0, true);
        }
    }

    function onReady() {
        if (ready) return;
        ready = true;
        if (resetPending) resetAnimation();
        armTrigger();
        queueScrollTriggerRefresh();
    }

    sectionControllers.set(config.id, { killTrigger, resetAnimation, armTrigger });
    animation.addEventListener('DOMLoaded', onReady);
    animation.addEventListener('loaded_images', queueScrollTriggerRefresh);
    animation.addEventListener('data_failed', queueScrollTriggerRefresh);
    if (animation.isLoaded) onReady();
}

function resetSectionAnimations() {
    // 스크롤 이동으로 기존 트리거가 실행되지 않도록 먼저 해제합니다.
    sectionControllers.forEach((controller) => controller.killTrigger());
    pageScroll.set(0);
    ScrollTrigger.update();
    sectionControllers.forEach((controller) => controller.resetAnimation());
    sectionControllers.forEach((controller) => controller.armTrigger());
}

watchSectionImages();
sectionLotties.forEach(initSectionLottie);


// 리셋 버튼 클릭 시 애니메이션 초기화 //
const resetButton = document.querySelector('.FloatingCtaButton > button');
if (resetButton) resetButton.addEventListener('click', resetSectionAnimations);
