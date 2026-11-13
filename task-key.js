/* ═══════════════ Ключ задания (кабинет преподавателя, задача А1) ═══════════════
   Одна строка, по которой журнал «что уже решал ученик» (student_task_log)
   узнаёт задание, откуда бы оно ни пришло — из тренажёра, с доски или из работы:

     fipi:<экзамен>:<номер>   — задание открытого банка ФИПИ; номер — тот, что
                                стоит в подписи «задание 2933FB» (регистр как в банке)
     gen:<страница>:<вид>     — сгенерированное или авторское задание: вид — id типа
                                (прототипа) на странице, например gen:oge6:p3

   Экзамен — короткое имя банка, а не страницы: у ОГЭ по математике одна выгрузка
   на oge1_5…oge19 и oge_part2, поэтому для них одно «oge».
     oge — математика ОГЭ; ege — ЕГЭ профиль; egeb — ЕГЭ база;
     soc — обществознание ОГЭ; eng — английский ОГЭ; rus — русский язык ОГЭ.

   Откуда берётся номер (проверено аудитом, claude-notes/task-key-audit.md):
     — страницы ОГЭ (oge1_5, 6, 7, 9, 15_18, 19): curTask.fipi в снимке tsGetState,
       а значит и в рецепте доски trainerGenInfo (kind:'state', snap.curTask.fipi);
     — страницы-копии ege_prof (ЕГЭ, oge_part2, soc, eng): номер вшит в id прототипа
       «<n>.fipi.<НОМЕР>», в снимок и в рецепт (kind:'ege') ходит именно pid;
     — обществознание: id прототипа = номер ФИПИ (3B5147);
     — русский: id задания и есть номер ФИПИ (window.__examNav.pid()); снимка
       состояния и рецепта у этих страниц нет.

   Почему вид «вперемешку» (random*) не даёт gen-ключа: в снимке остаётся
   curMode 'random', а какой именно тип выпал, страницы не сохраняют. Ключ
   gen:oge6:random склеил бы разные типы в одну запись — лучше честный null.
   Если страница положит id выпавшего типа в задание (поле genKind), ключ
   появится без правок здесь.

   Модуль самостоятельный: от страницы ничего не требует, ничего не пишет,
   в совместную сессию и на доску не попадает. */
(function () {
  'use strict';
  if (window.TaskKey) return;

  const ID_RE = /^[0-9A-Za-z]{4,16}$/;

  // имя страницы или id тренажёра на доске → имя страницы-файла
  function canonPage(x) {
    if (x == null) return null;
    let s = String(x).split('?')[0].split('#')[0].replace(/^.*\//, '').replace(/\.html$/, '');
    if (!s) return null;
    if (/^ege\d+$/.test(s)) return 'ege_prof';
    if (/^egeb\d+$/.test(s)) return 'ege_base';
    if (/^oge2[0-5]$/.test(s)) return 'oge_part2';
    if (/^soc\d+$/.test(s)) return 'soc_oge';
    if (/^eng\d+$/.test(s)) return 'eng_oge';
    // русский: id тренажёра на доске rus<номер>; №1 и №13 — свои страницы
    if (s === 'rus1') return 'rus_oge01';
    if (s === 'rus13') return 'rus_oge13';
    if (/^rus\d+$/.test(s)) return 'rus_oge';
    return s;
  }
  function examOf(page) {
    const p = canonPage(page);
    if (!p) return null;
    if (p === 'ege_prof') return 'ege';
    if (p === 'ege_base') return 'egeb';
    if (p === 'soc_oge') return 'soc';
    if (p === 'eng_oge') return 'eng';
    if (/^rus_oge/.test(p)) return 'rus';
    if (/^oge/.test(p)) return 'oge';
    return null;
  }
  // страницы с моделью ЕГЭ: задание — прототип с id вида «<n>.fipi.<НОМЕР>»
  function isEgeLike(p) { return /^(ege_prof|ege_base|oge_part2|soc_oge|eng_oge)$/.test(p); }

  function fromTask(page, task) {
    const p = canonPage(page), exam = examOf(p);
    if (!exam || !task || typeof task !== 'object') return null;
    let id = task.fipi != null ? String(task.fipi).trim() : '';
    if (!ID_RE.test(id)) id = '';
    if (!id && isEgeLike(p) && task.id != null) {
      const m = /\.fipi\.([0-9A-Za-z]{4,16})$/.exec(String(task.id));
      if (m) id = m[1];
    }
    // русский и обществознание: id задания и есть номер ФИПИ
    if (!id && (exam === 'rus' || exam === 'soc') && task.id != null && ID_RE.test(String(task.id))) id = String(task.id);
    if (id) return 'fipi:' + exam + ':' + id;
    // не из банка: вид задания
    let kind = task.genKind || null;
    if (!kind && isEgeLike(p) && task.id != null) kind = String(task.id);
    if (!kind && task.mode && !/^random/i.test(String(task.mode))) kind = String(task.mode);
    return kind ? 'gen:' + p + ':' + kind : null;
  }

  // снимок состояния страницы (__trainerState.get / tsGetState)
  function fromState(page, st) {
    const p = canonPage(page);
    if (!p || !st || typeof st !== 'object') return null;
    if (isEgeLike(p)) return st.egePid != null ? fromTask(p, { id: st.egePid }) : null;
    if (!st.curTask) return null;
    return fromTask(p, Object.assign({}, st.curTask, { mode: st.curMode }));
  }

  // рецепт «такого же задания» на доске и в блоке работы (trainerGenInfo)
  function fromRecipe(rec) {
    if (!rec || typeof rec !== 'object') return null;
    if (rec.kind === 'ege') return rec.pid != null ? fromTask(rec.tid, { id: rec.pid }) : null;
    if (rec.kind === 'state') return fromState(rec.tid, rec.snap);
    return null;   // 'engine' (старые доски №9) и неизвестное — ключа нет
  }

  window.TaskKey = { fromTask, fromState, fromRecipe, examOf, canonPage };
})();
