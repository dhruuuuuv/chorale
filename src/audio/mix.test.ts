import { describe, expect, it } from "vitest";
import { defaultVoices, effectiveGains, matchingMyPart, myPartPreset } from "./mix";

describe("effectiveGains", () => {
  it("plays every voice at its level by default", () => {
    expect(effectiveGains(defaultVoices(), null)).toEqual({ S: 1, A: 1, T: 1, B: 1 });
  });

  it("silences muted voices", () => {
    const v = defaultVoices();
    v.A.muted = true;
    expect(effectiveGains(v, null)).toEqual({ S: 1, A: 0, T: 1, B: 1 });
  });

  it("solo silences the others and wins over mute", () => {
    const v = defaultVoices();
    v.T.muted = true;
    expect(effectiveGains(v, "T")).toEqual({ S: 0, A: 0, T: 1, B: 0 });
  });

  it("respects levels set by dragging", () => {
    const v = defaultVoices();
    v.B.level = 0.5;
    expect(effectiveGains(v, null).B).toBe(0.5);
  });
});

describe("My part", () => {
  it("puts one voice at full level and the others at 30%", () => {
    expect(effectiveGains(myPartPreset("A"), null)).toEqual({ S: 0.3, A: 1, T: 0.3, B: 0.3 });
  });

  it("is recognised from the levels", () => {
    expect(matchingMyPart(myPartPreset("B"))).toBe("B");
    expect(matchingMyPart(defaultVoices())).toBe(null);
  });
});
