import Phaser from 'phaser';
import type { Look } from './textures';

/**
 * Waist-up dialogue portraits in the Style A conversation-scene look
 * (style-study/charview.html, portraits.html): ink outlines, painted gradients,
 * stipple texture, golden-hour light from the left. Driven by the same Look
 * data as the sprites, so every character gets one automatically.
 */

type Ctx = CanvasRenderingContext2D;
export const BUST_W = 240, BUST_H = 300;
const VW = 400, VH = 500; // virtual drawing space
const INK = '#24160f';
const cx = 200, cy = 205;

let seed = 1;
const rnd = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const R = (a: number, b: number) => a + (b - a) * rnd();
const pick = <V>(a: V[]): V => a[Math.floor(rnd() * a.length)];
function hash(s: string) { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; }
function rgb(h: string) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function mul(h: string, m: number, a = 1) { const [r, g, b] = rgb(h).map((v) => Math.max(0, Math.min(255, Math.round(v * m)))); return `rgba(${r},${g},${b},${a})`; }
function ell(c: Ctx, x: number, y: number, rx: number, ry: number, a = 0) { c.beginPath(); c.ellipse(x, y, rx, ry, a, 0, Math.PI * 2); }
function line(c: Ctx, x1: number, y1: number, x2: number, y2: number) { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); }
function lg(c: Ctx, x0: number, y0: number, x1: number, y1: number, stops: [number, string][]) { const g = c.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, s]) => g.addColorStop(o, s)); return g; }
function rg(c: Ctx, x: number, y: number, r0: number, r1: number, stops: [number, string][]) { const g = c.createRadialGradient(x, y, r0, x, y, r1); stops.forEach(([o, s]) => g.addColorStop(o, s)); return g; }
function stipple(c: Ctx, path: () => void, n: number, cols: string[], s0: number, s1: number, box: number[]) {
  c.save(); path(); c.clip();
  for (let i = 0; i < n; i++) { c.fillStyle = pick(cols); c.beginPath(); c.arc(R(box[0], box[2]), R(box[1], box[3]), R(s0, s1), 0, 7); c.fill(); }
  c.restore();
}

interface Face { w: number; top: number; jaw: number; chin: number }
function headPath(c: Ctx, f: Face) {
  const w = f.w; c.beginPath(); c.moveTo(cx - w, cy - 30);
  c.bezierCurveTo(cx - w - 8, cy - f.top, cx + w + 6, cy - f.top - 4, cx + w + 2, cy - 30);
  c.bezierCurveTo(cx + w + 6, cy + 35, cx + w * 0.86, cy + f.jaw, cx + w * 0.3, cy + f.chin - 8);
  c.quadraticCurveTo(cx, cy + f.chin, cx - w * 0.3, cy + f.chin - 8);
  c.bezierCurveTo(cx - w * 0.86, cy + f.jaw, cx - w - 8, cy + 35, cx - w, cy - 30); c.closePath();
}
function torso(c: Ctx, sw: number) {
  c.beginPath(); c.moveTo(cx - 40, cy + 92); c.bezierCurveTo(cx - 90, cy + 128, cx - sw + 20, cy + 134, cx - sw, cy + 196);
  c.lineTo(cx - sw - 25, VH + 10); c.lineTo(cx + sw + 25, VH + 10); c.lineTo(cx + sw, cy + 196); c.bezierCurveTo(cx + sw - 20, cy + 134, cx + 90, cy + 128, cx + 40, cy + 92); c.closePath();
}

function skinTones(base: string): [string, string, string] { return [mul(base, 1.12), base, mul(base, 0.62)]; }

