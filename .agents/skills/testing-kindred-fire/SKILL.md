---
name: testing-kindred-fire
description: Run local UI checks for Kindred Fire's keyboard tabs, synthetic audio/canvas lifecycle, concept content, and timezone-safe dates.
---

## Setup
- From the repository root, use `. "$HOME/.nvm/nvm.sh" && nvm use 22 && npm run dev -- --host 0.0.0.0`.
- Use the URL printed by Vite; stop an older Vite instance if it occupies the intended port.
- This vanilla HTML/JS app has no backend or login. Dependencies may already be installed.

## UI entry points
- The hero's Light It Up button opts into synthetic Web Audio. Now Burning indicates active output; the adjacent polite live region explains behavior.
- Enter replaces the hero with a content panel; Back to hero returns. These are alternate display states, not a continuously scrolling hero/content page.
- The panel has Tour, Kindled, Lyrics, Mission, and Project tabs. Arrows auto-select tabs, Home/End select endpoints, and Enter/Space retain native button activation.
- Project contains portfolio narrative and fictional-content disclosure. Check the fixed disclosure while scrolling, and watch for the fixed brand mark overlapping narrow-screen text.

## Runtime verification
- Capture canvas clearRect call counts and Web Audio destination connect/disconnect calls without modifying application sources. Hidden pixels alone do not prove the animation loop stopped.
- Distinguish output disconnection from AudioContext suspension; inspect both if resource pausing is an acceptance criterion.
- Test tour dates after reloading in America/Los_Angeles, with a far-eastern zone as comparison. Confirm `Intl.DateTimeFormat().resolvedOptions().timeZone` before asserting results.
- Chrome CDP timezone emulation may reset when its connection closes; keep the debugging session open through reload and assertions. Node 22 provides native WebSocket, avoiding extra packages.
- Browser audio may be muted by automation. Do not claim audible fidelity or screen-reader speech merely from visual and DOM checks.

## Devin Secrets Needed
None for local frontend testing.
