"""Chord naming and clash scoring for a vertical slice of the four voices.

Both work on pitch classes only, so they are independent of music21 and easy to test.
"""

from __future__ import annotations

# Clash weight per interval class (the smaller distance between two pitch classes).
# Semitone / major seventh = 3, tone / minor seventh = 1.5, tritone = 2, everything else 0.
CLASH_WEIGHTS = {1: 3.0, 2: 1.5, 6: 2.0}

# Interval sets above the root (as pitch classes) and the suffix printed after the root.
# Only complete chords are named: an incomplete set in a short slice is usually a passing
# sonority, and naming it would teach the wrong thing.
CHORD_TEMPLATES: list[tuple[frozenset[int], str]] = [
    (frozenset({0, 4, 7}), ""),
    (frozenset({0, 3, 7}), "m"),
    (frozenset({0, 3, 6}), "°"),
    (frozenset({0, 4, 8}), "+"),
    (frozenset({0, 4, 7, 10}), "7"),
    (frozenset({0, 3, 7, 10}), "m7"),
    (frozenset({0, 4, 7, 11}), "maj7"),
    (frozenset({0, 3, 6, 10}), "ø7"),
    (frozenset({0, 3, 6, 9}), "°7"),
]


def clash(pitch_classes: set[int]) -> float:
    """Sum the clash weight over every pair of distinct pitch classes sounding together."""
    pcs = sorted(pitch_classes)
    total = 0.0
    for i, a in enumerate(pcs):
        for b in pcs[i + 1:]:
            d = (b - a) % 12
            total += CLASH_WEIGHTS.get(min(d, 12 - d), 0.0)
    return total


def chord_name(notes: list[tuple[int, str]]) -> str:
    """Name a slice from (midi, spelled pitch name) pairs, e.g. [(62, 'D4'), (65, 'F4'), ...] -> 'Dm'.

    Returns '' when the slice is not a recognisable triad or seventh (a passing sonority).
    The root keeps the spelling it has in the score, so B♭ stays B♭ rather than A♯.
    """
    if not notes:
        return ""
    pcs = {m % 12 for m, _ in notes}
    if len(pcs) < 3:
        return ""
    spelled = {m % 12: _strip_octave(name) for m, name in sorted(notes)}
    # Prefer the bass as root when it fits, so that inversions of ambiguous sets
    # (for example the diminished seventh) take the most plausible name.
    bass_pc = min(notes)[0] % 12
    candidates = [bass_pc] + sorted(pcs - {bass_pc})
    for root in candidates:
        shape = frozenset((pc - root) % 12 for pc in pcs)
        for template, suffix in CHORD_TEMPLATES:
            if shape == template:
                return spelled[root] + suffix
    return ""


def _strip_octave(name: str) -> str:
    return name.rstrip("0123456789")
