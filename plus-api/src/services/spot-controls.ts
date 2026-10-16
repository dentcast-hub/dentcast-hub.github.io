import { randomUUID } from 'node:crypto';
import { query } from '../db.js';

export const SPOT_PLACEMENTS = {
  article: 'داخل مقاله', home: 'صفحهٔ اصلی', pillar: 'فهرست موضوعی',
  player: 'پلیر', episodes: 'آرشیو اپیزودها', episode: 'صفحهٔ اپیزود',
  dashboard: 'پیشخوان پلاس', profile: 'پروفایل پلاس', search: 'جستجو',
  archive: 'تب آرشیو', sidebar: 'ستون کنار دسکتاپ',
} as const;
export type SpotSlot = keyof typeof SPOT_PLACEMENTS;
export function isSpotSlot(slot: string): slot is SpotSlot { return Object.hasOwn(SPOT_PLACEMENTS, slot); }

export interface SpotCreative { id: string; badge: string; title: string; text: string; cta: string; url: string; image: string | null }

export function validSpotLink(value: string): boolean {
  // Protocol-relative URLs, backslashes, controls and active schemes are never links.
  if (!value) return true;
  if (/[\s\\\u0000-\u001f\u007f]/u.test(value)) return false;
  if (/^\/(?!\/)/.test(value)) return true;
  try { const u = new URL(value); return ['https:', 'http:'].includes(u.protocol) && !u.username && !u.password; }
  catch { return false; }
}

export function parseSpotCreative(slot: SpotSlot, body: unknown): { enabled: boolean; creative: SpotCreative } | null {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const b = body as Record<string, unknown>;
  if (typeof b.enabled !== 'boolean') return null;
  const creative: SpotCreative = { id: 'managed-' + slot, badge: '', title: '', text: '', cta: '', url: '', image: null };
  for (const [key, max] of Object.entries({ badge: 100, title: 300, text: 2000, cta: 100, url: 2000 })) {
    if (typeof b[key] !== 'string' || (b[key] as string).length > max) return null;
    (creative as unknown as Record<string, unknown>)[key] = (b[key] as string).trim();
  }
  if (!validSpotLink(creative.url)) return null;
  if (b.image !== null && b.image !== '') {
    if (typeof b.image !== 'string' || !/^\/spot\/img\/[a-z0-9][a-z0-9._-]*\.(webp|png|jpe?g|gif)$/i.test(b.image)) return null;
    creative.image = b.image;
  }
  if (b.enabled && !(creative.title || creative.text || creative.image || creative.url)) return null;
  return { enabled: b.enabled, creative };
}

export async function spotControls() {
  const result = await query<{ slot: SpotSlot; enabled: boolean; creative: SpotCreative; updated_at: Date }>(
    'select slot, enabled, creative, updated_at from spot_controls where not use_default order by slot',
  );
  return Object.fromEntries(result.rows.filter(r => isSpotSlot(r.slot)).map(r => [r.slot, {
    enabled: r.enabled, creative: r.creative, updated_at: r.updated_at,
  }]));
}

export async function saveSpotControl(slot: SpotSlot, value: { enabled: boolean; creative: SpotCreative }) {
  await query(`insert into spot_controls (slot, enabled, creative) values ($1, $2, $3::jsonb)
    on conflict (slot) do update set enabled = excluded.enabled, creative = excluded.creative, use_default = false, updated_at = now()`,
  [slot, value.enabled, JSON.stringify(value.creative)]);
}

export const MAX_SPOT_IMAGE_BYTES = 5 * 1024 * 1024;
export function spotImageExtension(buffer: Buffer, contentType: string): string | null {
  if (buffer.length < 12 || buffer.length > MAX_SPOT_IMAGE_BYTES) return null;
  if (contentType === 'image/webp' && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  if (contentType === 'image/png' && buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return 'png';
  if (contentType === 'image/jpeg' && buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255) return 'jpg';
  if (contentType === 'image/gif' && /^GIF8[79]a$/.test(buffer.toString('ascii', 0, 6))) return 'gif';
  return null;
}

// Existing media storage is the repository's self-hosted spot/img directory.
// Base64 is ONLY the GitHub Contents transport, never a database value. UUID
// names are append-only: replacing a campaign never destroys its old artwork.
export async function uploadSpotImage(buffer: Buffer, extension: string): Promise<string> {
  const token = process.env.SPOT_GITHUB_TOKEN;
  if (!token) throw new Error('spot_storage_not_configured');
  const path = `spot/img/spot-${randomUUID()}.${extension}`;
  const response = await fetch(`https://api.github.com/repos/dentcast-hub/dentcast-hub.github.io/contents/${path}`, {
    method: 'PUT', signal: AbortSignal.timeout(30_000),
    headers: { authorization: `Bearer ${token}`, accept: 'application/vnd.github+json', 'content-type': 'application/json', 'x-github-api-version': '2022-11-28' },
    body: JSON.stringify({ message: 'Upload Spot artwork from admin', branch: 'main', content: buffer.toString('base64') }),
  });
  if (!response.ok) throw new Error(`spot_storage_http_${response.status}`);
  return '/' + path;
}
