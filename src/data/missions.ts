import { state } from '../core/state';
import type { District, Effect } from '../core/types';

export interface StageDef {
  text: () => string;
  /** World entity ids to mark with waypoints */
  targets: () => string[];
  done: () => boolean;
  /** Start a countdown (seconds) when this stage begins */
  timer?: number;
  /** Keep an already-running timer going through this stage */
  timed?: boolean;
}
export interface OptionalDef { id: string; text: string; done: () => boolean; reward: Effect }
export interface MissionDef {
  id: string; number: number; title: string; tagline: string; district: District; giver: string;
  stages: StageDef[];
  optional?: OptionalDef[];
  rewards?: () => Effect;
  next?: string;
  comingSoon?: boolean;
  onFail?: () => void;
  /** Checked on every state change; true fails the mission */
  failIf?: () => boolean;
  failText?: string;
}

const f = (k: string) => !!state.flag(k);

/** Mission 3: friends who can bring their people to the march. */
export const MARCH_ALLIES = ['dee', 'nell', 'jenna', 'juni', 'jon'];
const alliesIn = () => MARCH_ALLIES.filter((a) => f(`pvp_ally_${a}`)).length;

export const MISSIONS: MissionDef[] = [
  {
    id: 'stock', number: 1, title: 'STOCK THE BLOCK', district: 'bedstuy', giver: 'dee',
    tagline: 'The Gates Ave community fridge is down to one lime. Fix that.',
    stages: [
      { text: () => 'Meet Dee at the Community Fridge in Bed-Stuy', targets: () => ['dee'], done: () => f('stb_accepted') },
      {
        text: () => {
          const n = ['stb_coop', 'stb_bodega', 'stb_bakery'].filter(f).length;
          return `Collect donated groceries (${n}/3): Co-op · Bodega · Bakery`;
        },
        targets: () => [['stb_coop', 'brendan'], ['stb_bodega', 'farouk'], ['stb_bakery', 'juni']].filter(([k]) => !f(k)).map(([, id]) => id),
        done: () => f('stb_coop') && f('stb_bodega') && f('stb_bakery'),
        timer: 150,
      },
      { text: () => 'Restock the Community Fridge [E]', targets: () => ['fridge'], done: () => f('stb_restocked'), timed: true },
      { text: () => 'Tell Dee the fridge is full', targets: () => ['dee'], done: () => f('stb_thanked') },
    ],
    optional: [
      { id: 'bike', text: 'Ride a BK Spokes bike', done: () => f('rode_bike'), reward: { solidarity: 20 } },
      { id: 'flyers', text: 'Hand out 5 fridge flyers', done: () => (state.d.activeMission === 'stock' ? (state.mission('stock').vars.flyers ?? 0) : 0) >= 5, reward: { attention: 5, trust: { bedstuy: 5 }, solidarity: 30 } },
      { id: 'cat', text: 'Earn the blessing of Commissioner Whiskers', done: () => f('pet_cat'), reward: { solidarity: 15, rel: { farouk: 5 } } },
      { id: 'fast', text: 'Restock with 0:45+ on the clock', done: () => f('stb_restocked') && f('stb_fast'), reward: { solidarity: 50 } },
    ],
    rewards: () => ({ solidarity: 250, power: 2, trust: { bedstuy: 15 }, rel: { dee: 10 } }),
    failText: 'The produce wilted. Somewhere, a kale leaf weeps. Dee is disappointed but not surprised.',
    onFail: () => {
      state.clearFlagsWithPrefix('stb_');
      state.d.inventory.groceries = 0;
    },
    next: 'circle',
  },
  {
    id: 'circle', number: 2, title: 'THE CIRCLE', district: 'bedstuy', giver: 'hattie',
    tagline: 'A noise dispute between neighbors is about to become a war. Facilitate a restorative justice circle.',
    stages: [
      { text: () => 'Join Ms. Hattie\'s circle at the Gates Ave Community Center', targets: () => ['hattie'], done: () => f('circle_done') },
    ],
    rewards: () => {
      const r = state.flag('circle_result');
      if (r === 'good') return { solidarity: 300, power: 3, trust: { bedstuy: 20 }, toast: 'NEW TENANT ASSOCIATION FORMED' };
      if (r === 'ok') return { solidarity: 160, power: 1, trust: { bedstuy: 10 } };
      return { solidarity: 60, trust: { bedstuy: 2 } };
    },
    next: 'march',
  },
  {
    id: 'march', number: 3, title: 'THE PEOPLE VS. THE POWER', district: 'downtown', giver: 'gary',
    tagline: 'A demonstration is forming at Borough Hall. Recruit, marshal, and march — without letting it boil over.',
    stages: [
      { text: () => 'Talk to Councilmember Gary at Borough Hall', targets: () => ['gary'], done: () => f('pvp_accepted') },
      {
        text: () => `Build the march: allies ${alliesIn()}/3 · neighbors ${Math.min(state.num('pvp_marchers'), 8)}/8 (hand out flyers [SPACE])`,
        targets: () => (alliesIn() >= 3 ? [] : MARCH_ALLIES.filter((a) => !f(`pvp_ally_${a}`))),
        done: () => alliesIn() >= 3 && state.num('pvp_marchers') >= 8,
      },
      { text: () => 'Get a know-your-rights briefing from Bridgette before you march', targets: () => ['bridgette'], done: () => f('pvp_briefed') },
      {
        text: () => `March your crowd ${f('pvp_cp1') ? 'past Metro Mall-ish' : 'past Luxe Lofts'} · tension ${state.num('pvp_tension')}/3`,
        targets: () => [f('pvp_cp1') ? 'pvp_cp2' : 'pvp_cp1'],
        done: () => f('pvp_cp1') && f('pvp_cp2'),
      },
      { text: () => `Take the steps of Borough Hall and speak · tension ${state.num('pvp_tension')}/3`, targets: () => ['pvp_steps'], done: () => f('pvp_spoke') },
    ],
    optional: [
      { id: 'crowd', text: 'Bring 14 neighbors', done: () => state.num('pvp_marchers') >= 14, reward: { solidarity: 40, attention: 4 } },
      { id: 'allies', text: 'Recruit all five allies', done: () => alliesIn() >= 5, reward: { solidarity: 50, power: 1 } },
      { id: 'calm', text: 'Finish with zero tension', done: () => f('pvp_spoke') && state.num('pvp_tension') === 0, reward: { solidarity: 60, trust: { downtown: 5 } } },
    ],
    failIf: () => state.num('pvp_tension') >= 3,
    failText: 'It boiled over. Someone threw a cold brew, someone else threw a punch, and the evening news called it "chaos." Gary voted for the gazebo "for public safety." Your allies are still with you. Regroup and march again.',
    onFail: () => { for (const k of ['pvp_cp1', 'pvp_cp2', 'pvp_tension', 'pvp_spirit', 'pvp_spoke', 'pvp_result']) delete state.d.flags[k]; },
    rewards: () => {
      const r = state.flag('pvp_result');
      if (r === 'good') return { solidarity: 400, power: 3, attention: 10, trust: { downtown: 20 }, toast: 'LINE 47 IS DEAD. THE FRIDGE LIVES.' };
      if (r === 'ok') return { solidarity: 200, power: 1, trust: { downtown: 10 }, toast: 'GAZEBO DELAYED (FOR NOW)' };
      return { solidarity: 80, trust: { downtown: 3 } };
    },
    next: 'rent',
  },
  {
    id: 'rent', number: 4, title: 'RENT IS TOO DAMN HIGH', district: 'bushwick', giver: 'juni', comingSoon: true,
    tagline: 'Build a spectacular public installation about rent strikes with Juni\'s collective.', stages: [], next: 'board',
  },
  {
    id: 'board', number: 5, title: 'THE COMMUNITY BOARD FROM HELL', district: 'downtown', giver: 'tyler', comingSoon: true,
    tagline: 'Tyler wants 400 luxury units. The community board meets at 7. Skye is livestreaming. Godspeed.', stages: [],
  },
];

export const MISSION_BY_ID = Object.fromEntries(MISSIONS.map((m) => [m.id, m])) as Record<string, MissionDef>;
