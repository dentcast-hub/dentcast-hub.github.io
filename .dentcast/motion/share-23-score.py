"""Original score for share-23-motion.html — synthesized electric guitar, no samples.

Karplus-Strong strings (exact-pitch via an allpass in the loop), a pickup-position
comb, clean and overdriven amp paths, ping-pong delay and a convolution reverb.
Every cue is placed on the film's own timeline (same seconds as render(t)), and the
heartbeat thump is integrated from the same rate() the on-screen ECG uses.

    python3 share-23-score.py out.wav
"""
import sys
import numpy as np
from scipy.signal import lfilter, butter, sosfilt, fftconvolve

SR = 48000
DUR = 32.0
N = int(SR * DUR)
rng = np.random.default_rng(23)


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def ks(freq, dur, t60=3.0, bright=0.6, pick=0.18, swell=0.0, cut=None):
    """One plucked string, mono, length dur (s)."""
    n = int(SR * dur)
    P = SR / freq
    L = int(P - 0.6)
    d = P - 0.5 - L
    c = (1 - d) / (1 + d)
    g = 10 ** (-3 / (freq * t60))
    # excitation: filtered noise burst, then the pickup/pick-position comb
    exc = rng.uniform(-1, 1, L + 2)
    a = 1 - bright
    exc = lfilter([1 - a], [1, -a], exc)
    x = np.zeros(n)
    x[:len(exc)] = exc
    k = max(1, int(pick * P))
    x[k:] -= x[:-k].copy() * 0.9
    # loop: y = x + g*0.5*(1+z^-1)*A(z)*z^-L * y,  A(z) = (c + z^-1)/(1 + c z^-1)
    b = np.array([1.0, c])
    den = np.zeros(L + 3)
    den[0], den[1] = 1.0, c
    den[L] -= g * 0.5 * c
    den[L + 1] -= g * 0.5 * (1 + c)
    den[L + 2] -= g * 0.5
    y = lfilter(b, den, x)
    env = np.ones(n)
    if swell > 0:
        s = int(swell * SR)
        env[:s] = np.linspace(0, 1, s) ** 2
    if cut is not None:
        ci = int(cut * SR)
        if ci < n:
            f = int(0.015 * SR)
            env[ci:ci + f] *= np.linspace(1, 0, len(env[ci:ci + f]))
            env[ci + f:] = 0
    tail = int(0.03 * SR)
    env[-tail:] *= np.linspace(1, 0, tail)
    return y * env


hp = butter(2, 90, 'hp', fs=SR, output='sos')
cab = butter(4, 4200, 'lp', fs=SR, output='sos')
cab_hp = butter(2, 110, 'hp', fs=SR, output='sos')


def clean_amp(x):
    x = sosfilt(hp, x)
    return np.tanh(1.3 * x) / np.tanh(1.3)


def drive_amp(x, gain=9.0):
    x = sosfilt(hp, x)
    y = np.tanh(gain * x + 0.08) - np.tanh(0.08)
    return sosfilt(cab_hp, sosfilt(cab, y)) * 0.55


class Bus:
    def __init__(self):
        self.l = np.zeros(N)
        self.r = np.zeros(N)

    def add(self, sig, t, gain=1.0, pan=0.0):
        i = int(t * SR)
        if i >= N:
            return
        sig = sig[:N - i] * gain
        self.l[i:i + len(sig)] += sig * np.sqrt((1 - pan) / 2)
        self.r[i:i + len(sig)] += sig * np.sqrt((1 + pan) / 2)


def note(bus, m, t, dur=3.0, gain=0.35, pan=0.0, drive=False, dgain=9.0, **kw):
    s = ks(midi(m), dur, **kw)
    s = drive_amp(s, dgain) if drive else clean_amp(s * 1.0)
    bus.add(s, t, gain, pan)


def ir(seconds=3.4, decay=0.9, seed=0):
    r = np.random.default_rng(seed)
    n = int(seconds * SR)
    t = np.arange(n) / SR
    e = np.exp(-t * 6.9 / (decay * 3.4 / 1.0) / 1.0)
    nl = r.standard_normal(n) * e
    lp = butter(2, 5200, 'lp', fs=SR, output='sos')
    nl = sosfilt(lp, nl)
    pre = int(0.018 * SR)
    return np.concatenate([np.zeros(pre), nl]) / np.sqrt(np.sum(nl ** 2))


