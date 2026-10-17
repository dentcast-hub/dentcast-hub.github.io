import { createRequire } from 'node:module';
import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb } from './helpers.js';
import { pool } from '../src/db.js';
import { config } from '../src/config.js';
import { activateDays, revokeSubscription, sweepExpiredSubscriptions, subscriptionReport } from '../src/services/subscription.js';
import { MAX_SPOT_IMAGE_BYTES, SPOT_PLACEMENTS } from '../src/services/spot-controls.js';

let app: FastifyInstance;
const headers = { authorization: 'Basic ' + Buffer.from(`${config.admin.user}:${config.admin.password}`).toString('base64') };
const creative = { enabled: true, badge: 'حمایت‌شده', title: 'آزمون', text: 'متن', cta: '', url: '', image: null };

beforeEach(async () => {
  await resetDb();
  await pool.query('truncate spot_controls');
  vi.unstubAllGlobals();
  delete process.env.SPOT_GITHUB_TOKEN;
  if (!app) app = await makeApp();
});
afterAll(async () => { vi.unstubAllGlobals(); delete process.env.SPOT_GITHUB_TOKEN; await app?.close(); await pool.end(); });

async function member(name = 'عضو') {
  return (await pool.query("insert into profiles (phone, display_name) values (null, $1) returning id", [name])).rows[0].id as string;
}

