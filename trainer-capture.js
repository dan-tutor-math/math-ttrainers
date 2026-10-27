/* ==========================================================
   trainer-capture.js — снятие задания тренажёра «для доски».

   Общий код встроенной панели тренажёров на доске (boards-core.js) и
   отдельной вкладки-панели (boards-panel.html, промпт «сопряжение панели»).
   Вкладка-панель нужна, чтобы тяжёлый рендер заданий не нагружал вкладку
   доски на слабом ноутбуке и чтобы задания можно было подбирать на втором
   устройстве. Снимок обязан получаться одинаковым в обоих местах: доска
   кладёт его по ширине карточки (css.w) и стопкой, и задание из вкладки,
   снятое «по-своему», выглядело бы на доске чужим. Поэтому цикл снятия
   один, здесь, а не копия в каждой панели.

   Сама карта узлов, снимок html2canvas, ответ и «такое же задание» уже
   общие с конструктором работ — они в trainer-tasks.js (промпт №15
   «работы»). Здесь — то, что до выноса жило только в boards-core.js:
   - captureTaskWithSolution — снимок задания вместе с разбором;
   - ttSnapTrainerTasks — снять все задания, открытые в кадре (пакет «+1..+10»);
   - ttSnapTheory — снять теорию ОГЭ №1–5 отдельной картинкой;
   - ttWidthLike / ttCwForCard — какой ширины карточку снимать (продолжение
     стопки на доске) и какая для этого нужна ширина узла;
   - ttRenderTrainersList — список тренажёров (TRAINERS_PANEL_GROUPS);
   - ttHookTrainerFrameDoc — что панель подкладывает в кадр тренажёра.

   Подключается обычным <script> ПОСЛЕ trainer-tasks.js и ДО boards-core.js.
   Как и в trainer-tasks.js, здесь нельзя заводить имя, которое уже
   объявлено в boards-core.js через const/let: свои имена — с приставкой tt.
   Ничего из состояния доски (B, стопка, камера) этот файл не знает —
   всё нужное приходит параметрами (widthFor, onShot), иначе вкладка-панель
   без доски не смогла бы им пользоваться.
   ========================================================== */

/* Ширина нового задания стопки — ширина КАРТОЧКИ (css.w) последнего
   задания того же тренажёра (того же номера). Раньше переносилась ширина
   узла и только на узел того же вида — и в пакете ОГЭ №8 карточка «+»
   (другой узел) ложилась на доску своей «телефонной» шириной; то же после
   смены типа, если последней на доске была карточка «+». Переносить надо
   именно карточку: основное задание — само карточка (#questionPanel), а
   вокруг узла карточки «+» снимок дорисовывает поля, и одна ширина узла
   давала разные карточки. На другой тренажёр не переносим: ширину условия
   ЕГЭ на столбик переносить бессмысленно.
   refTid/refW — тренажёр и ширина карточки последнего задания стопки (во
   вкладке-панели их присылает доска). → ширина карточки или null */
function ttWidthLike(refTid, refW, gen){
  return (refW && gen && gen.tid && refTid && refTid === gen.tid) ? refW : null;
}
// ширина карточки cardW → ширина узла для снимка (opts.width у
// captureTrainerNode): за вычетом полей, которые дорисуются вокруг узла.
// Столбики — нет: их ширина зависит от числа цифр
function ttCwForCard(el, cardW){
  if (!cardW || !el || el.hasAttribute('data-bd-answer')) return null;
  let pad = 0;
  try { pad = trainerCardStyle(el, trainerPageBg(el.ownerDocument)).pad || 0; } catch (e) {}
  const cw = Math.round(cardW - 2 * pad);
  return cw > 0 ? cw : null;
}

