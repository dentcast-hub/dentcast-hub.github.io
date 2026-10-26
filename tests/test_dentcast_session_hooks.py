"""SessionStart activates the repository Git hooks in a fresh clone, quietly and idempotently."""
import json
import os
import shutil
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

    def test_stale_hooks_path_is_replaced_and_own_githooks_kept(self):
        # A stale or global value would silently disable .githooks/pre-commit.
        for config, var in zip(CONFIGS, ('CLAUDE_PROJECT_DIR', 'CODEX_PROJECT_DIR')):
            with self.subTest(config=config):
                (command,) = session_start(config)
                repo = self.repo()
                subprocess.run(['git', '-C', repo, 'config', 'core.hooksPath', 'custom-hooks'], check=True)
                result = self.run_hook(command, repo, var)
                self.assertEqual((result.returncode, result.stdout, result.stderr), (0, '', ''))
                self.assertEqual(self.hooks_path(repo), '.githooks')
                top = subprocess.run(['git', '-C', repo, 'rev-parse', '--show-toplevel'],
                                     capture_output=True, text=True).stdout.strip()
                own = top + '/.githooks'
                subprocess.run(['git', '-C', repo, 'config', 'core.hooksPath', own], check=True)
                self.run_hook(command, repo, var)
                self.assertEqual(self.hooks_path(repo), own)

    def test_without_project_dir_uses_the_enclosing_repository(self):
        (command,) = session_start(CONFIGS[0])
        repo = self.repo()
        sub = Path(repo) / 'sub'
        sub.mkdir()
        env = {k: v for k, v in os.environ.items() if k not in ('CLAUDE_PROJECT_DIR', 'CODEX_PROJECT_DIR')}
        result = subprocess.run(['sh', '-c', command], cwd=sub, env=env, capture_output=True, text=True)
        self.assertEqual((result.returncode, result.stdout, result.stderr), (0, '', ''))
        self.assertEqual(self.hooks_path(repo), '.githooks')

    def test_post_tool_use_covers_bash_edits(self):
        for config in CONFIGS:
            hooks = json.loads((ROOT / config).read_text(encoding='utf-8'))['hooks']['PostToolUse']
            with self.subTest(config=config):
                self.assertEqual(set(hooks[0]['matcher'].split('|')), {'Edit', 'Write', 'MultiEdit', 'Bash'})

    def event_command(self, config, event):
        hooks = json.loads((ROOT / config).read_text(encoding='utf-8'))['hooks'][event]
        (command,) = [h['command'] for group in hooks for h in group['hooks']]
        return command

    def test_stop_and_post_tool_allow_when_scripts_are_not_found(self):
        # Exit 2 is a block in Claude; python/node on a missing file exit 2.
        for config in CONFIGS:
            for event, stdin in (('Stop', '{"stop_hook_active": false}'),
                                 ('PostToolUse', '{"tool_input": {"file_path": "CLAUDE.md"}}')):
                with self.subTest(config=config, event=event), tempfile.TemporaryDirectory() as folder:
                    command = self.event_command(config, event)
                    for repo in (folder, self.repo()):  # outside Git; a repo without scripts/
                        result = self.run_hook(command, repo, None, stdin)
                        self.assertEqual((result.returncode, result.stdout, result.stderr), (0, '', ''))
                    bogus = self.run_hook(command, folder, 'CLAUDE_PROJECT_DIR', stdin)
                    self.assertEqual(bogus.returncode, 0)

    def test_stop_without_project_dir_finds_the_enclosing_checkout(self):
        for config in CONFIGS:
            with self.subTest(config=config):
                repo = self.repo()
                shutil.copytree(ROOT / 'scripts', Path(repo) / 'scripts')
                (Path(repo) / '.dentcast').mkdir()
                (Path(repo) / '.dentcast/PUBLISH-HANDOFF.md').write_text('fixture handoff\n')
                sub = Path(repo) / 'پوشه فارسی'
                sub.mkdir()
                env = {k: v for k, v in os.environ.items()
                       if k not in ('CLAUDE_PROJECT_DIR', 'CODEX_PROJECT_DIR', 'CURSOR_PROJECT_DIR')}
                result = subprocess.run(['sh', '-c', self.event_command(config, 'Stop')], cwd=sub, env=env,
                                        input='{"stop_hook_active": false}', capture_output=True, text=True)
                self.assertEqual(result.returncode, 0)
                out = json.loads(result.stdout)
                self.assertEqual(out['decision'], 'block')
                self.assertIn('GUARD_UNAVAILABLE', out['reason'])

    def test_stop_advice_names_cleanup_commands_only_for_local_cleanup(self):
        import importlib.util
        spec = importlib.util.spec_from_file_location('stop_guard', ROOT / 'scripts/publishing-stop-guard.py')
        guard = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(guard)
        for code in ('PREVIOUS_STEP_PUSH_NOT_CONFIRMED', 'PREVIOUS_STEP_HANDOFF_NOT_DELIVERED',
                     'CHECKPOINT_REQUIRED_BEFORE_COMMIT_OR_STOP', 'GUARD_UNAVAILABLE',
                     'SHALLOW_CLONE_DEEPEN_REQUIRED: run git fetch --deepen=50 origin',
                     'DELIVERY_3_ON_REMOTE_PULL_REQUIRED: run `git pull --ff-only`'):
            with self.subTest(code=code):
                self.assertNotIn('confirm-cleanup', guard.advice(code))
        self.assertIn('git restore .dentcast/PUBLISH-HANDOFF.md', guard.advice('PREVIOUS_STEP_HANDOFF_NOT_DELIVERED'))
        self.assertIn('stage-delivery', guard.advice('PREVIOUS_STEP_PUSH_NOT_CONFIRMED'))
        self.assertIn('stage-delivery', guard.advice('PREVIOUS_STEP_WORK_NOT_COMMITTED'))
        self.assertEqual(guard.advice('SHALLOW_CLONE_DEEPEN_REQUIRED: run git fetch --deepen=50 origin'), '')
        self.assertIn('restore-cleanup', guard.advice('CLEANUP_DELIVERY_PENDING'))

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
        self.assertEqual(self.hooks_path(repo), '.githooks')

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
