export interface PlayingNote {
  /** Release the note at an audio-clock time. Safe to call more than once. */
  stop(at: number): void;
}

export interface Instrument {
  /** Start a note at an audio-clock time, into the given node, at a level from 0 to 1. */
  start(midi: number, at: number, out: AudioNode, level?: number): PlayingNote;
}

export const midiToHz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
