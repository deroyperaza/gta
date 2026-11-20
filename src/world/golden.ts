import Phaser from 'phaser';
import { T, TILE, type BuildingDef, type BuildingType } from './layout';
import { makeCharacter as makeFrontCharacter, type Look } from './textures';

/**
 * Golden Hour renderer (Style A from style-study/moodboard.html).
 * Near-overhead camera, realistic materials, low sun from the west-northwest,
 * long soft shadows falling to the east-southeast. No ink outlines.
 * The cartoon renderer in textures.ts still provides the dialogue portraits
 * and the props that have not been restyled yet.
 */

type Ctx = CanvasRenderingContext2D;

/** Shadow throw per pixel of height, matching the mood board's golden sun. */
export const SUN_SHADOW = { dx: 0.62, dy: 0.2, alpha: 0.5 };

function canvas(scene: Phaser.Scene, key: string, w: number, h: number, draw: (c: Ctx) => void) {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, Math.ceil(w), Math.ceil(h))!;
  draw(tex.getContext());
  tex.refresh();
  return tex;
}

let seed = 11;
const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const R = (a: number, b: number) => a + (b - a) * rnd();
const pick = <V>(a: V[]): V => a[Math.floor(rnd() * a.length)];

function rgb(h: string) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
/** Multiply a hex color's brightness and return rgba(). */
function col(h: string, a = 1, mul = 1) { const [r, g, b] = rgb(h).map((v) => Math.min(255, Math.round(v * mul))); return `rgba(${r},${g},${b},${a})`; }
function rr(c: Ctx, x: number, y: number, w: number, h: number, r: number) { c.beginPath(); c.roundRect(x, y, w, h, r); }
function ell(c: Ctx, x: number, y: number, rx: number, ry: number, a = 0) { c.beginPath(); c.ellipse(x, y, rx, ry, a, 0, Math.PI * 2); }
function line(c: Ctx, x1: number, y1: number, x2: number, y2: number) { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); }
function lg(c: Ctx, x0: number, y0: number, x1: number, y1: number, stops: [number, string][]) { const g = c.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, s]) => g.addColorStop(o, s)); return g; }
function rg(c: Ctx, x: number, y: number, r0: number, r1: number, stops: [number, string][]) { const g = c.createRadialGradient(x, y, r0, x, y, r1); stops.forEach(([o, s]) => g.addColorStop(o, s)); return g; }
const SANS = '"Helvetica Neue", "Inter", Arial, sans-serif';
function sign(c: Ctx, text: string, x: number, y: number, maxW: number, size: number, color: string, weight = 800) {
  let s = size;
  do { c.font = `${weight} ${s}px ${SANS}`; s -= 0.5; } while (c.measureText(text).width > maxW && s > 6);
  c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = color; c.fillText(text, x, y);
}
function grit(c: Ctx, x: number, y: number, w: number, h: number, n: number, cols: string[], s0 = 0.8, s1 = 2) {
  for (let i = 0; i < n; i++) { c.fillStyle = pick(cols); c.fillRect(x + rnd() * w, y + rnd() * h, R(s0, s1), R(s0, s1 * 0.8)); }
}

// ------------------------------------------------------------------ GROUND
export function makeTiles(scene: Phaser.Scene) {
  seed = 11;
  canvas(scene, 'tiles', TILE * 15, TILE, (c) => {
    const at = (i: number, fn: (x: number) => void) => { c.save(); c.beginPath(); c.rect(i * TILE, 0, TILE, TILE); c.clip(); fn(i * TILE); c.restore(); };
    const asphalt = (x: number, base = '#34363a') => {
      c.fillStyle = base; c.fillRect(x, 0, TILE, TILE);
      grit(c, x, 0, TILE, TILE, 70, ['rgba(88,90,94,.45)', 'rgba(22,23,25,.5)', 'rgba(60,62,66,.4)'], 0.6, 1.8);
      if (rnd() < 0.35) { c.fillStyle = 'rgba(20,21,23,.25)'; c.fillRect(x + R(0, 16), R(0, 16), R(8, 20), R(6, 16)); }
    };
    const concrete = (x: number, base = '#a39c90', seams = true) => {
      c.fillStyle = base; c.fillRect(x, 0, TILE, TILE);
      grit(c, x, 0, TILE, TILE, 40, ['rgba(70,64,56,.25)', 'rgba(240,232,218,.18)'], 0.6, 1.6);
      if (seams) { c.fillStyle = 'rgba(60,54,46,.38)'; c.fillRect(x, 0, TILE, 1); c.fillRect(x, 0, 1, TILE); c.fillStyle = 'rgba(255,240,220,.12)'; c.fillRect(x, 1, TILE, 1); c.fillRect(x + 1, 0, 1, TILE); }
    };
    at(T.ASPHALT, (x) => asphalt(x));
    at(T.LANE_V, (x) => { asphalt(x); c.fillStyle = 'rgba(217,165,32,.9)'; c.fillRect(x + 13.5, 2, 2, 28); c.fillRect(x + 16.5, 2, 2, 28); });
    at(T.LANE_H, (x) => { asphalt(x); c.fillStyle = 'rgba(217,165,32,.9)'; c.fillRect(x + 2, 13.5, 28, 2); c.fillRect(x + 2, 16.5, 28, 2); });
    at(T.SIDEWALK, (x) => concrete(x));
    at(T.GRASS, (x) => {
      c.fillStyle = '#5b7438'; c.fillRect(x, 0, TILE, TILE);
      grit(c, x, 0, TILE, TILE, 90, ['rgba(120,150,70,.5)', 'rgba(40,60,28,.5)', 'rgba(150,140,70,.35)'], 1, 2.4);
    });
    at(T.PLAZA, (x) => {
      c.fillStyle = '#b6ad9e'; c.fillRect(x, 0, TILE, TILE);
      c.strokeStyle = 'rgba(110,100,88,.5)'; c.lineWidth = 0.8;
      for (let j = 0; j < TILE; j += 8) line(c, x, j + 0.5, x + TILE, j + 0.5);
      for (let j = 0; j < TILE; j += 16) for (let k = 0; k < 4; k++) line(c, x + j + (k % 2) * 8 + 0.5, k * 8, x + j + (k % 2) * 8 + 0.5, k * 8 + 8);
      grit(c, x, 0, TILE, TILE, 30, ['rgba(255,245,230,.15)', 'rgba(60,50,40,.15)']);
    });
    at(T.CROSS_V, (x) => { asphalt(x); c.fillStyle = 'rgba(232,230,224,.88)'; for (let i = 2; i < 32; i += 8) c.fillRect(x + i, 3, 4.5, 26); });
    at(T.CROSS_H, (x) => { asphalt(x); c.fillStyle = 'rgba(232,230,224,.88)'; for (let i = 2; i < 32; i += 8) c.fillRect(x + 3, i, 26, 4.5); });
    at(T.GARDEN, (x) => {
      c.fillStyle = '#5a4030'; c.fillRect(x, 0, TILE, TILE);
      grit(c, x, 0, TILE, TILE, 40, ['rgba(40,28,20,.5)', 'rgba(120,90,60,.4)']);
      for (let i = 0; i < 4; i++) for (const y of [8, 22]) { c.fillStyle = pick(['#5f8a3c', '#7ea54e', '#4a6e2c']); ell(c, x + 4 + i * 8, y, R(2.5, 3.8), R(2.5, 3.8)); c.fill(); if (rnd() < 0.3) { c.fillStyle = pick(['#e85a3a', '#f2c23a', '#d94a8a']); ell(c, x + 4 + i * 8, y, 1.2, 1.2); c.fill(); } }
    });
    at(T.WATER, (x) => {
      c.fillStyle = '#3d6670'; c.fillRect(x, 0, TILE, TILE);
      c.strokeStyle = 'rgba(255,200,140,.25)'; c.lineWidth = 1;
      for (let i = 0; i < 3; i++) { const wy = 6 + i * 10; c.beginPath(); c.moveTo(x + 3 + (i % 2) * 8, wy); c.quadraticCurveTo(x + 9 + (i % 2) * 8, wy - 2, x + 15 + (i % 2) * 8, wy); c.stroke(); }
    });
    at(T.YARD, (x) => {
      c.fillStyle = pick(['#56683a', '#5f6e40', '#66604a']); c.fillRect(x, 0, TILE, TILE);
      grit(c, x, 0, TILE, TILE, 60, ['rgba(110,130,70,.45)', 'rgba(50,60,34,.45)', 'rgba(120,100,80,.3)'], 1, 2.2);
    });
    at(T.INTERSECTION, (x) => asphalt(x, '#313337'));
    at(T.COURT, (x) => { c.fillStyle = '#a4553a'; c.fillRect(x, 0, TILE, TILE); grit(c, x, 0, TILE, TILE, 30, ['rgba(255,220,190,.12)', 'rgba(60,20,10,.15)']); c.fillStyle = 'rgba(240,236,228,.7)'; c.fillRect(x, 0, TILE, 1.5); });
    at(T.LOT, (x) => {
      c.fillStyle = '#6f665a'; c.fillRect(x, 0, TILE, TILE);
      grit(c, x, 0, TILE, TILE, 120, ['rgba(111,122,60,.6)', 'rgba(79,90,42,.5)', 'rgba(122,106,85,.6)', 'rgba(62,55,47,.6)', 'rgba(138,128,112,.5)'], 0.8, 2.6);
    });
    at(T.CURB, (x) => concrete(x, '#9e978b'));
  });
}

