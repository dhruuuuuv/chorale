import { describe, expect, it } from "vitest";
import { TempoMap } from "./tempoMap";

// Passion Chorale fermatas (BWV 244.54)
const F: [number, number][] = [[7, 8], [13, 16], [23, 24], [29, 32], [39, 40], [45, 48], [55, 56], [61, 64]];

// The prototype's beat-to-unit mapping, kept here to prove the port is faithful.
function prototypeB2u(b: number, fs: [number, number][], ferm: number) {
  let u = 0;
  let p = 0;
  for (const [a, e] of fs) {
    if (b <= a) break;
    u += a - p;
    const end = Math.min(b, e);
    u += (end - a) * ferm;
    p = end;
  }
  if (b > p) u += b - p;
  return u;
}

describe("TempoMap", () => {
  it("matches the prototype when there is no breath", () => {
    const tm = new TempoMap(F, 64, 1.7, 0);
    for (let b = 0; b <= 64; b += 0.25) expect(tm.onset(b)).toBeCloseTo(prototypeB2u(b, F, 1.7), 9);
  });

  it("holds each fermata for its stretch", () => {
    const tm = new TempoMap(F, 64, 2, 0);
    expect(tm.release(8) - tm.onset(7)).toBeCloseTo(2);
    expect(tm.release(16) - tm.onset(13)).toBeCloseTo(6);
  });

  it("adds a breath after a fermata, but not after the last one", () => {
    const tm = new TempoMap(F, 64, 1, 0.5);
    expect(tm.release(8)).toBeCloseTo(8);
    expect(tm.onset(8)).toBeCloseTo(8.5);
    expect(tm.onset(9)).toBeCloseTo(9.5);
    expect(tm.totalUnits).toBeCloseTo(64 + 0.5 * 7);
  });

  it("round-trips beats through units", () => {
    const tm = new TempoMap(F, 64, 1.7, 0.4);
    for (let b = 0; b < 64; b += 0.25) expect(tm.toBeat(tm.onset(b))).toBeCloseTo(b, 6);
  });

  it("keeps the playhead at the fermata end during the breath", () => {
    const tm = new TempoMap(F, 64, 1, 0.5);
    expect(tm.toBeat(8.25)).toBeCloseTo(8);
    expect(tm.toBeat(8.5)).toBeCloseTo(8);
    expect(tm.toBeat(8.75)).toBeCloseTo(8.25);
  });

  it("is monotonic", () => {
    const tm = new TempoMap(F, 64, 2.3, 0.4);
    let last = -1;
    for (let b = 0; b <= 64; b += 0.125) {
      const u = tm.onset(b);
      expect(u).toBeGreaterThanOrEqual(last);
      last = u;
    }
  });
});
