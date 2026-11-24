/**
 * Living Brooklyn icons, as brief cameos near the places they're tied to. Deroy's rule (Nov 21 2026): facts only.
 * They speak ONLY their own verified, non-lyric words (one quote each, sourced); everything else is narration of public
 * facts. No opinions or endorsements are put in their mouths, and portraits are simple game drawings, not likenesses.
 * Sources: docs/FACTS-cameos.md. Deroy chose (Nov 22 2026) to include Jay-Z (facts and his own memoir words only) and
 * Bernie Sanders (school history only, no politics). Not included: Talib Kweli, Michael Jordan, Lil' Kim.
 */
import type { Dialogue } from '../systems/dialogue';
import type { NpcDef } from './npcs';

interface Cameo extends NpcDef { at: [number, number]; dialogue: Dialogue }

const cameo = (id: string, narration: string, quote: string | null, source: string | null, after: string): Dialogue => ({
  entries: [{ cond: { flag: `met_${id}` }, node: `${id}_again` }, { node: `${id}_0` }],
  nodes: {
    [`${id}_0`]: { speaker: 'you', text: narration, next: quote ? `${id}_q` : `${id}_end` },
    ...(quote ? { [`${id}_q`]: { speaker: id, text: `"${quote}"`, next: `${id}_src` }, [`${id}_src`]: { speaker: 'you', text: `*(${source})*`, next: `${id}_end` } } : {}),
    [`${id}_end`]: { speaker: 'you', text: after, choices: [{ text: '(Wave. Keep it cool.)', effects: { solidarity: 3, flags: { [`met_${id}`]: true } } }] },
    [`${id}_again`]: { speaker: 'you', text: '*A nod from across the street. Brooklyn manners.*' },
  },
});

