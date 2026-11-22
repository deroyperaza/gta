/**
 * VILLAINS (Naim's idea): bosses with lairs around Brooklyn. Walk up and they challenge you: three questions about
 * the issue they stand for. Two wrong answers and they win this round (come back later); three right... well, two of
 * three, and they're beaten for good. Every right answer restates a fact the game already teaches (see lessons.ts and
 * the mission files' sources). All villains are fiction except the Ghost of Al Capone: born in Brooklyn in 1899,
 * convicted of federal income tax evasion in 1931. Satire of systems, not of any community.
 */
import type { Dialogue } from '../systems/dialogue';
import type { NpcDef } from './npcs';

interface Q { q: string; right: string; wrong: [string, string] }
interface Villain extends NpcDef { at: [number, number]; qs: [Q, Q, Q]; intro: string; win: string; lose: string; beaten: string; ghost?: true }

const villain = (v: Omit<Villain, 'idle'> & { idle?: string[] }): Villain => ({ idle: [], ...v });

export const VILLAINS: Villain[] = [
  villain({
    id: 'baron', name: 'Baron Von Rent', short: 'Baron Von Rent', title: 'Villain · Landlord of Everything', district: 'waterfront', spot: 'vl_baron', at: [40.7175, -73.9625], color: '#b8860b',
    look: { skin: '#f0d8c0', hair: '#e8e4f0', style: 'short', shirt: '#2a1a3a', pants: '#2a1a3a', shoes: '#111', acc: 'tie' },
    bio: 'Owns forty buildings and no conscience. Sends eviction notices by drone. Believes "affordable" is a typo.',
    intro: '*A man in a purple velvet suit steps out of a glass tower, a drone buzzing over his shoulder.* Ah, a tenant. Out of your league, out of your lease. Answer me three questions or I raise your rent. Again.',
    qs: [
      { q: 'Your building gets an eviction notice. A free lawyer? Ha! Only rich people get lawyers. Correct?', right: 'Wrong. Right to Counsel: free eviction lawyers if your household is at or under 200% of the poverty line, or has someone 60+.', wrong: ['Right. Free lawyers only come after you lose your first hearing.', 'Right. You only qualify if every adult in the home is over 65.'] },
      { q: 'You think I overcharge? Prove it. Nobody can see an apartment\'s rent history.', right: 'Tenants can request their apartment\'s rent history from the state\'s Homes and Community Renewal agency.', wrong: ['Only the landlord can request rent history, and only once a decade.', 'Rent history is kept by the community board and needs a council vote to see.'] },
      { q: 'Fine. But you\'re alone. One tenant against the Baron!', right: 'Not alone: call 311, ask for the Tenant Helpline, and organize the whole building to meet with the lawyers.', wrong: ['Then I\'ll quietly move out before the court date.', 'Then I\'ll fight you alone, in court, without telling the neighbors.'] },
    ],
    win: 'NO! Not organized tenants with LAWYERS! *The drone drops the eviction notice in a puddle. The Baron flees to his yacht.*',
    lose: 'Ha! Rent goes up on the first. Come back when you\'ve read your notebook, peasant.',
    beaten: '*The Baron peeks out from behind a velvet curtain and hides again.*',
  }),
  villain({
    id: 'redtape', name: 'Captain Red Tape', short: 'Captain Red Tape', title: 'Villain · Master of Forms', district: 'downtown', spot: 'vl_redtape', at: [40.6935, -73.9905], color: '#d8262e',
    look: { skin: '#e8c0a0', hair: '#3a2a1a', style: 'cap', hatColor: '#d8262e', shirt: '#d8262e', pants: '#1a1a20', shoes: '#111', acc: 'clipboard' },
    bio: 'Wrapped in a cape of red tape. Has a form for everything, including a form to request a form. Feeds on missed deadlines.',
    intro: '*A caped figure unrolls a scroll of red tape that never ends.* HALT! Before you do anything nice for your neighbors, you must complete Form 27-B. In triplicate. Or answer my riddles!',
    qs: [
      { q: 'A block party? You must apply... the day before! For free! HAHAHA.', right: 'Apply online at least 60 days ahead. It costs $25. The block signs on and the community board weighs in.', wrong: ['Apply 10 days ahead at the precinct. Free, if the captain likes you.', 'Apply 60 days ahead, but only the community board can issue it.'] },
      { q: 'You want to close a street to cars on Saturdays? Ask the PARKS DEPARTMENT, fool!', right: 'Open Streets: community groups apply to DOT, the city\'s transportation department.', wrong: ['Open Streets: any neighbor can close the block whenever, no application.', 'Open Streets: groups apply to the Parks Department and the precinct.'] },
      { q: 'And your soccer tournament! The field belongs to whoever arrives first!', right: 'Book the city field with an NYC Parks permit; a special event permit costs $25 to process.', wrong: ['Whoever shows up first with cones owns it for the day.', 'Fields can only be booked by schools, never by neighbors.'] },
    ],
    win: 'My tape... it\'s... UNRAVELING! *The Captain spins away like a dropped yo-yo, trailing paperwork.*',
    lose: 'DENIED! Resubmit in 6 to 8 weeks. Bring a pen. Not that pen.',
    beaten: '*The Captain is busy filing a complaint about himself.*',
  }),
  villain({
    id: 'rumor', name: 'The Rumor Mill', short: 'The Rumor Mill', title: 'Villain · Spreader of Nonsense', district: 'sunsetpark', spot: 'vl_rumor', at: [40.6335, -74.0265], color: '#9b59d0',
    look: { skin: '#c8b8d8', hair: '#5a3a6a', style: 'long', shirt: '#6a3a8a', pants: '#3a2a4a', shoes: '#111', acc: 'phone' },
    bio: 'Lives in the group chat. Has forty phones. Every phone is "just asking questions." Gets weaker every time someone checks a fact.',
    intro: '*A swirl of whispers in a purple hoodie, phones buzzing in every pocket.* Did you hear? Did you HEAR? Everybody\'s saying it. Prove me wrong. Three times.',
    qs: [
      { q: 'Did you hear? You can\'t protest without a permit. Not even on the sidewalk!', right: 'On the sidewalk you can, as long as people can still get by. Marching in the street is what needs a parade permit.', wrong: ['True. Every protest needs a permit, even two people on a sidewalk.', 'False. You can march in the street anytime, no permit, if it\'s peaceful.'] },
      { q: 'Everybody knows people with records can never vote again.', right: 'In New York, your right to vote comes back the day you leave prison. You do have to re-register.', wrong: ['In New York, it comes back after parole ends, and only with a judge\'s letter.', 'In New York, it comes back automatically, no re-registering needed, after five years.'] },
      { q: 'Kids? Deciding the city budget? Only adult citizens vote on THAT.', right: 'The People\'s Money: anyone 11 and up can vote on part of the budget, whatever their immigration status.', wrong: ['The People\'s Money: 14 and up, with a green card or citizenship.', 'The People\'s Money: 18 and up, registered voters only.'] },
    ],
    win: '*The phones go quiet one by one.* No... facts... my only weakness... *The Rumor Mill dissolves into a single unread notification.*',
    lose: 'See? Nobody checks! Forward this to ten friends or your feed gets bad luck.',
    beaten: '*A lone phone buzzes: "Fact-checked. Never mind."*',
  }),
  villain({
    id: 'carbon', name: 'Count Carbon', short: 'Count Carbon', title: 'Villain · Heat Lord of the Waterfront', district: 'sunsetpark', spot: 'vl_carbon', at: [40.6560, -74.0130], color: '#5a5a62',
    look: { skin: '#9a9a9a', hair: '#2a2a2a', style: 'bald', shirt: '#3a3a40', pants: '#2a2a30', shoes: '#111', acc: 'scarf' },
    bio: 'Smokestack for a hat (allegedly). Turns up the heat on the hottest blocks, then sells them fans. Allergic to trees, neighbors and air conditioning for everyone.',
    intro: '*A gray count in a smoky cape fans himself while the asphalt shimmers.* A HEAT WAVE! My favorite season. Your neighbors will melt unless you answer me. Three questions!',
    qs: [
      { q: 'It\'s 98 degrees. Where can your grandmother go? Nowhere! Mwahaha.', right: 'A cooling center: find one with the city\'s online Cooling Center Finder or by calling 311, and call ahead.', wrong: ['Call 911 so they can drive her to a cooling center.', 'Any city building: they\'re all open as cooling centers all day.'] },
      { q: 'Checking on old neighbors once a week is plenty!', right: 'In a heat wave, check on older and heat-sensitive neighbors at least twice a day. Be a buddy.', wrong: ['Once a day by text is enough if they reply.', 'Once a week, but bring a fan every time.'] },
      { q: 'Hot, dry skin? Confused? Just give them a fan and walk away!', right: 'Those are heat stroke signs: call 911 right away. Fans alone don\'t cool enough in extreme heat.', wrong: ['Give them water and check back in an hour.', 'Walk them slowly to a cooling center first, then decide.'] },
    ],
    win: 'Curses! Neighbors... checking on neighbors... *Count Carbon evaporates into a small, sad puff of smog.*',
    lose: 'HA! Hotter tomorrow! Bring sunscreen and a better answer.',
    beaten: '*Count Carbon is sulking under a tree. He hates that it helps.*',
  }),
  villain({
    id: 'databroker', name: 'The Data Broker', short: 'The Data Broker', title: 'Villain · Sells Your Secrets', district: 'downtown', spot: 'vl_databroker', at: [40.7035, -73.9885], color: '#2fd1c5',
    look: { skin: '#d8d0c8', hair: '#1a1a1a', style: 'short', shirt: '#1a1a20', pants: '#1a1a20', shoes: '#2fd1c5', acc: 'glasses' },
    bio: 'Knows your shoe size, your crush and your credit score. Runs a hiring robot that rejects anyone who lives in the wrong ZIP code. Has never been audited. Wants to keep it that way.',
    intro: '*A man in black taps a glowing tablet. Your name appears on it. So does your lunch order.* My algorithm says you\'re unhireable. Want to argue with a robot? Three questions.',
    qs: [
      { q: 'My hiring robot is perfect. Nobody can make me check it for bias.', right: 'In NYC, a company using AI to screen job applicants needs an independent bias audit every year, posted publicly.', wrong: ['A bias audit is required once, when the tool is first installed.', 'An audit is only required if a rejected applicant sues.'] },
      { q: 'And I never tell applicants a robot is judging them. Secrets are my business!', right: 'They have to tell you beforehand that an AI tool will be used.', wrong: ['They only have to tell you if you ask in writing after you\'re rejected.', 'They only have to tell you if a human never reads your application.'] },
      { q: 'If I break the rules, who would you even tell? Nobody!', right: 'Report it to the city\'s Department of Consumer and Worker Protection.', wrong: ['Report it to the community board, which can fine the company.', 'Report it to the robot\'s customer service chat.'] },
    ],
    win: 'You read the law?! Nobody reads the law! *The tablet blue-screens. The Data Broker runs off to delete his browser history.*',
    lose: 'Rejected, by an algorithm, in 0.3 seconds. Appeal denied. Have a data-driven day.',
    beaten: '*The Data Broker is filling out a bias audit, very slowly.*',
  }),
  villain({
    id: 'capone', name: 'The Ghost of Al Capone', short: 'Ghost of Al Capone', title: 'Villain · Born in Brooklyn, 1899', district: 'downtown', spot: 'vl_capone', at: [40.6985, -73.9795], color: '#c9b38a', ghost: true,
    look: { skin: '#e8d8c8', hair: '#2a2a2a', style: 'cap', hatColor: '#3a3a40', shirt: '#4a4a52', pants: '#3a3a40', shoes: '#111', acc: 'tie' },
    bio: 'Born in Brooklyn, near the Navy Yard, in 1899. Ran Chicago\'s mob, and it wasn\'t the shootouts that brought him down: in 1931 he was convicted of federal income tax evasion. His ghost came home to Brooklyn. It is still very annoyed about the taxes.',
    intro: '*A translucent man in a pinstripe suit and fedora drifts out of the shadows by the Navy Yard.* Ey. This is my old neighborhood. You know what took me down? Not the cops. The ACCOUNTANTS. So. You think you can follow the money? Prove it.',
    qs: [
      { q: 'Who\'s supposed to watch this city\'s money, huh? Nobody, that\'s who.', right: 'The City Comptroller: audits city agencies and manages the pension funds.', wrong: ['The Mayor audits the Mayor\'s own agencies every year.', 'The Borough President audits all city money in Brooklyn.'] },
      { q: 'Them pension funds vote secret-like at company meetings. Nobody can see.', right: 'Every vote the city\'s pension funds cast is posted on NYC Open Data.', wrong: ['The votes are sealed for 25 years, like a mob file.', 'Only City Council members can see how the funds vote.'] },
      { q: 'And they never caught me for the big stuff, see. So what\'s the lesson?', right: 'Follow the money. The paper trail is what brings down the powerful.', wrong: ['Get a better lawyer, and never write anything down.', 'Only the police can bring down the powerful, so stay out of it.'] },
    ],
    win: '*He tips his ghostly fedora.* ...Follow the money. Smart kid. Smarter than my accountant. *He fades into the fog off the East River.*',
    lose: 'Fuggedaboutit. Come back when you can follow a dollar better than the IRS.',
    beaten: '*The ghost of Capone is counting old ledgers. He looks up and nods, grudgingly.*',
  }),
];

