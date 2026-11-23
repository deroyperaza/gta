import Phaser from 'phaser';
import { bus } from '../core/bus';
import { state } from '../core/state';
import { ADA_STATS, LINES, STATIONS, type Station } from '../world/transitData';
import { BLOCK_H, BLOCK_W, GAP_CIRCLE, T, TILE, WALKABLE, geo, neighborhoodAt, type WorldLayout } from '../world/layout';

/**
 * Getting around Brooklyn the way Brooklyn does.
 *  - Subway: every Brooklyn station from the MTA's own list, at its real spot. Walk to the entrance, pick a stop,
 *    the route planner finds the fewest stops (one transfer costs about three). Only 35 of 156 are fully accessible.
 *  - Buses: real routes (B41 Flatbush, B44 Nostrand, B46 Utica, B35 Church, B82 Kings Hwy). Wait at the sign; ride; request a stop.
 *  - Dollar vans: Flatbush only. Hail one anywhere on the avenue, $2 cash, hop off anywhere. Most aren't licensed,
 *    so at three stars the TLC may pull it over.
 *  - Ride apps and the car service: from anywhere (R). They cost Solidarity: your comrades saw that.
 * Sources for the facts in here: docs/FACTS-transit-food-mediation.md
 */

export const LINE_COLORS: Record<string, string> = {
  A: '#0039A6', C: '#0039A6', E: '#0039A6', B: '#FF6319', D: '#FF6319', F: '#FF6319', M: '#FF6319', G: '#6CBE45',
  J: '#996633', Z: '#996633', L: '#A7A9AC', N: '#FCCC0A', Q: '#FCCC0A', R: '#FCCC0A', W: '#FCCC0A',
  1: '#EE352E', 2: '#EE352E', 3: '#EE352E', 4: '#00933C', 5: '#00933C', 6: '#00933C', S: '#808183',
};
export const bullet = (r: string) => `<i class="bullet" style="background:${LINE_COLORS[r] ?? '#888'};color:${'NQRW'.includes(r) ? '#111' : '#fff'}">${r}</i>`;

export interface Placed { st: Station; x: number; y: number }
interface Path { pts: { x: number; y: number }[]; cum: number[]; len: number }
interface Stop { s: number; x: number; y: number; px: number; py: number; name: string }
interface BusRoute { id: string; to: [string, string]; path: Path; stops: Stop[]; color: string }
interface Bus { route: BusRoute; sprite: Phaser.GameObjects.Image; s: number; dir: 1 | -1; dwell: number; next: number }
interface Car { sprite: Phaser.GameObjects.Image; path: Path; s: number; speed: number; onArrive: () => void; arrived: boolean }
type Riding =
  | { kind: 'bus'; bus: Bus; request: boolean }
  | { kind: 'van'; car: Car; checkpoint: number }
  | { kind: 'car'; car: Car; service: string };

const ROADS = new Set<number>([T.ASPHALT, T.LANE_V, T.LANE_H, T.INTERSECTION, T.CROSS_V, T.CROSS_H]);
const BUS_SPEED = 190, VAN_SPEED = 360, CAR_SPEED = 380;

/** Bus routes on real avenues (lat, lng). The B41 follows Flatbush itself. */
const BUS_DEFS: { id: string; to: [string, string]; color: string; pts: [number, number][] }[] = [
  { id: 'B44', to: ['Williamsburg', 'Sheepshead Bay'], color: '#c8102e', pts: [[40.6995, -73.9516], [40.6803, -73.9502], [40.6630, -73.9506], [40.6505, -73.9496], [40.6325, -73.9474], [40.6007, -73.9418], [40.5860, -73.9395]] },
  { id: 'B46', to: ['Bed-Stuy', 'Kings Plaza'], color: '#c8102e', pts: [[40.6900, -73.9340], [40.6795, -73.9298], [40.6687, -73.9311], [40.6520, -73.9300], [40.6300, -73.9290], [40.6150, -73.9270], [40.6095, -73.9210]] },
  { id: 'B35', to: ['Sunset Park', 'Brownsville'], color: '#0b5394', pts: [[40.6450, -73.9930], [40.6441, -73.9795], [40.6505, -73.9627], [40.6508, -73.9493], [40.6520, -73.9300], [40.6560, -73.9070]] },
  { id: 'B82', to: ['Bensonhurst', 'Starrett City'], color: '#0b5394', pts: [[40.6036, -73.9804], [40.6031, -73.9726], [40.6087, -73.9577], [40.6160, -73.9449], [40.6300, -73.9230], [40.6340, -73.9150], [40.6390, -73.9030], [40.6480, -73.8830]] },
];

/** Ride apps. Names are parodies; any resemblance is the point. */
export const SERVICES = [
  { id: 'surge', name: 'Surge', tag: 'Everyone\'s private driver. Price: whatever we feel like.', base: 26, wait: 4 },
  { id: 'shlep', name: 'Shlep', tag: 'The pink-ish one. We\'ll get you there. Eventually. With a shortcut.', base: 20, wait: 6 },
  { id: 'everready', name: 'Ever-Ready Car Service', tag: '718 · Since 1987 · Cash only · "Ten minutes." (It\'s never ten minutes.) The dispatcher knows your mother.', base: 10, wait: 14 },
] as const;

