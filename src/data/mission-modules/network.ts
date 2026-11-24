/**
 * Mission 1 · MEET THE NETWORK (Downtown Brooklyn, giver: Adaeze at Brooklyn Org, by Hanson Place)
 *
 * The game opens at Brooklyn Org (Deroy, Nov 24 2026): learn what a community foundation does, then go meet four of this
 * year's Brooklyn Org grantees where they work. Each new game draws a different four from POOL, spread over at least three
 * neighborhoods (WorldScene.pickNetwork, stored in the flag `net1_picks`). Meeting one means talking to its staffer (teal
 * name tag) and answering "what do we do?". The Mission Passed screen shows the four with their Brooklyn Gives links.
 * Then Adaeze sends you to Dee and the fridge (Mission 2).
 *
 * Facts, in Brooklyn Org's own words where possible (read Nov 24 2026):
 * - brooklyn.org/about: "a partner and platform for local philanthropy"; "from Brooklyn, for Brooklyn"; "more than
 *   $150 million" moved over a "15+ year history"; "over 100 organizations annually working across every issue".
 * - Spark Prize finalists, announced Oct 8 2026 (brooklyn.org/article/meet-the-finalists-for-the-10th-brooklyn-org-spark-
 *   prize-backed-by-a-200000-donation-match/): 20 finalists for the 2027 prize; Brooklyn Org matches up to $10,000 in
 *   donations to each through Brooklyn Gives, Oct 8 to Dec 31; five winners announced in January. The 12 with a staffer on
 *   the map are in POOL (Drama Club, Emma's Torch, Extreme Kids & Crew, Little Essentials, Navigate the Maze, Opportunities
 *   for a Better Tomorrow, Seeds of Fortune and The Children's Law Center aren't on the grantee map yet).
 * - 2026 grants and Spark Prize 2026 winners: grantees.ts (docs/FACTS-brooklyn-org-grantees.md).
 * Adaeze is fiction.
 */
import { state } from '../../core/state';
import { NONPROFITS } from '../nonprofits';
import { giveUrl } from '../bkgives';
import type { MissionModule } from './types';

const f = (k: string) => !!state.flag(k);
const S = (id: string, is: number | number[]) => ({ missionStage: { id, is } });
export const NET_PICKS = 4;

/** This year's Brooklyn Org grantees with a staffer on the map: [nonprofit id, why they're on the list] */
export const POOL: [string, string][] = [
  ['np_goodcall', 'Brooklyn Org grant, Spring 2026'],
  ['np_yvote', 'Spark Prize 2026'],
  ['np_urbanhomesteadingassistanceb', 'Brooklyn Org grant, Spring 2026'],
  ['np_impacctbrooklyn', '2026 BKO Spark Prize Finalist; Brooklyn Org grant, Spring 2026'],
  ['np_osborneassociation', 'Brooklyn Backs Brooklyn, 2026'],
  ['np_youthjusticenetwork', 'Brooklyn Org grant, Spring 2026'],
  ['np_surveillancetechnologyoversi', 'Spark Prize 2026'],
  ['np_naturallyoccurringculturaldi', 'Brooklyn Org grant, Spring 2026'],
  ['np_ridersalliance', 'Brooklyn Org grant, Spring 2026'],
  ['np_southbrooklynsanctuary', 'Brooklyn Org grant, Spring 2026'],
  ['np_thebroexperiencefoundation', 'Spark Prize 2026'],
  ['np_asiyahwomenscenter', 'Spark Prize 2026'],
  ['np_blacktransfemmesinthearts', 'Spark Prize 2026'],
  ['np_blackveteransforsocialjustic', '2026 BKO Spark Prize Finalist'],
  ['np_brooklynballet', '2026 BKO Spark Prize Finalist'],
  ['np_brooklyndebateleague', '2026 BKO Spark Prize Finalist'],
  ['np_buildingbeats', '2026 BKO Spark Prize Finalist'],
  ['np_envisionfreedomfund', '2026 BKO Spark Prize Finalist'],
  ['np_footsteps', '2026 BKO Spark Prize Finalist'],
  ['np_newyorkstateyouthleadershipc', '2026 BKO Spark Prize Finalist'],
  ['np_raisinghealthpartners', '2026 BKO Spark Prize Finalist'],
  ['np_streetvendorproject', '2026 BKO Spark Prize Finalist'],
  ['np_thealexhouseproject', '2026 BKO Spark Prize Finalist'],
  ['np_thebravehouse', '2026 BKO Spark Prize Finalist'],
].filter(([id]) => { const n = NONPROFITS.find((x) => x.id === id); return !!n && !!giveUrl(n.org); }) as [string, string][]; // only groups with a Brooklyn Gives page (Deroy, Nov 24 2026)

