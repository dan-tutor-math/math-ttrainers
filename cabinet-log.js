/* ==========================================================
   cabinet-log.js — «Память заданий» в карточке ученика (задача Б6 плана кабинета).

   CabinetLog.mount(box, student) → функция «снять» (отписка).

   Что показывает: задания ФИПИ — по экзамену, у каждого события с датами
   («в ДЗ 19.01 · на доске 21.02 · решали 21.02, верно»); сгенерированные —
   по номеру (странице) и виду со счётчиком и датой последнего раза.
   Фильтр «решено неверно»; выбор строк → «Забыть выбранные»; «Забыть вид»,
   «Забыть номер», «Забыть всё по экзамену» — каждое с подтверждением.

   Почему так:
   - Данные берём из сжатой копии журнала StudentMemory (summary/keys с
     явным studentId), а не из сессии: карточка открыта для этого ученика,
     даже если сессия идёт с другим или её нет. Копию обновляет loadLog
     при открытии карточки, а forget правит и сервер, и копию.
   - Ключи («fipi:oge:2933FB», «gen:oge9:p3») разбираем сами по правилам
     task-key.js: ни одного вымышленного поля, только то, что в ключе.
   - «Решено неверно» — когда ПОСЛЕДНЕЕ решение по заданию (ok/bad) было
     неверным: если потом решили верно, задание из фильтра уходит.
   ========================================================== */
