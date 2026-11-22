/**
 * MEDIATION CALLS: side missions you pick up from neighbors on the street. Each pauses whatever you're doing and
 * hands it back when you're done. The skill is the same every time and it's real: listen and reflect back, ask what
 * people need (not what they're against), find the shared interest, write the agreement down. And know what isn't
 * up for negotiation (nobody mediates someone's right to worship).
 *
 * Grounded in documented Brooklyn tensions (sources in docs/FACTS-brooklyn-org-tensions-care-parks.md):
 * - Williamsburg: DOT removed 14 blocks of the Bedford Ave bike lane in December 2009 after Hasidic community complaints.
 * - Broadway Triangle: Black and Latino groups sued in 2009 over a city housing plan; the 2017 settlement brought 375+
 *   affordable apartments, a broader mix of apartment sizes, and fair-housing education.
 * - Sheepshead Bay: opponents sued to stop a mosque on Voorhies Ave; the courts dismissed the suits in 2011.
 * - Flatbush: the Flatbush Tenant Coalition (Flatbush Development Corp) organizes tenants across buildings.
 * The people and the specific disputes are fiction.
 */
import { state } from '../../core/state';
import type { District, Effect } from '../../core/types';
import type { MissionModule } from './types';

const f = (k: string) => !!state.flag(k);
const S = (id: string, is: number | number[]) => ({ missionStage: { id, is } });

/** A three-step mediation: hear A (who asks you), hear B, bring them together at A's. */
function mediation(o: {
  id: string; title: string; district: District; a: string; b: string; aName: string; bName: string; tagline: string;
  offer: string; dialogue: MissionModule['dialogue'];
}): MissionModule {
  const id = o.id;
  return {
    mission: {
      id, number: 100, title: o.title, district: o.district, giver: o.a, side: true, tagline: o.tagline,
      stages: [
        { text: () => `Hear ${o.aName} out`, targets: () => [o.a], done: () => f(`${id}_a`) },
        { text: () => `Hear ${o.bName} out`, targets: () => [o.b], done: () => f(`${id}_b`) },
        { text: () => `Bring ${o.aName} and ${o.bName} together`, targets: () => [o.a], done: () => f(`${id}_done`) },
      ],
      rewards: (): Effect => {
        const r = state.flag(`${id}_result`);
        if (r === 'good') return { solidarity: 160, power: 1, trust: { [o.district]: 12 }, rel: { [o.a]: 6, [o.b]: 6 }, toast: 'AN AGREEMENT, IN WRITING, SIGNED BY BOTH' };
        if (r === 'ok') return { solidarity: 90, trust: { [o.district]: 6 }, rel: { [o.a]: 3, [o.b]: 3 } };
        return { solidarity: 30, trust: { [o.district]: 1 } };
      },
      onFail: () => state.clearFlagsWithPrefix(`${id}_`),
    },
    dialogue: o.dialogue,
  };
}
/** The closing choice: grade the whole mediation from its score */
const close = (id: string, max: number, text: string) => ({
  speaker: 'you', text,
  choices: [
    { text: '(Witness the signatures.)', cond: { flagMin: { [`${id}_score`]: max } }, effects: { flags: { [`${id}_result`]: 'good', [`${id}_done`]: true }, toast: 'POCKET CIVICS · MEDIATION' } },
    { text: '(Witness the signatures.)', cond: { flagMin: { [`${id}_score`]: 1 }, flagMax: { [`${id}_score`]: max - 1 } }, effects: { flags: { [`${id}_result`]: 'ok', [`${id}_done`]: true }, toast: 'POCKET CIVICS · MEDIATION' } },
    { text: '(Witness the signatures.)', cond: { flagMax: { [`${id}_score`]: 0 } }, effects: { flags: { [`${id}_result`]: 'weak', [`${id}_done`]: true }, toast: 'POCKET CIVICS · MEDIATION' } },
  ],
});
const offerEntry = (id: string, who: string) => ({ cond: { flag: `met_${who}`, missionStatus: { id, is: 'locked' as const } }, node: `${id}_offer` });

