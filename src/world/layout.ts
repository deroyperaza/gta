import type { District } from '../core/types';

/**
 * Procedural-but-authored map of our fictional Brooklyn.
 * The grid is 6 x 5 city blocks separated by 3-tile streets. Each block belongs
 * to a district and can be a row of buildings, a park, a plaza, a garden...
 * Landmarks are hand-placed; filler buildings are seeded-random so the map is
 * identical every run (important for save positions).
 */

export const TILE = 32;
export const ROAD = 3;
export const BLOCK_W = 22; // road + block
export const BLOCK_H = 18;
export const COLS = 9;
export const ROWS = 7;
export const MAP_W = COLS * BLOCK_W + ROAD; // 201 tiles
export const MAP_H = ROWS * BLOCK_H + ROAD; // 129 tiles
export const WORLD_W = MAP_W * TILE;
export const WORLD_H = MAP_H * TILE;

export enum T {
  ASPHALT = 0, LANE_V = 1, LANE_H = 2, SIDEWALK = 3, GRASS = 4, PLAZA = 5, CROSS_V = 6, CROSS_H = 7,
  GARDEN = 8, WATER = 9, YARD = 10, INTERSECTION = 11, COURT = 12, LOT = 13, CURB = 14, SAND = 15,
}
export const WALKABLE = new Set([T.SIDEWALK, T.GRASS, T.PLAZA, T.GARDEN, T.YARD, T.COURT, T.LOT, T.CURB, T.SAND]);

export type BuildingType =
  | 'brownstone' | 'coffee' | 'boutique' | 'nonprofit' | 'coop' | 'bodega' | 'mural' | 'tenant'
  | 'community' | 'studio' | 'warehouse' | 'gallery' | 'government' | 'courthouse' | 'police'
  | 'tower' | 'apartment' | 'laundromat' | 'church' | 'shed' | 'bakery' | 'sales';

export interface BuildingDef {
  id: string; type: BuildingType; name?: string; district: District;
  x: number; y: number; w: number; h: number; // px
  variant: number;
}
export interface PropDef { kind: string; x: number; y: number; solid?: boolean; variant?: number }
export interface Spot { x: number; y: number }

type BlockKind = 'row' | 'park' | 'pond' | 'plaza' | 'garden' | 'court' | 'lot' | 'beach' | 'waterfront';
interface Landmark { id: string; type: BuildingType; w: number; name: string; spot?: string }
interface BlockSpec { kind: BlockKind; name?: string; landmarks?: Landmark[] }

export function districtOfBlock(c: number, r: number): District {
  // Laid out to match real Brooklyn (north up). Re-mapped Nov 20 2026:
  // Bushwick NE of Bed-Stuy, Crown Heights south of Bed-Stuy, Red Hook on the west waterfront.
  if (r >= 5) return c <= 2 ? 'sunsetpark' : c <= 5 ? 'flatbush' : 'coneyisland';
  if (r <= 1) return c <= 1 ? 'downtown' : c <= 4 ? 'bedstuy' : 'bushwick';
  if (c === 0) return 'redhook';
  if (c <= 2) return 'parkslope';
  if (r === 2 && c <= 4) return 'bedstuy';
  if (r === 4 && c <= 5) return 'plg';
  return 'crownheights';
}

