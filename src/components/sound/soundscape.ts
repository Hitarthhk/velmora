/**
 * "The Sound of the Valley": one Web Audio graph for the whole site.
 *
 * Recorded layers (wind, pines, dawn birds) loop through overlapping,
 * crossfaded playbacks from random offsets, so short field recordings never
 * click at the seam or repeat noticeably. Occasional bird calls are placed
 * at random times and positions, softened as if heard across the valley.
 * Two quiet synthesized layers (a tonal bed and an airy texture) colour the
 * bottle showcase and the collection; they imitate nothing in nature.
 *
 * Every change of scene is a slow volume crossfade. The engine is plain
 * TypeScript, created once, so React re-renders can never restart it.
 */

export type Scene = "hero" | "showcase" | "collection" | "forest" | "breeze";
type Layer = "wind" | "pines" | "dawn" | "tone" | "texture";

/** Licensed recordings (docs/assets/soundscape.md), each with a trim that
 * brings it to a common -26 dBFS RMS, measured from the decoded files. */
const FILES = {
  wind: { src: "/media/audio/wind-woodland.mp3", trim: 0.89 },     // -25.0 dBFS
  pines: { src: "/media/audio/wind-pines.mp3", trim: 1.11 },       // -28.9 dBFS
  dawn: { src: "/media/audio/dawn-foothills.mp3", trim: 0.92 },    // -25.3 dBFS
  calls: [
    { src: "/media/audio/call-laughingthrush.mp3", trim: 0.73 },   // -22.7 dBFS
    { src: "/media/audio/call-barbet.mp3", trim: 1.89 },           // -29.5 dBFS
  ],
};

/** Target mix per scene (0–1), the wind's low-pass cutoff, and how often
 * distant calls are heard. */
export const SCENES: Record<Scene, { mix: Record<Layer, number>; windCutoff: number; calls: number }> = {
  // Sunrise over the range: soft wind, pines moving, distant morning birds.
  hero: { mix: { wind: 0.52, pines: 0.28, dawn: 0.56, tone: 0, texture: 0 }, windCutoff: 1900, calls: 0.7 },
  // The bottle rises: deeper wind, the birds recede, a restrained tonal bed.
  showcase: { mix: { wind: 0.62, pines: 0.1, dawn: 0.06, tone: 0.24, texture: 0 }, windCutoff: 620, calls: 0.08 },
  // The collection: nature softens to a hush with a delicate air.
  collection: { mix: { wind: 0.2, pines: 0.05, dawn: 0, tone: 0.1, texture: 0.2 }, windCutoff: 900, calls: 0 },
  // Our Origin and Our Story: back into the forest.
  forest: { mix: { wind: 0.36, pines: 0.5, dawn: 0.78, tone: 0, texture: 0 }, windCutoff: 1700, calls: 1 },
  // Contact, the footer and quiet pages: the gentle mountain air of the opening.
  breeze: { mix: { wind: 0.55, pines: 0.32, dawn: 0.26, tone: 0, texture: 0 }, windCutoff: 1600, calls: 0.3 },
};

const MASTER = 0.85;
/** First start: the breeze arrives first, then the birds, then the pines. */
const WAKE: Record<Layer, number> = { wind: 0, dawn: 3, pines: 5.5, tone: 1, texture: 1 };

type AudioContextClass = typeof AudioContext;

/** Endless, seamless playback of one buffer from overlapping, crossfaded takes. */
class Loop {
  private timer: number | null = null;
  constructor(private ctx: AudioContext, private buffer: AudioBuffer, private out: AudioNode, private fade = 4) {}
  start() {
    const take = () => {
      const { ctx, buffer, fade } = this;
      const length = Math.max(fade * 2 + 1, Math.min(buffer.duration, 24 + Math.random() * 12));
      const offset = Math.random() * Math.max(0, buffer.duration - length);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const gain = ctx.createGain();
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(1, now + fade);
      gain.gain.setValueAtTime(1, now + length - fade);
      gain.gain.linearRampToValueAtTime(0, now + length);
      source.connect(gain).connect(this.out);
      source.start(now, offset, length);
      source.onended = () => { source.disconnect(); gain.disconnect(); };
      // The next take begins as this one starts to fade: no gap, no seam.
      this.timer = window.setTimeout(take, (length - fade) * 1000);
    };
    take();
  }
  stop() { if (this.timer !== null) window.clearTimeout(this.timer); this.timer = null; }
}

