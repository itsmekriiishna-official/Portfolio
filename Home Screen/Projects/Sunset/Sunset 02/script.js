// ─── Color Math (OKLab, sRGB, Interpolation & Per-Pixel Dither) ─────────────
const srgbToLinear = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const linearToSrgb = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);

function oklab2srgb([L, a, b]) {
  const l_ = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3);
  const m_ = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3);
  const s_ = Math.pow(L - 0.0894841775 * a - 1.291485548 * b, 3);
  return [
    linearToSrgb(4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_),
    linearToSrgb(-1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_),
    linearToSrgb(-0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_)
  ].map((c) => Math.min(1, Math.max(0, c)));
}

const rgb2hex = (rgb) => "#" + rgb.map((c) => Math.round(255 * c).toString(16).padStart(2, "0")).join("");

function hex2oklab(hex) {
  let [r, g, b] = [1, 3, 5].map((idx) => parseInt(hex.slice(idx, idx + 2), 16) / 255);
  r = srgbToLinear(r);
  g = srgbToLinear(g);
  b = srgbToLinear(b);
  const l_ = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m_ = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s_ = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_
  ];
}

const lerp3 = (c1, c2, t) => [0, 1, 2].map((i) => c1[i] + (c2[i] - c1[i]) * t);

function sample(stops, tVal) {
  let idx = 0;
  while (idx < stops.length - 2 && tVal > stops[idx + 1].t) {
    idx++;
  }
  const aStop = stops[idx];
  const lStop = stops[idx + 1];
  let frac = (tVal - aStop.t) / Math.max(1e-6, lStop.t - aStop.t);
  frac = Math.min(1, Math.max(0, frac));
  frac = frac * frac * (3 - 2 * frac); // smoothstep
  return lerp3(aStop.lab, lStop.lab, frac);
}

function paintGradient(ctx, stops, width, height) {
  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;
  let offset = 0;
  for (let y = 0; y < height; y++) {
    const tVal = height > 1 ? y / (height - 1) : 0;
    const [r, g, b] = oklab2srgb(sample(stops, tVal));
    const dr = 255 * r;
    const dg = 255 * g;
    const db = 255 * b;
    for (let x = 0; x < width; x++) {
      const dither = (Math.random() - 0.5) * 2.2;
      data[offset++] = dr + dither;
      data[offset++] = dg + dither;
      data[offset++] = db + dither;
      data[offset++] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);
}

function cssString(stops) {
  const steps = [];
  for (let s = 0; s <= 10; s++) {
    const norm = s / 10;
    steps.push(`${rgb2hex(oklab2srgb(sample(stops, norm)))} ${Math.round(100 * norm)}%`);
  }
  return `background: linear-gradient(180deg,\n  ${steps.join(",\n  ")});`;
}

// ─── Preset Data ─────────────────────────────────────────────────────────────
const baseStops = [
  { t: 0, c: "#54709f" },
  { t: 0.22, c: "#7d81ab" },
  { t: 0.4, c: "#a98fa8" },
  { t: 0.54, c: "#d3a291" },
  { t: 0.68, c: "#efa763" },
  { t: 0.82, c: "#f68a1e" },
  { t: 1, c: "#ee7202" }
];

const presets = {
  "Last light": { warmth: 45, glow: 90, haze: 12, dusk: 70, horizon: 88 },
  Dusty: { warmth: 70, glow: 50, haze: 70, dusk: 55, horizon: 70 },
  "Golden hour": { warmth: 85, glow: 80, haze: 18, dusk: 20, horizon: 62 }
};

const sizes = {
  Desktop: [3840, 2160],
  Tablet: [2048, 2732],
  Phone: [1290, 2796]
};

const resetOffsets = () => baseStops.map(() => ({ dh: 0, dl: 0 }));

function computeStops(params, offsets) {
  const s_w = (params.warmth - 55) / 100;
  const n_g = params.glow / 100;
  const i_h = params.haze / 100;
  const r_d = params.dusk / 100;
  const o_h = params.horizon / 100;

  return baseStops.map((stop, index) => {
    const h = stop.t;
    let [c, d, u] = hex2oklab(stop.c); // L, a, b
    const m = offsets[index];
    d += 0.06 * s_w * h + 0.5 * m.dh;
    u += 0.1 * s_w * h + m.dh;
    c += (n_g - 0.6) * 0.1 * Math.pow(h, 2.2);
    u += (n_g - 0.6) * 0.08 * Math.pow(h, 2.2);
    const p = Math.exp(-Math.pow((h - 0.45) / 0.28, 2));
    c += 0.09 * i_h * p;
    d *= 1 - 0.55 * i_h * p;
    u *= 1 - 0.45 * i_h * p;
    const g = 1 - h;
    c -= (r_d - 0.45) * 0.16 * Math.pow(g, 1.6);
    u -= (r_d - 0.45) * 0.1 * Math.pow(g, 1.6);
    c += m.dl;
    c = Math.min(0.97, Math.max(0.08, c));
    return {
      t: Math.min(1, stop.t < 1 ? stop.t * (o_h / 0.72) : 1),
      lab: [c, d, u]
    };
  }).sort((a, b) => a.t - b.t);
}

// ─── Application State ───────────────────────────────────────────────────────
let currentPreset = "Last light";
let currentSize = "Desktop";
let atmosphere = { ...presets["Last light"] };
let offsets = resetOffsets();

// ─── DOM References ─────────────────────────────────────────────────────────
const canvas = document.getElementById("sunset-canvas");
const toast = document.getElementById("ss-toast");
const sizeButtons = document.querySelectorAll("#size-row .ss-size");
const presetButtons = document.querySelectorAll("#preset-row .ss-preset");
const btnReset = document.getElementById("btn-reset");
const btnCopyCss = document.getElementById("btn-copy-css");
const btnDownloadPng = document.getElementById("btn-download-png");

const sliders = {
  warmth: document.getElementById("ss-warmth"),
  glow: document.getElementById("ss-glow"),
  haze: document.getElementById("ss-haze"),
  dusk: document.getElementById("ss-dusk"),
  horizon: document.getElementById("ss-horizon")
};

const outputs = {
  warmth: document.getElementById("output-warmth"),
  glow: document.getElementById("output-glow"),
  haze: document.getElementById("output-haze"),
  dusk: document.getElementById("output-dusk"),
  horizon: document.getElementById("output-horizon")
};

// ─── Toast Notifications ────────────────────────────────────────────────────
let toastTimer = null;
function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 1400);
}

