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
    id: 'yasiinbey', name: 'Yasiin Bey', short: 'Yasiin Bey', title: 'Artist, Bed-Stuy', district: 'bedstuy', spot: 'cm_yasiinbey', at: [40.6939, -73.9339], color: '#ffd23f',
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
];

export const CAMEO_AT: Record<string, [number, number]> = Object.fromEntries(CAMEOS.map((c) => [c.spot, c.at]));
