/* ═══════════════ «ФИПИ, потом на основе ФИПИ» — общий модуль ОГЭ ═══════════════
   Общее правило для всех номеров ОГЭ, куда приходит открытый банк ФИПИ
   (решено 14.10.2026, первым — №9): у каждого вида (прототипа) ОДНА карточка
   в общем списке. Внутри вида сначала идут настоящие задания банка ФИПИ —
   вперемешку и без повторов, пока все не решены; потом — наши задания «на
   основе ФИПИ»: генератор того же вида, та же запись и те же шаги, другие
   числа. Так у ученика и авторитет банка («это задания с экзамена»), и
   тренировка, которая не кончается. На карточке «10+ заданий»: число — сколько
   заданий ФИПИ, плюс — что дальше генератор.
   Что можно отключить — маленький фильтр (значок над списком): «Задания
   ФИПИ» и «На основе ФИПИ», обе включены по умолчанию, выключить обе нельзя.
   Фильтр один на все номера ОГЭ (ключ fipiMix:filter), а не на страницу:
   ученик, который решил гонять «только ФИПИ» перед экзаменом, хочет этого
   везде. В совместную сессию фильтр не уходит: задание выбирает тот, кто
   нажал ⟳, и приходит собеседнику готовым, вместе с подписью и плашкой.
   Решённые задания ФИПИ помнятся отдельно от прогресса прототипа
   (fipiMix:done:<страница>), потому что прогресс прототипа обнуляется после
   трёх часов паузы, а «какие задания банка уже пройдены» — нет.
   Почему next() без побочных эффектов: страница зовёт генератор через
   NoRepeat.pick, а тот вызывает его по нескольку раз и берёт ОДНОГО
   кандидата. Всё, что меняет память (плашка показана, второй круг), делает
   commit() — уже для выбранного задания.
   Подключение на странице (пример — oge9.html):
     - у типа поле fipiList: [{ fipi: 'номер', make: () => задание }]
     - генератор типа: () => FipiMix.next(СТРАНИЦА, m.id, m.fipiList, свой_gen)
     - после выбора задания: FipiMix.commit(СТРАНИЦА, m.id, задание, m.fipiList)
     - решено (верно или после второй ошибки): FipiMix.markDone(СТРАНИЦА, m.id, задание)
     - подпись под заданием: FipiMix.sourceText(задание), плашка: задание.fipiNotice
     - на карточке: FipiMix.countLabel(СТРАНИЦА, m.id, m.fipiList)
     - фильтр: FipiMix.mountFilter(узел, при_изменении) */
