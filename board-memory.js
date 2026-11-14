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

  function boot(){
    const m = SM();
    if (m && m.setPickerContext) m.setPickerContext(pickerContext);
    if (m && m.onChange) m.onChange(() => { labelSig = ''; renderLabel(); });
    // задание в кадре меняется без событий (⟳, стрелки, список ФИПИ) —
    // сверяемся раз в секунду, и только пока панель с тренажёром открыта
    setInterval(() => {
      const p = document.getElementById('bdTrainersPanel');
      if (p && p.classList.contains('bd-trainers-in-frame')) renderLabel();
      else if (labelEl) { labelEl.remove(); labelEl = null; labelSig = ''; }
    }, 1000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();

  window.BoardMemory = { keyOf, taskAdded, taskChecked, pickerContext, frameTaskKey, renderLabel };
})();
