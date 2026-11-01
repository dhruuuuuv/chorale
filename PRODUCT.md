# Product

<!-- impeccable:product-schema 1 -->

Derived from `brief.md` (Chorale Workshop product plan, 1 Nov 2026), confirmed by the owner.

## Platform

web

## Stack

Vite + React 18 + TypeScript (strict), Zustand for state. Ribbon view on Canvas 2D with an SVG overlay; score view rendered by Verovio (WebAssembly). Web Audio for playback. Python + music21 build-time pipeline in `/pipeline`. Installable PWA that works offline. Vitest and Playwright (with axe-core) for tests.

## Users

- **Hobbyist musicians (primary):** players, singers and producers who want to understand harmony and voice leading for their own music. Won by hearing lines move, tapping chords, comparing their ideas with Bach's.
- **University and adult learners (primary):** undergraduates and self-taught students going deeper than school harmony. Want real Bach analysed properly, and to write a voice and check it.
- **Choir singers:** learning their own part. Want their voice louder, a phrase on loop, slowed down.
- **Teachers:** showing harmony in a class or workshop by projecting the same screens. No special teacher features.

Most users cannot read four-voice notation fluently.

## Product Purpose

Make four-part harmony something you can hear, see and touch, rather than decode from a score. One canvas, one playhead, three lenses: Listen, Explore, Build.

Success tests:
- A first-time visitor hears a chorale, mutes a voice and loops a phrase within one minute, without help.
- A learner writes a bass line for one phrase and gets feedback they understand within 10 minutes.

## Positioning

Real Bach (hand-checked core set, analysed in its local keys, never simplified) taken apart voice by voice, with an interface that stays simple: depth comes from switching layers on, never from more screens, settings or modes. Lines, not just chords: the breakthrough non-classical musicians describe is hearing independent voices.

## Operating Context

Used on laptops and phones, often in practice rooms with poor signal (offline matters), and projected in classrooms. iPhones are the most common student device; iOS audio unlock and the silent switch must be handled.

## Capabilities and Constraints

- Phase 1 (current): Listen lens only. Explore and Build are visible but disabled.
- 30 hand-checked chorales from the music21 corpus; everything else is labelled machine analysis when added.
- Synth organ fallback until a choir sample library is chosen.
- Undecided: pricing model, choir sample library and licence, recorded showcase choir, which chorales university courses use most, iPad wrapper.
- Licensing of chorale encodings, translations and samples must be confirmed before any paid launch.

## Brand Commitments

- Working name Chorale Workshop. Mark: a fermata over four short voice-coloured lines.
- Four voice colours (Soprano vermilion, Alto ochre, Tenor teal, Bass indigo, with dark-theme variants) are the core identity and are used only for voices. Paper and ink around them; plum Clash colour for the tension gauge only.
- Type: IM Fell English (titles only), Atkinson Hyperlegible (interface), Spectral Italic (lyrics), IBM Plex Mono (chords, numbers).
- Voice: a choir director who also plays in a band. Plain British English, short sentences, precise music terms with a way in. German always with a translation. Feedback names bar and voice, never "Error".
- No mascots, badges, confetti, streaks, Bach-in-a-wig portraits, parchment textures or stock choirs. Playful through sound and touch only. Interface taps are silent; only music makes sound.

## Evidence on Hand

- `brief.md`: full product plan, research and sources.
- `reference/prototype.html`: single-chorale prototype (synth playback, ribbons, tension gauge).
- music21 corpus chorales and 20 hand-made Roman-numeral analyses (Riemenschneider 1–20).
- No testimonials, user numbers or recorded audio exist; do not fabricate them.

## Product Principles

1. Sound first: touching a note plays it, under 50 ms.
2. One canvas: lenses add and remove layers; detail opens in a side panel or bottom sheet, never a new page.
3. Start clean, reveal on request.
4. Forgiving: unlimited undo, Bach always one tap away, no red cross without a sentence and a way to hear it.
5. Respect the music: real texts with translation, period-appropriate sound and type.

## Accessibility & Inclusion

WCAG 2.2 AA. Full keyboard use. Screen-reader chord stepping (bar, beat, chord, four notes, word), paused during playback. 44 px touch targets. Colour never carries meaning alone: voice letters always, dash patterns in high-contrast mode. Respect reduced motion and system text size. Explore and Build fully usable without sound.
