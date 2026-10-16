#!/usr/bin/env python3
"""Executable, read-only domain receipt validators for all 15 logical modules.

Each handler validates *independent external operator evidence*, NEVER performs
a clinical judgment, HTML edit, Drive upload, GitHub commit, scientific call, or
publish. A successful receipt is CONTRACT_VALIDATED_STAGING_ONLY, not a claim
that a live workflow ran. Real effects are explicitly deferred to later stages.
No handler can create founder approval. No raw private content enters reports.
"""
import hashlib
import json
import re

SHA = re.compile(r"^[0-9a-f]{64}$")
TYPES = {"digest", "text", "bool_true", "bool_false", "nonnegative", "positive",
         "list", "mapping", "zero", "one", "optional_digest"}
# Only public-safe metadata is allowed in reports; the digest proves identity,
# not integrity of an external artifact unless checked by the external verifier.
SCHEMAS = {
    "intake:route": {
        "route": "text", "request_digest": "digest",
        "source_snapshot_digest": "digest", "user_strings_preserved": "bool_true",
    },
    "page:draft": {
        "page_artifact_digest": "digest", "same_type_template_digest": "digest",
        "original_user_text_preserved": "bool_true", "intro_gate_satisfied": "bool_true",
        "category_identity_verified": "bool_true",
    },
    "taxonomy:lock": {
        "live_main_taxonomy_digest": "digest", "decision_digest": "digest",
        "decision_announced": "bool_true", "ambiguous_decision": "bool_false",
    },
    "navigation:publish": {
        "navigation_artifact_digest": "digest", "landing_index_digest": "digest",
        "related_link_count": "nonnegative", "taxonomy_lock_verified": "bool_true",
    },
    "semantic-links:specialist": {
        "analysis_digest": "digest", "fresh_47": "bool_true", "fresh_48": "bool_true",
        "fresh_49": "bool_true", "related_link_count": "nonnegative",
        "unresolved_candidates": "zero", "episode_surface_checked": "bool_true",
    },
    "semantic-links:litecast": {
        "analysis_digest": "digest", "fresh_05": "bool_true", "fresh_06": "bool_true",
        "specialist_links_count": "zero", "related_link_count": "nonnegative",
        "unresolved_candidates": "zero", "litecast_domain_verified": "bool_true",
    },
    "paper-cabinet:drive": {
        "drive_upload_receipt_digest": "digest", "folder_choice_verified": "bool_true",
        "paper_identity_digest": "digest",
    },
    "paper-cabinet:catalog": {
        "catalog_artifact_digest": "digest", "drive_receipt_digest": "digest",
        "metadata_verified": "bool_true",
    },
    "paper-cabinet:credit": {
        "page_credit_artifact_digest": "digest", "doi_verified": "bool_true",
        "first_author_verified": "bool_true",
    },
    "learning-assets:flashcards": {
        "faq_corpus_artifact_digest": "digest", "grounded_in_source": "bool_true",
        "no_fabricated_items": "bool_true",
    },
    "learning-assets:quiz": {
        "quiz_artifact_digest": "digest", "questions_self_contained": "bool_true",
        "binary_verdicts_verified": "bool_true",
    },
    "evidence:des-fidelity": {
        "input_basis_digest": "digest", "engine_version_digest": "digest",
        "engine_result_digest": "digest", "independent_checks_verified": "bool_true",
        "scientific_validator_receipt_digest": "digest",
        "all_founder_scientific_gates_verified": "bool_true",
    },
    "challenge:public": {
        "public_page_question_digest": "digest", "challenge_index_artifact_digest": "digest",
        "answer_not_in_git_verified": "bool_true", "private_handoff_ready": "bool_true",
        "admin_setup_status_recorded": "bool_true",
    },
    "brain:append": {
        "brain_artifact_digest": "digest", "entry_at_absolute_tail": "bool_true",
        "same_type_keys_match": "bool_true", "canonical_hashtags_checked": "bool_true",
        "taxonomy_lock_unchanged": "bool_true",
    },
    "pathways:place": {
        "pathway_analysis_digest": "digest", "all_paths_semantically_checked": "bool_true",
        "bundle_gates_resolved": "bool_true", "required_approvals_verified": "bool_true",
    },
    "notification:pulse": {
        "pulse_artifact_digest": "digest", "no_spoilers_verified": "bool_true",
        "category_convention_checked": "bool_true",
    },
    "build:version": {
        "content_version_digest": "digest", "stamp_after_writes": "bool_true",
    },
    "build:rebuild": {
        "build_artifact_digest": "digest", "canonical_builder_order": "bool_true",
        "build_tools_main_sourced": "bool_true", "finished_before_english": "bool_true",
    },
    "build:version-final": {
        "content_version_digest": "digest", "stamp_after_writes": "bool_true",
        "stamp_recomputed_from_final_sources": "bool_true",
    },
    "english:mirror": {
        "english_page_artifact_digest": "digest", "fa_en_toggle_both_directions": "bool_true",
        "english_noindex": "bool_true", "no_english_hreflang": "bool_true",
        "same_type_jsonld_shape": "bool_true",
    },
    "notification:push-marker": {
        "notification_marker_count": "one", "new_page_id_verified": "bool_true",
        "marker_artifact_digest": "digest",
    },
    "verify:phase-f": {
        "phase_f_exit_code": "zero", "phase_f_stdout_digest": "digest",
        "all_required_module_receipts_present": "bool_true",
        "all_founder_approvals_verified": "bool_true", "fresh_semantic_receipts": "bool_true",
        "expected_strings_exact": "bool_true", "last_version_stamp_verified": "bool_true",
    },
    "verify:paper-only": {
        "drive_and_catalog_receipts_verified": "bool_true",
        "paper_catalog_commit_digest": "digest",
        "no_page_publication_performed": "bool_true",
    },
}
SKIPS = {
    "learning-assets:flashcards": {"DENTCAST_PLUS_SOURCE_TIPS_NOT_PROVIDED"},
    "evidence:des-fidelity": {"FOUNDER_APPROVED_NO_DES",
                              "CANONICAL_NO_CITED_SOURCE_ELIGIBLE"},
}


