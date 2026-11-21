import { state } from '../../core/state';
import type { MissionModule } from './types';

/**
 * Mission 5 · THE COMMUNITY BOARD FROM HELL (Downtown → Sunset Park). Giver: Tyler. Vega preps your testimony.
 *
 * Civic facts used (checked Nov 21 2026):
 * - Members of the public can sign up to testify at City Council hearings via Zoom (web or phone) or in person;
 *   in-person hearings don't require pre-registration; written testimony can be submitted up to 72 hours after the
 *   hearing is adjourned. Source: https://council.nyc.gov/testify/
 * - ULURP order: Community Board review → Borough President review → City Planning Commission review → City Council
 *   review → Mayoral review. Within 60 days the Community Board must hold a public hearing and submit a written
 *   recommendation (the board and Borough President recommend; the City Planning Commission and the Council vote).
 *   Sources: NYC Manhattan CB10 ULURP explainer https://www.nyc.gov/html/mancb10/downloads/pdf/ulurp_info.pdf ·
 *   Brooklyn CB9 https://www.nyc.gov/site/brooklyncb9/resources/uniform-land-use-review-procedure-ulurp.page
 * Fiction, not fact: Gary "chairing" the hearing, the project and every number Tyler says.
 */

const f = (k: string) => !!state.flag(k);
const S = (id: string, is: number | number[]) => ({ missionStage: { id, is } });
const flyers = () => (state.d.activeMission === 'board' ? (state.mission('board').vars.flyers ?? 0) : 0);

