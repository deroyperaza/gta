/**
 * Mission 8 · ELEVATOR PITCH (Crown Heights, giver: Naim)
 *
 * Facts used (checked Nov 21 2026):
 * - Section 504 of the Rehabilitation Act: a public elementary or secondary school program "shall provide a free
 *   appropriate public education to each qualified handicapped person" in its jurisdiction, "regardless of the
 *   nature or severity" of the disability: regular or special education and related aids and services designed
 *   to meet the student's needs as adequately as non-disabled students' needs (often written up as a "504 plan").
 *   Sources: 34 CFR 104.33 (regulation text, https://www.law.cornell.edu/cfr/text/34/104.33)
 *            U.S. Dept. of Education, Section 504 FAPE FAQ,
 *            https://www.ed.gov/laws-and-policy/civil-rights-laws/disability-discrimination/frequently-asked-questions-section-504-free-appropriate-public-education-fape
 *            (ed.gov blocked direct fetch; its content was read via search snippets)
 * - Brooklyn Museum: ramp to the front entrance, wheelchair-accessible building, elevators (https://www.brooklynmuseum.org/visit/accessibility).
 *   Central Library: BPL calls it fully accessible (https://www.bklynlibrary.org/locations/central). Both via search results.
 * - "Ask the follow-up" ("Okay, but when?") is Naim's lesson, not a civic fact. Teo and Gary's promises are fiction.
 */
import { state } from '../../core/state';
import type { Effect } from '../../core/types';
import type { MissionModule } from './types';

const f = (k: string) => !!state.flag(k);
const S = (id: string, is: number | number[]) => ({ missionStage: { id, is } });
const mv = (k: string) => (state.d.activeMission === 'access' ? (state.mission('access').vars[k] ?? 0) : 0);

const SPOTS: [string, string, string][] = [
  ['at_lm_bkmuseum', 'lm_bkmuseum', 'Brooklyn Museum'],
  ['at_lm_centrallib', 'lm_centrallib', 'Central Library'],
];
const RESET_SPOTS = { at_lm_bkmuseum: false, at_lm_centrallib: false };

