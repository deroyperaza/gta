/**
 * One label color per kind of person, on the street name tags and the map (Deroy, Nov 24 2026), from Brooklyn Org's palette.
 * Yellow is reserved for the direction pointer and your objective, so it's never a label color here.
 */
import type { NpcDef } from './npcs';
import { CAMEOS } from './cameos';

export const LABEL = {
  characters: '#FEBDEC', // Petal
  famous: '#CEAFEA',     // Lavender Lake
  ghosts: '#9FD7FF',     // Pier 2
  nonprofits: '#B8E7B0', // Green Lady
  neighbors: '#81A1F2',  // Brighton Beach
} as const;

const FAMOUS = new Set(CAMEOS.map((c) => c.id));
export function labelColor(n: NpcDef): string {
  const x = n as any;
  if (x.ghost) return LABEL.ghosts;
  if (FAMOUS.has(n.id)) return LABEL.famous;
  if (x.npOrg) return LABEL.nonprofits;
  if (x.blockFolk) return LABEL.neighbors;
  return LABEL.characters;
}
