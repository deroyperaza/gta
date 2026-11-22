/**
 * The Pocket Civics notebook: every lesson the player earns, in one line, so the hard questions later are fair.
 * Keys match the toast after "POCKET CIVICS · ". Each line restates a fact already sourced in the mission or cast file
 * that teaches it (see those files' header comments and docs/FACTS-*.md). No new claims here.
 */
export const LESSONS: Record<string, { who: string; text: string }> = {
  'COMMUNITY BOARDS': { who: 'Ms. Hattie', text: 'Brooklyn has 18 community boards of up to 50 unpaid neighbors, appointed by the Borough President. Their vote is advisory. Every meeting has a public session where anyone can speak for two minutes.' },
  'AI HIRING AUDITS': { who: 'Deroy', text: 'Local Law 144: an NYC company that screens job applicants with AI needs an independent bias audit every year, posted publicly, and must tell you beforehand. Report skips to the Department of Consumer and Worker Protection.' },
  'DIY POSTERS, POSTED LEGALLY': { who: 'Deroy', text: 'Bodega windows, laundromats and community boards, with permission. Not lampposts: in NYC that\'s against the law, with fines from $75 a poster.' },
  "THE PEOPLE'S MONEY": { who: 'Jenna', text: 'The People\'s Money: New Yorkers decide how to spend part of the city budget. Anyone 11 and up can vote, whatever their immigration status.' },
  'RIGHT TO COUNSEL': { who: 'Nell', text: 'Households at or below 200% of the federal poverty line get a free lawyer in eviction cases. Call 311 and ask for Right to Counsel before the court date.' },
  'YOUR RIGHT TO PROTEST': { who: 'Bridgette', text: 'Sidewalk protest is legal as long as people can still get by. Marching in the street needs an NYPD parade permit; a megaphone needs a sound permit from the precinct.' },
  'VOTING AFTER PRISON': { who: 'Bridgette', text: 'In New York your vote comes back the day you leave prison. The Clean Slate Act seals old convictions: 3 years after a misdemeanor, 8 after most felonies, if there\'s nothing new.' },
  'OPEN STREETS': { who: 'Adrián', text: 'Community groups, schools and merchants apply to the city\'s Department of Transportation (DOT) to close a street to cars on set days. You run it; the city backs it.' },
  'CULTURE PASS + IDNYC': { who: 'Danae', text: 'A Brooklyn Public Library card reserves free Culture Pass visits to 100+ museums, gardens and theaters. IDNYC, the free city ID, adds free one-year museum memberships.' },
  '504 RIGHTS + ASK THE FOLLOW-UP': { who: 'Naim', text: 'Section 504: public schools must give students with disabilities accommodations. It\'s a right, not a favor. And always ask the follow-up: "Okay, but when?"' },
  'BOOKS UNBANNED': { who: 'Naim', text: 'Brooklyn Public Library\'s Books Unbanned: any teen 13 to 21 in the US can get a free eCard. In NYC, teens can just get a regular card.' },
  "WHO WATCHES THE CITY'S MONEY": { who: 'Luco', text: 'The City Comptroller audits city agencies and manages the pension funds. The funds vote as shareholders, and every vote is posted on NYC Open Data.' },
  'BOOK THE FIELD': { who: 'Luco', text: 'Showing up first doesn\'t make the field yours. Book it with an NYC Parks permit; a special event permit costs $25 to process.' },
  'TESTIFY AT CITY COUNCIL': { who: 'Vega', text: 'Anyone who lives in New York City can sign up to testify at a City Council hearing, in person or in writing.' },
  'BLOCK PARTY PERMITS': { who: 'Emily', text: 'Apply online for a block party permit at least 60 days ahead. $25. Your block signs on, your community board weighs in. Nothing for sale.' },
  'PUBLIC ACCESS TV': { who: 'Jon', text: 'BRIC runs Brooklyn\'s public access channels. Residents can take media classes, borrow gear and get community shows on the air.' },
  'BLOCK PARTIES + PUBLIC ACCESS TV': { who: 'Emily and Jon', text: 'A $25 block party permit, filed 60+ days out, and a show on Brooklyn\'s public access channels through BRIC.' },
  'COOLING CENTERS': { who: 'Ms. Inez', text: 'In a heat emergency the city opens cooling centers. Find one with the online Cooling Center Finder or by calling 311, and call ahead.' },
  'COOLING CENTERS + BE A BUDDY': { who: 'Ms. Inez', text: 'Cooling centers via the Finder or 311. And be a buddy: check on older or heat-sensitive neighbors at least twice a day. Fans alone aren\'t enough in extreme heat. Heat stroke: call 911.' },
  'FAIR FARES': { who: 'Marisol', text: 'Fair Fares: half-price rides ($1.50) for New Yorkers 18 to 64 under an income limit, which rises to 200% of the poverty line on Nov 30, 2026. Apply on ACCESS HRA. After 12 paid rides in 7 days, the rest of the week is free.' },
  'BUS LANES': { who: 'Desmond', text: 'Center-running bus lanes opened on Flatbush from Livingston St to Grand Army Plaza in Nov 2026. DOT outreach has begun for Grand Army Plaza to Avenue H. Riders in the room win.' },
  'FRESH': { who: 'Ms. Celestine', text: 'FRESH gives developers extra building space and tax breaks for full-service grocery stores in underserved neighborhoods. Brownsville: about one supermarket per 15 bodegas.' },
  'HEALTH BUCKS': { who: 'Kofi', text: 'Health Bucks: a $2 coupon for every $2 of SNAP spent at NYC farmers markets, up to $10 a day ($14 from Jan 2027). GrowNYC\'s Fresh Food Box: $7 with SNAP.' },
  'COMMUNITY MEDIATION': { who: 'Nadine', text: 'Listen first, reflect back, find what people need under what they say, and write the agreement down. Free community mediation in Brooklyn: the Brooklyn Mediation Center, no lawsuit needed.' },
  'MEDIATION': { who: 'Nadine', text: 'Hear each side alone first. Ask what they need, not what they\'re against. Some things aren\'t up for negotiation, like anyone\'s right to worship.' },
  'PARTICIPATORY GRANTMAKING': { who: 'Adaeze', text: 'At Brooklyn Org, residents on an advisory council pick the grantees. A typical grant: three years of general operating support. The Spark Prize: $100K, no strings, chosen by residents.' },
  'ASK FIRST. 311 FOR OUTREACH. THE GATHERING PLACE IS OPEN 24/7.': { who: 'Mr. Lewis', text: 'Ask someone what they need instead of deciding for them. 311 can send a street outreach worker, if they want one. The Gathering Place on Atlantic Ave is open 24/7.' },
  '988: CALL OR TEXT, FREE, 24/7': { who: 'Danielle', text: '988 is free, 24/7, by call or text, for anyone in distress or worried about someone. It doesn\'t ask about immigration status.' },
  'B-HEARD AND 988': { who: 'Mr. Ali', text: 'In parts of Brooklyn, 911 can send a B-HEARD mental health team instead of police for a mental health emergency. 988 is for talking, anytime.' },
  '35 OF 156 STATIONS FULLY ACCESSIBLE': { who: 'Coach Darnell', text: 'Only 35 of Brooklyn\'s 156 subway stations are fully accessible (MTA data).' },
};
