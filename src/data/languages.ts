/**
 * BROOKLYN'S LANGUAGES (Deroy, Nov 23 2026: "earn points for learning languages in the neighborhoods where they actually
 * exist... showing some text in those languages"). Neighbors who speak a language teach you one everyday phrase each,
 * in its own script with a pronunciation guide. Three phrases in a language and you "speak a little" of it.
 * Neighborhoods list the languages you hear on their streets; their shop signs and passersby use them too.
 *
 * Phrases are everyday greetings and thanks, the kind on any phrasebook's first page. Have a native speaker read them
 * before treating them as final. Where a city's communities write differently (Cantonese and Mandarin), the
 * characters are shared and the guide is Mandarin.
 */
export interface Phrase { text: string; say: string; en: string }
export interface Language { id: string; name: string; phrases: Phrase[]; praise: string[] }

export const LANGS: Record<string, Language> = {
  spanish: { id: 'spanish', name: 'Spanish', phrases: [
    { text: '¡Hola!', say: 'OH-lah', en: 'Hello!' },
    { text: 'Gracias', say: 'GRAH-see-ahs', en: 'Thank you' },
    { text: '¿Cómo estás?', say: 'KOH-moh ehs-TAHS', en: 'How are you?' },
  ], praise: ['¡Eso! Now say it like you mean it.', 'Perfecto. Your abuela would be proud. Mine is.', 'Look at you. Next week, the subjunctive.'] },
  haitian: { id: 'haitian', name: 'Haitian Creole', phrases: [
    { text: 'Bonjou!', say: 'bohn-ZHOO', en: 'Good morning! (Hello!)' },
    { text: 'Mèsi anpil', say: 'meh-SEE ahn-PEEL', en: 'Thank you very much' },
    { text: 'Sak pase?', say: 'sahk pah-SAY', en: 'What\'s up?' },
  ], praise: ['Bravo! And if someone says "Sak pase," you say "N ap boule."', 'Mèsi! You sound like my nephew. Almost.', 'Ou pale kreyòl! A little. That counts.'] },
  russian: { id: 'russian', name: 'Russian', phrases: [
    { text: 'Здравствуйте!', say: 'ZDRAST-vooy-tyeh', en: 'Hello! (polite)' },
    { text: 'Спасибо', say: 'spah-SEE-bah', en: 'Thank you' },
    { text: 'Как дела?', say: 'kahk dyeh-LAH', en: 'How are things?' },
  ], praise: ['Molodets! Good job. The "zdr" is the hard part.', 'Very good. Now the babushkas will sell you the good pelmeni.', 'Not bad. Your accent is from somewhere. Not here.'] },
  chinese: { id: 'chinese', name: 'Chinese', phrases: [
    { text: '你好', say: 'nee HOW (Mandarin)', en: 'Hello' },
    { text: '謝謝', say: 'shyeh-shyeh (Mandarin) · m-GOY, 唔該 (Cantonese)', en: 'Thank you' },
    { text: '吃飯了嗎？', say: 'chir FAHN luh mah', en: 'Have you eaten? (how people say "how are you")' },
  ], praise: ['Hen hao! Very good.', 'Good! Now you can order at the bakery like a regular.', 'Ha! You said it like my grandson. That is a compliment.'] },
  polish: { id: 'polish', name: 'Polish', phrases: [
    { text: 'Dzień dobry!', say: 'jen DOH-brih', en: 'Good day! (Hello!)' },
    { text: 'Dziękuję', say: 'jen-KOO-yeh', en: 'Thank you' },
    { text: 'Co słychać?', say: 'tsoh SWIH-hahch', en: 'What\'s new?' },
  ], praise: ['Bardzo dobrze! Very good.', 'Good! Now try saying it after two pierogi.', 'Better than my grandkids, and they\'re Polish.'] },
  arabic: { id: 'arabic', name: 'Arabic', phrases: [
    { text: 'مرحبا', say: 'MAR-ha-ban', en: 'Hello' },
    { text: 'شكرا', say: 'SHOOK-ran', en: 'Thank you' },
    { text: 'كيف حالك؟', say: 'kayf HAA-lak', en: 'How are you?' },
  ], praise: ['Mumtaz! Excellent.', 'Very good. Next time, tea. You can\'t say no.', 'Ahsant! You learn fast.'] },
  bengali: { id: 'bengali', name: 'Bengali', phrases: [
    { text: 'আদাব', say: 'AH-dahb', en: 'Hello (polite)' },
    { text: 'ধন্যবাদ', say: 'DHON-noh-bahd', en: 'Thank you' },
    { text: 'কেমন আছেন?', say: 'KEH-mohn AH-chhen', en: 'How are you?' },
  ], praise: ['Khub bhalo! Very good.', 'Good! The aunties on Church Avenue will be impressed.', 'Perfect. Now you have to stay for dinner.'] },
  urdu: { id: 'urdu', name: 'Urdu', phrases: [
    { text: 'آداب', say: 'AH-daab', en: 'Hello (polite)' },
    { text: 'شکریہ', say: 'SHOOK-ree-ah', en: 'Thank you' },
    { text: 'آپ کیسے ہیں؟', say: 'aap KAY-say hain', en: 'How are you?' },
  ], praise: ['Bohat khoob! Very good.', 'Shabash! Coney Island Avenue approves.', 'Good. Next lesson comes with chai.'] },
  yiddish: { id: 'yiddish', name: 'Yiddish', phrases: [
    { text: 'שלום־עליכם', say: 'SHO-lem a-LAY-khem', en: 'Hello (peace be with you)' },
    { text: 'אַ דאַנק', say: 'ah DAHNK', en: 'Thank you' },
    { text: 'װאָס מאַכסטו?', say: 'vos MAKH-stu', en: 'How are you doing?' },
  ], praise: ['Gut! Very good.', 'A mechaye! A pleasure to hear.', 'Nu, look at you. A regular mensch.'] },
  italian: { id: 'italian', name: 'Italian', phrases: [
    { text: 'Buongiorno!', say: 'bwohn-JOR-noh', en: 'Good morning! (Hello!)' },
    { text: 'Grazie', say: 'GRAHT-see-eh', en: 'Thank you' },
    { text: 'Come stai?', say: 'KOH-meh STY', en: 'How are you?' },
  ], praise: ['Bravo! Now with your hands.', 'Perfetto. My nonna would give you a cannoli.', 'Good! You almost sound like 18th Avenue in 1975.'] },
};