export const access: MissionModule = {
  mission: {
    id: 'access', number: 8, title: 'ELEVATOR PITCH', district: 'crownheights', giver: 'naim',
    tagline: 'Naim\'s friend Teo can\'t get to science class. The lab is up three flights. Councilmember Gary is "looking into it."',
    stages: [
      { text: () => 'Meet Naim on the Central Library steps', targets: () => ['naim'], done: () => f('access_accepted') },
      {
        text: () => `Check the entrances for ramps and elevators (${SPOTS.filter(([k]) => f(k)).length}/2): ${SPOTS.filter(([k]) => !f(k)).map(([, , n]) => n).join(' · ')}`,
        targets: () => SPOTS.filter(([k]) => !f(k)).map(([, s]) => `spot:${s}`),
        done: () => SPOTS.every(([k]) => f(k)),
        timer: 180,
      },
      { text: () => 'Bring the receipts back to Naim and plan the ask', targets: () => ['naim'], done: () => f('access_prepped') },
      { text: () => 'Make the ask at Councilmember Gary\'s Listening Tour, Borough Hall', targets: () => ['gary'], done: () => f('access_asked') },
      { text: () => 'Tell Naim what Gary said', targets: () => ['naim'], done: () => f('access_done') },
    ],
    optional: [
      { id: 'twice', text: 'Ask the follow-up twice', done: () => f('access_twice'), reward: { solidarity: 40, power: 1 } },
      { id: 'club', text: 'Hand out 5 ally-club flyers', done: () => mv('flyers') >= 5, reward: { solidarity: 30, trust: { crownheights: 4 } } },
      { id: 'nophoto', text: 'Skip the photo op', done: () => f('access_nophoto'), reward: { solidarity: 20, attention: 3 } },
    ],
    rewards: (): Effect => {
      const r = state.flag('access_result');
      if (r === 'good') return { solidarity: 320, power: 3, trust: { crownheights: 20 }, rel: { naim: 10 }, toast: 'TEO\'S CLASS MOVES DOWNSTAIRS MONDAY' };
      if (r === 'ok') return { solidarity: 170, power: 1, trust: { crownheights: 10 }, rel: { naim: 5 } };
      return { solidarity: 60, trust: { crownheights: 2 } };
    },
    failText: 'Gary\'s Listening Tour ended early. He was "listened out." Naim says that\'s fine: officials come back, and so do we. Try again.',
    onFail: () => { state.clearFlagsWithPrefix('access_'); for (const k of Object.keys(RESET_SPOTS)) delete state.d.flags[k]; },
    next: 'streets',
  },

  dialogue: {
    naim: {
      entries: [
        { cond: { missionStatus: { id: 'access', is: 'available' } }, node: 'access_start' },
        { cond: S('access', 0), node: 'access_0' },
        { cond: S('access', 1), node: 'access_wait' },
        { cond: S('access', 2), node: 'access_p0' },
        { cond: S('access', 3), node: 'access_wait2' },
        { cond: { ...S('access', 4), flag: 'access_result' }, node: 'access_end' },
      ],
      nodes: {
        access_start: { speaker: 'naim', text: 'I noticed something. I always notice something. This one\'s big.', choices: [{ text: 'What did you notice?', next: 'access_0', effects: { startMission: 'access' } }] },
        access_0: { speaker: 'naim', text: 'My friend Teo uses a wheelchair. Our science lab is on the fourth floor. Our elevator is a rumor. So Teo does science on a worksheet in the hallway.', next: 'access_1' },
        access_1: { speaker: 'naim', text: 'Councilmember Gary is doing a "Listening Tour" at Borough Hall. Before we go, we get receipts. How do other public buildings in the neighborhood get people in the door?', next: 'access_2' },
        access_2: {
          speaker: 'naim', text: 'Check the Brooklyn Museum and the library. Count steps. Find the ramp, the elevator, the door that opens by itself. And hand out these ally-club flyers on the way?',
          choices: [
            { text: 'Count the stairs. Then write the letter.', effects: { rel: { naim: 4 }, items: { flyers: 6 }, flags: { access_accepted: true, access_score: 0, ...RESET_SPOTS } } },
            { text: 'Why not just email Gary?', next: 'access_3' },
          ],
        },
        access_3: {
          speaker: 'naim', text: 'I did. I got an auto-reply that said "Thank you for your passion." Passion is not an elevator. Receipts first.',
          choices: [{ text: 'Receipts first.', effects: { items: { flyers: 6 }, flags: { access_accepted: true, access_score: 0, ...RESET_SPOTS } } }],
        },
        access_wait: { speaker: 'naim', text: 'Museum, then library. Look for the ramp, not the grand staircase. Grand staircases are how buildings say "not you."' },
        access_p0: { speaker: 'you', text: '*You report back: the museum has a ramp to the front door and two sets of elevators. The library says it\'s fully accessible. Two old public buildings, a few blocks apart, both figured it out.*', next: 'access_p1' },
        access_p1: {
          speaker: 'naim', text: 'So it\'s possible. Now the ask. Gary loves vague. What do we walk in with?',
          choices: [
            { text: 'Two asks: move Teo\'s class somewhere Teo can reach, now. And a date for the elevator.', tag: 'BEST', next: 'access_p2', effects: { inc: { access_score: 1 } } },
            { text: 'A strongly worded vibe.', next: 'access_p3' },
            { text: 'A petition to make the stairs shorter.', next: 'access_p4' },
          ],
        },
        access_p2: {
          speaker: 'naim', text: 'Yes. Specific asks get specific answers. And remember Section 504: public schools have to give students with disabilities accommodations. It\'s not a favor. It\'s a right.',
          choices: [{ text: 'Not a favor. A right.', effects: { flags: { access_prepped: true } } }],
        },
        access_p3: {
          speaker: 'naim', text: 'Gary is FLUENT in vibes. He\'ll vibe right back. Let\'s at least know one thing: Section 504 says public schools have to give students with disabilities accommodations.',
          choices: [{ text: 'Okay. 504. Got it.', effects: { flags: { access_prepped: true } } }],
        },
        access_p4: {
          speaker: 'naim', text: 'Ha. The stairs are not the problem. The missing elevator is. And Section 504 says public schools have to give students with disabilities accommodations. Bring that.',
          choices: [{ text: 'Bring the law. Leave the stairs.', effects: { flags: { access_prepped: true } } }],
        },
        access_wait2: { speaker: 'naim', text: 'Gary\'s at Borough Hall. Ask your question. Listen. Then ask the one he hoped you wouldn\'t.' },
        access_end: {
          speaker: 'naim', text: 'Well? Did he give you a date?',
          choices: [
            { text: 'Two. Teo\'s class moves Monday, and the elevator ask is in writing.', cond: { flag: 'access_good' }, next: 'access_end_good' },
            { text: 'He said his office will "get back to us."', cond: { flag: 'access_ok' }, next: 'access_end_ok' },
            { text: 'He gave me a laminated proclamation.', cond: { flag: 'access_weak' }, next: 'access_end_weak' },
          ],
        },
        access_end_good: {
          speaker: 'naim', text: 'TEO GETS SCIENCE. Okay. I\'m calm. I\'m not calm. Next we check that it actually happens on Monday. Promises are step one. Follow-ups are step two through ten.',
          choices: [{ text: '"Okay, but when?" Forever.', effects: { flags: { access_done: true }, toast: 'POCKET CIVICS · 504 RIGHTS + ASK THE FOLLOW-UP' } }],
        },
        access_end_ok: {
          speaker: 'naim', text: '"Get back to us" is a door half open. We send a letter Friday with the date we expect. Then we ask again. Politely. Until we get the other half.',
          choices: [{ text: 'Letter Friday.', effects: { flags: { access_done: true }, toast: 'POCKET CIVICS · 504 RIGHTS + ASK THE FOLLOW-UP' } }],
        },
        access_end_weak: {
          speaker: 'naim', text: 'We\'ll frame it. Next to the stairs. Then we go back with a date in our mouths. Ask the question, then "okay, but when?" That\'s the whole trick.',
          choices: [{ text: 'Next time: when.', effects: { flags: { access_done: true }, toast: 'POCKET CIVICS · 504 RIGHTS + ASK THE FOLLOW-UP' } }],
        },
      },
    },

    gary: {
      entries: [
        { cond: S('access', [0, 1, 2]), node: 'access_gwait' },
        { cond: S('access', 3), node: 'access_g0' },
      ],
      nodes: {
        access_gwait: { speaker: 'gary', text: 'My Listening Tour starts soon! I\'ll be listening. Actively. With my head tilted like this.' },
        access_g0: {
          speaker: 'gary', text: 'Naim! The kid who asked the Comptroller that elevator thing. Love the energy. School access is a TOP priority. Teo gets a worksheet, which is honestly very portable.',
          choices: [
            { text: 'A hallway worksheet isn\'t an accommodation. Under Section 504, public schools have to give students with disabilities accommodations.', tag: 'FACT', next: 'access_g1', effects: { inc: { access_score: 2 } } },
            { text: 'Could we carry the whole lab downstairs ourselves? Beakers and all?', next: 'access_g2' },
            { text: 'Can we get a photo with you about it?', next: 'access_g3', effects: { rel: { gary: 3 } } },
          ],
        },
        access_g1: { speaker: 'gary', text: 'Ah. You brought... federal law. To a listening tour. Okay. Yes. Absolutely. We\'ll get Teo sorted and look at elevators. Soon. Very soon. Great talk!', next: 'access_g4' },
        access_g2: { speaker: 'gary', text: 'Love the initiative! Liability nightmare. Absolutely not. Anyway, we\'ll look at elevators. Soon. Very soon. Great talk!', next: 'access_g4' },
        access_g3: { speaker: 'gary', text: 'YES. Finally, somebody who speaks my language. *Click.* Beautiful. Anyway, we\'ll look at elevators. Soon. Very soon. Great talk!', next: 'access_g4' },
        access_g4: {
          speaker: 'gary', text: '*Gary is already turning toward the next person in line.*',
          choices: [
            { text: '"Okay, but when?"', tag: 'FOLLOW UP', next: 'access_g5', effects: { inc: { access_score: 1 } } },
            { text: '"Thank you so much, Councilmember!"', next: 'access_g6' },
          ],
        },
        access_g5: {
          speaker: 'gary', text: 'When? ...In the capital planning cycle. The next one. Or the one after. It\'s a process. Processes are like seasons.',
          choices: [
            { text: '"Okay, but WHEN? A date for Teo\'s class and a date for the elevator ask."', next: 'access_g6', effects: { inc: { access_score: 1 }, flags: { access_twice: true } } },
            { text: '"Seasons. Got it. Thanks!"', next: 'access_g6' },
          ],
        },
        access_g6: {
          speaker: 'naim', text: '*Naim holds his notebook open, pen ready, and says nothing at all. It is the loudest silence in Borough Hall.*',
          choices: [
            { text: '(Wait for the answer.)', cond: { flagMin: { access_score: 4 } }, next: 'access_good' },
            { text: '(Wait for the answer.)', cond: { flagMin: { access_score: 2 }, flagMax: { access_score: 3 } }, next: 'access_ok' },
            { text: '(Wait for the answer.)', cond: { flagMax: { access_score: 1 } }, next: 'access_weak' },
          ],
        },
        access_good: {
          speaker: 'gary', text: '...Monday. Teo\'s science class moves to the first floor Monday. And I\'ll put the elevator in my budget ask, in writing, with the school\'s name on it. Please stop writing.',
          choices: [{ text: '(Shake his hand. No photo.)', effects: { flags: { access_result: 'good', access_good: true, access_asked: true, access_nophoto: true }, rel: { gary: 2 } } }],
        },
        access_ok: {
          speaker: 'gary', text: 'I will... have my office get back to you on a date. That is a real sentence. I have said it before and occasionally meant it.',
          choices: [{ text: '(Write down "get back to you." Underline it.)', effects: { flags: { access_result: 'ok', access_ok: true, access_asked: true } } }],
        },
        access_weak: {
          speaker: 'gary', text: 'Great talk! Here\'s a proclamation for Accessibility Awareness Week. It\'s laminated. The laminator is on the fourth floor.',
          choices: [{ text: '(Take the proclamation.)', effects: { flags: { access_result: 'weak', access_weak: true, access_asked: true } } }],
        },
      },
    },
  },
};
