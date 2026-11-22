/**
 * Mission 13 · THE BLOCK PARTY (Coney Island, giver: Emily, with Jon). The finale.
 * Need: building community. Everybody you organized with, in one street, with cake.
 *
 * Facts used (checked Nov 21 2026):
 * - A block party is a community-sponsored event with no sale of goods or services, closing a single block for a
 *   single day; apply online (E-Apply) at least 60 days ahead; non-refundable $25 processing fee.
 *   https://www.nyc.gov/site/cecm/permitting/permit-types.page
 * - The Street Activity Permit Office (SAPO) sends each application to the local community board for review and
 *   comment; 2026 rules list the block party fee as "$25 processing fee only".
 *   https://www.nyc.gov/assets/cecm/downloads/pdf/newyorkcity-sapo-rules-2026.pdf
 * - Community boards set their own sign-on rules, e.g. Brooklyn CB9 asks for signatures from at least 20 residents of
 *   the block. https://www.nyc.gov/site/brooklyncb9/resources/block-parties-and-street-activities.page
 * - BRIC runs Brooklyn Free Speech, Brooklyn's public access TV. Brooklyn residents who finish a certification course
 *   become Certified Community Producers and can use the media center's studios, equipment and edit suites at no cost.
 *   https://bricartsmedia.org/tv-films-podcasts/brooklyn-free-speech-tv/brooklyn-free-speech-faqs/
 * Not used: exact party hours, and the amplified-sound permit fee (varies by source).
 */
import { state } from '../../core/state';
import type { Effect } from '../../core/types';
import type { MissionModule } from './types';

const f = (k: string) => !!state.flag(k);
const S = (is: number | number[]) => ({ missionStage: { id: 'blockparty', is } });
const DONE = { missionStatus: { id: 'blockparty', is: 'complete' as const } };
const INVITE = S([1, 2, 3]);
const mv = (k: string) => (state.d.activeMission === 'blockparty' ? (state.mission('blockparty').vars[k] ?? 0) : 0);

/** Everyone who got you here. */
export const PARTY_GUESTS = ['dee', 'hattie', 'nell', 'bridgette', 'jenna', 'naim', 'vega', 'luco', 'adrian', 'danae', 'deroy', 'juni'];
const guestsIn = () => PARTY_GUESTS.filter((g) => f(`blockparty_guest_${g}`)).length;
const SETUP: [string, string][] = [['lm_mermaid', 'Mermaid Workshop (decorations)'], ['lm_hotdog', 'Hot Dog Hall (the grill)'], ['lm_coneyhouses', 'Surfside Towers (folding tables)']];

/** Guest invitation lines: [npc, line, reply, toast name] */
const LINES: [string, string, string, string][] = [
  ['dee', 'A party? I\'m bringing the fridge. Not food from the fridge. The FRIDGE. On a dolly. It\'s my plus-one.', 'The fridge is family.', 'DEE'],
  ['hattie', 'I\'ll come if there\'s a chair in the shade with my name on it. Literally on it, baby. Write it in marker.', 'Chair. Shade. Your name.', 'MS. HATTIE'],
  ['nell', 'The whole tenants association is coming. Forty members, thirty-nine potato salads. One of them is a lawyer about it.', 'Bring the lawyer.', 'NELL'],
  ['bridgette', 'I\'ll bring the voter registration table. It\'s a party. Parties have tables. Mine has clipboards.', 'Table by the cake.', 'BRIDGETTE'],
  ['jenna', 'I\'ll put the snacks at the far end of the block so everybody has to walk past everybody. Facilitation is mostly furniture.', 'Snacks as strategy.', 'JENNA'],
  ['naim', 'Is the street step-free? Ramps at the curb? ...You checked? Okay, I\'m in. I\'m bringing a lemon tart and a strong opinion.', 'Both welcome.', 'NAIM'],
  ['vega', 'The street IS a dance floor. I\'m choreographing the whole block. Even Gary. ESPECIALLY Gary.', 'Choreograph us.', 'VEGA'],
  ['luco', 'I\'ll run a three-on-three tournament. Every team named after a cake. I already booked the cones. Entry is free, obviously.', 'Team Red Velvet.', 'LUCO'],
  ['adrian', 'One block. No cars. Chalk, cones, a whistle. This is my Super Bowl. I\'ve been training my whole life.', 'Whistle ready.', 'ADRIAN'],
  ['danae', 'I\'m bringing the twelve kids from the museum trip. They made art about it. We\'re hanging a gallery on the fence.', 'Gallery on the fence.', 'DANAE'],
  ['deroy', 'I\'ll make the poster. Big words. What, when, where. In the bodega window, with permission. One person, one stake, one cake.', 'One cake.', 'DEROY'],
  ['juni', 'Bread for everybody. A block party is just a general strike with a DJ. Don\'t tell Dee I said that. Tell Dee I said that.', 'Telling Dee.', 'JUNI'],
];