IR_L, IR_R = ir(seed=1), ir(seed=2)


def fx(bus, delay=0.28, fb=0.38, dmix=0.32, rmix=0.32):
    l, r = bus.l.copy(), bus.r.copy()
    D = int(delay * SR)
    dl, dr = np.zeros(N), np.zeros(N)
    src = (l + r) / 2
    tap = src.copy()
    lp = butter(1, 3000, 'lp', fs=SR, output='sos')
    side = 0
    amt = 1.0
    off = D
    while amt > 0.02 and off < N:
        amt *= fb if off > D else 1.0
        tap = sosfilt(lp, tap)
        (dl if side == 0 else dr)[off:] += tap[:N - off] * amt
        side ^= 1
        off += D
    l2, r2 = l + dl * dmix, r + dr * dmix
    wl = fftconvolve(l2, IR_L)[:N]
    wr = fftconvolve(r2, IR_R)[:N]
    return l2 + wl * rmix, r2 + wr * rmix


def gate(points):
    t = np.arange(N) / SR
    xs, ys = zip(*points)
    return np.interp(t, xs, ys)


E8 = 0.375          # eighth note at 80 bpm
FREEZE, PANIC_END, RESUME = 7.6, 11.8, 21.0

# ── G1: the chair, then the pressure (0 → 7.6) ──
g1 = Bus()
bars = [(0.3, [50, 57, 64, 65, 69, 65, 64, 57]),           # Dm(add9)
        (3.3, [46, 53, 57, 64, 69, 64, 57, 53])]           # Bbmaj7#11
for t0, pat in bars:
    for k, m in enumerate(pat):
        t = t0 + k * E8
        if t >= FREEZE:
            break
        note(g1, m, t, dur=4.0, gain=0.30, pan=(-0.35 if k % 2 else 0.35), t60=3.2, bright=0.55,
             cut=FREEZE - t)
# the arpeggio keeps going into the crisis, crowding itself
t, k, pat = 6.3, 0, [50, 51, 57, 51]
while t < FREEZE:
    note(g1, pat[k % 4] + 12, t, dur=2.0, gain=0.22, pan=0.4 * (-1) ** k, t60=2.0, cut=FREEZE - t)
    t += E8 * 0.5
    k += 1
# palm-muted D chugs, accelerating with the pulse
t, step = 4.6, 0.5
while t < FREEZE:
    lvl = 0.25 + 0.35 * (t - 4.6) / 3.0
    note(g1, 38, t, dur=0.35, gain=lvl, drive=True, dgain=14, t60=0.18, bright=0.7, pick=0.12,
         pan=-0.15, cut=min(0.3, FREEZE - t))
    t += step
    step = max(0.12, step * 0.9)
# the b9 that will not resolve
note(g1, 75, 5.3, dur=2.3, gain=0.22, drive=True, dgain=6, swell=1.6, t60=6, bright=0.4, pan=0.25,
     cut=FREEZE - 5.3)
L1, R1 = fx(g1, rmix=0.30)
gt1 = gate([(0, 1), (FREEZE, 1), (FREEZE + 0.02, 0.18), (8.6, 0.0), (DUR, 0)])
L1 *= gt1
R1 *= gt1

# ── G2: frozen harmonic, then the panic (7.6 → 11.8, hard stop) ──
g2 = Bus()
note(g2, 93, FREEZE + 0.02, dur=4.0, gain=0.20, t60=7, bright=0.95, pick=0.5, pan=0.0)
note(g2, 86, FREEZE + 0.02, dur=4.0, gain=0.12, t60=7, bright=0.95, pick=0.5, pan=0.3)
t, k = 8.3, 0
clus = [50, 51, 57, 56]
while t < PANIC_END:
    prog = (t - 8.3) / 3.5
    note(g2, clus[k % 4], t, dur=0.25, gain=0.10 + 0.22 * prog, drive=True, dgain=12, t60=0.6,
         bright=0.75, pan=0.5 * np.sin(k * 0.9), cut=min(0.2, PANIC_END - t))
    note(g2, clus[(k + 2) % 4] + 12, t + 0.045, dur=0.25, gain=0.06 + 0.12 * prog, drive=True, dgain=10,
         t60=0.5, pan=-0.5 * np.sin(k * 0.9), cut=min(0.2, PANIC_END - t - 0.045))
    t += 0.095
    k += 1
