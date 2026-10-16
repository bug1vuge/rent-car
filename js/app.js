/* Клиентская часть: роутер, каталог, карточка машины, бронирование, условия, контакты, кабинет. */
(function () {
  const S = RC.store, U = RC.util, B = RC.BIZ, $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const app = $("#app");
  const esc = U.esc;
  const todayIso = () => U.iso(U.today());

  /* ——— Общие элементы ——— */
  RC.toast = function (msg) {
    const t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); t.textContent = msg;
    document.body.appendChild(t); setTimeout(() => t.remove(), 3200);
  };
  RC.modal = function (title, html, cls) {
    const m = document.createElement("div"); m.className = "modal " + (cls || "");
    m.innerHTML = `<div class="modal-card" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="modal-head"><h3>${esc(title)}</h3><button class="x" aria-label="Закрыть">×</button></div><div class="modal-body">${html}</div></div>`;
    const close = () => { m.remove(); document.removeEventListener("keydown", onKey); };
    const onKey = (e) => { if (e.key === "Escape") close(); };
    m.addEventListener("click", (e) => { if (e.target === m || e.target.closest(".x")) close(); });
    document.addEventListener("keydown", onKey);
    document.body.appendChild(m); $(".x", m).focus();
    return { el: m, close };
  };
  RC.copy = function (text, btn) {
    const done = () => { RC.toast("Скопировано: " + text); };
    try { navigator.clipboard.writeText(text).then(done, () => fallback()); } catch (e) { fallback(); }
    function fallback() { const r = document.createRange(); const span = btn && btn.parentElement.querySelector("[data-copy-src]"); if (span) { r.selectNodeContents(span); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); RC.toast("Выделено — скопируйте вручную"); } }
  };
  RC.statusPill = function (s) {
    const map = { new: "Новая заявка", approved: "Подтверждена", active: "В аренде", done: "Завершена", rejected: "Отклонена" };
    return `<span class="pill p-${s}">${map[s] || s}</span>`;
  };
  const clsLabel = (c) => RC.CLASSES[c].label;

  /* Договор: один генератор для превью, кабинета и панели владельца */
  RC.contractHTML = function (b, car) {
    const q = S.quote(car, b.from, b.to, b.extras);
    const c = b.client || {};
    const extras = (b.extras || []).map((id) => RC.EXTRAS.find((e) => e.id === id)?.label).filter(Boolean).join(", ") || "нет";
    const no = b.id || "RC-____";
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
      <p>3.3. Лимит пробега — ${(b.extras || []).includes("unlim") ? "не установлен" : RC.CLASSES[car.cls].mileage + " км в сутки, превышение — 5 ₽ за км"}.</p>
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

  RC.compressImage = function (file, max = 1000) {
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
  try { const saved = JSON.parse(sessionStorage.getItem("rc_filters") || "null"); if (saved) F = Object.assign(F, saved, { price: saved.price || Infinity }); } catch (e) {}
  const saveF = () => { try { sessionStorage.setItem("rc_filters", JSON.stringify(F)); } catch (e) {} };
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
      <div class="car-img">${RC.carVisual(car)}<span class="status st-${st.key}">${esc(st.label)}</span></div>
      <div class="car-body">
        <div class="car-title"><h3>${esc(car.brand)} ${esc(car.model)}</h3><span class="year">${car.year}</span></div>
        <div class="specs"><span class="spec">${clsLabel(car.cls)}</span><span class="spec">${esc(car.kpp)}</span>${car.fuel !== "Бензин" ? `<span class="spec accent">${esc(car.fuel)}</span>` : `<span class="spec">${esc(car.fuel)}</span>`}${car.taxi ? '<span class="spec">Под такси</span>' : ""}</div>
        <div class="car-foot"><div class="price"><small>от</small><b>${car.prices[3].toLocaleString("ru-RU")} ₽</b><br><span>до ${car.prices[0].toLocaleString("ru-RU")} ₽ за сутки</span></div><span class="btn btn-primary btn-sm">Выбрать</span></div>
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
  I.cal = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>';
  I.key = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3M15 8l2 2"/></svg>';
  $("#rail-nav").innerHTML = [["", "Главная", I.home], ["catalog", "Машины", I.car], ["cabinet", "Брони", I.cal], ["terms", "Условия", I.doc], ["contacts", "Контакты", I.pin], ["admin", "Владелец", I.key, "rail-extra"]]
    .map(([h, l, i, cls]) => `<a href="#${h}" data-route="${h || "home"}" class="${cls || ""}">${i}<span>${l}</span></a>`).join("");

  /* ——— Главная: дашборд ——— */
  const H = { cls: "comfort", id: null };
  const carImg = (car, cls = "") => RC.carVisual(car, cls);
  const freeRank = (c) => (datesSet() && S.isFree(c, F.from, F.to) ? 0 : 1) + (S.liveStatus(c).key === "free" ? 0 : 1);
  const classCars = (cls) => S.visibleCars().filter((c) => c.cls === cls).sort((a, b) => freeRank(a) - freeRank(b) || a.prices[0] - b.prices[0]);
  const stageCar = () => {
    let list = classCars(H.cls);
    if (!list.length) { H.cls = Object.keys(RC.CLASSES).find((k) => classCars(k).length) || "econom"; list = classCars(H.cls); }
    let car = list.find((c) => c.id === H.id); if (!car) { car = list[0]; H.id = car && car.id; }
    return car;
  };
  const stageStep = (n) => { const list = classCars(H.cls); const i = list.findIndex((c) => c.id === H.id); H.id = list[(i + n + list.length) % list.length].id; };
  const ensureDates = () => { if (!datesSet() || F.from < todayIso()) { F.from = U.iso(U.addDays(U.today(), 1)); F.to = U.iso(U.addDays(U.today(), 4)); saveF(); } };
  RC.home = {
    car: stageCar,
    dates: () => { ensureDates(); return { from: F.from, to: F.to }; },
    setDates(from, to) { F.from = from; F.to = to; saveF(); if (location.hash.replace("#", "") === "") { renderDates(); renderStage(); } },
    setClass(cls) { H.cls = cls; H.id = null; if (!location.hash.slice(1)) { renderStage(true); renderDates(); } },
    filtersFor(patch) { Object.assign(F, patch); saveF(); }
  };

  /* Яндекс Карта в оформлении сервиса. В превью внутри песочницы внешние карты заблокированы —
     там показывается схема и подпись, на сайте всегда настоящая карта. */
  const FRAMED = (() => { try { return window.self !== window.top; } catch (e) { return true; } })();
  RC.yandexMap = function ({ zoom = 14, interactive = true, label = "" } = {}) {
    const turn = `<div class="nm-turn"><i>${ICO.turn}</i><span><b>Пушкина, 61а</b>${esc(label || "Мерседес-центр, парковка у шоурума")}</span></div>`;
    if (FRAMED) return `<div class="ymap is-preview"><div class="navmap">${turn}${RC.navmapSVG()}</div><span class="ymap-note">В превью внешние карты отключены. На сайте здесь Яндекс Карта.</span></div>`;
    const src = `https://yandex.ru/map-widget/v1/?ll=${B.mapCenter}&z=${zoom}&pt=${B.lon}%2C${B.lat}%2Cpm2blm`;
    return `<div class="ymap ${interactive ? "" : "static"}"><iframe src="${src}" title="Яндекс Карта: ${esc(B.city)}, ${esc(B.address)}" loading="lazy" allowfullscreen></iframe>${turn}</div>`;
  };

  RC.navmapSVG = function () {
    return `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect class="nm-bg" width="400" height="300"/>
      <g class="nm-block"><rect x="20" y="20" width="90" height="60" rx="8"/><rect x="140" y="14" width="110" height="52" rx="8"/><rect x="280" y="30" width="100" height="70" rx="8"/><rect x="18" y="120" width="70" height="90" rx="8"/><rect x="130" y="196" width="100" height="80" rx="8"/><rect x="292" y="190" width="96" height="92" rx="8"/><rect x="120" y="96" width="70" height="56" rx="8"/></g>
      <g class="nm-road"><path d="M-10 104 L410 92" stroke-width="16"/><path d="M-10 178 L410 160" stroke-width="20"/><path d="M118 -10 L104 310" stroke-width="14"/><path d="M262 -10 L282 310" stroke-width="16"/><path d="M190 160 L210 310" stroke-width="10"/></g>
      <path class="nm-route" d="M60 260 L60 178 L264 166 L270 128"/>
      <path class="nm-route-dash" d="M60 260 L60 178 L264 166 L270 128"/>
      <circle class="nm-me" cx="60" cy="262" r="8"/>
      <circle class="nm-pulse" cx="270" cy="118" r="30"/>
      <g transform="translate(270 124)"><path class="nm-pin" d="M0 0 C-14 -16 -14 -36 0 -38 C14 -36 14 -16 0 0Z"/><circle class="nm-pin-dot" cx="0" cy="-25" r="6"/></g>
      <text class="nm-label" x="300" y="152">Мерседес-центр</text>
      <text class="nm-label" x="80" y="268">Октябрьский р-н</text>
      <g class="nm-center"><path d="M14 296 L30 280 M14 296 l9 -1 M14 296 l1 -9"/></g>
      <text class="nm-label" x="34" y="294">центр ≈ 3 км</text>
      <text class="nm-label" x="150" y="190" transform="rotate(-3 150 190)">ул. Пушкина</text>
    </svg>`;
  };
  const ICO = {
    spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/></svg>',
    left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 6l-6 6 6 6"/></svg>',
    right: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 12h15M14 6l6 6-6 6"/></svg>',
    out: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 4h6v6M20 4l-8 8M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
    seat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="7" r="3.5"/><path d="M5 20c1-4 3.5-6 7-6s6 2 7 6"/></svg>',
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 4v16M12 4v16M18 4v8M6 12h12"/></svg>',
    turn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M7 20v-7a3 3 0 0 1 3-3h8M14 6l4 4-4 4"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6z"/><path d="M9 12l2 2 4-4"/></svg>',
    bolt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M13 3L5 14h6l-1 7 8-11h-6z"/></svg>'
  };

  function viewHome() {
    ensureDates();
    const cars = S.visibleCars();
    const freeNow = cars.filter((c) => S.liveStatus(c).key === "free").length;
    const minPrice = Math.min(...cars.map((c) => c.prices[3]));
    const recs = ["changan-1", "bora-1", "hongqi-1", "granta-1"].map(S.car).filter((c) => c && c.status !== "hidden").slice(0, 3);
    return `<div class="dash">
      <section class="tile stage" aria-label="Машина на сцене" id="stage"></section>
      <section class="tile assistant" aria-label="Помощник" id="assistant">${RC.assistant.html()}</section>
      <div class="stats">
        <div class="tile stat">${I.car}<div><div class="big-num">${freeNow}<span class="muted" style="font-size:.55em"> из ${cars.length}</span></div><p>машин свободно сейчас</p></div></div>
        <div class="tile stat">${ICO.bolt}<div><div class="big-num">15<span class="muted" style="font-size:.55em"> мин</span></div><p>от заявки до ключей</p></div></div>
        <div class="tile stat">${ICO.shield}<div><div class="big-num">${minPrice.toLocaleString("ru-RU")}<span class="muted" style="font-size:.55em"> ₽</span></div><p>минимум за сутки, ОСАГО включено</p></div></div>
      </div>
      <section class="tile w-map">
        <div class="tile-head"><div><h3>Место выдачи</h3><p>${esc(B.address)} · ${esc(B.place.split(",")[0])}</p></div><a class="tile-link" href="#contacts" aria-label="Открыть контакты">${ICO.right}</a></div>
        <a class="map-link" href="#contacts" aria-label="Открыть карту в контактах">${RC.yandexMap({ zoom: 13, interactive: false, label: "парковка у шоурума" })}</a>
      </section>
      <section class="tile w-dates" id="w-dates"></section>
      <section class="tile w-pay">
        <div class="tile-head"><div><h3>Оплата</h3><p>При получении машины</p></div></div>
        <div class="paycard">
          <div class="pc-row"><small>Залог возвращаем после осмотра</small><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" opacity=".7"><path d="M8.5 8.5a5 5 0 0 1 0 7M12 6a8.5 8.5 0 0 1 0 12M15.5 3.5a12 12 0 0 1 0 17"/></svg></div>
          <div class="pc-row"><div class="pc-ways"><span>Карта</span><span>СБП</span><span>Наличные</span></div></div>
          <div class="pc-row col"><b id="pay-deposit"></b><small>Онлайн-предоплата появится в полной версии</small></div>
        </div>
        <button class="btn btn-go btn-block" style="margin-top:14px" data-book-stage>Забронировать</button>
        <div class="secure">${ICO.lock}Документы видит только владелец</div>
      </section>
      <section class="tile recs">
        <div class="tile-head"><div><h3>Рекомендуем</h3><p>Свободны на ближайшие дни</p></div><a class="tile-link" href="#catalog" aria-label="Весь автопарк">${ICO.right}</a></div>
        <div class="recs-grid">${recs.map((c) => `<a class="mini" href="#car-${c.id}"><div class="mimg">${carImg(c)}</div><h3>${esc(c.brand)} ${esc(c.model)}</h3><div class="meta"><span>${ICO.seat}${c.seats}</span><span>${ICO.gear}${esc(c.kpp)}</span><span>${clsLabel(c.cls)}</span></div><div class="pr"><b>от ${c.prices[3].toLocaleString("ru-RU")} ₽</b> <span>/ сутки</span></div></a>`).join("")}</div>
      </section>
      <section class="tile promo">
        <div><h2>Работаешь в такси?</h2><p>Granta, Bora и Changan от 7 суток. Bora на газу — километр в 2–3 раза дешевле.</p></div>
        ${S.car("bora-1") ? `<img src="${S.car("bora-1").cut}" alt="">` : ""}
        <button class="btn" data-taxi>Машины под такси</button>
      </section>
    </div>`;
  }

  function renderStage(animate) {
    const el = $("#stage"); if (!el) return;
    const car = stageCar(); const list = classCars(H.cls); const cur = list.indexOf(car);
    const keys = Object.keys(RC.CLASSES); const ci = keys.indexOf(H.cls);
    const st = S.liveStatus(car);
    el.innerHTML = `
      <div class="stage-top">
        <div><h1>${esc(car.brand)} ${esc(car.model)}</h1><p>${car.year} · ${esc(car.engine)} · ${esc(car.kpp)} · ${esc(car.fuel.toLowerCase())}</p></div>
        <span class="status st-${st.key}">${esc(st.label)}</span>
      </div>
      <div class="drive" role="group" aria-label="Класс машины">
        <span class="thumb" style="width:calc((100% - 8px) / ${keys.length});transform:translateX(${ci * 100}%)"></span>
        ${keys.map((k) => { const cl = classCars(k); const from = cl.length ? Math.min(...cl.map((c) => c.prices[3])) : 0; return `<button type="button" data-drive="${k}" aria-pressed="${k === H.cls}"><b>${RC.CLASSES[k].label}</b><small>${cl.length ? "от " + from.toLocaleString("ru-RU") + " ₽" : "нет"}</small></button>`; }).join("")}
      </div>
      <div class="stage-car ${animate ? "swap" : ""}">${carImg(car)}</div>
      <div class="stage-bottom">
        <div class="stage-nav">
          <button class="round" data-stage="-1" aria-label="Предыдущая машина" ${list.length < 2 ? "disabled" : ""}>${ICO.left}</button>
          <div class="dots" aria-hidden="true">${list.map((_, i) => `<i class="${i === cur ? "on" : ""}"></i>`).join("")}</div>
          <button class="round" data-stage="1" aria-label="Следующая машина" ${list.length < 2 ? "disabled" : ""}>${ICO.right}</button>
        </div>
        <div class="spec-row">${car.features.slice(0, 3).map((f) => `<span class="spec">${esc(f)}</span>`).join("")}</div>
        <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
          <div class="stage-price"><b class="big-num">${car.prices[0].toLocaleString("ru-RU")} ₽</b> <span>/ сутки</span></div>
          <a class="btn btn-primary" href="#car-${car.id}">Подробнее и бронь</a>
        </div>
      </div>`;
    $$("[data-drive]", el).forEach((b) => b.addEventListener("click", () => { if (H.cls === b.dataset.drive) return; H.cls = b.dataset.drive; H.id = null; renderStage(true); renderDates(); }));
    $$("[data-stage]", el).forEach((b) => b.addEventListener("click", () => { stageStep(+b.dataset.stage); renderStage(true); renderDates(); }));
    const dep = $("#pay-deposit"); if (dep) dep.textContent = "Залог " + U.rub(RC.CLASSES[car.cls].deposit);
  }

  function renderDates() {
    const el = $("#w-dates"); if (!el) return; ensureDates();
    const car = stageCar(); const q = S.quote(car, F.from, F.to, []); const free = S.isFree(car, F.from, F.to);
    const box = (iso, key, lbl) => { const d = U.parse(iso); return `<div class="dbox"><span class="lbl">${lbl}</span><span class="big-num">${d.getDate()}</span><span class="mon">${d.toLocaleDateString("ru-RU", { month: "short", weekday: "short" })}</span>
      <div class="dstep"><button type="button" data-step="${key}|-1" aria-label="${lbl}: на день раньше">${ICO.left}</button><button type="button" data-step="${key}|1" aria-label="${lbl}: на день позже">${ICO.right}</button></div></div>`; };
    el.innerHTML = `<div class="tile-head"><div><h3>Мои даты</h3><p>${q.days} ${U.plural(q.days, "сутки", "суток", "суток")} · ${esc(car.brand)} ${esc(car.model)}</p></div><a class="tile-link" href="#catalog" aria-label="Все свободные на эти даты">${ICO.out}</a></div>
      <div class="dates">${box(F.from, "from", "Забрать")}<svg class="darrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 12h15M14 6l6 6-6 6"/></svg>${box(F.to, "to", "Вернуть")}</div>
      <div class="divider"></div>
      <div class="dmeta"><div class="t">${ICO.clock}<div><b>10:00</b><span>время выдачи</span></div></div>
        <div style="text-align:right"><b class="num" style="font-size:1.2rem">${U.rub(q.base)}</b><div class="small ${free ? "st-free" : "st-busy"}">${free ? "Машина свободна" : "На эти даты занята"}</div></div></div>`;
    $$("[data-step]", el).forEach((b) => b.addEventListener("click", () => {
      const [k, n] = b.dataset.step.split("|"); let from = U.parse(F.from), to = U.parse(F.to);
      if (k === "from") { from = U.addDays(from, +n); if (from < U.today()) return; if (to <= from) to = U.addDays(from, 1); }
      else { to = U.addDays(to, +n); if (to <= from) return; }
      F.from = U.iso(from); F.to = U.iso(to); saveF(); renderDates();
    }));
  }

  function bindHome() {
    renderStage(); renderDates(); RC.assistant.bind($("#assistant"));
    $("[data-taxi]").addEventListener("click", () => { F.taxi = true; F.cls = []; saveF(); location.hash = "catalog"; });
    $("[data-book-stage]").addEventListener("click", () => { const car = stageCar(); W = newWizard(car.id); location.hash = "book-" + car.id; });
  }

  /* ——— Каталог ——— */
  function viewCatalog() {
    const mp = maxPrice(); const price = Math.min(F.price, mp);
    const chip = (group, val, label, on) => `<button class="chip" type="button" data-${group}="${val}" aria-pressed="${on}">${label}</button>`;
    return `
    <div class="page-head"><h1>Автопарк</h1><p class="lead">Все машины с полным баком, зимней резиной и ОСАГО. Укажи даты, и останутся только свободные.</p></div>
    <div class="catalog">
      <div>
        <button class="btn btn-ghost btn-block filters-toggle" id="ftoggle" aria-expanded="false" aria-controls="filters">Фильтры и даты</button>
        <aside class="filters collapsed" id="filters">
          <div class="row2">
            <div class="field"><label for="f-from">Забрать</label><input class="input" type="date" id="f-from" value="${F.from}" min="${todayIso()}"></div>
            <div class="field"><label for="f-to">Вернуть</label><input class="input" type="date" id="f-to" value="${F.to}" min="${todayIso()}"></div>
          </div>
          <label class="toggle"><input type="checkbox" id="f-free" ${F.onlyFree ? "checked" : ""}> Только свободные на эти даты</label>
          <div class="fgroup"><span class="flabel">Класс</span><div class="chips">${Object.entries(RC.CLASSES).map(([k, v]) => chip("cls", k, v.label, F.cls.includes(k))).join("")}</div></div>
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
            <select class="input" id="f-sort" style="min-height:40px;padding:6px 34px 6px 14px;width:auto;min-width:190px"><option value="price">Сначала дешевле</option><option value="price-desc">Сначала дороже</option><option value="year">Сначала новее</option></select></label>
        </div>
        <div id="results"></div>
      </div>
    </div>`;
  }
  function renderResults() {
    const list = filtered();
    $("#count").textContent = list.length ? `Найдено ${list.length} ${U.plural(list.length, "машина", "машины", "машин")}${datesSet() ? " · " + U.fmtDate(F.from, { day: "numeric", month: "short" }) + " – " + U.fmtDate(F.to, { day: "numeric", month: "short" }) : ""}` : "";
    $("#results").innerHTML = list.length ? `<div class="grid-cars">${list.map(carCard).join("")}</div>` :
      `<div class="empty"><h3>На эти условия свободных машин нет</h3><p class="muted">Сдвинь даты на день-два или убери часть фильтров. Можно позвонить: ${B.phoneShort} — подскажем, что освободится.</p><button class="btn btn-primary" id="empty-reset">Сбросить фильтры</button></div>`;
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
    return `<div class="calendar">${h}</div><div class="legend"><span><i style="background:var(--go-soft);box-shadow:inset 0 0 0 1px var(--go)"></i>Свободна</span><span><i style="background:var(--stop-soft);box-shadow:inset 0 0 0 1px var(--stop)"></i>Занята</span></div>`;
  }
  function viewCar(id) {
    const car = S.car(id); if (!car) return notFound();
    const cl = RC.CLASSES[car.cls];
    const from = F.from || U.iso(U.addDays(U.today(), 1)), to = F.to && F.to > from ? F.to : U.iso(U.addDays(U.parse(from), 3));
    return `
    <div class="crumbs"><a href="#catalog">Автопарк</a> / ${esc(car.brand)} ${esc(car.model)}</div>
    <div class="car-page">
      <div class="car-info">
        <section class="tile car-stage">
          <div class="head"><div><h1>${esc(car.brand)} ${esc(car.model)}</h1><p class="muted" style="margin-top:6px">${car.year} · ${cl.label} · ${esc(car.engine)}</p></div>
          <span class="status st-${S.liveStatus(car).key}">${esc(S.liveStatus(car).label)}</span></div>
          <div class="stage-car">${RC.carVisual(car)}</div>
        </section>
        <section class="tile"><dl class="spec-table">
          <div><dt>Год</dt><dd>${car.year}</dd></div><div><dt>Класс</dt><dd>${cl.label}</dd></div>
          <div><dt>Коробка</dt><dd>${esc(car.kpp)}</dd></div><div><dt>Двигатель</dt><dd>${esc(car.engine)}</dd></div>
          <div><dt>Топливо</dt><dd>${esc(car.fuel)}</dd></div><div><dt>Расход</dt><dd>${esc(car.cons)}</dd></div>
          <div><dt>Мест</dt><dd>${car.seats}</dd></div><div><dt>Цвет</dt><dd>${esc(car.color)}</dd></div>
        </dl></section>
        <section class="tile" style="display:grid;gap:14px"><h3>Что есть в машине</h3>
        <ul class="feat">${car.features.map((f) => `<li>${esc(f)}</li>`).join("")}</ul></section>
        <section class="tile" style="display:grid;gap:8px"><h3>Требования к водителю</h3>
        <p class="muted">Возраст от ${cl.minAge} лет, стаж от ${cl.minExp} ${U.plural(cl.minExp, "года", "лет", "лет")}. Залог ${U.rub(cl.deposit)}, возвращается после осмотра. Лимит ${cl.mileage} км в сутки.</p>
        </section>
        <section class="tile" style="display:grid;gap:12px"><h3>Занятость на 4 недели</h3>
        <div style="max-width:440px;display:grid;gap:10px">${calendarHTML(car)}</div></section>
      </div>
      <aside class="side-card">
        <div class="row2">
          <div class="field"><label for="c-from">Забрать</label><input class="input" type="date" id="c-from" data-car="${car.id}" required value="${from}" min="${todayIso()}"></div>
          <div class="field"><label for="c-to">Вернуть</label><input class="input" type="date" id="c-to" data-car="${car.id}" required value="${to}" min="${todayIso()}"></div>
        </div>
        <table class="tariffs" id="c-tariffs">${RC.TIERS.map((t, i) => `<tr data-tier="${i}"><td>${t.label}</td><td>${car.prices[i].toLocaleString("ru-RU")} ₽ / сутки</td></tr>`).join("")}</table>
        <div id="c-quote"></div>
        <button class="btn btn-primary btn-block" id="c-book">Забронировать</button>
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
    let draft = {}; try { draft = JSON.parse(localStorage.getItem("rc_client") || "{}"); } catch (e) {}
    return { carId, step: 0, from: F.from, to: F.to, extras: [], client: Object.assign({ name: "", phone: "", birth: "", license: "", licenseSince: "", email: "" }, draft), docs: {}, signature: null, agree: false, agreePd: false, errors: {} };
  }
  const DOCS = [["pass1", "Паспорт", "Разворот с фото"], ["pass2", "Паспорт", "Страница с пропиской"], ["lic1", "Права", "Лицевая сторона"], ["lic2", "Права", "Обратная сторона"]];
  const STEPS = ["Даты и опции", "Данные", "Документы", "Договор"];

  function viewBook(id) {
    const car = S.car(id); if (!car) return notFound();
    if (!W || W.carId !== id) W = newWizard(id);
    if (!W.from || !W.to || W.to <= W.from) { W.from = U.iso(U.addDays(U.today(), 1)); W.to = U.iso(U.addDays(U.today(), 4)); }
    return `
    <div class="crumbs"><a href="#catalog">Автопарк</a> / <a href="#car-${car.id}">${esc(car.brand)} ${esc(car.model)}</a> / Бронирование</div>
    <div class="wizard">
      <div style="min-width:0">
        <ol class="progress">${STEPS.map((s, i) => `<li class="${i < W.step ? "done" : i === W.step ? "cur" : ""}">${i + 1}. ${s}</li>`).join("")}</ol>
        <form class="panel" id="wiz" novalidate>${stepHTML(car)}</form>
      </div>
      <aside class="side-card" id="wiz-side">${sideHTML(car)}</aside>
    </div>`;
  }
  function sideHTML(car) {
    const q = S.quote(car, W.from, W.to, W.extras);
    return `<div class="side-car"><div class="simg">${RC.carVisual(car)}</div><div><b>${esc(car.brand)} ${esc(car.model)}</b><div class="small muted">${car.year} · ${esc(car.kpp)} · ${clsLabel(car.cls)}</div></div></div>
      <div class="small muted">${U.fmtDate(W.from, { day: "numeric", month: "long" })} — ${U.fmtDate(W.to, { day: "numeric", month: "long" })}</div>
      <div class="summary">${q.lines.map((l) => `<div class="line"><span>${esc(l.label)}</span><span>${U.rub(l.sum)}</span></div>`).join("")}
        <div class="line"><span>Залог, вернём</span><span>${q.deposit ? U.rub(q.deposit) : "без залога"}</span></div>
        <div class="line total"><span>Итого за аренду</span><b>${U.rub(q.total)}</b></div></div>`;
  }
  function err(k) { return W.errors[k] ? `<span class="err-msg">${esc(W.errors[k])}</span>` : ""; }
  function stepHTML(car) {
    const cl = RC.CLASSES[car.cls], c = W.client;
    const nav = (next) => `<div class="wiz-nav">${W.step > 0 ? '<button type="button" class="btn btn-ghost" data-back>Назад</button>' : `<a class="btn btn-ghost" href="#car-${car.id}">К машине</a>`}<button type="submit" class="btn btn-primary">${next}</button></div>`;
    if (W.step === 0) {
      const free = W.to > W.from && S.isFree(car, W.from, W.to);
      return `<h2>Когда едем</h2>
        <div class="row2"><div class="field"><label for="w-from">Забрать</label><input class="input ${W.errors.dates ? "err" : ""}" type="date" id="w-from" data-car="${car.id}" required value="${W.from}" min="${todayIso()}"></div>
        <div class="field"><label for="w-to">Вернуть</label><input class="input ${W.errors.dates ? "err" : ""}" type="date" id="w-to" data-car="${car.id}" required value="${W.to}" min="${todayIso()}"></div></div>
        ${err("dates")}${!W.errors.dates && !free ? `<div class="notice warn">На эти даты машина уже занята. Выбери другие даты или <a href="#catalog">другую машину</a>.</div>` : ""}
        <div class="fgroup"><span class="flabel">Дополнительно</span><div class="opts">${RC.EXTRAS.map((x) => `<label class="opt"><input type="checkbox" name="extra" value="${x.id}" ${W.extras.includes(x.id) ? "checked" : ""}><span class="opt-t">${x.label}<small>${x.note}</small></span><span class="opt-p">${x.per === "pct" ? "+25%" : U.rub(x.price) + (x.per === "day" ? " / сут" : "")}</span></label>`).join("")}</div></div>
        ${nav("Дальше — мои данные")}`;
    }
    if (W.step === 1) {
      return `<h2>Кто за рулём</h2>
        <p class="muted small">Для этой машины: возраст от ${cl.minAge} лет и стаж от ${cl.minExp} ${U.plural(cl.minExp, "года", "лет", "лет")}.</p>
        <div class="field"><label for="w-name">ФИО полностью</label><input class="input ${W.errors.name ? "err" : ""}" id="w-name" autocomplete="name" value="${esc(c.name)}" placeholder="Иванов Иван Иванович">${err("name")}</div>
        <div class="row2"><div class="field"><label for="w-phone">Телефон</label><input class="input ${W.errors.phone ? "err" : ""}" id="w-phone" type="tel" inputmode="tel" autocomplete="tel" value="${esc(c.phone)}" placeholder="+7 913 000-00-00">${err("phone")}</div>
        <div class="field"><label for="w-birth">Дата рождения</label><input class="input ${W.errors.birth ? "err" : ""}" id="w-birth" type="date" required value="${esc(c.birth)}" max="${todayIso()}">${err("birth")}</div></div>
        <div class="row2"><div class="field"><label for="w-lic">Номер прав</label><input class="input ${W.errors.license ? "err" : ""}" id="w-lic" value="${esc(c.license)}" placeholder="70 12 345678">${err("license")}</div>
        <div class="field"><label for="w-since">Стаж с (дата в правах)</label><input class="input ${W.errors.licenseSince ? "err" : ""}" id="w-since" type="date" required value="${esc(c.licenseSince)}" max="${todayIso()}">${err("licenseSince")}</div></div>
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
        ${RC.contractHTML(draft, car)}
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
    if (W.step === 1) { Object.assign(W.client, { name: $("#w-name").value.trim(), phone: $("#w-phone").value.trim(), birth: $("#w-birth").value, license: $("#w-lic").value.trim(), licenseSince: $("#w-since").value }); try { localStorage.setItem("rc_client", JSON.stringify(W.client)); } catch (e) {} }
    if (W.step === 3) { W.agree = $("#w-agree").checked; W.agreePd = $("#w-pd").checked; }
  }
  function validate(car) {
    const e = {}, cl = RC.CLASSES[car.cls], c = W.client;
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
        try { W.docs[inp.dataset.doc] = await RC.compressImage(f); W.errors = {}; rerenderWizard(car); }
        catch (ex) { RC.toast(ex.message); }
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
    return `<div class="done-hero">
      <div class="ok-ring"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>
      <h1>Заявка отправлена</h1>
      <p class="lead" style="text-align:center">Бронь <b class="num">${esc(b.id)}</b>: ${esc(car.brand)} ${esc(car.model)}, ${U.fmtDate(b.from)} — ${U.fmtDate(b.to)}. Менеджер проверит документы и подтвердит бронь, обычно за 15 минут. Статус появится в разделе «Мои брони», а уведомление придёт в Max или VK.</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center"><a class="btn btn-primary" href="#cabinet">Мои брони</a><a class="btn btn-ghost" href="#admin">Как это видит владелец</a></div>
      <p class="small muted">Это демо: заявка сохранилась только в этом браузере и сразу видна в панели владельца.</p>
    </div>`;
  }

  /* ——— Условия ——— */
  function viewTerms() {
    const cars = S.visibleCars();
    return `<div class="page-head"><h1>Условия аренды</h1><p class="lead">Коротко и без мелкого шрифта. Всё это же написано в договоре.</p></div>
    <div class="terms-grid">
      <div class="term"><h3>Кто может взять</h3><ul><li>Возраст от 21 года, стаж от 2 лет</li><li>Премиум: от 25 лет и стаж от 5 лет</li><li>Паспорт РФ и права категории B</li></ul></div>
      <div class="term"><h3>Залог</h3><div class="big-num"><span class="muted" style="font-size:.55em">от</span> ${U.rub(RC.CLASSES.econom.deposit)}</div><p class="muted">Эконом ${U.rub(RC.CLASSES.econom.deposit)}, комфорт ${U.rub(RC.CLASSES.comfort.deposit)}, премиум ${U.rub(RC.CLASSES.premium.deposit)}. Возвращаем сразу после осмотра. Можно без залога: +25% к цене.</p></div>
      <div class="term"><h3>Пробег и топливо</h3><ul><li>300 км в сутки, премиум 250 км</li><li>Сверх лимита — 5 ₽ за км</li><li>Выдаём с полным баком, так же возвращаешь</li></ul></div>
      <div class="term"><h3>Что включено</h3><ul><li>ОСАГО, на премиуме ещё КАСКО</li><li>Зимняя резина в сезон</li><li>ТО и шиномонтаж при долгой аренде</li></ul></div>
      <div class="term"><h3>Нельзя</h3><ul><li>Курить в салоне — штраф 5 000 ₽</li><li>Передавать руль другому человеку</li><li>Гонки, дрифт, буксировка</li></ul></div>
      <div class="term"><h3>Штрафы и опоздания</h3><ul><li>Штрафы ГИБДД оплачивает арендатор</li><li>Опоздание больше 2 часов — плюс сутки</li><li>Грязная машина — мойка 700 ₽</li></ul></div>
    </div>
    <div class="block"><h2 style="margin-bottom:14px">Цены за сутки</h2>
      <div class="price-matrix-wrap"><table class="price-matrix"><thead><tr><th>Машина</th>${RC.TIERS.map((t) => `<th>${t.label}</th>`).join("")}</tr></thead>
      <tbody>${cars.map((c) => `<tr><td><a href="#car-${c.id}">${esc(c.brand)} ${esc(c.model)}</a> <span class="muted small">${c.year}</span></td>${c.prices.map((p) => `<td>${p.toLocaleString("ru-RU")} ₽</td>`).join("")}</tr>`).join("")}</tbody></table></div>
      <p class="small muted" style="margin-top:10px">Дополнительно: подача по Томску 500 ₽, детское кресло 200 ₽/сут, без лимита пробега 400 ₽/сут.</p>
    </div>
    <div class="block"><h2 style="margin-bottom:14px">Частые вопросы</h2><div class="faq">${RC.FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("")}</div></div>`;
  }

  /* ——— Контакты ——— */
  function viewContacts() {
    const map = RC.yandexMap({ zoom: 14 });
    return `<div class="page-head"><h1>Контакты</h1><p class="lead">Машины стоят у Мерседес-центра на Пушкина. Перед приездом лучше позвонить, чтобы машину подготовили.</p></div>
    <div class="contacts">
      <div class="c-list">
        <div class="c-item"><span class="muted small">Телефон</span><span class="c-v big" data-copy-src>${B.phoneShort}</span><span class="muted small">${B.phonePretty}</span>
          <div class="c-actions"><a class="btn btn-primary btn-sm" href="tel:${B.phoneTel}">Позвонить</a><button class="btn btn-ghost btn-sm" data-copy="${B.phonePretty}">Скопировать номер</button></div></div>
        <div class="c-item"><span class="muted small">Адрес</span><span class="c-v">${B.city}, ${B.address}</span><span class="muted">${B.place}</span><span class="muted small">${B.district}</span>
          <div class="c-actions"><a class="btn btn-ghost btn-sm" href="${B.yandexRoute}" target="_blank" rel="noopener">Маршрут в Яндекс Картах</a><a class="btn btn-ghost btn-sm" href="${B.gis}" target="_blank" rel="noopener">2ГИС</a></div></div>
        <div class="c-item"><span class="muted small">Режим работы</span><span class="c-v">${B.hours}</span><span class="muted">Выдача и возврат вне графика — по договорённости</span></div>
        <div class="c-item"><span class="muted small">Написать</span><span class="muted">VK и Max работают даже когда мобильный интернет ограничен</span>
          <div class="c-actions"><a class="btn btn-ghost btn-sm" href="${B.vk}" target="_blank" rel="noopener">ВКонтакте</a><a class="btn btn-ghost btn-sm" href="${B.max}" target="_blank" rel="noopener">Max</a></div></div>
      </div>
      <div class="tile map-tile"><div class="map-box">${map}</div></div>
    </div>`;
  }
  /* ——— Кабинет клиента ——— */
  function viewCabinet() {
    const mine = S.bookings.filter((b) => b.mine);
    return `<div class="page-head"><h1>Мои брони</h1><p class="lead">Статус заявки, договор и даты в одном месте.</p></div>
    <div class="bk-list">${mine.length ? mine.map((b) => { const car = S.car(b.carId) || { brand: "Машина", model: "удалена", body: "sedan", paint: "#6B7280" };
      return `<div class="bk"><div class="bimg">${RC.carVisual(car)}</div><div style="display:grid;gap:6px;min-width:0"><div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center"><b>${esc(car.brand)} ${esc(car.model)}</b>${RC.statusPill(b.status)}</div>
        <span class="muted small">${esc(b.id)} · ${U.fmtDate(b.from)} — ${U.fmtDate(b.to)}</span><span class="num">${U.rub(b.total)}${b.deposit ? " + залог " + U.rub(b.deposit) : ""}</span>
        ${b.status === "new" ? '<span class="small muted">Ждёт подтверждения владельца</span>' : b.status === "approved" ? `<span class="small" style="color:var(--go)">Подтверждена. Ждём ${U.fmtDate(b.from)} на Пушкина, 61а</span>` : b.status === "rejected" ? '<span class="small" style="color:var(--stop)">Владелец отклонил заявку. Позвоните, чтобы подобрать другую машину</span>' : ""}</div>
        <div class="bk-actions"><button class="btn btn-ghost btn-sm" data-contract="${b.id}">Договор</button><a class="btn btn-ghost btn-sm" href="#car-${b.carId}">Машина</a></div></div>`; }).join("") :
      `<div class="empty"><h3>Броней пока нет</h3><p class="muted">Выбери машину в каталоге — заявка появится здесь.</p><a class="btn btn-primary" href="#catalog">Открыть каталог</a></div>`}</div>`;
  }
  function bindCabinet() { $$("[data-contract]").forEach((b) => b.addEventListener("click", () => openContract(b.dataset.contract))); }
  RC.openContract = function openContract(id) { const b = S.booking(id), car = S.car(b.carId); RC.modal("Договор " + b.id, RC.contractHTML(b, car), "contract-modal"); };
  const openContract = RC.openContract;

  function notFound() { return `<div class="wrap empty" style="margin-block:48px"><h3>Такой страницы нет</h3><p class="muted">Возможно, машину сняли с аренды.</p><a class="btn btn-primary" href="#catalog">В каталог</a></div>`; }

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
    else if (h === "contacts") { html = viewContacts(); bind = () => $$("[data-copy]").forEach((b) => b.addEventListener("click", () => RC.copy(b.dataset.copy, b))); }
    else if (h === "cabinet") { html = viewCabinet(); bind = bindCabinet; }
    else if (h === "admin") { html = RC.admin.view(); bind = RC.admin.bind; key = "admin"; }
    else html = notFound();
    document.body.classList.toggle("is-admin", key === "admin");
    app.innerHTML = html; bind();
    $$("[data-route]").forEach((a) => { if (a.dataset.route === key) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
    const titles = { home: "", catalog: "Автопарк", terms: "Условия", contacts: "Контакты", cabinet: "Мои брони", admin: "Панель владельца" };
    document.title = (titles[key] ? titles[key] + " — " : "") + "RentCar · аренда авто в Томске";
    window.scrollTo(0, 0);
  }
  RC.route = route;
  window.addEventListener("hashchange", route);

  /* Режим экрана: Авто → День → Ночь, как свет фар */
  const MODES = { auto: ["Авто", '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/></svg>'],
    light: ["День", '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>'],
    dark: ["Ночь", '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>'] };
  let mode = "auto"; try { mode = localStorage.getItem("rc_mode") || "auto"; } catch (e) {}
  const applyMode = () => {
    if (mode === "auto") document.documentElement.removeAttribute("data-theme"); else document.documentElement.setAttribute("data-theme", mode);
    $$("[data-mode-toggle]").forEach((b) => { b.innerHTML = MODES[mode][1] + "<span>" + MODES[mode][0] + "</span>"; b.title = "Режим экрана: " + MODES[mode][0]; });
  };
  $$("[data-mode-toggle]").forEach((b) => b.addEventListener("click", () => { mode = { auto: "light", light: "dark", dark: "auto" }[mode]; try { localStorage.setItem("rc_mode", mode); } catch (e) {} applyMode(); RC.toast("Режим экрана: " + MODES[mode][0]); }));
  applyMode();
  const clock = () => { try { $("#sb-clock").textContent = new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tomsk" }); } catch (e) {} };
  clock(); setInterval(clock, 15000);

  /* Сеть: показываем, что каталог открыт из сохранённой копии */
  const net = () => { $("#offline").hidden = navigator.onLine; const n = $("#sb-net"); n.classList.toggle("off", !navigator.onLine); n.textContent = navigator.onLine ? "В сети" : "Без сети"; };
  window.addEventListener("online", net); window.addEventListener("offline", net); net();
  $("#replay-intro").addEventListener("click", () => { window.scrollTo(0, 0); RC.playIntro(); });
  $("#reset-demo").addEventListener("click", () => { S.reset(); W = null; RC.toast("Демо-данные сброшены"); route(); });

  route();
})();
