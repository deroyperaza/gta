/**
 * Every Brooklyn Org grantee on the map (Deroy, Nov 22 2026): 261 real Brooklyn nonprofits, each with a staffer you can talk to.
 * Data: nonprofits.json, built from the Brooklyn Org grantee map (brooklyn.org/grantees descriptions, issues and regions),
 * placed by real address (Brooklyn Org's 990 Schedule I, the IRS exempt-org list, the groups' own sites; geocoded with the
 * US Census geocoder). Sources per group in docs/FACTS-nonprofits.md. Privacy: a group registered at a home or PO box is
 * placed in its neighborhood, never at the address. Staffers are invented people; no real staff are depicted.
 * Talk to a staffer, answer "what do we do?", and the group joins your Brooklyn Org Network.
 */
import type { District } from '../core/types';
import type { Dialogue } from '../systems/dialogue';
import type { Look } from '../world/textures';
import type { NpcDef } from './npcs';
import RAW from './nonprofits.json';

interface Raw { name: string; desc: string; issues: string[]; locs: string[]; mode: 'exact' | 'hood' | 'region'; at?: [number, number]; hood?: string; src?: string }
export interface Nonprofit extends NpcDef { org: string; what: string; gist: string; issues: string[]; locs: string[]; mode: Raw['mode']; at?: [number, number]; hood?: string; npOrg: true; dialogue: Dialogue }

function hash(s: string) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
const slug = (s: string) => s.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '').slice(0, 28);

/** The name tag: the acronym if the group has one, else the name, shortened to fit */
function tagName(name: string) {
  const ab = name.match(/\(([^)]{2,12})\)/); if (ab) return ab[1];
  const n = name.replace(/^The /, '').replace(/^Project: /, '');
  if (n.length <= 24) return n;
  const words = n.split(' '); let out = '';
  for (const w of words) { if ((out + ' ' + w).trim().length > 22) break; out = (out + ' ' + w).trim(); }
  return out + '…';
}
/** Brooklyn Org's own blurbs sometimes open with "This grant is part of…": skip to what the group does.
 *  Sentences end at . ! ? followed by a capital, so "S.T.O.P. protects" and "Mr. & Ms. Destiny" stay whole (Nov 24 2026) */
