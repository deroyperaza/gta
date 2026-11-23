/**
 * Every unnamed storefront gets a real-sounding name and a kind of business (Deroy, Nov 22 2026: "No store should just be
 * called Bodega or Boutique. They should all have names. And there should be a diverse amount of different services and
 * types of stores"). Names are invented (parody or generic): no real businesses or brands. The mix leans on each
 * neighborhood's character (Caribbean bakeries in Flatbush, taquerias and dim sum in Sunset Park, kosher bakeries in
 * Borough Park, Russian delis in Brighton Beach...). Picked deterministically per building, so a shop keeps its name.
 */
import { HOOD_LANGS, SIGN_WORDS } from './languages';

export interface StoreKind { sign: [string, string]; names: string[] }

const FIRST = ['Jose', 'Marisol', 'Kwame', 'Mei', 'Ahmed', 'Rosa', 'Tony', 'Yolanda', 'Dmitri', 'Fatima', 'Luis', 'Grace', 'Sam', 'Nadia', 'Andre', 'Lily', 'Rafael', 'Joy', 'Omar', 'Bea'];
const STREET = ['Fulton', 'Nostrand', 'Myrtle', 'Church', 'Flatbush', 'Fifth Ave', 'Knick', 'Utica', 'Court St', 'Graham', 'Kings', 'Nostrand', 'Bedford', 'Smith St'];

