// The cat: walk, sneak, dash and throw pebbles. Movement is the only thing here —
// what the movement means (noise, sight) is decided by the game and the guards.

import { FIELD, PLAYER } from './config.js';
import { resolveCircleRects } from './vision.js';

export function createPlayer(start) {
  return {
    x: start.x,
    y: start.y,
    radius: PLAYER.radius,
    facing: -Math.PI / 2,
    sneaking: false,
    dashing: false,
    dashLeft: 0,
    dashCooldownLeft: 0,
    moving: false,
    /** Seconds since the last footstep sound (walking is audible up close). */
    stepTimer: 0,
  };
}

/**
 * Move the cat one step. `move` is {x, y} in -1..1, `sneak` and `dash` are held keys.
 * Returns 'step' when a footstep should sound, 'dash' when a dash just fired, else null.
 */
export function updatePlayer(player, dt, move, sneak, dash, blockers) {
  player.sneaking = sneak && !player.dashing;
  const length = Math.hypot(move.x, move.y);
  const nx = length > 0.001 ? move.x / length : 0;
  const ny = length > 0.001 ? move.y / length : 0;
  player.moving = length > 0.001;

  if (dash && player.dashCooldownLeft <= 0 && player.dashLeft <= 0 && player.moving) {
    player.dashing = true;
    player.dashLeft = PLAYER.dashTime;
    player.dashCooldownLeft = PLAYER.dashCooldown;
  }
  if (player.dashCooldownLeft > 0) player.dashCooldownLeft -= dt;
  if (player.dashLeft > 0) {
    player.dashLeft -= dt;
    if (player.dashLeft <= 0) player.dashing = false;
  }

  const speed = player.dashing
    ? PLAYER.dashSpeed
    : player.sneaking
      ? PLAYER.sneakSpeed
      : PLAYER.walkSpeed;
  player.x += nx * speed * dt;
  player.y += ny * speed * dt;
  if (player.moving) player.facing = Math.atan2(ny, nx);
  player.x = Math.max(FIELD.width * 0 + 30, Math.min(FIELD.width - 30, player.x));
  player.y = Math.max(30, Math.min(FIELD.height - 30, player.y));
  resolveCircleRects(player, blockers);

  if (player.moving && !player.sneaking) {
    player.stepTimer -= dt;
    if (player.stepTimer <= 0) {
      player.stepTimer = player.dashing ? 0.16 : 0.34;
      return player.dashing ? 'dash' : 'step';
    }
  } else {
    player.stepTimer = 0.12;
  }
  return null;
}

/** Start a pebble flying from the cat toward (tx, ty); returns the pebble or null. */
export function throwPebble(player, tx, ty) {
  const dx = tx - player.x;
  const dy = ty - player.y;
  const d = Math.hypot(dx, dy);
  if (d < 12) return null;
  const range = Math.min(d, 330);
  return {
    x: player.x,
    y: player.y,
    fromX: player.x,
    fromY: player.y,
    toX: player.x + (dx / d) * range,
    toY: player.y + (dy / d) * range,
    t: 0,
    flight: 0.45,
  };
}

/** Advance a pebble; returns 'landed' on the step it arrives, else null. */
export function updatePebble(pebble, dt) {
  pebble.t += dt / pebble.flight;
  const k = Math.min(1, pebble.t);
  // A little arc: the pebble rises mid-flight and drops onto the floor.
  pebble.x = pebble.fromX + (pebble.toX - pebble.fromX) * k;
  pebble.y = pebble.fromY + (pebble.toY - pebble.fromY) * k - Math.sin(k * Math.PI) * 26;
  return k >= 1 ? 'landed' : null;
}
