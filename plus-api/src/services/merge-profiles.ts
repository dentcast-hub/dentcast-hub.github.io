import type pg from 'pg';

/**
 * Merge one profile into another and delete the source. Used when a person turns
 * out to own two accounts — e.g. they signed in with Telegram first (account A,
 * no phone), later signed in with phone/OTP (a fresh account B), and then, while
 * logged in as B, connected Telegram. Telegram already identifies A, so B is a
 * duplicate of the same human: we fold B INTO A (A is kept) and remove B, so
 * afterwards phone AND Telegram both resolve to the single account A.
 *
 * MUST run inside a transaction (pass the transaction client). Every table that
 * references profiles(id) is repointed from `fromId` to `toId`; the two tables
 * with a composite per-user unique key (user_pathways, article_notes) have the
 * source's colliding rows dropped first so the repoint cannot violate the key.
 * Then phone / tier / streak record are consolidated onto the target and the
 * now-empty source row is deleted.
 *
 * Streak caches are best-effort (longest_streak is kept as the max); the append
 * -only user_activity log remains the source of truth, so displayStreak() still
 * self-corrects the live streak after the merge.
 */
export async function mergeProfiles(
  client: pg.PoolClient,
  fromId: string,
  toId: string,
): Promise<void> {
  if (fromId === toId) return;

  // --- Composite-unique tables: drop the source rows that would collide, then
  //     repoint the rest. --------------------------------------------------
  await client.query(
    `delete from user_pathways up
      where up.user_id = $1
        and exists (select 1 from user_pathways k
                     where k.user_id = $2 and k.pathway_id = up.pathway_id)`,
    [fromId, toId],
  );
  await client.query('update user_pathways set user_id = $2 where user_id = $1', [fromId, toId]);

  await client.query(
    `delete from article_notes an
      where an.user_id = $1
        and exists (select 1 from article_notes k
                     where k.user_id = $2 and k.content_id = an.content_id)`,
    [fromId, toId],
  );
  await client.query('update article_notes set user_id = $2 where user_id = $1', [fromId, toId]);

  // --- Plain repoints. No per-user unique key can collide here: card_state's
  //     (user_id, highlight_id) is safe because the highlights themselves move
  //     too; push_subscriptions.endpoint and auth_identities(provider, id) are
  //     GLOBALLY unique, so a value can live on only one of the two accounts.
  const plainTables = [
    'user_activity', 'highlights', 'card_state', 'collections',
    'subscriptions', 'payments', 'certificates', 'push_subscriptions',
    'auth_identities',
  ];
  for (const table of plainTables) {
    await client.query(`update ${table} set user_id = $2 where user_id = $1`, [fromId, toId]);
  }

  // --- Consolidate profile-level fields, then delete the source. Free the
  //     source phone BEFORE the target claims it, or the unique(phone) move
  //     would clash while both rows still hold it.
  const src = await client.query<{ phone: string | null; tier: string; longest_streak: number }>(
    'select phone, tier, longest_streak from profiles where id = $1',
    [fromId],
  );
  const from = src.rows[0];
  if (!from) return; // source vanished (already merged); nothing to do

  await client.query('update profiles set phone = null where id = $1', [fromId]);
  await client.query(
    `update profiles set
        phone          = coalesce(phone, $2),
        tier           = case when $3 = 'premium' then 'premium' else tier end,
        longest_streak = greatest(longest_streak, $4)
      where id = $1`,
    [toId, from.phone, from.tier, from.longest_streak],
  );
  await client.query('delete from profiles where id = $1', [fromId]);
}
