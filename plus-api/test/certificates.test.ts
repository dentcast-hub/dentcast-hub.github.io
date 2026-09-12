import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb, loginAs } from './helpers.js';
import { pool } from '../src/db.js';
import { config } from '../src/config.js';
import { getPathways } from '../src/pathways.js';
import {
  issueCertificate, revokeCertificate, verifyCertificate, listCertificates,
} from '../src/services/certificates.js';
import { assignExam, listAssignments, deleteAssignment } from '../src/services/pathway-exams.js';
import { availableCredits, CREDIT_CAP_PERCENT } from '../src/services/discount-credits.js';

let app: FastifyInstance;
let cookie: string;
const phone = '09121200091';

const basic = 'Basic ' + Buffer.from(
  `${config.admin.user}:${config.admin.password}`).toString('base64');

const PATHWAY_ID = 'digital';
const PATHWAY_TITLE = getPathways().find((p) => p.id === PATHWAY_ID)!.title_fa;
const BUNDLE_ID = getPathways().find((p) => p.kind === 'bundle')!.id;

beforeEach(async () => {
  await resetDb();
  if (!app) app = await makeApp();
  cookie = await loginAs(app, phone);
});

afterAll(async () => {
  await app?.close();
  await pool.end();
});

async function userId(p = phone): Promise<string> {
  const r = await pool.query<{ id: string }>('select id from profiles where phone = $1', [p]);
  return r.rows[0].id;
}

const adminPost = (url: string, body: unknown) => app.inject({
  method: 'POST', url, headers: { authorization: basic }, payload: body as object,
});
const adminGet = (url: string) => app.inject({ method: 'GET', url, headers: { authorization: basic } });

describe('issuing a certificate', () => {
  it('writes the row, mints a DC- code, and writes the ٪۱۰ credit in the same act', async () => {
    const uid = await userId();
    const r = await issueCertificate(uid, PATHWAY_ID, { holderName: 'دکتر آزمایشی', notify: false });
    expect(r.created).toBe(true);
    expect(r.certificate.verify_code).toMatch(/^DC-[ACDEFGHJKMNPQRTUVWXY2346789]{3}-[ACDEFGHJKMNPQRTUVWXY2346789]{3}$/);
    expect(r.certificate.holder_name).toBe('دکتر آزمایشی');
    expect(r.discount_percent).toBe(config.certificate.discountPercent);

    const credits = await availableCredits(uid);
    const mine = credits.find((c) => c.source === `grant:${r.certificate.discount_grant_id}`);
    expect(mine).toMatchObject({ percent: 10, kind: 'grant' });
    expect(mine!.label_fa).toContain(PATHWAY_TITLE);
    // Ten is the whole cap: it is spent in ONE purchase, never sliced.
    expect(mine!.percent).toBe(CREDIT_CAP_PERCENT);
  });

  it('is idempotent while a live certificate exists — no second code, no second credit', async () => {
    const uid = await userId();
    const first = await issueCertificate(uid, PATHWAY_ID, { holderName: 'الف', notify: false });
    const again = await issueCertificate(uid, PATHWAY_ID, { holderName: 'ب', notify: false });
    expect(again.created).toBe(false);
    expect(again.certificate.id).toBe(first.certificate.id);
    expect(again.certificate.holder_name).toBe('الف'); // the name is frozen at issue
    expect(again.discount_percent).toBe(0);
    const grants = await pool.query('select count(*)::int as n from discount_grants where user_id = $1', [uid]);
    expect(grants.rows[0].n).toBe(1);
  });

  it('mints a fresh code after a revoke, and keeps the revoked row', async () => {
    const uid = await userId();
    const first = await issueCertificate(uid, PATHWAY_ID, { holderName: 'الف', notify: false });
    expect(await revokeCertificate(first.certificate.id)).toBe(true);
    expect(await revokeCertificate(first.certificate.id)).toBe(false); // already

    const second = await issueCertificate(uid, PATHWAY_ID, { holderName: 'الف', notify: false });
    expect(second.created).toBe(true);
    expect(second.certificate.verify_code).not.toBe(first.certificate.verify_code);

    const all = await listCertificates(uid);
    expect(all).toHaveLength(2);
    expect(all.find((c) => c.id === first.certificate.id)!.revoked_at).not.toBeNull();
  });

  it('refuses a bundle and an empty name', async () => {
    const uid = await userId();
    await expect(issueCertificate(uid, BUNDLE_ID, { holderName: 'x', notify: false })).rejects.toThrow('unknown_pathway');
    await expect(issueCertificate(uid, PATHWAY_ID, { holderName: '  ', notify: false })).rejects.toThrow('holder_name_required');
  });

  it('can issue with no credit at all', async () => {
    const uid = await userId();
    const r = await issueCertificate(uid, PATHWAY_ID, { holderName: 'x', discountPercent: 0, notify: false });
    expect(r.certificate.discount_grant_id).toBeNull();
    expect(await availableCredits(uid)).toHaveLength(0);
  });

  it('tells the reader in اطلاعیه, with the code in it', async () => {
    const uid = await userId();
    const r = await issueCertificate(uid, PATHWAY_ID, { holderName: 'دکتر ن.' });
    const n = await pool.query<{ title: string; body: string }>(
      'select title, body from notification_log where user_id = $1 order by id desc limit 1', [uid],
    );
    expect(n.rows[0].title).toContain('گواهی');
    expect(n.rows[0].body).toContain(r.certificate.verify_code);
  });
});

