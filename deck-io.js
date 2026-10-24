/* ═══════════════════════════════════════════════════════════════════════
   deck-io.js — импорт PPTX и PDF в презентацию и выгрузка в PDF и PPTX
   (промпты №98–100, HANDOFF.md раздел 6г).

   Подгружается по нажатию «Файл» (deckIoEnsure в deck-core.js): ни доски,
   ни сама презентация без него ничего не теряют. Библиотеки — свои копии
   в репозитории, через MathhLibs (lazy-libs.js): JSZip — читать PPTX,
   pdf.js — PDF, pptxgenjs — писать PPTX, jsPDF — писать PDF. Ни одного
   обращения к чужим серверам: работает и без VPN.

   PPTX читаем сами, по стандарту Office Open XML (ECMA-376): слайд, его
   макет и образец дают фон и оформление, тема — цвета и шрифты. Текст,
   фигуры, картинки (с обрезкой и поворотом), таблицы, группы становятся
   объектами доски (board-boxes.js) — всё двигается и правится. Что доска
   не умеет (диаграммы), ставится заглушкой на своё место.
   ═══════════════════════════════════════════════════════════════════════ */

/* ── единицы ─────────────────────────────────────────────────────────────
   В PPTX всё в EMU: 360 000 на сантиметр. На слайде 1 клетка = 0,5 см, то
   есть 2 клетки на сантиметр. Размеры шрифта — в сотых пункта. Слайд PPTX
   переносится в своём настоящем размере (16:9 — 33,9 × 19,1 см): тогда
   18 пт в PowerPoint — это 18 пт и здесь, и при выгрузке обратно */
const IO_EMU_CM = 360000;
function ioPxPerEmu(){ return 2 * (B.cellSize || 24) / IO_EMU_CM; }
function ioPtPx(){ return typeof bxPxPerPt === 'function' ? bxPxPerPt() : 2 * (B.cellSize || 24) * 2.54 / 72; }

/* ── XML ─────────────────────────────────────────────────────────────── */
const ioKids = (el, name) => el ? [...el.children].filter(c => c.localName === name) : [];
const ioKid = (el, name) => el ? [...el.children].find(c => c.localName === name) || null : null;
const ioPath = (el, ...names) => names.reduce((e, n) => ioKid(e, n), el);
const ioAttr = (el, n) => el ? el.getAttribute(n) : null;
const ioNum = (el, n, def) => { const v = el && el.getAttribute(n); return v == null || v === '' ? def : +v; };
const ioBool = (el, n) => { const v = el && el.getAttribute(n); return v === '1' || v === 'true' || v === 'on'; };
function ioXml(text){
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  return doc.getElementsByTagName('parsererror').length ? null : doc;
}
function ioDir(path){ return path.slice(0, path.lastIndexOf('/') + 1); }
function ioJoin(base, target){
  if (!target) return null;
  if (target.startsWith('/')) return target.slice(1);
  const parts = (base + target).split('/'), out = [];
  parts.forEach(p => { if (p === '..') out.pop(); else if (p !== '.' && p !== '') out.push(p); });
  return out.join('/');
}
async function ioText(pkg, path){
  const f = path && pkg.zip.file(path);
  return f ? f.async('string') : null;
}
async function ioDoc(pkg, path){
  if (!path) return null;
  if (pkg.docs.has(path)) return pkg.docs.get(path);
  const t = await ioText(pkg, path);
  const d = t ? ioXml(t) : null;
  pkg.docs.set(path, d);
  return d;
}
// связи части: id → { target, type }
async function ioRels(pkg, path){
  const relPath = ioDir(path) + '_rels/' + path.slice(path.lastIndexOf('/') + 1) + '.rels';
  const doc = await ioDoc(pkg, relPath);
  const map = {};
  if (doc) [...doc.documentElement.children].forEach(r => {
    const mode = r.getAttribute('TargetMode');
    map[r.getAttribute('Id')] = { type: (r.getAttribute('Type') || '').split('/').pop(), target: mode === 'External' ? null : ioJoin(ioDir(path), r.getAttribute('Target')) };
  });
  return map;
}
function ioRelOfType(rels, type){ const k = Object.keys(rels).find(id => rels[id].type === type); return k ? rels[k].target : null; }

/* ── цвета ───────────────────────────────────────────────────────────── */
const IO_PRST = { black: '000000', white: 'FFFFFF', red: 'FF0000', green: '008000', blue: '0000FF', yellow: 'FFFF00', gray: '808080', grey: '808080',
  darkGray: 'A9A9A9', lightGray: 'D3D3D3', orange: 'FFA500', purple: '800080', navy: '000080', maroon: '800000', silver: 'C0C0C0', teal: '008080', lime: '00FF00', cyan: '00FFFF', magenta: 'FF00FF', darkBlue: '00008B', darkRed: '8B0000', darkGreen: '006400' };
