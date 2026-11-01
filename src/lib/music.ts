import { VOICES, type Chorale, type Note, type Voice } from "../types";

const EPS = 1e-6;

export interface Phrase {
  index: number;
  /** First beat, including any pickup into the phrase. */
  start: number;
  /** Beat where the fermata note ends. */
  end: number;
  fermataStart: number;
}

/** Phrases run from the end of one fermata to the end of the next. */
export function phrases(c: Chorale): Phrase[] {
  let start = 0;
  return c.fermatas.map(([fs, fe], index) => {
    const end = index === c.fermatas.length - 1 ? Math.max(fe, c.lengthBeats) : fe;
    const p = { index, start, end, fermataStart: fs };
    start = fe;
    return p;
  });
}

export function phraseIndexAt(list: Phrase[], beat: number): number {
  let i = 0;
  for (let k = 0; k < list.length; k++) {
    if (beat >= list[k]!.start - EPS) i = k;
    else break;
  }
  return i;
}

/** Index of the last element whose `beat` is at or before the given beat (binary search). */
export function indexAtBeat<T>(items: T[], beat: number, key: (t: T) => number): number {
  let lo = 0;
  let hi = items.length - 1;
  let ans = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (key(items[mid]!) <= beat + EPS) {
      ans = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  return ans;
}

/** Bar number (1-based, a pickup bar is 0) and beat within the bar (1-based). */
export function barAndBeat(c: Chorale, beat: number): { bar: number; beat: number } {
  const i = indexAtBeat(c.bars, beat, (b) => b);
  const bar = c.pickupBeats > 0 ? i : i + 1;
  const barStart = c.bars[i] ?? 0;
  let within = beat - barStart;
  // In a pickup bar the beats are counted from the end of a full bar.
  if (i === 0 && c.pickupBeats > 0) within += beatsPerBar(c) - c.pickupBeats;
  return { bar, beat: Math.floor(within + EPS) + 1 };
}

export function beatsPerBar(c: Chorale): number {
  const [num, den] = c.timeSig.split("/").map(Number) as [number, number];
  return (num * 4) / den;
}

/** The note a voice is singing at a beat, if any. */
export function noteAt(notes: Note[], beat: number): Note | undefined {
  const i = indexAtBeat(notes, beat, (n) => n[1]);
  const n = notes[i];
  if (n && n[1] <= beat + EPS && n[1] + n[2] > beat + EPS) return n;
  return undefined;
}

export function notesAt(c: Chorale, beat: number): Partial<Record<Voice, Note>> {
  const out: Partial<Record<Voice, Note>> = {};
  for (const v of VOICES) {
    const n = noteAt(c.voices[v], beat);
    if (n) out[v] = n;
  }
  return out;
}

/** The word being sung at a beat, whole (syllables joined), for one verse. */
export function wordAt(c: Chorale, beat: number, verse: number): string {
  if (!c.lyrics.length) return "";
  let i = indexAtBeat(c.lyrics, beat, (l) => l.beat);
  if (c.lyrics[i]!.beat > beat + EPS) return "";
  // Walk back to the first syllable of the word, then forward to its last.
  while (i > 0 && isContinuation(c.lyrics[i]!.verses[verse]?.syllabic)) i--;
  let word = "";
  for (let k = i; k < c.lyrics.length; k++) {
    const s = c.lyrics[k]!.verses[verse];
    if (!s) break;
    word += s.text;
    if (s.syllabic === "single" || s.syllabic === "end") break;
  }
  return word;
}

function isContinuation(s: string | undefined): boolean {
  return s === "middle" || s === "end";
}

/** Chord slices that start on a change of chord, used for stepping with the arrow keys. */
export function stepPoints(c: Chorale): number[] {
  return c.chords.map((ch) => ch.beat);
}

export function nextStep(points: number[], beat: number, dir: 1 | -1): number {
  if (dir === 1) {
    for (const p of points) if (p > beat + EPS) return p;
    return points[points.length - 1] ?? 0;
  }
  for (let i = points.length - 1; i >= 0; i--) if (points[i]! < beat - EPS) return points[i]!;
  return 0;
}

export function midiRange(c: Chorale): [number, number] {
  let lo = 127;
  let hi = 0;
  for (const v of VOICES)
    for (const n of c.voices[v]) {
      lo = Math.min(lo, n[0]);
      hi = Math.max(hi, n[0]);
    }
  return [lo, hi];
}

/** "B♭4" -> "B flat 4", for screen readers, which often skip music glyphs. */
export function spokenPitch(name: string): string {
  return name.replace("♭", " flat ").replace("♯", " sharp ").replace(/\s+/g, " ").trim();
}

export function spokenChord(name: string): string {
  if (!name) return "passing chord";
  const m = /^([A-G])([♭♯]?)(.*)$/.exec(name);
  if (!m) return name;
  const [, root, acc, q] = m;
  const accidental = acc === "♭" ? " flat" : acc === "♯" ? " sharp" : "";
  const quality: Record<string, string> = {
    "": " major",
    m: " minor",
    "°": " diminished",
    "+": " augmented",
    "7": " seventh",
    m7: " minor seventh",
    maj7: " major seventh",
    "ø7": " half-diminished seventh",
    "°7": " diminished seventh",
  };
  return `${root}${accidental}${quality[q ?? ""] ?? q}`;
}

/**
 * Pitch range of the notes sounding within a span, widened to at least an octave and a half
 * so a narrow phrase is not stretched out of proportion.
 */
export function spanMidiRange(c: Chorale, start: number, end: number, minSpan = 18): [number, number] {
  let lo = 127;
  let hi = 0;
  for (const v of VOICES)
    for (const n of c.voices[v]) {
      if (n[1] >= end - EPS || n[1] + n[2] <= start + EPS) continue;
      lo = Math.min(lo, n[0]);
      hi = Math.max(hi, n[0]);
    }
  if (lo > hi) return midiRange(c);
  const pad = Math.max(0, minSpan - (hi - lo));
  return [lo - Math.floor(pad / 2), hi + Math.ceil(pad / 2)];
}
