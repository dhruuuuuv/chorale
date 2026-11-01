import { midiToHz, type Instrument, type PlayingNote } from "./instrument";

const ATTACK = 0.03;
const RELEASE = 0.06;

/**
 * The fallback voice: an organ-like additive tone, as in the prototype.
 * Needs no download, so it plays at once while choir samples load, and offline.
 */
export class Organ implements Instrument {
  private readonly wave: PeriodicWave;
  /** One soft low-pass per destination, as in the prototype, to take the edge off. */
  private readonly filters = new WeakMap<AudioNode, BiquadFilterNode>();

  constructor(private readonly ctx: BaseAudioContext) {
    const re = new Float32Array([0, 1, 0.55, 0.32, 0.2, 0.1, 0.06, 0.03]);
    this.wave = ctx.createPeriodicWave(re, new Float32Array(re.length));
  }

  private filterFor(out: AudioNode): AudioNode {
    let f = this.filters.get(out);
    if (!f) {
      f = this.ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = 3000;
      f.connect(out);
      this.filters.set(out, f);
    }
    return f;
  }

  start(midi: number, at: number, out: AudioNode, level = 1): PlayingNote {
    const osc = this.ctx.createOscillator();
    osc.setPeriodicWave(this.wave);
    osc.frequency.value = midiToHz(midi);
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0, at);
    env.gain.linearRampToValueAtTime(level, at + ATTACK);
    osc.connect(env);
    env.connect(this.filterFor(out));
    osc.start(at);
    let stopped = false;
    return {
      stop: (when: number) => {
        if (stopped) return;
        stopped = true;
        const t = Math.max(when, at + ATTACK);
        env.gain.cancelScheduledValues(t);
        env.gain.setValueAtTime(level, t);
        env.gain.linearRampToValueAtTime(0, t + RELEASE);
        osc.stop(t + RELEASE + 0.02);
        osc.onended = () => env.disconnect();
      },
    };
  }
}
