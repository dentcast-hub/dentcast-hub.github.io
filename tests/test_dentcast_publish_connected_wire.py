"""Pure ECMAScript render parity with Python canonical v3 wire."""
import copy
import json
import subprocess
from pathlib import Path
import sys
import unittest
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))
import dentcast_publish_handoff as h
import dentcast_publish_lifecycle as lc
from test_dentcast_publish_connected_state import fresh, step_sequence

ROOT=Path(__file__).resolve().parents[1]


def node(script, obj=None):
    args=["node","--input-type=module","-e",script]
    if obj is not None:
        args.append(json.dumps(obj,ensure_ascii=False))
    result=subprocess.run(args,cwd=ROOT,text=True,capture_output=True,timeout=12)
    if result.returncode:
        raise AssertionError(result.stderr)
    return result.stdout


class ConnectedWireParity(unittest.TestCase):
    def test_compact_v3_wire_and_legacy_roundtrip(self):
        pub=step_sequence(fresh())["state"]["publication"]
        obj={"schema":h.SCHEMA,"publication":pub,"reconciliation":None}
        wire=h.render(obj)
        saved=json.loads(wire.split(h.BEGIN)[1].split(h.END)[0])
        self.assertEqual(saved["publication"]["steps"][-1]["id"],"C.4.9")
        self.assertEqual(len(saved["publication"]["steps"]),33)
        restored,_=h.parse_state(wire.encode())
        self.assertEqual(restored["publication"]["steps"],pub["steps"])
        script=("import {inspectCut1} from './tools/dentcast_connected_wire.mjs';"
                "process.stdout.write(JSON.stringify(inspectCut1(JSON.parse(process.argv[1])).state.publication.steps));")
        self.assertEqual(json.loads(node(script,wire)),pub["steps"])
        legacy=h.render(obj,compact=False)
        old,_=h.parse_state(legacy.encode())
        self.assertEqual(old["publication"]["steps"],pub["steps"])
        self.assertEqual(json.loads(node(script,legacy)),pub["steps"])

    def test_compact_wire_rejects_missing_middle_step(self):
        pub=step_sequence(fresh())["state"]["publication"]
        wire=h.render({"schema":h.SCHEMA,"publication":pub,"reconciliation":None})
        parsed=json.loads(wire.split(h.BEGIN)[1].split(h.END)[0])
        del parsed["publication"]["steps"][2]
        corrupted=wire.split(h.BEGIN)[0]+h.BEGIN+json.dumps(parsed,sort_keys=True)+h.END
        with self.assertRaisesRegex(h.Blocked,"COMPACT_STEPS_NONPREFIX_OR_UNKNOWN"):
            h.parse_state(corrupted.encode())

    def test_plan_is_exact_authoritative_canonical_plan(self):
        result=node("import {plan} from './tools/dentcast_connected_wire.mjs'; process.stdout.write(JSON.stringify(plan()));")
        self.assertEqual(json.loads(result),lc.plan())

    def test_byte_exact_v3_wire_parity_for_persian_and_emoji(self):
        session=step_sequence(fresh())
        pub=session["state"]["publication"]
        pub["context"]["decisions"].append({
            "scope":"یادداشت", "decision":"تأیید آزمایشی — 😀"})
        pub["context"]["inputs"].append("مقاله/DOI")
        script=("import {renderCut1} from './tools/dentcast_connected_wire.mjs';"
                "const p=JSON.parse(process.argv[1]);process.stdout.write(renderCut1(p));")
        wire=node(script,pub)
        expected=h.render({"schema":h.SCHEMA,"publication":pub,"reconciliation":None})
        self.assertEqual(wire,expected)
        parsed,d=h.parse_state(wire.encode())
        self.assertEqual(parsed["publication"],pub)

    def test_nested_landing_python_js_parity_and_parent_rejection(self):
        session = step_sequence(fresh())
        pub = session["state"]["publication"]
        page = "dentai/promptologist/prompt-append2-4.html"
        index = "dentai/promptologist/index.html"
        pub["content_id"], pub["category"] = page[:-5], "promptologist"
        pub["target_paths"] = [page, index]
        audit = next(d for d in pub["context"]["decisions"]
                     if d["kind"] == "first_cut_scope_audit_v1")
        audit["landing_path"], audit["landing_mode"] = index, "included"
        audit["observed_changed_paths"] = [page, index]
        script = ("import {renderCut1} from './tools/dentcast_connected_wire.mjs';"
                  "try{process.stdout.write(renderCut1(JSON.parse(process.argv[1])))}"
                  "catch(e){process.stdout.write('BLOCKED:'+e.message)}")
        expected = h.render({"schema": h.SCHEMA, "publication": pub,
                             "reconciliation": None})
        self.assertEqual(node(script, pub), expected)
        from dentcast_connected_cut_gates import validate_declarations
        validate_declarations(pub)
        audit["landing_path"] = "dentai/index.html"
        with self.assertRaisesRegex(h.Blocked, "FIRST_CUT_LANDING_IDENTITY"):
            validate_declarations(pub)
        self.assertEqual(node(script, pub), "BLOCKED:FIRST_CUT_LANDING_IDENTITY")

    def test_js_renderer_refuses_pending_intro_approval(self):
        pub=step_sequence(fresh())["state"]["publication"]
        pub["context"]["approvals"].append({
            "scope": "authored-intro", "status": "pending",
            "decision": None, "evidence": []})
        script=("import {renderCut1} from './tools/dentcast_connected_wire.mjs';"
                "try{renderCut1(JSON.parse(process.argv[1]))}"
                "catch(e){process.stdout.write(e.message)}")
        self.assertEqual(node(script,pub),"FIRST_CUT_UNRESOLVED_APPROVAL")

    def test_js_lead_origin_absent_and_approval_required(self):
        base=step_sequence(fresh())["state"]["publication"]
        script=("import {renderCut1} from './tools/dentcast_connected_wire.mjs';"
                "try{renderCut1(JSON.parse(process.argv[1]));process.stdout.write('OK')}"
                "catch(e){process.stdout.write(e.message)}")
        absent=copy.deepcopy(base)
        absent["context"]["decisions"]=[d for d in absent["context"]["decisions"]
                                         if d["kind"]!="first_cut_lead_provenance_v1"]
        self.assertIn("FIRST_CUT_DECLARATION_REQUIRED",node(script,absent))
        agent=copy.deepcopy(base)
        lead=next(d for d in agent["context"]["decisions"]
                  if d["kind"]=="first_cut_lead_provenance_v1")
        lead["origin"]="agent_authored"
        self.assertEqual(node(script,agent),"AGENT_LEAD_EXPLICIT_FOUNDER_APPROVAL_REQUIRED")
        agent["context"]["approvals"].append({
            "scope":"authored-intro","status":"confirmed","decision":"approved",
            "evidence":["fixture:author-approved"]})
        self.assertEqual(node(script,agent),"OK")

    def test_renderer_refuses_incomplete_first_cut_and_fabricated_completion(self):
        pub=fresh()["state"]["publication"]
        script=("import {renderCut1,updateStep} from './tools/dentcast_connected_wire.mjs';"
                "const p=JSON.parse(process.argv[1]);let found=0;"
                "try{renderCut1(p)}catch(e){if(e.message==='FIRST_CUT_NOT_READY')found++}"
                "try{updateStep(p,'rules','completed',['fake'])}catch(e){"
                "if(e.message==='COMPLETE_REQUIRES_STARTED_AND_EVIDENCE')found++}"
                "process.stdout.write(String(found));")
        self.assertEqual(node(script,pub),"2")


if __name__=="__main__":
    unittest.main()
