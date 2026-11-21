// Guard dogs: patrol, suspicion, investigation and the alarm. A guard's only memory is
// its suspicion (0-100), the last place it saw or heard something, and where it was going.
// The detection rules live here; the geometry they ask about lives in vision.js.

import { GUARD } from './config.js';
import { canSee, distance, lineClear, resolveCircleRects } from './vision.js';

export const GUARD_PATROL = 'patrol';
export const GUARD_CURIOUS = 'curious';
export const GUARD_CHASE = 'chase';

/** Build a guard from a level's guard definition. */
export function createGuard(def, index) {
  return {
    id: index,
    x: def.x,
    y: def.y,
    radius: GUARD.radius,
    facing: 0,
    waypoints: def.waypoints.map((w) => ({ x: w.x, y: w.y })),
    waypointIndex: 1,
    state: GUARD_PATROL,
    suspicion: 0,
    pauseLeft: 0,
    /** Where the guard is walking to while curious or chasing. */
    target: null,
    /** Seconds since this guard last saw the cat. */
    unseenFor: 0,
    /** Slow look-around spin while paused at a waypoint. */
    scanAngle: 0,
    /** Seconds left of the look-around sweep while investigating. */
    lookLeft: 0,
  };
}

/** How fast suspicion climbs while this guard can see the cat. */
function spotGain(guard, player, level) {
  const d = distance(guard, player);
  const closeness = 1 - d / GUARD.coneRange;
  let gain = GUARD.spotRate * (0.35 + 0.65 * closeness);
  if (player.sneaking) gain *= 0.45;
  if (player.dashing) gain *= 1.7;
  if (inShadow(player, level)) gain *= 0.45;
  if (inLight(player, level)) gain *= 1.45;
  return gain;
}

export function inShadow(point, level) {
  for (let i = 0; i < level.shadows.length; i += 1) {
    const s = level.shadows[i];
    if (Math.hypot(point.x - s.x, point.y - s.y) < s.r) return true;
  }
  return false;
}

export function inLight(point, level) {
  for (let i = 0; i < level.lights.length; i += 1) {
    const l = level.lights[i];
    if (Math.hypot(point.x - l.x, point.y - l.y) < l.r) return true;
  }
  return false;
}

function moveToward(guard, tx, ty, speed, dt, blockers) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const d = Math.hypot(dx, dy);
  if (d < 2) return true;
  const step = Math.min(d, speed * dt);
  guard.x += (dx / d) * step;
  guard.y += (dy / d) * step;
  guard.facing = Math.atan2(dy, dx);
  resolveCircleRects(guard, blockers);
  return d - step < 2;
}

/**
 * Advance one guard one step. `events` is the shared level event list: the guard pushes
 * 'alarm' when its suspicion first hits the top, and 'heard' when it starts investigating.
 * Returns nothing; the caller reads guard.state and guard.suspicion.
 */
export function updateGuard(guard, dt, player, level, blockers, events) {
  const sees = canSee(guard, player, guard.facing, GUARD.coneRange, GUARD.coneHalfAngle, blockers);
  if (sees) {
    guard.suspicion = Math.min(GUARD.alarmAt, guard.suspicion + spotGain(guard, player, level) * dt);
    guard.unseenFor = 0;
    guard.target = { x: player.x, y: player.y };
  } else {
    guard.suspicion = Math.max(0, guard.suspicion - GUARD.calmRate * dt);
    guard.unseenFor += dt;
  }

  if (guard.suspicion >= GUARD.alarmAt && guard.state !== GUARD_CHASE) {
    guard.state = GUARD_CHASE;
    guard.unseenFor = 0;
    events.push({ type: 'alarm', guard });
  }
  if (guard.state === GUARD_PATROL && guard.suspicion >= GUARD.curiousAt) {
    guard.state = GUARD_CURIOUS;
    guard.lookLeft = 2.5;
    events.push({ type: 'heard', guard });
  }
  if (guard.state === GUARD_CURIOUS && guard.suspicion < 12) {
    guard.state = GUARD_PATROL;
    guard.target = null;
  }

  if (guard.state === GUARD_CHASE) {
    // Chase the last seen spot; while the cat is visible the target keeps updating.
    const target = guard.target ?? { x: player.x, y: player.y };
    moveToward(guard, target.x, target.y, GUARD.chaseSpeed, dt, blockers);
    if (!sees && guard.unseenFor > GUARD.alarmCool) {
      guard.state = GUARD_PATROL;
      guard.suspicion = 30;
      guard.target = null;
    }
    return;
  }

  if (guard.state === GUARD_CURIOUS) {
    if (guard.target) {
      const arrived = moveToward(guard, guard.target.x, guard.target.y, GUARD.investigateSpeed, dt, blockers);
      if (arrived) {
        guard.lookLeft -= dt;
        guard.facing += dt * 1.8;
        if (guard.lookLeft <= 0) {
          guard.state = GUARD_PATROL;
          guard.target = null;
        }
      }
    }
    return;
  }

  // Patrol: walk the waypoint loop, pausing at each stop to look around.
  if (guard.pauseLeft > 0) {
    guard.pauseLeft -= dt;
    guard.facing += dt * 0.9;
    return;
  }
  const next = guard.waypoints[guard.waypointIndex];
  const arrived = moveToward(guard, next.x, next.y, GUARD.patrolSpeed, dt, blockers);
  if (arrived) {
    guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
    guard.pauseLeft = GUARD.pauseTime;
  }
}

/** Send a guard to investigate a noise at (x, y) when it is close enough to hear it. */
export function guardHears(guard, x, y, radius) {
  if (guard.state === GUARD_CHASE) return;
  if (distance(guard, { x, y }) > radius) return;
  if (guard.state === GUARD_PATROL || guard.suspicion < GUARD.curiousAt) {
    guard.state = GUARD_CURIOUS;
    guard.suspicion = Math.max(guard.suspicion, 40);
    guard.target = { x, y };
    guard.lookLeft = 2.5;
  }
}

/** True when any guard is close enough to catch the cat right now. */
export function guardCatches(guard, player) {
  return guard.state === GUARD_CHASE && distance(guard, player) < GUARD.catchDistance;
}

/** The highest suspicion among the guards: what the HUD meter shows. */
export function worstSuspicion(guards) {
  let worst = 0;
  for (let i = 0; i < guards.length; i += 1) worst = Math.max(worst, guards[i].suspicion);
  return worst;
}

/** True when at least one guard is chasing. */
export function anyChasing(guards) {
  for (let i = 0; i < guards.length; i += 1) {
    if (guards[i].state === GUARD_CHASE) return true;
  }
  return false;
}
