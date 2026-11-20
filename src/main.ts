import Phaser from 'phaser';
import './ui/style.css';
import { WorldScene } from './scenes/WorldScene';
import { missions } from './systems/missions';
import { ui } from './ui/ui';

async function boot() {
  // Textures are drawn with canvas text, so wait (briefly) for the comic fonts.
  try {
    await Promise.race([
      Promise.all([document.fonts.load('40px Bangers'), document.fonts.load('800 16px Nunito')]),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
  } catch { /* offline: fall back to Impact */ }

  missions.init();
  ui.init();

  new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    backgroundColor: '#1b1230',
    scale: { mode: Phaser.Scale.RESIZE, width: window.innerWidth, height: window.innerHeight },
    physics: { default: 'arcade', arcade: { debug: false } },
    render: { antialias: true, roundPixels: false },
    scene: [WorldScene],
  });
}

boot();
