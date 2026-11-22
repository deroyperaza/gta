/**
 * Mission 14 · TWO BUSES AND A PRAYER (Marine Park → Flatbush → Borough Hall, giver: Marisol)
 *
 * Facts used (checked Nov 21 2026; sources in docs/FACTS-transit-food-mediation.md):
 * - Base subway/local bus fare is $3 (since Jan 4 2026). After 12 paid rides in 7 days, the rest of the week is free.
 *   https://ny1.com/nyc/all-boroughs/news/2026/01/02/mta-fare-and-toll-hikes-to-take-effect-sunday
 * - Fair Fares NYC: half-price subway and eligible bus rides ($1.50) for New Yorkers 18–64 under an income limit;
 *   apply through ACCESS HRA. The limit rises to 200% of the federal poverty level on Nov 30 2026.
 *   https://www.nyc.gov/site/fairfares/index.page · https://ny1.com/nyc/all-boroughs/traffic_and_transit/2026/06/30/city-50--off-transit-program-expands-eligibility
 *   (Express buses: not claimed. Official pages don't say.)
 * - Marine Park, Mill Basin and Bergen Beach have no subway station (NYS southeast Brooklyn plan; RPA Fourth Plan).
 * - Flatbush Ave: center-running bus lanes opened Nov 17 2026 from Livingston St to Grand Army Plaza; DOT outreach has begun
 *   on Grand Army Plaza to Avenue H; the goal is full BRT by 2030. https://www.nyc.gov/mayors-office/news/2026/11/...
 * - The B46 Select Bus Service (2016) was shaped at Community Board presentations and a Community Advisory Committee.
 * - Marisol, Desmond and the town hall are fiction. Gary is the game's fictional councilmember.
 */
import { state } from '../../core/state';
import type { Effect } from '../../core/types';
import type { MissionModule } from './types';

const f = (k: string) => !!state.flag(k);
const S = (id: string, is: number | number[]) => ({ missionStage: { id, is } });
const RESET = { rode_bus: false, rode_van: false, rode_car: false, at_gap: false, at_lm_dollarvan: false };

