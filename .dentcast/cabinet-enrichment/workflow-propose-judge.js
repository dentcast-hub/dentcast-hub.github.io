export const meta = {
  name: 'cabinet-enrich',
  description: 'Read cabinet papers in batches of 10: Sonnet proposes tags and facts, mechanical gates, Opus judges every tag',
  phases: [
    { title: 'Propose', detail: 'Sonnet reads each paper once and writes proposals; mechanical check', model: 'sonnet' },
    { title: 'Judge', detail: 'Opus confirms or rejects every proposed tag and classifies the document', model: 'opus' },
  ],
}

// PROPOSE.md / JUDGE.md live next to this script in the repository
const S = '/home/user/dentcast-hub.github.io/.dentcast/cabinet-enrichment'
const W = args.work
const REPO = '/home/user/dentcast-hub.github.io'

const results = await pipeline(
  args.batches,
  (_, b) => agent(
    `Read ${S}/PROPOSE.md completely and follow it exactly. Work directory: ${W} (vocabulary.txt and aliases.json are there). ` +
    `Your papers: ${b.join(', ')}. Write proposal_<id>.json for each into the work directory. ` +
    `When all are written, run exactly: cd ${REPO} && python3 tools/cabinet_enrich.py check --work ${W} --ids ${b.join(',')} ` +
    `and end your reply with the JSON line it prints.`,
    { model: 'sonnet', phase: 'Propose', label: `propose ${b[0]}-${b[b.length - 1]}` }),
  (_, b) => agent(
    `Read ${S}/JUDGE.md completely and follow it exactly. Work directory: ${W}. ` +
    `Your papers: ${b.join(', ')}. Inputs: paper_<id>.json and checked_<id>.json in the work directory. ` +
    `Write judge_<id>.json into ${W}/J/ (one per paper). If a checked_<id>.json is missing, write nothing for that id and say so.`,
    { model: 'opus', phase: 'Judge', label: `judge ${b[0]}-${b[b.length - 1]}` }),
)
const done = results.filter(Boolean).length
log(`${done}/${args.batches.length} batches judged`)
return { batches: args.batches.length, judged: done }
