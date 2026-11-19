/* ==========================================================
   MDS Motion tokens (JS)
   - 값은 mds-motion.css 와 동일 (CSS 수정 시 함께 수정)
   - 토큰명은 MDS Motion description 가이드 표기를 그대로 따름
     예) mds.motion.power3.easeInOut, mds.motion.spring.bouncy
   - duration 은 토큰이 아님 → 사용하는 쪽에서 직접 지정

   사용 예)
     el.animate(keyframes, { duration: 400, easing: mds.motion.power3.easeInOut.css });
     el.style.transition = `transform .4s ${mds.motion.power2.easeOut}`;  // 문자열로 쓰면 css 값

   Motion(framer-motion vanilla) 과 함께 쓰기 — mds.motion.transition(token, duration?)
     Motion.animate(el, { y: -14 }, mds.motion.transition(mds.motion.spring.bouncy));
     Motion.animate(el, { opacity: 0 }, mds.motion.transition(mds.motion.linear, 0.2));
   ========================================================== */
(function () {
  'use strict';

  /* ---------- Bezier (시간 기반 · duration 과 함께) ---------- */
  function bezier(x1, y1, x2, y2) {
    const css = `cubic-bezier(${x1}, ${y1}, ${x2}, ${y2})`;
    return { cubicBezier: [x1, y1, x2, y2], css, toString: () => css };
  }

  function power(inOut, out, inn) {
    return { easeInOut: bezier(...inOut), easeOut: bezier(...out), easeIn: bezier(...inn) };
  }

  /* ---------- Spring (물리 스프링 · 플랫폼별 파라미터) ----------
     web: stiffness/damping · ios: time(s)/dampingRatio · android: stiffness/dampingRatio
     fallbackBezier: spring 미지원 환경용 (가이드에 명시된 값만 기입, 나머지 null) */
  function spring(web, ios, android, fallbackBezier = null) {
    return {
      web: { stiffness: web[0], damping: web[1] },
      ios: { time: ios[0], dampingRatio: ios[1] },
      android: { stiffness: android[0], dampingRatio: android[1] },
      fallbackBezier,
    };
  }

  const motion = {
    linear: bezier(0, 0, 1, 1),
    ease: bezier(0.25, 0.1, 0.25, 1),
    back: { easeOut: bezier(0.34, 1.56, 0.64, 1) },

    power1: power([0.33, 0, 0.67, 1], [0.5, 1, 0.89, 1], [0.11, 0, 0.5, 0]),
    power2: power([0.6, 0, 0.4, 1], [0.25, 1, 0.5, 1], [0.5, 0, 0.75, 0]),
    power3: power([0.33, 0, 0.2, 1], [0.22, 1, 0.36, 1], [0.65, 0, 1, 0.8]),
    power4: power([0.6, 0, 0.1, 1], [0.19, 1, 0.22, 1], [0.9, 0, 1, 0.9]),

    spring: {
      fast: spring([986, 47], [0.3, 0.75], [1200, 0.75]),
      normal: spring([815, 54], [0.3, 1], [1200, 1]),
      slow: spring([246, 31], [0.6, 1], [400, 1]),
      gentle: spring([438, 40], [0.45, 1], [700, 1]),
      bouncy: spring([322, 26], [0.5, 0.75], [600, 0.75], { cubicBezier: [0.22, 1, 0.36, 1], duration: 0.35 }),
      elastic: spring([550, 24], [0.6, 0.5], [400, 0.5]),
    },
  };

  function deepFreeze(obj) {
    Object.values(obj).forEach((v) => {
      if (v && typeof v === 'object') deepFreeze(v);
    });
    return Object.freeze(obj);
  }

  /* ---------- Motion 용 transition 변환 ----------
     spring 토큰 → { type: 'spring', stiffness, damping } (framer-motion 값 그대로, mass 기본 1)
     bezier 토큰 → { ease: [x1, y1, x2, y2], duration(s) } */
  function transition(token, duration) {
    if (token && token.web) {
      return { type: 'spring', stiffness: token.web.stiffness, damping: token.web.damping };
    }
    if (token && token.cubicBezier) {
      if (typeof duration !== 'number') throw new Error('mds.motion.transition: bezier 토큰은 duration(초)이 필요합니다.');
      return { ease: [...token.cubicBezier], duration };
    }
    throw new Error('mds.motion.transition: 알 수 없는 토큰입니다.');
  }

  window.mds = Object.freeze({
    ...(window.mds || {}),
    motion: Object.freeze({ ...deepFreeze(motion), transition }),
  });
})();