// ------------------------------------------------------------------ BUILDINGS
const WALL: Record<BuildingType, string[]> = {
  brownstone: ['#6b4436', '#734a3a', '#7f5440', '#5e3e33'],
  coffee: ['#5a3a2e', '#3e4246', '#7a5a44', '#34403a'],
  boutique: ['#b8a796', '#8a6f62', '#c9b9a4', '#6f5a50'],
  nonprofit: ['#8a7a68', '#7a6a58', '#8a7a68', '#7a6a58'],
  coop: ['#7a5a44', '#7a5a44', '#7a5a44', '#7a5a44'],
  bodega: ['#7d4434', '#7d4434', '#7d4434', '#7d4434'],
  mural: ['#6a3a2a', '#6a3a2a', '#6a3a2a', '#6a3a2a'],
  tenant: ['#8b5a44', '#8b5a44', '#8b5a44', '#8b5a44'],
  community: ['#a08d78', '#a08d78', '#a08d78', '#a08d78'],
  studio: ['#6f3f33', '#5c6167', '#7a4a38', '#6f3f33'],
  warehouse: ['#5c6167', '#6a5a4e', '#7a4a38', '#4e5a60'],
  gallery: ['#d8d4cc', '#e2ded6', '#2e2e32', '#d8d4cc'],
  government: ['#c9c1b5', '#bfb7aa', '#cfc7ba', '#c9c1b5'],
  courthouse: ['#d2cabd', '#d2cabd', '#d2cabd', '#d2cabd'],
  police: ['#8c8478', '#8c8478', '#8c8478', '#8c8478'],
  tower: ['#5d7385', '#4a5a6a', '#6a7a88', '#3a4a5c'],
  apartment: ['#a08d78', '#8b5a44', '#9a7a62', '#7d4434'],
  laundromat: ['#8c8478', '#7a7268', '#8c8478', '#7a7268'],
  church: ['#b8a68a', '#b8a68a', '#b8a68a', '#b8a68a'],
  shed: ['#7a5a3a', '#7a5a3a', '#7a5a3a', '#7a5a3a'],
  bakery: ['#9a6a4a', '#9a6a4a', '#9a6a4a', '#9a6a4a'],
  sales: ['#2a2c30', '#2a2c30', '#2a2c30', '#2a2c30'],
};
const ROOFS = ['#b7babd', '#a9adb1', '#4a4542', '#c2c4c4', '#57504b', '#8a8378'];
const SHOPS = new Set<BuildingType>(['coffee', 'boutique', 'nonprofit', 'coop', 'bodega', 'tenant', 'community', 'studio', 'gallery', 'laundromat', 'bakery', 'sales']);
const SIGNS: Partial<Record<BuildingType, [string, string]>> = {
  coffee: ['#1c1a18', '#f2c23a'], boutique: ['#f4efe6', '#a8322a'], nonprofit: ['#2f5a3a', '#f4efe6'], coop: ['#2f5a3a', '#f2c23a'],
  bodega: ['#a8322a', '#fff7e0'], tenant: ['#1c1a18', '#f4efe6'], community: ['#4a2a6a', '#f4efe6'], studio: ['#1c1a18', '#e8709a'],
  gallery: ['#f4efe6', '#1c1a18'], laundromat: ['#f4efe6', '#1d5fae'], bakery: ['#5a3a24', '#f4e6c8'], sales: ['#c9a43a', '#1c1a18'],
};

export function buildingKey(b: BuildingDef) { return `bld-${b.id}`; }
export function shadowKey(b: BuildingDef) { return `shd-${b.id}`; }

/** Building height in px that drives the cast shadow and how much south wall shows. */
function heightOf(b: BuildingDef) { return b.h; }
export function facadeH(b: BuildingDef) { return Math.round(Math.min(Math.max(b.h * 0.36, 44), 120)); }

export function makeBuilding(scene: Phaser.Scene, b: BuildingDef) {
  canvas(scene, buildingKey(b), b.w, b.h, (c) => drawBuilding(c, b));
  makeBuildingShadow(scene, b);
}

const PAD = 10;
export function shadowOffset(b: BuildingDef) { const ht = heightOf(b); return { dx: Math.min(ht * SUN_SHADOW.dx, 190), dy: Math.min(ht * SUN_SHADOW.dy, 60) }; }
export function makeBuildingShadow(scene: Phaser.Scene, b: BuildingDef) {
  const { dx, dy } = shadowOffset(b);
  canvas(scene, shadowKey(b), b.w + dx + PAD * 2, b.h + dy + PAD * 2, (c) => {
    c.filter = 'blur(4px)';
    c.fillStyle = `rgba(14,8,22,${SUN_SHADOW.alpha})`;
    const x0 = PAD, y0 = PAD, x1 = PAD + b.w, y1 = PAD + b.h;
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y0); c.lineTo(x1 + dx, y0 + dy); c.lineTo(x1 + dx, y1 + dy); c.lineTo(x0 + dx, y1 + dy); c.lineTo(x0, y1); c.closePath(); c.fill();
  });
}
export const SHADOW_PAD = PAD;

