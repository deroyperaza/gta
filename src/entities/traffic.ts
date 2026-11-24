import Phaser from 'phaser';
import { BLOCK_H, BLOCK_W, COLS, GAP_CIRCLE, ROAD, ROWS, T, TILE, isLand } from '../world/layout';

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
  /** Police and ambulances on a call: flashing light bar, a little faster */
  lights?: Phaser.GameObjects.Graphics; ems?: boolean;
  axis: 'x' | 'y'; dir: 1 | -1; lane: number; speed: number; cur: number; len: number; bike: boolean;
  /** this street's stretch (px along the axis) and its two lanes; at either end the car U-turns into the other lane */
  min: number; max: number; lanes: [number, number];
}

const CAR_KEYS = ['car0', 'car1', 'car2', 'car3', 'car3', 'car4', 'car5', 'van', 'car6', 'police', 'police', 'ambulance', 'ambulance', 'garbage', 'schoolbus', 'schoolbus'];

/** Lane-following traffic that brakes for the player and for each other. */
export class Traffic {
  vehicles: Vehicle[] = [];
  /** Light bars, so the minimap can ignore them */
  lightSprites: Phaser.GameObjects.Graphics[] = [];
  private honkCooldown = 0;

  constructor(private scene: Phaser.Scene, onHonk: (x: number, y: number) => void) {
    this.onHonk = onHonk;
    const r = Phaser.Math.RND;
    // A stretch of street only gets cars if it's really road there (not the boardwalk, the beach or the ocean)
    const tiles: number[][] = (scene as any).layout.tiles;
    const ROADT = new Set<number>([T.ASPHALT, T.LANE_V, T.LANE_H, T.INTERSECTION, T.CROSS_V, T.CROSS_H]);
    const road = (tx: number, ty: number) => ROADT.has(tiles[ty]?.[tx] ?? -1);
    // Bike lanes (green, at both curbs) on about one street in four; there the cars move in toward the middle.
    // Delivery mopeds ride with the cars, and now and then in the bike lane (as they do).
    // Built from small rectangles and stencil images (skipped when off screen), not one huge redrawn Graphics
    if (!scene.textures.exists('bike-stencil')) {
      const g = scene.make.graphics({}, false);
      g.lineStyle(1.6, 0xf4f4ee, 1).strokeCircle(4, 10, 3.2).strokeCircle(12, 10, 3.2).lineBetween(4, 10, 8, 4).lineBetween(8, 4, 12, 10).lineBetween(8, 4, 10, 3);
      g.generateTexture('bike-stencil', 16, 14); g.destroy();
    }
    const hide: Phaser.GameObjects.GameObject[] = [];
    // Grand Army Plaza: traffic swings around the island, so the painted lanes stop at the circle instead of cutting through it
    const inPlaza = (x: number, y: number) => ((x - GCX) / (GA + 40)) ** 2 + ((y - GCY) / (GB + 40)) ** 2 < 1;
    const bikeLane = (axis: 'x' | 'y', at: number, from: number, to: number) => {
      const mid = at + ROAD * TILE / 2, out = (t: number) => !inPlaza(axis === 'y' ? mid : t, axis === 'y' ? t : mid);
      let a = -1; // paint only the stretches outside the plaza
      for (let t = from; t <= to; t += 16) {
        if (out(t)) { if (a < 0) a = t; }
        else if (a >= 0) { if (t - 16 - a > 64) paintLane(axis, at, a, t - 16); a = -1; }
      }
      if (a >= 0 && to - a > 64) paintLane(axis, at, a, to);
    };
    const paintLane = (axis: 'x' | 'y', at: number, from: number, to: number) => {
      for (const side of [0, ROAD * TILE - 16]) {
        const x = axis === 'y' ? at + side : from, y = axis === 'y' ? from : at + side, w = axis === 'y' ? 16 : to - from, h = axis === 'y' ? to - from : 16;
        hide.push(scene.add.rectangle(x, y, w, h, 0x3f9a56, 0.85).setOrigin(0).setDepth(-7));
        const lx = axis === 'y' ? (side ? x : x + 14.5) : x, ly = axis === 'y' ? y : side ? y : y + 14.5; // the white line on the traffic side
        hide.push(scene.add.rectangle(lx, ly, axis === 'y' ? 1.5 : w, axis === 'y' ? h : 1.5, 0xf4f4ee, 0.9).setOrigin(0).setDepth(-7));
        for (let t = 70; t < (to - from) - 40; t += 240) hide.push(scene.add.image(axis === 'y' ? x + 8 : x + t, axis === 'y' ? y + t : y + 8, 'bike-stencil').setDepth(-6.9).setRotation(axis === 'y' ? -Math.PI / 2 : 0).setAlpha(0.9));
      }
    };
    const streets = (axis: 'x' | 'y', k: number, a: number, b: number) => {
      const at = k * (axis === 'y' ? BLOCK_W : BLOCK_H) * TILE, span = axis === 'y' ? BLOCK_H : BLOCK_W;
      const min = a * span * TILE + 48, max = b * span * TILE + 48, hasLane = k % 4 === 2;
      if (hasLane) for (let i = a; i < b; i++) bikeLane(axis, at, i * span * TILE + ROAD * TILE + 6, (i + 1) * span * TILE - 6); // between the intersections
      // lane offsets from the street's edge: cars at 24/72 (32/64 beside bike lanes), bikes in the bike lanes at 8/88
      const car = hasLane ? [32, 64] : [24, 72], bike = [8, 88];
      const dirs = axis === 'y' ? ([[1, 0], [-1, 1]] as const) : ([[-1, 0], [1, 1]] as const);
      const lanesFor = (o: number[]) => (axis === 'y' ? [at + o[0], at + o[1]] : [at + o[1], at + o[0]]) as [number, number];
      for (const [dir, side] of dirs) {
        const n = Math.max(1, Math.round((b - a) * 0.22 + r.frac()));
        for (let i = 0; i < n; i++) this.spawn(axis, dir, at + car[side], r.between(min, max), i === 0 && r.frac() < 0.35 && !hasLane, min, max, lanesFor(car));
        if (r.frac() < 0.55) this.spawn(axis, dir, at + car[side], r.between(min, max), false, min, max, lanesFor(car), 'moped');
        if (hasLane) for (let i = 0; i < 1 + Math.round(r.frac() * (b - a) * 0.15); i++) {
          const moped = r.frac() < 0.2; // some delivery riders take the bike lane too
          this.spawn(axis, dir, at + bike[side], r.between(min, max), !moped, min, max, lanesFor(bike), moped ? 'moped' : undefined);
        }
      }
    };
    // Vertical streets: line k runs between block columns k-1 and k, wherever one of them is Brooklyn
    for (let k = 0; k <= COLS; k++) for (const [a, b] of runs(ROWS, (row) => (isLand(k - 1, row) || isLand(k, row)) && road(k * BLOCK_W + 1, row * BLOCK_H + ROAD + 9))) streets('y', k, a, b);
    // Horizontal streets
    for (let k = 0; k <= ROWS; k++) for (const [a, b] of runs(COLS, (col) => (isLand(col, k - 1) || isLand(col, k)) && road(col * BLOCK_W + ROAD + 9, k * BLOCK_H + 1))) streets('x', k, a, b);
    (scene as any).miniIgnore?.push(...hide);
  }
  private onHonk: (x: number, y: number) => void;

