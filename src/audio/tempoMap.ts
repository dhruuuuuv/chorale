/**
 * Maps written beats to performed time, in "units" (beats at the chosen tempo).
 *
 * Taken from the prototype: every fermata is held `stretch` times its written length.
 * Added for phase 1: a short breath after each fermata before the next phrase begins.
 * During the breath the playhead waits at the end of the fermata.
 */

export const DEFAULT_STRETCH = 1.7;
export const MIN_STRETCH = 1;
export const MAX_STRETCH = 2.5;
export const BREATH_BEATS = 0.4;

const EPS = 1e-9;

export class TempoMap {
  readonly totalUnits: number;
  private readonly spans: [number, number][];

  constructor(
    fermatas: [number, number][],
    readonly lengthBeats: number,
    readonly stretch = DEFAULT_STRETCH,
    readonly breath = BREATH_BEATS,
  ) {
    this.spans = [...fermatas].sort((a, b) => a[0] - b[0]);
    this.totalUnits = this.release(lengthBeats);
  }

  /** When a note starting at this beat sounds. Includes the breath after a fermata ending here. */
  onset(beat: number): number {
    return this.convert(beat, true);
  }

  /** When a note ending at this beat stops. Excludes the breath after a fermata ending here. */
  release(beat: number): number {
    return this.convert(beat, false);
  }

  toBeat(units: number): number {
    let beat = 0;
    let acc = 0;
    for (const [a, e] of this.spans) {
      const plain = a - beat;
      if (units <= acc + plain + EPS) return beat + (units - acc);
      acc += plain;
      const held = (e - a) * this.stretch;
      if (units <= acc + held + EPS) return a + (units - acc) / this.stretch;
      acc += held;
      if (e < this.lengthBeats - EPS) {
        if (units <= acc + this.breath + EPS) return e;
        acc += this.breath;
      }
      beat = e;
    }
    return Math.min(this.lengthBeats, beat + (units - acc));
  }

  private convert(beat: number, includeBreathAtEnd: boolean): number {
    let units = 0;
    let prev = 0;
    for (const [a, e] of this.spans) {
      if (beat <= a + EPS) break;
      units += a - prev;
      const end = Math.min(beat, e);
      units += (end - a) * this.stretch;
      prev = end;
      if (beat < e - EPS) return units;
      const breathe = e < this.lengthBeats - EPS && (beat > e + EPS || (includeBreathAtEnd && Math.abs(beat - e) <= EPS));
      if (breathe) units += this.breath;
      prev = e;
    }
    return units + Math.max(0, beat - prev);
  }
}