function drawBuilding(c: Ctx, b: BuildingDef) {
  const { w, h, type } = b;
  seed = (b.x * 31 + b.y * 17) % 2147483647 || 5;
  const wall = WALL[type][b.variant % 4];
  const fh = facadeH(b), rh = h - fh;
  const roof = type === 'tower' || type === 'sales' ? '#3a3f45' : type === 'church' ? '#5a4a44' : type === 'government' || type === 'courthouse' ? '#9fa3a6' : ROOFS[(b.variant + Math.floor(b.x / 32)) % ROOFS.length];

  // ---------- south wall, leaning toward the camera ----------
  c.fillStyle = lg(c, 0, rh, 0, h, [[0, col(wall, 1, 0.95)], [1, col(wall, 1, 0.62)]]); c.fillRect(0, rh, w, fh);
  if (type !== 'tower' && type !== 'sales' && type !== 'gallery') {
    c.save(); c.beginPath(); c.rect(0, rh, w, fh); c.clip();
    for (let k = 0; k < w * fh / 18; k++) { c.fillStyle = rnd() < 0.5 ? 'rgba(0,0,0,.12)' : 'rgba(255,255,255,.06)'; c.fillRect(R(0, w), R(rh, h), R(2, 4), 1); }
    c.restore();
  }
  const shop = SHOPS.has(type);
  const sfH = shop ? Math.min(26, fh * 0.42) : 0;
  const winTop = rh + 9, winBot = h - (shop ? sfH + 6 : type === 'brownstone' || type === 'apartment' ? 18 : 8);

  const windows = (cols: number, floors: number, warmP = 0.28) => {
    const cw = w / cols, fl = (winBot - winTop) / floors;
    for (let f = 0; f < floors; f++) for (let k = 0; k < cols; k++) {
      const x = k * cw + cw * 0.26, ww = cw * 0.48, y = winTop + f * fl + fl * 0.16, wh = fl * 0.62;
      const warm = rnd() < warmP;
      c.fillStyle = warm ? pick(['#f7b26a', '#ffc98a', '#e88a5a']) : pick(['#1c232b', '#252d36', '#2e3640']);
      c.fillRect(x, y, ww, wh);
      if (!warm) { c.fillStyle = 'rgba(255,180,120,.18)'; c.fillRect(x, y, ww * 0.4, wh); }
      c.fillStyle = col('#d8d2c4', 0.55); c.fillRect(x - 1, y + wh, ww + 2, 1.6);
      if (type === 'brownstone') { c.fillStyle = col(wall, 1, 0.72); c.fillRect(x - 2, y - 3, ww + 4, 2.5); }
    }
  };

  switch (type) {
    case 'tower': {
      c.fillStyle = lg(c, 0, rh, 0, h, [[0, '#f2b07a'], [0.45, '#c7795a'], [1, '#3a4a5c']]); c.fillRect(0, rh, w, fh);
      c.strokeStyle = 'rgba(30,35,45,.5)'; c.lineWidth = 0.8;
      for (let x = 10; x < w; x += 12) line(c, x, rh, x, h);
      for (let y = rh + 10; y < h; y += 10) line(c, 0, y, w, y);
      for (let i = 0; i < w * fh / 400; i++) { c.fillStyle = 'rgba(0,0,0,.16)'; c.fillRect(Math.floor(R(0, w / 12)) * 12, rh + Math.floor(R(0, fh / 10)) * 10, 12, 10); }
      c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.moveTo(w * 0.15, h); c.lineTo(w * 0.45, rh); c.lineTo(w * 0.55, rh); c.lineTo(w * 0.25, h); c.fill();
      c.fillStyle = '#1c232b'; c.fillRect(w / 2 - 20, h - 18, 40, 18); c.fillStyle = 'rgba(255,214,150,.6)'; c.fillRect(w / 2 - 17, h - 15, 34, 12);
      if (b.name) { c.fillStyle = 'rgba(14,16,20,.75)'; c.fillRect(8, h - 34, w - 16, 13); sign(c, b.name, w / 2, h - 27.5, w - 22, 10, '#f2e8d8', 700); }
      break;
    }
    case 'government': case 'courthouse': {
      c.fillStyle = col(wall, 1, 0.9); c.fillRect(0, rh, w, 12);
      c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(0, rh + 12, w, 2);
      if (b.name) sign(c, b.name, w / 2, rh + 6.5, w - 20, 9, '#4a4238', 800);
      const n = Math.max(4, Math.floor(w / 26));
      for (let i = 0; i < n; i++) { const x = 10 + i * ((w - 26) / (n - 1)); c.fillStyle = lg(c, x, 0, x + 8, 0, [[0, '#f2ece0'], [1, '#a8a092']]); c.fillRect(x, rh + 16, 8, fh - 34); c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(x + 8, rh + 16, 3, fh - 34); }
      for (let i = 0; i < 3; i++) { c.fillStyle = col(wall, 1, 0.95 - i * 0.08); c.fillRect(4 + i * 3, h - 18 + i * 6, w - 8 - i * 6, 6); }
      if (type === 'courthouse') { c.fillStyle = '#c9a43a'; c.fillRect(w / 2 - 1, rh + 2, 2, 9); }
      break;
    }
    case 'mural': {
      c.save(); c.beginPath(); c.rect(4, rh + 4, w - 8, fh - 8); c.clip();
      c.fillStyle = lg(c, 0, rh, 0, h, [[0, '#7b3fe4'], [0.55, '#e8509a'], [1, '#f08a3d']]); c.fillRect(0, rh, w, fh);
      const sx = w / 2, sy = rh + fh * 0.62;
      for (let i = 0; i < 12; i++) { c.strokeStyle = 'rgba(255,210,63,.4)'; c.lineWidth = 5; const a = Math.PI + (i / 11) * Math.PI; line(c, sx, sy, sx + Math.cos(a) * w, sy + Math.sin(a) * w); }
      c.fillStyle = '#f5c842'; ell(c, sx, sy, 24, 24); c.fill();
      ['#8a4b3a', '#f2c29b', '#c58a5c', '#5a3324'].forEach((hc, i) => { c.fillStyle = hc; rr(c, sx - 62 + i * 34, sy - 26, 14, 34, 5); c.fill(); });
      c.restore();
      c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(10, rh + 6, w - 20, 16); sign(c, 'FEED THE BLOCK', w / 2, rh + 14, w - 30, 13, '#fff3dc', 900);
      sign(c, 'TAKE WHAT YOU NEED · LEAVE WHAT YOU CAN', w / 2, h - 9, w - 24, 8, '#ffd23f', 800);
      break;
    }
    case 'warehouse': {
      windows(Math.max(2, Math.floor(w / 40)), 1, 0.1);
      c.fillStyle = lg(c, 0, h - 40, 0, h, [[0, '#8a8e92'], [1, '#55595d']]); c.fillRect(w * 0.22, h - 40, w * 0.56, 40);
      c.strokeStyle = 'rgba(40,42,44,.6)'; c.lineWidth = 1; for (let y = h - 36; y < h; y += 5) line(c, w * 0.22, y, w * 0.78, y);
      c.save(); c.translate(w / 2, h - 22); c.rotate(-0.05); c.font = `900 13px Impact, "Arial Black", sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillStyle = pick(['rgba(255,79,163,.85)', 'rgba(127,214,107,.85)', 'rgba(255,210,63,.85)']); c.fillText(pick(['RENT IS THEFT', 'WHO OWNS BKLYN?', 'UNION!', 'ART NOT CONDOS']), 0, 0); c.restore();
      if (b.name) { c.fillStyle = 'rgba(14,16,20,.6)'; c.fillRect(10, rh + 4, w - 20, 13); sign(c, b.name, w / 2, rh + 10.5, w - 24, 9, '#e8e4dc', 700); }
      break;
    }
    case 'church': {
      c.fillStyle = '#2a1e2a'; c.beginPath(); c.moveTo(w / 2 - 14, h - 10); c.lineTo(w / 2 - 14, rh + 30); c.arc(w / 2, rh + 30, 14, Math.PI, 0); c.lineTo(w / 2 + 14, h - 10); c.fill();
      c.fillStyle = 'rgba(255,170,90,.55)'; ell(c, w / 2, rh + 26, 8, 8); c.fill();
      windows(Math.max(2, Math.floor(w / 46)), 1, 0.4);
      if (b.name) { c.fillStyle = 'rgba(255,250,240,.85)'; c.fillRect(10, h - 22, w - 20, 12); sign(c, b.name, w / 2, h - 16, w - 24, 8, '#4a2a6a', 800); }
      break;
    }
    case 'police': {
      windows(Math.max(2, Math.floor(w / 36)), Math.max(1, Math.round((winBot - winTop) / 30)), 0.15);
      c.fillStyle = '#1f2f5a'; c.fillRect(0, h - 26, w, 14); sign(c, b.name ?? 'PRECINCT', w / 2, h - 19, w - 20, 10, '#f4efe6', 800);
      c.fillStyle = '#2a2a2e'; c.fillRect(w / 2 - 12, h - 12, 24, 12);
      c.fillStyle = '#4ab0ff'; ell(c, 12, h - 30, 3, 3); c.fill(); ell(c, w - 12, h - 30, 3, 3); c.fill();
      break;
    }
    case 'shed': {
      c.fillStyle = lg(c, 0, rh, 0, h, [[0, '#9a744a'], [1, '#6a4a2a']]); c.fillRect(0, rh, w, fh);
      c.strokeStyle = 'rgba(40,25,10,.4)'; c.lineWidth = 1; for (let x = 6; x < w; x += 6) line(c, x, rh, x, h);
      if (b.name) { c.fillStyle = 'rgba(250,245,235,.85)'; c.fillRect(6, rh + 8, w - 12, 11); sign(c, b.name, w / 2, rh + 13.5, w - 14, 7, '#3a2a1a', 700); }
      break;
    }
    default: {
      const floors = Math.max(1, Math.round((winBot - winTop) / 28));
      const cols = Math.max(2, Math.floor(w / (type === 'brownstone' ? 22 : 26)));
      windows(cols, floors, type === 'sales' || type === 'gallery' ? 0.6 : 0.28);
      if (type === 'brownstone' || type === 'apartment') {
        // stoop + door
        const sx = w / 2 - 12;
        for (let i = 0; i < 4; i++) { c.fillStyle = col(wall, 1, 0.85 + i * 0.05); c.fillRect(sx - i * 2, h - 16 + i * 4, 24 + i * 4, 4); c.fillStyle = 'rgba(255,225,180,.25)'; c.fillRect(sx - i * 2, h - 16 + i * 4, 24 + i * 4, 1); }
        c.fillStyle = '#2a1a14'; c.fillRect(sx + 5, h - 26, 14, 10);
        c.strokeStyle = '#151210'; c.lineWidth = 1.2; line(c, sx - 8, h - 18, sx - 8, h); line(c, sx + 32, h - 18, sx + 32, h);
        if (b.name) { c.fillStyle = 'rgba(250,245,235,.85)'; c.fillRect(w / 2 - 40, rh + 3, 80, 10); sign(c, b.name, w / 2, rh + 8, 76, 7, '#2a2420', 700); }
      }
      if (shop) storefront(c, b, wall, h - sfH, sfH);
    }
  }
  // cornice: shadowed band where the roof parapet overhangs the wall
  c.fillStyle = col(wall, 1, 0.55); c.fillRect(0, rh, w, 4);
  c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(0, rh + 4, w, 2);

  // ---------- roof ----------
  c.fillStyle = col(roof); c.fillRect(0, 0, w, rh);
  c.save(); c.beginPath(); c.rect(0, 0, w, rh); c.clip();
  for (let k = 0; k < w * rh / 26; k++) { c.fillStyle = rnd() < 0.5 ? 'rgba(0,0,0,.14)' : 'rgba(255,255,255,.08)'; c.fillRect(R(0, w), R(0, rh), R(1, 3), R(1, 2)); }
  if (['#b7babd', '#c2c4c4', '#a9adb1'].includes(roof)) { c.strokeStyle = 'rgba(0,0,0,.1)'; c.lineWidth = 0.8; for (let x = 9; x < w; x += 9) line(c, x, 0, x, rh); }
  c.fillStyle = lg(c, 0, 0, w, rh, [[0, 'rgba(255,190,120,.2)'], [1, 'rgba(0,0,0,.18)']]); c.fillRect(0, 0, w, rh);
  roofDetails(c, b, w, rh);
  c.restore();
  c.strokeStyle = col(roof, 1, 1.25); c.lineWidth = 3; c.strokeRect(1.5, 1.5, w - 3, rh - 3);
  c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = 1; c.strokeRect(3.5, 3.5, w - 7, rh - 7);
  // west face catches the low sun
  c.fillStyle = 'rgba(255,170,90,.32)'; c.fillRect(0, 0, 2.5, h);
  // party walls between row buildings
  c.fillStyle = 'rgba(0,0,0,.28)'; c.fillRect(w - 1.5, 0, 1.5, h);
}

function storefront(c: Ctx, b: BuildingDef, wall: string, y: number, sfH: number) {
  const { w, type } = b;
  const [bg, fg] = SIGNS[type] ?? ['#1c1a18', '#f4efe6'];
  c.fillStyle = bg; c.fillRect(4, y, w - 8, 10);
  c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(4, y, w - 8, 1);
  if (b.name || type !== 'studio') sign(c, b.name || type.toUpperCase(), w / 2, y + 5.5, w - 14, 8, fg, 800);
  // glass + door
  c.fillStyle = lg(c, 0, y + 10, 0, y + sfH, [[0, '#2e3a44'], [1, '#141a20']]); c.fillRect(4, y + 10, w - 8, sfH - 10);
  c.fillStyle = 'rgba(255,200,140,.28)'; c.fillRect(6, y + 12, (w - 12) * 0.55, sfH - 14);
  c.fillStyle = 'rgba(255,214,150,.35)'; for (let x = 10; x < w - 30; x += 12) c.fillRect(x, y + sfH - 7, 7, 4);
  c.fillStyle = col(wall, 1, 0.5); c.fillRect(w - 24, y + 11, 14, sfH - 11);
  if (type === 'bodega' || type === 'coop' || type === 'bakery' || type === 'coffee') {
    // awning in front of the sign band
    const aw = type === 'bodega' ? ['#e8b82a', '#b88a10'] : type === 'coop' ? ['#3f7a4a', '#2a5a34'] : type === 'bakery' ? ['#c8a06a', '#8a6a3a'] : ['#2a2a2e', '#141416'];
    c.fillStyle = lg(c, 0, y - 6, 0, y + 2, [[0, aw[0]], [1, aw[1]]]); c.fillRect(2, y - 6, w - 4, 7);
    c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(2, y + 1, w - 4, 2);
  }
}

function boxOnRoof(c: Ctx, x: number, y: number, w: number, h: number, color: string, hgt = 6) {
  c.fillStyle = `rgba(10,6,16,${SUN_SHADOW.alpha * 0.8})`; c.fillRect(x + hgt * SUN_SHADOW.dx, y + hgt * SUN_SHADOW.dy, w, h);
  c.fillStyle = col(color); c.fillRect(x, y, w, h);
  c.fillStyle = lg(c, x, y, x + w, y + h, [[0, 'rgba(255,255,255,.25)'], [1, 'rgba(0,0,0,.25)']]); c.fillRect(x, y, w, h);
}
function ac(c: Ctx, x: number, y: number, s: number) {
  boxOnRoof(c, x, y, s * 1.4, s, '#b9bcbf', 7);
  c.fillStyle = col('#2a2c2f'); ell(c, x + s * 0.7, y + s / 2, s * 0.36, s * 0.36); c.fill();
  c.strokeStyle = col('#8a8d90'); c.lineWidth = 0.8; for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + 0.4; line(c, x + s * 0.7, y + s / 2, x + s * 0.7 + Math.cos(a) * s * 0.3, y + s / 2 + Math.sin(a) * s * 0.3); }
}
function waterTower(c: Ctx, x: number, y: number, r: number) {
  c.fillStyle = `rgba(10,6,16,${SUN_SHADOW.alpha})`; ell(c, x + 30 * SUN_SHADOW.dx, y + 30 * SUN_SHADOW.dy, r, r * 0.95); c.fill();
  c.strokeStyle = '#2a2a2a'; c.lineWidth = 2; for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) line(c, x + dx * r * 0.6, y + dy * r * 0.6, x + dx * r * 0.5 + 6, y + dy * r * 0.5 + 6);
  c.fillStyle = rg(c, x - r * 0.3, y - r * 0.3, 2, r, [[0, '#a07a52'], [1, '#4a3424']]); ell(c, x, y, r, r); c.fill();
  c.strokeStyle = 'rgba(44,32,24,.8)'; c.lineWidth = 1; [0.75, 0.45].forEach((k) => { ell(c, x, y, r * k, r * k); c.stroke(); });
  c.fillStyle = '#333'; ell(c, x, y, 2, 2); c.fill();
}
function roofDetails(c: Ctx, b: BuildingDef, w: number, rh: number) {
  const U = (u: number) => u * w, V = (v: number) => v * rh;
  const big = w >= 120 && rh >= 90;
  switch (b.type) {
    case 'sales': {
      c.fillStyle = col('#9b7b58'); c.fillRect(U(0.06), V(0.08), w * 0.62, rh * 0.5);
      c.strokeStyle = 'rgba(107,79,54,.5)'; c.lineWidth = 0.6; for (let x = U(0.06); x < U(0.68); x += 4) line(c, x, V(0.08), x, V(0.58));
      c.fillStyle = '#f2f2ee'; c.fillRect(U(0.12) - 3, V(0.14) - 3, w * 0.44 + 6, rh * 0.26 + 6);
      c.fillStyle = lg(c, U(0.12), V(0.14), U(0.56), V(0.4), [[0, '#4ad6e6'], [1, '#1a8fb8']]); c.fillRect(U(0.12), V(0.14), w * 0.44, rh * 0.26);
      c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 1; for (let k = 0; k < 4; k++) { const y = V(0.17 + k * 0.05); c.beginPath(); c.moveTo(U(0.14), y); c.bezierCurveTo(U(0.25), y - 3, U(0.4), y + 3, U(0.54), y); c.stroke(); }
      for (let k = 0; k < 4; k++) { c.fillStyle = '#f0eee8'; rr(c, U(0.12) + k * 14, V(0.45), 8, 14, 2); c.fill(); }
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { c.fillStyle = '#1d2b4a'; c.fillRect(U(0.74) + i * 12, V(0.1) + j * 20, 10, 18); }
      c.font = `300 ${Math.min(16, w / 9)}px ${SANS}`; c.fillStyle = 'rgba(232,228,220,.9)'; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillText('L U X E   L O F T S', U(0.06), V(0.86));
      break;
    }
    case 'tower': boxOnRoof(c, U(0.25), V(0.22), w * 0.5, rh * 0.4, '#7d8288', 16); ac(c, U(0.1), V(0.72), 16); ac(c, U(0.62), V(0.72), 16); break;
    case 'government': case 'courthouse': {
      c.fillStyle = 'rgba(0,0,0,.1)'; c.fillRect(U(0.1), V(0.15), w * 0.8, rh * 0.7);
      c.fillStyle = rg(c, U(0.45), V(0.45), 2, Math.min(w, rh) * 0.3, [[0, '#9fc8b4'], [1, '#4a7a66']]); ell(c, U(0.5), V(0.5), Math.min(w, rh) * 0.24, Math.min(w, rh) * 0.24); c.fill();
      ac(c, U(0.1), V(0.7), 14); break;
    }
    case 'warehouse': {
      for (let i = 0; i < Math.floor(w / 36); i++) { c.fillStyle = col('#7fa3b8', 0.85); c.fillRect(U(0.06) + i * 34, V(0.14), 20, rh * 0.5); c.strokeStyle = '#3a3d40'; c.lineWidth = 1; c.strokeRect(U(0.06) + i * 34, V(0.14), 20, rh * 0.5); }
      ac(c, U(0.7), V(0.74), 16);
      if (b.name === 'FORMER PICKLE FACTORY') { c.save(); c.translate(U(0.5), V(0.82)); c.rotate(-0.05); c.font = '900 26px Impact, "Arial Black", sans-serif'; c.textAlign = 'center'; c.lineWidth = 4; c.strokeStyle = 'rgba(21,21,21,.75)'; c.strokeText('RENT STRIKE', 0, 0); c.fillStyle = 'rgba(255,79,163,.85)'; c.fillText('RENT STRIKE', 0, 0); c.restore(); }
      break;
    }
    case 'community': case 'tenant': case 'coop': case 'nonprofit': {
      for (let i = 0; i < Math.floor(w / 30); i++) { c.fillStyle = '#5a4030'; c.fillRect(U(0.08) + i * 28, V(0.2), 20, rh * 0.42); for (let k = 0; k < 6; k++) { c.fillStyle = pick(['#5f8a3c', '#7ea54e', '#3d6128']); ell(c, U(0.08) + i * 28 + R(4, 16), V(0.2) + R(4, rh * 0.42 - 4), R(2, 4), R(2, 4)); c.fill(); } }
      ac(c, U(0.72), V(0.72), 13); break;
    }
    case 'church': c.fillStyle = 'rgba(255,255,255,.08)'; c.fillRect(U(0.48), 0, 3, rh); break;
    default: {
      if (b.district === 'parkslope' && rnd() < 0.6) { for (let i = 0; i < Math.floor(w / 18); i++) { c.fillStyle = '#1d2b4a'; c.fillRect(U(0.08) + i * 16, V(0.18), 13, 18); c.strokeStyle = 'rgba(90,111,154,.6)'; c.lineWidth = 0.8; c.strokeRect(U(0.08) + i * 16, V(0.18), 13, 18); } }
      if (big && rnd() < 0.55) waterTower(c, U(R(0.3, 0.75)), V(R(0.3, 0.6)), 15);
      else boxOnRoof(c, U(R(0.15, 0.6)), V(R(0.15, 0.35)), 9, 8, '#7a4434', 12);
      if (rnd() < 0.7) ac(c, U(R(0.1, 0.55)), V(R(0.55, 0.75)), 11);
      if (rnd() < 0.4) { c.fillStyle = col('#8fb3c9', 0.8); c.fillRect(U(0.65), V(0.25), 12, 12); }
      c.fillStyle = '#2a2a2a'; for (let k = 0; k < 2; k++) { ell(c, U(R(0.1, 0.9)), V(R(0.15, 0.85)), 2.2, 2.2); c.fill(); }
    }
  }
}

// ------------------------------------------------------------------ PEOPLE (top-down, facing up)
export const PED = 36;
const PS = 1.7;
function drawWalker(c: Ctx, L: Look, f: number, scale = PS) {
  c.save();
  c.filter = 'blur(1.5px)'; c.fillStyle = 'rgba(10,6,16,.3)'; ell(c, 0, 0, 9, 9); c.fill(); c.filter = 'none';
  c.rotate(-Math.PI / 2); c.scale(scale, scale);
  const st = f ? 2.6 : -2.6;
  const shoes = L.shoes ?? '#1a1a1c';
  c.fillStyle = shoes; ell(c, st, -2.7, 2.4, 1.5); c.fill(); ell(c, -st, 2.7, 2.4, 1.5); c.fill();
  c.fillStyle = col(L.shirt, 1, 0.82); ell(c, -st * 0.6, -6.3, 2.3, 1.7); c.fill(); ell(c, st * 0.6, 6.3, 2.3, 1.7); c.fill();
  c.fillStyle = L.skin; ell(c, -st * 0.9, -6.6, 1.2, 1.2); c.fill(); ell(c, st * 0.9, 6.6, 1.2, 1.2); c.fill();
  if (L.style === 'long' || L.style === 'braids') { c.fillStyle = L.hair; ell(c, -3, 0, 3.2, 3.6); c.fill(); }
  c.fillStyle = L.shirt; ell(c, 0, 0, L.dress ? 4.8 : 4.3, 6.6); c.fill();
  c.fillStyle = 'rgba(0,0,0,.22)'; ell(c, -1.2, 0, 2.6, 6); c.fill();
  c.fillStyle = 'rgba(255,200,140,.18)'; ell(c, 1, -2.5, 2, 3); c.fill();
  if (L.acc === 'tote') { c.fillStyle = '#e8dcc0'; c.fillRect(-4, 4.2, 5, 3.6); }
  if (L.acc === 'apron') { c.fillStyle = 'rgba(255,255,255,.85)'; ell(c, 2, 0, 2, 4.4); c.fill(); }
  if (L.acc === 'clipboard') { c.fillStyle = '#c08a4f'; c.fillRect(4.2, -2, 2.6, 3.6); c.fillStyle = '#fff'; c.fillRect(4.6, -1.6, 1.8, 2.6); }
  if (L.acc === 'scarf') { c.fillStyle = '#e8509a'; ell(c, 0.5, 0, 2.2, 4); c.fill(); }
  if (L.acc === 'cane') { c.strokeStyle = '#7a4a2a'; c.lineWidth = 0.9; line(c, 2, 6.5, 6, 7.5); }
  if (L.acc === 'ringlight') { c.strokeStyle = 'rgba(255,255,240,.95)'; c.lineWidth = 1; ell(c, 7, -3, 2.4, 2.4); c.stroke(); }
  // head + hair
  c.fillStyle = L.skin; ell(c, 0.6, 0, 3.2, 3.1); c.fill();
  const hat = L.style === 'beanie' || L.style === 'cap' || L.acc === 'beret';
  switch (L.style) {
    case 'bald': c.fillStyle = 'rgba(255,230,200,.35)'; ell(c, -0.4, -0.8, 1.4, 1.1); c.fill(); break;
    case 'afro': c.fillStyle = L.hair; ell(c, -0.6, 0, 4.3, 4.4); c.fill(); break;
    case 'mohawk': c.fillStyle = L.hair; c.fillRect(-3.2, -0.9, 6, 1.8); break;
    case 'bun': c.fillStyle = L.hair; ell(c, -0.5, 0, 3.1, 3.2); c.fill(); ell(c, -3.6, 0, 1.6, 1.6); c.fill(); break;
    case 'curly': c.fillStyle = L.hair; for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; ell(c, -0.6 + Math.cos(a) * 1.9, Math.sin(a) * 1.9, 1.7, 1.7); c.fill(); } break;
    case 'beanie': case 'cap': break;
    default: c.fillStyle = L.hair; ell(c, -0.5, 0, 3.1, 3.2); c.fill();
  }
  if (hat) {
    c.fillStyle = L.hatColor ?? (L.acc === 'beret' ? '#1c1a18' : '#e0702d'); ell(c, -0.5, 0, 3.5, 3.5); c.fill();
    if (L.style === 'cap') { ell(c, 3.2, 0, 1.6, 2.6); c.fill(); }
    if (L.style === 'beanie') { c.fillStyle = 'rgba(0,0,0,.15)'; ell(c, -0.5, 0, 2.2, 2.2); c.fill(); }
  } else if (L.style !== 'bald' && L.style !== 'afro' && L.style !== 'mohawk') { c.fillStyle = L.skin; ell(c, 1.6, 0, 1.6, 2.2); c.fill(); }
  if (L.acc === 'headphones') { c.strokeStyle = '#1c1a18'; c.lineWidth = 0.8; c.beginPath(); c.arc(0, 0, 3.6, Math.PI * 0.6, Math.PI * 1.4); c.stroke(); c.fillStyle = '#e8509a'; ell(c, 0, -3.4, 1, 1.2); c.fill(); ell(c, 0, 3.4, 1, 1.2); c.fill(); }
  if (L.acc === 'glasses') { c.fillStyle = '#1c1a18'; c.fillRect(2.9, -1.8, 0.7, 3.6); }
  c.restore();
}

/** Top-down walker (2 stride frames, facing up) plus a front-facing portrait under `${key}-front`. */
export function makeCharacter(scene: Phaser.Scene, key: string, look: Look) {
  makeFrontCharacter(scene, `${key}-front`, look);
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, PED * 2, PED)!;
  const c = tex.getContext();
  for (let f = 0; f < 2; f++) { c.save(); c.translate(f * PED + PED / 2, PED / 2); drawWalker(c, look, f); c.restore(); }
  tex.refresh(); tex.add(0, 0, 0, 0, PED, PED); tex.add(1, 0, PED, 0, PED, PED);
}

function drawBike(c: Ctx, frameColor: string, f: number, L = 40) {
  c.save(); c.rotate(-Math.PI / 2);
  c.filter = 'blur(1.5px)'; c.fillStyle = 'rgba(10,6,16,.3)'; rr(c, -L / 2, -5, L, 10, 5); c.fill(); c.filter = 'none';
  c.fillStyle = '#141416'; for (const x of [-L / 2 + 6, L / 2 - 6]) { rr(c, x - 6, -1.6, 12, 3.2, 1.6); c.fill(); }
  c.strokeStyle = frameColor; c.lineWidth = 2.4; line(c, -L / 2 + 6, 0, L / 2 - 8, 0);
  c.strokeStyle = '#1c1a18'; c.lineWidth = 1.6; line(c, L / 2 - 9, -7, L / 2 - 9, 7);
  c.fillStyle = frameColor; c.fillRect(L / 2 - 6, -4, 5, 8);
  c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(-L / 2 + 6 + (f ? 2 : 0), -0.6, 3, 1.2);
  c.restore();
}

export function makeBikeRider(scene: Phaser.Scene, key: string, look: Look) {
  makeFrontCharacter(scene, `${key}-front`, look);
  if (scene.textures.exists(key)) return;
  const S = 48;
  const tex = scene.textures.createCanvas(key, S * 2, S)!;
  const c = tex.getContext();
  for (let f = 0; f < 2; f++) {
    c.save(); c.translate(f * S + S / 2, S / 2);
    drawBike(c, '#2fb5aa', f);
    c.translate(0, 3); drawWalker(c, { ...look }, 0, 1.55);
    c.restore();
  }
  tex.refresh(); tex.add(0, 0, 0, 0, S, S); tex.add(1, 0, S, 0, S, S);
}

// ------------------------------------------------------------------ VEHICLES (top-down, facing up)
function drawCar(c: Ctx, L: number, Wd: number, body: string, o: { taxi?: boolean; box?: boolean; label?: string; boro?: boolean }) {
  c.save(); c.rotate(-Math.PI / 2);
  c.fillStyle = '#0d0d0f'; [[-L * 0.3, -1], [L * 0.3, -1], [-L * 0.3, 1], [L * 0.3, 1]].forEach(([tx, s]) => c.fillRect(tx - 7, s * Wd / 2 - 2, 14, 4));
  const gloss = (p: () => void) => { c.fillStyle = lg(c, 0, -Wd / 2, 0, Wd / 2, [[0, 'rgba(255,255,255,.3)'], [0.35, 'rgba(255,255,255,.06)'], [0.65, 'rgba(0,0,0,.05)'], [1, 'rgba(0,0,0,.38)']]); p(); c.fill(); };
  if (o.box) {
    c.fillStyle = body; rr(c, L / 2 - 24, -Wd / 2 + 1, 24, Wd - 2, 6); c.fill(); gloss(() => rr(c, L / 2 - 24, -Wd / 2 + 1, 24, Wd - 2, 6));
    c.fillStyle = '#1b232c'; c.fillRect(L / 2 - 11, -Wd / 2 + 4, 6, Wd - 8);
    c.fillStyle = '#ecebe6'; rr(c, -L / 2, -Wd / 2 - 1, L - 26, Wd + 2, 2); c.fill(); gloss(() => rr(c, -L / 2, -Wd / 2 - 1, L - 26, Wd + 2, 2));
    c.strokeStyle = '#b9b7b0'; c.lineWidth = 0.8; for (let i = -L / 2 + 6; i < L / 2 - 30; i += 7) line(c, i, -Wd / 2, i, Wd / 2);
    if (o.label) { c.save(); c.translate(-6, 0); c.font = `900 10px ${SANS}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#e8702a'; c.fillText(o.label, 0, 0); c.restore(); }
  } else {
    c.fillStyle = body; rr(c, -L / 2, -Wd / 2, L, Wd, 9); c.fill(); gloss(() => rr(c, -L / 2, -Wd / 2, L, Wd, 9));
    c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 0.8; line(c, L * 0.3, -Wd * 0.25, L * 0.45, -Wd * 0.28); line(c, L * 0.3, Wd * 0.25, L * 0.45, Wd * 0.28);
    c.fillStyle = lg(c, L * 0.08, -Wd / 2, L * 0.26, Wd / 2, [[0, '#0f141a'], [0.45, '#6a4a52'], [0.55, '#0f141a'], [1, '#1b232c']]);
    c.beginPath(); c.moveTo(L * 0.06, -Wd * 0.42); c.lineTo(L * 0.26, -Wd * 0.34); c.lineTo(L * 0.26, Wd * 0.34); c.lineTo(L * 0.06, Wd * 0.42); c.closePath(); c.fill();
    c.fillStyle = '#141a20'; c.beginPath(); c.moveTo(-L * 0.26, -Wd * 0.4); c.lineTo(-L * 0.36, -Wd * 0.33); c.lineTo(-L * 0.36, Wd * 0.33); c.lineTo(-L * 0.26, Wd * 0.4); c.closePath(); c.fill();
    c.fillStyle = col(body, 1, 0.9); rr(c, -L * 0.26, -Wd * 0.39, L * 0.32, Wd * 0.78, 4); c.fill(); gloss(() => rr(c, -L * 0.26, -Wd * 0.39, L * 0.32, Wd * 0.78, 4));
    c.fillStyle = '#10151b'; c.fillRect(-L * 0.25, -Wd * 0.46, L * 0.3, Wd * 0.07); c.fillRect(-L * 0.25, Wd * 0.39, L * 0.3, Wd * 0.07);
    if (o.taxi) { c.fillStyle = '#f5f0d8'; rr(c, -L * 0.14, -5, 9, 10, 2); c.fill(); }
    if (o.boro) { c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(-L * 0.4, -Wd / 2 + 1, L * 0.7, 2); c.fillRect(-L * 0.4, Wd / 2 - 3, L * 0.7, 2); }
  }
  c.fillStyle = '#f2efe2'; c.fillRect(L / 2 - 3, -Wd * 0.38, 2.5, 6); c.fillRect(L / 2 - 3, Wd * 0.38 - 6, 2.5, 6);
  c.fillStyle = '#8a1414'; c.fillRect(-L / 2 + 0.5, -Wd * 0.4, 2.5, 6); c.fillRect(-L / 2 + 0.5, Wd * 0.4 - 6, 2.5, 6);
  c.restore();
}

export function makeVehicles(scene: Phaser.Scene) {
  const cars: { key: string; body: string; long?: boolean; taxi?: boolean; boro?: boolean; label?: string }[] = [
    { key: 'car0', body: '#1c1d20' }, { key: 'car1', body: '#e4e4e2' }, { key: 'car2', body: '#e9b32a', taxi: true },
    { key: 'car3', body: '#7fb84a', taxi: true, boro: true }, { key: 'car4', body: '#141518' },
    { key: 'car5', body: '#5b1e22' }, { key: 'van', body: '#d8d6d0', long: true, label: 'SMAZON' }, { key: 'car6', body: '#2d3f5c' },
  ];
  for (const v of cars) {
    const w = 38, h = v.long ? 84 : 66;
    canvas(scene, v.key, w, h, (c) => { c.translate(w / 2, h / 2); drawCar(c, h - 4, w - 8, v.body, { taxi: v.taxi, boro: v.boro, box: v.long, label: v.label }); });
    canvas(scene, `${v.key}-shd`, w + 12, h + 12, (c) => { c.filter = 'blur(4px)'; c.fillStyle = 'rgba(8,5,14,.55)'; rr(c, 6, 6, w, h, 10); c.fill(); });
  }
  canvas(scene, 'cyclist', 22, 44, (c) => { c.translate(11, 22); drawBike(c, '#c8322a', 0, 38); c.translate(0, 3); drawWalker(c, { skin: '#c58a5c', hair: '#1a1010', style: 'cap', hatColor: '#2b3a6b', shirt: '#e8e6df', pants: '#2b3a6b' }, 0, 1.3); });
  canvas(scene, 'cyclist-shd', 34, 56, (c) => { c.filter = 'blur(3px)'; c.fillStyle = 'rgba(8,5,14,.4)'; rr(c, 10, 6, 14, 44, 6); c.fill(); });
}

// ------------------------------------------------------------------ STREET PROPS
/** Restyled versions of the common street props. Call before textures.makeProps so these keys win. */
export function makeStreetProps(scene: Phaser.Scene) {
  seed = 23;
  const canopy = ['#5f8a3c', '#4f7a34', '#b8862a'];
  for (let v = 0; v < 3; v++) canvas(scene, `tree${v}`, 72, 76, (c) => {
    const cx = 30, cy = 40, r = 22;
    c.save(); c.filter = 'blur(4px)'; c.fillStyle = 'rgba(14,8,22,.42)'; ell(c, cx + 12, cy + 6, r, r * 0.9); c.fill(); c.restore();
    const base = canopy[v];
    for (let i = 0; i < 9; i++) { const a = rnd() * 6.28, d = R(0, r * 0.5); c.fillStyle = rg(c, cx - 8, cy - 8, r * 0.2, r * 1.2, [[0, col(base, 1, 1.15)], [0.7, col(base, 1, 0.75)], [1, col(base, 1, 0.45)]]); ell(c, cx + Math.cos(a) * d, cy + Math.sin(a) * d, r * R(0.45, 0.65), r * R(0.45, 0.65)); c.fill(); }
    for (let i = 0; i < 30; i++) { const a = rnd() * 6.28, d = R(0, r * 0.85); c.fillStyle = rnd() < 0.5 ? col(base, R(0.25, 0.55), 1.45) : col(base, R(0.25, 0.55), 0.45); ell(c, cx + Math.cos(a) * d - 2, cy + Math.sin(a) * d - 1, R(2, 4.5), R(2, 4.5)); c.fill(); }
    c.fillStyle = 'rgba(255,190,110,.22)'; ell(c, cx - 8, cy - 8, r * 0.55, r * 0.45); c.fill();
  });
  canvas(scene, 'lamp', 60, 72, (c) => {
    const bx = 30, by = 66;
    c.strokeStyle = 'rgba(14,8,22,.35)'; c.lineWidth = 2.5; line(c, bx, by, bx + 28, by + 9);
    c.strokeStyle = '#3b3e42'; c.lineWidth = 2.2; line(c, bx, by, bx, by - 30);
    c.lineWidth = 1.6; line(c, bx, by - 30, bx, by - 44);
    c.fillStyle = '#2a2c2f'; ell(c, bx, by - 46, 3, 4.5); c.fill();
    c.fillStyle = 'rgba(255,214,150,.6)'; ell(c, bx, by - 46, 1.5, 2.2); c.fill();
    c.fillStyle = '#2a2a2a'; ell(c, bx, by, 2.6, 2.6); c.fill();
  });
  canvas(scene, 'hydrant', 20, 28, (c) => {
    c.fillStyle = 'rgba(14,8,22,.35)'; ell(c, 13, 22, 6, 4); c.fill();
    c.fillStyle = '#a8322a'; ell(c, 10, 20, 5, 5); c.fill(); c.fillStyle = '#d04a3a'; ell(c, 9, 19, 3, 3); c.fill();
    c.fillStyle = '#7a1e18'; c.fillRect(3, 19, 4, 2.5); c.fillRect(13, 19, 4, 2.5);
  });
  canvas(scene, 'trash', 22, 30, (c) => {
    c.fillStyle = 'rgba(14,8,22,.35)'; ell(c, 14, 22, 8, 6); c.fill();
    c.fillStyle = '#2f5a3a'; ell(c, 11, 20, 7, 7); c.fill(); c.strokeStyle = '#4a7a54'; c.lineWidth = 1; for (let r = 2; r < 7; r += 2) { ell(c, 11, 20, r, r); c.stroke(); }
    c.fillStyle = '#e8e2d0'; ell(c, 10, 19, 2, 1.5); c.fill();
  });
  canvas(scene, 'bench', 64, 28, (c) => {
    c.fillStyle = 'rgba(14,8,22,.35)'; c.fillRect(8, 10, 58, 14);
    for (let i = 0; i < 4; i++) { c.fillStyle = col('#8a6a44', 1, 1 - i * 0.06); c.fillRect(2, 4 + i * 4.5, 60, 3.5); }
    c.fillStyle = '#2a2a2a'; c.fillRect(6, 3, 3, 18); c.fillRect(55, 3, 3, 18);
  });
  canvas(scene, 'fountain', 150, 110, (c) => {
    const cx = 72, cy = 56;
    c.save(); c.filter = 'blur(5px)'; c.fillStyle = 'rgba(14,8,22,.4)'; ell(c, cx + 14, cy + 6, 62, 46); c.fill(); c.restore();
    c.fillStyle = lg(c, cx - 60, cy - 46, cx + 60, cy + 46, [[0, '#e2d8c8'], [1, '#a89c8a']]); ell(c, cx, cy, 60, 46); c.fill();
    c.fillStyle = lg(c, 0, cy - 38, 0, cy + 38, [[0, '#4a7a86'], [1, '#2f5560']]); ell(c, cx, cy, 50, 37); c.fill();
    c.strokeStyle = 'rgba(255,210,150,.35)'; c.lineWidth = 1; for (const r of [14, 24, 34]) { ell(c, cx, cy, r, r * 0.74); c.stroke(); }
    c.fillStyle = '#cfc4b2'; ell(c, cx, cy, 10, 8); c.fill(); c.fillStyle = 'rgba(255,255,255,.75)'; ell(c, cx - 1, cy - 1, 5, 4); c.fill();
    c.fillStyle = 'rgba(255,240,220,.25)'; ell(c, cx - 28, cy - 24, 22, 8, -0.4); c.fill();
  });
  canvas(scene, 'crate0', 32, 32, (c) => {
    c.fillStyle = 'rgba(14,8,22,.35)'; c.fillRect(10, 10, 22, 20);
    c.fillStyle = '#8a6a44'; c.fillRect(4, 6, 22, 20); c.strokeStyle = 'rgba(40,25,10,.5)'; c.lineWidth = 1; for (let y = 10; y < 26; y += 5) line(c, 4, y, 26, y);
  });
  canvas(scene, 'dumpster0', 60, 36, (c) => {
    c.fillStyle = 'rgba(14,8,22,.4)'; c.fillRect(12, 10, 50, 24);
    c.fillStyle = '#2f5a3a'; c.fillRect(2, 4, 52, 26); c.fillStyle = '#3d6e48'; c.fillRect(4, 6, 23, 22); c.fillRect(29, 6, 23, 22);
    c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(4, 6, 48, 2);
  });
}
