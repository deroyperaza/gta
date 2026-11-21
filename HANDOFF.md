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

## 2. Where things stand
**Done and live**
- **The map is real Brooklyn.**
  - It's built from NYC's official neighborhood boundaries and has all 58 neighborhoods. Their parks, the East River, Newtown Creek, Jamaica Bay and the ocean are all there.
  - Manhattan and Queens show as rooftops across the water.
  - The dense core (Downtown, Fort Greene, Park Slope, Prospect Heights, Crown Heights, Bed-Stuy) uses smaller blocks, so landmarks fit near their real spots.
  - A banner shows each neighborhood's name as you walk in. The big map (M) labels all of them.
- **Painted landmarks:** the Brooklyn Bridge tower, BAM, Barclays, Borough Hall, the Williamsburgh Savings Bank, Grand Army Plaza, the Central Library, the Brooklyn Museum, Kings Theatre and the Coney Island Parachute Jump. They were painted with ChatGPT from satellite views and photos, then cut out. They live in `public/sprites/`.
- **13 missions**, each on a different civic need: mutual aid, organizing, tenants' rights, community boards, re-entry, participatory budgeting, disability access, street safety, gig work, culture, heat waves and block parties. All 13 can be played start to finish.
- **The cast:** characters based on real friends, each with a portrait, a movie-style title and a civic lesson from their real work. You're in it, as the charity soccer tournament organizer. See [docs/CAST.md](docs/CAST.md).
- **Living streets:** about 770 buildings, pedestrians, traffic that stays on real streets, bike docks and vendors.
- **On phones:** a joystick, tap-to-talk, and mission cards that fold away with a tap.

**Known rough spots**
- Most of the new neighborhoods borrow the look and chatter of the old district they belong to. For example, Bay Ridge looks like Sunset Park, and many neighborhoods have no one-liner in their banner yet.
- A few labels overlap on the big map in the dense core.
- It hasn't been tested much on real phones.

## 3. What's next (pick any)
1. **Transit.** Add subway stations you can enter and ride between, buses, and the Flatbush Ave dollar vans ("pirate buses"). Deroy's note: the dollar vans should be the illegal kind, unlicensed and cash only.
2. **Rides.** Add parody versions of Uber, Lyft and the old-school neighborhood car services, all with funny made-up names. No real company names or logos.
3. **Neighborhood character, in phases.**
   1. North Brooklyn: Greenpoint, Williamsburg, DUMBO, Fort Greene.
   2. Central and East Brooklyn.
   3. South Brooklyn.

   Each neighborhood needs its own building look, street chatter, a one-line blurb and maybe a landmark.
4. **Pocket Civics journal.** Lessons pop up as toasts but don't collect anywhere yet. Add a journal page that collects every lesson the player earns.

## 4. Code map
```
src/core/     state.ts (all game state, save/load, effects and conditions), bus.ts (events), types.ts
src/data/     npcs.ts, dialogues.ts, missions.ts, items.ts   ← most content lives here
src/data/mission-modules/   one file per mission (missions 4–13): {mission, dialogue, npcs}
src/systems/  dialogue.ts (branching dialogue), missions.ts (stages, timers, bonus objectives)
src/world/    layout.ts (map, blocks, landmarks, avenues), brooklynGrid.ts (GENERATED real-geography grid),
              golden.ts + textures.ts (procedural art)
src/entities/ traffic.ts, pedestrians.ts
src/scenes/   WorldScene.ts (Phaser world, player, interactions, painted landmarks)
src/ui/       ui.ts + style.css (HUD, dialogue, journal, map, menus)
tools/        build-grid.py (rebuilds brooklynGrid.ts from NYC Open Data neighborhood GeoJSON)
```
- **Adding a mission:** copy a file in `src/data/mission-modules/` and add it to `index.ts`. A mission is a list of stages. A target written `spot:<name>` means "walk here". Every named building has an `lm_<id>` spot at its front door.
- **Effects and conditions:** every dialogue choice, pickup and reward goes through `state.apply()`, and content is gated with `state.test()`.
- **The map:** `layout.ts` → `BLOCKS` sets what's on each block (by column,row). A block that isn't listed gets a sensible default: a park, a beach, a row of buildings or a lot. `geo(lat, lng)` converts real coordinates into map tiles.
- **Moving around while testing:** in `npm run dev`, open the browser console and run `__world.player.body.reset(x, y)` to teleport.

## 5. Publishing
Pushing to `main` on `deroyperaza/gta` builds and deploys the site automatically in about a minute (`.github/workflows/pages.yml`). Ask Deroy for access to the repo, or send changes as a pull request. To confirm a deploy went through, the `assets/index-*.js` filename on the live site should match the one in your `dist/assets/`.

## 6. House rules
- Use first names only for real people in the game and the repo.
- Real people's photos never go in the repo. Only the painted portraits do.
- Parody names for brands. No real logos.

## 7. Working with Claude Code (optional)
Open this folder in Claude Code and start with something like:
> Read HANDOFF.md and docs/CAST.md. Add subway stations on real Brooklyn geography that the player can enter and ride between.
