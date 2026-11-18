/* Экран задания в тренажёрах ОГЭ математики — как в русском и обществознании
   (задача 54 в планы.md):
   - «◀ Предыдущее задание / Следующее задание ▶» рядом с кнопками типов;
   - «Все типы» в левом верхнем углу под «Все задания» (как в oge1_5.html).

   Страница зовёт:
     TaskNav.mount({ key, next, current, enabled })
       key()     — тип на экране (curMode): история у каждого типа своя;
       next()    — показать задание тем же путём, что ⟳ (обычно newTask());
       current() — задание на экране (curTask);
       enabled() — необязательно: false прячет пару (например, «Шины» в №1–5,
                   где своя навигация «Задание N из 5»);
     TaskNav.take()     — в newTask вместо выбора нового: задание из истории или null;
     TaskNav.seen(task) — в конце newTask: показано новое задание;
     TaskNav.sync()     — пересчитать видимость пары, если страница сама её меняет;
     TaskNav.mountCorner() — только угол, без пары (oge_part2: там своя пагинация).

   Почему история в памяти страницы, а не в localStorage: после перезагрузки
   страница и так открывает последнее задание (curProg.task), а держать между
   загрузками стопку старых заданий незачем.
   Почему задание из истории идёт через ту же newTask: у каждой страницы свой
   сброс (шаги, попытки, лист доски, снимок сессии, saveProg) — повторять его
   здесь значит разойтись со страницей при первой же её правке.
   Почему копии через JSON: задание на экране страница может менять на месте
   (грабля trainers.md «Нельзя»), а снимок сессии и так теряет undefined-поля. */
