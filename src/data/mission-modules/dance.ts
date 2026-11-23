/**
 * SIDE MISSION · THE WHOLE BLOCK DANCES (Bushwick). Giver: Vega, nine, The Choreographer.
 * Vega wants to teach a free dance lesson to the whole block, grandmas included. You line up the music (Marcus)
 * and the elders (Ms. Hattie), then she leads it.
 *
 * Facts (checked Nov 2026):
 * - NYPD Sound Device Permit: needed for amplified sound (speakers, megaphone) in public. File in person at the
 *   precinct where it'll be used, at least five days ahead; $45 for the first day, by certified check or money order.
 *   Not issued within 500 feet of schools, courthouses or houses of worship in session, or hospitals.
 *   Source: NYPD form, nyc.gov/assets/nypd/downloads/pdf/form_sounddevice.pdf; NYC311 "Parade or Sound Permit".
 * - NYC Parks recreation centers: membership is free for anyone under 25; $25 a year for seniors 62+, veterans and
 *   people with disabilities. Source: nycgovparks.org recreation center membership pages.
 */
import { state } from '../../core/state';
import type { Effect } from '../../core/types';
import type { MissionModule } from './types';

const f = (k: string) => !!state.flag(k);
const S = (id: string, is: number | number[]) => ({ missionStage: { id, is } });

/** The bow at the end grades the whole lesson: music, elders, rain plan */
const BOWS = [
  { text: '(Take a bow with Vega.)', cond: { flagMin: { dance_score: 3 } }, effects: { flags: { dance_result: 'good', dance_done: true } } },
  { text: '(Take a bow with Vega.)', cond: { flagMin: { dance_score: 1 }, flagMax: { dance_score: 2 } }, effects: { flags: { dance_result: 'ok', dance_done: true } } },
  { text: '(Take a bow with Vega.)', cond: { flagMax: { dance_score: 0 } }, effects: { flags: { dance_result: 'weak', dance_done: true } } },
];

