// دانلود هایلایت صوتی — the MP3 cutter behind GET /clips/:id/audio
// (services/clip-audio.ts), exercised on synthetic streams built here frame by
// frame, so every assertion can name the exact frame a cut must start on.
//
// What must hold:
//   · the cut starts on the frame that holds `start` and is exactly as long as
//     the clip in frames — on CBR, behind a large ID3 tag, and on VBR through a
//     Xing table of contents;
//   · the file is never read whole: a head and a span, nothing more;
//   · the tag names the source and never the reader's note.
import { describe, it, expect } from 'vitest';
import {
  cutMp3, parseFrameHeader, id3v2Length, buildClipTag, clipFileName, readStreamInfo,
  type RangeReader,
} from '../src/services/clip-audio.js';

const SPF = 1152 / 44100; // seconds per MPEG-1 layer III frame at 44.1 kHz

/**
 * MPEG-1 layer III, 44.1 kHz, stereo, no CRC. `pad` adds the one byte a real
 * encoder adds to some frames so the AVERAGE frame is exactly the bitrate
 * (417.96 bytes at 128 kbps) — see padded() below.
 */
function frame(kbps: number, index: number, pad = false): Uint8Array {
  const idx = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320].indexOf(kbps);
  const len = Math.floor((144 * kbps * 1000) / 44100) + (pad ? 1 : 0);
  const f = new Uint8Array(len);
  f[0] = 0xff; f[1] = 0xfb; f[2] = (idx << 4) | (pad ? 0x02 : 0); f[3] = 0x00;
  // The frame's own index, where a test can read it back.
  new DataView(f.buffer).setUint32(40, index);
  return f;
}

function indexOf(f: Uint8Array, at: number): number {
  return new DataView(f.buffer, f.byteOffset).getUint32(at + 40);
}

function join(parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}

function id3(bodyBytes: number): Uint8Array {
  const t = new Uint8Array(10 + bodyBytes);
  t.set([0x49, 0x44, 0x33, 3, 0, 0,
    (bodyBytes >> 21) & 0x7f, (bodyBytes >> 14) & 0x7f, (bodyBytes >> 7) & 0x7f, bodyBytes & 0x7f]);
  return t;
}

/** A Xing header frame with frames/bytes/TOC over `audio` (which follows it). */
function xingFrame(kbps: number, frames: Uint8Array[], tag: 'Xing' | 'Info'): Uint8Array {
  const f = frame(kbps, 0xffff00);
  f.fill(0, 4);
  const x = 4 + 32;
  f.set([...tag].map((c) => c.charCodeAt(0)), x);
  const dv = new DataView(f.buffer);
  dv.setUint32(x + 4, 1 | 2 | 4);
  const total = f.length + frames.reduce((n, a) => n + a.length, 0);
  dv.setUint32(x + 8, frames.length);
  dv.setUint32(x + 12, total);
  // TOC: byte position (of 256) at each whole percent of the duration.
  const starts: number[] = [];
  let pos = f.length;
  for (const a of frames) { starts.push(pos); pos += a.length; }
  for (let i = 0; i < 100; i++) {
    const fi = Math.min(frames.length - 1, Math.floor((i / 100) * frames.length));
    f[x + 16 + i] = Math.min(255, Math.floor((starts[fi] / total) * 256));
  }
  return f;
}

function reader(file: Uint8Array, log: Array<[number, number]> = []): RangeReader {
  return async (from, to) => {
    log.push([from, to]);
    const end = Math.min(file.length - 1, to);
    return { bytes: from > end ? new Uint8Array(0) : file.slice(from, end + 1), total: file.length };
  };
}

/** Each frame's index, in order, across a cut. */
function framesIn(audio: Uint8Array): number[] {
  const out: number[] = [];
  let p = 0;
  while (p + 4 <= audio.length) {
    const h = parseFrameHeader(audio, p);
    expect(h, `a frame at ${p}`).not.toBeNull();
    out.push(indexOf(audio, p));
    p += h!.length;
  }
  expect(p).toBe(audio.length); // no partial frame at the end
  return out;
}

