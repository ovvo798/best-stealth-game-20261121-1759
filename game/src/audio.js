// Synthesised sound: no audio files, everything is WebAudio oscillators
// and filtered noise, created on the first user gesture.
export function createAudio() {
  let ctx = null;
  let muted = false;
  let hum = null;

  function ensure() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    // Low room tone so the gallery never feels silent.
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 55;
    gain.gain.value = 0.015;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    hum = gain;
    return ctx;
  }

  function tone(freq, dur, type, vol, when = 0) {
    if (muted || !ensure()) return;
    const t = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  function noiseBurst(dur, vol, cutoff) {
    if (muted || !ensure()) return;
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;
    const gain = ctx.createGain();
    gain.gain.value = vol;
    src.connect(filter).connect(gain).connect(ctx.destination);
    src.start();
  }

  return {
    unlock() { ensure(); if (ctx && ctx.state === 'suspended') ctx.resume(); },
    toggleMute() {
      muted = !muted;
      if (hum) hum.gain.value = muted ? 0 : 0.015;
      return muted;
    },
    get muted() { return muted; },
    step(sneaking) { if (!sneaking) noiseBurst(0.05, 0.05, 900); },
    pickup() { tone(880, 0.12, 'sine', 0.12); tone(1318, 0.18, 'sine', 0.1, 0.08); },
    spotted() { tone(220, 0.25, 'square', 0.06); tone(277, 0.25, 'square', 0.06, 0.12); },
    alarm() { tone(440, 0.3, 'sawtooth', 0.1); tone(349, 0.3, 'sawtooth', 0.1, 0.15); tone(440, 0.4, 'sawtooth', 0.1, 0.3); },
    caught() { tone(110, 0.7, 'sawtooth', 0.14); tone(82, 0.9, 'sawtooth', 0.12, 0.2); },
    win() { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.25, 'triangle', 0.12, i * 0.12)); },
  };
}
