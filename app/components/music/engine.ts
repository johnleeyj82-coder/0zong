// The one audio graph for the site: <audio> → track gain → master → speakers, plus two ambient beds made in the browser
// (no files): rain from filtered noise, a fire from low rumble and a pre-baked crackle loop. The AudioContext is created on
// the first user gesture (browsers block audio before that).

const loudness = (v: number) => Math.max(0, Math.min(1, v)) ** 2; // sliders feel even when gain follows the square

function noise(ctx: AudioContext, seconds: number, brown = false) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w;
  }
  return buf;
}

/** A few seconds of sparse wood crackles: short noise bursts with fast decay at random times and strengths. */
function crackles(ctx: AudioContext, seconds: number) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  const count = Math.floor(seconds * 9);
  for (let c = 0; c < count; c++) {
    const at = Math.floor(Math.random() * (len - ctx.sampleRate * 0.03));
    const dur = Math.floor(ctx.sampleRate * (0.002 + Math.random() * 0.012));
    const amp = 0.15 + Math.random() ** 3 * 0.85;
    for (let i = 0; i < dur; i++) d[at + i] += (Math.random() * 2 - 1) * amp * Math.exp((-6 * i) / dur);
  }
  return buf;
}

function loop(ctx: AudioContext, buf: AudioBuffer, ...chain: AudioNode[]) {
  const src = ctx.createBufferSource();
  src.buffer = buf; src.loop = true;
  let node: AudioNode = src;
  for (const n of chain) { node.connect(n); node = n; }
  src.start();
  return node;
}

export class Engine {
  readonly audio: HTMLAudioElement;
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private trackGain: GainNode | null = null;
  private ambient: Record<"rain" | "fire", GainNode> | null = null;
  private volume = 0.8;
  private levels = { rain: 0, fire: 0 };

  constructor() {
    this.audio = new Audio();
    this.audio.preload = "metadata";
  }

  /** Builds the graph once, from a user gesture. Safe to call again; also resumes a suspended context. */
  start() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      this.ctx = ctx;
      this.master = ctx.createGain();
      this.master.connect(ctx.destination);
      this.trackGain = ctx.createGain();
      this.trackGain.gain.value = loudness(this.volume);
      ctx.createMediaElementSource(this.audio).connect(this.trackGain).connect(this.master);
      this.audio.volume = 1;

      const bq = (type: BiquadFilterType, hz: number) => { const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = hz; return f; };
      const gain = (v: number) => { const g = ctx.createGain(); g.gain.value = v; return g; };

      const rain = gain(0); rain.connect(this.master);
      loop(ctx, noise(ctx, 3), bq("highpass", 500), bq("lowpass", 7000), gain(0.22)).connect(rain); // hiss
      loop(ctx, noise(ctx, 4, true), bq("lowpass", 900), gain(0.5)).connect(rain); // body

      const fire = gain(0); fire.connect(this.master);
      loop(ctx, noise(ctx, 4, true), bq("lowpass", 380), gain(0.7)).connect(fire); // rumble
      loop(ctx, crackles(ctx, 7), bq("highpass", 1500), gain(0.5)).connect(fire); // crackle

      this.ambient = { rain, fire };
      this.setAmbient("rain", this.levels.rain);
      this.setAmbient("fire", this.levels.fire);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  get running() { return !!this.ctx; }

  setVolume(v: number) {
    this.volume = v;
    if (this.trackGain) this.trackGain.gain.value = loudness(v);
    else this.audio.volume = loudness(v);
  }

  setAmbient(kind: "rain" | "fire", v: number) {
    this.levels[kind] = v;
    if (v > 0) this.start();
    const g = this.ambient?.[kind];
    if (g && this.ctx) g.gain.setTargetAtTime(loudness(v) * (kind === "rain" ? 0.9 : 0.8), this.ctx.currentTime, 0.15);
  }

  setRate(rate: number, keepPitch: boolean) {
    const a = this.audio as HTMLAudioElement & { webkitPreservesPitch?: boolean };
    a.preservesPitch = keepPitch;
    a.webkitPreservesPitch = keepPitch;
    a.playbackRate = rate;
  }

  /** Ramps everything (track and ambience) to `to` over `seconds`. Used by the sleep timer. */
  fadeMaster(to: number, seconds: number) {
    if (!this.master || !this.ctx) return;
    const g = this.master.gain, now = this.ctx.currentTime;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(to, now + Math.max(0.01, seconds));
  }

  /** Two soft sine notes, for the pomodoro switch. */
  chime() {
    this.start();
    const ctx = this.ctx!;
    [659.25, 987.77].forEach((hz, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime + i * 0.22;
      o.type = "sine"; o.frequency.value = hz;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.18, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
      o.connect(g).connect(this.master!);
      o.start(t); o.stop(t + 1.5);
    });
  }
}