(function () {
  const LIMIT = 30;                       // глубина истории одного типа
  const IS_CARD = new URLSearchParams(location.search).get('card') === '1';
  const hist = Object.create(null);       // тип → { list: [копии], pos }
  let opts = null, prevBtn = null, nextBtn = null, pending = null, restoring = false;

  const copy = t => JSON.parse(JSON.stringify(t));
  const ok = t => !!t && typeof t === 'object';
  function rec() {
    const k = String(opts.key());
    return hist[k] || (hist[k] = { list: [], pos: -1 });
  }
  function push(task) {
    const r = rec();
    r.list = r.list.slice(0, r.pos + 1);
    r.list.push(copy(task));
    if (r.list.length > LIMIT) r.list.shift();
    r.pos = r.list.length - 1;
  }
  // задание, открытое из памяти при входе в тип (resumeOrNewTask), в историю
  // через newTask не попадало — кладём его перед первым переходом от него
  function seedCurrent() {
    if (!opts) return;
    const cur = opts.current && opts.current();
    if (ok(cur) && rec().pos < 0) push(cur);
  }
  function guard(fn) {
    const TS = window.TrainerSession;
    return TS && TS.guardStudentAction ? TS.guardStudentAction('switchTask', fn) : fn;
  }
  function go(delta) {
    seedCurrent();
    const r = rec();
    const j = r.pos + delta;
    if (j < 0) return;
    if (j >= r.list.length) { opts.next(); sync(); return; }   // дальше истории — новое
    r.pos = j;
    pending = copy(r.list[j]);
    restoring = true;
    try { opts.next(); } finally { pending = null; restoring = false; }
    sync();
  }
  function take() {
    const t = pending;
    pending = null;
    return t;
  }
  function seen(task) {
    if (!opts || !ok(task)) return;
    // newTask, вызванная из go() для задания из истории, сюда тоже приходит —
    // оно уже лежит в истории, pos стоит на нём
    if (!restoring) push(task);
    sync();
  }
  function sync() {
    if (!prevBtn || !opts) return;
    // пара живёт там же, где ⟳: в «Обучении» и в заглушке «в разработке»
    // страница прячет ⟳ — прячется и пара
    const refresh = document.getElementById('refreshBtn');
    const on = (!refresh || refresh.style.display !== 'none') && (!opts.enabled || opts.enabled());
    prevBtn.style.display = nextBtn.style.display = on ? 'inline-flex' : 'none';
    prevBtn.disabled = rec().pos <= 0;
  }

  const ICON_HOME = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l-5-5 5-5"/><path d="M11 12h10"/></svg>';
  const ICON_BACK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>';
  // те же правила, что у угла в oge1_5.html; position:relative вместо static
  // на узком экране — чтобы холст доски (z-index:2) не накрывал кнопки
  const CSS = `
.corner-nav{position:fixed;top:16px;left:16px;z-index:200;display:grid;gap:8px;}
.corner-nav .home-btn{position:static;width:auto;}
.corner-nav .home-btn,.corner-nav .back-btn{height:40px;box-sizing:border-box;border-radius:14px;padding:0 14px;gap:8px;display:flex;align-items:center;justify-content:flex-start;font-family:var(--font-ui);font-weight:600;font-size:14px;line-height:1;color:var(--ink);background:var(--glass-strong);border:1px solid var(--glass-border);box-shadow:inset 0 1px 0 var(--glass-inset), var(--shadow);white-space:nowrap;cursor:pointer;text-decoration:none;}
.corner-nav .back-btn[hidden]{display:none}
.corner-nav svg{width:18px;height:18px;flex:0 0 auto}
@media(max-width:1239px){
  .corner-nav{position:relative;top:0;left:0;z-index:3;width:max-content;max-width:100%;grid-auto-flow:column;grid-auto-columns:1fr;justify-content:start;margin:0 0 12px;}
}
@media(max-width:599px){.corner-nav{grid-auto-flow:row;grid-auto-columns:auto}}
/* На широком экране используем место слева от условия. Правый край
   шапки остаётся на месте, чтобы не попасть под плавающую клавиатуру. */
@media(min-width:1240px){
  #taskArea .task-head:has(#tnNextTask){margin-inline:-152px 0;flex-wrap:nowrap;}
  #taskArea .type-nav:has(#tnNextTask){flex:none;column-gap:6px;}
  #taskArea .type-nav:has(#tnNextTask) .type-nav-btn{padding-inline:7px;}
  #taskArea .task-head:has(#tnNextTask) .corner{min-width:0;flex-wrap:nowrap;column-gap:6px;}
  #taskArea .task-head:has(#tnNextTask) .task-title{min-width:0;overflow-wrap:anywhere;}
}
.type-nav-btn:disabled{opacity:.45;cursor:default;transform:none}
.type-nav-btn:disabled:hover{border-color:var(--glass-border)}
`;
  function injectCss() {
    if (document.getElementById('taskNavCss')) return;
    const st = document.createElement('style');
    st.id = 'taskNavCss';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  // «Все задания» + «Все типы» столбиком в левом верхнем углу. «Все типы» —
  // тот же путь, что «← все типы» в шапке задания (её обработчик и её запрет
  // в сессии), поэтому просто нажимаем её
  function mountCorner() {
    if (IS_CARD) return;   // в кадре карточки угла нет (там и «←» прячет trainer-multi.js)
    const home = document.getElementById('homeBtn');
    const back = document.getElementById('backBtn');
    const area = document.getElementById('taskArea');
    if (!home || !back || !area || document.getElementById('cornerNav')) return;
    injectCss();
    const nav = document.createElement('nav');
    nav.className = 'corner-nav';
    nav.id = 'cornerNav';
    home.before(nav);
    nav.appendChild(home);
    home.innerHTML = ICON_HOME + 'Все задания';
    const types = document.createElement('button');
    types.type = 'button';
    types.className = 'back-btn';
    types.id = 'cornerTypesBtn';
    types.innerHTML = ICON_BACK + 'Все типы';
    types.addEventListener('click', () => back.click());
    nav.appendChild(types);
    // экран задания страницы включают по-разному (и снимок сессии тоже) —
    // проще следить за style #taskArea, как syncBackBtn в oge1_5.html
    const syncTypes = () => { types.hidden = area.style.display === 'none'; };
    new MutationObserver(syncTypes).observe(area, { attributes: true, attributeFilter: ['style'] });
    syncTypes();
  }

  function mount(o) {
    opts = o;
    mountCorner();
    if (IS_CARD) return;   // шапку задания в кадре карточки прячет trainer-multi.js
    const row = document.querySelector('#taskArea .type-nav');
    if (!row) return;
    injectCss();
    prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'type-nav-btn';
    prevBtn.id = 'tnPrevTask';
    prevBtn.title = 'Предыдущее задание этого типа';
    prevBtn.textContent = '◀ Предыдущее задание';
    nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'type-nav-btn';
    nextBtn.id = 'tnNextTask';
    nextBtn.title = 'Следующее задание этого типа';
    nextBtn.textContent = 'Следующее задание ▶';
    row.append(prevBtn, nextBtn);
    prevBtn.addEventListener('click', guard(() => go(-1)));
    nextBtn.addEventListener('click', guard(() => go(1)));
    // ⟳ и «Следующий пример →» дают новое задание мимо пары — до их
    // обработчика (фаза захвата) успеваем положить в историю текущее
    ['refreshBtn', 'nextBtn'].forEach(id => {
      const b = document.getElementById(id);
      if (b) b.addEventListener('click', seedCurrent, true);
    });
    const refresh = document.getElementById('refreshBtn');
    if (refresh) new MutationObserver(sync).observe(refresh, { attributes: true, attributeFilter: ['style'] });
    sync();
  }

  window.TaskNav = { mount, mountCorner, take, seen, sync };
})();