/** The languages you hear on each neighborhood's streets (passersby, shop signs) */
export const HOOD_LANGS: Record<string, string[]> = {
  'Greenpoint': ['polish'], 'Bushwick': ['spanish'], 'East Williamsburg': ['spanish'], 'Williamsburg': ['spanish'], 'South Williamsburg': ['yiddish', 'spanish'],
  'Sunset Park': ['spanish', 'chinese'], 'Brighton Beach': ['russian'], 'Sheepshead Bay': ['russian', 'chinese'], 'Coney Island': ['russian', 'spanish'],
  'Bensonhurst': ['chinese', 'italian', 'russian'], 'Bath Beach': ['chinese', 'italian'], 'Dyker Heights': ['italian', 'chinese'], 'Homecrest': ['chinese', 'russian'], 'Gravesend': ['italian', 'russian'],
  'Bay Ridge': ['arabic'], 'Fort Hamilton': ['arabic'], 'Kensington': ['bengali', 'urdu'], 'Midwood': ['urdu', 'yiddish', 'russian'], 'Borough Park': ['yiddish'],
  'Crown Heights': ['haitian', 'yiddish'], 'Flatbush': ['haitian', 'spanish'], 'East Flatbush': ['haitian'], 'Canarsie': ['haitian'], 'Flatlands': ['haitian'],
  'Prospect Lefferts Gardens': ['haitian'], 'Ditmas Park': ['haitian', 'bengali'], 'East New York': ['spanish'], 'Cypress Hills': ['spanish', 'bengali'], 'City Line': ['bengali', 'spanish'],
  'Red Hook': ['spanish'], 'Brownsville': ['spanish'], 'Carroll Gardens': ['italian'],
};

