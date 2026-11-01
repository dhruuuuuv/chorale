import { describe, expect, it } from "vitest";
import type { Chorale } from "../types";
import { anchorPoints, beatAtXScore, mapNotes, voiceFor, xAtBeat } from "./noteMap";

const chorale = {
  voices: {
    S: [[69, 0, 1, "A4"], [74, 1, 3, "D5"]],
    A: [[65, 0, 2, "F4"], [64, 2, 2, "E4"]],
    T: [[62, 0, 4, "D4"]],
    B: [[50, 0, 4, "D3"]],
  },
} as unknown as Chorale;

describe("voiceFor", () => {
  it("reads soprano and alto from the upper staff, tenor and bass from the lower", () => {
    expect([voiceFor(0, 0), voiceFor(0, 1), voiceFor(1, 0), voiceFor(1, 1), voiceFor(2, 0)]).toEqual(["S", "A", "T", "B", null]);
  });
});

describe("mapNotes", () => {
  it("matches engraved ids to notes by voice and onset, tied halves included", () => {
    const timemap = [
      { qstamp: 0, on: ["s1", "a1", "t1"] },
      { qstamp: 1, on: ["s2"] },
      { qstamp: 3, on: ["s2tie"] },
    ];
    const voices = new Map([["s1", "S"], ["s2", "S"], ["s2tie", "S"], ["a1", "A"], ["t1", "T"]] as const);
    const m = mapNotes(chorale, timemap, new Map(voices));
    expect(m.get("s1")).toEqual({ voice: "S", index: 0, isStart: true, onset: 0 });
    expect(m.get("s2")).toEqual({ voice: "S", index: 1, isStart: true, onset: 1 });
    expect(m.get("s2tie")).toEqual({ voice: "S", index: 1, isStart: false, onset: 3 });
    expect(m.get("a1")?.voice).toBe("A");
  });
});

describe("beat to x", () => {
  const pts = anchorPoints([[0, 100], [0, 98], [1, 150], [2, 260], [2, 255]]);

  it("keeps the leftmost head per onset", () => {
    expect(pts).toEqual([[0, 98], [1, 150], [2, 255]]);
  });

  it("interpolates and inverts", () => {
    expect(xAtBeat(pts, 0.5)).toBeCloseTo(124);
    expect(beatAtXScore(pts, xAtBeat(pts, 1.3))).toBeCloseTo(1.3);
  });

  it("extrapolates past the last onset", () => {
    expect(xAtBeat(pts, 3)).toBeCloseTo(360);
  });
});
