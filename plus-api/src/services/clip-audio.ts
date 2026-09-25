import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { config } from '../config.js';
import { getContentInfo } from '../content-index.js';

/**
 * دانلود هایلایت صوتی — one clip, cut out of its episode as a real MP3 file.
 *
 * Until this, a clip was two numbers on the episode's own file and nothing was
 * ever cut (routes/clips.ts). A reader asked to KEEP one — to hold it outside
 * the site, or send it on — and that needs bytes, so this is the first place
 * the audio itself is touched. The founder's decisions (1405/07/03):
 *
 *   · the cut happens on the SERVER, never in the reader's browser: the Arvan
 *     buckets carry no CORS, and a browser cut would also have to download the
 *     whole episode to decode it;
 *   · the file carries its SOURCE: an ID3 tag naming the episode, DentCast and
 *     the episode's page, so a 30-second file forwarded on a messenger still
 *     says where it came from. The reader's own note is deliberately NOT in it —
 *     a note is private, and a file is made to be passed on;
 *   · downloading is premium, like making a clip (the route owns that gate).
 *
 * HOW IT CUTS, with no ffmpeg and no disk: MP3 is a chain of self-contained
 * frames, so a byte range that starts and ends on frame boundaries is itself a
 * playable MP3. The file is never downloaded whole — two small HTTP Range reads
 * find the first audio frame and its bitrate, one more reads the span.
 *
 *   1. read the head: skip an ID3v2 tag (podcast tags often carry cover art, so
 *      its size is read, never assumed), parse the first frame header, and look
 *      for a Xing/Info header inside it;
 *   2. turn a second into a byte offset: constant bitrate is exact arithmetic;
 *      a VBR file with a Xing table of contents is interpolated through it;
 *   3. land on a real frame: from that estimate, scan for a sync word whose next
 *      two frames also parse (one false sync inside audio data is common, three
 *      in a row is not);
 *   4. WALK frames — each header states its own length — until the clip's
 *      duration has been counted in frames. That makes the LENGTH exact on any
 *      file; only the START of a VBR file carries the table's interpolation
 *      error, which is why the arithmetic path is preferred whenever the file
 *      says it is CBR.
 *
 * The first frame of a cut may reference audio data from the frame before it
 * (the MP3 "bit reservoir"), so a decoder may render its first ~26ms as
 * silence. That is the price of cutting without re-encoding, and it is the same
 * one every lossless MP3 splitter pays.
 */

/** The site that the tag names as the source. The mirrors are one site. */
export const SOURCE_SITE = 'https://dentcast.ir';

/** Hosts an episode file may live on. Anything else is refused before a fetch. */
function allowedAudioHost(url: string): boolean {
  let u: URL;
  try { u = new URL(url); } catch { return false; }
  if (u.protocol !== 'https:') return false;
  return u.hostname.endsWith('.arvanstorage.ir') || u.hostname === 'sphinx.acast.com';
}

/* -------------------------------------------------------- episode catalog -- */

interface CatalogRow { episode?: string; title?: string; audio_url?: string; page_url?: string }

export interface EpisodeAudio {
  content_id: string;
  audio_url: string;
  /** The Persian title the site shows (content index), else the catalog's own. */
  title: string;
  /** Absolute URL of the episode page, for the tag. */
  page_url: string;
}

const CATALOG_TTL_MS = 10 * 60 * 1000;
const FETCH_TIMEOUT_MS = 20_000;

let remote: { rows: CatalogRow[]; at: number } | null = null;
let disk: { rows: CatalogRow[]; mtimeMs: number } | null = null;

function defaultCatalogPath(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  return resolve(here, '..', '..', '..', 'dentcast.json');
}

