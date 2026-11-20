import { bus } from './bus';
import type { Cond, District, Effect, FlagValue, ItemId, MissionProgress, SaveData } from './types';
import { ITEMS } from '../data/items';

const SAVE_KEY = 'gtaa-L-save-v1';
const VERSION = 1;

function fresh(): SaveData {
  return {
    version: VERSION,
    solidarity: 0,
    power: 1,
    attention: 0,
    trust: { downtown: 0, parkslope: 10, bedstuy: 10, bushwick: 5, crownheights: 0, redhook: 0, coneyisland: 0, flatbush: 0, sunsetpark: 0 },
    inventory: { groceries: 0, clothing: 0, medical: 0, art: 0, flyers: 0, signs: 0, donations: 0, posters: 0 },
    relationships: {},
    flags: {},
    missions: {},
    activeMission: null,
    player: { x: -1, y: -1, onBike: false },
    posters: [],
    playTime: 0,
  };
}

/**
 * Central game state. All mutation goes through here so the UI and mission
 * system can react via `state:changed`. Serializable for save/load (and, later,
 * for syncing to a multiplayer server).
 */
class GameState {
  d: SaveData = fresh();

  reset() { this.d = fresh(); bus.emit('state:reset'); this.changed(); }

  changed() { bus.emit('state:changed', this.d); }

  // ---- Core meters ----
  addSolidarity(n: number) { this.d.solidarity = Math.max(0, this.d.solidarity + n); }
  addPower(n: number) { this.d.power = Math.max(0, this.d.power + n); }
  addAttention(n: number) { this.d.attention = Math.max(0, Math.min(100, this.d.attention + n)); }
  addTrust(dist: District, n: number) { this.d.trust[dist] = Math.max(-100, Math.min(100, this.d.trust[dist] + n)); }
  rel(id: string) { return this.d.relationships[id] ?? 0; }
  addRel(id: string, n: number) { this.d.relationships[id] = Math.max(-100, Math.min(100, this.rel(id) + n)); }

  // ---- Inventory ----
  count(id: ItemId) { return this.d.inventory[id] ?? 0; }
  addItem(id: ItemId, n: number) { this.d.inventory[id] = Math.max(0, this.count(id) + n); }

  // ---- Flags ----
  flag(k: string): FlagValue | undefined { return this.d.flags[k]; }
  num(k: string): number { const v = this.d.flags[k]; return typeof v === 'number' ? v : 0; }
  setFlag(k: string, v: FlagValue) { this.d.flags[k] = v; }
  clearFlagsWithPrefix(prefix: string) {
    for (const k of Object.keys(this.d.flags)) if (k.startsWith(prefix)) delete this.d.flags[k];
  }

  mission(id: string): MissionProgress {
    if (!this.d.missions[id]) {
      this.d.missions[id] = { status: 'locked', stage: 0, vars: {}, optionalDone: {}, timeLeft: null, attempts: 0 };
    }
    return this.d.missions[id];
  }

  /** Apply an effect bundle and announce gains with toasts. */
  apply(e: Effect | undefined, opts: { quiet?: boolean } = {}) {
    if (!e) return;
    const toasts: string[] = [];
    if (e.solidarity) { this.addSolidarity(e.solidarity); toasts.push(`${sign(e.solidarity)} SOLIDARITY`); }
    if (e.power) { this.addPower(e.power); toasts.push(`${sign(e.power)} ORGANIZING POWER`); }
    if (e.attention) { this.addAttention(e.attention); toasts.push(`${sign(e.attention)} ATTENTION`); }
    if (e.trust) for (const [k, v] of Object.entries(e.trust)) {
      this.addTrust(k as District, v!); toasts.push(`${sign(v!)} TRUST · ${k.toUpperCase()}`);
    }
    if (e.items) for (const [k, v] of Object.entries(e.items)) {
      this.addItem(k as ItemId, v!); toasts.push(`${sign(v!)} ${ITEMS[k as ItemId].name.toUpperCase()}`);
    }
    if (e.rel) for (const [k, v] of Object.entries(e.rel)) this.addRel(k, v);
    if (e.flags) for (const [k, v] of Object.entries(e.flags)) this.setFlag(k, v);
    if (e.inc) for (const [k, v] of Object.entries(e.inc)) this.setFlag(k, this.num(k) + v);
    if (e.mvar && this.d.activeMission) {
      const m = this.mission(this.d.activeMission);
      for (const [k, v] of Object.entries(e.mvar)) m.vars[k] = (m.vars[k] ?? 0) + v;
    }
    if (e.time && this.d.activeMission) {
      const m = this.mission(this.d.activeMission);
      if (m.timeLeft != null) { m.timeLeft = Math.max(1, m.timeLeft + e.time); toasts.push(`${e.time > 0 ? '+' : ''}${e.time}s ON THE CLOCK`); }
    }
    if (e.toast) toasts.unshift(e.toast);
    if (!opts.quiet) toasts.forEach((t, i) => setTimeout(() => bus.emit('ui:toast', t), i * 260));
    if (e.startMission) bus.emit('mission:start', e.startMission);
    if (e.event) bus.emit(`event:${e.event}`);
    this.changed();
  }

  test(c: Cond | undefined): boolean {
    if (!c) return true;
    if (c.flag && !this.flag(c.flag)) return false;
    if (c.notFlag && this.flag(c.notFlag)) return false;
    if (c.missionStatus) {
      const s = this.mission(c.missionStatus.id).status;
      const is = Array.isArray(c.missionStatus.is) ? c.missionStatus.is : [c.missionStatus.is];
      if (!is.includes(s)) return false;
    }
    if (c.missionStage) {
      const m = this.mission(c.missionStage.id);
      const is = Array.isArray(c.missionStage.is) ? c.missionStage.is : [c.missionStage.is];
      if (m.status !== 'active' || !is.includes(m.stage)) return false;
    }
    if (c.item && this.count(c.item.id) < c.item.min) return false;
    const vars = this.d.activeMission ? this.mission(this.d.activeMission).vars : {};
    if (c.mvarMin) for (const [k, v] of Object.entries(c.mvarMin)) if ((vars[k] ?? 0) < v) return false;
    if (c.mvarMax) for (const [k, v] of Object.entries(c.mvarMax)) if ((vars[k] ?? 0) > v) return false;
    if (c.flagMin) for (const [k, v] of Object.entries(c.flagMin)) if (this.num(k) < v) return false;
    if (c.any && !c.any.some((x) => this.test(x))) return false;
    return true;
  }

  // ---- Persistence ----
  save(): boolean {
    try {
      this.d.savedAt = Date.now();
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.d));
      bus.emit('ui:toast', 'GAME SAVED');
      return true;
    } catch { bus.emit('ui:toast', 'SAVE FAILED (storage blocked)'); return false; }
  }
  hasSave(): boolean { try { return !!localStorage.getItem(SAVE_KEY); } catch { return false; } }
  saveInfo(): SaveData | null {
    try { const raw = localStorage.getItem(SAVE_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
  }
  load(): boolean {
    const data = this.saveInfo();
    if (!data) return false;
    // Merge onto a fresh save so older saves gain new fields.
    const base = fresh();
    this.d = { ...base, ...data, trust: { ...base.trust, ...data.trust }, inventory: { ...base.inventory, ...data.inventory } };
    bus.emit('state:loaded');
    this.changed();
    return true;
  }
}

function sign(n: number) { return n > 0 ? `+${n}` : `${n}`; }

export const state = new GameState();
