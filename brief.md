# Chorale Workshop — product plan

Nov 1, 2026 · @Dhruv

## The idea and who it's for

Chorale Workshop is a web app where you hear a Bach chorale sung by four voices, take it apart, and write voices yourself, with the harmony visible at every step. It is for curious adults: hobbyists and university-level learners. Its single job: make four-part harmony something you can hear, see and touch, rather than something you decode from a score.

| Who | What they come for | What wins them |
| --- | --- | --- |
| Hobbyist musicians (primary) | Players, singers and producers who want to understand harmony and voice leading for their own music | Hearing lines move, tapping chords, comparing their ideas with Bach's |
| University and adult learners (primary) | Undergraduates and self-taught students going deeper than school harmony | Real Bach analysed properly, writing a voice and checking it |
| Choir singers | Learning their own part | Their voice louder, a phrase on loop, slowed down |
| Teachers | Showing harmony in a class or workshop | One clear screen that plays, pauses and explains; no special teacher features |

The musical level is above school harmony: real Bach, analysed in its local keys, never simplified. The interface stays simple anyway. Depth comes from switching layers on, never from more screens, settings or modes.

Two tests of success:

- A first-time visitor hears a chorale, mutes a voice and loops a phrase within one minute, without help.
- A learner writes a bass line for one phrase and gets feedback they understand within 10 minutes.

## Scope: simple first

Version 1 is three things done extremely well: listen to a chorale voice by voice, see its harmony, and write one voice and compare it with Bach. Every interaction in those three is polished, accessible and fast before anything new is added.

| In version 1 | Later, if testing shows people want it | Not planned |
| --- | --- | --- |
| 30 chorales, checked by hand | The full collection | Accounts and sync, until saving across devices is clearly needed |
| Sampled choir voices, organ fallback | Instrumental doubling, Baroque tunings and A = 415 | Teacher dashboards, homework, class management |
| Mute, solo, level, loop, tempo, verses | Guided lessons beyond a first bass-line exercise | Exam-board mark schemes |
| Words with translation | Non-chord tone and figured bass layers | Points, streaks, badges |
| Ribbon and score views, tension gauge | Other settings of the same tune, side by side | Synthesised singing of the words |
| Chords, Roman numerals, cadences, key map, common tones | "Your tune, Bach's way" | Search by humming |
| Chord detail panel | Guitar and piano voicings, MIDI export | Recorded choir, unless funded |
| Blank any voice, write it, check it, A/B with Bach | Search the collection by harmonic feature |  |
| Light and dark, keyboard, screen reader, offline |  |  |

The rule for adding anything: testing shows people need it, and it fits on the one canvas without a new screen.

## What people want from the chorales

People outside classical music come to the chorales for one thing: to see and hear how individual lines make chords, then use that in their own playing. They get stuck on where to start, on reading four-voice notation, and on rules that Bach himself breaks. The fastest way in is play: Google's Bach Doodle drew 8.5 million sessions in three days, mostly from people who could not read notation.

### What non-classical musicians took from them

