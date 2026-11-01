import { midiToHz, type Instrument, type PlayingNote } from "./instrument";

const ATTACK = 0.02;
const RELEASE = 0.05;

/** A plain sine tone: no timbre at all, so only the pitches and the lines remain. */
export class Sine implements Instrument {
  constructor(private readonly ctx: BaseAudioContext) {}

  start(midi: number, at: number, out: AudioNode, level = 1): PlayingNote {
    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = midiToHz(midi);
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0, at);
    env.gain.linearRampToValueAtTime(level, at + ATTACK);
    osc.connect(env);
    env.connect(out);
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
