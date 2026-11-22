import Phaser from 'phaser';
import { bus } from '../core/bus';
import { state } from '../core/state';
import { BLOCK_H, BLOCK_W, ROAD, T, TILE, type WorldLayout } from './layout';
import { makeCharacter } from './golden';

/**
 * Brooklyn's big green places, drawn in code:
 *  - Prospect Park: the Lena Horne Bandshell with a free show going (BRIC's Celebrate Brooklyn!), a band, a crowd on blankets.
 *  - Green-Wood Cemetery: the Gothic main gate with monk parakeets in its spires, rows of headstones, Battle Hill's Minerva.
 *  - Brooklyn Bridge Park: Jane's Carousel in its glass pavilion (the piers are tiles, carved in layout.ts).
 *  - Brooklyn Botanic Garden: the Cherry Esplanade, the Japanese Hill-and-Pond Garden, the Steinhardt Conservatory.
 * Facts on the E prompts: docs/FACTS-brooklyn-org-tensions-care-parks.md
 */
export interface ParkSpot { id: string; x: number; y: number; r: number; label: () => string; act: () => void }

const cellBox = (c: number, r: number) => ({ x: (c * BLOCK_W + ROAD) * TILE, y: (r * BLOCK_H + ROAD) * TILE, w: (BLOCK_W - ROAD) * TILE, h: (BLOCK_H - ROAD) * TILE });

