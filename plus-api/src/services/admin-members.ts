import { query } from '../db.js';

export interface MemberQuery { q?: string; order?: 'newest' | 'oldest'; cursor?: string; limit?: number }

// Keep the timestamp as Postgres text in the cursor: JS Date truncates its
// microseconds, which can otherwise skip members on a page boundary.
export function memberCursor(value: string): { at: string; id: string } | null {
  try {
    const c = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
    if (typeof c.at !== 'string' || !Number.isFinite(Date.parse(c.at))
      || !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(c.id)) return null;
    return c;
  } catch { return null; }
}

export async function listMembers(input: MemberQuery) {
  const limit = input.limit ?? 25;
  const order = input.order ?? 'newest';
  const cursor = input.cursor ? memberCursor(input.cursor) : null;
  const direction = order === 'oldest' ? 'asc' : 'desc';
  const comparison = order === 'oldest' ? '>' : '<';
  const q = (input.q ?? '').trim();
  // EXISTS, rather than a join, keeps a Telegram+Google member ONE member.
  const result = await query<Record<string, unknown> & { id: string; joined_cursor: string }>(`
    select p.id, p.display_name, nullif(p.phone, '') as phone, p.created_at,
           p.created_at::text as joined_cursor, p.tier as cached_tier,
           (select ai.username from auth_identities ai where ai.user_id = p.id and ai.username is not null order by ai.provider, ai.id limit 1) as username,
           coalesce((select jsonb_agg(jsonb_build_object('provider', ai.provider, 'username', ai.username)
                     order by ai.provider) from auth_identities ai where ai.user_id = p.id), '[]') as identities,
           case when s.id is null then null else jsonb_build_object(
             'status', s.status, 'plan', s.plan, 'started_at', s.started_at,
             'expires_at', s.expires_at, 'is_founder', s.is_founder,
             'effective_status', case when s.status <> 'active' then s.status
               when s.expires_at <= now() then 'expired' else 'active' end) end as subscription,
           coalesce(s.status = 'active' and (s.expires_at is null or s.expires_at > now()), false)
             or exists(select 1 from premium_grants g where g.user_id = p.id
               and g.revoked_at is null and g.expires_at > now()) as is_premium,
           (select jsonb_build_object('granted_at', g.granted_at, 'expires_at', g.expires_at,
                     'revoked_at', g.revoked_at, 'extends_subscription', g.extends_subscription)
              from premium_grants g where g.user_id = p.id order by g.expires_at desc, g.id desc limit 1) as league_grant,
           (select jsonb_build_object('kind', a.meta->>'kind', 'source', a.meta->>'source', 'at', a.created_at)
              from user_activity a where a.user_id = p.id and a.action = 'subscription_activated'
              order by a.created_at desc, a.id desc limit 1) as last_subscription_event
      from profiles p left join subscriptions s on s.user_id = p.id
     where ($1 = '' or p.display_name ilike '%' || $1 || '%'
       or p.phone ilike '%' || $1 || '%' or p.id::text = $1
       or exists(select 1 from auth_identities ai where ai.user_id = p.id
           and ai.username ilike '%' || $1 || '%'))
       and ($2::timestamptz is null or (p.created_at, p.id) ${comparison} ($2::timestamptz, $3::uuid))
     order by p.created_at ${direction}, p.id ${direction} limit $4
  `, [q, cursor?.at ?? null, cursor?.id ?? null, limit + 1]);
  const rows = result.rows.slice(0, limit);
  const last = rows.at(-1);
  return {
    ok: true, order, count: rows.length,
    users: rows.map(({ joined_cursor: _, ...row }) => ({ ...row, tier: row.is_premium ? 'premium' : 'free' })),
    next_cursor: result.rows.length > limit && last
      ? Buffer.from(JSON.stringify({ at: last.joined_cursor, id: last.id })).toString('base64url') : null,
  };
}

// A separate, paged ledger keeps the member list bounded without hiding ANY
// payment history. A failed/canceled payment never implies a canceled subscription.
export async function memberPayments(userId: string, offset: number, limit: number) {
  const result = await query(`
    select * from (
      select id, 'gateway' as rail, gateway as kind, status, amount_rial,
             ref_id, order_id, coalesce(nullif(bank_ref, ''), (
               select nullif(a.meta->>'ref_number', '') from user_activity a
                where a.user_id = p.user_id and a.action = 'subscription_activated'
                  and a.meta->>'payment_id' = p.id::text
                order by a.created_at desc, a.id desc limit 1
             )) as bank_ref, null::text as reference, months, created_at, verified_at as reviewed_at
        from payments p where user_id = $1
      union all
      select id, 'manual' as rail, kind, status, amount_rial,
             null::text, null::text, null::text, reference, months, created_at, reviewed_at
        from gift_redemptions where user_id = $1
    ) ledger order by created_at desc, id desc, rail desc limit $2 offset $3
  `, [userId, limit + 1, offset]);
  return { ok: true, payments: result.rows.slice(0, limit), next_offset: result.rows.length > limit ? offset + limit : null };
}

