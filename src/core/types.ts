// Shared type definitions. Kept engine-agnostic so systems can be reused
// (e.g. by a future multiplayer server or new neighborhoods).

export type District = 'downtown' | 'parkslope' | 'bedstuy' | 'bushwick' | 'crownheights' | 'redhook' | 'coneyisland' | 'flatbush' | 'sunsetpark' | 'plg';

export const DISTRICTS: Record<District, { name: string; color: string; blurb: string; short?: string }> = {
  downtown: { name: 'Downtown Brooklyn', color: '#4f8cff', blurb: 'Courthouses, cops, and corporate lobbies with very cold air conditioning.' },
  parkslope: { name: 'Park Slope', color: '#ff7ab8', blurb: 'Brownstones, strollers, and 14 kinds of oat milk.' },
  bedstuy: { name: 'Bed-Stuy', color: '#ffb23f', blurb: 'Stoops, murals, community fridges, and the best gossip in the borough.' },
  bushwick: { name: 'Bushwick', color: '#a46bff', blurb: 'Warehouses, galleries, and at least one guy building a theremin.' },
  crownheights: { name: 'Crown Heights', color: '#3fd0a0', blurb: 'Steel pans, roti shops, and a tenant union that wins.' },
  redhook: { name: 'Red Hook', color: '#ff6b4a', blurb: 'Piers, pupusas, and floodwater nobody planned for.' },
  coneyisland: { name: 'Coney Island', color: '#ffd23f', blurb: 'The boardwalk, the beach, and a Ferris wheel older than your landlord.' },
  flatbush: { name: 'Flatbush', color: '#ff9a3f', blurb: 'Beef patties, block parties, and the loudest dollar vans in the borough.' },
  plg: { name: 'Prospect Lefferts Gardens', short: 'PLG', color: '#e86bd8', blurb: 'Limestone row houses, the park next door, and some of the toughest tenant associations in Brooklyn.' },
  sunsetpark: { name: 'Sunset Park', color: '#5ab8ff', blurb: 'Tacos, dim sum, and the best skyline view nobody posts.' },
};

export type ItemId =
  | 'groceries' | 'clothing' | 'medical' | 'art' | 'flyers' | 'signs' | 'donations' | 'posters';

export type FlagValue = boolean | number | string;

/** A bundle of state changes. Used by dialogue, missions, pickups, rewards. */
export interface Effect {
  solidarity?: number;
  power?: number;
  attention?: number;
  trust?: Partial<Record<District, number>>;
  items?: Partial<Record<ItemId, number>>;
  rel?: Record<string, number>;
  flags?: Record<string, FlagValue>;
  /** Increment numeric flags */
  inc?: Record<string, number>;
  /** Mission variables for the currently active mission */
  mvar?: Record<string, number>;
  /** Adjust active mission timer (seconds) */
  time?: number;
  startMission?: string;
  /** Free-form event broadcast on the bus as `event:<name>` */
  event?: string;
  toast?: string;
}

/** A predicate over game state, used by dialogue choices & start nodes. */
export interface Cond {
  flag?: string;
  notFlag?: string;
  missionStatus?: { id: string; is: MissionStatus | MissionStatus[] };
  missionStage?: { id: string; is: number | number[] };
  item?: { id: ItemId; min: number };
  mvarMin?: Record<string, number>;
  mvarMax?: Record<string, number>;
  flagMin?: Record<string, number>;
  flagMax?: Record<string, number>;
  any?: Cond[];
}

export type MissionStatus = 'locked' | 'available' | 'active' | 'complete';

export interface MissionProgress {
  status: MissionStatus;
  stage: number;
  vars: Record<string, number>;
  optionalDone: Record<string, boolean>;
  timeLeft: number | null;
  attempts: number;
}

export interface SaveData {
  version: number;
  solidarity: number;
  power: number;
  attention: number;
  trust: Record<District, number>;
  inventory: Record<ItemId, number>;
  relationships: Record<string, number>;
  flags: Record<string, FlagValue>;
  missions: Record<string, MissionProgress>;
  activeMission: string | null;
  player: { x: number; y: number; onBike: boolean };
  posters: { x: number; y: number; v: number }[];
  playTime: number;
  savedAt?: number;
}