// Hand-authored blocks. Key = "c,r".
const BLOCKS: Record<string, BlockSpec> = {
  // ---------- DOWNTOWN ----------
  '0,0': { kind: 'row', landmarks: [
    { id: 'courthouse', type: 'courthouse', w: 7, name: 'HALL OF MILD JUSTICE' },
    { id: 'police', type: 'police', w: 6, name: 'PRECINCT HQ' } ] },
  '1,0': { kind: 'plaza', name: 'Borough Plaza', landmarks: [
    { id: 'boroughhall', type: 'government', w: 9, name: 'BOROUGH HALL', spot: 'gary' } ] },
  '0,1': { kind: 'row', landmarks: [
    { id: 'synergy', type: 'tower', w: 5, name: 'SYNERGY TOWER', spot: 'luco' },
    { id: 'permits', type: 'government', w: 5, name: 'DEPT. OF PERMITS & DELAYS', spot: 'bridgette' },
    { id: 'luxe', type: 'sales', w: 5, name: 'LUXE LOFTS', spot: 'tyler' } ] },
  '1,1': { kind: 'row', landmarks: [
    { id: 'gentrifico', type: 'tower', w: 6, name: 'GENTRIFICO HOLDINGS' },
    { id: 'metromall', type: 'boutique', w: 6, name: 'METRO MALL-ISH', spot: 'skye' } ] },
  // ---------- PARK SLOPE ----------
  '1,2': { kind: 'row', landmarks: [
    { id: 'coop', type: 'coop', w: 6, name: 'THE RIGHTEOUS TURNIP CO-OP', spot: 'brendan' },
    { id: 'pour', type: 'coffee', w: 4, name: 'POUR DECISIONS' },
    { id: 'candles', type: 'boutique', w: 5, name: 'CANDLES FOR DOGS' } ] },
  '2,2': { kind: 'row', landmarks: [
    { id: 'synergycenter', type: 'nonprofit', w: 6, name: 'CENTER FOR PROGRESSIVE SYNERGY' },
    { id: 'oat', type: 'coffee', w: 4, name: '14 OAT MILKS' } ] },
  '2,3': { kind: 'park', name: 'Perspective Park' },
  '2,4': { kind: 'pond', name: 'Perspective Park' },
  '1,4': { kind: 'garden', name: 'Fifth Ave Community Garden' },
  '1,3': { kind: 'row', landmarks: [
    { id: 'yoga', type: 'boutique', w: 5, name: 'HOT YOGA FOR CAPITALISTS', spot: 'danae' },
    { id: 'laundry1', type: 'laundromat', w: 4, name: 'SUDS OF SOLIDARITY' } ] },
  // ---------- BED-STUY ----------
  '2,0': { kind: 'row', landmarks: [{ id: 'church', type: 'church', w: 5, name: 'FIRST CHURCH OF THE BLOCK PARTY', spot: 'deroy' }] },
  '2,1': { kind: 'row', landmarks: [
    { id: 'tenanthall', type: 'tenant', w: 6, name: 'TENANTS UNITED HALL', spot: 'jenna' },
    { id: 'laundry2', type: 'laundromat', w: 4, name: 'SPIN CITY WASH' } ] },
  '3,0': { kind: 'row' },
  '3,1': { kind: 'row', landmarks: [
    { id: 'mural', type: 'mural', w: 6, name: 'COMMUNITY FRIDGE MURAL', spot: 'dee' },
    { id: 'stuyapt', type: 'apartment', w: 5, name: '' } ] },
  '4,0': { kind: 'row', landmarks: [
    { id: 'bodega', type: 'bodega', w: 5, name: "FAROUK'S DELI·GROCERY·LOTTO·PHONE REPAIR", spot: 'farouk' } ] },
  '4,1': { kind: 'court', name: 'Kingston Courts' },
  '3,2': { kind: 'row', landmarks: [
    { id: 'commcenter', type: 'community', w: 8, name: 'GATES AVE COMMUNITY CENTER', spot: 'hattie' } ] },
  '4,2': { kind: 'row' },
  // ---------- BUSHWICK ----------
  '5,0': { kind: 'row', landmarks: [{ id: 'studio9000', type: 'studio', w: 6, name: 'STUDIO 9000', spot: 'jon' }] },
  '5,1': { kind: 'row', landmarks: [
    { id: 'sourdough', type: 'bakery', w: 6, name: 'SOURDOUGH COLLECTIVE', spot: 'juni' },
    { id: 'gww', type: 'gallery', w: 5, name: 'GALLERY WITHOUT WALLS', spot: 'vega' } ] },
  '7,0': { kind: 'lot', landmarks: [{ id: 'wh1', type: 'warehouse', w: 8, name: 'FORMER PICKLE FACTORY' }] },
  '6,0': { kind: 'row', landmarks: [{ id: 'ugallery', type: 'gallery', w: 5, name: 'THE UNDERGROUND (2ND FLOOR)' }] },
  // ---------- PROSPECT LEFFERTS GARDENS ----------
  '3,4': { kind: 'row', landmarks: [
    { id: 'plgta', type: 'tenant', w: 7, name: 'LEFFERTS TENANTS ASSOCIATION', spot: 'nell' },
    { id: 'plgroti', type: 'bakery', w: 4, name: 'DOUBLES & DOUBLES' } ] },
  '4,4': { kind: 'row', landmarks: [{ id: 'plgarms', type: 'apartment', w: 8, name: 'THE PARKSIDE-ISH ARMS' }] },
  '5,4': { kind: 'row', landmarks: [
    { id: 'plglegal', type: 'government', w: 6, name: 'FREE TENANT LAWYERS, 2ND FL' },
    { id: 'plgcoffee', type: 'coffee', w: 4, name: 'LIMESTONE COFFEE' } ] },
  // ---------- CROWN HEIGHTS ----------
  '3,3': { kind: 'row', landmarks: [
    { id: 'paradehq', type: 'community', w: 7, name: 'LABOR DAY PARADE HQ' },
    { id: 'roti', type: 'bakery', w: 5, name: 'ROTI & ROTI & ROTI', spot: 'naim' } ] },
  '4,3': { kind: 'row', landmarks: [{ id: 'chtenants', type: 'tenant', w: 7, name: 'CROWN HEIGHTS TENANT UNION' }] },
  '5,3': { kind: 'row', landmarks: [
    { id: 'farmacy', type: 'coffee', w: 5, name: 'FRANKLIN AVE FARMACY' },
    { id: 'panyard', type: 'studio', w: 6, name: 'STEEL PAN YARD' } ] },
  '6,3': { kind: 'park', name: 'Brower-ish Park' },
  '7,3': { kind: 'row', landmarks: [{ id: 'chchurch', type: 'church', w: 5, name: 'GREATER HOPE & HOUSING CHURCH' }] },
  '8,3': { kind: 'court', name: 'Eastern Parkway Courts' },
  // ---------- RED HOOK ----------
  '0,4': { kind: 'lot', landmarks: [
    { id: 'flatpack', type: 'warehouse', w: 9, name: 'FLAT-PACK FURNITURE MEGASTORE' },
    { id: 'floodcondos', type: 'sales', w: 7, name: 'FLOODVIEW LUXURY CONDOS' } ] },
  '0,2': { kind: 'row', landmarks: [
    { id: 'pupusas', type: 'bakery', w: 5, name: 'BALLFIELD PUPUSAS' },
    { id: 'rhhouses', type: 'apartment', w: 6, name: 'RED HOOK HOUSES' } ] },
  '0,3': { kind: 'waterfront', name: 'Red Hook Piers' },
  // ---------- CONEY ISLAND ----------
  '6,5': { kind: 'row', landmarks: [
    { id: 'arcade', type: 'boutique', w: 6, name: 'SKEE-BALL & SOLIDARITY ARCADE' },
    { id: 'hotdog', type: 'bakery', w: 5, name: 'HOT DOG HALL OF FAME' } ] },
  '7,5': { kind: 'row', landmarks: [{ id: 'mermaid', type: 'gallery', w: 6, name: 'MERMAID PARADE WORKSHOP' }] },
  '8,5': { kind: 'row', landmarks: [{ id: 'coneyhouses', type: 'apartment', w: 7, name: 'SURFSIDE TOWERS' }] },
  '6,6': { kind: 'beach', name: 'Coney Island Beach' },
  '7,6': { kind: 'beach', name: 'The Boardwalk' },
  '8,6': { kind: 'beach', name: 'Polar Bear Plunge Point' },
  // ---------- FLATBUSH ----------
  '3,5': { kind: 'row', landmarks: [
    { id: 'patty', type: 'bakery', w: 5, name: 'PATTY & COCO BREAD' },
    { id: 'fbtenants', type: 'tenant', w: 6, name: 'FLATBUSH TENANTS COALITION' } ] },
  '4,5': { kind: 'row', landmarks: [{ id: 'kingsish', type: 'community', w: 8, name: 'THE KINGS-ISH THEATRE' }] },
  '5,5': { kind: 'row', landmarks: [{ id: 'dollarvan', type: 'sales', w: 5, name: 'DOLLAR VAN DISPATCH' }] },
  '3,6': { kind: 'row' },
  '4,6': { kind: 'park', name: 'Parade Grounds' },
  '5,6': { kind: 'row', landmarks: [{ id: 'fbchurch', type: 'church', w: 5, name: 'CHURCH OF THE TUESDAY MEETING' }] },
  // ---------- SUNSET PARK ----------
  '0,5': { kind: 'park', name: 'Sunset Park (The Actual Park)' },
  '1,5': { kind: 'row', landmarks: [
    { id: 'taqueria', type: 'bakery', w: 5, name: 'FIFTH AVE TAQUERIA' },
    { id: 'dimsum', type: 'bakery', w: 6, name: 'EIGHTH AVE DIM SUM PALACE' } ] },
  '2,5': { kind: 'lot', landmarks: [{ id: 'induscity', type: 'warehouse', w: 9, name: 'INDUSTRY-ISH CITY' }] },
  '0,6': { kind: 'waterfront', name: 'Sunset Waterfront' },
  '1,6': { kind: 'row', landmarks: [{ id: 'spcb', type: 'government', w: 6, name: 'COMMUNITY BOARD 7-ISH' }] },
  '2,6': { kind: 'row' },
};

