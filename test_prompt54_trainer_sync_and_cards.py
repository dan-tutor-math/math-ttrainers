"""
Промпт №54, тренажёры: «+ примеры» и совместная работа над заданием в ОГЭ №7 и №19.

Что было сломано:
  1. Кнопка «+1» (trainer-multi.js) на тренажёрах с экраном выбора типа
     (oge6, oge9, oge10, …) давала ПУСТУЮ карточку: кадр — свежая загрузка
     страницы, типа он не знал, newTask() падал, ошибку молча глотал try.
     В арифметике карточка бралась с первого уровня, какой бы ни был выбран.
  2. ОГЭ №7 и №19 в совместной сессии синхронизировали только доску:
     учитель и ученик видели каждый своё задание. «+» там не было вовсе.

Проверяем:
  A. «+1» на oge6 / oge7 / oge19 / addition даёт карточку с заданием того же
     типа (уровня), что и на основной странице.
  B. oge7: присоединившийся видит тот же тип и то же задание, не перебивает
     задание учителя своим; новое задание, неверный выбор, «изменить ответ»,
     верный ответ и возврат к выбору типа доезжают до ученика.
  C. oge19: общие утверждения; отметка ученика видна учителю (и её снятие);
     новое задание и проверка ответа доезжают до ученика.
  D. Эхо собеседника не откатывает быстрые действия; ученик с медленной
     базой не перебивает задание учителя (oge6, oge10, addition, quadratic,
     oge7, oge19).
  E. Версия задания: снимок, ушедший со штрихом доски, не откатывает свежий
     ответ; одновременные правки сходятся; вставка шагов в oge7 не меняет
     задание в снимке; карточка «+1» не делит объекты с основной страницей.

Живой realtime из песочницы недоступен. Вместо supabase-js подставляется
заглушка: канал — BroadcastChannel между вкладками одного браузера, таблица
trainer_sessions — запись в localStorage (он у вкладок одного контекста
общий). Живьём совместный режим всё равно нужно перепроверить на сайте.

Запуск: python3 test_prompt54_trainer_sync_and_cards.py (сервер поднимается сам).
"""
import subprocess
import sys
import time
import contextlib
import http.client

from playwright.sync_api import sync_playwright

PORT = 8969
# на каких тренажёрах проверять эхо (раздел D): по одному из каждого
# семейства, где состояние отслеживается таймером, плюс два новых моста
ECHO_SLUGS = ["oge6", "oge10", "addition", "quadratic", "oge7", "oge19"]
# python3 test_prompt54_... D oge6 — прогнать только раздел D по списку
ONLY = sys.argv[2:] if len(sys.argv) > 2 and sys.argv[1] == "D" else None
BASE = f"http://127.0.0.1:{PORT}"

FAKE_LIB = r"""
(function(){
  const LS = 'fakeTrainerSessions';
  const readT = () => { try { return JSON.parse(localStorage.getItem(LS) || '{}'); } catch (e) { return {}; } };
  const writeT = (t) => localStorage.setItem(LS, JSON.stringify(t));
  const clone = (v) => JSON.parse(JSON.stringify(v));
  function builder(table){
    const q = { op: null, filters: {}, row: null };
    const b = {
      select(){ if (!q.op) q.op = 'select'; return b; },
      insert(row){ q.op = 'insert'; q.row = row; return b; },
      upsert(row){ q.op = 'upsert'; q.row = row; return b; },
      eq(k, v){ q.filters[k] = v; return b; },
      maybeSingle(){ return b; }, single(){ return b; },
      then(res, rej){ return run().then(res, rej); },
    };
    async function run(){
      await new Promise(r => setTimeout(r, 20 + (q.op === 'select' ? (window.__fakeSelectDelay || 0) : 0)));
      if (table !== 'trainer_sessions') return { data: null, error: null };
      const t = readT();
      if (q.op === 'select') return { data: t[q.filters.code] ? clone(t[q.filters.code]) : null, error: null };
      const r = clone(q.row);
      t[r.code] = Object.assign({}, t[r.code] || {}, r);
      writeT(t);
      return { data: null, error: null };
    }
    return b;
  }
  window.supabase = { createClient(){ return {
    from: builder,
    channel(name){
      const bc = new BroadcastChannel('fakeRT:' + name);
      const handlers = [];
      const ch = {
        state: 'joining', __bc: bc,
        on(type, filter, cb){ handlers.push({ type, filter, cb }); return ch; },
        subscribe(cb){ setTimeout(() => { ch.state = 'joined'; if (cb) cb('SUBSCRIBED'); }, 10); return ch; },
        // задержка сети: без неё эхо от собеседника не успевает разойтись
        // во времени с собственными действиями и гонка не воспроизводится
        send(msg){ const m = clone(msg); setTimeout(() => bc.postMessage(m), window.__fakeLatency || 0); return Promise.resolve('ok'); },
      };
      bc.onmessage = (e) => {
        const m = e.data;
        handlers.forEach(h => {
          if (h.type === 'broadcast' && h.filter && h.filter.event === m.event) h.cb({ payload: m.payload });
        });
      };
      return ch;
    },
    removeChannel(ch){ try { ch.__bc.close(); } catch (e) {} if (ch) ch.state = 'closed'; },
    auth: { onAuthStateChange(){ return { data: { subscription: { unsubscribe(){} } } }; } },
  }; } };
})();
"""


