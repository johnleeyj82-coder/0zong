"use client";
// Tiny synthesized sound effects for the stages (no audio files). The context is created on the first call, which only
// ever happens inside a click or key handler, so it never starts without a user gesture. Quiet by design.
let ctx: AudioContext | null = null;
let muted = false;

export const setSfxMuted = (m: boolean) => { muted = m; };

function ac() {
  if (muted || typeof window === "undefined") return null;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return null;
  ctx ??= new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function noise(c: AudioContext, seconds: number) {
  const b = c.createBuffer(1, Math.ceil(c.sampleRate * seconds), c.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const s = c.createBufferSource();
  s.buffer = b;
  return s;
}

function env(c: AudioContext, peak: number, attack: number, release: number) {
  const g = c.createGain();
  const t = c.currentTime;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + release);
  g.connect(c.destination);
  return g;
}

/** A brush or blade cutting the air: band-passed noise sweeping down. */
export function swish(strength = 1) {
  const c = ac(); if (!c) return;
  const n = noise(c, 0.35), f = c.createBiquadFilter();
  f.type = "bandpass"; f.Q.value = 1.4;
  f.frequency.setValueAtTime(3200, c.currentTime);
  f.frequency.exponentialRampToValueAtTime(500, c.currentTime + 0.25);
  n.connect(f).connect(env(c, 0.22 * strength, 0.01, 0.28));
  n.start();
}

/** A square-wave beep, like an 8-bit menu. */
export function blip(freq = 880, len = 0.08, type: OscillatorType = "square") {
  const c = ac(); if (!c) return;
  const o = c.createOscillator();
  o.type = type; o.frequency.value = freq;
  o.connect(env(c, 0.06, 0.005, len));
  o.start(); o.stop(c.currentTime + len + 0.05);
}

/** A short hard click (chips, chess pieces, a projector shutter). */
export function clack(pitch = 1) {
  const c = ac(); if (!c) return;
  const n = noise(c, 0.06), f = c.createBiquadFilter();
  f.type = "highpass"; f.frequency.value = 1800 * pitch;
  n.connect(f).connect(env(c, 0.25, 0.001, 0.05));
  n.start();
}

/** A low soft thump (ink hitting paper, a card landing). */
export function thud() {
  const c = ac(); if (!c) return;
  const o = c.createOscillator();
  o.type = "sine";
  o.frequency.setValueAtTime(140, c.currentTime);
  o.frequency.exponentialRampToValueAtTime(45, c.currentTime + 0.15);
  o.connect(env(c, 0.22, 0.003, 0.16));
  o.start(); o.stop(c.currentTime + 0.2);
}

/** Liquid pouring: low-passed noise with a slow wobble. */
export function pour(seconds = 1.4) {
  const c = ac(); if (!c) return;
  const n = noise(c, seconds), f = c.createBiquadFilter(), lfo = c.createOscillator(), depth = c.createGain();
  f.type = "lowpass"; f.frequency.value = 900; f.Q.value = 6;
  lfo.frequency.value = 7; depth.gain.value = 300;
  lfo.connect(depth).connect(f.frequency);
  n.connect(f).connect(env(c, 0.12, 0.08, seconds));
  n.start(); lfo.start(); lfo.stop(c.currentTime + seconds);
}

/** Glass and ice: two bright sine partials. */
export function clink() {
  const c = ac(); if (!c) return;
  for (const f of [2637, 3951]) {
    const o = c.createOscillator();
    o.frequency.value = f;
    o.connect(env(c, 0.05, 0.002, 0.6));
    o.start(); o.stop(c.currentTime + 0.7);
  }
}