const IO_COLOR_TAGS = ['srgbClr', 'schemeClr', 'sysClr', 'prstClr', 'scrgbClr', 'hslClr'];
function ioRgbToHsl(r, g, b){
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h = 0, s = 0; const l = (mx + mn) / 2;
  if (mx !== mn){ const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h /= 6; }
  return [h, s, l];
}
function ioHslToRgb(h, s, l){
  if (!s) return [l * 255, l * 255, l * 255];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  const f = (t) => { if (t < 0) t += 1; if (t > 1) t -= 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
  return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255];
}
const ioToLin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
const ioFromLin = (v) => { v = Math.max(0, Math.min(1, v)); return 255 * (v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055); };
const ioHex2 = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0').toUpperCase();
// элемент цвета (srgbClr и т. п.) → { c:'#RRGGBB', a } с учётом модификаторов
function ioColorEl(cl, ctx){
  if (!cl) return null;
  let hex = null, a = 1;
  const v = cl.getAttribute('val');
  switch (cl.localName){
    case 'srgbClr': hex = v; break;
    case 'schemeClr': {
      if (v === 'phClr'){ if (ctx.phClr){ hex = ctx.phClr.c.slice(1); a = ctx.phClr.a; } break; }
      const m = (ctx.clrMap && ctx.clrMap[v]) || v;
      hex = ctx.theme.colors[m] || ctx.theme.colors[v] || null;
      break;
    }
    case 'sysClr': hex = cl.getAttribute('lastClr') || (v === 'window' ? 'FFFFFF' : '000000'); break;
    case 'prstClr': hex = IO_PRST[v] || '000000'; break;
    case 'scrgbClr': hex = ['r', 'g', 'b'].map(k => ioHex2(ioNum(cl, k, 0) / 100000 * 255)).join(''); break;
    case 'hslClr': { const rgb = ioHslToRgb(ioNum(cl, 'hue', 0) / 21600000, ioNum(cl, 'sat', 0) / 100000, ioNum(cl, 'lum', 0) / 100000); hex = rgb.map(ioHex2).join(''); break; }
    default: return null;
  }
  if (!hex) return null;
  let n = parseInt(hex, 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  [...cl.children].forEach(m => {
    const val = ioNum(m, 'val', 100000) / 100000;
    switch (m.localName){
      case 'alpha': a = val; break;
      // tint и shade PowerPoint считает в линейном RGB, а не в sRGB: иначе
      // «тёмный текст, оттенок 75 %» выходит заметно темнее, чем в файле
      case 'tint': [r, g, b] = [r, g, b].map(v => ioFromLin(ioToLin(v) * val + (1 - val))); break;
      case 'shade': [r, g, b] = [r, g, b].map(v => ioFromLin(ioToLin(v) * val)); break;
      case 'lumMod': case 'lumOff': case 'satMod': case 'hueOff': {
        const hsl = ioRgbToHsl(r, g, b);
        if (m.localName === 'lumMod') hsl[2] *= val;
        if (m.localName === 'lumOff') hsl[2] += val;
        if (m.localName === 'satMod') hsl[1] *= val;
        if (m.localName === 'hueOff') hsl[0] = (hsl[0] + ioNum(m, 'val', 0) / 21600000 + 1) % 1;
        hsl[1] = Math.max(0, Math.min(1, hsl[1])); hsl[2] = Math.max(0, Math.min(1, hsl[2]));
        [r, g, b] = ioHslToRgb(hsl[0], hsl[1], hsl[2]);
        break;
      }
      case 'inv': r = 255 - r; g = 255 - g; b = 255 - b; break;
      case 'gray': { const y = 0.3 * r + 0.59 * g + 0.11 * b; r = g = b = y; break; }
    }
  });
  return { c: '#' + ioHex2(r) + ioHex2(g) + ioHex2(b), a: +a.toFixed(3) };
}
// первый цветовой ребёнок элемента (solidFill, buClr, fillRef…)
function ioColorIn(el, ctx){ if (!el) return null; const cl = [...el.children].find(c => IO_COLOR_TAGS.includes(c.localName)); return ioColorEl(cl, ctx); }

/* ── тема ────────────────────────────────────────────────────────────── */
async function ioTheme(pkg, path){
  const key = 'theme:' + path;
  if (pkg.cache[key]) return pkg.cache[key];
  const doc = await ioDoc(pkg, path);
  const th = { colors: {}, major: 'Calibri Light', minor: 'Calibri', fills: [], lines: [], bgFills: [] };
  if (doc){
    const te = ioPath(doc.documentElement, 'themeElements');
    const cs = ioKid(te, 'clrScheme');
    if (cs) [...cs.children].forEach(c => {
      const cl = c.firstElementChild;
      if (!cl) return;
      th.colors[c.localName] = cl.localName === 'srgbClr' ? cl.getAttribute('val') : (cl.getAttribute('lastClr') || (cl.getAttribute('val') === 'window' ? 'FFFFFF' : '000000'));
    });
    const fs = ioKid(te, 'fontScheme');
    const lat = (k) => ioAttr(ioPath(fs, k, 'latin'), 'typeface');
    th.major = lat('majorFont') || th.major;
    th.minor = lat('minorFont') || th.minor;
    const fm = ioKid(te, 'fmtScheme');
    th.fills = [...(ioKid(fm, 'fillStyleLst') || { children: [] }).children];
    th.lines = [...(ioKid(fm, 'lnStyleLst') || { children: [] }).children];
    th.bgFills = [...(ioKid(fm, 'bgFillStyleLst') || { children: [] }).children];
  }
  pkg.cache[key] = th;
  return th;
}
function ioFontName(tf, ctx){
  if (!tf) return null;
  if (tf === '+mj-lt' || tf === '+mj-ea' || tf === '+mj-cs') return ctx.theme.major;
  if (tf === '+mn-lt' || tf === '+mn-ea' || tf === '+mn-cs') return ctx.theme.minor;
  return tf;
}

/* ── заливка и линия ─────────────────────────────────────────────────────
   undefined — в этом месте не задано (наследуем дальше), null — явно «нет» */
function ioFillEl(el, ctx){
  if (!el) return undefined;
  switch (el.localName){
    case 'noFill': return null;
    case 'solidFill': return ioColorIn(el, ctx);
    case 'gradFill': {
      const gs = ioKids(ioKid(el, 'gsLst'), 'gs').map(g => { const c = ioColorIn(g, ctx); return c ? { p: ioNum(g, 'pos', 0) / 100000, c: c.c, a: c.a } : null; }).filter(Boolean);
      if (!gs.length) return null;
      const lin = ioKid(el, 'lin');
      return { g: gs.sort((x, y) => x.p - y.p), ang: lin ? ioNum(lin, 'ang', 0) / 60000 : 90 };
    }
    case 'pattFill': return ioColorIn(ioKid(el, 'fgClr'), ctx) || null;
    case 'blipFill': return { blip: el };
    case 'grpFill': return ctx.grpFill !== undefined ? ctx.grpFill : undefined;
    default: return undefined;
  }
}
const IO_FILL_TAGS = ['noFill', 'solidFill', 'gradFill', 'pattFill', 'blipFill', 'grpFill'];
function ioFillOf(spPr, ctx){
  const el = spPr ? [...spPr.children].find(c => IO_FILL_TAGS.includes(c.localName)) : null;
  return ioFillEl(el, ctx);
}
// fillRef/lnRef/fontRef стиля фигуры: номер в списке темы + цвет «phClr»
function ioStyleRef(styleEl, name, ctx){
  const r = ioKid(styleEl, name);
  if (!r) return null;
  return { idx: r.getAttribute('idx'), color: ioColorIn(r, ctx) };
}
function ioFillFromStyle(styleEl, ctx){
  const ref = ioStyleRef(styleEl, 'fillRef', ctx);
  if (!ref) return undefined;
  const idx = +ref.idx;
  if (!idx) return null;
  const list = idx >= 1000 ? ctx.theme.bgFills : ctx.theme.fills;
  const el = list[(idx >= 1000 ? idx - 1000 : idx) - 1];
  const f = ioFillEl(el, Object.assign({}, ctx, { phClr: ref.color }));
  return f === undefined ? (ref.color || null) : f;
}
function ioLineEl(ln, ctx, base){
  // base — линия из стиля темы (lnRef), её поля — по умолчанию
  if (!ln && !base) return undefined;
  let out = base ? Object.assign({}, base) : {};
  if (ln){
    const f = [...ln.children].find(c => IO_FILL_TAGS.includes(c.localName));
    if (f){
      if (f.localName === 'noFill') return null;
      const col = f.localName === 'solidFill' ? ioColorIn(f, ctx) : f.localName === 'gradFill' ? ioColorIn(ioPath(f, 'gsLst', 'gs'), ctx) : null;
      if (col){ out.c = col.c; out.a = col.a; }
    }
    if (ln.getAttribute('w')) out.w = ioNum(ln, 'w', 9525) * ioPxPerEmu();
    const dash = ioAttr(ioKid(ln, 'prstDash'), 'val');
    if (dash && dash !== 'solid') out.dash = dash;
    const cap = ln.getAttribute('cap');
    if (cap === 'rnd') out.cap = 'round'; else if (cap === 'sq') out.cap = 'square';
    const he = ioKid(ln, 'headEnd'), te = ioKid(ln, 'tailEnd');
    const sz = (e) => { const w = e.getAttribute('w') || 'med', l = e.getAttribute('len') || 'med'; return (w === 'lg' || l === 'lg') ? 'lg' : (w === 'sm' && l === 'sm') ? 'sm' : 'med'; };
    if (he && he.getAttribute('type') && he.getAttribute('type') !== 'none'){ out.he = he.getAttribute('type'); out.hs = sz(he); }
    if (te && te.getAttribute('type') && te.getAttribute('type') !== 'none'){ out.te = te.getAttribute('type'); out.ts = sz(te); }
  }
  if (!out.c) return out.w || out.he || out.te ? Object.assign({ c: '#000000' }, out) : (base ? out : undefined);
  if (!out.w) out.w = 9525 * ioPxPerEmu();
  return out;
}
function ioLineFromStyle(styleEl, ctx){
  const ref = ioStyleRef(styleEl, 'lnRef', ctx);
  if (!ref) return undefined;
  const idx = +ref.idx;
  if (!idx) return null;
  const el = ctx.theme.lines[idx - 1];
  const l = ioLineEl(el, Object.assign({}, ctx, { phClr: ref.color }), null);
  if (l === undefined || l === null) return ref.color ? { c: ref.color.c, a: ref.color.a, w: 9525 * ioPxPerEmu() } : null;
  return l;
}

/* ── текст: свойства абзаца и куска, наследование ────────────────────────
   Цепочка (от слабого к сильному): стиль образца (заголовок, текст,
   прочее) → список стилей заполнителя образца → макета → самой фигуры →
   свойства абзаца → свойства куска. Каждое звено — объект только с теми
   полями, что в нём заданы; сливаем по порядку */
function ioSpc(el){
  if (!el) return undefined;
  const pct = ioKid(el, 'spcPct'), pts = ioKid(el, 'spcPts');
  if (pct) return { pct: ioNum(pct, 'val', 100000) / 100000 };
  if (pts) return { pts: ioNum(pts, 'val', 0) / 100 };
  return undefined;
}
function ioRPr(el, ctx){
  const o = {};
  if (!el) return o;
  const sz = el.getAttribute('sz'); if (sz) o.sz = +sz / 100;
  const b = el.getAttribute('b'); if (b != null) o.b = b === '1' || b === 'true';
  const i = el.getAttribute('i'); if (i != null) o.i = i === '1' || i === 'true';
  const u = el.getAttribute('u'); if (u != null) o.u = u !== 'none';
  const st = el.getAttribute('strike'); if (st != null) o.s = st !== 'noStrike';
  const bl = el.getAttribute('baseline'); if (bl != null) o.bl = +bl > 0 ? 'sup' : +bl < 0 ? 'sub' : null;
  const cap = el.getAttribute('cap'); if (cap != null) o.cap = cap === 'all' ? 'all' : null;
  const fill = [...el.children].find(c => c.localName === 'solidFill' || c.localName === 'gradFill');
  if (fill){
    const col = fill.localName === 'solidFill' ? ioColorIn(fill, ctx) : ioColorIn(ioPath(fill, 'gsLst', 'gs'), ctx);
    if (col) o.c = col.c;
  }
  const hl = ioKid(el, 'highlight'); if (hl){ const col = ioColorIn(hl, ctx); if (col) o.hl = col.c; }
  const lat = ioKid(el, 'latin'); if (lat && lat.getAttribute('typeface')) o.f = ioFontName(lat.getAttribute('typeface'), ctx);
  return o;
}
function ioPPr(el, ctx){
  const o = {};
  if (!el) return o;
  const al = el.getAttribute('algn'); if (al) o.al = al;
  const ml = el.getAttribute('marL'); if (ml != null) o.marL = +ml;
  const ind = el.getAttribute('indent'); if (ind != null) o.indent = +ind;
  const sb = ioSpc(ioKid(el, 'spcBef')); if (sb) o.sb = sb;
  const sa = ioSpc(ioKid(el, 'spcAft')); if (sa) o.sa = sa;
  const ls = ioSpc(ioKid(el, 'lnSpc')); if (ls) o.ls = ls;
  [...el.children].forEach(c => {
    switch (c.localName){
      case 'buNone': o.buType = 'none'; break;
      case 'buChar': o.buType = 'char'; o.buChar = c.getAttribute('char') || '•'; break;
      case 'buAutoNum': o.buType = 'num'; o.buNum = c.getAttribute('type') || 'arabicPeriod'; o.buStart = ioNum(c, 'startAt', 1); break;
      case 'buBlip': o.buType = 'char'; o.buChar = '•'; break;
      case 'buClr': o.buC = (ioColorIn(c, ctx) || {}).c || null; break;
      case 'buClrTx': o.buC = null; break;
      case 'buSzPct': o.buSz = ioNum(c, 'val', 100000) / 100000; break;
      case 'buSzPts': o.buSzPts = ioNum(c, 'val', 0) / 100; break;
      case 'buSzTx': o.buSz = null; o.buSzPts = null; break;
      case 'buFont': o.buF = c.getAttribute('typeface'); break;
      case 'buFontTx': o.buF = null; break;
      case 'defRPr': o.r = ioRPr(c, ctx); break;
    }
  });
  return o;
}
function ioMergeP(base, over){
  const out = Object.assign({}, base, over);
  out.r = Object.assign({}, base && base.r, over && over.r);
  return out;
}
// список стилей (lstStyle / txStyles) → 9 уровней
function ioLvlStyles(el, ctx){
  const out = [];
  if (!el) return out;
  const def = ioPPr(ioKid(el, 'defPPr'), ctx);
  for (let i = 0; i < 9; i++){
    const lp = ioKid(el, 'lvl' + (i + 1) + 'pPr');
    out[i] = ioMergeP(def, ioPPr(lp, ctx));
  }
  return out;
}
function ioMergeLvls(list){
  const out = [];
  for (let i = 0; i < 9; i++){
    let p = { r: {} };
    list.forEach(L => { if (L && L[i]) p = ioMergeP(p, L[i]); });
    out[i] = p;
  }
  return out;
}
// bodyPr по цепочке: последний, где поле задано
function ioBodyPr(list){
  const o = { l: 91440, t: 45720, r: 91440, b: 45720, anchor: 't', wrap: true, fit: null };
  list.forEach(bp => {
    if (!bp) return;
    ['lIns', 'tIns', 'rIns', 'bIns'].forEach((k, i) => { const v = bp.getAttribute(k); if (v != null) o['ltrb'[i]] = +v; });
    const an = bp.getAttribute('anchor'); if (an) o.anchor = an === 'ctr' ? 'm' : an === 'b' ? 'b' : 't';
    const wr = bp.getAttribute('wrap'); if (wr) o.wrap = wr !== 'none';
    const vert = bp.getAttribute('vert'); if (vert) o.vert = vert;
    if (ioKid(bp, 'normAutofit')) o.fit = 'shrink';
    else if (ioKid(bp, 'spAutoFit')) o.fit = 'grow';
    else if (ioKid(bp, 'noAutofit')) o.fit = null;
  });
  return o;
}
const IO_AL = { l: 'l', ctr: 'c', r: 'r', just: 'j', dist: 'd', justLow: 'j', thaiDist: 'd' };
// txBody → текст доски (board-boxes.js)
// lvls — стили образца/макета, own — список стилей самой фигуры: шрифт и
// цвет стиля фигуры (fontRef) сильнее первых, но слабее вторых
function ioTextBody(txBody, lvls, bodyPrs, ctx, fontRef, own){
  const ptPx = ioPtPx(), emu = ioPxPerEmu();
  const bp = ioBodyPr(bodyPrs);
  const paras = [];
  let any = false;
  ioKids(txBody, 'p').forEach(pEl => {
    const pPrEl = ioKid(pEl, 'pPr');
    const lvl = Math.max(0, Math.min(8, ioNum(pPrEl, 'lvl', 0)));
    const ownP = (own && own[lvl]) || { r: {} }, pp = ioPPr(pPrEl, ctx);
    const P = ioMergeP(ioMergeP(lvls[lvl] || { r: {} }, ownP), pp);
    const baseR = Object.assign({}, (lvls[lvl] || {}).r, fontRef || {}, ownP.r, pp.r);
    const runs = [];
    const addRun = (rPrEl, t) => {
      const R = Object.assign({}, baseR, ioRPr(rPrEl, ctx));
      const szPt = R.sz || 18;
      if (R.cap === 'all') t = t.toUpperCase();
      const r = { t, sz: +(szPt * ptPx).toFixed(2), c: R.c || '#000000', f: R.f || ctx.theme.minor };
      if (R.b) r.b = true;
      if (R.i) r.i = true;
      if (R.u) r.u = true;
      if (R.s) r.s = true;
      if (R.hl) r.hl = R.hl;
      if (R.bl) r.bl = R.bl;
      const last = runs[runs.length - 1];
      if (last && ['sz', 'c', 'f', 'b', 'i', 'u', 's', 'hl', 'bl'].every(k => (last[k] || null) === (r[k] || null))) last.t += t;
      else runs.push(r);
      if (t.trim()) any = true;
    };
    [...pEl.children].forEach(ch => {
      if (ch.localName === 'r' || ch.localName === 'fld'){
        const t = [...ch.children].filter(x => x.localName === 't').map(x => x.textContent).join('');
        if (t) addRun(ioKid(ch, 'rPr'), t);
      } else if (ch.localName === 'br') addRun(ioKid(ch, 'rPr'), '\n');
    });
    const endR = Object.assign({}, baseR, ioRPr(ioKid(pEl, 'endParaRPr'), ctx));
    const firstSz = runs.length ? runs[0].sz : (endR.sz || 18) * ptPx;
    const p = { runs };
    if (!runs.length) p.esz = +((endR.sz || 18) * ptPx).toFixed(2);
    const al = IO_AL[P.al]; if (al && al !== 'l') p.al = al;
    if (P.marL) p.ind = +(P.marL * emu).toFixed(2);
    if (P.indent) p.fi = +(P.indent * emu).toFixed(2);
    const spc = (s) => s ? (s.pts != null ? s.pts * ptPx : s.pct * firstSz * 1.2) : 0;
    if (P.sb) p.sb = +spc(P.sb).toFixed(2);
    if (P.sa) p.sa = +spc(P.sa).toFixed(2);
    if (P.ls){ if (P.ls.pts != null) p.lsPx = +(P.ls.pts * ptPx).toFixed(2); else if (Math.abs(P.ls.pct - 1) > 0.001) p.ls = +P.ls.pct.toFixed(3); }
    if (lvl) p.lvl = lvl;
    if (runs.length && (P.buType === 'char' || P.buType === 'num')){
      const bu = P.buType === 'num' ? { num: P.buNum } : { ch: P.buChar };
      if (P.buType === 'num' && P.buStart && P.buStart !== 1) bu.start = P.buStart;
      if (P.buC) bu.c = P.buC;
      if (P.buSz) bu.sz = P.buSz;
      else if (P.buSzPts) bu.sz = P.buSzPts / ((runs[0].sz || 24) / ptPx);
      if (P.buF && !/^(Wingdings|Symbol)/i.test(P.buF)) bu.f = P.buF;
      // символы Wingdings/Symbol — их кодов в наших шрифтах нет: привычные маркеры
      if (P.buF && /^Wingdings/i.test(P.buF)) bu.ch = ({ '§': '■', 'Ø': '➢', 'ü': '✓', 'q': '❑', 'v': '❖', 'Ú': '▶' })[bu.ch] || '•';
      if (P.buF && /^Symbol/i.test(P.buF)) bu.ch = ({ '·': '•', '-': '–' })[bu.ch] || '•';
      p.bu = bu;
    }
    paras.push(p);
  });
  const def = Object.assign({}, (lvls[0] || {}).r, fontRef || {}, ((own && own[0]) || {}).r);
  const tx = {
    paras, anchor: bp.anchor,
    pad: [bp.l * emu, bp.t * emu, bp.r * emu, bp.b * emu].map(v => +v.toFixed(2)),
    def: { sz: +((def.sz || 18) * ptPx).toFixed(2), c: def.c || '#000000', f: def.f || ctx.theme.minor },
  };
  if (!bp.wrap) tx.wrap = false;
  if (bp.fit) tx.fit = bp.fit;
  return { tx, any };
}

/* ── положение: a:xfrm и группы ──────────────────────────────────────── */
function ioXfrm(x){
  if (!x) return null;
  const off = ioKid(x, 'off'), ext = ioKid(x, 'ext');
  if (!off || !ext) return null;
  return { x: ioNum(off, 'x', 0), y: ioNum(off, 'y', 0), w: ioNum(ext, 'cx', 0), h: ioNum(ext, 'cy', 0),
    rot: ioNum(x, 'rot', 0) / 60000, flipH: ioBool(x, 'flipH'), flipV: ioBool(x, 'flipV') };
}
function ioGroupXf(grpSpPr){
  const x = ioKid(grpSpPr, 'xfrm');
  const f = ioXfrm(x);
  if (!f) return null;
  const co = ioKid(x, 'chOff'), ce = ioKid(x, 'chExt');
  return Object.assign(f, { cx0: ioNum(co, 'x', f.x), cy0: ioNum(co, 'y', f.y), cw: ioNum(ce, 'cx', f.w) || f.w || 1, ch: ioNum(ce, 'cy', f.h) || f.h || 1 });
}
// рамка в координатах группы → в координатах слайда (с вложенными группами)
function ioApplyGroups(r, stack){
  r = Object.assign({}, r);
  for (let i = stack.length - 1; i >= 0; i--){
    const g = stack[i];
    const sx = g.w / g.cw, sy = g.h / g.ch;
    r.x = g.x + (r.x - g.cx0) * sx; r.y = g.y + (r.y - g.cy0) * sy; r.w *= sx; r.h *= sy;
    const gcx = g.x + g.w / 2, gcy = g.y + g.h / 2;
    let cx = r.x + r.w / 2, cy = r.y + r.h / 2;
    if (g.flipH){ cx = 2 * gcx - cx; r.flipH = !r.flipH; r.rot = -r.rot; }
    if (g.flipV){ cy = 2 * gcy - cy; r.flipV = !r.flipV; r.rot = -r.rot; }
    if (g.rot){
      const a = g.rot * Math.PI / 180, dx = cx - gcx, dy = cy - gcy;
      cx = gcx + dx * Math.cos(a) - dy * Math.sin(a); cy = gcy + dx * Math.sin(a) + dy * Math.cos(a);
      r.rot = (r.rot || 0) + g.rot;
    }
    r.x = cx - r.w / 2; r.y = cy - r.h / 2;
  }
  return r;
}
function ioPlace(o, r){
  const k = ioPxPerEmu();
  o.points = [{ x: +(r.x * k).toFixed(2), y: +(r.y * k).toFixed(2) }];
  o.w = Math.max(0.01, +(r.w * k).toFixed(2));
  o.h = Math.max(0.01, +(r.h * k).toFixed(2));
  let rot = ((r.rot || 0) % 360 + 540) % 360 - 180;
  if (Math.abs(rot) > 0.01) o.rot = +rot.toFixed(2);
  if (r.flipH) o.flipH = true;
  if (r.flipV) o.flipV = true;
  return o;
}

/* ── геометрия ───────────────────────────────────────────────────────── */
function ioGeom(spPr, o, extEmu){
  const pg = ioKid(spPr, 'prstGeom');
  if (pg){
    o.geom = pg.getAttribute('prst') || 'rect';
    const adj = {};
    ioKids(ioKid(pg, 'avLst'), 'gd').forEach(gd => { const m = /^val\s+(-?\d+)/.exec(gd.getAttribute('fmla') || ''); if (m) adj[gd.getAttribute('name')] = +m[1]; });
    if (Object.keys(adj).length) o.adj = adj;
    return true;
  }
  const cg = ioKid(spPr, 'custGeom');
  if (cg){
    const paths = [];
    ioKids(ioKid(cg, 'pathLst'), 'path').forEach(pe => {
      const pw = ioNum(pe, 'w', 0) || extEmu.w || 1, ph = ioNum(pe, 'h', 0) || extEmu.h || 1;
      const cmds = [];
      let cur = [0, 0];
      const pt = (e) => [ioNum(e, 'x', 0), ioNum(e, 'y', 0)];
      [...pe.children].forEach(c => {
        const pts = ioKids(c, 'pt').map(pt);
        if (c.localName === 'moveTo' && pts[0]){ cmds.push(['M', pts[0][0], pts[0][1]]); cur = pts[0]; }
        else if (c.localName === 'lnTo' && pts[0]){ cmds.push(['L', pts[0][0], pts[0][1]]); cur = pts[0]; }
        else if (c.localName === 'cubicBezTo' && pts.length === 3){ cmds.push(['C', pts[0][0], pts[0][1], pts[1][0], pts[1][1], pts[2][0], pts[2][1]]); cur = pts[2]; }
        else if (c.localName === 'quadBezTo' && pts.length === 2){ cmds.push(['Q', pts[0][0], pts[0][1], pts[1][0], pts[1][1]]); cur = pts[1]; }
        else if (c.localName === 'arcTo'){
          // дуга эллипса от текущей точки: центр находим по начальному углу
          const wr = ioNum(c, 'wR', 0), hr = ioNum(c, 'hR', 0), st = ioNum(c, 'stAng', 0) / 60000, sw = ioNum(c, 'swAng', 0) / 60000;
          const a0 = st * Math.PI / 180;
          const cx = cur[0] - wr * Math.cos(a0), cy = cur[1] - hr * Math.sin(a0);
          const n = Math.max(2, Math.ceil(Math.abs(sw) / 10));
          for (let i = 1; i <= n; i++){ const a = (st + sw * i / n) * Math.PI / 180; cur = [cx + wr * Math.cos(a), cy + hr * Math.sin(a)]; cmds.push(['L', cur[0], cur[1]]); }
        } else if (c.localName === 'close') cmds.push(['Z']);
      });
      if (cmds.length) paths.push({ w: pw, h: ph, cmds, fill: pe.getAttribute('fill') !== 'none', stroke: pe.getAttribute('stroke') !== '0' && pe.getAttribute('stroke') !== 'false' });
    });
    if (paths.length){ o.geom = 'path'; o.path = paths; return true; }
  }
  return false;
}

/* ── заполнители: поиск на макете и образце ──────────────────────────── */
function ioPhOf(sp){
  const ph = ioPath(sp, 'nvSpPr', 'nvPr', 'ph') || ioPath(sp, 'nvPicPr', 'nvPr', 'ph') || ioPath(sp, 'nvGraphicFramePr', 'nvPr', 'ph');
  if (!ph) return null;
  return { type: ph.getAttribute('type') || 'obj', idx: ph.getAttribute('idx') };
}
function ioPhList(spTree){
  const out = [];
  const walk = (el) => [...el.children].forEach(c => {
    if (c.localName === 'sp' || c.localName === 'pic'){ const ph = ioPhOf(c); if (ph) out.push(Object.assign({ el: c }, ph)); }
    else if (c.localName === 'grpSp') walk(c);
  });
  if (spTree) walk(spTree);
  return out;
}
const IO_PH_MASTER = { ctrTitle: 'title', title: 'title', subTitle: 'body', body: 'body', obj: 'body', tbl: 'body', chart: 'body', pic: 'body', media: 'body', clipArt: 'body', dgm: 'body', dt: 'dt', ftr: 'ftr', sldNum: 'sldNum' };
function ioFindPh(list, ph, byType){
  if (!list || !ph) return null;
  if (!byType && ph.idx != null){ const m = list.find(x => x.idx === ph.idx); if (m) return m.el; }
  const t = byType ? (IO_PH_MASTER[ph.type] || 'body') : ph.type;
  const m = list.find(x => (byType ? (IO_PH_MASTER[x.type] || 'body') === t : x.type === t));
  return m ? m.el : null;
}
function ioTxStyleFor(ph, master){
  if (!ph) return master.styles.other;
  if (ph.type === 'title' || ph.type === 'ctrTitle') return master.styles.title;
  if (['body', 'subTitle', 'obj', 'tbl', 'chart', 'pic', 'dgm', 'media'].includes(ph.type)) return master.styles.body;
  return master.styles.other;
}

/* ── образец и макет: читаются один раз на файл ──────────────────────── */
async function ioMaster(pkg, path){
  const key = 'master:' + path;
  if (pkg.cache[key]) return pkg.cache[key];
  const doc = await ioDoc(pkg, path), rels = await ioRels(pkg, path);
  const root = doc && doc.documentElement;
  const theme = await ioTheme(pkg, ioRelOfType(rels, 'theme'));
  const clrMap = {};
  const cm = ioKid(root, 'clrMap');
  if (cm) [...cm.attributes].forEach(a => { clrMap[a.name] = a.value; });
  const ctx = { pkg, theme, clrMap };
  const tx = ioKid(root, 'txStyles');
  const m = {
    path, doc, rels, theme, clrMap,
    tree: ioPath(root, 'cSld', 'spTree'), bg: ioPath(root, 'cSld', 'bg'),
    styles: { title: ioLvlStyles(ioKid(tx, 'titleStyle'), ctx), body: ioLvlStyles(ioKid(tx, 'bodyStyle'), ctx), other: ioLvlStyles(ioKid(tx, 'otherStyle'), ctx) },
  };
  m.phs = ioPhList(m.tree);
  pkg.cache[key] = m;
  return m;
}
async function ioLayout(pkg, path){
  const key = 'layout:' + path;
  if (pkg.cache[key]) return pkg.cache[key];
  const doc = await ioDoc(pkg, path), rels = await ioRels(pkg, path);
  const root = doc && doc.documentElement;
  const master = await ioMaster(pkg, ioRelOfType(rels, 'slideMaster'));
  const L = { path, doc, rels, master, tree: ioPath(root, 'cSld', 'spTree'), bg: ioPath(root, 'cSld', 'bg'),
    showMaster: !root || root.getAttribute('showMasterSp') !== '0', clrOvr: ioPath(root, 'clrMapOvr', 'overrideClrMapping') };
  L.phs = ioPhList(L.tree);
  pkg.cache[key] = L;
  return L;
}
function ioClrMap(base, ovr){
  if (!ovr) return base;
  const m = Object.assign({}, base);
  [...ovr.attributes].forEach(a => { m[a.name] = a.value; });
  return m;
}

/* ── фигуры слайда → объекты доски ───────────────────────────────────────
   «Где» (src): 'slide' | 'layout' | 'master' — от этого зависят связи
   (картинки) и поиск заполнителей. Картинки на этом шаге не грузятся:
   объект получает pending, их читает ioLoadImages одним проходом */
function ioWalkTree(tree, S, stack, out){
  if (!tree) return;
  [...tree.children].forEach(el => {
    let node = el;
    if (el.localName === 'AlternateContent'){
      // формула Office (a14:m) и новые фигуры — в Choice, а в Fallback та же
      // вещь обычными средствами (часто картинкой формулы) — её и берём
      const fb = ioKid(el, 'Fallback') || ioKid(el, 'Choice');
      if (!fb) return;
      [...fb.children].forEach(c => ioWalkTree({ children: [c] }, S, stack, out));
      return;
    }
    const hidden = ioBool(ioPath(node, ioNvName(node), 'cNvPr'), 'hidden');
    if (hidden) return;
    try {
      if (node.localName === 'sp') ioSp(node, S, stack, out);
      else if (node.localName === 'cxnSp') ioSp(node, S, stack, out);
      else if (node.localName === 'pic') ioPic(node, S, stack, out);
      else if (node.localName === 'grpSp'){
        const g = ioGroupXf(ioKid(node, 'grpSpPr'));
        const gFill = ioFillOf(ioKid(node, 'grpSpPr'), S.ctx);
        const S2 = gFill !== undefined ? Object.assign({}, S, { ctx: Object.assign({}, S.ctx, { grpFill: gFill }) }) : S;
        const start = out.length;
        ioWalkTree(node, S2, g ? stack.concat([g]) : stack, out);
        // группа PowerPoint — группа доски: двигается целиком
        if (out.length - start > 1){ const gid = uid(); for (let i = start; i < out.length; i++) if (!out[i].groupId) out[i].groupId = gid; }
      }
      else if (node.localName === 'graphicFrame') ioFrame(node, S, stack, out);
    } catch (e) { console.warn('[deck-io] фигура пропущена', e); }
  });
}
function ioNvName(el){ return ({ sp: 'nvSpPr', cxnSp: 'nvCxnSpPr', pic: 'nvPicPr', grpSp: 'nvGrpSpPr', graphicFrame: 'nvGraphicFramePr' })[el.localName] || 'nvSpPr'; }

function ioSp(sp, S, stack, out){
  const ctx = S.ctx;
  const ph = S.src === 'slide' ? ioPhOf(sp) : null;
  // на макете и образце заполнители не рисуются — это подсказки «Заголовок слайда»
  if (S.src !== 'slide' && ioPhOf(sp)) return;
  const lSp = ph ? ioFindPh(S.layout.phs, ph, false) : null;
  const mPh = ph ? Object.assign({}, ph, { type: ph.type !== 'obj' ? ph.type : ((lSp && ioPhOf(lSp)) || ph).type }) : null;
  const mSp = ph ? ioFindPh(S.master.phs, mPh, true) : null;
  const spPr = ioKid(sp, 'spPr'), style = ioKid(sp, 'style');
  const chain = [mSp, lSp, sp].filter(Boolean);
  // положение — у кого задано, начиная с самой фигуры
  let xf = null;
  for (let i = chain.length - 1; i >= 0 && !xf; i--) xf = ioXfrm(ioKid(ioKid(chain[i], 'spPr'), 'xfrm'));
  if (!xf) return;
  const r = ioApplyGroups(xf, stack);
  const o = { id: uid(), type: 'box', geom: 'rect' };
  let geomSet = false;
  for (let i = chain.length - 1; i >= 0 && !geomSet; i--) geomSet = ioGeom(ioKid(chain[i], 'spPr'), o, xf);
  // заливка: фигура → макет → образец → стиль фигуры
  let fill;
  for (let i = chain.length - 1; i >= 0 && fill === undefined; i--) fill = ioFillOf(ioKid(chain[i], 'spPr'), ctx);
  if (fill === undefined){ for (let i = chain.length - 1; i >= 0 && fill === undefined; i--){ const st = ioKid(chain[i], 'style'); if (st) fill = ioFillFromStyle(st, ctx); } }
  let line;
  for (let i = chain.length - 1; i >= 0 && line === undefined; i--){
    const st = ioKid(chain[i], 'style');
    const base = st ? ioLineFromStyle(st, ctx) : undefined;
    const ln = ioKid(ioKid(chain[i], 'spPr'), 'ln');
    if (ln) line = ioLineEl(ln, ctx, base || null);
    else if (base !== undefined) line = base;
  }
  // картинка вместо заливки фигуры (часто так вставлены фото и формулы)
  if (fill && fill.blip){
    ioPlace(o, r);
    const img = { id: uid(), type: 'image', points: o.points, w: o.w, h: o.h, natW: 0, natH: 0 };
    if (o.rot) img.rot = o.rot;
    img.pending = { blip: fill.blip, rels: S.rels, flipH: !!r.flipH, flipV: !!r.flipV, geom: o.geom !== 'rect' ? { geom: o.geom, adj: o.adj, path: o.path } : null };
    out.push(img);
    fill = null;
    if (!line) { /* только картинка */ }
  }
  o.fill = fill || null;
  o.line = line || null;
  // текст
  const txBody = ioKid(sp, 'txBody');
  let hasText = false;
  if (txBody){
    const fontRef = style ? ioStyleRef(style, 'fontRef', ctx) : null;
    const fr = fontRef ? { f: fontRef.idx === 'major' ? ctx.theme.major : ctx.theme.minor } : {};
    if (fontRef && fontRef.color) fr.c = fontRef.color.c;
    const lvls = ioMergeLvls([
      ph ? ioTxStyleFor(mPh, S.master) : (S.defStyle || S.master.styles.other),
      mSp ? ioLvlStyles(ioPath(mSp, 'txBody', 'lstStyle'), ctx) : null,
      lSp ? ioLvlStyles(ioPath(lSp, 'txBody', 'lstStyle'), ctx) : null,
    ]);
    const own = ioMergeLvls([ioLvlStyles(ioKid(txBody, 'lstStyle'), ctx)]);
    const bodyPrs = [mSp && ioPath(mSp, 'txBody', 'bodyPr'), lSp && ioPath(lSp, 'txBody', 'bodyPr'), ioKid(txBody, 'bodyPr')];
    const t = ioTextBody(txBody, lvls, bodyPrs, ctx, fontRef ? fr : null, own);
    if (t.any){ o.text = t.tx; hasText = true; }
  }
  // пустой заполнитель в показе PowerPoint не виден вовсе (даже с заливкой),
  // пустая фигура без заливки и линии — тоже
  if (!hasText && (ph || (!o.fill && !o.line))) return;
  ioPlace(o, r);
  out.push(o);
}

function ioPic(pic, S, stack, out){
  const ctx = S.ctx;
  const ph = S.src === 'slide' ? ioPhOf(pic) : null;
  let xf = ioXfrm(ioPath(pic, 'spPr', 'xfrm'));
  if (!xf && ph){ const l = ioFindPh(S.layout.phs, ph, false); xf = l && ioXfrm(ioPath(l, 'spPr', 'xfrm')); }
  if (!xf) return;
  const r = ioApplyGroups(xf, stack);
  const blipFill = ioKid(pic, 'blipFill');
  if (!blipFill) return;
  const spPr = ioKid(pic, 'spPr');
  const g = {};
  ioGeom(spPr, g, xf);
  const o = ioPlace({ id: uid(), type: 'image', natW: 0, natH: 0 }, r);
  delete o.flipH; delete o.flipV;
  o.pending = { blip: blipFill, rels: S.rels, flipH: !!r.flipH, flipV: !!r.flipV, geom: g.geom && g.geom !== 'rect' ? g : null };
  out.push(o);
  // рамка картинки — отдельным контуром поверх
  const ln = ioLineEl(ioKid(spPr, 'ln'), ctx, null);
  if (ln && ln.c){
    const b = ioPlace({ id: uid(), type: 'box', geom: g.geom || 'rect', adj: g.adj, path: g.path, fill: null, line: ln }, r);
    if (!b.adj) delete b.adj;
    if (!b.path) delete b.path;
    out.push(b);
  }
}

// заглушка для того, что доска не показывает (диаграммы Excel и т. п.)
function ioStub(r, label, out){
  const ptPx = ioPtPx();
  const o = ioPlace({ id: uid(), type: 'box', geom: 'rect', fill: { c: '#F2F2F2' }, line: { c: '#BFBFBF', w: 1, dash: 'dash' },
    text: { paras: [{ runs: [{ t: label, sz: 12 * ptPx, c: '#7F7F7F', f: 'Calibri', i: true }], al: 'c' }], anchor: 'm', pad: [8, 4, 8, 4] } }, r);
  out.push(o);
}
function ioFrame(fr, S, stack, out){
  const xf = ioXfrm(ioKid(fr, 'xfrm'));
  if (!xf) return;
  const r = ioApplyGroups(xf, stack);
  const gd = ioPath(fr, 'graphic', 'graphicData');
  const uri = (gd && gd.getAttribute('uri')) || '';
  if (/table$/.test(uri)){ const tbl = ioKid(gd, 'tbl'); if (tbl) { ioTable(tbl, r, S, out); return; } }
  if (/diagram$/.test(uri)){ if (ioSmartArt(gd, xf, S, stack, out)) return; ioStub(r, 'Схема SmartArt', out); return; }
  if (/chart$/.test(uri)){ ioStub(r, 'Диаграмма из PowerPoint — здесь не показывается', out); return; }
  // объект OLE (старый редактор формул, вставка Excel) — его картинка-превью
  const pic = gd && gd.getElementsByTagNameNS('*', 'pic')[0];
  if (pic){
    const blipFill = ioKid(pic, 'blipFill');
    if (blipFill){
      const o = ioPlace({ id: uid(), type: 'image', natW: 0, natH: 0 }, r);
      o.pending = { blip: blipFill, rels: S.rels, flipH: false, flipV: false, geom: null, stub: /ole/.test(uri) ? 'Объект (формула или таблица Excel)' : 'Объект' };
      out.push(o);
      return;
    }
  }
  ioStub(r, /ole/.test(uri) ? 'Объект (формула или таблица Excel)' : 'Объект', out);
}
// SmartArt: PowerPoint хранит уже разложенные фигуры (ppt/diagrams/drawingN.xml)
function ioSmartArt(gd, xf, S, stack, out){
  const relIds = ioKid(gd, 'relIds');
  const dm = relIds && relIds.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'dm');
  const dmPath = dm && S.rels[dm] && S.rels[dm].target;
  const dmDoc = dmPath && S.pkg.docs.get(dmPath);
  if (!dmDoc) return false;
  const ext = dmDoc.getElementsByTagNameNS('*', 'dataModelExt')[0];
  const drawRel = ext && ext.getAttribute('relId');
  const drawPath = drawRel && S.rels[drawRel] && S.rels[drawRel].target;
  const drawDoc = drawPath && S.pkg.docs.get(drawPath);
  if (!drawDoc) return false;
  const tree = drawDoc.getElementsByTagNameNS('*', 'spTree')[0];
  if (!tree) return false;
  const g = { x: xf.x, y: xf.y, w: xf.w, h: xf.h, rot: 0, flipH: false, flipV: false, cx0: 0, cy0: 0, cw: xf.w || 1, ch: xf.h || 1 };
  const start = out.length;
  ioWalkTree(tree, Object.assign({}, S, { src: 'master', rels: S.pkg.relsCache[drawPath] || S.rels }), stack.concat([g]), out);
  if (out.length - start > 1){ const gid = uid(); for (let i = start; i < out.length; i++) if (!out[i].groupId) out[i].groupId = gid; }
  return out.length > start;
}

