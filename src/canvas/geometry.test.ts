import { describe, expect, it } from "vitest";
import { beatAtX, computeLayout, playheadX, xOf, yOf } from "./geometry";

const base = { width: 900, height: 400, rem: 16, range: [43, 79] as [number, number] };

describe("scroll layout", () => {
  const l = computeLayout({ ...base, mode: "scroll", phrase: null });

  it("fixes the playhead at a third of the width once under way", () => {
    expect(playheadX(l, 20)).toBe(300);
    expect(playheadX(l, 30)).toBe(300);
  });

  it("starts the playhead near the left edge at the opening", () => {
    expect(playheadX(l, 0)).toBeLessThan(100);
  });

  it("round-trips x and beat", () => {
    for (const play of [0, 3, 20]) for (const b of [0, 5.5, 21]) expect(beatAtX(l, xOf(l, b, play), play)).toBeCloseTo(b);
  });

  it("puts higher notes higher", () => {
    expect(yOf(l, 72)).toBeLessThan(yOf(l, 60));
  });

  it("keeps the lyric line and gauge inside the canvas", () => {
    expect(l.rollBottom).toBeLessThan(l.lyricY);
    expect(l.gaugeTop + l.gaugeH).toBeLessThanOrEqual(400);
  });
});

describe("phrase layout", () => {
  const phrase = { index: 1, start: 8, end: 16, fermataStart: 13 };
  const l = computeLayout({ ...base, width: 390, mode: "phrase", phrase });

  it("fits the whole phrase in the width", () => {
    expect(xOf(l, 8, 10)).toBe(l.pad);
    expect(xOf(l, 16, 10)).toBeCloseTo(390 - l.pad);
  });

  it("moves the playhead across the phrase", () => {
    expect(playheadX(l, 12)).toBeCloseTo((xOf(l, 8, 0) + xOf(l, 16, 0)) / 2);
  });
});
