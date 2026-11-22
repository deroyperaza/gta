/**
 * A named neighbor on every block (Deroy, Nov 22 2026: "there should be at least one per block that feels appropriate
 * for that neighborhood"). Generated, not hand-written: each Brooklyn block gets one person, deterministic by block,
 * with a name, a job and a look drawn from pools that fit the neighborhood, and lines in their own voice.
 * Their first conversation passes on one Pocket Civics lesson (already sourced, see lessons.ts) and after that they
 * never repeat themselves until they've said everything (chatter.ts).
 *
 * Fiction: every person here is invented. No real people, no real businesses. Nobody is the joke for being poor,
 * unhoused, disabled or ill.
 */
import type { District } from '../core/types';
import type { Look } from '../world/textures';
import { CELLS, KINDS, NEIGHBORHOODS } from '../world/brooklynGrid';
import type { NpcDef } from './npcs';

export interface BlockFolk extends NpcDef { block: [number, number]; blockFolk: true }

function hash(s: string) { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; }

// Name pools: a broad Brooklyn mix, nudged by neighborhood
const NAMES: Record<string, string[]> = {
  caribbean: ['Ms. Joseph', 'Mr. Baptiste', 'Auntie Marcia', 'Errol', 'Mrs. Pierre', 'Kezia', 'Mr. Clarke', 'Shaniqua', 'Dwayne', 'Ms. Alleyne', 'Junior', 'Mrs. Charles'],
  black: ['Ms. Bernice', 'Mr. Freeman', 'Tasha', 'Brother Hakim', 'Ms. Lorraine', 'Darnell', 'Mrs. Washington', 'Keisha', 'Mr. Gaines', 'Big Ron', 'Aaliyah', 'Pastor Greene'],
  latino: ['Doña Gladys', 'Don Julio', 'Marisol', 'Señora Reyes', 'Héctor', 'Yesenia', 'Abuela Nilda', 'Paco', 'Ms. Ortiz', 'Javier', 'Luz', 'Mr. Delgado'],
  chinese: ['Mrs. Wong', 'Mr. Li', 'Auntie Mei', 'Kevin Chen', 'Grandpa Zhao', 'Ms. Lin', 'Jenny', 'Mr. Huang', 'Ah Ma', 'Tommy Liu'],
  jewish: ['Mrs. Goldberg', 'Mr. Weiss', 'Rivka', 'Shmuel', 'Mrs. Klein', 'Mr. Rosen', 'Chaya', 'Yossi', 'Bubbe Rose'],
  russian: ['Mrs. Volkova', 'Sasha', 'Mr. Petrov', 'Olga', 'Grandma Lyuba', 'Misha', 'Mrs. Kaplan', 'Vera'],
  arab: ['Mr. Saleh', 'Amira', 'Uncle Sami', 'Mrs. Nasser', 'Yusuf', 'Layla', 'Mr. Khalil', 'Dina'],
  southasian: ['Mr. Rahman', 'Auntie Shirin', 'Imran', 'Mrs. Begum', 'Raju', 'Priya', 'Mr. Chowdhury', 'Farzana'],
  italian: ['Mrs. Russo', 'Mr. Esposito', 'Nonna Angela', 'Vinnie', 'Mrs. Romano', 'Sal', 'Theresa', 'Mr. Bruno'],
  irish: ["Mrs. O'Brien", 'Mr. Murphy', 'Kathleen', 'Mickey', 'Mrs. Doyle', 'Father Tom'],
  polish: ['Mrs. Nowak', 'Mr. Kowalski', 'Basia', 'Tomek', 'Pani Zofia'],
  mixed: ['Jordan', 'Sam', 'Ms. Rivera', 'Mr. Okafor', 'Alex', 'Kayla', 'Mr. Park', 'Robin', 'Ms. Diallo', 'Mateo', 'Grace', 'Mr. Silva', 'Noor', 'Jamie', 'Ms. Adeyemi', 'Theo'],
};
const HOOD_NAMES: Record<string, string[]> = {
  'Flatbush': ['caribbean', 'caribbean', 'black', 'latino'], 'East Flatbush': ['caribbean', 'caribbean', 'black'], 'Prospect Lefferts Gardens': ['caribbean', 'black', 'mixed'],
  'Crown Heights': ['caribbean', 'black', 'jewish', 'mixed'], 'Canarsie': ['caribbean', 'caribbean', 'black'], 'Flatlands': ['caribbean', 'black', 'mixed'],
  'Bedford-Stuyvesant': ['black', 'black', 'caribbean', 'mixed'], 'Brownsville': ['black', 'black', 'latino'], 'East New York': ['black', 'latino', 'latino', 'southasian'], 'Ocean Hill': ['black', 'latino'], 'Weeksville': ['black', 'caribbean'],
  'Bushwick': ['latino', 'latino', 'mixed'], 'East Williamsburg': ['latino', 'mixed', 'italian'], 'Cypress Hills': ['latino', 'southasian', 'black'], 'City Line': ['southasian', 'latino', 'black'],
  'Sunset Park': ['latino', 'chinese', 'chinese', 'arab'], 'Borough Park': ['jewish', 'jewish', 'chinese'], 'South Williamsburg': ['jewish', 'jewish', 'latino'], 'Midwood': ['jewish', 'southasian', 'russian', 'mixed'],
  'Brighton Beach': ['russian', 'russian', 'mixed'], 'Sheepshead Bay': ['russian', 'chinese', 'italian', 'mixed'], 'Homecrest': ['chinese', 'russian'], 'Gravesend': ['italian', 'chinese', 'russian'],
  'Bensonhurst': ['italian', 'chinese', 'chinese', 'russian'], 'Bath Beach': ['italian', 'chinese'], 'Dyker Heights': ['italian', 'italian', 'chinese'], 'Bay Ridge': ['arab', 'irish', 'italian', 'mixed'], 'Fort Hamilton': ['arab', 'italian', 'mixed'],
  'Kensington': ['southasian', 'southasian', 'jewish', 'mixed'], 'Ditmas Park': ['caribbean', 'southasian', 'mixed'], 'Greenpoint': ['polish', 'polish', 'mixed'], 'Williamsburg': ['mixed', 'latino', 'jewish'],
  'Marine Park': ['irish', 'italian', 'mixed'], 'Gerritsen Beach': ['irish', 'irish', 'italian'], 'Mill Basin': ['italian', 'jewish', 'caribbean'], 'Bergen Beach': ['italian', 'caribbean', 'mixed'],
  'Coney Island': ['latino', 'black', 'russian'], 'Red Hook': ['latino', 'black', 'mixed'], 'Park Slope': ['mixed', 'mixed', 'irish'], 'Carroll Gardens': ['italian', 'mixed'],
};