/* ── таблица ─────────────────────────────────────────────────────────────
   Оформление: стиль таблицы (ppt/tableStyles.xml, части wholeTbl, band1H,
   firstRow…) → свои заливки и границы ячейки. Стиль не нашёлся — как
   «Средний стиль 2, акцент 1», самый частый в PowerPoint */
function ioTblStyle(S, id){
  const doc = S.pkg.tableStyles;
  if (!doc || !id) return null;
  return [...doc.documentElement.children].find(s => s.getAttribute('styleId') === id) || null;
}
function ioTblPart(part, ctx){
  if (!part) return null;
  const out = {};
  const tcs = ioKid(part, 'tcStyle');
  if (tcs){
    const fillEl = ioKid(tcs, 'fill');
    if (fillEl){ const f = ioFillOf(fillEl, ctx); if (f !== undefined) out.fill = f; }
    const fr = ioKid(tcs, 'fillRef');
    if (fr && out.fill === undefined){ out.fill = ioColorIn(fr, ctx) || null; }
    const bd = ioKid(tcs, 'tcBdr');
    if (bd){
      out.bd = {};
      ['left', 'right', 'top', 'bottom', 'insideH', 'insideV'].forEach(k => {
        const e = ioKid(bd, k);
        if (!e) return;
        const ln = ioKid(e, 'ln');
        if (ln) out.bd[k] = ioLineEl(ln, ctx, null);
        else { const lr = ioKid(e, 'lnRef'); if (lr){ const c = ioColorIn(lr, ctx); out.bd[k] = c ? { c: c.c, w: 12700 * ioPxPerEmu() } : null; } }
      });
    }
  }
  const tx = ioKid(part, 'tcTxStyle');
  if (tx){
    out.tx = {};
    if (tx.getAttribute('b') === 'on') out.tx.b = true;
    if (tx.getAttribute('i') === 'on') out.tx.i = true;
    const c = ioColorIn(tx, ctx) || ioColorIn(ioKid(tx, 'fontRef'), ctx);
    if (c) out.tx.c = c.c;
  }
  return out;
}
function ioDefaultTblStyle(ctx){
  const acc = '#' + (ctx.theme.colors.accent1 || '4472C4');
  const lt = '#' + (ctx.theme.colors.lt1 || 'FFFFFF');
  const tint = (h, t) => { const n = parseInt(h.slice(1), 16); return '#' + [n >> 16, (n >> 8) & 255, n & 255].map(v => ioHex2(ioFromLin(ioToLin(v) * t + (1 - t)))).join(''); };
  const w = 12700 * ioPxPerEmu(), white = { c: lt, w };
  return {
    wholeTbl: { fill: { c: tint(acc, 0.2) }, bd: { left: white, right: white, top: white, bottom: white, insideH: white, insideV: white } },
    band1H: { fill: { c: tint(acc, 0.4) } },
    firstRow: { fill: { c: acc }, tx: { b: true, c: lt }, bd: { bottom: { c: lt, w: w * 3 } } },
    lastRow: { fill: { c: acc }, tx: { b: true, c: lt } },
    firstCol: { fill: { c: acc }, tx: { b: true, c: lt } },
    lastCol: { fill: { c: acc }, tx: { b: true, c: lt } },
  };
}
function ioTable(tbl, r, S, out){
  const ctx = S.ctx, emu = ioPxPerEmu();
  const cols = ioKids(ioKid(tbl, 'tblGrid'), 'gridCol').map(c => +(ioNum(c, 'w', 0) * emu).toFixed(2));
  const trs = ioKids(tbl, 'tr');
  const rows = trs.map(tr => +(ioNum(tr, 'h', 0) * emu).toFixed(2));
  const tblPr = ioKid(tbl, 'tblPr');
  const flag = (k) => ioBool(tblPr, k);
  const sid = ioPath(tblPr, 'tableStyleId');
  const stEl = ioTblStyle(S, sid ? sid.textContent.trim() : null);
  let parts;
  if (stEl){ parts = {}; ['wholeTbl', 'band1H', 'band2H', 'band1V', 'band2V', 'firstRow', 'lastRow', 'firstCol', 'lastCol'].forEach(k => { parts[k] = ioTblPart(ioKid(stEl, k), ctx); }); }
  else if (sid) parts = ioDefaultTblStyle(ctx);
  else parts = {};
  const R = trs.length, C = cols.length;
  const cells = trs.map((tr, ri) => ioKids(tr, 'tc').slice(0, C).map((tc, ci) => {
    const cell = {};
    const gs = ioNum(tc, 'gridSpan', 1), rs = ioNum(tc, 'rowSpan', 1);
    if (gs > 1) cell.gs = gs;
    if (rs > 1) cell.rs = rs;
    if (ioBool(tc, 'hMerge')) cell.hm = true;
    if (ioBool(tc, 'vMerge')) cell.vm = true;
    // части стиля, которые действуют на эту ячейку, по старшинству
    const act = ['wholeTbl'];
    const hdr = flag('firstRow') ? 1 : 0;
    if (flag('bandRow') && !(hdr && ri === 0) && !(flag('lastRow') && ri === R - 1)) act.push((ri - hdr) % 2 === 0 ? 'band1H' : 'band2H');
    if (flag('bandCol')) act.push((ci - (flag('firstCol') ? 1 : 0)) % 2 === 0 ? 'band1V' : 'band2V');
    if (flag('firstCol') && ci === 0) act.push('firstCol');
    if (flag('lastCol') && ci === C - 1) act.push('lastCol');
    if (flag('firstRow') && ri === 0) act.push('firstRow');
    if (flag('lastRow') && ri === R - 1) act.push('lastRow');
    let fill, txs = {};
    const bd = {};
    act.forEach(k => {
      const p = parts[k];
      if (!p) return;
      if (p.fill !== undefined) fill = p.fill;
      if (p.tx) Object.assign(txs, p.tx);
      if (p.bd){
        const b = p.bd;
        if (b.left !== undefined && ci === 0) bd.l = b.left;
        if (b.right !== undefined && ci + (gs || 1) >= C) bd.r = b.right;
        if (b.top !== undefined && ri === 0) bd.t = b.top;
        if (b.bottom !== undefined && ri + (rs || 1) >= R) bd.b = b.bottom;
        if (b.insideV !== undefined){ if (ci > 0) bd.l = b.insideV; if (ci + (gs || 1) < C) bd.r = b.insideV; }
        if (b.insideH !== undefined){ if (ri > 0) bd.t = b.insideH; if (ri + (rs || 1) < R) bd.b = b.insideH; }
        // у части «первая строка» её нижняя граница — граница этой строки
        if (k === 'firstRow' && b.bottom !== undefined) bd.b = b.bottom;
        if (k === 'firstRow' && b.top !== undefined) bd.t = b.top;
      }
    });
    const tcPr = ioKid(tc, 'tcPr');
    const ownFill = ioFillOf(tcPr, ctx);
    if (ownFill !== undefined) fill = ownFill;
    [['lnL', 'l'], ['lnR', 'r'], ['lnT', 't'], ['lnB', 'b']].forEach(([k, s]) => { const ln = ioKid(tcPr, k); if (ln){ const l = ioLineEl(ln, ctx, null); bd[s] = l === undefined ? bd[s] : l; } });
    if (fill && !fill.blip) cell.fill = fill;
    const bdClean = {};
    ['l', 't', 'r', 'b'].forEach(s => { if (bd[s] && bd[s].c) bdClean[s] = { c: bd[s].c, w: bd[s].w || 1, dash: bd[s].dash }; });
    if (Object.keys(bdClean).length) cell.bd = bdClean;
    // текст ячейки: стиль таблицы задаёт цвет и жирность по умолчанию
    const txBody = ioKid(tc, 'txBody');
    const fontR = Object.assign({ f: ctx.theme.minor }, txs.c ? { c: txs.c } : {}, txs.b ? { b: true } : {}, txs.i ? { i: true } : {});
    const lvls = ioMergeLvls([S.defStyle || S.master.styles.other]);
    const own = ioMergeLvls([ioLvlStyles(ioKid(txBody, 'lstStyle'), ctx)]);
    const bodyPr = ioKid(txBody, 'bodyPr');
    const t = txBody ? ioTextBody(txBody, lvls, [bodyPr], ctx, fontR, own) : { tx: { paras: [], def: { sz: 18 * ioPtPx(), c: '#000', f: 'Calibri' } } };
    const tx = t.tx;
    tx.pad = [ioNum(tcPr, 'marL', 91440) * emu, ioNum(tcPr, 'marT', 45720) * emu, ioNum(tcPr, 'marR', 91440) * emu, ioNum(tcPr, 'marB', 45720) * emu].map(v => +v.toFixed(2));
    const an = tcPr && tcPr.getAttribute('anchor');
    tx.anchor = an === 'ctr' ? 'm' : an === 'b' ? 'b' : 't';
    delete tx.fit;
    cell.text = tx;
    return cell;
  }));
  // строка короче сетки (битый файл) — добиваем пустыми
  cells.forEach(row => { while (row.length < C) row.push({ text: { paras: [], def: { sz: 18 * ioPtPx(), c: '#000', f: 'Calibri' } } }); });
  const o = ioPlace({ id: uid(), type: 'table', cols, rows, cells }, r);
  o.w = cols.reduce((a, b) => a + b, 0); o.h = rows.reduce((a, b) => a + b, 0);
  delete o.flipH; delete o.flipV;
  out.push(o);
}