export function drawBust(c: Ctx, L: Look, key: string) {
  seed = hash(key) || 7;
  c.save(); c.scale(BUST_W / VW, BUST_H / VH); c.lineJoin = 'round'; c.lineCap = 'round';
  const [SL, SM, SD] = skinTones(L.skin);
  const fem = L.dress || L.style === 'long' || L.style === 'bun' || L.style === 'braids';
  const f: Face = { w: fem ? 58 : 64, top: 118, jaw: fem ? 76 : 84, chin: fem ? 102 : 106 };
  const sw = fem ? 170 : 190;

  // backdrop: warm blurred street at golden hour
  c.fillStyle = lg(c, 0, 0, 0, VH, [[0, '#ffcf8a'], [0.55, '#f08a5a'], [1, '#6a2a4a']]); c.fillRect(0, 0, VW, VH);
  c.fillStyle = 'rgba(255,240,200,.55)'; ell(c, 70, 70, 120, 90); c.fill();
  c.save(); c.filter = 'blur(6px)';
  for (let i = 0; i < 5; i++) { c.fillStyle = `rgba(${pick(['120,50,50', '90,40,60', '140,70,50'])},.45)`; c.fillRect(R(-20, VW), R(120, 260), R(50, 110), 400); }
  for (let i = 0; i < 10; i++) { c.fillStyle = `rgba(255,${Math.round(R(180, 230))},150,${R(0.2, 0.45)})`; ell(c, R(0, VW), R(40, 300), R(6, 16), R(6, 16)); c.fill(); }
  c.restore();

  // long hair behind the shoulders
  if (L.style === 'long' || L.style === 'braids') {
    c.beginPath(); c.moveTo(cx, cy - 140); c.bezierCurveTo(cx - 130, cy - 140, cx - 128, cy + 30, cx - 132, cy + 170); c.lineTo(cx + 132, cy + 170); c.bezierCurveTo(cx + 128, cy + 30, cx + 130, cy - 140, cx, cy - 140); c.closePath();
    c.fillStyle = lg(c, 0, cy - 140, 0, cy + 170, [[0, mul(L.hair, 1)], [1, mul(L.hair, 0.55)]]); c.fill();
  }
  if (L.acc === 'ringlight') { c.strokeStyle = 'rgba(255,255,240,.9)'; c.lineWidth = 16; ell(c, cx + 110, cy - 70, 62, 62); c.stroke(); c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = 34; c.stroke(); }

  // body
  torso(c, sw);
  c.fillStyle = lg(c, cx - sw, 0, cx + sw, 0, [[0, mul(L.shirt, 1.18)], [0.45, mul(L.shirt, 1)], [1, mul(L.shirt, 0.55)]]); c.fill();
  c.save(); torso(c, sw); c.clip();
  c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 3;
  for (let i = 0; i < 4; i++) { const x = cx + R(-sw, sw), y = R(cy + 200, VH); c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 18, y + 30, x + 4, y + 60); c.stroke(); }
  if (L.acc === 'apron') { c.fillStyle = lg(c, cx - 120, 0, cx + 120, 0, [[0, '#4a6e56'], [0.5, '#2f4a3a'], [1, '#1b2c24']]); c.beginPath(); c.moveTo(cx - 105, cy + 205); c.lineTo(cx + 105, cy + 205); c.lineTo(cx + 135, VH); c.lineTo(cx - 135, VH); c.closePath(); c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke(); c.strokeStyle = '#2f4a3a'; c.lineWidth = 9; line(c, cx - 98, cy + 208, cx - 52, cy + 128); line(c, cx + 98, cy + 208, cx + 52, cy + 128); }
  if (L.acc === 'tie') { c.fillStyle = '#a8322a'; c.beginPath(); c.moveTo(cx - 10, cy + 132); c.lineTo(cx + 10, cy + 132); c.lineTo(cx + 18, cy + 300); c.lineTo(cx, cy + 330); c.lineTo(cx - 18, cy + 300); c.closePath(); c.fill(); c.strokeStyle = INK; c.lineWidth = 2.5; c.stroke(); c.strokeStyle = mul(L.shirt, 0.7); c.lineWidth = 4; line(c, cx - 70, cy + 130, cx - 26, cy + 290); line(c, cx + 70, cy + 130, cx + 26, cy + 290); }
  if (L.acc === 'tote') { c.strokeStyle = '#d8c8a0'; c.lineWidth = 10; line(c, cx + 60, cy + 120, cx - 120, VH); c.strokeStyle = INK; c.lineWidth = 1.5; line(c, cx + 64, cy + 116, cx - 115, VH); }
  if (L.acc === 'clipboard') { c.save(); c.translate(cx + 70, cy + 250); c.rotate(-0.12); c.fillStyle = '#b07a42'; c.fillRect(-48, -60, 96, 130); c.fillStyle = '#f4efe2'; c.fillRect(-40, -46, 80, 110); c.fillStyle = '#9a9488'; for (let i = 0; i < 6; i++) c.fillRect(-32, -34 + i * 14, R(40, 62), 3); c.fillStyle = '#8a8a90'; c.fillRect(-18, -66, 36, 12); c.strokeStyle = INK; c.lineWidth = 2.5; c.strokeRect(-48, -60, 96, 130); c.restore(); }
  if (L.acc === 'phone') { c.save(); c.translate(cx + 96, cy + 270); c.rotate(0.15); c.fillStyle = '#1a1a1c'; c.beginPath(); c.roundRect(-20, -36, 40, 72, 7); c.fill(); c.fillStyle = '#7fc4ff'; c.fillRect(-15, -29, 30, 56); c.strokeStyle = INK; c.lineWidth = 2.5; c.beginPath(); c.roundRect(-20, -36, 40, 72, 7); c.stroke(); c.restore(); }
  c.restore();
  torso(c, sw); c.strokeStyle = INK; c.lineWidth = 3; c.stroke();

  // neck + collar
  c.fillStyle = lg(c, cx - 45, 0, cx + 45, 0, [[0, SM], [1, SD]]); c.beginPath(); c.moveTo(cx - 38, cy + 66); c.lineTo(cx - 42, cy + 122); c.quadraticCurveTo(cx, cy + 142, cx + 42, cy + 122); c.lineTo(cx + 38, cy + 66); c.fill();
  c.fillStyle = 'rgba(40,20,10,.32)'; c.beginPath(); c.moveTo(cx - 38, cy + 88); c.quadraticCurveTo(cx, cy + 120, cx + 38, cy + 88); c.lineTo(cx + 38, cy + 76); c.lineTo(cx - 38, cy + 76); c.fill();
  c.strokeStyle = mul(L.shirt, 0.8); c.lineWidth = 8; c.beginPath(); c.moveTo(cx - 48, cy + 118); c.quadraticCurveTo(cx, cy + 150, cx + 48, cy + 118); c.stroke();
  c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
  if (L.acc === 'scarf') { c.fillStyle = lg(c, cx - 70, 0, cx + 70, 0, [[0, '#ff7ab8'], [1, '#b8306a']]); ell(c, cx, cy + 118, 66, 26); c.fill(); c.fillRect(cx + 20, cy + 118, 28, 110); c.strokeStyle = INK; c.lineWidth = 2.5; ell(c, cx, cy + 118, 66, 26); c.stroke(); c.strokeRect(cx + 20, cy + 130, 28, 98); }
  if (L.acc === 'bandana') { c.fillStyle = '#c8322a'; c.beginPath(); c.moveTo(cx - 52, cy + 100); c.quadraticCurveTo(cx, cy + 128, cx + 52, cy + 100); c.lineTo(cx, cy + 170); c.closePath(); c.fill(); c.strokeStyle = INK; c.lineWidth = 2.5; c.stroke(); c.fillStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i < 8; i++) { ell(c, cx + R(-34, 34), cy + R(108, 140), 2.5, 2.5); c.fill(); } }

  // ears
  const hairCovers = L.style === 'long' || L.style === 'braids' || L.style === 'afro';
  if (!hairCovers) [-1, 1].forEach((s) => { ell(c, cx + s * (f.w + 4), cy + 2, 12, 24, s * 0.1); c.fillStyle = s < 0 ? SM : SD; c.fill(); c.strokeStyle = INK; c.lineWidth = 2.5; c.stroke(); });

  // afro sits behind the face
  if (L.style === 'afro') {
    const afro = () => { c.beginPath(); for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2; c.moveTo(cx + Math.cos(a) * 112 + 26, cy - 40 + Math.sin(a) * 104); c.arc(cx + Math.cos(a) * 112, cy - 40 + Math.sin(a) * 104, 26, 0, Math.PI * 2); } c.ellipse(cx, cy - 40, 116, 108, 0, 0, Math.PI * 2); };
    c.fillStyle = mul(L.hair, 1); afro(); c.fill();
    stipple(c, afro, 2200, [mul(L.hair, 0.6), mul(L.hair, 1.6, 0.8), mul(L.hair, 2.4, 0.5)], 0.8, 2, [cx - 150, cy - 180, cx + 150, cy + 100]);
  }

  // face
  headPath(c, f); c.fillStyle = rg(c, cx - 36, cy - 50, 10, 190, [[0, SL], [0.45, SM], [1, SD]]); c.fill();
  c.save(); headPath(c, f); c.clip();
  c.fillStyle = lg(c, cx - 10, 0, cx + f.w + 6, 0, [[0, 'rgba(70,30,15,0)'], [0.6, 'rgba(70,30,15,.26)'], [1, 'rgba(70,30,15,.45)']]); c.fillRect(cx - 90, cy - 140, 200, 270);
  c.fillStyle = rg(c, cx - 30, cy - 80, 0, 44, [[0, 'rgba(255,240,215,.55)'], [1, 'rgba(255,240,215,0)']]); ell(c, cx - 30, cy - 80, 44, 26, -0.3); c.fill();
  [[-1, 0.26], [1, 0.16]].forEach(([s, a]) => { c.fillStyle = rg(c, cx + s * 38, cy + 28, 0, 28, [[0, `rgba(235,120,100,${a})`], [1, 'rgba(235,120,100,0)']]); ell(c, cx + s * 38, cy + 28, 28, 20); c.fill(); });
  if (L.style === 'bald') { c.fillStyle = rg(c, cx - 26, cy - 94, 0, 34, [[0, 'rgba(255,245,225,.7)'], [1, 'rgba(255,245,225,0)']]); ell(c, cx - 26, cy - 94, 34, 20, -0.3); c.fill(); }
  c.restore();

  // eyes, looking a little left toward the player
  const ex0 = fem ? 27 : 30;
  [-1, 1].forEach((s) => {
    const ex = cx + s * ex0, ey = cy - 6;
    c.fillStyle = rg(c, ex, ey, 2, 26, [[0, 'rgba(70,30,15,.32)'], [1, 'rgba(70,30,15,0)']]); ell(c, ex, ey, 26, 18); c.fill();
    c.save(); c.beginPath(); c.moveTo(ex - 15, ey + 1); c.quadraticCurveTo(ex, ey - 12, ex + 15, ey); c.quadraticCurveTo(ex, ey + 8, ex - 15, ey + 1); c.closePath();
    c.fillStyle = s < 0 ? '#f2e8da' : '#d8c8b6'; c.fill(); c.clip();
    c.fillStyle = '#3b2312'; ell(c, ex - 4, ey - 2, 7.5, 7.5); c.fill(); c.fillStyle = '#100805'; ell(c, ex - 4, ey - 2, 3.4, 3.4); c.fill();
    c.fillStyle = 'rgba(40,20,10,.4)'; c.fillRect(ex - 16, ey - 13, 32, 5);
    c.restore();
    c.fillStyle = '#fff'; ell(c, ex - 6, ey - 4, 1.7, 1.7); c.fill();
    c.strokeStyle = INK; c.lineWidth = fem ? 3.2 : 2.6; c.beginPath(); c.moveTo(ex - 17, ey + 1); c.quadraticCurveTo(ex, ey - 14, ex + 17, ey); c.stroke();
    if (fem) { c.lineWidth = 2; for (let i = 0; i < 3; i++) line(c, ex + s * (11 + i * 3), ey - 4 + i * 2, ex + s * (16 + i * 4), ey - 9 + i * 2); }
    c.strokeStyle = 'rgba(80,40,25,.5)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(ex - 13, ey + 6); c.quadraticCurveTo(ex, ey + 10, ex + 13, ey + 5); c.stroke();
    // brow
    const bc = L.style === 'bald' ? '#3a2a22' : mul(L.hair, 0.8);
    c.fillStyle = bc; c.beginPath(); const xi = cx + s * (ex0 - 16), xo = cx + s * (ex0 + 22);
    c.moveTo(xi, cy - 24); c.quadraticCurveTo(cx + s * (ex0 + 2), cy - (fem ? 42 : 38), xo, cy - 26); c.quadraticCurveTo(cx + s * (ex0 + 2), cy - (fem ? 36 : 30), xi, cy - (fem ? 19 : 17)); c.closePath(); c.fill();
  });
  if (L.acc === 'glasses') { [-1, 1].forEach((s) => { c.strokeStyle = '#2a1a12'; c.lineWidth = 5; ell(c, cx + s * 31, cy - 5, 22, 18); c.stroke(); c.fillStyle = 'rgba(200,230,255,.1)'; c.fill(); }); c.lineWidth = 4; line(c, cx - 9, cy - 8, cx + 9, cy - 8); }

  // nose
  c.fillStyle = 'rgba(80,38,20,.28)'; c.beginPath(); c.moveTo(cx + 5, cy - 8); c.bezierCurveTo(cx + 14, cy + 10, cx + 19, cy + 28, cx + 15, cy + 40); c.lineTo(cx + 5, cy + 40); c.bezierCurveTo(cx + 9, cy + 24, cx + 4, cy + 8, cx + 2, cy - 8); c.fill();
  c.strokeStyle = INK; c.lineWidth = 2.1;
  c.beginPath(); c.moveTo(cx - 15, cy + 36); c.quadraticCurveTo(cx - 21, cy + 46, cx - 10, cy + 47); c.stroke();
  c.beginPath(); c.moveTo(cx + 15, cy + 36); c.quadraticCurveTo(cx + 22, cy + 46, cx + 11, cy + 47); c.stroke();
  // mouth: an easy closed smile
  c.strokeStyle = '#3a1c10'; c.lineWidth = 2.8; c.beginPath(); c.moveTo(cx - 24, cy + 66); c.quadraticCurveTo(cx, cy + 78, cx + 26, cy + 64); c.stroke();
  c.fillStyle = fem ? 'rgba(190,90,90,.7)' : 'rgba(150,80,60,.55)'; c.beginPath(); c.moveTo(cx - 16, cy + 72); c.quadraticCurveTo(cx, cy + 86, cx + 18, cy + 71); c.quadraticCurveTo(cx, cy + 78, cx - 16, cy + 72); c.fill();
  c.strokeStyle = 'rgba(80,35,20,.4)'; c.lineWidth = 1.8; c.beginPath(); c.arc(cx - 26, cy + 62, 5, 1.6, 3.2); c.stroke(); c.beginPath(); c.arc(cx + 28, cy + 60, 5, -0.1, 1.5); c.stroke();
  headPath(c, f); c.strokeStyle = INK; c.lineWidth = 3.2; c.stroke();
  c.strokeStyle = 'rgba(255,215,160,.6)'; c.lineWidth = 2; c.beginPath(); c.moveTo(cx - f.w + 2, cy - 40); c.bezierCurveTo(cx - f.w - 2, cy + 10, cx - f.w + 4, cy + 50, cx - f.w * 0.7, cy + 76); c.stroke();

  // hair / hats on top
  const cap = (fill: string, h: number) => { c.beginPath(); c.moveTo(cx - f.w - 6, cy - 40); c.bezierCurveTo(cx - f.w - 10, cy - f.top - h, cx + f.w + 10, cy - f.top - h, cx + f.w + 6, cy - 40); c.bezierCurveTo(cx + f.w - 10, cy - 76, cx + 30, cy - 90, cx, cy - 88); c.bezierCurveTo(cx - 30, cy - 90, cx - f.w + 10, cy - 76, cx - f.w - 6, cy - 40); c.closePath(); c.fillStyle = fill; c.fill(); };
  const strands = (n: number) => { c.save(); c.clip(); c.lineCap = 'round'; for (let i = 0; i < n; i++) { const x = R(cx - f.w, cx + f.w), y = R(cy - f.top - 20, cy - 70); c.strokeStyle = pick([mul(L.hair, 1.5, 0.7), mul(L.hair, 0.6, 0.8), mul(L.hair, 2.2, 0.35)]); c.lineWidth = R(1.5, 3); c.beginPath(); c.moveTo(x, y + 18); c.quadraticCurveTo(x + 10, y - 8, x + R(18, 36), y - R(10, 22)); c.stroke(); } c.restore(); };
  switch (L.style) {
    case 'short': case 'curly': cap(mul(L.hair, 1), 44); strands(46); cap('rgba(0,0,0,0)', 44); c.strokeStyle = INK; c.lineWidth = 3; c.stroke(); if (L.style === 'curly') { c.fillStyle = mul(L.hair, 1); for (let i = 0; i < 9; i++) { ell(c, cx - f.w + 8 + i * (f.w * 2 - 16) / 8, cy - f.top - 6 + R(-6, 6), 15, 14); c.fill(); } } break;
    case 'long': case 'braids': {
      cap(mul(L.hair, 1), 24); strands(30);
      if (L.style === 'long') [-1, 1].forEach((s) => { c.fillStyle = mul(L.hair, 0.9); c.beginPath(); c.moveTo(cx + s * (f.w + 6), cy - 40); c.bezierCurveTo(cx + s * (f.w + 2), cy + 60, cx + s * 96, cy + 140, cx + s * 110, cy + 240); c.lineTo(cx + s * 150, cy + 230); c.bezierCurveTo(cx + s * 150, cy + 120, cx + s * 120, cy + 20, cx + s * (f.w + 24), cy - 50); c.closePath(); c.fill(); c.strokeStyle = INK; c.lineWidth = 2.5; c.stroke(); });
      else [-1, 1].forEach((s) => { for (let i = 0; i < 8; i++) { c.fillStyle = mul(L.hair, i % 2 ? 0.8 : 1.1); ell(c, cx + s * (f.w + 12), cy - 10 + i * 30, 14, 17); c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke(); } });
      break;
    }
    case 'bun': cap(mul(L.hair, 1), 22); strands(26); c.fillStyle = mul(L.hair, 1); ell(c, cx - 6, cy - f.top - 34, 34, 28); c.fill(); stipple(c, () => ell(c, cx - 6, cy - f.top - 34, 34, 28), 400, [mul(L.hair, 0.7), mul(L.hair, 1.3)], 0.8, 1.6, [cx - 40, cy - f.top - 62, cx + 28, cy - f.top - 6]); c.strokeStyle = INK; c.lineWidth = 3; c.stroke(); break;
    case 'mohawk': { c.fillStyle = mul(L.hair, 1); c.beginPath(); c.moveTo(cx - 20, cy - 80); c.bezierCurveTo(cx - 30, cy - 170, cx + 30, cy - 190, cx + 24, cy - 80); c.closePath(); c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke(); c.strokeStyle = mul(L.hair, 1.6, 0.7); c.lineWidth = 3; for (let i = 0; i < 7; i++) line(c, cx - 14 + i * 5, cy - 84, cx - 18 + i * 7, cy - 160 + Math.abs(i - 3) * 8); break; }
    case 'beanie': case 'cap': {
      const hc = L.hatColor ?? (L.style === 'beanie' ? '#e0702d' : '#2b3a6b');
      c.beginPath(); c.moveTo(cx - f.w - 10, cy - 50); c.bezierCurveTo(cx - f.w - 12, cy - f.top - 50, cx + f.w + 12, cy - f.top - 50, cx + f.w + 10, cy - 50); c.closePath();
      c.fillStyle = lg(c, cx - f.w, cy - 160, cx + f.w, cy - 50, [[0, mul(hc, 1.3)], [1, mul(hc, 0.7)]]); c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
      if (L.style === 'beanie') { c.strokeStyle = mul(hc, 0.6, 0.7); c.lineWidth = 2; for (let i = 0; i < 12; i++) { const x = cx - f.w + 6 + i * (f.w * 2 - 12) / 11; line(c, x, cy - 52, x + 2, cy - f.top - 10); } c.fillStyle = mul(hc, 0.85); c.beginPath(); c.roundRect(cx - f.w - 12, cy - 66, f.w * 2 + 24, 24, 8); c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke(); }
      else { c.fillStyle = mul(hc, 0.85); c.beginPath(); c.ellipse(cx - 40, cy - 52, 80, 14, -0.08, 0, Math.PI * 2); c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke(); }
      break;
    }
  }
  if (L.acc === 'beret') { c.fillStyle = L.hatColor ?? '#1c1a18'; ell(c, cx + 14, cy - f.top - 8, 80, 26, -0.15); c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke(); }
  if (L.acc === 'headphones') { c.strokeStyle = '#1c1a18'; c.lineWidth = 12; c.beginPath(); c.arc(cx, cy - 20, f.w + 14, Math.PI * 1.05, Math.PI * 1.95); c.stroke(); [-1, 1].forEach((s) => { c.fillStyle = '#e8509a'; ell(c, cx + s * (f.w + 12), cy, 16, 26); c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke(); }); }

  // golden grade, light shaft, film grain
  c.save(); c.globalCompositeOperation = 'soft-light'; c.fillStyle = lg(c, 0, 0, VW, VH, [[0, '#ffb066'], [0.55, '#ff7a59'], [1, '#5a2a8a']]); c.globalAlpha = 0.5; c.fillRect(0, 0, VW, VH); c.restore();
  c.save(); c.globalCompositeOperation = 'screen'; c.fillStyle = lg(c, 0, 0, 300, 400, [[0, 'rgba(255,190,120,.25)'], [1, 'rgba(255,190,120,0)']]); c.beginPath(); c.moveTo(0, 0); c.lineTo(140, 0); c.lineTo(400, 420); c.lineTo(260, 500); c.closePath(); c.fill(); c.restore();
  const v = c.createRadialGradient(VW / 2, VH * 0.45, VH * 0.3, VW / 2, VH / 2, VW * 0.8); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(10,0,15,.55)'); c.fillStyle = v; c.fillRect(0, 0, VW, VH);
  c.restore();
}

export function makeBust(scene: Phaser.Scene, key: string, look: Look) {
  const k = `${key}-bust`;
  if (scene.textures.exists(k)) return;
  const tex = scene.textures.createCanvas(k, BUST_W, BUST_H)!;
  drawBust(tex.getContext(), look, key);
  tex.refresh();
}
