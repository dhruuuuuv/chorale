import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { engine } from "../audio";
import { defaultVoices, effectiveGains, myPartPreset, type VoiceStates } from "../audio/mix";
import { DEFAULT_STRETCH, MAX_STRETCH, MIN_STRETCH } from "../audio/tempoMap";
import type { SoundState, VoiceSound } from "../audio/engine";
import { phrases } from "../lib/music";
import type { Chorale, IndexEntry, Voice } from "../types";

export const DEFAULT_CHORALE = "bwv244.54";
export const DEFAULT_TEMPO = 60;
export const MIN_TEMPO = 40;
export const MAX_TEMPO = 120;
export const TEMPO_STEP = 4;
/** Two fermatas tapped within this time loop the span between them. */
const SPAN_WINDOW_MS = 6000;

export type Lens = "listen" | "explore" | "build";
export type View = "ribbons" | "score";
export type Theme = "system" | "light" | "dark";
export type Goal = "sing" | "harmony" | "write";
export type Hint = "mute" | "loop" | "score";
export type { VoiceSound } from "../audio/engine";

export interface LoopState {
  /** First and last phrase index, inclusive. */
  from: number;
  to: number;
  start: number;
  end: number;
}

type Load = { status: "idle" } | { status: "loading"; id: string } | { status: "ready" } | { status: "error"; id: string; offline: boolean };

interface State {
  index: IndexEntry[] | null;
  chorale: Chorale | null;
  load: Load;

  playing: boolean;
  sound: SoundState;
  /** The chosen sound can play as itself (a sample set has loaded, or it is synthesised). */
  voicesReady: boolean;
  /** The chosen sung voices could not be loaded; the organ is standing in. */
  voicesFailed: boolean;

  voices: VoiceStates;
  solo: Voice | null;
  loop: LoopState | null;
  /** Fermata tapped first when choosing a two-fermata span. */
  pendingLoopFrom: number | null;
  pendingLoopAt: number;
  loopCount: number;
  tempo: number;
  stretch: number;
  verse: number;

  lens: Lens;
  view: View;
  theme: Theme;
  highContrast: boolean;
  voiceSound: VoiceSound;
  human: boolean;

  goal: Goal | null;
  hintsDone: Hint[];
  firstWinDismissed: boolean;
}

interface Actions {
  loadIndex(): Promise<void>;
  openChorale(id: string): Promise<void>;
  togglePlay(): Promise<void>;
  seek(beat: number): void;
  toggleMute(v: Voice): void;
  toggleSolo(v: Voice): void;
  setLevel(v: Voice, level: number): void;
  setMyPart(v: Voice | null): void;
  tapFermata(phrase: number): void;
  loopPhraseAt(beat: number): void;
  clearLoop(): void;
  setTempo(bpm: number): void;
  nudgeTempo(dir: 1 | -1): void;
  setStretch(s: number): void;
  setVerse(v: number): void;
  setLens(l: Lens): void;
  setView(v: View): void;
  setTheme(t: Theme): void;
  setHighContrast(on: boolean): void;
  setVoiceSound(s: VoiceSound): void;
  setHuman(on: boolean): void;
  setGoal(g: Goal): void;
  completeHint(h: Hint): void;
  dismissFirstWin(): void;
}

export type Store = State & Actions;

const safeStorage: StateStorage = {
  getItem: (k) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  setItem: (k, v) => {
    try {
      localStorage.setItem(k, v);
    } catch {
      // Private windows and blocked storage: preferences just don't persist.
    }
  },
  removeItem: (k) => {
    try {
      localStorage.removeItem(k);
    } catch {
      // As above.
    }
  },
};

const dataUrl = (path: string) => `${import.meta.env.BASE_URL}data/${path}`;

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

