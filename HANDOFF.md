# HANDOFF: GATHER AND TAKE ACTION (Edition L, Brooklyn)

An open-world satirical organizing game, playable in the browser. Built with TypeScript, Phaser 3.80 and Vite. All art is drawn in code, so there are no image assets, paid services or API keys.

## 1. Setup on a new computer
1. Install **Node.js 20 or 22 LTS** from https://nodejs.org (Mac or Windows).
2. Clone `deroyperaza/gta` (or unzip this package) and open a terminal in the folder.
3. Install dependencies once: `npm install`
4. Play: `npm run dev`, then open http://localhost:5173
5. Other commands: `npm run build` creates the production bundle in `dist/`, and `npm run typecheck` checks the code.

`node_modules/` and `dist/` are not included in the zip. `npm install` and `npm run build` recreate them.

## 2. Where things stand (Nov 20, 2026, end of day)
Folder: `~/Projects/gather-and-take-action` (renamed from `get-together-agitate` on Nov 20). Repo: `deroyperaza/gta` (public). Live: https://deroyperaza.github.io/gta/

**Done and tested**
- Golden Hour world restyle (step 1 of section 3): realistic overhead streets, cast shadows, golden grade.
- 9×7 map with 10 neighborhoods in real Brooklyn order (see README). PLG was added between Crown Heights and Flatbush.
- An eight-person cast with painted portraits, movie titles and real civic lessons ([docs/CAST.md](docs/CAST.md)).
- Click or hover a character to talk. The dialogue box is centered, with a × and Esc to close.
- Drag-to-walk with mouse or finger.
- Readable HUD: big logo beside the meters, toasts as body-font pills, bold character name tags.
- Missions 1–2 fully playable.

**Not done / next**
- Pocket Civics doesn't collect anywhere yet. A journal page of earned lessons is the obvious next step.
- No missions in the new neighborhoods yet. Natural fits: Nell's Right to Counsel in PLG, Emily's block party at Coney, flood resiliency in Red Hook.
- Missions 3–5 (March, Rent, Community Board) are still placeholders.
- HUD and dialogue restyle steps 2–3 in section 3.
- Missions 1–2 haven't been replayed start to finish since the map re-layout. Every spot resolves, but the walking routes changed.
- The friends' source photos in `style-study/photos/` are committed to the public repo. That's Deroy's call.

## Session log, Nov 20, 2026
| Commit | What changed |
|---|---|
| f4727ec | Clickable characters with hover ring; centered dialogue with ×; v2 portraits (looking at camera, varied Brooklyn backdrops) |
| 1b6d85a | Map grew to 9×7: Crown Heights, Red Hook, Coney Island, Flatbush, Sunset Park; beach, waterfront and sand tiles |
| 9dcd688 → 97350e1 | Portrait rounds on Bridgette (build) and Jenna (hair, gold hoops, original face kept) |
| 9469174 | Lessons rewritten from each friend's real work; movie titles; PLG district; toasts restyled so they don't overlap the mission title |
| f1bf21d | Map put in real-world order: Bushwick NE, Crown Heights south of Bed-Stuy, Red Hook west; saves inside buildings fall back to start |
| 9e7e6f2 | Emily added as The Showstopper (block party permits); district banner hidden under dialogue |
| 3318c73 | Bigger HUD logo beside the meters |
| 9b9ea52 | Drag-to-walk; bold name tags |

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
Push to `main` on `deroyperaza/gta`. `.github/workflows/pages.yml` builds and deploys automatically in about a minute. To confirm, check that the `assets/index-*.js` filename on https://deroyperaza.github.io/gta/ matches the one in your local `dist/assets/`. `vite.config.ts` uses `base: './'`, so the build works from the `/gta/` sub-path.

## 6. Known quirks
- If the timer and play time seem frozen, check whether the browser tab is in the background. They pause there, so this only matters when testing.
- The JS bundle is about 1.5 MB (Phaser). That's fine, and code-splitting can come later.
- Saves live in the browser (localStorage key `gtaa-L-save-v1`), so they don't move between computers. Saves from before the Nov 20 re-layout restart at the beginning of the map if the player would land inside a building.
- Dev testing: in dev builds `window.__world` exposes the scene. Teleport with `__world.player.body.reset(x, y)`; character positions are in `__world.entityPos`.

## 7. Continuing with Claude Code
Open this folder in Claude Code and start with something like:
> Read HANDOFF.md and docs/CAST.md. Build a Pocket Civics page in the journal that collects every lesson the player has earned.
