"""
Промпт №87в: свои шаблоны презентаций привязаны к аккаунту (таблица
deck_templates, deck-templates-schema.sql; deck-core.js, HANDOFF.md 6б).

Облако подменено клиентом в памяти (window.SB): настоящий Supabase из
песочницы недоступен. Проверяем:
  1. Без входа шаблон хранится только в браузере (ключ deckPresets)
  2. Вошли — сохранённое без входа уезжает в аккаунт: строка в облаке,
     копия в браузере под ключом deckPresets:<id>, старый ключ удалён
  3. Новый шаблон, переименование, удаление — сразу в облаке
  4. Шаблон, сохранённый на другом устройстве, появляется при открытии
  5. Без связи шаблон сохраняется в браузере и уезжает, когда связь есть
  6. Таблицы нет (SQL не выполнен) — молча работаем в браузере
"""
import os
import subprocess
import sys
import time
import contextlib
import http.client

from playwright.sync_api import sync_playwright

PORT = 8993
BASE = f"http://127.0.0.1:{PORT}"


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
                conn.request("GET", "/boards.html")
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


BOOT_JS = """
() => {
  const gate = document.getElementById('authGate');
  if (gate) gate.style.display = 'none';
  window.boardsAppBoot();
  // список досок показывает вход в облако (boards-cloud.js); без него — сами
  document.getElementById('screenList').style.display = 'flex';
}
"""

fails = []


def check(cond, msg):
    print(("OK   " if cond else "FAIL ") + msg)
    if not cond:
        fails.append(msg)


def slide_no(page):
    return page.inner_text("#deckNo").strip()


def wait_no(page, want, timeout=2000):
    t0 = time.time()
    while time.time() - t0 < timeout / 1000:
        if slide_no(page) == want:
            return True
        page.wait_for_timeout(50)
    return False



FAKE_SB = """() => {
  window.__rows = []; window.__fail = null;
  const res = (v) => Promise.resolve(window.__fail ? { data: null, error: window.__fail } : v);
  window.SB = { from(t) { return {
    select() { return this; },
    order() { return res({ data: window.__rows.slice().reverse(), error: null }); },
    upsert(row) {
      if (window.__fail) return res(null);
      const i = window.__rows.findIndex(r => r.id === row.id);
      if (i >= 0) Object.assign(window.__rows[i], row);
      else window.__rows.push(Object.assign({ created_at: new Date().toISOString() }, JSON.parse(JSON.stringify(row))));
      return res({ error: null });
    },
    delete() { return { eq(_, id) {
      if (window.__fail) return res(null);
      window.__rows = window.__rows.filter(r => r.id !== id); return res({ error: null });
    } }; },
  }; } };
}"""


def rows(page):
    return page.evaluate("() => window.__rows.map(r => ({ kind: r.kind, name: r.name, id: r.id }))")


