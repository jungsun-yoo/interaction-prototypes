import { ENV_DEFS, SCREENS, SYSTEM_AREAS } from './screens.js';
import { BOTTOM_ROW_MIN_WIDTH, tobeGatewayWidth } from './gateway-rules.js';

const LIMIT = { minW: 280, maxW: 1400, minH: 300, maxH: 1600 };
// 무신사 모바일웹 최대 대응 너비 (MW 에서 딤 등 레이아웃이 이 너비까지만)
const MW_MAX_WIDTH = 600;
const DEFAULT_MAX_HEIGHT = 88;
const BOTTOM_IMAGE_HEIGHT = 40;
const SIZE_KEY = 'gateway-phone-size';
const MODE_KEY = 'gateway-mode';
// 첫 실행: AS-IS 문제 화면인 iPhone Duo 전면 MW (게이트웨이 하단 잘림)
const FIRST_SIZE = { w: 382, h: 580, s: 0, sys: 'duo-front-mw', env: 'mw' };

const $ = (id) => document.getElementById(id);
const phone = $('phone');
const inputW = $('w');
const inputH = $('h');
const inputS = $('s');
const statusbar = $('statusbar');
const systemAreas = $('systemAreas');
const iframe = phone.querySelector('iframe');
const badge = $('badge');
const tooltip = $('tooltip');
const rulerBar = $('rulerBar');
const memo = $('memo');
const memoTab = $('memoTab');
const memoBody = $('memoBody');
const slotInputs = [...document.querySelectorAll('[data-slot]')];
const modeButtons = [...document.querySelectorAll('.mode-btn')];

const clamp = (v, min, max) => Math.min(max, Math.max(min, Math.round(v)));
const frameRoot = () => iframe.contentDocument?.documentElement;

// ─── 저장된 상태 ───────────────────────────────────────────

const loadSize = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(SIZE_KEY));
    if (saved && saved.w && saved.h) return { s: 0, sys: '', env: '', ...saved };
  } catch (e) { /* 저장소 사용 불가 시 기본값 */ }
  return FIRST_SIZE;
};

const saveItem = (key, value) => {
  try { localStorage.setItem(key, value); } catch (e) { /* 무시 */ }
};

const loadMode = () => {
  try { return localStorage.getItem(MODE_KEY) === 'tobe' ? 'tobe' : 'asis'; } catch (e) { return 'asis'; }
};

let size = loadSize();
let mode = loadMode();

// ─── Screen 목록 ───────────────────────────────────────────

const screenInfoHtml = (item) => {
  const rightPart = (SYSTEM_AREAS[item.system] || []).find((part) => part.side === 'right');
  const sysText = rightPart ? ` · 시스템 우측 ${rightPart.size}` : '';
  return `
    <span class="screen__info">
      <span class="screen__name">${item.name}</span>
      <span class="screen__size">${item.w}×${item.h}${sysText}</span>
    </span>`;
};

// 환경 분기가 없는 항목: 줄 전체가 버튼
const screenButtonHtml = (item, noSideDim) => `
  <li>
    <button class="screen" type="button"
      data-w="${item.w}" data-h="${item.h}" data-s="${item.status}" data-sys="${item.system || ''}" data-env="" ${noSideDim ? 'data-no-side-dim' : ''}>${screenInfoHtml(item)}</button>
  </li>`;

const envButtonHtml = (group, item, key) => {
  const env = ENV_DEFS[key];
  const v = env.valuesOf(item);
  const warn = (item[key] || {}).warn;
  const warnAttrs = warn ? `data-warn="${warn.text}" data-warn-slots="${warn.slots.join(' ')}"` : '';
  return `
    <button class="env-btn" type="button" ${warnAttrs}
      data-w="${v.w}" data-h="${v.h}" data-s="${v.s}" data-sys="${v.sys}" data-env="${key}"
      aria-label="${group} ${item.name} ${env.label}">${env.label}</button>`;
};

