/* ═══════════════════════════════════════════════════════════════════════
   board-boxes.js — объекты «как в презентации» (промпт №97): блок
   (фигура с текстом), таблица и поворот картинок. HANDOFF.md, раздел 6в.

   Зачем. Импорт PPTX «полностью» должен давать на слайде то же, что в
   PowerPoint: надписи с разным оформлением внутри одного абзаца, списки,
   залитые фигуры, повёрнутые картинки, таблицы — и всё это двигается и
   правится. Обычные объекты доски этого не умеют, поэтому здесь два новых
   вида объекта. Это не отдельный редактор: блок и таблица живут в
   B.objects наравне со штрихами, их двигают, копируют, отменяют, стирают,
   передают ученику и в облако тем же кодом доски. boards-core.js зовёт
   отсюда только хуки (через typeof — без этого файла доска работает как
   раньше, новые объекты просто не рисуются).

   Модель (подробно — HANDOFF 6в):
   - блок: { type:'box', points:[левый верхний угол без поворота], w, h,
     rot (градусы по часовой, вокруг середины), flipH, flipV,
     geom (имя фигуры PowerPoint: rect, roundRect, ellipse… или 'path'),
     adj (параметры фигуры), path (свой контур), fill, line, text }
   - таблица: { type:'table', points, w, h, rot, cols:[ширины], rows:[высоты],
     cells:[[{ text, fill, bd, gs, rs, hm, vm }]] } — строка растёт под текст
   - text: { paras:[{ runs:[{ t, b, i, u, s, c, sz, f, hl, bl }], al, ind,
     fi, sb, sa, ls, bu, lvl, esz }], anchor, pad, fit }
   Размеры — в единицах доски (px при масштабе 100 %). Шрифт f хранится
   как в PowerPoint (Calibri, Arial…), а рисуется своим файлом из fonts/:
   у учителя и ученика одни и те же метрики, иначе строки переносились бы
   по-разному.
   ═══════════════════════════════════════════════════════════════════════ */

/* ── 1. Шрифты ─────────────────────────────────────────────────────────
   Свои имена (MX …), а не «Arial» и «Calibri»: зарегистрируй мы шрифт с
   именем Arial — им стал бы рисоваться весь сайт там, где Arial стоит в
   запасном списке. Файлы — fontsource (OFL), подмножества по алфавитам:
   браузер качает только те, чьи буквы реально нужны. */
const BX_RANGES = {
  'latin': 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD',
  'latin-ext': 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF',
  'cyrillic': 'U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116',
  'greek': 'U+0370-0377,U+037A-037F,U+0384-038A,U+038C,U+038E-03A1,U+03A3-03FF',
};
// семейство → из какого пакета каждое подмножество (у Caladea и PT нет
// части алфавитов — берём у соседа с похожим рисунком)
const BX_FACES = {
  'MX Carlito': { latin: 'carlito', 'latin-ext': 'carlito', cyrillic: 'carlito', greek: 'carlito' },
  'MX Caladea': { latin: 'caladea', 'latin-ext': 'caladea', cyrillic: 'tinos', greek: 'tinos' },
  'MX Arimo':   { latin: 'arimo', 'latin-ext': 'arimo', cyrillic: 'arimo', greek: 'arimo' },
  'MX Tinos':   { latin: 'tinos', 'latin-ext': 'tinos', cyrillic: 'tinos', greek: 'tinos' },
  'MX Cousine': { latin: 'cousine', 'latin-ext': 'cousine', cyrillic: 'cousine', greek: 'cousine' },
  'MX PT Sans': { latin: 'pt-sans', 'latin-ext': 'pt-sans', cyrillic: 'pt-sans', greek: 'arimo' },
  'MX PT Serif':{ latin: 'pt-serif', 'latin-ext': 'pt-serif', cyrillic: 'pt-serif', greek: 'tinos' },
};
// имена из PowerPoint → наш файл. Calibri ↔ Carlito, Cambria ↔ Caladea,
// Arial ↔ Arimo, Times ↔ Tinos, Courier ↔ Cousine совпадают по ширине букв
// один в один; остальное — ближайшее по виду
const BX_FONT_MAP = {
  'calibri': 'MX Carlito', 'calibri light': 'MX Carlito', 'carlito': 'MX Carlito', 'segoe ui': 'MX Carlito', 'candara': 'MX Carlito', 'corbel': 'MX Carlito',
  'cambria': 'MX Caladea', 'cambria math': 'MX Caladea', 'caladea': 'MX Caladea', 'constantia': 'MX Caladea',
  'arial': 'MX Arimo', 'arimo': 'MX Arimo', 'helvetica': 'MX Arimo', 'helvetica neue': 'MX Arimo', 'liberation sans': 'MX Arimo',
  'verdana': 'MX Arimo', 'tahoma': 'MX Arimo', 'trebuchet ms': 'MX Arimo', 'century gothic': 'MX Arimo', 'franklin gothic medium': 'MX Arimo',
  'open sans': 'MX Arimo', 'roboto': 'MX Arimo', 'montserrat': 'MX Arimo', 'arial narrow': 'MX Arimo', 'arial black': 'MX Arimo', 'onest': 'MX Arimo',
  'times new roman': 'MX Tinos', 'times': 'MX Tinos', 'tinos': 'MX Tinos', 'liberation serif': 'MX Tinos', 'georgia': 'MX Tinos',
  'garamond': 'MX Tinos', 'book antiqua': 'MX Tinos', 'palatino linotype': 'MX Tinos',
  'courier new': 'MX Cousine', 'courier': 'MX Cousine', 'cousine': 'MX Cousine', 'consolas': 'MX Cousine', 'lucida console': 'MX Cousine', 'liberation mono': 'MX Cousine',
  'pt sans': 'MX PT Sans', 'pt sans narrow': 'MX PT Sans', 'pt serif': 'MX PT Serif',
};
// что предлагать в списке шрифтов при правке
const BX_FONT_MENU = ['Calibri', 'Arial', 'Times New Roman', 'Cambria', 'Courier New', 'PT Sans', 'PT Serif'];
const BX_DEF_FONT = 'Calibri';
function bxFace(f){
  const k = String(f || BX_DEF_FONT).trim().toLowerCase();
  if (BX_FONT_MAP[k]) return BX_FONT_MAP[k];
  if (/mono|courier|consol|code/.test(k)) return 'MX Cousine';
  if (/serif|times|roman|garamond|georgia|antiqua|palatino|book|bodoni|didot/.test(k) && !/sans/.test(k)) return 'MX Tinos';
  return 'MX Arimo';
}
// имя для сохранения, когда в редакторе остался только наш файл
function bxFaceName(face){
  for (const n of BX_FONT_MENU) if (bxFace(n) === face) return n;
  return BX_DEF_FONT;
}
let bxFontsOn = false;
function bxRegisterFonts(){
  if (bxFontsOn || typeof FontFace !== 'function' || !document.fonts) return;
  bxFontsOn = true;
  Object.keys(BX_FACES).forEach(fam => {
    const by = BX_FACES[fam];
    Object.keys(by).forEach(sub => {
      [['400', 'normal'], ['700', 'normal'], ['400', 'italic'], ['700', 'italic']].forEach(([w, st]) => {
        try {
          const ff = new FontFace(fam, `url(fonts/${by[sub]}-${sub}-${w}-${st}.woff2) format("woff2")`,
            { weight: w, style: st, unicodeRange: BX_RANGES[sub], display: 'swap' });
          document.fonts.add(ff);
        } catch (e) {}
      });
    });
  });
}
// холст сам шрифт не скачает — просим явно; пока качается, рисуем запасным,
// а когда пришёл — перемеряем раскладку (bxFontEpoch входит в ключ кэша)
let bxFontEpoch = 0;
const bxFontAsked = new Set();
function bxScript(t){ return /[Ѐ-ӿ]/.test(t) ? 'c' : /[Ͱ-Ͽ]/.test(t) ? 'g' : 'l'; }
function bxCss(r, px){ return (r.i ? 'italic ' : '') + (r.b ? '700 ' : '400 ') + Math.max(0.5, px).toFixed(2) + 'px "' + bxFace(r.f) + '", sans-serif'; }
function bxNeedFont(r, text){
  bxRegisterFonts();
  if (!document.fonts || !document.fonts.load) return;
  const key = bxFace(r.f) + (r.b ? 'b' : '') + (r.i ? 'i' : '') + bxScript(text || '');
  if (bxFontAsked.has(key)) return;
  bxFontAsked.add(key);
  document.fonts.load(bxCss(r, 16), (text || 'Aa').slice(0, 60) + ' Aa').then(() => {
    bxFontEpoch++;
    bxMetricCache.clear();
    if (typeof scheduleRedraw === 'function') scheduleRedraw();
    if (typeof deckThumbsInvalidate === 'function') deckThumbsInvalidate();
  }, () => {});
}
// дождаться всех шрифтов объектов — перед выгрузкой в PNG/PDF и миниатюрами
function bxFontsReady(objs){
  bxRegisterFonts();
  const list = [];
  (objs || []).forEach(o => bxEachText(o, tx => tx.paras.forEach(p => (p.runs || []).forEach(r => {
    if (document.fonts && document.fonts.load) list.push(document.fonts.load(bxCss(r, 16), (r.t || 'Aa').slice(0, 60)).catch(() => {}));
  }))));
  return Promise.all(list).then(() => { bxFontEpoch++; bxMetricCache.clear(); });
}