function readDisk(): CatalogRow[] {
  const path = config.episodes.catalogPath || defaultCatalogPath();
  try {
    const { mtimeMs } = statSync(path);
    if (disk && disk.mtimeMs === mtimeMs) return disk.rows;
    const raw = JSON.parse(readFileSync(path, 'utf8'));
    if (Array.isArray(raw)) disk = { rows: raw, mtimeMs };
  } catch {
    // Keep whatever was read last; an unreadable file is not an empty catalog.
  }
  return disk?.rows ?? [];
}

/**
 * dentcast.json is what every player on the site plays from, so it is the one
 * place an episode's file is named. It is fetched from the live site on demand
 * (at most once per CATALOG_TTL_MS) so an episode published this afternoon can
 * be clipped this afternoon; the baked copy answers when no mirror does.
 */
async function catalogRows(): Promise<CatalogRow[]> {
  const urls = config.episodes.catalogUrls;
  if (urls.length && (!remote || Date.now() - remote.at > CATALOG_TTL_MS)) {
    const stamp = Date.now();
    for (const url of urls) {
      try {
        const res = await fetch(url + (url.includes('?') ? '&' : '?') + '_dc=' + stamp, {
          headers: { 'cache-control': 'no-cache', accept: 'application/json' },
          signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        });
        if (!res.ok) continue;
        const raw = await res.json();
        if (Array.isArray(raw) && raw.length) { remote = { rows: raw, at: stamp }; break; }
      } catch {
        continue;
      }
    }
  }
  return remote?.rows ?? readDisk();
}

/** Test-only: forget both copies of the catalog. */
export function resetEpisodeCatalog(): void {
  remote = null;
  disk = null;
}

/** «episodes/episode-91» → its file, title and page; null when it is not an episode. */
export async function resolveEpisodeAudio(contentId: string): Promise<EpisodeAudio | null> {
  if (!/^episodes\/episode-[0-9-]+$/.test(contentId)) return null;
  const page = '/' + contentId + '.html';
  const row = (await catalogRows()).find((r) => r && r.page_url === page && r.audio_url);
  if (!row || !row.audio_url) return null;
  const info = getContentInfo(contentId);
  return {
    content_id: contentId,
    audio_url: row.audio_url,
    title: (info?.title || row.title || contentId).trim(),
    page_url: SOURCE_SITE + page,
  };
}

/* ------------------------------------------------------------ MP3 frames -- */

const BITRATES_V1_L3 = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320];
const BITRATES_V2_L3 = [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160];
const SAMPLE_RATES: Record<number, number[]> = {
  3: [44100, 48000, 32000], // MPEG-1
  2: [22050, 24000, 16000], // MPEG-2
  0: [11025, 12000, 8000], //  MPEG-2.5
};

export interface FrameHeader {
  /** 3 = MPEG-1, 2 = MPEG-2, 0 = MPEG-2.5 (the header's own two bits). */
  version: number;
  bitrateKbps: number;
  sampleRate: number;
  /** Samples per frame: 1152 (MPEG-1 layer III) or 576. */
  samples: number;
  /** Whole frame length in bytes, header included. */
  length: number;
  mono: boolean;
}

/** Parse a layer-III frame header at `off`, or null if there is none there. */
export function parseFrameHeader(buf: Uint8Array, off: number): FrameHeader | null {
  if (off < 0 || off + 4 > buf.length) return null;
  const b1 = buf[off + 1], b2 = buf[off + 2], b3 = buf[off + 3];
  if (buf[off] !== 0xff || (b1 & 0xe0) !== 0xe0) return null;
  const version = (b1 >> 3) & 3;
  if (version === 1) return null; // reserved
  if (((b1 >> 1) & 3) !== 1) return null; // layer III only — what podcasts are
  const brIdx = (b2 >> 4) & 0xf;
  const srIdx = (b2 >> 2) & 3;
  if (brIdx === 0 || brIdx === 15 || srIdx === 3) return null; // free-format / bad
  const bitrateKbps = (version === 3 ? BITRATES_V1_L3 : BITRATES_V2_L3)[brIdx];
  const sampleRate = SAMPLE_RATES[version][srIdx];
  const padding = (b2 >> 1) & 1;
  const samples = version === 3 ? 1152 : 576;
  const length = Math.floor(((samples / 8) * bitrateKbps * 1000) / sampleRate) + padding;
  return { version, bitrateKbps, sampleRate, samples, length, mono: ((b3 >> 6) & 3) === 3 };
}

