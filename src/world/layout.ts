import type { District } from '../core/types';
import { NEIGHBOR_AT } from '../data/neighbors';
import { GHOST_AT, STREET_GHOST_AT } from '../data/ghosts';
import { VILLAIN_AT } from '../data/villains';
import { PAINTED_AT } from '../data/landmarks';
import { CAMEO_AT } from '../data/cameos';
import { CELLS, GRID, KINDS, LAT_EDGES, LNG_EDGES, NEIGHBORHOODS, PARKNAMES } from './brooklynGrid';

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
/** Real Brooklyn (Nov 21 2026): the grid comes from tools/build-grid.py (NYC neighborhood boundaries). */
export const COLS = GRID.cols;
export const ROWS = GRID.rows;
export const MAP_W = COLS * BLOCK_W + ROAD;
export const MAP_H = ROWS * BLOCK_H + ROAD;
export const WORLD_W = MAP_W * TILE;
/** Kept for older imports: the river is now real water blocks, not a band along the top. */
export const RIVER_ROWS = 0;
export const WORLD_H = MAP_H * TILE;

export enum T {
  ASPHALT = 0, LANE_V = 1, LANE_H = 2, SIDEWALK = 3, GRASS = 4, PLAZA = 5, CROSS_V = 6, CROSS_H = 7,
  GARDEN = 8, WATER = 9, YARD = 10, INTERSECTION = 11, COURT = 12, LOT = 13, CURB = 14, SAND = 15, OFFMAP = 16,
}
export const WALKABLE = new Set([T.SIDEWALK, T.GRASS, T.PLAZA, T.GARDEN, T.YARD, T.COURT, T.LOT, T.CURB, T.SAND]);

export type BuildingType =
  | 'brownstone' | 'coffee' | 'boutique' | 'nonprofit' | 'coop' | 'bodega' | 'mural' | 'tenant'
  | 'community' | 'studio' | 'warehouse' | 'gallery' | 'government' | 'courthouse' | 'police'
  | 'tower' | 'apartment' | 'laundromat' | 'church' | 'shed' | 'bakery' | 'sales'
  | 'arena' | 'library' | 'arch' | 'supertall' | 'clocktower';

export interface BuildingDef {
  id: string; type: BuildingType; name?: string; district: District;
  x: number; y: number; w: number; h: number; // px
  variant: number;
}
export interface PropDef { kind: string; x: number; y: number; solid?: boolean; variant?: number }
export interface Spot { x: number; y: number }

type BlockKind = 'row' | 'park' | 'pond' | 'plaza' | 'garden' | 'court' | 'lot' | 'beach' | 'waterfront' | 'riverfront' | 'flatbush';
interface Landmark { id: string; type: BuildingType; w: number; name: string; spot?: string; h?: number; at?: [number, number] }
interface BlockSpec { kind: BlockKind; name?: string; landmarks?: Landmark[]; noFountain?: boolean; landmarksSouth?: boolean; amusements?: boolean }

/** A Brooklyn block (not water, Manhattan or Queens). */
export function isLand(c: number, r: number) { return r >= 0 && c >= 0 && r < ROWS && c < COLS && CELLS[r][c] >= 0; }
/** -1 water, -2 Manhattan, -3 Queens (and water past the edges), else a neighborhood index. */
export function cellOf(c: number, r: number) { return r >= 0 && c >= 0 && r < ROWS && c < COLS ? CELLS[r][c] : -1; }
export function districtOfBlock(c: number, r: number): District { const v = cellOf(c, r); return v >= 0 ? NEIGHBORHOODS[v][1] : 'waterfront'; }
/** The neighborhood (or park) name of a block, for the banner when you walk in. */
export function neighborhoodOfBlock(c: number, r: number): string | null { const v = cellOf(c, r); return v >= 0 ? PARKNAMES[`${c},${r}`] ?? NEIGHBORHOODS[v][0] : null; }
function frac(E: number[], v: number) {
  for (let i = 0; i < E.length - 1; i++) { const a = E[i], b = E[i + 1]; if (v >= Math.min(a, b) && v <= Math.max(a, b)) return i + (v - a) / (b - a); }
  return Math.abs(v - E[0]) < Math.abs(v - E[E.length - 1]) ? 0 : E.length - 1;
}
/** A real place (lat, lng) on the map, in tiles. Integer grid lines are street centers, like I(c, r). */
export const geo = (lat: number, lng: number) => ({ x: frac(LNG_EDGES, lng) * BLOCK_W + 1.5, y: frac(LAT_EDGES, lat) * BLOCK_H + 1.5 });

/** Floyd Bennett Field's four old runways (OpenStreetMap abandoned:aeroway=runway, © OpenStreetMap contributors, ODbL). */
export const RUNWAYS: [string, string, [number, number], [number, number]][] = [
  ['6', '24', [40.59418, -73.90001], [40.60449, -73.88399]],
  ['1', '19', [40.58276, -73.89124], [40.60388, -73.88978]],
  ['15', '33', [40.59418, -73.90001], [40.58381, -73.88871]],
  ['12', '30', [40.60343, -73.88926], [40.59502, -73.88437]],
];
export const RUNWAY_W = 2.4 * TILE;