(function () {
  'use strict';
  if (window.FipiMix) return;
  const KEY_FILTER = 'fipiMix:filter';
  const KEY_DONE = 'fipiMix:done:';
  const mem = Object.create(null);   // запасной путь без localStorage (приватный режим)
  // Какое задание ФИПИ вида показано последним (ключ «страница:вид»). Живёт только
  // в памяти страницы, не в localStorage: «пропустил ⟳» — дело одного подхода.
  const shownFipi = Object.create(null);
  function read(key, def) {
    try { const raw = localStorage.getItem(key); if (raw) return JSON.parse(raw); } catch (e) {}
    return key in mem ? JSON.parse(mem[key]) : def;
  }
  function write(key, val) {
    const s = JSON.stringify(val);
    mem[key] = s;
    try { localStorage.setItem(key, s); } catch (e) {}
  }
  function filter() {
    const f = read(KEY_FILTER, null) || {};
    const out = { fipi: f.fipi !== false, own: f.own !== false };
    if (!out.fipi && !out.own) out.fipi = out.own = true;
    return out;
  }
  function store(page) { return read(KEY_DONE + page, {}); }
  function rec(page, mode) { const s = store(page); return s[mode] || { done: [], shown: false }; }
  function saveRec(page, mode, r) { const s = store(page); s[mode] = r; write(KEY_DONE + page, s); }
  const pick = a => a[Math.floor(Math.random() * a.length)];
  function plural(n) {
    const a = n % 100, b = n % 10;
    if (a >= 11 && a <= 14) return 'заданий';
    return b === 1 ? 'задание' : b >= 2 && b <= 4 ? 'задания' : 'заданий';
  }

  function next(page, mode, list, ownGen) {
    const f = filter();
    list = list || [];
    if (f.fipi && list.length) {
      const r = rec(page, mode);
      const avail = list.filter(x => r.done.indexOf(x.fipi) < 0);
      // Тупик с единственным заданием: у вида, где ФИПИ один (многоэтажная дробь
      // в №6) или остался один нерешённый, ⟳ отдавал бы его снова и снова, пока
      // не решат, — «примеры не обновляются». Если это же задание уже на экране,
      // а наши «на основе ФИПИ» разрешены, ⟳ даёт новое задание генератора, без
      // плашки: ФИПИ ещё не решены, плашку «все решены» показывать рано. Само
      // задание ФИПИ не теряется — вернётся, как только ученик выйдет в список.
      if (avail.length === 1 && f.own && shownFipi[page + ':' + mode] === avail[0].fipi) {
        const t = ownGen();
        t.basedOnFipi = true;
        return t;
      }
      if (avail.length) return withFipi(pick(avail));
      if (!f.own) {
        // «только ФИПИ» и всё решено: второй круг — пустого экрана не бывает
        const t = withFipi(pick(list));
        t.fipiNotice = `Все ${list.length} ${plural(list.length)} ФИПИ этого вида решены — начинаем второй круг. Новые задания этого вида — галочка «На основе ФИПИ» в фильтре над списком.`;
        t.fipiCycle = true;
        return t;
      }
      const t = ownGen();
      t.basedOnFipi = true;
      if (!r.shown) t.fipiNotice = `Все ${list.length} ${plural(list.length)} ФИПИ этого вида решены. Дальше — задания на основе ФИПИ: тот же вид, другие числа.`;
      return t;
    }
    const t = ownGen();
    if (list.length) t.basedOnFipi = true;
    return t;
  }
  function withFipi(item) { const t = item.make(); t.fipi = item.fipi; return t; }
  function commit(page, mode, task, list) {
    if (!task) return;
    // запоминаем только задание ФИПИ: пока идут наши, оно остаётся «показанным»,
    // и ⟳ не вернёт его по кругу (см. next)
    if (task.fipi) shownFipi[page + ':' + mode] = task.fipi;
    if (task.fipiCycle) saveRec(page, mode, { done: [], shown: false });
    else if (task.fipiNotice) { const r = rec(page, mode); r.shown = true; saveRec(page, mode, r); }
  }
  function markDone(page, mode, task) {
    if (!task || !task.fipi) return;
    const r = rec(page, mode);
    if (r.done.indexOf(task.fipi) < 0) { r.done.push(task.fipi); saveRec(page, mode, r); }
  }
  function countLabel(page, mode, list) {
    if (!list || !list.length) return '';
    // карточку рисуют, когда ученик на экране выбора типов, то есть вышел из вида:
    // пропуск ⟳ забываем, и при новом заходе задание ФИПИ снова идёт первым.
    // Нарочно здесь, а не в страницах: так правило одинаково для всех номеров
    delete shownFipi[page + ':' + mode];
    const f = filter(), n = list.length;
    if (!f.fipi) return 'на основе ФИПИ';
    const d = rec(page, mode).done.filter(id => list.some(x => x.fipi === id)).length;
    const base = f.own ? `${n}+ ${plural(n)}` : `${n} ${plural(n)} ФИПИ`;
    return d ? `${base} · ФИПИ решено ${d} из ${n}` : base;
  }
  function sourceText(task) {
    if (!task) return '';
    if (task.fipi) return 'Источник: открытый банк заданий ФИПИ, задание ' + task.fipi;
    if (task.basedOnFipi) return 'Задание на основе ФИПИ';
    return '';
  }

  /* ─── фильтр: значок и всплывашка ─── */
  const INFO = 'Мы взяли задания открытого банка ФИПИ и для каждого вида написали генератор. '
    + 'Он сохраняет устройство задания ФИПИ — ту же запись, те же шаги решения, тот же вид ответа — '
    + 'и меняет только числа. Так на каждую тему, которую проверяет ФИПИ, заданий становится '
    + 'сколько угодно, а ответ всегда посчитан точно. Сначала в каждом виде идут настоящие '
    + 'задания ФИПИ, а когда они решены — задания на основе ФИПИ.';
  const CSS = `
.fm-bar{display:flex;justify-content:flex-end;margin:0 0 8px;position:relative;}
.fm-btn{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--glass-border);background:var(--glass-strong);color:var(--muted-3);border-radius:10px;padding:5px 9px;font:500 12.5px var(--font-ui);cursor:pointer;position:relative;}
.fm-btn svg{width:15px;height:15px;}
.fm-btn.on::after{content:'';position:absolute;top:3px;right:3px;width:7px;height:7px;border-radius:50%;background:var(--ink);}
/* фон плотный, а не стекло: сквозь стекло читались подписи карточек под всплывашкой */
.fm-pop{position:absolute;top:calc(100% + 6px);right:0;z-index:50;width:min(300px,calc(100vw - 32px));background:var(--bg,#fff);backdrop-filter:blur(24px) saturate(180%);-webkit-backdrop-filter:blur(24px) saturate(180%);border:1px solid var(--glass-border);border-radius:14px;box-shadow:var(--shadow);padding:10px 12px;font:500 14px var(--font-ui);color:var(--muted-5);}
.fm-row{display:flex;align-items:center;gap:8px;padding:6px 0;}
.fm-row label{display:flex;align-items:center;gap:8px;cursor:pointer;flex:1;}
.fm-row input{width:17px;height:17px;accent-color:var(--ink);cursor:pointer;}
.fm-info{width:18px;height:18px;border-radius:50%;border:1px solid currentColor;color:var(--muted-3);opacity:.45;background:none;font:italic 600 11px Georgia,serif;line-height:16px;text-align:center;padding:0;cursor:pointer;flex:0 0 auto;}
.fm-info:hover,.fm-info.open{opacity:.9;}
.fm-text{font-size:13px;line-height:1.45;color:var(--muted-3);margin:4px 0 2px;}
.fipi-notice{font:500 14px var(--font-ui);line-height:1.45;color:var(--muted-5);background:var(--glass-strong);border:1px solid var(--glass-border);border-left:3px solid var(--ink);border-radius:12px;padding:9px 12px;margin:0 0 10px;}`;
  function injectCss() {
    if (document.getElementById('fipiMixCss')) return;
    const st = document.createElement('style');
    st.id = 'fipiMixCss';
    st.textContent = CSS;
    (document.head || document.documentElement).appendChild(st);
  }
  const ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16M7 12h10M10 18h4"/></svg>';
  function mountFilter(host, onChange) {
    if (!host) return;
    injectCss();
    host.classList.add('fm-bar');
    host.innerHTML = `<button type="button" class="fm-btn" aria-haspopup="true" title="Какие задания показывать">${ICON}Задания</button>`;
    const btn = host.querySelector('.fm-btn');
    let pop = null;
    const mark = () => { const f = filter(); btn.classList.toggle('on', !(f.fipi && f.own)); };
    const close = () => { if (pop) { pop.remove(); pop = null; document.removeEventListener('click', outside, true); } };
    function outside(e) { if (pop && !pop.contains(e.target) && !btn.contains(e.target)) close(); }
    btn.onclick = () => {
      if (pop) return close();
      const f = filter();
      pop = document.createElement('div');
      pop.className = 'fm-pop';
      pop.innerHTML = `
        <div class="fm-row"><label><input type="checkbox" data-k="fipi"${f.fipi ? ' checked' : ''}>Задания ФИПИ</label></div>
        <div class="fm-row"><label><input type="checkbox" data-k="own"${f.own ? ' checked' : ''}>На основе ФИПИ</label>
          <button type="button" class="fm-info" aria-label="Что такое задания на основе ФИПИ">i</button></div>
        <div class="fm-text" style="display:none">${INFO}</div>`;
      host.appendChild(pop);
      pop.querySelectorAll('input').forEach(inp => inp.onchange = () => {
        const v = {};
        pop.querySelectorAll('input').forEach(i => { v[i.dataset.k] = i.checked; });
        // обе выключить нельзя: тогда показывать нечего — галочка возвращается
        if (!v.fipi && !v.own) { inp.checked = true; return; }
        write(KEY_FILTER, v);
        mark();
        if (onChange) onChange(filter());
      });
      const info = pop.querySelector('.fm-info'), text = pop.querySelector('.fm-text');
      info.onclick = () => { const open = text.style.display === 'none'; text.style.display = open ? 'block' : 'none'; info.classList.toggle('open', open); };
      setTimeout(() => document.addEventListener('click', outside, true), 0);
    };
    mark();
  }
  window.FipiMix = { filter, next, commit, markDone, countLabel, sourceText, mountFilter, injectCss };
})();