/** Shop signs in the neighborhood's language, by kind of shop (storefronts.ts) */
export const SIGN_WORDS: Record<string, Record<string, string>> = {
  spanish: { cafe: 'CAFETERÍA', nails: 'UÑAS', deli: 'SUPERMERCADO', bakery: 'PANADERÍA', pharmacy: 'FARMACIA', laundromat: 'LAVANDERÍA', barber: 'BARBERÍA', beauty: 'SALÓN DE BELLEZA', hardware: 'FERRETERÍA', cleaners: 'TINTORERÍA' },
  chinese: { cafe: '咖啡店', cleaners: '乾洗', deli: '超市', bakery: '餅家', pharmacy: '藥房', dimsum: '茶樓', chinese: '小館', barber: '理髮店', nails: '美甲', laundromat: '洗衣店', beauty: '美容院' },
  russian: { cafe: 'КАФЕ', beauty: 'САЛОН КРАСОТЫ', nails: 'МАНИКЮР', deli: 'ПРОДУКТЫ', bakery: 'ПЕКАРНЯ', pharmacy: 'АПТЕКА', russian: 'ГАСТРОНОМ', cleaners: 'ХИМЧИСТКА', barber: 'ПАРИКМАХЕРСКАЯ' },
  polish: { cafe: 'KAWIARNIA', cleaners: 'PRALNIA', beauty: 'SALON PIĘKNOŚCI', deli: 'DELIKATESY', bakery: 'PIEKARNIA', pharmacy: 'APTEKA', barber: 'FRYZJER' },
  arabic: { cafe: 'مقهى', beauty: 'صالون', deli: 'بقالة', bakery: 'مخبز', halal: 'مطعم', pharmacy: 'صيدلية', barber: 'حلاق' },
  bengali: { cafe: 'চায়ের দোকান', beauty: 'বিউটি পার্লার', deli: 'মুদি দোকান', halal: 'রেস্তোরাঁ', bakery: 'মিষ্টি ঘর', pharmacy: 'ফার্মেসি' },
  urdu: { cafe: 'چائے خانہ', pharmacy: 'دواخانہ', deli: 'کریانہ', bakery: 'بیکری', halal: 'کباب' },
  haitian: { bakery: 'BOULANJRI', caribbean: 'MANJE KREYÒL', barber: 'KOUPE CHEVE', pharmacy: 'FAMASI', beauty: 'SALON BOTE' },
  yiddish: { kosher: 'כשר', bakery: 'בעקערײַ' },
  italian: { cafe: 'CAFFÈ', pizza: 'PIZZERIA', bakery: 'PANIFICIO', deli: 'SALUMERIA' },
};

/** Which language a neighbor speaks, from the community their name comes from (blockfolk.ts) */
const HAITIAN_NAMES = ['Ms. Joseph', 'Mr. Baptiste', 'Mrs. Pierre', 'Mrs. Charles'];
const BENGALI_NAMES = ['Mr. Rahman', 'Mrs. Begum', 'Mr. Chowdhury', 'Farzana', 'Mr. Hossain', 'Kamal', 'Mr. Rahim', 'Mr. Uddin'];
const URDU_NAMES = ['Imran', 'Auntie Shirin', 'Mr. Iqbal', 'Tariq', 'Mr. Akhtar', 'Asif', 'Shahid', 'Faisal', 'Nadeem', 'Javed'];
const HASIDIC = ['Borough Park', 'South Williamsburg', 'Crown Heights', 'Midwood'];
export function langForFolk(group: string, name: string, hood: string): string | undefined {
  const is = (list: string[]) => list.some((n) => name.startsWith(n));
  switch (group) {
    case 'latino': case 'latinMen': case 'caribbeanDeli': case 'latinaVendor': return 'spanish';
    case 'caribbean': return is(HAITIAN_NAMES) ? 'haitian' : undefined; // Jamaican and Trinidadian neighbors speak English
    case 'chinese': case 'fujianMen': case 'chineseVendor': return 'chinese';
    case 'russian': return 'russian';
    case 'polish': return 'polish';
    case 'arab': case 'arabDeli': case 'egyptianCart': return 'arabic';
    case 'southasian': case 'southasianMen': return is(BENGALI_NAMES) ? 'bengali' : is(URDU_NAMES) ? 'urdu' : undefined;
    case 'jewish': return HASIDIC.includes(hood) ? 'yiddish' : undefined;
    case 'italian': return 'italian';
    default: return undefined;
  }
}