const guestDialogue = Object.fromEntries(LINES.map(([id, line, reply, name]) => [id, {
  entries: [{ cond: { ...INVITE, notFlag: `blockparty_guest_${id}` }, node: 'blockparty_invite' }, { cond: { ...INVITE, flag: `blockparty_guest_${id}` }, node: 'blockparty_coming' }],
  nodes: {
    blockparty_invite: {
      speaker: id, text: line,
      choices: [{ text: reply, effects: { rel: { [id]: 4 }, flags: { [`blockparty_guest_${id}`]: true }, inc: { blockparty_guests: 1 }, toast: `${name} IS COMING` } }],
    },
    blockparty_coming: { speaker: id, text: 'I\'m coming, I\'m coming. Go invite somebody who hasn\'t been asked yet.' },
  },
}]));

export const blockparty: MissionModule = {
  mission: {
    id: 'blockparty', number: 13, title: 'THE BLOCK PARTY', district: 'coneyisland', giver: 'emily',
    tagline: 'One block. One day. No cars. Everybody you ever organized with, and a cake in the middle like a monument.',
    stages: [
      { text: () => 'Meet Emily on the Coney Island boardwalk', targets: () => ['emily'], done: () => f('blockparty_accepted') },
      {
        text: () => `Invite the people who got you here (${Math.min(guestsIn(), 4)}/4)`,
        targets: () => PARTY_GUESTS.filter((g) => !f(`blockparty_guest_${g}`)),
        done: () => guestsIn() >= 4,
      },
      { text: () => `Get Jon at Studio 9000 to put the party on TV · guests ${guestsIn()} (keep inviting)`, targets: () => ['jon'], done: () => f('blockparty_jon') },
      {
        text: () => {
          const left = SETUP.filter(([s]) => !f(`at_${s}`));
          return `Set up before noon (${3 - left.length}/3): ${left.map(([, n]) => n).join(' · ')}`;
        },
        targets: () => SETUP.filter(([s]) => !f(`at_${s}`)).map(([s]) => `spot:${s}`),
        done: () => SETUP.every(([s]) => f(`at_${s}`)),
        timer: 240, // from Jon in Bushwick down to Coney Island
      },
      { text: () => 'The street is full. Find Emily and cut the cake', targets: () => ['emily'], done: () => f('blockparty_done') },
    ],
    optional: [
      { id: 'guests', text: 'Invite eight of your people', done: () => guestsIn() >= 8, reward: { solidarity: 80, power: 1 } },
      { id: 'surfside', text: 'Bring Ms. Inez and Abe from Surfside Towers', done: () => f('blockparty_inez') && f('blockparty_abe'), reward: { solidarity: 50, trust: { coneyisland: 6 } } },
      { id: 'flyers', text: 'Hand out 10 party flyers', done: () => mv('flyers') >= 10, reward: { solidarity: 50, attention: 5, trust: { coneyisland: 4 } } },
    ],
    rewards: (): Effect => {
      const r = state.flag('blockparty_result');
      if (r === 'good') return { solidarity: 700, power: 5, attention: 15, trust: { coneyisland: 25, bedstuy: 5, parkslope: 5, crownheights: 5, plg: 5, downtown: 5, bushwick: 5 }, rel: { emily: 10, jon: 10 }, toast: 'THE BLOCK IS THE PARTY' };
      if (r === 'ok') return { solidarity: 350, power: 2, attention: 8, trust: { coneyisland: 12 }, rel: { emily: 5, jon: 5 }, toast: 'A GOOD PARTY. NEXT YEAR, A GREAT ONE.' };
      return { solidarity: 150, trust: { coneyisland: 5 } };
    },
    failText: 'Noon came and the tables didn\'t. Emily is holding a five-tier cake in direct sunlight. It\'s fine. It\'s FINE. Your guests are still coming. Set up again.',
    // Guests, the permit and Jon's show survive a failed setup; only the setup errands restart
    onFail: () => { for (const [s] of SETUP) delete state.d.flags[`at_${s}`]; },
    next: 'fares',
  },

  dialogue: {
    ...guestDialogue,

    // ============================================================ EMILY
    emily: {
      entries: [
        { cond: S(0), node: 'blockparty_0' },
        { cond: S([1, 2, 3]), node: 'blockparty_wait' },
        { cond: S(4), node: 'blockparty_f0' },
        { cond: DONE, node: 'blockparty_after' },
      ],
      nodes: {
        blockparty_0: {
          speaker: 'emily', text: 'The fridge. The circle. The march. Library cards. Abe. You know what all of that deserves? Cake. In the street. With everybody.',
          effects: { flags: { blockparty_score: 0, at_lm_mermaid: false, at_lm_hotdog: false, at_lm_coneyhouses: false } }, next: 'blockparty_1',
        },
        blockparty_1: {
          speaker: 'emily', text: 'Before cake: paperwork. The street belongs to the city. How do we get it for a day?',
          choices: [
            { text: 'Apply online to the city\'s Street Activity Permit Office, 60+ days ahead. $25. The block signs on and the community board reviews it.', next: 'blockparty_right', effects: { inc: { blockparty_score: 1 }, rel: { emily: 3 } } },
            { text: 'Put out cones and act confident.', next: 'blockparty_cones' },
            { text: 'Ask Tyler to "activate" the street.', next: 'blockparty_tyler' },
          ],
        },
        blockparty_cones: { speaker: 'emily', text: 'Confidence is not a permit. The Free Parking Caucus has a whole binder about cones. It\'s laminated.', next: 'blockparty_right' },
        blockparty_tyler: { speaker: 'emily', text: 'He\'d sell tickets. A block party can\'t sell anything. That\'s the whole point: free, and open to every neighbor on the block.', next: 'blockparty_right' },
        blockparty_right: { speaker: 'emily', text: 'Apply online at least 60 days out. $25. Your neighbors sign on, the community board weighs in. One block, one day, nothing for sale.', next: 'blockparty_skip' },
        blockparty_skip: { speaker: 'you', text: '*Sixty days pass. Emily bakes eleven test cakes. The permit arrives. It is the most beautiful document you have ever held.*', next: 'blockparty_go' },
        blockparty_go: {
          speaker: 'emily', text: 'Now, guests. A party is only as good as who you call. Go get the people who got you here. And take flyers for the whole neighborhood.',
          choices: [{ text: 'Calling everybody.', effects: { flags: { blockparty_accepted: true }, items: { flyers: 12 }, toast: 'PERMIT APPROVED' } }],
        },
        blockparty_wait: { speaker: 'emily', text: 'Test cake number twelve. It\'s the boardwalk, in fondant, with a tiny community fridge on top. Go. Invite. Set up. I\'m piping.' },
        blockparty_f0: { speaker: 'you', text: '*The street fills. Kids chalk the asphalt. Somebody\'s grandmother claims the only shade. Jon\'s camera light blinks on. Then: three red caps and a clipboard.*', next: 'blockparty_f1' },
        blockparty_f1: {
          speaker: 'Free Parking Caucus', text: 'Excuse me. This is a STREET. Streets are for PARKING. Where is the Caucus supposed to put the Buick?',
          choices: [
            { text: 'Show them the permit. City-approved, community board reviewed, today only. Neptune Ave has spots.', next: 'blockparty_permit', effects: { inc: { blockparty_score: 1 } } },
            { text: 'Out-dance them.', next: 'blockparty_dance' },
            { text: 'Call Gary.', next: 'blockparty_gary' },
          ],
        },
        blockparty_permit: { speaker: 'Free Parking Caucus', text: '...This is a valid permit. Fine. We\'ll be filing a complaint. With ourselves. At our next meeting. Is that lemon tart?', next: 'blockparty_f2' },
        blockparty_dance: { speaker: 'you', text: '*The kids invent a dance called "Get Out of Our Street." The Caucus does not leave. One of them is learning the moves.*', next: 'blockparty_f2' },
        blockparty_gary: { speaker: 'gary', text: '*Gary arrives in nine minutes, takes a photo with the Buick, says "I hear both sides," and leaves with a plate.*', next: 'blockparty_f2' },
        blockparty_f2: {
          speaker: 'emily', text: '*Emily wheels out the cake: five tiers, the boardwalk in fondant, a tiny fridge on top.* Somebody has to give the toast. It\'s you. Obviously.',
          choices: [
            { text: 'Name everybody. Every single person on this street who showed up.', next: 'blockparty_names', effects: { inc: { blockparty_score: 1 } } },
            { text: 'Thank the sponsors.', next: 'blockparty_spons' },
            { text: 'Read the permit out loud.', next: 'blockparty_read' },
          ],
        },
        blockparty_names: { speaker: 'you', text: '*You name every person who showed up, one by one. It takes a while. Nobody minds. Somebody yells "don\'t make it weird." You make it a little weird.*', next: 'blockparty_res' },
        blockparty_spons: { speaker: 'you', text: '*There are no sponsors. That\'s the point. Tyler waves from across the street holding a sign that says "Proud Sponsor (Spiritually)."*', next: 'blockparty_res' },
        blockparty_read: { speaker: 'you', text: '*By clause four, Ms. Hattie is asleep in her chair. By clause six, so is Gary. You skip to the part where everybody eats.*', next: 'blockparty_res' },
        blockparty_res: {
          speaker: 'emily', text: 'Okay. Knife. Go.',
          choices: [
            { text: '(Cut the cake. The whole block cheers.)', cond: { flagMin: { blockparty_score: 3, blockparty_guests: 5 } }, tag: 'BEST', effects: { flags: { blockparty_result: 'good', blockparty_done: true } } },
            { text: '(Cut the cake. A good cheer.)', cond: { any: [{ flagMin: { blockparty_score: 2 }, flagMax: { blockparty_score: 2 } }, { flagMin: { blockparty_score: 3 }, flagMax: { blockparty_guests: 4 } }] }, effects: { flags: { blockparty_result: 'ok', blockparty_done: true } } },
            { text: '(Cut the cake. Polite applause.)', cond: { flagMax: { blockparty_score: 1 } }, effects: { flags: { blockparty_result: 'weak', blockparty_done: true } } },
          ],
        },
        blockparty_after: { speaker: 'emily', text: 'Same block, next year? I\'m already sketching the cake. It\'s the whole borough. In fondant. With a permit on top.' },
      },
    },

    // ============================================================ JON · BRIC public access
    jon: {
      entries: [{ cond: S(2), node: 'blockparty_j0' }],
      nodes: {
        blockparty_j0: { speaker: 'jon', text: 'A block party nobody filmed is a rumor. A block party on TV is history. Where does it air?', next: 'blockparty_j1' },
        blockparty_j1: {
          speaker: 'jon', text: 'Pick one.',
          choices: [
            { text: 'Public access. Take a BRIC certification course, borrow the cameras free, and air it on Brooklyn Free Speech.', next: 'blockparty_jright', effects: { inc: { blockparty_score: 1 }, rel: { jon: 3 } } },
            { text: 'Skye livestreams it.', next: 'blockparty_jskye' },
            { text: 'Sell it to a streamer.', next: 'blockparty_jstream' },
          ],
        },
        blockparty_jskye: { speaker: 'jon', text: 'Skye\'s stream ends with a detox tea ad. Public access ends with your block. Public.', next: 'blockparty_jright' },
        blockparty_jstream: { speaker: 'jon', text: 'They\'d cut it into a true-crime doc called "Party." Eight episodes. Nobody eats cake until episode seven. No.', next: 'blockparty_jright' },
        blockparty_jright: {
          speaker: 'jon', text: 'BRIC runs Brooklyn Free Speech, the borough\'s public access TV. Live in Brooklyn, finish a certification course, and the cameras and studios are free to use. I\'ll cut it.',
          choices: [{ text: 'Roll camera.', effects: { flags: { blockparty_jon: true }, attention: 6, toast: 'POCKET CIVICS · BLOCK PARTIES + PUBLIC ACCESS TV' } }],
        },
      },
    },

    // ============================================================ SURFSIDE TOWERS (from Mission 12)
    inez: {
      entries: [{ cond: { ...INVITE, notFlag: 'blockparty_inez' }, node: 'blockparty_inv' }],
      nodes: {
        blockparty_inv: {
          speaker: 'inez', text: 'A party? I\'ll bring the folding tables and the buddy list. Everyone on it gets a personal invitation. By phone. Twice.',
          choices: [{ text: 'Twice is the rule.', effects: { flags: { blockparty_inez: true }, rel: { inez: 4 }, toast: 'MS. INEZ IS COMING' } }],
        },
      },
    },
    abe: {
      entries: [{ cond: { ...INVITE, notFlag: 'blockparty_abe' }, node: 'blockparty_inv' }],
      nodes: {
        blockparty_inv: {
          speaker: 'abe', text: 'A party in the street? I\'ll come. In the shade. With water. Inez made me promise. I\'m keeping it.',
          choices: [{ text: 'Front-row shade for Abe.', effects: { flags: { blockparty_abe: true }, rel: { abe: 4 }, toast: 'ABE IS COMING' } }],
        },
      },
    },
  },
};
