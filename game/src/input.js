// Keyboard and mouse input. WASD or arrows move, Shift sneaks,
// click a floor tile to walk toward it, P pauses, M mutes, Enter confirms.
export const ACTION_CONFIRM = 'confirm';
export const ACTION_PAUSE = 'pause';
export const ACTION_MUTE = 'mute';

export function createInput(canvas) {
  const keys = new Set();
  const state = {
    up: false, down: false, left: false, right: false,
    sneak: false, confirm: false, pause: false, mute: false,
    click: null, // {x, y} in canvas pixels, consumed by the loop
  };

  function refresh() {
    state.up = keys.has('KeyW') || keys.has('ArrowUp');
    state.down = keys.has('KeyS') || keys.has('ArrowDown');
    state.left = keys.has('KeyA') || keys.has('ArrowLeft');
    state.right = keys.has('KeyD') || keys.has('ArrowRight');
    state.sneak = keys.has('ShiftLeft') || keys.has('ShiftRight');
  }

  function press(action) {
    state[action] = true;
    setTimeout(() => { state[action] = false; }, 60);
  }

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    keys.add(event.code);
    if (event.code === 'Enter' || event.code === 'Space') { press(ACTION_CONFIRM); event.preventDefault(); }
    if (event.code === 'KeyP' || event.code === 'Escape') press(ACTION_PAUSE);
    if (event.code === 'KeyM') press(ACTION_MUTE);
    refresh();
  });
  window.addEventListener('keyup', (event) => {
    keys.delete(event.code);
    refresh();
  });
  window.addEventListener('blur', () => { keys.clear(); refresh(); });
  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    state.click = { x: event.clientX - rect.left, y: event.clientY - rect.top };
  });
  return state;
}
