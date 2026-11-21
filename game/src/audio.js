// All sound is synthesised with WebAudio — no audio files. A tiny helper builds short
// oscillator notes; the game calls the named sounds (footstep, alert, pickup, caught,
// win, pebble) and the mute toggle. The context is created on the first user gesture,
// so the page stays silent until play starts.

export function createAudio() {
  return {
    context: null,
    muted: false,
    padNodes: null,
  };
}

function ensure(audio) {
  if (audio.muted) return null;
  try {
    if (!audio.context) audio.context = new (window.AudioContext || window.webkitAudioContext)();
    if (audio.context.state === 'suspended') void audio.context.resume();
    return audio.context;
  } catch {
    return null;
  }
}

function tone(audio, frequency, duration, type, volume, when = 0, slideTo = null) {
  const ctx = ensure(audio);
  if (!ctx) return;
  const start = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, start);
  if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(slideTo, start + duration);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.05);
}

export const soundStep = (audio) => tone(audio, 180, 0.07, 'triangle', 0.05);
export const soundDash = (audio) => tone(audio, 300, 0.22, 'sawtooth', 0.05, 0, 900);
export const soundPebble = (audio) => tone(audio, 900, 0.08, 'square', 0.04, 0, 500);
export const soundLand = (audio) => tone(audio, 140, 0.1, 'triangle', 0.09);
export const soundPickup = (audio) => {
  tone(audio, 660, 0.12, 'sine', 0.09);
  tone(audio, 990, 0.16, 'sine', 0.09, 0.09);
};
export const soundAlert = (audio) => {
  tone(audio, 220, 0.16, 'square', 0.07);
  tone(audio, 330, 0.2, 'square', 0.07, 0.14);
};
export const soundCaught = (audio) => {
  tone(audio, 392, 0.18, 'sawtooth', 0.08);
  tone(audio, 262, 0.22, 'sawtooth', 0.08, 0.16);
  tone(audio, 175, 0.34, 'sawtooth', 0.08, 0.36);
};
export const soundWin = (audio) => {
  tone(audio, 523, 0.14, 'sine', 0.09);
  tone(audio, 659, 0.14, 'sine', 0.09, 0.12);
  tone(audio, 784, 0.22, 'sine', 0.09, 0.24);
  tone(audio, 1047, 0.3, 'sine', 0.09, 0.38);
};

/** A soft two-note night pad that hums under play; started once, stopped on mute. */
export function startPad(audio) {
  const ctx = ensure(audio);
  if (!ctx || audio.padNodes) return;
  const gain = ctx.createGain();
  gain.gain.value = 0.018;
  gain.connect(ctx.destination);
  const nodes = [110, 165].map((freq) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    osc.start();
    return osc;
  });
  audio.padNodes = { gain, nodes };
}

export function stopPad(audio) {
  if (!audio.padNodes) return;
  try {
    audio.padNodes.nodes.forEach((node) => node.stop());
    audio.padNodes.gain.disconnect();
  } catch {
    // Already stopped.
  }
  audio.padNodes = null;
}

export function toggleMute(audio) {
  audio.muted = !audio.muted;
  if (audio.muted) stopPad(audio);
  return audio.muted;
}
