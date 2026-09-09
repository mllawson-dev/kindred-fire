import { toggleAudio } from "./audio-engine.js";
import { startVisualizer } from "./visualizer.js";
import { withViewTransition } from "./transitions.js";
import { initTabs, selectTab } from "./tabs.js";
import { initCursorGlow } from "./cursor-glow.js";
import { hero } from "./data/copy.js";

function renderHeroCopy() {
  document.querySelector('[data-copy="tagline"]').textContent = hero.tagline;
  document.querySelector('[data-copy="subhead"]').textContent = hero.subhead;
  document.querySelector('[data-label="idle"]').textContent = hero.playLabel;
}

function wirePlayToggle() {
  const btn = document.getElementById("play-toggle");
  btn.addEventListener("click", async () => {
    const playing = await toggleAudio();
    btn.setAttribute("aria-pressed", String(playing));
    btn.classList.toggle("btn--playing", playing);
    btn.querySelector("[data-label]").textContent = playing
      ? hero.playingLabel
      : hero.playLabel;
  });
}

function wireHeroPanelSwitch() {
  const body = document.body;
  const enter = document.getElementById("enter-panel");
  const back = document.getElementById("back-to-hero");
  const siteMark = document.getElementById("site-mark");
  const panel = document.getElementById("panel");

  const goToPanel = () => {
    withViewTransition(() => {
      body.classList.remove("state-hero");
      body.classList.add("state-panel");
      panel.setAttribute("aria-hidden", "false");
    });
  };

  const goToHero = () => {
    withViewTransition(() => {
      body.classList.remove("state-panel");
      body.classList.add("state-hero");
      panel.setAttribute("aria-hidden", "true");
    });
  };

  enter.addEventListener("click", goToPanel);
  back.addEventListener("click", goToHero);
  siteMark.addEventListener("click", () => {
    if (body.classList.contains("state-panel")) goToHero();
  });

  return { goToPanel, goToHero };
}

function wireFooter({ goToHero }) {
  // The footer lives inside the panel section, so it's only ever visible
  // once you're already in the panel — its links just move within it.
  document.getElementById("footer-home").addEventListener("click", goToHero);

  document.querySelectorAll("[data-footer-tab]").forEach((btn) => {
    btn.addEventListener("click", () => selectTab(btn.dataset.footerTab));
  });
}

renderHeroCopy();
wirePlayToggle();
const { goToHero } = wireHeroPanelSwitch();
initTabs();
wireFooter({ goToHero });
initCursorGlow();
startVisualizer(document.getElementById("visualizer"));
