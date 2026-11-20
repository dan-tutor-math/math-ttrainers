(function(){
  'use strict';

  // Таблица перевода из предоставленного образца предназначена для пробников.
  const PROFILE_SCALE = [0, 6, 11, 17, 22, 27, 34, 40, 46, 52, 58, 64, 70, 72, 74, 76, 78,
    80, 82, 84, 86, 88, 90, 92, 94, 95, 96, 97, 98, 99, 100, 100, 100];
  const ERRORS = [
    ['А', 'Арифметика'], ['М', 'Неверный метод'], ['Ф', 'Ошибка в формуле'],
    ['У', 'Неверно прочитано условие'], ['ОДЗ', 'Не учтена ОДЗ'],
    ['В', 'Не хватило времени'], ['Н', 'Невнимательность'],
  ];
  const errorNames = new Map(ERRORS);
  const DASH = '—';
  const DATE = /^\d{4}-\d{2}-\d{2}$/;
  const ID = /^[0-9a-f-]{36}$/i;
  const numberFormats = [0, 1, 2].map(maximumFractionDigits =>
    new Intl.NumberFormat('ru-RU', { maximumFractionDigits }));
  const format = (number, digits = 2) => number == null ? DASH : numberFormats[digits].format(number);
  const sum = values => values.reduce((total, value) => total + value, 0);
  const mean = values => values.length ? sum(values) / values.length : null;
  const known = value => value != null;
  const percent = value => value == null ? DASH : format(value) + '%';
  const escape = value => String(value).replace(/[&<>"']/g, char => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;',
  }[char]));

  function deviation(values){
    if (values.length < 2) return null;
    const average = mean(values);
    return Math.sqrt(sum(values.map(value => (value - average) ** 2)) / (values.length - 1));
  }

  function localDay(){
    const now = new Date();
    const pad = number => String(number).padStart(2, '0');
    return [now.getFullYear(), pad(now.getMonth() + 1), pad(now.getDate())].join('-');
  }

  function read(storage, prefix){
    const records = new Map(), scores = new Map(), errors = new Map();
    for (const key of Object.keys(storage)) {
      if (!key.startsWith(prefix)) continue;
      const [kind, id, slot] = key.slice(prefix.length).split(':');
      if (!ID.test(id || '')) continue;
      const value = storage.getItem(key);
      if (kind === 'attempt') {
        try {
          const item = JSON.parse(value);
          if (item && DATE.test(item.date) && typeof item.name === 'string') {
            const { date, name, testScore, createdAt } = item;
            records.set(id, {
              date, name,
              createdAt:Number.isSafeInteger(createdAt) ? createdAt : 0,
              testScore:Number.isInteger(testScore) && testScore >= 0 && testScore <= 100 ? testScore : null,
            });
          }
        } catch { /* Другие пробники остаются доступны при повреждении одной записи. */ }
      } else if (kind === 'score' && /^\d+$/.test(value || '') && Number.isSafeInteger(+value)) {
        scores.set(id + ':' + slot, Number(value));
      } else if (kind === 'error' && errorNames.has(value)) {
        errors.set(id + ':' + slot, value);
      }
    }
    return Array.from(records, ([id, meta]) => ({ id, ...meta, scores, errors }))
      .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt || a.id.localeCompare(b.id));
  }

  function mount(box, student, owner){
    const exam = window.LessonReportTopics.exams.find(item => item.id === student.exam);
    box.replaceChildren();
    if (!exam) return;

    const slots = window.ExamSpec.scoreSlots(exam.id, exam.count);
    const maxima = slots.map(slot => slot.max);
    const maximum = maxima.every(known) ? sum(maxima) : null;
    const scale = exam.id === 'ege_prof' && maximum === PROFILE_SCALE.length - 1 ? PROFILE_SCALE : null;
    const manual = ['rus_ege', 'soc_ege', 'inf_ege', 'phys_ege'].includes(exam.id);
    const showTestScore = Boolean(scale || manual);
    const prefix = 'cabinet:exam-mocks:v1:' + [owner, student.id, exam.id].map(encodeURIComponent).join(':') + ':';
    box.innerHTML = `
      <section class="memory exam-grid exam-mocks" aria-labelledby="examMockTitle">
        <div class="exam-grid__head">
          <h3 id="examMockTitle">Анализ пробников</h3>
          <button class="btn small" type="button" data-add>Добавить пробник</button>
        </div>
        <p class="hint exam-mocks__empty">Добавьте пробник, чтобы записать баллы по заданиям.</p>
        <div class="exam-mocks__body" hidden>
          <div class="exam-mocks__toolbar">
            <div class="row-btns" role="group" aria-label="Вид результатов">
              <button class="btn quiet small" type="button" data-mode="score" aria-pressed="true">Баллы</button>
              <button class="btn quiet small" type="button" data-mode="error" aria-pressed="false">Журнал ошибок</button>
            </div>
            <button class="btn quiet small" type="button" data-jump aria-controls="examMockView">К итогам</button>
          </div>
          <p class="hint exam-grid__instruction" data-score-help>Пустая ячейка — балл ещё не внесён. Ноль — задание оценено в 0 баллов.</p>
          <p class="hint exam-grid__instruction" data-error-help hidden>Пустая ячейка — причина ошибки не указана.</p>
          <div id="examMockView" class="exam-grid__view">
            <table class="exam-grid__table" aria-label="Баллы по пробникам"></table>
          </div>
          <details class="exam-mocks__help">
            <summary>Как считаются итоги</summary>
            <p class="hint">Процент считается от максимума экзамена. Среднее за 3 берёт до трёх последних пробников с баллами. Стабильность (σ) — выборочное стандартное отклонение. Для неё нужны хотя бы два балла.</p>
          </details>
          <details class="exam-mocks__help" data-error-key hidden>
            <summary>Коды ошибок</summary>
            <ul>${ERRORS.map(([code, name]) => `<li><b>${code}</b> ${name}</li>`).join('')}</ul>
          </details>
          ${scale ? `<details class="exam-mocks__help" data-scale>
            <summary>Перевод баллов по шкале из образца</summary>
            <div class="exam-mocks__scale">
              <table aria-label="Шкала перевода для пробников">
                <thead><tr><th scope="col">Первичный</th><th scope="col">Тестовый</th></tr></thead>
                <tbody>${scale.map((value, score) => `<tr><th scope="row">${score}</th><td>${value}</td></tr>`).join('')}</tbody>
              </table>
            </div>
          </details>` : ''}
        </div>
        <p class="hint exam-grid__notice" role="status"></p>
        <dialog class="panel cab-password-dialog exam-grid__dialog" aria-labelledby="examMockEditTitle">
          <form>
            <h4 id="examMockEditTitle"></h4>
            <div data-meta>
              <label class="label" for="examMockDate">Дата пробника</label>
              <input class="field" id="examMockDate" type="date">
              <label class="label exam-grid__note-label" for="examMockName">Название варианта <span>(необязательно)</span></label>
              <input class="field" id="examMockName" maxlength="100">
              ${manual ? '<label class="label exam-grid__note-label" for="examMockTest">Тестовый балл <span>(необязательно)</span></label><input class="field" id="examMockTest" type="number" min="0" max="100" step="1">' : ''}
            </div>
            <div data-cell>
              <label class="label" for="examMockValue"></label>
              <select class="field" id="examMockValue"></select>
              <input class="field" id="examMockNumber" type="number" min="0" step="1" hidden>
            </div>
            <div class="row-btns">
              <button class="btn small" type="submit">Сохранить</button>
              <button class="btn quiet small" type="button" data-cancel>Отмена</button>
            </div>
            <p class="form-msg" role="status"></p>
          </form>
        </dialog>
      </section>`;
    const find = selector => box.querySelector(selector);
    const view = find('.exam-grid__view');
    const table = find('table');
    const body = find('.exam-mocks__body');
    const add = find('[data-add]');
    const jump = find('[data-jump]');
    const dialog = find('dialog');
    const form = find('form');
    const dateInput = find('#examMockDate');
    const nameInput = find('#examMockName');
    const testInput = find('#examMockTest');
    const select = find('#examMockValue');
    const customScore = find('#examMockNumber');
    const status = find('.exam-grid__notice');
    const feedback = find('.form-msg');
    const modeButtons = Array.from(box.querySelectorAll('[data-mode]'));
    let mode = 'score';
    let editing = null;
    let storage = null;
    let rows = [];
    let tabStop = null;
    try { storage = window.localStorage; } catch { /* Передадим ошибку в строку статуса. */ }

    function load(){
      try { rows = read(storage, prefix); }
      catch { status.textContent = 'Браузер ограничил доступ к результатам.'; }
    }

    function render(){
      const previous = tabStop ? { ...tabStop.dataset } : null;
      const focused = tabStop === document.activeElement;
      const isScore = mode === 'score';
      body.hidden = !rows.length;
      find('.exam-mocks__empty').hidden = Boolean(rows.length);
      find('[data-score-help]').hidden = !isScore;
      find('[data-error-help]').hidden = isScore;
      find('[data-error-key]').hidden = isScore;
      if (scale) find('[data-scale]').hidden = !isScore;
      modeButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mode === mode)));
      table.setAttribute('aria-label', isScore ? 'Баллы по пробникам' : 'Ошибки по пробникам');

      const scoresBySlot = slots.map(() => []);
      const errorsBySlot = slots.map(() => new Map());
      const totals = [], testScores = [], percentages = [];
      const extraHeaders = isScore ? ['Сумма', ...(showTestScore ? ['Тестовый балл'] : []), ...(maximum ? ['Процент', 'Среднее % за 3'] : [])] : [];
      const headers = `<thead><tr>
        <th class="exam-grid__pin-num" scope="col">№</th>
        <th class="exam-grid__pin-topic" scope="col">Дата</th>
        ${slots.map(slot => `<th scope="col">${slot.label}</th>`).join('')}
        ${extraHeaders.map(title => `<th class="exam-grid__total" scope="col">${title}</th>`).join('')}
        </tr>${isScore ? `<tr><th class="exam-mocks__wide-pin" colspan="2" scope="row">Макс. балл</th>
          ${maxima.map(max => `<td>${format(max)}</td>`).join('')}
          <td data-maximum>${format(maximum)}</td>${extraHeaders.slice(1).map(() => '<td></td>').join('')}</tr>` : ''}</thead>`;

      const attempts = rows.map(({ id, date, name, testScore, scores, errors }, index) => {
        const scoresForRow = [];
        const cells = slots.map((slot, col) => {
          const key = id + ':' + slot.key;
          const score = scores.get(key);
          const error = errors.get(key);
          if (known(score)) {
            scoresBySlot[col].push(score);
            scoresForRow.push(score);
          }
          if (error) errorsBySlot[col].set(error, (errorsBySlot[col].get(error) || 0) + 1);
          const level = !isScore || !known(score) ? '' : score === 0 ? '0' : score === slot.max ? '3' : '2';
          const value = isScore ? score : error;
          const label = isScore ? (score ?? 'балл не внесён') : (errorNames.get(error) || 'код не указан');
          return `<td><button type="button" data-id="${id}" data-slot="${slot.key}" data-level="${level}" tabindex="-1"
            aria-label="Пробник ${index + 1}, ${slot.key === 'literacy' ? 'грамотность' : 'задание №' + slot.label}, ${label}">${value ?? ''}</button></td>`;
        }).join('');
        const total = scoresForRow.length ? sum(scoresForRow) : null;
        const test = scale ? scale[total] : testScore;
        const ratio = known(total) && maximum ? total * 100 / maximum : null;
        if (known(total)) totals.push(total);
        if (known(test)) testScores.push(test);
        if (known(ratio)) percentages.push(ratio);
        const recent = known(ratio) ? mean(percentages.slice(-3)) : null;
        const summary = isScore ? `<td data-sum>${format(total)}</td>${showTestScore ? `<td data-test-score>${format(test)}</td>` : ''}
          ${maximum ? `<td data-percent>${percent(ratio)}</td><td data-rolling>${percent(recent)}</td>` : ''}` : '';
        return `<tr>
          <th class="exam-grid__pin-num" scope="row">${index + 1}</th>
          <td class="exam-grid__pin-topic"><button type="button" data-id="${id}" data-slot="meta" tabindex="-1"
            aria-label="Изменить пробник ${index + 1}"><time datetime="${date}">${date.split('-').reverse().join('.')}</time>${name ? '<span>' + escape(name) + '</span>' : ''}</button></td>
          ${cells}${summary}</tr>`;
      }).join('');

      function footerRow(label, values, className = ''){
        return `<tr class="${className}"><th class="exam-mocks__wide-pin" colspan="2" scope="row">${label}</th>
          ${values.map(value => `<td>${value}</td>`).join('')}</tr>`;
      }
      const metrics = scoresBySlot.map(values => format(mean(values)));
      const stability = scoresBySlot.map(values => format(deviation(values)));
      const scoreFooter = footerRow('Средний балл', [
        ...metrics, format(mean(totals), 1), ...(showTestScore ? [format(mean(testScores), 0)] : []),
        ...(maximum ? [percent(mean(percentages)), DASH] : []),
      ]) + footerRow('Стабильность (σ)', [
        ...stability, format(deviation(totals), 1), ...extraHeaders.slice(1).map(() => DASH),
      ]);
      const errorFooter = ERRORS.map(([code, name]) => footerRow(code + ' · ' + name, errorsBySlot.map(counts => counts.get(code) || 0))).join('') +
        footerRow('Всего ошибок', errorsBySlot.map(counts => sum(Array.from(counts.values()))), 'exam-mocks__total-errors');
      table.innerHTML = headers + '<tbody>' + attempts + '</tbody><tfoot>' + (isScore ? scoreFooter : errorFooter) + '</tfoot>';
      const buttons = Array.from(table.querySelectorAll('button'));
      const match = previous && buttons.find(button => button.dataset.id === previous.id && button.dataset.slot === previous.slot);
      tabStop = null;
      if (match || buttons.length) setTabStop(match || buttons[0]);
      if (focused) tabStop?.focus({ preventScroll:true });
      jump.hidden = !isScore;
      updateJump();
    }

    function setTabStop(button){
      if (tabStop) tabStop.tabIndex = -1;
      tabStop = button;
      tabStop.tabIndex = 0;
    }

    function summaryOffset(){
      const start = table.querySelector('thead .exam-grid__total');
      const pin = table.querySelector('thead .exam-grid__pin-topic');
      if (!start || !pin) return 0;
      const position = view.scrollLeft + start.getBoundingClientRect().left - pin.getBoundingClientRect().right;
      return Math.min(view.scrollWidth - view.clientWidth, Math.max(0, position));
    }

    function updateJump(){
      jump.textContent = view.scrollLeft >= summaryOffset() - 2 && view.scrollLeft > 0 ? 'К заданиям' : 'К итогам';
    }

    jump.addEventListener('click', () => {
      const offset = summaryOffset();
      view.scrollLeft = view.scrollLeft >= offset - 2 ? 0 : offset;
    });
    view.addEventListener('scroll', updateJump);
    modeButtons.forEach(button => button.addEventListener('click', () => {
      mode = button.dataset.mode;
      render();
      view.scrollLeft = 0;
    }));

    function open(id, key){
      const attempt = rows.find(row => row.id === id);
      const index = rows.indexOf(attempt) + 1;
      const slot = slots.find(item => item.key === key);
      const meta = key === 'meta';
      editing = { id, key, slot, mode, createdAt:attempt?.createdAt ?? Date.now() };
      feedback.textContent = '';
      find('[data-meta]').hidden = !meta;
      find('[data-cell]').hidden = meta;
      for (const field of [dateInput, nameInput, testInput].filter(Boolean)) field.disabled = !meta;
      dateInput.required = meta;
      dateInput.value = attempt?.date || localDay();
      nameInput.value = attempt?.name || '';
      if (testInput) testInput.value = attempt?.testScore ?? '';
      find('h4').textContent = meta ? (attempt ? 'Пробник №' + index : 'Новый пробник') :
        'Пробник №' + index + ' · ' + (key === 'literacy' ? 'Грамотность' : 'Задание №' + slot.label);
      if (!meta) {
        const isScore = mode === 'score';
        const useNumeric = isScore && slot.max == null;
        select.disabled = useNumeric;
        customScore.hidden = !useNumeric;
        select.hidden = useNumeric;
        customScore.disabled = !useNumeric;
        find('[data-cell] label').textContent = isScore ? 'Балл задания' : 'Причина ошибки';
        find('[data-cell] label').htmlFor = (useNumeric ? customScore : select).id;
        const options = isScore ? Array.from({ length:(slot.max ?? -1) + 1 }, (_, score) => new Option(String(score), String(score)))
          : ERRORS.map(([code, name]) => new Option(code + ' · ' + name, code));
        select.replaceChildren(new Option(isScore ? 'Балл не внесён' : 'Код не указан', ''), ...options);
        const coordinate = id + ':' + key;
        const value = isScore ? attempt.scores.get(coordinate) : attempt.errors.get(coordinate);
        if (useNumeric) customScore.value = value ?? '';
        else select.value = value ?? '';
      } else {
        customScore.disabled = select.disabled = true;
      }
      dialog.showModal();
    }

    add.addEventListener('click', () => open(null, 'meta'));
    table.addEventListener('focusin', event => {
      if (event.target instanceof HTMLButtonElement) setTabStop(event.target);
    });
    table.addEventListener('click', event => {
      const button = event.target.closest('[data-id]');
      if (!button) return;
      setTabStop(button);
      open(button.dataset.id, button.dataset.slot);
    });
    table.addEventListener('keydown', event => {
      const button = event.target.closest('[data-id]');
      if (!button || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
      event.preventDefault();
      const cell = button.closest('td');
      const row = cell.parentElement;
      const nextRow = row.sectionRowIndex + Number(event.key === 'ArrowDown') - Number(event.key === 'ArrowUp');
      const nextCol = cell.cellIndex + Number(event.key === 'ArrowRight') - Number(event.key === 'ArrowLeft');
      table.tBodies[0].rows[nextRow]?.cells[nextCol]?.querySelector('button')?.focus();
    });
    find('[data-cancel]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => {
      const { id, key } = editing || {};
      if (id) Array.from(table.querySelectorAll('[data-id]')).find(button =>
        button.dataset.id === id && button.dataset.slot === key)?.focus({ preventScroll:true });
      else add.focus({ preventScroll:true });
      editing = null;
    });

    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!editing) return;
      const { id, key, slot, mode, createdAt } = editing;
      let suffix, value;
      if (key === 'meta') {
        if (!DATE.test(dateInput.value)) {
          feedback.textContent = 'Укажите дату пробника.';
          return;
        }
        const rowId = id || crypto.randomUUID();
        suffix = 'attempt:' + rowId;
        value = JSON.stringify({
          date:dateInput.value, name:nameInput.value.trim(), createdAt,
          testScore:testInput?.value ? Number(testInput.value) : null,
        });
      } else {
        suffix = mode + ':' + id + ':' + key;
        value = mode === 'score' && slot.max == null ? customScore.value : select.value;
        if (mode === 'score' && value !== '' &&
            (!/^\d+$/.test(value) || !Number.isSafeInteger(+value) || (slot.max != null && +value > slot.max))) {
          feedback.textContent = 'Укажите целый балл в допустимом диапазоне.';
          return;
        }
      }
      try {
        if (value !== '') storage.setItem(prefix + suffix, value);
        else storage.removeItem(prefix + suffix);
      } catch {
        feedback.textContent = 'Не удалось сохранить результат в браузере.';
        return;
      }
      load();
      render();
      status.textContent = 'Сохранено';
      dialog.close();
    });

    function onStorage(event){
      if (storage && event.storageArea === storage && (!event.key || event.key.startsWith(prefix))) {
        load();
        render();
      }
    }
    window.addEventListener('storage', onStorage);
    load();
    render();
    return () => window.removeEventListener('storage', onStorage);
  }

  window.CabinetExamMocks = { mount };
})();
