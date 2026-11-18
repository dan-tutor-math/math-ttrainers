/* Библиотека педагога: каталог ФИПИ и личные материалы в браузере. */
(function () {
  'use strict';

  const Panel = window.ReferencePanel;
  const board = document.getElementById('screenBoard');
  const topbar = board && board.querySelector('.bd-topbar');
  if (!Panel || !topbar || !document.getElementById('lgMenuToggle') || window.__boardViewer) return;

  const FILE_LIMIT = 10 * 1024 * 1024;
  const style = document.createElement('style');
  style.textContent = `
    .bd-topbar:has(.rl-trigger){padding-right:108px;}
    .bd-topbar .rl-trigger{position:absolute;top:50%;right:64px;translate:0 -50%;width:38px;height:38px;display:grid;place-items:center;}
    html:is([data-access="own"],[data-access="view"],.ts-follower) .bd-topbar .rl-trigger{display:none;}
    html:is([data-access="own"],[data-access="view"],.ts-follower) .bd-topbar:has(.rl-trigger){padding-right:64px;}
    .rl-body{height:100%;display:grid;grid-template-columns:minmax(250px,30%) minmax(0,1fr);}
    .rl-sidebar,.rl-preview{min-height:0;min-width:0;overflow:auto;overscroll-behavior:contain;}
    .rl-sidebar{padding:14px;border-right:1px solid var(--glass-border);background:var(--glass-strong);}
    .rl-body h3,.rl-body h4{margin:0 0 8px;color:inherit;text-align:left;letter-spacing:normal;}
    .rl-body h3{font:700 16px/1.25 var(--font-ui,system-ui);overflow-wrap:anywhere;}
    .rl-body h4{margin-top:12px;font:700 14px/1.3 var(--font-ui,system-ui);}
    .rl-actions{display:flex;align-items:flex-start;flex-wrap:wrap;gap:6px;margin-bottom:10px;}
    .rl-action,.rl-item{border:1px solid var(--glass-border);border-radius:10px;background:var(--glass);color:inherit;
      font:inherit;cursor:pointer;touch-action:manipulation;min-height:40px;padding:8px 10px;text-align:left;}
    .rl-action:active,.rl-item:active,.rl-item[aria-current="true"]{background:var(--hover-1);}
    .rl-action[disabled]{opacity:.55;cursor:default;}
    .rl-input{box-sizing:border-box;width:100%;padding:8px 10px;border:1px solid var(--glass-border);border-radius:10px;
      background:var(--bg);color:inherit;font:inherit;font-size:16px;}
    .rl-list{display:grid;gap:5px;}
    .rl-empty,.rl-source,.rl-local{color:var(--muted-3);font-size:14px;margin:0 0 10px;}
    .rl-status{color:var(--muted-3);margin:8px 0 0;}
    .rl-status:empty{display:none;}
    .rl-item{width:100%;display:flex;align-items:center;gap:8px;overflow-wrap:anywhere;}
    .rl-item input{width:18px;height:18px;flex:none;accent-color:var(--ink);}
    .rl-item-text{display:grid;gap:2px;font-weight:600;}
    .rl-item small{color:var(--muted-3);font-size:12px;font-weight:500;}
    .rl-preview{padding:14px;}
    .rl-preview .rp-pages{padding-inline:0;}
    .rl-pdf{display:block;width:100%;height:max(300px,calc(100% - 95px));margin-top:10px;border:1px solid var(--glass-border);
      border-radius:8px;box-sizing:border-box;background:white;}
    .rl-link{color:var(--ink);}
    .rl-upload{display:grid;gap:10px;max-width:400px;}
    .rl-upload label{display:grid;gap:4px;}
    .rl-upload .rl-action{justify-self:start;}
    @media(max-width:640px){
      .rl-body{grid-template-columns:minmax(0,1fr);grid-template-rows:minmax(125px,42%) minmax(0,1fr);}
      .rl-sidebar{border-right:none;border-bottom:1px solid var(--glass-border);}
      .rl-item,.rl-action{min-height:44px;}
    }
  `;
  document.head.append(style);

  function canOpen() {
    return !!window.BoardMemory?.pickerContext() && !document.documentElement.classList.contains('ts-follower');
  }

  let officialMaterials;
  async function readCatalog() {
    if (officialMaterials) return officialMaterials;
    const response = await fetch('reference-catalog.json');
    if (!response.ok) throw new Error('Не удалось загрузить каталог.');
    const subjects = await response.json();
    officialMaterials = subjects.flatMap(({ subject, exams }) => exams.flatMap(({ exam, year, materials }) =>
      materials.map(item => ({ ...item, subject, exam, year }))));
    return officialMaterials;
  }

  function studentKey(id) {
    return 'refLib:student:' + id;
  }

  function selectedIds(id) {
    const saved = JSON.parse(localStorage.getItem(studentKey(id)) || '[]');
    return new Set(Array.isArray(saved) ? saved : []);
  }

  function updateSelection(student, id, checked) {
    const ids = selectedIds(student.id);
    if (checked) ids.add(id);
    else ids.delete(id);
    localStorage.setItem(studentKey(student.id), JSON.stringify([...ids]));
  }

  function database(mode, action) {
    return new Promise((resolve, reject) => {
      const locked = () => window.boardsStorageLocked?.();
      if (mode === 'readwrite' && locked()) {
        reject(new Error('Перезагрузите страницу, чтобы изменить свои материалы.'));
        return;
      }
      const request = indexedDB.open('refLib', 1);
      request.onupgradeneeded = () => {
        if (locked()) request.transaction.abort();
        else request.result.createObjectStore('files', { keyPath: 'id' });
      };
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        try {
          if (mode === 'readwrite' && locked()) throw new Error('Перезагрузите страницу, чтобы сохранить изменения.');
          const tx = db.transaction('files', mode);
          const result = action(tx.objectStore('files'));
          tx.oncomplete = () => { db.close(); resolve(result.result); };
          tx.onabort = () => { db.close(); reject(tx.error); };
        } catch (error) {
          db.close();
          reject(error);
        }
      };
    });
  }

  async function checkedFile(file) {
    if (!file || !file.size) throw new Error('Выберите файл.');
    if (file.size > FILE_LIMIT) throw new Error('Размер файла должен быть до 10 МБ.');
    const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    const matches = (offset, bytes) => bytes.every((byte, i) => header[offset + i] === byte);
    const ascii = (offset, text) => matches(offset, Array.from(text, c => c.charCodeAt(0)));
    let mime;
    if (ascii(0, '%PDF-')) mime = 'application/pdf';
    else if (matches(0, [137, 80, 78, 71, 13, 10, 26, 10])) mime = 'image/png';
    else if (matches(0, [255, 216, 255])) mime = 'image/jpeg';
    else if (ascii(0, 'RIFF') && ascii(8, 'WEBP')) mime = 'image/webp';
    else if (ascii(0, 'GIF87a') || ascii(0, 'GIF89a')) mime = 'image/gif';
    else throw new Error('Выберите PDF или изображение PNG, JPEG, WebP или GIF.');
    return file.slice(0, file.size, mime);
  }

  function element(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }

  function action(text, onClick) {
    const btn = element('button', 'rl-action', text);
    btn.type = 'button';
    btn.addEventListener('click', onClick);
    return btn;
  }

  function pdfPreview(url, title, own) {
    const fragment = document.createDocumentFragment();
    const link = element('a', 'rl-link', own ? 'Открыть PDF в новой вкладке' : 'Открыть демоверсию (PDF)');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener';
    const frame = element('iframe', 'rl-pdf');
    frame.src = url;
    frame.title = title;
    fragment.append(link, frame);
    return fragment;
  }

  function openLibrary() {
    if (!canOpen()) return;
    const student = window.StudentMemory?.current();
    const body = element('div', 'rl-body');
    body.innerHTML = `
      <section class="rl-sidebar" aria-labelledby="rlHeading">
        <h3 id="rlHeading"></h3>
        <div class="rl-actions"></div>
        <input class="rl-input" type="search" aria-label="Поиск по названию" placeholder="Поиск по названию">
        <p class="rl-status" role="status"></p>
        <div class="rl-list">Загружаю материалы…</div>
      </section>
      <section class="rl-preview" aria-label="Просмотр материала"></section>`;
    const find = selector => body.querySelector(selector);
    const preview = find('.rl-preview');
    const list = find('.rl-list');
    const search = find('input');
    const message = find('.rl-status');
    let catalog = [], own = [], editing = false, selected = null, objectUrl = null;

    function clearPreview() {
      preview.replaceChildren();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      objectUrl = null;
    }

    const dialog = Panel.open(body, {
      wide: true,
      onClose() {
        observer.disconnect();
        clearPreview();
        if (currentDialog === dialog) currentDialog = null;
      },
    });
    currentDialog = dialog;
    const observer = new MutationObserver(() => {
      if (dialog.open && !canOpen()) dialog.close();
    });
    observer.observe(board, { attributes: true, attributeFilter: ['style'] });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-access'] });

    function subtitle(item) {
      return item.file ? new Intl.DateTimeFormat('ru-RU').format(item.date) : item.exam + ' ' + item.year;
    }

    function renderList() {
      const name = student ? 'Для ученика: ' + student.name : 'Каталог материалов';
      find('#rlHeading').textContent = editing ? 'Выберите материалы' : name;
      edit.textContent = editing ? 'Готово' : 'Добавить ещё материалы';
      let ids = new Set();
      if (student) {
        try { ids = selectedIds(student.id); }
        catch (error) { message.textContent = 'Не удалось прочитать подборку ученика.'; }
      }
      const keyword = search.value.trim().toLocaleLowerCase('ru');
      const materials = [...catalog, ...own]
        .filter(item => !student || editing || ids.has(item.id))
        .filter(item => [item.title, item.subject, subtitle(item)].join(' ').toLocaleLowerCase('ru').includes(keyword));
      list.replaceChildren();
      const sections = new Map();
      for (const item of materials) {
        const group = item.file ? 'Мои материалы' : item.subject;
        if (!sections.has(group)) sections.set(group, []);
        sections.get(group).push(item);
      }
      for (const [group, items] of sections) {
        list.append(element('h4', '', group));
        for (const item of items) {
          const text = element('span', 'rl-item-text', item.title);
          text.append(element('small', '', item.file ? item.subject + ' · ' + subtitle(item) : subtitle(item)));
          if (editing) {
            const control = element('input');
            control.type = 'checkbox';
            control.checked = ids.has(item.id);
            control.addEventListener('change', () => {
              try { updateSelection(student, item.id, control.checked); }
              catch (error) {
                control.checked = !control.checked;
                message.textContent = 'Не удалось сохранить подборку ученика.';
              }
            });
            const row = element('label', 'rl-item');
            row.append(control, text);
            list.append(row);
          } else {
            const row = action('', () => showMaterial(item));
            row.className = 'rl-item';
            row.dataset.material = item.id;
            if (selected?.id === item.id) row.setAttribute('aria-current', 'true');
            row.append(text);
            list.append(row);
          }
        }
      }
      if (!materials.length) {
        const text = !keyword && student && !editing
          ? 'Подборка пуста. Нажмите «Добавить ещё материалы».'
          : 'Материалы не найдены.';
        list.append(element('p', 'rl-empty', text));
      }
    }

    function showMaterial(item) {
      clearPreview();
      selected = item;
      preview.append(element('h3', '', item.title), element('p', 'rl-source',
        item.source || item.subject + ' · ' + subtitle(item) + ' · Хранится на этом устройстве'));
      if (item.file) {
        const remove = action('Удалить файл', async () => {
          if (!confirm('Удалить файл «' + item.title + '» с этого устройства?')) return;
          remove.disabled = true;
          try {
            await database('readwrite', store => store.delete(item.id));
            own = own.filter(file => file.id !== item.id);
            if (dialog.open) showEmpty();
          } catch (error) {
            message.textContent = 'Не удалось удалить файл.';
            remove.disabled = false;
          }
        });
        preview.append(remove);
        objectUrl = URL.createObjectURL(item.file);
        if (item.file.type === 'application/pdf') preview.append(pdfPreview(objectUrl, item.title, true));
        else preview.append(Panel.images([{ src: objectUrl, alt: item.title }]));
      } else if (item.pages) {
        preview.append(Panel.images(item.pages));
      } else {
        preview.append(pdfPreview(item.pdf, item.title, false));
      }
      preview.scrollTop = 0;
      for (const row of list.querySelectorAll('[data-material]')) {
        if (row.dataset.material === item.id) row.setAttribute('aria-current', 'true');
        else row.removeAttribute('aria-current');
      }
    }

    function showEmpty() {
      clearPreview();
      selected = null;
      preview.append(element('p', 'rl-empty', 'Выберите материал из списка.'));
      renderList();
    }

    function showUpload() {
      clearPreview();
      selected = null;
      const form = element('form', 'rl-upload');
      form.innerHTML = `
        <h3>Загрузить свой файл</h3>
        <p class="rl-local">PDF или изображение до 10 МБ. Хранится на этом устройстве.</p>
        <label>Файл<input class="rl-input" name="file" type="file" required accept=".pdf,.png,.jpg,.jpeg,.webp,.gif"></label>
        <label>Название<input class="rl-input" name="title" required maxlength="120"></label>
        <label>Предмет<input class="rl-input" name="subject" required maxlength="80"></label>
        <button class="rl-action" type="submit">Сохранить файл</button>`;
      const file = form.elements.namedItem('file');
      const title = form.elements.namedItem('title');
      const subject = form.elements.namedItem('subject');
      const submit = form.querySelector('button');
      message.textContent = '';
      file.addEventListener('change', () => {
        if (!title.value && file.files[0]) title.value = file.files[0].name.replace(/\.[^.]+$/, '').slice(0, 120);
      });
      form.addEventListener('submit', async event => {
        event.preventDefault();
        submit.disabled = true;
        try {
          const record = {
            id: 'own-' + crypto.randomUUID(),
            date: Date.now(),
            title: title.value.trim(),
            subject: subject.value.trim(),
            file: await checkedFile(file.files[0]),
          };
          if (!record.title || !record.subject) throw new Error('Укажите название и предмет.');
          await database('readwrite', store => store.add(record));
          own.unshift(record);
          if (!dialog.open) return;
          if (student) editing = true;
          search.value = '';
          message.textContent = 'Файл сохранён на этом устройстве.';
          renderList();
          showMaterial(record);
        } catch (error) {
          if (dialog.open) message.textContent = error instanceof Error ? error.message : 'Не удалось сохранить файл.';
        } finally {
          submit.disabled = false;
        }
      });
      preview.append(form);
      renderList();
      file.focus();
    }

    const edit = action('Добавить ещё материалы', () => {
      editing = !editing;
      search.value = '';
      message.textContent = '';
      showEmpty();
    });
    if (student) find('.rl-actions').append(edit);
    find('.rl-actions').append(action('Загрузить свой файл', showUpload));
    find('#rlHeading').textContent = student ? 'Для ученика: ' + student.name : 'Каталог материалов';
    search.addEventListener('input', renderList);
    preview.append(element('p', 'rl-empty', 'Выберите материал из списка.'));

    Promise.allSettled([readCatalog(), database('readonly', store => store.getAll())]).then(([official, stored]) => {
      if (!dialog.open) return;
      if (official.status === 'fulfilled') catalog = official.value;
      if (stored.status === 'fulfilled') own = stored.value.sort((a, b) => b.date - a.date);
      if (official.status === 'rejected' || stored.status === 'rejected') {
        message.textContent = 'Часть материалов не загрузилась. Откройте панель ещё раз.';
      }
      renderList();
    });
  }

  let currentDialog = null;
  const trigger = Panel.button(() => {
    if (!currentDialog?.open) openLibrary();
  });
  trigger.id = 'boardReferenceToggle';
  trigger.classList.add('bd-gear', 'rl-trigger');
  topbar.append(trigger);
})();
