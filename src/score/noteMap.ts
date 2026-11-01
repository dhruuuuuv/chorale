import type { Chorale, Voice } from "../types";
import type { TimemapEntry } from "./verovio.worker";

const EPS = 1e-4;

export interface NoteRef {
  voice: Voice;
  /** Index into chorale.voices[voice]. */
  index: number;
  /** True for the engraved note where our note begins (not a tied continuation). */
  isStart: boolean;
  /** Where this engraved note starts, in beats. */
  onset: number;
}

/** Staff and layer order in the two-stave score written by the pipeline. */
export function voiceFor(staff: number, layer: number): Voice | null {
  if (staff === 0) return layer === 0 ? "S" : layer === 1 ? "A" : null;
  if (staff === 1) return layer === 0 ? "T" : layer === 1 ? "B" : null;
  return null;
}

/**
 * Match Verovio's engraved note ids to our notes, using the onset each id has in the
 * timemap and the voice its layer belongs to. A note tied across a barline is engraved
 * twice; both ids map to the one note.
 */
export function mapNotes(c: Chorale, timemap: TimemapEntry[], voiceOf: Map<string, Voice>): Map<string, NoteRef> {
  const onset = new Map<string, number>();
  for (const e of timemap) for (const id of e.on ?? []) if (!onset.has(id)) onset.set(id, e.qstamp);
  const out = new Map<string, NoteRef>();
  for (const [id, q] of onset) {
    const voice = voiceOf.get(id);
    if (!voice) continue;
    const notes = c.voices[voice];
    const index = notes.findIndex(([, start, dur]) => q >= start - EPS && q < start + dur - EPS);
    if (index < 0) continue;
    out.set(id, { voice, index, isStart: Math.abs(notes[index]![1] - q) < EPS, onset: q });
  }
  return out;
}

/** Sorted, de-duplicated [beat, x] pairs: the leftmost note head at each onset. */
export function anchorPoints(pairs: [number, number][]): [number, number][] {
  const byBeat = new Map<number, number>();
  for (const [b, x] of pairs) {
    const k = Math.round(b * 1000) / 1000;
    byBeat.set(k, Math.min(byBeat.get(k) ?? Infinity, x));
  }
  const sorted = [...byBeat.entries()].sort((a, b) => a[0] - b[0]);
  // Engraving is monotonic left to right; drop any point that would fold back.
  const out: [number, number][] = [];
  for (const p of sorted) if (!out.length || p[1] > out[out.length - 1]![1]) out.push(p);
  return out;
}

/** x of any beat, interpolating between engraved onsets. */
export function xAtBeat(points: [number, number][], beat: number): number {
  if (!points.length) return 0;
  const first = points[0]!;
  const last = points[points.length - 1]!;
  if (beat <= first[0]) return first[1];
  if (beat >= last[0]) {
    if (points.length < 2) return last[1];
    const prev = points[points.length - 2]!;
    return last[1] + ((beat - last[0]) * (last[1] - prev[1])) / (last[0] - prev[0]);
  }
  let lo = 0;
  let hi = points.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (points[mid]![0] <= beat) lo = mid;
    else hi = mid;
  }
  const [b0, x0] = points[lo]!;
  const [b1, x1] = points[hi]!;
  return x0 + ((beat - b0) / (b1 - b0)) * (x1 - x0);
}

/** The inverse: the beat at an x. */
export function beatAtXScore(points: [number, number][], x: number): number {
  if (points.length < 2) return points[0]?.[0] ?? 0;
  let i = 1;
  while (i < points.length - 1 && points[i]![1] < x) i++;
  const [b0, x0] = points[i - 1]!;
  const [b1, x1] = points[i]!;
  return Math.max(0, b0 + ((x - x0) / (x1 - x0)) * (b1 - b0));
}