/* ── 2. Мелочи ───────────────────────────────────────────────────────── */
function bxHex(c){
  if (!c) return null;
  const m = /^#?([0-9a-f]{6})$/i.exec(String(c).trim());
  return m ? '#' + m[1].toUpperCase() : null;
}
function bxRgba(c, a){
  const h = bxHex(c);
  if (!h) return c || '#000';
  const n = parseInt(h.slice(1), 16);
  return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + (a == null ? 1 : a) + ')';
}
function bxLuma(c){
  const h = bxHex(c);
  if (!h) return 1;
  const n = parseInt(h.slice(1), 16);
  return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
}
function bxCssColorToHex(s){
  const m = /rgba?\(\s*(\d+)[ ,]+(\d+)[ ,]+(\d+)(?:[ ,/]+([\d.]+))?/.exec(s || '');
  if (!m) return bxHex(s);
  if (m[4] !== undefined && +m[4] === 0) return null;
  return '#' + [m[1], m[2], m[3]].map(v => (+v).toString(16).padStart(2, '0')).join('').toUpperCase();
}
function bxClone(o){ return JSON.parse(JSON.stringify(o)); }
function bxIsFrame(o){ return !!o && (o.type === 'box' || o.type === 'table' || (o.type === 'image' && !!o.rot)); }
function bxCenter(o){ const p = o.points[0], s = bxSize(o); return { x: p.x + s.w / 2, y: p.y + s.h / 2 }; }
function bxSize(o){ return o.type === 'table' ? bxTableLayout(o).size : { w: o.w || 1, h: o.h || 1 }; }
function bxRotPt(p, c, deg){
  if (!deg) return { x: p.x, y: p.y };
  const a = deg * Math.PI / 180, s = Math.sin(a), k = Math.cos(a);
  const dx = p.x - c.x, dy = p.y - c.y;
  return { x: c.x + dx * k - dy * s, y: c.y + dx * s + dy * k };
}
// точка мира → координаты внутри рамки (0..w, 0..h, без поворота)
function bxToLocal(o, pt){
  const c = bxCenter(o), s = bxSize(o);
  const q = bxRotPt(pt, c, -(o.rot || 0));
  return { x: q.x - c.x + s.w / 2, y: q.y - c.y + s.h / 2 };
}
function bxCorners(o){
  const p = o.points[0], s = bxSize(o), c = bxCenter(o), r = o.rot || 0;
  return [{ x: p.x, y: p.y }, { x: p.x + s.w, y: p.y }, { x: p.x + s.w, y: p.y + s.h }, { x: p.x, y: p.y + s.h }].map(q => bxRotPt(q, c, r));
}
// обход всех текстов объекта (у таблицы — по ячейкам)
function bxEachText(o, fn){
  if (!o) return;
  if (o.type === 'box' && o.text && Array.isArray(o.text.paras)) fn(o.text, o);
  if (o.type === 'table' && Array.isArray(o.cells)) o.cells.forEach(row => row.forEach(cell => { if (cell && cell.text && Array.isArray(cell.text.paras)) fn(cell.text, cell); }));
}
// грубая подпись текста для миниатюр слайдов (deckRefreshThumbs): правка
// текста без сдвига рамки тоже должна перерисовать миниатюру
function bxSig(o){
  if (o.type !== 'box' && o.type !== 'table') return (o.rot || 0) * 17;
  let n = (o.rot || 0) * 17 + (o.fill && o.fill.c ? o.fill.c.charCodeAt(2) : 0);
  bxEachText(o, tx => { const t = bxPlainText(tx); n += t.length * 13 + (t.charCodeAt(0) || 0) + (t.charCodeAt(t.length - 1) || 0) * 3; });
  return n;
}
function bxPlainText(tx){
  return tx && Array.isArray(tx.paras) ? tx.paras.map(p => (p.runs || []).map(r => r.t || '').join('')).join('\n') : '';
}
// новый текст: один абзац, один кусок
function bxTextOf(str, props){
  const base = Object.assign({ sz: 32, c: '#1D1D1F', f: BX_DEF_FONT }, props || {});
  // def — оформление пустого текста: чем печатать в пустой ячейке или надписи
  return { paras: String(str || '').split('\n').map(line => ({ runs: line ? [Object.assign({}, base, { t: line })] : [], esz: base.sz })), anchor: 't', pad: [10, 5, 10, 5], def: base };
}

/* ── 3. Раскладка форматированного текста ───────────────────────────────
   Своя, а не DOM: текст рисуется на холсте доски (и в миниатюрах, и у
   ученика, и в PNG/PDF). Абзацы → строки → куски одинакового оформления.
   Перенос по словам, длинное слово рвётся по буквам. Высота строки — по
   метрикам шрифта (как в PowerPoint «одинарный» = восходящие + нисходящие),
   умноженным на межстрочный интервал абзаца. */
const bxMeasureCv = document.createElement('canvas');
const bxMeasure = bxMeasureCv.getContext('2d');
const bxMetricCache = new Map();
function bxMetrics(r){
  const key = bxFace(r.f) + (r.b ? 'b' : '') + (r.i ? 'i' : '');
  let m = bxMetricCache.get(key);
  if (m) return m;
  bxMeasure.font = bxCss(r, 100);
  const t = bxMeasure.measureText('HgЙу');
  const asc = (t.fontBoundingBoxAscent || t.actualBoundingBoxAscent * 1.12 || 92) / 100;
  const desc = (t.fontBoundingBoxDescent || t.actualBoundingBoxDescent * 1.3 || 24) / 100;
  m = { asc, desc };
  bxMetricCache.set(key, m);
  return m;
}
function bxW(r, px, text){ bxMeasure.font = bxCss(r, px); return bxMeasure.measureText(text).width; }

const BX_ROMAN = [[1000, 'm'], [900, 'cm'], [500, 'd'], [400, 'cd'], [100, 'c'], [90, 'xc'], [50, 'l'], [40, 'xl'], [10, 'x'], [9, 'ix'], [5, 'v'], [4, 'iv'], [1, 'i']];
function bxRoman(n){ let s = ''; BX_ROMAN.forEach(([v, r]) => { while (n >= v){ s += r; n -= v; } }); return s; }
function bxAlpha(n){ let s = ''; while (n > 0){ n--; s = String.fromCharCode(97 + n % 26) + s; n = Math.floor(n / 26); } return s; }
// схемы нумерации PowerPoint (a:buAutoNum type)
function bxNumText(type, n){
  const t = String(type || 'arabicPeriod');
  let core = t.startsWith('roman') ? bxRoman(n) : t.startsWith('alpha') ? bxAlpha(n) : String(n);
  if (/Uc/.test(t)) core = core.toUpperCase();
  if (/ParenBoth/.test(t)) return '(' + core + ')';
  if (/ParenR/.test(t)) return core + ')';
  if (/Plain/.test(t)) return core;
  return core + '.';
}

function bxLayout(tx, innerW, scale){ return bxLayoutRaw(tx, innerW, scale || 1); }
function bxLayoutRaw(tx, innerW, scale){
  const lines = [];
  let y = 0, maxW = 0;
  const counters = [];
  const paras = (tx && tx.paras) || [];
  const lsK = scale < 1 ? Math.max(0.8, scale) : 1;   // автоуменьшение ужимает и интервал
  paras.forEach((p, pi) => {
    const runs = (p.runs || []).filter(r => r && typeof r.t === 'string');
    const lvl = p.lvl || 0;
    // нумерация: одна и та же глубина подряд продолжает счёт, мельче — свой
    // счёт, ненумерованный абзац той же глубины начинает заново
    counters.length = Math.min(counters.length, lvl + 1);
    let bulletText = null;
    if (p.bu && p.bu.num){
      counters[lvl] = (counters[lvl] || ((p.bu.start || 1) - 1)) + 1;
      bulletText = bxNumText(p.bu.num, counters[lvl]);
    } else {
      counters[lvl] = 0;
      if (p.bu && p.bu.ch) bulletText = p.bu.ch;
    }
    const first = runs.find(r => r.t.length) || runs[0] || { sz: p.esz || 24, f: BX_DEF_FONT, c: '#000000' };
    const ind = (p.ind || 0), fi = (p.fi || 0);
    if (pi > 0) y += (p.sb || 0) * lsK;
    // куски → слова и пробелы с замеренной шириной
    const toks = [];
    runs.forEach(r => {
      const sz = (r.sz || 24) * scale * (r.bl ? 0.66 : 1);
      if (r.t) bxNeedFont(r, r.t);
      r.t.split(/(\n|[ \t ]+)/).forEach(part => {
        if (!part) return;
        if (part === '\n'){ toks.push({ br: true, r, sz }); return; }
        const sp = /^[ \t ]+$/.test(part);
        toks.push({ t: part.replace(/\t/g, '    '), r, sz, sp, w: bxW(r, sz, part.replace(/\t/g, '    ')) });
      });
    });
    let bullet = null, bulletW = 0;
    if (bulletText != null){
      const bsz = (first.sz || 24) * scale * (p.bu.sz || 1);
      const br = { f: p.bu.f || first.f, b: p.bu.num ? first.b : false, i: false };
      bulletW = bxW(br, bsz, bulletText) + bsz * 0.35;
      bullet = { t: bulletText, r: br, sz: bsz, c: p.bu.c || first.c || '#000000' };
      bxNeedFont(br, bulletText);
    }
    // первая строка: с маркером — маркер на ind+fi, текст на ind (если
    // маркер там помещается), иначе сразу за маркером
    const firstX = bullet ? Math.max(ind, ind + fi + bulletW) : ind + fi;
    let line = null;
    const newLine = (isFirst) => {
      line = { x0: isFirst ? firstX : ind, segs: [], w: 0, asc: 0, desc: 0, para: pi, al: p.al || 'l', last: false };
      if (isFirst && bullet) line.bullet = { x: ind + fi, t: bullet.t, r: bullet.r, sz: bullet.sz, c: bullet.c };
      lines.push(line);
    };
    const avail = () => Math.max(1, innerW - line.x0);
    const metricOf = (r, sz) => { const m = bxMetrics(r); line.asc = Math.max(line.asc, m.asc * sz / (r.bl ? 0.66 : 1)); line.desc = Math.max(line.desc, m.desc * sz / (r.bl ? 0.66 : 1)); };
    const put = (t, r, sz, w, sp) => {
      const last = line.segs[line.segs.length - 1];
      if (last && last.r === r && last.sz === sz && !sp === !last.sp){ last.t += t; last.w += w; }
      else line.segs.push({ x: line.w, t, r, sz, w, sp });
      line.w += w;
      metricOf(r, sz);
    };
    newLine(true);
    let i = 0;
    while (i < toks.length){
      const tk = toks[i];
      if (tk.br){ metricOf(tk.r, tk.sz); newLine(false); i++; continue; }
      if (tk.sp){
        if (line.segs.length) put(tk.t, tk.r, tk.sz, tk.w, true);
        i++; continue;
      }
      const room = avail() - line.w;
      if (tk.w <= room + 0.01 || !line.segs.length){
        if (tk.w <= avail() + 0.01 || line.segs.length){
          if (tk.w > room + 0.01 && line.segs.length){ newLine(false); continue; }
          put(tk.t, tk.r, tk.sz, tk.w, false); i++; continue;
        }
        // слово длиннее строки — по буквам
        let cut = 1;
        while (cut < tk.t.length && bxW(tk.r, tk.sz, tk.t.slice(0, cut + 1)) <= avail()) cut++;
        put(tk.t.slice(0, cut), tk.r, tk.sz, bxW(tk.r, tk.sz, tk.t.slice(0, cut)), false);
        const rest = tk.t.slice(cut);
        toks[i] = { t: rest, r: tk.r, sz: tk.sz, w: bxW(tk.r, tk.sz, rest) };
        newLine(false);
        continue;
      }
      newLine(false);
    }
    // строки абзаца: высота, выравнивание; пустой абзац — по размеру конца
    const pLines = lines.filter(l => l.para === pi);
    pLines.forEach((l, k) => {
      if (!l.segs.length && !l.asc){ const m = bxMetrics(first), sz = (p.esz || first.sz || 24) * scale; l.asc = m.asc * sz; l.desc = m.desc * sz; }
      if (l.bullet){ const m = bxMetrics(l.bullet.r); l.asc = Math.max(l.asc, m.asc * l.bullet.sz); l.desc = Math.max(l.desc, m.desc * l.bullet.sz); }
      // хвостовые пробелы не входят в ширину строки
      while (l.segs.length && l.segs[l.segs.length - 1].sp){ l.w -= l.segs.pop().w; }
      const nat = l.asc + l.desc;
      let h = nat;
      if (p.lsPx) h = p.lsPx * scale;
      else if (p.ls) h = nat * p.ls * lsK;
      // лишнее (или недостающее) место интервала — сверху строки, как в PowerPoint
      l.h = h; l.base = h - l.desc;
      l.y = y; y += h;
      l.last = k === pLines.length - 1;
      const free = Math.max(0, innerW - l.x0 - l.w);
      l.dx = l.al === 'c' ? free / 2 : l.al === 'r' ? free : 0;
      l.gap = 0;
      if ((l.al === 'j' || l.al === 'd') && !l.last){
        const n = l.segs.filter(s => s.sp).length;
        if (n) l.gap = free / n;
      }
      maxW = Math.max(maxW, l.x0 + l.w + l.dx);
    });
    y += (p.sa || 0) * lsK;
  });
  return { lines, h: y, w: maxW };
}
// раскладка текста в рамке: поля, автоуменьшение, прижим
// кэш — по самому объекту текста: правка текста всегда заменяет его новым
// (редактор, отмена, сообщение от учителя), а размер рамки — в ключе
const bxFrameCache = new WeakMap();
function bxTextFrame(tx, w, h){
  const key = w.toFixed(2) + '|' + h.toFixed(2) + '|' + bxFontEpoch;
  const hit = tx && bxFrameCache.get(tx);
  if (hit && hit.key === key) return hit.fr;
  const fr = bxTextFrameRaw(tx, w, h);
  if (tx) bxFrameCache.set(tx, { key, fr });
  return fr;
}
function bxTextFrameRaw(tx, w, h){
  const pad = (tx && tx.pad) || [10, 5, 10, 5];
  const iw = Math.max(4, w - pad[0] - pad[2]), ih = Math.max(4, h - pad[1] - pad[3]);
  const wrapW = tx && tx.wrap === false ? 1e6 : iw;
  let scale = 1, lay = bxLayout(tx, wrapW, 1);
  if (tx && tx.fit === 'shrink' && lay.h > ih + 0.5){
    let lo = 0.25, hi = 1;
    for (let k = 0; k < 7; k++){
      const mid = (lo + hi) / 2;
      if (bxLayout(tx, wrapW, +mid.toFixed(3)).h > ih) hi = mid; else lo = mid;
    }
    scale = +lo.toFixed(3);
    lay = bxLayout(tx, wrapW, scale);
  }
  const anchor = (tx && tx.anchor) || 't';
  const oy = pad[1] + (anchor === 'm' ? (ih - lay.h) / 2 : anchor === 'b' ? ih - lay.h : 0);
  return { lay, ox: pad[0], oy, iw: wrapW, scale };
}
// рисование раскладки; (x0, y0) — левый верх области текста в координатах c,
// z — экранных пикселей на единицу доски
function bxDrawLayout(c, lay, x0, y0, z, iw){
  c.textBaseline = 'alphabetic';
  c.textAlign = 'left';
  lay.lines.forEach(l => {
    const by = y0 + (l.y + l.base) * z;
    if (l.bullet){
      c.font = bxCss(l.bullet.r, l.bullet.sz * z);
      c.fillStyle = l.bullet.c || '#000';
      c.fillText(l.bullet.t, x0 + (l.bullet.x + (l.al === 'r' || l.al === 'c' ? 0 : 0)) * z, by);
    }
    let gapAcc = 0;
    l.segs.forEach(s => {
      const r = s.r;
      const sx = x0 + (l.x0 + l.dx + s.x + gapAcc) * z;
      if (s.sp){
        // подчёркивание, зачёркивание и заливка текста идут и под пробелами
        const ww = (s.w + l.gap) * z, by2 = by;
        if (r.hl){ c.fillStyle = bxRgba(r.hl, 1); c.fillRect(sx, y0 + l.y * z, ww, l.h * z); }
        if (r.u || r.s){
          c.save(); c.strokeStyle = r.c || '#000000'; c.lineWidth = Math.max(0.6, s.sz * z * 0.06); c.beginPath();
          if (r.u){ const uy = by2 + s.sz * z * 0.12; c.moveTo(sx, uy); c.lineTo(sx + ww, uy); }
          if (r.s){ const sy = by2 - s.sz * z * 0.28; c.moveTo(sx, sy); c.lineTo(sx + ww, sy); }
          c.stroke(); c.restore();
        }
        gapAcc += l.gap; return;
      }
      const w = s.w * z;
      const shift = r.bl === 'sup' ? -s.sz * 0.6 : r.bl === 'sub' ? s.sz * 0.25 : 0;
      if (r.hl){
        c.fillStyle = bxRgba(r.hl, 1);
        c.fillRect(sx, y0 + l.y * z, w + (gapAcc ? 0 : 0), l.h * z);
      }
      c.font = bxCss(r, s.sz * z);
      c.fillStyle = r.c || '#000000';
      c.fillText(s.t, sx, by + shift * z);
      if (r.u || r.s){
        c.save();
        c.strokeStyle = r.c || '#000000';
        c.lineWidth = Math.max(0.6, s.sz * z * 0.06);
        c.beginPath();
        if (r.u){ const uy = by + shift * z + s.sz * z * 0.12; c.moveTo(sx, uy); c.lineTo(sx + w, uy); }
        if (r.s){ const sy = by + shift * z - s.sz * z * 0.28; c.moveTo(sx, sy); c.lineTo(sx + w, sy); }
        c.stroke();
        c.restore();
      }
    });
  });
}

/* ── 4. Фигуры ──────────────────────────────────────────────────────────
   Контур фигуры по имени PowerPoint (prstGeom) в координатах рамки
   0..w × 0..h. Список — то, что встречается в школьных презентациях:
   прямоугольники, овалы, многоугольники, стрелки, звёзды, выноски,
   скобки, математические знаки, блок-схемы. Незнакомое имя рисуется
   прямоугольником, но имя сохраняется — при выгрузке в PPTX фигура
   вернётся настоящей. Подпуть: { cmds:[['M',x,y],['L',..],['C',..],['Q',..],['Z']],
   fill, stroke }. Параметры adj — в стотысячных, как в файле. */
const BX_K = 0.5522847498;
function bxA(o, name, def){ const a = o.adj && o.adj[name]; return (typeof a === 'number' ? a : def) / 100000; }
function bxPoly(pts, extra){ const cmds = pts.map((p, i) => [i ? 'L' : 'M', p[0], p[1]]); cmds.push(['Z']); return Object.assign({ cmds, fill: true, stroke: true }, extra || {}); }
function bxEllipseCmds(cx, cy, rx, ry){
  const kx = rx * BX_K, ky = ry * BX_K;
  return [['M', cx + rx, cy], ['C', cx + rx, cy + ky, cx + kx, cy + ry, cx, cy + ry], ['C', cx - kx, cy + ry, cx - rx, cy + ky, cx - rx, cy],
    ['C', cx - rx, cy - ky, cx - kx, cy - ry, cx, cy - ry], ['C', cx + kx, cy - ry, cx + rx, cy - ky, cx + rx, cy], ['Z']];
}
function bxArcPts(cx, cy, rx, ry, a0, a1, n){
  const out = [];
  n = n || Math.max(4, Math.ceil(Math.abs(a1 - a0) / 10));
  for (let i = 0; i <= n; i++){ const a = (a0 + (a1 - a0) * i / n) * Math.PI / 180; out.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); }
  return out;
}
function bxRoundRectCmds(w, h, r, which){
  // which — какие углы скруглять: [лв, пв, пн, лн]
  const R = which.map(k => k ? Math.min(r, w / 2, h / 2) : 0);
  const c = [['M', R[0], 0], ['L', w - R[1], 0]];
  if (R[1]) c.push(['Q', w, 0, w, R[1]]);
  c.push(['L', w, h - R[2]]);
  if (R[2]) c.push(['Q', w, h, w - R[2], h]);
  c.push(['L', R[3], h]);
  if (R[3]) c.push(['Q', 0, h, 0, h - R[3]]);
  c.push(['L', 0, R[0]]);
  if (R[0]) c.push(['Q', 0, 0, R[0], 0]);
  c.push(['Z']);
  return c;
}
function bxRegular(n, w, h, inner){
  // правильный многоугольник (или звезда), растянутый ровно на рамку
  const raw = [];
  const m = inner ? n * 2 : n;
  for (let i = 0; i < m; i++){
    const a = -Math.PI / 2 + i * Math.PI * 2 / m, r = inner && i % 2 ? inner : 1;
    raw.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  const xs = raw.map(p => p[0]), ys = raw.map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  return raw.map(p => [(p[0] - x0) / (x1 - x0) * w, (p[1] - y0) / (y1 - y0) * h]);
}
function bxCalloutTail(w, h, o){
  // кончик хвоста выноски — смещение от середины в долях рамки
  const tx = w / 2 + w * bxA(o, 'adj1', -20833), ty = h / 2 + h * bxA(o, 'adj2', 62500);
  return [tx, ty];
}
function bxGeomOf(o, w, h){
  const g = o.geom || 'rect', ss = Math.min(w, h);
  if (g === 'path' && Array.isArray(o.path)){
    return o.path.map(sp => {
      const kx = w / (sp.w || 1), ky = h / (sp.h || 1);
      const cmds = (sp.cmds || []).map(c => c[0] === 'Z' ? ['Z'] : [c[0]].concat(c.slice(1).map((v, i) => v * (i % 2 ? ky : kx))));
      return { cmds, fill: sp.fill !== false, stroke: sp.stroke !== false };
    });
  }
  switch (g){
    case 'rect': case 'flowChartProcess': case 'textRect': return [bxPoly([[0, 0], [w, 0], [w, h], [0, h]])];
    case 'roundRect': case 'flowChartAlternateProcess': return [{ cmds: bxRoundRectCmds(w, h, ss * bxA(o, 'adj', 16667), [1, 1, 1, 1]), fill: true, stroke: true }];
    case 'round1Rect': return [{ cmds: bxRoundRectCmds(w, h, ss * bxA(o, 'adj', 16667), [0, 1, 0, 0]), fill: true, stroke: true }];
    case 'round2SameRect': return [{ cmds: bxRoundRectCmds(w, h, ss * bxA(o, 'adj1', 16667), [1, 1, 0, 0]), fill: true, stroke: true }];
    case 'round2DiagRect': return [{ cmds: bxRoundRectCmds(w, h, ss * bxA(o, 'adj1', 16667), [1, 0, 1, 0]), fill: true, stroke: true }];
    case 'snip1Rect': { const d = ss * bxA(o, 'adj', 16667); return [bxPoly([[0, 0], [w - d, 0], [w, d], [w, h], [0, h]])]; }
    case 'snip2SameRect': { const d = ss * bxA(o, 'adj1', 16667); return [bxPoly([[d, 0], [w - d, 0], [w, d], [w, h], [0, h], [0, d]])]; }
    case 'flowChartTerminator': { const r = Math.min(h / 2, w / 2); return [{ cmds: bxRoundRectCmds(w, h, r, [1, 1, 1, 1]), fill: true, stroke: true }]; }
    case 'ellipse': case 'flowChartConnector': case 'oval': return [{ cmds: bxEllipseCmds(w / 2, h / 2, w / 2, h / 2), fill: true, stroke: true }];
    case 'triangle': case 'flowChartExtract': return [bxPoly([[w * bxA(o, 'adj', 50000), 0], [w, h], [0, h]])];
    case 'flowChartMerge': return [bxPoly([[0, 0], [w, 0], [w / 2, h]])];
    case 'rtTriangle': return [bxPoly([[0, 0], [w, h], [0, h]])];
    case 'diamond': case 'flowChartDecision': return [bxPoly([[w / 2, 0], [w, h / 2], [w / 2, h], [0, h / 2]])];
    case 'parallelogram': { const d = ss * bxA(o, 'adj', 25000); return [bxPoly([[d, 0], [w, 0], [w - d, h], [0, h]])]; }
    case 'flowChartInputOutput': return [bxPoly([[w / 5, 0], [w, 0], [w * 4 / 5, h], [0, h]])];
    case 'trapezoid': { const d = ss * bxA(o, 'adj', 25000); return [bxPoly([[d, 0], [w - d, 0], [w, h], [0, h]])]; }
    case 'flowChartManualOperation': return [bxPoly([[0, 0], [w, 0], [w * 4 / 5, h], [w / 5, h]])];
    case 'flowChartManualInput': return [bxPoly([[0, h / 5], [w, 0], [w, h], [0, h]])];
    case 'flowChartOffpageConnector': return [bxPoly([[0, 0], [w, 0], [w, h * 0.8], [w / 2, h], [0, h * 0.8]])];
    case 'flowChartPreparation': return [bxPoly([[w / 5, 0], [w * 4 / 5, 0], [w, h / 2], [w * 4 / 5, h], [w / 5, h], [0, h / 2]])];
    case 'flowChartPredefinedProcess': return [bxPoly([[0, 0], [w, 0], [w, h], [0, h]]),
      { cmds: [['M', w / 8, 0], ['L', w / 8, h], ['M', w * 7 / 8, 0], ['L', w * 7 / 8, h]], fill: false, stroke: true }];
    case 'flowChartDocument': return [{ cmds: [['M', 0, 0], ['L', w, 0], ['L', w, h * 0.8], ['C', w * 0.7, h * 0.66, w * 0.45, h * 1.05, 0, h * 0.93], ['Z']], fill: true, stroke: true }];
    case 'flowChartDelay': return [{ cmds: [['M', 0, 0], ['L', w / 2, 0], ['C', w * (0.5 + BX_K / 2), 0, w, h * (0.5 - BX_K / 2), w, h / 2], ['C', w, h * (0.5 + BX_K / 2), w * (0.5 + BX_K / 2), h, w / 2, h], ['L', 0, h], ['Z']], fill: true, stroke: true }];
    case 'pentagon': return [bxPoly(bxRegular(5, w, h))];
    case 'heptagon': return [bxPoly(bxRegular(7, w, h))];
    case 'decagon': return [bxPoly(bxRegular(10, w, h))];
    case 'dodecagon': return [bxPoly(bxRegular(12, w, h))];
    case 'hexagon': { const d = ss * bxA(o, 'adj', 25000); return [bxPoly([[0, h / 2], [d, 0], [w - d, 0], [w, h / 2], [w - d, h], [d, h]])]; }
    case 'octagon': { const d = ss * bxA(o, 'adj', 29289); return [bxPoly([[d, 0], [w - d, 0], [w, d], [w, h - d], [w - d, h], [d, h], [0, h - d], [0, d]])]; }
    case 'star4': return [bxPoly(bxRegular(4, w, h, bxA(o, 'adj', 12500) * 2))];
    case 'star5': return [bxPoly(bxRegular(5, w, h, bxA(o, 'adj', 19098) * 2))];
    case 'star6': return [bxPoly(bxRegular(6, w, h, bxA(o, 'adj', 28868) * 2))];
    case 'star7': return [bxPoly(bxRegular(7, w, h, bxA(o, 'adj', 34601) * 2))];
    case 'star8': return [bxPoly(bxRegular(8, w, h, bxA(o, 'adj', 38268) * 2))];
    case 'star10': return [bxPoly(bxRegular(10, w, h, bxA(o, 'adj', 42533) * 2))];
    case 'star12': return [bxPoly(bxRegular(12, w, h, bxA(o, 'adj', 37500) * 2))];
    case 'star16': case 'star24': case 'star32': return [bxPoly(bxRegular(+g.slice(4), w, h, bxA(o, 'adj', 37500) * 2))];
    case 'plus': case 'cross': { const d = ss * bxA(o, 'adj', 25000); return [bxPoly([[d, 0], [w - d, 0], [w - d, d], [w, d], [w, h - d], [w - d, h - d], [w - d, h], [d, h], [d, h - d], [0, h - d], [0, d], [d, d]])]; }
    case 'rightArrow': case 'leftArrow': case 'upArrow': case 'downArrow': {
      const horiz = g === 'rightArrow' || g === 'leftArrow';
      const L = horiz ? w : h, T = horiz ? h : w;
      const t2 = T * bxA(o, 'adj1', 50000) / 2, hl = Math.min(L, ss * bxA(o, 'adj2', 50000));
      let pts = [[0, T / 2 - t2], [L - hl, T / 2 - t2], [L - hl, 0], [L, T / 2], [L - hl, T], [L - hl, T / 2 + t2], [0, T / 2 + t2]];
      if (g === 'leftArrow') pts = pts.map(p => [L - p[0], p[1]]);
      if (g === 'downArrow') pts = pts.map(p => [p[1], p[0]]);
      if (g === 'upArrow') pts = pts.map(p => [p[1], L - p[0]]);
      return [bxPoly(pts)];
    }
    case 'leftRightArrow': case 'upDownArrow': {
      const horiz = g === 'leftRightArrow', L = horiz ? w : h, T = horiz ? h : w;
      const t2 = T * bxA(o, 'adj1', 50000) / 2, hl = Math.min(L / 2, ss * bxA(o, 'adj2', 50000));
      let pts = [[0, T / 2], [hl, 0], [hl, T / 2 - t2], [L - hl, T / 2 - t2], [L - hl, 0], [L, T / 2], [L - hl, T], [L - hl, T / 2 + t2], [hl, T / 2 + t2], [hl, T]];
      if (!horiz) pts = pts.map(p => [p[1], p[0]]);
      return [bxPoly(pts)];
    }
    case 'notchedRightArrow': { const t2 = h * bxA(o, 'adj1', 50000) / 2, hl = Math.min(w, ss * bxA(o, 'adj2', 50000)), n = (h / 2 - t2) * hl / (h / 2);
      return [bxPoly([[0, h / 2 - t2], [w - hl, h / 2 - t2], [w - hl, 0], [w, h / 2], [w - hl, h], [w - hl, h / 2 + t2], [0, h / 2 + t2], [n, h / 2]])]; }
    case 'chevron': { const d = Math.min(w, ss * bxA(o, 'adj', 50000)); return [bxPoly([[0, 0], [w - d, 0], [w, h / 2], [w - d, h], [0, h], [d, h / 2]])]; }
    case 'homePlate': { const d = Math.min(w, ss * bxA(o, 'adj', 50000)); return [bxPoly([[0, 0], [w - d, 0], [w, h / 2], [w - d, h], [0, h]])]; }
    case 'wedgeRectCallout': case 'wedgeRoundRectCallout': {
      const [tx, ty] = bxCalloutTail(w, h, o), dx = (tx - w / 2) / w, dy = (ty - h / 2) / h;
      const b = Math.min(w, h) / 6;
      let pts;
      if (Math.abs(dy) >= Math.abs(dx)){
        const cx = Math.max(b, Math.min(w - b, w / 2 + (tx - w / 2) * 0.35));
        pts = dy > 0 ? [[0, 0], [w, 0], [w, h], [cx + b / 2, h], [tx, ty], [cx - b / 2, h], [0, h]]
                     : [[0, 0], [cx - b / 2, 0], [tx, ty], [cx + b / 2, 0], [w, 0], [w, h], [0, h]];
      } else {
        const cy = Math.max(b, Math.min(h - b, h / 2 + (ty - h / 2) * 0.35));
        pts = dx > 0 ? [[0, 0], [w, 0], [w, cy - b / 2], [tx, ty], [w, cy + b / 2], [w, h], [0, h]]
                     : [[0, 0], [w, 0], [w, h], [0, h], [0, cy + b / 2], [tx, ty], [0, cy - b / 2]];
      }
      return [bxPoly(pts)];
    }
    case 'wedgeEllipseCallout': case 'cloudCallout': {
      const [tx, ty] = bxCalloutTail(w, h, o);
      const a = Math.atan2((ty - h / 2) / h, (tx - w / 2) / w) * 180 / Math.PI;
      const pts = bxArcPts(w / 2, h / 2, w / 2, h / 2, a + 12, a + 348, 48);
      pts.push([tx, ty]);
      return [bxPoly(pts)];
    }
    case 'cloud': {
      const c = [], n = 10;
      for (let i = 0; i <= n; i++){
        const a = i * Math.PI * 2 / n, x = w / 2 + w / 2 * 0.86 * Math.cos(a), y = h / 2 + h / 2 * 0.86 * Math.sin(a);
        if (!i){ c.push(['M', x, y]); continue; }
        const m = a - Math.PI / n;
        c.push(['Q', w / 2 + w / 2 * 1.16 * Math.cos(m), h / 2 + h / 2 * 1.16 * Math.sin(m), x, y]);
      }
      c.push(['Z']);
      return [{ cmds: c, fill: true, stroke: true }];
    }
    case 'heart': return [{ cmds: [['M', w / 2, h * 0.25], ['C', w * 0.5, h * -0.05, w * -0.05, h * 0.02, w * 0.02, h * 0.35], ['C', w * 0.08, h * 0.6, w * 0.4, h * 0.78, w / 2, h],
      ['C', w * 0.6, h * 0.78, w * 0.92, h * 0.6, w * 0.98, h * 0.35], ['C', w * 1.05, h * 0.02, w * 0.5, h * -0.05, w / 2, h * 0.25], ['Z']], fill: true, stroke: true }];
    case 'lightningBolt': return [bxPoly([[8458, 0], [0, 3923], [7564, 8416], [4993, 9720], [12197, 13904], [9987, 14934], [21600, 21600], [14768, 12911], [16558, 12016], [11030, 6840], [12831, 6120]].map(p => [p[0] / 21600 * w, p[1] / 21600 * h]))];
    case 'moon': { const d = w * bxA(o, 'adj', 50000); return [{ cmds: [['M', w, 0], ['C', w * (1 - BX_K) - w, 0, -w * 0.0, h * 0.0, 0, h / 2]].concat([['C', 0, h, w, h, w, h], ['C', d * 1.2, h * 0.9, d * 1.2, h * 0.1, w, 0], ['Z']]), fill: true, stroke: true }]; }
    case 'smileyFace': return [{ cmds: bxEllipseCmds(w / 2, h / 2, w / 2, h / 2), fill: true, stroke: true },
      { cmds: bxEllipseCmds(w * 0.35, h * 0.38, w * 0.05, h * 0.06), fill: true, stroke: true },
      { cmds: bxEllipseCmds(w * 0.65, h * 0.38, w * 0.05, h * 0.06), fill: true, stroke: true },
      { cmds: [['M', w * 0.28, h * 0.66], ['Q', w / 2, h * 0.86, w * 0.72, h * 0.66]], fill: false, stroke: true }];
    case 'donut': case 'noSmoking': { const d = ss * bxA(o, 'adj', 25000);
      return [{ cmds: bxEllipseCmds(w / 2, h / 2, w / 2, h / 2).concat(bxEllipseCmds(w / 2, h / 2, Math.max(1, w / 2 - d), Math.max(1, h / 2 - d))), fill: true, stroke: true, evenodd: true }]; }
    case 'frame': { const d = ss * bxA(o, 'adj1', 12500);
      return [{ cmds: [['M', 0, 0], ['L', w, 0], ['L', w, h], ['L', 0, h], ['Z'], ['M', d, d], ['L', d, h - d], ['L', w - d, h - d], ['L', w - d, d], ['Z']], fill: true, stroke: true, evenodd: true }]; }
    case 'corner': { const dx = ss * bxA(o, 'adj2', 50000), dy = ss * bxA(o, 'adj1', 50000); return [bxPoly([[0, 0], [dx, 0], [dx, h - dy], [w, h - dy], [w, h], [0, h]])]; }
    case 'arc': case 'pie': case 'chord': case 'blockArc': {
      const a0 = (o.adj && typeof o.adj.adj1 === 'number' ? o.adj.adj1 : (g === 'pie' ? 0 : 16200000)) / 60000;
      let a1 = (o.adj && typeof o.adj.adj2 === 'number' ? o.adj.adj2 : (g === 'pie' ? 16200000 : 0)) / 60000;
      if (a1 <= a0) a1 += 360;
      const pts = bxArcPts(w / 2, h / 2, w / 2, h / 2, a0, a1);
      if (g === 'pie') return [bxPoly([[w / 2, h / 2]].concat(pts))];
      if (g === 'chord') return [bxPoly(pts)];
      return [{ cmds: pts.map((p, i) => [i ? 'L' : 'M', p[0], p[1]]), fill: false, stroke: true }];
    }
    case 'can': { const e = Math.min(h / 2, ss * bxA(o, 'adj', 25000)) / 2;
      return [{ cmds: [['M', 0, e], ['C', 0, -e * 0.33, w, -e * 0.33, w, e], ['L', w, h - e], ['C', w, h + e * 0.33, 0, h + e * 0.33, 0, h - e], ['Z']], fill: true, stroke: true },
        { cmds: [['M', 0, e], ['C', 0, e * 2.33, w, e * 2.33, w, e]], fill: false, stroke: true }]; }
    case 'cube': { const d = ss * bxA(o, 'adj', 25000);
      return [bxPoly([[0, d], [w - d, d], [w - d, h], [0, h]]), bxPoly([[0, d], [d, 0], [w, 0], [w - d, d]], { shade: 0.15 }), bxPoly([[w - d, d], [w, 0], [w, h - d], [w - d, h]], { shade: 0.3 })]; }
    case 'foldedCorner': { const d = ss * bxA(o, 'adj', 16667);
      return [bxPoly([[0, 0], [w, 0], [w, h - d], [w - d, h], [0, h]]), bxPoly([[w - d, h], [w - d * 0.8, h - d * 0.8], [w, h - d]], { shade: 0.2 })]; }
    case 'bevel': { const d = ss * bxA(o, 'adj', 12500);
      return [bxPoly([[0, 0], [w, 0], [w, h], [0, h]]), { cmds: [['M', d, d], ['L', w - d, d], ['L', w - d, h - d], ['L', d, h - d], ['Z'], ['M', 0, 0], ['L', d, d], ['M', w, 0], ['L', w - d, d], ['M', w, h], ['L', w - d, h - d], ['M', 0, h], ['L', d, h - d]], fill: false, stroke: true }]; }
    case 'leftBracket': case 'rightBracket': { const r = Math.min(h / 2, ss * bxA(o, 'adj', 8333));
      let c = [['M', 0, 0], ['Q', w, 0, w, r], ['L', w, h - r], ['Q', w, h, 0, h]];
      if (g === 'leftBracket') c = c.map(k => [k[0]].concat(k.slice(1).map((v, i) => i % 2 ? v : w - v)));
      return [{ cmds: c, fill: false, stroke: true }]; }
    case 'leftBrace': case 'rightBrace': { const r = Math.min(h / 4, ss * bxA(o, 'adj1', 8333)), m = h * bxA(o, 'adj2', 50000);
      let c = [['M', 0, 0], ['Q', w / 2, 0, w / 2, r], ['L', w / 2, m - r], ['Q', w / 2, m, w, m], ['Q', w / 2, m, w / 2, m + r], ['L', w / 2, h - r], ['Q', w / 2, h, 0, h]];
      if (g === 'leftBrace') c = c.map(k => [k[0]].concat(k.slice(1).map((v, i) => i % 2 ? v : w - v)));
      return [{ cmds: c, fill: false, stroke: true }]; }
    case 'bracketPair': { const r = ss * bxA(o, 'adj', 16667);
      return [{ cmds: [['M', r, 0], ['Q', 0, 0, 0, r], ['L', 0, h - r], ['Q', 0, h, r, h], ['M', w - r, 0], ['Q', w, 0, w, r], ['L', w, h - r], ['Q', w, h, w - r, h]], fill: false, stroke: true }]; }
    case 'bracePair': { const r = ss * bxA(o, 'adj', 8333), q = r / 2;
      return [{ cmds: [['M', 2 * r, 0], ['Q', r, 0, r, q * 2], ['L', r, h / 2 - q * 2], ['Q', r, h / 2, 0, h / 2], ['Q', r, h / 2, r, h / 2 + q * 2], ['L', r, h - q * 2], ['Q', r, h, 2 * r, h],
        ['M', w - 2 * r, 0], ['Q', w - r, 0, w - r, q * 2], ['L', w - r, h / 2 - q * 2], ['Q', w - r, h / 2, w, h / 2], ['Q', w - r, h / 2, w - r, h / 2 + q * 2], ['L', w - r, h - q * 2], ['Q', w - r, h, w - 2 * r, h]], fill: false, stroke: true }]; }
    case 'mathPlus': { const t = ss * bxA(o, 'adj1', 23520) / 2, m = 0.06;
      return [bxPoly([[w / 2 - t, h * m], [w / 2 + t, h * m], [w / 2 + t, h / 2 - t], [w * (1 - m), h / 2 - t], [w * (1 - m), h / 2 + t], [w / 2 + t, h / 2 + t], [w / 2 + t, h * (1 - m)], [w / 2 - t, h * (1 - m)], [w / 2 - t, h / 2 + t], [w * m, h / 2 + t], [w * m, h / 2 - t], [w / 2 - t, h / 2 - t]])]; }
    case 'mathMinus': { const t = h * bxA(o, 'adj1', 23520) / 2; return [bxPoly([[w * 0.06, h / 2 - t], [w * 0.94, h / 2 - t], [w * 0.94, h / 2 + t], [w * 0.06, h / 2 + t]])]; }
    case 'mathEqual': case 'mathNotEqual': { const t = h * bxA(o, 'adj1', 23520) / 2, gp = h * bxA(o, 'adj2', 11760) / 2;
      const out = [bxPoly([[w * 0.06, h / 2 - gp - 2 * t], [w * 0.94, h / 2 - gp - 2 * t], [w * 0.94, h / 2 - gp], [w * 0.06, h / 2 - gp]]),
                   bxPoly([[w * 0.06, h / 2 + gp], [w * 0.94, h / 2 + gp], [w * 0.94, h / 2 + gp + 2 * t], [w * 0.06, h / 2 + gp + 2 * t]])];
      if (g === 'mathNotEqual') out.push(bxPoly([[w * 0.62, h * 0.08], [w * 0.62 + 2 * t, h * 0.08], [w * 0.38 + 2 * t, h * 0.92], [w * 0.38, h * 0.92]]));
      return out; }
    case 'mathMultiply': { const t = ss * bxA(o, 'adj1', 23520) / 2, c = [w / 2, h / 2], L = Math.min(w, h) * 0.42;
      const arm = (ang) => { const a = ang * Math.PI / 180, ux = Math.cos(a), uy = Math.sin(a), nx = -uy, ny = ux;
        return bxPoly([[c[0] - ux * L + nx * t, c[1] - uy * L + ny * t], [c[0] + ux * L + nx * t, c[1] + uy * L + ny * t], [c[0] + ux * L - nx * t, c[1] + uy * L - ny * t], [c[0] - ux * L - nx * t, c[1] - uy * L - ny * t]]); };
      return [arm(45), arm(-45)]; }
    case 'mathDivide': { const t = h * bxA(o, 'adj1', 23520) / 2, r = t * 1.2;
      return [bxPoly([[w * 0.06, h / 2 - t], [w * 0.94, h / 2 - t], [w * 0.94, h / 2 + t], [w * 0.06, h / 2 + t]]),
        { cmds: bxEllipseCmds(w / 2, h / 2 - t - r * 2.2, r, r), fill: true, stroke: true }, { cmds: bxEllipseCmds(w / 2, h / 2 + t + r * 2.2, r, r), fill: true, stroke: true }]; }
    case 'line': case 'straightConnector1': return [{ cmds: [['M', 0, 0], ['L', w, h]], fill: false, stroke: true, open: true }];
    case 'bentConnector2': return [{ cmds: [['M', 0, 0], ['L', w, 0], ['L', w, h]], fill: false, stroke: true, open: true }];
    case 'bentConnector3': case 'bentConnector4': case 'bentConnector5': { const x = w * bxA(o, 'adj1', 50000);
      return [{ cmds: [['M', 0, 0], ['L', x, 0], ['L', x, h], ['L', w, h]], fill: false, stroke: true, open: true }]; }
    case 'curvedConnector2': case 'curvedConnector3': case 'curvedConnector4': case 'curvedConnector5':
      return [{ cmds: [['M', 0, 0], ['C', w * 0.5, 0, w * 0.5, h, w, h]], fill: false, stroke: true, open: true }];
    default: return [bxPoly([[0, 0], [w, 0], [w, h], [0, h]])];
  }
}
// подпути → ломаные (для попадания курсором по контуру и стрелок)
function bxFlatten(cmds){
  const out = [];
  let cur = null, start = null, poly = null;
  cmds.forEach(c => {
    if (c[0] === 'M'){ cur = [c[1], c[2]]; start = cur; poly = [cur]; out.push(poly); }
    else if (c[0] === 'L'){ cur = [c[1], c[2]]; poly && poly.push(cur); }
    else if (c[0] === 'Q' || c[0] === 'C'){
      const p0 = cur || [0, 0];
      for (let i = 1; i <= 8; i++){
        const t = i / 8, u = 1 - t;
        let x, y;
        if (c[0] === 'Q'){ x = u * u * p0[0] + 2 * u * t * c[1] + t * t * c[3]; y = u * u * p0[1] + 2 * u * t * c[2] + t * t * c[4]; }
        else { x = u * u * u * p0[0] + 3 * u * u * t * c[1] + 3 * u * t * t * c[3] + t * t * t * c[5]; y = u * u * u * p0[1] + 3 * u * u * t * c[2] + 3 * u * t * t * c[4] + t * t * t * c[6]; }
        poly && poly.push([x, y]);
      }
      cur = c[0] === 'Q' ? [c[3], c[4]] : [c[5], c[6]];
    } else if (c[0] === 'Z'){ if (poly && start) poly.push(start); cur = start; }
  });
  return out;
}
function bxTracePath(c, cmds, z){
  c.beginPath();
  cmds.forEach(k => {
    if (k[0] === 'M') c.moveTo(k[1] * z, k[2] * z);
    else if (k[0] === 'L') c.lineTo(k[1] * z, k[2] * z);
    else if (k[0] === 'Q') c.quadraticCurveTo(k[1] * z, k[2] * z, k[3] * z, k[4] * z);
    else if (k[0] === 'C') c.bezierCurveTo(k[1] * z, k[2] * z, k[3] * z, k[4] * z, k[5] * z, k[6] * z);
    else if (k[0] === 'Z') c.closePath();
  });
}
const BX_DASH = { dash: [4, 3], sysDash: [3, 1], dot: [1, 2], sysDot: [1, 1], dashDot: [4, 3, 1, 3], lgDash: [8, 3], lgDashDot: [8, 3, 1, 3], lgDashDotDot: [8, 3, 1, 3, 1, 3], sysDashDot: [3, 1, 1, 1], sysDashDotDot: [3, 1, 1, 1, 1, 1] };
function bxFillStyle(c, f, w, h, z){
  if (!f) return null;
  if (Array.isArray(f.g) && f.g.length){
    const a = (f.ang || 0) * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
    const half = (Math.abs(w * ca) + Math.abs(h * sa)) / 2;
    const gr = c.createLinearGradient((w / 2 - ca * half) * z, (h / 2 - sa * half) * z, (w / 2 + ca * half) * z, (h / 2 + sa * half) * z);
    f.g.forEach(s => { try { gr.addColorStop(Math.max(0, Math.min(1, s.p)), bxRgba(s.c, s.a)); } catch (e) {} });
    return gr;
  }
  return bxRgba(f.c, f.a);
}
function bxArrowHead(c, from, to, kind, lw, size){
  if (!kind || kind === 'none') return;
  const ang = Math.atan2(to[1] - from[1], to[0] - from[0]);
  const L = Math.max(6, lw * (size === 'sm' ? 2.2 : size === 'lg' ? 4.5 : 3.2)), W = L * 0.55;
  c.save();
  c.translate(to[0], to[1]); c.rotate(ang);
  c.setLineDash([]);
  c.beginPath();
  if (kind === 'oval'){ c.ellipse(-L / 3, 0, L / 3, W / 1.6, 0, 0, Math.PI * 2); c.fill(); }
  else if (kind === 'diamond'){ c.moveTo(0, 0); c.lineTo(-L / 2, -W); c.lineTo(-L, 0); c.lineTo(-L / 2, W); c.closePath(); c.fill(); }
  else if (kind === 'arrow'){ c.moveTo(-L, -W); c.lineTo(0, 0); c.lineTo(-L, W); c.stroke(); }
  else { c.moveTo(0, 0); c.lineTo(-L, -W); c.lineTo(kind === 'stealth' ? -L * 0.7 : -L, 0); c.lineTo(-L, W); c.closePath(); c.fill(); }
  c.restore();
}

/* Область текста внутри фигуры (как <a:rect> в описаниях фигур PowerPoint):
   у овала, ромба, треугольника, стрелки текст стоит во вписанном
   прямоугольнике, а не во всей рамке. Возвращает отступы [л, в, п, н] */
function bxTextInset(o, w, h){
  const g = o.geom || 'rect', ss = Math.min(w, h);
  switch (g){
    case 'ellipse': case 'flowChartConnector': case 'wedgeEllipseCallout': case 'cloud': case 'cloudCallout': return [w * 0.1464, h * 0.1464, w * 0.1464, h * 0.1464];
    case 'diamond': case 'flowChartDecision': return [w / 4, h / 4, w / 4, h / 4];
    case 'triangle': { const a = bxA(o, 'adj', 50000); return [w * a / 2, h / 2, w * (1 - a) / 2, 0]; }
    case 'rtTriangle': return [w / 12, h * 7 / 12, w * 5 / 12, h / 12];
    case 'roundRect': case 'flowChartAlternateProcess': { const d = ss * bxA(o, 'adj', 16667) * 0.29289; return [d, d, d, d]; }
    case 'flowChartTerminator': { const d = Math.min(w, h) / 2 * 0.29289; return [d, d * 0.3, d, d * 0.3]; }
    case 'hexagon': { const d = ss * bxA(o, 'adj', 25000); return [d * 0.6, h * 0.1, d * 0.6, h * 0.1]; }
    case 'octagon': { const d = ss * bxA(o, 'adj', 29289) / 2; return [d, d, d, d]; }
    case 'pentagon': return [w * 0.2, h * 0.3, w * 0.2, h * 0.05];
    case 'star5': return [w * 0.31, h * 0.38, w * 0.31, h * 0.23];
    case 'star4': case 'star6': case 'star8': case 'star10': case 'star12': return [w * 0.25, h * 0.25, w * 0.25, h * 0.25];
    case 'parallelogram': case 'trapezoid': { const d = ss * bxA(o, 'adj', 25000); return [d * 0.8, h * 0.08, d * 0.8, h * 0.08]; }
    case 'rightArrow': case 'leftArrow': { const t2 = h * bxA(o, 'adj1', 50000) / 2, hl = Math.min(w, ss * bxA(o, 'adj2', 50000));
      return g === 'rightArrow' ? [0, h / 2 - t2, hl / 2, h / 2 - t2] : [hl / 2, h / 2 - t2, 0, h / 2 - t2]; }
    case 'upArrow': case 'downArrow': { const t2 = w * bxA(o, 'adj1', 50000) / 2, hl = Math.min(h, ss * bxA(o, 'adj2', 50000));
      return g === 'downArrow' ? [w / 2 - t2, 0, w / 2 - t2, hl / 2] : [w / 2 - t2, hl / 2, w / 2 - t2, 0]; }
    case 'chevron': case 'homePlate': { const d = Math.min(w, ss * bxA(o, 'adj', 50000)); return [g === 'chevron' ? d / 2 : 0, 0, d / 2, 0]; }
    case 'plus': case 'cross': { const d = ss * bxA(o, 'adj', 25000); return [0, d, 0, d]; }
    default: return [0, 0, 0, 0];
  }
}

/* ── 5. Блок: рисование ─────────────────────────────────────────────── */
let bxEditing = null;   // { id, cell:[r,c] | null } — его текст сейчас в поле правки, на холсте не рисуем
function bxRenderBox(c, o, camv){
  const z = camv.zoom, w = o.w || 1, h = o.h || 1;
  const ctr = worldToScreen(bxCenter(o));
  c.save();
  if (o.opacity != null) c.globalAlpha = o.opacity;
  c.translate(ctr.x, ctr.y);
  if (o.rot) c.rotate(o.rot * Math.PI / 180);
  c.save();
  c.scale(o.flipH ? -1 : 1, o.flipV ? -1 : 1);
  c.translate(-w * z / 2, -h * z / 2);
  const subs = bxGeomOf(o, w, h);
  const ln = o.line;
  const lw = ln ? Math.max(camv.minLine || 0.5, (ln.w || 1) * z) : 0;
  subs.forEach(sp => {
    bxTracePath(c, sp.cmds, z);
    if (sp.fill && o.fill){
      c.fillStyle = bxFillStyle(c, o.fill, w, h, z);
      c.fill(sp.evenodd ? 'evenodd' : 'nonzero');
      if (sp.shade){ c.fillStyle = 'rgba(0,0,0,' + sp.shade + ')'; c.fill(sp.evenodd ? 'evenodd' : 'nonzero'); }
    }
    if (sp.stroke && ln && ln.c){
      c.strokeStyle = bxRgba(ln.c, ln.a);
      c.lineWidth = lw;
      c.lineJoin = ln.join || 'round';
      c.lineCap = ln.cap || (sp.open ? 'round' : 'butt');
      const d = BX_DASH[ln.dash];
      c.setLineDash(d ? d.map(v => v * lw) : []);
      c.stroke();
    }
  });
  // стрелки на концах открытого контура (соединительные линии)
  if (ln && ln.c && (ln.he || ln.te)){
    const flat = bxFlatten(subs.filter(sp => sp.open).flatMap(sp => sp.cmds).map(k => k[0] === 'Z' ? k : [k[0]].concat(k.slice(1).map(v => v * z))));
    const first = flat[0], last = flat[flat.length - 1];
    c.fillStyle = c.strokeStyle = bxRgba(ln.c, ln.a); c.lineWidth = lw;
    if (first && first.length > 1 && ln.he) bxArrowHead(c, first[1], first[0], ln.he, lw, ln.hs);
    if (last && last.length > 1 && ln.te) bxArrowHead(c, last[last.length - 2], last[last.length - 1], ln.te, lw, ln.ts);
  }
  c.restore();
  // текст не отражается вместе с фигурой — как в PowerPoint
  if (o.text && !(bxEditing && bxEditing.id === o.id && activeCam === cam)){
    const ins = bxTextInset(o, w, h);
    const fr = bxTextFrame(o.text, Math.max(4, w - ins[0] - ins[2]), Math.max(4, h - ins[1] - ins[3]));
    bxDrawLayout(c, fr.lay, (-w / 2 + ins[0] + fr.ox) * z, (-h / 2 + ins[1] + fr.oy) * z, z, fr.iw);
  }
  if (o.ph && !bxHasText(o.text) && bxShowHints(o)) bxDrawHint(c, o, w, h, z);
  c.restore();
}
/* №104: заполнитель макета слайда («Заголовок слайда», «Текст слайда»).
   Пока блок пуст, в «Конструкторе» видны пунктирная рамка и серая подсказка,
   как в PowerPoint. Только на экране учителя: не в миниатюрах и выгрузке
   (там deckRenderSlideId), не в «Уроке», не у ученика (deckViewerMode) */
function bxShowHints(o){
  if (typeof isDeckBoard !== 'function' || !isDeckBoard()) return false;
  if (typeof deckRenderSlideId !== 'undefined' && deckRenderSlideId) return false;
  if (typeof activeCam !== 'undefined' && typeof cam !== 'undefined' && activeCam !== cam) return false;
  if (typeof deckLessonMode === 'function' && deckLessonMode()) return false;
  return !(bxEditing && bxEditing.id === o.id);
}
function bxDrawHint(c, o, w, h, z){
  const tx = o.text || {}, p0 = (tx.paras && tx.paras[0]) || {}, def = tx.def || {};
  c.save();
  c.setLineDash([5, 4]);
  c.strokeStyle = 'rgba(120,128,140,.55)';
  c.lineWidth = 1;
  c.strokeRect(-w * z / 2 + 0.5, -h * z / 2 + 0.5, w * z - 1, h * z - 1);
  c.setLineDash([]);
  const sz = (p0.esz || def.sz || 24) * z;
  c.font = (def.b ? 'bold ' : '') + sz + 'px "' + bxFace(def.f || BX_DEF_FONT) + '", sans-serif';
  c.fillStyle = 'rgba(110,118,130,.75)';
  const pad = tx.pad || [10, 5, 10, 5], al = p0.al || 'l', an = tx.anchor || 't';
  c.textAlign = al === 'c' ? 'center' : al === 'r' ? 'right' : 'left';
  c.textBaseline = an === 'm' ? 'middle' : an === 'b' ? 'bottom' : 'top';
  // маркер списка пустого абзаца рисует сама раскладка — подсказка правее него
  const x = al === 'c' ? 0 : al === 'r' ? w * z / 2 - pad[2] * z : -w * z / 2 + pad[0] * z + (p0.bu ? sz * 0.9 : 0);
  const y = an === 'm' ? 0 : an === 'b' ? h * z / 2 - pad[3] * z : -h * z / 2 + pad[1] * z;
  c.fillText(o.ph, x, y, Math.max(10, w * z - (pad[0] + pad[2]) * z));
  c.restore();
}

/* ── 6. Таблица ──────────────────────────────────────────────────────────
   Ширины столбцов и высоты строк — как в файле; строка, в которую текст
   не помещается, растёт (как в PowerPoint). Раскладка кэшируется по
   массиву ячеек: правка ячейки всегда заменяет его новым. */
const BX_CELL_PAD = [12, 6, 12, 6];
const bxTableCache = new WeakMap();
function bxCellRect(L, r, cIdx, cell){
  const gs = Math.max(1, (cell && cell.gs) || 1), rs = Math.max(1, (cell && cell.rs) || 1);
  const x = L.colX[cIdx], y = L.rowY[r];
  return { x, y, w: L.colX[Math.min(L.colX.length - 1, cIdx + gs)] - x, h: L.rowY[Math.min(L.rowY.length - 1, r + rs)] - y };
}
function bxTableLayout(o){
  const cols = Array.isArray(o.cols) ? o.cols : [o.w || 100], rows = Array.isArray(o.rows) ? o.rows : [o.h || 40];
  const cells = Array.isArray(o.cells) ? o.cells : [];
  const key = cols.join(',') + '|' + rows.join(',') + '|' + bxFontEpoch;
  const hit = bxTableCache.get(cells);
  if (hit && hit.key === key) return hit.L;
  const colX = [0];
  cols.forEach(w => colX.push(colX[colX.length - 1] + w));
  const rowH = rows.slice();
  const cellH = (cell, cw) => {
    if (!cell || !cell.text) return 0;
    const pad = cell.text.pad || BX_CELL_PAD;
    return bxLayout(cell.text, Math.max(4, cw - pad[0] - pad[2]), 1).h + pad[1] + pad[3];
  };
  // сначала ячейки в одну строку, потом объединённые по вертикали
  for (let pass = 0; pass < 2; pass++){
    cells.forEach((row, r) => (row || []).forEach((cell, ci) => {
      if (!cell || cell.hm || cell.vm) return;
      const rs = Math.max(1, cell.rs || 1), gs = Math.max(1, cell.gs || 1);
      if ((rs > 1) !== (pass === 1)) return;
      const cw = colX[Math.min(colX.length - 1, ci + gs)] - colX[ci];
      const need = cellH(cell, cw);
      let have = 0;
      for (let k = r; k < Math.min(rowH.length, r + rs); k++) have += rowH[k];
      if (need > have + 0.5){ const last = Math.min(rowH.length, r + rs) - 1; if (last >= 0) rowH[last] += need - have; }
    }));
  }
  const rowY = [0];
  rowH.forEach(h => rowY.push(rowY[rowY.length - 1] + h));
  const L = { colX, rowY, rowH, size: { w: colX[colX.length - 1] || 1, h: rowY[rowY.length - 1] || 1 } };
  bxTableCache.set(cells, { key, L });
  return L;
}
function bxRenderTable(c, o, camv){
  const z = camv.zoom, L = bxTableLayout(o), s = L.size;
  const ctr = worldToScreen(bxCenter(o));
  c.save();
  if (o.opacity != null) c.globalAlpha = o.opacity;
  c.translate(ctr.x, ctr.y);
  if (o.rot) c.rotate(o.rot * Math.PI / 180);
  c.translate(-s.w * z / 2, -s.h * z / 2);
  const cells = o.cells || [];
  // заливки
  cells.forEach((row, r) => (row || []).forEach((cell, ci) => {
    if (!cell || cell.hm || cell.vm || !cell.fill) return;
    const R = bxCellRect(L, r, ci, cell);
    c.fillStyle = bxFillStyle(c, cell.fill, R.w, R.h, 1) || '#fff';
    c.fillRect(R.x * z, R.y * z, R.w * z, R.h * z);
  }));
  // тексты
  cells.forEach((row, r) => (row || []).forEach((cell, ci) => {
    if (!cell || cell.hm || cell.vm || !cell.text) return;
    if (bxEditing && bxEditing.id === o.id && bxEditing.cell && bxEditing.cell[0] === r && bxEditing.cell[1] === ci && activeCam === cam) return;
    const R = bxCellRect(L, r, ci, cell);
    const fr = bxTextFrame(cell.text.pad ? cell.text : bxCellTextCached(cell), R.w, R.h);
    bxDrawLayout(c, fr.lay, (R.x + fr.ox) * z, (R.y + fr.oy) * z, z, fr.iw);
  }));
  // границы: у ячейки свои (bd.l/t/r/b); нет ни у одной — тонкая серая сетка
  const anyBd = cells.some(row => (row || []).some(cell => cell && cell.bd));
  const edge = (x0, y0, x1, y1, b) => {
    if (!b || !b.c) return;
    c.strokeStyle = bxRgba(b.c, b.a); c.lineWidth = Math.max(camv.minLine || 0.5, (b.w || 1) * z);
    const d = BX_DASH[b.dash]; c.setLineDash(d ? d.map(v => v * c.lineWidth) : []);
    c.beginPath(); c.moveTo(x0 * z, y0 * z); c.lineTo(x1 * z, y1 * z); c.stroke();
  };
  const def = anyBd ? null : { c: '#9AA3AE', w: 1 };
  cells.forEach((row, r) => (row || []).forEach((cell, ci) => {
    if (!cell || cell.hm || cell.vm) return;
    const R = bxCellRect(L, r, ci, cell), bd = cell.bd || {};
    edge(R.x, R.y, R.x + R.w, R.y, bd.t || def);
    edge(R.x, R.y + R.h, R.x + R.w, R.y + R.h, bd.b || def);
    edge(R.x, R.y, R.x, R.y + R.h, bd.l || def);
    edge(R.x + R.w, R.y, R.x + R.w, R.y + R.h, bd.r || def);
  }));
  c.restore();
}
// ячейка без своих полей — стандартные поля PowerPoint; объект с полями
// держим тем же, чтобы кэш раскладки по нему работал
const bxCellTx = new WeakMap();
function bxCellTextCached(cell){
  let t = bxCellTx.get(cell.text);
  if (!t){ t = Object.assign({}, cell.text, { pad: BX_CELL_PAD }); bxCellTx.set(cell.text, t); }
  return t;
}
// какая ячейка под точкой (координаты внутри таблицы); объединённые — их начало
function bxTableCellAt(o, lp){
  const L = bxTableLayout(o), cells = o.cells || [];
  for (let r = 0; r < cells.length; r++) for (let ci = 0; ci < (cells[r] || []).length; ci++){
    const cell = cells[r][ci];
    if (!cell || cell.hm || cell.vm) continue;
    const R = bxCellRect(L, r, ci, cell);
    if (lp.x >= R.x && lp.x <= R.x + R.w && lp.y >= R.y && lp.y <= R.y + R.h) return [r, ci];
  }
  return null;
}

/* ── 7. Хуки доски: рисование, рамка, попадание ─────────────────────── */
function bxRender(c, o, camv){
  if (o.type === 'box'){ bxRenderBox(c, o, camv); return true; }
  if (o.type === 'table'){ bxRenderTable(c, o, camv); return true; }
  return false;
}
function bxBBox(o){
  if (!bxIsFrame(o)) return null;
  const pts = bxCorners(o);
  let pad = 0;
  if (o.type === 'box' && o.line) pad = (o.line.w || 1) / 2 + ((o.line.he || o.line.te) ? (o.line.w || 1) * 5 : 0);
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  pts.forEach(p => { minX = Math.min(minX, p.x); minY = Math.min(minY, p.y); maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y); });
  return { minX: minX - pad, minY: minY - pad, maxX: maxX + pad, maxY: maxY + pad };
}
function bxHasText(tx){ return !!tx && Array.isArray(tx.paras) && tx.paras.some(p => (p.runs || []).some(r => r.t && r.t.trim())); }
// undefined — не наш объект, решает доска
function bxHitTest(o, pt, tol){
  if (!bxIsFrame(o)) return undefined;
  const lp = bxToLocal(o, pt), s = bxSize(o);
  const inside = lp.x >= -tol && lp.x <= s.w + tol && lp.y >= -tol && lp.y <= s.h + tol;
  if (!inside) return false;
  if (o.type !== 'box') return true;
  // залитую фигуру и надпись берут за любое место; пустой контур — только
  // за линию (иначе рамка во весь слайд перехватывала бы всё под собой)
  if (o.fill || bxHasText(o.text)) return true;
  const lw = (o.line && o.line.w) || 1;
  let fx = lp.x, fy = lp.y;
  if (o.flipH) fx = s.w - fx;
  if (o.flipV) fy = s.h - fy;
  const lim = tol + lw / 2 + 2;
  return bxGeomOf(o, s.w, s.h).some(sp => bxFlatten(sp.cmds).some(poly => {
    for (let i = 0; i < poly.length - 1; i++) if (distToSeg({ x: fx, y: fy }, { x: poly[i][0], y: poly[i][1] }, { x: poly[i + 1][0], y: poly[i + 1][1] }) <= lim) return true;
    return false;
  }));
}

