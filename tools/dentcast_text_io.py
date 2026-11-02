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


# ---------------------------------------------------------------------------
# Byte-preserving JSON edits: insert into an existing JSON file without
# re-serialising it. Every existing byte stays; only the inserted text (and,
# for `replace_scalar`, the one scalar) changes. Line endings and indentation
# of the new text follow the container's existing children.

import json as _json
import re as _re

_WS = _re.compile(r"[ \t\r\n]*")
_STR = _re.compile(r'"(?:[^"\\]|\\.)*"', _re.S)
_NUM = _re.compile(r"-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?")


class _Node:
    __slots__ = ("start", "end", "kind", "children", "keys")

    def __init__(self, start, kind):
        self.start, self.kind, self.children, self.keys, self.end = start, kind, [], [], None


def _parse(text, i):
    i = _WS.match(text, i).end()
    c = text[i]
    if c in "{[":
        node = _Node(i, "object" if c == "{" else "array")
        i = _WS.match(text, i + 1).end()
        close = "}" if c == "{" else "]"
        if text[i] == close:
            node.end = i + 1
            return node, i + 1
        while True:
            if node.kind == "object":
                m = _STR.match(text, _WS.match(text, i).end())
                node.keys.append(_json.loads(m.group(0)))
                i = _WS.match(text, m.end()).end()
                assert text[i] == ":"
                i += 1
            child, i = _parse(text, i)
            node.children.append(child)
            i = _WS.match(text, i).end()
            if text[i] == ",":
                i += 1
                continue
            assert text[i] == close, f"bad JSON at {i}"
            node.end = i + 1
            return node, i + 1
    node = _Node(i, "scalar")
    m = _STR.match(text, i) if c == '"' else _NUM.match(text, i)
    if m is None:
        for lit in ("true", "false", "null"):
            if text.startswith(lit, i):
                node.end = i + len(lit)
                return node, node.end
        raise ValueError(f"bad JSON at {i}")
    node.end = m.end()
    return node, node.end


def json_tree(text):
    root, _ = _parse(text, 0)
    return root


def _find(root, path):
    node = root
    for key in path:
        if node.kind == "object":
            node = node.children[node.keys.index(key)]
        else:
            node = node.children[key]
    return node


def _line_start(text, i):
    return text.rfind("\n", 0, i) + 1


def _render(value, indent_unit, base, nl):
    t = _json.dumps(value, ensure_ascii=False, indent=indent_unit)
    return t.replace("\n", nl + base)


def _style(text, node):
    nl = "\r\n" if "\r\n" in text[node.start:node.end] or text[:200].count("\r\n") else "\n"
    if node.children:
        last = node.children[-1]
        ls = _line_start(text, last.start)
        nl = "\r\n" if text[ls - 2:ls] == "\r\n" else "\n"
        base = text[ls:ls + len(text[ls:]) - len(text[ls:].lstrip(" \t"))]
        outer = text[_line_start(text, node.end - 1):node.end - 1]
        unit = len(base) - len(outer) if len(base) > len(outer) else 2
    else:
        outer = text[_line_start(text, node.start):node.start]
        outer = outer[:len(outer) - len(outer.lstrip(" \t"))]
        unit = 2
        base = outer + " " * unit
    return nl, base, unit


def json_append(text, path, value, key=None, after=None):
    """Insert `value` (with `key` for an object) as the last child of the
    container at `path` — or right after child index `after`. Returns the new
    text; asserts the result parses to the expected data and that the old text
    is the new text minus exactly the inserted span."""
    data = _json.loads(text)
    root = json_tree(text)
    node = _find(root, path)
    if node.kind == "object" and key in node.keys:
        raise KeyError(f"{key!r} already present — refusing to overwrite")
    nl, base, unit = _style(text, node)
    body = _render(value, unit, base, nl)
    item = (_json.dumps(key, ensure_ascii=False) + ": " if node.kind == "object" else "") + body
    if node.children:
        anchor = node.children[-1] if after is None else node.children[after]
        ins = "," + nl + base + item
        pos = anchor.end
        if after is not None and after < len(node.children) - 1:
            nxt = node.children[after + 1]
            pos = text.rfind(",", anchor.end, nxt.start) + 1
            ins = nl + base + item + ","
    else:
        outer = base[:len(base) - unit]
        pos = node.start + 1
        ins = nl + base + item + nl + outer
        tail = text[pos:node.end - 1]
        if tail.strip():
            raise ValueError("unexpected content in empty container")
        new = text[:pos] + ins + text[node.end - 1:]
        _check(text, new, data, path, value, key, None)
        return new
    new = text[:pos] + ins + text[pos:]
    _check(text, new, data, path, value, key, after)
    return new


def _check(old, new, data, path, value, key, after):
    target = data
    for k in path:
        target = target[k]
    if isinstance(target, dict):
        target[key] = value
    elif after is None:
        target.append(value)
    else:
        target.insert(after + 1, value)
    if _json.loads(new) != data:
        raise AssertionError("byte-preserving insert did not produce the expected data")
    if isinstance(target, dict) and list(_walk(_json.loads(new), path))[-1] != key:
        raise AssertionError("inserted key is not last")


def _walk(d, path):
    for k in path:
        d = d[k]
    return d


def json_replace_scalar(text, path, value):
    """Replace one scalar (e.g. a counter) in place."""
    data = _json.loads(text)
    node = _find(json_tree(text), path)
    if node.kind != "scalar":
        raise ValueError("not a scalar")
    new = text[:node.start] + _json.dumps(value, ensure_ascii=False) + text[node.end:]
    target = data
    for k in path[:-1]:
        target = target[k]
    target[path[-1]] = value
    if _json.loads(new) != data:
        raise AssertionError("scalar replace mismatch")
    return new


def json_replace_value(text, path, value):
    """Replace one value (a list such as an entry's hashtags) in place, in the
    style of the node it replaces: on one line when it was on one line, else
    one item per line at the node's own indentation and newline. Every other
    byte is kept; the result must parse to the expected data."""
    data = _json.loads(text)
    node = _find(json_tree(text), path)
    old = text[node.start:node.end]
    if "\n" not in old:
        body = _json.dumps(value, ensure_ascii=False)
    else:
        nl = "\r\n" if "\r\n" in old else "\n"
        ls = _line_start(text, node.start)
        outer = text[ls:node.start]
        outer = outer[:len(outer) - len(outer.lstrip(" \t"))]
        inner = _re.search(r"\n([ \t]*)\S", old)
        unit = len(inner.group(1)) - len(outer) if inner and len(inner.group(1)) > len(outer) else 2
        body = _render(value, unit, outer, nl)
    new = text[:node.start] + body + text[node.end:]
    target = data
    for k in path[:-1]:
        target = target[k]
    target[path[-1]] = value
    if _json.loads(new) != data:
        raise AssertionError("value replace mismatch")
    return new


def read_raw(path):
    return Path(path).read_bytes().decode("utf-8")


def write_raw(path, text):
    Path(path).write_bytes(text.encode("utf-8"))