// ---------------------------------------------------------------- 1 · Bedford Ave
export const medBike = mediation({
  id: 'medbike', title: 'BEDFORD AVE', district: 'bushwick', a: 'rivka', b: 'teo', aName: 'Rivka', bName: 'Teo',
  tagline: 'Rivka wants the bikes slower outside her kids\' school. Teo delivers on a bike and needs the lane. Both have been right since 2009.',
  offer: '',
  dialogue: {
    rivka: {
      entries: [offerEntry('medbike', 'rivka'), { cond: S('medbike', 0), node: 'medbike_a0' }, { cond: S('medbike', 1), node: 'medbike_await' }, { cond: S('medbike', 2), node: 'medbike_j0' }],
      nodes: {
        medbike_offer: { speaker: 'rivka', text: 'You. Organizer. You said you\'d find someone to put me and the bike man in a room. Well?', choices: [{ text: 'Let\'s do it. Tell me what you need first.', next: 'medbike_a0', effects: { startMission: 'medbike' } }, { text: 'Not today.' }] },
        medbike_a0: { speaker: 'rivka', text: 'In 2009 the city took the lane off Bedford, fourteen blocks. Half the street cheered. Now the bikes are back and they come fast past the girls\' school at pickup. One of mine is four.', choices: [
          { text: '"So you\'re not against bikes. You\'re scared one of your kids gets hit at pickup." Is that right?', tag: 'BEST', effects: { inc: { medbike_score: 1 }, flags: { medbike_a: true } }, next: 'medbike_a1' },
          { text: 'Bikes are good for the planet, though.', effects: { flags: { medbike_a: true } }, next: 'medbike_a2' }] },
        medbike_a1: { speaker: 'rivka', text: '...Yes. Exactly that. Nobody says it back like that. Go talk to Teo. He\'s on the corner of Bedford, always on his phone.' },
        medbike_a2: { speaker: 'rivka', text: 'So is walking. I\'m not against the planet, I\'m against my daughter in a cast. Go talk to Teo.' },
        medbike_await: { speaker: 'rivka', text: 'Teo. Bedford corner. Phone in his hand, helmet on his elbow.' },
        medbike_j0: { speaker: 'you', text: '*Rivka\'s stoop. Teo leans his bike on the railing. Rivka brings rugelach. Teo brings a delivery he can\'t eat. Nobody sits at first.*', choices: [
          { text: 'You both want the same thing at 3 p.m.: kids crossing safely and riders getting through. What would make pickup work for both of you?', tag: 'BEST', effects: { inc: { medbike_score: 1 } }, next: 'medbike_j1' },
          { text: 'Let\'s vote. Bikes or no bikes.', next: 'medbike_j1' }] },
        medbike_j1: { speaker: 'teo', text: 'A raised crosswalk at the school. Bikes slow down for it, no choice. And the lane stays, so I\'m not in traffic with a bus.', next: 'medbike_j2' },
        medbike_j2: { speaker: 'rivka', text: 'And a crossing guard at pickup. ...Fine. Raised crosswalk, crossing guard, the lane stays. We write it to the community board together.', next: 'medbike_end' },
        medbike_end: close('medbike', 3, '*They sign one letter to Community Board 1. Teo eats one rugelach. Then a second. "For the road."*'),
      },
    },
    teo: {
      entries: [{ cond: S('medbike', 1), node: 'medbike_b0' }, { cond: S('medbike', 2), node: 'medbike_bwait' }],
      nodes: {
        medbike_b0: { speaker: 'teo', text: 'Forty deliveries a day. No lane, I\'m between a bus and a double-parked truck. They think I\'m the danger? I\'m the one without a car door.', choices: [
          { text: 'What do you need to get through the day safe, and on time?', tag: 'BEST', effects: { inc: { medbike_score: 1 }, flags: { medbike_b: true } }, next: 'medbike_b1' },
          { text: 'Maybe slow down near the school?', effects: { flags: { medbike_b: true } }, next: 'medbike_b2' }] },
        medbike_b1: { speaker: 'teo', text: 'A lane. That\'s it. I\'ll slow down for kids. I have a kid. Tell her I\'ll come to the stoop.' },
        medbike_b2: { speaker: 'teo', text: 'I slow down for kids. I HAVE a kid. Ask me what I need, not what I\'m doing wrong. ...Okay. I\'ll come to the stoop.' },
        medbike_bwait: { speaker: 'teo', text: 'Rivka\'s stoop. I\'ll be there between deliveries.' },
      },
    },
  },
});