def _require(condition, code):
    if not condition:
        raise ValueError(code)


def _validate_fields(step_id, values):
    _require(isinstance(values, dict), "OUTPUT_NOT_OBJECT")
    fields = SCHEMAS[step_id]
    _require(set(values) == set(fields), "OUTPUT_SCHEMA_MISMATCH:" + step_id)
    for name, typ in fields.items():
        value = values[name]
        if typ == "digest":
            valid = isinstance(value, str) and SHA.fullmatch(value) is not None
        elif typ == "optional_digest":
            valid = value is None or (isinstance(value, str) and SHA.fullmatch(value))
        elif typ == "text":
            valid = isinstance(value, str) and bool(value.strip()) and len(value) <= 128
        elif typ == "bool_true":
            valid = value is True
        elif typ == "bool_false":
            valid = value is False
        elif typ in ("nonnegative", "positive", "zero", "one"):
            valid = type(value) is int and (value >= 0 if typ == "nonnegative" else
                                            value >= 1 if typ == "positive" else
                                            value == 0 if typ == "zero" else value == 1)
        elif typ == "list":
            valid = isinstance(value, list)
        elif typ == "mapping":
            valid = isinstance(value, dict)
        else:
            valid = False
        _require(valid, "INVALID_OUTPUT_FIELD:" + step_id + ":" + name)
    if step_id.startswith("semantic-links:") or step_id == "navigation:publish":
        _require(values["related_link_count"] <= 5, "RELATED_LINK_HARD_CAP_EXCEEDED")
    return True


def intake(step_id, output, ctx):
    _validate_fields(step_id, output)
    _require(output["route"] == ctx["route"], "ROUTE_IDENTITY_MISMATCH")


def page(step_id, output, ctx):
    _validate_fields(step_id, output)


def taxonomy(step_id, output, ctx):
    _validate_fields(step_id, output)


def navigation(step_id, output, ctx):
    _validate_fields(step_id, output)


def semantic_links(step_id, output, ctx):
    _validate_fields(step_id, output)
    _require(("litecast" in step_id) == ctx["route"].startswith("litecast"),
             "SEMANTIC_UNIVERSE_MISMATCH")


def paper_cabinet(step_id, output, ctx):
    _validate_fields(step_id, output)
    _require(ctx["has_paper"], "PAPER_MODULE_REQUIRES_ATTACHMENT")
    if step_id.endswith(":credit"):
        _require(ctx["has_text"], "PAPER_ONLY_CREDIT_FORBIDDEN")


def learning_assets(step_id, output, ctx):
    _validate_fields(step_id, output)
    _require(not ctx["challenge"] and not ctx["route"].startswith("litecast"),
             "LEARNING_ASSETS_ROUTE_FORBIDDEN")


def evidence(step_id, output, ctx):
    _validate_fields(step_id, output)
    _require(not ctx["challenge"] and not ctx["route"].startswith("litecast"),
             "EVIDENCE_ROUTE_FORBIDDEN")


def challenge(step_id, output, ctx):
    _validate_fields(step_id, output)
    _require(ctx["challenge"], "CHALLENGE_ROUTE_REQUIRED")


def brain(step_id, output, ctx):
    _validate_fields(step_id, output)
    _require(not ctx["route"].startswith("litecast"), "LITECAST_SPECIALIST_BRAIN_FORBIDDEN")


def pathways(step_id, output, ctx):
    _validate_fields(step_id, output)
    _require(not ctx["challenge"] and not ctx["route"].startswith("litecast"),
             "PATHWAYS_ROUTE_FORBIDDEN")


def notification(step_id, output, ctx):
    _validate_fields(step_id, output)
    if step_id.endswith(":push-marker"):
        _require(not ctx["route"].startswith("litecast") and ctx.get("category") != "glossary",
                 "NOTIFICATION_MARKER_ROUTE_FORBIDDEN")


