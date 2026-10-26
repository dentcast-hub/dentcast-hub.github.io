import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {sideOf,advisory,cursorRoot,skillDivergence,bashAdvisory,projectRoot} from '../scripts/cursor-parity-notice.mjs';

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
test('skill copies and hook configs are tracked sides; skill divergence warns',()=>{
  assert.equal(sideOf('/r/.claude/skills/glossary-writer/SKILL.md'),'skill');
  assert.equal(sideOf('.agents/skills/glossary-writer/SKILL.md'),'skill');
  for(const p of ['.claude/settings.json','.codex/hooks.json','/r/.cursor/hooks.json']) assert.equal(sideOf(p),'hooks');
  const dir=mkdtempSync(join(tmpdir(),'dc-skill-'));
  try {
    for(const d of ['.claude/skills/s','.agents/skills/s']) mkdirSync(join(dir,d),{recursive:true});
    writeFileSync(join(dir,'.claude/skills/s/SKILL.md'),'a');writeFileSync(join(dir,'.agents/skills/s/SKILL.md'),'a');
    assert.equal(advisory({tool_input:{file_path:join(dir,'.claude/skills/s/SKILL.md')}},dir),null);
    writeFileSync(join(dir,'.agents/skills/s/SKILL.md'),'b');
    assert.match(skillDivergence(join(dir,'.claude/skills/s/SKILL.md')),/\.agents\/skills\/s\/SKILL\.md/);
    assert.match(advisory({tool_input:{file_path:join(dir,'.agents/skills/s/SKILL.md')}},dir).hookSpecificOutput.additionalContext,/عیناً یکی/);
    assert.match(advisory({tool_input:{file_path:'.claude/settings.json'}},dir).hookSpecificOutput.additionalContext,/test_dentcast_session_hooks/);
  } finally {rmSync(dir,{recursive:true,force:true});}
});
test('Bash edits advise once per changed relevant path and stay silent otherwise',()=>{
  const dir=mkdtempSync(join(tmpdir(),'dc-bash-'));
  try {
    const state=join(dir,'state.json');let dirty=[];const run=()=>dirty;
    writeFileSync(join(dir,'CLAUDE.md'),'x');writeFileSync(join(dir,'other.py'),'x');
    assert.equal(bashAdvisory(dir,state,run),null);
    dirty=['other.py'];
    assert.equal(bashAdvisory(dir,state,run),null);
    dirty=['other.py','CLAUDE.md'];
    assert.match(bashAdvisory(dir,state,run).hookSpecificOutput.additionalContext,/هماهنگ کن/);
    assert.equal(bashAdvisory(dir,state,run),null);
    mkdirSync(join(dir,'.dentcast'));writeFileSync(join(dir,'.dentcast/PUBLISH-HANDOFF.md'),'h');
    dirty=['other.py','CLAUDE.md','.dentcast/PUBLISH-HANDOFF.md'];
    assert.equal(bashAdvisory(dir,state,run),null);
    writeFileSync(join(dir,'other.py'),'changed!');
    assert.match(bashAdvisory(dir,state,run).hookSpecificOutput.additionalContext,/هندآف ثابت/);
    assert.equal(bashAdvisory(dir,state,()=>null),null);
  } finally {rmSync(dir,{recursive:true,force:true});}
});
test('project root comes from the payload cwd before CLAUDE_PROJECT_DIR',()=>{
  const dir=mkdtempSync(join(tmpdir(),'dc-root-'));
  try {
    mkdirSync(join(dir,'.git'));mkdirSync(join(dir,'a/b'),{recursive:true});
    assert.equal(projectRoot({cwd:join(dir,'a/b')},{CLAUDE_PROJECT_DIR:'/main'}),dir);
    assert.equal(projectRoot({},{CLAUDE_PROJECT_DIR:dir}),dir);
  } finally {rmSync(dir,{recursive:true,force:true});}
});
test('Bash hook process is silent for an unchanged tree',()=>{
  const input=JSON.stringify({tool_name:'Bash',cwd:process.cwd()});
  const first=spawnSync(process.execPath,['scripts/cursor-parity-notice.mjs'],{input,encoding:'utf8'});
  assert.equal(first.status,0);
  const again=spawnSync(process.execPath,['scripts/cursor-parity-notice.mjs'],{input,encoding:'utf8'});
  assert.equal(again.status,0);
  assert.equal(again.stdout,'');
});