t, step = 8.3, 0.25
while t < PANIC_END:
    note(g2, 38, t, dur=0.3, gain=0.42, drive=True, dgain=16, t60=0.15, pick=0.12, cut=min(0.25, PANIC_END - t))
    t += step
L2, R2 = fx(g2, dmix=0.2, rmix=0.25)
gt2 = gate([(0, 0), (FREEZE, 0), (FREEZE + 0.005, 1), (PANIC_END, 1), (PANIC_END + 0.03, 0), (DUR, 0)])
L2 *= gt2
R2 *= gt2

# ── G3: ∆, the remembered page, the two questions (12.3 → 21) ──
g3 = Bus()
note(g3, 86, 12.3, dur=6, gain=0.30, t60=9, bright=0.95, pick=0.5)           # the ∆ ping
note(g3, 81, 12.32, dur=6, gain=0.20, t60=9, bright=0.95, pick=0.5, pan=-0.3)
swells = [(12.9, [43, 55, 62, 66, 71]),    # Gmaj7
          (14.9, [42, 57, 62, 64, 69]),    # D/F# add9
          (16.9, [40, 59, 62, 66, 67]),    # Em9
          (18.9, [45, 57, 62, 64, 69])]    # Asus4
for t0, ch in swells:
    for j, m in enumerate(ch):
        note(g3, m, t0 + j * 0.06, dur=3.2, gain=0.20, swell=0.7, t60=5, bright=0.45,
             pan=(j - 2) * 0.22)
for t0, m in [(15.2, 78), (16.1, 76), (17.3, 74), (18.2, 71)]:                 # a half-remembered line
    note(g3, m, t0, dur=2.5, gain=0.13, t60=4, bright=0.6, pan=0.35)
for j, t0 in enumerate([17.55, 17.7, 17.85, 18.0]):                           # the four stages appear
    note(g3, [62, 66, 69, 74][j], t0, dur=1.2, gain=0.12, t60=1.6, pan=0.5 - j * 0.33)
note(g3, 86, 18.95, dur=4, gain=0.22, t60=6, bright=0.95, pick=0.5)          # «تو اینجایی»
for j, t0 in enumerate([19.75, 19.91, 20.07, 20.23]):                         # the four systems
    note(g3, [69, 73, 76, 81][j], t0, dur=1.5, gain=0.12, t60=2, pan=-0.45 + j * 0.3)
L3, R3 = fx(g3, delay=0.42, fb=0.45, dmix=0.4, rmix=0.55)
gt3 = gate([(0, 0), (12.25, 0), (12.28, 1), (RESUME, 1), (22.2, 0.25), (23.5, 0), (DUR, 0)])
L3 *= gt3
R3 *= gt3
# a low bed under the memory
tt = np.arange(N) / SR
bed = (np.sin(2 * np.pi * midi(38) * tt) + 0.4 * np.sin(2 * np.pi * midi(45) * tt)) * 0.035
bed *= gate([(0, 0), (12.6, 0), (14.0, 1), (20.5, 1), (22.0, 0), (DUR, 0)])

# ── G4: back in the chair, steady; then the mark (21 → 32) ──
g4 = Bus()
for k, m in enumerate([50, 57, 64, 66, 69, 66, 64, 57]):                      # D(add9), the opening, now major
    note(g4, m, RESUME + k * E8, dur=4, gain=0.30, pan=(-0.35 if k % 2 else 0.35), t60=3.2, bright=0.6)
for j, m in enumerate([43, 50, 57, 59, 62, 69]):                              # the veneer seats: G(add9)
    note(g4, m, 24.0 + j * 0.018, dur=3, gain=0.24, drive=True, dgain=3.5, t60=3.5, pan=(j - 2.5) * 0.15)
