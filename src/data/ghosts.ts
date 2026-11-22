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
];

export const GHOST_AT: Record<string, [number, number]> = Object.fromEntries(GHOSTS.filter((g) => !g.street).map((g) => [g.spot, g.at]));
/** Ghosts who haunt their own corner of Brooklyn (placed like neighbors, on the nearest sidewalk) */
export const STREET_GHOST_AT: Record<string, [number, number]> = Object.fromEntries(GHOSTS.filter((g) => g.street).map((g) => [g.spot, g.at]));