// ─── Render Pipeline ────────────────────────────────────────────────────────
function updateSliderAppearance(key, value) {
  const input = sliders[key];
  const output = outputs[key];
  if (!input || !output) return;

  output.textContent = value;
  const isHorizon = key === "horizon";
  const min = isHorizon ? 30 : 0;
  const max = isHorizon ? 95 : 100;
  const pct = ((value - min) / (max - min)) * 100;
  input.style.background = `linear-gradient(to right, #ee7202 ${pct}%, #f2eee8 0)`;
}

function syncAllSliders() {
  for (const key of Object.keys(atmosphere)) {
    if (sliders[key]) sliders[key].value = atmosphere[key];
    updateSliderAppearance(key, atmosphere[key]);
  }
}

function updateCanvasDimensions() {
  if (!canvas) return;
  const [wRatio, hRatio] = sizes[currentSize];
  const aspectRatioVal = (wRatio / hRatio).toFixed(4);
  canvas.style.aspectRatio = `${wRatio} / ${hRatio}`;
  canvas.style.maxWidth = `min(100%, calc(68vh * ${aspectRatioVal}))`;
}

function render() {
  if (!canvas) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  let w = (canvas.clientWidth * dpr) | 0;
  let h = (canvas.clientHeight * dpr) | 0;

  // Fallback if clientWidth is momentarily not computed
  if (!w || !h) {
    const stageWidth = canvas.parentElement ? canvas.parentElement.clientWidth : 1140;
    const [wRatio, hRatio] = sizes[currentSize];
    w = (Math.max(320, stageWidth) * dpr) | 0;
    h = ((w * hRatio) / wRatio) | 0;
  }

  if (w && h) {
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const computed = computeStops(atmosphere, offsets);
      paintGradient(ctx, computed, w, h);
    }
  }
}

