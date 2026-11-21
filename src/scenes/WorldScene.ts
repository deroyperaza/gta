import Phaser from 'phaser';
import { bus } from '../core/bus';
import { state } from '../core/state';
import { DISTRICTS, type District } from '../core/types';
import { DIALOGUES } from '../data/dialogues';
import { FLYER_LINES, NPCS, PED_LINES, PLAYER_LOOK, type NpcDef } from '../data/npcs';
import { Pedestrians, type Ped } from '../entities/pedestrians';
import { Traffic } from '../entities/traffic';
import { Opposition } from '../entities/opposition';
import { dialogue } from '../systems/dialogue';
import { missions } from '../systems/missions';
import { ui } from '../ui/ui';
import { BLOCK_H, BLOCK_W, GAP_CIRCLE, ROAD, T, TILE, WORLD_H, WORLD_W, districtAt, generateLayout, type BuildingDef, type WorldLayout } from '../world/layout';
import { makeProps } from '../world/textures';
import { buildingKey, makeBikeRider, makeBridgeTower, makeBuilding, makeCharacter, makePlayerMarker, makeStreetProps, makeTiles, makeVehicles, shadowKey, shadowOffset, SHADOW_PAD } from '../world/golden';

interface Interactable {
  id: string; x: number; y: number; r: number;
  label: () => string | null; act: () => void;
}

const WALK = 150, RUN = 245, BIKE = 330, BIKE_RUN = 410;

/** Landmarks painted in ChatGPT (magenta keyed out) at public/sprites/<building id>.png */
const PAINTED_LANDMARKS = ['savingsbank', 'centrallib', 'boroughhall', 'kingsish'];

export class WorldScene extends Phaser.Scene {
  layout!: WorldLayout;
  player!: Phaser.Physics.Arcade.Sprite;
  keys!: Record<string, Phaser.Input.Keyboard.Key>;
  cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  dragSteer = false;
  opp!: Opposition;
  stunUntil = 0;
  peds!: Pedestrians;
  traffic!: Traffic;
  minimap!: Phaser.Cameras.Scene2D.Camera;
  interactables: Interactable[] = [];
  entityPos: Record<string, { x: number; y: number }> = {};
  npcSprites: Record<string, Phaser.GameObjects.Sprite> = {};
  markers: Phaser.GameObjects.Image[] = [];
  mmMarkers: Phaser.GameObjects.Image[] = [];
  mmPlayer!: Phaser.GameObjects.Image;
  arrow!: Phaser.GameObjects.Image;
  fridge!: Phaser.GameObjects.Image;
  cat!: Phaser.GameObjects.Sprite;
  posterLayer: Phaser.GameObjects.Image[] = [];
  miniIgnore: Phaser.GameObjects.GameObject[] = [];
  mode: 'title' | 'play' = 'title';
  onBike = false;
  playerRing!: Phaser.GameObjects.Image;
  playerChevron!: Phaser.GameObjects.Image;
  district: District | null = null;
  lastDialogueEnd = 0;
  facing = 1;
  titlePan = 0;
  catPets = 0;

  constructor() { super('world'); }

  preload() {
    // Hand-painted likeness portraits (style-study/portraits.html) win over the generated busts.
    for (const id of ['deroy', 'jenna', 'nell', 'bridgette', 'adrian', 'danae', 'jon', 'emily', 'naim', 'luco', 'vega']) this.load.image(`npc-${id}-bust`, `portraits/${id}.jpg`);
    this.load.image('barclays-sprite', 'sprites/barclays.png');
    this.load.image('gap-island', 'sprites/gap.png'); // Grand Army Plaza's island, painted in ChatGPT, keyed
    for (const id of PAINTED_LANDMARKS) this.load.image(`lm-${id}`, `sprites/${id}.png`);
  }

  create() {
    this.layout = generateLayout();
    makeTiles(this); makeVehicles(this); makeStreetProps(this); makeProps(this);
    makeCharacter(this, 'player', PLAYER_LOOK);
    makeBikeRider(this, 'player-bike', PLAYER_LOOK);
    for (const n of NPCS) makeCharacter(this, `npc-${n.id}`, n.look);
    makeCharacter(this, 'vendor-rosa', { skin: '#c58a5c', hair: '#3a2a1a', style: 'bun', shirt: '#ff8a3d', pants: '#3a2a5a', acc: 'apron', dress: true });
    makeCharacter(this, 'vendor-hamid', { skin: '#a8714a', hair: '#1a1010', style: 'cap', hatColor: '#ff4b4b', shirt: '#fff', pants: '#2b3a6b', acc: 'apron' });

    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);
    this.buildGround();
    const solids = this.physics.add.staticGroup();
    this.buildBuildings(solids);
    this.buildProps(solids);

