/**
 * SIDE MISSION · BINS, NOT BAGS (Fort Greene, at night). Giver: Ms. Bev, block captain.
 * New York piles its trash in bags on the sidewalk; rats eat there every night. Europe solved this long ago with
 * containers on the street. You get the bags off the curb: learn what works, win over the super of a big building,
 * and take a plan to Community Board 2, where the city is already rolling street bins out.
 *
 * Facts (checked Nov 2026):
 * - Since Nov 12, 2024, every NYC property with 1–9 residential units must put trash out in a bin with a secure lid
 *   (55 gallons or less), not loose bags. From June 2026 it must be the official NYC Bin.
 *   Sources: DSNY "Trash City No More" (nyc.gov/site/dsny/news/24-027); NYC311 "Residential Waste Containerization".
 * - Hamilton Heights hosted the city's first shared on-street container pilot (2023–2025); DSNY reported rat sightings
 *   down 73% over the pilot. Source: DSNY presentation to the Public Design Commission, Aug 18 2025.
 * - "Empire Bins": fixed street containers assigned to one building; only building staff and DSNY can unlock them.
 *   Piloted in Manhattan Community District 9 from June 2025; DSNY lists Brooklyn Community District 2 (Fort Greene,
 *   Downtown, Brooklyn Heights) as rolling out next; citywide by 2032. Source: DSNY M9 containerization page.
 * - Barcelona and other European cities keep trash in shared containers on the street.
 * Ms. Bev, Mr. Okafor and their block are fiction.
 */
import { state } from '../../core/state';
import type { Effect } from '../../core/types';
import type { MissionModule } from './types';

const f = (k: string) => !!state.flag(k);
const S = (id: string, is: number | number[]) => ({ missionStage: { id, is } });

/** The ending grades the whole night: what works, the super, the ask */
const BOWS = [
  { text: '(Hand Ms. Bev the letter.)', cond: { flagMin: { bins_score: 3 } }, effects: { flags: { bins_result: 'good', bins_done: true } } },
  { text: '(Hand Ms. Bev the letter.)', cond: { flagMin: { bins_score: 1 }, flagMax: { bins_score: 2 } }, effects: { flags: { bins_result: 'ok', bins_done: true } } },
  { text: '(Hand Ms. Bev the letter.)', cond: { flagMax: { bins_score: 0 } }, effects: { flags: { bins_result: 'weak', bins_done: true } } },
];

