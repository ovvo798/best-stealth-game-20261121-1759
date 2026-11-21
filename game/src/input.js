// Keyboard and mouse, read once a frame. Movement keys give a -1..1 direction; the
// action bits are edge-triggered (pressed this frame, then cleared), so a held key does
// not repeat a dash or a pause. A click is both "confirm" on menus and "throw a pebble"
// while playing — the game decides which, from the screen it is on.

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_DASH = 4;
export const ACTION_MUTE = 8;

export function createInput(canvas) {
  const keys = new Set();
  const state = {
    actions: 0,
    click: null,
    /** The mouse position in logical field coordinates, updated on every move. */
    mouse: { x: 640, y: 360 },
  };

  function toField(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = 1280 / rect.width;
    const scaleY = 720 / rect.height;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  }

  window.addEventListener('keydown', (event) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.key)) {
      event.preventDefault();
    }
    if (event.repeat) return;
    keys.add(event.key.toLowerCase());
    if (event.key === 'Enter' || event.key === ' ') state.actions |= ACTION_CONFIRM;
    if (event.key === 'p' || event.key === 'P' || event.key === 'Escape') state.actions |= ACTION_PAUSE;
    if (event.key === 'm' || event.key === 'M') state.actions |= ACTION_MUTE;
  });
  window.addEventListener('keyup', (event) => keys.delete(event.key.toLowerCase()));

  canvas.addEventListener('mousemove', (event) => {
    state.mouse = toField(event.clientX, event.clientY);
  });
  canvas.addEventListener('mousedown', (event) => {
    state.mouse = toField(event.clientX, event.clientY);
    state.click = { x: state.mouse.x, y: state.mouse.y };
    state.actions |= ACTION_CONFIRM;
  });

  return {
    /** Current movement direction from WASD or the arrow keys. */
    direction() {
      let x = 0;
      let y = 0;
      if (keys.has('a') || keys.has('arrowleft')) x -= 1;
      if (keys.has('d') || keys.has('arrowright')) x += 1;
      if (keys.has('w') || keys.has('arrowup')) y -= 1;
      if (keys.has('s') || keys.has('arrowdown')) y += 1;
      return { x, y };
    },
    sneaking() {
      return keys.has('shift');
    },
    dashHeld() {
      return keys.has(' ') || keys.has('spacebar');
    },
    takeActions() {
      const taken = state.actions;
      state.actions = 0;
      return taken;
    },
    takeClick() {
      const taken = state.click;
      state.click = null;
      return taken;
    },
    mouse() {
      return state.mouse;
    },
  };
}
