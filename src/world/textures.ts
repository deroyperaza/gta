import Phaser from 'phaser';
import { T, TILE, type BuildingDef, type BuildingType } from './layout';

/**
 * Every graphic in the game is drawn here at boot with Canvas 2D:
 * thick black outlines, saturated sunset palette, comic-book shapes.
 * No external image assets required.
 */

export const INK = '#16101f';
export const PAL = {
  purple: '#7b3fe4', deep: '#3b1f78', pink: '#ff4fa3', orange: '#ff8a3d', yellow: '#F5C242',
  blue: '#3a7bff', teal: '#2fd1c5', green: '#5fd35a', red: '#ff4b4b', cream: '#fff3dc',
};

type Ctx = CanvasRenderingContext2D;

function canvas(scene: Phaser.Scene, key: string, w: number, h: number, draw: (c: Ctx) => void) {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, w, h)!;
  const ctx = tex.getContext();
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  draw(ctx);
  tex.refresh();
  return tex;
}

function rr(c: Ctx, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}
function box(c: Ctx, x: number, y: number, w: number, h: number, fill: string, lw = 3, r = 0) {
  if (r) rr(c, x, y, w, h, r); else { c.beginPath(); c.rect(x, y, w, h); }
  c.fillStyle = fill; c.fill(); if (lw) { c.lineWidth = lw; c.strokeStyle = INK; c.stroke(); }
}
function circ(c: Ctx, x: number, y: number, r: number, fill: string, lw = 3) {
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fillStyle = fill; c.fill(); if (lw) { c.lineWidth = lw; c.strokeStyle = INK; c.stroke(); }
}
function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v + amt * 255)));
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => f(v).toString(16).padStart(2, '0')).join('')}`;
}
function fitText(c: Ctx, text: string, x: number, y: number, maxW: number, size: number, color = '#fff', stroke = INK) {
  let s = size;
  do { c.font = `bold ${s}px "Bangers", "Impact", sans-serif`; s--; } while (c.measureText(text).width > maxW && s > 7);
  c.textAlign = 'center'; c.textBaseline = 'middle';
  if (stroke) { c.lineJoin = 'round'; c.lineWidth = 3; c.strokeStyle = stroke; c.strokeText(text, x, y); }
  c.fillStyle = color; c.fillText(text, x, y);
}

// Seeded noise for texture detail
let seed = 7;
const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

// ------------------------------------------------------------------ TILES
export function makeTiles(scene: Phaser.Scene) {
  const N = 15;
  canvas(scene, 'tiles', TILE * N, TILE, (c) => {
    const at = (i: number, fn: (x: number) => void) => { c.save(); c.beginPath(); c.rect(i * TILE, 0, TILE, TILE); c.clip(); fn(i * TILE); c.restore(); };
    const asphalt = (x: number, base = '#3d3354') => {
      c.fillStyle = base; c.fillRect(x, 0, TILE, TILE);
      for (let i = 0; i < 14; i++) { c.fillStyle = rnd() < 0.5 ? '#4a3f63' : '#332a48'; c.fillRect(x + rnd() * 32, rnd() * 32, 2, 2); }
    };
    const sidewalk = (x: number, base = '#cdb9d2', line = '#a991b2') => {
      c.fillStyle = base; c.fillRect(x, 0, TILE, TILE);
      c.strokeStyle = line; c.lineWidth = 2; c.strokeRect(x + 1, 1, TILE - 2, TILE - 2);
      c.fillStyle = shade(base, 0.05); c.fillRect(x + 4, 4, 10, 3);
    };
    at(T.ASPHALT, (x) => asphalt(x));
    at(T.LANE_V, (x) => { asphalt(x); c.fillStyle = PAL.yellow; c.fillRect(x + 14, 4, 4, 24); });
    at(T.LANE_H, (x) => { asphalt(x); c.fillStyle = PAL.yellow; c.fillRect(x + 4, 14, 24, 4); });
    at(T.SIDEWALK, (x) => sidewalk(x));
    at(T.GRASS, (x) => {
      c.fillStyle = '#58b956'; c.fillRect(x, 0, TILE, TILE);
      for (let i = 0; i < 8; i++) { c.strokeStyle = rnd() < 0.5 ? '#3f9a46' : '#7bd66b'; c.lineWidth = 2; const gx = x + rnd() * 28 + 2, gy = rnd() * 28 + 3; c.beginPath(); c.moveTo(gx, gy + 4); c.lineTo(gx + 1, gy); c.stroke(); }
    });
    at(T.PLAZA, (x) => {
      c.fillStyle = '#e8cfa8'; c.fillRect(x, 0, TILE, TILE);
      c.strokeStyle = '#c9a97f'; c.lineWidth = 2;
      c.strokeRect(x + 1, 1, 15, 15); c.strokeRect(x + 16, 16, 15, 15); c.strokeRect(x + 16, 1, 15, 15); c.strokeRect(x + 1, 16, 15, 15);
    });
    at(T.CROSS_V, (x) => { asphalt(x); c.fillStyle = '#f4ecff'; for (let i = 2; i < 32; i += 8) c.fillRect(x + i, 3, 4, 26); });
    at(T.CROSS_H, (x) => { asphalt(x); c.fillStyle = '#f4ecff'; for (let i = 2; i < 32; i += 8) c.fillRect(x + 3, i, 26, 4); });
    at(T.GARDEN, (x) => {
      c.fillStyle = '#8b5a3c'; c.fillRect(x, 0, TILE, TILE);
      c.fillStyle = '#6e4430'; c.fillRect(x, 12, TILE, 3); c.fillRect(x, 26, TILE, 3);
      for (let i = 0; i < 4; i++) { circ(c, x + 4 + i * 8, 8, 3, i % 2 ? '#7bd66b' : '#3fb24f', 1.5); circ(c, x + 4 + i * 8, 22, 3, i % 2 ? '#ff7a59' : '#7bd66b', 1.5); }
    });
    at(T.WATER, (x) => {
      c.fillStyle = '#3aa4f0'; c.fillRect(x, 0, TILE, TILE);
      c.strokeStyle = '#8fd4ff'; c.lineWidth = 2;
      for (let i = 0; i < 3; i++) { const wy = 6 + i * 10; c.beginPath(); c.moveTo(x + 4 + (i % 2) * 6, wy); c.quadraticCurveTo(x + 10 + (i % 2) * 6, wy - 4, x + 16 + (i % 2) * 6, wy); c.stroke(); }
    });
    at(T.YARD, (x) => {
      c.fillStyle = '#6f9d52'; c.fillRect(x, 0, TILE, TILE);
      c.fillStyle = '#86b062'; c.fillRect(x + rnd() * 20, rnd() * 20, 8, 6);
      c.fillStyle = '#5c8a44'; c.fillRect(x + rnd() * 24, rnd() * 24, 4, 4);
    });
    at(T.INTERSECTION, (x) => asphalt(x, '#382f4e'));
    at(T.COURT, (x) => { c.fillStyle = '#e8743b'; c.fillRect(x, 0, TILE, TILE); c.fillStyle = '#f08a52'; c.fillRect(x, 0, TILE, 2); c.fillRect(x, 0, 2, TILE); });
    at(T.LOT, (x) => {
      c.fillStyle = '#a59db3'; c.fillRect(x, 0, TILE, TILE);
      c.strokeStyle = '#867e95'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x + rnd() * 32, 0); c.lineTo(x + rnd() * 32, 16); c.lineTo(x + rnd() * 32, 32); c.stroke();
    });
    at(T.CURB, (x) => { sidewalk(x, '#bea9c4', '#9b84a5'); });
  });
}

// ------------------------------------------------------------------ BUILDINGS
const BASE: Record<BuildingType, string[]> = {
  victorian: ['#d9c48a', '#a8b98e', '#c9a7c4', '#9bb8cc'],
  rowhouse: ['#b0805a', '#8f5a42', '#c9b08a', '#a06a4a'],
  twofamily: ['#c4a27a', '#9a6a50', '#d8ccb4', '#8a7a6a'],
  walkup: ['#8b4a38', '#9a5a44', '#7a4a3a', '#a2684e'],
  brownstone: ['#a0583b', '#8a4b3a', '#b46a45', '#7d4d6b'],
  coffee: ['#2fd1c5', '#ff8a3d', '#F5C242', '#ff4fa3'],
  boutique: ['#ff9ad1', '#c7a6ff', '#ffe1a8', '#9be7ff'],
  nonprofit: ['#9be37b', '#F5C242', '#9be37b', '#F5C242'],
  coop: ['#6fcf5e', '#6fcf5e', '#6fcf5e', '#6fcf5e'],
  bodega: ['#ffcf3f', '#ffcf3f', '#ffcf3f', '#ffcf3f'],
  mural: ['#ff4fa3', '#ff4fa3', '#ff4fa3', '#ff4fa3'],
  tenant: ['#ff6b4a', '#ff6b4a', '#ff6b4a', '#ff6b4a'],
  community: ['#ffb23f', '#ffb23f', '#ffb23f', '#ffb23f'],
  studio: ['#b4533f', '#9b4436', '#7c5cbf', '#b4533f'],
  warehouse: ['#8f4a3c', '#6b5f7a', '#a35a3b', '#5a7a8a'],
  gallery: ['#f4f0ff', '#f4f0ff', '#1d1a2a', '#f4f0ff'],
  government: ['#d8d2e6', '#cfc6e0', '#e3dcef', '#d8d2e6'],
  courthouse: ['#ddd5ea', '#ddd5ea', '#ddd5ea', '#ddd5ea'],
  police: ['#5a7fd6', '#5a7fd6', '#5a7fd6', '#5a7fd6'],
  tower: ['#5aa9ff', '#7b6cff', '#46c3e8', '#9b8cff'],
  apartment: ['#d9824b', '#c0617a', '#8c79c8', '#e0a04a'],
  laundromat: ['#7ad7ff', '#ffa6d9', '#7ad7ff', '#ffa6d9'],
  church: ['#e9dfc9', '#e9dfc9', '#e9dfc9', '#e9dfc9'],
  shed: ['#c08a4f', '#c08a4f', '#c08a4f', '#c08a4f'],
  bakery: ['#ffe0a3', '#ffe0a3', '#ffe0a3', '#ffe0a3'],
  sales: ['#1c1a2b', '#1c1a2b', '#1c1a2b', '#1c1a2b'],
  arena: ['#7a4630', '#7a4630', '#7a4630', '#7a4630'],
  library: ['#d9d1c0', '#d9d1c0', '#d9d1c0', '#d9d1c0'],
  arch: ['#cfc3ae', '#cfc3ae', '#cfc3ae', '#cfc3ae'],
  supertall: ['#1a1a1e', '#1a1a1e', '#1a1a1e', '#1a1a1e'],
  clocktower: ['#c9a982', '#c9a982', '#c9a982', '#c9a982'],
};

export function buildingKey(b: BuildingDef) { return `bld-${b.id}`; }

export function makeBuilding(scene: Phaser.Scene, b: BuildingDef) {
  canvas(scene, buildingKey(b), b.w, b.h, (c) => drawBuilding(c, b));
}

function drawBuilding(c: Ctx, b: BuildingDef) {
  const { w, h, type } = b;
  const base = BASE[type][b.variant % 4];
  const roofH = Math.min(Math.round(h * 0.32), 84);
  const fy = roofH, fh = h - roofH; // facade
  seed = (b.x * 31 + b.y * 17) % 2147483647 || 5;

  // Roof
  box(c, 2, 2, w - 4, roofH, type === 'tower' ? '#2d2b52' : '#3a2e55', 0);
  c.fillStyle = '#4a3c6b'; c.fillRect(8, 8, w - 16, roofH - 14);
  // roof details
  if (type === 'tower' || type === 'government' || type === 'police') box(c, w / 2 - 18, 14, 36, 22, '#8a86a8', 2.5);
  else if (b.district === 'parkslope' && (type === 'brownstone' || type === 'coop')) {
    for (let i = 0; i < Math.floor((w - 20) / 26); i++) { box(c, 12 + i * 26, 14, 22, 14, '#2f5bd1', 2); c.strokeStyle = '#8fb7ff'; c.lineWidth = 1; c.beginPath(); c.moveTo(12 + i * 26, 21); c.lineTo(34 + i * 26, 21); c.stroke(); }
  } else if (rnd() < 0.55 && w >= 96) {
    // water tower — the quintessential NYC roof
    const tx = 16 + rnd() * (w - 60);
    box(c, tx, 22, 30, 26, '#8b5a3c', 2.5, 4); c.beginPath(); c.moveTo(tx - 2, 22); c.lineTo(tx + 15, 8); c.lineTo(tx + 32, 22); c.closePath(); c.fillStyle = '#6e4430'; c.fill(); c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke();
  } else { box(c, 12, 14, 20, 14, '#9a94b0', 2); }
  if (type === 'sales') { c.fillStyle = '#F5C242'; c.fillRect(10, 10, w - 20, 4); }

  // Facade
  box(c, 2, fy, w - 4, fh - 2, base, 0);
  // Brick / texture hint
  if (type === 'brownstone' || type === 'warehouse' || type === 'studio') {
    c.fillStyle = shade(base, -0.06);
    for (let y = fy + 6; y < h - 10; y += 8) for (let x = 6 + ((y / 8) % 2) * 6; x < w - 8; x += 18) c.fillRect(x, y, 10, 3);
  }
  // Cornice
  box(c, 0, fy - 2, w, 10, shade(base, -0.18), 3);

  const signY = h - 54;
  const windowsBottom = type === 'tower' ? h - 60 : signY - 10;

  // Windows grid
  const drawWindows = (cols: number, rows: number, ww: number, wh: number, top: number, bottom: number, color?: string) => {
    const gapX = (w - cols * ww) / (cols + 1);
    const gapY = (bottom - top - rows * wh) / (rows + 1);
    for (let r = 0; r < rows; r++) for (let col = 0; col < cols; col++) {
      const x = gapX + col * (ww + gapX), y = top + gapY + r * (wh + gapY);
      const lit = rnd() < 0.45;
      box(c, x, y, ww, wh, color ?? (lit ? '#ffd86b' : '#5b4c8f'), 2.5, 2);
      if (!color && lit) { c.fillStyle = '#fff3b0'; c.fillRect(x + 3, y + 3, ww / 3, wh / 3); }
      if (type === 'brownstone') { c.fillStyle = INK; c.fillRect(x - 2, y - 5, ww + 4, 4); }
    }
  };

  switch (type) {
    case 'tower': {
      c.save(); c.beginPath(); c.rect(2, fy + 8, w - 4, fh - 10); c.clip();
      const g = c.createLinearGradient(0, fy, w, h); g.addColorStop(0, '#8ed1ff'); g.addColorStop(0.5, base); g.addColorStop(1, '#ff8ad0');
      c.fillStyle = g; c.fillRect(2, fy, w, fh);
      c.strokeStyle = 'rgba(22,16,31,.55)'; c.lineWidth = 2;
      for (let x = 14; x < w; x += 18) { c.beginPath(); c.moveTo(x, fy); c.lineTo(x, h); c.stroke(); }
      for (let y = fy + 16; y < h; y += 16) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
      c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 6; c.beginPath(); c.moveTo(10, h - 20); c.lineTo(w * 0.6, fy + 20); c.stroke();
      c.restore();
      box(c, w / 2 - 22, h - 46, 44, 44, '#cfefff', 3);
      if (b.name) { box(c, 10, fy + 14, w - 20, 26, INK, 0); fitText(c, b.name, w / 2, fy + 27, w - 28, 18, PAL.yellow, ''); }
      break;
    }
    case 'government': case 'courthouse': {
      // pediment
      c.beginPath(); c.moveTo(6, fy + 30); c.lineTo(w / 2, fy + 2); c.lineTo(w - 6, fy + 30); c.closePath(); c.fillStyle = shade(base, -0.08); c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
      const n = Math.max(4, Math.floor(w / 32));
      for (let i = 0; i < n; i++) { const x = 16 + i * ((w - 40) / (n - 1)); box(c, x, fy + 34, 12, fh - 64, '#f6f2ff', 2.5); }
      for (let i = 0; i < 3; i++) box(c, 8 + i * 4, h - 28 + i * 8, w - 16 - i * 8, 8, shade(base, -0.1 * i), 2);
      if (b.name) { box(c, w * 0.15, fy + 40, w * 0.7, 22, INK, 0); fitText(c, b.name, w / 2, fy + 51, w * 0.66, 16, '#fff', ''); }
      if (type === 'courthouse') { c.strokeStyle = PAL.yellow; c.lineWidth = 3; c.beginPath(); c.moveTo(w / 2 - 14, fy + 20); c.lineTo(w / 2 + 14, fy + 20); c.moveTo(w / 2, fy + 12); c.lineTo(w / 2, fy + 26); c.stroke(); }
      break;
    }
    case 'police': {
      drawWindows(Math.floor(w / 40), 2, 22, 22, fy + 10, signY - 6, '#a9c4ff');
      box(c, 2, signY - 2, w - 4, 26, '#1f2f7a', 3);
      fitText(c, b.name ?? 'POLICE', w / 2, signY + 11, w - 20, 18, '#fff', '');
      box(c, w / 2 - 20, h - 28, 40, 26, '#2a2a3a', 3);
      circ(c, 14, signY - 12, 6, PAL.red, 2); circ(c, w - 14, signY - 12, 6, PAL.blue, 2);
      break;
    }
    case 'mural': {
      // Giant original mural: sun + raised hands + slogan
      c.save(); c.beginPath(); c.rect(4, fy + 8, w - 8, fh - 12); c.clip();
      const g = c.createLinearGradient(0, fy, 0, h); g.addColorStop(0, '#7b3fe4'); g.addColorStop(0.55, '#ff4fa3'); g.addColorStop(1, '#ff8a3d');
      c.fillStyle = g; c.fillRect(0, fy, w, fh);
      for (let i = 0; i < 12; i++) { c.strokeStyle = 'rgba(255,210,63,.55)'; c.lineWidth = 6; c.beginPath(); c.moveTo(w / 2, fy + fh * 0.55); const a = Math.PI + (i / 11) * Math.PI; c.lineTo(w / 2 + Math.cos(a) * w, fy + fh * 0.55 + Math.sin(a) * w); c.stroke(); }
      circ(c, w / 2, fy + fh * 0.55, 34, PAL.yellow, 4);
      const hand = (x: number, col: string) => { box(c, x, fy + fh * 0.4, 16, 40, col, 3, 6); for (let i = 0; i < 4; i++) box(c, x + i * 4, fy + fh * 0.4 - 10, 4, 14, col, 2, 2); };
      hand(w / 2 - 70, '#8a4b3a'); hand(w / 2 - 34, '#f2c29b'); hand(w / 2 + 18, '#c58a5c'); hand(w / 2 + 54, '#5a3324');
      c.restore();
      box(c, 2, fy + 8, w - 4, fh - 10, 'rgba(0,0,0,0)', 4);
      fitText(c, 'FEED THE BLOCK', w / 2, fy + 30, w - 30, 30, '#fff');
      fitText(c, 'TAKE WHAT YOU NEED · LEAVE WHAT YOU CAN', w / 2, h - 18, w - 30, 14, PAL.yellow);
      break;
    }
    case 'warehouse': {
      drawWindows(Math.max(2, Math.floor(w / 46)), 1, 30, 18, fy + 8, fy + 40, '#9bb6c9');
      box(c, w * 0.2, h - 74, w * 0.6, 72, '#9a96a8', 3);
      c.strokeStyle = '#6b677a'; c.lineWidth = 2; for (let y = h - 66; y < h; y += 9) { c.beginPath(); c.moveTo(w * 0.2 + 3, y); c.lineTo(w * 0.8 - 3, y); c.stroke(); }
      graffiti(c, w, h - 60);
      if (b.name) fitText(c, b.name, w / 2, fy + 56, w - 20, 16, '#fff');
      break;
    }
    default: {
      // Generic: upper windows + storefront
      const floors = Math.max(1, Math.floor((windowsBottom - fy - 14) / 40));
      const cols = Math.max(2, Math.floor(w / 34));
      drawWindows(cols, floors, 18, 24, fy + 10, windowsBottom);
      storefront(c, b, base, signY);
    }
  }
  // Outline everything
  c.lineWidth = 4; c.strokeStyle = INK; c.strokeRect(2, 2, w - 4, h - 4);
  c.beginPath(); c.moveTo(2, fy); c.lineTo(w - 2, fy); c.stroke();
}

function graffiti(c: Ctx, w: number, y: number) {
  const tags = ['RENT IS THEFT', 'BK 4EVA', 'UNION!', 'WHO OWNS BKLYN?', 'ART NOT CONDOS'];
  const t = tags[Math.floor(rnd() * tags.length)];
  c.save(); c.translate(w / 2, y); c.rotate(-0.06);
  fitText(c, t, 0, 0, w * 0.7, 20, ['#7bd66b', '#ff4fa3', '#F5C242', '#5aa9ff'][Math.floor(rnd() * 4)]);
  c.restore();
}

function storefront(c: Ctx, b: BuildingDef, base: string, signY: number) {
  const { w, h, type } = b;
  const label = b.name ?? '';
  const awning = (cols: string[]) => {
    const n = Math.max(3, Math.floor(w / 18));
    for (let i = 0; i < n; i++) { c.fillStyle = cols[i % cols.length]; c.fillRect(6 + (i * (w - 12)) / n, signY + 22, (w - 12) / n + 1, 12); }
    c.lineWidth = 3; c.strokeStyle = INK; c.strokeRect(6, signY + 22, w - 12, 12);
    for (let i = 0; i < n; i++) { c.beginPath(); c.arc(6 + ((i + 0.5) * (w - 12)) / n, signY + 34, (w - 12) / n / 2, 0, Math.PI); c.fillStyle = cols[i % cols.length]; c.fill(); c.stroke(); }
  };
  const sign = (bg: string, fg: string, text: string) => { box(c, 8, signY, w - 16, 22, bg, 3, 3); fitText(c, text, w / 2, signY + 11, w - 24, 15, fg, ''); };
  const door = (x: number, col = '#5b3a6b') => { box(c, x, h - 36, 22, 34, col, 3, 3); circ(c, x + 17, h - 18, 2, PAL.yellow, 0); };
  const window = (x: number, ww: number, col = '#bfe8ff') => { box(c, x, h - 34, ww, 26, col, 3, 2); c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 3; c.beginPath(); c.moveTo(x + 5, h - 12); c.lineTo(x + 14, h - 30); c.stroke(); };

  switch (type) {
    case 'brownstone': {
      // stoop!
      const sx = w / 2 - 14;
      for (let i = 0; i < 4; i++) box(c, sx - i * 2, h - 40 + i * 9, 28 + i * 4, 9, shade(base, -0.1), 2);
      box(c, sx + 3, h - 66, 22, 28, '#3a2342', 3, 8);
      window(8, Math.min(28, sx - 14)); window(sx + 36, Math.min(28, w - sx - 44));
      box(c, sx - 10, h - 46, 4, 44, INK, 0); box(c, sx + 34, h - 46, 4, 44, INK, 0);
      break;
    }
    case 'coffee': sign(INK, PAL.yellow, label || 'COFFEE'); awning([base, '#fff']); window(8, w - 46); door(w - 32); break;
    case 'boutique': sign('#fff', '#ff4fa3', label || 'BOUTIQUE'); awning(['#ff9ad1', '#fff']); window(8, w - 46, '#ffe9f6'); door(w - 32, '#ff4fa3'); break;
    case 'nonprofit':
      sign('#2a7a3a', '#fff', label || 'NONPROFIT');
      box(c, 10, signY - 52, w - 20, 22, '#fff', 2.5); fitText(c, 'NOW HIRING: UNPAID INTERNS', w / 2, signY - 41, w - 30, 12, '#2a7a3a', '');
      window(8, w - 46); door(w - 32); break;
    case 'coop':
      sign('#2a7a3a', PAL.yellow, label); awning(['#2a7a3a', PAL.yellow]);
      window(8, w - 46, '#d6ffd0'); door(w - 32, '#2a7a3a');
      // giant turnip mascot
      circ(c, w - 30, signY - 30, 14, '#e06bd1', 3); box(c, w - 34, signY - 52, 8, 10, '#5fd35a', 2); break;
    case 'bodega':
      sign(PAL.red, '#fff', label); awning([PAL.red, '#fff', '#2fb24f']);
      window(8, w - 46, '#fff2a8'); door(w - 32, '#2f2f3a');
      fitText(c, 'ATM · ICE · CAT ON PREMISES', w / 2 - 10, h - 22, w - 60, 10, INK, '');
      break;
    case 'tenant':
      sign(INK, '#fff', label); window(8, w - 46); door(w - 32);
      box(c, 12, signY - 60, w - 24, 30, '#fff', 3); fitText(c, 'RENT STRIKE! ✊', w / 2, signY - 45, w - 34, 20, PAL.red, ''); break;
    case 'community':
      sign(PAL.purple, '#fff', label); window(8, w / 2 - 20); window(w / 2 + 24, w / 2 - 34); door(w / 2 - 10, '#7b3fe4');
      for (let i = 0; i < 8; i++) { c.fillStyle = [PAL.pink, PAL.yellow, PAL.teal, PAL.orange][i % 4]; c.beginPath(); const x = 10 + i * ((w - 20) / 8); c.moveTo(x, signY - 30); c.lineTo(x + (w - 20) / 8, signY - 30); c.lineTo(x + (w - 20) / 16, signY - 16); c.closePath(); c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke(); }
      break;
    case 'studio': case 'gallery':
      sign(type === 'gallery' ? '#fff' : INK, type === 'gallery' ? INK : PAL.pink, label || 'STUDIOS');
      window(8, w - 46, type === 'gallery' ? '#ffffff' : '#bfe8ff'); door(w - 32, INK);
      if (type === 'studio') graffiti(c, w, signY - 40); break;
    case 'bakery':
      sign('#8b5a3c', '#fff3dc', label); awning(['#ffe0a3', '#8b5a3c']); window(8, w - 46, '#ffe9c4'); door(w - 32, '#8b5a3c');
      box(c, 14, h - 30, 18, 12, '#d89a5b', 2, 6); box(c, 36, h - 30, 18, 12, '#d89a5b', 2, 6); break;
    case 'laundromat':
      sign('#fff', PAL.blue, label || 'LAUNDROMAT');
      for (let x = 14; x < w - 40; x += 28) { box(c, x - 2, h - 34, 26, 30, '#eee', 2.5, 3); circ(c, x + 11, h - 18, 8, '#7ad7ff', 2.5); }
      door(w - 32); break;
    case 'church':
      sign('#fff', PAL.purple, label);
      c.beginPath(); c.moveTo(w / 2 - 20, signY - 10); c.lineTo(w / 2 - 20, signY - 60); c.arc(w / 2, signY - 60, 20, Math.PI, 0); c.lineTo(w / 2 + 20, signY - 10); c.closePath();
      c.fillStyle = '#ff8ad0'; c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
      box(c, w / 2 - 16, h - 36, 32, 34, '#7b3fe4', 3, 10); break;
    case 'sales':
      box(c, 8, signY - 70, w - 16, 60, '#2c2944', 3);
      fitText(c, 'LUXURY LIVING', w / 2, signY - 54, w - 30, 18, PAL.yellow, '');
      fitText(c, 'STARTING AT $4.2M', w / 2, signY - 30, w - 30, 14, '#fff', '');
      sign(PAL.yellow, INK, label); window(8, w - 46, '#fff7d6'); door(w - 32, '#c9a43a'); break;
    case 'shed':
      box(c, 6, h - 40, w - 12, 36, '#a8743f', 3); fitText(c, label, w / 2, h - 24, w - 16, 10, '#fff'); break;
    default: // apartment
      box(c, w / 2 - 14, h - 38, 28, 36, '#3a2342', 3, 3);
      box(c, w / 2 - 22, h - 44, 44, 8, shade(base, -0.2), 2.5);
      window(8, w / 2 - 30); window(w / 2 + 22, w / 2 - 30);
      if (label) sign('#fff', INK, label);
  }
}

// ------------------------------------------------------------------ CHARACTERS
export interface Look {
  skin: string; hair: string; style: 'short' | 'afro' | 'bun' | 'long' | 'bald' | 'beanie' | 'cap' | 'mohawk' | 'braids' | 'curly' | 'hijab' | 'turban' | 'kippah';
  shirt: string; pants: string; shoes?: string; acc?: 'tote' | 'phone' | 'glasses' | 'clipboard' | 'scarf' | 'beret' | 'apron' | 'headphones' | 'tie' | 'cane' | 'ringlight' | 'bandana' | 'wheelchair' | 'whitecane';
  hatColor?: string; dress?: boolean;
}
export const CHAR_W = 36, CHAR_H = 52;

export function makeCharacter(scene: Phaser.Scene, key: string, look: Look) {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, CHAR_W * 2, CHAR_H)!;
  const c = tex.getContext(); c.lineJoin = 'round'; c.lineCap = 'round';
  for (let f = 0; f < 2; f++) { c.save(); c.translate(f * CHAR_W + 2, 0); drawChar(c, look, f); c.restore(); }
  tex.refresh();
  tex.add(0, 0, 0, 0, CHAR_W, CHAR_H);
  tex.add(1, 0, CHAR_W, 0, CHAR_W, CHAR_H);
}

function drawChar(c: Ctx, L: Look, f: number) {
  const cx = 16;
  c.fillStyle = 'rgba(20,10,30,.28)'; c.beginPath(); c.ellipse(cx, 48, 11, 3.5, 0, 0, Math.PI * 2); c.fill();
  // legs
  const legY = 32, lA = f ? -3 : 0, lB = f ? 3 : 0;
  if (!L.dress) {
    box(c, cx - 7, legY + lA, 6, 12, L.pants, 2.5, 2); box(c, cx + 1, legY + lB, 6, 12, L.pants, 2.5, 2);
  } else { box(c, cx - 6, legY + 6 + lA, 5, 7, L.skin, 2, 2); box(c, cx + 1, legY + 6 + lB, 5, 7, L.skin, 2, 2); }
  box(c, cx - 8, legY + 11 + lA, 8, 4, L.shoes ?? INK, 2, 2); box(c, cx, legY + 11 + lB, 8, 4, L.shoes ?? INK, 2, 2);
  // body
  if (L.dress) { c.beginPath(); c.moveTo(cx - 8, 19); c.lineTo(cx + 8, 19); c.lineTo(cx + 12, 40); c.lineTo(cx - 12, 40); c.closePath(); c.fillStyle = L.shirt; c.fill(); c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke(); }
  else box(c, cx - 9, 19, 18, 16, L.shirt, 2.5, 5);
  // arms (swing)
  box(c, cx - 13, 21 + (f ? 2 : 0), 5, 12, L.shirt, 2.5, 2.5); box(c, cx + 8, 21 + (f ? 0 : 2), 5, 12, L.shirt, 2.5, 2.5);
  circ(c, cx - 10.5, 34 + (f ? 2 : 0), 2.6, L.skin, 2); circ(c, cx + 10.5, 34 + (f ? 0 : 2), 2.6, L.skin, 2);
  // accessories behind head
  if (L.style === 'long' || L.style === 'braids') box(c, cx - 9, 8, 18, 18, L.hair, 2.5, 6);
  // head
  circ(c, cx, 12, 8.5, L.skin, 2.5);
  // hair
  c.lineWidth = 2.5; c.strokeStyle = INK; c.fillStyle = L.hair;
  switch (L.style) {
    case 'afro': circ(c, cx, 8, 11, L.hair, 2.5); circ(c, cx, 14, 7, L.skin, 0); break;
    case 'curly': for (let i = -2; i <= 2; i++) circ(c, cx + i * 4, 5 + Math.abs(i), 4, L.hair, 2); break;
    case 'bun': c.beginPath(); c.arc(cx, 11, 8.5, Math.PI, 0); c.fill(); c.stroke(); circ(c, cx, 2, 4.5, L.hair, 2.5); break;
    case 'short': case 'long': case 'braids': c.beginPath(); c.arc(cx, 11, 8.5, Math.PI * 1.05, -0.05); c.lineTo(cx + 6, 8); c.lineTo(cx - 6, 8); c.closePath(); c.fill(); c.stroke(); break;
    case 'mohawk': box(c, cx - 2.5, -1, 5, 10, L.hair, 2.5, 2); break;
    case 'beanie': c.beginPath(); c.arc(cx, 10, 9, Math.PI, 0); c.closePath(); c.fillStyle = L.hatColor ?? PAL.orange; c.fill(); c.stroke(); box(c, cx - 9.5, 8, 19, 4, shade(L.hatColor ?? PAL.orange, -0.15), 2); circ(c, cx, 1, 3, L.hatColor ?? PAL.orange, 2); break;
    case 'cap': c.beginPath(); c.arc(cx, 10, 8.8, Math.PI, 0); c.closePath(); c.fillStyle = L.hatColor ?? PAL.blue; c.fill(); c.stroke(); box(c, cx - 2, 8, 13, 3.5, L.hatColor ?? PAL.blue, 2); break;
    case 'bald': c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.arc(cx - 3, 8, 2.5, 0, Math.PI * 2); c.fill(); break;
    case 'hijab': { const hc = L.hatColor ?? PAL.teal; c.beginPath(); c.arc(cx, 12, 10.5, Math.PI * 0.95, Math.PI * 0.05); c.lineTo(cx + 11, 24); c.lineTo(cx - 11, 24); c.closePath(); c.fillStyle = hc; c.fill(); c.stroke(); circ(c, cx, 13, 6.4, L.skin, 0); break; }
    case 'turban': { const hc = L.hatColor ?? PAL.orange; c.beginPath(); c.ellipse(cx, 6, 10, 7, 0, 0, Math.PI * 2); c.fillStyle = hc; c.fill(); c.stroke(); c.strokeStyle = shade(hc, -0.25); c.lineWidth = 1.5; c.beginPath(); c.moveTo(cx - 8, 9); c.quadraticCurveTo(cx, 1, cx + 8, 5); c.stroke(); break; }
    case 'kippah': c.beginPath(); c.arc(cx, 11, 8.5, Math.PI * 1.05, -0.05); c.lineTo(cx + 6, 8); c.lineTo(cx - 6, 8); c.closePath(); c.fill(); c.stroke(); c.beginPath(); c.arc(cx - 1, 4.5, 4, Math.PI, 0); c.fillStyle = L.hatColor ?? INK; c.fill(); break;
  }
  if (L.acc === 'wheelchair') { circ(c, cx - 13, 34, 8, '#3a3a40', 2.5); circ(c, cx + 13, 34, 8, '#3a3a40', 2.5); box(c, cx - 11, 28, 22, 5, '#6a6a72', 2, 1); }
  if (L.acc === 'whitecane') { c.strokeStyle = '#f4f4f4'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(cx + 11, 34); c.lineTo(cx + 18, 52); c.stroke(); c.strokeStyle = '#c8322a'; c.beginPath(); c.moveTo(cx + 17, 49); c.lineTo(cx + 18, 52); c.stroke(); }
  if (L.style === 'braids') { box(c, cx - 11, 12, 4, 14, L.hair, 2, 2); box(c, cx + 7, 12, 4, 14, L.hair, 2, 2); }
  // face
  c.fillStyle = INK; c.beginPath(); c.arc(cx - 3, 13, 1.4, 0, 7); c.arc(cx + 3, 13, 1.4, 0, 7); c.fill();
  c.strokeStyle = INK; c.lineWidth = 1.5; c.beginPath(); c.arc(cx, 15.5, 2.5, 0.2, Math.PI - 0.2); c.stroke();
  // accessories
  switch (L.acc) {
    case 'glasses': c.lineWidth = 1.8; c.strokeStyle = INK; c.strokeRect(cx - 6, 11, 5, 4); c.strokeRect(cx + 1, 11, 5, 4); break;
    case 'tote': box(c, cx + 8, 26, 10, 12, '#f3e6c8', 2.5, 2); c.fillStyle = PAL.green; c.fillRect(cx + 10, 30, 6, 3); break;
    case 'phone': box(c, cx + 9, 26, 6, 9, '#222', 2, 1.5); c.fillStyle = '#8fd4ff'; c.fillRect(cx + 10, 27, 4, 6); break;
    case 'clipboard': box(c, cx - 4, 23, 10, 12, '#c08a4f', 2, 1); c.fillStyle = '#fff'; c.fillRect(cx - 2, 25, 6, 8); break;
    case 'scarf': box(c, cx - 8, 18, 16, 5, PAL.pink, 2, 2); box(c, cx + 3, 20, 5, 10, PAL.pink, 2, 2); break;
    case 'beret': c.beginPath(); c.ellipse(cx + 2, 4, 9, 4, -0.2, 0, Math.PI * 2); c.fillStyle = L.hatColor ?? INK; c.fill(); c.lineWidth = 2; c.strokeStyle = INK; c.stroke(); break;
    case 'apron': box(c, cx - 6, 24, 12, 13, '#fff', 2, 2); break;
    case 'headphones': c.lineWidth = 3; c.strokeStyle = INK; c.beginPath(); c.arc(cx, 11, 10, Math.PI, 0); c.stroke(); circ(c, cx - 9.5, 13, 3, PAL.pink, 2); circ(c, cx + 9.5, 13, 3, PAL.pink, 2); break;
    case 'tie': c.beginPath(); c.moveTo(cx, 20); c.lineTo(cx - 2.5, 24); c.lineTo(cx, 32); c.lineTo(cx + 2.5, 24); c.closePath(); c.fillStyle = PAL.red; c.fill(); c.lineWidth = 1.5; c.strokeStyle = INK; c.stroke(); break;
    case 'cane': c.lineWidth = 3; c.strokeStyle = '#7a4a2a'; c.beginPath(); c.moveTo(cx + 12, 34); c.lineTo(cx + 15, 47); c.stroke(); break;
    case 'ringlight': circ(c, cx + 14, 6, 7, 'rgba(255,255,255,0.9)', 2.5); circ(c, cx + 14, 6, 3.5, '#ffb', 0); c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(cx + 14, 13); c.lineTo(cx + 11, 30); c.stroke(); break;
    case 'bandana': box(c, cx - 9, 5, 18, 4, PAL.red, 2, 2); break;
  }
}

/** Player on a bike: same look plus a bicycle drawn underneath. */
export function makeBikeRider(scene: Phaser.Scene, key: string, look: Look) {
  if (scene.textures.exists(key)) return;
  const W = 52, H = 56;
  const tex = scene.textures.createCanvas(key, W * 2, H)!;
  const c = tex.getContext(); c.lineJoin = 'round'; c.lineCap = 'round';
  for (let f = 0; f < 2; f++) {
    c.save(); c.translate(f * W, 0);
    c.fillStyle = 'rgba(20,10,30,.28)'; c.beginPath(); c.ellipse(26, 51, 22, 4, 0, 0, 7); c.fill();
    // wheels
    for (const wx of [10, 42]) { circ(c, wx, 42, 9, 'rgba(0,0,0,0)', 3.5); c.strokeStyle = '#ddd'; c.lineWidth = 1.2; c.beginPath(); const a = f * 0.8; c.moveTo(wx + Math.cos(a) * 8, 42 + Math.sin(a) * 8); c.lineTo(wx - Math.cos(a) * 8, 42 - Math.sin(a) * 8); c.stroke(); }
    c.strokeStyle = PAL.teal; c.lineWidth = 4; c.beginPath(); c.moveTo(10, 42); c.lineTo(22, 30); c.lineTo(36, 30); c.lineTo(42, 42); c.moveTo(22, 30); c.lineTo(26, 42); c.lineTo(36, 30); c.moveTo(36, 30); c.lineTo(38, 22); c.stroke();
    box(c, 34, 19, 10, 4, INK, 0, 2); box(c, 2, 30, 12, 8, PAL.teal, 2.5, 2);
    c.translate(8, -8); drawChar(c, look, f);
    c.restore();
  }
  tex.refresh(); tex.add(0, 0, 0, 0, W, H); tex.add(1, 0, W, 0, W, H);
}

// ------------------------------------------------------------------ VEHICLES & PROPS
export function makeVehicles(scene: Phaser.Scene) {
  const cars: { key: string; body: string; long?: boolean; label?: string; roof?: string }[] = [
    { key: 'car0', body: '#ff4fa3' }, { key: 'car1', body: '#3a7bff' }, { key: 'car2', body: '#F5C242' },
    { key: 'car3', body: '#5fd35a', roof: '#fff', label: 'BORO' }, { key: 'car4', body: '#22202e', label: 'LUX' },
    { key: 'car5', body: '#ff8a3d' }, { key: 'van', body: '#f0eef6', long: true, label: 'SMAZON' }, { key: 'car6', body: '#2fd1c5' },
  ];
  for (const v of cars) {
    const w = 38, h = v.long ? 84 : 66;
    canvas(scene, v.key, w, h, (c) => {
      c.fillStyle = 'rgba(20,10,30,.3)'; rr(c, 3, 6, w - 2, h - 4, 10); c.fill();
      for (const [x, y] of [[1, 12], [w - 7, 12], [1, h - 22], [w - 7, h - 22]]) box(c, x, y, 6, 13, INK, 0, 2);
      box(c, 4, 3, w - 8, h - 6, v.body, 3, 10);
      box(c, 8, 14, w - 16, 12, '#9fe2ff', 2.5, 3); // windshield (front = top)
      box(c, 8, h - 20, w - 16, 9, '#7cc9ee', 2.5, 3);
      if (!v.long) box(c, 9, 28, w - 18, h - 50, v.roof ?? shade(v.body, -0.12), 2.5, 4);
      else { box(c, 7, 28, w - 14, h - 50, '#e2deec', 2.5, 3); }
      circ(c, 9, 5, 2.5, '#fff6a0', 1.5); circ(c, w - 9, 5, 2.5, '#fff6a0', 1.5);
      if (v.label) { c.save(); c.translate(w / 2, h / 2 + 4); c.rotate(Math.PI / 2); fitText(c, v.label, 0, 0, h - 40, 12, v.long ? PAL.orange : PAL.yellow); c.restore(); }
    });
  }
  // cyclist top-down
  canvas(scene, 'cyclist', 22, 44, (c) => {
    box(c, 9, 0, 4, 44, INK, 0, 2);
    box(c, 3, 8, 16, 4, '#888', 2, 2);
    box(c, 4, 14, 14, 16, PAL.pink, 2.5, 5);
    circ(c, 11, 18, 6, PAL.yellow, 2.5);
  });
}

export function makeProps(scene: Phaser.Scene) {
  for (let v = 0; v < 3; v++) canvas(scene, `tree${v}`, 64, 76, (c) => {
    c.fillStyle = 'rgba(20,10,30,.25)'; c.beginPath(); c.ellipse(32, 70, 20, 5, 0, 0, 7); c.fill();
    box(c, 27, 44, 10, 26, '#7a4a2a', 3, 3);
    const col = ['#4fbf54', '#3aa860', '#e8743b'][v];
    const blobs = [[20, 34, 15], [44, 34, 15], [32, 22, 18], [24, 18, 12], [42, 18, 12]];
    for (const [x, y, r] of blobs) circ(c, x, y, r, col, 3.5);
    for (const [x, y, r] of blobs) circ(c, x - 3, y - 3, r * 0.45, shade(col, 0.12), 0);
    if (v === 2) { circ(c, 36, 28, 3, PAL.yellow, 1.5); circ(c, 22, 22, 3, PAL.pink, 1.5); }
  });
  canvas(scene, 'lamp', 20, 72, (c) => {
    c.fillStyle = 'rgba(255,220,120,.35)'; c.beginPath(); c.arc(10, 10, 10, 0, 7); c.fill();
    box(c, 8, 12, 4, 58, '#2c2a40', 2); box(c, 3, 4, 14, 10, '#ffe27a', 2.5, 4); box(c, 5, 66, 10, 6, '#2c2a40', 2);
  });
  canvas(scene, 'hydrant', 20, 28, (c) => { box(c, 4, 8, 12, 18, PAL.red, 2.5, 3); box(c, 1, 12, 18, 5, PAL.red, 2.5, 2); circ(c, 10, 7, 6, PAL.red, 2.5); });
  canvas(scene, 'trash', 22, 30, (c) => { box(c, 3, 6, 16, 22, '#3f8a4f', 2.5, 3); box(c, 1, 3, 20, 5, '#2f6a3c', 2.5, 2); });
  canvas(scene, 'bench', 64, 28, (c) => { box(c, 2, 4, 60, 8, '#a8743f', 2.5, 2); box(c, 2, 13, 60, 7, '#c08a4f', 2.5, 2); box(c, 6, 20, 4, 8, INK, 0); box(c, 54, 20, 4, 8, INK, 0); });
  canvas(scene, 'fountain', 150, 110, (c) => {
    c.beginPath(); c.ellipse(75, 66, 70, 38, 0, 0, 7); c.fillStyle = '#d8cbe6'; c.fill(); c.lineWidth = 4; c.strokeStyle = INK; c.stroke();
    c.beginPath(); c.ellipse(75, 66, 58, 28, 0, 0, 7); c.fillStyle = '#4fb4f5'; c.fill(); c.lineWidth = 3; c.stroke();
    box(c, 66, 22, 18, 44, '#d8cbe6', 3, 4);
    c.strokeStyle = '#bfe8ff'; c.lineWidth = 4; for (const d of [-1, 1]) { c.beginPath(); c.moveTo(75, 20); c.quadraticCurveTo(75 + d * 30, 0, 75 + d * 40, 56); c.stroke(); }
    circ(c, 75, 18, 7, '#bfe8ff', 2.5);
  });
  canvas(scene, 'cart0', 70, 80, (c) => { // halal cart
    box(c, 6, 40, 58, 30, '#d9d9e6', 3, 4); fitText(c, 'HALAL COMRADES', 35, 55, 54, 11, PAL.red, '');
    box(c, 33, 10, 4, 30, INK, 0); c.beginPath(); c.moveTo(5, 18); c.quadraticCurveTo(35, -6, 65, 18); c.closePath(); c.fillStyle = PAL.yellow; c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
    circ(c, 16, 72, 6, INK, 0); circ(c, 54, 72, 6, INK, 0);
  });
  canvas(scene, 'cart1', 60, 70, (c) => { // churro cart
    box(c, 4, 30, 52, 28, '#ff8ad0', 3, 4); fitText(c, 'CHURROS $2', 30, 44, 46, 11, '#fff');
    for (let i = 0; i < 4; i++) box(c, 12 + i * 10, 14, 5, 18, '#d89a5b', 2, 2);
    circ(c, 14, 62, 6, INK, 0); circ(c, 46, 62, 6, INK, 0);
  });
  canvas(scene, 'truck', 140, 80, (c) => {
    box(c, 4, 10, 100, 60, '#fff', 3.5, 8); box(c, 100, 26, 36, 44, '#bfe8ff', 3.5, 8);
    fitText(c, 'MR. SOLIDARITY', 54, 30, 90, 15, PAL.pink); fitText(c, 'SOFT SERVE · SOFT POWER', 54, 50, 90, 10, PAL.purple, '');
    circ(c, 26, 72, 8, INK, 0); circ(c, 112, 72, 8, INK, 0);
    box(c, 40, 0, 26, 12, '#ffd6ec', 2.5, 6);
  });
  for (let v = 0; v < 2; v++) canvas(scene, `duck${v}`, 26, 20, (c) => { c.beginPath(); c.ellipse(12, 13, 10, 6, 0, 0, 7); c.fillStyle = v ? '#fff' : '#F5C242'; c.fill(); c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke(); circ(c, 19, 7, 5, v ? '#fff' : '#3fb24f', 2.5); box(c, 22, 6, 4, 3, PAL.orange, 1.5); });
  canvas(scene, 'sunflower', 30, 60, (c) => { box(c, 13, 24, 4, 34, '#3fb24f', 2, 2); for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; circ(c, 15 + Math.cos(a) * 9, 14 + Math.sin(a) * 9, 5, PAL.yellow, 2); } circ(c, 15, 14, 6, '#7a4a2a', 2.5); });
  for (let v = 0; v < 2; v++) canvas(scene, `hoop${v}`, 30, 60, (c) => { box(c, 12, 20, 6, 40, '#666', 2.5); box(c, 2, 2, 26, 20, '#fff', 3); c.beginPath(); c.ellipse(15, 18, 7, 3, 0, 0, 7); c.strokeStyle = PAL.orange; c.lineWidth = 3; c.stroke(); });
  canvas(scene, 'crate0', 32, 32, (c) => { box(c, 3, 6, 26, 24, '#c08a4f', 3, 2); c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(3, 6); c.lineTo(29, 30); c.stroke(); });
  canvas(scene, 'dumpster0', 60, 36, (c) => { box(c, 2, 8, 56, 26, '#2f7a4a', 3, 3); box(c, 0, 4, 60, 7, '#245c38', 3, 2); fitText(c, 'NO DUMPING (WE MEAN IT)', 30, 22, 50, 8, '#fff', ''); });

  // Community fridge (empty / full)
  for (const full of [false, true]) canvas(scene, full ? 'fridge-full' : 'fridge-empty', 56, 84, (c) => {
    c.fillStyle = 'rgba(20,10,30,.3)'; c.beginPath(); c.ellipse(28, 80, 24, 5, 0, 0, 7); c.fill();
    box(c, 4, 4, 48, 74, '#fff', 3.5, 8);
    // painted flowers/hearts
    for (const [x, y, col] of [[14, 12, PAL.pink], [40, 18, PAL.orange], [14, 66, PAL.purple], [42, 64, PAL.teal]] as [number, number, string][]) circ(c, x, y, 5, col, 2);
    fitText(c, 'FREE FOOD', 28, 28, 40, 12, PAL.purple, '');
    box(c, 10, 36, 36, 34, full ? '#e9fff0' : '#e7e3f2', 2.5, 3);
    if (full) {
      for (let i = 0; i < 9; i++) { const col = [PAL.red, PAL.green, PAL.yellow, PAL.orange][i % 4]; circ(c, 16 + (i % 3) * 12, 44 + Math.floor(i / 3) * 10, 4.5, col, 2); }
    } else { circ(c, 22, 64, 3.5, PAL.green, 1.5); fitText(c, ':(', 30, 50, 20, 12, '#999', ''); }
    box(c, 46, 40, 3, 14, '#bbb', 1.5);
  });
  canvas(scene, 'dock', 96, 40, (c) => {
    box(c, 2, 26, 92, 8, '#555', 2.5, 2);
    for (let i = 0; i < 3; i++) { const x = 8 + i * 28; c.strokeStyle = PAL.teal; c.lineWidth = 4; c.beginPath(); c.arc(x + 4, 22, 7, 0, 7); c.arc(x + 20, 22, 7, 0, 7); c.stroke(); c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.arc(x + 4, 22, 7, 0, 7); c.stroke(); }
    box(c, 70, 0, 22, 30, PAL.teal, 2.5, 3); fitText(c, 'BK', 81, 10, 18, 10, '#fff', ''); fitText(c, 'SPOKES', 81, 20, 20, 7, '#fff', '');
  });
  const slogans = ['HOUSING IS A HUMAN RIGHT', 'FEED THE BLOCK', 'WHO OWNS BROOKLYN?', 'TENANTS > LANDLORDS'];
  for (let v = 0; v < 4; v++) canvas(scene, `poster${v}`, 34, 44, (c) => {
    box(c, 2, 2, 30, 40, [PAL.purple, PAL.pink, PAL.orange, PAL.blue][v], 2.5);
    circ(c, 17, 16, 7, PAL.yellow, 2);
    const words = slogans[v].split(' ');
    fitText(c, words.slice(0, 2).join(' '), 17, 29, 28, 8, '#fff', '');
    fitText(c, words.slice(2).join(' '), 17, 36, 28, 8, '#fff', '');
  });
  // groceries bag pickup visual
  canvas(scene, 'grocerybag', 30, 34, (c) => { box(c, 3, 10, 24, 22, '#e9b26a', 2.5, 2); circ(c, 10, 9, 4, PAL.red, 2); box(c, 16, 0, 4, 12, PAL.green, 2, 2); circ(c, 22, 8, 4, PAL.orange, 2); });
  // cat
  for (let f = 0; f < 1; f++) canvas(scene, 'cat', 30, 24, (c) => {
    c.beginPath(); c.ellipse(14, 16, 10, 6, 0, 0, 7); c.fillStyle = PAL.orange; c.fill(); c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke();
    circ(c, 23, 10, 6, PAL.orange, 2.5);
    c.beginPath(); c.moveTo(19, 6); c.lineTo(20, 0); c.lineTo(23, 5); c.moveTo(24, 5); c.lineTo(27, 0); c.lineTo(28, 7); c.fillStyle = PAL.orange; c.fill(); c.stroke();
    c.strokeStyle = PAL.orange; c.lineWidth = 4; c.beginPath(); c.moveTo(4, 14); c.quadraticCurveTo(0, 4, 5, 2); c.stroke();
    c.fillStyle = INK; c.fillRect(21, 9, 2, 2); c.fillRect(25, 9, 2, 2);
  });
  // UI-ish world sprites
  canvas(scene, 'arrow', 40, 40, (c) => { c.beginPath(); c.moveTo(36, 20); c.lineTo(8, 6); c.lineTo(15, 20); c.lineTo(8, 34); c.closePath(); c.fillStyle = PAL.yellow; c.fill(); c.lineWidth = 3.5; c.strokeStyle = INK; c.stroke(); });
  canvas(scene, 'mm-player', 64, 64, (c) => { c.beginPath(); c.moveTo(32, 2); c.lineTo(60, 60); c.lineTo(32, 46); c.lineTo(4, 60); c.closePath(); c.fillStyle = '#fff'; c.fill(); c.lineWidth = 8; c.strokeStyle = INK; c.stroke(); });
  canvas(scene, 'mm-target', 80, 80, (c) => { star(c, 40, 40, 36, 16, PAL.yellow); });
  canvas(scene, 'mm-dot', 40, 40, (c) => circ(c, 20, 20, 14, PAL.pink, 6));
  canvas(scene, 'excl', 22, 34, (c) => { box(c, 3, 2, 16, 22, PAL.yellow, 3, 6); fitText(c, '!', 11, 13, 12, 18, INK, ''); circ(c, 11, 30, 3, PAL.yellow, 2); });
  canvas(scene, 'spark', 16, 16, (c) => star(c, 8, 8, 7, 3, '#fff'));
  canvas(scene, 'heart', 20, 18, (c) => { c.beginPath(); c.moveTo(10, 16); c.bezierCurveTo(-4, 6, 4, -4, 10, 4); c.bezierCurveTo(16, -4, 24, 6, 10, 16); c.fillStyle = PAL.pink; c.fill(); c.lineWidth = 2; c.strokeStyle = INK; c.stroke(); });
}

function star(c: Ctx, x: number, y: number, R: number, r: number, fill: string) {
  c.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5; const rad = i % 2 ? r : R; c.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad); }
  c.closePath(); c.fillStyle = fill; c.fill(); c.lineWidth = 4; c.strokeStyle = INK; c.stroke();
}