// 환경 분기가 있는 항목: 줄 오른쪽에 환경 버튼
const screenRowHtml = (group, item, envs) => `
  <li class="screen">
    ${screenInfoHtml(item)}
    <span class="screen__envs">${envs.map((key) => envButtonHtml(group, item, key)).join('')}</span>
  </li>`;

$('deviceList').innerHTML = SCREENS.map(({ group, envs, noSideDim, items }) => `
  <section class="devices__group">
    <p class="devices__group-title">${group}</p>
    <ul class="devices__list">
      ${items.map((item) => (envs ? screenRowHtml(group, item, envs) : screenButtonHtml(item, noSideDim))).join('')}
    </ul>
  </section>`).join('');

// 크기를 선택하는 버튼: 환경 버튼 + 분기 없는 줄 버튼
const screenButtons = [...document.querySelectorAll('#deviceList [data-w]')];

const syncActiveScreen = () => {
  screenButtons.forEach((btn) => btn.classList.toggle(
    'is-active',
    Number(btn.dataset.w) === size.w && Number(btn.dataset.h) === size.h
      && Number(btn.dataset.s) === size.s && btn.dataset.sys === size.sys
      && btn.dataset.env === size.env,
  ));
  document.querySelectorAll('.screen').forEach((row) => row.classList.toggle(
    'is-active',
    row.matches('[data-w].is-active') || !!row.querySelector('.env-btn.is-active'),
  ));
};

// ─── 기기 화면 ─────────────────────────────────────────────

// 현재 시스템 영역의 방향별 크기 합
const systemExtent = () => (SYSTEM_AREAS[size.sys] || []).reduce(
  (acc, part) => ({ ...acc, [part.side]: acc[part.side] + part.size }),
  { left: 0, right: 0, top: 0, bottom: 0 },
);

// 눈금자는 뷰포트 기준. 폰은 (뷰포트 + 시스템 영역) 전체가 가운데 정렬이라 그만큼 보정
const renderRulerMark = () => {
  const { left, right } = systemExtent();
  const shift = (left - right) / 2;
  rulerBar.style.transform = `translateX(calc(-50% + ${shift}px))`;
  badge.style.transform = `translateX(${shift}px)`;
};

// 뷰포트 둘레에 시스템 영역(이미지·단색)을 붙임
const renderSystemAreas = () => {
  const { left, top, bottom } = systemExtent();
  const fullH = top + size.h + bottom;
  const boxOf = {
    left: (part) => `left:0;top:0;width:${part.size}px;height:${fullH}px`,
    right: (part) => `left:${left + size.w}px;top:0;width:${part.size}px;height:${fullH}px`,
    top: (part) => `left:${left}px;top:0;width:${size.w}px;height:${part.size}px`,
    bottom: (part) => `left:${left}px;top:${top + size.h}px;width:${size.w}px;height:${part.size}px`,
  };
  const html = (SYSTEM_AREAS[size.sys] || []).map((part) => {
    const box = boxOf[part.side](part);
    return part.src
      ? `<img class="system-area" src="${part.src}" alt="" style="${box}" />`
      : `<div class="system-area" style="${box};background-color:${part.color}"></div>`;
  }).join('');
  // 같은 구성이면 다시 그리지 않음 (이미지 깜빡임 방지)
  if (systemAreas.dataset.key === html) return;
  systemAreas.dataset.key = html;
  systemAreas.innerHTML = html;
};

// 뷰포트(iframe) = w×h. 왼쪽·위 시스템 영역이 있으면 뷰포트를 그만큼 옮김
// 상태바는 뷰포트 상단에 그리고, 게이트웨이가 덮도록 --safe-top 전달 (env(safe-area-inset-top) 역할)
const applyViewport = () => {
  const { left, top } = systemExtent();
  Object.assign(iframe.style, {
    width: `${size.w}px`,
    height: `${size.h}px`,
    marginTop: `${top}px`,
    marginLeft: `${left}px`,
  });
  renderSystemAreas();
  Object.assign(statusbar.style, {
    top: `${top}px`,
    left: `${left}px`,
    width: `${size.w}px`,
    height: `${size.s}px`,
  });
  statusbar.hidden = size.s === 0;
  const root = frameRoot();
  if (!root) return;
  root.style.setProperty('--safe-top', `${size.s}px`);
  // 웹(MW·삼성·크롬)은 모바일웹 최대 너비까지만 레이아웃 (딤 너비 600)
  if (ENV_DEFS[size.env]?.isWeb) root.style.setProperty('--max-width', `${MW_MAX_WIDTH}px`);
  else root.style.removeProperty('--max-width');
};

