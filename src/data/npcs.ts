import type { District } from '../core/types';
import type { Look } from '../world/textures';

export interface NpcDef {
  id: string; name: string; short: string; title: string; district: District; spot: string;
  look: Look; bio: string; color: string;
  /** Lines when nothing mission-relevant is happening */
  idle?: string[];
}

export const PLAYER_LOOK: Look = { skin: '#c58a5c', hair: '#2a1a12', style: 'beanie', hatColor: '#ff8a3d', shirt: '#7b3fe4', pants: '#2b3a6b', shoes: '#ff4fa3', acc: 'tote' };

export const NPCS: NpcDef[] = [
  {
    id: 'dee', name: 'Dolores "Dee" Baptiste',  short: 'Dee', title: 'Fridge Captain', district: 'bedstuy', spot: 'dee', color: '#ffb23f',
    look: { skin: '#6b3e26', hair: '#1a1010', style: 'afro', shirt: '#ffb23f', pants: '#3a2a5a', acc: 'clipboard', shoes: '#fff' },
    bio: 'Runs the Gates Ave community fridge on four hours of sleep and pure spite for food waste. Hates meetings. Loves logistics.',
    idle: ['If it ain\'t expired, it ain\'t wasted.', 'I don\'t do panels. I do PANTRIES.', 'You see a meeting, I see forty minutes I could\'ve spent stocking.'],
  },
  {
    id: 'brendan', name: 'Brendan Whitlock-Okafor', short: 'Brendan', title: 'Co-op Board (7 committees)', district: 'parkslope', spot: 'brendan', color: '#7bd66b',
    look: { skin: '#f2c29b', hair: '#c9a25a', style: 'short', shirt: '#6fcf5e', pants: '#d9c7a3', acc: 'glasses', shoes: '#8b5a3c' },
    bio: 'Sits on seven co-op committees, including the Committee to Reduce Committees. Means well. Says "unpack that" unironically.',
    idle: ['Have you considered our kombucha reparations fund?', 'I\'d love to hold space for your concerns. Thursday, 7pm, room B.', 'This tote bag is made from a previous tote bag.'],
  },
  {
    id: 'farouk', name: 'Farouk Haddad', short: 'Farouk', title: 'Bodega Owner', district: 'bedstuy', spot: 'farouk', color: '#ffcf3f',
    look: { skin: '#b07a52', hair: '#3a3a3a', style: 'bald', shirt: '#ffffff', pants: '#2f2f3a', acc: 'apron' },
    bio: 'Has fed the block on credit for 22 years. His cat, Commissioner Whiskers, has more neighborhood influence than any elected official.',
    idle: ['Chopped cheese? For you, no charge. For the councilman, double.', 'The Commissioner is on patrol. Don\'t make eye contact.', 'Twenty-two years. Three landlords. One cat. The cat is the constant.'],
  },
  {
    id: 'juni', name: 'Juniper "Juni" Vasquez', short: 'Juni', title: 'Artist, Sourdough Collective', district: 'bushwick', spot: 'juni', color: '#a46bff',
    look: { skin: '#d9a679', hair: '#ff4fa3', style: 'mohawk', shirt: '#2b2340', pants: '#5a4b7a', acc: 'bandana', shoes: '#7bd66b' },
    bio: 'Bakes bread, paints murals, and thinks the fridge is "a band-aid on late capitalism" — then shows up every week anyway.',
    idle: ['Charity is vertical. Solidarity is horizontal. Bread is round.', 'Every loaf is a little general strike.', 'Dee and I agree on 90% of things and fight about the other 90%.'],
  },
  {
    id: 'hattie', name: 'Ms. Hattie Coleman', short: 'Ms. Hattie', title: 'Neighborhood Elder', district: 'bedstuy', spot: 'hattie', color: '#ff7ab8',
    look: { skin: '#5a3324', hair: '#e8e4f0', style: 'bun', shirt: '#ff7ab8', pants: '#4a3c6b', acc: 'cane', dress: true },
    bio: 'Organizing since 1971. Has outlived four mayors and two "revitalization plans." Runs restorative justice circles with a talking stick she will not let you touch.',
    idle: ['Baby, I was doing mutual aid before it had a hashtag.', 'Movements move at the speed of trust.', 'Sit down. You make me tired standing like that.'],
  },
  {
    id: 'gary', name: 'Councilmember Gary Pressman', short: 'Gary', title: 'Elected Official (D-ish)', district: 'downtown', spot: 'gary', color: '#4f8cff',
    look: { skin: '#f0c8a8', hair: '#b8b8c8', style: 'short', shirt: '#2b3a6b', pants: '#2b3a6b', acc: 'tie', shoes: '#111' },
    bio: 'Supports your cause "in spirit, in principle, and in a non-binding resolution." Has a photographer on retainer for exactly these moments.',
    idle: ['My door is always open. My calendar is not.', 'I hear you. I hear everyone. That\'s the problem, honestly.', 'Have you tried voting? Twice? In the primary?'],
  },
  {
    id: 'tyler', name: 'Tyler Brandt', short: 'Tyler', title: 'Founder, Luxe Lofts™', district: 'downtown', spot: 'tyler', color: '#ffd23f',
    look: { skin: '#f6d2b8', hair: '#f2d06b', style: 'short', shirt: '#f2f2f2', pants: '#c9b9a0', acc: 'phone', shoes: '#fff' },
    bio: 'Aggressively cheerful real estate developer. Calls displacement "neighborhood refreshing." Owns a Patagonia vest for every day of the week.',
    idle: ['Love the energy! Have you considered monetizing it?', 'We\'re not gentrifying, we\'re ACTIVATING.', 'Our lobby has a mural of a mural. Very authentic.'],
  },
  {
    id: 'skye', name: 'Skye Moonbeam-Patel', short: 'Skye', title: 'Influencer (412K)', district: 'downtown', spot: 'skye', color: '#ff4fa3',
    look: { skin: '#c89070', hair: '#7b3fe4', style: 'long', shirt: '#ff4fa3', pants: '#2fd1c5', acc: 'ringlight', shoes: '#fff' },
    bio: 'Livestreams everything, including this sentence. Genuinely raises money for causes. Also genuinely sells detox tea.',
    idle: ['Hiii besties, I\'m here with a REAL activist!!', 'Smash that solidarity button.', 'This is so raw. So authentic. Can you do it again but in better light?'],
  },
  {
    id: 'marcus', name: 'Marcus Bell', short: 'Marcus', title: 'DJ, Apt 3F', district: 'bedstuy', spot: 'marcus', color: '#2fd1c5',
    look: { skin: '#4a2a1a', hair: '#111', style: 'cap', hatColor: '#2fd1c5', shirt: '#2b2340', pants: '#555', acc: 'headphones' },
    bio: 'Wedding DJ on weekends, MTA mechanic on weekdays. Practices his sets at home because studio time costs $60 an hour.',
    idle: ['I\'m not loud. My subwoofer is passionate.', 'You ever try to beat-match on a Tuesday? It\'s spiritual.'],
  },
  {
    id: 'priya', name: 'Priya Raman', short: 'Priya', title: 'Night-shift Nurse, Apt 2F', district: 'bedstuy', spot: 'priya', color: '#59b8ff',
    look: { skin: '#a8714a', hair: '#1a1010', style: 'braids', shirt: '#59b8ff', pants: '#59b8ff', shoes: '#fff' },
    bio: 'ER nurse at Kings County, works 7pm–7am. Sleeps from 9am to 3pm, theoretically.',
    idle: ['I have been awake since a previous administration.', 'Please speak at a volume appropriate for a hospital.'],
  },
];