function mkPath(pts: { x: number; y: number }[]): Path {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  return { pts, cum, len: cum[cum.length - 1] };
}
function at(p: Path, s: number) {
  s = Math.max(0, Math.min(p.len, s));
  let i = 1; while (i < p.cum.length - 1 && p.cum[i] < s) i++;
  const a = p.pts[i - 1], b = p.pts[i], seg = p.cum[i] - p.cum[i - 1] || 1, k = (s - p.cum[i - 1]) / seg;
  return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, ang: Math.atan2(b.y - a.y, b.x - a.x) };
}
/** Closest point on a path: arc length and distance */
function project(p: Path, x: number, y: number) {
  let best = { s: 0, d: Infinity };
  for (let i = 1; i < p.pts.length; i++) {
    const a = p.pts[i - 1], b = p.pts[i], dx = b.x - a.x, dy = b.y - a.y, l2 = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / l2));
    const d = Math.hypot(a.x + dx * t - x, a.y + dy * t - y);
    if (d < best.d) best = { s: p.cum[i - 1] + t * Math.sqrt(l2), d };
  }
  return best;
}

export class Transit {
  stations: Placed[] = [];
  /** Each station's sign: its name plate plus the row of route bullets above it. Name tags keep clear of these. */
  signRects: Phaser.Geom.Rectangle[] = [];
  byId: Record<string, Placed> = {};
  routes: BusRoute[] = [];
  buses: Bus[] = [];
  /** Cars on the road (from traffic.ts), so buses never drive through them */
  cars: () => { x: number; y: number }[] = () => [];
  flatbush!: Path;
  riding: Riding | null = null;
  waiting: { route: BusRoute; stop: Stop } | null = null;
  private pending: Car | null = null; // a ride-app car or van on its way to pick you up
  private W: number; private H: number;
  private cost!: Int32Array; private seen = 0;

  constructor(private scene: Phaser.Scene, private layout: WorldLayout) {
    this.W = layout.tiles[0].length; this.H = layout.tiles.length;
    this.makeArt();
    this.placeStations();
    this.buildFlatbush();
    this.buildBuses();
  }

