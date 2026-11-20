/* ═══════════════ Навигация между номерами экзамена (промпт №73) ═══════════════
   Круглые стрелки ◀ ▶ по бокам заголовка экзаменационного тренажёра: ОГЭ
   (oge1_5 … oge19 и oge_part2?n=20…25), ЕГЭ база (ege_base?n=1…21), ЕГЭ
   профиль (ege_prof?n=1…19), ОГЭ английский (eng_oge?n=1, 5, 6, 12, 13, 20,
   29, 35–38 — первый номер набора), ОГЭ русский (rus_oge01, rus_oge?n=2…12,
   rus_oge13), ЕГЭ русский (rus_ege?n=1…26, rus_ege27), ОГЭ обществознание (soc_oge?n=1…20; блок
   «Дополнительно к тексту», ?n=21, вне круга номеров КИМ). Стрелка ведёт на соседний номер того же экзамена;
   на первом номере неактивна левая, на последнем — правая.

   Память номеров. Первый заход на номер в этой вкладке открывает его первый
   прототип. Возврат на номер, который уже открывали, — тот же прототип и то
   же задание, что были в последний раз. Хранится в sessionStorage: «в этой
   сессии» — это вкладка, и память переживает переход на соседнюю страницу
   ОГЭ, но не тянется в завтрашнее занятие (для этого у тренажёров есть своя
   память по прототипам в localStorage, её здесь не трогаем).

   Что запоминаем:
   - ОГЭ — снимок страницы через её же мост сессии (tsGetState) без доски,
     калькулятора и карточек «+». Возврат — tsApplyState(снимок): так же, как
     ученик получает экран учителя. Мост сперва открывает тип обычным путём
     страницы (openTask/startMode — с её собственной памятью по типу:
     задание, ответ, поле), и только если задание разошлось со снимком
     (в №19 памяти по типу нет вовсе, после трёх часов паузы она
     обнуляется), рисует задание из снимка. Поэтому память номеров не
     сбрасывает память прототипов, а дополняет её;
   - ЕГЭ и ОГЭ часть 2 — только прототип: задание ЕГЭ и есть прототип, а
     смена прототипа внутри номера тоже открывает его с чистого листа.
     Режим («Экзамен/Тренировка/Обучение») не запоминаем — он общий на все
     номера страницы, как и при смене прототипа.

   Где страница — определяем по имени файла, как слаг сессии. Страница
   ЕГЭ-семейства (номер внутри страницы меняется без перезагрузки) отдаёт
   хук window.__examNav = { n(), pid(), open(n, pid) }; тренажёрам ОГЭ №1–19
   хук не нужен — хватает моста сессии и карточек на экране выбора типа.

   В совместной сессии стрелки — только у учителя (как любой переход):
   ученику guardStudentAction покажет «Учитель ограничил это действие».
   Переход на другую страницу — через TrainerSession.navigateTo, чтобы
   ученики ушли следом. */
