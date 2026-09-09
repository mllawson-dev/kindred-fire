// Hybrid hero visualizer: frequency data from the Web Audio API drives a
// set of DISCRETE flame tongues — not one continuous silhouette. A single
// unbroken shape across the full width, however irregular its top edge,
// still reads as a horizon or a mountain range; real fire is recognizable
// because individual licks taper to points with dark gaps of background
// between them. That separation is the thing this file is built around.

import { getFrequencyData, isPlaying } from "./audio-engine.js";

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

// --- tiny hand-rolled value noise (no dependency) -------------------------
function hash(n) {
  const s = Math.sin(n * 12.9898) * 43758.5453;
  return s - Math.floor(s);
}
function noise1D(x) {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f); // smoothstep
  return hash(i) + (hash(i + 1) - hash(i)) * u;
}
function turbulence(x, t) {
  const n =
    noise1D(x * 1.6 + t * 0.5) * 1 +
    noise1D(x * 3.4 - t * 1.1) * 0.4 +
    noise1D(x * 8.2 + t * 1.9) * 0.12;
  return n / 1.52 - 0.5; // roughly -0.5..0.5
}
// ---------------------------------------------------------------------------

const TONGUE_COUNT = 15;

function buildTongueSeeds(count) {
  // A random-walk placement (instead of an even grid) so gaps between
  // tongues vary in width the way they do around a real fire, and each
  // tongue gets its own size/shape personality so no two look alike.
  const positions = [];
  let cursor = Math.random() * 0.4;
  for (let i = 0; i < count; i++) {
    positions.push(cursor);
    cursor += 0.35 + Math.random() * 1.3;
  }
  const span = positions[positions.length - 1] || 1;

  return positions.map((p) => ({
    xf: 0.03 + (p / span) * 0.94,
    scale: 0.45 + Math.random() * 1.15,
    curl: (Math.random() - 0.5) * 1.9,
    baseSpread: 0.4 + Math.random() * 0.35, // how wide the foot of the flame is
    tipLean: 0.75 + Math.random() * 0.4, // how far up the curve the taper starts
    phase: Math.random() * Math.PI * 2,
    speed: 0.55 + Math.random() * 1.1,
    hasSplit: Math.random() < 0.4,
    splitOffset: (Math.random() < 0.5 ? -1 : 1) * (0.35 + Math.random() * 0.25),
    splitScale: 0.35 + Math.random() * 0.3,
  }));
}

