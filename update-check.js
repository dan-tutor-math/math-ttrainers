/* ═══════════════════════════════════════════════════════════════════════
   update-check.js — сигнал «есть обновление платформы».

   Зачем. Пуш в main сразу оказывается на сайте, а открытые вкладки об этом
   не знают и продолжают работать на старом коде часами — до перезагрузки.
   Файла версии не заводим: сам сервер (GitHub Pages) отдаёт у каждого файла
   Last-Modified и ETag, и они меняются при каждом деплое. Запоминаем метку
   boards-core.js при первой удачной проверке и сверяем при возврате на
   вкладку и раз в 10 минут. Стала новее — спокойная плашка «Есть обновление
   платформы» с кнопкой «Обновить».

   Главная метка — Last-Modified, и плашка только если дата стала ПОЗЖЕ.
   ETag тут ненадёжен: у одного и того же файла CDN отдаёт то W/"x" (ответ
   сжат), то "x" (не сжат), и простое сравнение строк давало плашку снова и
   снова без всякого деплоя. А узлы CDN после деплоя минут десять отдают
   кто старую, кто новую версию — «стала старше» не повод звать обновляться.

   Чего здесь нет нарочно: никаких записей в хранилище и никаких
   перезагрузок без нажатия — идёт урок. Ошибка сети, пустой заголовок,
   ответ не 200 — молча пропускаем, проверим в следующий раз. На странице
   просмотра (?s=КОД, window.__boardViewer) не запускаемся: ученика посреди
   урока не дёргаем.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.__boardViewer) return;

  const PROBE = 'boards-core.js';
  const EVERY_MS = 10 * 60 * 1000;
  let known = null;     // метка boards-core.js с первой удачной проверки
  let busy = false;

  // Метка версии: время из Last-Modified (число), а без него — ETag без
  // приставки слабого W/ (строка). Ничего пригодного — null.
  function stamp(r) {
    const lm = Date.parse(r.headers.get('Last-Modified') || '');
    if (!isNaN(lm)) return lm;
    const et = (r.headers.get('ETag') || '').replace(/^W\//, '').trim();
    return et || null;
  }

  function isNewer(v, was) {
    if (typeof v === 'number' && typeof was === 'number') return v > was;
    // разного рода метки (заголовок то был, то нет) не сравниваем — молчим
    if (typeof v !== typeof was) return false;
    return v !== was;
  }

  async function check() {
    if (busy || document.getElementById('bdUpdate')) return;
    busy = true;
    try {
      const r = await fetch(PROBE, { method: 'HEAD', cache: 'no-store' });
      if (r.status !== 200) return;
      const v = stamp(r);
      if (v === null) return;
      if (known === null) { known = v; return; }
      if (isNewer(v, known)) show();
    } catch (e) {
      // сеть пропала или сервер не ответил — не повод беспокоить человека
    } finally {
      busy = false;
    }
  }

  function show() {
    if (document.getElementById('bdUpdate')) return;
    // замок хранилища уже сказал «перезагрузите» громче — вторая плашка лишняя
    if (document.getElementById('bdOutdated')) return;
    if (!document.getElementById('bdUpdateCss')) {
      const css = document.createElement('style');
      css.id = 'bdUpdateCss';
      // спокойная плашка: стекло и цвет текста страницы, без красного —
      // это приглашение, а не тревога; место ищет placeTopBanner, чтобы не
      // перекрывать инструменты
      css.textContent = '#bdUpdate{position:fixed;left:16px;top:64px;z-index:900;display:inline-flex;align-items:center;gap:10px;'
        + 'box-sizing:border-box;min-height:34px;padding:4px 6px 4px 12px;border-radius:10px;white-space:nowrap;'
        + 'border:1px solid var(--glass-border,rgba(0,0,0,.1));background:var(--glass-strong,rgba(255,255,255,.95));'
        + 'color:var(--ink,#1b2230);font:600 13.5px/1.3 var(--font-ui,system-ui),sans-serif;'
        + 'box-shadow:var(--shadow,0 4px 16px rgba(0,0,0,.12));'
        + 'backdrop-filter:blur(20px) saturate(180%);-webkit-backdrop-filter:blur(20px) saturate(180%)}'
        + '#bdUpdate button{flex:none;font:inherit;font-weight:700;border:1px solid currentColor;border-radius:8px;'
        + 'padding:4px 12px;cursor:pointer;background:transparent;color:inherit}'
        + '#bdUpdate .tb-short{display:none}#bdUpdate.mini .tb-long{display:none}#bdUpdate.mini .tb-short{display:inline}';
      document.head.appendChild(css);
    }
    const bar = document.createElement('div');
    bar.id = 'bdUpdate';
    bar.setAttribute('role', 'status');
    const long = document.createElement('span');
    long.className = 'tb-long';
    long.textContent = 'Есть обновление платформы';
    const short = document.createElement('span');
    short.className = 'tb-short';
    short.textContent = 'Обновление';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'Обновить';
    btn.addEventListener('click', () => location.reload());
    bar.appendChild(long); bar.appendChild(short); bar.appendChild(btn);
    document.body.appendChild(bar);
    if (typeof window.keepTopBannerPlaced === 'function') window.keepTopBannerPlaced(bar);
  }

  check();
  setInterval(check, EVERY_MS);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') check();
  });
  window.__updateCheck = { check, known: () => known };
})();
