#!/usr/bin/env python3
"""
Value-preserving px -> rem conversion for VISUAL SIZE properties only.

Base font is the browser default (no html{font-size} override anywhere in the
repo), so 1rem == 16px exactly. Converting `Npx` -> `(N/16)rem` therefore leaves
the rendered size pixel-identical at default zoom, while making it relative.

Scope (user choice): font-size, line-height, width/height (+min/max),
padding*, margin*, gap*, top/right/bottom/left, inset*, border-radius*.

Explicitly NOT touched: border / border-width, box-shadow, outline, text-shadow,
letter-spacing, and @media breakpoint conditions (those stay in px).
"""
import os, re, sys

BASE = 16.0

# Visual-size properties only. Longer names first so e.g. `padding-top`
# is preferred over `padding` (the trailing `:` requirement also disambiguates).
PROPS = [
    "font-size", "line-height",
    "min-width", "max-width", "min-height", "max-height", "width", "height",
    "padding-block-start", "padding-block-end", "padding-inline-start",
    "padding-inline-end", "padding-block", "padding-inline",
    "padding-top", "padding-right", "padding-bottom", "padding-left", "padding",
    "margin-block-start", "margin-block-end", "margin-inline-start",
    "margin-inline-end", "margin-block", "margin-inline",
    "margin-top", "margin-right", "margin-bottom", "margin-left", "margin",
    "grid-row-gap", "grid-column-gap", "grid-gap", "row-gap", "column-gap", "gap",
    "inset-block-start", "inset-block-end", "inset-inline-start",
    "inset-inline-end", "inset-block", "inset-inline", "inset",
    "top", "right", "bottom", "left",
    "border-top-left-radius", "border-top-right-radius",
    "border-bottom-left-radius", "border-bottom-right-radius",
    "border-start-start-radius", "border-start-end-radius",
    "border-end-start-radius", "border-end-end-radius", "border-radius",
]
PROPS.sort(key=len, reverse=True)

# Property must NOT be preceded by - / word char / "(" .
# The "(" guard excludes @media (max-width:...) feature conditions.
# The value class excludes newlines so an unterminated declaration (e.g. a px
# mention inside a comment) can never swallow the next line.
PROP_RE = re.compile(
    r'(?<![-\w(])(' + '|'.join(PROPS) + r')(\s*:\s*)([^;{}"\'\n]*)'
)
PX_RE = re.compile(r'(-?\d*\.?\d+)px')
# CSS /* */ and HTML <!-- --> comments are passed through untouched.
COMMENT_RE = re.compile(r'/\*.*?\*/|<!--.*?-->', re.DOTALL)

count = {"props": 0, "px": 0}

def fmt(v):
    s = f"{v:.6f}".rstrip('0').rstrip('.')
    return s if s else "0"

def repl_px(m):
    count["px"] += 1
    val = float(m.group(1)) / BASE
    return fmt(val) + "rem"

def repl_prop(m):
    prop, sep, val = m.group(1), m.group(2), m.group(3)
    if 'px' not in val:
        return m.group(0)
    count["props"] += 1
    return prop + sep + PX_RE.sub(repl_px, val)

def convert(text):
    # Convert everywhere except inside comments, which are left verbatim.
    out, last = [], 0
    for c in COMMENT_RE.finditer(text):
        out.append(PROP_RE.sub(repl_prop, text[last:c.start()]))
        out.append(c.group(0))
        last = c.end()
    out.append(PROP_RE.sub(repl_prop, text[last:]))
    return ''.join(out)

def main():
    targets = []
    dry = "--apply" not in sys.argv
    only = [a for a in sys.argv[1:] if not a.startswith("--")]
    if only:
        targets = only
    else:
        for root, dirs, files in os.walk("."):
            if "/.git" in root or root.startswith("./.git"):
                continue
            for fn in files:
                if fn.endswith((".html", ".css")):
                    targets.append(os.path.join(root, fn))
    changed = 0
    for path in targets:
        with open(path, encoding="utf-8") as f:
            src = f.read()
        out = convert(src)
        if out != src:
            changed += 1
            if not dry:
                with open(path, "w", encoding="utf-8") as f:
                    f.write(out)
    mode = "APPLIED" if not dry else "DRY-RUN"
    print(f"[{mode}] files changed: {changed} | declarations touched: "
          f"{count['props']} | px tokens converted: {count['px']}")

if __name__ == "__main__":
    main()
