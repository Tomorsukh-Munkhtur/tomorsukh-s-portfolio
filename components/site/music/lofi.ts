/*
 * Generative lo-fi radio built on the Web Audio API — no audio files.
 *
 * Jazzy 7th/9th chords on a Rhodes-like keyboard, a soft bass, swung drums,
 * sparse pentatonic melody, vinyl crackle and gentle tape wobble. Notes are
 * scheduled slightly ahead of time ("lookahead" scheduling) so timing stays
 * tight even when the main thread is busy.
 */

type ChordType = "maj7" | "maj9" | "m7" | "m9" | "7" | "9" | "13";

const SHAPES: Record<ChordType, number[]> = {
  maj7: [0, 4, 7, 11],
  maj9: [0, 4, 7, 11, 14],
  m7: [0, 3, 7, 10],
  m9: [0, 3, 7, 10, 14],
  "7": [0, 4, 7, 10],
  "9": [0, 4, 10, 14],
  "13": [0, 4, 10, 14, 21],
};

/** Chord progressions as (scale degree in semitones, chord type). */
const PROGRESSIONS: [number, ChordType][][] = [
  [[2, "m9"], [7, "13"], [0, "maj9"], [9, "m9"]],
  [[5, "maj9"], [4, "m7"], [2, "m9"], [0, "maj7"]],
  [[9, "m9"], [5, "maj9"], [0, "maj7"], [7, "9"]],
  [[0, "maj9"], [9, "m7"], [2, "m9"], [7, "13"]],
  [[5, "maj7"], [7, "9"], [4, "m7"], [9, "m9"]],
  [[2, "m7"], [7, "9"], [5, "maj9"], [0, "maj9"]],
];

/** Each "track" is a key, tempo and progression; names live in the dictionary. */
export const TRACKS = [
  { key: 5, bpm: 74, progression: 0 },
  { key: 3, bpm: 70, progression: 1 },
  { key: 2, bpm: 78, progression: 2 },
  { key: 0, bpm: 72, progression: 3 },
  { key: 7, bpm: 76, progression: 4 },
  { key: 10, bpm: 68, progression: 5 },
] as const;

const PENTATONIC = [0, 2, 4, 7, 9];
const LOOKAHEAD = 0.15;
const SWING = 0.16;

const mtof = (m: number) => 440 * 2 ** ((m - 69) / 12);
const rand = () => Math.random();
const pick = <T,>(list: readonly T[]) => list[Math.floor(rand() * list.length)];

function voice(key: number, degree: number, type: ChordType) {
  const notes = SHAPES[type].map((i) => {
    let n = 48 + key + degree + i;
    while (n > 76) n -= 12;
    while (n < 55) n += 12;
    return n;
  });
  return [...new Set(notes)].sort((a, b) => a - b);
}

type State = { playing: boolean; track: number; volume: number };

class LofiRadio {
  private ctx: AudioContext | null = null;
  private nodes!: {
    fade: GainNode;
    volume: GainNode;
    pre: GainNode;
    keys: GainNode;
    music: GainNode;
    drums: GainNode;
    reverb: GainNode;
    delay: GainNode;
    wobble: GainNode;
  };
  private noise!: AudioBuffer;
  private crackle: AudioBufferSourceNode | null = null;
  private timer = 0;
  private suspendTimer = 0;
  private step = 0;
  private nextTime = 0;
  private listeners = new Set<() => void>();
  state: State = { playing: false, track: 0, volume: 0.6 };

  subscribe = (cb: () => void) => {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  };

  getState = () => this.state;

  private set(patch: Partial<State>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((l) => l());
  }

