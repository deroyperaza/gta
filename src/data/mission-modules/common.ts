/**
 * Mission 16 · ONE PARKWAY (Crown Heights, giver: Nadine)
 *
 * Mediating between neighbors: Motti, a Lubavitcher father who runs a hardware store on Kingston Ave, and Ms. Yvette,
 * a retired nurse from Trinidad who runs her block association. Both want the same empty lot. Tyler wants it more,
 * and his flyers tell each side the other is buying it. The satire is aimed at the developer who profits from division,
 * never at either community. Both neighbors are written as whole people with real reasons.
 *
 * Facts used (checked Nov 21 2026; sources in docs/FACTS-transit-food-mediation.md):
 * - August 19 1991: a car in the Lubavitcher Rebbe's motorcade went onto the sidewalk and killed seven-year-old Gavin Cato,
 *   the son of Guyanese immigrants. Hours later Yankel Rosenbaum, a 29-year-old Australian student, was stabbed and died.
 *   (What to call the days that followed is contested, so the game doesn't name them.)
 *   https://en.wikipedia.org/wiki/Crown_Heights_riot · https://www.baruch.cuny.edu/nycdata/disasters/riots-crown_heights.html
 * - Free community mediation: the NY courts' Community Dispute Resolution Centers offer free or low-cost mediation,
 *   facilitated dialogue and restorative circles, court case or not. Brooklyn's is the New York Peace Institute's
 *   Brooklyn Mediation Center. https://ww2.nycourts.gov/ip/adr/cdrc.shtml · https://nypeace.org/mediation/
 * - Housing costs and displacement are concerns both communities have raised publicly (2019–2025 reporting).
 * - Community boards advise on land use. Nadine, Motti, Ms. Yvette, the lot and the center are fiction.
 */
import { state } from '../../core/state';
import type { Effect } from '../../core/types';
import type { MissionModule } from './types';

const f = (k: string) => !!state.flag(k);
const S = (id: string, is: number | number[]) => ({ missionStage: { id, is } });

const FLYERS: [string, string, string][] = [
  ['at_lm_farmacy', 'lm_farmacy', 'Franklin Ave Farmacy'],
  ['at_lm_chchurch', 'lm_chchurch', 'Greater Hope & Housing Church'],
  ['at_lm_kingstonhw', 'lm_kingstonhw', 'Kingston Ave Hardware'],
];
const RESET = { at_lm_farmacy: false, at_lm_chchurch: false, at_lm_kingstonhw: false };

