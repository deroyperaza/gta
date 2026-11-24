import Phaser from 'phaser';
import { bus } from '../core/bus';
import { state } from '../core/state';
import { DISTRICTS, type District } from '../core/types';
import { DIALOGUES } from '../data/dialogues';
import { NPCS, PLAYER_LOOK, type NpcDef } from '../data/npcs';
import { CAMEOS } from '../data/cameos';
import { labelColor } from '../data/labels';
import { NONPROFITS } from '../data/nonprofits';
import { flyerLine, pickLine, STREET_LINES, streetLine } from '../data/chatter';
import { LESSONS } from '../data/lessons';
import { makeBust } from '../world/portraits';
import { Pedestrians, type Ped } from '../entities/pedestrians';
import { BallGames, type Court } from '../entities/ballgames';
import { HOOD_LANGS, LANGS } from '../data/languages';
import { LINES } from '../world/transitData';
import { driverFor } from '../data/drivers';
import { CHAR_RES, DPR, PLAYER_RES } from '../core/res';
import { Traffic } from '../entities/traffic';
import { DEBATES, Opposition, type OppConfig } from '../entities/opposition';
import { LINE_COLORS, SERVICES, Transit, bullet } from '../entities/transit';
import { drawParks } from '../world/parks';
import { PAINTED } from '../data/landmarks';
import { dialogue } from '../systems/dialogue';
import { missions } from '../systems/missions';
import type { MissionDef } from '../data/missions';
import { ui, type ChoiceItem } from '../ui/ui';
import { BLOCK_H, BLOCK_W, COLS, ROWS, RUNWAYS, RUNWAY_W, geo, neighborhoodOfBlock, GAP_CIRCLE, gapOutline, ROAD, T, TILE, WORLD_H, WORLD_W, districtAt, generateLayout, neighborhoodAt, type BuildingDef, type WorldLayout } from '../world/layout';
import { makeProps } from '../world/textures';
import { signBand } from '../world/golden';
import { POOL, NET_PICKS, netPicks } from '../data/mission-modules/network';
import { storefrontFor } from '../data/storefronts';
import { buildingKey, makeBikeRider, makeBridgeTower, makeBuilding, makeCharacter, makePlayerMarker, makeStreetProps, makeTiles, makeVehicles, shadowKey, shadowOffset, SHADOW_PAD } from '../world/golden';

interface Interactable {
  id: string; x: number; y: number; r: number;
  label: () => string | null; act: () => void;
  /** A name tag: standing on it counts as in range, wherever it hangs */
  tag?: Phaser.GameObjects.Text;
}

const WALK = 150, RUN = 245, BIKE = 330, BIKE_RUN = 410;
/** Painted portraits (public/portraits/<id>.jpg). They win over the generated busts. ~3.4MB, so they load after startup.
 *  Hand-painted likenesses (style-study/portraits.html), then ghosts in period dress and famous Brooklynites (ChatGPT, Nov 22 2026). */
const BUSTS = ['dee', 'hattie', 'farouk', 'juni', 'tyler', 'gary', 'skye', 'marcus', 'priya', 'brendan', 'deroy', 'jenna', 'nell', 'bridgette', 'adrian', 'danae', 'jon', 'emily', 'naim', 'luco', 'vega', 'cole', 'scott', 'darnell', 'grace', 'bev', 'okafor', 'andre', 'yara', 'inez', 'celestine', 'kofi', 'jasmine',
  'capone', 'tweed', 'greeley', 'bernstein', 'basquiat', 'tiffany', 'jackie', 'whitman', 'mckinney', 'ebbets', 'chadwick', 'beecher', 'clinton', 'morse', 'chisholm', 'lenahorne', 'biggie', 'rbg', 'yauch',
  'spikelee', 'carmelo', 'rosieperez', 'yasiinbey', 'chrisrock', 'streisand', 'jayz', 'bernie', 'melbrooks', 'mamdani', 'reynoso', 'hanif', 'jumaane', 'osse', 'tishjames', 'jeffries', 'schumer'];
/** Painted portraits for neighbors and side characters: fetched on the first chat, not at startup, to keep phones' image memory down */
const LAZY_BUSTS = ['abe', 'marisol', 'desmond', 'nadine', 'motti', 'yvette', 'adaeze', 'pearl', 'wen', 'haddad',
  'lionel', 'itzel', 'rafa', 'toni', 'amparo', 'odette', 'renee', 'imani', 'lewis', 'danielle',
  'carmen', 'rivka', 'chen', 'lupe', 'olena', 'farida', 'imran', 'marieclaude', 'kwame', 'yusuf',
  'sloane', 'luis', 'harjit', 'teo', 'yossel', 'boris', 'bilal', 'becca', 'baron', 'redtape',
  'rumor', 'carbon', 'databroker',
  'np_brooklynbookbodega', 'np_uprose',
  'np_impacctbrooklyn', 'np_osborneassociation', 'np_youthjusticenetwork', 'np_surveillancetechnologyoversi',
  'np_naturallyoccurringculturaldi', 'np_southbrooklynsanctuary', 'np_blacktransfemmesinthearts', 'np_blackveteransforsocialjustic',
  'np_brooklynballet', 'np_brooklyndebateleague', 'np_buildingbeats', 'np_envisionfreedomfund',
  'np_footsteps', 'np_newyorkstateyouthleadershipc', 'np_raisinghealthpartners', 'np_streetvendorproject',
  'np_thealexhouseproject', 'np_thebravehouse']; // nonprofit staffers, painted Nov 24 2026 (the two in the Brooklyn Org blog post first)
