"""Prepare choir samples for the app from the epic-choir pack (CC BY 4.0, derived from VocalSet).

Takes the "ah" vowel at the middle dynamic (mf) for each voice, and for every note:
  - skips the pack's start offset (3528 frames, as in its SFZ files), and records where the
    note reaches full voice so the app can skip the slow swell,
  - folds stereo to mono (the app pans each voice itself),
  - levels the sustain to a common loudness,
  - bakes a crossfade into the end of the sustain so it loops seamlessly (long fermatas
    outlast the recordings),
  - trims shortly after the loop and encodes to AAC, which every browser including Safari decodes.

Writes public/samples/choir/<voice>/ah_<midi>.m4a and public/samples/choir/sample-map.json.

Usage:
  pipeline/.venv/bin/python pipeline/samples.py <path to the unzipped epic-choir "samples" folder>

Needs ffmpeg on PATH. Download the pack from https://github.com/thepok/epic-choir/releases (v1.0).
"""

from __future__ import annotations

import json
import re
import subprocess
import sys
import tempfile
import wave
from pathlib import Path

import numpy as np

from versioning import versioned

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "samples" / "choir"
VOICES = ("S", "A", "T", "B")
NOTE = {"C": 0, "Cs": 1, "D": 2, "Ds": 3, "E": 4, "F": 5, "Fs": 6, "G": 7, "Gs": 8, "A": 9, "As": 10, "B": 11}

START_OFFSET = 3528  # frames, from the pack's SFZ "offset"
LOOP_START = 1.2  # seconds into the trimmed sample: past the attack, well into the sustain
LOOP_END = 4.2  # seconds: before the recordings start to decay
CROSSFADE = 0.35  # seconds
TARGET_RMS = 0.18  # sustain loudness, about -15 dBFS, chosen to sit near the organ fallback
BITRATE = "72k"


def read_wav(path: Path) -> tuple[np.ndarray, int]:
    with wave.open(str(path), "rb") as w:
        rate = w.getframerate()
        ch = w.getnchannels()
        width = w.getsampwidth()
        raw = w.readframes(w.getnframes())
    if width != 2:
        raise ValueError(f"{path.name}: expected 16-bit audio")
    data = np.frombuffer(raw, dtype="<i2").astype(np.float64) / 32768.0
    return data.reshape(-1, ch).mean(axis=1), rate


def loop_ready(x: np.ndarray, rate: int, loop_start: float = LOOP_START, loop_end: float = LOOP_END, crossfade: float = CROSSFADE) -> tuple[np.ndarray, float, float]:
    """Return audio that loops seamlessly between the returned start and end (seconds).

    The last CROSSFADE seconds before the loop end are blended, with equal power, into the
    audio just before the loop start. Jumping from the end back to the start then continues
    exactly the sound that was fading in, so there is no click or bump.
    """
    a = int(loop_start * rate)
    b = int(loop_end * rate)
    n = int(crossfade * rate)
    if b > len(x) or a - n < 0:
        raise ValueError("sample too short to loop")
    y = x[:b].copy()
    t = np.linspace(0, 1, n, endpoint=False)
    fade_out = np.cos(t * np.pi / 2)
    fade_in = np.sin(t * np.pi / 2)
    y[b - n : b] = x[b - n : b] * fade_out + x[a - n : a] * fade_in
    # Carry on past the loop end with what follows the loop start. The encoder blurs the very
    # end of a file; this keeps the join itself in the middle of continuous audio.
    tail = x[a : a + int(0.2 * rate)]
    return np.concatenate([y, tail]), a / rate, b / rate


def voiced_start(y: np.ndarray, rate: int) -> float:
    """Where the note first reaches 70% of its sustain loudness, in seconds.

    The recordings swell in over half a second or more, too slow for a quaver. The app starts
    playback here, with its own short fade-in, so every note speaks at once.
    """
    sustain = float(np.sqrt(np.mean(y[int(LOOP_START * rate) : int(LOOP_END * rate)] ** 2)))
    win = int(0.03 * rate)
    for i in range(0, int(LOOP_START * rate) - win, win):
        if np.sqrt(np.mean(y[i : i + win] ** 2)) >= 0.7 * sustain:
            return max(0.0, (i - win) / rate)
    return 0.0


def level(y: np.ndarray, rate: int, loop_start: float = LOOP_START, loop_end: float = LOOP_END, target: float = TARGET_RMS) -> np.ndarray:
    sustain = y[int(loop_start * rate) : int(loop_end * rate)]
    rms = float(np.sqrt(np.mean(sustain**2)))
    y = y * (target / max(rms, 1e-6))
    peak = float(np.max(np.abs(y)))
    return y * (0.97 / peak) if peak > 0.97 else y


def encode(y: np.ndarray, rate: int, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(suffix=".wav") as tmp:
        with wave.open(tmp.name, "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(rate)
            w.writeframes((np.clip(y, -1, 1) * 32767).astype("<i2").tobytes())
        subprocess.run(
            ["ffmpeg", "-y", "-v", "error", "-i", tmp.name, "-c:a", "aac", "-b:a", BITRATE, "-movflags", "+faststart", str(dest)],
            check=True,
        )


def midi_of(name: str) -> int:
    m = re.search(r"_([A-G]s?)(\d)\.wav$", name)
    if not m:
        raise ValueError(f"cannot read the note from {name}")
    return 12 * (int(m.group(2)) + 1) + NOTE[m.group(1)]


def main(src: Path) -> int:
    voices: dict[str, list[dict]] = {}
    for v in VOICES:
        files = sorted((src / v).glob(f"{v}_ah_mf_*.wav"))
        if not files:
            print(f"no {v}_ah_mf_*.wav files in {src / v}", file=sys.stderr)
            return 1
        entries = []
        for f in files:
            midi = midi_of(f.name)
            x, rate = read_wav(f)
            y, ls, le = loop_ready(x[START_OFFSET:], rate)
            y = level(y, rate)
            start = voiced_start(y, rate)
            rel = f"{v}/ah_{midi}.m4a"
            encode(y, rate, OUT / rel)
            entries.append({"midi": midi, "url": versioned(rel, OUT / rel), "start": round(start, 4), "loopStart": round(ls, 4), "loopEnd": round(le, 4)})
        voices[v] = sorted(entries, key=lambda e: e["midi"])
        print(f"{v}: {len(entries)} notes, {voices[v][0]['midi']}–{voices[v][-1]['midi']}")
    sample_map = {
        "version": 1,
        "name": "Choir",
        # The recordings already carry a simulated hall; add only a touch of the app's room.
        "reverb": 0.08,
        "vowel": "ah",
        "credit": "Choir samples derived from VocalSet (Wilkins, Seetharaman, Wahl, Pardo 2018), CC BY 4.0, https://doi.org/10.5281/zenodo.1442513, via epic-choir by thepok.",
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
