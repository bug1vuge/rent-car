/* Векторные силуэты для машин без фото. Профиль, нос слева, цвет кузова задаётся в данных.
   RC.carVisual(car) возвращает разметку картинки для любой машины: фото без фона, фото или силуэт. */
window.RC = window.RC || {};
(function () {
  let uid = 0;
  const shade = (hex, k) => {
    const n = parseInt(hex.replace("#", ""), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const t = k > 0 ? 255 : 0, a = Math.abs(k);
    r = Math.round(r + (t - r) * a); g = Math.round(g + (t - g) * a); b = Math.round(b + (t - b) * a);
    return "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
  };
  const BODIES = {
    sedan: {
      body: "M24 138 C22 122 30 112 52 108 L118 100 C146 78 176 64 214 60 L292 58 C328 60 352 74 380 98 L428 106 C450 110 458 120 458 134 L458 146 C458 150 455 152 450 152 L34 152 C28 152 25 148 24 142 Z",
      glass: ["M150 100 C170 82 190 72 220 69 L258 68 L260 100 Z", "M270 68 L292 68 C318 70 336 82 356 100 L272 100 Z"],
      wheels: [116, 378], r: 30, belt: "M60 112 L440 112", doors: ["M264 102 L266 148", "M160 104 L164 146"],
      head: "M30 118 C40 112 58 110 70 112 L66 120 C52 122 40 122 30 122 Z", tail: "M446 112 L458 116 L458 124 L444 122 Z", mirror: "M152 98 L166 92 L170 100 Z"
    },
    suv: {
      body: "M22 128 C20 112 30 102 52 98 L112 90 C136 66 156 50 194 46 L350 44 C378 44 396 54 410 74 L430 98 C450 104 458 114 458 128 L458 140 C458 145 455 147 450 147 L32 147 C26 147 22 143 22 137 Z",
      glass: ["M132 90 C150 70 168 58 198 56 L258 55 L260 90 Z", "M270 55 L346 54 C368 54 384 62 396 78 L404 90 L270 90 Z"],
      wheels: [120, 368], r: 34, belt: "M58 104 L446 104", doors: ["M264 92 L266 144", "M160 94 L164 142"],
      head: "M28 112 C40 106 58 104 72 106 L68 116 C52 118 38 118 28 118 Z", tail: "M444 104 L458 110 L458 122 L442 118 Z", mirror: "M130 88 L146 80 L150 90 Z", rails: "M200 43 L346 41"
    },
    hatch: {
      body: "M26 136 C24 120 32 110 54 106 L116 98 C142 74 170 60 210 56 L340 54 C372 54 392 66 404 90 L420 108 C436 112 444 122 444 134 L444 148 C444 152 441 154 436 154 L36 154 C30 154 27 150 26 144 Z",
      glass: ["M148 98 C168 78 188 68 216 66 L268 65 L270 98 Z", "M280 65 L334 64 C358 64 374 72 384 92 L388 98 L280 98 Z"],
      wheels: [116, 360], r: 30, belt: "M62 110 L428 110", doors: ["M274 100 L276 150", "M160 102 L164 148"],
      head: "M32 116 C42 110 60 108 72 110 L68 118 C54 120 42 120 32 120 Z", tail: "M410 96 L420 108 L420 118 L408 112 Z", mirror: "M150 96 L164 90 L168 98 Z"
    }
  };

  RC.silhouette = function (bodyType, color) {
    const B = BODIES[bodyType] || BODIES.sedan; const id = "s" + (++uid); const c = color || "#9AA3AF";
    const top = shade(c, .28), bottom = shade(c, -.35);
    const wheel = (x) => `<circle cx="${x}" cy="150" r="${B.r + 7}" fill="${shade(c, -.6)}"/>
      <circle cx="${x}" cy="150" r="${B.r}" fill="#111317"/><circle cx="${x}" cy="150" r="${B.r * .62}" fill="url(#${id}r)"/>
      ${[0, 72, 144, 216, 288].map((a) => `<path d="M${x} 150 L${x + Math.cos(a * Math.PI / 180) * B.r * .58} ${150 + Math.sin(a * Math.PI / 180) * B.r * .58}" stroke="#5F6670" stroke-width="5" stroke-linecap="round"/>`).join("")}
      <circle cx="${x}" cy="150" r="${B.r * .16}" fill="#2A2E35"/>`;
    return `<svg class="silhouette" viewBox="0 0 480 190" role="img" aria-label="Иллюстрация автомобиля">
      <defs>
        <linearGradient id="${id}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset=".45" stop-color="${c}"/><stop offset="1" stop-color="${bottom}"/></linearGradient>
        <linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5D6B80"/><stop offset=".55" stop-color="#1E2633"/><stop offset="1" stop-color="#0E131B"/></linearGradient>
        <radialGradient id="${id}r"><stop offset="0" stop-color="#C9CED6"/><stop offset="1" stop-color="#7C838D"/></radialGradient>
        <linearGradient id="${id}hl" x1="0" y1="0" x2="0" y2="1"><stop offset=".38" stop-color="#fff" stop-opacity="0"/><stop offset=".47" stop-color="#fff" stop-opacity=".32"/><stop offset=".53" stop-color="#fff" stop-opacity=".06"/><stop offset=".62" stop-color="#fff" stop-opacity="0"/></linearGradient>
        <radialGradient id="${id}sh"><stop offset="0" stop-color="#000" stop-opacity=".45"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
      </defs>
      <ellipse cx="240" cy="176" rx="230" ry="14" fill="url(#${id}sh)"/>
      ${B.rails ? `<path d="${B.rails}" stroke="${shade(c, -.5)}" stroke-width="4" stroke-linecap="round"/>` : ""}
      <path d="${B.body}" fill="url(#${id}b)" stroke="${shade(c, -.55)}" stroke-width="1.5"/>
      <path d="${B.body}" fill="url(#${id}hl)" style="mix-blend-mode:screen"/>
      ${B.glass.map((g) => `<path d="${g}" fill="url(#${id}g)"/>`).join("")}
      <path d="${B.belt}" stroke="#fff" stroke-opacity=".22" stroke-width="2"/>
      ${B.doors.map((d) => `<path d="${d}" stroke="${shade(c, -.45)}" stroke-width="1.5" opacity=".7"/>`).join("")}
      <path d="${B.mirror}" fill="${shade(c, -.2)}"/>
      <path d="${B.head}" fill="#EAF2FF" opacity=".9"/>
      <path d="${B.tail}" fill="#D9363E"/>
      <path d="M40 146 L450 146" stroke="#000" stroke-opacity=".28" stroke-width="6"/>
      ${B.wheels.map(wheel).join("")}
    </svg>`;
  };

  /* Единая картинка машины: вырезка без фона → силуэт → обычное фото */
  RC.carVisual = function (car, cls) {
    const alt = RC.util ? RC.util.esc(car.brand + " " + car.model) : car.brand + " " + car.model;
    if (car.cut) return `<img src="${car.cut}" alt="${alt}" class="${cls || ""}">`;
    if (car.body) return `<span class="sil-wrap ${cls || ""}">${RC.silhouette(car.body, car.paint)}<span class="sil-note">иллюстрация</span></span>`;
    return `<img src="${car.img}" alt="${alt}" class="photo ${cls || ""}">`;
  };
})();
