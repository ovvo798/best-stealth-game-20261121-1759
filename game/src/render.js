// Everything the eye sees, drawn on one canvas. The field is a fixed 1280x720 logical
// area scaled to the window. Draw order matters: floor, light and shadow, vision cones,
// furniture and walls (which hide the cones behind them), then fish, exit, pebbles, the
// cat and the dogs, then the HUD and the screen overlays.

import { FIELD, FONT, GUARD, PALETTE } from './config.js';
import { GUARD_CHASE, GUARD_CURIOUS, inLight, inShadow } from './guards.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_CAUGHT = 'caught';
export const SCREEN_CLEAR = 'clear';
export const SCREEN_WIN = 'win';
export const SCREEN_OVER = 'over';

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  function fit() {
    const scale = Math.min(window.innerWidth / FIELD.width, window.innerHeight / FIELD.height);
    canvas.width = Math.floor(FIELD.width * scale);
    canvas.height = Math.floor(FIELD.height * scale);
    return scale;
  }

  function drawFloor(level) {
    ctx.fillStyle = PALETTE.floorA;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.fillStyle = PALETTE.floorB;
    for (let y = 0; y < FIELD.height; y += 48) {
      if ((y / 48) % 2 === 0) ctx.fillRect(0, y, FIELD.width, 24);
    }
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)';
    ctx.lineWidth = 1;
    for (let y = 0; y <= FIELD.height; y += 48) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(FIELD.width, y + 0.5);
      ctx.stroke();
    }
    // A rug in the middle of each room, where the lamplight falls.
    ctx.fillStyle = PALETTE.rug;
    ctx.fillRect(480, 260, 320, 200);
    ctx.strokeStyle = PALETTE.rugTrim;
    ctx.lineWidth = 6;
    ctx.strokeRect(480, 260, 320, 200);
  }

  function drawLightAndShadow(level) {
    for (const light of level.lights) {
      ctx.fillStyle = PALETTE.lightPool;
      ctx.beginPath();
      ctx.arc(light.x, light.y, light.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 196, 110, 0.25)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(light.x, light.y, light.r, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (const shadow of level.shadows) {
      ctx.fillStyle = PALETTE.shadow;
      ctx.beginPath();
      ctx.arc(shadow.x, shadow.y, shadow.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Moonlight through the window: a cool wash across the top of the room.
    ctx.fillStyle = PALETTE.moonPool;
    ctx.fillRect(24, 24, FIELD.width - 48, 120);
  }

  function drawCone(guard) {
    const range = GUARD.coneRange;
    const half = GUARD.coneHalfAngle;
    const colour = guard.state === GUARD_CHASE
      ? PALETTE.coneAlarm
      : guard.state === GUARD_CURIOUS
        ? PALETTE.coneCurious
        : PALETTE.coneCalm;
    ctx.fillStyle = colour;
    ctx.beginPath();
    ctx.moveTo(guard.x, guard.y);
    ctx.arc(guard.x, guard.y, range, guard.facing - half, guard.facing + half);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = guard.state === GUARD_CHASE ? 'rgba(255, 90, 78, 0.7)' : PALETTE.coneEdge;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(guard.x, guard.y);
    ctx.arc(guard.x, guard.y, range, guard.facing - half, guard.facing + half);
    ctx.closePath();
    ctx.stroke();
  }

  function drawFurniture(level) {
    for (const item of level.furniture) {
      const colour = item.kind === 'sofa'
        ? PALETTE.furnitureSoft
        : item.kind === 'plant'
          ? PALETTE.furnitureLeaf
          : item.kind === 'crate'
            ? PALETTE.furnitureCrate
            : PALETTE.furnitureWood;
      const top = item.kind === 'sofa'
        ? '#8f5a6e'
        : item.kind === 'plant'
          ? '#4f8150'
          : item.kind === 'crate'
            ? '#97804f'
            : PALETTE.furnitureWoodTop;
      roundRect(item.x, item.y, item.w, item.h, 8);
      ctx.fillStyle = colour;
      ctx.fill();
      roundRect(item.x + 5, item.y + 5, item.w - 10, item.h - 10, 6);
      ctx.fillStyle = top;
      ctx.fill();
      ctx.fillStyle = 'rgba(244, 234, 216, 0.75)';
      ctx.font = `600 11px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.label, item.x + item.w / 2, item.y + item.h / 2);
    }
    for (const wall of level.walls) {
      ctx.fillStyle = PALETTE.wall;
      ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
      ctx.fillStyle = PALETTE.wallTop;
      if (wall.h <= 26) ctx.fillRect(wall.x, wall.y, wall.w, 4);
      else ctx.fillRect(wall.x, wall.y, 4, wall.h);
    }
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawFish(fish, time) {
    const bob = Math.sin(time * 3 + fish.x) * 2;
    ctx.save();
    ctx.translate(fish.x, fish.y + bob);
    ctx.fillStyle = PALETTE.fish;
    ctx.beginPath();
    ctx.ellipse(0, 0, 13, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-11, 0);
    ctx.lineTo(-19, -6);
    ctx.lineTo(-19, 6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#12333d';
    ctx.beginPath();
    ctx.arc(6, -2, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Sparkle so a fish reads at a glance.
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.font = `14px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('✦', fish.x + 14, fish.y - 12 + bob);
  }

  function drawExit(level, time) {
    const exit = level.exit;
    const glow = 0.5 + Math.sin(time * 2.5) * 0.2;
    ctx.fillStyle = `rgba(159, 232, 112, ${glow * 0.25})`;
    ctx.fillRect(exit.x - 14, exit.y - 14, exit.w + 28, exit.h + 28);
    ctx.fillStyle = '#20242e';
    roundRect(exit.x, exit.y, exit.w, exit.h, 10);
    ctx.fill();
    ctx.strokeStyle = PALETTE.exitGlow;
    ctx.lineWidth = 3;
    roundRect(exit.x, exit.y, exit.w, exit.h, 10);
    ctx.stroke();
    ctx.fillStyle = PALETTE.exitGlow;
    ctx.font = `700 13px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('EXIT', exit.x + exit.w / 2, exit.y + exit.h / 2 - 6);
    ctx.font = `11px ${FONT}`;
    ctx.fillText('cat flap', exit.x + exit.w / 2, exit.y + exit.h / 2 + 10);
  }

  function drawPebble(pebble) {
    ctx.fillStyle = '#cfc4ae';
    ctx.beginPath();
    ctx.arc(pebble.x, pebble.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(207, 196, 174, 0.35)';
    ctx.beginPath();
    ctx.arc(pebble.x, pebble.y + 6, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawNoiseRing(noise, time) {
    const age = 1 - noise.ttl / noise.maxTtl;
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.5 * (1 - age)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(noise.x, noise.y, noise.radius * (0.3 + 0.7 * age), 0, Math.PI * 2);
    ctx.stroke();
  }

  function drawCat(player, time, exit) {
    const hidden = player.hidden;
    const atExit = player.x > exit.x - 24 && player.x < exit.x + exit.w + 24
      && player.y > exit.y - 24 && player.y < exit.y + exit.h + 24;
    ctx.save();
    if (hidden) ctx.globalAlpha = 0.85;
    ctx.translate(player.x, player.y);
    ctx.rotate(player.facing);
    // Tail.
    ctx.strokeStyle = PALETTE.catDark;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.quadraticCurveTo(-24, -8 - Math.sin(time * 6) * 3, -26, 6);
    ctx.stroke();
    // Body.
    ctx.fillStyle = PALETTE.cat;
    ctx.beginPath();
    ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
    ctx.fill();
    // Ears.
    ctx.fillStyle = PALETTE.catDark;
    ctx.beginPath();
    ctx.moveTo(6, -10);
    ctx.lineTo(12, -20);
    ctx.lineTo(16, -7);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(6, 10);
    ctx.lineTo(12, 20);
    ctx.lineTo(16, 7);
    ctx.closePath();
    ctx.fill();
    // Face: nose and eyes toward the direction of travel.
    ctx.fillStyle = '#2b1a12';
    ctx.beginPath();
    ctx.arc(12, 0, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(4, -6, 2, 0, Math.PI * 2);
    ctx.arc(4, 6, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    if (player.sneaking && !atExit) {
      ctx.fillStyle = 'rgba(244, 234, 216, 0.8)';
      ctx.font = `11px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('sneaking…', player.x, player.y - 24);
    }
  }

  function drawGuard(guard, time) {
    ctx.save();
    ctx.translate(guard.x, guard.y);
    ctx.rotate(guard.facing);
    ctx.fillStyle = PALETTE.dog;
    ctx.beginPath();
    ctx.arc(0, 0, guard.radius, 0, Math.PI * 2);
    ctx.fill();
    // Floppy ears.
    ctx.fillStyle = PALETTE.dogDark;
    ctx.beginPath();
    ctx.ellipse(-4, -13, 6, 9, 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-4, 13, 6, 9, -0.5, 0, Math.PI * 2);
    ctx.fill();
    // Snout and nose.
    ctx.fillStyle = '#6b5138';
    ctx.beginPath();
    ctx.ellipse(12, 0, 8, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1d1410';
    ctx.beginPath();
    ctx.arc(18, 0, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Suspicion arc above the head.
    if (guard.suspicion > 4) {
      const width = 34;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.fillRect(guard.x - width / 2, guard.y - guard.radius - 14, width, 6);
      ctx.fillStyle = guard.state === GUARD_CHASE ? PALETTE.danger : PALETTE.warn;
      ctx.fillRect(guard.x - width / 2, guard.y - guard.radius - 14, (width * guard.suspicion) / 100, 6);
    }
    const mark = guard.state === GUARD_CHASE ? '!' : guard.state === GUARD_CURIOUS ? '?' : '';
    if (mark) {
      ctx.fillStyle = guard.state === GUARD_CHASE ? PALETTE.danger : PALETTE.warn;
      ctx.font = `700 20px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(mark, guard.x, guard.y - guard.radius - 26);
    }
    void time;
  }

  function drawHud(state) {
    const { level, levelIndex, fishGot, fishTotal, pebblesLeft, lives, score, best, suspicion, alarm, timeLeft, ghost } = state;
    ctx.fillStyle = PALETTE.panel;
    ctx.fillRect(0, 0, FIELD.width, 40);
    ctx.fillStyle = PALETTE.text;
    ctx.font = `700 15px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(level.name, 16, 21);
    ctx.font = `14px ${FONT}`;
    ctx.fillStyle = PALETTE.muted;
    ctx.fillText(`Fish ${fishGot}/${fishTotal}   Pebbles ${pebblesLeft}   Lives ${'♥'.repeat(lives)}${'♡'.repeat(3 - lives)}`, 220, 21);
    ctx.textAlign = 'right';
    ctx.fillStyle = PALETTE.text;
    ctx.fillText(`Score ${score}   Best ${best}`, FIELD.width - 16, 21);
    // The suspicion meter: the one number the player watches.
    const meterW = 260;
    const meterX = FIELD.width / 2 - meterW / 2;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(meterX - 2, 8, meterW + 4, 24);
    const colour = alarm ? PALETTE.danger : suspicion >= 55 ? PALETTE.warn : PALETTE.ok;
    ctx.fillStyle = colour;
    ctx.fillRect(meterX, 10, (meterW * Math.min(100, suspicion)) / 100, 20);
    ctx.fillStyle = PALETTE.text;
    ctx.font = `700 12px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(alarm ? 'ALARM — RUN!' : suspicion >= 55 ? 'SUSPICIOUS…' : 'UNSEEN', FIELD.width / 2, 21);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `12px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText(`Time ${timeLeft}s`, 16, 58);
    if (ghost) {
      ctx.fillStyle = PALETTE.ok;
      ctx.textAlign = 'right';
      ctx.fillText('GHOST — never spotted', FIELD.width - 16, 58);
    }
    void levelIndex;
  }

  function drawHint(state) {
    ctx.fillStyle = 'rgba(20, 16, 28, 0.7)';
    ctx.fillRect(0, FIELD.height - 26, FIELD.width, 26);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `12px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      'WASD / arrows move · Hold Shift to sneak · Space to dash (loud!) · Click to throw a pebble · P pause · M mute',
      FIELD.width / 2,
      FIELD.height - 13,
    );
    void state;
  }

  function overlay(title, lines, accent) {
    ctx.fillStyle = 'rgba(10, 8, 18, 0.62)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.fillStyle = PALETTE.panel;
    roundRect(FIELD.width / 2 - 330, FIELD.height / 2 - 150, 660, 300, 14);
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    roundRect(FIELD.width / 2 - 330, FIELD.height / 2 - 150, 660, 300, 14);
    ctx.stroke();
    ctx.fillStyle = accent;
    ctx.font = `700 34px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, FIELD.width / 2, FIELD.height / 2 - 96);
    ctx.fillStyle = PALETTE.text;
    ctx.font = `16px ${FONT}`;
    lines.forEach((line, i) => {
      ctx.fillText(line, FIELD.width / 2, FIELD.height / 2 - 44 + i * 30);
    });
  }

  function drawTitle(state, time) {
    overlay('MOONLIGHT PANTRY', [
      'Miso the cat is hungry. Three fish, three houses,',
      'and dogs with very good eyes. Reach the cat flap unseen.',
      '',
      'Click or press Enter to start · Shift sneaks · Space dashes',
    ], PALETTE.exitGlow);
    void state;
    void time;
  }

  return {
    fit,
    /** Paint everything for the current screen. `state` is the game's draw state. */
    draw(state, screen, time) {
      const scale = fit();
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      const level = state.level;
      drawFloor(level);
      drawLightAndShadow(level);
      for (const guard of state.guards) drawCone(guard);
      drawFurniture(level);
      for (const fish of state.fish) {
        if (!fish.taken) drawFish(fish, time);
      }
      drawExit(level, time);
      for (const noise of state.noises) drawNoiseRing(noise, time);
      for (const pebble of state.pebbles) drawPebble(pebble);
      drawCat(state.player, time, level.exit);
      for (const guard of state.guards) drawGuard(guard, time);
      drawHud(state);
      if (screen === SCREEN_PLAY) drawHint(state);
      if (screen === SCREEN_TITLE) drawTitle(state, time);
      if (screen === SCREEN_PAUSED) {
        overlay('PAUSED', ['Take a breath. The dogs are waiting.', '', 'Press P or click to keep sneaking.'], PALETTE.warn);
      }
      if (screen === SCREEN_CAUGHT) {
        overlay('CAUGHT!', [
          `A dog got Miso. ${state.lives} ${state.lives === 1 ? 'life' : 'lives'} left.`,
          'The dogs settle back to their patrol…',
          '',
          'Click or press Enter to try the room again.',
        ], PALETTE.danger);
      }
      if (screen === SCREEN_CLEAR) {
        overlay('ROOM CLEAR!', [
          `Fish ${state.fishGot}/${state.fishTotal} · Score ${state.score}`,
          state.ghost ? 'Ghost bonus: never spotted. +150' : 'Spotted once — the ghost bonus slipped away.',
          '',
          'Click or press Enter for the next house.',
        ], PALETTE.ok);
      }
      if (screen === SCREEN_WIN) {
        overlay('EVERY FISH STOLEN!', [
          `Final score ${state.score} · Best ${state.best}`,
          'Miso naps in the sun, full and unseen.',
          '',
          'Click or press Enter to play again.',
        ], PALETTE.exitGlow);
      }
      if (screen === SCREEN_OVER) {
        overlay('THE DOGS WIN', [
          `Score ${state.score} · Best ${state.best}`,
          'Miso is back on the porch, plotting.',
          '',
          'Click or press Enter to try again.',
        ], PALETTE.danger);
      }
    },
  };
}
