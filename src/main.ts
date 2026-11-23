import Phaser from 'phaser';
import './ui/style.css';
import { WorldScene } from './scenes/WorldScene';
import { missions } from './systems/missions';
import { ui } from './ui/ui';
import { state } from './core/state';
import { lockPageZoom } from './ui/nozoom';

lockPageZoom(); // phones: the page never zooms; the game camera does

async function boot() {
  (window as any).__pl?.set(0.1); // the code is here; next, the fonts and images
  // Textures are drawn with canvas text, so wait (briefly) for the comic fonts.
  try {
    await Promise.race([
      Promise.all([document.fonts.load('40px Bangers'), document.fonts.load('800 16px Nunito')]),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
  } catch { /* offline: fall back to Impact */ }

  missions.init();
  ui.init();

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    backgroundColor: '#1b1230',
    // NONE: we size the game ourselves (keepGameSized). Phaser's RESIZE mode got stuck at stale sizes in the home-screen app.
    scale: { mode: Phaser.Scale.NONE, width: window.innerWidth, height: window.innerHeight },
    physics: { default: 'arcade', arcade: { debug: false } },
    render: { antialias: true, roundPixels: false },
    scene: [WorldScene],
  });
  keepGameSized(game);
  autoUpdate(game);
}

/**
 * A home-screen app resumes its old page instead of reloading, so phones kept running week-old code. On launch and
 * whenever the app comes back to the front, ask the site which build is current; if it's newer, save (only mid-game,
 * never from the title screen) and reload into it, with a fresh URL so no cache can hand back the old page.
 */
function autoUpdate(game: Phaser.Game) {
  if (import.meta.env.DEV) return;
  const mine = [...document.scripts].map((s) => s.src).find((s) => /assets\/index-[^/]+\.js/.test(s));
  if (!mine) return;
  let busy = false;
  const check = async () => {
    if (busy || document.visibilityState !== 'visible') return;
    busy = true;
    try {
      const html = await (await fetch(`${location.pathname}?check=${Date.now()}`, { cache: 'no-store' })).text();
      const latest = html.match(/assets\/index-[^"']+\.js/)?.[0];
      if (latest && !mine.endsWith(latest)) {
        if ((game.scene.scenes[0] as any)?.mode === 'play') state.save();
        location.replace(`${location.pathname}?v=${encodeURIComponent(latest.slice(13, 21))}`);
      }
    } catch { /* offline: keep playing this version */ }
    busy = false;
  };
  check();
  document.addEventListener('visibilitychange', check);
  window.addEventListener('pageshow', check);
}

/**
 * The game always matches its container (#game, fixed to the screen). In the iPhone home-screen app, Phaser's own
 * RESIZE mode got stuck at stale sizes: 874x812 on an 874x402 screen (you sat off the bottom), then 874x874 held
 * upright on a 402-wide screen (the mini-map fell off the right). So we measure #game and set the size directly,
 * on every resize or rotation and twice a second as a safety net.
 */
function keepGameSized(game: Phaser.Game) {
  const el = document.getElementById('game')!;
  // Home-screen app held upright: the phone gives the page 812px of an 874px screen and leaves a dark strip at the
  // bottom. Stretch the game, HUD and overlays to the full screen height (style.css: body.tall).
  const standalone = matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches || (navigator as any).standalone;
  const fitScreen = () => {
    const long = Math.max(screen.width, screen.height), short = Math.min(screen.width, screen.height);
    const tall = !!standalone && Math.abs(innerWidth - short) < 2 && innerHeight < long && innerHeight > long - 120;
    document.body.classList.toggle('tall', tall);
    if (tall) document.documentElement.style.setProperty('--app-h', `${long}px`);
  };
  const sync = () => {
    fitScreen();
    const r = el.getBoundingClientRect(), w = Math.round(r.width), h = Math.round(r.height);
    if (w > 0 && h > 0 && (game.scale.width !== w || game.scale.height !== h)) game.scale.resize(w, h);
  };
  game.events.once('ready', sync);
  window.addEventListener('resize', sync);
  window.addEventListener('orientationchange', () => { sync(); setTimeout(sync, 300); setTimeout(sync, 1000); });
  window.visualViewport?.addEventListener('resize', sync);
  window.addEventListener('pageshow', sync);
  setInterval(sync, 500);
}


boot();
