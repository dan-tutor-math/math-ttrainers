/* Печать работы (этап 9 конструктора) и то общее, что нужно и странице
   ученика (work.html), и кабинету учителя (works.html).

   - correctText(task) — верный ответ строкой. Тот же, что ученик видит после
     проверки: ключ учителя не должен расходиться с тем, что увидит ученик.
     Поэтому функция здесь, а work.html берёт её отсюда, а не держит копию.
   - info(block) — позиция экзамена по ExamSpec: балл и тип ответа (краткий /
     развёрнутый). Позиция ищется по странице тренажёра и номеру; не нашлась —
     краткий ответ, 1 балл. Это подсказка для бланка, ключа и суммы баллов —
     проверку ответа она не меняет.
   - build / print / download / ask — печать и PDF: задания по вариантам,
     бланк ответов, ключ. Одна вёрстка листов А4 (книжная или альбомная; в
     альбомной — две колонки, как КИМ) идёт и в печать (window.print и
     @media print), и в PDF-файл. На экране блок #wpPrint скрыт, при печати
     скрыто всё, кроме него. Стили — здесь же, чтобы не раздувать works.html.
   - Задание ФИПИ из карточки (блок type:'card', задача 63) печатается текстом
     и формулами (card-render.js), рисунки — файлами cards/img/…; длинное
     условие режется по абзацам/рисункам между колонками и листами. Задание-
     снимок — картинкой, как раньше.
   - «Скачать PDF» — вектором (work-pdf.js: браузер верстает листы, текст
     переписывается в PDF со встроенными шрифтами — выделяется и ищется).
     Не собрался вектор (нет библиотеки, сбой) — прежний путь html2canvas +
     jsPDF картинками. Официальные бланки (blank-forms.js) — картинкой всегда.

   Нужны раньше: trainer-tasks.js (taPlainLabel), subjects-catalog.js
   (страница тренажёра по tid), exam-spec.js. Без них работает с запасными
   значениями (ответ без подписи поля, 1 балл, краткий). */