// ─── TO-BE 설정·가이드 ─────────────────────────────────────

// TO-BE 최대높이 비율(%). 10~100 사이로 제한
const maxHeightPercent = () => {
  const value = Number($('maxHeight').value);
  return Number.isFinite(value) && value > 0 ? Math.min(100, Math.max(10, value)) : DEFAULT_MAX_HEIGHT;
};

// 작업 영역 서랍 메모: TO-BE 규칙 요약
const renderMemo = () => {
  $('memoContent').innerHTML = `<p class="memo__title">TO-BE 개발 가이드</p>
    <p class="memo__heading">1. 기본 너비 (AS-IS 와 같음)</p>
    <ul>
      <li>화면 너비 441 미만: 100%</li>
      <li>화면 너비 441 이상: 320</li>
      <li>패드: 500(AS-IS 그대로 사용)</li>
    </ul>
    <p class="memo__heading">2. 높이 제한 (패드 제외)</p>
    <ul>
      <li>게이트웨이 높이가 콘텐츠 화면 높이의 ${maxHeightPercent()}% 를 넘으면 높이 기준으로 너비를 역산</li>
      <li>역산 값은 정수 내림, 320 미만 허용</li>
      <li>높이에 상태바 덮는 여백은 제외</li>
    </ul>
    <p class="memo__heading">3. 콘텐츠 화면 높이</p>
    <ul>
      <li>MW: 뷰포트 높이</li>
      <li>iOS App: 상태바 제외</li>
      <li>Android App: 상태바·물리키 영역 제외</li>
    </ul>
    <p class="memo__heading">4. 하단 버튼 이미지</p>
    <ul>
      <li>오프라인 스토어, 서비스 전체보기 이미지의 공간이 줄어들면 이미지는 비율을 유지하며 축소</li>
    </ul>`;
};

// 가이드라인: 콘텐츠 영역 = 뷰포트에서 상단 상태바를 뺀 범위, 최대높이 지점 = 그 높이의 n%
const renderGuide = () => {
  renderMemo();
  const guide = $('guide');
  guide.hidden = mode !== 'tobe' || !$('guideToggle').checked;
  if (guide.hidden) return;
  const top = systemExtent().top + size.s;
  const usable = size.h - size.s;
  const percent = maxHeightPercent();
  Object.assign(guide.style, { width: phone.style.width, height: phone.style.height });
  Object.assign($('guideRange').style, { top: `${top}px`, height: `${usable}px` });
  $('guideLine').style.top = `${top + usable * percent / 100}px`;
  $('guideLineLabel').textContent = `${percent}% 지점`;
};

// ─── 경고 표시 ─────────────────────────────────────────────

