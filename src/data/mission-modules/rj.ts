/**
 * Mission 20 · NO PROGRAMS (Crown Heights → Brooklyn Org; giver: Odette at the Bergen St Know Your Rights Clinic)
 *
 * Racial justice, at the scale of one apartment listing and one job offer, and then at the scale of Brooklyn Org's Spark Prize.
 * Facts used (checked Nov 22 2026; sources in docs/FACTS-older-adults-ej-racial-justice.md; [S] = secondary source):
 * - NYC Human Rights Law, enforced by the NYC Commission on Human Rights: 25+ protected categories in housing, work and
 *   public places. Report by calling 311 and asking for "Human Rights," calling 212-416-0197, or online; file within
 *   1 year (3 years for gender-based harassment). https://www.nyc.gov/site/cchr/media/source-of-income.page
 * - Source of income: since 2008 it is illegal in NYC for a landlord or broker to refuse vouchers or public assistance
 *   (Section 8, CityFHEPS, HASA); "no programs" ads are illegal too. Same source. (NYC law only: the 2026 state court
 *   ruling on the state-level protection is not mentioned.)
 * - [S] CCHR hair guidance (Feb 2019): the right to natural hair and hairstyles tied to race (locs, cornrows, twists,
 *   braids, Bantu knots, fades, Afros) at work, school and in public. NY State's CROWN Act (2019) did the same statewide.
 *   https://natlawreview.com/article/nyc-commission-human-rights-issues-guidance-race-discrimination-basis-hair
 * - Spark Prize: Brooklyn Org's prize for "advancing racial justice": five winners a year, $100,000 each, no strings.
 *   2026 winners: B.R.O. Experience, Asiyah, BTFA, S.T.O.P., YVote. https://brooklyn.org/sparkprize/
 *   [S] descriptions of B.R.O. Experience, Asiyah and BTFA from Brooklyn Paper's 2026 spotlights.
 *   Neighbors in Action won in 2024 (src/data/grantees.ts).
 * - Weeksville: free Black families founded it in 1838 (src/data/landmarks.ts).
 * - Odette, Renée, Imani, the clinic and the listing are fiction.
 */
import { state } from '../../core/state';
import type { Effect } from '../../core/types';
import type { MissionModule } from './types';

const f = (k: string) => !!state.flag(k);
const S = (id: string, is: number | number[]) => ({ missionStage: { id, is } });

const CASES: [string, string, string][] = [
  ['rj_renee', 'renee', 'Renée (the apartment)'],
  ['rj_imani', 'imani', 'Imani (the job)'],
];
const RESET = { rj_renee: false, rj_imani: false };

