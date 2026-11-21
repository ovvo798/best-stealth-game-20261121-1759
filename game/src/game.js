// The game itself: screens, the level loop, and the rules that tie the cat, the dogs,
// the fish and the exit together. Movement lives in player.js, dog brains in guards.js,
// sight in vision.js; this file only decides what happens when they meet.

import { GAME, STEP } from './config.js';
import { LEVELS } from './levels.js';
import { createPlayer, throwPebble, updatePebble, updatePlayer } from './player.js';
import {
  anyChasing,
  createGuard,
  guardCatches,
  guardHears,
  inShadow,
  updateGuard,
  worstSuspicion,
} from './guards.js';
import { pointInRect } from './vision.js';
import {
  createAudio,
  soundAlert,
  soundCaught,
  soundDash,
  soundLand,
  soundPebble,
  soundPickup,
  soundStep,
  soundWin,
  startPad,
  toggleMute,
} from './audio.js';
import {
  SCREEN_CAUGHT,
  SCREEN_CLEAR,
  SCREEN_OVER,
  SCREEN_PAUSED,
  SCREEN_PLAY,
  SCREEN_TITLE,
  SCREEN_WIN,
} from './render.js';
import { ACTION_CONFIRM, ACTION_MUTE, ACTION_PAUSE } from './input.js';

export const SCREENS = {
  TITLE: SCREEN_TITLE,
  PLAY: SCREEN_PLAY,
  PAUSED: SCREEN_PAUSED,
  CAUGHT: SCREEN_CAUGHT,
  CLEAR: SCREEN_CLEAR,
  WIN: SCREEN_WIN,
  OVER: SCREEN_OVER,
};

function blockersOf(level) {
  return [...level.walls, ...level.furniture];
}