export const CAMEOS: Cameo[] = [
  {
    id: 'spikelee', name: 'Spike Lee', short: 'Spike Lee', title: 'Filmmaker, Fort Greene', district: 'downtown', spot: 'cm_spikelee', at: [40.6893, -73.9743], color: '#ff8a3d',
    look: { skin: '#5a3624', hair: '#1a1010', style: 'cap', hatColor: '#ff8a3d', shirt: '#1f4fb8', pants: '#1a1a20', shoes: '#f2f2f2', acc: 'glasses' },
    bio: 'Filmmaker. Ran his studio from an old firehouse on DeKalb Avenue in Fort Greene from 1985 to 2008, where he made Do the Right Thing. In 2015 a block of Stuyvesant Avenue in Bed-Stuy was co-named "Do the Right Thing Way."',
    dialogue: cameo('spikelee', '*Outside the old firehouse on DeKalb Avenue, a man in thick glasses and a ball cap studies the block like he\'s framing a shot. Spike Lee ran his film studio here for over twenty years.*', 'We had a big, old house right across the street from Fort Greene Park.', 'Spike Lee, NPR Fresh Air, 2017', '*In 2015 the city co-named a block of Stuyvesant Avenue in Bed-Stuy "Do the Right Thing Way," after his film. Neighbors asked for it.*'),
  },
  {
    id: 'carmelo', name: 'Carmelo Anthony', short: 'Carmelo Anthony', title: 'Basketball, Red Hook', district: 'redhook', spot: 'cm_carmelo', at: [40.6770, -74.0050], color: '#ff6b6b',
    look: { skin: '#a8714a', hair: '#1a1010', style: 'short', shirt: '#2f6f58', pants: '#1a1a20', shoes: '#f2f2f2' },
    bio: 'NBA star who lived in the Red Hook Houses until he was 8. In 2013 his foundation helped renovate the basketball courts here.',
    dialogue: cameo('carmelo', '*A tall man in a team jacket checks the new hoops on the Red Hook courts. Carmelo Anthony grew up right here, in the Red Hook Houses, until he was eight.*', 'Red Hook is where I started and where I\'ve returned to begin my Courts 4 Kids efforts.', 'Carmelo Anthony, NYCHA press release, 2013', '*In 2013 his foundation helped refurbish these courts for the kids who play here now.*'),
  },
  {
    id: 'rosieperez', name: 'Rosie Perez', short: 'Rosie Perez', title: 'Actor, Bushwick', district: 'bushwick', spot: 'cm_rosieperez', at: [40.7034, -73.9235], color: '#ff4fa3',
    look: { skin: '#b07a52', hair: '#1a1010', style: 'curly', shirt: '#ff4fa3', pants: '#1a1a20', shoes: '#f2f2f2', acc: 'tote' },
    bio: 'Actor and dancer from Bushwick. Co-founded Urban Arts Partnership, which brings arts education to low-income New York City schools.',
    dialogue: cameo('rosieperez', '*By Maria Hernandez Park in Bushwick, a woman in bright pink is mid-conversation with three teenagers about a dance class. Rosie Perez grew up in Bushwick.*', 'The arts opened me up, it really did.', 'Rosie Perez, NBC Latino, 2017', '*She co-founded Urban Arts Partnership, which brings arts education to low-income New York City schools.*'),
  },
  {
    id: 'yasiinbey', name: 'Yasiin Bey', short: 'Yasiin Bey', title: 'Artist, Bed-Stuy', district: 'bedstuy', spot: 'cm_yasiinbey', at: [40.6939, -73.9339], color: '#F5C242',
    look: { skin: '#5a3624', hair: '#1a1010', style: 'beanie', hatColor: '#2b2b40', shirt: '#7a6a50', pants: '#2b2b40', shoes: '#111' },
    bio: 'Artist also known as Mos Def, from Bed-Stuy. Acting and making music since age 9. Co-owned Nkiru Books, one of Brooklyn\'s first Black bookstores.',
    dialogue: cameo('yasiinbey', '*Near the Roosevelt Houses on DeKalb Avenue, a man in a knit cap reads a paperback on a bench. Yasiin Bey, also known as Mos Def, grew up in Bed-Stuy.*', 'My first home was Marcy Projects. My second home was Roosevelt Projects.', 'Yasiin Bey, Kalamu interview, 2014', '*He co-owned Nkiru Books, one of Brooklyn\'s first Black bookstores.*'),
  },
  {
    id: 'chrisrock', name: 'Chris Rock', short: 'Chris Rock', title: 'Comedian, Bed-Stuy', district: 'bedstuy', spot: 'cm_chrisrock', at: [40.6830, -73.9300], color: '#8fd4ff',
    look: { skin: '#5a3624', hair: '#1a1010', style: 'short', shirt: '#2a2a30', pants: '#2a2a30', shoes: '#111' },
    bio: 'Comedian who grew up in Bed-Stuy. As a kid he was bused to a school in Gerritsen Beach; his childhood inspired the TV show Everybody Hates Chris.',
    dialogue: cameo('chrisrock', '*A man in a black jacket leans on a stoop in Bed-Stuy, half-smiling at something only he heard. Chris Rock grew up here.*', 'I was bused from Bed-Stuy to Gerritsen Beach', 'Chris Rock, The Root', '*That bus ride across Brooklyn became part of Everybody Hates Chris, the show based on his childhood.*'),
  },
  {
    id: 'streisand', name: 'Barbra Streisand', short: 'Barbra Streisand', title: 'Singer, Erasmus Hall Class of 1959', district: 'flatbush', spot: 'cm_streisand', at: [40.6505, -73.9573], color: '#e8b8ff',
    look: { skin: '#f0d0b8', hair: '#c9a25a', style: 'long', shirt: '#4a2a5a', pants: '#2a1a2a', shoes: '#111', dress: true },
    bio: 'Singer and director. Graduated from Erasmus Hall High School in Flatbush in 1959, at 16, as an honors student.',
    dialogue: cameo('streisand', '*Outside Erasmus Hall High School on Flatbush Avenue, a woman in an elegant coat looks up at the old building for a long moment. Barbra Streisand graduated from here in 1959, at sixteen.*', null, null, '*As a little girl in Brooklyn she sang in her building\'s echoing hallway. Erasmus Hall\'s first wooden schoolhouse, from 1786, still stands in its courtyard.*'),
  },
  {
    id: 'jayz', name: 'Jay-Z', short: 'Jay-Z', title: 'Artist, Marcy Houses', district: 'bedstuy', spot: 'cm_jayz', at: [40.6950, -73.9495], color: '#e8c34a',
    look: { skin: '#5a3624', hair: '#1a1010', style: 'cap', hatColor: '#1a1a20', shirt: '#1a1a20', pants: '#2b3a6b', shoes: '#f2f2f2' },
    bio: 'Grew up in the Marcy Houses in Bed-Stuy. In 2003 he and his mother, Gloria, started the Shawn Carter Scholarship Foundation, which holds a yearly toy giveaway at Marcy.',
    dialogue: cameo('jayz', '*On Marcy Avenue near Myrtle, a man in a dark cap looks up at the Marcy Houses for a while before moving on. Jay-Z grew up here.*', 'I was nine years old, the summer of 1978, and Marcy was my world.', 'Jay-Z, Decoded, 2010', '*In 2003 he and his mother, Gloria, started the Shawn Carter Scholarship Foundation. It holds a toy giveaway at Marcy every year.*'),
  },
  {
    id: 'bernie', name: 'Bernie Sanders', short: 'Bernie Sanders', title: 'James Madison High, Class of 1959', district: 'flatbush', spot: 'cm_bernie', at: [40.6097, -73.9475], color: '#8fb8ff',
    look: { skin: '#f0d8c0', hair: '#f2f2f2', style: 'short', shirt: '#3a4a6a', pants: '#2a2a30', shoes: '#111', acc: 'glasses' },
    bio: 'Grew up in a three-and-a-half-room rent-controlled apartment on East 26th Street. Went to PS 197 and James Madison High School (class of 1959), then a year at Brooklyn College.',
    dialogue: cameo('bernie', '*Outside James Madison High School, a white-haired man in a rumpled coat looks at the front steps like he\'s counting them. Bernie Sanders graduated from here in 1959.*', 'I spent the first 18 years of my life in apartment 2C.', 'Bernie Sanders, outside 1525 East 26th Street, Midwood, April 2016', '*He played basketball at PS 197, whose team won a borough championship, and captained the track and cross-country teams at James Madison.*'),
  },
  {
    id: 'melbrooks', name: 'Mel Brooks', short: 'Mel Brooks', title: 'Comedian, Williamsburg', district: 'waterfront', spot: 'cm_melbrooks', at: [40.7090, -73.9570], color: '#ffb86b',
    look: { skin: '#f0d8c0', hair: '#e8e4f0', style: 'cap', hatColor: '#3a3a5a', shirt: '#4a4a6a', pants: '#2a2a30', shoes: '#111', acc: 'glasses' },
    bio: 'Comedian, writer and director who grew up in Williamsburg. Created the "2000 Year Old Man" with Carl Reiner. Turned 100 in June 2026.',
    dialogue: cameo('melbrooks', '*A very old man in a ball cap tells a joke to a bodega cat in Williamsburg. The cat does not laugh. The man laughs anyway. Mel Brooks grew up in this neighborhood, and he turned 100 this year.*', 'I was born to make people laugh.', 'Mel Brooks, Mel Brooks: The 99 Year Old Man!, HBO, 2026', '*With Carl Reiner he created the "2000 Year Old Man." He\'s been making Brooklyn laugh for about a century.*'),
  },
  {
    id: 'mamdani', name: 'Mayor Zohran Mamdani', short: 'Mayor Mamdani', title: 'Mayor of New York City', district: 'downtown', spot: 'cm_mamdani', at: [40.6901, -73.9819], color: '#4f8cff',
    look: { skin: '#b07a52', hair: '#1a1010', style: 'short', shirt: '#1f2a44', pants: '#1f2a44', shoes: '#111' },
    bio: 'Took office as Mayor of New York City on January 1, 2026. Ran on freezing the rent, fast and free buses, free child care and city-owned grocery stores. Launched his campaign at a halal cart. Lifelong Arsenal fan; tore his Achilles in November 2026 playing soccer against the City Hall press corps.',
    // Deroy (Nov 22 2026): more of his personality: the promises, the humor, street food, talking to people, soccer.
    // Every line in quotes is his own, sourced in docs/FACTS-cameos.md; everything else is narration of public facts.
    dialogue: {
      entries: [{ cond: { flag: 'met_mamdani' }, node: 'mam_again' }, { node: 'mam_0' }],
      nodes: {
        mam_0: { speaker: 'you', text: '*By one of the new concrete bus islands on Flatbush Avenue, a man on crutches, one foot in a walking boot, watches a B41 pull in like it\'s a goal replay. Zohran Mamdani became mayor of New York City on January 1, 2026.*', next: 'mam_q' },
        mam_q: { speaker: 'mamdani', text: '"Flatbush Avenue is the foundation for the future of bus service in New York City."', next: 'mam_q2' },
        mam_q2: { speaker: 'you', text: '*(NYC Mayor\'s Office, November 17, 2026.) This month the city finished 1.9 miles of protected center bus lanes here, with six boarding islands. Buses on this stretch used to crawl at about 4 mph, and 120,000 riders use it every day.*', next: 'mam_menu' },
        mam_menu: {
          speaker: 'you', text: '*He\'s already turned to talk to you. He talks to everyone.*',
          choices: [
            { text: 'What did you promise?', next: 'mam_promise' },
            { text: 'What\'s with the crutches?', next: 'mam_soccer' },
            { text: 'Best halal cart in the city?', next: 'mam_halal' },
            { text: 'Why do you talk to everybody?', next: 'mam_walk' },
            { text: 'Arsenal, huh?', next: 'mam_arsenal' },
            { text: '(Wave. Let him catch his bus.)', effects: { solidarity: 3, flags: { met_mamdani: true } } },
          ],
        },
        mam_promise: { speaker: 'you', text: '*He ran on four big promises: freeze the rent on rent-stabilized apartments, make buses fast and free, free child care from six weeks old to five, and city-owned grocery stores, one in every borough.*', next: 'mam_promise_q' },
        mam_promise_q: { speaker: 'mamdani', text: '"I\'m absolutely committed to making buses fast and free."', next: 'mam_promise_src' },
        mam_promise_src: { speaker: 'you', text: '*(Mayor Mamdani to Politico, April 2026.) In the same interview he said free buses wouldn\'t happen this year: Albany hasn\'t paid for them yet. The fast part is here on Flatbush. The free part is still a fight.*', next: 'mam_menu' },
        mam_soccer: { speaker: 'mamdani', text: '"I tore my Achilles. I did not stretch."', next: 'mam_soccer2' },
        mam_soccer2: { speaker: 'mamdani', text: '"And I scored a goal soon after getting on the pitch, and I forgot that I was 35."', next: 'mam_soccer_src' },
        mam_soccer_src: { speaker: 'you', text: '*(News conference, November 20, 2026.) The night before, City Hall played the press corps, seven a side. He captained his high school team at Bronx Science. City Hall won 10-5, by his count; some reporters remember it closer. Six to eight weeks in a boot.*', next: 'mam_menu' },
        mam_halal: { speaker: 'mamdani', text: '"...to make halal eight bucks again."', next: 'mam_halal_src' },
        mam_halal_src: { speaker: 'you', text: '*(His first campaign video, January 2025, shot at a halal cart.) Chicken over rice had climbed to $10. He blamed the permit system: too few vendor permits, so vendors rent them from middlemen. He asked cart owners what they\'d charge with their own permit. They said seven or eight.*', next: 'mam_menu' },
        mam_walk: { speaker: 'mamdani', text: '"New Yorkers need to see their mayor, talk to their mayor, ask their mayor questions."', next: 'mam_walk_src' },
        mam_walk_src: { speaker: 'you', text: '*(Hell Gate, June 2025.) He said it on a Friday night he spent walking the length of Manhattan, Inwood Hill to the Battery: over twelve miles, done at 2:15 a.m., stopping for anyone who wanted to talk.*', next: 'mam_menu' },
        mam_arsenal: { speaker: 'mamdani', text: '"Why argue with an Arsenal fan when you can just wait?"', next: 'mam_arsenal_src' },
        mam_arsenal_src: { speaker: 'you', text: '*(His post in May 2026, after Arsenal won the Premier League.) He\'s been a fan since he was nine, thanks to an uncle. His favorite player growing up was Kanu, who, like him, was born in Africa and lived somewhere else.*', next: 'mam_menu' },
        mam_again: { speaker: 'you', text: '*The mayor spots you from the bus island and waves a crutch. He has time. He always seems to.*', next: 'mam_menu' },
      },
    },
  },
  {
    id: 'reynoso', name: 'Antonio Reynoso', short: 'BP Reynoso', title: 'Brooklyn Borough President', district: 'downtown', spot: 'cm_reynoso', at: [40.6925, -73.9897], color: '#ffb23f',
    look: { skin: '#a8714a', hair: '#1a1010', style: 'short', shirt: '#2b3a6b', pants: '#2a2a30', shoes: '#111' },
    bio: 'Brooklyn Borough President, the first Latino one. Born and raised in Los Sures, the Southside of Williamsburg, to parents who emigrated from the Dominican Republic. Served two terms on the City Council before that.',
    dialogue: cameo('reynoso', '*On the plaza outside Borough Hall, a man in a blazer looks out over the crowd. Antonio Reynoso is Brooklyn\'s Borough President, the first Latino one. He grew up in Los Sures, Williamsburg\'s Southside, the son of parents from the Dominican Republic.*', 'All roads lead to Brooklyn, and even when others try to turn us against each other, Brooklyn chooses belonging.', 'Antonio Reynoso, State of the Borough, April 2026', '*The Borough President appoints the members of Brooklyn\'s 18 community boards and weighs in on rezonings right after they do. Worth knowing who that is.*'),
  },
  // Brooklyn politicians (Deroy, Nov 23 2026). Facts and their own words only, sourced in docs/FACTS-politicians.md.
  // Kept to biography and what each office does: no party fights. Spots are public offices and schools, never homes.
  {
    id: 'hanif', name: 'Shahana Hanif', short: 'CM Hanif', title: 'City Council, District 39', district: 'parkslope', spot: 'cm_hanif', at: [40.6822, -73.9870], color: '#7fd6a0',
    look: { skin: '#b07a52', hair: '#1a1010', style: 'long', shirt: '#2a2228', pants: '#1a1a20', shoes: '#111', acc: 'glasses' },
    bio: 'New York City Council Member for District 39: Kensington, Windsor Terrace, Park Slope, Gowanus, Carroll Gardens and more. Born and raised in Kensington to Bangladeshi immigrant parents; the first Bangladeshi and first Muslim woman elected to the Council. Lead sponsor of Universal Curbside Composting.',
    dialogue: cameo('hanif', '*Outside her district office on Bond Street in Gowanus, a woman in tortoiseshell glasses is going through a clipboard of constituent requests. Shahana Hanif grew up in Kensington, the daughter of Bangladeshi immigrants, and is the first Muslim woman elected to the City Council.*', 'Our office helps connect constituents to city services, for issues big and small.', 'Council Member Hanif to PoliticsNY, March 2026', '*POCKET CIVICS: A Council Member is one of 51 people who write and vote on the city\'s laws and its budget. Trash not picked up? No heat? Their district office is where you go. Hanif was lead sponsor of the law that made curbside composting citywide.*'),
  },
  {
    id: 'jumaane', name: 'Jumaane Williams', short: 'PA Williams', title: 'NYC Public Advocate', district: 'downtown', spot: 'cm_jumaane', at: [40.6890, -73.9765], color: '#F5C242',
    look: { skin: '#4a2a1a', hair: '#1a1010', style: 'beanie', hatColor: '#8a8a90', shirt: '#6a6a70', pants: '#2a2a30', shoes: '#111' },
    bio: 'New York City Public Advocate since 2019, re-elected in 2025. Son of Grenadian immigrants; represented Flatbush and East Flatbush on the City Council from 2010 to 2019. Went to Brooklyn Tech. Sponsored the Community Safety Act, which created the NYPD Inspector General, and the Fair Chance Act ("Ban the Box").',
    dialogue: cameo('jumaane', '*Outside Brooklyn Tech, his old high school, a tall man in a gray beanie and a plaid scarf stops to talk with some students. Jumaane Williams is New York City\'s Public Advocate. He grew up in Flatbush, the son of Grenadian immigrants.*', 'The public advocate also serves as an ombudsman for city government, providing oversight for city agencies.', 'Public Advocate Williams to PoliticsNY, August 2026', '*POCKET CIVICS: The Public Advocate is the city\'s elected watchdog. When a city agency fails you, you can take your complaint there. The office can introduce bills in the Council, and it\'s first in line to fill in if the mayor leaves office.*'),
  },
  {
    id: 'osse', name: 'Chi Ossé', short: 'CM Ossé', title: 'City Council, District 36', district: 'bedstuy', spot: 'cm_osse', at: [40.6800, -73.9470], color: '#c88cff',
    look: { skin: '#6b4430', hair: '#1a1010', style: 'curly', shirt: '#1f1f28', pants: '#1a1a20', shoes: '#111', acc: 'glasses' },
    bio: 'New York City Council Member for District 36, Bed-Stuy and North Crown Heights. Elected in 2021 at 23, the youngest Council Member ever and the city\'s first Gen-Z elected official; he came out of the 2020 protests. His Haitian-American family has lived in Brooklyn for three generations. In 2026 he launched a campaign against deed theft.',
    dialogue: cameo('osse', '*On Fulton Street by Restoration Plaza, a young man in clear-framed glasses and a sharp coat hands out flyers about deed theft. Chi Ossé was elected to the City Council at 23, the youngest ever. His family has been in Brooklyn for three generations.*', 'Deed theft is one of the most pervasive and least discussed housing crises in New York.', 'Council Member Ossé, Council press release, February 2026', '*Deed theft is fraud that takes a homeowner\'s house, often through shell companies, and longtime Black homeowners in Bed-Stuy are a top target. POCKET CIVICS: a Council Member can hold hearings and push Albany, which is where deed-theft law actually gets written.*'),
  },
  {
    id: 'tishjames', name: 'Letitia James', short: 'AG James', title: 'New York Attorney General', district: 'downtown', spot: 'cm_tishjames', at: [40.6854, -73.9755], color: '#ff8fb8',
    look: { skin: '#6b3e26', hair: '#3a2014', style: 'long', shirt: '#1a1a20', pants: '#1a1a20', shoes: '#111' },
    bio: 'New York State Attorney General, re-elected to a third term in 2026. The first woman and first Black person elected to the office. Raised in Park Slope; represented Fort Greene and Clinton Hill on the City Council, then served as Public Advocate. Her office keeps a Brooklyn regional office on Hanson Place.',
    dialogue: cameo('tishjames', '*Outside the Attorney General\'s Brooklyn office on Hanson Place, a woman in a dark blazer tucks a folder under her arm. Letitia James is New York\'s Attorney General, the first woman and first Black person elected to the job. She once represented Fort Greene on the City Council.*', 'Everyone deserves a safe place to call home.', 'Attorney General James, press release, November 23, 2026', '*POCKET CIVICS: The Attorney General is the state\'s lawyer, "the people\'s lawyer": she sues companies that cheat you and defends tenants and workers. Street crime is the county District Attorney\'s job, not hers. Her Brooklyn office here takes complaints about scams and landlords.*'),
  },
  {
    id: 'jeffries', name: 'Hakeem Jeffries', short: 'Leader Jeffries', title: 'House Democratic Leader', district: 'flatbush', spot: 'cm_jeffries', at: [40.6337, -73.9530], color: '#6fa8ff',
    look: { skin: '#8a5a3c', hair: '#1a1010', style: 'bald', shirt: '#1f2a44', pants: '#1f2a44', shoes: '#111' },
    bio: 'Represents New York\'s 8th Congressional District. Raised in Crown Heights; Midwood High School, class of 1988. In 2022 he became the first African American to lead a party in either house of Congress. House Democrats nominated him for Speaker in November 2026; the full House votes in January.',
    dialogue: cameo('jeffries', '*Outside Midwood High School on Bedford Avenue, a man in a navy suit and purple tie is back at his old school, telling a group of students something with his hands. Hakeem Jeffries graduated from here in 1988. In 2022 he became the first African American to lead a party in either house of Congress.*', 'During the first 12 years of my life, my congresswoman, though I never met her, was Shirley Chisholm.', 'Hakeem Jeffries, amNY, November 18, 2026', '*POCKET CIVICS: The Speaker of the House decides which bills get a vote and is second in line for the presidency, after the Vice President. House Democrats picked him for Speaker this month; the whole House votes in January.*'),
  },
  {
    id: 'schumer', name: 'Chuck Schumer', short: 'Sen. Schumer', title: 'U.S. Senator, Madison High \'67', district: 'flatbush', spot: 'cm_schumer', at: [40.6102, -73.9480], color: '#d9b45a',
    look: { skin: '#f0d0b8', hair: '#c8c8c8', style: 'short', shirt: '#3a3a40', pants: '#2a2a30', shoes: '#111', acc: 'glasses' },
    bio: 'U.S. Senator from New York since 1999 and the Senate Democratic Leader. Born in Midwood; valedictorian of James Madison High School in 1967. In 2021 he became the first Jewish Senate leader in U.S. history. He created the "Schumer box," the rate chart on every credit card offer.',
    dialogue: cameo('schumer', '*Outside James Madison High School, a man in a charcoal suit peers over his reading glasses at the ball field. Chuck Schumer was valedictorian here in 1967. Bernie Sanders and Ruth Bader Ginsburg went here too.*', 'When I was a little kid, I\'d sneak through holes in the fence so we could play baseball here.', 'Chuck Schumer, NY1, March 2015', '*POCKET CIVICS: A senator\'s job is writing federal law and voting on who becomes a judge or a cabinet member. That box of interest rates on every credit card offer you get? Congress calls it the Schumer box.*'),
  },
];

export const CAMEO_AT: Record<string, [number, number]> = Object.fromEntries(CAMEOS.map((c) => [c.spot, c.at]));