export const useStore = create<Store>()(
  persist(
    (set, get) => {
      const applyMix = () => {
        const { voices, solo } = get();
        engine.setGains(effectiveGains(voices, solo));
      };

      const setLoopFromPhrases = (from: number, to: number) => {
        const c = get().chorale;
        if (!c) return;
        const list = phrases(c);
        const a = list[Math.min(from, to)]!;
        const b = list[Math.max(from, to)]!;
        const loop = { from: a.index, to: b.index, start: a.start, end: b.end };
        set({ loop, pendingLoopFrom: null, loopCount: 0 });
        engine.setLoop({ start: loop.start, end: loop.end });
        get().completeHint("loop");
      };

      return {
        index: null,
        chorale: null,
        load: { status: "idle" },
        playing: false,
        sound: "off",
        voicesReady: false,
        voicesFailed: false,
        voices: defaultVoices(),
        solo: null,
        loop: null,
        pendingLoopFrom: null,
        pendingLoopAt: 0,
        loopCount: 0,
        tempo: DEFAULT_TEMPO,
        stretch: DEFAULT_STRETCH,
        verse: 0,
        lens: "listen",
        view: "ribbons",
        theme: "system",
        highContrast: false,
        voiceSound: "quartet",
        human: true,
        goal: null,
        hintsDone: [],
        firstWinDismissed: false,

        async loadIndex() {
          if (get().index) return;
          const res = await fetch(dataUrl("index.json"));
          if (!res.ok) throw new Error(`index.json: ${res.status}`);
          const json = (await res.json()) as { chorales: IndexEntry[] };
          set({ index: json.chorales });
        },

        async openChorale(id) {
          if (get().chorale?.id === id) return;
          set({ load: { status: "loading", id } });
          try {
            const res = await fetch(dataUrl(`${id}.json`));
            if (!res.ok) throw new Error(String(res.status));
            const c = (await res.json()) as Chorale;
            // A slower, older request must not replace the chorale asked for since.
            const latest = get().load;
            if (latest.status !== "loading" || latest.id !== id) return;
            engine.load(c);
            set({ chorale: c, load: { status: "ready" }, loop: null, pendingLoopFrom: null, loopCount: 0, verse: 0, playing: false });
          } catch {
            const latest = get().load;
            if (latest.status !== "loading" || latest.id !== id) return;
            set({ load: { status: "error", id, offline: typeof navigator !== "undefined" && !navigator.onLine } });
          }
        },

        async togglePlay() {
          if (engine.isPlaying()) {
            engine.pause();
            return;
          }
          const sound = await engine.play();
          set({ sound });
        },

        seek(beat) {
          engine.seek(beat);
        },

        toggleMute(v) {
          const voices = structuredClone(get().voices);
          if (get().solo) {
            // Leaving solo by muting: return to the full mix, with this voice out.
            set({ solo: null });
            voices[v].muted = true;
          } else voices[v].muted = !voices[v].muted;
          set({ voices });
          applyMix();
          get().completeHint("mute");
        },

        toggleSolo(v) {
          set({ solo: get().solo === v ? null : v });
          applyMix();
          get().completeHint("mute");
        },

        setLevel(v, level) {
          const voices = structuredClone(get().voices);
          voices[v].level = clamp(level, 0, 1);
          if (voices[v].level > 0) voices[v].muted = false;
          set({ voices });
          applyMix();
        },

        setMyPart(v) {
          set({ voices: v ? myPartPreset(v) : defaultVoices(), solo: null });
          applyMix();
        },

        tapFermata(phrase) {
          const { loop, pendingLoopFrom, pendingLoopAt } = get();
          // Tapping the looped phrase again turns the loop off.
          if (loop && loop.from === phrase && loop.to === phrase) {
            get().clearLoop();
            return;
          }
          // A second fermata tapped soon after the first loops the span between them.
          const pending = pendingLoopFrom !== null && Date.now() - pendingLoopAt < SPAN_WINDOW_MS;
          if (pending && pendingLoopFrom !== phrase) {
            setLoopFromPhrases(pendingLoopFrom, phrase);
            return;
          }
          setLoopFromPhrases(phrase, phrase);
          set({ pendingLoopFrom: phrase, pendingLoopAt: Date.now() });
        },

        loopPhraseAt(beat) {
          const c = get().chorale;
          if (!c) return;
          if (get().loop) {
            get().clearLoop();
            return;
          }
          const list = phrases(c);
          let i = 0;
          list.forEach((p, k) => {
            if (beat >= p.start - 1e-6) i = k;
          });
          setLoopFromPhrases(i, i);
        },

        clearLoop() {
          set({ loop: null, pendingLoopFrom: null, loopCount: 0 });
          engine.setLoop(null);
        },

        setTempo(bpm) {
          const tempo = clamp(Math.round(bpm), MIN_TEMPO, MAX_TEMPO);
          set({ tempo });
          engine.setTempo(tempo);
        },

        nudgeTempo(dir) {
          get().setTempo(get().tempo + dir * TEMPO_STEP);
        },

        setStretch(s) {
          const stretch = clamp(Math.round(s * 10) / 10, MIN_STRETCH, MAX_STRETCH);
          set({ stretch });
          engine.setFermataStretch(stretch);
        },

        setVerse(verse) {
          set({ verse });
        },

        setLens(lens) {
          // Phase 1: Explore and Build are not built yet.
          if (lens !== "listen") return;
          set({ lens });
        },

        setView(view) {
          set({ view });
          if (view === "score") get().completeHint("score");
        },

        setTheme(theme) {
          set({ theme });
        },

        setHighContrast(highContrast) {
          set({ highContrast });
        },

        setVoiceSound(voiceSound) {
          engine.setVoiceSound(voiceSound);
          set({ voiceSound, voicesReady: engine.voicesReady(), voicesFailed: engine.voicesFailed() });
        },

        setHuman(human) {
          set({ human });
          engine.setHuman(human);
        },

        setGoal(goal) {
          set({ goal, view: goal === "write" ? "score" : "ribbons" });
        },

        completeHint(h) {
          if (!get().hintsDone.includes(h)) set({ hintsDone: [...get().hintsDone, h] });
        },

        dismissFirstWin() {
          set({ firstWinDismissed: true });
        },
      };
    },
    {
      name: "chorale-workshop",
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({
        stretch: s.stretch,
        theme: s.theme,
        highContrast: s.highContrast,
        voiceSound: s.voiceSound,
        human: s.human,
        goal: s.goal,
        hintsDone: s.hintsDone,
        firstWinDismissed: s.firstWinDismissed,
        view: s.view,
      }),
      onRehydrateStorage: () => (s) => {
        if (s) {
          engine.setFermataStretch(s.stretch);
          engine.setVoiceSound(s.voiceSound);
          engine.setHuman(s.human);
          // Organ and sine are ready at once; the store has to hear that after a reload too.
          queueMicrotask(() => useStore.setState({ voicesReady: engine.voicesReady(), voicesFailed: engine.voicesFailed() }));
        }
      },
    },
  ),
);

// Keep the store in step with the engine.
engine.on("state", () => useStore.setState({ playing: engine.isPlaying(), sound: engine.soundState() }));
engine.on("ended", () => useStore.setState({ playing: false }));
engine.on("loop", () => useStore.setState({ loopCount: engine.getLoopCount() }));
const syncVoices = () => useStore.setState({ voicesReady: engine.voicesReady(), voicesFailed: engine.voicesFailed() });
engine.on("voices-ready", syncVoices);
engine.on("voices-failed", syncVoices);
