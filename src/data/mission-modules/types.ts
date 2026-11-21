import type { MissionDef } from '../missions';
import type { NpcDef } from '../npcs';
import type { Dialogue } from '../../systems/dialogue';

/**
 * One mission in its own file. The loader (./index.ts) appends `mission` to MISSIONS,
 * prepends each `dialogue[npcId].entries` ahead of that NPC's existing entries (merging nodes),
 * and adds `npcs` to the cast.
 *
 * Stage targets can be NPC ids, or `spot:<name>` for a place on the map: walking within
 * ~90px of a targeted spot sets the flag `at_<name>` (use it in `done`, then clear it in onFail).
 */
export interface MissionModule {
  mission: MissionDef;
  dialogue: Record<string, Dialogue>;
  npcs?: NpcDef[];
}
