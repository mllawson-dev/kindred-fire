import { stopAudio, toggleAudio } from "./audio-engine.js";
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

function wirePlayToggle(visualizer) {
  const btn = document.getElementById("play-toggle");
  const status = document.getElementById("audio-status");

  const syncState = (playing) => {
    btn.setAttribute("aria-pressed", String(playing));
    btn.classList.toggle("btn--playing", playing);
    btn.querySelector("[data-label]").textContent = playing
      ? hero.playingLabel
      : hero.playLabel;
    status.textContent = playing
      ? "Generative sound is on and driving the live canvas."
      : "Activates generative sound and the live canvas.";
    visualizer.refresh();
  };

  btn.addEventListener("click", async () => {
    const playing = await toggleAudio();
    syncState(playing);
  });

  return () => syncState(stopAudio());
}

function wireHeroPanelSwitch({ pausePlayback, visualizer }) {
  const body = document.body;
  const enter = document.getElementById("enter-panel");
  const back = document.getElementById("back-to-hero");
  const siteMark = document.getElementById("site-mark");
  const panel = document.getElementById("panel");

  const goToPanel = () => {
    pausePlayback();
    visualizer.pause();
    withViewTransition(() => {
      body.classList.remove("state-hero");
      body.classList.add("state-panel");
      panel.setAttribute("aria-hidden", "false");
    }).then(() => back.focus());
  };

  const goToHero = () => {
    withViewTransition(() => {
      body.classList.remove("state-panel");
      body.classList.add("state-hero");
      panel.setAttribute("aria-hidden", "true");
    }).then(() => enter.focus());
    visualizer.resume();
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
const visualizer = startVisualizer(document.getElementById("visualizer"));
const pausePlayback = wirePlayToggle(visualizer);
const { goToHero } = wireHeroPanelSwitch({ pausePlayback, visualizer });
initTabs();
wireFooter({ goToHero });
initCursorGlow();