// ручки: 8 по рамке + поворот над верхней серединой; у картинки — только углы
// (пропорции картинки не меняются)
const BX_ROT_OFF = 30;   // экранных пикселей над рамкой
function bxRotHandlePos(o){
  const s = bxSize(o), z = (typeof cam !== 'undefined' && cam.zoom) || 1;
  const p0 = o.points[0];
  const lp = { x: p0.x + s.w / 2, y: p0.y - BX_ROT_OFF / z };
  return bxRotPt(lp, bxCenter(o), o.rot || 0);
}
function bxMayRotateImage(o){ return o.type === 'image' && !o.task && !o.bgOf && !o.css; }
// прямая линия (и соединительная) — две ручки на концах, как в PowerPoint
function bxIsLine(o){ return o.type === 'box' && (o.geom === 'line' || o.geom === 'straightConnector1'); }
function bxLineEnds(o){
  const p = o.points[0], w = o.w || 0, h = o.h || 0, c = bxCenter(o);
  const a = { x: p.x + (o.flipH ? w : 0), y: p.y + (o.flipV ? h : 0) }, b = { x: p.x + (o.flipH ? 0 : w), y: p.y + (o.flipV ? 0 : h) };
  return [bxRotPt(a, c, o.rot || 0), bxRotPt(b, c, o.rot || 0)];
}
function bxHandles(o){
  if (!bxIsFrame(o)) return null;
  if (bxIsLine(o)){ const e = bxLineEnds(o); return [{ role: 'bx-p0', x: e[0].x, y: e[0].y }, { role: 'bx-p1', x: e[1].x, y: e[1].y }]; }
  const s = bxSize(o), p0 = o.points[0], c = bxCenter(o), r = o.rot || 0;
  const at = (fx, fy) => bxRotPt({ x: p0.x + s.w * fx, y: p0.y + s.h * fy }, c, r);
  const list = o.type === 'image'
    ? [['nw', 0, 0], ['ne', 1, 0], ['se', 1, 1], ['sw', 0, 1]]
    : [['nw', 0, 0], ['n', .5, 0], ['ne', 1, 0], ['e', 1, .5], ['se', 1, 1], ['s', .5, 1], ['sw', 0, 1], ['w', 0, .5]];
  const hs = list.map(([k, fx, fy]) => Object.assign({ role: 'bx-' + k }, at(fx, fy)));
  const rp = bxRotHandlePos(o);
  hs.push({ role: 'bx-rot', x: rp.x, y: rp.y });
  return hs;
}
// у обычной (не повёрнутой) картинки — только ручка поворота в добавок к своим
function bxImageRotHandle(o){
  if (!bxMayRotateImage(o) || o.rot) return null;
  const rp = bxRotHandlePos(o);
  return { role: 'bx-rot', x: rp.x, y: rp.y };
}
let bxShift = false;
window.addEventListener('keydown', e => { if (e.key === 'Shift') bxShift = true; });
window.addEventListener('keyup', e => { if (e.key === 'Shift') bxShift = false; });
window.addEventListener('blur', () => { bxShift = false; });
function bxApplyHandle(o, role, pt, rawPt){
  if (typeof role !== 'string' || role.indexOf('bx-') !== 0) return false;
  const P = rawPt || pt;
  const c = bxCenter(o);
  if (role === 'bx-p0' || role === 'bx-p1'){
    const e = bxLineEnds(o);
    e[role === 'bx-p0' ? 0 : 1] = { x: pt.x, y: pt.y };
    const x0 = Math.min(e[0].x, e[1].x), y0 = Math.min(e[0].y, e[1].y);
    o.points[0] = { x: x0, y: y0 };
    o.w = Math.max(0.01, Math.abs(e[1].x - e[0].x)); o.h = Math.max(0.01, Math.abs(e[1].y - e[0].y));
    if (e[1].x < e[0].x) o.flipH = true; else delete o.flipH;
    if (e[1].y < e[0].y) o.flipV = true; else delete o.flipV;
    delete o.rot;
    return true;
  }
  if (role === 'bx-rot'){
    let a = Math.atan2(P.y - c.y, P.x - c.x) * 180 / Math.PI + 90;
    // прилипает к кратным 15°, Shift — только кратные 15°
    const near = Math.round(a / 15) * 15;
    if (bxShift || Math.abs(a - near) < 4) a = near;
    a = ((a % 360) + 540) % 360 - 180;
    if (Math.abs(a) < 0.01){ delete o.rot; }
    else o.rot = +a.toFixed(2);
    return true;
  }
  const s = bxSize(o);
  // повёрнутой рамке прилипание к клеткам не нужно — точка без него
  const lp = bxToLocal(o, o.rot ? P : pt);
  const k = role.slice(3);
  let x0 = 0, y0 = 0, x1 = s.w, y1 = s.h;
  const MIN = 8;
  if (k.indexOf('w') >= 0) x0 = Math.min(lp.x, x1 - MIN);
  if (k.indexOf('e') >= 0) x1 = Math.max(lp.x, x0 + MIN);
  if (k.indexOf('n') >= 0) y0 = Math.min(lp.y, y1 - MIN);
  if (k.indexOf('s') >= 0) y1 = Math.max(lp.y, y0 + MIN);
  // пропорции: у картинки всегда, у остального — с Shift и только за угол
  if (k.length === 2 && (o.type === 'image' || bxShift)){
    const ratio = s.w / s.h;
    let nw = x1 - x0, nh = y1 - y0;
    if (nw / nh > ratio) nw = nh * ratio; else nh = nw / ratio;
    if (k.indexOf('w') >= 0) x0 = x1 - nw; else x1 = x0 + nw;
    if (k.indexOf('n') >= 0) y0 = y1 - nh; else y1 = y0 + nh;
  }
  const nw = x1 - x0, nh = y1 - y0;
  const lc = { x: (x0 + x1) / 2 - s.w / 2, y: (y0 + y1) / 2 - s.h / 2 };
  const wc = bxRotPt({ x: c.x + lc.x, y: c.y + lc.y }, c, o.rot || 0);
  if (o.type === 'table'){
    const fx = nw / s.w, fy = nh / s.h;
    o.cols = (o.cols || []).map(v => v * fx);
    o.rows = (o.rows || []).map(v => v * fy);
  }
  o.w = nw; o.h = nh;
  o.points[0] = { x: wc.x - nw / 2, y: wc.y - nh / 2 };
  return true;
}
function bxDrawSelection(c, o, camv){
  const isImg = o.type === 'image';
  if (!bxIsFrame(o) && !(isImg && bxMayRotateImage(o))) return false;
  if (isImg && !o.rot){
    // не повёрнутая картинка: свои ручки рисует доска, здесь только поворот
    return false;
  }
  if (bxIsLine(o)){
    c.save();
    bxHandles(o).forEach(h => { const s = worldToScreen(h); c.fillStyle = '#fff'; c.strokeStyle = themeVar('--ink') || '#2e7de0'; c.lineWidth = 1.5; c.beginPath(); c.arc(s.x, s.y, 5.5, 0, Math.PI * 2); c.fill(); c.stroke(); });
    c.restore();
    return true;
  }
  const pts = bxCorners(o).map(p => worldToScreen(p));
  c.save();
  c.strokeStyle = themeVar('--ink') || '#2e7de0'; c.lineWidth = 1.2; c.setLineDash([5, 3]);
  c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)); c.closePath(); c.stroke();
  c.setLineDash([]);
  const hs = bxHandles(o);
  const top = worldToScreen(bxRotPt({ x: o.points[0].x + bxSize(o).w / 2, y: o.points[0].y }, bxCenter(o), o.rot || 0));
  hs.forEach(h => {
    const s = worldToScreen(h);
    if (h.role === 'bx-rot'){ bxDrawRotKnob(c, s, top); return; }
    c.fillStyle = '#fff'; c.strokeStyle = themeVar('--ink') || '#2e7de0'; c.lineWidth = 1.5;
    c.beginPath(); c.rect(s.x - 4.5, s.y - 4.5, 9, 9); c.fill(); c.stroke();
  });
  c.restore();
  return true;
}
function bxDrawRotKnob(c, s, top){
  c.save();
  c.strokeStyle = themeVar('--ink') || '#2e7de0'; c.lineWidth = 1.2;
  if (top){ c.beginPath(); c.moveTo(top.x, top.y); c.lineTo(s.x, s.y); c.stroke(); }
  c.fillStyle = '#fff'; c.lineWidth = 1.5;
  c.beginPath(); c.arc(s.x, s.y, 7, 0, Math.PI * 2); c.fill(); c.stroke();
  c.beginPath(); c.arc(s.x, s.y, 3.4, -Math.PI * 0.15, Math.PI * 1.2); c.lineWidth = 1.4; c.stroke();
  c.restore();
}
// не повёрнутая картинка: доска рисует свои ручки кружками, а ручку поворота
// дорисовываем отсюда (зовётся из drawSelection после своих)
function bxDrawImageRotKnob(c, o){
  const h = bxImageRotHandle(o);
  if (!h) return;
  bxDrawRotKnob(c, worldToScreen(h), worldToScreen({ x: o.points[0].x + o.w / 2, y: o.points[0].y }));
}
// поворот картинки при рисовании: renderImageObject зовёт до drawImage
function bxImageTransform(c, o){
  if (!o.rot) return;
  const ctr = worldToScreen(bxCenter(o));
  c.translate(ctr.x, ctr.y); c.rotate(o.rot * Math.PI / 180); c.translate(-ctr.x, -ctr.y);
}