  // ------------------------------------------------------------------ ART
  private canvas(key: string, w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) {
    if (this.scene.textures.exists(key)) return;
    const t = this.scene.textures.createCanvas(key, w, h)!; draw(t.getContext()); t.refresh();
  }
  private makeArt() {
    // Subway entrance from above: a stairwell in the sidewalk, rails, and the two green globes
    this.canvas('subway-entrance', 44, 60, (c) => {
      c.fillStyle = '#2a2620'; c.fillRect(8, 6, 28, 48);
      for (let i = 0; i < 9; i++) { c.fillStyle = i % 2 ? '#4a443a' : '#5a5346'; c.fillRect(10, 8 + i * 5, 24, 4); }
      c.fillStyle = '#121010'; c.fillRect(10, 44, 24, 8);
      c.strokeStyle = '#1d3a24'; c.lineWidth = 3; c.strokeRect(7, 5, 30, 50);
      for (const x of [6, 38]) { c.fillStyle = '#0f2a17'; c.beginPath(); c.arc(x, 6, 5.5, 0, Math.PI * 2); c.fill(); const g = c.createRadialGradient(x - 1, 5, 1, x, 6, 5); g.addColorStop(0, '#d9ffd2'); g.addColorStop(1, '#2fa84f'); c.fillStyle = g; c.beginPath(); c.arc(x, 6, 4.2, 0, Math.PI * 2); c.fill(); }
    });
    // Bus stop sign: a pole with the blue-and-red disc, seen from above
    this.canvas('bus-stop', 26, 26, (c) => {
      c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.arc(15, 15, 10, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#1b4fa0'; c.beginPath(); c.arc(13, 13, 10, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#e8eef8'; c.beginPath(); c.arc(13, 13, 6.5, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#c8102e'; c.font = '900 8px Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('BUS', 13, 13.5);
    });
    // A city bus (long, blue stripe, roof units) — pointing up; rotated as it drives
    const busArt = (key: string, stripe: string) => this.canvas(key, 40, 120, (c) => {
      c.fillStyle = 'rgba(8,5,14,.45)'; c.fillRect(6, 8, 32, 110);
      c.fillStyle = '#eef0ee'; c.beginPath(); c.roundRect(4, 2, 32, 114, 7); c.fill();
      c.fillStyle = stripe; c.fillRect(4, 20, 3, 80); c.fillRect(33, 20, 3, 80);
      c.fillStyle = '#9aa3a6'; c.fillRect(10, 30, 20, 12); c.fillRect(10, 70, 20, 10);
      c.fillStyle = '#1c2a33'; c.fillRect(7, 4, 26, 7);
      c.fillStyle = '#d7dcdc'; for (let y = 16; y < 110; y += 9) c.fillRect(9, y, 22, 1);
    });
    busArt('bus-local', '#1b4fa0'); busArt('bus-sbs', '#2b7fd4');
    // Dollar van: a beat-up white passenger van, a cardboard sign in the window
    this.canvas('dollar-van', 36, 84, (c) => {
      c.fillStyle = 'rgba(8,5,14,.45)'; c.fillRect(5, 7, 28, 76);
      c.fillStyle = '#e9e6df'; c.beginPath(); c.roundRect(3, 2, 30, 78, 8); c.fill();
      c.fillStyle = '#1c2a33'; c.fillRect(6, 5, 24, 10);
      c.fillStyle = '#c9c4b8'; c.fillRect(6, 22, 24, 52);
      c.fillStyle = '#b5893f'; c.fillRect(11, 40, 14, 9); c.fillStyle = '#222'; c.font = '900 7px Arial'; c.textAlign = 'center'; c.fillText('$2', 18, 47);
      c.fillStyle = 'rgba(120,80,40,.35)'; c.fillRect(24, 60, 6, 12);
    });
    // Ride-app car: black sedan with a glowing sign; car service: an old Lincoln
    this.canvas('ride-car', 34, 66, (c) => {
      c.fillStyle = 'rgba(8,5,14,.45)'; c.fillRect(5, 6, 26, 58);
      c.fillStyle = '#17181b'; c.beginPath(); c.roundRect(3, 2, 28, 62, 9); c.fill();
      c.fillStyle = '#2b3138'; c.fillRect(7, 14, 20, 14); c.fillRect(7, 42, 20, 10);
      c.fillStyle = '#ff3d7f'; c.beginPath(); c.roundRect(11, 31, 12, 6, 2); c.fill();
    });
    this.canvas('car-service', 34, 70, (c) => {
      c.fillStyle = 'rgba(8,5,14,.45)'; c.fillRect(5, 6, 26, 62);
      c.fillStyle = '#5a5f66'; c.beginPath(); c.roundRect(3, 2, 28, 66, 6); c.fill();
      c.fillStyle = '#30343a'; c.fillRect(7, 15, 20, 14); c.fillRect(7, 45, 20, 10);
      c.fillStyle = '#c9b46a'; c.fillRect(13, 33, 8, 4);
    });
  }

  // ------------------------------------------------------------------ STATIONS
  private open(tx: number, ty: number) {
    return tx >= 0 && ty >= 0 && tx < this.W && ty < this.H && WALKABLE.has(this.layout.tiles[ty][tx]) && !this.layout.blocked[ty][tx];
  }
  private isRoad(tx: number, ty: number) { return tx >= 0 && ty >= 0 && tx < this.W && ty < this.H && ROADS.has(this.layout.tiles[ty][tx]); }
  /** Nearest open sidewalk tile (pixel center) to a point; prefers one touching a street */
  nearestSidewalk(x: number, y: number, maxR = 14) {
    const cx = Math.floor(x / TILE), cy = Math.floor(y / TILE);
    let best: { x: number; y: number } | null = null, bd = Infinity;
    for (let dy = -maxR; dy <= maxR; dy++) for (let dx = -maxR; dx <= maxR; dx++) {
      const tx = cx + dx, ty = cy + dy;
      if (!this.open(tx, ty)) continue; // any open ground; sidewalks on a street corner win (Coney Island is all boardwalk and sand)
      const street = this.isRoad(tx + 1, ty) || this.isRoad(tx - 1, ty) || this.isRoad(tx, ty + 1) || this.isRoad(tx, ty - 1);
      const d = Math.hypot(dx, dy) + (street ? 0 : 3) + (this.layout.tiles[ty][tx] === T.SIDEWALK ? 0 : 5);
      if (d < bd) { bd = d; best = { x: (tx + 0.5) * TILE, y: (ty + 0.5) * TILE }; }
    }
    return best;
  }
  private nearestRoad(x: number, y: number, maxR = 20) {
    const cx = Math.floor(x / TILE), cy = Math.floor(y / TILE);
    for (let r = 0; r <= maxR; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
      if (this.isRoad(cx + dx, cy + dy)) return { tx: cx + dx, ty: cy + dy };
    }
    return null;
  }

  private placeStations() {
    const taken: { x: number; y: number }[] = [];
    for (const st of STATIONS) {
      const g = geo(st.lat, st.lng);
      let p = this.nearestSidewalk(g.x * TILE, g.y * TILE);
      if (!p) continue;
      // Two complexes on the same corner: nudge the second along the sidewalk
      if (taken.some((t) => Math.hypot(t.x - p!.x, t.y - p!.y) < 70)) p = this.nearestSidewalk(p.x + 96, p.y + 64) ?? p;
      taken.push(p);
      const placed = { st, x: p.x, y: p.y };
      this.stations.push(placed); this.byId[st.id] = placed;
      this.scene.add.image(p.x, p.y, 'subway-entrance').setDepth(p.y - 30);
      const label = this.scene.add.text(p.x, p.y - 40, st.name, { fontFamily: 'Nunito, Arial, sans-serif', fontSize: '16px', fontStyle: '900', color: '#ffffff', backgroundColor: '#1d1d1f', padding: { x: 6, y: 3 } }).setOrigin(0.5, 1).setDepth(p.y + 40);
      // Route bullets are small baked circles (one texture per line), not a Graphics per station: ~190 Graphics cost real frame time on phones
      { const lb = label.getBounds(), bw = st.routes.length * 23, top = p.y - 40 - label.height - 24; this.signRects.push(new Phaser.Geom.Rectangle(Math.min(lb.x, p.x - bw / 2), top, Math.max(lb.width, bw), lb.bottom - top)); }
      st.routes.forEach((r, i) => {
        const bx = p!.x - (st.routes.length - 1) * 11.5 + i * 23, by = p!.y - 40 - label.height - 13, key = `bullet-${r}`;
        if (!this.scene.textures.exists(key)) {
          const g2 = this.scene.make.graphics({}, false);
          g2.fillStyle(Phaser.Display.Color.HexStringToColor(LINE_COLORS[r] ?? '#888').color).fillCircle(11, 11, 10).generateTexture(key, 22, 22);
          g2.destroy();
        }
        this.scene.add.image(bx, by, key).setDepth(p!.y + 41);
      });
      st.routes.forEach((r, i) => {
        const bx = p!.x - (st.routes.length - 1) * 11.5 + i * 23, by = p!.y - 40 - label.height - 13;
        this.scene.add.text(bx, by, r, { fontFamily: 'Arial', fontSize: '13px', fontStyle: '900', color: 'NQRW'.includes(r) ? '#111' : '#fff' }).setOrigin(0.5).setDepth(p!.y + 42);
      });
    }
  }

  /** Fewest stops; a transfer costs about three. */
  plan(fromId: string, toId: string) {
    const key = (sid: string, r: string) => `${sid}|${r}`;
    const dist = new Map<string, number>(), prev = new Map<string, string>(), q: [number, string][] = [];
    for (const r of this.byId[fromId]?.st.routes ?? []) { dist.set(key(fromId, r), 0); q.push([0, key(fromId, r)]); }
    const adj = (k: string): [string, number][] => {
      const [sid, r] = k.split('|'), out: [string, number][] = [];
      const line = LINES[r] ?? [], i = line.indexOf(sid);
      if (i > 0) out.push([key(line[i - 1], r), 1]);
      if (i >= 0 && i < line.length - 1) out.push([key(line[i + 1], r), 1]);
      for (const r2 of this.byId[sid]?.st.routes ?? []) if (r2 !== r) out.push([key(sid, r2), 3]);
      return out;
    };
    let end: string | null = null;
    while (q.length) {
      q.sort((a, b) => a[0] - b[0]);
      const [d, k] = q.shift()!;
      if (d > (dist.get(k) ?? Infinity)) continue;
      if (k.startsWith(toId + '|')) { end = k; break; }
      for (const [n, w] of adj(k)) if (d + w < (dist.get(n) ?? Infinity)) { dist.set(n, d + w); prev.set(n, k); q.push([d + w, n]); }
    }
    if (!end) return null;
    const chain: string[] = []; for (let k: string | undefined = end; k; k = prev.get(k)) chain.unshift(k);
    const legs: { route: string; stops: string[] }[] = [];
    for (const k of chain) {
      const [sid, r] = k.split('|');
      const last = legs[legs.length - 1];
      if (!last || last.route !== r) legs.push({ route: r, stops: [sid] }); else last.stops.push(sid);
    }
    const clean = legs.filter((l) => l.stops.length > 1);
    return { legs: clean, stops: clean.reduce((n, l) => n + l.stops.length - 1, 0), transfers: Math.max(0, clean.length - 1) };
  }

  nearestStation(x: number, y: number) {
    let best: Placed | null = null, bd = Infinity;
    for (const p of this.stations) { const d = Math.hypot(p.x - x, p.y - y); if (d < bd) { bd = d; best = p; } }
    return best ? { p: best, d: bd } : null;
  }

  /** How many fully accessible stations, from the MTA data */
  static adaLine() { return `Only ${ADA_STATS.full} of Brooklyn's ${ADA_STATS.total} subway stations are fully accessible (MTA data).`; }

  // ------------------------------------------------------------------ ROUTING ON STREETS
  /**
   * Street route between two road tiles: fewest tiles, but turning costs extra so cars drive straight
   * down avenues instead of zigzagging. (Dial's algorithm over tile x heading.)
   */
  route(from: { tx: number; ty: number }, to: { tx: number; ty: number }): { x: number; y: number }[] | null {
    const W = this.W, N = W * this.H * 4, TURN = 6;
    if (!this.cost || this.cost.length !== N) this.cost = new Int32Array(N);
    this.cost.fill(0x3fffffff);
    const prev = new Int32Array(N).fill(-1);
    const DX = [1, 0, -1, 0], DY = [0, 1, 0, -1];
    const buckets: number[][] = [];
    const push = (c: number, s: number) => { (buckets[c] ??= []).push(s); };
    const start = from.ty * W + from.tx;
    for (let d = 0; d < 4; d++) { this.cost[start * 4 + d] = 0; push(0, start * 4 + d); }
    let goal = -1;
    for (let c = 0; c < buckets.length && goal < 0; c++) {
      const b = buckets[c]; if (!b) continue;
      for (let bi = 0; bi < b.length; bi++) {
        const s = b[bi]; if (this.cost[s] !== c) continue;
        const t = s >> 2, d = s & 3, x = t % W, y = (t / W) | 0;
        if (x === to.tx && y === to.ty) { goal = s; break; }
        for (let nd = 0; nd < 4; nd++) {
          if (nd === ((d + 2) & 3)) continue;
          const nx = x + DX[nd], ny = y + DY[nd];
          if (!this.isRoad(nx, ny)) continue;
          const ns = (ny * W + nx) * 4 + nd, nc = c + 1 + (nd === d ? 0 : TURN);
          if (nc < this.cost[ns]) { this.cost[ns] = nc; prev[ns] = s; push(nc, ns); }
        }
      }
      buckets[c] = undefined as any;
      if (c > 6000) break;
    }
    if (goal < 0) return null;
    const tiles: number[] = []; for (let s = goal; s >= 0; s = prev[s]) tiles.unshift(s >> 2);
    // Keep only the corners
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i < tiles.length; i++) {
      const x = tiles[i] % W, y = (tiles[i] / W) | 0;
      if (i > 0 && i < tiles.length - 1) {
        const ax = tiles[i - 1] % W, ay = (tiles[i - 1] / W) | 0, bx = tiles[i + 1] % W, by = (tiles[i + 1] / W) | 0;
        if (x - ax === bx - x && y - ay === by - y) continue;
      }
      pts.push({ x: (x + 0.5) * TILE, y: (y + 0.5) * TILE });
    }
    return pts;
  }

