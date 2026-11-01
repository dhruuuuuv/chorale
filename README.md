# Chorale Workshop

Hear a Bach chorale sung by four voices, take it apart, and follow the harmony. Phase 1 is the **Listen** lens: mute, solo and level each voice, loop a phrase, slow it down, follow the words, in ribbon or score view. See `brief.md` for the full plan and `CLAUDE.md` for the phase 1 spec.

## Run it

```sh
npm install
npm run dev            # http://localhost:5173
```

The chorale data in `public/data/` is generated and committed. To rebuild it:

```sh
uv venv pipeline/.venv --python 3.11
uv pip install --python pipeline/.venv/bin/python -r pipeline/requirements.txt
npm run data
```

## Test

```sh
npm test               # Vitest: tempo map, scheduler events, mixing, geometry, score mapping, search
npm run test:pipeline  # pytest: chord naming, clash, and every generated chorale validated
npm run test:e2e       # Playwright at 390 px and 1280 px, with axe-core (builds and serves the app)
```

## How it fits together

| Part | Where | Notes |
| --- | --- | --- |
| Data pipeline | `pipeline/build.py` | music21 corpus → one JSON per chorale + two-stave MusicXML. Repeats written out, every verse kept, partial bars at a repeat joined. The core 30 are listed in `pipeline/core30.txt`. |
| Audio | `src/audio/` | Web Audio. Notes scheduled ahead on the audio clock (`engine.ts`); the timer only wakes the scheduler. Tempo map with fermata stretch and a breath (`tempoMap.ts`). Four sounds, chosen in the transport: quartet (default), choir, organ and sine. Sung voices load on demand; the organ covers meanwhile. A shared room reverb (`room.ts`) and optional human timing make the four voices sound like one ensemble. |
| Quartet samples | `pipeline/quartet.py` → `public/samples/quartet/` | One real singer per part from the [Choral Singing Dataset](https://zenodo.org/records/1286570) (Anton Bruckner Choir, CC BY 4.0). Pitch-tracks every singer, picks the steadiest per part, keeps their best held note per pitch. |
| Choir samples | `pipeline/samples.py` → `public/samples/choir/` | The "ah" vowel at mf from [epic-choir](https://github.com/thepok/epic-choir) (VocalSet, CC BY 4.0): mono, levelled, seamless loop baked in, AAC, 1.7 MB in all. The credit is in the library footer and `public/samples/choir/ATTRIBUTION.txt`. |
| Ribbon view | `src/canvas/` | Canvas 2D drawn from one animation-frame loop, outside React. Fermata buttons are real HTML buttons over the canvas. |
| Score view | `src/score/` | Verovio in a Web Worker, loaded only when the score is first opened. Engraved note ids are mapped back to our notes through Verovio's timemap. |
| State | `src/state/` | Zustand store; preferences persist in localStorage. |
| UI | `src/ui/` | Library and workspace, the only two screens. |

## Decisions worth knowing

- **Core 30.** Riemenschneider 6, 11 and 15 are left out: their corpus files have no lyrics or are instrumental. Thirteen well-known chorales complete the 30 (`pipeline/core30.txt`). The Passion Chorale output matches the prototype note for note and chord for chord (tested).
- **Chord names** are only given to complete triads and sevenths, as in the prototype; passing sonorities stay blank. Keys for Riemenschneider 1–20 come from the hand-made analyses; the rest are estimated.
- **The getting-started question** sets the starting view in phase 1 (Score for "write my own", Ribbons otherwise) and which first suggestion appears, since Explore and Build are not built yet. The third first-run hint points to the Score view instead of Explore for the same reason.
- **Reduced motion** shows one phrase at a time instead of scrolling, as on a phone in portrait.
- **iPhone silent switch.** Safari 17+ plays through it (`navigator.audioSession`). Older iOS gets the "check the silent switch" note, since silence can't be detected.
- **Offline.** The app, fonts and all 30 chorales are precached. The score engraver (about 8 MB) and score files are cached the first time the score view is used.

## Rebuilding the quartet samples

Download `ChoralSingingDataset.zip` from [Zenodo](https://zenodo.org/records/1286570), unzip it, then:

```sh
pipeline/.venv/bin/python pipeline/quartet.py <folder>/ChoralSingingDataset   # needs ffmpeg; takes several minutes
```

## Rebuilding the choir samples

Download the four voice zips from the [epic-choir v1.0 release](https://github.com/thepok/epic-choir/releases/tag/v1.0), unzip them into one folder, then:

```sh
pipeline/.venv/bin/python pipeline/samples.py <folder>/samples   # needs ffmpeg
```

The choir is a section sound: each note sums several singers. Bach's basses go below the lowest bass sample (B♭2), and those notes are transposed down from it.

## Still to do for phase 1 sign-off

- Real-iPhone test and a VoiceOver pass (automated checks cover keyboard and axe only).
- Decide how to get a one-singer-per-part sound: no free sample set covers it today.
- Confirm licences for the chorale encodings and translations before launch.
