"""Original procedural electric-guitar-style score; numpy + scipy, no samples."""
import numpy as np
from scipy.io.wavfile import write
from pathlib import Path
SR=44100; DUR=22
mix=np.zeros((SR*DUR,2),np.float64)
rng=np.random.default_rng(24)
def note(t,midi,dur=.8,amp=.12,pan=0,bright=False):
    f=440*2**((midi-69)/12); n=int(SR*dur); delay=int(SR/f)
    buf=rng.uniform(-1,1,delay); out=np.zeros(n)
    for i in range(n):
        k=i%delay; v=buf[k]; buf[k]=.996*(v+buf[(k+1)%delay])/2; out[i]=v
    # Pickup-like overdrive and short attack; tails decay naturally.
    out=np.tanh(out*(2.3 if bright else 1.5))*np.minimum(np.arange(n)/(SR*.008),1)*np.exp(-np.arange(n)/(SR*dur*.65))*amp
    pos=int(t*SR); end=min(len(mix),pos+n); out=out[:end-pos]
    mix[pos:end,0]+=out*np.sqrt((1-pan)/2);mix[pos:end,1]+=out*np.sqrt((1+pan)/2)
    for lag,gain in [(.13,.18),(.26,.08)]:
        q=pos+int(lag*SR); e=min(len(mix),q+len(out))
        if q<len(mix):mix[q:e]+=out[:e-q,None]*gain
# Quiet clinic: open fifths, then an unsettled phrase while considering treatment.
for t in np.arange(.5,9.1,.625):
    seq=[52,59,64,59,55,62,66,62];note(float(t),seq[int((t-.5)/.625)%8],.9,.13,(-.2 if int(t*2)%2 else .2))
for t,m in [(5,67),(6.25,66),(7.5,62),(8.75,63)]:note(t,m,1.1,.09)
# Phone arrival and continuous reading: quicker repeated arpeggio.
for i,t in enumerate(np.arange(9.4,13.5,.3125)):note(float(t),[52,59,64,67,66,64,59,62][i%8],.65,.105,(-.25 if i%2 else .25))
# Phone exits; brief breath before the light-bulb chord.
for i,m in enumerate([52,59,64,68,71,76]):note(14.25+i*.045,m,2,.12,bright=True)
# Confident return to work, resolving to E major at the end card.
for i,t in enumerate(np.arange(15.4,20.5,.5)):note(float(t),[64,68,71,76,71,68,66,68][i%8],.95,.115)
for i,m in enumerate([40,52,59,64,68,71]):note(19.4+i*.035,m,2.5,.11,bright=True)
# Soft limiter and final fade.
mix=np.tanh(mix*1.1);mix*=np.minimum((DUR-np.arange(len(mix))/SR)/1.1,1).clip(0,1)[:,None]
write(str(Path(__file__).with_name('music.wav')),SR,(mix*26000).astype(np.int16))