// ─── Presets & Size Handlers ────────────────────────────────────────────────
function setPreset(name) {
  if (!presets[name]) return;
  currentPreset = name;
  atmosphere = { ...presets[name] };
  offsets = resetOffsets();

  presetButtons.forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.preset === name);
  });

  syncAllSliders();
  render();
}

function setSize(name) {
  if (!sizes[name]) return;
  currentSize = name;

  sizeButtons.forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.size === name);
  });

  updateCanvasDimensions();
  requestAnimationFrame(() => render());
}

// ─── Event Listeners ────────────────────────────────────────────────────────
// Sliders
Object.keys(sliders).forEach((key) => {
  const slider = sliders[key];
  if (!slider) return;

  slider.addEventListener("input", (e) => {
    atmosphere[key] = +e.target.value;
    updateSliderAppearance(key, atmosphere[key]);

    // Clear preset selection when manually adjusted
    currentPreset = null;
    presetButtons.forEach((btn) => btn.classList.remove("is-active"));

    render();
  });
});

// Reset Button
btnReset?.addEventListener("click", () => {
  setPreset("Last light");
});

// Size Selection
sizeButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    setSize(btn.dataset.size);
  });
});

// Preset Selection
presetButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    setPreset(btn.dataset.preset);
  });
});

// Copy CSS
btnCopyCss?.addEventListener("click", async () => {
  const computed = computeStops(atmosphere, offsets);
  const css = cssString(computed);
  try {
    await navigator.clipboard.writeText(css);
    showToast("CSS copied");
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = css;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    showToast("CSS copied");
  }
});

// Download PNG
btnDownloadPng?.addEventListener("click", () => {
  const [targetWidth, targetHeight] = sizes[currentSize];
  const offscreen = document.createElement("canvas");
  offscreen.width = targetWidth;
  offscreen.height = targetHeight;
  const offCtx = offscreen.getContext("2d");

  if (offCtx) {
    const computed = computeStops(atmosphere, offsets);
    paintGradient(offCtx, computed, targetWidth, targetHeight);

    const link = document.createElement("a");
    link.download = `sunset-${currentSize.toLowerCase()}-${targetWidth}x${targetHeight}.png`;
    link.href = offscreen.toDataURL("image/png");
    link.click();

    showToast(`Downloading ${targetWidth}\u00D7${targetHeight} PNG`);
  }
});

// Responsive resize with debounced animation frame
let resizeRaf = null;
const resizeObserver = new ResizeObserver(() => {
  if (resizeRaf) cancelAnimationFrame(resizeRaf);
  resizeRaf = requestAnimationFrame(() => {
    render();
  });
});
if (canvas) resizeObserver.observe(canvas);

window.addEventListener("resize", () => {
  render();
});

// Initial load sequences
syncAllSliders();
updateCanvasDimensions();
render();
requestAnimationFrame(() => render());
setTimeout(render, 60);
setTimeout(render, 300);

// ─── Mobile Navigation Toggle ───────────────────────────────────────────────
const burgerOpen = document.getElementById("sb-burger");
const burgerClose = document.getElementById("sb-burger-close");
const overlay = document.getElementById("sb-overlay");

function setDrawerOpen(open) {
  if (!overlay) return;
  overlay.hidden = !open;
  document.body.classList.toggle("menu-open", open);
}

burgerOpen?.addEventListener("click", () => setDrawerOpen(true));
burgerClose?.addEventListener("click", () => setDrawerOpen(false));

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && overlay && !overlay.hidden) {
    setDrawerOpen(false);
  }
});

overlay?.addEventListener("click", (event) => {
  if (event.target.closest("a")) setDrawerOpen(false);
});

// ─── Live Clock (MYT format matching Rachel's site) ────────────────────────
const mytFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Kuala_Lumpur",
  hour: "numeric",
  minute: "2-digit",
  second: "2-digit",
  hour12: true
});

function updateClock() {
  const now = new Date();
  const formatted = `${mytFormatter.format(now)} MYT`;
  const timeEl = document.getElementById("sb-time");
  const overlayTimeEl = document.getElementById("sb-overlay-time");
  if (timeEl) timeEl.textContent = formatted;
  if (overlayTimeEl) overlayTimeEl.textContent = formatted;
}

updateClock();
window.setInterval(updateClock, 1000);