    // Player
    this.anims.create({ key: 'player-walk', frames: this.anims.generateFrameNumbers('player', { frames: [0, 1] }), frameRate: 7, repeat: -1 });
    this.anims.create({ key: 'bike-roll', frames: this.anims.generateFrameNumbers('player-bike', { frames: [0, 1] }), frameRate: 9, repeat: -1 });
    const start = this.layout.spots.playerStart;
    this.player = this.physics.add.sprite(start.x, start.y, 'player', 0).setOrigin(0.5, 0.5);
    this.player.setCollideWorldBounds(true).setScale(1.2);
    makePlayerMarker(this);
    this.playerRing = this.add.image(start.x, start.y, 'player-ring');
    this.playerChevron = this.add.image(start.x, start.y, 'player-chevron');
    this.miniIgnore.push(this.playerRing, this.playerChevron);
    this.tweens.add({ targets: this.playerRing, scale: { from: 0.9, to: 1.12 }, alpha: { from: 1, to: 0.65 }, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.setPlayerBody();
    this.physics.add.collider(this.player, solids);
    this.physics.add.collider(this.player, this.groundLayer);

    this.buildNpcs(solids);
    this.setupMarch();
    this.peds = new Pedestrians(this, this.layout, 170);
    this.opp = new Opposition(this, this.layout, 3);
    this.events.on('gop:taunt', (sq: any, t: string) => this.bubble(sq.sprite, t));
    bus.on('opposition:caught', () => this.heldUp());
    bus.on('opposition:outnumbered', () => state.apply({ solidarity: 8 }, { quiet: true }));
    this.traffic = new Traffic(this, (x, y) => this.floatText(x, y - 30, Phaser.Utils.Array.GetRandom(['HONK!', 'BEEP!', 'MOVE!', 'YO!']), '#ffd23f'));

    // Waypoint arrow
    this.arrow = this.add.image(0, 0, 'arrow').setDepth(1e6).setVisible(false);

    // Cameras
    const cam = this.cameras.main;
    cam.setBounds(0, 0, WORLD_W, WORLD_H);
    cam.setBackgroundColor('#2b2622');
    cam.startFollow(this.player, true, 0.12, 0.12);
    this.applyZoom();
    this.setupMinimap();

    // Input
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.cursors = this.input.keyboard!.createCursorKeys();
    // Drag-to-walk: only when the press starts on open ground, not on a character or button.
    this.input.on('pointerdown', (_p: Phaser.Input.Pointer, over: unknown[]) => { this.dragSteer = over.length === 0; });
    this.input.on('pointerup', () => { this.dragSteer = false; });
    this.input.on('gameout', () => { this.dragSteer = false; });
    // Releasing over the HUD or outside the canvas must also stop the walk.
    const stopDrag = () => { this.dragSteer = false; };
    window.addEventListener('pointerup', stopDrag); window.addEventListener('mouseup', stopDrag); window.addEventListener('blur', stopDrag);
    this.keys = this.input.keyboard!.addKeys({ W: K.W, A: K.A, S: K.S, D: K.D, E: K.E, SPACE: K.SPACE, SHIFT: K.SHIFT, B: K.B }) as Record<string, Phaser.Input.Keyboard.Key>;
    this.input.keyboard!.addCapture([K.SPACE, K.UP, K.DOWN, K.LEFT, K.RIGHT]);

    this.scale.on('resize', () => { this.applyZoom(); this.layoutMinimap(); });
    bus.on('dialogue:end', () => { this.lastDialogueEnd = performance.now(); });
    bus.on('game:new', () => this.newGame());
    bus.on('game:load', () => this.loadGame());
    bus.on('game:title', () => { this.mode = 'title'; });
    bus.on('state:changed', () => this.refreshWorldState());
    bus.on('mission:failed', () => this.cameras.main.shake(300, 0.006));
    bus.on('mission:passed', (p: any) => { this.celebrate(this.player.x, this.player.y); if (p?.def?.id === 'march') this.peds.release(); });
    bus.on('ui:interact', () => this.tryInteract());
    bus.on('ui:action', () => this.tryAction());
    bus.on('ui:bike', () => { if (this.mode !== 'play') return; if (this.onBike) this.toggleBike(false); else bus.emit('ui:toast', 'FIND A BK SPOKES DOCK TO GRAB A BIKE'); });

    ui.attachWorld(this);
    bus.emit('world:ready');
    if (import.meta.env.DEV) { (window as any).__world = this; (window as any).__state = state; (window as any).__missions = missions; }
  }

  // ------------------------------------------------------------------ BUILD
  groundLayer!: Phaser.Tilemaps.TilemapLayer;
  private buildGround() {
    const map = this.make.tilemap({ data: this.layout.tiles, tileWidth: TILE, tileHeight: TILE });
    const ts = map.addTilesetImage('tiles', 'tiles', TILE, TILE, 0, 0)!;
    this.groundLayer = map.createLayer(0, ts, 0, 0)!.setDepth(-10);
    map.setCollision([T.WATER]);
  }

  private buildBuildings(solids: Phaser.Physics.Arcade.StaticGroup) {
    for (const b of this.layout.buildings) {
      makeBuilding(this, b);
      const shd = this.add.image(b.x - SHADOW_PAD, b.y - SHADOW_PAD, shadowKey(b)).setOrigin(0, 0).setDepth(-5);
      this.miniIgnore.push(shd);
      const img = solids.create(b.x + b.w / 2, b.y + b.h / 2, buildingKey(b)) as Phaser.Physics.Arcade.Image;
      img.setDepth(b.y + b.h);
      // Slightly inset collision so the player can hug facades
      (img.body as Phaser.Physics.Arcade.StaticBody).setSize(b.w - 4, b.h - 6).setOffset(2, 0);
      if (this.textures.exists(`lm-${b.id}`)) {
        // A painted landmark: same footprint and collision, drawn as the sprite standing on the block's edge
        img.setVisible(false);
        const art = this.add.image(b.x + b.w / 2, b.y + b.h, `lm-${b.id}`).setOrigin(0.5, 1);
        art.setDisplaySize(b.w, (b.w * art.height) / art.width).setDepth(b.y + b.h);
        shd.setVisible(false);
        const { dx, dy } = shadowOffset(b);
        this.miniIgnore.push(this.add.image(art.x + dx * 0.5, art.y + dy * 0.5, `lm-${b.id}`).setOrigin(0.5, 1).setDisplaySize(art.displayWidth, art.displayHeight).setTintFill(0x0e0816).setAlpha(0.3).setDepth(-5));
      }
      if (b.type === 'arena' && this.textures.exists('barclays-sprite')) {
        // The painted arena: the green bowl is solid, the oculus canopy (west end) you walk under
        img.setTexture('barclays-sprite');
        (img.body as Phaser.Physics.Arcade.StaticBody).setSize(b.w * 0.7, b.h * 0.8).setOffset(b.w * 0.29, b.h * 0.08);
        shd.setVisible(false);
        const { dx, dy } = shadowOffset(b);
        this.miniIgnore.push(this.add.image(b.x + dx * 0.5, b.y + dy * 0.5, 'barclays-sprite').setOrigin(0).setTintFill(0x0e0816).setAlpha(0.3).setDepth(-5));
      }
    }
    // Flatbush Avenue's diagonal: double yellow center line and crosswalk bars at each end
    const fa = this.layout.spots.flatbushA, fb = this.layout.spots.flatbushB;
    if (fa && fb) {
      // Smooth roadway over the stair-stepped tiles: sidewalk band, then asphalt
      const o = this.layout.spots.flatbushO, bwp = (BLOCK_W - ROAD) * TILE, bhp = (BLOCK_H - ROAD) * TILE;
      if (o) {
        const sm = this.add.graphics().setDepth(-9), atY = (y: number) => o.x + ((y - o.y) * bwp) / bhp;
        const y0 = o.y - 1.6 * TILE, y1 = o.y + bhp + 1.6 * TILE;
        const band = (hw: number, color: number, ya: number, yb: number) => { sm.fillStyle(color, 1); sm.fillPoints([{ x: atY(ya) - hw, y: ya }, { x: atY(ya) + hw, y: ya }, { x: atY(yb) + hw, y: yb }, { x: atY(yb) - hw, y: yb }], true); };
        band(2.9 * TILE, 0xa39c90, o.y, o.y + bhp); band(1.75 * TILE, 0x24272a, y0, y1);
        this.miniIgnore.push(sm);
      }
      const g = this.add.graphics().setDepth(-6), dx = fb.x - fa.x, dy = fb.y - fa.y, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
      g.lineStyle(2.5, 0xf2c23a, 0.9);
      for (let t = 60; t < L - 60; t += 34) for (const o of [-2.5, 2.5]) g.lineBetween(fa.x + ux * t + nx * o, fa.y + uy * t + ny * o, fa.x + ux * (t + 20) + nx * o, fa.y + uy * (t + 20) + ny * o);
      g.lineStyle(5, 0xece6da, 0.85);
      for (const [t0, sgn] of [[70, 1], [L - 70, -1]] as const) for (let k = -2; k <= 2; k++) { const cx = fa.x + ux * t0 + nx * k * 15, cy = fa.y + uy * t0 + ny * k * 15; g.lineBetween(cx, cy, cx + ux * 16 * sgn, cy + uy * 16 * sgn); }
      this.miniIgnore.push(g);
    }
    // Brooklyn Bridge: granite tower over the deck (you walk under it) and the cables
    const bs = this.layout.spots.bridge;
    if (bs) {
      makeBridgeTower(this, 'bridge-tower', 230, 150);
      this.add.image(bs.x, bs.y + 20, 'bridge-tower').setOrigin(0.5, 1).setDepth(5e4);
      const g = this.add.graphics().setDepth(5e4 - 1);
      g.lineStyle(2, 0xece2c8, 0.85);
      const topY = bs.y + 20 - 150;
      for (const side of [-1, 1]) for (let i = 1; i <= 7; i++) {
        const ax = bs.x + side * 38;
        g.lineBetween(ax, topY + 4, bs.x + side * 50, bs.y + 20 + i * 34); // toward Brooklyn
        g.lineBetween(ax, topY + 4, bs.x + side * 50, topY - i * 22);       // toward Manhattan
      }
      g.lineStyle(3, 0xd9ccb0, 0.9); for (const side of [-1, 1]) g.lineBetween(bs.x + side * 50, topY - 160, bs.x + side * 50, bs.y + 260);
    }
    // Diagonal avenues: smooth sidewalk and roadway over the stair-stepped tiles, plus a double yellow line
    for (const av of this.layout.avenues) {
      const sm = this.add.graphics().setDepth(-9), ln = this.add.graphics().setDepth(-6);
      const quad = (a: { x: number; y: number }, b: { x: number; y: number }, hw: number, trimA: number, trimB = trimA) => {
        const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, nx = -uy * hw, ny = ux * hw;
        const ax = a.x + ux * trimA, ay = a.y + uy * trimA, bx = b.x - ux * trimB, by = b.y - uy * trimB;
        sm.fillPoints([{ x: ax + nx, y: ay + ny }, { x: bx + nx, y: by + ny }, { x: bx - nx, y: by - ny }, { x: ax - nx, y: ay - ny }], true);
      };
      const segs = av.pts.slice(1).map((q, i) => [av.pts[i], q] as const);
      // sidewalks stop short of the cross streets at every intersection the avenue meets
      sm.fillStyle(0xa39c90, 1); segs.forEach(([a, b]) => quad(a, b, av.hw + 1.2 * TILE, 2.2 * TILE));
      sm.fillStyle(0x24272a, 1); segs.forEach(([a, b]) => quad(a, b, av.hw, 0)); av.pts.slice(1, -1).forEach((p) => sm.fillCircle(p.x, p.y, av.hw));
      ln.lineStyle(2.5, 0xf2c23a, 0.9);
      for (const [a, b] of segs) {
        const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
        for (let t = 70; t < L - 70; t += 34) for (const o of [-2.5, 2.5]) ln.lineBetween(a.x + ux * t + nx * o, a.y + uy * t + ny * o, a.x + ux * (t + 20) + nx * o, a.y + uy * (t + 20) + ny * o);
      }
      this.miniIgnore.push(sm, ln);
    }
    // Grand Army Plaza: the traffic circle and its painted island (arch + Bailey Fountain)
    {
      const g = GAP_CIRCLE, cx = g.x * TILE, cy = g.y * TILE;
      const ring = this.add.graphics().setDepth(-9);
      ring.fillStyle(0xa39c90, 1).fillCircle(cx, cy, (g.rOut + 1.2) * TILE);
      ring.fillStyle(0x24272a, 1).fillCircle(cx, cy, g.rOut * TILE);
      ring.fillStyle(0x8f8a80, 1).fillCircle(cx, cy, g.rIn * TILE + 6);
      const lane = this.add.graphics().setDepth(-6), rm = ((g.rIn + g.rOut) / 2) * TILE;
      lane.lineStyle(3, 0xece6da, 0.7);
      for (let a = 0; a < Math.PI * 2; a += 0.16) lane.beginPath().arc(cx, cy, rm, a, a + 0.08).strokePath();
      this.miniIgnore.push(ring, lane);
      if (this.textures.exists('gap-island')) {
        this.miniIgnore.push(this.add.image(cx, cy + g.rIn * TILE, 'gap-island').setOrigin(0.5, 1).setDepth(-7));
        // the arch (north end) and the fountain basin are solid; the lawns and paths you can walk
        for (const [ox, oy, w, h] of [[0, -g.rIn * TILE * 0.62, 120, 40], [0, 0, 70, 50]]) solids.add(this.add.zone(cx + ox, cy + oy, w, h));
      } else ring.fillStyle(0x58b956, 1).fillCircle(cx, cy, g.rIn * TILE);
    }
    for (const l of this.layout.labels) {
      const t = this.add.text(l.x, l.y - 40, l.text.toUpperCase().split('').join(' '), { fontFamily: '"Helvetica Neue", Inter, Arial, sans-serif', fontSize: '22px', fontStyle: '300', color: '#f4ece0', shadow: { offsetX: 0, offsetY: 2, color: 'rgba(0,0,0,.6)', blur: 6, fill: true } }).setOrigin(0.5).setDepth(5).setAlpha(0.8).setRotation(l.angle ?? 0);
      this.miniIgnore.push(t);
    }
  }

  private buildProps(solids: Phaser.Physics.Arcade.StaticGroup) {
    for (const p of this.layout.props) {
      const key = ['tree', 'duck', 'hoop', 'crate', 'dumpster', 'cart'].includes(p.kind) ? `${p.kind}${p.variant ?? 0}` : p.kind;
      if (!this.textures.exists(key)) continue;
      let img: Phaser.GameObjects.Image;
      if (p.solid) {
        img = solids.create(p.x, p.y, key) as Phaser.Physics.Arcade.Image;
        img.setOrigin(0.5, 0.92);
        (img as Phaser.Physics.Arcade.Image).refreshBody();
        const body = (img as Phaser.Physics.Arcade.Image).body as Phaser.Physics.Arcade.StaticBody;
        const bw = p.kind === 'tree' ? 18 : img.width * 0.8, bh = p.kind === 'fountain' ? 60 : 14;
        body.setSize(bw, bh, false);
        body.setOffset((img.width - bw) / 2, img.height * 0.92 - bh - (p.kind === 'fountain' ? 10 : 2));
      } else img = this.add.image(p.x, p.y, key).setOrigin(0.5, 0.92);
      img.setDepth(p.y);
      if (p.kind === 'duck') this.tweens.add({ targets: img, x: p.x + 60, duration: 4000 + Math.random() * 2000, yoyo: true, repeat: -1, ease: 'Sine.inOut', onYoyo: () => img.setFlipX(true), onRepeat: () => img.setFlipX(false) });
      if (p.kind !== 'tree' && p.kind !== 'fountain') this.miniIgnore.push(img);
    }
    // Community fridge
    const fs = this.layout.spots.fridge;
    this.fridge = this.add.image(fs.x, fs.y, 'fridge-empty').setOrigin(0.5, 0.95).setDepth(fs.y);
    this.entityPos.fridge = fs;
    this.interactables.push({
      id: 'fridge', x: fs.x, y: fs.y, r: 70,
      label: () => (missions.active?.id === 'stock' && state.mission('stock').stage === 2 ? 'Restock the fridge' : 'Check the fridge'),
      act: () => this.useFridge(),
    });
    // Bike docks
    for (const [id, s] of Object.entries(this.layout.spots)) {
      if (!id.startsWith('dock-')) continue;
      const img = this.add.image(s.x, s.y, 'dock').setOrigin(0.5, 0.9).setDepth(s.y);
      this.miniIgnore.push(img);
      this.interactables.push({ id, x: s.x, y: s.y, r: 70, label: () => (this.onBike ? 'Dock your bike' : 'Grab a BK Spokes bike'), act: () => this.toggleBike(!this.onBike) });
    }
    // Vendors
    const vend = (id: string, key: string, cartKey: string, spot: { x: number; y: number }, name: string, lines: string[], gift: string) => {
      const cart = this.add.image(spot.x + 50, spot.y, cartKey).setOrigin(0.5, 0.92).setDepth(spot.y);
      const v = this.add.sprite(spot.x, spot.y, key, 0).setOrigin(0.5, 0.5).setDepth(spot.y + 1).setRotation(Math.PI);
      this.miniIgnore.push(cart, v);
      this.interactables.push({
        id, x: spot.x + 20, y: spot.y, r: 70, label: () => `Talk to ${name}`,
        act: () => {
          if (!state.flag(`gift_${id}`)) { state.apply({ solidarity: 5, flags: { [`gift_${id}`]: true }, toast: gift }); dialogue.say(id, name, lines[0]); }
          else dialogue.say(id, name, Phaser.Utils.Array.GetRandom(lines.slice(1)));
        },
      });
    };
    vend('rosa', 'vendor-rosa', 'cart1', this.layout.spots.churro, 'Doña Rosa', [
      'Organizer? Take a churro. Revolutions run on sugar, mijo.',
      'Twenty years selling churros in this park. The city fined me twice. The park ducks never did.',
      'Tell Brendan his "artisanal churro" pop-up is NOT a churro.',
    ], 'FREE CHURRO · MORALE UP');
    vend('hamid', 'vendor-hamid', 'cart0', this.layout.spots.halal, 'Hamid', [
      'Chicken over rice, white sauce, hot sauce. On the house — you look like you\'re about to do something brave.',
      'Lawyers, cops, protesters — everybody eats from my cart. I\'m the only neutral party in Downtown.',
      'Councilmember Gary owes me \$340. Put THAT in a newsletter.',
    ], 'FREE CHICKEN OVER RICE');
  }

  private buildNpcs(solids: Phaser.Physics.Arcade.StaticGroup) {
    for (const n of NPCS) {
      const s = this.layout.spots[n.spot];
      if (!s) { console.warn('no spot for', n.id); continue; }
      const key = `npc-${n.id}`;
      this.anims.create({ key: `${key}-idle`, frames: this.anims.generateFrameNumbers(key, { frames: [0] }), frameRate: 1, repeat: -1 });
      const spr = this.add.sprite(s.x, s.y, key, 0).setOrigin(0.5, 0.5).setDepth(s.y).setRotation(Math.PI);
      spr.play({ key: `${key}-idle` });
      const blocker = solids.create(s.x, s.y - 8, undefined) as Phaser.Physics.Arcade.Image;
      blocker.setVisible(false); (blocker.body as Phaser.Physics.Arcade.StaticBody).setSize(22, 14);
      const tag = this.add.text(s.x, s.y - 40, n.short.toUpperCase(), { fontFamily: 'Nunito, "Helvetica Neue", Arial, sans-serif', fontSize: '15px', fontStyle: '900', color: '#16101f', backgroundColor: n.color, padding: { x: 7, y: 3 }, shadow: { offsetX: 2, offsetY: 2, color: '#16101f', blur: 0, fill: false, stroke: false } }).setOrigin(0.5).setDepth(1e5);
      this.miniIgnore.push(tag, spr);
      this.npcSprites[n.id] = spr;
      this.entityPos[n.id] = s;
      this.interactables.push({ id: n.id, x: s.x, y: s.y, r: 64, label: () => `Talk to ${n.short}`, act: () => this.talk(n) });
      this.makeNpcClickable(n, spr, tag);
    }
    // Commissioner Whiskers
    const cs = this.layout.spots.cat;
    this.cat = this.add.sprite(cs.x, cs.y, 'cat').setDepth(cs.y);
    this.miniIgnore.push(this.cat);
    this.tweens.add({ targets: this.cat, x: cs.x + 90, duration: 5000, yoyo: true, repeat: -1, ease: 'Sine.inOut', onYoyo: () => this.cat.setFlipX(true), onRepeat: () => this.cat.setFlipX(false) });
    this.interactables.push({
      id: 'cat', x: cs.x, y: cs.y, r: 56, label: () => 'Pet Commissioner Whiskers',
      act: () => {
        this.catPets++;
        if (this.catPets === 1 && !state.flag('pet_cat')) { dialogue.say('cat', 'Commissioner Whiskers', '*The Commissioner regards you with the cold contempt of a tenured official. He is not taking meetings today.* (Try again.)'); return; }
        if (!state.flag('pet_cat')) { state.apply({ flags: { pet_cat: true }, rel: { farouk: 3 }, toast: 'THE COMMISSIONER APPROVES' }); this.hearts(this.cat.x, this.cat.y); dialogue.say('cat', 'Commissioner Whiskers', '*Purrs like a two-stroke engine.* You have been granted a provisional neighborhood permit.'); }
        else { this.hearts(this.cat.x, this.cat.y); this.floatText(this.cat.x, this.cat.y - 20, 'prrrrt', '#ff7ab8'); }
      },
    });
  }

  private setupMinimap() {
    this.minimap = this.cameras.add(0, 0, 200, 200, false, 'minimap');
    this.minimap.setZoom(0.09).setBounds(0, 0, WORLD_W, WORLD_H).setBackgroundColor('#1b1230');
    this.minimap.startFollow(this.player, true, 1, 1);
    this.layoutMinimap();
    this.mmPlayer = this.add.image(0, 0, 'mm-player').setDepth(2e6).setScale(1.2);
    this.cameras.main.ignore(this.mmPlayer);
    this.minimap.ignore([this.player, this.arrow, ...this.miniIgnore, ...this.peds.sprites(), ...this.opp.sprites()]);
  }
  private layoutMinimap() {
    if (!this.minimap) return;
    const phone = this.scale.width <= 600 || this.scale.height <= 500, m = phone ? 8 : 18;
    const size = phone ? (this.scale.width <= 600 ? 136 : Math.min(120, Math.floor(this.scale.height * 0.3))) : Math.min(200, Math.floor(this.scale.width * 0.28));
    this.minimap.setViewport(this.scale.width - size - m, m, size, size);
    bus.emit('minimap:layout', { x: this.scale.width - size - m, y: m, size });
  }
  private applyZoom() {
    const w = this.scale.width;
    this.cameras.main.setZoom(w > 1500 ? 1.25 : w > 900 ? 1.1 : 0.85);
  }

  // ------------------------------------------------------------------ GAME FLOW
  private newGame() {
    state.reset();
    this.posterLayer.forEach((p) => p.destroy()); this.posterLayer = [];
    this.toggleBike(false, true);
    const s = this.layout.spots.playerStart;
    this.player.setPosition(s.x, s.y);
    missions.start('stock');
    this.mode = 'play';
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.flash(400, 255, 140, 60);
    bus.emit('ui:toast', 'YOU JUST GOT OUT OF JURY DUTY');
    setTimeout(() => bus.emit('ui:toast', 'FIND DEE IN BED-STUY →'), 900);
  }

  private loadGame() {
    if (!state.load()) return;
    this.posterLayer.forEach((p) => p.destroy()); this.posterLayer = [];
    for (const p of state.d.posters) this.addPosterSprite(p.x, p.y, p.v);
    const { x, y, onBike } = state.d.player;
    // Saves from before the Nov 2026 map re-layout can sit inside a building now; fall back to the start.
    const blocked = this.layout.buildings.some((b) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h);
    if (x > 0 && !blocked) this.player.setPosition(x, y);
    else { const s = this.layout.spots.playerStart; this.player.setPosition(s.x, s.y); }
    this.toggleBike(onBike, true);
    this.mode = 'play';
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.refreshWorldState();
  }

  private refreshWorldState() {
    const full = !!state.flag('stb_restocked') || state.mission('stock').status === 'complete';
    this.fridge?.setTexture(full ? 'fridge-full' : 'fridge-empty');
    this.updateMarkers();
  }

  private updateMarkers() {
    if (!this.minimap) return;
    this.markers.forEach((m) => m.destroy()); this.mmMarkers.forEach((m) => m.destroy());
    this.markers = []; this.mmMarkers = [];
    for (const id of missions.targets()) {
      const p = this.entityPos[id]; if (!p) continue;
      const m = this.add.image(p.x, p.y - 52, 'excl').setDepth(1e6);
      this.tweens.add({ targets: m, y: p.y - 96, duration: 450, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      const mm = this.add.image(p.x, p.y, 'mm-target').setDepth(2e6).setScale(1.3);
      this.tweens.add({ targets: mm, scale: 1.7, duration: 500, yoyo: true, repeat: -1 });
      this.minimap.ignore(m); this.cameras.main.ignore(mm);
      this.markers.push(m); this.mmMarkers.push(mm);
    }
  }

  // Hover + click on a named character (sprite or name tag) = the "Talk to X" prompt.
  private makeNpcClickable(n: NpcDef, spr: Phaser.GameObjects.Sprite, tag: Phaser.GameObjects.Text) {
    const ring = this.add.circle(spr.x, spr.y, 24).setStrokeStyle(2, 0xffd36b, 0.95).setFillStyle(0xffd36b, 0.14).setDepth(spr.depth - 1).setVisible(false);
    this.miniIgnore.push(ring);
    const zone = this.add.zone(spr.x, spr.y - 8, 56, 64).setInteractive({ useHandCursor: true });
    tag.setInteractive({ useHandCursor: true });
    const over = () => {
      ring.setVisible(true);
      tag.setScale(1.15);
      spr.setTint(0xfff1c4);
    };
    const out = () => {
      ring.setVisible(false);
      tag.setScale(1);
      spr.clearTint();
    };
    const click = () => {
      if (this.mode !== 'play' || ui.blocking() || performance.now() - this.lastDialogueEnd < 250) return;
      const d = Math.hypot(spr.x - this.player.x, spr.y - this.player.y);
      if (d <= 64) this.talk(n);
      else bus.emit('ui:toast', `WALK CLOSER TO TALK TO ${n.short.toUpperCase()}`);
    };
    for (const o of [zone, tag]) {
      o.on('pointerover', over);
      o.on('pointerout', out);
      o.on('pointerdown', click);
    }
  }

  // ------------------------------------------------------------------ INTERACTIONS
  private talk(n: NpcDef) {
    const spr = this.npcSprites[n.id];
    spr.setFlipX(this.player.x < spr.x);
    const d = DIALOGUES[n.id];
    if (d) dialogue.start(n.id, d);
    else dialogue.say(n.id, n.id, Phaser.Utils.Array.GetRandom(n.idle ?? ['...']));
    state.addRel(n.id, 0);
  }

  private useFridge() {
    const m = state.mission('stock');
    if (missions.active?.id === 'stock' && m.stage === 2 && state.count('groceries') >= 3) {
      state.apply({ items: { groceries: -3 }, solidarity: 50, flags: { stb_restocked: true, stb_fast: (m.timeLeft ?? 0) >= 45 }, toast: 'FRIDGE RESTOCKED!' });
      this.hearts(this.fridge.x, this.fridge.y - 40, 14);
      this.tweens.add({ targets: this.fridge, scaleX: 1.15, scaleY: 0.9, duration: 120, yoyo: true, repeat: 2 });
      dialogue.say('fridge', 'Community Fridge', '*The fridge hums a little louder, like it\'s proud of itself.* Inside: rice, plantains, kale (consenting), sourdough, and the good hot sauce.');
      return;
    }
    const full = !!state.flag('stb_restocked') || m.status === 'complete';
    if (full) dialogue.say('fridge', 'Community Fridge', Phaser.Utils.Array.GetRandom([
      'Fully stocked. Someone left a note: "THANK YOU — from 3B." Someone else left a note: "who took my yogurt" (it\'s a FREE fridge, Kevin).',
      'Take what you need, leave what you can. A neighbor just left a single, perfect mango.',
    ]));
    else if (m.stage === 1) dialogue.say('fridge', 'Community Fridge', `You've got ${state.count('groceries')}/3 donations. Dee wants the full haul before you open this thing.`);
    else dialogue.say('fridge', 'Community Fridge', 'Contents: one lime. A sticky note reading "stay strong." The lime is trying its best.');
  }

  toggleBike(on: boolean, silent = false) {
    if (on === this.onBike && !silent) return;
    this.onBike = on;
    state.d.player.onBike = on;
    this.player.setTexture(on ? 'player-bike' : 'player', 0);
    this.setPlayerBody();
    if (on && !silent) { state.apply({ flags: { rode_bike: true } }, { quiet: true }); bus.emit('ui:toast', 'BIKE UNLOCKED · [B] TO HOP OFF'); }
  }
  private setPlayerBody() {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (this.onBike) { body.setSize(22, 22).setOffset(13, 13); }
    else { body.setSize(16, 16).setOffset(10, 10); }
  }

  private nearestInteractable(): Interactable | null {
    let best: Interactable | null = null, bd = Infinity;
    const px = this.player.x, py = this.player.y;
    for (const it of this.interactables) {
      const d = Math.hypot(it.x - px, it.y - py);
      if (d < it.r && d < bd && it.label()) { bd = d; best = it; }
    }
    return best;
  }

  private nearPed(): Ped | null { return this.peds.nearest(this.player.x, this.player.y, 56); }

  private nearWall(): BuildingDef | null {
    const px = this.player.x, py = this.player.y;
    return this.layout.buildings.find((b) => px > b.x + 12 && px < b.x + b.w - 12 && py > b.y + b.h - 4 && py < b.y + b.h + 44) ?? null;
  }

  private tryInteract() {
    if (this.mode !== 'play' || ui.blocking() || performance.now() - this.lastDialogueEnd < 250) return;
    const sq = this.opp.nearest(this.player.x, this.player.y, 72);
    if (sq) { dialogue.start('gop', this.opp.debate(sq)); return; }
    const it = this.nearestInteractable();
    if (it) { it.act(); return; }
    const ped = this.nearPed();
    if (ped) {
      ped.pause = 2.5; ped.sprite.setFlipX(this.player.x < ped.sprite.x);
      this.bubble(ped.sprite, Phaser.Utils.Array.GetRandom(PED_LINES[ped.district]));
    }
  }

  private tryAction() {
    if (this.mode !== 'play' || ui.blocking() || performance.now() - this.lastDialogueEnd < 250) return;
    const ped = this.peds.nearest(this.player.x, this.player.y, 60, (p) => !p.gotFlyer);
    if (ped && state.count('flyers') > 0) {
      ped.gotFlyer = true; ped.pause = 2.5;
      // Mission 3: a neighbor who takes a flyer joins the march.
      const m3 = missions.active?.id === 'march' && !state.flag('pvp_spoke');
      if (m3 && this.peds.followers().length < 18) {
        this.peds.recruit(ped);
        state.apply({ inc: { pvp_marchers: 1, pvp_crowd: 1 } }, { quiet: true });
        setTimeout(() => bus.emit('ui:toast', `${state.num('pvp_marchers')} NEIGHBORS MARCHING`), 900);
      }
      state.apply({ items: { flyers: -1 }, attention: 1, mvar: { flyers: 1 }, inc: { flyers_given: 1 } }, { quiet: true });
      bus.emit('ui:toast', `FLYER HANDED · ${state.count('flyers')} LEFT`);
      bus.emit('flyer:handed');
      this.bubble(ped.sprite, Phaser.Utils.Array.GetRandom(FLYER_LINES));
      this.hearts(ped.sprite.x, ped.sprite.y - 40, 3);
      return;
    }
    const wall = this.nearWall();
    if (wall && state.count('posters') > 0) {
      const v = state.d.posters.length % 4;
      const x = this.player.x, y = wall.y + wall.h - 34;
      if (state.d.posters.some((p) => Math.abs(p.x - x) < 36 && Math.abs(p.y - y) < 20)) { bus.emit('ui:toast', 'ALREADY POSTERED HERE'); return; }
      const official = ['police', 'courthouse', 'government'].includes(wall.type);
      state.d.posters.push({ x, y, v });
      this.addPosterSprite(x, y, v, true);
      state.apply({ items: { posters: -1 }, attention: official ? 6 : 3, trust: official ? { downtown: -2 } : { [wall.district]: 1 }, inc: { posters_up: 1 }, toast: official ? 'BOLD. VERY BOLD.' : 'POSTER UP!' });
      return;
    }
    if (this.onBike) { this.toggleBike(false); bus.emit('ui:toast', 'BIKE PARKED (IT WILL BE FINE)'); return; }
    if (ped && state.count('flyers') === 0 && state.count('posters') === 0) this.bubble(ped.sprite, 'Got a flyer? No? Okay.');
  }

  private addPosterSprite(x: number, y: number, v: number, pop = false) {
    const img = this.add.image(x, y, `poster${v}`).setDepth(y + 40).setAngle(Phaser.Math.Between(-6, 6));
    this.minimap?.ignore(img);
    this.posterLayer.push(img);
    if (pop) { img.setScale(0); this.tweens.add({ targets: img, scale: 1, duration: 300, ease: 'Back.out' }); }
  }

  // ------------------------------------------------------------------ FX
  floatText(x: number, y: number, text: string, color = '#fff') {
    const t = this.add.text(x, y, text, { fontFamily: 'Bangers, Impact', fontSize: '24px', color, stroke: '#16101f', strokeThickness: 6 }).setOrigin(0.5).setDepth(1e6).setAngle(Phaser.Math.Between(-8, 8));
    this.minimap.ignore(t);
    this.tweens.add({ targets: t, y: y - 40, alpha: 0, duration: 1000, ease: 'Cubic.out', onComplete: () => t.destroy() });
  }
  bubble(target: Phaser.GameObjects.Sprite, text: string) {
    const t = this.add.text(target.x, target.y - 66, text, {
      fontFamily: 'Nunito, Arial', fontSize: '14px', fontStyle: 'bold', color: '#16101f', backgroundColor: '#ffffff',
      padding: { x: 8, y: 5 }, wordWrap: { width: 220 }, align: 'center',
    }).setOrigin(0.5, 1).setDepth(1e6);
    this.minimap.ignore(t);
    this.tweens.add({ targets: t, alpha: 0, delay: 2600, duration: 400, onComplete: () => t.destroy() });
  }
  hearts(x: number, y: number, n = 6) {
    for (let i = 0; i < n; i++) {
      const h = this.add.image(x, y, i % 2 ? 'heart' : 'spark').setDepth(1e6);
      this.minimap.ignore(h);
      this.tweens.add({ targets: h, x: x + Phaser.Math.Between(-60, 60), y: y - Phaser.Math.Between(30, 90), alpha: 0, scale: 1.4, duration: 900 + i * 40, ease: 'Cubic.out', onComplete: () => h.destroy() });
    }
  }
  // ------------------------------------------------------------------ MISSION 3 · THE PEOPLE VS. THE POWER
  /** Caught by the Free Parking Caucus: a hold-up, and they take something. */
  private heldUp() {
    this.stunUntil = performance.now() + 1800;
    this.cameras.main.shake(200, 0.004);
    const losses: string[] = [];
    if (state.count('flyers') > 0) { const n = Math.min(2, state.count('flyers')); state.apply({ items: { flyers: -n } }, { quiet: true }); losses.push(`-${n} FLYERS`); }
    else if (state.count('posters') > 0) { state.apply({ items: { posters: -1 } }, { quiet: true }); losses.push('-1 POSTER'); }
    if (missions.active?.id === 'march' && this.peds.releaseOne()) { state.apply({ inc: { pvp_marchers: -1, pvp_crowd: -1 } }, { quiet: true }); losses.push('A MARCHER WENT HOME'); }
    state.apply({ solidarity: -5 }, { quiet: true });
    bus.emit('ui:toast', '"JUST ONE QUESTION." IT TOOK FORTY MINUTES.');
    losses.forEach((l, i) => setTimeout(() => bus.emit('ui:toast', l), 300 + i * 260));
  }

  private setupMarch() {
    const sp = this.layout.spots;
    const at = (id: string, from: string, dx: number, dy: number) => { const s = sp[from]; if (s) this.entityPos[id] = { x: s.x + dx, y: s.y + dy }; };
    at('pvp_cp1', 'tyler', 0, 70);   // Luxe Lofts: Tyler's cold brew
    at('pvp_cp2', 'skye', 0, 70);    // Metro Mall-ish: Skye + the sidewalk
    at('pvp_steps', 'gary', 0, 60);  // Borough Hall steps: the speech
  }

  /** Walking the crowd into a checkpoint starts that scene. */
  private marchTriggers() {
    if (missions.active?.id !== 'march' || this.mode !== 'play' || dialogue.active) return;
    if (performance.now() - this.lastDialogueEnd < 2500) return;
    const stage = state.mission('march').stage;
    let id: string | null = null, dlg: string | null = null, owner = 'gary';
    if (stage === 3) {
      if (!state.flag('pvp_cp1')) { id = 'pvp_cp1'; dlg = 'pvp_cp1'; owner = 'tyler'; }
      else if (!state.flag('pvp_cp2')) { id = 'pvp_cp2'; dlg = 'pvp_cp2'; owner = 'skye'; }
    } else if (stage === 4 && !state.flag('pvp_spoke')) { id = 'pvp_steps'; dlg = 'pvp_speech'; }
    if (!id || !dlg) return;
    const p = this.entityPos[id];
    if (p && Math.hypot(p.x - this.player.x, p.y - this.player.y) < 80) dialogue.start(owner, DIALOGUES[dlg]);
  }

  private celebrate(x: number, y: number) { this.hearts(x, y - 30, 20); this.cameras.main.flash(300, 255, 210, 63); }

  // ------------------------------------------------------------------ LOOP
  update(_t: number, deltaMs: number) {
    const dt = Math.min(deltaMs, 50) / 1000;
    const blocking = ui.blocking() || this.mode !== 'play';
    const body = this.player.body as Phaser.Physics.Arcade.Body;


    if (this.mode === 'title') {
      // Attract mode: drift the camera across Brooklyn.
      this.titlePan += dt * 0.05;
      const cam = this.cameras.main; cam.stopFollow();
      cam.centerOn(WORLD_W / 2 + Math.cos(this.titlePan) * WORLD_W * 0.33, WORLD_H / 2 + Math.sin(this.titlePan * 1.3) * WORLD_H * 0.3);
    }

    missions.paused = blocking;
    missions.update(dt);

    if (blocking) {
      body.setVelocity(0, 0);
      this.player.anims.stop();
    } else {
      state.d.playTime += dt;
      const L = this.cursors.left.isDown || this.keys.A.isDown, R = this.cursors.right.isDown || this.keys.D.isDown;
      const U = this.cursors.up.isDown || this.keys.W.isDown, D = this.cursors.down.isDown || this.keys.S.isDown;
      const tv = ui.touchVector();
      let vx = (R ? 1 : 0) - (L ? 1 : 0) + tv.x, vy = (D ? 1 : 0) - (U ? 1 : 0) + tv.y;
      // Press and drag anywhere on the street: the player walks toward the pointer.
      const ptr = this.input.activePointer;
      if (this.dragSteer && ptr.isDown) {
        const wp = ptr.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
        const dx = wp.x - this.player.x, dy = wp.y - this.player.y, dist = Math.hypot(dx, dy);
        if (dist > 14) { const k = Math.min(1, dist / 70); vx += (dx / dist) * k; vy += (dy / dist) * k; }
      }
      const len = Math.hypot(vx, vy);
      const sprint = this.keys.SHIFT.isDown;
      const speed = this.onBike ? (sprint ? BIKE_RUN : BIKE) : sprint ? RUN : WALK;
      if (performance.now() < this.stunUntil) { vx = 0; vy = 0; }
      if (len > 0.1 && performance.now() >= this.stunUntil) {
        vx /= Math.max(1, len); vy /= Math.max(1, len);
        body.setVelocity(vx * speed, vy * speed);
        if (Math.abs(vx) > 0.1) this.facing = vx < 0 ? -1 : 1;
        this.player.setRotation(Math.atan2(vy, vx) + Math.PI / 2);
        const anim = this.onBike ? 'bike-roll' : 'player-walk';
        if (this.player.anims.currentAnim?.key !== anim || !this.player.anims.isPlaying) this.player.play(anim);
        this.player.anims.timeScale = sprint ? 1.6 : 1;
      } else { body.setVelocity(0, 0); this.player.anims.stop(); this.player.setFrame(0); }

    }
    this.player.setDepth(this.player.y);
    this.playerRing.setPosition(this.player.x, this.player.y).setDepth(this.player.y - 1).setVisible(this.mode === 'play');
    { const a = this.player.rotation - Math.PI / 2, d = this.onBike ? 34 : 28; this.playerChevron.setPosition(this.player.x + Math.cos(a) * d, this.player.y + Math.sin(a) * d).setRotation(this.player.rotation).setDepth(this.player.y + 1).setVisible(this.mode === 'play'); }
    state.d.player.x = this.player.x; state.d.player.y = this.player.y;

    // World sim
    const cam = this.cameras.main;
    const view = new Phaser.Geom.Rectangle(cam.worldView.x - 64, cam.worldView.y - 64, cam.worldView.width + 128, cam.worldView.height + 160);
    this.peds.leader = { x: this.player.x, y: this.player.y };
    this.peds.update(dt, view);
    {
      const am = missions.active, st = am ? state.mission(am.id).stage : 0;
      const tp = missions.targets().map((id) => this.entityPos[id]).find(Boolean) ?? null;
      const fast = this.onBike || this.keys.SHIFT.isDown;
      this.opp.update(dt, this.player, fast, !!am && st >= 1 && !blocking, tp, this.peds.followers().length);
    }
    if (!blocking) this.marchTriggers();
    this.traffic.update(dt, this.player, (dx, dy) => { if (this.mode === 'play') { this.player.x += dx; this.player.y += dy; } });

    // Prompt
    if (!blocking) {
      const sq = this.opp.nearest(this.player.x, this.player.y, 72);
      const it = sq ? null : this.nearestInteractable();
      const ped = !it && !sq ? this.nearPed() : null;
      const parts: string[] = [];
      if (sq) parts.push('<span class="pa" data-act="interact"><b>E</b> Debate the Caucus</span>');
      if (it) parts.push(`<span class="pa" data-act="interact"><b>E</b> ${it.label()}</span>`);
      else if (ped) parts.push('<span class="pa" data-act="interact"><b>E</b> Chat</span>');
      const fped = this.peds.nearest(this.player.x, this.player.y, 60, (p) => !p.gotFlyer);
      if (fped && state.count('flyers') > 0) parts.push('<span class="pa" data-act="action"><b>SPACE</b> Hand flyer</span>');
      else if (this.nearWall() && state.count('posters') > 0) parts.push('<span class="pa" data-act="action"><b>SPACE</b> Put up poster</span>');
      ui.setPrompt(parts.join('&nbsp;&nbsp;·&nbsp;&nbsp;'));
      // Touch buttons say what they'll do right now, and dim when there's nothing to do.
      const verb = (l: string) => { const w = l.split(' ')[0].toUpperCase(); return w === 'GRAB' ? 'BIKE' : w === 'TALK' ? 'TALK' : w; };
      const eL = sq ? 'DEBATE' : it ? verb(it.label() ?? '') : ped ? 'CHAT' : null;
      const sL = fped && state.count('flyers') > 0 ? 'FLYER' : this.nearWall() && state.count('posters') > 0 ? 'POSTER' : this.onBike ? 'HOP OFF' : null;
      ui.setTouchLabels(eL, sL);
    } else { ui.setPrompt(''); ui.setTouchLabels(null, null); }

    // District detection
    const d = districtAt(this.player.x, this.player.y);
    if (d !== this.district && this.mode === 'play') { this.district = d; bus.emit('world:district', d, DISTRICTS[d]); }

    // Minimap player marker
    this.mmPlayer.setPosition(this.player.x, this.player.y);
    this.mmPlayer.rotation = Math.atan2(body.velocity.y, body.velocity.x) + Math.PI / 2 || this.mmPlayer.rotation;

    // Waypoint arrow toward nearest target
    const targets = missions.targets().map((id) => this.entityPos[id]).filter(Boolean);
    if (targets.length && this.mode === 'play' && !blocking) {
      let best = targets[0], bd = Infinity;
      for (const t of targets) { const dd = Phaser.Math.Distance.Between(this.player.x, this.player.y, t.x, t.y); if (dd < bd) { bd = dd; best = t; } }
      const ang = Math.atan2(best.y - this.player.y, best.x - this.player.x);
      this.arrow.setVisible(bd > 220);
      this.arrow.setPosition(this.player.x + Math.cos(ang) * 64, this.player.y - 24 + Math.sin(ang) * 64).setRotation(ang);
      ui.setDistance(Math.round(bd / 32));
    } else { this.arrow.setVisible(false); ui.setDistance(null); }

    ui.tick();
  }
}
