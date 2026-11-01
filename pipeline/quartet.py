"""Build the solo quartet: one real singer per part, from the Choral Singing Dataset.

The dataset (Cuesta, Gómez, Martorell, Loáiciga 2018, CC BY 4.0) has each of 16 singers of
the Anton Bruckner Choir, Barcelona, on their own close microphone, singing three a cappella
pieces. Real repertoire covers far more pitches per singer than exercise datasets do.

For each part this script:
  1. pitch-tracks every singer's three tracks and finds notes held steadily,
  2. picks the one singer who covers the part's range best, with the steadiest intonation,
  3. for each pitch that singer holds, keeps the best note: long, steady, on an open vowel,
  4. trims the consonants off both ends, levels it, bakes a seamless loop, encodes AAC,
  5. records how far the singer was from the exact pitch, so the app can centre it while
     keeping the natural movement within the note.

Writes public/samples/quartet/<voice>/<midi>.m4a and public/samples/quartet/sample-map.json.

Usage:
  pipeline/.venv/bin/python pipeline/quartet.py <path to the unzipped ChoralSingingDataset folder>

Needs ffmpeg on PATH. Download: https://zenodo.org/records/1286570
"""

from __future__ import annotations

import json
import re
import sys
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path

import librosa
import numpy as np

from samples import encode, level, loop_ready
from versioning import versioned

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "samples" / "quartet"

PART_NAMES = {"soprano": "S", "contraalt": "A", "tenor": "T", "bajos": "B"}
# The pitches the core 30 chorales ask of each part (from public/data), plus a little margin.
RANGES = {"S": (59, 81), "A": (53, 75), "T": (48, 70), "B": (36, 64)}

ANALYSIS_RATE = 22050
HOP = 256
MIN_HOLD = 0.7  # seconds a pitch must be held to be considered
TRIM = 0.09  # seconds trimmed from each end, where consonants and glides live
TARGET_RMS = 0.16
MAX_SHIFT = 2  # semitones; a solo voice moved further than this stops sounding like itself


@dataclass
class Note:
    singer: str
    path: Path
    start: float
    dur: float
    midi: int
    cents: float  # median distance from the exact pitch
    wobble: float  # spread of the pitch within the note, in cents
    openness: float  # share of energy in the first-formant region of "ah"

    @property
    def score(self) -> float:
        # Longer, steadier, more open notes win; a held note of 2 s or more is plenty.
        return min(self.dur, 2.5) * 1.0 - self.wobble / 40 - abs(self.cents) / 60 + self.openness * 1.5


def singer_of(path: Path) -> tuple[str, str]:
    name = path.stem.lower()
    m = re.search(r"(soprano|contraalt|bajos|tenor)_?(\d)", name)
    if not m:
        raise ValueError(f"cannot tell the part and singer from {path.name}")
    return PART_NAMES[m.group(1)], m.group(2)


def held_notes(path: Path, singer: str) -> list[Note]:
    y, sr = librosa.load(str(path), sr=ANALYSIS_RATE, mono=True)
    f0, voiced, _ = librosa.pyin(y, fmin=60, fmax=1050, sr=sr, frame_length=2048, hop_length=HOP)
    midi = librosa.hz_to_midi(f0)
    spec = np.abs(librosa.stft(y, n_fft=2048, hop_length=HOP))
    freqs = librosa.fft_frequencies(sr=sr, n_fft=2048)
    f1_band = (freqs >= 550) & (freqs <= 1300)
    voice_band = (freqs >= 150) & (freqs <= 3500)
    hop_s = HOP / sr
    notes: list[Note] = []
    i, n = 0, len(midi)
    while i < n:
        if not voiced[i] or np.isnan(midi[i]):
            i += 1
            continue
        ref = float(np.round(np.nanmedian(midi[i : i + 8])))
        j = i
        while j < n and voiced[j] and not np.isnan(midi[j]) and abs(midi[j] - ref) < 0.5:
            j += 1
        dur = (j - i) * hop_s
        if dur >= MIN_HOLD:
            seg = midi[i:j]
            e = spec[:, i:j]
            openness = float(e[f1_band].sum() / max(e[voice_band].sum(), 1e-9))
            notes.append(
                Note(
                    singer=singer,
                    path=path,
                    start=i * hop_s,
                    dur=dur,
                    midi=int(ref),
                    cents=float((np.median(seg) - ref) * 100),
                    wobble=float(np.std(seg) * 100),
                    openness=openness,
                )
            )
        i = max(j, i + 1)
    return notes


