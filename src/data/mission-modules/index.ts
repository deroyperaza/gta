import type { MissionModule } from './types';
import { rent } from './rent';
import { board } from './board';
import { reentry } from './reentry';
import { pbudget } from './pbudget';
import { access } from './access';
import { streets } from './streets';
import { robot } from './robot';
import { culture } from './culture';
import { heat } from './heat';
import { blockparty } from './blockparty';
import { fares } from './fares';
import { food } from './food';
import { common } from './common';
import { bridge } from './bridge';
import { elders } from './elders';
import { ej } from './ej';
import { rj } from './rj';
import { medBike, medTriangle, medMosque, medChoir } from './mediations';

/** Missions 4+ — one file each, in play order. */
export const MODULES: MissionModule[] = [rent, board, reentry, pbudget, access, streets, robot, culture, heat, blockparty, fares, food, common, bridge, elders, ej, rj, medBike, medTriangle, medMosque, medChoir];

export const MODULE_NPCS = MODULES.flatMap((m) => m.npcs ?? []);
