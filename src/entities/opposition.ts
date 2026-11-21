import Phaser from 'phaser';
import { bus } from '../core/bus';
import type { Dialogue } from '../systems/dialogue';
import { makeCharacter } from '../world/golden';
import { TILE, WALKABLE, type WorldLayout } from '../world/layout';

/**
 * The Free Parking Caucus: satirical obstructionists who show up during missions
 * and try to stop you. They chase at 170 (faster than walking, slower than a
 * sprint or a bike). Three ways past them:
 *   - outrun them (Shift or a BK Spokes bike),
 *   - outnumber them (6+ marchers following you),
 *   - out-argue them (E: answer their talking point with a real civic fact).
 * Get caught and they hold you up: a few seconds lost, flyers taken, a marcher gone.
 */
export interface Squad {
  sprite: Phaser.GameObjects.Sprite; tag: Phaser.GameObjects.Text;
  home: { x: number; y: number }; state: 'patrol' | 'chase' | 'cool' | 'gone';
  t: number; vx: number; vy: number;
}

const CHASE = 170, PATROL = 45, SEE = 300, GIVE_UP = 440, CATCH = 30;

/** Talking points, each answered by something the cast actually teaches. */
const DEBATES: { q: string; right: string; wrong: [string, string] }[] = [
  { q: 'You can\'t protest without a permit, sweetheart. I checked. On Facebook.', right: 'On the sidewalk we can, as long as people can still get by.', wrong: ['Permits are a social construct.', 'My cousin is basically a lawyer.'] },
  { q: 'Free lawyers for tenants? In THIS economy?', right: 'NYC\'s Right to Counsel covers eviction cases for tenants who qualify.', wrong: ['Lawyers are free if you\'re polite.', 'Rent is just a vibe.'] },
  { q: 'People with records can\'t vote. Everybody knows that.', right: 'In New York, your vote comes back the day you leave prison.', wrong: ['Only on Tuesdays.', 'Voting is overrated anyway.'] },
  { q: 'Kids don\'t get a say in how the city spends money.', right: 'The People\'s Money lets New Yorkers 11 and up vote on part of the budget.', wrong: ['Kids should run for mayor.', 'Money is fake.'] },
  { q: 'Close a street to cars? For PEOPLE? What about my Buick?', right: 'Open Streets: groups apply to the city every fall. Your Buick will survive.', wrong: ['Cars are illegal now.', 'We\'ll just carry the Buick.'] },
  { q: 'Block parties are basically illegal. Too much joy.', right: 'Block party permit: $25, apply at least 60 days ahead.', wrong: ['Joy is unregulated.', 'We don\'t need a permit, we have cake.'] },
  { q: 'AI can\'t be biased. It\'s a computer. Computers love everybody.', right: 'NYC makes companies audit AI hiring tools for bias every year.', wrong: ['Computers are people too.', 'Just unplug it.'] },
  { q: 'Museums are for rich people. Stay in your lane.', right: 'A library card gets you free Culture Pass museum passes.', wrong: ['Museums are just big closets.', 'I don\'t like art, it looks at me.'] },
];
const TAUNTS = ['JUST ONE QUICK QUESTION!', 'HAVE YOU CONSIDERED THE PARKING?', 'BACK IN MY DAY WE DIDN\'T HAVE NEIGHBORS!', 'THIS IS A DEBATE NOW!', 'WHO\'S PAYING FOR THIS?', 'I\'M JUST ASKING QUESTIONS!'];

export class Opposition {
  squads: Squad[] = [];
  engaged: Squad | null = null;
  private wasActive = false;

