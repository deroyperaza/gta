/**
 * Brooklyn's neighbors: people you meet on the street who aren't part of a mission (yet). Every heritage, age,
 * ability and income Brooklyn has. Each is a specific person with a life, not a type.
 *
 * Two are written with extra care: Mr. Lewis, who is unhoused, and Danielle, who is in a mental health crisis.
 * The game rewards what actually helps: ask what someone needs, offer choices, respect a no, never lecture,
 * don't call the police on someone who isn't hurting anybody.
 *
 * Facts used (sources in docs/FACTS-brooklyn-org-tensions-care-parks.md):
 * - The Gathering Place: CAMBA's 24/7 drop-in center, 2402 Atlantic Ave (meals, showers, case management).
 * - 311 → street outreach (Breaking Ground holds Brooklyn's 24/7 outreach contract).
 * - 988: call or text, free, 24/7; it doesn't ask about immigration status.
 * - B-HEARD: in parts of Brooklyn (East Flatbush, Brownsville, East New York, Canarsie, Crown Heights...) 911 can send a
 *   mental health team for behavioral emergencies. (Program is moving to FDNY in 2026; the game says only "can send".)
 * - Only 35 of Brooklyn's 156 subway stations are fully accessible (MTA station data).
 * - Bedford Ave bike lane: 14 blocks removed by DOT in December 2009 after Hasidic community complaints.
 * - Brighton Beach: a "Taste of Russia" shop renamed itself "International Food" in 2022.
 * - Midwood: COPO once ran a basketball league with Orthodox Jewish youth (2004 reporting).
 * Everything else here (names, lives, opinions) is fiction.
 */
import type { Dialogue } from '../systems/dialogue';
import type { NpcDef } from './npcs';

interface Neighbor extends NpcDef { at: [number, number]; dialogue: Dialogue }

const met = (id: string) => ({ flags: { [`met_${id}`]: true } });
/** A neighbor's conversation: the first time, then a shorter "again" */
const talk = (id: string, first: Dialogue['nodes'], start: string, again: string): Dialogue => ({
  entries: [{ cond: { flag: `met_${id}` }, node: `${id}_again` }, { node: start }],
  nodes: { ...first, [`${id}_again`]: { speaker: id, text: again } },
});

