/* ==========================================================
   task-captions.js — подписи «это задание уже было у ученика» в тренажёрах и
   переключатель на три положения (задача Б4 плана кабинета,
   claude-notes/cabinet-plan.md).

   Что даёт (window.TaskCaptions):
     active()               — есть кому подписывать: идёт сессия с учеником, это вкладка
                              преподавателя (не follower)
     mode()                 — 'show' / 'off' / 'hide_solved' (вне сессии всегда 'off')
     setMode(m)             — положение переключателя этой вкладки
     keyOfTask(task, mode)  — ключ задания страницы (task-key.js)
     skip(key)              — true, если выбор следующего задания ФИПИ должен пропустить
                              его: положение «скрывать решённые» и у ученика по нему есть события
     skipFipi(page, номер)  — то же по номеру задания банка ФИПИ
     dot(keys)              — неброская точка с всплывашкой (события, даты, счётчик,
                              «забыть это задание»); null — подписывать нечего
     decorate(список, fn)   — точки на карточки списка (fn(карточка) → ключи)
     showCurrent(после, задание, режим) — точка у текущего задания, после узла «после»
     mountToggle(узел, cb)  — переключатель на три положения
     onChange(fn)           — смена сессии / положения (для перерисовки списков)

   Почему так:
   - Всё это только у преподавателя в сессии. У ученика (follower), вне сессии
     и у страниц без student-memory.js модуль молчит: active() === false, ни
     точек, ни переключателя. Ничего отсюда не уходит в состояние совместной
     сессии и в данные доски: подписи — просто узлы страницы.
   - Начальное положение — настройка преподавателя labels (кабинет): читаем
     её копию в localStorage, teacher-settings.js на страницах не нужен.
     Щелчок по переключателю — выбор этой вкладки (sessionStorage), настройку
     в кабинете он не меняет: на уроке «скрыть решённые» — дело минуты.
   - Данные берём из StudentMemory.summary — копия журнала в localStorage,
     читается синхронно; сети модуль не касается (кроме «забыть»).
   ========================================================== */