// Hand-authored blocks, keyed "c,r" on the real-Brooklyn grid (see the cell picture from tools/build-grid.py).
// Each sits in the block that holds its real location; unlisted Brooklyn blocks get a default from their neighborhood.
const BLOCKS: Record<string, BlockSpec> = {
  // ---------- THE WATERFRONT ----------
  '5,4': { kind: 'park', name: 'Brooklyn Heights Promenade' },
  '6,3': { kind: 'park', name: 'Brooklyn Bridge Park' }, // DUMBO; the bridge runs north from here over the East River
  '8,4': { kind: 'lot', name: 'Brooklyn Navy Yard' },
  '9,2': { kind: 'park', name: 'Domino Park-ish' }, // the Williamsburg waterfront
  // ---------- DOWNTOWN ----------
  '6,4': { kind: 'row', landmarks: [{ id: 'courthouse', type: 'courthouse', w: 7, name: 'HALL OF MILD JUSTICE' }] }, // Cadman Plaza: the courts
  '5,5': { kind: 'row', landmarks: [{ id: 'police', type: 'police', w: 6, name: 'PRECINCT HQ' }] },
  '6,5': { kind: 'plaza', name: 'Borough Plaza', landmarksSouth: true, landmarks: [ // real plaza + fountain are north of the hall
    { id: 'boroughhall', type: 'government', w: 9, h: 7, name: 'BOROUGH HALL', spot: 'gary' } ] },
  '7,4': { kind: 'row', landmarks: [
    { id: 'synergy', type: 'tower', w: 5, name: 'SYNERGY TOWER', spot: 'luco' },
    { id: 'permits', type: 'government', w: 5, name: 'DEPT. OF PERMITS & DELAYS', spot: 'bridgette' },
    { id: 'luxe', type: 'sales', w: 5, name: 'LUXE LOFTS', spot: 'tyler' } ] },
  '7,5': { kind: 'row', landmarks: [
    { id: 'bktower', type: 'supertall', w: 6, name: 'THE BROOKLYN TOWER' },
    { id: 'atlterm', type: 'boutique', w: 8, name: 'ATLANTIC TERMINAL-ISH MALL' } ] },
  // ---------- FORT GREENE ----------
  '8,5': { kind: 'row', landmarks: [{ id: 'bkorg', type: 'nonprofit', w: 7, name: 'BROOKLYN ORG' }] }, // the community foundation, by Hanson Place
  '8,6': { kind: 'row', landmarks: [ // just east of Flatbush, like the real Savings Bank and BAM
    { id: 'church', type: 'church', w: 5, name: 'FIRST CHURCH OF THE BLOCK PARTY', spot: 'deroy' },
    { id: 'savingsbank', type: 'clocktower', w: 5, name: 'WILLIAMSBURGH SAVINGS BANK' },
    { id: 'bam', type: 'gallery', w: 8, h: 8, name: 'BAM' } ] },
  // Flatbush Ave cuts this block corner to corner (Atlantic & Flatbush): Barclays sits on the northeast triangle
  '8,7': { kind: 'flatbush', name: 'Atlantic & Flatbush', landmarks: [
    { id: 'barclays', type: 'arena', w: 9, name: 'BARCLAYS-ISH CENTER', spot: 'skye' } ] },
  // ---------- PARK SLOPE ----------
  '7,9': { kind: 'row', landmarks: [
    { id: 'coop', type: 'coop', w: 6, name: 'THE RIGHTEOUS TURNIP CO-OP', spot: 'brendan' },
    { id: 'pour', type: 'coffee', w: 4, name: 'POUR DECISIONS' },
    { id: 'candles', type: 'boutique', w: 5, name: 'CANDLES FOR DOGS' } ] },
  '9,8': { kind: 'row' }, // Plaza St brownstones, northwest of the circle
  '9,9': { kind: 'park', name: 'Prospect Park' },
  '9,11': { kind: 'pond', name: 'Prospect Park' },
  '11,10': { kind: 'park', name: 'Brooklyn Botanic Garden' }, // behind the Brooklyn Museum, like the real one
  '6,9': { kind: 'garden', name: 'Fifth Ave Community Garden' },
  '7,10': { kind: 'row', landmarks: [
    { id: 'yoga', type: 'boutique', w: 5, name: 'HOT YOGA FOR CAPITALISTS', spot: 'danae' },
    { id: 'laundry1', type: 'laundromat', w: 4, name: 'SUDS OF SOLIDARITY' },
    { id: 'oat', type: 'coffee', w: 4, name: '14 OAT MILKS' } ] },
  // ---------- BED-STUY ----------
  '11,6': { kind: 'row', landmarks: [
    { id: 'tenanthall', type: 'tenant', w: 6, name: 'TENANTS UNITED HALL', spot: 'jenna' },
    { id: 'laundry2', type: 'laundromat', w: 4, name: 'SPIN CITY WASH' } ] },
  '11,7': { kind: 'row', landmarks: [
    { id: 'mural', type: 'mural', w: 6, name: 'COMMUNITY FRIDGE MURAL', spot: 'dee' },
    { id: 'stuyapt', type: 'apartment', w: 5, name: '' } ] },
  '12,6': { kind: 'row', landmarks: [
    { id: 'bodega', type: 'bodega', w: 5, name: "FAROUK'S DELI·GROCERY·LOTTO·PHONE REPAIR", spot: 'farouk' } ] },
  '12,7': { kind: 'court', name: 'Kingston Courts' },
  '10,7': { kind: 'row', landmarks: [
    { id: 'commcenter', type: 'community', w: 8, name: 'GATES AVE COMMUNITY CENTER', spot: 'hattie' } ] },
  // ---------- BUSHWICK & EAST WILLIAMSBURG ----------
  '14,4': { kind: 'row', landmarks: [{ id: 'studio9000', type: 'studio', w: 6, name: 'STUDIO 9000', spot: 'jon' }] },
  '15,4': { kind: 'row', landmarks: [
    { id: 'sourdough', type: 'bakery', w: 6, name: 'SOURDOUGH COLLECTIVE', spot: 'juni' },
    { id: 'gww', type: 'gallery', w: 5, name: 'GALLERY WITHOUT WALLS', spot: 'vega' } ] },
  '13,3': { kind: 'lot', landmarks: [{ id: 'wh1', type: 'warehouse', w: 8, name: 'FORMER PICKLE FACTORY' }] },
  '14,3': { kind: 'row', landmarks: [{ id: 'ugallery', type: 'gallery', w: 5, name: 'THE UNDERGROUND (2ND FLOOR)' }] },
  // ---------- CROWN HEIGHTS (Eastern Pkwy runs along the street between rows 8 and 9) ----------
  // Central Library sits in the wedge between Flatbush and Eastern Pkwy, its entrance facing the circle (northwest)
  '10,9': { kind: 'plaza', noFountain: true, landmarks: [
    { id: 'centrallib', type: 'library', w: 9, h: 10, at: [6, 2], name: 'CENTRAL LIBRARY', spot: 'naim' } ] },
  // Brooklyn Museum: south side of Eastern Pkwy, just east of the Library, its front facing north onto the boulevard
  '11,9': { kind: 'plaza', noFountain: true, landmarks: [{ id: 'bkmuseum', type: 'library', w: 15, h: 10, name: 'BROOKLYN MUSEUM' }] },
  '12,8': { kind: 'row', landmarks: [{ id: 'roti', type: 'bakery', w: 5, name: 'ROTI & ROTI & ROTI' }] },
  '12,9': { kind: 'row', landmarks: [
    { id: 'farmacy', type: 'coffee', w: 5, name: 'FRANKLIN AVE FARMACY' },
    { id: 'panyard', type: 'studio', w: 6, name: 'STEEL PAN YARD' },
    { id: 'paradehq', type: 'community', w: 4, name: 'LABOR DAY PARADE HQ' } ] }, // on Eastern Pkwy, where the parade runs
  '13,8': { kind: 'park', name: 'Brower-ish Park' },
  '13,9': { kind: 'row', landmarks: [
    { id: 'chchurch', type: 'church', w: 5, name: 'GREATER HOPE & HOUSING CHURCH' },
    { id: 'chtenants', type: 'tenant', w: 7, name: 'CROWN HEIGHTS TENANT UNION' },
    { id: 'kyrclinic', type: 'government', w: 6, name: 'BERGEN ST KNOW YOUR RIGHTS CLINIC' } ] },
  '14,9': { kind: 'court', name: 'Eastern Parkway Courts' },
  // ---------- PROSPECT LEFFERTS GARDENS ----------
  '10,10': { kind: 'row', landmarks: [
    { id: 'plgta', type: 'tenant', w: 7, name: 'LEFFERTS TENANTS ASSOCIATION', spot: 'nell' },
    { id: 'plgroti', type: 'bakery', w: 4, name: 'DOUBLES & DOUBLES' } ] },
  '11,11': { kind: 'row', landmarks: [{ id: 'plgarms', type: 'apartment', w: 8, name: 'THE PARKSIDE-ISH ARMS' }] },
  '10,11': { kind: 'row', landmarks: [
    { id: 'plglegal', type: 'government', w: 6, name: 'FREE TENANT LAWYERS, 2ND FL' },
    { id: 'plgcoffee', type: 'coffee', w: 4, name: 'LIMESTONE COFFEE' } ] },
  // ---------- RED HOOK ----------
  '3,9': { kind: 'lot', landmarks: [
    { id: 'flatpack', type: 'warehouse', w: 9, name: 'FLAT-PACK FURNITURE MEGASTORE' },
    { id: 'floodcondos', type: 'sales', w: 7, name: 'FLOODVIEW LUXURY CONDOS' } ] },
  '3,8': { kind: 'row', landmarks: [
    { id: 'pupusas', type: 'bakery', w: 5, name: 'BALLFIELD PUPUSAS' },
    { id: 'rhhouses', type: 'apartment', w: 6, name: 'RED HOOK HOUSES' } ] },
  '4,9': { kind: 'waterfront', name: 'Red Hook Piers' },
  // ---------- CONEY ISLAND (Surf Ave above the beach blocks) ----------
  // ---------- MISSIONS 14–16: Marine Park (no subway), Brownsville + East New York (food access), central Crown Heights ----------
  '14,17': { kind: 'row', landmarks: [{ id: 'mpnails', type: 'boutique', w: 6, name: 'AVENUE U NAILS·TAX·NOTARY' }] },
  '15,11': { kind: 'row', landmarks: [
    { id: 'bxdeli', type: 'bodega', w: 4, name: 'BEST DELI & GROCERY & ALSO DELI' },
    { id: 'bxcenter', type: 'community', w: 7, name: 'BROWNSVILLE TENANTS & EATERS ASSN' },
    { id: 'bxdollar', type: 'bodega', w: 4, name: '99¢ & UP & UP & UP' } ] },
  '16,11': { kind: 'row', landmarks: [{ id: 'bxchicken', type: 'bakery', w: 5, name: 'KINGS COUNTY FRIED EVERYTHING' }] },
  '17,11': { kind: 'row', landmarks: [{ id: 'enyfarm', type: 'shed', w: 6, name: 'NEW LOTS FARM STAND · SNAP OK' }] },
  '13,10': { kind: 'row', landmarks: [
    { id: 'chcenter', type: 'community', w: 7, name: 'EASTERN PKWY NEIGHBORS CENTER' },
    { id: 'kingstonhw', type: 'bodega', w: 5, name: 'KINGSTON AVE HARDWARE' },
    { id: 'blockassn', type: 'brownstone', w: 5, name: 'MONTGOMERY ST BLOCK ASSN' } ] },
  '7,19': { kind: 'row', landmarks: [
    { id: 'arcade', type: 'boutique', w: 6, name: 'SKEE-BALL & SOLIDARITY ARCADE' },
    { id: 'hotdog', type: 'bakery', w: 5, name: 'HOT DOG HALL OF FAME' } ] },
  '8,19': { kind: 'row', landmarks: [{ id: 'mermaid', type: 'gallery', w: 6, name: 'MERMAID PARADE WORKSHOP' }] },
  '9,19': { kind: 'row', landmarks: [{ id: 'coneyhouses', type: 'apartment', w: 7, name: 'SURFSIDE TOWERS' }] },
  // The Parachute Jump stands at the west end of the boardwalk
  '6,20': { kind: 'beach', amusements: true, name: 'Coney Island Beach', landmarks: [{ id: 'parachute', type: 'arch', w: 7, h: 2, at: [3, 1], name: 'PARACHUTE JUMP' }] },
  '7,20': { kind: 'beach', amusements: true, name: 'The Boardwalk' },
  '8,20': { kind: 'beach', amusements: true, name: 'Polar Bear Plunge Point' },
  // ---------- FLATBUSH ----------
  '11,13': { kind: 'row', landmarks: [{ id: 'kingsish', type: 'community', w: 8, name: 'THE KINGS-ISH THEATRE' }] }, // east of Flatbush Ave, like the real one
  '10,14': { kind: 'row', landmarks: [
    { id: 'patty', type: 'bakery', w: 5, name: 'PATTY & COCO BREAD' },
    { id: 'fbtenants', type: 'tenant', w: 6, name: 'FLATBUSH TENANTS COALITION' } ] },
  '11,14': { kind: 'row', landmarks: [{ id: 'dollarvan', type: 'sales', w: 5, name: 'DOLLAR VAN DISPATCH' }] },
  '9,15': { kind: 'park', name: 'Parade Grounds' },
  '11,15': { kind: 'row', landmarks: [{ id: 'fbchurch', type: 'church', w: 5, name: 'CHURCH OF THE TUESDAY MEETING' }, { id: 'oacenter', type: 'community', w: 7, name: 'FLATBUSH OLDER ADULT CENTER' }] },
  '11,16': { kind: 'park', name: 'Brooklyn College' }, // Midwood: the quad (painted sprite) and the athletic field inside its track
  // ---------- SUNSET PARK ----------
  '4,13': { kind: 'park', name: 'Sunset Park (The Actual Park)' },
  '3,13': { kind: 'row', landmarks: [
    { id: 'taqueria', type: 'bakery', w: 5, name: 'FIFTH AVE TAQUERIA' },
    { id: 'dimsum', type: 'bakery', w: 6, name: 'EIGHTH AVE DIM SUM PALACE' },
    { id: 'climatehq', type: 'nonprofit', w: 6, name: 'SUNSET PARK CLIMATE COLLECTIVE' } ] },
  '3,12': { kind: 'lot', landmarks: [{ id: 'induscity', type: 'warehouse', w: 9, name: 'INDUSTRY-ISH CITY' }] },
  '4,14': { kind: 'row', landmarks: [{ id: 'spcb', type: 'government', w: 6, name: 'COMMUNITY BOARD 7-ISH' }] },
};

