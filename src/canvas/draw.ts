import { VOICES, type Chorale, type Voice } from "../types";
import type { Phrase } from "../lib/music";
import { indexAtBeat } from "../lib/music";
import { playheadX, visibleBeats, xOf, yOf, type Layout } from "./geometry";

export interface Palette {
  ink: string;
  ink2: string;
  ink3: string;
  rule: string;
  grid: string;
  paper: string;
  sheet: string;
  clash: string;
  voice: Record<Voice, string>;
}

export interface DrawState {
  chorale: Chorale;
  phrases: Phrase[];
  beat: number;
  /** Effective gain per voice, 0 to 1. Zero draws the voice as a dashed outline. */
  gains: Record<Voice, number>;
  loop: { start: number; end: number } | null;
  loopCount: number;
  pendingLoopPhrase: number | null;
  verse: number;
  palette: Palette;
  highContrast: boolean;
  /** Filled while drawing: where voice letters have been placed this frame. */
  letterSlots: [number, number][];
}

/** High-contrast dash patterns, so voices can be told apart without colour. */
const DASHES: Record<Voice, number[]> = { S: [], A: [7, 4], T: [2, 3], B: [9, 3, 2, 3] };
const EPS = 1e-6;

const clashMax = new WeakMap<Chorale, number>();

/** The top of the tension gauge for a chorale: its highest clash, but never below 4.5. */
export function maxClash(c: Chorale): number {
  let m = clashMax.get(c);
  if (m === undefined) {
    m = c.chords.reduce((acc, ch) => Math.max(acc, ch.clash), 4.5);
    clashMax.set(c, m);
  }
  return m;
}

export function readPalette(el: Element): Palette {
  const cs = getComputedStyle(el);
  const v = (n: string) => cs.getPropertyValue(n).trim();
  return {
    ink: v("--ink"),
    ink2: v("--ink-2"),
    ink3: v("--ink-3"),
    rule: v("--rule"),
    grid: v("--grid"),
    paper: v("--paper"),
    sheet: v("--sheet"),
    clash: v("--clash"),
    voice: { S: v("--v-s"), A: v("--v-a"), T: v("--v-t"), B: v("--v-b") },
  };
}

export function draw(ctx: CanvasRenderingContext2D, l: Layout, s: DrawState): void {
  const { chorale: c, palette: p, beat } = s;
  const rem = l.rem;
  ctx.clearRect(0, 0, l.width, l.height);
  const [from, to] = visibleBeats(l, beat);
  const X = (b: number) => xOf(l, b, beat);

  // Loop region: a faint wash behind the music.
  if (s.loop) {
    ctx.fillStyle = withAlpha(p.ink, 0.045);
    ctx.fillRect(X(s.loop.start), l.rollTop - rem * 0.25, X(s.loop.end) - X(s.loop.start), l.gaugeTop + l.gaugeH - l.rollTop + rem * 0.25);
  }

  // Bar lines and octave guides.
  ctx.lineWidth = 1;
  ctx.strokeStyle = p.rule;
  ctx.beginPath();
  for (const b of c.bars) {
    if (b < from || b > to) continue;
    const x = Math.round(X(b)) + 0.5;
    ctx.moveTo(x, l.rollTop - rem * 0.25);
    ctx.lineTo(x, l.rollBottom);
  }
  ctx.stroke();
  ctx.strokeStyle = p.grid;
  ctx.beginPath();
  for (let m = 36; m <= 84; m += 12) {
    if (m < l.lo || m > l.hi) continue;
    const y = Math.round(yOf(l, m)) + 0.5;
    ctx.moveTo(Math.max(0, X(0)), y);
    ctx.lineTo(Math.min(l.width, X(c.lengthBeats)), y);
  }
  ctx.stroke();

  // Header: phrase labels, fermatas, loop bracket.
  ctx.font = `400 ${0.8 * rem}px ${uiFamily()}`;
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = p.ink3;
  for (const ph of s.phrases) {
    if (ph.end < from || ph.start > to) continue;
    ctx.fillText(`Phrase ${ph.index + 1}`, X(ph.start) + 2, l.headerTop + rem * 1.55);
  }
  for (const ph of s.phrases) {
    const x = fermataX(l, c, ph, beat);
    if (x < -rem * 2 || x > l.width + rem * 2) continue;
    const inLoop = !!s.loop && ph.fermataStart >= s.loop.start - EPS && ph.end <= s.loop.end + EPS;
    drawFermata(ctx, x, l.fermataY, rem, inLoop || s.pendingLoopPhrase === ph.index ? p.ink : p.ink2, inLoop);
  }
  if (s.loop) drawLoopBracket(ctx, X(s.loop.start), X(s.loop.end), l, s.loopCount, p);

  // Tension gauge.
  drawGauge(ctx, l, s, X, from, to);

  // Voices, lowest first so the soprano sits on top where lines cross.
  for (const v of [...VOICES].reverse()) drawVoice(ctx, l, s, v, X, from, to);

  // Words.
  drawLyrics(ctx, l, s, X, from, to);

  // Phone portrait shows one phrase: let the neighbours fade into the paper.
  if (l.mode === "phrase" && l.phrase) {
    ctx.fillStyle = withAlpha(p.paper, 0.82);
    const a = X(l.phrase.start) - l.rem * 1.6;
    const b = X(l.phrase.end) + 2;
    if (a > 0) ctx.fillRect(0, 0, a, l.height);
    if (b < l.width) ctx.fillRect(b, 0, l.width - b, l.height);
  }

  // Playhead.
  const px = Math.round(playheadX(l, beat)) + 0.5;
  ctx.strokeStyle = p.ink;
  ctx.lineWidth = 2;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(px, l.rollTop - rem * 0.5);
  ctx.lineTo(px, l.gaugeTop + l.gaugeH);
  ctx.stroke();
  ctx.fillStyle = p.ink;
  ctx.beginPath();
  ctx.moveTo(px - rem * 0.32, l.rollTop - rem * 0.75);
  ctx.lineTo(px + rem * 0.32, l.rollTop - rem * 0.75);
  ctx.lineTo(px, l.rollTop - rem * 0.4);
  ctx.closePath();
  ctx.fill();
}

