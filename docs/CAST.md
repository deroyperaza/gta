# The cast

TL;DR: eleven characters based on real friends and family. Each one has a painted portrait, a movie-style title and one civic lesson that matches their real work. Every lesson was checked against an official source on Nov 20, 2026. The cast sheet is `style-study/ai-portraits/v2/cast-titles.jpg`.

| Title | Character | Neighborhood | Real work (short) | Lesson | Toast |
|---|---|---|---|---|---|
| The Storyteller | Deroy | Bed-Stuy | Branding studio for mission-driven groups | Narrative change ("one person, one stake, one ask") + NYC Local Law 144: AI hiring tools need a yearly independent bias audit, a public summary and notice to candidates | AI HIRING AUDITS |
| The Gatherer | Jenna | Bed-Stuy | Leadership coach and facilitator | One-on-ones before meetings + The People's Money: citywide participatory budgeting; anyone 11 and up votes, regardless of immigration status | THE PEOPLE'S MONEY |
| The Counsel | Nell | PLG | Tenant-side housing lawyer | Right to Counsel in Housing Court (household income at or below 200% of the federal poverty line) + asking the state housing agency (HCR) for your rent history | RIGHT TO COUNSEL |
| The Defender | Bridgette | Downtown | Former public defender, teaches criminal defense | Voting rights come back on release from prison, even on parole (2021) + Clean Slate sealing (misdemeanors after 3 years, most felonies after 8; automatic by Nov 2027) | VOTING AFTER PRISON |
| The Architect | Adrián | Park Slope | Designs public spaces | Open Streets: groups apply to NYC DOT to close a street to cars; applications open each fall | OPEN STREETS |
| The Curator | Danae | Park Slope | Museum exhibition director | Culture Pass (free museum passes with a library card) + IDNYC free museum memberships | CULTURE PASS + IDNYC |
| The Editor | Jon | Bushwick | Film editor | BRIC: Brooklyn's public access TV, with classes, gear and community shows | PUBLIC ACCESS TV |
| The Showstopper | Emily | Coney Island boardwalk | Creative director for showpiece cakes | Block party permits: apply online at least 60 days ahead, $25, neighbors sign on, community board reviews | BLOCK PARTY PERMITS |

| The Keeper | Naim | Crown Heights | Calls his ADHD a superpower; student disability and disability-ally clubs; pressed then-Comptroller Brad Lander on school elevators | Section 504 requires public schools to give students with disabilities accommodations + ask the follow-up ("Okay, but when?"); Books Unbanned as a side lesson | 504 RIGHTS + ASK THE FOLLOW-UP |
| The Dealmaker | Luco | Downtown | Organizes charity soccer tournaments; vibe-codes games; the business of soccer; stocks | Book city fields with an NYC Parks permit ($25 to process a special event permit) + the City Comptroller audits agencies and advises the city pension funds, which vote as shareholders; every vote is on NYC Open Data | WHO WATCHES THE CITY'S MONEY |
| The Choreographer | Vega | Bushwick | Dancer, artist, free spirit | Any NYC resident can sign up to testify at a City Council hearing, in person or in writing | TESTIFY AT CITY COUNCIL |

Deroy also teaches **DIY poster making** (big words; what, when, where; loud contrast; wheatpaste is flour and water). Post with permission in bodega windows, laundromats and community boards, never on lampposts: NYC Admin Code 10-119, with fines from $75.

## The Under-18 Crew
Vega, Naim and Luco are also Mission 3 allies, each bringing a different crowd: Vega's dance class and families (+8), Naim's disability-ally club with an accessible route (+6), Luco's tournament teams (+12). Each kid also teaches how to bring others in: make it fun (Vega), start a club and ask the kid alone at lunch first (Naim), give everyone a job (Luco).

## The Free Parking Caucus (obstacles)
Satirical obstructionists (red caps, clipboards) who spawn between you and your objective during missions. They chase at 170 (walk 150, sprint 245, bike 330). Getting caught costs about 2 seconds, flyers or a poster, and during the march a marcher. Three ways past:
- **Outrun them** with Shift or a bike.
- **Outnumber them** with 6+ marchers.
- **Out-argue them** with E. Each debate is answered by a real fact from this table.

## Mission 3: The People vs. the Power
Gary needs a crowd to vote no on Line 47 (fridge grants, library Sundays and tenant lawyers cut to fund a gazebo). You recruit 3 of 5 allies (Dee, Nell, Jenna, Juni, Jon) and 8 neighbors, who follow you after taking a flyer. Bridgette briefs you on protest rights (NYCLU: sidewalks need no permit, street marches need an NYPD parade permit, amplified sound needs a precinct sound permit). Then two flashpoints (Tyler, Skye and an officer) and a speech. Tension at 3 means it boiled over: you retry with allies kept. The outcome depends on crowd size and spirit.

Community boards (Brooklyn's 18 boards, up to 50 members each, appointed by the Borough President, with a public session at every meeting) moved to **Ms. Hattie**. They appear as a choice after her circle mission.

## Sources checked (Nov 20, 2026)
- Local Law 144: nyc.gov DCWP "Automated Employment Decision Tools"; NY State Comptroller audit (Dec 2025)
- Right to Counsel: NYC Independent Budget Office; Legal Services NYC
- Voting after prison: NY State Board of Elections, "Voting After Incarceration"
- Clean Slate: nycourts.gov/cleanslate; cleanslateny.org
- The People's Money: nyc.gov Civic Engagement Commission
- Culture Pass / IDNYC: culturepass.nyc; nyc.gov/idnyc
- Open Streets: nyc.gov/openstreets
- Block parties: nyc.gov CECM permit types; Brooklyn CB6 and CB9 guidance

## Where things live
- Dialogue: `src/data/dialogues.ts` (one block per character, each ending in a `POCKET CIVICS` toast)
- Titles, bios, idle lines: `src/data/npcs.ts`
- Portraits used in the game: `public/portraits/<id>.jpg` (480×600)
- Full-size portraits and alternates: `style-study/ai-portraits/v2/`

## How the portraits were made
- Generated in ChatGPT through Claude in Chrome. Each prompt combined a photo of the person with the game's ink-and-cel style: looking at the camera, golden hour, and a different everyday Brooklyn backdrop each (not all brownstones).
- **Lesson learned:** to fix one feature, attach the approved image and ask to edit only that feature ("keep the face pixel-identical"). Swapping a face onto a new image drifts the likeness. Jenna's final portrait was made this way.
- Captured at 964×1204, then resized to 480×600 for the game.

## Privacy
This repo is public. Keep surnames, employers and contact details out of the code and docs; first names and roles only.