/* ── фон слайда ──────────────────────────────────────────────────────── */
function ioBg(bgEl, ctx){
  if (!bgEl) return undefined;
  const pr = ioKid(bgEl, 'bgPr');
  if (pr){ const f = ioFillOf(pr, ctx); return f === undefined ? undefined : f; }
  const ref = ioKid(bgEl, 'bgRef');
  if (ref){
    const idx = ioNum(ref, 'idx', 0), color = ioColorIn(ref, ctx);
    const list = idx >= 1000 ? ctx.theme.bgFills : ctx.theme.fills;
    const el = list[(idx >= 1000 ? idx - 1000 : idx) - 1];
    const f = el ? ioFillEl(el, Object.assign({}, ctx, { phClr: color })) : undefined;
    return f === undefined ? color : f;
  }
  return undefined;
}

/* ── один слайд ──────────────────────────────────────────────────────── */
async function ioReadSlide(pkg, path){
  const doc = await ioDoc(pkg, path);
  if (!doc) return null;
  const root = doc.documentElement;
  const rels = await ioRels(pkg, path);
  const layout = await ioLayout(pkg, ioRelOfType(rels, 'slideLayout'));
  const master = layout.master;
  // части, которые фигуры читают синхронно (SmartArt), — заранее
  for (const id of Object.keys(rels)){
    const t = rels[id];
    if (t.target && (t.type === 'diagramData' || t.type === 'diagramDrawing')){ await ioDoc(pkg, t.target); pkg.relsCache[t.target] = await ioRels(pkg, t.target); }
  }
  const clrMap = ioClrMap(ioClrMap(master.clrMap, layout.clrOvr), ioPath(root, 'clrMapOvr', 'overrideClrMapping'));
  const ctx = { pkg, theme: master.theme, clrMap };
  const base = { pkg, ctx, layout, master, defStyle: pkg.defStyle ? ioMergeLvls([master.styles.other, pkg.defStyle]) : master.styles.other };
  const out = [];
  const showSlideMaster = root.getAttribute('showMasterSp') !== '0';
  if (showSlideMaster && layout.showMaster) ioWalkTree(master.tree, Object.assign({}, base, { src: 'master', rels: master.rels }), [], out);
  if (showSlideMaster) ioWalkTree(layout.tree, Object.assign({}, base, { src: 'layout', rels: layout.rels }), [], out);
  const nLayout = out.length;
  ioWalkTree(ioPath(root, 'cSld', 'spTree'), Object.assign({}, base, { src: 'slide', rels }), [], out);
  // оформление с образца и макета — то, что в PowerPoint на слайде не
  // выделишь: здесь его тоже не сдвинуть случайно (снимается «Открепить»)
  for (let i = 0; i < nLayout; i++){ out[i].fromLayout = true; if (out[i].type === 'image') out[i].locked = true; }
  // у картинки фона свои связи: слайда, макета или образца — где фон задан
  let bg = ioBg(ioPath(root, 'cSld', 'bg'), ctx), bgRels = rels;
  if (bg === undefined){ bg = ioBg(layout.bg, ctx); bgRels = layout.rels; }
  if (bg === undefined){ bg = ioBg(master.bg, ctx); bgRels = master.rels; }
  if (bg && bg.blip) bg.rels = bgRels;
  // заметки докладчика — пригодятся учителю на уроке
  let notes = '';
  const np = ioRelOfType(rels, 'notesSlide');
  if (np){
    const nd = await ioDoc(pkg, np);
    if (nd){
      const sps = [...nd.getElementsByTagNameNS('*', 'sp')].filter(sp => { const ph = ioPhOf(sp); return ph && ph.type === 'body'; });
      notes = sps.map(sp => [...sp.getElementsByTagNameNS('*', 'p')].map(p => [...p.getElementsByTagNameNS('*', 't')].map(t => t.textContent).join('')).join('\n')).join('\n').trim();
    }
  }
  return { objects: out, bg, notes, hidden: root.getAttribute('show') === '0', rels };
}

/* ── картинки: из архива в data:URL ───────────────────────────────────────
   Обрезка (srcRect), отражение и форма (овал, скругление) запекаются в
   пиксели: картинка на доске — прямоугольник. Большие фото ужимаем до
   2400 px по длинной стороне — на слайде больше не нужно, а доске легче */
const IO_IMG_MAX = 2400;
const IO_RASTER = /\.(png|jpe?g|gif|bmp|webp|svg)$/i;
async function ioBlobImage(blob){
  const url = URL.createObjectURL(blob);
  try {
    const im = new Image();
    im.src = url;
    await im.decode();
    return im;
  } finally { setTimeout(() => URL.revokeObjectURL(url), 2000); }
}
async function ioImageData(pkg, p, wPx, hPx){
  const blip = ioKid(p.blip, 'blip');
  const rid = blip && blip.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'embed');
  const target = rid && p.rels[rid] && p.rels[rid].target;
  if (!target || !IO_RASTER.test(target)) return { unsupported: (target || '').split('.').pop() || '?' };
  const f = pkg.zip.file(target);
  if (!f) return { unsupported: 'нет файла' };
  const ext = target.split('.').pop().toLowerCase();
  let blob = await f.async('blob');
  if (ext === 'svg') blob = new Blob([blob], { type: 'image/svg+xml' });
  const im = await ioBlobImage(blob);
  const nw = im.naturalWidth || 1, nh = im.naturalHeight || 1;
  const sr = ioKid(p.blip, 'srcRect');
  const cl = ioNum(sr, 'l', 0) / 100000, ct = ioNum(sr, 't', 0) / 100000, cr = ioNum(sr, 'r', 0) / 100000, cb = ioNum(sr, 'b', 0) / 100000;
  const sx = Math.max(0, nw * cl), sy = Math.max(0, nh * ct);
  const sw = Math.max(1, nw * (1 - cl - cr)), sh = Math.max(1, nh * (1 - ct - cb));
  // размер результата: не больше исходника (после обрезки) и предела
  let ow = Math.min(sw, IO_IMG_MAX), oh = ow * sh / sw;
  if (oh > IO_IMG_MAX){ oh = IO_IMG_MAX; ow = oh * sw / sh; }
  // тянуть картинку в пропорции рамки — как PowerPoint растягивает её по фигуре
  if (wPx > 0 && hPx > 0){ const k = (wPx / hPx) / (ow / oh); if (Math.abs(k - 1) > 0.01){ if (k > 1) ow *= k; else oh /= k; } }
  const scale = Math.min(1, IO_IMG_MAX / Math.max(ow, oh));
  ow = Math.max(1, Math.round(ow * scale)); oh = Math.max(1, Math.round(oh * scale));
  const plain = !p.flipH && !p.flipV && !p.geom && !sr && (ext === 'png' || ext === 'jpg' || ext === 'jpeg') && ow === nw && oh === nh && blob.size < 3e6;
  if (plain){
    const dataUrl = await new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = rej; fr.readAsDataURL(blob); });
    return { src: dataUrl, natW: nw, natH: nh };
  }
  const cv = document.createElement('canvas');
  cv.width = ow; cv.height = oh;
  const c = cv.getContext('2d');
  c.imageSmoothingQuality = 'high';
  if (p.geom && typeof bxGeomOf === 'function'){
    // форма фигуры (овал, скругление…) — маской
    const subs = bxGeomOf(Object.assign({ geom: p.geom.geom }, p.geom), ow, oh);
    c.beginPath();
    subs.filter(s => s.fill).forEach(s => bxTracePathInto(c, s.cmds));
    c.clip();
  }
  c.translate(p.flipH ? ow : 0, p.flipV ? oh : 0);
  c.scale(p.flipH ? -1 : 1, p.flipV ? -1 : 1);
  c.drawImage(im, sx, sy, sw, sh, 0, 0, ow, oh);
  const jpeg = (ext === 'jpg' || ext === 'jpeg') && !p.geom;
  return { src: cv.toDataURL(jpeg ? 'image/jpeg' : 'image/png', 0.9), natW: ow, natH: oh };
}
function bxTracePathInto(c, cmds){
  cmds.forEach(k => {
    if (k[0] === 'M') c.moveTo(k[1], k[2]);
    else if (k[0] === 'L') c.lineTo(k[1], k[2]);
    else if (k[0] === 'Q') c.quadraticCurveTo(k[1], k[2], k[3], k[4]);
    else if (k[0] === 'C') c.bezierCurveTo(k[1], k[2], k[3], k[4], k[5], k[6]);
    else if (k[0] === 'Z') c.closePath();
  });
}
async function ioLoadImages(pkg, objs, onStep){
  const list = objs.filter(o => o.pending);
  let i = 0;
  const one = async (o) => {
    const p = o.pending;
    delete o.pending;
    try {
      const d = await ioImageData(pkg, p, o.w, o.h);
      if (d.src){ o.src = d.src; o.natW = d.natW; o.natH = d.natH; }
      else { o.stub = p.stub || ('Картинка в формате ' + String(d.unsupported).toUpperCase() + ' — браузер её не показывает'); }
    } catch (e) { o.stub = 'Картинка не прочиталась'; }
    i++;
    if (onStep) onStep(i, list.length);
  };
  // по три за раз: и быстрее, и память не взлетает на презентации из фото
  const queue = list.slice();
  await Promise.all([0, 1, 2].map(async () => { while (queue.length) await one(queue.shift()); }));
  // картинки, которые не прочитались, — заглушкой на их месте
  objs.forEach((o, k) => {
    if (o.type === 'image' && o.stub && !o.src){
      const ptPx = ioPtPx();
      objs[k] = { id: o.id, type: 'box', geom: 'rect', points: o.points, w: o.w, h: o.h, rot: o.rot, fill: { c: '#F2F2F2' }, line: { c: '#BFBFBF', w: 1, dash: 'dash' },
        text: { paras: [{ runs: [{ t: o.stub, sz: 12 * ptPx, c: '#7F7F7F', f: 'Calibri', i: true }], al: 'c' }], anchor: 'm', pad: [8, 4, 8, 4] } };
      if (!objs[k].rot) delete objs[k].rot;
    }
  });
}

