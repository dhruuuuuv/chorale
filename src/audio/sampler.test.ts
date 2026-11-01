import { describe, expect, it } from "vitest";
import { hasSamples, loopPoints, nearestSample } from "./sampler";

describe("nearestSample", () => {
  const samples = [{ midi: 60 }, { midi: 64 }, { midi: 67 }];

  it("plays a recorded note at its own pitch", () => {
    expect(nearestSample(samples, 64)).toEqual({ sample: { midi: 64 }, rate: 1 });
  });

  it("transposes the closest note", () => {
    const r = nearestSample(samples, 66)!;
    expect(r.sample.midi).toBe(67);
    expect(r.rate).toBeCloseTo(Math.pow(2, -1 / 12));
  });

  it("centres a singer who was slightly sharp or flat", () => {
    const r = nearestSample([{ midi: 64, cents: 20 }], 64)!;
    expect(r.rate).toBeCloseTo(Math.pow(2, -0.2 / 12));
  });

  it("returns nothing when a voice has no samples", () => {
    expect(nearestSample([], 60)).toBeNull();
  });
});

describe("hasSamples", () => {
  it("is false for an empty map, so the organ is used", () => {
    expect(hasSamples({ version: 1, voices: {} }, "S")).toBe(false);
    expect(hasSamples({ version: 1, voices: { S: [{ midi: 60, url: "s.m4a" }] } }, "S")).toBe(true);
  });
});

describe("loopPoints", () => {
  it("uses the loop baked by the pipeline", () => {
    expect(loopPoints({ midi: 60, url: "x", start: 0.3, loopStart: 1.2, loopEnd: 4.2 }, 4.4)).toEqual({ start: 0.3, loopStart: 1.2, loopEnd: 4.2 });
  });

  it("falls back to a safe loop for a sample without one", () => {
    const p = loopPoints({ midi: 60, url: "x" }, 3);
    expect(p).toEqual({ start: 0, loopStart: 1, loopEnd: 3 });
  });

  it("never starts after the loop or loops past the end", () => {
    const p = loopPoints({ midi: 60, url: "x", start: 5, loopStart: 1.2, loopEnd: 9 }, 4);
    expect(p.loopEnd).toBe(4);
    expect(p.start).toBeLessThanOrEqual(p.loopStart);
  });
});
