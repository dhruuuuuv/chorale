"""Build the chorale data shipped with the app.

Reads the chorales listed in core30.txt from the music21 corpus, expands repeats, and writes:

  public/data/<id>.json       notes, lyrics (every verse), fermatas, chords and clash
  public/data/xml/<id>.musicxml  the expanded chorale on two staves, for the score view
  public/data/index.json      one entry per chorale for the library

Run with:  pipeline/.venv/bin/python pipeline/build.py
Never hand-edit the output; change this script or core30.txt and rebuild.
"""

from __future__ import annotations

import copy
import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path

from music21 import (
    bar,
    spanner,
    clef,
    converter,
    corpus,
    expressions,
    key as m21key,
    layout,
    meter,
    note as m21note,
    repeat,
    stream,
)

from harmony import chord_name, clash
from versioning import versioned

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "data"
CORE = Path(__file__).resolve().parent / "core30.txt"
VOICES = ("S", "A", "T", "B")
EPS = 1e-6


class ValidationError(Exception):
    pass


@dataclass
class Entry:
    corpus_id: str
    riemenschneider: int
    title: str
    translation: str
    source: str
    start_here: int | None

    @property
    def id(self) -> str:
        return "bwv" + self.corpus_id

    @property
    def bwv(self) -> str:
        # Corpus ids like "248.12-2" carry an edition suffix that is not part of the BWV number.
        return self.corpus_id.split("-")[0]


def read_core() -> list[Entry]:
    entries = []
    for raw in CORE.read_text(encoding="utf-8").splitlines():
        if not raw.strip() or raw.startswith("#"):
            continue
        cols = raw.split("\t")
        if len(cols) < 5:
            raise ValidationError(f"core30.txt: expected at least 5 columns: {raw!r}")
        start = cols[5].strip() if len(cols) > 5 else ""
        entries.append(Entry(cols[0], int(cols[1]), cols[2], cols[3], cols[4], int(start) if start else None))
    return entries


def pretty_pitch(name: str) -> str:
    """'B-4' -> 'B♭4', 'F#4' -> 'F♯4'."""
    return name.replace("--", "𝄫").replace("##", "𝄪").replace("-", "♭").replace("#", "♯")


def pretty_key(k: m21key.Key) -> str:
    return f"{pretty_pitch(k.tonic.name)} {k.mode}"


# --- Repeats ---------------------------------------------------------------------------------


def expand_part(part: stream.Part) -> list[tuple[stream.Measure, int, bool]]:
    """Return the measures of a part in performance order.

    Each item is (measure, pass index, inside a repeated section). The pass index lets us pick
    the right lyric line: in these files a repeated section carries one lyric line per pass.
    """
    if not _has_repeats(part):
        measures = list(part.getElementsByClass(stream.Measure))
    elif (expander := repeat.Expander(part)).isExpandable():
        measures = list(expander.process().getElementsByClass(stream.Measure))
    else:
        raise ValidationError("repeats cannot be expanded")
    counts: dict[int, int] = {}
    totals: dict[int, int] = {}
    for m in measures:
        totals[m.number] = totals.get(m.number, 0) + 1
    out = []
    for m in measures:
        n = counts.get(m.number, 0)
        counts[m.number] = n + 1
        out.append((m, n, totals[m.number] > 1))
    return out


def _has_repeats(part: stream.Part) -> bool:
    return any(isinstance(b, bar.Repeat) for m in part.getElementsByClass(stream.Measure) for b in (m.leftBarline, m.rightBarline)) or bool(
        part.recurse().getElementsByClass(spanner.RepeatBracket)
    )


# --- Extraction ------------------------------------------------------------------------------


def bar_groups(measures: list[stream.Measure], bar_len: float) -> list[list[int]]:
    """Group expanded measures into notated bars.

    Writing out a repeat leaves the end of the section (say 3 beats) next to the repeated
    pickup (1 beat). Together they make one full bar, so they are joined into one.
    """
    groups: list[list[int]] = []
    total = 0.0
    for i, m in enumerate(measures):
        dur = float(m.duration.quarterLength)
        if groups and i > 1 and total < bar_len - EPS and total + dur <= bar_len + EPS:
            groups[-1].append(i)
            total += dur
        else:
            groups.append([i])
            total = dur
    return groups


