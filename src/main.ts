import Phaser from 'phaser';
import './ui/style.css';
import { WorldScene } from './scenes/WorldScene';
import { missions } from './systems/missions';
import { ui } from './ui/ui';
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
    scale: { mode: Phaser.Scale.RESIZE, width: window.innerWidth, height: window.innerHeight },
    physics: { default: 'arcade', arcade: { debug: false } },
    render: { antialias: true, roundPixels: false },
    scene: [WorldScene],
  });
  screenReadout(game);
}

/** TEMPORARY (Nov 23 2026): in the home-screen app only, show what the phone reports about the screen,
 *  to find why the player sits low there. Remove once fixed. */
function screenReadout(game: Phaser.Game) {
  const standalone = matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches || (navigator as any).standalone;
  if (!standalone) return;
  const el = document.createElement('div');
  el.style.cssText = 'position:fixed;left:50%;bottom:4px;transform:translateX(-50%);z-index:99;background:rgba(0,0,0,.75);color:#0f0;font:11px/1.3 monospace;padding:3px 6px;border-radius:4px;pointer-events:none;white-space:pre;text-align:center';
  document.body.appendChild(el);
  const r = (o: { width: number; height: number }) => `${Math.round(o.width)}x${Math.round(o.height)}`;
  setInterval(() => {
    const vv = window.visualViewport, sc = game.scene.scenes[0] as any, cam = sc?.cameras?.main, p = sc?.player;
    const gameEl = document.getElementById('game')!.getBoundingClientRect(), cv = game.canvas?.getBoundingClientRect();
    const ps = cam && p ? `${Math.round((p.x - cam.worldView.x) * cam.zoom)},${Math.round((p.y - cam.worldView.y) * cam.zoom)}` : '-';
    el.textContent = `inner ${innerWidth}x${innerHeight} · vv ${vv ? r(vv) + ' s' + vv.scale.toFixed(2) + ' top' + Math.round(vv.offsetTop) : '-'} · screen ${screen.width}x${screen.height}\n`
      + `#game ${r(gameEl)}@${Math.round(gameEl.top)} · canvas ${cv ? r(cv) + '@' + Math.round(cv.top) : '-'} · phaser ${game.scale.width}x${game.scale.height} · cam ${cam ? r(cam) + ' z' + cam.zoom : '-'} · you ${ps}`;
  }, 500);
}

boot();
