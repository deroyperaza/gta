import type { District } from '../core/types';
import type { Look } from '../world/textures';

export interface NpcDef {
  id: string; name: string; short: string; title: string; district: District; spot: string;
  look: Look; bio: string; color: string;
  /** Stand this far from the named spot (to share a landmark with someone else) */
  offset?: { dx: number; dy: number };
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
  {
    id: 'deroy', name: 'Deroy', short: 'Deroy', title: 'The Storyteller', district: 'bedstuy', spot: 'deroy', color: '#ffb347',
    look: { skin: '#d6a07a', hair: '#1a1310', style: 'short', shirt: '#b8723a', pants: '#1a1a1c', acc: 'glasses', shoes: '#2a1a12' },
    bio: 'Runs a Brooklyn branding studio for mission-driven groups. Believes the right story beats the right spreadsheet, and that AI should have to show its work.',
    idle: ['One person. One stake. One ask.', 'You\'re not winning an argument. You\'re changing what feels normal.'],
  },
  {
    id: 'jenna', name: 'Jenna', short: 'Jenna', title: 'The Gatherer', district: 'bedstuy', spot: 'jenna', color: '#7fd1ff',
    look: { skin: '#dcab86', hair: '#120a06', style: 'long', shirt: '#3f74c2', pants: '#141414', shoes: '#111' },
    bio: 'Leadership coach and facilitator. Knows every neighbor by name and has had coffee with most of them on purpose.',
    idle: ['People don\'t come back to meetings. They come back to people.', 'Who did you have coffee with this week?'],
  },
  {
    id: 'nell', name: 'Nell', short: 'Nell', title: 'The Counsel', district: 'plg', spot: 'nell', color: '#9be37b',
    look: { skin: '#d9a888', hair: '#5a504a', style: 'short', shirt: '#efe9dd', pants: '#1f2a44', shoes: '#111' },
    bio: 'Tenant-side housing lawyer. Has kept more families in their homes than anyone can count, and still files 311 reports for fun.',
    idle: ['Never go to Housing Court alone.', 'Ask for your rent history. It\'s free.'],
  },
  {
    id: 'bridgette', name: 'Bridgette', short: 'Bridgette', title: 'The Defender', district: 'downtown', spot: 'bridgette', color: '#ffd23f',
    look: { skin: '#e2b094', hair: '#5e3e28', style: 'bun', shirt: '#88a4c4', pants: '#88a4c4', shoes: '#f2f2f2', acc: 'clipboard' },
    bio: 'Former public defender who teaches the next ones. Runs a voter registration table with a clipboard, a mint fanny pack and zero tolerance for "my vote doesn\'t matter."',
    idle: ['Out of prison? You can vote. Re-register.', 'Registered? Great. Now register someone nobody else asked.'],
  },
  {
    id: 'adrian', name: 'Adrian', short: 'Adrian', title: 'The Architect', district: 'parkslope', spot: 'adrian', color: '#ff7ab8',
    look: { skin: '#d09c7c', hair: '#2a1c14', style: 'bun', shirt: '#1c1c20', pants: '#1e2640', shoes: '#111', acc: 'glasses' },
    bio: 'Designs public spaces for a living and coaches every kid on the field on weekends. Carries a whistle and the moral high ground.',
    idle: ['The small kids get the ball sometimes. That is soccer justice.', 'The street is the biggest park we have.'],
  },
  {
    id: 'danae', name: 'Danae', short: 'Danae', title: 'The Curator', district: 'parkslope', spot: 'danae', color: '#ff9a7a',
    look: { skin: '#e0a88a', hair: '#2a170e', style: 'curly', shirt: '#f08a78', pants: '#c8885a', shoes: '#c8322a' },
    bio: 'Builds museum exhibitions. Wants every kid in Brooklyn to know the museum is theirs too.',
    idle: ['Library card. City ID. Museums. In that order.', 'The museum is yours. You already paid for it.'],
  },
  {
    id: 'jon', name: 'Jon', short: 'Jon', title: 'The Editor', district: 'bushwick', spot: 'jon', color: '#c9b8ff',
    look: { skin: '#d8a080', hair: '#7a726a', style: 'curly', shirt: '#18181c', pants: '#18181c', shoes: '#0a0a0a', acc: 'tie' },
    bio: 'Cuts comedy for a living. Can find the ninety good seconds in any nine-minute speech, including yours.',
    idle: ['Cut the throat-clearing. Start with the point.', 'Every block deserves a show. Some deserve a series.'],
  },
  {
    id: 'emily', name: 'Emily', short: 'Emily', title: 'The Showstopper', district: 'coneyisland', spot: 'boardwalk', color: '#ffb0d0',
    look: { skin: '#e8b898', hair: '#c9a46a', style: 'long', shirt: '#141414', pants: '#2a2a30', shoes: '#111', acc: 'glasses' },
    bio: 'Creative director for showstopper cakes. Thinks every neighborhood deserves a centerpiece, and a permit to put it in the street.',
    idle: ['Sixty days. Twenty-five dollars. One street with no cars.', 'Every block party needs a showstopper.'],
  },
  {
    id: 'naim', name: 'Naim', short: 'Naim', title: 'The Keeper', district: 'parkslope', spot: 'naim', color: '#7fe0ff',
    look: { skin: '#e2b08a', hair: '#2a1c14', style: 'curly', shirt: '#141414', pants: '#2b3a6b', shoes: '#f2f2f2', acc: 'glasses' },
    bio: 'Calls his ADHD a superpower. Active in student disability and disability awareness clubs, and will politely ask a city official the same question twice. Also: goalkeeper, baker, pianist, romantasy reader.',
    idle: ['Okay, but when?', 'Count the stairs. Then write the letter.', 'I have opinions about chapter 31.'],
  },
  {
    id: 'luco', name: 'Luco', short: 'Luco', title: 'The Dealmaker', district: 'downtown', spot: 'luco', color: '#9dffb0',
    look: { skin: '#e2b08a', hair: '#3a2414', style: 'curly', shirt: '#f2f2f2', pants: '#3a4a6b', shoes: '#111' },
    bio: 'Fourteen. Organizes real charity soccer tournaments (books the fields, recruits the teams, gives the money away), studies the business of soccer and reads stock charts like box scores. Never gives advice. Always has a spreadsheet.',
    idle: ['Follow the money.', 'Book the field before you book the teams.', 'Next tournament: every team is a bagel.'],
  },
  {
    id: 'vega', name: 'Vega', short: 'Vega', title: 'The Choreographer', district: 'bushwick', spot: 'vega', color: '#ffa8e0',
    look: { skin: '#f0c8a8', hair: '#8a5a34', style: 'long', shirt: '#141414', pants: '#141414', shoes: '#f2f2f2' },
    bio: 'Nine years old. Dancer, painter, free spirit, and the best hairdos on the block. Will choreograph your protest whether you asked or not.',
    idle: ['Feel the music, then do whatever your body says.', 'New hairdo tomorrow. Nobody knows what yet.'],
  },
];

