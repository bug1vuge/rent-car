/* Клиентская часть: роутер, каталог, карточка машины, бронирование, условия, контакты, кабинет. */
(function () {
  const S = PM.store, U = PM.util, B = PM.BIZ, $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const app = $("#app");
  const esc = U.esc;
  const todayIso = () => U.iso(U.today());

  /* ——— Общие элементы ——— */
  PM.toast = function (msg) {
    const t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); t.textContent = msg;
    document.body.appendChild(t); setTimeout(() => t.remove(), 3200);
  };
  PM.modal = function (title, html, cls) {
    const m = document.createElement("div"); m.className = "modal " + (cls || "");
    m.innerHTML = `<div class="modal-card" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="modal-head"><h3>${esc(title)}</h3><button class="x" aria-label="Закрыть">×</button></div><div class="modal-body">${html}</div></div>`;
    const close = () => { m.remove(); document.removeEventListener("keydown", onKey); };
    const onKey = (e) => { if (e.key === "Escape") close(); };
    m.addEventListener("click", (e) => { if (e.target === m || e.target.closest(".x")) close(); });
    document.addEventListener("keydown", onKey);
    document.body.appendChild(m); $(".x", m).focus();
    return { el: m, close };
  };
  PM.copy = function (text, btn) {
    const done = () => { PM.toast("Скопировано: " + text); };
    try { navigator.clipboard.writeText(text).then(done, () => fallback()); } catch (e) { fallback(); }
    function fallback() { const r = document.createRange(); const span = btn && btn.parentElement.querySelector("[data-copy-src]"); if (span) { r.selectNodeContents(span); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); PM.toast("Выделено — скопируйте вручную"); } }
  };
  PM.statusPill = function (s) {
    const map = { new: "Новая заявка", approved: "Подтверждена", active: "В аренде", done: "Завершена", rejected: "Отклонена" };
    return `<span class="pill p-${s}">${map[s] || s}</span>`;
  };
  const clsLabel = (c) => PM.CLASSES[c].label;

  /* Договор: один генератор для превью, кабинета и панели владельца */
  PM.contractHTML = function (b, car) {
    const q = S.quote(car, b.from, b.to, b.extras);
    const c = b.client || {};
    const extras = (b.extras || []).map((id) => PM.EXTRAS.find((e) => e.id === id)?.label).filter(Boolean).join(", ") || "нет";
    const no = b.id || "PM-____";
    const sig = b.signature ? `<img src="${b.signature}" alt="Подпись арендатора">` : "_______________";
    return `<div class="contract">
      <div class="demo-stamp">ДЕМО-ОБРАЗЕЦ · не является договором</div>
      <h4>Договор аренды транспортного средства без экипажа № ${esc(no)}</h4>
      <div class="c-sub">г. Томск, ${U.fmtDate(b.createdAt || todayIso(), { day: "numeric", month: "long", year: "numeric" })}</div>
      <p><b>Арендодатель:</b> ${esc(B.lessor)}, и <b>Арендатор:</b> ${esc(c.name || "________________")}, дата рождения ${c.birth ? U.fmtDate(c.birth, { day: "2-digit", month: "2-digit", year: "numeric" }) : "__.__.____"}, водительское удостоверение № ${esc(c.license || "__ __ ______")}, заключили настоящий договор о нижеследующем.</p>
      <h5>1. Предмет договора</h5>
      <p>1.1. Арендодатель передаёт во временное владение и пользование автомобиль ${esc(car.brand + " " + car.model)}, ${car.year} г. в., цвет ${esc(car.color.toLowerCase())}, гос. номер ${esc(car.plate)}, КПП: ${esc(car.kpp)}, топливо: ${esc(car.fuel.toLowerCase())}.</p>
      <p>1.2. Автомобиль передаётся технически исправным, с полным баком, комплектом зимней резины и полисом ОСАГО${car.cls === "premium" ? " и КАСКО" : ""}.</p>
      <h5>2. Срок аренды</h5>
      <p>2.1. С ${U.fmtDate(b.from, { day: "numeric", month: "long", year: "numeric" })} по ${U.fmtDate(b.to, { day: "numeric", month: "long", year: "numeric" })} (${q.days} ${U.plural(q.days, "сутки", "суток", "суток")}). Место передачи и возврата: г. Томск, ${esc(B.address)}${(b.extras || []).includes("delivery") ? " либо адрес подачи, согласованный с Арендатором" : ""}.</p>
      <h5>3. Арендная плата и залог</h5>
      <p>3.1. Стоимость аренды — ${U.rub(q.perDay)} в сутки, итого ${U.rub(q.total)} с учётом дополнительных услуг: ${esc(extras)}.</p>
      <p>3.2. Залог — ${q.deposit ? U.rub(q.deposit) : "не взимается (тариф «Без залога»)"}. Залог возвращается после осмотра автомобиля при отсутствии повреждений, а при наличии неоплаченных штрафов — в течение 10 дней.</p>
      <p>3.3. Лимит пробега — ${(b.extras || []).includes("unlim") ? "не установлен" : PM.CLASSES[car.cls].mileage + " км в сутки, превышение — 5 ₽ за км"}.</p>
      <h5>4. Обязанности Арендатора</h5>
      <p>4.1. Не передавать управление третьим лицам, не курить в салоне (штраф 5 000 ₽), не использовать автомобиль в соревнованиях и для буксировки.</p>
      <p>4.2. Вернуть автомобиль в срок, в чистом виде и с полным баком. Опоздание более 2 часов оплачивается как полные сутки.</p>
      <p>4.3. Самостоятельно оплачивать штрафы ГИБДД, полученные в период аренды, и парковку.</p>
      <h5>5. Ответственность</h5>
      <p>5.1. При повреждении автомобиля по вине Арендатора он возмещает ущерб в размере, не покрытом страховкой${car.cls === "premium" ? ", включая франшизу по КАСКО 30 000 ₽" : ""}.</p>
      <h5>6. Подписи сторон</h5>
      <table><tr><td>Арендодатель<br><br>_______________</td><td class="sig">Арендатор<br>${sig}<br>${esc(c.name || "")}</td></tr></table>
    </div>`;
  };

  PM.compressImage = function (file, max = 1000) {
    return new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith("image/")) return reject(new Error("Нужна фотография: JPG, PNG или HEIC, сохранённый как фото"));
      const fr = new FileReader();
      fr.onload = () => {
        const img = new Image();
        img.onload = () => {
          const k = Math.min(1, max / Math.max(img.width, img.height));
          const cv = document.createElement("canvas"); cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
          cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
          resolve(cv.toDataURL("image/jpeg", 0.72));
        };
        img.onerror = () => reject(new Error("Не получилось открыть фото, попробуйте другое"));
        img.src = fr.result;
      };
      fr.onerror = () => reject(new Error("Не получилось прочитать файл"));
      fr.readAsDataURL(file);
    });
  };

  /* ——— Фильтры каталога ——— */
  const maxPrice = () => Math.max(...S.cars.map((c) => c.prices[0]));
  let F = { cls: [], kpp: "any", fuel: "any", taxi: false, price: Infinity, from: "", to: "", onlyFree: true, sort: "price" };
  try { const saved = JSON.parse(sessionStorage.getItem("pm_filters") || "null"); if (saved) F = Object.assign(F, saved, { price: saved.price || Infinity }); } catch (e) {}
  const saveF = () => { try { sessionStorage.setItem("pm_filters", JSON.stringify(F)); } catch (e) {} };
  const datesSet = () => F.from && F.to && F.to > F.from;

  function carStatus(car) {
    if (datesSet()) {
      if (car.status === "service") return { key: "service", label: "На ТО" };
      return S.isFree(car, F.from, F.to) ? { key: "free", label: "Свободна на ваши даты" } : { key: "busy", label: "Занята на эти даты" };
    }
    return S.liveStatus(car);
  }
  function carCard(car) {
    const st = carStatus(car);
    return `<a class="car" href="#car-${car.id}">
      <div class="car-img"><img src="${car.img}" alt="${esc(car.brand + " " + car.model)}" loading="lazy" width="545" height="192"><span class="status st-${st.key}">${esc(st.label)}</span></div>
      <div class="car-body">
        <div class="car-title"><h3>${esc(car.brand)} ${esc(car.model)}</h3><span class="year">${car.year}</span></div>
        <div class="specs"><span class="spec">${clsLabel(car.cls)}</span><span class="spec">${esc(car.kpp)}</span>${car.fuel !== "Бензин" ? `<span class="spec gold">${esc(car.fuel)}</span>` : `<span class="spec">${esc(car.fuel)}</span>`}${car.taxi ? '<span class="spec">Под такси</span>' : ""}</div>
        <div class="car-foot"><div class="price"><small>от</small><b>${car.prices[3].toLocaleString("ru-RU")} ₽</b><br><span>до ${car.prices[0].toLocaleString("ru-RU")} ₽ за сутки</span></div><span class="btn btn-gold btn-sm">Выбрать</span></div>
      </div></a>`;
  }
  function filtered() {
    let list = S.visibleCars().filter((c) =>
      (!F.cls.length || F.cls.includes(c.cls)) &&
      (F.kpp === "any" || (F.kpp === "mt" ? c.kpp === "МКПП" : c.kpp !== "МКПП")) &&
      (F.fuel === "any" || (F.fuel === "gas" ? c.fuel !== "Бензин" : c.fuel === "Бензин")) &&
      (!F.taxi || c.taxi) && c.prices[0] <= F.price &&
      (!datesSet() || !F.onlyFree || S.isFree(c, F.from, F.to)));
    const sorters = { price: (a, b) => a.prices[0] - b.prices[0], "price-desc": (a, b) => b.prices[0] - a.prices[0], year: (a, b) => b.year - a.year };
    return list.sort(sorters[F.sort]);
  }

  /* ——— Иконки ——— */
  const I = {
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>',
    car: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 16l1.5-5.5A2 2 0 0 1 8.4 9h7.2a2 2 0 0 1 1.9 1.5L19 16M4 16h16v3H4zM7 19v2M17 19v2"/><circle cx="7.5" cy="16" r=".5"/><circle cx="16.5" cy="16" r=".5"/></svg>',
    doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>'
  };
  $("#tabbar").innerHTML = [["", "Главная", I.home], ["catalog", "Машины", I.car], ["terms", "Условия", I.doc], ["contacts", "Контакты", I.pin], ["cabinet", "Брони", I.user]]
    .map(([h, l, i]) => `<a href="#${h}" data-route="${h || "home"}">${i}<span>${l}</span></a>`).join("");

  /* ——— Главная ——— */
  function viewHome() {
    const cars = S.visibleCars();
    const freeNow = cars.filter((c) => S.liveStatus(c).key === "free").length;
    const minPrice = Math.min(...cars.map((c) => c.prices[3]));
    const tomorrow = U.iso(U.addDays(U.today(), 1)), after = U.iso(U.addDays(U.today(), 3));
    const featured = ["changan-1", "bora-1", "hongqi-1", "granta-1"].map(S.car).filter(Boolean);
    return `
    <section class="hero"><div class="wrap">
      <div class="hero-grid">
        <div>
          <h1><span>Тачка</span><span class="l2">за 15 минут</span></h1>
          <p class="lead">Выбираешь свободную машину, загружаешь права и подписываешь договор с телефона. Приезжаешь на Пушкина, 61а и забираешь ключи. Без переписки в директе.</p>
          <form class="quick" id="quick">
            <div class="field"><label for="q-from">Забрать</label><input class="input" type="date" id="q-from" value="${F.from || tomorrow}" min="${todayIso()}"></div>
            <div class="field"><label for="q-to">Вернуть</label><input class="input" type="date" id="q-to" value="${F.to || after}" min="${tomorrow}"></div>
            <div class="field"><label for="q-cls">Класс</label><select class="input" id="q-cls"><option value="">Любой</option>${Object.entries(PM.CLASSES).map(([k, v]) => `<option value="${k}">${v.label}</option>`).join("")}</select></div>
            <button class="btn btn-gold" type="submit">Найти свободные</button>
          </form>
        </div>
        <div class="hero-photo">
          <div class="frame"><img src="img/premium.webp" alt="Три чёрных седана Hongqi H5 у Мерседес-центра" width="545" height="192" fetchpriority="high"></div>
          <div class="stripe"></div>
          <div class="price-tag">от <b class="num">${minPrice.toLocaleString("ru-RU")} ₽</b> в сутки</div>
        </div>
      </div>
      <div class="live">
        <span class="live-dot" aria-hidden="true"></span>
        <span>Свободно сейчас: <b>${freeNow} из ${cars.length}</b> машин</span>
        <span class="muted">Обновляется автоматически, когда машину забирают или возвращают</span>
      </div>
    </div></section>

    <section class="section"><div class="wrap">
      <div class="section-head"><h2>В наличии</h2><a class="btn btn-ghost btn-sm" href="#catalog">Весь автопарк</a></div>
      <div class="grid-cars">${featured.map(carCard).join("")}</div>
    </div></section>

    <section class="section"><div class="wrap">
      <div class="section-head"><h2>Как взять машину</h2></div>
      <div class="steps">
        <div class="step"><h3>Выбери машину и даты</h3><p>В каталоге видно, какие машины свободны на твои даты, и сразу считается цена.</p></div>
        <div class="step"><h3>Загрузи документы</h3><p>Фото паспорта и прав прямо с телефона. Проверяем за 15 минут.</p></div>
        <div class="step"><h3>Подпиши договор</h3><p>Договор собирается автоматически, подпись пальцем на экране.</p></div>
        <div class="step"><h3>Забери ключи</h3><p>Пушкина, 61а, у Мерседес-центра. Полный бак, зимняя резина, ОСАГО.</p></div>
      </div>
    </div></section>

    <section class="section"><div class="wrap">
      <div class="taxi">
        <div>
          <h2>Работаешь в такси?</h2>
          <p class="lead" style="margin-top:12px">Granta, Bora и Changan можно брать под работу от 7 суток. Чем дольше срок, тем ниже цена за сутки.</p>
          <ul>
            <li>Bora на газу: километр в 2–3 раза дешевле бензина</li>
            <li>От 14 суток — Granta за ${S.car("granta-2") ? S.car("granta-2").prices[3].toLocaleString("ru-RU") : "1 500"} ₽ в сутки</li>
            <li>ТО и шиномонтаж за наш счёт</li>
          </ul>
        </div>
        <div style="display:grid;gap:10px"><button class="btn btn-gold" data-taxi>Показать машины под такси</button><a class="btn btn-ghost" href="#terms">Тарифы и условия</a></div>
      </div>
    </div></section>`;
  }
  function bindHome() {
    $("#quick").addEventListener("submit", (e) => {
      e.preventDefault();
      F.from = $("#q-from").value; F.to = $("#q-to").value; F.cls = $("#q-cls").value ? [$("#q-cls").value] : [];
      if (F.to <= F.from) { PM.toast("Дата возврата должна быть позже даты получения"); return; }
      saveF(); location.hash = "catalog";
    });
    $("[data-taxi]").addEventListener("click", () => { F.taxi = true; F.cls = []; saveF(); location.hash = "catalog"; });
  }

  /* ——— Каталог ——— */
  function viewCatalog() {
    const mp = maxPrice(); const price = Math.min(F.price, mp);
    const chip = (group, val, label, on) => `<button class="chip" type="button" data-${group}="${val}" aria-pressed="${on}">${label}</button>`;
    return `
    <div class="wrap page-head"><h1 style="font-size:clamp(2rem,5vw,3.4rem)">Автопарк</h1><p class="lead">Все машины с полным баком, зимней резиной и ОСАГО. Укажи даты, и останутся только свободные.</p></div>
    <div class="wrap catalog">
      <div>
        <button class="btn btn-ghost btn-block filters-toggle" id="ftoggle" aria-expanded="false" aria-controls="filters">Фильтры и даты</button>
        <aside class="filters collapsed" id="filters">
          <div class="row2">
            <div class="field"><label for="f-from">Забрать</label><input class="input" type="date" id="f-from" value="${F.from}" min="${todayIso()}"></div>
            <div class="field"><label for="f-to">Вернуть</label><input class="input" type="date" id="f-to" value="${F.to}" min="${todayIso()}"></div>
          </div>
          <label class="toggle"><input type="checkbox" id="f-free" ${F.onlyFree ? "checked" : ""}> Только свободные на эти даты</label>
          <div class="fgroup"><span class="flabel">Класс</span><div class="chips">${Object.entries(PM.CLASSES).map(([k, v]) => chip("cls", k, v.label, F.cls.includes(k))).join("")}</div></div>
          <div class="fgroup"><span class="flabel">Коробка</span><div class="chips">${chip("kpp", "any", "Любая", F.kpp === "any")}${chip("kpp", "mt", "Механика", F.kpp === "mt")}${chip("kpp", "at", "Автомат", F.kpp === "at")}</div></div>
          <div class="fgroup"><span class="flabel">Топливо</span><div class="chips">${chip("fuel", "any", "Любое", F.fuel === "any")}${chip("fuel", "petrol", "Бензин", F.fuel === "petrol")}${chip("fuel", "gas", "Газ + бензин", F.fuel === "gas")}</div></div>
          <div class="fgroup"><label class="flabel" for="f-price">Цена за сутки</label><input type="range" id="f-price" min="1500" max="${mp}" step="100" value="${price}"><div class="range-row"><span class="muted">до</span><b class="num" id="f-price-v">${price.toLocaleString("ru-RU")} ₽</b></div></div>
          <label class="toggle"><input type="checkbox" id="f-taxi" ${F.taxi ? "checked" : ""}> Можно под такси</label>
          <button class="btn btn-ghost btn-sm" type="button" id="f-reset">Сбросить фильтры</button>
        </aside>
      </div>
      <div style="min-width:0">
        <div class="results-bar"><span id="count" class="muted"></span>
          <label class="field" style="grid-auto-flow:column;align-items:center;gap:8px"><span class="small muted">Сортировка</span>
            <select class="input" id="f-sort" style="min-height:38px;padding:6px 10px"><option value="price">Сначала дешевле</option><option value="price-desc">Сначала дороже</option><option value="year">Сначала новее</option></select></label>
        </div>
        <div id="results"></div>
      </div>
    </div>`;
  }
  function renderResults() {
    const list = filtered();
    $("#count").textContent = list.length ? `Найдено ${list.length} ${U.plural(list.length, "машина", "машины", "машин")}${datesSet() ? " · " + U.fmtDate(F.from, { day: "numeric", month: "short" }) + " – " + U.fmtDate(F.to, { day: "numeric", month: "short" }) : ""}` : "";
    $("#results").innerHTML = list.length ? `<div class="grid-cars">${list.map(carCard).join("")}</div>` :
      `<div class="empty"><h3>На эти условия свободных машин нет</h3><p class="muted">Сдвинь даты на день-два или убери часть фильтров. Можно позвонить: ${B.phoneShort} — подскажем, что освободится.</p><button class="btn btn-gold" id="empty-reset">Сбросить фильтры</button></div>`;
    const er = $("#empty-reset"); if (er) er.addEventListener("click", resetFilters);
  }
  function resetFilters() { F = { cls: [], kpp: "any", fuel: "any", taxi: false, price: Infinity, from: "", to: "", onlyFree: true, sort: F.sort }; saveF(); route(); }
  function bindCatalog() {
    $("#f-sort").value = F.sort;
    const upd = () => { saveF(); renderResults(); };
    $("#ftoggle").addEventListener("click", (e) => { const f = $("#filters"); const open = f.classList.toggle("collapsed"); e.currentTarget.setAttribute("aria-expanded", String(!open)); });
    $$("[data-cls]").forEach((b) => b.addEventListener("click", () => { const v = b.dataset.cls; F.cls = F.cls.includes(v) ? F.cls.filter((x) => x !== v) : [...F.cls, v]; b.setAttribute("aria-pressed", String(F.cls.includes(v))); upd(); }));
    ["kpp", "fuel"].forEach((g) => $$(`[data-${g}]`).forEach((b) => b.addEventListener("click", () => { F[g] = b.dataset[g]; $$(`[data-${g}]`).forEach((x) => x.setAttribute("aria-pressed", String(x === b))); upd(); })));
    $("#f-price").addEventListener("input", (e) => { F.price = +e.target.value; $("#f-price-v").textContent = F.price.toLocaleString("ru-RU") + " ₽"; upd(); });
    $("#f-taxi").addEventListener("change", (e) => { F.taxi = e.target.checked; upd(); });
    $("#f-free").addEventListener("change", (e) => { F.onlyFree = e.target.checked; upd(); });
    $("#f-sort").addEventListener("change", (e) => { F.sort = e.target.value; upd(); });
    const dates = () => { F.from = $("#f-from").value; F.to = $("#f-to").value; if (F.from) $("#f-to").min = U.iso(U.addDays(U.parse(F.from), 1)); upd(); };
    $("#f-from").addEventListener("change", dates); $("#f-to").addEventListener("change", dates);
    $("#f-reset").addEventListener("click", resetFilters);
    renderResults();
  }

  /* ——— Карточка машины ——— */
  function calendarHTML(car, weeks = 4) {
    const t = U.today(); const start = U.addDays(t, -((t.getDay() + 6) % 7));
    const busy = S.carBookings(car.id, S.BLOCKING);
    let h = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((d) => `<div class="cal-dow">${d}</div>`).join("");
    for (let i = 0; i < weeks * 7; i++) {
      const d = U.addDays(start, i), s = U.iso(d), s1 = U.iso(U.addDays(d, 1));
      const past = d < t;
      const isBusy = car.status === "service" || busy.some((b) => U.overlap(s, s1, b.from, b.to));
      h += `<div class="cal-day ${isBusy ? "busy" : ""} ${s === todayIso() ? "today" : ""}" style="${past ? "opacity:.3" : ""}" title="${U.fmtDate(s)}${isBusy ? " — занята" : " — свободна"}">${d.getDate()}</div>`;
    }
    return `<div class="calendar">${h}</div><div class="legend"><span><i style="background:color-mix(in srgb,var(--go) 30%,var(--panel))"></i>Свободна</span><span><i style="background:color-mix(in srgb,var(--stop) 40%,var(--panel))"></i>Занята</span></div>`;
  }
  function viewCar(id) {
    const car = S.car(id); if (!car) return notFound();
    const cl = PM.CLASSES[car.cls];
    const from = F.from || U.iso(U.addDays(U.today(), 1)), to = F.to && F.to > from ? F.to : U.iso(U.addDays(U.parse(from), 3));
    return `
    <div class="wrap crumbs"><a href="#catalog">Автопарк</a> / ${esc(car.brand)} ${esc(car.model)}</div>
    <div class="wrap car-page">
      <div style="min-width:0">
        <div class="car-hero-img"><img src="${car.img}" alt="${esc(car.brand + " " + car.model)}" width="545" height="192"></div>
        <div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px;align-items:end;margin-top:22px">
          <h1 style="font-size:clamp(2rem,5vw,3.2rem)">${esc(car.brand)} ${esc(car.model)}</h1>
          <span class="status st-${S.liveStatus(car).key}" style="position:static">${esc(S.liveStatus(car).label)}</span>
        </div>
        <dl class="spec-table">
          <div><dt>Год</dt><dd>${car.year}</dd></div><div><dt>Класс</dt><dd>${cl.label}</dd></div>
          <div><dt>Коробка</dt><dd>${esc(car.kpp)}</dd></div><div><dt>Двигатель</dt><dd>${esc(car.engine)}</dd></div>
          <div><dt>Топливо</dt><dd>${esc(car.fuel)}</dd></div><div><dt>Расход</dt><dd>${esc(car.cons)}</dd></div>
          <div><dt>Мест</dt><dd>${car.seats}</dd></div><div><dt>Цвет</dt><dd>${esc(car.color)}</dd></div>
        </dl>
        <h3 style="margin-top:28px">Что есть в машине</h3>
        <ul class="feat">${car.features.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>
        <h3 style="margin-top:28px">Требования к водителю</h3>
        <p class="muted" style="margin-top:8px">Возраст от ${cl.minAge} лет, стаж от ${cl.minExp} ${U.plural(cl.minExp, "года", "лет", "лет")}. Залог ${U.rub(cl.deposit)}, возвращается после осмотра. Лимит ${cl.mileage} км в сутки.</p>
        <h3 style="margin-top:28px">Занятость на 4 недели</h3>
        <div style="max-width:420px;margin-top:12px;display:grid;gap:10px">${calendarHTML(car)}</div>
      </div>
      <aside class="side-card">
        <div class="row2">
          <div class="field"><label for="c-from">Забрать</label><input class="input" type="date" id="c-from" value="${from}" min="${todayIso()}"></div>
          <div class="field"><label for="c-to">Вернуть</label><input class="input" type="date" id="c-to" value="${to}" min="${todayIso()}"></div>
        </div>
        <table class="tariffs" id="c-tariffs">${PM.TIERS.map((t, i) => `<tr data-tier="${i}"><td>${t.label}</td><td>${car.prices[i].toLocaleString("ru-RU")} ₽ / сутки</td></tr>`).join("")}</table>
        <div id="c-quote"></div>
        <button class="btn btn-gold btn-block" id="c-book">Забронировать</button>
        <p class="small muted">Бронь бесплатная. Оплата и залог — при получении машины.</p>
      </aside>
    </div>`;
  }
  function bindCar(id) {
    const car = S.car(id); if (!car) return;
    const upd = () => {
      const from = $("#c-from").value, to = $("#c-to").value; const btn = $("#c-book");
      if (from) $("#c-to").min = U.iso(U.addDays(U.parse(from), 1));
      $$("#c-tariffs tr").forEach((r) => r.classList.remove("on"));
      if (!from || !to || to <= from) { $("#c-quote").innerHTML = `<div class="notice warn">Дата возврата должна быть позже даты получения.</div>`; btn.disabled = true; return; }
      const q = S.quote(car, from, to, []); const free = S.isFree(car, from, to);
      $(`#c-tariffs tr[data-tier="${q.tier}"]`).classList.add("on");
      $("#c-quote").innerHTML = `<div class="summary"><div class="line"><span>${q.days} ${U.plural(q.days, "сутки", "суток", "суток")} по ${U.rub(q.perDay)}</span><span>${U.rub(q.base)}</span></div><div class="line"><span>Залог, вернём</span><span>${U.rub(q.deposit)}</span></div><div class="line total"><span>Аренда</span><b>${U.rub(q.base)}</b></div></div>` +
        (free ? "" : `<div class="notice warn" style="margin-top:12px">На эти даты машина занята. Посмотри календарь или выбери другую в <a href="#catalog">каталоге</a>.</div>`);
      btn.disabled = !free;
    };
    $("#c-from").addEventListener("change", upd); $("#c-to").addEventListener("change", upd);
    $("#c-book").addEventListener("click", () => { F.from = $("#c-from").value; F.to = $("#c-to").value; saveF(); W = newWizard(id); location.hash = "book-" + id; });
    upd();
  }

  /* ——— Бронирование ——— */
  let W = null;
  function newWizard(carId) {
    let draft = {}; try { draft = JSON.parse(localStorage.getItem("pm_client") || "{}"); } catch (e) {}
    return { carId, step: 0, from: F.from, to: F.to, extras: [], client: Object.assign({ name: "", phone: "", birth: "", license: "", licenseSince: "", email: "" }, draft), docs: {}, signature: null, agree: false, agreePd: false, errors: {} };
  }
  const DOCS = [["pass1", "Паспорт", "Разворот с фото"], ["pass2", "Паспорт", "Страница с пропиской"], ["lic1", "Права", "Лицевая сторона"], ["lic2", "Права", "Обратная сторона"]];
  const STEPS = ["Даты и опции", "Данные", "Документы", "Договор"];

  function viewBook(id) {
    const car = S.car(id); if (!car) return notFound();
    if (!W || W.carId !== id) W = newWizard(id);
    if (!W.from || !W.to || W.to <= W.from) { W.from = U.iso(U.addDays(U.today(), 1)); W.to = U.iso(U.addDays(U.today(), 4)); }
    return `
    <div class="wrap crumbs"><a href="#catalog">Автопарк</a> / <a href="#car-${car.id}">${esc(car.brand)} ${esc(car.model)}</a> / Бронирование</div>
    <div class="wrap wizard">
      <div style="min-width:0">
        <ol class="progress">${STEPS.map((s, i) => `<li class="${i < W.step ? "done" : i === W.step ? "cur" : ""}">${i + 1}. ${s}</li>`).join("")}</ol>
        <form class="panel" id="wiz" novalidate>${stepHTML(car)}</form>
      </div>
      <aside class="side-card" id="wiz-side">${sideHTML(car)}</aside>
    </div>`;
  }
  function sideHTML(car) {
    const q = S.quote(car, W.from, W.to, W.extras);
    return `<div style="display:grid;grid-template-columns:110px 1fr;gap:12px;align-items:center"><img src="${car.img}" alt="" style="border-radius:6px;aspect-ratio:16/9;object-fit:cover"><div><b>${esc(car.brand)} ${esc(car.model)}</b><div class="small muted">${car.year} · ${esc(car.kpp)} · ${clsLabel(car.cls)}</div></div></div>
      <div class="small muted">${U.fmtDate(W.from, { day: "numeric", month: "long" })} — ${U.fmtDate(W.to, { day: "numeric", month: "long" })}</div>
      <div class="summary">${q.lines.map((l) => `<div class="line"><span>${esc(l.label)}</span><span>${U.rub(l.sum)}</span></div>`).join("")}
        <div class="line"><span>Залог, вернём</span><span>${q.deposit ? U.rub(q.deposit) : "без залога"}</span></div>
        <div class="line total"><span>Итого за аренду</span><b>${U.rub(q.total)}</b></div></div>`;
  }
  function err(k) { return W.errors[k] ? `<span class="err-msg">${esc(W.errors[k])}</span>` : ""; }
  function stepHTML(car) {
    const cl = PM.CLASSES[car.cls], c = W.client;
    const nav = (next) => `<div class="wiz-nav">${W.step > 0 ? '<button type="button" class="btn btn-ghost" data-back>Назад</button>' : `<a class="btn btn-ghost" href="#car-${car.id}">К машине</a>`}<button type="submit" class="btn btn-gold">${next}</button></div>`;
    if (W.step === 0) {
      const free = W.to > W.from && S.isFree(car, W.from, W.to);
      return `<h2>Когда едем</h2>
        <div class="row2"><div class="field"><label for="w-from">Забрать</label><input class="input ${W.errors.dates ? "err" : ""}" type="date" id="w-from" value="${W.from}" min="${todayIso()}"></div>
        <div class="field"><label for="w-to">Вернуть</label><input class="input ${W.errors.dates ? "err" : ""}" type="date" id="w-to" value="${W.to}" min="${todayIso()}"></div></div>
        ${err("dates")}${!W.errors.dates && !free ? `<div class="notice warn">На эти даты машина уже занята. Выбери другие даты или <a href="#catalog">другую машину</a>.</div>` : ""}
        <div class="fgroup"><span class="flabel">Дополнительно</span><div class="opts">${PM.EXTRAS.map((x) => `<label class="opt"><input type="checkbox" name="extra" value="${x.id}" ${W.extras.includes(x.id) ? "checked" : ""}><span class="opt-t">${x.label}<small>${x.note}</small></span><span class="opt-p">${x.per === "pct" ? "+25%" : U.rub(x.price) + (x.per === "day" ? " / сут" : "")}</span></label>`).join("")}</div></div>
        ${nav("Дальше — мои данные")}`;
    }
    if (W.step === 1) {
      return `<h2>Кто за рулём</h2>
        <p class="muted small">Для этой машины: возраст от ${cl.minAge} лет и стаж от ${cl.minExp} ${U.plural(cl.minExp, "года", "лет", "лет")}.</p>
        <div class="field"><label for="w-name">ФИО полностью</label><input class="input ${W.errors.name ? "err" : ""}" id="w-name" autocomplete="name" value="${esc(c.name)}" placeholder="Иванов Иван Иванович">${err("name")}</div>
        <div class="row2"><div class="field"><label for="w-phone">Телефон</label><input class="input ${W.errors.phone ? "err" : ""}" id="w-phone" type="tel" inputmode="tel" autocomplete="tel" value="${esc(c.phone)}" placeholder="+7 913 000-00-00">${err("phone")}</div>
        <div class="field"><label for="w-birth">Дата рождения</label><input class="input ${W.errors.birth ? "err" : ""}" id="w-birth" type="date" value="${esc(c.birth)}" max="${todayIso()}">${err("birth")}</div></div>
        <div class="row2"><div class="field"><label for="w-lic">Номер прав</label><input class="input ${W.errors.license ? "err" : ""}" id="w-lic" value="${esc(c.license)}" placeholder="70 12 345678">${err("license")}</div>
        <div class="field"><label for="w-since">Стаж с (дата в правах)</label><input class="input ${W.errors.licenseSince ? "err" : ""}" id="w-since" type="date" value="${esc(c.licenseSince)}" max="${todayIso()}">${err("licenseSince")}</div></div>
        ${nav("Дальше — документы")}`;
    }
    if (W.step === 2) {
      return `<h2>Фото документов</h2>
        <p class="muted small">Сфотографируй при хорошем свете, чтобы читались все буквы. Фото видит только владелец, они нужны для договора.</p>
        <div class="uploads">${DOCS.map(([k, t, s]) => `<label class="upload ${W.docs[k] ? "has" : ""} ${W.errors.docs && !W.docs[k] ? "err" : ""}" for="d-${k}">${W.docs[k] ? `<img src="${W.docs[k]}" alt="">` : ""}<input type="file" id="d-${k}" accept="image/*" data-doc="${k}"><span class="u-label">${t}<small>${W.docs[k] ? "Загружено · заменить" : s}</small></span></label>`).join("")}</div>
        ${err("docs")}
        <button type="button" class="btn btn-ghost btn-sm" data-sample style="justify-self:start">Заполнить образцами для демо</button>
        ${nav("Дальше — договор")}`;
    }
    if (W.step === 3) {
      const draft = { from: W.from, to: W.to, extras: W.extras, client: W.client, signature: null };
      return `<h2>Проверь и подпиши</h2>
        ${PM.contractHTML(draft, car)}
        <div class="sign-wrap"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><span class="flabel" style="font-weight:600">Подпись пальцем или мышкой</span><button type="button" class="btn btn-ghost btn-sm" data-clear>Стереть</button></div>
          <canvas class="sign-pad ${W.errors.sign ? "err" : ""}" id="sign" aria-label="Поле для подписи"></canvas>${err("sign")}</div>
        <label class="check"><input type="checkbox" id="w-agree" ${W.agree ? "checked" : ""}> Прочитал договор и <a href="#terms">условия аренды</a>, согласен</label>
        <label class="check"><input type="checkbox" id="w-pd" ${W.agreePd ? "checked" : ""}> Согласен на обработку персональных данных (152-ФЗ)</label>
        ${err("agree")}
        <div class="notice">Оплата аренды и залога — при получении машины, наличными, картой или по СБП. В полной версии можно будет внести предоплату онлайн.</div>
        ${nav("Отправить заявку")}`;
    }
  }
  function readStep() {
    if (W.step === 0) { W.from = $("#w-from").value; W.to = $("#w-to").value; W.extras = $$('input[name="extra"]:checked').map((i) => i.value); }
    if (W.step === 1) { Object.assign(W.client, { name: $("#w-name").value.trim(), phone: $("#w-phone").value.trim(), birth: $("#w-birth").value, license: $("#w-lic").value.trim(), licenseSince: $("#w-since").value }); try { localStorage.setItem("pm_client", JSON.stringify(W.client)); } catch (e) {} }
    if (W.step === 3) { W.agree = $("#w-agree").checked; W.agreePd = $("#w-pd").checked; }
  }
  function validate(car) {
    const e = {}, cl = PM.CLASSES[car.cls], c = W.client;
    if (W.step === 0) {
      if (!W.from || !W.to) e.dates = "Укажи обе даты";
      else if (W.from < todayIso()) e.dates = "Дата получения уже прошла";
      else if (W.to <= W.from) e.dates = "Дата возврата должна быть позже даты получения";
      else if (!S.isFree(car, W.from, W.to)) e.busy = true;
    }
    if (W.step === 1) {
      if (c.name.split(/\s+/).filter(Boolean).length < 2) e.name = "Напиши фамилию и имя полностью, как в паспорте";
      if (c.phone.replace(/\D/g, "").length !== 11) e.phone = "Номер из 11 цифр, например +7 913 000-00-00";
      if (!c.birth) e.birth = "Укажи дату рождения";
      else if (U.yearsSince(c.birth) < cl.minAge) e.birth = `Для этой машины нужно быть старше ${cl.minAge} лет`;
      if (c.license.replace(/\D/g, "").length !== 10) e.license = "10 цифр: серия и номер с лицевой стороны прав";
      if (!c.licenseSince) e.licenseSince = "Укажи дату из пункта 10 в правах";
      else if (U.yearsSince(c.licenseSince) < cl.minExp) e.licenseSince = `Нужен стаж от ${cl.minExp} ${U.plural(cl.minExp, "года", "лет", "лет")}`;
    }
    if (W.step === 2 && DOCS.some(([k]) => !W.docs[k])) e.docs = "Загрузи все 4 фото: без них владелец не сможет подтвердить бронь";
    if (W.step === 3) {
      if (!W.signature) e.sign = "Поставь подпись в поле выше";
      if (!W.agree || !W.agreePd) e.agree = "Отметь оба согласия, чтобы отправить заявку";
    }
    W.errors = e; return Object.keys(e).length === 0;
  }
  function rerenderWizard(car) {
    $("#wiz").innerHTML = stepHTML(car); $("#wiz-side").innerHTML = sideHTML(car);
    $$(".progress li").forEach((li, i) => { li.className = i < W.step ? "done" : i === W.step ? "cur" : ""; });
    bindStep(car);
  }
  function bindStep(car) {
    const form = $("#wiz");
    const back = $("[data-back]", form); if (back) back.addEventListener("click", () => { readStep(); W.errors = {}; W.step--; rerenderWizard(car); window.scrollTo(0, 0); });
    if (W.step === 0) {
      const live = () => { readStep(); W.errors = {}; $("#wiz-side").innerHTML = sideHTML(car); };
      $$("input", form).forEach((i) => i.addEventListener("change", () => { live(); if (i.type === "date") rerenderWizard(car); }));
    }
    if (W.step === 2) {
      $$("[data-doc]", form).forEach((inp) => inp.addEventListener("change", async () => {
        const f = inp.files[0]; if (!f) return;
        try { W.docs[inp.dataset.doc] = await PM.compressImage(f); W.errors = {}; rerenderWizard(car); }
        catch (ex) { PM.toast(ex.message); }
      }));
      $("[data-sample]", form).addEventListener("click", () => { DOCS.forEach(([k, t, s]) => { W.docs[k] = sampleDoc(t, s); }); W.errors = {}; rerenderWizard(car); });
    }
    if (W.step === 3) initSignature($("#sign"), (data) => { W.signature = data; });
    form.onsubmit = (e) => {
      e.preventDefault(); if (!W) return; readStep();
      const ok = validate(car);
      if (!ok) { rerenderWizard(car); const first = $(".err, .err-msg, .notice.warn", form); if (first) first.scrollIntoView({ block: "center", behavior: "smooth" }); return; }
      if (W.step < 3) { W.step++; rerenderWizard(car); window.scrollTo(0, 0); return; }
      const q = S.quote(car, W.from, W.to, W.extras);
      const b = S.addBooking({ carId: car.id, from: W.from, to: W.to, extras: W.extras, client: { ...W.client }, docs: { ...W.docs }, signature: W.signature, total: q.total, deposit: q.deposit, mine: true });
      W = null; location.hash = "done-" + b.id;
    };
  }
  function sampleDoc(title, sub) {
    const cv = document.createElement("canvas"); cv.width = 480; cv.height = 320; const g = cv.getContext("2d");
    g.fillStyle = title === "Паспорт" ? "#E9D9C4" : "#D9E4EC"; g.fillRect(0, 0, 480, 320);
    g.fillStyle = "#9AA5B1"; g.fillRect(28, 70, 120, 150);
    g.fillStyle = "#3A4350"; g.font = "bold 26px sans-serif"; g.fillText(title.toUpperCase(), 28, 48);
    g.font = "16px sans-serif"; g.fillText(sub, 170, 90);
    for (let i = 0; i < 6; i++) { g.fillStyle = "#7C8794"; g.fillRect(170, 120 + i * 24, 200 + (i % 3) * 40, 9); }
    g.fillStyle = "#B3261E"; g.font = "bold 22px sans-serif"; g.fillText("ОБРАЗЕЦ", 300, 290);
    return cv.toDataURL("image/jpeg", 0.7);
  }
  function initSignature(cv, onChange) {
    const ratio = Math.max(1, window.devicePixelRatio || 1);
    const size = () => { const r = cv.getBoundingClientRect(); cv.width = r.width * ratio; cv.height = r.height * ratio; const g = cv.getContext("2d"); g.scale(ratio, ratio); g.lineWidth = 2.4; g.lineCap = "round"; g.lineJoin = "round"; g.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--chrome").trim() || "#ddd"; return g; };
    let g = size(), drawing = false, inked = false, last = null;
    const pos = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    cv.addEventListener("pointerdown", (e) => { drawing = true; last = pos(e); cv.setPointerCapture(e.pointerId); });
    cv.addEventListener("pointermove", (e) => { if (!drawing) return; const p = pos(e); g.beginPath(); g.moveTo(...last); g.lineTo(...p); g.stroke(); last = p; inked = true; });
    const end = () => { if (!drawing) return; drawing = false; if (inked) onChange(exportInk()); };
    cv.addEventListener("pointerup", end); cv.addEventListener("pointercancel", end);
    // Экспортируем подпись тёмными чернилами для бумажного договора
    function exportInk() {
      const out = document.createElement("canvas"); out.width = cv.width; out.height = cv.height; const o = out.getContext("2d");
      o.drawImage(cv, 0, 0); o.globalCompositeOperation = "source-in"; o.fillStyle = "#14306B"; o.fillRect(0, 0, out.width, out.height);
      return out.toDataURL("image/png");
    }
    $("[data-clear]").addEventListener("click", () => { g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height); g = size(); inked = false; onChange(null); });
  }

  function viewDone(id) {
    const b = S.booking(id); if (!b) return notFound(); const car = S.car(b.carId);
    return `<div class="wrap done-hero">
      <div class="big">Заявка улетела</div>
      <p class="lead" style="text-align:center">Бронь <b class="num">${esc(b.id)}</b>: ${esc(car.brand)} ${esc(car.model)}, ${U.fmtDate(b.from)} — ${U.fmtDate(b.to)}. Паша проверит документы и подтвердит бронь, обычно за 15 минут. Статус появится в разделе «Мои брони», а уведомление придёт в Max или VK.</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center"><a class="btn btn-gold" href="#cabinet">Мои брони</a><a class="btn btn-ghost" href="#admin">Как это видит владелец</a></div>
      <p class="small muted">Это демо: заявка сохранилась только в этом браузере и сразу видна в панели владельца.</p>
    </div>`;
  }

  /* ——— Условия ——— */
  function viewTerms() {
    const cars = S.visibleCars();
    return `<div class="wrap page-head"><h1 style="font-size:clamp(2rem,5vw,3.4rem)">Условия аренды</h1><p class="lead">Коротко и без мелкого шрифта. Всё это же написано в договоре.</p></div>
    <div class="wrap terms-grid">
      <div class="term"><h3>Кто может взять</h3><ul><li>Возраст от 21 года, стаж от 2 лет</li><li>Премиум: от 25 лет и стаж от 5 лет</li><li>Паспорт РФ и права категории B</li></ul></div>
      <div class="term"><h3>Залог</h3><div class="big">${U.rub(PM.CLASSES.econom.deposit)} – ${U.rub(PM.CLASSES.premium.deposit)}</div><p class="muted">Эконом ${U.rub(PM.CLASSES.econom.deposit)}, комфорт ${U.rub(PM.CLASSES.comfort.deposit)}, премиум ${U.rub(PM.CLASSES.premium.deposit)}. Возвращаем сразу после осмотра. Можно без залога: +25% к цене.</p></div>
      <div class="term"><h3>Пробег и топливо</h3><ul><li>300 км в сутки, премиум 250 км</li><li>Сверх лимита — 5 ₽ за км</li><li>Выдаём с полным баком, так же возвращаешь</li></ul></div>
      <div class="term"><h3>Что включено</h3><ul><li>ОСАГО, на премиуме ещё КАСКО</li><li>Зимняя резина в сезон</li><li>ТО и шиномонтаж при долгой аренде</li></ul></div>
      <div class="term"><h3>Нельзя</h3><ul><li>Курить в салоне — штраф 5 000 ₽</li><li>Передавать руль другому человеку</li><li>Гонки, дрифт, буксировка</li></ul></div>
      <div class="term"><h3>Штрафы и опоздания</h3><ul><li>Штрафы ГИБДД оплачивает арендатор</li><li>Опоздание больше 2 часов — плюс сутки</li><li>Грязная машина — мойка 700 ₽</li></ul></div>
    </div>
    <div class="wrap" style="padding-bottom:40px"><h2 style="margin-bottom:16px">Цены за сутки</h2>
      <div class="price-matrix-wrap"><table class="price-matrix"><thead><tr><th>Машина</th>${PM.TIERS.map((t) => `<th>${t.label}</th>`).join("")}</tr></thead>
      <tbody>${cars.map((c) => `<tr><td><a href="#car-${c.id}">${esc(c.brand)} ${esc(c.model)}</a> <span class="muted small">${c.year}</span></td>${c.prices.map((p) => `<td>${p.toLocaleString("ru-RU")} ₽</td>`).join("")}</tr>`).join("")}</tbody></table></div>
      <p class="small muted" style="margin-top:10px">Дополнительно: подача по Томску 500 ₽, детское кресло 200 ₽/сут, без лимита пробега 400 ₽/сут.</p>
    </div>
    <div class="wrap"><h2 style="margin-bottom:16px">Частые вопросы</h2><div class="faq">${PM.FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("")}</div></div>`;
  }

  /* ——— Контакты ——— */
  function viewContacts() {
    const framed = (() => { try { return window.self !== window.top; } catch (e) { return true; } })();
    const map = framed ? schematicMap() : `<iframe src="${B.yandexWidget}" title="Карта: ${esc(B.city)}, ${esc(B.address)}" loading="lazy" allowfullscreen></iframe>`;
    return `<div class="wrap page-head"><h1 style="font-size:clamp(2rem,5vw,3.4rem)">Контакты</h1><p class="lead">Машины стоят у Мерседес-центра на Пушкина. Перед приездом лучше позвонить, чтобы машину подготовили.</p></div>
    <div class="wrap contacts">
      <div class="c-list">
        <div class="c-item"><span class="muted small">Телефон</span><span class="c-v big" data-copy-src>${B.phoneShort}</span><span class="muted small">${B.phonePretty}</span>
          <div class="c-actions"><a class="btn btn-gold btn-sm" href="tel:${B.phoneTel}">Позвонить</a><button class="btn btn-ghost btn-sm" data-copy="${B.phonePretty}">Скопировать номер</button></div></div>
        <div class="c-item"><span class="muted small">Адрес</span><span class="c-v">${B.city}, ${B.address}</span><span class="muted">${B.place}</span>
          <div class="c-actions"><a class="btn btn-ghost btn-sm" href="${B.yandex}" target="_blank" rel="noopener">Яндекс Карты</a><a class="btn btn-ghost btn-sm" href="${B.gis}" target="_blank" rel="noopener">2ГИС</a></div></div>
        <div class="c-item"><span class="muted small">Режим работы</span><span class="c-v">${B.hours}</span><span class="muted">Выдача и возврат вне графика — по договорённости</span></div>
        <div class="c-item"><span class="muted small">Написать</span><span class="muted">VK и Max работают даже когда мобильный интернет ограничен</span>
          <div class="c-actions"><a class="btn btn-ghost btn-sm" href="${B.vk}" target="_blank" rel="noopener">ВКонтакте</a><a class="btn btn-ghost btn-sm" href="${B.max}" target="_blank" rel="noopener">Max</a></div></div>
      </div>
      <div class="map-box">${map}</div>
    </div>`;
  }
  function schematicMap() {
    return `<svg viewBox="0 0 600 420" role="img" aria-label="Схема: ${B.city}, ${B.address}, Мерседес-центр">
      <rect width="600" height="420" fill="var(--panel)"/>
      <g stroke="var(--panel-2)" stroke-width="26" stroke-linecap="round" fill="none">
        <path d="M-20 300 L640 120"/><path d="M120 -20 L220 440"/><path d="M420 -20 L470 440"/><path d="M-20 80 L640 60"/>
      </g>
      <g stroke="var(--line)" stroke-width="2" fill="none" stroke-dasharray="10 10"><path d="M-20 300 L640 120"/></g>
      <g fill="color-mix(in srgb, var(--panel-2) 60%, var(--panel))"><rect x="250" y="250" width="120" height="70" rx="4"/><rect x="40" y="130" width="60" height="90" rx="4"/><rect x="490" y="200" width="90" height="60" rx="4"/><rect x="250" y="80" width="140" height="50" rx="4"/></g>
      <rect x="300" y="150" width="96" height="50" rx="4" fill="var(--line)"/>
      <text x="348" y="180" text-anchor="middle" font-size="12" fill="var(--mute)" font-family="Golos Text, sans-serif">Мерседес-центр</text>
      <text x="80" y="268" font-size="14" fill="var(--mute)" font-family="Golos Text, sans-serif" transform="rotate(-15 80 268)">ул. Пушкина</text>
      <g transform="translate(348 140)"><path d="M0 0 C-18 -22 -18 -46 0 -50 C18 -46 18 -22 0 0Z" fill="var(--gold)"/><circle cx="0" cy="-32" r="7" fill="var(--gold-ink)"/></g>
      <text x="348" y="72" text-anchor="middle" font-family="Dela Gothic One, sans-serif" font-size="18" fill="var(--chrome)">Пушкина, 61а</text>
      <text x="20" y="400" font-size="11" fill="var(--mute)" font-family="Golos Text, sans-serif">Схема. На сайте здесь открывается интерактивная Яндекс Карта.</text>
    </svg>`;
  }

  /* ——— Кабинет клиента ——— */
  function viewCabinet() {
    const mine = S.bookings.filter((b) => b.mine);
    return `<div class="wrap page-head"><h1 style="font-size:clamp(2rem,5vw,3.4rem)">Мои брони</h1><p class="lead">Статус заявки, договор и даты в одном месте.</p></div>
    <div class="wrap bk-list">${mine.length ? mine.map((b) => { const car = S.car(b.carId) || { brand: "Машина", model: "удалена", img: "" };
      return `<div class="bk"><img src="${car.img}" alt=""><div style="display:grid;gap:6px;min-width:0"><div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center"><b>${esc(car.brand)} ${esc(car.model)}</b>${PM.statusPill(b.status)}</div>
        <span class="muted small">${esc(b.id)} · ${U.fmtDate(b.from)} — ${U.fmtDate(b.to)}</span><span class="num">${U.rub(b.total)}${b.deposit ? " + залог " + U.rub(b.deposit) : ""}</span>
        ${b.status === "new" ? '<span class="small muted">Ждёт подтверждения владельца</span>' : b.status === "approved" ? `<span class="small" style="color:var(--go)">Подтверждена. Ждём ${U.fmtDate(b.from)} на Пушкина, 61а</span>` : b.status === "rejected" ? '<span class="small" style="color:var(--stop)">Владелец отклонил заявку. Позвоните, чтобы подобрать другую машину</span>' : ""}</div>
        <div class="bk-actions"><button class="btn btn-ghost btn-sm" data-contract="${b.id}">Договор</button><a class="btn btn-ghost btn-sm" href="#car-${b.carId}">Машина</a></div></div>`; }).join("") :
      `<div class="empty"><h3>Броней пока нет</h3><p class="muted">Выбери машину в каталоге — заявка появится здесь.</p><a class="btn btn-gold" href="#catalog">Открыть каталог</a></div>`}</div>`;
  }
  function bindCabinet() { $$("[data-contract]").forEach((b) => b.addEventListener("click", () => openContract(b.dataset.contract))); }
  PM.openContract = function openContract(id) { const b = S.booking(id), car = S.car(b.carId); PM.modal("Договор " + b.id, PM.contractHTML(b, car), "contract-modal"); };
  const openContract = PM.openContract;

  function notFound() { return `<div class="wrap empty" style="margin-block:48px"><h3>Такой страницы нет</h3><p class="muted">Возможно, машину сняли с аренды.</p><a class="btn btn-gold" href="#catalog">В каталог</a></div>`; }

  /* ——— Роутер ——— */
  function route() {
    const h = decodeURIComponent(location.hash.slice(1));
    let html, bind = () => {}, key = h || "home";
    if (!h) { html = viewHome(); bind = bindHome; }
    else if (h === "catalog") { html = viewCatalog(); bind = bindCatalog; }
    else if (h.startsWith("car-")) { const id = h.slice(4); html = viewCar(id); bind = () => bindCar(id); key = "catalog"; }
    else if (h.startsWith("book-")) { const id = h.slice(5); html = viewBook(id); bind = () => { const car = S.car(id); if (car) bindStep(car); }; key = "catalog"; }
    else if (h.startsWith("done-")) { html = viewDone(h.slice(5)); key = "cabinet"; }
    else if (h === "terms") html = viewTerms();
    else if (h === "contacts") { html = viewContacts(); bind = () => $$("[data-copy]").forEach((b) => b.addEventListener("click", () => PM.copy(b.dataset.copy, b))); }
    else if (h === "cabinet") { html = viewCabinet(); bind = bindCabinet; }
    else if (h === "admin") { html = PM.admin.view(); bind = PM.admin.bind; key = "admin"; }
    else html = notFound();
    document.body.classList.toggle("is-admin", key === "admin");
    app.innerHTML = html; bind();
    $$("[data-route]").forEach((a) => { if (a.dataset.route === key) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
    const titles = { home: "", catalog: "Автопарк", terms: "Условия", contacts: "Контакты", cabinet: "Мои брони", admin: "Панель владельца" };
    document.title = (titles[key] ? titles[key] + " — " : "") + "Паша Машины · аренда авто в Томске";
    window.scrollTo(0, 0);
  }
  PM.route = route;
  window.addEventListener("hashchange", route);

  /* Сеть: показываем, что каталог открыт из сохранённой копии */
  const net = () => { $("#offline").hidden = navigator.onLine; };
  window.addEventListener("online", net); window.addEventListener("offline", net); net();
  $("#reset-demo").addEventListener("click", () => { S.reset(); W = null; PM.toast("Демо-данные сброшены"); route(); });

  route();
})();
