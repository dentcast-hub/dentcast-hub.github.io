import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { listMembers, memberCursor, memberPayments } from '../services/admin-members.js';
import { one, query } from '../db.js';
import { isSpotSlot, SPOT_PLACEMENTS, parseSpotCreative, spotControls, saveSpotControl,
  MAX_SPOT_IMAGE_BYTES, spotImageExtension, uploadSpotImage } from '../services/spot-controls.js';

// Registered INSIDE adminRoutes, after its onRequest requireAdmin hook. Public
// settings are a separate encapsulated plugin (spot.ts).
export async function adminMemberSpotRoutes(app: FastifyInstance): Promise<void> {
  const members = async (request: FastifyRequest, reply: FastifyReply) => {
    const b = request.query as Record<string, string | undefined>;
    if (['q', 'order', 'cursor', 'limit'].some(key => b[key] !== undefined && typeof b[key] !== 'string')) return reply.code(400).send({ error: 'invalid_member_query' });
    const limit = Number(b.limit ?? 25);
    if ((b.order && !['newest', 'oldest'].includes(b.order)) || !Number.isInteger(limit)
      || limit < 1 || limit > 100 || (b.q?.length ?? 0) > 200 || (b.cursor && !memberCursor(b.cursor))) {
      return reply.code(400).send({ error: 'invalid_member_query' });
    }
    return reply.send(await listMembers({ q: b.q, order: b.order as 'newest' | 'oldest' | undefined, cursor: b.cursor, limit }));
  };
  app.get('/admin/users', members);
  // Preserve the old endpoint's name and response fields, remove its hidden cap.
  app.get('/admin/users/search', async (request, reply) => {
    const q = (request.query as { q?: unknown }).q;
    if (typeof q !== 'string' || q.trim().length < 2) return reply.code(400).send({ error: 'query_too_short' });
    return members(request, reply);
  });
  app.get('/admin/users/:id/payments', async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id)) return reply.code(400).send({ error: 'invalid_user' });
    const b = request.query as { offset?: string; limit?: string };
    const offset = Number(b.offset ?? 0), limit = Number(b.limit ?? 25);
    if (!Number.isSafeInteger(offset) || offset < 0 || !Number.isInteger(limit) || limit < 1 || limit > 100) return reply.code(400).send({ error: 'invalid_page' });
    if (!await one('select id from profiles where id = $1', [id])) return reply.code(404).send({ error: 'no_profile' });
    return memberPayments(id, offset, limit);
  });
  app.get('/admin/spot/config', async () => ({ ok: true, placements: SPOT_PLACEMENTS,
    slots: await spotControls(), upload_configured: !!process.env.SPOT_GITHUB_TOKEN }));
  app.put('/admin/spot/config/:slot', async (request, reply) => {
    const { slot } = request.params as { slot: string };
    if (!isSpotSlot(slot)) return reply.code(400).send({ error: 'invalid_slot' });
    const value = parseSpotCreative(slot, request.body);
    if (!value) return reply.code(400).send({ error: 'invalid_creative' });
    await saveSpotControl(slot, value);
    return { ok: true };
  });
  // Reset means resume the site's existing rotation/targeting, NOT delete a
  // historical campaign. Disabled custom content is retained in spot_controls.
  app.post('/admin/spot/config/:slot/reset', async (request, reply) => {
    const { slot } = request.params as { slot: string };
    if (!isSpotSlot(slot)) return reply.code(400).send({ error: 'invalid_slot' });
    await query('update spot_controls set use_default = true, updated_at = now() where slot = $1', [slot]);
    return { ok: true };
  });
  // Raw bytes avoid multipart dependencies and keep base64 out of JSON/DB.
  app.addContentTypeParser(['image/webp', 'image/png', 'image/jpeg', 'image/gif'], { parseAs: 'buffer', bodyLimit: MAX_SPOT_IMAGE_BYTES }, (_request, body, done) => done(null, body));
  app.post('/admin/spot/image', { bodyLimit: MAX_SPOT_IMAGE_BYTES }, async (request, reply) => {
    const extension = Buffer.isBuffer(request.body) ? spotImageExtension(request.body, String(request.headers['content-type']).split(';')[0]) : null;
    if (!extension) return reply.code(400).send({ error: 'invalid_image' });
    try { return { ok: true, image: await uploadSpotImage(request.body as Buffer, extension) }; }
    catch (err) {
      const message = (err as Error).message;
      request.log.warn({ error: message }, 'Spot image upload failed');
      return reply.code(message === 'spot_storage_not_configured' ? 503 : 502).send({ error: message.startsWith('spot_storage_') ? message : 'spot_storage_unavailable' });
    }
  });
}