/** A constant-bitrate run padded the way an encoder pads it. */
function padded(n: number, kbps: number, first = 0, carry = { frac: 0 }): Uint8Array[] {
  const exact = (144 * kbps * 1000) / 44100;
  const base = Math.floor(exact);
  return Array.from({ length: n }, (_, i) => {
    carry.frac += exact - base;
    const pad = carry.frac >= 1;
    if (pad) carry.frac -= 1;
    return frame(kbps, first + i, pad);
  });
}

const cbrFrames = (n: number, kbps = 128) => padded(n, kbps);

describe('cutMp3 — constant bitrate', () => {
  const frames = cbrFrames(40 * 60); // ~63 s
  const file = join(frames);

  it('starts on the frame holding `start` and counts the clip exactly', async () => {
    const cut = await cutMp3(reader(file), 20, 36);
    const idx = framesIn(cut.audio);
    expect(idx[0]).toBe(Math.floor(20 / SPF));
    expect(idx.length).toBe(Math.round(16 / SPF));
    // contiguous: nothing skipped, nothing doubled
    expect(idx.every((v, i) => i === 0 || v === idx[i - 1] + 1)).toBe(true);
    expect(cut.seconds).toBeCloseTo(16, 1);
  });

  it('a clip at zero starts on the first frame', async () => {
    const idx = framesIn((await cutMp3(reader(file), 0, 3)).audio);
    expect(idx[0]).toBe(0);
  });

  it('a clip running past the end is cut at the last whole frame, not refused', async () => {
    const idx = framesIn((await cutMp3(reader(file), 60, 70)).audio);
    expect(idx[idx.length - 1]).toBe(frames.length - 1);
  });

  it('a clip that starts past the end is refused as out_of_range', async () => {
    await expect(cutMp3(reader(file), 500, 510)).rejects.toMatchObject({ code: 'out_of_range' });
  });

  it('never reads the file whole', async () => {
    const log: Array<[number, number]> = [];
    await cutMp3(reader(file, log), 20, 25);
    const read = log.reduce((n, [a, b]) => n + (Math.min(b, file.length - 1) - a + 1), 0);
    expect(read).toBeLessThan(file.length / 3);
  });

  it('an ID3v1 tag after the last frame is not carried into the cut', async () => {
    const tail = new Uint8Array(128); tail.set([0x54, 0x41, 0x47]); // "TAG"
    const withTail = join([file, tail]);
    const cut = await cutMp3(reader(withTail), 60, 70);
    framesIn(cut.audio); // would fail on a partial/foreign frame
  });

  it('something that is not an MP3 is refused as not_mp3', async () => {
    await expect(cutMp3(reader(new Uint8Array(200_000)), 1, 5)).rejects.toMatchObject({ code: 'not_mp3' });
  });
});

describe('cutMp3 — behind a large ID3 tag (cover art)', () => {
  it('reads the tag size and cuts from the audio after it', async () => {
    const frames = cbrFrames(2000);
    const tag = id3(300_000); // bigger than the head read
    const file = join([tag, ...frames]);
    expect(id3v2Length(file)).toBe(tag.length);
    const idx = framesIn((await cutMp3(reader(file), 10, 20)).audio);
    expect(idx[0]).toBe(Math.floor(10 / SPF));
    expect(idx.length).toBe(Math.round(10 / SPF));
  });

  it('a tag that fills most of the head is read past, not parsed as audio', async () => {
    const frames = cbrFrames(1000);
    const file = join([id3(64 * 1024 - 100), ...frames]);
    const idx = framesIn((await cutMp3(reader(file), 5, 6)).audio);
    expect(idx[0]).toBe(Math.floor(5 / SPF));
  });
});