const lead = (t: string) => t.split(/(?<=[.!?])(?<!\b(?:Mr|Ms|Mrs|Dr|St|Jr|Sr|Ave|No)\.)\s(?=[A-Z0-9"“(])/).filter((x) => !/^This (grant|project|award)/i.test(x)).join(' ') || t;
/** One short, complete idea of what the group does, for quiz answers */
function gistOf(desc: string) {
  let s = lead(desc).split(/(?<=[.!?])(?<!\b(?:Mr|Ms|Mrs|Dr|St|Jr|Sr|Ave|No)\.)\s(?=[A-Z0-9"“(])/)[0].replace(/\.$/, '');
  let best = s.length;
  for (const cut of [' by ', ' through ', ' while ', ', including ', ', such as ', ', from ', '; ']) { const i = s.indexOf(cut); if (i >= 40 && i < best) best = i; }
  s = s.slice(0, best).replace(/[,;:]$/, '');
  if (s.length > 92) { // end at the last natural break, not mid-phrase
    const head = s.slice(0, 90), k = Math.max(head.lastIndexOf(', '), head.lastIndexOf(' and '), head.lastIndexOf(' that '), head.lastIndexOf(' who '), head.lastIndexOf(' where '), head.lastIndexOf(' to '));
    s = k >= 42 ? s.slice(0, k) : s.slice(0, s.lastIndexOf(' ', 88)) + '…';
  }
  return s.replace(/[,;:]$/, '').replace(/\s+(and|or|to|for|of|in|the|a|with|their|its|on|that|who)$/i, '');
}
/** "Provides free legal help…" → "We provide free legal help…" (descriptions are written about the group) */
function firstPerson(t: string) {
  const m = t.match(/^([A-Z][a-z]+)(\b.*)$/s); if (!m) return `Here's what we do: ${t}`;
  const v = m[1], rest = m[2];
  const IRR: Record<string, string> = { Is: 'are', Has: 'have', Does: 'do', Goes: 'go' };
  let base: string | null = IRR[v] ?? null;
  if (!base && /ies$/.test(v)) base = v.slice(0, -3) + 'y';
  else if (!base && /(sses|shes|ches|xes|zes)$/.test(v)) base = v.slice(0, -2);
  else if (!base && /[^s]s$/.test(v)) base = v.slice(0, -1);
  if (!base || /^(A|An|The|This|Our|Since|Founded|Brooklyn|New|Through|With|For)$/.test(v)) return `Here's what we do: ${t}`;
  // Verbs chained right after the first one follow it: "builds and preserves" -> "build and preserve" (Deroy, Nov 24 2026)
  const plain = (w: string) => /ies$/.test(w) ? w.slice(0, -3) + 'y' : /(sses|shes|ches|xes|zes)$/.test(w) ? w.slice(0, -2) : /[^s]s$/.test(w) ? w.slice(0, -1) : w;
  let tail = rest, head = '';
  for (let k = 0; k < 4; k++) {
    const c = tail.match(/^((?:,\s*(?:and\s+|or\s+)?)|\s+(?:and|or)\s+)([a-z]+(?:ies|es|s))\b/);
    if (!c || /ss$/.test(c[2])) break;
    head += c[1] + plain(c[2]); tail = tail.slice(c[0].length);
  }
  return `We ${base.toLowerCase()}${head}${tail}`;
}
const firstSentences = (desc: string) => { const parts = lead(desc).split(/(?<=[.!?])(?<!\b(?:Mr|Ms|Mrs|Dr|St|Jr|Sr|Ave|No)\.)\s(?=[A-Z0-9"“(])/); let t = parts[0]; if (t.length < 90 && parts[1]) t += ' ' + parts[1]; return t; };

const FIRST = ['Maya', 'Andre', 'Rosa', 'Kwame', 'Priya', 'Devon', 'Leila', 'Marisol', 'Tomas', 'Aisha', 'Jonah', 'Grace', 'Rafael', 'Nia', 'Omar', 'Ingrid', 'Malik', 'Yesenia', 'Chen', 'Fatou', 'Sam', 'Imani', 'Luis', 'Talia', 'Darius', 'Esther', 'Kofi', 'Bianca', 'Hector', 'Shanice', 'Yuri', 'Noor', 'Gabe', 'Ama', 'Reggie', 'Sofia', 'Jamal', 'Mei', 'Ezra', 'Keisha', 'Arjun', 'Lupita', 'Desmond', 'Hana', 'Theo', 'Zainab', 'Marcus', 'Ruth', 'Andrés', 'Tamika'];
const ROLES = ['Organizer', 'Program Director', 'Volunteer Coordinator', 'Youth Worker', 'Outreach Lead', 'Community Liaison', 'Case Manager', 'Executive Director', 'Teaching Artist', 'Volunteer'];
const SKIN = ['#2e1a12', '#4a2c1c', '#5a3624', '#6b4430', '#7a4a30', '#8d5a3a', '#a8714a', '#c58a5c', '#d9a679', '#e8c0a0', '#f2d2b8'];
const HAIR = ['#1a1010', '#1a1010', '#2a1c14', '#4a2a1a', '#7a5a3a', '#c9a25a', '#8a3a2a', '#d8d4dc', '#9a9aa8', '#7b3fe4'];
const SHIRT = ['#ff4fa3', '#2fd1c5', '#F5C242', '#7b3fe4', '#ff8a3d', '#6fcf5e', '#1b4fa0', '#c83a4a', '#e8e4dc', '#3a3a4a', '#2f6a4a'];
const PANTS = ['#2b2b40', '#2b3a6b', '#3a2a1a', '#4a4a5a', '#1a1a20', '#5a4a32', '#3a5a8a'];
const STYLES: Look['style'][] = ['short', 'afro', 'bun', 'long', 'bald', 'beanie', 'cap', 'braids', 'curly', 'hijab'];
const ACCS: (Look['acc'] | undefined)[] = ['clipboard', 'clipboard', 'tote', 'tote', 'glasses', 'phone', undefined]; // staffers carry the clipboard
const REGION_DISTRICT: Record<string, District> = { 'North Brooklyn': 'bushwick', 'Central Brooklyn': 'bedstuy', 'East Brooklyn': 'flatbush', 'West Brooklyn': 'parkslope', 'South Brooklyn': 'coneyisland', 'Brooklyn-wide': 'downtown' };

/** Finalists for the Spark Prize, announced Oct 8 2026 (brooklyn.org, "Meet the Finalists for the 10th Brooklyn Org Spark Prize";
 *  Brooklyn Org calls it the 2027 prize). Labeled as Deroy asked (Nov 24 2026). The 12 on the grantee map: */
export const SPARK_FINALIST = '2026 BKO Spark Prize Finalist';
const FINALISTS = new Set(['Black Veterans for Social Justice', 'Brooklyn Ballet', 'Brooklyn Debate League', 'Building Beats', 'Envision Freedom Fund', 'Footsteps',
  'IMPACCT Brooklyn', 'New York State Youth Leadership Council', 'RaisingHealth Partners', 'Street Vendor Project', 'The Alex House Project', 'The Brave House']);
const raws = RAW as Raw[];
const used = new Set<string>();
export const NONPROFITS: Nonprofit[] = raws.map((r) => {
  let id = `np_${slug(r.name)}`; while (used.has(id)) id += 'x'; used.add(id);
  const roll = (k: string, n: number) => hash(`${id}:${k}`) % n;
  const first = FIRST[roll('first', FIRST.length)], role = ROLES[roll('role', ROLES.length)];
  const look: Look = { skin: SKIN[roll('skin', SKIN.length)], hair: HAIR[roll('hair', HAIR.length)], style: STYLES[roll('style', STYLES.length)], shirt: SHIRT[roll('shirt', SHIRT.length)], pants: PANTS[roll('pants', PANTS.length)], shoes: '#f2f2f2', acc: ACCS[roll('acc', ACCS.length)], hatColor: SHIRT[roll('hat', SHIRT.length)], dress: roll('dress', 3) === 0 };
  const short = tagName(r.name), what = firstSentences(r.desc), gist = gistOf(r.desc);
  return {
    id, name: r.name, short, title: FINALISTS.has(r.name) ? `${first}, ${role} · ${SPARK_FINALIST}` : `${first}, ${role}`, district: REGION_DISTRICT[r.locs.find((l) => l !== 'Brooklyn-wide') ?? 'Brooklyn-wide'] ?? 'downtown',
    spot: id, look, bio: what, color: '#2fd1c5', org: r.name, what, gist, issues: r.issues, locs: r.locs, mode: r.mode, at: r.at, hood: r.hood, npOrg: true,
    dialogue: { entries: [], nodes: {} },
  };
});

/** "What do we do?" with two near-misses: other groups working on the same issue */
for (const np of NONPROFITS) {
  const h = hash(np.id);
  const peers = NONPROFITS.filter((o) => o !== np && o.gist !== np.gist && o.issues.some((i) => np.issues.includes(i)));
  const pool = peers.length >= 2 ? peers : NONPROFITS.filter((o) => o !== np);
  const a = pool[h % pool.length];
  let b = pool[(h >>> 8) % pool.length];
  for (let i = 1; (b === a || b.gist === a.gist) && i < pool.length; i++) b = pool[((h >>> 8) + i) % pool.length]; // three different answers
  const issues = np.issues.slice(0, 2).join(' and ').toLowerCase();
  const first = np.title.split(',')[0];
  np.dialogue = {
    entries: [{ cond: { flag: `net_${np.id}` }, node: `${np.id}_again` }, { node: `${np.id}_hi` }],
    nodes: {
      [`${np.id}_hi`]: { speaker: np.id, text: `Hi! I'm ${first}, with ${np.org}. ${firstPerson(np.what)}`, next: `${np.id}_q` },
      [`${np.id}_q`]: {
        speaker: np.id, text: 'Quick one, so it sticks: what do we do?', shuffle: true,
        choices: [
          { text: np.gist, tag: 'right', next: `${np.id}_yes`, effects: { solidarity: 6, flags: { [`net_${np.id}`]: true }, inc: { network: 1 }, event: 'network' } },
          { text: a.gist, next: `${np.id}_no_a` },
          { text: b.gist, next: `${np.id}_no_b` },
        ],
      },
      [`${np.id}_yes`]: { speaker: np.id, text: `That's us. We work on ${issues}. Brooklyn Org backs us, and now you know us too. Tell somebody.` },
      [`${np.id}_no_a`]: { speaker: np.id, text: `That's ${a.org}, and they're great. Ask me again and I'll tell you about us.` },
      [`${np.id}_no_b`]: { speaker: np.id, text: `That's ${b.org}. Good people, different work. Come back and ask me again.` },
      [`${np.id}_again`]: { speaker: np.id, text: `Good to see you! Still ${np.gist.charAt(0).toLowerCase() + np.gist.slice(1)}. Still need neighbors.` },
    },
  };
}

export const NONPROFIT_BY_ID: Record<string, Nonprofit> = Object.fromEntries(NONPROFITS.map((n) => [n.id, n]));
export const ISSUES = [...new Set(NONPROFITS.flatMap((n) => n.issues))].sort();
/** Regions as Brooklyn Org draws them, in game neighborhoods (for groups we could only place by the area they serve) */
export const REGION_HOODS: Record<string, string[]> = {
  'North Brooklyn': ['Greenpoint', 'Williamsburg', 'South Williamsburg', 'East Williamsburg', 'Bushwick', 'Brooklyn Navy Yard'],
  'Central Brooklyn': ['Bedford-Stuyvesant', 'Crown Heights', 'Prospect Lefferts Gardens', 'Flatbush', 'East Flatbush', 'Fort Greene', 'Clinton Hill', 'Prospect Heights', 'Weeksville'],
  'East Brooklyn': ['Brownsville', 'East New York', 'Cypress Hills', 'Canarsie', 'Ocean Hill', 'Starrett City', 'Flatlands'],
  'West Brooklyn': ['Downtown Brooklyn', 'Brooklyn Heights', 'Park Slope', 'Red Hook', 'Sunset Park', 'Carroll Gardens', 'Gowanus', 'Bay Ridge', 'Boerum Hill'],
  'South Brooklyn': ['Coney Island', 'Brighton Beach', 'Sheepshead Bay', 'Bensonhurst', 'Gravesend', 'Midwood', 'Borough Park', 'Homecrest', 'Marine Park'],
  'Brooklyn-wide': ['Downtown Brooklyn', 'Bedford-Stuyvesant', 'Crown Heights', 'Flatbush', 'Sunset Park', 'Bushwick', 'Brownsville', 'Park Slope', 'Williamsburg', 'East New York', 'Midwood', 'Bay Ridge', 'Canarsie', 'Coney Island'],
};

/** Which issues each mission is about: knowing groups that work on them pays off when you pass it */
export const MISSION_ISSUES: Record<string, string[]> = {
  stock: ['Health & Well-Being', 'Families'], food: ['Health & Well-Being', 'Families'], circle: ['Justice Reform', 'Youth'],
  march: ['Civil Rights', 'Civic Engagement'], rent: ['Housing'], board: ['Housing', 'Civic Engagement'], reentry: ['Justice Reform'],
  robot: ['Civil Rights'], culture: ['Arts & Culture'], heat: ['Older Adults', 'Environmental Justice'], elders: ['Older Adults'],
  ej: ['Environmental Justice'], blockparty: ['Arts & Culture', 'Civic Engagement'], fares: ['Jobs & Economic Opportunity', 'Civic Engagement'],
  pbudget: ['Civic Engagement', 'Youth'], rj: ['Civil Rights', 'Justice Reform'], bridge: ['Civic Engagement', 'Jobs & Economic Opportunity'],
  common: ['Civic Engagement', 'Justice Reform'], access: ['Health & Well-Being', 'Civil Rights'], streets: ['Environmental Justice', 'Health & Well-Being'],
  medbike: ['Civic Engagement'], medchoir: ['Civic Engagement'], medmosque: ['Civic Engagement'], medtri: ['Civic Engagement'],
};
