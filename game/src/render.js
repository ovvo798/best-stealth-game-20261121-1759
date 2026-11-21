// Canvas painting: the museum floor, walls and cover, guard vision cones,
// the thief, the artifacts, the exit and the HUD. Cones are lit where a
// guard can see and dark where cover hides you — light is the readable
// safety signal. Screens: title, play, paused, caught, level clear, win.
import { GUARD_HALF_ANGLE, GUARD_SIGHT_RANGE, TILE, VIEW_H, VIEW_W } from './config.js';
import { blocksSight, tileAt } from './world.js';
import { STATE_CHASE, STATE_CURIOUS } from './guards.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_CAUGHT = 'caught';
export const SCREEN_CLEAR = 'clear';
export const SCREEN_WIN = 'win';

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  function fit() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(canvas.width / VIEW_W, 0, 0, canvas.height / VIEW_H, 0, 0);
  }

  function drawFloor(level) {
    ctx.fillStyle = '#1d2138';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    for (let row = 0; row < level.map.length; row++) {
      for (let col = 0; col < level.map[row].length; col++) {
        const tile = level.map[row][col];
        const x = col * TILE;
        const y = row * TILE;
        if (tile === '#') {
          ctx.fillStyle = '#3a3f5e';
          ctx.fillRect(x, y, TILE, TILE);
          ctx.fillStyle = '#4a5070';
          ctx.fillRect(x, y, TILE, 5);
        } else {
          ctx.fillStyle = (col + row) % 2 === 0 ? '#232744' : '#20243d';
          ctx.fillRect(x, y, TILE, TILE);
          ctx.strokeStyle = 'rgba(255,255,255,0.04)';
          ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
        }
        if (tile === 'C') {
          ctx.fillStyle = '#7a5a33';
          ctx.fillRect(x + 4, y + 4, TILE - 8, TILE - 8);
          ctx.fillStyle = '#9a743f';
          ctx.fillRect(x + 4, y + 4, TILE - 8, 6);
          ctx.strokeStyle = '#5a4023';
          ctx.strokeRect(x + 4.5, y + 4.5, TILE - 9, TILE - 9);
        }
        if (tile === 'B') {
          ctx.fillStyle = '#5e2f45';
          ctx.fillRect(x + 3, y + 12, TILE - 6, TILE - 24);
          ctx.fillStyle = '#7a3f5c';
          ctx.fillRect(x + 3, y + 12, TILE - 6, 5);
        }
      }
    }
  }

  // A guard's vision cone, clipped by walls: march rays across the cone
  // and stop each one where cover blocks the sight line.
  function drawCone(level, guard, alert) {
    const steps = 36;
    ctx.beginPath();
    ctx.moveTo(guard.x, guard.y);
    for (let i = 0; i <= steps; i++) {
      const a = guard.dir - GUARD_HALF_ANGLE + (2 * GUARD_HALF_ANGLE * i) / steps;
      let r = GUARD_SIGHT_RANGE;
      for (let d = 10; d <= GUARD_SIGHT_RANGE; d += 4) {
        const px = guard.x + Math.cos(a) * d;
        const py = guard.y + Math.sin(a) * d;
        if (blocksSight(tileAt(level, Math.floor(px / TILE), Math.floor(py / TILE)))) { r = d; break; }
      }
      ctx.lineTo(guard.x + Math.cos(a) * r, guard.y + Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fillStyle = alert ? 'rgba(255, 64, 64, 0.30)' : 'rgba(255, 214, 90, 0.20)';
    ctx.fill();
    ctx.strokeStyle = alert ? 'rgba(255, 80, 80, 0.5)' : 'rgba(255, 214, 90, 0.35)';
    ctx.stroke();
  }

  function drawGuard(guard) {
    const alert = guard.state === STATE_CHASE;
    const curious = guard.state === STATE_CURIOUS;
    ctx.save();
    ctx.translate(guard.x, guard.y);
    ctx.fillStyle = alert ? '#e33' : curious ? '#f8a020' : '#3fae6a';
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#10131f';
    ctx.beginPath();
    ctx.arc(Math.cos(guard.dir) * 5, Math.sin(guard.dir) * 5, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = alert ? '#ff8080' : '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    // Suspicion arc above the guard's head.
    if (guard.suspicion > 2) {
      ctx.strokeStyle = guard.suspicion >= 100 ? '#ff4040' : guard.suspicion >= 50 ? '#f8a020' : '#ffd65a';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(guard.x, guard.y, 20, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * guard.suspicion) / 100);
      ctx.stroke();
    }
  }

  function drawThief(thief, time) {
    const bob = thief.moving ? Math.sin(thief.stepPhase) * 1.5 : 0;
    ctx.save();
    ctx.translate(thief.x, thief.y + bob);
    ctx.fillStyle = thief.sneaking ? '#7a6fd0' : '#8f7bff';
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#10131f';
    ctx.beginPath();
    ctx.arc(Math.cos(thief.dir) * 4, Math.sin(thief.dir) * 4, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d8ccff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    // Noise ring while running: what the guards can hear.
    if (thief.running && thief.moving) {
      const pulse = 60 + 14 * Math.sin(time * 6);
      ctx.strokeStyle = 'rgba(143, 123, 255, 0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(thief.x, thief.y, pulse, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function drawLoot(loot, time) {
    for (const item of loot) {
      if (item.taken) continue;
      const glow = 10 + 3 * Math.sin(time * 4 + item.x);
      ctx.fillStyle = 'rgba(255, 214, 90, 0.25)';
      ctx.beginPath();
      ctx.arc(item.x, item.y, glow + 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffd65a';
      ctx.save();
      ctx.translate(item.x, item.y);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-7, -7, 14, 14);
      ctx.restore();
      ctx.fillStyle = '#7a5a00';
      ctx.beginPath();
      ctx.arc(item.x, item.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawExit(exit, open, time) {
    ctx.save();
    ctx.translate(exit.x, exit.y);
    ctx.fillStyle = open ? 'rgba(80, 255, 160, 0.30)' : 'rgba(120, 120, 140, 0.20)';
    ctx.fillRect(-TILE / 2 + 3, -TILE / 2 + 3, TILE - 6, TILE - 6);
    ctx.strokeStyle = open ? '#50ffa0' : '#888';
    ctx.lineWidth = 3;
    ctx.strokeRect(-TILE / 2 + 3, -TILE / 2 + 3, TILE - 6, TILE - 6);
    ctx.fillStyle = open ? '#50ffa0' : '#aaa';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (open) ctx.fillText('EXIT', 0, 0);
    ctx.restore();
  }

  function drawHud(state, levelIndex, alarm) {
    ctx.fillStyle = 'rgba(8, 10, 22, 0.85)';
    ctx.fillRect(0, 0, VIEW_W, 46);
    ctx.fillStyle = '#e8eaf6';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(state.levelName, 14, 24);
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#ffd65a';
    ctx.fillText(`Artifacts ${state.loot}/${state.lootTotal}`, 330, 24);
    ctx.fillStyle = '#9aa0c3';
    ctx.fillText(`Time ${Math.floor(state.time)}s`, 500, 24);
    ctx.fillStyle = alarm ? '#ff5050' : '#50ffa0';
    ctx.fillText(alarm ? 'ALARM — RUN!' : 'UNSEEN', 620, 24);
    // Overall suspicion: the loudest guard's meter.
    const s = state.maxSuspicion;
    ctx.fillStyle = '#333';
    ctx.fillRect(760, 10, 180, 16);
    ctx.fillStyle = s >= 100 ? '#ff4040' : s >= 50 ? '#f8a020' : '#ffd65a';
    ctx.fillRect(760, 10, 180 * (s / 100), 16);
    ctx.strokeStyle = '#888';
    ctx.strokeRect(760.5, 10.5, 180, 16);
    ctx.fillStyle = '#e8eaf6';
    ctx.font = '12px sans-serif';
    ctx.fillText('Suspicion', 760, 40);
  }

  function overlay(title, lines, accent) {
    ctx.fillStyle = 'rgba(5, 7, 16, 0.78)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.textAlign = 'center';
    ctx.fillStyle = accent;
    ctx.font = 'bold 44px sans-serif';
    ctx.fillText(title, VIEW_W / 2, 220);
    ctx.fillStyle = '#e8eaf6';
    ctx.font = '19px sans-serif';
    lines.forEach((line, i) => ctx.fillText(line, VIEW_W / 2, 280 + i * 32));
  }

  return {
    fit,
    draw(state, screen, time) {
      fit();
      if (screen === SCREEN_TITLE) {
        drawFloor(state.level);
        for (const g of state.guards) drawCone(state.level, g, false);
        for (const g of state.guards) drawGuard(g);
        drawLoot(state.loot, time);
        drawExit(state.exit, false, time);
        overlay('NIGHT SHIFT', [
          'The Gallery Heist — steal every artifact, reach the exit unseen.',
          'WASD / arrows to move · hold Shift to sneak · running is loud.',
          'Guards patrol — learn their routes. Their cones are what they see.',
          'Suspicion fills in the light and fades in cover. 100 means alarm.',
          'Press Enter or click to begin · P pauses · M mutes',
        ], '#ffd65a');
        return;
      }
      drawFloor(state.level);
      for (const g of state.guards) drawCone(state.level, g, g.state === STATE_CHASE);
      drawLoot(state.loot, time);
      drawExit(state.exit, state.lootTaken >= state.lootTotal, time);
      for (const g of state.guards) drawGuard(g);
      drawThief(state.thief, time);
      const alarm = state.guards.some((g) => g.state === STATE_CHASE);
      drawHud({ ...state, maxSuspicion: Math.max(0, ...state.guards.map((g) => g.suspicion)), loot: state.lootTaken, lootTotal: state.lootTotal }, state.levelIndex, alarm);
      if (screen === SCREEN_PAUSED) {
        overlay('PAUSED', ['Take a breath. The guards wait for no one.', 'Press P or Enter to resume.'], '#9aa0c3');
      } else if (screen === SCREEN_CAUGHT) {
        overlay('CAUGHT!', ['A guard laid hands on you. The night resets.', 'Press Enter to try this wing again.'], '#ff5050');
      } else if (screen === SCREEN_CLEAR) {
        overlay('WING CLEARED', [`Every artifact is yours. ${state.clearNote}`, 'Press Enter for the next wing.'], '#50ffa0');
      } else if (screen === SCREEN_WIN) {
        overlay('THE PERFECT HEIST', [`All ${state.lootTotalAll} artifacts, ${Math.floor(state.time)} seconds, never caught.`, `Best clear: ${state.best}s — press Enter to play again.`], '#ffd65a');
      }
    },
  };
}
