import { state } from '../../core/state';
import type { MissionModule } from './types';

/**
 * Mission 6 · SECOND CHANCES (Downtown). Giver: Bridgette. New NPC: Andre (fictional), just home from prison.
 *
 * Civic facts used (checked Nov 21 2026):
 * - A 2021 law (Chapter 103 of the Laws of 2021) restores the right to vote for a person convicted of a felony upon
 *   release from incarceration, even on parole or post-release supervision. The person must re-register.
 *   Source: NYS Board of Elections, "Voting After Incarceration" https://elections.ny.gov/voting-after-incarceration
 *   and FAQ https://elections.ny.gov/system/files/documents/2025/04/faq-right-to-vote-after-release-shortened-2025_0.pdf
 * - Register online, by mail or in person at the county board of elections; the form must be received at least
 *   10 days before the election. At release, people should be offered help registering. Source: same BOE pages.
 * - Clean Slate Act: took effect Nov 16, 2024. Misdemeanors become eligible for sealing 3 years after sentencing or
 *   release (whichever is later), felonies 8 years after; not while on probation/parole or with pending cases, and a
 *   new conviction restarts the clock. Sex-offense registrants, life sentences and non-drug class A felonies are
 *   excluded ("most felonies"). Courts have until Nov 16, 2027 to make sealing automatic.
 *   Source: NYS Unified Court System https://www.nycourts.gov/cleanslate (via search; page blocks direct fetch) ·
 *   NYS Assembly https://assembly.ny.gov/cleanslate/
 */

const f = (k: string) => !!state.flag(k);
const S = (id: string, is: number | number[]) => ({ missionStage: { id, is } });
const DONE = (id: string) => ({ missionStatus: { id, is: 'complete' as const } });