const FILLER: Record<District, BuildingType[]> = {
  downtown: ['tower', 'government', 'apartment', 'tower'],
  parkslope: ['brownstone', 'brownstone', 'brownstone', 'coffee', 'boutique'],
  bedstuy: ['brownstone', 'brownstone', 'apartment', 'laundromat'],
  bushwick: ['warehouse', 'studio', 'apartment', 'warehouse'],
  crownheights: ['brownstone', 'apartment', 'bodega', 'brownstone', 'laundromat'],
  redhook: ['warehouse', 'warehouse', 'apartment', 'studio'],
  coneyisland: ['apartment', 'apartment', 'bodega', 'boutique'],
  flatbush: ['apartment', 'bodega', 'laundromat', 'apartment', 'church'],
  sunsetpark: ['warehouse', 'bodega', 'apartment', 'bakery'],
  plg: ['brownstone', 'apartment', 'apartment', 'laundromat'],
};
const HEIGHT: Record<BuildingType, [number, number]> = {
  brownstone: [6, 7], coffee: [5, 5], boutique: [5, 6], nonprofit: [7, 7], coop: [6, 6], bodega: [5, 5],
  mural: [7, 7], tenant: [7, 7], community: [7, 7], studio: [7, 8], warehouse: [7, 8], gallery: [6, 7],
  government: [9, 9], courthouse: [10, 10], police: [8, 8], tower: [11, 11], apartment: [8, 9],
  laundromat: [5, 5], church: [9, 9], shed: [3, 3], bakery: [6, 6], sales: [7, 7],
};

