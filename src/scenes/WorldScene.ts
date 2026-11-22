import Phaser from 'phaser';
import { bus } from '../core/bus';
import { state } from '../core/state';
import { DISTRICTS, type District } from '../core/types';
import { DIALOGUES } from '../data/dialogues';
import { NPCS, PLAYER_LOOK, type NpcDef } from '../data/npcs';
import { flyerLine, pickLine, STREET_LINES, streetLine } from '../data/chatter';
import { LESSONS } from '../data/lessons';
import { makeBust } from '../world/portraits';
import { Pedestrians, type Ped } from '../entities/pedestrians';
import { Traffic } from '../entities/traffic';
import { DEBATES, Opposition, type OppConfig } from '../entities/opposition';
import { LINE_COLORS, SERVICES, Transit, bullet } from '../entities/transit';
import { drawParks } from '../world/parks';
import { PAINTED } from '../data/landmarks';
import { dialogue } from '../systems/dialogue';
import { missions } from '../systems/missions';
import { ui } from '../ui/ui';
import { BLOCK_H, BLOCK_W, COLS, ROWS, RUNWAYS, RUNWAY_W, geo, neighborhoodOfBlock, GAP_CIRCLE, gapOutline, ROAD, T, TILE, WORLD_H, WORLD_W, districtAt, generateLayout, neighborhoodAt, type BuildingDef, type WorldLayout } from '../world/layout';
import { makeProps } from '../world/textures';
import { signBand } from '../world/golden';
import { storefrontFor } from '../data/storefronts';
import { buildingKey, makeBikeRider, makeBridgeTower, makeBuilding, makeCharacter, makePlayerMarker, makeStreetProps, makeTiles, makeVehicles, shadowKey, shadowOffset, SHADOW_PAD } from '../world/golden';

interface Interactable {
  id: string; x: number; y: number; r: number;
  label: () => string | null; act: () => void;
}

const WALK = 150, RUN = 245, BIKE = 330, BIKE_RUN = 410;

/** Landmarks painted in ChatGPT (magenta keyed out) at public/sprites/<building id>.png */
const PAINTED_LANDMARKS = ['savingsbank', 'centrallib', 'boroughhall', 'kingsish', 'bkmuseum', 'parachute', 'bam'];

export class WorldScene extends Phaser.Scene {
  layout!: WorldLayout;
  player!: Phaser.Physics.Arcade.Sprite;
  keys!: Record<string, Phaser.Input.Keyboard.Key>;
  cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  dragSteer = false;
  opp!: Opposition;
  transit!: Transit;
  stunUntil = 0;
  storeNames = new Set<string>(); // every shop's name, kept unique
  storeKinds: string[] = [];
  dragonSign?: Phaser.GameObjects.Text; dragonMM?: Phaser.GameObjects.Text;
  /** Naim's dragon: 30 seconds of flight over buildings, cars and water */
  private flyUntil = 0; private flyShadow?: Phaser.GameObjects.Ellipse; private flap?: Phaser.Tweens.Tween;
  get flying() { return this.flyUntil > 0; }
  /** Difficulty layers (missions 5+): standing at a stop takes time, set by that neighborhood's Trust */
  private hold: { name: string; t: number; need: number } | null = null;
  private holdRing!: Phaser.GameObjects.Graphics;
  /** Stops finished in the current stage: the ones a wrecker can undo */
  private stageSpots: string[] = [];
  private quietT = 0; private lastAtt = 0; private attDrain = 0; private lastStars = -1;
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
  hood: string | null = null;
  lastDialogueEnd = 0;
  facing = 1;
  titlePan = 0;
  catPets = 0;

  constructor() { super('world'); }

  preload() {
    // Hand-painted likeness portraits (style-study/portraits.html) win over the generated busts.
    for (const id of ['deroy', 'jenna', 'nell', 'bridgette', 'adrian', 'danae', 'jon', 'emily', 'naim', 'luco', 'vega']) this.load.image(`npc-${id}-bust`, `portraits/${id}.jpg`);
    // Ghosts (in period dress) and famous Brooklynites: painted in ChatGPT, Nov 22 2026
    for (const id of ['capone', 'tweed', 'greeley', 'bernstein', 'basquiat', 'tiffany', 'jackie', 'whitman', 'mckinney', 'ebbets', 'chadwick', 'beecher', 'clinton', 'morse', 'chisholm', 'lenahorne', 'biggie', 'rbg', 'yauch',
      'spikelee', 'carmelo', 'rosieperez', 'yasiinbey', 'chrisrock', 'streisand', 'jayz', 'bernie', 'melbrooks', 'mamdani', 'reynoso']) this.load.image(`npc-${id}-bust`, `portraits/${id}.jpg`);
    this.load.image('lmk-liu', 'sprites/liu.png'); // LIU Brooklyn: the Paramount corner and the field, painted in ChatGPT
    this.load.image('barclays-sprite', 'sprites/barclays.png');
    this.load.image('bridge-tower-art', 'sprites/bridgetower.png');
    this.load.image('dragon-art', 'sprites/dragon.png'); // Naim's dragon, painted in ChatGPT
    for (const p of PAINTED) if (p.ready) this.load.image(`lmk-${p.id}`, `sprites/${p.file}.png`); // landmarks placed by coordinates
    this.load.image('gap-island', 'sprites/gap.png'); // Grand Army Plaza's island, painted in ChatGPT, keyed
    for (const id of ['bandshell', 'gwgate', 'carousel', 'conservatory', 'bkcollege']) this.load.image(`park-${id}`, `sprites/${id}.png`); // painted in ChatGPT, keyed
    for (const id of PAINTED_LANDMARKS) this.load.image(`lm-${id}`, `sprites/${id}.png`);
  }

  create() {
    this.layout = generateLayout();
    makeTiles(this); makeVehicles(this); makeStreetProps(this); makeProps(this);
    makeCharacter(this, 'player', PLAYER_LOOK);
    makeBikeRider(this, 'player-bike', PLAYER_LOOK);
    for (const n of NPCS) makeCharacter(this, `npc-${n.id}`, n.look, !(n as any).blockFolk);
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
    if (this.liuWall) this.physics.add.collider(this.player, this.liuWall);

    this.buildNpcs(solids);
    this.setupMarch();
    this.peds = new Pedestrians(this, this.layout, 520); // they gather around wherever you are
    for (const pk of drawParks(this, this.layout, this.miniIgnore)) this.interactables.push(pk); // after the crowd: the Bandshell audience wears their looks
    this.opp = new Opposition(this, this.layout, 6);
    this.transit = new Transit(this, this.layout);
    bus.on('transit:alight', (p: { x: number; y: number }) => { (this.player.body as Phaser.Physics.Arcade.Body).reset(p.x, p.y); this.player.setVisible(true); });
    bus.on('ui:ride', () => this.rideApp());
    bus.on('event:dragon:quiz', () => this.time.delayedCall(250, () => this.dragonQuiz()));
    bus.on('event:dragon:ride', () => this.startDragon());
    bus.on('event:dragon:miss', () => state.setFlag('dragon_next_at', Date.now() + 20_000));
    bus.on('transit:board', (k: string) => state.apply({ flags: { [`rode_${k}`]: true } }, { quiet: true }));
    this.holdRing = this.add.graphics().setDepth(1e6);
    this.miniIgnore.push(this.holdRing);
    bus.on('mission:stage', () => { this.stageSpots = []; this.hold = null; });
    bus.on('opposition:wrecked', (name: string) => this.wrecked(name));
    this.events.on('gop:taunt', (sq: any, t: string) => this.bubble(sq.sprite, t));
    bus.on('opposition:caught', () => this.heldUp());
    bus.on('opposition:outnumbered', () => state.apply({ solidarity: 8 }, { quiet: true }));
    this.traffic = new Traffic(this, (x, y) => this.floatText(x, y - 30, Phaser.Utils.Array.GetRandom(['HONK!', 'BEEP!', 'MOVE!', 'YO!']), '#ffd23f'));
    // Buses and cars see each other: nobody drives through anybody
    this.traffic.buses = () => this.transit.buses.map((b) => b.sprite);
    this.transit.cars = () => this.traffic.vehicles.map((v) => v.sprite);

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
    if (import.meta.env.DEV) { (window as any).__world = this; (window as any).__state = state; (window as any).__missions = missions; (window as any).__dialogue = dialogue; (window as any).__DIALOGUES = DIALOGUES; (window as any).__bus = bus; }
  }