export function createGame(best) {
  const audio = createAudio();
  const game = {
    screen: SCREEN_TITLE,
    levelIndex: 0,
    level: LEVELS[0],
    player: createPlayer(LEVELS[0].playerStart),
    guards: LEVELS[0].guards.map((def, i) => createGuard(def, i)),
    fish: LEVELS[0].fish.map((f) => ({ ...f, taken: false })),
    pebbles: [],
    noises: [],
    lives: GAME.lives,
    score: 0,
    best,
    fishGot: 0,
    pebblesLeft: GAME.pebblesPerLevel,
    suspicion: 0,
    alarm: false,
    elapsed: 0,
    ghost: true,
    scoreAtLevelStart: 0,
    time: 0,
  };

  function loadLevel(index) {
    game.levelIndex = index;
    game.level = LEVELS[index];
    game.player = createPlayer(game.level.playerStart);
    game.guards = game.level.guards.map((def, i) => createGuard(def, i));
    game.fish = game.level.fish.map((f) => ({ ...f, taken: false }));
    game.pebbles = [];
    game.noises = [];
    game.fishGot = 0;
    game.pebblesLeft = GAME.pebblesPerLevel;
    game.suspicion = 0;
    game.alarm = false;
    game.elapsed = 0;
    game.ghost = true;
    game.scoreAtLevelStart = game.score;
  }

  function startFresh() {
    game.lives = GAME.lives;
    game.score = 0;
    loadLevel(0);
    game.screen = SCREEN_PLAY;
    startPad(audio);
  }

  function restartLevel() {
    game.score = game.scoreAtLevelStart;
    loadLevel(game.levelIndex);
    game.screen = SCREEN_PLAY;
  }

  function finishLevel() {
    const timeBonus = Math.max(0, GAME.timeBonusMax - Math.floor(GAME.timeBonusRate * game.elapsed));
    const ghostBonus = game.ghost ? GAME.ghostBonus : 0;
    game.score += GAME.levelPoints + timeBonus + ghostBonus;
    if (game.score > game.best) game.best = game.score;
    if (game.levelIndex + 1 >= LEVELS.length) {
      game.screen = SCREEN_WIN;
      soundWin(audio);
    } else {
      game.screen = SCREEN_CLEAR;
      soundWin(audio);
    }
  }

  function caught() {
    game.lives -= 1;
    soundCaught(audio);
    if (game.lives <= 0) {
      game.screen = SCREEN_OVER;
    } else {
      game.screen = SCREEN_CAUGHT;
    }
  }

  function addNoise(x, y, radius) {
    game.noises.push({ x, y, radius, ttl: 1.1, maxTtl: 1.1 });
    for (const guard of game.guards) guardHears(guard, x, y, radius);
  }

  function stepPlay(dt, input) {
    const blockers = blockersOf(game.level);
    game.elapsed += dt;
    game.time += dt;

    const click = input.takeClick();
    if (click && game.pebblesLeft > 0 && game.pebbles.length === 0) {
      const pebble = throwPebble(game.player, click.x, click.y);
      if (pebble) {
        game.pebbles.push(pebble);
        game.pebblesLeft -= 1;
        soundPebble(audio);
      }
    }

    const sound = updatePlayer(
      game.player,
      dt,
      input.direction(),
      input.sneaking(),
      input.dashHeld(),
      blockers,
    );
    if (sound === 'step') soundStep(audio);
    if (sound === 'dash') {
      soundDash(audio);
      addNoise(game.player.x, game.player.y, 280);
    }

    for (let i = game.pebbles.length - 1; i >= 0; i -= 1) {
      if (updatePebble(game.pebbles[i], dt) === 'landed') {
        const landed = game.pebbles[i];
        game.pebbles.splice(i, 1);
        soundLand(audio);
        addNoise(landed.toX, landed.toY, 300);
      }
    }
    for (let i = game.noises.length - 1; i >= 0; i -= 1) {
      game.noises[i].ttl -= dt;
      if (game.noises[i].ttl <= 0) game.noises.splice(i, 1);
    }

    const events = [];
    for (const guard of game.guards) {
      updateGuard(guard, dt, game.player, game.level, blockers, events);
    }
    for (const event of events) {
      if (event.type === 'alarm') {
        game.ghost = false;
        soundAlert(audio);
      }
    }
    game.suspicion = worstSuspicion(game.guards);
    game.alarm = anyChasing(game.guards);

    for (const fish of game.fish) {
      if (!fish.taken && Math.hypot(fish.x - game.player.x, fish.y - game.player.y) < 26) {
        fish.taken = true;
        game.fishGot += 1;
        game.score += GAME.fishPoints;
        if (game.score > game.best) game.best = game.score;
        soundPickup(audio);
      }
    }

    for (const guard of game.guards) {
      if (guardCatches(guard, game.player)) {
        caught();
        return;
      }
    }

    if (pointInRect(game.player.x, game.player.y, game.level.exit)) {
      finishLevel();
    }
  }

  function stepTitle(dt) {
    // Attract mode: the dogs patrol while the title sits over the room.
    const blockers = blockersOf(game.level);
    const dummy = { x: -500, y: -500, sneaking: false, dashing: false };
    const events = [];
    for (const guard of game.guards) updateGuard(guard, dt, dummy, game.level, blockers, events);
    game.time += dt;
  }

  return {
    game,
    audio,
    loadLevel,
    startFresh,
    restartLevel,

    /** One frame of input edges (confirm / pause / mute) and the screen changes they make. */
    handleActions(input) {
      const actions = input.takeActions();
      if (actions & ACTION_MUTE) toggleMute(audio);
      if (actions & ACTION_PAUSE) {
        if (game.screen === SCREEN_PLAY) game.screen = SCREEN_PAUSED;
        else if (game.screen === SCREEN_PAUSED) game.screen = SCREEN_PLAY;
        return;
      }
      if (!(actions & ACTION_CONFIRM)) return;
      if (game.screen === SCREEN_TITLE) startFresh();
      else if (game.screen === SCREEN_PAUSED) game.screen = SCREEN_PLAY;
      else if (game.screen === SCREEN_CAUGHT) restartLevel();
      else if (game.screen === SCREEN_CLEAR) {
        loadLevel(game.levelIndex + 1);
        game.screen = SCREEN_PLAY;
      } else if (game.screen === SCREEN_WIN || game.screen === SCREEN_OVER) {
        startFresh();
      }
    },

    /** Advance the simulation one fixed step. */
    update(dt, input) {
      if (game.screen === SCREEN_TITLE) stepTitle(dt);
      else if (game.screen === SCREEN_PLAY) stepPlay(dt, input);
      else game.time += dt;
    },

    /** The plain object the renderer paints. */
    drawState() {
      const player = { ...game.player, hidden: inShadow(game.player, game.level) };
      return {
        level: game.level,
        levelIndex: game.levelIndex,
        guards: game.guards,
        fish: game.fish,
        pebbles: game.pebbles,
        noises: game.noises,
        player,
        fishGot: game.fishGot,
        fishTotal: game.fish.length,
        pebblesLeft: game.pebblesLeft,
        lives: game.lives,
        score: game.score,
        best: game.best,
        suspicion: game.suspicion,
        alarm: game.alarm,
        timeLeft: Math.floor(game.elapsed),
        ghost: game.ghost,
      };
    },
  };
}

export { STEP };