def main():
    exe = os.environ.get("PW_CHROMIUM") or None
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch(executable_path=exe)
        ctx = browser.new_context(viewport={"width": 1280, "height": 800})
        page = ctx.new_page()
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        # ответ на prompt/confirm — из питона: evaluate внутри обработчика
        # диалога блокирует страницу намертво
        ans = [""]
        page.on("dialog", lambda d: d.accept(ans[0]) if d.type == "prompt" else d.accept())
        page.goto(f"{BASE}/boards.html")
        page.evaluate(BOOT_JS)
        page.wait_for_selector("#blCreateDeck")
        page.evaluate(FAKE_SB)
        page.evaluate("() => { window.CURRENT_USER = null; }")
        page.click("#blCreateDeck")
        page.wait_for_function("() => typeof B !== 'undefined' && B && B.kind === 'deck' && boardActive")
        page.wait_for_function("() => deckPresetsLoaded")

        # 1. без входа — только браузер
        ans[0] = "Локальный"
        page.evaluate("() => { deckSaveSlideTemplate(deckCur().id); }")
        page.wait_for_function("() => deckPresets.slides.length === 1")
        page.wait_for_timeout(300)
        local = page.evaluate("() => idbGet('deckPresets').then(v => v ? v.slides.map(s => s.name) : null)")
        check(local == ["Локальный"] and rows(page) == [], f"без входа шаблон только в браузере ({local}, облако {rows(page)})")

        # 2. вошли — уехало в аккаунт
        page.evaluate("() => { window.CURRENT_USER = { id: 'u1' }; return deckLoadPresets(); }")
        page.wait_for_function("() => window.__rows.length === 1", timeout=5000)
        r = rows(page)
        check(r[0]["kind"] == "slide" and r[0]["name"] == "Локальный" and len(r[0]["id"]) == 36, f"шаблон без входа уехал в аккаунт ({r})")
        keys = page.evaluate("() => Promise.all([idbGet('deckPresets'), idbGet('deckPresets:u1')]).then(([a, b]) => [!!a, b && b.slides.length, b && b.slides[0]._dirty])")
        check(keys == [False, 1, None], f"копия в браузере под аккаунтом, старый ключ удалён ({keys})")
        check(page.evaluate("() => deckPresets.slides[0].objects !== undefined && window.__rows[0].data.preview.startsWith('data:image')"), "в облаке шаблон целиком, с превью")

        # 3. новое, переименование, удаление
        ans[0] = "Тетрадь"
        page.evaluate("() => { deckSaveBgPreset(); }")
        page.wait_for_function("() => window.__rows.length === 2")
        check(sorted(x["kind"] for x in rows(page)) == ["bg", "slide"], "новая подложка сразу в облаке")
        sid = page.evaluate("() => deckPresets.slides[0].id")
        ans[0] = "План урока"
        page.evaluate("(id) => { deckRenamePreset('slides', id); }", sid)
        page.wait_for_function("(id) => window.__rows.find(r => r.id === id).name === 'План урока'", arg=sid)
        check(True, "переименование ушло в облако")
        bid = page.evaluate("() => deckPresets.bgs[0].id")
        page.evaluate("(id) => deckDeletePreset('bgs', id)", bid)
        page.wait_for_function("() => window.__rows.length === 1")
        check(rows(page)[0]["id"] == sid, "удаление ушло в облако")

        # 4. шаблон с другого устройства
        page.evaluate("""() => { window.__rows.push({ id: '11111111-2222-4333-8444-555555555555', kind: 'format', name: 'С ноутбука',
          data: { w: 60, h: 30 }, created_at: new Date().toISOString() }); return deckLoadPresets(true); }""")
        page.wait_for_function("() => deckPresets.formats.length === 1")
        check(page.evaluate("() => deckPresets.formats[0].name") == "С ноутбука", "шаблон с другого устройства появился")

        # 5. без связи — потом уезжает
        ans[0] = "В дороге"
        page.evaluate("() => { window.__fail = { message: 'TypeError: Failed to fetch' }; deckSaveFormatPreset(); }")
        page.wait_for_function("() => deckPresets.formats.length === 2")
        page.wait_for_timeout(300)
        st = page.evaluate("() => ({ dirty: !!deckPresets.formats[0]._dirty, rows: window.__rows.length, off: deckCloudOff })")
        check(st == {"dirty": True, "rows": 2, "off": False}, f"без связи шаблон ждёт в браузере ({st})")
        page.evaluate("() => { window.__fail = null; return deckCloudPush(); }")
        page.wait_for_function("() => window.__rows.length === 3")
        check(not page.evaluate("() => !!deckPresets.formats[0]._dirty"), "связь вернулась — шаблон уехал")

        # 6. таблицы нет
        ans[0] = "Без таблицы"
        page.evaluate("""() => { window.__fail = { code: '42P01', message: 'relation "public.deck_templates" does not exist' };
          deckSaveFormatPreset(); }""")
        page.wait_for_function("() => deckPresets.formats.length === 3")
        page.wait_for_timeout(300)
        check(page.evaluate("() => deckCloudOff"), "таблицы нет — облако выключено до перезагрузки")
        check(page.evaluate("() => idbGet('deckPresets:u1').then(v => v.formats.length)") == 3, "шаблон при этом сохранён в браузере")

        check(not errors, f"нет ошибок на странице ({errors[:3]})")
        browser.close()

    if fails:
        print(f"\nПРОВАЛЕНО: {len(fails)}")
        sys.exit(1)
    print("\nВСЁ ПРОШЛО")


if __name__ == "__main__":
    main()
