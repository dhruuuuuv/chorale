import { VOICES, type Chorale, type Voice } from "../types";
import { notesAt } from "../lib/music";
import { buildEvents, firstEventAt, type NoteEvent } from "./events";
import type { Instrument, PlayingNote } from "./instrument";
import { Organ } from "./organ";
import { Sine } from "./sine";
import { createRoom } from "./room";
import { loadSampledVoices, type SampleMap, type SampledVoice } from "./sampler";
import { DEFAULT_STRETCH, TempoMap } from "./tempoMap";

/** How far ahead notes are scheduled, and how often the scheduler wakes. */
const LOOKAHEAD = 0.12;
const TICK_MS = 25;
/** Mute, solo and level changes ramp over 20 ms so they never click. */
const RAMP = 0.02;

/** Base level per voice, from the prototype: outer voices slightly forward. */
const BASE_LEVEL: Record<Voice, number> = { S: 0.17, A: 0.12, T: 0.12, B: 0.16 };
/** Light separation: soprano and tenor left of centre, alto and bass right. */
const PAN: Record<Voice, number> = { S: -0.25, A: 0.25, T: -0.25, B: 0.25 };

interface Anchor {
  /** Audio-clock time. */
  t: number;
  /** Performed position in units at that time. */
  u: number;
}

export interface Loop {
  start: number;
  end: number;
}

export type SampleSet = "quartet" | "choir";
export type VoiceSound = SampleSet | "organ" | "sine";

/** How much of the room each synthesised sound gets; sample sets carry their own amount. */
const SYNTH_ROOM: Record<"organ" | "sine", number> = { organ: 0.14, sine: 0.06 };
/**
 * Human timing: each note starts up to this late, and sounds up to this much softer, so the
 * four voices breathe like singers rather than lock like a machine. Off for strict practice.
 */
const HUMAN_LATE = 0.018;
const HUMAN_SOFTER = 0.14;

type EngineEvent = "state" | "loop" | "ended" | "voices-ready" | "voices-failed";

export type SoundState = "off" | "ready" | "blocked";

