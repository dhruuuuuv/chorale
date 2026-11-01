/** The shape of public/data/<id>.json, written by pipeline/build.py. */

export const VOICES = ["S", "A", "T", "B"] as const;
export type Voice = (typeof VOICES)[number];

export const VOICE_NAMES: Record<Voice, string> = {
  S: "Soprano",
  A: "Alto",
  T: "Tenor",
  B: "Bass",
};

/** [midi, startBeat, durBeats, pitchName] */
export type Note = [number, number, number, string];

export interface Syllable {
  text: string;
  syllabic: "single" | "begin" | "middle" | "end";
}

export interface LyricEvent {
  beat: number;
  verses: Syllable[];
}

export interface ChordSlice {
  beat: number;
  dur: number;
  name: string;
  clash: number;
}

export interface Chorale {
  id: string;
  bwv: string;
  riemenschneider: number;
  title: string;
  firstLine: string;
  translation: string;
  source: string;
  key: string;
  timeSig: string;
  pickupBeats: number;
  lengthBeats: number;
  /** Start beat of every notated bar, repeats written out. */
  bars: number[];
  /** [startBeat, endBeat] of each note under a fermata, in the soprano. */
  fermatas: [number, number][];
  verseCount: number;
  voices: Record<Voice, Note[]>;
  lyrics: LyricEvent[];
  chords: ChordSlice[];
  /** Two-stave MusicXML for the score view, relative to data/, with a content-hash version. */
  xml?: string;
}

export interface IndexEntry {
  id: string;
  bwv: string;
  riemenschneider: number;
  title: string;
  firstLine: string;
  translation: string;
  source: string;
  key: string;
  timeSig: string;
  lengthBeats: number;
  phrases: number;
  startHere: number | null;
}
