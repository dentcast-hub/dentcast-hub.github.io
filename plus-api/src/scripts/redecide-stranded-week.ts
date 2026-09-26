/**
 * Apply the promotions a finalized week owed but never made.
 *
 * `finalizeWeek` is idempotent by design — it only touches groups whose status
 * is not yet 'finalized' — so fixing the validity rule (0068) changes every week
 * from now on and nothing about the week that was decided under the old one. For
 * zirconia in week 2026-09-19 that leaves a real result unpaid: two members,
 * 226 and 112 weekly XP, a group holding its tier's entire population, and an
 * outcome of 'stayed' for both because `filled` compared 2 against the capacity
 * floor of 3. Titanium therefore never opened.
 *
 * This is deliberately NOT a re-run of finalizeWeek. Re-deciding a week that
 * already moved people would rank them a second time from their NEW tier and
 * promote them twice, so the script refuses any group whose members did not all
 * stay — the only thing it can fix is a week where nothing happened.
 *
 * It applies PROMOTIONS ONLY, for the same reason 0068 left `filled` alone:
 * demotion is gated on the floored capacity, was correctly false at the time,
 * and is still false now. Nobody is pushed down by a retroactive correction.
 *
 * The population is an ARGUMENT, not a guess. 0068 adds no backfill because the
 * tier populations of past weeks are gone, and inventing them from today's
 * numbers would rewrite the past rather than record it. For the zirconia week it
 * is reconstructible from the audit trail and equals 2: the tier was created by
 * exactly the two promotions the 2026-09-12 finalize made out of
 * lithium-disilicate (`ceil(4 × 30%)`), and its population only reached 4 when
 * the 2026-09-19 finalize promoted two more in — the same finalize that left
 * these two behind.
 *
 * Dry run unless --apply. Everything happens in one transaction, and the
 * promotion notice needs no help from here: notifyLeagueOutcomes announces any
 * 'promoted' row whose week ended within FRESH_DAYS and which has not been
 * announced yet, which is exactly what this writes.
 *
 *   npx tsx src/scripts/redecide-stranded-week.ts --week 2026-09-19 --tier zirconia --population 2
 *   npx tsx src/scripts/redecide-stranded-week.ts --week 2026-09-19 --tier zirconia --population 2 --apply
 */

import { pool, withTransaction } from '../db.js';
import { getLeagueConfig, setLeagueConfig } from '../services/league-config.js';
import { getTiers, groupIsValid } from '../services/league.js';

interface Args { week: string; tier: string; population: number; apply: boolean; }

