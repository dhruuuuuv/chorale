from harmony import chord_name, clash


def test_clash_weights_match_the_prototype():
    # D F A C: one whole tone (C-D)
    assert clash({2, 5, 9, 0}) == 1.5
    # E G B-flat D: whole tone (D-E) and tritone (E-B-flat)
    assert clash({4, 7, 10, 2}) == 3.5
    # Semitone and major seventh count as the same interval class
    assert clash({0, 1}) == 3.0
    assert clash({0, 11}) == 3.0
    # Plain triads do not clash
    assert clash({0, 4, 7}) == 0.0
    assert clash(set()) == 0.0


def test_names_triads_in_any_inversion():
    assert chord_name([(50, "D3"), (62, "D4"), (65, "F4"), (69, "A4")]) == "Dm"
    assert chord_name([(53, "F3"), (62, "D4"), (69, "A4"), (74, "D5")]) == "Dm"
    assert chord_name([(46, "B-2"), (65, "F4"), (62, "D4"), (70, "B-4")]) == "B-"


def test_names_sevenths_and_keeps_spelling():
    assert chord_name([(45, "A2"), (61, "C#4"), (67, "G4"), (76, "E5")]) == "A7"
    assert chord_name([(58, "B-3"), (64, "E4"), (67, "G4"), (74, "D5")]) == "Eø7"
    assert chord_name([(48, "C3"), (64, "E4"), (67, "G4"), (71, "B4")]) == "Cmaj7"


def test_leaves_passing_sonorities_blank():
    # Two pitch classes, or an incomplete seventh, are not named
    assert chord_name([(50, "D3"), (62, "D4"), (69, "A4"), (74, "D5")]) == ""
    assert chord_name([(48, "C3"), (64, "E4"), (70, "B-4"), (72, "C5")]) == ""
    assert chord_name([]) == ""
