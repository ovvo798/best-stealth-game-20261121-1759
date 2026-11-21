// The screenshot scenes behind ?shot=title|patrol|alarm|exit. Each one plays the real
// rules forward from a fresh game for a fixed number of steps, steered by a small
// autopilot that walks between waypoints, so the frame is what a short game really
// looks like and the same seed always gives the same frame.

import { STEP } from './config.js';
import { createGame } from './game.js';
import {
  SCREEN_CLEAR,
  SCREEN_PLAY,
  SCREEN_TITLE,
} from './render.js';

const TITLE_SECONDS = 5;
const PATROL_SECONDS = 11;
const ALARM_LIMIT_SECONDS = 8;
const EXIT_LIMIT_SECONDS = 45;

/** Waypoints the patrol shot's cat sneaks between, all in open floor. */
const PATROL_ROUTE = [
  { x: 500, y: 650 },
  { x: 700, y: 630 },
  { x: 760, y: 500 },
  { x: 880, y: 560 },
];

/** Waypoints the exit shot's cat sneaks along to the cat flap. */
const EXIT_ROUTE = [
  { x: 500, y: 650 },
  { x: 750, y: 640 },
  { x: 1000, y: 650 },
  { x: 1180, y: 648 },
];

/**
 * Steer the cat toward a waypoint: returns the move vector and whether to sneak.
 * Advances to the next waypoint when close, and skips one the cat is stuck on.
 */
function makePilot(route) {
  let index = 0;
  let stuckFor = 0;
  let lastX = 0;
  let lastY = 0;
  return {
    move(player) {
      if (index >= route.length) return { x: 0, y: 0 };
      const target = route[index];
      const dx = target.x - player.x;
      const dy = target.y - player.y;
      const d = Math.hypot(dx, dy);
      if (d < 26) {
        index += 1;
        return { x: 0, y: 0 };
      }
      if (Math.hypot(player.x - lastX, player.y - lastY) < 0.4) {
        stuckFor += STEP;
        if (stuckFor > 1.2) {
          index += 1;
          stuckFor = 0;
        }
      } else {
        stuckFor = 0;
      }
      lastX = player.x;
      lastY = player.y;
      return { x: dx / d, y: dy / d };
    },
    done() {
      return index >= route.length;
    },
  };
}

/** A fake input object that feeds the pilot's moves to the game. */
function pilotInput(pilot, sneak) {
  let move = { x: 0, y: 0 };
  return {
    direction() {
      return move;
    },
    sneaking() {
      return sneak;
    },
    dashHeld() {
      return false;
    },
    takeActions() {
      return 0;
    },
    takeClick() {
      return null;
    },
    refresh(player) {
      move = pilot.move(player);
    },
  };
}

/**
 * Set the game to the named scene (title, patrol, alarm or exit; any other name is
 * title) and return the screen to draw over it.
 */
export function stageShot(name, best) {
  if (name !== 'patrol' && name !== 'alarm' && name !== 'exit') {
    const session = createGame(best);
    for (let i = 0; i < TITLE_SECONDS / STEP; i += 1) session.update(STEP, null);
    return { session, screen: SCREEN_TITLE };
  }

  if (name === 'alarm') {
    const session = createGame(best);
    session.game.screen = SCREEN_PLAY;
    const input = pilotInput(makePilot([]), true);
    for (let i = 0; i < ALARM_LIMIT_SECONDS / STEP; i += 1) {
      // Keep the cat standing in front of the lead dog, just inside its cone,
      // so suspicion climbs the way a careless player would earn it.
      const guard = session.game.guards[0];
      session.game.player.x = guard.x + Math.cos(guard.facing) * 110;
      session.game.player.y = guard.y + Math.sin(guard.facing) * 110;
      session.update(STEP, input);
      if (session.game.alarm) break;
    }
    // A few more steps so the chase is visibly under way.
    for (let i = 0; i < 18; i += 1) session.update(STEP, input);
    return { session, screen: SCREEN_PLAY };
  }

  if (name === 'exit') {
    const session = createGame(best);
    session.game.screen = SCREEN_PLAY;
    const pilot = makePilot(EXIT_ROUTE);
    const input = pilotInput(pilot, true);
    for (let i = 0; i < EXIT_LIMIT_SECONDS / STEP; i += 1) {
      input.refresh(session.game.player);
      session.update(STEP, input);
      if (session.game.screen === SCREEN_CLEAR) break;
      if (session.game.screen !== SCREEN_PLAY) break;
    }
    return { session, screen: session.game.screen === SCREEN_CLEAR ? SCREEN_CLEAR : SCREEN_PLAY };
  }

  // patrol
  const session = createGame(best);
  session.game.screen = SCREEN_PLAY;
  const pilot = makePilot(PATROL_ROUTE);
  const input = pilotInput(pilot, true);
  for (let i = 0; i < PATROL_SECONDS / STEP; i += 1) {
    input.refresh(session.game.player);
    session.update(STEP, input);
    if (session.game.screen !== SCREEN_PLAY) break;
  }
  return { session, screen: SCREEN_PLAY };
}