export const bins: MissionModule = {
  mission: {
    id: 'bins', number: 101, title: 'BINS, NOT BAGS', district: 'downtown', giver: 'bev', side: true, kind: 'SIDE MISSION', night: true,
    tagline: 'Every night, ten bags on the curb and a rat buffet. Europe put its trash in bins decades ago. Ms. Bev wants her block next.',
    stages: [
      { text: () => 'Ask Ms. Bev what actually works', targets: () => ['bev'], done: () => f('bins_plan') },
      { text: () => 'Win over Mr. Okafor, the super of the big building', targets: () => ['okafor'], done: () => f('bins_super') },
      { text: () => 'Plan the ask for Community Board 2 with Ms. Bev', targets: () => ['bev'], done: () => f('bins_done') },
    ],
    rewards: (): Effect => {
      const r = state.flag('bins_result');
      if (r === 'good') return { solidarity: 160, power: 1, trust: { downtown: 12 }, rel: { bev: 8, okafor: 6 }, toast: 'THE BAGS ARE GOING IN BINS. THE RATS ARE GOING ELSEWHERE.' };
      if (r === 'ok') return { solidarity: 90, trust: { downtown: 6 }, rel: { bev: 4 } };
      return { solidarity: 30, trust: { downtown: 1 } };
    },
    onFail: () => state.clearFlagsWithPrefix('bins_'),
  },
  dialogue: {
    bev: {
      entries: [
        { cond: { missionStatus: { id: 'bins', is: 'locked' } }, node: 'bins_offer' },
        { cond: S('bins', 0), node: 'bins_q0' },
        { cond: S('bins', 1), node: 'bins_wait' },
        { cond: S('bins', 2), node: 'bins_f0' },
        { cond: { flag: 'bins_done' }, node: 'bins_after' },
      ],
      nodes: {
        bins_offer: {
          speaker: 'bev', text: 'Hear that rustling? Not the wind. Ten bags on this curb every night, and the rats treat it like a buffet. Come out with me tonight and see.',
          choices: [{ text: 'Show me.', next: 'bins_night', effects: { startMission: 'bins', rel: { bev: 3 } } }, { text: 'Not tonight, Ms. Bev.' }],
        },
        bins_night: { speaker: 'you', text: '*The streetlights flicker on. The bags on the curb start to move. Something with a long pink tail looks right at you.*', next: 'bins_q0' },
        bins_q0: {
          speaker: 'bev', text: 'The city\'s tried poison, traps, a rat czar. Rats keep winning. What actually works?',
          choices: [
            { text: 'Get the bags off the curb and into lidded bins. Hamilton Heights tried shared street bins and rat sightings dropped 73%.', tag: 'FACT', effects: { inc: { bins_score: 1 }, toast: 'POCKET CIVICS · BINS, NOT BAGS' }, next: 'bins_q1' },
            { text: 'More rat poison.', next: 'bins_q0x' },
            { text: 'Put the bags out later, right before pickup.', next: 'bins_q0x' },
          ],
        },
        bins_q0x: { speaker: 'bev', text: 'Tried it. The bags come back every night, and so do the rats. The fix is the bags themselves: put the food where they can\'t reach it. Lids.', next: 'bins_q1' },
        bins_q1: {
          speaker: 'bev', text: 'Barcelona\'s kept its trash in street containers for decades. Europe figured this out long ago. Here, since November 2024, any building with one to nine apartments has to use a bin with a lid. The big buildings still pile bags on the curb. Like Okafor\'s.',
          choices: [{ text: 'I\'ll talk to Mr. Okafor.', effects: { flags: { bins_plan: true } } }],
        },
        bins_wait: { speaker: 'bev', text: 'Okafor\'s the one in the work jacket by the big building. Forty-eight units, sixty bags a night. If he signs on, the block signs on.' },
        bins_f0: {
          speaker: 'bev', text: 'Okafor\'s in? Good. Community Board 2 meets next week, and the city\'s already rolling street bins out in this district. What do we ask for?',
          choices: [
            { text: 'Put our block early on the Empire Bin rollout, with Mr. Okafor\'s building already signed on.', tag: 'BEST', effects: { inc: { bins_score: 1 } }, next: 'bins_end' },
            { text: 'Ban garbage bags in Brooklyn.', next: 'bins_fx' },
            { text: 'More rat traps on our block.', next: 'bins_fx' },
          ],
        },
        bins_fx: { speaker: 'bev', text: 'Mm. The board will nod and change nothing. A specific block, a building that already said yes, a program that already exists: that\'s an ask they can say yes to. I\'ll fix the letter.', next: 'bins_end' },
        bins_end: { speaker: 'you', text: '*At the meeting, Ms. Bev reads the letter at the mic. Mr. Okafor raises his hand from the second row. Outside, a rat reconsiders its life choices.*', choices: BOWS },
        bins_after: { speaker: 'bev', text: 'Bins, not bags. Say it with me. Then say it to your super.' },
      },
    },
    okafor: {
      entries: [{ cond: S('bins', 1), node: 'bins_s0' }, { node: 'bins_s_idle' }],
      nodes: {
        bins_s0: {
          speaker: 'okafor', text: 'Bins? I have forty-eight units. That\'s sixty bags a night. You want me wheeling sixty bins to the curb? And whose parking spot disappears?',
          choices: [
            { text: 'Not sixty bins. Empire Bins: big street containers assigned to your building, locked. Only your staff and Sanitation can open them. A few parking spots, not your back.', tag: 'FACT', effects: { inc: { bins_score: 1 } }, next: 'bins_s1' },
            { text: 'It\'s the law. You have to.', next: 'bins_sx' },
            { text: 'Honestly, the rats are your problem.', next: 'bins_sx2' },
          ],
        },
        bins_sx: { speaker: 'okafor', text: 'Not for a building my size. Not yet. The bin rule is for one to nine units. Try again, and try it like you\'re asking.', next: 'bins_s0b' },
        bins_sx2: { speaker: 'okafor', text: 'Rats don\'t read deeds. They live on the whole block. So do I.', next: 'bins_s0b' },
        bins_s0b: {
          speaker: 'okafor', text: 'So. Sixty bags a night. What\'s the plan?',
          choices: [{ text: 'Big locked street containers assigned to your building. Only your staff and Sanitation open them.', next: 'bins_s1' }],
        },
        bins_s1: {
          speaker: 'okafor', text: 'Locked. With a key. No more hauling bags past the rats at midnight. ...Fine. If Sanitation brings them, I\'ll sign. My back thanks you.',
          choices: [{ text: '(Shake on it.)', effects: { flags: { bins_super: true }, rel: { okafor: 5 } } }],
        },
        bins_s_idle: { speaker: 'okafor', text: 'Super of forty-eight units. Ask me about the boiler, the bags, or the rats. Actually, don\'t ask me about the rats.' },
      },
    },
  },
  npcs: [
    {
      id: 'bev', name: 'Ms. Bev', short: 'Ms. Bev', title: 'Block Captain, Fort Greene', district: 'downtown', spot: 'lm_bkorg', color: '#c9f27b',
      offset: { dx: -150, dy: 6 },
      look: { skin: '#6b3e26', hair: '#d8d8d8', style: 'short', shirt: '#3f8f5a', pants: '#2b2b40', shoes: '#111', acc: 'clipboard' },
      bio: 'Block captain for thirty years. Has filed more 311 complaints about rats than anyone alive, and has started reading about Barcelona.',
      idle: ['Bins, not bags.', 'Barcelona figured this out. So can we.', 'Rats don\'t take days off. Neither do I.'],
    },
    {
      id: 'okafor', name: 'Mr. Okafor', short: 'Mr. Okafor', title: 'Super, 48-Unit Building', district: 'downtown', spot: 'lm_bkorg', color: '#ffb36b',
      offset: { dx: 170, dy: 6 },
      look: { skin: '#4a2a1a', hair: '#1a1010', style: 'short', shirt: '#5a4a3a', pants: '#2b2b40', shoes: '#111' },
      bio: 'Super of a 48-unit building. Carries sixty bags to the curb every night and has opinions about every one of them.',
      idle: ['Sixty bags. Every night.', 'Don\'t ask me about the rats.'],
    },
  ],
};