function rng(seed: number) {
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export interface WorldLayout {
  tiles: number[][];
  blocked: boolean[][];
  buildings: BuildingDef[];
  props: PropDef[];
  spots: Record<string, Spot>;
  labels: { text: string; x: number; y: number }[];
}

export function generateLayout(): WorldLayout {
  const rand = rng(1312);
  const tiles: number[][] = [];
  const blocked: boolean[][] = [];
  for (let y = 0; y < MAP_H; y++) { tiles.push(new Array(MAP_W).fill(T.SIDEWALK)); blocked.push(new Array(MAP_W).fill(false)); }
  const set = (x: number, y: number, t: T) => { if (x >= 0 && y >= 0 && x < MAP_W && y < MAP_H) tiles[y][x] = t; };

  // Streets
  for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) {
    const vx = x % BLOCK_W, hy = y % BLOCK_H;
    const onV = vx < ROAD, onH = hy < ROAD;
    if (onV && onH) set(x, y, T.INTERSECTION);
    else if (onV) set(x, y, hy === ROAD || hy === BLOCK_H - 1 ? T.CROSS_V : vx === 1 ? (y % 2 ? T.LANE_V : T.ASPHALT) : T.ASPHALT);
    else if (onH) set(x, y, vx === ROAD || vx === BLOCK_W - 1 ? T.CROSS_H : hy === 1 ? (x % 2 ? T.LANE_H : T.ASPHALT) : T.ASPHALT);
  }

  const buildings: BuildingDef[] = [];
  const props: PropDef[] = [];
  const spots: Record<string, Spot> = {};
  const labels: { text: string; x: number; y: number }[] = [];

  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const dist = districtOfBlock(c, r);
    const spec = BLOCKS[`${c},${r}`] ?? { kind: 'row' };
    const bx = c * BLOCK_W + ROAD, by = r * BLOCK_H + ROAD; // block tile origin
    const bw = BLOCK_W - ROAD, bh = BLOCK_H - ROAD; // 19 x 15
    // Curb ring
    for (let x = bx; x < bx + bw; x++) { set(x, by, T.CURB); set(x, by + bh - 1, T.CURB); }
    for (let y = by; y < by + bh; y++) { set(bx, y, T.CURB); set(bx + bw - 1, y, T.CURB); }
    // Interior (inside 2-tile sidewalk)
    const ix = bx + 2, iy = by + 2, iw = bw - 4, ih = bh - 4; // 15 x 11
    const fill = (t: T) => { for (let y = iy; y < iy + ih; y++) for (let x = ix; x < ix + iw; x++) set(x, y, t); };
    const px = (tx: number) => tx * TILE, cxp = (ix + iw / 2) * TILE, cyp = (iy + ih / 2) * TILE;

    // Street trees & lamps along curbs
    for (let x = bx + 2; x < bx + bw - 1; x += 5) {
      props.push({ kind: 'tree', x: px(x) + 16, y: px(by) + 14, solid: true, variant: Math.floor(rand() * 3) });
      if (x + 2 < bx + bw - 1) props.push({ kind: 'lamp', x: px(x + 2) + 16, y: px(by + bh - 1) + 26 });
    }
    if (rand() < 0.6) props.push({ kind: 'hydrant', x: px(bx) + 18, y: px(by + bh - 1) + 6 });
    if (rand() < 0.5) props.push({ kind: 'trash', x: px(bx + bw - 1) + 12, y: px(by + 1) + 20 });

    if (spec.name) labels.push({ text: spec.name, x: cxp, y: cyp });

    if (spec.kind === 'park' || spec.kind === 'pond') {
      for (let y = by + 1; y < by + bh - 1; y++) for (let x = bx + 1; x < bx + bw - 1; x++) set(x, y, T.GRASS);
      // paths
      for (let x = bx + 1; x < bx + bw - 1; x++) set(x, by + 7, T.PLAZA);
      for (let y = by + 1; y < by + bh - 1; y++) set(bx + 9, y, T.PLAZA);
      if (spec.kind === 'park' && !spots.adrian) spots.adrian = { x: px(bx + 12), y: px(by + 7) + 16 };
      if (spec.kind === 'pond') {
        for (let y = by + 2; y < by + 13; y++) for (let x = bx + 2; x < bx + 17; x++) {
          const dx = (x - (bx + 9.5)) / 7, dy = (y - (by + 10)) / 3.6;
          if (dx * dx + dy * dy < 1 && y > by + 7) set(x, y, T.WATER);
        }
        props.push({ kind: 'duck', x: px(bx + 7), y: px(by + 10), variant: 0 });
        props.push({ kind: 'duck', x: px(bx + 12), y: px(by + 11), variant: 1 });
      }
      for (let i = 0; i < 16; i++) {
        const tx = bx + 2 + Math.floor(rand() * (bw - 4)), ty = by + 2 + Math.floor(rand() * (bh - 4));
        if (tiles[ty][tx] === T.GRASS) props.push({ kind: 'tree', x: px(tx) + 16, y: px(ty) + 16, solid: true, variant: Math.floor(rand() * 3) });
      }
      props.push({ kind: 'bench', x: px(bx + 6), y: px(by + 6) + 20 });
      props.push({ kind: 'bench', x: px(bx + 13), y: px(by + 6) + 20 });
      continue;
    }
    if (spec.kind === 'beach') {
      // Boardwalk across the top, sand, then the Atlantic
      for (let y = by + 1; y < by + bh - 1; y++) for (let x = bx + 1; x < bx + bw - 1; x++) set(x, y, y < by + 4 ? T.PLAZA : y < by + 10 ? T.SAND : T.WATER);
      for (let x = bx + 3; x < bx + bw - 2; x += 5) { props.push({ kind: 'bench', x: px(x), y: px(by + 2) + 10 }); props.push({ kind: 'lamp', x: px(x + 2) + 16, y: px(by + 1) + 26 }); }
      if (rand() < 0.7) props.push({ kind: 'trash', x: px(bx + 2) + 12, y: px(by + 3) + 14 });
      if (spec.name === 'The Boardwalk') spots.boardwalk = { x: cxp, y: px(by + 5) + 8 };
      continue;
    }
    if (spec.kind === 'waterfront') {
      // Industrial pier: yard up top, a pier poking into the harbor
      for (let y = by + 1; y < by + bh - 1; y++) for (let x = bx + 1; x < bx + bw - 1; x++) set(x, y, y < by + 6 ? T.LOT : T.WATER);
      for (let y = by + 6; y < by + bh - 1; y++) for (let x = bx + 7; x < bx + 12; x++) set(x, y, T.PLAZA);
      for (let x = bx + 2; x < bx + bw - 2; x += 4) props.push({ kind: rand() < 0.5 ? 'crate' : 'dumpster', x: px(x) + 16, y: px(by + 2) + 22, solid: true, variant: Math.floor(rand() * 3) });
      props.push({ kind: 'bench', x: px(bx + 9), y: px(by + bh - 3) });
      continue;
    }
    if (spec.kind === 'plaza') {
      fill(T.PLAZA);
      for (let y = by + 1; y < by + bh - 1; y++) for (let x = bx + 1; x < bx + bw - 1; x++) set(x, y, T.PLAZA);
      props.push({ kind: 'fountain', x: cxp, y: cyp + 80, solid: true });
      props.push({ kind: 'bench', x: cxp - 160, y: cyp + 120 });
      props.push({ kind: 'bench', x: cxp + 160, y: cyp + 120 });
      spots.plazaSpawn = { x: cxp - 60, y: cyp + 190 };
      // Borough Hall across the top
      const lm = spec.landmarks![0];
      const w = lm.w * TILE, h = 5 * TILE, x = cxp - w / 2, y = iy * TILE;
      buildings.push({ id: lm.id, type: lm.type, name: lm.name, district: dist, x, y, w, h, variant: 0 });
      markBlocked(blocked, x, y, w, h);
      if (lm.spot) spots[lm.spot] = { x: cxp + 120, y: y + h + 48 };
      continue;
    }
    if (spec.kind === 'garden') {
      fill(T.GARDEN);
      for (let y = iy; y < iy + ih; y += 3) for (let x = ix; x < ix + iw; x++) set(x, y, T.YARD);
      props.push({ kind: 'sunflower', x: cxp - 120, y: cyp - 40 }); props.push({ kind: 'sunflower', x: cxp + 90, y: cyp + 30 });
      props.push({ kind: 'sunflower', x: cxp + 150, y: cyp - 70 });
      const sx = px(ix + iw - 4), sy = px(iy);
      buildings.push({ id: `shed-${c}-${r}`, type: 'shed', name: 'TOOLS (PLEASE RETURN)', district: dist, x: sx, y: sy, w: 3 * TILE, h: 3 * TILE, variant: 0 });
      markBlocked(blocked, sx, sy, 3 * TILE, 3 * TILE);
      spots.garden = { x: cxp, y: cyp };
      continue;
    }
    if (spec.kind === 'court') {
      fill(T.GRASS);
      for (let y = iy + 2; y < iy + ih - 2; y++) for (let x = ix + 2; x < ix + iw - 2; x++) set(x, y, T.COURT);
      props.push({ kind: 'hoop', x: px(ix + 2) + 10, y: cyp, solid: true });
      props.push({ kind: 'hoop', x: px(ix + iw - 2) - 10, y: cyp, solid: true, variant: 1 });
      props.push({ kind: 'bench', x: cxp, y: px(iy + ih - 1) + 8 });
      continue;
    }
    if (spec.kind === 'lot') fill(T.LOT); else fill(T.YARD);

    // Row of buildings sitting on the south edge of the interior.
    const bottom = (iy + ih) * TILE;
    let cursor = ix;
    const end = ix + iw;
    const queue = [...(spec.landmarks ?? [])];
    let idx = 0;
    while (cursor < end) {
      let lm = queue.shift();
      let type: BuildingType, w: number;
      if (lm) { type = lm.type; w = Math.min(lm.w, end - cursor); }
      else {
        const pool = FILLER[dist];
        type = pool[Math.floor(rand() * pool.length)];
        w = Math.min(type === 'brownstone' ? 3 : 3 + Math.floor(rand() * 3), end - cursor);
        if (end - cursor - w < 3) w = end - cursor; // avoid slivers
        if (w < 3) break;
      }
      const [h0, h1] = HEIGHT[type];
      const h = (h0 + Math.floor(rand() * (h1 - h0 + 1))) * TILE;
      const x = cursor * TILE, y = bottom - h;
      const id = lm?.id ?? `b-${c}-${r}-${idx}`;
      buildings.push({ id, type, name: lm?.name, district: dist, x, y, w: w * TILE, h, variant: Math.floor(rand() * 4) });
      markBlocked(blocked, x, y, w * TILE, h);
      if (lm?.spot) spots[lm.spot] = { x: x + (w * TILE) / 2 + (lm.id === 'mural' ? 70 : 0), y: bottom + 30 };
      if (lm?.id === 'mural') spots.fridge = { x: x + (w * TILE) / 2 - 40, y: bottom + 6 };
      if (lm?.id === 'bodega') spots.cat = { x: x + w * TILE + 30, y: bottom + 20 };
      if (lm?.id === 'commcenter') { spots.marcus = { x: x + 60, y: bottom + 34 }; spots.priya = { x: x + w * TILE - 60, y: bottom + 34 }; }
      cursor += w; idx++;
    }
    // Backyard trees & stuff in the strip above the buildings
    for (let x = ix + 1; x < end - 1; x += 3 + Math.floor(rand() * 3)) {
      const kind = spec.kind === 'lot' ? (rand() < 0.5 ? 'crate' : 'dumpster') : 'tree';
      props.push({ kind, x: px(x) + 16, y: px(iy) + 22, solid: true, variant: Math.floor(rand() * 3) });
    }
  }

  // Bike share docks
  const dock = (name: string, c: number, r: number, dx: number) => {
    const x = (c * BLOCK_W + ROAD + dx) * TILE, y = (r * BLOCK_H + ROAD + BLOCK_H - ROAD - 1) * TILE - 6;
    spots[name] = { x, y };
  };
  dock('dock-downtown', 1, 0, 3); dock('dock-bedstuy', 3, 1, 15); dock('dock-parkslope', 1, 2, 15); dock('dock-bushwick', 5, 1, 15);
  dock('dock-crownheights', 5, 3, 15); dock('dock-redhook', 0, 2, 15); dock('dock-coney', 7, 5, 15); dock('dock-flatbush', 4, 5, 3); dock('dock-sunsetpark', 1, 5, 15); dock('dock-plg', 4, 4, 15);
  // Vendors
  spots.churro = { x: 8 * TILE, y: (3 * BLOCK_H + ROAD + 6) * TILE + 20 };
  spots.halal = { x: spots.plazaSpawn.x + 260, y: spots.plazaSpawn.y + 10 };
  props.push({ kind: 'cart', x: (BLOCK_W * 2 - 2) * TILE, y: (BLOCK_H * 3 + 9) * TILE, variant: 1, solid: true });
  props.push({ kind: 'truck', x: (BLOCK_W * 4 + 10) * TILE, y: (BLOCK_H * 2 + ROAD + 14) * TILE + 24, solid: true });

  spots.playerStart = spots.plazaSpawn;
  return { tiles, blocked, buildings, props, spots, labels };
}

function markBlocked(b: boolean[][], x: number, y: number, w: number, h: number) {
  for (let ty = Math.floor(y / TILE); ty < Math.ceil((y + h) / TILE); ty++)
    for (let tx = Math.floor(x / TILE); tx < Math.ceil((x + w) / TILE); tx++) if (b[ty]) b[ty][tx] = true;
}

export function districtAt(x: number, y: number): District {
  const c = Math.min(COLS - 1, Math.max(0, Math.floor((x - ROAD * TILE / 2) / (BLOCK_W * TILE))));
  const r = Math.min(ROWS - 1, Math.max(0, Math.floor((y - ROAD * TILE / 2) / (BLOCK_H * TILE))));
  return districtOfBlock(c, r);
}
