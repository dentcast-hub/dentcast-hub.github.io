import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb } from './helpers.js';
import { pool } from '../src/db.js';
import { config } from '../src/config.js';
import { dayToJalali, jalaliToDay, parseJalali, formatJalaliDay } from '../src/services/jalali.js';
import { clinicStatus } from '../src/services/clinic.js';

let app: FastifyInstance;
const basic = 'Basic ' + Buffer.from(
  `${config.admin.user}:${config.admin.password}`).toString('base64');

beforeAll(async () => { app = await makeApp(); });
beforeEach(async () => { await resetDb(); });
afterAll(async () => { await app?.close(); await pool.end(); });

const post = (url: string, body: unknown) => app.inject({
  method: 'POST', url, headers: { authorization: basic }, payload: body as object,
});

describe('the Jalali calendar', () => {
  it('round-trips every day of four years against ICU itself', () => {
    // The converter estimates and steps; this is the proof it always lands.
    let day = '2024-03-20';
    for (let i = 0; i < 4 * 366; i += 1) {
      const j = dayToJalali(day);
      expect(jalaliToDay(j.jy, j.jm, j.jd)).toBe(day);
      day = new Date(Date.parse(`${day}T12:00:00Z`) + 86_400_000).toISOString().slice(0, 10);
    }
  });

  it('agrees with the dates a human would name', () => {
    expect(parseJalali('1405/06/09')).toBe('2026-08-31');
    expect(parseJalali('1405/06/14')).toBe('2026-09-05');
    expect(parseJalali('1405-01-01')).toBe('2026-03-21');
    expect(parseJalali('۱۴۰۵/۶/۱۴')).toBe('2026-09-05'); // Persian digits, no padding
  });

  it('refuses a date that does not exist rather than sliding to a neighbour', () => {
    expect(parseJalali('1403/12/30')).toBe('2025-03-20'); // 1403 IS a leap year
    expect(parseJalali('1404/12/30')).toBeNull();         // 1404 is not
    expect(parseJalali('1405/13/01')).toBeNull();
    expect(parseJalali('1405/07/31')).toBeNull();         // Mehr has 30 days
    expect(parseJalali('nonsense')).toBeNull();
  });
});

describe('GET /clinic/status', () => {
  it('says nothing is different when no closure is filed', async () => {
    const res = await app.inject({ method: 'GET', url: '/clinic/status' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true, closed: false });
  });

  it('needs no session — the caller is an anonymous contact card', async () => {
    const res = await app.inject({ method: 'GET', url: '/clinic/status' });
    expect(res.statusCode).toBe(200);
  });

  it('is closed on both ends of the range and open the day after', async () => {
    await post('/admin/clinic', { from: '1405/06/09', to: '1405/06/13' });
    expect((await clinicStatus('2026-08-30')).closed).toBe(false);
    expect((await clinicStatus('2026-08-31')).closed).toBe(true); // first day
    expect((await clinicStatus('2026-09-04')).closed).toBe(true); // last day
    expect((await clinicStatus('2026-09-05')).closed).toBe(false);
  });

  it('names the day the clinic is actually back, skipping the weekend', async () => {
    // Ends Tuesday 1405/06/17 (2026-09-08); Wed is a workday, so back is Wed.
    await post('/admin/clinic', { from: '1405/06/16', to: '1405/06/17' });
    const wed = await clinicStatus('2026-09-08');
    expect(wed).toMatchObject({ closed: true, back_on: '2026-09-09' });

    await resetDb();
    // Ends Wednesday 1405/06/18 (2026-09-09): Thu and Fri are the ordinary
    // weekend, so the next open door is Saturday.
    await post('/admin/clinic', { from: '1405/06/16', to: '1405/06/18' });
    const sat = await clinicStatus('2026-09-09');
    expect(sat).toMatchObject({ closed: true, back_on: '2026-09-12' });
    expect((sat as { text: string }).text).toContain('شنبه');
    expect((sat as { text: string }).text).toContain('۱۲:۳۰');
  });

  it('says «فردا» on the last closed day, in the card own vocabulary', async () => {
    await post('/admin/clinic', { from: '1405/06/09', to: '1405/06/13' });
    const status = await clinicStatus('2026-09-04') as { text: string };
    expect(status.text).toBe('مطب تعطیل است · فردا ساعت ۱۲:۳۰ باز می‌شود');
  });

  it('prints a founder-written note verbatim, widened by nothing', async () => {
    const note = 'مطب تا ۱۴ شهریور تعطیل است';
    await post('/admin/clinic', { from: '1405/06/09', to: '1405/06/13', note });
    expect(await clinicStatus('2026-09-01')).toMatchObject({ closed: true, text: note });
  });

  it('lets a second row extend a break — the later end wins', async () => {
    await post('/admin/clinic', { from: '1405/06/09', to: '1405/06/13' });
    await post('/admin/clinic', { from: '1405/06/12', to: '1405/06/18' });
    expect(await clinicStatus('2026-09-04')).toMatchObject({
      closed: true, ends_on: '2026-09-09', back_on: '2026-09-12',
    });
  });

  it('jumps over a second closure that starts on the day it would reopen', async () => {
    await post('/admin/clinic', { from: '1405/06/16', to: '1405/06/17' });
    await post('/admin/clinic', { from: '1405/06/18', to: '1405/06/18' });
    expect(await clinicStatus('2026-09-07')).toMatchObject({ back_on: '2026-09-12' });
  });
});