export const dance: MissionModule = {
  mission: {
    id: 'dance', number: 100, title: 'THE WHOLE BLOCK DANCES', district: 'bushwick', giver: 'vega', side: true, kind: 'SIDE MISSION',
    tagline: 'Vega is nine and wants to teach the whole block to dance. Free. In the street. Grandmas included. She needs music, the elders, and you.',
    stages: [
      { text: () => 'Ask Marcus to DJ', targets: () => ['marcus'], done: () => f('dance_music') },
      { text: () => 'Bring Ms. Hattie and the elders', targets: () => ['hattie'], done: () => f('dance_elders') },
      { text: () => 'Lead the lesson with Vega', targets: () => ['vega'], done: () => f('dance_done') },
    ],
    rewards: (): Effect => {
      const r = state.flag('dance_result');
      if (r === 'good') return { solidarity: 160, power: 1, trust: { bushwick: 12, bedstuy: 6 }, rel: { vega: 8, marcus: 4, hattie: 4 }, toast: 'THE WHOLE BLOCK DANCED. EVEN GARY. ESPECIALLY GARY.' };
      if (r === 'ok') return { solidarity: 90, trust: { bushwick: 6 }, rel: { vega: 4 } };
      return { solidarity: 30, trust: { bushwick: 1 } };
    },
    onFail: () => state.clearFlagsWithPrefix('dance_'),
  },
  dialogue: {
    vega: {
      entries: [
        { cond: { flag: 'met_vega', missionStatus: { id: 'dance', is: 'locked' } }, node: 'dance_offer' },
        { cond: S('dance', [0, 1]), node: 'dance_wait' },
        { cond: S('dance', 2), node: 'dance_go' },
      ],
      nodes: {
        dance_offer: {
          speaker: 'vega', text: 'Big idea. A dance lesson for the WHOLE block. Free. In the street. Babies, grandmas, the bodega cat. I teach, everybody dances.',
          choices: [{ text: 'I\'m in. What do you need?', next: 'dance_plan', effects: { startMission: 'dance', rel: { vega: 3 } } }, { text: 'Another day, Vega.' }],
        },
        dance_plan: { speaker: 'vega', text: 'Two things. Music, so ask Marcus. He has speakers the size of a fridge. And the grandmas, so ask Ms. Hattie. If Ms. Hattie comes, everybody comes.' },
        dance_wait: { speaker: 'vega', text: 'I\'m practicing the counting part. Five, six, seven, eight. Go get Marcus and Ms. Hattie!' },
        dance_go: {
          speaker: 'you', text: '*The block fills up. Marcus drops the first beat. Ms. Hattie takes the front row of folding chairs like a throne. Vega climbs onto a milk crate.*', next: 'dance_go2',
        },
        dance_go2: {
          speaker: 'vega', text: 'Okay everybody! Five, six, seven, eight! ...Wait. It\'s starting to rain. Where do we go?',
          choices: [
            { text: 'The rec center. Free for anyone under 25, and $25 a year for grandmas.', tag: 'FACT', effects: { inc: { dance_score: 1 }, toast: 'POCKET CIVICS · REC CENTERS ARE FREE UNDER 25' }, next: 'dance_end' },
            { text: 'Everyone just goes home. We\'ll try again next year.', next: 'dance_wet' },
            { text: 'Into the bank lobby. It has the nicest floors.', next: 'dance_bank' },
          ],
        },
        dance_end: {
          speaker: 'you', text: '*Forty people dance in the rec center gym while it pours outside. Somebody\'s abuela out-dances the DJ. Vega invents three new arm moves, and everybody does them.*',
          choices: BOWS,
        },
        dance_wet: {
          speaker: 'you', text: '*Half the block goes home. The other half refuses. Twenty people dance in the rain, and Vega teaches the arm moves under an awning. Ms. Hattie stays dry and keeps the count.*',
          choices: BOWS,
        },
        dance_bank: {
          speaker: 'you', text: '*The bank lobby holds six people and one very nervous security guard. Everyone else dances in the rain. Vega teaches the arm moves under an awning.*',
          choices: BOWS,
        },
      },
    },
    marcus: {
      entries: [{ cond: S('dance', 0), node: 'dance_m0' }],
      nodes: {
        dance_m0: {
          speaker: 'marcus', text: 'A dance lesson in the street? I\'m there. But speakers outside need a sound permit, or the lesson ends at song two. You know where to get one?',
          choices: [
            { text: 'At the local police precinct, in person, at least five days ahead. $45, by money order.', tag: 'FACT', effects: { inc: { dance_score: 1 } }, next: 'dance_m1' },
            { text: 'Online from the Parks Department, the same day.', next: 'dance_m2' },
            { text: 'You don\'t need a permit if it\'s for kids.', next: 'dance_m2' },
          ],
        },
        dance_m1: {
          speaker: 'marcus', text: 'Exactly. The precinct where we\'re playing. And not within 500 feet of a school or a church while it\'s in session. I\'ll file it Monday.',
          choices: [{ text: 'Five days. Money order. Got it.', effects: { flags: { dance_music: true }, rel: { marcus: 4 }, toast: 'POCKET CIVICS · SOUND DEVICE PERMITS' } }],
        },
        dance_m2: {
          speaker: 'marcus', text: 'Nope. It\'s the NYPD Sound Device Permit, at the precinct where we\'re playing, five days ahead, $45 money order. I\'ll handle it. Learn it for next time.',
          choices: [{ text: 'Precinct. Five days. Noted.', effects: { flags: { dance_music: true } } }],
        },
      },
    },
    hattie: {
      entries: [{ cond: S('dance', 1), node: 'dance_h0' }],
      nodes: {
        dance_h0: {
          speaker: 'hattie', text: 'A dance lesson. Baby, these knees have seen three mayors. They do not do pirouettes. Why would the grandmothers on this block come out?',
          choices: [
            { text: 'Chairs up front. Vega teaches a seated version too, and we go at the pace of the slowest dancer.', tag: 'BEST', effects: { inc: { dance_score: 1 } }, next: 'dance_h1' },
            { text: 'It\'s mostly for the kids. You could watch from your window.', next: 'dance_h2' },
            { text: 'Dancing is good exercise. Doctors recommend it.', next: 'dance_h2' },
          ],
        },
        dance_h1: {
          speaker: 'hattie', text: 'Chairs in front. Nobody left standing in the back. ...Now THAT is an invitation. I\'ll call the phone tree. Save me the middle seat.',
          choices: [{ text: '(Save her the middle seat.)', effects: { flags: { dance_elders: true }, rel: { hattie: 5 } } }],
        },
        dance_h2: {
          speaker: 'hattie', text: 'Mm. Folks don\'t come where they\'re an afterthought. Put chairs in front and I\'ll bring the grandmothers. Don\'t make me ask twice.',
          choices: [{ text: '(Put out the chairs.)', effects: { flags: { dance_elders: true } } }],
        },
      },
    },
  },
};
