/**
 * Mission 15 · THE NEAREST TOMATO (Brownsville → East New York → Bed-Stuy, giver: Ms. Celestine)
 *
 * Facts used (checked Nov 21 2026; sources in docs/FACTS-transit-food-mediation.md):
 * - Brownsville has about 1 supermarket for every 15 bodegas; East New York about 1 for every 13 (city Supermarket Need
 *   Index data, as reported ~2018–2021). Advocates call it "food apartheid"; the city doesn't use that term.
 * - FRESH (Food Retail Expansion to Support Health): zoning bonus (an extra square foot of housing per square foot of
 *   grocery, up to 20,000) plus up to 25 years of property-tax relief for full-service grocery stores in underserved districts.
 *   https://www.nyc.gov/assets/planning/downloads/pdf/our-work/plans/citywide/food-retail-expansion-support-health-fresh/fresh-report-feb2023.pdf
 * - Health Bucks: $2 coupon for every $2 spent with SNAP at NYC farmers markets, up to $10 a day (rising to $14 a day in Jan 2027).
 *   https://www.nyc.gov/site/doh/health/health-topics/health-bucks.page
 * - GrowNYC Fresh Food Box: $7 with SNAP, sliding scale otherwise, no income requirement.
 * - Community boards are advisory (land use, budget, services). https://www.nyc.gov/site/cau/community-boards/about-commmunity-boards.page
 * - Ms. Celestine, Kofi, the stores and the farm stand are fiction.
 */
import { state } from '../../core/state';
import type { Effect } from '../../core/types';
import type { MissionModule } from './types';

const f = (k: string) => !!state.flag(k);
const S = (id: string, is: number | number[]) => ({ missionStage: { id, is } });
const mv = (k: string) => (state.d.activeMission === 'food' ? (state.mission('food').vars[k] ?? 0) : 0);

const STORES: [string, string, string][] = [
  ['at_lm_bxdeli', 'lm_bxdeli', 'Best Deli & Grocery & Also Deli'],
  ['at_lm_bxdollar', 'lm_bxdollar', '99¢ & Up & Up & Up'],
  ['at_lm_bxchicken', 'lm_bxchicken', 'Kings County Fried Everything'],
];
const RESET = { at_lm_bxdeli: false, at_lm_bxdollar: false, at_lm_bxchicken: false };