// Jobs, each with lines in that person's voice (opinions and jokes, not facts)
const JOBS: { title: string; lines: string[]; look?: Partial<Look>; where?: 'park' | 'beach' }[] = [
  { title: 'The Super', look: { acc: 'apron' }, lines: ['Boiler\'s fine. The boiler is always fine until it isn\'t.', 'Forty units. Forty keys. One of them opens nothing and I\'m afraid to throw it out.', 'Tell your landlord: the super is on the tenants\' side. Don\'t tell him I said that.', 'Somebody keeps putting pizza boxes in the paper recycling. I will find you.'] },
  { title: 'Crossing Guard', look: { shirt: '#ff8a3d' }, lines: ['Walk. Don\'t run. Okay, now run, that cab isn\'t stopping.', 'Twenty years on this corner. I\'ve crossed kids who now cross their own kids.', 'The light is a suggestion to drivers. I am not a suggestion.', 'Hold up. Hold up. ...Go.'] },
  { title: 'Retired Teacher', look: { acc: 'glasses' }, lines: ['I taught half this block to read. The other half I\'m still working on.', 'Thirty-one years at the elementary school. Every September still feels like New Year\'s.', 'Sit up straight. Sorry. Habit.', 'Library card. Get one. Use it. Quiz on Friday.'] },
  { title: 'Night-Shift Nurse', look: { shirt: '#4ab0a0' }, lines: ['Twelve hours on my feet. Don\'t ask me to climb stairs.', 'Drink water. I don\'t care what else you\'re doing today. Water.', 'I\'ve seen everything. Then a Tuesday happens.', 'Off at 7am, coffee at 7:05, bed by 7:30. That\'s the dream.'] },
  { title: 'Bus Driver', look: { shirt: '#1b4fa0' }, lines: ['I know every pothole on my route by first name.', 'Please move to the back. Please. Please. Okay, I\'ll just say it louder.', 'Best part of the job: the regulars. Worst part: everything else.', 'You can\'t rush a bus. The bus rushes you.'] },
  { title: 'Block Association President', look: { acc: 'clipboard' }, lines: ['Meeting\'s the second Tuesday. There will be cookies. There will be agenda.', 'We got a tree planted last spring. Took two years and forty emails.', 'The block party needs volunteers. You look like a volunteer.', 'Our minutes are better than City Council\'s. I write them.'] },
  { title: 'Barber', look: { acc: 'apron' }, lines: ['Sit down, I can fix that. Whatever that is.', 'The shop hears everything. The shop says nothing. Mostly.', 'Saturday the wait is two hours and nobody leaves. That\'s community.', 'Line-up, fade, sports argument. Package deal.'] },
  { title: 'Mail Carrier', look: { shirt: '#3a5a8a', acc: 'tote' }, lines: ['Rain, snow, dogs. The dogs are the real test.', 'I know who gets letters and who only gets bills. I keep that to myself.', 'Fourteen miles a day. My step counter thinks I\'m training for something.', 'Put your name on the mailbox. Please. Everybody\'s "Resident."'] },
  { title: 'Delivery Worker', look: { acc: 'headphones' }, lines: ['Six deliveries in the rain and four "thank you"s. That\'s a good day.', 'Buildings without elevators: my nemesis.', 'I know every shortcut in this neighborhood. Some of them are legal.', 'Tip what you can. Say hi either way.'] },
  { title: 'Grandmother on the Stoop', look: { acc: 'cane' }, lines: ['I\'ve watched this street for fifty years. It\'s my show.', 'Come here. Eat something. You look thin.', 'Back in my day the ice cream truck was a nickel. Now it\'s a car payment.', 'Sit with me a minute. Nobody sits anymore.'] },
  { title: 'Corner Store Owner', look: { acc: 'apron' }, lines: ['Take it, pay me tomorrow. You\'re good for it.', 'The cat runs the store. I just work here.', 'Open 6am to midnight. Seven days. Ask me about vacations. I dare you.', 'Everybody on this block owes me two dollars. I love them anyway.'] },
  { title: 'Youth Coach', look: { acc: 'headphones' }, lines: ['Practice at four. Homework first. Non-negotiable.', 'I don\'t care if you win. I care if you show up. Then I care if you win.', 'These kids need a field, a ball and an adult who believes them.', 'Whistle\'s around my neck even on Sundays.'] },
  { title: 'Artist', look: { acc: 'beret' }, lines: ['I\'m painting the block. Literally. With permission. Mostly.', 'This wall needs a mural and I need a commission. We can help each other.', 'Art is how a neighborhood remembers itself.', 'I sold a painting! To my mom. Still counts.'] },
  { title: 'Tenant Organizer', look: { acc: 'clipboard' }, lines: ['Know your lease. Know your neighbors. Know your rights. In that order.', 'One tenant complaining is a nuisance. Forty is an association.', 'We meet in the lobby on Thursdays. Bring a chair and a grievance.', 'Repairs happen faster when the whole building asks.'] },
  { title: 'Street Vendor', look: { acc: 'apron' }, lines: ['Mango with chili, best thing you\'ll eat all week.', 'I\'ve had this corner for twelve years. The corner and I understand each other.', 'Permit\'s in my pocket. Smile\'s on my face. Mango\'s in your hand.', 'Cash, card, whatever. Just eat.'] },
  { title: 'Librarian', look: { acc: 'glasses' }, lines: ['Shh. Kidding. Libraries are loud now. On purpose.', 'Free wifi, free books, free classes, free AC. We are the last free place.', 'Overdue? We don\'t do fines anymore. Come back.', 'Ask me anything. I mean it. That\'s the job.'] },
  { title: 'Dog Walker', where: 'park', look: { acc: 'tote' }, lines: ['Six dogs, one leash hand. It\'s a skill.', 'I know every dog in the neighborhood by name and none of their owners.', 'The park at 7am is the dogs\' town hall.', 'Biscuit is the boss. Don\'t tell the others.'] },
  { title: 'Chess Hustler', where: 'park', lines: ['Five dollars a game. I\'m being generous.', 'Sit. Move. Lose. It\'s educational.', 'I\'ve played this table thirty years. The table is winning.', 'Checkmate. Don\'t feel bad. Feel motivated.'] },
  { title: 'Park Volunteer', where: 'park', look: { acc: 'tote' }, lines: ['Gloves, bags, Saturday mornings. Join us.', 'Every tree here somebody fought for.', 'We planted daffodils. Somebody planted a lawn chair. Both are thriving.', 'Pick up one piece of trash. That\'s it. That\'s the movement.'] },
  { title: 'Lifeguard', where: 'beach', look: { shirt: '#e8302a' }, lines: ['Swim between the flags. I\'m not asking.', 'Sunscreen. Water. Shade. Repeat.', 'Best view in Brooklyn and I can\'t look at it, I\'m watching you.', 'If I blow the whistle, it\'s for you. Probably.'] },
  { title: 'Fisherman', where: 'beach', look: { acc: 'tote' }, lines: ['Fluke biting today. Or I am lying. One of those.', 'Been fishing here since before the condos. The fish don\'t care about condos.', 'Patience. That\'s the whole sport.', 'Caught a shopping cart once. Threw it back.'] },
];

