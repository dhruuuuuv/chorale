import { useEffect, useId, useRef, useState } from "react";
import { engine } from "../audio";
import { DEFAULT_STRETCH, MAX_STRETCH, MIN_STRETCH } from "../audio/tempoMap";
import { nextStep, stepPoints } from "../lib/music";
import { DEFAULT_TEMPO, MAX_TEMPO, MIN_TEMPO, useStore, type Theme, type VoiceSound } from "../state/store";
import type { Chorale } from "../types";
import { Icon } from "./Icon";

export function stepChord(c: Chorale, dir: 1 | -1) {
  const beat = nextStep(stepPoints(c), engine.currentBeat(), dir);
  engine.seek(beat);
  void engine.previewChord(beat);
  return beat;
}

export function Transport({ chorale, compact }: { chorale: Chorale; compact: boolean }) {
  const playing = useStore((s) => s.playing);
  const sound = useStore((s) => s.sound);
  const togglePlay = useStore((s) => s.togglePlay);
  const loop = useStore((s) => s.loop);
  const loopCount = useStore((s) => s.loopCount);
  const loopPhraseAt = useStore((s) => s.loopPhraseAt);
  const tempo = useStore((s) => s.tempo);
  const setTempo = useStore((s) => s.setTempo);
  const stretch = useStore((s) => s.stretch);
  const verse = useStore((s) => s.verse);
  const setVerse = useStore((s) => s.setVerse);
  const tempoId = useId();
  const verseId = useId();

  const label = sound === "blocked" ? "Tap to turn on sound" : playing ? "Pause" : "Play";
  const loopLabel = loop ? (loop.from === loop.to ? `Phrase ${loop.from + 1}` : `Phrases ${loop.from + 1}–${loop.to + 1}`) : compact ? "Loop" : "Loop phrase";

  return (
    <section className={`transport${compact ? " compact" : ""}`} aria-label="Transport">
      <div className="transport-main">
        <button type="button" className="icon-button" aria-label="Previous chord" aria-keyshortcuts="ArrowLeft" onClick={() => stepChord(chorale, -1)}>
          <Icon name="stepBack" />
        </button>
        <button type="button" className={`play${sound === "blocked" ? " is-blocked" : ""}`} onClick={() => void togglePlay()} aria-keyshortcuts="Space" data-testid="play">
          <Icon name={playing ? "pause" : "play"} size={22} />
          <span>{label}</span>
        </button>
        <button type="button" className="icon-button" aria-label="Next chord" aria-keyshortcuts="ArrowRight" onClick={() => stepChord(chorale, 1)}>
          <Icon name="stepForward" />
        </button>
      </div>

      <button
        type="button"
        className={`loop-toggle${loop ? " is-on" : ""}`}
        aria-pressed={!!loop}
        aria-keyshortcuts="L"
        onClick={() => loopPhraseAt(engine.currentBeat())}
        data-testid="loop"
      >
        <Icon name="loop" />
        <span>{loopLabel}</span>
        {loop && loopCount > 0 && <span className="tag">×{loopCount + 1}</span>}
      </button>

      <div className="tempo">
        <label htmlFor={tempoId}>Tempo</label>
        <input
          id={tempoId}
          type="range"
          min={MIN_TEMPO}
          max={MAX_TEMPO}
          step={1}
          value={tempo}
          aria-valuetext={`${tempo} beats per minute`}
          aria-keyshortcuts="[ ]"
          onChange={(e) => setTempo(Number(e.target.value))}
        />
        <output htmlFor={tempoId} className={tempo !== DEFAULT_TEMPO ? "tag" : "tempo-value"}>
          ♩ = {tempo}
        </output>
      </div>

      {stretch !== DEFAULT_STRETCH && <span className="tag" title="Pause length">Pauses ×{stretch.toFixed(1)}</span>}

      <SoundPicker />

      {chorale.verseCount > 1 && (
        <div className="verse">
          <label htmlFor={verseId}>Verse</label>
          <select id={verseId} value={verse} onChange={(e) => setVerse(Number(e.target.value))}>
            {Array.from({ length: chorale.verseCount }, (_, i) => (
              <option key={i} value={i}>
                {i + 1} of {chorale.verseCount}
              </option>
            ))}
          </select>
        </div>
      )}

      <Options />
    </section>
  );
}