export const NPC_BY_ID = Object.fromEntries(NPCS.map((n) => [n.id, n])) as Record<string, NpcDef>;

// Ambient pedestrian quips by district
export const PED_LINES: Record<District, string[]> = {
  parkslope: ['Is this stroller-accessible? Asking for my stroller.', 'I\'m in a book club about book clubs.', 'We moved here for the schools. And the oat milk.', 'Sorry, I\'m late for my sound bath.', 'My dog has a therapist. It\'s going great.'],
  bedstuy: ['That fridge saved me last winter, no lie.', 'They raised my rent AGAIN. For a "fee."', 'You from the block? You look like you\'re from the block.', 'Ms. Hattie told me to tell you to stand up straight.', 'Farouk\'s cat looked at me today. I feel blessed.'],
  bushwick: ['I make art about the absence of art.', 'This warehouse used to be a warehouse. Now it\'s a "warehouse."', 'I\'m between leases. And genres.', 'Want to come to my noise show? It\'s just noise.', 'Rent is due and my installation is unfinished. Same thing, really.'],
  downtown: ['I\'m on my lunch break from the system.', 'Jury duty again. Third time this year.', 'Do you have a permit for that expression?', 'I work in "synergy." Don\'t ask me what that means.', 'I could sue you. I won\'t. But I could.'],
};
export const FLYER_LINES = ['Ooh, a fridge? I have, like, a whole thing of lentils.', 'Is this an MLM? ...Oh, it\'s food. Cool.', 'I\'ll put it on my fridge. Ironically.', 'Finally, a flyer that isn\'t for a DJ night.', 'Mutual aid? I love when aid is mutual.', 'Respect. I\'ll tell my building.', 'I already follow the fridge on Instagram!'];
