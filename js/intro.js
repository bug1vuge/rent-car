/* Заставка при первом открытии за сессию: машина едет по дороге справа налево, колёса крутятся,
   затем резкое торможение — колёса блокируются, нос клюёт, горят стоп-сигналы, остаются следы юза
   и летит песок. Клик, Esc или кнопка — пропустить. */
(function () {
  const KEY = "rc_intro";
  const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  let seen = false; try { seen = sessionStorage.getItem(KEY) === "1"; } catch (e) {}
  window.RC = window.RC || {};
  RC.playIntro = play;
  if (seen || reduce) return;
  try { sessionStorage.setItem(KEY, "1"); } catch (e) {}
  document.documentElement.classList.add("intro-on"); // прячем сайт до появления заставки, чтобы не мигал
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", play); else play();

  function play() {
    if (document.querySelector(".intro") || !RC.silhouette) { document.documentElement.classList.remove("intro-on"); return; }
    const BODY = "sedan", info = RC.silhouetteInfo(BODY);
    const root = document.createElement("div");
    root.className = "intro"; root.setAttribute("role", "presentation");
    root.innerHTML = `<canvas class="intro-fx"></canvas>
      <div class="intro-road"><i></i></div>
      <div class="intro-car">${RC.silhouette(BODY, "#DCE1E7")}</div>
      <canvas class="intro-front"></canvas>
      <div class="intro-brand"><b>RentCar</b><span>аренда авто · Томск</span></div>
      <button type="button" class="intro-skip">Пропустить</button>`;
    document.body.appendChild(root);
    const fx = root.querySelector(".intro-fx"), g = fx.getContext("2d");
    const front = root.querySelector(".intro-front"), gf = front.getContext("2d");
    const car = root.querySelector(".intro-car"), brand = root.querySelector(".intro-brand");
    const rims = [...car.querySelectorAll(".sil-rim")];

    const css = getComputedStyle(document.documentElement);
    const bg = css.getPropertyValue("--bg").trim() || "#07090D";
    const isDark = (() => { const n = parseInt(bg.replace("#", "").slice(0, 6), 16); return ((n >> 16) * .3 + ((n >> 8) & 255) * .59 + (n & 255) * .11) < 128; })();
    const dustRGB = isDark ? "212,184,138" : "170,134,88";
    const skidRGB = isDark ? "0,0,0" : "20,16,12";
    const sand = ["#D9B77E", "#C79A5B", "#E8D1A4", "#A87E48", "#F1E3C2"];

    let W, H, dpr, carW, carH, roadY, k;
    const size = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1); W = innerWidth; H = innerHeight;
      [fx, front].forEach((c) => { c.width = W * dpr; c.height = H * dpr; c.getContext("2d").setTransform(dpr, 0, 0, dpr, 0, 0); });
      carW = Math.min(Math.max(W * .78, 320), 760); carH = carW * 190 / 480; k = carW / 480;
      roadY = Math.round(H * .62);
      car.style.width = carW + "px";
      root.style.setProperty("--road-y", roadY + "px");
    };
    size(); addEventListener("resize", size);

    // Касание колёс дороги: низ шины = 150 + r в координатах силуэта
    const contactY = info.wheelY + info.r;
    const carTop = () => roadY - contactY * k;

    const T_DRIVE = 620, T_STOP = 1250, T_BRAND = 1350, T_END = 2900;
    const targetX = () => W / 2 - carW / 2;
    const startX = () => W + 40;
    const brakeX = () => targetX() + Math.min(W * .32, 380);
    const easeOut = (p) => 1 - Math.pow(1 - p, 3);
    const carX = (t) => t <= T_DRIVE ? startX() + (brakeX() - startX()) * (t / T_DRIVE)
      : t <= T_STOP ? brakeX() + (targetX() - brakeX()) * easeOut((t - T_DRIVE) / (T_STOP - T_DRIVE)) : targetX();
    const pitch = (t) => { // нос вниз при торможении, затем отскок назад
      if (t < T_DRIVE) return 0;
      if (t < T_STOP) return -2.6 * Math.sin(Math.min(1, (t - T_DRIVE) / 260) * Math.PI / 2);
      const q = (t - T_STOP) / 520; return q > 1 ? 0 : -2.6 * Math.cos(q * Math.PI * 1.6) * Math.pow(1 - q, 1.4);
    };

    const parts = [], puffs = [], skids = info.wheels.map(() => ({ from: null, to: null }));
    let start = 0, last = 0, prevX = null, spin = 0, done = false, brandShown = false;
    const wheelPt = (i, x) => ({ x: x + info.wheels[i] * k, y: roadY });

    function emit(x, strong) {
      info.wheels.forEach((_, i) => {
        const p = wheelPt(i, x), n = strong ? (i === 0 ? 14 : 10) : 1;
        for (let j = 0; j < n; j++) parts.push({ x: p.x + (Math.random() - .5) * info.r * k * 1.4, y: p.y - 2,
          vx: -(1.5 + Math.random() * 9) * (strong ? 1 : .3), vy: -(1 + Math.random() * 7) * (strong ? 1 : .4),
          r: .8 + Math.random() * 2.4, life: 1, decay: .009 + Math.random() * .016, c: sand[(Math.random() * sand.length) | 0] });
        const np = strong ? (Math.random() < .7 ? 1 : 0) : (Math.random() < .12 ? 1 : 0);
        for (let j = 0; j < np; j++) puffs.push({ x: p.x + Math.random() * 26, y: p.y - 6 - Math.random() * 14, r: 10 + Math.random() * 14,
          vr: 1.1 + Math.random() * 1.6, vx: 1 + Math.random() * 2.2, vy: -.25 - Math.random() * .5, a: (strong ? .17 : .08) + Math.random() * .08 });
      });
    }

    function frame(now) {
      if (done) return;
      if (!start) start = last = now;
      const t = now - start, dt = Math.min(40, now - last) / 16.7; last = now;
      const x = carX(t), v = prevX == null ? 0 : prevX - x; prevX = x;   // скорость, px за кадр
      const driving = t < T_DRIVE, braking = t >= T_DRIVE && t < T_STOP;

      // колёса: крутятся пропорционально скорости, при торможении блокируются (юз)
      if (driving) spin -= (v / (info.r * k)) * 57.3;
      else if (t < T_DRIVE + 80) spin -= (v / (info.r * k)) * 57.3 * (1 - (t - T_DRIVE) / 80);
      rims.forEach((r) => r.setAttribute("transform", `rotate(${spin.toFixed(1)} ${r.dataset.cx} ${info.wheelY})`));

      const bounce = driving ? Math.sin(t / 38) * .8 : 0;
      car.style.transform = `translate(${x}px, ${carTop() + bounce}px) rotate(${pitch(t)}deg)`;

      if (t >= T_DRIVE) skids.forEach((s, i) => { const p = wheelPt(i, x); if (!s.from) s.from = p; if (t < T_STOP) s.to = p; });
      if (braking) emit(x, true); else if (driving && Math.random() < .35) emit(x, false);

      g.clearRect(0, 0, W, H); gf.clearRect(0, 0, W, H);
      // фары: луч вперёд по дороге
      const hx = x + info.head.x * k, hy = carTop() + info.head.y * k;
      if (isDark) { const beam = g.createLinearGradient(hx, 0, hx - carW * 1.1, 0); beam.addColorStop(0, "rgba(220,235,255,.22)"); beam.addColorStop(1, "rgba(220,235,255,0)");
        g.fillStyle = beam; g.beginPath(); g.moveTo(hx, hy - 6); g.lineTo(hx - carW * 1.1, roadY - carH * .32); g.lineTo(hx - carW * 1.1, roadY + 26); g.lineTo(hx, hy + 8); g.closePath(); g.fill(); }
      // полосы скорости
      if (t < T_DRIVE + 160) { const a = t < T_DRIVE ? .32 : .32 * (1 - (t - T_DRIVE) / 160);
        g.strokeStyle = isDark ? `rgba(160,180,210,${a})` : `rgba(60,70,90,${a * .7})`; g.lineWidth = 1.4;
        for (let j = 0; j < 7; j++) { const y = carTop() + carH * (.3 + j * .08); g.beginPath(); g.moveTo(x + carW * (.97 + (j % 3) * .02), y); g.lineTo(x + carW + 90 + j * 46, y); g.stroke(); } }
      // следы юза
      skids.forEach((s) => { if (!s.from || !s.to) return; const gr = g.createLinearGradient(s.to.x, 0, s.from.x, 0);
        gr.addColorStop(0, `rgba(${skidRGB},.7)`); gr.addColorStop(1, `rgba(${skidRGB},0)`);
        g.strokeStyle = gr; g.lineWidth = Math.max(4, 7 * k); g.lineCap = "round"; g.beginPath(); g.moveTo(s.to.x, s.to.y + 2); g.lineTo(s.from.x, s.from.y + 2); g.stroke(); });
      // стоп-сигналы
      if (t >= T_DRIVE && t < T_STOP + 700) { const tx = x + info.tail.x * k, ty = carTop() + info.tail.y * k; const a = t < T_STOP + 300 ? .85 : .85 * (1 - (t - T_STOP - 300) / 400);
        const rg = gf.createRadialGradient(tx, ty, 0, tx, ty, 46 * k + 10); rg.addColorStop(0, `rgba(255,60,60,${a})`); rg.addColorStop(1, "rgba(255,60,60,0)"); gf.fillStyle = rg; gf.beginPath(); gf.arc(tx, ty, 46 * k + 10, 0, 7); gf.fill(); }
      // пыль и песок поверх машины
      for (let i = puffs.length - 1; i >= 0; i--) { const p = puffs[i]; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt; p.a -= .0028 * dt;
        if (p.a <= 0) { puffs.splice(i, 1); continue; }
        const rg = gf.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r); rg.addColorStop(0, `rgba(${dustRGB},${p.a})`); rg.addColorStop(.6, `rgba(${dustRGB},${p.a * .45})`); rg.addColorStop(1, `rgba(${dustRGB},0)`);
        g.fillStyle = rg; g.beginPath(); g.arc(p.x, p.y, p.r, 0, 7); g.fill(); }
      for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.vy += .32 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .985; p.life -= p.decay * dt;
        if (p.y > roadY + 4) { p.y = roadY + 4; p.vy *= -.25; p.vx *= .6; }
        if (p.life <= 0) { parts.splice(i, 1); continue; }
        gf.globalAlpha = p.life; gf.fillStyle = p.c; gf.beginPath(); gf.arc(p.x, p.y, p.r, 0, 7); gf.fill(); }
      gf.globalAlpha = 1;

      if (t > T_BRAND && !brandShown) { brandShown = true; brand.classList.add("on"); }
      if (t > T_END) return finish();
      requestAnimationFrame(frame);
    }

    function finish() {
      if (done) return; done = true;
      root.classList.add("out"); document.documentElement.classList.remove("intro-on"); removeEventListener("resize", size); removeEventListener("keydown", onKey);
      setTimeout(() => root.remove(), 600);
    }
    const onKey = (e) => { if (e.key === "Escape" || e.key === "Enter" || e.key === " ") finish(); };
    root.addEventListener("click", finish); addEventListener("keydown", onKey);
    requestAnimationFrame(frame);
  }
})();