export const fares: MissionModule = {
  mission: {
    id: 'fares', number: 14, title: 'TWO BUSES AND A PRAYER', district: 'flatbush', giver: 'marisol',
    tagline: 'Marisol lives in Marine Park. The nearest subway is a bus ride away. Her shift starts at nine. Her commute starts at seven-fifteen.',
    stages: [
      { text: () => 'Meet Marisol on Avenue U in Marine Park', targets: () => ['marisol'], done: () => f('fares_accepted') },
      { text: () => 'Do Marisol\'s commute: get to Flatbush Ave and ride a B41 bus or a dollar van north (no ride apps)', targets: () => ['spot:lm_dollarvan'], done: () => f('rode_bus') || f('rode_van') },
      { text: () => 'Ride it up Flatbush to Grand Army Plaza before Marisol\'s shift starts', targets: () => ['spot:gap'], done: () => f('at_gap'), timer: 260 },
      { text: () => 'Talk to Desmond, a B41 operator on his break at Grand Army Plaza', targets: () => ['desmond'], done: () => f('fares_desmond') },
      { text: () => 'Head back to Marisol in Marine Park. (No subway goes there. That\'s the point.)', targets: () => ['marisol'], done: () => f('fares_ff') },
      { text: () => 'Testify at Councilmember Gary\'s transit town hall, Borough Hall', targets: () => ['gary'], done: () => f('fares_done'), timer: 300 },
    ],
    optional: [
      { id: 'van', text: 'Ride a dollar van', done: () => f('rode_van'), reward: { solidarity: 20 } },
      { id: 'noapp', text: 'Finish without a ride app', done: () => f('fares_done') && !f('rode_car'), reward: { solidarity: 40, trust: { flatbush: 4 } } },
    ],
    rewards: (): Effect => {
      const r = state.flag('fares_result');
      if (r === 'good') return { solidarity: 340, power: 3, trust: { flatbush: 20 }, rel: { marisol: 10 }, toast: 'GARY ON THE RECORD: BUS LANES TO AVENUE H' };
      if (r === 'ok') return { solidarity: 180, power: 1, trust: { flatbush: 10 }, rel: { marisol: 5 } };
      return { solidarity: 60, trust: { flatbush: 2 } };
    },
    failText: 'Marisol\'s shift started without you. The B41 was "being held by the dispatcher." So was your dignity. Try again.',
    onFail: () => { state.clearFlagsWithPrefix('fares_'); for (const k of Object.keys(RESET)) delete state.d.flags[k]; },
    next: 'food',
  },

  dialogue: {
    marisol: {
      entries: [
        { cond: { missionStatus: { id: 'fares', is: 'available' } }, node: 'fares_start' },
        { cond: S('fares', 0), node: 'fares_0' },
        { cond: S('fares', [1, 2, 3]), node: 'fares_wait' },
        { cond: S('fares', 4), node: 'fares_m0' },
        { cond: S('fares', 5), node: 'fares_wait2' },
      ],
      nodes: {
        fares_start: { speaker: 'marisol', text: 'You\'re the organizer? Good. I have a commute I want you to experience. Personally.', choices: [{ text: 'Tell me.', next: 'fares_0', effects: { startMission: 'fares' } }] },
        fares_0: { speaker: 'marisol', text: 'I\'m a home health aide. My client is in Prospect Heights. From here: a bus to Flatbush, the B41 up Flatbush, then I walk. Ninety minutes on a good day. There are no good days.', next: 'fares_1' },
        fares_1: { speaker: 'marisol', text: 'Marine Park, Mill Basin, Bergen Beach: no subway station. None. The trains stop where the money stopped looking.', next: 'fares_1b' },
        fares_1b: { speaker: 'marisol', text: 'One good thing. This month the city opened center-running bus lanes on Flatbush, from Livingston St Downtown up to Grand Army Plaza. North of the Plaza, the bus flies. South of it, where I ride? Still waiting.', next: 'fares_2' },
        fares_2: {
          speaker: 'marisol', text: 'So do it my way. Get to Flatbush, take the B41 or a dollar van, and get to Grand Army Plaza by nine. Then we talk about what to fix.',
          choices: [
            { text: 'Bus or van. No ride apps.', effects: { rel: { marisol: 4 }, flags: { fares_accepted: true, fares_score: 0, ...RESET } } },
            { text: 'Why not just take a Surge?', next: 'fares_3' },
          ],
        },
        fares_3: {
          speaker: 'marisol', text: 'On a home health aide\'s pay? Every day? A Surge to work costs more than the work pays. Bus or van.',
          choices: [{ text: 'Bus or van.', effects: { flags: { fares_accepted: true, fares_score: 0, ...RESET } } }],
        },
        fares_wait: { speaker: 'marisol', text: 'Flatbush is that way. The B41 comes when it comes. The vans come when you wave.' },
        fares_m0: { speaker: 'marisol', text: 'You made it back. How long did that take? Don\'t tell me. I know. Now: I\'m fifty-two, I spend $3 a ride, four rides a day some days, and a home health aide\'s pay is what it is.', next: 'fares_m1' },
        fares_m1: {
          speaker: 'marisol', text: 'What do you tell me?',
          choices: [
            { text: 'Fair Fares. At 52 you qualify by age. Under the income limit it\'s $1.50 a ride. Apply on ACCESS HRA.', tag: 'FACT', next: 'fares_m2', effects: { inc: { fares_score: 1 } } },
            { text: 'Fair Fares is half price, but it starts at 65. Thirteen more years. Until then, tap the same card every ride.', next: 'fares_m3' },
            { text: 'Fair Fares. Under the income limit it\'s $1.50 a ride. Apply at the station booth in any subway stop.', next: 'fares_m3' },
            { text: 'Fair Fares takes a dollar off every ride, so $2 instead of $3, if you\'re under the income limit. Apply on ACCESS HRA.', next: 'fares_m3' },
          ],
        },
        fares_m2: {
          speaker: 'marisol', text: 'Half price. On my phone. Tonight. Also: after twelve paid rides in a week, the rest of the week is free if you tap the same card. My cousin didn\'t know that either.',
          choices: [{ text: '(Help her apply.)', effects: { flags: { fares_ff: true }, rel: { marisol: 3 }, toast: 'POCKET CIVICS · FAIR FARES' } }],
        },
        fares_m3: {
          speaker: 'marisol', text: 'Close, baby. Not close enough. Fair Fares is half price, $1.50 a ride, for New Yorkers 18 to 64 under an income limit. Fifty-two counts. You apply on ACCESS HRA, not at a booth. The limit goes up November 30. I read the flyer you should have read.',
          choices: [{ text: '(Help her apply anyway.)', effects: { flags: { fares_ff: true }, toast: 'POCKET CIVICS · FAIR FARES' } }],
        },
        fares_wait2: { speaker: 'marisol', text: 'Gary\'s town hall. Borough Hall. Tell him about the ninety minutes. Tell him about the lanes.' },
      },
    },

    desmond: {
      entries: [
        { cond: S('fares', 3), node: 'fares_d0' },
        { cond: S('fares', [4, 5]), node: 'fares_dwait' },
      ],
      nodes: {
        fares_d0: { speaker: 'desmond', text: 'Twenty-two years driving the B41. Ask me anything. Except why it\'s late. I know why it\'s late. Double-parked cars, from here to Kings Plaza.', next: 'fares_d1' },
        fares_d1: {
          speaker: 'desmond', text: 'Something changed on Flatbush this month, though. You notice?',
          choices: [
            { text: 'Center-running bus lanes on Flatbush, Livingston St to Grand Army Plaza. They just opened.', tag: 'FACT', next: 'fares_d2', effects: { inc: { fares_score: 1 } } },
            { text: 'Center-running bus lanes on Flatbush, Grand Army Plaza down to Avenue H. They just opened.', next: 'fares_d3' },
            { text: 'A car-free busway on Flatbush from Downtown to here. No cars on the avenue at all.', next: 'fares_d3' },
          ],
        },
        fares_d2: { speaker: 'desmond', text: 'Bus lanes down the middle. Cars can\'t park in them. My bus moves like a train for two miles. Then I hit Grand Army Plaza and it\'s 1987 again.', next: 'fares_dff' },
        fares_d3: { speaker: 'desmond', text: 'Ha. I wish. Center lanes, Livingston St to right here, that\'s it. No busway. Opened this month. For two miles my bus moves like a train. Then it\'s 1987 again.', next: 'fares_dff' },
        fares_dff: { speaker: 'desmond', text: 'And half my 6 a.m. riders pay full fare when they don\'t have to. Fair Fares: half price, $1.50 a ride, if you\'re 18 to 64 and under the income limit. Apply on ACCESS HRA. The limit goes up November 30. Nobody listens to the driver.', next: 'fares_d4' },
        fares_d4: {
          speaker: 'desmond', text: 'The city\'s doing outreach on the next piece, Grand Army Plaza to Avenue H. Outreach means meetings. Meetings mean the people who show up win. Guess who usually shows up?',
          choices: [{ text: 'The Free Parking Caucus.', next: 'fares_d5' }],
        },
        fares_d5: { speaker: 'desmond', text: 'With a binder. Get your riders there. Marisol\'s neighbors ride my bus at 6 a.m. They should be in that room.', choices: [{ text: '(Write it down.)', effects: { flags: { fares_desmond: true }, rel: { desmond: 3 } } }] },
        fares_dwait: { speaker: 'desmond', text: 'Grand Army Plaza to Avenue H. Riders in the room. Binders optional.' },
      },
    },

    gary: {
      entries: [{ cond: S('fares', 5), node: 'fares_g0' }],
      nodes: {
        fares_g0: { speaker: 'gary', text: 'Welcome to my Transit Town Hall! I love transit. I took a bus once. For a photo. What\'s on your mind?', next: 'fares_g1' },
        fares_g1: {
          speaker: 'gary', text: 'You have two minutes. The Free Parking Caucus had forty.',
          choices: [
            { text: 'Extend the Flatbush center bus lanes from Grand Army Plaza to Avenue H. Will you back it at the community board meetings, yes or no?', tag: 'BEST', next: 'fares_g2', effects: { inc: { fares_score: 1 } } },
            { text: 'Extend the Flatbush bus lanes. Will you look into it and get back to the riders?', next: 'fares_g3' },
            { text: 'Extend the center lanes from Livingston St to Grand Army Plaza. Will you back it at the board, yes or no?', next: 'fares_g3' },
            { text: 'Skip the community board meetings. Tell DOT to just paint the lanes from Grand Army Plaza to Avenue H.', next: 'fares_g3' },
          ],
        },
        fares_g2: { speaker: 'gary', text: 'A yes-or-no question. In public. With a camera running. ...Yes. I back it. Put that in the minutes before I remember who funds me.', next: 'fares_g4' },
        fares_g3: { speaker: 'gary', text: 'Absolutely! Love it! I\'ll look into it! *He looks into it. It\'s a mirror.*', next: 'fares_g3b' },
        fares_g3b: { speaker: 'you', text: '*In the back row, Marisol mouths it slowly: the next piece. Grand Army Plaza to Avenue H. At the meetings. Yes or no.*', next: 'fares_g4' },
        fares_g4: {
          speaker: 'gary', text: 'Anything else? Make it quick. My car\'s double-parked.',
          choices: [
            { text: 'Yes: have your office sign people up for Fair Fares before the limit goes up November 30. Riders in Marine Park need it most.', tag: 'BEST', next: 'fares_g5', effects: { inc: { fares_score: 1 } } },
            { text: 'Yes: have your office sign up seniors over 65 for Fair Fares. They ride the most and pay the most.', next: 'fares_g6' },
            { text: 'Yes: have your office sign people up for Fair Fares in January, once the new income limit kicks in.', next: 'fares_g6' },
          ],
        },
        fares_g5: { speaker: 'gary', text: 'A sign-up table. That\'s... actually easy. And it photographs well. Done.', next: 'fares_end' },
        fares_g6: { speaker: 'gary', text: 'Wonderful! Done! *Marisol shouts from the back: "18 to 64! The limit goes up November 30!" Gary writes it on his hand. His car is in the bus lane.*', next: 'fares_end' },
        fares_end: {
          speaker: 'you', text: '*Marisol texts you a photo: her new Fair Fares card. Caption: "half off my ninety minutes."*',
          choices: [
            { text: '(Done.)', cond: { flagMin: { fares_score: 3 } }, effects: { flags: { fares_result: 'good', fares_done: true }, toast: 'POCKET CIVICS · BUS LANES' } },
            { text: '(Done.)', cond: { flagMin: { fares_score: 2 }, flagMax: { fares_score: 2 } }, effects: { flags: { fares_result: 'ok', fares_done: true }, toast: 'POCKET CIVICS · BUS LANES' } },
            { text: '(Done.)', cond: { flagMax: { fares_score: 1 } }, effects: { flags: { fares_result: 'weak', fares_done: true }, toast: 'POCKET CIVICS · BUS LANES' } },
          ],
        },
      },
    },
  },

  npcs: [
    {
      id: 'marisol', name: 'Marisol', short: 'Marisol', title: 'Home Health Aide, Professional Commuter', district: 'flatbush', spot: 'lm_mpnails', color: '#ff7ab6',
      offset: { dx: 36, dy: 4 },
      look: { skin: '#b07a52', hair: '#2a1a12', style: 'bun', shirt: '#5ec7c0', pants: '#2b2b40', shoes: '#f2f2f2', acc: 'tote' },
      bio: 'Home health aide for nineteen years. Lives in Marine Park, works wherever her clients are. Knows every bus driver on the B41 by name and every pothole by personality.',
      idle: ['Ninety minutes each way. I could have learned Italian by now.', 'The bus is late. The bus is always late. The bus is my life.', 'No subway here. The trains stop where the money stopped looking.'],
    },
    {
      id: 'desmond', name: 'Desmond', short: 'Desmond', title: 'B41 Operator, 22 Years', district: 'parkslope', spot: 'gap', color: '#4f8cff',
      offset: { dx: 150, dy: -40 },
      look: { skin: '#5a3624', hair: '#1a1010', style: 'cap', hatColor: '#1f3a6b', shirt: '#2f4f8f', pants: '#1f2a44', shoes: '#111' },
      bio: 'Has driven the B41 for twenty-two years. Can tell you the exact cost of a double-parked delivery truck, in minutes, per rider.',
      idle: ['Center lanes, Downtown to here. Like driving a train.', 'Every double-parked car costs forty people two minutes.', 'Riders in the room. That\'s how the lanes get painted.'],
    },
  ],
};
