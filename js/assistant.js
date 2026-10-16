/* Помощник на главной. В демо отвечает по сценариям из правил проката, без внешних сервисов.
   В полной версии этот модуль заменяется ботом с тем же интерфейсом: html() и bind(). */
(function () {
  const S = RC.store, U = RC.util, B = RC.BIZ, esc = U.esc;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const ic = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${d}</svg>`;
  const QUICK = [
    ["book", "Забронировать", "свободные машины", ic('<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4M9 15l2 2 4-4"/>')],
    ["compare", "Сравнить", "классы и цены", ic('<path d="M12 3v18M5 7h14M5 7l-3 7a3 3 0 0 0 6 0zM19 7l-3 7a3 3 0 0 0 6 0z"/>')],
    ["insurance", "Страховка", "и залог", ic('<path d="M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6z"/><path d="M9 12l2 2 4-4"/>')],
    ["price", "Рассчитать", "цену на мои даты", ic('<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h2M12 12h2M8 16h2M12 16h2M16 12v4"/>')]
  ];
  const log = [];

  const rub = U.rub, fmt = (iso) => U.fmtDate(iso, { day: "numeric", month: "long" });
  const carName = (c) => c.brand + " " + c.model;
  const freeOn = (from, to) => S.visibleCars().filter((c) => S.isFree(c, from, to));

  function weekend() {
    const t = U.today(); let sat = U.addDays(t, (6 - t.getDay() + 7) % 7 || 7);
    if (t.getDay() === 6) sat = t;
    return [U.iso(sat), U.iso(U.addDays(sat, 2))];
  }

  /* Сценарии: каждый возвращает текст и кнопки действий */
  const intents = {
    book() {
      const { from, to } = RC.home.dates(); const free = freeOn(from, to);
      return { text: `На ${fmt(from)} — ${fmt(to)} свободно ${free.length} ${U.plural(free.length, "машина", "машины", "машин")}: ${free.slice(0, 4).map(carName).join(", ")}${free.length > 4 ? " и другие" : ""}. Даты можно поменять в виджете «Мои даты».`,
        acts: [["Показать свободные", "catalog-dates"], ["Забронировать машину на сцене", "book-stage"]] };
    },
    compare() {
      const rows = Object.entries(RC.CLASSES).map(([k, v]) => { const cars = S.visibleCars().filter((c) => c.cls === k); if (!cars.length) return ""; return `${v.label}: от ${Math.min(...cars.map((c) => c.prices[3])).toLocaleString("ru-RU")} ₽, залог ${rub(v.deposit)}, с ${v.minAge} лет`; }).filter(Boolean);
      return { text: rows.join(". ") + ". Переключай классы на сцене слева, чтобы посмотреть машины.", acts: [["Эконом", "cls-econom"], ["Комфорт", "cls-comfort"], ["Премиум", "cls-premium"]] };
    },
    insurance() {
      return { text: `Все машины застрахованы по открытому полису: после подтверждения брони страховка на тебя и твои даты оформляется автоматически и появляется в «Моих бронях». ОСАГО на всех машинах, на премиуме ещё КАСКО, франшиза 30 000 ₽. Залог: эконом ${rub(RC.CLASSES.econom.deposit)}, комфорт ${rub(RC.CLASSES.comfort.deposit)}, премиум ${rub(RC.CLASSES.premium.deposit)}. Можно взять без залога за +25% к цене.`, acts: [["Все условия", "terms"]] };
    },
    price() {
      const car = RC.home.car(); const { from, to } = RC.home.dates(); const q = S.quote(car, from, to, []); const free = S.isFree(car, from, to);
      return { text: `${carName(car)}, ${fmt(from)} — ${fmt(to)}: ${q.days} ${U.plural(q.days, "сутки", "суток", "суток")} по ${rub(q.perDay)}, итого ${rub(q.base)} и залог ${rub(q.deposit)}, его вернём. ${free ? "На эти даты машина свободна." : "На эти даты она занята, посмотри другие свободные."}`,
        acts: free ? [["Забронировать", "book-stage"]] : [["Свободные на эти даты", "catalog-dates"]] };
    }
  };

  /* Свободный текст: даты и ключевые слова */
  const RULES = [
    [/возраст|стаж|сколько лет|со скольки/, () => ({ text: "Эконом и комфорт — с 21 года и стажем от 2 лет. Премиум — с 25 лет и стажем от 5 лет.", acts: [] })],
    [/выходн/, () => { const [f, t] = weekend(); RC.home.setDates(f, t); return intents.book(); }],
    [/завтра/, () => { const f = U.iso(U.addDays(U.today(), 1)); const m = text.match(/(\d+)\s*(дн|сут|дней)/); RC.home.setDates(f, U.iso(U.addDays(U.parse(f), m ? +m[1] : 1))); return intents.book(); }],
    [/(\d+)\s*(дн|сут|ден|недел)/, (m) => { const n = /недел/.test(m[2]) ? +m[1] * 7 : +m[1]; const f = RC.home.dates().from; RC.home.setDates(f, U.iso(U.addDays(U.parse(f), Math.max(1, Math.min(60, n))))); return intents.price(); }],
    [/сколько|цен|стоит|стоимост|рассчит|посчит/, () => intents.price()],
    [/сравн|класс|какие машин|что есть|автопарк/, () => intents.compare()],
    [/свобод|бронир|забронир|взять|аренд/, () => intents.book()],
    [/страхов|осаго|каско|франшиз/, () => intents.insurance()],
    [/залог|депозит/, () => intents.insurance()],
    [/такси|работ/, () => ({ text: "Под такси подходят Granta, Bora и Changan, от 7 суток. Bora стоит на газу, километр выходит в 2–3 раза дешевле бензина. С 14 суток цена за сутки ещё ниже.", acts: [["Машины под такси", "taxi"]] })],
    [/документ|паспорт|прав/, () => ({ text: "Нужны паспорт РФ и права категории B. Фото загружаешь при бронировании, на месте только сверяем оригиналы.", acts: [] })],
    [/пробег|км|километр/, () => ({ text: "Лимит 300 км в сутки (премиум 250 км), сверх — 5 ₽ за км. Можно взять опцию «Без лимита» за 400 ₽ в сутки.", acts: [] })],
    [/бак|бензин|топлив|заправ/, () => ({ text: "Выдаём с полным баком и так же принимаем. Если вернёшь неполный, дозаправку посчитаем по цене АЗС плюс 300 ₽.", acts: [] })],
    [/штраф|гибдд|камер/, () => ({ text: "Штрафы ГИБДД за период аренды оплачивает арендатор. Если штраф придёт позже, удержим его из залога, поэтому залог возвращаем через 10 дней.", acts: [] })],
    [/дтп|авари|сломал|поломк/, () => ({ text: `Не двигай машину, звони в ГИБДД и нам: ${B.phonePretty}. Ущерб покрывает ОСАГО, на премиуме ещё КАСКО.`, acts: [["Контакты", "contacts"]] })],
    [/продл/, () => ({ text: "Напиши или позвони за 12 часов до конца аренды. Если машина свободна, продлим по тарифу итогового срока.", acts: [] })],
    [/достав|подач|привез/, () => ({ text: "Подадим машину по Томску за 500 ₽. Отметь опцию «Подача» при бронировании.", acts: [] })],
    [/где|адрес|находит|забрать/, () => ({ text: `Машины стоят на ${B.address}, у Мерседес-центра, парковка у шоурума. ${B.hours}.`, acts: [["Открыть на карте", "contacts"]] })],
    [/телефон|позвон|связ|номер/, () => ({ text: `Телефон: ${B.phonePretty}. Короткий городской — ${B.phoneShort}.`, acts: [["Контакты", "contacts"]] })],
    [/оплат|карт|сбп|налич/, () => ({ text: "Можно оплатить онлайн прямо при бронировании — по СБП или картой на странице банка, залог при этом только замораживается. Или на месте: наличные, карта, СБП.", acts: [["Забронировать машину на сцене", "book-stage"]] })],
    [/привет|здравств|добр/, () => ({ text: "Привет! Подскажу по машинам, ценам и условиям. Можно написать, например: «на выходные», «сколько за 5 дней» или «нужен залог?».", acts: [] })]
  ];
  let text = "";
  function answer(q) {
    text = q.toLowerCase();
    for (const [re, fn] of RULES) { const m = text.match(re); if (m) return fn(m); }
    return { text: `Такой вопрос лучше обсудить с менеджером: ${B.phonePretty}. А я могу подобрать машину, посчитать цену или рассказать про залог и страховку.`, acts: [["Подобрать машину", "q-book"], ["Рассчитать цену", "q-price"]] };
  }

  function msgHTML(m) {
    return `<div class="msg ${m.me ? "me" : "bot"}">${esc(m.text)}${m.acts && m.acts.length ? `<div class="acts">${m.acts.map(([l, a]) => `<button type="button" data-act="${a}">${esc(l)}</button>`).join("")}</div>` : ""}</div>`;
  }

  function html() {
    return `<div class="as-head"><div><h2>Помощник</h2><p>Чем помочь сегодня?</p></div><span class="as-spark" aria-hidden="true">${ic('<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>')}</span></div>
      <div class="as-quick">${QUICK.map(([k, t, s, i]) => `<button type="button" data-q="${k}" data-label="${t} ${s}">${i}<span>${t}<br><small>${s}</small></span></button>`).join("")}</div>
      <div class="as-log" id="as-log" aria-live="polite">${log.map(msgHTML).join("")}</div>
      <form class="as-form" id="as-form">
        <label class="sr" for="as-input" hidden>Вопрос помощнику</label>
        <textarea class="input" id="as-input" rows="2" placeholder="Например: машина на выходные"></textarea>
        <div class="as-form-row"><span class="muted">Отвечает по правилам проката. В полной версии — бот в Max и VK.</span><button class="btn btn-primary" type="submit">Отправить</button></div>
      </form>`;
  }

  function bind(root) {
    if (!root) return;
    const logEl = $("#as-log", root);
    const push = (m) => { log.push(m); if (log.length > 30) log.shift(); logEl.insertAdjacentHTML("beforeend", msgHTML(m)); logEl.scrollTop = logEl.scrollHeight; };
    const reply = (fnOrAnswer) => setTimeout(() => push(Object.assign({ me: false }, typeof fnOrAnswer === "function" ? fnOrAnswer() : fnOrAnswer)), 280);
    $$("[data-q]", root).forEach((b) => b.addEventListener("click", () => { push({ me: true, text: b.dataset.label }); reply(intents[b.dataset.q]); }));
    $("#as-form", root).addEventListener("submit", (e) => { e.preventDefault(); const inp = $("#as-input", root); const q = inp.value.trim(); if (!q) return; inp.value = ""; push({ me: true, text: q }); reply(() => answer(q)); });
    $("#as-input", root).addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); $("#as-form", root).requestSubmit(); } });
    logEl.addEventListener("click", (e) => {
      const b = e.target.closest("[data-act]"); if (!b) return; const a = b.dataset.act;
      if (a === "catalog-dates") { RC.home.filtersFor({ onlyFree: true }); location.hash = "catalog"; }
      else if (a === "book-stage") { const c = RC.home.car(); location.hash = "car-" + c.id; }
      else if (a.startsWith("cls-")) { RC.home.setClass(a.slice(4)); }
      else if (a === "taxi") { RC.home.filtersFor({ taxi: true, cls: [] }); location.hash = "catalog"; }
      else if (a === "q-book") { push({ me: true, text: "Подобрать машину" }); reply(intents.book); }
      else if (a === "q-price") { push({ me: true, text: "Рассчитать цену" }); reply(intents.price); }
      else location.hash = a;
    });
    if (!log.length) push({ me: false, text: "Привет! Я помогу выбрать машину и посчитать цену. Нажми на быструю кнопку или напиши вопрос." });
    else logEl.scrollTop = logEl.scrollHeight;
  }

  RC.assistant = { html, bind };
})();
