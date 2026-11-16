"""Which files are rules: every instruction an agent follows, and the ceilings that bound them.

A change to any of these is a founder decision (agent-parity.md §7): the commit that
makes it carries a `Founder-request:` line quoting the founder (tools/check_rule_changes.py),
and each file stays within its byte ceiling in `.dentcast/protocol-budget.json`
(tests/test_protocol_hygiene.py).
"""
from fnmatch import fnmatch
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

RULE_GLOBS = (
    '.dentcast/workflows/*.md',
    '.dentcast/workflows/modules/*.md',
    '.dentcast/workflows/global/*.md',
    '.dentcast/workflows/global/LOAD-MAP.json',
    '.dentcast/cabinet-enrichment/*.md',
    '.dentcast/des-v*-knowledge.md',
    '.dentcast/dentcast-evidence-score-v*.md',
    '.dentcast/protocol-budget.json',
    '.cursor/rules/*.mdc',
    '.claude/skills/*/SKILL.md',
    '.agents/skills/*/SKILL.md',
    'CLAUDE.md',
    'AGENTS.md',
)

# Files whose size is bounded by a ceiling (the budget file itself and the generated
# load map are rule files but carry no ceiling of their own).
UNBUDGETED = {'.dentcast/protocol-budget.json', '.dentcast/workflows/global/LOAD-MAP.json'}

# The publication and queue protocols: no history (dated provenance, incident stories,
# queue-item numbers) inside them. des-version-history.md is the designated history file.
HISTORY_FREE_GLOBS = ('.dentcast/workflows/*.md', '.dentcast/workflows/modules/*.md', 'CLAUDE.md', 'AGENTS.md')
HISTORY_FILE = '.dentcast/workflows/des-version-history.md'


def is_rule_file(rel):
    return any(fnmatch(rel, g) and rel.count('/') == g.count('/') for g in RULE_GLOBS)


def rule_files():
    out = set()
    for g in RULE_GLOBS:
        out.update(p.relative_to(ROOT).as_posix() for p in ROOT.glob(g) if p.is_file())
    return sorted(out)


def budgeted_files():
    return [r for r in rule_files() if r not in UNBUDGETED]


def history_free_files():
    out = set()
    for g in HISTORY_FREE_GLOBS:
        out.update(p.relative_to(ROOT).as_posix() for p in ROOT.glob(g) if p.is_file())
    out.discard(HISTORY_FILE)
    return sorted(out)
