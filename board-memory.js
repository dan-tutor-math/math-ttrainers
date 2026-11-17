/* ==========================================================
   board-memory.js — память заданий ученика на доске (задача Б3 плана
   кабинета, claude-notes/cabinet-plan.md).

   Что делает:
   - событие board, когда задание легло на доску — любым путём: панель на
     доске, телефон-панель (boards-panel.html), «ещё такое же», ручное
     размещение. Все они сходятся в insertTaskImage (boards-core.js),
     оттуда и зовётся taskAdded;
   - ok / bad, когда ответ в поле задания проверили — у себя (commitTaskState)
     или собеседник на общей доске (boardsApplyTaskLive): ученик решает со
     своего устройства, а сессия идёт в браузере преподавателя;
   - подпись у текущего задания в панели тренажёров: было ли оно у ученика;
   - метка над каждым заданием на доске: было ли оно у ученика, с «✕» —
     забыть это задание у ученика (17.11, просьба Даниила);
   - кнопка «Начать сессию» на открытой своей доске: если доска привязана к
     ученику (students.boards в кабинете) — сразу с ним.

   Почему так:
   - Пишется ученику ТЕКУЩЕЙ сессии, а не владельцу доски: во время урока
     открывают и чужие доски, а открытие доски сессию не переключает
     (решено в плане). Группа на одной доске — в первой версии один ученик
   - Ключ — поле tkey объекта (А1), а если его нет (старая телефон-панель,
     «ещё такое же») — из рецепта gen. Ничего нового в объект доски не
     пишется: память живёт в student-memory.js, доска и совместная сессия о
     ней не знают
   - Кто ученик, пауза, follower, частота — решает StudentMemory.record, поэтому
     вызовы отсюда безопасны всегда, в том числе у ученика (там просто null)
   ========================================================== */
