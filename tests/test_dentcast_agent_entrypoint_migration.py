"""Audit active instruction routing and full global-rule migration.
Reading backup fixtures here is an audit, never a runtime loader requirement.
These tests do not launch external agent clients.
"""
import hashlib
import json
from pathlib import Path
import re
import unittest
ROOT = Path(__file__).resolve().parents[1]
ENTRYPOINTS = ("AGENTS.md", "CLAUDE.md",
 ".cursor/rules/dentcast-router.mdc", ".cursor/rules/dentcast-publishing.mdc",
 ".cursor/rules/dentcast-operating-protocol.mdc",
 ".dentcast/workflows/README.md", ".dentcast/workflows/agent-parity.md")
SLICES = ("01-hard-rules.md","02-routing-intake.md","03-litecast-and-page.md",
 "04-taxonomy-and-navigation.md","05-semantic-linking.md","06-paper-ingestion.md",
 "07-flashcards-and-quiz.md","08-des-fidelity.md","09-challenge.md",
 "10-brain-and-pathways.md","11-build-and-version.md","12-english-notify-verify.md")
RANGES = ((1,56),(57,356),(357,528),(529,794),(795,957),(958,1143),
 (1144,1335),(1336,1966),(1967,2038),(2039,2329),(2330,2393),(2394,2598))
EDITS = {"02-routing-intake.md":{"CLAUDE.md → Repo conventions":".dentcast/workflows/global/repo-conventions.md"},
 "03-litecast-and-page.md":{"AGENTS.md` §۸":".dentcast/workflows/global/site-invariants.md`"},
 "08-des-fidelity.md":{'CLAUDE.md § "DES display"':".dentcast/workflows/global/plus-premium.md — DES display",
 "CLAUDE.md § DES":".dentcast/workflows/global/plus-premium.md — DES"}}