export const STORE_KINDS: Record<string, StoreKind> = {
  deli: { sign: ['#a8322a', '#fff7e0'], names: ['{F} DELI & GROCERY', '{S} DELI', 'BROTHERS DELI & GRILL', 'NEW STAR GROCERY', '24 HR DELI', 'GREEN APPLE DELI', 'LUCKY CORNER DELI', 'BEST BUY DELI (NOT THAT ONE)', 'GOOD NEIGHBOR GROCERY', 'TWO SISTERS DELI'] },
  barber: { sign: ['#1c1a18', '#e8e4dc'], names: ["{F}'S BARBERSHOP", 'FRESH CUTS', 'CLEAN FADE BARBERS', 'THE CHAIR', 'LINE-UP LOUNGE', 'KINGS CUTS', 'SHARP & CO. BARBERS', 'TAPER TIME'] },
  beauty: { sign: ['#ff4fa3', '#fff'], names: ['{F} BEAUTY SALON', 'CROWN & GLORY BRAIDS', 'BEAUTY SUPPLY WORLD', 'GLOW UP SALON', 'NATURAL ROOTS HAIR', 'SILK PRESS STUDIO'] },
  nails: { sign: ['#f4d6e4', '#a8325a'], names: ['LUCKY NAILS', 'PERFECT 10 NAILS', 'NAIL ART BY {F}', 'POLISHED', 'GOLDEN NAILS & SPA', 'TIP TOP NAILS'] },
  pharmacy: { sign: ['#2f5a3a', '#f4efe6'], names: ['{S} PHARMACY', 'NEIGHBORHOOD CHEMISTS', 'CARE PLUS PHARMACY', 'FAMILY DRUGS', 'GOOD HEALTH RX'] },
  hardware: { sign: ['#c9a43a', '#1c1a18'], names: ['{S} HARDWARE', 'KEYS MADE · LOCKS FIXED', 'ACE-ISH HARDWARE', 'NUTS & BOLTS', '{F}\'S PAINT & HARDWARE'] },
  laundromat: { sign: ['#f4efe6', '#1d5fae'], names: ['SUDS CITY', 'BUBBLES LAUNDROMAT', 'SPIN & GRIN', 'CLEAN MACHINE', 'WASH & FOLD BY THE POUND', 'TUMBLE INN'] },
  cleaners: { sign: ['#1d5fae', '#fff'], names: ['{F} DRY CLEANERS', 'PRESSED & READY', 'ONE HOUR CLEANERS', 'STAR TAILOR & CLEANERS'] },
  pizza: { sign: ['#2f6a3a', '#fff7e0'], names: ['{F}\'S PIZZA', 'FAMOUS ORIGINAL RAY-ISH', '2 BROS-ISH PIZZA', 'SLICE OF BROOKLYN', 'NAPOLI PIZZERIA', 'LA PIAZZA'] },
  chinese: { sign: ['#a8322a', '#f2c23a'], names: ['GOLDEN DRAGON TAKE OUT', 'NO. 1 KITCHEN', 'HAPPY GARDEN', 'NEW CHINA HOUSE', 'GREAT WALL KITCHEN', 'LUCKY STAR'] },
  caribbean: { sign: ['#2f7a3a', '#f2c23a'], names: ["{F}'S ROTI SHOP", 'ISLAND FLAVOR', 'TASTE OF TRINI', 'JERK HUT', 'KINGSTON KITCHEN', 'CARIBBEAN DELIGHT BAKERY', 'DOUBLES & MORE'] },
  taqueria: { sign: ['#e8742a', '#fff7e0'], names: ['TAQUERIA {F}', 'TACOS EL GÜERO-ISH', 'LA POBLANITA', 'TORTILLERÍA', 'EL REY DEL TACO', 'PUPUSERÍA LA ESPERANZA'] },
  dimsum: { sign: ['#a8322a', '#f4e6c8'], names: ['GOLDEN BUN BAKERY', 'EIGHTH AVE NOODLE', 'DUMPLING HOUSE', 'HONG KONG CAFÉ', 'LUCKY BAKERY', 'DIM SUM GARDEN'] },
  halal: { sign: ['#2a5a8a', '#fff'], names: ['HALAL GRILL', '{F} KEBAB HOUSE', 'YEMENI CAFÉ', 'SAHARA GRILL', 'FALAFEL KING'] },
  bakery: { sign: ['#5a3a24', '#f4e6c8'], names: ['{F}\'S BAKERY', 'SWEET RISE', 'GOLDEN CRUST', 'THE ROLLING PIN', 'BREAD & BUTTER', 'SUGAR & SPICE'] },
  kosher: { sign: ['#1f3f6a', '#f4efe6'], names: ['KOSHER BAKERY', 'CHALLAH & MORE', 'GLATT MARKET', 'RUGELACH CORNER'] },
  russian: { sign: ['#1f3f6a', '#f2c23a'], names: ['EUROPEAN DELI', 'ODESSA-ISH MARKET', 'PELMENI HOUSE', 'BLACK SEA BAKERY'] },
  italian: { sign: ['#2f6a3a', '#f4efe6'], names: ['SALUMERIA {F}', 'PASTICCERIA', 'LATTICINI FRESCHI', 'NONNA\'S PORK STORE'] },
  cafe: { sign: ['#1c1a18', '#f2c23a'], names: ['POUR DECISIONS', 'BEAN THERE', 'THE DAILY GRIND', 'BREW-KLYN', 'STEEP & STOOP', 'CAFÉ CON LECHE', 'HALF & HALF', 'OAT OF OFFICE'] },
  books: { sign: ['#4a2a6a', '#f4efe6'], names: ['STOOP BOOKS', 'NEW & USED BOOKS', 'CHAPTER & VERSE', 'THE BOOK NOOK', 'PAGE TURNERS'] },
  florist: { sign: ['#f4efe6', '#2f7a3a'], names: ['{F}\'S FLOWERS', 'IN BLOOM', 'PETAL PUSHERS', 'STEM & STOOP'] },
  taxes: { sign: ['#f4efe6', '#1c1a18'], names: ['TAX · NOTARY · FAX', 'MULTI-SERVICES', 'INCOME TAX · IMMIGRATION FORMS', 'TRAVEL · MONEY TRANSFER'] },
  phones: { sign: ['#1c1a18', '#4ad6e6'], names: ['PHONE REPAIR · CASES', 'CELL CITY', 'WIRELESS & MORE', 'SCREEN FIXED 1 HR'] },
  dollar: { sign: ['#c9a43a', '#a8322a'], names: ['99¢ & UP', 'DOLLAR DREAMS', 'EVERYTHING $1.99', 'BARGAIN CITY'] },
  thrift: { sign: ['#7b3fe4', '#fff'], names: ['SECOND CHANCE THRIFT', 'VINTAGE-ISH', 'THE RACK', 'GOODWILL HUNTING (FOR DEALS)'] },
  bikes: { sign: ['#2fd1c5', '#1c1a18'], names: ['SPOKE & WHEEL', 'FLAT FIXED', 'BED-STUY BIKES', 'CHAIN REACTION'] },
  records: { sign: ['#1c1a18', '#ff4fa3'], names: ['WAX POETIC RECORDS', 'CRATE DIGGERS', 'B-SIDE RECORDS'] },
  botanica: { sign: ['#4a2a6a', '#f2c23a'], names: ['BOTÁNICA SAN MIGUEL-ISH', 'BOTÁNICA LA FE', 'CANDLES & HERBS'] },
  clinic: { sign: ['#f4efe6', '#2a5a8a'], names: ['FAMILY DENTAL', 'COMMUNITY HEALTH CENTER', 'EYE CARE · GLASSES', 'URGENT CARE-ISH'] },
  boutique: { sign: ['#f4efe6', '#a8322a'], names: ['THREADS', 'STOOP STYLE', 'THE CLOSET', 'MAIN CHARACTER BOUTIQUE', 'LOCAL MAKERS SHOP'] },
};

