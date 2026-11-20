/* Структура экзаменов в одном месте: какие номера есть, на какой странице они
   живут, к какой части относятся, сколько первичных баллов дают и каким
   ответом (короткий / развёрнутый). Отсюда берут стрелки ◀ ▶ у заголовка
   (exam-nav.js), а дальше — конструктор вариантов. Подключать ПЕРЕД exam-nav.js.

   Поля номера: slug — страница, n — номер в адресе (если страница одна на
   несколько номеров), label — подпись, part — 1 или 2, points — первичный
   балл, answer — 'short' | 'long'. Если значение не подтверждено документом
   ФИПИ — null, а не догадка.

   Источники баллов. Математика ОГЭ и ЕГЭ база — спецификации КИМ ФИПИ (в
   fipi-pilot/demo/ демоверсий по математике нет; структура в 2027 не менялась).
   Остальное — спецификации КИМ 2027 из fipi-pilot/demo/ (раздел «Система
   оценивания»). Максимум по документу / сумма у нас:
   - ОГЭ обществознание: 32 / 32 (№1–20 как в КИМ 2027; «Дополнительно к
     тексту» ?n=21 в круг не входит). part null: в документе частей нет, краткие
     и развёрнутые ответы идут вперемешку (№1, 7, 8, 12, 17–20 — развёрнутые);
   - ОГЭ физика: 39 / 23 (наши №1–16 — краткие; развёрнутые №17–22 дают 16
     баллов, на сайте их нет). part null: в документе частей нет;
   - ОГЭ информатика: 21 / 10 (на сайте только №1–10 из 16; №11–16 нет);
     часть 1 — №1–12, часть 2 — №13–16;
   - ОГЭ английский: 68 / 68 (письменная 53 + устная 15). part 1 — письменная
     часть, 2 — устная (в документе части названы так, не «Часть 1/2»); №5 и
     №12 — задания на соответствие, 5 и 6 баллов, ответ краткий;
   - ЕГЭ русский: 50 / 50 (часть 1 — 28, сочинение №27 — 22);
   - ЕГЭ обществознание: 58 / 58 (часть 1 — 28, часть 2 — 30);
   - ЕГЭ профиль: 32 / 32 по утверждённой спецификации ФИПИ 2027.
   - ОГЭ русский — документа 2027 локально нет: null. */
