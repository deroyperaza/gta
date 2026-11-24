/**
 * Mission 12 · HEAT WAVE (Coney Island, giver: Ms. Inez, floor captain at Surfside Towers)
 * Need: climate and isolated elders. The elevator is "resting." The list is long. The clock is the thermometer.
 *
 * Facts used (checked Nov 21 2026):
 * - During heat emergencies the City opens cooling centers across the five boroughs; find one with the online
 *   Cooling Center Finder or by calling 311; call the site ahead of time. https://www.nyc.gov/site/em/ready/extreme-heat.page
 *   Finder: https://finder.nyc.gov/coolingcenters/
 * - Older adults and heat-sensitive people should be in touch with someone at least twice a day during a heat wave;
 *   "Be a Buddy": check on them often. https://www.nyc.gov/site/em/ready/extreme-heat.page
 * - Check on family, friends and neighbors; help them use AC or get to a cool place; make sure they drink water;
 *   watch for heat illness and call 911 right away. Heat stroke signs include hot, dry skin, confusion and loss of
 *   consciousness. Fans alone don't cool enough when it is very hot. Adults 60+ are more likely to have risk factors.
 *   https://www.nyc.gov/site/doh/health/emergency-preparedness/emergencies-extreme-weather-heat.page
 * Not used: whether the Health Department's Be a Buddy volunteer program is still running in 2026 or works in
 * Coney Island (only the "be a buddy" message is current), so the game uses the message, not the program.
 */
import { state } from '../../core/state';
import type { Effect } from '../../core/types';
import type { MissionModule } from './types';

const f = (k: string) => !!state.flag(k);
const S = (is: number | number[]) => ({ missionStage: { id: 'heat', is } });
const DONE = { missionStatus: { id: 'heat', is: 'complete' as const } };
const mv = (k: string) => (state.d.activeMission === 'heat' ? (state.mission('heat').vars[k] ?? 0) : 0);
const DOORS: [string, string][] = [['lm_arcade', 'Dot at the Arcade'], ['lm_hotdog', 'Wally at Hot Dog Hall'], ['lm_mermaid', 'Pearl at the Mermaid Workshop']];
const RESET = { at_lm_arcade: false, at_lm_hotdog: false, at_lm_mermaid: false };

