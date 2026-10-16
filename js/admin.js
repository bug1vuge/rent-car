/* Панель владельца: сводка, заявки, автопарк, календарь. */
(function () {
  const S = RC.store, U = RC.util, esc = U.esc, $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const PIN = "2002";
  let tab = "summary", reqFilter = "new";
  const authed = () => { try { return sessionStorage.getItem("rc_admin") === "1"; } catch (e) { return RC._admin === true; } };
  const setAuthed = () => { RC._admin = true; try { sessionStorage.setItem("rc_admin", "1"); } catch (e) {} };
  const carName = (c) => c ? c.brand + " " + c.model : "Удалённая машина";
  const isoT = () => U.iso(U.today());

  function gate() {
    return `<div class="pin-box"><form class="panel" id="pin-form">
      <h2>Вход для владельца</h2>
      <p class="muted small">В полной версии вход по номеру телефона и коду из Max. Для демо PIN: <b>2002</b></p>
      <div class="field"><label for="pin">PIN-код</label><input class="input pin-input" id="pin" inputmode="numeric" maxlength="4" autocomplete="off"></div>
      <span class="err-msg" id="pin-err" hidden>Неверный PIN. Для демо это 2002</span>
      <button class="btn btn-primary btn-block" type="submit">Войти</button></form></div>`;
  }

  function counts() { const c = {}; S.bookings.forEach((b) => { c[b.status] = (c[b.status] || 0) + 1; }); return c; }

  function view() {
    if (!authed()) return gate();
    const c = counts();
    const tabs = [["summary", "Сводка"], ["requests", "Заявки", c.new], ["calendar", "Календарь"], ["fleet", "Автопарк"]];
    return `<div class="admin-bar"><span>Панель владельца · демо</span><a href="#">Вернуться на сайт</a></div>
      <div><div class="admin-tabs" role="tablist">${tabs.map(([k, l, n]) => `<button role="tab" aria-selected="${tab === k}" data-tab="${k}">${l}${n ? `<span class="cnt">${n}</span>` : ""}</button>`).join("")}</div>
      <div id="admin-body">${body()}</div></div>`;
  }
  function body() { return { summary, requests, calendar, fleet }[tab](); }

  /* ——— Сводка ——— */
  function summary() {
    const t = U.today(), ti = isoT();
    const cars = S.cars.filter((c) => c.status !== "hidden");
    const c = counts();
    const freeNow = cars.filter((x) => S.liveStatus(x).key === "free").length;
    const monthAgo = U.iso(U.addDays(t, -30));
    const revenue = S.bookings.filter((b) => ["approved", "active", "done"].includes(b.status) && b.from >= monthAgo && b.from <= ti).reduce((s, b) => s + b.total, 0);
    const pipeline = S.bookings.filter((b) => ["new", "approved"].includes(b.status) && b.from > ti).reduce((s, b) => s + b.total, 0);
    const days = [...Array(14)].map((_, i) => U.addDays(t, i));
    const load = days.map((d) => { const s = U.iso(d), s1 = U.iso(U.addDays(d, 1)); const busy = cars.filter((car) => car.status === "service" || S.carBookings(car.id, S.BLOCKING).some((b) => U.overlap(s, s1, b.from, b.to))).length; return { d, pct: cars.length ? Math.round(busy / cars.length * 100) : 0, busy }; });
    const week = Math.round(load.slice(0, 7).reduce((s, x) => s + x.pct, 0) / 7);
    const outs = S.bookings.filter((b) => b.status === "approved" && b.from === ti);
    const ins = S.bookings.filter((b) => b.status === "active" && b.to === ti);
    const soon = S.bookings.filter((b) => b.status === "active" && b.to > ti).sort((a, b) => a.to.localeCompare(b.to)).slice(0, 3);
    return `<div class="kpis">
        <div class="kpi hot"><span class="k-v">${c.new || 0}</span><span class="k-l">${U.plural(c.new || 0, "новая заявка", "новые заявки", "новых заявок")}</span></div>
        <div class="kpi"><span class="k-v">${freeNow} / ${cars.length}</span><span class="k-l">машин свободно сейчас</span></div>
        <div class="kpi"><span class="k-v">${U.rub(revenue)}</span><span class="k-l">выручка за 30 дней</span></div>
        <div class="kpi"><span class="k-v">${week}%</span><span class="k-l">загрузка парка на неделю</span></div>
      </div>
      <div class="admin-cols">
        <div class="panel"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:baseline"><h3>Загрузка парка на 2 недели</h3><span class="small muted">Впереди по броням: ${U.rub(pipeline)}</span></div>
          <div class="load-chart" role="img" aria-label="Загрузка по дням">${load.map((x) => `<div class="load-col ${[0, 6].includes(x.d.getDay()) ? "wk" : ""}" title="${U.fmtDate(U.iso(x.d))}: занято ${x.busy} из ${cars.length}"><div class="load-track"><div class="load-bar" style="height:${x.pct}%"></div></div><span class="load-x">${x.d.getDate()}</span></div>`).join("")}</div>
          <p class="small muted">Доля машин в аренде или на ТО по дням. Тёмные столбцы — выходные.</p></div>
        <div class="panel"><h3>Сегодня</h3><div class="today-list">
          ${outs.map((b) => `<div class="today-item"><span class="tag tag-out">Выдача</span><span>${esc(carName(S.car(b.carId)))} · ${esc(b.client.name)}</span></div>`).join("")}
          ${ins.map((b) => `<div class="today-item"><span class="tag tag-in">Возврат</span><span>${esc(carName(S.car(b.carId)))} · ${esc(b.client.name)}</span></div>`).join("")}
          ${!outs.length && !ins.length ? '<p class="muted small">Выдач и возвратов сегодня нет.</p>' : ""}
          ${soon.length ? `<span class="small muted" style="margin-top:6px">Ближайшие возвраты</span>${soon.map((b) => `<div class="today-item"><span class="tag tag-in">${U.fmtDate(b.to, { day: "numeric", month: "short" })}</span><span>${esc(carName(S.car(b.carId)))} · ${esc(b.client.name)}</span></div>`).join("")}` : ""}
        </div>
        ${c.new ? `<button class="btn btn-primary" data-goto="requests">Разобрать новые заявки (${c.new})</button>` : ""}</div>
      </div>`;
  }

  /* ——— Заявки ——— */
  function requests() {
    const c = counts();
    const filters = [["new", "Новые"], ["approved", "Подтверждённые"], ["active", "В аренде"], ["done", "Завершённые"], ["rejected", "Отклонённые"], ["all", "Все"]];
    const list = S.bookings.filter((b) => reqFilter === "all" || b.status === reqFilter);
    return `<div class="chips" style="margin-bottom:16px">${filters.map(([k, l]) => `<button class="chip" data-rf="${k}" aria-pressed="${reqFilter === k}">${l}${k !== "all" && c[k] ? " · " + c[k] : ""}</button>`).join("")}</div>
      <div class="req-list">${list.length ? list.map(reqCard).join("") : '<div class="empty"><h3>Здесь пусто</h3><p class="muted">Новые заявки с сайта появляются в этой вкладке. Попробуй сам оформить бронь в каталоге.</p><a class="btn btn-primary" href="#catalog">Открыть каталог</a></div>'}</div>`;
  }
  function reqCard(b) {
    const car = S.car(b.carId); const cl = car ? RC.CLASSES[car.cls] : null;
    const age = U.yearsSince(b.client.birth), exp = U.yearsSince(b.client.licenseSince);
    const okAge = cl && age >= cl.minAge, okExp = cl && exp >= cl.minExp;
    const conflict = car && b.status === "new" && !S.isFree(car, b.from, b.to);
    const extras = (b.extras || []).map((id) => RC.EXTRAS.find((e) => e.id === id)?.label).filter(Boolean).join(", ");
    const docs = b.docs ? Object.entries(b.docs) : [];
    const docNames = { pass1: "Паспорт, фото", pass2: "Паспорт, прописка", lic1: "Права, лицо", lic2: "Права, оборот" };
    const actions = {
      new: `<button class="btn btn-go btn-sm" data-act="approved" data-id="${b.id}" ${conflict ? "disabled" : ""}>Подтвердить</button><button class="btn btn-stop btn-sm" data-act="rejected" data-id="${b.id}">Отклонить</button>`,
      approved: `<button class="btn btn-primary btn-sm" data-act="active" data-id="${b.id}">Машина выдана</button><button class="btn btn-stop btn-sm" data-act="rejected" data-id="${b.id}">Отменить</button>`,
      active: `<button class="btn btn-primary btn-sm" data-act="done" data-id="${b.id}">Машину вернули</button>`
    }[b.status] || "";
    return `<article class="req s-${b.status}">
      <div class="req-head"><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><h3 style="font-size:1.1rem">${esc(carName(car))}</h3>${RC.statusPill(b.status)}${b.mine ? '<span class="pill p-active">с сайта, только что</span>' : ""}</div><span class="muted small num">${esc(b.id)} · создана ${U.fmtDate(b.createdAt, { day: "numeric", month: "short" })}</span></div>
      <div class="req-grid">
        <div><span>Клиент</span>${esc(b.client.name)}</div>
        <div><span>Телефон</span><span style="color:var(--fg);font-size:.92rem" class="num">${esc(b.client.phone)}</span></div>
        <div><span>Даты</span>${U.fmtDate(b.from, { day: "numeric", month: "short" })} — ${U.fmtDate(b.to, { day: "numeric", month: "short" })}, ${U.days(b.from, b.to)} сут.</div>
        <div><span>Сумма</span><b class="num">${U.rub(b.total)}</b>${b.deposit ? ` <span style="display:inline;color:var(--mute)">+ залог ${U.rub(b.deposit)}</span>` : ""}</div>
        <div><span>Возраст / стаж</span><span style="display:inline;font-size:.92rem;color:${okAge ? "var(--go)" : "var(--stop)"}">${age} ${U.plural(age, "год", "года", "лет")}</span> / <span style="display:inline;font-size:.92rem;color:${okExp ? "var(--go)" : "var(--stop)"}">${exp} ${U.plural(exp, "год", "года", "лет")}</span></div>
        ${extras ? `<div><span>Опции</span>${esc(extras)}</div>` : ""}
      </div>
      ${conflict ? '<div class="notice warn">Эти даты уже заняты другой подтверждённой бронью. Предложи клиенту другую машину.</div>' : ""}
      ${docs.length ? `<div class="docs-thumbs">${docs.map(([k, v]) => `<button data-doc="${b.id}|${k}" aria-label="${docNames[k]}"><img src="${v}" alt=""></button>`).join("")}</div>` : (b.demo ? '<p class="small muted">Документы демо-клиента проверены ранее.</p>' : "")}
      <div class="req-actions">${actions}<button class="btn btn-ghost btn-sm" data-contract="${b.id}">Договор</button></div>
    </article>`;
  }

  /* ——— Календарь ——— */
  function calendar() {
    const t = U.today(), start = U.addDays(t, -3), N = 21;
    const days = [...Array(N)].map((_, i) => U.addDays(start, i));
    const cars = S.cars.filter((c) => c.status !== "hidden");
    const head = `<div class="g-row" style="min-height:36px"><div class="g-name muted">Машина</div>${days.map((d) => `<div class="g-cell ${[0, 6].includes(d.getDay()) ? "wk" : ""} ${U.iso(d) === isoT() ? "today" : ""}">${d.getDate()}<br><span style="font-size:.65rem">${d.toLocaleDateString("ru-RU", { weekday: "short" })}</span></div>`).join("")}</div>`;
    const colW = `((100% - 170px) / ${N})`;
    const rows = cars.map((car) => {
      const bars = S.carBookings(car.id, ["new", "approved", "active"]).map((b) => {
        const a = Math.max(0, U.days(U.iso(start), b.from)), z = Math.min(N, U.days(U.iso(start), b.to));
        if (z <= 0 || a >= N) return "";
        return `<button class="g-bar gb-${b.status}" data-contract="${b.id}" title="${esc(b.client.name)}, ${U.fmtDate(b.from)} — ${U.fmtDate(b.to)}" style="left:calc(170px + ${colW} * ${a} + 2px);width:calc(${colW} * ${z - a} - 4px)">${esc(b.client.name.split(" ")[0])}</button>`;
      }).join("");
      const svc = car.status === "service" ? `<div class="g-bar gb-service" style="left:calc(170px + ${colW} * 3 + 2px);right:4px">На ТО</div>` : "";
      return `<div class="g-row"><div class="g-name">${esc(carName(car))}<span class="plate">${esc(car.plate)}</span></div>${days.map((d) => `<div class="g-cell ${[0, 6].includes(d.getDay()) ? "wk" : ""} ${U.iso(d) === isoT() ? "today" : ""}"></div>`).join("")}${bars}${svc}</div>`;
    }).join("");
    return `<div class="legend" style="margin-bottom:12px"><span><i style="background:var(--warn)"></i>Новая заявка</span><span><i style="background:var(--go)"></i>Подтверждена</span><span><i style="background:var(--accent)"></i>В аренде</span><span><i style="background:var(--stroke-2)"></i>На ТО</span></div>
      <div class="gantt-wrap"><div class="gantt">${head}${rows}</div></div>`;
  }

  /* ——— Автопарк ——— */
  function fleet() {
    return `<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:14px"><p class="muted small" style="max-width:60ch">Статус и цена сразу меняются на сайте. Машина «На ТО» или «Скрыта» не показывается свободной.</p><button class="btn btn-primary btn-sm" data-addcar>Добавить машину</button></div>
      <div class="fleet" style="padding-bottom:56px">${S.cars.map((c) => `<div class="fleet-row">
        <div class="fimg">${RC.carVisual(c)}</div>
        <div style="min-width:0"><b>${esc(carName(c))}</b> <span class="muted small">${c.year}</span><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:4px"><span class="plate">${esc(c.plate)}</span><span class="small muted">${RC.CLASSES[c.cls].label} · ${esc(c.kpp)}</span></div><span class="small st-${S.liveStatus(c).key}" style="display:block;padding-top:4px;font-weight:600">${esc(c.status === "hidden" ? "Скрыта с сайта" : S.liveStatus(c).label)}</span></div>
        <div class="f-controls">
          <div class="field"><label for="st-${c.id}">Статус</label><select class="input" id="st-${c.id}" data-status="${c.id}"><option value="free" ${c.status === "free" ? "selected" : ""}>В работе</option><option value="service" ${c.status === "service" ? "selected" : ""}>На ТО</option><option value="hidden" ${c.status === "hidden" ? "selected" : ""}>Скрыта</option></select></div>
          <div class="field"><label for="pr-${c.id}">Цена 1–2 сут, ₽</label><input class="input num" id="pr-${c.id}" type="number" min="500" step="100" value="${c.prices[0]}" data-price="${c.id}"></div>
          <button class="btn btn-ghost btn-sm" data-del="${c.id}" aria-label="Удалить ${esc(carName(c))}" style="color:var(--stop)">Удалить</button>
        </div></div>`).join("")}</div>`;
  }
  function addCarForm() {
    return `<form id="addcar" style="display:grid;gap:12px" novalidate>
      <div class="row2"><div class="field"><label for="a-brand">Марка</label><input class="input" id="a-brand" required placeholder="Kia"></div><div class="field"><label for="a-model">Модель</label><input class="input" id="a-model" required placeholder="Rio"></div></div>
      <div class="row3"><div class="field"><label for="a-year">Год</label><input class="input" id="a-year" type="number" value="2024" min="2000" max="2027"></div>
        <div class="field"><label for="a-cls">Класс</label><select class="input" id="a-cls">${Object.entries(RC.CLASSES).map(([k, v]) => `<option value="${k}">${v.label}</option>`).join("")}</select></div>
        <div class="field"><label for="a-kpp">Коробка</label><select class="input" id="a-kpp"><option>АКПП</option><option>МКПП</option><option>Робот</option><option>Вариатор</option></select></div></div>
      <div class="row3"><div class="field"><label for="a-fuel">Топливо</label><select class="input" id="a-fuel"><option>Бензин</option><option>Газ + бензин</option><option>Дизель</option></select></div>
        <div class="field"><label for="a-plate">Госномер</label><input class="input" id="a-plate" placeholder="А 123 АА 70"></div>
        <div class="field"><label for="a-price">Цена 1–2 сут, ₽</label><input class="input" id="a-price" type="number" value="2500" step="100" min="500"></div></div>
      <label class="toggle"><input type="checkbox" id="a-taxi"> Можно под такси</label>
      <label class="upload" for="a-photo" style="aspect-ratio:16/7" id="a-photo-box"><input type="file" id="a-photo" accept="image/*"><span class="u-label">Фото машины<small>Можно прямо из сторис</small></span></label>
      <span class="err-msg" id="a-err" hidden>Укажи марку, модель и добавь фото</span>
      <button class="btn btn-primary" type="submit">Добавить в автопарк</button></form>`;
  }

  function bind() {
    const pf = $("#pin-form");
    if (pf) { $("#pin").focus(); pf.addEventListener("submit", (e) => { e.preventDefault(); if ($("#pin").value === PIN) { setAuthed(); RC.route(); } else { $("#pin-err").hidden = false; $("#pin").classList.add("err"); } }); return; }
    $$("[data-tab]").forEach((b) => b.addEventListener("click", () => { tab = b.dataset.tab; RC.route(); }));
    $$("[data-goto]").forEach((b) => b.addEventListener("click", () => { tab = b.dataset.goto; reqFilter = "new"; RC.route(); }));
    $$("[data-rf]").forEach((b) => b.addEventListener("click", () => { reqFilter = b.dataset.rf; RC.route(); }));
    $$("[data-act]").forEach((b) => b.addEventListener("click", () => {
      const msg = { approved: "Бронь подтверждена. Клиенту уйдёт уведомление", rejected: "Заявка отклонена", active: "Отмечено: машина выдана", done: "Машина вернулась в парк" }[b.dataset.act];
      S.setStatus(b.dataset.id, b.dataset.act); RC.toast(msg); RC.route();
    }));
    $$("[data-contract]").forEach((b) => b.addEventListener("click", () => RC.openContract(b.dataset.contract)));
    $$("[data-doc]").forEach((b) => b.addEventListener("click", () => { const [id, k] = b.dataset.doc.split("|"); RC.modal("Документ клиента", `<img class="doc-big" src="${S.booking(id).docs[k]}" alt="Фото документа">`); }));
    $$("[data-status]").forEach((s) => s.addEventListener("change", () => { S.updateCar(s.dataset.status, { status: s.value }); RC.toast("Статус обновлён на сайте"); RC.route(); }));
    $$("[data-price]").forEach((i) => i.addEventListener("change", () => {
      const c = S.car(i.dataset.price), p = Math.max(500, Math.round(+i.value / 100) * 100); const k = p / c.prices[0];
      S.updateCar(c.id, { prices: c.prices.map((x, idx) => idx === 0 ? p : Math.round(x * k / 100) * 100) }); RC.toast("Цена обновлена, скидки за срок пересчитаны"); RC.route();
    }));
    const del = (id) => { const c = S.car(id); const m = RC.modal("Удалить машину?", `<p class="muted">${esc(carName(c))}, ${esc(c.plate)} пропадёт с сайта. Брони по ней останутся в истории.</p><div style="display:flex;gap:8px;margin-top:14px"><button class="btn btn-stop" data-yes>Удалить</button><button class="btn btn-ghost" data-no>Оставить</button></div>`);
      $("[data-yes]", m.el).addEventListener("click", () => { S.removeCar(id); m.close(); RC.toast("Машина удалена"); RC.route(); }); $("[data-no]", m.el).addEventListener("click", m.close); };
    $$("[data-del]").forEach((b) => b.addEventListener("click", () => del(b.dataset.del)));
    const add = $("[data-addcar]");
    if (add) add.addEventListener("click", () => {
      const m = RC.modal("Новая машина", addCarForm()); let photo = null;
      $("#a-photo", m.el).addEventListener("change", async (e) => { try { photo = await RC.compressImage(e.target.files[0], 900); const box = $("#a-photo-box", m.el); box.classList.add("has"); box.insertAdjacentHTML("afterbegin", `<img src="${photo}" alt="">`); } catch (ex) { RC.toast(ex.message); } });
      $("#addcar", m.el).addEventListener("submit", (e) => {
        e.preventDefault(); const v = (id) => $("#" + id, m.el).value.trim();
        if (!v("a-brand") || !v("a-model") || !photo) { $("#a-err", m.el).hidden = false; return; }
        const p = Math.max(500, +v("a-price") || 2500); const r = (x) => Math.round(x / 100) * 100;
        S.addCar({ id: (v("a-brand") + "-" + Date.now()).toLowerCase().replace(/[^a-z0-9-]/g, ""), brand: v("a-brand"), model: v("a-model"), year: +v("a-year") || 2024, cls: v("a-cls"), img: photo,
          kpp: v("a-kpp"), fuel: v("a-fuel"), engine: "—", cons: "—", seats: 5, color: "—", plate: v("a-plate") || "без номера", taxi: $("#a-taxi", m.el).checked, status: "free",
          prices: [p, r(p * 0.93), r(p * 0.85), r(p * 0.77)], features: ["Зимняя резина", "ОСАГО"] });
        m.close(); RC.toast("Машина добавлена и уже видна в каталоге"); RC.route();
      });
    });
  }

  RC.admin = { view, bind };
})();
