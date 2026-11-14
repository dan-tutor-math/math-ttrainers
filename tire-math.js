/* Общая арифметика модели и заданий: сотые мм не теряют точность при
   округлении процента ровно посередине между двумя десятыми. */
(function () {
  'use strict';
  const h100 = t => t.width * t.profile;
  const rim100 = t => t.rim * 2540;
  const d100 = t => rim100(t) + 2 * h100(t);
  function compare(a, b) {
    const d1 = d100(a), d2 = d100(b), delta = d2 - d1, dd = Math.abs(delta);
    return { d1, d2, delta, diff100: dd,
      percent10: Math.floor((2 * dd * 1000 + d1) / (2 * d1)),
      signedPercent10: Math.sign(delta) * Math.floor((2 * dd * 1000 + d1) / (2 * d1)),
      raw1000: Math.floor(dd * 100000 / d1), remainder: (dd * 100000) % d1 };
  }
  const fmt = n => String(n).replace('.', ',');
  const mark = t => `${t.width}/${t.profile} R${t.rim}`;
  const values = t => ({ H: h100(t) / 100, d: rim100(t) / 100, D: d100(t) / 100, B: t.width });
  window.TireMath = Object.freeze({ h100, rim100, d100, compare, fmt, mark, values });
})();
