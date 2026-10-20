"""Preserve an existing text file's line endings; never normalize mixed files."""
from pathlib import Path


def write_text(path, text, encoding="utf-8", **kwargs):
    path = Path(path)
    previous = path.read_bytes() if path.exists() else b""
    crlf = previous.count(b"\r\n")
    if (crlf and previous.count(b"\n") != crlf) or b"\r" in previous.replace(b"\r\n", b""):
        raise ValueError(f"MIXED_LINE_ENDINGS: {path}; use a byte-preserving scoped edit")
    normalized = text.replace("\r\n", "\n")
    if crlf:
        normalized = normalized.replace("\n", "\r\n")
    data = normalized.encode(encoding)
    if data != previous or not path.exists():
        path.write_bytes(data)
