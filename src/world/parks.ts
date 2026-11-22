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
    // the Lena Horne Bandshell, painted in ChatGPT (today's mural shell, wings and stage lights)
    const shell = scene.add.image(bs.x, bs.y + 30, 'park-bandshell').setOrigin(0.5, 0.8).setDepth(bs.y + 30);
    const g = scene.add.graphics().setDepth(bs.y + 29);
    // the band
    const band = [
      { skin: '#6b3e26', hair: '#1a1010', style: 'afro' as const, shirt: '#ffd23f', pants: '#1a1a1c' },
      { skin: '#e8c0a0', hair: '#8b4a2a', style: 'long' as const, shirt: '#ff4fa3', pants: '#2b3a6b' },
      { skin: '#a8714a', hair: '#1a1010', style: 'cap' as const, hatColor: '#2fd1c5', shirt: '#1f2a44', pants: '#d9c7a3' },
      { skin: '#4a2a1a', hair: '#1a1010', style: 'braids' as const, shirt: '#7b3fe4', pants: '#1a1a1c' },
    ];
    band.forEach((lk, i) => {
      makeCharacter(scene, `band${i}`, { ...lk, shoes: '#111' });
      const s = scene.add.sprite(bs.x - 46 + i * 30, bs.y + 18, `band${i}`, 0).setDepth(bs.y + 40);
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
    ignore.push(g, blank, shell);
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
    const gate = scene.add.image(gw.x, gw.y + 40, 'park-gwgate').setOrigin(0.5, 0.9).setDepth(gw.y + 60); // painted in ChatGPT
    const g = scene.add.graphics();
    // monk parakeets: bright green, chattering in the spires
    for (let i = 0; i < 6; i++) {
      const p = scene.add.circle(gw.x + Phaser.Math.Between(-60, 60), gw.y - Phaser.Math.Between(60, 150), 3, 0x6fd44a).setDepth(gw.y + 61);
      scene.tweens.add({ targets: p, x: p.x + Phaser.Math.Between(-10, 10), y: p.y + Phaser.Math.Between(-6, 6), duration: 600 + i * 90, yoyo: true, repeat: -1 });
      ignore.push(p);
    }
    ignore.push(g, gate);
    label(gw.x, gw.y - 200, 'GREEN-WOOD CEMETERY');
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
    const box = scene.add.image(jc.x, jc.y + 40, 'park-carousel').setOrigin(0.5, 0.85).setDepth(jc.y + 40); // painted in ChatGPT
    ignore.push(box);
    label(jc.x, jc.y - 120, 'JANE\'S CAROUSEL (1922)');
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
    // Steinhardt Conservatory, painted in ChatGPT
    const gc = scene.add.image(b.x + b.w * 0.78, b.y + b.h - 6, 'park-conservatory').setOrigin(0.5, 1).setScale(0.82).setDepth(b.y + b.h);
    ignore.push(gc);
    label(cx, b.y + 12, 'CHERRY ESPLANADE', '#c0407a');
    const sp = L.spots.bbg;
    if (sp) out.push({ id: 'bbg', x: sp.x, y: sp.y, r: 200, label: () => 'Stroll the Botanic Garden', act: () => {
      if (once('t_bbg', 60000)) state.apply({ solidarity: 5, toast: 'THE CHERRY TREES DON\'T CARE ABOUT YOUR TO-DO LIST. GOOD.' });
      else bus.emit('ui:toast', 'BROOKLYN BOTANIC GARDEN: 52 ACRES. PAY WHAT YOU WISH, TUESDAY–FRIDAY, NOVEMBER TO FEBRUARY.');
    } });
  }
  // ------------------------------------------------------------------ BROOKLYN COLLEGE: the East Quad, La Guardia Hall's clock tower
  const bc = L.spots.bkcollege;
  if (bc) {
    const q = scene.add.image(bc.x, bc.y + 120, 'park-bkcollege').setOrigin(0.5, 1).setScale(0.75).setDepth(bc.y + 120); // painted in ChatGPT
    ignore.push(q);
    out.push({ id: 'bkcollege', x: bc.x, y: bc.y + 130, r: 120, label: () => 'Walk the quad', act: () => bus.emit('ui:toast', 'BROOKLYN COLLEGE: CUNY. THE 2 AND 5 STOP RIGHT OUTSIDE.') });
  }
  return out;
}
