/* Свои календарь и выпадающий список вместо системных: системные нельзя оформить под интерфейс.
   Работают поверх обычных <input type="date"> и <select>: исходное поле остаётся в разметке скрытым,
   хранит значение и получает событие change, поэтому остальной код ничего не знает о замене.
   Новые поля подхватываются автоматически (MutationObserver), в том числе в модальных окнах. */
(function () {
  const U = () => RC.util;
  const MONTHS = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
  const MONTHS_SHORT = ["янв.", "февр.", "мар.", "апр.", "мая", "июн.", "июл.", "авг.", "сент.", "окт.", "нояб.", "дек."];
  const DOW = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  const ICON_CAL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>';
  const ICON_DOWN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>';
  const ICON_L = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 6l-6 6 6 6"/></svg>';
  const ICON_R = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>';
  let open = null; // { pop, anchor, close }

  const pad = (n) => String(n).padStart(2, "0");
  const iso = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
  const fmt = (v) => { if (!v) return ""; const [y, m, d] = v.split("-").map(Number); return `${d} ${MONTHS_SHORT[m - 1]} ${y}`; };
  const todayIso = () => U().iso(U().today());

  /* ——— Поповер ——— */
  function place(pop, anchor) {
    const r = anchor.getBoundingClientRect(), vw = document.documentElement.clientWidth, vh = innerHeight;
    pop.style.minWidth = Math.max(r.width, 0) + "px";
    const pw = pop.offsetWidth, ph = pop.offsetHeight;
    let left = Math.min(Math.max(8, r.left), vw - pw - 8);
    let top = r.bottom + 6;
    if (top + ph > vh - 8 && r.top - ph - 6 > 8) top = r.top - ph - 6;
    pop.style.left = left + scrollX + "px"; pop.style.top = top + scrollY + "px";
  }
  function openPop(anchor, build, cls) {
    closePop();
    const pop = document.createElement("div"); pop.className = "rc-pop " + cls; document.body.appendChild(pop);
    const api = { pop, anchor, close: closePop, refresh: () => { build(pop, api); place(pop, anchor); } };
    open = api; anchor.setAttribute("aria-expanded", "true"); anchor.classList.add("is-open");
    api.refresh();
    return api;
  }
  function closePop(focusBack) {
    if (!open) return; const { pop, anchor } = open; open = null;
    pop.remove(); anchor.setAttribute("aria-expanded", "false"); anchor.classList.remove("is-open");
    if (focusBack) anchor.focus();
  }
  document.addEventListener("pointerdown", (e) => { if (open && !open.pop.contains(e.target) && !open.anchor.contains(e.target)) closePop(); });
  document.addEventListener("keydown", (e) => { if (open && e.key === "Escape") { e.preventDefault(); closePop(true); } });
  addEventListener("resize", () => open && place(open.pop, open.anchor));
  addEventListener("scroll", () => open && place(open.pop, open.anchor), true);
  addEventListener("hashchange", () => closePop());

  const fire = (el) => { el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change", { bubbles: true })); };
  const syncErr = (src, btn) => btn.classList.toggle("err", src.classList.contains("err"));
  const relabel = (src, btn) => { if (!src.id) return; btn.id = src.id + "-ui"; document.querySelectorAll(`label[for="${src.id}"]`).forEach((l) => l.setAttribute("for", btn.id)); };

  /* ——— Календарь ——— */
  function pairOf(input) {
    const m = input.id && input.id.match(/^(.*)-(from|to)$/); if (!m) return null;
    const other = document.getElementById(m[1] + "-" + (m[2] === "from" ? "to" : "from"));
    return other ? { role: m[2], other } : null;
  }
  function busyChecker(input, pair) {
    const id = input.dataset.car; if (!id || !RC.store) return null;
    const car = RC.store.car(id); if (!car) return null;
    const day = (d) => { const d1 = U().iso(U().addDays(U().parse(d), 1)); return !RC.store.isFree(car, d, d1); };
    return (d) => {
      if (pair && pair.role === "to") { const from = pair.other.value; if (from && d > from) return !RC.store.isFree(car, from, d); }
      return day(d);
    };
  }

  function enhanceDate(input) {
    if (input.dataset.rcUi) return; input.dataset.rcUi = "1";
    const btn = document.createElement("button"); btn.type = "button";
    btn.className = "input rc-field rc-date"; btn.setAttribute("aria-haspopup", "dialog"); btn.setAttribute("aria-expanded", "false");
    const render = () => { btn.innerHTML = `<span class="rc-val ${input.value ? "" : "ph"}">${input.value ? fmt(input.value) : "Выберите дату"}</span>${ICON_CAL}`; syncErr(input, btn); };
    input.classList.add("rc-native"); input.tabIndex = -1; input.setAttribute("aria-hidden", "true");
    input.after(btn); relabel(input, btn); render();
    new MutationObserver(() => syncErr(input, btn)).observe(input, { attributes: true, attributeFilter: ["class"] });
    input.addEventListener("change", render);

    btn.addEventListener("click", () => {
      if (open && open.anchor === btn) return closePop();
      const pair = pairOf(input);
      const start = U().parse(input.value || (pair && pair.other.value) || input.min || todayIso());
      const view = { y: start.getFullYear(), m: start.getMonth(), mode: !input.value && !input.min && input.max ? "years" : "days" };
      if (view.mode === "years") view.y = start.getFullYear() - 25;
      const isBusy = busyChecker(input, pair);
      openPop(btn, (pop, api) => {
        const min = input.min || "", max = input.max || "";
        const minY = min ? +min.slice(0, 4) : 1940, maxY = max ? +max.slice(0, 4) : U().today().getFullYear() + 3;
        const head = `<div class="dp-head"><button type="button" class="dp-title" data-mode>${view.mode === "days" ? MONTHS[view.m] + " " + view.y : view.mode === "months" ? view.y : "Год"}${ICON_DOWN}</button>
          ${view.mode === "days" ? `<div class="dp-nav"><button type="button" data-step="-1" aria-label="Предыдущий месяц">${ICON_L}</button><button type="button" data-step="1" aria-label="Следующий месяц">${ICON_R}</button></div>` : ""}</div>`;
        let body = "";
        if (view.mode === "days") {
          const first = new Date(view.y, view.m, 1), offset = (first.getDay() + 6) % 7, days = new Date(view.y, view.m + 1, 0).getDate();
          const sel = input.value, other = pair && pair.other.value;
          const lo = pair ? (pair.role === "from" ? sel : other) : "", hi = pair ? (pair.role === "from" ? other : sel) : "";
          let cells = DOW.map((d) => `<span class="dp-dow">${d}</span>`).join("");
          for (let i = 0; i < offset; i++) cells += "<span></span>";
          for (let d = 1; d <= days; d++) {
            const v = iso(view.y, view.m, d);
            const out = (min && v < min) || (max && v > max) || (pair && pair.role === "to" && other && v <= other);
            const busy = !out && isBusy && isBusy(v);
            const cls = ["dp-day", v === todayIso() ? "today" : "", v === sel ? "sel" : "", lo && hi && v > lo && v < hi ? "in" : "", v === other ? "edge" : "", busy ? "busy" : ""].join(" ");
            cells += `<button type="button" class="${cls}" data-v="${v}" ${out || busy ? "disabled" : ""} aria-label="${d} ${MONTHS_SHORT[view.m]} ${view.y}${busy ? ", занято" : ""}" ${v === sel ? 'aria-pressed="true"' : ""}>${d}</button>`;
          }
          body = `<div class="dp-grid">${cells}</div>`;
        } else if (view.mode === "months") {
          body = `<div class="dp-list m">${MONTHS.map((n, i) => { const ym = `${view.y}-${pad(i + 1)}`; const off = (min && ym < min.slice(0, 7)) || (max && ym > max.slice(0, 7)); return `<button type="button" data-month="${i}" class="${i === view.m ? "sel" : ""}" ${off ? "disabled" : ""}>${n.slice(0, 3)}</button>`; }).join("")}</div>`;
        } else {
          let ys = ""; for (let y = maxY; y >= minY; y--) ys += `<button type="button" data-year="${y}" class="${y === view.y ? "sel" : ""}">${y}</button>`;
          body = `<div class="dp-list y">${ys}</div>`;
        }
        const foot = `<div class="dp-foot">${isBusy ? '<span class="dp-legend"><i></i>занято</span>' : "<span></span>"}<div>${input.required ? "" : '<button type="button" data-clear>Очистить</button>'}${(!min || todayIso() >= min) && (!max || todayIso() <= max) ? '<button type="button" data-today>Сегодня</button>' : ""}</div></div>`;
        pop.innerHTML = head + body + (view.mode === "days" ? foot : "");
        pop.setAttribute("role", "dialog"); pop.setAttribute("aria-label", "Выбор даты");
        const yearSel = pop.querySelector(".dp-list.y .sel"); if (yearSel) yearSel.scrollIntoView({ block: "center" });

        pop.querySelector("[data-mode]").onclick = () => { view.mode = view.mode === "days" ? "years" : view.mode === "years" ? "days" : "years"; api.refresh(); };
        pop.querySelectorAll("[data-step]").forEach((b) => b.onclick = () => { view.m += +b.dataset.step; if (view.m < 0) { view.m = 11; view.y--; } if (view.m > 11) { view.m = 0; view.y++; } api.refresh(); });
        pop.querySelectorAll("[data-year]").forEach((b) => b.onclick = () => { view.y = +b.dataset.year; view.mode = "months"; api.refresh(); });
        pop.querySelectorAll("[data-month]").forEach((b) => b.onclick = () => { view.m = +b.dataset.month; view.mode = "days"; api.refresh(); });
        const pick = (v) => { input.value = v; fire(input); closePop(true); };
        pop.querySelectorAll(".dp-day:not([disabled])").forEach((b) => b.onclick = () => pick(b.dataset.v));
        const c = pop.querySelector("[data-clear]"); if (c) c.onclick = () => pick("");
        const t = pop.querySelector("[data-today]"); if (t) t.onclick = () => pick(todayIso());
        const focusEl = pop.querySelector(".dp-day.sel") || pop.querySelector(".dp-day.today:not([disabled])") || pop.querySelector(".dp-day:not([disabled])");
        if (focusEl && view.mode === "days") setTimeout(() => focusEl.focus({ preventScroll: true }), 0);
        pop.onkeydown = (e) => { // стрелки по сетке дней
          if (!e.target.classList.contains("dp-day")) return;
          const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key]; if (!step) return;
          e.preventDefault(); const all = [...pop.querySelectorAll(".dp-day")]; let j = all.indexOf(e.target) + step;
          while (all[j] && all[j].disabled) j += Math.sign(step); if (all[j]) all[j].focus();
        };
      }, "rc-dp");
    });
  }

  /* ——— Выпадающий список ——— */
  function enhanceSelect(sel) {
    if (sel.dataset.rcUi || sel.multiple) return; sel.dataset.rcUi = "1";
    const btn = document.createElement("button"); btn.type = "button";
    btn.className = "input rc-field rc-select"; btn.setAttribute("aria-haspopup", "listbox"); btn.setAttribute("aria-expanded", "false");
    if (sel.style.cssText) btn.style.cssText = sel.style.cssText;
    const render = () => { const o = sel.options[sel.selectedIndex]; btn.innerHTML = `<span class="rc-val">${o ? RC.util.esc(o.text) : ""}</span>${ICON_DOWN}`; syncErr(sel, btn); };
    sel.classList.add("rc-native"); sel.tabIndex = -1; sel.setAttribute("aria-hidden", "true");
    sel.after(btn); relabel(sel, btn); render();
    sel.addEventListener("change", render);
    const choose = (i) => { if (sel.selectedIndex !== i) { sel.selectedIndex = i; fire(sel); } else render(); closePop(true); };
    const openList = () => openPop(btn, (pop) => {
      pop.setAttribute("role", "listbox");
      pop.innerHTML = [...sel.options].map((o, i) => `<button type="button" role="option" data-i="${i}" aria-selected="${i === sel.selectedIndex}" ${o.disabled ? "disabled" : ""}>${RC.util.esc(o.text)}</button>`).join("");
      pop.querySelectorAll("[data-i]").forEach((b) => b.onclick = () => choose(+b.dataset.i));
      const cur = pop.querySelector('[aria-selected="true"]') || pop.querySelector("[data-i]"); setTimeout(() => cur && cur.focus({ preventScroll: true }), 0);
      pop.onkeydown = (e) => {
        const items = [...pop.querySelectorAll("[data-i]:not([disabled])")]; const i = items.indexOf(document.activeElement);
        if (e.key === "ArrowDown") { e.preventDefault(); (items[i + 1] || items[0]).focus(); }
        if (e.key === "ArrowUp") { e.preventDefault(); (items[i - 1] || items[items.length - 1]).focus(); }
        if (e.key === "Tab") closePop();
      };
    }, "rc-list");
    btn.addEventListener("click", () => (open && open.anchor === btn ? closePop() : openList()));
    btn.addEventListener("keydown", (e) => { if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); openList(); } });
  }

  /* ——— Автоподключение ——— */
  function enhance(root) {
    root.querySelectorAll('input[type="date"]:not([data-rc-ui])').forEach(enhanceDate);
    root.querySelectorAll("select:not([data-rc-ui])").forEach(enhanceSelect);
  }
  RC.enhanceControls = enhance;
  const start = () => { enhance(document.body); new MutationObserver((ms) => { if (ms.some((m) => m.addedNodes.length)) enhance(document.body); }).observe(document.body, { childList: true, subtree: true }); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
