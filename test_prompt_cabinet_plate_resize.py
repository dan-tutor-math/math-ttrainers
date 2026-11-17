"""
Планер кабинета: плашка тянется за нижний И верхний край шагом 15 минут
(в том числе когда край стоит ровно на линии часа — раньше её перехватывала
линия сетки), а светлая плашка «не проведено» заметно отличается от фона.
"""
import json

from playwright.sync_api import sync_playwright

from test_prompt_cabinet_payments import B1, FIXED_NOW_JS
from test_prompt_cabinet_stats import stats_seed
from test_prompt_b1_student_memory import BASE, STATE, check, local_server


def main():
    errors = []
    STATE["db"] = json.dumps(stats_seed())
    STATE["offline"] = False
    with local_server(), sync_playwright() as pw:
        browser = pw.chromium.launch()
        ctx = B1.new_context(browser, signed_in=True, bind="tab")
        ctx.add_init_script(FIXED_NOW_JS)
        ctx.add_init_script("try{localStorage.setItem('cabinet:schedule:view','week')}catch(e){}")
        p = ctx.new_page()
        B1.PUMP["page"] = p
        p.on("pageerror", lambda e: errors.append(str(e)))
        p.set_viewport_size({"width": 1400, "height": 900})
        p.goto(f"{BASE}/cabinet.html#/schedule/2026-11-18")
        p.wait_for_selector(".sc-plate")
        # плашка без статуса «проведено/отмена/перенос» и с концом на целом часе
        info = p.evaluate("""() => {
          const out = [];
          document.querySelectorAll('.sc-plate').forEach(pl => {
            if (pl.classList.contains('open')) return;
            const t = pl.querySelector('.sc-pt').textContent;
            out.push([pl.dataset.id, pl.className, t, Math.round(pl.getBoundingClientRect().height)]);
          });
          return out;
        }""")
        target = next((i for i in info if "st-plan" in i[1] and "ev" not in i[1].split()), None)
        check("R0 есть плашка «не проведено»", target is not None, str(info[:5]))
        pid = target[0]
        sel = f".sc-plate[data-id='{pid}']"
        # контраст: рамка заметно темнее фона
        bc = p.evaluate(f"() => getComputedStyle(document.querySelector(\"{sel}\")).borderTopColor")
        check("R1 рамка светлой плашки не белая", bc not in ("rgba(255, 255, 255, 0.95)", "rgb(255, 255, 255)"), bc)

        def box():
            return p.locator(sel).bounding_box()

        p.evaluate(f"() => document.querySelector(\"{sel}\").scrollIntoView({{block: 'center'}})")
        p.wait_for_timeout(200)
        h0 = box()["height"]
        P = (h0 + 4) / 60          # пикселей на минуту (плашка — час)
        rz = p.locator(sel + " .sc-rz").bounding_box()
        x = rz["x"] + rz["width"] / 2
        p.mouse.move(x, rz["y"] + rz["height"] / 2)
        p.mouse.down()
        p.mouse.move(x, rz["y"] + 20, steps=3)
        p.mouse.move(x, rz["y"] + rz["height"] / 2 + 30 * P, steps=5)   # +30 минут
        tip = p.inner_text(".sc-dtip")
        check("R2a подсказка при растягивании — только длительность «1 ч 30 мин», без «+30»", tip == "1 ч 30 мин", tip)
        p.mouse.up()
        check("R2b подсказка убрана после отпускания", p.locator(".sc-dtip").count() == 0)
        p.wait_for_timeout(600)
        h1 = box()["height"]
        check("R2 нижний край: +30 минут", abs((h1 - h0) - 30 * P) < 3, f"{h0} -> {h1}")

        b0 = box()
        rt = p.locator(sel + " .sc-rzt").bounding_box()
        p.mouse.move(x, rt["y"] + rt["height"] / 2)
        p.mouse.down()
        p.mouse.move(x, rt["y"] - 10, steps=3)
        p.mouse.move(x, rt["y"] + rt["height"] / 2 - 15 * P, steps=5)   # на 15 минут раньше
        p.mouse.up()
        p.wait_for_timeout(600)
        b1 = box()
        check("R3 верхний край: начало на 15 минут раньше, конец на месте",
              abs((b0["y"] - b1["y"]) - 15 * P) < 3 and abs((b1["y"] + b1["height"]) - (b0["y"] + b0["height"])) < 3, f"{b0} -> {b1}")
        # цветовая схема: выбор в «Вид», запоминается
        before = p.evaluate(f"() => getComputedStyle(document.querySelector(\"{sel}\")).borderTopColor")
        p.evaluate("async () => { await TeacherSettings.set({ planner: Object.assign({}, TeacherSettings.get().planner, { pal: 'vivid' }) }); }")
        p.reload()
        p.wait_for_selector(sel)
        after = p.evaluate(f"() => getComputedStyle(document.querySelector(\"{sel}\")).borderTopColor")
        check("R5 схема «Яркая» из сохранённого вида меняет цвет рамки", before != after and p.locator("#scPal").count() == 1, f"{before} {after}")
        p.click(".sc-lookbtn")
        p.wait_for_selector(".gm-look .sc-palsw")
        check("R6 в меню «Вид» пять схем цветов", p.locator(".gm-look .sc-palsw").count() == 5)
        p.click(".gm-look >> text=Мягкая")
        p.wait_for_timeout(300)
        check("R7 выбор «Мягкая» в меню запомнен", p.evaluate("() => JSON.parse(localStorage.getItem('cabinet:schedule:look')).pal") == "soft")
        # вид на аккаунте: выбор ушёл в настройки аккаунта, а вид с аккаунта подхватывается на «чистом» устройстве
        check("R8 выбор схемы сохранён в TeacherSettings.planner", p.evaluate("() => TeacherSettings.get().planner && TeacherSettings.get().planner.pal") == "soft")
        p.screenshot(path="/private/tmp/claude-501/-Users-daniilkolesnikov--claude-spares-spare-kVjtxo/d7900454-d161-4892-be5f-907715b41952/scratchpad/planner_light.png")
        check("R4 нет ошибок JS", not errors, str(errors))
        # другое устройство: вида в localStorage нет, а на аккаунте он уже есть
        seed = stats_seed()
        seed["teacher_settings"] = [{"owner": seed["teacher_settings"][0]["owner"] if seed.get("teacher_settings") else "owner-1",
                                     "settings": {"planner": {"end": True, "grp": "ini", "span": "week", "pal": "warm"}}}]
        STATE["db"] = json.dumps(seed)
        ctx2 = B1.new_context(browser, signed_in=True, bind="tab")
        ctx2.add_init_script(FIXED_NOW_JS)
        p2 = ctx2.new_page()
        B1.PUMP["page"] = p2
        p2.set_viewport_size({"width": 1400, "height": 900})
        p2.goto(f"{BASE}/cabinet.html#/schedule/2026-11-18")
        p2.wait_for_function("() => document.getElementById('scPal') && document.querySelector('.sc-plate')", timeout=8000)
        lk = p2.evaluate("() => JSON.parse(localStorage.getItem('cabinet:schedule:look') || '{}')")
        check("R9 другое устройство берёт вид с аккаунта (схема «Тёплая»)", p2.evaluate("() => document.getElementById('scPal').textContent.includes('FFF3DC')"), str(lk))
        browser.close()


if __name__ == "__main__":
    main()
