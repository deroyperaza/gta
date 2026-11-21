/**
 * Mission 11 · FREE FOR ALL (Crown Heights, giver: Danae)
 * Need: cultural access. Twelve kids, one museum, zero dollars.
 *
 * Facts used (checked Nov 21 2026):
 * - Culture Pass: cardholders 13 and older of Brooklyn, New York and Queens public libraries reserve free passes;
 *   only regular full-service cards count (no ecards); one pass per venue per calendar year; up to four active
 *   reservations; the cardholder must be there with ID matching the pass. https://www.culturepass.nyc/faq
 * - Library card eligibility: live in New York State, or work or go to school in NYC. https://www.culturepass.nyc/
 * - Culture Pass reaches "over 100 museums and cultural attractions in all five boroughs".
 *   https://www.bklynlibrary.org/media/press/culture-pass-surpasses
 * - Brooklyn Museum lists Culture Pass among its free-admission programs (its own tickets page; that page
 *   may be out of date, so the game never promises a specific venue). https://www.brooklynmuseum.org/visit/tickets
 * - IDNYC: free, for NYC residents 10 and up, regardless of immigration status. https://www.nyc.gov/site/idnyc/about/about.page
 * - IDNYC cardholders can get free one-year memberships or discounted tickets at participating institutions
 *   (Brooklyn ones listed include Brooklyn Children's Museum and BAM; rules vary by place).
 *   https://www.nyc.gov/site/idnyc/benefits/museums-and-cultural-institutions.page
 * Not used: whether the Brooklyn Museum is an IDNYC partner today (not on the current list), Kings Theatre on Culture Pass (couldn't confirm).
 */
import { state } from '../../core/state';
import type { Effect } from '../../core/types';
import type { MissionModule } from './types';

const f = (k: string) => !!state.flag(k);
const S = (is: number | number[]) => ({ missionStage: { id: 'culture', is } });
const flyers = () => (state.d.activeMission === 'culture' ? (state.mission('culture').vars.flyers ?? 0) : 0);
const RESET = { at_gap: false, at_lm_bkmuseum: false, at_lm_kingsish: false };

