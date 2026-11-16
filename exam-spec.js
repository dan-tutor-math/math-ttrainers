/* Структура экзаменов в одном месте: какие номера есть, на какой странице они
   живут, к какой части относятся, сколько первичных баллов дают и каким
   ответом (короткий / развёрнутый). Отсюда берут стрелки ◀ ▶ у заголовка
   (exam-nav.js), а дальше — конструктор вариантов. Подключать ПЕРЕД exam-nav.js.

   Поля номера: slug — страница, n — номер в адресе (если страница одна на
   несколько номеров), label — подпись, part — 1 или 2, points — первичный
   балл, answer — 'short' | 'long'. Если значение не подтверждено документом
   ФИПИ — null, а не догадка.

   Источники баллов: математика ОГЭ / ЕГЭ — спецификации КИМ ФИПИ (в
   fipi-pilot/demo/ демоверсий по математике нет, значения сверены по памяти
   со спецификацией, не по локальному файлу). Обществознание, русский и
   английский ОГЭ: нумерация нашего каталога не совпадает с номерами
   демоверсии 2027 (в ней 20 заданий, у нас 19 позиций), поэтому points и part
   пока null. */
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

  // ЕГЭ профиль: №1–12 по 1 баллу (краткий); №13 — 2, №14 — 3, №15 — 2,
  // №16 — 2, №17 — 3, №18 — 4, №19 — 4 (развёрнутый); итого 32
  const PROF_LONG = { 13: 2, 14: 3, 15: 2, 16: 2, 17: 3, 18: 4, 19: 4 };
  const egeProf = range(1, 19).map(n => n <= 12
    ? mk('ege_prof', n, '№' + n, 1, 1, 'short')
    : mk('ege_prof', n, '№' + n, 2, PROF_LONG[n], 'long'));

  // обществознание ОГЭ: нумерация нашего банка — 19 позиций; баллы и часть не подтверждены
  const socOge = range(1, 19).map(n => mk('soc_oge', n, '№' + n, null, null, null));

  // русский ОГЭ: №1 и №13 — свои страницы (изложение, сочинение), №2–12 — одна
  // страница rus_oge.html, номер в адресе, меняется без перезагрузки (хук __examNav)
  const rusOge = [mk('rus_oge01', null, '№1', null, null, 'long')]
    .concat(range(2, 12).map(n => mk('rus_oge', n, '№' + n, null, null, 'short')))
    .concat([mk('rus_oge13', null, '№13', null, null, 'long')]);

  // английский ОГЭ: в адресе первый номер набора (eng_oge.html, банк eng-oge-bank.js)
  const engOge = [
    [1, '№1–4'], [5, '№5'], [6, '№6–11'], [12, '№12'], [13, '№13–19'], [20, '№20–28'], [29, '№29–34'],
    [35, '№35'], [36, 'устная часть, №1'], [37, 'устная часть, №2'], [38, 'устная часть, №3'],
  ].map(([n, label]) => mk('eng_oge', n, label, null, null, n >= 35 ? 'long' : 'short'));

  const exams = {
    oge: { title: 'ОГЭ', list: oge },
    ege_base: { title: 'ЕГЭ база', list: egeBase },
    ege_prof: { title: 'ЕГЭ профиль', list: egeProf },
    soc_oge: { title: 'ОГЭ обществознание', list: socOge },
    rus_oge: { title: 'ОГЭ русский', list: rusOge },
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

  window.ExamSpec = { exams: exams, find: find };
})();