/** The south-shore beach blocks (authored or default). */
function isBeach(c: number, r: number) {
  if (!isLand(c, r)) return false;
  const b = BLOCKS[`${c},${r}`];
  if (b) return b.kind === 'beach';
  const k = KINDS[r][c];
  return k !== 'p' && k !== 'c' && districtOfBlock(c, r) === 'coneyisland' && r >= 18 && cellOf(c, r + 1) === -1;
}
/**
 * A beach block from north to south, by row inside the block (0 = the curb on the street side). Coney's amusement
 * blocks: Surf Ave (the street above), the rides, then the boardwalk, the sand and the Atlantic. Elsewhere: boardwalk, sand, sea.
 * null = keep what's there (the curb, or a cross street running down to the boardwalk).
 */
function beachTile(amus: boolean, ly: number): T | null {
  if (amus) return ly <= 0 ? null : ly <= 6 ? T.LOT : ly <= 9 ? T.PLAZA : ly <= 12 ? T.SAND : T.WATER;
  return ly <= 0 ? null : ly <= 3 ? T.PLAZA : ly <= 9 ? T.SAND : T.WATER;
}
const isAmus = (c: number, r: number) => !!BLOCKS[`${c},${r}`]?.amusements;

/** A block nobody authored: parks and cemeteries from the city data, beaches on the south shore, else streets of its neighborhood. */
function defaultSpec(c: number, r: number, roll: number): BlockSpec {
  const k = KINDS[r][c], pn = PARKNAMES[`${c},${r}`], d = districtOfBlock(c, r);
  if (k === 'p' || k === 'c') return { kind: 'park', name: pn };
  if (d === 'coneyisland' && r >= 18 && cellOf(c, r + 1) === -1) return { kind: 'beach' };
  if (roll < 0.05) return { kind: 'court' };
  if ((d === 'redhook' || d === 'sunsetpark' || d === 'bushwick') && roll < 0.18) return { kind: 'lot' };
  return { kind: 'row' };
}

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
  waterfront: ['warehouse', 'apartment', 'coffee'],
};
/** Brownstone Brooklyn: these neighborhoods' rows are mostly brownstones, whatever district they sit in
 *  (Brooklyn Heights, Fort Greene, Cobble Hill and Boerum Hill would otherwise get Downtown's towers). */
