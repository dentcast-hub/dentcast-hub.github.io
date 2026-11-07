"""Lead-provenance gate, checked at every fixed delivery (Push 2 in v2).

It validates a declared, reviewed fact; it cannot manufacture founder approval.
The decision keeps its historical name `first_cut_lead_provenance_v1` so older
receipts still validate. The GitHub-only connected cut-1 scope audit that used
to live here was retired with cut 1 (2026-11-07).
"""
import dentcast_publish_handoff as h

LEAD = "first_cut_lead_provenance_v1"
APPROVAL_SCOPE = "authored-intro"


def need(value, reason):
    h.require(bool(value), reason)


def only_decision(publication, kind):
    found = [d for d in publication["context"]["decisions"]
             if isinstance(d, dict) and d.get("kind") == kind]
    need(len(found) == 1, "FIRST_CUT_DECLARATION_REQUIRED:" + kind)
    return found[0]


def validate_lead_provenance(publication):
    """Require a real lead-origin declaration and approval for agent-authored text."""
    lead = only_decision(publication, LEAD)
    need(set(lead) == {"kind", "origin", "source_ref", "evidence"}
         and lead["origin"] in ("author_original", "agent_authored", "not_applicable")
         and h.nonempty(lead["source_ref"])
         and isinstance(lead["evidence"], list)
         and lead["evidence"] and all(h.nonempty(s) for s in lead["evidence"]),
         "FIRST_CUT_LEAD_PROVENANCE_INVALID")
    if lead["origin"] == "agent_authored":
        approvals = [a for a in publication["context"]["approvals"]
                     if a["scope"] == APPROVAL_SCOPE]
        need(len(approvals) == 1
             and approvals[0]["status"] == "confirmed"
             and h.nonempty(approvals[0]["decision"])
             and approvals[0]["evidence"],
             "AGENT_LEAD_EXPLICIT_FOUNDER_APPROVAL_REQUIRED")
    return lead
