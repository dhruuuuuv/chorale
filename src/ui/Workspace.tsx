import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { engine } from "../audio";
import { RibbonView } from "../canvas/RibbonView";
import { barAndBeat, notesAt, phraseIndexAt, phrases, spokenChord, spokenPitch, wordAt, indexAtBeat } from "../lib/music";
import { usePlayheadValue } from "../state/playhead";
import { useStore, type Goal, type Hint, type Lens, type View } from "../state/store";
import { VOICES, VOICE_NAMES, type Chorale } from "../types";
import { Icon } from "./Icon";
import { Mark } from "./Mark";
import { stepChord, Transport } from "./Transport";
import { VoiceStrip } from "./VoiceStrip";
import { useMedia } from "./useMedia";
import { sameText } from "../lib/search";

const ScoreView = lazy(() => import("../score/ScoreView").then((m) => ({ default: m.ScoreView })));

export function Workspace({ chorale }: { chorale: Chorale }) {
  const view = useStore((s) => s.view);
  const narrow = useMedia("(max-width: 760px)");
  const portraitPhone = useMedia("(max-width: 600px) and (orientation: portrait)");
  // With reduced motion the music does not glide: the view moves a phrase at a time.
  const reducedMotion = useMedia("(prefers-reduced-motion: reduce)");
  const [announcement, setAnnouncement] = useState("");
  useKeyboard(chorale, setAnnouncement);

  return (
    <div className={`workspace${narrow ? " is-narrow" : ""}`}>
      <TopBar chorale={chorale} narrow={narrow} />
      <main className="workspace-body" id="main">
        {!narrow && <VoiceStrip compact={false} />}
        <div className="stage-column">
          <GoalPrompt />
          <HintBubble hint="score" className="hint-inline">
            Switch to Score to see the same music as notation.
          </HintBubble>
          <Readout chorale={chorale} />
          <section className="stage" aria-label={`${chorale.title}, ${view === "score" ? "score" : "voice ribbons"}`}>
            <TextEquivalent chorale={chorale} />
            {view === "score" ? (
              <Suspense fallback={<p className="score-status">Loading the score…</p>}>
                <ScoreView chorale={chorale} />
              </Suspense>
            ) : (
              <RibbonView chorale={chorale} mode={portraitPhone || reducedMotion ? "phrase" : "scroll"} />
            )}
            <HintBubble hint="loop" className="hint-loop">
              Tap a pause sign <FermataGlyph /> to loop that phrase.
            </HintBubble>
          </section>
          <FirstWin />
        </div>
      </main>
      <footer className="dock">
        {narrow && <VoiceStrip compact />}
        <HintBubble hint="mute" className="hint-mute">
          Tap a voice to mute it. Press and hold to hear it alone.
        </HintBubble>
        <Transport chorale={chorale} compact={narrow} />
      </footer>
      <Notices />
      <div className="visually-hidden" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
    </div>
  );
}