function parseArgs(argv: string[]): Args {
  const get = (flag: string): string | undefined => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const week = get('--week');
  const tier = get('--tier');
  const population = Number(get('--population'));
  if (!week || !tier || !Number.isFinite(population) || population <= 0) {
    throw new Error(
      'usage: --week YYYY-MM-DD --tier <slug> --population <n> [--apply]',
    );
  }
  return { week, tier, population, apply: argv.includes('--apply') };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  const result = await withTransaction(async (client) => {
    const cfg = await getLeagueConfig(client);
    const tiers = await getTiers(client);
    const byOrder = new Map(tiers.map((t) => [t.tier_order, t]));
    const tier = tiers.find((t) => t.slug === args.tier);
    if (!tier) throw new Error(`no tier with slug '${args.tier}'`);

    const groups = (await client.query<{
      id: string; status: string; capacity_at_creation: number; population_at_creation: number | null;
    }>(
      `select id, status, capacity_at_creation, population_at_creation from leagues
        where tier_id = $1 and week_start = $2 order by id for update`,
      [tier.id, args.week],
    )).rows;
    if (groups.length === 0) throw new Error(`no ${args.tier} group in week ${args.week}`);
    if (groups.length > 1) {
      throw new Error(
        `${groups.length} groups in that (tier, week) — this script handles the thin single-group case only`,
      );
    }
    const g = groups[0];
    if (g.status !== 'finalized') throw new Error(`that group is '${g.status}', not finalized — let the scheduler decide it`);

    const members = (await client.query<{
      id: string; user_id: string; display_name: string | null; weekly_xp: number;
      final_rank: number | null; outcome: string;
    }>(
      `select m.id, m.user_id, p.display_name, m.weekly_xp, m.final_rank, m.outcome
         from league_members m join profiles p on p.id = m.user_id
        where m.league_id = $1
        order by m.weekly_xp desc, m.first_reached_current_xp_at asc nulls last, m.id asc`,
      [g.id],
    )).rows;

    const moved = members.filter((m) => m.outcome !== 'stayed');
    if (moved.length > 0) {
      throw new Error(
        `${moved.length} member(s) of that group already moved (${moved.map((m) => m.outcome).join(', ')}) — refusing: re-deciding would rank them again from their new tier`,
      );
    }

    const size = members.length;
    const wasValid = groupIsValid(size, g.capacity_at_creation, g.population_at_creation, cfg);
    const nowValid = groupIsValid(size, g.capacity_at_creation, args.population, cfg);
    const up = byOrder.get(tier.tier_order + 1) ?? null;
    const promotedCount = Math.ceil((size * cfg.promotion_pct) / 100);

    const lines: string[] = [];
    lines.push(`group        ${g.id}`);
    lines.push(`tier         ${tier.slug} (order ${tier.tier_order}) -> ${up ? up.slug : '<no tier above>'}`);
    lines.push(`size         ${size}   capacity ${g.capacity_at_creation}   population on row ${g.population_at_creation ?? 'null'} -> ${args.population}`);
    lines.push(`validity     was ${wasValid} , now ${nowValid}   (floor ${cfg.min_valid_group_size}, rankable ${cfg.min_rankable_group_size})`);
    lines.push(`promo zone   top ${promotedCount} of ${size}, xp floor ${cfg.promotion_min_weekly_xp}`);
    for (const [i, m] of members.entries()) {
      lines.push(`  #${i + 1} xp=${m.weekly_xp} rank_on_row=${m.final_rank ?? '-'} ${m.display_name ?? m.user_id}`);
    }

    if (!nowValid) {
      lines.push('=> still not a valid group under the current rule. Nothing to do.');
      return { lines, promoted: [] as string[], applied: false };
    }
    if (!up) {
      lines.push('=> nothing above this tier to promote into. Nothing to do.');
      return { lines, promoted: [] as string[], applied: false };
    }

    const winners = members
      .slice(0, promotedCount)
      .filter((m) => m.weekly_xp >= cfg.promotion_min_weekly_xp);
    if (winners.length === 0) {
      lines.push('=> nobody in the promotion zone clears the xp floor. Nothing to do.');
      return { lines, promoted: [] as string[], applied: false };
    }
    lines.push(`=> promote ${winners.length}: ${winners.map((m) => m.display_name ?? m.user_id).join(', ')}`);
    if (!up.is_active) lines.push(`=> and open ${up.slug} (tier_order ${up.tier_order})`);

    if (!args.apply) {
      lines.push('(dry run — pass --apply to write)');
      return { lines, promoted: winners.map((m) => m.display_name ?? m.user_id), applied: false };
    }

    // Record the population the decision was made against, so the row now states
    // the fact the rule reads rather than leaving the next reader to re-derive it.
    await client.query('update leagues set population_at_creation = $2 where id = $1', [g.id, args.population]);

    for (const [i, m] of members.entries()) {
      const rank = i + 1;
      const won = winners.some((w) => w.id === m.id);
      await client.query(
        'update league_members set final_rank = $2, outcome = $3 where id = $1',
        [m.id, rank, won ? 'promoted' : 'stayed'],
      );
      if (won) {
        await client.query('update profiles set current_tier_id = $2 where id = $1', [m.user_id, up.id]);
      }
    }

    if (!up.is_active) {
      await client.query(
        'update league_tiers set is_active = true, activated_at = now() where id = $1', [up.id],
      );
      const maxActive = Math.max(...tiers.filter((t) => t.is_active).map((t) => t.tier_order));
      if (up.tier_order > maxActive) {
        await setLeagueConfig(
          'max_active_tier_order', String(up.tier_order),
          { triggerMetric: `retroactive promotion opened ${up.slug} (from ${tier.slug}, week ${args.week}; 0068)` },
          client,
        );
      }
    }

    // The weekly report is a report: leaving it saying 0 promotions for a week
    // that now has some would make the dashboard disagree with the rows.
    await client.query(
      `update league_weekly_stats set promotions = promotions + $2 where week_start = $1`,
      [args.week, winners.length],
    );

    return { lines, promoted: winners.map((m) => m.display_name ?? m.user_id), applied: true };
  });

  for (const l of result.lines) console.log(l);
  if (result.applied) console.log(`\nAPPLIED. promoted: ${result.promoted.join(', ')}`);
  await pool.end();
}

main().catch(async (e) => {
  console.error(`\n✗ ${e instanceof Error ? e.message : String(e)}`);
  await pool.end().catch(() => {});
  process.exit(1);
});
