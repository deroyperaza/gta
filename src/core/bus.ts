// Tiny typed-ish event bus shared by game systems, the Phaser world and the DOM UI.
type Handler = (...args: any[]) => void;

class Bus {
  private map = new Map<string, Set<Handler>>();
  on(evt: string, fn: Handler) {
    if (!this.map.has(evt)) this.map.set(evt, new Set());
    this.map.get(evt)!.add(fn);
    return () => this.off(evt, fn);
  }
  off(evt: string, fn: Handler) { this.map.get(evt)?.delete(fn); }
  emit(evt: string, ...args: any[]) {
    this.map.get(evt)?.forEach((fn) => {
      try { fn(...args); } catch (e) { console.error(`[bus] ${evt}`, e); }
    });
  }
}

export const bus = new Bus();