// ---------------------------------------------------------------- 2 · The Broadway Triangle
export const medTriangle = mediation({
  id: 'medtri', title: 'THE BROADWAY TRIANGLE', district: 'bushwick', a: 'carmen', b: 'yossel', aName: 'Doña Carmen', bName: 'Yossel',
  tagline: 'One empty city lot. Doña Carmen\'s grandkids need affordable apartments. So do Yossel\'s eight children. Somebody told each of them the other one gets it.',
  offer: '',
  dialogue: {
    carmen: {
      entries: [offerEntry('medtri', 'carmen'), { cond: S('medtri', 0), node: 'medtri_a0' }, { cond: S('medtri', 1), node: 'medtri_await' }, { cond: S('medtri', 2), node: 'medtri_j0' }],
      nodes: {
        medtri_offer: { speaker: 'carmen', text: 'The city lot by Flushing Avenue. They say apartments. They say "for them, not for you." I\'m tired of "them." Will you help?', choices: [{ text: 'Tell me everything.', next: 'medtri_a0', effects: { startMission: 'medtri' } }, { text: 'Not today.' }] },
        medtri_a0: { speaker: 'carmen', text: 'My granddaughter and her two kids sleep in my living room. Two bedrooms, five people. If those apartments go up and none are for us, we leave Brooklyn.', choices: [
          { text: 'So what you need is an apartment your granddaughter can afford, close to you. Not to keep anyone else out.', tag: 'BEST', effects: { inc: { medtri_score: 1 }, flags: { medtri_a: true } }, next: 'medtri_a1' },
          { text: 'Sounds like you need to fight them.', effects: { flags: { medtri_a: true } }, next: 'medtri_a2' }] },
        medtri_a1: { speaker: 'carmen', text: 'Exactly. I don\'t want anybody out. I want us in. Go talk to the father with all the kids, Yossel. He\'s by the yeshiva on Union.' },
        medtri_a2: { speaker: 'carmen', text: 'I\'ve been fighting since 1971, mi amor. I\'m tired. I want us in, not them out. Go talk to Yossel, by the yeshiva.' },
        medtri_await: { speaker: 'carmen', text: 'Yossel. By the yeshiva on Union Avenue.' },
        medtri_j0: { speaker: 'you', text: '*Doña Carmen\'s domino table. Yossel sits down carefully. Carmen deals him in without asking. He loses the first round.*', choices: [
          { text: 'You both need affordable apartments: Carmen\'s family needs two bedrooms, Yossel\'s needs four. A plan with every size, and a lottery open to everyone, gets you both in.', tag: 'BEST', effects: { inc: { medtri_score: 1 } }, next: 'medtri_j1' },
          { text: 'Split the lot down the middle.', next: 'medtri_j1' }] },
        medtri_j1: { speaker: 'yossel', text: 'Every size. Every family can apply. ...That\'s fair. Nobody wins because somebody else loses.', next: 'medtri_j2' },
        medtri_j2: { speaker: 'carmen', text: 'Back in 2017 there was a lawsuit about this exact triangle. When it settled: hundreds of affordable apartments, more sizes, everybody can apply. We ask for the same. Together.', next: 'medtri_end' },
        medtri_end: close('medtri', 3, '*They sign one letter to the city: affordable apartments of every size, open to every family. Yossel asks for a rematch. He loses that one too.*'),
      },
    },
    yossel: {
      entries: [{ cond: S('medtri', 1), node: 'medtri_b0' }, { cond: S('medtri', 2), node: 'medtri_bwait' }],
      nodes: {
        medtri_b0: { speaker: 'yossel', text: 'Eight children, one bathroom. Every new building here is studios and one-bedrooms. For who? For people with dogs, not children.', choices: [
          { text: 'What would your family need to stay in the neighborhood?', tag: 'BEST', effects: { inc: { medtri_score: 1 }, flags: { medtri_b: true } }, next: 'medtri_b1' },
          { text: 'Doña Carmen thinks you\'re taking the apartments.', effects: { flags: { medtri_b: true } }, next: 'medtri_b2' }] },
        medtri_b1: { speaker: 'yossel', text: 'Four bedrooms I can afford. That\'s all. I don\'t need anyone to lose. I\'ll sit with her.' },
        medtri_b2: { speaker: 'yossel', text: 'Taking? I can\'t take what doesn\'t exist. Nobody builds for families. ...Fine. I\'ll sit with her. Maybe she plays dominoes.' },
        medtri_bwait: { speaker: 'yossel', text: 'I\'ll come to her table. I\'ve been practicing dominoes. Badly.' },
      },
    },
  },
});