// снимок задания; sol — разбор «Тренировки» (trainerSolutionHTML): тогда
// разбор снимается отдельной картинкой, а на карточке внизу — ряд с кнопкой.
// Разбор не снялся — задание всё равно ложится, просто без кнопки
// scale — пикселей на CSS-пиксель (ttCaptureScale); не задан — по своему экрану
async function captureTaskWithSolution(el, info, cw, sol, scale){
  const opts = { width: cw, scale };
  if (!sol) return captureTrainerNode(el, info, opts);
  const shot = await captureTrainerNode(el, info, Object.assign({}, opts, { solRow: true }));
  try {
    // разбор — шириной во всю карточку задания: под ней он и раскрывается
    const solImg = await captureSolutionImage(el, sol, shot.css.w, scale);
    if (shot.solHot) shot.sol = { v: 1, src: solImg.src, css: solImg.css, card: solImg.card, hot: shot.solHot, open: false };
    return shot;
  } catch (e) {
    console.warn('[доска] не удалось снять разбор задания', e);
    // ряд с кнопкой без разбора был бы мёртвым — снимаем задание без него
    return captureTrainerNode(el, info, opts);
  }
}

/* Снять все задания, открытые сейчас в кадре тренажёра tid.
   opts.widthFor(gen) → ширина карточки (или null); зовётся ПЕРЕД каждым снимком, а не
   один раз на пакет: первое задание пакета само начинает стопку на доске, и
   второе должно взять уже её ширину.
   opts.onShot(item) — что делать со снимком (вставить на доску, отправить
   на доску по сопряжению); ждём его до следующего снимка — на доске каждое
   задание появляется на глазах, не дожидаясь остальных из пакета.
   item = { dataUrl, task, gen, shot, cw } — ровно то, что берёт insertTaskImage.
   opts.scale — плотность снимка (вкладка-панель берёт её у доски).
   → { added, none, error } */
async function ttSnapTrainerTasks(win, tid, href, opts){
  const doc = win && win.document;
  if (!doc) return { added: 0, none: true };
  // теорию к заданию (ОГЭ №1–5) кладёт своя кнопка «Добавить теорию на
  // доску» рядом с «Показать теорию» (ttSnapTheory) — сюда она больше не
  // едет довеском к каждому заданию
  const all = collectTrainerCaptureNodes(doc, tid);
  all.forEach(n => { if (n.el.id === 'theoryContent' && n.restore) n.restore(); });
  const nodes = all.filter(n => n.el.id !== 'theoryContent');
  if (!nodes.length) return { added: 0, none: true };
  let added = 0, error = null;
  try {
    for (const { el, restore } of nodes){
      try {
        // ответ читаем до снимка — пока на странице то же задание, что снимаем
        const info = trainerTaskInfo(win, tid, el);
        const gen = trainerGenInfo(win, tid, href, el);
        // widthFor отдаёт ширину карточки — узлу нужна своя, без полей
        const cw = ttCwForCard(el, opts.widthFor ? opts.widthFor(gen) : null);
        const shot = await captureTaskWithSolution(el, info, cw, trainerSolutionHTML(win, tid, el), opts.scale);
        const task = (info && shot.hot) ? Object.assign({ v: 1 }, info, { hot: shot.hot }) : null;
        await opts.onShot({ dataUrl: shot.dataUrl, task, gen, shot, cw });
        added++;
      } finally {
        if (restore) restore();
      }
    }
  } catch (err){
    console.error('[trainers panel] capture failed', err);
    error = err;
  }
  return { added, none: false, error };
}

// теория ОГЭ №1–5 — отдельной картинкой, без task/gen. Свёрнутую теорию на
// время снимка раскрываем: html2canvas нужна настоящая вёрстка (так же
// делал collectTrainerCaptureNodes с unhide). → shot или null (теории нет)
async function ttSnapTheory(doc, scale){
  const el = doc && doc.getElementById('theoryContent');
  if (!el || !el.textContent.trim()) return null;
  const prev = el.style.display;
  if (getComputedStyle(el).display === 'none') el.style.display = 'block';
  try {
    return await captureTrainerNode(el, null, { scale });
  } finally {
    el.style.display = prev;
  }
}