/* ── 8. Правка текста блока и ячейки ─────────────────────────────────────
   Поле contenteditable ровно поверх блока (тот же поворот и масштаб, шрифты
   те же), под ним на холсте текст этого блока не рисуется. Оформление
   выделенного — штатными командами браузера (execCommand со стилями), а при
   закрытии DOM разбирается обратно в абзацы и куски по ВЫЧИСЛЕННЫМ стилям:
   так не важно, какими тегами браузер это оформил. Сохраняется одним шагом
   отмены, как любая правка доски. */
function bxPxPerPt(){ return 2 * ((typeof B !== 'undefined' && B && B.cellSize) || 24) * 2.54 / 72; }
const BX_SIZES = [8, 9, 10, 10.5, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 44, 48, 54, 60, 66, 72, 80, 88, 96, 120];
const BX_AL = { l: 'left', c: 'center', r: 'right', j: 'justify', d: 'justify' };
const BX_AL_BACK = { left: 'l', start: 'l', center: 'c', right: 'r', end: 'r', justify: 'j' };
let bxEd = null;   // { o, cell, wrap, root, tx, anchor, fill, line, startJson }

(function bxInjectCss(){
  const st = document.createElement('style');
  st.textContent = `
.bx-ed{position:fixed;left:0;top:0;z-index:281;transform-origin:0 0;display:flex;flex-direction:column;box-sizing:border-box;outline:1.5px dashed color-mix(in srgb, var(--ink,#2e7de0) 70%, transparent);outline-offset:2px}
.bx-ed[data-anchor="m"]{justify-content:center}.bx-ed[data-anchor="b"]{justify-content:flex-end}
.bx-ed-in{outline:none;white-space:pre-wrap;word-wrap:break-word;overflow-wrap:break-word;caret-color:var(--ink,#2e7de0);min-height:1em}
.bx-ed-in .bx-p{margin:0;min-height:1em}
.bx-ed-in .bx-p[data-bt]::before{content:attr(data-bt);display:inline-block;min-width:var(--bw,0px);text-indent:0;font-weight:normal;font-style:normal;text-decoration:none}
.bx-bar{position:fixed;z-index:400;display:flex;flex-wrap:wrap;align-items:center;gap:2px;max-width:min(760px,calc(100vw - 24px));padding:5px;border-radius:14px;background:var(--glass-strong);backdrop-filter:blur(24px) saturate(180%);-webkit-backdrop-filter:blur(24px) saturate(180%);border:1px solid var(--glass-border);box-shadow:var(--shadow);font-family:var(--font-ui);font-size:13px;color:var(--pencil)}
.bx-bar[hidden],.bx-bar [hidden]{display:none!important}
.bx-bar button{height:30px;min-width:30px;border:none;border-radius:9px;background:transparent;color:var(--ink);font:inherit;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;padding:0 6px;gap:4px}
.bx-bar button:hover{background:color-mix(in srgb, var(--ink) 10%, transparent)}
.bx-bar button[aria-pressed="true"]{background:color-mix(in srgb, var(--ink) 18%, transparent)}
.bx-bar select,.bx-bar input[type=text]{height:30px;border-radius:9px;border:1px solid var(--glass-border);background:var(--card,#fff);color:var(--pencil);font:inherit;padding:0 6px}
.bx-bar select{max-width:150px}
.bx-bar input.bx-size{width:46px;text-align:center}
.bx-bar .bx-sep{width:1px;height:22px;background:var(--glass-border);margin:0 3px}
.bx-bar .bx-sw{width:14px;height:14px;border-radius:4px;border:1px solid rgba(0,0,0,.25);display:inline-block}
.bx-pal{position:fixed;z-index:440;display:grid;grid-template-columns:repeat(8,22px);gap:5px;padding:9px;border-radius:12px;background:var(--glass-strong);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid var(--glass-border);box-shadow:var(--shadow)}
.bx-pal[hidden]{display:none}
.bx-pal button{width:22px;height:22px;border-radius:6px;border:1px solid rgba(0,0,0,.2);cursor:pointer;padding:0}
.bx-pal .bx-pal-row{grid-column:1/-1;display:flex;gap:6px;align-items:center;font-family:var(--font-ui);font-size:12px;color:var(--pencil)}
.bx-pal .bx-pal-row button{width:auto;height:24px;padding:0 8px;background:transparent;color:var(--ink);font-weight:600}
`;
  document.head.appendChild(st);
})();

