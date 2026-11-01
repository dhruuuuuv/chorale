---
name: Chorale Workshop
description: Four-part Bach chorales you can hear, see and touch, voice by voice.
colors:
  paper: "#eef0f3"
  sheet: "#f7f8fa"
  ink: "#1a1d26"
  ink-2: "#4a5061"
  ink-3: "#5c6273"
  rule: "#d3d7df"
  rule-strong: "#b5bbc7"
  grid: "#e3e6ec"
  soprano-vermilion: "#b4232a"
  alto-ochre: "#a86400"
  tenor-teal: "#0e7a70"
  bass-indigo: "#3a3ea6"
  clash-plum: "#7a3b8f"
  paper-dark: "#111319"
  sheet-dark: "#171a21"
  ink-dark: "#e6e8ee"
  ink-2-dark: "#b4b9c6"
  ink-3-dark: "#8d93a3"
  rule-dark: "#2b2f3a"
  rule-strong-dark: "#3d4250"
  grid-dark: "#1f232c"
  soprano-vermilion-dark: "#f2666c"
  alto-ochre-dark: "#eba43f"
  tenor-teal-dark: "#3ec2b3"
  bass-indigo-dark: "#9094f4"
  clash-plum-dark: "#c98be0"
typography:
  display:
    fontFamily: "IM Fell English, Iowan Old Style, Georgia, serif"
    fontSize: "clamp(2.25rem, 5vw, 3.25rem)"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "IM Fell English, Iowan Old Style, Georgia, serif"
    fontSize: "1.75rem"
    fontWeight: 400
    lineHeight: 1.1
  title:
    fontFamily: "IM Fell English, Iowan Old Style, Georgia, serif"
    fontSize: "1.375rem"
    fontWeight: 400
    lineHeight: 1.15
  lyric:
    fontFamily: "Spectral, Georgia, Times New Roman, serif"
    fontSize: "1.5rem"
    fontWeight: 400
    lineHeight: 1.2
  body:
    fontFamily: "Atkinson Hyperlegible, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "Atkinson Hyperlegible, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.45
  label-strong:
    fontFamily: "Atkinson Hyperlegible, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 700
  small:
    fontFamily: "Atkinson Hyperlegible, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
  mono:
    fontFamily: "IBM Plex Mono, ui-monospace, Menlo, Consolas, monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
    fontFeature: "tnum"
rounded:
  tag: "4px"
  sm: "6px"
  md: "10px"
  lg: "12px"
  pill: "999px"
spacing:
  space-1: "4px"
  space-2: "8px"
  space-3: "12px"
  space-4: "16px"
  space-5: "24px"
  space-6: "32px"
  space-7: "48px"
  target: "44px"
components:
  button-play:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.label-strong}"
    rounded: "{rounded.pill}"
    padding: "0 1.4rem 0 1.15rem"
    height: "52px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label-strong}"
    rounded: "{rounded.pill}"
    padding: "0 0.9rem"
    height: "40px"
  button-outline-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  button-quiet-pill:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 0.95rem"
    height: "44px"
  icon-button:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.md}"
    size: "44px"
  icon-button-hover:
    backgroundColor: "{colors.grid}"
    textColor: "{colors.ink}"
  segmented:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.pill}"
    padding: "3px"
  segmented-option:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 0.95rem"
    height: "38px"
  segmented-option-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  voice-chip:
    backgroundColor: "{colors.sheet}"
    typography: "{typography.label-strong}"
    rounded: "{rounded.lg}"
    padding: "0 12px 4px"
    height: "56px"
  input-search:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 0.9rem 0 2.5rem"
    height: "44px"
  select:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0 2rem 0 0.75rem"
    height: "44px"
  tag:
    textColor: "{colors.ink}"
    typography: "{typography.mono}"
    rounded: "{rounded.tag}"
    padding: "2px 7px"
  popover:
    backgroundColor: "{colors.sheet}"
    rounded: "{rounded.md}"
    padding: "16px"
    width: "min(320px, calc(100vw - 32px))"
  hint-bubble:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "6px 4px 6px 14px"
---

# Design System: Chorale Workshop

## Overview

**Creative North Star: "The Ruled Hymnal Page"**

The chorale itself is the interface. Four voice-coloured ribbons run across a quiet paper field under one fixed ink playhead, and the music moves beneath it. Everything around the music is paper, ink and hairline rules: a printed hymnal's index and a conductor's stand, not a mixing desk. Colour is reserved for the voices so that when a line is coloured, it is singing.

