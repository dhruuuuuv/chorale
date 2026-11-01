import { VOICES, type Voice } from "../types";

export interface VoiceState {
  muted: boolean;
  /** 0 to 1, set by dragging the chip. */
  level: number;
}

export type VoiceStates = Record<Voice, VoiceState>;

/** Level of the other voices under the "My part" preset. */
export const MY_PART_OTHERS = 0.3;

export function defaultVoices(): VoiceStates {
  return { S: { muted: false, level: 1 }, A: { muted: false, level: 1 }, T: { muted: false, level: 1 }, B: { muted: false, level: 1 } };
}

/**
 * The gain each voice should play at, 0 to 1.
 * Solo wins over mute: a soloed voice sounds even if it was muted, and silences the rest.
 */
export function effectiveGains(voices: VoiceStates, solo: Voice | null): Record<Voice, number> {
  const out = {} as Record<Voice, number>;
  for (const v of VOICES) {
    if (solo) out[v] = v === solo ? voices[v].level || 1 : 0;
    else out[v] = voices[v].muted ? 0 : voices[v].level;
  }
  return out;
}

export function myPartPreset(part: Voice): VoiceStates {
  const out = defaultVoices();
  for (const v of VOICES) out[v].level = v === part ? 1 : MY_PART_OTHERS;
  return out;
}

/** Which "My part" preset the current levels match, if any. */
export function matchingMyPart(voices: VoiceStates): Voice | null {
  for (const part of VOICES) {
    const preset = myPartPreset(part);
    if (VOICES.every((v) => !voices[v].muted && Math.abs(voices[v].level - preset[v].level) < 0.01)) return part;
  }
  return null;
}
