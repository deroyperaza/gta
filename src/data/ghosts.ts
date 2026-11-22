/**
 * Green-Wood Cemetery's famous residents, as ghosts you can talk to on the cemetery's paths.
 * Their conversations are fiction, written with respect, and each ties a real life to something the game teaches.
 * Only well-documented biographical facts are used (all five are buried at Green-Wood; see
 * docs/FACTS-brooklyn-org-tensions-care-parks.md, section D):
 * - William M. "Boss" Tweed (1823–1878): led Tammany Hall's ring that stole millions from New York City; convicted;
 *   died in the Ludlow Street Jail.
 * - Horace Greeley (1811–1872): founded the New-York Tribune (1841); ran for president in 1872 and died weeks after losing.
 * - Leonard Bernstein (1918–1990): music director of the New York Philharmonic; composed West Side Story; hosted the
 *   televised Young People's Concerts.
 * - Jean-Michel Basquiat (1960–1988): born in Brooklyn; started out writing SAMO© graffiti around Manhattan with Al Diaz.
 * - Louis Comfort Tiffany (1848–1933): stained-glass artist and designer (the Tiffany lamp).
 */
import type { Dialogue } from '../systems/dialogue';
import type { NpcDef } from './npcs';

interface Ghost extends NpcDef { at: [number, number]; dialogue: Dialogue; ghost: true; /** haunts a place in Brooklyn, not Green-Wood */ street?: true }

const met = (id: string) => ({ flags: { [`met_${id}`]: true } });
const talk = (id: string, first: Dialogue['nodes'], start: string, again: string): Dialogue => ({
  entries: [{ cond: { flag: `met_${id}` }, node: `${id}_again` }, { node: start }],
  nodes: { ...first, [`${id}_again`]: { speaker: id, text: again } },
});

