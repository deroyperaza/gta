import { state } from '../../core/state';
import type { MissionModule } from './types';

/**
 * Mission 4 · RENT IS TOO DAMN HIGH (PLG). Giver: Nell. Juni's collective builds the installation.
 *
 * Civic facts used (checked Nov 21 2026):
 * - NYC Right to Counsel (Local Law 136 of 2017): free lawyers for tenants facing eviction in Housing Court whose
 *   household income is at or below 200% of the federal poverty level, OR whose household has a member 60 or older.
 *   Source: NYC Independent Budget Office, "What is Right to Counsel?" (Sep 2025)
 *   https://www.ibo.nyc.gov/assets/ibo/downloads/pdf/community-and-social-services/2025/2025-september-what-is-rtc.pdf
 * - Call 311 and ask for the Tenant Helpline; Right to Counsel services are free in every ZIP code.
 *   Source: https://www.nyc.gov/site/hra/help/legal-services-for-tenants.page
 * - Tenants can request their apartment's rent history from NYS Homes and Community Renewal (online, by mail with
 *   form REC-1, or in person at a borough rent office), and can file an overcharge complaint online.
 *   Sources: https://hcr.ny.gov/most-common-rent-regulation-issues-tenants · https://hcr.ny.gov/office-rent-administration-ora
 *   (Left out: "free" — HCR doesn't say so outright; REC-1 lists 25¢/page for paper copies.)
 */

const f = (k: string) => !!state.flag(k);
const S = (id: string, is: number | number[]) => ({ missionStage: { id, is } });
const take = { items: { posters: 4, art: 1 }, rel: { juni: 6 }, trust: { bushwick: 3 }, flags: { rent_art: true } };

