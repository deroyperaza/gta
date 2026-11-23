import type Phaser from 'phaser';
import { bus } from '../core/bus';
import { state } from '../core/state';
import { DISTRICTS, type District, type ItemId } from '../core/types';
import { ITEMS } from '../data/items';
import { LESSONS } from '../data/lessons';
import { GRANTEES } from '../data/grantees';
import { NONPROFITS, ISSUES } from '../data/nonprofits';
import { MISSIONS, type MissionDef } from '../data/missions';
import { NPCS, NPC_BY_ID } from '../data/npcs';
import { dialogue } from '../systems/dialogue';
import { missions } from '../systems/missions';
import { BLOCK_H, BLOCK_W, COLS, MAP_H, MAP_W, ROAD, ROWS, T, TILE, WALKABLE, districtOfBlock, neighborhoodOfBlock, type WorldLayout } from '../world/layout';

/**
 * DOM overlay UI: HUD, dialogue, journal, map, pause, title, mission screens.
 * Pure HTML/CSS so it stays crisp at any resolution and can later grow
 * touch controls.
 */
type Panel = 'title' | 'pause' | 'journal' | 'map' | 'passed' | 'help' | 'chooser' | 'ride' | null;
export interface ChoiceItem { value: string; label: string; sub?: string; html?: string; group?: string }

const $ = <T extends HTMLElement = HTMLElement>(sel: string) => document.querySelector(sel) as T;
const mlabel = (def: MissionDef) => (def.side ? def.kind ?? 'MEDIATION' : `MISSION ${def.number}`);
const Phaser_rand = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

class UI {
  private world: (Phaser.Scene & { layout: WorldLayout; player: Phaser.GameObjects.Sprite; mode: string; textures: Phaser.Textures.TextureManager }) | null = null;
  private panel: Panel = 'title';
  private dialogueOpen = false;
  private typing: { full: string; i: number; timer: number } | null = null;
  private choiceCount = 0;
  private toastQueue: string[] = [];
  private lastObjText: string | null = null;
  private peekTimer = 0;
  private toastBusy = false;
  private lastTick = 0;
  private touch = { x: 0, y: 0 };
  private passedAt = 0;
  private onChoose: ((v: string) => void) | null = null;
  private chooseItems: ChoiceItem[] = [];

  init() {
    bus.on('state:changed', () => this.renderHud());
    bus.on('mission:updated', () => this.renderObjective());
    bus.on('ui:toast', (t: string) => this.toast(t));
    bus.on('flyers:gained', (n: number) => this.showFlyer('big', n));
    bus.on('flyer:handed', () => this.showFlyer('mini'));
    // Tap the mission card to fold it to one line (remembered); a new objective opens it for a few seconds
    // Phones start with it folded to one line (more street to see); your own choice is remembered
    try { const v = localStorage.getItem('gta-obj-min'); if (v === '1' || (v == null && (innerWidth <= 600 || innerHeight <= 500))) $('#objective').classList.add('min'); } catch { /* storage blocked */ }
    $('#objective').addEventListener('click', () => {
      const el = $('#objective'); el.classList.remove('peek');
      const min = el.classList.toggle('min');
      try { localStorage.setItem('gta-obj-min', min ? '1' : '0'); } catch { /* storage blocked */ }
    });
    $('#inventory').addEventListener('click', (e) => { if ((e.target as HTMLElement).closest('.inv-flyers')) this.showFlyer('big'); });
    bus.on('dialogue:show', (d: any) => this.showDialogue(d));
    bus.on('dialogue:end', () => this.hideDialogue());
    bus.on('mission:passed', (p: any) => this.showPassed(p.def, p.lines, p.toast));
    bus.on('mission:failed', (p: any) => this.showFailed(p.def, p.text));
    bus.on('mission:started', (def: MissionDef) => this.missionIntro(def));
    bus.on('world:district', (_d: District, info: { name: string; color: string; blurb: string }) => this.districtBanner(info));
    bus.on('minimap:layout', (r: { x: number; y: number; size: number; h?: number }) => {
      const f = $('#minimap-frame'); f.style.right = `${Math.max(0, window.innerWidth - r.x - r.size)}px`; f.style.top = `${r.y}px`; f.style.width = `${r.size}px`; f.style.height = `${r.h ?? r.size}px`;
    });
    window.addEventListener('keydown', (e) => this.onKey(e));
    this.bindButtons();
    this.bindTouch();
    this.showTitle();
  }

  attachWorld(scene: any) {
    this.world = scene;
    // A New Game / Continue tapped before the world finished loading runs now.
    if (this.pendingStart) { const ev = this.pendingStart; this.pendingStart = null; setTimeout(() => bus.emit(ev), 0); }
  }
  private pendingStart: string | null = null;
  private begin(ev: 'game:new' | 'game:load') {
    this.startPlay(); if (this.world) bus.emit(ev); else this.pendingStart = ev;
    if (ev === 'game:new') setTimeout(() => this.openPanel('help'), 300); // the goal and the meters, before anything else
  }

  blocking() { return this.panel !== null || this.dialogueOpen; }

  touchVector() { return this.touch; }

  // ------------------------------------------------------------------ KEYS
  private onKey(e: KeyboardEvent) {
    const k = e.key.toLowerCase();
    if ((e.target as HTMLElement)?.tagName === 'INPUT' && k !== 'escape' && k !== 'enter') return; // typing in a search box
    if (this.panel === 'ride') return; // underground: nothing to do but ride
    if (this.panel === 'chooser' && k === 'enter') { const first = $('#ch-list .ch-item') as HTMLElement | null; first?.click(); e.preventDefault(); return; }
    if (this.dialogueOpen) {
      if (/^[1-4]$/.test(k) && Number(k) <= this.choiceCount) { this.pickVisible(Number(k) - 1); e.preventDefault(); return; }
      if (k === 'e' || k === ' ' || k === 'enter') { this.advanceDialogue(); e.preventDefault(); }
      if (k === 'escape') { dialogue.end(); e.preventDefault(); }
      return;
    }
    if (this.panel === 'passed') { if (performance.now() - this.passedAt > 900) this.closePanel(); return; }
    if (this.panel === 'title') return;
    if (k === 'escape') { e.preventDefault(); if (this.panel) this.closePanel(); else this.openPanel('pause'); return; }
    if (k === 'm') { this.panel === 'map' ? this.closePanel() : this.openPanel('map'); return; }
    if (k === 'j') { this.panel === 'journal' ? this.closePanel() : this.openPanel('journal'); return; }
    if (this.panel || e.repeat) return;
    if (k === 'e') bus.emit('ui:interact');
    else if (k === ' ') { e.preventDefault(); bus.emit('ui:action'); }
    else if (k === 'b') bus.emit('ui:bike');
    else if (k === 'r') bus.emit('ui:ride');
    else if (k === 'f') bus.emit('ui:find');
  }

  /** Mission timers keep running while you ride the train (it takes time) */
  timerRuns() { return this.panel === 'ride'; }