// поле, панель и палитра — в том же слое, что меню презентации, иначе
// они перекрывали бы меню «Вставить» и «Файл» (разные слои наложения)
function bxHost(){ return (typeof screenBoard !== 'undefined' && screenBoard) || document.body; }
function bxFindObj(id){ return (typeof B !== 'undefined' && B && B.objects) ? B.objects.find(o => o.id === id) : null; }
function bxEdText(o, cell){
  if (o.type === 'table'){ const c = o.cells && o.cells[cell[0]] && o.cells[cell[0]][cell[1]]; return (c && c.text) || bxTextOf('', { sz: 24 }); }
  return o.text || bxTextOf('', { sz: 32 });
}
function bxDefRun(tx){
  for (const p of (tx.paras || [])) for (const r of (p.runs || [])) if (r) return r;
  if (tx.def) return tx.def;
  const esz = (tx.paras && tx.paras[0] && tx.paras[0].esz) || 32;
  return { sz: esz, c: '#1D1D1F', f: BX_DEF_FONT };
}
function bxRunStyle(el, r){
  el.style.fontFamily = '"' + bxFace(r.f) + '", sans-serif';
  el.style.fontSize = ((r.sz || 24) * (r.bl ? 0.66 : 1)) + 'px';
  el.style.fontWeight = r.b ? '700' : '400';
  el.style.fontStyle = r.i ? 'italic' : 'normal';
  el.style.color = r.c || '#000000';
  const dec = (r.u ? 'underline ' : '') + (r.s ? 'line-through' : '');
  if (dec.trim()) el.style.textDecorationLine = dec.trim();
  if (r.hl) el.style.backgroundColor = r.hl;
  if (r.bl) el.style.verticalAlign = r.bl === 'sup' ? 'super' : 'sub';
  el.dataset.f = r.f || BX_DEF_FONT;
  el.dataset.sz = String(r.sz || 24);
}
function bxParaStyle(div, p, i){
  div.className = 'bx-p';
  div.style.textAlign = BX_AL[p.al] || 'left';
  div.style.paddingLeft = (p.ind || 0) + 'px';
  div.style.textIndent = (p.fi || 0) + 'px';
  div.style.marginTop = (i ? (p.sb || 0) : 0) + 'px';
  div.style.marginBottom = (p.sa || 0) + 'px';
  div.style.lineHeight = p.lsPx ? p.lsPx + 'px' : String(1.2 * (p.ls || 1));
  ['ind', 'fi', 'sb', 'sa', 'ls', 'lsPx', 'lvl', 'esz'].forEach(k => { if (p[k] != null) div.dataset[k] = String(p[k]); });
  if (p.bu) div.dataset.bu = JSON.stringify(p.bu); else delete div.dataset.bu;
}
function bxBuildDom(root, tx){
  root.innerHTML = '';
  const def = bxDefRun(tx);
  root.style.fontFamily = '"' + bxFace(def.f) + '", sans-serif';
  root.style.fontSize = (def.sz || 24) + 'px';
  root.style.color = def.c || '#000';
  root.style.fontWeight = def.b ? '700' : '400';
  root.style.fontStyle = def.i ? 'italic' : 'normal';
  (tx.paras && tx.paras.length ? tx.paras : [{ runs: [], esz: def.sz }]).forEach((p, i) => {
    const div = document.createElement('div');
    bxParaStyle(div, p, i);
    const runs = (p.runs || []).filter(r => r && r.t);
    if (!runs.length){
      const sz = p.esz || def.sz || 24;
      div.style.fontSize = sz + 'px';
      div.appendChild(document.createElement('br'));
    }
    runs.forEach(r => {
      const parts = r.t.split('\n');
      parts.forEach((part, k) => {
        if (k) div.appendChild(document.createElement('br'));
        if (!part) return;
        const sp = document.createElement('span');
        bxRunStyle(sp, r);
        sp.textContent = part;
        div.appendChild(sp);
      });
    });
    root.appendChild(div);
  });
  bxRenumber(root);
}
// маркеры и номера в поле правки — пересчёт после каждого изменения
function bxRenumber(root){
  const counters = [];
  [...root.children].forEach(div => {
    if (!div.classList || !div.classList.contains('bx-p')) return;
    let bu = null;
    try { bu = div.dataset.bu ? JSON.parse(div.dataset.bu) : null; } catch (e) {}
    const lvl = +div.dataset.lvl || 0;
    counters.length = Math.min(counters.length, lvl + 1);
    if (bu && bu.num){ counters[lvl] = (counters[lvl] || ((bu.start || 1) - 1)) + 1; div.dataset.bt = bxNumText(bu.num, counters[lvl]); }
    else { counters[lvl] = 0; if (bu && bu.ch) div.dataset.bt = bu.ch; else delete div.dataset.bt; }
    const fi = parseFloat(div.dataset.fi) || 0;
    div.style.setProperty('--bw', Math.max(0, -fi) + 'px');
  });
}
// DOM → абзацы и куски, по вычисленным стилям
function bxParseDom(root){
  // браузер мог положить текст прямо в корень (всё стёрли и печатают заново)
  [...root.childNodes].forEach(n => {
    if (n.nodeType === 1 && (n.tagName === 'DIV' || n.tagName === 'P')) return;
    const div = document.createElement('div');
    div.className = 'bx-p';
    root.insertBefore(div, n);
    div.appendChild(n);
  });
  const paras = [];
  [...root.children].forEach(div => {
    const ds = div.dataset || {};
    const p = { runs: [] };
    const al = BX_AL_BACK[(div.style.textAlign || getComputedStyle(div).textAlign || 'left')] || 'l';
    if (al !== 'l') p.al = al;
    ['ind', 'fi', 'sb', 'sa', 'ls', 'lsPx', 'lvl', 'esz'].forEach(k => { if (ds[k] != null && ds[k] !== '') p[k] = +ds[k]; });
    if (ds.bu){ try { p.bu = JSON.parse(ds.bu); } catch (e) {} }
    const push = (t, el) => {
      const cs = getComputedStyle(el);
      let bl = null, u = false, s = false, hl = null, f = null;
      for (let a = el; a && a !== div.parentNode; a = a.parentElement){
        const tg = a.tagName;
        if (tg === 'SUP' || a.style.verticalAlign === 'super') bl = bl || 'sup';
        if (tg === 'SUB' || a.style.verticalAlign === 'sub') bl = bl || 'sub';
        if (tg === 'U' || tg === 'INS' || /underline/.test(a.style.textDecorationLine || a.style.textDecoration || '')) u = true;
        if (tg === 'S' || tg === 'STRIKE' || tg === 'DEL' || /line-through/.test(a.style.textDecorationLine || a.style.textDecoration || '')) s = true;
        if (!hl && a !== div && a.style.backgroundColor) hl = bxCssColorToHex(a.style.backgroundColor);
        if (!f && a.dataset && a.dataset.f) f = a.dataset.f;
        if (a === div) break;
      }
      const face = (cs.fontFamily || '').split(',')[0].replace(/["']/g, '').trim();
      if (!f || bxFace(f) !== face) f = BX_FACES[face] ? bxFaceName(face) : BX_DEF_FONT;
      let sz = parseFloat(cs.fontSize) || 24;
      if (bl){
        // у верхнего/нижнего индекса размер — у ближайшего предка без индекса
        for (let a = el; a && a !== div.parentNode; a = a.parentElement){
          if (a.tagName === 'SUP' || a.tagName === 'SUB' || a.style.verticalAlign) continue;
          sz = a.dataset && a.dataset.sz ? +a.dataset.sz : parseFloat(getComputedStyle(a).fontSize) || sz;
          break;
        }
      } else if (el.dataset && el.dataset.sz && Math.abs(+el.dataset.sz - sz) < 0.6) sz = +el.dataset.sz;
      const r = { t, sz: +sz.toFixed(2), c: bxCssColorToHex(cs.color) || '#000000', f };
      if (parseInt(cs.fontWeight, 10) >= 600) r.b = true;
      if (cs.fontStyle === 'italic' || cs.fontStyle === 'oblique') r.i = true;
      if (u) r.u = true;
      if (s) r.s = true;
      if (hl) r.hl = hl;
      if (bl) r.bl = bl;
      const last = p.runs[p.runs.length - 1];
      const same = last && ['sz', 'c', 'f', 'b', 'i', 'u', 's', 'hl', 'bl'].every(k => (last[k] || null) === (r[k] || null));
      if (same) last.t += t; else p.runs.push(r);
    };
    // текст и переносы по порядку; последний <br> абзаца — служебный
    // (так браузер держит пустую строку), остальные — перенос строки
    const seq = [];
    const walk = (n) => {
      n.childNodes.forEach(ch => {
        if (ch.nodeType === 3){ const t = ch.nodeValue.replace(/\u200B/g, ''); if (t) seq.push({ t, el: ch.parentElement }); }
        else if (ch.nodeType === 1){ if (ch.tagName === 'BR') seq.push({ br: true, el: ch.parentElement }); else walk(ch); }
      });
    };
    walk(div);
    if (seq.length && seq[seq.length - 1].br) seq.pop();
    seq.forEach(it => { if (it.br) push('\n', it.el); else push(it.t, it.el); });
    if (!p.runs.length) p.esz = +(parseFloat(getComputedStyle(div).fontSize) || p.esz || 24).toFixed(2);
    paras.push(p);
  });
  return paras;
}
function bxEditRect(o, cell){
  // рамка поля правки в мире: блок целиком или ячейка таблицы
  if (o.type !== 'table'){
    // поле правки — над областью текста фигуры (у овала, ромба — внутри)
    const s = bxSize(o), ins = bxTextInset(o, s.w, s.h), c0 = bxCenter(o);
    const lc = { x: (ins[0] - ins[2]) / 2, y: (ins[1] - ins[3]) / 2 };
    return { c: bxRotPt({ x: c0.x + lc.x, y: c0.y + lc.y }, c0, o.rot || 0), w: Math.max(4, s.w - ins[0] - ins[2]), h: Math.max(4, s.h - ins[1] - ins[3]) };
  }
  const L = bxTableLayout(o), cl = o.cells[cell[0]][cell[1]], R = bxCellRect(L, cell[0], cell[1], cl);
  const lc = { x: R.x + R.w / 2 - L.size.w / 2, y: R.y + R.h / 2 - L.size.h / 2 };
  const c0 = bxCenter(o);
  return { c: bxRotPt({ x: c0.x + lc.x, y: c0.y + lc.y }, c0, o.rot || 0), w: R.w, h: R.h };
}
function bxOpenEditor(o, pt){
  if (!o || (o.type !== 'box' && o.type !== 'table')) return;
  if (typeof mayTouch === 'function' && !mayTouch(o)) return;
  if (typeof mayDraw === 'function' && !mayDraw()) return;
  if (bxEd) bxCloseEditor(true);
  let cell = null;
  if (o.type === 'table'){
    cell = (pt && bxTableCellAt(o, bxToLocal(o, pt))) || [0, 0];
    const cl = o.cells && o.cells[cell[0]] && o.cells[cell[0]][cell[1]];
    if (!cl) return;
  }
  const tx = bxEdText(o, cell);
  const wrap = document.createElement('div');
  wrap.className = 'bx-ed';
  const root = document.createElement('div');
  root.className = 'bx-ed-in';
  root.contentEditable = 'true';
  root.spellcheck = false;
  wrap.appendChild(root);
  bxHost().appendChild(wrap);
  const pad = tx.pad || (o.type === 'table' ? BX_CELL_PAD : [10, 5, 10, 5]);
  wrap.style.padding = pad[1] + 'px ' + pad[2] + 'px ' + pad[3] + 'px ' + pad[0] + 'px';
  bxBuildDom(root, tx);
  bxEd = { o, id: o.id, cell, wrap, root, tx, anchor: tx.anchor || (o.type === 'table' ? 'm' : 't'), startHtml: root.innerHTML, pad };
  wrap.dataset.anchor = bxEd.anchor;
  bxEditing = { id: o.id, cell };
  try { document.execCommand('styleWithCSS', false, true); document.execCommand('defaultParagraphSeparator', false, 'div'); } catch (e) {}
  root.addEventListener('input', () => { bxRenumber(root); bxEditorSync(); bxBarState(); });
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Escape'){ e.preventDefault(); bxCloseEditor(true); return; }
    if (e.key === 'Tab'){ e.preventDefault(); bxEdIndent(e.shiftKey ? -1 : 1); return; }
    e.stopPropagation();
  });
  bxEditorSync();
  root.focus();
  // курсор — в конец текста
  try { const r = document.createRange(); r.selectNodeContents(root); r.collapse(false); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); } catch (e) {}
  bxShowBar();
  if (typeof scheduleRedraw === 'function') scheduleRedraw();
}
function bxEditorSync(){
  // №103: панель презентации (deck-toolbar.js) меняет правую часть полосы
  // на оформление, когда что-то выделено, — узнаёт об этом здесь, раз в
  // кадр, ПОСЛЕ bxSelectionTick (он показывает или прячет панель оформления)
  if (!bxEd) { bxSelectionTick(); bxBarFollow(); if (typeof deckTbSelTick === 'function') deckTbSelTick(); return; }
  const o = bxFindObj(bxEd.id);
  if (!o || !boardActive){ bxCloseEditor(false); return; }
  bxEd.o = o;
  const R = bxEditRect(o, bxEd.cell);
  const cr = canvas.getBoundingClientRect(), z = cam.zoom;
  const sc = { x: (R.c.x - cam.x) * z, y: (R.c.y - cam.y) * z };
  const w = bxEd.wrap;
  w.style.width = R.w + 'px';
  w.style.minHeight = R.h + 'px';
  // таблица и «подгонять по тексту» растут вместе с набором
  w.style.height = (o.type === 'table' || (bxEd.tx && bxEd.tx.fit === 'grow')) ? 'auto' : R.h + 'px';
  w.style.transform = `translate(${cr.left + sc.x}px, ${cr.top + sc.y}px) rotate(${o.rot || 0}deg) scale(${z}) translate(${-R.w / 2}px, ${-R.h / 2}px)`;
  bxBarFollow();
  if (typeof deckTbSelTick === 'function') deckTbSelTick();
}
// закрыть: true — сохранить, false — просто убрать поле
function bxCloseEditor(save){
  if (!bxEd) return;
  const ed = bxEd;
  bxEd = null;
  bxEditing = null;
  if (save && ed.root.innerHTML !== ed.startHtml){
    const o = bxFindObj(ed.id);
    if (o){
      const paras = bxParseDom(ed.root);
      const ntx = Object.assign({}, ed.tx, { paras });
      if (ed.anchor) ntx.anchor = ed.anchor;
      if (typeof pushUndo === 'function') pushUndo();
      bxSetText(o, ed.cell, ntx);
      if (typeof saveDB === 'function') saveDB();
    }
  }
  ed.wrap.remove();
  bxHidePal();
  if (typeof scheduleRedraw === 'function') scheduleRedraw();
  bxShowBar();
}
// текст объекта меняется всегда новым объектом — кэши раскладки по нему
function bxSetText(o, cell, ntx){
  if (o.type === 'table'){
    const cells = o.cells.map(row => row.slice());
    cells[cell[0]][cell[1]] = Object.assign({}, cells[cell[0]][cell[1]], { text: ntx });
    o.cells = cells;
  } else {
    o.text = ntx;
    // «подгонять размер фигуры под текст» — высота по тексту
    if (ntx.fit === 'grow'){ const fr = bxTextFrameRaw(ntx, o.w, 1e6); const pad = ntx.pad || [10, 5, 10, 5]; o.h = Math.max(8, fr.lay.h + pad[1] + pad[3]); }
  }
}
// щелчок мимо поля и панели — сохранить и закрыть
document.addEventListener('pointerdown', (e) => {
  if (!bxEd) return;
  if (bxEd.wrap.contains(e.target) || (bxBarEl && bxBarEl.contains(e.target)) || (bxPalEl && bxPalEl.contains(e.target))) return;
  bxCloseEditor(true);
}, true);