@contextlib.contextmanager
def local_server():
    proc = subprocess.Popen(
        [sys.executable, "-m", "http.server", str(PORT)],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    try:
        for _ in range(50):
            try:
                conn = http.client.HTTPConnection("127.0.0.1", PORT, timeout=0.2)
                conn.request("GET", "/index.html")
                conn.getresponse()
                break
            except Exception:
                time.sleep(0.1)
        else:
            raise RuntimeError("локальный сервер не поднялся")
        yield
    finally:
        proc.terminate()
        proc.wait(timeout=5)


def new_page(context, errors, latency=0, select_delay=0):
    page = context.new_page()
    page.add_init_script(f"window.__fakeLatency = {latency}; window.__fakeSelectDelay = {select_delay};")
    page.route("**/supabase-js.umd.js", lambda route: route.fulfill(
        status=200, content_type="application/javascript", body=FAKE_LIB))
    # шрифты с Google в песочнице не грузятся — не ждём их
    page.route("**/fonts.googleapis.com/**", lambda route: route.abort())
    page.route("**/fonts.gstatic.com/**", lambda route: route.abort())
    page.on("pageerror", lambda e: errors.append(f"{page.url}: {e}"))
    return page


def state(page):
    return page.evaluate("() => window.__trainerState.get()")


def card_frame(page):
    for f in page.frames:
        if "card=1" in f.url:
            return f
    return None


def add_one_card(page):
    page.click("#addRailToggle")
    page.click('.add-qty-btn[data-n="1"]')
    page.wait_for_function("""() => {
        const f = document.querySelector('.tm-card iframe');
        try { const s = f && f.contentWindow.__trainerState && f.contentWindow.__trainerState.get();
              return !!(s && (s.curTask || s.P)); } catch (e) { return false; }
    }""", timeout=10000)
    return card_frame(page)


def check_cards(browser, failures, errors):
    # тренажёры с экраном выбора типа: карточка того же типа, задание видно
    for slug in ("oge6", "oge7"):
        ctx = browser.new_context()
        page = new_page(ctx, errors)
        page.goto(f"{BASE}/{slug}.html")
        page.wait_for_function("() => window.__trainerState")
        page.click("#modesGrid .mode-card:not(.random):not(.demo)")
        page.wait_for_timeout(300)
        parent = state(page)
        try:
            frame = add_one_card(page)
        except Exception:
            failures.append(f"A/{slug}: «+1» не дал задания в карточке")
            ctx.close()
            continue
        cs = frame.evaluate("() => window.__trainerState.get()")
        visible = frame.evaluate("() => document.getElementById('questionPanel').offsetParent !== null")
        if cs.get("curMode") != parent.get("curMode"):
            failures.append(f"A/{slug}: тип карточки {cs.get('curMode')} ≠ тип страницы {parent.get('curMode')}")
        if not visible:
            failures.append(f"A/{slug}: в карточке не видно задания")
        cards = page.evaluate("() => window.__cardsGetState().__cards")
        if not (cards and cards[0].get("state")):
            failures.append(f"A/{slug}: снимок карточки не попал в общее состояние")
        print(f"  A/{slug}: тип {cs.get('curMode')}, задание видно: {visible}")
        ctx.close()

    # ОГЭ №19: с Промпта №61 есть экран выбора типа (нулевой — из демоверсии);
    # открываем обычный тип, как ученик
    ctx = browser.new_context()
    page = new_page(ctx, errors)
    page.goto(f"{BASE}/oge19.html")
    page.wait_for_function("() => window.__trainerState")
    page.click('.mode-card[data-id="geom"]')
    try:
        frame = add_one_card(page)
        cs = frame.evaluate("() => window.__trainerState.get()")
        n = len((cs.get("curTask") or {}).get("statements") or [])
        if n != 5:
            failures.append(f"A/oge19: в карточке {n} утверждений вместо 5")
        print(f"  A/oge19: утверждений в карточке {n}")
    except Exception:
        failures.append("A/oge19: «+1» не дал задания в карточке")
    ctx.close()

    # арифметика: карточка на том же уровне, что и основная страница
    ctx = browser.new_context()
    page = new_page(ctx, errors)
    page.goto(f"{BASE}/addition.html")
    page.wait_for_function("() => window.__trainerState")
    levels = page.evaluate("() => [...document.querySelectorAll('#levels .lvl:not(.custom)')].map(b => b.dataset.id)")
    target = levels[-1]
    page.click(f'#levels .lvl[data-id="{target}"]')
    page.wait_for_timeout(300)
    parent = state(page)
    try:
        frame = add_one_card(page)
        cs = frame.evaluate("() => window.__trainerState.get()")
        if str(cs.get("curLevel")) != str(parent.get("curLevel")):
            failures.append(f"A/addition: уровень карточки {cs.get('curLevel')} ≠ уровень страницы {parent.get('curLevel')}")
        print(f"  A/addition: уровень страницы {parent.get('curLevel')}, карточки {cs.get('curLevel')}")
    except Exception:
        failures.append("A/addition: «+1» не дал примера в карточке")
    ctx.close()


def wait_code(page):
    page.wait_for_function("() => window.TrainerSession && window.TrainerSession.getCode()", timeout=10000)
    return page.evaluate("() => window.TrainerSession.getCode()")


def check_oge7(browser, failures, errors):
    ctx = browser.new_context()
    teacher = new_page(ctx, errors)
    teacher.goto(f"{BASE}/oge7.html")
    code = wait_code(teacher)
    teacher.click("#modesGrid .mode-card:not(.random):not(.demo)")
    teacher.wait_for_timeout(700)   # дать таймеру разослать выбор типа
    t0 = state(teacher)

    student = new_page(ctx, errors)
    student.goto(f"{BASE}/oge7.html?s={code}")
    wait_code(student)
    try:
        student.wait_for_function(
            "(p) => { const s = window.__trainerState.get(); return !s.picker && s.curTask && s.curTask.prompt === p; }",
            arg=t0["curTask"]["prompt"], timeout=8000)
    except Exception:
        failures.append("B/oge7: присоединившийся не получил задание учителя")
    s0 = state(student)
    if s0.get("curMode") != t0.get("curMode"):
        failures.append(f"B/oge7: тип у ученика {s0.get('curMode')} ≠ {t0.get('curMode')}")
    teacher.wait_for_timeout(900)
    if state(teacher)["curTask"]["prompt"] != t0["curTask"]["prompt"]:
        failures.append("B/oge7: подключение ученика подменило задание учителя")
    print(f"  B/oge7: тип {s0.get('curMode')}, задание совпало")

    # новое задание у учителя → у ученика
    teacher.click("#refreshBtn")
    t1 = state(teacher)
    try:
        student.wait_for_function("(p) => window.__trainerState.get().curTask.prompt === p",
                                  arg=t1["curTask"]["prompt"], timeout=5000)
    except Exception:
        failures.append("B/oge7: новое задание не доехало до ученика")

    # неверный вариант → у ученика тот же неверный и кнопка «изменить ответ»
    ci = t1["curTask"]["correctIndex"]
    wrong = 0 if ci != 0 else 1
    teacher.click(f'#mcqOptions .mcq-btn[data-i="{wrong}"]')
    try:
        student.wait_for_function("""(w) => { const s = window.__trainerState.get();
            return s.wrongIndex === w && s.wrongShown && s.hadWrongPick; }""", arg=wrong, timeout=5000)
    except Exception:
        failures.append("B/oge7: неверный выбор учителя не отразился у ученика")

    # «изменить ответ» → варианты снова открыты у обоих
    teacher.click("#changeAnswerBtn")
    try:
        student.wait_for_function("() => { const s = window.__trainerState.get(); return s.wrongIndex === null && !s.wrongShown; }",
                                  timeout=5000)
    except Exception:
        failures.append("B/oge7: «изменить ответ» не доехало до ученика")

    # верный вариант → решено у обоих, у ученика открыт разбор
    teacher.click(f'#mcqOptions .mcq-btn[data-i="{ci}"]')
    try:
        student.wait_for_function("""(ci) => { const s = window.__trainerState.get();
            const b = document.querySelectorAll('#mcqOptions .mcq-btn')[ci];
            return s.taskAnswered && b && b.classList.contains('correct'); }""", arg=ci, timeout=5000)
        student.wait_for_function("() => document.getElementById('mainPanel').style.display === 'block'", timeout=3000)
    except Exception:
        failures.append("B/oge7: верный ответ учителя не отразился у ученика")

    # возврат к выбору типа
    teacher.click("#backBtn")
    try:
        student.wait_for_function("() => window.__trainerState.get().picker === true", timeout=5000)
    except Exception:
        failures.append("B/oge7: возврат к выбору типа не доехал до ученика")
    for who, pg in (("учителя", teacher), ("ученика", student)):
        if "strokes" not in state(pg):
            failures.append(f"B/oge7: в снимке {who} нет доски")
    print("  B/oge7: новое задание, неверный выбор, изменение ответа, решение, возврат — доехали")
    ctx.close()


def check_oge19(browser, failures, errors):
    ctx = browser.new_context()
    teacher = new_page(ctx, errors)
    teacher.goto(f"{BASE}/oge19.html")
    code = wait_code(teacher)
    # Промпт №61: сначала экран выбора типа — учитель открывает обычный тип,
    # ученик попадает туда же через общий снимок
    teacher.click('.mode-card[data-id="geom"]')
    teacher.wait_for_timeout(400)
    t0 = state(teacher)

    student = new_page(ctx, errors)
    student.goto(f"{BASE}/oge19.html?s={code}")
    wait_code(student)
    texts = [s["text"] for s in t0["curTask"]["statements"]]
    try:
        student.wait_for_function(
            "(t) => JSON.stringify(window.__trainerState.get().curTask.statements.map(s => s.text)) === JSON.stringify(t)",
            arg=texts, timeout=8000)
    except Exception:
        failures.append("C/oge19: присоединившийся не получил утверждения учителя")
    teacher.wait_for_timeout(900)
    if [s["text"] for s in state(teacher)["curTask"]["statements"]] != texts:
        failures.append("C/oge19: подключение ученика подменило задание учителя")

    # отметка ученика видна учителю
    student.click('#stmtList .stmt[data-i="0"]')
    try:
        teacher.wait_for_function("() => window.__trainerState.get().picked.includes(0)", timeout=5000)
        teacher.wait_for_function("() => document.querySelector('#stmtList .stmt[data-i=\"0\"]').classList.contains('picked')",
                                  timeout=2000)
    except Exception:
        failures.append("C/oge19: отметка ученика не видна учителю")

    # и обратное снятие отметки — состояние снова совпадает с последним
    # пришедшим от учителя; фильтр эха не должен его проглотить
    student.click('#stmtList .stmt[data-i="0"]')
    try:
        teacher.wait_for_function("() => window.__trainerState.get().picked.length === 0", timeout=5000)
    except Exception:
        failures.append("C/oge19: снятая учеником отметка осталась у учителя (фильтр эха проглотил возврат)")

    # новое задание у учителя → у ученика, отметки сброшены
    teacher.click("#refreshBtn")
    t1 = state(teacher)
    texts1 = [s["text"] for s in t1["curTask"]["statements"]]
    try:
        student.wait_for_function("""(t) => { const s = window.__trainerState.get();
            return JSON.stringify(s.curTask.statements.map(x => x.text)) === JSON.stringify(t) && s.picked.length === 0; }""",
            arg=texts1, timeout=5000)
    except Exception:
        failures.append("C/oge19: новое задание не доехало до ученика")

    # учитель отмечает верные и проверяет → у ученика решено и открыт разбор
    for i, st in enumerate(t1["curTask"]["statements"]):
        if st["isTrue"]:
            teacher.click(f'#stmtList .stmt[data-i="{i}"]')
    teacher.click("#checkBtn")
    try:
        student.wait_for_function("""() => { const s = window.__trainerState.get();
            return s.taskAnswered && document.getElementById('mainPanel').style.display === 'block'
              && document.querySelectorAll('#stmtList .stmt.correct').length === 2; }""", timeout=5000)
    except Exception:
        failures.append("C/oge19: проверка ответа не доехала до ученика")
    # доска по-прежнему входит в общий снимок (раньше init здесь слал только её)
    for who, pg in (("учителя", teacher), ("ученика", student)):
        if "strokes" not in state(pg):
            failures.append(f"C/oge19: в снимке {who} нет доски")
    print("  C/oge19: утверждения, отметка ученика, новое задание, проверка — доехали")
    ctx.close()


def check_no_echo(browser, failures, errors, slugs):
    """D. Эхо собеседника не откатывает быстрые действия.

    Раньше присоединившийся, получив снимок, через 300 мс своим таймером
    отправлял его же обратно. Если учитель за это время успевал сделать
    следующее действие, запоздавшее эхо откатывало его назад — и потом этот
    откат разлетался всем. При задержке сети в 150 мс это воспроизводится
    стабильно. Плюс присоединившийся, у которого ответ базы запоздал, больше
    не рассылает свой случайный пример поверх задания учителя."""
    for slug in slugs:
        ctx = browser.new_context()
        teacher = new_page(ctx, errors, latency=150)
        teacher.goto(f"{BASE}/{slug}.html")
        code = wait_code(teacher)
        solo = teacher.evaluate("() => !!window.__trainerState.get().solo")
        if not solo and teacher.query_selector("#modesGrid .mode-card:not(.random):not(.demo)"):
            teacher.click("#modesGrid .mode-card:not(.random):not(.demo)")
        teacher.wait_for_timeout(700)
        before = state(teacher)
        # ученик с медленной базой: снимок из базы приходит через 700 мс
        student = new_page(ctx, errors, latency=150, select_delay=700)
        student.goto(f"{BASE}/{slug}.html?s={code}")
        wait_code(student)
        student.wait_for_timeout(2500)
        key = "P" if solo else "curTask"
        if state(teacher).get(key) != before.get(key):
            failures.append(f"D/{slug}: подключение ученика с медленной базой подменило задание учителя")

        if not solo and state(teacher).get("picker"):
            failures.append(f"D/{slug}: подключение ученика выкинуло учителя на выбор типа")
            ctx.close()
            continue

        # два быстрых действия подряд у учителя
        if solo:
            ids = teacher.evaluate("() => [...document.querySelectorAll('#levels .lvl:not(.custom)')].map(b => b.dataset.id)")
            teacher.click(f'#levels .lvl[data-id="{ids[0]}"]')
            teacher.wait_for_timeout(350)
            teacher.click(f'#levels .lvl[data-id="{ids[1]}"]')
        else:
            teacher.click("#refreshBtn")
            teacher.wait_for_timeout(350)
            teacher.click("#refreshBtn")
        final = state(teacher)
        teacher.wait_for_timeout(2500)
        t_end, s_end = state(teacher), state(student)
        if t_end.get(key) != final.get(key):
            failures.append(f"D/{slug}: эхо ученика откатило действие учителя")
        if s_end.get(key) != final.get(key):
            failures.append(f"D/{slug}: у ученика не последнее действие учителя")
        print(f"  D/{slug}: учитель остался на своём: {t_end.get(key) == final.get(key)}, ученик догнал: {s_end.get(key) == final.get(key)}")
        ctx.close()


def check_versions(browser, failures, errors):
    """E. Версия задания: повторный снимок и одновременные правки.

    Снимок уходит и с каждым штрихом доски — с тем заданием, которое было у
    отправителя в тот момент. Раньше такой снимок, догнавший свежий ответ
    ученика, откатывал его. И две одновременные правки расходились навсегда."""
    ctx = browser.new_context()
    teacher = new_page(ctx, errors, latency=150)
    teacher.goto(f"{BASE}/oge19.html")
    code = wait_code(teacher)
    teacher.click('.mode-card[data-id="geom"]')   # Промпт №61: экран выбора типа
    student = new_page(ctx, errors, latency=150)
    student.goto(f"{BASE}/oge19.html?s={code}")
    wait_code(student)
    student.wait_for_timeout(1500)
    t = state(teacher)
    # ученик отвечает верно, а учитель в тот же миг «поднимает перо» —
    # его снимок (ещё без ответа ученика) уходит вместе со штрихом
    for i, st in enumerate(t["curTask"]["statements"]):
        if st["isTrue"]:
            student.click(f'#stmtList .stmt[data-i="{i}"]')
    student.click("#checkBtn")
    teacher.evaluate("() => window.TrainerSession.push()")
    student.wait_for_timeout(2500)
    s_st, t_st = state(student), state(teacher)
    if not s_st["taskAnswered"]:
        failures.append("E/oge19: снимок со штрихом учителя откатил ответ ученика")
    if not t_st["taskAnswered"]:
        failures.append("E/oge19: ответ ученика не дошёл до учителя")
    print(f"  E/oge19: ответ ученика устоял: {s_st['taskAnswered']}, у учителя: {t_st['taskAnswered']}")

    # одновременные правки: оба отмечают разные утверждения в один миг
    teacher.click("#refreshBtn")
    student.wait_for_timeout(1500)
    teacher.click('#stmtList .stmt[data-i="0"]')
    student.click('#stmtList .stmt[data-i="1"]')
    student.wait_for_timeout(2500)
    a, b = state(teacher)["picked"], state(student)["picked"]
    if a != b:
        failures.append(f"E/oge19: одновременные отметки разошлись навсегда: у учителя {a}, у ученика {b}")
    print(f"  E/oge19: после одновременных отметок у учителя {a}, у ученика {b}")
    ctx.close()

    # ОГЭ №7: шаги, вставленные «выбором дроби», не меняют задание в снимке
    ctx = browser.new_context()
    page = new_page(ctx, errors)
    page.goto(f"{BASE}/oge7.html")
    page.wait_for_function("() => window.__trainerState")
    page.click("#modesGrid .mode-card:not(.random):not(.demo)")
    page.wait_for_timeout(300)
    same = page.evaluate("""() => {
        const before = JSON.stringify(window.__trainerState.get().curTask);
        curTask.steps.splice(0, 0, { type: 'qa', question: 'вставка (тест)' });
        return before === JSON.stringify(window.__trainerState.get().curTask);
    }""")
    if not same:
        failures.append("E/oge7: вставка шагов «выбора дроби» меняет задание в общем снимке")
    print(f"  E/oge7: задание в снимке не зависит от вставленных шагов: {same}")
    ctx.close()

    # «+1» не делит с кадром живые объекты основной страницы
    ctx = browser.new_context()
    page = new_page(ctx, errors)
    page.goto(f"{BASE}/quadratic.html")
    page.wait_for_function("() => window.__trainerState")
    frame = add_one_card(page)
    shared = page.evaluate("""() => {
        const f = document.querySelector('.tm-card iframe').contentWindow;
        return f.__trainerState.get().S === window.__trainerState.get().S
            || f.__trainerState.get().P === window.__trainerState.get().P;
    }""")
    if shared:
        failures.append("E/quadratic: карточка работает с живыми объектами основной страницы")
    print(f"  E/quadratic: карточка со своими копиями P/S: {not shared}")
    ctx.close()


def run():
    failures, errors = [], []
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch()
        if not ONLY:
            print("A. «+1» — карточка того же типа/уровня")
            check_cards(browser, failures, errors)
            print("B. ОГЭ №7 — совместная работа над заданием")
            check_oge7(browser, failures, errors)
            print("C. ОГЭ №19 — совместная работа над заданием")
            check_oge19(browser, failures, errors)
            print("E. Версия задания в общем снимке")
            check_versions(browser, failures, errors)
        print("D. Эхо собеседника не откатывает быстрые действия")
        check_no_echo(browser, failures, errors, ONLY or ECHO_SLUGS)
        browser.close()
    if errors:
        failures.append("ошибки JS на странице: " + " | ".join(errors[:5]))
    print()
    if failures:
        print("ПРОВАЛЫ:")
        for f in failures:
            print(" -", f)
        sys.exit(1)
    print("ИТОГ: всё прошло")


if __name__ == "__main__":
    run()