  /** A searchable list to pick from: subway stops, ride apps, destinations. */
  choose(o: { title: string; sub?: string; items: ChoiceItem[]; search?: boolean }, onPick: (v: string) => void) {
    this.openPanel('chooser');
    this.onChoose = onPick; this.chooseItems = o.items;
    $('#ch-title').textContent = o.title;
    $('#ch-sub').innerHTML = o.sub ?? '';
    const inp = $<HTMLInputElement>('#ch-search');
    inp.hidden = !o.search; inp.value = '';
    this.renderChoices('');
    if (o.search && !matchMedia('(pointer: coarse)').matches) setTimeout(() => inp.focus(), 30);
  }
  private renderChoices(q: string) {
    const ql = q.trim().toLowerCase();
    let lastGroup = '';
    $('#ch-list').innerHTML = this.chooseItems.filter((i) => !ql || i.label.toLowerCase().includes(ql) || (i.sub ?? '').toLowerCase().includes(ql)).map((i) => {
      const head = i.group && i.group !== lastGroup ? `<div class="ch-group">${(lastGroup = i.group)}</div>` : '';
      return `${head}<button class="ch-item" data-v="${i.value}"><b>${i.html ?? i.label}</b>${i.sub ? `<span>${i.sub}</span>` : ''}</button>`;
    }).join('') || '<p class="sub">Nothing by that name.</p>';
  }

  /** Riding the subway: a car interior, the line bullets, the stops ticking by. */
  rideSubway(legs: { route: string; color: string; dark: boolean; stops: string[]; dirs?: string[] }[], onDone: () => void) {
    this.openPanel('ride');
    const card = $('#ride-card');
    const seq: { route: string; color: string; dark: boolean; name: string; transfer: boolean; dir: string }[] = [];
    legs.forEach((l, li) => l.stops.slice(1).forEach((n, i) => seq.push({ route: l.route, color: l.color, dark: l.dark, name: n, transfer: li > 0 && i === 0, dir: l.dirs?.[i + 1] ?? '' })));
    let i = 0;
    const lines = ['STAND CLEAR OF THE CLOSING DOORS, PLEASE.', 'WE ARE BEING HELD MOMENTARILY BY THE TRAIN DISPATCHER.', 'SHOWTIME! (A MAN SWINGS FROM THE POLE.)', 'IF YOU SEE SOMETHING, SAY SOMETHING.', 'THE NEXT STOP IS…', 'SOMEONE IS EATING A WHOLE ROTISSERIE CHICKEN.'];
    const show = () => {
      const st = seq[i];
      if (!st) { this.closePanel(); onDone(); return; }
      card.innerHTML = `<div class="ride-line"><i class="bullet big" style="background:${st.color};color:${st.dark ? '#111' : '#fff'}">${st.route}</i>${st.transfer ? '<em>TRANSFER</em>' : ''}</div>
        <div class="ride-next">${i === seq.length - 1 ? 'LAST STOP FOR YOU' : 'NEXT STOP'}${st.dir ? ` <span class="ride-dir">HEADING ${st.dir}</span>` : ''}</div><div class="ride-stop">${st.name}</div>
        <div class="ride-bar"><i style="width:${((i + 1) / seq.length) * 100}%"></i></div>
        <div class="ride-pa">${Phaser_rand(lines)}</div>`;
      i++; setTimeout(show, st.transfer ? 1400 : 750);
    };
    show();
  }

  // ------------------------------------------------------------------ PANELS
  private openPanel(p: Exclude<Panel, null>) {
    this.closePanel(true);
    this.panel = p;
    if (p === 'journal') this.renderJournal();
    if (p === 'map') this.renderMap();
    if (p === 'pause') this.renderPause();
    $(`#${p}`).classList.add('open');
  }
  private closePanel(silent = false) {
    if (this.panel) $(`#${this.panel}`).classList.remove('open');
    this.panel = null;
    if (!silent) this.renderHud();
  }

  showTitle() {
    this.closePanel(true);
    this.panel = 'title';
    $('#title').classList.add('open');
    $('#hud').classList.add('hidden');
    const info = state.saveInfo();
    const cont = $<HTMLButtonElement>('#btn-continue');
    cont.disabled = !info;
    cont.querySelector('small')!.textContent = info ? `Solidarity ${info.solidarity} · ${fmtTime(info.playTime)} played` : 'No save yet';
    bus.emit('game:title');
  }

  private startPlay() {
    this.closePanel(true);
    $('#hud').classList.remove('hidden');
    this.renderHud();
  }

