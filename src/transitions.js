// Thin wrapper around the View Transitions API. Every call site hands this
// a DOM-mutation callback; on unsupported browsers (or reduced-motion) the
// mutation still happens, just without the animated crossfade.

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

export function withViewTransition(mutateDom) {
  if (prefersReducedMotion || !document.startViewTransition) {
    mutateDom();
    return Promise.resolve();
  }
  return document.startViewTransition(mutateDom).finished;
}
