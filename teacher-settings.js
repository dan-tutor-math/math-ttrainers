/* ==========================================================
   teacher-settings.js — настройки преподавательского режима (задача А4).

   Правда лежит на сервере (teacher_settings.settings, одна строка на
   преподавателя), а в localStorage — копия: страницы, которым настройка
   нужна сразу (плашка сессии, подписи в панели заданий), читают её
   синхронно и не ждут сеть. Сервер подтягивается load() и перекрывает
   копию, если ответил.

   Страницы без кабинета могут подключить только этот файл: без
   cabinet-cloud.js он работает на локальной копии.

   Поля (первая версия):
     sessionBind — 'browser' (одна сессия на весь браузер, по умолчанию) или
                   'tab' (у каждой вкладки своя: несколько учеников рядом)
     labels      — подписи заданий: 'show' / 'off' / 'hide_solved'
     labelDates  — даты в подписи; labelCount — счётчик в подписи
     lessonMin   — длительность занятия по умолчанию, минуты (45/60/90/своя)
     formatLabels — свои названия форматов занятия { single, pair, group, semi }
                   (как stgLabel старого приложения: «полупараллелку» кто-то
                   зовёт «параллелью»). Пустое — общее название (В1а)
     pay         — оплаты (В4а): { skipRule 'free'|'charge' — оплачивается ли
                   прогул по умолчанию; reason — причина пропуска по
                   умолчанию; remindLeft — напомнить, когда осталось ≤ N
                   занятий; remindDays — за сколько дней до конца срока;
                   flags [{id, name, free}] — свои флаги преподавателя;
                   monthMode 'x4'|'tpl' — как считать «в месяц» (В4б) }
     incomeGroups — группы дохода (В4б, фильтр статистики):
                   [{id, name, members [student_id], from, to, auto}];
                   auto — в группу сами попадают все ученики, кроме out
   ========================================================== */