export const culture: MissionModule = {
  mission: {
    id: 'culture', number: 11, title: 'FREE FOR ALL', district: 'crownheights', giver: 'danae',
    tagline: 'Twelve kids live ten minutes from the Brooklyn Museum and have never been inside. Fix that for zero dollars.',
    stages: [
      { text: () => 'Meet Danae in Park Slope', targets: () => ['danae'], done: () => f('culture_accepted') },
      { text: () => 'Get the kids library cards: find Naim on the Central Library steps', targets: () => ['naim'], done: () => f('culture_cards') },
      {
        text: () => `Library card drive at Grand Army Plaza: hand out flyers [SPACE] (${Math.min(flyers(), 5)}/5)${f('at_gap') ? '' : ' · get to the plaza'}`,
        targets: () => (f('at_gap') ? [] : ['spot:gap']),
        done: () => f('at_gap') && flyers() >= 5,
      },
      { text: () => 'Passes reserved. Walk the group down Eastern Parkway to the Brooklyn Museum', targets: () => ['spot:lm_bkmuseum'], done: () => f('at_lm_bkmuseum') },
      {
        text: () => `The kids are in! Tell Danae how it went${f('at_lm_kingsish') ? '' : ' · bonus: scout the Kings-ish Theatre for next month'}`,
        targets: () => (f('at_lm_kingsish') ? ['danae'] : ['danae', 'spot:lm_kingsish']),
        done: () => f('culture_done'),
      },
    ],
    optional: [
      { id: 'flyers', text: 'Hand out 10 library card flyers', done: () => flyers() >= 10, reward: { solidarity: 40, trust: { crownheights: 4 } } },
      { id: 'kings', text: 'Scout the Kings-ish Theatre for next month', done: () => f('at_lm_kingsish'), reward: { solidarity: 30, trust: { flatbush: 4 } } },
      { id: 'aced', text: 'Answer every question like a docent', done: () => state.num('culture_iq') >= 4, reward: { solidarity: 50, power: 1, rel: { danae: 4 } } },
    ],
    rewards: (): Effect => {
      const r = state.flag('culture_result');
      if (r === 'good') return { solidarity: 320, power: 3, trust: { crownheights: 20, parkslope: 6 }, rel: { danae: 10, naim: 5 }, toast: 'THE MUSEUM IS THEIRS' };
      if (r === 'ok') return { solidarity: 170, power: 1, trust: { crownheights: 10 }, rel: { danae: 4 } };
      return { solidarity: 70, trust: { crownheights: 3 } };
    },
    next: 'heat',
  },

  dialogue: {
    // ============================================================ DANAE
    danae: {
      entries: [
        { cond: S(0), node: 'culture_0' },
        { cond: S([1, 2, 3]), node: 'culture_wait' },
        { cond: S(4), node: 'culture_end' },
      ],
      nodes: {
        culture_0: { speaker: 'danae', text: 'Twelve kids from the block. Saturday. The Brooklyn Museum. Budget: one MetroCard and my optimism.', next: 'culture_0b', effects: { flags: { culture_iq: 0, ...RESET } } },
        culture_0b: {
          speaker: 'danae', text: 'Meanwhile Tyler is selling a "Luxe Culture Club." $400 a month for "curated access" to museums. Curated by who? Tyler.',
          choices: [
            { text: 'How do we get twelve kids in for free?', next: 'culture_how' },
            { text: 'Is $400 a month... a lot?', next: 'culture_tyler' },
          ],
        },
        culture_tyler: { speaker: 'danae', text: 'It comes with a tote bag that says "I Support The Arts." The tote is the only thing it supports.', next: 'culture_how' },
        culture_how: {
          speaker: 'danae', text: 'So think. What\'s free, open to everybody, and sitting right on Grand Army Plaza?',
          choices: [
            { text: 'The Central Library. Library card, then Culture Pass.', next: 'culture_yes', effects: { inc: { culture_iq: 1 }, rel: { danae: 3 } } },
            { text: 'The arch. We climb it and look at the museum from up there.', next: 'culture_arch' },
            { text: 'Tyler\'s free trial. Then we cancel.', next: 'culture_trial' },
          ],
        },
        culture_arch: { speaker: 'danae', text: 'That\'s not a field trip, that\'s a news story. No. Look across the plaza. The big building with the books.', next: 'culture_yes' },
        culture_trial: { speaker: 'danae', text: 'The cancel button is in a different borough. I checked. Look across the plaza instead. The big building with the books.', next: 'culture_yes' },
        culture_yes: {
          speaker: 'danae', text: 'Culture Pass. With a library card, you reserve free passes to over 100 museums and cultural spots in all five boroughs. Naim\'s on the library steps. Go get these kids carded.',
          choices: [{ text: 'Library cards first.', effects: { flags: { culture_accepted: true } } }],
        },
        culture_wait: { speaker: 'danae', text: 'Cards, then passes, then the museum. The kids already picked their outfits. One of them is dressed as a sarcophagus.' },
        culture_end: { speaker: 'danae', text: 'One of them stood in front of the Egyptian galleries for forty minutes. Didn\'t blink. That\'s the exhibit working.', next: 'culture_e1' },
        culture_e1: {
          speaker: 'danae', text: 'Now make it a habit, not a field trip. Next month: same museum again?',
          choices: [
            { text: 'Somewhere new. It\'s one pass per venue per year, and up to four reservations at a time.', next: 'culture_e2', effects: { inc: { culture_iq: 1 } } },
            { text: 'Same museum. We wear disguises.', next: 'culture_disguise' },
            { text: 'Fine. Tyler\'s club.', next: 'culture_club' },
          ],
        },
        culture_disguise: { speaker: 'danae', text: 'The cardholder has to show up with ID that matches the pass. A mustache is not ID. One pass per venue per year. Spread the love around.', next: 'culture_e2' },
        culture_club: { speaker: 'danae', text: 'His "curated access" is a bus tour past the museum. It does not stop. One pass per venue per year. There are a hundred more.', next: 'culture_e2' },
        culture_e2: {
          speaker: 'danae', text: 'And the little ones under 13? The grown-ups who can\'t get a library card yet?',
          choices: [
            { text: 'IDNYC. Free city ID for New Yorkers 10 and up, any immigration status. Some places give cardholders a free year of membership.', next: 'culture_id', effects: { inc: { culture_iq: 1 } } },
            { text: 'They wait in the gift shop.', next: 'culture_shop' },
            { text: 'They wait until they\'re 13.', next: 'culture_wait13' },
          ],
        },
        culture_shop: { speaker: 'danae', text: 'The gift shop is where joy goes to cost $34. No. Think about the free city ID.', next: 'culture_id' },
        culture_wait13: { speaker: 'danae', text: 'Three years is a long time to be nine. There\'s a faster way, and it\'s free.', next: 'culture_id' },
        culture_id: {
          speaker: 'danae', text: 'IDNYC. Free, for New Yorkers 10 and up, no matter your immigration status. Participating places give cardholders a free year of membership or a discount. Rules vary, so check the list.',
          next: 'culture_res',
        },
        culture_res: {
          speaker: 'danae', text: 'So. What do we tell the kids?',
          choices: [
            { text: '"The museum is yours. Here\'s your card. Pick where we go next."', cond: { flagMin: { culture_iq: 3 } }, tag: 'BEST', effects: { flags: { culture_result: 'good', culture_done: true }, toast: 'POCKET CIVICS · CULTURE PASS + IDNYC' } },
            { text: '"We\'ll try to do this again sometime."', cond: { flagMin: { culture_iq: 2 }, flagMax: { culture_iq: 2 } }, effects: { flags: { culture_result: 'ok', culture_done: true } } },
            { text: '"Remember this. It might not happen again."', cond: { flagMax: { culture_iq: 1 } }, effects: { flags: { culture_result: 'weak', culture_done: true } } },
          ],
        },
      },
    },

    // ============================================================ NAIM (Central Library steps)
    naim: {
      entries: [
        { cond: S(1), node: 'culture_n0' },
        { cond: S([2, 3]), node: 'culture_nwait' },
      ],
      nodes: {
        culture_n0: { speaker: 'naim', text: 'Library cards? You came to the right steps. I count the stairs here for fun. I keep losing count at the same pigeon.', next: 'culture_n1' },
        culture_n1: {
          speaker: 'naim', text: 'Quiz before I hand you anything. Who in your group can actually reserve a Culture Pass?',
          choices: [
            { text: 'Anyone 13 or older with a regular library card. And they come along, with ID.', next: 'culture_nright', effects: { inc: { culture_iq: 1 }, rel: { naim: 3 } } },
            { text: 'Anybody with the library app. Ecards are faster.', next: 'culture_necard' },
            { text: 'Whoever yells "I love museums" the loudest.', next: 'culture_nyell' },
          ],
        },
        culture_necard: { speaker: 'naim', text: 'Ecards are great for books. Not for Culture Pass. You need a regular, full-service card. I asked twice. Politely.', next: 'culture_nright' },
        culture_nyell: { speaker: 'naim', text: 'This is a library. Also, no. You have to be 13 to reserve, with a regular card, and the cardholder shows up with ID.', next: 'culture_nright' },
        culture_nright: {
          speaker: 'naim', text: 'Cards are free if you live in New York State, or work or go to school in the city. Here: sign-up flyers. Hand them out around the plaza.',
          choices: [{ text: 'Okay, but when do the cards come?', next: 'culture_nwhen' }, { text: 'Flyers. Got it.', effects: { items: { flyers: 10 }, flags: { culture_cards: true }, toast: 'LIBRARY CARD DRIVE' } }],
        },
        culture_nwhen: {
          speaker: 'naim', text: 'Ha. You learned the move. Ask the librarian at the front desk, then ask again if the answer is "soon." Here.',
          choices: [{ text: 'Flyers. Go.', effects: { items: { flyers: 10 }, flags: { culture_cards: true }, rel: { naim: 4 }, toast: 'LIBRARY CARD DRIVE' } }],
        },
        culture_nwait: {
          speaker: 'naim', text: 'Plaza first, then the museum. It\'s right down Eastern Parkway. Curb cuts on every corner. I checked that too.',
          choices: [{ text: 'I ran out of flyers.', effects: { items: { flyers: 6 }, toast: '+6 FLYERS' } }, { text: 'On my way.' }],
        },
      },
    },
  },
};
