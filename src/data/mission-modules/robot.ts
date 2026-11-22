/**
 * Mission 10 · HIRED BY A ROBOT (Downtown, giver: Deroy)
 *
 * Facts used (checked Nov 21 2026):
 * - NYC Local Law 144 of 2021 (automated employment decision tools, AEDTs): an employer or employment agency
 *   can use an AEDT only if it had a bias audit within one year before use, done by an independent auditor;
 *   a summary of the audit results must be publicly available; candidates and employees must get notice
 *   (DCWP guidance: 10 business days before the tool is used). Complaints go to the NYC Department of
 *   Consumer and Worker Protection (DCWP), including for a missing audit, summary or notice.
 *   Sources: https://www.nyc.gov/site/dca/about/automated-employment-decision-tools.page
 *            https://www.nyc.gov/site/dca/businesses/faq-automated-employment-decision-tools.page
 *   (The law requires the audit, not any particular fix; the dialogue doesn't claim otherwise.)
 * - "One person, one stake, one ask" is Deroy's storytelling lesson, not a civic fact.
 * - Yara, Synergetix and HireBot are fiction.
 */
import { state } from '../../core/state';
import type { Effect } from '../../core/types';
import type { MissionModule } from './types';

const f = (k: string) => !!state.flag(k);
const S = (id: string, is: number | number[]) => ({ missionStage: { id, is } });
const mv = (k: string) => (state.d.activeMission === 'robot' ? (state.mission('robot').vars[k] ?? 0) : 0);

const SPOTS: [string, string, string][] = [
  ['at_lm_synergy', 'lm_synergy', 'Synergy Tower'],
  ['at_lm_bktower', 'lm_bktower', 'The Brooklyn Tower'],
];
const RESET_SPOTS = { at_lm_synergy: false, at_lm_bktower: false };

