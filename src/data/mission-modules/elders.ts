/**
 * Mission 18 · HOUSE CALLS (Flatbush; giver: Ms. Pearl at the Flatbush Older Adult Center)
 *
 * Older adults: a rent freeze, a scam call and a health care proxy, then the centers themselves.
 * Facts used (checked Nov 22 2026; sources in docs/FACTS-older-adults-ej-racial-justice.md, all [V]):
 * - SCRIE: 62+, household income $50,000 or less, rent more than one-third of income, rent stabilized / controlled /
 *   Mitchell-Lama. Freezes rent at its current level; the landlord gets a property tax credit for the difference.
 *   Apply on NYC TAP, by mail to Finance, or through 311. https://on.nyc.gov/SCRIE/
 * - NYC Aging: 300+ Older Adult Centers, free for anyone 60+, with daily meals and activities. Aging Connect:
 *   212-AGING-NYC (212-244-6469), or 311. Aging Connect also reaches C-PASS, which helps with fraud complaints.
 *   https://www.nyc.gov/site/dfta/services/older-adult-center.page
 * - Brooklyn DA: Elder Abuse Helpline 718-250-5299 (60+); Action Center for fraud 718-250-2340.
 *   https://www.brooklynda.org/victim-services-unit/
 * - Health care proxy: names someone you trust to make health decisions if you can't. Anyone 18+ can be named.
 *   Two adult witnesses, no lawyer or notary; the person named can't be a witness; your doctor can't be your proxy
 *   unless a spouse or relative. https://www.health.ny.gov/publications/1430.pdf
 * - VOLS Senior Law Project: free wills, powers of attorney and health care proxies for low-income New Yorkers 60+.
 *   Hotline 347-521-5704. https://volsprobono.org/projects/seniorlaw/
 * - GRIOT Circle: founded 1996 in Brooklyn, serves LGBTQ+ elders of color. https://brooklyn.org/griot-circle/
 * - Ms. Pearl, Mr. Wen, Mrs. Haddad, Mr. Lionel, Earl and the center are fiction.
 */
import { state } from '../../core/state';
import type { Effect } from '../../core/types';
import type { MissionModule } from './types';

const f = (k: string) => !!state.flag(k);
const S = (id: string, is: number | number[]) => ({ missionStage: { id, is } });

const CALLS: [string, string, string][] = [
  ['eld_wen', 'wen', 'Mr. Wen (rent)'],
  ['eld_haddad', 'haddad', 'Mrs. Haddad (a phone call)'],
  ['eld_lionel', 'lionel', 'Mr. Lionel (paperwork)'],
];
const RESET = { eld_wen: false, eld_haddad: false, eld_lionel: false };

