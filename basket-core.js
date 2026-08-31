/* ==========================================================
   Basket — общая подборка заданий для домашних/классных листов.
   Подключается на всех страницах тренажёров и на index.html через
   <script src="basket-core.js"></script>. Хранится в localStorage,
   поэтому подборка сквозная — задания, добавленные на разных
   страницах, оказываются в одном списке.

   Это первая, простая версия: сохраняется не «чистая структура»
   задания, а упрощённый чёрно-белый снимок того, что видно на
   экране на момент нажатия кнопки — без цветов/фона, чтобы дёшево
   печаталось. Пересборка по seed, ответы и PDF — сознательно не в
   этой версии, обсудим отдельно.

   Снимок строится обходом ЖИВОГО DOM (не клона) — это позволяет
   надёжно отличать реально видимый текст от скрытых (display:none)
   подсказок/кнопок, которые иначе просочились бы в текст через
   textContent. Дроби (в т.ч. вложенные, «многоэтажные») превращаются
   в собственную безопасную HTML-разметку — вертикальную, как в
   тетради, а не в мелкий надстрочный/подстрочный юникод. Списки
   вариантов ответа (тесты, утверждения) оформляются отдельным
   пронумерованным списком, а не сплошным текстом.
   ========================================================== */
(function(){
  const KEY = 'ogeBasket:v1';

  function all(){
    try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : []; }
    catch(e){ return []; }
  }
  function save(items){
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch(e){}
  }
  function add(item){
    const items = all();
    const full = Object.assign({
      id: Date.now() + '_' + Math.random().toString(36).slice(2, 8),
      addedAt: Date.now(),
    }, item);
    items.push(full);
    save(items);
    return full;
  }
  function remove(id){
    save(all().filter(x => x.id !== id));
  }
  function clear(){
    save([]);
  }
  function count(){
    return all().length;
  }

  // '.vfrac'/'.vnum'/'.vden' — отдельные имена классов у «вертикальной
  // дроби» в oge7.html/oge10.html (fracStr()); без этого алиаса такая
  // дробь не распознавалась как дробь вообще, и числитель со знаменателем
  // склеивались в одну строку без разделителя (напр. «104» + «16» → «10416»)
  const FRAC_SELECTORS = ['.frac', '.fraction', '.vfrac'];
  const NUM_SELECTORS = ['.n', '.num', '.fnum', '.vnum'];
  const DEN_SELECTORS = ['.d', '.den', '.fden', '.vden'];
  // элементы управления — вырезаются целиком, независимо от видимости
  const STRIP_SELECTORS = ['button', 'input', 'select', 'textarea', '.corner', '.medal-badge-row'];
  // визуальные виджеты-графики (диаграммы, canvas) — их внутренности не
  // текст, читать их как строку бессмысленно (даёт «мусорные» цифры).
  // Числовая прямая (numline) сюда НЕ входит — она обрабатывается отдельно
  // ниже, потому что часто это и есть суть задания («точка A на прямой»),
  // а не просто оформление.
  const GRAPHIC_STRIP_SELECTORS = ['svg', 'canvas', '.tree-diagram', '.euler-diagram'];
  // хосты числовой прямой — перерисовываются в собственный безопасный
  // мини-виджет (линия + засечки + точка), а не выбрасываются
  const NUMLINE_SELECTORS = ['#questionNumlineHost', '.numline-wrap'];
  // контейнеры вариантов ответа — рендерим отдельным пронумерованным
  // списком «1) … 2) … », а не сплошным текстом вперемешку с подписями
  // inline:true — короткие варианты ответа (числа/дроби) выстраиваются в
  // один ряд, как в самом задании на экзамене; .stmt-list — это уже более
  // длинные утверждения (верно/неверно), их удобнее читать по одному в строке
  const OPTION_LIST_CONTAINERS = [
    { container: '.mcq-options', item: '.mcq-btn', skipLabel: '.mlabel', inline: true },
    { container: '.stmt-list',   item: '.stmt',    skipLabel: '.slabel' }
  ];

  function firstMatch(el, selectors){
    for (const sel of selectors){ const m = el.querySelector(sel); if (m) return m; }
    return null;
  }
  function matchesAny(el, selectors){
    return !!(el.matches && selectors.some(sel => { try { return el.matches(sel); } catch(e){ return false; } }));
  }
  function isHidden(el){
    if (el.offsetParent === null) {
      const cs = window.getComputedStyle(el);
      if (cs.position !== 'fixed') return true;
    }
    const cs = window.getComputedStyle(el);
    return cs.visibility === 'hidden' || cs.display === 'none';
  }
  function escapeHtml(s){
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function walkChildren(el){
    let text = '', html = '';
    for (const child of Array.from(el.childNodes)){
      const r = walk(child);
      text += r.text;
      html += r.html;
    }
    return { text, html };
  }

  // строит вертикальную дробь: юникодный текст (в скобках, если знаменатель
  // сам составной) + безопасный HTML-виджет (число над числом, черта между).
  // numRes/denRes уже могут содержать вложенные дроби — так «многоэтажные»
  // дроби разворачиваются рекурсивно, снизу вверх.
  function fracFromParts(numRes, denRes){
    const denNeedsParens = denRes.text.length > 1 && /[^0-9]/.test(denRes.text);
    const denText = denNeedsParens ? '(' + denRes.text + ')' : denRes.text;
    return {
      text: numRes.text + '⁄' + denText,
      html: '<span class="basket-frac"><span class="bf-n">' + numRes.html +
        '</span><span class="bf-bar"></span><span class="bf-d">' + denRes.html + '</span></span>'
    };
  }

  // перестраивает числовую прямую в собственный безопасный виджет: берёт
  // только числовые координаты (left:%) и подписи засечек/точек — то есть
  // ту же информацию, что и так видна на экране, но без риска утащить
  // случайный текст из внутренней разметки виджета
  function numlineNumbers(el){
    const ticks = Array.from(el.querySelectorAll('.nl-tick')).map(t => ({
      pct: parseFloat(t.style.left) || 0,
      label: ((t.querySelector('.nl-ticklabel') || {}).textContent || '').trim()
    }));
    const points = Array.from(el.querySelectorAll('.nl-point')).map(p => ({
      pct: parseFloat(p.style.left) || 0,
      label: ((p.querySelector('.nl-plabel') || {}).textContent || '').trim()
    }));
    return { ticks, points };
  }
  function buildNumlineHtml(ticks, points){
    let html = '<span class="basket-numline">';
    html += '<span class="bnl-line"></span>';
    ticks.forEach(t => {
      html += '<span class="bnl-tick" style="left:' + t.pct + '%"><span class="bnl-tickmark"></span><span class="bnl-ticklabel">' + escapeHtml(t.label) + '</span></span>';
    });
    points.forEach(p => {
      html += '<span class="bnl-point" style="left:' + p.pct + '%"><span class="bnl-plabel">' + escapeHtml(p.label) + '</span><span class="bnl-dot"></span></span>';
    });
    html += '</span>';
    return html;
  }
  function numlineText(ticks, points){
    const sortedTicks = ticks.slice().sort((a, b) => a.pct - b.pct).map(t => t.label).filter(Boolean);
    const tickPart = sortedTicks.join(' и ');
    if (!points.length) return tickPart ? '(числовая прямая: ' + tickPart + ')' : '';
    const pointPart = points.map(p => 'точка ' + p.label).join(', ');
    return tickPart ? '(' + pointPart + ' между ' + tickPart + ')' : '(' + pointPart + ' на числовой прямой)';
  }

  // таблица — перестраивается в собственную безопасную <table>, а не
  // расплющивается в бессвязную строку цифр; ячейки разрешаются рекурсивно
  // (той же walkChildren), так что дроби и т.п. внутри ячеек тоже работают
  function walkTable(node){
    const rows = Array.from(node.rows || []);
    if (!rows.length) return { text: '', html: '' };
    let text = '', html = '<table class="basket-table">';
    rows.forEach(row => {
      const cells = Array.from(row.cells).map(cell => {
        const r = walkChildren(cell);
        const tag = cell.tagName === 'TH' ? 'th' : 'td';
        const colspan = cell.colSpan > 1 ? ' colspan="' + cell.colSpan + '"' : '';
        const rowspan = cell.rowSpan > 1 ? ' rowspan="' + cell.rowSpan + '"' : '';
        return { tag, colspan, rowspan, text: r.text.replace(/\s+/g, ' ').trim(), html: r.html };
      });
      text += cells.map(c => c.text).join(' | ') + '\n';
      html += '<tr>' + cells.map(c => '<' + c.tag + c.colspan + c.rowspan + '>' + c.html + '</' + c.tag + '>').join('') + '</tr>';
    });
    html += '</table>';
    return { text, html };
  }

  // картинка — уже готовый безопасный ресурс (у нас в проекте это всегда
  // data:-URI, зашитый прямо в код тренажёра, не внешняя/пользовательская
  // ссылка), поэтому просто переносим src/alt в свою обёртку с своими же
  // классами — без цвета/фона исходной страницы
  function walkImg(node){
    const src = node.getAttribute('src') || '';
    if (!src) return { text: '', html: '' };
    const alt = node.getAttribute('alt') || '';
    return { text: '', html: '<img class="basket-img" src="' + escapeHtml(src) + '" alt="' + escapeHtml(alt) + '">' };
  }

  function walk(node){
    if (node.nodeType === 3) { // текстовый узел
      const t = node.textContent;
      return { text: t, html: escapeHtml(t) };
    }
    if (node.nodeType !== 1) return { text: '', html: '' };

    if (matchesAny(node, STRIP_SELECTORS) || matchesAny(node, GRAPHIC_STRIP_SELECTORS)) {
      return { text: '', html: '' };
    }
    if (isHidden(node)) return { text: '', html: '' };

    if (matchesAny(node, NUMLINE_SELECTORS)) {
      const { ticks, points } = numlineNumbers(node);
      if (!ticks.length && !points.length) return { text: '', html: '' };
      // прямая — отдельный, центрированный «рисунок» на своей строке, а не
      // текст, подклеенный встык к предложению с условием
      return {
        text: '\n' + numlineText(ticks, points) + '\n',
        html: '<div class="basket-numline-row">' + buildNumlineHtml(ticks, points) + '</div>'
      };
    }

    if (node.tagName === 'TABLE') return walkTable(node);
    if (node.tagName === 'IMG') return walkImg(node);

    // группа картинок (несколько рисунков в ряд, как в оригинале) — своим
    // блоком, чтобы следующий за ней текст не подклеивался на ту же строку
    if (matchesAny(node, ['.theory-images'])) {
      const r = walkChildren(node);
      return { text: r.text + ' ', html: '<div class="basket-fig-row">' + r.html + '</div>' };
    }

    if (matchesAny(node, FRAC_SELECTORS)) {
      const numEl = firstMatch(node, NUM_SELECTORS);
      const denEl = firstMatch(node, DEN_SELECTORS);
      if (numEl && denEl) return fracFromParts(walkChildren(numEl), walkChildren(denEl));
      return walkChildren(node); // структура непонятна — просто разворачиваем как контейнер
    }

    for (const spec of OPTION_LIST_CONTAINERS) {
      if (matchesAny(node, [spec.container])) {
        const items = Array.from(node.querySelectorAll(spec.item)).filter(it => it.parentElement === node);
        if (!items.length) return { text: '', html: '' };
        const listClass = spec.inline ? 'basket-opt-list basket-opt-list-inline' : 'basket-opt-list';
        let text = '', html = '<div class="' + listClass + '">';
        items.forEach((it, i) => {
          let itemText = '', itemHtml = '';
          Array.from(it.childNodes).forEach(c => {
            if (c.nodeType === 1 && matchesAny(c, [spec.skipLabel])) return;
            const r = walk(c);
            itemText += r.text;
            itemHtml += r.html;
          });
          itemText = itemText.replace(/\s+/g, ' ').trim();
          text += (i + 1) + ') ' + itemText + '\n';
          html += '<div class="basket-opt">' + (i + 1) + ') ' + itemHtml + '</div>';
        });
        html += '</div>';
        return { text, html };
      }
    }

    const r = walkChildren(node);
    const isBlock = node.tagName === 'DIV' || node.tagName === 'P' || node.tagName === 'LI' || node.tagName === 'TR' ||
      node.tagName === 'FIGURE' || node.tagName === 'FIGCAPTION';
    if (!isBlock) return r;
    // блочный элемент (условие, заголовок «Варианты ответа:», числовая
    // прямая, список ответов и т.п.) — каждый действительно должен начинаться
    // с новой строки, а не склеиваться с соседним одним пробелом, как раньше
    if (!r.text.trim() && !r.html.trim()) return { text: '', html: '' };
    return { text: r.text + '\n', html: '<div class="basket-block">' + r.html + '</div>' };
  }

  function extractRichTask(el){
    if (!el) return { text: '', html: '' };
    const res = walk(el);
    return {
      // все виды пробелов (включая переносы строк, оставшиеся от форматирования
      // исходного кода тренажёра) схлопываем в один пробел — иначе они превращаются
      // в настоящие переносы строк из-за white-space:pre-line на карточке подборки
      text: res.text.replace(/\s+/g, ' ').trim(),
      html: res.html.replace(/\s+/g, ' ').trim()
    };
  }

  // старая «только текст» версия — выражена через новую логику, чтобы не
  // дублировать поведение; оставлена для обратной совместимости
  function extractPlainTask(el){
    return extractRichTask(el).text;
  }

  // ── пробует по очереди несколько типовых селекторов «текущего задания»,
  // берёт первый, который реально существует и виден на странице ──
  function extractFromSelectors(selectors){
    for (const sel of selectors){
      const el = document.querySelector(sel);
      if (el && el.offsetParent !== null){
        const text = extractPlainTask(el);
        if (text) return text;
      }
    }
    return '';
  }
  function extractFromSelectorsRich(selectors){
    for (const sel of selectors){
      const el = document.querySelector(sel);
      if (el && el.offsetParent !== null){
        const rich = extractRichTask(el);
        if (rich.text) return rich;
      }
    }
    return { text: '', html: '' };
  }

  window.Basket = {
    add, remove, clear, all, count,
    extractPlainTask, extractFromSelectors,
    extractRichTask, extractFromSelectorsRich
  };
})();