(function () {
  'use strict';
  if (window.ExamSpec) return;

  const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
  const mk = (slug, n, label, part, points, answer) => {
    const o = { slug: slug, label: label, part: part, points: points, answer: answer };
    if (n != null) o.n = n;
    return o;
  };

  // ОГЭ математика. Порядок — как в каталоге на главной. №1–5 и №15–18 — один
  // тренажёр на несколько номеров, поэтому позиция — страница; №1–19 по 1 баллу,
  // №20–25 по 2 (итого 31)
  const OGE_PART1 = [
    ['oge1_5', '№1–5', 5], ['oge6', '№6', 1], ['oge7', '№7', 1], ['oge8', '№8', 1], ['oge9', '№9', 1],
    ['oge10', '№10', 1], ['oge11', '№11', 1], ['oge12', '№12', 1], ['oge13', '№13', 1], ['oge14', '№14', 1],
    ['oge15_18', '№15–18', 4], ['oge19', '№19', 1],
  ];
  const oge = OGE_PART1.map(([s, label, pts]) => mk(s, null, label, 1, pts, 'short'))
    .concat(range(20, 25).map(n => mk('oge_part2', n, '№' + n, 2, 2, 'long')));

  // ЕГЭ база: 21 задание по 1 баллу, все с кратким ответом
  const egeBase = range(1, 21).map(n => mk('ege_base', n, '№' + n, 1, 1, 'short'));

  // ЕГЭ профиль: №1–12 с кратким ответом, №13–19 с развёрнутым.
  const egeProf = range(1, 12).map(n => mk('ege_prof', n, '№' + n, 1, 1, 'short'))
    .concat([2, 3, 2, 2, 3, 4, 4].map((points, i) => mk('ege_prof', i + 13, '№' + (i + 13), 2, points, 'long')));

  // обществознание ОГЭ: №1–20 как в КИМ 2027, максимум 32 (спецификация, раздел 11).
  // Развёрнутые — 1, 7, 8, 12, 17–20; №12 — 4 балла, №20 — 3, №14 — 2 (краткий),
  // 1, 7, 8, 17–19 — по 2, остальные краткие — по 1. Часть не задаём (в документе её нет)
  const SOC_OGE_PTS = { 1: 2, 7: 2, 8: 2, 12: 4, 14: 2, 17: 2, 18: 2, 19: 2, 20: 3 };
  const SOC_OGE_LONG = [1, 7, 8, 12, 17, 18, 19, 20];
  const socOge = range(1, 20).map(n => mk('soc_oge', n, '№' + n, null, SOC_OGE_PTS[n] || 1,
    SOC_OGE_LONG.indexOf(n) >= 0 ? 'long' : 'short'));

  // физика ОГЭ: №1–16 краткие, итого 23 из 39 (№17–22 на сайте нет): по 2 балла
  // у №1, 2, 4, 12, 13, 14, 16, по 1 у остальных
  const PHYS_2 = [1, 2, 4, 12, 13, 14, 16];
  const physOge = range(1, 16).map(n => mk('phys_oge', n, '№' + n, null, PHYS_2.indexOf(n) >= 0 ? 2 : 1, 'short'));

  // информатика ОГЭ: на сайте №1–10 (краткие, по 1 баллу, часть 1); №11–16 нет
  const infOge = range(1, 10).map(n => mk('inf_oge', n, '№' + n, 1, 1, 'short'));

  // обществознание ЕГЭ (58): часть 1 — №1–16 краткие, по 1 баллу у №1, 3, 9, 12,
  // по 2 у остальных; часть 2 — №17–25 развёрнутые
  const SOC_EGE_1 = [1, 3, 9, 12];
  const SOC_EGE_2 = { 17: 2, 18: 2, 19: 3, 20: 3, 21: 3, 22: 4, 23: 3, 24: 4, 25: 6 };
  const socEge = range(1, 25).map(n => n <= 16
    ? mk('soc_ege', n, '№' + n, 1, SOC_EGE_1.indexOf(n) >= 0 ? 1 : 2, 'short')
    : mk('soc_ege_long', n, '№' + n, 2, SOC_EGE_2[n], 'long'));

  // русский ЕГЭ (50): №1–26 — rus_ege.html (номер в адресе, хук __examNav), часть 1,
  // по 1 баллу, кроме №8 и №22 (по 2); №27 — сочинение, часть 2, 22 балла
  const rusEge = range(1, 26).map(n => mk('rus_ege', n, '№' + n, 1, (n === 8 || n === 22) ? 2 : 1, 'short'))
    .concat([mk('rus_ege27', null, '№27', 2, 22, 'long')]);

  // русский ОГЭ: №1 и №13 — свои страницы (изложение, сочинение), №2–12 — одна
  // страница rus_oge.html, номер в адресе, меняется без перезагрузки (хук __examNav)
  const rusOge = [mk('rus_oge01', null, '№1', null, null, 'long')]
    .concat(range(2, 12).map(n => mk('rus_oge', n, '№' + n, null, null, 'short')))
    .concat([mk('rus_oge13', null, '№13', null, null, 'long')]);

  // английский ОГЭ (68): в адресе первый номер набора (eng_oge.html, банк eng-oge-bank.js);
  // points — сумма баллов КИМ за номера набора (по 1 балл, кроме №5 — 5, №12 — 6,
  // №35 — 10, устная часть — 2 / 6 / 7); part 1 — письменная, 2 — устная
  const engOge = [
    [1, '№1–4', 1, 4], [5, '№5', 1, 5], [6, '№6–11', 1, 6], [12, '№12', 1, 6], [13, '№13–19', 1, 7],
    [20, '№20–28', 1, 9], [29, '№29–34', 1, 6], [35, '№35', 1, 10], [36, 'устная часть, №1', 2, 2],
    [37, 'устная часть, №2', 2, 6], [38, 'устная часть, №3', 2, 7],
  ].map(([n, label, part, pts]) => mk('eng_oge', n, label, part, pts, n >= 35 ? 'long' : 'short'));

  const exams = {
    oge: { title: 'ОГЭ', list: oge },
    ege_base: { title: 'ЕГЭ база', list: egeBase },
    ege_prof: { title: 'ЕГЭ профиль', list: egeProf },
    soc_oge: { title: 'ОГЭ обществознание', list: socOge },
    phys_oge: { title: 'ОГЭ физика', list: physOge },
    inf_oge: { title: 'ОГЭ информатика', list: infOge },
    soc_ege: { title: 'ЕГЭ обществознание', list: socEge },
    rus_oge: { title: 'ОГЭ русский', list: rusOge },
    rus_ege: { title: 'ЕГЭ русский', list: rusEge },
    eng_oge: { title: 'ОГЭ английский', list: engOge },
  };

  // номер экзамена по странице (и номеру в адресе, если он есть): { exam, pos } или null
  function find(slug, n) {
    const ids = Object.keys(exams);
    for (let i = 0; i < ids.length; i++) {
      const list = exams[ids[i]].list;
      for (let j = 0; j < list.length; j++) {
        const p = list[j];
        if (p.slug === slug && (p.n == null || p.n === n)) return Object.assign({ exam: ids[i] }, p);
      }
    }
    return null;
  }

  // Таблица пробников идёт по всем номерам КИМ, включая задания без тренажёра.
  // Письменная и устная части иностранных языков записываются отдельно.
  // Дополнительные максимумы — из разделов об оценивании спецификаций ФИПИ 2027.
  const withExceptions = (length, exceptions) => range(1, length).map(n => exceptions[n] ?? 1);
  const SCORE_MAXIMA = {
    oge:range(1, 25).map(n => n <= 19 ? 1 : 2),
    rus_oge:withExceptions(13, { 1:6, 13:8 }),
    phys_oge:physOge.map(task => task.points).concat(3, 2, 2, 3, 3, 3),
    inf_oge:infOge.map(task => task.points).concat(1, 1, 2, 3, 2, 2),
    eng_oge:withExceptions(35, { 5:5, 12:6, 35:10 }),
    eng_oge_oral:[2, 6, 7],
    eng_ege:withExceptions(38, { 1:2, 2:3, 10:3, 11:2, 37:6, 38:14 }),
    eng_ege_oral:[1, 4, 5, 10],
    phys_ege:withExceptions(26, {
      5:2, 6:2, 9:2, 10:2, 14:2, 15:2, 17:2, 18:2,
      21:3, 22:2, 23:2, 24:3, 25:3, 26:4,
    }),
    inf_ege:withExceptions(27, { 26:2, 27:2 }),
  };
  function scoreSlots(id, count) {
    const maxima = SCORE_MAXIMA[id] || exams[id]?.list.map(task => task.points) || [];
    const slots = range(1, count).map(n => ({ key:String(n), label:String(n), max:maxima[n - 1] ?? null }));
    if (id === 'rus_oge') slots.push({ key:'literacy', label:'Грамотность', max:13 });
    return slots;
  }

  window.ExamSpec = { exams: exams, find: find, scoreSlots: scoreSlots };
})();
