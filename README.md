# The Kindred Fire — microsite

Bespoke launch microsite for The Kindred Fire's album *Kindled*, part of the
Evergrace Music portfolio universe. Deliberately hand-built in vanilla
HTML/CSS/JS — no React, no Three.js, no framework — to show a different set
of techniques than the CineVault and Knob Noster React builds and the
Evergrace Music component system.

## Structure

```
index.html            Hero + tab panel + lyrics dialog markup
src/
  tokens.css           Design tokens (colors/type shared with Evergrace Music)
  style.css            Layout, hero, panel, tab, and dialog styles
  main.js              Entry point — wires everything together
  audio-engine.js       Web Audio API: synthetic tone + AnalyserNode
  visualizer.js         Canvas hero visualizer (hybrid flame/ember forms)
  transitions.js         View Transitions helper + reduced-motion gate
  tabs.js               Tour / Kindled / Lyrics / Mission pill switching,
                         exports selectTab() for the footer's nav links
  cursor-glow.js         Cursor-follow glow effect
  data/
    copy.js              Hero copy, album/tracklist, lyric excerpt, mission statement
    tour-dates.js        Tour date list
```

## Techniques on purpose

This build exists to round out the portfolio's technical range, so each
piece below was chosen specifically because it *hasn't* shown up on the
other projects yet:

- **Web Audio API** — synthetic oscillator + filtered noise feeding an
  `AnalyserNode`; no sourced audio file, no licensing question.
- **Canvas 2D animation loop** — the hero visualizer draws every frame from
  live frequency data rather than CSS keyframes.
- **View Transitions API** — used for the hero → panel state change and for
  swapping between Tour / Lyrics / Mission, with a feature-detected fallback
  to an instant DOM swap on unsupported browsers.
- **CSS scroll-driven animations** (`animation-timeline: view()`) — reveal
  animations inside each tab panel with no scroll-listener JS at all, falling
  back to "just visible" via `@supports not`.
- **Native `<dialog>`** — the lyrics excerpt opens in a real dialog element
  for free focus-trapping and `Esc`-to-close, instead of a hand-rolled modal.
- **`prefers-reduced-motion` handling** — the visualizer settles to a static
  glow and all transitions/scroll animations collapse to instant, everywhere
  motion is used.

Browser support for View Transitions and scroll-driven animations is
Chromium-strongest today; the fallbacks above are deliberate, not an
afterthought, and worth calling out explicitly in the case study.

## Status

Design/build pass complete: Bricolage Grotesque + Karla loaded from Google
Fonts, a fire-gradient hero tagline, an ember particle system with proper
fade-in/fade-out lifecycle, a film-grain overlay tying hero and panel
together, and full panel typography (section headings, an ember-rule
divider, a drop-cap on the mission copy, a quote-mark accent on the lyrics
dialog). Verified with a headless-browser pass across desktop and mobile
viewports and both motion preferences — no console errors.

The hero visualizer went through three real iterations, not one:

1. Discrete tongue shapes mapped one-to-one to frequency bins — read as a
   uniform picket fence, because the synthetic tone saturates most low bins
   to nearly the same value.
2. A single continuous noise-driven silhouette across the full width —
   fixed the uniformity, but a shape that's connected and touches the
   baseline everywhere reads as a mountain/lava horizon no matter how
   irregular its top edge, not as fire.
3. Current: discrete flame tongues again, but seeded with real variety
   (size, curl, occasional split tips, irregular random-walk spacing) sitting
   on a thin glowing ember bed, with a soft blurred ambient glow behind
   everything. The gaps between tongues — visible dark background at the
   base, not just at the tip — turned out to be the actual thing that reads
   as "fire" rather than "shape."

Naturalism vs. the tagline: the ember bed and every tongue's max height are
capped well below the button, the glow is soft/blurred rather than sharp,
and the tips fade to transparent via gradient — so the added realism stays
low in the frame and doesn't fight the type above it.

Still worth a human look before calling this final: the flame tuning was
done against a synthetic bass-heavy tone, so it's worth sanity-checking
against whatever real reference track eventually replaces it, and the exact
color/height balance from here is taste, not correctness.

Added a fourth tab, **Kindled**, between Tour and Lyrics: a hand-authored SVG
album cover (the same bezier flame-lobe technique as the logo mark, scaled up
into a wider skyline of small fires — "not one big fire, but a lot of small
ones") paired with the nine-track list. The cover title uses the site's
fire-gradient text treatment (the same formula as the hero tagline), while
the actual logo wordmark stays solid gold — the gradient lives on expressive
one-off art, the wordmark stays the fixed, reproducible mark. The "Every
Ember" row cross-links into the same lyrics `<dialog>` used elsewhere, so the
tabs point at each other instead of sitting in isolation.

The finished logo system (from the separate logo design pass) is now actually
on the site, not just designed in isolation: a persistent brand mark — the
real icon + solid-gold "Kindred Fire" wordmark — sits fixed top-left across
both hero and panel states and doubles as a "back to hero" control, the
browser tab favicon is the real icon (flat gold on a charcoal tile, matching
the one-color variant built for small-size reproduction), and the album
cover now carries a small corner lockup of the same icon + wordmark next to
the large stylized "Kindled" title — reusing the exact gradient fills from
the flame-lobe icon rather than duplicating them.

Added a site footer, matched structurally to Evergrace Music's own
`SiteFooter` component (brand mark + tagline, a grid of link columns, a
bottom copyright bar) but translated onto this project's own tokens rather
than importing Evergrace's `--eg-*` variable set, and adapted for a
single-artist, single-page site: the "On the Site" column jumps straight to
a tab via an exported `selectTab()` rather than linking to separate routes,
"Listen" and "Label" are quiet placeholder/credit text rather than fake
external links (no real streaming URLs to point at for a fictional release),
and the footer icon uses the flat one-color gold mark, same as Evergrace's
footer icon. Verified end-to-end (hero → panel → all four tabs → lyrics
dialog → footer nav → back to hero) at both desktop and mobile widths — no
console errors.

Added Open Graph and Twitter Card meta tags, plus a purpose-built 1200×630
social card (`public/og-image.png`): the same fire-gradient tagline
treatment from the hero, a wide version of the flame-lobe skyline generated
with the same random-walk placement technique as the hero visualizer's
tongues (not hand-placed), rendered with the real Bricolage Grotesque font
embedded directly as base64 `@font-face` data so the static image doesn't
depend on a live Google Fonts request at generation time. `og:image` and
`twitter:image` currently point at a relative path (`/og-image.png`), which
works for local preview; swap it to an absolute URL once this has a real
domain, since most crawlers expect one. Also added `theme-color` (matches
the charcoal background, so mobile browser chrome picks up the brand color)
and a plain meta description.

Ran the color-contrast numbers before calling this done rather than leaving
it as an open question: the muted tan (`#a4917c`) used for secondary text
throughout — tour venues, footer links, captions — measures 6.10:1 on the
charcoal-900 background and 5.38:1 on charcoal-800, both comfortably past
the 4.5:1 WCAG AA threshold for normal text. No change needed there.

## Status: complete

Every planned piece is built, wired, and verified end-to-end (hero → panel →
all four tabs → lyrics dialog → footer nav → back to hero, desktop and
mobile, both motion preferences) with zero console errors: hero visualizer,
four-tab content panel, lyrics dialog, footer, the finished logo system
integrated throughout (persistent mark, favicon, album cover), and Open
Graph/social metadata. The one open item is a matter of future content, not
unfinished build work: the flame visualizer was tuned against the synthetic
placeholder tone, so if a real reference track ever replaces it, the
height/color balance is worth a sanity check against that track.
