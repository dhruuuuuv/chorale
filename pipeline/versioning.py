"""Content-hashed URLs for files the app caches without expiry."""

from __future__ import annotations

import hashlib
from pathlib import Path


def versioned(rel: str, path: Path) -> str:
    """`rel` with a short hash of the file's bytes, e.g. "S/60.m4a?v=3f2a91c0".

    The service worker caches scores and samples by URL, forever. When a file is rebuilt its
    hash changes, so returning visitors fetch the new file instead of reusing the old one.
    """
    digest = hashlib.sha256(path.read_bytes()).hexdigest()[:10]
    return f"{rel}?v={digest}"
