# HANDOFF: GATHER AND TAKE ACTION (Brooklyn)

For Luco, from Deroy. Updated Nov 21, 2026.

An open-world satirical organizing game you play in the browser. It has Grand Theft Auto energy, except the crimes are mutual aid. It's built with TypeScript, Phaser 3.80 and Vite. Most of the art is drawn in code. There are no paid services and no API keys.

- **Play it:** https://deroyperaza.github.io/gta/
- **Code:** https://github.com/deroyperaza/gta (public)

## 1. Get it running
1. Install **Node.js 20 or 22 LTS** from https://nodejs.org.
2. Unzip this package, or clone the repo with `git clone https://github.com/deroyperaza/gta.git`. Then open a terminal in that folder.
3. Install dependencies, once: `npm install`
4. Start the game: `npm run dev`, then open http://localhost:5173
5. Check your work: `npm run typecheck` checks the code, and `npm run build` builds the production version into `dist/`.

The zip leaves out `node_modules/` and `dist/`. `npm install` and `npm run build` recreate them. It also leaves out `style-study/`, the folder of art-direction mood boards and portrait drafts. Those are in the repo if you want them.

## 2. Where things stand (Nov 22, 2026)
**The world**
- The map is real Brooklyn: all 58 neighborhoods from NYC's official boundaries, the parks, the water, brownstone rows where Brooklyn has brownstones, and crowds of people that gather wherever you are.
- **Transit:** all 156 subway stations (MTA data) with a route planner, five real bus routes, illegal dollar vans on Flatbush, and parody ride apps (Surge, Shlep, Ever-Ready Car Service) that cost Solidarity.
- **Traffic** includes police cars and ambulances, some on calls with flashing lights.
- **Painted landmarks** (ChatGPT, keyed): Barclays, Borough Hall, the Library, the Museum, Grand Army Plaza, BAM, the Savings Bank, the Brooklyn Bridge tower, the Lena Horne Bandshell, Green-Wood's gate, Jane's Carousel, the Botanic Garden conservatory, Brooklyn College, and Coney Island (Cyclone, Luna Park, Wonder Wheel, Maimonides Park, Aquarium). More are being painted.
- **Fields and courts:** LIU's and Brooklyn College's soccer fields, real basketball court markings.

