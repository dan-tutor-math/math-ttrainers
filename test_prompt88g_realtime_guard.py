"""
Промпт №88г: предохранитель realtime (supabase-config.js, rtGuard).

Когда вебсокет к Supabase не поднимается (в песочнице он закрыт — ровно
как было у учителя), широковещательные сообщения не уходят HTTP-запросами,
а очереди библиотеки не растут больше предела. Проверяем на всех
клиентах страницы досок: облачном (window.SB) и совместной сессии.
"""
import os
import subprocess
import sys
import time
import contextlib
import http.client
import json

from playwright.sync_api import sync_playwright

PORT = 8999
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



fails = []


def check(cond, msg):
    print(("OK   " if cond else "FAIL ") + msg)
    if not cond:
        fails.append(msg)


def main():
    exe = os.environ.get("PW_CHROMIUM") or None
    with local_server(), sync_playwright() as p:
        browser = p.chromium.launch(executable_path=exe)
        page = browser.new_context(viewport={"width": 1280, "height": 800}).new_page()
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        # считаем HTTP-рассылки realtime (то, во что превращается send без сокета)
        page.add_init_script("""window.__bc = 0; const f0 = window.fetch;
          window.fetch = function(u){ try { if (String(u && u.url || u).includes('/realtime/v1/api/broadcast')) window.__bc++; } catch(e){}
            return f0.apply(this, arguments); };""")
        page.goto(f"{BASE}/boards.html")
        page.evaluate(BOOT_JS)
        page.wait_for_timeout(800)

        check(page.evaluate("() => !!(window.SB && window.SB.__rtGuard)"), "облачный клиент досок под предохранителем")

        # канал без сокета: 50 рассылок — ни одного HTTP-запроса
        page.evaluate("""() => { const ch = window.SB.channel('guard-test'); ch.subscribe(); window.__ch = ch;
          for (let i = 0; i < 50; i++) ch.send({ type: 'broadcast', event: 'cursor', payload: { i } }); }""")
        page.wait_for_timeout(1500)
        st = page.evaluate("() => [window.__ch.state, window.__bc]")
        print("состояние канала:", st[0], "HTTP-рассылок:", st[1])
        check(st[0] != "joined" and st[1] == 0, "без связи рассылки не уходят HTTP-запросами")

        # очередь сокета: 500 сообщений без связи — через пару секунд не больше 20
        page.evaluate("""() => { const rt = window.SB.realtime; const s = (rt.socketAdapter && rt.socketAdapter.socket) || rt;
          for (let i = 0; i < 500; i++) s.push({ topic: 'x', event: 'y', payload: { big: 'z'.repeat(1000) }, ref: String(i) }); }""")
        n0 = page.evaluate("() => { const rt = window.SB.realtime; const s = (rt.socketAdapter && rt.socketAdapter.socket) || rt; return s.sendBuffer.length; }")
        page.wait_for_timeout(2600)
        n1 = page.evaluate("() => { const rt = window.SB.realtime; const s = (rt.socketAdapter && rt.socketAdapter.socket) || rt; return s.sendBuffer.length; }")
        print("очередь сокета:", n0, "→", n1)
        check(n0 >= 500 and n1 <= 20, "очередь сокета без связи урезается до 20")

        # совместная сессия: её клиент тоже под предохранителем — за минуту
        # работы страницы нет ни одной HTTP-рассылки
        page.wait_for_timeout(3000)
        check(page.evaluate("() => window.__bc") == 0, "совместная сессия без связи тоже ничего не шлёт HTTP-запросами")

        check(not errors, "без ошибок на странице" + (": " + "; ".join(errors[:3]) if errors else ""))
        browser.close()
    print("\nИТОГ:", "ВСЁ ХОРОШО" if not fails else f"ПРОВАЛОВ {len(fails)}")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
