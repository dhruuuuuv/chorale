"""Checks on the generated data. Run build.py first."""

import json
import re
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "public" / "data"
INDEX = json.loads((DATA / "index.json").read_text(encoding="utf-8"))["chorales"]


def load(cid):
    return json.loads((DATA / f"{cid}.json").read_text(encoding="utf-8"))


def test_ships_the_core_30_with_a_start_here_shelf_of_5():
    assert len(INDEX) == 30
    assert len({c["id"] for c in INDEX}) == 30
    shelf = sorted(c["startHere"] for c in INDEX if c["startHere"])
    assert shelf == [1, 2, 3, 4, 5]


@pytest.mark.parametrize("cid", [c["id"] for c in INDEX])
def test_every_chorale_is_well_formed(cid):
    d = load(cid)
    assert set(d["voices"]) == {"S", "A", "T", "B"}
    for notes in d["voices"].values():
        for prev, cur in zip(notes, notes[1:]):
            assert cur[1] >= prev[1]
            assert prev[1] + prev[2] <= cur[1] + 1e-6
        assert all(n[2] > 0 for n in notes)
    assert d["fermatas"], "every chorale has at least one fermata"
    assert all(a < b <= d["lengthBeats"] for a, b in d["fermatas"])
    assert d["firstLine"] and d["translation"]
    assert d["lyrics"] and all(len(ev["verses"]) == d["verseCount"] for ev in d["lyrics"])
    assert d["bars"][0] == 0 and d["bars"] == sorted(d["bars"])
    assert (DATA / "xml" / f"{cid}.musicxml").exists()
    # Music glyphs, never ASCII stand-ins
    for notes in d["voices"].values():
        assert not any("-" in n[3] or "#" in n[3] for n in notes)
    # Chord slices tile the whole chorale with no gaps
    end = 0
    for c in d["chords"]:
        assert c["beat"] == pytest.approx(end)
        end = c["beat"] + c["dur"]
    assert end == pytest.approx(d["lengthBeats"])


def test_passion_chorale_matches_the_prototype():
    proto = (ROOT / "reference" / "prototype.html").read_text(encoding="utf-8")
    p = json.loads(re.search(r"const D=(\{.*?\});\n", proto).group(1))
    d = load("bwv244.54")
    for i, v in enumerate("SATB"):
        assert [n[:3] for n in p["v"][i]] == [n[:3] for n in d["voices"][v]]
    assert [tuple(c) for c in p["ch"]] == [(c["beat"], c["dur"], c["name"], c["clash"]) for c in d["chords"]]
    assert d["lengthBeats"] == p["len"]
    assert d["pickupBeats"] == 1


def test_repeated_section_takes_the_second_lyric_line_on_the_second_pass():
    d = load("bwv244.54")
    words = {ev["beat"]: ev["verses"][0]["text"] for ev in d["lyrics"]}
    assert words[0.0] == "O" and words[1.0] == "Haupt"
    assert words[17.0] == "Haupt,"  # second pass: "O Haupt, zu Spott gebunden"
    assert words[19.0] == "Spott"


def test_multi_verse_chorale_keeps_every_verse():
    d = load("bwv267")
    assert d["verseCount"] == 2
    assert d["lyrics"][0]["verses"][0]["text"] == "An"
    assert d["lyrics"][0]["verses"][1]["text"] == "Ein"


@pytest.mark.parametrize("cid", [c["id"] for c in INDEX])
def test_every_fermata_covers_exactly_its_held_note(cid):
    # A fermata on either half of a tied note must hold the whole note, not stop at the barline.
    d = load(cid)
    soprano = {(n[1], round(n[1] + n[2], 4)) for n in d["voices"]["S"]}
    for a, b in d["fermatas"]:
        assert (a, b) in soprano, f"fermata {a}–{b} does not match a soprano note"


@pytest.mark.parametrize("cid", [c["id"] for c in INDEX])
def test_score_url_carries_a_content_version(cid):
    d = load(cid)
    path, _, version = d["xml"].partition("?v=")
    assert (DATA / path).exists() and len(version) == 10