export const NEIGHBORS: Neighbor[] = [
  // ---------------------------------------------------------------- care and dignity
  {
    id: 'lewis', name: 'Mr. Lewis', short: 'Mr. Lewis', title: 'Neighbor', district: 'downtown', spot: 'nb_lewis', at: [40.6843, -73.9772], color: '#c9b38a',
    look: { skin: '#5a3624', hair: '#bdb7c4', style: 'beanie', hatColor: '#3a5a3a', shirt: '#5a5040', pants: '#3a3a40', shoes: '#2a2018', acc: 'tote' },
    bio: 'Twenty-six years an electrician, union card and all. A surgery, a lost job, a rent he couldn\'t make. Knows every outlet in Atlantic Terminal that actually works.',
    idle: ['Morning.', 'That outlet by the escalator? Works. The others are decorative.', 'People walk past. Some say good morning. That\'s the good part.'],
    dialogue: talk('lewis', {
      lewis_0: {
        speaker: 'lewis', text: '*An older man sits on a folded blanket by the station, a thermos and a paperback beside him. He looks up.* Morning.',
        choices: [
          { text: 'Morning. I\'m going to get a coffee. Want one? Or anything else?', tag: 'BEST', next: 'lewis_ask' },
          { text: 'You can\'t sleep here, you know.', next: 'lewis_cant' },
          { text: '(Nod and keep walking.)', next: 'lewis_nod' },
        ],
      },
      lewis_ask: {
        speaker: 'lewis', text: 'You asked. Most people decide for me. Coffee, light, two sugars. And if you\'ve got five minutes, I\'ll tell you how they wired this station wrong.',
        choices: [
          { text: '(Bring the coffee. Listen to the wiring story.)', effects: { solidarity: 10, rel: { lewis: 6 }, ...met('lewis') }, next: 'lewis_story' },
          { text: '(Give him groceries from your tote.)', cond: { item: { id: 'groceries', min: 1 } }, effects: { items: { groceries: -1 }, solidarity: 12, rel: { lewis: 6 }, ...met('lewis') }, next: 'lewis_story' },
        ],
      },
      lewis_story: {
        speaker: 'lewis', text: '*He tells you. It\'s a good story. The station is, in fact, wired wrong.* ...Some nights I go to the Gathering Place out on Atlantic, by Broadway Junction. Open all night. Shower, a hot meal, somebody who knows your name.',
        choices: [
          { text: 'If you ever want, I can call 311 and ask for an outreach worker. Only if you want.', tag: 'BEST', next: 'lewis_311' },
          { text: 'You should really get into a shelter.', next: 'lewis_lecture' },
        ],
      },
      lewis_311: { speaker: 'lewis', text: 'Not today. Maybe when it gets colder. But thank you for asking first. You\'d be surprised how rare that is.', choices: [{ text: '(See you tomorrow, Mr. Lewis.)', effects: { solidarity: 8, toast: 'POCKET CIVICS · ASK FIRST. 311 FOR OUTREACH. THE GATHERING PLACE IS OPEN 24/7.' } }] },
      lewis_lecture: { speaker: 'lewis', text: 'I know about shelters, friend. I know more about them than you do. Ask a man what he needs. Don\'t tell him.', choices: [{ text: '(You\'re right. Sorry.)', effects: { rel: { lewis: 1 } } }] },
      lewis_cant: { speaker: 'lewis', text: 'I know where I can\'t sleep. Everybody tells me. Nobody tells me where I can. *He goes back to his book.*', choices: [{ text: '(Walk on.)', effects: { rel: { lewis: -4 } } }] },
      lewis_nod: { speaker: 'lewis', text: '*He nods back.* Have a good one.', choices: [{ text: '(Walk on.)', effects: met('lewis') }] },
    }, 'lewis_0', 'Two sugars. You remembered. The escalator outlet\'s still the only honest one in the building.'),
  },
  {
    id: 'danielle', name: 'Danielle', short: 'Danielle', title: 'Neighbor', district: 'flatbush', spot: 'nb_danielle', at: [40.6485, -73.9300], color: '#9fd0ff',
    look: { skin: '#6b3e26', hair: '#1a1010', style: 'curly', shirt: '#4a6e9a', pants: '#2b2b40', shoes: '#f2f2f2' },
    bio: 'Home health aide, mother of a teenager, choir alto. Some days are harder than others. Today is one of them.',
    idle: ['Some days are loud inside.', 'My sister says breathe. I\'m breathing.', 'Thank you for stopping.'],
    dialogue: talk('danielle', {
      danielle_0: {
        speaker: 'you', text: '*A woman by the bus stop is talking fast and loud to no one you can see. People are crossing the street to avoid her. She looks scared.*',
        choices: [
          { text: '(Keep some space. Speak calmly.) "Hi, I\'m with the block association. Are you okay? Do you want some space, or company?"', tag: 'BEST', next: 'danielle_calm' },
          { text: '"Ma\'am, calm down!"', next: 'danielle_loud' },
          { text: '(Call the police.)', next: 'danielle_police' },
        ],
      },
      danielle_calm: {
        speaker: 'danielle', text: '...Company. Not close. Just there. It\'s really loud in my head today and the bus isn\'t coming.',
        choices: [
          { text: '(Stay. Say less.) "I\'m here. We can wait for the bus together. Do you want to call someone? I can call 988 with you. You can talk, or just listen."', tag: 'BEST', next: 'danielle_988' },
          { text: '"Have you tried meditation?"', next: 'danielle_med' },
        ],
      },
      danielle_988: {
        speaker: 'danielle', text: '*She nods. You dial 988 on speaker and hand her the phone. She talks for a while. Her shoulders come down.* ...She said I can call back anytime. Even at 3 a.m. I didn\'t know that.',
        choices: [{ text: '(The bus comes. You both get on.)', effects: { solidarity: 15, rel: { danielle: 8 }, flags: { met_danielle: true }, toast: 'POCKET CIVICS · 988: CALL OR TEXT, FREE, 24/7' } }],
      },
      danielle_med: { speaker: 'danielle', text: '*She laughs, a little.* I sing in a choir. That\'s my meditation. Just... stay a minute.', next: 'danielle_988' },
      danielle_loud: { speaker: 'danielle', text: '*She flinches and backs away down the block, louder now.*', next: 'danielle_farouk' },
      danielle_police: { speaker: 'you', text: '*Before you dial, the man from the corner store steps out.*', next: 'danielle_farouk' },
      danielle_farouk: {
        speaker: 'Mr. Ali, corner store', text: 'She\'s not hurting anybody. Give her room and talk soft. If somebody is in real danger here, call 911 and ask for the mental health team: in this part of Brooklyn they can send B-HEARD instead of police. And 988 is for talking, anytime.',
        choices: [{ text: '(Try again, softer.)', next: 'danielle_calm', effects: { toast: 'POCKET CIVICS · B-HEARD AND 988' } }],
      },
    }, 'danielle_0', 'Choir tonight. Altos carry the whole thing, don\'t let the sopranos tell you different. Thanks for the other day.'),
  },

  // ---------------------------------------------------------------- Brooklyn, every block of it
  {
    id: 'carmen', name: 'Doña Carmen', short: 'Doña Carmen', title: 'Los Sures, Since 1971', district: 'bushwick', spot: 'nb_carmen', at: [40.7095, -73.9605], color: '#ff9f5a',
    look: { skin: '#b07a52', hair: '#e8e4f0', style: 'bun', shirt: '#e8509a', pants: '#2b2b40', shoes: '#f2f2f2', acc: 'glasses', dress: true },
    bio: 'Came from Ponce in 1971. Raised four kids on South 4th. Has run the same domino table on the same corner for thirty years and has never once lost on purpose.',
    idle: ['¡Siéntate! You play?', 'They built a glass tower where the bakery was. The bread was better.', 'Fifty years on this block. I\'m not going anywhere.'],
    dialogue: talk('carmen', {
      carmen_0: { speaker: 'carmen', text: 'You\'re the organizer. Sit, mi amor. Dominoes or conversation? Both is acceptable.', choices: [
        { text: 'Both. Tell me about the block.', next: 'carmen_1' }, { text: 'I\'m in a hurry.', next: 'carmen_hurry' }] },
      carmen_1: { speaker: 'carmen', text: 'When I came, the landlords burned buildings for insurance. We fixed them ourselves. Now the buildings are worth millions and they want us gone. Same fight, nicer windows.', choices: [{ text: '(Play a round. Lose. Honorably.)', effects: { solidarity: 6, rel: { carmen: 5 }, ...met('carmen') } }] },
      carmen_hurry: { speaker: 'carmen', text: 'Everybody\'s in a hurry. That\'s how they get you. Come back and sit.', choices: [{ text: '(Promise to come back.)', effects: met('carmen') }] },
    }, 'carmen_0', 'Double six. Again. Sit down, I\'ll teach you something.'),
  },
  {
    id: 'rivka', name: 'Rivka', short: 'Rivka', title: 'Mother of Six, Lee Ave', district: 'bushwick', spot: 'nb_rivka', at: [40.7040, -73.9585], color: '#c9d2ff',
    look: { skin: '#f0c8a8', hair: '#3a2a1a', style: 'beanie', hatColor: '#2b2b40', shirt: '#1f2a44', pants: '#1f2a44', shoes: '#111', dress: true },
    bio: 'Six kids, a double stroller, a bakery job and a seat on the parents\' committee. Crosses Bedford Ave forty times a day.',
    idle: ['Six kids. One stroller. Do the math.', 'The bikes come fast. The kids come faster.', 'A street for everyone. Nobody agrees what "everyone" means.'],
    dialogue: talk('rivka', {
      rivka_0: { speaker: 'rivka', text: 'You want to know about the bike lane? Everybody wants to know about the bike lane. In 2009 the city took fourteen blocks of it off Bedford. Half the street cheered. Half the street held a funeral for it. On bicycles.', next: 'rivka_1' },
      rivka_1: { speaker: 'rivka', text: 'I have six kids. I want the bikes slow. My neighbor delivers on a bike. He wants the lane. We\'re both right. Nobody ever put us in the same room.', choices: [
        { text: 'Maybe somebody should. Would you sit down with him?', tag: 'BEST', next: 'rivka_2' }, { text: 'Bikes are better for the planet.', next: 'rivka_3' }] },
      rivka_2: { speaker: 'rivka', text: 'If there\'s cake. And if he lets me finish my sentences. ...Yes. Ask Nadine at the Neighbors Center. She does this.', choices: [{ text: '(Write it down.)', effects: { rel: { rivka: 5 }, solidarity: 5, ...met('rivka') } }] },
      rivka_3: { speaker: 'rivka', text: 'And strollers are better for children. See? We could do this all day. Nobody wins.', choices: [{ text: '(Fair.)', effects: met('rivka') }] },
    }, 'rivka_0', 'Three of the six are napping. A miracle. Talk fast.'),
  },
  {
    id: 'chen', name: 'Mr. Chen', short: 'Mr. Chen', title: 'Tai Chi, Every Morning', district: 'sunsetpark', spot: 'nb_chen', at: [40.6455, -74.0080], color: '#ff6b6b',
    look: { skin: '#e8c0a0', hair: '#e8e4f0', style: 'short', shirt: '#f2f2f2', pants: '#2b2b40', shoes: '#111' },
    bio: 'Retired restaurant cook. Came from Fuzhou in 1989. Does tai chi in Sunset Park every morning at six, rain or shine, with eleven other grandparents and one confused jogger.',
    idle: ['Slow is fast.', 'Every morning, six o\'clock. You\'re late.', 'Eighth Avenue was quiet when I came. Now: dumplings everywhere. Good.'],
    dialogue: talk('chen', {
      chen_0: { speaker: 'chen', text: 'You stand like a parking meter. Bend the knees. Breathe. ...Better. Now, what do you want?', choices: [
        { text: 'Just to learn the neighborhood.', next: 'chen_1' }, { text: 'Can you teach me the move where you push the air?', next: 'chen_1' }] },
      chen_1: { speaker: 'chen', text: 'Sunset Park: Chinese, Mexican, Puerto Rican, Dominican, Arab, everybody on one hill. We fight about parking, we agree about rent. Come at six. Bring nothing.', choices: [{ text: '(Push the air. Slowly.)', effects: { solidarity: 5, rel: { chen: 4 }, ...met('chen') } }] },
    }, 'chen_0', 'Six o\'clock tomorrow. Knees bent.'),
  },
  {
    id: 'lupe', name: 'Lupe', short: 'Lupe', title: 'Tamales, Fifth Ave', district: 'sunsetpark', spot: 'nb_lupe', at: [40.6420, -74.0130], color: '#7fd45a',
    look: { skin: '#a8714a', hair: '#1a1010', style: 'braids', shirt: '#ffd23f', pants: '#2b2b40', shoes: '#f2f2f2', acc: 'apron' },
    bio: 'From Puebla. Sells tamales from a cart on Fifth Avenue from 5 a.m. Her daughter is in her first year at Brooklyn College.',
    idle: ['¡Tamales! Rojo, verde, dulce.', 'My daughter studies accounting. She does my taxes now. Strict.', 'Five a.m. is the best hour. Nobody bothers you yet.'],
    dialogue: talk('lupe', {
      lupe_0: { speaker: 'lupe', text: 'Rojo, verde o dulce? ...Good choice. You know, the hardest part of this cart is not the tamales. It\'s the permits. Everybody wants a permit. Nobody gives one.', choices: [
        { text: '(Buy two. Ask about the permits.)', next: 'lupe_1' }] },
      lupe_1: { speaker: 'lupe', text: 'Ask the street vendors\' groups. They organize. Like you. We make the city work at five in the morning, and the city acts surprised every day.', choices: [{ text: '(Eat a tamal. Agree completely.)', effects: { solidarity: 4, rel: { lupe: 4 }, ...met('lupe') } }] },
    }, 'lupe_0', 'Verde today. Trust me.'),
  },
  {
    id: 'olena', name: 'Olena', short: 'Olena', title: 'Brighton Beach Ave', district: 'coneyisland', spot: 'nb_olena', at: [40.5776, -73.9610], color: '#ffd23f',
    look: { skin: '#f6d2b8', hair: '#c9a25a', style: 'bun', shirt: '#2b5fd1', pants: '#2b2b40', shoes: '#111', acc: 'scarf', dress: true },
    bio: 'From Odesa. Thirty years on Brighton Beach Avenue, twenty at the same pharmacy counter. Speaks to Russian customers in Russian and to everyone else in a very strong opinion.',
    idle: ['The sea here is not the Black Sea. But it tries.', 'Buy a scarf. It\'s November. Your neck is a tragedy.', 'Everyone on this avenue has a cousin somewhere hard. Be kind.'],
    dialogue: talk('olena', {
      olena_0: { speaker: 'olena', text: 'Since 2022 this avenue is... careful. The shop on the corner was "Taste of Russia." Now it\'s "International Food." Same pelmeni. Different sign.', next: 'olena_1' },
      olena_1: { speaker: 'olena', text: 'Russians, Ukrainians, Uzbeks, everybody here. We buy bread from the same bakery. Some days we don\'t talk about the news. Some days that\'s peace.', choices: [
        { text: 'Is there anything that brings people together here?', next: 'olena_2' }, { text: '(Buy a scarf.)', next: 'olena_2' }] },
      olena_2: { speaker: 'olena', text: 'Grandchildren. Nobody fights at a grandchild\'s birthday. Put that in your organizing book.', choices: [{ text: '(Write it down.)', effects: { solidarity: 5, rel: { olena: 4 }, ...met('olena') } }] },
    }, 'olena_0', 'You\'re wearing the scarf. Good. Your neck thanks me.'),
  },
  {
    id: 'farida', name: 'Farida', short: 'Farida', title: 'Driver, Kensington', district: 'flatbush', spot: 'nb_farida', at: [40.6400, -73.9760], color: '#2fd1c5',
    look: { skin: '#a8714a', hair: '#1a1010', style: 'hijab', hatColor: '#7b3fe4', shirt: '#2b2340', pants: '#2b2b40', shoes: '#111', acc: 'phone' },
    bio: 'Drives for Surge and Shlep, both, twelve hours a day, so her son can go to Brooklyn Tech. Born in Sylhet, grew up on Church Avenue.',
    idle: ['Surge says I\'m a "partner." Partners get a vote. I don\'t.', 'My son is at Brooklyn Tech. Engineering. Engineering!', 'Twelve hours. Then dinner. Then I sleep like a stone.'],
    dialogue: talk('farida', {
      farida_0: { speaker: 'farida', text: 'You took a Surge last week, didn\'t you. Don\'t lie. Everybody does. You know how much of that fare I saw? Guess.', choices: [
        { text: 'Less than half?', next: 'farida_1' }, { text: 'All of it, plus a tip?', next: 'farida_1' }] },
      farida_1: { speaker: 'farida', text: 'Less than you think. The app sets the price, the app sets my pay, the app can turn me off. The drivers\' groups are organizing. Like you, but in traffic.', choices: [{ text: '(Tip her. In cash.)', effects: { solidarity: 5, rel: { farida: 5 }, ...met('farida') } }] },
    }, 'farida_0', 'Slow night. Means I get home before my son does. That\'s a good night.'),
  },
  {
    id: 'imran', name: 'Imran', short: 'Imran', title: 'Coney Island Ave', district: 'flatbush', spot: 'nb_imran', at: [40.6290, -73.9655], color: '#3f8f3a',
    look: { skin: '#a8714a', hair: '#1a1010', style: 'cap', hatColor: '#f2f2f2', shirt: '#3f8f3a', pants: '#d9c7a3', shoes: '#111' },
    bio: 'Runs a sweets shop on Coney Island Avenue. Came from Lahore. Coaches a youth basketball team that is, by his own account, undefeated in spirit.',
    idle: ['Try the jalebi. Then try saying no to more jalebi.', 'Undefeated in spirit.', 'Our kids and the yeshiva kids? Best pickup games in Brooklyn.'],
    dialogue: talk('imran', {
      imran_0: { speaker: 'imran', text: 'Years ago COPO ran a basketball league here: our boys and the Orthodox boys from down the avenue. They argued about fouls. Then they shared pizza. That\'s the whole secret.', choices: [
        { text: 'Could you start it up again?', tag: 'BEST', next: 'imran_1' }, { text: '(Try the jalebi.)', next: 'imran_2' }] },
      imran_1: { speaker: 'imran', text: 'If somebody finds a gym. And refs. And pizza money. ...You find the gym, I\'ll find the boys.', choices: [{ text: '(Shake on it.)', effects: { rel: { imran: 5 }, solidarity: 5, ...met('imran') } }] },
      imran_2: { speaker: 'imran', text: 'See? You can\'t say no. That\'s how I win every negotiation.', choices: [{ text: '(Have another.)', effects: met('imran') }] },
    }, 'imran_0', 'Found a gym yet? The boys are asking.'),
  },
  {
    id: 'marieclaude', name: 'Sister Marie-Claude', short: 'Sr. Marie-Claude', title: 'Church Usher, Flatbush', district: 'flatbush', spot: 'nb_marieclaude', at: [40.6455, -73.9580], color: '#ffcf6b',
    look: { skin: '#5a3624', hair: '#d8d4dc', style: 'short', shirt: '#f2f2f2', pants: '#2b2b40', shoes: '#111', acc: 'glasses', dress: true },
    bio: 'Head usher at a Haitian church on Church Avenue for thirty-two years. Knows who\'s sick, who\'s new, and who needs a plate, usually before they do.',
    idle: ['Bonjou! You ate?', 'Thirty-two years at that door. I know everybody\'s business. Respectfully.', 'Little Haiti is not a sign. It\'s us.'],
    dialogue: talk('marieclaude', {
      marieclaude_0: { speaker: 'marieclaude', text: 'Bonjou, pitit. You\'re the one running around with flyers. Good. But did you eat? You look like a flyer.', choices: [{ text: 'I haven\'t, actually.', next: 'marieclaude_1' }] },
      marieclaude_1: { speaker: 'marieclaude', text: 'Sunday, after service. Diri ak pwa, griot. Bring two neighbors you don\'t know yet. That\'s the price.', choices: [{ text: '(Accept the invitation.)', effects: { solidarity: 6, rel: { marieclaude: 5 }, ...met('marieclaude') } }] },
    }, 'marieclaude_0', 'Sunday. Two neighbors. I\'m counting.'),
  },
  {
    id: 'darnell', name: 'Coach Darnell', short: 'Darnell', title: 'Youth Coach, Brownsville', district: 'flatbush', spot: 'nb_darnell', at: [40.6625, -73.9125], color: '#ff7a3d',
    look: { skin: '#4a2a1a', hair: '#1a1010', style: 'cap', hatColor: '#d8262e', shirt: '#d8262e', pants: '#1a1a1c', shoes: '#f2f2f2', acc: 'wheelchair' },
    bio: 'Played wheelchair basketball in college. Now coaches thirty kids in Brownsville, some on two feet, some on four wheels. Runs every practice like it\'s the Finals.',
    idle: ['Defense! Defense! ...That was to myself.', 'Thirty kids. Zero excuses.', 'Every ramp is a door. Every missing ramp is a wall.'],
    dialogue: talk('darnell', {
      darnell_0: { speaker: 'darnell', text: 'Away game in Bay Ridge Saturday. Guess how many of the stations between here and there have an elevator I can count on?', choices: [
        { text: 'Not enough?', next: 'darnell_1' }, { text: 'All of them, surely.', next: 'darnell_1' }] },
      darnell_1: { speaker: 'darnell', text: 'In all of Brooklyn: 35 fully accessible stations out of 156. So my team takes two buses and leaves an hour early. We still win. But we shouldn\'t have to win the commute first.', choices: [{ text: '(Promise to bring it to Gary\'s next town hall.)', effects: { solidarity: 6, rel: { darnell: 5 }, ...met('darnell'), toast: 'POCKET CIVICS · 35 OF 156 STATIONS FULLY ACCESSIBLE' } }] },
    }, 'darnell_0', 'We won Saturday. Took two buses. Still won.'),
  },
  {
    id: 'grace', name: 'Ms. Grace', short: 'Ms. Grace', title: 'Retired Teacher, Park Slope', district: 'parkslope', spot: 'nb_grace', at: [40.6725, -73.9790], color: '#b8a0ff',
    look: { skin: '#f0c8a8', hair: '#e8e4f0', style: 'short', shirt: '#7b3fe4', pants: '#2b2b40', shoes: '#111', acc: 'whitecane' },
    bio: 'Taught third grade for thirty-four years. Blind since her forties. Knows Park Slope by sound: the F train under 7th Avenue, the bakery fan, the dog who always barks at the mailbox.',
    idle: ['Scaffolding on every block. My cane has opinions.', 'The bakery fan is on. Must be after eight.', 'Don\'t grab my arm. Offer it.'],
    dialogue: talk('grace', {
      grace_0: { speaker: 'grace', text: 'Someone\'s standing there deciding whether to help me. I can hear you deciding. Go ahead, ask.', choices: [
        { text: 'Would you like a hand crossing, or are you good?', tag: 'BEST', next: 'grace_1' }, { text: '(Take her arm and start walking.)', next: 'grace_2' }] },
      grace_1: { speaker: 'grace', text: 'I\'m good, thank you for asking. But since you\'re here: the restaurant shed on the corner sticks out into the path. Tell your community board. Sidewalks are for walking.', choices: [{ text: '(Make a note.)', effects: { solidarity: 6, rel: { grace: 5 }, ...met('grace') } }] },
      grace_2: { speaker: 'grace', text: 'Whoa. Ask first, dear. Offer your elbow and let me take it. Now: I was going the other way.', choices: [{ text: '(Apologize. Offer your elbow.)', effects: { rel: { grace: 1 }, ...met('grace') } }] },
    }, 'grace_0', 'I know your footsteps now. You walk like you\'re late.'),
  },
  {
    id: 'kwame', name: 'Kwame', short: 'Kwame', title: 'Night Nurse', district: 'flatbush', spot: 'nb_kwame', at: [40.6555, -73.9445], color: '#4fd1a5',
    look: { skin: '#3a2014', hair: '#1a1010', style: 'short', shirt: '#4fd1a5', pants: '#4fd1a5', shoes: '#f2f2f2', acc: 'headphones' },
    bio: 'Night nurse at Kings County. Came from Kumasi for school and stayed for the jollof debates. Sleeps from nine to three, so if you\'re loud at noon, he will find you.',
    idle: ['Twelve-hour shift. Fourteen, really.', 'Ghana jollof. Not up for debate. Except it always is.', 'Sleep is a human right. Tell the jackhammer.'],
    dialogue: talk('kwame', {
      kwame_0: { speaker: 'kwame', text: 'Coming off a night shift. Three stabbings, a baby, and a man who swallowed a key. Talk to me while I wait for the B49.', choices: [{ text: 'How do you do it?', next: 'kwame_1' }] },
      kwame_1: { speaker: 'kwame', text: 'The team. Nobody gets through a night alone. That\'s nursing, and that\'s Brooklyn. Same thing, different shoes.', choices: [{ text: '(Wait for the bus with him.)', effects: { solidarity: 5, rel: { kwame: 4 }, ...met('kwame') } }] },
    }, 'kwame_0', 'Day off. Jollof Sunday. You\'re invited, if you admit Ghana wins.'),
  },
  {
    id: 'jasmine', name: 'Jasmine', short: 'Jasmine', title: 'Poet, 16', district: 'bedstuy', spot: 'nb_jasmine', at: [40.6880, -73.9440], color: '#ff4fa3',
    look: { skin: '#6b3e26', hair: '#1a1010', style: 'afro', shirt: '#ff4fa3', pants: '#2b3a6b', shoes: '#f2f2f2', acc: 'headphones' },
    bio: 'Sixteen. Writes poems on the backs of receipts and performs them at open mics where she is the youngest person by twenty years and the best by more.',
    idle: ['I\'m writing. Don\'t read over my shoulder.', 'Every stoop on this block is a stage.', 'Adults keep asking what I want to be. I\'m already being it.'],
    dialogue: talk('jasmine', {
      jasmine_0: { speaker: 'jasmine', text: 'You want a poem? It\'s free. Everything good is.', choices: [{ text: 'Please.', next: 'jasmine_1' }] },
      jasmine_1: { speaker: 'jasmine', text: '"My block has a fridge that feeds strangers, / a grandmother who knows your name before you do, / and a landlord who doesn\'t. / Guess which one the news calls Brooklyn."', choices: [{ text: '(Snap. Loudly.)', effects: { solidarity: 6, rel: { jasmine: 6 }, ...met('jasmine') } }] },
    }, 'jasmine_0', 'New poem. It\'s about the bus. All my poems are about the bus now.'),
  },
  {
    id: 'yusuf', name: 'Yusuf', short: 'Yusuf', title: 'Age 9, Bay Ridge', district: 'sunsetpark', spot: 'nb_yusuf', at: [40.6345, -74.0230], color: '#ffb23f',
    look: { skin: '#d9a679', hair: '#1a1010', style: 'short', shirt: '#2f8f7a', pants: '#2b3a6b', shoes: '#ff4fa3' },
    bio: 'Nine. Palestinian-American. Has a scooter, a strong opinion about the playground on Fifth Avenue, and a grandmother watching from the window.',
    idle: ['Watch this. ...Okay, don\'t watch that.', 'The swings are broken. ALL of them.', 'My teta makes the best maqluba in Brooklyn. Fact.'],
    dialogue: talk('yusuf', {
      yusuf_0: { speaker: 'yusuf', text: 'Are you a grown-up who fixes things? The swings at the playground are broken. Since forever. Since LAST YEAR.', choices: [
        { text: 'I\'m a grown-up who helps people ask the right person. Want to write a letter?', tag: 'BEST', next: 'yusuf_1' }, { text: 'Grown-ups are busy, kid.', next: 'yusuf_2' }] },
      yusuf_1: { speaker: 'yusuf', text: 'A LETTER? To who? ...The Parks Department? Can I draw on it? I\'m drawing a swing. A working one.', choices: [{ text: '(Help him write it.)', effects: { solidarity: 6, rel: { yusuf: 6 }, ...met('yusuf') } }] },
      yusuf_2: { speaker: 'yusuf', text: 'That\'s what everybody says. That\'s why the swings are broken.', choices: [{ text: '(Ouch. He\'s right.)', effects: met('yusuf') }] },
    }, 'yusuf_0', 'They wrote back! They said "under review." What does that mean? Is that good?'),
  },
  {
    id: 'sloane', name: 'Sloane', short: 'Sloane', title: 'Brooklyn Heights', district: 'downtown', spot: 'nb_sloane', at: [40.6965, -73.9945], color: '#a0e0ff',
    look: { skin: '#f6d2b8', hair: '#c9a25a', style: 'long', shirt: '#f2f2f2', pants: '#d9c7a3', shoes: '#c08a4f', acc: 'phone' },
    bio: 'Lawyer turned stay-at-home parent on Pierrepont Street. Has money, guilt about the money, and a growing suspicion that both should go somewhere useful.',
    idle: ['I want to give. I don\'t want to give badly.', 'Every nonprofit gala has the same salmon.', 'My kids think Brooklyn is the Promenade. It isn\'t.'],
    dialogue: talk('sloane', {
      sloane_0: { speaker: 'sloane', text: 'You\'re an organizer? Okay, honest question: I have money I want to give to Brooklyn. I don\'t know which groups are real, and I don\'t want to be the person who decides what Brownsville needs from Pierrepont Street.', choices: [
        { text: 'Then don\'t decide alone. Brooklyn Org lets neighbors pick the grantees.', tag: 'BEST', next: 'sloane_1' }, { text: 'Give it all to me.', next: 'sloane_2' }] },
      sloane_1: { speaker: 'sloane', text: 'The community foundation? Over on Hanson Place? ...Neighbors decide where the grants go. That\'s exactly the humility I can\'t manage on my own. I\'ll call them.', choices: [{ text: '(Give her the number.)', effects: { solidarity: 8, rel: { sloane: 5 }, ...met('sloane') } }] },
      sloane_2: { speaker: 'sloane', text: 'Ha. No. But you\'re the first person this year who didn\'t try to sell me salmon.', choices: [{ text: '(Fair.)', effects: met('sloane') }] },
    }, 'sloane_0', 'I called them. I\'m on a donor tour of Brownsville next week. I\'m bringing nothing but my ears.'),
  },
  {
    id: 'luis', name: 'Luis', short: 'Luis', title: 'Muralist, Bushwick', district: 'bushwick', spot: 'nb_luis', at: [40.7010, -73.9215], color: '#ff6bd6',
    look: { skin: '#b07a52', hair: '#1a1010', style: 'cap', hatColor: '#2fd1c5', shirt: '#5a5a62', pants: '#2b3a6b', shoes: '#f2f2f2', acc: 'bandana' },
    bio: 'Dominican-American, born on Knickerbocker Ave. Paints murals of the neighbors who were here before the murals were cool. Gets hired by the galleries that replaced them, which he finds very funny.',
    idle: ['This wall used to be a laundromat. Now it\'s "content."', 'I paint the people who were here first.', 'Every mural needs a permission slip. Ask the building. Ask the block.'],
    dialogue: talk('luis', {
      luis_0: { speaker: 'luis', text: 'People take selfies in front of my murals and don\'t know who\'s in them. That\'s Señora Ruiz. Forty years on this block. The rent took her to Allentown.', choices: [{ text: 'Paint her a plaque. With her name.', tag: 'BEST', next: 'luis_1' }, { text: 'It\'s a great backdrop, though.', next: 'luis_1' }] },
      luis_1: { speaker: 'luis', text: 'A name. Yes. A mural with no names is wallpaper. Help me hand out flyers for the block meeting? We\'re choosing the next wall together.', choices: [{ text: '(Take a stack.)', effects: { items: { flyers: 4 }, rel: { luis: 5 }, ...met('luis') } }] },
    }, 'luis_0', 'Next wall: the whole block voted. It\'s the domino players. Obviously.'),
  },
  {
    id: 'harjit', name: 'Harjit', short: 'Harjit', title: 'B82 Operator', district: 'flatbush', spot: 'nb_harjit', at: [40.6470, -73.8850], color: '#ff9f3d',
    look: { skin: '#a8714a', hair: '#1a1010', style: 'turban', hatColor: '#e0702d', shirt: '#2f4f8f', pants: '#1f2a44', shoes: '#111' },
    bio: 'Drives the B82 from Bensonhurst to Starrett City. Sikh, from Richmond Hill, married to a Canarsie girl. Knows the name of every regular and the birthday of half of them.',
    idle: ['Mrs. Feldman! Happy birthday!', 'The B82 is long. Life is long. Sit down.', 'No subway out here. So the bus is everything.'],
    dialogue: talk('harjit', {
      harjit_0: { speaker: 'harjit', text: 'Out here, past Flatbush, there\'s no train. My bus is the train. Nurses, students, the man with the parrot. If I\'m late, they\'re late.', choices: [{ text: 'What would make your route better?', next: 'harjit_1' }] },
      harjit_1: { speaker: 'harjit', text: 'Bus lanes. Signals that know I\'m coming. And people at the meetings when the city redraws the routes. The riders who need it most can\'t get off work to show up. Somebody should bring their voices.', choices: [{ text: '(Promise to bring them.)', effects: { solidarity: 6, rel: { harjit: 5 }, ...met('harjit') } }] },
    }, 'harjit_0', 'The man with the parrot says hi. The parrot does not.'),
  },
];

export const NEIGHBOR_AT: Record<string, [number, number]> = Object.fromEntries(NEIGHBORS.map((n) => [n.spot, n.at]));
