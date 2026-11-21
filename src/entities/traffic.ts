import Phaser from 'phaser';
import { BLOCK_H, BLOCK_W, COLS, GAP_CIRCLE, ROWS, TILE, isLand } from '../world/layout';

/** Grand Army Plaza: lanes that meet the island swing around it, counterclockwise like a real NYC circle. */
const GCX = GAP_CIRCLE.x * TILE, GCY = GAP_CIRCLE.y * TILE, GA = (GAP_CIRCLE.ax + GAP_CIRCLE.w / 2) * TILE, GB = (GAP_CIRCLE.ay + GAP_CIRCLE.w / 2) * TILE;
function aroundGap(axis: 'x' | 'y', dir: 1 | -1, lane: number, along: number) {
  const c = axis === 'x' ? GCY : GCX, a = axis === 'x' ? GA : GB, b = axis === 'x' ? GB : GA;
  if (Math.abs(lane - c) > 80) return null;
  const t = (along - (axis === 'x' ? GCX : GCY)) / a;
  if (Math.abs(t) >= 1) return null;
  const side = axis === 'x' ? dir : -dir; // eastbound passes south, westbound north; northbound east, southbound west
  const r = Math.sqrt(1 - t * t), off = side * b * r, slope = Math.max(-6, Math.min(6, (-side * b * t) / (a * Math.max(r, 0.05))));
  const mx = axis === 'x' ? dir : dir * slope, my = axis === 'x' ? dir * slope : dir;
  return { lat: lane + off, rot: Math.atan2(my, mx) + Math.PI / 2 };
}

/** Stretches of a street line that touch Brooklyn blocks: [first block, last block + 1]. Nothing drives into the water. */
function runs(n: number, has: (i: number) => boolean) {
  const out: [number, number][] = []; let s = -1;
  for (let i = 0; i <= n; i++) { const h = i < n && has(i); if (h && s < 0) s = i; if (!h && s >= 0) { out.push([s, i]); s = -1; } }
  return out;
}

interface Vehicle {
  sprite: Phaser.GameObjects.Image; shadow: Phaser.GameObjects.Image;
  axis: 'x' | 'y'; dir: 1 | -1; lane: number; speed: number; cur: number; len: number; bike: boolean;
  /** this street's stretch (px along the axis) and its two lanes; at either end the car U-turns into the other lane */
  min: number; max: number; lanes: [number, number];
}

const CAR_KEYS = ['car0', 'car1', 'car2', 'car3', 'car3', 'car4', 'car5', 'van', 'car6'];

/** Lane-following traffic that brakes for the player and for each other. */
export class Traffic {
  vehicles: Vehicle[] = [];
  private honkCooldown = 0;

  constructor(private scene: Phaser.Scene, onHonk: (x: number, y: number) => void) {
    this.onHonk = onHonk;
    const r = Phaser.Math.RND;
    // Vertical streets: line k runs between block columns k-1 and k, wherever one of them is Brooklyn
    for (let k = 0; k <= COLS; k++) for (const [a, b] of runs(ROWS, (row) => isLand(k - 1, row) || isLand(k, row))) {
      const x0 = k * BLOCK_W * TILE, min = a * BLOCK_H * TILE + 48, max = b * BLOCK_H * TILE + 48;
      for (const [dir, off] of [[1, 24], [-1, 72]] as const) {
        const n = Math.max(1, Math.round((b - a) * 0.22 + r.frac()));
        for (let i = 0; i < n; i++) this.spawn('y', dir, x0 + off, r.between(min, max), i === 0 && r.frac() < 0.35, min, max, [x0 + 24, x0 + 72]);
      }
    }
    // Horizontal streets
    for (let k = 0; k <= ROWS; k++) for (const [a, b] of runs(COLS, (col) => isLand(col, k - 1) || isLand(col, k))) {
      const y0 = k * BLOCK_H * TILE, min = a * BLOCK_W * TILE + 48, max = b * BLOCK_W * TILE + 48;
      for (const [dir, off] of [[-1, 24], [1, 72]] as const) {
        const n = Math.max(1, Math.round((b - a) * 0.22 + r.frac()));
        for (let i = 0; i < n; i++) this.spawn('x', dir, y0 + off, r.between(min, max), i === 0 && r.frac() < 0.35, min, max, [y0 + 72, y0 + 24]);
      }
    }
  }
  private onHonk: (x: number, y: number) => void;