/* ── весь файл ───────────────────────────────────────────────────────── */
async function ioOpenPptx(file){
  const JSZip = await MathhLibs.load('jszip');
  const zip = await JSZip.loadAsync(file);
  const pkg = { zip, docs: new Map(), cache: {}, relsCache: {} };
  const presPath = 'ppt/presentation.xml';
  const pres = await ioDoc(pkg, presPath);
  if (!pres) throw new Error('это не презентация PowerPoint (нет ppt/presentation.xml)');
  const root = pres.documentElement;
  const sz = ioKid(root, 'sldSz');
  pkg.size = { cx: ioNum(sz, 'cx', 12192000), cy: ioNum(sz, 'cy', 6858000) };
  const rels = await ioRels(pkg, presPath);
  pkg.slides = ioKids(ioKid(root, 'sldIdLst'), 'sldId').map(s => {
    const rid = s.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id');
    return rels[rid] && rels[rid].target;
  }).filter(Boolean);
  const tsPath = ioRelOfType(rels, 'tableStyles');
  pkg.tableStyles = tsPath ? await ioDoc(pkg, tsPath) : null;
  // стиль текста по умолчанию (для надписей вне заполнителей)
  const firstMaster = ioRelOfType(rels, 'slideMaster');
  if (firstMaster){ const m = await ioMaster(pkg, firstMaster); pkg.defStyle = ioLvlStyles(ioKid(root, 'defaultTextStyle'), { pkg, theme: m.theme, clrMap: m.clrMap }); }
  return pkg;
}

/* ═══════════════════════════════════════════════════════════════════════
   ИМПОРТ В ПРЕЗЕНТАЦИЮ: окно, перенос слайдов, «картинками»
   ═══════════════════════════════════════════════════════════════════════ */
// масштаб всего объекта (слайд из файла больше, чем помещается на доске)
function ioScaleObj(o, k){
  if (k === 1) return;
  o.points = (o.points || []).map(p => ({ x: p.x * k, y: p.y * k }));
  ['w', 'h', 'rx', 'ry', 'r'].forEach(f => { if (typeof o[f] === 'number') o[f] *= k; });
  if (o.cols) o.cols = o.cols.map(v => v * k);
  if (o.rows) o.rows = o.rows.map(v => v * k);
  if (o.line && o.line.w) o.line.w *= k;
  const tx = (t) => {
    if (!t) return;
    if (t.pad) t.pad = t.pad.map(v => v * k);
    if (t.def && t.def.sz) t.def.sz *= k;
    (t.paras || []).forEach(p => {
      ['ind', 'fi', 'sb', 'sa', 'lsPx', 'esz'].forEach(f => { if (typeof p[f] === 'number') p[f] *= k; });
      (p.runs || []).forEach(r => { if (r.sz) r.sz *= k; });
    });
  };
  if (o.type === 'box') tx(o.text);
  if (o.type === 'table') (o.cells || []).forEach(row => row.forEach(c => { if (c){ tx(c.text); if (c.bd) Object.values(c.bd).forEach(b => { if (b && b.w) b.w *= k; }); } }));
}
function ioShiftObj(o, dx, dy){ o.points = (o.points || []).map(p => ({ x: p.x + dx, y: p.y + dy })); }

// фон слайда (сплошной, градиент, картинка) → подложка слайда презентации
async function ioApplyBg(pkg, slide, bg, wPx, hPx){
  if (!bg){ slide.bg = { k: 'fill', f: '#FFFFFF' }; return; }
  if (bg.c && !bg.g && !bg.blip){ slide.bg = { k: 'fill', f: bg.c }; return; }
  let src = null, size = null;
  if (bg.blip){
    const d = await ioImageData(pkg, { blip: bg.blip, rels: bg.rels || {}, flipH: false, flipV: false }, wPx, hPx).catch(() => ({}));
    if (d.src){ src = d.src; size = { w: d.natW, h: d.natH }; }
  } else if (bg.g){
    const cv = document.createElement('canvas');
    const k = Math.min(1, 1200 / wPx);
    cv.width = Math.max(2, Math.round(wPx * k)); cv.height = Math.max(2, Math.round(hPx * k));
    const c = cv.getContext('2d');
    c.fillStyle = bxFillStyle(c, bg, cv.width, cv.height, 1);
    c.fillRect(0, 0, cv.width, cv.height);
    src = cv.toDataURL('image/png'); size = { w: cv.width, h: cv.height };
  }
  if (src){ slide.bg = { k: 'plain' }; deckPutBgImg(slide, src, size); }
  else slide.bg = { k: 'fill', f: (bg.g && bg.g[0] && bg.g[0].c) || '#FFFFFF' };
}
// слайд целиком в картинку: те же функции рисования, что у доски
async function ioRaster(wPx, hPx, bgColor, bgSrc, objs){
  const k = Math.min(2, 2400 / wPx);
  const cv = document.createElement('canvas');
  cv.width = Math.round(wPx * k); cv.height = Math.round(hPx * k);
  const c = cv.getContext('2d');
  c.fillStyle = bgColor || '#FFFFFF';
  c.fillRect(0, 0, cv.width, cv.height);
  if (bgSrc){ const im = new Image(); im.src = bgSrc; await im.decode().catch(() => {}); c.drawImage(im, 0, 0, cv.width, cv.height); }
  for (const o of objs) if (o.type === 'image' && o.src){ const im = getImg(o.src); if (!(im.complete && im.naturalWidth)) await im.decode().catch(() => {}); }
  if (typeof bxFontsReady === 'function') await bxFontsReady(objs);
  const camv = { x: 0, y: 0, zoom: k };
  const prev = activeCam;
  activeCam = camv;
  try { objs.forEach(o => renderObject(c, o, camv)); }
  finally { activeCam = prev; }
  return cv.toDataURL('image/jpeg', 0.92);
}

/* ── окно импорта ────────────────────────────────────────────────────── */
let ioDlg = null;
function ioDialog(){
  if (ioDlg) return ioDlg;
  const el = document.createElement('div');
  el.className = 'deck-pop io-dlg';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-label', 'Импорт');
  el.hidden = true;
  el.innerHTML = `
    <div class="deck-pop-sec"><div class="deck-pop-h" id="ioTitle">Импорт</div><div class="io-info" id="ioInfo"></div></div>
    <div class="deck-pop-sec" id="ioModeSec"><div class="deck-pop-h">Как перенести</div>
      <label class="io-opt"><input type="radio" name="ioMode" value="full" checked> <span><b>Полностью</b> — текст, фигуры, таблицы и картинки можно двигать и править</span></label>
      <label class="io-opt"><input type="radio" name="ioMode" value="img"> <span><b>Слайды картинками</b> — точно как в файле, без правки (писать поверх можно)</span></label>
    </div>
    <div class="deck-pop-sec" id="ioPagesSec" hidden><div class="deck-pop-h">Страницы</div>
      <div class="io-row"><label>с <input type="number" id="ioFrom" min="1" value="1"></label><label>по <input type="number" id="ioTo" min="1" value="1"></label></div>
    </div>
    <div class="deck-pop-sec"><div class="deck-pop-h">Куда</div>
      <label class="io-opt"><input type="radio" name="ioWhere" value="end" checked> <span>В конец презентации</span></label>
      <label class="io-opt"><input type="radio" name="ioWhere" value="after"> <span>После текущего слайда</span></label>
      <label class="io-opt"><input type="radio" name="ioWhere" value="replace"> <span>Вместо всех слайдов</span></label>
    </div>
    <div class="io-prog" id="ioProg" hidden><div class="io-bar"><span id="ioBar"></span></div><div class="io-ptext" id="ioPText"></div></div>
    <div class="io-btns"><button class="deck-pop-link" id="ioCancel">Отмена</button><button class="io-go" id="ioGo">Импортировать</button></div>`;
  (typeof screenBoard !== 'undefined' && screenBoard ? screenBoard : document.body).appendChild(el);
  const st = document.createElement('style');
  // №106: у .deck-pop-sec свой display, он сильнее атрибута hidden — без
  // правила ниже в окне выгрузки торчали разделы импорта («Куда», «Страницы»)
  st.textContent = `
.io-dlg{gap:12px}
.io-dlg .deck-pop-sec[hidden]{display:none}
.io-dlg .io-info{font-size:13px;color:var(--muted-1);line-height:1.4}
.io-dlg .io-opt{display:flex;gap:8px;align-items:flex-start;font-size:13.5px;line-height:1.35;color:var(--pencil);cursor:pointer}
.io-dlg .io-opt input{margin-top:3px}
.io-dlg .io-row{display:flex;gap:14px;font-size:13.5px;color:var(--pencil)}
.io-dlg .io-row input{width:64px;height:28px;border-radius:8px;border:1px solid var(--glass-border);background:var(--card,#fff);color:var(--pencil);padding:0 6px}
.io-dlg .io-btns{display:flex;justify-content:flex-end;gap:10px;align-items:center}
.io-dlg .io-go{height:34px;padding:0 16px;border:none;border-radius:10px;background:var(--ink);color:#fff;font-family:var(--font-ui);font-weight:700;font-size:13.5px;cursor:pointer}
.io-dlg .io-go:disabled{opacity:.5;cursor:default}
.io-dlg .io-bar{height:6px;border-radius:3px;background:color-mix(in srgb, var(--ink) 14%, transparent);overflow:hidden}
.io-dlg .io-bar span{display:block;height:100%;width:0;background:var(--ink);transition:width .2s}
.io-dlg .io-ptext{font-size:12.5px;color:var(--muted-1);margin-top:6px}
.io-dlg[hidden]{display:none}`;
  document.head.appendChild(st);
  ioDlg = el;
  return el;
}
function ioProgress(done, total, text){
  const d = ioDialog();
  d.querySelector('#ioProg').hidden = false;
  d.querySelector('#ioBar').style.width = (total ? Math.round(done / total * 100) : 0) + '%';
  d.querySelector('#ioPText').textContent = text || '';
}
function ioAsk(info){
  return new Promise((resolve) => {
    const d = ioDialog();
    d.querySelector('#ioTitle').textContent = 'Импорт: ' + info.name;
    d.querySelector('#ioInfo').textContent = info.text;
    d.querySelector('#ioPagesSec').hidden = !info.pages;
    if (info.pages){ const f = d.querySelector('#ioFrom'), t = d.querySelector('#ioTo'); f.max = t.max = info.pages; f.value = 1; t.value = Math.min(info.pages, 60); }
    d.querySelector('#ioModeSec .io-opt span').innerHTML = info.pdf
      ? '<b>Полностью</b> — текст страницы можно править (рисунки и линии остаются фоном)'
      : '<b>Полностью</b> — текст, фигуры, таблицы и картинки можно двигать и править';
    d.querySelector('#ioProg').hidden = true;
    d.querySelector('#ioGo').disabled = false;
    d.querySelector('#ioCancel').disabled = false;
    d.hidden = false;
    const done = (v) => { d.querySelector('#ioGo').onclick = d.querySelector('#ioCancel').onclick = null; resolve(v); };
    d.querySelector('#ioCancel').onclick = () => { d.hidden = true; done(null); };
    d.querySelector('#ioGo').onclick = () => {
      const mode = d.querySelector('input[name="ioMode"]:checked').value;
      const where = d.querySelector('input[name="ioWhere"]:checked').value;
      const from = Math.max(1, +d.querySelector('#ioFrom').value || 1), to = Math.max(from, +d.querySelector('#ioTo').value || from);
      d.querySelector('#ioGo').disabled = true;
      d.querySelector('#ioCancel').disabled = true;
      done({ mode, where, from, to });
    };
  });
}

/* ── перенос подготовленных слайдов в презентацию ─────────────────────────
   prepared: [{ wPx, hPx, objs, bgFill (сплошной цвет или null), bg (из
   файла, для ioApplyBg), notes, name }] — объекты в координатах слайда */
async function ioPlaceSlides(pkg, prepared, opt){
  const d = deckObj();
  if (!d) return 0;
  pushUndo();
  if (opt.where === 'replace'){
    const gone = new Set(B.objects.filter(o => o.type !== 'deck').map(o => o.id));
    B.objects = B.objects.filter(o => !gone.has(o.id));
    d.slides = [];
  }
  let at = opt.where === 'after' ? deckCurIndex() + 1 : d.slides.length;
  if (at < 0) at = d.slides.length;
  const first = at;
  const cs = B.cellSize || 24;
  for (let i = 0; i < prepared.length; i++){
    const P = prepared[i];
    // размер слайда в клетках; больше предела — ужимаем всё содержимое
    let wc = P.wPx / cs, hc = P.hPx / cs, k = 1;
    const mx = Math.max(wc, hc);
    if (mx > DECK_MAX_CELLS){ k = DECK_MAX_CELLS / mx; wc *= k; hc *= k; }
    const s = deckNewSlide(deckNextSlot(d));
    s.w = +wc.toFixed(3); s.h = +hc.toFixed(3);
    if (P.name) s.name = P.name;
    if (P.notes) s.notes = P.notes;
    d.slides.splice(at + i, 0, s);
    const r = deckSlideRect(s);
    if (P.raster){
      s.bg = { k: 'plain' };
      deckPutBgImg(s, P.raster, { w: P.rasterW, h: P.rasterH });
    } else {
      if (P.bgImgSrc){ s.bg = { k: 'plain' }; deckPutBgImg(s, P.bgImgSrc, P.bgImgSize); }
      else await ioApplyBg(pkg, s, P.bg, r.w, r.h);
      P.objs.forEach(o => {
        ioScaleObj(o, k);
        ioShiftObj(o, r.x, r.y);
        o.lay = 'base';
        delete o.fromLayout;
        B.objects.push(o);
      });
    }
    if (opt.onPlaced) opt.onPlaced(i + 1, prepared.length);
  }
  if (!d.slides.length) d.slides.push(deckNewSlide(deckNextSlot(d)));
  saveDB();
  if (typeof deckResetSeen === 'function') deckResetSeen();
  deckGo(Math.min(first, d.slides.length - 1), 1);
  return prepared.length;
}

