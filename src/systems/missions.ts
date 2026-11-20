import { bus } from '../core/bus';
import { state } from '../core/state';
import { MISSION_BY_ID, type MissionDef } from '../data/missions';
import { DISTRICTS } from '../core/types';

/**
 * Data-driven mission runner. Missions are sequences of stages whose
 * completion predicates are re-checked whenever game state changes, so any
 * system (dialogue, world interactions, crowd sim later) can advance them just
 * by changing state.
 */
class MissionSystem {
  paused = false;
  private checking = false;

  init() {
    bus.on('state:changed', () => this.check());
    bus.on('mission:start', (id: string) => this.start(id));
  }

  get active(): MissionDef | null { return state.d.activeMission ? MISSION_BY_ID[state.d.activeMission] : null; }

  start(id: string) {
    const def = MISSION_BY_ID[id];
    if (!def) return;
    const m = state.mission(id);
    if (def.comingSoon) { m.status = 'available'; state.changed(); return; }
    m.status = 'active'; m.stage = 0; m.vars = {}; m.optionalDone = {}; m.timeLeft = null;
    state.d.activeMission = id;
    this.enterStage(def, 0);
    bus.emit('mission:started', def);
    state.changed();
  }

  private enterStage(def: MissionDef, i: number) {
    const m = state.mission(def.id);
    const st = def.stages[i];
    if (!st) return;
    if (st.timer) m.timeLeft = st.timer;
    else if (!st.timed) m.timeLeft = null;
    bus.emit('mission:stage', def, i);
  }

  check() {
    if (this.checking) return;
    const def = this.active;
    if (!def) return;
    this.checking = true;
    try {
      const m = state.mission(def.id);
      for (const o of def.optional ?? []) {
        if (!m.optionalDone[o.id] && o.done()) {
          m.optionalDone[o.id] = true;
          bus.emit('ui:toast', `BONUS: ${o.text.toUpperCase()}`);
          state.apply(o.reward);
        }
      }
      let guard = 0;
      while (m.status === 'active' && def.stages[m.stage]?.done() && guard++ < 10) {
        m.stage++;
        if (m.stage >= def.stages.length) { this.complete(def); break; }
        this.enterStage(def, m.stage);
      }
    } finally { this.checking = false; }
    bus.emit('mission:updated');
  }

  update(dt: number) {
    const def = this.active;
    if (!def || this.paused) return;
    const m = state.mission(def.id);
    if (m.status !== 'active' || m.timeLeft == null) return;
    m.timeLeft -= dt;
    if (m.timeLeft <= 0) this.fail(def);
  }

  private complete(def: MissionDef) {
    const m = state.mission(def.id);
    m.status = 'complete'; m.timeLeft = null;
    state.d.activeMission = null;
    const reward = def.rewards?.() ?? {};
    const lines: string[] = [];
    if (reward.solidarity) lines.push(`SOLIDARITY +${reward.solidarity}`);
    if (reward.trust) for (const [k, v] of Object.entries(reward.trust)) lines.push(`${DISTRICTS[k as keyof typeof DISTRICTS].name.toUpperCase()} TRUST +${v}`);
    if (reward.power) lines.push(`ORGANIZING POWER +${reward.power}`);
    const bonus = (def.optional ?? []).filter((o) => m.optionalDone[o.id]).length;
    if (def.optional?.length) lines.push(`BONUS OBJECTIVES ${bonus}/${def.optional.length}`);
    state.apply(reward, { quiet: true });
    bus.emit('mission:passed', { def, lines, toast: reward.toast });
    if (def.next) {
      const nm = state.mission(def.next);
      if (nm.status === 'locked') this.start(def.next);
    }
    state.save();
  }

  fail(def: MissionDef) {
    const m = state.mission(def.id);
    def.onFail?.();
    m.stage = 0; m.timeLeft = null; m.vars = {}; m.attempts++;
    bus.emit('mission:failed', { def, text: def.failText ?? 'Better luck next time.' });
    this.enterStage(def, 0);
    state.changed();
  }

  objectiveText(): string {
    const def = this.active;
    if (!def) {
      const next = Object.values(MISSION_BY_ID).find((d) => state.mission(d.id).status === 'available');
      return next ? `NEXT: ${next.title} — coming in the next build` : 'Explore Brooklyn. Talk to people.';
    }
    return def.stages[state.mission(def.id).stage]?.text() ?? '';
  }

  targets(): string[] {
    const def = this.active;
    if (!def) return [];
    return def.stages[state.mission(def.id).stage]?.targets() ?? [];
  }
}

export const missions = new MissionSystem();
