import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { engine } from "../audio";
import { effectiveGains } from "../audio/mix";
import { indexAtBeat, midiRange, phraseIndexAt, phrases, spanMidiRange, type Phrase } from "../lib/music";
import { invalidatePlayhead, subscribePlayhead } from "../state/playhead";
import { useStore } from "../state/store";
import { VOICES, type Chorale } from "../types";
import { draw, fermataX } from "./draw";
import { usePalette } from "./usePalette";
import { beatAtX, computeLayout, playheadX, yOf, type Layout, type LayoutMode } from "./geometry";

const DRAG_START = 8;
const SWIPE = 48;

export function RibbonView({ chorale, mode }: { chorale: Chorale; mode: LayoutMode }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fermataRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const layoutRef = useRef<Layout | null>(null);
  const paletteRef = usePalette();
  const [size, setSize] = useState({ w: 0, h: 0, dpr: 1, rem: 16 });
  const list = useMemo(() => phrases(chorale), [chorale]);
  const range = useMemo(() => midiRange(chorale), [chorale]);
  const loop = useStore((s) => s.loop);

  // Size, device pixel ratio and text size.
  useEffect(() => {
    const el = wrapRef.current!;
    const measure = () => {
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      setSize({ w: el.clientWidth, h: el.clientHeight, dpr: Math.min(3, window.devicePixelRatio || 1), rem });
    };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    measure();
    return () => ro.disconnect();
  }, []);

  const render = useCallback(
    (beat: number) => {
      const canvas = canvasRef.current;
      if (!canvas || !size.w || !paletteRef.current) return;
      const phrase: Phrase | null = mode === "phrase" ? list[phraseIndexAt(list, beat)]! : null;
      // On a phone each phrase fills the canvas, so its own pitch range sets the vertical scale.
      const r = phrase ? spanMidiRange(chorale, phrase.start, phrase.end) : range;
      const l = computeLayout({ width: size.w, height: size.h, rem: size.rem, mode, range: r, phrase });
      layoutRef.current = l;
      const ctx = canvas.getContext("2d")!;
      ctx.setTransform(size.dpr, 0, 0, size.dpr, 0, 0);
      const s = useStore.getState();
      draw(ctx, l, {
        chorale,
        phrases: list,
        beat,
        gains: effectiveGains(s.voices, s.solo),
        loop: s.loop,
        loopCount: s.loopCount,
        pendingLoopPhrase: s.pendingLoopFrom,
        verse: s.verse,
        palette: paletteRef.current,
        highContrast: s.highContrast,
        letterSlots: [],
      });
      // Keep the fermata buttons over their signs.
      list.forEach((ph, i) => {
        const btn = fermataRefs.current[i];
        if (!btn) return;
        const x = fermataX(l, chorale, ph, beat);
        const visible = x > -10 && x < l.width + 10 && (!phrase || phrase.index === ph.index);
        btn.style.visibility = visible ? "visible" : "hidden";
        btn.style.transform = `translate(${x - size.rem * 1.375}px, ${l.fermataY - size.rem * 1.6}px)`;
      });
    },
    [chorale, list, mode, range, size],
  );

  useEffect(() => subscribePlayhead((b) => render(b)), [render]);
  useEffect(() => useStore.subscribe(() => invalidatePlayhead()), []);

  // --- Pointer: tap a note to hear it, tap elsewhere to move there, drag to scrub ---------

  const drag = useRef<{
    id: number;
    x: number;
    y: number;
    beat: number;
    wasPlaying: boolean;
    kind: "none" | "scrub" | "swipe";
    lastChord: number;
  } | null>(null);

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return;
    void engine.unlock();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, beat: engine.currentBeat(), wasPlaying: engine.isPlaying(), kind: "none", lastChord: -1 };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const d = drag.current;
    const l = layoutRef.current;
    if (!d || d.id !== e.pointerId || !l) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (d.kind === "none") {
      if (Math.abs(dx) < DRAG_START || Math.abs(dx) < Math.abs(dy)) return;
      const nearPlayhead = Math.abs(d.x - e.currentTarget.getBoundingClientRect().left - playheadX(l, d.beat)) < size.rem * 1.5;
      d.kind = l.mode === "scroll" || nearPlayhead ? "scrub" : "swipe";
      if (d.kind === "scrub" && d.wasPlaying) engine.pause();
    }
    if (d.kind !== "scrub") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const beat = l.mode === "scroll" ? d.beat - dx / l.beatW : beatAtX(l, e.clientX - rect.left, d.beat);
    const clamped = Math.max(0, Math.min(chorale.lengthBeats - 0.01, beat));
    engine.seek(clamped);
    const ci = indexAtBeat(chorale.chords, clamped, (c) => c.beat);
    if (ci !== d.lastChord) {
      d.lastChord = ci;
      void engine.previewChord(clamped, 0.25);
    }
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const d = drag.current;
    const l = layoutRef.current;
    drag.current = null;
    if (!d || d.id !== e.pointerId || !l) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (d.kind === "scrub") {
      if (d.wasPlaying) void engine.play();
      return;
    }
    if (d.kind === "swipe") {
      const dx = e.clientX - d.x;
      if (Math.abs(dx) < SWIPE) return;
      const cur = phraseIndexAt(list, d.beat);
      const next = Math.max(0, Math.min(list.length - 1, cur + (dx < 0 ? 1 : -1)));
      engine.seek(list[next]!.start);
      return;
    }
    // A tap.
    const hit = hitNote(l, chorale, x, y, d.beat);
    if (hit) {
      void engine.previewNote(hit.voice, hit.midi);
      return;
    }
    const beat = beatAtX(l, x, d.beat);
    const ci = indexAtBeat(chorale.chords, beat, (c) => c.beat);
    engine.seek(chorale.chords[ci]!.beat);
  };

  // Trackpad and wheel move through the music while paused.
  useEffect(() => {
    const canvas = canvasRef.current!;
    const onWheel = (e: WheelEvent) => {
      const l = layoutRef.current;
      if (!l || engine.isPlaying()) return;
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.shiftKey ? e.deltaY : 0;
      if (!delta) return;
      e.preventDefault();
      const beat = engine.currentBeat() + delta / (l.mode === "scroll" ? l.beatW : l.beatW * 4);
      engine.seek(Math.max(0, Math.min(chorale.lengthBeats - 0.01, beat)));
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, [chorale]);

  const tapFermata = useStore((s) => s.tapFermata);

  return (
    <div className="ribbons" ref={wrapRef}>
      <canvas
        ref={canvasRef}
        width={Math.round(size.w * size.dpr)}
        height={Math.round(size.h * size.dpr)}
        style={{ width: size.w, height: size.h }}
        aria-hidden="true"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (drag.current = null)}
      />
      <div className="fermata-layer">
        {list.map((ph, i) => {
          const looped = !!loop && ph.index >= loop.from && ph.index <= loop.to;
          return (
            <button
              key={ph.index}
              type="button"
              className="fermata-target"
              ref={(el) => (fermataRefs.current[i] = el)}
              aria-pressed={looped}
              aria-label={`Loop phrase ${ph.index + 1}`}
              onClick={() => tapFermata(ph.index)}
            />
          );
        })}
      </div>
    </div>
  );
}

/** The note under a tap, with a hit area larger than the drawn note. */
function hitNote(l: Layout, c: Chorale, x: number, y: number, beat: number) {
  const slop = Math.max(10, l.rem * 0.7);
  let best: { voice: (typeof VOICES)[number]; midi: number; dist: number } | null = null;
  const b = beatAtX(l, x, beat);
  for (const v of VOICES) {
    const notes = c.voices[v];
    const i = indexAtBeat(notes, b, (n) => n[1]);
    for (const k of [i - 1, i, i + 1]) {
      const n = notes[k];
      if (!n) continue;
      const inX = b >= n[1] - slop / l.beatW && b <= n[1] + n[2] + slop / l.beatW;
      const dy = Math.abs(yOf(l, n[0]) - y);
      if (inX && dy <= slop && (!best || dy < best.dist)) best = { voice: v, midi: n[0], dist: dy };
    }
  }
  return best;
}