export const common: MissionModule = {
  mission: {
    id: 'common', number: 16, title: 'ONE PARKWAY', district: 'crownheights', giver: 'nadine',
    tagline: 'Two neighbors want the same empty lot on Montgomery Street. A developer wants it more. His flyers say they\'re enemies. They haven\'t met.',
    stages: [
      { text: () => 'Meet Nadine at the Eastern Pkwy Neighbors Center', targets: () => ['nadine'], done: () => f('common_accepted') },
      { text: () => 'Hear Motti out at Kingston Ave Hardware', targets: () => ['motti'], done: () => f('common_motti') },
      { text: () => 'Hear Ms. Yvette out at the Montgomery St Block Assn', targets: () => ['yvette'], done: () => f('common_yvette') },
      {
        text: () => `Take down Tyler's "concerned neighbor" flyers before the meeting (${FLYERS.filter(([k]) => f(k)).length}/3): ${FLYERS.filter(([k]) => !f(k)).map(([, , n]) => n).join(' · ')}`,
        targets: () => FLYERS.filter(([k]) => !f(k)).map(([, s]) => `spot:${s}`),
        done: () => FLYERS.every(([k]) => f(k)),
        timer: 180,
      },
      { text: () => 'The sit-down: back to Nadine at the Neighbors Center', targets: () => ['nadine'], done: () => f('common_done') },
    ],
    optional: [
      { id: 'listen', text: 'Reflect back what both neighbors said', done: () => f('common_reflect_m') && f('common_reflect_y'), reward: { solidarity: 40, trust: { crownheights: 4 } } },
    ],
    rewards: (): Effect => {
      const r = state.flag('common_result');
      if (r === 'good') return { solidarity: 360, power: 3, trust: { crownheights: 22 }, rel: { nadine: 10, motti: 6, yvette: 6 }, toast: 'ONE LOT. ONE GARDEN. TWO SIGNATURES.' };
      if (r === 'ok') return { solidarity: 190, power: 1, trust: { crownheights: 10 }, rel: { nadine: 5 } };
      return { solidarity: 60, trust: { crownheights: 2 } };
    },
    failText: 'Tyler\'s flyers stayed up. The meeting got postponed "until things calm down," which is how things never calm down. Try again.',
    onFail: () => { state.clearFlagsWithPrefix('common_'); for (const k of Object.keys(RESET)) delete state.d.flags[k]; },
  },

  dialogue: {
    nadine: {
      entries: [
        { cond: { missionStatus: { id: 'common', is: 'available' } }, node: 'common_start' },
        { cond: S('common', 0), node: 'common_0' },
        { cond: S('common', [1, 2, 3]), node: 'common_wait' },
        { cond: S('common', 4), node: 'common_s0' },
      ],
      nodes: {
        common_start: { speaker: 'nadine', text: 'You organize. I mediate. Different tools, same street. I could use you.', choices: [{ text: 'What\'s going on?', next: 'common_0', effects: { startMission: 'common' } }] },
        common_0: { speaker: 'nadine', text: 'The empty lot on Montgomery. Motti wants a playground: his block has forty kids and one swing. Ms. Yvette\'s seniors want a garden: they\'ve grown callaloo in buckets for ten years.', next: 'common_1' },
        common_1: { speaker: 'nadine', text: 'And a developer, your friend Tyler, has been putting up flyers on both sides. One says "THEY are buying the lot." The other one says the same thing, about the other "they."', next: 'common_2' },
        common_2: { speaker: 'nadine', text: 'This neighborhood remembers August 1991. A car in the Rebbe\'s motorcade killed a seven-year-old boy, Gavin Cato. That night a young man named Yankel Rosenbaum was stabbed and killed. People here carry both names. A rumor on a lamppost isn\'t small here.', next: 'common_3' },
        common_3: {
          speaker: 'nadine', text: 'So: you talk to each of them first, alone. Then the flyers come down. Then we sit together. Ready?',
          choices: [
            { text: 'Listen first. Then the sit-down.', effects: { rel: { nadine: 4 }, flags: { common_accepted: true, common_score: 0, ...RESET } } },
            { text: 'Can\'t we just split the lot down the middle?', next: 'common_4' },
          ],
        },
        common_4: {
          speaker: 'nadine', text: 'Maybe. But if you hand people an answer before you hear them, they\'ll fight the answer. Listen first.',
          choices: [{ text: 'Listen first.', effects: { flags: { common_accepted: true, common_score: 0, ...RESET } } }],
        },
        common_wait: { speaker: 'nadine', text: 'Motti, then Ms. Yvette. You\'re not there to win. You\'re there to understand. Then the flyers.' },
        common_s0: { speaker: 'you', text: '*The Neighbors Center. Folding chairs in a circle. Motti brought rugelach. Ms. Yvette brought sorrel. Neither one touches the other\'s plate. Yet.*', next: 'common_s1' },
        common_s1: {
          speaker: 'nadine', text: 'Before anyone talks, we need ground rules. What do you suggest?',
          choices: [
            { text: 'Each person speaks without interruption. We talk about the lot, not about "those people." Nadine stays neutral.', tag: 'BEST', next: 'common_s2', effects: { inc: { common_score: 1 } } },
            { text: 'Loudest voice wins.', next: 'common_s2x' },
            { text: 'No rules. Let it all out.', next: 'common_s2x' },
          ],
        },
        common_s2x: { speaker: 'nadine', text: 'That\'s how the last meeting ended in 2019. Let\'s try: one person speaks at a time, we talk about the lot, and I stay neutral.', next: 'common_s2' },
        common_s2: {
          speaker: 'nadine', text: 'They\'ve both spoken. Now: what do they actually want, underneath "playground" and "garden"?',
          choices: [
            { text: 'Somewhere safe outside, close to home, for the people they look after: kids for Motti, elders for Ms. Yvette. And neither of them wants to be priced out.', tag: 'BEST', next: 'common_s3', effects: { inc: { common_score: 1 } } },
            { text: 'Motti wants to win and Yvette wants to win.', next: 'common_s3x' },
            { text: 'Honestly? Different things. They\'ll never agree.', next: 'common_s3x' },
          ],
        },
        common_s3x: { speaker: 'yvette', text: '*Ms. Yvette:* I don\'t need to win. I need my seniors outside. *Motti:* And I need my kids outside. *They look at each other.* ...Oh.', next: 'common_s3' },
        common_s3: { speaker: 'motti', text: 'My grandmother kept a garden in Kfar Chabad. Tomatoes the size of your fist. I wouldn\'t mind if the kids grew something.', next: 'common_s4' },
        common_s4: { speaker: 'yvette', text: 'And my seniors could use some noise. It\'s too quiet on that block. Children are good noise.', next: 'common_s5' },
        common_s5: {
          speaker: 'nadine', text: 'So what goes in the agreement?',
          choices: [
            { text: 'One lot, two halves that share a fence with a gate: raised beds for the seniors, a play area for the kids. Both sign a letter asking the community board to keep the lot public, not sold.', tag: 'BEST', next: 'common_s6', effects: { inc: { common_score: 1 } } },
            { text: 'Sell it to Tyler and split the money.', next: 'common_s6x' },
            { text: 'Whoever shows up first on Sunday gets it.', next: 'common_s6x' },
          ],
        },
        common_s6x: { speaker: 'nadine', text: 'Then Tyler wins and nobody else does. Let\'s write it together: shared lot, a garden and a play area, and a joint letter to the community board to keep it public.', next: 'common_s6' },
        common_s6: { speaker: 'nadine', text: 'One more thing, for both of you, and for you, organizer: if something comes up later, the courts fund free community mediation. In Brooklyn it\'s the Brooklyn Mediation Center. You don\'t need a lawsuit to use it. You just need a neighbor.', next: 'common_end' },
        common_end: {
          speaker: 'you', text: '*Motti tries the sorrel. Ms. Yvette takes two rugelach "for later." They sign. Tyler\'s last flyer flaps on a lamppost outside. Somebody draws a garden on it.*',
          choices: [
            { text: '(Sign as a witness.)', cond: { flagMin: { common_score: 4 } }, effects: { flags: { common_result: 'good', common_done: true }, toast: 'POCKET CIVICS · COMMUNITY MEDIATION' } },
            { text: '(Sign as a witness.)', cond: { flagMin: { common_score: 2 }, flagMax: { common_score: 3 } }, effects: { flags: { common_result: 'ok', common_done: true }, toast: 'POCKET CIVICS · COMMUNITY MEDIATION' } },
            { text: '(Sign as a witness.)', cond: { flagMax: { common_score: 1 } }, effects: { flags: { common_result: 'weak', common_done: true }, toast: 'POCKET CIVICS · COMMUNITY MEDIATION' } },
          ],
        },
      },
    },

    motti: {
      entries: [
        { cond: S('common', 1), node: 'common_m0' },
        { cond: S('common', [2, 3, 4]), node: 'common_mwait' },
      ],
      nodes: {
        common_m0: { speaker: 'motti', text: 'You\'re here about the lot? Good. Somebody should be. Forty kids on my block. One swing, and it squeaks. My daughter asks me why the lot has a fence and no door.', next: 'common_m1' },
        common_m1: { speaker: 'motti', text: 'And now this flyer says "they" are buying it. I\'ve lived on this block twenty years. I don\'t know who "they" is. I know Ms. Yvette by face. We nod. That\'s it.', next: 'common_m2' },
        common_m2: {
          speaker: 'motti', text: '*He waits to see what you say.*',
          choices: [
            { text: '"So you want somewhere safe for the kids to play, close to home, and you\'re worried you\'ll lose the lot to someone you\'ve never talked to. Is that right?"', tag: 'BEST', next: 'common_m3', effects: { inc: { common_score: 1 }, flags: { common_reflect_m: true } } },
            { text: 'Don\'t worry, I\'m on your side.', next: 'common_m4' },
            { text: 'Have you tried just being nicer?', next: 'common_m4' },
          ],
        },
        common_m3: { speaker: 'motti', text: '...Yes. That\'s it exactly. Nobody says it back to you like that. Okay. I\'ll come to the meeting.', choices: [{ text: '(Thank him.)', effects: { flags: { common_motti: true }, rel: { motti: 4 } } }] },
        common_m4: { speaker: 'motti', text: 'I don\'t need a side. I need a swing that doesn\'t squeak. ...Fine. I\'ll come to the meeting. Bring a better question.', choices: [{ text: '(Nod.)', effects: { flags: { common_motti: true } } }] },
        common_mwait: { speaker: 'motti', text: 'I\'ll be there. I\'m bringing rugelach. It\'s a strategy.' },
      },
    },

    yvette: {
      entries: [
        { cond: S('common', 2), node: 'common_y0' },
        { cond: S('common', [3, 4]), node: 'common_ywait' },
      ],
      nodes: {
        common_y0: { speaker: 'yvette', text: 'Sit, sit. Thirty-one years a nurse at Kings County. Now I nurse this block. My seniors grow callaloo and peppers in buckets on the stoop. Buckets! There\'s a whole lot right there.', next: 'common_y1' },
        common_y1: { speaker: 'yvette', text: 'And somebody\'s been putting up flyers saying "they" want the lot. My rent went up four hundred dollars this year. Everybody\'s scared of being the next one gone.', next: 'common_y2' },
        common_y2: {
          speaker: 'yvette', text: '*She folds her arms and waits.*',
          choices: [
            { text: 'What would the lot need to have, for your seniors to actually use it?', tag: 'BEST', next: 'common_y3', effects: { inc: { common_score: 1 }, flags: { common_reflect_y: true } } },
            { text: 'Motti\'s people are fine, you know.', next: 'common_y4' },
            { text: 'So you want to block the playground?', next: 'common_y4' },
          ],
        },
        common_y3: { speaker: 'yvette', text: 'Raised beds, so nobody\'s kneeling. Shade. A bench. A water tap. And to know nobody\'s going to sell it out from under us. That\'s all. That\'s everything.', choices: [{ text: '(Write it down.)', effects: { flags: { common_yvette: true }, rel: { yvette: 4 } } }] },
        common_y4: { speaker: 'yvette', text: 'I didn\'t say anything about anybody\'s people. I said buckets. Ask me what I need, not who I\'m against. ...I\'ll come to the meeting.', choices: [{ text: '(Nod.)', effects: { flags: { common_yvette: true } } }] },
        common_ywait: { speaker: 'yvette', text: 'I\'m bringing sorrel. It\'s a strategy.' },
      },
    },
  },

  npcs: [
    {
      id: 'nadine', name: 'Nadine', short: 'Nadine', title: 'Volunteer Mediator', district: 'crownheights', spot: 'lm_chcenter', color: '#8fe3d0',
      offset: { dx: 40, dy: 4 },
      look: { skin: '#8a5a3c', hair: '#2a1a12', style: 'braids', shirt: '#2f8f7a', pants: '#2b2b40', shoes: '#f2f2f2', acc: 'clipboard' },
      bio: 'Volunteer community mediator. Grew up on Eastern Parkway. Believes most fights are two people describing the same fear in different words.',
      idle: ['Listen first. Answer later.', 'Most fights are the same fear in two accents.', 'Free mediation exists. Almost nobody knows. Tell somebody.'],
    },
    {
      id: 'motti', name: 'Motti', short: 'Motti', title: 'Kingston Ave Hardware', district: 'crownheights', spot: 'lm_kingstonhw', color: '#c9d2ff',
      offset: { dx: 34, dy: 4 },
      look: { skin: '#ecc8a8', hair: '#2a1a12', style: 'cap', hatColor: '#111111', shirt: '#f2f2f2', pants: '#1a1a1c', shoes: '#111' },
      bio: 'Runs the hardware store his father opened on Kingston Ave. Father of five. Can fix any hinge in Crown Heights and most arguments, eventually.',
      idle: ['Forty kids. One swing. It squeaks.', 'Everything is fixable. Some things need a meeting first.', 'Rugelach is a strategy.'],
    },
    {
      id: 'yvette', name: 'Ms. Yvette', short: 'Ms. Yvette', title: 'Montgomery St Block Assn', district: 'crownheights', spot: 'lm_blockassn', color: '#ffcf6b',
      offset: { dx: 34, dy: 4 },
      look: { skin: '#5a3624', hair: '#cfc8d4', style: 'short', shirt: '#e8743b', pants: '#2b2b40', shoes: '#f2f2f2', acc: 'glasses', dress: true },
      bio: 'Retired nurse, thirty-one years at Kings County Hospital. Came from Trinidad in 1979. Runs the block association, the stoop garden and, unofficially, everyone\'s blood pressure.',
      idle: ['Buckets! There\'s a whole lot right there.', 'Ask me what I need, not who I\'m against.', 'Sorrel is a strategy.'],
    },
  ],
};
