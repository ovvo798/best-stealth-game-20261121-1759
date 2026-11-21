// Boot and the one loop for Night Shift: The Gallery Heist.
// Input is read every frame, the world advances in fixed 1/60 s steps,
// and the renderer paints what is there. Screens: title, play, paused,
// caught, level clear and the win screen.
// ?shot=start|play|alarm|exit stages that scene instead of running the
// loop, paints it twice and sets window.__shotReady for a screenshot.
import { BEST_KEY, CATCH_RADIUS, STEP } from './config.js';
import { LEVELS, scanLevel } from './world.js';
import { createGuard, updateGuard, STATE_CHASE } from './guards.js';
import { atExit, collectLoot, createThief, updateThief } from './player.js';
import { ACTION_CONFIRM, ACTION_MUTE, ACTION_PAUSE, createInput } from './input.js';
import { createAudio } from './audio.js';
import {
  createRenderer,
  SCREEN_CAUGHT,
  SCREEN_CLEAR,
  SCREEN_PAUSED,
  SCREEN_PLAY,
  SCREEN_TITLE,
  SCREEN_WIN,
} from './render.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const renderer = createRenderer(canvas);
const audio = createAudio();

function readBest() {
  try { return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0; }
  catch { return 0; }
}
function saveBest(value) {
  try { window.localStorage.setItem(BEST_KEY, String(value)); }
  catch { /* storage off: the best time lasts this visit only */ }
}

function buildLevel(levelIndex, timeSoFar) {
  const level = LEVELS[levelIndex];
  const { loot, exit, start } = scanLevel(level);
  return {
    level, levelIndex, levelName: level.name, hint: level.hint,
    guards: level.guards.map((g) => createGuard(g, levelIndex)),
    thief: createThief(start),
    loot, exit, lootTaken: 0, lootTotal: loot.length,
    lootTotalAll: LEVELS.reduce((n, l) => n + scanLevel(l).loot.length, 0),
    time: timeSoFar, best: readBest(), clearNote: '',
  };
}

function runShot(name) {
  const scene = stageShot(name);
  let painted = 0;
  function paint() {
    renderer.draw(scene.state, scene.screen, 1.2);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let state = buildLevel(0, 0);
  let accumulator = 0;
  let last = performance.now();
  let lastStepSound = 0;
  let alarmSounded = false;

  function say(text) { status.textContent = text; }

  function startLevel(levelIndex, timeSoFar) {
    state = buildLevel(levelIndex, timeSoFar);
    alarmSounded = false;
    screen = SCREEN_PLAY;
    say(`${state.levelName}. ${state.hint}`);
  }

  function step(dt) {
    if (screen !== SCREEN_PLAY) return;
    updateThief(state.level, state.thief, input, dt);
    const events = [];
    for (const guard of state.guards) updateGuard(state.level, guard, state.thief, dt, events);
    for (const event of events) {
      if (event.type === 'alarm' && !alarmSounded) { audio.alarm(); alarmSounded = true; say('Alarm! Break line of sight and hide.'); }
      if (event.type === 'spotted') { audio.spotted(); say('A guard thinks they saw something.'); }
    }
    if (state.guards.every((g) => g.state !== STATE_CHASE)) alarmSounded = false;
    if (state.thief.moving && state.time - lastStepSound > (state.thief.sneaking ? 0.55 : 0.38)) {
      lastStepSound = state.time;
      audio.step(state.thief.sneaking);
    }
    const taken = collectLoot(state.thief, state.loot);
    if (taken > 0) { audio.pickup(); state.lootTaken += taken; say(`Artifact stolen — ${state.lootTaken} of ${state.lootTotal}.`); }
    for (const guard of state.guards) {
      if (Math.hypot(guard.x - state.thief.x, guard.y - state.thief.y) < CATCH_RADIUS) {
        audio.caught();
        screen = SCREEN_CAUGHT;
        say('Caught! Press Enter to try this wing again.');
        return;
      }
    }
    state.time += dt;
    if (atExit(state.thief, state.exit, state.lootTotal)) {
      if (state.levelIndex + 1 >= LEVELS.length) {
        const total = Math.floor(state.time);
        if (state.best === 0 || total < state.best) saveBest(total);
        state.best = readBest();
        audio.win();
        screen = SCREEN_WIN;
        say(`The perfect heist! All ${state.lootTotalAll} artifacts in ${total} seconds.`);
      } else {
        state.clearNote = `${state.levelName} done in ${Math.floor(state.time)}s.`;
        audio.win();
        screen = SCREEN_CLEAR;
        say(`Wing cleared. Press Enter for ${LEVELS[state.levelIndex + 1].name}.`);
      }
    }
  }

  function frame(now) {
    const elapsed = Math.min(MAX_FRAME, (now - last) / 1000);
    last = now;
    if (input.mute) { audio.toggleMute(); input.mute = false; }
    if (input.confirm) {
      audio.unlock();
      input.confirm = false;
      if (screen === SCREEN_TITLE) startLevel(0, 0);
      else if (screen === SCREEN_CAUGHT) startLevel(state.levelIndex, state.time);
      else if (screen === SCREEN_CLEAR) startLevel(state.levelIndex + 1, state.time);
      else if (screen === SCREEN_WIN) startLevel(0, 0);
      else if (screen === SCREEN_PAUSED) screen = SCREEN_PLAY;
    }
    if (input.pause) {
      input.pause = false;
      if (screen === SCREEN_PLAY) { screen = SCREEN_PAUSED; say('Paused.'); }
      else if (screen === SCREEN_PAUSED) screen = SCREEN_PLAY;
    }
    if (input.click && screen === SCREEN_TITLE) { audio.unlock(); input.click = null; startLevel(0, 0); }
    else if (input.click) input.click = null;
    accumulator += elapsed;
    while (accumulator >= STEP) { step(STEP); accumulator -= STEP; }
    renderer.draw(state, screen, now / 1000);
    requestAnimationFrame(frame);
  }

  say('Night Shift: The Gallery Heist. Press Enter to begin.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
