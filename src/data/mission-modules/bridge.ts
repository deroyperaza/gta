/**
 * Mission 17 · THE BRIDGE (Fort Greene → Brooklyn Heights → Brownsville, East New York, Crown Heights → Fort Greene;
 * giver: Adaeze at Brooklyn Org)
 *
 * Brooklyn Org, Brooklyn's community foundation, as convener and bridge: it connects people with money to the
 * neighborhood groups doing the work, and lets residents decide where the grants go.
 *
 * Facts used (checked Nov 21 2026; sources in docs/FACTS-brooklyn-org-tensions-care-parks.md):
 * - Brooklyn Org: Brooklyn's public community foundation (Brooklyn Community Foundation until 2023). Office: 80 Hanson Place.
 *   https://brooklyn.org/contact/ · https://brooklyn.org/article/brooklyn-community-foundation-is-now-brooklyn-org/
 * - Grants grew to $19.5M in 2025; donors give through donor-advised funds held at Brooklyn Org.
 * - Since 2021 its strategic grantmaking is participatory: a council of about a dozen residents picks the grantees;
 *   a typical grant is $45K a year for 3 years of general operating support.
 *   https://brooklyn.org/article/three-lessons-learned-from-a-holistic-shift-to-participatory-grantmaking/
 * - Spark Prize (since 2016): $100K, no strings, for nonprofits advancing racial justice and equity; a resident committee
 *   narrows the field and picks five winners. https://brooklyn.org/sparkprize/
 * - Adaeze, Sloane's fund and the council meeting are fiction. No real staff are depicted.
 */
import { state } from '../../core/state';
import type { Effect } from '../../core/types';
import type { MissionModule } from './types';

const f = (k: string) => !!state.flag(k);
const S = (id: string, is: number | number[]) => ({ missionStage: { id, is } });

const TOUR: [string, string, string][] = [
  ['at_lm_bxcenter', 'lm_bxcenter', 'Brownsville Tenants & Eaters'],
  ['at_lm_enyfarm', 'lm_enyfarm', 'New Lots Farm Stand'],
  ['at_lm_chcenter', 'lm_chcenter', 'Eastern Pkwy Neighbors Center'],
];
const RESET = { at_lm_bxcenter: false, at_lm_enyfarm: false, at_lm_chcenter: false };