export const reentry: MissionModule = {
  mission: {
    id: 'reentry', number: 7, title: 'SECOND CHANCES', district: 'downtown', giver: 'bridgette',
    tagline: 'Gary booked a "Second Chances" photo op. He forgot to invite anyone getting one.',
    stages: [
      { text: () => 'Talk to Bridgette at the Dept. of Permits & Delays', targets: () => ['bridgette'], done: () => f('reentry_accepted') },
      { text: () => 'Meet Andre outside the Hall of Mild Justice', targets: () => ['andre'], done: () => f('reentry_andre') },
      { text: () => 'Set up the registration table at Tenants United Hall before the fair opens', targets: () => ['spot:lm_tenanthall'], done: () => f('at_lm_tenanthall'), timer: 150 },
      { text: () => 'Crash Gary\'s "Second Chances" photo op at Borough Hall', targets: () => ['gary'], done: () => f('reentry_done') },
    ],
    optional: [
      { id: 'flyers', text: 'Hand out 5 voter registration flyers', done: () => (state.d.activeMission === 'reentry' ? (state.mission('reentry').vars.flyers ?? 0) : 0) >= 5, reward: { solidarity: 35, attention: 4, trust: { downtown: 4 } } },
      { id: 'early', text: 'Open the table with 1:00+ to spare', done: () => f('at_lm_tenanthall') && (state.mission('reentry').timeLeft ?? 0) >= 60, reward: { solidarity: 40 } },
      { id: 'mic', text: 'Let Andre tell his own story', done: () => f('reentry_mic'), reward: { solidarity: 50, rel: { andre: 6 } } },
    ],
    rewards: () => {
      const r = state.flag('reentry_result');
      if (r === 'good') return { solidarity: 380, power: 3, trust: { downtown: 20 }, rel: { andre: 10, bridgette: 8 }, toast: 'ANDRE IS REGISTERED. SO IS HALF HIS PROGRAM.' };
      if (r === 'ok') return { solidarity: 190, power: 1, trust: { downtown: 10 } };
      return { solidarity: 70, trust: { downtown: 3 } };
    },
    failText: 'The fair opened without you. The folding table went home with somebody\'s uncle. Andre\'s still in. Set it up again.',
    onFail: () => { delete state.d.flags.at_lm_tenanthall; },
    next: 'pbudget',
  },

  npcs: [
    {
      id: 'andre', name: 'Andre', short: 'Andre', title: 'Just Home', district: 'downtown', spot: 'lm_courthouse', offset: { dx: 48, dy: 0 }, color: '#ffa64d',
      look: { skin: '#7a4a30', hair: '#111', style: 'cap', hatColor: '#2b3a6b', shirt: '#e8e2d4', pants: '#3a4a6b', shoes: '#f2f2f2', acc: 'tote' },
      bio: 'Home three weeks after six years. Has a job interview Tuesday, a parole check-in every other Thursday, and a daughter voting for the first time.',
      idle: ['The MetroCard machine talks now. It\'s rude.', 'Six years. Everybody\'s phone got bigger.', 'Tuesday interview. Wish me luck.'],
    },
  ],

  dialogue: {
    bridgette: {
      entries: [
        { cond: { missionStatus: { id: 'reentry', is: 'available' } }, node: 're_start' },
        { cond: S('reentry', 0), node: 're_intro' },
        { cond: S('reentry', [1, 2, 3]), node: 're_wait' },
      ],
      nodes: {
        re_start: { speaker: 'bridgette', text: 'Perfect timing. I have a clipboard, a problem and a councilmember.', choices: [{ text: 'Which one first?', next: 're_intro', effects: { startMission: 'reentry' } }] },
        re_intro: { speaker: 'bridgette', text: 'Gary booked a "Second Chances" photo op. Podium, banner, his good tie. Guess how many people coming home from prison he invited.', next: 're_intro2' },
        re_intro2: {
          speaker: 'bridgette', text: 'Zero. Meanwhile Andre, home three weeks, is outside the Hall of Mild Justice. Somebody told him people on parole can\'t vote.',
          choices: [
            { text: 'Wasn\'t that the rule?', next: 're_intro3' },
            { text: 'Who told him that?', next: 're_who' },
          ],
        },
        re_who: { speaker: 'bridgette', text: 'A guy at a barbecue. It\'s always a guy at a barbecue. Bad civic info travels at the speed of potato salad.', next: 're_intro3' },
        re_intro3: {
          speaker: 'bridgette', text: 'It WAS the rule. Then the law changed. Go talk to Andre. Listen first. Then tell him what\'s true. Take these.',
          choices: [{ text: '(Take 6 voter registration flyers.)', next: 're_flyer', effects: { items: { flyers: 6 }, flags: { reentry_accepted: true, reentry_andre: false, reentry_vote: false, reentry_reg: false, reentry_mic: false, reentry_done: false, at_lm_tenanthall: false } } }],
        },
        // Teach before Andre and Gary test it
        re_flyer: { speaker: 'bridgette', text: 'Front of the flyer. Since 2021, in New York, your right to vote comes back the day you\'re released from prison. On parole too. But you have to re-register.', next: 're_flyer2' },
        re_flyer2: { speaker: 'bridgette', text: 'Register online, by mail, or in person at the county Board of Elections. The form has to be RECEIVED at least 10 days before the election. Received, not mailed.', next: 're_flyer3' },
        re_flyer3: { speaker: 'bridgette', text: 'Back of the flyer: Clean Slate. Records get sealed on a clock. Misdemeanors 3 years after sentence or release, whichever is later. Most felonies, 8. Not while on parole, and a new conviction restarts it.', next: 're_flyer4' },
        re_flyer4: { speaker: 'bridgette', text: 'Courts have until November 2027 to make the sealing automatic. And one more thing: nobody speaks for Andre. You ask him what he wants. Every time.' },
        re_wait: { speaker: 'bridgette', text: 'Andre, then the table at Tenants United Hall, then Gary\'s podium. Flyers to anybody who looks like they\'ve been told no [SPACE].' },
      },
    },

    andre: {
      entries: [
        { cond: S('reentry', 1), node: 're_andre' },
        { cond: S('reentry', [2, 3]), node: 're_andre_wait' },
        { cond: DONE('reentry'), node: 're_andre_after' },
        { node: 're_andre_idle' },
      ],
      nodes: {
        re_andre_idle: { speaker: 'andre', text: 'Six years. The MetroCard machine talks now. It\'s rude.' },
        re_andre: { speaker: 'andre', text: 'You\'re Bridgette\'s friend? I\'m Andre. Home three weeks. Job interview Tuesday, parole officer every other Thursday.', next: 're_andre2' },
        re_andre2: {
          speaker: 'andre', text: 'Real question. My daughter votes for the first time this year. I wanted to go with her. But I\'m on parole. So that\'s a no, right?',
          choices: [
            { text: 'It\'s a yes. Your vote came back when you walked out, parole and all. You do have to re-register first.', next: 're_a_yes', effects: { flags: { reentry_vote: true } } },
            { text: 'Not yet. Since 2021 your vote comes back when parole ends. Then you re-register.', next: 're_a_slip' },
            { text: 'It\'s a yes, and you\'re set. Your registration from before prison still counts, parole and all.', next: 're_a_gary' },
            { text: 'It\'s a yes, once a judge signs a certificate restoring your rights. Then you re-register.', next: 're_a_judge' },
          ],
        },
        re_a_yes: { speaker: 'andre', text: '...Nobody told me that. Maybe they did on the way out. I was busy looking at the sky. So how do I re-register?', next: 're_q2' },
        re_a_slip: { speaker: 'andre', text: 'So I wait two more years? ...Hold on, Bridgette just texted: "NOT AFTER PAROLE. THE DAY YOU\'RE RELEASED. RE-REGISTER. -B." All caps. So how do I do that?', next: 're_q2' },
        re_a_gary: { speaker: 'andre', text: 'My registration from six years ago? ...Bridgette just texted: "ON PAROLE = YOU CAN VOTE. BUT YOU HAVE TO RE-REGISTER." She types fast. So how do I do that?', next: 're_q2' },
        re_a_judge: { speaker: 'andre', text: 'Another judge? I just got away from judges. ...Bridgette texted: "NO JUDGE. NO CERTIFICATE. ON PAROLE = YOU CAN VOTE. RE-REGISTER." So how do I do that?', next: 're_q2' },
        re_q2: {
          speaker: 'andre', text: 'Is there, like, a line? A form? A guy?',
          choices: [
            { text: 'A form. Online, by mail, or in person at the Board of Elections. It has to get there 10 days before the election.', next: 're_reg', effects: { flags: { reentry_reg: true } } },
            { text: 'A form. Online, by mail, or in person at the Board of Elections. Mail it by Election Day and you\'re good.', next: 're_reg_fax' },
            { text: 'A line. Since you\'re on parole, it has to be in person at the Board of Elections, 10 days before the election.', next: 're_reg_gary' },
          ],
        },
        re_reg: { speaker: 'andre', text: 'Ten days early. I can do ten days. I did six years.', next: 're_andre_end' },
        re_reg_fax: { speaker: 'andre', text: 'Mail it on the way to vote? Bold. ...The flyer says it has to ARRIVE at least ten days before. Online, mail or in person. I\'ll trust the flyer.', next: 're_andre_end' },
        re_reg_gary: { speaker: 'andre', text: 'In person, because of parole? I spent six years in lines. ...The flyer says online, by mail OR in person. Same rules as everybody. I\'ll trust the flyer.', next: 're_andre_end' },
        re_andre_end: {
          speaker: 'andre', text: 'Bridgette said there\'s a reentry fair at Tenants United Hall. Couple guys from my program want to register too. Meet you there?',
          choices: [{ text: '(Go set up the table.)', effects: { flags: { reentry_andre: true }, rel: { andre: 6 } } }],
        },
        re_andre_wait: { speaker: 'andre', text: 'Registered. I\'m telling everybody. The guy at the barbecue is getting an earful.' },
        re_andre_after: { speaker: 'andre', text: 'Interview went good. Got a callback. And my daughter and I picked our polling place. She says I\'m "too excited." I am.' },
      },
    },

    gary: {
      entries: [
        { cond: S('reentry', [0, 1, 2]), node: 're_gary_wait' },
        { cond: S('reentry', 3), node: 're_g0' },
      ],
      nodes: {
        re_gary_wait: { speaker: 'gary', text: 'Second Chances Day! I\'ve got a podium, a banner and a fresh haircut. The people are TBD.' },
        re_g0: { speaker: 'gary', text: 'Welcome to Second Chances Day! I believe everyone deserves a second chance. Within reason. Photographer, are we rolling?', next: 're_g1' },
        re_g1: {
          speaker: 'gary', text: 'Quick fact for the cameras: folks on parole should wait until parole\'s over to vote. Right? It\'s on my mailer.',
          choices: [
            { text: '"Wrong mailer, Gary. The vote comes back the day you walk out, parole included. Andre re-registered this morning."', next: 're_g1_yes', effects: { flags: { reentry_g1: true } } },
            { text: '"Close, Gary. Parole\'s fine now, but only for local races like yours. President has to wait till parole ends."', next: 're_g1_no', effects: { flags: { reentry_g1: false } } },
            { text: '"Close, Gary. Parole\'s fine now, and nobody has to do a thing. Old registrations just switch back on."', next: 're_g1_no', effects: { flags: { reentry_g1: false } } },
          ],
        },
        re_g1_yes: { speaker: 'gary', text: 'Oh. OH. Somebody pulp the mailers. Recycle them into a second-chance mailer.', next: 're_g2' },
        re_g1_no: { speaker: 'andre', text: 'Actually, Councilmember: since 2021 it comes back the day you\'re released. Every election. You re-register. I did, this morning. On parole.', next: 're_g1_yes' },
        re_g2: {
          speaker: 'gary', text: 'And my big announcement: thanks to the Clean Slate Act, everybody\'s record gets erased! Instantly! Today! You\'re welcome!',
          choices: [
            { text: '"Not instantly. Misdemeanors seal 3 years after sentence or release, most felonies 8. Courts have until Nov 2027 to automate it."', next: 're_g2_yes', effects: { flags: { reentry_g2: true } } },
            { text: '"Not instantly. Misdemeanors seal 3 years after the arrest, most felonies 8. Courts have until Nov 2027 to automate it."', next: 're_g2_no', effects: { flags: { reentry_g2: false } } },
            { text: '"Not instantly. Misdemeanors and most felonies both seal 3 years after release, if there\'s no new conviction."', next: 're_g2_no', effects: { flags: { reentry_g2: false } } },
            { text: '"Not instantly. Most felonies seal after 8 years, misdemeanors 3, even while someone\'s still on parole."', next: 're_g2_no', effects: { flags: { reentry_g2: false } } },
          ],
        },
        re_g2_yes: { speaker: 'gary', text: 'That\'s... a lot more specific than my speech. Can you just hold the podium for a second?', next: 're_g3' },
        re_g2_no: { speaker: 'bridgette', text: '*From the crowd, with clipboard, like a game show buzzer:* Close! Misdemeanors 3 years after sentence or release, most felonies 8. Not while on parole. Automatic by November 2027.', next: 're_g3' },
        re_g3: {
          speaker: 'you', text: '*Gary\'s photographer lines up the shot: Gary, the banner, and Andre as a nice background.*',
          choices: [
            { text: 'Ask Andre if he wants the mic. If he does, hand it over.', next: 're_g3_mic', effects: { flags: { reentry_mic: true } } },
            { text: 'Take the mic and tell Andre\'s story for him, so he doesn\'t have to relive it on camera.', next: 're_g3_no', effects: { flags: { reentry_mic: false } } },
            { text: 'Ask Gary to tell Andre\'s story in his speech. More people listen to a councilmember.', next: 're_g3_no', effects: { flags: { reentry_mic: false } } },
          ],
        },
        re_g3_no: { speaker: 'andre', text: '*Andre leans over, kind about it.* Appreciate you. Next time ask me first. Six years of people talking about me. I\'d like a turn.', next: 're_tally' },
        re_g3_mic: { speaker: 'andre', text: 'I\'m Andre. I\'m home. I\'m registered. My daughter and I are voting together. And there\'s a table across the street for anybody else who got told no.', next: 're_tally' },
        // Tally: Andre's two answers + Gary's two corrections + the mic (score 0–5)
        re_tally: { speaker: 'you', text: '*The crowd is bigger than the banner now. Half of them are holding Bridgette\'s flyers.*', effects: { flags: { reentry_score: 0 } }, next: 're_t1' },
        re_t1: { speaker: 'you', text: '*Andre waves his registration receipt at the cameras.*', choices: [{ text: '(Wave back.)', cond: { flag: 'reentry_vote' }, next: 're_t2', effects: { inc: { reentry_score: 1 } } }, { text: '(Wave back.)', cond: { notFlag: 'reentry_vote' }, next: 're_t2' }] },
        re_t2: { speaker: 'you', text: '*Two guys from Andre\'s program fill out forms on the hood of a car.*', choices: [{ text: '(Hold the clipboard.)', cond: { flag: 'reentry_reg' }, next: 're_t3', effects: { inc: { reentry_score: 1 } } }, { text: '(Hold the clipboard.)', cond: { notFlag: 'reentry_reg' }, next: 're_t3' }] },
        re_t3: { speaker: 'you', text: '*Gary\'s staffer quietly drops a box of mailers into recycling.*', choices: [{ text: '(Nod.)', cond: { flag: 'reentry_g1' }, next: 're_t4', effects: { inc: { reentry_score: 1 } } }, { text: '(Nod.)', cond: { notFlag: 'reentry_g1' }, next: 're_t4' }] },
        re_t4: { speaker: 'you', text: '*A reporter is writing down the Clean Slate dates.*', choices: [{ text: '(Spell "November" for her.)', cond: { flag: 'reentry_g2' }, next: 're_t5', effects: { inc: { reentry_score: 1 } } }, { text: '(Spell "November" for her.)', cond: { notFlag: 'reentry_g2' }, next: 're_t5' }] },
        re_t5: { speaker: 'you', text: '*Gary steps back to the podium.*', choices: [{ text: '(Listen.)', cond: { flag: 'reentry_mic' }, next: 're_end', effects: { inc: { reentry_score: 1 } } }, { text: '(Listen.)', cond: { notFlag: 'reentry_mic' }, next: 're_end' }] },
        re_end: {
          speaker: 'gary', text: 'Well. This is a lot more second chances than I planned for.',
          choices: [
            { text: '(Wait for it.)', cond: { flagMin: { reentry_score: 4 } }, next: 're_good' },
            { text: '(Wait for it.)', cond: { flagMin: { reentry_score: 2 }, flagMax: { reentry_score: 3 } }, next: 're_ok' },
            { text: '(Wait for it.)', cond: { flagMax: { reentry_score: 1 } }, next: 're_weak' },
          ],
        },
        re_good: { speaker: 'gary', text: 'On camera: a voter registration and Clean Slate table at every reentry program in my district. Andre runs the first one. Paid.', choices: [{ text: '(Andre shakes on it. Twice.)', effects: { flags: { reentry_result: 'good', reentry_done: true }, rel: { gary: 3, andre: 6 } } }] },
        re_ok: { speaker: 'gary', text: 'Beautiful event. Very moving. I will... look into a table. Photographer, did you get Andre\'s good side? He has two.', choices: [{ text: '(It\'s a start. Keep the clipboard.)', effects: { flags: { reentry_result: 'ok', reentry_done: true } } }] },
        re_weak: { speaker: 'gary', text: 'Thanks, everybody! Second chances! Please take a laminated proclamation on your way out.', choices: [{ text: '(Take one. Register someone anyway.)', effects: { flags: { reentry_result: 'weak', reentry_done: true } } }] },
      },
    },
  },
};
