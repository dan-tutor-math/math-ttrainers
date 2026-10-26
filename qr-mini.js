/* ==========================================================
   qr-mini.js — QR-код ссылки для сопряжения панели тренажёров с доской.

   Своя маленькая реализация, а не библиотека с CDN: все библиотеки сайта
   лежат локальными файлами (CDN у части провайдеров тормозит и держит
   страницу, раздел 8 HANDOFF), а нужен нам один случай — короткая ссылка
   в байтовом режиме. Поэтому только: байтовый режим, уровень коррекции M,
   версии 1–10 (до 213 байт — с большим запасом для адреса с кодом).
   Алгоритм — по стандарту ISO 18004 (как у известной реализации Nayuki):
   данные → блоки Рида — Соломона → размещение змейкой → лучшая из 8 масок.

   window.MathhQR.matrix(text) → массив строк из true/false (тёмный модуль)
   window.MathhQR.svg(text, px) → строка <svg> с полем в 4 модуля
   ========================================================== */
(function(){
  'use strict';
  if (window.MathhQR) return;

  // уровень M, версии 1..10 (индекс 0 не используется)
  const ECC_PER_BLOCK = [0, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26];
  const NUM_BLOCKS    = [0,  1,  1,  1,  2,  2,  4,  4,  4,  5,  5];
  const FORMAT_ECL_M = 0;

  function rawModules(ver){
    let r = (16 * ver + 128) * ver + 64;
    if (ver >= 2){
      const na = Math.floor(ver / 7) + 2;
      r -= (25 * na - 10) * na - 55;
      if (ver >= 7) r -= 36;
    }
    return r;
  }
  function dataCodewords(ver){ return Math.floor(rawModules(ver) / 8) - ECC_PER_BLOCK[ver] * NUM_BLOCKS[ver]; }

  function gfMul(x, y){
    let z = 0;
    for (let i = 7; i >= 0; i--){
      z = (z << 1) ^ ((z >>> 7) * 0x11D);
      z ^= ((y >>> i) & 1) * x;
    }
    return z & 0xFF;
  }
  function rsDivisor(deg){
    const r = [];
    for (let i = 0; i < deg - 1; i++) r.push(0);
    r.push(1);
    let root = 1;
    for (let i = 0; i < deg; i++){
      for (let j = 0; j < r.length; j++){
        r[j] = gfMul(r[j], root);
        if (j + 1 < r.length) r[j] ^= r[j + 1];
      }
      root = gfMul(root, 2);
    }
    return r;
  }
  function rsRemainder(data, div){
    const r = div.map(() => 0);
    for (const b of data){
      const f = b ^ r.shift();
      r.push(0);
      div.forEach((c, i) => { r[i] ^= gfMul(c, f); });
    }
    return r;
  }

  function utf8(text){
    return Array.from(new TextEncoder().encode(text));
  }

  function encode(text){
    const bytes = utf8(text);
    let ver = 1;
    for (; ver <= 10; ver++){
      const cntBits = ver < 10 ? 8 : 16;
      if (4 + cntBits + bytes.length * 8 <= dataCodewords(ver) * 8) break;
    }
    if (ver > 10) throw new Error('QR: слишком длинная строка');
    const cap = dataCodewords(ver) * 8;
    const bits = [];
    const put = (v, n) => { for (let i = n - 1; i >= 0; i--) bits.push((v >>> i) & 1); };
    put(4, 4);
    put(bytes.length, ver < 10 ? 8 : 16);
    bytes.forEach(b => put(b, 8));
    put(0, Math.min(4, cap - bits.length));
    put(0, (8 - bits.length % 8) % 8);
    for (let pad = 0xEC; bits.length < cap; pad ^= 0xEC ^ 0x11) put(pad, 8);
    const data = [];
    for (let i = 0; i < bits.length; i += 8){
      let b = 0; for (let j = 0; j < 8; j++) b = (b << 1) | bits[i + j];
      data.push(b);
    }
    // блоки с кодом коррекции и чередование
    const nb = NUM_BLOCKS[ver], ecl = ECC_PER_BLOCK[ver];
    const raw = Math.floor(rawModules(ver) / 8);
    const nShort = nb - raw % nb, shortLen = Math.floor(raw / nb);
    const div = rsDivisor(ecl);
    const blocks = [];
    for (let i = 0, k = 0; i < nb; i++){
      const dat = data.slice(k, k + shortLen - ecl + (i < nShort ? 0 : 1));
      k += dat.length;
      const ecc = rsRemainder(dat, div);
      if (i < nShort) dat.push(0);
      blocks.push(dat.concat(ecc));
    }
    const out = [];
    for (let i = 0; i < blocks[0].length; i++){
      blocks.forEach((b, j) => { if (i !== shortLen - ecl || j >= nShort) out.push(b[i]); });
    }
    return { ver, codewords: out };
  }

  function build(text){
    const { ver, codewords } = encode(text);
    const size = ver * 4 + 17;
    const mod = [], fn = [];
    for (let y = 0; y < size; y++){ mod.push(new Array(size).fill(false)); fn.push(new Array(size).fill(false)); }
    const setF = (x, y, v) => { mod[y][x] = v; fn[y][x] = true; };
    // служебные узоры
    for (let i = 0; i < size; i++){ setF(6, i, i % 2 === 0); setF(i, 6, i % 2 === 0); }
    [[3, 3], [size - 4, 3], [3, size - 4]].forEach(([cx, cy]) => {
      for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++){
        const d = Math.max(Math.abs(dx), Math.abs(dy)), x = cx + dx, y = cy + dy;
        if (x >= 0 && x < size && y >= 0 && y < size) setF(x, y, d !== 2 && d !== 4);
      }
    });
    if (ver >= 2){
      const na = Math.floor(ver / 7) + 2;
      const step = Math.ceil((ver * 4 + 4) / (na * 2 - 2)) * 2;
      const pos = [6];
      for (let p = size - 7; pos.length < na; p -= step) pos.splice(1, 0, p);
      for (let i = 0; i < na; i++) for (let j = 0; j < na; j++){
        if ((i === 0 && j === 0) || (i === 0 && j === na - 1) || (i === na - 1 && j === 0)) continue;
        for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) setF(pos[i] + dx, pos[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      }
    }
    const drawFormat = (mask) => {
      const d = (FORMAT_ECL_M << 3) | mask;
      let rem = d;
      for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
      const b = ((d << 10) | rem) ^ 0x5412;
      const bit = i => ((b >>> i) & 1) !== 0;
      for (let i = 0; i <= 5; i++) setF(8, i, bit(i));
      setF(8, 7, bit(6)); setF(8, 8, bit(7)); setF(7, 8, bit(8));
      for (let i = 9; i < 15; i++) setF(14 - i, 8, bit(i));
      for (let i = 0; i < 8; i++) setF(size - 1 - i, 8, bit(i));
      for (let i = 8; i < 15; i++) setF(8, size - 15 + i, bit(i));
      setF(8, size - 8, true);
    };
    drawFormat(0);   // резервируем места формата до размещения данных
    if (ver >= 7){
      let rem = ver;
      for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1F25);
      const b = (ver << 12) | rem;
      for (let i = 0; i < 18; i++){
        const v = ((b >>> i) & 1) !== 0, a = size - 11 + i % 3, c = Math.floor(i / 3);
        setF(a, c, v); setF(c, a, v);
      }
    }
    // данные змейкой по парам столбцов снизу вверх и обратно
    let i = 0;
    for (let right = size - 1; right >= 1; right -= 2){
      if (right === 6) right = 5;
      for (let vert = 0; vert < size; vert++){
        for (let j = 0; j < 2; j++){
          const x = right - j, up = ((right + 1) & 2) === 0, y = up ? size - 1 - vert : vert;
          if (!fn[y][x] && i < codewords.length * 8){
            mod[y][x] = ((codewords[i >>> 3] >>> (7 - (i & 7))) & 1) !== 0;
            i++;
          }
        }
      }
    }
    const maskFn = [
      (x, y) => (x + y) % 2 === 0, (x, y) => y % 2 === 0, (x) => x % 3 === 0, (x, y) => (x + y) % 3 === 0,
      (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0, (x, y) => x * y % 2 + x * y % 3 === 0,
      (x, y) => (x * y % 2 + x * y % 3) % 2 === 0, (x, y) => ((x + y) % 2 + x * y % 3) % 2 === 0,
    ];
    const applyMask = (m) => {
      for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!fn[y][x] && maskFn[m](x, y)) mod[y][x] = !mod[y][x];
    };
    // упрощённый штраф (серии, квадраты 2×2, баланс) — любая маска даёт
    // верный код, штраф лишь выбирает ту, что легче читается камерой
    const penalty = () => {
      let p = 0, dark = 0;
      for (let y = 0; y < size; y++){
        let runX = 1, runY = 1;
        for (let x = 0; x < size; x++){
          if (mod[y][x]) dark++;
          if (x > 0){
            if (mod[y][x] === mod[y][x - 1]){ runX++; if (runX === 5) p += 3; else if (runX > 5) p++; } else runX = 1;
            if (mod[x][y] === mod[x - 1][y]){ runY++; if (runY === 5) p += 3; else if (runY > 5) p++; } else runY = 1;
          }
          if (x > 0 && y > 0){
            const c = mod[y][x];
            if (c === mod[y][x - 1] && c === mod[y - 1][x] && c === mod[y - 1][x - 1]) p += 3;
          }
        }
      }
      const k = Math.ceil(Math.abs(dark * 20 - size * size * 10) / (size * size)) - 1;
      return p + Math.max(0, k) * 10;
    };
    let best = 0, bestP = Infinity;
    for (let m = 0; m < 8; m++){
      applyMask(m); drawFormat(m);
      const p = penalty();
      if (p < bestP){ bestP = p; best = m; }
      applyMask(m);   // маска — XOR, второе наложение снимает её
    }
    applyMask(best); drawFormat(best);
    return mod;
  }

  function svg(text, px){
    const m = build(text), n = m.length, q = 4, all = n + 2 * q;
    let d = '';
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (m[y][x]) d += 'M' + (x + q) + ' ' + (y + q) + 'h1v1h-1z';
    const s = px || all * 4;
    // фон всегда белый, модули чёрные: камера телефона плохо читает
    // инвертированный код, а у доски бывает тёмная тема
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + all + ' ' + all + '" width="' + s + '" height="' + s + '" shape-rendering="crispEdges">' +
      '<rect width="' + all + '" height="' + all + '" fill="#fff"/><path d="' + d + '" fill="#000"/></svg>';
  }

  window.MathhQR = { matrix: build, svg };
})();
