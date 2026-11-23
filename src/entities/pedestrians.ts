import Phaser from 'phaser';
import { MAP_H, MAP_W, T, TILE, WALKABLE, districtAt, type WorldLayout } from '../world/layout';
import { PAL, type Look } from '../world/textures';
import { makeCharacter } from '../world/golden';
import { CHAR_RES } from '../core/res';
import type { District } from '../core/types';

export interface Ped {
  sprite: Phaser.GameObjects.Sprite; vx: number; vy: number; speed: number; timer: number;
  district: District; gotFlyer: boolean; pause: number;
  /** Marching with the player (Mission 3). slot = place in the crowd. */
  follow?: boolean; slot?: number;
}

const SKINS = ['#f6d2b8', '#f0c8a8', '#e8c0a0', '#d9a679', '#c58a5c', '#b07a52', '#a8714a', '#8a5a3c', '#6b3e26', '#5a3624', '#4a2a1a', '#3a2014'];
const HAIR = ['#1a1010', '#1a1010', '#2a1a12', '#3a2a1a', '#c9a25a', '#8b4a2a', '#ff4fa3', '#7b3fe4', '#2fd1c5'];
const GRAY = ['#d8d4dc', '#e8e4f0', '#bdb7c4', '#f2f0f4'];
const LOOKS = 40;
const STYLES: Look['style'][] = ['short', 'afro', 'bun', 'long', 'bald', 'beanie', 'cap', 'curly', 'braids'];
const SHIRTS = [PAL.purple, PAL.pink, PAL.orange, PAL.blue, PAL.teal, PAL.yellow, '#fff', '#2b2340', PAL.green, PAL.red];
const ACCS: (Look['acc'] | undefined)[] = [undefined, undefined, 'tote', 'phone', 'glasses', 'scarf', 'headphones', 'beret'];

/** Ambient crowd that wanders the sidewalks. */
export class Pedestrians {
  peds: Ped[] = [];
  /** Who marchers follow; set every frame by the scene. */
  leader: { x: number; y: number } | null = null;

  constructor(private scene: Phaser.Scene, private layout: WorldLayout, count = 80) {
    const R = Phaser.Math.RND;
    // Brooklyn: every age, every shade, every style. About a fifth are elders (gray hair, some with canes).
    for (let v = 0; v < LOOKS; v++) {
      const elder = v % 5 === 0;
      makeCharacter(scene, `ped${v}`, {
        skin: R.pick(SKINS), hair: elder ? R.pick(GRAY) : R.pick(HAIR), style: R.pick(STYLES), shirt: R.pick(SHIRTS), pants: R.pick(['#2b3a6b', '#3a2a5a', '#555', '#d9c7a3', '#5a4b7a', '#1a1a1c']),
        acc: elder && v % 10 === 0 ? 'cane' : R.pick(ACCS), hatColor: R.pick(SHIRTS), dress: R.frac() < 0.25, shoes: R.pick(['#111', '#fff', PAL.pink]),
      });
      scene.anims.create({ key: `ped${v}-walk`, frames: scene.anims.generateFrameNumbers(`ped${v}`, { frames: [0, 1] }), frameRate: 5, repeat: -1 });
    }
    let tries = 0;
    while (this.peds.length < count && tries++ < 5000) {
      const tx = R.between(0, MAP_W - 1), ty = R.between(0, MAP_H - 1);
      if (!this.walkable(tx * TILE + 16, ty * TILE + 16)) continue;
      const v = R.between(0, LOOKS - 1);
      const s = scene.add.sprite(tx * TILE + 16, ty * TILE + 16, `ped${v}`, 0).setOrigin(0.5, 0.5);
      s.setScale((this.peds.length % 9 === 0 ? 0.72 : 1) / CHAR_RES); // kids are smaller; textures are drawn at 2x
      s.play(`ped${v}-walk`);
      const p: Ped = { sprite: s, vx: 0, vy: 0, speed: R.between(28, 55), timer: 0, district: districtAt(s.x, s.y), gotFlyer: false, pause: 0 };
      this.pickDir(p);
      this.peds.push(p);
    }
  }

