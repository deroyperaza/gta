# GATHER AND TAKE ACTION — Edition L (Brooklyn)

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
| Shift | Sprint |
| E | Talk / interact (NPCs, fridge, bike docks, vendors, the cat) |
| Space | Hand a flyer to a nearby pedestrian · put up a poster on a wall |
| B | Hop off your bike |
| 1–4 | Pick a dialogue choice |
| M / J / Esc | Map / Mission journal / Pause (save, load, quit) |

Touch devices get a virtual joystick plus E / Space buttons.

## What's in this build

- **Map:** 6×5 blocks of fictional Brooklyn: Downtown (Borough Plaza, Hall of Mild Justice, Synergy Tower, Luxe Lofts), Park Slope (Righteous Turnip Co-op, Perspective Park and its pond, a community garden), Bed-Stuy (the Community Fridge mural, Farouk's bodega, Tenants United Hall, the Gates Ave Community Center, Kingston Courts) and Bushwick (Sourdough Collective, galleries, the Former Pickle Factory).
- **Living streets:** about 90 wandering pedestrians with district-specific chatter, lane-following traffic that brakes and honks, cyclists, BK Spokes bike docks, and vendors.
- **10 recurring NPCs** with bios, relationship scores and opinions of their own. Dee and Juni disagree about whether the fridge is charity or solidarity.
- **Systems:** Solidarity (with levels), Organizing Power, Public Attention, per-district Community Trust, per-NPC relationships, and a mutual aid inventory (8 item types).
- **Mission 1, STOCK THE BLOCK** (fully playable): meet Dee, collect from the co-op, bodega and bakery against a 2:30 clock (dialogue pauses it; Brendan's land-labor-and-lettuce acknowledgment costs you 15 seconds), restock the fridge, and earn up to 4 bonus objectives. Failing resets the mission.
- **Mission 2, THE CIRCLE** (fully playable): facilitate a restorative justice circle. Your choices change hidden understanding scores for Marcus and Priya, plus an "underlying needs" score, and these decide which agreements become available. There are three outcomes with different rewards.
- **Missions 3–5** are defined in the journal and teased by Gary, Tyler and Skye. They're slated for the next phase.
- Save/load through localStorage (auto-saves on mission pass), plus a title screen, pause menu, map and journal.

All art is drawn procedurally with Canvas 2D at boot (`src/world/textures.ts`). There are no image assets or API keys.

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
