import type Phaser from 'phaser';
import { bus } from '../core/bus';
import { state } from '../core/state';
import { DISTRICTS, type District, type ItemId } from '../core/types';
import { ITEMS } from '../data/items';
import { MISSIONS, type MissionDef } from '../data/missions';
import { NPCS, NPC_BY_ID } from '../data/npcs';
import { dialogue } from '../systems/dialogue';
import { missions } from '../systems/missions';
import { BLOCK_H, BLOCK_W, COLS, MAP_H, MAP_W, ROAD, ROWS, T, TILE, districtOfBlock, type WorldLayout } from '../world/layout';

/**
 * DOM overlay UI: HUD, dialogue, journal, map, pause, title, mission screens.
 * Pure HTML/CSS so it stays crisp at any resolution and can later grow
 * touch controls.
 */
type Panel = 'title' | 'pause' | 'journal' | 'map' | 'passed' | 'help' | null;

const $ = <T extends HTMLElement = HTMLElement>(sel: string) => document.querySelector(sel) as T;

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

  init() {
    bus.on('state:changed', () => this.renderHud());
    bus.on('mission:updated', () => this.renderObjective());
    bus.on('ui:toast', (t: string) => this.toast(t));
    bus.on('flyers:gained', (n: number) => this.showFlyer('big', n));
    bus.on('flyer:handed', () => this.showFlyer('mini'));
    // Tap the mission card to fold it to one line (remembered); a new objective opens it for a few seconds
    try { if (localStorage.getItem('gta-obj-min') === '1') $('#objective').classList.add('min'); } catch { /* storage blocked */ }
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
    bus.on('minimap:layout', (r: { x: number; y: number; size: number }) => {
      const f = $('#minimap-frame'); f.style.right = `${Math.max(0, window.innerWidth - r.x - r.size)}px`; f.style.top = `${r.y}px`; f.style.width = `${r.size}px`; f.style.height = `${r.size}px`;
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
  private begin(ev: 'game:new' | 'game:load') { this.startPlay(); if (this.world) bus.emit(ev); else this.pendingStart = ev; }

  blocking() { return this.panel !== null || this.dialogueOpen; }

  touchVector() { return this.touch; }

  // ------------------------------------------------------------------ KEYS
  private onKey(e: KeyboardEvent) {
    const k = e.key.toLowerCase();
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
    $('#help-close').onclick = () => { $('#help').classList.remove('open'); };
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
    if (el.dataset.html !== html) { el.dataset.html = html; el.innerHTML = html; el.classList.toggle('show', !!html); }
  }
  setDistance(n: number | null) {
    const el = $('#obj-dist');
    const txt = n == null ? '' : `${n}m`;
    if (el.textContent !== txt) el.textContent = txt;
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
    const inv = (Object.keys(ITEMS) as ItemId[]).filter((k) => d.inventory[k] > 0);
    $('#inventory').innerHTML = inv.length
      ? inv.map((k) => `<div class="inv${k === 'flyers' ? ' inv-flyers' : ''}" title="${ITEMS[k].name}: ${ITEMS[k].desc}${k === 'flyers' ? ' (tap to see it)' : ''}">${ITEMS[k].icon}<span>${d.inventory[k]}</span></div>`).join('')
      : '<div class="inv-empty">Tote bag: empty (emotionally full)</div>';
    this.renderObjective();
  }

  private renderObjective() {
    const def = missions.active;
    $('#obj-title').textContent = def ? `MISSION ${def.number} · ${def.title}` : 'FREE ROAM';
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
    el.innerHTML = `<div class="dname" style="color:${info.color}">${info.name}</div><div class="dblurb">${info.blurb}</div>`;
    el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  }

  private missionIntro(def: MissionDef) {
    const el = $('#mission-intro');
    el.innerHTML = `<div class="mi-num">MISSION ${def.number}</div><div class="mi-title">${def.title}</div><div class="mi-tag">${def.tagline}</div>`;
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
    const npc = NPC_BY_ID[d.speaker];
    const name = npc ? npc.name : d.speaker === 'you' ? 'You' : d.speaker;
    $('#dlg-name').textContent = name;
    $('#dlg-title').textContent = npc ? npc.title : '';
    $<HTMLElement>('#dlg-name').style.background = npc?.color ?? '#ff4fa3';
    this.drawPortrait(npc ? `npc-${npc.id}` : d.speaker === 'Doña Rosa' ? 'vendor-rosa' : d.speaker === 'Hamid' ? 'vendor-hamid' : d.owner === 'cat' ? 'cat' : d.owner === 'fridge' ? 'fridge-full' : d.owner === 'gop' ? 'gop0' : 'player');
    const rel = npc ? state.rel(npc.id) : null;
    $('#dlg-rel').innerHTML = rel != null ? `<span>RELATIONSHIP</span><div class="rt"><i style="width:${(rel + 100) / 2}%"></i></div>` : '';
    $('#dialogue').classList.add('open');
    const choicesEl = $('#dlg-choices');
    choicesEl.innerHTML = '';
    choicesEl.classList.remove('show');
    this.choiceCount = d.choices.length;
    choicesEl.innerHTML = d.choices.map((c, i) => `<button data-choice="${c.index}" class="${c.tag ? 'tag' : ''}"><b>${i + 1}</b> ${esc(c.text)}${c.tag ? ` <em>${c.tag}</em>` : ''}</button>`).join('');
    // map visible order -> index
    choicesEl.dataset.map = JSON.stringify(d.choices.map((c) => c.index));
    $('#dlg-more').style.visibility = d.choices.length ? 'hidden' : 'visible';
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
  }
  private drawPortrait(key: string) {
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
    el.innerHTML = `<div class="burst"></div><div class="mp-sub">MISSION ${def.number} · ${def.title}</div><div class="mp-big">MISSION PASSED</div>
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
    el.innerHTML = `<div class="mp-sub">MISSION ${def.number} · ${def.title}</div><div class="mp-big">MISSION FAILED</div><p class="mp-fail">${text}</p><div class="mp-hint">Talk to ${NPC_BY_ID[def.giver]?.short ?? 'them'} to try again · PRESS ANY KEY</div>`;
  }

  // ------------------------------------------------------------------ JOURNAL
  private renderJournal() {
    const d = state.d;
    const mrows = MISSIONS.map((def) => {
      const m = state.mission(def.id);
      const status = def.comingSoon ? (m.status === 'available' ? 'NEXT BUILD' : 'LOCKED') : m.status.toUpperCase();
      const cls = m.status === 'complete' ? 'complete' : m.status === 'active' ? 'active' : 'locked';
      let body = `<p>${def.tagline}</p>`;
      if (m.status === 'active') {
        body += '<ol>' + def.stages.map((s, i) => `<li class="${i < m.stage ? 'done' : i === m.stage ? 'cur' : ''}">${i <= m.stage ? s.text() : '???'}</li>`).join('') + '</ol>';
        if (def.optional) body += '<ul class="opt">' + def.optional.map((o) => `<li class="${m.optionalDone[o.id] ? 'done' : ''}">${m.optionalDone[o.id] ? '★' : '☆'} ${o.text}</li>`).join('') + '</ul>';
      }
      return `<div class="jm ${cls}"><div class="jm-h"><span>#${def.number} ${def.title}</span><em>${status}</em></div>${body}</div>`;
    }).join('');
    const trust = (Object.keys(DISTRICTS) as District[]).map((k) => `<div class="bar"><label style="color:${DISTRICTS[k].color}">${DISTRICTS[k].name}</label><div class="track"><i style="width:${(d.trust[k] + 100) / 2}%;background:${DISTRICTS[k].color}"></i></div><b>${d.trust[k]}</b></div>`).join('');
    const people = NPCS.map((n) => {
      const met = n.id in d.relationships;
      const r = state.rel(n.id);
      return `<div class="person ${met ? '' : 'unmet'}"><div class="p-h"><b style="color:${n.color}">${met ? n.name : '???'}</b><em>${met ? n.title : DISTRICTS[n.district].name}</em></div>
        ${met ? `<p>${n.bio}</p><div class="track small"><i style="width:${(r + 100) / 2}%;background:${n.color}"></i></div>` : '<p>Haven\'t met yet.</p>'}</div>`;
    }).join('');
    $('#journal .panel-body').innerHTML = `
      <div class="jcol"><h3>MISSIONS</h3>${mrows}</div>
      <div class="jcol"><h3>THE MOVEMENT</h3>
        <div class="stats"><div><b>${d.solidarity}</b><span>Solidarity</span></div><div><b>${d.power}</b><span>Organizing Power</span></div><div><b>${d.attention}</b><span>Public Attention</span></div><div><b>${state.num('flyers_given')}</b><span>Flyers Handed</span></div><div><b>${state.num('posters_up')}</b><span>Posters Up</span></div><div><b>${fmtTime(d.playTime)}</b><span>Time Organizing</span></div></div>
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
      [T.SIDEWALK]: '#a991b2', [T.CURB]: '#a991b2', [T.GRASS]: '#58b956', [T.PLAZA]: '#e8cfa8', [T.GARDEN]: '#8b5a3c', [T.WATER]: '#3aa4f0', [T.YARD]: '#6f9d52', [T.COURT]: '#e8743b', [T.LOT]: '#a59db3', [T.SAND]: '#f0d79a',
    };
    for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) { c.fillStyle = col[L.tiles[y][x]] ?? '#000'; c.fillRect(x * s, y * s, s, s); }
    for (const b of L.buildings) {
      c.fillStyle = DISTRICTS[b.district].color; c.globalAlpha = b.name ? 1 : 0.55;
      c.fillRect((b.x / TILE) * s, (b.y / TILE) * s, (b.w / TILE) * s, (b.h / TILE) * s);
      c.globalAlpha = 1; c.strokeStyle = '#16101f'; c.lineWidth = 2; c.strokeRect((b.x / TILE) * s, (b.y / TILE) * s, (b.w / TILE) * s, (b.h / TILE) * s);
    }
    c.font = 'bold 22px Bangers, Impact'; c.textAlign = 'center';
    // District names at the center of each district's blocks
    const acc: Record<string, [number, number, number]> = {};
    for (let r = 0; r < ROWS; r++) for (let k = 0; k < COLS; k++) {
      const d = districtOfBlock(k, r); const a = (acc[d] ??= [0, 0, 0]);
      a[0] += (k * BLOCK_W + ROAD + BLOCK_W / 2) * s; a[1] += (r * BLOCK_H + ROAD + BLOCK_H / 2) * s; a[2]++;
    }
    for (const [d, [sx, sy, n]] of Object.entries(acc)) {
      const t = (DISTRICTS[d as District].short ?? DISTRICTS[d as District].name).toUpperCase(), color = DISTRICTS[d as District].color;
      c.lineWidth = 6; c.strokeStyle = '#16101f'; c.strokeText(t, sx / n, sy / n); c.fillStyle = color; c.fillText(t, sx / n, sy / n);
    }
    const w = this.world as any;
    const targets = new Set(missions.targets());
    c.font = 'bold 13px Nunito, Arial';
    for (const n of NPCS) {
      const p = w.entityPos[n.id]; if (!p) continue;
      const x = (p.x / TILE) * s, y = (p.y / TILE) * s;
      const met = n.id in state.d.relationships;
      c.beginPath(); c.arc(x, y, targets.has(n.id) ? 9 : 6, 0, 7); c.fillStyle = targets.has(n.id) ? '#ffd23f' : n.color; c.fill(); c.lineWidth = 2.5; c.strokeStyle = '#16101f'; c.stroke();
      if (met || targets.has(n.id)) { c.lineWidth = 4; c.strokeText(n.short, x, y - 12); c.fillStyle = '#fff'; c.fillText(n.short, x, y - 12); }
    }
    const fp = w.entityPos.fridge;
    if (fp) { const x = (fp.x / TILE) * s, y = (fp.y / TILE) * s; c.fillStyle = targets.has('fridge') ? '#ffd23f' : '#fff'; c.fillRect(x - 6, y - 8, 12, 16); c.strokeRect(x - 6, y - 8, 12, 16); }
    const px = (w.player.x / TILE) * s, py = (w.player.y / TILE) * s;
    c.beginPath(); c.arc(px, py, 10, 0, 7); c.fillStyle = '#fff'; c.fill(); c.lineWidth = 4; c.strokeStyle = '#ff4fa3'; c.stroke();
    c.lineWidth = 4; c.strokeStyle = '#16101f'; c.strokeText('YOU', px, py - 16); c.fillStyle = '#fff'; c.fillText('YOU', px, py - 16);
    // Phones show the map zoomed in and pannable: start centered on the player.
    requestAnimationFrame(() => {
      const wrap = cv.parentElement!; if (cv.clientWidth <= wrap.clientWidth) return;
      const k = cv.clientWidth / cv.width;
      wrap.scrollLeft = px * k - wrap.clientWidth / 2; wrap.scrollTop = py * k - wrap.clientHeight / 2;
    });
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