  private spawn(axis: 'x' | 'y', dir: 1 | -1, lane: number, pos: number, bike: boolean, min: number, max: number, lanes: [number, number]) {
    const key = bike ? 'cyclist' : Phaser.Utils.Array.GetRandom(CAR_KEYS);
    const x = axis === 'y' ? lane : pos, y = axis === 'y' ? pos : lane;
    const s = this.scene.add.image(x, y, key);
    s.rotation = axis === 'y' ? (dir === 1 ? Math.PI : 0) : dir === 1 ? Math.PI / 2 : -Math.PI / 2;
    const shadow = this.scene.add.image(x, y, `${key}-shd`).setRotation(s.rotation).setDepth(-4);
    const speed = bike ? Phaser.Math.Between(80, 110) : Phaser.Math.Between(110, 190);
    this.vehicles.push({ sprite: s, shadow, axis, dir, lane, speed, cur: speed, len: s.height, bike, min, max, lanes });
  }

  update(dt: number, player: { x: number; y: number }, pushPlayer: (dx: number, dy: number) => void) {
    this.honkCooldown -= dt;
    const byLane = new Map<string, Vehicle[]>(); // only cars in the same lane can block each other
    for (const v of this.vehicles) { const k = v.axis + v.lane; let a = byLane.get(k); if (!a) byLane.set(k, (a = [])); a.push(v); }
    for (const v of this.vehicles) {
      const s = v.sprite;
      const pos = v.axis === 'y' ? s.y : s.x;
      // Look ahead for player / other vehicles in this lane
      let blocked = false;
      const pAlong = (v.axis === 'y' ? player.y : player.x) - pos;
      const pLat = Math.abs((v.axis === 'y' ? player.x : player.y) - v.lane);
      if (pLat < 34 && pAlong * v.dir > 0 && pAlong * v.dir < v.len / 2 + 50) blocked = true;
      if (!blocked) for (const o of byLane.get(v.axis + v.lane) ?? []) {
        if (o === v) continue;
        const d = ((o.axis === 'y' ? o.sprite.y : o.sprite.x) - pos) * v.dir;
        if (d > 0 && d < (v.len + o.len) / 2 + 22) { blocked = true; break; }
      }
      const target = blocked ? 0 : v.speed;
      v.cur += (target - v.cur) * Math.min(1, dt * (blocked ? 8 : 2));
      let np = pos + v.cur * v.dir * dt;
      // End of the street (the shore, or the edge of Brooklyn): U-turn into the other lane
      if ((v.dir === 1 && np > v.max) || (v.dir === -1 && np < v.min)) {
        np = v.dir === 1 ? v.max : v.min; v.dir = v.dir === 1 ? -1 : 1; v.lane = v.lane === v.lanes[0] ? v.lanes[1] : v.lanes[0];
      }
      const wrapped = np;
      if (v.axis === 'y') s.y = wrapped; else s.x = wrapped;
      const g = aroundGap(v.axis, v.dir, v.lane, wrapped);
      if (v.axis === 'y') s.x = g ? g.lat : v.lane; else s.y = g ? g.lat : v.lane;
      s.rotation = g ? g.rot : v.axis === 'y' ? (v.dir === 1 ? Math.PI : 0) : v.dir === 1 ? Math.PI / 2 : -Math.PI / 2;
      v.shadow.setRotation(s.rotation);
      s.setDepth(s.y + 20);
      v.shadow.setPosition(s.x + 9, s.y + 3);

      // Collision with player: shove them sideways out of the lane.
      const w = v.axis === 'y' ? 20 : v.len / 2, h = v.axis === 'y' ? v.len / 2 : 20;
      const dx = player.x - s.x, dy = player.y - s.y;
      if (Math.abs(dx) < w + 8 && Math.abs(dy) < h + 8) {
        if (v.axis === 'y') pushPlayer(Math.sign(dx || 1) * 6, 0); else pushPlayer(0, Math.sign(dy || 1) * 6);
        if (this.honkCooldown <= 0 && !v.bike) { this.honkCooldown = 1.5; this.onHonk(s.x, s.y); }
      } else if (blocked && pLat < 34 && this.honkCooldown <= 0 && !v.bike && Math.random() < dt * 0.6) {
        this.honkCooldown = 2.5; this.onHonk(s.x, s.y);
      }
    }
  }

  sprites() { return this.vehicles.map((v) => v.sprite); }
}
