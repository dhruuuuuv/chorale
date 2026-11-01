import { VOICES, type Chorale, type Voice } from "../types";
import type { TempoMap } from "./tempoMap";

export interface NoteEvent {
  /** Performed time of the event, in units (see TempoMap). */
  units: number;
  type: "on" | "off";
  voice: Voice;
  midi: number;
  /** Index of the note in its voice, so an "off" can find its "on". */
  note: number;
}

/**
 * Every note-on and note-off in performance order. At the same moment, offs come before ons
 * so a repeated pitch is released before it is struck again.
 */
export function buildEvents(c: Chorale, tm: TempoMap): NoteEvent[] {
  const out: NoteEvent[] = [];
  for (const voice of VOICES) {
    c.voices[voice].forEach(([midi, start, dur], note) => {
      out.push({ units: tm.onset(start), type: "on", voice, midi, note });
      out.push({ units: tm.release(start + dur), type: "off", voice, midi, note });
    });
  }
  return out.sort((a, b) => a.units - b.units || (a.type === b.type ? 0 : a.type === "off" ? -1 : 1));
}

/** First event at or after a time. */
export function firstEventAt(events: NoteEvent[], units: number): number {
  let lo = 0;
  let hi = events.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (events[mid]!.units < units - 1e-9) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}