const BROWNSTONE_HOODS = new Set(['Brooklyn Heights', 'Cobble Hill', 'Boerum Hill', 'Carroll Gardens', 'Fort Greene', 'Clinton Hill',
  'Prospect Heights', 'Park Slope', 'Bedford-Stuyvesant', 'Crown Heights', 'Prospect Lefferts Gardens', 'Ocean Hill', 'Weeksville']);
const BROWNSTONE_ROW: BuildingType[] = ['brownstone', 'brownstone', 'brownstone', 'brownstone', 'coffee', 'bodega'];
const HEIGHT: Record<BuildingType, [number, number]> = {
  brownstone: [6, 7], coffee: [5, 5], boutique: [5, 6], nonprofit: [7, 7], coop: [6, 6], bodega: [5, 5],
  mural: [7, 7], tenant: [7, 7], community: [7, 7], studio: [7, 8], warehouse: [7, 8], gallery: [6, 7],
  government: [9, 9], courthouse: [10, 10], police: [8, 8], tower: [11, 11], apartment: [8, 9],
  laundromat: [5, 5], church: [9, 9], shed: [3, 3], bakery: [6, 6], sales: [7, 7],
  arena: [6, 6], library: [7, 7], arch: [4, 4], supertall: [12, 12], clocktower: [12, 12],
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
  labels: { text: string; x: number; y: number; angle?: number }[];
  avenues: Avenue[];
}

/** A diagonal avenue cutting across the grid (pixel coords; hw = half-width of the roadway). */
export interface Avenue { name: string; pts: Spot[]; hw: number }

// Intersection centers, in tiles
const I = (c: number, r: number) => ({ x: c * BLOCK_W + 1.5, y: r * BLOCK_H + 1.5 });
/**
 * Brooklyn's angles. Flatbush runs from the bridge to Barclays (then the hand-built
 * Atlantic & Flatbush block), down the east side of Prospect Park, and angles off
 * again into Flatbush. Fulton cuts east-southeast through Bed-Stuy.
 */
const AVENUES: { name: string; pts: { x: number; y: number }[]; hw: number }[] = [
  // Flatbush: Manhattan Bridge -> DeKalb -> Atlantic (the Barclays block draws its own corner-to-corner piece) ->
  // Grand Army Plaza -> down the east side of Prospect Park -> Church Ave -> Brooklyn College -> Kings Plaza -> Floyd Bennett Field
  { name: 'Flatbush Ave', pts: [geo(40.6990, -73.9862), geo(40.6905, -73.9827), I(8, 7)], hw: 1.7 },
  { name: 'Flatbush Ave', pts: [I(9, 8), I(10, 9)], hw: 1.7 },
  { name: 'Flatbush Ave', pts: [I(10, 9), geo(40.6550, -73.9600), geo(40.6503, -73.9590), geo(40.6327, -73.9475), geo(40.6095, -73.9210), geo(40.5800, -73.8890)], hw: 1.7 },
  // Broadway: Williamsburg Bridge -> Flushing Ave -> Myrtle -> Gates -> Broadway Junction
  { name: 'Broadway', pts: [geo(40.7105, -73.9650), geo(40.7000, -73.9420), geo(40.6973, -73.9353), geo(40.6898, -73.9206), geo(40.6787, -73.9050)], hw: 1.5 },
];
/**
 * Grand Army Plaza: a traffic circle where Flatbush comes down past the park and
 * Eastern Parkway sets off east. The island (arch + Bailey Fountain) is a painted sprite.
 */