  private build() {
    const ctx = new AudioContext();
    this.ctx = ctx;

    // Output chain: pre → highpass → warm lowpass → compressor → makeup → fade → volume → speakers
    const pre = ctx.createGain();
    const hp = new BiquadFilterNode(ctx, { type: "highpass", frequency: 35 });
    const warm = new BiquadFilterNode(ctx, { type: "lowpass", frequency: 3800, Q: 0.4 });
    const comp = new DynamicsCompressorNode(ctx, { threshold: -18, ratio: 3, attack: 0.01, release: 0.25 });
    const makeup = new GainNode(ctx, { gain: 2.2 });
    const fade = new GainNode(ctx, { gain: 0 });
    const volume = new GainNode(ctx, { gain: this.state.volume });
    pre.connect(hp).connect(warm).connect(comp).connect(makeup).connect(fade).connect(volume).connect(ctx.destination);

    // Shared noise source for drums and crackle.
    this.noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = rand() * 2 - 1;

    // Reverb: a synthetic decaying impulse.
    const convolver = new ConvolverNode(ctx);
    const length = ctx.sampleRate * 2.6;
    const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) d[i] = (rand() * 2 - 1) * (1 - i / length) ** 3;
    }
    convolver.buffer = impulse;
    const reverb = new GainNode(ctx, { gain: 1 });
    reverb.connect(convolver).connect(new GainNode(ctx, { gain: 0.32 })).connect(pre);

    // Dotted-eighth echo for the melody.
    const delay = new GainNode(ctx, { gain: 1 });
    const delayNode = new DelayNode(ctx, { delayTime: 0.42, maxDelayTime: 1 });
    const feedback = new GainNode(ctx, { gain: 0.32 });
    const delayTone = new BiquadFilterNode(ctx, { type: "lowpass", frequency: 2200 });
    delay.connect(delayNode).connect(delayTone).connect(feedback).connect(delayNode);
    delayTone.connect(new GainNode(ctx, { gain: 0.5 })).connect(pre);
    delayTone.connect(reverb);

    // Keys bus with tremolo.
    const keys = new GainNode(ctx, { gain: 0.9 });
    const trem = new OscillatorNode(ctx, { frequency: 4.2 });
    const tremDepth = new GainNode(ctx, { gain: 0.08 });
    trem.connect(tremDepth).connect(keys.gain);
    trem.start();
    const music = new GainNode(ctx, { gain: 0.6 });
    keys.connect(new BiquadFilterNode(ctx, { type: "lowpass", frequency: 2400 })).connect(music);
    keys.connect(reverb);
    music.connect(pre);

    const drums = new GainNode(ctx, { gain: 0.5 });
    drums.connect(new BiquadFilterNode(ctx, { type: "lowpass", frequency: 6500 })).connect(pre);

    // Tape wobble: a slow LFO on oscillator detune (cents).
    const wobbleOsc = new OscillatorNode(ctx, { frequency: 0.32 });
    const wobble = new GainNode(ctx, { gain: 7 });
    wobbleOsc.connect(wobble);
    wobbleOsc.start();

    this.nodes = { fade, volume, pre, keys, music, drums, reverb, delay, wobble };
  }

  private startCrackle() {
    const ctx = this.ctx!;
    const seconds = 3;
    const buf = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) {
      d[i] = (rand() * 2 - 1) * 0.012;
      if (rand() < 0.00035) {
        const amp = 0.25 + rand() * 0.5;
        for (let j = 0; j < 30 && i + j < d.length; j++) d[i + j] += amp * (rand() * 2 - 1) * (1 - j / 30);
      }
    }
    const src = new AudioBufferSourceNode(ctx, { buffer: buf, loop: true });
    src
      .connect(new BiquadFilterNode(ctx, { type: "bandpass", frequency: 2600, Q: 0.6 }))
      .connect(new GainNode(ctx, { gain: 0.14 }))
      .connect(this.nodes.pre);
    src.start();
    this.crackle = src;
  }

  // ---- instruments ------------------------------------------------------

  private tone(type: OscillatorType, freq: number, t: number, end: number, out: AudioNode) {
    const o = new OscillatorNode(this.ctx!, { type, frequency: freq });
    const wobble = this.nodes.wobble;
    wobble.connect(o.detune);
    o.connect(out);
    o.start(t);
    o.stop(end);
    // The always-running wobble LFO would otherwise keep every finished note alive.
    o.onended = () => {
      wobble.disconnect(o.detune);
      o.disconnect();
    };
    return o;
  }

  private rhodes(notes: number[], time: number, dur: number, vel: number) {
    const ctx = this.ctx!;
    notes.forEach((n, i) => {
      const t = time + i * 0.014 + rand() * 0.006;
      const peak = 0.075 * vel * (0.85 + rand() * 0.3);
      const g = new GainNode(ctx, { gain: 0 });
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(peak, t + 0.012);
      g.gain.exponentialRampToValueAtTime(peak * 0.35, t + dur * 0.6);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.5);
      g.connect(this.nodes.keys);
      this.tone("sine", mtof(n), t, t + dur + 0.6, g);
      // Bell-like "tine" on the attack.
      const tine = new GainNode(ctx, { gain: 0 });
      tine.gain.setValueAtTime(0.35, t);
      tine.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      tine.connect(g);
      this.tone("sine", mtof(n) * 4, t, t + 0.4, tine);
    });
  }

  private bass(note: number, time: number, dur: number) {
    const ctx = this.ctx!;
    const g = new GainNode(ctx, { gain: 0 });
    g.gain.setValueAtTime(0, time);
    g.gain.linearRampToValueAtTime(0.32, time + 0.02);
    g.gain.exponentialRampToValueAtTime(0.12, time + dur * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur + 0.15);
    g.connect(new BiquadFilterNode(ctx, { type: "lowpass", frequency: 420 })).connect(this.nodes.music);
    this.tone("triangle", mtof(note), time, time + dur + 0.2, g);
  }

  private pluck(note: number, time: number, dur: number) {
    const ctx = this.ctx!;
    const g = new GainNode(ctx, { gain: 0 });
    g.gain.setValueAtTime(0, time);
    g.gain.linearRampToValueAtTime(0.06, time + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur + 0.4);
    const tone = new BiquadFilterNode(ctx, { type: "lowpass", frequency: 2600 });
    g.connect(tone);
    tone.connect(this.nodes.music);
    tone.connect(this.nodes.delay);
    tone.connect(this.nodes.reverb);
    this.tone("triangle", mtof(note), time, time + dur + 0.5, g);
    this.tone("sine", mtof(note + 12), time, time + 0.3, g);
  }

  private noiseHit(time: number, filter: BiquadFilterOptions, peak: number, decay: number) {
    const ctx = this.ctx!;
    const src = new AudioBufferSourceNode(ctx, { buffer: this.noise });
    const g = new GainNode(ctx, { gain: 0 });
    g.gain.setValueAtTime(peak, time);
    g.gain.exponentialRampToValueAtTime(0.0001, time + decay);
    src.connect(new BiquadFilterNode(ctx, filter)).connect(g).connect(this.nodes.drums);
    src.start(time, rand() * 0.5);
    src.stop(time + decay + 0.05);
  }

  private kick(time: number) {
    const ctx = this.ctx!;
    const o = new OscillatorNode(ctx, { frequency: 110 });
    o.frequency.exponentialRampToValueAtTime(42, time + 0.12);
    const g = new GainNode(ctx, { gain: 0 });
    g.gain.setValueAtTime(0.75, time);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.38);
    o.connect(g).connect(this.nodes.drums);
    o.start(time);
    o.stop(time + 0.4);
  }

  private snare(time: number) {
    this.noiseHit(time, { type: "bandpass", frequency: 1700, Q: 0.7 }, 0.22, 0.2);
    const ctx = this.ctx!;
    const g = new GainNode(ctx, { gain: 0 });
    g.gain.setValueAtTime(0.09, time);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.12);
    g.connect(this.nodes.drums);
    const o = new OscillatorNode(ctx, { type: "triangle", frequency: 190 });
    o.connect(g);
    o.start(time);
    o.stop(time + 0.13);
  }

  private hat(time: number, vel: number) {
    this.noiseHit(time, { type: "highpass", frequency: 7500 }, 0.05 * vel, 0.045);
  }

  // ---- sequencing -------------------------------------------------------

  private scheduleStep(step: number, time: number) {
    const track = TRACKS[this.state.track];
    const progression = PROGRESSIONS[track.progression];
    const sixteenth = 60 / track.bpm / 4;
    const bar = Math.floor(step / 16);
    const pos = step % 16;
    const [degree, type] = progression[bar % progression.length];
    const chord = voice(track.key, degree, type);
    const root = 36 + ((track.key + degree) % 12);
    const intro = bar < 2;
    const breakdown = bar % 16 >= 14;

    if (pos === 0) this.rhodes(chord, time, sixteenth * 15, 0.9);
    if (pos === 10 && rand() < 0.35) this.rhodes(chord.slice(1), time, sixteenth * 5, 0.5);

    if (!intro) {
      if (pos === 0) this.bass(root, time, sixteenth * 7);
      if (pos === 10) this.bass(rand() < 0.6 ? root : root + 7, time, sixteenth * 5);
    }

    if (!intro && !breakdown) {
      if (pos === 0 || pos === 10 || (pos === 7 && rand() < 0.25)) this.kick(time);
      if (pos === 4 || pos === 12) this.snare(time);
      if (pos % 2 === 0) this.hat(time, pos % 4 === 0 ? 0.9 : 0.5 + rand() * 0.35);
      else if (rand() < 0.1) this.hat(time, 0.35);
    }

    // Sparse melody in phrases: bars 2–5 of every 8.
    const phrase = bar % 8;
    if (bar >= 2 && phrase >= 2 && phrase <= 5 && pos % 2 === 0 && rand() < 0.24) {
      const pool = rand() < 0.6 ? chord.map((n) => n + 12) : PENTATONIC.map((i) => 72 + track.key + i);
      let note = pick(pool);
      while (note > 88) note -= 12;
      this.pluck(note, time, sixteenth * (rand() < 0.5 ? 3 : 6));
    }
  }

  private tick = () => {
    const ctx = this.ctx!;
    while (this.nextTime < ctx.currentTime + LOOKAHEAD) {
      this.scheduleStep(this.step, this.nextTime);
      const sixteenth = 60 / TRACKS[this.state.track].bpm / 4;
      this.nextTime += sixteenth * (this.step % 2 === 0 ? 1 + SWING : 1 - SWING);
      this.step++;
    }
  };

  // ---- controls ---------------------------------------------------------

  async play() {
    if (this.state.playing) return;
    if (!this.ctx) this.build();
    const ctx = this.ctx!;
    clearTimeout(this.suspendTimer);
    await ctx.resume();
    if (!this.crackle) this.startCrackle();
    const now = ctx.currentTime;
    this.nodes.fade.gain.cancelScheduledValues(now);
    this.nodes.fade.gain.setValueAtTime(this.nodes.fade.gain.value, now);
    this.nodes.fade.gain.linearRampToValueAtTime(1, now + 2);
    this.step = 0;
    this.nextTime = now + 0.08;
    clearInterval(this.timer);
    this.timer = window.setInterval(this.tick, 25);
    this.tick();
    this.set({ playing: true });
  }

  pause() {
    if (!this.ctx || !this.state.playing) return;
    const now = this.ctx.currentTime;
    this.nodes.fade.gain.cancelScheduledValues(now);
    this.nodes.fade.gain.setValueAtTime(this.nodes.fade.gain.value, now);
    this.nodes.fade.gain.linearRampToValueAtTime(0, now + 0.8);
    this.set({ playing: false });
    this.suspendTimer = window.setTimeout(() => {
      clearInterval(this.timer);
      void this.ctx?.suspend();
    }, 900);
  }

  toggle() {
    if (this.state.playing) this.pause();
    else void this.play();
  }

  /** Switch to the next track at the start of a fresh bar. */
  next() {
    this.set({ track: (this.state.track + 1) % TRACKS.length });
    if (this.ctx && this.state.playing) {
      this.step = 0;
      this.nextTime = Math.max(this.nextTime, this.ctx.currentTime + 0.1);
    }
  }

  setVolume(v: number) {
    const volume = Math.min(1, Math.max(0, v));
    this.set({ volume });
    if (this.ctx) this.nodes.volume.gain.setTargetAtTime(volume, this.ctx.currentTime, 0.05);
  }
}

/** One radio for the whole site, so music keeps playing across page navigations. */
export const lofi = new LofiRadio();