describe('verifying a certificate', () => {
  it('answers about the document and nothing about the account', async () => {
    const uid = await userId();
    const r = await issueCertificate(uid, PATHWAY_ID, { holderName: 'دکتر ن.', notify: false });
    const v = await verifyCertificate(r.certificate.verify_code);
    expect(v).toMatchObject({
      holder_name: 'دکتر ن.', pathway_id: PATHWAY_ID, pathway_title_fa: PATHWAY_TITLE, revoked: false,
    });
    expect(JSON.stringify(v)).not.toContain(uid);
    expect(JSON.stringify(v)).not.toContain(phone);
  });

  it('forgives the human — lowercase and spaces', async () => {
    const uid = await userId();
    const r = await issueCertificate(uid, PATHWAY_ID, { holderName: 'x', notify: false });
    const sloppy = ` ${r.certificate.verify_code.toLowerCase()} `;
    expect(await verifyCertificate(sloppy)).not.toBeNull();
  });

  it('says revoked rather than pretending it never existed', async () => {
    const uid = await userId();
    const r = await issueCertificate(uid, PATHWAY_ID, { holderName: 'x', notify: false });
    await revokeCertificate(r.certificate.id);
    const v = await verifyCertificate(r.certificate.verify_code);
    expect(v!.revoked).toBe(true);
    expect(v!.revoked_at).not.toBeNull();
  });

  it('is null for nonsense and for a well-formed miss', async () => {
    expect(await verifyCertificate('hello')).toBeNull();
    expect(await verifyCertificate('DC-AAA-AAA')).toBeNull();
  });

  it('is public: GET /certificates/verify/:code needs no session', async () => {
    const uid = await userId();
    const r = await issueCertificate(uid, PATHWAY_ID, { holderName: 'دکتر ن.', notify: false });
    const ok = await app.inject({ method: 'GET', url: `/certificates/verify/${r.certificate.verify_code}` });
    expect(ok.statusCode).toBe(200);
    expect(ok.json().certificate.holder_name).toBe('دکتر ن.');

    const miss = await app.inject({ method: 'GET', url: '/certificates/verify/DC-AAA-AAA' });
    expect(miss.statusCode).toBe(404);
    expect(miss.json()).toEqual({ ok: false, error: 'not_found' });
  });
});