describe('member review', () => {
  it('requires admin credentials before parsing or validating any new admin route', async () => {
    for (const request of [
      { method: 'GET' as const, url: '/admin/users' },
      { method: 'GET' as const, url: '/admin/users/search?q=عضو' },
      { method: 'GET' as const, url: '/admin/users/bad/payments' },
      { method: 'GET' as const, url: '/admin/spot/config' },
      { method: 'GET' as const, url: '/admin/spot/defaults' },
      { method: 'PUT' as const, url: '/admin/spot/config/home', payload: '{', headers: { 'content-type': 'application/json' } },
      { method: 'POST' as const, url: '/admin/spot/image', payload: 'not an image', headers: { 'content-type': 'image/webp' } },
      { method: 'POST' as const, url: '/admin/spot/config/home/reset' },
    ]) expect((await app.inject(request)).statusCode).toBe(401);
  });
  it('pages past the old cap in both directions, including microsecond timestamp ties', async () => {
    await pool.query(`insert into profiles (phone, display_name, created_at)
      select null, 'عضو ' || i, '2026-01-01T00:00:00Z'::timestamptz + (i / 2) * interval '1 microsecond'
      from generate_series(1, 63) i`);
    for (const order of ['newest', 'oldest']) {
      let cursor = '', ids: string[] = [];
      do {
        const response = await app.inject({ url: '/admin/users?limit=7&order=' + order + (cursor ? '&cursor=' + cursor : ''), headers });
        expect(response.statusCode).toBe(200);
        const body = response.json(); ids.push(...body.users.map((u: { id: string }) => u.id)); cursor = body.next_cursor;
      } while (cursor);
      expect(ids).toHaveLength(63); expect(new Set(ids).size).toBe(63);
      const sorted = (await pool.query('select id from profiles order by created_at ' + (order === 'newest' ? 'desc, id desc' : 'asc, id asc'))).rows.map(r => r.id);
      expect(ids).toEqual(sorted);
    }
  });
  it('searches identities without duplicate members and rejects bad pagination', async () => {
    const id = await member('صدرا');
    await pool.query("insert into auth_identities (user_id, provider, provider_user_id, username) values ($1, 'telegram', '70001', 'sadraadent')", [id]);
    const result = await app.inject({ url: '/admin/users/search?q=sadra', headers });
    expect(result.json().users.map((r: { id: string }) => r.id)).toEqual([id]);
    for (const q of ['order=desc;drop', 'limit=0', 'limit=1000', 'cursor=garbage']) {
      expect((await app.inject({ url: '/admin/users?' + q, headers })).statusCode).toBe(400);
    }
  });
  it('derives expiry before the sweep and never trusts the tier cache', async () => {
    const stale = await member('stale'), active = await member('active'), expired = await member('expired'), revoked = await member('revoked');
    await pool.query("update profiles set tier = 'premium' where id = $1", [stale]);
    await activateDays(active, 2, { source: 'admin' });
    await pool.query("update profiles set tier = 'free' where id = $1", [active]);
    await activateDays(expired, 2, { source: 'admin' });
    await pool.query("update subscriptions set expires_at = now() - interval '1 day' where user_id = $1", [expired]);
    await activateDays(revoked, 2, { source: 'admin' }); await revokeSubscription(revoked, { source: 'admin' });
    const users = (await app.inject({ url: '/admin/users', headers })).json().users;
    const get = (id: string) => users.find((u: { id: string }) => u.id === id);
    expect(get(stale).is_premium).toBe(false); expect(get(active).is_premium).toBe(true);
    expect(get(active).subscription.started_at).toBeTruthy(); expect(get(active).subscription.expires_at).toBeTruthy();
    expect(get(expired).subscription).toMatchObject({ status: 'active', effective_status: 'expired' });
    expect(get(expired).is_premium).toBe(false); expect(get(revoked).last_subscription_event.kind).toBe('revoked');
  });
  it('shows an independent league prize, but not an expired prize', async () => {
    const active = await member(), expired = await member();
    await pool.query(`insert into premium_grants (user_id, week_start, expires_at) values
      ($1, '2026-01-03', now() + interval '1 day'), ($2, '2026-01-03', now() - interval '1 day')`, [active, expired]);
    const users = (await app.inject({ url: '/admin/users', headers })).json().users;
    expect(users.find((u: { id: string }) => u.id === active).is_premium).toBe(true);
    expect(users.find((u: { id: string }) => u.id === expired).is_premium).toBe(false);
  });
  it('agrees with the canonical subscription sweep/report when a stacked prize survives revocation', async () => {
    const id = await member('stacked prize');
    await activateDays(id, 2, { source: 'admin' });
    await pool.query(`insert into premium_grants (user_id, week_start, expires_at, extends_subscription)
      values ($1, '2026-01-03', now() + interval '1 day', true)`, [id]);
    await revokeSubscription(id, { source: 'admin' });
    await sweepExpiredSubscriptions();
    expect((await pool.query('select tier from profiles where id = $1', [id])).rows[0].tier).toBe('premium');
    expect((await subscriptionReport()).totals.league_premium_now).toBe(1);
    const response = await app.inject({ url: '/admin/users', headers });
    expect(response.json().users.find((u: { id: string }) => u.id === id)).toMatchObject({ is_premium: true, subscription: null });
    await pool.query('update premium_grants set revoked_at = now() where user_id = $1', [id]);
    const revoked = await app.inject({ url: '/admin/users', headers });
    expect(revoked.json().users.find((u: { id: string }) => u.id === id).is_premium).toBe(false);
  });
  it('recovers historical bank references already stored in activation audit metadata', async () => {
    const id = await member();
    const payment = (await pool.query("insert into payments (user_id, amount_rial, gateway, ref_id, status, months) values ($1, 1000, 'zibal', 'legacy-track', 'paid', 1) returning id", [id])).rows[0].id;
    await pool.query("insert into user_activity (user_id, action, meta) values ($1, 'subscription_activated', $2)", [id, JSON.stringify({ payment_id: payment, ref_number: 'legacy-bank-ref', source: 'payment' })]);
    const response = await app.inject({ url: '/admin/users/' + id + '/payments', headers });
    expect(response.statusCode).toBe(200);
    expect(response.json().payments[0].bank_ref).toBe('legacy-bank-ref');
    expect((await pool.query('select bank_ref from payments where id = $1', [payment])).rows[0].bank_ref).toBeNull();
  });
  it('pages both ledgers and exposes existing references, not gift bearer codes', async () => {
    const id = await member();
    await pool.query("insert into payments (user_id, amount_rial, gateway, ref_id, order_id, bank_ref, status, months) values ($1, 1000, 'zibal', 'track', 'order', 'bank', 'canceled', 1)", [id]);
    await pool.query("insert into gift_redemptions (user_id, code, kind, months, status, reference) values ($1, 'private-code', 'apple_us', 1, 'approved', 'DENT-123')", [id]);
    const first = (await app.inject({ url: '/admin/users/' + id + '/payments?limit=1', headers })).json();
    expect(first.next_offset).toBe(1);
    const second = (await app.inject({ url: '/admin/users/' + id + '/payments?limit=1&offset=1', headers })).json();
    expect(second.next_offset).toBe(null);
    const rows = first.payments.concat(second.payments);
    expect(rows.find((r: { rail: string }) => r.rail === 'gateway')).toMatchObject({ ref_id: 'track', order_id: 'order', bank_ref: 'bank', status: 'canceled' });
    expect(rows.find((r: { rail: string }) => r.rail === 'manual').reference).toBe('DENT-123');
    expect(JSON.stringify(rows)).not.toContain('private-code');
  });
});