| Who | Background | What they took from Bach |
| --- | --- | --- |
| [Steve Morse](https://www.guitarworld.com/lessons/morse-code-bach-chorale-voicings) | Rock guitarist | Built guitar voicings on the chorales' common tones and small moves, to "break away from the more familiar sound" of rock chords. Treats each voice as independent. |
| [Brad Mehldau](https://rosetta.to/u/rickbeato/brad-mehldau-the-greatest-jazz-pianist-of-our-generation) | Jazz pianist | Sees Bach as the model where harmony and melody "are one": lines that spell out chords. It shapes his left-hand figures and comping. |
| [Bill Evans](https://bachchoraleharmony.com/quotes-about-bach-his-music/) | Jazz pianist | Said Bach changed his whole hand approach to the piano (interview with Marian McPartland, as quoted by Pettinger). |
| [Miles Okazaki](https://rss.com/podcasts/work-with-miles-okazaki/2028212) | Jazz guitarist | A 2025 podcast lesson: layer a chorale one voice at a time, then analyse it and improvise over it. |
| [Jazz guitarists, jazzguitar.be forum](https://www.jazzguitar.be/forum/theory/97275-how-similar-freddie-greens-comping-bach-chorales-harmonically.html) | Working players | Use chorale harmonisation exercises and apply them to standards. One found figured bass taught him to hear root position and voice movement. |
| [James Blake](https://contentmode.com/james-blake/) | Singer, producer | Says classical music informed his piano playing, melody and harmony more than listeners might guess. |
| [Paul Simon](https://en.wikipedia.org/wiki/American_Tune) | Songwriter | "American Tune" (1973) is built on the Passion Chorale melody; Hassler is credited. |
| [Jordan Ali](https://www.jordanali.com/writing/the-bach-chorale) | Composer and teacher | Calls the chorales the "source code" of Western harmony. Teaches songwriters and electronic musicians to sing each voice, one chorale a week or month. |

### What learners ask for and where they get stuck

| Finding | Evidence | What it means for the app |
| --- | --- | --- |
| Most people can't read four-voice notation | Doodle team found only a small subset could read standard notation; Hookpad users struggle to enter four voices | Ribbons first, score optional; tap and drag, never type notes |
| Learning by layering voices works | Okazaki layers one voice at a time; Ali sings each voice separately; KVR posters rewrite inner voices and compare | Build-up lessons and voice-by-voice reveal are the core, not an extra |
| The "aha" is lines, not chords | Morse, Mehldau and jazz guitarists all describe hearing independent voices; pop tools like Hookpad are chord-first | Show each voice's step into the next chord; highlight held common tones |
| People want to take it into their own music | Jazz players apply chorales to standards; Morse to guitar voicings | Guitar and piano voicing views, MIDI export, transpose to any key |
| "Where do I start?" | KVR producer asked for the easiest chorales; replies: major keys before minor | Difficulty rating, a guided "Start here" order |
| Modal chorales confuse | KVR: many resist major/minor analysis because of older modal practice | Label modal chorales and explain the mode, not force a key |
| The standard book loses context | Riemenschneider omits the hymn texts, repeats some settings, has errors | Words and translation always shown; group settings of the same tune |
| Rules feel arbitrary when Bach breaks them | Hacker News thread: rules vs style; Doodle users complained about parallel fifths | Keep the "Bach's own rule-breaking" layer; frame feedback as style |
| Play pulls people in | Doodle: median 25.5 s to compose a melody, 80% of sessions tried several harmonisations, familiar presets most used | A playful "your tune, Bach's way" entry with a first result in under 30 s |

### Existing tools and their gaps

| Tool | What it does well | Gap we fill |
| --- | --- | --- |
| [Google Bach Doodle](https://arxiv.org/pdf/1907.06637) (2019) | Instant, fun harmonisation of your own tune | Machine harmonies with weak voice leading; a reviewer judged it unfit for teaching |
| [Coucou / Coconet](https://symposium.music.org/volume-59-no-2/technology-and-online-resource-reviews-1752877061/google-s-bach-doodle-and-other-online-tools-for-algorithmic-music-instruction) | Erase parts of a piano roll and have them filled in | No real Bach, no explanation |
| [Hookpad](https://forum.hooktheory.com/t/any-suggestion-how-i-can-use-hookpad-to-study-for-bach-chorale/6802) | Chords under melody, great for pop | Chord-first, no four-voice checking, no figured bass |
| [The Infinite Chorale](https://music-theory-practice.com/the-infinite-chorale) | Endless rule-following chorale you can steer to cadences, with live commentary | Textbook chorales, not Bach's; piano only; no writing your own |
| Riemenschneider book | The standard 371 | Notation only, no texts, no sound, no analysis |

### Ideas from the research (most are on the Later list)

- Add **Same tune, other settings**: Bach often harmonised one melody several times. Show them side by side and switch between them at the same beat.
- Add **Your tune, Bach's way**: hum or tap a short melody, hear it harmonised from Bach's own progressions, then edit it in Build. Marked as machine-made.
- Add **Take it home**: guitar and piano voicing diagrams for any chord, MIDI and MusicXML export, transpose.
- Add **common-tone highlighting** to the Explore lens: notes held between chords glow, since that is what non-classical players notice first.
- Label **modal chorales** with their mode rather than forcing a major or minor key.

### Sources

- [The Bach Doodle paper, Huang et al., 2019](https://arxiv.org/pdf/1907.06637)
- [Review of the Bach Doodle and online tools, College Music Symposium](https://symposium.music.org/volume-59-no-2/technology-and-online-resource-reviews-1752877061/google-s-bach-doodle-and-other-online-tools-for-algorithmic-music-instruction)
- [KVR forum: Riemenschneider analysis for beginners](https://www.kvraudio.com/forum/viewtopic.php?p=7141824)
- [Hooktheory forum: using Hookpad for Bach chorales](https://forum.hooktheory.com/t/any-suggestion-how-i-can-use-hookpad-to-study-for-bach-chorale/6802)
- [Hacker News: did Bach invent the rules of music theory?](https://news.ycombinator.com/item?id=32498906)
- [Jazz guitar forum: Freddie Green and Bach chorales](https://www.jazzguitar.be/forum/theory/97275-how-similar-freddie-greens-comping-bach-chorales-harmonically.html)
- [Guitar World: Steve Morse on Bach chorale voicings](https://www.guitarworld.com/lessons/morse-code-bach-chorale-voicings)
- [Rick Beato with Brad Mehldau](https://rosetta.to/u/rickbeato/brad-mehldau-the-greatest-jazz-pianist-of-our-generation)
- [Miles Okazaki: Bach on Sunday, chorale deep dive](https://rss.com/podcasts/work-with-miles-okazaki/2028212)
- [Jordan Ali: the Bach chorale exercise](https://www.jordanali.com/writing/the-bach-chorale)
- [The Infinite Chorale](https://music-theory-practice.com/the-infinite-chorale)
- [American Tune, Wikipedia](https://en.wikipedia.org/wiki/American_Tune)
- [Bach Chorale Harmony: quotes](https://bachchoraleharmony.com/quotes-about-bach-his-music/)
- [Contentmode: James Blake interview](https://contentmode.com/james-blake/)

## One workspace, three lenses

The app is one canvas with one playhead, seen through three lenses: Listen, Explore and Build. Switching lens never moves the playhead, reloads the piece or loses your work, so a student can hear a cadence, look at why it works, then try writing it, all in the same spot.

| Lens | What you do | Main controls | Mostly for |
| --- | --- | --- | --- |
| Listen | Hear the chorale sung, follow the words, take voices in and out | Play, mute and solo per voice, loop a phrase, tempo, verse picker | Singers, listeners, first contact for everyone |
| Explore | See the harmony: chords, functions, cadences, keys, tension | Lens toggles for each layer, tap a chord for its detail sheet | Students revising, teachers demonstrating |
| Build | Hide voices and write them yourself, with feedback and Bach's version to compare | Hide or reveal each voice, drag notes, check, A/B against Bach | Students practising harmonisation |

Build has two flavours. Free build lets you blank any voice in any chorale and write it. Version 1 adds one guided exercise, writing a bass line; a fuller lesson ladder may follow if testers want it (see Build-up learning path).

## Design and brand

The brand idea is **an open chorale book that sings**: the seriousness of a Leipzig hymnal, the warmth of a good choir director, the hands-on feel of a mixing desk. It should look like it was made by musicians, not by an ed-tech company.

### Personality and voice

| We are | We are not |
| --- | --- |
| A choir director who also plays in a band: knows the rules, enjoys the exceptions | A theory textbook or an exam board |
| Precise with music terms, and explains each on tap | Jargon without a way in, or dumbed down |
| Respectful of the texts and their history | Devotional, or ironic about it |
| Playful through sound and touch | Playful through mascots, badges or confetti |

Copy rules: plain British English, short sentences, music terms in their real form with a tap-to-explain glossary. German always with a translation beneath. Feedback names the bar and voice ("Tenor, bar 3"), never "Error".

### Name and mark

- Working name **Chorale Workshop**. Shortlist to test with users: Four Voices, SATB, Choralbuch.
- The mark is a **fermata** (the pause sign: an arc over a dot) sitting on four short coloured lines. The fermata is the chorale's signature, and it carries the brand's promise: stop, listen, look closer.
- App icon: the fermata in ink on the paper colour, the four voice lines beneath it.

### Colour

The four voice colours are the core of the identity: they appear on chips, lines, notes, score staves and lesson illustrations, and nowhere else. Everything around them stays quiet: ink on paper by day, an organ loft by night.

| Token | Light | Dark | Used for |
| --- | --- | --- | --- |
| Soprano | #B4232A vermilion | #F2666C | Soprano line, chip, staff |
| Alto | #A86400 ochre | #EBA43F | Alto line, chip, staff |
| Tenor | #0E7A70 teal | #3EC2B3 | Tenor line, chip, staff |
| Bass | #3A3EA6 indigo | #9094F4 | Bass line, chip, staff |
| Paper | #EEF0F3 | #111319 | Page ground |
| Ink | #1A1D26 | #E6E8EE | Text, playhead, primary button |
| Clash | #7A3B8F plum | #C98BE0 | Tension gauge only |

Colour never carries meaning alone: every line also carries its letter (S A T B) at the start of each phrase, and a high-contrast mode adds dash patterns per voice. Check all four against each other for the common colour-blindness types before locking them.

### Type

| Role | Face | Why |
| --- | --- | --- |
| Display (titles, chorale names) | IM Fell English | Revival of 17th-century English printing type; feels like a period hymnal |
| Interface and body | Atkinson Hyperlegible | Designed for legibility at small sizes; distinguishes similar letters |
| Lyrics | Spectral Italic | A book face for sung words, distinct from interface text |
| Chords, numbers, figures | IBM Plex Mono | Chord symbols and figured bass line up in columns |

All four are free on Google Fonts. Display is used sparingly: chorale titles and section heads only.

### Motion and sound

- Motion follows the music: the playhead is the only constant movement. A tapped chord blooms gently; nothing bounces.
- Interface taps are silent; only music makes sound. Finishing a lesson plays a short plagal "Amen" cadence instead of a jingle.
- All motion respects reduced-motion settings; auto-scroll then jumps by phrase instead of gliding.

### Imagery

No portraits of Bach in a wig, no parchment textures, no stock choirs. Visual texture comes from the music itself: staff lines, fermatas, the shape of the voice ribbons. Lesson illustrations are drawn in the four voice colours.

## Usability

The app should feel like an instrument, not a course: every touch makes a sound, and nothing sits behind a modal. Accessibility and small details are launch requirements, not later polish.

### Principles

1. **Sound first.** Touching a note plays it; touching a chord column plays the chord. Target under 50 ms from tap to sound.
2. **One canvas.** Lenses add and remove layers on the same view. Detail opens in a side panel (desktop) or bottom sheet (phone), never a new page.
3. **Direct manipulation.** In Build, drag a note up or down to change it. It snaps to the key, you hear it at once, and feedback updates live.
4. **Start clean, reveal on request.** The default view is four coloured voice lines and the words. Chord names, Roman numerals and analysis are switched on, never forced.
5. **Forgiving.** Unlimited undo. "Compare with Bach" is always one tap away. No red cross without a sentence saying why and a way to hear the problem.
6. **Respect the music.** Real German text with a translation, period-appropriate sound and type, no mascots. Playful through interaction, not decoration.

### Signature interactions

- **Voice chips (S A T B).** One colour per voice, used everywhere: chip, line, note, score staff. Tap to mute, long-press to solo, drag up or down to set level. A "My part" preset boosts one voice and drops the others to 30%.
- **Scrubbing.** Drag the playhead and each chord sounds as you pass it, so you can feel the harmony move at your own speed.
- **Phrase loop.** Tap a fermata to loop that phrase. Tap two fermatas to loop the span between them.
- **Hold a chord.** Press and hold a chord column to sustain it. While holding, tap voice chips to hear the chord built up voice by voice.
- **Two views of the same music.** Ribbon view (the coloured lines from the prototype) for ears-first users, score view (real SATB notation on two staves) for students. Toggle without losing place.
- **A/B with Bach.** In Build, one switch flips between your version and Bach's at the current playhead, like a mixing desk's compare button.

### Keyboard and touch

| Action | Keyboard | Touch |
| --- | --- | --- |
| Play / pause | Space | Play button |
| Step one chord | Left / Right arrows | Swipe on the transport bar |
| Mute voice | 1 to 4 | Tap chip |
| Solo voice | Shift + 1 to 4 | Long-press chip |
| Loop phrase | L | Tap fermata |
| Tempo | \[ and \] | Tempo slider |
| Compare with Bach | B | A/B switch |
| Undo | Cmd/Ctrl + Z | Undo button |

### The first five minutes

The app opens straight into music, not a sign-up or a tour. Research shows the hook is hearing something within seconds (Doodle users composed in a median 25.5 s).

1. **One question:** "I mostly want to... sing my part / understand the harmony / write my own." It sets the starting lens and view, and can be changed any time.
2. **One tap to sound:** the Passion Chorale is loaded; a large Play button doubles as the audio unlock.
3. **Three hints, shown in context, once each:** tap a voice to mute it; tap a pause sign to loop; switch to Explore to see the chords. Each disappears after you do it. No skippable carousel.
4. **A first win in under a minute:** after the first loop, suggest "Mute the alto and sing it yourself" or "Tap the chord at the pause", depending on the answer in step 1.

### Always show the state

What you hear must always match what you see, because sound is invisible:

- Muted voices fade to a dashed outline on the canvas, not just on the chip.
- An active loop shows as a bracket over the phrase, with the repeat count.
- Tempo, temperament and pitch (if not the defaults) show as small tags in the transport, so nobody wonders why it sounds different.
- In Build, "You" or "Bach" is shown large beside the A/B switch, and each voice you have written carries a small pencil mark.

### Loading, empty and error states

| Moment | What the user sees |
| --- | --- |
| Samples still loading | The music is visible and playable at once with the organ fallback; voices switch to choir when ready, with a quiet "Choir voices ready" note |
| Audio blocked by the browser | The Play button reads "Tap to turn on sound"; nothing else needs a tap |
| iPhone on silent | After two seconds of silence: "No sound? Check the silent switch on the side of your iPhone." |
| Offline | Chorales already opened still work; others show "Available when you're back online" |
| Chorale book empty | "Your chorale book is empty. Finish a phrase in Build and it gets its first page." with a button to start one |
| Checker finds nothing wrong | "No voice-leading problems. Now compare with Bach." Silence is not a result. |

### Accessibility

- Target WCAG 2.2 AA. Voice colours tested for contrast on both themes and for colour-blind separation; letters and dash patterns as backup.
- Everything works from the keyboard, including note editing in Build (arrow keys move the selected note).
- Screen readers: the canvas has a text equivalent. Stepping chord by chord announces bar, beat, chord, the four notes and the word sung. During playback announcements pause, to avoid talking over the music.
- Touch targets at least 44 by 44 px; notes have invisible hit areas larger than their drawn size.
- Text sizes follow the system setting; the canvas scales its labels with it.
- Deaf and hard-of-hearing users: Explore and Build are fully usable visually; optional haptic pulse on each beat on phones.

### Usability testing

Run five-person rounds before each phase gate, in person and on the participants' own phones.

| Task | Who | Pass mark |
| --- | --- | --- |
| Open a chorale, mute a voice and loop a phrase | First-time visitors | Under 1 min, no help |
| Find a chorale and loop your own part | Choir singers | 3 taps, under 30 s |
| Explain the cadence at the second pause | Learners | Correct name and can replay it, under 2 min |
| Write a bass line for one phrase and fix one flagged problem | Learners and hobbyists | Under 10 min, says the feedback was clear |
| Tell which version is yours and which is Bach's | Everyone | Never confused by the A/B switch |
| Step through a phrase and name its chords | Screen-reader and keyboard-only users | Completes it without a mouse or sight of the canvas |

Record where people hesitate, not only whether they finish. Any task failed by two or more of five gets fixed before the gate.

### Details we sweat

Small things decide whether this feels like an instrument or a demo. Each is a launch requirement:

- The playhead never moves when you switch lens or view, change tempo, or open a panel.
- Changing tempo or muting mid-play keeps the beat: no restart, no click.
- A phrase loop restarts on its pickup note, with the breath before it, so the loop sounds musical.
- Dragged notes snap to the key; a long-press or Alt allows a chromatic note.
- Undo restores the view as well as the notes.
- Proper music glyphs everywhere: ♭ ♯ ♮ and superscript figures, never "b" and "#".
- Chord labels thin out rather than overlap when zoomed out; numbers use tabular figures.
- German syllables hyphenated as sung; translations aligned phrase by phrase.
- Fermata length defaults to what sounds natural, not a fixed multiple, and can be adjusted.
- Focus is always visible; every voice-colour pair passes contrast in both themes.

## Key screens and flows

There are only two real screens, the library and the workspace; everything else is a panel or sheet on the workspace.

&#91;embedded content: workspace on desktop · Explore lens on, one chord tapped\]

The voice colours run through chips, lines and score alike; the Explore lens adds the key map, chord row and tension gauge around the music.

### Library

- Opens on a short "Start here" shelf: five well-known chorales (the Passion Chorale, "Jesu, meine Freude", "Wachet auf" and two others), each with a 20-second preview on hover or tap.
- Below, the full collection as a searchable list: title, BWV, Riemenschneider number, key, length, difficulty.
- Filters: by key, by mode, by cadence type.
- Search by title, German first line, BWV or Riemenschneider number.

### Workspace

- **Top bar:** chorale title, German first line with translation beneath, lens switcher (Listen / Explore / Build), view toggle (Ribbons / Score).
- **Canvas:** the music, scrolling left to right, playhead fixed at about a third of the width. Fermatas and phrase numbers along the top, words along the bottom.
- **Lens layers:** in Explore, thin bands appear above and below the music: key map above, chord names and Roman numerals below, tension gauge at the foot.
- **Voice strip:** the four voice chips, always visible on the left (desktop) or above the transport (phone).
- **Transport:** play, loop, tempo, verse, and in Build the A/B switch and Check button.
- **Detail panel:** opens when you tap a chord, a note or a feedback marker. Shows what it is, plays it, and offers "Show me another example".

### Main flows

1. **Learn my part:** Library, pick chorale, long-press your voice chip, tap a fermata to loop, slow tempo.
2. **Understand a cadence:** Workspace in Explore, tap the fermata's chord, detail panel names the cadence and plays the two chords alone, then "Hear three more like this" jumps through other chorales.
3. **Harmonise a phrase:** Build lens, hide alto, tenor and bass, write the bass by dragging, press Check, fix flagged spots, A/B against Bach, then add inner voices.

### On a phone

- Portrait shows one phrase at a time, sized to fit; swipe to move between phrases. Landscape shows the scrolling canvas.
- The detail panel becomes a bottom sheet with three heights: peek (chord name), half (explanation), full (examples).
- Build on a phone uses tap-to-select then up / down buttons, because dragging a 7-pixel note with a thumb is not reliable.

## Authentic sound

Recommendation: launch with a sampled choir singing vowels (one sample set per voice), with optional organ and instrumental doubling, then add real recorded choir stems for a small showcase set. The synthesised organ in the prototype is fine for development but will not feel authentic.

| Option | What it sounds like | Effort and cost | Verdict |
| --- | --- | --- | --- |
| Synth organ (prototype) | Clean, electronic | Done; tiny download | Fallback and offline mode only |
| Sampled pipe organ | How many people first meet these chorales | Low; needs a licensed sample set | Offer as a voice option |
| Sampled choir vowels per voice | Four real voice types on "ah" or "oo" | Medium; licensed multisamples, a few MB per voice | **Launch default** |
| Vowel-following choir | Each note sung on the vowel of its actual syllable ("O" on O, "Haupt" on "ow") | Medium-high; morph between vowel samples | Later, if asked |
| Synthesised singing of the words | Full German text sung | High; risk of sounding uncanny | Not planned |
| Recorded choir stems | A real chamber choir, each voice recorded separately | High; a recording session per batch | Not planned unless funded |

### What makes it sound right

- **Fermatas held.** Each pause held about 1.5 to 2 times its written length, with a short breath before the next phrase. User-adjustable, from "strict" to "expressive".
- **Doubling, as in the cantatas.** Bach's choirs were usually doubled by instruments playing the same lines, with continuo underneath. Version 1 offers voices alone or with organ; strings and oboes come later if asked.
- **Tuning and pitch.** Version 1 uses equal temperament at A = 440. Later options: a Baroque well-temperament (Werckmeister III or Vallotti) and Baroque pitch, A = 415. Well-temperament makes the remote keys sound subtly different, which is part of the point.
- **Human timing.** Tiny per-voice timing and level variation, light vibrato on soprano only, slight crescendo into cadences. All switchable off for strict practice.
- **Separation.** Pan the voices slightly (S and T left of centre, A and B right) so a soloed or muted voice is easy to hear in or out, even on a phone speaker.

## Harmony features

Every analysis layer is something you switch on in Explore, and every label is tappable to hear it. Analysis must be read against the local key, not the home key: the prototype showed that labelling everything against one key produces nonsense as soon as the chorale modulates.

| Layer | What it shows | Source | Phase |
| --- | --- | --- | --- |
| Chord names | Letter names (Dm, B♭, A7) on each beat | Computed | 2 |
| Roman numerals + inversions | Function in the local key (ii⁷b, V⁷, Ic) | Computed, hand-checked for the core set | 2 |
| Key map | A coloured band showing each key region and where it modulates | Computed, hand-checked | 2 |
| Cadences | Perfect, imperfect, plagal, interrupted, Phrygian, at every fermata | Computed, hand-checked | 2 |
| Non-chord tones | Passing, neighbour, suspension, anticipation, appoggiatura, marked on the note | Computed, hand-checked | Later |
| Figured bass | The figures above the bass, as a continuo player would read them | Computed | Later |
| Tension gauge | How much the voices clash at each moment (from the prototype) | Computed | 1 |
| Voice-leading check | Parallel fifths and octaves, crossing, spacing, range, unresolved leading notes | Computed live | 3 |

### The chord detail panel

Tapping any chord opens one panel that answers the questions a student actually has:

- What is it? Name, Roman numeral, inversion, figured bass.
- What is it doing? Its function in the phrase ("pre-dominant, leading to the cadence").
- Hear it: the chord alone, spread out as an arpeggio, and with the chord before and after.
- How did the voices get here? Each voice's step into and out of the chord, drawn as arrows.
- Where else (later)? "Bach does this in N other chorales", counted from the corpus: jump to other chorales with the same progression.

### Bach's own rule-breaking

The voice-leading checker runs on Bach's harmonisations too, as an optional layer. Where Bach writes something textbooks forbid, it is shown with a short note on why it works. Students love this, and it teaches that the rules are style, not law.

### Lines, not just chords

Non-classical players say the breakthrough is hearing independent lines (see What people want). Three layers serve that directly:

- **Common tones:** notes held from one chord to the next glow along their length, so you see what stays still while everything else moves.
- **Same tune, other settings (later):** where Bach harmonised one melody several times, open them side by side and switch at the same beat to hear how the bass and inner voices differ.
- **Modal chorales:** labelled with their mode ("Phrygian", "Dorian") and a one-line explanation, instead of a forced major or minor key.

## Build-up learning path

Version 1 ships free build plus one guided exercise: writing a bass line. The full ladder below comes later, if testers want it. Lessons follow the order a chorale is actually harmonised: tune, cadences, bass, chords, inner voices, decoration. Each rung uses a real chorale phrase and ends with hearing your version next to Bach's.

1. **Know the tune.** Hear the melody alone, sing or hum along, spot the phrases and fermatas.
2. **Choose the cadences.** At each fermata, pick from three or four cadence options, each playable. See which Bach chose and why.
3. **Write the bass.** Melody and cadences given; drag bass notes into place. Feedback on contrary motion, range and cadence approach.
4. **Name the chords.** Pick a Roman numeral for each beat from a short list; the app fills in a plain chord so you hear your choice.
5. **Fill the inner voices.** Write alto and tenor with the voice-leading checker live: smooth lines, correct doubling, no parallels.
6. **Decorate.** Add passing notes and suspensions where the texture is static. Compare density with Bach.
7. **The whole chorale.** Melody only; do everything. Checked against the rules and compared with Bach.

### Feedback that teaches

Feedback comes in three tiers, each a different colour and tone:

| Tier | Example | Tone |
| --- | --- | --- |
| Error | "Parallel fifths between tenor and bass here." | Plain, with a Play button that loops the two chords |
| Style | "Bach rarely leaves the leading note unresolved in an outer voice." | Advice, with a link to an example |
| Bach's choice | "Bach used a ii⁷b here, which delays the cadence." | Curiosity, never a mark against you |

Hints come in steps: first the allowed chords, then the bass note, then Bach's answer. Using a hint is never punished.

### Progress, kept tasteful

- Your own chorale book: every chorale you complete becomes a bound page you can replay and share.
- No streaks, lives or points. Progress is the rung you have reached and the chorales in your book.
- No separate teacher mode: teachers project the same screens.

### Later: your tune, and taking it home

- **Your tune, Bach's way:** tap or hum a short melody and hear it harmonised from progressions Bach actually uses, then open it in Build to change it. Always labelled as machine-made. This is the playful front door for people who would never open a lesson.
- **Take it home:** any chord shows as a guitar shape and a piano voicing; any chorale or your own version exports as MIDI or MusicXML for a DAW or notation app, in any key.

## Content and data

The music comes from the music21 corpus, which ships 414 Bach files (mostly four-part chorales in MusicXML), a lookup between BWV and Riemenschneider numbers, and 20 hand-made Roman-numeral analyses of Riemenschneider chorales 1 to 20. Those 20 analyses are a ready-made seed for the hand-checked core set.

### What each chorale carries

| Field | Example | Source |
| --- | --- | --- |
| Notes per voice, repeats written out | 4 voices, 64 beats | MusicXML, processed |
| Words, every verse | "O Haupt voll Blut und Wunden" | MusicXML lyrics |
| English translation | Singable or literal line by line | Public-domain translations or commissioned |
| Identifiers | BWV 244/54, Riemenschneider number | music21 chorale list |
| Source work | St Matthew Passion | Catalogue data |
| Tune name and origin | Hassler, 1601 | Hymnology references |
| Analysis | Keys, chords, cadences, non-chord tones | Computed, plus hand corrections |
| Teaching tags | Difficulty, features ("Phrygian cadence") | Curated |

### The core 30

A hand-checked set of 30 chorales carries all teaching content: verified analysis, lesson phrases, commentary on Bach's choices. Start from the 20 existing analyses and add 10 famous ones. Everything else is labelled "machine analysis" so nobody learns from an unchecked label.

### Licensing

music21's corpus notes say some encodings may carry restrictions on commercial use. Bach's music is public domain, but the encodings are someone's work. Before any paid launch, confirm the licence of the chorale files, or re-encode from a public-domain edition. Translations and audio samples need the same check.

## Technical architecture

A static web app (installable, works offline) fed by a build-time Python pipeline. Heavy analysis of Bach's chorales happens once, at build time; only checking the user's own writing runs in the browser.

&#91;embedded content: architecture · build pipeline, hosting, browser\]

The browser never runs music21: it receives finished analysis as JSON and only checks what the user writes.

| Part | Choice | Why |
| --- | --- | --- |
| Language and UI | TypeScript, React and Vite, with Zustand for state | Widely known, so Claude Code works well in it; the playhead draws on canvas, outside React renders |
| Ribbon view | Canvas 2D, with an SVG layer for labels and hit targets | Hundreds of notes animating smoothly on a mid-range phone |
| Score view | Verovio (compiled to WebAssembly) rendering MusicXML to SVG | Real engraving quality; maps each note back to our note ids |
| Audio | Web Audio API, sampler on an AudioWorklet, notes scheduled ahead | Sample-accurate timing; tempo and mute changes without glitches |
| Samples | Compressed per voice, loaded on first play, cached | A few MB per voice; AAC or MP3 so Safari can decode them |
| Bach analysis | Python pipeline with music21, plus hand-correction files | Done once, checked by people, shipped as JSON |
| User checking | Small TypeScript rules engine in a Web Worker | Instant feedback without shipping Python to the browser |
| Storage | IndexedDB on the device; accounts and sync later | No sign-up needed to start |
| Offline | Service worker caching app, chorale JSON and samples | Works in a practice room with bad signal |

Each chorale's data is about 8 KB of JSON (measured on the prototype), so the whole collection is a few MB before audio.

### Performance budget

- First sound within 2 seconds of tapping Play on a 4G phone (load a small sample set first, the full set in the background).
- Tap-to-sound under 50 ms; playhead at a steady 60 frames per second.
- iOS needs care: Web Audio must be unlocked by a tap, and the silent switch can mute it. Test on real iPhones from day one.

## Milestones

Three phases, each shippable on its own and polished before the next begins. The prototype already built (one chorale, synth organ, ribbons, tension gauge) counts as phase 0.

&#91;embedded content: roadmap · 3 phases and a Later list, not to scale\]

Listen ships first because it is useful to singers on day one and tests the riskiest parts, sound and mobile audio, before any teaching content is written. Everything else waits on the Later list (see Scope) until testing shows people need it.

## Brief for Claude Code

Build one phase per Claude Code session, starting with phase 1. Save the block below as `CLAUDE.md` in an empty repo, then ask Claude Code to plan phase 1 in plan mode before writing code. Write a fresh phase section for each later phase from this doc.

```markdown
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
```

To hand over the prototype, download it from its artifact page and save it as `reference/prototype.html` in the repo.

## Open questions and risks

### Decisions to make

- [ ] Free, paid, or free with a paid teacher tier? This decides how much licensing work is needed before launch.
- [ ] Which sample library for the choir voices, and at what licence cost?
- [ ] Commission a recorded choir for the showcase set, and when?
- [ ] Which chorales do university harmony courses use most, so the core 30 covers them?
- [ ] Web only, or also wrapped as an iPad app for classrooms?
- [ ] Which 10 chorales join the 20 existing analyses to make the core 30?

### Risks

| Risk | Effect | Mitigation |
| --- | --- | --- |
| Automatic analysis is wrong | Students learn wrong labels | Hand-check the core 30; label the rest "machine analysis" |
| Chorale encodings restricted for commercial use | Cannot charge for the app | Confirm licences early; re-encode from a public-domain edition if needed |
| Sampled voices sound artificial | Breaks the "authentic" promise | Test three libraries with singers before choosing |
| iPhone audio quirks | Silence on the most common student device | Real-device testing from the first prototype |
| Build mode on phones is fiddly | Students give up | Tap-and-nudge editing on phones; test with students early |
| Scope creep from too many layers | Slow launch, cluttered screen | Ship Listen first; add a layer only with a lesson that needs it |
