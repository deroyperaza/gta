# GIVE AND TAKE ACTION — Edition L (Brooklyn)

An open-world satirical organizing game. Grand Theft Auto energy, except the crimes are mutual aid.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:5173.

> Needs Node.js 18+ (20 or 22 LTS recommended), from https://nodejs.org. See **HANDOFF.md** for full setup, project status and next steps.

Other scripts: `npm run build` (typecheck + production bundle in `dist/`), `npm run preview`.

## Controls

| Key | Action |
| --- | --- |
| WASD / Arrows | Move |
| Press + drag | Walk toward the pointer (mouse or finger) |
| Click a character | Talk to them (when close), or a "walk closer" hint |
| Shift | Sprint |
| E | Talk / interact (NPCs, fridge, bike docks, vendors, the cat) |
| Space | Hand a flyer to a nearby pedestrian · put up a poster on a wall |
| B | Hop off your bike |
| 1–4 | Pick a dialogue choice |
| M / J / Esc | Map / Mission journal / Pause (save, load, quit) |
| Esc or × | Close a conversation |

Touch devices get a virtual joystick plus E / Space buttons.

## What's in this build

**Live:** https://deroyperaza.github.io/gta/ (GitHub Pages, deployed by `.github/workflows/pages.yml` on every push to `main`).

- **Map:** 9×7 blocks of fictional Brooklyn in real-world order (north up), across 10 neighborhoods: Downtown, Bed-Stuy, Bushwick, Red Hook, Park Slope, Crown Heights, Prospect Lefferts Gardens (PLG), Sunset Park, Flatbush and Coney Island. There are beach, boardwalk and waterfront blocks, and Perspective Park sits between Park Slope and PLG.
- **Living streets:** about 170 pedestrians with neighborhood chatter, traffic, cyclists, 11 BK Spokes bike docks and vendors.
- **The cast:** eight characters based on real friends, each with a painted portrait, a movie-style title and a civic lesson tied to their real work. See [docs/CAST.md](docs/CAST.md).
- **Ten satirical NPCs** (Dee, Brendan, Farouk, Juni, Ms. Hattie, Gary, Tyler, Skye, Marcus, Priya) with relationship scores. Ms. Hattie also teaches community boards.
- **Pocket Civics:** every lesson ends in a `POCKET CIVICS · …` toast plus Solidarity and neighborhood Trust. They don't collect in the journal yet.
- **Systems:** Solidarity (with levels), Organizing Power, Public Attention, per-neighborhood Trust, relationships, and a mutual aid inventory.
- **Missions 1–2** are fully playable. Missions 3–5 are teased in the journal.
- Save/load through localStorage, plus a title screen, pause menu, map and journal.

The world art is drawn in code with Canvas 2D (`src/world/golden.ts`, `src/world/textures.ts`). The only image assets are the cast portraits in `public/portraits/`, which were painted with ChatGPT from photos. There are no API keys.

## Architecture

```
src/
  core/      state.ts (all game state + save/load + effects/conditions), bus.ts (events), types.ts
  data/      npcs.ts, dialogues.ts, missions.ts, items.ts   ← content lives here
  systems/   dialogue.ts (branching runner), missions.ts (stage/timer/optional runner)
  world/     layout.ts (map generator + landmarks), textures.ts (all procedural art)
  entities/  traffic.ts, pedestrians.ts
  scenes/    WorldScene.ts (Phaser: world, player, interactions)
  ui/        ui.ts + style.css (DOM HUD, dialogue, journal, map, menus)
```

- **Effects and conditions** (`core/types.ts`) are the shared language. Dialogue choices, pickups, mission rewards and world actions all apply an `Effect` (solidarity, trust, items, relationships, flags, mission vars, timer changes), and they gate content with a `Cond`.
- **Missions** are lists of stages. Each stage has a `done()` predicate that's re-checked on every state change, so any system can advance a mission just by changing state. To add a mission, add data to `data/missions.ts` and `data/dialogues.ts`.
- **New neighborhoods:** add blocks in `world/layout.ts` (`BLOCKS`, `districtOfBlock`) and a district to `DISTRICTS`.
- **Multiplayer later:** all state is one serializable `SaveData` object mutated through `state.apply()`, which is a natural place to sync.