  constructor(private scene: Phaser.Scene, private layout: WorldLayout, count = 3) {
    const looks = [
      { skin: '#f6d2b8', hair: '#c9b38a', shirt: '#1f2a44', pants: '#c8b48a' },
      { skin: '#f0c8a8', hair: '#5a3a24', shirt: '#7a1f24', pants: '#2b2b30' },
      { skin: '#e8b898', hair: '#e8e4f0', shirt: '#f2f2f2', pants: '#c8b48a' },
    ];
    looks.forEach((l, i) => makeCharacter(scene, `gop${i}`, { ...l, style: 'cap', hatColor: '#d8262e', acc: 'clipboard', shoes: '#3a2a1a' }));
    for (let i = 0; i < count; i++) {
      const sprite = scene.add.sprite(-999, -999, `gop${i % 3}`, 0).setOrigin(0.5).setVisible(false);
      const tag = scene.add.text(-999, -999, 'FREE PARKING CAUCUS', { fontFamily: 'Nunito, Arial, sans-serif', fontSize: '11px', fontStyle: '900', color: '#ffffff', backgroundColor: '#d8262e', padding: { x: 5, y: 2 } }).setOrigin(0.5).setDepth(1e5).setVisible(false);
      this.squads.push({ sprite, tag, home: { x: 0, y: 0 }, state: 'gone', t: 2 + i * 3, vx: 0, vy: 0 });
    }
    bus.on('event:gop:won', () => this.disperse(this.engaged, true));
    bus.on('event:gop:lost', () => { if (this.engaged) this.caught(this.engaged); });
  }

  sprites() { return this.squads.flatMap((s) => [s.sprite, s.tag]); }