async function deckIoImportFile(file){
  if (!deckMayEdit()){ deckToast('Импорт — только тому, кто правит презентацию'); return; }
  const isPdf = /\.pdf$/i.test(file.name) || file.type === 'application/pdf';
  const isPptx = /\.pptx$/i.test(file.name);
  if (!isPdf && !isPptx){ deckToast(/\.ppt$/i.test(file.name) ? 'Старый формат .ppt — сохраните его в PowerPoint как .pptx' : 'Нужен файл .pptx или .pdf'); return; }
  try {
    if (isPptx) await ioImportPptx(file);
    else await ioImportPdf(file);
  } catch (e) {
    console.error('[deck-io] импорт', e);
    if (ioDlg) ioDlg.hidden = true;
    alert('Не получилось прочитать файл: ' + (e && e.message ? e.message : e));
  }
}
async function ioImportPptx(file){
  const pkg = await ioOpenPptx(file);
  const n = pkg.slides.length;
  if (!n){ deckToast('В файле нет слайдов'); return; }
  const cm = (v) => String(+(v / IO_EMU_CM).toFixed(1)).replace('.', ',');
  const opt = await ioAsk({ name: file.name, text: ioPlural(n, 'слайд', 'слайда', 'слайдов') + ', ' + cm(pkg.size.cx) + ' × ' + cm(pkg.size.cy) + ' см' });
  if (!opt) return;
  const k = ioPxPerEmu(), wPx = pkg.size.cx * k, hPx = pkg.size.cy * k;
  const prepared = [];
  for (let i = 0; i < n; i++){
    ioProgress(i, n, 'Читаем слайд ' + (i + 1) + ' из ' + n + '…');
    const S = await ioReadSlide(pkg, pkg.slides[i]);
    if (!S) continue;
    await ioLoadImages(pkg, S.objects);
    const P = { wPx, hPx, objs: S.objects, bg: S.bg, notes: S.notes };
    if (opt.mode === 'img'){
      let bgSrc = null, bgColor = '#FFFFFF';
      if (S.bg && S.bg.c && !S.bg.g) bgColor = S.bg.c;
      else if (S.bg && (S.bg.g || S.bg.blip)){ const tmp = { id: 'tmp' }; await ioApplyBgToTmp(pkg, tmp, S.bg, wPx, hPx); bgSrc = tmp.src; bgColor = tmp.color || bgColor; }
      P.raster = await ioRaster(wPx, hPx, bgColor, bgSrc, S.objects);
      const k2 = Math.min(2, 2400 / wPx);
      P.rasterW = Math.round(wPx * k2); P.rasterH = Math.round(hPx * k2);
    }
    prepared.push(P);
  }
  ioProgress(n, n, 'Раскладываем по слайдам…');
  const placed = await ioPlaceSlides(pkg, prepared, opt);
  ioDialog().hidden = true;
  deckToast('Импортировано: ' + ioPlural(placed, 'слайд', 'слайда', 'слайдов'));
}
// фон для режима «картинками» — как data:URL, без подложки слайда
async function ioApplyBgToTmp(pkg, tmp, bg, wPx, hPx){
  if (bg.blip){ const d = await ioImageData(pkg, { blip: bg.blip, rels: bg.rels || {}, flipH: false, flipV: false }, wPx, hPx).catch(() => ({})); tmp.src = d.src || null; return; }
  if (bg.g){
    const cv = document.createElement('canvas'); cv.width = 600; cv.height = Math.max(2, Math.round(600 * hPx / wPx));
    const c = cv.getContext('2d'); c.fillStyle = bxFillStyle(c, bg, cv.width, cv.height, 1); c.fillRect(0, 0, cv.width, cv.height);
    tmp.src = cv.toDataURL('image/png');
  }
}
function ioPlural(n, one, few, many){
  const m10 = n % 10, m100 = n % 100;
  return n + ' ' + (m10 === 1 && m100 !== 11 ? one : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? few : many);
}

/* ═══════════════════════════════════════════════════════════════════════
   ИМПОРТ PDF (промпт №99)
   «Картинками» — страница целиком подложкой слайда. «Полностью» — страница
   подложкой БЕЗ текста (рисунки, линии, таблицы остаются картинкой), а
   текст поверх — блоками, которые можно править. В PDF текст лежит
   строками и даже кусками строк: склеиваем их в строки, строки — в абзацы
   (одинаковый размер, ровный левый край, обычный межстрочный интервал).
   Это всегда грубее, чем PPTX: в PDF нет понятия «абзац» и «надпись».
   ═══════════════════════════════════════════════════════════════════════ */
