/* optioncontrol.js — 프로토타입 옵션 컨트롤: 전문관 전환 버튼 (모양·위치는 optioncontrol.css)
   버튼을 누르면 window.setStore(common.js)로 전문관을 바꾸고, 주소의 ?store=도 바꿔 새로고침해도 그 전문관으로 열림
   기기별 위치
     - 모바일(터치): 빅배너 윗부분에 가로로 고정 (폰 화면 안)
     - 데스크탑 + 인덱스(iframe) 안: 폰 화면 안에는 그리지 않음 → 인덱스가 폰 오른쪽에 창을 그림 (index.html, window.optionControl 사용)
     - 데스크탑 + 단독으로 연 페이지: 폰 오른쪽에 세로 창 (.option-control--panel)
   필요: common.js (setStore, pageScroll) / 선택 표시는 'storechange'로 맞춤 */
(function () {
  var STORES = [
    { id: 'musinsa', label: '무신사' },
    { id: 'beauty', label: '뷰티' },
    { id: 'sports', label: '스포츠' },
    { id: 'outlet', label: '아울렛' },
    { id: 'kids', label: '키즈' },
    { id: 'boutique', label: '부티크' },
    { id: 'kicks', label: '킥스' },
    { id: 'used', label: '유즈드' }
  ];
  var PANEL_GAP = 12; /* 데스크탑 창: 폰 오른쪽과의 간격 (인덱스 툴바와 같은 값) */

  var phone = document.querySelector('.phone');
  if (!phone || !window.setStore) return;

  function select(id) {
    if (id === phone.dataset.store) return;
    var url = new URL(location.href);
    url.searchParams.set('store', id);
    history.replaceState(null, '', url);
    window.setStore(id);
  }

  /* 인덱스가 폰 바깥에 같은 버튼을 그릴 수 있게 목록 · 전환 함수를 열어 둠
     체크인 켜기 · 끄기는 타입 js(예: type_1.js의 setCheckin)가 있을 때만 */
  window.optionControl = {
    stores: STORES,
    select: select,
    hasCheckin: function () { return typeof window.setCheckin === 'function'; },
    isCheckinOn: function () { return window.isCheckinOn(); },
    setCheckin: function (on) { window.setCheckin(on); }
  };

  var isTouch = window.pageScroll ? pageScroll.isTouch : window.matchMedia('(hover: none), (pointer: coarse)').matches;
  var inIndex = !isTouch && window.frameElement !== null && window.parent !== window;
  if (inIndex) return; /* 데스크탑 인덱스: 인덱스가 폰 오른쪽에 창을 그림 */

  var isPanel = !isTouch; /* 데스크탑 단독 페이지: 폰 오른쪽 세로 창 */
  var control = document.createElement('div');
  control.className = 'option-control' + (isPanel ? ' option-control--panel' : '');
  control.setAttribute('role', 'group');
  control.setAttribute('aria-label', '스토어 선택');

  if (isPanel) {
    var title = document.createElement('p');
    title.className = 'option-control-title';
    title.textContent = '스토어';
    control.appendChild(title);
  }

  var buttons = STORES.map(function (store) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'option-control-button';
    button.dataset.store = store.id;
    button.textContent = store.label;
    button.addEventListener('click', function () { select(store.id); });
    control.appendChild(button);
    return button;
  });

  /* 데스크탑 창은 폰(overflow: hidden) 밖에 있어야 해서 body에 붙이고 폰 오른쪽 윗선에 맞춤 */
  function placePanel() {
    var rect = phone.getBoundingClientRect();
    control.style.left = rect.right + PANEL_GAP + 'px';
    control.style.top = rect.top + 'px';
  }

  if (isPanel) {
    document.body.appendChild(control);
    placePanel();
    window.addEventListener('resize', placePanel);
  } else {
    phone.appendChild(control);
  }

  function update() {
    var current = phone.dataset.store;
    buttons.forEach(function (button) {
      var active = button.dataset.store === current;
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
      if (active && !isPanel) {
        var left = button.offsetLeft - (control.clientWidth - button.offsetWidth) / 2;
        control.scrollTo({ left: left, behavior: 'smooth' }); /* 선택한 버튼을 가운데로 */
      }
    });
  }

  window.addEventListener('storechange', update);
  update();

  /* '이벤트 아이콘' 체크박스: 체크인 아이콘 켜기 · 끄기. 타입 js는 이 파일 뒤에 실행되므로 문서가 다 읽힌 뒤 확인 */
  document.addEventListener('DOMContentLoaded', function () {
    if (!window.optionControl.hasCheckin()) return;
    var label = document.createElement('label');
    label.className = 'option-control-check';
    var input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = window.isCheckinOn();
    input.addEventListener('change', function () { window.setCheckin(input.checked); });
    label.appendChild(input);
    label.appendChild(document.createTextNode('이벤트 아이콘'));
    control.insertBefore(label, control.firstChild); /* 맨 앞: 데스크탑 창은 맨 위, 모바일 가로 줄은 맨 왼쪽 */
    window.addEventListener('checkinchange', function (event) { input.checked = event.detail; });
  });
})();