// Gay, lesbian and trans neighbors (Deroy, Nov 22 2026), in their own words; never the joke. The lines say it plainly,
// whoever is speaking. New York's marriage equality law took effect in July 2011.
const QUEER = [
  'We got married at Borough Hall the summer it became legal in New York. 2011. Two grooms, one very nervous cake.',
  'We got married the summer it became legal here. 2011. Two brides, and my mother cried the loudest.',
  "I'm gay, I'm sixty-four, and I've lived on this block my whole life. This block is my family. Some of it is my actual family.",
  'Me and my girlfriend run the block\'s tool library. Need a ladder? We have four.',
  'My husband and I fostered six kids on this street. Two of them still come for Sunday dinner. With their kids.',
  'Our rainbow flag has hung in that window since the nineties. The neighbors replace it when it fades. Every time.',
];
const TRANS = [
  'I came out at forty. My neighbors threw me a block party. Best birthday of my life.',
  'New name, same stoop. The block caught on fast. The bodega cat took a week.',
  "I'm trans and I'm from Brooklyn. Both are permanent. Both are the best thing about me.",
  'My abuela corrects people on my pronouns now. She\'s faster than me.',
];

const SKIN = ['#2e1a12', '#3e2418', '#4a2c1c', '#5a3624', '#6b4430', '#7a4a30', '#8d5a3a', '#a8714a', '#b98058', '#c58a5c', '#d9a679', '#e2b08a', '#e8c0a0', '#f2d2b8', '#f6dcc6'];
const HAIR = ['#1a1010', '#1a1010', '#2a1c14', '#3a2418', '#4a2a1a', '#6a4a2a', '#7a5a3a', '#a8743a', '#c9a25a', '#e0c070', '#8a3a2a', '#b84a2a', '#d8d4dc', '#e8e4f0', '#9a9aa8', '#ff4fa3', '#7b3fe4', '#2fd1c5'];
const SHIRT = ['#ff4fa3', '#2fd1c5', '#ffd23f', '#7b3fe4', '#ff8a3d', '#6fcf5e', '#1b4fa0', '#c83a4a', '#e8e4dc', '#3a3a4a', '#9b59d0', '#ff6b6b', '#2f6a4a', '#8a5a3a', '#f2efe6', '#4a6a8a', '#c9a43a', '#5a3a6a', '#e86a9a', '#3a8ad4', '#a8b98e', '#d4a24a', '#1a1a20', '#b85a3a'];
const PANTS = ['#2b2b40', '#2b3a6b', '#3a2a1a', '#4a4a5a', '#1a1a20', '#5a4a32', '#6a5a4a', '#3a5a8a', '#7a2a3a', '#c9b9a0', '#2f4a3a', '#8a7a9a'];
const SHOES = ['#f2f2f2', '#111', '#3a2a1a', '#ff4fa3', '#2fd1c5', '#c83a4a', '#7a5a3a', '#ffd23f'];
const ACCS: (Look['acc'] | undefined)[] = [undefined, undefined, undefined, 'glasses', 'glasses', 'tote', 'phone', 'headphones', 'scarf', 'beret', 'bandana', 'cane', 'tie'];
const STYLES: Look['style'][] = ['short', 'short', 'afro', 'bun', 'long', 'long', 'bald', 'beanie', 'cap', 'braids', 'braids', 'curly', 'curly', 'mohawk'];
const COLORS = ['#ffb23f', '#8fd4ff', '#ff9ec7', '#7fd45a', '#c9a2ff', '#ffd23f', '#ff8a3d', '#4fd18b'];

