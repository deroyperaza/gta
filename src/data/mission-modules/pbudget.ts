/**
 * Mission 7 · THE PEOPLE'S MONEY (Crown Heights, giver: Jenna)
 *
 * Facts used (checked Nov 21 2026):
 * - The People's Money is NYC's citywide participatory budgeting, run by the Civic Engagement Commission.
 *   "All New York City residents ages 11 and older, regardless of immigration status, can vote."
 *   Ideas go on borough ballots; voting has run in May–June (2025: May 14–June 25; 2026: May 6–June 21).
 *   Sources: https://www.nyc.gov/site/civicengagement/news/the-peoples-money-returns-a-third-time-2025.page
 *            https://www.nyc.gov/site/civicengagement/news/nyc-cec-winning-projects-082726.page (Aug 27 2026)
 * - Facilitation craft (one-on-ones before meetings) is Jenna's lesson, not a civic fact.
 */
import { state } from '../../core/state';
import type { Effect } from '../../core/types';
import type { MissionModule } from './types';

const f = (k: string) => !!state.flag(k);
const S = (id: string, is: number | number[]) => ({ missionStage: { id, is } });
const mv = (k: string) => (state.d.activeMission === 'pbudget' ? (state.mission('pbudget').vars[k] ?? 0) : 0);

const KIDS: [string, string][] = [['pbudget_naim', 'naim'], ['pbudget_vega', 'vega'], ['pbudget_luco', 'luco']];
const SPOTS: [string, string, string][] = [
  ['at_lm_paradehq', 'lm_paradehq', 'Parade HQ'],
  ['at_lm_panyard', 'lm_panyard', 'Steel Pan Yard'],
  ['at_lm_chtenants', 'lm_chtenants', 'Tenant Union'],
];
const RESET_SPOTS = { at_lm_paradehq: false, at_lm_panyard: false, at_lm_chtenants: false };

