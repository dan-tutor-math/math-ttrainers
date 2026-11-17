/* Набор конструктора вариантов — что учитель отметил «в вариант»: номера
   экзамена и прототипы, по сколько заданий и откуда в банке брать. Собирает
   его экран «Собрать вариант» (works.html, #/build), пополняют — тренажёры
   (этап 6). Здесь ничего не снимается и не грузится: только строки-рецепты,
   поэтому работает без входа и на любой странице.

   Строка: { id, exam, slug, n, tid, href, proto, pos, fipi, count, source,
   from, addedAt }. proto/pos пустые — «весь номер» (при сборке берётся первый
   прототип каталога и место с панели «с какого номера банка»).
   start/startFipi — «с какого места» у строки (этап 8, шаблоны): место в банке
   и номер ФИПИ на нём (по номеру ищется место, если банк перевыгрузят). Нет
   поля — место с панели, как раньше. tpl/tplRow — шаблон и номер его строки:
   после «Сохранить» работы шаблон запоминает, с какого места продолжать.

   Хранится в localStorage, как подборка (basket-core.js): ключ свой у каждой
   совместной сессии — учитель ведёт параллельные занятия в разных вкладках,
   и вариант для одного ученика не должен попадать к другому. Ключ считается
   при каждом обращении: код вкладки появляется позже загрузки страницы.
   Событие variantset:change приходит и в эту вкладку, и в другие (через
   storage), чтобы счётчики на кнопках не отставали. */
(function () {
  'use strict';
  if (window.VariantSet) return;

  const BASE_KEY = 'variantSet:v1';
  function key() {
    let c = null;
    try { c = sessionStorage.getItem('tsTab:code') || localStorage.getItem('trainerSession:global'); } catch (e) {}
    return c ? BASE_KEY + ':' + c : BASE_KEY;
  }
  function all() {
    try { const raw = localStorage.getItem(key()); const a = raw ? JSON.parse(raw) : []; return Array.isArray(a) ? a : []; }
    catch (e) { return []; }
  }
  function emit(items) {
    try { window.dispatchEvent(new CustomEvent('variantset:change', { detail: { items: items } })); } catch (e) {}
  }
  function save(items) {
    try { localStorage.setItem(key(), JSON.stringify(items)); } catch (e) {}
    emit(items);
    return items;
  }
  const FIELDS = ['exam', 'slug', 'n', 'tid', 'href', 'proto', 'pos', 'fipi', 'count', 'source', 'from', 'start', 'startFipi', 'tpl', 'tplRow'];
  function norm(item) {
    const o = {};
    FIELDS.forEach(f => { o[f] = item[f] == null || item[f] === '' ? null : item[f]; });
    o.n = o.n == null ? null : Number(o.n);
    o.pos = o.pos == null ? null : Number(o.pos);
    o.start = o.start == null ? null : Math.max(0, Math.round(Number(o.start)) || 0);
    o.tplRow = o.tplRow == null ? null : Number(o.tplRow);
    o.count = Math.max(1, Math.round(Number(item.count) || 1));
    if (o.source !== 'random') o.source = 'order';
    return o;
  }
  function add(item) {
    const items = all();
    const full = Object.assign({ id: 'vs' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7) },
      norm(item || {}), { addedAt: Date.now() });
    items.push(full);
    save(items);
    return full;
  }
  function update(id, patch) {
    const items = all();
    const i = items.findIndex(x => x.id === id);
    if (i < 0) return null;
    const merged = Object.assign({}, items[i], patch || {});
    items[i] = Object.assign({ id: id, addedAt: items[i].addedAt }, norm(merged));
    save(items);
    return items[i];
  }
  function remove(id) { save(all().filter(x => x.id !== id)); }
  function clear() { save([]); }
  function count() { return all().length; }
  // порядок строк = порядок групп в работе: перетаскивание в дереве Набора
  function move(id, toIndex) {
    const items = all();
    const i = items.findIndex(x => x.id === id);
    if (i < 0) return;
    const [it] = items.splice(i, 1);
    items.splice(Math.max(0, Math.min(items.length, toIndex)), 0, it);
    save(items);
  }
  // «Вернуть набор» после «Собрать» — положить строки как были
  function replace(items) { save((items || []).slice()); }

  window.addEventListener('storage', e => {
    if (e.key === key()) emit(all());
  });

  window.VariantSet = { all: all, add: add, update: update, remove: remove, clear: clear, count: count, move: move, replace: replace, key: key };
})();
