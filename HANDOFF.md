# HANDOFF: GATHER AND TAKE ACTION (Edition L, Brooklyn)

An open-world satirical organizing game, playable in the browser. Built with TypeScript, Phaser 3.80 and Vite. All art is drawn in code, so there are no image assets, paid services or API keys.

## 1. Setup on a new computer
1. Install **Node.js 20 or 22 LTS** from https://nodejs.org (Mac or Windows).
2. Unzip this package and open a terminal in the folder.
3. Install dependencies once: `npm install`
4. Play: `npm run dev`, then open http://localhost:5173
5. Other commands: `npm run build` creates the production bundle in `dist/`, and `npm run typecheck` checks the code.

`node_modules/` and `dist/` are not included in the zip. `npm install` and `npm run build` recreate them.

## 2. Where things stand (Nov 20, 2026)
**Done and tested**
- Map: 6×5 blocks across Downtown, Park Slope, Bed-Stuy and Bushwick, with pedestrians, traffic, bike docks and vendors.
- Mission 1, STOCK THE BLOCK, and Mission 2, THE CIRCLE, are fully playable.
- 10 main characters (NPCs) with relationship scores and branching dialogue.
- HUD, journal, map, pause menu, title screen and save/load (in browser storage).

**Not done**
- Missions 3–5 (March, Rent, Community Board) exist only as journal placeholders, marked `comingSoon` in `src/data/missions.ts`.
- The visual restyle described in section 3.

## 3. Art direction (decided, not yet built)
The current in-game art is the original cartoony version. The new direction is more realistic and adult, in the spirit of GTA 6. The two studies in `style-study/` are the reference:
- `golden.png`, `neon.png`, `overcast.png` show the aerial map in three looks. The preferred look is **A, Golden Hour**. Neon Night could be added later as the night half of a day/night cycle.
- `character-view.png` shows a **street-level conversation scene**. Pressing E next to a character cuts to a framed waist-up scene, like Farouk at his bodega counter.
- The source for these is `style-study/moodboard.html?s=golden|neon|overcast` and `style-study/charview.html`. Open them with the dev server running, e.g. http://localhost:5173/style-study/moodboard.html?s=golden. All the drawing code in them (perspective buildings, shadows, cars, pedestrians, grading, minimal HUD) can be reused.

**Restyle plan (next steps)**
1. Port the mood board renderer into `src/world/textures.ts` and `WorldScene.ts`:
   - Map and buildings: straight-down camera, buildings drawn with 3D-leaning walls and rooftop detail (moodboard.html, `building()`), and long golden-hour shadows.
   - Moving things: realistically proportioned cars and pedestrians seen from above.
   - Finish: a color-grading overlay on top of everything.
2. Replace the comic HUD in `src/ui/ui.ts` and `style.css` with the minimal GTA-style HUD from the mood board:
   - the mini-map bottom-left with slim bars under it;
   - Solidarity and the attention "eyes" top-right;
   - objectives shown as subtitles.
3. Replace the dialogue box with the street-level conversation scene (charview.html). Each main character needs their own portrait painter and location backdrop.
4. Then build Missions 3–5.

## 4. Code map
```
src/core/     state.ts (all game state, save/load, Effects and Conds), bus.ts (events), types.ts
src/data/     npcs.ts, dialogues.ts, missions.ts, items.ts   ← most content lives here
src/systems/  dialogue.ts (branching dialogue runner), missions.ts (stages, timers, optional objectives)
src/world/    layout.ts (seeded map generator + landmarks), textures.ts (all procedural art)
src/entities/ traffic.ts, pedestrians.ts
src/scenes/   WorldScene.ts (Phaser world, player, interactions)
src/ui/       ui.ts + style.css (DOM overlay: HUD, dialogue, menus)
style-study/  art-direction mood boards (not part of the game build)
```
- **Effects and conditions** are the shared language. Dialogue choices, pickups and mission rewards all apply an `Effect` through `state.apply()`, and content is gated with a `Cond` checked by `state.test()`.
- **Missions** are lists of stages. Each stage has a `done()` predicate that is re-checked on every state change. To add a mission, you mostly add data to `missions.ts` and `dialogues.ts`.
- **Keys** E, Space and B are handled by a DOM keydown handler in `ui.ts`. Movement keys go through Phaser.

## 5. Publishing (GitHub Pages)
`vite.config.ts` uses `base: './'`, so the build works from any sub-path.
1. Run `npm run build`, then create an empty file `dist/.nojekyll`.
2. Create a public GitHub repo, choose **"uploading an existing file"**, and drag in everything inside `dist/`, including `.nojekyll`. Commit.
3. In the repo, go to **Settings → Pages → Deploy from a branch**, choose `main` and `/ (root)`, and save.
4. After a minute or two the game is live at `https://<user>.github.io/<repo>/`. Repeat steps 1–2 for each update.

If you'd rather use git, push the whole project to a repo and add a GitHub Actions workflow that runs `npm ci && npm run build` and deploys `dist/`.

## 6. Known quirks
- If the timer and play time seem frozen, check whether the browser tab is in the background. They pause there, so this only matters when testing.
- The JS bundle is about 1.5 MB (Phaser). That's fine, and code-splitting can come later.
- Saves live in the browser (localStorage key `gtaa-L-save-v1`), so they don't move between computers.

## 7. Continuing with Claude Code
Open this folder in Claude Code and start with something like:
> Read HANDOFF.md. Continue the restyle plan in section 3: port the Golden Hour renderer from style-study/moodboard.html into the game, keeping all gameplay working.