describe('published Spot defaults', () => {
  const defaults = { enabled: true, slots: Object.fromEntries(Object.keys(SPOT_PLACEMENTS).map(slot => [slot, { enabled: true }])),
    rotation: { sequence: ['premium'] }, creatives: { premium: { title: 'published' }, sponsors: [] } };
  it('reads published defaults server-side without a GitHub token', async () => {
    const remote = vi.fn().mockResolvedValue(new Response(JSON.stringify(defaults), { status: 200 }));
    vi.stubGlobal('fetch', remote);
    const response = await app.inject({ url: '/admin/spot/defaults', headers });
    expect(response.statusCode).toBe(200); expect(response.json()).toEqual(defaults);
    expect(remote.mock.calls[0][0]).toMatch(/^https:\/\/dentcast\.ir\/spot\/spot-config\.json\?_dc=/);
    expect(response.headers['cache-control']).toBe('no-store');
    expect(JSON.stringify(remote.mock.calls)).not.toContain('authorization');
  });
  it('uses the second published mirror when the first fails', async () => {
    const remote = vi.fn().mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce(new Response(JSON.stringify(defaults), { status: 200 }));
    vi.stubGlobal('fetch', remote);
    expect((await app.inject({ url: '/admin/spot/defaults', headers })).json()).toEqual(defaults);
    expect(remote.mock.calls[1][0]).toContain('https://dentcast.org/spot/spot-config.json');
  });
  it('reports unavailable or malformed defaults without inventing disabled placements', async () => {
    for (const body of ['{}', 'null', JSON.stringify({ enabled: true, slots: {}, creatives: {} })]) {
      vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => new Response(body, { status: 200 })));
      const response = await app.inject({ url: '/admin/spot/defaults', headers });
      expect(response.statusCode).toBe(503); expect(response.json()).toEqual({ error: 'spot_defaults_unavailable' });
    }
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => new Response('{}', { status: 503 })));
    expect((await app.inject({ url: '/admin/spot/defaults', headers })).statusCode).toBe(503);
  });
});

