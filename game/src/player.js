// The thief: movement, sneaking, noise, loot and the exit.
import { SNEAK_SPEED, WALK_SPEED } from './config.js';
import { moveCircle } from './world.js';

export function createThief(start) {
  return {
    x: start.x,
    y: start.y,
    dir: 0,
    moving: false,
    sneaking: false,
    running: false,
    loot: 0,
    stepPhase: 0,
  };
}

export function updateThief(level, thief, input, dt) {
  const mx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const my = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  thief.moving = mx !== 0 || my !== 0;
  thief.sneaking = Boolean(input.sneak);
  thief.running = thief.moving && !thief.sneaking;
  if (!thief.moving) return;
  const len = Math.hypot(mx, my);
  const speed = thief.sneaking ? SNEAK_SPEED : WALK_SPEED;
  const dx = (mx / len) * speed * dt;
  const dy = (my / len) * speed * dt;
  thief.dir = Math.atan2(dy, dx);
  const next = moveCircle(level, thief.x, thief.y, dx, dy, 13);
  thief.x = next.x;
  thief.y = next.y;
  thief.stepPhase += dt * (thief.sneaking ? 5 : 9);
}

// Pick up any artifact within reach. Returns how many were taken.
export function collectLoot(thief, loot) {
  let taken = 0;
  for (const item of loot) {
    if (item.taken) continue;
    if (Math.hypot(item.x - thief.x, item.y - thief.y) < 26) {
      item.taken = true;
      thief.loot += 1;
      taken += 1;
    }
  }
  return taken;
}

export function atExit(thief, exit, lootTotal) {
  if (thief.loot < lootTotal) return false;
  return Math.hypot(exit.x - thief.x, exit.y - thief.y) < 28;
}