export const elders: MissionModule = {
  mission: {
    id: 'elders', number: 18, title: 'HOUSE CALLS', district: 'flatbush', giver: 'pearl',
    tagline: 'Ms. Pearl knows every older neighbor in Flatbush by name, apartment and blood pressure. Three of them need help this week, and none of them will ask for it.',
    stages: [
      { text: () => 'Meet Ms. Pearl at the Flatbush Older Adult Center', targets: () => ['pearl'], done: () => f('eld_accepted') },
      {
        text: () => `House calls before the center closes (${CALLS.filter(([k]) => f(k)).length}/3): ${CALLS.filter(([k]) => !f(k)).map(([, , n]) => n).join(' · ')}`,
        targets: () => CALLS.filter(([k]) => !f(k)).map(([, id]) => id),
        done: () => CALLS.every(([k]) => f(k)),
        timer: 300,
      },
      { text: () => 'Report back to Ms. Pearl at the center', targets: () => ['pearl'], done: () => f('eld_done') },
    ],
    optional: [
      { id: 'transit', text: 'Make every house call on foot, bus or train', done: () => f('eld_done') && !f('rode_car'), reward: { solidarity: 30 } },
    ],
    rewards: (): Effect => {
      const r = state.flag('eld_result');
      if (r === 'good') return { solidarity: 360, power: 3, trust: { flatbush: 18 }, rel: { pearl: 10, wen: 6, haddad: 6, lionel: 6 }, toast: 'THREE NEIGHBORS, THREE FORMS, ZERO GIFT CARDS' };
      if (r === 'ok') return { solidarity: 190, power: 1, trust: { flatbush: 9 }, rel: { pearl: 5 } };
      return { solidarity: 70, trust: { flatbush: 2 } };
    },
    failText: 'The center closed for the night. Ms. Pearl left the light on and a note: "Tomorrow. Bring a pen." Try again.',
    onFail: () => { state.clearFlagsWithPrefix('eld_'); },
    next: 'ej',
  },

  dialogue: {
    pearl: {
      entries: [
        { cond: { missionStatus: { id: 'elders', is: 'available' } }, node: 'eld_start' },
        { cond: S('elders', 0), node: 'eld_0' },
        { cond: S('elders', 1), node: 'eld_wait' },
        { cond: S('elders', 2), node: 'eld_c0' },
      ],
      nodes: {
        eld_start: { speaker: 'pearl', text: 'Adaeze at Brooklyn Org said you listen. Good. Sit. Have some soup. It\'s lunch, it\'s free, and you look like you skip it.', choices: [{ text: '(Take the soup.)', next: 'eld_0', effects: { startMission: 'elders' } }] },
        eld_0: { speaker: 'pearl', text: 'I\'m seventy-nine. I sewed wedding dresses on Church Avenue for forty years. Now I run the phone tree here. If somebody misses lunch two days in a row, I knock.', next: 'eld_1' },
        eld_1: { speaker: 'pearl', text: 'Three of my people missed lunch. Mr. Wen\'s rent went up again. Mrs. Haddad got a phone call that scared her half to death. And Mr. Lionel has been "meaning to do some paperwork" since 2019.', next: 'eld_2' },
        eld_2: {
          speaker: 'pearl', text: 'Go see them before we close. Don\'t lecture. They\'ve been grown longer than you\'ve been alive. Just know the answer when they ask.',
          choices: [{ text: 'House calls. Then I report back.', effects: { rel: { pearl: 4 }, flags: { eld_accepted: true, eld_score: 0, rode_car: false, ...RESET } } }],
        },
        eld_wait: { speaker: 'pearl', text: 'Mr. Wen at the tenants coalition, Mrs. Haddad by the patty shop, Mr. Lionel at the church. Go. The soup will keep.' },
        eld_c0: { speaker: 'pearl', text: '*Ms. Pearl writes three names in a notebook and crosses each one out.* Good. Now the thing that keeps all of them alive: this room. There\'s a man on my block, Mr. Osei. Widowed in March. Hasn\'t come down once. What do I tell him?', next: 'eld_c1' },
        eld_c1: {
          speaker: 'pearl', text: 'Tell him straight. What is this place, and how does he find it?',
          choices: [
            { text: 'An Older Adult Center: free for anyone 60 and up, with daily meals, classes and help. There are 300+ in the city. Aging Connect, 212-AGING-NYC, or 311 finds the nearest one.', tag: 'BEST', next: 'eld_c2', effects: { inc: { eld_score: 1 } } },
            { text: 'An Older Adult Center: free once he signs up for Medicare at 65. Call 311 and they\'ll mail him a card.', next: 'eld_c1x' },
            { text: 'An Older Adult Center: free classes for anyone 60 and up, and lunch for a small daily fee. 311 can find one.', next: 'eld_c1x' },
          ],
        },
        eld_c1x: { speaker: 'pearl', text: 'Close, baby, but he\'ll hear "fee" or "Medicare" and stay home. It\'s free for anyone sixty and up, lunch included. No card. Aging Connect, 212-AGING-NYC, or 311 finds the nearest center. There are more than three hundred.', next: 'eld_c2' },
        eld_c2: { speaker: 'pearl', text: 'They used to call these senior centers. Now it\'s Older Adult Centers. Same soup. *She hands you a flyer to slide under Mr. Osei\'s door.*', next: 'eld_end' },
        eld_end: {
          speaker: 'pearl', text: 'Let\'s see how you did...',
          choices: [
            { text: '(Slide the flyer under his door.)', cond: { flagMin: { eld_score: 3 } }, effects: { flags: { eld_result: 'good', eld_done: true }, toast: 'POCKET CIVICS · OLDER ADULT CENTERS' } },
            { text: '(Slide the flyer under his door.)', cond: { flagMin: { eld_score: 2 }, flagMax: { eld_score: 2 } }, effects: { flags: { eld_result: 'ok', eld_done: true }, toast: 'POCKET CIVICS · OLDER ADULT CENTERS' } },
            { text: '(Slide the flyer under his door.)', cond: { flagMax: { eld_score: 1 } }, effects: { flags: { eld_result: 'weak', eld_done: true }, toast: 'POCKET CIVICS · OLDER ADULT CENTERS' } },
          ],
        },
      },
    },

    wen: {
      entries: [{ cond: { missionStage: { id: 'elders', is: 1 }, notFlag: 'eld_wen' }, node: 'eld_w0' }],
      nodes: {
        eld_w0: { speaker: 'wen', text: 'Seventy-one. Retired line cook. Rent-stabilized one-bedroom, same one since 1994. My pension and Social Security together: thirty-eight thousand a year. The rent now eats half of it. My daughter says "move in with us." In Ohio.', next: 'eld_w1' },
        eld_w1: {
          speaker: 'wen', text: 'I don\'t want Ohio. Is there anything?',
          choices: [
            { text: 'SCRIE, the rent freeze: you\'re over 62, under $50,000, rent stabilized, and rent is over a third of your income. It freezes your rent where it is; the landlord gets a tax credit for the difference.', tag: 'BEST', next: 'eld_w2', effects: { inc: { eld_score: 1 } } },
            { text: 'SCRIE, the rent freeze: it rolls your rent back to what you paid when you moved in, since you\'re over 62 and under $50,000.', next: 'eld_w3' },
            { text: 'SCRIE, the rent freeze: it starts at 65, so you\'d qualify in a few years. Until then, ask the landlord for a hardship plan.', next: 'eld_w3' },
          ],
        },
        eld_w2: { speaker: 'wen', text: 'Frozen. Where it is now. And the landlord isn\'t out anything, so he can\'t blame me. *He writes "SCRIE" on his hand.* How do I sign up?', next: 'eld_w4' },
        eld_w3: { speaker: 'wen', text: '*He pulls a folded printout from his jacket.* My nephew printed this. It says 62, and it says frozen at the current rent, not rolled back. The landlord gets a tax credit for the difference. So I qualify now?', next: 'eld_w4' },
        eld_w4: { speaker: 'wen', text: 'Online with NYC TAP, by mail to the Department of Finance, or call 311. I am calling 311 right now. Tell Pearl I\'ll be at lunch tomorrow.', choices: [{ text: '(Dial 311 for him.)', effects: { flags: { eld_wen: true }, rel: { wen: 3 }, toast: 'POCKET CIVICS · SCRIE RENT FREEZE' } }] },
      },
    },

    haddad: {
      entries: [{ cond: { missionStage: { id: 'elders', is: 1 }, notFlag: 'eld_haddad' }, node: 'eld_h0' }],
      nodes: {
        eld_h0: { speaker: 'haddad', text: '*Mrs. Haddad grips her phone with both hands.* A man called this morning. He said my grandson Sami was arrested and needs bail. Two thousand dollars in gift cards, today, and don\'t tell his parents because Sami is "embarrassed." He\'s calling back at four.', next: 'eld_h1' },
        eld_h1: {
          speaker: 'haddad', text: 'It\'s three-thirty. What do I do?',
          choices: [
            { text: 'Don\'t buy anything. Call Sami yourself, on the number you already have. Then report it: the Brooklyn DA\'s Elder Abuse Helpline is 718-250-5299, or call Aging Connect.', tag: 'BEST', next: 'eld_h2', effects: { inc: { eld_score: 1 } } },
            { text: 'Don\'t buy anything yet. When he calls at four, ask him for the precinct\'s number and call that to check.', next: 'eld_h3' },
            { text: 'Buy one small card to keep him on the line, and call 911 while he\'s talking so they can trace it.', next: 'eld_h3' },
          ],
        },
        eld_h2: { speaker: 'haddad', text: '*She calls Sami. He picks up on the second ring, at basketball practice, very much not in jail.* Habibi. Nothing. Grandma loves you. Go. *She hangs up and exhales for a long time.*', next: 'eld_h4' },
        eld_h3: { speaker: 'haddad', text: 'His number would just ring his friend. And a card is two thousand dollars gone. *She calls Sami on the number she already has. He picks up at basketball practice, very much not in jail.* So: call your own people first. Buy nothing.', next: 'eld_h4' },
        eld_h4: { speaker: 'haddad', text: 'And I\'m reporting him. The DA\'s Elder Abuse Helpline, 718-250-5299, for people sixty and up. Their Action Center does fraud too. And Aging Connect helps you file it with the FTC. Write those down for the phone tree.', choices: [{ text: '(Write the numbers on the phone tree list.)', effects: { flags: { eld_haddad: true }, rel: { haddad: 3 }, toast: 'POCKET CIVICS · SCAM CALLS' } }] },
      },
    },

    lionel: {
      entries: [{ cond: { missionStage: { id: 'elders', is: 1 }, notFlag: 'eld_lionel' }, node: 'eld_l0' }],
      nodes: {
        eld_l0: { speaker: 'lionel', text: 'Eighty-two. Earl and I have been together thirty-one years. Never married, we were busy. My heart doctor keeps saying "plan ahead." My nephew in Atlanta hasn\'t called since 2004, and if something happens, the hospital will call him, not Earl.', next: 'eld_l1' },
        eld_l1: {
          speaker: 'lionel', text: 'My friends at GRIOT Circle say there\'s a form. Which one, and what does it take?',
          choices: [
            { text: 'A health care proxy, naming Earl. It\'s free: you sign it with two adult witnesses, no lawyer or notary. Earl can\'t be one of the witnesses.', tag: 'BEST', next: 'eld_l2', effects: { inc: { eld_score: 1 } } },
            { text: 'A health care proxy, naming Earl. Earl and your doctor sign it as your two witnesses, so they both know your wishes.', next: 'eld_l3' },
            { text: 'A health care proxy, naming Earl. It only counts once a lawyer files it and a notary stamps it.', next: 'eld_l3' },
          ],
        },
        eld_l2: { speaker: 'lionel', text: 'Two witnesses. Not Earl. Pearl and the pastor, then. They\'ve been waiting thirty-one years to witness something for us.', next: 'eld_l4' },
        eld_l3: { speaker: 'lionel', text: '*He reads the state\'s form, squinting.* "Two adult witnesses." No lawyer, no notary. And the person you name can\'t witness it, so not Earl. Pearl and the pastor, then.', next: 'eld_l4' },
        eld_l4: { speaker: 'lionel', text: 'And for the will: the VOLS Senior Law Project does wills and proxies free, for people sixty and up who don\'t have much. 347-521-5704. Earl is going to cry. Earl cries at commercials.', choices: [{ text: '(Help him fill in Earl\'s name.)', effects: { flags: { eld_lionel: true }, rel: { lionel: 3 }, toast: 'POCKET CIVICS · HEALTH CARE PROXY' } }] },
      },
    },
  },

  npcs: [
    {
      id: 'pearl', name: 'Ms. Pearl', short: 'Ms. Pearl', title: 'Phone Tree Captain, Flatbush Older Adult Center', district: 'flatbush', spot: 'lm_oacenter', color: '#ff9ec7',
      offset: { dx: 40, dy: 4 },
      look: { skin: '#4a2a1a', hair: '#e8e4f0', style: 'bun', shirt: '#ff9ec7', pants: '#3a2a5a', shoes: '#f2f2f2', acc: 'glasses', dress: true },
      bio: 'Seventy-nine. Came from Trinidad in 1971 and sewed wedding dresses on Church Avenue for forty years. Runs the center\'s phone tree: miss lunch twice and she knocks.',
      idle: ['Lunch is free. Sit.', 'Miss lunch twice and I knock.', 'Older Adult Center. We used to say senior center. Same soup.'],
    },
    {
      id: 'wen', name: 'Mr. Wen', short: 'Mr. Wen', title: 'Retired Line Cook', district: 'flatbush', spot: 'lm_fbtenants', color: '#8fd4ff',
      offset: { dx: -36, dy: 4 },
      look: { skin: '#e8c8a0', hair: '#c8c8d0', style: 'short', shirt: '#3a6a8a', pants: '#2a2a30', shoes: '#111', acc: 'cane' },
      bio: 'Seventy-one. Cooked on the line at a Chinese-Cuban diner for thirty years. Same rent-stabilized one-bedroom since 1994. Not moving to Ohio.',
      idle: ['Not Ohio.', 'Rent goes up, I go down to lunch.', 'Thirty years on the line. My knees remember every one.'],
    },
    {
      id: 'haddad', name: 'Mrs. Haddad', short: 'Mrs. Haddad', title: 'Grandmother of Six', district: 'flatbush', spot: 'lm_patty', color: '#ffd23f',
      offset: { dx: 36, dy: 4 },
      look: { skin: '#d8a880', hair: '#2a1a12', style: 'hijab', hatColor: '#6a3a7a', shirt: '#6a3a7a', pants: '#2a1a2a', shoes: '#111', dress: true, acc: 'phone' },
      bio: 'Seventy-six. Came from Syria in 1988. Six grandchildren, all of whose phone numbers she knows by heart, which turns out to matter.',
      idle: ['Call your grandmother.', 'Nobody needs bail in gift cards.', 'Sami is fine. Sami is at practice.'],
    },
    {
      id: 'lionel', name: 'Mr. Lionel', short: 'Mr. Lionel', title: 'Retired Postal Worker, GRIOT Circle Member', district: 'flatbush', spot: 'lm_fbchurch', color: '#c9a2ff',
      offset: { dx: 36, dy: 4 },
      look: { skin: '#5a3624', hair: '#e8e4f0', style: 'short', shirt: '#7a5aa8', pants: '#2b2b40', shoes: '#3a2a1a', acc: 'glasses' },
      bio: 'Eighty-two. Delivered mail in Flatbush for thirty-four years. With his partner Earl for thirty-one. Goes to GRIOT Circle, which serves LGBTQ+ elders of color, for dominoes and gossip.',
      idle: ['Earl cries at commercials.', 'Thirty-one years. Two witnesses. Easy.', 'I delivered this whole street\'s mail. I know everybody\'s business.'],
    },
  ],
};
