import type { Dialogue } from '../systems/dialogue';

const S = (id: string, is: number | number[]) => ({ missionStage: { id, is } });
const DONE = (id: string) => ({ missionStatus: { id, is: 'complete' as const } });

export const DIALOGUES: Record<string, Dialogue> = {
  // ============================================================ DEE
  dee: {
    entries: [
      { cond: S('stock', 0), node: 'intro' },
      { cond: S('stock', 1), node: 'collecting' },
      { cond: S('stock', 2), node: 'deliver' },
      { cond: S('stock', 3), node: 'thanks' },
      { cond: { ...DONE('stock'), notFlag: 'circle_done' }, node: 'pointHattie' },
      { node: 'after' },
    ],
    nodes: {
      intro: { speaker: 'dee', text: 'You. Yeah, you with the jury-duty face. You look like somebody with two free hands.', next: 'intro2' },
      intro2: {
        speaker: 'dee', text: 'Fridge is down to one lime and a sticky note that says "stay strong." Three spots promised donations and nobody\'s picked up.',
        choices: [
          { text: 'I\'m in. Where do I go?', next: 'brief', effects: { rel: { dee: 5 } } },
          { text: 'Isn\'t feeding people the government\'s job?', next: 'govjob' },
          { text: 'What\'s in it for me?', next: 'whatsin', effects: { rel: { dee: -2 } } },
        ],
      },
      govjob: { speaker: 'dee', text: 'It is! Go tell them. Borough Hall\'s right there. I\'ll wait here. With the lime.', choices: [{ text: '...Fair point. I\'m in.', next: 'brief', effects: { rel: { dee: 3 } } }] },
      whatsin: { speaker: 'dee', text: 'Solidarity, baby. Also Farouk might slip you a free chopped cheese. You didn\'t hear that from me.', choices: [{ text: 'Say no more.', next: 'brief' }] },
      brief: { speaker: 'dee', text: 'Three pickups: Brendan at the Righteous Turnip Co-op in Park Slope — bring patience. Farouk\'s bodega up north on this side. And Juni at the Sourdough Collective out in Bushwick.', next: 'brief2' },
      brief2: {
        speaker: 'dee', text: 'Produce wilts, so you got a clock once you leave. Legs decorative? Grab a BK Spokes bike at a dock. And take these flyers — hand \'em out [SPACE] so folks know the fridge exists.',
        choices: [{ text: 'Let\'s stock the block.', effects: { items: { flyers: 10 }, flags: { stb_accepted: true } } }],
      },
      collecting: { speaker: 'dee', text: 'Why are you still talking to me? Co-op, bodega, bakery. Go go GO. The lime is getting lonely.' },
      deliver: { speaker: 'dee', text: 'Is that... vegetables? Don\'t show ME. Put \'em in the fridge! [E] at the fridge.' },
      thanks: {
        speaker: 'dee', text: 'Look at that. A FULL fridge. Kids on this block are eating tonight because you showed up. ...Don\'t make it weird.',
        choices: [
          { text: 'It took all of us.', effects: { rel: { dee: 8 }, flags: { stb_thanked: true } } },
          { text: 'Do I get a plaque?', next: 'plaque' },
        ],
      },
      plaque: { speaker: 'dee', text: 'You get the lime. It\'s yours now. Guard it with your life.', choices: [{ text: '(Accept the lime with dignity.)', effects: { rel: { dee: 4 }, flags: { stb_thanked: true, has_lime: true } } }] },
      pointHattie: { speaker: 'dee', text: 'Ms. Hattie wants to see you at the Gates Ave Community Center, just south. When Hattie asks, you go. That\'s not advice, that\'s physics.' },
      after: { speaker: 'dee', text: 'Juni say anything about "band-aids on capitalism"? Yeah. We argue every week. And every week, we both show up. That\'s the whole thing.' },
    },
  },

  // ============================================================ BRENDAN
  brendan: {
    entries: [
      { cond: { ...S('stock', 1), notFlag: 'stb_coop' }, node: 'pickup' },
      { node: 'idle' },
    ],
    nodes: {
      pickup: {
        speaker: 'brendan', text: 'Welcome, comrade-adjacent! Before we release the produce, the Turnip requires a brief land, labor, and lettuce acknowledgment.',
        choices: [
          { text: 'Hold space for the lettuce. (Listen respectfully)', next: 'listen', effects: { time: -15, rel: { brendan: 10 }, trust: { parkslope: 5 } } },
          { text: 'Brendan. People are hungry. Now.', next: 'blunt', effects: { rel: { brendan: -3, dee: 3 } } },
          { text: 'I\'d love to join a committee about this.', next: 'committee', effects: { time: -8, flags: { joined_committee: true }, trust: { parkslope: 8 }, rel: { brendan: 6 } } },
        ],
      },
      listen: { speaker: 'brendan', text: '...and finally, we honor the kale, which never consented to being trendy. Thank you. Here: two crates and a zine about the crates.', choices: [{ text: '(Take the groceries.)', effects: { items: { groceries: 1 }, flags: { stb_coop: true } } }] },
      blunt: { speaker: 'brendan', text: 'Wow. Okay. That\'s... honestly a really valid boundary. I\'m going to journal about this. Take the crates.', choices: [{ text: '(Take the groceries.)', effects: { items: { groceries: 1 }, flags: { stb_coop: true } } }] },
      committee: { speaker: 'brendan', text: 'YES. The Subcommittee on Fridge Outreach meets... let me check... every hour, forever. Here are the groceries. Welcome to the struggle (session).', choices: [{ text: '(Take the groceries. Regret nothing.)', effects: { items: { groceries: 1 }, flags: { stb_coop: true } } }] },
      idle: { speaker: 'brendan', text: 'Have you seen our new Kombucha Reparations Fund? It\'s mostly kombucha right now, but the reparations are coming.' },
    },
  },

  // ============================================================ FAROUK
  farouk: {
    entries: [
      { cond: { ...S('stock', 1), notFlag: 'stb_bodega' }, node: 'pickup' },
      { node: 'idle' },
    ],
    nodes: {
      pickup: {
        speaker: 'farouk', text: 'Dee sent you? Say less. I put a box aside: rice, plantains, bread, and — because I am a generous man — the GOOD hot sauce.',
        choices: [
          { text: 'Farouk, you\'re a legend.', next: 'cat', effects: { rel: { farouk: 8 }, items: { groceries: 1 }, flags: { stb_bodega: true } } },
          { text: 'Can I put a chopped cheese on credit too?', next: 'credit', effects: { rel: { farouk: 5 }, items: { groceries: 1 }, flags: { stb_bodega: true } } },
        ],
      },
      credit: { speaker: 'farouk', text: 'Everything on this block is on credit, my friend. Pay me in gossip. Who\'s Brendan dating?', next: 'cat' },
      cat: { speaker: 'farouk', text: 'One more thing. Commissioner Whiskers is on patrol outside. If he lets you pet him, that\'s good luck. If he doesn\'t... that\'s politics.' },
      idle: { speaker: 'farouk', text: 'Twenty-two years on this corner. Three landlords. One cat. The cat is the only one who never raised my rent.' },
    },
  },

  // ============================================================ JUNI
  juni: {
    entries: [
      { cond: { ...S('stock', 1), notFlag: 'stb_bakery' }, node: 'pickup' },
      { cond: DONE('stock'), node: 'after' },
      { node: 'idle' },
    ],
    nodes: {
      pickup: {
        speaker: 'juni', text: 'Bread for the fridge? Sure. But real talk: fridges don\'t stop evictions. We should be organizing the landlords out of existence.',
        choices: [
          { text: 'Why not both? Feed people today, organize tomorrow.', next: 'both', effects: { rel: { juni: 6, dee: 3 }, trust: { bushwick: 5 } } },
          { text: 'You\'re right. The fridge is just a band-aid.', next: 'right', effects: { rel: { juni: 10, dee: -5 }, trust: { bushwick: 8 } } },
          { text: 'Juni. I just need the bread.', next: 'bread', effects: { rel: { juni: -2 } } },
        ],
      },
      both: { speaker: 'juni', text: 'Ugh. Dee\'s rubbing off on you. ...Fine. Loaves are on the rack. Take these posters too — slap \'em on a wall [SPACE]. Make the block look at itself.', choices: [{ text: '(Take bread + posters.)', effects: { items: { groceries: 1, posters: 3 }, flags: { stb_bakery: true } } }] },
      right: { speaker: 'juni', text: 'FINALLY someone gets it. Here\'s bread anyway, because I\'m not a monster. And posters. Wheatpaste is the people\'s glue.', choices: [{ text: '(Take bread + posters.)', effects: { items: { groceries: 1, posters: 3 }, flags: { stb_bakery: true } } }] },
      bread: { speaker: 'juni', text: 'Honest. Respect. Bread\'s on the rack. Posters are free, like the bread should be.', choices: [{ text: '(Take bread + posters.)', effects: { items: { groceries: 1, posters: 3 }, flags: { stb_bakery: true } } }] },
      after: { speaker: 'juni', text: 'Heard the fridge is full. Good. Now imagine if the BUILDINGS were full of people who weren\'t paying 60% of their income in rent. Next phase, comrade.' },
      idle: { speaker: 'juni', text: 'Every loaf is a little general strike. That\'s not a metaphor. Okay, it\'s a little bit of a metaphor.' },
    },
  },

  // ============================================================ HATTIE + THE CIRCLE
  hattie: {
    entries: [
      { cond: { missionStatus: { id: 'stock', is: ['active', 'available', 'locked'] } }, node: 'early' },
      { cond: S('circle', 0), node: 'c0' },
      { cond: DONE('circle'), node: 'after' },
      { node: 'early' },
    ],
    nodes: {
      early: { speaker: 'hattie', text: 'You\'re the one Dee\'s got running around? Mm. Come back when that fridge is full. Then we\'ll talk about real work.' },
      c0: { speaker: 'hattie', text: 'Sit. Two neighbors, one ceiling. Marcus upstairs plays music. Priya downstairs works nights. Things have been said. Words like "petty." Words like "I\'m calling the landlord."', next: 'c1' },
      c1: {
        speaker: 'hattie', text: 'In this circle we speak with the stick and listen with the whole body. Today, you\'re facilitating.',
        choices: [
          { text: 'Me? I just got here.', next: 'c1b' },
          { text: 'I\'m honored, Ms. Hattie.', next: 'c2', effects: { rel: { hattie: 4 } } },
        ],
      },
      c1b: { speaker: 'hattie', text: 'That\'s exactly why. Nobody\'s mad at you yet. Give it twenty minutes.', next: 'c2' },
      c2: {
        speaker: 'marcus', text: 'I\'m not trying to be a problem. I practice my sets at night \'cause that\'s when I\'m home from the MTA yard. And she bangs on the ceiling with a BROOM. Like it\'s 1890.',
        choices: [
          { text: 'It sounds like you feel disrespected.', next: 'm_heard', effects: { mvar: { marcus: 1 } } },
          { text: 'When are you actually free to practice?', next: 'm_sched', effects: { mvar: { marcus: 1, needs: 1 } } },
          { text: 'Have you considered... headphones?', next: 'm_head', effects: { mvar: { marcus: -1 } } },
          { text: 'The broom thing is honestly kind of iconic.', next: 'm_broom', effects: { mvar: { marcus: 1, priya: -1 } } },
        ],
      },
      m_heard: { speaker: 'marcus', text: 'Yeah. Disrespected. I DJ\'d her cousin\'s wedding for free! ...She doesn\'t know that. Nobody asked.', next: 'c3' },
      m_sched: { speaker: 'marcus', text: 'Honestly? Weekdays I\'m off at 2. Afternoons are wide open. I just never thought about it, \'cause the night is when the vibes are.', next: 'c3' },
      m_head: { speaker: 'marcus', text: 'Headphones. Wow. Tell a painter to use invisible paint while you\'re at it.', next: 'c3' },
      m_broom: { speaker: 'priya', text: 'It is NOT iconic. It\'s the only tool I have. I am four feet away from a man\'s subwoofer, spiritually.', next: 'c3' },
      c3: {
        speaker: 'priya', text: 'I work twelve-hour shifts keeping people alive. I sleep nine to three. His bass comes through my floor at 11pm AND at 8am. I\'m not petty. I\'m exhausted.',
        choices: [
          { text: 'So the real need is reliable sleep in the daytime.', next: 'p_need', effects: { mvar: { priya: 1, needs: 1 } } },
          { text: 'That sounds unbearable. You\'re carrying a lot.', next: 'p_heard', effects: { mvar: { priya: 1 } } },
          { text: 'Marcus, apologize to her.', next: 'p_force', effects: { mvar: { marcus: -1 } } },
          { text: 'Have you tried earplugs?', next: 'p_ear', effects: { mvar: { priya: -1 } } },
        ],
      },
      p_need: { speaker: 'priya', text: 'Yes. Thank you. I don\'t need him to stop. I need to know WHEN. Predictability is the whole thing.', next: 'c4' },
      p_heard: { speaker: 'priya', text: '...Yeah. I am. Thank you for saying that out loud.', next: 'c4' },
      p_force: { speaker: 'hattie', text: 'Mm-mm. We don\'t make anybody do anything in this circle, baby. Apologies that get assigned don\'t hold water.', next: 'c4' },
      p_ear: { speaker: 'priya', text: 'Earplugs. I have earplugs. I have earplugs in my earplugs. The bass goes through BONE.', next: 'c4' },
      c4: {
        speaker: 'hattie', text: 'Mm-hm. Now. Did anybody notice what they BOTH said about the floor?',
        choices: [
          { text: 'The floor. The sound goes straight through it.', next: 'c5', effects: { mvar: { needs: 1 }, rel: { hattie: 5 } } },
          { text: 'Not... really?', next: 'c4b' },
        ],
      },
      c4b: { speaker: 'hattie', text: 'The FLOOR, baby. Look at the floor.', next: 'c5' },
      c5: { speaker: 'marcus', text: 'Wait. The landlord ripped out all the old carpet last year. Called it "luxury hardwood." Raised my rent two hundred.', next: 'c5b' },
      c5b: { speaker: 'priya', text: '...He did the same thing in my unit. Took out the insulation, raised the rent, called it a "renovation." Oh my god.', next: 'c6' },
      c6: {
        speaker: 'hattie', text: 'So. What do we agree to?',
        choices: [
          { text: 'Marcus practices 3–7pm weekdays, music down by 10. AND you both send the landlord a joint demand to restore the soundproofing.', cond: { mvarMin: { needs: 2, marcus: 1, priya: 1 } }, next: 'good', tag: 'BEST', effects: { flags: { circle_result: 'good' } } },
          { text: 'Quiet hours after 10pm. Headphones on weeknights.', next: 'ok', effects: { flags: { circle_result: 'ok' } } },
          { text: 'Let\'s just let the landlord sort it out.', next: 'bad', effects: { flags: { circle_result: 'bad' } } },
        ],
      },
      good: { speaker: 'marcus', text: 'I could do that. And honestly? I\'d LOVE to yell at the landlord with somebody.', next: 'good2' },
      good2: { speaker: 'priya', text: 'I\'ll bring the broom. For symbolism.', next: 'good3' },
      good3: { speaker: 'hattie', text: 'And THAT is how a tenant association gets started. Two tired people and a common enemy. Good work, baby.', choices: [{ text: '(Pass the talking stick back.)', effects: { flags: { circle_done: true }, rel: { marcus: 10, priya: 10, hattie: 10 } } }] },
      ok: { speaker: 'hattie', text: 'It\'s a deal. Not a friendship. But a deal\'s a start. Somebody still has to fix that floor.', choices: [{ text: '(Pass the talking stick back.)', effects: { flags: { circle_done: true }, rel: { marcus: 3, priya: 3 } } }] },
      bad: { speaker: 'hattie', text: 'The landlord, baby? He\'s the reason that floor sounds like a drum. ...We\'ll sit again next week. Circles are patient.', choices: [{ text: '(Pass the stick back, sheepishly.)', effects: { flags: { circle_done: true }, rel: { hattie: -3 } } }] },
      after: {
        speaker: 'hattie', text: 'Movements move at the speed of trust. You\'re building some. Now go rest — or don\'t, I\'m not your mother. Downtown\'s about to get loud.',
        choices: [{ text: 'Where do grown-ups fight about the neighborhood?', next: 'cb' }, { text: 'Yes, Ms. Hattie.' }],
      },
      cb: { speaker: 'hattie', text: 'Community board. Brooklyn has 18 of them. Up to 50 unpaid neighbors each, appointed by the Borough President. They weigh in on rezonings, liquor licenses, bike lanes.', next: 'cb2' },
      cb2: {
        speaker: 'hattie', text: 'Their vote is advisory, but the city hears it. Every meeting has a public session where anybody can speak for two minutes. I have not missed one since 1987.',
        choices: [{ text: 'See you at the next one.', effects: { rel: { hattie: 4 }, solidarity: 6, trust: { bedstuy: 2 }, toast: 'POCKET CIVICS · COMMUNITY BOARDS' } }],
      },
    },
  },

  marcus: {
    entries: [{ cond: { flag: 'circle_done' }, node: 'post' }, { node: 'pre' }],
    nodes: {
      pre: { speaker: 'marcus', text: 'You here for the circle? Ms. Hattie\'s inside. I brought snacks. Peace-offering snacks.' },
      post: { speaker: 'marcus', text: 'Me and Priya are drafting the landlord letter. She writes like a surgeon. I\'m doing the font.' },
    },
  },
  priya: {
    entries: [{ cond: { flag: 'circle_done' }, node: 'post' }, { node: 'pre' }],
    nodes: {
      pre: { speaker: 'priya', text: 'I\'m only here because Ms. Hattie asked. Nobody says no to Ms. Hattie. I tried once. In 2019.' },
      post: { speaker: 'priya', text: 'Slept six whole hours yesterday. SIX. I feel like a renaissance painting.' },
    },
  },

  // ============================================================ DOWNTOWN CAST (teases later missions)
  gary: {
    entries: [{ cond: { ...DONE('stock'), notFlag: 'gary_photo' }, node: 'photo' }, { node: 'idle' }],
    nodes: {
      idle: { speaker: 'gary', text: 'There\'s a big demonstration forming outside Borough Hall soon. I\'ll be very supportive. From inside. With the windows closed.' },
      photo: {
        speaker: 'gary', text: 'I heard about the community fridge! Inspiring. Can I get a photo with it? For the newsletter. And the other newsletter.',
        choices: [
          { text: 'Sure — if the city funds it.', next: 'fund' },
          { text: 'You can take a photo when you take a stand.', next: 'stand', effects: { rel: { gary: -5 }, trust: { bedstuy: 4 }, solidarity: 10 } },
        ],
      },
      fund: { speaker: 'gary', text: '"Fund" is a strong word. How about a proclamation? It\'s like funding, but on nicer paper.', choices: [{ text: '...I\'ll take the paper.', effects: { flags: { gary_photo: true }, power: 1, rel: { gary: 5 } } }] },
      stand: { speaker: 'gary', text: 'Ooh. Spicy. My photographer liked that. Can you say it again but angrier?', choices: [{ text: '(Walk away.)', effects: { flags: { gary_photo: true } } }] },
    },
  },
  tyler: {
    entries: [{ node: 'pitch' }],
    nodes: {
      pitch: {
        speaker: 'tyler', text: 'Heyyy! Love the grassroots vibe! We\'re building 400 luxury units on Fulton. Six are "affordable" — if you make $140K. Community board meeting soon. Bring friends! Actually, don\'t.',
        choices: [
          { text: 'Affordable for WHO, Tyler?', next: 'who', effects: { rel: { tyler: -3 }, trust: { bedstuy: 2 } } },
          { text: 'Cool vest.', next: 'vest', effects: { rel: { tyler: 3 } } },
        ],
      },
      who: { speaker: 'tyler', text: 'For the community! The new community. That we\'re... bringing. Anyway — rooftop yoga!' },
      vest: { speaker: 'tyler', text: 'Thanks! It\'s from my "Tuesday" collection. I have a vest for every day of the displacement.' },
    },
  },
  skye: {
    entries: [{ cond: { notFlag: 'skye_shoutout' }, node: 'live' }, { node: 'idle' }],
    nodes: {
      live: {
        speaker: 'skye', text: 'Hiii besties, I\'m LIVE with a real activist!!! Say something activist!',
        choices: [
          { text: 'Feed the block. Community fridge on Gates Ave. Take what you need.', next: 'shout', effects: { attention: 8, rel: { skye: 6 }, flags: { skye_shoutout: true } } },
          { text: 'No cameras, please.', next: 'nocam', effects: { rel: { skye: -2, juni: 2 }, flags: { skye_shoutout: true } } },
        ],
      },
      shout: { speaker: 'skye', text: 'Chat is going CRAZY. Three people said "slay" and one said "is this an ad." It\'s not an ad! ...Is it? Use code SKYE10.' },
      nocam: { speaker: 'skye', text: 'Omg, the mysterious activist aesthetic. Respect. I\'ll blur you. Hand-blur. With my thumb.' },
      idle: { speaker: 'skye', text: 'My detox tea sponsor wants to "partner with the movement." I said the movement doesn\'t drink tea. Juni said the movement drinks whatever\'s free.' },
    },
  },

  // ============================================================ DEROY · storytelling + AI accountability
  deroy: {
    entries: [{ cond: { notFlag: 'met_deroy' }, node: 'intro' }, { node: 'after' }],
    nodes: {
      intro: {
        speaker: 'deroy', text: 'Facts don\'t move people. Stories do. "Rents are up 30%" gets a nod. "Ms. Alvarez paid rent here for 40 years" gets a crowd.',
        choices: [
          { text: 'So how do I tell ours?', next: 'story', effects: { rel: { deroy: 5 }, flags: { met_deroy: true } } },
          { text: 'And where does AI fit in?', next: 'ai', effects: { flags: { met_deroy: true } } },
          { text: 'Can I just make a logo?', next: 'logo', effects: { rel: { deroy: 2 }, flags: { met_deroy: true } } },
        ],
      },
      story: { speaker: 'deroy', text: 'One real person. One clear stake. One thing we\'re asking for. Lead with what we share, not who we\'re mad at. That\'s narrative change: you\'re not winning an argument, you\'re changing what feels normal.', next: 'ai' },
      ai: { speaker: 'deroy', text: 'Here\'s a story most people don\'t know. In New York City, if a company uses AI to screen job applicants, it has to get an independent bias audit every year and post the results.', next: 'ai2' },
      ai2: {
        speaker: 'deroy', text: 'And they have to tell you beforehand. It\'s Local Law 144. You can report a company that skips it to the city\'s Department of Consumer and Worker Protection. AI can do good. Somebody has to check its homework.',
        choices: [{ text: 'Telling that story tonight.', effects: { rel: { deroy: 6 }, solidarity: 10, attention: 3, trust: { bedstuy: 3 }, toast: 'POCKET CIVICS · AI HIRING AUDITS' } }],
      },
      logo: { speaker: 'deroy', text: 'A logo is the last thing. First you figure out who you are and what you want. Then the logo just says it out loud. Ask me how I know.' },
      after: { speaker: 'deroy', text: 'One person. One stake. One ask. Tell it again until the neighborhood tells it for you.' },
    },
  },

  // ============================================================ JENNA · participatory budgeting + facilitation
  jenna: {
    entries: [{ cond: { notFlag: 'met_jenna' }, node: 'intro' }, { node: 'after' }],
    nodes: {
      intro: {
        speaker: 'jenna', text: 'People don\'t come back to meetings. They come back to people. The secret is the one-on-one before the meeting, not the meeting itself.',
        choices: [
          { text: 'Teach me the one-on-one.', next: 'oneonone', effects: { rel: { jenna: 5 }, flags: { met_jenna: true } } },
          { text: 'What do we gather people around?', next: 'pb', effects: { flags: { met_jenna: true } } },
          { text: 'Do you bring snacks?', next: 'snacks', effects: { rel: { jenna: 2 }, flags: { met_jenna: true } } },
        ],
      },
      oneonone: { speaker: 'jenna', text: 'Coffee. Twenty minutes. Ask what they care about and then actually listen. Don\'t pitch. By the end they\'ll tell you what they\'d show up for.', next: 'pb' },
      pb: { speaker: 'jenna', text: 'Try this: The People\'s Money. New Yorkers decide how to spend part of the city budget in their borough. You pitch ideas, then everyone votes.', next: 'pb2' },
      pb2: {
        speaker: 'jenna', text: 'Anyone 11 and up can vote, whatever their immigration status. That means the kids on your block get a ballot. Gather them.',
        choices: [{ text: 'Hosting an idea session.', effects: { rel: { jenna: 6 }, solidarity: 10, trust: { bedstuy: 3 }, toast: 'POCKET CIVICS · THE PEOPLE\'S MONEY' } }],
      },
      snacks: { speaker: 'jenna', text: 'Always. But I put the snacks at the back of the room so people have to walk past each other. Facilitation is mostly furniture.' },
      after: { speaker: 'jenna', text: 'Who did you have coffee with this week? That\'s the whole question.' },
    },
  },

  // ============================================================ NELL · tenants' rights
  nell: {
    entries: [{ cond: { notFlag: 'met_nell' }, node: 'intro' }, { node: 'after' }],
    nodes: {
      intro: {
        speaker: 'nell', text: 'Landlord dragging you to Housing Court? Don\'t show up alone. In this city, a lot of tenants have a right to a free lawyer.',
        choices: [
          { text: 'Wait, a free lawyer?', next: 'rtc', effects: { rel: { nell: 5 }, flags: { met_nell: true } } },
          { text: 'How do I know if my rent is legal?', next: 'rent', effects: { flags: { met_nell: true } } },
          { text: 'Can we start a tenants association?', next: 'ta', effects: { rel: { nell: 3 }, flags: { met_nell: true } } },
        ],
      },
      rtc: { speaker: 'nell', text: 'Right to Counsel. NYC was the first city to pass it. If your household makes at or below 200% of the federal poverty line, you get a lawyer in eviction cases. Free.', next: 'rtc2' },
      rtc2: {
        speaker: 'nell', text: 'Most tenants who have a lawyer get to stay home. Most who show up alone don\'t. So call 311 and ask for Right to Counsel before your court date.',
        choices: [{ text: 'Telling the whole building.', effects: { rel: { nell: 6 }, solidarity: 10, trust: { plg: 3 }, toast: 'POCKET CIVICS · RIGHT TO COUNSEL' } }],
      },
      rent: { speaker: 'nell', text: 'If you\'re rent stabilized, ask the state\'s housing agency, Homes and Community Renewal, for your rent history. It\'s free. If the numbers don\'t add up, that\'s an overcharge case.', next: 'rtc' },
      ta: { speaker: 'nell', text: 'Yes. Organizing is protected by state law, and your landlord can\'t retaliate. Group chat, sign-in sheet, door knocking. And for no heat, 311 sends an HPD inspector.', next: 'rtc' },
      after: { speaker: 'nell', text: 'Never go to Housing Court alone. Say it with me.' },
    },
  },

  // ============================================================ BRIDGETTE · voting rights after prison + Clean Slate
  bridgette: {
    entries: [{ cond: { notFlag: 'met_bridgette' }, node: 'intro' }, { node: 'after' }],
    nodes: {
      intro: {
        speaker: 'bridgette', text: 'I spent ten years as a public defender. Know who never gets asked to register? People who\'ve done time. Most of them don\'t know they can vote.',
        choices: [
          { text: 'They can vote?', next: 'vote', effects: { rel: { bridgette: 5 }, flags: { met_bridgette: true } } },
          { text: 'What about their records?', next: 'slate', effects: { flags: { met_bridgette: true } } },
          { text: 'How do I register anyone?', next: 'register', effects: { rel: { bridgette: 2 }, flags: { met_bridgette: true } } },
        ],
      },
      vote: { speaker: 'bridgette', text: 'Since 2021, in New York, your right to vote comes back the day you\'re released from prison. Even on parole. You just have to register again.', next: 'slate' },
      slate: { speaker: 'bridgette', text: 'And the Clean Slate Act seals old convictions: three years after a misdemeanor, eight after most felonies, if there\'s nothing new. The courts have until 2027 to make the sealing automatic.', next: 'slate2' },
      slate2: {
        speaker: 'bridgette', text: 'Sealed means a landlord or employer can\'t hold it against you. People get to be more than the worst day of their life. Tell that story.',
        choices: [{ text: 'Setting up a table at the reentry center.', effects: { rel: { bridgette: 6 }, solidarity: 10, trust: { downtown: 3 }, toast: 'POCKET CIVICS · VOTING AFTER PRISON' } }],
      },
      register: { speaker: 'bridgette', text: 'Register up to 10 days before an election, then early voting runs for nine days. Five minutes online. I timed it. Twice.', next: 'vote' },
      after: { speaker: 'bridgette', text: 'Registered? Great. Now register someone nobody else asked.' },
    },
  },

  // ============================================================ ADRIAN · Open Streets
  adrian: {
    entries: [{ cond: { notFlag: 'met_adrian' }, node: 'intro' }, { node: 'after' }],
    nodes: {
      intro: {
        speaker: 'adrian', text: 'Director of Soccer Justice. Self-appointed. Also, I design spaces for a living. And the biggest public space in Brooklyn is the street.',
        choices: [
          { text: 'Appoint me deputy.', next: 'deputy', effects: { rel: { adrian: 5 }, flags: { met_adrian: true } } },
          { text: 'How do we take the street back?', next: 'open', effects: { flags: { met_adrian: true } } },
          { text: 'Is that a real job?', next: 'job', effects: { rel: { adrian: 2 }, flags: { met_adrian: true } } },
        ],
      },
      deputy: { speaker: 'adrian', text: 'Done. First duty: make sure the small kids get the ball sometimes. Second duty: help me close the block.', next: 'open' },
      open: { speaker: 'adrian', text: 'Open Streets. Community groups, schools and merchants apply to the city\'s transportation department, DOT, to close a street to cars on set days.', next: 'open2' },
      open2: {
        speaker: 'adrian', text: 'You run it, the city backs it. Barricades, chalk, a pickup game, chairs for the grandmothers. The block becomes a plaza. Applications open every fall.',
        choices: [{ text: 'Applying for Saturdays.', effects: { rel: { adrian: 6 }, solidarity: 10, trust: { parkslope: 3 }, toast: 'POCKET CIVICS · OPEN STREETS' } }],
      },
      job: { speaker: 'adrian', text: 'Soccer justice is self-appointed. Designing spaces is the day job. Same idea: who gets to use it, and how do you make room for everybody?' },
      after: { speaker: 'adrian', text: 'Whistle, cones, barricades. The holy trinity.' },
    },
  },

  // ============================================================ DANAE · Culture Pass + IDNYC
  danae: {
    entries: [{ cond: { notFlag: 'met_danae' }, node: 'intro' }, { node: 'after' }],
    nodes: {
      intro: {
        speaker: 'danae', text: 'I build museum exhibitions. Know what breaks my heart? Kids who live ten minutes from a museum and think it isn\'t for them.',
        choices: [
          { text: 'How do we get them in?', next: 'pass', effects: { rel: { danae: 5 }, flags: { met_danae: true } } },
          { text: 'Isn\'t it expensive?', next: 'pass', effects: { flags: { met_danae: true } } },
          { text: 'What\'s your favorite exhibit?', next: 'fave', effects: { rel: { danae: 2 }, flags: { met_danae: true } } },
        ],
      },
      pass: { speaker: 'danae', text: 'Culture Pass. With a Brooklyn Public Library card you can reserve free passes to more than a hundred museums, gardens and theaters.', next: 'pass2' },
      pass2: {
        speaker: 'danae', text: 'And IDNYC, the free city ID, gets you free one-year memberships at a bunch of museums. Library card plus city ID. That\'s a whole year of culture for zero dollars.',
        choices: [{ text: 'Library card drive this weekend.', effects: { rel: { danae: 6 }, solidarity: 10, trust: { parkslope: 3 }, toast: 'POCKET CIVICS · CULTURE PASS + IDNYC' } }],
      },
      fave: { speaker: 'danae', text: 'Whichever one a kid is standing in front of with their mouth open. That\'s the exhibit working.', next: 'pass' },
      after: { speaker: 'danae', text: 'Library card. City ID. Museums. In that order.' },
    },
  },

  // ============================================================ JON · public access media
  jon: {
    entries: [{ cond: { notFlag: 'met_jon' }, node: 'intro' }, { node: 'after' }],
    nodes: {
      intro: {
        speaker: 'jon', text: 'Every movement needs an editor. Your speech is nine minutes. The good part is ninety seconds. I found it.',
        choices: [
          { text: 'Teach me to cut.', next: 'cut', effects: { rel: { jon: 5 }, flags: { met_jon: true } } },
          { text: 'Where do I air it?', next: 'air', effects: { flags: { met_jon: true } } },
          { text: 'Can you make me look taller?', next: 'taller', effects: { rel: { jon: 2 }, flags: { met_jon: true } } },
        ],
      },
      cut: { speaker: 'jon', text: 'Rule one: cut the throat-clearing. Nobody needs three minutes of "so, um, thanks for having me." Start with the point. Then get it on the air.', next: 'air' },
      air: { speaker: 'jon', text: 'BRIC runs Brooklyn\'s public access channels. Not a streamer. Not an algorithm. Public.', next: 'air2' },
      air2: {
        speaker: 'jon', text: 'Brooklyn residents can take media classes there, borrow gear and get community shows on the air. Your block deserves a show.',
        choices: [{ text: 'Pitching my show tonight.', effects: { rel: { jon: 6 }, solidarity: 10, attention: 4, trust: { bushwick: 3 }, toast: 'POCKET CIVICS · PUBLIC ACCESS TV' } }],
      },
      taller: { speaker: 'jon', text: 'I can make you look right. Taller is a lighting problem.' },
      after: { speaker: 'jon', text: 'Every block deserves a show. Some deserve a series.' },
    },
  },
};
