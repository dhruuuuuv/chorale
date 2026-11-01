import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { engine } from "../audio";
import { effectiveGains } from "../audio/mix";
import { maxClash, type Palette } from "../canvas/draw";
import { usePalette } from "../canvas/usePalette";
import { indexAtBeat, phrases } from "../lib/music";
import { invalidatePlayhead, subscribePlayhead } from "../state/playhead";
import { useStore } from "../state/store";
import { VOICES, type Chorale, type Voice } from "../types";
import { anchorPoints, beatAtXScore, mapNotes, voiceFor, xAtBeat, type NoteRef } from "./noteMap";
import type { RenderResponse } from "./verovio.worker";

let worker: Worker | null = null;
let nextRequest = 0;
const pending = new Map<string, (r: RenderResponse) => void>();

/** Fail every waiting request, and start a fresh worker next time. */
function failAll(error: string) {
  for (const [key, resolve] of pending) resolve({ id: key, ok: false, error });
  pending.clear();
  worker?.terminate();
  worker = null;
}

function engrave(xml: string): Promise<RenderResponse> {
  if (!worker) {
    worker = new Worker(new URL("./verovio.worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (e: MessageEvent<RenderResponse>) => {
      pending.get(e.data.id)?.(e.data);
      pending.delete(e.data.id);
    };
    // If the engraver itself can't load (offline before it was cached, say), say so.
    worker.onerror = () => failAll("the score engraver could not load");
    worker.onmessageerror = () => failAll("the score engraver sent an unreadable reply");
  }
  // Each request has its own key, so two requests for one chorale never share a resolver.
  const key = String(++nextRequest);
  return new Promise((resolve) => {
    pending.set(key, resolve);
    worker!.postMessage({ id: key, xml });
  });
}

const cache = new Map<string, Extract<RenderResponse, { ok: true }>>();

type Status = { kind: "loading" } | { kind: "ready"; svg: string; timemap: Extract<RenderResponse, { ok: true }>["timemap"] } | { kind: "error"; offline: boolean };

const DRAG_START = 8;

/** Real SATB notation on two staves, following the same playhead as the ribbons. */
export function ScoreView({ chorale }: { chorale: Chorale }) {
  const [status, setStatus] = useState<Status>({ kind: "loading" });
  const wrapRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const bandRef = useRef<HTMLCanvasElement>(null);
  const fermataRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const map = useRef<{ notes: Map<string, NoteRef>; byNote: Map<string, Element[]>; points: [number, number][] } | null>(null);
  const lit = useRef<Element[]>([]);
  const playheadRef = useRef<HTMLDivElement>(null);
  const paletteRef = usePalette();
  const [size, setSize] = useState({ w: 0, h: 0, dpr: 1, rem: 16 });
  const list = useMemo(() => phrases(chorale), [chorale]);
  const voices = useStore((s) => s.voices);
  const solo = useStore((s) => s.solo);
  const loop = useStore((s) => s.loop);
  const tapFermata = useStore((s) => s.tapFermata);

  // Engrave (once per chorale per session).
  useEffect(() => {
    let cancelled = false;
    const hit = cache.get(chorale.id);
    if (hit) {
      setStatus({ kind: "ready", svg: hit.svg, timemap: hit.timemap });
      return;
    }
    setStatus({ kind: "loading" });
    (async () => {
      try {
        const res = await fetch(`${import.meta.env.BASE_URL}data/${chorale.xml ?? `xml/${chorale.id}.musicxml`}`);
        if (!res.ok) throw new Error(String(res.status));
        const r = await engrave(await res.text());
        if (!r.ok) throw new Error(r.error);
        cache.set(chorale.id, r);
        if (!cancelled) setStatus({ kind: "ready", svg: r.svg, timemap: r.timemap });
      } catch {
        if (!cancelled) setStatus({ kind: "error", offline: !navigator.onLine });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chorale.id]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => {
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      setSize({ w: el.clientWidth, h: el.clientHeight, dpr: Math.min(3, window.devicePixelRatio || 1), rem });
    };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    measure();
    return () => ro.disconnect();
  }, []);


  // After the SVG is in the page: colour notes by voice and measure where each beat sits.
  useEffect(() => {
    if (status.kind !== "ready" || !innerRef.current || !size.h) return;
    const svg = innerRef.current.querySelector("svg");
    if (!svg) return;
    svg.removeAttribute("width");
    const room = size.h - bandHeight(size.rem) - size.rem * 3.5;
    const svgH = Math.round(Math.min(size.rem * 20, Math.max(120, room)));
    svg.style.height = `${svgH}px`;
    // Sit the staves in the middle of the space above the words.
    innerRef.current.style.top = `${Math.round(size.rem * 2.5 + Math.max(0, (room - svgH) / 2))}px`;
    svg.style.width = "auto";
    const voiceOf = new Map<string, Voice>();
    const elById = new Map<string, Element>();
    for (const measure of svg.querySelectorAll("g.measure")) {
      const staves = [...measure.children].filter((c) => c.classList.contains("staff"));
      staves.forEach((staff, si) => {
        const layers = [...staff.children].filter((c) => c.classList.contains("layer"));
        layers.forEach((layer, li) => {
          const v = voiceFor(si, li);
          if (!v) return;
          for (const n of layer.querySelectorAll("g.note")) {
            voiceOf.set(n.id, v);
            elById.set(n.id, n);
            n.classList.add(`v-${v}`);
          }
          for (const r of layer.querySelectorAll("g.rest, g.beam, g.dots")) r.classList.add(`v-${v}`);
        });
      });
    }
    const notes = mapNotes(chorale, status.timemap, voiceOf);
    const base = innerRef.current.getBoundingClientRect().left;
    const pairs: [number, number][] = [];
    const byNote = new Map<string, Element[]>();
    for (const [id, ref] of notes) {
      const el = elById.get(id);
      if (!el) continue;
      const key = `${ref.voice}:${ref.index}`;
      byNote.set(key, [...(byNote.get(key) ?? []), el]);
      const head = el.querySelector(".notehead") ?? el;
      const start = chorale.voices[ref.voice][ref.index]![1];
      const q = ref.isStart ? start : ref.onset;
      pairs.push([q, head.getBoundingClientRect().left - base]);
    }
    map.current = { notes, byNote, points: anchorPoints(pairs) };
    invalidatePlayhead();
  }, [status, chorale, size.h, size.rem]);

  const render = useCallback(
    (beat: number) => {
      const m = map.current;
      const inner = innerRef.current;
      if (!m || !inner || !size.w) return;
      // The playhead travels from the start until a third of the way across, then the score moves.
      const playX = Math.min(Math.round(size.w / 3), xAtBeat(m.points, beat));
      const offset = playX - xAtBeat(m.points, beat);
      if (playheadRef.current) playheadRef.current.style.transform = `translateX(${playX}px)`;
      inner.style.transform = `translateX(${offset}px)`;
      const X = (b: number) => xAtBeat(m.points, b) + offset;

      // Light the notes sounding under the playhead.
      for (const el of lit.current) el.classList.remove("on");
      lit.current = [];
      const s = useStore.getState();
      for (const v of VOICES) {
        const notes = chorale.voices[v];
        const i = indexAtBeat(notes, beat, (n) => n[1]);
        const n = notes[i];
        if (n && n[1] <= beat + 1e-6 && n[1] + n[2] > beat + 1e-6) {
          for (const el of m.byNote.get(`${v}:${i}`) ?? []) {
            el.classList.add("on");
            lit.current.push(el);
          }
        }
      }

      list.forEach((ph, i) => {
        const btn = fermataRefs.current[i];
        if (!btn) return;
        const x = X(chorale.fermatas[ph.index]![0]);
        btn.style.visibility = x > -10 && x < size.w + 10 ? "visible" : "hidden";
        btn.style.transform = `translate(${x - size.rem * 0.9}px, ${size.rem * 0.1}px)`;
      });

      const canvas = bandRef.current;
      if (canvas && paletteRef.current) drawBand(canvas, size, chorale, beat, X, playX, s.verse, s.loop, paletteRef.current);
    },
    [chorale, list, size],
  );

  useEffect(() => subscribePlayhead((b) => render(b)), [render]);

  // Tap a note to hear it; tap elsewhere to move there; drag to scrub.
  const drag = useRef<{ id: number; x: number; beat: number; wasPlaying: boolean; scrubbing: boolean; lastChord: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || (e.target as Element).closest("button")) return;
    void engine.unlock();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { id: e.pointerId, x: e.clientX, beat: engine.currentBeat(), wasPlaying: engine.isPlaying(), scrubbing: false, lastChord: -1 };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    const m = map.current;
    if (!d || d.id !== e.pointerId || !m) return;
    const dx = e.clientX - d.x;
    if (!d.scrubbing) {
      if (Math.abs(dx) < DRAG_START) return;
      d.scrubbing = true;
      if (d.wasPlaying) engine.pause();
    }
    const beat = beatAtXScore(m.points, xAtBeat(m.points, d.beat) - dx);
    const b = Math.max(0, Math.min(chorale.lengthBeats - 0.01, beat));
    engine.seek(b);
    const ci = indexAtBeat(chorale.chords, b, (c) => c.beat);
    if (ci !== d.lastChord) {
      d.lastChord = ci;
      void engine.previewChord(b, 0.25);
    }
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    const m = map.current;
    drag.current = null;
    if (!d || d.id !== e.pointerId || !m) return;
    if (d.scrubbing) {
      if (d.wasPlaying) void engine.play();
      return;
    }
    // pointer capture retargets events, so find what is under the pointer.
    const under = document.elementFromPoint(e.clientX, e.clientY);
    const noteEl = under?.closest("g.note");
    const ref = noteEl ? m.notes.get(noteEl.id) : undefined;
    if (ref) {
      const n = chorale.voices[ref.voice][ref.index]!;
      void engine.previewNote(ref.voice, n[0]);
      return;
    }
    const rect = innerRef.current!.getBoundingClientRect();
    const beat = beatAtXScore(m.points, e.clientX - rect.left);
    const ci = indexAtBeat(chorale.chords, beat, (c) => c.beat);
    engine.seek(chorale.chords[ci]!.beat);
  };

  const gains = effectiveGains(voices, solo);
  const muteClasses = VOICES.filter((v) => gains[v] <= 0.001)
    .map((v) => `mute-${v}`)
    .join(" ");

  return (
    <div className={`score ${muteClasses}`} ref={wrapRef} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={() => (drag.current = null)}>
      {status.kind === "loading" && <p className="score-status">Engraving the score…</p>}
      {status.kind === "error" && (
        <p className="score-status" role="status">
          {status.offline ? "The score is available when you're back online. The ribbons work offline." : "The score could not be drawn. The ribbons still show every note."}
        </p>
      )}
      {status.kind === "ready" && (
        <>
          <div className="score-page" ref={innerRef} aria-hidden="true" dangerouslySetInnerHTML={{ __html: status.svg }} />
          <div className="score-playhead" ref={playheadRef} aria-hidden="true" />
          <div className="fermata-layer">
            {list.map((ph, i) => (
              <button
                key={ph.index}
                type="button"
                className="fermata-target"
                ref={(el) => (fermataRefs.current[i] = el)}
                aria-pressed={!!loop && ph.index >= loop.from && ph.index <= loop.to}
                aria-label={`Loop phrase ${ph.index + 1}`}
                onClick={() => tapFermata(ph.index)}
              />
            ))}
          </div>
          <canvas
            ref={bandRef}
            className="score-band"
            aria-hidden="true"
            width={Math.round(size.w * size.dpr)}
            height={Math.round(bandHeight(size.rem) * size.dpr)}
            style={{ width: size.w, height: bandHeight(size.rem) }}
          />
        </>
      )}
    </div>
  );
}

const bandHeight = (rem: number) => Math.round(rem * 4.5);

/** Words and the tension gauge under the score, placed by the engraving's beat positions. */
function drawBand(
  canvas: HTMLCanvasElement,
  size: { w: number; dpr: number; rem: number },
  c: Chorale,
  beat: number,
  X: (b: number) => number,
  playX: number,
  verse: number,
  loop: { start: number; end: number } | null,
  p: Palette,
) {
  const ctx = canvas.getContext("2d")!;
  const rem = size.rem;
  const h = bandHeight(rem);
  ctx.setTransform(size.dpr, 0, 0, size.dpr, 0, 0);
  ctx.clearRect(0, 0, size.w, h);
  if (loop) {
    ctx.fillStyle = p.ink;
    ctx.globalAlpha = 0.05;
    ctx.fillRect(X(loop.start), 0, X(loop.end) - X(loop.start), h);
    ctx.globalAlpha = 1;
  }
  // Words.
  ctx.font = `italic 400 ${rem}px "Spectral", Georgia, serif`;
  let lastEnd = -Infinity;
  const cur = indexAtBeat(c.lyrics, beat, (e) => e.beat);
  c.lyrics.forEach((ev, i) => {
    const x0 = X(ev.beat);
    if (x0 < -200 || x0 > size.w + 50) return;
    const syl = ev.verses[verse];
    if (!syl?.text) return;
    const text = syl.text + (syl.syllabic === "begin" || syl.syllabic === "middle" ? " –" : "");
    const x = Math.max(x0 + rem * 0.35, lastEnd + rem * 0.3);
    ctx.fillStyle = i === cur ? p.ink : p.ink2;
    ctx.fillText(text, x, rem * 1.2);
    lastEnd = x + ctx.measureText(text).width;
  });
  // Gauge.
  const top = rem * 2;
  const gh = h - top - rem * 0.4;
  const base = top + gh;
  const max = maxClash(c);
  ctx.beginPath();
  ctx.moveTo(X(0), base);
  for (const ch of c.chords) {
    const y = base - (ch.clash / max) * gh;
    ctx.lineTo(X(ch.beat), y);
    ctx.lineTo(X(ch.beat + ch.dur), y);
  }
  ctx.lineTo(X(c.lengthBeats), base);
  ctx.closePath();
  ctx.fillStyle = p.clash;
  ctx.globalAlpha = 0.26;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = p.clash;
  ctx.lineWidth = 1.25;
  ctx.stroke();
  ctx.font = `400 ${0.78 * rem}px "Atkinson Hyperlegible", system-ui, sans-serif`;
  ctx.fillStyle = p.paper;
  ctx.fillRect(4, top - 2, ctx.measureText("Clash").width + 6, rem);
  ctx.fillStyle = p.ink3;
  ctx.fillText("Clash", 6, top + rem * 0.6);
  // Playhead continues through the band.
  ctx.strokeStyle = p.ink;
  ctx.lineWidth = 2;
  const px = Math.round(playX) + 0.5;
  ctx.beginPath();
  ctx.moveTo(px, 0);
  ctx.lineTo(px, base);
  ctx.stroke();
}