// 목록 버튼 경고
// - 빨강(is-warn): AS-IS 에서 하단이 잘리는 화면. 설정한 구좌가 모두 노출될 때만, AS-IS 에서만
// - 빨강(is-dim): 딤이 보이면 안 되는 기종인데 TO-BE 너비가 화면 너비보다 좁음. 주황보다 우선
// - 주황(is-shrink): TO-BE 너비가 295 미만이라 오프라인 스토어·서비스 전체보기 이미지가 작아지는 화면
const syncWarnings = () => {
  const visibleSlots = new Set(slotInputs.filter((input) => input.checked).map((input) => input.dataset.slot));
  const ratio = maxHeightPercent() / 100;
  screenButtons.forEach((btn) => {
    const screenW = Number(btn.dataset.w);
    const usable = Number(btn.dataset.h) - Number(btn.dataset.s);
    const tobeWidth = tobeGatewayWidth(screenW, usable, visibleSlots, ratio);
    const shrink = tobeWidth < BOTTOM_ROW_MIN_WIDTH;
    const sideDim = btn.hasAttribute('data-no-side-dim') && tobeWidth < screenW;
    const clipped = btn.hasAttribute('data-warn')
      && btn.dataset.warnSlots.split(' ').every((slot) => visibleSlots.has(slot));
    btn.classList.toggle('is-warn', clipped);
    btn.classList.toggle('is-dim', sideDim);
    btn.classList.toggle('is-shrink', shrink && !sideDim);
    if (mode === 'asis' && clipped) btn.title = btn.dataset.warn;
    else if (mode === 'tobe' && sideDim) btn.title = `TO-BE: 너비 ${tobeWidth}px < 화면 ${screenW}px · 좌우 딤 노출`;
    else if (mode === 'tobe' && shrink) btn.title = `TO-BE: 너비 ${tobeWidth}px · 하단 버튼 이미지가 작아짐`;
    else btn.removeAttribute('title');
  });
};

// 하단 줄 버튼 이미지가 실제로 그려진 높이 (object-fit: contain 이라 칸 너비에 맞춰 비율대로 줄어듦)
const bottomImageHeight = () => {
  const img = iframe.contentDocument?.querySelector('.gateway__offline-img');
  if (!img || !img.naturalWidth) return BOTTOM_IMAGE_HEIGHT;
  const box = img.getBoundingClientRect();
  const drawn = Math.min(box.height, box.width * img.naturalHeight / img.naturalWidth);
  return Math.round(drawn * 10) / 10;
};

// 폰 아래 경고 이유: 닫기 미노출·좌우 딤은 선택한 화면 버튼의 경고와 같은 기준
// 이미지 축소는 실측 너비로 판단: 드래그 등으로 크기를 실시간으로 바꿔도 축소되는 순간 바로 표시
const renderWarnNote = (data) => {
  const note = $('warnNote');
  const active = screenButtons.find((btn) => btn.classList.contains('is-active'));
  const clipped = mode === 'asis' && !!active && active.classList.contains('is-warn');
  const sideDim = mode === 'tobe' && !!active && active.classList.contains('is-dim');
  const shrink = mode === 'tobe' && !sideDim && data.width < BOTTOM_ROW_MIN_WIDTH;
  note.hidden = !clipped && !sideDim && !shrink;
  note.classList.toggle('is-asis', clipped || sideDim);
  note.classList.toggle('is-tobe', shrink);
  $('warnNoteText').textContent = clipped
    ? '닫기 버튼 미노출'
    : sideDim
      ? `좌우 딤 영역 노출 - 게이트웨이 ${data.width}px < 화면 ${size.w}px`
      : `하단 버튼 이미지(오프라인 스토어, 서비스 전체보기 원본 높이 ${BOTTOM_IMAGE_HEIGHT}) 축소 - 현재 ${bottomImageHeight()}px`;
};

// ─── 상태 적용 ─────────────────────────────────────────────

const render = () => {
  const extent = systemExtent();
  phone.style.width = `${extent.left + size.w + extent.right}px`;
  phone.style.height = `${extent.top + size.h + extent.bottom}px`;
  if (document.activeElement !== inputW) inputW.value = size.w;
  if (document.activeElement !== inputH) inputH.value = size.h;
  if (document.activeElement !== inputS) inputS.value = size.s;
  tooltip.textContent = `${size.w} × ${size.h}`;
  rulerBar.style.width = `${size.w}px`;
  applyViewport();
  renderRulerMark();
  renderGuide();
  syncActiveScreen();
};