export const board: MissionModule = {
  mission: {
    id: 'board', number: 5, title: 'THE COMMUNITY BOARD FROM HELL', district: 'downtown', giver: 'tyler',
    tagline: 'Tyler wants 400 luxury units. The community board meets at 7. Skye is livestreaming. Godspeed.',
    stages: [
      { text: () => 'Hear Tyler\'s pitch at Luxe Lofts', targets: () => ['tyler'], done: () => f('board_accepted') },
      { text: () => 'Get a game plan from Vega at the Gallery Without Walls', targets: () => ['vega'], done: () => f('board_prep') },
      {
        text: () => `Get to Community Board 7-ish before 7pm · flyers ${Math.min(flyers(), 6)}/6 [SPACE]`,
        targets: () => ['spot:lm_spcb'], done: () => f('at_lm_spcb'), timer: 210,
      },
      { text: () => 'Skye streamed the board vote. Find her at the Barclays-ish Center', targets: () => ['skye'], done: () => f('board_recap') },
      { text: () => 'Testify at Gary\'s Council hearing at Borough Hall', targets: () => ['gary'], done: () => f('board_done') },
    ],
    optional: [
      { id: 'flyers', text: 'Hand out 6 hearing flyers', done: () => flyers() >= 6, reward: { solidarity: 40, attention: 4, trust: { sunsetpark: 5 } } },
      { id: 'early', text: 'Reach the board with 1:00+ to spare', done: () => f('at_lm_spcb') && (state.mission('board').timeLeft ?? 0) >= 60, reward: { solidarity: 40 } },
      { id: 'mic', text: 'Get a neighbor on Skye\'s stream', done: () => f('board_skye_mic'), reward: { solidarity: 30, attention: 6, rel: { skye: 4 } } },
    ],
    rewards: () => {
      const r = state.flag('board_result');
      if (r === 'good') return { solidarity: 350, power: 3, trust: { downtown: 15, sunsetpark: 15 }, rel: { vega: 6 }, toast: 'LUXE LOFTS SENT BACK TO THE NAPKIN' };
      if (r === 'ok') return { solidarity: 190, power: 1, trust: { sunsetpark: 8 } };
      return { solidarity: 70, trust: { sunsetpark: 3 } };
    },
    failText: '7:01pm. Public session closed. Tyler\'s 90 slides ran unopposed and the board chair fell asleep on slide 12. Get there on time.',
    onFail: () => { delete state.d.flags.at_lm_spcb; },
    next: 'reentry',
  },

  dialogue: {
    tyler: {
      entries: [
        { cond: { missionStatus: { id: 'board', is: 'available' } }, node: 'board_start' },
        { cond: S('board', 0), node: 'board_pitch' },
        { cond: S('board', [1, 2, 3, 4]), node: 'board_wait' },
      ],
      nodes: {
        board_start: { speaker: 'tyler', text: 'Heyyy, my favorite grassroots person! Got a sec? I have news. Huge news. Luxury news.', choices: [{ text: '...What news?', next: 'board_pitch', effects: { startMission: 'board' } }] },
        board_pitch: { speaker: 'tyler', text: 'Luxe Lofts Sunset Park™! 400 units on the waterfront. Six "affordable." If you make $140K and love a view of a parking lot.', next: 'board_pitch2' },
        board_pitch2: {
          speaker: 'tyler', text: 'Community board hears it tonight at 7. Total formality! They just make a recommendation. So don\'t come. Kidding! Unless?',
          choices: [
            { text: 'We\'ll be there. With friends.', next: 'board_pitch3', effects: { rel: { tyler: -2 } } },
            { text: 'Six out of 400, Tyler?', next: 'board_math' },
          ],
        },
        board_math: { speaker: 'tyler', text: 'One and a half percent! Basically a rounding error. Which is also what we call community input.', next: 'board_pitch3' },
        board_pitch3: {
          speaker: 'tyler', text: 'Love the passion! Bring snacks. Seven sharp. No rush. Huge rush. Whatever!',
          choices: [{ text: '(Go find Vega. She knows how to make a room listen.)', effects: { flags: { board_accepted: true, board_prep: false, board_recap: false, board_done: false, board_skye_ok: false, board_skye_mic: false, at_lm_spcb: false } } }],
        },
        board_wait: { speaker: 'tyler', text: 'Still here? The rooftop has a yoga deck AND a meditation deck. They face each other. Synergy.' },
      },
    },

    vega: {
      entries: [
        { cond: S('board', 1), node: 'board_vega' },
        { cond: S('board', [2, 3, 4]), node: 'board_vega_wait' },
      ],
      nodes: {
        board_vega: { speaker: 'vega', text: 'Tyler wants to block the sunset in SUNSET PARK? That should be illegal. Okay. We need a plan. And a dance.', next: 'board_vega2' },
        board_vega2: { speaker: 'vega', text: 'Tonight the community board holds a public hearing and votes on what to recommend. Then it keeps going, all the way to the City Council.', next: 'board_vega3' },
        board_vega3: {
          speaker: 'vega', text: 'And anybody can sign up to testify at the Council. In person, on Zoom, or in writing. You talk right to the people who make the rules.',
          choices: [
            { text: 'Even people who work nights?', next: 'board_vega4' },
            { text: 'Even nine-year-olds?', next: 'board_vega_kid' },
          ],
        },
        board_vega4: { speaker: 'vega', text: 'Yep! You can send written testimony up to three days after the hearing. I\'m writing mine in glitter pen. Then typing it. Then glitter again.', next: 'board_vega5' },
        board_vega_kid: { speaker: 'vega', text: 'It says "members of the public." I\'m the public! I\'m a WHOLE public!', next: 'board_vega5' },
        board_vega5: {
          speaker: 'vega', text: 'Here. Flyers for the hearing. I drew the dance moves on the back. Hand them out [SPACE] and get to the board before seven!',
          choices: [{ text: '(Take 8 flyers. Learn one dance move.)', effects: { items: { flyers: 8 }, flags: { board_prep: true }, rel: { vega: 5 } } }],
        },
        board_vega_wait: { speaker: 'vega', text: 'My mom\'s driving me to the hearing. I\'m bringing my good shoes. The ones that squeak on purpose.' },
      },
    },

    skye: {
      entries: [
        { cond: S('board', [1, 2]), node: 'board_skye_early' },
        { cond: S('board', 3), node: 'board_skye' },
      ],
      nodes: {
        board_skye_early: { speaker: 'skye', text: 'I\'m streaming the community board tonight! Tyler is NOT paying me. He offered. I said "after." Kidding! Mostly.' },
        board_skye: { speaker: 'skye', text: 'BESTIES. The community board voted NO on Luxe Lofts! It\'s OVER. Tyler is canceled. I\'m making a sound effect.', next: 'board_skye2' },
        board_skye2: {
          speaker: 'you', text: '*4,100 watching. The top comment: "so it\'s dead right??"*',
          choices: [
            { text: 'Not yet. The board\'s vote is a recommendation. Next the Borough President weighs in, then City Planning votes, then the City Council.', next: 'board_skye_good', effects: { flags: { board_skye_ok: true } } },
            { text: 'Yes! Dead! Everybody go home!', next: 'board_skye_bad' },
            { text: 'Tyler is canceled. Next question.', next: 'board_skye_bad2' },
          ],
        },
        board_skye_good: {
          speaker: 'skye', text: 'Wait, there\'s a SEQUEL? Chat says "ULURP sounds like a burp." Chat is not wrong. ...Want to put somebody local on?',
          choices: [
            { text: 'Hand the phone to a neighbor who\'s fished off that pier for 30 years.', next: 'board_skye_end', effects: { flags: { board_skye_mic: true }, attention: 6 } },
            { text: 'Just tell chat: sign up to testify at the Council.', next: 'board_skye_end' },
          ],
        },
        board_skye_bad: { speaker: 'skye', text: 'Chat is celebrating! ...Gary just commented: "it goes to the Council, sweetie." Oh. So it\'s NOT over? Plot twist.', next: 'board_skye_end' },
        board_skye_bad2: { speaker: 'skye', text: 'Tyler just commented "see you at City Planning 😘". What\'s City Planning? Is that a club? Is it exclusive?', next: 'board_skye_end' },
        board_skye_end: {
          speaker: 'skye', text: 'Okay. Gary has the Council hearing. I\'m going LIVE. Please be iconic. Or at least not boring.',
          choices: [{ text: '(Head to Borough Hall.)', effects: { flags: { board_recap: true }, rel: { skye: 3 } } }],
        },
      },
    },

    gary: {
      entries: [
        { cond: S('board', [0, 1, 2, 3]), node: 'board_gary_wait' },
        { cond: S('board', 4), node: 'board_h0' },
      ],
      nodes: {
        board_gary_wait: { speaker: 'gary', text: 'Luxe Lofts? I\'m keeping an open mind. Wide open. Air goes right through it.' },
        board_h0: { speaker: 'gary', text: 'Next on the land use agenda: Luxe Lofts Sunset Park. We\'ll hear from the developer, then the public. Mr. Brandt?', effects: { flags: { board_score: 0 } }, next: 'board_h_tyler' },
        board_h_tyler: { speaker: 'tyler', text: 'Thanks, Gary! Quick deck, 90 slides. The community board said no, but that\'s a recommendation, so legally it\'s basically a Yelp review.', next: 'board_h1' },
        board_h1: {
          speaker: 'Sergeant-at-Arms', text: 'Next speaker. You. Are you signed up?',
          choices: [
            { text: 'I signed up to testify. Any member of the public can. Neighbors who work nights are sending written testimony.', next: 'board_h2', effects: { inc: { board_score: 1 } } },
            { text: 'I\'m with the band.', next: 'board_h1b' },
            { text: 'Wait, don\'t I need to be a lawyer?', next: 'board_h1c' },
          ],
        },
        board_h1b: { speaker: 'Sergeant-at-Arms', text: 'There\'s no band. There\'s a stenographer. ...Members of the public can testify. You have two minutes.', next: 'board_h2' },
        board_h1c: { speaker: 'gary', text: 'No! Anybody can sign up. In person, on Zoom, or in writing. Please. My chamber is so empty.', next: 'board_h2' },
        board_h2: {
          speaker: 'you', text: '*The clock starts. Skye\'s ring light clicks on. Vega gives you a thumbs-up from the back, in squeaky shoes.*',
          choices: [
            { text: 'Tell one story: Rosa, 30 years in Sunset Park, fishing off that pier every Sunday. The pier is where the parking lot goes.', next: 'board_h3', effects: { inc: { board_score: 1 } } },
            { text: 'Read the zoning text aloud. All of it.', next: 'board_h2b' },
            { text: 'Perform Vega\'s choreography in total silence.', next: 'board_h2c' },
          ],
        },
        board_h2b: { speaker: 'you', text: '*By the second "notwithstanding," a councilmember is asleep. Impressive posture, honestly. You skip to the end.*', next: 'board_h3' },
        board_h2c: { speaker: 'vega', text: 'IT\'S CALLED EXPRESSION, GARY.', next: 'board_h3' },
        board_h3: {
          speaker: 'you', text: '*Thirty seconds left. One person, one stake. Now the ask.*',
          choices: [
            { text: '"Vote no unless half the units are affordable to people who live here now. On the record."', next: 'board_tally', effects: { inc: { board_score: 1 } } },
            { text: '"Just... better vibes, Gary. Generally."', next: 'board_tally' },
          ],
        },
        board_tally: {
          speaker: 'gary', text: '*Gary looks at the sign-up sheet, then at Skye\'s viewer count, then at his own reflection in the microphone.*',
          choices: [
            { text: '(Wait for Gary.)', cond: { flag: 'board_skye_ok' }, next: 'board_end', effects: { inc: { board_score: 1 } } },
            { text: '(Wait for Gary.)', cond: { notFlag: 'board_skye_ok' }, next: 'board_end' },
          ],
        },
        board_end: {
          speaker: 'gary', text: 'Thank you. I have... heard a lot of testimony. And seen a lot of livestream hearts.',
          choices: [
            { text: '(Listen.)', cond: { flagMin: { board_score: 3 } }, next: 'board_good' },
            { text: '(Listen.)', cond: { flagMin: { board_score: 2 }, flagMax: { board_score: 2 } }, next: 'board_ok' },
            { text: '(Listen.)', cond: { flagMax: { board_score: 1 } }, next: 'board_weak' },
          ],
        },
        board_good: { speaker: 'gary', text: 'I\'m a no unless half those units are actually affordable. On the record. And Tyler? The pier stays a pier.', choices: [{ text: '(The back row does Vega\'s dance.)', effects: { flags: { board_result: 'good', board_done: true }, rel: { gary: 3, vega: 4 } } }] },
        board_ok: { speaker: 'gary', text: 'I\'ll push for more affordable units. Somewhere between six and half. We\'ll call it "a meaningful number."', choices: [{ text: '(Not a win. A meaningful number.)', effects: { flags: { board_result: 'ok', board_done: true } } }] },
        board_weak: { speaker: 'gary', text: 'Thank you for your testimony. It\'s now part of the record, which is a big binder nobody opens.', choices: [{ text: '(Write it down. Come back next hearing.)', effects: { flags: { board_result: 'weak', board_done: true } } }] },
      },
    },
  },
};
