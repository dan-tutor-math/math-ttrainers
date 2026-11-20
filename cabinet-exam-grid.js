(function(){
  'use strict';

  const WEEKS = 32;
  const LEVELS = ['Не разбирали', 'Разобрали (трудно)', 'Закрепляем', 'Решает уверенно'];
  const range = length => Array.from({ length }, (_, idx) => idx + 1);
  const dateFormat = new Intl.DateTimeFormat('ru-RU', { dateStyle:'long', timeZone:'UTC' });
  const numberFormat = new Intl.NumberFormat('ru-RU', { maximumFractionDigits:2 });

  function validDate(value){
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(value);
    return Number.isFinite(+date) && date.toISOString().startsWith(value);
  }

  function topicsFor(exam){
    const { titles, trainers } = window.MathhCatalog;
    const mathOge = number => {
      const id = number <= 5 ? 'oge1_5' : number >= 15 && number <= 18 ? 'oge15_18' : 'oge' + number;
      return trainers[id]?.name.replace(/^№[\d–]+\. /, '');
    };
    const englishOge = (number, oral) => titles.engOge.find(([start], idx, items) => {
      const target = oral ? number + 35 : number;
      return target >= start && target < (items[idx + 1]?.[0] || 39);
    })?.[2];
    const numberedTitles = {
      rus_oge:titles.rusOge, rus_ege:titles.rusEge,
      soc_oge:titles.socOge, soc_ege:titles.socEge,
      phys_oge:titles.physOge, inf_oge:titles.infOge,
    };
    return range(exam.count).map(number => {
      if (exam.id === 'ege_prof') return titles.egeProf[number - 1];
      if (exam.id === 'ege_base') return titles.egeBase[number - 1];
      if (exam.id === 'oge') return mathOge(number);
      if (exam.id === 'eng_oge' || exam.id === 'eng_oge_oral') return englishOge(number, exam.id.endsWith('_oral'));
      return numberedTitles[exam.id]?.[number];
    });
  }

  function mount(box, student, owner){
    const exam = window.LessonReportTopics.exams.find(item => item.id === student.exam);
    box.innerHTML = `
      <section class="memory exam-grid" aria-labelledby="examGridTitle">
        <h3 id="examGridTitle">Экзаменационная сетка</h3>
        <p class="hint">Выберите экзамен в карточке ученика и сохраните.</p>
      </section>`;
    if (!exam) return;

    const topics = topicsFor(exam);
    const weeks = range(WEEKS);
    const prefix = 'cabinet:exam-grid:v2:' + [owner, student.id, exam.id].map(encodeURIComponent).join(':') + ':';
    const section = box.firstElementChild;
    const topicRows = topics.map((_, i) => {
      const number = i + 1;
      return `<tr>
        <td class="exam-grid__pin-num">${number}</td>
        <th scope="row" class="exam-grid__pin-topic"><button type="button" data-row="${number}" data-col="0"></button></th>
        ${weeks.map(week => `<td><button type="button" data-row="${number}" data-col="${week}"></button></td>`).join('')}
        <td data-average></td>
        <td data-current></td>
      </tr>`;
    });
    section.innerHTML = `
      <div class="exam-grid__head">
        <div>
          <h3 id="examGridTitle">Экзаменационная сетка</h3>
          <p class="hint" data-exam></p>
        </div>
        <button class="btn quiet small" type="button" data-jump aria-controls="examGridView">К итогам</button>
      </div>
      <ul class="exam-grid__legend" aria-label="Шкала освоения">
        ${LEVELS.map((name, level) => `<li><span data-level="${level}">${level}</span> ${name}</li>`).join('')}
      </ul>
      <p class="hint exam-grid__instruction">Нажмите на дату или ячейку, чтобы внести запись.</p>
      <div id="examGridView" class="exam-grid__view">
        <table class="exam-grid__table" aria-label="Прогресс по неделям">
          <thead>
            <tr><th class="exam-grid__pin-num" scope="col">№</th>
              <th class="exam-grid__pin-topic" scope="col">Тема задания</th>
              ${weeks.map(week => `<th scope="col">Нед. ${week}</th>`).join('')}
              <th class="exam-grid__total" scope="col">Среднее</th><th class="exam-grid__total" scope="col">Текущий уровень</th></tr>
            <tr><td class="exam-grid__pin-num"></td><th class="exam-grid__pin-topic" scope="row">Даты</th>
              ${weeks.map(week => `<td><button type="button" data-row="0" data-col="${week}"></button></td>`).join('')}
              <td></td><td></td></tr>
          </thead>
          <tbody>${topicRows.join('')}</tbody>
        </table>
      </div>
      <div class="exam-grid__footer">
        <p data-overall></p>
        <p class="hint">Отметки хранятся в этом браузере.</p>
      </div>
      <p class="hint exam-grid__notice" role="status"></p>
      <dialog class="panel cab-password-dialog exam-grid__dialog" aria-labelledby="examGridEditTitle">
        <form>
          <h4 id="examGridEditTitle"></h4>
          <div data-date-field>
            <label class="label" for="examGridDay">Дата недели</label>
            <input class="field" id="examGridDay" type="date">
          </div>
          <div data-topic-field>
            <label class="label" for="examGridTopic">Тема задания</label>
            <input class="field" id="examGridTopic" maxlength="160">
          </div>
          <div data-mark-fields>
            <p class="hint" data-date-context></p>
            <label class="label" for="examGridLevel">Уровень освоения</label>
            <select class="field" id="examGridLevel">
              <option value="">Без оценки</option>
              ${LEVELS.map((name, level) => `<option value="${level}">${level} · ${name}</option>`).join('')}
            </select>
            <label class="label exam-grid__note-label" for="examGridNote">Что делали <span>(необязательно)</span></label>
            <input class="field" id="examGridNote" maxlength="200">
          </div>
          <div class="row-btns">
            <button class="btn small" type="submit">Сохранить</button>
            <button class="btn quiet small" type="button" data-cancel>Отмена</button>
          </div>
          <p class="form-msg" role="status"></p>
        </form>
      </dialog>`;
    const find = selector => section.querySelector(selector);
    const table = find('table');
    const view = find('.exam-grid__view');
    const jump = find('[data-jump]');
    const dialog = find('dialog');
    const form = find('form');
    const dateInput = find('#examGridDay');
    const topicInput = find('#examGridTopic');
    const levelInput = find('#examGridLevel');
    const noteInput = find('#examGridNote');
    const status = find('.exam-grid__notice');
    const feedback = find('.form-msg');
    const overall = find('[data-overall]');
    const controls = Array.from(table.querySelectorAll('tr')).slice(1).map(row => {
      const rowControls = Array.from(row.querySelectorAll('button'));
      if (row.closest('thead')) rowControls.unshift(null);
      return rowControls;
    });
    let tabStop = null;
    let editing = null;
    let storage = null;
    try { storage = window.localStorage; } catch { /* Передадим ошибку в строку статуса. */ }
    find('[data-exam]').textContent = exam.id === 'oge' ? 'ОГЭ · математика' : exam.name;

    const dateKey = week => 'date:' + week;
    const topicKey = row => 'topic:' + row;
    const markKey = (row, week) => 'mark:' + row + ':' + week;

    function readChanges(){
      const changes = new Map();
      try {
        // Хранение по ячейкам оставляет независимыми записи из соседних вкладок.
        for (const key of Object.keys(storage)) {
          if (key.startsWith(prefix)) changes.set(key.slice(prefix.length), storage.getItem(key));
        }
      } catch {
        status.textContent = 'Браузер ограничил доступ к отметкам.';
      }
      return changes;
    }

    let changes = readChanges();
    function readMark(row, week){
      try {
        const item = JSON.parse(changes.get(markKey(row, week)) || 'null');
        if (item && typeof item.level === 'string' && /^([0-3])?$/.test(item.level) && typeof item.note === 'string') return item;
      } catch { /* Повреждённая запись не должна скрыть остальные ячейки. */ }
      return { level:'', note:'' };
    }

    function dateFor(week){
      const value = changes.get(dateKey(week)) || '';
      return validDate(value) ? value : '';
    }

    const topicFor = row => changes.get(topicKey(row)) || topics[row - 1] || '';
    const fullDate = value => dateFormat.format(new Date(value));
    const average = values => values.reduce((sum, value) => sum + value, 0) / values.length;
    const empty = '—';

    function paint(){
      for (const week of weeks) {
        const button = controls[0][week];
        const value = dateFor(week);
        button.textContent = value ? value.split('-').reverse().join('.') : empty;
        button.setAttribute('aria-label', 'Дата недели ' + week + (value ? ', ' + fullDate(value) : ', не задана'));
      }

      const currentLevels = [];
      for (const [index, tr] of Array.from(table.tBodies[0].rows).entries()) {
        const row = index + 1;
        const [topic, ...cells] = controls[row];
        const name = topicFor(row);
        topic.textContent = name || 'Указать тему';
        topic.setAttribute('aria-label', 'Тема задания №' + row + (name ? ', ' + name : ', не задана'));
        topic.classList.toggle('is-empty', !name);
        const levels = [];
        cells.forEach((button, idx) => {
          const { level, note } = readMark(row, idx + 1);
          if (level !== '') levels.push(Number(level));
          button.dataset.level = level;
          button.classList.toggle('has-note', Boolean(note));
          button.textContent = level || (note ? '…' : '');
          const label = level === '' ? (note ? 'есть примечание' : 'пусто') : level + ', ' + LEVELS[level];
          button.setAttribute('aria-label', 'Задание №' + row + ', неделя ' + (idx + 1) + ', ' + label);
          button.title = note || '';
        });
        const mean = tr.querySelector('[data-average]');
        const current = tr.querySelector('[data-current]');
        mean.textContent = levels.length ? numberFormat.format(Math.round(average(levels) * 10) / 10) : empty;
        const last = levels.at(-1);
        current.textContent = last ?? empty;
        current.dataset.level = last ?? '';
        if (last != null) currentLevels.push(last);
      }
      overall.textContent = 'Средний текущий уровень ' +
        (currentLevels.length ? numberFormat.format(average(currentLevels)) : empty);
    }

    function setTabStop(button){
      if (tabStop) tabStop.tabIndex = -1;
      tabStop = button;
      button.tabIndex = 0;
    }

    function open(button){
      const row = Number(button.dataset.row);
      const week = Number(button.dataset.col);
      const kind = !row ? 'date' : !week ? 'topic' : 'mark';
      editing = { button, row, week, kind };
      find('[data-date-field]').hidden = kind !== 'date';
      find('[data-topic-field]').hidden = kind !== 'topic';
      find('[data-mark-fields]').hidden = kind !== 'mark';
      feedback.textContent = '';
      find('h4').textContent = kind === 'date' ? 'Неделя ' + week
        : kind === 'topic' ? 'Тема задания №' + row
          : '№' + row + ' · ' + (topicFor(row) || 'Задание') + ' · Неделя ' + week;
      dateInput.value = dateFor(week);
      topicInput.value = topicFor(row);
      const value = readMark(row, week);
      levelInput.value = value.level;
      noteInput.value = value.note;
      find('[data-date-context]').textContent = dateInput.value ? fullDate(dateInput.value) : 'Дата недели пока не задана.';
      dialog.showModal();
    }

    table.querySelectorAll('button').forEach(button => { button.tabIndex = -1; });
    setTabStop(controls[0][1]);
    table.addEventListener('focusin', event => {
      const button = event.target.closest('button[data-row]');
      if (button) setTabStop(button);
    });
    table.addEventListener('click', event => {
      const button = event.target.closest('button[data-row]');
      if (button) {
        setTabStop(button);
        open(button);
      }
    });
    table.addEventListener('keydown', event => {
      const button = event.target.closest('button[data-row]');
      if (!button || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
      event.preventDefault();
      const row = Number(button.dataset.row);
      const col = Number(button.dataset.col);
      const nextRow = row + Number(event.key === 'ArrowDown') - Number(event.key === 'ArrowUp');
      const nextCol = col + Number(event.key === 'ArrowRight') - Number(event.key === 'ArrowLeft');
      const next = controls[nextRow]?.[nextCol] || (nextRow === 0 ? controls[0][1] : null);
      if (next) next.focus();
    });
    const atEnd = () => view.scrollWidth - view.clientWidth - view.scrollLeft < 4;
    view.addEventListener('scroll', () => { jump.textContent = atEnd() ? 'К неделям' : 'К итогам'; });
    jump.addEventListener('click', () => {
      view.scrollLeft = atEnd() ? 0 : view.scrollWidth;
    });
    find('[data-cancel]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => {
      editing?.button.focus({ preventScroll:true });
      editing = null;
    });

    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!editing) return;
      const { row, week, kind } = editing;
      let key, value;
      if (kind === 'date') {
        key = dateKey(week);
        value = dateInput.value;
        if (value && !validDate(value)) {
          feedback.textContent = 'Укажите корректную дату.';
          return;
        }
      } else if (kind === 'topic') {
        key = topicKey(row);
        value = topicInput.value.trim();
      } else {
        key = markKey(row, week);
        const level = levelInput.value;
        const note = noteInput.value.trim();
        value = level || note ? JSON.stringify({ level, note }) : '';
      }
      try {
        if (value) storage.setItem(prefix + key, value);
        else storage.removeItem(prefix + key);
      } catch {
        feedback.textContent = 'Не удалось сохранить запись в браузере.';
        return;
      }
      changes = readChanges();
      paint();
      status.textContent = 'Сохранено';
      dialog.close();
    });

    function onStorage(event){
      if (storage && event.storageArea === storage && (!event.key || event.key.startsWith(prefix))) {
        changes = readChanges();
        paint();
      }
    }
    window.addEventListener('storage', onStorage);
    paint();
    return () => window.removeEventListener('storage', onStorage);
  }

  window.CabinetExamGrid = { mount };
})();