export const pbudget: MissionModule = {
  mission: {
    id: 'pbudget', number: 8, title: 'THE PEOPLE\'S MONEY', district: 'crownheights', giver: 'jenna',
    tagline: 'The city lets kids vote on real money. Nobody told the kids. Jenna has a plan, and it starts with listening.',
    stages: [
      { text: () => 'Meet Jenna at Tenants United Hall in Bed-Stuy', targets: () => ['jenna'], done: () => f('pbudget_accepted') },
      {
        text: () => `One-on-ones with the kids (${KIDS.filter(([k]) => f(k)).length}/3): Naim · Vega · Luco. Listen, don't pitch`,
        targets: () => KIDS.filter(([k]) => !f(k)).map(([, id]) => id),
        done: () => KIDS.every(([k]) => f(k)),
      },
      {
        text: () => `Drop idea-session flyers on the Parkway (${SPOTS.filter(([k]) => f(k)).length}/3): ${SPOTS.filter(([k]) => !f(k)).map(([, , n]) => n).join(' · ')}`,
        targets: () => SPOTS.filter(([k]) => !f(k)).map(([, s]) => `spot:${s}`),
        done: () => SPOTS.every(([k]) => f(k)),
        timer: 150,
      },
      { text: () => 'Run the idea session at the Central Library (find Naim on the steps)', targets: () => ['naim'], done: () => f('pbudget_session') },
      { text: () => 'Tell Jenna how the idea session went', targets: () => ['jenna'], done: () => f('pbudget_done') },
    ],
    optional: [
      { id: 'listen', text: 'Hear all three kids without pitching', done: () => state.num('pbudget_listen') >= 3, reward: { solidarity: 40, trust: { crownheights: 4 } } },
      { id: 'flyers', text: 'Hand out 5 idea-session flyers', done: () => mv('flyers') >= 5, reward: { solidarity: 30, attention: 4 } },
      { id: 'rule', text: 'Answer Chip with the real voting rule', done: () => f('pbudget_fact'), reward: { solidarity: 30, power: 1 } },
    ],
    rewards: (): Effect => {
      const r = state.flag('pbudget_result');
      if (r === 'good') return { solidarity: 300, power: 3, trust: { crownheights: 20 }, rel: { jenna: 10, naim: 5, vega: 5, luco: 5 }, toast: 'NINETEEN KID IDEAS ON THE BALLOT' };
      if (r === 'ok') return { solidarity: 160, power: 1, trust: { crownheights: 10 }, rel: { jenna: 5 } };
      return { solidarity: 60, trust: { crownheights: 2 } };
    },
    failText: 'The idea session started with nobody in the chairs. Chip from the Free Parking Caucus took a photo of the empty room for his newsletter. Jenna says: one more lap, faster.',
    onFail: () => { state.clearFlagsWithPrefix('pbudget_'); for (const k of Object.keys(RESET_SPOTS)) delete state.d.flags[k]; },
    next: 'access',
  },

  dialogue: {
    jenna: {
      entries: [
        { cond: { missionStatus: { id: 'pbudget', is: 'available' } }, node: 'pbudget_start' },
        { cond: S('pbudget', 0), node: 'pbudget_0' },
        { cond: S('pbudget', [1, 2, 3]), node: 'pbudget_wait' },
        { cond: { ...S('pbudget', 4), flag: 'pbudget_result' }, node: 'pbudget_end' },
      ],
      nodes: {
        pbudget_start: { speaker: 'jenna', text: 'Got twenty minutes? Good. That\'s all a one-on-one takes.', choices: [{ text: 'What\'s up?', next: 'pbudget_0', effects: { startMission: 'pbudget' } }] },
        pbudget_0: { speaker: 'jenna', text: 'The kids in Crown Heights have ideas for the block. Every year a grown-up says "write it down," and the paper goes in a drawer. Not this year.', next: 'pbudget_1' },
        pbudget_1: { speaker: 'jenna', text: 'The People\'s Money. The city lets New Yorkers vote on how to spend part of its budget. Any New Yorker 11 and up can vote, whatever their immigration status.', next: 'pbudget_2' },
        pbudget_2: {
          speaker: 'jenna', text: 'We\'re holding an idea session at the Central Library. But first: one-on-ones with Naim, Vega and Luco. Ask open questions about what they care about, not yes-or-no ones. Then be quiet. Don\'t pitch.',
          choices: [
            { text: 'Listen, don\'t pitch. Got it.', effects: { rel: { jenna: 4 }, items: { flyers: 8 }, flags: { pbudget_accepted: true, pbudget_listen: 0, ...RESET_SPOTS } } },
            { text: 'Not even a tiny pitch?', next: 'pbudget_3' },
          ],
        },
        pbudget_3: {
          speaker: 'jenna', text: 'Not even a tiny one. If you\'re talking more than a third of the time, it\'s a sales call. Here, take flyers for the Parkway.',
          choices: [{ text: 'A third. Okay.', effects: { items: { flyers: 8 }, flags: { pbudget_accepted: true, pbudget_listen: 0, ...RESET_SPOTS } } }],
        },
        pbudget_wait: { speaker: 'jenna', text: 'One-on-ones first, flyers second, meeting last. Most people do it backwards and wonder why nobody comes.' },
        pbudget_end: {
          speaker: 'jenna', text: 'So? How did it go? Don\'t tell me the number of people. Tell me who talked.',
          choices: [
            { text: 'The kids did. Every idea was theirs.', cond: { flag: 'pbudget_good' }, next: 'pbudget_end_good' },
            { text: 'Some of the kids. And Chip, unfortunately.', cond: { flag: 'pbudget_ok' }, next: 'pbudget_end_ok' },
            { text: 'Mostly me. Again.', cond: { flag: 'pbudget_weak' }, next: 'pbudget_end_weak' },
          ],
        },
        pbudget_end_good: {
          speaker: 'jenna', text: 'That\'s it. That\'s the whole job. You held the room so they could fill it. Now get them to the ballot box in the spring. They\'re 11. They vote.',
          choices: [{ text: 'Spring. Ballots. Juice boxes.', effects: { flags: { pbudget_done: true }, toast: 'POCKET CIVICS · THE PEOPLE\'S MONEY' } }],
        },
        pbudget_end_ok: {
          speaker: 'jenna', text: 'A good start. Next time, more coffee before the meeting, less meeting. And ask Chip what HE cares about. It\'s never just parking.',
          choices: [{ text: 'More coffee. Less meeting.', effects: { flags: { pbudget_done: true }, toast: 'POCKET CIVICS · THE PEOPLE\'S MONEY' } }],
        },
        pbudget_end_weak: {
          speaker: 'jenna', text: 'Mm. You gave a speech to people who came to be heard. It happens to everyone once. Twice, if you\'re me. Go have three coffees this week.',
          choices: [{ text: 'Three coffees. Zero pitches.', effects: { flags: { pbudget_done: true }, toast: 'POCKET CIVICS · THE PEOPLE\'S MONEY' } }],
        },
      },
    },

    naim: {
      entries: [
        { cond: { ...S('pbudget', 1), notFlag: 'pbudget_naim' }, node: 'pbudget_n0' },
        { cond: S('pbudget', 1), node: 'pbudget_kidwait' },
        { cond: S('pbudget', 2), node: 'pbudget_kidwait' },
        { cond: S('pbudget', 3), node: 'pbudget_s0' },
      ],
      nodes: {
        pbudget_n0: {
          speaker: 'naim', text: 'Jenna sent you? Then this is a one-on-one. I can tell. You have the face of someone who was told not to pitch.',
          choices: [
            { text: 'If the block were up to you, what would you change?', next: 'pbudget_n1', effects: { inc: { pbudget_listen: 1 }, rel: { naim: 3 } } },
            { text: 'I\'m thinking a new playground by the library. Would you vote for that?', next: 'pbudget_n2' },
          ],
        },
        pbudget_n1: {
          speaker: 'naim', text: 'Shade on the library steps. People wait out here in August, grandmas, little kids, me with a book. And a ramp at the side door that isn\'t basically a ski jump.',
          choices: [{ text: '(Write it down. Say nothing clever.)', effects: { flags: { pbudget_naim: true }, toast: 'IDEA · SHADE + A REAL RAMP' } }],
        },
        pbudget_n2: {
          speaker: 'naim', text: 'That\'s a pitch wearing a question costume. Jenna felt that from Bed-Stuy. Ask me what I\'D change. ...Shade on the library steps. Write that down instead.',
          choices: [{ text: '(Write it down. Sheepishly.)', effects: { flags: { pbudget_naim: true } } }],
        },
        pbudget_kidwait: { speaker: 'naim', text: 'I already told three friends about the idea session. I told them twice. I have ADHD. I remember the important stuff extra.' },
        pbudget_s0: { speaker: 'you', text: '*Inside the Central Library: folding chairs, a crate of juice boxes, nineteen kids and four grown-ups. Then a red cap walks in holding a clipboard.*', next: 'pbudget_s1' },
        pbudget_s1: {
          speaker: 'Chip, Free Parking Caucus', text: 'Chip, Free Parking Caucus. Point of order: these are CHILDREN. They can\'t vote. Let\'s spend the money on what voters want. Forty parking spaces. Angled.',
          choices: [
            { text: 'Any New Yorker 11 and up can vote in The People\'s Money, whatever their immigration status. These kids ARE voters.', next: 'pbudget_s2', tag: 'FACT', effects: { flags: { pbudget_fact: true }, solidarity: 10 } },
            { text: 'Any New Yorker 11 and up can vote, as long as they\'re a citizen or have a green card. Most of these kids count.', next: 'pbudget_s3b' },
            { text: 'Kids 11 and up can vote in The People\'s Money if a parent co-signs the ballot. These kids ARE voters.', next: 'pbudget_s3' },
            { text: 'Any New Yorker 14 and up can vote, whatever their immigration status. The older kids here are voters.', next: 'pbudget_s4' },
          ],
        },
        pbudget_s2: { speaker: 'Chip, Free Parking Caucus', text: 'Eleven? ELEVEN? Who decided that? ...The city did. Okay. I\'ll be in the back. By the exit. Where the parking would be.', next: 'pbudget_s5' },
        pbudget_s3: { speaker: 'naim', text: 'No co-sign. No slip. Any New Yorker 11 and up votes on their own. My mom asked to co-sign mine. I said no. Civics.', next: 'pbudget_s5' },
        pbudget_s3b: { speaker: 'naim', text: 'No papers check. Any New Yorker 11 and up, WHATEVER their immigration status. It\'s on the city\'s own website. Chip, check your clipboard. Oh wait, it\'s paper.', next: 'pbudget_s5' },
        pbudget_s4: { speaker: 'vega', text: 'Fourteen?! ...Naim says it\'s 11 and up, any immigration status. So way more of us vote than Chip thinks. I\'m nine. I\'m dancing about it.', next: 'pbudget_s5' },
        pbudget_s5: {
          speaker: 'jenna', text: '*Jenna slides in at the back with a coffee and nods at you.* Your room. Who goes first?',
          choices: [
            { text: '(Hand the floor to Naim, Vega and Luco to pitch the ideas they told you.)', tag: 'BEST', cond: { flag: 'pbudget_fact', flagMin: { pbudget_listen: 2 } }, next: 'pbudget_good' },
            { text: '(Let the kids pitch the ideas they told you.)', cond: { notFlag: 'pbudget_fact', flagMin: { pbudget_listen: 2 } }, next: 'pbudget_ok' },
            { text: '(Read the ideas from your notes. The kids nod along.)', cond: { flag: 'pbudget_fact', flagMax: { pbudget_listen: 1 } }, next: 'pbudget_ok' },
            { text: '(Read the ideas from your notes. You did most of the talking in those one-on-ones.)', cond: { notFlag: 'pbudget_fact', flagMax: { pbudget_listen: 1 } }, next: 'pbudget_weak' },
            { text: '(Open with an idea of your own first, just to get the room going.)', next: 'pbudget_weak' },
          ],
        },
        pbudget_good: { speaker: 'luco', text: 'Field lights: twelve more games a week after school. I made a chart. Vega made a dance about the chart. Chip just asked if the lights come with a parking spot.', next: 'pbudget_good2' },
        pbudget_good2: {
          speaker: 'naim', text: 'Nineteen ideas, all from kids, all going to the borough list. Even Chip voted for the shade. He says it\'s "for the cars." We\'ll take it.',
          choices: [{ text: '(Stack the chairs. Call Jenna.)', effects: { flags: { pbudget_result: 'good', pbudget_good: true, pbudget_session: true }, rel: { naim: 6, vega: 4, luco: 4 } } }],
        },
        pbudget_ok: {
          speaker: 'naim', text: 'Good ideas went in. A few kids stayed quiet, though. Next time ask them alone first. That\'s literally the whole trick.',
          choices: [{ text: '(Stack the chairs. Call Jenna.)', effects: { flags: { pbudget_result: 'ok', pbudget_ok: true, pbudget_session: true }, rel: { naim: 3 } } }],
        },
        pbudget_weak: {
          speaker: 'luco', text: 'Respectfully? That was a TED talk. We came to pitch. Chip took notes, though. Chip loved it.',
          choices: [{ text: '(Stack the chairs. Call Jenna. Wince.)', effects: { flags: { pbudget_result: 'weak', pbudget_weak: true, pbudget_session: true }, rel: { luco: -2 } } }],
        },
      },
    },

    vega: {
      entries: [
        { cond: { ...S('pbudget', 1), notFlag: 'pbudget_vega' }, node: 'pbudget_v0' },
        { cond: S('pbudget', [1, 2, 3]), node: 'pbudget_kidwait' },
      ],
      nodes: {
        pbudget_v0: {
          speaker: 'vega', text: 'Is this a one-on-one? I\'ve never had a one-on-one. I\'ve had a one-on-one-on-a-trampoline.',
          choices: [
            { text: 'What do you wish your block had?', next: 'pbudget_v1', effects: { inc: { pbudget_listen: 1 }, rel: { vega: 3 } } },
            { text: 'Do you like your block the way it is?', next: 'pbudget_v2' },
          ],
        },
        pbudget_v1: {
          speaker: 'vega', text: 'A dance floor! Outside, under the trees on Eastern Parkway, so the little kids can practice for Labor Day and not dance in the street. With lights. Big ones.',
          choices: [{ text: '(Write it down. Resist the urge to do the arms.)', effects: { flags: { pbudget_vega: true }, toast: 'IDEA · A PARKWAY DANCE FLOOR' } }],
        },
        pbudget_v2: {
          speaker: 'vega', text: 'Yes? No? Kind of? That\'s a yes-or-no question. Jenna says those end conversations. Ask what I WISH it had. ...Okay, a dance floor. Write that.',
          choices: [{ text: '(Write it down.)', effects: { flags: { pbudget_vega: true } } }],
        },
        pbudget_kidwait: { speaker: 'vega', text: 'I\'m bringing my whole dance class to the idea session. And their grown-ups. And one hamster, but he\'s not voting.' },
      },
    },

    luco: {
      entries: [
        { cond: { ...S('pbudget', 1), notFlag: 'pbudget_luco' }, node: 'pbudget_l0' },
        { cond: S('pbudget', [1, 2, 3]), node: 'pbudget_kidwait' },
      ],
      nodes: {
        pbudget_l0: {
          speaker: 'luco', text: 'Jenna\'s method. I respect it. Twenty minutes, no pitch. I\'m timing you, by the way.',
          choices: [
            { text: 'What\'s the one thing that would change your week?', next: 'pbudget_l1', effects: { inc: { pbudget_listen: 1 }, rel: { luco: 3 } } },
            { text: 'I\'ve got three ideas for the park. Can I share mine first, then hear yours?', next: 'pbudget_l2' },
          ],
        },
        pbudget_l1: {
          speaker: 'luco', text: 'Field lights. The park field is booked till dark, and dark is 4:30 in November. Lights mean twelve more games a week after school. I ran the numbers.',
          choices: [{ text: '(Write it down. Don\'t ask to see the spreadsheet. Yet.)', effects: { flags: { pbudget_luco: true }, toast: 'IDEA · FIELD LIGHTS' } }],
        },
        pbudget_l2: {
          speaker: 'luco', text: 'You brought three ideas to a one-on-one? Bold. Wrong, but bold. Now I\'m just reacting to yours. ...Field lights. Put that in your list.',
          choices: [{ text: '(Add a slide.)', effects: { flags: { pbudget_luco: true } } }],
        },
        pbudget_kidwait: { speaker: 'luco', text: 'I texted the tournament captains about the idea session. Every captain brings two players. That\'s math, and math is organizing.' },
      },
    },
  },
};
