# J.S. Bach, Prelude in C major BWV 846 (public domain), bars 1-7 + a closing C chord, synthesized as a soft piano.
import numpy as np, wave
SR=44100; DUR=23.0
N=lambda n: 440*2**((n-69)/12)
def m(name):
    names={'C':0,'D':2,'E':4,'F':5,'G':7,'A':9,'B':11}
    sh=1 if '#' in name else 0; o=int(name[-1]); return 12*(o+1)+names[name[0]]+sh
BARS=[['C4','E4','G4','C5','E5'],['C4','D4','A4','D5','F5'],['B3','D4','G4','D5','F5'],['C4','E4','G4','C5','E5'],
      ['C4','E4','A4','E5','A5'],['C4','D4','F#4','A4','D5'],['B3','D4','G4','D5','G5']]
s16=3.0/16  # one bar = 3.0 s
out=np.zeros(int(SR*DUR)+SR)
rng=np.random.default_rng(3)
def note(t0,midi,vel,length):
    f=N(midi); n=int(SR*length); t=np.arange(n)/SR
    dec=np.exp(-t*(1.6+f/900))
    w=np.zeros(n)
    for h,a in [(1,1),(2,.42),(3,.2),(4,.11),(5,.05),(6,.03)]:
        fh=f*h*np.sqrt(1+0.0004*h*h)
        w+=a*np.sin(2*np.pi*fh*t+rng.random())*np.exp(-t*h*0.9)
    att=np.minimum(1,t/0.004)
    w*=dec*att*vel
    i=int(SR*t0); out[i:i+n]+=w[:len(out)-i]
t0=0.35
for bi,b in enumerate(BARS):
    seq=[b[0],b[1],b[2],b[3],b[4],b[2],b[3],b[4]]*2
    for k,nm in enumerate(seq):
        tt=t0+bi*3.0+k*s16
        hold=3.0-k*s16 if k in (0,1) else 1.6     # bass and tenor ring through the bar, as in the score
        vel=.55 if k==0 else (.4 if k==1 else .3)
        note(tt,m(nm),vel*(1.15 if k%8==2 else 1),hold)
# closing chord
tc=t0+7*3.0
for nm,v in [('C3',.5),('G3',.35),('C4',.35),('E4',.3),('G4',.28),('C5',.3)]:
    note(tc+0.02*['C3','G3','C4','E4','G4','C5'].index(nm),m(nm),v,DUR-tc+0.8)
out=out[:int(SR*DUR)]
# small room: a few early reflections + a decaying tail
ir=np.zeros(int(SR*1.6)); ir[0]=1
for d,g in [(0.023,.35),(0.037,.28),(0.051,.22),(0.079,.16)]: ir[int(SR*d)]+=g
tail=rng.standard_normal(len(ir))*np.exp(-np.arange(len(ir))/SR*3.2)*0.02; ir+=tail
wet=np.convolve(out,ir)[:len(out)]
L=out*.7+wet*.5; R=np.roll(out,int(SR*.0004))*.7+np.roll(wet,int(SR*.011))*.5
st=np.stack([L,R],1)
fade=np.ones(len(st)); n=int(SR*1.2); fade[-n:]=np.linspace(1,0,n)**1.5; st*=fade[:,None]
st/=np.max(np.abs(st))/0.85
with wave.open('music.wav','wb') as w:
    w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((st*32767).astype('<i2').tobytes())
print('ok',len(st)/SR)