describe('persistent Spot controls', () => {
  it('retains saved controls through migration rollback and reapplication', async () => {
    await app.inject({ method: 'PUT', url: '/admin/spot/config/home', headers, payload: creative });
    const migration = createRequire(import.meta.url)('../migrations/0069_member_spot_controls.cjs');
    migration.down();
    const sql: string[] = []; migration.up({ sql: (value: string) => sql.push(value) });
    for (const statement of sql) await pool.query(statement);
    expect((await app.inject('/spot/config')).json().slots.home.creative.title).toBe(creative.title);
  });
  it('leaves all current campaigns alone until saved, persists independent slots across app restarts', async () => {
    expect((await app.inject('/spot/config')).json()).toEqual({ slots: {} });
    for (const slot of ['home', 'article', 'sidebar']) {
      expect((await app.inject({ method: 'PUT', url: '/admin/spot/config/' + slot, headers, payload: { ...creative, title: slot } })).statusCode).toBe(200);
    }
    await app.close(); app = await makeApp();
    const saved = (await app.inject('/spot/config')).json().slots;
    expect(Object.keys(saved).sort()).toEqual(['article', 'home', 'sidebar']);
    expect(saved.home.creative.title).toBe('home');
    expect((await app.inject({ method: 'PUT', url: '/admin/spot/config/article', headers, payload: { ...creative, enabled: false } })).statusCode).toBe(200);
    expect((await app.inject('/spot/config')).json().slots.article.enabled).toBe(false);
    await app.inject({ method: 'POST', url: '/admin/spot/config/article/reset', headers });
    expect((await app.inject('/spot/config')).json().slots.article).toBeUndefined();
    expect((await pool.query("select creative from spot_controls where slot = 'article'")).rows).toHaveLength(1);
  });
  it('accepts text-only, image-only, link-only and mixed content; blocks active URLs and base64 images', async () => {
    for (const item of [creative, { ...creative, title: '', text: '', image: '/spot/img/banner.webp' }, { ...creative, title: '', text: '', url: 'https://example.com/' }, { ...creative, image: '/spot/img/banner.webp', url: '/plus/' }]) {
      expect((await app.inject({ method: 'PUT', url: '/admin/spot/config/home', headers, payload: item })).statusCode).toBe(200);
    }
    for (const value of [{ url: 'javascript:alert(1)' }, { url: '//example.com' }, { url: '/\\example.com' }, { image: 'data:image/png;base64,eA==' }, { image: 'https://example.com/banner.webp' }, { image: '/spot/img/../banner.webp' }]) {
      expect((await app.inject({ method: 'PUT', url: '/admin/spot/config/home', headers, payload: { ...creative, ...value } })).statusCode).toBe(400);
    }
    expect((await app.inject({ method: 'PUT', url: '/admin/spot/config/unknown', headers, payload: creative })).statusCode).toBe(400);
    expect((await app.inject({ method: 'PUT', url: '/admin/spot/config/home', headers, payload: { ...creative, title: '', text: '' } })).statusCode).toBe(400);
    expect((await app.inject('/spot/config')).body).not.toContain('SPOT_GITHUB_TOKEN');
  });
  it('canonicalizes uppercase HTTP schemes so sponsored-link detection remains correct', async () => {
    const response = await app.inject({ method: 'PUT', url: '/admin/spot/config/home', headers, payload: { ...creative, url: 'HTTPS://EXAMPLE.COM/path' } });
    expect(response.statusCode).toBe(200);
    expect((await app.inject('/spot/config')).json().slots.home.creative.url).toBe('https://example.com/path');
  });
  it('uploads WebP bytes to the existing repository media path and keeps bytes out of the database', async () => {
    process.env.SPOT_GITHUB_TOKEN = 'test-token';
    const remote = vi.fn().mockResolvedValue(new Response('{}', { status: 201 })); vi.stubGlobal('fetch', remote);
    const buffer = Buffer.from('RIFF0000WEBPVP8 fake');
    const upload = await app.inject({ method: 'POST', url: '/admin/spot/image', headers: { ...headers, 'content-type': 'image/webp' }, payload: buffer });
    expect(upload.statusCode).toBe(200); expect(upload.json().image).toMatch(/^\/spot\/img\/spot-.*\.webp$/);
    const [url, options] = remote.mock.calls[0]; expect(url).toContain('/contents/spot/img/');
    expect(JSON.parse(options.body)).toMatchObject({ branch: 'main', content: buffer.toString('base64') });
    await app.inject({ method: 'PUT', url: '/admin/spot/config/home', headers, payload: { ...creative, image: upload.json().image } });
    expect(JSON.stringify((await pool.query('select * from spot_controls')).rows)).not.toContain(buffer.toString('base64'));
  });
  it('rejects spoofed/oversize files and reports missing storage or remote failures honestly', async () => {
    const call = (payload: Buffer) => app.inject({ method: 'POST', url: '/admin/spot/image', headers: { ...headers, 'content-type': 'image/webp' }, payload });
    expect((await call(Buffer.from('<svg onload=alert(1)>'))).statusCode).toBe(400);
    expect((await call(Buffer.alloc(MAX_SPOT_IMAGE_BYTES + 1))).statusCode).toBe(413);
    expect((await call(Buffer.from('RIFF0000WEBPVP8 fake'))).statusCode).toBe(503);
    process.env.SPOT_GITHUB_TOKEN = 'test-token'; vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 403 })));
    const failed = await call(Buffer.from('RIFF0000WEBPVP8 fake'));
    expect(failed.statusCode).toBe(502); expect(failed.json().error).toBe('spot_storage_http_403');
  });
});
