import { useEffect, useRef, useState } from "react";
import { engine } from "../audio";

type Listener = (beat: number, playing: boolean) => void;

const listeners = new Set<Listener>();
let raf = 0;
let lastBeat = -1;
let lastPlaying = false;

/**
 * One animation-frame loop for everything that follows the playhead.
 * It runs outside React: the canvas draws from it directly, and React components only
 * re-render when a value they derive from the beat actually changes.
 */
function frame() {
  const playing = engine.isPlaying();
  const beat = engine.currentBeat();
  if (beat !== lastBeat || playing !== lastPlaying) {
    lastBeat = beat;
    lastPlaying = playing;
    listeners.forEach((fn) => fn(beat, playing));
  }
  raf = requestAnimationFrame(frame);
}

export function subscribePlayhead(fn: Listener): () => void {
  listeners.add(fn);
  fn(engine.currentBeat(), engine.isPlaying());
  if (!raf) raf = requestAnimationFrame(frame);
  return () => {
    listeners.delete(fn);
    if (listeners.size === 0) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  };
}

/** Force listeners to run on the next frame, e.g. after the chorale or mix changes. */
export function invalidatePlayhead(): void {
  lastBeat = -1;
}

/** A value derived from the playhead, re-rendering only when it changes. */
export function usePlayheadValue<T>(derive: (beat: number, playing: boolean) => T, deps: unknown[] = []): T {
  const deriveRef = useRef(derive);
  deriveRef.current = derive;
  const [value, setValue] = useState(() => derive(engine.currentBeat(), engine.isPlaying()));
  useEffect(() => {
    let current = value;
    return subscribePlayhead((b, p) => {
      const next = deriveRef.current(b, p);
      if (next !== current) {
        current = next;
        setValue(next);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return value;
}
