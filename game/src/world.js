// Levels and the tile map: walls, cover, loot, exit, spawns.
// Tiles: '#' wall, 'C' crate (tall cover, blocks sight and movement),
// 'B' bench (low cover, blocks sight and movement), 'L' artifact,
// 'E' exit, 'P' thief start, 'G' guard post, '.' open floor.
import { TILE } from './config.js';

export const LEVELS = [
  {
    name: 'Wing One — The Marble Hall',
    hint: 'Two guards, three artifacts. Crates and benches break their line of sight.',
    map: [
      '########################',
      '#P.....#......L........#',
      '#......#......######...#',
      '#..C...#......#....#...#',
      '#......#..G...#....#.L.#',
      '#......#......#....#...#',
      '###.####..C...#....#...#',
      '#......#......#....#...#',
      '#..L...#..C.......#....#',
      '#......#......######...#',
      '#..B...#......#........#',
      '#......#..G...#...C....#',
      '#......#......#........#',
      '#..C........L.....B...E#',
      '#......................#',
      '########################',
    ],
    guards: [
      { waypoints: [[10, 4], [10, 11], [17, 11], [17, 4]] },
      { waypoints: [[4, 1], [4, 12], [11, 12], [11, 1]] },
    ],
  },
  {
    name: 'Wing Two — The Jade Gallery',
    hint: 'Three guards cross patrols. Sneak (hold Shift) to shrink your footprint.',
    map: [
      '########################',
      '#P....#....L.....#.....#',
      '#.....#..........#..L..#',
      '#..C..#..####....#.....#',
      '#.....#..#..#....#..C..#',
      '#.....#..#..#....#.....#',
      '#..B.....#..#....#.....#',
      '####.#####..#....#..####',
      '#.....#..#..#....#.....#',
      '#..L..#..#..#....#..L..#',
      '#.....#..#..#....#.....#',
      '#..C..#..####....#..C..#',
      '#.....#..........#.....#',
      '#..B......G....G......E#',
      '#......................#',
      '########################',
    ],
    guards: [
      { waypoints: [[3, 2], [20, 2], [20, 12], [3, 12]] },
      { waypoints: [[12, 1], [12, 13], [6, 13], [6, 2]] },
      { waypoints: [[18, 6], [18, 10], [10, 10], [10, 6]] },
    ],
  },
  {
    name: 'Wing Three — The Vault Floor',
    hint: 'Four guards, five artifacts, one way out. Patience beats speed.',
    map: [
      '########################',
      '#P..#....L....#....L...#',
      '#...#.........#........#',
      '#.C.#..####...#..####..#',
      '#...#..#..#...#..#..#..#',
      '#...#..#..#...#..#..#..#',
      '#.B....#..#...#..#..#..#',
      '##.#####..#...#..#..#..#',
      '#...#.....#...#..#..#..#',
      '#.L.#..C..#...#..#..#.L#',
      '#...#.....#...#..#..#..#',
      '#...#..####...#..####..#',
      '#...#.........#........#',
      '#.C....G...G.....G...#E#',
      '#......................#',
      '########################',
    ],
    guards: [
      { waypoints: [[2, 2], [21, 2], [20, 13], [3, 13]] },
      { waypoints: [[8, 2], [8, 12], [16, 12], [16, 2]] },
      { waypoints: [[5, 6], [18, 6], [18, 9], [5, 9]] },
      { waypoints: [[12, 1], [12, 13], [19, 13], [19, 1]] },
    ],
  },
];

export function tileAt(level, col, row) {
  if (row < 0 || row >= level.map.length) return '#';
  const line = level.map[row];
  if (col < 0 || col >= line.length) return '#';
  return line[col];
}

export function blocksSight(tile) {
  return tile === '#' || tile === 'C' || tile === 'B';
}

export function blocksMove(tile) {
  return tile === '#' || tile === 'C' || tile === 'B';
}

// True when no wall or cover stands between two points (sampled along the ray).
export function hasLineOfSight(level, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 6));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const col = Math.floor((ax + dx * t) / TILE);
    const row = Math.floor((ay + dy * t) / TILE);
    if (blocksSight(tileAt(level, col, row))) return false;
  }
  return true;
}

// Circle-vs-tile collision: slide along walls, stop at cover.
export function moveCircle(level, x, y, dx, dy, radius) {
  let nx = x + dx;
  if (collides(level, nx, y, radius)) nx = x;
  let ny = y + dy;
  if (collides(level, nx, ny, radius)) ny = y;
  return { x: nx, y: ny };
}

function collides(level, x, y, radius) {
  const c0 = Math.floor((x - radius) / TILE);
  const c1 = Math.floor((x + radius) / TILE);
  const r0 = Math.floor((y - radius) / TILE);
  const r1 = Math.floor((y + radius) / TILE);
  for (let row = r0; row <= r1; row++) {
    for (let col = c0; col <= c1; col++) {
      if (!blocksMove(tileAt(level, col, row))) continue;
      const bx = Math.max(col * TILE, Math.min(x, col * TILE + TILE));
      const by = Math.max(row * TILE, Math.min(y, row * TILE + TILE));
      if ((x - bx) ** 2 + (y - by) ** 2 < radius * radius) return true;
    }
  }
  return false;
}

// Find every artifact, the exit and the thief start of a level.
export function scanLevel(level) {
  const loot = [];
  let exit = { x: 0, y: 0 };
  let start = { x: TILE * 1.5, y: TILE * 1.5 };
  level.map.forEach((line, row) => {
    for (let col = 0; col < line.length; col++) {
      const cx = col * TILE + TILE / 2;
      const cy = row * TILE + TILE / 2;
      if (line[col] === 'L') loot.push({ x: cx, y: cy, taken: false });
      if (line[col] === 'E') exit = { x: cx, y: cy };
      if (line[col] === 'P') start = { x: cx, y: cy };
    }
  });
  return { loot, exit, start };
}