export const rj: MissionModule = {
  mission: {
    id: 'rj', number: 20, title: 'NO PROGRAMS', district: 'crownheights', giver: 'odette',
    tagline: 'An apartment ad that says "NO PROGRAMS." A job offer that says "lose the locs." Odette\'s clinic has a long line and a short fuse. Help her clear it.',
    stages: [
      { text: () => 'Meet Odette at the Bergen St Know Your Rights Clinic', targets: () => ['odette'], done: () => f('rj_accepted') },
      {
        text: () => `Take two cases before the clinic closes (${CASES.filter(([k]) => f(k)).length}/2): ${CASES.filter(([k]) => !f(k)).map(([, , n]) => n).join(' · ')}`,
        targets: () => CASES.filter(([k]) => !f(k)).map(([, id]) => id),
        done: () => CASES.every(([k]) => f(k)),
        timer: 280,
      },
      { text: () => 'Bring a Spark Prize nomination to Adaeze at Brooklyn Org', targets: () => ['adaeze'], done: () => f('rj_done') },
    ],
    optional: [
      { id: 'transit', text: 'Take the train or bus to Brooklyn Org', done: () => f('rj_done') && !f('rode_car'), reward: { solidarity: 30 } },
    ],
    rewards: (): Effect => {
      const r = state.flag('rj_result');
      if (r === 'good') return { solidarity: 400, power: 4, trust: { crownheights: 18, bedstuy: 8, downtown: 6 }, rel: { odette: 10, renee: 6, imani: 6, adaeze: 5 }, toast: 'TWO COMPLAINTS FILED, ONE NOMINATION IN' };
      if (r === 'ok') return { solidarity: 210, power: 2, trust: { crownheights: 9 }, rel: { odette: 5 } };
      return { solidarity: 70, trust: { crownheights: 2 } };
    },
    failText: 'The clinic closed with people still in line. Odette, locking up: "Same time tomorrow. Bring coffee for the line." Try again.',
    onFail: () => { state.clearFlagsWithPrefix('rj_'); },
  },

  dialogue: {
    odette: {
      entries: [
        { cond: { missionStatus: { id: 'rj', is: 'available' } }, node: 'rj_start' },
        { cond: S('rj', 0), node: 'rj_0' },
        { cond: S('rj', 1), node: 'rj_wait' },
        { cond: S('rj', 2), node: 'rj_wait2' },
      ],
      nodes: {
        rj_start: { speaker: 'odette', text: 'Are you the volunteer? Please say you\'re the volunteer. The line is out the door and my paralegal is at her kid\'s graduation.', choices: [{ text: 'I\'m the volunteer.', next: 'rj_0', effects: { startMission: 'rj' } }] },
        rj_0: { speaker: 'odette', text: 'Odette. Paralegal, twenty-two years. My grandmother came from Port-au-Prince to Crown Heights in 1965. Weeksville is six blocks that way: free Black families built a whole town there in 1838. This neighborhood has always had to know its rights.', next: 'rj_1' },
        rj_1: { speaker: 'odette', text: 'Most of what walks in here is the same thing in different clothes. Somebody got told no because of who they are. New York City\'s Human Rights Law covers more than twenty-five kinds of "who they are." Housing, jobs, stores, everywhere.', next: 'rj_2' },
        rj_2: {
          speaker: 'odette', text: 'Two cases. Renée is out by the tenant union with an apartment ad. Imani is on her break at the roti shop with a job offer. Know the law before you open your mouth.',
          choices: [{ text: 'Renée, then Imani.', effects: { rel: { odette: 4 }, flags: { rj_accepted: true, rj_score: 0, rode_car: false, ...RESET } } }],
        },
        rj_wait: { speaker: 'odette', text: 'Renée by the tenant union. Imani at the roti shop. The line isn\'t getting shorter.' },
        rj_wait2: { speaker: 'odette', text: 'Two cases, two complaints. Now take it bigger. Adaeze at Brooklyn Org is taking Spark Prize nominations. Go.' },
      },
    },

    renee: {
      entries: [{ cond: { missionStage: { id: 'rj', is: 1 }, notFlag: 'rj_renee' }, node: 'rj_r0' }],
      nodes: {
        rj_r0: { speaker: 'renee', text: '*Renée holds up her phone. A two-bedroom on Prospect Place. The last line of the ad, in capitals: "NO PROGRAMS."* I have a CityFHEPS voucher. Two kids. We\'ve been in a shelter in East New York for fourteen months. That\'s the ninth "no programs" this month.', next: 'rj_r1' },
        rj_r1: {
          speaker: 'renee', text: 'The broker says "it\'s just the owner\'s policy." Is it?',
          choices: [
            { text: 'No. In NYC it\'s been illegal since 2008 to refuse a voucher like CityFHEPS or Section 8, and a "no programs" ad is illegal too. Report it: 311, ask for Human Rights.', tag: 'BEST', next: 'rj_r2', effects: { inc: { rj_score: 1 } } },
            { text: 'No. Refusing you to your face is illegal, but the ad itself is legal, so you need him to say it out loud first.', next: 'rj_r3' },
            { text: 'No, it\'s illegal. But you have to report it within 90 days, so file today.', next: 'rj_r3' },
          ],
        },
        rj_r2: { speaker: 'renee', text: 'So the screenshot is enough. *She takes three more screenshots, out of spite.* Calling 311 now.', next: 'rj_r4' },
        rj_r3: { speaker: 'renee', text: '*Odette leans out the clinic door:* The ad is the violation. "No programs" in writing is illegal on its own. And she has a year to file, not ninety days. *Renée takes three more screenshots, out of spite.*', next: 'rj_r4' },
        rj_r4: { speaker: 'renee', text: 'The Commission on Human Rights. 311, say "Human Rights." Or 212-416-0197. Within a year. I\'m filing all nine.', choices: [{ text: '(Help her file the first one.)', effects: { flags: { rj_renee: true }, rel: { renee: 3 }, toast: 'POCKET CIVICS · SOURCE OF INCOME' } }] },
      },
    },

    imani: {
      entries: [{ cond: { missionStage: { id: 'rj', is: 1 }, notFlag: 'rj_imani' }, node: 'rj_i0' }],
      nodes: {
        rj_i0: { speaker: 'imani', text: '*Imani touches her locs without meaning to.* Front desk job at a hotel downtown. Good pay, health insurance. The manager said I was perfect, and then: "We\'ll just need a more professional look. You understand." I\'ve had these since I was twelve.', next: 'rj_i1' },
        rj_i1: {
          speaker: 'imani', text: 'My mom says "that\'s just how it is." Is it?',
          choices: [
            { text: 'Not in NYC. You have the right to wear natural hair and styles tied to your race, like locs, at work. Making the job depend on it is race discrimination. Report it to the Commission on Human Rights.', tag: 'BEST', next: 'rj_i2', effects: { inc: { rj_score: 1 } } },
            { text: 'Not in NYC, but only for hairstyles worn for religious reasons. If they\'re not religious, it\'s the hotel\'s call.', next: 'rj_i3' },
            { text: 'Not in NYC at school or in public. But a front desk job is client-facing, so the hotel can set grooming rules.', next: 'rj_i3' },
          ],
        },
        rj_i2: { speaker: 'imani', text: 'Locs, braids, twists, fades, Afros. The city named them, by name. *She laughs, surprised.* My mom is going to want this in writing.', next: 'rj_i4' },
        rj_i3: { speaker: 'imani', text: '*Imani pulls it up on her phone.* The city\'s guidance says hair tied to your race: locs, braids, twists, fades, Afros. At work, at school, in public. No religion test, no "client-facing" exception. My mom is going to want this in writing.', next: 'rj_i4' },
        rj_i4: { speaker: 'imani', text: 'New York State passed the CROWN Act in 2019, too. I\'m reporting the hotel. And keeping the locs.', choices: [{ text: '(Help her start the complaint.)', effects: { flags: { rj_imani: true }, rel: { imani: 3 }, toast: 'POCKET CIVICS · YOUR HAIR IS PROTECTED' } }] },
      },
    },

    adaeze: {
      entries: [{ cond: S('rj', 2), node: 'rj_a0' }],
      nodes: {
        rj_a0: { speaker: 'adaeze', text: 'Two complaints filed in one afternoon. Odette called ahead. She says you\'re slow but correct. From Odette, that\'s a medal.', next: 'rj_a1' },
        rj_a1: { speaker: 'adaeze', text: 'Complaints fix one apartment, one job. The Spark Prize is how Brooklyn Org backs the groups fixing the pattern: five winners a year, for advancing racial justice. This year we honored them at Barclays in March.', next: 'rj_a2' },
        rj_a2: {
          speaker: 'adaeze', text: 'Before you nominate anyone, show me you know the prize. Name one of this year\'s winners and what they do.',
          choices: [
            { text: 'The B.R.O. Experience: healing, mentorship, therapy and career help for young Black and Brown men in Brooklyn.', tag: 'BEST', next: 'rj_a3', effects: { inc: { rj_score: 1 } } },
            { text: 'Asiyah Women\'s Center: an emergency shelter and support for survivors of intimate partner violence from Arab, Muslim, South Asian and BIPOC communities.', tag: 'BEST', next: 'rj_a3', effects: { inc: { rj_score: 1 } } },
            { text: 'Neighbors in Action: violence prevention and coalition-building in Crown Heights and Bed-Stuy.', next: 'rj_a2x' },
          ],
        },
        rj_a2x: { speaker: 'adaeze', text: 'Great group. They won in 2024. This year\'s five were the B.R.O. Experience, Asiyah Women\'s Center, Black Trans Femmes in the Arts, S.T.O.P. and YVote.', next: 'rj_a3' },
        rj_a3: {
          speaker: 'adaeze', text: 'Last one. A winner calls me tomorrow and asks what the $100,000 can be spent on. What do I say?',
          choices: [
            { text: 'Whatever the work needs. It\'s $100,000 with no strings: rent, salaries, a new program, a rainy-day fund.', tag: 'BEST', next: 'rj_a4', effects: { inc: { rj_score: 1 } } },
            { text: 'Any program that advances racial justice, with a report to Brooklyn Org at the end of the year on how it was spent.', next: 'rj_a3x' },
            { text: 'Programs and staff, but not rent or overhead, so the money goes straight to the community.', next: 'rj_a3x' },
          ],
        },
        rj_a3x: { speaker: 'adaeze', text: 'That\'s what most funders would say, and that\'s why we don\'t. No strings. The people doing the work know where the money should go. Rent is part of the work.', next: 'rj_a4' },
        rj_a4: { speaker: 'adaeze', text: '*She slides a nomination form across the desk.* Now write down the group you met this week that nobody\'s funding yet. Residents will read every one.', next: 'rj_end' },
        rj_end: {
          speaker: 'adaeze', text: 'Let\'s see what you wrote...',
          choices: [
            { text: '(Hand her the nomination.)', cond: { flagMin: { rj_score: 3 } }, effects: { flags: { rj_result: 'good', rj_done: true }, toast: 'POCKET CIVICS · THE SPARK PRIZE' } },
            { text: '(Hand her the nomination.)', cond: { flagMin: { rj_score: 2 }, flagMax: { rj_score: 2 } }, effects: { flags: { rj_result: 'ok', rj_done: true }, toast: 'POCKET CIVICS · THE SPARK PRIZE' } },
            { text: '(Hand her the nomination.)', cond: { flagMax: { rj_score: 1 } }, effects: { flags: { rj_result: 'weak', rj_done: true }, toast: 'POCKET CIVICS · THE SPARK PRIZE' } },
          ],
        },
      },
    },
  },

  npcs: [
    {
      id: 'odette', name: 'Odette', short: 'Odette', title: 'Paralegal, Bergen St Know Your Rights Clinic', district: 'crownheights', spot: 'lm_kyrclinic', color: '#ff6b6b',
      offset: { dx: 40, dy: 4 },
      look: { skin: '#4a2a1a', hair: '#2a1a12', style: 'curly', shirt: '#c83a4a', pants: '#2b2b40', shoes: '#111', acc: 'clipboard' },
      bio: 'Fifty. Paralegal for twenty-two years, Haitian-American, raised three blocks from the clinic. Has read the NYC Human Rights Law more times than any novel.',
      idle: ['Know the law before you open your mouth.', 'Same thing, different clothes.', 'The line is not getting shorter.'],
    },
    {
      id: 'renee', name: 'Renée', short: 'Renée', title: 'Mom of Two, CityFHEPS Voucher Holder', district: 'crownheights', spot: 'lm_chtenants', color: '#ffb23f',
      offset: { dx: -36, dy: 4 },
      look: { skin: '#5a3624', hair: '#1a1010', style: 'bun', shirt: '#ffb23f', pants: '#2b3a6b', shoes: '#f2f2f2', acc: 'phone' },
      bio: 'Thirty-four. Home health aide. Fourteen months in a shelter with her two kids, with a housing voucher in her pocket the whole time.',
      idle: ['Screenshot everything.', 'Nine "no programs" this month.', 'I have a voucher. I have a right.'],
    },
    {
      id: 'imani', name: 'Imani', short: 'Imani', title: 'Job Seeker', district: 'crownheights', spot: 'lm_roti', color: '#c9a2ff',
      offset: { dx: 36, dy: 4 },
      look: { skin: '#5a3624', hair: '#1a1010', style: 'braids', shirt: '#7a5aa8', pants: '#2a2a30', shoes: '#f2f2f2', acc: 'tote' },
      bio: 'Twenty-three. Hospitality degree from City Tech. Has had her locs since she was twelve and plans to keep them.',
      idle: ['Keeping the locs.', 'My mom wants it in writing.', 'Perfect for the job. Then the hair.'],
    },
  ],
};
