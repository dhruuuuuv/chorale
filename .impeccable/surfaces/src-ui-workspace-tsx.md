---
version: 1
slug: "src-ui-workspace-tsx"
primary_target: "src/ui/Workspace.tsx"
related_targets: ["src/ui/Library.tsx"]
---

# Workspace (Listen lens) and Library

Mode: Operate. Audience and job: see PRODUCT.md. Task: hear a chorale, mute/solo/level voices, loop a phrase, slow it down, follow the words; pick a chorale from the library.

## Direction contract

THESIS: The chorale itself is the interface: four voice-coloured ribbons on a quiet paper field, one fixed playhead, the music moving under it. Refuses the category default of a DAW mixer with a track list, or a score viewer with a toolbar.

OWN-WORLD: Brief-pinned. Paper #EEF0F3 / organ-loft #111319 ground, ink text; the four voice colours (vermilion, ochre, teal, indigo) used only for voices; plum only in the tension gauge. IM Fell English for titles, Atkinson Hyperlegible for interface, Spectral Italic for sung words, IBM Plex Mono for numbers and pitch names. Hairline rules, small radii, no cards-as-structure, no shadows except on floating panels.

STORY: Visitor lands in the Passion Chorale, presses one large Play, hears four voices, taps a chip to mute one, taps a fermata to loop a phrase. The library is a hymnal index: a "Start here" shelf then a ruled list.

FIRST VIEWPORT: Desktop: slim top bar (mark + library link, chorale title in Fell with German first line and translation beneath, lens switcher, Ribbons/Score toggle). Left rail: S A T B chips stacked, My part below. Centre: the canvas, fermatas and phrase numbers above, ribbons, words in Spectral italic, tension gauge strip at foot. Bottom transport: big Play, step, loop state, tempo, verse, options. Phone portrait: one phrase fills the canvas; chips in a row above the transport.

FORM: Brief-pinned direction. The roll was run; per the rule that a brief-pinned direction beats the roll, brief.md's palette, type, mark and motion govern. seed:6fdf19e8f69d1f4c

Signature interaction: tap a fermata to loop; the loop draws as a bracket over the phrase with its repeat count. Motion follows the music only.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
