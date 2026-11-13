/* ════════════════════════════════════════════════════
   flow.js — 로딩 → 결과 흐름
   - 분석 시간(기본 6초)이 지나면 자동으로 결과 화면 (AUTO_COMPLETE)
   - [로딩 완료]: 바로 결과 화면 / [다시 로딩]·분석 시간 변경: 로딩부터 다시
   - 로딩만 보기: 켜면 분석 시간·[로딩 완료]를 끄고 자동 완료 없이 로딩 화면만 계속 ([다시 로딩]만 사용)
   - 결과로 넘어갈 때 로딩 사진의 지금 배율(등장 줌아웃·숨쉬기 중)에서 결과 크기로 이어서 줄어듦 → 튀지 않음
   사람이 바꾼 동작은 'aiphoto:change' 이벤트로 알림 (sync.js가 받아 QR·휴대폰에 전달)
   다른 파일에서 쓰는 것: AIPhoto.flow.complete · restart · getTime · setTime · DEFAULT_TIME · isLoadingOnly · setLoadingOnly
   ════════════════════════════════════════════════════ */
(function () {
    var result = window.AIPhoto.result;
    var loadingScreen = document.getElementById('lensLoadingScreen');
    var resultScreen = document.getElementById('lensResultScreen');
    var resultEl = document.getElementById('lensResult');
    var state = document.getElementById('lensState');
    var completeBtn = document.getElementById('lensComplete');
    var restartBtn = document.getElementById('lensRestart');
    var durationRange = document.getElementById('lensDurationRange');
    var durationInput = document.getElementById('lensDurationInput');
    var durationField = document.getElementById('lensDurationField');
    var loadingOnlyBox = document.getElementById('lensLoadingOnly');

    var AUTO_COMPLETE = true;   /* 켜 두면 분석 시간 뒤 자동으로 결과 화면 (false면 [로딩 완료]를 눌러야 넘어감) */
    var TIME_MIN = 1;
    var TIME_MAX = 10;
    var DEFAULT_TIME = 6;       /* 분석 시간 기본값 (초) */
    var analysisSec = DEFAULT_TIME;
    var analysisTimer = null;
    var loadingOnly = false;    /* 로딩만 보기 */

    function emit(action) {     /* 사람이 바꾼 동작 알림: complete · restart · time · loadingOnly */
        document.dispatchEvent(new CustomEvent('aiphoto:change', { detail: { action: action } }));
    }

    var isDone = false;
    function setDone(done) {
        isDone = done;
        if (state) state.textContent = done ? '로딩 완료' : '로딩 중';
        /* 로딩만 보기: [로딩 완료]·분석 시간은 끄고 [다시 로딩]은 늘 켬 */
        if (completeBtn) completeBtn.disabled = done || loadingOnly;
        if (restartBtn) restartBtn.disabled = !done && !loadingOnly;
        if (durationRange) durationRange.disabled = loadingOnly;
        if (durationInput) durationInput.disabled = loadingOnly;
        if (durationField) durationField.classList.toggle('is-disabled', loadingOnly);
    }

    /* ---------- 분석 시간 (1~10초, 0.5초 단위, 입력창 직접 입력 가능) ---------- */
    function clampSec(value) {
        var n = parseFloat(value);
        if (isNaN(n)) return analysisSec;                              /* 잘못 입력하면 이전 값 유지 */
        return Math.round(Math.min(TIME_MAX, Math.max(TIME_MIN, n)) * 10) / 10;
    }
    function showSec() {
        if (durationRange) durationRange.value = analysisSec;
        if (durationInput) durationInput.value = analysisSec.toFixed(1);
    }
    function armTimer() {
        clearTimeout(analysisTimer);
        if (!AUTO_COMPLETE || loadingOnly) return;   /* 로딩만 보기: 시간 재지 않고 로딩 화면 계속 */
        analysisTimer = setTimeout(function () {
            complete();
            emit('complete');
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
        if (loadingOnlyBox) loadingOnlyBox.checked = on;
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
        showSec();
        if (changed) restart();
        return changed;
    }

    /* ---------- 옵션창 버튼·슬라이더 ---------- */
    if (completeBtn) completeBtn.addEventListener('click', function () { complete(); emit('complete'); });
    if (restartBtn) restartBtn.addEventListener('click', function () { restart(); emit('restart'); });
    function onTimeInput(e) {       /* 같은 값이어도 사람이 움직이면 로딩부터 다시 */
        analysisSec = clampSec(e.target.value);
        showSec();
        restart();
        emit('time');
    }
    if (durationRange) durationRange.addEventListener('input', onTimeInput);
    if (durationInput) durationInput.addEventListener('change', onTimeInput);   /* 입력 후 Enter·포커스 이동 때 */
    if (loadingOnlyBox) loadingOnlyBox.addEventListener('change', function () {
        setLoadingOnly(loadingOnlyBox.checked);
        emit('loadingOnly');
    });

    /* 시작: 주소에 ?time= · ?loadingOnly=1 이 있으면 그대로 (QR로 연 휴대폰이 PC와 같은 값) */
    var url = new URLSearchParams(location.search);
    if (url.get('time') != null) analysisSec = clampSec(url.get('time'));
    loadingOnly = url.get('loadingOnly') === '1';
    if (loadingOnlyBox) loadingOnlyBox.checked = loadingOnly;
    showSec();
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
        restart: restart,
        getTime: function () { return analysisSec; },
        setTime: setTime,
        DEFAULT_TIME: DEFAULT_TIME,
        isLoadingOnly: function () { return loadingOnly; },
        setLoadingOnly: setLoadingOnly
    };
})();
