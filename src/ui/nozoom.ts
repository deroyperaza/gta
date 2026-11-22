/**
 * Keep the page at 100% on phones. iOS Safari ignores user-scalable=no (for accessibility), so a double-tap on a
 * button or a pinch could zoom the whole page, and because the game catches every touch, the player couldn't pinch
 * back out. The game has its own camera, so page zoom is never wanted here.
 */
export function lockPageZoom() {
  const block = (e: Event) => e.preventDefault();
  // Safari's pinch gestures
  for (const ev of ['gesturestart', 'gesturechange', 'gestureend']) document.addEventListener(ev, block, { passive: false });
  // Two fingers on the page outside the canvas (the canvas handles its own touches)
  document.addEventListener('touchmove', (e) => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });
  // Double-tap zoom is off via CSS (touch-action: manipulation on buttons), which doesn't delay fast taps
  document.addEventListener('dblclick', block, { passive: false });

  // Safety net: if the page ends up zoomed anyway, snap it back by re-applying the viewport limits
  const meta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement | null;
  const base = meta?.content ?? 'width=device-width, initial-scale=1.0, viewport-fit=cover';
  const reset = () => {
    const vv = window.visualViewport;
    if (!meta || !vv || vv.scale <= 1.01) return;
    if (document.activeElement && (document.activeElement as HTMLElement).tagName === 'INPUT') return;
    meta.content = `${base}, minimum-scale=1, maximum-scale=1`;
    setTimeout(() => { meta.content = base; }, 300);
  };
  window.visualViewport?.addEventListener('resize', reset);
  document.addEventListener('focusout', () => setTimeout(reset, 100));
  window.addEventListener('orientationchange', () => setTimeout(reset, 300));
}
