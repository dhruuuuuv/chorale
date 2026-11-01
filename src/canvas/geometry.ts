import type { Phrase } from "../lib/music";

/**
 * Where everything sits on the ribbon canvas. Pure, so it can be tested and shared by the
 * renderer, the hit testing and the HTML overlay.
 *
 * Two modes:
 *  - scroll: the playhead is fixed at a third of the width and the music moves under it.
 *  - phrase: one phrase fills the width and the playhead moves across it (phone portrait).
 */
export type LayoutMode = "scroll" | "phrase";

export interface Layout {
  mode: LayoutMode;
  width: number;
  height: number;
  /** Root font size, so labels follow the system text size. */
  rem: number;
  beatW: number;
  playheadX: number;
  phrase: Phrase | null;
  pad: number;
  headerTop: number;
  fermataY: number;
  rollTop: number;
  rollBottom: number;
  lo: number;
  hi: number;
  rowH: number;
  noteH: number;
  lyricY: number;
  gaugeTop: number;
  gaugeH: number;
}

export function computeLayout(opts: {
  width: number;
  height: number;
  rem: number;
  mode: LayoutMode;
  range: [number, number];
  phrase: Phrase | null;
}): Layout {
  const { width, height, rem, mode, range, phrase } = opts;
  // Phrase mode leaves room on the left for the voice letters.
  const pad = Math.round(rem * (mode === "phrase" ? 2.25 : 1.25));
  const headerTop = Math.round(rem * 0.5);
  const fermataY = headerTop + rem * 2.15;
  const rollTop = Math.round(rem * 3.5);
  const gaugeH = Math.round(rem * 2.25);
  const gaugeTop = height - gaugeH - Math.round(rem * 0.5);
  const lyricY = gaugeTop - Math.round(rem * 0.9);
  const rollBottom = lyricY - Math.round(rem * 1.6);
  const lo = range[0] - 1;
  const hi = range[1] + 1;
  const rowH = Math.max(2, (rollBottom - rollTop) / (hi - lo + 1));
  const noteH = Math.max(4, Math.min(rem * 0.75, rowH * 0.9));

  let beatW: number;
  let playheadX: number;
  if (mode === "phrase" && phrase) {
    beatW = (width - pad * 2) / Math.max(1, phrase.end - phrase.start);
    playheadX = 0;
  } else {
    beatW = Math.round(rem * 2.75);
    playheadX = Math.round(width / 3);
  }

  return { mode, width, height, rem, beatW, playheadX, phrase, pad, headerTop, fermataY, rollTop, rollBottom, lo, hi, rowH, noteH, lyricY, gaugeTop, gaugeH };
}

/**
 * In scroll mode the playhead travels from the left edge until it reaches a third of the
 * width, then stays there while the music moves, so the opening bars never sit half-empty.
 */
function scrollPlayX(l: Layout, playBeat: number): number {
  return Math.min(l.playheadX, l.pad * 2 + playBeat * l.beatW);
}

/** Screen x of a beat, given where the playhead is. */
export function xOf(l: Layout, beat: number, playBeat: number): number {
  if (l.mode === "phrase" && l.phrase) return l.pad + (beat - l.phrase.start) * l.beatW;
  return scrollPlayX(l, playBeat) + (beat - playBeat) * l.beatW;
}

export function beatAtX(l: Layout, x: number, playBeat: number): number {
  if (l.mode === "phrase" && l.phrase) return l.phrase.start + (x - l.pad) / l.beatW;
  return playBeat + (x - scrollPlayX(l, playBeat)) / l.beatW;
}

export function yOf(l: Layout, midi: number): number {
  return l.rollTop + (l.hi - midi + 0.5) * l.rowH;
}

/** The playhead's x: fixed in scroll mode, moving in phrase mode. */
export function playheadX(l: Layout, playBeat: number): number {
  return xOf(l, playBeat, playBeat);
}

/** Beats visible on screen, with a margin, so drawing can skip the rest. */
export function visibleBeats(l: Layout, playBeat: number): [number, number] {
  const a = beatAtX(l, -l.beatW * 2, playBeat);
  const b = beatAtX(l, l.width + l.beatW * 2, playBeat);
  return [a, b];
}