/** Same stream: a frame whose version/rate differ from the first is not ours. */
function sameStream(a: FrameHeader, b: FrameHeader): boolean {
  return a.version === b.version && a.sampleRate === b.sampleRate;
}

/**
 * The first offset ≥ `from` where three consecutive frames of `ref`'s stream
 * parse. A lone 0xFFE inside audio data is common; three chained ones are not.
 * Frames that would run past the buffer count as confirmed only when `atEof`.
 */
export function findFrame(buf: Uint8Array, from: number, ref: FrameHeader | null, atEof = false): number {
  for (let i = Math.max(0, from); i + 4 <= buf.length; i++) {
    const h = parseFrameHeader(buf, i);
    if (!h || (ref && !sameStream(ref, h))) continue;
    let ok = true;
    let p = i + h.length;
    for (let k = 0; k < 2; k++) {
      if (p + 4 > buf.length) { ok = atEof; break; }
      const n = parseFrameHeader(buf, p);
      if (!n || !sameStream(h, n)) { ok = false; break; }
      p += n.length;
    }
    if (ok) return i;
  }
  return -1;
}

/** ID3v2 tag length at the start of a file (header + body + footer), else 0. */
export function id3v2Length(buf: Uint8Array): number {
  if (buf.length < 10 || buf[0] !== 0x49 || buf[1] !== 0x44 || buf[2] !== 0x33) return 0; // "ID3"
  const size = ((buf[6] & 0x7f) << 21) | ((buf[7] & 0x7f) << 14) | ((buf[8] & 0x7f) << 7) | (buf[9] & 0x7f);
  const footer = (buf[5] & 0x10) ? 10 : 0;
  return 10 + size + footer;
}

export interface StreamInfo {
  /** Offset of the first frame (the Xing/Info frame, when there is one). */
  firstFrame: number;
  /** Offset of the first frame carrying audio. */
  dataStart: number;
  header: FrameHeader;
  /** How a second becomes a byte offset. */
  mode: 'cbr' | 'toc' | 'average';
  /** Xing/VBRI totals, when the file states them. */
  frames: number | null;
  bytes: number | null;
  toc: number[] | null;
}

function u32(buf: Uint8Array, off: number): number {
  return ((buf[off] << 24) >>> 0) + (buf[off + 1] << 16) + (buf[off + 2] << 8) + buf[off + 3];
}

/**
 * Read the stream's shape from the bytes starting at its first frame. `head`
 * is indexed from 0 = the file offset `base`.
 */
export function readStreamInfo(head: Uint8Array, base: number, eof = false): StreamInfo | null {
  const at = findFrame(head, 0, null, eof);
  if (at < 0) return null;
  const header = parseFrameHeader(head, at)!;
  const side = header.version === 3 ? (header.mono ? 17 : 32) : (header.mono ? 9 : 17);
  const x = at + 4 + side;
  const tag = String.fromCharCode(...head.subarray(x, x + 4));
  const info: StreamInfo = {
    firstFrame: base + at, dataStart: base + at, header, mode: 'cbr', frames: null, bytes: null, toc: null,
  };
  if (tag === 'Xing' || tag === 'Info') {
    // The tag frame is silence the encoder wrote to carry these numbers; the
    // audio starts after it.
    info.dataStart = base + at + header.length;
    const flags = u32(head, x + 4);
    let p = x + 8;
    if (flags & 1) { info.frames = u32(head, p); p += 4; }
    if (flags & 2) { info.bytes = u32(head, p); p += 4; }
    if (flags & 4) { info.toc = Array.from(head.subarray(p, p + 100)); p += 100; }
    // «Info» is LAME's name for the same header on a CBR file: arithmetic is
    // exact there, so the table is only used when the file says it is VBR.
    if (tag === 'Xing') {
      if (info.toc && info.toc.length === 100 && info.frames && info.bytes) info.mode = 'toc';
      else if (info.frames && info.bytes) info.mode = 'average';
    }
  } else if (String.fromCharCode(...head.subarray(at + 36, at + 40)) === 'VBRI') {
    info.dataStart = base + at + header.length;
    info.bytes = u32(head, at + 36 + 10);
    info.frames = u32(head, at + 36 + 14);
    if (info.frames && info.bytes) info.mode = 'average';
  }
  return info;
}

