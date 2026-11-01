import { useId, useRef } from "react";
import { effectiveGains, matchingMyPart } from "../audio/mix";
import { useStore } from "../state/store";
import { VOICES, VOICE_NAMES, type Voice } from "../types";
import { Icon } from "./Icon";

const LONG_PRESS_MS = 450;
const DRAG_START = 6;
/** Pixels of vertical drag for the full level range. */
const DRAG_RANGE = 120;
const LEVEL_STEP = 0.1;

/**
 * The four voice chips. Tap to mute, long-press to solo, drag up or down to set the level.
 * Each also has a solo button and arrow-key level control, so nothing depends on a gesture.
 */
export function VoiceStrip({ compact }: { compact: boolean }) {
  const voices = useStore((s) => s.voices);
  const solo = useStore((s) => s.solo);
  const setMyPart = useStore((s) => s.setMyPart);
  const myPart = matchingMyPart(voices);
  const gains = effectiveGains(voices, solo);
  const selectId = useId();

  return (
    <section className={`voice-strip${compact ? " compact" : ""}`} aria-label="Voices">
      <ul className="chips">
        {VOICES.map((v) => (
          <li key={v}>
            <VoiceChip voice={v} audible={gains[v] > 0.001} level={voices[v].level} soloed={solo === v} muted={voices[v].muted} compact={compact} />
          </li>
        ))}
      </ul>
      <label className="my-part" htmlFor={selectId}>
        <span>My part</span>
        <select id={selectId} value={myPart ?? ""} onChange={(e) => setMyPart((e.target.value || null) as Voice | null)}>
          <option value="">Off</option>
          {VOICES.map((v) => (
            <option key={v} value={v}>
              {VOICE_NAMES[v]}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}

function VoiceChip(props: { voice: Voice; audible: boolean; level: number; soloed: boolean; muted: boolean; compact: boolean }) {
  const { voice, audible, level, soloed, muted, compact } = props;
  const toggleMute = useStore((s) => s.toggleMute);
  const toggleSolo = useStore((s) => s.toggleSolo);
  const setLevel = useStore((s) => s.setLevel);
  const descId = useId();
  const name = VOICE_NAMES[voice];
  const gesture = useRef<{ id: number; y: number; level: number; timer: number; handled: boolean; dragging: boolean } | null>(null);
  const suppressClick = useRef(false);

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const g = { id: e.pointerId, y: e.clientY, level, timer: 0, handled: false, dragging: false };
    g.timer = window.setTimeout(() => {
      g.handled = true;
      toggleSolo(voice);
      navigator.vibrate?.(10);
    }, LONG_PRESS_MS);
    gesture.current = g;
  };

  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId || g.handled) return;
    const dy = e.clientY - g.y;
    if (!g.dragging && Math.abs(dy) < DRAG_START) return;
    if (!g.dragging) {
      g.dragging = true;
      clearTimeout(g.timer);
    }
    setLevel(voice, g.level - dy / DRAG_RANGE);
  };

  const onPointerEnd = (e: React.PointerEvent<HTMLButtonElement>) => {
    const g = gesture.current;
    gesture.current = null;
    if (!g || g.id !== e.pointerId) return;
    clearTimeout(g.timer);
    // The click that follows a long-press or drag should not also mute.
    suppressClick.current = g.handled || g.dragging;
  };

  const onClick = () => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    toggleMute(voice);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      e.stopPropagation();
      setLevel(voice, level + (e.key === "ArrowUp" ? LEVEL_STEP : -LEVEL_STEP));
    }
  };

  const state = soloed ? "Solo" : !audible ? "Muted" : level < 0.995 ? `${Math.round(level * 100)}%` : "";

  return (
    <div className={`chip-row v-${voice}`}>
      <button
        type="button"
        className={`chip${audible ? "" : " is-silent"}${soloed ? " is-solo" : ""}`}
        aria-pressed={muted && !soloed}
        aria-describedby={descId}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onClick={onClick}
        onKeyDown={onKeyDown}
        onContextMenu={(e) => e.preventDefault()}
      >
        <span className="chip-letter" aria-hidden="true">
          {voice}
        </span>
        <span className="chip-name">
          <span className="visually-hidden">Mute </span>
          {name}
        </span>
        <span className="chip-state" aria-hidden="true">
          {state}
        </span>
        <span className="chip-level" aria-hidden="true">
          <span style={{ transform: `scaleX(${audible ? level : 0})` }} />
        </span>
      </button>
      <span id={descId} className="visually-hidden">
        {`${name}: ${soloed ? "solo" : audible ? `level ${Math.round(level * 100)} percent` : "muted"}. Up and down arrows change the level.`}
      </span>
      {!compact && (
        <button type="button" className={`icon-button solo${soloed ? " is-on" : ""}`} aria-pressed={soloed} aria-label={`Solo ${name.toLowerCase()}`} onClick={() => toggleSolo(voice)}>
          <Icon name="solo" />
        </button>
      )}
    </div>
  );
}