def build(step_id, output, ctx):
    _validate_fields(step_id, output)
    _require(ctx["has_text"], "BUILD_PAPER_ONLY_FORBIDDEN")


def english(step_id, output, ctx):
    _validate_fields(step_id, output)
    _require(not ctx["challenge"] and not ctx["route"].startswith("litecast"),
             "ENGLISH_CANONICAL_EXCEPTION")


def verify(step_id, output, ctx):
    _validate_fields(step_id, output)
    _require((step_id == "verify:paper-only") == (ctx["route"] == "paper-only"),
             "WRONG_COMPLETION_GATE")


HANDLERS = {
    "intake": intake, "page": page, "taxonomy": taxonomy,
    "navigation": navigation, "semantic-links": semantic_links,
    "paper-cabinet": paper_cabinet, "learning-assets": learning_assets,
    "evidence": evidence, "challenge": challenge, "brain": brain,
    "pathways": pathways, "notification": notification, "build": build,
    "english": english, "verify": verify,
}


def validate_report(step, report, context, expected_input_digest):
    """Validate an external operator report without trusting it as publication proof."""
    _require(isinstance(step, dict) and isinstance(context, dict), "INVALID_CONTEXT")
    step_id = step["step_id"]
    module_id = step["module_id"]
    _require(step_id in SCHEMAS and HANDLERS.get(module_id) is not None,
             "UNKNOWN_STEP_OR_MODULE")
    _require(step_id.split(":", 1)[0] == module_id, "WRONG_MODULE_OWNER")
    _require(isinstance(report, dict), "REPORT_NOT_OBJECT")
    required = {"step_id", "module_id", "input_digest", "status", "outputs",
                "external_receipt_digest", "approval_receipt_digest", "error"}
    _require(set(report) == required, "REPORT_SCHEMA_MISMATCH")
    _require(report["step_id"] == step_id and report["module_id"] == module_id,
             "REPORT_STEP_IDENTITY_MISMATCH")
    _require(report["input_digest"] == expected_input_digest and
             isinstance(expected_input_digest, str) and SHA.fullmatch(expected_input_digest),
             "STALE_OR_INVALID_INPUT")
    _require(report["status"] in {"completed", "skipped_with_reason",
                                    "awaiting_approval", "blocked", "failed"},
             "INVALID_REPORT_STATUS")
    if report["status"] == "completed":
        _require(isinstance(report["external_receipt_digest"], str) and
                 SHA.fullmatch(report["external_receipt_digest"]) is not None,
                 "NO_INDEPENDENT_EXTERNAL_RECEIPT")
        _require(report["error"] is None, "COMPLETED_WITH_ERROR")
        _require(report["approval_receipt_digest"] is None or
                 (isinstance(report["approval_receipt_digest"], str) and
                  SHA.fullmatch(report["approval_receipt_digest"]) is not None),
                 "INVALID_APPROVAL_DIGEST")
        HANDLERS[module_id](step_id, report["outputs"], context)
        return {"status": "contract_validated_staging_only", "step_id": step_id,
                "module_id": module_id, "report_digest": hash_public(report),
                "verification": {"shape_and_route": True, "real_effect_verified": False},
                "execution_authorized": False}
    if report["status"] == "skipped_with_reason":
        allowed = SKIPS.get(step_id, set())
        _require(isinstance(report["outputs"], dict) and
                 set(report["outputs"]) == {"canonical_skip_rule"} and
                 report["outputs"]["canonical_skip_rule"] in allowed,
                 "UNAUTHORIZED_SKIP")
        if report["outputs"]["canonical_skip_rule"] in {
                "FOUNDER_APPROVED_NO_DES", "DENTCAST_PLUS_SOURCE_TIPS_NOT_PROVIDED"}:
            _require(isinstance(report["approval_receipt_digest"], str) and
                     SHA.fullmatch(report["approval_receipt_digest"]) is not None,
                     "SKIP_REQUIRES_FOUNDER_APPROVAL_RECEIPT")
        return {"status": "canonical_skip_staging_only", "step_id": step_id,
                "module_id": module_id, "report_digest": hash_public(report),
                "verification": {"shape_and_route": True, "real_effect_verified": False},
                "execution_authorized": False}
    _require(report["outputs"] == {}, "PAUSED_REPORT_MUST_NOT_CLAIM_OUTPUTS")
    _require(isinstance(report["error"], str) and bool(report["error"].strip())
             and len(report["error"]) < 256, "PAUSED_REPORT_REQUIRES_ERROR_CODE")
    return {"status": "paused_staging", "step_id": step_id, "module_id": module_id,
            "report_digest": hash_public(report),
            "reason": report["error"], "execution_authorized": False}


def hash_public(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, sort_keys=True,
                                     separators=(",", ":")).encode("utf-8")).hexdigest()