import { MODULE_NPCS } from './mission-modules';
NPCS.push(...MODULE_NPCS);
import { NEIGHBORS } from './neighbors';
NPCS.push(...NEIGHBORS);
import { GHOSTS } from './ghosts';
NPCS.push(...GHOSTS);
import { VILLAINS } from './villains';
NPCS.push(...VILLAINS);

export const NPC_BY_ID = Object.fromEntries(NPCS.map((n) => [n.id, n])) as Record<string, NpcDef>;

// Ambient pedestrian quips by district
export const PED_LINES: Record<District, string[]> = {
  crownheights: ['Labor Day on the Parkway. You coming? Everybody\'s coming.', 'Our tenant union got the boiler fixed in ONE week.', 'The roti place knows my order before I walk in.', 'My building got sold three times this year. Same broken intercom.', 'Steel pan practice is at seven. Bring earplugs or bring a drum.'],
  redhook: ['Sandy put four feet of water in my basement. Still waiting on that resiliency plan.', 'The pupusa ladies at the ballfields are a civic institution.', 'One bus. That\'s our whole transit system. One bus.', 'They want to put luxury condos on the flood plain. Bold.', 'The view of the Statue is free. The rent is not.'],
  coneyisland: ['Boardwalk\'s been here a hundred years. The developers just got here.', 'Polar Bear Plunge on New Year\'s. Builds character.', 'Mermaid Parade is democracy in sequins.', 'The Wonder Wheel is older than my grandma and in better shape.', 'Last stop on four trains and first stop for every storm.'],
  flatbush: ['Dollar van\'s faster than the B train and that\'s a fact.', 'Patty with cheese, coco bread on the side. Don\'t argue.', 'Our block party permit took six weeks. The party took six hours.', 'They renamed the neighborhood on the listing. We didn\'t move.', 'Church on Sunday, tenant meeting on Tuesday.'],
  waterfront: ['Walked the bridge at sunrise. Worth every tourist.', 'The Promenade is free. The view is priceless. The condos are neither.', 'They keep calling it "activated waterfront." It was always active. We were here.', 'Best skyline in the city, and you can\'t even see Brooklyn in it.'],
  plg: ['Our building has a tenants association, a group chat and a lawyer on speed dial.', 'Limestones on one side, the park on the other. Rent on all sides.', 'Doubles from the window on Flatbush. Best breakfast in the borough.', 'They call it PLG on the listing so they can charge more. We call it home.', 'Landlord tried an eviction. We showed up forty deep to Housing Court.'],
  sunsetpark: ['Best skyline view in Brooklyn and nobody\'s posting it.', 'Eighth Ave dim sum, Fifth Ave tacos. Lunch is a tour.', 'The waterfront used to be jobs. Now it\'s "innovation."', 'Our community board meeting had translation in four languages.', 'I run the corner and the PTA. Same skills.'],
  parkslope: ['Is this stroller-accessible? Asking for my stroller.', 'I\'m in a book club about book clubs.', 'We moved here for the schools. And the oat milk.', 'Sorry, I\'m late for my sound bath.', 'My dog has a therapist. It\'s going great.'],
  bedstuy: ['That fridge saved me last winter, no lie.', 'They raised my rent AGAIN. For a "fee."', 'You from the block? You look like you\'re from the block.', 'Ms. Hattie told me to tell you to stand up straight.', 'Farouk\'s cat looked at me today. I feel blessed.'],
  bushwick: ['I make art about the absence of art.', 'This warehouse used to be a warehouse. Now it\'s a "warehouse."', 'I\'m between leases. And genres.', 'Want to come to my noise show? It\'s just noise.', 'Rent is due and my installation is unfinished. Same thing, really.'],
  downtown: ['I\'m on my lunch break from the system.', 'Jury duty again. Third time this year.', 'Do you have a permit for that expression?', 'I work in "synergy." Don\'t ask me what that means.', 'I could sue you. I won\'t. But I could.'],
};
export const FLYER_LINES = ['Ooh, a fridge? I have, like, a whole thing of lentils.', 'Is this an MLM? ...Oh, it\'s food. Cool.', 'I\'ll put it on my fridge. Ironically.', 'Finally, a flyer that isn\'t for a DJ night.', 'Mutual aid? I love when aid is mutual.', 'Respect. I\'ll tell my building.', 'I already follow the fridge on Instagram!'];