def coverage(pitches: set[int], lo: int, hi: int) -> int:
    """How many pitches in the range a singer reaches within MAX_SHIFT of a held note."""
    return sum(1 for m in range(lo, hi + 1) if any(abs(m - p) <= MAX_SHIFT for p in pitches))


def choose_singer(part: str, notes: list[Note]) -> str:
    lo, hi = RANGES[part]
    by_singer: dict[str, list[Note]] = defaultdict(list)
    for nt in notes:
        by_singer[nt.singer].append(nt)

    def rank(s: str) -> tuple[float, float]:
        ns = [n for n in by_singer[s] if n.dur >= 1.0]
        cover = coverage({n.midi for n in ns}, lo, hi)
        steadiness = -float(np.mean([abs(n.cents) + n.wobble for n in ns])) if ns else -999
        return (cover, steadiness)

    for s in sorted(by_singer):
        c, st = rank(s)
        print(f"  {part} singer {s}: covers {c} of {hi - lo + 1} pitches, unsteadiness {-st:.0f} cents")
    return max(by_singer, key=rank)


def build_note(nt: Note, dest: Path) -> dict:
    y, sr = librosa.load(str(nt.path), sr=None, mono=True, offset=nt.start + TRIM, duration=max(0.3, nt.dur - 2 * TRIM))
    length = len(y) / sr
    # Loop as much of the note as possible, leaving room for the crossfade at the front.
    loop_end = length - 0.22
    crossfade = min(0.3, max(0.08, (loop_end - 0.15) * 0.35))
    loop_start = max(crossfade + 0.02, min(0.5, loop_end * 0.35))
    looped, ls, le = loop_ready(y, sr, loop_start, loop_end, crossfade)
    looped = level(looped, sr, ls, le, TARGET_RMS)
    # A short fade at the very start removes any click from cutting mid-note.
    fade = int(0.006 * sr)
    looped[:fade] *= np.linspace(0, 1, fade)
    encode(looped, sr, dest)
    return {"midi": nt.midi, "cents": round(nt.cents, 1), "start": 0, "loopStart": round(ls, 4), "loopEnd": round(le, 4)}


def main(src: Path) -> int:
    files = sorted(src.rglob("*.wav"))
    files = [f for f in files if not f.name.startswith("._")]
    if not files:
        print(f"no recordings found under {src}", file=sys.stderr)
        return 1
    notes_by_part: dict[str, list[Note]] = defaultdict(list)
    for f in files:
        part, singer = singer_of(f)
        notes_by_part[part].extend(held_notes(f, singer))
        print(f"analysed {f.name}")

    voices: dict[str, list[dict]] = {}
    chosen: dict[str, str] = {}
    for part in ("S", "A", "T", "B"):
        singer = choose_singer(part, notes_by_part[part])
        chosen[part] = singer
        lo, hi = RANGES[part]
        best: dict[int, Note] = {}
        for nt in notes_by_part[part]:
            if nt.singer != singer or not lo - MAX_SHIFT <= nt.midi <= hi + MAX_SHIFT:
                continue
            if nt.midi not in best or nt.score > best[nt.midi].score:
                best[nt.midi] = nt
        entries = []
        for midi in sorted(best):
            rel = f"{part}/{midi}.m4a"
            e = build_note(best[midi], OUT / rel)
            entries.append({"url": versioned(rel, OUT / rel), **e})
        voices[part] = entries
        gaps = [m for m in range(lo, hi + 1) if not any(abs(m - b) <= MAX_SHIFT for b in best)]
        print(f"{part}: singer {singer}, {len(entries)} notes {min(best)}–{max(best)}" + (f", out of reach: {gaps}" if gaps else ""))

    sample_map = {
        "version": 1,
        "name": "Quartet",
        # Close-microphone recordings: the app's room puts the four singers in one space.
        "reverb": 0.3,
        "credit": "Quartet voices from the Choral Singing Dataset (Cuesta, Gómez, Martorell, Loáiciga 2018), sung by the Anton Bruckner Choir, Barcelona, CC BY 4.0, https://doi.org/10.5281/zenodo.1286570.",
        "singers": chosen,
        "voices": voices,
    }
    (OUT / "sample-map.json").write_text(json.dumps(sample_map, indent=1) + "\n", encoding="utf-8")
    total = sum(p.stat().st_size for p in OUT.rglob("*.m4a"))
    print(f"wrote sample-map.json, {total / 1e6:.2f} MB of audio")
    return 0


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(__doc__, file=sys.stderr)
        sys.exit(2)
    sys.exit(main(Path(sys.argv[1])))
