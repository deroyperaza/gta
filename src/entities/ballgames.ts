import Phaser from 'phaser';
import { makeCharacter } from '../world/golden';

/** One basketball court: its playing area and the two rims (world coordinates). */
export interface Court { x: number; y: number; w: number; h: number; hoops: [{ x: number; y: number }, { x: number; y: number }] }

interface Baller { s: Phaser.GameObjects.Sprite; team: 0 | 1; tx: number; ty: number; speed: number; retarget: number }
interface Game {
  c: Court; p: Baller[]; ball: Phaser.GameObjects.Image; shadow: Phaser.GameObjects.Ellipse;
  holder: number; timer: number;
  /** ball in the air: a pass or a shot */
  fly: { fx: number; fy: number; tx: number; ty: number; t: number; dur: number; arc: number; to: number; shot: boolean; make: boolean } | null;
}

const SKINS = ['#f0c8a8', '#d9a679', '#c58a5c', '#a8714a', '#8a5a3c', '#6b3e26', '#4a2a1a', '#3a2014'];
const HAIR = ['#1a1010', '#2a1a12', '#3a2a1a', '#8b4a2a'];
const STYLES = ['short', 'afro', 'braids', 'bald', 'cap', 'curly'] as const;
const KITS = [{ shirt: '#ffffff', pants: '#2b2b40' }, { shirt: '#ff7a1a', pants: '#16101f' }]; // shirts vs. orange: a pickup run

/**
 * Pickup basketball: three on three on every court. The ball handler dribbles toward the rim, passes,
 * or shoots; a make or a rebound flips possession and everyone runs the other way. Only courts near the view move.
 */
export class BallGames {
  games: Game[] = [];

  constructor(private scene: Phaser.Scene, courts: Court[], hide: Phaser.GameObjects.GameObject[]) {
    const R = Phaser.Math.RND;
    for (let t = 0; t < 2; t++) for (let i = 0; i < 6; i++) {
      const key = `baller${t}${i}`;
      makeCharacter(scene, key, { skin: R.pick(SKINS), hair: R.pick(HAIR), style: R.pick([...STYLES]), shirt: KITS[t].shirt, pants: KITS[t].pants, shoes: R.pick(['#fff', '#111', '#ff4fa3']) }, false);
      if (!scene.anims.exists(`${key}-run`)) scene.anims.create({ key: `${key}-run`, frames: scene.anims.generateFrameNumbers(key, { frames: [0, 1] }), frameRate: 8, repeat: -1 });
    }
    if (!scene.textures.exists('bball')) {
      const tx = scene.textures.createCanvas('bball', 14, 14)!, c = tx.getContext();
      c.beginPath(); c.arc(7, 7, 6, 0, 7); c.fillStyle = '#f07a22'; c.fill(); c.lineWidth = 1.5; c.strokeStyle = '#16101f'; c.stroke();
      c.lineWidth = 1; c.beginPath(); c.moveTo(1, 7); c.lineTo(13, 7); c.moveTo(7, 1); c.lineTo(7, 13); c.stroke(); tx.refresh();
    }
    for (const c of courts) {
      const p: Baller[] = [], n = c.w * c.h < 30000 ? 4 : 6; // small courts run 2 on 2
      for (let i = 0; i < n; i++) {
        const team = (i % 2) as 0 | 1, x = c.x + R.frac() * c.w, y = c.y + R.frac() * c.h;
        const key = `baller${team}${R.between(0, 5)}`;
        const s = scene.add.sprite(x, y, key, 0).setOrigin(0.5).setDepth(y);
        s.play(`${key}-run`); s.anims.pause();
        p.push({ s, team, tx: x, ty: y, speed: R.between(80, 115), retarget: 0 });
      }
      const ball = scene.add.image(p[0].s.x, p[0].s.y, 'bball').setDepth(p[0].s.y + 2);
      const shadow = scene.add.ellipse(ball.x, ball.y, 10, 4, 0x000000, 0.3).setDepth(p[0].s.y + 1);
      hide.push(...p.map((b) => b.s), ball, shadow);
      this.games.push({ c, p, ball, shadow, holder: 0, timer: R.realInRange(1, 2.5), fly: null });
    }
  }

  update(dt: number, view: Phaser.Geom.Rectangle) {
    const near = Phaser.Geom.Rectangle.Inflate(Phaser.Geom.Rectangle.Clone(view), 200, 200);
    for (const g of this.games) {
      const vis = Phaser.Geom.Rectangle.Overlaps(near, new Phaser.Geom.Rectangle(g.c.x, g.c.y, g.c.w, g.c.h));
      for (const b of g.p) b.s.setVisible(vis);
      g.ball.setVisible(vis); g.shadow.setVisible(vis);
      if (vis) this.step(g, Math.min(dt, 0.05));
    }
  }

