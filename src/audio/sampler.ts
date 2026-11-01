import { VOICES, type Voice } from "../types";
import type { Instrument, PlayingNote } from "./instrument";

export interface SampleEntry {
  midi: number;
  url: string;
  /** How far the singer was from the exact pitch, in cents; playback corrects for it. */
  cents?: number;
  /** Seconds into the file where the note reaches full voice; playback starts here. */
  start?: number;
  /** Seamless loop, in seconds, baked by pipeline/samples.py. */
  loopStart?: number;
  loopEnd?: number;
}

/** public/samples/sample-map.json: voice -> recorded notes, by MIDI note and vowel. */
export interface SampleMap {
  version: 1;
  vowel?: string;
  name?: string;
  /** How much of the app's room these recordings want, 0 to 1. */
  reverb?: number;
  /** Attribution the samples' licence requires. */
  credit?: string;
  voices: Partial<Record<Voice, SampleEntry[]>>;
}

export interface LoadedSample {
  midi: number;
  cents: number;
  buffer: AudioBuffer;
  start: number;
  loopStart: number;
  loopEnd: number;
}

/**
 * Fade-in from the voiced start: quick enough for a quaver to speak, soft enough to sound
 * like a singer's onset rather than a switch.
 */
const ATTACK = 0.045;
/** Long enough to let the hall in the recordings ring a little. */
const RELEASE = 0.28;
/**
 * The samples are levelled to about -15 dBFS; the organ's normalised wave is louder.
 * This brings the choir up to sit at the same place in the mix.
 */
const LEVEL = 1.8;

/** The recorded note closest to the wanted pitch, and the playback rate that transposes it. */
export function nearestSample<T extends { midi: number; cents?: number }>(samples: T[], midi: number): { sample: T; rate: number } | null {
  let best: T | null = null;
  for (const s of samples) if (!best || Math.abs(s.midi - midi) < Math.abs(best.midi - midi)) best = s;
  return best ? { sample: best, rate: Math.pow(2, (midi - best.midi - (best.cents ?? 0) / 100) / 12) } : null;
}

export function hasSamples(map: SampleMap | null, voice: Voice): boolean {
  return !!map?.voices[voice]?.length;
}

/** Loop points to use, falling back to a safe region for samples without baked loops. */
export function loopPoints(e: SampleEntry, duration: number): { start: number; loopStart: number; loopEnd: number } {
  const loopEnd = Math.min(e.loopEnd ?? duration, duration);
  const loopStart = Math.min(e.loopStart ?? duration / 3, loopEnd - 0.05);
  const start = Math.min(Math.max(0, e.start ?? 0), loopStart);
  return { start, loopStart, loopEnd };
}

/** One sampled choir voice. */
export class SampledVoice implements Instrument {
  constructor(
    private readonly ctx: BaseAudioContext,
    private readonly samples: LoadedSample[],
  ) {}

  start(midi: number, at: number, out: AudioNode, level = 1): PlayingNote {
    const peak = LEVEL * level;
    const pick = nearestSample(this.samples, midi)!;
    const s = pick.sample;
    const src = this.ctx.createBufferSource();
    src.buffer = s.buffer;
    src.playbackRate.value = pick.rate;
    src.loop = true;
    src.loopStart = s.loopStart;
    src.loopEnd = s.loopEnd;
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0, at);
    env.gain.linearRampToValueAtTime(peak, at + ATTACK);
    src.connect(env);
    env.connect(out);
    src.start(at, s.start);
    let stopped = false;
    return {
      stop: (when: number) => {
        if (stopped) return;
        stopped = true;
        const t = Math.max(when, at + ATTACK);
        env.gain.cancelScheduledValues(t);
        env.gain.setValueAtTime(peak, t);
        env.gain.setTargetAtTime(0, t, RELEASE / 3);
        src.stop(t + RELEASE * 2);
        src.onended = () => env.disconnect();
      },
    };
  }
}

/** Load whatever samples the map lists. Voices without samples are left out. */
export async function loadSampledVoices(ctx: BaseAudioContext, map: SampleMap, base: string): Promise<Partial<Record<Voice, SampledVoice>>> {
  const out: Partial<Record<Voice, SampledVoice>> = {};
  await Promise.all(
    VOICES.filter((v) => hasSamples(map, v)).map(async (v) => {
      const loaded = await Promise.all(
        map.voices[v]!.map(async (e) => {
          const res = await fetch(base + e.url);
          if (!res.ok) throw new Error(`sample ${e.url}: ${res.status}`);
          const buffer = await ctx.decodeAudioData(await res.arrayBuffer());
          return { midi: e.midi, cents: e.cents ?? 0, buffer, ...loopPoints(e, buffer.duration) };
        }),
      );
      out[v] = new SampledVoice(ctx, loaded);
    }),
  );
  return out;
}
