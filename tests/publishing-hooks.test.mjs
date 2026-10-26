import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {sideOf,advisory,cursorRoot} from '../scripts/cursor-parity-notice.mjs';

test('nested modules and global rules are active canonical sources',()=>{
  for(const p of ['.dentcast/workflows/modules/08-des-fidelity.md','.dentcast/workflows/global/site-invariants.md']) {
    assert.equal(sideOf(p),'canon');
    assert.match(advisory({tool_input:{file_path:p}},'/nonexistent').hookSpecificOutput.additionalContext,/قاعدهٔ مشترک فعال/);
  }
});
test('backup snapshots are excluded',()=>{
  assert.equal(sideOf('AGENTS.legacy.md'),null);
  assert.equal(sideOf('.dentcast/workflows/legacy/cursor/dentcast-router.mdc'),null);
});
test('Windows and POSIX entrypoint paths are recognized',()=>{
  assert.equal(sideOf('C:\\repo\\AGENTS.md'),'entrypoint');
  assert.equal(sideOf('/repo/.cursor/rules/dentcast-router.mdc'),'cursor');
});
test('shared edits advise synchronization within existing authorization',()=>{
  const m=advisory({tool_response:{filePath:'CLAUDE.md'}},'/nonexistent').hookSpecificOutput.additionalContext;
  assert.match(m,/هماهنگ کن/);assert.match(m,/دوباره نپرس/);
});
test('irrelevant payloads stay silent',()=>{
  assert.equal(sideOf(null),null);assert.equal(sideOf({}),null);
  assert.equal(advisory({},'/nonexistent'),null);
  assert.equal(advisory({file_path:'unrelated.py'},'/nonexistent'),null);
});
test('active publication gets an advisory reminder without state mutation',()=>{
  const dir=mkdtempSync(join(tmpdir(),'dc-advisory-'));
  try {
    mkdirSync(join(dir,'.dentcast'));
    const path=join(dir,'.dentcast/PUBLISH-HANDOFF.md');writeFileSync(path,'untouched');
    assert.match(advisory({file_path:'insight/new.html'},dir).hookSpecificOutput.additionalContext,/هندآف ثابت/);
    assert.equal(readFileSync(path,'utf8'),'untouched');
  } finally {rmSync(dir,{recursive:true,force:true});}
});
test('Cursor adapter resolves the project from env or workspace_roots',()=>{
  assert.equal(cursorRoot({workspace_roots:['/w']},{CURSOR_PROJECT_DIR:'/p'}),'/p');
  assert.equal(cursorRoot({workspace_roots:['/w']},{}),'/w');
  assert.equal(cursorRoot({},{}),process.cwd());
});
