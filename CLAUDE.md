# Chorale Workshop

A web app for hearing, exploring and writing Bach four-part chorales.
One canvas, one playhead, three lenses (Listen, Explore, Build).
Audience: hobbyist musicians and university-level learners. Musically serious, interface simple.
Priorities, in order: usability, accessibility, details. Features come after those.
Do not build anything that is not in this file. If something seems missing, propose it in a note instead.
This file covers PHASE 1: LISTEN. Do not build Explore or Build features yet,
but keep the architecture ready for them (lens switcher present, two lenses disabled).

## Stack (decided)
- Vite + React 18 + TypeScript (strict). State: Zustand.
- Ribbon view: Canvas 2D, with an SVG overlay for labels and hit targets.
- Score view: Verovio (WebAssembly) rendering MusicXML to SVG.
- Audio: Web Audio API. Schedule notes ahead of time; no setTimeout timing.
- Data pipeline: Python 3 + music21, in /pipeline, run at build time only.
- PWA: service worker caches app, chorale JSON and samples.
- Tests: Vitest for logic, Playwright for key flows on desktop and mobile widths.
- Accessibility checks: axe-core inside the Playwright runs, plus a manual keyboard and VoiceOver pass per feature.

## Design skill: Impeccable
- Set up once: run `npx impeccable install` in the repo, then `/impeccable init` in Claude Code.
- Use it on every UI change: build, then run its critique and polish commands before calling a feature done.
- Follow its anti-pattern list. Where it conflicts with the brand tokens in this file, the tokens win.
- Keep the look quiet: the four voice colours carry the identity; everything else is ink on paper.

## Repo layout
/pipeline      Python: MusicXML -> JSON, one file per chorale
/public/data   generated JSON + index.json (never hand-edit)
/public/samples  voice samples + sample-map.json
/src/audio     engine, sampler, synth fallback, tempo map
/src/canvas    ribbon renderer, playhead, hit testing
/src/score     Verovio wrapper, note-id mapping
/src/ui        library, workspace, voice chips, transport, panels
/src/state     store: chorale, playhead, voices, lens, view

## Data pipeline
- Source: music21 corpus, Bach chorales. Phase 1 ships 30 (list in /pipeline/core30.txt).
- Expand repeats. Keep every verse of lyrics with syllabic info.
- Per chorale JSON:
  { id, bwv, riemenschneider, title, source, key, timeSig, pickupBeats,
    lengthBeats, fermatas: [[startBeat, endBeat]],
    voices: { S|A|T|B: [[midi, startBeat, durBeats, pitchName]] },
    lyrics: [{ beat, verses: [{ text, syllabic }] }],
    chords: [{ beat, dur, name, clash }] }
- clash = sum over pitch-class pairs sounding together: semitone/maj7 = 3,
  tone/min7 = 1.5, tritone = 2, everything else 0.
- index.json lists every chorale with title, numbers, key, length.
- Validate: 4 voices, ascending beats, no overlaps within a voice.

## Audio requirements
- One gain node per voice; mute, solo and level change with a 20 ms ramp, no clicks.
- Tempo map: fermatas held 1.7x (user setting 1.0-2.5x), small breath before each phrase.
- Sampler reads sample-map.json (voice -> samples by MIDI note and vowel).
  Until real samples are chosen, ship the synth fallback (organ-like additive tone).
- Light per-voice pan: S and T slightly left, A and B slightly right.
- Audio unlocks on first tap. Handle iOS: resume context on every play.
- Scrubbing: dragging the playhead sounds each chord briefly as it is crossed.

## UX requirements (acceptance criteria)
- Library: 'Start here' shelf of 5, searchable list of 30 (title, BWV, Riemenschneider, key).
- Workspace: title + German first line + translation; Ribbons / Score toggle keeps position.
- Voice chips S A T B, one colour per voice everywhere.
  Tap = mute, long-press = solo, vertical drag = level. 'My part' preset: one voice 100%, others 30%.
- Transport: play/pause, loop phrase (tap a fermata), tempo 40-120, verse picker.
- Tap a note: it sounds. Tap empty canvas: playhead jumps there.
- Tension gauge strip under the music.
- Keyboard: Space play, arrows step chord, 1-4 mute, Shift+1-4 solo, L loop, [ ] tempo.
- Phone portrait: one phrase per screen, swipe between phrases. Landscape: scrolling canvas.
- Light and dark themes. Respect prefers-reduced-motion.

## Design tokens (brand)
- Voices, light / dark: Soprano #B4232A / #F2666C, Alto #A86400 / #EBA43F,
  Tenor #0E7A70 / #3EC2B3, Bass #3A3EA6 / #9094F4. Used only for voices.
- Paper #EEF0F3 / #111319, Ink #1A1D26 / #E6E8EE, Clash #7A3B8F / #C98BE0 (tension gauge only).
- Type: IM Fell English (titles only), Atkinson Hyperlegible (interface),
  Spectral Italic (lyrics), IBM Plex Mono (chords, numbers). All from Google Fonts.
- Every voice also carries its letter S A T B; high-contrast mode adds dash patterns.
- Mark: a fermata over four short voice-coloured lines.
- Motion only follows the music. Interface taps are silent. No mascots, badges or confetti.

## Usability musts
- Open straight into the Passion Chorale; one question sets the starting lens.
- Show state visibly: muted voices dashed on canvas, loop bracket, non-default tempo tag.
- Organ fallback plays at once while choir samples load.
- WCAG 2.2 AA, full keyboard use, 44 px touch targets, screen-reader chord stepping.

## Performance budget
- First sound under 2 s after Play on a mid-range phone on 4G.
- Tap-to-sound under 50 ms. Playhead at 60 fps.

## Definition of done for phase 1
- A singer can open a chorale and loop their own part in three taps.
- All 30 chorales load, play start to finish, and match the score in both views.
- Playwright flows pass at 390 px and 1280 px widths; tested on a real iPhone.
- Zero axe-core violations; every flow completed by keyboard alone and with VoiceOver.
- Impeccable critique run on every screen, with its findings fixed or written down.

## Out of scope for phase 1
Roman numerals, cadence labels, key map, Build lens, lessons, accounts,
teacher features, exam mark schemes, points or badges, MIDI export, extra tunings.

## Reference
The prototype (single chorale, synth playback, ribbons, tension gauge) is in /reference/prototype.html.
Reuse its tempo map and clash scoring; rebuild everything else to this spec.

## Agreed with the owner since this spec (2026-11-01)
- Sound picker in the transport: Quartet (default; one singer per part, Choral Singing Dataset),
  Choir (epic-choir/VocalSet), Organ, Sine. Sample sets load on demand; the organ covers meanwhile.
- "Human timing" option (on by default, off for strict practice): small per-note timing and level variation.
- Space plays/pauses wherever focus is, except text fields, selects, checkboxes and radios.