(function(){
  'use strict';
  const EXAM_NAMES = { oge: 'ОГЭ, математика', ege: 'ЕГЭ, профиль', egeb: 'ЕГЭ, база', soc: 'Обществознание ОГЭ', eng: 'Английский ОГЭ', rus: 'Русский язык ОГЭ' };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function fmt(t){
    const d = new Date(t), p = n => (n < 10 ? '0' : '') + n;
    const s = p(d.getDate()) + '.' + p(d.getMonth() + 1);
    return d.getFullYear() === new Date().getFullYear() ? s : s + '.' + d.getFullYear();
  }
  function plural(n, a, b, c){
    const m = n % 100, k = n % 10;
    return n + ' ' + (m > 10 && m < 20 ? c : k === 1 ? a : k > 1 && k < 5 ? b : c);
  }
  // «oge9» → «№9», «ege_prof» → «ege_prof»: человеческое имя, когда оно очевидно
  function pageName(p){
    const m = /^(oge|ege|egeb|soc|eng|rus)(\d+)$/.exec(p);
    return m ? '№' + m[2] + ' (' + (EXAM_NAMES[m[1]] || m[1]) + ')' : p;
  }
  function parseKey(k){
    const a = String(k).split(':');
    if (a[0] === 'fipi' && a.length >= 3) return { type: 'fipi', exam: a[1], id: a.slice(2).join(':') };
    if (a[0] === 'gen' && a.length >= 3) return { type: 'gen', page: a[1], kind: a[2] };
    return { type: 'other', key: k };
  }
  // событие журнала → текст («решали 21.02, верно»)
  function evText(e){
    const d = fmt(e.at);
    return e.event === 'hw' ? 'в ДЗ ' + d : e.event === 'board' ? 'на доске ' + d
      : e.event === 'ok' ? 'решали ' + d + ', верно' : 'решали ' + d + ', неверно';
  }
  function lastSolve(events){
    for (let i = events.length - 1; i >= 0; i--) if (events[i].event === 'ok' || events[i].event === 'bad') return events[i].event;
    return null;
  }
  const MAX_EV = 6;

  function mount(box, student){
    const SM = window.StudentMemory;
    const sid = String(student.id);
    let off = null, dead = false, onlyBad = false, selected = new Set(), pending = null, msg = '', loadErr = '';
    if (!SM){ box.innerHTML = '<div class="slot"><b>Память заданий</b>Модуль памяти не загружен.</div>'; return function(){}; }

    // журнал → { fipi: {exam: [{key,id,events}]}, gen: {page: {kind: {key,sum,keys}}} }
    function model(){
      const fipi = {}, gen = {};
      SM.keys({ studentId: sid }).forEach(k => {
        const p = parseKey(k);
        if (p.type === 'fipi'){
          const s = SM.summary(k, { studentId: sid });
          (fipi[p.exam] = fipi[p.exam] || []).push({ key: k, id: p.id, events: s.events, last: s.last, solve: lastSolve(s.events) });
        } else if (p.type === 'gen'){
          const g = (gen[p.page] = gen[p.page] || {});
          g[p.kind] = g[p.kind] || { key: 'gen:' + p.page + ':' + p.kind };
        }
      });
      Object.keys(gen).forEach(pg => Object.keys(gen[pg]).forEach(kd => {
        const e = gen[pg][kd];
        e.sum = SM.kindSummary(e.key, { studentId: sid });
        e.solve = lastSolve(e.sum.events);
      }));
      return { fipi, gen };
    }

    function fipiRow(r){
      const shown = r.events.slice(-MAX_EV), more = r.events.length - shown.length;
      return '<div class="mrow" data-key="' + esc(r.key) + '"><label class="mchk"><input type="checkbox" data-sel="' + esc(r.key) + '"' + (selected.has(r.key) ? ' checked' : '') + '></label>' +
        '<div class="mmain"><b class="mid">' + esc(r.id) + '</b> <span class="mev">' + esc((more > 0 ? '… ' : '') + shown.map(evText).join(' · ')) + '</span></div></div>';
    }
    function genRow(page, kind, e){
      const s = e.sum, n = k => (s[k] ? s[k].n : 0);
      const parts = [];
      if (n('ok')) parts.push('верно ' + n('ok'));
      if (n('bad')) parts.push('неверно ' + n('bad'));
      if (n('hw')) parts.push('в ДЗ ' + n('hw'));
      if (n('board')) parts.push('на доске ' + n('board'));
      return '<div class="mrow" data-key="' + esc(e.key) + '"><label class="mchk"><input type="checkbox" data-sel="' + esc(e.key) + '"' + (selected.has(e.key) ? ' checked' : '') + '></label>' +
        '<div class="mmain"><b class="mid">вид ' + esc(kind) + '</b> <span class="mev">' + esc(parts.join(', ')) + ' · последний раз ' + fmt(s.last) + '</span></div>' +
        '<button class="btn quiet small" data-forget="' + esc(e.key) + '" data-what="вид «' + esc(kind) + '»">Забыть вид</button></div>';
    }

    function render(){
      if (dead) return;
      const m = model();
      const exams = Object.keys(m.fipi).sort(), pages = Object.keys(m.gen).sort();
      let html = '', visible = 0;
      const vis = [];
      exams.forEach(ex => {
        const rows = m.fipi[ex].filter(r => !onlyBad || r.solve === 'bad').sort((a, b) => b.last - a.last);
        if (!rows.length) return;
        visible += rows.length; rows.forEach(r => vis.push(r.key));
        html += '<div class="mgrp"><div class="mgh"><b>Задания ФИПИ · ' + esc(EXAM_NAMES[ex] || ex) + '</b><span class="hint">' + plural(rows.length, 'задание', 'задания', 'заданий') + '</span>' +
          '<button class="btn quiet small" data-forget="fipi:' + esc(ex) + '" data-what="все задания ФИПИ: ' + esc(EXAM_NAMES[ex] || ex) + '">Забыть всё по экзамену</button></div>' + rows.map(fipiRow).join('') + '</div>';
      });
      pages.forEach(pg => {
        const kinds = Object.keys(m.gen[pg]).filter(kd => !onlyBad || m.gen[pg][kd].solve === 'bad').sort();
        if (!kinds.length) return;
        visible += kinds.length; kinds.forEach(kd => vis.push(m.gen[pg][kd].key));
        html += '<div class="mgrp"><div class="mgh"><b>Сгенерированные · ' + esc(pageName(pg)) + '</b><span class="hint">' + plural(kinds.length, 'вид', 'вида', 'видов') + '</span>' +
          '<button class="btn quiet small" data-forget="gen:' + esc(pg) + '" data-what="весь номер ' + esc(pageName(pg)) + '">Забыть номер</button></div>' + kinds.map(kd => genRow(pg, kd, m.gen[pg][kd])).join('') + '</div>';
      });
      // выбранное, чего больше нет на экране (забыто или отфильтровано), снимаем
      selected = new Set(Array.from(selected).filter(k => vis.indexOf(k) >= 0));
      if (!html) html = '<div class="hint" style="padding:6px 2px">' + (loadErr ? esc(loadErr)
        : onlyBad ? 'Неверно решённых заданий нет.' : 'Пока ничего: что выдавали в ДЗ, выводили на доску и решали в сессии с этим учеником — появится здесь.') + '</div>';
      const confirmHtml = pending
        ? '<div class="mconf" role="alertdialog"><span>Забыть ' + esc(pending.what) + '? Строки журнала удалятся, это нельзя отменить.</span>' +
          '<button class="btn danger small" data-act="yes">Забыть</button><button class="btn quiet small" data-act="no">Отмена</button></div>' : '';
      box.innerHTML = '<div class="memory"><div class="mhead"><b>Память заданий</b>' +
        '<label class="mfilt"><input type="checkbox" id="mBad"' + (onlyBad ? ' checked' : '') + '> решено неверно</label>' +
        '<button class="btn small" id="mForgetSel"' + (selected.size ? '' : ' disabled') + '>Забыть выбранные' + (selected.size ? ' (' + selected.size + ')' : '') + '</button></div>' +
        confirmHtml + (msg ? '<div class="hint" role="status" id="mMsg">' + esc(msg) + '</div>' : '') + html + '</div>';
    }

    async function doForget(){
      const p = pending; pending = null;
      try {
        const n = await SM.forget(p.keys, { studentId: sid, prefix: true });
        msg = 'Забыто: ' + plural(n, 'событие', 'события', 'событий') + '.';
        selected.clear();
      } catch (e) { msg = 'Не удалось забыть: ' + (e && e.message || e); }
      render();
    }

    box.addEventListener('click', ev => {
      const t = ev.target.closest('[data-forget],[data-act],#mForgetSel');
      if (!t) return;
      if (t.id === 'mForgetSel'){
        const keys = Array.from(selected);
        if (!keys.length) return;
        pending = { keys, what: plural(keys.length, 'выбранную строку', 'выбранные строки', 'выбранных строк') }; msg = ''; render();
      } else if (t.dataset.forget){
        pending = { keys: [t.dataset.forget], what: t.dataset.what }; msg = ''; render();
      } else if (t.dataset.act === 'yes') doForget();
      else { pending = null; render(); }
    });
    box.addEventListener('change', ev => {
      const t = ev.target;
      if (t.id === 'mBad'){ onlyBad = t.checked; pending = null; render(); }
      else if (t.dataset && t.dataset.sel){ if (t.checked) selected.add(t.dataset.sel); else selected.delete(t.dataset.sel); pending = null; render(); }
    });

    // копия журнала могла устареть (вкладку держали открытой) — обновляем с сервера
    box.innerHTML = '<div class="slot"><b>Память заданий</b>Загружаем…</div>';
    SM.loadLog(sid).then(() => { render(); }, e => { loadErr = 'Журнал не загрузился: ' + (e && e.message || e); render(); });
    off = SM.onChange(() => { if (!pending) render(); });
    return function(){ dead = true; if (off) off(); };
  }

  /* ── «Занятия» в карточке ученика (В2) ──
     CabinetLog.mountLessons(box, student) → «снять».
     Ближайшее занятие и последние; у каждого начавшегося раскрывается
     «что решали» — строки журнала с lesson_id этого занятия (их пишет
     сессия, начатая из занятия в расписании).
     Почему «начавшееся», а не «закончившееся»: сессия идёт прямо на
     занятии, и пока оно не кончилось, смотреть «что решали» уже нужно.
     Журнал берём с сервера целиком (fetchLog): сжатая копия StudentMemory
     занятие не хранит. */
  const DAYS = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
  const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  const ST_SIGN = { plan: '○', done: '✓', skip: '✕', move: '↷' };
  const ST_NAME = { plan: 'запланировано', done: 'проведено', skip: 'пропуск', move: 'перенос' };
  const pad2 = n => (n < 10 ? '0' : '') + n;
  const hm = m => pad2(Math.floor(m / 60)) + ':' + pad2(m % 60);
  function dayText(day){
    const [y, m, d] = day.split('-').map(Number);
    return DAYS[new Date(y, m - 1, d).getDay()] + ', ' + d + ' ' + MONTHS[m - 1];
  }
  function timeText(l){ return l.start_min == null ? 'без времени' : hm(l.start_min) + ' – ' + hm(Math.min(1440, l.start_min + l.dur_min)); }
  function startedAlready(l, now){
    const t = now.getFullYear() + '-' + pad2(now.getMonth() + 1) + '-' + pad2(now.getDate());
    if (l.day !== t) return l.day < t;
    return l.start_min != null && l.start_min <= now.getHours() * 60 + now.getMinutes();
  }
  const EV_TEXT = { hw: 'выдано в ДЗ', board: 'на доске', ok: 'решено верно', bad: 'решено неверно' };
  function keyText(k){
    const p = parseKey(k);
    if (p.type === 'fipi') return 'ФИПИ · ' + (EXAM_NAMES[p.exam] || p.exam) + ' · ' + p.id;
    if (p.type === 'gen') return pageName(p.page) + ' · ' + p.kind;
    return p.key;
  }
  function logLine(r){
    const d = new Date(r.at);
    return '<div class="mrow"><span class="mmain"><span class="mid">' + esc(keyText(r.task_key)) + '</span> <span class="mev">— ' +
      esc(EV_TEXT[r.event] || r.event) + ', ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + '</span></span></div>';
  }

  function mountLessons(box, student){
    const SM = window.StudentMemory, SC = window.ScheduleCloud;
    let dead = false, lessons = null, log = null, logErr = '', err = '';
    const open = new Set();
    function row(l, isPast){
      const my = l.my || {};
      const rows = (log || []).filter(r => r.lesson_id === l.id);
      let h = '<div class="les" data-lesson="' + esc(l.id) + '"><div class="les-h">' +
        '<a class="les-t" href="#/schedule/' + esc(l.day) + '" title="Открыть неделю в расписании"><b>' + esc(dayText(l.day)) + '</b> · ' + esc(timeText(l)) + '</a>' +
        '<span class="hint">' + esc(ST_SIGN[my.status] || '') + ' ' + esc(ST_NAME[my.status] || '') + '</span>';
      if (isPast || rows.length) {
        h += '<button type="button" class="btn quiet small les-tg" data-tg="' + esc(l.id) + '" aria-expanded="' + (open.has(l.id) ? 'true' : 'false') + '">' +
          'Что решали' + (log ? ': ' + rows.length : '') + '</button>';
      }
      h += '</div>';
      if (open.has(l.id)) {
        h += '<div class="les-body">' + (logErr ? '<div class="hint">' + esc(logErr) + '</div>'
          : !log ? '<div class="hint">Загружаем…</div>'
          : rows.length ? rows.map(logLine).join('') : '<div class="hint">На этом занятии ничего не записано — сессия из занятия не начиналась.</div>') + '</div>';
      }
      return h + '</div>';
    }
    function render(){
      if (dead) return;
      let h = '<div class="memory"><div class="mhead"><b>Занятия</b></div>';
      if (err) h += '<div class="hint">' + esc(err) + '</div>';
      else if (!lessons) h += '<div class="hint">Загружаем…</div>';
      else if (!lessons.length) h += '<div class="hint">Занятий с этим учеником в расписании пока нет.</div>';
      else {
        const now = new Date();
        const past = lessons.filter(l => startedAlready(l, now)).reverse().slice(0, 10);
        const next = lessons.filter(l => !startedAlready(l, now))[0];
        h += '<div class="label">Ближайшее</div>' + (next ? row(next, false) : '<div class="hint">Не запланировано.</div>');
        h += '<div class="label" style="margin-top:10px">Последние</div>' + (past.length ? past.map(l => row(l, true)).join('') : '<div class="hint">Прошедших занятий нет.</div>');
      }
      box.innerHTML = h + '</div>';
    }
    box.addEventListener('click', ev => {
      const t = ev.target.closest('[data-tg]');
      if (!t) return;
      const id = t.dataset.tg;
      if (open.has(id)) open.delete(id); else open.add(id);
      render();
    });
    render();
    if (!SC) { err = 'Расписание не подключено'; render(); return function(){ dead = true; }; }
    SC.listForStudent(student.id).then(ls => { lessons = ls; render(); }, e => { err = 'Занятия не загрузились: ' + (e && e.message || e); render(); });
    if (SM && SM.fetchLog) SM.fetchLog(student.id).then(rows => { log = rows; render(); }, e => { logErr = 'Журнал не загрузился: ' + (e && e.message || e); render(); });
    else logErr = 'Журнал недоступен';
    return function(){ dead = true; };
  }

  window.CabinetLog = { mount, mountLessons, parseKey };

})();
