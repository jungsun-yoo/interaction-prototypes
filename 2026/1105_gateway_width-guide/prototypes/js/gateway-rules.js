// 게이트웨이 너비 규칙. 화면을 그리지 않고 값만 계산 (목록의 경고 표시용)
// 선택한 화면의 실측은 gateway.html 이 직접 계산해 postMessage 로 보냄

// 하단 줄이 줄지 않는 최소 너비: 여백 16 + 오프라인 120 + 8 + 서비스 96 + 8 + 닫기 38.5 + 여백 8 ≈ 294.5
export const BOTTOM_ROW_MIN_WIDTH = 295;

// 게이트웨이 높이(상태바 덮는 여백 제외) 계산식. gateway.html 구조와 같은 값
// 상단 12 + 스토어 5행(2열, 507:168) + 행간 16 + 띠배너(4 + 343:56) + 광고(4 + 343:193) + 하단 줄 46
const gatewayHeight = (width, visibleSlots) => {
  const cell = (width - 36) / 2;
  const inner = width - 32;
  return 12 + 5 * (cell * 168 / 507) + 16 + 46
    + (visibleSlots.has('strip') ? 4 + inner * 56 / 343 : 0)
    + (visibleSlots.has('ad') ? 4 + inner * 193 / 343 : 0);
};

// AS-IS 너비 규칙: 441 미만 100%, 441 이상 320
const baseGatewayWidth = (viewportWidth) => (viewportWidth < 441 ? viewportWidth : 320);

// TO-BE 너비: 높이가 최대높이를 넘으면 높이 기준으로 역산해 정수 내림 (높이는 너비의 1차식)
export const tobeGatewayWidth = (viewportWidth, usableHeight, visibleSlots, ratio) => {
  const base = baseGatewayWidth(viewportWidth);
  const limit = usableHeight * ratio;
  if (gatewayHeight(base, visibleSlots) <= limit) return base;
  const intercept = gatewayHeight(0, visibleSlots);
  const slope = gatewayHeight(1, visibleSlots) - intercept;
  return Math.floor((limit - intercept) / slope);
};