const NP = Object.fromEntries(NONPROFITS.map((n) => [n.id, n]));
/** This game's four (drawn at New Game); an older save without them falls back to the first four of the pool */
export const netPicks = () => {
  const v = state.flag('net1_picks');
  const ids = typeof v === 'string' && v ? v.split(',') : POOL.slice(0, NET_PICKS).map(([id]) => id);
  return ids.filter((id) => NP[id]);
};
const met = () => netPicks().filter((id) => f(`net_${id}`));
const left = () => netPicks().filter((id) => !f(`net_${id}`));
const short = (id: string) => NP[id].org.replace(/^The /, '').replace(/ \(.*\)$/, '');

export const network: MissionModule = {
  mission: {
    id: 'network', number: 1, title: 'MEET BROOKLYN ORG NONPROFIT GRANTEES', district: 'downtown', giver: 'adaeze',
    tagline: 'Brooklyn Org funds groups in every corner of the borough. Go meet four of them where they work.',
    stages: [
      { text: () => 'Meet Adaeze at Brooklyn Org, by Hanson Place', targets: () => ['adaeze'], done: () => f('net1_accepted') },
      {
        text: () => `${netPicks().map((id) => `${f(`net_${id}`) ? '☑' : '☐'} ${short(id)}`).join('\n')}`, // just the checklist: the purple mission title says what to do (Deroy, Nov 24 2026) // a checklist (Deroy, Nov 24 2026)
        targets: () => left(),
        done: () => left().length === 0,
      },
      { text: () => 'Report back to Adaeze at Brooklyn Org', targets: () => ['adaeze'], done: () => f('net1_done') },
    ],
    rewards: () => ({ solidarity: 200, power: 2, trust: { downtown: 15 }, rel: { adaeze: 10 }, toast: 'YOU KNOW THE NETWORK' }),
    next: 'stock',
  },

  dialogue: {
    adaeze: {
      entries: [
        { cond: S('network', 0), node: 'net_0' },
        { cond: S('network', 1), node: 'net_wait' },
        { cond: S('network', 2), node: 'net_back' },
      ],
      nodes: {
        net_0: { speaker: 'adaeze', text: 'Welcome to Brooklyn Org. Quick question: do you know what a community foundation does?', choices: [
          { text: 'Gives out money?', next: 'net_1' },
          { text: 'Not a clue.', next: 'net_1' },
        ] },
        net_1: { speaker: 'adaeze', text: 'Close. It pools a place\'s giving and puts it to work close to home. We\'re a partner and platform for local philanthropy, from Brooklyn, for Brooklyn. In 15+ years we\'ve moved more than $150 million to nonprofits.', next: 'net_2' },
        net_2: { speaker: 'adaeze', text: 'We fund over 100 organizations a year, across every issue, and residents help decide where the grants go. All 261 groups we\'ve backed are out there. Look for the teal name tags.', next: 'net_2b' },
        // brooklyn.org/about: "the advocate for Brooklyn's nonprofit community"; collaborates with "businesses, government, foundations, and more"; "leverage our civic influence to achieve systemic change"
        net_2b: { speaker: 'adaeze', text: 'And we\'re not just a bank. We\'re the advocate for Brooklyn\'s nonprofit community. We bring neighbors, nonprofits, local businesses, government and other funders to the same table. We know the groups, the issues and who to call, and we use that influence to push for real change.', next: 'net_3' },
        net_3: { speaker: 'adaeze', text: 'Your first assignment: meet four of this year\'s grantees, in different neighborhoods. Some just got grants, some are Spark Prize finalists. Ask what they do and actually listen.', choices: [
          { text: 'On it. Who are they?', next: 'net_4', effects: { flags: { net1_accepted: true }, rel: { adaeze: 3 } } },
        ] },
        net_4: { speaker: 'adaeze', text: 'They\'re in your mission box, and pinned on your map. Hit FIND [F] to jump to one, or take the train. Fun fact: through December 31, we match up to $10,000 in gifts to every Spark Prize finalist on Brooklyn Gives.' },
        net_wait: { speaker: 'adaeze', text: 'Still out there? Your four are in the mission box. The best stuff is never all on one block.' },
        net_back: { speaker: 'adaeze', text: 'Look at you. Different blocks, different fights, same borough. That\'s Brooklyn. So what did you notice?', choices: [
          { text: 'Every group knows its own block better than anyone.', next: 'net_end', effects: { rel: { adaeze: 3 } } },
          { text: 'They\'re all stretched thin.', next: 'net_end', effects: { rel: { adaeze: 2 } } },
        ] },
        net_end: { speaker: 'adaeze', text: 'Exactly why we fund them and let neighbors steer. Now go get your hands dirty. There\'s a community fridge in Bed-Stuy down to one lime. Ask for Dee.', choices: [
          { text: 'On my way.', effects: { flags: { net1_done: true } } },
        ] },
      },
    },
  },
};
