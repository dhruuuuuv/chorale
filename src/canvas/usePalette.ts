import { useEffect, useRef } from "react";
import { invalidatePlayhead } from "../state/playhead";
import { useStore } from "../state/store";
import { readPalette, type Palette } from "./draw";

/**
 * The canvas colours, read from the CSS tokens. They are re-read a frame after any theme or
 * contrast change (so the new attributes on <html> are already in place), when the system
 * switches light or dark, and once the fonts have loaded.
 */
export function usePalette() {
  const ref = useRef<Palette | null>(null);
  const theme = useStore((s) => s.theme);
  const highContrast = useStore((s) => s.highContrast);
  useEffect(() => {
    let raf = 0;
    const read = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        ref.current = readPalette(document.documentElement);
        invalidatePlayhead();
      });
    };
    if (!ref.current) ref.current = readPalette(document.documentElement);
    read();
    const mq = matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", read);
    void document.fonts?.ready.then(read);
    return () => {
      cancelAnimationFrame(raf);
      mq.removeEventListener("change", read);
    };
  }, [theme, highContrast]);
  return ref;
}