export const bridge: MissionModule = {
  mission: {
    id: 'bridge', number: 18, title: 'THE BRIDGE', district: 'downtown', giver: 'adaeze',
    tagline: 'Sloane has money and good intentions. Brownsville has the answers. Brooklyn Org is the bridge between them, if you can get Sloane to cross it with her ears open.',
    stages: [
      { text: () => 'Meet Adaeze at Brooklyn Org, by Hanson Place', targets: () => ['adaeze'], done: () => f('bridge_accepted') },
      { text: () => 'Bring a donor: talk to Sloane in Brooklyn Heights', targets: () => ['sloane'], done: () => f('bridge_sloane') },
      {
        text: () => `Take Sloane on a listening tour (${TOUR.filter(([k]) => f(k)).length}/3): ${TOUR.filter(([k]) => !f(k)).map(([, , n]) => n).join(' · ')}`,
        targets: () => TOUR.filter(([k]) => !f(k)).map(([, s]) => `spot:${s}`),
        done: () => TOUR.every(([k]) => f(k)),
        timer: 330,
      },
      { text: () => 'Sit on the resident advisory council at Brooklyn Org', targets: () => ['adaeze'], done: () => f('bridge_done') },
    ],
    optional: [
      { id: 'transit', text: 'Do the whole tour by subway, bus or van', done: () => f('bridge_done') && !f('rode_car'), reward: { solidarity: 40 } },
    ],
    rewards: (): Effect => {
      const r = state.flag('bridge_result');
      if (r === 'good') return { solidarity: 380, power: 4, trust: { flatbush: 10, crownheights: 10, downtown: 8 }, rel: { adaeze: 10, sloane: 8 }, toast: 'THREE-YEAR GRANTS, CHOSEN BY NEIGHBORS' };
      if (r === 'ok') return { solidarity: 200, power: 2, trust: { flatbush: 5, crownheights: 5 }, rel: { adaeze: 5 } };
      return { solidarity: 70, trust: { downtown: 2 } };
    },
    failText: 'The tour ran late and Sloane\'s sitter had to leave. She texts: "Next week? I\'ll clear the whole day." Try again.',
    onFail: () => { state.clearFlagsWithPrefix('bridge_'); for (const k of Object.keys(RESET)) delete state.d.flags[k]; },
    next: 'elders',
  },

  dialogue: {
    adaeze: {
      entries: [
        { cond: { missionStatus: { id: 'bridge', is: 'available' } }, node: 'bridge_start' },
        { cond: S('bridge', 0), node: 'bridge_0' },
        { cond: S('bridge', [1, 2]), node: 'bridge_wait' },
        { cond: S('bridge', 3), node: 'bridge_c0' },
      ],
      nodes: {
        bridge_start: { speaker: 'adaeze', text: 'You\'re the organizer everyone keeps mentioning. The fridge, the farm stand, the lot in Crown Heights. Come in. I have a proposition.', choices: [{ text: 'I\'m listening.', next: 'bridge_0', effects: { startMission: 'bridge' } }] },
        bridge_0: { speaker: 'adaeze', text: 'Brooklyn Org is Brooklyn\'s community foundation. Half of what we do is a bridge: people with money on one side, the groups doing the work on the other. Last year that bridge carried about nineteen and a half million dollars.', next: 'bridge_1' },
        bridge_1: { speaker: 'adaeze', text: 'The other half is the part I love: we don\'t decide where our grants go. Neighbors do. And we give the way the work needs it: about $45,000 a year, for three years, as general operating support. Rent, salaries, whatever keeps the lights on.', next: 'bridge_1b' },
        bridge_1b: { speaker: 'adaeze', text: 'Every year we also give the Spark Prize: $100,000, no strings, to nonprofits advancing racial justice and equity. Residents pick those winners too. Now, a donor named Sloane called us. Your doing, I hear.', next: 'bridge_2' },
        bridge_2: {
          speaker: 'adaeze', text: 'Bring her on a listening tour. Brownsville, East New York, Crown Heights. She listens, she doesn\'t lead. Then come sit on our resident council.',
          choices: [{ text: 'Listening tour. Then the council.', effects: { rel: { adaeze: 4 }, flags: { bridge_accepted: true, bridge_score: 0, rode_car: false, ...RESET } } }],
        },
        bridge_wait: { speaker: 'adaeze', text: 'Sloane, then the tour. Take the train. Donors who ride the 3 to New Lots remember it.' },
        bridge_c0: { speaker: 'you', text: '*A long table at Brooklyn Org. Twelve residents: a bus driver, two grandmothers, a youth organizer, a nurse, Coach Darnell. Sloane sits in the back, taking notes. Adaeze runs the meeting.*', next: 'bridge_c1' },
        bridge_c1: {
          speaker: 'adaeze', text: 'First question, for the new council member. Who should decide which groups get funded?',
          choices: [
            { text: 'This table. The residents here pick the grantees.', tag: 'BEST', next: 'bridge_c2', effects: { inc: { bridge_score: 1 } } },
            { text: 'You and the grants staff, Adaeze, after hearing from neighbors on the tour.', next: 'bridge_c1x' },
            { text: 'Sloane, since her fund is matching, with this table advising her.', next: 'bridge_c1x' },
          ],
        },
        bridge_c1x: { speaker: 'adaeze', text: 'That\'s how most philanthropy works. It\'s why most philanthropy misses. Here, since 2021, residents pick the grantees. This table.', next: 'bridge_c2' },
        bridge_c2: {
          speaker: 'adaeze', text: 'Second. The tenants association, the farm stand, the Neighbors Center: on the tour, every one of them said they can\'t plan past next year. What do we offer?',
          choices: [
            { text: 'Three years of general operating support. They spend it on what the work needs, rent and salaries too.', tag: 'BEST', next: 'bridge_c3', effects: { inc: { bridge_score: 1 } } },
            { text: 'A three-year grant, but only for a new program, so the money is easy to track.', next: 'bridge_c2x' },
            { text: 'General operating support for one year, renewed if they show results.', next: 'bridge_c2x' },
          ],
        },
        bridge_c2x: { speaker: 'darnell', text: 'A program budget won\'t pay the light bill, and a one-year grant won\'t keep an organizer past June. Give them three years of general support, and trust them to spend it.', next: 'bridge_c3' },
        bridge_c3: {
          speaker: 'adaeze', text: 'Last. Spark Prize nominations are open, and you just spent a week on the ground. Who do you nominate, and why?',
          choices: [
            { text: 'Ms. Celestine\'s Tenants & Eaters: they turned one onion into a grocery store fight.', tag: 'BEST', next: 'bridge_c4', effects: { inc: { bridge_score: 1 }, flags: { bridge_spark: 'celestine' } } },
            { text: 'Nadine\'s Neighbors Center: they turned a rumor into a garden.', tag: 'BEST', next: 'bridge_c4', effects: { inc: { bridge_score: 1 }, flags: { bridge_spark: 'nadine' } } },
            { text: 'Nadine herself. She\'s the one who got two neighbors to sign one letter.', next: 'bridge_c3x' },
            { text: 'Sloane\'s fund, so her match can flow back to the groups we toured.', next: 'bridge_c3x' },
          ],
        },
        bridge_c3x: { speaker: 'adaeze', text: '*The whole table laughs. Kindly. Sloane laughs hardest.* The prize goes to nonprofits doing the work. Nominate the work, not the worker, and never the wallet. Try again next cycle.', next: 'bridge_c4' },
        bridge_c4: { speaker: 'sloane', text: '*From the back, Sloane raises her hand.* I came to give. I\'m leaving with a list of who to listen to. My fund will match whatever this table decides. Without conditions. I\'m learning.', next: 'bridge_end' },
        bridge_end: {
          speaker: 'adaeze', text: 'The council votes...',
          choices: [
            { text: '(Raise your hand with the table.)', cond: { flagMin: { bridge_score: 3 } }, effects: { flags: { bridge_result: 'good', bridge_done: true }, toast: 'POCKET CIVICS · PARTICIPATORY GRANTMAKING' } },
            { text: '(Raise your hand with the table.)', cond: { flagMin: { bridge_score: 2 }, flagMax: { bridge_score: 2 } }, effects: { flags: { bridge_result: 'ok', bridge_done: true }, toast: 'POCKET CIVICS · PARTICIPATORY GRANTMAKING' } },
            { text: '(Raise your hand with the table.)', cond: { flagMax: { bridge_score: 1 } }, effects: { flags: { bridge_result: 'weak', bridge_done: true }, toast: 'POCKET CIVICS · PARTICIPATORY GRANTMAKING' } },
          ],
        },
      },
    },
    sloane: {
      entries: [{ cond: S('bridge', 1), node: 'bridge_s0' }, { cond: S('bridge', 2), node: 'bridge_swait' }],
      nodes: {
        bridge_s0: { speaker: 'sloane', text: 'Brooklyn Org says you\'re taking me on a tour. I made a list of questions. Forty-one questions. Is that too many?', choices: [
          { text: 'Bring zero. Ask them what they need, then mostly listen.', tag: 'BEST', next: 'bridge_s1', effects: { inc: { bridge_score: 1 } } },
          { text: 'Trim it to your best ten and ask those first, so each visit stays focused.', next: 'bridge_s2' },
          { text: 'Send all forty-one ahead, so each group can prepare written answers.', next: 'bridge_s2' }] },
        bridge_s1: { speaker: 'sloane', text: 'Zero questions. Terrifying. Okay. I\'m leaving the list at home. Where first?', choices: [{ text: 'Brownsville. Then East New York. Then Crown Heights.', effects: { flags: { bridge_sloane: true } } }] },
        bridge_s2: { speaker: 'sloane', text: '*She reads question one out loud: "What is your theory of change?"* ...Ms. Celestine is going to eat me alive, isn\'t she. Fine. I\'ll mostly listen.', choices: [{ text: 'Let\'s go.', effects: { flags: { bridge_sloane: true } } }] },
        bridge_swait: { speaker: 'sloane', text: 'I\'m right behind you. Listening. Visibly listening.' },
      },
    },
  },

  npcs: [
    {
      id: 'adaeze', name: 'Adaeze', short: 'Adaeze', title: 'Grants Officer, Brooklyn Org', district: 'downtown', spot: 'lm_bkorg', color: '#ffb23f',
      lesson: 'COMMUNITY FOUNDATIONS', // her pitch for Brooklyn Org, the first time you chat
      offset: { dx: 40, dy: 4 },
      look: { skin: '#4a2a1a', hair: '#1a1010', style: 'braids', shirt: '#ffb23f', pants: '#2b2b40', shoes: '#f2f2f2', acc: 'glasses' },
      bio: 'Grants officer at Brooklyn Org. Grew up in East Flatbush, daughter of a home health aide and a cab driver. Believes the best grant decision is the one she doesn\'t make herself.',
      idle: ['Neighbors decide. I take notes.', 'Three years of general operating support. Say it with me.', 'The bridge only works if people cross it both ways.'],
    },
  ],
};