note(g4, 93, 24.6, dur=4, gain=0.16, t60=6, bright=0.95, pick=0.5)          # the cure
for k, m in enumerate([59, 62, 69, 62]):
    note(g4, m, 24.75 + k * E8, dur=3, gain=0.22, t60=3, pan=0.35 * (-1) ** k)
for k, m in enumerate([45, 57, 62, 64]):                                      # Asus, leaning home
    note(g4, m, 25.6 + k * 0.2, dur=3, gain=0.22, t60=3, pan=-0.3 + k * 0.2)
for j, m in enumerate([38, 45, 50, 54, 57, 64, 69]):                          # «دنت‌کست»: D(add9), let ring
    note(g4, m, 26.5 + j * 0.03, dur=5.5, gain=0.26, drive=True, dgain=4, t60=12, bright=0.55,
         pan=(j - 3) * 0.14)
note(g4, 86, 29.0, dur=3, gain=0.12, t60=6, bright=0.95, pick=0.5, pan=0.3)  # the link appears
L4, R4 = fx(g4, rmix=0.38)
gt4 = gate([(0, 0), (RESUME - 0.01, 0), (RESUME, 1), (30.2, 1), (DUR, 0)])
L4 *= gt4
R4 *= gt4

# ── heartbeat, from the film's own rate() ──
def rate(t):
    if t < 4.5: return 72
    if t < FREEZE: return 72 + (150 - 72) * min(1, (t - 4.5) / 2.7)
    if t < 12.6: return 158
    if t < 21: return 58
    return 66


def level(t):
    if FREEZE <= t < 8.35 or 11.8 <= t < 12.7: return 0
    if t < 4.5: return 0.35
    if t < FREEZE: return 0.35 + 0.65 * (t - 4.5) / 3.1
    if t < 11.8: return 1.0
    if t < 21: return 0.18
    if t < 25.4: return 0.3
    return 0


heart = np.zeros(N)
ph, t, dt, last = 0.0, 0.0, 1 / 1000, -1
while t < DUR:
    ph += rate(t) / 60 * dt
    beat = int(ph - 0.31) if ph >= 0.31 else -1
    if beat != last and beat >= 0:
        last = beat
        v = level(t)
        if v > 0:
            n = int(0.35 * SR)
            ts = np.arange(n) / SR
            f = 52 + 40 * np.exp(-ts * 30)
            th = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-ts * 11) * v * 0.55
            i = int(t * SR)
            heart[i:i + n] += th[:N - i]
            j = i + int(0.14 * SR)                                             # the second, softer "dub"
            if j < N:
                heart[j:j + n] += th[:N - j] * 0.5
    t += dt

heart *= gate([(0, 1), (FREEZE, 1), (FREEZE + 0.01, 0), (8.3, 0), (8.31, 1), (PANIC_END, 1), (PANIC_END + 0.02, 0),
               (12.7, 0), (12.71, 1), (DUR, 1)])
# a warm bed under the mark, so the last chord lands somewhere
endbed = sum(np.sin(2 * np.pi * midi(m) * tt) * a for m, a in [(38, .03), (50, .025), (57, .02), (66, .012)])
endbed *= gate([(0, 0), (26.4, 0), (27.6, 1), (30.0, 1), (DUR, 0)])
bed = bed + endbed
L = L1 + L2 + L3 + L4 + bed + heart
R = R1 + R2 + R3 + R4 + bed + heart
peak = max(np.abs(L).max(), np.abs(R).max())
L, R = np.tanh(1.4 * L / peak) / np.tanh(1.4) * 0.89, np.tanh(1.4 * R / peak) / np.tanh(1.4) * 0.89
fade_in = np.clip(np.arange(N) / (0.2 * SR), 0, 1)
L *= fade_in
R *= fade_in

import wave
out = sys.argv[1] if len(sys.argv) > 1 else 'share-23-score.wav'
pcm = (np.stack([L, R], 1) * 32767).astype('<i2')
with wave.open(out, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('wrote', out, f'{DUR}s')