(function () {
  'use strict';
  if (window.__examNavLoaded) return;
  window.__examNavLoaded = true;

  const params = new URLSearchParams(location.search);
  // Панели выбора для доски — полноценные тренажёры. Отличаем их от
  // карточек «+», снимков и живых заданий на холсте: там меню не нужно.
  // Промпт №11 нового списка: кадр сцены ученика (stage.html, окно с именем tsStageFrame) —
  // исключение: это целая страница, и стрелки у заголовка должны стоять как
  // у учителя, иначе заголовок сверстается иначе и съедет всё, что ниже.
  // Нажать их ученик всё равно не может — guardStudentAction
  let inFrame = false, panelFrameId = '', panelCatalog = null;
  try {
    inFrame = window.top !== window.self;
    const frame = window.frameElement;
    if (frame && frame.matches('#bdTrainersIframe,#bpIframe')) {
      panelFrameId = frame.id;
      panelCatalog = window.parent.MathhCatalog;
    }
  } catch (e) { inFrame = true; }
  if (params.get('card') === '1' || params.get('bdgen') === '1'
      || (inFrame && !panelFrameId && window.name !== 'tsStageFrame')) return;

  const slug = (location.pathname.split('/').pop() || '').replace(/\.html?$/i, '');
  const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

  // Список номеров экзаменов — в exam-spec.js (подключён перед этим файлом)
  const EXAMS = window.ExamSpec && window.ExamSpec.exams;
  if (!EXAMS) return;
  let examId = null;
  Object.keys(EXAMS).forEach(id => { if (EXAMS[id].list.some(p => p.slug === slug)) examId = id; });
  if (!examId) return;
  // В панели доступны те же номера, что в её каталоге: аудио и сочинения
  // без снимка задания не должны уводить из окна добавления на доску.
  const panelPositions = panelCatalog ? new Set(panelCatalog.panelGroups().flatMap(g => g.items.map(t => t.href))) : null;
  const EXAM = panelPositions ? Object.assign({}, EXAMS[examId], {
    list: EXAMS[examId].list.filter(p => panelPositions.has(p.slug + '.html' + (p.n ? '?n=' + p.n : ''))),
  }) : EXAMS[examId];
  const subjectId = examId.startsWith('rus_') ? 'rus' : examId.startsWith('soc_') ? 'soc' : examId === 'eng_oge' ? 'eng'
    : examId === 'phys_oge' ? 'phys' : examId === 'inf_oge' ? 'inf' : 'math';
  const catalogExamId = subjectId === 'math' ? examId : (examId === 'soc_ege' || examId === 'rus_ege') ? 'ege' : 'oge';
  const assetBase = new URL('.', document.currentScript ? document.currentScript.src : location.href);

  // Кадр и основная вкладка делят sessionStorage; подбор для доски не
  // должен подменять сохранённое задание открытого рядом тренажёра.
  const memorySuffix = panelFrameId ? ':' + panelFrameId : '';
  const MEM_KEY = 'examNav:mem:v1' + memorySuffix;
  const ARRIVE_KEY = 'examNav:arrive' + memorySuffix;
  const TYPE_MEM_KEY = 'examNav:types:v1' + memorySuffix;
  let liveUnits = [], liveUnitsN = null;
  const ARRIVE_TTL_MS = 60 * 1000;   // метка «пришли стрелкой» старше минуты — не наша
  const posKey = p => p.slug + (p.n ? '?n=' + p.n : '');
  const posUrl = p => p.slug + '.html' + (p.n ? '?n=' + p.n : '');

  function ssGet(key) {
    try { return JSON.parse(sessionStorage.getItem(key) || 'null'); } catch (e) { return null; }
  }
  function ssSet(key, val) {
    try {
      if (val == null) sessionStorage.removeItem(key);
      else sessionStorage.setItem(key, JSON.stringify(val));
    } catch (e) {}
  }

  const hook = () => window.__examNav || null;
  function curN() {
    const h = hook();
    if (h && typeof h.n === 'function') return h.n();
    const v = parseInt(params.get('n'), 10);
    return isFinite(v) ? v : null;
  }
  function curIndex() {
    const n = curN();
    return EXAM.list.findIndex(p => p.slug === slug && (p.n == null || p.n === n));
  }

  /* ── что запомнить про открытый номер ── */
  function stripKeys(getter) {
    try { return getter ? Object.keys(getter() || {}) : []; } catch (e) { return []; }
  }
  // → объект памяти или null, если сейчас не открыто задание (экран выбора)
  function currentMemo() {
    const h = hook();
    if (h && typeof h.pid === 'function') {
      const pid = h.pid();
      return pid ? { pid: pid } : null;
    }
    if (typeof window.tsGetState !== 'function') return null;
    let s;
    try { s = window.tsGetState(); } catch (e) { return null; }
    if (!s || s.picker !== false) return null;
    const snap = Object.assign({}, s);
    // доска у страницы одна на все номера и живёт своей жизнью; калькулятор
    // в столбик и карточки «+» — рабочие окна поверх задания. Всё это
    // сохранять не нужно, а доска ещё и тяжёлая для sessionStorage
    stripKeys(window.__boardGetState).concat(stripKeys(window.__calcGetState), ['__cards'])
      .forEach(k => { delete snap[k]; });
    try { return { snap: JSON.parse(JSON.stringify(snap)) }; } catch (e) { return null; }
  }
  let lastSaved = '';
  function record() {
    const i = curIndex();
    if (i < 0) return;
    const memo = currentMemo();
    if (!memo) return;   // на экране выбора прототипа — помним последнее открытое
    const key = posKey(EXAM.list[i]);
    const token = currentTypeToken();
    const pid = hook() && hook().pid ? hook().pid() : null;
    if (token && pid && token.startsWith('g:')) {
      const types = ssGet(TYPE_MEM_KEY) || {};
      if (types[key + '|' + token] !== pid) { types[key + '|' + token] = pid; ssSet(TYPE_MEM_KEY, types); }
    }
    const str = JSON.stringify(memo);
    if (str === lastSaved) return;
    const mem = ssGet(MEM_KEY) || {};
    mem[key] = memo;
    ssSet(MEM_KEY, mem);
    lastSaved = str;
  }

  /* ── открыть номер: из памяти или его первый прототип ── */
  function openHere(pos) {
    const memo = (ssGet(MEM_KEY) || {})[posKey(pos)] || null;
    const h = hook();
    if (h && typeof h.open === 'function') {
      h.open(pos.n, memo && memo.pid ? memo.pid : null);
      return;
    }
    if (memo && memo.snap && typeof window.tsApplyState === 'function') {
      try { window.tsApplyState(memo.snap); return; } catch (e) {}
    }
    // первый прототип — первая карточка экрана выбора (без «Случайно» и
    // «скоро»): нажимаем её, как нажал бы учитель, и страница открывает тип
    // своим обычным путём — с теорией темы в №1–5 (в №9 это №0 демоверсии,
    // блок «Научиться решать уравнения» — ссылки, а не карточки)
    const first = document.querySelector('#pickerArea .mode-card[data-id]:not(.random):not(.soon):not([data-id="random"])');
    if (first) first.click();
  }
  // подпись открытого экрана: по ней после подключения к сессии видно,
  // не увёл ли кто-нибудь страницу с только что открытого номера
  function screenSig() {
    const h = hook();
    if (h && typeof h.pid === 'function') return JSON.stringify([h.n(), h.pid()]);
    try {
      const s = window.tsGetState();
      return JSON.stringify([s.picker, s.curMode]);
    } catch (e) { return ''; }
  }

  /* ── переход по стрелке ── */
  const TS = () => window.TrainerSession || null;
  function go(delta) {
    const i = curIndex();
    const target = EXAM.list[i + delta];
    if (i < 0 || !target) return;
    navigatePosition(target);
  }
  function navigatePosition(target, typeToken) {
    record();
    closeJumpMenu(true);
    const current = EXAM.list[curIndex()];
    if (current && posKey(current) === posKey(target) && (!typeToken || typeToken === currentTypeToken())) return;
    if (typeToken && target.slug === slug) {
      applyType(target, typeToken).then(ok => { if (!ok) showTypeError(target); else { render(); record(); } });
      return;
    }
    if (target.slug === slug && hook() && typeof hook().open === 'function') {
      openHere(target);   // тот же файл (ЕГЭ, ОГЭ часть 2) — без перезагрузки
      render();
      return;
    }
    ssSet(ARRIVE_KEY, { key: posKey(target), at: Date.now() });
    const ts = TS();
    const url = new URL(posUrl(target), location.href);
    if (typeToken) url.searchParams.set('en_type', typeToken);
    if (ts && typeof ts.navigateTo === 'function') ts.navigateTo(url.pathname.split('/').pop() + url.search);
    else location.href = url.href;
  }
  function guarded(action, fn) {
    const ts = TS();
    return ts && typeof ts.guardStudentAction === 'function' ? ts.guardStudentAction(action, fn) : fn;
  }

  function currentTypeToken() {
    if (window.__rusOge) return window.__rusOge.S.topic ? 'r:' + window.__rusOge.S.topic : null;
    if (window.__rusOge13) return window.__rusOge13.S.k != null ? 'w:' + window.__rusOge13.S.k : null;
    const h = hook(), pid = h && h.pid ? h.pid() : null;
    if (pid) {
      const unit = liveUnitsN === curN() && liveUnits.find(u => u.id !== 'loose' && u.tasks.includes(pid));
      return unit ? 'g:' + unit.id : 'p:' + pid;
    }
    try { const s = window.tsGetState(); return s && s.picker === false ? 'm:' + s.curMode : null; } catch (e) { return null; }
  }
  async function refreshLiveUnits() {
    if (!window.__trainerCatalog) return;
    const n = curN(), units = await window.__trainerCatalog.list(n);
    if (curN() === n) { liveUnits = units; liveUnitsN = n; }
  }
  async function applyType(target, token) {
    const kind = token.slice(0, 2), id = token.slice(2);
    try {
      if (kind === 'm:') {
        const card = [...document.querySelectorAll('#pickerArea .mode-card[data-id]:not(.soon)')].find(c => c.dataset.id === id);
        if (!card) return false;
        card.click(); return true;
      }
      if ((kind === 'p:' || kind === 'g:') && window.__trainerCatalog) {
        const units = await window.__trainerCatalog.list(target.n);
        const unit = units.find(u => u.id === (kind === 'g:' ? id : 'loose'));
        if (!unit) return false;
        const saved = (ssGet(TYPE_MEM_KEY) || {})[posKey(target) + '|' + token];
        const index = kind === 'p:' ? unit.tasks.indexOf(id) : Math.max(0, unit.tasks.indexOf(saved));
        if (index < 0) return false;
        liveUnits = units; liveUnitsN = target.n;
        const result = await window.__trainerCatalog.openAt(unit.id, index, target.n);
        return !!result.ok;
      }
      if (kind === 'r:' && window.__rusOge) {
        const ru = window.__rusOge;
        if (!ru.topicsOf(target.n).some(t => t.id === id)) return false;
        if (ru.S.n !== target.n) hook().open(target.n);
        if (ru.S.screen !== 'topics') document.getElementById('backBtn').click();
        const card = [...document.querySelectorAll('[data-tp]')].find(c => c.dataset.tp === id);
        if (!card) return false;
        card.click(); return true;
      }
      if (kind === 'w:' && window.__rusOge13) {
        if (!hook().pid()) {
          openHere(target);
          if (!hook().pid()) { const first = document.querySelector('#pickerArea .mode-card[data-i]'); if (first) first.click(); }
        }
        const theme = [...document.querySelectorAll('#themes [data-k]')].find(c => c.dataset.k === id);
        if (!theme || theme.disabled) return false;
        theme.click(); return true;
      }
    } catch (e) { console.warn('[exam-nav] Не удалось открыть тип', token); }
    return false;
  }
  function showTypeError(target) {
    jumpMenu.hidden = false; jumpTrigger.setAttribute('aria-expanded', 'true');
    const status = el('p', 'exam-jump-status', 'Этот тип пока недоступен. Можно открыть номер целиком.');
    status.setAttribute('role', 'status');
    jumpBody.replaceChildren(status, menuButton('exam-jump-exam', 'Открыть номер', guarded('navigate', () => { closeJumpMenu(true); openHere(target); })));
    positionJumpMenu();
  }

  /* Каталог тот же, что на главной: новые номера и предметы не требуют
     второго списка. Загружаем его только при первом открытии меню. */
  let catalogPromise = null;
  function loadBaseCatalog() {
    if (window.MathhCatalog) return Promise.resolve(window.MathhCatalog);
    if (!catalogPromise) {
      catalogPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = new URL('subjects-catalog.js', assetBase).href;
        script.onload = () => window.MathhCatalog ? resolve(window.MathhCatalog) : reject(new Error('catalog'));
        script.onerror = () => reject(new Error('catalog'));
        document.head.appendChild(script);
      }).catch(error => { catalogPromise = null; throw error; });
    }
    return catalogPromise;
  }
  let typeCatalogPromise = null;
  function loadTypeCatalog() {
    if (window.MathhExamTypes) return Promise.resolve(window.MathhExamTypes);
    if (!typeCatalogPromise) typeCatalogPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script'); script.src = new URL('exam-types.js', assetBase).href;
      script.onload = () => window.MathhExamTypes ? resolve(window.MathhExamTypes) : reject(new Error('types'));
      script.onerror = () => reject(new Error('types')); document.head.appendChild(script);
    }).catch(error => { typeCatalogPromise = null; throw error; });
    return typeCatalogPromise;
  }
  async function loadCatalog() {
    const [catalog] = await Promise.all([loadBaseCatalog(), loadTypeCatalog()]); return catalog;
  }
  let jumpTrigger = null, jumpMenu = null, jumpBody = null;
  let jumpCatalog = null, browseSubject = subjectId, browseExam = catalogExamId;
  let selectedTrainer = null, typesExpanded = false;
  const trainerTarget = trainer => {
    const url = new URL(trainer.href, location.href);
    return { slug: url.pathname.split('/').pop().replace(/\.html?$/i, ''), n: Number(url.searchParams.get('n')) || null };
  };
  const trainerTypes = id => window.MathhExamTypes && window.MathhExamTypes[id] || [];
  function el(tag, className, label) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (label != null) node.textContent = label;
    return node;
  }
  function menuButton(className, label, action) {
    const button = el('button', className, label);
    button.type = 'button';
    button.addEventListener('click', action);
    return button;
  }
  function syncTouchTargets() {
    if (!matchMedia('(pointer: coarse)').matches) return;
    let scale = 1;
    // Телефонная панель вписывает кадр масштабом: 44 CSS-пикселя внутри
    // него могут стать 33 пикселями под пальцем. Компенсируем только кнопки.
    if (panelFrameId) {
      const frame = window.frameElement;
      scale = frame && frame.clientWidth ? Math.min(1, frame.getBoundingClientRect().width / frame.clientWidth) : 1;
    }
    const value = (44 / Math.max(.1, scale)) + 'px', style = document.documentElement.style;
    if (style.getPropertyValue('--ej-touch-size') !== value) style.setProperty('--ej-touch-size', value);
  }
  function positionJumpMenu() {
    syncTouchTargets();
    if (!jumpMenu || jumpMenu.hidden) return;
    const rect = jumpTrigger.getBoundingClientRect();
    if (!rect.width || !rect.height) { closeJumpMenu(); return; }
    const viewport = window.visualViewport;
    const width = viewport ? viewport.width : innerWidth;
    const height = viewport ? viewport.height : innerHeight;
    const offsetTop = viewport ? viewport.offsetTop : 0;
    const offsetLeft = viewport ? viewport.offsetLeft : 0;
    const menuWidth = Math.min(740, width - 24);
    const top = Math.min(Math.max(offsetTop + 12, rect.bottom + 12), offsetTop + Math.max(12, height - 280));
    const left = Math.max(offsetLeft + 12, Math.min(rect.left + rect.width / 2 - menuWidth / 2, offsetLeft + width - menuWidth - 12));
    Object.assign(jumpMenu.style, { width: menuWidth + 'px', left: left + 'px', top: top + 'px', maxHeight: Math.max(120, offsetTop + height - top - 12) + 'px' });
    const layout = jumpBody.querySelector('.exam-jump-layout');
    if (layout) {
      const used = layout.getBoundingClientRect().top - jumpMenu.getBoundingClientRect().top;
      jumpMenu.style.setProperty('--ej-pane-height', Math.max(140, offsetTop + height - top - 30 - used) + 'px');
    }
  }
  function closeJumpMenu(focus) {
    if (!jumpMenu || jumpMenu.hidden) return;
    stopTypeMotion();
    jumpMenu.hidden = true;
    jumpTrigger.setAttribute('aria-expanded', 'false');
    if (focus) jumpTrigger.focus({ preventScroll: true });
  }
  let typeMotion = [], typeMotionVersion = 0;
  function stopTypeMotion() {
    typeMotionVersion++; typeMotion.forEach(a => a.cancel()); typeMotion = [];
    if (!jumpMenu) return;
    jumpMenu.style.removeProperty('overflow');
    jumpMenu.querySelectorAll('.exam-jump-exit').forEach(node => node.remove());
  }
  function captureTypeMotion() {
    const panel = jumpBody.querySelector('.exam-jump-types:not(.exam-jump-exit):not([hidden])') || jumpBody.querySelector('.exam-jump-exit');
    const list = jumpBody.querySelector('.exam-jump-numbers'), box = list && list.getBoundingClientRect();
    return { id: selectedTrainer, height: jumpMenu.getBoundingClientRect().height,
      panel: panel ? { rect: panel.getBoundingClientRect(), opacity: getComputedStyle(panel).opacity, copy: panel.cloneNode(true), scroll: panel.scrollTop } : null,
      rows: [...jumpBody.querySelectorAll('.exam-jump-number')].filter(row => {
        const r = row.getBoundingClientRect(); return box && r.bottom > box.top && r.top < box.bottom;
      }).map(row => ({ id: row.dataset.trainer, rect: row.getBoundingClientRect(),
        parts: [...row.children].map(part => ({ rect: part.getBoundingClientRect(), arrow: part.querySelector('.exam-jump-number-chevron') ? getComputedStyle(part.querySelector('.exam-jump-number-chevron')).transform : null })) })) };
  }
  function animateTypeMotion(before, pointer) {
    if (!pointer || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const version = typeMotionVersion;
    const play = (node, frames) => { const a = node.animate(frames, { duration: 120, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' }); typeMotion.push(a); };
    const afterHeight = jumpMenu.getBoundingClientRect().height;
    // Высоту меняем лишь у раскрывающегося меню; движение строк и стрелок
    // отдаём браузеру через transform, не масштабируя читаемый текст.
    jumpMenu.style.overflow = 'hidden';
    play(jumpMenu, [{ height: before.height + 'px' }, { height: afterHeight + 'px' }]);
    before.rows.forEach(old => {
      const row = [...jumpBody.querySelectorAll('.exam-jump-number')].find(b => b.dataset.trainer === old.id); if (!row) return;
      const rect = row.getBoundingClientRect(), dy = old.rect.top - rect.top;
      const parts = [...row.children].map(part => part.getBoundingClientRect());
      if (Math.abs(dy) > .1) play(row, [{ transform: 'translateY(' + dy + 'px)' }, { transform: 'none' }]);
      [...row.children].forEach((part, i) => {
        if (!old.parts[i]) return;
        const dx = old.parts[i].rect.left - parts[i].left, y = old.parts[i].rect.top - parts[i].top - dy;
        if (Math.abs(dx) > .1 || Math.abs(y) > .1) play(part, [{ transform: 'translate(' + dx + 'px,' + y + 'px)' }, { transform: 'none' }]);
        const arrow = part.querySelector('.exam-jump-number-chevron');
        if (arrow && old.parts[i].arrow != null) {
          const target = getComputedStyle(arrow).transform;
          if (target !== old.parts[i].arrow) play(arrow, [{ transform: old.parts[i].arrow }, { transform: target }]);
        }
      });
    });
    const panel = jumpBody.querySelector('.exam-jump-types'), layout = jumpBody.querySelector('.exam-jump-layout');
    const move = innerWidth <= 640 ? 'translateY(8px)' : 'translateX(8px)';
    function departing() {
      if (!before.panel) return;
      const ghost = before.panel.copy, rect = before.panel.rect, base = layout.getBoundingClientRect();
      ghost.removeAttribute('id'); ghost.hidden = false; ghost.inert = true; ghost.setAttribute('aria-hidden', 'true'); ghost.classList.add('exam-jump-exit');
      ghost.querySelectorAll('button').forEach(b => { b.removeAttribute('data-type'); b.removeAttribute('data-continue'); });
      Object.assign(ghost.style, { position: 'absolute', left: rect.left - base.left + 'px', top: rect.top - base.top + 'px', width: rect.width + 'px', height: rect.height + 'px', overflow: 'hidden', pointerEvents: 'none', margin: '0' });
      layout.appendChild(ghost); ghost.scrollTop = before.panel.scroll;
      play(ghost, [{ opacity: before.panel.opacity, transform: 'none' }, { opacity: 0, transform: move }]);
    }
    if (typesExpanded) {
      const rect = panel.getBoundingClientRect(), same = before.id === selectedTrainer && before.panel;
      const from = same ? 'translate(' + (before.panel.rect.left - rect.left) + 'px,' + (before.panel.rect.top - rect.top) + 'px)' : move;
      if (!same) departing();
      play(panel, [{ opacity: same ? before.panel.opacity : 0, transform: from }, { opacity: 1, transform: 'none' }]);
    } else departing();
    Promise.all(typeMotion.map(a => a.finished.catch(() => {}))).then(() => {
      if (version !== typeMotionVersion) return;
      jumpMenu.style.removeProperty('overflow'); jumpMenu.querySelectorAll('.exam-jump-exit').forEach(node => node.remove()); typeMotion = [];
    });
  }
  function renderJumpMenu(focusSelector) {
    if (!jumpCatalog || !jumpBody) return;
    const oldList = jumpBody.querySelector('.exam-jump-numbers');
    const oldScroll = oldList ? oldList.scrollTop : 0;
    stopTypeMotion();
    const subjects = jumpCatalog.subjects;
    const exams = jumpCatalog.exams.filter(e => e.subject === browseSubject && !e.soon && e.groups.length);
    const selectedExam = exams.find(e => e.id === browseExam) || exams[0];
    if (selectedExam) browseExam = selectedExam.id;
    jumpMenu.dataset.subject = browseSubject;
    const content = document.createDocumentFragment();
    const tabs = el('div', 'exam-jump-subjects');
    tabs.setAttribute('role', 'group');
    tabs.setAttribute('aria-label', 'Предмет');
    subjects.forEach(subject => {
      const button = menuButton('exam-jump-subject', subject.title, () => {
        browseSubject = subject.id;
        selectedTrainer = null; typesExpanded = false;
        renderJumpMenu('[data-subject-id="' + subject.id + '"]');
      });
      button.dataset.subjectId = subject.id;
      button.setAttribute('aria-pressed', String(subject.id === browseSubject));
      tabs.appendChild(button);
    });
    content.appendChild(tabs);
    if (exams.length > 1) {
      const row = el('div', 'exam-jump-exams');
      row.setAttribute('role', 'group');
      row.setAttribute('aria-label', 'Экзамен');
      exams.forEach(exam => {
        const button = menuButton('exam-jump-exam', exam.title, () => {
          browseExam = exam.id;
          selectedTrainer = null; typesExpanded = false;
          renderJumpMenu('[data-exam-id="' + exam.id + '"]');
        });
        button.dataset.examId = exam.id;
        button.setAttribute('aria-pressed', String(exam.id === browseExam));
        row.appendChild(button);
      });
      content.appendChild(row);
    }
    const layout = el('div', 'exam-jump-layout' + (typesExpanded ? ' is-expanded' : ''));
    const list = el('div', 'exam-jump-numbers');
    list.setAttribute('aria-label', selectedExam ? selectedExam.title + ': номера заданий' : 'Номера заданий');
    const current = EXAM.list[curIndex()];
    const items = selectedExam ? selectedExam.groups.flatMap(group => group.items) : [];
    items.forEach(id => {
      const trainer = jumpCatalog.trainers[id];
      if (!trainer || !trainer.href || (panelFrameId && trainer.panel === false)) return;
      const target = trainerTarget(trainer), types = trainerTypes(id);
      const expanded = selectedTrainer === id && typesExpanded;
      const button = menuButton('exam-jump-number', null, event => {
        if (types.length < 2) { guarded('navigate', () => navigatePosition(target))(); return; }
        const before = captureTypeMotion();
        typesExpanded = selectedTrainer === id ? !typesExpanded : true;
        selectedTrainer = id;
        renderJumpMenu('[data-trainer="' + id + '"]');
        animateTypeMotion(before, event.detail !== 0);
      });
      button.dataset.trainer = id;
      button.dataset.selected = String(selectedTrainer === id);
      if (types.length > 1) {
        button.setAttribute('aria-expanded', String(expanded));
        button.setAttribute('aria-controls', 'examJumpTypes');
        button.title = expanded ? 'Скрыть типы' : 'Показать типы';
      }
      const split = trainer.name.indexOf('. ');
      const label = split < 0 ? trainer.name : trainer.name.slice(0, split);
      const name = split < 0 ? '' : trainer.name.slice(split + 2);
      button.appendChild(el('span', 'exam-jump-number-label', label));
      button.appendChild(el('span', 'exam-jump-number-name', name));
      if (types.length > 1) {
        const disclosure = el('span', 'exam-jump-disclosure');
        disclosure.dataset.expanded = String(expanded); disclosure.setAttribute('aria-hidden', 'true');
        disclosure.appendChild(el('span', 'exam-jump-number-chevron')); button.appendChild(disclosure);
      }
      if (current && posKey(current) === posKey(target)) {
        button.setAttribute('aria-current', 'page');
        if (types.length < 2) {
          const check = el('span', 'exam-jump-check'); check.setAttribute('aria-hidden', 'true'); button.appendChild(check);
        }
      }
      list.appendChild(button);
    });
    layout.appendChild(list);
    const detail = el('div', 'exam-jump-types'); detail.id = 'examJumpTypes'; detail.hidden = !typesExpanded;
    const chosen = selectedTrainer && jumpCatalog.trainers[selectedTrainer];
    if (chosen) {
      const head = el('div', 'exam-jump-type-head'); head.appendChild(el('span', '', chosen.name));
      const resume = menuButton('exam-jump-resume', 'Продолжить', guarded('navigate', () => navigatePosition(trainerTarget(chosen))));
      resume.dataset.continue = selectedTrainer; head.appendChild(resume); detail.appendChild(head);
      const groups = el('div', 'exam-jump-type-groups');
      const grouped = new Map();
      trainerTypes(selectedTrainer).forEach(type => { const key = type.group || ''; if (!grouped.has(key)) grouped.set(key, []); grouped.get(key).push(type); });
      grouped.forEach((types, title) => {
        const group = el('div', 'exam-jump-type-group');
        if (title) group.appendChild(el('div', 'exam-jump-group-title', title));
        const grid = el('div', 'exam-jump-type-grid');
        types.forEach(type => {
          const button = menuButton('exam-jump-type', type.title, guarded('navigate', () => navigatePosition(trainerTarget(chosen), type.token)));
          button.dataset.type = type.token;
          if (current && posKey(current) === posKey(trainerTarget(chosen)) && currentTypeToken() === type.token) button.setAttribute('aria-current', 'page');
          grid.appendChild(button);
        });
        group.appendChild(grid); groups.appendChild(group);
      });
      detail.appendChild(groups);
    }
    layout.appendChild(detail); content.appendChild(layout);
    jumpBody.replaceChildren(content);
    jumpMenu.scrollTop = 0;
    positionJumpMenu();
    if (typesExpanded) list.scrollTop = oldScroll;
    if (focusSelector) {
      const focusTarget = jumpBody.querySelector(focusSelector);
      if (focusTarget) focusTarget.focus({ preventScroll: true });
      if (focusTarget && focusTarget.matches('.exam-jump-number')) focusTarget.scrollIntoView({ block: 'nearest' });
    }
  }
  async function openJumpMenu() {
    if (!jumpMenu.hidden) { closeJumpMenu(true); return; }
    browseSubject = subjectId;
    browseExam = catalogExamId;
    jumpMenu.dataset.subject = subjectId;
    jumpMenu.hidden = false;
    jumpTrigger.setAttribute('aria-expanded', 'true');
    jumpBody.replaceChildren(el('p', 'exam-jump-status', 'Загрузка списка…'));
    positionJumpMenu();
    try {
      jumpCatalog = await loadCatalog();
      await refreshLiveUnits();
      const current = EXAM.list[curIndex()];
      selectedTrainer = current ? Object.keys(jumpCatalog.trainers).find(id => {
        const t = jumpCatalog.trainers[id]; return t.href && posKey(trainerTarget(t)) === posKey(current);
      }) : null;
      typesExpanded = selectedTrainer ? trainerTypes(selectedTrainer).length > 1 : false;
      if (!jumpMenu.hidden) renderJumpMenu();
    } catch (error) {
      if (jumpMenu.hidden) return;
      const status = el('p', 'exam-jump-status', 'Не удалось загрузить список.');
      const retry = menuButton('exam-jump-exam', 'Повторить', () => { closeJumpMenu(); openJumpMenu(); });
      jumpBody.replaceChildren(status, retry);
    }
  }
  function mountJumpMenu() {
    document.documentElement.dataset.examSubject = subjectId;
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = new URL('exam-nav.css', assetBase).href;
    document.head.appendChild(stylesheet);
    jumpTrigger = document.querySelector('.exam-nav-text');
    jumpTrigger.setAttribute('aria-expanded', 'false');
    jumpTrigger.setAttribute('aria-controls', 'examJumpMenu');
    jumpTrigger.setAttribute('aria-label', 'Выбрать предмет и номер задания');
    jumpTrigger.addEventListener('click', openJumpMenu);
    jumpMenu = el('div', 'exam-jump-menu');
    jumpMenu.id = 'examJumpMenu';
    jumpMenu.hidden = true;
    jumpMenu.setAttribute('role', 'region');
    jumpMenu.setAttribute('aria-label', 'Переход к заданию');
    const head = el('div', 'exam-jump-head');
    head.appendChild(el('span', '', 'Перейти к заданию'));
    const close = menuButton('exam-jump-close', null, () => closeJumpMenu(true));
    close.setAttribute('aria-label', 'Закрыть меню');
    head.appendChild(close);
    jumpBody = el('div', 'exam-jump-body');
    jumpMenu.append(head, jumpBody);
    document.body.appendChild(jumpMenu);
    document.addEventListener('click', event => {
      // Путь сохраняет клик внутри меню, даже если его кнопки уже пересобраны.
      const path = event.composedPath();
      if (!path.includes(jumpMenu) && !path.includes(jumpTrigger)) closeJumpMenu();
    });
    document.addEventListener('keydown', event => {
      if (jumpMenu.hidden) return;
      if (event.key === 'Escape') { event.preventDefault(); closeJumpMenu(true); }
      if (event.key === 'ArrowDown' && event.target === jumpTrigger) {
        event.preventDefault();
        const first = jumpBody.querySelector('button');
        if (first) first.focus();
      }
      if (event.key === 'ArrowRight' && event.target.matches('.exam-jump-number[aria-expanded="true"]')) {
        const first = jumpBody.querySelector('.exam-jump-type'); if (first) { event.preventDefault(); first.focus(); }
      }
      if (event.key === 'ArrowLeft' && event.target.matches('.exam-jump-type')) {
        const number = jumpBody.querySelector('.exam-jump-number[aria-expanded="true"]'); if (number) { event.preventDefault(); number.click(); }
      }
    });
    window.addEventListener('resize', positionJumpMenu);
    window.addEventListener('scroll', positionJumpMenu, true);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', positionJumpMenu);
      window.visualViewport.addEventListener('scroll', positionJumpMenu);
    }
    new MutationObserver(() => {
      if (document.documentElement.dataset.focus === 'on') closeJumpMenu();
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-focus'] });
  }

  /* ── «＋ В вариант» (этап 6 конструктора вариантов) ──
     Кнопка справа от стрелок: кладёт в Набор (variant-set.js) строку-рецепт —
     «это задание» / «этот прототип ×N» / «весь номер». Что сейчас на экране,
     говорит каталог тренажёра (__trainerCatalog.current()); сама кнопка
     ничего не пишет в тренажёр и ничего не шлёт в совместную сессию.
     Видна только вошедшему учителю: ученику в сессии, панели доски и кадру
     ученика она не нужна, а без входа Набор некому собирать */
  const VB_MAX = 30;
  let vbBtn = null, vbPop = null, vbBadge = null, vbMsg = null, vbBody = null;
  let vbH1 = null;
  let vbAuth = false, vbCountN = 3, vbSb = null;
  function vbClient() {
    if (vbSb) return vbSb;
    try { if (window.CabinetCloud && window.CabinetCloud.client && window.CabinetCloud.client()) return (vbSb = window.CabinetCloud.client()); } catch (e) {}
    const cfg = window.SUPABASE_CONFIG || {};
    if (!cfg.url || !cfg.anonKey || !window.supabase || !window.supabase.createClient) return null;
    // общий клиент страницы — тот же, что у student-memory.js (см. там, client())
    if (window.__mathhSb) return (vbSb = window.__mathhSb);
    try { vbSb = (window.rtGuard || (c => c))(window.supabase.createClient(cfg.url, cfg.anonKey)); } catch (e) { vbSb = null; }
    if (vbSb) window.__mathhSb = vbSb;
    return vbSb;
  }
  async function vbRefreshAuth() {
    const c = vbClient();
    let ok = false;
    if (c) { try { const r = await c.auth.getSession(); ok = !!(r && r.data && r.data.session); } catch (e) {} }
    vbAuth = ok;
    vbSync();
  }
  function vbFollower() {
    try { if (window.StudentMemory && window.StudentMemory.isFollower) return !!window.StudentMemory.isFollower(); } catch (e) {}
    const ts = TS();
    try { if (ts && ts.getCode && ts.getCode() && ts.isLeader && !ts.isLeader()) return true; } catch (e) {}
    if (ssGet('tsTab:role') === 'follower' || params.get('s')) return true;
    return window.name === 'tsStageFrame';
  }
  const vbReady = () => !!(window.VariantSet && window.ExamSpec && window.__trainerCatalog);
  const vbShown = () => !panelFrameId && vbReady() && vbAuth && !vbFollower();
  function vbCur() {
    try { return window.__trainerCatalog && window.__trainerCatalog.current ? window.__trainerCatalog.current() : null; } catch (e) { return null; }
  }
  function vbSpec() { return window.ExamSpec ? window.ExamSpec.find(slug, curN()) : null; }
  function vbRow(kind, cur, n) {
    const sp = vbSpec();
    if (!sp) return null;
    const title = EXAMS[sp.exam] ? EXAMS[sp.exam].title : sp.exam;
    const from = title + ' ' + sp.label;
    const row = { exam: sp.exam, slug: sp.slug, n: sp.n == null ? null : sp.n, tid: null, href: sp.slug + '.html' + (sp.n != null ? '?n=' + sp.n : ''),
      proto: null, pos: null, fipi: null, count: 1, source: 'order', from: from };
    if (kind === 'task') {
      row.proto = cur.proto; row.pos = cur.pos; row.fipi = cur.fipi;
      row.from = from + ', ФИПИ ' + cur.fipi;
    } else if (kind === 'proto') {
      row.proto = cur.proto; row.count = n;
      row.from = from + ', прототип ' + cur.proto;
    }
    return row;
  }
  // та же строка (номер, прототип, место) уже в Наборе — прибавляем количество
  function vbAdd(kind, n) {
    const cur = vbCur();
    if ((kind === 'task' && !(cur && cur.fipi)) || (kind === 'proto' && !(cur && cur.proto))) return null;
    const row = vbRow(kind, cur, n);
    if (!row) return null;
    const same = window.VariantSet.all().find(x => x.exam === row.exam && x.slug === row.slug && (x.n == null ? null : x.n) === row.n
      && (x.proto || null) === row.proto && (x.pos == null ? null : x.pos) === row.pos && (x.fipi || null) === row.fipi);
    if (same) {
      const total = Math.min(VB_MAX, (same.count || 1) + row.count);
      window.VariantSet.update(same.id, { count: total });
      return 'уже в наборе, теперь ×' + total;
    }
    window.VariantSet.add(row);
    return 'добавлено в набор' + (row.count > 1 ? ' ×' + row.count : '');
  }
  function vbSync() {
    if (!vbBtn) return;
    const show = vbShown();
    if (show && !vbBtn.isConnected && vbH1) vbH1.appendChild(vbBtn);
    if (!show && vbBtn.isConnected) vbBtn.remove();
    vbBtn.hidden = !show;
    if (!show && vbPop && !vbPop.hidden) vbClose();
    if (!show) return;
    const c = window.VariantSet.count();
    vbBadge.textContent = c ? String(c) : '';
    vbBadge.hidden = !c;
    const label = 'В вариант' + (c ? ': в наборе ' + c : '');
    vbBtn.title = label + '. Shift — сразу «Это задание»';
    vbBtn.setAttribute('aria-label', label);
    if (vbPop && !vbPop.hidden) vbRender(true);
  }
  function vbPosition() {
    if (!vbPop || vbPop.hidden) return;
    const r = vbBtn.getBoundingClientRect(), w = Math.min(320, innerWidth - 24);
    vbPop.style.width = w + 'px';
    vbPop.style.left = Math.max(12, Math.min(innerWidth - w - 12, r.right - w)) + 'px';
    vbPop.style.top = Math.min(innerHeight - 80, r.bottom + 8) + 'px';
  }
  function vbClose(focus) {
    if (!vbPop || vbPop.hidden) return;
    vbPop.hidden = true;
    vbBtn.setAttribute('aria-expanded', 'false');
    if (focus) vbBtn.focus();
  }
  function vbRender() {
    const cur = vbCur(), count = window.VariantSet.count();
    vbBody.textContent = '';
    const doAdd = (kind, n) => () => {
      const msg = vbAdd(kind, n);
      vbRender();
      vbMsg.textContent = msg || 'Сейчас на экране нет такого задания';
    };
    const row = (label, hint, ok, extra, action) => {
      const line = el('div', 'vb-row');
      const b = el('button', 'vb-add');
      b.type = 'button';
      b.disabled = !ok;
      b.append(el('span', 'vb-t', label), el('span', 'vb-h', hint));
      if (action) b.addEventListener('click', action);
      line.appendChild(b);
      if (extra) line.appendChild(extra);
      return line;
    };
    vbBody.appendChild(row('Это задание',
      cur && cur.fipi ? 'ФИПИ ' + cur.fipi : (cur ? 'у этого задания нет номера ФИПИ' : 'сначала откройте задание'),
      !!(cur && cur.fipi), null, doAdd('task', 1)));
    const step = el('div', 'vb-step');
    const minus = el('button', 'vb-sb', '−'), plus = el('button', 'vb-sb', '+'), val = el('span', 'vb-n', '×' + vbCountN);
    minus.type = plus.type = 'button';
    minus.id = 'vbMinus'; plus.id = 'vbPlus'; val.id = 'vbCountVal';
    minus.setAttribute('aria-label', 'Меньше'); plus.setAttribute('aria-label', 'Больше');
    minus.disabled = vbCountN <= 1; plus.disabled = vbCountN >= VB_MAX;
    minus.addEventListener('click', () => { vbCountN = Math.max(1, vbCountN - 1); vbRender(); });
    plus.addEventListener('click', () => { vbCountN = Math.min(VB_MAX, vbCountN + 1); vbRender(); });
    step.append(minus, val, plus);
    const protoRow = row('Этот прототип ×' + vbCountN, cur && cur.proto ? 'ещё ' + vbCountN + ' из его банка' : 'сначала откройте задание',
      !!(cur && cur.proto), step, doAdd('proto', vbCountN));
    protoRow.firstChild.id = 'vbAddProto';
    vbBody.appendChild(protoRow);
    vbBody.firstChild.firstChild.id = 'vbAddTask';
    const all = row('Весь номер ×1', 'один прототип с заданиями ФИПИ', true, null, doAdd('all', 1));
    all.firstChild.id = 'vbAddAll';
    vbBody.appendChild(all);
    const foot = el('div', 'vb-foot');
    const go = el('a', 'vb-go', 'Собрать работу →');
    go.id = 'vbGo';
    go.href = 'works.html#/build';
    const cnt = el('span', 'vb-cnt', 'В наборе: ' + count);
    cnt.id = 'vbCount';
    foot.append(go, cnt);
    vbBody.appendChild(foot);
  }
  function vbOpen() {
    vbMsg.textContent = '';
    vbPop.hidden = false;
    vbBtn.setAttribute('aria-expanded', 'true');
    vbRender();
    vbPosition();
  }
  function mountVariant(h1) {
    const style = document.createElement('style');
    style.id = 'examVariantStyle';
    style.textContent = VB_CSS;
    document.head.appendChild(style);
    vbBtn = el('button', 'exam-nav-btn exam-vb-btn');
    vbBtn.type = 'button';
    vbBtn.id = 'examVariantBtn';
    vbBtn.setAttribute('aria-haspopup', 'true');
    vbBtn.setAttribute('aria-expanded', 'false');
    vbBadge = el('span', 'vb-badge'); vbBadge.hidden = true;
    vbBtn.append(el('span', 'vb-plus', '＋'), el('span', 'vb-label', 'В вариант'), vbBadge);
    vbH1 = h1;   // в заголовок кнопка встаёт, только когда видна (vbSync): остальным он остаётся как был
    vbPop = el('div', 'exam-vb-pop');
    vbPop.id = 'examVariantPop';
    vbPop.hidden = true;
    vbPop.setAttribute('role', 'dialog');
    vbPop.setAttribute('aria-label', 'Добавить в вариант');
    vbMsg = el('div', 'vb-msg');
    vbMsg.id = 'vbMsg';
    vbMsg.setAttribute('aria-live', 'polite');
    vbBody = el('div', 'vb-body');
    vbPop.append(vbBody, vbMsg);
    document.body.appendChild(vbPop);
    vbBtn.addEventListener('click', event => {
      if (event.shiftKey) {
        const msg = vbAdd('task', 1);
        vbOpen();
        vbMsg.textContent = msg || 'Сейчас на экране нет задания с номером ФИПИ';
        return;
      }
      if (vbPop.hidden) vbOpen(); else vbClose();
    });
    document.addEventListener('click', event => {
      if (vbPop.hidden) return;
      const path = event.composedPath();
      if (!path.includes(vbPop) && !path.includes(vbBtn)) vbClose();
    });
    document.addEventListener('keydown', event => { if (event.key === 'Escape') vbClose(true); });
    window.addEventListener('resize', vbPosition);
    window.addEventListener('variantset:change', vbSync);
    window.addEventListener('focus', vbRefreshAuth);
    setInterval(vbRefreshAuth, 20000);
    vbRefreshAuth();
  }

  const VB_CSS = `
.exam-vb-btn{position:relative;width:auto;min-width:34px;padding:0 12px;border-radius:17px;gap:5px}
.exam-vb-btn[hidden]{display:none}
.exam-vb-btn .vb-plus{font-size:15px}
.exam-vb-btn .vb-badge{position:absolute;top:-6px;right:-6px;min-width:17px;height:17px;padding:0 4px;box-sizing:border-box;border-radius:9px;background:var(--ink);color:var(--bg,#fff);font-size:10px;line-height:17px;text-align:center;font-weight:700}
.exam-vb-btn .vb-badge[hidden]{display:none}
@media (max-width:640px){
  .exam-vb-btn{width:30px;min-width:30px;padding:0;border-radius:50%}
  .exam-vb-btn .vb-label{display:none}
}
@media (max-width:360px){.exam-vb-btn{width:28px;min-width:28px}}
.exam-vb-pop{position:fixed;z-index:1100;box-sizing:border-box;padding:12px;border:1px solid var(--glass-border);border-radius:20px;background:#fafbfe;color:var(--pencil,#1d1d1f);font-family:var(--font-ui,system-ui,sans-serif);font-size:14px;line-height:1.35;box-shadow:inset 0 1px 0 var(--glass-inset),0 20px 48px rgba(20,30,60,.16);pointer-events:auto;text-align:left;letter-spacing:0;font-weight:400}
.exam-vb-pop[hidden]{display:none}
html[data-theme="dark"] .exam-vb-pop{background:#1e2540;box-shadow:inset 0 1px 0 var(--glass-inset),0 20px 48px rgba(0,0,0,.5)}
.exam-vb-pop *{box-sizing:border-box}
.exam-vb-pop button{font:inherit;cursor:pointer;touch-action:manipulation;color:inherit}
.vb-row{display:flex;align-items:center;gap:8px;margin-bottom:6px}
.vb-add{flex:1;min-width:0;display:flex;flex-direction:column;align-items:flex-start;gap:1px;min-height:44px;padding:7px 12px;border:1px solid var(--glass-border);border-radius:12px;background:transparent;text-align:left}
.vb-add:hover:not(:disabled){border-color:var(--ink)}
.vb-add:disabled{opacity:.45;cursor:default}
.vb-t{font-weight:650}
.vb-h{font-size:12px;opacity:.7;overflow-wrap:anywhere}
.vb-step{display:flex;align-items:center;gap:4px;flex:none}
.vb-sb{width:40px;height:40px;padding:0;border:1px solid var(--glass-border);border-radius:50%;background:transparent}
.vb-sb:disabled{opacity:.35;cursor:default}
.vb-n{min-width:34px;text-align:center;font-weight:650}
.vb-foot{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:8px;padding-top:10px;border-top:1px solid var(--glass-border)}
.vb-go{font-weight:700;color:var(--ink);text-decoration:none}
.vb-go:hover{text-decoration:underline}
.vb-cnt{font-size:12px;opacity:.7}
.vb-msg{margin-top:6px;font-size:12.5px;font-weight:600}
.vb-msg:empty{display:none}
`;

  /* ── кнопки ── */
  const CSS = `
h1.exam-nav-h1{display:flex;align-items:center;justify-content:center;gap:12px;max-height:150px;}
h1.exam-nav-h1 .exam-nav-text{min-width:0;}
/* вид — как у стрелок «◀ Предыдущий прототип / Следующий прототип ▶», только
   кнопка круглая и без подписи. .wrap у тренажёров не ловит мышь (под ним
   доска), поэтому pointer-events возвращаем явно */
.exam-nav-btn{pointer-events:auto;flex:0 0 auto;width:34px;height:34px;padding:0;border:1px solid var(--glass-border);border-radius:50%;background:var(--glass-strong);backdrop-filter:blur(14px) saturate(160%);-webkit-backdrop-filter:blur(14px) saturate(160%);color:var(--ink);font-family:var(--font-ui);font-weight:600;font-size:13px;line-height:1;letter-spacing:0;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;transition:transform .12s, border-color .12s, opacity .12s;}
.exam-nav-btn:hover:not(:disabled){border-color:var(--ink)}
.exam-nav-btn:active:not(:disabled){transform:scale(.9)}
.exam-nav-btn:disabled{opacity:.3;cursor:default}
/* пока .wrap доходит до краёв экрана, в углах над заголовком висят круглые
   кнопки страницы (position:fixed, 40px + отступ 16px): слева «домой»,
   справа в верхнем ряду две (совместный доступ и тема), под ними по одной
   (доска, фокус). Заголовок со стрелками сдвигаем внутрь, чтобы стрелки не
   легли под эти кнопки: на планшете — отступом на два ряда кнопок, на
   телефоне так не хватает ширины, поэтому заголовок опускается под верхний
   ряд, а сбоку остаётся отступ на одну кнопку. 1080 = самый широкий
   .wrap (860) + по 104 с каждой стороны */
@media (max-width:1080px){
  h1.exam-nav-h1{padding:0 104px;box-sizing:border-box}
}
@media (max-width:640px){
  h1.exam-nav-h1{padding:0 44px;margin-top:44px}
}
@media (max-width:520px){
  h1.exam-nav-h1{gap:6px;font-size:21px}
  h1.exam-nav-h1 .exam-nav-text{overflow-wrap:anywhere}
  .exam-nav-btn{width:30px;height:30px;font-size:12px}
}
@media (max-width:360px){
  h1.exam-nav-h1{font-size:18px}
  .exam-nav-btn{width:28px;height:28px;font-size:11px}
}`;
  let prevBtn = null, nextBtn = null;
  function makeBtn(id, glyph, delta) {
    const b = document.createElement('button');
    b.type = 'button';
    b.id = id;
    b.className = 'exam-nav-btn';
    b.textContent = glyph;
    b.onclick = guarded('navigate', () => go(delta));
    return b;
  }
  function render() {
    if (!prevBtn) return;
    const i = curIndex();
    const prev = i >= 0 ? EXAM.list[i - 1] : null;
    const next = i >= 0 ? EXAM.list[i + 1] : null;
    prevBtn.disabled = !prev;
    nextBtn.disabled = !next;
    const tip = (p, word) => p ? word + ': ' + EXAM.title + ' ' + p.label : '';
    prevBtn.title = tip(prev, 'Предыдущее задание') || 'Это первое задание ' + EXAM.title;
    nextBtn.title = tip(next, 'Следующее задание') || 'Это последнее задание ' + EXAM.title;
    prevBtn.setAttribute('aria-label', prevBtn.title);
    nextBtn.setAttribute('aria-label', nextBtn.title);
  }
  function mountButtons() {
    const h1 = document.querySelector('.wrap h1') || document.querySelector('h1');
    if (!h1 || h1.classList.contains('exam-nav-h1')) return;
    const style = document.createElement('style');
    style.id = 'examNavStyle';
    style.textContent = CSS;
    document.head.appendChild(style);
    // текст заголовка — в свой элемент: ЕГЭ-страница меняет его (номер в
    // заголовке), и стрелки при этом не должны пропадать
    const text = document.createElement('button');
    text.type = 'button';
    text.className = 'exam-nav-text';
    const label = document.createElement('span');
    while (h1.firstChild) label.appendChild(h1.firstChild);
    text.appendChild(label);
    const chevron = el('span', 'exam-jump-chevron');
    chevron.setAttribute('aria-hidden', 'true');
    text.appendChild(chevron);
    prevBtn = makeBtn('examPrevBtn', '◀', -1);
    nextBtn = makeBtn('examNextBtn', '▶', 1);
    h1.classList.add('exam-nav-h1');
    h1.appendChild(prevBtn);
    h1.appendChild(text);
    h1.appendChild(nextBtn);
    mountVariant(h1);
    mountJumpMenu();
    render();
  }

  /* ── запуск ── */
  // промис подключения к сессии: TrainerSession.init страница зовёт сама,
  // здесь только подслушиваем его результат (скрипт подключён сразу после
  // session-share.js, до основного скрипта страницы). Нужен, чтобы после
  // подключения проверить: не увёл ли снимок из базы страницу с номера,
  // на который учитель пришёл стрелкой
  let sessionReady = null;
  (function wrapInit() {
    const ts = TS();
    if (!ts || typeof ts.init !== 'function' || ts.__examNavWrapped) return;
    const orig = ts.init;
    ts.init = function () {
      const p = orig.apply(this, arguments);
      sessionReady = Promise.resolve(p).catch(() => {});
      return p;
    };
    ts.__examNavWrapped = true;
  })();

  function arrive() {
    const mark = ssGet(ARRIVE_KEY);
    const type = params.get('en_type');
    if (type && /^[mpgrw]:.{1,180}$/.test(type)) {
      const target = { slug, n: Number(params.get('n')) || null };
      if (mark && mark.key === posKey(target)) ssSet(ARRIVE_KEY, null);
      Promise.resolve(sessionReady).then(async () => {
        const ts = TS();
        // Ученик получает выбранный тип штатным снимком учителя, а не
        // самостоятельным щелчком по запрещённой ему карточке.
        if (!ts || !ts.isLeader || ts.isLeader()) {
          const ok = await applyType(target, type);
          if (!ok) showTypeError(target); else { render(); record(); }
        }
        const url = new URL(location.href); url.searchParams.delete('en_type'); history.replaceState(null, '', url);
      });
      return;
    }
    const i = curIndex();
    if (!mark || i < 0 || mark.key !== posKey(EXAM.list[i])) return;
    ssSet(ARRIVE_KEY, null);
    if (!(Date.now() - (mark.at || 0) < ARRIVE_TTL_MS)) return;
    const pos = EXAM.list[i];
    openHere(pos);
    const want = screenSig();
    if (sessionReady) {
      sessionReady.then(() => setTimeout(() => {
        // присоединившегося уводит за учителем сама сессия — не мешаем
        const ts = TS();
        if (ts && ts.isLeader && !ts.isLeader()) return;
        if (curIndex() === i && screenSig() !== want) openHere(pos);
      }, 0));
    }
  }

  function start() {
    syncTouchTargets();
    mountButtons();
    arrive();
    record();
    // номер в ЕГЭ может смениться и без стрелок (сессия, возврат по адресу),
    // а прототип — открыт и тут же закрыт возвратом к списку: стрелки и
    // память догоняют таймером, тем же шагом, что и таймер сессии (300 мс) —
    // быстрее человек не успеет открыть прототип и уйти с него
    setInterval(() => { render(); record(); vbSync(); }, 300);
    window.addEventListener('pagehide', record);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();

  window.ExamNav = { exam: examId, list: EXAM.list, go: go, record: record };
})();
