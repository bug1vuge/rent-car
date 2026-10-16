/* Онлайн-оплата и страховой сертификат.
   Оплата в демо имитирует переход на защищённую страницу банка: карта на сайте не вводится,
   деньги не списываются. В полной версии здесь будет платёжный сервис (ЮKassa, Т-Банк, СБП-эквайринг):
   сайт создаёт платёж, банк сообщает об успехе, бронь помечается оплаченной. */
(function () {
  const U = () => RC.util, esc = (s) => RC.util.esc(s);
  const ICON_SBP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7l4-3 4 3v10l-4 3-4-3zM12 7l4-3 4 3v10l-4 3-4-3z"/></svg>';
  const ICON_CARD = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 10h18M7 15h4"/></svg>';
  const ICON_LOCK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
  const ICON_OK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

  /* opts: { amount, deposit, title }  onPaid(method) */
  function open(opts, onPaid) {
    let method = "СБП";
    const m = RC.modal("Оплата аренды", `<div class="pay" id="pay-root"></div>`);
    const root = m.el.querySelector("#pay-root");
    const choose = () => {
      root.innerHTML = `
        <div class="pay-sum"><span class="muted">${esc(opts.title || "Аренда")}</span><b class="big-num">${U().rub(opts.amount)}</b>
          ${opts.deposit ? `<span class="small muted">Залог ${U().rub(opts.deposit)} замораживается на карте и снимается с блокировки после возврата машины</span>` : ""}</div>
        <div class="pay-ways" role="radiogroup" aria-label="Способ оплаты">
          ${[["СБП", "Через приложение банка, без ввода карты", ICON_SBP], ["Банковская карта", "Мир, Visa, Mastercard на странице банка", ICON_CARD]].map(([k, d, i]) => `
          <label class="pay-way"><input type="radio" name="pay-way" value="${k}" ${k === method ? "checked" : ""}>${i}<span><b>${k}</b><small>${d}</small></span></label>`).join("")}
        </div>
        <button class="btn btn-go btn-block" type="button" data-pay>Оплатить ${U().rub(opts.amount)}</button>
        <div class="secure">${ICON_LOCK}Оплата проходит на защищённой странице банка. Если бронь не подтвердят, деньги вернутся автоматически</div>
        <div class="notice small">Демо: настоящий платёж не создаётся и деньги не списываются.</div>`;
      root.querySelectorAll('[name="pay-way"]').forEach((r) => r.addEventListener("change", () => { method = r.value; }));
      root.querySelector("[data-pay]").addEventListener("click", processing);
    };
    const processing = () => {
      root.innerHTML = `<div class="pay-step"><span class="spinner" aria-hidden="true"></span><h3>Переходим на страницу банка</h3><p class="muted">${method === "СБП" ? "Подтвердите платёж в приложении банка" : "Введите данные карты на странице банка"}</p></div>`;
      setTimeout(() => {
        onPaid(method);
        root.innerHTML = `<div class="pay-step"><span class="ok-ring">${ICON_OK}</span><h3>Оплачено ${U().rub(opts.amount)}</h3><p class="muted">${esc(method)}. Чек придёт на телефон</p><button class="btn btn-primary" type="button" data-close>Готово</button></div>`;
        root.querySelector("[data-close]").addEventListener("click", m.close);
      }, 1400);
    };
    choose();
    return m;
  }

  function paymentPill(b) {
    const p = b.payment || { status: "onsite" };
    if (p.status === "paid") return `<span class="pill p-approved">Оплачено онлайн</span>`;
    if (p.status === "refunded") return `<span class="pill p-done">Деньги возвращены</span>`;
    return `<span class="pill p-done">Оплата при получении</span>`;
  }

  /* Сертификат к открытому полису владельца */
  function insuranceHTML(b, car) {
    const I = RC.BIZ.insurance, c = b.client || {}, ins = b.insurance;
    const d = (s) => U().fmtDate(s, { day: "numeric", month: "long", year: "numeric" });
    return `<div class="contract insurance-doc">
      <div class="demo-stamp">ДЕМО-ОБРАЗЕЦ · не является страховым документом</div>
      <h4>Сертификат страхования № ${esc(ins.no)}</h4>
      <div class="c-sub">к открытому полису ${esc(I.policy)} · выдан ${d(ins.issuedAt)}</div>
      <table>
        <tr><td>Страховщик</td><td>${esc(I.insurer)}</td></tr>
        <tr><td>Страхователь</td><td>${esc(RC.BIZ.lessor)}</td></tr>
        <tr><td>Вид страхования</td><td>${esc(I.kind)}${ins.kasko ? "; " + esc(I.kasko) : ""}</td></tr>
        <tr><td>Автомобиль</td><td>${esc(car.brand + " " + car.model)}, ${car.year} г. в., гос. номер ${esc(car.plate)}</td></tr>
        <tr><td>Водитель</td><td>${esc(c.name || "")}, ВУ № ${esc(c.license || "")}</td></tr>
        <tr><td>Срок действия</td><td>с ${d(b.from)} по ${d(b.to)} включительно</td></tr>
        <tr><td>Основание</td><td>Договор аренды № ${esc(b.id)}</td></tr>
      </table>
      <p style="margin-top:12px">Сертификат сформирован автоматически при подтверждении бронирования и действует вместе с открытым полисом. При ДТП сообщите номер сертификата сотруднику ГИБДД и позвоните арендодателю: ${esc(RC.BIZ.phonePretty)}.</p>
    </div>`;
  }
  function openInsurance(id) {
    const b = RC.store.booking(id), car = RC.store.car(b.carId);
    if (!b.insurance) { RC.toast("Страховка оформится автоматически после подтверждения брони"); return; }
    RC.modal("Страховка " + b.insurance.no, insuranceHTML(b, car), "contract-modal");
  }

  RC.pay = { open, paymentPill };
  RC.insurance = { html: insuranceHTML, open: openInsurance };
})();
