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

    def run_hook(self, command, repo, var, stdin=''):
        env = {k: v for k, v in os.environ.items()
               if k not in ('CLAUDE_PROJECT_DIR', 'CODEX_PROJECT_DIR', 'CURSOR_PROJECT_DIR')}
        if var:
            env[var] = repo
        return subprocess.run(['sh', '-c', command], cwd=repo, env=env, capture_output=True, text=True,
                              input=stdin)

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

    def test_empty_hooks_path_is_treated_as_unset(self):
        for config, var in zip(CONFIGS, ('CLAUDE_PROJECT_DIR', 'CODEX_PROJECT_DIR')):
            with self.subTest(config=config):
                repo = self.repo()
                subprocess.run(['git', '-C', repo, 'config', 'core.hooksPath', ''], check=True)
                (command,) = session_start(config)
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


def cursor_hooks(event):
    hooks = json.loads((ROOT / '.cursor/hooks.json').read_text(encoding='utf-8'))
    assert hooks['version'] == 1
    return [h['command'] for h in hooks['hooks'][event]]


class CursorHookTests(SessionStartHookTests.__base__):
    repo = SessionStartHookTests.repo
    run_hook = SessionStartHookTests.run_hook
    hooks_path = SessionStartHookTests.hooks_path

    def test_session_start_sets_githooks_with_or_without_project_dir(self):
        (command,) = cursor_hooks('sessionStart')
        for var in ('CURSOR_PROJECT_DIR', None):
            with self.subTest(var=var):
                repo = self.repo()
                for _ in range(2):
                    result = self.run_hook(command, repo, var, '{}')
                    self.assertEqual((result.returncode, result.stdout, result.stderr), (0, '', ''))
                    self.assertEqual(self.hooks_path(repo), '.githooks')

    def test_shell_hook_sets_githooks_and_always_allows(self):
        # Cursor CLI fires only shell hooks; this one must cover a commit too.
        (command,) = cursor_hooks('beforeShellExecution')
        repo = self.repo()
        subprocess.run(['git', '-C', repo, 'config', 'core.hooksPath', ''], check=True)
        result = self.run_hook(command, repo, 'CURSOR_PROJECT_DIR', '{"command": "git commit -m x"}')
        self.assertEqual(result.returncode, 0)
        self.assertEqual(json.loads(result.stdout), {'permission': 'allow'})
        self.assertEqual(self.hooks_path(repo), '.githooks')
        subprocess.run(['git', '-C', repo, 'config', 'core.hooksPath', 'custom-hooks'], check=True)
        self.assertEqual(json.loads(self.run_hook(command, repo, None, '{}').stdout), {'permission': 'allow'})
        self.assertEqual(self.hooks_path(repo), 'custom-hooks')

    def test_shell_hook_allows_outside_git(self):
        (command,) = cursor_hooks('beforeShellExecution')
        with tempfile.TemporaryDirectory() as folder:
            result = self.run_hook(command, folder, None, '{}')
            self.assertEqual((result.returncode, json.loads(result.stdout)), (0, {'permission': 'allow'}))

    def test_cursor_has_the_same_guards_as_claude(self):
        # Claude's Stop guard and PostToolUse parity notice, in Cursor's events.
        (stop,) = cursor_hooks('stop')
        (edit,) = cursor_hooks('afterFileEdit')
        self.assertIn('scripts/publishing-stop-guard.py" --cursor', stop)
        self.assertIn('scripts/cursor-parity-notice.mjs" --cursor', edit)

    def test_cursor_stop_hook_is_silent_without_a_publication(self):
        (command,) = cursor_hooks('stop')
        result = self.run_hook(command, str(ROOT), 'CURSOR_PROJECT_DIR',
                               '{"status": "completed", "loop_count": 0}')
        self.assertEqual((result.returncode, result.stdout), (0, ''))

    def test_cursor_stop_adapter_returns_followup_and_never_loops(self):
        script = str(ROOT / 'scripts/publishing-stop-guard.py')
        with tempfile.TemporaryDirectory() as folder:  # active handoff, no tools/ => guard unavailable
            subprocess.run(['git', 'init', '-q', folder], check=True)
            (Path(folder) / '.dentcast').mkdir()
            (Path(folder) / '.dentcast/PUBLISH-HANDOFF.md').write_text('fixture handoff\n')
            env = {**os.environ, 'CURSOR_PROJECT_DIR': folder}
            run = lambda stdin: subprocess.run(['python3', script, '--cursor'], input=stdin, env=env,
                                               capture_output=True, text=True)
            out = json.loads(run('{"status": "completed", "loop_count": 0}').stdout)
            self.assertEqual(list(out), ['followup_message'])
            self.assertIn('GUARD_UNAVAILABLE', out['followup_message'])
            self.assertEqual(run('{"status": "completed", "loop_count": 3}').stdout, '')
            self.assertEqual(run('not json').stdout, '')

    def test_cursor_edit_hook_advises_on_stderr_only(self):
        (command,) = cursor_hooks('afterFileEdit')
        result = self.run_hook(command, str(ROOT), 'CURSOR_PROJECT_DIR',
                               json.dumps({'file_path': str(ROOT / 'CLAUDE.md'), 'edits': []}))
        self.assertEqual((result.returncode, result.stdout), (0, ''))
        self.assertIn('هماهنگ کن', result.stderr)
        quiet = self.run_hook(command, str(ROOT), 'CURSOR_PROJECT_DIR', '{"file_path": "unrelated.py"}')
        self.assertEqual((quiet.returncode, quiet.stdout, quiet.stderr), (0, '', ''))


if __name__ == '__main__':
    unittest.main()
