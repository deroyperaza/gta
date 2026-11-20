import { bus } from '../core/bus';
import { state } from '../core/state';
import type { Cond, Effect } from '../core/types';

export interface DChoice { text: string; next?: string; effects?: Effect; cond?: Cond; tag?: string }
export interface DNode { speaker?: string; text: string; choices?: DChoice[]; next?: string; effects?: Effect }
export interface Dialogue { entries: { cond?: Cond; node: string }[]; nodes: Record<string, DNode> }

/**
 * Generic branching-dialogue runner. Data lives in data/dialogues.ts.
 * The DOM UI listens to `dialogue:show` / `dialogue:end` and calls choose().
 */
class DialogueRunner {
  private dlg: Dialogue | null = null;
  private node: DNode | null = null;
  private ownerId = '';
  active = false;

  start(owner: string, dlg: Dialogue) {
    const entry = dlg.entries.find((e) => state.test(e.cond));
    if (!entry) return false;
    this.dlg = dlg; this.ownerId = owner; this.active = true;
    bus.emit('dialogue:start', owner);
    this.goto(entry.node);
    return true;
  }

  /** Quick one-off line (ambient chatter) using the same UI. */
  say(owner: string, speaker: string, text: string) {
    this.start(owner, { entries: [{ node: 'a' }], nodes: { a: { speaker, text } } });
  }

  private goto(id: string | undefined) {
    if (!id || !this.dlg) return this.end();
    const n = this.dlg.nodes[id];
    if (!n) { console.warn('missing dialogue node', id); return this.end(); }
    this.node = n;
    state.apply(n.effects);
    const choices = (n.choices ?? []).map((c, i) => ({ c, i })).filter(({ c }) => state.test(c.cond));
    bus.emit('dialogue:show', { owner: this.ownerId, speaker: n.speaker ?? this.ownerId, text: n.text, choices: choices.map(({ c, i }) => ({ text: c.text, index: i, tag: c.tag })) });
  }

  /** Advance a node without choices. */
  advance() {
    if (!this.node || (this.node.choices && this.node.choices.some((c) => state.test(c.cond)))) return;
    this.goto(this.node.next);
  }

  choose(index: number) {
    const c = this.node?.choices?.[index];
    if (!c || !state.test(c.cond)) return;
    state.apply(c.effects);
    this.goto(c.next);
  }

  end() {
    if (!this.active) return;
    this.active = false; this.dlg = null; this.node = null;
    bus.emit('dialogue:end', this.ownerId);
  }
}

export const dialogue = new DialogueRunner();
