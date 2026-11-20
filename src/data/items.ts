import type { ItemId } from '../core/types';

// Original inline-SVG icons for the mutual aid inventory.
const o = 'stroke="#111" stroke-width="2.5" stroke-linejoin="round"';
export const ITEMS: Record<ItemId, { name: string; desc: string; color: string; icon: string }> = {
  groceries: {
    name: 'Groceries', color: '#7bd66b', desc: 'Donated food. Mostly produce, one suspicious jar of "artisanal" pickles.',
    icon: `<svg viewBox="0 0 32 32"><path d="M6 12h20l-2 16H8z" fill="#e9b26a" ${o}/><circle cx="12" cy="9" r="4" fill="#ff5a5a" ${o}/><path d="M18 3c3 2 4 6 2 9" fill="none" ${o}/><path d="M19 4l5 5" stroke="#3fb24f" stroke-width="4"/></svg>`,
  },
  clothing: {
    name: 'Clothing', color: '#59b8ff', desc: 'Warm layers. At least three ironic sweaters.',
    icon: `<svg viewBox="0 0 32 32"><path d="M10 5l-7 5 3 6 4-2v14h12V14l4 2 3-6-7-5c-1 3-3 4-6 4s-5-1-6-4z" fill="#59b8ff" ${o}/></svg>`,
  },
  medical: {
    name: 'Medical Supplies', color: '#ff6b6b', desc: 'Band-aids, Narcan, and somebody\'s grandma\'s cough drops.',
    icon: `<svg viewBox="0 0 32 32"><rect x="4" y="8" width="24" height="18" rx="3" fill="#fff" ${o}/><path d="M14 11h4v5h5v4h-5v5h-4v-5H9v-4h5z" fill="#ff4b4b"/></svg>`,
  },
  art: {
    name: 'Art Materials', color: '#ffb23f', desc: 'Wheatpaste, cardboard, half-dead spray cans.',
    icon: `<svg viewBox="0 0 32 32"><rect x="10" y="10" width="12" height="18" rx="2" fill="#ffb23f" ${o}/><rect x="13" y="4" width="6" height="6" fill="#ddd" ${o}/><circle cx="25" cy="6" r="2" fill="#ff7ab8"/><circle cx="27" cy="11" r="1.5" fill="#a46bff"/></svg>`,
  },
  flyers: {
    name: 'Flyers', color: '#fff27a', desc: 'Hand them to pedestrians with [SPACE]. Comic Sans not included.',
    icon: `<svg viewBox="0 0 32 32"><rect x="9" y="6" width="16" height="21" fill="#fff" ${o} transform="rotate(8 17 16)"/><rect x="6" y="5" width="16" height="21" fill="#fff27a" ${o}/><path d="M9 11h10M9 15h8M9 19h10" stroke="#111" stroke-width="2"/></svg>`,
  },
  signs: {
    name: 'Protest Signs', color: '#ff7ab8', desc: 'Cardboard. Spelling: mostly correct.',
    icon: `<svg viewBox="0 0 32 32"><rect x="15" y="16" width="3" height="14" fill="#a8743f" ${o}/><rect x="4" y="3" width="24" height="15" fill="#ff7ab8" ${o}/><path d="M8 9h16M8 13h10" stroke="#111" stroke-width="2.5"/></svg>`,
  },
  donations: {
    name: 'Community Donations', color: '#7ee0d4', desc: 'Crumpled bills from a coffee can labeled "THE PEOPLE".',
    icon: `<svg viewBox="0 0 32 32"><path d="M8 10h16l-2 18H10z" fill="#7ee0d4" ${o}/><ellipse cx="16" cy="10" rx="8" ry="3" fill="#bff3ee" ${o}/><path d="M14 5h4v4h-4z" fill="#7bd66b" ${o}/></svg>`,
  },
  posters: {
    name: 'Wheatpaste Posters', color: '#a46bff', desc: 'Slap them on walls with [SPACE]. Raises public attention.',
    icon: `<svg viewBox="0 0 32 32"><rect x="5" y="4" width="22" height="25" fill="#a46bff" ${o}/><circle cx="16" cy="13" r="5" fill="#ffb23f" ${o}/><path d="M9 23h14" stroke="#fff" stroke-width="3"/></svg>`,
  },
};