  private step(g: Game, dt: number) {
    const R = Phaser.Math.RND, c = g.c, now = this.scene.time.now;
    const offense = g.fly ? (g.p[g.fly.to].team) : g.p[g.holder].team;
    const hoop = c.hoops[offense === 0 ? 1 : 0];
    const mid = { x: c.x + c.w / 2, y: c.y + c.h / 2 };
    const ux = mid.x - hoop.x, uy = mid.y - hoop.y, ul = Math.hypot(ux, uy) || 1; // from the rim toward half court
    const size = Math.max(c.w, c.h) / 2; // half court
    const clampX = (x: number) => Phaser.Math.Clamp(x, c.x + 10, c.x + c.w - 10), clampY = (y: number) => Phaser.Math.Clamp(y, c.y + 10, c.y + c.h - 10);
    // Offense spreads around the arc; each defender guards the matching attacker, between them and the rim
    const spots = (g.p.length === 4 ? [-0.7, 0.7] : [-0.8, 0, 0.8]).map((a) => {
      const r = size * (a === 0 ? 0.75 : 0.6), ca = Math.cos(a), sa = Math.sin(a);
      return { x: hoop.x + ((ux * ca - uy * sa) / ul) * r, y: hoop.y + ((ux * sa + uy * ca) / ul) * r };
    });
    const att = g.p.filter((b) => b.team === offense), def = g.p.filter((b) => b.team !== offense);
    att.forEach((b, i) => {
      b.retarget -= dt;
      if (b.retarget <= 0) { b.retarget = R.realInRange(0.8, 2); const sp = spots[i]; b.tx = clampX(sp.x + R.between(-22, 22)); b.ty = clampY(sp.y + R.between(-22, 22)); }
    });
    if (!g.fly) { const h = g.p[g.holder]; if (h.team === offense) { const k = 0.45 + 0.3 * Math.sin(now / 900); h.tx = clampX(hoop.x + (ux / ul) * size * k); h.ty = clampY(hoop.y + (uy / ul) * size * k); } }
    def.forEach((b, i) => { const a = att[i]; b.tx = clampX(a.s.x + (hoop.x - a.s.x) * 0.25); b.ty = clampY(a.s.y + (hoop.y - a.s.y) * 0.25); });

    for (const b of g.p) {
      const s = b.s, dx = b.tx - s.x, dy = b.ty - s.y, d = Math.hypot(dx, dy);
      if (d > 4) {
        const st = Math.min(d, b.speed * dt); s.x += (dx / d) * st; s.y += (dy / d) * st;
        s.setRotation(Math.atan2(dy, dx) + Math.PI / 2); if (!s.anims.isPlaying) s.anims.resume();
      } else {
        if (s.anims.isPlaying) s.anims.pause();
        s.setRotation(Math.atan2(g.ball.y - s.y, g.ball.x - s.x) + Math.PI / 2); // eyes on the ball
      }
      s.setDepth(s.y);
    }

    if (g.fly) {
      const f = g.fly; f.t += dt; const k = Math.min(1, f.t / f.dur);
      const x = f.fx + (f.tx - f.fx) * k, y = f.fy + (f.ty - f.fy) * k, lift = Math.sin(k * Math.PI) * f.arc;
      g.ball.setPosition(x, y - lift).setScale(1 + lift / 60).setDepth(1e5 - 2);
      g.shadow.setPosition(x, y + 6).setDepth(y);
      if (k >= 1) {
        if (f.shot) {
          // Make: the other team inbounds under this rim. Miss: whoever's closest grabs the rebound.
          const pool = f.make ? g.p.filter((b) => b.team !== g.p[f.to].team) : g.p;
          let best = 0, bd = Infinity;
          pool.forEach((b) => { const dd = Math.hypot(b.s.x - f.tx, b.s.y - f.ty); if (dd < bd) { bd = dd; best = g.p.indexOf(b); } });
          g.holder = best;
        } else g.holder = f.to;
        g.fly = null; g.timer = R.realInRange(1.2, 2.6);
      }
      return;
    }
    const h = g.p[g.holder];
    // Dribble: the ball bounces at the handler's side
    const fa = h.s.rotation - Math.PI / 2, bounce = Math.abs(Math.sin(now / 140));
    const bx = h.s.x + Math.cos(fa + 0.9) * 13, by = h.s.y + Math.sin(fa + 0.9) * 13;
    g.ball.setPosition(bx, by - bounce * 5).setScale(0.9 + bounce * 0.15).setDepth(h.s.y + 2);
    g.shadow.setPosition(bx, by + 4).setDepth(h.s.y + 1);
    g.timer -= dt;
    if (g.timer > 0) return;
    const rimD = Math.hypot(hoop.x - h.s.x, hoop.y - h.s.y);
    if (rimD < size * 0.8 && R.frac() < 0.45) {
      const make = R.frac() < 0.5;
      const tx = make ? hoop.x : hoop.x + R.between(-18, 18), ty = make ? hoop.y : hoop.y + R.between(10, 26);
      g.fly = { fx: bx, fy: by, tx, ty, t: 0, dur: 0.75, arc: 46, to: g.holder, shot: true, make };
    } else {
      const mates = g.p.map((b, i) => i).filter((i) => i !== g.holder && g.p[i].team === h.team);
      const to = R.pick(mates), m = g.p[to].s;
      g.fly = { fx: bx, fy: by, tx: m.x, ty: m.y, t: 0, dur: 0.35, arc: 8, to, shot: false, make: false };
    }
  }
}
