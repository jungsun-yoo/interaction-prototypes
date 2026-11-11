/* optioncontrol.js — 프로토타입 옵션 컨트롤: 빅배너 윗부분에 고정으로 뜨는 전문관 전환 버튼 (모양·위치는 optioncontrol.css)
   버튼을 누르면 window.setStore(common.js)로 전문관을 바꾸고, 주소의 ?store=도 바꿔 새로고침해도 그 전문관으로 열림
   필요: common.js (setStore) / 선택 표시는 'storechange'로 맞춤 */
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

  var phone = document.querySelector('.phone');
  if (!phone || !window.setStore) return;

  var control = document.createElement('div');
  control.className = 'option-control';
  control.setAttribute('role', 'group');
  control.setAttribute('aria-label', '전문관 선택');

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
  phone.appendChild(control);

  function select(id) {
    if (id === phone.dataset.store) return;
    var url = new URL(location.href);
    url.searchParams.set('store', id);
    history.replaceState(null, '', url);
    window.setStore(id);
  }

  function update() {
    var current = phone.dataset.store;
    buttons.forEach(function (button) {
      var active = button.dataset.store === current;
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
      if (active) {
        var left = button.offsetLeft - (control.clientWidth - button.offsetWidth) / 2;
        control.scrollTo({ left: left, behavior: 'smooth' }); /* 선택한 버튼을 가운데로 */
      }
    });
  }

  window.addEventListener('storechange', update);
  update();
})();