(function () {
  'use strict';
  if (window.WorkPrint) return;

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const plain = l => (typeof window.taPlainLabel === 'function' ? window.taPlainLabel(l) : String(l || '').replace(/<[^>]*>/g, '').trim());
  // задание — снимок (task) или карточка ФИПИ (card); текст, видео, разделитель — нет
  const isTask = b => { const t = b.type || 'task'; return t === 'task' || t === 'card'; };
  // папка этого файла: отсюда же card-render.js, work-pdf.js, cards/, fonts/
  const BASE = (() => { const s = document.currentScript; return s && s.src ? s.src.replace(/[^/]*$/, '') : ''; })();
  function script(src, ok) {
    if (ok()) return Promise.resolve();
    return new Promise((res, rej) => {
      const s = document.createElement('script'); s.src = src;
      s.onload = () => ok() ? res() : rej(new Error('не загрузился ' + src));
      s.onerror = () => rej(new Error('не загрузился ' + src));
      document.head.appendChild(s);
    });
  }

  function correctText(t) {
    if (!t) return '';
    if (t.kind === 'fields') return (t.fields || []).map(f => {
      const lbl = plain(f.label);
      const val = String(f.value == null ? '' : f.value) || 'нет корней';
      return (t.fields.length > 1 || (lbl && lbl !== 'Ответ:') ? (lbl ? lbl + ' ' : '') : '') + val + (f.unit ? ' ' + f.unit : '');
    }).join('; ');
    if (t.kind === 'choice') return 'вариант ' + (t.correct + 1);
    if (t.kind === 'multi') return (t.correct || []).map(i => i + 1).join(', ') || 'ни одного';
    return '';
  }

  // страница тренажёра задания: у группы по прототипу — в series, иначе по tid из каталога
  function hrefOf(b) {
    const s = b.series || {};
    if (s.href) return s.href;
    if (b.href) return b.href;
    const T = (window.MathhCatalog && window.MathhCatalog.trainers) || {};
    if (b.tid && T[b.tid] && T[b.tid].href) return T[b.tid].href;
    try {
      // eslint-disable-next-line no-undef
      const groups = typeof TRAINERS_PANEL_GROUPS !== 'undefined' ? TRAINERS_PANEL_GROUPS : [];
      const it = groups.flatMap(g => g.items || []).find(x => x.id === b.tid);
      if (it && it.href) return it.href;
    } catch (e) {}
    return '';
  }
  function specOf(b) {
    if (!window.ExamSpec || !b) return null;
    const href = hrefOf(b);
    if (!href) return null;
    const m = /([^/?#]+)\.html(?:\?([^#]*))?/.exec(href);
    if (!m) return null;
    let n = (b.series && b.series.n != null) ? Number(b.series.n) : null;
    if (n == null && m[2]) { const q = new URLSearchParams(m[2]).get('n'); if (q != null && q !== '') n = Number(q); }
    if (n == null && b.gen && b.gen.n != null) n = Number(b.gen.n);
    return window.ExamSpec.find(m[1], n) || null;
  }
  // балл и тип одного задания. Позиция-диапазон (ОГЭ «№1–5», «№15–18»: одна
  // страница на несколько номеров, у позиции — сумма баллов) — задание одно,
  // значит 1 балл. Балл не подтверждён документом (null) — 1
  function info(b) {
    const sp = specOf(b);
    const range = !!(sp && /\d\s*[–-]\s*\d/.test(sp.label || ''));
    const pts = sp && sp.points > 0 && !range ? sp.points : 1;
    const long = !!(sp && sp.answer === 'long');
    return { spec: sp, points: pts, long, label: sp ? sp.label : '' };
  }

  /* ── официальные бланки ответов (blanks/SOURCES.md) ──
     ЕГЭ-2026: образцы из «Правил заполнения бланков» Рособрнадзора, картинки как
     есть. Математика базовая — без бланка № 2. Экзамены, которых тут нет (ОГЭ),
     получают свой бланк-таблицу: официального образца в открытых документах нет. */
  /* Бланки — объекты (blank-forms.js): вёрстка вектором, клетки — поля ввода.
     ЕГЭ — по образцам ЕГЭ-2026 (blanks/ege2026, SOURCES.md); ОГЭ: бланк № 2 по
     образцу ОГЭ-2024, бланк № 1 — наша таблица (образца ОГЭ № 1 нет: 'table'). */
  const SET_SHORT = [['ege_reg', 'Бланк регистрации'], ['ege_o1', 'Бланк ответов № 1']];
  const SET_FULL = SET_SHORT.concat([['ege_o2l1', 'Бланк ответов № 2, лист 1'], ['ege_o2l2', 'Бланк ответов № 2, лист 2'], ['ege_dop', 'Дополнительный бланк ответов № 2']]);
  const SET_OGE = [['table', 'Бланк ответов № 1 (наш)'], ['oge_o2l1', 'Бланк ответов № 2, лист 1'], ['oge_o2l2', 'Бланк ответов № 2, лист 2']];
  const OFFICIAL = { ege_base: SET_SHORT, ege_prof: SET_FULL, soc_ege: SET_FULL, rus_ege: SET_FULL, oge: SET_OGE };
  // экзамен работы — по большинству заданий (ExamSpec); не определился — null
  function examOf(work) {
    const cnt = {};
    ((work && work.variants) || []).forEach(v => (v.blocks || []).filter(isTask).forEach(b => {
      const sp = specOf(b); if (sp && sp.exam) cnt[sp.exam] = (cnt[sp.exam] || 0) + 1;
    }));
    const k = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0];
    return k || null;
  }
  const officialSet = work => OFFICIAL[examOf(work)] || null;
  // значения клеток бланков живут в браузере (localStorage), по ключу работы
  const stKey = work => 'wp:blank:' + ((work && work.key) || 'work');
  function blankState(work) {
    try { return JSON.parse(localStorage.getItem(stKey(work)) || '{}') || {}; } catch (e) { return {}; }
  }
  function blankSave(work, st) { try { localStorage.setItem(stKey(work), JSON.stringify(st)); } catch (e) {} }
  const formsOf = set => (set || []).filter(x => x[0] !== 'table');

  /* ── разметка листов ── */
  const head = (title, v, many) => '<div class="wp-head"><b>' + esc(title || 'Работа') + (many || v.num > 1 ? ' · Вариант ' + v.num : '') + '</b></div>';
  const who = '<div class="wp-who"><span>Фамилия, имя <i class="wp-line"></i></span><span>Класс <i class="wp-line short"></i></span></div>';
  const imgOf = x => { const im = (x && x.img) || {}; const o = im.light || im.dark; return o && o.url ? o.url : ''; };
  const runT = (title, v, many) => (title || 'Работа') + (many || v.num > 1 ? ' · Вариант ' + v.num : '');

  const mk = html => { const d = document.createElement('div'); d.innerHTML = html; return d.firstElementChild; };
  // ширина снимка на листе: CSS-размер снимка (b.css / hot) с запасом на
  // читаемость; img.style.maxWidth:100% не даст выйти из колонки
  const ZOOM = 1.0;
  function cssW(b) { return (b.hot && b.hot.w) || (b.css && b.css.w) || 441; }
  // Снимок задания — карточка тренажёра: серый фон, поле ответа, «Проверить»,
  // «Источник». В КИМ этого нет, поэтому картинку готовим: режем всё ниже поля
  // ответа (поля внизу) или ниже последнего варианта выбора, поля внутри текста
  // закрашиваем белым, серый фон карточки и тень по краям убираем (светлее 244
  // по всем каналам → белый). Не получилось — исходная картинка.
  async function prepImg(b) {
    const src = imgOf(b);
    if (!src) return '';
    try {
      // crossOrigin: снимки в облаке — чужой адрес; без него холст «грязный» и не читается
      const im = await new Promise((res, rej) => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => res(i); i.onerror = rej; i.src = src; });
      const W = im.naturalWidth, H = im.naturalHeight;
      if (!W || !H) return src;
      const t = b.task || {}, hot = b.hot || null;
      let cutY = H, blanks = [];
      if (hot && t.kind === 'fields' && hot.fields && hot.fields.length) {
        const ymin = Math.min(...hot.fields.map(r => r.y));
        if (ymin >= 0.4) cutY = Math.max(40, Math.round(ymin * H) - Math.round(H * 0.01));
        else blanks = hot.fields;
      } else if (hot && (t.kind === 'choice' || t.kind === 'multi') && hot.opts && hot.opts.length) {
        const yb = Math.max(...hot.opts.map(r => r.y + r.h));
        if (yb < 0.97) cutY = Math.min(H, Math.round(yb * H) + Math.round(H * 0.02));
      }
      const m = Math.max(2, Math.round(W * 0.012));   // тень и скругление карточки по краям
      const cv = document.createElement('canvas');
      cv.width = Math.max(1, W - 2 * m); cv.height = Math.max(1, cutY - 2 * m);
      const cx = cv.getContext('2d', { willReadFrequently: true });
      cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height);
      cx.drawImage(im, m, m, cv.width, cv.height, 0, 0, cv.width, cv.height);
      blanks.forEach(r => { cx.fillStyle = '#fff'; cx.fillRect(r.x * W - m - 2, r.y * H - m - 2, r.w * W + 4, r.h * H + 4); });
      const d = cx.getImageData(0, 0, cv.width, cv.height), px = d.data;
      for (let k = 0; k < px.length; k += 4) if (px[k] >= 244 && px[k + 1] >= 244 && px[k + 2] >= 244) { px[k] = px[k + 1] = px[k + 2] = 255; }
      cx.putImageData(d, 0, 0);
      return cv.toDataURL('image/png');
    } catch (e) { return src; }
  }
  function taskItem(b, i, prepared) {
    const th = b.theory && imgOf(b.theory) ? '<img class="wp-theory" alt="Теория" src="' + esc(imgOf(b.theory)) + '">' : '';
    const src = prepared || imgOf(b);
    const it = mk('<div class="wp-task"><div class="wp-n">' + (i + 1) + '</div><div class="wp-body">' + th
      + (src ? '<img alt="Задание ' + (i + 1) + '" src="' + esc(src) + '">' : '<div class="wp-noimg">' + esc(b.name || 'Задание') + '</div>') + '</div></div>');
    const im = it.querySelector('.wp-body > img:not(.wp-theory)');
    if (im) im.style.width = Math.round(cssW(b) * ZOOM) + 'px';
    return it;
  }
  /* ── карточки ФИПИ (задача 63): блок {type:'card', card:'fipi:…', slug} → cards/<slug>.json ── */
  const CARD_FILES = {};
  const cardBase = () => (window.WorkPrint && window.WorkPrint.cardBase) || (BASE + 'cards/');
  function cardFile(slug) {
    const u = cardBase() + slug + '.json';
    // slug страницы, разбитой на части (cards/index.json): блок до разбиения собираем из всех частей
    const pages = () => fetch(cardBase() + 'index.json').then(r => r.ok ? r.json() : null).then(ix => {
      const parts = ix && ix.pages && ix.pages[slug];
      return parts ? Promise.all(parts.map(p => fetch(cardBase() + p.slug + '.json').then(r => r.json())))
        .then(ds => ({ cards: [].concat(...ds.map(d => d.cards)) })) : null;
    });
    if (!CARD_FILES[u]) CARD_FILES[u] = fetch(u).then(r => r.ok ? r.json() : pages().then(d => { if (!d) throw new Error('HTTP ' + r.status); return d; }))
      .catch(e => { delete CARD_FILES[u]; console.warn('[печать] нет файла карточек', u, e); return null; });
    return CARD_FILES[u];
  }
  // блок → карточка; не нашлась — блока в Map нет (печатается заглушкой с названием)
  async function cardsOf(blocks) {
    const out = new Map();
    const cb = blocks.filter(b => b.type === 'card' && b.slug && b.card);
    if (!cb.length) return out;
    await script(BASE + 'card-render.js', () => !!window.CardRender);
    const files = {};
    await Promise.all([...new Set(cb.map(b => b.slug))].map(async sl => { files[sl] = await cardFile(sl); }));
    cb.forEach(b => { const f = files[b.slug]; const c = f && (f.cards || []).find(x => x.id === b.card); if (c) out.set(b, c); });
    try { await window.CardRender.ready([...out.values()], { root: BASE }); }
    catch (e) { console.warn('[печать] KaTeX не загрузился — формулы останутся TeX', e); }
    return out;
  }
  // рисунки карточки: maxw — ширина на экране тренажёра при шрифте 18 px; на листе шрифт
  // 14 px, рисунок уменьшаем в той же доле, чтобы подписи на нём были соразмерны тексту
  const FIGK = 14 / 18;
  function cardItem(b, i, card) {
    const it = mk('<div class="wp-task wp-card"><div class="wp-n">' + (i + 1) + '</div><div class="wp-body"></div></div>');
    const body = it.querySelector('.wp-body');
    if (!card) {
      body.appendChild(mk('<div class="wp-noimg">' + esc(b.name || 'Задание') + ' — условие не загрузилось (карточка ' + esc(b.card || '?') + ')</div>'));
      return it;
    }
    const el = window.CardRender.render(card, { base: cardBase(), print: true });
    el.querySelectorAll('.cr-fig').forEach(f => { const w = parseFloat(f.style.maxWidth); if (w) f.style.maxWidth = Math.round(w * FIGK) + 'px'; });
    body.appendChild(el);
    return it;
  }
  function blankItems(v) {
    const list = (v.blocks || []).filter(isTask);
    const cells = '<span class="wp-cells">' + '<i></i>'.repeat(14) + '</span>';
    return list.map((b, i) => mk('<div class="wp-brow"><span class="n">' + (i + 1) + '</span><span class="c">'
      + (info(b).long ? '<span class="wp-long">решение на отдельном листе</span>' : cells) + '</span></div>'));
  }
  function keyItem(v) {
    const list = (v.blocks || []).filter(isTask);
    let sum = 0;
    const rows = list.map((b, i) => {
      const f = info(b); sum += f.points;
      const a = correctText(b.task);
      return '<tr><td class="n">' + (i + 1) + '</td><td class="a">' + esc(a || '—') + '</td><td class="p">' + f.points + '</td></tr>';
    }).join('');
    return mk('<table class="wp-kt"><caption>Вариант ' + v.num + '</caption><thead><tr><th>№</th><th>Ответ</th><th>Балл</th></tr></thead><tbody>'
      + rows + '</tbody><tfoot><tr><td></td><td>Всего</td><td class="p">' + sum + '</td></tr></tfoot></table>');
  }
  function mkSheet(sec, orient, first) {
    const cols = orient === 'landscape' ? 2 : 1;
    return mk('<section class="wp-sheet wp-page ' + (orient === 'landscape' ? 'l' : 'p') + ' ' + sec.cls + '">'
      + (first ? sec.head : '<div class="wp-run">' + esc(sec.run) + '</div>')
      + '<div class="wp-cols">' + '<div class="wp-col"></div>'.repeat(cols) + '</div><div class="wp-foot"></div></section>');
  }
  const over = c => c.scrollHeight > c.clientHeight + 1;
  /* Разрез длинного задания между колонками. Куски — «атомы»: абзац, строка
     формулы, рисунок, таблица, вариант ответа; строки одного абзаца не делим.
     Атом, который не влез, и всё после него переносятся (не копируются) в
     хвост — новый кусок задания без номера в следующей колонке. */
  const ATOM = 'p, table, img, li, .cr-fig, .cr-opt, .c-eq, .c-line, .katex-display, .wp-noimg';
  const isInline = n => n.nodeType === 3 ? /\S/.test(n.data) : (n.nodeType === 1 && /^inline/.test(getComputedStyle(n).display) && getComputedStyle(n).display !== 'none');
  function atoms(el, out) {
    const kids = [...el.childNodes];
    const blocks = kids.filter(n => n.nodeType === 1 && !isInline(n) && getComputedStyle(n).display !== 'none');
    if (!blocks.length) return;
    // текст вперемешку с блоками: строчные куски — в обёртку-блок (браузер и так
    // кладёт их в безымянный блок, вёрстка та же), чтобы и их можно было перенести
    let run = [];
    const flush = () => {
      if (run.some(n => n.nodeType === 1 || /\S/.test(n.data))) {
        const w = document.createElement('span'); w.className = 'wp-inl';
        run[0].parentNode.insertBefore(w, run[0]); run.forEach(n => w.appendChild(n));
      }
      run = [];
    };
    kids.forEach(n => { if (n.nodeType === 3 || isInline(n) || (n.nodeType === 1 && n.tagName === 'BR')) run.push(n); else flush(); });
    flush();
    for (const ch of el.children) {
      if (getComputedStyle(ch).display === 'none') continue;
      const deep = ch.matches(ATOM) || ch.classList.contains('wp-inl') ? false : [...ch.children].some(k => !isInline(k));
      if (deep) atoms(ch, out); else out.push(ch);
    }
  }
  function cutBefore(root, node) {
    let el = node, carry = null;
    while (el !== root) {
      const p = el.parentNode, pc = p.cloneNode(false);
      let sib = el.nextSibling;
      pc.appendChild(carry || el);
      while (sib) { const nx = sib.nextSibling; pc.appendChild(sib); sib = nx; }
      carry = pc; el = p;
    }
    return carry;
  }
  // minHead — сколько задания (px) должно остаться в колонке: огрызок в одну строку
  // внизу листа хуже, чем перенос задания целиком
  function splitItem(it, col, minHead) {
    const body = it.querySelector('.wp-body');
    if (!body) return null;
    const limit = col.getBoundingClientRect().bottom;
    const list = []; atoms(body, list);
    const idx = list.findIndex(a => a.getBoundingClientRect().bottom > limit + 0.5);
    if (idx <= 0) return null;          // первый же кусок не влезает — резать нечего
    if (minHead && list[idx].getBoundingClientRect().top - it.getBoundingClientRect().top < minHead) return null;
    const tail = cutBefore(it, list[idx]);
    tail.classList.add('wp-cont');
    tail.insertBefore(mk('<div class="wp-n wp-ncont" aria-hidden="true"></div>'), tail.firstChild);
    return tail;
  }
  function flowSection(root, sec, orient) {
    let sheet, cols, ci;
    const open = first => { sheet = mkSheet(sec, orient, first); root.appendChild(sheet); cols = [...sheet.querySelectorAll('.wp-col')]; ci = 0; };
    const advance = () => { if (ci + 1 < cols.length) ci++; else open(false); };
    open(true);
    sec.items.forEach(first => {
      let it = first;
      while (it) {
        cols[ci].appendChild(it);
        if (over(cols[ci]) && cols[ci].children.length > 1) {
          // в начатой колонке не влезло: длинное задание (больше половины колонки) режем
          // здесь же, короткое переносим целиком — как в КИМ
          const tall = it.offsetHeight > cols[ci].clientHeight / 2;
          const tail = tall ? splitItem(it, cols[ci], cols[ci].clientHeight / 4) : null;
          if (tail) { advance(); it = tail; continue; }
          advance(); cols[ci].appendChild(it);
        }
        if (over(cols[ci])) {
          const tail = splitItem(it, cols[ci]);
          if (tail) { advance(); it = tail; continue; }
          // один кусок не влезает в целую колонку — уменьшаем картинки до её высоты
          const mh = Math.max(80, cols[ci].clientHeight - 24) + 'px';
          it.querySelectorAll('img').forEach(im => { im.style.width = 'auto'; im.style.maxHeight = mh; });
        }
        it = null;
      }
    });
  }
  function ensureRoot() {
    ensureStyle();
    let root = document.getElementById('wpPrint');
    if (!root) { root = document.createElement('div'); root.id = 'wpPrint'; document.body.appendChild(root); }
    return root;
  }
  function setPage(orient) {
    let st = document.getElementById('wpPage');
    if (!st) { st = document.createElement('style'); st.id = 'wpPage'; document.head.appendChild(st); }
    st.textContent = '@page{size:A4 ' + (orient === 'landscape' ? 'landscape' : 'portrait') + ';margin:0}@page wpo{size:A4 portrait;margin:0}';
  }
  const loadImg = src => new Promise(r => { const i = new Image(); i.onload = i.onerror = r; i.src = src; });

  // what: { tasks, blank, key }; orient: 'portrait' | 'landscape'. Собирает листы
  // в #wpPrint (в режиме замера — вне экрана) и возвращает их список
  async function build(work, what, orient) {
    orient = orient === 'landscape' ? 'landscape' : 'portrait';
    const root = ensureRoot();
    setPage(orient);
    root.innerHTML = ''; root.className = 'wp-measure';
    const vs = (work.variants || []).filter(v => (v.blocks || []).some(isTask));
    const many = vs.length > 1;
    const secs = [];
    const prep = new Map();
    const all = vs.flatMap(v => (v.blocks || []).filter(isTask));
    if (what.tasks) await Promise.all(all.filter(b => b.type !== 'card').map(async b => { prep.set(b, await prepImg(b)); }));
    const cards = what.tasks ? await cardsOf(all) : new Map();
    if (what.tasks) vs.forEach(v => secs.push({ cls: 'wp-tasks', head: head(work.title, v, many) + who, run: runT(work.title, v, many),
      items: (v.blocks || []).filter(isTask).map((b, i) => b.type === 'card' ? cardItem(b, i, cards.get(b)) : taskItem(b, i, prep.get(b))) }));
    const off = what.blank ? officialSet(work) : null;
    if (what.blank && (!off || off.some(x => x[0] === 'table'))) vs.forEach(v => secs.push({ cls: 'wp-blank', head: head(work.title, v, many) + '<div class="wp-sub">Бланк ответов</div>' + who,
      run: runT(work.title, v, many) + ' · бланк ответов', items: blankItems(v) }));
    if (what.key) secs.push({ cls: 'wp-key', head: '<div class="wp-head"><b>' + esc(work.title || 'Работа') + ' · ключ для учителя</b></div>',
      run: (work.title || 'Работа') + ' · ключ', items: vs.map(keyItem) });
    // картинки грузим до вёрстки: высоты нужны сразу
    await Promise.all([].concat(...secs.map(sc => sc.items.map(it => [...it.querySelectorAll('img')])), []).flat().map(im => loadImg(im.src)));
    // шрифты (Onest нужного веса, KaTeX, 'WP Sym') браузер грузит, только когда свёрстан
    // текст с ними: ставим всё во временный лист и ждём, иначе высоты замерятся по запасному шрифту
    if (cards.size) {
      const stage = mkSheet({ cls: 'wp-stage', head: '', run: '' }, orient, true);
      root.appendChild(stage);
      secs.forEach(sc => sc.items.forEach(it => stage.querySelector('.wp-col').appendChild(it)));
      void stage.offsetHeight;
      if (document.fonts) {
        await Promise.all(['400', '700'].map(w => document.fonts.load(w + ' 14px Onest', 'Аа Aa 1').catch(() => {}))
          .concat([document.fonts.load('14px "WP Sym"', '∠√').catch(() => {})]));
        await document.fonts.ready;
      }
      stage.remove();
    }
    secs.forEach(sc => flowSection(root, sc, orient));
    // «Страница i из N» — только у наших листов; официальные бланки без правок
    const own = [...root.querySelectorAll('.wp-sheet')];
    own.forEach((sh, i) => { sh.querySelector('.wp-foot').textContent = 'Страница ' + (i + 1) + ' из ' + own.length; });
    // бланки-объекты — после заданий (по набору на вариант), всегда книжные, как оригинал; значения полей — из черновика бланка
    if (off && window.BlankForms) {
      const st = blankState(work);
      vs.forEach(() => formsOf(off).forEach(([k]) => {
        const sec = mk('<section class="wp-sheet wp-page wp-off wp-blank" data-form="' + k + '"></section>');
        sec.appendChild(window.BlankForms.create(k, st, { readonly: true }));
        root.appendChild(sec);
      }));
    }
    return [...root.querySelectorAll('.wp-sheet')];
  }
  // совместимость: разметка листов строкой (тесты, отладка)
  async function render(work, what, orient) { await build(work, what, orient); return document.getElementById('wpPrint').innerHTML; }

  const CSS = `
#wpPrint{display:none}
#wpPrint.wp-measure{display:block;position:fixed;left:-99999px;top:0;pointer-events:none}
.wp-sheet{box-sizing:border-box;position:relative;background:#fff;color:#000;overflow:hidden;display:flex;flex-direction:column;font:13px/1.35 'Onest','WP Sym',Arial,sans-serif}
.wp-sheet.p{width:210mm;height:296.4mm;padding:14mm 15mm 10mm}
.wp-sheet.l{width:297mm;height:209.4mm;padding:11mm 13mm 8mm}
.wp-sheet.wp-off{width:210mm;height:296.4mm;padding:0;page:wpo}
.wp-cols{flex:1;min-height:0;display:flex;gap:9mm}
.wp-col{flex:1;min-width:0;overflow:hidden}
.wp-sheet.l .wp-col + .wp-col{border-left:.6px solid #777;padding-left:9mm}
.wp-run{font-size:10.5px;color:#333;border-bottom:.6px solid #777;padding-bottom:1.5mm;margin-bottom:4mm}
.wp-foot{text-align:center;font-size:10.5px;color:#333;padding-top:2mm;flex:none}
.wp-head{font-size:17px;margin-bottom:2mm;border:1.2px solid #000;padding:3mm 4mm;text-align:center}
.wp-sub{font-weight:700;margin:2mm 0}
.wp-who{display:flex;gap:24px;margin:3mm 0 5mm}
.wp-line{display:inline-block;width:230px;border-bottom:1px solid #000;height:14px;vertical-align:bottom}
.wp-line.short{width:60px}
.wp-task{display:flex;gap:8px;margin:0 0 5mm}
.wp-n{flex:none;width:26px;height:26px;border:1.5px solid #000;border-radius:50%;text-align:center;line-height:23px;font-weight:700}
.wp-body{flex:1;min-width:0}
.wp-body img{display:block;max-width:100%}
.wp-body .cr{--card-size:14px;--card-font:'Onest','WP Sym',sans-serif;--card-ink:#000;--card-line:#888}
.wp-card .wp-n{margin-top:-1px}
.wp-task.wp-cont{margin-top:0}
.wp-n.wp-ncont{visibility:hidden}
.wp-inl{display:block}
.wp-theory{margin-bottom:6px}
.wp-brow{display:flex;gap:8px;align-items:center;border:1px solid #000;margin:-1px 0 0;padding:4px 8px;min-height:28px}
.wp-brow .n{width:26px;text-align:center;font-weight:700}
.wp-cells{display:inline-flex}
.wp-cells i{display:inline-block;width:18px;height:22px;border:1px solid #000;margin-left:-1px}
.wp-long{font-style:italic}
.wp-kt{border-collapse:collapse;margin:0 0 6mm;font-size:12px}
.wp-kt caption{font-weight:700;text-align:left;padding-bottom:2px}
.wp-kt th, .wp-kt td{border:1px solid #000;padding:2px 6px}
.wp-kt td.n, .wp-kt td.p{text-align:center}
.wp-fill{position:fixed;inset:0;z-index:600;background:var(--bg,#f2f3f5);color:var(--pencil,#1D1D1F);overflow:auto;padding:0 0 40px}
.wp-fill .bar{position:sticky;top:0;z-index:2;display:flex;gap:8px;align-items:center;padding:10px 14px;background:var(--bg,#fff);border-bottom:1px solid rgba(128,128,128,.3)}
.wp-fill .bar .sp{flex:1}
.wp-fill .note{padding:8px 14px;font-size:13px;color:var(--muted-2,#6E6E73)}
.wp-fill .sheets{display:flex;flex-direction:column;align-items:center;gap:6px}
.wp-fill .sh{width:100%;display:flex;flex-direction:column;align-items:center}
.wp-fill .cap{font-size:13px;color:var(--muted-2,#6E6E73);margin:10px 0 2px}
.wp-fill .fit{transform-origin:top center;width:210mm;box-shadow:0 2px 14px rgba(0,0,0,.18)}
.wp-dlg{position:fixed;inset:0;z-index:500;background:rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;padding:16px}
.wp-dlg .box{background:var(--bg,#fff);color:var(--pencil,#1D1D1F);border-radius:16px;padding:20px 22px;max-width:400px;width:100%;box-shadow:0 10px 40px rgba(0,0,0,.25)}
.wp-dlg h3{margin:0 0 12px;font-size:18px}
.wp-dlg label{display:flex;gap:10px;align-items:flex-start;margin:10px 0;font-size:15px;line-height:1.3;cursor:pointer}
.wp-dlg label small{display:block;color:var(--muted-2,#6E6E73);font-size:12.5px}
.wp-dlg .ori{display:flex;gap:14px;margin:6px 0 2px;font-size:14px}
.wp-dlg .ori label{margin:0;align-items:center}
.wp-dlg .row{display:flex;gap:8px;justify-content:flex-end;margin-top:16px;flex-wrap:wrap}
.wp-dlg .note{color:var(--warn,#B25000);font-size:13px;min-height:16px}
@media print{
  body.wp-on > *:not(#wpPrint){display:none !important}
  body.wp-on{background:#fff !important;padding:0 !important;margin:0 !important}
  body.wp-on #wpPrint{display:block;color:#000}
  #wpPrint .wp-sheet{break-after:page;page-break-after:always;margin:0}
  #wpPrint .wp-sheet:last-child{break-after:auto;page-break-after:auto}
}`;
  // символы, которых нет в Onest (∠ √ ∞ ⇒ ∥ ⩽ π α): один шрифт и в вёрстке листа, и в PDF
  const FONTS_CSS = ['400', '700'].map(w => "@font-face{font-family:'WP Sym';font-style:normal;font-weight:" + w
    + ";src:url(" + BASE + 'fonts/print/print-sym-' + w + ".ttf) format('truetype')}").join('\n');
  function ensureStyle() {
    if (document.getElementById('wpStyle')) return;
    const st = document.createElement('style'); st.id = 'wpStyle'; st.textContent = FONTS_CSS + '\n' + CSS;
    document.head.appendChild(st);
  }
  async function print(work, what, orient) {
    const root = ensureRoot();
    await build(work, what, orient);
    root.className = '';
    document.body.classList.add('wp-on');
    // класс снимаем после печати: иначе Ctrl+P позже напечатает этот же лист
    const off = () => { document.body.classList.remove('wp-on'); window.removeEventListener('afterprint', off); };
    window.addEventListener('afterprint', off);
    window.print();
  }
  const safeName = s => String(s || 'Работа').replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80) || 'Работа';
  function saveBytes(bytes, name) {
    const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
    const a = document.createElement('a');
    a.href = url; a.download = name; a.rel = 'noopener'; a.style.display = 'none';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
  // библиотеки векторного PDF — заранее, пока открыто окно печати
  function preloadPdf() {
    return script(BASE + 'work-pdf.js', () => !!window.WorkPDF).then(() => window.WorkPDF.libs());
  }
  // PDF-файл: каждый лист — страница А4 нужной ориентации. Вектором (work-pdf.js);
  // не вышло — прежним путём, картинками (html2canvas + jsPDF), чтобы файл всё равно был.
  // Как собран последний PDF — WorkPrint.lastPdf (для тестов и разбора жалоб)
  async function download(work, what, orient) {
    orient = orient === 'landscape' ? 'landscape' : 'portrait';
    const L = window.MathhLibs;
    const sheets = await build(work, what, orient);
    const root = document.getElementById('wpPrint');
    const vs = (work.variants || []).filter(v => (v.blocks || []).some(isTask));
    const name = safeName(work.title) + (vs.length > 1 ? '' : (vs[0] && vs[0].num > 1 ? ' — вариант ' + vs[0].num : '')) + '.pdf';
    const shot = async sh => { const h2c = await L.load('html2canvas'); return h2c(sh, { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false }); };
    try {
      let vecErr = null;
      try {
        await preloadPdf();
        const out = await window.WorkPDF.make(sheets, { title: work.title || 'Работа', rasterize: shot });
        saveBytes(out.bytes, name);
        WorkPrint.lastPdf = { mode: 'vector', pages: out.pages, sheets: sheets.length, missing: out.missing, images: out.images, size: out.bytes.length };
        if (out.missing.length) console.warn('[печать] в PDF нет шрифта для символов:', out.missing.join(' '));
        return sheets.length;
      } catch (e) { vecErr = e; console.error('[печать] векторный PDF не собрался — собираю картинками', e); }
      if (!L) throw new Error('нет lazy-libs.js');
      const [h2c, lib] = await Promise.all([L.load('html2canvas'), L.load('jspdf')]);
      const ori = sh => sh.classList.contains('wp-off') ? 'portrait' : orient;
      const doc = new lib.jsPDF({ orientation: ori(sheets[0]), unit: 'mm', format: 'a4', compress: true });
      for (let i = 0; i < sheets.length; i++) {
        const o = ori(sheets[i]);
        const W = o === 'landscape' ? 297 : 210, H = o === 'landscape' ? 210 : 297;
        const cv = await h2c(sheets[i], { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false });
        if (i) doc.addPage('a4', o);
        doc.addImage(cv.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, W, H, undefined, 'FAST');
      }
      doc.save(name);
      WorkPrint.lastPdf = { mode: 'raster', pages: sheets.length, sheets: sheets.length, error: String((vecErr && vecErr.message) || vecErr) };
      return sheets.length;
    } finally { root.innerHTML = ''; root.className = ''; }
  }
  // Экран заполнения: листы бланков на странице, клетки вводятся и сохраняются
  // сами (localStorage); отсюда же — печать и PDF с вписанным
  function fill(work, orient) {
    ensureStyle();
    const set = officialSet(work), BF = window.BlankForms;
    if (!set || !BF) return null;
    BF.ensureCss();
    const old = document.getElementById('wpFillBox'); if (old) old.remove();
    const st = blankState(work);
    const d = document.createElement('div'); d.id = 'wpFillBox'; d.className = 'wp-fill';
    d.innerHTML = '<div class="bar"><b>Бланки ответов</b><span class="sp"></span>'
      + '<button class="btn quiet" id="wfClear">Очистить</button><button class="btn quiet" id="wfPdf">Скачать PDF</button><button class="btn" id="wfPrint">Печатать</button><button class="btn quiet" id="wfClose" aria-label="Закрыть">✕</button></div>'
      + '<div class="note">Клетки заполняются заглавными буквами, цифрами, запятой и минусом; курсор переходит сам. Значения сохраняются в этом браузере.</div><div class="sheets"></div>';
    const box = d.querySelector('.sheets');
    formsOf(set).forEach(([k, label]) => {
      const wrap = document.createElement('div'); wrap.className = 'sh'; wrap.dataset.form = k;
      wrap.innerHTML = '<div class="cap">' + esc(label) + '</div>';
      const inner = document.createElement('div'); inner.className = 'fit';
      inner.appendChild(BF.create(k, st, { onChange: () => blankSave(work, st) }));
      wrap.appendChild(inner); box.appendChild(wrap);
    });
    document.body.appendChild(d);
    const fit = () => { const k = Math.min(1, (d.clientWidth - 24) / 794); d.querySelectorAll('.fit').forEach(f => { f.style.transform = 'scale(' + k + ')'; f.parentNode.style.height = (f.firstChild.offsetHeight * k + 28) + 'px'; }); };
    fit(); window.addEventListener('resize', fit);
    const close = () => { window.removeEventListener('resize', fit); d.remove(); };
    d.querySelector('#wfClose').addEventListener('click', close);
    d.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    d.querySelector('#wfClear').addEventListener('click', () => {
      Object.keys(st).forEach(k => delete st[k]); blankSave(work, st);
      d.querySelectorAll('.sheets input').forEach(i => { i.value = ''; });
    });
    d.querySelector('#wfPrint').addEventListener('click', () => { print(work, { blank: true }, orient); });
    d.querySelector('#wfPdf').addEventListener('click', async () => {
      const b = d.querySelector('#wfPdf'); b.disabled = true; b.textContent = 'Готовлю PDF…';
      try { await download(work, { blank: true }, orient); } catch (e) { console.error(e); } finally { b.disabled = false; b.textContent = 'Скачать PDF'; }
    });
    const first = d.querySelector('input'); if (first) first.focus();
    return d;
  }
  const LS_OR = 'wp:orient';
  const lsGet = () => { try { return localStorage.getItem(LS_OR) === 'landscape' ? 'landscape' : 'portrait'; } catch (e) { return 'portrait'; } };
  const lsSet = v => { try { localStorage.setItem(LS_OR, v); } catch (e) {} };
  // окно «что печатать»; getWork() — свежая работа на момент нажатия.
  // opts.student — без ключа с ответами
  function ask(getWork, opts) {
    opts = opts || {};
    ensureStyle();
    preloadPdf().catch(() => {});
    if (window.MathhLibs) window.MathhLibs.load('html2canvas').catch(() => {});   // бланки-объекты в PDF — картинкой
    const old = document.querySelector('.wp-dlg'); if (old) old.remove();
    const d = document.createElement('div'); d.className = 'wp-dlg'; d.id = 'wpDlg';
    const cur = lsGet();
    d.innerHTML = '<div class="box" role="dialog" aria-modal="true" aria-labelledby="wpDlgH"><h3 id="wpDlgH">Печать и PDF</h3>'
      + '<label><input type="checkbox" id="wpTasks" checked><span>Задания<small>как в экзаменационной работе: шапка, нумерация, номера страниц</small></span></label>'
      + '<label><input type="checkbox" id="wpBlank"><span>Бланк ответов<small id="wpBlankNote">клетки для ответа; у развёрнутых — «решение на отдельном листе»</small></span></label>'
      + (opts.student ? '' : '<label><input type="checkbox" id="wpKey"><span>Ключ для учителя<small>все варианты: № → ответ → балл</small></span></label>')
      + '<div class="ori" role="radiogroup" aria-label="Ориентация листа">'
      + '<label><input type="radio" name="wpOri" value="portrait"' + (cur === 'portrait' ? ' checked' : '') + '>Книжная</label>'
      + '<label><input type="radio" name="wpOri" value="landscape"' + (cur === 'landscape' ? ' checked' : '') + '>Альбомная</label></div>'
      + '<div class="note" id="wpNote"></div>'
      + '<div class="row"><button class="btn quiet" id="wpCancel">Отмена</button><button class="btn quiet" id="wpFill" hidden>✎ Заполнить бланк</button><button class="btn quiet" id="wpPdf">Скачать PDF</button><button class="btn" id="wpGo">Печатать</button></div></div>';
    document.body.appendChild(d);
    // подпись у бланка: какой именно выдастся (по заданиям работы)
    try {
      const w0 = getWork();
      if (w0 && typeof w0 !== 'string') {
        const set = officialSet(w0);
        d.querySelector('#wpBlankNote').textContent = set
          ? (set[0][0].indexOf('ege_') === 0 ? 'копия бланков ЕГЭ-2026 (Рособрнадзор), клетки можно заполнить на экране: ' : 'бланк № 2 по образцу ОГЭ, бланк № 1 — наш (официального образца нет): ')
            + set.map(x => x[1].toLowerCase()).join(', ')
          : 'официального образца для этого экзамена пока нет — наш бланк: клетки для ответа';
        if (formsOf(set).length) d.querySelector('#wpFill').hidden = false;
      }
    } catch (e) {}
    const close = () => d.remove();
    d.addEventListener('click', e => { if (e.target === d) close(); });
    d.querySelector('#wpCancel').addEventListener('click', close);
    d.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    const collectOrient = () => d.querySelector('input[name="wpOri"]:checked').value;
    const collect = () => {
      const q = id => d.querySelector(id);
      const what = { tasks: q('#wpTasks').checked, blank: q('#wpBlank').checked, key: !!(q('#wpKey') && q('#wpKey').checked) };
      if (!what.tasks && !what.blank && !what.key) { q('#wpNote').textContent = 'Отметьте, что печатать'; return null; }
      const w = getWork();
      if (typeof w === 'string') { q('#wpNote').textContent = w; return null; }
      const orient = d.querySelector('input[name="wpOri"]:checked').value;
      lsSet(orient);
      return { w, what, orient };
    };
    d.querySelector('#wpFill').addEventListener('click', () => {
      const w = getWork(); if (typeof w === 'string') { d.querySelector('#wpNote').textContent = w; return; }
      fill(w, collectOrient());
    });
    d.querySelector('#wpGo').addEventListener('click', () => {
      const c = collect(); if (!c) return;
      close(); print(c.w, c.what, c.orient);
    });
    d.querySelector('#wpPdf').addEventListener('click', async () => {
      const c = collect(); if (!c) return;
      const b = d.querySelector('#wpPdf'); b.disabled = true; b.textContent = 'Готовлю PDF…';
      try { await download(c.w, c.what, c.orient); close(); }
      catch (e) { console.error('[печать] PDF не собрался', e); d.querySelector('#wpNote').textContent = 'PDF не собрался: ' + (e.message || e); b.disabled = false; b.textContent = 'Скачать PDF'; }
    });
    d.querySelector('#wpGo').focus();
    return d;
  }

  const WorkPrint = { correctText, info, specOf, examOf, officialSet, build, render, print, download, ask, fill, blankState, isTask, lastPdf: null, cardBase: null };
  window.WorkPrint = WorkPrint;
})();