/** Street objects painted in ChatGPT (public/sprites/props/<key>.png): each takes over the code-drawn texture of the same key */
const PAINTED_PROPS = ['dock', 'truck', 'fridge-empty', 'fridge-full', 'cat', 'grocerybag', 'hoop0', 'hoop1', 'duck0', 'duck1', 'sunflower', 'trashpile', 'rat', 'streetbin', 'garbage', 'trashpile-sm'];

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
  private groundNames: Phaser.GameObjects.Text[] = [];
  private groundName(x: number, y: number, text: string, style: Phaser.Types.GameObjects.Text.TextStyle) { const t = this.add.text(x, y, text, style); this.groundNames.push(t); return t; }
  private nameTags: { id: string; tag: Phaser.GameObjects.Text; x: number; y: number }[] = [];
  private fixedLabels: Phaser.Geom.Rectangle[] = [];
  private ballgames?: BallGames;
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
  /** Night: a dark-blue wash over the street, glowing streetlights, rats at the trash */
  night = false;
  nightShade?: Phaser.GameObjects.Rectangle;
  nightGlows: Phaser.GameObjects.Image[] = [];
  rats: Phaser.GameObjects.Image[] = [];
  curbRats: Phaser.GameObjects.Image[] = [];
  trashPile?: Phaser.GameObjects.Image;
  cat!: Phaser.GameObjects.Sprite;
  posterLayer: Phaser.GameObjects.Image[] = [];
  miniIgnore: Phaser.GameObjects.GameObject[] = [];
  mode: 'title' | 'play' = 'title';
  onBike = false;
  playerRing!: Phaser.GameObjects.Image;
  playerChevron!: Phaser.GameObjects.Image;
  playerPin!: Phaser.GameObjects.Image;
  district: District | null = null;
  hood: string | null = null;
  lastDialogueEnd = 0;
  facing = 1;
  titlePan = 0;
  catPets = 0;

  constructor() { super('world'); }

  preload() {
    // The preloader's bar: the page and fonts are the first 15%, the game's images the rest
    const pl = (window as any).__pl; pl?.set(0.15);
    this.load.on('progress', (p: number) => pl?.set(0.15 + p * 0.8));
    // Painted portraits (BUSTS) load in the background once you're playing: see loadPortraitsLater()
    this.load.image('bko-wordmark', 'sprites/bko-wordmark.png'); // Brooklyn Org's official horizontal wordmark (Wheatpaste), for its storefront sign
    this.load.image('lmk-liu', 'sprites/liu-campus.png'); // LIU Brooklyn, painted in ChatGPT north-up: the field northwest, the Paramount corner southeast, the red sculpture on the south plaza
    this.load.image('barclays-sprite', 'sprites/barclays.png');
    this.load.image('bridge-tower-art', 'sprites/bridgetower.png');
    this.load.image('dragon-art', 'sprites/dragon.png'); // Naim's dragon, painted in ChatGPT
    this.load.image('cart0-art', 'sprites/cart-halal.png'); this.load.image('cart1-art', 'sprites/cart-churro.png'); // Hamid's and Doña Rosa's carts, painted in ChatGPT
    for (const k of PAINTED_PROPS) this.load.image(`${k}-art`, `sprites/props/${k}.png`); // street objects painted in ChatGPT, Nov 2026
    for (const p of PAINTED) if (p.ready) this.load.image(`lmk-${p.id}`, `sprites/${p.file}.png`); // landmarks placed by coordinates
    this.load.image('gap-island', 'sprites/gap.png'); // Grand Army Plaza's island, painted in ChatGPT, keyed
    for (const id of ['bandshell', 'gwgate', 'carousel', 'conservatory', 'bkcollege']) this.load.image(`park-${id}`, `sprites/${id}.png`); // painted in ChatGPT, keyed
    for (const id of PAINTED_LANDMARKS) this.load.image(`lm-${id}`, `sprites/${id}.png`);
  }

  create() {
    this.layout = generateLayout();
    makeTiles(this); makeVehicles(this); makeStreetProps(this); makeProps(this);
    // The food carts are painted like the rest of the street: the painted art takes over the drawn cart's key
    for (const k of ['cart0', 'cart1', ...PAINTED_PROPS]) if (this.textures.exists(`${k}-art`)) { if (this.textures.exists(k)) this.textures.remove(k); this.textures.renameTexture(`${k}-art`, k); }
    if (this.textures.exists('garbage') && !this.textures.exists('garbage-shd')) { // a soft shadow like the other vehicles
      const im = this.textures.get('garbage').getSourceImage() as HTMLImageElement, t = this.textures.createCanvas('garbage-shd', im.width + 12, im.height + 12)!, cx = t.getContext();
      cx.filter = 'blur(4px)'; cx.fillStyle = 'rgba(8,5,14,.55)'; cx.beginPath(); cx.roundRect(6, 6, im.width, im.height, 10); cx.fill(); t.refresh();
    }
    makeCharacter(this, 'player', PLAYER_LOOK, true, PLAYER_RES);
    makeBikeRider(this, 'player-bike', PLAYER_LOOK, PLAYER_RES);
    for (const n of NPCS) makeCharacter(this, `npc-${n.id}`, n.look, !(n as any).blockFolk && !(n as any).npOrg && !BUSTS.includes(n.id) && !LAZY_BUSTS.includes(n.id)); // neighbors' and staffers' portraits wait for the first chat; painted ones load after startup
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
    this.player.setCollideWorldBounds(true).setScale(1.2 / PLAYER_RES); // a touch bigger than the crowd; your textures are drawn at 3x
    makePlayerMarker(this);
    this.playerRing = this.add.image(start.x, start.y, 'player-ring').setScale(1 / PLAYER_RES);
    this.playerChevron = this.add.image(start.x, start.y, 'player-chevron').setScale(1 / PLAYER_RES);
    this.playerPin = this.add.image(start.x, start.y, 'player-pin').setOrigin(0.5, 1).setScale(1 / PLAYER_RES).setDepth(1e6 - 1);
    this.miniIgnore.push(this.playerRing, this.playerChevron, this.playerPin);
    this.tweens.add({ targets: this.playerRing, scale: { from: 0.9 / PLAYER_RES, to: 1.12 / PLAYER_RES }, alpha: { from: 1, to: 0.65 }, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.setPlayerBody();
    this.physics.add.collider(this.player, solids);
    this.physics.add.collider(this.player, this.groundLayer);
    if (this.liuWall) this.physics.add.collider(this.player, this.liuWall);

    this.buildNpcs(solids);
    this.buildBinsBlock();
    this.buildCurbTrash();
    this.setupMarch();
    this.peds = new Pedestrians(this, this.layout, 520); // they gather around wherever you are
    for (const pk of drawParks(this, this.layout, this.miniIgnore)) this.interactables.push(pk); // after the crowd: the Bandshell audience wears their looks
    this.opp = new Opposition(this, this.layout, 6);
    this.transit = new Transit(this, this.layout);
    // Last check, now every tree and prop is placed (some, like Eastern Parkway's, come from other code): a ground name
    // still under one draws above it
    const tall = this.children.list.filter((o: any) => /^(fountain|tree\d|hoop\d)$/.test(o.texture?.key ?? '')) as Phaser.GameObjects.Image[];
    for (const t of this.groundNames) { const b = t.getBounds(); if (tall.some((o) => o.depth > t.depth && Phaser.Geom.Rectangle.Overlaps(b, o.getBounds()))) t.setDepth(8.9e4); }
    for (const stn of this.transit.stations) if (stn.sign) this.clickToGo(stn.sign, stn.x, stn.y, () => this.takeSubway(stn));
    this.placeNameTags();
    bus.on('transit:alight', (p: { x: number; y: number }) => { (this.player.body as Phaser.Physics.Arcade.Body).reset(p.x, p.y); this.player.setVisible(true); });
    bus.on('ui:ride', () => this.rideApp());
    bus.on('ui:find', () => this.findPerson());
    bus.on('mission:started', (def: MissionDef) => { if (!def.side && !def.comingSoon && this.entityPos[def.giver]) { this.briefGiver = def.giver; this.briefAt = this.time.now + 2300; } });
    bus.on('event:dragon:quiz', () => this.time.delayedCall(250, () => this.dragonQuiz()));
    bus.on('event:dragon:ride', () => this.startDragon());
    bus.on('event:network', () => { // a Brooklyn Org grantee joins your network
      const n = Number(state.flag('network')) || 0, total = NONPROFITS.length;
      bus.emit('ui:toast', `BROOKLYN ORG NETWORK ${n} / ${total}`);
      const M: Record<number, number> = { 5: 25, 10: 50, 25: 100, 50: 200, 100: 400, 150: 500, 200: 600, [total]: 1000 };
      if (M[n]) setTimeout(() => { state.apply({ solidarity: M[n], power: 1 }, { quiet: true }); bus.emit('ui:toast', n === total ? `YOU KNOW ALL ${total}. YOU ARE THE NETWORK. +${M[n]} SOLIDARITY` : `${n} GROUPS IN YOUR NETWORK! +${M[n]} SOLIDARITY`); this.hearts(this.player.x, this.player.y, 10); }, 700);
    });
    bus.on('event:dragon:miss', () => state.setFlag('dragon_next_at', Date.now() + 20_000));
    bus.on('transit:board', (k: string) => state.apply({ flags: { [`rode_${k}`]: true } }, { quiet: true }));
    this.holdRing = this.add.graphics().setDepth(1e6);
    this.miniIgnore.push(this.holdRing);
    bus.on('mission:stage', () => { this.stageSpots = []; this.hold = null; });
    bus.on('opposition:wrecked', (name: string) => this.wrecked(name));
    this.events.on('gop:taunt', (sq: any, t: string) => this.bubble(sq.sprite, t));
    bus.on('opposition:caught', () => this.heldUp());
    bus.on('opposition:outnumbered', () => state.apply({ solidarity: 8 }, { quiet: true }));
    this.traffic = new Traffic(this, (x, y) => this.floatText(x, y - 30, Phaser.Utils.Array.GetRandom(['HONK!', 'BEEP!', 'MOVE!', 'YO!']), '#F5C242'));
    // Buses and cars see each other: nobody drives through anybody
    this.traffic.buses = () => this.transit.buses.map((b) => b.sprite);
    this.transit.cars = () => this.traffic.vehicles.map((v) => v.sprite);

    // Waypoint arrow
    this.arrow = this.add.image(0, 0, 'arrow').setDepth(1e6).setVisible(false);

    // Cameras
    const cam = this.cameras.main;
    // Let the camera run past the map's edge so you stay centered on the waterfront (clamped, you slid under the joystick)
    const EDGE = 600; cam.setBounds(-EDGE, -EDGE, WORLD_W + EDGE * 2, WORLD_H + EDGE * 2);
    cam.setBackgroundColor('#2b2622');
    cam.startFollow(this.player, true, 0.12, 0.12);
    this.applyZoom();
    this.setupMinimap();
    this.installCulling();

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
    // Typing in a search box: the game lets go of the keyboard (otherwise W A S D E B and space never reach the box)
    const typing = (t: EventTarget | null) => !!t && ['INPUT', 'TEXTAREA'].includes((t as HTMLElement).tagName);
    document.addEventListener('focusin', (e) => { if (!typing(e.target)) return; const kb = this.input.keyboard!; kb.disableGlobalCapture(); kb.enabled = false; kb.resetKeys(); });
    document.addEventListener('focusout', (e) => { if (!typing(e.target)) return; const kb = this.input.keyboard!; kb.enableGlobalCapture(); kb.enabled = true; kb.resetKeys(); });

    this.scale.on('resize', () => { this.applyZoom(); this.layoutMinimap(); });
    bus.on('dialogue:end', () => { this.lastDialogueEnd = performance.now(); });
    bus.on('game:new', () => this.newGame());
    bus.on('game:load', () => this.loadGame());
    bus.on('game:title', () => { this.mode = 'title'; });
    bus.on('state:changed', () => { this.refreshWorldState(); this.refreshBinsBlock(); });
    bus.on('mission:failed', () => this.cameras.main.shake(300, 0.006));
    bus.on('mission:passed', (p: any) => { this.celebrate(this.player.x, this.player.y); if (p?.def?.id === 'march') this.peds.release(); });
    bus.on('ui:interact', () => this.tryInteract());
    bus.on('ui:action', () => this.tryAction());
    bus.on('ui:bike', () => { if (this.mode !== 'play') return; if (this.onBike) this.toggleBike(false); else bus.emit('ui:toast', 'FIND A BK SPOKES DOCK TO GRAB A BIKE'); });

    ui.attachWorld(this);
    bus.emit('world:ready');
    (window as any).__pl?.done(); // fade from the preloader into the title screen
    this.loadPortraitsLater();
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
      // Brooklyn Org's storefront carries its real one-line wordmark (official file, Wheatpaste on Blacktop) over the sign band
      const ob = b.id === 'bkorg' ? signBand(b) : null;
      if (ob && this.textures.exists('bko-wordmark')) {
        // Drawn once at the size it shows on screen (camera zoom x pixel density), with the browser's high-quality downscale: sharp, not WebGL-shrunk
        const lh = 17, k = Math.max(1, (innerWidth > 1500 ? 1.25 : innerWidth > 900 ? 1.1 : 0.85) * DPR);
        const src = this.textures.get('bko-wordmark').getSourceImage() as HTMLImageElement;
        const th = Math.round(lh * k), tw = Math.round(src.width * th / src.height);
        if (!this.textures.exists('bko-sign')) { const ct = this.textures.createCanvas('bko-sign', tw, th)!; const cx = ct.getContext(); cx.imageSmoothingEnabled = true; cx.imageSmoothingQuality = 'high'; cx.drawImage(src, 0, 0, tw, th); ct.refresh(); }
        const mark = this.add.image(ob.x + ob.w / 2, ob.y + ob.h / 2, 'bko-sign').setOrigin(0.5).setScale(1 / k);
        const plate = this.add.rectangle(mark.x, mark.y, ob.w, lh * 1.6, 0x131313).setDepth(b.y + b.h + 0.3);
        mark.setDepth(b.y + b.h + 0.4); this.miniIgnore.push(plate, mark);
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
        const band = (hw: number, color: number, ya: number, yb: number, gr = sm) => { gr.fillStyle(color, 1); gr.fillPoints([{ x: atY(ya) - hw, y: ya }, { x: atY(ya) + hw, y: ya }, { x: atY(yb) + hw, y: yb }, { x: atY(yb) - hw, y: yb }], true); };
        band(2.9 * TILE, 0xa39c90, o.y, o.y + bhp);
        { const hw = 1.75 * TILE; this.pave((gr) => band(hw, 0x34363a, y0, y1, gr), -8.9, { x0: Math.min(atY(y0), atY(y1)) - hw, y0, x1: Math.max(atY(y0), atY(y1)) + hw, y1 }); }
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
      const quad = (a: { x: number; y: number }, b: { x: number; y: number }, hw: number, trimA: number, trimB = trimA, gr = sm) => {
        const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, nx = -uy * hw, ny = ux * hw;
        const ax = a.x + ux * trimA, ay = a.y + uy * trimA, bx = b.x - ux * trimB, by = b.y - uy * trimB;
        gr.fillPoints([{ x: ax + nx, y: ay + ny }, { x: bx + nx, y: by + ny }, { x: bx - nx, y: by - ny }, { x: ax - nx, y: ay - ny }], true);
      };
      const segs = av.pts.slice(1).map((q, i) => [av.pts[i], q] as const);
      // sidewalks stop short of the cross streets at every intersection the avenue meets
      sm.fillStyle(0xa39c90, 1); segs.forEach(([a, b]) => quad(a, b, av.hw + 1.2 * TILE, 2.2 * TILE));
      // The roadway is paved with the same asphalt tile as the grid streets, lined up with their grid, so where a street's
      // tiles are laid back over the avenue the two surfaces meet seamlessly (a flat fill left blocky patches there)
      this.pave((gr) => { gr.fillStyle(0x34363a, 1); segs.forEach(([a, b]) => quad(a, b, av.hw, 0, 0, gr)); av.pts.slice(1, -1).forEach((p) => gr.fillCircle(p.x, p.y, av.hw)); }, -8.9,
        { x0: Math.min(...av.pts.map((p) => p.x)) - av.hw, y0: Math.min(...av.pts.map((p) => p.y)) - av.hw, x1: Math.max(...av.pts.map((p) => p.x)) + av.hw, y1: Math.max(...av.pts.map((p) => p.y)) + av.hw });
      ln.lineStyle(2.5, 0xf2c23a, 0.9);
      for (const [a, b] of segs) {
        const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
        const gx = GAP_CIRCLE.x * TILE, gy = GAP_CIRCLE.y * TILE, gax = (GAP_CIRCLE.ax + GAP_CIRCLE.w + 1.4) * TILE, gay = (GAP_CIRCLE.ay + GAP_CIRCLE.w + 1.4) * TILE;
        for (let t = 70; t < L - 70; t += 34) for (const o of [-2.5, 2.5]) if (((a.x + ux * t - gx) / gax) ** 2 + ((a.y + uy * t - gy) / gay) ** 2 > 1) ln.lineBetween( /* no center line through Grand Army Plaza */a.x + ux * t + nx * o, a.y + uy * t + ny * o, a.x + ux * (t + 20) + nx * o, a.y + uy * (t + 20) + ny * o);
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
      const ring = this.add.graphics().setDepth(-8.45); // above the avenue's paving and re-laid street tiles (-8.9, -8.5), so none poke through the ring
      ring.fillStyle(0xa39c90, 1); band(ring, g.w + 1.2);
      // The four streets (Flatbush/Vanderbilt north-south, Eastern Pkwy/Union St east-west) run straight into the ring:
      // asphalt cuts through the sidewalk band, with a crosswalk where each one meets the circle
      const reachY = (g.ay + g.w + 2.4) * TILE, reachX = (g.ax + g.w + 2.4) * TILE, sw = ROAD * TILE;
      ring.fillStyle(0x34363a, 1); // the same asphalt as the avenues' paving, so the plaza isn't a different shade
      ring.fillRect(cx - sw / 2, cy - reachY, sw, reachY * 2);
      ring.fillRect(cx - reachX, cy - sw / 2, reachX * 2, sw);
      // Avenues that meet the circle (Flatbush) run their roadway into it, across the sidewalk band
      for (const av of this.layout.avenues) for (let i = 1; i < av.pts.length; i++) {
        const a = av.pts[i - 1], b2 = av.pts[i], L = Math.hypot(b2.x - a.x, b2.y - a.y), ux = (b2.x - a.x) / L, uy = (b2.y - a.y) / L;
        for (let t = 0; t < L; t += 12) {
          const px = a.x + ux * t, py = a.y + uy * t;
          if (((px - cx) / reachX) ** 2 + ((py - cy) / reachY) ** 2 < 1) ring.fillCircle(px, py, av.hw);
        }
      }
      band(ring, g.w);
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
      const t = this.groundName(l.x, l.y - 40, l.text.toUpperCase().split('').join(' '), { fontFamily: '"Helvetica Neue", Inter, Arial, sans-serif', fontSize: '22px', fontStyle: '300', color: '#f4ece0', shadow: { offsetX: 0, offsetY: 2, color: 'rgba(0,0,0,.6)', blur: 6, fill: true } }).setOrigin(0.5).setDepth(5).setAlpha(0.8).setRotation(l.angle ?? 0);
      this.miniIgnore.push(t);
      // A street name painted on the road gets a block of road color behind it, so the yellow center line doesn't run through the letters
      const tile = this.layout.tiles[Math.floor((l.y - 40) / TILE)]?.[Math.floor(l.x / TILE)];
      const onRoad = l.angle !== undefined || [T.ASPHALT, T.LANE_V, T.LANE_H, T.INTERSECTION].includes(tile as T);
      if (!onRoad) { // a name on the ground never hides under a fountain, a tree or a building: slide it to the nearest clear spot
        const under = (r: Phaser.Geom.Rectangle) => this.layout.props.some((pr) => {
          if (!['fountain', 'tree', 'hoop'].includes(pr.kind)) return false;
          const src = this.textures.exists(pr.kind === 'fountain' ? 'fountain' : `${pr.kind}${pr.variant ?? 0}`) ? this.textures.get(pr.kind === 'fountain' ? 'fountain' : `${pr.kind}${pr.variant ?? 0}`).getSourceImage() : null;
          const w = src?.width ?? 60, h = src?.height ?? 60; // props stand with their feet at (x, y): origin (0.5, 0.92)
          return Phaser.Geom.Rectangle.Overlaps(r, new Phaser.Geom.Rectangle(pr.x - w / 2, pr.y - h * 0.92, w, h));
        }) || this.layout.buildings.some((b) => Phaser.Geom.Rectangle.Overlaps(r, new Phaser.Geom.Rectangle(b.x, b.y, b.w, b.h)));
        const y0 = t.y;
        let clear = false;
        for (const dy of [0, 70, -70, 110, -110, 150, -150]) { t.setY(y0 + dy); if (!under(t.getBounds())) { clear = true; break; } }
        if (!clear) t.setY(y0).setDepth(8.9e4); // a wooded park with no clear spot: the name reads over the trees, not under them
      }
      if (onRoad) this.miniIgnore.push(this.add.rectangle(l.x, l.y - 40, t.width + 28, t.height + 8, 0x34363a, 1).setRotation(l.angle ?? 0).setDepth(4.9));
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
      const img = this.add.image(s.x, s.y + 32, 'dock').setOrigin(0.5, 0.9).setDepth(s.y - 25); // fills the sidewalk from the building line to the curb; low, so people on the sidewalk draw over it
      // A label like the name tags, so a dock reads as "bikes here" from across the block
      const tag = this.add.text(s.x, s.y + 42, '🚲 BIKES', { fontFamily: 'Nunito, "Helvetica Neue", Arial, sans-serif', fontSize: '14px', fontStyle: '900', color: '#16101f', backgroundColor: '#ffffff', padding: { x: 6, y: 3 } }).setOrigin(0.5).setDepth(1e5 + 1); // under the dock, over name tags
      this.fixedLabels.push(tag.getBounds());
      this.miniIgnore.push(img, tag);
      // and a bike on the mini-map (only the mini-map sees it)
      if (!this.textures.exists('mm-bike')) { const t = this.textures.createCanvas('mm-bike', 64, 64)!, cx = t.getContext(); cx.beginPath(); cx.arc(32, 32, 28, 0, 7); cx.fillStyle = '#fff'; cx.fill(); cx.lineWidth = 5; cx.strokeStyle = '#16101f'; cx.stroke(); cx.font = '36px sans-serif'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText('🚲', 32, 35); t.refresh(); }
      this.cameras.main.ignore(this.add.image(s.x, s.y, 'mm-bike').setScale(3.4).setDepth(2e6 - 1));
      this.interactables.push({ id, x: s.x, y: s.y, r: 70, label: () => (this.onBike ? 'Dock your bike' : 'Grab a BK Spokes bike'), act: () => this.toggleBike(!this.onBike) });
      this.clickToGo([img, tag], s.x, s.y + 24, () => this.toggleBike(!this.onBike));
    }
    // Vendors
    const vend = (id: string, key: string, cartKey: string, spot: { x: number; y: number }, name: string, lines: string[], gift: string) => {
      const cart = this.add.image(spot.x + 50, spot.y, cartKey).setOrigin(0.5, 0.92).setDepth(spot.y);
      const v = this.add.sprite(spot.x, spot.y, key, 0).setOrigin(0.5, 0.5).setScale(1 / CHAR_RES).setDepth(spot.y + 1).setRotation(Math.PI);
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

  /**
   * Name tags go where nothing else is: never over a building (its storefront sign), a subway station's sign, a bike
   * dock's tag or another name tag. Each tries spots around its person, nearest first; signs are placed first and win.
   */
  private placeNameTags() {
    const CELL = 256, grid = new Map<string, Phaser.Geom.Rectangle[]>();
    const cells = (r: Phaser.Geom.Rectangle) => { const out: string[] = []; for (let x = Math.floor(r.x / CELL); x <= Math.floor(r.right / CELL); x++) for (let y = Math.floor(r.y / CELL); y <= Math.floor(r.bottom / CELL); y++) out.push(`${x},${y}`); return out; };
    const add = (r: Phaser.Geom.Rectangle) => { const p = Phaser.Geom.Rectangle.Inflate(Phaser.Geom.Rectangle.Clone(r), 3, 3); for (const c of cells(p)) (grid.get(c) ?? grid.set(c, []).get(c)!).push(p); };
    const clashes = (r: Phaser.Geom.Rectangle) => cells(r).some((c) => grid.get(c)?.some((o) => Phaser.Geom.Rectangle.Overlaps(o, r)));
    const onBuilding = (r: Phaser.Geom.Rectangle) => this.layout.buildings.some((b) => r.right > b.x && r.x < b.x + b.w && r.bottom > b.y && r.y < b.y + b.h);
    for (const r of [...this.transit.signRects, ...this.fixedLabels]) add(r);
    const spots = [[0, -40], [0, 34], [-70, 34], [70, 34], [-70, -40], [70, -40], [0, 60], [0, -66], [-110, 0], [110, 0], [-100, 60], [100, 60], [-100, -66], [100, -66], [0, 86], [0, -92]];
    for (const { tag, x, y } of this.nameTags) {
      let best: number[] | null = null, fallback: number[] | null = null;
      for (const sp of spots) {
        tag.setPosition(x + sp[0], y + sp[1]);
        const r = tag.getBounds(); if (clashes(r)) continue;
        if (!onBuilding(r)) { best = sp; break; }
        fallback ??= sp; // over a building beats over another label
      }
      const sp = best ?? fallback ?? spots[0];
      tag.setPosition(x + sp[0], y + sp[1]);
      add(tag.getBounds());
      if (Math.hypot(sp[0], sp[1]) > 60) { // a tag hanging farther off gets a thin line back to its person, so it can't read as a neighbor's
        const b = tag.getBounds(), ex = Phaser.Math.Clamp(x, b.x, b.right), ey = Phaser.Math.Clamp(y - 10, b.y, b.bottom);
        const line = this.add.line(0, 0, x, y - 10, ex, ey, 0x16101f, 0.55).setOrigin(0).setLineWidth(1.5).setDepth(1e5 - 1);
        this.miniIgnore.push(line);
      }
    }
  }

  private buildNpcs(solids: Phaser.Physics.Arcade.StaticGroup) {
    for (const n of NPCS) {
      const base = this.layout.spots[n.spot];
      if (!base) { console.warn('no spot for', n.id); continue; }
      const s = n.offset ? { x: base.x + n.offset.dx, y: base.y + n.offset.dy } : base;
      const key = `npc-${n.id}`;
      this.anims.create({ key: `${key}-idle`, frames: this.anims.generateFrameNumbers(key, { frames: [0] }), frameRate: 1, repeat: -1 });
      const spr = this.add.sprite(s.x, s.y, key, 0).setOrigin(0.5, 0.5).setScale(1 / CHAR_RES).setDepth(s.y).setRotation(Math.PI);
      const ghost = !!(n as any).ghost;
      if (ghost) { // ghosts: a pulsing pale-blue aura, a wisp where feet would be, a translucent drifting body
        const glow = this.add.circle(s.x, s.y, 30, 0xcfe8ff, 0.3).setBlendMode(Phaser.BlendModes.ADD).setDepth(s.y - 1);
        const wisp = this.add.ellipse(s.x, s.y + 20, 30, 10, 0xdff0ff, 0.45).setDepth(s.y - 1);
        spr.setTint(0xeaf4ff).setAlpha(0.8).setScale(1.12 / CHAR_RES).setBlendMode(Phaser.BlendModes.SCREEN);
        const t = 1700 + Math.random() * 700;
        this.tweens.add({ targets: spr, y: s.y - 7, alpha: 0.55, duration: t, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
        this.tweens.add({ targets: glow, scale: 1.3, alpha: 0.12, y: s.y - 7, duration: t, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
        this.tweens.add({ targets: wisp, scaleX: 0.6, alpha: 0.15, duration: t, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
        this.miniIgnore.push(glow, wisp);
      }
      spr.play({ key: `${key}-idle` });
      const blocker = solids.create(s.x, s.y - 8, undefined) as Phaser.Physics.Arcade.Image;
      blocker.setVisible(false); (blocker.body as Phaser.Physics.Arcade.StaticBody).setSize(22, 14);
      const tag = this.add.text(s.x, s.y - 40, ghost ? `👻 ${n.short.toUpperCase()}` : n.short.toUpperCase(), { fontFamily: 'Nunito, "Helvetica Neue", Arial, sans-serif', fontSize: '15px', fontStyle: '900', color: ghost ? '#2a3a5a' : '#16101f', backgroundColor: labelColor(n), /* one color per kind of person (labels.ts) */ padding: { x: 7, y: 3 }, shadow: { offsetX: 2, offsetY: 2, color: '#16101f', blur: 0, fill: false, stroke: false } }).setOrigin(0.5).setDepth(1e5);
      this.nameTags.push({ id: n.id, tag, x: s.x, y: s.y }); // placed once the station signs exist (placeNameTags)
      this.miniIgnore.push(tag, spr);
      this.npcSprites[n.id] = spr;
      this.entityPos[n.id] = s;
      this.interactables.push({ id: n.id, x: s.x, y: s.y, r: 64, tag, label: () => `Talk to ${n.short}`, act: () => this.talk(n) });
      this.makeNpcClickable(n, spr, tag);
    }
    // Commissioner Whiskers
    const cs = this.layout.spots.cat;
    this.cat = this.add.sprite(cs.x, cs.y, 'cat').setDepth(cs.y);
    this.miniIgnore.push(this.cat);
    if (!this.textures.get('cat').getSourceImage().width || this.textures.get('cat').getSourceImage().width < 36) this.tweens.add({ targets: this.cat, x: cs.x + 90, duration: 5000, yoyo: true, repeat: -1, ease: 'Sine.inOut', onYoyo: () => this.cat.setFlipX(true), onRepeat: () => this.cat.setFlipX(false) }); // the drawn cat paces; the painted Commissioner lounges
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
    this.minimap.setZoom(0.09 * DPR).setBounds(0, 0, WORLD_W, WORLD_H).setBackgroundColor('#1b1230');
    this.minimap.startFollow(this.player, true, 1, 1);
    this.layoutMinimap();
    // Safari can move the HUD without a resize (its toolbars and the status-bar inset settle after load): when the
    // scorecard or button row shifts, line the map back up with them
    let hudAt = '';
    this.time.addEvent({ delay: 500, loop: true, callback: () => {
      const st = document.getElementById('stats')?.getBoundingClientRect(), hb = document.getElementById('hud-buttons')?.getBoundingClientRect();
      const at = st && hb ? `${Math.round(st.top)},${Math.round(st.right)},${Math.round(hb.bottom)},${innerWidth}` : '';
      if (at !== hudAt) { hudAt = at; this.layoutMinimap(); }
    } });
    this.mmPlayer = this.add.image(0, 0, 'mm-player').setDepth(2e6).setScale(1.2);
    this.cameras.main.ignore(this.mmPlayer);
    this.minimap.ignore([this.player, this.arrow, ...this.miniIgnore, ...this.peds.sprites(), ...this.opp.sprites(), ...this.traffic.lightSprites]);
  }
  private layoutMinimap() {
    if (!this.minimap) return;
    // Phones held upright: the map fills the space beside the scorecard and button row (same top, same bottom)
    // Laid out in CSS pixels (like the HUD); the camera viewport is in game pixels (x DPR)
    const SW = this.scale.width / DPR, SH = this.scale.height / DPR, vp = (x: number, y: number, w: number, h: number) => this.minimap.setViewport(x * DPR, y * DPR, w * DPR, h * DPR);
    if (SW <= 600) {
      const st = document.getElementById('stats')?.getBoundingClientRect(), hb = document.getElementById('hud-buttons')?.getBoundingClientRect();
      if (st && hb && st.width > 0 && hb.height > 0) {
        const x = Math.round(st.right + 10), y = Math.round(st.top), w = Math.round(SW - x - 8), h = Math.round(hb.bottom - st.top);
        if (w > 60) { vp(x, y, w, h); bus.emit('minimap:layout', { x, y, size: w, h }); return; }
      }
    }
    const phone = SW <= 600 || SH <= 500, m = phone ? 8 : 18;
    const size = phone ? (SW <= 600 ? 100 : Math.min(120, Math.floor(SH * 0.3))) : Math.min(200, Math.floor(SW * 0.28));
    vp(SW - size - m, m, size, size);
    bus.emit('minimap:layout', { x: SW - size - m, y: m, size });
  }
  /**
   * Phaser draws every object in the world each frame, on-screen or not (~11,000 here, twice: map + minimap).
   * Skip the ones outside each camera's view, and on the minimap skip small text (a pixel or two at that zoom).
   */
  /**
   * Pave a diagonal road: a flat fill in the grid asphalt tile's own base color (#34363a), so it meets the streets it
   * crosses without dark patches (the old fill was darker). A tiled image here cost ~200MB, because Phaser backs a
   * TileSprite with one canvas the size of the whole avenue, and phones crashed.
   */
  private pave(draw: (g: Phaser.GameObjects.Graphics) => void, depth: number, _area: { x0: number; y0: number; x1: number; y1: number }) {
    const g = this.add.graphics().setDepth(depth);
    draw(g);
    this.miniIgnore.push(g);
  }


  private installCulling() {
    const CULL = new Set(['Sprite', 'Image', 'Text', 'Arc', 'Rectangle', 'Ellipse']);
    (this.cameras as any).getVisibleChildren = (children: Phaser.GameObjects.GameObject[], camera: Phaser.Cameras.Scene2D.Camera) => {
      const v = camera.worldView, mini = camera === this.minimap;
      return children.filter((c: any) => {
        if (!c.willRender(camera)) return false;
        if (!CULL.has(c.type)) return true;
        if (c.scrollFactorX !== 1) return true; // fixed to the screen (the night wash): always in view
        if (mini && c.type === 'Text' && c.displayHeight < 100) return false;
        const r = Math.max(c.displayWidth, c.displayHeight) + 32; // covers any origin or rotation
        return c.x > v.x - r && c.x < v.right + r && c.y > v.y - r && c.y < v.bottom + r;
      });
    };
  }

  /** The painted portraits load in the background after startup (they're ~3.4MB). A conversation that opens before
   *  its portrait arrives shows the character sprite, then swaps in the painting the moment it lands. */
  private loadPortraitsLater() {
    this.time.delayedCall(800, () => {
      for (const id of BUSTS) if (!this.textures.exists(`npc-${id}-bust`)) this.load.image(`npc-${id}-bust`, `portraits/${id}.jpg`);
      this.load.on('filecomplete', (key: string) => { if (key.endsWith('-bust')) ui.portraitArrived(key.slice(0, -5)); });
      this.load.start();
    });
  }

  /** Ms. Bev's curb in Fort Greene: a pile of bags (a street bin once the block wins), rats that come out at night */
  private buildBinsBlock() {
    const b = this.layout.spots.lm_bkorg; if (!b || !this.textures.exists('trashpile')) return;
    const x = b.x - 70, y = b.y + 38; // between Ms. Bev and the Brooklyn Org door, clear of the name tags
    this.trashPile = this.add.image(x, y, 'trashpile').setOrigin(0.5, 0.8).setDepth(y);
    this.miniIgnore.push(this.trashPile);
    for (let i = 0; i < 3; i++) {
      const r = this.add.image(x - 40 + i * 34, y + 8 + (i % 2) * 10, 'rat').setDepth(9e4 + 2).setVisible(false); // over the night wash: you see them
      this.tweens.add({ targets: r, x: r.x + 26 + i * 6, duration: 700 + i * 260, yoyo: true, repeat: -1, ease: 'Sine.inOut', onYoyo: () => r.setFlipX(true), onRepeat: () => r.setFlipX(false) });
      this.rats.push(r); this.miniIgnore.push(r);
    }
    this.refreshBinsBlock();
  }
  /** New York puts its trash on the sidewalk: bag piles on residential curbs all over Brooklyn, and a rat at each one at night */
  private buildCurbTrash() {
    if (!this.textures.exists('trashpile')) return;
    const POSH = new Set(['Park Slope', 'Brooklyn Heights', 'Cobble Hill', 'Carroll Gardens', 'Boerum Hill', 'DUMBO', 'Fort Greene', 'Clinton Hill', 'Prospect Heights', 'Williamsburg', 'Greenpoint', 'Windsor Terrace', 'Ditmas Park']);
    const RES = new Set(['brownstone', 'rowhouse', 'walkup', 'apartment', 'twofamily', 'victorian']), SHOP = new Set(['bodega', 'laundromat', 'coffee', 'bakery', 'boutique']);
    const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
    const taken = Object.values(this.layout.spots);
    const bev = this.layout.spots.lm_bkorg;
    for (const b of this.layout.buildings) {
      if (b.name || !(RES.has(b.type) || SHOP.has(b.type))) continue;
      // Fewer, smaller piles where the brownstones got expensive; more where buildings are bigger and pickup is thinner
      const posh = POSH.has(neighborhoodAt(b.x + b.w / 2, b.y + b.h + 20) ?? '');
      const h = hash(b.id); if (posh ? h % 5 : RES.has(b.type) ? h % 2 : h % 5) continue; // posh: one in five · elsewhere: half the homes, one shop in five
      const x = b.x + b.w / 2 + ((h >>> 8) % 40) - 20, y = b.y + b.h + 40;
      if (taken.some((p) => Math.abs(p.x - x) < 50 && Math.abs(p.y - y) < 36)) continue; // never on top of someone
      if (bev && Math.hypot(bev.x - x, bev.y - y) < 260) continue; // Ms. Bev's curb has its own pile
      const small = (posh || (h >>> 4) % 3 > 0) && this.textures.exists('trashpile-sm');
      const pile = this.add.image(x, y, small ? 'trashpile-sm' : 'trashpile').setOrigin(0.5, 0.8).setDepth(y).setFlipX(!!((h >>> 12) & 1));
      const shd = this.add.ellipse(x, y + 4, pile.width * 0.85, 14, 0x08050e, 0.28).setDepth(y - 1); // the bags sit right on the sidewalk
      this.miniIgnore.push(shd);
      const rat = this.add.image(x - 18, y + 10, 'rat').setDepth(9e4 + 2).setVisible(false);
      this.tweens.add({ targets: rat, x: rat.x + 30, duration: 800 + ((h >>> 16) % 500), yoyo: true, repeat: -1, ease: 'Sine.inOut', onYoyo: () => rat.setFlipX(true), onRepeat: () => rat.setFlipX(false) });
      this.curbRats.push(rat); this.miniIgnore.push(pile, rat);
    }
  }
  private refreshBinsBlock() {
    for (const r of this.curbRats) r.setVisible(this.night);
    if (!this.trashPile) return;
    const won = state.flag('bins_result') === 'good' && this.textures.exists('streetbin');
    this.trashPile.setTexture(won ? 'streetbin' : 'trashpile');
    for (const r of this.rats) r.setVisible(this.night && !won);
  }

  /** Night falls (or lifts) over a second and a half: the street goes dark blue, the streetlights glow */
  private setNight(on: boolean) {
    this.night = on;
    if (!this.nightShade) {
      const W = this.scale.width, H = this.scale.height;
      // fixed to the screen and oversized, so camera zoom never shows an edge
      this.nightShade = this.add.rectangle(W / 2, H / 2, W * 4, H * 4, 0x081236).setScrollFactor(0).setDepth(9e4).setAlpha(0);
      if (!this.textures.exists('glow')) {
        const t = this.textures.createCanvas('glow', 128, 128)!, c = t.getContext(), g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
        g.addColorStop(0, 'rgba(255,214,140,.95)'); g.addColorStop(0.35, 'rgba(255,190,110,.45)'); g.addColorStop(1, 'rgba(255,170,90,0)');
        c.fillStyle = g; c.fillRect(0, 0, 128, 128); t.refresh();
      }
      for (const p of this.layout.props) if (p.kind === 'lamp') this.nightGlows.push(this.add.image(p.x, p.y - 34, 'glow').setScale(1.6).setBlendMode(Phaser.BlendModes.ADD).setDepth(9e4 + 1).setAlpha(0));
      this.minimap?.ignore([this.nightShade, ...this.nightGlows]);
    }
    this.tweens.add({ targets: this.nightShade, alpha: on ? 0.62 : 0, duration: 1500, ease: 'Sine.inOut' });
    this.tweens.add({ targets: this.nightGlows, alpha: on ? 0.9 : 0, duration: 1500, ease: 'Sine.inOut' });
    this.refreshBinsBlock();
  }

  private applyZoom() {
    const w = this.scale.width / DPR; // CSS pixels
    this.cameras.main.setZoom((w > 1500 ? 1.25 : w > 900 ? 1.1 : 0.85) * DPR);
  }

  // ------------------------------------------------------------------ GAME FLOW
  /** Mission 1's four grantees: a fresh random draw from this year's grantees each New Game, over at least 3 neighborhoods */
  private pickNetwork() {
    const pool = POOL.map(([id]) => id).filter((id) => this.entityPos[id]);
    const hood = (id: string) => districtAt(this.entityPos[id]!.x, this.entityPos[id]!.y);
    let pick = pool.slice(0, NET_PICKS);
    for (let t = 0; t < 200; t++) {
      const draw = [...pool].sort(() => Math.random() - 0.5).slice(0, NET_PICKS);
      if (new Set(draw.map(hood)).size >= Math.min(3, NET_PICKS)) { pick = draw; break; }
    }
    state.setFlag('net1_picks', pick.join(','));
  }

  private newGame() {
    setTimeout(() => this.layoutMinimap(), 60); // once the HUD is showing, so it can be measured
    state.reset();
    this.posterLayer.forEach((p) => p.destroy()); this.posterLayer = [];
    this.toggleBike(false, true);
    const s = this.layout.spots.playerStart;
    this.player.setPosition(s.x, s.y);
    this.pickNetwork();
    missions.start('network'); // Mission 1 opens at Brooklyn Org
    this.mode = 'play';
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.flash(400, 255, 140, 60);
    bus.emit('ui:toast', 'YOU JUST GOT OUT OF JURY DUTY');
  }

  private loadGame() {
    setTimeout(() => this.layoutMinimap(), 60); // once the HUD is showing, so it can be measured
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
      else this.comeOver(spr.x, spr.y, () => this.talk(n)); // anyone you can see: you head over and the conversation opens
    };
    for (const o of [zone, tag]) {
      o.on('pointerover', over);
      o.on('pointerout', out);
      o.on('pointerdown', click);
    }
  }

  /** Click a sign (subway entrance, bike dock): head over to it, then use it */
  private clickToGo(objs: Phaser.GameObjects.GameObject[], x: number, y: number, act: () => void) {
    for (const o of objs) {
      (o as Phaser.GameObjects.Image).setInteractive({ useHandCursor: true });
      o.on('pointerdown', () => {
        if (this.mode !== 'play' || ui.blocking() || performance.now() - this.lastDialogueEnd < 250) return;
        if (Math.hypot(x - this.player.x, y - this.player.y) <= 48) act(); else this.comeOver(x, y, act);
      });
    }
  }

  /** Glide over to an open spot beside someone, then do something (talk). No "walk closer" dead end. */
  private autoWalk = false;
  private comeOver(x: number, y: number, then: () => void) {
    if (this.autoWalk || this.flying || this.mode !== 'play') return;
    const px = this.player.x, py = this.player.y;
    const spots = [[0, 34], [0, -34], [-36, 0], [36, 0], [-30, 30], [30, 30], [-30, -30], [30, -30], [0, 50]]
      .map(([dx, dy]) => ({ x: x + dx, y: y + dy }))
      .filter((p) => this.peds.walkable(p.x, p.y))
      .sort((a, b) => Math.hypot(a.x - px, a.y - py) - Math.hypot(b.x - px, b.y - py));
    const to = spots[0] ?? { x, y: y + 34 };
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const dist = Math.hypot(to.x - px, to.y - py);
    this.autoWalk = true; body.setVelocity(0, 0); body.enable = false;
    this.player.setRotation(Math.atan2(to.y - py, to.x - px) + Math.PI / 2);
    if (!this.flying) this.player.play(this.onBike ? 'bike-roll' : 'player-walk', true);
    this.tweens.add({
      targets: this.player, x: to.x, y: to.y, duration: Phaser.Math.Clamp(dist * 0.9, 250, 900), ease: 'Sine.inOut',
      onComplete: () => { body.enable = true; body.reset(to.x, to.y); this.autoWalk = false; this.player.anims.stop(); this.player.setFrame(0); then(); },
    });
  }

  // ------------------------------------------------------------------ INTERACTIONS
  private talk(n: NpcDef) {
    if (LAZY_BUSTS.includes(n.id)) { // painted, fetched on the first chat; it swaps in when it arrives
      if (!this.textures.exists(`npc-${n.id}-bust`)) { this.load.image(`npc-${n.id}-bust`, `portraits/${n.id}.jpg`); this.load.start(); }
    } else if (!this.textures.exists(`npc-${n.id}-bust`) && !BUSTS.includes(n.id)) makeBust(this, `npc-${n.id}`, n.look); // drawn on first chat
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
    if (!this.textures.exists(`npc-${n.id}-bust`) && !BUSTS.includes(n.id) && !LAZY_BUSTS.includes(n.id)) makeBust(this, `npc-${n.id}`, n.look);
    const lines =[...(n.idle ?? []), ...(STREET_LINES[n.district] ?? [])];
    const line = pickLine(`npc:${n.id}`, lines.length ? lines : ['...']);
    const lang = this.phraseLesson(n); // a neighbor who speaks a language teaches you one phrase (languages.ts)
    const L = LANGS[(n as any).lang ?? ''], hi = L && L.phrases.some((_, i) => state.flag(`ph_${L.id}_${i}`)) ? `«${L.phrases[0].text}» ` : '';
    if (state.flag(`chat_${n.id}`)) {
      if (lang) { dialogue.start(n.id, { entries: [{ node: 'a' }], nodes: { a: { speaker: n.id, text: hi + line, next: 'lang' }, ...lang } } as any); return; }
      dialogue.say(n.id, n.id, hi + line); return; // you've learned their language: they greet you in it
    }
    const keys = Object.keys(LESSONS), fresh = keys.filter((k) => !state.flag(`lesson_${k}`));
    const pool = fresh.length ? fresh : keys;
    const own = (n as any).lesson as string | undefined; // workers teach about their own work (a vendor: vendor permits)
    const key = own && LESSONS[own] && !state.flag(`lesson_${own}`) ? own : pool[[...n.id].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7) % pool.length];
    dialogue.start(n.id, {
      entries: [{ node: 'a' }],
      nodes: {
        a: { speaker: n.id, text: line, next: 'b' },
        b: { speaker: n.id, text: key === own && LESSONS[key].who === n.short ? LESSONS[key].text : `Here's something worth knowing around here. ${LESSONS[key].text}`, /* their own lesson, in their own voice */ choices: [{ text: 'Good to know. Thanks.', next: lang ? 'lang' : undefined, effects: { solidarity: 5, rel: { [n.id]: 3 }, flags: { [`chat_${n.id}`]: true }, toast: `POCKET CIVICS · ${key}` } }] },
        ...(lang ?? {}),
      },
    } as any);
  }

  /**
   * The next phrase this neighbor teaches you in their language, as dialogue nodes ('lang', 'praise'), or null if
   * they don't speak one, already taught you, or you know all three phrases. Each phrase: Solidarity, the
   * neighborhood's trust, the neighbor's friendship. The third phrase in a language: "you speak a little ___".
   */
  private phraseLesson(n: NpcDef): Record<string, unknown> | null {
    const L = LANGS[(n as any).lang ?? '']; if (!L || state.flag(`taught_${n.id}`)) return null;
    const i = L.phrases.findIndex((_, k) => !state.flag(`ph_${L.id}_${k}`)); if (i < 0) return null;
    const p = L.phrases[i], known = L.phrases.filter((_, k) => state.flag(`ph_${L.id}_${k}`)).length, done = known + 1 === L.phrases.length;
    const effects = {
      solidarity: done ? 38 : 8, trust: { [n.district]: 2 }, rel: { [n.id]: 3 },
      flags: { [`ph_${L.id}_${i}`]: true, [`taught_${n.id}`]: true, ...(done ? { [`lang_${L.id}`]: true } : {}) },
      toast: done ? `YOU SPEAK A LITTLE ${L.name.toUpperCase()}` : `PHRASEBOOK · ${L.name.toUpperCase()}`,
    };
    return {
      lang: { speaker: n.id, text: `Learn a little ${L.name}. We say «${p.text}» (${p.say}). It means "${p.en}${/[.!?)]$/.test(p.en) ? '' : '.'}" Say it back.`, choices: [{ text: `«${p.text}»`, tag: L.name.toUpperCase(), effects, next: 'praise' }] },
      praise: { speaker: n.id, text: L.praise[i % L.praise.length] },
    };
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
    if (on && !silent) { state.apply({ flags: { rode_bike: true } }, { quiet: true }); bus.emit('ui:toast', document.body.classList.contains('touch') ? 'BIKE UNLOCKED · TAP HOP OFF WHEN DONE' : 'BIKE UNLOCKED · [B] TO HOP OFF'); }
  }
  private setPlayerBody() {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const R = PLAYER_RES; // your textures are drawn at 3x, so the body is given in 3x texture pixels (same size in the world)
    if (this.onBike) { body.setSize(22 * R, 22 * R).setOffset(13 * R, 13 * R); }
    else { body.setSize(16 * R, 16 * R).setOffset(10 * R, 10 * R); }
  }

  private nearestInteractable(): Interactable | null {
    let best: Interactable | null = null, bd = Infinity;
    const px = this.player.x, py = this.player.y;
    for (const it of this.interactables) {
      const d = Math.hypot(it.x - px, it.y - py);
      // On the name tag (a little padding) counts too, and wins: tags can hang up to ~80px from the person
      const tb = it.tag && d < 260 ? it.tag.getBounds() : null;
      const onTag = !!tb && px > tb.x - 12 && px < tb.right + 12 && py > tb.y - 12 && py < tb.bottom + 12;
      const score = onTag ? Math.min(d, 1) : d;
      if ((d < it.r || onTag) && score < bd && it.label()) { bd = score; best = it; }
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
      const hood = neighborhoodAt(ped.sprite.x, ped.sprite.y), langs = hood ? HOOD_LANGS[hood] : undefined;
      if (langs && Math.random() < 0.35) { // the street's own language, now and then: "«Dzień dobry!» Good day!"
        const L = LANGS[Phaser.Utils.Array.GetRandom(langs)], p = Phaser.Utils.Array.GetRandom(L.phrases.slice(0, 2));
        this.bubble(ped.sprite, `«${p.text}» ${p.en}`);
      } else this.bubble(ped.sprite, streetLine(ped.district, hood));
    }
  }

  private tryAction() {
    if (this.mode !== 'play' || ui.blocking() || performance.now() - this.lastDialogueEnd < 250) return;
    const R = this.transit.riding;
    if (R) { // riding: your driver has opinions (drivers.ts)
      const { key, d } = driverFor(R.kind, R.kind === 'car' ? R.service : undefined);
      dialogue.say('driver', d.name, pickLine(`driver:${key}`, d.lines)); return;
    }
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
    const k = this.scale.width / DPR < 900 ? 16 / 14 / (this.cameras.main.zoom / DPR) : 1; // phones: about 16px on screen, not 12
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
    // Painted north-up for the tall lot (Deroy: field north, Paramount south), so no rotation and the light matches its neighbors
    // Kept inside the lot, a few pixels off the sidewalk on every side (Deroy: it was sitting on the sidewalk)
    const img = this.add.image((a.x + b.x) / 2, b.y - 4, 'lmk-liu').setOrigin(0.5, 1);
    const k = Math.min((b.x - a.x - 8) / img.width, (b.y - a.y - 8) / img.height);
    img.setScale(k).setDepth(b.y); // anyone on the sidewalk below draws in front
    // The campus painting is wider than tall, so it fills the lot's width and sits on its south edge: only the painted
    // part is solid, and the lawn left above it stays open to walk on
    const top = Math.max(a.y, b.y - 4 - img.displayHeight);
    const wall = this.add.zone((a.x + b.x) / 2, (top + b.y) / 2, b.x - a.x, b.y - top); // solid, like any building
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
    const courts: Court[] = [];
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
        { // a pickup game here: aim at the painted hoops' rims where they stand, else at the drawn rims
          const [rx, ry, rw, rh] = rect(u0, v0, u1, v1);
          const rims = [P(u0 + len * 0.06, vm), P(u1 - len * 0.06, vm)].map((r) => {
            if (!hasHoops) return r;
            const hp = L.props.filter((p) => p.kind === 'hoop').reduce((a, p) => (Math.hypot(p.x - r.x, p.y - r.y) < Math.hypot(a.x - r.x, a.y - r.y) ? p : a));
            return Math.hypot(hp.x - r.x, hp.y - r.y) < 120 ? { x: hp.x, y: hp.y - 33 } : r;
          });
          courts.push({ x: rx, y: ry, w: rw, h: rh, hoops: [rims[0], rims[1]] });
        }
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
    this.ballgames = new BallGames(this, courts, this.miniIgnore);
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
    else this.player.setTint(0x7fd4c8).setScale(2.2 / PLAYER_RES);
    this.flyShadow = this.add.ellipse(this.player.x, this.player.y, 90, 50, 0x000000, 0.25).setDepth(5e4);
    this.minimap.ignore(this.flyShadow);
    this.flap = this.tweens.add({ targets: this.player, scaleX: this.player.scaleX * 0.9, duration: 220, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    bus.emit('ui:toast', '🐉 DRAGON! 30 SECONDS. OVER THE BUILDINGS, OVER THE CARS, OVER THE CAUCUS.');
  }

  private endDragon() {
    this.flyUntil = 0; this.flap?.stop(); this.flyShadow?.destroy(); this.flyShadow = undefined;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    this.player.clearTint().setScale(1.2 / PLAYER_RES).setTexture(this.onBike ? 'player-bike' : 'player', 0);
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

  /** Which way B is from A on the map (north is up): an arrow and N/NE/E/SE/S/SW/W/NW */
  private compass(ax: number, ay: number, bx: number, by: number) {
    const a = Math.atan2(-(by - ay), bx - ax), k = ((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8;
    return [['→', 'E'], ['↗', 'NE'], ['↑', 'N'], ['↖', 'NW'], ['←', 'W'], ['↙', 'SW'], ['↓', 'S'], ['↘', 'SE']][k] as [string, string];
  }

  private takeSubway(from: { st: { id: string; name: string; routes: string[]; ada: number }; x: number; y: number }) {
    const tr = this.transit, obj = this.objectivePos(), near = obj ? tr.nearestStation(obj.x, obj.y)?.p : null;
    const items = tr.stations.filter((p) => p.st.id !== from.st.id).sort((a, b) => a.st.name.localeCompare(b.st.name)).map((p) => {
      const pl = tr.plan(from.st.id, p.st.id);
      return { value: p.st.id, label: p.st.name, html: `${p.st.routes.map(bullet).join('')} ${p.st.name}${p.st.ada === 1 ? ' ♿' : ''}`,
        sub: `<span class="dir">${this.compass(from.x, from.y, p.x, p.y).join(' ')}</span> ` + (pl ? `${pl.stops} stops${pl.transfers ? ` · ${pl.transfers} transfer${pl.transfers > 1 ? 's' : ''}` : ''} · ${neighborhoodAt(p.x, p.y) ?? ''}` : 'No route'), group: 'All Brooklyn stations' };
    });
    // One dropdown per line that stops here, its Brooklyn stops in order, this station marked where it falls
    const byId = new Map(items.map((i) => [i.value, i]));
    const lineItems = from.st.routes.flatMap((r) => {
      const ids = LINES[r] ?? [], at = ids.indexOf(from.st.id);
      const head = `${bullet(r)} <span>${r} train · ${ids.length} stops in Brooklyn</span>`;
      return ids.map((sid, k) => {
        const p = tr.byId[sid]; if (!p) return null;
        if (sid === from.st.id) return { value: sid, label: p.st.name, here: true, html: `● ${p.st.name}`, sub: 'You are here', section: r, sectionHtml: head };
        const n = Math.abs(k - at), xfer = p.st.routes.filter((x) => x !== r);
        return { ...byId.get(sid)!, html: `${p.st.name}${p.st.ada === 1 ? ' ♿' : ''}${xfer.length ? ` <small class="xfer">${xfer.map(bullet).join('')}</small>` : ''}`,
          sub: `<span class="dir">${this.compass(from.x, from.y, p.x, p.y).join(' ')}</span> ${n} stop${n === 1 ? '' : 's'} on the ${r} · ${neighborhoodAt(p.x, p.y) ?? ''}`, section: r, sectionHtml: head, group: undefined };
      }).filter(Boolean) as ChoiceItem[];
    });
    const menu: ChoiceItem[] = lineItems;
    if (near && near.st.id !== from.st.id) { const it = byId.get(near.st.id); if (it) menu.unshift({ ...it, group: 'Closest to your objective' }); }
    const ada = from.st.ada === 1 ? '♿ Elevator access.' : from.st.ada === 2 ? '♿ Partly accessible (one direction only).' : '<b>Stairs only.</b> ' + Transit.adaLine();
    ui.choose({ title: from.st.name, sub: `${from.st.routes.map(bullet).join('')} Tap in: $3 (Fair Fares: $1.50). ${ada}`, items: menu, search: true }, (id) => {
      const pl = tr.plan(from.st.id, id), dest = tr.byId[id];
      if (!pl || !dest) { bus.emit('ui:toast', 'NO TRAINS. (PLANNED WORK.)'); return; }
      const name = (sid: string) => tr.byId[sid]?.st.name ?? sid;
      const heading = (a: string, b: string) => { const p = tr.byId[a], q = tr.byId[b]; return p && q ? this.compass(p.x, p.y, q.x, q.y).join(' ') : ''; }; // which way the train is going into each stop
      ui.rideSubway(pl.legs.map((l) => ({ route: l.route, color: LINE_COLORS[l.route] ?? '#888', dark: 'NQRW'.includes(l.route), stops: l.stops.map(name), dirs: l.stops.map((sid, i) => (i ? heading(l.stops[i - 1], sid) : '')) })), () => {
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

  /** Search everyone on the map by name, role or neighborhood, and jump to them */
  private findPerson() {
    if (this.mode !== 'play' || ui.blocking()) return;
    if (this.transit.riding) { bus.emit('ui:toast', 'HOP OFF FIRST.'); return; }
    const famous = new Set(CAMEOS.map((c) => c.id));
    const NP = 'Nonprofits (Brooklyn Org grantees)';
    const kind = (n: NpcDef) => (n as any).ghost ? 'Ghosts of Brooklyn' : famous.has(n.id) ? 'Famous Brooklynites' : (n as any).npOrg ? NP : (n as any).blockFolk ? 'Neighbors' : 'Characters';
    const order = ['Characters', 'Famous Brooklynites', 'Ghosts of Brooklyn', NP, 'Neighbors'];
    const people = NPCS.filter((n) => this.entityPos[n.id]).map((n) => {
      const p = this.entityPos[n.id]!;
      const hood = neighborhoodAt(p.x, p.y);
      const np = n as any; // a nonprofit: what it works on, so you can search by issue ("housing", "youth")
      if (np.npOrg) return { n, g: kind(n), sub: `${(np.issues ?? []).join(' · ')}${hood ? ` · ${hood}` : ''}` };
      return { n, g: kind(n), sub: hood && !n.title.includes(hood) ? `${n.title} · ${hood}` : n.title };
    }).sort((a, b) => order.indexOf(a.g) - order.indexOf(b.g) || a.n.name.localeCompare(b.n.name));
    ui.choose({ title: 'Find someone', sub: 'Search by name, role or neighborhood. Pick one to jump there.', search: true,
      // Each category is an accordion with its count; searching opens the ones with matches
      items: people.map(({ n, g, sub }) => ({ value: n.id, label: n.name, sub, section: g, sectionHtml: `<i class="ch-swatch" style="background:${labelColor(n)}"></i>${g} <span class="ch-count">${people.filter((x) => x.g === g).length}</span>` })) }, (id) => {
      state.setFlag('used_find', true);
      this.jumpTo(id, true);
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
      this.holdRing.lineStyle(6, 0xf5c242, 1).beginPath().arc(this.player.x, this.player.y, r, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2).strokePath();
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
  /** Land right beside someone (Find, or a mission's giver when the mission starts) and, if asked, open the conversation */
  private jumpTo(id: string, talk: boolean) {
      const p = this.entityPos[id]; if (!p) return;
      // Land right beside them (in talking range), on open ground: not inside a building, not in the water
      const clear = (x: number, y: number) => { const tile = this.layout.tiles[Math.floor(y / TILE)]?.[Math.floor(x / TILE)]; return tile != null && tile !== T.WATER && tile !== T.OFFMAP && !this.layout.buildings.some((b) => x > b.x - 12 && x < b.x + b.w + 12 && y > b.y - 12 && y < b.y + b.h + 12); };
      const spots = [[0, 42], [0, -42], [42, 0], [-42, 0], [30, 30], [-30, 30], [30, -30], [-30, -30]].map(([dx, dy]) => ({ x: p.x + dx, y: p.y + dy })).filter((c) => clear(c.x, c.y));
      const theirs = (c: { x: number; y: number }) => !this.interactables.some((it) => it.id !== id && Math.hypot(it.x - c.x, it.y - c.y) < 42); // E talks to them, not a neighbor
      const t = spots.find(theirs) ?? spots[0] ?? { x: p.x, y: p.y + 42 };
      (this.player.body as Phaser.Physics.Arcade.Body).reset(t.x, t.y);
      this.cameras.main.flash(250, 255, 79, 163);
      const n = NPCS.find((x) => x.id === id);
      bus.emit('ui:toast', `THERE'S ${(n?.short ?? '').toUpperCase()}`);
      // No doubt who you found: their name tag pulses, and the conversation opens
      const tag = this.nameTags.find((nt) => nt.id === id)?.tag;
      if (tag) this.tweens.add({ targets: tag, scale: 1.3, duration: 260, yoyo: true, repeat: 3, ease: 'Sine.inOut', onComplete: () => tag.setScale(1) });
      if (talk && n && this.npcSprites[id]) this.time.delayedCall(450, () => { if (!ui.blocking()) this.talk(n); });
  }

  /** Each main mission starts where it's explained: once nothing is on screen, you land by the giver and their window opens (Deroy, Nov 24 2026) */
  private briefGiver: string | null = null; private briefAt = 0;
  private briefCheck() {
    if (!this.briefGiver || this.mode !== 'play' || ui.blocking() || this.transit.riding) return;
    if (this.time.now < this.briefAt) return; // let the mission title be read first (Deroy, Nov 24 2026)
    const id = this.briefGiver; this.briefGiver = null;
    this.time.delayedCall(700, () => this.jumpTo(id, true));
  }

  /** Mission 1 travel tips: how to reach your next grantee faster, by distance (a bike for short hops, transit for long ones) */
  private tipAt = 0; private tipsSeen = new Set<string>();
  private travelTips(now: number) {
    if (now < this.tipAt) return; this.tipAt = now + 1500;
    if (document.getElementById('tip')?.hidden === false) return; // another tip is up (the goal tip after Mission 1's briefing)
    const m = missions.active;
    if (m?.id !== 'network' || state.mission('network').stage !== 1 || this.mode !== 'play' || ui.blocking() || this.onBike || this.transit.riding) return;
    const next = netPicks().filter((id) => !state.flag(`net_${id}`) && this.entityPos[id])
      .map((id) => ({ id, d: Math.hypot(this.entityPos[id]!.x - this.player.x, this.entityPos[id]!.y - this.player.y) })).sort((a, b) => a.d - b.d)[0];
    if (!next || next.d < 1200) return; // close enough to walk: no tip
    const kind = next.d < 4500 ? 'bike' : 'transit'; // about 30 seconds on foot
    const key = `${next.id}:${kind}`;
    if (this.tipsSeen.has(key) || this.tipsSeen.size >= 6) return;
    if (this.tipsSeen.size && now - this.lastTip < 25000) return; // not back to back
    this.tipsSeen.add(key); this.lastTip = now;
    const who = NONPROFITS.find((n) => n.id === next.id)?.org ?? 'your next group';
    bus.emit('ui:tip', kind === 'bike'
      ? `${who} is a short ride away. Grab a BK Spokes bike at a dock (the bike signs on your map) and you'll be there in half the time.`
      : `${who} is across Brooklyn. Take the subway or a bus, hail a dollar van on Flatbush, or call a ride with RIDE [R]. Or jump there with FIND [F].`);
  }
  private lastTip = 0;

  update(_t: number, deltaMs: number) {
    this.travelTips(_t);
    this.briefCheck();
    { const want = this.mode === 'play' && !!missions.active?.night; if (want !== this.night) this.setNight(want); } // night missions
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
    if (this.autoWalk) { /* gliding over to someone you clicked (comeOver): no steering */ }
    else if (blocking || rideAt) {
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
    this.playerPin.setPosition(this.player.x, this.player.y - (this.onBike ? 50 : 42) - Math.abs(Math.sin(this.time.now / 260)) * 6).setVisible(this.mode === 'play' && !rideAt && !this.flying);
    { const a = this.player.rotation - Math.PI / 2, d = this.onBike ? 34 : 28; this.playerChevron.setPosition(this.player.x + Math.cos(a) * d, this.player.y + Math.sin(a) * d).setRotation(this.player.rotation).setDepth(this.player.y + 1).setVisible(this.mode === 'play' && !rideAt); }
    state.d.player.x = this.player.x; state.d.player.y = this.player.y;

    // World sim
    const cam = this.cameras.main;
    const view = new Phaser.Geom.Rectangle(cam.worldView.x - 64, cam.worldView.y - 64, cam.worldView.width + 128, cam.worldView.height + 160);
    this.peds.leader = { x: this.player.x, y: this.player.y };
    this.peds.update(dt, view);
    this.ballgames?.update(dt, view);
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
      if (R) parts.push(`<span class="pa" data-act="interact"><b>E</b> ${R.kind === 'bus' ? (R.request ? 'Stop requested' : 'Request the next stop') : R.kind === 'van' ? 'Get off here' : 'Get out here'}</span>`, '<span class="pa" data-act="action"><b>SPACE</b> Talk to the driver</span>');
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
      else if (this.onBike && document.body.classList.contains('touch')) parts.push('<span class="pa" data-act="action"><b>SPACE</b> Hop off the bike</span>'); // phones have no B key
      ui.setPrompt(parts.join('&nbsp;&nbsp;·&nbsp;&nbsp;'));
      // Touch buttons say what they'll do right now, and dim when there's nothing to do.
      const verb = (l: string) => { const w = l.split(' ')[0].toUpperCase(); return w === 'GRAB' ? 'BIKE' : w === 'TALK' ? 'TALK' : w; };
      const eL = R ? (R.kind === 'bus' ? 'STOP' : 'OFF') : sq ? 'DEBATE' : it ? verb(it.label() ?? '') : stn ? 'SUBWAY' : stop ? 'WAIT' : van ? 'HAIL' : ped ? 'CHAT' : null;
      const sL = R ? 'TALK' : fped && state.count('flyers') > 0 ? 'FLYER' : this.nearWall() && state.count('posters') > 0 ? 'POSTER' : this.onBike ? 'HOP OFF' : null;
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
    const targets = missions.targets().map((id) => ({ id, p: this.entityPos[id] })).filter((t) => t.p) as { id: string; p: { x: number; y: number } }[];
    const wr = this.opp.wrecking();
    if (wr) targets.push({ id: 'caucus', p: { x: wr.sprite.x, y: wr.sprite.y } });
    if (targets.length && this.mode === 'play' && !blocking) {
      let best = targets[0], bd = Infinity;
      for (const t of targets) { const dd = Phaser.Math.Distance.Between(this.player.x, this.player.y, t.p.x, t.p.y); if (dd < bd) { bd = dd; best = t; } }
      const ang = Math.atan2(best.p.y - this.player.y, best.p.x - this.player.x);
      // (no small arrow beside you any more: the goal pointer on the screen's edge already shows the way)
      // Distance in city blocks (a block is 18–22 tiles, road included): how Brooklyn gives directions
      const blocks = bd / (TILE * ((BLOCK_W + BLOCK_H) / 2)), far = blocks < 0.75 ? '½ BLOCK' : `${Math.round(blocks)} BLOCK${Math.round(blocks) === 1 ? '' : 'S'}`;
      ui.setDistance(far, ang);
      // Off screen? A big pointer on the screen's edge says which way, who, and how far
      const cam = this.cameras.main, sx = (x: number) => ((x - cam.worldView.x) * cam.zoom) / DPR, sy = (y: number) => ((y - cam.worldView.y) * cam.zoom) / DPR; // CSS pixels, for the HUD
      const who = best.id === 'caucus' ? 'CAUCUS' : NPCS.find((n) => n.id === best.id)?.short.toUpperCase() ?? 'GOAL';
      ui.setGoalPointer({ fx: sx(this.player.x), fy: sy(this.player.y), tx: sx(best.p.x), ty: sy(best.p.y), label: `${who} · ${far}` });
    } else { this.arrow.setVisible(false); ui.setDistance(null); ui.setGoalPointer(null); }

    ui.tick();
  }
}
