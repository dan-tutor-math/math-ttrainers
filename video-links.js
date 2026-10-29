/* ═══════════════════════════════════════════════════════════════════════
   Видео на платформе, этап 1: какие видео есть и к чему они привязаны.

   Пока это статический файл в репозитории: добавить видео = вставить запись
   из вывода tools/video/hls-upload.sh и запушить. На втором этапе то же
   самое переедет в Supabase (таблицы videos и video_links) и админку
   привязки — поэтому поля здесь ровно те, что будут столбцами таблиц, и
   имена те же. Плееру (video-player.js) всё равно, откуда пришли строки.

   videos — одно видео (одна загрузка в бакет mathh-video):
     slug        text primary key — латиница и дефис; он же ключ места
                 остановки в localStorage, поэтому не меняется после выкладки
     title       text — заголовок окна плеера
     kind        text — 'razbor' (разбор заданий) или 'guide' (гайд по теме):
                 от него надпись кнопки «Смотреть разбор» / «Смотреть гайд»
     duration    int — секунды, печатает скрипт нарезки
     hls_url     text — ссылка на master.m3u8; пустая строка — видео ещё не
                 загружено, кнопки нет (так запись можно завести заранее)
     poster_url  text — постер jpg
     chapters    jsonb — [{ t: секунда начала, title: 'название' }] по порядку

   video_links — где показывать кнопку:
     video_slug  text references videos(slug)
     page        text — слаг страницы (= имя файла без .html, как везде)
     block_key   text — ключ блока на странице (у oge1_5 — key группы в GROUPS)
     task_key    text null — id задания внутри блока; null — на весь блок.
                 Привязка к заданию важнее привязки к блоку.
   ═══════════════════════════════════════════════════════════════════════ */
window.VIDEO_LINKS = {
  videos: [
    // Разбор шин ОГЭ №1–5 (монтаж v7, 30.10.2026): теория, задания 1–5, итог формул
    { slug: 'oge1-5-tire-razbor', title: 'Шины: разбор заданий 1–5', kind: 'razbor', duration: 1309,
      hls_url: 'https://mathh-video.s3.cloud.ru/oge1-5-tire-razbor/20261030-003540/master.m3u8',
      poster_url: 'https://mathh-video.s3.cloud.ru/oge1-5-tire-razbor/20261030-003540/poster.jpg',
      chapters: [{ t: 0, title: 'Вступление' }, { t: 10, title: 'Теория: маркировка шины' }, { t: 190, title: 'Задание 1 — ширина шины' }, { t: 268, title: 'Задание 2 — высота боковины' }, { t: 456, title: 'Задание 3 — диаметр колеса' }, { t: 663, title: 'Задание 4 — на сколько уменьшится диаметр' }, { t: 828, title: 'Задание 5 — на сколько процентов увеличится пробег' }, { t: 1259, title: 'Все формулы шин' }] },
    // Разбор ОГЭ №8 «Степени и корни» — на всю страницу (кнопка на выборе прототипа и в каждом типе)
    { slug: 'oge8-stepeni-korni-razbor', title: 'ОГЭ №8: степени и корни', kind: 'razbor', duration: 4108,
      hls_url: 'https://mathh-video.s3.cloud.ru/oge8-stepeni-korni-razbor/20261030-005518/master.m3u8',
      poster_url: 'https://mathh-video.s3.cloud.ru/oge8-stepeni-korni-razbor/20261030-005518/poster.jpg',
      chapters: [] },
  ],
  links: [
    { video_slug: 'oge1-5-tire-razbor', page: 'oge1_5', block_key: 'tire', task_key: null },
    // block_key 'all' — вся страница ОГЭ №8; разбор отдельного типа можно привязать с task_key = id типа
    { video_slug: 'oge8-stepeni-korni-razbor', page: 'oge8', block_key: 'all', task_key: null },
  ],
};