const setSize = (next) => {
  const merged = { ...size, ...next };
  size = {
    w: clamp(merged.w, LIMIT.minW, LIMIT.maxW),
    h: clamp(merged.h, LIMIT.minH, LIMIT.maxH),
    s: clamp(merged.s, 0, 120),
    sys: SYSTEM_AREAS[merged.sys] ? merged.sys : '',
    // 환경은 버튼으로 고를 때만 유지, 직접 조절하면 해제
    env: next.env || '',
  };
  render();
  saveItem(SIZE_KEY, JSON.stringify(size));
};

// 구좌 노출: 체크 해제 시 게이트웨이 iframe 루트에 hide-{slot} 클래스 부여
const applySlots = () => {
  const root = frameRoot();
  if (!root) return;
  slotInputs.forEach((input) => root.classList.toggle(`hide-${input.dataset.slot}`, !input.checked));
  const video = iframe.contentDocument.querySelector('.brand-ad__video');
  if (!video) return;
  const adInput = slotInputs.find((input) => input.dataset.slot === 'ad');
  if (adInput.checked) video.play().catch(() => {});
  else video.pause();
};

// AS-IS / TO-BE: 게이트웨이 iframe 루트에 tobe 클래스 부여
const applyMode = () => {
  renderGuide();
  document.body.classList.toggle('is-asis', mode === 'asis');
  document.body.classList.toggle('is-tobe', mode === 'tobe');
  syncWarnings();
  // AS-IS 에서는 TO-BE 전용 설정 비활성
  ['guideToggle', 'maxHeight'].forEach((id) => {
    const input = $(id);
    input.disabled = mode !== 'tobe';
    input.closest('label').classList.toggle('is-disabled', input.disabled);
  });
  modeButtons.forEach((btn) => btn.classList.toggle('is-active', btn.dataset.mode === mode));
  const root = frameRoot();
  if (!root) return;
  root.classList.toggle('tobe', mode === 'tobe');
  root.style.setProperty('--max-height-ratio', String(maxHeightPercent() / 100));
};

// ─── 서랍 메모 ─────────────────────────────────────────────

const setMemoOpen = (open) => {
  memo.classList.toggle('is-closed', !open);
  memoTab.setAttribute('aria-expanded', String(open));
  memoBody.setAttribute('aria-expanded', String(open));
  // 펼침: 박스로 접기 / 접힘: 탭으로 펼치기 (키보드 포커스도 보이는 쪽만)
  memoBody.tabIndex = open ? 0 : -1;
  memoTab.tabIndex = open ? -1 : 0;
};

// TO-BE 로 들어오면 왼쪽에서 펼쳐지고, AS-IS 면 탭까지 숨김
const syncMemoWithMode = () => {
  if (mode !== 'tobe') {
    memo.classList.add('is-hidden');
    return;
  }
  setMemoOpen(true);
  // 숨김 상태가 먼저 그려진 뒤 풀어야 왼쪽에서 오른쪽으로 미끄러져 나옴
  requestAnimationFrame(() => requestAnimationFrame(() => memo.classList.remove('is-hidden')));
};

// ─── 입력 ──────────────────────────────────────────────────

// 드래그: 크롬 디바이스 모드처럼 가운데 정렬 기준이라 너비는 이동량의 2배로 변경
const startDrag = (event) => {
  const handle = event.currentTarget;
  const axis = handle.dataset.axis;
  const start = { x: event.clientX, y: event.clientY, w: size.w, h: size.h };

  handle.setPointerCapture(event.pointerId);
  handle.classList.add('is-active');
  document.body.classList.add('is-dragging', `is-dragging-${axis}`);

  const onMove = (e) => {
    // 반응형(드래그) 모드는 실제 기기가 아니므로 상태바 0
    setSize({
      w: axis.includes('x') ? start.w + (e.clientX - start.x) * 2 : start.w,
      h: axis.includes('y') ? start.h + e.clientY - start.y : start.h,
      s: 0,
      sys: '',
    });
  };

  const onUp = () => {
    handle.classList.remove('is-active');
    document.body.classList.remove('is-dragging', `is-dragging-${axis}`);
    handle.removeEventListener('pointermove', onMove);
    handle.removeEventListener('pointerup', onUp);
    handle.removeEventListener('pointercancel', onUp);
  };

  handle.addEventListener('pointermove', onMove);
  handle.addEventListener('pointerup', onUp);
  handle.addEventListener('pointercancel', onUp);
};