/** Where second `t` should be, as a file offset (an estimate to scan from). */
export function offsetForTime(info: StreamInfo, t: number): number {
  const h = info.header;
  const secondsPerFrame = h.samples / h.sampleRate;
  if (info.mode === 'toc' && info.toc && info.frames && info.bytes) {
    const duration = info.frames * secondsPerFrame;
    const pct = Math.min(99.999, Math.max(0, (t / duration) * 100));
    const i = Math.floor(pct);
    const a = info.toc[i];
    const b = i < 99 ? info.toc[i + 1] : 256;
    const frac = a + (b - a) * (pct - i);
    return info.firstFrame + Math.floor((frac / 256) * info.bytes);
  }
  if (info.mode === 'average' && info.frames && info.bytes) {
    return info.dataStart + Math.floor((t / secondsPerFrame) * (info.bytes / info.frames));
  }
  return info.dataStart + Math.floor((t * h.bitrateKbps * 1000) / 8);
}

/* ------------------------------------------------------------ range reads -- */

export interface RangeResult { bytes: Uint8Array; total: number | null }
export type RangeReader = (from: number, to: number) => Promise<RangeResult>;

export class ClipAudioError extends Error {
  constructor(readonly code: 'not_mp3' | 'source_unavailable' | 'range_unsupported' | 'out_of_range') {
    super(code);
  }
}