  private routeThrough(latlngs: [number, number][]) {
    const out: { x: number; y: number }[] = [];
    let prev: { tx: number; ty: number } | null = null;
    for (const [la, ln] of latlngs) {
      const g = geo(la, ln), r = this.nearestRoad(g.x * TILE, g.y * TILE);
      if (!r) continue;
      if (prev) { const seg = this.route(prev, r); if (seg) out.push(...(out.length ? seg.slice(1) : seg)); }
      prev = r;
    }
    return out;
  }

  // ------------------------------------------------------------------ FLATBUSH (B41 + dollar vans)
  private buildFlatbush() {
    const fb = this.layout.avenues.filter((a) => a.name === 'Flatbush Ave');
    const pts: { x: number; y: number }[] = [];
    const cx = GAP_CIRCLE.x * TILE, cy = GAP_CIRCLE.y * TILE, rx = (GAP_CIRCLE.ax + GAP_CIRCLE.w / 2) * TILE, ry = (GAP_CIRCLE.ay + GAP_CIRCLE.w / 2) * TILE;
    for (const a of fb) for (const p of a.pts) {
      if (Math.hypot(p.x - cx, p.y - cy) < 4) { // around Grand Army Plaza's east side, not through the arch
        if (!pts.some((q) => q.x === cx && q.y === cy - ry)) pts.push({ x: cx, y: cy - ry }, { x: cx + rx * 0.72, y: cy - ry * 0.7 }, { x: cx + rx, y: cy }, { x: cx + rx * 0.72, y: cy + ry * 0.7 }, { x: cx, y: cy + ry });
        continue;
      }
      const l = pts[pts.length - 1];
      if (!l || Math.hypot(l.x - p.x, l.y - p.y) > 4) pts.push({ ...p });
    }
    // Start at DeKalb (skip the bridge), end at Kings Plaza (the B41's last stop)
    const kp = geo(40.6095, -73.9210), kpx = kp.x * TILE, kpy = kp.y * TILE;
    let cut = pts.findIndex((p) => Math.hypot(p.x - kpx, p.y - kpy) < 8);
    if (cut < 0) cut = pts.length - 1;
    this.flatbush = mkPath(pts.slice(1, cut + 1));
  }

