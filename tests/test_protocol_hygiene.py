"""Protocol files hold the rules in force, nothing else.

Two guards, both mechanical:

Rule files are listed in tools/rule_files.py (publication and queue protocols, global
rules, Cursor rules, skills, enrichment prompts, DES specs, CLAUDE.md, AGENTS.md).

1. No history in a publication or queue protocol file: no queue-item or PR number cited as the origin of
   a rule, no dated founder provenance («(founder 2026-11-07)», «(بنیان‌گذار ۱۴۰۵/۰۸/۲۰)»),
   no «used to …» incident story. The reason a rule changed belongs in the commit
   message, where git keeps it.
2. No silent growth: every rule file has a byte ceiling in
   `.dentcast/protocol-budget.json`. A file that outgrows its ceiling fails. Raising a
   ceiling is a founder decision, quoted in the commit message that raises it
   (agent-parity.md §7).

`des-version-history.md` is the one designated history file and is exempt from (1).
"""
import json
import re
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
import rule_files  # noqa: E402

BUDGET = ROOT / '.dentcast/protocol-budget.json'
HISTORY_FILE = rule_files.HISTORY_FILE


def protocol_files():
    """Every rule file with a byte ceiling (tools/rule_files.py)."""
    return rule_files.budgeted_files()


HISTORY_MARKERS = [
    (re.compile(r'(?:publish-)?queue item \d+', re.I), 'queue item cited as a rule\'s origin'),
    (re.compile(r'صف\s*[0-9۰-۹]{1,3}\s*[،,):؛]'), 'queue item number cited as a rule\'s origin'),
    (re.compile(r'\bPRs? #\d+'), 'pull request cited as a rule\'s origin'),
    (re.compile(r'\b[Ff]ounder(?: ruling| decision)?,? *(?:\d{4}[-/]\d|1405)'), 'dated founder provenance'),
    (re.compile(r'بنیان‌گذار[،,]?\s*(?:[0-9]{4}|[۰-۹]{4})[-/]'), 'dated founder provenance'),
    (re.compile(r'حکم بنیان‌گذار\s*(?:[0-9]{4}|[۰-۹]{4})'), 'dated founder provenance'),
    (re.compile(r'تصمیم بنیان‌گذار[،,]?\s*(?:[0-9]{4}|[۰-۹]{4})'), 'dated founder provenance'),
    (re.compile(r'\bused to\b'), 'incident story («used to …»)'),
]


class ProtocolHygieneTests(unittest.TestCase):
    def test_no_history_in_protocol_files(self):
        found = []
        for rel in rule_files.history_free_files():
            for n, line in enumerate((ROOT / rel).read_text(encoding='utf-8').splitlines(), 1):
                for pattern, why in HISTORY_MARKERS:
                    m = pattern.search(line)
                    if m:
                        found.append(f'{rel}:{n}: {why}: «{m.group(0)}»')
        self.assertEqual(found, [], 'history belongs in the commit message, not the protocol:\n'
                         + '\n'.join(found))

    def test_every_protocol_file_fits_its_budget(self):
        budget = json.loads(BUDGET.read_text(encoding='utf-8'))['max_bytes']
        problems = []
        for rel in protocol_files():
            size = (ROOT / rel).stat().st_size
            if rel not in budget:
                problems.append(f'{rel}: no ceiling in .dentcast/protocol-budget.json ({size} bytes)')
            elif size > budget[rel]:
                problems.append(f'{rel}: {size} bytes > ceiling {budget[rel]} '
                                f'(+{size - budget[rel]})')
        stale = sorted(set(budget) - set(protocol_files()))
        problems += [f'{rel}: ceiling for a file that no longer exists' for rel in stale]
        self.assertEqual(problems, [], 'a protocol file grew past its ceiling; remove the text it '
                         'replaces, or record the founder\'s decision to raise it:\n'
                         + '\n'.join(problems))


class RuleChangeGateTests(unittest.TestCase):
    def test_rule_files_cover_every_instruction_surface(self):
        for rel in ('.dentcast/workflows/modules/08-des-fidelity.md', '.dentcast/workflows/global/plus-premium.md',
                    '.cursor/rules/dentcast-router.mdc', '.claude/skills/glossary-writer/SKILL.md',
                    '.dentcast/cabinet-enrichment/PROPOSE.md', '.dentcast/des-v3.7-knowledge.md',
                    '.dentcast/protocol-budget.json', 'CLAUDE.md', 'AGENTS.md'):
            self.assertTrue(rule_files.is_rule_file(rel), rel)
        for rel in ('tools/queue_apply.py', '.dentcast/cabinet-enrichment/results.jsonl', 'index.html'):
            self.assertFalse(rule_files.is_rule_file(rel), rel)

    def test_founder_request_line_is_required_and_must_say_something(self):
        import check_rule_changes as crc  # noqa: PLC0415
        self.assertTrue(crc.has_request('x\n\nFounder-request: «همین رو بذار»\n'))
        self.assertFalse(crc.has_request('x\n\nFounder-request:   \n'))
        self.assertFalse(crc.has_request('a commit with no request'))


if __name__ == '__main__':
    unittest.main()