/** Inclusive byte range [from, to] of `url`, through HTTP Range. */
export function httpRangeReader(url: string): RangeReader {
  if (!allowedAudioHost(url)) throw new ClipAudioError('source_unavailable');
  return async (from, to) => {
    let res: Response;
    try {
      res = await fetch(url, {
        headers: { range: `bytes=${from}-${to}` },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
    } catch {
      throw new ClipAudioError('source_unavailable');
    }
    if (res.status === 416) return { bytes: new Uint8Array(0), total: null };
    if (res.status !== 206) {
      // A 200 here is the WHOLE episode on its way; stop it rather than read it.
      try { await res.body?.cancel(); } catch { /* ignore */ }
      throw new ClipAudioError(res.ok ? 'range_unsupported' : 'source_unavailable');
    }
    const m = /\/(\d+)\s*$/.exec(res.headers.get('content-range') || '');
    return { bytes: new Uint8Array(await res.arrayBuffer()), total: m ? Number(m[1]) : null };
  };
}

/* ------------------------------------------------------------------ cut -- */

const HEAD_BYTES = 64 * 1024;
const MORE_BYTES = 256 * 1024;
/** A hard ceiling on what one cut may read: 600 s at 320 kbps is 24 MB. */
const MAX_READ_BYTES = 40 * 1024 * 1024;

export interface CutResult {
  /** The MP3 frames of the span, no tag. */
  audio: Uint8Array;
  /** The span as actually cut, in seconds (frame-quantised). */
  seconds: number;
}

/**
 * The frames covering [start, end) seconds of the file behind `read`.
 * Never reads the file whole: a head, then the span with some slack, then more
 * only if the slack ran out.
 */
export async function cutMp3(read: RangeReader, start: number, end: number): Promise<CutResult> {
  // 1. The head, and past an ID3v2 tag however large its cover art is.
  let head = await read(0, HEAD_BYTES - 1);
  const total = head.total;
  const tagLen = id3v2Length(head.bytes);
  let base = 0;
  if (tagLen > 0) {
    base = tagLen;
    // Enough of the head left past the tag to find three frames in? Otherwise
    // read afresh from the tag's end.
    head = tagLen + 8192 <= head.bytes.length
      ? { bytes: head.bytes.subarray(tagLen), total }
      : await read(tagLen, tagLen + HEAD_BYTES - 1);
  }
  const headEof = total != null && base + head.bytes.length >= total;
  const info = readStreamInfo(head.bytes, base, headEof);
  if (!info) throw new ClipAudioError('not_mp3');

  // 2. The span's estimated bytes, with slack either side.
  const secondsPerFrame = info.header.samples / info.header.sampleRate;
  const wantFrames = Math.max(1, Math.round((end - start) / secondsPerFrame));
  const estStart = Math.max(info.dataStart, offsetForTime(info, start));
  if (total != null && estStart >= total) throw new ClipAudioError('out_of_range');
  const estEnd = offsetForTime(info, end);
  const slack = Math.max(64 * 1024, Math.floor((estEnd - estStart) * 0.25));
  // Open the window a frame or so before the estimate: the scan finds a real
  // frame there and then steps forward to the one that CONTAINS `start` —
  // never the one after it, which is what a scan from the estimate itself lands
  // on whenever the estimate falls a few bytes inside a frame.
  const winStart = Math.max(info.dataStart, estStart - 2048);
  const estRel = estStart - winStart;
  const scanFrom = Math.max(0, estRel - info.header.length - 8);
  let winEnd = estEnd + slack;
  if (total != null) winEnd = Math.min(winEnd, total - 1);

  let buf = (await read(winStart, winEnd)).bytes;
  let eof = total != null ? winStart + buf.length >= total : buf.length < winEnd - winStart + 1;
  let readBytes = buf.length;

  // 3. Land on a real frame at or after the estimate.
  let first = findFrame(buf, scanFrom, info.header, eof);
  while (first < 0 && !eof && readBytes < MAX_READ_BYTES) {
    const more = await read(winStart + buf.length, winStart + buf.length + MORE_BYTES - 1);
    if (!more.bytes.length) { eof = true; break; }
    buf = concat(buf, more.bytes);
    readBytes += more.bytes.length;
    eof = total != null ? winStart + buf.length >= total : more.bytes.length < MORE_BYTES;
    first = findFrame(buf, scanFrom, info.header, eof);
  }
  if (first < 0) throw new ClipAudioError('out_of_range');
  for (;;) {
    const h = parseFrameHeader(buf, first);
    const next = h ? first + h.length : -1;
    if (!h || next > estRel || !parseFrameHeader(buf, next)) break;
    first = next;
  }

  // 4. Walk frames until the clip's length has been counted.
  let p = first;
  let counted = 0;
  while (counted < wantFrames) {
    if (p + 4 > buf.length) {
      if (eof || readBytes >= MAX_READ_BYTES) break;
      const more = await read(winStart + buf.length, winStart + buf.length + MORE_BYTES - 1);
      if (!more.bytes.length) { eof = true; break; }
      buf = concat(buf, more.bytes);
      readBytes += more.bytes.length;
      eof = total != null ? winStart + buf.length >= total : more.bytes.length < MORE_BYTES;
      continue;
    }
    const h = parseFrameHeader(buf, p);
    if (!h || !sameStream(info.header, h)) break; // an ID3v1 tag, or the end of the stream
    if (p + h.length > buf.length) {
      if (eof || readBytes >= MAX_READ_BYTES) break; // a truncated last frame is left out
      const more = await read(winStart + buf.length, winStart + buf.length + MORE_BYTES - 1);
      if (!more.bytes.length) { eof = true; break; }
      buf = concat(buf, more.bytes);
      readBytes += more.bytes.length;
      eof = total != null ? winStart + buf.length >= total : more.bytes.length < MORE_BYTES;
      continue;
    }
    p += h.length;
    counted++;
  }
  if (counted === 0) throw new ClipAudioError('out_of_range');
  return { audio: buf.subarray(first, p), seconds: counted * secondsPerFrame };
}

function concat(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
}

/* ------------------------------------------------------------- ID3 tag -- */

/** UTF-16LE with a BOM — ID3v2.3's only encoding that can carry Persian. */
function utf16(text: string): Buffer {
  return Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(text, 'utf16le')]);
}