  // ------------------------------------------------------------------ BUSES
  private stopsAlong(path: Path, every = 720): Stop[] {
    const stops: Stop[] = [];
    for (let s = 60; s < path.len - 30; s += every) stops.push(this.makeStop(path, s));
    stops.push(this.makeStop(path, path.len - 10));
    return stops;
  }
  private makeStop(path: Path, s: number): Stop {
    const p = at(path, s), side = this.nearestSidewalk(p.x, p.y, 5) ?? { x: p.x + 40, y: p.y };
    const st = this.nearestStation(p.x, p.y);
    const hood = neighborhoodAt(p.x, p.y) ?? 'Brooklyn';
    return { s, x: p.x, y: p.y, px: side.x, py: side.y, name: st && st.d < 260 ? `${hood} · ${st.p.st.name}` : hood };
  }

  private buildBuses() {
    const defs: { id: string; to: [string, string]; color: string; path: Path }[] = [
      { id: 'B41', to: ['Downtown Brooklyn', 'Kings Plaza'], color: '#c8102e', path: this.flatbush },
      ...BUS_DEFS.map((d) => ({ id: d.id, to: d.to, color: d.color, path: mkPath(this.routeThrough(d.pts)) })),
    ];
    for (const d of defs) {
      if (d.path.len < 200) continue;
      const route: BusRoute = { id: d.id, to: d.to, path: d.path, stops: this.stopsAlong(d.path), color: d.color };
      this.routes.push(route);
      for (const s of route.stops) {
        this.scene.add.image(s.px, s.py, 'bus-stop').setDepth(s.py + 2);
        this.scene.add.text(s.px, s.py - 16, d.id, { fontFamily: 'Nunito, Arial, sans-serif', fontSize: '11px', fontStyle: '900', color: '#fff', backgroundColor: '#1b4fa0', padding: { x: 3, y: 1 } }).setOrigin(0.5, 1).setDepth(s.py + 3);
      }
      const n = Math.max(2, Math.round(d.path.len / 4200));
      for (let i = 0; i < n; i++) {
        const s0 = (d.path.len * (i + 0.5)) / n;
        const sprite = this.scene.add.image(0, 0, d.id === 'B44' || d.id === 'B46' ? 'bus-sbs' : 'bus-local');
        const b: Bus = { route, sprite, s: s0, dir: i % 2 ? -1 : 1, dwell: 0, next: 0 };
        b.next = this.nextStopIndex(b);
        this.buses.push(b);
      }
    }
  }
  private nextStopIndex(b: Bus) {
    const st = b.route.stops;
    if (b.dir > 0) { const i = st.findIndex((s) => s.s > b.s + 1); return i < 0 ? st.length - 1 : i; }
    for (let i = st.length - 1; i >= 0; i--) if (st[i].s < b.s - 1) return i;
    return 0;
  }