export const rent: MissionModule = {
  mission: {
    id: 'rent', number: 5, title: 'RENT IS TOO DAMN HIGH', district: 'plg', giver: 'nell',
    tagline: 'A landlord LLC filed twelve evictions in one morning. Nell needs lawyers on the case and Juni needs a wall.',
    stages: [
      { text: () => 'Meet Nell at the Lefferts Tenants Association', targets: () => ['nell'], done: () => f('rent_accepted') },
      {
        text: () => `Knock doors at The Parkside-ish Arms${f('at_lm_fbtenants') ? '' : ' (bonus: Flatbush Tenants Coalition banner)'}`,
        targets: () => ['spot:lm_plgarms', ...(f('at_lm_fbtenants') ? [] : ['spot:lm_fbtenants'])],
        done: () => f('at_lm_plgarms'),
      },
      { text: () => 'Run the court papers to Free Tenant Lawyers, 2nd Fl, before they close', targets: () => ['spot:lm_plglegal'], done: () => f('at_lm_plglegal'), timer: 120 },
      {
        text: () => 'Plan the rent installation with Juni at the Sourdough Collective',
        targets: () => ['juni', ...(f('at_lm_fbtenants') ? [] : ['spot:lm_fbtenants'])],
        done: () => f('rent_art'),
      },
      { text: () => 'Run the tenant meeting with Nell at the Lefferts Tenants Association', targets: () => ['nell'], done: () => f('rent_done') },
    ],
    optional: [
      { id: 'flyers', text: 'Hand out 5 know-your-rights flyers', done: () => (state.d.activeMission === 'rent' ? (state.mission('rent').vars.flyers ?? 0) : 0) >= 5, reward: { solidarity: 30, attention: 4, trust: { plg: 4 } } },
      { id: 'posters', text: 'Wheatpaste all of Juni\'s posters', done: () => f('rent_art') && state.count('posters') === 0, reward: { solidarity: 40, trust: { plg: 3, bushwick: 3 } } },
      { id: 'banner', text: 'Borrow the Flatbush Tenants Coalition banner', done: () => f('at_lm_fbtenants'), reward: { solidarity: 25, trust: { flatbush: 5 } } },
    ],
    rewards: () => {
      const r = state.flag('rent_result');
      if (r === 'good') return { solidarity: 320, power: 3, trust: { plg: 20, bushwick: 5 }, rel: { nell: 8 }, toast: 'THE PARKSIDE-ISH ARMS TENANTS ASSOCIATION IS BORN' };
      if (r === 'ok') return { solidarity: 170, power: 1, trust: { plg: 10 } };
      return { solidarity: 60, trust: { plg: 3 } };
    },
    failText: 'The 2nd floor closed at 5:00:00 sharp. The court papers spent the night in your tote. Nell has copies. Knock again, run faster.',
    onFail: () => { for (const k of ['at_lm_plgarms', 'at_lm_plglegal']) delete state.d.flags[k]; },
    next: 'board',
  },

  dialogue: {
    nell: {
      entries: [
        { cond: { missionStatus: { id: 'rent', is: 'available' } }, node: 'rent_start' },
        { cond: S('rent', 0), node: 'rent_intro' },
        { cond: S('rent', [1, 2, 3]), node: 'rent_wait' },
        { cond: S('rent', 4), node: 'rent_mtg' },
      ],
      nodes: {
        rent_start: { speaker: 'nell', text: 'You. Good. I need somebody with sneakers and no fear of lobbies.', choices: [{ text: 'What happened?', next: 'rent_intro', effects: { startMission: 'rent' } }] },
        rent_intro: { speaker: 'nell', text: 'The Parkside-ish Arms got a new owner: Blessed Brick Holdings 7 LLC. Twelve eviction cases filed the same morning. Their lawyer called it "a spring clean."', next: 'rent_intro2' },
        rent_intro2: {
          speaker: 'nell', text: 'Half those tenants don\'t know they can get a free lawyer. The other half watched their rent double in a rent-stabilized building. You in?',
          choices: [
            { text: 'Where do I start?', next: 'rent_brief', effects: { rel: { nell: 3 } } },
            { text: 'Can\'t they just... move?', next: 'rent_move' },
          ],
        },
        rent_move: { speaker: 'nell', text: 'To where? Mars has a broker fee too. Nobody\'s moving. We\'re organizing.', next: 'rent_brief' },
        rent_brief: {
          speaker: 'nell', text: 'Knock doors at the Arms and collect everybody\'s court papers. Then run them to Free Tenant Lawyers, 2nd floor, before they close. Then Juni. Juni wants a wall.',
          choices: [{ text: '(Take 6 know-your-rights flyers.)', next: 'rent_rights', effects: { items: { flyers: 6 }, flags: { rent_accepted: true, rent_art: false, rent_art_good: false, rent_done: false, at_lm_plgarms: false, at_lm_plglegal: false, at_lm_fbtenants: false } } }],
        },
        // Teach before the tenant meeting tests it
        rent_rights: { speaker: 'nell', text: 'Read the flyer, because they\'ll ask you. Facing eviction? Call 311, ask for the Tenant Helpline and Right to Counsel. If the household is at or below 200% of the federal poverty line, OR anyone in it is 60 or older: free lawyer.', next: 'rent_rights2' },
        rent_rights2: { speaker: 'nell', text: 'Rent jumped? Ask the state, Homes and Community Renewal, for your apartment\'s rent history. Numbers off? File an overcharge complaint. Juni\'s wall should show those numbers. Numbers yell louder than slogans.', next: 'rent_rights3' },
        rent_rights3: { speaker: 'nell', text: 'And nobody decides for the building. Not me, not Juni, not the loudest guy in the lobby. Big moves get a whole-building vote, with the lawyers in the room.' },
        rent_wait: { speaker: 'nell', text: 'Doors, then the 2nd floor, then Juni. Hand flyers to anybody carrying a rent check [SPACE]. Never go to Housing Court alone.' },

        // ---- The tenant meeting: the facts are the winning moves
        rent_mtg: { speaker: 'nell', text: 'Arms lobby. Folding chairs from the church. Twelve households, one question each, and they want answers from YOU. I\'m just the lawyer.', effects: { flags: { rent_score: 0 } }, next: 'rent_q1' },
        rent_q1: {
          speaker: 'Ms. Odette, 3B', text: 'My court date is Thursday. I\'m a home health aide. My mother lives with me, she\'s 71. I can\'t pay a lawyer. What do I do?',
          choices: [
            { text: 'Your mom being 71 counts. Call 311, ask for the Tenant Helpline and Right to Counsel. You get a free lawyer.', next: 'rent_a1', effects: { inc: { rent_score: 1 } } },
            { text: 'The 60+ rule is for the tenant on the lease, not her. Call 311 and check if your pay is under the poverty line.', next: 'rent_b1' },
            { text: 'Go Thursday and explain it yourself. Showing up without a lawyer tells the judge you\'re acting in good faith.', next: 'rent_c1' },
          ],
        },
        rent_a1: { speaker: 'Ms. Odette, 3B', text: 'So my mother counts. And if my pay is under the income line, that counts too? ...So that\'s a yes either way?', next: 'rent_a1b' },
        rent_a1b: { speaker: 'nell', text: 'That\'s a yes either way. Never go to Housing Court alone.', next: 'rent_q2' },
        rent_b1: { speaker: 'nell', text: 'Anyone 60 or older in the HOUSEHOLD. Your mother just became your favorite legal strategy. And the income line is 200% of poverty, not 100. Call 311, ask for Right to Counsel.', next: 'rent_q2' },
        rent_c1: { speaker: 'nell', text: 'Good faith is lovely. The landlord\'s lawyer will thank you for it. Never go to Housing Court alone. Call 311 BEFORE Thursday, ask for Right to Counsel. Anyone 60+ in the household: free.', next: 'rent_q2' },
        rent_q2: {
          speaker: 'Dev, 5F', text: 'I moved in last year. Rent went from $1,400 to $2,900. The super said "renovations." The renovation was a doorknob.',
          choices: [
            { text: 'Request your rent history from the state, Homes and Community Renewal. If it doesn\'t add up, file an overcharge complaint.', next: 'rent_a2', effects: { inc: { rent_score: 1 } } },
            { text: 'Ask the landlord\'s office for the rent history in writing. If it doesn\'t add up, file an overcharge complaint.', next: 'rent_b2' },
            { text: 'Ask Free Tenant Lawyers on the 2nd floor for the rent history. They keep the records for every building.', next: 'rent_c2' },
          ],
        },
        rent_a2: { speaker: 'nell', text: 'Online, by mail, or in person at the borough rent office. Tenants get it as of right. Dev, you\'re requesting it tonight. I\'ll watch.', next: 'rent_q3' },
        rent_b2: { speaker: 'nell', text: 'In writing, from the people who charged you $2,900 for a doorknob? He\'ll send a vibe, not a receipt. Ask HCR, the state housing agency. That\'s where an overcharge shows up.', next: 'rent_q3' },
        rent_c2: { speaker: 'nell', text: 'We\'re lawyers, not a filing cabinet. Okay, we own several filing cabinets. Not that one. Ask HCR, the state, for your rent history. It\'s yours to ask for.', next: 'rent_q3' },
        rent_q3: {
          speaker: 'juni', text: 'Okay but when do we STRIKE? The piece is up across the street. The block is looking. I\'m vibrating.',
          choices: [
            { text: 'Not my call or yours. The whole building votes on it, with the lawyers in the room.', next: 'rent_a3', effects: { inc: { rent_score: 1 }, rel: { nell: 3, juni: 2 } } },
            { text: 'Nell and I pick a date tonight and tell everyone tomorrow. Faster, and nobody has to argue.', next: 'rent_b3' },
            { text: 'The twelve with court dates strike first. They have the most at stake, so it\'s their fight.', next: 'rent_c3' },
          ],
        },
        rent_a3: { speaker: 'juni', text: 'Ugh. Fine. Democracy is slower than bread but it rises higher.', next: 'rent_tally' },
        rent_b3: { speaker: 'nell', text: 'Leave me out of that. That\'s a whole-building decision. We make it together, with counsel, not at 9pm in a lobby because Juni is vibrating.', next: 'rent_tally' },
        rent_c3: { speaker: 'nell', text: 'And leave the twelve most at risk out on the ledge alone? That\'s not a strike, that\'s a sacrifice. Whole building votes, lawyers in the room. Juni, put the bread down.', next: 'rent_tally' },
        rent_tally: {
          speaker: 'you', text: '*Across Ocean Ave, Juni\'s installation catches the streetlight. Half the lobby turns to look.*',
          choices: [
            { text: '(Look out the window.)', cond: { flag: 'rent_art_good' }, next: 'rent_end', effects: { inc: { rent_score: 1 } } },
            { text: '(Look out the window.)', cond: { notFlag: 'rent_art_good' }, next: 'rent_end' },
          ],
        },
        rent_end: {
          speaker: 'nell', text: '*Nell passes a clipboard down the rows.* Sign-in sheet. Name, apartment, court date if you have one.',
          choices: [
            { text: '(Watch the clipboard go around.)', cond: { flagMin: { rent_score: 3 } }, next: 'rent_good' },
            { text: '(Watch the clipboard go around.)', cond: { flagMin: { rent_score: 2 }, flagMax: { rent_score: 2 } }, next: 'rent_ok' },
            { text: '(Watch the clipboard go around.)', cond: { flagMax: { rent_score: 1 } }, next: 'rent_weak' },
          ],
        },
        rent_good: { speaker: 'nell', text: 'Twelve of twelve. Eleven Right to Counsel calls by Friday. Dev\'s rent history is on its way. The Parkside-ish Arms Tenants Association exists.', choices: [{ text: '(Somebody starts a group chat.)', effects: { flags: { rent_result: 'good', rent_done: true }, rel: { nell: 10, juni: 4 } } }] },
        rent_ok: { speaker: 'nell', text: 'Eight signed. Some called 311, some are "thinking about it." It\'s a start, and a start with lawyers.', choices: [{ text: '(Fold the chairs.)', effects: { flags: { rent_result: 'ok', rent_done: true }, rel: { nell: 4 } } }] },
        rent_weak: { speaker: 'nell', text: 'Three signed. One was Juni, twice. We knock again next week. Organizing is mostly knocking again.', choices: [{ text: '(Fold the chairs. Knock again.)', effects: { flags: { rent_result: 'weak', rent_done: true } } }] },
      },
    },

    juni: {
      entries: [
        { cond: S('rent', [1, 2]), node: 'rent_juni_early' },
        { cond: S('rent', 3), node: 'rent_juni' },
      ],
      nodes: {
        rent_juni_early: { speaker: 'juni', text: 'Nell texted. I\'m already sketching. Go do the boring part with the papers first. The boring part is the part that wins.' },
        rent_juni: { speaker: 'juni', text: 'A landlord LLC with a NUMBER in its name? The collective has been waiting for this. We have a truck, forty yards of muslin and zero chill.', next: 'rent_juni2' },
        rent_juni2: {
          speaker: 'juni', text: 'It goes up across from the Arms tonight. What\'s the piece?',
          choices: [
            { text: 'A 40-foot rent receipt: what each apartment paid, year by year, next to what they pay now.', next: 'rent_art_good', effects: { flags: { rent_art_good: true } } },
            { text: 'A 40-foot banner: BLESSED BRICK OUT, in letters you can read from the park.', next: 'rent_art_rat' },
            { text: 'A wall of tenant portraits, each with their court date, so the block sees who\'s being pushed out.', next: 'rent_art_bread' },
          ],
        },
        rent_art_good: { speaker: 'juni', text: 'Oh, that\'s MEAN. The numbers do the yelling. Tenants ask the state for their rent histories, we paint whatever comes back. Take posters.', choices: [{ text: '(Take 4 posters and the art.)', effects: take }] },
        rent_art_rat: { speaker: 'juni', text: 'Loud. Also the 400th "OUT" banner this block has seen. Nell says numbers yell louder. ...Fine. Banner, plus a rat in a landlord\'s quarter-zip. Take posters.', choices: [{ text: '(Take 4 posters and the art.)', effects: take }] },
        rent_art_bread: { speaker: 'juni', text: 'Powerful. Did anybody ask them if they want their court date 40 feet tall? No. Okay. We paint the rent numbers instead, and somebody\'s sourdough for morale. Take posters.', choices: [{ text: '(Take 4 posters and the art.)', effects: take }] },
      },
    },
  },
};