describe('GET /certificates — mine', () => {
  it('lists the reader\'s own with a verify url, on any plan', async () => {
    const uid = await userId();
    const r = await issueCertificate(uid, PATHWAY_ID, { holderName: 'x', notify: false });
    const res = await app.inject({ method: 'GET', url: '/certificates', headers: { cookie } });
    expect(res.statusCode).toBe(200);
    const row = res.json().certificates[0];
    expect(row.verify_code).toBe(r.certificate.verify_code);
    expect(row.pathway_title_fa).toBe(PATHWAY_TITLE);
    expect(row.verify_url).toBe(`/plus/certificate.html?c=${r.certificate.verify_code}`);
  });

  it('is 401 signed out', async () => {
    expect((await app.inject({ method: 'GET', url: '/certificates' })).statusCode).toBe(401);
  });
});

describe('assigning an exam early', () => {
  it('is one row per reader per pathway, upserted, with the id stable', async () => {
    const uid = await userId();
    const first = await assignExam(uid, PATHWAY_ID, { note: 'نزدیک پایان' });
    expect(first.created).toBe(true);
    expect(first.assignment.note).toBe('نزدیک پایان');

    const again = await assignExam(uid, PATHWAY_ID, { note: 'دوباره' });
    expect(again.created).toBe(false);
    expect(again.assignment.id).toBe(first.assignment.id);
    expect(again.assignment.note).toBe('دوباره');
    expect(await listAssignments(uid)).toHaveLength(1);
  });

  it('refuses a bundle', async () => {
    const uid = await userId();
    await expect(assignExam(uid, BUNDLE_ID)).rejects.toThrow('unknown_pathway');
  });

  it('deleting the assignment leaves a certificate that pointed at it', async () => {
    const uid = await userId();
    const { assignment } = await assignExam(uid, PATHWAY_ID);
    const cert = await issueCertificate(uid, PATHWAY_ID, { holderName: 'x', examId: assignment.id, notify: false });
    expect(cert.certificate.exam_id).toBe(assignment.id);
    expect(await deleteAssignment(assignment.id)).toBe(true);
    const after = await listCertificates(uid);
    expect(after[0].exam_id).toBeNull();
    expect(after[0].revoked_at).toBeNull();
  });
});

describe('the admin panel routes', () => {
  it('assigns and lists an early admission by phone, and says when the pathway has no form yet', async () => {
    const res = await adminPost('/admin/exams', { phone, pathway_id: PATHWAY_ID, note: 'n' });
    expect(res.statusCode).toBe(200);
    expect(res.json().created).toBe(true);
    expect(res.json().has_form).toBe(false);

    const list = await adminGet('/admin/exams');
    expect(list.json().exams).toHaveLength(1);
    expect(list.json().exams[0].has_form).toBe(false);
  });

  it('issues, lists and revokes a certificate', async () => {
    const issued = await adminPost('/admin/certificates/issue', {
      phone, pathway_id: PATHWAY_ID, holder_name: 'دکتر ن.', discount_percent: 10, notify: false,
    });
    expect(issued.statusCode).toBe(200);
    expect(issued.json().created).toBe(true);
    const id = issued.json().certificate.id as string;

    const roster = await adminGet('/admin/certificates');
    expect(roster.json().certificates[0].id).toBe(id);

    const rev = await adminPost('/admin/certificates/revoke', { id });
    expect(rev.json().revoked).toBe(true);
    const twice = await adminPost('/admin/certificates/revoke', { id });
    expect(twice.json().already).toBe(true);
  });

  it('refuses a bundle with a message', async () => {
    const res = await adminPost('/admin/certificates/issue', {
      phone, pathway_id: BUNDLE_ID, holder_name: 'x',
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe('unknown_pathway');
  });

  it('offers the full pathways as a catalog, bundles excluded', async () => {
    const res = await adminGet('/admin/pathways/catalog');
    const ids = (res.json().pathways as { id: string }[]).map((p) => p.id);
    expect(ids).toContain(PATHWAY_ID);
    expect(ids).not.toContain(BUNDLE_ID);
  });

  it('is behind admin auth', async () => {
    expect((await app.inject({ method: 'GET', url: '/admin/certificates' })).statusCode).toBe(401);
  });
});