  // ------------------------------------------------------------------ BUILD
  groundLayer!: Phaser.Tilemaps.TilemapLayer;
  private buildGround() {
    const map = this.make.tilemap({ data: this.layout.tiles, tileWidth: TILE, tileHeight: TILE });
    const ts = map.addTilesetImage('tiles', 'tiles', TILE, TILE, 0, 0)!;
    this.groundLayer = map.createLayer(0, ts, 0, 0)!.setDepth(-10);
    map.setCollision([T.WATER, T.OFFMAP]);
  }

  /** A painted sprite's shadow, swept from its base out to the sun offset so it stays attached to the building (one shifted copy looks like it floats). */
  private groundedShadow(key: string, x: number, y: number, w: number, h: number, dx: number, dy: number) {
    const rt = this.add.renderTexture(x, y, w + dx + 4, h + dy + 4).setOrigin(0).setDepth(-5).setAlpha(0.3);
    const stamp = this.make.image({ key, add: false }).setOrigin(0).setDisplaySize(w, h).setTintFill(0x0e0816);
    const n = Math.max(2, Math.ceil(Math.hypot(dx, dy) / 3));
    for (let k = 0; k <= n; k++) rt.draw(stamp, (dx * k) / n, (dy * k) / n);
    stamp.destroy();
    this.miniIgnore.push(rt);
  }