(function(){
  if (window.TaskCaptions) return;

  const SS_MODE = 'taskCaptions:mode';
  const SETTINGS_KEY = 'teacher:settings:v1';   // тот же ключ, что в teacher-settings.js
  const MODES = ['show', 'off', 'hide_solved'];
  const SM = () => window.StudentMemory || null;
  const IN_TOP = (function(){ try { return window.top === window.self; } catch (e) { return false; } })();

  function ssGet(k){ try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function ssSet(k, v){ try { sessionStorage.setItem(k, v); } catch (e) {} }

  function settings(){
    const d = { labels: 'show', labelDates: true, labelCount: true };
    try {
      const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null') || {};
      if (MODES.indexOf(s.labels) >= 0) d.labels = s.labels;
      if (typeof s.labelDates === 'boolean') d.labelDates = s.labelDates;
      if (typeof s.labelCount === 'boolean') d.labelCount = s.labelCount;
    } catch (e) {}
    return d;
  }
  function student(){
    const m = SM();
    if (!m) return null;
    try { return m.isFollower() ? null : m.current(); } catch (e) { return null; }
  }
  function active(){ return !!student(); }
  function baseMode(){
    const o = ssGet(SS_MODE);
    return MODES.indexOf(o) >= 0 ? o : settings().labels;
  }
  function mode(){ return active() ? baseMode() : 'off'; }
  let sig = '';
  function setMode(m){
    if (MODES.indexOf(m) < 0) return;
    ssSet(SS_MODE, m);
    sig = sigNow();
    fire(true);
  }

  /* ── ключи ── */
  function pageName(){ return (location.pathname.split('/').pop() || '').replace(/\.html$/, ''); }
  function keyOfTask(task, mode_){
    if (!task || !window.TaskKey) return null;
    try {
      const t = (mode_ && task.mode == null) ? Object.assign({}, task, { mode: mode_ }) : task;
      return window.TaskKey.fromTask(pageName(), t);
    } catch (e) { return null; }
  }
  function summaryOf(key){
    const m = SM();
    if (!m || !key) return null;
    try { return m.summary(key); } catch (e) { return null; }
  }
  function hasEvents(key){ const s = summaryOf(key); return !!(s && s.total); }
  // пропускаем только задания банка ФИПИ: это «выбор следующего задания ФИПИ»
  function skip(key){
    return !!key && key.indexOf('fipi:') === 0 && mode() === 'hide_solved' && hasEvents(key);
  }
  function skipFipi(page, fipi){
    if (!active() || mode() !== 'hide_solved' || !window.TaskKey) return false;
    try { return skip(window.TaskKey.fromTask(page, { fipi })); } catch (e) { return false; }
  }

  /* ── текст всплывашки ── */
  const NAMES = [['hw', 'В ДЗ'], ['board', 'На доске'], ['ok', 'Верно'], ['bad', 'Неверно']];
  function fmtDate(t){
    const d = new Date(t), now = new Date();
    return String(d.getDate()).padStart(2, '0') + '.' + String(d.getMonth() + 1).padStart(2, '0') +
      (d.getFullYear() !== now.getFullYear() ? '.' + d.getFullYear() : '');
  }
  function lines(keys){
    const opt = settings(), out = [];
    // по нескольким ключам (группа заданий) события складываем
    const agg = {};
    let total = 0;
    keys.forEach(k => {
      const s = summaryOf(k);
      if (!s || !s.total) return;
      total += s.total;
      NAMES.forEach(([e]) => {
        if (!s[e]) return;
        const a = agg[e] || (agg[e] = { n: 0, dates: [] });
        a.n += s[e].n; a.dates = a.dates.concat(s[e].dates);
      });
    });
    NAMES.forEach(([e, name]) => {
      const a = agg[e];
      if (!a) return;
      a.dates.sort((x, y) => x - y);
      let t = name;
      if (opt.labelDates) t += ': ' + a.dates.slice(-4).map(fmtDate).join(', ') + (a.dates.length > 4 ? '…' : '');
      if (opt.labelCount && a.n > 1) t += ' ×' + a.n;
      out.push(t);
    });
    return { lines: out, total, last: lastEvent(keys) };
  }
  function lastEvent(keys){
    let best = null;
    keys.forEach(k => {
      const s = summaryOf(k);
      if (s && s.events.length){
        const ev = s.events[s.events.length - 1];
        if (!best || ev.at > best.at) best = ev;
      }
    });
    return best ? best.event : null;
  }

  /* ── точка и всплывашка ── */
  const CSS = `
.tc-dot{display:inline-block;flex:0 0 auto;width:9px;height:9px;border-radius:50%;background-color:var(--muted-3,#8a8a8a);opacity:.7;cursor:pointer;vertical-align:middle;padding:0;box-sizing:content-box;background-clip:content-box;border:6px solid transparent;margin:-6px -2px;}
.tc-dot:hover,.tc-dot.open{opacity:1;}
.tc-dot[data-last="ok"]{background-color:var(--ok,#2e9e5b);}
.tc-dot[data-last="bad"]{background-color:#d9822b;}
.tc-cur{display:flex;align-items:center;gap:6px;margin:4px 0;font:500 12.5px var(--font-ui,system-ui);color:var(--muted-3,#777);}
.tc-pop{position:fixed;z-index:200;max-width:min(300px,calc(100vw - 24px));background:var(--bg,#fff);color:var(--muted-5,#333);border:1px solid var(--glass-border,#ddd);border-radius:12px;box-shadow:var(--shadow,0 6px 24px rgba(0,0,0,.18));padding:9px 12px;font:500 13px/1.4 var(--font-ui,system-ui);}
.tc-pop b{display:block;font-weight:600;margin-bottom:3px;}
.tc-pop .tc-line{display:block;}
.tc-pop button{margin-top:7px;font:500 12.5px var(--font-ui,system-ui);color:var(--muted-5,#333);background:none;border:1px solid var(--glass-border,#ccc);border-radius:8px;padding:3px 9px;cursor:pointer;}
.tc-pop button:hover{border-color:var(--ink,#222);}
.tc-tg{display:inline-flex;align-items:center;gap:2px;margin-right:8px;padding:2px;border:1px solid var(--glass-border,#ddd);border-radius:10px;background:var(--glass-strong,transparent);}
.tc-tg button{font:500 12px var(--font-ui,system-ui);color:var(--muted-3,#777);background:none;border:0;border-radius:8px;padding:3px 8px;cursor:pointer;white-space:nowrap;}
.tc-tg button[aria-pressed="true"]{background:var(--ink,#222);color:var(--bg,#fff);}
.fm-bar{flex-wrap:wrap;align-items:center;}`;
  function injectCss(){
    if (document.getElementById('taskCaptionsCss')) return;
    const st = document.createElement('style');
    st.id = 'taskCaptionsCss';
    st.textContent = CSS;
    (document.head || document.documentElement).appendChild(st);
  }

  const dots = new Set();
  let pop = null, popDot = null, pinned = false, hideTimer = null;
  function closePop(){
    clearTimeout(hideTimer);
    if (pop) { pop.remove(); pop = null; }
    if (popDot) popDot.classList.remove('open');
    popDot = null; pinned = false;
    document.removeEventListener('click', outside, true);
  }
  function outside(e){ if (pop && !pop.contains(e.target) && !(popDot && popDot.contains(e.target))) closePop(); }
  function openPop(dot, pin){
    clearTimeout(hideTimer);
    if (popDot === dot && pop) { if (pin) pinned = true; return; }
    closePop();
    const keys = dot._tcKeys, info = lines(keys), who = (student() || {}).name || 'ученика';
    pop = document.createElement('div');
    pop.className = 'tc-pop';
    pop.setAttribute('data-tc-pop', '1');
    const head = keys.length > 1 ? ('Из ' + keys.length + ' заданий группы были у ' + who) : ('У ' + who + ' это задание уже было');
    pop.innerHTML = '<b></b>' + info.lines.map(() => '<span class="tc-line"></span>').join('') + '<button type="button" data-tc-forget="1"></button>';
    pop.querySelector('b').textContent = head;
    pop.querySelectorAll('.tc-line').forEach((n, i) => { n.textContent = info.lines[i]; });
    const btn = pop.querySelector('button');
    btn.textContent = keys.length > 1 ? 'Забыть эти задания' : 'Забыть это задание';
    btn.onclick = async () => {
      btn.disabled = true;
      try {
        await SM().forget(keys);
        closePop();
        refresh();
        fire(false);
      } catch (e) {
        btn.disabled = false;
        btn.textContent = 'Не получилось забыть — повторите';
      }
    };
    pop.onmouseenter = () => clearTimeout(hideTimer);
    pop.onmouseleave = () => { if (!pinned) hideTimer = setTimeout(closePop, 250); };
    document.body.appendChild(pop);
    const r = dot.getBoundingClientRect(), pr = pop.getBoundingClientRect();
    let left = Math.min(Math.max(8, r.left + r.width / 2 - pr.width / 2), window.innerWidth - pr.width - 8);
    let top = r.bottom + 6;
    if (top + pr.height > window.innerHeight - 8) top = Math.max(8, r.top - pr.height - 6);
    pop.style.left = left + 'px';
    pop.style.top = top + 'px';
    popDot = dot; pinned = !!pin;
    dot.classList.add('open');
    setTimeout(() => document.addEventListener('click', outside, true), 0);
  }

  function dot(keys){
    keys = (Array.isArray(keys) ? keys : [keys]).filter(Boolean);
    if (!keys.length || !active() || mode() === 'off') return null;
    const info = lines(keys);
    if (!info.total) return null;
    injectCss();
    const el = document.createElement('span');
    el.className = 'tc-dot';
    el.setAttribute('data-tc-dot', '1');
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-label', 'Задание уже было у ученика');
    el.dataset.last = info.last || '';
    el._tcKeys = keys;
    el.onmouseenter = () => openPop(el, false);
    el.onmouseleave = () => { if (!pinned) hideTimer = setTimeout(closePop, 250); };
    el.onclick = e => {
      // клик по точке внутри карточки не должен открывать задание
      e.stopPropagation(); e.preventDefault();
      if (popDot === el && pop && pinned) closePop(); else openPop(el, true);
    };
    el.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); } };
    dots.add(el);
    return el;
  }
  // точки живут в списках и текущем задании; журнал или режим изменились —
  // убираем те, у кого событий больше нет (забыли), и перекрашиваем остальные
  function refresh(){
    dots.forEach(el => {
      if (!el.isConnected) { dots.delete(el); return; }
      const info = lines(el._tcKeys);
      if (!active() || mode() === 'off' || !info.total) { dots.delete(el); el.remove(); return; }
      el.dataset.last = info.last || '';
    });
    if (pop && popDot && !popDot.isConnected) closePop();
    // у текущего задания точка может появиться (только что решили) или пропасть (забыли)
    if (curCtx && !(pop && pinned)) renderCurrent();
  }

  // карточки списка: точка встаёт в строку заголовка, после названия
  function decorate(container, keysOf){
    if (!container) return;
    container.querySelectorAll('[data-tc-dot]').forEach(n => { dots.delete(n); n.remove(); });
    if (!active() || mode() === 'off') return;
    container.querySelectorAll('.mode-card').forEach(card => {
      let keys = null;
      try { keys = keysOf(card); } catch (e) {}
      const d = dot(keys);
      if (!d) return;
      const title = card.querySelector('.mtitle');
      if (title && title.parentNode === card) title.insertAdjacentElement('afterend', d); else card.insertBefore(d, card.firstChild);
    });
  }

  // текущее задание: узел .tc-cur сразу после узла «after» (у него display:none,
  // когда подписать нечего). В кадре на доске точку не рисуем: там подпись уже
  // есть в панели (board-memory.js)
  let curCtx = null;
  function showCurrent(after, task, mode_){
    curCtx = after ? { after, task, mode: mode_ } : null;
    renderCurrent();
  }
  function renderCurrent(){
    if (!curCtx || !curCtx.after || !curCtx.after.parentNode) return;
    const after = curCtx.after;
    let host = after.nextElementSibling;
    if (!host || !host.classList.contains('tc-cur')){
      host = document.createElement('div');
      host.className = 'tc-cur';
      host.style.display = 'none';
      after.insertAdjacentElement('afterend', host);
    }
    host.querySelectorAll('[data-tc-dot]').forEach(n => { dots.delete(n); });
    host.textContent = '';
    host.style.display = 'none';
    if (!IN_TOP || !curCtx.task) return;
    const key = keyOfTask(curCtx.task, curCtx.mode);
    const d = dot(key ? [key] : []);
    if (!d) return;
    injectCss();
    host.appendChild(d);
    host.style.display = 'flex';
  }

  /* ── переключатель ── */
  const TOGGLE = [['show', 'Подписывать', 'Подписывать задания, которые уже были у ученика'],
                  ['off', 'Не подписывать', 'Не показывать подписи'],
                  ['hide_solved', 'Скрывать решённые', 'Подписывать и не предлагать задания ФИПИ, которые уже были у ученика']];
  const toggles = [];
  function renderToggle(t){
    t.host.innerHTML = '';
    if (!active()) { t.host.style.display = 'none'; return; }
    t.host.style.display = '';
    injectCss();
    t.host.className = 'tc-tg';
    t.host.setAttribute('role', 'group');
    t.host.setAttribute('aria-label', 'Подписи заданий');
    t.host.setAttribute('data-tc-toggle', '1');
    const cur = mode();
    TOGGLE.forEach(([m, label, title]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      b.title = title;
      b.dataset.mode = m;
      b.setAttribute('aria-pressed', cur === m ? 'true' : 'false');
      b.onclick = e => { e.stopPropagation(); setMode(m); };
      t.host.appendChild(b);
    });
  }
  function mountToggle(host, cb){
    if (!host) return;
    const t = { host, cb };
    toggles.push(t);
    renderToggle(t);
  }

  /* ── подписка ── */
  const listeners = [];
  function onChange(fn){ listeners.push(fn); return () => { const i = listeners.indexOf(fn); if (i >= 0) listeners.splice(i, 1); }; }
  function fire(userMove){
    for (let i = toggles.length - 1; i >= 0; i--) if (!toggles[i].host.isConnected) toggles.splice(i, 1);
    toggles.forEach(renderToggle);
    refresh();
    listeners.slice().forEach(f => { try { f(userMove); } catch (e) {} });
  }
  // страница перерисовывает списки при смене сессии или положения; запись
  // события на самом уроке (журнал растёт) перерисовки не требует
  function sigNow(){ const s = student(); return (s ? s.id : '') + '|' + mode(); }
  function boot(){
    sig = sigNow();
    const m = SM();
    if (m && m.onChange) m.onChange(() => {
      const n = sigNow();
      if (n !== sig) { sig = n; fire(false); } else refresh();
    });
    window.addEventListener('storage', e => { if (e.key === 'teacher:settings:v1') { sig = sigNow(); fire(false); } });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();

  window.TaskCaptions = { active, mode, setMode, keyOfTask, skip, skipFipi, dot, decorate, showCurrent, mountToggle, onChange, summaryOf };
})();
