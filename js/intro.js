/* Заставка при первом открытии за сессию: машина влетает справа, резко тормозит,
   клюёт носом, из-под колёс летит песок и остаются следы шин. Клик или Esc — пропустить. */
(function () {
  const KEY = "rc_intro";
  const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  let seen = false; try { seen = sessionStorage.getItem(KEY) === "1"; } catch (e) {}
  window.RC = window.RC || {};
  RC.playIntro = play;
  if (seen || reduce) return;
  try { sessionStorage.setItem(KEY, "1"); } catch (e) {}
  play();

  function play() {
    if (document.querySelector(".intro")) return;
    const root = document.createElement("div");
    root.className = "intro"; root.setAttribute("role", "presentation");
    root.innerHTML = `<canvas></canvas><div class="intro-ground"></div>
      <img class="intro-car" src="img/cut-granta.webp" alt="">
      <div class="intro-brand"><b>RentCar</b><span>аренда авто · Томск</span></div>
      <button type="button" class="intro-skip">Пропустить</button>`;
    document.body.appendChild(root);
    const cv = root.querySelector("canvas"), g = cv.getContext("2d");
    const car = root.querySelector(".intro-car"), brand = root.querySelector(".intro-brand");
    let W = 0, H = 0, dpr = 1, carW = 0, carH = 0, groundY = 0;
    const size = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1); W = innerWidth; H = innerHeight;
      cv.width = W * dpr; cv.height = H * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0);
      carW = car.getBoundingClientRect().width || Math.min(W * .62, 600); carH = carW * (247 / 467); groundY = H * .64;
    };
    size(); addEventListener("resize", size);

    // Точки касания колёс относительно картинки (фото в ракурсе 3/4, переднее колесо ниже)
    const WHEELS = [{ x: .45, y: .985 }, { x: .905, y: .82 }];
    const T_FAST = 430, T_STOP = 980, T_BRAND = 1050, T_END = 2600;
    const targetX = () => W / 2 - carW * .55;
    const startX = () => W + carW * .15;
    const brakeX = () => targetX() + Math.min(W * .3, 340);
    const easeOut = (p) => 1 - Math.pow(1 - p, 4);

    // На тёмном фоне след и пыль светлее, на светлом — темнее
    const bg = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim() || "#07090D";
    const isDark = (() => { const n = parseInt(bg.replace("#", "").slice(0, 6), 16); return (((n >> 16) * .3 + ((n >> 8) & 255) * .59 + (n & 255) * .11) < 128); })();
    const dustRGB = isDark ? "214,186,140" : "176,140,92";
    const skidRGBA = (a) => isDark ? `rgba(120,110,98,${a * .75})` : `rgba(28,22,16,${a})`;
    const sand = ["#D9B77E", "#C79A5B", "#E8D1A4", "#A87E48", "#F1E3C2"];
    const parts = [], puffs = [], skids = WHEELS.map(() => ({ from: null, to: null }));
    let start = 0, last = 0, done = false, brandShown = false;

    function carX(t) {
      if (t <= T_FAST) return startX() + (brakeX() - startX()) * (t / T_FAST);
      if (t <= T_STOP) return brakeX() + (targetX() - brakeX()) * easeOut((t - T_FAST) / (T_STOP - T_FAST));
      return targetX();
    }
    function pitch(t) { // клевок носом при торможении и отскок назад
      if (t < T_FAST) return 0;
      if (t < T_STOP) return -3.2 * Math.sin(Math.PI * .5 * (t - T_FAST) / (T_STOP - T_FAST));
      const k = (t - T_STOP) / 420; return k > 1 ? 0 : -3.2 * Math.cos(k * Math.PI * 1.5) * (1 - k);
    }
    function wheelPoint(i, x) { return { x: x + WHEELS[i].x * carW, y: groundY - carH + WHEELS[i].y * carH }; }

    function emit(t, x, braking) {
      WHEELS.forEach((_, i) => {
        const p = wheelPoint(i, x);
        const n = braking ? (i === 0 ? 16 : 11) : 2;
        for (let k = 0; k < n; k++) parts.push({
          x: p.x + (Math.random() - .5) * 18, y: p.y - Math.random() * 4,
          vx: (Math.random() < .25 ? 1 : -1) * (2 + Math.random() * 10) * (braking ? 1 : .4), vy: -(1.5 + Math.random() * 8),
          r: .8 + Math.random() * 2.6, life: 1, decay: .008 + Math.random() * .016, c: sand[(Math.random() * sand.length) | 0]
        });
        const np = braking ? 2 : (Math.random() < .3 ? 1 : 0);
        for (let k = 0; k < np; k++) puffs.push({ x: p.x + 6 + Math.random() * 30, y: p.y - 4 - Math.random() * 12, r: 10 + Math.random() * 16, vr: 1.4 + Math.random() * 2.2, vx: (braking ? -.4 : .4) + Math.random() * 2.2, vy: -.25 - Math.random() * .7, a: (braking ? .32 : .16) + Math.random() * .16 });
      });
    }

    function frame(now) {
      if (done) return;
      if (!start) start = last = now;
      const t = now - start, dt = Math.min(40, now - last) / 16.7; last = now;
      const x = carX(t), braking = t > T_FAST && t < T_STOP + 60;

      // машина
      const blur = t < T_FAST ? 3.5 : Math.max(0, 3.5 * (1 - (t - T_FAST) / 200));
      car.style.transform = `translate(${x}px, ${groundY - carH}px) rotate(${pitch(t)}deg)`;
      car.style.filter = `blur(${blur.toFixed(2)}px) drop-shadow(0 22px 18px rgba(0,0,0,.45))`;

      // следы шин
      if (t > T_FAST) WHEELS.forEach((_, i) => { const p = wheelPoint(i, x); const s = skids[i]; if (!s.from) s.from = { ...p }; if (t < T_STOP) s.to = { ...p }; });
      if (braking) emit(t, x, true); else if (t < T_FAST) { if (Math.random() < .5) emit(t, x, false); }

      g.clearRect(0, 0, W, H);
      // полосы скорости до торможения
      if (t < T_FAST + 120) {
        const a = t < T_FAST ? .35 : .35 * (1 - (t - T_FAST) / 120);
        g.strokeStyle = `rgba(150,170,200,${a})`; g.lineWidth = 1.5;
        for (let k = 0; k < 6; k++) { const y = groundY - carH * (.25 + k * .11); const len = 80 + k * 30; g.beginPath(); g.moveTo(x + carW * (.95 + k * .03), y); g.lineTo(x + carW + len + k * 40, y); g.stroke(); }
      }
      // тормозной след
      skids.forEach((s) => { if (!s.from || !s.to) return; const grad = g.createLinearGradient(s.to.x, 0, s.from.x, 0); grad.addColorStop(0, skidRGBA(.6)); grad.addColorStop(1, skidRGBA(0));
        g.strokeStyle = grad; g.lineWidth = 8; g.lineCap = "round"; g.beginPath(); g.moveTo(s.to.x, s.to.y); g.lineTo(s.from.x, s.from.y); g.stroke(); });
      // облака пыли
      for (let i = puffs.length - 1; i >= 0; i--) { const p = puffs[i]; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt; p.a -= .0032 * dt;
        if (p.a <= 0) { puffs.splice(i, 1); continue; }
        const rg = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r); rg.addColorStop(0, `rgba(${dustRGB},${p.a})`); rg.addColorStop(.6, `rgba(${dustRGB},${p.a * .45})`); rg.addColorStop(1, `rgba(${dustRGB},0)`);
        g.fillStyle = rg; g.beginPath(); g.arc(p.x, p.y, p.r, 0, Math.PI * 2); g.fill(); }
      // песчинки
      for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.vy += .32 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .985; p.life -= p.decay * dt;
        if (p.y > groundY + 6) { p.y = groundY + 6; p.vy *= -.25; p.vx *= .6; }
        if (p.life <= 0) { parts.splice(i, 1); continue; }
        g.globalAlpha = Math.max(0, p.life); g.fillStyle = p.c; g.beginPath(); g.arc(p.x, p.y, p.r, 0, Math.PI * 2); g.fill(); }
      g.globalAlpha = 1;

      if (t > T_BRAND && !brandShown) { brandShown = true; brand.classList.add("on"); }
      if (t > T_END) return finish();
      requestAnimationFrame(frame);
    }

    function finish() {
      if (done) return; done = true;
      root.classList.add("out"); removeEventListener("resize", size); removeEventListener("keydown", onKey);
      setTimeout(() => root.remove(), 600);
    }
    const onKey = (e) => { if (e.key === "Escape" || e.key === "Enter" || e.key === " ") finish(); };
    root.addEventListener("click", finish); addEventListener("keydown", onKey);
    const go = () => requestAnimationFrame(frame);
    if (car.complete) go(); else { car.onload = go; car.onerror = finish; setTimeout(() => { if (!start) go(); }, 900); }
  }
})();