  private buildBuildings(solids: Phaser.Physics.Arcade.StaticGroup) {
    for (const b of this.layout.buildings) {
      makeBuilding(this, b);
      const shd = this.add.image(b.x - SHADOW_PAD, b.y - SHADOW_PAD, shadowKey(b)).setOrigin(0, 0).setDepth(-5);
      this.miniIgnore.push(shd);
      const img = solids.create(b.x + b.w / 2, b.y + b.h / 2, buildingKey(b)) as Phaser.Physics.Arcade.Image;
      img.setDepth(b.y + b.h);
      // Unnamed shops: a named sign over the storefront band (live text, so every shop can have its own name)
      const band = !b.name ? signBand(b) : null;
      if (band) {
        const st = storefrontFor(b.id, b.district, neighborhoodAt(b.x + b.w / 2, b.y + b.h + 20) ?? null, this.storeNames);
        const bg = Phaser.Display.Color.HexStringToColor(st.sign[0]).color;
        const sb = this.add.rectangle(band.x, band.y, band.w, band.h, bg).setOrigin(0).setDepth(b.y + b.h + 0.1);
        const t = this.add.text(band.x + band.w / 2, band.y + band.h / 2 + 0.5, st.name, { fontFamily: 'Nunito, Arial, sans-serif', fontStyle: '900', fontSize: '24px', color: st.sign[1] }).setOrigin(0.5).setDepth(b.y + b.h + 0.2);
        t.setScale(Math.min(8 / 24, (band.w - 6) / t.width)); this.miniIgnore.push(sb, t); this.storeKinds.push(st.kind);
      }
      // Slightly inset collision so the player can hug facades
      (img.body as Phaser.Physics.Arcade.StaticBody).setSize(b.w - 4, b.h - 6).setOffset(2, 0);
      if (this.textures.exists(`lm-${b.id}`)) {
        // A painted landmark: same footprint and collision, drawn as the sprite standing on the block's edge
        img.setVisible(false);
        // The Library's curved entrance is its northwest tip, facing the plaza: keep the steps there walkable
        if (b.id === 'centrallib') (img.body as Phaser.Physics.Arcade.StaticBody).setSize(b.w * 0.84, b.h * 0.84).setOffset(b.w * 0.14, b.h * 0.14);
        const art = this.add.image(b.x + b.w / 2, b.y + b.h, `lm-${b.id}`).setOrigin(0.5, 1);
        art.setDisplaySize(b.w, (b.w * art.height) / art.width).setDepth(b.y + b.h);
        // Collision follows the painted building, not the old footprint (a short sprite leaves no invisible wall above it)
        if (b.id !== 'centrallib') { const ah = Math.min(b.h, art.displayHeight); (img.body as Phaser.Physics.Arcade.StaticBody).setSize(b.w - 4, ah - 6).setOffset(2, b.h - ah); }
        shd.setVisible(false);
        const { dx, dy } = shadowOffset(b);
        this.groundedShadow(`lm-${b.id}`, art.x - art.displayWidth / 2, art.y - art.displayHeight, art.displayWidth, art.displayHeight, dx * 0.5, dy * 0.5);
      }
      if (b.type === 'arena' && this.textures.exists('barclays-sprite')) {
        // The painted arena: the green bowl is solid, the oculus canopy (west end) you walk under
        img.setTexture('barclays-sprite');
        (img.body as Phaser.Physics.Arcade.StaticBody).setSize(b.w * 0.7, b.h * 0.8).setOffset(b.w * 0.29, b.h * 0.08);
        shd.setVisible(false);
        const { dx, dy } = shadowOffset(b);
        this.groundedShadow('barclays-sprite', b.x, b.y, b.w, b.h, dx * 0.5, dy * 0.5);
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
      // The painted granite tower (two open Gothic arches the walkway runs through); the drawn block is the fallback
      const painted = this.textures.exists('bridge-tower-art');
      if (!painted) makeBridgeTower(this, 'bridge-tower', 230, 150);
      const tw = this.add.image(bs.x, bs.y + 20, painted ? 'bridge-tower-art' : 'bridge-tower').setOrigin(0.5, 1).setDepth(5e4);
      if (painted) tw.setDisplaySize(210, (210 * tw.height) / tw.width);
      // The tall painted tower stands near the Brooklyn shore so its top stays inside the world
      const baseY = Math.max(bs.y + 20, tw.displayHeight + 10); tw.setY(baseY);
      const g = this.add.graphics().setDepth(5e4 - 1);
      g.lineStyle(2, 0xece2c8, 0.85);
      const topY = baseY - tw.displayHeight;
      for (const side of [-1, 1]) for (let i = 1; i <= 7; i++) {
        const ax = bs.x + side * (painted ? 80 : 38);
        g.lineBetween(ax, topY + 4, bs.x + side * 50, baseY + i * 20); // toward Brooklyn
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
      // Where the avenue crosses a grid street, the street wins: its own tiles (asphalt, lane lines, the regular
      // intersection crosswalks) are laid back over the avenue's smooth sidewalk band. No extra crosswalks at an angle,
      // and no wedge of sidewalk left inside an intersection.
      const xw = this.add.container(0, 0).setDepth(-8.5);
      const tilesTex = this.textures.get('tiles');
      const ROADT = new Set<number>([T.ASPHALT, T.LANE_V, T.LANE_H, T.INTERSECTION, T.CROSS_V, T.CROSS_H]);
      const reach = av.hw + 2.6 * TILE, done = new Set<string>();
      for (const [a, b] of segs) {
        const dx = b.x - a.x, dy = b.y - a.y, L2 = dx * dx + dy * dy;
        const x0 = Math.floor((Math.min(a.x, b.x) - reach) / TILE), x1 = Math.ceil((Math.max(a.x, b.x) + reach) / TILE);
        const y0 = Math.floor((Math.min(a.y, b.y) - reach) / TILE), y1 = Math.ceil((Math.max(a.y, b.y) + reach) / TILE);
        for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
          const k = this.layout.tiles[ty]?.[tx];
          if (k === undefined || !ROADT.has(k) || done.has(`${tx},${ty}`)) continue;
          if ((tx % BLOCK_W) >= ROAD && (ty % BLOCK_H) >= ROAD) continue; // the avenue's own tiles, not a grid street
          const cx = (tx + 0.5) * TILE, cy = (ty + 0.5) * TILE, t = Math.max(0, Math.min(1, ((cx - a.x) * dx + (cy - a.y) * dy) / L2));
          const d = Math.hypot(cx - a.x - t * dx, cy - a.y - t * dy);
          if (d < av.hw - TILE * 0.3 || d > reach) continue; // under the avenue's roadway, or clear of its sidewalk
          if (!tilesTex.has(`t${k}`)) tilesTex.add(`t${k}`, 0, k * TILE, 0, TILE, TILE);
          xw.add(this.add.image(tx * TILE, ty * TILE, 'tiles', `t${k}`).setOrigin(0));
          done.add(`${tx},${ty}`);
        }
      }
      this.miniIgnore.push(sm, ln, xw);
    }
    this.drawCourts();
    this.drawRunways();
    this.paintedLiu() || this.drawField('liufield', false, 'LIU\'S FIELD BELONGS TO THE UNIVERSITY: ASK LIU. A CITY PARK FIELD? BOOK IT WITH AN NYC PARKS PERMIT, $25 TO PROCESS. (LUCO SAYS HI.)');
    this.drawField('bcfield', true, 'BROOKLYN COLLEGE\'S FIELD: THE COLLEGE BOOKS IT, NOT THE CITY. CITY FIELDS TAKE AN NYC PARKS PERMIT, $25 TO PROCESS.');
    // Grand Army Plaza: the traffic circle and its painted island (arch + Bailey Fountain)
    {
      const g = GAP_CIRCLE, cx = g.x * TILE, cy = g.y * TILE;
      const band = (gr: Phaser.GameObjects.Graphics, d: number) => gr.fillPoints(gapOutline(d).map((p) => ({ x: p.x * TILE, y: p.y * TILE })), true);
      const ring = this.add.graphics().setDepth(-9);
      ring.fillStyle(0xa39c90, 1); band(ring, g.w + 1.2);
      // The four streets (Flatbush/Vanderbilt north-south, Eastern Pkwy/Union St east-west) run straight into the ring:
      // asphalt cuts through the sidewalk band, with a crosswalk where each one meets the circle
      const reachY = (g.ay + g.w + 2.4) * TILE, reachX = (g.ax + g.w + 2.4) * TILE, sw = ROAD * TILE;
      ring.fillStyle(0x24272a, 1);
      ring.fillRect(cx - sw / 2, cy - reachY, sw, reachY * 2);
      ring.fillRect(cx - reachX, cy - sw / 2, reachX * 2, sw);
      ring.fillStyle(0x24272a, 1); band(ring, g.w);
      ring.fillStyle(0x8f8a80, 1); band(ring, 0.25);
      const lane = this.add.graphics().setDepth(-6), mid = gapOutline(g.w / 2, 120);
      lane.lineStyle(3, 0xece6da, 0.7);
      for (let i = 0; i < mid.length; i += 2) { const a = mid[i], b = mid[(i + 1) % mid.length]; lane.lineBetween(a.x * TILE, a.y * TILE, b.x * TILE, b.y * TILE); }
      lane.lineStyle(5, 0xece6da, 0.85);
      for (const sgn of [-1, 1]) {
        const ey = cy + sgn * (g.ay + g.w + 0.7) * TILE, ex = cx + sgn * (g.ax + g.w + 0.7) * TILE;
        for (let k = -1; k <= 1; k++) { lane.lineBetween(cx + k * 26 - 8, ey, cx + k * 26 + 8, ey); lane.lineBetween(ex, cy + k * 26 - 8, ex, cy + k * 26 + 8); }
      }
      this.miniIgnore.push(ring, lane);
      if (this.textures.exists('gap-island')) {
        // Painted from Deroy's satellite, oblique and street photos, north up: JFK bust at the tip, Bailey Fountain, the arch on its own round plaza to the south
        this.miniIgnore.push(this.add.image(cx, cy, 'gap-island').setDisplaySize(2 * g.ax * TILE, 2 * g.ay * TILE).setDepth(-7));
        for (const [ox, oy, w, h] of [[0, g.ay * TILE * 0.62, 80, 46], [0, -g.ay * TILE * 0.4, 44, 56]]) solids.add(this.add.zone(cx + ox, cy + oy, w, h));
      } else { ring.fillStyle(0x58b956, 1); band(ring, 0); }
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
    for (const [k, p] of Object.entries(this.layout.spots)) this.entityPos[`spot:${k}`] = p;
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
      const base = this.layout.spots[n.spot];
      if (!base) { console.warn('no spot for', n.id); continue; }
      const s = n.offset ? { x: base.x + n.offset.dx, y: base.y + n.offset.dy } : base;
      const key = `npc-${n.id}`;
      this.anims.create({ key: `${key}-idle`, frames: this.anims.generateFrameNumbers(key, { frames: [0] }), frameRate: 1, repeat: -1 });
      const spr = this.add.sprite(s.x, s.y, key, 0).setOrigin(0.5, 0.5).setDepth(s.y).setRotation(Math.PI);
      const ghost = !!(n as any).ghost;
      if (ghost) { // ghosts: a pulsing pale-blue aura, a wisp where feet would be, a translucent drifting body
        const glow = this.add.circle(s.x, s.y, 30, 0xcfe8ff, 0.3).setBlendMode(Phaser.BlendModes.ADD).setDepth(s.y - 1);
        const wisp = this.add.ellipse(s.x, s.y + 20, 30, 10, 0xdff0ff, 0.45).setDepth(s.y - 1);
        spr.setTint(0xeaf4ff).setAlpha(0.8).setScale(1.12).setBlendMode(Phaser.BlendModes.SCREEN);
        const t = 1700 + Math.random() * 700;
        this.tweens.add({ targets: spr, y: s.y - 7, alpha: 0.55, duration: t, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
        this.tweens.add({ targets: glow, scale: 1.3, alpha: 0.12, y: s.y - 7, duration: t, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
        this.tweens.add({ targets: wisp, scaleX: 0.6, alpha: 0.15, duration: t, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
        this.miniIgnore.push(glow, wisp);
      }
      spr.play({ key: `${key}-idle` });
      const blocker = solids.create(s.x, s.y - 8, undefined) as Phaser.Physics.Arcade.Image;
      blocker.setVisible(false); (blocker.body as Phaser.Physics.Arcade.StaticBody).setSize(22, 14);
      const tag = this.add.text(s.x, s.y - 40, ghost ? `👻 ${n.short.toUpperCase()}` : n.short.toUpperCase(), { fontFamily: 'Nunito, "Helvetica Neue", Arial, sans-serif', fontSize: '15px', fontStyle: '900', color: ghost ? '#2a3a5a' : '#16101f', backgroundColor: ghost ? '#dfeeff' : n.color, padding: { x: 7, y: 3 }, shadow: { offsetX: 2, offsetY: 2, color: '#16101f', blur: 0, fill: false, stroke: false } }).setOrigin(0.5).setDepth(1e5);
      // A name tag never covers a building (its storefront sign): if it would, it hangs below the person instead
      {
        const hits = () => { const tb = tag.getBounds(); return this.layout.buildings.some((b) => tb.right > b.x && tb.x < b.x + b.w && tb.bottom > b.y && tb.y < b.y + b.h); };
        for (const [dx, dy] of [[0, -40], [0, 34], [-70, 34], [70, 34], [-70, -40], [70, -40], [0, 60]]) { tag.setPosition(s.x + dx, s.y + dy); if (!hits()) break; }
      }
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
    this.minimap.ignore([this.player, this.arrow, ...this.miniIgnore, ...this.peds.sprites(), ...this.opp.sprites(), ...this.traffic.lightSprites]);
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
    if (!(d && dialogue.start(n.id, d))) this.chatWith(n);
    state.addRel(n.id, 0);
  }

  /**
   * Chatting with someone who has nothing mission-related to say. The first time, they pass on one Pocket Civics lesson
   * (a small Solidarity and relationship bump too); after that they never repeat a line until they've said them all.
   */
  private chatWith(n: NpcDef) {
    if (!this.textures.exists(`npc-${n.id}-bust`)) makeBust(this, `npc-${n.id}`, n.look);
    const lines = [...(n.idle ?? []), ...(STREET_LINES[n.district] ?? [])];
    const line = pickLine(`npc:${n.id}`, lines.length ? lines : ['...']);
    if (state.flag(`chat_${n.id}`)) { dialogue.say(n.id, n.id, line); return; }
    const keys = Object.keys(LESSONS), fresh = keys.filter((k) => !state.flag(`lesson_${k}`));
    const pool = fresh.length ? fresh : keys;
    const key = pool[[...n.id].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7) % pool.length];
    dialogue.start(n.id, {
      entries: [{ node: 'a' }],
      nodes: {
        a: { speaker: n.id, text: line, next: 'b' },
        b: { speaker: n.id, text: `Here's something worth knowing around here. ${LESSONS[key].text}`, choices: [{ text: 'Good to know. Thanks.', effects: { solidarity: 5, rel: { [n.id]: 3 }, flags: { [`chat_${n.id}`]: true }, toast: `POCKET CIVICS · ${key}` } }] },
      },
    } as any);
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
    const tr = this.transit;
    if (tr.riding) { if (tr.riding.kind === 'bus') tr.requestStop(); else tr.alight(); return; }
    const sq = this.opp.nearest(this.player.x, this.player.y, 72);
    if (sq) { dialogue.start('gop', this.opp.debate(sq)); return; }
    const it = this.nearestInteractable();
    if (it) { it.act(); return; }
    const stn = tr.stationNear(this.player.x, this.player.y);
    if (stn) { this.takeSubway(stn); return; }
    const stop = tr.stopNear(this.player.x, this.player.y);
    if (stop) { tr.wait(stop.route, stop.stop); return; }
    if (tr.onFlatbush(this.player.x, this.player.y) != null && !tr.hasPending) {
      ui.choose({ title: 'Dollar van', sub: 'Flatbush Ave · $2 cash · hop off anywhere. Most of these vans aren\'t licensed by the TLC.', items: [
        { value: '-1', label: 'Toward Downtown Brooklyn' }, { value: '1', label: 'Toward Kings Plaza' }] }, (v) => tr.hailVan(this.player.x, this.player.y, Number(v) as 1 | -1));
      return;
    }
    const ped = this.nearPed();
    if (ped) {
      ped.pause = 2.5; ped.sprite.setFlipX(this.player.x < ped.sprite.x);
      this.bubble(ped.sprite, streetLine(ped.district, neighborhoodAt(ped.sprite.x, ped.sprite.y)));
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
      this.bubble(ped.sprite, flyerLine());
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
    const k = this.scale.width < 900 ? 16 / 14 / this.cameras.main.zoom : 1; // phones: about 16px on screen, not 12
    const t = this.add.text(target.x, target.y - 66, text, {
      fontFamily: 'Nunito, Arial', fontSize: `${Math.round(14 * k)}px`, fontStyle: 'bold', color: '#16101f', backgroundColor: '#ffffff',
      padding: { x: Math.round(8 * k), y: Math.round(5 * k) }, wordWrap: { width: Math.round(220 * k) }, align: 'center',
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
    const n = missions.active?.number ?? 0, perStar = n >= 5 ? 300 : n >= 3 ? 200 : 0;
    this.stunUntil = performance.now() + 1800 + state.stars() * perStar;
    if (this.hold) { this.hold = null; bus.emit('ui:toast', 'THEY TALKED OVER YOU. START AGAIN.'); }
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

  /**
   * Floyd Bennett Field's four old runways, drawn as ground at their real coordinates (RUNWAYS in layout.ts): weathered concrete, faded edge and
   * centerline dashes, numbers painted at each end. The painted hangars (src/data/landmarks.ts) sit on top.
   */
  private drawRunways() {
    const g = this.add.graphics().setDepth(-8); this.miniIgnore.push(g);
    const W = RUNWAY_W;
    const ends = RUNWAYS.map(([n0, n1, A, B]) => { const a = geo(...A), b = geo(...B); return { n0, n1, a: { x: a.x * TILE, y: a.y * TILE }, b: { x: b.x * TILE, y: b.y * TILE } }; });
    const strip = (a: { x: number; y: number }, b: { x: number; y: number }, w: number, color: number, alpha = 1) => {
      const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy), nx = (-dy / L) * w / 2, ny = (dx / L) * w / 2;
      g.fillStyle(color, alpha).fillPoints([{ x: a.x + nx, y: a.y + ny }, { x: b.x + nx, y: b.y + ny }, { x: b.x - nx, y: b.y - ny }, { x: a.x - nx, y: a.y - ny }], true);
    };
    for (const r of ends) strip(r.a, r.b, W + 8, 0x6f6a5e); // weedy shoulders
    for (const r of ends) strip(r.a, r.b, W, 0x9c978a); // old concrete
    for (const r of ends) {
      const dx = r.b.x - r.a.x, dy = r.b.y - r.a.y, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
      g.lineStyle(2, 0xe8e4d8, 0.55);
      for (const s of [-1, 1]) g.lineBetween(r.a.x + nx * s * (W / 2 - 5), r.a.y + ny * s * (W / 2 - 5), r.b.x + nx * s * (W / 2 - 5), r.b.y + ny * s * (W / 2 - 5));
      g.lineStyle(3, 0xf2eee2, 0.6);
      for (let d = 90; d < L - 90; d += 56) g.lineBetween(r.a.x + ux * d, r.a.y + uy * d, r.a.x + ux * (d + 30), r.a.y + uy * (d + 30)); // centerline dashes
      for (const [p, u, n] of [[r.a, 1, r.n0], [r.b, -1, r.n1]] as const) {
        g.lineStyle(3, 0xf2eee2, 0.6); // threshold bars
        for (let k = -3; k <= 3; k++) { if (!k) continue; const o = (k * W) / 8; g.lineBetween(p.x + nx * o + ux * u * 12, p.y + ny * o + uy * u * 12, p.x + nx * o + ux * u * 40, p.y + ny * o + uy * u * 40); }
        const t = this.add.text(p.x + ux * u * 62, p.y + uy * u * 62, n, { fontFamily: 'monospace', fontSize: '22px', color: '#f2eee2' })
          .setOrigin(0.5).setAlpha(0.6).setDepth(-7).setRotation(Math.atan2(uy * u, ux * u) + Math.PI / 2);
        this.miniIgnore.push(t);
      }
    }
    const c = geo(40.5935, -73.8925);
    this.interactables.push({ id: 'floydbennett_rwy', x: c.x * TILE, y: c.y * TILE, r: 160, label: () => 'Look at the runways', act: () => bus.emit('ui:toast', 'FLOYD BENNETT FIELD, NYC\'S FIRST CITY AIRPORT (1931). FOUR OLD RUNWAYS STILL CROSS THE FIELD.') });
  }

  /** LIU Brooklyn as a painted landmark (campus corner + field), filling the field's lot. Falls back to the drawn field. */
  private liuWall?: Phaser.GameObjects.Zone;
  private paintedLiu() {
    const a = this.layout.spots.liufield_tl, b = this.layout.spots.liufield_br, sp = this.layout.spots.liufield;
    if (!a || !b || !sp || !this.textures.exists('lmk-liu')) return false;
    const w = b.x - a.x + 40, img = this.add.image((a.x + b.x) / 2, b.y + 10, 'lmk-liu').setOrigin(0.5, 1);
    img.setDisplaySize(w, (w * img.height) / img.width).setDepth(b.y); // anyone on the sidewalk below draws in front
    const wall = this.add.zone((a.x + b.x) / 2, (a.y + b.y) / 2, b.x - a.x, b.y - a.y); // solid, like any building
    this.physics.add.existing(wall, true); this.liuWall = wall; // collider added once the player exists
    this.interactables.push({ id: 'liufield', x: sp.x, y: sp.y - 30, r: 140, label: () => 'Book the field', act: () => bus.emit('ui:toast', 'LIU\'S FIELD BELONGS TO THE UNIVERSITY: ASK LIU. A CITY PARK FIELD? BOOK IT WITH AN NYC PARKS PERMIT, $25 TO PROCESS. (LUCO SAYS HI.)') });
    return true;
  }

  /** A turf soccer field (LIU, Brooklyn College): real markings, goals, an optional running track, and who books it on E. */
  private drawField(id: string, track: boolean, lesson: string) {
    let a = this.layout.spots[`${id}_tl`], b = this.layout.spots[`${id}_br`]; const sp = this.layout.spots[id];
    if (!a || !b || !sp) return;
    const g = this.add.graphics().setDepth(-8); this.miniIgnore.push(g);
    if (track) { // red running track around the pitch: an oval of lanes, the field inset inside it
      const tw = b.x - a.x, th = b.y - a.y, r = Math.min(tw, th) / 2;
      g.fillStyle(0xb5492f, 1).fillRoundedRect(a.x, a.y, tw, th, r);
      g.lineStyle(1.5, 0xf2e6dc, 0.8); for (let k = 1; k <= 4; k++) g.strokeRoundedRect(a.x + k * 5, a.y + k * 5, tw - k * 10, th - k * 10, Math.max(4, r - k * 5));
      const ins = 30, ex = tw > th ? 26 : 0, ey = tw > th ? 0 : 26; // extra room at the rounded ends
      a = { x: a.x + ins + ex, y: a.y + ins + ey }; b = { x: b.x - ins - ex, y: b.y - ins - ey };
    }
    const w = b.x - a.x, h = b.y - a.y, vert = h > w; // goals at the short ends
    for (let i = 0; i < 12; i++) { // turf, mowed in stripes across the pitch
      g.fillStyle(i % 2 ? 0x3f9a4a : 0x47a653, 1);
      if (vert) g.fillRect(a.x, a.y + (h / 12) * i, w, h / 12 + 1); else g.fillRect(a.x + (w / 12) * i, a.y, w / 12 + 1, h);
    }
    // local frame: u runs goal to goal, v across
    const m = 10, len = (vert ? h : w) - 2 * m, wid = (vert ? w : h) - 2 * m;
    const P = (u: number, v: number) => (vert ? { x: a.x + m + v, y: a.y + m + u } : { x: a.x + m + u, y: a.y + m + v });
    const box = (u0: number, v0: number, u1: number, v1: number) => { const p = P(u0, v0), q = P(u1, v1); g.strokeRect(Math.min(p.x, q.x), Math.min(p.y, q.y), Math.abs(q.x - p.x), Math.abs(q.y - p.y)); };
    const line = (u0: number, v0: number, u1: number, v1: number) => { const p = P(u0, v0), q = P(u1, v1); g.lineBetween(p.x, p.y, q.x, q.y); };
    const vm = wid / 2, um = len / 2, cr = wid * 0.17;
    g.lineStyle(2.5, 0xf4f4ee, 0.95);
    box(0, 0, len, wid); line(um, 0, um, wid);
    const c = P(um, vm); g.strokeCircle(c.x, c.y, cr); g.fillStyle(0xf4f4ee, 1).fillCircle(c.x, c.y, 2.5);
    for (const [u, d] of [[0, 1], [len, -1]] as const) {
      const pl = len * 0.15, pw = wid * 0.6, gl = len * 0.055, gw = wid * 0.3;
      box(u, vm - pw / 2, u + d * pl, vm + pw / 2); // penalty box
      box(u, vm - gw / 2, u + d * gl, vm + gw / 2); // six-yard box
      const spot = P(u + d * pl * 0.72, vm); g.fillStyle(0xf4f4ee, 1).fillCircle(spot.x, spot.y, 2.5);
      g.lineStyle(4, 0xffffff, 1); box(u - d * 8, vm - wid * 0.08, u, vm + wid * 0.08); g.lineStyle(2.5, 0xf4f4ee, 0.95); // goal
    }
    this.interactables.push({ id, x: sp.x, y: sp.y - 30, r: 120, label: () => 'Book the field', act: () => bus.emit('ui:toast', lesson) });
  }

  /**
   * Basketball courts: every patch of court tiles gets real markings (boundary, half-court line, center circle,
   * red keys, three-point arcs) and hoops where none are standing. Long strips (Pier 2) become several courts.
   */
  private drawCourts() {
    const L = this.layout, H = L.tiles.length, W = L.tiles[0].length, seen = new Uint8Array(W * H);
    const g = this.add.graphics().setDepth(-8);
    this.miniIgnore.push(g);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (seen[y * W + x] || L.tiles[y][x] !== T.COURT) continue;
      let x1 = x; while (x1 + 1 < W && L.tiles[y][x1 + 1] === T.COURT) x1++;
      let y1 = y; while (y1 + 1 < H && L.tiles[y1 + 1][x] === T.COURT) y1++;
      for (let yy = y; yy <= y1; yy++) for (let xx = x; xx <= x1; xx++) seen[yy * W + xx] = 1;
      const bx = x * TILE, by = y * TILE, bw = (x1 - x + 1) * TILE, bh = (y1 - y + 1) * TILE;
      if (bw < 3 * TILE || bh < 2 * TILE) continue;
      const horiz = bw >= bh, long = horiz ? bw : bh, short = horiz ? bh : bw;
      const n = Math.max(1, Math.round(long / (short * 1.9))); // a court is about 94 x 50 ft
      const hasHoops = L.props.some((p) => p.kind === 'hoop' && p.x >= bx - 40 && p.x <= bx + bw + 40 && p.y >= by - 40 && p.y <= by + bh + 40);
      for (let i = 0; i < n; i++) {
        // court i in local coordinates (u along the long axis, v across)
        const u0 = (long / n) * i + 8, u1 = (long / n) * (i + 1) - 8, v0 = 8, v1 = short - 8;
        const P = (u: number, v: number) => (horiz ? { x: bx + u, y: by + v } : { x: bx + v, y: by + u });
        const rect = (ua: number, va: number, ub: number, vb: number) => { const a = P(ua, va), b = P(ub, vb); return [Math.min(a.x, b.x), Math.min(a.y, b.y), Math.abs(b.x - a.x), Math.abs(b.y - a.y)] as const; };
        const um = (u0 + u1) / 2, vm = (v0 + v1) / 2, len = u1 - u0, wid = v1 - v0;
        const keyL = len * 0.2, keyW = wid * 0.32, arcR = wid * 0.44, circR = wid * 0.13;
        // red painted keys
        g.fillStyle(0xb8432f, 1);
        g.fillRect(...rect(u0, vm - keyW / 2, u0 + keyL, vm + keyW / 2)); g.fillRect(...rect(u1 - keyL, vm - keyW / 2, u1, vm + keyW / 2));
        g.lineStyle(2.5, 0xf2efe6, 0.95);
        g.strokeRect(...rect(u0, v0, u1, v1));
        const a = P(um, v0), b = P(um, v1); g.lineBetween(a.x, a.y, b.x, b.y); // half-court line
        const c = P(um, vm); g.strokeCircle(c.x, c.y, circR);
        g.strokeRect(...rect(u0, vm - keyW / 2, u0 + keyL, vm + keyW / 2)); g.strokeRect(...rect(u1 - keyL, vm - keyW / 2, u1, vm + keyW / 2));
        for (const [end, dir] of [[u0, 1], [u1, -1]] as const) {
          const ctr = P(end + dir * len * 0.06, vm);
          const base = horiz ? (dir > 0 ? 0 : Math.PI) : (dir > 0 ? Math.PI / 2 : -Math.PI / 2);
          g.beginPath(); g.arc(ctr.x, ctr.y, arcR, base - Math.PI / 2, base + Math.PI / 2); g.strokePath(); // three-point arc
          const ft = P(end + dir * keyL, vm); g.strokeCircle(ft.x, ft.y, keyW / 2); // free-throw circle
          if (!hasHoops) { // backboard and orange rim
            const bb0 = P(end + dir * 4, vm - wid * 0.09), bb1 = P(end + dir * 4, vm + wid * 0.09);
            g.lineStyle(4, 0xf2f2f2, 1); g.lineBetween(bb0.x, bb0.y, bb1.x, bb1.y);
            g.lineStyle(2.5, 0xff7a1a, 1); g.strokeCircle(ctr.x, ctr.y, 6);
            g.lineStyle(2.5, 0xf2efe6, 0.95);
          }
        }
      }
    }
  }

  // ------------------------------------------------------------------ NAIM'S DRAGON
  /** Naim's question: a myth vs. a real fact you've learned. Right answer: a dragon for 30 seconds. */
  private dragonQuiz() {
    const d = Phaser.Utils.Array.GetRandom(DEBATES);
    const opts = Phaser.Utils.Array.Shuffle([
      { text: d.right, effects: { event: 'dragon:ride' }, next: 'yes' },
      { text: d.wrong[0], effects: { event: 'dragon:miss' }, next: 'no' },
      { text: d.wrong[1], effects: { event: 'dragon:miss' }, next: 'no' },
    ]);
    dialogue.start('naim', { entries: [{ node: 'q' }], nodes: {
      q: { speaker: 'naim', text: `Dragon question! Somebody on my block said: "${d.q}" What's actually true?`, choices: opts },
      yes: { speaker: 'naim', text: 'CORRECT. *He whistles with two fingers. Something enormous lands in the street.* You have thirty seconds. Don\'t fly over the Caucus. Actually, do.' },
      no: { speaker: 'naim', text: 'Nope. Dragons only listen to facts. Check your notebook and ask me again in a few seconds.' },
    } });
  }

  private startDragon() {
    if (this.transit.riding) return;
    if (this.onBike) this.toggleBike(false, true);
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    this.flyUntil = performance.now() + 30_000;
    state.setFlag('dragon_ready', false); state.setFlag('dragon_next_at', Date.now() + 90_000);
    body.checkCollision.none = true; this.player.anims.stop();
    if (this.textures.exists('dragon-art')) this.player.setTexture('dragon-art').setScale(0.62);
    else this.player.setTint(0x7fd4c8).setScale(2.2);
    this.flyShadow = this.add.ellipse(this.player.x, this.player.y, 90, 50, 0x000000, 0.25).setDepth(5e4);
    this.minimap.ignore(this.flyShadow);
    this.flap = this.tweens.add({ targets: this.player, scaleX: this.player.scaleX * 0.9, duration: 220, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    bus.emit('ui:toast', '🐉 DRAGON! 30 SECONDS. OVER THE BUILDINGS, OVER THE CARS, OVER THE CAUCUS.');
  }

  private endDragon() {
    this.flyUntil = 0; this.flap?.stop(); this.flyShadow?.destroy(); this.flyShadow = undefined;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    this.player.clearTint().setScale(1).setTexture(this.onBike ? 'player-bike' : 'player', 0);
    this.setPlayerBody(); body.checkCollision.none = false;
    const land = this.transit.nearestSidewalk(this.player.x, this.player.y, 30); // never land on a roof or in the river
    if (land) body.reset(land.x, land.y);
    bus.emit('ui:toast', 'THE DRAGON SETS YOU DOWN GENTLY AND FLIES BACK TO NAIM. (BACK IN 90 SECONDS.)');
  }

  /** Flight timer, and whether Naim can offer a ride right now */
  private dragonTick() {
    if (this.flying) {
      this.player.setDepth(1e5);
      this.flyShadow?.setPosition(this.player.x + 26, this.player.y + 40);
      if (performance.now() >= this.flyUntil) this.endDragon();
    }
    const ready = !!state.flag('met_naim') && !this.flying && Date.now() >= (Number(state.flag('dragon_next_at')) || 0);
    if (ready !== !!state.flag('dragon_ready')) state.setFlag('dragon_ready', ready);
    // Easy to find: a sign over Naim and a dragon on the minimap whenever a ride is waiting (even before you've met him)
    const show = !this.flying && Date.now() >= (Number(state.flag('dragon_next_at')) || 0), np = this.entityPos.naim;
    if (show && np && !this.dragonSign) {
      this.dragonSign = this.add.text(np.x, np.y - 70, state.flag('met_naim') ? '🐉 DRAGON RIDE' : '🐉 ASK NAIM ABOUT HIS DRAGON', { fontFamily: 'Bangers, Impact, sans-serif', fontSize: '26px', color: '#ffe36b', stroke: '#2a1440', strokeThickness: 5 }).setOrigin(0.5, 1).setDepth(1e6);
      this.tweens.add({ targets: this.dragonSign, y: np.y - 84, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      this.dragonMM = this.add.text(np.x, np.y, '🐉', { fontSize: '260px' }).setOrigin(0.5).setDepth(2e6);
      this.minimap?.ignore(this.dragonSign); this.cameras.main.ignore(this.dragonMM);
      if (!state.flag('dragon_hint')) { state.setFlag('dragon_hint', true); bus.emit('ui:toast', 'NAIM HAS A DRAGON. FIND HIM BY THE CENTRAL LIBRARY (🐉 ON YOUR MINIMAP).'); }
    } else if (!show && this.dragonSign) { this.dragonSign.destroy(); this.dragonMM?.destroy(); this.dragonSign = undefined; this.dragonMM = undefined; }
    if (this.dragonSign && np && state.flag('met_naim') && this.dragonSign.text !== '🐉 DRAGON RIDE') this.dragonSign.setText('🐉 DRAGON RIDE');
  }

  /** Where the mission wants you (the nearest target), for "closest stop to your objective" */
  private objectivePos() {
    const ts = missions.targets().map((id) => this.entityPos[id]).filter(Boolean) as { x: number; y: number }[];
    let best: { x: number; y: number } | null = null, bd = Infinity;
    for (const t of ts) { const d = Math.hypot(t.x - this.player.x, t.y - this.player.y); if (d < bd) { bd = d; best = t; } }
    return best;
  }

  private takeSubway(from: { st: { id: string; name: string; routes: string[]; ada: number }; x: number; y: number }) {
    const tr = this.transit, obj = this.objectivePos(), near = obj ? tr.nearestStation(obj.x, obj.y)?.p : null;
    const items = tr.stations.filter((p) => p.st.id !== from.st.id).sort((a, b) => a.st.name.localeCompare(b.st.name)).map((p) => {
      const pl = tr.plan(from.st.id, p.st.id);
      return { value: p.st.id, label: p.st.name, html: `${p.st.routes.map(bullet).join('')} ${p.st.name}${p.st.ada === 1 ? ' ♿' : ''}`,
        sub: pl ? `${pl.stops} stops${pl.transfers ? ` · ${pl.transfers} transfer${pl.transfers > 1 ? 's' : ''}` : ''} · ${neighborhoodAt(p.x, p.y) ?? ''}` : 'No route', group: 'All Brooklyn stations' };
    });
    if (near && near.st.id !== from.st.id) { const it = items.find((i) => i.value === near.st.id); if (it) items.unshift({ ...it, group: 'Closest to your objective' }); }
    const ada = from.st.ada === 1 ? '♿ Elevator access.' : from.st.ada === 2 ? '♿ Partly accessible (one direction only).' : '<b>Stairs only.</b> ' + Transit.adaLine();
    ui.choose({ title: from.st.name, sub: `${from.st.routes.map(bullet).join('')} Tap in: $3 (Fair Fares: $1.50). ${ada}`, items, search: true }, (id) => {
      const pl = tr.plan(from.st.id, id), dest = tr.byId[id];
      if (!pl || !dest) { bus.emit('ui:toast', 'NO TRAINS. (PLANNED WORK.)'); return; }
      const name = (sid: string) => tr.byId[sid]?.st.name ?? sid;
      ui.rideSubway(pl.legs.map((l) => ({ route: l.route, color: LINE_COLORS[l.route] ?? '#888', dark: 'NQRW'.includes(l.route), stops: l.stops.map(name) })), () => {
        (this.player.body as Phaser.Physics.Arcade.Body).reset(dest.x, dest.y + 40);
        state.apply({ flags: { rode_subway: true } }, { quiet: true });
        bus.emit('ui:toast', `YOU COME UP AT ${dest.st.name.toUpperCase()}`);
        if (dest.st.ada !== 1 && !state.flag('seen_ada')) { state.setFlag('seen_ada', true); setTimeout(() => bus.emit('ui:toast', Transit.adaLine().toUpperCase()), 900); }
      });
    });
  }

  /** Ride apps and the car service: from anywhere. They cost Solidarity. */
  private rideApp() {
    if (this.mode !== 'play' || ui.blocking()) return;
    const tr = this.transit;
    if (tr.riding) { bus.emit('ui:toast', 'YOU\'RE ALREADY IN A VEHICLE.'); return; }
    if (tr.hasPending) { tr.cancelPending(); bus.emit('ui:toast', 'RIDE CANCELED. THE DRIVER RATES YOU ONE STAR.'); return; }
    ui.choose({ title: 'Get a ride', sub: 'Faster than the bus. Costs Solidarity: your comrades are watching.', items: SERVICES.map((s) => ({ value: s.id, label: s.name, sub: s.tag })) }, (svc) => {
      const obj = this.objectivePos();
      const acc: Record<string, [number, number, number]> = {};
      for (let r = 0; r < ROWS; r++) for (let k = 0; k < COLS; k++) {
        const nm = neighborhoodOfBlock(k, r); if (!nm) continue;
        const a = (acc[nm] ??= [0, 0, 0]); a[0] += (k * BLOCK_W + ROAD + (BLOCK_W - ROAD) / 2) * TILE; a[1] += (r * BLOCK_H + ROAD + (BLOCK_H - ROAD) / 2) * TILE; a[2]++;
      }
      const dests = Object.entries(acc).map(([nm, [x, y, n]]) => ({ name: nm, x: x / n, y: y / n })).sort((a, b) => a.name.localeCompare(b.name));
      const items = [
        ...(obj ? [{ value: 'obj', label: 'Your objective', sub: neighborhoodAt(obj.x, obj.y) ?? '', group: 'Mission' }] : []),
        ...dests.map((d, i) => ({ value: String(i), label: d.name, group: 'Neighborhoods' })),
      ];
      ui.choose({ title: SERVICES.find((s) => s.id === svc)!.name, sub: 'Where to?', items, search: true }, (v) => {
        const dest = v === 'obj' && obj ? { x: obj.x, y: obj.y, name: 'your objective' } : { ...dests[Number(v)] };
        tr.callRide(svc, this.player, dest);
      });
    });
  }

  /** Mission stages can target a place (`spot:<name>`): getting there sets the flag `at_<name>`. */
  private spotArrivals(dt: number) {
    const n = missions.active?.number ?? 0;
    let inside: string | null = null;
    for (const id of missions.targets()) {
      if (!id.startsWith('spot:')) continue;
      const name = id.slice(5), p = this.layout.spots[name];
      if (!p || state.flag(`at_${name}`) || Math.hypot(p.x - this.player.x, p.y - this.player.y) >= 90) continue;
      inside = name;
      const need = n >= 5 ? this.holdTime(p) : n >= 3 ? this.holdTime(p) * 0.6 : 0; // 3–4: a shorter pitch
      if (need > 0) {
        if (this.hold?.name !== name) this.hold = { name, t: 0, need };
        this.hold.t += dt;
        if (this.hold.t < this.hold.need) break;
      }
      this.hold = null;
      this.stageSpots.push(name); // before apply: if this finishes the stage, the stage reset clears it
      state.apply({ flags: { [`at_${name}`]: true } });
      this.celebrate(this.player.x, this.player.y);
      this.maybeWreck(n);
      break;
    }
    if (!inside) this.hold = null;
    this.holdRing.clear();
    if (this.hold) {
      const k = Math.min(1, this.hold.t / this.hold.need), r = 40;
      this.holdRing.lineStyle(8, 0x000000, 0.35).strokeCircle(this.player.x, this.player.y, r);
      this.holdRing.lineStyle(6, 0xffd23f, 1).beginPath().arc(this.player.x, this.player.y, r, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2).strokePath();
    }
  }

  /** Seconds of talking it takes to win a stop over: 1 with strong Trust, 3 at zero, 4 if they distrust you. */
  private holdTime(p: { x: number; y: number }) {
    const tr = state.d.trust[districtAt(p.x, p.y)] ?? 0;
    return Phaser.Math.Clamp(3 - tr / 25, 1, 4);
  }

  /** Missions 7+: after you finish a stop, the Caucus may send someone to undo one. */
  private maybeWreck(n: number) {
    if (n < 7 || this.opp.wrecking()) return;
    const left = missions.targets().filter((t) => t.startsWith('spot:') && !state.flag(`at_${t.slice(5)}`));
    if (!left.length || !this.stageSpots.length) return;
    const chance = Math.min(0.9, 0.4 + (n - 7) * 0.08 + state.stars() * 0.1);
    if (Math.random() > chance) return;
    this.time.delayedCall(2500, () => {
      const name = Phaser.Utils.Array.GetRandom(this.stageSpots.filter((s) => state.flag(`at_${s}`)));
      const p = name && this.layout.spots[name];
      if (!p || !missions.active || this.mode !== 'play') return;
      if (this.opp.dispatchWrecker(name, p, this.player)) {
        bus.emit('ui:toast', state.flag('seen_wrecker') ? 'THE CAUCUS IS GOING BACK TO UNDO A STOP' : 'THE CAUCUS IS HEADING TO UNDO YOUR WORK. HEAD THEM OFF!');
        state.setFlag('seen_wrecker', true);
      }
    });
  }

  private wrecked(name: string) {
    if (!missions.active || !state.flag(`at_${name}`)) return;
    this.stageSpots = this.stageSpots.filter((s) => s !== name);
    state.apply({ flags: { [`at_${name}`]: false }, solidarity: -10 }, { quiet: true });
    bus.emit('ui:toast', 'THE CAUCUS TALKED THEM OUT OF IT. GO BACK.');
    this.cameras.main.shake(250, 0.004);
  }

  /** Difficulty for the Caucus right now: later missions and more stars mean more of them, faster, sooner.
   *  Tiers: 1–2 learning · 3–4 stars start to matter · 5+ full pressure · 7+ wreckers · 10+ one more, faster. */
  private oppConfig(): OppConfig {
    const n = missions.active?.number ?? 0, st = state.stars();
    if (n < 3) return { limit: 3, chase: 170, wreck: 110, respawn: 35 };
    if (n < 5) return { limit: 3 + (st >= 4 ? 1 : 0), chase: 170 + st * 5, wreck: 110, respawn: Math.max(20, 35 - st * 3) }; // 3–4: stars start to matter
    return {
      limit: Math.min(6, 3 + (n >= 10 ? 1 : 0) + (st >= 3 ? 1 : 0) + (st >= 5 ? 1 : 0)),
      chase: 170 + st * 9 + (n >= 10 ? 8 : 0), // tops out at 223: a sprint (245) still gets away
      wreck: 80 + st * 6, // slower than a walk (150): you can always get back in time if you go now
      respawn: Math.max(12, 35 - st * 5),
    };
  }

  /** Attention drains when you lie low (no new attention for 12 seconds), and the stars go with it. */
  private attentionTick(dt: number) {
    const a = state.d.attention;
    if (a > this.lastAtt) this.quietT = 0; else this.quietT += dt;
    if (this.quietT > 12 && a > 0) {
      this.attDrain += dt;
      if (this.attDrain >= 2) { this.attDrain = 0; state.d.attention = a - 1; state.changed(); }
    }
    this.lastAtt = state.d.attention;
    const st = state.stars();
    if (this.lastStars >= 0 && st !== this.lastStars) {
      const s = '★'.repeat(st) || 'NO STARS';
      bus.emit('ui:toast', st > this.lastStars ? `${s} · THE CAUCUS HAS NOTICED YOU` : `${s} · LYING LOW`);
    }
    this.lastStars = st;
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

    missions.paused = blocking && !ui.timerRuns();
    missions.update(dt);

    const rideAt = this.mode === 'play' ? this.transit.update(dt, this.player) : null;
    if (rideAt) { body.reset(rideAt.x, rideAt.y); this.player.setVisible(false); }
    if (blocking || rideAt) {
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
      const speed = this.flying ? 600 : this.onBike ? (sprint ? BIKE_RUN : BIKE) : sprint ? RUN : WALK;
      if (performance.now() < this.stunUntil) { vx = 0; vy = 0; }
      if (len > 0.1 && performance.now() >= this.stunUntil) {
        vx /= Math.max(1, len); vy /= Math.max(1, len);
        body.setVelocity(vx * speed, vy * speed);
        if (Math.abs(vx) > 0.1) this.facing = vx < 0 ? -1 : 1;
        this.player.setRotation(Math.atan2(vy, vx) + Math.PI / 2);
        const anim = this.onBike ? 'bike-roll' : 'player-walk';
        if (!this.flying && (this.player.anims.currentAnim?.key !== anim || !this.player.anims.isPlaying)) this.player.play(anim); // the walk cycle would swap the dragon back to you
        this.player.anims.timeScale = sprint ? 1.6 : 1;
      } else { body.setVelocity(0, 0); this.player.anims.stop(); if (!this.flying) this.player.setFrame(0); }

    }
    this.player.setDepth(this.flying ? 6e4 : this.player.y); // the dragon flies over the buildings
    this.playerRing.setPosition(this.player.x, this.player.y).setDepth(this.player.y - 1).setVisible(this.mode === 'play' && !rideAt);
    { const a = this.player.rotation - Math.PI / 2, d = this.onBike ? 34 : 28; this.playerChevron.setPosition(this.player.x + Math.cos(a) * d, this.player.y + Math.sin(a) * d).setRotation(this.player.rotation).setDepth(this.player.y + 1).setVisible(this.mode === 'play' && !rideAt); }
    state.d.player.x = this.player.x; state.d.player.y = this.player.y;

    // World sim
    const cam = this.cameras.main;
    const view = new Phaser.Geom.Rectangle(cam.worldView.x - 64, cam.worldView.y - 64, cam.worldView.width + 128, cam.worldView.height + 160);
    this.peds.leader = { x: this.player.x, y: this.player.y };
    this.peds.update(dt, view);
    {
      const am = missions.active, st = am ? state.mission(am.id).stage : 0;
      const tp = missions.targets().map((id) => this.entityPos[id]).find(Boolean) ?? null;
      const fast = this.onBike || this.keys.SHIFT.isDown || this.flying;
      this.opp.update(dt, this.player, fast, !!am && !am.side && st >= 1 && !blocking && !rideAt, tp, this.peds.followers().length, this.oppConfig());
    }
    if (!blocking && !rideAt) { this.marchTriggers(); this.spotArrivals(dt); }
    else this.holdRing.clear();
    if (!blocking && this.mode === 'play') this.attentionTick(dt);
    this.traffic.update(dt, this.player, (dx, dy) => { if (this.mode === 'play' && !this.flying) { this.player.x += dx; this.player.y += dy; } });
    this.dragonTick();

    // Prompt
    if (!blocking) {
      const tr = this.transit, R = tr.riding;
      const sq = R ? null : this.opp.nearest(this.player.x, this.player.y, 72);
      const it = sq || R ? null : this.nearestInteractable();
      const stn = !sq && !it && !R ? tr.stationNear(this.player.x, this.player.y) : null;
      const stop = !sq && !it && !stn && !R ? tr.stopNear(this.player.x, this.player.y) : null;
      const van = !sq && !it && !stn && !stop && !R && !tr.hasPending && tr.onFlatbush(this.player.x, this.player.y) != null;
      const ped = !it && !sq && !stn && !stop && !R ? this.nearPed() : null;
      const parts: string[] = [];
      if (this.flying) parts.push(`<span class="pa">🐉 DRAGON · ${Math.max(0, Math.ceil((this.flyUntil - performance.now()) / 1000))}s</span>`);
      if (R) parts.push(`<span class="pa" data-act="interact"><b>E</b> ${R.kind === 'bus' ? (R.request ? 'Stop requested' : 'Request the next stop') : R.kind === 'van' ? 'Get off here' : 'Get out here'}</span>`);
      if (stn) parts.push(`<span class="pa" data-act="interact"><b>E</b> Subway: ${stn.st.name} ${stn.st.routes.map(bullet).join('')}</span>`);
      if (stop) parts.push(`<span class="pa" data-act="interact"><b>E</b> ${tr.waiting?.stop === stop.stop ? 'Waiting for the' : 'Wait for the'} ${stop.route.id}</span>`);
      if (van) parts.push('<span class="pa" data-act="interact"><b>E</b> Hail a dollar van</span>');
      if (this.hold) parts.push(`<span class="pa">Winning them over… ${Math.max(0, this.hold.need - this.hold.t).toFixed(1)}s · stay close</span>`);
      if (sq) parts.push('<span class="pa" data-act="interact"><b>E</b> Debate the Caucus</span>');
      if (it) parts.push(`<span class="pa" data-act="interact"><b>E</b> ${it.label()}</span>`);
      else if (ped) parts.push('<span class="pa" data-act="interact"><b>E</b> Chat</span>');
      const fped = this.peds.nearest(this.player.x, this.player.y, 60, (p) => !p.gotFlyer);
      if (fped && state.count('flyers') > 0) parts.push('<span class="pa" data-act="action"><b>SPACE</b> Hand flyer</span>');
      else if (this.nearWall() && state.count('posters') > 0) parts.push('<span class="pa" data-act="action"><b>SPACE</b> Put up poster</span>');
      ui.setPrompt(parts.join('&nbsp;&nbsp;·&nbsp;&nbsp;'));
      // Touch buttons say what they'll do right now, and dim when there's nothing to do.
      const verb = (l: string) => { const w = l.split(' ')[0].toUpperCase(); return w === 'GRAB' ? 'BIKE' : w === 'TALK' ? 'TALK' : w; };
      const eL = R ? (R.kind === 'bus' ? 'STOP' : 'OFF') : sq ? 'DEBATE' : it ? verb(it.label() ?? '') : stn ? 'SUBWAY' : stop ? 'WAIT' : van ? 'HAIL' : ped ? 'CHAT' : null;
      const sL = fped && state.count('flyers') > 0 ? 'FLYER' : this.nearWall() && state.count('posters') > 0 ? 'POSTER' : this.onBike ? 'HOP OFF' : null;
      ui.setTouchLabels(eL, sL);
    } else { ui.setPrompt(''); ui.setTouchLabels(null, null); }

    // District detection
    // Neighborhood banner: the real neighborhood you just walked into (the district still drives trust)
    const d = districtAt(this.player.x, this.player.y), hood = neighborhoodAt(this.player.x, this.player.y);
    if (hood && hood !== this.hood && this.mode === 'play') {
      this.hood = hood; this.district = d;
      const info = DISTRICTS[d], own = hood.toLowerCase() === info.name.toLowerCase();
      bus.emit('world:district', d, { ...info, name: hood, blurb: own ? info.blurb : '' });
    }

    // Minimap player marker
    this.mmPlayer.setPosition(this.player.x, this.player.y);
    this.mmPlayer.rotation = Math.atan2(body.velocity.y, body.velocity.x) + Math.PI / 2 || this.mmPlayer.rotation;

    // Waypoint arrow toward nearest target
    const targets = missions.targets().map((id) => this.entityPos[id]).filter(Boolean);
    const wr = this.opp.wrecking();
    if (wr) targets.push({ x: wr.sprite.x, y: wr.sprite.y });
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
