/* ═══════════════════════════════════════════════════════════════════════
   cloud-migrate.js — все доски на сервер (промпт №90, переезд досок на
   сервер, шаг 2).

   Зачем. Доски жили только в хранилище браузера: падение вкладки портило
   его, и уроки висели на волоске (HANDOFF, раздел 6, «Если доски тормозят
   или падают»). Облачные доски (boards-cloud.js: таблицы boards и
   board_objects, синхронизация, версии) уже были, но только по кнопке
   «Сделать общей». Теперь каждая доска учителя становится облачной сама —
   браузер остаётся копией: очистил хранилище, вошёл, всё на месте.

   Как. После входа, в фоне, по одной: доска подгружается с диска, её
   картинки уходят файлами в хранилище (image-store.js, convertBoard — без
   этого в базу уехали бы мегабайты текста), заводится строка в boards и
   все объекты пишутся в board_objects кусками по 100. Только когда всё
   записалось, доске ставится cloudBoardId — дальше ею занимается обычная
   облачная синхронизация. Номер строки boards запоминается до записи
   объектов (cloudPendingId): оборванный перенос продолжит ту же строку, а не
   заведёт вторую. Открытую сейчас доску не трогаем — она переедет, когда её
   закроют. Новые доски подхватываются тем же циклом раз в минуту.
   Если хранилище картинок недоступно — ничего не переносим и ждём.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const EVERY_MS = 60 * 1000;
  let running = false;

  function uid() { return (window.CURRENT_USER && window.CURRENT_USER.id) || ''; }
  function ready() {
    return !!(uid() && window.SB && window.SB.from && window.ImageStore && !window.ImageStore.isOff()
      && typeof getDB === 'function' && Array.isArray(getDB().boards));
  }
  function isOpen(b) { return typeof boardActive !== 'undefined' && boardActive && typeof B !== 'undefined' && B && B.id === b.id; }
  // доски из корзины на сервер не везём: через 5 дней их всё равно сотрут
  function pendingBoards() { return ready() ? getDB().boards.filter(b => !b.cloudBoardId && !b.trashedAt && !isOpen(b)) : []; }

  // плашка «переношу» — только на списке досок и только пока идёт перенос
  function status(text) {
    let el = document.getElementById('bdCloudMigrate');
    if (!text) { if (el) el.remove(); return; }
    if (!el) {
      el = document.createElement('div');
      el.id = 'bdCloudMigrate';
      el.style.cssText = 'position:fixed;left:16px;bottom:16px;z-index:500;padding:8px 12px;border-radius:10px;'
        + 'background:var(--glass-strong,rgba(255,255,255,.9));border:1px solid var(--glass-border,rgba(0,0,0,.1));'
        + 'box-shadow:var(--shadow,0 4px 16px rgba(0,0,0,.12));font:13px/1.3 var(--font-ui,system-ui),sans-serif;color:var(--ink,#1b2230)';
      document.body.appendChild(el);
    }
    el.textContent = text;
  }

  async function migrateOne(b) {
    const wasUnloaded = b.objects === undefined;
    await ensureBoardLoaded(b);
    await window.ImageStore.convertBoard(b);
    let id = b.cloudPendingId;
    if (!id) {
      const { data, error } = await window.SB.from('boards').insert({ owner: uid(), title: b.name || 'Доска' }).select().single();
      if (error) throw error;
      id = data.id;
      b.cloudPendingId = id;
      markBoardDirty(b.id);
      await idbSaveDB();
    }
    const rows = (b.objects || []).map(o => ({ board_id: id, obj_id: o.id, data: o, updated_by: uid() }));
    for (let i = 0; i < rows.length; i += 100) {
      const { error } = await window.SB.from('board_objects').upsert(rows.slice(i, i + 100), { onConflict: 'board_id,obj_id' });
      if (error) throw error;
    }
    // доску могли открыть, пока писали, — тогда её откроет уже облачная ветка
    // со следующего раза; сейчас только пометка
    b.cloudBoardId = id;
    b.cloudRole = 'owner';
    delete b.cloudPendingId;
    markBoardDirty(b.id);
    await idbSaveDB();
    if (wasUnloaded && !isOpen(b)) unloadBoard(b);
  }

  async function run() {
    if (running) return { skipped: 'уже идёт' };
    const list = pendingBoards();
    if (!list.length) return { moved: 0 };
    running = true;
    let moved = 0;
    try {
      for (const b of list) {
        if (!ready() || b.cloudBoardId || isOpen(b)) continue;
        if (typeof boardActive === 'undefined' || !boardActive) status(`Переношу доски на сервер: ${moved + 1} из ${list.length}`);
        await migrateOne(b);
        moved++;
      }
      if (moved && typeof renderList === 'function' && !boardActive) renderList();
    } catch (err) {
      console.warn('[перенос на сервер] остановлен, повторю позже:', (err && err.message) || err);
    } finally {
      running = false;
      status('');
    }
    return { moved };
  }

  setTimeout(() => { run(); setInterval(run, EVERY_MS); }, 8000);
  window.CloudMigrate = { run, pending: () => pendingBoards().length };
})();
