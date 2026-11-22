/**
 * Mission 19 · PEAK SEASON (Sunset Park → Red Hook → Sunset Park; giver: Itzel at the Sunset Park Climate Collective)
 *
 * Environmental justice: who breathes the dirtiest air on the hottest days, and what neighbors can do about it.
 * Facts used (checked Nov 22 2026; sources in docs/FACTS-older-adults-ej-racial-justice.md; [S] = secondary source):
 * - Peakers: old fossil-fuel plants that run on high-demand days like heat waves; DEC says they emit 30+ times the
 *   nitrogen oxides (NOx) of newer turbines. DEC's Peaker Rule (Dec 2019) tightened NOx limits in May 2023 and May 2025.
 *   https://www.utilitydive.com/news/new-york-moves-to-phase-out-older-peaking-plants-as-it-targets-100-clean-e/549518/
 * - The grid operator (NYISO) kept the Gowanus 2 & 3 and Narrows 1 & 2 barge peakers running past May 2025 for
 *   reliability. https://www.utilitydive.com/news/nyc-peakers-planned-2025-retirement-remain-online-reliability-must-run-nyiso/700417/
 *   (No retirement date is stated in the game: the reported 2029 date is unconfirmed.)
 * - PEAK Coalition: UPROSE, THE POINT CDC, NYC-EJA, NYLPI, Clean Energy Group; 2020 report "Dirty Energy, Big Money".
 * - UPROSE: founded 1966, Brooklyn's oldest Latino community-based organization. https://climatejusticealliance.org/organizations/uprose/
 * - RETI Center, Red Hook: free "Local Power" training for solar, battery storage and building electrification jobs.
 *   Community solar: residents share one solar system to lower bills, no panels on their own roof. https://www.reticenter.org/communitysolar
 * - NYC Heat Vulnerability Index: surface temperature, green space, home air conditioning, and the share of residents
 *   who are low-income or Black; the city says the gaps are rooted in racism, and green space is linked to heat deaths
 *   more weakly than the other factors. https://a816-dohbesp.nyc.gov/IndicatorPublic/data-features/hvi/
 * - Local Laws 60 and 64 of 2017: an EJ study, an online mapping tool and a citywide EJ Plan; the EJNYC report and
 *   mapping tool came out in April 2024. https://climate.cityofnewyork.us/ejnyc-report/introduction/
 * - Itzel, Don Rafa, Ms. Toni, Doña Amparo and the Collective are fiction.
 */
import { state } from '../../core/state';
import type { Effect } from '../../core/types';
import type { MissionModule } from './types';

const f = (k: string) => !!state.flag(k);
const S = (id: string, is: number | number[]) => ({ missionStage: { id, is } });

const STOPS: [string, string, string][] = [
  ['ej_rafa', 'rafa', 'Don Rafa on the waterfront'],
  ['ej_toni', 'toni', 'Ms. Toni in Red Hook'],
  ['ej_amparo', 'amparo', 'Doña Amparo on Fifth Ave'],
];
const RESET = { ej_rafa: false, ej_toni: false, ej_amparo: false };

