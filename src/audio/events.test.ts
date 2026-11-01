import { describe, expect, it } from "vitest";
import type { Chorale } from "../types";
import { buildEvents, firstEventAt } from "./events";
import { TempoMap } from "./tempoMap";

const c = {
  lengthBeats: 4,
  fermatas: [[2, 3]],
  voices: { S: [[72, 0, 1, "C5"], [72, 1, 1, "C5"], [74, 2, 1, "D5"], [72, 3, 1, "C5"]], A: [], T: [], B: [[48, 0, 4, "C3"]] },
} as unknown as Chorale;

describe("buildEvents", () => {
  const tm = new TempoMap(c.fermatas, 4, 2, 0.5);
  const ev = buildEvents(c, tm);

  it("releases a repeated note before striking it again", () => {
    const at1 = ev.filter((e) => e.units === 1 && e.voice === "S").map((e) => e.type);
    expect(at1).toEqual(["off", "on"]);
  });

  it("stretches the fermata and breathes after it", () => {
    const d5 = ev.filter((e) => e.voice === "S" && e.note === 2);
    expect(d5.map((e) => e.units)).toEqual([2, 4]);
    const last = ev.find((e) => e.voice === "S" && e.note === 3 && e.type === "on")!;
    expect(last.units).toBeCloseTo(4.5);
  });

  it("is in time order", () => {
    for (let i = 1; i < ev.length; i++) expect(ev[i]!.units).toBeGreaterThanOrEqual(ev[i - 1]!.units);
  });

  it("finds where to start scheduling from", () => {
    expect(ev[firstEventAt(ev, 2)]!.units).toBe(2);
    expect(firstEventAt(ev, 99)).toBe(ev.length);
  });
});