/** Centre of the fermata sign for a phrase: over the first beat of its held note. */
export function fermataX(l: Layout, c: Chorale, ph: Phrase, beat: number): number {
  const f = c.fermatas[ph.index];
  if (!f) return -9999;
  const end = Math.min(f[1], f[0] + 1);
  return (xOf(l, f[0], beat) + xOf(l, end, beat)) / 2;
}

function drawFermata(ctx: CanvasRenderingContext2D, x: number, y: number, rem: number, color: string, strong: boolean) {
  const r = rem * 0.6;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = strong ? 2.2 : 1.6;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.arc(x, y, r, Math.PI, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y - rem * 0.12, strong ? 2.6 : 2.1, 0, Math.PI * 2);
  ctx.fill();
}

function drawLoopBracket(ctx: CanvasRenderingContext2D, x0: number, x1: number, l: Layout, count: number, p: Palette) {
  const y = l.headerTop + l.rem * 0.35;
  const tick = l.rem * 0.45;
  ctx.strokeStyle = p.ink;
  ctx.lineWidth = 2;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(x0 + 1, y + tick);
  ctx.lineTo(x0 + 1, y);
  ctx.lineTo(x1 - 1, y);
  ctx.lineTo(x1 - 1, y + tick);
  ctx.stroke();
  // The repeat count sits on the bracket, centred, so it never meets a phrase label.
  const label = count > 0 ? `Loop ×${count + 1}` : "Loop";
  ctx.font = `700 ${0.8 * l.rem}px ${uiFamily()}`;
  const w = ctx.measureText(label).width;
  const lx = (x0 + x1) / 2 - w / 2;
  ctx.fillStyle = p.paper;
  ctx.fillRect(lx - 6, y - l.rem * 0.55, w + 12, l.rem * 1.1);
  ctx.fillStyle = p.ink;
  ctx.textBaseline = "middle";
  ctx.fillText(label, lx, y + 0.5);
  ctx.textBaseline = "alphabetic";
}

function drawGauge(ctx: CanvasRenderingContext2D, l: Layout, s: DrawState, X: (b: number) => number, from: number, to: number) {
  const { chorale: c, palette: p } = s;
  const base = l.gaugeTop + l.gaugeH;
  const max = maxClash(c);
  ctx.strokeStyle = p.rule;
  ctx.lineWidth = 1;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(Math.max(0, X(0)), base + 0.5);
  ctx.lineTo(Math.min(l.width, X(c.lengthBeats)), base + 0.5);
  ctx.stroke();

  const start = Math.max(0, indexAtBeat(c.chords, from, (ch) => ch.beat));
  ctx.beginPath();
  ctx.moveTo(X(c.chords[start]!.beat), base);
  let lastX = X(c.chords[start]!.beat);
  for (let i = start; i < c.chords.length; i++) {
    const ch = c.chords[i]!;
    if (ch.beat > to) break;
    const y = base - (ch.clash / max) * l.gaugeH;
    lastX = X(ch.beat + ch.dur);
    ctx.lineTo(X(ch.beat), y);
    ctx.lineTo(lastX, y);
  }
  ctx.lineTo(lastX, base);
  ctx.closePath();
  ctx.fillStyle = withAlpha(p.clash, 0.26);
  ctx.strokeStyle = p.clash;
  ctx.lineWidth = 1.25;
  ctx.lineJoin = "round";
  ctx.fill();
  ctx.stroke();

  ctx.font = `400 ${0.78 * l.rem}px ${uiFamily()}`;
  const labelX = l.mode === "phrase" ? l.pad * 0.2 : 6;
  ctx.fillStyle = p.paper;
  const w = ctx.measureText("Clash").width;
  ctx.fillRect(labelX - 2, l.gaugeTop - 2, w + 6, l.rem);
  ctx.fillStyle = p.ink3;
  ctx.fillText("Clash", labelX, l.gaugeTop + l.rem * 0.6);
}