/* ── 9. Панель оформления ─────────────────────────────────────────────────
   Одна панель на два случая: идёт правка текста — кнопки меняют выделенное;
   блок или таблица просто выделены — кнопки меняют весь текст объекта, а
   «Заливка» и «Контур» — саму фигуру. Каждое изменение без правки — один
   шаг отмены. */
let bxBarEl = null, bxPalEl = null, bxBarFor = null;
const BX_PALETTE = ['#000000', '#404040', '#7F7F7F', '#BFBFBF', '#FFFFFF', '#1F3864', '#2F5597', '#4472C4',
  '#C00000', '#FF0000', '#ED7D31', '#FFC000', '#FFFF00', '#70AD47', '#00B050', '#00B0F0',
  '#7030A0', '#E7E6E6', '#DDEBF7', '#FBE5D6', '#FFF2CC', '#E2EFDA', '#D9D2E9', '#FCE4D6'];
const BX_ICON = {
  al: { l: '<svg width="16" height="16" viewBox="0 0 16 16"><path d="M2 3h12M2 6.5h8M2 10h12M2 13.5h8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
        c: '<svg width="16" height="16" viewBox="0 0 16 16"><path d="M2 3h12M4 6.5h8M2 10h12M4 13.5h8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
        r: '<svg width="16" height="16" viewBox="0 0 16 16"><path d="M2 3h12M6 6.5h8M2 10h12M6 13.5h8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
        j: '<svg width="16" height="16" viewBox="0 0 16 16"><path d="M2 3h12M2 6.5h12M2 10h12M2 13.5h8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>' },
  bul: '<svg width="16" height="16" viewBox="0 0 16 16"><circle cx="3" cy="4" r="1.4" fill="currentColor"/><circle cx="3" cy="8" r="1.4" fill="currentColor"/><circle cx="3" cy="12" r="1.4" fill="currentColor"/><path d="M6.5 4h7.5M6.5 8h7.5M6.5 12h7.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  num: '<svg width="16" height="16" viewBox="0 0 16 16"><text x="0.5" y="6" font-size="5.5" font-family="sans-serif" fill="currentColor">1.</text><text x="0.5" y="13" font-size="5.5" font-family="sans-serif" fill="currentColor">2.</text><path d="M6.5 4h7.5M6.5 11h7.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  ind: '<svg width="16" height="16" viewBox="0 0 16 16"><path d="M7 3h7M7 8h7M7 13h7M2 5.5l2.5 2.5L2 10.5" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  out: '<svg width="16" height="16" viewBox="0 0 16 16"><path d="M7 3h7M7 8h7M7 13h7M4.5 5.5L2 8l2.5 2.5" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  at: '<svg width="16" height="16" viewBox="0 0 16 16"><rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" stroke-width="1.3" fill="none"/><path d="M5 5h6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  am: '<svg width="16" height="16" viewBox="0 0 16 16"><rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" stroke-width="1.3" fill="none"/><path d="M5 8h6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  ab: '<svg width="16" height="16" viewBox="0 0 16 16"><rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" stroke-width="1.3" fill="none"/><path d="M5 11h6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
};
function bxBarTarget(){
  if (bxEd) return bxFindObj(bxEd.id);
  if (typeof selectedId === 'undefined' || !selectedId || (typeof multiSelectIds !== 'undefined' && multiSelectIds.length)) return null;
  const o = bxFindObj(selectedId);
  if (!o || (o.type !== 'box' && o.type !== 'table')) return null;
  if (typeof mayTouch === 'function' && !mayTouch(o)) return null;
  if (window.deckViewerMode) return null;
  return o;
}
function bxBuildBar(){
  if (bxBarEl) return bxBarEl;
  const bar = document.createElement('div');
  bar.className = 'bx-bar';
  bar.hidden = true;
  bar.setAttribute('role', 'toolbar');
  bar.setAttribute('aria-label', 'Оформление текста и фигуры');
  const fontOpts = BX_FONT_MENU.map(n => `<option value="${n}" style="font-family:'${bxFace(n)}'">${n}</option>`).join('');
  bar.innerHTML = `
    <select data-bx="font" title="Шрифт">${fontOpts}</select>
    <button data-bx="sz-" title="Меньше">A−</button><input class="bx-size" data-bx="size" type="text" inputmode="decimal" title="Размер, пт"><button data-bx="sz+" title="Больше">A+</button>
    <span class="bx-sep"></span>
    <button data-bx="b" title="Жирный (⌘/Ctrl+B)"><b>Ж</b></button><button data-bx="i" title="Курсив (⌘/Ctrl+I)"><i>К</i></button>
    <button data-bx="u" title="Подчёркнутый (⌘/Ctrl+U)"><u>Ч</u></button><button data-bx="s" title="Зачёркнутый"><s>З</s></button>
    <button data-bx="sup" title="Верхний индекс">x²</button><button data-bx="sub" title="Нижний индекс">x₂</button>
    <button data-bx="color" title="Цвет текста">А<span class="bx-sw" data-sw="color"></span></button>
    <button data-bx="hl" title="Выделение цветом">✎<span class="bx-sw" data-sw="hl"></span></button>
    <span class="bx-sep"></span>
    <button data-bx="al-l" title="По левому краю">${BX_ICON.al.l}</button><button data-bx="al-c" title="По центру">${BX_ICON.al.c}</button>
    <button data-bx="al-r" title="По правому краю">${BX_ICON.al.r}</button><button data-bx="al-j" title="По ширине">${BX_ICON.al.j}</button>
    <span class="bx-sep"></span>
    <button data-bx="bul" title="Маркированный список">${BX_ICON.bul}</button><button data-bx="num" title="Нумерованный список">${BX_ICON.num}</button>
    <button data-bx="out" title="Уменьшить отступ (Shift+Tab)">${BX_ICON.out}</button><button data-bx="ind" title="Увеличить отступ (Tab)">${BX_ICON.ind}</button>
    <span class="bx-sep"></span>
    <button data-bx="an-t" title="Текст сверху">${BX_ICON.at}</button><button data-bx="an-m" title="Текст посередине">${BX_ICON.am}</button><button data-bx="an-b" title="Текст снизу">${BX_ICON.ab}</button>
    <span class="bx-sep" data-shape></span>
    <button data-bx="fill" data-shape title="Заливка фигуры">Заливка<span class="bx-sw" data-sw="fill"></span></button>
    <button data-bx="line" data-shape title="Контур фигуры">Контур<span class="bx-sw" data-sw="line"></span></button>
    <select data-bx="lw" data-shape title="Толщина контура"><option value="0.75">тонкий</option><option value="1.5">1½</option><option value="2.25">2¼</option><option value="3">3</option><option value="4.5">4½</option><option value="6">6</option></select>
    <span class="bx-sep" data-table></span>
    <button data-bx="row+" data-table title="Добавить строку ниже">+ строка</button><button data-bx="col+" data-table title="Добавить столбец справа">+ столбец</button>
    <button data-bx="row-" data-table title="Удалить строку">− строка</button><button data-bx="col-" data-table title="Удалить столбец">− столбец</button>
  `;
  bxHost().appendChild(bar);
  // кнопки не забирают фокус у поля правки — иначе выделение в нём пропадёт
  bar.addEventListener('pointerdown', (e) => { if (!e.target.closest('select,input')) e.preventDefault(); });
  bar.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-bx]');
    if (!b) return;
    bxBarAction(b.dataset.bx, b);
  });
  bar.querySelector('[data-bx="font"]').addEventListener('change', (e) => bxBarAction('font', e.target));
  bar.querySelector('[data-bx="lw"]').addEventListener('change', (e) => bxBarAction('lw', e.target));
  const sizeIn = bar.querySelector('[data-bx="size"]');
  sizeIn.addEventListener('keydown', (e) => { if (e.key === 'Enter'){ e.preventDefault(); bxBarAction('size', sizeIn); } e.stopPropagation(); });
  sizeIn.addEventListener('change', () => bxBarAction('size', sizeIn));
  bxBarEl = bar;
  return bar;
}
function bxShowBar(){
  const o = bxBarTarget();
  if (!o){ if (bxBarEl) bxBarEl.hidden = true; bxBarFor = null; bxHidePal(); return; }
  const bar = bxBuildBar();
  bar.hidden = false;
  bxBarFor = o.id;
  const isTable = o.type === 'table';
  bar.querySelectorAll('[data-shape]').forEach(el => { el.hidden = isTable; });
  bar.querySelectorAll('[data-table]').forEach(el => { el.hidden = !(isTable && bxEd); });
  bxBarState();
  bxBarFollow();
}
// панель — над объектом (если сверху нет места — под ним), целиком в окне
function bxBarFollow(){
  if (!bxBarEl || bxBarEl.hidden || !bxBarFor) return;
  // №103: в презентации панель вставлена в верхнюю полосу и стоит на месте
  if (bxBarEl.dataset.docked) return;
  const o = bxFindObj(bxBarFor);
  if (!o){ bxBarEl.hidden = true; return; }
  const bb = bxBBox(o) || objectBBox(o);
  const cr = canvas.getBoundingClientRect(), z = cam.zoom;
  // и не закрывать ручку поворота над объектом
  const rp = bxRotHandlePos(o);
  const top = cr.top + (Math.min(bb.minY, rp.y) - cam.y) * z - 12, bottom = cr.top + (bb.maxY - cam.y) * z;
  const left = cr.left + ((bb.minX + bb.maxX) / 2 - cam.x) * z;
  const bw = bxBarEl.offsetWidth, bh = bxBarEl.offsetHeight;
  let y = top - bh - 14;
  if (y < 70) y = Math.min(window.innerHeight - bh - 8, bottom + 14);
  const x = Math.max(8, Math.min(window.innerWidth - bw - 8, left - bw / 2));
  bxBarEl.style.left = x + 'px';
  bxBarEl.style.top = Math.max(8, y) + 'px';
}
function bxAllRuns(o){ const out = []; bxEachText(o, tx => tx.paras.forEach(p => (p.runs || []).forEach(r => out.push(r)))); return out; }
function bxBarState(){
  if (!bxBarEl || bxBarEl.hidden) return;
  const o = bxFindObj(bxBarFor);
  if (!o) return;
  const set = (k, on) => { const b = bxBarEl.querySelector(`[data-bx="${k}"]`); if (b) b.setAttribute('aria-pressed', on ? 'true' : 'false'); };
  let first = null, al = 'l', anchor = 't';
  if (bxEd){
    const q = (c) => { try { return document.queryCommandState(c); } catch (e) { return false; } };
    set('b', q('bold')); set('i', q('italic')); set('u', q('underline')); set('s', q('strikeThrough'));
    set('sup', q('superscript')); set('sub', q('subscript'));
    const sel = getSelection();
    const node = sel && sel.anchorNode ? (sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentElement : sel.anchorNode) : null;
    if (node && bxEd.root.contains(node)){
      const cs = getComputedStyle(node);
      const face = (cs.fontFamily || '').split(',')[0].replace(/["']/g, '').trim();
      first = { f: bxFaceName(face), sz: parseFloat(cs.fontSize) || 24, c: bxCssColorToHex(cs.color) };
      const para = node.closest('.bx-p');
      if (para) al = BX_AL_BACK[para.style.textAlign] || 'l';
      const fp = node.closest('[data-f]');
      if (fp && bxFace(fp.dataset.f) === face) first.f = fp.dataset.f;
    }
    anchor = bxEd.anchor;
  } else {
    const runs = bxAllRuns(o);
    const all = (k) => runs.length && runs.every(r => r[k]);
    set('b', all('b')); set('i', all('i')); set('u', all('u')); set('s', all('s'));
    set('sup', runs.length && runs.every(r => r.bl === 'sup')); set('sub', runs.length && runs.every(r => r.bl === 'sub'));
    first = runs[0] || null;
    const tx = o.type === 'box' ? o.text : (o.cells && o.cells[0] && o.cells[0][0] && o.cells[0][0].text);
    if (tx && tx.paras && tx.paras[0]) al = tx.paras[0].al || 'l';
    anchor = (tx && tx.anchor) || (o.type === 'table' ? 'm' : 't');
  }
  ['l', 'c', 'r', 'j'].forEach(k => set('al-' + k, al === k || (k === 'j' && al === 'd')));
  ['t', 'm', 'b'].forEach(k => set('an-' + k, anchor === k));
  const fs = bxBarEl.querySelector('[data-bx="font"]');
  if (first && fs){
    const name = BX_FONT_MENU.indexOf(first.f) >= 0 ? first.f : null;
    if (!name && first.f && ![...fs.options].some(op => op.value === first.f)){
      const op = document.createElement('option'); op.value = first.f; op.textContent = first.f; fs.appendChild(op);
    }
    fs.value = first.f || BX_DEF_FONT;
  }
  const si = bxBarEl.querySelector('[data-bx="size"]');
  if (si && first && document.activeElement !== si) si.value = String(Math.round((first.sz || 24) / bxPxPerPt() * 2) / 2).replace('.', ',');
  const sw = (k, c) => { const s = bxBarEl.querySelector(`[data-sw="${k}"]`); if (s) s.style.background = c || 'transparent'; };
  sw('color', first && first.c);
  sw('fill', o.fill && (o.fill.c || (o.fill.g && o.fill.g[0] && o.fill.g[0].c)));
  sw('line', o.line && o.line.c);
  const lw = bxBarEl.querySelector('[data-bx="lw"]');
  if (lw && o.line){ const pt = (o.line.w || 1) / bxPxPerPt(); let best = '0.75'; [...lw.options].forEach(op => { if (Math.abs(+op.value - pt) < Math.abs(+best - pt)) best = op.value; }); lw.value = best; }
}
document.addEventListener('selectionchange', () => { if (bxEd) bxBarState(); });

// изменить объект без поля правки — одним шагом отмены
function bxMutate(o, fn){
  if (typeof pushUndo === 'function') pushUndo();
  fn(o);
  if (typeof saveDB === 'function') saveDB();
  if (typeof scheduleRedraw === 'function') scheduleRedraw();
  bxBarState();
}
// все тексты объекта: функция над копией каждого абзаца
function bxMapParas(o, fn){
  if (o.type === 'box'){ const tx = o.text || bxTextOf(''); o.text = Object.assign({}, tx, { paras: tx.paras.map(p => fn(bxClone(p))) }); return; }
  o.cells = o.cells.map(row => row.map(cell => (cell && cell.text) ? Object.assign({}, cell, { text: Object.assign({}, cell.text, { paras: cell.text.paras.map(p => fn(bxClone(p))) }) }) : cell));
}
function bxMapRuns(o, fn){ bxMapParas(o, p => { p.runs = (p.runs || []).map(r => fn(r) || r); return p; }); }
function bxSetAnchorAll(o, a){
  if (o.type === 'box'){ o.text = Object.assign({}, o.text || bxTextOf(''), { anchor: a }); return; }
  o.cells = o.cells.map(row => row.map(cell => (cell && cell.text) ? Object.assign({}, cell, { text: Object.assign({}, cell.text, { anchor: a }) }) : cell));
}
// абзацы поля правки, задетые выделением
function bxSelParas(){
  if (!bxEd) return [];
  const sel = getSelection();
  const all = [...bxEd.root.querySelectorAll(':scope > .bx-p')];
  if (!sel || !sel.rangeCount) return all.slice(0, 1);
  const rg = sel.getRangeAt(0);
  const hit = all.filter(d => rg.intersectsNode(d));
  return hit.length ? hit : all.slice(0, 1);
}
function bxEdIndent(dir){
  bxSelParas().forEach(d => {
    const lvl = Math.max(0, Math.min(8, (+d.dataset.lvl || 0) + dir));
    const step = 45;
    const ind = Math.max(0, (parseFloat(d.dataset.ind) || 0) + dir * step);
    d.dataset.lvl = String(lvl); d.dataset.ind = String(ind);
    d.style.paddingLeft = ind + 'px';
  });
  bxRenumber(bxEd.root); bxEditorSync();
}
function bxToggleList(kind){
  const paras = bxSelParas();
  const has = (d) => { try { const b = JSON.parse(d.dataset.bu || 'null'); return !!(b && (kind === 'num' ? b.num : b.ch)); } catch (e) { return false; } };
  const allOn = paras.length && paras.every(has);
  paras.forEach(d => {
    const sz = parseFloat(getComputedStyle(d).fontSize) || 24;
    const hang = Math.max(30, sz * 1.1);
    if (allOn){
      delete d.dataset.bu;
      const ind = Math.max(0, (parseFloat(d.dataset.ind) || 0) - (parseFloat(d.dataset.fi) < 0 ? -parseFloat(d.dataset.fi) : 0));
      d.dataset.ind = String(ind); d.dataset.fi = '0';
    } else {
      d.dataset.bu = JSON.stringify(kind === 'num' ? { num: 'arabicPeriod' } : { ch: '•' });
      const lvl = +d.dataset.lvl || 0;
      d.dataset.ind = String(lvl * 45 + hang); d.dataset.fi = String(-hang);
    }
    d.style.paddingLeft = d.dataset.ind + 'px';
    d.style.textIndent = d.dataset.fi + 'px';
  });
  bxRenumber(bxEd.root); bxEditorSync();
}
function bxListAll(o, kind){
  const tx = o.type === 'box' ? o.text : null;
  const has = (p) => !!(p.bu && (kind === 'num' ? p.bu.num : p.bu.ch));
  const allOn = tx && tx.paras.length && tx.paras.every(has);
  bxMapParas(o, p => {
    const sz = ((p.runs && p.runs[0] && p.runs[0].sz) || p.esz || 24);
    const hang = Math.max(30, sz * 1.1);
    if (allOn){ delete p.bu; p.ind = Math.max(0, (p.ind || 0) + Math.min(0, p.fi || 0)); p.fi = 0; }
    else { p.bu = kind === 'num' ? { num: 'arabicPeriod' } : { ch: '•' }; p.ind = (p.lvl || 0) * 45 + hang; p.fi = -hang; }
    return p;
  });
}
function bxExec(cmd, val){ try { document.execCommand(cmd, false, val); } catch (e) {} bxRenumber(bxEd.root); bxEditorSync(); bxBarState(); }
// размер выделенного в поле: браузер умеет только «1..7» — ставим 7 и
// заменяем на нужные пиксели
function bxEdSize(px){
  bxExec('fontSize', '7');
  bxEd.root.querySelectorAll('font[size="7"], [style*="xxx-large"], [style*="-webkit-xxx-large"]').forEach(el => {
    if (el.tagName === 'FONT'){ const sp = document.createElement('span'); sp.style.fontSize = px + 'px'; sp.dataset.sz = String(px); while (el.firstChild) sp.appendChild(el.firstChild); el.replaceWith(sp); }
    else { el.style.fontSize = px + 'px'; el.dataset.sz = String(px); }
  });
  bxEditorSync(); bxBarState();
}
function bxNextSize(pt, dir){
  if (dir > 0) return BX_SIZES.find(s => s > pt + 0.01) || Math.round(pt * 1.2);
  const smaller = BX_SIZES.filter(s => s < pt - 0.01);
  return smaller.length ? smaller[smaller.length - 1] : Math.max(1, Math.round(pt * 0.8));
}
function bxBarAction(k, el){
  const o = bxFindObj(bxBarFor);
  if (!o) return;
  const ed = !!bxEd;
  const k2 = { b: 'bold', i: 'italic', u: 'underline', s: 'strikeThrough', sup: 'superscript', sub: 'subscript' };
  if (k2[k]){
    if (ed){ bxExec(k2[k]); return; }
    const runs = bxAllRuns(o);
    if (k === 'sup' || k === 'sub'){ const on = runs.length && runs.every(r => r.bl === k); bxMutate(o, x => bxMapRuns(x, r => { if (on) delete r.bl; else r.bl = k; })); return; }
    const on = runs.length && runs.every(r => r[k]);
    bxMutate(o, x => bxMapRuns(x, r => { if (on) delete r[k]; else r[k] = true; }));
    return;
  }
  if (k === 'font'){
    const f = el.value;
    if (ed){ bxExec('fontName', bxFace(f)); bxEd.root.querySelectorAll('[style*="font-family"]').forEach(sp => { if (sp.style.fontFamily.indexOf(bxFace(f)) >= 0) sp.dataset.f = f; }); return; }
    bxMutate(o, x => bxMapRuns(x, r => { r.f = f; }));
    return;
  }
  if (k === 'sz+' || k === 'sz-' || k === 'size'){
    const ppt = bxPxPerPt();
    let pt;
    if (k === 'size'){ pt = parseFloat(String(el.value).replace(',', '.')); if (!(pt > 0)) { bxBarState(); return; } }
    if (ed){
      const cur = parseFloat(bxBarEl.querySelector('[data-bx="size"]').value.replace(',', '.')) || 18;
      if (k !== 'size') pt = bxNextSize(cur, k === 'sz+' ? 1 : -1);
      bxEd.root.focus();
      bxEdSize(+(pt * ppt).toFixed(2));
      return;
    }
    bxMutate(o, x => bxMapParas(x, p => {
      p.runs = (p.runs || []).map(r => { const cur = (r.sz || 24) / ppt; r.sz = +((k === 'size' ? pt : bxNextSize(cur, k === 'sz+' ? 1 : -1)) * ppt).toFixed(2); return r; });
      if (p.esz){ const cur = p.esz / ppt; p.esz = +((k === 'size' ? pt : bxNextSize(cur, k === 'sz+' ? 1 : -1)) * ppt).toFixed(2); }
      return p;
    }));
    return;
  }
  if (k.indexOf('al-') === 0){
    const a = k.slice(3);
    if (ed){ bxSelParas().forEach(d => { d.style.textAlign = BX_AL[a]; }); bxEditorSync(); bxBarState(); return; }
    bxMutate(o, x => bxMapParas(x, p => { if (a === 'l') delete p.al; else p.al = a; return p; }));
    return;
  }
  if (k.indexOf('an-') === 0){
    const a = k.slice(3);
    if (ed){ bxEd.anchor = a; bxEd.wrap.dataset.anchor = a; bxEd.root.dispatchEvent(new Event('input')); bxEd.startHtml = '\u0000'; bxBarState(); return; }
    bxMutate(o, x => bxSetAnchorAll(x, a));
    return;
  }
  if (k === 'bul' || k === 'num'){
    if (ed){ bxToggleList(k); return; }
    if (o.type === 'box') bxMutate(o, x => bxListAll(x, k));
    return;
  }
  if (k === 'ind' || k === 'out'){
    const dir = k === 'ind' ? 1 : -1;
    if (ed){ bxEdIndent(dir); return; }
    bxMutate(o, x => bxMapParas(x, p => { p.lvl = Math.max(0, Math.min(8, (p.lvl || 0) + dir)); p.ind = Math.max(0, (p.ind || 0) + dir * 45); return p; }));
    return;
  }
  if (k === 'color' || k === 'hl' || k === 'fill' || k === 'line'){ bxOpenPal(k, el); return; }
  if (k === 'lw'){
    const px = +(parseFloat(el.value) * bxPxPerPt()).toFixed(2);
    bxMutate(o, x => { x.line = Object.assign({ c: '#000000' }, x.line || {}, { w: px }); });
    return;
  }
  if (o.type === 'table' && bxEd && (k === 'row+' || k === 'col+' || k === 'row-' || k === 'col-')){ bxTableEdit(k); return; }
}
function bxOpenPal(kind, anchorEl){
  if (!bxPalEl){
    bxPalEl = document.createElement('div');
    bxPalEl.className = 'bx-pal';
    bxPalEl.hidden = true;
    bxHost().appendChild(bxPalEl);
    bxPalEl.addEventListener('pointerdown', (e) => { if (!e.target.closest('input')) e.preventDefault(); });
  }
  const none = kind === 'color' ? '' : `<button data-c="" title="Нет">нет</button>`;
  bxPalEl.innerHTML = BX_PALETTE.map(c => `<button data-c="${c}" style="background:${c}" title="${c}"></button>`).join('') +
    `<div class="bx-pal-row">${none}<label>свой <input type="color" data-own></label></div>`;
  bxPalEl.hidden = false;
  const r = anchorEl.getBoundingClientRect();
  bxPalEl.style.left = Math.min(window.innerWidth - 240, r.left) + 'px';
  bxPalEl.style.top = (r.bottom + 6) + 'px';
  const apply = (c) => { bxHidePal(); bxApplyColor(kind, c); };
  bxPalEl.onclick = (e) => { const b = e.target.closest('button[data-c]'); if (b) apply(b.dataset.c || null); };
  bxPalEl.querySelector('[data-own]').onchange = (e) => apply(e.target.value.toUpperCase());
}
function bxHidePal(){ if (bxPalEl) bxPalEl.hidden = true; }
function bxApplyColor(kind, c){
  const o = bxFindObj(bxBarFor);
  if (!o) return;
  if (kind === 'fill'){ bxMutate(o, x => { x.fill = c ? { c } : null; }); return; }
  if (kind === 'line'){ bxMutate(o, x => { x.line = c ? Object.assign({ w: 1.5 * bxPxPerPt() }, x.line || {}, { c }) : null; }); return; }
  if (bxEd){
    bxEd.root.focus();
    if (kind === 'color') bxExec('foreColor', c || '#000000');
    else bxExec('hiliteColor', c || 'transparent');
    return;
  }
  bxMutate(o, x => bxMapRuns(x, r => { if (kind === 'color') r.c = c || '#000000'; else if (c) r.hl = c; else delete r.hl; }));
}
// строки и столбцы таблицы — сохраняем набранное, правим сетку, открываем ту же ячейку
function bxTableEdit(k){
  const id = bxEd.id, cell = bxEd.cell.slice();
  bxCloseEditor(true);
  const o = bxFindObj(id);
  if (!o) return;
  const R = o.cells.length, C = (o.cells[0] || []).length;
  if ((k === 'row-' && R < 2) || (k === 'col-' && C < 2)) return;
  if (typeof pushUndo === 'function') pushUndo();
  // объединения при вставке и удалении снимаем — проще и предсказуемее
  const plain = o.cells.map(row => row.map(cl => { const c = Object.assign({}, cl); delete c.gs; delete c.rs; delete c.hm; delete c.vm; return c; }));
  const empty = (like) => ({ text: bxTextOf('', { sz: ((like && like.text && bxDefRun(like.text).sz) || 24) }), fill: like && like.fill ? Object.assign({}, like.fill) : undefined, bd: like && like.bd ? bxClone(like.bd) : undefined });
  if (k === 'row+'){ plain.splice(cell[0] + 1, 0, plain[cell[0]].map(cl => empty(cl))); o.rows = o.rows.slice(); o.rows.splice(cell[0] + 1, 0, o.rows[cell[0]]); }
  if (k === 'row-'){ plain.splice(cell[0], 1); o.rows = o.rows.filter((_, i) => i !== cell[0]); cell[0] = Math.min(cell[0], plain.length - 1); }
  if (k === 'col+'){ plain.forEach(row => row.splice(cell[1] + 1, 0, empty(row[cell[1]]))); const w = o.cols[cell[1]]; o.cols = o.cols.slice(); o.cols.splice(cell[1] + 1, 0, w); }
  if (k === 'col-'){ plain.forEach(row => row.splice(cell[1], 1)); o.cols = o.cols.filter((_, i) => i !== cell[1]); cell[1] = Math.min(cell[1], o.cols.length - 1); }
  o.cells = plain;
  o.w = o.cols.reduce((a, b) => a + b, 0); o.h = o.rows.reduce((a, b) => a + b, 0);
  if (typeof saveDB === 'function') saveDB();
  if (typeof scheduleRedraw === 'function') scheduleRedraw();
  const L = bxTableLayout(o), Rr = bxCellRect(L, cell[0], cell[1], o.cells[cell[0]][cell[1]]);
  const c0 = bxCenter(o), lc = { x: Rr.x + Rr.w / 2 - L.size.w / 2, y: Rr.y + Rr.h / 2 - L.size.h / 2 };
  bxOpenEditor(o, bxRotPt({ x: c0.x + lc.x, y: c0.y + lc.y }, c0, o.rot || 0));
}
// панель следует за выделением: доска зовёт render → bxEditorSync; здесь —
// показать или спрятать, когда выделение сменилось
let bxLastSel = null;
function bxSelectionTick(){
  const o = bxBarTarget();
  const id = o ? o.id : null;
  if (id !== bxLastSel || (!!bxBarEl && !bxBarEl.hidden) !== !!id){ bxLastSel = id; bxShowBar(); }
}

/* ── 10. Вставка новых объектов ──────────────────────────────────────── */
function bxDefaultBoxText(sz){ return bxTextOf('', { sz: sz || 18 * bxPxPerPt(), c: '#1D1D1F', f: BX_DEF_FONT }); }
// at — середина нового объекта в мире
function bxInsert(kind, at){
  if (typeof B === 'undefined' || !B || (typeof mayDraw === 'function' && !mayDraw())) return null;
  const ppt = bxPxPerPt();
  let o;
  if (kind === 'text'){
    o = { id: uid(), type: 'box', geom: 'rect', w: 420, h: 0, fill: null, line: null, text: Object.assign(bxTextOf('Текст', { sz: 24 * ppt, c: '#1D1D1F', f: BX_DEF_FONT }), { fit: 'grow' }) };
    const fr = bxTextFrameRaw(o.text, o.w, 1e6); o.h = Math.max(30, fr.lay.h + 10);
  } else if (kind === 'table'){
    const cols = [200, 200, 200], rows = [56, 56, 56];
    const cell = (hdr) => ({ text: Object.assign(bxTextOf('', { sz: 16 * ppt, c: hdr ? '#FFFFFF' : '#1D1D1F', f: BX_DEF_FONT, b: hdr || undefined }), { anchor: 'm' }),
      fill: { c: hdr ? '#4472C4' : '#FFFFFF' }, bd: { l: { c: '#8EA9DB', w: 1.2 }, t: { c: '#8EA9DB', w: 1.2 }, r: { c: '#8EA9DB', w: 1.2 }, b: { c: '#8EA9DB', w: 1.2 } } });
    o = { id: uid(), type: 'table', cols, rows, w: 600, h: 168, cells: rows.map((_, r) => cols.map(() => cell(r === 0))) };
  } else {
    const geom = kind || 'rect';
    const sq = /ellipse|star|mathPlus|mathMultiply|plus|heart|smiley/.test(geom);
    o = { id: uid(), type: 'box', geom, w: sq ? 240 : 320, h: sq ? 240 : 200, fill: { c: '#4472C4' }, line: { c: '#2F5597', w: 1.5 * ppt },
      text: Object.assign(bxTextOf('', { sz: 18 * ppt, c: '#FFFFFF', f: BX_DEF_FONT }), { anchor: 'm', paras: [{ runs: [], esz: 18 * ppt, al: 'c' }] }) };
    if (/line|Connector/.test(geom)){ o.fill = null; delete o.text; o.h = 0.01; }
  }
  const c = at || { x: cam.x + cssW / 2 / cam.zoom, y: cam.y + cssH / 2 / cam.zoom };
  o.points = [{ x: c.x - o.w / 2, y: c.y - o.h / 2 }];
  // как после вставки картинки — сразу «рука»: новый объект можно двигать,
  // тянуть и поворачивать, а не рисовать поверх него пером
  if (typeof switchToHandTool === 'function') switchToHandTool();
  if (typeof pushUndo === 'function') pushUndo();
  B.objects.push(o);
  if (typeof saveDB === 'function') saveDB();
  selectedId = o.id;
  if (typeof multiSelectIds !== 'undefined') multiSelectIds = [];
  if (typeof scheduleRedraw === 'function') scheduleRedraw();
  if (kind === 'text' || kind === 'table') setTimeout(() => bxOpenEditor(o, kind === 'table' ? bxRotPt({ x: o.points[0].x + 5, y: o.points[0].y + 5 }, bxCenter(o), 0) : null), 0);
  return o;
}