export function startVisualizer(canvas) {
  const ctx = canvas.getContext("2d");
  let width, height, dpr;
  let frameId = null;

  const embers = Array.from({ length: 70 }, () => spawnEmber(true));
  const tongueSeeds = buildTongueSeeds(TONGUE_COUNT);

  function spawnEmber(randomHeight = false) {
    return {
      x: Math.random(),
      y: randomHeight ? Math.random() : 1.05,
      r: 0.6 + Math.random() * 2.2,
      speed: 0.06 + Math.random() * 0.18,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.6 + Math.random() * 1.2,
    };
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawHeatHaze(intensity) {
    const grad = ctx.createRadialGradient(
      width / 2,
      height,
      0,
      width / 2,
      height,
      height * (0.5 + intensity * 0.3)
    );
    grad.addColorStop(0, `rgba(178, 58, 46, ${0.2 + intensity * 0.2})`);
    grad.addColorStop(1, "rgba(178, 58, 46, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }

  // Soft, wide, blurred ambient bloom behind the fire. Deliberately vague —
  // it's read as light spilling upward, not as a shape in its own right, so
  // its lack of hard edges doesn't compete with the discrete tongues in
  // front of it.
  function drawGlow(intensity, baseY) {
    // Fill the full canvas and let the gradient's own falloff do the
    // fading — clipping to a sub-rect leaves a visible hard seam where the
    // rect boundary cuts across an otherwise smooth radial fade.
    const grad = ctx.createRadialGradient(
      width / 2,
      baseY,
      0,
      width / 2,
      baseY,
      height * (0.42 + intensity * 0.12)
    );
    grad.addColorStop(0, `rgba(216, 88, 42, ${0.22 + intensity * 0.1})`);
    grad.addColorStop(1, "rgba(216, 88, 42, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }

  // A thin, gently undulating bed of coals along the very base — short
  // enough that it can never read as a mountain range, but it gives every
  // tongue above it a shared, glowing foundation instead of floating.
  function drawEmberBed(freq, t, baseY) {
    const bins = freq.length;
    const columns = 40;
    const bedHeight = height * 0.045;
    const points = [];

    for (let i = 0; i <= columns; i++) {
      const xf = i / columns;
      const binPos = xf * (bins - 1);
      const energy = freq[Math.round(binPos)] / 255;
      const wobble = 0.5 + turbulence(xf * 5, t * 0.6) * 0.5 + energy * 0.4;
      points.push({ x: xf * width, y: baseY - bedHeight * wobble });
    }

    ctx.beginPath();
    ctx.moveTo(0, baseY + 4);
    points.forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.lineTo(width, baseY + 4);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, baseY, 0, baseY - bedHeight);
    grad.addColorStop(0, "rgba(140, 42, 30, 0.85)");
    grad.addColorStop(1, "rgba(216, 88, 42, 0.5)");
    ctx.fillStyle = grad;
    ctx.fill();
  }

  function lobePath(x, baseY, w, h, curl, baseSpread) {
    const tipX = x + curl * w * 0.32;
    const tipY = baseY - h;
    ctx.beginPath();
    ctx.moveTo(x - w / 2, baseY);
    ctx.bezierCurveTo(
      x - w * baseSpread,
      baseY - h * 0.5,
      x - w * 0.16 + curl * w * 0.12,
      baseY - h * 0.88,
      tipX,
      tipY
    );
    ctx.bezierCurveTo(
      x + w * 0.16 + curl * w * 0.12,
      baseY - h * 0.88,
      x + w * baseSpread,
      baseY - h * 0.5,
      x + w / 2,
      baseY
    );
    ctx.closePath();
  }

  function drawTongue(freq, t, baseY, seed, maxHeight, avgSlot) {
    const bins = freq.length;
    const binPos = seed.xf * (bins - 1);
    const b0 = Math.floor(binPos);
    const b1 = Math.min(bins - 1, b0 + 1);
    const frac = binPos - b0;
    const energy = (freq[b0] * (1 - frac) + freq[b1] * frac) / 255;

    const flicker = 0.78 + Math.sin(t * seed.speed + seed.phase) * 0.22;
    const sway = turbulence(seed.xf * 4, t * 0.4 + seed.phase) * 0.4;
    const h = Math.min(
      maxHeight * 1.2,
      maxHeight * seed.scale * (0.4 + energy * 0.85) * flicker
    );
    const w = avgSlot * (0.7 + seed.scale * 0.55);
    const x = (seed.xf + sway * 0.06) * width;

    // Height decides how "hot" the tongue reads: short ones stay ember-red,
    // tall ones climb through orange toward a pale, near-transparent tip.
    const heat = Math.min(1, h / (maxHeight * 0.9));
    const grad = ctx.createLinearGradient(0, baseY, 0, baseY - h);
    grad.addColorStop(0, "rgba(120, 34, 26, 0.95)");
    grad.addColorStop(0.4, `rgba(${180 + heat * 40}, ${60 + heat * 60}, 40, 0.92)`);
    grad.addColorStop(0.78, `rgba(232, ${120 + heat * 60}, 55, ${0.55 + heat * 0.15})`);
    grad.addColorStop(1, "rgba(249, 220, 160, 0)");

    ctx.fillStyle = grad;
    ctx.shadowColor = "rgba(232, 98, 47, 0.5)";
    ctx.shadowBlur = 12 + heat * 10;
    lobePath(x, baseY + 3, w, h, seed.curl, seed.baseSpread);
    ctx.fill();

    if (seed.hasSplit) {
      const sx = x + seed.splitOffset * w * 0.6;
      const sh = h * seed.splitScale;
      ctx.shadowBlur = 8;
      lobePath(sx, baseY + 3, w * seed.splitScale * 1.3, sh, seed.curl * -0.6, seed.baseSpread);
      ctx.fill();
    }
  }

  function drawFlames(freq, t) {
    const baseY = height * 0.88;
    const maxHeight = height * 0.3;
    const avgSlot = width / TONGUE_COUNT;

    ctx.save();
    drawGlow(
      freq.reduce((a, b) => a + b, 0) / freq.length / 255,
      baseY
    );
    drawEmberBed(freq, t, baseY);

    for (const seed of tongueSeeds) {
      drawTongue(freq, t, baseY, seed, maxHeight, avgSlot);
    }
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  function drawEmbers(intensity, t) {
    ctx.save();
    for (const e of embers) {
      e.y -= e.speed * 0.0035 * (1 + intensity * 2.2);
      const x = e.x * width + Math.sin(t * e.wobbleSpeed + e.wobble) * 6;
      const y = e.y * height;
      if (e.y < -0.05) Object.assign(e, spawnEmber(false));

      // Fade in near the bottom, fade out near the top
      const lifeFade = Math.min(1, e.y * 3) * Math.min(1, (1 - e.y) * 3 + 0.15);
      const alpha = Math.max(0, lifeFade) * (0.35 + intensity * 0.5);

      ctx.beginPath();
      ctx.fillStyle = `rgba(226, 185, 104, ${alpha})`;
      ctx.shadowColor = "rgba(232, 98, 47, 0.8)";
      ctx.shadowBlur = 6;
      ctx.arc(x, y, e.r + intensity * 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  function frame(t = 0) {
    const time = t / 1000;
    ctx.clearRect(0, 0, width, height);

    const freq = getFrequencyData();
    const active = isPlaying() && freq;
    const intensity = active
      ? freq.reduce((a, b) => a + b, 0) / freq.length / 255
      : 0.06; // idle breathing glow floor

    drawHeatHaze(intensity);
    drawEmbers(intensity, time);
    if (active) drawFlames(freq, time);

    if (!prefersReducedMotion) {
      frameId = requestAnimationFrame(frame);
    }
  }

  resize();
  window.addEventListener("resize", resize);
  frame(0);

  return () => {
    if (frameId) cancelAnimationFrame(frameId);
    window.removeEventListener("resize", resize);
  };
}