  /** Bus stops and station entrances near the player */
  stationNear(x: number, y: number, r = 64) { return this.stations.find((p) => Math.hypot(p.x - x, p.y - y) < r) ?? null; }
  stopNear(x: number, y: number, r = 56) {
    for (const route of this.routes) for (const stop of route.stops) if (Math.hypot(stop.px - x, stop.py - y) < r) return { route, stop };
    return null;
  }
  /** On Flatbush (for hailing a dollar van) */
  onFlatbush(x: number, y: number) { const p = project(this.flatbush, x, y); return p.d < 130 ? p.s : null; }

  wait(route: BusRoute, stop: Stop) {
    this.waiting = { route, stop };
    const soon = this.buses.filter((b) => b.route === route).map((b) => Math.abs(b.s - stop.s) / BUS_SPEED).sort((a, b) => a - b)[0] ?? 60;
    bus.emit('ui:toast', soon > 45 ? `WAITING FOR THE ${route.id}. THE APP SAYS 2 MIN. THE APP IS LYING.` : `WAITING FOR THE ${route.id} · STAY BY THE SIGN`);
  }

  // ------------------------------------------------------------------ DOLLAR VANS + RIDE APPS
  private spawnCar(key: string, path: Path, s0: number, speed: number, onArrive: () => void): Car {
    const p = at(path, s0);
    const sprite = this.scene.add.image(p.x, p.y, key).setDepth(p.y + 60);
    return { sprite, path, s: s0, speed, onArrive, arrived: false };
  }

  hailVan(x: number, y: number, dir: 1 | -1) {
    const s = this.onFlatbush(x, y); if (s == null) return;
    const start = Math.max(0, Math.min(this.flatbush.len, s - dir * 900));
    // The van drives this stretch of Flatbush toward you, then keeps going your way
    const fwd = dir > 0 ? this.flatbush : mkPath([...this.flatbush.pts].reverse());
    const sIn = dir > 0 ? start : this.flatbush.len - start, sPick = dir > 0 ? s : this.flatbush.len - s;
    const van = this.spawnCar('dollar-van', fwd, sIn, VAN_SPEED, () => {});
    this.pending = van;
    van.onArrive = () => {};
    (van as any).pickAt = sPick;
    bus.emit('ui:toast', Phaser.Utils.Array.GetRandom(['A DOLLAR VAN HONKS TWICE. THAT MEANS YES.', 'A WHITE VAN SLOWS DOWN. THE DRIVER POINTS AT YOU.']));
  }

  callRide(serviceId: string, from: { x: number; y: number }, dest: { x: number; y: number; name: string }) {
    const svc = SERVICES.find((s) => s.id === serviceId)!;
    const pick = this.nearestRoad(from.x, from.y), drop = this.nearestRoad(dest.x, dest.y);
    if (!pick || !drop) { bus.emit('ui:toast', 'NO DRIVERS NEARBY. (THERE ARE NEVER DRIVERS NEARBY.)'); return; }
    // The driver starts a few blocks away
    const a = Math.random() * Math.PI * 2, far = this.nearestRoad(from.x + Math.cos(a) * 900, from.y + Math.sin(a) * 900) ?? pick;
    const toYou = this.route(far, pick) ?? [{ x: (pick.tx + 0.5) * TILE, y: (pick.ty + 0.5) * TILE }];
    let trip: { x: number; y: number }[] | null;
    if (svc.id === 'shlep') { // the shortcut
      const mid = this.nearestRoad((from.x + dest.x) / 2 + Phaser.Math.Between(-900, 900), (from.y + dest.y) / 2 + Phaser.Math.Between(-900, 900)) ?? drop;
      trip = [...(this.route(pick, mid) ?? []), ...(this.route(mid, drop) ?? []).slice(1)];
    } else trip = this.route(pick, drop);
    if (!trip || trip.length < 2) { bus.emit('ui:toast', 'THE DRIVER CANCELED. (THEY SAW WHERE YOU\'RE GOING.)'); return; }
    const car = this.spawnCar(svc.id === 'everready' ? 'car-service' : 'ride-car', mkPath(toYou.length > 1 ? toYou : [toYou[0], toYou[0]]), 0, CAR_SPEED, () => {});
    car.sprite.setVisible(false);
    (car as any).svc = svc; (car as any).trip = trip; (car as any).dest = dest; (car as any).delay = svc.wait;
    this.pending = car;
    const surge = svc.id === 'surge' ? 1 + Math.random() * 1.6 + state.stars() * 0.3 : 1;
    (car as any).price = Math.round(svc.base * surge);
    const msg = svc.id === 'surge' ? `SURGE: ${surge.toFixed(1)}x. "HIGH DEMAND." (IT IS ALWAYS HIGH DEMAND.)`
      : svc.id === 'shlep' ? 'SHLEP: YOUR DRIVER KNOWS A SHORTCUT.' : 'EVER-READY: "TEN MINUTES." CLICK.';
    bus.emit('ui:toast', msg);
  }

