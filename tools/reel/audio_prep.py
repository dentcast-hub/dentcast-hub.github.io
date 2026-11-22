#!/usr/bin/env python3
"""Prepare a TTS narration for a reel, at natural speed.

  python3 tools/reel/audio_prep.py tts.wav --out narr.m4a [--max-pause 0.42] [--hold 44.6:1.0 --hold 47.7:1.0]
      [--marks 0.2,5.8,11.6] [--wave wave.js --total 61.4]

* Long pauses are shortened to --max-pause seconds (leading silence removed, trailing kept to 0.4 s).
  The speed is never changed.
* --hold T:D inserts D seconds of silence at time T of the TRIMMED audio, moved to the middle of the
  nearest real pause so that no word is cut.
* --marks maps times of the original file (paragraph starts) to the final timeline, for scene timing.
* --wave writes window.WAVE (22 bars per frame at 30 fps, from the final audio) for the header waveform.
* --map prints a coarse speech map of the original (one character per 0.1 s) to find paragraph starts.
"""
import argparse, json, subprocess, sys, tempfile, wave
import numpy as np


def read(path):
    tmp = tempfile.NamedTemporaryFile(suffix='.wav', delete=False).name
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', path, '-ac', '1', '-ar', '48000', tmp], check=True)
    w = wave.open(tmp)
    x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
    return x, 48000


def silent_mask(x, sr, thr=-38):
    hop = int(sr * 0.01)
    n = len(x) // hop
    db = 20 * np.log10(np.array([np.sqrt((x[i*hop:(i+1)*hop] ** 2).mean()) for i in range(n)]) + 1e-9)
    return db < thr


def runs(mask):
    out, i, n = [], 0, len(mask)
    while i < n:
        if mask[i]:
            j = i
            while j < n and mask[j]:
                j += 1
            out.append((i * 0.01, j * 0.01))
            i = j
        else:
            i += 1
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('src')
    ap.add_argument('--out')
    ap.add_argument('--max-pause', type=float, default=0.42)
    ap.add_argument('--hold', action='append', default=[])
    ap.add_argument('--marks', default='')
    ap.add_argument('--wave')
    ap.add_argument('--total', type=float)
    ap.add_argument('--map', action='store_true')
    a = ap.parse_args()
    x, sr = read(a.src)
    m = silent_mask(x, sr)
    if a.map:
        s = ''.join('.' if m[i:i+10].mean() > .5 else '#' for i in range(0, len(m), 10))
        for k in range(0, len(s), 100):
            print(f'{k/10:6.1f} {s[k:k+100]}')
        return
    dur = len(x) / sr
    cut = []
    for ta, tb in runs(m):
        if ta == 0:
            cut.append((0, max(0, tb - 0.05)))
        elif tb >= dur - 0.02:
            cut.append((ta + 0.4, dur))
        elif tb - ta > a.max_pause:
            mid, h = (ta + tb) / 2, (tb - ta - a.max_pause) / 2
            cut.append((mid - h, mid + h))
    segs, prev = [], 0.0
    for ca, cb in cut:
        if ca > prev:
            segs.append((prev, ca))
        prev = max(prev, cb)
    if prev < dur:
        segs.append((prev, dur))
    y = np.concatenate([x[int(s*sr):int(e*sr)] for s, e in segs])

    def mapt(t):
        acc = 0
        for s, e in segs:
            if t <= s:
                return acc
            if t <= e:
                return acc + t - s
            acc += e - s
        return acc
    marks = [mapt(float(v)) for v in a.marks.split(',') if v.strip()]
    holds = sorted((tuple(map(float, h.split(':'))) for h in a.hold), reverse=True)
    pauses = runs(silent_mask(y, sr))
    for t, d in holds:
        best = min(pauses, key=lambda r: abs((r[0] + r[1]) / 2 - t))
        c = (best[0] + best[1]) / 2
        i = int(c * sr)
        y = np.concatenate([y[:i], np.zeros(int(d * sr), dtype=np.float32), y[i:]])
        marks = [v + d if v > c else v for v in marks]
        print(f'hold {d}s at {c:.2f} (asked {t})')
    tmp = tempfile.NamedTemporaryFile(suffix='.wav', delete=False).name
    o = wave.open(tmp, 'w'); o.setnchannels(1); o.setsampwidth(2); o.setframerate(sr)
    o.writeframes((np.clip(y, -1, 1) * 32767).astype(np.int16).tobytes()); o.close()
    if a.out:
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', tmp, '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11',
                        '-ar', '48000', '-c:a', 'aac', '-b:a', '192k', a.out], check=True)
    print(json.dumps({'length': round(len(y) / sr, 2), 'marks': [round(v, 2) for v in marks]}))
    if a.wave:
        fps, B, win = 30, 22, 2048
        N = int((a.total or len(y) / sr) * fps) + 2
        edges = np.geomspace(120, 5000, B + 1)
        freqs = np.fft.rfftfreq(win, 1 / sr)
        rows = []
        for i in range(N):
            c = int(i / fps * sr)
            seg = y[max(0, c - win // 2):c + win // 2]
            if len(seg) < win:
                seg = np.pad(seg, (0, win - len(seg)))
            sp = np.abs(np.fft.rfft(seg * np.hanning(win)))
            rows.append([sp[(freqs >= edges[k]) & (freqs < edges[k + 1])].mean() for k in range(B)])
        w_ = np.log1p(np.array(rows) * 20)
        w_ = np.clip(w_ / max(np.percentile(w_, 98), 1e-6), 0, 1)
        for i in range(1, len(w_)):
            w_[i] = np.maximum(w_[i], w_[i - 1] * 0.6)
        open(a.wave, 'w').write('window.WAVE=' + json.dumps([[round(float(v), 2) for v in r] for r in w_]) + ';')


if __name__ == '__main__':
    sys.exit(main())