  walkable(x: number, y: number) {
    const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE);
    if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return false;
    const k = this.layout.tiles[ty][tx];
    return WALKABLE.has(k) && k !== T.COURT && !this.layout.blocked[ty][tx]; // courts are for the pickup games, not a shortcut
  }

  private pickDir(p: Ped) {
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    const [dx, dy] = Phaser.Utils.Array.GetRandom(dirs);
    p.vx = dx; p.vy = dy; p.timer = Phaser.Math.FloatBetween(2, 7);
  }

  private recycleT = 0;
  /**
   * Keep the crowd where the player is: anyone who has wandered far off-screen steps back in
   * on a sidewalk just outside the view, so every block you walk down has people on it.
   */
  private recycle(view: Phaser.Geom.Rectangle) {
    const far = Phaser.Geom.Rectangle.Inflate(Phaser.Geom.Rectangle.Clone(view), 650, 650);
    const ring = Phaser.Geom.Rectangle.Inflate(Phaser.Geom.Rectangle.Clone(view), 260, 260);
    let moved = 0;
    for (const p of this.peds) {
      if (moved >= 40) break;
      if (p.follow || Phaser.Geom.Rectangle.Contains(far, p.sprite.x, p.sprite.y)) continue;
      for (let k = 0; k < 12; k++) {
        const x = Phaser.Math.Between(ring.x, ring.right), y = Phaser.Math.Between(ring.y, ring.bottom);
        if (Phaser.Geom.Rectangle.Contains(view, x, y) || !this.walkable(x, y)) continue;
        p.sprite.setPosition(x, y); p.district = districtAt(x, y); p.gotFlyer = false; this.pickDir(p); moved++; break;
      }
    }
  }

  update(dt: number, cull: Phaser.Geom.Rectangle) {
    this.recycleT -= dt;
    if (this.recycleT <= 0) { this.recycleT = 0.4; this.recycle(cull); }
    for (const p of this.peds) {
      const s = p.sprite;
      const visible = Phaser.Geom.Rectangle.Contains(cull, s.x, s.y);
      s.setVisible(visible);
      if (p.follow && this.leader) { this.march(p, dt, visible); continue; }
      if (p.pause > 0) { p.pause -= dt; if (s.anims.isPlaying) s.anims.pause(); continue; }
      p.timer -= dt;
      if (p.timer <= 0) { if (Math.random() < 0.25) { p.pause = Phaser.Math.FloatBetween(1, 3); p.timer = 1; continue; } this.pickDir(p); }
      const nx = s.x + p.vx * p.speed * dt, ny = s.y + p.vy * p.speed * dt;
      if (this.walkable(nx + p.vx * 10, ny + p.vy * (p.vy > 0 ? 16 : 6))) { s.x = nx; s.y = ny; if (visible && !s.anims.isPlaying) s.anims.resume(); }
      else this.pickDir(p);
      s.setRotation(Math.atan2(p.vy, p.vx) + Math.PI / 2);
      s.setDepth(s.y);
    }
  }

  nearest(x: number, y: number, r: number, filter?: (p: Ped) => boolean): Ped | null {
    let best: Ped | null = null, bd = r * r;
    for (const p of this.peds) {
      if (filter && !filter(p)) continue;
      const d = (p.sprite.x - x) ** 2 + (p.sprite.y - y) ** 2;
      if (d < bd) { bd = d; best = p; }
    }
    return best;
  }

  sprites() { return this.peds.map((p) => p.sprite); }

  /** Marchers trail the leader in loose rings, filling in behind. */
  private march(p: Ped, dt: number, visible: boolean) {
    const s = p.sprite, L = this.leader!, slot = p.slot ?? 0;
    const ring = Math.floor(slot / 6), a = (slot % 6) * (Math.PI / 3) + ring * 0.5;
    const tx = L.x + Math.cos(a) * (46 + ring * 26), ty = L.y + Math.sin(a) * (46 + ring * 26);
    const dx = tx - s.x, dy = ty - s.y, d = Math.hypot(dx, dy);
    if (d > 6) {
      const sp = Math.min(d * 3, 260) * dt;
      s.x += (dx / d) * sp; s.y += (dy / d) * sp;
      s.setRotation(Math.atan2(dy, dx) + Math.PI / 2);
      if (visible && !s.anims.isPlaying) s.anims.resume();
    } else if (s.anims.isPlaying) s.anims.pause();
    s.setDepth(s.y);
  }

  followers() { return this.peds.filter((p) => p.follow); }
  recruit(p: Ped) { p.follow = true; p.slot = this.followers().length - 1; }
  /** One marcher gives up and heads home. */
  releaseOne() { const p = this.followers().pop(); if (p) { p.follow = false; p.district = districtAt(p.sprite.x, p.sprite.y); this.pickDir(p); } return !!p; }
  /** Send marchers home; they wander off from wherever they are. */
  release() { for (const p of this.peds) if (p.follow) { p.follow = false; p.district = districtAt(p.sprite.x, p.sprite.y); this.pickDir(p); } }
}
