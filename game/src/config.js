// Every tuning number and colour in one place. The playfield is a fixed 1280x720 logical
// area; the renderer scales it to the window, so no rule below depends on the screen size.
// Theme: a cat burglar (a literal cat, Miso) sneaks through a moonlit house at night.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

export const PLAYER = {
  radius: 14,
  walkSpeed: 175,
  sneakSpeed: 98,
  dashSpeed: 430,
  dashTime: 0.18,
  dashCooldown: 1.1,
  /** Noise a dash makes, in pixels: guards inside it come to look. */
  dashNoise: 280,
  /** Noise of ordinary walking; sneaking makes none. */
  walkNoise: 55,
};

export const GUARD = {
  radius: 16,
  patrolSpeed: 72,
  investigateSpeed: 118,
  chaseSpeed: 188,
  /** How long a guard waits at each patrol waypoint, looking around. */
  pauseTime: 1.4,
  coneRange: 235,
  /** Half-angle of the vision cone, in radians. */
  coneHalfAngle: 0.62,
  /** Suspicion gained per second when the cat is dead-centre of a cone at point blank. */
  spotRate: 95,
  /** Suspicion lost per second while the cat is unseen. */
  calmRate: 26,
  /** Suspicion at which a guard leaves patrol to investigate the last seen spot. */
  curiousAt: 55,
  /** Suspicion at which the alarm sounds and the guard chases. */
  alarmAt: 100,
  /** Seconds of no sight before an alarm cools back down. */
  alarmCool: 4.5,
  /** Touch distance that gets the cat caught while a guard is chasing. */
  catchDistance: 24,
};

export const GAME = {
  lives: 3,
  pebblesPerLevel: 3,
  pebbleRange: 330,
  pebbleNoise: 300,
  fishPoints: 100,
  levelPoints: 200,
  ghostBonus: 150,
  /** Time bonus ticks down this many points a second after the level starts. */
  timeBonusRate: 4,
  timeBonusMax: 300,
};

export const PALETTE = {
  floorA: '#3a2f26',
  floorB: '#342a22',
  rug: '#472530',
  rugTrim: '#6b3a4a',
  wall: '#1d1826',
  wallTop: '#4a3f66',
  shadow: 'rgba(8, 10, 34, 0.55)',
  lightPool: 'rgba(255, 196, 110, 0.13)',
  moonPool: 'rgba(150, 180, 255, 0.10)',
  coneCalm: 'rgba(255, 214, 90, 0.20)',
  coneEdge: 'rgba(255, 214, 90, 0.55)',
  coneCurious: 'rgba(255, 150, 60, 0.26)',
  coneAlarm: 'rgba(255, 70, 60, 0.30)',
  furnitureWood: '#6b4a2f',
  furnitureWoodTop: '#8a613c',
  furnitureSoft: '#7a4a5e',
  furnitureLeaf: '#3f6b3a',
  furnitureCrate: '#7d6a45',
  cat: '#f2a541',
  catDark: '#c47f2a',
  dog: '#8a6a4f',
  dogDark: '#5f4632',
  fish: '#7fd4e8',
  exitGlow: '#9fe870',
  text: '#f4ead8',
  muted: '#b8a88f',
  panel: 'rgba(20, 16, 28, 0.88)',
  danger: '#ff5a4e',
  warn: '#ffb347',
  ok: '#9fe870',
};

export const FONT = '"Trebuchet MS", "Segoe UI", system-ui, sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'moonlight-pantry.best';