describe('cutMp3 — Xing/Info headers', () => {
  it('an Info (CBR) header frame is skipped and arithmetic stays exact', async () => {
    const frames = cbrFrames(3000);
    const file = join([xingFrame(128, frames, 'Info'), ...frames]);
    const info = readStreamInfo(file, 0)!;
    expect(info.mode).toBe('cbr');
    const idx = framesIn((await cutMp3(reader(file), 30, 40)).audio);
    expect(idx[0]).toBe(Math.floor(30 / SPF));
    expect(idx.length).toBe(Math.round(10 / SPF));
  });

  it('VBR: the start comes from the table of contents, the length is exact', async () => {
    // Bitrate changes every 500 frames; the table is what finds the right byte.
    const rates = [64, 192, 96, 320, 128, 256];
    const carry = { frac: 0 };
    const frames = rates.flatMap((r, k) => padded(500, r, k * 500, carry));
    const file = join([xingFrame(128, frames, 'Xing'), ...frames]);
    expect(readStreamInfo(file, 0)!.mode).toBe('toc');
    const start = 41; // inside the 320 kbps stretch
    const idx = framesIn((await cutMp3(reader(file), start, start + 12)).audio);
    // The table is 1%-granular: interpolation lands within a second or so.
    expect(Math.abs(idx[0] * SPF - start)).toBeLessThan(1.5);
    expect(idx.length).toBe(Math.round(12 / SPF));
  });
});

describe('the tag', () => {
  const tag = buildClipTag({
    title: 'بیومیمتیک — مرور فصل یک (قسمت دوم) · 07:27–08:03',
    episodeTitle: 'بیومیمتیک — مرور فصل یک (قسمت دوم)',
    pageUrl: 'https://dentcast.ir/episodes/episode-91.html',
  });

  it('is a well-formed ID3v2.3 header whose size covers its frames', () => {
    expect([...tag.subarray(0, 5)]).toEqual([0x49, 0x44, 0x33, 3, 0]);
    expect(id3v2Length(tag)).toBe(tag.length);
  });

  function frames(): Map<string, Buffer> {
    const out = new Map<string, Buffer>();
    let p = 10;
    while (p + 10 <= tag.length) {
      const id = tag.subarray(p, p + 4).toString('latin1');
      const size = tag.readUInt32BE(p + 4);
      out.set(id, tag.subarray(p + 10, p + 10 + size));
      p += 10 + size;
    }
    expect(p).toBe(tag.length);
    return out;
  }
  const text = (b: Buffer) => b.subarray(3).toString('utf16le'); // encoding byte + BOM

  it('names the episode, DentCast and the page — Persian intact, ZWNJ included', () => {
    const f = frames();
    expect(text(f.get('TIT2')!)).toBe('بیومیمتیک — مرور فصل یک (قسمت دوم) · 07:27–08:03');
    expect(text(f.get('TALB')!)).toBe('بیومیمتیک — مرور فصل یک (قسمت دوم)');
    expect(text(f.get('TPE1')!)).toBe('DentCast · دنت‌کست');
    expect(f.get('WOAS')!.toString('latin1')).toBe('https://dentcast.ir/episodes/episode-91.html');
    const comm = f.get('COMM')!.toString('utf16le');
    expect(comm).toContain('https://dentcast.ir/episodes/episode-91.html');
    expect(comm).toContain('دنت‌کست');
  });

  it('a tagged cut is still a stream a frame parser finds right after the tag', async () => {
    const cut = await cutMp3(reader(join(cbrFrames(500))), 1, 2);
    const file = Buffer.concat([tag, cut.audio]);
    expect(parseFrameHeader(file, id3v2Length(file))).not.toBeNull();
  });
});

describe('clipFileName', () => {
  it('is ASCII and says episode and span', () => {
    expect(clipFileName('episodes/episode-91', 447.3, 483)).toBe('DentCast-ep91-07m27s-08m03s.mp3');
    expect(clipFileName('episodes/episode-106-1', 3725, 3790)).toBe('DentCast-ep106-1-1h02m05s-1h03m10s.mp3');
  });
});