export function drawParks(scene: Phaser.Scene, L: WorldLayout, ignore: Phaser.GameObjects.GameObject[]): ParkSpot[] {
  const out: ParkSpot[] = [];
  const rng = new Phaser.Math.RandomDataGenerator(['brooklyn-parks']);
  const once = (k: string, ms: number) => { const now = Date.now(), last = Number(state.flag(k) ?? 0); if (now - last < ms) return false; state.setFlag(k, now); return true; };
  const label = (x: number, y: number, text: string, bg = '#1d1d1f') =>
    scene.add.text(x, y, text, { fontFamily: 'Nunito, Arial, sans-serif', fontSize: '12px', fontStyle: '900', color: '#fff', backgroundColor: bg, padding: { x: 5, y: 2 } }).setOrigin(0.5).setDepth(y + 400);

  // ------------------------------------------------------------------ PROSPECT PARK: the Bandshell
  const bs = L.spots.bandshell;
  if (bs) {
    const g = scene.add.graphics().setDepth(bs.y + 30);
    // stage
    g.fillStyle(0x6d5a44, 1).fillRect(bs.x - 92, bs.y - 6, 184, 40);
    g.fillStyle(0x857055, 1); for (let i = 0; i < 8; i++) g.fillRect(bs.x - 92 + i * 23, bs.y - 6, 2, 40);
    // the shell: a white half-dome, ribs fanning out, opening south toward the lawn
    g.fillStyle(0x000000, 0.28).fillEllipse(bs.x + 8, bs.y + 4, 230, 150);
    g.fillStyle(0xeeeae0, 1); g.slice(bs.x, bs.y, 110, Math.PI, 0, false); g.fillPath();
    g.lineStyle(3, 0xc9c3b4, 1); for (let a = Math.PI; a <= 2 * Math.PI + 0.01; a += Math.PI / 8) g.lineBetween(bs.x, bs.y, bs.x + Math.cos(a) * 110, bs.y + Math.sin(a) * 110);
    g.lineStyle(4, 0xb7b0a0, 1); g.beginPath(); g.arc(bs.x, bs.y, 110, Math.PI, 0); g.strokePath();
    g.fillStyle(0xd8d2c2, 1); g.slice(bs.x, bs.y, 42, Math.PI, 0, false); g.fillPath();
    // the band
    const band = [
      { skin: '#6b3e26', hair: '#1a1010', style: 'afro' as const, shirt: '#ffd23f', pants: '#1a1a1c' },
      { skin: '#e8c0a0', hair: '#8b4a2a', style: 'long' as const, shirt: '#ff4fa3', pants: '#2b3a6b' },
      { skin: '#a8714a', hair: '#1a1010', style: 'cap' as const, hatColor: '#2fd1c5', shirt: '#1f2a44', pants: '#d9c7a3' },
      { skin: '#4a2a1a', hair: '#1a1010', style: 'braids' as const, shirt: '#7b3fe4', pants: '#1a1a1c' },
    ];
    band.forEach((lk, i) => {
      makeCharacter(scene, `band${i}`, { ...lk, shoes: '#111' });
      const s = scene.add.sprite(bs.x - 54 + i * 36, bs.y + 12, `band${i}`, 0).setDepth(bs.y + 40);
      scene.tweens.add({ targets: s, y: s.y - 3, duration: 260 + i * 40, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    });
    // the crowd, on blankets on the lawn
    const blank = scene.add.graphics().setDepth(-5);
    const cols = [0xd8262e, 0x2b5fd1, 0xf2c23a, 0x3f8f3a, 0xe8743b, 0x7b3fe4, 0xf2f2f2];
    for (let i = 0; i < 26; i++) {
      const x = bs.x - 170 + rng.between(0, 340), y = bs.y + 70 + rng.between(0, 190);
      const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE); if (L.tiles[ty]?.[tx] !== T.GRASS) continue;
      blank.fillStyle(rng.pick(cols), 0.9).fillRect(x - 18, y - 12, 36, 26);
      for (let k = 0; k < 2; k++) {
        const p = scene.add.sprite(x - 8 + k * 16, y, `ped${rng.between(0, 39)}`, 0).setDepth(y).setRotation(-Math.PI / 2 + rng.realInRange(-0.4, 0.4));
        if (rng.frac() < 0.5) scene.tweens.add({ targets: p, scale: 1.06, duration: 300 + rng.between(0, 200), yoyo: true, repeat: -1 });
      }
    }
    // music in the air
    scene.time.addEvent({ delay: 700, loop: true, callback: () => {
      const n = scene.add.text(bs.x + Phaser.Math.Between(-80, 80), bs.y - 10, Phaser.Utils.Array.GetRandom(['♪', '♫', '♬']), { fontSize: '22px', color: '#ffd23f', stroke: '#16101f', strokeThickness: 4 }).setDepth(bs.y + 500);
      ignore.push(n);
      scene.tweens.add({ targets: n, y: n.y - 90, x: n.x + Phaser.Math.Between(-30, 30), alpha: 0, duration: 2200, onComplete: () => n.destroy() });
    } });
    ignore.push(g, blank);
    label(bs.x, bs.y - 128, 'LENA HORNE BANDSHELL');
    label(bs.x, bs.y - 108, 'CELEBRATE BROOKLYN! · FREE SHOW TONIGHT', '#d8262e');
    out.push({ id: 'bandshell', x: bs.x, y: bs.y + 80, r: 140, label: () => 'Dance at the free show', act: () => {
      if (once('t_dance', 60000)) state.apply({ solidarity: 8, toast: 'YOU DANCE. A STRANGER DANCES WITH YOU. THIS IS THE CITY.' });
      else bus.emit('ui:toast', 'BRIC\'S CELEBRATE BROOKLYN!: FREE SUMMER SHOWS AT THE LENA HORNE BANDSHELL');
    } });
  }

  // ------------------------------------------------------------------ GREEN-WOOD CEMETERY
  for (const [c, r] of [[5, 12], [6, 12], [5, 13], [6, 13]] as [number, number][]) {
    const b = cellBox(c, r), g = scene.add.graphics().setDepth(-5);
    for (let i = 0; i < 240; i++) {
      const x = b.x + rng.between(10, b.w - 10), y = b.y + rng.between(10, b.h - 10);
      const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE); if (L.tiles[ty]?.[tx] !== T.GRASS) continue;
      const kind = rng.frac();
      g.fillStyle(0x000000, 0.25).fillRect(x + 2, y + 2, kind > 0.95 ? 22 : 9, kind > 0.95 ? 18 : 5);
      if (kind > 0.95) { g.fillStyle(0x9b968c, 1).fillRect(x, y, 22, 18); g.fillStyle(0x7d786f, 1).fillRect(x, y, 22, 5); } // mausoleum
      else if (kind > 0.88) { g.fillStyle(0xb9b4aa, 1).fillRect(x, y - 4, 6, 12); g.fillStyle(0xd8d3c8, 1).fillTriangle(x, y - 4, x + 6, y - 4, x + 3, y - 9); } // obelisk
      else { g.fillStyle(0xa8a39a, 1).fillRoundedRect(x, y, 9, 5, 2); }
    }
    ignore.push(g);
  }
  const gw = L.spots.gwgate;
  if (gw) {
    const g = scene.add.graphics().setDepth(gw.y + 60);
    const brown = 0x6e4a36, light = 0x8a6248, dark = 0x4a3022;
    g.fillStyle(0x000000, 0.3).fillRect(gw.x - 96, gw.y + 6, 200, 40);
    // side towers and the tall central gable, brownstone Gothic Revival
    for (const s of [-1, 1]) { g.fillStyle(brown, 1).fillRect(gw.x + s * 70 - 16, gw.y - 30, 32, 60); g.fillStyle(light, 1).fillTriangle(gw.x + s * 70 - 16, gw.y - 30, gw.x + s * 70 + 16, gw.y - 30, gw.x + s * 70, gw.y - 78); }
    g.fillStyle(brown, 1).fillRect(gw.x - 46, gw.y - 40, 92, 70);
    g.fillStyle(light, 1).fillTriangle(gw.x - 46, gw.y - 40, gw.x + 46, gw.y - 40, gw.x, gw.y - 120);
    g.fillStyle(dark, 1); g.slice(gw.x, gw.y + 30, 26, Math.PI, 0, false); g.fillPath(); g.fillRect(gw.x - 26, gw.y + 4, 52, 26); // the arch you walk through
    g.lineStyle(2, 0xc9a27a, 0.9); for (let i = 0; i < 5; i++) g.lineBetween(gw.x - 30 + i * 15, gw.y - 36, gw.x - 30 + i * 15, gw.y - 6);
    // monk parakeets: bright green, chattering in the spires
    for (let i = 0; i < 6; i++) {
      const p = scene.add.circle(gw.x + Phaser.Math.Between(-80, 80), gw.y - Phaser.Math.Between(40, 100), 4, 0x6fd44a).setDepth(gw.y + 61);
      scene.tweens.add({ targets: p, x: p.x + Phaser.Math.Between(-10, 10), y: p.y + Phaser.Math.Between(-6, 6), duration: 600 + i * 90, yoyo: true, repeat: -1 });
      ignore.push(p);
    }
    ignore.push(g);
    label(gw.x, gw.y - 140, 'GREEN-WOOD CEMETERY');
    out.push({ id: 'gwgate', x: gw.x, y: gw.y + 40, r: 110, label: () => 'Look up at the gate', act: () => bus.emit('ui:toast', 'MONK PARAKEETS HAVE NESTED IN GREEN-WOOD\'S GOTHIC GATE SINCE THE 1970S') });
  }
  const bh = L.spots.battlehill;
  if (bh) {
    const g = scene.add.graphics().setDepth(bh.y + 20);
    g.fillStyle(0x000000, 0.3).fillCircle(bh.x + 4, bh.y + 4, 20);
    g.fillStyle(0x9b968c, 1).fillCircle(bh.x, bh.y, 18); g.fillStyle(0x4f7a6a, 1).fillCircle(bh.x, bh.y - 4, 9); // Minerva in bronze-green
    g.lineStyle(3, 0x4f7a6a, 1).lineBetween(bh.x, bh.y - 4, bh.x - 16, bh.y - 22); // her arm raised toward the harbor
    ignore.push(g);
    label(bh.x, bh.y - 36, 'BATTLE HILL · MINERVA');
    out.push({ id: 'battlehill', x: bh.x, y: bh.y, r: 90, label: () => 'Climb Battle Hill', act: () => {
      bus.emit('ui:toast', 'BATTLE HILL: BROOKLYN\'S HIGHEST POINT. MINERVA SALUTES THE STATUE OF LIBERTY.');
      setTimeout(() => bus.emit('ui:toast', 'BURIED HERE: JEAN-MICHEL BASQUIAT, LEONARD BERNSTEIN, AND BOSS TWEED. BROOKLYN KEEPS EVERYONE.'), 1800);
    } });
  }

  // ------------------------------------------------------------------ BROOKLYN BRIDGE PARK: Jane's Carousel
  const jc = L.spots.carousel;
  if (jc) {
    const g = scene.add.graphics().setDepth(jc.y + 40);
    g.fillStyle(0x000000, 0.28).fillRect(jc.x - 56, jc.y - 46, 116, 104);
    g.fillStyle(0xbfe3f0, 0.55).fillRect(jc.x - 60, jc.y - 50, 112, 100); g.lineStyle(3, 0xf2f2f2, 1).strokeRect(jc.x - 60, jc.y - 50, 112, 100);
    g.lineStyle(1, 0xf2f2f2, 0.8); for (let i = 1; i < 6; i++) g.lineBetween(jc.x - 60 + i * 19, jc.y - 50, jc.x - 60 + i * 19, jc.y + 50);
    const wheel = scene.add.graphics().setPosition(jc.x - 4, jc.y).setDepth(jc.y + 41);
    const hc = [0xd8262e, 0xf2c23a, 0x2b5fd1, 0xf2f2f2, 0xff4fa3, 0x3f8f3a];
    wheel.fillStyle(0xe8d9b8, 1).fillCircle(0, 0, 38); wheel.fillStyle(0xc0392b, 1).fillCircle(0, 0, 12);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; wheel.fillStyle(hc[i % hc.length], 1).fillEllipse(Math.cos(a) * 28, Math.sin(a) * 28, 9, 6); }
    scene.tweens.add({ targets: wheel, rotation: Math.PI * 2, duration: 9000, repeat: -1 });
    ignore.push(g, wheel);
    label(jc.x, jc.y - 64, 'JANE\'S CAROUSEL (1922)');
    out.push({ id: 'carousel', x: jc.x, y: jc.y + 56, r: 100, label: () => 'Ride Jane\'s Carousel', act: () => {
      if (once('t_carousel', 60000)) state.apply({ solidarity: 5, toast: 'ROUND AND ROUND. THE MANHATTAN BRIDGE GOES BY. TWICE.' });
      else bus.emit('ui:toast', 'BROOKLYN BRIDGE PARK: 85 ACRES OF PIERS AND LAWNS, DUMBO TO ATLANTIC AVE');
    } });
  }

  // ------------------------------------------------------------------ BROOKLYN BOTANIC GARDEN
  {
    const b = cellBox(11, 10), g = scene.add.graphics().setDepth(-5), cx = b.x + b.w / 2;
    // Cherry Esplanade: two rows of cherry trees in bloom
    for (let i = 0; i < 9; i++) for (const row of [0, 1]) {
      const x = b.x + 50 + i * ((b.w - 100) / 8), y = b.y + 40 + row * 70;
      g.fillStyle(0x000000, 0.25).fillCircle(x + 5, y + 5, 20);
      g.fillStyle(0xf6b8cf, 1).fillCircle(x, y, 20); g.fillStyle(0xfbd6e3, 1).fillCircle(x - 5, y - 5, 10); g.fillStyle(0xe98fb2, 1).fillCircle(x + 6, y + 6, 6);
    }
    // Japanese Hill-and-Pond Garden: the pond, an island and a red torii in the water
    const py = b.y + b.h * 0.68;
    g.fillStyle(0x3a8fb0, 1).fillEllipse(b.x + b.w * 0.3, py, b.w * 0.42, b.h * 0.34);
    g.fillStyle(0x5aa64a, 1).fillEllipse(b.x + b.w * 0.3, py, 40, 24);
    g.fillStyle(0xd8262e, 1).fillRect(b.x + b.w * 0.18 - 18, py - 30, 36, 5).fillRect(b.x + b.w * 0.18 - 14, py - 30, 4, 22).fillRect(b.x + b.w * 0.18 + 10, py - 30, 4, 22);
    ignore.push(g);
    // Steinhardt Conservatory: glass houses
    const gc = scene.add.graphics().setDepth(b.y + b.h * 0.8 + 30);
    for (let i = 0; i < 3; i++) {
      const x = b.x + b.w * 0.6 + i * 56, y = b.y + b.h * 0.56;
      gc.fillStyle(0x000000, 0.25).fillRect(x + 5, y + 5, 46, 70);
      gc.fillStyle(0xcdeef2, 0.85).fillRect(x, y, 46, 70); gc.lineStyle(1.5, 0xffffff, 0.9).strokeRect(x, y, 46, 70);
      for (let k = 1; k < 4; k++) gc.lineBetween(x + k * 11.5, y, x + k * 11.5, y + 70);
    }
    ignore.push(gc);
    label(cx, b.y + 12, 'CHERRY ESPLANADE', '#c0407a');
    const sp = L.spots.bbg;
    if (sp) out.push({ id: 'bbg', x: sp.x, y: sp.y, r: 200, label: () => 'Stroll the Botanic Garden', act: () => {
      if (once('t_bbg', 60000)) state.apply({ solidarity: 5, toast: 'THE CHERRY TREES DON\'T CARE ABOUT YOUR TO-DO LIST. GOOD.' });
      else bus.emit('ui:toast', 'BROOKLYN BOTANIC GARDEN: 52 ACRES. PAY WHAT YOU WISH, TUESDAY–FRIDAY, NOVEMBER TO FEBRUARY.');
    } });
  }
  return out;
}