function drawVoice(ctx: CanvasRenderingContext2D, l: Layout, s: DrawState, v: Voice, X: (b: number) => number, from: number, to: number) {
  const { chorale: c, palette: p, beat } = s;
  const notes = c.voices[v];
  const color = p.voice[v];
  const gain = s.gains[v];
  const silent = gain <= 0.001;
  const alpha = silent ? 0.55 : 0.35 + 0.65 * Math.min(1, gain);
  const first = Math.max(0, indexAtBeat(notes, from, (n) => n[1]) - 1);
  const rem = l.rem;
  const dash = silent ? [5, 4] : s.highContrast ? DASHES[v] : [];

  // The line joining the notes.
  ctx.globalAlpha = alpha * (silent ? 0.8 : 0.5);
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1.5, rem * 0.14);
  ctx.lineCap = "round";
  ctx.setLineDash(dash);
  ctx.beginPath();
  let started = false;
  for (let i = first; i < notes.length; i++) {
    const [m, o, d] = notes[i]!;
    if (o > to + 2) break;
    const y = yOf(l, m);
    const x0 = X(o) + 2;
    const x1 = X(o + d) - 4;
    if (!started) {
      ctx.moveTo(x0, y);
      started = true;
    } else {
      const [pm, po, pd] = notes[i - 1]!;
      const px = X(po + pd) - 4;
      const py = yOf(l, pm);
      ctx.bezierCurveTo(px + 6, py, x0 - 6, y, x0, y);
    }
    ctx.lineTo(x1, y);
  }
  ctx.stroke();

  // The notes.
  ctx.globalAlpha = alpha;
  const h = l.noteH;
  for (let i = first; i < notes.length; i++) {
    const [m, o, d] = notes[i]!;
    if (o > to) break;
    if (o + d < from) continue;
    const x = X(o) + 1;
    const w = Math.max(4, d * l.beatW - 3);
    const y = yOf(l, m) - h / 2;
    const on = beat >= o - EPS && beat < o + d - EPS;
    roundRect(ctx, x, y, w, h, Math.min(3, h / 2));
    if (silent) {
      ctx.setLineDash([4, 3]);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = color;
      ctx.stroke();
    } else {
      ctx.fillStyle = color;
      ctx.fill();
      if (on || s.highContrast) {
        ctx.setLineDash([]);
        ctx.lineWidth = on ? 2 : 1;
        ctx.strokeStyle = p.ink;
        ctx.stroke();
      }
    }
  }

  // The voice's letter at the start of each phrase, so colour never works alone.
  ctx.globalAlpha = silent ? 0.7 : 1;
  ctx.setLineDash([]);
  ctx.font = `700 ${0.78 * rem}px ${uiFamily()}`;
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  for (const ph of s.phrases) {
    if (ph.end < from || ph.start > to) continue;
    const n = notes[indexAtBeat(notes, ph.start, (x) => x[1])];
    if (!n || n[1] < ph.start - EPS) continue;
    let x = X(n[1]) - rem * 0.75;
    const y = yOf(l, n[0]);
    // Voices that start on the same pitch would print their letters on top of each other.
    while (s.letterSlots.some(([lx, ly]) => Math.abs(lx - x) < rem * 0.7 && Math.abs(ly - y) < rem * 0.8)) x -= rem * 0.7;
    s.letterSlots.push([x, y]);
    ctx.fillText(v, x, y + 0.5);
  }
  ctx.textBaseline = "alphabetic";
  ctx.globalAlpha = 1;
}

function drawLyrics(ctx: CanvasRenderingContext2D, l: Layout, s: DrawState, X: (b: number) => number, from: number, to: number) {
  const { chorale: c, palette: p, beat, verse } = s;
  ctx.font = `italic 400 ${1.0 * l.rem}px ${lyricFamily()}`;
  ctx.textBaseline = "alphabetic";
  let lastEnd = -Infinity;
  const current = indexAtBeat(c.lyrics, beat, (e) => e.beat);
  const start = Math.max(0, indexAtBeat(c.lyrics, from, (e) => e.beat) - 1);
  for (let i = start; i < c.lyrics.length; i++) {
    const ev = c.lyrics[i]!;
    if (ev.beat > to) break;
    const syl = ev.verses[verse];
    if (!syl?.text) continue;
    const text = syl.text + (syl.syllabic === "begin" || syl.syllabic === "middle" ? " –" : "");
    const x = Math.max(X(ev.beat) + l.rem * 0.35, lastEnd + l.rem * 0.3);
    ctx.fillStyle = i === current && c.lyrics[current]!.beat <= beat + EPS ? p.ink : p.ink2;
    ctx.fillText(text, x, l.lyricY);
    lastEnd = x + ctx.measureText(text).width;
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function withAlpha(color: string, a: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(color);
  if (!m) return color;
  const n = parseInt(m[1]!, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

const uiFamily = () => `"Atkinson Hyperlegible", system-ui, sans-serif`;
const lyricFamily = () => `"Spectral", Georgia, serif`;