/** Build each villain's boss fight: intro, three questions (two strikes and you lose), then the verdict. */
export function villainDialogue(v: Villain): Dialogue {
  const k = `boss_${v.id}`, nodes: Dialogue['nodes'] = {};
  nodes.intro = { speaker: v.id, text: v.intro, choices: [{ text: 'Bring it.', next: 'q0', effects: { flags: { [`${k}_strikes`]: 0 } } }, { text: 'Not today.', next: 'flee' }] };
  nodes.flee = { speaker: v.id, text: 'Run along. I\'ll be here. Villains are very patient.' };
  v.qs.forEach((q, i) => {
    const nx = i < 2 ? `q${i + 1}` : 'verdict';
    nodes[`q${i}`] = {
      speaker: v.id, text: q.q, shuffle: true,
      choices: [
        { text: q.right, tag: 'FACT', next: `r${i}` },
        { text: q.wrong[0], next: `w${i}`, effects: { inc: { [`${k}_strikes`]: 1 } } },
        { text: q.wrong[1], next: `w${i}`, effects: { inc: { [`${k}_strikes`]: 1 } } },
      ],
    };
    nodes[`r${i}`] = { speaker: 'you', text: '*Direct hit.* ' + q.right, next: nx };
    nodes[`w${i}`] = { speaker: v.id, text: `HA! Wrong! *Actually: ${q.right}*`, next: nx };
  });
  nodes.verdict = {
    speaker: 'you', text: '*The air crackles. The villain staggers... or does it?*',
    choices: [
      { text: '(Finish it.)', cond: { flagMax: { [`${k}_strikes`]: 1 } }, next: 'won', effects: { flags: { [`${k}_down`]: true }, solidarity: 60, power: 2, inc: { villains_beaten: 1 }, toast: `VILLAIN DEFEATED · ${v.short.toUpperCase()}` } },
      { text: '(Regroup.)', cond: { flagMin: { [`${k}_strikes`]: 2 } }, next: 'lost', effects: { solidarity: -10 } },
    ],
  };
  nodes.won = { speaker: v.id, text: v.win };
  nodes.lost = { speaker: v.id, text: v.lose };
  nodes.beaten = { speaker: v.id, text: v.beaten };
  return { entries: [{ cond: { flag: `${k}_down` }, node: 'beaten' }, { node: 'intro' }], nodes };
}

export const VILLAIN_AT: Record<string, [number, number]> = Object.fromEntries(VILLAINS.map((v) => [v.spot, v.at]));