  // ------------------------------------------------------------------ FRAME
  /**
   * @returns where the player is if they're riding (so the scene can follow), or null
   */
  update(dt: number, player: { x: number; y: number }): { x: number; y: number } | null {
    // Buses: drive, dwell at stops, turn around at the ends
    for (const b of this.buses) {
      const riding = this.riding?.kind === 'bus' && this.riding.bus === b;
      // Keep a bus length behind any bus ahead in the same lane (no driving through each other)
      const hx = Math.cos(b.sprite.rotation - Math.PI / 2), hy = Math.sin(b.sprite.rotation - Math.PI / 2); // the sprite faces where it's going
      // a car just in front of the bumper, from any direction: the bus waits for it to clear
      const carAhead = !riding && b.dwell <= 0 && this.cars().some((c) => Math.hypot(c.x - (b.sprite.x + hx * 90), c.y - (b.sprite.y + hy * 90)) < 36);
      const blockedAhead = !riding && b.dwell <= 0 && this.buses.some((o) => {
        if (o === b) return false;
        const ox = o.sprite.x - b.sprite.x, oy = o.sprite.y - b.sprite.y, d = Math.hypot(ox, oy);
        if (d > 145 || d < 1) return false; // a bus is 120px long
        const ohx = Math.cos(o.sprite.rotation - Math.PI / 2), ohy = Math.sin(o.sprite.rotation - Math.PI / 2);
        return (ox * hx + oy * hy) / d > 0.8 && ohx * hx + ohy * hy > 0.5; // ahead of us, heading the same way
      }) || carAhead;
      if (b.dwell > 0) { b.dwell -= dt; }
      else if (blockedAhead) { /* wait for the bus ahead to pull away */ }
      else {
        const stop = b.route.stops[b.next], target = stop?.s ?? (b.dir > 0 ? b.route.path.len : 0);
        const step = BUS_SPEED * dt;
        if (Math.abs(target - b.s) <= step) {
          b.s = target; b.dwell = 2.2;
          if (riding && this.riding?.kind === 'bus' && (this.riding.request || b.next === 0 || b.next === b.route.stops.length - 1)) { this.alightBus(b, stop); }
          else if (!riding && this.waiting && this.waiting.route === b.route && this.waiting.stop === stop && Math.hypot(player.x - stop.px, player.y - stop.py) < 150) this.board(b);
          if (b.next === b.route.stops.length - 1 && b.dir > 0) b.dir = -1;
          else if (b.next === 0 && b.dir < 0) b.dir = 1;
          b.next = Math.max(0, Math.min(b.route.stops.length - 1, b.next + b.dir));
        } else b.s += Math.sign(target - b.s) * step;
      }
      // Drive on the right, in the same lanes the cars use: on a grid street, southbound/westbound take the lane 24px in
      // from the street's edge line, northbound/eastbound the one at 72px (traffic.ts). Diagonals keep a plain offset.
      const p = at(b.route.path, b.s), lane = 20 * b.dir, gx = Math.cos(p.ang) * b.dir, gy = Math.sin(p.ang) * b.dir;
      let bx = p.x - Math.sin(p.ang) * lane, by = p.y + Math.cos(p.ang) * lane;
      const SW = BLOCK_W * TILE, SH = BLOCK_H * TILE;
      if (Math.abs(gy) > 0.9) { const k = Math.round((p.x - 48) / SW); bx = k * SW + (gy > 0 ? 24 : 72); }
      else if (Math.abs(gx) > 0.9) { const k = Math.round((p.y - 48) / SH); by = k * SH + (gx < 0 ? 24 : 72); }
      b.sprite.setPosition(bx, by).setRotation(p.ang + Math.PI / 2 + (b.dir < 0 ? Math.PI : 0)).setDepth(p.y + 60);
    }
    if (this.waiting && Math.hypot(player.x - this.waiting.stop.px, player.y - this.waiting.stop.py) > 160) this.waiting = null;

    // A van or car on its way to you
    const pc = this.pending as any;
    if (pc) {
      if (pc.delay > 0) { pc.delay -= dt; if (pc.delay <= 0) pc.sprite.setVisible(true); }
      else {
        const goal = pc.pickAt ?? pc.path.len;
        pc.s = Math.min(goal, pc.s + pc.speed * dt);
        const p = at(pc.path, pc.s); pc.sprite.setPosition(p.x, p.y).setRotation(p.ang + Math.PI / 2).setDepth(p.y + 60);
        if (pc.s >= goal) {
          if (Math.hypot(player.x - p.x, player.y - p.y) < 190) this.pickUp(pc);
          else { pc.waited = (pc.waited ?? 0) + dt; if (pc.waited > 18) { bus.emit('ui:toast', 'YOUR RIDE LEFT WITHOUT YOU. (NO-SHOW FEE: YOUR DIGNITY.)'); pc.sprite.destroy(); this.pending = null; } }
        }
      }
    }

    // Riding
    const r = this.riding;
    if (r?.kind === 'bus') { return { x: r.bus.sprite.x, y: r.bus.sprite.y }; }
    if (r && (r.kind === 'van' || r.kind === 'car')) {
      const c = r.car; c.s = Math.min(c.path.len, c.s + c.speed * dt);
      const p = at(c.path, c.s); c.sprite.setPosition(p.x, p.y).setRotation(p.ang + Math.PI / 2).setDepth(p.y + 60);
      if (r.kind === 'van' && r.checkpoint > 0 && c.s >= r.checkpoint) {
        bus.emit('ui:toast', 'TLC CHECKPOINT. "EVERYBODY OUT." THE VAN ISN\'T LICENSED. MOST AREN\'T.');
        this.alight(); return null;
      }
      if (c.s >= c.path.len) { if (r.kind === 'car') bus.emit('ui:toast', `YOU'VE ARRIVED: ${(c as any).destName?.toUpperCase?.() ?? ''}`); this.alight(); return null; }
      return { x: p.x, y: p.y };
    }
    return null;
  }