// It's an oval, longer north-south, like the real one. Distances use an ellipse-normalized radius:
// mx/my are the ring's mid-line semi-axes, m their mean; rIn/rOut bound the roadway in that metric.
// The island (tree teardrop + the arch's round plaza) is an ellipse of semi-axes ax, ay;
// the roadway is a band of constant width w around it.
export const GAP_CIRCLE = { x: I(10, 9).x, y: I(10, 9).y, ax: 2.9, ay: 5.9, w: 3 };
/** Tile distance outside the island's edge (negative inside). */
export function gapDist(px: number, py: number) {
  const { x, y, ax, ay } = GAP_CIRCLE, dx = px - x, dy = py - y, q = Math.hypot(dx / ax, dy / ay);
  if (q < 1e-6) return -Math.min(ax, ay);
  const g = Math.hypot(dx / (ax * ax), dy / (ay * ay)) / q; // |grad q|
  return (q - 1) / g;
}
/** Points (tiles) of the outline offset from the island edge by d tiles. */
export function gapOutline(d: number, n = 96) {
  const { x, y, ax, ay } = GAP_CIRCLE, pts: { x: number; y: number }[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2, ex = ax * Math.cos(t), ey = ay * Math.sin(t);
    const nx = ex / (ax * ax), ny = ey / (ay * ay), l = Math.hypot(nx, ny);
    pts.push({ x: x + ex + (nx / l) * d, y: y + ey + (ny / l) * d });
  }
  return pts;
}
/** Semi-axes (tiles) of the oval at normalized radius r */
const SIDEWALK_W = 1.2;
function segDist(x: number, y: number, a: { x: number; y: number }, b: { x: number; y: number }) {
  const dx = b.x - a.x, dy = b.y - a.y, t = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(x - a.x - t * dx, y - a.y - t * dy);
}
/** Tile distance from the nearest avenue's asphalt edge (<= 0 means on the roadway). */
function aveDist(tx: number, ty: number) {
  let best = Infinity;
  for (const a of AVENUES) for (let i = 1; i < a.pts.length; i++) best = Math.min(best, segDist(tx + 0.5, ty + 0.5, a.pts[i - 1], a.pts[i]) - a.hw);
  const g = GAP_CIRCLE, r = gapR(tx, ty) - g.w / 2;
  return Math.min(best, Math.abs(r) - g.w / 2);
}
function gapR(tx: number, ty: number) { return gapDist(tx + 0.5, ty + 0.5); }
const onAve = (tx: number, ty: number) => aveDist(tx, ty) <= SIDEWALK_W + 0.4 || gapR(tx, ty) <= GAP_CIRCLE.w + SIDEWALK_W + 0.4;

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
    if (!onV && !onH) continue;
    // A street exists only where it touches a Brooklyn block; otherwise it's river, bay, or another borough
    const kc = Math.floor(x / BLOCK_W), kr = Math.floor(y / BLOCK_H);
    const touch: [number, number][] = onV && onH ? [[kc - 1, kr - 1], [kc, kr - 1], [kc - 1, kr], [kc, kr]] : onV ? [[kc - 1, kr], [kc, kr]] : [[kc, kr - 1], [kc, kr]];
    if (!touch.some(([a, b]) => isLand(a, b))) { set(x, y, touch.some(([a, b]) => cellOf(a, b) === -1) ? T.WATER : T.OFFMAP); continue; }
    // No street out past the beach: the road along a beach's ocean edge is the Atlantic
    if (onH && touch.some(([a, b]) => b === kr - 1 && isBeach(a, b)) && touch.every(([a, b]) => b === kr - 1 || !isLand(a, b))) { set(x, y, T.WATER); continue; }
    // Between two beach blocks a street only runs down to the boardwalk; past that it's boardwalk, sand and sea
    if (onV && !onH && isBeach(kc - 1, kr) && isBeach(kc, kr)) {
      const t = beachTile(isAmus(kc - 1, kr) && isAmus(kc, kr), hy - ROAD);
      if (t !== null) { set(x, y, t); continue; }
    }
    if (onV && onH) set(x, y, T.INTERSECTION);
    else if (onV) set(x, y, hy === ROAD || hy === BLOCK_H - 1 ? T.CROSS_V : vx === 1 ? (y % 2 ? T.LANE_V : T.ASPHALT) : T.ASPHALT);
    else if (onH) set(x, y, vx === ROAD || vx === BLOCK_W - 1 ? T.CROSS_H : hy === 1 ? (x % 2 ? T.LANE_H : T.ASPHALT) : T.ASPHALT);
  }

  const buildings: BuildingDef[] = [];
  const props: PropDef[] = [];
  const spots: Record<string, Spot> = {};
  const labels: { text: string; x: number; y: number; angle?: number }[] = [];
  const named = new Set<string>(); // a park spread over several blocks gets one label

  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const dist = districtOfBlock(c, r);
    const brownstones = BROWNSTONE_HOODS.has(neighborhoodOfBlock(c, r) ?? '');
    const bx = c * BLOCK_W + ROAD, by = r * BLOCK_H + ROAD; // block tile origin
    const bw = BLOCK_W - ROAD, bh = BLOCK_H - ROAD; // 19 x 15
    const roll = rand();
    if (!isLand(c, r)) { // river, bay, ocean, or Manhattan / Queens across the water
      const t = cellOf(c, r) === -1 ? T.WATER : T.OFFMAP;
      for (let y = by; y < by + bh; y++) for (let x = bx; x < bx + bw; x++) set(x, y, t);
      if (BLOCKS[`${c},${r}`]) console.warn('authored block on water', c, r);
      continue;
    }
    const spec = BLOCKS[`${c},${r}`] ?? defaultSpec(c, r, roll);
    // Curb ring
    for (let x = bx; x < bx + bw; x++) { set(x, by, T.CURB); set(x, by + bh - 1, T.CURB); }
    for (let y = by; y < by + bh; y++) { set(bx, y, T.CURB); set(bx + bw - 1, y, T.CURB); }
    // Interior (inside 2-tile sidewalk)
    const ix = bx + 2, iy = by + 2, iw = bw - 4, ih = bh - 4; // 15 x 11
    const fill = (t: T) => { for (let y = iy; y < iy + ih; y++) for (let x = ix; x < ix + iw; x++) set(x, y, t); };
    const px = (tx: number) => tx * TILE, cxp = (ix + iw / 2) * TILE, cyp = (iy + ih / 2) * TILE;

    if (spec.kind === 'flatbush') {
      // Flatbush Avenue runs corner to corner (NW to SE). u = across, v = down, both 0..1.
      const band = 1.7;
      for (let y = by; y < by + bh; y++) for (let x = bx; x < bx + bw; x++) {
        const d = ((x - bx) / bw - (y - by) / bh) * bw; // signed tile distance from the diagonal
        set(x, y, Math.abs(d) <= band ? T.ASPHALT : Math.abs(d) <= band + 1.2 ? T.SIDEWALK : T.PLAZA);
      }
      for (const end of [[bx - 2, by - 2], [bx + bw + 1, by + bh + 1]]) for (let k = 0; k < 3; k++) set(end[0] + k, end[1] + k, T.INTERSECTION);
      spots.flatbushO = { x: px(bx), y: px(by) }; // block origin, for the smooth overlay
      spots.flatbushA = { x: px(bx - 1), y: px(by - 1) }; spots.flatbushB = { x: px(bx + bw + 1), y: px(by + bh + 1) };
      // Barclays in the northeast triangle, its plaza wrapping the corner
      const lm = spec.landmarks![0];
      const w = 12 * TILE, h = 274, x = px(bx + bw) - w, y = px(by); // sized to the painted sprite (384x274)
      buildings.push({ id: lm.id, type: lm.type, name: lm.name, district: dist, x, y, w, h, variant: 0 });
      markBlocked(blocked, x, y, w, h);
      if (lm.spot) spots[lm.spot] = { x: x + w * 0.13, y: y + h * 0.68 }; // on the plaza, just past the oculus
      props.push({ kind: 'bench', x: px(bx + 3), y: px(by + bh - 3) });
      props.push({ kind: 'lamp', x: px(bx + 2) + 16, y: px(by + bh - 6) });
      props.push({ kind: 'bench', x: px(bx + bw - 4), y: px(by + 10) });
      if (spec.name) labels.push({ text: spec.name, x: px(bx + 5), y: px(by + bh - 4) });
      continue;
    }
    if (spec.kind === 'riverfront') {
      // Park behind the promenade; the river itself is painted after the loop.
      for (let y = by + 1; y < by + bh - 1; y++) for (let x = bx + 1; x < bx + bw - 1; x++) set(x, y, T.GRASS);
      if (spec.name) labels.push({ text: spec.name, x: cxp, y: cyp });
      continue;
    }
    // Street trees & lamps along curbs
    for (let x = bx + 2; x < bx + bw - 1; x += 5) {
      props.push({ kind: 'tree', x: px(x) + 16, y: px(by) + 14, solid: true, variant: Math.floor(rand() * 3) });
      if (x + 2 < bx + bw - 1) props.push({ kind: 'lamp', x: px(x + 2) + 16, y: px(by + bh - 1) + 26 });
    }
    if (rand() < 0.6) props.push({ kind: 'hydrant', x: px(bx) + 18, y: px(by + bh - 1) + 6 });
    if (rand() < 0.5) props.push({ kind: 'trash', x: px(bx + bw - 1) + 12, y: px(by + 1) + 20 });

    if (spec.name && !named.has(spec.name)) { named.add(spec.name); labels.push({ text: spec.name, x: cxp, y: spec.landmarksSouth ? px(by + 4) : cyp }); } // keep the name on open ground

    if (spec.kind === 'park' || spec.kind === 'pond') {
      for (let y = by + 1; y < by + bh - 1; y++) for (let x = bx + 1; x < bx + bw - 1; x++) set(x, y, T.GRASS);
      // paths
      for (let x = bx + 1; x < bx + bw - 1; x++) set(x, by + 7, T.PLAZA);
      for (let y = by + 1; y < by + bh - 1; y++) set(bx + 9, y, T.PLAZA);
      if (spec.name === 'Brooklyn Heights Promenade') spots.promenade = { x: px(bx + 2), y: cyp };
      if (spec.name === 'Brooklyn Bridge Park') spots.bridge = { x: px(bx + 5) + 16, y: px(by) }; // moved north over the river below
      if (spec.kind === 'park' && spec.name === 'Prospect Park' && !spots.adrian) spots.adrian = { x: px(bx + 12), y: px(by + 7) + 16 };
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
      // Coney's amusement blocks: rides along Surf Ave, then the boardwalk, sand and the Atlantic. Elsewhere: boardwalk, sand, sea.
      const amus = !!spec.amusements, bw0 = amus ? 7 : 1; // the boardwalk's first row
      for (let y = by + 1; y < by + bh; y++) for (let x = bx; x < bx + bw; x++) { const t = beachTile(amus, y - by); if (t !== null) set(x, y, t); }
      for (let x = bx + 3; x < bx + bw - 2; x += 5) { props.push({ kind: 'bench', x: px(x), y: px(by + bw0 + 1) + 10 }); props.push({ kind: 'lamp', x: px(x + 2) + 16, y: px(by + bw0) + 26 }); }
      if (rand() < 0.7) props.push({ kind: 'trash', x: px(bx + 2) + 12, y: px(by + bw0 + 2) + 14 });
      if (spec.name === 'The Boardwalk') spots.boardwalk = { x: cxp, y: px(by + bw0 + 4) + 8 };
      for (const lm of spec.landmarks ?? []) if (lm.at) {
        const x = px(bx + lm.at[0]), y = px(by + lm.at[1]), w = lm.w * TILE, h = (lm.h ?? 2) * TILE;
        buildings.push({ id: lm.id, type: lm.type, name: lm.name, district: dist, x, y, w, h, variant: 0 });
        markBlocked(blocked, x, y, w, h);
      }
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
      const south = !!spec.landmarksSouth, fy = south ? cyp - 110 : cyp + 80; // the open plaza sits opposite the landmarks
      if (!spec.noFountain) props.push({ kind: 'fountain', x: cxp, y: fy, solid: true });
      props.push({ kind: 'bench', x: cxp - 160, y: fy + 40 });
      props.push({ kind: 'bench', x: cxp + 160, y: fy + 40 });
      if (spec.name === 'Borough Plaza') spots.plazaSpawn = south ? { x: cxp - 150, y: fy + 20 } : { x: cxp - 60, y: cyp + 190 }; // open plaza, beside the fountain
      // Landmarks side by side across the top of the plaza
      const lms = spec.landmarks ?? [], gap = TILE;
      let lx = cxp - (lms.reduce((t, l) => t + l.w * TILE, 0) + gap * (lms.length - 1)) / 2;
      for (const lm of lms) {
        const w = lm.w * TILE, h = (lm.h ?? (lm.type === 'arch' ? 4 : 5)) * TILE;
        const x = lm.at ? px(bx + lm.at[0]) : lx, y = lm.at ? px(by + lm.at[1]) : south ? (iy + ih) * TILE - h : iy * TILE;
        buildings.push({ id: lm.id, type: lm.type, name: lm.name, district: dist, x, y, w, h, variant: 0 });
        markBlocked(blocked, x, y, w, h);
        if (lm.spot) spots[lm.spot] = lm.at ? { x: x + w * 0.04, y: y + h * 0.06 } // on the steps at the entrance, the building's northwest tip
          : { x: lms.length > 1 ? x + w / 2 : cxp + 120, y: south ? y - 44 : y + h + 48 };
        lx += w + gap;
      }
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
      if (spec.name === 'Fifth Ave Community Garden') spots.garden = { x: cxp, y: cyp };
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
        const pool = brownstones ? BROWNSTONE_ROW : FILLER[dist];
        type = pool[Math.floor(rand() * pool.length)];
        w = Math.min(type === 'brownstone' ? 3 : 3 + Math.floor(rand() * 3), end - cursor);
        if (end - cursor - w < 3) w = end - cursor; // avoid slivers
        if (w < 3) break;
      }
      const [h0, h1] = HEIGHT[type];
      let hT = h0 + Math.floor(rand() * (h1 - h0 + 1));
      if (lm?.h) hT = lm.h; // a landmark's set height (the random draw above still happens, so the rest of the map doesn't shift)
      // Buildings yield to a diagonal avenue: get shorter, or move along the block
      const clear = (ht: number) => { for (let ty = iy + ih - ht; ty < iy + ih; ty++) for (let tx = cursor; tx < cursor + w; tx++) if (onAve(tx, ty)) return false; return true; };
      while (hT >= 3 && !clear(hT)) hT--;
      if (hT < 3) { if (lm) queue.unshift(lm); cursor++; continue; }
      const h = hT * TILE;
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
    if (queue.length) console.warn('Avenue left no room for', queue.map((q) => q.id));
    // Backyard trees & stuff in the strip above the buildings
    for (let x = ix + 1; x < end - 1; x += 3 + Math.floor(rand() * 3)) {
      const kind = spec.kind === 'lot' ? (rand() < 0.5 ? 'crate' : 'dumpster') : 'tree';
      props.push({ kind, x: px(x) + 16, y: px(iy) + 22, solid: true, variant: Math.floor(rand() * 3) });
    }
  }

  // Pave the avenues: roadway, sidewalks, and the leftover yard corners become triangle plazas
  const ROADS = new Set<number>([T.ASPHALT, T.LANE_V, T.LANE_H, T.INTERSECTION, T.CROSS_V, T.CROSS_H]);
  for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) {
    if (tiles[y][x] === T.WATER || tiles[y][x] === T.OFFMAP) continue;
    const d = aveDist(x, y);
    if (gapR(x, y) < 0) { set(x, y, T.PLAZA); continue; } // the island
    if (d <= 0) set(x, y, T.ASPHALT);
    else if (d <= SIDEWALK_W && !ROADS.has(tiles[y][x])) set(x, y, T.SIDEWALK);
    else if (d <= 4.5 && [T.YARD, T.LOT, T.CURB].includes(tiles[y][x]) && !blocked[y][x]) set(x, y, T.PLAZA);
  }
  for (let i = buildings.length - 1; i >= 0; i--) {
    const b = buildings[i];
    let hit = false;
    for (let ty = Math.floor(b.y / TILE); ty < Math.ceil((b.y + b.h) / TILE) && !hit; ty++) for (let tx = Math.floor(b.x / TILE); tx < Math.ceil((b.x + b.w) / TILE); tx++) if (aveDist(tx, ty) <= 0) { hit = true; break; }
    if (hit) { if (b.name) console.warn('Avenue runs through', b.id); else buildings.splice(i, 1); }
  }
  const clearOf = (p: PropDef) => { const tx = Math.floor(p.x / TILE), ty = Math.floor(p.y / TILE); return aveDist(tx, ty) > SIDEWALK_W && gapR(tx, ty) > GAP_CIRCLE.w + SIDEWALK_W; };
  for (let i = props.length - 1; i >= 0; i--) if (!clearOf(props[i])) props.splice(i, 1);
  for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) blocked[y][x] = false;
  for (const b of buildings) markBlocked(blocked, b.x, b.y, b.w, b.h);
  // Street names along the avenues
  for (const a of AVENUES) for (let i = 1; i < a.pts.length; i++) {
    const p = a.pts[i - 1], q = a.pts[i];
    let ang = Math.atan2(q.y - p.y, q.x - p.x); if (ang > Math.PI / 2) ang -= Math.PI; if (ang < -Math.PI / 2) ang += Math.PI;
    labels.push({ text: a.name, x: ((p.x + q.x) / 2) * TILE, y: ((p.y + q.y) / 2) * TILE + 40, angle: ang });
  }
  // Eastern Parkway: a tree-lined boulevard running east from Grand Army Plaza
  for (let x = Math.ceil(GAP_CIRCLE.x) + 2; x < I(15, 9).x; x += 3) if (x % BLOCK_W >= ROAD + 1) props.push({ kind: 'tree', x: x * TILE + 16, y: (GAP_CIRCLE.y - 3) * TILE + 20, variant: x % 3 });
  for (let i = props.length - 1; i >= 0; i--) if (!clearOf(props[i])) props.splice(i, 1);
  spots.gap = { x: GAP_CIRCLE.x * TILE, y: GAP_CIRCLE.y * TILE };
  labels.push({ text: 'Grand Army Plaza', x: (GAP_CIRCLE.x - 6.5) * TILE, y: (GAP_CIRCLE.y + GAP_CIRCLE.ay + GAP_CIRCLE.w + 2.6) * TILE }); // on the corner, off the street
  labels.push({ text: 'Eastern Pkwy', x: (I(12, 9).x + 11) * TILE, y: I(12, 9).y * TILE + 40 });

  // The Brooklyn Bridge: a deck from DUMBO north across the East River to Manhattan; the tower stands mid-river
  if (spots.bridge) {
    const bxT = Math.floor(spots.bridge.x / TILE); let y = Math.floor(spots.bridge.y / TILE) - 1, top = y;
    while (y >= 0 && tiles[y][bxT] !== T.OFFMAP) { for (let x = bxT - 1; x <= bxT + 1; x++) if (tiles[y][x] === T.WATER || ROADS.has(tiles[y][x])) set(x, y, T.PLAZA); top = y; y--; }
    spots.bridge = { x: spots.bridge.x, y: ((top + Math.floor(spots.bridge.y / TILE)) / 2) * TILE + 60 };
  }

  // Bike share docks
  const dock = (name: string, c: number, r: number, dx: number) => {
    const x = (c * BLOCK_W + ROAD + dx) * TILE, y = (r * BLOCK_H + ROAD + BLOCK_H - ROAD - 1) * TILE - 6;
    spots[name] = { x, y };
  };
  for (const [name, c, r, dx] of [['dock-downtown', 6, 5, 3], ['dock-bedstuy', 11, 6, 15], ['dock-parkslope', 7, 9, 15], ['dock-bushwick', 15, 4, 15],
    ['dock-crownheights', 12, 9, 15], ['dock-redhook', 3, 8, 15], ['dock-coney', 7, 19, 15], ['dock-flatbush', 10, 13, 3], ['dock-sunsetpark', 3, 13, 15],
    ['dock-plg', 10, 10, 15], ['dock-waterfront', 9, 2, 15], ['dock-greenpoint', 11, 0, 3], ['dock-bayridge', 1, 15, 3], ['dock-canarsie', 16, 13, 3],
    ['dock-eny', 17, 9, 3], ['dock-midwood', 8, 16, 3], ['dock-sheepshead', 11, 19, 3]] as [string, number, number, number][]) if (isLand(c, r)) dock(name, c, r, dx);
  // Vendors
  spots.churro = { x: (3 * BLOCK_W + ROAD + 8) * TILE, y: (9 * BLOCK_H + ROAD - 1) * TILE + 20 }; // Red Hook, by the ballfields
  spots.halal = { x: spots.plazaSpawn.x - 90, y: spots.plazaSpawn.y + 70 }; // west side of the plaza, clear of Flatbush
  props.push({ kind: 'cart', x: (BLOCK_W * 9 - 2) * TILE, y: (BLOCK_H * 10 + 9) * TILE, variant: 1, solid: true }); // west edge of Prospect Park
  props.push({ kind: 'truck', x: (BLOCK_W * 12 + 10) * TILE, y: (BLOCK_H * 8 + ROAD + 14) * TILE + 24, solid: true }); // Crown Heights

  spots.playerStart = spots.plazaSpawn;
  // Every named building gets a front-door spot `lm_<id>` (missions can send you there): the nearest open,
  // walkable tile below the middle of its south side
  const open = (tx: number, ty: number) => ty >= 0 && tx >= 0 && ty < tiles.length && tx < tiles[0].length && WALKABLE.has(tiles[ty][tx]) && !blocked[ty][tx];
  for (const b of buildings) {
    if (!b.name || b.id.startsWith('shed-')) continue;
    const cx = Math.floor((b.x + b.w / 2) / TILE), by0 = Math.floor((b.y + b.h) / TILE);
    found: for (let r = 0; r < 8; r++) for (let dx = 0; dx <= r; dx++) for (const sx of dx ? [dx, -dx] : [0]) {
      const tx = cx + sx, ty = by0 + r;
      if (open(tx, ty)) { spots[`lm_${b.id}`] = { x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 }; break found; }
    }
  }
  const avenues = AVENUES.map((a) => ({ name: a.name, hw: a.hw * TILE, pts: a.pts.map((p) => ({ x: p.x * TILE, y: p.y * TILE })) }));
  // ---------- Parks with character (drawn in src/world/parks.ts) ----------
  const px = (tx: number) => tx * TILE;
  const spotTaken = (x: number, y: number) => Object.values(spots).some((p) => Math.abs(p.x - px(x) - 16) < 48 && Math.abs(p.y - px(y) - 16) < 48);
  const cellPx = (c: number, r: number, fx: number, fy: number) => ({ x: px(c * BLOCK_W + ROAD + fx * (BLOCK_W - ROAD)), y: px(r * BLOCK_H + ROAD + fy * (BLOCK_H - ROAD)) });
  spots.bandshell = cellPx(8, 11, 0.3, 0.32);  // Lena Horne Bandshell, west side of Prospect Park near Prospect Park West
  spots.gwgate = cellPx(5, 12, 0.5, 0.06);     // Green-Wood's main gate, at the cemetery's north edge (5th Ave & 25th St)
  spots.battlehill = cellPx(5, 13, 0.55, 0.45); // Battle Hill: Minerva, saluting the Statue of Liberty
  spots.carousel = cellPx(6, 3, 0.25, 0.25);   // Jane's Carousel, DUMBO waterfront
  spots.bbg = cellPx(11, 10, 0.5, 0.5);
  // LIU Brooklyn's soccer field (Willoughby St & Ashland Pl): Fort Greene's block keeps only Brooklyn Org and the field.
  // The row's filler buildings are generated as usual (so the random sequence and the rest of the map don't change)
  // and then cleared here; the pitch runs north-south in the open ground east of Brooklyn Org.
  {
    const ix = 8 * BLOCK_W + ROAD, iy = 5 * BLOCK_H + ROAD, iw = BLOCK_W - ROAD, ih = BLOCK_H - ROAD;
    for (let i = buildings.length - 1; i >= 0; i--) {
      const b = buildings[i]; if (b.name || !String(b.id).startsWith('b-8-5-')) continue;
      for (let ty = Math.floor(b.y / TILE); ty < Math.ceil((b.y + b.h) / TILE); ty++) for (let tx = Math.floor(b.x / TILE); tx < Math.ceil((b.x + b.w) / TILE); tx++) blocked[ty][tx] = false;
      buildings.splice(i, 1);
    }
    const org = buildings.find((b) => b.id === 'bkorg');
    const x0 = org ? Math.ceil((org.x + org.w) / TILE) + 1 : ix + 1, x1 = ix + iw - 2, y0 = iy + 1, y1 = iy + ih - 2;
    if (x1 - x0 >= 5) {
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, T.GRASS);
      for (let i = props.length - 1; i >= 0; i--) { const tx = Math.floor(props[i].x / TILE), ty = Math.floor(props[i].y / TILE); if (tx >= x0 - 1 && tx <= x1 + 1 && ty >= y0 - 1 && ty <= y1 + 1) props.splice(i, 1); }
      spots.liufield_tl = { x: px(x0), y: px(y0) }; spots.liufield_br = { x: px(x1 + 1), y: px(y1 + 1) };
      spots.liufield = { x: px((x0 + x1 + 1) / 2), y: px(y1 + 1) + 8 };
      labels.push({ text: 'LIU BROOKLYN FIELD', x: px((x0 + x1 + 1) / 2), y: px(y0) - 6 });
    }
  }
  // Brooklyn College (Midwood): the athletic field with its running track on the west side of the campus, the quad east
  {
    const ix = 11 * BLOCK_W + ROAD, iy = 16 * BLOCK_H + ROAD, ih = BLOCK_H - ROAD;
    const x0 = ix + 1, x1 = ix + 10, y0 = iy + 4, y1 = iy + 10; // the track and pitch run east-west, like the real one
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, T.GRASS);
    for (let i = props.length - 1; i >= 0; i--) { const tx = Math.floor(props[i].x / TILE), ty = Math.floor(props[i].y / TILE); if (tx >= x0 - 1 && tx <= x1 + 1 && ty >= y0 - 1 && ty <= y1 + 1) props.splice(i, 1); }
    spots.bcfield_tl = { x: px(x0), y: px(y0) }; spots.bcfield_br = { x: px(x1 + 1), y: px(y1 + 1) };
    spots.bcfield = { x: px((x0 + x1 + 1) / 2), y: px(y1 + 1) + 8 };
    spots.bkcollege = { x: px(ix + 15), y: px(iy + 9) }; // the quad, east of the field: La Guardia Hall's clock tower
  }
  // Brooklyn Bridge Park's piers, DUMBO down to Atlantic Ave, built out over the East River
  const PIERS: [string, T][] = [['PIER 1', T.GRASS], ['PIER 2', T.COURT], ['PIER 3', T.GRASS], ['PIER 4', T.SAND], ['PIER 5', T.GRASS], ['PIER 6', T.PLAZA]];
  PIERS.forEach(([name, surface], i) => {
    const y0 = 3 * BLOCK_H + 4 + i * 9, mid = y0 + 2;
    let xs = -1;
    for (let x = 8 * BLOCK_W; x > 0; x--) if (tiles[mid]?.[x] === T.WATER) { xs = x; break; }
    if (xs < 0) return;
    let built = 0;
    for (let y = y0; y < y0 + 5; y++) for (let x = xs - 12; x <= xs; x++) {
      if (tiles[y]?.[x] !== T.WATER) continue;
      const edge = y === y0 || y === y0 + 4 || x === xs - 12;
      set(x, y, edge ? T.PLAZA : surface); built++;
    }
    if (built) { labels.push({ text: name, x: px(xs - 6), y: px(y0 + 2) + 16 }); spots[`pier${i + 1}`] = { x: px(xs - 6), y: px(y0 + 2) + 16 }; }
  });
  // Painted landmarks placed by real coordinates (src/data/landmarks.ts): open ground near the spot, clear of buildings
  const placedLm: { x: number; y: number }[] = []; // keep painted landmarks apart (Coney's five share a couple of blocks)
  for (const [key, [la, ln]] of Object.entries(PAINTED_AT)) {
    const g = geo(la, ln), cx = Math.floor(g.x), cy = Math.floor(g.y);
    const OPEN = new Set<number>([T.GRASS, T.PLAZA, T.YARD, T.LOT, T.SAND, T.SIDEWALK, T.CURB, T.COURT]);
    let best: Spot | null = null, bd = Infinity;
    for (let dy = -28; dy <= 28; dy++) for (let dx = -28; dx <= 28; dx++) {
      const x = cx + dx, y = cy + dy, k = tiles[y]?.[x];
      if (k === undefined || !OPEN.has(k) || blocked[y][x]) continue;
      // On Coney's amusement blocks the rides stand north of the boardwalk: on the ride strip, feet near its south edge
      { const bc = Math.floor(x / BLOCK_W), br = Math.floor(y / BLOCK_H); if (isAmus(bc, br) && (k !== T.LOT || y - (br * BLOCK_H + ROAD) < 5)) continue; }
      let crowd = 0;
      for (let oy = -3; oy <= 3; oy++) for (let ox = -3; ox <= 3; ox++) if (blocked[y + oy]?.[x + ox]) crowd++;
      if (placedLm.some((p) => Math.hypot(p.x - x, p.y - y) < 9)) continue;
      const d = Math.hypot(dx, dy) + crowd * 2 + (spotTaken(x, y) ? 50 : 0);
      if (d < bd) { bd = d; best = { x: px(x) + 16, y: px(y) + 16 }; }
    }
    if (best) { spots[key] = best; placedLm.push({ x: Math.floor(best.x / TILE), y: Math.floor(best.y / TILE) }); }
  }
  // Green-Wood's ghosts (src/data/ghosts.ts) drift on the cemetery's grass and paths, never out on the sidewalk
  for (const [key, [la, ln]] of Object.entries(GHOST_AT)) {
    const g = geo(la, ln), cx = Math.floor(g.x), cy = Math.floor(g.y);
    let best: Spot | null = null, bd = Infinity;
    for (let dy = -10; dy <= 10; dy++) for (let dx = -10; dx <= 10; dx++) {
      const x = cx + dx, y = cy + dy, k = tiles[y]?.[x];
      if ((k !== T.GRASS && k !== T.PLAZA) || blocked[y][x] || spotTaken(x, y) || !neighborhoodOfBlock(Math.floor(x / BLOCK_W), Math.floor(y / BLOCK_H))?.startsWith('Green-Wood')) continue;
      const d = dx * dx + dy * dy; if (d < bd) { bd = d; best = { x: px(x) + 16, y: px(y) + 16 }; }
    }
    if (best) spots[key] = best;
  }
  // Neighbors (src/data/neighbors.ts) stand on the nearest open sidewalk to where they really live
  // The coarse grid can round a real corner into the next neighborhood; these must land in their own
  const PIN: Record<string, string> = { gh_jackie: 'Crown Heights', cm_jayz: 'Bedford-Stuyvesant', cm_yasiinbey: 'Bedford-Stuyvesant', cm_chrisrock: 'Bedford-Stuyvesant', cm_rosieperez: 'Bushwick' };
  for (const [key, [la, ln]] of Object.entries({ ...NEIGHBOR_AT, ...VILLAIN_AT, ...STREET_GHOST_AT, ...CAMEO_AT })) { // villains have lairs on real corners too
    const g = geo(la, ln), cx = Math.floor(g.x), cy = Math.floor(g.y);
    let best: Spot | null = null, bd = Infinity;
    const R = PIN[key] ? 30 : 12;
    for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
      const x = cx + dx, y = cy + dy;
      const k = tiles[y]?.[x];
      if ((k !== T.SIDEWALK && k !== T.PLAZA && k !== T.SAND) || blocked[y][x] || spotTaken(x, y)) continue;
      if (PIN[key] && neighborhoodOfBlock(Math.floor(x / BLOCK_W), Math.floor(y / BLOCK_H)) !== PIN[key]) continue;
      const d = dx * dx + dy * dy + (k === T.SIDEWALK ? 0 : 60); // the boardwalk if there's no sidewalk (Brighton Beach)
      if (d < bd) { bd = d; best = { x: px(x) + 16, y: px(y) + 16 }; }
    }
    if (best) spots[key] = best;
  }
  // Floyd Bennett's runways are open concrete: no trees, lamps or benches on them
  const onRunway = (x: number, y: number) => RUNWAYS.some(([, , A, B]) => {
    const a = geo(...A), b = geo(...B), ax = a.x * TILE, ay = a.y * TILE, dx = b.x * TILE - ax, dy = b.y * TILE - ay;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(x - ax - t * dx, y - ay - t * dy) < RUNWAY_W / 2 + 18;
  });
  const keptProps = props.filter((p) => !onRunway(p.x, p.y));
  return { tiles, blocked, buildings, props: keptProps, spots, labels, avenues };
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

/** The neighborhood (or park) you're standing in, or null over water. */
export function neighborhoodAt(x: number, y: number): string | null {
  const c = Math.floor((x - ROAD * TILE / 2) / (BLOCK_W * TILE)), r = Math.floor((y - ROAD * TILE / 2) / (BLOCK_H * TILE));
  return neighborhoodOfBlock(c, r);
}