Density is calm but working: one slim top bar, a left rail of four voice chips, a full-bleed canvas, a docked transport. Titles carry the period in IM Fell English; every control speaks in Atkinson Hyperlegible; sung words appear in Spectral Italic; numbers and pitch names sit in IBM Plex Mono. Depth comes from rules and tonal steps (paper to sheet), never from stacked cards. The world runs in two lights, daylight paper (#eef0f3) and organ-loft dark (#111319), with brighter voice variants in the dark.

Motion follows the music only. Interface state changes are short (120ms) fades of background and colour; the canvas glides with playback, or steps a phrase at a time under reduced motion and on portrait phones.

**Key Characteristics:**
- Paper and ink ground; four voice hues used for voices and nothing else; plum only in the tension gauge.
- Fixed playhead, moving music; fermatas are the loop controls.
- Hairline 1px rules for structure; a 2px ink rule opens a list or a prompt.
- Selection reads as an ink press: ink fill, paper text.
- Colour never works alone: voice letters everywhere, dashed outlines for silence, dash patterns in high contrast.
- 44px minimum targets throughout.

## Colors

A cool, nearly colourless paper-and-ink field that lets four saturated voice colours and one plum carry all the chroma.

### Primary
- **Ink** (ink): text, the playhead, the loop bracket, selected controls, the Play button, and 2px opening rules. In dark mode it becomes Organ-Loft Ink (ink-dark) on Organ-Loft paper.

### Secondary
- **Soprano Vermilion** (soprano-vermilion; dark: soprano-vermilion-dark): the soprano line, its chip, its notes in the score.
- **Alto Ochre** (alto-ochre; dark: alto-ochre-dark): the alto line and chip. Behind a letter, ochre is mixed 55% into sheet and the letter is drawn in ink, because light text on ochre fails contrast.
- **Tenor Teal** (tenor-teal; dark: tenor-teal-dark): the tenor line and chip.
- **Bass Indigo** (bass-indigo; dark: bass-indigo-dark): the bass line and chip.

### Tertiary
- **Clash Plum** (clash-plum; dark: clash-plum-dark): the tension gauge strip at the foot of the canvas, as a 1.25px outline over a 26% plum fill. Nowhere else.

### Neutral
- **Daylight Paper** (paper): page ground and canvas field; also the knock-out behind canvas labels.
- **Sheet** (sheet): one tonal step up; the dock, popover, inputs, chip base and row hover.
- **Ink 2** (ink-2): secondary text, translations, unselected control labels, inactive lyrics.
- **Ink 3** (ink-3): tertiary text: phrase labels, "Clash" label, sources, placeholders, disabled lenses.
- **Rule** (rule): hairline dividers, bar lines, table rows, popover border.
- **Strong Rule** (rule-strong): outlines of quiet pill controls, inputs, selects and tags.
- **Grid** (grid): octave guides on the canvas and the hover wash on icon and segmented buttons.

Voice tints are always mixed from the voice colour into sheet with `color-mix`: 7% at rest, 13% on hover, 20% when soloed, 18% for the level track.

High contrast (`data-contrast="more"`) collapses ink-2 and ink-3 to ink and strengthens rules to ink.

### Named Rules
**The Voice-Only Rule.** Vermilion, ochre, teal and indigo mean soprano, alto, tenor and bass. They never decorate, never mark state, never brand a button.

**The One Plum Rule.** Clash plum appears only in the tension gauge.

**The Letter Beside the Colour Rule.** Every voice colour is accompanied by its letter (S A T B) on chips and at each phrase start on the canvas; a silent voice is dashed and struck through, not just faded.

## Typography

**Display Font:** IM Fell English (with Iowan Old Style, Georgia)
**Body Font:** Atkinson Hyperlegible (with system-ui)
**Lyric Font:** Spectral Italic (with Georgia)
**Mono Font:** IBM Plex Mono (with ui-monospace, Menlo)

**Character:** A seventeenth-century printer's face for names of chorales, set against a hyperlegible modern sans for every control; sung German sits in a soft book italic, and numbers line up in a plain mono.

### Hierarchy
- **Display** (400, clamp(2.25rem, 5vw, 3.25rem), 1, -0.01em): the library's page title only.
- **Headline** (400, 1.75rem, 1.1; 1.3125rem under 760px): the open chorale's title in the top bar; section heads in the library at 1.625rem.
- **Title** (400, 1.375rem, 1.15): shelf item titles; table row titles at 1.1875rem.
- **Lyric** (italic 400, 1.5rem, 1.2): the current sung word in the readout; German first lines at 1.0625rem; canvas lyrics at 1rem; table first lines at 0.9375rem in ink-2.
- **Body** (400, 1rem, 1.45): default interface text; lede at 1.0625rem, max 52ch.
- **Label** (400 or 700, 0.9375rem): buttons, segmented options, fields. Play is 700 at 1.0625rem.
- **Small** (400, 0.8125rem): hints, sources, table headers (700, ink-2), footnotes.
- **Mono** (400 to 600, 0.8125 to 0.875rem, tabular figures): BWV and Riemenschneider numbers, tempo, bar and phrase numbers in the readout, tags.

### Named Rules
**The Four Hands Rule.** Each family has one job. Fell for titles of chorales and sections only, never for controls or body; Spectral Italic only for sung or German text; Plex Mono only for numbers and pitch names; Atkinson for everything else.

**The German With English Rule.** A German line is always followed by its translation in ink-2 sans, directly beneath.

## Layout

The workspace is a full-height three-row grid: top bar, body, dock. The top bar is three columns (mark and library link; title block; lens and view switchers) with 24px gaps and 12px/24px padding, closed by a 1px rule. The body is a 200 to 232px voice rail beside a flexible stage column, 24px apart. The stage is ruled top and bottom and holds the canvas or score; above it sit the goal prompt and a readout line (current word, bar, phrase, key and catalogue numbers right-aligned). The dock is a sheet-toned band with the transport: Play flanked by step buttons, loop toggle, tempo slider, verse, and options pushed to the far right.

Inside the canvas, a header band carries phrase labels and fermatas, the voices fill the middle with octave guides and bar lines, lyrics run beneath, and the tension gauge is the foot. The playhead is fixed near the left edge.

The library is a centred column (max 72rem) with 32/24/48px padding: title head, a "Start here" shelf as a row of ruled cells (auto-fit, min 12.5rem), then a search and a full-width ruled table.

Spacing runs on a 4px base (4, 8, 12, 16, 24, 32, 48). Every interactive target is at least 44px.

**Narrow (≤760px):** the top bar wraps its controls to a second row; the voice rail becomes a row of four compact chips plus My part inside the dock above the transport; tempo takes its own row; the readout drops its metadata; the table hides its third column. **Portrait phone (≤600px):** the canvas shows one phrase, with neighbours faded into the paper at 82%.

### Named Rules
**The Fixed Playhead Rule.** The playhead never moves; the music moves under it.

## Elevation & Depth

The system is flat. Depth is made with tonal steps (paper to sheet) and hairline rules, not shadows. One shadow exists, and only floating layers wear it: the options popover, hint bubbles and notices. The soloed chip's double ring (`0 0 0 2px paper, 0 0 0 4px voice`) is an outline, not elevation.

### Shadow Vocabulary
- **Float** (`box-shadow: 0 6px 24px rgb(26 29 38 / 0.12), 0 1px 3px rgb(26 29 38 / 0.08)`; dark: `0 8px 28px rgb(0 0 0 / 0.5), 0 1px 3px rgb(0 0 0 / 0.4)`): popovers, hint bubbles and notices that sit above the work.

### Named Rules
**The Floating-Only Shadow Rule.** A surface casts a shadow only if it floats over the music. Resting surfaces, rows, shelf cells and chips stay flat.

## Shapes

Small radii, round where a thing is pressed. Pills (999px) for every text action: Play, loop, preview, goal options, segmented switches, search. 10px for icon buttons, popovers, hint bubbles and the first-win note; 12px for voice chips and their solo buttons; 6px for selects and the home link; 4px for mono tags. Notes on the canvas are 3px-rounded bars joined by soft bezier lines.

Borders are the structure: 1px rule for dividers, 1px strong rule for quiet controls, 2px ink rule to open a list (shelf, table header, goal prompt), 2px voice colour around each chip (dashed when silent).

The mark is a fermata over four short voice-coloured lines; the fermata (arc and dot) is the world's recurring glyph, drawn on the canvas, in hints and as the loop control.

### Named Rules
**The Hairline Rule.** Lists and regions are separated by 1px rules, not boxed in cards. A 2px ink rule marks where a list begins.

## Components

### Buttons
Pressed ink on paper; confident but never loud.
- **Shape:** full pill (999px).
- **Play (primary):** ink fill, paper text, 700 at 1.0625rem, 52px tall, min 9.5rem wide, play or pause icon leading. Hover mixes ink 86% into paper; active scales to 0.98.
- **Outline (text button):** 1px ink border, ink text, 700, 40px tall; hover inverts to ink fill and paper text.
- **Quiet pill (loop, preview, goal options):** 1px strong-rule border, ink-2 text, 44px. Hover moves border and text to ink. Loop on: 2px ink border, ink text, 700. Preview pressed: ink fill.
- **Icon button:** 44px square (32px small), 10px radius, transparent, ink-2 icon; hover takes the grid wash and ink.
- **Focus:** 2px solid outline at 2px offset on every focusable element.

### Segmented switch
- **Style:** pill track with 1px rule border on paper, 3px inset; options 38px pills, ink-2.
- **State:** selected is ink fill with paper text; hover on unselected is the grid wash; disabled options are ink-3 at 60% opacity with a "later version" title.

### Voice chip (signature)
The voice made touchable: one per voice, stacked S A T B.
- **Shape:** 12px radius, 2px border in the voice colour, 56px tall.
- **Background:** voice mixed 7% into sheet; 13% on hover; 20% plus a paper-and-voice double ring when soloed.
- **Content:** a 30px filled circle with the voice letter, the name in 700, a state readout in small ink-2, and a 3px level bar along the bottom edge.
- **Silent:** dashed border, transparent fill, letter as a hollow ring, name struck through in ink-2.
- **Solo button:** a separate 12px-radius icon button beside the chip; on, it fills with the voice colour.
- **Compact (narrow):** four chips in a row, letter and name centred, state hidden, 52px tall.

### Inputs / Fields
- **Search:** pill, 1px strong rule, sheet fill, leading search icon in ink-3, 44px.
- **Select:** 6px radius, 1px strong rule, sheet fill, drawn chevron, 44px.
- **Range and checkbox:** native, accent-colour ink; 44px row height.
- **Field:** 700 legend, small ink-2 hint beneath.

### Tags
Mono figures in a 1px strong-rule box, 4px radius, tabular numbers: loop count, changed tempo, pause stretch.

### Library list
- **Shelf:** a row of ruled cells under a 2px ink rule, separated by 1px vertical rules; Fell title, ink-2 translation, meta and source pinned to the bottom, a Preview pill. The whole cell links; hover tints it sheet.
- **Table:** 2px ink rule under small 700 headers; 1px rule per row; Fell row titles with Spectral Italic first lines beneath when they differ; numbers right-aligned in mono; row hover sheet.

### Hints and notices
Ink fill, paper text, 10px radius, float shadow, rising 4px over 320ms. One hint at a time, after the music has started, each dismissed once. Inline hints drop the shadow.

### Canvas (signature)
Voices draw lowest first so the soprano sits on top. Note bars are filled in the voice colour; the sounding note gets a 2px ink outline. Joining lines run at half opacity. Fermatas are 1.6px ink-2 arcs with a dot; in a loop they thicken to 2.2px ink. The loop is a 2px ink bracket over the phrase with "Loop ×n" centred on it, over a 4.5% ink wash. The playhead is a 2px ink line with a small downward triangle.

## Do's and Don'ts

### Do:
- **Do** keep voice colours for voices: chips, ribbons, score noteheads, the mark.
- **Do** pair every voice colour with its letter, and dash a silent voice.
- **Do** show selection as an ink press: ink fill, paper text.
- **Do** separate content with 1px rules and open lists with a 2px ink rule.
- **Do** set chorale titles in IM Fell English and sung or German text in Spectral Italic, with an English translation beneath.
- **Do** put numbers, tempo and pitch names in IBM Plex Mono with tabular figures.
- **Do** keep every target at least 44px and every state change at 120ms ease-out.
- **Do** derive voice tints with `color-mix` into sheet (7%, 13%, 20%).

### Don't:
- **Don't** use vermilion, ochre, teal or indigo for buttons, links, status or decoration.
- **Don't** use clash plum anywhere but the tension gauge.
- **Don't** put a shadow on a resting surface; only popovers, hints and notices float.
- **Don't** box content in cards; shelves and tables are ruled, not carded.
- **Don't** set controls or body copy in Fell, or numbers in the interface sans.
- **Don't** animate the interface for its own sake; motion follows the music.
- **Don't** use parchment textures, portraits, mascots, badges or confetti.