const SOUNDS: { id: VoiceSound; label: string }[] = [
  { id: "quartet", label: "Quartet" },
  { id: "choir", label: "Choir" },
  { id: "organ", label: "Organ" },
  { id: "sine", label: "Sine" },
];

/** What the four voices sound like. Sung voices need a download; until it arrives the organ plays. */
function SoundPicker() {
  const voiceSound = useStore((s) => s.voiceSound);
  const setVoiceSound = useStore((s) => s.setVoiceSound);
  const failed = useStore((s) => s.voicesFailed);
  const loading = useStore((s) => s.sound === "ready" && !s.voicesReady && !s.voicesFailed);
  const note = failed ? "Voices couldn’t load; the organ is playing." : loading ? "Loading voices…" : null;
  const id = useId();
  return (
    <div className="sound">
      <label htmlFor={id}>Sound</label>
      <select id={id} value={voiceSound} onChange={(e) => setVoiceSound(e.target.value as VoiceSound)} aria-describedby={note ? `${id}-note` : undefined}>
        {SOUNDS.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </select>
      {note && (
        <span id={`${id}-note`} className="sound-note">
          {note}
        </span>
      )}
    </div>
  );
}

/** Pause length, theme and contrast. A popover, not a modal: the music keeps playing. */
function Options() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const stretch = useStore((s) => s.stretch);
  const setStretch = useStore((s) => s.setStretch);
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const highContrast = useStore((s) => s.highContrast);
  const setHighContrast = useStore((s) => s.setHighContrast);
  const human = useStore((s) => s.human);
  const setHuman = useStore((s) => s.setHuman);
  const panelId = useId();
  const stretchId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        ref.current?.querySelector<HTMLButtonElement>("button")?.focus();
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="options" ref={ref}>
      <button type="button" className="icon-button" aria-expanded={open} aria-controls={panelId} aria-label="Options" onClick={() => setOpen(!open)}>
        <Icon name="options" />
      </button>
      <div id={panelId} className="popover" hidden={!open}>
        <div className="field">
          <label htmlFor={stretchId}>Pause length</label>
          <input
            id={stretchId}
            type="range"
            min={MIN_STRETCH}
            max={MAX_STRETCH}
            step={0.1}
            value={stretch}
            aria-valuetext={`${stretch.toFixed(1)} times the written length`}
            onChange={(e) => setStretch(Number(e.target.value))}
          />
          <p className="hint">
            Each fermata is held ×{stretch.toFixed(1)}. {stretch <= 1.05 ? "Strict: as written." : stretch >= 2.2 ? "Expressive." : ""}
          </p>
        </div>
        <label className="check">
          <input type="checkbox" checked={human} onChange={(e) => setHuman(e.target.checked)} />
          <span>Human timing: tiny differences between voices, like real singers. Turn off for strict practice.</span>
        </label>
        <fieldset className="field">
          <legend>Appearance</legend>
          <div className="segmented" role="radiogroup" aria-label="Theme">
            {(["system", "light", "dark"] as Theme[]).map((t) => (
              <label key={t}>
                <input type="radio" name="theme" value={t} checked={theme === t} onChange={() => setTheme(t)} />
                <span>{t === "system" ? "Auto" : t === "light" ? "Light" : "Dark"}</span>
              </label>
            ))}
          </div>
          <label className="check">
            <input type="checkbox" checked={highContrast} onChange={(e) => setHighContrast(e.target.checked)} />
            <span>High contrast, with dashed lines per voice</span>
          </label>
        </fieldset>
      </div>
    </div>
  );
}