  private board(b: Bus) {
    this.waiting = null; this.riding = { kind: 'bus', bus: b, request: false };
    bus.emit('transit:board', 'bus');
    bus.emit('ui:toast', `${b.route.id} TO ${(b.dir > 0 ? b.route.to[1] : b.route.to[0]).toUpperCase()} · TAP. $3.`);
    if (b.route.id === 'B41' && !state.flag('seen_b41')) { state.setFlag('seen_b41', true); setTimeout(() => bus.emit('ui:toast', 'NEW: CENTER-RUNNING BUS LANES ON FLATBUSH, DOWNTOWN TO GRAND ARMY PLAZA (NOV 2026)'), 1600); }
  }
  requestStop() { if (this.riding?.kind === 'bus') { this.riding.request = true; bus.emit('ui:toast', 'DING. STOP REQUESTED.'); } }
  private alightBus(b: Bus, stop: Stop) {
    this.riding = null;
    bus.emit('transit:alight', { x: stop.px, y: stop.py });
    bus.emit('ui:toast', `OFF AT ${stop.name.toUpperCase()}`);
    void b;
  }

  private pickUp(car: any) {
    this.pending = null;
    if (car.trip) { // ride app
      state.apply({ solidarity: -car.price }, { quiet: true });
      bus.emit('ui:toast', `${car.svc.name.toUpperCase()}: -${car.price} SOLIDARITY. YOUR COMRADES SAW THAT.`);
      car.path = mkPath(car.trip); car.s = 0; car.destName = car.dest.name;
      this.riding = { kind: 'car', car, service: car.svc.id };
    } else { // dollar van
      bus.emit('ui:toast', 'YOU HAND THE DRIVER $2. CASH. THE RADIO IS LOUD AND CORRECT.');
      const checkpoint = state.stars() >= 3 && Math.random() < 0.3 ? car.s + 600 + Math.random() * 1500 : -1;
      this.riding = { kind: 'van', car, checkpoint };
    }
    bus.emit('transit:board', this.riding.kind);
  }

  /** Get off the van or car where it is */
  alight() {
    const r = this.riding; if (!r || r.kind === 'bus') return;
    this.riding = null;
    const p = this.nearestSidewalk(r.car.sprite.x, r.car.sprite.y, 8) ?? { x: r.car.sprite.x, y: r.car.sprite.y };
    bus.emit('transit:alight', p);
    const spr = r.car.sprite;
    this.scene.tweens.add({ targets: spr, alpha: 0, delay: 900, duration: 500, onComplete: () => spr.destroy() });
  }

  cancelPending() { if (this.pending) { (this.pending as any).sprite.destroy(); this.pending = null; } }
  get hasPending() { return !!this.pending; }

  /** Subway lines for the big map: each line's stations in order (pixel coords) */
  linePolylines() {
    return Object.entries(LINES).map(([r, ids]) => ({ route: r, color: LINE_COLORS[r] ?? '#888', pts: ids.map((id) => this.byId[id]).filter(Boolean).map((p) => ({ x: p.x, y: p.y })) }));
  }
}