def read(p): return (ROOT/p).read_text(encoding="utf-8")
class EntrypointMigrationTests(unittest.TestCase):
 def test_clients_use_active_authority(self):
  for p in ENTRYPOINTS:
   with self.subTest(path=p):
    s=read(p)
    for term in ("LIVE_MODULAR_PUBLISHING_ENABLED",".dentcast/workflows/global/README.md"):
     self.assertIn(term,s)
    for term in (".legacy.md","/legacy/","STAGING_ONLY_NO_LIVE_PUBLISH"):
     self.assertNotIn(term,s)
  for p in ENTRYPOINTS[:5]:
   self.assertIn(".dentcast/workflows/README.md",read(p))
   self.assertIn(".dentcast/workflows/agent-parity.md",read(p))
 def test_resume_discovery_in_all_clients(self):
  for p in ENTRYPOINTS:
   with self.subTest(path=p):
    for term in ("انتشار ناقص داشتم",".dentcast/PUBLISH-HANDOFF.md",".dentcast/workflows/publish-handoff.md"):
     self.assertIn(term,read(p))
 def test_cursor_native_metadata(self):
  for name,always in (("router","true"),("operating-protocol","true"),("publishing","false")):
   s=read(f".cursor/rules/dentcast-{name}.mdc")
   self.assertTrue(s.startswith("---\n"))
   self.assertIn(f"alwaysApply: {always}",s.split("---",2)[1])
 def test_specialty_routes_preserved(self):
  for p in ("AGENTS.md","CLAUDE.md",".cursor/rules/dentcast-router.mdc"):
   for route in ("en-version.md","ads.md","spot-report.md","cross-link.md","new-section.md",
    "external-fidelity.md","offline-publish.md","glossary-writer/SKILL.md","routing-details.md"):
    with self.subTest(path=p,route=route): self.assertIn(route,read(p))
 def test_complete_global_rules_migrated(self):
  m=json.loads(read(".dentcast/workflows/global/MIGRATION.json"))
  self.assertIs(m["execution_requires_backup_read"],False)
  src=read(m["source_artifact"]).splitlines(keepends=True)
  self.assertEqual([r["source_lines"] for r in m["ranges"]],[[373,1209],[1210,1440],[1441,1587]])
  for item in m["ranges"]:
   a,b=item["source_lines"]; original="".join(src[a-1:b])
   self.assertEqual(hashlib.sha256(original.encode()).hexdigest(),item["source_sha256"])
   expected=original.replace("CLAUDE.md، بخش Repo conventions.","فایل فعال .dentcast/workflows/global/repo-conventions.md.")
   self.assertEqual(read(item["active"]),expected)
   self.assertIn(item["active"],read(".dentcast/workflows/global/README.md"))
 def test_canonical_modules_unchanged_except_pointer_repairs(self):
  src=read(".dentcast/workflows/README.legacy.md").splitlines(keepends=True)
  router=read(".dentcast/workflows/README.md"); start=router.index("## New-publication dispatch"); positions=[]
  for name,(a,b) in zip(SLICES,RANGES):
   with self.subTest(module=name):
    expected="".join(src[a-1:b])
    for old,new in EDITS.get(name,{}).items(): expected=expected.replace(old,new)
    actual=read(".dentcast/workflows/modules/"+name)
    self.assertTrue(actual.startswith("<!-- dentcast-checkpoint-protocol:v1 -->"))
    self.assertIn(".dentcast/workflows/publish-checkpoints.md",actual.split("<!-- /dentcast-checkpoint-protocol:v1 -->",1)[0])
    body=actual.split("<!-- /dentcast-checkpoint-protocol:v1 -->\n\n",1)[1]
    if name == "08-des-fidelity.md":
     # Part 2c is the one approved execution-routing amendment; the scientific
     # prompt, scoring engine and all other canonical source text stay intact.
     marker="#### Part 2c — How the FIDELITY call is run: two independent checker runs, a tie-break, a stronger reviewer"
     after="**The model is part of the measurement:**"
     expected_before,expected_rest=expected.split(marker,1)
     expected_after=expected_rest.split(after,1)[1]
     actual_before,actual_rest=body.split(marker,1)
     actual_after=actual_rest.split(after,1)[1]
     self.assertEqual(actual_before.rstrip("\n"),expected_before.rstrip("\n"))
     self.assertEqual(actual_after.rstrip("\n"),expected_after.rstrip("\n"))
     for required in ("`gpt-6-luna`", "Launch both full checker runs in parallel",
       "exact price verification is not a start gate", "record it as UNVERIFIED",
       "If the runtime does not expose independent contexts"):
      self.assertIn(required,actual_rest.split(after,1)[0])
     continue
    self.assertEqual(body.rstrip("\n"),expected.rstrip("\n"))
    positions.append(router.index("`modules/"+name+"`",start))
  self.assertEqual(positions,sorted(positions))
  for left,right in zip(RANGES,RANGES[1:]): self.assertEqual(left[1]+1,right[0])
  # Published extraction ranges include the final empty line after a trailing newline.
  self.assertIn(len(src),(RANGES[-1][1]-1,RANGES[-1][1]))
 def test_development_records_are_explicitly_historical(self):
  for p in (ROOT/".dentcast/workflows/modules").glob("*.md"):
   if re.match(r"\d\d-",p.name) or p.name=="INDEX.md": continue
   with self.subTest(path=p.name):
    s=p.read_text()
    self.assertTrue(s.startswith("# Historical modularization development record"))
    self.assertIn("Historical record (non-operative)",s)
    self.assertIn(".dentcast/PUBLISH-HANDOFF.md",s)
  self.assertIn("LIVE_MODULAR_PUBLISHING_ENABLED",read(".dentcast/workflows/modules/INDEX.md"))
 def test_no_fake_live_publication_created(self):
  self.assertFalse((ROOT/".dentcast/PUBLISH-HANDOFF.md").exists())
if __name__=="__main__": unittest.main()