// список тренажёров панели с поиском; onPick(id, href, name)
function ttRenderTrainersList(container, filterText, onPick){
  const q = (filterText || '').trim().toLowerCase();
  const html = TRAINERS_PANEL_GROUPS.map(g => {
    const items = g.items.filter(it => !q || it.name.toLowerCase().includes(q));
    if (!items.length) return '';
    return `
      <div>
        <div class="bd-trainers-group-title">${g.title}</div>
        ${items.map((it, ii) => `
          <button class="bd-trainers-item" data-id="${it.id}" data-href="${it.href}" data-name="${it.name.replace(/"/g,'&quot;')}">
            <span class="bd-trainers-item-num">${String(ii+1).padStart(2,'0')}</span>
            <span class="bd-trainers-item-name">${it.name}</span>
            <span class="bd-trainers-item-eq">${it.eq}</span>
          </button>`).join('')}
      </div>`;
  }).join('');
  container.innerHTML = html || `<div class="bd-trainers-empty">Ничего не нашлось</div>`;
  container.querySelectorAll('.bd-trainers-item').forEach(btn => {
    btn.addEventListener('click', () => onPick(btn.dataset.id, btn.dataset.href, btn.dataset.name));
  });
}

// главная сайта в кадре — значит, из тренажёра вышли
function ttFrameIsHome(loc){
  if (!loc || !loc.href || loc.href === 'about:blank') return false;
  const file = (loc.pathname || '').split('/').pop();
  return file === '' || file === 'index.html';
}

/* Что панель подкладывает в документ кадра после каждой его загрузки.
   Файлы тренажёров при этом не меняются — всё живёт только в кадре панели.
   opts.onHome() — из тренажёра ушли на главную (стрелка «Ко всем
   тренажёрам», любая ссылка на index.html): панель показывает свой список,
   а не обычную главную внутри кадра.
   opts.onTheory(btn) — нажата «Добавить теорию на доску» (ОГЭ №1–5).
   opts.kpLift — на сколько поднять плавающую клавиатуру тренажёра над рядом
   кнопок панели. */
function ttHookTrainerFrameDoc(doc, opts){
  if (!doc || !doc.head) return;
  if (!doc.__bdHomeHook && opts.onHome){
    doc.__bdHomeHook = true;
    // перехватываем ещё до обработчика страницы (фаза перехвата на
    // документе): иначе в кадре на мгновение мелькнула бы обычная главная
    doc.addEventListener('click', (e) => {
      const a = e.target && e.target.closest && e.target.closest('a[href], #homeBtn');
      if (!a) return;
      let home = a.id === 'homeBtn';
      if (!home && a.href){
        try { home = ttFrameIsHome(new URL(a.href, doc.baseURI)); } catch (err) {}
      }
      if (!home) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      opts.onHome();
    }, true);
  }
  // В узкой панели тренажёр живёт в «телефонной» вёрстке, и его плавающая
  // клавиатура прижата к низу кадра справа — ровно туда, где ряд кнопок
  // панели. Поднимаем её над рядом: margin у fixed-панели с bottom сдвигает
  // её вверх, а на широкой вёрстке (там top) ничего не меняет
  if (!doc.getElementById('bdPanelKpLift')){
    const st = doc.createElement('style');
    st.id = 'bdPanelKpLift';
    st.textContent = '.keypad-float,.keypad-toggle{margin-bottom:' + (opts.kpLift || 58) + 'px !important;}';
    doc.head.appendChild(st);
  }
  // ОГЭ №1–5: у теории своя кнопка рядом с «Показать теорию» — раньше она
  // уезжала довеском к каждому заданию набора. Появляется и прячется вместе
  // с блоком теории: его тренажёр показывает только у заданий, где она есть
  const toggle = opts.onTheory && doc.getElementById('theoryToggleBtn');
  if (toggle && !doc.getElementById('bdTheoryAddBtn')){
    const b = doc.createElement('button');
    b.type = 'button'; b.id = 'bdTheoryAddBtn';
    b.className = toggle.className;
    b.textContent = '📥 Добавить теорию на доску';
    b.addEventListener('click', () => opts.onTheory(b));
    toggle.insertAdjacentElement('afterend', b);
  }
}
