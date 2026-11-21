// Geometry for sight and sound: whether a straight line is blocked by a wall or a piece
// of tall furniture, whether a point sits inside a guard's vision cone, and whether two
// circles touch. Nothing here knows about cats or guards; it only answers geometry.

/** True when the segment (x1,y1)-(x2,y2) touches or crosses the rectangle. */
export function segmentHitsRect(x1, y1, x2, y2, rect) {
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);
  if (maxX < rect.x || minX > rect.x + rect.w || maxY < rect.y || minY > rect.y + rect.h) return false;
  if (pointInRect(x1, y1, rect) || pointInRect(x2, y2, rect)) return true;
  const edges = [
    [rect.x, rect.y, rect.x + rect.w, rect.y],
    [rect.x + rect.w, rect.y, rect.x + rect.w, rect.y + rect.h],
    [rect.x + rect.w, rect.y + rect.h, rect.x, rect.y + rect.h],
    [rect.x, rect.y + rect.h, rect.x, rect.y],
  ];
  for (let i = 0; i < edges.length; i += 1) {
    if (segmentsCross(x1, y1, x2, y2, edges[i][0], edges[i][1], edges[i][2], edges[i][3])) return true;
  }
  return false;
}

export function pointInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

function segmentsCross(ax, ay, bx, by, cx, cy, dx, dy) {
  const d1 = direction(cx, cy, dx, dy, ax, ay);
  const d2 = direction(cx, cy, dx, dy, bx, by);
  const d3 = direction(ax, ay, bx, by, cx, cy);
  const d4 = direction(ax, ay, bx, by, dx, dy);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

function direction(ax, ay, bx, by, cx, cy) {
  return (cx - ax) * (by - ay) - (bx - ax) * (cy - ay);
}

/**
 * True when `from` can see `to`: inside range, inside the cone half-angle around
 * `facing`, and no wall or tall furniture between them.
 */
export function canSee(from, to, facing, range, halfAngle, blockers) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.hypot(dx, dy);
  if (distance > range) return false;
  if (distance < 1) return true;
  const angle = Math.atan2(dy, dx);
  let diff = angle - facing;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  if (Math.abs(diff) > halfAngle) return false;
  for (let i = 0; i < blockers.length; i += 1) {
    if (segmentHitsRect(from.x, from.y, to.x, to.y, blockers[i])) return false;
  }
  return true;
}

/** True when the line between two points is not blocked by any rectangle. */
export function lineClear(x1, y1, x2, y2, blockers) {
  for (let i = 0; i < blockers.length; i += 1) {
    if (segmentHitsRect(x1, y1, x2, y2, blockers[i])) return false;
  }
  return true;
}

/** Distance between two points. */
export function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Push a circle out of every rectangle it overlaps. Returns true when anything moved it.
 * Walls and furniture are solid for cats, dogs and pebbles alike.
 */
export function resolveCircleRects(body, blockers) {
  let moved = false;
  for (let i = 0; i < blockers.length; i += 1) {
    const r = blockers[i];
    const nearX = Math.max(r.x, Math.min(body.x, r.x + r.w));
    const nearY = Math.max(r.y, Math.min(body.y, r.y + r.h));
    const dx = body.x - nearX;
    const dy = body.y - nearY;
    const d = Math.hypot(dx, dy);
    if (d >= body.radius) continue;
    moved = true;
    if (d > 0.001) {
      body.x = nearX + (dx / d) * body.radius;
      body.y = nearY + (dy / d) * body.radius;
    } else {
      // Centre inside the rectangle: shove out along the shallowest side.
      const left = body.x - r.x;
      const right = r.x + r.w - body.x;
      const top = body.y - r.y;
      const bottom = r.y + r.h - body.y;
      const min = Math.min(left, right, top, bottom);
      if (min === left) body.x = r.x - body.radius;
      else if (min === right) body.x = r.x + r.w + body.radius;
      else if (min === top) body.y = r.y - body.radius;
      else body.y = r.y + r.h + body.radius;
    }
  }
  return moved;
}