const ALL = Object.keys(STORE_KINDS);
const MIX: Record<string, string[]> = {
  flatbush: ['caribbean', 'caribbean', 'bakery', 'deli', 'barber', 'beauty', 'pharmacy', 'taxes', 'phones', 'laundromat', 'chinese', 'dollar', 'clinic', 'botanica'],
  plg: ['caribbean', 'cafe', 'deli', 'barber', 'beauty', 'laundromat', 'pharmacy', 'florist', 'books'],
  crownheights: ['caribbean', 'deli', 'barber', 'beauty', 'kosher', 'bakery', 'laundromat', 'cafe', 'pharmacy', 'records'],
  bedstuy: ['deli', 'barber', 'beauty', 'cafe', 'caribbean', 'laundromat', 'books', 'thrift', 'records', 'pharmacy', 'chinese', 'florist'],
  bushwick: ['deli', 'taqueria', 'cafe', 'thrift', 'records', 'laundromat', 'barber', 'bikes', 'botanica', 'pizza', 'phones'],
  parkslope: ['cafe', 'cafe', 'books', 'florist', 'bakery', 'pizza', 'boutique', 'bikes', 'pharmacy', 'cleaners', 'italian'],
  sunsetpark: ['taqueria', 'taqueria', 'dimsum', 'dimsum', 'bakery', 'deli', 'phones', 'taxes', 'laundromat', 'pharmacy', 'botanica', 'halal'],
  coneyisland: ['russian', 'russian', 'pizza', 'deli', 'bakery', 'pharmacy', 'nails', 'laundromat', 'kosher', 'dollar'],
  redhook: ['deli', 'taqueria', 'pizza', 'cafe', 'hardware', 'laundromat', 'caribbean'],
  waterfront: ['cafe', 'cafe', 'bakery', 'records', 'thrift', 'boutique', 'pizza', 'books', 'kosher', 'bikes'],
  downtown: ['cafe', 'halal', 'pharmacy', 'phones', 'cleaners', 'deli', 'pizza', 'taxes', 'nails', 'clinic'],
};
const HOOD_MIX: Record<string, string[]> = {
  'Borough Park': ['kosher', 'kosher', 'bakery', 'pharmacy', 'hardware', 'cleaners', 'books'],
  'Brighton Beach': ['russian', 'russian', 'russian', 'bakery', 'pharmacy', 'phones'],
  'Bay Ridge': ['halal', 'italian', 'pizza', 'bakery', 'cafe', 'deli', 'pharmacy', 'nails'],
  'Bensonhurst': ['italian', 'italian', 'dimsum', 'pizza', 'bakery', 'deli', 'pharmacy'],
  'Dyker Heights': ['italian', 'pizza', 'bakery', 'deli', 'pharmacy'],
  'Williamsburg': ['cafe', 'records', 'thrift', 'boutique', 'kosher', 'bakery', 'bikes', 'books'],
  'South Williamsburg': ['kosher', 'kosher', 'bakery', 'hardware', 'cleaners'],
  'Greenpoint': ['bakery', 'deli', 'cafe', 'records', 'thrift', 'florist'],
  'Sheepshead Bay': ['russian', 'pizza', 'dimsum', 'bakery', 'pharmacy', 'deli'],
  'Homecrest': ['dimsum', 'russian', 'pharmacy', 'bakery', 'deli'],
  'Midwood': ['kosher', 'halal', 'bakery', 'pharmacy', 'pizza', 'books'],
  'Canarsie': ['caribbean', 'caribbean', 'bakery', 'barber', 'beauty', 'pharmacy', 'taxes'],
  'East Flatbush': ['caribbean', 'caribbean', 'bakery', 'barber', 'beauty', 'botanica', 'taxes'],
};

function hash(s: string) { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; }

/** A name and sign colors for an unnamed storefront. */
export function storefrontFor(buildingId: string, district: string, hood: string | null, used?: Set<string>): { name: string; sign: [string, string]; kind: string } {
  const h0 = hash(buildingId);
  const mix = (hood && HOOD_MIX[hood]) || MIX[district] || ALL;
  let out = { name: '', sign: ['#1c1a18', '#f4efe6'] as [string, string], kind: '' };
  for (let k = 0; k < 40; k++) { // the same name twice on one map feels like a chain: try the next one
    const h = hash(`${buildingId}:${k}`) ^ h0;
    const kindId = mix[(h0 + k) % mix.length], kind = STORE_KINDS[kindId];
    const tpl = kind.names[(h >>> 8) % kind.names.length];
    out = { name: tpl.replace('{F}', FIRST[(h >>> 4) % FIRST.length].toUpperCase()).replace('{S}', STREET[(h >>> 12) % STREET.length].toUpperCase()), sign: kind.sign, kind: kindId };
    if (!used || !used.has(out.name)) break;
  }
  used?.add(out.name);
  // In neighborhoods with their own languages, most signs are in them (ПЕКАРНЯ, 餅家, PIEKARNIA...).
  // Generic words like "bakery" repeat on real streets too, so these don't need to be unique.
  const langs = hood ? HOOD_LANGS[hood] : undefined;
  if (langs && (h0 >>> 3) % 3 !== 0) { // about two in three
    for (let k = 0; k < langs.length; k++) { const word = SIGN_WORDS[langs[((h0 >>> 5) + k) % langs.length]]?.[out.kind]; if (word) return { ...out, name: word }; }
  }
  return out;
}