  private walkable(x: number, y: number) {
    const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE);
    return ty >= 0 && tx >= 0 && ty < this.layout.tiles.length && tx < this.layout.tiles[0].length && WALKABLE.has(this.layout.tiles[ty][tx]) && !this.layout.blocked[ty][tx];
  }

  /** Spawn between the player and where the mission wants them to go. */
  private spawn(s: Squad, player: { x: number; y: number }, target: { x: number; y: number } | null) {
    for (let tries = 0; tries < 40; tries++) {
      let x: number, y: number;
      if (target) {
        const f = Phaser.Math.FloatBetween(0.35, 0.8), side = Phaser.Math.FloatBetween(-140, 140);
        const dx = target.x - player.x, dy = target.y - player.y, d = Math.hypot(dx, dy) || 1;
        x = player.x + dx * f - (dy / d) * side; y = player.y + dy * f + (dx / d) * side;
      } else {
        const a = Math.random() * Math.PI * 2, r = Phaser.Math.Between(420, 650);
        x = player.x + Math.cos(a) * r; y = player.y + Math.sin(a) * r;
      }
      if (Math.hypot(x - player.x, y - player.y) < 320 || !this.walkable(x, y)) continue;
      s.sprite.setPosition(x, y).setVisible(true).setAlpha(1);
      s.tag.setVisible(true);
      s.home = { x, y }; s.state = 'patrol'; s.t = 0;
      return;
    }
  }

  private disperse(s: Squad | null, won: boolean) {
    if (!s) return;
    if (won) bus.emit('ui:toast', Phaser.Utils.Array.GetRandom(['THEY FOLD THEIR LAWN CHAIRS', 'FACT-CHECKED. THEY LEAVE.', 'THE CAUCUS RETREATS TO THE PARKING LOT']));
    s.state = 'gone'; s.t = 35;
    this.scene.tweens.add({ targets: [s.sprite, s.tag], alpha: 0, duration: 600, onComplete: () => { s.sprite.setVisible(false); s.tag.setVisible(false).setAlpha(1); } });
    this.engaged = null;
  }

  private caught(s: Squad) {
    bus.emit('opposition:caught');
    s.state = 'cool'; s.t = 7; this.engaged = null;
  }

  nearest(x: number, y: number, r: number): Squad | null {
    let best: Squad | null = null, bd = r;
    for (const s of this.squads) {
      if (s.state === 'gone' || !s.sprite.visible) continue;
      const d = Math.hypot(s.sprite.x - x, s.sprite.y - y);
      if (d < bd) { bd = d; best = s; }
    }
    return best;
  }

  /** A debate built fresh each time: answer with a real fact to win. */
  debate(s: Squad): Dialogue {
    this.engaged = s;
    const d = Phaser.Utils.Array.GetRandom(DEBATES);
    const opts = Phaser.Utils.Array.Shuffle([
      { text: d.right, effects: { solidarity: 15, inc: { gop_beaten: 1 }, event: 'gop:won' }, next: 'won' },
      { text: d.wrong[0], effects: { event: 'gop:lost' }, next: 'lost' },
      { text: d.wrong[1], effects: { event: 'gop:lost' }, next: 'lost' },
    ]);
    return {
      entries: [{ node: 'q' }],
      nodes: {
        q: { speaker: 'Chip, Free Parking Caucus', text: d.q, choices: opts },
        won: { speaker: 'Chip, Free Parking Caucus', text: Phaser.Utils.Array.GetRandom(['...I\'m going to need to see a source. Oh. That IS a source. We\'ll be in the car.', 'Hm. Well. This was a productive dialogue and I am leaving now.', 'Agree to disagree. Except you\'re right. Bye.']) },
        lost: { speaker: 'Chip, Free Parking Caucus', text: 'HA. Gotcha. Now, about the parking. This will take forty minutes. Sit.' },
      },
    };
  }

  /**
   * @param active  a mission is running and the player is free to move
   * @param target  where the mission is pointing (squads spawn in the way)
   * @param marchers how many people are following the player
   */
  update(dt: number, player: { x: number; y: number }, fast: boolean, active: boolean, target: { x: number; y: number } | null, marchers: number) {
    if (!active) {
      if (this.wasActive) for (const s of this.squads) if (s.state !== 'gone') this.disperse(s, false);
      this.wasActive = false;
      return;
    }
    this.wasActive = true;
    for (const s of this.squads) {
      const spr = s.sprite;
      if (s.state === 'gone') { s.t -= dt; if (s.t <= 0) this.spawn(s, player, target); continue; }
      const dx = player.x - spr.x, dy = player.y - spr.y, d = Math.hypot(dx, dy);
      if (d > 1500) { s.state = 'gone'; s.t = 3; spr.setVisible(false); s.tag.setVisible(false); continue; }
      if (s.state === 'cool') { s.t -= dt; if (s.t <= 0) s.state = 'patrol'; }
      if (s.state === 'patrol' && d < SEE) { s.state = 'chase'; this.scene.events.emit('gop:taunt', s, Phaser.Utils.Array.GetRandom(TAUNTS)); }
      if (s.state === 'chase' && d > GIVE_UP) s.state = 'patrol';
      let mx = 0, my = 0, sp = PATROL;
      if (s.state === 'chase') { mx = dx / (d || 1); my = dy / (d || 1); sp = CHASE; }
      else if (s.state === 'cool') { mx = -dx / (d || 1); my = -dy / (d || 1); sp = 60; }
      else {
        s.t -= dt;
        if (s.t <= 0) { const a = Math.random() * Math.PI * 2; s.vx = Math.cos(a); s.vy = Math.sin(a); s.t = Phaser.Math.FloatBetween(1.5, 3.5); }
        const hx = s.home.x - spr.x, hy = s.home.y - spr.y;
        mx = s.vx + hx / 200; my = s.vy + hy / 200; const l = Math.hypot(mx, my) || 1; mx /= l; my /= l;
      }
      const nx = spr.x + mx * sp * dt, ny = spr.y + my * sp * dt;
      if (this.walkable(nx, ny)) spr.setPosition(nx, ny); else if (s.state === 'patrol') s.t = 0;
      spr.setRotation(Math.atan2(my, mx) + Math.PI / 2).setDepth(spr.y);
      s.tag.setPosition(spr.x, spr.y - 34);
      if (s.state === 'chase' && d < CATCH) {
        if (fast) continue; // a bike or a sprint gets you past
        if (marchers >= 6) { bus.emit('ui:toast', 'OUTNUMBERED. THE CAUCUS FOLDS ITS LAWN CHAIRS.'); bus.emit('opposition:outnumbered'); this.disperse(s, false); continue; }
        this.caught(s);
      }
    }
  }
}
