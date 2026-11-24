import { bus } from '../core/bus';
import { state } from '../core/state';
import { MISSION_BY_ID, type MissionDef } from '../data/missions';
import { DISTRICTS } from '../core/types';
import { NPC_BY_ID } from '../data/npcs';
import { granteesFor } from '../data/grantees';
import { NONPROFITS, MISSION_ISSUES } from '../data/nonprofits';

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
    if (def.side && state.d.activeMission && state.d.activeMission !== id && !MISSION_BY_ID[state.d.activeMission]?.side) state.setFlag('resume_mission', state.d.activeMission);
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
      if (def.failIf?.()) this.fail(def); // then fall through: stages already done (allies, briefing) skip ahead
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
    // Missions 3+: a weak result costs you. The neighborhood trusts you less (so its stops take longer next time),
    // and the person who brought you in is a little let down.
    const resultKey = def.id === 'march' ? 'pvp_result' : `${def.id}_result`; // Mission 3 predates the naming
    if (def.number >= 3 && state.flag(resultKey) === 'weak') {
      const hit = def.number >= 5 ? 8 : 5; // 3–4 sting a little; 5+ sting more
      state.apply({ trust: { [def.district]: -hit }, rel: { [def.giver]: def.number >= 5 ? -4 : -2 } }, { quiet: true });
      lines.push(`${DISTRICTS[def.district].name.toUpperCase()} TRUST -${hit} · THE BLOCK REMEMBERS`);
    }
    const real = granteesFor(def.id); // shown as cards under the lines, each with its Brooklyn Gives donation link
    { // Your network pays off: every group you know that works on this mission's issues adds Solidarity (up to 10 groups)
      const issues = new Set(MISSION_ISSUES[def.id] ?? []);
      if (issues.size) {
        const known = NONPROFITS.filter((n) => state.flag(`net_${n.id}`) && n.issues.some((i) => issues.has(i)));
        const bonus = Math.min(known.length, 10) * 15;
        if (bonus) { state.apply({ solidarity: bonus }, { quiet: true }); lines.push(`YOUR NETWORK · YOU KNOW ${known.length} GROUP${known.length > 1 ? 'S' : ''} WORKING ON ${[...issues].slice(0, 2).join(' & ').toUpperCase()} · +${bonus} SOLIDARITY`); }
        else lines.push(`YOUR NETWORK · MEET GROUPS WORKING ON ${[...issues].slice(0, 2).join(' & ').toUpperCase()} (TEAL NAME TAGS) FOR A BONUS NEXT TIME`);
      }
    }
    bus.emit('mission:passed', { def, lines, toast: reward.toast, real });
    if (def.side) { // back to the main mission, right where you left it
      const r = state.flag('resume_mission'); delete state.d.flags.resume_mission;
      if (typeof r === 'string' && state.mission(r).status === 'active') state.d.activeMission = r;
    }
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
      const next = this.nextAvailable();
      if (!next) return 'Explore Brooklyn. Talk to people.';
      if (next.comingSoon) return `NEXT: ${next.title} — coming in the next build`;
      const giver = NPC_BY_ID[next.giver]?.short ?? next.giver;
      return `NEXT: Mission ${next.number} · ${next.title}. Talk to ${giver}`;
    }
    return def.stages[state.mission(def.id).stage]?.text() ?? '';
  }

  /** A mission that's unlocked but not started (an old save, or after a fail-and-quit) */
  private nextAvailable() { return Object.values(MISSION_BY_ID).find((d) => state.mission(d.id).status === 'available') ?? null; }

  targets(): string[] {
    const def = this.active;
    if (!def) { const next = this.nextAvailable(); return next && !next.comingSoon ? [next.giver] : []; }
    return def.stages[state.mission(def.id).stage]?.targets() ?? [];
  }
}

export const missions = new MissionSystem();
