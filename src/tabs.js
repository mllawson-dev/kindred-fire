import { withViewTransition } from "./transitions.js";
import { tourDates } from "./data/tour-dates.js";
import { lyricExcerpt, mission, album } from "./data/copy.js";

function openLyricsDialog() {
  const dialog = document.getElementById("lyrics-dialog");
  document.getElementById("lyrics-song").textContent = lyricExcerpt.song;
  document.getElementById("lyrics-lines").innerHTML = lyricExcerpt.lines
    .map((l) => l || "&nbsp;")
    .join("<br />");
  dialog.showModal();
}

function renderTracklist() {
  const list = document.getElementById("tracklist");
  list.innerHTML = album.tracks
    .map(
      ({ number, title, duration, isLyricsTrack }) => `
      <li class="tracklist__row">
        <span class="tracklist__num">${number}</span>
        <span class="tracklist__title">
          ${title}
          ${
            isLyricsTrack
              ? `<button class="tracklist__lyrics-link" type="button" data-open-lyrics>Read the lyrics</button>`
              : ""
          }
        </span>
        <span class="tracklist__duration">${duration}</span>
      </li>`
    )
    .join("");

  list.querySelectorAll("[data-open-lyrics]").forEach((btn) => {
    btn.addEventListener("click", openLyricsDialog);
  });
}

function renderTourList() {
  const list = document.getElementById("tour-list");
  list.innerHTML = tourDates
    .map(
      ({ date, city, venue }) => `
      <li class="tour-list__row">
        <span class="tour-list__date">${new Date(date).toLocaleDateString(
          "en-US",
          { month: "short", day: "numeric", year: "numeric" }
        )}</span>
        <span class="tour-list__city">${city}</span>
        <span class="tour-list__venue">${venue}</span>
      </li>`
    )
    .join("");
}

function renderMission() {
  document.getElementById("mission-copy").innerHTML = mission
    .map((p) => `<p>${p}</p>`)
    .join("");
}

function wireLyricsDialog() {
  document.getElementById("open-lyrics").addEventListener("click", openLyricsDialog);
}

let pills = [];

export function selectTab(target) {
  const pill = pills.find((p) => p.dataset.tab === target);
  if (!pill || pill.getAttribute("aria-selected") === "true") return;

  withViewTransition(() => {
    pills.forEach((p) => {
      const selected = p === pill;
      p.setAttribute("aria-selected", String(selected));
      p.tabIndex = selected ? 0 : -1;
    });

    document.querySelectorAll(".tab-panel").forEach((panel) => {
      panel.hidden = panel.id !== `panel-${target}`;
    });
  });
}

export function initTabs() {
  renderTourList();
  renderTracklist();
  renderMission();
  wireLyricsDialog();

  pills = Array.from(document.querySelectorAll(".tabs__pill"));

  pills.forEach((pill) => {
    pill.addEventListener("click", () => selectTab(pill.dataset.tab));
  });
}
