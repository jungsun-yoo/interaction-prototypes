/* ════════════════════════════════════════════════════
   flow.js — 로딩 → 결과 흐름
   - 분석 시간(기본 6초)이 지나면 자동으로 결과 화면 (AUTO_COMPLETE)
   - [로딩 완료]: 바로 결과 화면 / [다시 로딩]·분석 시간 변경: 로딩부터 다시
   - 로딩만 보기: 켜면 자동 완료 없이 로딩 화면만 계속
   - 결과로 넘어갈 때 로딩 사진의 지금 배율(등장 줌아웃·숨쉬기 중)에서 결과 크기로 이어서 줄어듦 → 튀지 않음
   조작은 인덱스 오른쪽 옵션 카드 (index.html items[].options, 공유 틀 common.js protoOptions):
     - 값: loading-only(on/off) · analysis-time(초) → <html data-…> 로 들어오고 window 'proto-options' 이벤트
     - 버튼: complete · restart → window 'proto-action' 이벤트 (QR로 연결된 폰에도, 폰 동기화가 켜졌을 때)
     - 상태: lens-state(로딩 중 · 로딩 완료) → protoOptions.report 로 인덱스 카드에 알림
   다른 파일에서 쓰는 것: AIPhoto.flow.complete · restart
   ════════════════════════════════════════════════════ */
