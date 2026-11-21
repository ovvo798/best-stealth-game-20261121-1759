// Shared tuning for Night Shift: The Gallery Heist.
// All distances are pixels on a 960 x 640 playfield; one tile is 40 px.
export const TILE = 40;
export const VIEW_W = 960;
export const VIEW_H = 640;
export const BEST_KEY = 'night-shift-heist-best';

// Movement (pixels per second).
export const WALK_SPEED = 150;
export const SNEAK_SPEED = 82;
export const GUARD_PATROL_SPEED = 62;
export const GUARD_CHASE_SPEED = 132;
export const GUARD_SEARCH_SPEED = 88;

// Vision: how far a guard sees and how wide the cone is.
export const GUARD_SIGHT_RANGE = 205;
export const GUARD_HALF_ANGLE = 0.62; // radians, about 35 degrees
export const GUARD_HEAR_RADIUS = 130; // running footsteps carry this far

// Suspicion: 0..100. 50 makes a guard curious, 100 raises the alarm.
export const SUSPICION_GAIN = 95; // per second at point blank, scaled by distance
export const SUSPICION_DECAY = 16; // per second while unseen
export const ALARM_COOLDOWN = 6; // seconds out of sight before the alarm drops
export const CATCH_RADIUS = 22; // a guard this close catches the thief

export const STEP = 1 / 60;