// ---------------------------------------------------------------- 3 · Voorhies Ave
export const medMosque = mediation({
  id: 'medmosque', title: 'VOORHIES AVE', district: 'coneyisland', a: 'boris', b: 'bilal', aName: 'Boris', bName: 'Bilal',
  tagline: 'Friday afternoons the block fills with cars for prayers. Boris can\'t park. Some neighbors want the mosque gone. One of those is negotiable.',
  offer: '',
  dialogue: {
    boris: {
      entries: [offerEntry('medmosque', 'boris'), { cond: S('medmosque', 0), node: 'medmosque_a0' }, { cond: S('medmosque', 1), node: 'medmosque_await' }, { cond: S('medmosque', 2), node: 'medmosque_j0' }],
      nodes: {
        medmosque_offer: { speaker: 'boris', text: 'Every Friday: cars on my driveway, cars on the hydrant. My wife has dialysis Friday afternoon. You help with this? Somebody should.', choices: [{ text: 'I\'ll help. Tell me.', next: 'medmosque_a0', effects: { startMission: 'medmosque' } }, { text: 'Not today.' }] },
        medmosque_a0: { speaker: 'boris', text: 'Some of the men on the block say the mosque shouldn\'t be here at all. Signs, petitions. Me? I don\'t care who prays where. I care that my wife gets to dialysis.', choices: [
          { text: 'So the problem is the driveway on Fridays, not your neighbors\' faith. That we can work on.', tag: 'BEST', effects: { inc: { medmosque_score: 1 }, flags: { medmosque_a: true } }, next: 'medmosque_a1' },
          { text: 'Maybe the petition guys have a point?', effects: { flags: { medmosque_a: true } }, next: 'medmosque_a2' }] },
        medmosque_a1: { speaker: 'boris', text: 'Yes. Thank you. The driveway. Talk to the one who runs the board there. Bilal. He waves at me. I never wave back. I\'m not a waver.' },
        medmosque_a2: { speaker: 'you', text: '*You stop yourself.* No. Nobody\'s right to worship is up for a vote. Courts here threw out the lawsuits against this mosque in 2011. The driveway is what we can fix.', choices: [{ text: '(Go find Bilal.)' }] },
        medmosque_await: { speaker: 'boris', text: 'Bilal. The mosque on Voorhies. He\'s the one with the clipboard and the patience.' },
        medmosque_j0: { speaker: 'you', text: '*Boris\'s front steps. Bilal brings dates. Boris brings two chairs, which for Boris is a speech.*', choices: [
          { text: 'Ground rules: we talk about Fridays and the driveway. Nobody here is debating whether anyone belongs on this block.', tag: 'BEST', effects: { inc: { medmosque_score: 1 } }, next: 'medmosque_j1' },
          { text: 'Let\'s hear everybody\'s feelings about the mosque.', next: 'medmosque_jx' }] },
        medmosque_jx: { speaker: 'bilal', text: 'With respect, my existence isn\'t a feeling to be heard. The parking is a problem to be solved. Can we talk about the parking?', next: 'medmosque_j1' },
        medmosque_j1: { speaker: 'bilal', text: 'Volunteers in vests on Fridays to keep driveways clear. A shuttle from the lot on Emmons. And Mr. Boris, your wife\'s ride: we\'ll keep your driveway coned. Personally.', next: 'medmosque_j2' },
        medmosque_j2: { speaker: 'boris', text: '...Cones. Personally. *A long pause.* Next Friday I\'ll wave. Maybe.', next: 'medmosque_end' },
        medmosque_end: close('medmosque', 3, '*They write it on one page: Friday volunteers, the shuttle, Boris\'s driveway coned. Bilal invites the whole block to an open house. Boris says he\'ll "consider it." He goes.*'),
      },
    },
    bilal: {
      entries: [{ cond: S('medmosque', 1), node: 'medmosque_b0' }, { cond: S('medmosque', 2), node: 'medmosque_bwait' }],
      nodes: {
        medmosque_b0: { speaker: 'bilal', text: 'Fifteen years ago people held signs on this block telling us we weren\'t welcome. Now my kids go to school with theirs. And yes, Fridays, the parking. I know.', choices: [
          { text: 'What would it take to make Fridays work for your congregation and the block?', tag: 'BEST', effects: { inc: { medmosque_score: 1 }, flags: { medmosque_b: true } }, next: 'medmosque_b1' },
          { text: 'Couldn\'t you just pray somewhere else?', effects: { flags: { medmosque_b: true } }, next: 'medmosque_b2' }] },
        medmosque_b1: { speaker: 'bilal', text: 'Volunteers. A shuttle. We\'ve wanted to do it for years. Nobody ever asked us to sit down. Tell Mr. Boris I\'ll come.' },
        medmosque_b2: { speaker: 'bilal', text: 'This is somewhere. This is our block too. ...But the parking is real, and I\'ll fix my part. Tell Mr. Boris I\'ll come.' },
        medmosque_bwait: { speaker: 'bilal', text: 'Mr. Boris\'s steps. I\'m bringing dates. Everybody likes dates.' },
      },
    },
  },
});