(function(){
  if (window.BoardMemory) return;
  const SM = () => window.StudentMemory || null;

  function keyOf(obj){
    if (!obj) return null;
    if (typeof obj.tkey === 'string' && obj.tkey) return obj.tkey;
    try { return window.TaskKey && obj.gen ? window.TaskKey.fromRecipe(obj.gen) : null; } catch (e) { return null; }
  }
  // B — текущая доска из boards-core.js (общая глобальная область скриптов)
  function curBoard(){ try { return typeof B !== 'undefined' ? B : null; } catch (e) { return null; } }
  function boardRef(){
    const b = curBoard();
    return b ? String(b.cloudBoardId || b.id || '') : '';
  }
  function rec(key, event){
    const m = SM();
    if (!m || !key) return null;
    try { return m.record(key, event, { source: 'board', srcRef: boardRef() }); } catch (e) { return null; }
  }

  function taskAdded(obj){
    // теория и картинки без ключа — не задание
    const r = rec(keyOf(obj), 'board');
    renderLabel();
    return r;
  }

  // prev — итог до проверки. ok с первой попытки — ok; неверно — bad; верно
  // после ошибки — тоже bad (как в тренажёрах, Б2): если сообщение о
  // неверной попытке собеседника не дошло, bad всё равно запишется, а
  // дубль в 10 минут отсекает StudentMemory
  function taskChecked(obj, prev){
    const st = obj && obj.task && obj.task.st;
    if (!st || (st.res !== 'ok' && st.res !== 'bad')) return null;
    const tries = Number(st.tries) || 1;
    // присланное собеседником состояние без новой попытки (повтор, ↺) — не проверка
    if (prev && (Number(prev.tries) || 0) >= tries && prev.res === st.res) return null;
    return rec(keyOf(obj), st.res === 'ok' && tries <= 1 ? 'ok' : 'bad');
  }

  /* ── кнопка «Начать сессию» на доске ──
     Только у открытой доски с полным доступом: на чужой доске ученика с
     правами «своё» / «просмотр» и на списке досок выбирать некого */
  function pickerContext(){
    try {
      const b = curBoard();
      if (!b || typeof boardActive === 'undefined' || !boardActive) return null;
      if (typeof boardAccess !== 'undefined' && boardAccess !== 'full') return null;
      return { boards: [b.cloudBoardId, b.id].filter(Boolean).map(String) };
    } catch (e) { return null; }
  }

  /* ── подпись у текущего задания в панели тренажёров ──
     Только преподавателю: есть сессия, не follower, подписи не выключены.
     Элемент живёт в разметке страницы (не в доске) и в сессию не уходит */
  function labelsMode(){
    try { if (window.TeacherSettings) return window.TeacherSettings.get(); } catch (e) {}
    // teacher-settings.js на доске не подключён — читаем его копию в
    // localStorage (тот же ключ), значения по умолчанию те же
    const d = { labels: 'show', labelDates: true, labelCount: true };
    try {
      const s = JSON.parse(localStorage.getItem('teacher:settings:v1') || 'null') || {};
      if (['show', 'off', 'hide_solved'].indexOf(s.labels) >= 0) d.labels = s.labels;
      if (typeof s.labelDates === 'boolean') d.labelDates = s.labelDates;
      if (typeof s.labelCount === 'boolean') d.labelCount = s.labelCount;
    } catch (e) {}
    return d;
  }
  // ключ задания, открытого сейчас в кадре панели (то, что «Добавить» положит)
  function frameTaskKey(){
    if (!window.TaskKey) return null;
    let tid = null, win = null;
    try { tid = typeof trainersOpenId !== 'undefined' ? trainersOpenId : null; } catch (e) {}
    const fr = document.getElementById('bdTrainersIframe');
    try { win = fr && fr.contentWindow; void win.document; } catch (e) { win = null; }
    if (!tid || !win) return null;
    try {
      const page = window.TaskKey.canonPage(tid);
      if (typeof isEgeLikeTrainer === 'function' && isEgeLikeTrainer(tid)){
        const pid = trainerEval(win, 'S.pid');
        return pid != null ? window.TaskKey.fromTask(page, { id: String(pid) }) : null;
      }
      const api = win.__trainerState;
      const st = api && api.get ? api.get(-1) : (typeof win.tsGetState === 'function' ? win.tsGetState() : null);
      const k = st ? window.TaskKey.fromState(page, st) : null;
      if (k) return k;
      const nav = win.__examNav;
      const pid = nav && typeof nav.pid === 'function' ? nav.pid() : null;
      return pid ? window.TaskKey.fromTask(page, { id: pid }) : null;
    } catch (e) { return null; }
  }
  function fmtDate(t){
    const d = new Date(t);
    return String(d.getDate()).padStart(2, '0') + '.' + String(d.getMonth() + 1).padStart(2, '0');
  }
  function labelText(s, name, opt){
    if (!s || !s.total) return 'Новое для ' + name;
    const part = (e, word) => {
      const b = s[e];
      if (!b) return '';
      return word + (opt.labelDates ? ' ' + fmtDate(b.last) : '') + (opt.labelCount && b.n > 1 ? ' ×' + b.n : '');
    };
    return [part('hw', 'в ДЗ'), part('board', 'на доске'), part('ok', 'верно'), part('bad', 'неверно')].filter(Boolean).join(' · ');
  }
  let labelEl = null, labelSig = '';
  function renderLabel(){
    const row = document.getElementById('bdTrainersActions');
    if (!row) return;
    const m = SM();
    let text = '', key = null;
    const cur = m && !m.isFollower() ? m.current() : null;
    if (cur && labelsMode().labels !== 'off'){
      key = frameTaskKey();
      if (key) text = labelText(m.summary(key), cur.name || 'ученика', labelsMode());
    }
    const sig = key + '|' + text;
    if (sig === labelSig) return;
    labelSig = sig;
    if (!text){ if (labelEl) { labelEl.remove(); labelEl = null; } return; }
    if (!labelEl){
      // отдельная плашка над рядом кнопок, а не в нём: ряд — однострочный
      // flex по центру, лишний элемент сдвинул бы кнопки
      labelEl = document.createElement('div');
      labelEl.id = 'bdTrainersMem';
      labelEl.className = 'bd-trainers-mem';
      labelEl.style.cssText = 'position:absolute;left:50%;bottom:64px;transform:translateX(-50%);z-index:3;max-width:calc(100% - 24px);' +
        'font:600 12px/1.3 var(--font-ui,system-ui);color:var(--ink,#222);background:var(--card,#fff);border-radius:999px;padding:4px 10px;' +
        'box-shadow:0 2px 10px rgba(0,0,0,.18);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;pointer-events:none';
      row.parentNode.insertBefore(labelEl, row);
    }
    labelEl.textContent = text;
    labelEl.title = key;
  }

  /* ── метка «уже было у ученика» у заданий на самой доске ──
     Зовётся из syncTaskOverlays (boards-core.js) на каждый кадр для задания в
     кадре; узел живёт в живом слое задания (.bd-task), поэтому едет и
     масштабируется вместе с ним, режется верхними карточками и уходит, когда
     задание вышло из кадра. В данные доски и в совместную сессию ничего не
     пишется — только DOM у преподавателя.
     Почему кеш по memVer: сводка читает копию журнала из localStorage, а кадров
     в секунду десятки — пересчитываем, только когда журнал, ученик или
     настройка подписей поменялись */
  let memVer = 1;
  // зовётся на каждый кадр для каждого задания — ответ держим до смены memVer
  // и не дольше секунды (настройку могли поменять в этой же вкладке)
  let onCache = null;
  function marksOn(){
    const now = Date.now();
    if (onCache && onCache.v === memVer && now - onCache.t < 1000) return onCache.on;
    const m = SM();
    let on = false;
    try { on = !!(m && !m.isFollower() && m.current() && labelsMode().labels !== 'off'); } catch (e) {}
    onCache = { v: memVer, t: now, on };
    return on;
  }
  const MARK_CSS = `
.bd-mem{position:absolute;left:0;bottom:100%;margin-bottom:5px;pointer-events:auto;display:flex;align-items:center;gap:6px;
  max-width:max(100%,220px);box-sizing:border-box;padding:3px 4px 3px 9px;border-radius:999px;background:var(--glass-strong,#fff);
  color:var(--pencil,#222);box-shadow:0 1px 6px rgba(0,0,0,.22);font:600 12px/1.25 var(--font-ui,system-ui);white-space:nowrap;}
.bd-mem::before{content:'';flex:0 0 auto;width:8px;height:8px;border-radius:50%;background:var(--muted-3,#8a8a8a);}
.bd-mem[data-last="ok"]::before{background:var(--ok,#2e9e5b);}
.bd-mem[data-last="bad"]::before{background:#d9822b;}
.bd-mem-t{overflow:hidden;text-overflow:ellipsis;min-width:0;}
.bd-mem button{flex:0 0 auto;border:none;background:none;color:inherit;font:inherit;cursor:pointer;border-radius:999px;padding:1px 7px;opacity:.7;}
.bd-mem button:hover{opacity:1;background:var(--hover-1,rgba(0,0,0,.08));}
.bd-mem button.yes{opacity:1;background:var(--ink,#222);color:#fff;}`;
  function markCss(){
    if (document.getElementById('bdMemCss')) return;
    const st = document.createElement('style');
    st.id = 'bdMemCss';
    st.textContent = MARK_CSS;
    document.head.appendChild(st);
  }
  function markTask(root, obj){
    if (!root) return;
    let el = root.querySelector(':scope > .bd-mem');
    const key = marksOn() ? keyOf(obj) : null;
    const m = SM();
    const cur = key && m ? m.current() : null;
    const s = cur ? m.summary(key) : null;
    if (!s || !s.total){ if (el) el.remove(); return; }
    // пока открыт вопрос «забыть?», не перерисовываем
    if (el && el.dataset.ask) return;
    const sig = memVer + '|' + key + '|' + cur.id;
    if (el && el.dataset.sig === sig) return;
    markCss();
    if (!el){
      el = document.createElement('div');
      el.className = 'bd-mem';
      el.setAttribute('data-bd-mem', '1');
      // клик по метке — не жест доски и не подъём карточки
      el.addEventListener('pointerdown', e => e.stopPropagation());
      root.appendChild(el);
    }
    el.dataset.sig = sig;
    el.dataset.key = key;
    const last = s.events.length ? s.events[s.events.length - 1].event : '';
    el.dataset.last = last;
    const name = cur.name || 'ученика';
    el.title = 'Было у ' + name + ' (' + key + ')';
    el.innerHTML = '<span class="bd-mem-t"></span><button type="button" data-mem-x="1" title="Убрать из памяти ученика">✕</button>';
    el.firstChild.textContent = name + ': ' + labelText(s, name, labelsMode());
    el.lastChild.onclick = e => { e.stopPropagation(); askForget(el, name); };
  }
  // «✕» — переспросить: удаление строк журнала с сервера не отменить
  function askForget(el, name){
    el.dataset.ask = '1';
    el.innerHTML = '<span class="bd-mem-t"></span><button type="button" class="yes" data-mem-yes="1">Забыть</button><button type="button" data-mem-no="1">Нет</button>';
    el.firstChild.textContent = 'Забыть это задание у ' + name + '?';
    const done = () => { delete el.dataset.ask; el.dataset.sig = ''; redraw(); };
    el.querySelector('[data-mem-no]').onclick = e => { e.stopPropagation(); done(); };
    const yes = el.querySelector('[data-mem-yes]');
    yes.onclick = async e => {
      e.stopPropagation();
      yes.disabled = true;
      try { await SM().forget([el.dataset.key]); done(); }
      catch (err) { yes.disabled = false; yes.textContent = 'Не вышло — ещё раз'; }
    };
  }
  function redraw(){ try { if (typeof scheduleRedraw === 'function') scheduleRedraw(); } catch (e) {} }

  function boot(){
    const m = SM();
    if (m && m.setPickerContext) m.setPickerContext(pickerContext);
    if (m && m.onChange) m.onChange(() => { labelSig = ''; renderLabel(); memVer++; redraw(); });
    // настройку подписей меняют в кабинете (другая вкладка) — перерисовать метки
    window.addEventListener('storage', e => { if (e.key === 'teacher:settings:v1') { memVer++; redraw(); } });
    // задание в кадре меняется без событий (⟳, стрелки, список ФИПИ) —
    // сверяемся раз в секунду, и только пока панель с тренажёром открыта
    setInterval(() => {
      const p = document.getElementById('bdTrainersPanel');
      if (p && p.classList.contains('bd-trainers-in-frame')) renderLabel();
      else if (labelEl) { labelEl.remove(); labelEl = null; labelSig = ''; }
    }, 1000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();

  window.BoardMemory = { keyOf, taskAdded, taskChecked, pickerContext, frameTaskKey, renderLabel, marksOn, markTask };
})();