describe('the founder panel', () => {
  it('takes one day when only a start is given', async () => {
    const res = await post('/admin/clinic', { from: '1405/06/20' });
    expect(res.statusCode).toBe(200);
    expect(res.json().closure).toMatchObject({ starts_on: '2026-09-11', ends_on: '2026-09-11' });
  });

  it('refuses a date it cannot read instead of filing a wrong one', async () => {
    expect((await post('/admin/clinic', { from: '' })).statusCode).toBe(400);
    expect((await post('/admin/clinic', { from: '2026-09-05' })).statusCode).toBe(400);
    expect((await post('/admin/clinic', { from: '1405/06/09', to: '1405/06/08' })).statusCode).toBe(400);
  });

  it('lists every closure with what the card says, and deletes one', async () => {
    const made = await post('/admin/clinic', { from: '1405/06/09', to: '1405/06/13' });
    const id = made.json().closure.id;

    const list = await app.inject({ method: 'GET', url: '/admin/clinic', headers: { authorization: basic } });
    expect(list.json().closures).toHaveLength(1);
    const row = list.json().closures[0];
    expect(row).toMatchObject({ starts_on: '2026-08-31', ends_on: '2026-09-04' });
    expect(row.starts_fa).toContain('شهریور');   // typed and read back in Jalali
    expect(row.back_fa).toBe(formatJalaliDay('2026-09-05'));
    expect(row.text).toContain('ساعت ۱۲:۳۰');

    // A closure years out is «پیشِ رو» whatever today happens to be.
    await post('/admin/clinic', { from: '1410/01/05' });
    const again = await app.inject({ method: 'GET', url: '/admin/clinic', headers: { authorization: basic } });
    expect(again.json().closures.find((c: { starts_on: string }) => c.starts_on === '2031-03-25').state)
      .toBe('upcoming');

    expect((await post('/admin/clinic/delete', { id })).statusCode).toBe(200);
    expect((await post('/admin/clinic/delete', { id })).statusCode).toBe(404);

    const after = await app.inject({ method: 'GET', url: '/clinic/status' });
    expect(after.json()).toEqual({ ok: true, closed: false });
  });

  it('is behind the admin gate, like every other founder surface', async () => {
    expect((await app.inject({ method: 'GET', url: '/admin/clinic' })).statusCode).toBe(401);
    expect((await app.inject({
      method: 'POST', url: '/admin/clinic', payload: { from: '1405/06/09' },
    })).statusCode).toBe(401);
  });
});
