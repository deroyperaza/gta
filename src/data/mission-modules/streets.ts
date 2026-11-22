/**
 * Mission 9 · STREETS FOR PEOPLE (Park Slope, giver: Adrián)
 *
 * Facts used (checked Nov 21 2026):
 * - NYC DOT Open Streets: DOT works with partners (community groups, schools, business groups, religious
 *   institutions) who apply to run an Open Street. The 2027 application is open now. 2027 deadlines:
 *   Full Closure with Concession Seating Nov 13 2026; Full Closure & Limited Local Access Dec 31 2026;
 *   Schools (launching May 2027) Dec 31 2026; Schools (launching Sept 2027) May 7 2027.
 *   Source: https://www.nyc.gov/html/dot/html/pedestrians/openstreets.shtml
 *   (The page doesn't say when applications open in a usual year, so the dialogue only says "open now,"
 *   with most deadlines on December 31.)
 * - The Free Parking Caucus, Chip and the block are fiction.
 */
import { state } from '../../core/state';
import type { Effect } from '../../core/types';
import type { MissionModule } from './types';

const f = (k: string) => !!state.flag(k);
const S = (id: string, is: number | number[]) => ({ missionStage: { id, is } });
const mv = (k: string) => (state.d.activeMission === 'streets' ? (state.mission('streets').vars[k] ?? 0) : 0);

const PARTNERS: [string, string][] = [['streets_brendan', 'brendan'], ['streets_danae', 'danae']];
const SPOTS: [string, string, string][] = [
  ['at_lm_oat', 'lm_oat', '14 Oat Milks'],
  ['at_lm_laundry1', 'lm_laundry1', 'Suds of Solidarity'],
  ['at_garden', 'garden', 'the Community Garden'],
];
const RESET_SPOTS = { at_lm_oat: false, at_lm_laundry1: false, at_garden: false };

