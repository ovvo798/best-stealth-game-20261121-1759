// Staged scenes for screenshots: deterministic states painted without
// running the loop, so each shot shows a distinct moment of the game.
import { TILE } from './config.js';
import { LEVELS, scanLevel } from './world.js';
import { createGuard, STATE_CHASE, STATE_CURIOUS } from './guards.js';
import { createThief } from './player.js';

function buildState(levelIndex, place) {
  const level = LEVELS[levelIndex];
  const { loot, exit, start } = scanLevel(level);
  const guards = level.guards.map((g) => createGuard(g, levelIndex));
  const thief = createThief(start);
  const state = {
    level, levelIndex, levelName: level.name, guards, thief,
    loot, exit, lootTaken: 0, lootTotal: loot.length,
    lootTotalAll: LEVELS.reduce((n, l) => n + scanLevel(l).loot.length, 0),
    time: 0, best: 0, clearNote: '',
  };
  place(state);
  return state;
}

export function stageShot(name) {
  if (name === 'play') {
    return {
      screen: 'play',
      state: buildState(0, (s) => {
        s.thief.x = 13.5 * TILE; s.thief.y = 8.5 * TILE; s.thief.dir = Math.PI;
        s.thief.sneaking = true;
        s.loot[0].taken = true; s.lootTaken = 1;
        s.guards[0].x = 11.5 * TILE; s.guards[0].y = 8.5 * TILE; s.guards[0].dir = 0;
        s.guards[0].suspicion = 62; s.guards[0].state = STATE_CURIOUS;
        s.guards[1].x = 4.5 * TILE; s.guards[1].y = 10.5 * TILE; s.guards[1].dir = -Math.PI / 2;
        s.time = 47;
      }),
    };
  }
  if (name === 'alarm') {
    return {
      screen: 'play',
      state: buildState(1, (s) => {
        s.thief.x = 8.5 * TILE; s.thief.y = 12.5 * TILE; s.thief.dir = -0.4;
        s.thief.running = true; s.thief.moving = true;
        s.loot[0].taken = true; s.loot[1].taken = true; s.lootTaken = 2;
        s.guards[0].x = 8.5 * TILE; s.guards[0].y = 9.5 * TILE; s.guards[0].dir = Math.PI / 2;
        s.guards[0].suspicion = 100; s.guards[0].state = STATE_CHASE;
        s.guards[1].x = 12.5 * TILE; s.guards[1].y = 12.5 * TILE; s.guards[1].dir = Math.PI;
        s.guards[1].suspicion = 88; s.guards[1].state = STATE_CHASE;
        s.guards[2].x = 17.5 * TILE; s.guards[2].y = 12.5 * TILE; s.guards[2].dir = Math.PI;
        s.guards[2].suspicion = 41;
        s.time = 96;
      }),
    };
  }
  if (name === 'exit') {
    return {
      screen: 'play',
      state: buildState(2, (s) => {
        for (const item of s.loot) item.taken = true;
        s.lootTaken = s.loot.length;
        s.thief.x = 20.5 * TILE; s.thief.y = 13.5 * TILE; s.thief.dir = 0;
        s.thief.sneaking = true;
        s.guards[0].x = 3.5 * TILE; s.guards[0].y = 3.5 * TILE; s.guards[0].dir = 0;
        s.guards[1].x = 12.5 * TILE; s.guards[1].y = 10.5 * TILE; s.guards[1].dir = Math.PI;
        s.guards[2].x = 9.5 * TILE; s.guards[2].y = 7.5 * TILE; s.guards[2].dir = Math.PI / 2;
        s.guards[3].x = 18.5 * TILE; s.guards[3].y = 4.5 * TILE; s.guards[3].dir = -Math.PI / 2;
        s.time = 214;
      }),
    };
  }
  // Default: the title screen over wing one.
  return { screen: 'title', state: buildState(0, () => {}) };
}