export class Soundscape {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private layers = {} as Record<Layer, GainNode>;
  private windFilter!: BiquadFilterNode;
  private callBus!: GainNode;
  private loops: Loop[] = [];
  private calls: { buffer: AudioBuffer; trim: number }[] = [];
  private callTimer: number | null = null;
  private loaded: Promise<void> | null = null;
  private scene: Scene = "hero";
  private woken = false;
  private on = false;

  get playing() { return this.on; }

  /** Builds the audio graph silently. Creating the context costs a few hundred
   * milliseconds on some systems, so the age gate does it on press, before
   * its exit animation starts. Must run inside a user gesture. */
  prepare() {
    if (!this.ctx) this.build();
    void this.ctx!.resume();
  }

  /** Must run inside a user gesture (browsers, iOS especially, require it). */
  start() {
    this.prepare();
    const ctx = this.ctx!;
    void ctx.resume();
    this.on = true;
    const now = ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.setTargetAtTime(MASTER, now, this.woken ? 0.8 : 2.2);
    this.loaded ??= this.load();
    void this.loaded.then(() => { if (this.on) this.wake(); });
  }

  stop() {
    if (!this.ctx) return;
    this.on = false;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.setTargetAtTime(0, now, 0.35);
    // Release the audio hardware once the fade has finished.
    window.setTimeout(() => { if (!this.on) void this.ctx?.suspend(); }, 1800);
  }

  /** Background tabs: fade out and suspend; fade back in on return. */
  setHidden(hidden: boolean) {
    if (!this.ctx || !this.on) return;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    if (hidden) {
      this.master.gain.setTargetAtTime(0, now, 0.15);
      window.setTimeout(() => { if (document.hidden) void this.ctx?.suspend(); }, 600);
    } else {
      void this.ctx.resume().then(() => this.master.gain.setTargetAtTime(MASTER, this.ctx!.currentTime, 0.8));
    }
  }

  setScene(scene: Scene) {
    if (scene === this.scene) return;
    this.scene = scene;
    if (this.woken) this.applyScene(1.4);
  }

  private build() {
    const Ctor = (window.AudioContext ?? (window as unknown as { webkitAudioContext: AudioContextClass }).webkitAudioContext);
    const ctx = new Ctor();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    // A gentle ceiling so layered peaks never clip.
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -14;
    limiter.ratio.value = 4;
    this.master.connect(limiter).connect(ctx.destination);
    for (const layer of ["wind", "pines", "dawn", "tone", "texture"] as Layer[]) {
      const gain = ctx.createGain();
      gain.gain.value = 0;
      this.layers[layer] = gain;
    }
    this.windFilter = ctx.createBiquadFilter();
    this.windFilter.type = "lowpass";
    this.windFilter.frequency.value = SCENES.hero.windCutoff;
    this.layers.wind.connect(this.windFilter).connect(this.master);
    this.layers.pines.connect(this.master);
    this.layers.dawn.connect(this.master);
    this.layers.tone.connect(this.master);
    this.layers.texture.connect(this.master);
    // Distant calls: softened highs, as if heard across the valley.
    const distance = ctx.createBiquadFilter();
    distance.type = "lowpass";
    distance.frequency.value = 3800;
    this.callBus = ctx.createGain();
    this.callBus.gain.value = 0;
    this.callBus.connect(distance).connect(this.master);
    this.buildTone();
    this.buildTexture();
  }

  /** A restrained tonal bed: a low open fifth, filtered and slowly breathing. */
  private buildTone() {
    const ctx = this.ctx!;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 520;
    filter.Q.value = 0.4;
    const bed = ctx.createGain();
    bed.gain.value = 0.09;
    filter.connect(bed).connect(this.layers.tone);
    for (const [freq, detune] of [[73.42, -4], [73.42, 5], [110, -3], [110, 4], [146.83, 2]] as const) {
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.value = freq;
      osc.detune.value = detune;
      osc.connect(filter);
      osc.start();
    }
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.045;
    const depth = ctx.createGain();
    depth.gain.value = 160;
    lfo.connect(depth).connect(filter.frequency);
    lfo.start();
  }