export const ej: MissionModule = {
  mission: {
    id: 'ej', number: 19, title: 'PEAK SEASON', district: 'sunsetpark', giver: 'itzel',
    tagline: 'It\'s 94 degrees. Every AC in Brooklyn is on, and the oldest power plants in the city just woke up next to Sunset Park. Itzel has a map, a thermometer and a plan.',
    stages: [
      { text: () => 'Meet Itzel at the Sunset Park Climate Collective', targets: () => ['itzel'], done: () => f('ej_accepted') },
      {
        text: () => `Heat-wave check-ins, before the afternoon peak (${STOPS.filter(([k]) => f(k)).length}/3): ${STOPS.filter(([k]) => !f(k)).map(([, , n]) => n).join(' · ')}`,
        targets: () => STOPS.filter(([k]) => !f(k)).map(([, id]) => id),
        done: () => STOPS.every(([k]) => f(k)),
        timer: 330,
      },
      { text: () => 'Bring what you learned back to Itzel', targets: () => ['itzel'], done: () => f('ej_done') },
    ],
    optional: [
      { id: 'transit', text: 'Do the whole heat walk by bus, train or foot (no cars on a peak day)', done: () => f('ej_done') && !f('rode_car'), reward: { solidarity: 40, trust: { sunsetpark: 4 } } },
    ],
    rewards: (): Effect => {
      const r = state.flag('ej_result');
      if (r === 'good') return { solidarity: 380, power: 4, trust: { sunsetpark: 18, redhook: 10 }, rel: { itzel: 10, toni: 5, amparo: 5 }, toast: 'THE BLOCK IS ON THE RECORD, AND ON THE ROOF' };
      if (r === 'ok') return { solidarity: 200, power: 2, trust: { sunsetpark: 9, redhook: 5 }, rel: { itzel: 5 } };
      return { solidarity: 70, trust: { sunsetpark: 2 } };
    },
    failText: 'The afternoon peak hit before you finished. Itzel texts: "Heat waves come back. So do we. Tomorrow, 7am, before it\'s hot." Try again.',
    onFail: () => { state.clearFlagsWithPrefix('ej_'); },
    next: 'rj',
  },

  dialogue: {
    itzel: {
      entries: [
        { cond: { missionStatus: { id: 'ej', is: 'available' } }, node: 'ej_start' },
        { cond: S('ej', 0), node: 'ej_0' },
        { cond: S('ej', 1), node: 'ej_wait' },
        { cond: S('ej', 2), node: 'ej_c0' },
      ],
      nodes: {
        ej_start: { speaker: 'itzel', text: 'You\'re the one Adaeze sent? Perfect timing. Heat advisory today. Grab a water, we\'re walking.', choices: [{ text: 'Walking where?', next: 'ej_0', effects: { startMission: 'ej' } }] },
        ej_0: { speaker: 'itzel', text: 'Sunset Park has been fighting for clean air since before I was born. UPROSE, down the street, started in 1966. It\'s the oldest Latino community group in Brooklyn. They taught me everything. Including this:', next: 'ej_1' },
        ej_1: { speaker: 'itzel', text: 'Environmental justice means asking who breathes the worst air, who gets the hottest blocks, and who gets left out of the decisions. In Brooklyn the answer keeps being the same neighborhoods.', next: 'ej_2' },
        ej_2: {
          speaker: 'itzel', text: 'Three check-ins. Don Rafa fishes off the waterfront every day. Ms. Toni in Red Hook just finished a solar class. Doña Amparo on Fifth Ave has no AC. Go before the afternoon peak.',
          choices: [{ text: 'Waterfront, Red Hook, Fifth Ave. Go.', effects: { rel: { itzel: 4 }, flags: { ej_accepted: true, ej_score: 0, rode_car: false, ...RESET } } }],
        },
        ej_wait: { speaker: 'itzel', text: 'Rafa, Toni, Amparo. Drink water between stops. I mean it.' },
        ej_c0: { speaker: 'itzel', text: '*Itzel unrolls a city map covered in sticky notes. The darkest red squares are the hottest blocks.* The city made this. Two laws from 2017, Local Laws 60 and 64, said: study environmental justice, map it, and write a citywide plan. The study and the map came out in April 2024.', next: 'ej_c1' },
        ej_c1: {
          speaker: 'itzel', text: 'The plan is where neighbors get a say. When the city opens it for comment, what do we bring?',
          choices: [
            { text: 'Our own check-ins next to the city\'s data: the peakers by the water, the hottest blocks, who has no AC. And people to say it in their own words.', tag: 'BEST', next: 'ej_c2', effects: { inc: { ej_score: 1 } } },
            { text: 'A petition for more street trees. Trees are the city\'s main fix for heat, so one clear ask wins.', next: 'ej_c1x' },
            { text: 'Nothing yet. The 2017 laws already require the peakers to close, so we wait for the deadline.', next: 'ej_c1x' },
          ],
        },
        ej_c1x: { speaker: 'itzel', text: 'Trees help, but the city\'s own heat index says they matter less than AC, income and who lives there. And those laws require a study, a map and a plan. They don\'t close anything. So we bring all of it: our check-ins, the city\'s data and our people.', next: 'ej_c2' },
        ej_c2: { speaker: 'itzel', text: 'Then we go back to Toni\'s community solar sign-up and get ten more roofs\' worth of neighbors. Fighting the old power and building the new one, same afternoon.', next: 'ej_end' },
        ej_end: {
          speaker: 'itzel', text: 'Let\'s see the map...',
          choices: [
            { text: '(Add your sticky notes to the map.)', cond: { flagMin: { ej_score: 3 } }, effects: { flags: { ej_result: 'good', ej_done: true }, toast: 'POCKET CIVICS · ENVIRONMENTAL JUSTICE' } },
            { text: '(Add your sticky notes to the map.)', cond: { flagMin: { ej_score: 2 }, flagMax: { ej_score: 2 } }, effects: { flags: { ej_result: 'ok', ej_done: true }, toast: 'POCKET CIVICS · ENVIRONMENTAL JUSTICE' } },
            { text: '(Add your sticky notes to the map.)', cond: { flagMax: { ej_score: 1 } }, effects: { flags: { ej_result: 'weak', ej_done: true }, toast: 'POCKET CIVICS · ENVIRONMENTAL JUSTICE' } },
          ],
        },
      },
    },

    rafa: {
      entries: [{ cond: { missionStage: { id: 'ej', is: 1 }, notFlag: 'ej_rafa' }, node: 'ej_r0' }],
      nodes: {
        ej_r0: { speaker: 'rafa', text: '*An old man with a folding chair and two fishing rods points at the water with his chin.* Hot days, those things start up. The power plants on barges. Gowanus, Narrows, they call them. My grandson\'s inhaler knows the schedule better than I do.', next: 'ej_r1' },
        ej_r1: {
          speaker: 'rafa', text: 'They were supposed to shut down. Still here. You\'re young, you read things. What are they?',
          choices: [
            { text: 'Peakers: old fossil-fuel plants that only run when demand peaks, like heat waves. The state says they put out 30+ times the nitrogen oxides of newer turbines.', tag: 'BEST', next: 'ej_r2', effects: { inc: { ej_score: 1 } } },
            { text: 'Peakers: backup plants that run all year at low power, so they pollute a little every day instead of a lot on hot days.', next: 'ej_r3' },
            { text: 'Peakers: old gas plants the state already shut down in 2025. The barges are just parked there waiting to be scrapped.', next: 'ej_r3' },
          ],
        },
        ej_r2: { speaker: 'rafa', text: 'Thirty times. On the days when the air is already the worst. On the days my grandson is outside.', next: 'ej_r4' },
        ej_r3: { speaker: 'rafa', text: '*He shakes his head.* They run on the hottest days, when everybody\'s AC is on. The rest of the year they sleep. And they\'re not waiting to be scrapped. The grid people kept the Gowanus and Narrows barges running past 2025. "Reliability," they said. Thirty times the nitrogen oxides of a new turbine, the state says.', next: 'ej_r4' },
        ej_r4: { speaker: 'rafa', text: 'UPROSE and the PEAK Coalition have been on this for years. They wrote a report, "Dirty Energy, Big Money." Tell Itzel I\'ll come to the next meeting. I\'ll bring fish.', choices: [{ text: '(Write "30x NOx, hot days" on a sticky note.)', effects: { flags: { ej_rafa: true }, rel: { rafa: 3 }, toast: 'POCKET CIVICS · PEAKER PLANTS' } }] },
      },
    },

    toni: {
      entries: [{ cond: { missionStage: { id: 'ej', is: 1 }, notFlag: 'ej_toni' }, node: 'ej_t0' }],
      nodes: {
        ej_t0: { speaker: 'toni', text: '*Ms. Toni wears a hard hat over her braids and a certificate in a plastic sleeve.* Twenty years driving a school bus. Free classes at the RETI Center. Local Power, the program\'s called: solar, batteries, wiring buildings for electric. I start Monday.', next: 'ej_t1' },
        ej_t1: {
          speaker: 'toni', text: 'Now my building wants solar and we don\'t own the roof. Half the block rents. What do I tell them?',
          choices: [
            { text: 'Community solar: neighbors share one solar system somewhere else and get lower bills. You don\'t need panels on your own roof, or to own one.', tag: 'BEST', next: 'ej_t2', effects: { inc: { ej_score: 1 } } },
            { text: 'Community solar: the block pools money to buy panels for one building, and whoever owns that roof shares the savings.', next: 'ej_t3' },
            { text: 'Community solar: it\'s only for homeowners, so renters have to wait for their landlord to install panels.', next: 'ej_t3' },
          ],
        },
        ej_t2: { speaker: 'toni', text: 'Shared system, lower bill, no roof required. That\'s it. RETI has a sign-up team. I\'m stealing that sentence for the building meeting.', next: 'ej_t4' },
        ej_t3: { speaker: 'toni', text: 'That\'s what my landlord said, too. Nope. With community solar, neighbors share one system and get a lower bill. No panels on your roof, no roof at all. Renters can do it. RETI has a sign-up team.', next: 'ej_t4' },
        ej_t4: { speaker: 'toni', text: 'Tell Itzel: Red Hook\'s in. And tell her the solar jobs are going to people from here this time.', choices: [{ text: '(Take a stack of sign-up cards.)', effects: { flags: { ej_toni: true }, rel: { toni: 3 }, toast: 'POCKET CIVICS · COMMUNITY SOLAR' } }] },
      },
    },

    amparo: {
      entries: [{ cond: { missionStage: { id: 'ej', is: 1 }, notFlag: 'ej_amparo' }, node: 'ej_k0' }],
      nodes: {
        ej_k0: { speaker: 'amparo', text: '*Doña Amparo fans herself on a folding chair in the shade of the awning.* Fourth floor. No AC. The window unit died in July and the super says "soon." I come down here because the apartment is an oven.', next: 'ej_k1' },
        ej_k1: {
          speaker: 'amparo', text: 'My niece says the city ranks the blocks by heat danger. What makes a block more dangerous than another one?',
          choices: [
            { text: 'Hot pavement, little green space, fewer homes with AC, and more low-income and Black neighbors. The city says those gaps are rooted in racism.', tag: 'BEST', next: 'ej_k2', effects: { inc: { ej_score: 1 } } },
            { text: 'Mostly trees. The blocks with the fewest trees are the deadliest, so planting trees fixes most of it.', next: 'ej_k3' },
            { text: 'Mostly how close you are to the water. Waterfront blocks are cooler, inland blocks are hotter.', next: 'ej_k3' },
          ],
        },
        ej_k2: { speaker: 'amparo', text: 'So it\'s not bad luck. It\'s where the money and the AC went. *She takes a long sip of water.* Put me on the list.', next: 'ej_k4' },
        ej_k3: { speaker: 'amparo', text: 'My niece showed me the city\'s map. Trees help, but they count less than you\'d think. It\'s the heat of the pavement, the green space, who has AC, and how many neighbors are poor or Black. The city itself says that\'s rooted in racism. Put me on the list.', next: 'ej_k4' },
        ej_k4: { speaker: 'amparo', text: 'And if it\'s an emergency, honey, I call 311 for a cooling center. I know. I\'m old, not new.', choices: [{ text: '(Put her on the list. Leave two bottles of water.)', effects: { flags: { ej_amparo: true }, rel: { amparo: 3 }, toast: 'POCKET CIVICS · HEAT VULNERABILITY' } }] },
      },
    },
  },

  npcs: [
    {
      id: 'itzel', name: 'Itzel', short: 'Itzel', title: 'Organizer, Sunset Park Climate Collective', district: 'sunsetpark', spot: 'lm_climatehq', color: '#4fd18b',
      offset: { dx: 40, dy: 4 },
      look: { skin: '#b07a52', hair: '#1a1010', style: 'long', shirt: '#4fd18b', pants: '#2b2b40', shoes: '#f2f2f2', acc: 'clipboard' },
      bio: 'Twenty-six. Grew up on 44th Street, daughter of a Mexican garment worker and a Puerto Rican bus mechanic. Started organizing at fifteen, after her little brother\'s third asthma attack of the summer. Carries a thermometer everywhere.',
      idle: ['Drink water. I mean it.', 'Who breathes the worst air? Ask that first.', 'Fight the old power. Build the new one.'],
    },
    {
      id: 'rafa', name: 'Don Rafa', short: 'Don Rafa', title: 'Retired Longshoreman', district: 'sunsetpark', spot: 'lm_induscity', color: '#8fb8ff',
      offset: { dx: -40, dy: 6 },
      look: { skin: '#a8714a', hair: '#d8d4dc', style: 'cap', hatColor: '#2b3a6b', shirt: '#e8e4f0', pants: '#4a4a5a', shoes: '#3a2a1a' },
      bio: 'Seventy-four. Unloaded ships on this waterfront for thirty years. Fishes off it now. His grandson has asthma.',
      idle: ['Hot day. The barges are awake.', 'I\'ll bring fish to the meeting.', 'This waterfront fed my family. Now it should stop poisoning it.'],
    },
    {
      id: 'toni', name: 'Ms. Toni', short: 'Ms. Toni', title: 'Solar Installer (Starting Monday)', district: 'redhook', spot: 'lm_rhhouses', color: '#ffd23f',
      offset: { dx: 36, dy: 4 },
      look: { skin: '#5a3624', hair: '#1a1010', style: 'braids', shirt: '#ff8a3d', pants: '#2b3a6b', shoes: '#3a2a1a', acc: 'clipboard' },
      bio: 'Fifty-one. Drove a school bus for twenty years. Lives in the Red Hook Houses. Just finished free solar training at the RETI Center and starts her new job Monday.',
      idle: ['No roof required.', 'Twenty years of school buses. Solar panels don\'t talk back.', 'Red Hook\'s in.'],
    },
    {
      id: 'amparo', name: 'Doña Amparo', short: 'Doña Amparo', title: 'Neighbor, Fifth Ave', district: 'sunsetpark', spot: 'lm_taqueria', color: '#ff9ec7',
      offset: { dx: 36, dy: 4 },
      look: { skin: '#c89070', hair: '#e8e4f0', style: 'bun', shirt: '#e86a9a', pants: '#3a2a5a', shoes: '#111', dress: true, acc: 'cane' },
      bio: 'Eighty-one. Came from Puebla in 1979. Fourth-floor walk-up, no working AC since July. Spends heat waves under the taqueria awning, where everybody knows to bring her water.',
      idle: ['I\'m old, not new.', 'The super says "soon." Soon is a long time.', 'Bring water. Bring a neighbor.'],
    },
  ],
};
