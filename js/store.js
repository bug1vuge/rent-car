/* Хранилище демо-версии: всё живёт в localStorage браузера.
   В полной версии этот модуль заменяется на запросы к API — интерфейс тот же. */
window.RC = window.RC || {};

RC.util = {
  today() { const d = new Date(); d.setHours(0, 0, 0, 0); return d; },
  addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; },
  iso(d) { const z = (n) => String(n).padStart(2, "0"); return d.getFullYear() + "-" + z(d.getMonth() + 1) + "-" + z(d.getDate()); },
  parse(s) { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); },
  days(from, to) { return Math.round((RC.util.parse(to) - RC.util.parse(from)) / 864e5); },
  fmtDate(s, opts) { return RC.util.parse(s).toLocaleDateString("ru-RU", opts || { day: "numeric", month: "long" }); },
  rub(n) { return Math.round(n).toLocaleString("ru-RU") + " ₽"; },
  esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); },
  plural(n, a, b, c) { n = Math.abs(n) % 100; const n1 = n % 10; if (n > 10 && n < 20) return c; if (n1 > 1 && n1 < 5) return b; if (n1 === 1) return a; return c; },
  yearsSince(s) { if (!s) return 0; const d = RC.util.parse(s), t = RC.util.today(); let y = t.getFullYear() - d.getFullYear(); if (t < new Date(t.getFullYear(), d.getMonth(), d.getDate())) y--; return y; },
  overlap(aFrom, aTo, bFrom, bTo) { return aFrom < bTo && bFrom < aTo; }
};

RC.store = (function () {
  const KEY = "rc_demo_v3";
  let state = null;

  function load() {
    try { const raw = localStorage.getItem(KEY); if (raw) state = JSON.parse(raw); } catch (e) { state = null; }
    if (!state || !state.cars) reset(false);
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* хранилище недоступно: работаем в памяти */ } }
  function reset(doSave = true) {
    state = { cars: JSON.parse(JSON.stringify(RC.SEED_CARS)), bookings: RC.seedBookings(), seq: 1047 };
    state.bookings.forEach((b) => {
      const car = state.cars.find((c) => c.id === b.carId); const q = quote(car, b.from, b.to, b.extras); b.total = q.total; b.deposit = q.deposit;
      b.payment = b.payment ? Object.assign({ amount: q.total, depositHeld: q.deposit, paidAt: b.createdAt }, b.payment) : { status: "onsite" };
      if (["approved", "active", "done"].includes(b.status)) issueInsurance(b, false);
    });
    if (doSave) save(); else save();
  }

  /* Брони, которые реально блокируют машину */
  const BLOCKING = ["approved", "active"];

  function carBookings(carId, statuses) {
    return state.bookings.filter((b) => b.carId === carId && (!statuses || statuses.includes(b.status)));
  }
  function isFree(car, from, to) {
    if (car.status === "service" || car.status === "hidden") return false;
    return !carBookings(car.id, BLOCKING).some((b) => RC.util.overlap(from, to, b.from, b.to));
  }
  /* Статус на сегодня для карточки */
  function liveStatus(car) {
    const t = RC.util.iso(RC.util.today()), t1 = RC.util.iso(RC.util.addDays(RC.util.today(), 1));
    if (car.status === "service") return { key: "service", label: "На ТО" };
    const cur = carBookings(car.id, BLOCKING).find((b) => RC.util.overlap(t, t1, b.from, b.to));
    if (cur) return { key: "busy", label: "Занята до " + RC.util.fmtDate(cur.to, { day: "numeric", month: "short" }), until: cur.to };
    return { key: "free", label: "Свободна сегодня" };
  }
  function tierIndex(days) { return RC.TIERS.findIndex((t) => days >= t.from && days <= t.to); }

  function quote(car, from, to, extras) {
    const days = Math.max(1, RC.util.days(from, to));
    const ti = Math.max(0, tierIndex(days));
    const perDay = car.prices[ti];
    const base = perDay * days;
    const lines = [{ label: perDay.toLocaleString("ru-RU") + " ₽ × " + days + " " + RC.util.plural(days, "сутки", "суток", "суток"), sum: base }];
    let total = base, deposit = RC.CLASSES[car.cls].deposit;
    (extras || []).forEach((id) => {
      const x = RC.EXTRAS.find((e) => e.id === id); if (!x) return;
      let sum = 0;
      if (x.per === "once") sum = x.price;
      if (x.per === "day") sum = x.price * days;
      if (x.per === "pct") { sum = Math.round(base * x.price); deposit = 0; }
      lines.push({ label: x.label, sum }); total += sum;
    });
    return { days, perDay, tier: ti, base, lines, total, deposit };
  }

  function addBooking(b) {
    b.id = "RC-" + state.seq++;
    b.createdAt = RC.util.iso(RC.util.today());
    b.status = "new";
    state.bookings.unshift(b); save(); return b;
  }
  function setStatus(id, status) {
    const b = state.bookings.find((x) => x.id === id); if (!b) return b;
    b.status = status;
    if (status === "approved") issueInsurance(b, false);              // страховка выписывается сама при подтверждении
    if (status === "rejected" && b.payment && b.payment.status === "paid") b.payment.status = "refunded"; // возврат денег
    save(); return b;
  }
  /* Сертификат к открытому полису владельца: на конкретную машину, водителя и срок аренды */
  function issueInsurance(b, doSave = true) {
    if (b.insurance) return b.insurance;
    const car = state.cars.find((c) => c.id === b.carId);
    b.insurance = { no: RC.BIZ.insurance.prefix + "-" + b.id.replace(/\D/g, "") + "-" + (car ? car.plate.replace(/\s/g, "").slice(-3) : "000"),
      issuedAt: RC.util.iso(RC.util.today()), kasko: !!car && car.cls === "premium" };
    if (doSave) save(); return b.insurance;
  }
  function setPaid(id, method) {
    const b = state.bookings.find((x) => x.id === id); if (!b) return b;
    b.payment = { status: "paid", method, amount: b.total, depositHeld: b.deposit, paidAt: RC.util.iso(RC.util.today()) };
    save(); return b;
  }
  function updateCar(id, patch) { const c = state.cars.find((x) => x.id === id); if (c) { Object.assign(c, patch); save(); } return c; }
  function addCar(car) { state.cars.push(car); save(); }
  function removeCar(id) { state.cars = state.cars.filter((c) => c.id !== id); save(); }

  load();
  return {
    get cars() { return state.cars; },
    get bookings() { return state.bookings; },
    car: (id) => state.cars.find((c) => c.id === id),
    booking: (id) => state.bookings.find((b) => b.id === id),
    visibleCars: () => state.cars.filter((c) => c.status !== "hidden"),
    carBookings, isFree, liveStatus, quote, tierIndex, addBooking, setStatus, setPaid, issueInsurance, updateCar, addCar, removeCar, reset, save, BLOCKING
  };
})();