const IO_PDF_MAX = 2200;   // длинная сторона картинки страницы, px
async function ioPdfLib(){
  const lib = await MathhLibs.load('pdfjs');
  if (lib.GlobalWorkerOptions && !lib.GlobalWorkerOptions.workerSrc) lib.GlobalWorkerOptions.workerSrc = 'pdf.worker.min.js';
  return lib;
}
// страница → картинка; noText — без текста, а цвета букв запоминаются
async function ioPdfRender(page, noText){
  const vp1 = page.getViewport({ scale: 1 });
  const k = Math.min(3, IO_PDF_MAX / Math.max(vp1.width, vp1.height));
  const vp = page.getViewport({ scale: k });
  const cv = document.createElement('canvas');
  cv.width = Math.round(vp.width); cv.height = Math.round(vp.height);
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, cv.width, cv.height);
  const glyphs = [];
  if (noText){
    // pdf.js рисует буквы через fillText — подменяем: буква не рисуется, а
    // её место и цвет запоминаются (по ним красим текстовые блоки)
    ctx.fillText = function (t, x, y){
      try { const m = this.getTransform(); const p = m.transformPoint(new DOMPoint(x, y)); glyphs.push({ x: p.x / k, y: p.y / k, c: typeof this.fillStyle === 'string' ? this.fillStyle : null }); } catch (e) {}
    };
    ctx.strokeText = function (){};
  }
  await page.render({ canvasContext: ctx, viewport: vp }).promise;
  return { src: cv.toDataURL('image/jpeg', 0.9), w: cv.width, h: cv.height, glyphs, k };
}
function ioPdfFontName(fo){
  const n = String((fo && (fo.name || fo.loadedName)) || '').replace(/^[A-Z]{6}\+/, '');
  if (/Calibri/i.test(n)) return 'Calibri';
  if (/Cambria/i.test(n)) return 'Cambria';
  if (/PT.?Sans/i.test(n)) return 'PT Sans';
  if (/PT.?Serif/i.test(n)) return 'PT Serif';
  if (/Courier|Mono|Consol/i.test(n)) return 'Courier New';
  if (/Times|Serif|Roman|Georgia|Garamond|Book|Cmr|CMR|LMRoman/i.test(n)) return 'Times New Roman';
  return 'Arial';
}
function ioCssToHex(c){
  if (!c) return null;
  if (/^#[0-9a-f]{6}$/i.test(c)) return c.toUpperCase();
  if (/^#[0-9a-f]{3}$/i.test(c)) return ('#' + c[1] + c[1] + c[2] + c[2] + c[3] + c[3]).toUpperCase();
  return typeof bxCssColorToHex === 'function' ? bxCssColorToHex(c) : null;
}
// текстовые куски страницы → блоки доски (координаты страницы в пт, верх-лево)
function ioPdfBlocks(lib, page, tc, glyphs){
  const vp = page.getViewport({ scale: 1 });
  const items = [];
  tc.items.forEach(it => {
    if (!it.str || !it.str.trim() && !it.hasEOL) return;
    const t = lib.Util.transform(vp.transform, it.transform);
    const size = Math.hypot(t[2], t[3]) || Math.hypot(t[0], t[1]);
    if (size < 1) return;
    const ang = Math.atan2(t[1], t[0]) * 180 / Math.PI;
    const st = tc.styles[it.fontName] || {};
    let fo = null;
    try { if (page.commonObjs.has(it.fontName)) fo = page.commonObjs.get(it.fontName); } catch (e) {}
    const fname = String((fo && fo.name) || '');
    const bold = !!(fo && (fo.bold || fo.black)) || /Bold|Black|Heavy|Semibold|Demi/i.test(fname);
    const italic = !!(fo && fo.italic) || /Italic|Oblique/i.test(fname);
    const w = it.width * (Math.hypot(t[0], t[1]) / Math.max(1e-6, Math.hypot(it.transform[0], it.transform[1])));
    items.push({ str: it.str, x: t[4], y: t[5], size, ang, w: it.width ? Math.abs(w) : size * it.str.length * 0.5,
      asc: st.ascent || 0.8, desc: Math.abs(st.descent || 0.2), f: fo ? ioPdfFontName(fo) : (st.fontFamily === 'serif' ? 'Times New Roman' : st.fontFamily === 'monospace' ? 'Courier New' : 'Arial'),
      b: bold, i: italic, eol: it.hasEOL });
  });
  // цвет куска — по ближайшей запомненной букве
  items.forEach(it => {
    let best = null, bd = Infinity;
    for (const g of glyphs){
      if (g.x < it.x - it.size || g.x > it.x + it.w + it.size || Math.abs(g.y - it.y) > it.size) continue;
      const d = Math.abs(g.x - it.x) + Math.abs(g.y - it.y) * 2;
      if (d < bd){ bd = d; best = g; }
      if (d < 1) break;
    }
    it.c = (best && ioCssToHex(best.c)) || '#000000';
  });
  // повёрнутый текст — каждый кусок своим блоком, без склейки
  const out = [];
  const flat = items.filter(it => Math.abs(it.ang) < 2);
  items.filter(it => Math.abs(it.ang) >= 2).forEach(it => out.push({ lines: [{ x: it.x, y: it.y, size: it.size, w: it.w, segs: [it] }], rot: it.ang }));
  // строки: одна базовая линия, куски слева направо; большой разрыв — новая
  // «колонка» (ячейки таблицы, текст в две колонки)
  flat.sort((a, b) => a.y - b.y || a.x - b.x);
  const lines = [];
  flat.forEach(it => {
    const L = lines.find(l => Math.abs(l.y - it.y) < Math.max(l.size, it.size) * 0.35 && it.x >= l.x1 - it.size * 0.5 && it.x - l.x1 < Math.max(l.size, it.size) * 0.9);
    if (L){ L.segs.push(it); L.x1 = Math.max(L.x1, it.x + it.w); L.size = Math.max(L.size, it.size); }
    else lines.push({ y: it.y, x: it.x, x1: it.x + it.w, size: it.size, segs: [it] });
  });
  lines.forEach(l => { l.segs.sort((a, b) => a.x - b.x); l.w = l.x1 - l.x; });
  lines.sort((a, b) => a.y - b.y || a.x - b.x);
  // абзацы: следующая строка ниже на обычный интервал, тот же размер,
  // левый край рядом (или обе по центру)
  const used = new Set();
  lines.forEach((l, i) => {
    if (used.has(i)) return;
    used.add(i);
    const blk = { lines: [l] };
    let last = l;
    for (let j = i + 1; j < lines.length; j++){
      if (used.has(j)) continue;
      const n = lines[j];
      const dy = n.y - last.y;
      if (dy > last.size * 1.75) break;
      if (dy < last.size * 0.6) continue;
      const sameSize = Math.abs(n.size - last.size) < last.size * 0.15;
      const left = Math.abs(n.x - l.x) < l.size * 1.2;
      const center = Math.abs((n.x + n.w / 2) - (l.x + l.w / 2)) < l.size * 1.2;
      const overlap = n.x < blk.lines.reduce((m, q) => Math.max(m, q.x1), 0) && n.x1 > Math.min(...blk.lines.map(q => q.x));
      if (sameSize && overlap && (left || center)){ blk.lines.push(n); used.add(j); last = n; }
    }
    out.push(blk);
  });
  return out;
}
// блок PDF → объект «блок» доски
function ioPdfBox(blk, ptPx){
  const L = blk.lines;
  const x0 = Math.min(...L.map(l => l.x)), x1 = Math.max(...L.map(l => l.x1));
  const first = L[0], lastL = L[L.length - 1];
  const asc = first.segs[0].asc, desc = lastL.segs[0].desc;
  const top = first.y - first.size * asc, bottom = lastL.y + lastL.size * desc;
  // выравнивание: края строк разные, а середины совпадают — по центру
  let al = 'l';
  if (L.length > 1){
    const lefts = L.map(l => l.x), rights = L.map(l => l.x1), mids = L.map(l => (l.x + l.x1) / 2);
    const spread = (a) => Math.max(...a) - Math.min(...a), sz = first.size;
    if (spread(lefts) > sz && spread(mids) < sz * 0.6) al = 'c';
    else if (spread(lefts) > sz && spread(rights) < sz * 0.6) al = 'r';
  }
  const runs = [];
  const add = (seg, t) => {
    const r = { t, sz: +(seg.size * ptPx).toFixed(2), c: seg.c, f: seg.f };
    if (seg.b) r.b = true;
    if (seg.i) r.i = true;
    const prev = runs[runs.length - 1];
    if (prev && prev.sz === r.sz && prev.c === r.c && prev.f === r.f && !!prev.b === !!r.b && !!prev.i === !!r.i) prev.t += t;
    else runs.push(r);
  };
  L.forEach((l, li) => {
    l.segs.forEach((sg, si) => {
      let t = sg.str;
      if (si){ const pv = l.segs[si - 1]; const gap = sg.x - (pv.x + pv.w); if (gap > sg.size * 0.12 && !/\s$/.test(pv.str) && !/^\s/.test(t)) t = ' ' + t; }
      add(sg, t);
    });
    // переносы строк PDF — не абзацы: склеиваем через пробел, на доске текст
    // переносится сам по ширине блока; перенос со словом через «-» склеиваем
    if (li < L.length - 1 && runs.length){
      const r = runs[runs.length - 1];
      if (/[^\s-]-$/.test(r.t) && /^[a-zа-яё]/.test(L[li + 1].segs[0].str)) r.t = r.t.slice(0, -1);
      else if (!/\s$/.test(r.t)) r.t += ' ';
    }
  });
  if (runs.length) runs[runs.length - 1].t = runs[runs.length - 1].t.replace(/\s+$/, '');
  const padX = 2, padY = 1;
  const p = { runs };
  if (al !== 'l') p.al = al;
  // межстрочный интервал как в PDF (от размера шрифта)
  if (L.length > 1){
    const avg = (lastL.y - first.y) / (L.length - 1);
    const m = typeof bxMetrics === 'function' ? bxMetrics(runs[0]) : { asc: 0.92, desc: 0.24 };
    const nat = first.size * (m.asc + m.desc);
    if (Math.abs(avg / nat - 1) > 0.05) p.lsPx = +(avg * ptPx).toFixed(2);
  }
  const o = { id: uid(), type: 'box', geom: 'rect', fill: null, line: null,
    points: [{ x: (x0 - padX) * ptPx, y: (top - padY) * ptPx }], w: (x1 - x0 + padX * 2) * ptPx * 1.03, h: (bottom - top + padY * 2) * ptPx,
    text: { paras: [p], anchor: 't', pad: [padX * ptPx, padY * ptPx, padX * ptPx, padY * ptPx], fit: 'shrink', def: Object.assign({}, runs[0], { t: undefined }) } };
  delete o.text.def.t;
  if (blk.rot){
    // повёрнутый кусок: рамка вокруг начала строки, поворот вокруг её середины
    const s = first.segs[0], len = s.w, hgt = s.size * (s.asc + s.desc);
    const a = blk.rot * Math.PI / 180;
    const cx = s.x + Math.cos(a) * len / 2 + Math.sin(a) * (hgt / 2 - s.size * s.asc);
    const cy = s.y + Math.sin(a) * len / 2 - Math.cos(a) * (hgt / 2 - s.size * s.asc);
    o.w = (len + padX * 2) * ptPx * 1.03; o.h = (hgt + padY * 2) * ptPx;
    o.points = [{ x: cx * ptPx - o.w / 2, y: cy * ptPx - o.h / 2 }];
    o.rot = +blk.rot.toFixed(2);
  }
  return o;
}
async function ioImportPdf(file){
  const lib = await ioPdfLib();
  const buf = new Uint8Array(await file.arrayBuffer());
  const doc = await lib.getDocument({ data: buf, isEvalSupported: false }).promise;
  const n = doc.numPages;
  const p1 = await doc.getPage(1), v1 = p1.getViewport({ scale: 1 });
  const cm = (v) => String(+(v / 72 * 2.54).toFixed(1)).replace('.', ',');
  const opt = await ioAsk({ name: file.name, pdf: true, pages: n, text: ioPlural(n, 'страница', 'страницы', 'страниц') + ', первая ' + cm(v1.width) + ' × ' + cm(v1.height) + ' см' });
  if (!opt) return;
  const from = Math.min(n, opt.from), to = Math.min(n, opt.to);
  const ptPx = ioPtPx();
  const prepared = [];
  let anyText = false;
  for (let i = from; i <= to; i++){
    ioProgress(i - from, to - from + 1, 'Читаем страницу ' + i + ' из ' + to + '…');
    const page = await doc.getPage(i);
    const vp = page.getViewport({ scale: 1 });
    const wPx = vp.width * ptPx, hPx = vp.height * ptPx;
    if (opt.mode === 'img'){
      const r = await ioPdfRender(page, false);
      prepared.push({ wPx, hPx, raster: r.src, rasterW: r.w, rasterH: r.h, objs: [] });
    } else {
      const r = await ioPdfRender(page, true);
      const tc = await page.getTextContent();
      const blocks = ioPdfBlocks(lib, page, tc, r.glyphs);
      if (blocks.length) anyText = true;
      const objs = blocks.map(b => ioPdfBox(b, ptPx)).filter(o => o.text.paras[0].runs.length);
      // подложка — страница без текста
      const bgImg = { id: uid(), type: 'image', src: r.src, points: [{ x: 0, y: 0 }], w: wPx, h: hPx, natW: r.w, natH: r.h, locked: true };
      prepared.push({ wPx, hPx, objs, pdfBg: bgImg });
    }
    page.cleanup();
  }
  ioProgress(1, 1, 'Раскладываем по слайдам…');
  // подложка страницы — картинкой-подложкой слайда (её не выделить и не стереть)
  prepared.forEach(P => { if (P.pdfBg){ P.raster = null; P.bgImgSrc = P.pdfBg.src; P.bgImgSize = { w: P.pdfBg.natW, h: P.pdfBg.natH }; } });
  const placed = await ioPlaceSlides(null, prepared, opt);
  ioDialog().hidden = true;
  deckToast('Импортировано: ' + ioPlural(placed, 'страница', 'страницы', 'страниц') + (opt.mode === 'full' && !anyText ? ' (текста в файле нет — это скан)' : ''));
  doc.destroy();
}

/* ═══════════════════════════════════════════════════════════════════════
   ВЫГРУЗКА (промпт №100): PDF — по слайду на страницу, PPTX — с настоящими
   объектами PowerPoint. Спрашиваем одно: с пометками урока или только
   заготовку
   ═══════════════════════════════════════════════════════════════════════ */
/* №106: размеры слайдов презентации — группами, самый частый первым. В PPTX
   размер слайда один на весь файл (так устроен формат), поэтому при разных
   форматах учитель выбирает, какой взять; по умолчанию — у большинства
   слайдов, а не у первого (раньше альбомная презентация с одним книжным
   первым слайдом выгружалась вся книжной) */
function ioSizeGroups(){
  const groups = [];
  deckSlides().forEach((s, i) => {
    const key = (+s.w).toFixed(2) + 'x' + (+s.h).toFixed(2);
    let g = groups.find(x => x.key === key);
    if (!g){ g = { key, w: +s.w, h: +s.h, n: 0, first: i }; groups.push(g); }
    g.n++;
  });
  groups.sort((a, b) => b.n - a.n || a.first - b.first);
  return groups;
}
function ioSizeLabel(g){
  const r = g.w / g.h, cm = (v) => String(Math.round(v * 5) / 10).replace('.', ',');
  const ratio = Math.abs(r - 16 / 9) < 0.02 || Math.abs(1 / r - 16 / 9) < 0.02 ? '16:9'
    : Math.abs(r - 4 / 3) < 0.02 || Math.abs(1 / r - 4 / 3) < 0.02 ? '4:3'
    : Math.abs(r - Math.SQRT2) < 0.02 || Math.abs(1 / r - Math.SQRT2) < 0.02 ? 'как А4' : '';
  const orient = Math.abs(r - 1) < 0.02 ? 'Квадрат' : r > 1 ? 'Альбомный' : 'Книжный';
  return orient + (ratio ? ' ' + ratio : '') + ', ' + cm(g.w) + ' × ' + cm(g.h) + ' см — ' + ioPlural(g.n, 'слайд', 'слайда', 'слайдов');
}
function ioAskExport(kind){
  return new Promise((resolve) => {
    const d = ioDialog();
    d.querySelector('#ioTitle').textContent = kind === 'pdf' ? 'Скачать PDF' : 'Скачать PowerPoint (PPTX)';
    const n = deckSlides().length;
    d.querySelector('#ioInfo').textContent = ioPlural(n, 'слайд', 'слайда', 'слайдов') + (kind === 'pptx'
      ? '. Надписи, фигуры, таблицы и картинки — объектами PowerPoint; записи пером и чертежи — картинками.' : '.');
    d.querySelector('#ioPagesSec').hidden = true;
    const modeSec = d.querySelector('#ioModeSec');
    const whereSec = d.querySelector('input[name="ioWhere"]').closest('.deck-pop-sec');
    modeSec.hidden = whereSec.hidden = true;
    let ex = d.querySelector('#ioExSec');
    if (!ex){
      ex = document.createElement('div');
      ex.className = 'deck-pop-sec'; ex.id = 'ioExSec';
      ex.innerHTML = `<div class="deck-pop-h">Что выгрузить</div>
        <label class="io-opt"><input type="radio" name="ioEx" value="all" checked> <span>Слайды с пометками урока</span></label>
        <label class="io-opt"><input type="radio" name="ioEx" value="base"> <span>Только заготовку (без пометок)</span></label>`;
      modeSec.after(ex);
    }
    ex.hidden = false;
    // разные размеры слайдов: для PPTX — выбор размера файла, для PDF —
    // только успокоить (там у каждой страницы свой размер)
    let sz = d.querySelector('#ioSizeSec');
    if (!sz){ sz = document.createElement('div'); sz.className = 'deck-pop-sec'; sz.id = 'ioSizeSec'; ex.after(sz); }
    const groups = ioSizeGroups();
    sz.hidden = groups.length < 2;
    if (groups.length > 1){
      sz.innerHTML = kind === 'pptx'
        ? `<div class="deck-pop-h">Размер слайдов в PowerPoint</div>
           <small class="deck-pop-note">В файле PowerPoint размер слайда один на всю презентацию. Слайды другого размера будут вписаны в него целиком, по краям — тёмные поля. В PDF каждый слайд сохраняет свой размер.</small>`
          + groups.map((g, i) => `<label class="io-opt"><input type="radio" name="ioSize" value="${i}"${i ? '' : ' checked'}> <span>${ioSizeLabel(g)}</span></label>`).join('')
        : `<small class="deck-pop-note">Слайды разного размера — в PDF у каждой страницы будет размер своего слайда.</small>`;
    }
    d.querySelector('#ioGo').textContent = 'Скачать';
    d.querySelector('#ioProg').hidden = true;
    d.querySelector('#ioGo').disabled = false; d.querySelector('#ioCancel').disabled = false;
    d.hidden = false;
    const finish = (v) => {
      modeSec.hidden = whereSec.hidden = false; ex.hidden = true; sz.hidden = true;
      d.querySelector('#ioGo').textContent = 'Импортировать';
      d.querySelector('#ioGo').onclick = d.querySelector('#ioCancel').onclick = null;
      resolve(v);
    };
    d.querySelector('#ioCancel').onclick = () => { d.hidden = true; finish(null); };
    d.querySelector('#ioGo').onclick = () => {
      const v = d.querySelector('input[name="ioEx"]:checked').value;
      const si = d.querySelector('input[name="ioSize"]:checked');
      const g = groups[si ? +si.value : 0];
      d.querySelector('#ioGo').disabled = true; d.querySelector('#ioCancel').disabled = true;
      finish({ base: v === 'base', size: g ? { w: g.w, h: g.h } : null });
    };
  });
}
// что попадает в выгрузку слайда: объекты его слота, без пометок по желанию
function ioSlideObjs(s, baseOnly){
  return deckSlotObjects(s).filter(o => !(baseOnly && o.lay !== 'base' && !o.bgOf));
}
async function ioWaitImages(objs){
  for (const o of objs){
    if (o.type !== 'image' || !o.src) continue;
    const im = getImg(o.src);
    if (!(im.complete && im.naturalWidth)) await im.decode().catch(() => {});
  }
}
// слайд в картинку тем же render(), что миниатюры: подложка, узор, обрезка
// по краю слайда — всё как на экране
function ioRenderSlide(s, objs, pxW){
  const r = deckSlideRect(s);
  const k = pxW / r.w;
  const cv = document.createElement('canvas');
  cv.width = Math.round(r.w * k); cv.height = Math.round(r.h * k);
  const keep = B.objects;
  const only = new Set(objs.map(o => o.id));
  // render() рисует B.objects — на время одного синхронного кадра подменяем список
  B.objects = keep.filter(o => o.type === 'deck' || only.has(o.id));
  deckRenderSlideId = s.id;
  try { render(cv.getContext('2d'), cv.width, cv.height, { x: r.x, y: r.y, zoom: k }, false, 1); }
  finally { B.objects = keep; deckRenderSlideId = null; activeCam = cam; if (typeof deckInkSync === 'function') deckInkSync(); }
  return cv;
}
function ioDownload(blob, name){
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
function ioFileName(ext){ return String((B && B.name) || 'Презентация').replace(/[\\/:*?"<>|]+/g, ' ').trim() + '.' + ext; }

async function deckIoExportPdf(){
  const opt = await ioAskExport('pdf');
  if (!opt) return;
  try {
    const lib = await MathhLibs.load('jspdf');
    const sl = deckSlides();
    let pdf = null;
    for (let i = 0; i < sl.length; i++){
      ioProgress(i, sl.length, 'Слайд ' + (i + 1) + ' из ' + sl.length + '…');
      const s = sl[i], objs = ioSlideObjs(s, opt.base);
      if (typeof bxFontsReady === 'function') await bxFontsReady(objs);
      await ioWaitImages(objs);
      const r = deckSlideRect(s);
      const cv = ioRenderSlide(s, objs, Math.min(2600, r.w * 2));
      // размер страницы — настоящий размер слайда (клетка = 0,5 см)
      const wmm = s.w * 5, hmm = s.h * 5;
      const orient = wmm >= hmm ? 'landscape' : 'portrait';
      if (!pdf) pdf = new lib.jsPDF({ orientation: orient, unit: 'mm', format: [wmm, hmm], compress: true });
      else pdf.addPage([wmm, hmm], orient);
      pdf.addImage(cv.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, wmm, hmm, undefined, 'FAST');
    }
    ioProgress(1, 1, 'Сохраняем…');
    ioDownload(pdf.output('blob'), ioFileName('pdf'));
    ioDialog().hidden = true;
  } catch (e) {
    console.error('[deck-io] PDF', e);
    ioDialog().hidden = true;
    alert('Не получилось выгрузить PDF: ' + (e && e.message ? e.message : e));
  }
}

/* ── PPTX ─────────────────────────────────────────────────────────────── */
function ioIn(px){ return px / (2 * (B.cellSize || 24)) / 2.54; }   // единицы доски → дюймы
function ioPt(px){ return px / ioPtPx(); }
const ioHexNo = (c) => String(c || '#000000').replace('#', '').toUpperCase();
async function ioSrcToData(src){
  if (!src) return null;
  if (src.startsWith('data:')) return src;
  try {
    const res = await fetch(imgUrl(src), { mode: 'cors' });
    const blob = await res.blob();
    return await new Promise((ok, no) => { const fr = new FileReader(); fr.onload = () => ok(fr.result); fr.onerror = no; fr.readAsDataURL(blob); });
  } catch (e) {
    const im = getImg(src);
    if (!(im.complete && im.naturalWidth)) await im.decode().catch(() => {});
    const cv = document.createElement('canvas'); cv.width = im.naturalWidth || 1; cv.height = im.naturalHeight || 1;
    cv.getContext('2d').drawImage(im, 0, 0);
    return cv.toDataURL('image/png');
  }
}
const ioPptxData = (d) => d ? d.replace(/^data:/, '') : d;
// текст доски → куски pptxgenjs (абзац заканчивается breakLine)
function ioRunsPptx(tx, k){
  const out = [];
  (tx.paras || []).forEach((p, pi) => {
    const runs = (p.runs || []).filter(r => r.t);
    const popt = {};
    if (p.al && p.al !== 'l') popt.align = ({ c: 'center', r: 'right', j: 'justify', d: 'justify' })[p.al];
    if (p.bu) popt.bullet = p.bu.num ? { type: 'number', style: p.bu.num, startAt: p.bu.start || 1 } : { code: (p.bu.ch || '•').codePointAt(0).toString(16).toUpperCase().padStart(4, '0') };
    if (p.bu && p.ind) popt.bullet.indent = Math.max(1, ioPt(p.ind) * k);
    if (p.lvl) popt.indentLevel = p.lvl;
    if (p.sb) popt.paraSpaceBefore = ioPt(p.sb) * k;
    if (p.sa) popt.paraSpaceAfter = ioPt(p.sa) * k;
    if (p.ls) popt.lineSpacingMultiple = p.ls;
    if (p.lsPx) popt.lineSpacing = ioPt(p.lsPx) * k;
    if (!runs.length){
      out.push({ text: '', options: Object.assign({ fontSize: Math.max(1, ioPt(p.esz || 24) * k), breakLine: pi < tx.paras.length - 1 }, popt) });
      return;
    }
    runs.forEach((r, ri) => {
      // мягкий перенос внутри абзаца (Shift+Enter) — отдельной строкой
      const parts = r.t.split('\n');
      parts.forEach((t, k2) => {
        const o = Object.assign({}, ri === 0 && k2 === 0 ? popt : {}, {
          fontSize: Math.max(1, +(ioPt(r.sz || 24) * k).toFixed(1)), fontFace: r.f || 'Calibri', color: ioHexNo(r.c),
        });
        if (r.b) o.bold = true;
        if (r.i) o.italic = true;
        if (r.u) o.underline = { style: 'sng' };
        if (r.s) o.strike = 'sngStrike';
        if (r.hl) o.highlight = ioHexNo(r.hl);
        if (r.bl === 'sup') o.superscript = true;
        if (r.bl === 'sub') o.subscript = true;
        if (k2 > 0) o.softBreakBefore = true;
        out.push({ text: t, options: o });
      });
    });
    if (pi < tx.paras.length - 1) out[out.length - 1].options.breakLine = true;
  });
  return out;
}
const IO_PPTX_DASH = { dash: 'dash', sysDash: 'sysDash', dot: 'sysDot', sysDot: 'sysDot', dashDot: 'dashDot', lgDash: 'lgDash', lgDashDot: 'lgDashDot', lgDashDotDot: 'lgDashDotDot' };
function ioLinePptx(ln, k){
  if (!ln || !ln.c) return { type: 'none' };
  const o = { color: ioHexNo(ln.c), width: Math.max(0.25, ioPt(ln.w || 1) * k) };
  if (ln.a != null && ln.a < 1) o.transparency = Math.round((1 - ln.a) * 100);
  if (ln.dash && IO_PPTX_DASH[ln.dash]) o.dashType = IO_PPTX_DASH[ln.dash];
  if (ln.he) o.beginArrowType = ln.he;
  if (ln.te) o.endArrowType = ln.te;
  return o;
}
function ioFillPptx(f){
  if (!f) return null;
  const c = f.c || (f.g && f.g[0] && f.g[0].c);
  if (!c) return null;
  const o = { color: ioHexNo(c) };
  const a = f.a != null ? f.a : (f.g && f.g[0] && f.g[0].a);
  if (a != null && a < 1) o.transparency = Math.round((1 - a) * 100);
  return o;
}
// свой контур (geom 'path') → точки custGeom pptxgenjs, в дюймах от угла фигуры
function ioCustPoints(o, k){
  const pts = [];
  (o.path || []).forEach(sp => {
    const kx = ioIn(o.w) * k / (sp.w || 1), ky = ioIn(o.h) * k / (sp.h || 1);
    (sp.cmds || []).forEach(c => {
      if (c[0] === 'M') pts.push({ x: c[1] * kx, y: c[2] * ky, moveTo: true });
      else if (c[0] === 'L') pts.push({ x: c[1] * kx, y: c[2] * ky });
      else if (c[0] === 'C') pts.push({ x: c[5] * kx, y: c[6] * ky, curve: { type: 'cubic', x1: c[1] * kx, y1: c[2] * ky, x2: c[3] * kx, y2: c[4] * ky } });
      else if (c[0] === 'Q') pts.push({ x: c[3] * kx, y: c[4] * ky, curve: { type: 'quadratic', x1: c[1] * kx, y1: c[2] * ky } });
      else if (c[0] === 'Z') pts.push({ close: true });
    });
  });
  if (pts.length) delete pts[0].moveTo;
  return pts;
}
// объекты, которые PowerPoint не умеет (перо, чертежи доски), — картинкой
// поверх, по порядку наложения: соседние такие объекты — одной картинкой
function ioRasterGroup(objs, s, k2){
  const sr = deckSlideRect(s);
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  objs.forEach(o => { const b = objectBBox(o); minX = Math.min(minX, b.minX); minY = Math.min(minY, b.minY); maxX = Math.max(maxX, b.maxX); maxY = Math.max(maxY, b.maxY); });
  const pad = 6;
  minX = Math.max(sr.x, minX - pad); minY = Math.max(sr.y, minY - pad); maxX = Math.min(sr.x + sr.w, maxX + pad); maxY = Math.min(sr.y + sr.h, maxY + pad);
  if (maxX <= minX || maxY <= minY) return null;
  const z = Math.min(3, 3000 / Math.max(maxX - minX, maxY - minY));
  const cv = document.createElement('canvas');
  cv.width = Math.max(1, Math.round((maxX - minX) * z)); cv.height = Math.max(1, Math.round((maxY - minY) * z));
  const c = cv.getContext('2d');
  const camv = { x: minX, y: minY, zoom: z };
  const prev = activeCam;
  activeCam = camv;
  if (typeof deckIsDarkBg === 'function') deckInkOnDark = deckIsDarkBg(s);
  try { objs.forEach(o => renderObject(c, o, camv)); }
  finally { activeCam = prev; if (typeof deckInkSync === 'function') deckInkSync(); }
  return { data: cv.toDataURL('image/png'), x: minX - sr.x, y: minY - sr.y, w: maxX - minX, h: maxY - minY };
}
async function deckIoExportPptx(){
  const opt = await ioAskExport('pptx');
  if (!opt) return;
  try {
    const PptxGenJS = await MathhLibs.load('pptxgen');
    const pptx = new PptxGenJS();
    const sl = deckSlides();
    // размер слайда в PPTX один на всю презентацию — выбранный в окне (по
    // умолчанию у большинства слайдов, №106); слайды другого формата
    // вписываются в него по центру
    const cell = B.cellSize || 24, size = opt.size || { w: sl[0].w, h: sl[0].h };
    const W = ioIn(size.w * cell), H = ioIn(size.h * cell);
    pptx.defineLayout({ name: 'MATHH', width: +W.toFixed(4), height: +H.toFixed(4) });
    pptx.layout = 'MATHH';
    pptx.title = B.name || 'Презентация';
    let mixed = false;
    const fixes = new Map();
    for (let i = 0; i < sl.length; i++){
      ioProgress(i, sl.length, 'Слайд ' + (i + 1) + ' из ' + sl.length + '…');
      const s = sl[i], sr = deckSlideRect(s);
      const objs = ioSlideObjs(s, opt.base);
      if (typeof bxFontsReady === 'function') await bxFontsReady(objs);
      await ioWaitImages(objs);
      const sw = ioIn(sr.w), sh = ioIn(sr.h);
      const k = Math.min(W / sw, H / sh);
      if (Math.abs(k - 1) > 0.005) mixed = true;
      const ox = (W - sw * k) / 2, oy = (H - sh * k) / 2;
      const X = (px) => ox + ioIn(px - sr.x) * k, Y = (py) => oy + ioIn(py - sr.y) * k, L = (px) => ioIn(px) * k;
      const slide = pptx.addSlide();
      // фон: цвет — цветом, остальное (узор, картинка, тёмная бумага) — картинкой
      const kind = deckBgKind(s), bgObj = objs.find(o => o.bgOf === s.id);
      // №106: слайд другой формы занимает не всю страницу. Фон страницы —
      // тёмные поля, а фон слайда — прямоугольником по его месту (раньше фон
      // растягивался на всю страницу, и слайд казался другой ориентации)
      const exact = Math.abs(sw * k - W) < 0.01 && Math.abs(sh * k - H) < 0.01;
      const fillBg = kind === 'fill' && s.bg.f && !bgObj;
      if (exact){
        if (fillBg) slide.background = { color: ioHexNo(s.bg.f) };
        else {
          const cv = ioRenderSlide(s, bgObj ? [bgObj] : [], Math.min(2400, sr.w * 1.5));
          slide.background = { data: ioPptxData(cv.toDataURL('image/jpeg', 0.9)) };
        }
      } else {
        slide.background = { color: '1B1B1F' };
        if (fillBg) slide.addShape('rect', { x: ox, y: oy, w: sw * k, h: sh * k, fill: { color: ioHexNo(s.bg.f) }, line: { type: 'none' }, objectName: 'mx:bg' });
        else {
          const cv = ioRenderSlide(s, bgObj ? [bgObj] : [], Math.min(2400, sr.w * 1.5));
          slide.addImage({ data: ioPptxData(cv.toDataURL('image/jpeg', 0.9)), x: ox, y: oy, w: sw * k, h: sh * k });
        }
      }
      let pend = [];
      const flush = () => {
        if (!pend.length) return;
        const g = ioRasterGroup(pend, s, k);
        pend = [];
        if (g) slide.addImage({ data: ioPptxData(g.data), x: ox + L(g.x), y: oy + L(g.y), w: L(g.w), h: L(g.h) });
      };
      for (const o of objs){
        if (o.bgOf) continue;
        if (o.type === 'box'){
          flush();
          const base = { x: X(o.points[0].x), y: Y(o.points[0].y), w: Math.max(0.01, L(o.w)), h: Math.max(0.01, L(o.h)) };
          if (o.rot) base.rotate = o.rot;
          if (o.flipH) base.flipH = true;
          if (o.flipV) base.flipV = true;
          // имя фигуры — по нему после записи файла дописываем то, чего
          // pptxgenjs не умеет (градиент, отступы и маркеры абзацев)
          const shp = Object.assign({}, base, { line: ioLinePptx(o.line, k), objectName: 'mx:' + o.id });
          fixes.set(o.id, { o, k });
          const f = ioFillPptx(o.fill);
          if (f) shp.fill = f;
          if (o.geom === 'path'){ shp.points = ioCustPoints(o, k); shp.shape = 'custGeom'; }
          else shp.shape = o.geom || 'rect';
          if (o.geom === 'roundRect' && o.adj && o.adj.adj != null) shp.rectRadius = Math.min(base.w, base.h) * o.adj.adj / 100000;
          if (o.text && bxHasText(o.text)){
            const tx = o.text, pad = tx.pad || [10, 5, 10, 5];
            Object.assign(shp, { valign: ({ t: 'top', m: 'middle', b: 'bottom' })[tx.anchor || 't'], margin: [ioPt(pad[0]) * k, ioPt(pad[2]) * k, ioPt(pad[3]) * k, ioPt(pad[1]) * k] });
            if (tx.wrap === false) shp.wrap = false;
            if (tx.fit === 'shrink') shp.fit = 'shrink';
            if (tx.fit === 'grow') shp.fit = 'resize';
            slide.addText(ioRunsPptx(tx, k), shp);
          } else slide.addShape(shp.shape, shp);
        } else if (o.type === 'table'){
          flush();
          const Lt = bxTableLayout(o);
          const rows = (o.cells || []).map((row, r) => row.map((cell, c) => {
            if (!cell || cell.hm || cell.vm) return null;
            const tx = cell.text || { paras: [] }, pad = tx.pad || BX_CELL_PAD;
            const co = { valign: ({ t: 'top', m: 'middle', b: 'bottom' })[tx.anchor || 'm'], margin: [ioPt(pad[1]) * k, ioPt(pad[2]) * k, ioPt(pad[3]) * k, ioPt(pad[0]) * k] };
            if (cell.gs > 1) co.colspan = cell.gs;
            if (cell.rs > 1) co.rowspan = cell.rs;
            const f = ioFillPptx(cell.fill); if (f) co.fill = f;
            const bd = cell.bd || {};
            co.border = ['t', 'r', 'b', 'l'].map(sd => bd[sd] && bd[sd].c ? { type: 'solid', pt: Math.max(0.25, ioPt(bd[sd].w || 1) * k), color: ioHexNo(bd[sd].c) } : { type: 'none' });
            const runs = ioRunsPptx(tx, k);
            return { text: runs.length ? runs : '', options: co };
          }).filter(Boolean));
          const t = { x: X(o.points[0].x), y: Y(o.points[0].y), w: L(Lt.size.w), colW: (o.cols || []).map(L), rowH: Lt.rowH.map(L) };
          if (o.rot) t.rotate = o.rot;
          slide.addTable(rows, t);
        } else if (o.type === 'image' && !o.task){
          flush();
          const data = await ioSrcToData(o.src);
          if (!data) continue;
          const im = { data: ioPptxData(data), x: X(o.points[0].x), y: Y(o.points[0].y), w: L(o.w), h: L(o.h) };
          if (o.rot) im.rotate = o.rot;
          slide.addImage(im);
        } else if (o.type === 'text' && o.content){
          flush();
          const sz = Math.max(1, ioPt(o.fontSize || 22) * k);
          const tOpt = { x: X(o.points[0].x), y: Y(o.points[0].y), w: L(Math.max(o.boxW || 0, o.w || 10)) + 0.05, h: L(o.h || 20) + 0.02,
            fontSize: sz, fontFace: 'Arial', color: ioHexNo(resolveColor(o.color) || '#1D1D1F'), margin: 0, valign: 'top' };
          if (o.bold) tOpt.bold = true;
          if (o.italic) tOpt.italic = true;
          if (o.underline) tOpt.underline = { style: 'sng' };
          if (o.strike) tOpt.strike = 'sngStrike';
          slide.addText(String(o.content), tOpt);
        } else pend.push(o);
      }
      flush();
      if (s.notes) slide.addNotes(s.notes);
    }
    ioProgress(1, 1, 'Сохраняем…');
    let blob = await pptx.write({ outputType: 'blob' });
    blob = await ioPptxFix(blob, fixes);
    ioDownload(blob, ioFileName('pptx'));
    ioDialog().hidden = true;
    if (mixed) deckToast('Слайды другого размера вписаны в выбранный — в PPTX размер один на файл');
  } catch (e) {
    console.error('[deck-io] PPTX', e);
    ioDialog().hidden = true;
    alert('Не получилось выгрузить PPTX: ' + (e && e.message ? e.message : e));
  }
}

/* После pptxgenjs: он пишет <a:pPr> перед КАЖДЫМ куском абзаца (так по
   стандарту нельзя: PowerPoint предлагает «восстановить» файл, LibreOffice
   теряет маркеры), не умеет градиенты и свои отступы абзацев без маркера.
   Открываем готовый файл, оставляем по одному pPr на абзац и у наших фигур
   (имя mx:<id>) пишем абзацы и заливку ровно по модели доски */
const IO_NS_A = 'http://schemas.openxmlformats.org/drawingml/2006/main';
function ioEmu(px, k){ return Math.round(px / (2 * (B.cellSize || 24)) * IO_EMU_CM * (k || 1)); }
async function ioPptxFix(blob, fixes){
  try {
    const JSZip = await MathhLibs.load('jszip');
    const zip = await JSZip.loadAsync(blob);
    const files = Object.keys(zip.files).filter(f => /^ppt\/slides\/slide\d+\.xml$/.test(f));
    for (const f of files){
      const doc = ioXml(await zip.file(f).async('string'));
      if (!doc) continue;
      const el = (tag) => doc.createElementNS(IO_NS_A, 'a:' + tag);
      [...doc.getElementsByTagNameNS(IO_NS_A, 'p')].forEach(p => {
        const pprs = [...p.children].filter(c => c.localName === 'pPr');
        pprs.forEach((pp, i) => { if (i > 0 || p.firstElementChild !== pp) pp.remove(); });
        if (pprs.length && p.firstElementChild !== pprs[0] && pprs[0].parentNode !== p) p.insertBefore(pprs[0], p.firstChild);
      });
      [...doc.getElementsByTagNameNS('*', 'cNvPr')].forEach(nv => {
        const m = /^mx:(.+)$/.exec(nv.getAttribute('name') || '');
        const fx = m && fixes.get(m[1]);
        if (!fx) return;
        const sp = nv.parentNode && nv.parentNode.parentNode;
        if (!sp) return;
        nv.setAttribute('name', 'Фигура ' + nv.getAttribute('id'));
        const o = fx.o, k = fx.k;
        // градиент вместо сплошного первого цвета
        if (o.fill && Array.isArray(o.fill.g) && o.fill.g.length > 1){
          const spPr = ioKid(sp, 'spPr');
          const old = spPr && [...spPr.children].find(c => c.localName === 'solidFill' || c.localName === 'noFill');
          if (old){
            const gf = el('gradFill'); gf.setAttribute('rotWithShape', '1');
            const lst = el('gsLst');
            o.fill.g.forEach(st => {
              const gs = el('gs'); gs.setAttribute('pos', String(Math.round(st.p * 100000)));
              const c = el('srgbClr'); c.setAttribute('val', ioHexNo(st.c));
              if (st.a != null && st.a < 1){ const a = el('alpha'); a.setAttribute('val', String(Math.round(st.a * 100000))); c.appendChild(a); }
              gs.appendChild(c); lst.appendChild(gs);
            });
            const lin = el('lin'); lin.setAttribute('ang', String(Math.round((o.fill.ang || 0) * 60000))); lin.setAttribute('scaled', '0');
            gf.appendChild(lst); gf.appendChild(lin);
            spPr.replaceChild(gf, old);
          }
        }
        // абзацы: отступы, уровень, маркер — по модели
        const txBody = ioKid(sp, 'txBody');
        if (!txBody || !o.text) return;
        const ps = ioKids(txBody, 'p');
        (o.text.paras || []).forEach((P, i) => {
          const pEl = ps[i];
          if (!pEl) return;
          let pPr = ioKid(pEl, 'pPr');
          if (!pPr){ pPr = el('pPr'); pEl.insertBefore(pPr, pEl.firstChild); }
          pPr.setAttribute('marL', String(ioEmu(P.ind || 0, k)));
          pPr.setAttribute('indent', String(ioEmu(P.fi || 0, k)));
          if (P.lvl) pPr.setAttribute('lvl', String(P.lvl)); else pPr.removeAttribute('lvl');
          [...pPr.children].filter(c => /^bu/.test(c.localName)).forEach(c => c.remove());
          const bu = [];
          if (P.bu && (P.runs || []).length){
            if (P.bu.c){ const bc = el('buClr'), c = el('srgbClr'); c.setAttribute('val', ioHexNo(P.bu.c)); bc.appendChild(c); bu.push(bc); }
            if (P.bu.sz){ const bs = el('buSzPct'); bs.setAttribute('val', String(Math.round(P.bu.sz * 100000))); bu.push(bs); }
            if (P.bu.f){ const bf = el('buFont'); bf.setAttribute('typeface', P.bu.f); bu.push(bf); }
            if (P.bu.num){ const an = el('buAutoNum'); an.setAttribute('type', P.bu.num); if (P.bu.start && P.bu.start !== 1) an.setAttribute('startAt', String(P.bu.start)); bu.push(an); }
            else { const ch = el('buChar'); ch.setAttribute('char', P.bu.ch || '•'); bu.push(ch); }
          } else bu.push(el('buNone'));
          // порядок по стандарту: lnSpc, spcBef, spcAft, bu*, tabLst, defRPr
          const after = [...pPr.children].find(c => c.localName === 'tabLst' || c.localName === 'defRPr' || c.localName === 'extLst');
          bu.forEach(b => pPr.insertBefore(b, after || null));
        });
      });
      zip.file(f, new XMLSerializer().serializeToString(doc));
    }
    return await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', compression: 'DEFLATE' });
  } catch (e) {
    console.warn('[deck-io] PPTX: доводка не удалась, отдаём как есть', e);
    return blob;
  }
}