**What you do**
- **20 main missions** on real civic needs (mutual aid, tenants, transit, food access, mediation, Brooklyn Org's grantmaking, older adults, environmental justice, racial justice...), plus 4 **mediation calls** you pick up from neighbors.
- **Difficulty** ramps: Attention is a 0–5 star wanted level; the Free Parking Caucus chases harder, undoes your work from Mission 7, and weak results cost Trust.
- **Conversations test what you learned:** wrong answers are plausible near-misses, and the **Pocket Civics notebook** (journal) keeps every lesson.
- **Six villains** with lairs (Baron Von Rent, Captain Red Tape, The Rumor Mill, Count Carbon, The Data Broker, the Ghost of Al Capone): beat them with what you learned.
- **Ghosts** (translucent, glowing): Green-Wood's residents (Tweed, Greeley, Bernstein, Basquiat, Tiffany, McKinney Steward, Ebbets, Chadwick, Beecher, Clinton, Morse) and Brooklyn's own (Jackie Robinson, Walt Whitman, Shirley Chisholm, Lena Horne, The Notorious B.I.G., Ruth Bader Ginsburg, Adam Yauch).
- **Living icons as cameos**, facts only: they speak only their own verified, non-lyric words (Spike Lee, Carmelo Anthony, Rosie Perez, Yasiin Bey, Chris Rock, Barbra Streisand, Jay-Z, Bernie Sanders, Mel Brooks).
- **Naim's dragon:** answer his question right and fly for 30 seconds.
- **Brooklyn Org** appears as the convener in Missions 17–20 (participatory grantmaking, then older adults, environmental justice and the Spark Prize), and every mission's results name the real Brooklyn Org grantees doing that work.

**Known rough spots**
- Not played start to finish by hand; many systems were tested with scripts.
- Some newer neighborhoods still borrow their district's look and street chatter.

## 3. What's next (pick any)
1. **More painted landmarks:** the Verrazzano, Dyker Heights lights, Domino, McCarren Pool, Sheepshead Bay, Canarsie Pier, Floyd Bennett Field, the Army Terminal, Weeksville, the Prison Ship Martyrs' Monument, the Navy Yard, Erasmus Hall (references and facts are in `docs/FACTS-landmarks-jackie-whitman.md`).
2. **An election arc:** a City Council race where everything you've built counts on election day.
3. **Neighborhood character:** each neighborhood its own buildings, chatter and one-line blurb.

## House rules (read before adding content)
- **Facts are sourced.** Every civic fact in the game has a source in a file's header or in `docs/FACTS-*.md`. Don't add a claim you can't source.
- **Landmarks are painted in ChatGPT**, never drawn in code (pipeline: satellite + Google 3D + street photo references, magenta background, keyed with a script; check each render against the references).
- **Real people:** ghosts and cameos say only verified, non-lyric words; no song lyrics anywhere. Living people get no invented opinions.
- **Parody names for brands.** First names only for real friends in the cast.

## 4. Code map
```
src/core/     state.ts (all game state, save/load, effects and conditions), bus.ts (events), types.ts
src/data/     npcs.ts, dialogues.ts, missions.ts, items.ts   ← most content lives here
src/data/mission-modules/   one file per mission (missions 4–20, plus the mediation calls): {mission, dialogue, npcs}
src/systems/  dialogue.ts (branching dialogue), missions.ts (stages, timers, bonus objectives)
src/world/    layout.ts (map, blocks, landmarks, avenues), brooklynGrid.ts (GENERATED real-geography grid),
              golden.ts + textures.ts (procedural art)
src/entities/ traffic.ts, pedestrians.ts
src/scenes/   WorldScene.ts (Phaser world, player, interactions, painted landmarks)
src/ui/       ui.ts + style.css (HUD, dialogue, journal, map, menus)
tools/        build-grid.py (rebuilds brooklynGrid.ts from NYC Open Data neighborhood GeoJSON), build-transit.py (subway stations)
src/data/     neighbors.ts, ghosts.ts, villains.ts, cameos.ts (people on the street), landmarks.ts (painted landmarks by coordinates),
              lessons.ts (Pocket Civics notebook), grantees.ts (Brooklyn Org grantees per mission)
src/entities/ transit.ts (subway, buses, vans, ride apps), opposition.ts (the Caucus, wreckers)
src/world/    parks.ts (parks, fields, placed landmarks)
```
- **Adding a mission:** copy a file in `src/data/mission-modules/` and add it to `index.ts`. A mission is a list of stages. A target written `spot:<name>` means "walk here". Every named building has an `lm_<id>` spot at its front door.
- **Effects and conditions:** every dialogue choice, pickup and reward goes through `state.apply()`, and content is gated with `state.test()`.
- **The map:** `layout.ts` → `BLOCKS` sets what's on each block (by column,row). A block that isn't listed gets a sensible default: a park, a beach, a row of buildings or a lot. `geo(lat, lng)` converts real coordinates into map tiles.
- **Moving around while testing:** in `npm run dev`, open the browser console and run `__world.player.body.reset(x, y)` to teleport.

## 5. Publishing
Pushing to `main` on `deroyperaza/gta` builds and deploys the site automatically in about a minute (`.github/workflows/pages.yml`). Ask Deroy for access to the repo, or send changes as a pull request. To confirm a deploy went through, the `assets/index-*.js` filename on the live site should match the one in your `dist/assets/`.

## 6. Working with Claude Code (optional)
Open this folder in Claude Code and start with something like:
> Read HANDOFF.md and docs/CAST.md. Add subway stations on real Brooklyn geography that the player can enter and ride between.