  /** A delicate airy texture: high, band-limited noise that drifts. */
  private buildTexture() {
    const ctx = this.ctx!;
    const noise = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const source = ctx.createBufferSource();
    source.buffer = noise;
    source.loop = true;
    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = 5200;
    band.Q.value = 0.9;
    const swell = ctx.createGain();
    swell.gain.value = 0.05;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const depth = ctx.createGain();
    depth.gain.value = 0.03;
    lfo.connect(depth).connect(swell.gain);
    source.connect(band).connect(swell).connect(this.layers.texture);
    source.start();
    lfo.start();
  }

  private async load() {
    const ctx = this.ctx!;
    const decode = async (url: string) => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(String(response.status));
        return await ctx.decodeAudioData(await response.arrayBuffer());
      } catch {
        // A missing recording leaves its layer silent; the rest still plays.
        return null;
      }
    };
    const [wind, pines, dawn, ...calls] = await Promise.all([FILES.wind, FILES.pines, FILES.dawn, ...FILES.calls].map((f) => decode(f.src)));
    for (const [buffer, layer] of [[wind, "wind"], [pines, "pines"], [dawn, "dawn"]] as const) {
      if (!buffer) continue;
      const trim = ctx.createGain();
      trim.gain.value = FILES[layer].trim;
      trim.connect(this.layers[layer]);
      const loop = new Loop(ctx, buffer, trim);
      loop.start();
      this.loops.push(loop);
    }
    this.calls = calls.flatMap((buffer, i) => (buffer ? [{ buffer, trim: FILES.calls[i].trim }] : []));
    this.scheduleCall();
  }

  /** The first start rises from silence, one layer after another. */
  private wake() {
    if (this.woken) return;
    this.woken = true;
    this.applyScene(1.6, WAKE);
  }

  private applyScene(timeConstant: number, delays?: Record<Layer, number>) {
    const ctx = this.ctx!;
    const target = SCENES[this.scene];
    const now = ctx.currentTime;
    for (const layer of Object.keys(this.layers) as Layer[]) {
      const param = this.layers[layer].gain;
      const at = now + (delays?.[layer] ?? 0);
      param.cancelScheduledValues(now);
      param.setValueAtTime(param.value, now);
      param.setTargetAtTime(target.mix[layer], at, delays ? timeConstant * 1.6 : timeConstant);
    }
    this.windFilter.frequency.setTargetAtTime(target.windCutoff, now, 2);
    this.callBus.gain.setTargetAtTime(target.calls * 0.32, now + (delays?.dawn ?? 0), timeConstant);
  }

  private scheduleCall() {
    const ctx = this.ctx!;
    const next = 9000 + Math.random() * 17000;
    this.callTimer = window.setTimeout(() => {
      if (this.on && this.calls.length && SCENES[this.scene].calls > 0.05 && ctx.state === "running") {
        const { buffer, trim } = this.calls[Math.floor(Math.random() * this.calls.length)];
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        const gain = ctx.createGain();
        const peak = (0.55 + Math.random() * 0.45) * trim;
        const pan = ctx.createStereoPanner();
        pan.pan.value = Math.random() * 1.4 - 0.7;
        source.connect(gain).connect(pan).connect(this.callBus);
        // Long recordings contribute a short phrase, faded at both ends.
        const length = Math.min(buffer.duration, 6 + Math.random() * 4);
        const offset = Math.random() * Math.max(0, buffer.duration - length);
        const now = ctx.currentTime;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(peak, now + 0.4);
        gain.gain.setValueAtTime(peak, now + length - 0.8);
        gain.gain.linearRampToValueAtTime(0, now + length);
        source.start(now, offset, length);
        source.onended = () => { source.disconnect(); gain.disconnect(); pan.disconnect(); };
      }
      this.scheduleCall();
    }, next);
  }
}