const USED = new Set<string>();
function folkFor(c: number, r: number): BlockFolk | null {
  const v = CELLS[r]?.[c]; if (v === undefined || v < 0) return null;
  const k = KINDS[r][c]; if (k === 'c') return null; // cemeteries have their ghosts
  const [hood, district] = NEIGHBORHOODS[v] as [string, District];
  const h = hash(`folk:${c},${r}`), at = (n: number, s: number) => (h >>> s) % n;
  const isBeach = district === 'coneyisland' && CELLS[r + 1]?.[c] === -1 && k !== 'p';
  const where = isBeach ? 'beach' : k === 'p' ? 'park' : undefined;
  const pool = JOBS.filter((j) => (where ? j.where === where : !j.where));
  const job = pool[at(pool.length, 3)];
  const groups = HOOD_NAMES[hood] ?? ['mixed', 'mixed', 'black', 'latino', 'caribbean'];
  const names = NAMES[groups[at(groups.length, 7)]];
  let name = names[at(names.length, 11)];
  for (let i = 1; USED.has(name) && i < names.length; i++) name = names[(at(names.length, 11) + i) % names.length];
  for (let i = 0, base = name; USED.has(name) && i < 18; i++) name = `${base} ${'ABCDEFGHJKLMNPRSTW'[(at(18, 13) + i) % 18]}.`; // two Mrs. Wongs on one map get different initials
  USED.add(name);
  const g = groups[at(groups.length, 7)];
  // Every feature gets its own roll, so looks don't move together
  const roll = (what: string, n: number) => hash(`folk:${c},${r}:${what}`) % n;
  const style: Look['style'] = g === 'arab' && roll('cover', 3) === 0 ? 'hijab' : g === 'jewish' && roll('cover', 3) === 0 ? 'kippah' : g === 'southasian' && roll('cover', 5) === 0 ? 'turban' : STYLES[roll('style', STYLES.length)];
  const uniform = roll('uniform', 2) === 0 ? job.look ?? {} : {}; // half the time you see the work clothes
  const look: Look = {
    skin: SKIN[roll('skin', SKIN.length)], hair: HAIR[roll('hair', HAIR.length)], style, shirt: SHIRT[roll('shirt', SHIRT.length)],
    pants: PANTS[roll('pants', PANTS.length)], shoes: SHOES[roll('shoes', SHOES.length)], hatColor: SHIRT[roll('hat', SHIRT.length)],
    acc: ACCS[roll('acc', ACCS.length)], dress: roll('dress', 3) === 0, ...uniform,
  };
  return {
    id: `bf_${c}_${r}`, name, short: name, title: `${job.title}, ${hood}`, district, spot: `bf_${c}_${r}`, color: COLORS[at(COLORS.length, 9)],
    look, bio: `${job.title} in ${hood}. Has opinions about this block, and about you, which are mostly good.`, block: [c, r], blockFolk: true,
    idle: (() => { const who = roll('who', 25); return who < 2 ? [QUEER[roll('q', QUEER.length)], ...job.lines] : who === 2 ? [TRANS[roll('t', TRANS.length)], ...job.lines] : job.lines; })(),
  };
}

export const BLOCK_FOLK: BlockFolk[] = [];
for (let r = 0; r < CELLS.length; r++) for (let c = 0; c < CELLS[r].length; c++) { const f = folkFor(c, r); if (f) BLOCK_FOLK.push(f); }
