/* Portable, import-free handoff codec for connector-only agents.
 * Data transformations only. No shell, filesystem, Git, network or science.
 * Python/JS output parity is CI-gated.
 */
export const SCHEMA="publish-handoff-v3";
export const POLICY="fixed_three_deliveries_v1";
export const EDITORIAL_POLICY="fixed_three_deliveries_v2";
const modules=["01-hard-rules.md","02-routing-intake.md","03-litecast-and-page.md","04-taxonomy-and-navigation.md","05-semantic-linking.md","06-paper-ingestion.md","07-flashcards-and-quiz.md","08-des-fidelity.md","09-challenge.md","10-brain-and-pathways.md","11-build-and-version.md","12-english-notify-verify.md"];
const groups=[["rules"],["0","A","B.1","B.2","B.3","B.3.5","B.4","B.4.7","B.4.8","B.4.9","B.5"],["C.0","C.0.1","C.0.2","C.0.3","C.0.4","C.1","C.2","C.0.5","C.0.6"],["C.2.4","C.2.5","C.2.6","C.3","C.4","C.4.5","C.4.5-b","C.4.6"],["C.4.7","C.4.7-b","C.4.8","C.4.9"],["C.4.10.1","C.4.10.2","C.4.10.3"],["C.4.11","C.4.12"],["C.4.13"],["C.4.14"],["C.5.0","C.5","C.5.5","C.5.6","C.5.6-b"],["C.6","C.8","C.7"],["D","E","F","G"]];
const q=String.fromCharCode(96).repeat(3);
const BEGIN="<!-- dentcast-publish-state-v1 -->\n"+q+"json\n";
const END="\n"+q+"\n<!-- /dentcast-publish-state-v1 -->\n";
const need=(ok,msg)=>{if(!ok)throw new Error(msg);};
const nonempty=x=>typeof x==="string"&&!!x.trim();
const obj=x=>x!==null&&typeof x==="object"&&!Array.isArray(x);
const sameKeys=(x,keys)=>obj(x)&&JSON.stringify(Object.keys(x).sort())===JSON.stringify([...keys].sort());
const deepCopy=x=>JSON.parse(JSON.stringify(x));
const ascii=x=>JSON.stringify(x).replace(/[\u007f-\uffff]/g,c=>"\\u"+c.charCodeAt(0).toString(16).padStart(4,"0"));
function pretty(x,n=0){
  const p="  ".repeat(n),i="  ".repeat(n+1);
  if(Array.isArray(x))return x.length?"[\n"+x.map(v=>i+pretty(v,n+1)).join(",\n")+"\n"+p+"]":"[]";
  if(obj(x)){const ks=Object.keys(x).sort();return ks.length?"{\n"+ks.map(k=>i+ascii(k)+": "+pretty(x[k],n+1)).join(",\n")+"\n"+p+"}":"{}";}
  need(x===null||typeof x==="boolean"||typeof x==="string"||(typeof x==="number"&&Number.isFinite(x)),"UNSUPPORTED_JSON");
  return ascii(x);
}
const validPath=p=>nonempty(p)&&!p.startsWith("/")&&!p.includes("\\")&&!p.includes("\0")&&!/^[A-Za-z]:/.test(p)&&p.split("/").every(s=>s&&s!=="."&&s!=="..")&&p.split("/")[0].toLowerCase()!==".git";
export function plan(){return groups.flatMap((g,i)=>g.map(id=>({id,module:modules[i],status:"pending",evidence:[],reason:null})));}
export function newPublication(content_id,category,target_paths,context={}){
  const p={content_id,category,target_paths:[...target_paths].sort(),status:"in_progress",blocker:null,context:{
    inputs:context.inputs||[],decisions:[{kind:POLICY},{kind:EDITORIAL_POLICY},...(context.decisions||[])],
    approvals:context.approvals||[],pending_questions:context.pending_questions||[],
    validation:[],delivery:[],unrelated_changes:[]},steps:plan(),external_actions:[]};
  validate(p);return p;
}
// Only static pending suffix entries are reconstructible. Planned dynamic
// substeps are preserved because their presence cannot be inferred.
function compactSteps(rows){let i=rows.length;while(i&&rows[i-1].status==="pending"&&!rows[i-1].id.includes("/"))i--;return rows.slice(0,i);}
function expandSteps(p){
  const base=plan(),rows=[],given=p.steps;let idx=0;
  need(Array.isArray(given),"COMPACT_STEPS_INVALID");
  for(const step of given){
    need(obj(step)&&idx<base.length,"COMPACT_STEPS_INVALID");
    if(step.id===base[idx].id){rows.push(step);idx++;}
    else if(typeof step.id==="string"&&step.id.startsWith(base[idx].id+"/"))rows.push(step);
    else throw new Error("COMPACT_STEPS_NONPREFIX_OR_UNKNOWN");
  }
  return {...p,steps:[...rows,...base.slice(idx)]};
}
export function nextStep(p){return p.steps.find(s=>!["completed","skipped"].includes(s.status))?.id??null;}
export function validate(p){
  need(sameKeys(p,["content_id","category","target_paths","status","blocker","context","steps","external_actions"]),"PUBLICATION_FIELDS_INVALID");
  need(nonempty(p.content_id)&&nonempty(p.category),"IDENTITY_REQUIRED");
  need(["in_progress","blocked","verifying","cleanup_pending"].includes(p.status),"STATUS_INVALID");
  need(p.blocker===null||nonempty(p.blocker),"BLOCKER_INVALID");
  need(p.status!=="blocked"||nonempty(p.blocker),"BLOCKER_REQUIRED");
  need(Array.isArray(p.target_paths)&&p.target_paths.length&&p.target_paths.every(validPath)&&new Set(p.target_paths).size===p.target_paths.length&&!p.target_paths.includes(".dentcast/PUBLISH-HANDOFF.md"),"TARGET_PATHS_INVALID");
  need(obj(p.context)&&["inputs","decisions","approvals","pending_questions","validation","delivery","unrelated_changes"].every(k=>Array.isArray(p.context[k])),"CONTEXT_INVALID");
  need(p.context.decisions.some(x=>obj(x)&&x.kind===POLICY),"FIXED_DELIVERY_REQUIRED");
  const scopes=new Set();
  for(const a of p.context.approvals){
    need(sameKeys(a,["scope","decision","status","evidence"])&&nonempty(a.scope)&&["pending","confirmed","rejected","not_required"].includes(a.status)&&(a.decision===null||nonempty(a.decision))&&Array.isArray(a.evidence)&&a.evidence.every(nonempty),"APPROVAL_INVALID");
    need(a.status==="pending"||(nonempty(a.decision)&&a.evidence.length),"APPROVAL_EVIDENCE_REQUIRED");
    need(!scopes.has(a.scope),"DUPLICATE_APPROVAL");scopes.add(a.scope);
  }
  const base=plan(),indexes=new Map(base.map((x,i)=>[x.id,{...x,i}]));
  need(Array.isArray(p.steps)&&p.steps.length>=base.length,"FULL_CANONICAL_PLAN_REQUIRED");
  const ids=new Set();let lastModule=-1,unfinished=false;
  for(const s of p.steps){
    need(sameKeys(s,["id","module","status","evidence","reason"])&&nonempty(s.id)&&!ids.has(s.id),"STEP_FIELDS_OR_ID_INVALID");
    ids.add(s.id);
    const ref=indexes.get(s.id.split("/")[0]);
    need(ref&&ref.module===s.module,"STEP_MODULE_INVALID");
    const m=modules.indexOf(s.module);need(m>=lastModule,"MODULE_ORDER_INVALID");lastModule=m;
    need(["pending","started","completed","skipped","blocked","failed"].includes(s.status)&&Array.isArray(s.evidence)&&s.evidence.every(nonempty)&&(s.reason===null||nonempty(s.reason)),"STEP_VALUE_INVALID");
    need(s.status!=="completed"||s.evidence.length,"COMPLETION_EVIDENCE_REQUIRED");
    need(!["skipped","blocked","failed"].includes(s.status)||nonempty(s.reason),"STEP_REASON_REQUIRED");
    need(!unfinished||s.status==="pending","OUT_OF_ORDER_STEP_STATE");
    if(!["completed","skipped"].includes(s.status))unfinished=true;
    need(!["rules","0","F","G"].includes(s.id)||s.status!=="skipped","MANDATORY_STEP_SKIPPED");
  }
  need(JSON.stringify(p.steps.filter(x=>indexes.has(x.id)).map(x=>x.id))===JSON.stringify(base.map(x=>x.id)),"CANONICAL_ORDER_INVALID");
  for(const s of p.steps)if(s.id.includes("/"))
    need(p.steps.findIndex(x=>x.id===s.id)<p.steps.findIndex(x=>x.id===s.id.split("/")[0]),"SUBSTEP_ORDER_INVALID");
  need(Array.isArray(p.external_actions),"EXTERNAL_ACTIONS_INVALID");
  const actions=new Set();
  for(const a of p.external_actions){
    need(sameKeys(a,["id","target","status","evidence"])&&nonempty(a.id)&&nonempty(a.target)&&!actions.has(a.id)&&["started","outcome_unknown","completed","failed","not_performed"].includes(a.status)&&Array.isArray(a.evidence)&&a.evidence.every(nonempty)&&(["started","outcome_unknown"].includes(a.status)||a.evidence.length),"EXTERNAL_ACTION_INVALID");
    actions.add(a.id);
  }
  reconciledExternalFailures(p);
  return true;
}
export function updateStep(p,id,status,evidence=[],reason=null){
  validate(p);const next=nextStep(p);
  const cut=p.steps.findIndex(x=>x.id==="C.4.9"),i=p.steps.findIndex(x=>x.id===id);
  need(id===next&&i>=0&&i<=cut,"NOT_NEXT_PRE_CUT_STEP");
  need(!p.external_actions.some(x=>["started","outcome_unknown"].includes(x.status)),"EXTERNAL_OUTCOME_UNKNOWN");
  const x=p.steps[i];
  if(status==="started")need(x.status==="pending"&&!evidence.length&&reason===null,"START_PENDING_ONLY");
  else if(status==="completed")need(x.status==="started"&&evidence.length&&reason===null,"COMPLETE_REQUIRES_STARTED_AND_EVIDENCE");
  else if(status==="skipped")need(x.status==="pending"&&!["rules","0"].includes(id)&&nonempty(reason),"CANONICAL_SKIP_REQUIRED");
  else need(["blocked","failed"].includes(status)&&["pending","started"].includes(x.status)&&nonempty(reason),"BLOCK_REASON_REQUIRED");
  const out=deepCopy(p),s=out.steps[i];s.status=status;s.evidence=evidence;s.reason=reason;
  out.status=["blocked","failed"].includes(status)?"blocked":"in_progress";out.blocker=out.status==="blocked"?id+": "+reason:null;
  validate(out);return out;
}
function cutDeclarations(p){
  const find=k=>p.context.decisions.filter(d=>obj(d)&&d.kind===k);
  const leads=find("first_cut_lead_provenance_v1");
  need(leads.length===1,"FIRST_CUT_DECLARATION_REQUIRED:first_cut_lead_provenance_v1");
  const lead=leads[0];
  need(sameKeys(lead,["kind","origin","source_ref","evidence"])&&["author_original","agent_authored","not_applicable"].includes(lead.origin)&&nonempty(lead.source_ref)&&Array.isArray(lead.evidence)&&lead.evidence.length&&lead.evidence.every(nonempty),"FIRST_CUT_LEAD_PROVENANCE_INVALID");
  if(lead.origin==="agent_authored"){
    const approvals=p.context.approvals.filter(a=>a.scope==="authored-intro");
    need(approvals.length===1&&approvals[0].status==="confirmed"&&nonempty(approvals[0].decision)&&approvals[0].evidence.length,"AGENT_LEAD_EXPLICIT_FOUNDER_APPROVAL_REQUIRED");
  }
  const audits=find("first_cut_scope_audit_v1");
  need(audits.length===1,"FIRST_CUT_DECLARATION_REQUIRED:first_cut_scope_audit_v1");
  const a=audits[0];
  need(sameKeys(a,["kind","landing_path","landing_mode","builder_ref","related_changed_paths","observed_changed_paths","evidence"]),"FIRST_CUT_SCOPE_AUDIT_FIELDS");
  // Resolve the immediately containing directory, including nested series.
  const folder=p.content_id.split("/").slice(0,-1).join("/"),expected=folder==="episodes"?"episodes.html":folder+"/index.html";
  need(a.landing_path===expected,"FIRST_CUT_LANDING_IDENTITY");
  need(["included","generated_later","client_render"].includes(a.landing_mode)&&nonempty(a.builder_ref)&&Array.isArray(a.evidence)&&a.evidence.length&&a.evidence.every(nonempty),"FIRST_CUT_LANDING_REVIEW_REQUIRED");
  const targets=new Set(p.target_paths);
  if(a.landing_mode==="included")need(targets.has(a.landing_path),"FIRST_CUT_LANDING_NOT_DECLARED:"+a.landing_path);
  else need(!targets.has(a.landing_path),"FIRST_CUT_LANDING_MODE_CONTRADICTS_SCOPE");
  for(const key of ["related_changed_paths","observed_changed_paths"]){
    const paths=a[key];
    need(Array.isArray(paths)&&new Set(paths).size===paths.length,"FIRST_CUT_AUDIT_PATHS_INVALID:"+key);
    for(const path of paths)need(validPath(path)&&targets.has(path),"FIRST_CUT_CHANGED_PATH_NOT_DECLARED:"+path);
  }
  need(a.observed_changed_paths.includes(p.content_id+".html"),"FIRST_CUT_PAGE_NOT_OBSERVED_CHANGED");
}
const EXTERNAL_RECONCILIATION="external_action_reconciliation_v1";
function reconciledExternalFailures(p){
  const actions=new Map(p.external_actions.map((a,i)=>[a.id,{a,i}])),resolved=new Set();
  for(const r of p.context.decisions){
    if(!obj(r)||r.kind!==EXTERNAL_RECONCILIATION)continue;
    need(sameKeys(r,["kind","failed_id","successful_id","target","reason","verification_ref","evidence"])&&["failed_id","successful_id","target","reason","verification_ref"].every(k=>nonempty(r[k]))&&Array.isArray(r.evidence)&&r.evidence.length&&r.evidence.every(nonempty),"EXTERNAL_RECONCILIATION_INVALID");
    need(r.failed_id!==r.successful_id&&actions.has(r.failed_id)&&actions.has(r.successful_id)&&!resolved.has(r.failed_id),"EXTERNAL_RECONCILIATION_IDENTITIES");
    const f=actions.get(r.failed_id),s=actions.get(r.successful_id);
    need(f.i<s.i&&f.a.status==="failed"&&s.a.status==="completed"&&f.a.target===s.a.target&&s.a.target===r.target&&s.a.evidence.includes(r.verification_ref)&&r.evidence.includes(r.verification_ref),"EXTERNAL_RECONCILIATION_NOT_VERIFIED");
    resolved.add(r.failed_id);
  }
  return resolved;
}
function requireExternalOutcomes(p){
  const resolved=reconciledExternalFailures(p);
  need(!p.external_actions.some(a=>["started","outcome_unknown"].includes(a.status)||(a.status==="failed"&&!resolved.has(a.id))),"OPEN_DECISION_OR_ACTION");
}
export function renderCut1(p,compact=true){
  validate(p);const cut=p.steps.findIndex(x=>x.id==="C.4.9");
  need(cut>=0&&p.steps.slice(0,cut+1).every(x=>["completed","skipped"].includes(x.status))&&p.steps.slice(cut+1).every(x=>x.status==="pending")&&p.status==="in_progress"&&p.blocker===null,"FIRST_CUT_NOT_READY");
  need(!p.context.pending_questions.length,"OPEN_DECISION_OR_ACTION");
  requireExternalOutcomes(p);
  need(p.context.approvals.every(a=>["confirmed","not_required"].includes(a.status)),"FIRST_CUT_UNRESOLVED_APPROVAL");
  cutDeclarations(p);
  const state={schema:SCHEMA,publication:compact?{...p,steps:compactSteps(p.steps)}:p,reconciliation:null};
  const prefix="# Publication handoff\n\nSemantic progress and evidence; current Git facts are read from Git.\n- Schema: "+SCHEMA+"\n- Content: "+ascii(p.content_id)+"\n- Status: "+p.status+"\n- Next canonical step: "+ascii(nextStep(p))+"\n- Blocker: "+ascii(p.blocker)+"\n\nThe structured record preserves semantic decisions, approvals, scientific results, step outcomes and external actions.\nGit facts are reconstructed from Git and are not duplicated in this handoff.\n\n";
  return prefix+BEGIN+pretty(state)+END;
}
export function inspectCut1(wire){
  need(typeof wire==="string"&&wire.includes(BEGIN)&&wire.endsWith(END),"HANDOFF_FORMAT_INVALID");
  const x=JSON.parse(wire.split(BEGIN)[1].split(END)[0]);
  need(sameKeys(x,["schema","publication","reconciliation"])&&x.schema===SCHEMA&&x.reconciliation===null,"HANDOFF_V3_REQUIRED");
  const expanded={...x,publication:expandSteps(x.publication)};
  need(renderCut1(expanded.publication)===wire||renderCut1(expanded.publication,false)===wire,"HANDOFF_CANONICAL_ENCODING_MISMATCH");
  return {next_step:nextStep(expanded.publication),content_id:expanded.publication.content_id,state:expanded};
}
