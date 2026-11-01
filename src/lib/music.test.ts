import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { Chorale } from "../types";
import { barAndBeat, spanMidiRange, nextStep, notesAt, phraseIndexAt, phrases, spokenChord, spokenPitch, stepPoints, wordAt } from "./music";

// The real generated data for the Passion Chorale, so these tests track the pipeline.
const c = JSON.parse(readFileSync(new URL("../../public/data/bwv244.54.json", import.meta.url), "utf8")) as Chorale;

describe("phrases", () => {
  it("runs from one fermata's end to the next", () => {
    const list = phrases(c);
    expect(list).toHaveLength(8);
    expect(list[0]).toMatchObject({ start: 0, end: 8 });
    expect(list[1]).toMatchObject({ start: 8, end: 16 });
    expect(list[7]!.end).toBe(64);
  });

  it("finds the phrase at a beat", () => {
    const list = phrases(c);
    expect(phraseIndexAt(list, 0)).toBe(0);
    expect(phraseIndexAt(list, 7.9)).toBe(0);
    expect(phraseIndexAt(list, 8)).toBe(1);
  });
});

describe("barAndBeat", () => {
  it("counts the pickup as bar 0, on the last beat", () => {
    expect(barAndBeat(c, 0)).toEqual({ bar: 0, beat: 4 });
  });
  it("counts bars from the first downbeat", () => {
    expect(barAndBeat(c, 1)).toEqual({ bar: 1, beat: 1 });
    expect(barAndBeat(c, 7)).toEqual({ bar: 2, beat: 3 });
  });
});

describe("what sounds where", () => {
  it("gives the four notes at a beat", () => {
    const n = notesAt(c, 0);
    expect(n.S?.[3]).toBe("A4");
    expect(n.B?.[3]).toBe("D4");
  });

  it("joins a word's syllables", () => {
    expect(wordAt(c, 5, 0)).toBe("Wunden,");
    expect(wordAt(c, 7, 0)).toBe("Wunden,");
    expect(wordAt(c, 0, 0)).toBe("O");
  });

  it("steps chord by chord", () => {
    const pts = stepPoints(c);
    expect(nextStep(pts, 0, 1)).toBe(0.5);
    expect(nextStep(pts, 0.5, -1)).toBe(0);
    expect(nextStep(pts, 0, -1)).toBe(0);
  });
});

describe("spoken text", () => {
  it("reads accidentals and chord qualities aloud", () => {
    expect(spokenPitch("B♭3")).toBe("B flat 3");
    expect(spokenChord("B♭")).toBe("B flat major");
    expect(spokenChord("Eø7")).toBe("E half-diminished seventh");
    expect(spokenChord("")).toBe("passing chord");
  });
});

describe("spanMidiRange", () => {
  it("covers every note in the span, at least an octave and a half wide", () => {
    const [lo, hi] = spanMidiRange(c, 0, 8);
    expect(hi - lo).toBeGreaterThanOrEqual(18);
    expect(lo).toBeLessThanOrEqual(46);
    expect(hi).toBeGreaterThanOrEqual(74); // D5, the top of phrase 1
  });
});
