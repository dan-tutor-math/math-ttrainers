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
   ========================================================== */
(function(){
  const LS_KEY = 'teacher:settings:v1';
  const DEFAULTS = { sessionBind: 'browser', labels: 'show', labelDates: true, labelCount: true, lessonMin: 60 };
  const listeners = [];
  let cur = null;

  // чужие и испорченные значения отбрасываем: настройку правят руками в базе
  function normalize(raw){
    const o = Object.assign({}, DEFAULTS);
    if (!raw || typeof raw !== 'object') return o;
    if (raw.sessionBind === 'tab' || raw.sessionBind === 'browser') o.sessionBind = raw.sessionBind;
    if (['show', 'off', 'hide_solved'].indexOf(raw.labels) >= 0) o.labels = raw.labels;
    if (typeof raw.labelDates === 'boolean') o.labelDates = raw.labelDates;
    if (typeof raw.labelCount === 'boolean') o.labelCount = raw.labelCount;
    const m = Math.round(Number(raw.lessonMin));
    if (m >= 5 && m <= 720) o.lessonMin = m;
    return o;
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

  window.TeacherSettings = { DEFAULTS, get, load, set, onChange, normalize };
})();