function TopBar({ chorale, narrow }: { chorale: Chorale; narrow: boolean }) {
  const lens = useStore((s) => s.lens);
  const setLens = useStore((s) => s.setLens);
  const view = useStore((s) => s.view);
  const setView = useStore((s) => s.setView);
  const lenses: { id: Lens; label: string }[] = [
    { id: "listen", label: "Listen" },
    { id: "explore", label: "Explore" },
    { id: "build", label: "Build" },
  ];
  const views: { id: View; label: string }[] = [
    { id: "ribbons", label: "Ribbons" },
    { id: "score", label: "Score" },
  ];
  return (
    <header className="topbar">
      <a className="home" href="#/library" aria-label="Chorale Workshop: all chorales">
        <Mark size={30} />
        {!narrow && <span className="home-label">Chorales</span>}
      </a>
      <div className="title-block">
        <h1>{chorale.title}</h1>
        {!sameText(chorale.firstLine, chorale.title) && (
          <p className="first-line" lang="de">
            {chorale.firstLine}
          </p>
        )}
        <p className="translation">{chorale.translation}</p>
      </div>
      <div className="topbar-controls">
        <div className="segmented lens" role="group" aria-label="Lens">
          {lenses.map((l) => (
            <button
              key={l.id}
              type="button"
              aria-pressed={lens === l.id}
              disabled={l.id !== "listen"}
              title={l.id !== "listen" ? `${l.label} arrives in a later version` : undefined}
              onClick={() => setLens(l.id)}
            >
              {l.label}
            </button>
          ))}
        </div>
        <div className="segmented view" role="group" aria-label="View">
          {views.map((v) => (
            <button key={v.id} type="button" aria-pressed={view === v.id} onClick={() => setView(v.id)}>
              {v.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}

/** Where you are, in words: bar, phrase and the word being sung. */
function Readout({ chorale }: { chorale: Chorale }) {
  const verse = useStore((s) => s.verse);
  const list = useMemo(() => phrases(chorale), [chorale]);
  const text = usePlayheadValue(
    (b) => {
      const { bar } = barAndBeat(chorale, b);
      return `${bar}|${phraseIndexAt(list, b) + 1}|${wordAt(chorale, b, verse)}`;
    },
    [chorale, verse],
  );
  const [bar, phrase, word] = text.split("|");
  return (
    <div className="readout" aria-hidden="true">
      <span className="readout-word">{word || " "}</span>
      <span>
        Bar <b>{bar}</b>
      </span>
      <span>
        Phrase <b>{phrase}</b> of {list.length}
      </span>
      <span className="readout-meta">
        {chorale.key} · BWV {chorale.bwv} · Riemenschneider {chorale.riemenschneider}
      </span>
    </div>
  );
}

/** The canvas in words, for screen readers. */
function TextEquivalent({ chorale }: { chorale: Chorale }) {
  const verse = useStore((s) => s.verse);
  const list = phrases(chorale);
  return (
    <div className="visually-hidden">
      <p>
        {chorale.title}, from {chorale.source}. {chorale.key}, {chorale.timeSig} time, {list.length} phrases, four voices: soprano, alto, tenor and bass. Use the left and right arrow keys to step chord by chord;
        each step reads the bar, chord, four notes and word. Space plays and pauses, 1 to 4 mute a voice, L loops the current phrase.
      </p>
      <ol>
        {list.map((ph) => (
          <li key={ph.index} lang="de">
            {phraseWords(chorale, ph.start, ph.end, verse)}
          </li>
        ))}
      </ol>
    </div>
  );
}

function phraseWords(c: Chorale, start: number, end: number, verse: number): string {
  let out = "";
  for (const ev of c.lyrics) {
    if (ev.beat < start - 1e-6 || ev.beat >= end - 1e-6) continue;
    const s = ev.verses[verse];
    if (!s) continue;
    out += s.text + (s.syllabic === "single" || s.syllabic === "end" ? " " : "");
  }
  return out.trim();
}

function describeBeat(c: Chorale, beat: number, verse: number): string {
  const { bar, beat: b } = barAndBeat(c, beat);
  const chord = c.chords[indexAtBeat(c.chords, beat, (x) => x.beat)];
  const sounding = notesAt(c, beat);
  const notes = VOICES.map((v) => (sounding[v] ? `${VOICE_NAMES[v]} ${spokenPitch(sounding[v]![3])}` : `${VOICE_NAMES[v]} rests`)).join(", ");
  const word = wordAt(c, beat, verse);
  return `Bar ${bar}, beat ${b}. ${spokenChord(chord?.name ?? "")}. ${notes}.${word ? ` Sung: ${word}.` : ""}`;
}

/** Controls where Space already has a job: typing, opening a dropdown, ticking a box. */
function spaceHasOwnMeaning(t: HTMLElement): boolean {
  if (t.isContentEditable || t.tagName === "TEXTAREA" || t.tagName === "SELECT") return true;
  if (t.tagName !== "INPUT") return false;
  const type = (t as HTMLInputElement).type;
  return type !== "range" && type !== "button" && type !== "submit";
}

function useKeyboard(chorale: Chorale, announce: (s: string) => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement;
      const tag = t.tagName;
      const typing = tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA" || t.isContentEditable;
      const s = useStore.getState();
      const digit = /^Digit([1-4])$/.exec(e.code);
      if (digit && !typing) {
        e.preventDefault();
        const v = VOICES[Number(digit[1]) - 1]!;
        if (e.shiftKey) s.toggleSolo(v);
        else s.toggleMute(v);
        const st = useStore.getState();
        announce(st.solo === v ? `${VOICE_NAMES[v]} solo` : st.voices[v].muted ? `${VOICE_NAMES[v]} muted` : `${VOICE_NAMES[v]} on`);
        return;
      }
      // Space plays and pauses wherever focus is, as in a media player, except where Space
      // already does something: typing, dropdowns, checkboxes and radio buttons. A focused
      // button still activates with Enter, so every control stays usable from the keyboard.
      if (e.key === " " && !e.shiftKey && !spaceHasOwnMeaning(t)) {
        e.preventDefault();
        if (!e.repeat) void s.togglePlay();
        return;
      }
      if (typing && e.key !== "Escape") return;
      switch (e.key) {
        case "ArrowLeft":
        case "ArrowRight": {
          e.preventDefault();
          const beat = stepChord(chorale, e.key === "ArrowRight" ? 1 : -1);
          // Announcements wait while the music plays, so they never talk over it.
          if (!engine.isPlaying()) announce(describeBeat(chorale, beat, s.verse));
          break;
        }
        case "l":
        case "L":
          e.preventDefault();
          s.loopPhraseAt(engine.currentBeat());
          announce(useStore.getState().loop ? `Looping phrase ${useStore.getState().loop!.from + 1}` : "Loop off");
          break;
        case "[":
          s.nudgeTempo(-1);
          announce(`Tempo ${useStore.getState().tempo}`);
          break;
        case "]":
          s.nudgeTempo(1);
          announce(`Tempo ${useStore.getState().tempo}`);
          break;
      }
    };
    // Buttons fire their click on Space's keyup; stop that so Space only plays and pauses.
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === " " && !e.shiftKey && !spaceHasOwnMeaning(e.target as HTMLElement)) e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [chorale, announce]);
}

// --- First five minutes -----------------------------------------------------------------

function GoalPrompt() {
  const goal = useStore((s) => s.goal);
  const setGoal = useStore((s) => s.setGoal);
  const [dismissed, setDismissed] = useState(false);
  if (goal || dismissed) return null;
  const options: { id: Goal; label: string }[] = [
    { id: "sing", label: "sing my part" },
    { id: "harmony", label: "understand the harmony" },
    { id: "write", label: "write my own" },
  ];
  return (
    <section className="goal" aria-label="Getting started">
      <p className="goal-question">I mostly want to…</p>
      <div className="goal-options">
        {options.map((o) => (
          <button key={o.id} type="button" className="goal-option" onClick={() => setGoal(o.id)}>
            {o.label}
          </button>
        ))}
      </div>
      <button type="button" className="icon-button quiet" aria-label="Skip this question" onClick={() => setDismissed(true)}>
        <Icon name="close" />
      </button>
    </section>
  );
}

const HINT_ORDER: Hint[] = ["mute", "loop", "score"];

/** One hint at a time, in context, once each, and only after the music has started. */
function HintBubble({ hint, className, children }: { hint: Hint; className: string; children: React.ReactNode }) {
  const done = useStore((s) => s.hintsDone);
  const completeHint = useStore((s) => s.completeHint);
  const played = useStore((s) => s.playing);
  const [heard, setHeard] = useState(false);
  useEffect(() => {
    if (played) setHeard(true);
  }, [played]);
  const current = HINT_ORDER.find((h) => !done.includes(h));
  if (!heard || current !== hint) return null;
  return (
    <div className={`hint-bubble ${className}`} role="note">
      <span>{children}</span>
      <button type="button" className="icon-button quiet small" aria-label="Got it" onClick={() => completeHint(hint)}>
        <Icon name="close" size={16} />
      </button>
    </div>
  );
}

function FermataGlyph() {
  return (
    <svg className="inline-glyph" width="16" height="12" viewBox="0 0 16 12" aria-label="(fermata)" role="img">
      <path d="M2 10a6 6 0 0 1 12 0" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="8" cy="8.6" r="1.4" fill="currentColor" />
    </svg>
  );
}

/** After the first loop goes round, one suggestion matched to what the visitor came for. */
function FirstWin() {
  const loopCount = useStore((s) => s.loopCount);
  const goal = useStore((s) => s.goal);
  const dismissed = useStore((s) => s.firstWinDismissed);
  const dismiss = useStore((s) => s.dismissFirstWin);
  const toggleMute = useStore((s) => s.toggleMute);
  const setView = useStore((s) => s.setView);
  const altoMuted = useStore((s) => s.voices.A.muted);
  if (dismissed || loopCount < 1) return null;
  let text: string;
  let action: React.ReactNode = null;
  if (goal === "harmony") {
    text = "Pause, then step through the phrase with ← and →. Each chord sounds as you land on it.";
  } else if (goal === "write") {
    text = "Follow the bass line in the score, then sing it against the other three.";
    action = (
      <button type="button" className="text-button" onClick={() => setView("score")}>
        Show the score
      </button>
    );
  } else {
    text = "Now mute the alto and sing it yourself.";
    action = altoMuted ? null : (
      <button type="button" className="text-button" onClick={() => toggleMute("A")}>
        Mute the alto
      </button>
    );
  }
  return (
    <div className="first-win" role="status">
      <p>{text}</p>
      {action}
      <button type="button" className="icon-button quiet small" aria-label="Dismiss" onClick={dismiss}>
        <Icon name="close" size={16} />
      </button>
    </div>
  );
}

/** Quiet, non-blocking notes about sound. */
function Notices() {
  const voiceSound = useStore((s) => s.voiceSound);
  const sampled = voiceSound === "quartet" || voiceSound === "choir";
  const ready = useStore((s) => s.voicesReady) && sampled;
  const playing = useStore((s) => s.playing);
  const [showReady, setShowReady] = useState(false);
  const [silentHint, setSilentHint] = useState(false);
  const checked = useRef(false);
  const hintTimers = useRef<number[]>([]);

  useEffect(() => {
    if (!ready) return;
    setShowReady(true);
    const t = setTimeout(() => setShowReady(false), 4000);
    return () => clearTimeout(t);
  }, [ready]);

  // iPhones before iOS 17 mute Web Audio with the silent switch, and nothing can detect it.
  useEffect(() => {
    if (!playing || checked.current) return;
    checked.current = true;
    const nav = navigator as Navigator & { audioSession?: unknown };
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (!ios || nav.audioSession) return;
    // Not tied to `playing`: pausing must not cancel the hide, or the hint would stay forever.
    hintTimers.current.push(window.setTimeout(() => setSilentHint(true), 2000));
    hintTimers.current.push(window.setTimeout(() => setSilentHint(false), 12000));
  }, [playing]);
  useEffect(() => () => hintTimers.current.forEach(clearTimeout), []);

  return (
    <div className="notices" role="status" aria-live="polite">
      {showReady && <p className="notice">{voiceSound === "quartet" ? "Quartet voices ready" : "Choir voices ready"}</p>}
      {silentHint && <p className="notice">No sound? Check the silent switch on the side of your iPhone.</p>}
    </div>
  );
}
