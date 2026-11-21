// Guard brains: patrol, suspicion, alarm, chase and search.
// A guard never fails you instantly. Seeing the thief fills suspicion;
// at 50 the guard walks over to look, at 100 the alarm sounds and every
// guard chases. Break line of sight and the alarm cools back down.
import {
  ALARM_COOLDOWN,
  GUARD_CHASE_SPEED,
  GUARD_HALF_ANGLE,
  GUARD_HEAR_RADIUS,
  GUARD_PATROL_SPEED,
  GUARD_SEARCH_SPEED,
  GUARD_SIGHT_RANGE,
  SUSPICION_DECAY,
  SUSPICION_GAIN,
  TILE,
} from './config.js';
import { hasLineOfSight, moveCircle } from './world.js';

export const STATE_PATROL = 'patrol';
export const STATE_CURIOUS = 'curious';
export const STATE_CHASE = 'chase';
export const STATE_SEARCH = 'search';

export function createGuard(def, levelIndex) {
  const [c, r] = def.waypoints[0];
  return {
    x: c * TILE + TILE / 2,
    y: r * TILE + TILE / 2,
    dir: 0,
    waypoints: def.waypoints.map(([wc, wr]) => ({ x: wc * TILE + TILE / 2, y: wr * TILE + TILE / 2 })),
    wp: 1 % def.waypoints.length,
    state: STATE_PATROL,
    suspicion: 0,
    unseenFor: 0,
    pauseFor: 0,
    investigate: null,
    levelIndex,
  };
}

// Can this guard see the thief right now? Cone angle, range and cover all count.
export function guardSees(level, guard, thief) {
  const dx = thief.x - guard.x;
  const dy = thief.y - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > GUARD_SIGHT_RANGE) return 0;
  let angle = Math.atan2(dy, dx) - guard.dir;
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  if (Math.abs(angle) > GUARD_HALF_ANGLE) return 0;
  if (!hasLineOfSight(level, guard.x, guard.y, thief.x, thief.y)) return 0;
  // Closer and head-on is harder to miss; sneaking halves the pressure.
  const closeness = 1 - dist / GUARD_SIGHT_RANGE;
  return closeness * (thief.sneaking ? 0.5 : 1) * (thief.running ? 1.5 : 1);
}

function stepToward(level, guard, tx, ty, speed, dt) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 2) return true;
  const s = Math.min(dist, speed * dt);
  guard.dir = Math.atan2(dy, dx);
  const next = moveCircle(level, guard.x, guard.y, (dx / dist) * s, (dy / dist) * s, 13);
  guard.x = next.x;
  guard.y = next.y;
  return dist <= speed * dt + 2;
}

export function updateGuard(level, guard, thief, dt, events) {
  const seen = guardSees(level, guard, thief);
  if (seen > 0) {
    guard.suspicion = Math.min(100, guard.suspicion + SUSPICION_GAIN * (0.35 + seen) * dt);
    guard.unseenFor = 0;
    guard.investigate = { x: thief.x, y: thief.y };
    if (guard.suspicion >= 100 && guard.state !== STATE_CHASE) {
      guard.state = STATE_CHASE;
      events.push({ type: 'alarm', x: guard.x, y: guard.y });
    } else if (guard.suspicion >= 50 && guard.state === STATE_PATROL) {
      guard.state = STATE_CURIOUS;
      events.push({ type: 'spotted', x: guard.x, y: guard.y });
    }
  } else {
    guard.suspicion = Math.max(0, guard.suspicion - SUSPICION_DECAY * dt);
    guard.unseenFor += dt;
    if (guard.state === STATE_CHASE && guard.unseenFor > ALARM_COOLDOWN) {
      guard.state = STATE_SEARCH;
      guard.investigate = { x: thief.x, y: thief.y };
    }
    if (guard.state === STATE_CURIOUS && guard.suspicion < 25) {
      guard.state = STATE_PATROL;
      guard.investigate = null;
    }
  }

  // Running footsteps carry: a guard close enough walks over to listen.
  if (thief.running && thief.moving) {
    const d = Math.hypot(thief.x - guard.x, thief.y - guard.y);
    if (d < GUARD_HEAR_RADIUS && guard.state === STATE_PATROL) {
      guard.state = STATE_CURIOUS;
      guard.investigate = { x: thief.x, y: thief.y };
      events.push({ type: 'heard', x: guard.x, y: guard.y });
    }
  }

  if (guard.state === STATE_CHASE) {
    stepToward(level, guard, thief.x, thief.y, GUARD_CHASE_SPEED, dt);
    return;
  }
  if (guard.state === STATE_CURIOUS || guard.state === STATE_SEARCH) {
    const target = guard.investigate;
    if (target && stepToward(level, guard, target.x, target.y, guard.state === STATE_CURIOUS ? GUARD_SEARCH_SPEED : GUARD_PATROL_SPEED, dt)) {
      guard.pauseFor = 1.2;
      guard.investigate = null;
      guard.state = guard.state === STATE_SEARCH ? STATE_PATROL : STATE_CURIOUS;
    }
    if (guard.pauseFor > 0) {
      guard.pauseFor -= dt;
      if (guard.pauseFor <= 0 && guard.state === STATE_CURIOUS && guard.suspicion < 50) {
        guard.state = STATE_PATROL;
      }
    }
    return;
  }

  // Patrol: walk the waypoints, pausing at each post to look around.
  if (guard.pauseFor > 0) {
    guard.pauseFor -= dt;
    guard.dir += dt * 0.9; // scan the room while waiting
    return;
  }
  const target = guard.waypoints[guard.wp];
  if (stepToward(level, guard, target.x, target.y, GUARD_PATROL_SPEED, dt)) {
    guard.wp = (guard.wp + 1) % guard.waypoints.length;
    guard.pauseFor = 0.8;
  }
}
