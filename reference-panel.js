/* Справочные материалы: общая панель для тренажёров и досок. */
(function () {
  'use strict';

  const TITLE = 'Справочные материалы';
  const BOOK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 6v14M12 6C9.5 4.2 6.5 3.9 3 4.7v14c3.5-.8 6.5-.5 9 1.3 2.5-1.8 5.5-2.1 9-1.3v-14c-3.5-.8-6.5-.5-9 1.3Z"/></svg>';
  const styles = `
    .rp-trigger{padding:0;touch-action:manipulation;user-select:none;-webkit-user-select:none;}
    .rp-trigger svg{width:20px;height:20px;}
    /* 208px — следующий ряд после темы, доски, фокуса и клавиатуры. */
    .theme-toggle.rp-trigger{top:208px;}
    .rp-dialog{box-sizing:border-box;inset:16px 0 66px;margin:auto;width:min(820px,calc(100% - 32px));max-width:none;
      height:min(780px,calc(100dvh - 82px));max-height:none;
      padding:0;border:1px solid var(--glass-border,#cfd7e0);border-radius:20px;color:var(--pencil,#17263b);
      background:var(--bg,#f5f7fb);box-shadow:0 18px 64px rgba(0,0,0,.25);font:15px/1.4 var(--font-ui,system-ui);}
    .rp-dialog.rp-wide{width:min(1000px,calc(100% - 32px));}
    .rp-dialog::backdrop{background:rgba(15,23,38,.45);}
    .rp-shell{display:flex;flex-direction:column;height:100%;min-height:0;}
    .rp-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 16px;
      border-bottom:1px solid var(--glass-border,#cfd7e0);background:var(--glass-strong,white);}
    .rp-title{margin:0;color:inherit;font:700 18px/1.2 var(--font-ui,system-ui);letter-spacing:normal;text-align:left;}
    .rp-close{flex:none;width:44px;height:44px;border:1px solid var(--glass-border,#cfd7e0);border-radius:12px;
      color:inherit;background:var(--glass,transparent);font:inherit;cursor:pointer;touch-action:manipulation;}
    @media(hover:hover) and (pointer:fine){.rp-close:hover{border-color:currentColor;}}
    .rp-close:active{background:var(--hover-1,rgba(127,127,127,.16));}
    .rp-content{flex:1;min-width:0;min-height:0;overflow:auto;overscroll-behavior:contain;}
    .rp-intro{margin:12px 14px;text-align:center;color:var(--muted-3,inherit);}
    .rp-pages{box-sizing:border-box;display:flex;flex-direction:column;gap:12px;padding:12px;}
    .rp-page{flex:none;width:min(100%,680px);max-width:none;margin:0 auto;padding:0;overflow:hidden;border:0;border-radius:6px;
      background:white;cursor:zoom-in;touch-action:manipulation;}
    .rp-page[aria-pressed="true"]{width:min(1100px,max(660px,145vw));margin-inline:0;cursor:zoom-out;}
    .rp-page img{display:block;width:100%;height:auto;}
    .rp-dialog :focus-visible,.rp-trigger:focus-visible{outline:2px solid var(--ink,#2355a0);outline-offset:2px;}
    html:has(.rp-dialog[open]){overflow:hidden;}
    @media(max-width:640px), (max-height:540px) and (pointer:coarse){
      .rp-dialog,.rp-dialog.rp-wide{inset:0;margin:0;width:100%;height:100dvh;border:0;border-radius:0;}
      .rp-head{padding-top:max(8px,env(safe-area-inset-top));padding-inline:max(12px,env(safe-area-inset-left)) max(12px,env(safe-area-inset-right));}
      .rp-content{padding-bottom:env(safe-area-inset-bottom);}
    }
  `;
  let styled = false;

  function addStyles() {
    if (styled) return;
    const style = document.createElement('style');
    style.textContent = styles;
    document.head.appendChild(style);
    styled = true;
  }

  function button(onClick) {
    addStyles();
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'rp-trigger';
    trigger.title = TITLE;
    trigger.setAttribute('aria-label', TITLE);
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.innerHTML = BOOK;
    trigger.addEventListener('click', onClick);
    return trigger;
  }

  function open(content, { wide = false, onClose } = {}) {
    addStyles();
    const dialog = document.createElement('dialog');
    dialog.className = wide ? 'rp-dialog rp-wide' : 'rp-dialog';
    dialog.setAttribute('aria-labelledby', 'rpTitle');
    dialog.innerHTML = '<div class="rp-shell"><header class="rp-head"><h2 id="rpTitle" class="rp-title">' + TITLE +
      '</h2><button type="button" class="rp-close" aria-label="Закрыть справочные материалы" autofocus>✕</button></header>' +
      '<div class="rp-content"></div></div>';
    dialog.querySelector('.rp-content').append(content);
    dialog.querySelector('.rp-close').addEventListener('click', () => dialog.close());
    let fromBackdrop = false;
    dialog.addEventListener('pointerdown', e => { fromBackdrop = e.target === dialog; });
    dialog.addEventListener('click', e => {
      if (fromBackdrop && e.target === dialog) dialog.close();
    });
    // Горячие клавиши доски и тренажёра не должны срабатывать из панели.
    dialog.addEventListener('keydown', e => e.stopPropagation());
    dialog.addEventListener('keyup', e => e.stopPropagation());
    dialog.addEventListener('close', () => {
      dialog.remove();
      if (onClose) onClose();
    }, { once: true });
    document.body.appendChild(dialog);
    dialog.showModal();
    return dialog;
  }

  function images(pages) {
    const list = document.createElement('div');
    list.className = 'rp-pages';
    for (const { src, alt } of pages) {
      const page = document.createElement('button');
      page.type = 'button';
      page.className = 'rp-page';
      page.setAttribute('aria-label', 'Масштаб: ' + alt);
      page.setAttribute('aria-pressed', 'false');
      const img = document.createElement('img');
      img.src = src;
      img.alt = alt;
      img.decoding = 'async';
      page.addEventListener('click', () => {
        page.setAttribute('aria-pressed', String(page.getAttribute('aria-pressed') === 'false'));
      });
      page.append(img);
      list.append(page);
    }
    return list;
  }

  function openMathReference() {
    const content = document.createElement('div');
    const caption = document.createElement('p');
    caption.className = 'rp-intro';
    caption.textContent = 'ОГЭ по математике, 2027. Нажмите на страницу, чтобы изменить масштаб.';
    content.append(caption, images([3, 4, 5, 6].map(n => ({
      src: 'reference-img/oge-math-2027-' + n + '.webp',
      alt: 'Справочные материалы по математике, страница ' + n,
    }))));
    open(content);
  }

  function mountTrainer() {
    const params = new URLSearchParams(location.search);
    if (params.get('card') === '1' || params.get('bdgen') === '1') return;
    if (window.top !== window.self && window.name !== 'tsStageFrame') return;
    const theme = document.getElementById('themeToggle');
    const board = document.getElementById('boardVisibilityToggle');
    if (!theme || !board || document.getElementById('ogeReferenceToggle')) return;
    const trigger = button(openMathReference);
    trigger.id = 'ogeReferenceToggle';
    trigger.classList.add('theme-toggle');
    board.after(trigger);
  }

  window.ReferencePanel = { button, open, images, mountTrainer };
  if (document.currentScript.hasAttribute('data-oge-reference')) mountTrainer();
})();