export const streets: MissionModule = {
  mission: {
    id: 'streets', number: 9, title: 'STREETS FOR PEOPLE', district: 'parkslope', giver: 'adrian',
    tagline: 'Adrián wants to turn one block into a playground on Saturdays. The Free Parking Caucus wants to turn it into a parking spot. Forever.',
    stages: [
      { text: () => 'Meet Adrián in Prospect Park', targets: () => ['adrian'], done: () => f('streets_accepted') },
      {
        text: () => `Sign up partners for the block (${PARTNERS.filter(([k]) => f(k)).length}/2): Brendan at the co-op · Danae`,
        targets: () => PARTNERS.filter(([k]) => !f(k)).map(([, id]) => id),
        done: () => PARTNERS.every(([k]) => f(k)),
      },
      {
        text: () => `Get the block\'s sign-on sheet around (${SPOTS.filter(([k]) => f(k)).length}/3): ${SPOTS.filter(([k]) => !f(k)).map(([, , n]) => n).join(' · ')}`,
        targets: () => SPOTS.filter(([k]) => !f(k)).map(([, s]) => `spot:${s}`),
        done: () => SPOTS.every(([k]) => f(k)),
        timer: 150,
      },
      { text: () => 'Fill out the Open Streets application with Adrián', targets: () => ['adrian'], done: () => f('streets_done') },
    ],
    optional: [
      { id: 'nocommittee', text: 'Get Brendan to sign without forming a committee', done: () => f('streets_quick'), reward: { solidarity: 40, rel: { brendan: 3 } } },
      { id: 'flyers', text: 'Hand out 5 Open Streets flyers', done: () => mv('flyers') >= 5, reward: { solidarity: 30, trust: { parkslope: 4 } } },
    ],
    rewards: (): Effect => {
      const r = state.flag('streets_result');
      if (r === 'good') return { solidarity: 320, power: 3, trust: { parkslope: 20 }, rel: { adrian: 10 }, toast: 'SATURDAYS, THE STREET IS A PARK' };
      if (r === 'ok') return { solidarity: 170, power: 1, trust: { parkslope: 10 }, rel: { adrian: 5 } };
      return { solidarity: 60, trust: { parkslope: 2 } };
    },
    failText: 'The sign-on sheet got stuck in a three-hour co-op meeting about the sign-on sheet. Chip from the Free Parking Caucus parked on it. Adrián blows the whistle: again.',
    onFail: () => { state.clearFlagsWithPrefix('streets_'); for (const k of Object.keys(RESET_SPOTS)) delete state.d.flags[k]; },
    next: 'robot',
  },

  dialogue: {
    adrian: {
      entries: [
        { cond: { missionStatus: { id: 'streets', is: 'available' } }, node: 'streets_start' },
        { cond: S('streets', 0), node: 'streets_0' },
        { cond: S('streets', [1, 2]), node: 'streets_wait' },
        { cond: S('streets', 3), node: 'streets_a0' },
      ],
      nodes: {
        streets_start: { speaker: 'adrian', text: '*Whistle.* Deputy! Soccer Justice has a new case.', choices: [{ text: 'Reporting for duty.', next: 'streets_0', effects: { startMission: 'streets' } }] },
        streets_0: { speaker: 'adrian', text: 'The block by the co-op. Kids play ball between parked cars. Grandmothers sit on milk crates. It\'s already a park, for everybody on the block. It just has cars in it.', next: 'streets_1' },
        streets_1: { speaker: 'adrian', text: 'Open Streets. Community groups apply to the city\'s transportation department, DOT, to close a street to cars on set days. You run it, the city backs it.', next: 'streets_2' },
        streets_2: {
          speaker: 'adrian', text: 'Next year\'s application is open right now. We need partners and neighbors on board. Sign up Brendan and Danae, then get the sign-on sheet around the block.',
          choices: [
            { text: 'Partners, signatures, then the form.', effects: { rel: { adrian: 4 }, items: { flyers: 8 }, flags: { streets_accepted: true, streets_score: 0, ...RESET_SPOTS } } },
            { text: 'What about the Free Parking Caucus?', next: 'streets_3' },
          ],
        },
        streets_3: {
          speaker: 'adrian', text: 'They\'ll come. They always come. They love parking more than some people love their children. Be faster than them, or be right. Ideally both.',
          choices: [{ text: 'Faster and right.', effects: { items: { flyers: 8 }, flags: { streets_accepted: true, streets_score: 0, ...RESET_SPOTS } } }],
        },
        streets_wait: { speaker: 'adrian', text: 'Whistle, cones, barricades. And signatures. The holy quadrinity. That\'s not a word. Get signatures.' },
        streets_a0: { speaker: 'you', text: '*Adrián spreads the application on a park bench. Before you can uncap a pen, a red cap leans over the bench with a clipboard of his own.*', next: 'streets_a1' },
        streets_a1: {
          speaker: 'Chip, Free Parking Caucus', text: 'Chip, Free Parking Caucus. You can\'t just close a street because you FEEL like it. Who even decides that? Me. I decide. I\'ve decided: no.',
          choices: [
            { text: 'Community groups apply to NYC DOT for Open Streets. The application for next year is open right now. You can apply too, Chip.', tag: 'FACT', next: 'streets_a2', effects: { inc: { streets_score: 2 } } },
            { text: 'Community groups apply to NYC Parks for Open Streets. The application is open right now. You can apply too, Chip.', next: 'streets_a3' },
            { text: 'Community groups apply to NYC DOT for Open Streets. Applications open again next summer. You can apply then, Chip.', next: 'streets_a4' },
          ],
        },
        streets_a2: { speaker: 'Chip, Free Parking Caucus', text: 'DOT? The city lets... PEOPLE apply for streets? Then can I apply to close a street to people? ...I\'ll be filing a strongly worded parking ticket. To myself.', next: 'streets_a5' },
        streets_a3: { speaker: 'adrian', text: 'Parks? Chip just asked if he can apply to close a park to people. No. Parks runs parks. Streets are DOT. We apply to DOT, and next year\'s application is open right now. Most deadlines are December 31.', next: 'streets_a5' },
        streets_a4: { speaker: 'adrian', text: 'Next summer? Chip is smiling. Never make Chip smile. The application is open RIGHT NOW. We apply to DOT, and most deadlines are December 31.', next: 'streets_a5' },
        streets_a5: {
          speaker: 'adrian', text: 'Now the fun part. The form asks what happens on the street. Think about who\'s on this block right now. What do we write?',
          choices: [
            { text: 'Chalk for the kids, a pickup game, shade and chairs for the grandmothers, room for the bodega to set out a table.', tag: 'BEST', next: 'streets_a6', effects: { inc: { streets_score: 1 } } },
            { text: 'A real youth soccer league: goals at both ends, nets, a ref, and games all day, every Saturday.', next: 'streets_a7' },
            { text: 'Danae\'s chalk art show, with the whole street roped off so the artists have room to work.', next: 'streets_a7' },
          ],
        },
        streets_a6: { speaker: 'adrian', text: 'Yes. A street for everybody: the fast kids, the slow kids, the grandmothers, the guy with the folding table. That\'s design.', next: 'streets_a8' },
        streets_a7: { speaker: 'adrian', text: 'Deputy. I love it, and it\'s a street for one crowd. The grandmothers would need a ref to cross it. We\'ll write chalk, a pickup game and chairs for the grandmothers. You can be in charge of chalk. Chalk is a big responsibility.', next: 'streets_a8' },
        streets_a8: {
          speaker: 'adrian', text: '*Adrián reads the form back, signatures stapled to the corner, and holds his whistle like a pen.*',
          choices: [
            { text: '(Submit it.)', cond: { flagMin: { streets_score: 4 } }, next: 'streets_good' },
            { text: '(Submit it.)', cond: { flagMin: { streets_score: 2 }, flagMax: { streets_score: 3 } }, next: 'streets_ok' },
            { text: '(Submit it.)', cond: { flagMax: { streets_score: 1 } }, next: 'streets_weak' },
          ],
        },
        streets_good: {
          speaker: 'adrian', text: 'Partners, a whole block of signatures, a plan for everybody, and a filing before the deadline. That\'s a strong application. Saturdays, the street is a park.',
          choices: [{ text: '(Blow the whistle. Once. Responsibly.)', effects: { flags: { streets_result: 'good', streets_done: true }, toast: 'POCKET CIVICS · OPEN STREETS' } }],
        },
        streets_ok: {
          speaker: 'adrian', text: 'It\'s in. It\'s solid. DOT may ask us to fix a few things. Fine. Every good design gets a second draft.',
          choices: [{ text: '(Blow the whistle.)', effects: { flags: { streets_result: 'ok', streets_done: true }, toast: 'POCKET CIVICS · OPEN STREETS' } }],
        },
        streets_weak: {
          speaker: 'adrian', text: 'It\'s in. Barely. Next time: know who decides, and write a plan the grandmothers would sign. Soccer justice is patient. A little.',
          choices: [{ text: '(Blow the whistle, quietly.)', effects: { flags: { streets_result: 'weak', streets_done: true }, toast: 'POCKET CIVICS · OPEN STREETS' } }],
        },
      },
    },

    brendan: {
      entries: [
        { cond: { ...S('streets', 1), notFlag: 'streets_brendan' }, node: 'streets_b0' },
        { cond: S('streets', [1, 2, 3]), node: 'streets_bwait' },
      ],
      nodes: {
        streets_b0: {
          speaker: 'brendan', text: 'An Open Street! I LOVE this. I\'d love to form an exploratory committee to explore whether to form a committee to support it.',
          choices: [
            { text: 'No committee. Just sign as a partner. The co-op is a community group.', next: 'streets_b1', effects: { inc: { streets_score: 1 }, flags: { streets_quick: true } } },
            { text: 'Great. Form the committee, and the co-op signs as a partner once it votes yes.', next: 'streets_b2' },
          ],
        },
        streets_b1: {
          speaker: 'brendan', text: '...Just sign? Without a sub-vote? That feels illegal. It\'s so freeing. Here. The co-op is IN. I\'ll bring the turnips. For the vibe.',
          choices: [{ text: '(Take the signature before he reconsiders.)', effects: { flags: { streets_brendan: true }, rel: { brendan: 4 }, toast: 'THE CO-OP SIGNS ON' } }],
        },
        streets_b2: {
          speaker: 'brendan', text: 'Thursdays, 7pm, room B, for six weeks. ...You\'re making a face. Fine. I\'ll sign now and we\'ll hold the committee retroactively.',
          choices: [{ text: '(Take the signature.)', effects: { flags: { streets_brendan: true }, toast: 'THE CO-OP SIGNS ON' } }],
        },
        streets_bwait: { speaker: 'brendan', text: 'I\'ve started a subcommittee on chalk colors. It\'s non-binding. It\'s very binding emotionally.' },
      },
    },

    danae: {
      entries: [
        { cond: { ...S('streets', 1), notFlag: 'streets_danae' }, node: 'streets_d0' },
        { cond: S('streets', [1, 2, 3]), node: 'streets_dwait' },
      ],
      nodes: {
        streets_d0: {
          speaker: 'danae', text: 'A street with no cars on Saturdays? Do you know what kids draw when you give them a whole street? Everything. It\'s the biggest exhibit in Brooklyn.',
          choices: [
            { text: 'Sign on as a partner? Bring the chalk program?', next: 'streets_d1', effects: { rel: { danae: 3 } } },
            { text: 'Could we hang art on the parked cars instead?', next: 'streets_d2' },
          ],
        },
        streets_d1: {
          speaker: 'danae', text: 'Signed. I\'ll bring chalk, a folding table and a sign that says "THE MUSEUM IS ALSO OUT HERE." Library card sign-ups at the corner.',
          choices: [{ text: '(Shake on it.)', effects: { flags: { streets_danae: true }, toast: 'DANAE SIGNS ON' } }],
        },
        streets_d2: {
          speaker: 'danae', text: 'The cars would have to agree to the loan. Cars are terrible lenders. No: no cars, all chalk. I\'m signing.',
          choices: [{ text: '(Take the signature.)', effects: { flags: { streets_danae: true }, toast: 'DANAE SIGNS ON' } }],
        },
        streets_dwait: { speaker: 'danae', text: 'I ordered four hundred sticks of chalk. The museum thinks it\'s for a show. It is. The show is the street.' },
      },
    },
  },
};