  private bindButtons() {
    $('#btn-new').onclick = () => this.begin('game:new');
    $('#btn-continue').onclick = () => this.begin('game:load');
    $('#btn-help').onclick = () => { $('#help').classList.add('open'); };
    $('#help-close').onclick = () => { if (this.panel === 'help') this.closePanel(); $('#help').classList.remove('open'); };
    $('#hud-help').onclick = () => this.openPanel('help');
    $('#pause').addEventListener('click', (e) => {
      const a = (e.target as HTMLElement).closest('[data-act]')?.getAttribute('data-act');
      if (a === 'resume') this.closePanel();
      if (a === 'save') { state.save(); this.renderPause(); }
      if (a === 'load') { if (state.hasSave()) { this.closePanel(); bus.emit('game:load'); } }
      if (a === 'journal') this.openPanel('journal');
      if (a === 'map') this.openPanel('map');
      if (a === 'help') $('#help').classList.add('open');
      if (a === 'title') { state.save(); this.showTitle(); }
    });
    $('#chooser').addEventListener('click', (e) => {
      const t = e.target as HTMLElement;
      if (t.matches('.close, .panel-bg')) { this.closePanel(); return; }
      const it = t.closest('.ch-item') as HTMLElement | null;
      if (it) { const cb = this.onChoose; this.onChoose = null; this.closePanel(); cb?.(it.dataset.v!); }
    });
    $('#ch-search').addEventListener('input', (e) => this.renderChoices((e.target as HTMLInputElement).value));
    $('#hud-ride').onclick = () => bus.emit('ui:ride');
    $('#hud-find').onclick = () => bus.emit('ui:find');
    // Tap a face in a conversation to see the portrait big; tap anywhere to close
    $('#dlg-portrait').addEventListener('click', (e) => { e.stopPropagation(); this.zoomPortrait(); });
    $('#portrait-zoom').addEventListener('click', (e) => { e.stopPropagation(); $('#portrait-zoom').hidden = true; });
    for (const id of ['journal', 'map']) $(`#${id}`).addEventListener('click', (e) => { if ((e.target as HTMLElement).matches('.close, .panel-bg')) this.closePanel(); });
    $('#passed').addEventListener('click', () => { if (performance.now() - this.passedAt > 600) this.closePanel(); });
    $('#hud-journal').onclick = () => this.openPanel('journal');
    $('#hud-map').onclick = () => this.openPanel('map');
    $('#minimap-frame').onclick = () => this.openPanel('map'); // tap the mini-map for the big map
    $('#hud-pause').onclick = () => this.openPanel('pause');
    this.setupFullscreen();
    // Clicking (or tapping) an on-screen prompt does the same as its key
    $('#prompt').addEventListener('pointerdown', (e) => {
      const a = (e.target as HTMLElement).closest<HTMLElement>('.pa');
      if (!a || this.dialogueOpen) return;
      e.preventDefault(); e.stopPropagation();
      bus.emit(a.dataset.act === 'action' ? 'ui:action' : 'ui:interact');
    });
    $('#dialogue').addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('#dlg-close')) { e.stopPropagation(); dialogue.end(); return; }
      const btn = (e.target as HTMLElement).closest('[data-choice]');
      if (btn) this.pick(Number(btn.getAttribute('data-choice')));
      else this.advanceDialogue();
    });
  }

  /** Minimal virtual joystick + buttons for touch devices (foundation for mobile). */
  private bindTouch() {
    const pad = $('#touch-pad'), knob = $('#touch-knob');
    // Desktop: drag the joystick with the mouse (touch screens use the touch handlers below)
    {
      let mid: number | null = null, mx = 0, my = 0;
      const steer = (x: number, y: number) => {
        const dx = x - mx, dy = y - my, m = Math.min(1, Math.hypot(dx, dy) / 50), a = Math.atan2(dy, dx);
        this.touch = { x: Math.cos(a) * m, y: Math.sin(a) * m };
        knob.style.transform = `translate(${Math.cos(a) * m * 40}px, ${Math.sin(a) * m * 40}px)`;
      };
      pad.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'touch') return;
        mid = e.pointerId; pad.setPointerCapture(e.pointerId); pad.classList.add('held');
        const r = pad.getBoundingClientRect(); mx = r.left + r.width / 2; my = r.top + r.height / 2; steer(e.clientX, e.clientY); e.preventDefault();
      });
      pad.addEventListener('pointermove', (e) => { if (e.pointerId === mid) steer(e.clientX, e.clientY); });
      const stop = (e: PointerEvent) => { if (e.pointerId !== mid) return; mid = null; pad.classList.remove('held'); this.touch = { x: 0, y: 0 }; knob.style.transform = ''; };
      pad.addEventListener('pointerup', stop); pad.addEventListener('pointercancel', stop);
    }
    if (!('ontouchstart' in window)) return;
    document.body.classList.add('touch');
    let id: number | null = null; let cx = 0, cy = 0;
    pad.addEventListener('touchstart', (e) => { const t = e.changedTouches[0]; id = t.identifier; const r = pad.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; e.preventDefault(); }, { passive: false });
    pad.addEventListener('touchmove', (e) => {
      for (const t of Array.from(e.changedTouches)) if (t.identifier === id) {
        const dx = t.clientX - cx, dy = t.clientY - cy, m = Math.min(1, Math.hypot(dx, dy) / 50), a = Math.atan2(dy, dx);
        this.touch = { x: Math.cos(a) * m, y: Math.sin(a) * m };
        knob.style.transform = `translate(${Math.cos(a) * m * 40}px, ${Math.sin(a) * m * 40}px)`;
      }
      e.preventDefault();
    }, { passive: false });
    const end = () => { id = null; this.touch = { x: 0, y: 0 }; knob.style.transform = ''; };
    pad.addEventListener('touchend', end); pad.addEventListener('touchcancel', end);
    $('#touch-e').addEventListener('touchstart', (e) => { e.preventDefault(); if (this.dialogueOpen) this.advanceDialogue(); else bus.emit('ui:interact'); }, { passive: false });
    $('#touch-sp').addEventListener('touchstart', (e) => { e.preventDefault(); if (this.dialogueOpen) this.advanceDialogue(); else bus.emit('ui:action'); }, { passive: false });
  }

  // ------------------------------------------------------------------ HUD
  private touchLabels = '';
  /** Label the touch buttons with the action they'll take; dim them when there's nothing in reach. */
  setTouchLabels(e: string | null, sp: string | null) {
    const key = `${e}|${sp}`; if (key === this.touchLabels) return; this.touchLabels = key;
    const set = (id: string, k: string, label: string | null) => {
      const b = $(id); b.classList.toggle('off', !label);
      b.innerHTML = `<span class="tk">${k}</span><small>${label ?? (k === 'E' ? 'TALK' : 'FLYER')}</small>`;
    };
    set('#touch-e', 'E', e); set('#touch-sp', '⎵', sp);
  }

  setPrompt(html: string) {
    const el = $('#prompt');
    if (el.dataset.html !== html) {
      el.dataset.html = html; el.innerHTML = html; el.classList.toggle('show', !!html);
      // Phones show each action as a big button; an icon says what kind
      el.querySelectorAll<HTMLElement>('.pa').forEach((a) => {
        const t = a.textContent?.toLowerCase() ?? '';
        a.dataset.ico = /talk|chat/.test(t) ? '👋' : /subway/.test(t) ? '🚇' : /wait|stop|bus/.test(t) ? '🚌' : /van/.test(t) ? '🚐' : /bike/.test(t) ? '🚲' : /debate/.test(t) ? '📣' : /flyer/.test(t) ? '📄' : /poster/.test(t) ? '📌' : /dragon/.test(t) ? '🐉' : '▶';
      });
    }
  }
  setDistance(n: string | null, ang?: number) {
    const el = $('#obj-dist');
    // Which way, on screen: north is up (8 directions)
    const dir = ang == null ? '' : [' →E', ' ↘SE', ' ↓S', ' ↙SW', ' ←W', ' ↖NW', ' ↑N', ' ↗NE'][((Math.round(ang / (Math.PI / 4)) % 8) + 8) % 8];
    const txt = n == null ? '' : `${n}${dir}`;
    if (el.textContent !== txt) el.textContent = txt;
  }

  /**
   * The goal pointer: when your target is off screen, a big arrow sits on the edge of the open play area
   * (below the HUD, above the touch controls), pointing at it, with who and how far.
   */
  private goalArea: { l: number; t: number; r: number; b: number; at: number; rects: DOMRect[] } | null = null;
  setGoalPointer(g: { fx: number; fy: number; tx: number; ty: number; label: string } | null) {
    const el = $('#goal-pointer');
    const W = innerWidth, H = innerHeight;
    if (!g || this.dialogueOpen) { el.hidden = true; return; }
    const now = performance.now();
    if (!this.goalArea || now - this.goalArea.at > 500) { // re-measure the HUD twice a second, not every frame
      // Where each HUD piece sits decides what it blocks (the mission box is at the top on phones, the bottom on desktop):
      // pieces across the middle of the screen bound the open band; pieces in a corner only push the pointer out of them
      const rects = ['#stats', '#hud-buttons', '#objective', '#minimap-frame', '#touch-pad', '#touch-btns', '#prompt'].map((sel) => {
        const e = document.querySelector(sel) as HTMLElement | null; if (!e || !e.offsetParent) return null;
        const r = e.getBoundingClientRect(); return r.width && r.height ? r : null;
      }).filter(Boolean) as DOMRect[];
      let t = 44, b = H - 30;
      for (const r of rects) if (r.left < W / 2 && r.right > W / 2) { if (r.top + r.height / 2 < H / 2) t = Math.max(t, r.bottom + 44); else b = Math.min(b, r.top - 30); }
      this.goalArea = { l: 48, t, r: W - 48, b: Math.max(t + 80, b), at: now, rects };
    }
    const A = this.goalArea;
    // On screen and in the open area: the person is right there, no pointer needed
    if (g.tx > A.l && g.tx < A.r && g.ty > A.t && g.ty < A.b) { el.hidden = true; return; }
    // Aim from you (kept inside the area) toward the target, and stop where that line meets the area's edge
    const cx = Math.min(A.r - 1, Math.max(A.l + 1, g.fx)), cy = Math.min(A.b - 1, Math.max(A.t + 1, g.fy)), dx = g.tx - cx, dy = g.ty - cy;
    const kx = dx > 0 ? (A.r - cx) / dx : dx < 0 ? (A.l - cx) / dx : Infinity, ky = dy > 0 ? (A.b - cy) / dy : dy < 0 ? (A.t - cy) / dy : Infinity;
    const k = Math.min(kx, ky), x = cx + dx * k, ang = Math.atan2(dy, dx);
    let y = cy + dy * k;
    // Landed on a corner piece (scorecard, mini-map, joystick)? Slide clear of it, toward the middle of the screen
    for (const r of A.rects) if (x > r.left - 70 && x < r.right + 70 && y > r.top - 40 && y < r.bottom + 44) y = r.top + r.height / 2 < H / 2 ? r.bottom + 44 : r.top - 40;
    el.hidden = false;
    el.style.left = `${x}px`; el.style.top = `${y}px`;
    ($('#goal-pointer i') as HTMLElement).style.transform = `rotate(${ang}rad)`;
    const b = $('#goal-pointer b'); if (b.textContent !== g.label) b.textContent = g.label;
    // keep the label inside the screen: it sits on the inner side of the arrow
    b.style.transform = `translate(calc(-50% + ${(-Math.cos(ang) * 62).toFixed(1)}px), calc(-50% + ${(-Math.sin(ang) * 44).toFixed(1)}px))`; // on the inner side of the arrow, toward the middle of the screen
  }

  tick() {
    const now = performance.now();
    if (now - this.lastTick < 200) return;
    this.lastTick = now;
    const def = missions.active;
    const el = $('#timer');
    const tl = def ? state.mission(def.id).timeLeft : null;
    if (tl != null) {
      el.classList.add('show');
      el.textContent = fmtClock(tl);
      el.classList.toggle('urgent', tl < 30);
      // Phones: sit right under the mission box, however tall it is
      if (innerWidth <= 600) { const ob = $('#objective').getBoundingClientRect(); el.style.top = `${Math.round(ob.bottom + 10)}px`; } else el.style.top = '';
    } else el.classList.remove('show');
    const d = (this.world as any)?.district as District | null;
    if (d) {
      const tr = state.d.trust[d];
      $('#trust-name').textContent = DISTRICTS[d].name;
      $('#trust-name').style.color = DISTRICTS[d].color;
      $<HTMLElement>('#trust-fill').style.width = `${(tr + 100) / 2}%`;
      $<HTMLElement>('#trust-fill').style.background = DISTRICTS[d].color;
      $('#trust-val').textContent = `${tr > 0 ? '+' : ''}${tr}`;
    }
  }

  renderHud() {
    const d = state.d;
    $('#sol-val').textContent = String(d.solidarity);
    const lvl = Math.floor(d.solidarity / 250);
    $<HTMLElement>('#sol-fill').style.width = `${((d.solidarity % 250) / 250) * 100}%`;
    $('#sol-lvl').textContent = `LV ${lvl + 1}`;
    $('#pow-val').textContent = String(d.power);
    $('#att-val').textContent = String(d.attention);
    $<HTMLElement>('#att-fill').style.width = `${d.attention}%`;
    { const st = state.stars(); $('#att-stars').textContent = st ? '★'.repeat(st) : ''; }
    const inv = (Object.keys(ITEMS) as ItemId[]).filter((k) => d.inventory[k] > 0);
    $('#inventory').innerHTML = inv.length
      ? inv.map((k) => `<div class="inv${k === 'flyers' ? ' inv-flyers' : ''}" title="${ITEMS[k].name}: ${ITEMS[k].desc}${k === 'flyers' ? ' (tap to see it)' : ''}">${ITEMS[k].icon}<span>${d.inventory[k]}</span></div>`).join('')
      : '<div class="inv-empty">Tote bag: empty (emotionally full)</div>';
    $('#inventory').classList.toggle('empty', !inv.length);
    this.renderObjective();
  }

  private renderObjective() {
    const def = missions.active;
    $('#obj-title').textContent = def ? `${mlabel(def)} · ${def.title}` : 'FREE ROAM';
    const text = missions.objectiveText(), el = $('#objective');
    if (text !== this.lastObjText && this.lastObjText !== null && el.classList.contains('min')) {
      el.classList.add('peek'); clearTimeout(this.peekTimer); this.peekTimer = window.setTimeout(() => el.classList.remove('peek'), 5000);
    }
    this.lastObjText = text;
    $('#obj-text').textContent = text;
    const m = def ? state.mission(def.id) : null;
    $('#obj-optional').innerHTML = def?.optional && m && m.stage > 0
      ? def.optional.map((o) => `<li class="${m.optionalDone[o.id] ? 'done' : ''}">${m.optionalDone[o.id] ? '★' : '☆'} ${o.text}</li>`).join('') : '';
  }

  private toast(t: string) {
    this.toastQueue.push(t);
    if (!this.toastBusy) this.nextToast();
  }
  private nextToast() {
    const t = this.toastQueue.shift();
    if (!t) { this.toastBusy = false; return; }
    this.toastBusy = true;
    const el = document.createElement('div');
    el.className = 'toast'; el.textContent = t;
    $('#toasts').appendChild(el);
    setTimeout(() => el.classList.add('out'), 1700);
    setTimeout(() => el.remove(), 2100);
    setTimeout(() => this.nextToast(), 330);
  }

  private districtBanner(info: { name: string; color: string; blurb: string }) {
    const el = $('#district');
    el.innerHTML = `<div class="dname" style="--dc:${info.color}">${info.name}</div><div class="dblurb">${info.blurb}</div>`;
    el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  }

  private missionIntro(def: MissionDef) {
    const el = $('#mission-intro');
    el.innerHTML = `<div class="mi-num">${mlabel(def)}</div><div class="mi-title">${def.title}</div><div class="mi-tag">${def.tagline}</div>`;
    el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
    // Clear the flag when the intro finishes so the mission box and neighborhood banner come back.
    clearTimeout(this.introTimer);
    this.introTimer = window.setTimeout(() => el.classList.remove('show'), 4600);
  }
  private introTimer = 0;

  // ------------------------------------------------------------------ FULL SCREEN
  /** Android/iPad/desktop: a real full-screen button. iPhone Safari can't, so show the Home Screen tip instead. */
  private setupFullscreen() {
    const standalone = matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches || (navigator as any).standalone === true;
    const el = document.documentElement as any;
    const canFull = !!(document.fullscreenEnabled || (document as any).webkitFullscreenEnabled) && !!(el.requestFullscreen || el.webkitRequestFullscreen);
    const btn = $<HTMLButtonElement>('#hud-full');
    if (canFull && !standalone) {
      btn.hidden = false;
      btn.onclick = () => {
        if (document.fullscreenElement || (document as any).webkitFullscreenElement) (document.exitFullscreen ?? (document as any).webkitExitFullscreen).call(document);
        else (el.requestFullscreen ?? el.webkitRequestFullscreen).call(el).catch?.(() => {});
      };
    }
    const iOS = /iPhone|iPod/.test(navigator.userAgent);
    $('#install-tip').hidden = !(iOS && !standalone);
  }

  // ------------------------------------------------------------------ FLYERS
  /** What the flyer in your tote bag actually says, depending on the mission. */
  private flyerHTML() {
    if (state.d.activeMission === 'march') return `
      <div class="fl-kicker">BOROUGH BUDGET · LINE 47</div>
      <div class="fl-head">NO<br>GAZEBO!</div>
      <div class="fl-sub">Fund the fridge · Keep the tenant lawyers · Open the library Sundays</div>
      <div class="fl-when"><b>RALLY</b> Borough Hall steps<br><b>FRIDAY</b> 5 PM</div>
      <div class="fl-foot">Bring a neighbor. Sidewalks only. Big voices.</div>`;
    return `
      <div class="fl-kicker">COMMUNITY FRIDGE · GATES AVE</div>
      <div class="fl-head">FREE<br>FOOD</div>
      <div class="fl-sub">Take what you need.<br>Leave what you can.</div>
      <div class="fl-when"><b>OPEN</b> 24/7 · no questions<br><b>BY</b> your neighbors</div>
      <div class="fl-foot">Gates Ave &amp; the mural. Look for the lime.</div>`;
  }
  private flyerTimer = 0;
  showFlyer(mode: 'big' | 'mini', got?: number) {
    const el = $('#flyer-card');
    el.className = mode;
    el.innerHTML = (mode === 'big' ? `<div class="fl-label">${got ? `YOU GOT ${got} FLYERS` : 'YOUR FLYER'}</div>` : '') + `<div class="flyer">${this.flyerHTML()}</div>`;
    void el.offsetWidth; el.classList.add('show');
    clearTimeout(this.flyerTimer);
    this.flyerTimer = window.setTimeout(() => el.classList.remove('show'), mode === 'big' ? 3800 : 1500);
    if (mode === 'big') el.onclick = () => el.classList.remove('show');
  }

  // ------------------------------------------------------------------ DIALOGUE
  private showDialogue(d: { owner: string; speaker: string; text: string; choices: { text: string; index: number; tag?: string }[] }) {
    this.dialogueOpen = true;
    // Scene-setting lines (*in italics*) show the person you're talking to, not your own face
    const npc = NPC_BY_ID[d.speaker] ?? (d.speaker === 'you' && d.text.trim().startsWith('*') ? NPC_BY_ID[d.owner] : undefined);
    const name = npc ? npc.name : d.speaker === 'you' ? 'You' : d.speaker;
    $('#dlg-name').textContent = name;
    $('#dlg-title').textContent = npc ? npc.title : '';
    $<HTMLElement>('#dlg-name').style.background = npc?.color ?? '#ff4fa3';
    $('#dlg-portrait').classList.toggle('ghost', !!(npc as any)?.ghost); // ghosts look like ghosts here too
    this.drawPortrait(npc ? `npc-${npc.id}` : d.speaker === 'Doña Rosa' ? 'vendor-rosa' : d.speaker === 'Hamid' ? 'vendor-hamid' : d.owner === 'cat' ? 'cat' : d.owner === 'fridge' ? 'fridge-full' : d.owner === 'gop' ? 'gop0' : 'player');
    const rel = npc ? state.rel(npc.id) : null;
    $('#dlg-rel').innerHTML = rel != null ? `<span>RELATIONSHIP</span><div class="rt"><i style="width:${(rel + 100) / 2}%"></i></div>` : '';
    $('#dialogue').classList.add('open');
    const choicesEl = $('#dlg-choices');
    choicesEl.innerHTML = '';
    choicesEl.classList.remove('show');
    this.choiceCount = d.choices.length;
    // Tags (FACT, BEST...) are for scoring and testing only. Never show them: the player has to know.
    choicesEl.innerHTML = d.choices.map((c, i) => `<button data-choice="${c.index}"><b>${i + 1}</b> ${esc(c.text)}</button>`).join('');
    // map visible order -> index
    choicesEl.dataset.map = JSON.stringify(d.choices.map((c) => c.index));
    $('#dlg-more').style.visibility = d.choices.length ? 'hidden' : 'visible';
    // Say plainly that there's more: a real button, "keep going" when another line follows, "done" on the last one
    const more = !!(dialogue as any).node?.next;
    $('#dlg-more').innerHTML = `<button type="button" class="dlg-go">${more ? 'KEEP GOING ▶' : 'DONE ✓'}<kbd>E</kbd></button>`;
    // typewriter
    if (this.typing) clearInterval(this.typing.timer);
    const textEl = $('#dlg-text'); textEl.textContent = '';
    const full = d.text;
    this.typing = { full, i: 0, timer: 0 };
    this.typing.timer = window.setInterval(() => {
      if (!this.typing) return;
      this.typing.i += 2;
      textEl.textContent = full.slice(0, this.typing.i);
      if (this.typing.i >= full.length) this.finishTyping();
    }, 16);
  }
  private finishTyping() {
    if (!this.typing) return;
    clearInterval(this.typing.timer);
    $('#dlg-text').textContent = this.typing.full;
    this.typing = null;
    $('#dlg-choices').classList.add('show');
  }
  private advanceDialogue() {
    if (this.typing) { this.finishTyping(); return; }
    if (this.choiceCount > 0) return;
    dialogue.advance();
    // advance() with no next ends the dialogue
  }
  /** Keyboard: choose by on-screen order (1-4). */
  private pickVisible(i: number) {
    const map: number[] = JSON.parse($('#dlg-choices').dataset.map || '[]');
    if (map[i] != null) this.pick(map[i]);
  }
  /** Choose by the dialogue's real choice index. */
  private pick(real: number) {
    if (this.typing) { this.finishTyping(); return; }
    dialogue.choose(real);
  }
  private hideDialogue() {
    this.dialogueOpen = false;
    if (this.typing) { clearInterval(this.typing.timer); this.typing = null; }
    $('#dialogue').classList.remove('open');
    $('#portrait-zoom').hidden = true;
  }
  private portraitKey = '';
  /** A painted portrait just finished loading: if that person is talking right now, show it */
  portraitArrived(key: string) { if (this.dialogueOpen && this.portraitKey === key) this.drawPortrait(key); }
  private zoomPortrait() {
    const w = this.world; if (!w) return;
    const k = this.portraitKey, bust = w.textures.exists(`${k}-bust`) ? `${k}-bust` : '';
    const z = $('#portrait-zoom'), img = z.querySelector('img') as HTMLImageElement;
    const src = bust ? (w.textures.get(bust).getSourceImage() as HTMLImageElement | HTMLCanvasElement) : null;
    // Photos and painted busts show at full size; anything else, the portrait as drawn
    // Phaser frees its image URLs after loading, so copy the pixels instead of reusing the source URL
    let url = $<HTMLCanvasElement>('#dlg-portrait').toDataURL();
    if (src && (src as HTMLImageElement).width) { const c = document.createElement('canvas'); c.width = src.width; c.height = src.height; c.getContext('2d')!.drawImage(src, 0, 0); url = c.toDataURL('image/jpeg', 0.92); }
    img.src = url;
    z.querySelector('figcaption')!.innerHTML = `<b>${esc($('#dlg-name').textContent ?? '')}</b>${$('#dlg-title').textContent ? `<span>${esc($('#dlg-title').textContent!)}</span>` : ''}`;
    z.hidden = false;
  }
  private drawPortrait(key: string) {
    this.portraitKey = key;
    const cv = $<HTMLCanvasElement>('#dlg-portrait');
    const ctx = cv.getContext('2d')!;
    ctx.clearRect(0, 0, cv.width, cv.height);
    if (this.world?.textures.exists(`${key}-bust`)) {
      const img = this.world.textures.get(`${key}-bust`).getSourceImage() as HTMLCanvasElement;
      ctx.drawImage(img, 0, 0, cv.width, cv.height);
      return;
    }
    const front = this.world?.textures.exists(`${key}-front`);
    const tex = this.world?.textures.get(front ? `${key}-front` : key);
    if (!tex || tex.key === '__MISSING') return;
    const src = tex.getSourceImage() as HTMLCanvasElement;
    const fw = front ? 36 : src.width;
    const fh = src.height;
    const s = Math.min((cv.width - 10) / fw, (cv.height - 10) / fh);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(src, 0, 0, fw, fh, (cv.width - fw * s) / 2 + 4, cv.height - fh * s, fw * s, fh * s);
  }

  // ------------------------------------------------------------------ MISSION SCREENS
  private showPassed(def: MissionDef, lines: string[], extra?: string) {
    this.closePanel(true);
    if (this.dialogueOpen) dialogue.end();
    this.panel = 'passed';
    this.passedAt = performance.now();
    const el = $('#passed');
    el.className = 'overlay open passed';
    el.innerHTML = `<div class="burst"></div><div class="mp-sub">${mlabel(def)} · ${def.title}</div><div class="mp-big">MISSION PASSED</div>
      ${extra ? `<div class="mp-extra">${extra}</div>` : ''}
      <ul class="mp-lines">${lines.map((l, i) => `<li style="animation-delay:${0.5 + i * 0.18}s">${l}</li>`).join('')}</ul>
      <div class="mp-hint">PRESS ANY KEY</div>`;
  }
  private showFailed(def: MissionDef, text: string) {
    this.closePanel(true);
    if (this.dialogueOpen) dialogue.end();
    this.panel = 'passed';
    this.passedAt = performance.now();
    const el = $('#passed');
    el.className = 'overlay open failed';
    el.innerHTML = `<div class="mp-sub">${mlabel(def)} · ${def.title}</div><div class="mp-big">MISSION FAILED</div><p class="mp-fail">${text}</p><div class="mp-hint">Talk to ${NPC_BY_ID[def.giver]?.short ?? 'them'} to try again · PRESS ANY KEY</div>`;
  }

  // ------------------------------------------------------------------ JOURNAL
  private renderJournal() {
    const d = state.d;
    const mrows = MISSIONS.filter((def) => !def.side || state.mission(def.id).status !== 'locked').map((def) => {
      const m = state.mission(def.id);
      const status = def.comingSoon ? (m.status === 'available' ? 'NEXT BUILD' : 'LOCKED') : m.status.toUpperCase();
      const cls = m.status === 'complete' ? 'complete' : m.status === 'active' ? 'active' : 'locked';
      let body = `<p>${def.tagline}</p>`;
      if (m.status === 'active') {
        body += '<ol>' + def.stages.map((s, i) => `<li class="${i < m.stage ? 'done' : i === m.stage ? 'cur' : ''}">${i <= m.stage ? s.text() : '???'}</li>`).join('') + '</ol>';
        if (def.optional) body += '<ul class="opt">' + def.optional.map((o) => `<li class="${m.optionalDone[o.id] ? 'done' : ''}">${m.optionalDone[o.id] ? '★' : '☆'} ${o.text}</li>`).join('') + '</ul>';
      }
      return `<div class="jm ${cls}"><div class="jm-h"><span>${def.side ? `${def.kind ?? 'MEDIATION'} ·` : '#' + def.number} ${def.title}</span><em>${status}</em></div>${body}</div>`;
    }).join('');
    const trust = (Object.keys(DISTRICTS) as District[]).map((k) => `<div class="bar"><label style="color:${DISTRICTS[k].color}">${DISTRICTS[k].name}</label><div class="track"><i style="width:${(d.trust[k] + 100) / 2}%;background:${DISTRICTS[k].color}"></i></div><b>${d.trust[k]}</b></div>`).join('');
    const people = NPCS.filter((n) => !(n as any).npOrg).map((n) => { // staffers live in the network section
      const met = n.id in d.relationships;
      const r = state.rel(n.id);
      return `<div class="person ${met ? '' : 'unmet'}"><div class="p-h"><b style="color:${n.color}">${met ? n.name : '???'}</b><em>${met ? n.title : DISTRICTS[n.district].name}</em></div>
        ${met ? `<p>${n.bio}</p><div class="track small"><i style="width:${(r + 100) / 2}%;background:${n.color}"></i></div>` : '<p>Haven\'t met yet.</p>'}</div>`;
    }).join('');
    // Every Brooklyn Org grantee has a staffer on the map; answer "what do we do?" and the group joins your network
    const known = NONPROFITS.filter((n) => state.flag(`net_${n.id}`));
    const badges = ISSUES.map((i) => { const all = NONPROFITS.filter((n) => n.issues.includes(i)).length, got = known.filter((n) => n.issues.includes(i)).length; return `<span class="np-badge${got ? ' on' : ''}">${i} <b>${got}/${all}</b></span>`; }).join('');
    const network = `<p class="sub"><b>${known.length} of ${NONPROFITS.length}</b> groups in your network.</p><div class="np-badges">${badges}</div>`
      + (known.length ? known.map((g) => `<div class="lesson"><b>${g.org}</b><em>${g.issues.join(' · ')}</em><p>${g.what}</p></div>`).join('') : '<p>Look for people with clipboards and teal name tags. Each one works at a real Brooklyn nonprofit.</p>');
    const earned = Object.entries(LESSONS).filter(([k]) => state.flag(`lesson_${k}`));
    const lessons = (earned.length ? earned.map(([k, l]) => `<div class="lesson"><b>${k}</b><em>from ${l.who}</em><p>${l.text}</p></div>`).join('') : '<p>Nothing yet. Talk to people. They know things.</p>')
      + `<p class="sub">${earned.length} of ${Object.keys(LESSONS).length} learned.</p>`;
    $('#journal .panel-body').innerHTML = `
      <div class="jcol"><h3>MISSIONS</h3>${mrows}
        <h3>BROOKLYN ORG NETWORK</h3><p class="sub">All 261 Brooklyn nonprofits funded by Brooklyn Org, the borough's community foundation. Each has someone on the map. Learn what they do and they join your network.</p>${network}
        <h3>POCKET CIVICS</h3><p class="sub">Everything you've learned, in your pocket. Later conversations will test it.</p>${lessons}</div>
      <div class="jcol"><h3>THE MOVEMENT</h3>
        <div class="stats"><div><b>${d.solidarity}</b><span>Solidarity</span></div><div><b>${d.power}</b><span>Organizing Power</span></div><div><b>${d.attention}</b><span>Public Attention</span></div><div><b>${state.num('flyers_given')}</b><span>Flyers Handed</span></div><div><b>${state.num('posters_up')}</b><span>Posters Up</span></div><div><b>${state.num('villains_beaten')} / 6</b><span>Villains Beaten</span></div><div><b>${fmtTime(d.playTime)}</b><span>Time Organizing</span></div></div>
        <h3>COMMUNITY TRUST</h3>${trust}
        <h3>PEOPLE</h3><div class="people">${people}</div>
      </div>`;
  }

  // ------------------------------------------------------------------ MAP
  private renderMap() {
    const L = this.world?.layout; if (!L) return;
    const cv = $<HTMLCanvasElement>('#map-canvas');
    const s = 6; cv.width = MAP_W * s; cv.height = MAP_H * s;
    const c = cv.getContext('2d')!;
    c.lineJoin = 'round'; c.miterLimit = 2; // no spiky miters on outlined type
    const col: Record<number, string> = {
      [T.ASPHALT]: '#3d3354', [T.LANE_V]: '#3d3354', [T.LANE_H]: '#3d3354', [T.INTERSECTION]: '#3d3354', [T.CROSS_V]: '#4d4366', [T.CROSS_H]: '#4d4366',
      [T.SIDEWALK]: '#a991b2', [T.CURB]: '#a991b2', [T.GRASS]: '#58b956', [T.PLAZA]: '#e8cfa8', [T.GARDEN]: '#8b5a3c', [T.WATER]: '#3aa4f0', [T.YARD]: '#6f9d52', [T.COURT]: '#e8743b', [T.LOT]: '#a59db3', [T.SAND]: '#f0d79a', [T.OFFMAP]: '#2b2d36',
    };
    for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) { c.fillStyle = col[L.tiles[y][x]] ?? '#000'; c.fillRect(x * s, y * s, s, s); }
    for (const b of L.buildings) {
      c.fillStyle = DISTRICTS[b.district].color; c.globalAlpha = b.name ? 1 : 0.55;
      c.fillRect((b.x / TILE) * s, (b.y / TILE) * s, (b.w / TILE) * s, (b.h / TILE) * s);
      c.globalAlpha = 1; c.strokeStyle = '#16101f'; c.lineWidth = 2; c.strokeRect((b.x / TILE) * s, (b.y / TILE) * s, (b.w / TILE) * s, (b.h / TILE) * s);
    }
    c.font = '900 40px Nunito, Arial'; c.textAlign = 'center'; // the canvas is shown about 4x smaller
    // Neighborhood names at the center of each neighborhood's blocks: white, outlined in the district's color
    const acc: Record<string, [number, number, number, District]> = {};
    for (let r = 0; r < ROWS; r++) for (let k = 0; k < COLS; k++) {
      const name = neighborhoodOfBlock(k, r); if (!name) continue;
      const a = (acc[name] ??= [0, 0, 0, districtOfBlock(k, r)]);
      a[0] += (k * BLOCK_W + ROAD + BLOCK_W / 2) * s; a[1] += (r * BLOCK_H + ROAD + BLOCK_H / 2) * s; a[2]++;
    }
    const w = this.world as any;
    // The subway: every Brooklyn line, station to station (southeast Brooklyn's empty space is the transit desert)
    if (w.transit) {
      c.lineCap = 'round';
      for (const ln of w.transit.linePolylines()) {
        if (ln.pts.length < 2) continue;
        c.beginPath(); ln.pts.forEach((p: any, i: number) => (i ? c.lineTo : c.moveTo).call(c, (p.x / TILE) * s, (p.y / TILE) * s));
        c.lineWidth = 16; c.strokeStyle = '#16101f'; c.stroke(); c.lineWidth = 10; c.strokeStyle = ln.color; c.stroke();
      }
      for (const p of w.transit.stations) { c.beginPath(); c.arc((p.x / TILE) * s, (p.y / TILE) * s, 9, 0, 7); c.fillStyle = '#fff'; c.fill(); c.lineWidth = 4; c.strokeStyle = '#16101f'; c.stroke(); }
    }
    // Bike docks: a bike, so you can find the nearest one
    c.font = '34px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    for (const [id, p] of Object.entries(L.spots)) if (id.startsWith('dock-')) c.fillText('🚲', (p.x / TILE) * s, (p.y / TILE) * s);
    c.textBaseline = 'alphabetic';
    const targets = new Set(missions.targets());
    c.font = 'bold 13px Nunito, Arial';
    for (const n of NPCS) {
      const p = w.entityPos[n.id]; if (!p) continue;
      const x = (p.x / TILE) * s, y = (p.y / TILE) * s;
      const met = n.id in state.d.relationships;
      // People are little diamonds, so they never read as subway stops (round): teal for nonprofit staffers, yellow for your objective
      const r = targets.has(n.id) ? 20 : 14; // big enough to read as a diamond on a phone
      c.beginPath(); c.moveTo(x, y - r); c.lineTo(x + r, y); c.lineTo(x, y + r); c.lineTo(x - r, y); c.closePath();
      c.fillStyle = targets.has(n.id) ? '#ffd23f' : (n as any).npOrg ? '#2fd1c5' : n.color; c.fill(); c.lineWidth = 3.5; c.strokeStyle = '#16101f'; c.stroke();
      if (met || targets.has(n.id)) { c.lineWidth = 4; c.strokeText(n.short, x, y - r - 4); c.fillStyle = '#fff'; c.fillText(n.short, x, y - r - 4); }
    }
    const fp = w.entityPos.fridge;
    if (fp) { const x = (fp.x / TILE) * s, y = (fp.y / TILE) * s; c.fillStyle = targets.has('fridge') ? '#ffd23f' : '#fff'; c.fillRect(x - 6, y - 8, 12, 16); c.strokeRect(x - 6, y - 8, 12, 16); }
    // Neighborhood names go on top of everything (subway, stations, people), each on a dark tag so it always reads
    c.font = '900 40px Nunito, Arial'; c.textAlign = 'center'; c.textBaseline = 'middle';
    const placed: [number, number, number, number][] = []; // tags already down: x, y, w, h (centers)
    const hits = (x: number, y: number, tw: number, th: number) => placed.some(([px2, py2, pw, ph]) => Math.abs(x - px2) < (tw + pw) / 2 + 6 && Math.abs(y - py2) < (th + ph) / 2 + 4);
    for (const [name, [sx, sy, n, d]] of Object.entries(acc).sort((a, b) => a[1][1] / a[1][2] - b[1][1] / b[1][2])) {
      const t = name.toUpperCase(), tw = c.measureText(t).width + 28, th = 54, x0 = Math.min(Math.max(sx / n, tw / 2 + 6), cv.width - tw / 2 - 6), y0 = Math.min(Math.max(sy / n, th / 2 + 6), cv.height - th / 2 - 6); // never past the map's edge
      // Crowded corners: slide the tag up or down (then sideways) until it clears the others
      let x = x0, y = y0;
      search: for (const dx of [0, -0.35, 0.35]) for (const dy of [0, 1, -1, 2, -2, 3, -3]) {
        const cx = x0 + dx * tw, cy = y0 + dy * (th + 6);
        if (!hits(cx, cy, tw, th)) { x = cx; y = cy; break search; }
      }
      placed.push([x, y, tw, th]);
      c.fillStyle = 'rgba(22,16,31,0.88)'; c.beginPath();
      if (c.roundRect) c.roundRect(x - tw / 2, y - th / 2, tw, th, 14); else c.rect(x - tw / 2, y - th / 2, tw, th);
      c.fill(); c.lineWidth = 3; c.strokeStyle = DISTRICTS[d].color; c.stroke();
      c.fillStyle = '#fff'; c.fillText(t, x, y + 2); // white names; the outline keeps the district color
    }
    c.textBaseline = 'alphabetic';
    const px = (w.player.x / TILE) * s, py = (w.player.y / TILE) * s;
    // You are here: a draggable pin (drop it anywhere to move there)
    this.mapPin(cv, px, py, s);
    // Phones show the map zoomed in and pannable: start centered on the player.
    requestAnimationFrame(() => {
      const wrap = cv.parentElement!; if (cv.clientWidth <= wrap.clientWidth) return;
      const k = cv.clientWidth / cv.width;
      wrap.scrollLeft = px * k - wrap.clientWidth / 2; wrap.scrollTop = py * k - wrap.clientHeight / 2;
    });
  }

  /** The YOU ARE HERE pin over the map canvas. Drag it and let go to move to that spot (nearest place you can stand). */
  private mapPin(cv: HTMLCanvasElement, px: number, py: number, s: number) {
    const wrap = cv.parentElement as HTMLElement; wrap.style.position = 'relative';
    let pin = wrap.querySelector<HTMLElement>('.you-pin');
    if (!pin) { pin = document.createElement('div'); pin.className = 'you-pin'; pin.innerHTML = '<small>tap the map to move</small><b>YOU ARE HERE</b><i></i>'; wrap.appendChild(pin); }
    const place = (x: number, y: number) => { const k = cv.clientWidth / cv.width; pin!.style.left = `${cv.offsetLeft + x * k}px`; pin!.style.top = `${cv.offsetTop + y * k}px`; };
    requestAnimationFrame(() => place(px, py));
    let drag: { x: number; y: number } | null = null;
    const toCanvas = (e: PointerEvent) => { const r = cv.getBoundingClientRect(); return { x: Math.max(0, Math.min(cv.width, ((e.clientX - r.left) / r.width) * cv.width)), y: Math.max(0, Math.min(cv.height, ((e.clientY - r.top) / r.height) * cv.height)) }; };
    pin.onpointerdown = (e) => { e.preventDefault(); e.stopPropagation(); pin!.setPointerCapture(e.pointerId); drag = toCanvas(e); pin!.classList.add('drag'); };
    pin.onpointermove = (e) => { if (!drag) return; drag = toCanvas(e); place(drag.x, drag.y); };
    pin.onpointerup = () => {
      if (!drag) return; const d = drag; drag = null; pin!.classList.remove('drag');
      go(d);
    };
    // A tap on the map moves you there too (a pan or a long press doesn't)
    let tap: { x: number; y: number; t: number; sl: number; st: number } | null = null;
    cv.onpointerdown = (e) => { tap = { x: e.clientX, y: e.clientY, t: performance.now(), sl: wrap.scrollLeft, st: wrap.scrollTop }; };
    cv.onpointercancel = () => { tap = null; };
    cv.onpointerup = (e) => {
      const a = tap; tap = null; if (!a) return;
      if (Math.hypot(e.clientX - a.x, e.clientY - a.y) > 10 || Math.abs(wrap.scrollLeft - a.sl) + Math.abs(wrap.scrollTop - a.st) > 10 || performance.now() - a.t > 600) return;
      const d = toCanvas(e); place(d.x, d.y); go(d);
    };
    const go = (d: { x: number; y: number }) => {
      const w = this.world as any, L = w?.layout as WorldLayout; if (!L || w.flying || w.transit?.riding) { place(px, py); return; }
      const tx0 = Math.floor(d.x / s), ty0 = Math.floor(d.y / s);
      let best: [number, number] | null = null, bd = Infinity;
      for (let dy = -14; dy <= 14; dy++) for (let dx = -14; dx <= 14; dx++) {
        const tx = tx0 + dx, ty = ty0 + dy, t = L.tiles[ty]?.[tx];
        if (t === undefined || !WALKABLE.has(t) || L.blocked[ty]?.[tx]) continue;
        const dd = dx * dx + dy * dy + (t === T.SIDEWALK ? 0 : 4); if (dd < bd) { bd = dd; best = [tx, ty]; }
      }
      if (!best) { place(px, py); bus.emit('ui:toast', 'NOWHERE TO STAND THERE. TRY LAND.'); return; }
      w.player.body.reset((best[0] + 0.5) * TILE, (best[1] + 0.5) * TILE);
      const hood = neighborhoodOfBlock(Math.floor(best[0] / BLOCK_W), Math.floor(best[1] / BLOCK_H));
      bus.emit('ui:toast', hood ? `WELCOME TO ${hood.toUpperCase()}` : 'MOVED');
      this.renderMap();
    };
  }

  private renderPause() {
    const info = state.saveInfo();
    $('#pause-save').textContent = info?.savedAt ? `Last saved ${new Date(info.savedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : 'Not saved yet';
  }
}

function esc(s: string) { return s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]!)); }
function fmtClock(t: number) { const s = Math.max(0, Math.ceil(t)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }
function fmtTime(t: number) { const m = Math.floor(t / 60); return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`; }

export const ui = new UI();