export const GHOSTS: Ghost[] = [
  {
    id: 'tweed', name: 'The Ghost of Boss Tweed', short: 'Boss Tweed', title: 'Tammany Hall, 1823–1878', district: 'sunsetpark', spot: 'gh_tweed', at: [40.6572, -73.9930], color: '#9fb8a0', ghost: true,
    look: { skin: '#e8d8c8', hair: '#8a7a6a', style: 'short', shirt: '#2a2a30', pants: '#2a2a30', shoes: '#111', acc: 'tie' },
    bio: 'Ran Tammany Hall\'s ring, which stole millions from New York City in the 1860s and \'70s. Convicted. Died in the Ludlow Street Jail. Still thinks it was a misunderstanding.',
    idle: ['Psst. Want a contract? No bid required.', 'They called it graft. I called it "a system."', 'Who audits the auditors? Hopefully nobody.'],
    dialogue: talk('tweed', {
      tweed_0: { speaker: 'tweed', text: '*A portly ghost in a fine coat counts invisible money.* Ah, a visitor. In my day I ran this city. Every contract, every courthouse, a little for the city, a lot for the ring.', choices: [{ text: 'How did they finally catch you?', next: 'tweed_1' }] },
      tweed_1: { speaker: 'tweed', text: 'Somebody leaked the books. Newspapers printed the numbers. Cartoonists drew me as a moneybag. Once people could SEE the money, I was finished. Terrible business.', choices: [
        { text: 'So the fix is making the city\'s money public, and having someone whose job is to check it.', tag: 'BEST', next: 'tweed_2' },
        { text: 'Sounds like you were just unlucky.', next: 'tweed_3' }] },
      tweed_2: { speaker: 'tweed', text: '*He shudders.* You sound like that Comptroller fellow. Auditing! Posting votes on the open internet! It\'s indecent. ...It works, of course. That\'s what\'s indecent.', choices: [{ text: '(Leave him counting.)', effects: { solidarity: 6, ...met('tweed') } }] },
      tweed_3: { speaker: 'tweed', text: 'Unlucky! Yes! Finally, someone understands. *He beams.* ...No, young person. I was caught because people looked. Keep looking. It\'s the only thing that ever stopped me.', choices: [{ text: '(Leave him counting.)', effects: met('tweed') }] },
    }, 'tweed_0', 'Back again? Nobody visits a crook twice unless they\'re taking notes. Good. Take notes.'),
  },
  {
    id: 'greeley', name: 'The Ghost of Horace Greeley', short: 'Horace Greeley', title: 'Newspaper Editor, 1811–1872', district: 'sunsetpark', spot: 'gh_greeley', at: [40.6558, -73.9905], color: '#b8c8e8', ghost: true,
    look: { skin: '#f0e0d0', hair: '#f2f2f2', style: 'bald', shirt: '#e8e4d8', pants: '#3a3a40', shoes: '#111', acc: 'glasses' },
    bio: 'Founded the New-York Tribune in 1841. Ran for president in 1872, lost, and died weeks later. Has opinions about everything, mostly in print.',
    idle: ['Extra! Extra! ...Nobody says that anymore, do they.', 'Read the whole article. Not just the headline.', 'A city without newspapers is a city with secrets.'],
    dialogue: talk('greeley', {
      greeley_0: { speaker: 'greeley', text: '*A white-whiskered ghost waves a newspaper only he can read.* I started a newspaper so working people could know what the powerful were doing. Who tells your neighborhood what\'s going on now?', choices: [
        { text: 'Local reporters, community boards, people posting the minutes. And neighbors who show up and tell each other.', tag: 'BEST', next: 'greeley_1' },
        { text: 'Mostly the group chat.', next: 'greeley_2' }] },
      greeley_1: { speaker: 'greeley', text: 'Good. Then guard them. A neighborhood that knows what\'s happening can do something about it. I ran for president, you know. I lost. Badly. Run anyway. Losing teaches more than winning.', choices: [{ text: '(Tip your hat.)', effects: { solidarity: 6, ...met('greeley') } }] },
      greeley_2: { speaker: 'greeley', text: 'The group chat! A newspaper with no editor and forty publishers. ...Fine. But check the facts before you forward. That\'s the whole job. That was always the whole job.', choices: [{ text: '(Promise to check before forwarding.)', effects: met('greeley') }] },
    }, 'greeley_0', 'Still checking your facts? Good. Print them.'),
  },
  {
    id: 'bernstein', name: 'The Ghost of Leonard Bernstein', short: 'Leonard Bernstein', title: 'Composer, Conductor, 1918–1990', district: 'sunsetpark', spot: 'gh_bernstein', at: [40.6545, -73.9880], color: '#d8b8ff', ghost: true,
    look: { skin: '#e8c8a8', hair: '#d8d4dc', style: 'curly', shirt: '#1a1a20', pants: '#1a1a20', shoes: '#111', acc: 'scarf' },
    bio: 'Led the New York Philharmonic. Wrote the music for West Side Story. Taught a generation of kids to love music on television, in the Young People\'s Concerts.',
    idle: ['*conducts the wind*', 'Music isn\'t for some people. It\'s for people.', 'There\'s a show at the Bandshell tonight. I can hear it from here.'],
    dialogue: talk('bernstein', {
      bernstein_0: { speaker: 'bernstein', text: '*A ghost conducts an orchestra nobody else can see. He stops mid-bar.* You hear that? The Bandshell, all the way from Prospect Park. Free music, outdoors, for everybody. Exactly right.', choices: [
        { text: 'You did concerts for kids on TV, right?', next: 'bernstein_1' }] },
      bernstein_1: { speaker: 'bernstein', text: 'The Young People\'s Concerts. Millions of kids, in their living rooms, learning that a symphony belongs to them too. Art shouldn\'t need a ticket price to find you.', choices: [
        { text: 'That\'s what the library\'s Culture Pass does: free museum passes with a library card.', tag: 'BEST', next: 'bernstein_2' },
        { text: 'Art is pretty expensive now, though.', next: 'bernstein_3' }] },
      bernstein_2: { speaker: 'bernstein', text: 'A library card that opens every door in the city! *He conducts a triumphant chord.* Tell every kid. Twice.', choices: [{ text: '(Bow.)', effects: { solidarity: 6, ...met('bernstein') } }] },
      bernstein_3: { speaker: 'bernstein', text: 'Then fight for the free parts. The Bandshell. The library. The kid with a trumpet on the subway platform. That\'s where the next one of us is.', choices: [{ text: '(Bow.)', effects: met('bernstein') }] },
    }, 'bernstein_0', '*He hums the opening of something you almost recognize.* Go dance at the Bandshell. That\'s an order.'),
  },
  {
    id: 'basquiat', name: 'The Ghost of Jean-Michel Basquiat', short: 'Basquiat', title: 'Artist, Born in Brooklyn, 1960–1988', district: 'sunsetpark', spot: 'gh_basquiat', at: [40.6530, -73.9935], color: '#ffd23f', ghost: true,
    look: { skin: '#5a3624', hair: '#1a1010', style: 'mohawk', shirt: '#e8e4d8', pants: '#2b2b40', shoes: '#111' },
    bio: 'Born in Brooklyn. Started out writing SAMO© on walls around Manhattan with his friend Al Diaz. Became one of the most important painters of his time. Died at 27.',
    idle: ['*sketches a crown in the air*', 'Brooklyn first. Always.', 'Walls talk. Somebody has to write on them.'],
    dialogue: talk('basquiat', {
      basquiat_0: { speaker: 'basquiat', text: '*A young ghost sits on a headstone, drawing crowns on the air with one finger. He doesn\'t look up.* You\'re putting up posters around Brooklyn. I started on walls too.', choices: [
        { text: 'Where should I put them so they stay up and don\'t get people fined?', tag: 'BEST', next: 'basquiat_1' },
        { text: 'Anywhere I want. It\'s art.', next: 'basquiat_2' }] },
      basquiat_1: { speaker: 'basquiat', text: 'Ask the bodega. Ask the laundromat. Community boards. Walls people say yes to. Your message lasts longer where somebody wants it. *He draws a crown over your head.*', choices: [{ text: '(Keep the crown.)', effects: { solidarity: 6, ...met('basquiat') } }] },
      basquiat_2: { speaker: 'basquiat', text: '*He smiles, a little.* It is. And lampposts get you fined. Ask the bodega, ask the laundromat. Put your words where people will keep them.', choices: [{ text: '(Nod.)', effects: met('basquiat') }] },
    }, 'basquiat_0', '*He\'s drawing again. A crown, a skyline, something that might be your face.* Keep going.'),
  },
  {
    id: 'tiffany', name: 'The Ghost of Louis Comfort Tiffany', short: 'L. C. Tiffany', title: 'Stained-Glass Artist, 1848–1933', district: 'sunsetpark', spot: 'gh_tiffany', at: [40.6515, -73.9900], color: '#8fe3d0', ghost: true,
    look: { skin: '#f0e0d0', hair: '#bdb7c4', style: 'short', shirt: '#3a5a8a', pants: '#3a3a40', shoes: '#111', acc: 'tie' },
    bio: 'Made stained glass and lamps that still glow in churches, libraries and living rooms. Believed beauty belonged in everyday life, not just in palaces.',
    idle: ['Light through colored glass. Nothing better.', 'A library should be beautiful. People deserve beauty where they wait.', 'Have you seen what golden hour does to brownstone? Exquisite.'],
    dialogue: talk('tiffany', {
      tiffany_0: { speaker: 'tiffany', text: '*A ghost holds a pane of colored glass up to the sunset.* People think beauty is a luxury. I made windows for churches and libraries, places everyone walks into. What\'s the most beautiful public place in your Brooklyn?', choices: [
        { text: 'Grand Army Plaza at sunset. Or the library steps.', next: 'tiffany_1' }, { text: 'The bodega at 2 a.m., honestly.', next: 'tiffany_1' }] },
      tiffany_1: { speaker: 'tiffany', text: 'Then defend it. Beauty everyone can reach isn\'t decoration. It\'s a promise a city makes to its people. *He hands you a piece of light. It disappears in your hand.*', choices: [{ text: '(Thank him.)', effects: { solidarity: 5, ...met('tiffany') } }] },
    }, 'tiffany_0', 'The light is good this evening. It always is, here.'),
  },
  // ---------------------------------------------------------------- ghosts who haunt their own Brooklyn places
  // Facts: docs/FACTS-landmarks-jackie-whitman.md (Jackie Robinson, Walt Whitman)
  {
    id: 'jackie', name: 'The Ghost of Jackie Robinson', short: 'Jackie Robinson', title: 'Brooklyn Dodgers, 1919–1972', district: 'crownheights', spot: 'gh_jackie', at: [40.665, -73.95806], color: '#4f8cff', ghost: true, street: true,
    look: { skin: '#5a3624', hair: '#1a1010', style: 'cap', hatColor: '#1f4fb8', shirt: '#f2f2f2', pants: '#f2f2f2', shoes: '#111' },
    bio: 'Broke Major League Baseball\'s color barrier with the Brooklyn Dodgers on April 15, 1947, right here at Ebbets Field. Rookie of the Year. Won the 1955 World Series. Then served on the NAACP\'s board and co-founded a Black-owned bank in Harlem.',
    idle: ['This was Ebbets Field. Bedford Avenue, Sullivan Place.', 'April 15, 1947. I remember every sound.', 'The game was the start. The work came after.'],
    dialogue: talk('jackie', {
      jackie_0: { speaker: 'jackie', text: '*A ghost in a Dodgers uniform stands where home plate used to be. Today it\'s an apartment courtyard.* April 15, 1947. Right here. First base, Brooklyn Dodgers. Plenty of people didn\'t want me on that field.', choices: [{ text: 'How did you keep going?', next: 'jackie_1' }] },
      jackie_1: { speaker: 'jackie', text: 'Brooklyn showed up. And I knew it wasn\'t only about me. After baseball I served on the NAACP\'s board and helped start a Black-owned bank in Harlem, so our neighborhoods could get loans. The game opened a door. Organizing kept it open.', choices: [
        { text: 'So winning one fight is the start, and the real work is building something that lasts.', tag: 'BEST', next: 'jackie_2' },
        { text: 'So the big moment is what really matters.', next: 'jackie_3' }] },
      jackie_2: { speaker: 'jackie', text: 'That\'s it. I wrote it once: "A life is not important except in the impact it has on other lives." Go make an impact on this block.', choices: [{ text: '(Tip your cap.)', effects: { solidarity: 8, flags: { met_jackie: true } } }] },
      jackie_3: { speaker: 'jackie', text: 'The moment gets the headlines. The years after are what change things: the boards, the bank, the meetings nobody films. I wrote: "A life is not important except in the impact it has on other lives."', choices: [{ text: '(Tip your cap.)', effects: { solidarity: 4, flags: { met_jackie: true } } }] },
    }, 'jackie_0', '*He tosses an invisible ball from hand to hand.* Brooklyn\'s still got the best fans in the world. Use them.'),
  },
  {
    id: 'whitman', name: 'The Ghost of Walt Whitman', short: 'Walt Whitman', title: 'Poet, Brooklyn Daily Eagle Editor, 1819–1892', district: 'downtown', spot: 'gh_whitman', at: [40.6918, -73.9756], color: '#d8c8a0', ghost: true, street: true,
    look: { skin: '#f0e0d0', hair: '#f2f2f2', style: 'curly', shirt: '#7a6a50', pants: '#4a4030', shoes: '#3a2a1a' },
    bio: 'Edited the Brooklyn Daily Eagle in 1846 and 1847, and used it to demand a public park on this hill. The city created Washington Park, renamed Fort Greene Park in 1897. Buried in Camden, New Jersey; haunts Fort Greene anyway.',
    idle: ['A park for everybody. Not a lawn for a few.', 'I wrote a poem about this hill in 1846.', 'Brooklyn! Brooklyn! Have I mentioned Brooklyn?'],
    dialogue: talk('whitman', {
      whitman_0: { speaker: 'whitman', text: '*A bearded ghost in a slouch hat strolls the hill, reading a newspaper from 1846.* I edited the Eagle, you know. I used it to shout, week after week, that working people deserved a park on this hill. Fresh air shouldn\'t belong only to the rich.', choices: [{ text: 'Did it work?', next: 'whitman_1' }] },
      whitman_1: { speaker: 'whitman', text: 'The city made Washington Park. Today you call it Fort Greene Park. One editor didn\'t do it alone, mind you. Neighbors wanted it, and kept wanting it out loud.', choices: [
        { text: 'So public space gets won when people keep asking for it, loudly and together.', tag: 'BEST', next: 'whitman_2' },
        { text: 'So a famous writer can get anything built.', next: 'whitman_3' }] },
      whitman_2: { speaker: 'whitman', text: 'Yes! Write it down, print it, say it at the meeting, then say it again. A park is a promise a city keeps when people won\'t let it forget.', choices: [{ text: '(Walk the hill with him.)', effects: { solidarity: 7, flags: { met_whitman: true } } }] },
      whitman_3: { speaker: 'whitman', text: 'Ha! I wasn\'t famous yet. I was a newspaperman with opinions. It\'s the neighbors who wanted it, out loud, who made it happen. Fame is just being loud for a long time.', choices: [{ text: '(Walk the hill with him.)', effects: { solidarity: 4, flags: { met_whitman: true } } }] },
    }, 'whitman_0', 'I contain multitudes. So does this park. Look at all of you.'),
  },

  // ---------------------------------------------------------------- more Green-Wood residents (docs/FACTS-ghosts.md)
  {
    id: 'mckinney', name: 'The Ghost of Dr. Susan Smith McKinney Steward', short: 'Dr. McKinney Steward', title: "New York's First Black Woman Doctor", district: 'sunsetpark', spot: 'gh_mckinney', at: [40.6540, -73.9870], color: '#ff9fc8', ghost: true,
    look: { skin: '#6b3e26', hair: '#2a1a12', style: 'bun', shirt: '#4a2a5a', pants: '#2a1a2a', shoes: '#111', dress: true, acc: 'glasses' },
    bio: 'Born in Weeksville, the free Black community in Brooklyn. In 1870 became the first Black woman doctor in New York State, first in her class. Co-founded a hospital for women in Brooklyn. Cared for mothers and children. Supported women\'s right to vote.',
    idle: ['Weeksville raised me. Then I raised a few hospitals.', 'First in my class. Say it twice, it\'s worth it.', 'A city is as healthy as its least-cared-for block.'],
    dialogue: talk('mckinney', {
      mckinney_0: { speaker: 'mckinney', text: '*A ghost in a high-collared dress checks a pocket watch, then your pulse.* Hm. Elevated. You\'ve been organizing. I grew up in Weeksville, a free Black community right here in Brooklyn. Then I went to medical school.', choices: [{ text: 'You were the first Black woman doctor in New York State.', next: 'mckinney_1' }] },
      mckinney_1: { speaker: 'mckinney', text: 'In 1870. First in my class, too. Then I helped start a hospital for women in Brooklyn, because the hospitals that existed weren\'t built for us. If the door won\'t open, you build a door.', choices: [
        { text: 'So when a system leaves people out, you can build what\'s missing, together.', tag: 'BEST', next: 'mckinney_2' },
        { text: 'So you just have to be the best, and doors open.', next: 'mckinney_3' }] },
      mckinney_2: { speaker: 'mckinney', text: 'Precisely. And bring others through it. That\'s the medicine.', choices: [{ text: '(Thank her.)', effects: { solidarity: 7, flags: { met_mckinney: true } } }] },
      mckinney_3: { speaker: 'mckinney', text: 'Being the best helped. It didn\'t open the door. Building our own hospital did. Excellence plus organizing, dear. Never one without the other.', choices: [{ text: '(Thank her.)', effects: { solidarity: 4, flags: { met_mckinney: true } } }] },
    }, 'mckinney_0', 'Drink water. Check on your neighbors. Doctor\'s orders.'),
  },
  {
    id: 'ebbets', name: 'The Ghost of Charles Ebbets', short: 'Charles Ebbets', title: 'Built Ebbets Field, 1859–1925', district: 'sunsetpark', spot: 'gh_ebbets', at: [40.6562, -73.9918], color: '#4f8cff', ghost: true,
    look: { skin: '#f0e0d0', hair: '#8a7a6a', style: 'short', shirt: '#2a3a5a', pants: '#2a2a30', shoes: '#111', acc: 'tie' },
    bio: 'Owned the Brooklyn Dodgers and quietly bought up lots in a neighborhood called Pigtown to build Ebbets Field, which opened in 1913. The Dodgers played there until 1957. Today the site is the Ebbets Field Apartments, affordable homes for about 1,300 families.',
    idle: ['I bought that land one lot at a time. Took years.', 'They tore my ballpark down in 1960. Families live there now. Fair trade.', 'Have you met Jackie? Finest ballplayer who ever stood on my field.'],
    dialogue: talk('ebbets', {
      ebbets_0: { speaker: 'ebbets', text: '*A ghost in a bowler hat holds a stack of deeds.* I built a ballpark in Brooklyn. Bought the land one little lot at a time, so nobody would raise the price. Now it\'s apartments. About 1,300 families.', choices: [
        { text: 'A ballpark became affordable homes. Land can change who it serves.', tag: 'BEST', next: 'ebbets_1' },
        { text: 'They should have kept the ballpark.', next: 'ebbets_1' }] },
      ebbets_1: { speaker: 'ebbets', text: 'I miss it too. But a city is always deciding what its land is for. Somebody gets to decide. Make sure it\'s the neighborhood.', choices: [{ text: '(Tip your cap.)', effects: { solidarity: 5, flags: { met_ebbets: true } } }] },
    }, 'ebbets_0', 'Go visit Jackie at the old field. Tell him Charlie says hello.'),
  },
  {
    id: 'chadwick', name: 'The Ghost of Henry Chadwick', short: 'Henry Chadwick', title: '"Father of Baseball" Stats, 1824–1908', district: 'sunsetpark', spot: 'gh_chadwick', at: [40.6548, -73.9938], color: '#8fd4ff', ghost: true,
    look: { skin: '#f0e0d0', hair: '#f2f2f2', style: 'short', shirt: '#5a5040', pants: '#3a3a40', shoes: '#111', acc: 'glasses' },
    bio: 'Brooklyn sportswriter who invented the box score and the "K" for a strikeout, and helped popularize batting average. His grave has a granite baseball on it. In the Baseball Hall of Fame since 1938.',
    idle: ['Numbers don\'t lie. People do, with numbers.', 'I invented the K. You\'re welcome, pitchers.', 'Write it down. Count it. Then you can see it.'],
    dialogue: talk('chadwick', {
      chadwick_0: { speaker: 'chadwick', text: '*A ghost scribbles numbers in a tiny notebook.* Before me, nobody wrote down what happened in a ball game. I invented the box score. Suddenly everybody could SEE the game, not just the people in the stands.', choices: [
        { text: 'That\'s what counting does for organizing too: one onion in three stores, written down, changes the meeting.', tag: 'BEST', next: 'chadwick_1' },
        { text: 'Stats are kind of boring, though.', next: 'chadwick_1' }] },
      chadwick_1: { speaker: 'chadwick', text: 'Ha! Boring is how you win arguments. Count the evictions, the late buses, the broken swings. Then nobody can say it\'s just a feeling.', choices: [{ text: '(Borrow his pencil.)', effects: { solidarity: 5, flags: { met_chadwick: true } } }] },
    }, 'chadwick_0', 'What did you count today? Show me.'),
  },
  {
    id: 'beecher', name: 'The Ghost of Henry Ward Beecher', short: 'Henry Ward Beecher', title: 'Plymouth Church, 1813–1887', district: 'sunsetpark', spot: 'gh_beecher', at: [40.6525, -73.9912], color: '#d8c8a0', ghost: true,
    look: { skin: '#f0e0d0', hair: '#a8a0a0', style: 'long', shirt: '#2a2a30', pants: '#2a2a30', shoes: '#111' },
    bio: 'First pastor of Plymouth Church in Brooklyn Heights, called the "Grand Central Depot" of the Underground Railroad. In 1860 his congregation raised money to free a 9-year-old girl named Sally Maria Diggs. Later sued in a famous trial that ended with the jury unable to agree.',
    idle: ['Plymouth Church. Orange Street. Come see it.', 'The Underground Railroad ran through Brooklyn Heights.', 'A congregation that acts is a movement.'],
    dialogue: talk('beecher', {
      beecher_0: { speaker: 'beecher', text: '*A ghost in a dark frock coat stands as if at a pulpit.* My church in Brooklyn Heights helped people escaping slavery find their way north. People called it the "Grand Central Depot" of the Underground Railroad. In 1860 my congregation raised money to free a little girl.', choices: [
        { text: 'So a congregation became a network that acted, not just a room that listened.', tag: 'BEST', next: 'beecher_1' },
        { text: 'So the preacher saved everyone.', next: 'beecher_1' }] },
      beecher_1: { speaker: 'beecher', text: 'The people in the pews did the work: the hiding, the funds, the risk. I just talked loudly. A movement is a room full of people who decide to act.', choices: [{ text: '(Nod.)', effects: { solidarity: 5, flags: { met_beecher: true } } }] },
    }, 'beecher_0', 'Visit Plymouth Church in Brooklyn Heights. The history is in the walls.'),
  },
  {
    id: 'clinton', name: 'The Ghost of DeWitt Clinton', short: 'DeWitt Clinton', title: 'Mayor, Governor, Erie Canal, 1769–1828', district: 'sunsetpark', spot: 'gh_clinton', at: [40.6508, -73.9925], color: '#c9b38a', ghost: true,
    look: { skin: '#f0e0d0', hair: '#bdb7c4', style: 'short', shirt: '#3a3a5a', pants: '#2a2a30', shoes: '#111', acc: 'scarf' },
    bio: 'Mayor of New York City, U.S. Senator, Governor of New York. Championed the Erie Canal, which people mocked as "Clinton\'s Ditch" until it made New York rich. Moved to Green-Wood in 1844, which made the cemetery famous.',
    idle: ['They called it Clinton\'s Ditch. Then they called it genius.', 'Big public works start as big public arguments.', 'Dig the canal. Then build the city around it.'],
    dialogue: talk('clinton', {
      clinton_0: { speaker: 'clinton', text: '*A ghost in a statesman\'s coat gestures at an invisible map.* They laughed at my canal. "Clinton\'s Ditch!" Then it carried the whole country\'s grain through New York. Big public projects always sound foolish before they work.', choices: [
        { text: 'Like bus lanes down the middle of Flatbush. People argue, then they ride.', tag: 'BEST', next: 'clinton_1' },
        { text: 'So ignore everyone who disagrees.', next: 'clinton_1' }] },
      clinton_1: { speaker: 'clinton', text: 'Never ignore them. Answer them, at every meeting, until they ride your canal. Public works need the public.', choices: [{ text: '(Salute.)', effects: { solidarity: 5, flags: { met_clinton: true } } }] },
    }, 'clinton_0', 'What\'s your canal? Every organizer has one.'),
  },
  {
    id: 'morse', name: 'The Ghost of Samuel Morse', short: 'Samuel Morse', title: 'Telegraph Inventor, 1791–1872', district: 'sunsetpark', spot: 'gh_morse', at: [40.6520, -73.9888], color: '#b8c8e8', ghost: true,
    look: { skin: '#f0e0d0', hair: '#f2f2f2', style: 'curly', shirt: '#4a4a52', pants: '#2a2a30', shoes: '#111' },
    bio: 'A painter turned inventor. With Alfred Vail he developed Morse code, and in 1844 sent the first long-distance telegraph message, from Washington to Baltimore: "What hath God wrought!"',
    idle: ['Dot dot dash. Dot.', 'The first message traveled 40 miles in a blink.', 'Fast news. Wonderful. Fast rumors. Less wonderful.'],
    dialogue: talk('morse', {
      morse_0: { speaker: 'morse', text: '*A ghost taps a rhythm on a headstone.* Dot, dash. In 1844 I sent a message from Washington to Baltimore in an instant: "What hath God wrought!" Before that, news rode on horses.', choices: [
        { text: 'And now news moves that fast in every group chat, true or not. Fast is good. Checked is better.', tag: 'BEST', next: 'morse_1' },
        { text: 'Faster news is always better news.', next: 'morse_1' }] },
      morse_1: { speaker: 'morse', text: 'I made the wire. I didn\'t make the truth. That part was always yours. Check before you send. The Rumor Mill hates that.', choices: [{ text: '(Tap back: dot dot dash.)', effects: { solidarity: 5, flags: { met_morse: true } } }] },
    }, 'morse_0', '*He taps: .. -. ..-. --- / ..-. .. .-. ... -* (Info first.)'),
  },
  // ---------------------------------------------------------------- more ghosts who haunt their own Brooklyn places (docs/FACTS-ghosts.md)
  {
    id: 'chisholm', name: 'The Ghost of Shirley Chisholm', short: 'Shirley Chisholm', title: 'First Black Woman in Congress, 1924–2005', district: 'plg', spot: 'gh_chisholm', at: [40.6553, -73.9617], color: '#ffd23f', ghost: true, street: true,
    look: { skin: '#5a3624', hair: '#1a1010', style: 'curly', shirt: '#d8262e', pants: '#2a1a2a', shoes: '#111', dress: true, acc: 'glasses' },
    bio: 'Born in Brooklyn, went to Girls\' High in Bed-Stuy, lived on St. Johns Place. In 1968 became the first Black woman elected to Congress. In 1972 became the first Black candidate to run for a major party\'s presidential nomination. Her slogan: "Unbought and Unbossed." A monument to her is being built at this corner of Prospect Park.',
    idle: ['Unbought and unbossed.', 'They didn\'t give me a seat. I ran for one.', 'Your block needs a candidate. Look in the mirror.'],
    dialogue: talk('chisholm', {
      chisholm_0: { speaker: 'chisholm', text: '*A ghost in a bold red dress adjusts her glasses and looks right through you.* So you organize. Good. Have you thought about running? In 1968 nobody thought a Black woman from Brooklyn could go to Congress. I went.', choices: [{ text: 'How did you win?', next: 'chisholm_1' }] },
      chisholm_1: { speaker: 'chisholm', text: 'I knocked on doors. I talked to the women nobody talked to. My slogan was "Unbought and Unbossed." Then in 1972 I ran for president. I didn\'t win that one. I ran anyway, so the next person would know they could.', choices: [
        { text: 'So running is organizing too: talk to the people nobody talks to, and owe nobody but them.', tag: 'BEST', next: 'chisholm_2' },
        { text: 'So it\'s mostly about raising a lot of money.', next: 'chisholm_3' }] },
      chisholm_2: { speaker: 'chisholm', text: 'Now you\'re talking. Unbought, because no donor owns you. Unbossed, because no party owns you. The people on your block own you. Go.', choices: [{ text: '(Promise to think about running.)', effects: { solidarity: 8, power: 1, flags: { met_chisholm: true } } }] },
      chisholm_3: { speaker: 'chisholm', text: 'Money helps. It doesn\'t vote. People vote. I won with doorbells, not dollars. Unbought and unbossed, baby.', choices: [{ text: '(Take notes.)', effects: { solidarity: 4, flags: { met_chisholm: true } } }] },
    }, 'chisholm_0', 'Have you registered your neighbors yet? I\'ll wait. I\'m a ghost. I have time.'),
  },
  {
    id: 'lenahorne', name: 'The Ghost of Lena Horne', short: 'Lena Horne', title: 'Singer, Actor, Activist, 1917–2010', district: 'parkslope', spot: 'gh_lenahorne', at: [40.6672, -73.9790], color: '#d8b8ff', ghost: true, street: true,
    look: { skin: '#a8714a', hair: '#1a1010', style: 'long', shirt: '#7b3fe4', pants: '#2a1a2a', shoes: '#111', dress: true },
    bio: 'Born in Bed-Stuy, on Macon Street, then raised on Chauncey Street. A star singer and actor who used her fame for civil rights: she spoke and performed at the 1963 March on Washington and worked with Eleanor Roosevelt for anti-lynching laws. The Prospect Park bandshell was renamed for her in 2021.',
    idle: ['They named the bandshell after me. Free music for everybody. Good.', 'Bed-Stuy, Macon Street. Never forget where you start.', 'Use your voice. All of it.'],
    dialogue: talk('lenahorne', {
      lenahorne_0: { speaker: 'lenahorne', text: '*A ghost in an elegant gown hums along with the band at the shell that bears her name.* I was born in Bed-Stuy. I sang in the biggest clubs in America, and some of them wouldn\'t let me through the front door.', choices: [{ text: 'What did you do about it?', next: 'lenahorne_1' }] },
      lenahorne_1: { speaker: 'lenahorne', text: 'I used my voice for more than singing. I went to the March on Washington in 1963. I worked for laws against lynching. Fame is a microphone. You decide what goes into it.', choices: [
        { text: 'So whatever platform you have, even a small one, you use it for your people.', tag: 'BEST', next: 'lenahorne_2' },
        { text: 'So only famous people can make a difference.', next: 'lenahorne_3' }] },
      lenahorne_2: { speaker: 'lenahorne', text: 'Yes. Your platform is a stoop, a group chat, a church basement. Sing into it.', choices: [{ text: '(Applaud.)', effects: { solidarity: 7, flags: { met_lenahorne: true } } }] },
      lenahorne_3: { speaker: 'lenahorne', text: 'Oh no, darling. The March on Washington was two hundred thousand people. I was one voice. The crowd was the song.', choices: [{ text: '(Applaud.)', effects: { solidarity: 4, flags: { met_lenahorne: true } } }] },
    }, 'lenahorne_0', 'The band is good tonight. Go dance. That\'s what the shell is for.'),
  },
  {
    id: 'biggie', name: 'The Ghost of The Notorious B.I.G.', short: 'The Notorious B.I.G.', title: 'Christopher Wallace, 1972–1997', district: 'bedstuy', spot: 'gh_biggie', at: [40.6828, -73.9634], color: '#ffd23f', ghost: true, street: true,
    look: { skin: '#3a2014', hair: '#1a1010', style: 'beanie', hatColor: '#d8262e', shirt: '#2a2a30', pants: '#1a1a20', shoes: '#f2f2f2', acc: 'glasses' },
    bio: 'Christopher Wallace grew up at 226 St. James Place in Clinton Hill with his mother, Voletta, and became one of the most celebrated rappers ever. He died in 1997 at 24. In 2019, after years of neighbors pushing, his block was co-named "Christopher \'Notorious B.I.G.\' Wallace Way."',
    idle: ['St. James Place. This is home.', 'My mom, Voletta. Say hi if you see her.', 'Brooklyn made me. Brooklyn kept me.'],
    dialogue: talk('biggie', {
      biggie_0: { speaker: 'biggie', text: '*A big, calm ghost in a red cap leans on a lamppost on St. James Place.* This is my block. Grew up right there, third floor, with my mom. In 2019 they put my name on the street sign. Took neighbors years.', choices: [{ text: 'How does a street get renamed?', next: 'biggie_1' }] },
      biggie_1: { speaker: 'biggie', text: 'Somebody from the neighborhood started pushing in 2013. Petitions. Meetings. Some folks on the community board said no. People kept showing up anyway, and in 2019 the sign went up.', choices: [
        { text: 'So the block decides who it honors, if people keep showing up long enough.', tag: 'BEST', next: 'biggie_2' },
        { text: 'So famous people get streets named after them automatically.', next: 'biggie_3' }] },
      biggie_2: { speaker: 'biggie', text: 'That\'s it. Nobody gave it to me. The neighborhood did it. That\'s Brooklyn.', choices: [{ text: '(Look up at the sign.)', effects: { solidarity: 7, flags: { met_biggie: true } } }] },
      biggie_3: { speaker: 'biggie', text: 'Nah. Nothing\'s automatic in Brooklyn. A fan pushed for six years. People argued at the board. The block did it, not the fame.', choices: [{ text: '(Look up at the sign.)', effects: { solidarity: 4, flags: { met_biggie: true } } }] },
    }, 'biggie_0', '*He nods at the street sign.* Christopher Wallace Way. The neighbors did that.'),
  },
  {
    id: 'rbg', name: 'The Ghost of Ruth Bader Ginsburg', short: 'Ruth Bader Ginsburg', title: 'Supreme Court Justice, 1933–2020', district: 'flatbush', spot: 'gh_rbg', at: [40.6094, -73.9480], color: '#e8e4f0', ghost: true, street: true,
    look: { skin: '#f0e0d0', hair: '#2a1a12', style: 'bun', shirt: '#1a1a20', pants: '#1a1a20', shoes: '#111', acc: 'glasses', dress: true },
    bio: 'Born in Brooklyn, grew up on East 9th Street in Midwood, graduated from James Madison High School in 1950. Before joining the Supreme Court, she argued cases in the 1970s that opened doors that had been closed to women.',
    idle: ['James Madison High School, class of 1950.', 'Midwood. East 9th Street. I remember the stoop.', 'Bring people along. That\'s the whole job.'],
    dialogue: talk('rbg', {
      rbg_0: { speaker: 'rbg', text: '*A small ghost in a black robe and lace collar stands outside James Madison High School.* I graduated from this school in 1950. Before I was a judge, I was a lawyer who argued case after case so that women could have the same chances as men.', choices: [{ text: 'How do you change minds that don\'t want to change?', next: 'rbg_1' }] },
      rbg_1: { speaker: 'rbg', text: 'Patiently. And by bringing people along. I said it at a ceremony once: "Fight for the things that you care about, but do it in a way that will lead others to join you."', choices: [
        { text: 'So win people over, don\'t just win the argument.', tag: 'BEST', next: 'rbg_2' },
        { text: 'So shout louder than the other side.', next: 'rbg_3' }] },
      rbg_2: { speaker: 'rbg', text: 'Exactly. The other side today may be your ally tomorrow. Leave them a door.', choices: [{ text: '(Bow slightly.)', effects: { solidarity: 7, flags: { met_rbg: true } } }] },
      rbg_3: { speaker: 'rbg', text: 'Shouting wins a moment. Persuading wins a generation. Lead others to join you.', choices: [{ text: '(Bow slightly.)', effects: { solidarity: 4, flags: { met_rbg: true } } }] },
    }, 'rbg_0', 'Go do your homework. Then go change something.'),
  },
  {
    id: 'yauch', name: 'The Ghost of Adam "MCA" Yauch', short: 'Adam Yauch', title: 'Beastie Boys, 1964–2012', district: 'downtown', spot: 'gh_yauch', at: [40.6907, -73.9990], color: '#8fe3d0', ghost: true, street: true,
    look: { skin: '#f0d8c0', hair: '#8a8a8a', style: 'short', shirt: '#2b3a6b', pants: '#2a2a30', shoes: '#f2f2f2' },
    bio: 'Grew up on State Street in Brooklyn Heights and learned to ride a bike in this playground, renamed Adam Yauch Park in 2013. Co-founded the Milarepa Fund in 1994, which organized the Tibetan Freedom Concerts, starting in 1996.',
    idle: ['I learned to ride a bike right here.', 'State Street. Brooklyn Heights. Home.', 'Music can raise money and raise voices.'],
    dialogue: talk('yauch', {
      yauch_0: { speaker: 'yauch', text: '*A calm ghost in a blue jacket sits on the swings in the little park under the highway ramp.* I learned to ride a bike in this playground. In 2013 they named it after me. In 2016 somebody spray-painted swastikas on it.', choices: [{ text: 'What happened then?', next: 'yauch_1' }] },
      yauch_1: { speaker: 'yauch', text: 'Two days later, hundreds of neighbors showed up. My friend Adam Horovitz, a state senator, council members, the borough president. They filled the park and said: not here. Hate showed up with a spray can. Brooklyn showed up with everybody.', choices: [
        { text: 'So when hate shows up, the answer is a bigger crowd of neighbors, together and fast.', tag: 'BEST', next: 'yauch_2' },
        { text: 'So the city should just paint over it quietly.', next: 'yauch_3' }] },
      yauch_2: { speaker: 'yauch', text: 'Yeah. Clean the paint, sure. But show up. I helped organize concerts for Tibet because music can raise money and raise voices. Use whatever you\'ve got.', choices: [{ text: '(Push the swing once.)', effects: { solidarity: 7, flags: { met_yauch: true } } }] },
      yauch_3: { speaker: 'yauch', text: 'Paint it over, yes. But quiet tells people nobody cares. Hundreds of neighbors in a playground tells them everybody does.', choices: [{ text: '(Push the swing once.)', effects: { solidarity: 4, flags: { met_yauch: true } } }] },
    }, 'yauch_0', '*He\'s on the swing again, going a little higher each time.*'),
  },
];

export const GHOST_AT: Record<string, [number, number]> = Object.fromEntries(GHOSTS.filter((g) => !g.street).map((g) => [g.spot, g.at]));
/** Ghosts who haunt their own corner of Brooklyn (placed like neighbors, on the nearest sidewalk) */
export const STREET_GHOST_AT: Record<string, [number, number]> = Object.fromEntries(GHOSTS.filter((g) => g.street).map((g) => [g.spot, g.at]));