// ---------------------------------------------------------------- 4 · Church Avenue
export const medChoir = mediation({
  id: 'medchoir', title: 'CHURCH AVENUE', district: 'flatbush', a: 'marieclaude', b: 'becca', aName: 'Sister Marie-Claude', bName: 'Becca',
  tagline: 'Becca moved to Flatbush in June and called 311 on the choir. The church has sung on that block for thirty-two years. They have the same landlord.',
  offer: '',
  dialogue: {
    marieclaude: {
      entries: [offerEntry('medchoir', 'marieclaude'), { cond: S('medchoir', 0), node: 'medchoir_a0' }, { cond: S('medchoir', 1), node: 'medchoir_await' }, { cond: S('medchoir', 2), node: 'medchoir_j0' }],
      nodes: {
        medchoir_offer: { speaker: 'marieclaude', text: 'Somebody called 311 on our Wednesday choir. Thirty-two years, nobody called. Now: a noise complaint. You\'re good with people. Help me not lose my temper.', choices: [{ text: 'Let\'s go. Tell me first.', next: 'medchoir_a0', effects: { startMission: 'medchoir' } }, { text: 'Not today.' }] },
        medchoir_a0: { speaker: 'marieclaude', text: 'It\'s the new girl next door. Rents keep rising, new people come, and the first thing they do is call the city on us. Like we\'re the noise in our own neighborhood.', choices: [
          { text: 'So it\'s not just the complaint. It feels like being told you don\'t belong where you\'ve always been.', tag: 'BEST', effects: { inc: { medchoir_score: 1 }, flags: { medchoir_a: true } }, next: 'medchoir_a1' },
          { text: 'Maybe sing a little quieter?', effects: { flags: { medchoir_a: true } }, next: 'medchoir_a2' }] },
        medchoir_a1: { speaker: 'marieclaude', text: '...Yes. That. Go see her. Becca. Apartment 3B. Tell her I\'ll make griot.' },
        medchoir_a2: { speaker: 'marieclaude', text: 'Quieter? Pitit, it\'s a CHOIR. ...Go talk to her. Becca, 3B. Maybe she\'s not a monster. Maybe.' },
        medchoir_await: { speaker: 'marieclaude', text: 'Becca. 3B. Bring her here, I\'m making griot.' },
        medchoir_j0: { speaker: 'you', text: '*The church\'s side door. Becca holds a plate of griot like it might be a trick. It isn\'t. It\'s excellent.*', choices: [
          { text: 'Here\'s what I heard: the choir is the block\'s heart, Becca needs sleep before a 6 a.m. shift, and you both have the same landlord who\'s raising both your rents.', tag: 'BEST', effects: { inc: { medchoir_score: 1 } }, next: 'medchoir_j1' },
          { text: 'Becca, apologize.', next: 'medchoir_j1' }] },
        medchoir_j1: { speaker: 'becca', text: 'I didn\'t know it was every Wednesday for thirty years. I thought it was a party. ...Can practice end by nine? I\'ll stop calling 311. And — the same landlord? He raised me too.', next: 'medchoir_j2' },
        medchoir_j2: { speaker: 'marieclaude', text: 'Nine o\'clock. Fine. And you come to the tenant meeting with me. The Flatbush Tenant Coalition organizes whole buildings. One landlord, one fight.', next: 'medchoir_end' },
        medchoir_end: close('medchoir', 3, '*They shake on nine o\'clock. Two weeks later Becca is at the tenant meeting, sitting next to Sister Marie-Claude, taking notes in a color-coded system that frightens everyone.*'),
      },
    },
    becca: {
      entries: [{ cond: S('medchoir', 1), node: 'medchoir_b0' }, { cond: S('medchoir', 2), node: 'medchoir_bwait' }],
      nodes: {
        medchoir_b0: { speaker: 'becca', text: 'Oh no. Are you here about the 311 call? I work at a bakery, I\'m up at 4:30. Wednesday nights I hear... a lot of singing. Very good singing. Very loud singing.', choices: [
          { text: 'What would let you sleep, and let the choir keep singing?', tag: 'BEST', effects: { inc: { medchoir_score: 1 }, flags: { medchoir_b: true } }, next: 'medchoir_b1' },
          { text: 'You know you moved next to a church, right?', effects: { flags: { medchoir_b: true } }, next: 'medchoir_b2' }] },
        medchoir_b1: { speaker: 'becca', text: 'If it ended by nine I\'d be fine. Honestly I should have knocked instead of calling. I\'ll go over.' },
        medchoir_b2: { speaker: 'becca', text: 'I... yes. I did. That\'s fair. I should have knocked instead of calling. I\'ll go over.' },
        medchoir_bwait: { speaker: 'becca', text: 'Going over now. Is it weird to bring cookies to someone you reported? I\'m bringing cookies.' },
      },
    },
  },
});
