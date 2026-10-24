"""SessionStart activates the repository Git hooks in a fresh clone, quietly and idempotently."""
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
CONFIGS = ('.claude/settings.json', '.codex/hooks.json')


def session_start(config):
    hooks = json.loads((ROOT / config).read_text(encoding='utf-8'))['hooks']['SessionStart']
    return [h['command'] for group in hooks for h in group['hooks']]


class SessionStartHookTests(unittest.TestCase):
    def repo(self):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        subprocess.run(['git', 'init', '-q', temp.name], check=True)
        return temp.name

    def run_hook(self, command, repo, var):
        env = {k: v for k, v in os.environ.items() if k not in ('CLAUDE_PROJECT_DIR', 'CODEX_PROJECT_DIR')}
        env[var] = repo
        return subprocess.run(['sh', '-c', command], cwd=repo, env=env, capture_output=True, text=True)

    def hooks_path(self, repo):
        out = subprocess.run(['git', '-C', repo, 'config', 'core.hooksPath'], capture_output=True, text=True)
        return out.stdout.strip()

    def test_fresh_clone_gets_githooks_once_without_output(self):
        for config, var in zip(CONFIGS, ('CLAUDE_PROJECT_DIR', 'CODEX_PROJECT_DIR')):
            with self.subTest(config=config):
                (command,) = session_start(config)
                repo = self.repo()
                for _ in range(2):
                    result = self.run_hook(command, repo, var)
                    self.assertEqual((result.returncode, result.stdout, result.stderr), (0, '', ''))
                    self.assertEqual(self.hooks_path(repo), '.githooks')

    def test_existing_hooks_path_is_left_alone(self):
        repo = self.repo()
        subprocess.run(['git', '-C', repo, 'config', 'core.hooksPath', 'custom-hooks'], check=True)
        (command,) = session_start(CONFIGS[0])
        self.assertEqual(self.run_hook(command, repo, 'CLAUDE_PROJECT_DIR').stdout, '')
        self.assertEqual(self.hooks_path(repo), 'custom-hooks')

    def test_outside_git_is_silent_and_non_failing(self):
        with tempfile.TemporaryDirectory() as folder:
            (command,) = session_start(CONFIGS[0])
            result = self.run_hook(command, folder, 'CLAUDE_PROJECT_DIR')
            self.assertEqual((result.returncode, result.stdout, result.stderr), (0, '', ''))


if __name__ == '__main__':
    unittest.main()