(function () {
    var result = window.AIPhoto.result;
    var loadingScreen = document.getElementById('lensLoadingScreen');
    var resultScreen = document.getElementById('lensResultScreen');
    var resultEl = document.getElementById('lensResult');

    var AUTO_COMPLETE = true;   /* 켜 두면 분석 시간 뒤 자동으로 결과 화면 (false면 [로딩 완료]를 눌러야 넘어감) */
    var TIME_MIN = 1;
    var TIME_MAX = 10;
    var DEFAULT_TIME = 6;       /* 분석 시간 기본값 (초) */
    var analysisSec = DEFAULT_TIME;
    var analysisTimer = null;
    var LOADING_ONLY_DEFAULT = false;  /* 로딩만 보기 기본값: 끔 (분석 시간 뒤 결과 화면으로) */
    var loadingOnly = LOADING_ONLY_DEFAULT;

    var isDone = false;
    var protoOptions = window.protoOptions || null;   /* 공유 틀 common.js (인덱스 옵션 카드와 연결) */
    function setDone(done) {
        isDone = done;
        if (protoOptions && protoOptions.report) protoOptions.report({ 'lens-state': done ? '로딩 완료' : '로딩 중' });   /* 인덱스 카드 '상태' */
    }

    /* ---------- 분석 시간 (1~10초, 인덱스 슬라이더 0.5초 단위) ---------- */
    function clampSec(value) {
        var n = parseFloat(value);
        if (isNaN(n)) return analysisSec;                              /* 잘못 입력하면 이전 값 유지 */
        return Math.round(Math.min(TIME_MAX, Math.max(TIME_MIN, n)) * 10) / 10;
    }
    function armTimer() {
        clearTimeout(analysisTimer);
        if (!AUTO_COMPLETE || loadingOnly) return;   /* 로딩만 보기: 시간 재지 않고 로딩 화면 계속 */
        analysisTimer = setTimeout(function () {
            complete();
        }, analysisSec * 1000);
    }

    /* ---------- 결과 화면으로 ---------- */
    function complete() {
        clearTimeout(analysisTimer);
        if (!loadingScreen || !resultScreen || !resultEl) return;
        if (!resultScreen.hidden) return;                              /* 이미 결과 화면 */
        /* 로딩 사진의 지금 배율(등장 줌아웃·숨쉬기 중이면 1보다 큼)을 읽어 결과 사진이 그 크기에서 출발 */
        var loadingImg = loadingScreen.querySelector('.Image');
        var zoomNow = 1;
        if (loadingImg) {
            var t = getComputedStyle(loadingImg).transform;
            if (t && t !== 'none') zoomNow = new DOMMatrixReadOnly(t).a || 1;
        }
        loadingScreen.hidden = true;
        resultScreen.hidden = false;
        void resultEl.offsetWidth;                  /* 내려가 있는 시트(시작 상태)를 먼저 그린 뒤 */
        /* .is-sheet-down 을 떼면: 시트는 CSS transition으로 올라오고, 사진·창·모서리는 frameMotion이 같은 시간·곡선으로,
           배율도 zoomNow → 1 로 같은 곡선으로 줄어듦 */
        result.frameMotion(function () { resultEl.classList.remove('is-sheet-down'); }, '--lens-sheet-duration', '--lens-sheet-easing', zoomNow);
        setDone(true);
    }

    /* ---------- 로딩부터 다시 ---------- */
    function restart() {
        if (!loadingScreen || !resultScreen || !resultEl) return;
        result.stopMotion();
        resultEl.classList.add('is-sheet-down');    /* 다음 등장을 위해 시트를 다시 내려 둠 */
        resultScreen.hidden = true;
        loadingScreen.hidden = true;                /* 이미 로딩 화면이어도 한 번 숨겼다 보이면 CSS 애니메이션이 처음부터 */
        void loadingScreen.offsetWidth;
        loadingScreen.hidden = false;
        result.stopMotion();
        result.selectItem(result.firstId, false);   /* 썸네일·포커스·리스트를 첫 상품으로 (숨긴 화면이라 이동 없이) */
        setDone(false);
        armTimer();
    }

    /* 로딩만 보기 켜기/끄기: 켜면 결과 화면이었어도 로딩부터 다시, 끄면 지금부터 분석 시간을 다시 잼 */
    function setLoadingOnly(on) {
        on = !!on;
        if (on === loadingOnly) return false;
        loadingOnly = on;
        if (on && isDone) restart();
        else { setDone(isDone); if (!isDone) armTimer(); }
        return true;
    }

    /* 분석 시간 바꾸기: 값이 바뀌면 로딩부터 다시 */
    function setTime(value) {
        var sec = clampSec(value);
        var changed = sec !== analysisSec;
        analysisSec = sec;
        if (changed) restart();
        return changed;
    }

    /* ---------- 인덱스 옵션 카드 → 이 화면 ---------- */
    /* 값: <html data-loading-only> · data-analysis-time (주소 ?opt-…, 인덱스, 폰은 서버 실시간으로 들어옴) */
    function readOptions() {
        if (!protoOptions) return;
        var only = protoOptions.get('loading-only');
        var time = protoOptions.get('analysis-time');
        if (only != null) setLoadingOnly(only === 'on');
        if (time != null) setTime(time);        /* 바뀌었을 때만 로딩부터 다시 */
    }
    window.addEventListener('proto-options', readOptions);
    /* 버튼: 로딩 완료 · 다시 로딩 */
    window.addEventListener('proto-action', function (e) {
        var id = e.detail && e.detail.id;
        if (id === 'complete') complete();
        else if (id === 'restart') restart();
    });

    /* 시작: 이미 들어와 있는 옵션 값(주소 ?opt-…) 그대로 */
    if (protoOptions) {
        var only0 = protoOptions.get('loading-only');
        var time0 = protoOptions.get('analysis-time');
        if (only0 != null) loadingOnly = only0 === 'on';
        if (time0 != null) analysisSec = clampSec(time0);
    }
    setDone(false);
    armTimer();

    /* ---------- 휴대폰(QR로 열기)에서 화면 너비가 390보다 좁으면 폰 화면을 너비에 맞게 줄임 ---------- */
    var touch = window.matchMedia('(hover: none), (pointer: coarse)');
    var pair = document.querySelector('.lens-pair');
    function fitPhone() {
        if (!pair) return;
        var k = touch.matches ? Math.min(1, window.innerWidth / 390) : 1;
        pair.style.zoom = k < 1 ? k : '';
    }
    window.addEventListener('resize', fitPhone);
    fitPhone();

    window.AIPhoto.flow = {
        complete: complete,
        restart: restart
    };
})();
