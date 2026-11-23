/**
 * Sharpness. The game draws at the display's pixel density (capped at 2x) instead of letting the browser stretch a
 * 1x canvas, and characters are drawn at CHAR_RES times their size and shown at 1/CHAR_RES, so they stay crisp when
 * the camera zooms in. Game-pixel sizes (scale.width, camera viewports) are CSS pixels x DPR.
 */
export const DPR = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
/** Phones have far less memory for images (an iPhone tab crashed on Nov 23 2026): the crowd and labels stay 1x there */
export const PHONE = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;
export const CHAR_RES = PHONE ? 1 : 2;
/** Text labels (each is its own image): screen density on desktop, 1x on phones */
export const TEXT_RES = PHONE ? 1 : DPR;
/** You (avatar, ring, facing arrow, YOU tag) are drawn bigger than the crowd, so at 3x: crisp even at full-screen zoom */
export const PLAYER_RES = 3;
