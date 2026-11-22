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

interface Ghost extends NpcDef { at: [number, number]; dialogue: Dialogue; ghost: true }

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
];

export const GHOST_AT: Record<string, [number, number]> = Object.fromEntries(GHOSTS.map((g) => [g.spot, g.at]));