/**
 * Plays a chorale through Web Audio. Every note is scheduled ahead on the audio clock;
 * the only timer wakes the scheduler, it never times a note.
 */
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private preview: GainNode | null = null;
  private buses = {} as Record<Voice, { gain: GainNode; pan: StereoPannerNode }>;
  private organ: Organ | null = null;
  private sets: Partial<Record<SampleSet, { voices: Partial<Record<Voice, SampledVoice>>; room: number }>> = {};
  private loading = new Set<SampleSet>();
  private failed = new Set<SampleSet>();
  private sampleBase: string | null = null;
  private voiceSound: VoiceSound = "quartet";
  private sine: Sine | null = null;
  private roomSend: GainNode | null = null;
  private human = true;

  private chorale: Chorale | null = null;
  private tm: TempoMap | null = null;
  private events: NoteEvent[] = [];
  private bpm = 60;
  private stretch = DEFAULT_STRETCH;
  private gains: Record<Voice, number> = { S: 1, A: 1, T: 1, B: 1 };

  private playing = false;
  private position = 0;
  private anchors: Anchor[] = [];
  private next = 0;
  private active = new Map<string, PlayingNote>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private loop: Loop | null = null;
  private loopCount = 0;

  private listeners = new Map<EngineEvent, Set<() => void>>();

  /** The folder holding one sub-folder per sample set. Until a set loads, the organ plays. */
  useSamples(base: string): void {
    this.sampleBase = base;
  }

  on(event: EngineEvent, fn: () => void): () => void {
    let set = this.listeners.get(event);
    if (!set) this.listeners.set(event, (set = new Set()));
    set.add(fn);
    return () => set!.delete(fn);
  }

  private emit(event: EngineEvent) {
    this.listeners.get(event)?.forEach((fn) => fn());
  }

  // --- Context ------------------------------------------------------------------------------

  /** Call from a user gesture. Creates or resumes the audio context (iOS needs this every play). */
  async unlock(): Promise<SoundState> {
    if (!this.ctx) this.createContext();
    const ctx = this.ctx!;
    if (ctx.state !== "running") {
      try {
        await ctx.resume();
      } catch {
        // Some browsers reject instead of staying suspended; both mean "blocked".
      }
    }
    return this.soundState();
  }

  soundState(): SoundState {
    if (!this.ctx) return "off";
    return this.ctx.state === "running" ? "ready" : "blocked";
  }

  /** Whether the chosen sample set could not be loaded, so the organ is standing in. */
  voicesFailed(): boolean {
    const v = this.voiceSound;
    return (v === "quartet" || v === "choir") && this.failed.has(v);
  }

  /** Whether the chosen sample set has loaded (always true for the synthesised sounds). */
  voicesReady(): boolean {
    const v = this.voiceSound;
    return v === "organ" || v === "sine" || !!this.sets[v];
  }

  /** Which sound the voices use. Takes effect from the next note; a sample set falls back to the organ until loaded. */
  setVoiceSound(sound: VoiceSound): void {
    this.voiceSound = sound;
    if (this.ctx && (sound === "quartet" || sound === "choir")) void this.loadSet(sound);
    this.applyRoom();
  }

  /** Small timing and level differences between voices. Off gives strict, machine-exact playback. */
  setHuman(on: boolean): void {
    this.human = on;
  }

  private applyRoom() {
    if (!this.ctx || !this.roomSend) return;
    const v = this.voiceSound;
    const amount = v === "organ" || v === "sine" ? SYNTH_ROOM[v] : (this.sets[v]?.room ?? SYNTH_ROOM.organ);
    this.roomSend.gain.setTargetAtTime(amount, this.ctx.currentTime, 0.05);
  }

  private createContext() {
    // Play through the iPhone silent switch where Safari allows it (iOS 17+).
    const nav = navigator as Navigator & { audioSession?: { type: string } };
    if (nav.audioSession) nav.audioSession.type = "playback";
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC({ latencyHint: "interactive" });
    this.ctx = ctx;
    const comp = ctx.createDynamicsCompressor();
    comp.connect(ctx.destination);
    this.master = ctx.createGain();
    this.master.connect(comp);
    // A shared room: every voice reaches it from the master, so they sound like one ensemble.
    this.roomSend = ctx.createGain();
    this.roomSend.gain.value = 0;
    const room = createRoom(ctx);
    this.master.connect(this.roomSend);
    this.roomSend.connect(room);
    room.connect(comp);
    for (const v of VOICES) {
      const gain = ctx.createGain();
      gain.gain.value = this.gains[v] * BASE_LEVEL[v];
      const pan = ctx.createStereoPanner();
      pan.pan.value = PAN[v];
      gain.connect(pan);
      pan.connect(this.master);
      this.buses[v] = { gain, pan };
    }
    this.preview = ctx.createGain();
    this.preview.gain.value = 1;
    this.preview.connect(this.master);
    this.organ = new Organ(ctx);
    this.sine = new Sine(ctx);
    ctx.addEventListener("statechange", () => this.emit("state"));
    this.applyRoom();
    if (this.voiceSound === "quartet" || this.voiceSound === "choir") void this.loadSet(this.voiceSound);
  }

  private async loadSet(set: SampleSet) {
    if (!this.sampleBase || this.sets[set] || this.loading.has(set)) return;
    this.loading.add(set);
    this.failed.delete(set);
    try {
      const base = `${this.sampleBase}${set}/`;
      const res = await fetch(`${base}sample-map.json`);
      if (!res.ok) throw new Error(`sample-map.json: ${res.status}`);
      const map = (await res.json()) as SampleMap;
      const voices = await loadSampledVoices(this.ctx!, map, base);
      if (Object.keys(voices).length === 0) throw new Error("no voices in the sample map");
      this.sets[set] = { voices, room: map.reverb ?? 0.15 };
      this.applyRoom();
      this.emit("voices-ready");
    } catch {
      // Samples are an upgrade: the organ keeps playing, and the UI says why.
      this.failed.add(set);
      this.emit("voices-failed");
    } finally {
      this.loading.delete(set);
    }
  }

  private instrument(v: Voice): Instrument {
    const sound = this.voiceSound;
    if (sound === "sine") return this.sine!;
    if (sound !== "organ") return this.sets[sound]?.voices[v] ?? this.organ!;
    return this.organ!;
  }

  /** Per-note humanising, the same every time a note is played so a loop doesn't shimmer. */
  private feel(v: Voice, note: number): { late: number; level: number } {
    if (!this.human) return { late: 0, level: 1 };
    let h = (note + 1) * 2654435761 + VOICES.indexOf(v) * 40503;
    h = (h ^ (h >>> 15)) >>> 0;
    const a = (h & 0xffff) / 0xffff;
    const b = ((h >>> 16) & 0xffff) / 0xffff;
    return { late: a * HUMAN_LATE, level: 1 - b * HUMAN_SOFTER };
  }

  // --- Loading and settings -----------------------------------------------------------------

  load(c: Chorale): void {
    this.stopAll();
    this.playing = false;
    this.chorale = c;
    this.position = 0;
    this.loop = null;
    this.loopCount = 0;
    this.rebuild();
    this.emit("state");
  }

  private rebuild() {
    if (!this.chorale) return;
    this.tm = new TempoMap(this.chorale.fermatas, this.chorale.lengthBeats, this.stretch);
    this.events = buildEvents(this.chorale, this.tm);
  }

  setTempo(bpm: number): void {
    if (bpm === this.bpm) return;
    const beat = this.currentBeat();
    this.bpm = bpm;
    if (this.playing) this.reanchor(beat);
  }

  setFermataStretch(stretch: number): void {
    if (stretch === this.stretch) return;
    const beat = this.currentBeat();
    this.stretch = stretch;
    this.rebuild();
    if (this.playing) this.reanchor(beat);
  }

  setGains(gains: Record<Voice, number>): void {
    this.gains = { ...gains };
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    for (const v of VOICES) {
      const p = this.buses[v].gain.gain;
      p.cancelScheduledValues(now);
      p.setValueAtTime(p.value, now);
      p.linearRampToValueAtTime(gains[v] * BASE_LEVEL[v], now + RAMP);
    }
  }

  setLoop(loop: Loop | null): void {
    this.loop = loop;
    this.loopCount = 0;
    if (this.playing && loop) {
      const beat = this.currentBeat();
      // Jump into the loop if the playhead is outside it.
      if (beat < loop.start - 1e-6 || beat > loop.end + 1e-6) this.seek(loop.start);
      else this.reanchor(beat);
    }
    this.emit("loop");
  }

  getLoop(): Loop | null {
    return this.loop;
  }

  getLoopCount(): number {
    return this.loopCount;
  }

  // --- Transport ----------------------------------------------------------------------------

  isPlaying(): boolean {
    return this.playing;
  }

  async play(from?: number): Promise<SoundState> {
    const state = await this.unlock();
    // Two quick presses can both get here while the context was resuming; start only once.
    if (this.playing) return state;
    if (!this.chorale || state !== "ready") {
      this.emit("state");
      return state;
    }
    let beat = from ?? this.position;
    if (beat >= this.chorale.lengthBeats - 1e-6) beat = this.loop?.start ?? 0;
    if (this.loop && (beat < this.loop.start - 1e-6 || beat >= this.loop.end - 1e-6)) beat = this.loop.start;
    this.startAt(beat);
    return state;
  }

  pause(): void {
    if (!this.playing) return;
    this.position = this.currentBeat();
    this.playing = false;
    this.stopAll();
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.emit("state");
  }

  /** Move the playhead. While playing, playback carries on from the new place. */
  seek(beat: number): void {
    if (!this.chorale) return;
    const b = Math.max(0, Math.min(this.chorale.lengthBeats, beat));
    if (this.playing) {
      this.stopAll();
      this.startAt(b);
    } else {
      this.position = b;
      this.emit("state");
    }
  }

  currentBeat(): number {
    if (!this.playing || !this.ctx || !this.tm) return this.position;
    const now = this.ctx.currentTime;
    let a = this.anchors[0]!;
    for (const x of this.anchors) if (x.t <= now) a = x;
    const u = a.u + (Math.max(now, a.t) - a.t) * (this.bpm / 60);
    return Math.min(this.chorale!.lengthBeats, this.tm.toBeat(u));
  }

  private startAt(beat: number) {
    const ctx = this.ctx!;
    const tm = this.tm!;
    const t = ctx.currentTime + 0.03;
    const u = tm.onset(beat);
    this.anchors = [{ t, u }];
    // Release anything still sounding, so no note is ever dropped from `active` unstopped.
    this.stopAll();
    // Notes already sounding at this beat start straight away.
    this.next = firstEventAt(this.events, u);
    this.startSounding(beat, t);
    this.playing = true;
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => this.schedule(), TICK_MS);
    this.schedule();
    this.emit("state");
  }

  private reanchor(beat: number) {
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    const u = this.tm!.onset(beat);
    this.anchors = [{ t: now, u }];
    // Already-scheduled notes keep their place; the active map stops them being struck twice.
    this.next = firstEventAt(this.events, u);
  }

  private startSounding(beat: number, at: number) {
    const c = this.chorale!;
    for (const v of VOICES) {
      const notes = c.voices[v];
      notes.forEach(([midi, start, dur], i) => {
        if (start < beat - 1e-6 && start + dur > beat + 1e-6) {
          this.active.set(`${v}:${i}`, this.instrument(v).start(midi, at, this.buses[v].gain, this.feel(v, i).level));
        }
      });
    }
  }

  private schedule() {
    if (!this.playing || !this.ctx || !this.tm) return;
    const ctx = this.ctx;
    const horizon = ctx.currentTime + LOOKAHEAD;
    const upb = this.bpm / 60;

    for (let guard = 0; guard < 4; guard++) {
      const a = this.anchors[this.anchors.length - 1]!;
      const timeOf = (u: number) => a.t + (u - a.u) / upb;
      const endUnits = this.loop ? this.tm.release(this.loop.end) : this.tm.totalUnits;

      while (this.next < this.events.length) {
        const ev = this.events[this.next]!;
        if (ev.units > endUnits + 1e-9) break;
        const at = timeOf(ev.units);
        if (at > horizon) return;
        this.fire(ev, Math.max(at, ctx.currentTime));
        this.next++;
      }

      // Reached the end of the loop or the chorale.
      if (this.loop) {
        const restart = timeOf(endUnits + this.tm.breath);
        if (restart > horizon) return;
        this.stopAll(timeOf(endUnits));
        const startU = this.tm.onset(this.loop.start);
        // Keep the anchor in force now and any still to come, then add the restart.
        const now = ctx.currentTime;
        let current = this.anchors[0]!;
        for (const x of this.anchors) if (x.t <= now) current = x;
        this.anchors = [current, ...this.anchors.filter((x) => x.t > now), { t: restart, u: startU }];
        this.next = firstEventAt(this.events, startU);
        this.startSounding(this.loop.start, restart);
        this.loopCount++;
        const delay = Math.max(0, (restart - ctx.currentTime) * 1000);
        setTimeout(() => this.emit("loop"), delay);
        continue;
      }

      const end = timeOf(endUnits);
      if (ctx.currentTime >= end) {
        this.playing = false;
        this.position = this.chorale!.lengthBeats;
        this.stopAll();
        if (this.timer) clearInterval(this.timer);
        this.timer = null;
        this.emit("ended");
        this.emit("state");
      }
      return;
    }
  }

  private fire(ev: NoteEvent, at: number) {
    const key = `${ev.voice}:${ev.note}`;
    if (ev.type === "on") {
      if (this.active.has(key)) return;
      const feel = this.feel(ev.voice, ev.note);
      this.active.set(key, this.instrument(ev.voice).start(ev.midi, at + feel.late, this.buses[ev.voice].gain, feel.level));
    } else {
      const n = this.active.get(key);
      if (!n) return;
      n.stop(at);
      this.active.delete(key);
    }
  }

  private stopAll(at?: number) {
    const t = at ?? this.ctx?.currentTime ?? 0;
    this.active.forEach((n) => n.stop(t));
    this.active.clear();
  }

  // --- Sounding things on touch -------------------------------------------------------------

  /** A tapped note: always audible, whatever the mix, panned to its voice. */
  async previewNote(voice: Voice, midi: number, seconds = 0.6): Promise<void> {
    if ((await this.unlock()) !== "ready") return;
    const ctx = this.ctx!;
    const p = ctx.createStereoPanner();
    p.pan.value = PAN[voice];
    const g = ctx.createGain();
    g.gain.value = 0.18;
    g.connect(p);
    p.connect(this.preview!);
    const now = ctx.currentTime;
    this.instrument(voice).start(midi, now, g).stop(now + seconds);
    setTimeout(() => p.disconnect(), (seconds + 0.5) * 1000);
  }

  /** The chord at a beat, through the voice mix, for scrubbing and stepping. */
  async previewChord(beat: number, seconds = 0.35): Promise<void> {
    if (!this.chorale || this.playing) return;
    if ((await this.unlock()) !== "ready") return;
    const now = this.ctx!.currentTime;
    const sounding = notesAt(this.chorale, beat);
    for (const v of VOICES) {
      const n = sounding[v];
      if (n) this.instrument(v).start(n[0], now, this.buses[v].gain).stop(now + seconds);
    }
  }

  dispose(): void {
    this.pause();
    void this.ctx?.close();
    this.ctx = null;
  }
}
