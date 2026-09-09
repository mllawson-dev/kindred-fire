// Cursor-follow glow: JS only reads pointer position and writes it to CSS
// custom properties — the actual glow rendering/animation is CSS's job.

export function initCursorGlow() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (window.matchMedia("(pointer: coarse)").matches) return; // touch devices

  const glow = document.getElementById("cursor-glow");
  let raf = null;

  window.addEventListener("pointermove", (e) => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      glow.style.setProperty("--x", `${e.clientX}px`);
      glow.style.setProperty("--y", `${e.clientY}px`);
      raf = null;
    });
  });
}