(function(){
  const LS_KEY = 'teacher:settings:v1';
  const FORMAT_LABELS = { single: 'Индивидуальное', pair: 'Пара', group: 'Группа', semi: 'Полупараллелка' };
  const DEFAULTS = { sessionBind: 'browser', labels: 'show', labelDates: true, labelCount: true, lessonMin: 60,
                     formatLabels: Object.assign({}, FORMAT_LABELS),
                     pay: { skipRule: 'free', reason: 'болезнь', remindLeft: 1, remindDays: 3, flags: [], monthMode: 'x4' },
                     incomeGroups: [] };
  const listeners = [];
  let cur = null;

  // чужие и испорченные значения отбрасываем: настройку правят руками в базе
  function normalize(raw){
    const o = Object.assign({}, DEFAULTS, { pay: normalizePay(null), incomeGroups: [] });
    if (!raw || typeof raw !== 'object') return o;
    if (raw.sessionBind === 'tab' || raw.sessionBind === 'browser') o.sessionBind = raw.sessionBind;
    if (['show', 'off', 'hide_solved'].indexOf(raw.labels) >= 0) o.labels = raw.labels;
    if (typeof raw.labelDates === 'boolean') o.labelDates = raw.labelDates;
    if (typeof raw.labelCount === 'boolean') o.labelCount = raw.labelCount;
    const m = Math.round(Number(raw.lessonMin));
    if (m >= 5 && m <= 720) o.lessonMin = m;
    // объект по умолчанию не делим между копиями: правка одной не должна
    // менять DEFAULTS
    o.formatLabels = Object.assign({}, FORMAT_LABELS);
    if (raw.formatLabels && typeof raw.formatLabels === 'object') {
      Object.keys(FORMAT_LABELS).forEach(k => {
        const v = typeof raw.formatLabels[k] === 'string' ? raw.formatLabels[k].trim().slice(0, 30) : '';
        if (v) o.formatLabels[k] = v;
      });
    }
    o.pay = normalizePay(raw.pay);
    o.incomeGroups = normalizeGroups(raw.incomeGroups);
    return o;
  }
  // флаги правят руками на странице — id латиницей, имя до 30 знаков, не больше 20
  function normalizePay(raw){
    const d = DEFAULTS.pay, o = Object.assign({}, d, { flags: [] });
    if (!raw || typeof raw !== 'object') return o;
    if (raw.skipRule === 'free' || raw.skipRule === 'charge') o.skipRule = raw.skipRule;
    if (raw.monthMode === 'x4' || raw.monthMode === 'tpl') o.monthMode = raw.monthMode;
    if (typeof raw.reason === 'string') o.reason = raw.reason.trim().slice(0, 60);
    const n = Math.round(Number(raw.remindLeft));
    if (raw.remindLeft !== '' && raw.remindLeft != null && n >= 0 && n <= 20) o.remindLeft = n;
    const dd = Math.round(Number(raw.remindDays));
    if (raw.remindDays !== '' && raw.remindDays != null && dd >= 0 && dd <= 60) o.remindDays = dd;
    if (Array.isArray(raw.flags)) {
      const seen = new Set();
      raw.flags.forEach(f => {
        if (!f || typeof f !== 'object' || o.flags.length >= 20) return;
        const id = String(f.id || ''), name = String(f.name || '').trim().slice(0, 30);
        if (!/^[a-z0-9_-]{1,24}$/.test(id) || !name || seen.has(id)) return;
        seen.add(id);
        o.flags.push({ id, name, free: !!f.free });
      });
    }
    return o;
  }
  // группы дохода: не больше 20, в составе — id учеников (не имена, как в
  // старом приложении: опечатка в имени не должна терять ученика)
  function normalizeGroups(raw){
    const out = [], seen = new Set();
    const day = v => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);
    const ids = v => (Array.isArray(v) ? Array.from(new Set(v.map(String).filter(x => x && x.length <= 64))).slice(0, 500) : []);
    (Array.isArray(raw) ? raw : []).forEach(g => {
      if (!g || typeof g !== 'object' || out.length >= 20) return;
      const id = String(g.id || ''), name = String(g.name || '').trim().slice(0, 40);
      if (!/^[a-z0-9_-]{1,24}$/.test(id) || !name || seen.has(id)) return;
      seen.add(id);
      out.push({ id, name, members: ids(g.members), out: ids(g.out), from: day(g.from), to: day(g.to), auto: !!g.auto });
    });
    return out;
  }
  function readLocal(){
    try { return normalize(JSON.parse(localStorage.getItem(LS_KEY) || 'null')); } catch (e) { return normalize(null); }
  }
  function writeLocal(s){ try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch (e) {} }
  function emit(){ listeners.slice().forEach(f => { try { f(cur); } catch (e) {} }); }

  function get(){ if (!cur) cur = readLocal(); return Object.assign({}, cur); }

  // подтянуть с сервера; нет входа или связи — остаётся локальная копия
  async function load(){
    const C = window.CabinetCloud;
    get();
    if (!C) return cur;
    try {
      const remote = await C.getSettings();
      if (remote) { cur = normalize(remote); writeLocal(cur); emit(); }
    } catch (e) { /* копия достаточна */ }
    return get();
  }

  // patch сразу в копию (интерфейс не ждёт сеть), потом на сервер; ошибка
  // сервера всплывает наверх, а локальная копия остаётся — страница покажет
  // «не сохранилось на сервере»
  let saving = Promise.resolve();
  function set(patch){
    cur = normalize(Object.assign({}, get(), patch));
    writeLocal(cur);
    emit();
    const C = window.CabinetCloud;
    if (!C) return Promise.resolve(false);
    const snap = Object.assign({}, cur);
    // по очереди: быстрые щелчки не должны обогнать друг друга на сервере
    saving = saving.catch(() => {}).then(() => C.saveSettings(snap)).then(() => true);
    return saving;
  }
  function onChange(f){ listeners.push(f); }

  window.addEventListener('storage', e => {
    if (e.key === LS_KEY) { cur = readLocal(); emit(); }
  });

  window.TeacherSettings = { DEFAULTS, FORMAT_LABELS, get, load, set, onChange, normalize };
})();