// 너비·높이를 직접 바꾸면 반응형 모드로 보고 상태바 0·시스템 영역 해제, 상태바만 바꾸면 시스템 영역 유지
const onSizeInput = (event) => {
  const w = Number(inputW.value);
  const h = Number(inputH.value);
  const s = event.target === inputS ? Number(inputS.value) : 0;
  if (![w, h, s].every(Number.isFinite) || w <= 0 || h <= 0 || s < 0) return;
  setSize(event.target === inputS ? { s } : { w, h, s, sys: '' });
};

const onSizeArrowKey = (event) => {
  if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
  event.preventDefault();
  const step = (event.shiftKey ? 10 : 1) * (event.key === 'ArrowUp' ? 1 : -1);
  const key = event.target.id; // w · h · s
  setSize(key === 's' ? { s: size.s + step } : { [key]: size[key] + step, s: 0, sys: '' });
  // 포커스 중에는 render 가 입력칸을 갱신하지 않으므로 직접 반영
  event.target.value = size[key];
};

// 게이트웨이가 계산한 너비·높이를 배지에 표시 (높이 비율이 최대높이를 넘으면 빨강)
const onGatewayFit = (event) => {
  const { data } = event;
  if (!data || data.type !== 'gateway-fit' || event.source !== iframe.contentWindow) return;
  const percent = (data.height / data.usable) * 100;
  badge.classList.toggle('is-over', percent > maxHeightPercent());
  badge.textContent = `게이트웨이 ${Math.round(data.width * 10) / 10}px · 높이 ${percent.toFixed(1)}%`;
  renderWarnNote(data);
};

const onSlotChange = () => {
  applySlots();
  syncWarnings();
};

const onModeClick = (event) => {
  const next = event.currentTarget.dataset.mode;
  const changed = mode !== next;
  mode = next;
  saveItem(MODE_KEY, mode);
  applyMode();
  if (changed) syncMemoWithMode();
};

document.querySelectorAll('.handle').forEach((handle) => handle.addEventListener('pointerdown', startDrag));
[inputW, inputH, inputS].forEach((input) => {
  input.addEventListener('change', onSizeInput);
  input.addEventListener('keydown', onSizeArrowKey);
});
screenButtons.forEach((btn) => btn.addEventListener('click', () => setSize({
  w: Number(btn.dataset.w),
  h: Number(btn.dataset.h),
  s: Number(btn.dataset.s),
  sys: btn.dataset.sys,
  env: btn.dataset.env,
})));
slotInputs.forEach((input) => input.addEventListener('change', onSlotChange));
modeButtons.forEach((btn) => btn.addEventListener('click', onModeClick));
$('guideToggle').addEventListener('change', renderGuide);
// 최대높이를 바꾸면 가이드라인·경고·게이트웨이 너비를 바로 다시 계산
$('maxHeight').addEventListener('input', applyMode);
$('maxHeight').addEventListener('change', () => {
  $('maxHeight').value = maxHeightPercent();
  applyMode();
});
memoTab.addEventListener('click', () => setMemoOpen(true));
memoBody.addEventListener('click', () => setMemoOpen(false));
memoBody.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  e.preventDefault();
  setMemoOpen(false);
});
window.addEventListener('resize', renderRulerMark);
window.addEventListener('message', onGatewayFit);
iframe.addEventListener('load', () => {
  applyViewport();
  applySlots();
  applyMode();
});

// ─── 시작 ──────────────────────────────────────────────────

applyMode();
syncMemoWithMode();
// 수정 사항이 바로 보이도록 캐시를 피해 게이트웨이를 불러옴
iframe.src = `gateway.html?v=${Date.now()}`;
render();