export const heat: MissionModule = {
  mission: {
    id: 'heat', number: 13, title: 'HEAT WAVE', district: 'coneyisland', giver: 'inez',
    tagline: 'Day three over 95. The elevator at Surfside Towers is "resting." Ms. Inez has a list of neighbors who live alone.',
    stages: [
      { text: () => 'Find Ms. Inez at Surfside Towers on Coney Island', targets: () => ['inez'], done: () => f('heat_accepted') },
      {
        text: () => {
          const left = DOORS.filter(([s]) => !f(`at_${s}`));
          return `Check on Ms. Inez's neighbors (${3 - left.length}/3): ${left.map(([, n]) => n).join(' · ')}`;
        },
        targets: () => DOORS.filter(([s]) => !f(`at_${s}`)).map(([s]) => `spot:${s}`),
        done: () => DOORS.every(([s]) => f(`at_${s}`)),
        timer: 180,
      },
      { text: () => 'Dot, Wally and Pearl are okay. Nobody has seen Abe. Ask Emily on the boardwalk', targets: () => ['emily'], done: () => f('heat_water'), timed: true },
      { text: () => 'Find Abe under the Parachute Jump. Hurry', targets: () => ['abe'], done: () => f('heat_abe'), timed: true },
      { text: () => 'Abe is safe. Tell Ms. Inez, and make a plan for the rest of the summer', targets: () => ['inez'], done: () => f('heat_done') },
    ],
    optional: [
      { id: 'finder', text: 'Know where the cooling centers are', done: () => f('heat_finder'), reward: { solidarity: 30, trust: { coneyisland: 3 } } },
      { id: 'fast', text: 'Reach Abe with 1:00+ on the clock', done: () => f('heat_abe') && (state.mission('heat').timeLeft ?? 0) >= 60, reward: { solidarity: 50, rel: { abe: 5 } } },
      { id: 'flyers', text: 'Hand out 5 cooling center flyers', done: () => mv('flyers') >= 5, reward: { solidarity: 40, attention: 3, trust: { coneyisland: 4 } } },
    ],
    rewards: (): Effect => {
      const r = state.flag('heat_result');
      if (r === 'good') return { solidarity: 350, power: 3, trust: { coneyisland: 20 }, rel: { inez: 10, abe: 10, emily: 4 }, toast: 'A BUDDY ON EVERY FLOOR' };
      if (r === 'ok') return { solidarity: 180, power: 1, trust: { coneyisland: 10 }, rel: { inez: 4, abe: 4 } };
      return { solidarity: 70, trust: { coneyisland: 3 } };
    },
    failText: 'Too slow. A lifeguard spotted Abe and called 911, and he\'s okay. But Ms. Inez\'s list isn\'t done, and heat waves don\'t wait. Start the rounds again.',
    onFail: () => {
      state.clearFlagsWithPrefix('heat_');
      for (const k of Object.keys(RESET)) delete state.d.flags[k];
    },
    next: 'blockparty',
  },

  npcs: [
    {
      id: 'inez', name: 'Ms. Inez', short: 'Ms. Inez', title: 'The Floor Captain', district: 'coneyisland', spot: 'lm_coneyhouses', color: '#F5C242',
      offset: { dx: 34, dy: 4 },
      look: { skin: '#9a6440', hair: '#dcd8e2', style: 'curly', shirt: '#ff8a5c', pants: '#2f4a6b', shoes: '#f2f2f2', acc: 'clipboard', dress: true },
      bio: 'Retired school crossing guard. Floor captain of all fourteen floors of Surfside Towers, whether or not anyone asked. Keeps a list of every neighbor who lives alone, in pen.',
      idle: ['Every floor needs a captain. Every captain needs a list.', 'I stopped thirty years of traffic with one hand. Management doesn\'t scare me.', 'Call your neighbor. Not text. Call.'],
    },
    {
      id: 'abe', name: 'Abe', short: 'Abe', title: 'The Regular', district: 'coneyisland', spot: 'lm_parachute', color: '#8fd4ff',
      offset: { dx: 26, dy: 6 },
      look: { skin: '#e8c0a0', hair: '#f0f0f0', style: 'cap', hatColor: '#2f6bd1', shirt: '#f2f2f2', pants: '#8a7a5a', shoes: '#5a3a2a' },
      bio: 'Ninety-one. Fixed rides on Surf Avenue for forty years. Sits under the Parachute Jump every afternoon and can tell you what\'s wrong with any ride by the sound.',
      idle: ['Hear that? The Cyclone needs grease. Third car.', 'Best shade on Coney. Free, too.', 'I don\'t need a buddy. ...Okay, a buddy is nice.'],
    },
  ],

  dialogue: {
    // ============================================================ MS. INEZ
    inez: {
      entries: [
        { cond: S(0), node: 'heat_0' },
        { cond: S([1, 2, 3]), node: 'heat_wait' },
        { cond: S(4), node: 'heat_end' },
        { cond: DONE, node: 'heat_after' },
        { node: 'heat_pre' },
      ],
      nodes: {
        heat_pre: { speaker: 'inez', text: 'Every floor needs a captain. I\'m the captain of all fourteen. Nobody voted. Nobody had to.' },
        heat_0: {
          speaker: 'inez', text: 'Day three over 95. The elevator is "resting," says management. From Montauk. The city called a heat emergency, so cooling centers are open. 311 or the Cooling Center Finder says which. Call ahead. Hours change.',
          effects: { flags: { ...RESET } }, next: 'heat_0b',
        },
        heat_0b: {
          speaker: 'inez', text: 'I\'ve got a list of neighbors who live alone, and my knees don\'t do stairs in this. So you\'re my legs. Let\'s see if you\'re also my ears.',
          next: 'heat_1',
        },
        heat_1: {
          speaker: 'inez', text: 'Say Dot picks up and says, "Inez, I\'m melting. Where do I go?" What do I tell her?',
          choices: [
            { text: 'A cooling center. Call 311 or use the city\'s Cooling Center Finder, then call the site before you go.', next: 'heat_right', effects: { mvar: { score: 1 }, flags: { heat_finder: true }, rel: { inez: 3 } } },
            { text: 'A cooling center. Call 911 to find the closest one, then head straight over.', next: 'heat_mgmt' },
            { text: 'A cooling center. Look one up on the Finder and just go. Once it\'s hot, they\'re all open all day.', next: 'heat_freezer' },
          ],
        },
        heat_mgmt: { speaker: 'inez', text: '911 is for emergencies, sweetheart, like somebody confused with hot, dry skin. Finding a cooling center is 311. Management would have gotten that wrong too, on a laminated sign.', next: 'heat_right' },
        heat_freezer: { speaker: 'inez', text: 'All day? I once walked Dot eleven blocks to a locked door. She still brings it up. Hours change. Call the site first.', next: 'heat_right' },
        heat_right: { speaker: 'inez', text: 'When the city calls a heat emergency, it opens cooling centers. 311 or the Cooling Center Finder tells you which ones are open. Call ahead. Hours change.', next: 'heat_list' },
        heat_list: {
          speaker: 'inez', text: 'Now, the list. Dot likes the AC by the Skee-Ball. Wally "supervises" at Hot Dog Hall. Pearl sews at the Mermaid Workshop. Nobody\'s picking up. In a heat wave, folks like these need somebody checking at least twice a day. Go see them with your own eyes.',
          choices: [{ text: 'Knocking on doors. Take some flyers?', effects: { flags: { heat_accepted: true }, items: { flyers: 8 }, toast: 'COOLING CENTER FLYERS' } }],
        },
        heat_wait: { speaker: 'inez', text: 'Don\'t stand here sweating at me. The list, sweetheart. The clock is the thermometer.' },
        heat_end: { speaker: 'inez', text: 'They took Abe to the hospital to be safe. He\'s sitting up and complaining about the Jell-O. That\'s a good sign. Abe complaining is Abe healthy.', next: 'heat_e1' },
        heat_e1: {
          speaker: 'inez', text: 'Summer\'s got two more months. How do we make sure nobody on this list goes a day without somebody checking?',
          choices: [
            { text: 'A buddy for everyone on the list. Two calls a day in a heat wave, help getting to AC, water, and 911 for hot, dry skin.', next: 'heat_buddy', effects: { mvar: { score: 1 } } },
            { text: 'A buddy for everyone on the list. One call a week, and a fan in every apartment so they can stay home.', next: 'heat_fan' },
            { text: 'A sign-up sheet in the lobby. Anyone who feels sick calls me, and I send help right away.', next: 'heat_landlord' },
          ],
        },
        heat_buddy: { speaker: 'inez', text: 'Be a buddy. That\'s what the city calls it, and that\'s what I\'ve been calling Tuesday since 1989. Now it\'s every floor, not just mine.', next: 'heat_res' },
        heat_fan: { speaker: 'inez', text: 'Once a week? Abe would be a raisin. In a heat wave it\'s at least twice a day. And when it\'s this hot, a fan alone won\'t cool you down. AC or a cool place. And a buddy who checks.', next: 'heat_res' },
        heat_landlord: { speaker: 'inez', text: 'Abe didn\'t feel sick. He felt "cooled off." People who live alone don\'t call. We call them. A buddy for everyone, twice a day. The landlord can sign up last.', next: 'heat_res' },
        heat_res: {
          speaker: 'inez', text: 'Pen\'s in my hand. What goes on the lobby door?',
          choices: [
            { text: 'A buddy list. Every floor, every name, two calls a day.', cond: { mvarMin: { score: 4 } }, tag: 'BEST', effects: { flags: { heat_result: 'good', heat_done: true }, toast: 'POCKET CIVICS · COOLING CENTERS + BE A BUDDY' } },
            { text: 'Your number, and the cooling center number.', cond: { mvarMin: { score: 2 }, mvarMax: { score: 3 } }, effects: { flags: { heat_result: 'ok', heat_done: true }, toast: 'POCKET CIVICS · COOLING CENTERS' } },
            { text: 'A sign that says "Stay cool :)"', cond: { mvarMax: { score: 1 } }, effects: { flags: { heat_result: 'weak', heat_done: true } } },
          ],
        },
        heat_after: { speaker: 'inez', text: 'Buddy list is on the lobby door. Fourteen floors, fourteen captains. Management sent a laminated sign congratulating us. I framed it. Ironically.' },
      },
    },

    // ============================================================ EMILY (boardwalk)
    emily: {
      entries: [{ cond: S(2), node: 'heat_em' }],
      nodes: {
        heat_em: { speaker: 'emily', text: 'Abe? He sits under the Parachute Jump every afternoon. Says it\'s the best shade on Coney. It is not. It\'s a skinny shadow.', next: 'heat_em2' },
        heat_em2: {
          speaker: 'emily', text: 'My cake fridge is all water today. The fondant can wait. Take it. And if his skin is hot and dry, or he\'s confused, that\'s heat stroke. Call 911 right away. Run.',
          choices: [{ text: '(Grab the water and run.)', effects: { items: { groceries: 2 }, flags: { heat_water: true }, rel: { emily: 3 }, toast: 'COLD WATER' } }],
        },
      },
    },

    // ============================================================ ABE (Parachute Jump)
    abe: {
      entries: [
        { cond: S(3), node: 'heat_a0' },
        { cond: S([0, 1, 2]), node: 'heat_apre' },
        { cond: DONE, node: 'heat_aafter' },
        { node: 'heat_aidle' },
      ],
      nodes: {
        heat_apre: { speaker: 'abe', text: 'Hot? I fixed the Cyclone in August of \'77 with no shirt and a wrench. This is nothing. ...Is there water? Asking for a friend.' },
        heat_aidle: { speaker: 'abe', text: 'Hear that? Third car on the Cyclone needs grease. Nobody listens to the rides anymore.' },
        heat_aafter: { speaker: 'abe', text: 'Inez calls me twice a day now. Morning and afternoon. I pretend it\'s annoying. Don\'t tell her I wait by the phone.' },
        heat_a0: { speaker: 'you', text: '*Abe is slumped on a bench in the Parachute Jump\'s skinny shade. His skin is hot and dry. He calls you "Ralphie." Nobody here is named Ralphie.*', next: 'heat_a1' },
        heat_a1: {
          speaker: 'abe', text: 'Ralphie. The Cyclone\'s running slow today. Funny thing, I stopped sweating. Figured it must have cooled off.',
          choices: [
            { text: 'Call 911 now. Then shade, cold water on his skin, and stay with him until they come.', next: 'heat_a911', effects: { mvar: { score: 2 } } },
            { text: 'Get him to a cooling center. Call 311 for the closest one, and walk him there slowly.', next: 'heat_awalk' },
            { text: 'Sit him in the shade, give him Emily\'s water to sip, and check on him again in an hour.', next: 'heat_adog' },
            { text: 'Text Ms. Inez and the Surfside group chat, so someone who knows him can decide.', next: 'heat_achat' },
          ],
        },
        heat_awalk: { speaker: 'you', text: '*Abe makes it four steps and sits back down. Confused, hot, dry skin: that\'s heat stroke. That\'s a 911 call, not a stroll. You call.*', next: 'heat_a911' },
        heat_adog: { speaker: 'you', text: '*Abe looks at the cup like it owes him money and asks for Ralphie again. Confusion and hot, dry skin are signs of heat stroke. Shade and water help, but this is a 911 call. You call.*', next: 'heat_a911' },
        heat_achat: { speaker: 'you', text: '*Fourteen replies. Six say "praying." Three say "who is this." One is a recipe. Confused, hot, dry skin: that\'s heat stroke, and nobody needs a vote. You call 911.*', next: 'heat_a911' },
        heat_a911: { speaker: 'you', text: '*You get him into deeper shade and pour Emily\'s water on his neck and arms. Sirens on Surf Avenue. Abe squints at you. "You\'re not Ralphie." "No, sir."*', next: 'heat_a2' },
        heat_a2: {
          speaker: 'abe', text: 'The EMTs say I\'ll be fine. Ninety-one years, never needed a buddy. Turns out the buddy needed to come find me.',
          choices: [{ text: '(Stay with him until the ambulance doors close.)', effects: { flags: { heat_abe: true }, rel: { abe: 8 }, toast: 'ABE IS SAFE' } }],
        },
      },
    },
  },
};