  private spawn(axis: 'x' | 'y', dir: 1 | -1, lane: number, pos: number, bike: boolean, min: number, max: number, lanes: [number, number], kind?: 'moped') {
    let key = kind === 'moped' ? `moped${Phaser.Math.Between(0, 3)}` : bike ? Phaser.Utils.Array.GetRandom(['cyclist', 'cyclist1', 'cyclist2', 'cyclist3']) : Phaser.Utils.Array.GetRandom(CAR_KEYS);
    if (!this.scene.textures.exists(key)) key = 'car1'; // the painted garbage truck didn't load
    const x = axis === 'y' ? lane : pos, y = axis === 'y' ? pos : lane;
    const s = this.scene.add.image(x, y, key);
    s.rotation = axis === 'y' ? (dir === 1 ? Math.PI : 0) : dir === 1 ? Math.PI / 2 : -Math.PI / 2;
    const shadow = this.scene.add.image(x, y, `${key}-shd`).setRotation(s.rotation).setDepth(-4);
    const speed = bike ? Phaser.Math.Between(80, 110) : kind === 'moped' ? Phaser.Math.Between(140, 180) : key === 'garbage' || key === 'schoolbus' ? Phaser.Math.Between(70, 100) : Phaser.Math.Between(110, 190); // garbage trucks crawl
    const emergency = key === 'police' || key === 'ambulance';
    const onCall = emergency && Math.random() < 0.5;
    const lights = onCall ? this.scene.add.graphics().setDepth(s.depth + 1) : undefined;
    this.vehicles.push({ sprite: s, shadow, axis, dir, lane, speed: onCall ? speed * 1.35 : speed, cur: onCall ? speed * 1.35 : speed, len: s.height, bike, min, max, lanes, lights, ems: key === 'ambulance' });
    if (kind === 'moped') this.vehicles[this.vehicles.length - 1].bike = true; // small: no honking, no shoving like a car
    if (lights) this.lightSprites.push(lights);
  }

  /** Buses (from transit.ts): cars stop behind them like they stop behind each other */
  buses: () => { x: number; y: number; rotation: number }[] = () => [];
  update(dt: number, player: { x: number; y: number }, pushPlayer: (dx: number, dy: number) => void) {
    const buses = this.buses();
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
      if (!blocked) { // a bus in the way, in this lane or crossing ahead: the spot just in front of this car is inside the bus
        // along the way the car actually faces (around Grand Army Plaza that's the curve, not the straight grid lane)
        const ahead = v.len / 2 + 26, fx = Math.sin(s.rotation), fy = -Math.cos(s.rotation), px = s.x + fx * ahead, py = s.y + fy * ahead;
        for (const b of buses) {
          const hx = Math.sin(b.rotation), hy = -Math.cos(b.rotation), ox = px - b.x, oy = py - b.y;
          const inFrontOfBus = Math.hypot(s.x - (b.x + hx * 90), s.y - (b.y + hy * 90)) < 36; // that bus is waiting on this car: keep going, clear the way
          if (!inFrontOfBus && Math.abs(ox * hx + oy * hy) < 60 + 14 && Math.abs(-ox * hy + oy * hx) < 16 + 14) { blocked = true; break; }
        }
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
      if (v.lights) { // the light bar flashes: red/blue for police, red/white for EMS
        const on = Math.floor(this.scene.time.now / 160) % 2 === 0, g = v.lights;
        g.clear().setPosition(s.x, s.y).setRotation(s.rotation).setDepth(s.depth + 1);
        const off = v.ems ? -v.len / 2 + 14 : v.len * 0.12; // light bar position along the vehicle (it faces up before rotation)
        g.fillStyle(on ? 0xff2a2a : (v.ems ? 0xffffff : 0x2a6bff), 1).fillCircle(-7, off, 3.2);
        g.fillStyle(on ? (v.ems ? 0xffffff : 0x2a6bff) : 0xff2a2a, 1).fillCircle(7, off, 3.2);
        g.fillStyle(on ? 0xff2a2a : 0x2a6bff, 0.18).fillCircle(on ? -7 : 7, off, 12);
      }

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
