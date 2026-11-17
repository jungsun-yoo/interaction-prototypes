/* ════════════════════════════════════════════════════
   sync.js — PC에서 바꾼 값을 휴대폰으로
   1) QR 주소: index 안에서 열렸을 때 바꾼 값(기본값과 다른 것만)을 index에 보냄 → index가 QR 주소 뒤에 붙임
      예) …/aiPhotoAnalysis/index.html?v=…&time=5&loadingOnly=1
   2) 실시간 동기화: 로컬 서버(_html/proto_server.py)로 열었을 때만
      PC(index 안) → 서버(POST /api/options) → 이미 열려 있는 휴대폰(/api/options/stream)에 바로 반영
      서버는 이름 소문자·하이픈, 값 영문·숫자·_- 만 받음 → 보낼 때 orbSize → orb-size, 0.45 → 0p45 로 바꾸고 받을 때 되돌림
      scope 는 인덱스 옵션(common.js protoOptions)과 섞이지 않게 이 화면 전용 (…/aiPhotoAnalysis/_lens)
      분석 시간 · 로딩만 보기 + [로딩 완료]·[다시 로딩]·자동 완료까지 따라 함
      GitHub Pages 등 서버가 없는 곳에서는 첫 연결이 실패하면 조용히 멈추고, QR 주소 방식만 동작
   ════════════════════════════════════════════════════ */
(function () {
    var flow = window.AIPhoto.flow;

    var SYNC_ON = /^(localhost|127\.0\.0\.1|\d+\.\d+\.\d+\.\d+)$/.test(location.hostname);
    var SYNC_SCOPE = encodeURIComponent(location.pathname.replace(/\/[^\/]*$/, '') + '/_lens');

    /* 서버 규칙에 맞게 바꾸기 / 되돌리기 */
    function encode(p) {
        var out = {};
        Object.keys(p).forEach(function (k) {
            out[k.replace(/[A-Z0-9]/g, function (c) { return '-' + c.toLowerCase(); })] = String(p[k]).replace(/\./g, 'p');
        });
        return out;
    }
    function decode(p) {
        var out = {};
        Object.keys(p).forEach(function (k) {
            var v = String(p[k]);
            out[k.replace(/-([a-z0-9])/g, function (m, c) { return /[0-9]/.test(c) ? c : c.toUpperCase(); })] = /^-?\d*p\d+$/.test(v) ? v.replace('p', '.') : v;
        });
        return out;
    }
    var inIndex = window.parent !== window;   /* 보내는 쪽: index 안에서 연 PC 화면 / 받는 쪽: 휴대폰 등 index 밖 */

    var phase = 'loading';   /* 지금 화면: loading(로딩 중) · done(결과 화면) */
    var seq = 0;             /* [로딩 완료]·[다시 로딩]·자동 완료 때마다 +1 → 휴대폰이 새 동작인지 알아봄 */

    /* 지금 값 중 기본값과 다른 것만 */
    function currentParams() {
        var p = {};
        if (flow.getTime() !== flow.DEFAULT_TIME) p.time = String(flow.getTime());
        if (flow.isLoadingOnly() !== flow.LOADING_ONLY_DEFAULT) p.loadingOnly = flow.isLoadingOnly() ? '1' : '0';
        return p;
    }

    /* 보내기: 서버(실시간) + index(QR 주소) */
    function share() {
        var p = currentParams();
        if (SYNC_ON && inIndex) {
            fetch('/api/options?scope=' + SYNC_SCOPE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(encode(Object.assign({ phase: phase, seq: String(seq) }, p)))
            }).then(function (res) { if (res.status === 404 || res.status === 501) SYNC_ON = false; })   /* 동기화 서버가 없음 → 그만 보냄 */
              .catch(function () { SYNC_ON = false; });
        }
        if (inIndex) window.parent.postMessage({ type: 'proto-params', params: p }, location.origin);
    }

    /* flow.js 가 알려 주는 사람의 동작 */
    document.addEventListener('aiphoto:change', function (e) {
        var action = e.detail && e.detail.action;
        if (action === 'complete') { phase = 'done'; seq++; }
        else if (action === 'restart') { phase = 'loading'; seq++; }
        else if (action === 'time') { phase = 'loading'; }      /* 휴대폰은 시간 변경을 보고 알아서 로딩부터 다시 */
        else if (action === 'loadingOnly' && flow.isLoadingOnly()) { phase = 'loading'; }   /* 켜면 로딩 화면으로 */
        share();
    });

    /* 받는 쪽: 휴대폰 */
    if (SYNC_ON && !inIndex && window.EventSource) {
        var opened = false;
        var first = true;              /* 연결 직후 서버가 주는 첫 값 */
        var lastSeq = null;            /* 마지막으로 따라 한 동작 순번 */
        var source = new EventSource('/api/options/stream?scope=' + SYNC_SCOPE);
        source.onopen = function () { opened = true; };
        source.onmessage = function (e) {
            var p;
            try { p = JSON.parse(e.data); } catch (err) { return; }
            if (!p || typeof p !== 'object') return;
            p = decode(p);
            var pcPhase = p.phase, pcSeq = p.seq;
            delete p.phase;
            delete p.seq;
            var isFirst = first;
            first = false;
            /* 옵션 값: 아직 PC에서 바꾼 값이 없으면(첫 연결에 빈 값) 주소(QR) 값 유지 */
            if (!(isFirst && !Object.keys(p).length)) {
                flow.setLoadingOnly(p.loadingOnly != null ? p.loadingOnly === '1' : flow.LOADING_ONLY_DEFAULT);
                flow.setTime(p.time != null ? p.time : flow.DEFAULT_TIME);   /* 바뀌었을 때만 로딩부터 다시 */
            }
            /* 화면: 첫 연결이면 PC가 결과 화면일 때만 맞춤, 이후엔 동작 순번이 바뀔 때마다 같은 동작 */
            if (isFirst) {
                if (pcPhase === 'done') flow.complete();
            } else if (pcSeq != null && pcSeq !== lastSeq) {
                if (pcPhase === 'done') flow.complete();
                else if (pcPhase === 'loading') flow.restart();
            }
            if (pcSeq != null) lastSeq = pcSeq;
        };
        source.onerror = function () {
            if (!opened) source.close();      /* 동기화 서버가 없음 → 재시도하지 않음 */
        };
    }

    share();   /* 처음 상태도 한 번 알림 (QR 주소 · 서버) */
})();