def find_vocal_parts(score: stream.Score) -> list[stream.Part]:
    names = [(p.partName or "").lower() for p in score.parts]
    wanted = ("soprano", "alto", "tenor", "bass")
    parts = []
    for w in wanted:
        matches = [p for p, n in zip(score.parts, names) if n.startswith(w)]
        if len(matches) != 1:
            raise ValidationError(f"expected exactly one {w} part, found {len(matches)} in {names}")
        parts.append(matches[0])
    return parts


def has_fermata(n: m21note.GeneralNote) -> bool:
    return any(isinstance(e, expressions.Fermata) for e in n.expressions)


def extract(entry: Entry) -> tuple[dict, stream.Score]:
    score = corpus.parse("bach/bwv" + entry.corpus_id)
    parts = find_vocal_parts(score)

    first_measures = list(parts[0].getElementsByClass(stream.Measure))
    ts = first_measures[0].getContextByClass(meter.TimeSignature) or parts[0].recurse().getElementsByClass(meter.TimeSignature).first()
    if ts is None:
        raise ValidationError("no time signature")
    bar_len = ts.barDuration.quarterLength
    pickup = first_measures[0].duration.quarterLength
    pickup = 0.0 if abs(pickup - bar_len) < EPS else float(pickup)

    expanded = [expand_part(p) for p in parts]
    layout_counts = {len(e) for e in expanded}
    if len(layout_counts) != 1:
        raise ValidationError("voices expand to different numbers of measures")

    repeated = any(inside for _, _, inside in expanded[0])
    groups = bar_groups([m for m, _, _ in expanded[0]], bar_len)
    group_starts = {g[0] for g in groups}
    voices: dict[str, list[list]] = {}
    fermatas: list[list[float]] = []
    lyric_events: dict[float, dict[int, dict]] = {}
    bars: list[float] = []

    for vi, (vname, measures) in enumerate(zip(VOICES, expanded)):
        notes: list[list] = []
        offset = 0.0
        for mi, (m, pass_index, inside) in enumerate(measures):
            if vi == 0 and mi in group_starts:
                bars.append(round(offset, 4))
            for n in m.flatten().notesAndRests:
                start = round(offset + float(n.offset), 4)
                dur = round(float(n.duration.quarterLength), 4)
                if dur <= 0:
                    continue  # grace notes have no written length
                if n.isRest:
                    continue
                if n.isChord:
                    raise ValidationError(f"{vname}: chord found in a single voice at beat {start}")
                # A note tied over the barline continues the previous one.
                if n.tie is not None and n.tie.type in ("stop", "continue") and notes:
                    prev = notes[-1]
                    if prev[0] == n.pitch.midi and abs(prev[1] + prev[2] - start) < EPS:
                        prev[2] = round(prev[2] + dur, 4)
                        if vi == 0:
                            # A fermata on either half of a tied note holds the whole note.
                            if fermatas and abs(fermatas[-1][1] - start) < EPS:
                                fermatas[-1][1] = round(start + dur, 4)
                            elif has_fermata(n):
                                fermatas.append([prev[1], round(start + dur, 4)])
                        continue
                notes.append([n.pitch.midi, start, dur, pretty_pitch(n.pitch.nameWithOctave)])
                if vi == 0:
                    if has_fermata(n):
                        fermatas.append([start, round(start + dur, 4)])
                    for ly in n.lyrics:
                        lyric_events.setdefault(start, {})[ly.number] = {
                            "text": ly.text or "",
                            "syllabic": ly.syllabic or "single",
                            "pass": pass_index,
                            "inside": inside,
                        }
            offset += float(m.duration.quarterLength)
        voices[vname] = notes

    # Some encodings number their lyric lines from 2; renumber so that lines run 1, 2, 3...
    numbers = sorted({n for lines in lyric_events.values() for n in lines})
    renumber = {old: i + 1 for i, old in enumerate(numbers)}
    lyric_events = {beat: {renumber[n]: ly for n, ly in lines.items()} for beat, lines in lyric_events.items()}
    max_lyric = len(numbers)

    length = round(max(n[1] + n[2] for v in voices.values() for n in v), 4)
    verse_count = max(1, max_lyric // 2 if repeated else max_lyric)
    lyrics = build_lyrics(lyric_events, repeated, verse_count)
    if not lyrics:
        raise ValidationError("no lyrics")

    data = {
        "id": entry.id,
        "bwv": entry.bwv,
        "riemenschneider": entry.riemenschneider,
        "title": entry.title,
        "firstLine": first_line(lyrics, fermatas),
        "translation": entry.translation,
        "source": entry.source,
        "key": chorale_key(score, entry),
        "timeSig": ts.ratioString,
        "pickupBeats": pickup,
        "lengthBeats": length,
        "bars": bars,
        "fermatas": fermatas,
        "verseCount": verse_count,
        "voices": voices,
        "lyrics": lyrics,
        "chords": build_chords(voices, length),
    }
    validate(data)
    return data, two_stave_score(expanded, groups, ts, score)


def build_lyrics(events: dict[float, dict[int, dict]], repeated: bool, verse_count: int) -> list[dict]:
    """Turn lyric lines into one entry per sung beat, with every verse in order.

    In a repeated section, verse v on pass p sits on lyric line 2v + p + 1.
    Outside it, verse v sits on line v + 1.
    """
    out = []
    for beat in sorted(events):
        lines = events[beat]
        sample = next(iter(lines.values()))
        verses = []
        for v in range(verse_count):
            if repeated and sample["inside"]:
                number = 2 * v + sample["pass"] + 1
            else:
                number = v + 1
            ly = lines.get(number)
            verses.append({"text": clean_text(ly["text"]), "syllabic": ly["syllabic"]} if ly else {"text": "", "syllabic": "single"})
        if any(v["text"] for v in verses):
            out.append({"beat": beat, "verses": verses})
    return out


def clean_text(text: str) -> str:
    # Some encodings number the verses ("1. An"); the app shows the verse picker instead.
    return re.sub(r"^\d+\.\s*", "", text).strip()


def first_line(lyrics: list[dict], fermatas: list[list[float]]) -> str:
    end = fermatas[0][0] if fermatas else float("inf")
    words = ""
    for ev in lyrics:
        if ev["beat"] > end + EPS:
            break
        syl = ev["verses"][0]
        words += syl["text"]
        if syl["syllabic"] in ("single", "end"):
            words += " "
    return words.strip().rstrip(",;:")


def chorale_key(score: stream.Score, entry: Entry) -> str:
    """Opening key: from the hand-made analysis where one exists, otherwise estimated."""
    if entry.riemenschneider <= 20:
        path = corpus.getWork(f"bach/choraleAnalyses/riemenschneider{entry.riemenschneider:03d}.rntxt")
        m = re.search(r"\b([A-Ga-g][#b-]?):", Path(path).read_text(encoding="utf-8"))
        if m:
            tonic = m.group(1)
            mode = "major" if tonic[0].isupper() else "minor"
            return pretty_key(m21key.Key(tonic[0].upper() + tonic[1:].replace("b", "-"), mode))
    return pretty_key(score.analyze("key"))


def build_chords(voices: dict[str, list[list]], length: float) -> list[dict]:
    """One slice per change in any voice, as in the prototype."""
    onsets = sorted({n[1] for v in voices.values() for n in v} | {length})
    out = []
    for a, b in zip(onsets, onsets[1:]):
        sounding = []
        for v in voices.values():
            for n in v:
                if n[1] <= a + EPS and n[1] + n[2] > a + EPS:
                    sounding.append((n[0], n[3].replace("♭", "-").replace("♯", "#")))
                    break
        pcs = {m % 12 for m, _ in sounding}
        name = pretty_pitch(chord_name(sounding)) if sounding else ""
        out.append({"beat": a, "dur": round(b - a, 4), "name": name, "clash": clash(pcs)})
    return out


def validate(data: dict) -> None:
    if set(data["voices"]) != set(VOICES):
        raise ValidationError("must have exactly four voices")
    for v, notes in data["voices"].items():
        if not notes:
            raise ValidationError(f"{v}: no notes")
        for prev, cur in zip(notes, notes[1:]):
            if cur[1] < prev[1] - EPS:
                raise ValidationError(f"{v}: beats not ascending at {cur[1]}")
            if prev[1] + prev[2] > cur[1] + EPS:
                raise ValidationError(f"{v}: overlapping notes at {cur[1]}")
    if not data["fermatas"]:
        raise ValidationError("no fermatas")
    beats = [c["beat"] for c in data["chords"]]
    if beats != sorted(beats):
        raise ValidationError("chords not ascending")


# --- Score view ------------------------------------------------------------------------------


def two_stave_score(expanded, groups: list[list[int]], ts: meter.TimeSignature, original: stream.Score) -> stream.Score:
    """Rebuild the expanded chorale as SATB on two staves: S/A on treble, T/B on bass."""
    out = stream.Score()
    ks = original.recurse().getElementsByClass(m21key.KeySignature).first()
    bar_len = ts.barDuration.quarterLength
    for staff_index, (upper, lower, cl) in enumerate(((0, 1, clef.TrebleClef()), (2, 3, clef.BassClef()))):
        p = stream.Part()
        # No staff labels: the voice colours and the chips name the voices.
        p.partName = ""
        for gi, group in enumerate(groups):
            m = stream.Measure(number=gi + 1)
            if gi == 0:
                m.insert(0, cl)
                if ks is not None:
                    m.insert(0, copy.deepcopy(ks))
                m.insert(0, copy.deepcopy(ts))
            length = 0.0
            for layer, vi in enumerate((upper, lower)):
                voice = stream.Voice(id=str(layer + 1))
                at = 0.0
                for mi in group:
                    src = expanded[vi][mi][0]
                    for n in src.flatten().notesAndRests:
                        c = copy.deepcopy(n)
                        c.lyrics = []
                        c.stemDirection = "up" if layer == 0 else "down"
                        if layer == 1:
                            # One fermata per staff, over the upper voice.
                            c.expressions = [e for e in c.expressions if not isinstance(e, expressions.Fermata)]
                        voice.insert(at + float(n.offset), c)
                    at += float(src.duration.quarterLength)
                length = at
                m.insert(0, voice)
            if gi == 0 and length < bar_len - EPS:
                m.paddingLeft = bar_len - length
            p.append(m)
        out.insert(0, p)
    out.insert(0, layout.StaffGroup(list(out.parts), symbol="brace", barTogether=True))
    return out


# --- Main ------------------------------------------------------------------------------------


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "xml").mkdir(exist_ok=True)
    index = []
    failures = []
    for entry in read_core():
        try:
            data, two = extract(entry)
        except ValidationError as e:
            failures.append(f"{entry.id}: {e}")
            continue
        xml_path = OUT / "xml" / f"{entry.id}.musicxml"
        two.write("musicxml", fp=str(xml_path))
        # The app caches scores forever; a content hash in the URL fetches a rebuilt one.
        data["xml"] = versioned(f"xml/{entry.id}.musicxml", xml_path)
        (OUT / f"{entry.id}.json").write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        index.append({
            "id": data["id"],
            "bwv": data["bwv"],
            "riemenschneider": data["riemenschneider"],
            "title": data["title"],
            "firstLine": data["firstLine"],
            "translation": data["translation"],
            "source": data["source"],
            "key": data["key"],
            "timeSig": data["timeSig"],
            "lengthBeats": data["lengthBeats"],
            "phrases": len(data["fermatas"]),
            "startHere": entry.start_here,
        })
        print(f"ok  {entry.id:<14} {data['key']:<10} {data['lengthBeats']:>6} beats  {data['firstLine']}")
    if failures:
        print("\n".join("FAIL " + f for f in failures), file=sys.stderr)
        return 1
    (OUT / "index.json").write_text(json.dumps({"chorales": index}, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"wrote {len(index)} chorales")
    return 0


if __name__ == "__main__":
    sys.exit(main())
