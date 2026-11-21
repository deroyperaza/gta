import Phaser from 'phaser';
import { BLOCK_H, BLOCK_W, COLS, GAP_CIRCLE, RIVER_ROWS, ROWS, TILE, WORLD_H, WORLD_W } from '../world/layout';

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

/** Avenues end at the waterfront; nothing drives in the river. */
const SHORE_Y = (RIVER_ROWS + 2) * TILE;

interface Vehicle {
  sprite: Phaser.GameObjects.Image; shadow: Phaser.GameObjects.Image;
  axis: 'x' | 'y'; dir: 1 | -1; lane: number; speed: number; cur: number; len: number; bike: boolean;
}

const CAR_KEYS = ['car0', 'car1', 'car2', 'car3', 'car3', 'car4', 'car5', 'van', 'car6'];

/** Lane-following traffic that brakes for the player and for each other. */
export class Traffic {
  vehicles: Vehicle[] = [];
  private honkCooldown = 0;

  constructor(private scene: Phaser.Scene, onHonk: (x: number, y: number) => void) {
    this.onHonk = onHonk;
    const r = Phaser.Math.RND;
    // Vertical avenues
    for (let k = 0; k <= COLS; k++) {
      const x0 = k * BLOCK_W * TILE;
      for (const [dir, off] of [[1, 24], [-1, 72]] as const) {
        const n = 2 + r.between(0, 1);
        for (let i = 0; i < n; i++) this.spawn('y', dir, x0 + off, r.between(SHORE_Y + 40, WORLD_H), i === 0 && r.frac() < 0.35);
      }
    }
    // Horizontal streets
    for (let k = 1; k <= ROWS; k++) { // k = 0 would be in the river
      const y0 = k * BLOCK_H * TILE;
      for (const [dir, off] of [[-1, 24], [1, 72]] as const) {
        const n = 2 + r.between(0, 1);
        for (let i = 0; i < n; i++) this.spawn('x', dir, y0 + off, r.between(0, WORLD_W), i === 0 && r.frac() < 0.35);
      }
    }
  }
  private onHonk: (x: number, y: number) => void;

  private spawn(axis: 'x' | 'y', dir: 1 | -1, lane: number, pos: number, bike: boolean) {
    const key = bike ? 'cyclist' : Phaser.Utils.Array.GetRandom(CAR_KEYS);
    const x = axis === 'y' ? lane : pos, y = axis === 'y' ? pos : lane;
    const s = this.scene.add.image(x, y, key);
    s.rotation = axis === 'y' ? (dir === 1 ? Math.PI : 0) : dir === 1 ? Math.PI / 2 : -Math.PI / 2;
    const shadow = this.scene.add.image(x, y, `${key}-shd`).setRotation(s.rotation).setDepth(-4);
    const speed = bike ? Phaser.Math.Between(80, 110) : Phaser.Math.Between(110, 190);
    this.vehicles.push({ sprite: s, shadow, axis, dir, lane, speed, cur: speed, len: s.height, bike });
  }

  update(dt: number, player: { x: number; y: number }, pushPlayer: (dx: number, dy: number) => void) {
    this.honkCooldown -= dt;
    for (const v of this.vehicles) {
      const s = v.sprite;
      const pos = v.axis === 'y' ? s.y : s.x;
      // Look ahead for player / other vehicles in this lane
      let blocked = false;
      const pAlong = (v.axis === 'y' ? player.y : player.x) - pos;
      const pLat = Math.abs((v.axis === 'y' ? player.x : player.y) - v.lane);
      if (pLat < 34 && pAlong * v.dir > 0 && pAlong * v.dir < v.len / 2 + 50) blocked = true;
      if (!blocked) for (const o of this.vehicles) {
        if (o === v || o.axis !== v.axis || o.lane !== v.lane) continue;
        const d = ((o.axis === 'y' ? o.sprite.y : o.sprite.x) - pos) * v.dir;
        if (d > 0 && d < (v.len + o.len) / 2 + 22) { blocked = true; break; }
      }
      const target = blocked ? 0 : v.speed;
      v.cur += (target - v.cur) * Math.min(1, dt * (blocked ? 8 : 2));
      const np = pos + v.cur * v.dir * dt;
      const max = v.axis === 'y' ? WORLD_H : WORLD_W, min = v.axis === 'y' ? SHORE_Y : 0;
      const wrapped = np > max + 80 ? min - 80 : np < min - 80 ? max + 80 : np;
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