export const robot: MissionModule = {
  mission: {
    id: 'robot', number: 10, title: 'HIRED BY A ROBOT', district: 'downtown', giver: 'deroy',
    tagline: 'Yara applied for a dispatcher job. A robot said no in four seconds. Nobody can tell her why. Deroy wants that story told right.',
    stages: [
      { text: () => 'Meet Deroy at the First Church of the Block Party', targets: () => ['deroy'], done: () => f('robot_accepted') },
      { text: () => 'Hear Yara\'s story outside the Atlantic Terminal-ish Mall', targets: () => ['yara'], done: () => f('robot_met') },
      {
        text: () => `Look for the posted bias audit (${SPOTS.filter(([k]) => f(k)).length}/2): ${SPOTS.filter(([k]) => !f(k)).map(([, , n]) => n).join(' · ')}`,
        targets: () => SPOTS.filter(([k]) => !f(k)).map(([, s]) => `spot:${s}`),
        done: () => SPOTS.every(([k]) => f(k)),
        timer: 150,
      },
      { text: () => 'Ask Luco to follow the paper trail at Synergy Tower', targets: () => ['luco'], done: () => f('robot_trail') },
      { text: () => 'Tell Yara\'s story on Skye\'s livestream at the Barclays-ish Center', targets: () => ['skye'], done: () => f('robot_told') },
      { text: () => 'Report back to Deroy', targets: () => ['deroy'], done: () => f('robot_done') },
    ],
    optional: [
      { id: 'tyler', text: 'Hear Tyler\'s HireBot pitch (and survive it)', done: () => f('robot_tyler'), reward: { solidarity: 20, attention: 3 } },
      { id: 'flyers', text: 'Hand out 5 "Was a robot your interviewer?" flyers', done: () => mv('flyers') >= 5, reward: { solidarity: 30, trust: { downtown: 4 } } },
      { id: 'story', text: 'Tell it with one person, one stake, one ask', done: () => f('robot_person') && f('robot_stake') && f('robot_ask'), reward: { solidarity: 50, power: 1 } },
    ],
    rewards: (): Effect => {
      const r = state.flag('robot_result');
      if (r === 'good') return { solidarity: 350, power: 3, attention: 10, trust: { downtown: 20 }, rel: { deroy: 10, yara: 10 }, toast: 'SYNERGETIX POSTS ITS BIAS AUDIT' };
      if (r === 'ok') return { solidarity: 180, power: 1, trust: { downtown: 10 }, rel: { deroy: 5, yara: 5 } };
      return { solidarity: 70, trust: { downtown: 3 } };
    },
    failText: 'Synergetix\'s "Careers" page went into "maintenance mode" while you were stuck in a debate about parking. Deroy says: the story is still true tomorrow. Go again.',
    onFail: () => { state.clearFlagsWithPrefix('robot_'); for (const k of Object.keys(RESET_SPOTS)) delete state.d.flags[k]; },
    next: 'culture',
  },

  npcs: [
    {
      id: 'yara', name: 'Yara', short: 'Yara', title: 'Delivery Rider, Job Seeker', district: 'downtown', spot: 'lm_atlterm', offset: { dx: 40, dy: 0 }, color: '#ffc46b',
      look: { skin: '#b98260', hair: '#1a1010', style: 'cap', hatColor: '#2fd1c5', shirt: '#2fd1c5', pants: '#2b2b30', shoes: '#f2f2f2', acc: 'phone' },
      bio: 'Six years delivering across Downtown Brooklyn. Knows every loading dock and every doorman. Applied to run dispatch. A robot said no in four seconds.',
      idle: ['I know these streets better than any app. Ask me.', 'Four seconds. I\'ve waited longer for an elevator.'],
    },
  ],

  dialogue: {
    deroy: {
      entries: [
        { cond: { missionStatus: { id: 'robot', is: 'available' } }, node: 'robot_start' },
        { cond: S('robot', 0), node: 'robot_0' },
        { cond: S('robot', [1, 2, 3, 4]), node: 'robot_wait' },
        { cond: { ...S('robot', 5), flag: 'robot_result' }, node: 'robot_end' },
      ],
      nodes: {
        robot_start: { speaker: 'deroy', text: 'I have a story. Not a statistic. A story. Got a minute?', choices: [{ text: 'Always.', next: 'robot_0', effects: { startMission: 'robot' } }] },
        robot_0: { speaker: 'deroy', text: 'Yara has delivered all over Downtown for six years. She applied to run dispatch at Synergetix, up in Synergy Tower. A screening bot rejected her in four seconds.', next: 'robot_1' },
        robot_1: { speaker: 'deroy', text: 'In NYC, a company that uses AI to screen applicants needs an independent bias audit every year, a public summary of it, and notice to candidates before it\'s used. That\'s Local Law 144.', next: 'robot_2' },
        robot_2: {
          speaker: 'deroy', text: 'Go hear her out. Then go find that audit. Then we tell it: one person, one stake, one ask. Take some flyers. Big words, loud contrast.',
          choices: [
            { text: 'One person, one stake, one ask.', effects: { rel: { deroy: 4 }, items: { flyers: 8 }, flags: { robot_accepted: true, robot_score: 0, ...RESET_SPOTS } } },
            { text: 'Isn\'t AI just... math? Math can\'t be biased.', next: 'robot_3' },
          ],
        },
        robot_3: {
          speaker: 'deroy', text: 'Math learns from whatever it\'s fed. Feed it ten years of who got hired, and it gets very good at hiring the same people. That\'s why the law says: check its homework.',
          choices: [{ text: 'Checking its homework.', effects: { items: { flyers: 8 }, flags: { robot_accepted: true, robot_score: 0, ...RESET_SPOTS } } }],
        },
        robot_wait: { speaker: 'deroy', text: 'Don\'t start with the robot. Start with Yara. People don\'t rally for software. They rally for each other.' },
        robot_end: {
          speaker: 'deroy', text: 'I watched the stream. Twice. Tell me what landed.',
          choices: [
            { text: 'Yara. Her stake. And the law as the ask.', cond: { flag: 'robot_good' }, next: 'robot_end_good' },
            { text: 'Some of it. The chat got distracted.', cond: { flag: 'robot_ok' }, next: 'robot_end_ok' },
            { text: 'Mostly Tyler, unfortunately.', cond: { flag: 'robot_weak' }, next: 'robot_end_weak' },
          ],
        },
        robot_end_good: {
          speaker: 'deroy', text: 'That\'s narrative change. You didn\'t win an argument about AI. You made "show us the audit" feel normal. Synergetix posted it by dinner. Yara filed with the city anyway.',
          choices: [{ text: 'Somebody has to check its homework.', effects: { flags: { robot_done: true }, toast: 'POCKET CIVICS · AI HIRING AUDITS' } }],
        },
        robot_end_ok: {
          speaker: 'deroy', text: 'Good bones. Next time cut everything that isn\'t her, her stake, or the ask. The rest is throat-clearing. Yara is filing a complaint with the city\'s worker protection agency.',
          choices: [{ text: 'Cut the throat-clearing.', effects: { flags: { robot_done: true }, toast: 'POCKET CIVICS · AI HIRING AUDITS' } }],
        },
        robot_end_weak: {
          speaker: 'deroy', text: 'You gave the robot the spotlight. Give it to her. And give people one thing to do: Local Law 144 says post the audit and tell candidates. That\'s the ask.',
          choices: [{ text: 'Her story. Then the ask.', effects: { flags: { robot_done: true }, toast: 'POCKET CIVICS · AI HIRING AUDITS' } }],
        },
      },
    },

    yara: {
      entries: [
        { cond: S('robot', 1), node: 'robot_i0' },
        { cond: S('robot', [2, 3, 4, 5]), node: 'robot_iwait' },
        { cond: { missionStatus: { id: 'robot', is: 'complete' } }, node: 'robot_iafter' },
        { node: 'robot_iidle' },
      ],
      nodes: {
        robot_i0: { speaker: 'yara', text: 'Deroy sent you? Okay. I\'ve done six years on a bike. I know every loading dock from here to the bridge. Dispatch is the job I already do in my head.', next: 'robot_i1' },
        robot_i1: {
          speaker: 'yara', text: 'I hit "apply" at 9:02. At 9:02 and four seconds: "Not a fit at this time." No person. No reason. I didn\'t even know a robot was reading it.',
          choices: [
            { text: 'What would you want them to know about you?', next: 'robot_i2', effects: { rel: { yara: 4 } } },
            { text: 'Have you tried putting more keywords in?', next: 'robot_i3' },
          ],
        },
        robot_i2: {
          speaker: 'yara', text: 'That I\'m good at this. And that I just want to know why. If a robot\'s deciding, somebody should check the robot.',
          choices: [{ text: 'Then let\'s check the robot.', effects: { flags: { robot_met: true } } }],
        },
        robot_i3: {
          speaker: 'yara', text: 'I put "synergy" in it four times. It\'s their building\'s NAME. Still no. It\'s not me. Somebody should check the robot.',
          choices: [{ text: 'Then let\'s check the robot.', effects: { flags: { robot_met: true } } }],
        },
        robot_iwait: { speaker: 'yara', text: 'My cousin says I should just apply to a hundred more jobs. A hundred more robots. I\'d rather fix one.' },
        robot_iafter: { speaker: 'yara', text: 'They called me. A person called me. Interview Thursday. I\'m bringing my map of every loading dock.' },
        robot_iidle: { speaker: 'yara', text: 'Six years on a bike. I know every shortcut. The app still sends me the long way.' },
      },
    },

    luco: {
      entries: [{ cond: S('robot', 3), node: 'robot_l0' }],
      nodes: {
        robot_l0: { speaker: 'luco', text: 'Synergetix? I already have a spreadsheet. I have a spreadsheet for everything. Okay: their careers page. The audit summary link goes to a page that says "Coming Soon!"', next: 'robot_l1' },
        robot_l1: {
          speaker: 'luco', text: 'And the notice? Candidates are supposed to be told about the tool ahead of time. The city\'s guidance says ten business days. Yara found out it was a robot from the rejection.',
          choices: [
            { text: 'No posted summary, no notice. That\'s the story.', next: 'robot_l2', effects: { rel: { luco: 3 } } },
            { text: 'Can you hack it?', next: 'robot_l3' },
          ],
        },
        robot_l2: {
          speaker: 'luco', text: 'Follow the paper. The paper\'s missing. Also, their bot vendor\'s biggest investor? Tyler. Of course it\'s Tyler.',
          choices: [{ text: '(Screenshot the "Coming Soon!" page.)', effects: { flags: { robot_trail: true }, toast: 'RECEIPTS: NO AUDIT POSTED' } }],
        },
        robot_l3: {
          speaker: 'luco', text: 'I\'m fourteen and I run soccer tournaments. No. Also you don\'t need to: the law says they have to POST it. A missing page is the evidence. Also: their investor is Tyler.',
          choices: [{ text: '(Screenshot the "Coming Soon!" page.)', effects: { flags: { robot_trail: true }, toast: 'RECEIPTS: NO AUDIT POSTED' } }],
        },
      },
    },

    tyler: {
      entries: [{ cond: { ...S('robot', [1, 2, 3, 4]), notFlag: 'robot_tyler' }, node: 'robot_t0' }],
      nodes: {
        robot_t0: {
          speaker: 'tyler', text: 'Heyyy! You\'ve heard of HireBot? I\'m an investor. It doesn\'t see race, or gender, or anything. It only sees vibes. Pure, objective vibes.',
          choices: [
            { text: 'Then you won\'t mind the yearly bias audit the city requires.', next: 'robot_t1', effects: { rel: { tyler: -2 } } },
            { text: 'What does a vibe look like to a robot?', next: 'robot_t2' },
          ],
        },
        robot_t1: { speaker: 'tyler', text: 'Love audits! Huge fan. We\'re "pre-auditing." It\'s like auditing, but earlier, and by us. Anyway, rooftop yoga!', choices: [{ text: '(Back away slowly.)', effects: { flags: { robot_tyler: true } } }] },
        robot_t2: { speaker: 'tyler', text: 'Honestly? Mostly guys named Tyler. That\'s a bug! We\'re calling it a feature until Q3.', choices: [{ text: '(Write that down.)', effects: { flags: { robot_tyler: true } } }] },
      },
    },

    skye: {
      entries: [
        { cond: S('robot', [1, 2, 3]), node: 'robot_swait' },
        { cond: S('robot', 4), node: 'robot_s0' },
      ],
      nodes: {
        robot_swait: { speaker: 'skye', text: 'Besties, I heard there\'s a robot doing HR now?? I\'d totally go live about that. Bring me the tea. Not the detox tea. The other tea.' },
        robot_s0: {
          speaker: 'skye', text: 'Hiii besties, 412K live! I have a REAL activist and thirty seconds. Go go go!',
          choices: [
            { text: 'Meet Yara. Six years delivering in Downtown Brooklyn. Rejected for dispatch by a robot in four seconds.', tag: 'ONE PERSON', next: 'robot_s1', effects: { inc: { robot_score: 1 }, flags: { robot_person: true } } },
            { text: 'Meet HireBot. It reads a résumé in four seconds and never says why. Here\'s how it works.', next: 'robot_s2' },
            { text: 'Picture yourself. You apply for your dream job, and a robot says no in four seconds. It could be any of you.', next: 'robot_s3' },
          ],
        },
        robot_s1: {
          speaker: 'skye', text: 'Omg. Four SECONDS? Chat is typing "same" a lot. Keep going!',
          choices: [
            { text: 'She just wants to know why. Nobody can tell her. Not the company. Not even the robot.', tag: 'ONE STAKE', next: 'robot_s4', effects: { inc: { robot_score: 1 }, flags: { robot_stake: true } } },
            { text: 'And it\'s not just her. This is happening in every industry, to all kinds of people, everywhere.', next: 'robot_s4' },
            { text: 'She\'s angry, and so am I. Robots shouldn\'t be allowed to hire anybody, ever.', next: 'robot_s4' },
          ],
        },
        robot_s2: { speaker: 'skye', text: 'Chat says "huh." Chat says "is this a podcast." Nobody rallies for software, bestie. Who did the robot say no to? Give me a person.', next: 'robot_s1' },
        robot_s3: { speaker: 'skye', text: 'Chat is picturing... their lunch. "Any of you" is nobody, bestie. Who\'s the actual person?', next: 'robot_s1' },
        robot_s4: { speaker: 'tyler', text: '*A comment floats up: "tyler_luxe: HireBot isn\'t biased, it\'s PRE-OPTIMIZED. Love this convo!!"* *Skye reads it out loud. Then looks at you.*', next: 'robot_s5' },
        robot_s5: {
          speaker: 'skye', text: 'Okay, so what do we DO? Give chat one thing.',
          choices: [
            { text: 'Synergetix: Local Law 144 says post your yearly independent bias audit and tell candidates first. Yara is filing with the city.', tag: 'ONE ASK', next: 'robot_s6', effects: { inc: { robot_score: 2 }, flags: { robot_ask: true } } },
            { text: 'Synergetix: Local Law 144 says post a bias audit every five years and tell candidates after. Yara is filing with the city.', next: 'robot_s6' },
            { text: 'Synergetix: Local Law 144 says your robot has to explain every rejection. Yara wants hers by Friday.', next: 'robot_s6' },
          ],
        },
        robot_s6: {
          speaker: 'skye', text: '*The chat scrolls so fast it blurs.*',
          choices: [
            { text: '(Watch the comments.)', cond: { flagMin: { robot_score: 4 } }, next: 'robot_good' },
            { text: '(Watch the comments.)', cond: { flagMin: { robot_score: 2 }, flagMax: { robot_score: 3 } }, next: 'robot_ok' },
            { text: '(Watch the comments.)', cond: { flagMax: { robot_score: 1 } }, next: 'robot_weak' },
          ],
        },
        robot_good: {
          speaker: 'skye', text: 'OMG. Synergetix just commented "we\'re looking into it" and then their audit page went from "Coming Soon" to an actual PDF? While we were LIVE? Chat, we did that.',
          choices: [{ text: '(Thank Skye. No code SKYE10.)', effects: { flags: { robot_result: 'good', robot_good: true, robot_told: true }, rel: { skye: 4 } } }],
        },
        robot_ok: {
          speaker: 'skye', text: 'Chat loves Yara! Half of them are asking how to check if a robot read THEIR résumé. The other half are asking about my earrings. Progress!',
          choices: [{ text: '(Thank Skye.)', effects: { flags: { robot_result: 'ok', robot_ok: true, robot_told: true } } }],
        },
        robot_weak: {
          speaker: 'skye', text: 'Soooo the top comment is Tyler. Second is "what?" Third is my mom. Love you, Mom. Maybe come back with, like, a person and a plan?',
          choices: [{ text: '(Thank Skye. Rethink.)', effects: { flags: { robot_result: 'weak', robot_weak: true, robot_told: true } } }],
        },
      },
    },
  },
};