function frame(id: string, body: Buffer): Buffer {
  const head = Buffer.alloc(10);
  head.write(id, 0, 'latin1');
  head.writeUInt32BE(body.length, 4); // v2.3: a plain 32-bit size, not syncsafe
  return Buffer.concat([head, body]);
}

const textFrame = (id: string, text: string) => frame(id, Buffer.concat([Buffer.from([1]), utf16(text)]));

export interface ClipTagMeta {
  /** The track title a player shows. */
  title: string;
  /** The episode's title (album). */
  episodeTitle: string;
  /** The episode page — where the file came from. */
  pageUrl: string;
}

/**
 * An ID3v2.3 tag naming the file's source. v2.3 rather than v2.4 because it is
 * the version every phone's player reads; UTF-16 with a BOM because it is the
 * only v2.3 encoding with Persian in it.
 */
export function buildClipTag(meta: ClipTagMeta): Buffer {
  const comment = `از اپیزود «${meta.episodeTitle}» در دنت‌کست — ${meta.pageUrl}`;
  const frames = Buffer.concat([
    textFrame('TIT2', meta.title),
    textFrame('TPE1', 'DentCast · دنت‌کست'),
    textFrame('TALB', meta.episodeTitle),
    textFrame('TPUB', 'DentCast'),
    textFrame('TCON', 'Podcast'),
    // COMM: encoding, language, an empty description (BOM + terminator), text.
    frame('COMM', Buffer.concat([
      Buffer.from([1]), Buffer.from('per', 'latin1'), utf16(''), Buffer.from([0, 0]), utf16(comment),
    ])),
    // WOAS — «official audio source webpage». URL frames are plain Latin-1.
    frame('WOAS', Buffer.from(meta.pageUrl, 'latin1')),
  ]);
  const size = frames.length;
  const head = Buffer.from([
    0x49, 0x44, 0x33, 3, 0, 0,
    (size >> 21) & 0x7f, (size >> 14) & 0x7f, (size >> 7) & 0x7f, size & 0x7f,
  ]);
  return Buffer.concat([head, frames]);
}

/* ---------------------------------------------------------------- names -- */

/** «07:27» / «1:02:03» — the same clock the clip card prints. */
export function clock(seconds: number): string {
  const t = Math.max(0, Math.floor(seconds));
  const h = Math.floor(t / 3600);
  const m = String(Math.floor((t % 3600) / 60)).padStart(2, '0');
  const s = String(t % 60).padStart(2, '0');
  return (h ? h + ':' : '') + m + ':' + s;
}

/** «DentCast-ep91-07m27s-08m03s.mp3» — ASCII, so no file system mangles it. */
export function clipFileName(contentId: string, start: number, end: number): string {
  const ep = (/^episodes\/episode-([0-9-]+)$/.exec(contentId)?.[1] ?? 'clip');
  const part = (s: number) => {
    const t = Math.max(0, Math.floor(s));
    const h = Math.floor(t / 3600);
    const m = String(Math.floor((t % 3600) / 60)).padStart(2, '0');
    const sec = String(t % 60).padStart(2, '0');
    return (h ? h + 'h' : '') + m + 'm' + sec + 's';
  };
  return `DentCast-ep${ep}-${part(start)}-${part(end)}.mp3`;
}