export const food: MissionModule = {
  mission: {
    id: 'food', number: 16, title: 'THE NEAREST TOMATO', district: 'flatbush', giver: 'celestine',
    tagline: 'Ms. Celestine can buy a lottery ticket, a phone charger and a honey bun on every corner in Brownsville. A tomato is a field trip.',
    stages: [
      { text: () => 'Meet Ms. Celestine at the Brownsville Tenants & Eaters Assn', targets: () => ['celestine'], done: () => f('food_accepted') },
      {
        text: () => `Survey the block: what fresh food is for sale? (${STORES.filter(([k]) => f(k)).length}/3) ${STORES.filter(([k]) => !f(k)).map(([, , n]) => n).join(' · ')}`,
        targets: () => STORES.filter(([k]) => !f(k)).map(([, s]) => `spot:${s}`),
        done: () => STORES.every(([k]) => f(k)),
        timer: 160,
      },
      { text: () => 'Report back to Ms. Celestine', targets: () => ['celestine'], done: () => f('food_fresh') },
      { text: () => 'Get to the New Lots Farm Stand in East New York before it packs up', targets: () => ['kofi'], done: () => f('food_kofi'), timer: 220 },
      { text: () => 'Bring the plan to Ms. Hattie\'s community board meeting, Gates Ave Community Center', targets: () => ['hattie'], done: () => f('food_done') },
    ],
    optional: [
      { id: 'flyers', text: 'Hand out 5 Health Bucks flyers', done: () => mv('flyers') >= 5, reward: { solidarity: 30, trust: { flatbush: 4 } } },
      { id: 'transit', text: 'Take the train or bus to East New York', done: () => f('food_kofi') && (f('rode_subway') || f('rode_bus')), reward: { solidarity: 20 } },
    ],
    rewards: (): Effect => {
      const r = state.flag('food_result');
      if (r === 'good') return { solidarity: 340, power: 3, trust: { flatbush: 20 }, rel: { celestine: 10 }, toast: 'THE BOARD BACKS A GROCERY STORE ON THE LOT' };
      if (r === 'ok') return { solidarity: 180, power: 1, trust: { flatbush: 10 }, rel: { celestine: 5 } };
      return { solidarity: 60, trust: { flatbush: 2 } };
    },
    failText: 'The farm stand packed up. Kofi left a note: "Back Saturday. Bring a bag. Bring a neighbor." Try again.',
    onFail: () => { state.clearFlagsWithPrefix('food_'); for (const k of Object.keys(RESET)) delete state.d.flags[k]; },
    next: 'common',
  },

  dialogue: {
    celestine: {
      entries: [
        { cond: { missionStatus: { id: 'food', is: 'available' } }, node: 'food_start' },
        { cond: S('food', 0), node: 'food_0' },
        { cond: S('food', 1), node: 'food_wait' },
        { cond: S('food', 2), node: 'food_c0' },
        { cond: S('food', [3, 4]), node: 'food_wait2' },
      ],
      nodes: {
        food_start: { speaker: 'celestine', text: 'Organizer. Sit. Do you know where the nearest tomato is? Not a ketchup packet. A tomato.', choices: [{ text: 'I do not.', next: 'food_0', effects: { startMission: 'food' } }] },
        food_0: { speaker: 'celestine', text: 'Neither do half my building. I\'m seventy-three. I have a pressure problem. My doctor says "eat fresh." My corner says "chopped cheese."', next: 'food_0b' },
        food_0b: { speaker: 'celestine', text: 'The city even has a tool for this. It\'s called FRESH. A developer who puts a full-service grocery store in a neighborhood like ours gets extra building space and tax breaks. Remember that word. FRESH.', next: 'food_1' },
        food_1: {
          speaker: 'celestine', text: 'Don\'t take my word for it. Walk the block. Count what\'s fresh. Then come tell me I\'m exaggerating.',
          choices: [
            { text: 'Count it. Then we organize.', effects: { rel: { celestine: 4 }, items: { flyers: 6 }, flags: { food_accepted: true, food_score: 0, ...RESET } } },
            { text: 'Isn\'t the bodega fine?', next: 'food_2' },
          ],
        },
        food_2: {
          speaker: 'celestine', text: 'The bodega is family. Farouk\'s cousin runs it. But family can\'t sell you what the distributor won\'t bring. Go count.',
          choices: [{ text: 'Going.', effects: { items: { flyers: 6 }, flags: { food_accepted: true, food_score: 0, ...RESET } } }],
        },
        food_wait: { speaker: 'celestine', text: 'Deli, the 99-cent store, the chicken spot. Count the vegetables. It won\'t take long.' },
        food_c0: { speaker: 'you', text: '*Your count: one onion, soft. Four bananas, brave. Two hundred kinds of chips. A whole wall of soda. The chicken spot\'s "salad" is a lemon wedge.*', next: 'food_c1' },
        food_c1: { speaker: 'celestine', text: 'In Brownsville there\'s about one supermarket for every fifteen bodegas. You just met fourteen of them. So how do we get a real grocery store on that empty lot on Pitkin?', next: 'food_c2' },
        food_c2: {
          speaker: 'celestine', text: 'What\'s the tool?',
          choices: [
            { text: 'FRESH: the city gives developers extra building space and tax breaks if they put a full-service grocery store in neighborhoods like this.', tag: 'FACT', next: 'food_c3', effects: { inc: { food_score: 1 } } },
            { text: 'FRESH: the city builds the grocery store itself and runs it, once the community board asks in writing.', next: 'food_c4' },
            { text: 'FRESH: developers get extra space and tax breaks for any food store, so a bigger bodega on the lot counts.', next: 'food_c4' },
          ],
        },
        food_c3: { speaker: 'celestine', text: 'FRESH. Zoning bonus and tax breaks for a real grocery store. The developer on that lot wants something from the city. We make the grocery store the price.', next: 'food_c5' },
        food_c4: { speaker: 'celestine', text: 'Baby. No. The city doesn\'t run grocery stores, and a bigger bodega is still a bodega. Farouk\'s cousin agrees. There\'s a city program called FRESH: extra building space and tax breaks for developers who put a full-service grocery store in neighborhoods like ours. We make the store the price.', next: 'food_c5' },
        food_c5: { speaker: 'celestine', text: 'But a store takes years. People eat tonight. Go see Kofi at the New Lots Farm Stand before he packs up. Take the train. Take the bus. Don\'t take a cab, I\'ll hear about it. And ask him about Health Bucks: at a farm stand, every $2 you spend with SNAP gets you a $2 coupon for more produce, up to $10 a day.', choices: [{ text: 'Kofi. New Lots. Now.', effects: { flags: { food_fresh: true }, rel: { celestine: 2 } } }] },
        food_wait2: { speaker: 'celestine', text: 'Kofi at the farm stand. Then Hattie\'s board meeting. Bring the count. Numbers make men nervous.' },
      },
    },

    kofi: {
      entries: [
        { cond: S('food', 3), node: 'food_k0' },
        { cond: S('food', 4), node: 'food_kwait' },
      ],
      nodes: {
        food_k0: { speaker: 'kofi', text: 'Collards, callaloo, peppers, tomatoes. Grown four blocks from here, in a lot people called empty. Most of my customers pay with SNAP. What should they know?', next: 'food_k1' },
        food_k1: {
          speaker: 'kofi', text: 'Pop quiz. A customer spends $10 of SNAP here today. What does she walk home with?',
          choices: [
            { text: 'Health Bucks: a $2 coupon for every $2 of SNAP, up to $10 a day. So $20 of produce.', tag: 'FACT', next: 'food_k2', effects: { inc: { food_score: 1 } } },
            { text: 'Health Bucks: a $2 coupon for every $10 of SNAP. So $12 of produce, and more if she comes back tomorrow.', next: 'food_k3' },
            { text: 'Health Bucks: a $2 coupon for every $2 of SNAP, up to $14 a day starting today. So $24 of produce.', next: 'food_k3' },
            { text: 'Just the $10. Health Bucks only work at supermarkets, so tell her to save them for a real store.', next: 'food_k3' },
          ],
        },
        food_k2: { speaker: 'kofi', text: 'Yes. Spend $10 of SNAP, take home $20 of food. And it goes up to $14 a day in January. Nobody knows. That\'s the problem.', next: 'food_k4' },
        food_k3: { speaker: 'kofi', text: 'Count again, friend. Every $2 of SNAP gets a $2 coupon, up to $10 a day now, $14 starting in January. Farm stands and markets, not supermarkets. So $10 of SNAP, $20 of food. Nobody knows. That\'s the problem.', next: 'food_k4' },
        food_k4: { speaker: 'kofi', text: 'And for folks who can\'t get here: GrowNYC\'s Fresh Food Box. Seven dollars with SNAP. Tell Ms. Celestine\'s building. Then tell Hattie\'s board. A community board only advises, but the developer still wants the board on its side.', choices: [{ text: '(Take a stack of flyers.)', effects: { flags: { food_kofi: true }, items: { flyers: 4 }, rel: { kofi: 3 }, toast: 'POCKET CIVICS · HEALTH BUCKS' } }] },
        food_kwait: { speaker: 'kofi', text: 'Health Bucks. Food boxes. Tell everybody. Then come back Saturday, I\'ll have okra.' },
      },
    },

    hattie: {
      entries: [{ cond: S('food', 4), node: 'food_h0' }],
      nodes: {
        food_h0: { speaker: 'hattie', text: 'Community board, new business. A developer wants a variance for the Pitkin lot. Luxury rentals, a gym, and a "food concept." The floor is open.', next: 'food_h1' },
        food_h1: {
          speaker: 'hattie', text: 'Two minutes, baby. Make them count.',
          choices: [
            { text: 'We counted: one onion in three stores. Vote no unless the plan includes a full-service grocery store under FRESH, with SNAP accepted.', tag: 'BEST', next: 'food_h2', effects: { inc: { food_score: 1 } } },
            { text: 'We counted: one onion in three stores. This board can block the variance tonight, so vote it down for good.', next: 'food_h3' },
            { text: 'We counted. Vote yes if the developer promises to think about a grocery store.', next: 'food_h4' },
          ],
        },
        food_h2: { speaker: 'hattie', text: 'Data and a demand. The board\'s vote is only advisory, but the developer needs friends, and you just told them the price of friendship.', next: 'food_h5' },
        food_h3: { speaker: 'hattie', text: 'Baby, I wish. This board only advises. A flat no doesn\'t stop him, and it gets us nothing. Bring the count and a condition: a full-service grocery store under FRESH.', next: 'food_h5' },
        food_h4: { speaker: 'tyler', text: '*Tyler, at the back:* Oh, we thought about it. It\'s a cold-pressed experience. Eleven dollars. You wouldn\'t get it.', next: 'food_h4b' },
        food_h4b: { speaker: 'hattie', text: 'That\'s what "think about it" buys you. Next time, the count and a condition: a full-service grocery store under FRESH, with SNAP.', next: 'food_h5' },
        food_h5: {
          speaker: 'hattie', text: 'The board votes...',
          choices: [
            { text: '(Wait for the vote.)', cond: { flagMin: { food_score: 3 } }, effects: { flags: { food_result: 'good', food_done: true }, toast: 'POCKET CIVICS · FRESH' } },
            { text: '(Wait for the vote.)', cond: { flagMin: { food_score: 2 }, flagMax: { food_score: 2 } }, effects: { flags: { food_result: 'ok', food_done: true }, toast: 'POCKET CIVICS · FRESH' } },
            { text: '(Wait for the vote.)', cond: { flagMax: { food_score: 1 } }, effects: { flags: { food_result: 'weak', food_done: true }, toast: 'POCKET CIVICS · FRESH' } },
          ],
        },
      },
    },
  },

  npcs: [
    {
      id: 'celestine', name: 'Ms. Celestine', short: 'Ms. Celestine', title: 'President, Tenants & Eaters', district: 'flatbush', spot: 'lm_bxcenter', color: '#ffb86b',
      offset: { dx: 40, dy: 4 },
      look: { skin: '#5a3624', hair: '#d8d4dc', style: 'short', shirt: '#9b59d0', pants: '#2b2b40', shoes: '#f2f2f2', acc: 'glasses', dress: true },
      bio: 'Seventy-three. Retired MTA token clerk. President of her building\'s tenants association, which she expanded to "tenants and eaters" when she realized the two problems were the same problem.',
      idle: ['Where\'s the nearest tomato? Exactly.', 'One supermarket. Fifteen bodegas. Do the math, then do something.', 'Numbers make men nervous. Bring numbers.'],
    },
    {
      id: 'kofi', name: 'Kofi', short: 'Kofi', title: 'Urban Farmer, New Lots', district: 'flatbush', spot: 'lm_enyfarm', color: '#7fd45a',
      offset: { dx: 36, dy: 4 },
      look: { skin: '#4a2c1c', hair: '#1a1010', style: 'short', shirt: '#3f8f3a', pants: '#5a4a32', shoes: '#3a2a1a', acc: 'apron' },
      bio: 'Grows collards and callaloo on a lot the city once called vacant. Takes SNAP, hands out Health Bucks, and will tell you the life story of any pepper.',
      idle: ['SNAP doubles here. Nobody knows. Tell somebody.', 'This lot was "empty" for twenty years. Look at it now.', 'Callaloo. Learn it. Love it.'],
    },
  ],
};
