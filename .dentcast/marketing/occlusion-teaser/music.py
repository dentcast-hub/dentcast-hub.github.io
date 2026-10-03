import numpy as np, wave
SR=44100; DUR=22.0; N=int(SR*DUR)
L=np.zeros(N); Rr=np.zeros(N)
rng=np.random.default_rng(5)
def hz(n): return 440*2**((n-69)/12)
def add(sig,t0,pan=0.0,g=1.0):
    i=int(t0*SR); j=min(N,i+len(sig))
    if j<=i: return
    s=sig[:j-i]*g
    L[i:j]+=s*np.sqrt((1-pan)/2); Rr[i:j]+=s*np.sqrt((1+pan)/2)
def env(n,a,d,s=0.0,r=None):
    t=np.arange(n)/SR; e=np.minimum(1,t/max(a,1e-4))
    if r is None: e*=np.exp(-np.maximum(0,t-a)/d)
    else:
        rel=max(0,n/SR-r); e*=np.where(t<rel,1,np.exp(-(t-rel)/(r/4)))
    return e
def tone(f,dur,harm=(1,),amps=(1,),det=0.0):
    t=np.arange(int(dur*SR))/SR; s=np.zeros_like(t)
    for h,a in zip(harm,amps):
        for dd in ((0,) if det==0 else (-det,det)):
            s+=a*np.sin(2*np.pi*f*h*(1+dd)*t+rng.random()*6.28)
    return s
def pluck(f,dur=0.9,bright=1.0):
    s=tone(f,dur,(1,2,3,4),(1,.5*bright,.25*bright,.12*bright))
    return s*env(len(s),.004,.22)
def bell(f,dur=2.5):
    s=tone(f,dur,(1,2.76,5.4,8.9),(1,.45,.25,.12))
    return s*env(len(s),.002,.55)
def pad(notes,dur,att=.6):
    s=sum(tone(hz(n),dur,(1,2,3),(1,.3,.12),det=.004) for n in notes)/len(notes)
    t=np.arange(len(s))/SR
    e=np.minimum(1,t/att)*np.minimum(1,(dur-t)/.8)
    return s*np.clip(e,0,1)
def noise(dur): return rng.standard_normal(int(dur*SR))
def lp(x,a):  # one-pole lowpass, a in (0,1): smaller = darker
    y=np.empty_like(x); z=0.0
    for i in range(len(x)): z+=a*(x[i]-z); y[i]=z
    return y
def kick(dur=.35,f0=110,f1=45):
    t=np.arange(int(dur*SR))/SR; f=f1+(f0-f1)*np.exp(-t*30)
    return np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*9)

# ---- A: lost (0-7s) — tritone drone, accelerating dissonant plucks, heartbeat ----
d=7.6; t=np.arange(int(d*SR))/SR
trem=1+.35*np.sin(2*np.pi*(2+t*.9)*t)
dr=(tone(hz(38),d,(1,2,3),(1,.4,.2),det=.003)+.7*tone(hz(44),d,(1,2),(1,.3),det=.004))*trem
dr*=np.clip(t/1.2,0,1)*np.clip((7.3-t)/.3,0,1)*(.5+.5*t/7)
add(dr,0,0,.16)
tt=.4; pitches=[62,63,68,69,73,74,75,80,81,85]
while tt<6.9:
    f=hz(rng.choice(pitches)+rng.choice([0,0,12,-12]))
    add(pluck(f,.7,1.2),tt,rng.uniform(-.8,.8),.07+.04*tt/7)
    tt+=1/(2.2+tt*1.5)*rng.uniform(.6,1.4)
hb=1.0
while hb<6.9:
    add(kick(.3,80,40),hb,0,.35); add(kick(.3,80,40),hb+.18,0,.2)
    hb+=max(.55,1.2-hb*.09)
sw=noise(7.0)*np.linspace(0,1,int(7.0*SR))**2.5
add(lp(sw,.08),0.2,0,.10)

# ---- B: decision (7-9.5) — hush, a held breath, the tap, the opening ----
add(pad([62,69,74],2.4,.8)*.8,7.1,0,.12)
rs=noise(1.6)*np.linspace(0,1,int(1.6*SR))**3
add(lp(rs,.25),7.0,0,.08)
add(bell(hz(81),2.2),8.62,.1,.32); add(bell(hz(88),2.2),8.72,-.1,.22)   # «ثبت شد»
wh=noise(1.4)*np.sin(np.linspace(0,np.pi,int(1.4*SR)))**2
add(wh-lp(wh,.05),9.0,0,.09)
add(kick(.9,70,30),9.32,0,.55)

# ---- C: the road (9.6-19.2) — D  A  Bm  G, 100 bpm ----
B=0.6; prog=[(9.6,[50,62,66,69,74]),(12.0,[45,61,64,69,73]),(14.4,[47,62,66,71,74]),(16.8,[43,62,67,71,74])]
for t0,ch in prog:
    add(pad(ch[1:],2.5,.4 if t0>9.7 else .9),t0,0,.24)
    add(tone(hz(ch[0]),2.4,(1,2),(1,.25))*env(int(2.4*SR),.02,1.2),t0,0,.22)
# pulse kick + soft hat while walking
for k in range(int((19.2-11.7)/B)):
    tk=11.7+k*B
    if tk<17.0: add(kick(),tk,0,.45)
    h=noise(.06)*np.exp(-np.arange(int(.06*SR))/SR*80); add(h-lp(h,.3),tk+B/2,.3,.05)
# arpeggio = footsteps of understanding
arp_t=11.7; k=0
while arp_t<16.9:
    ch=[c for t0,c in prog if t0<=arp_t+1e-6][-1][1:]
    seq=[ch[0],ch[1],ch[2],ch[3],ch[2]+12,ch[3],ch[2],ch[1]]
    add(pluck(hz(seq[k%8]+12),.8,.8),arp_t,(-.4 if k%2 else .4),.15)
    arp_t+=B/2; k+=1

# ---- D: certificate (17.2) — shimmer ----
for i,n in enumerate([86,90,93,98,93,90]):
    add(bell(hz(n),1.8),17.25+i*.09,rng.uniform(-.7,.7),.10)
for _ in range(22):
    add(bell(hz(rng.choice([93,98,102,105])),.8),rng.uniform(17.5,18.9),rng.uniform(-.9,.9),.035)

# ---- E: end card (19.2-22) — Dmaj9, let it ring ----
fin=pad([50,57,62,66,69,73,76],2.8,.5)
t=np.arange(len(fin))/SR; fin*=np.clip((2.8-t)/2.2,0,1)
add(fin,19.2,0,.22); add(bell(hz(74),2.6),19.25,0,.18); add(kick(1.2,60,30),19.2,0,.4)

# ---- reverb (FFT convolution with a decaying-noise tail) ----
def reverb(x,dec=1.8):
    n=int(dec*SR); ir=rng.standard_normal(n)*np.exp(-np.arange(n)/SR*4/dec); ir/=np.sqrt((ir**2).sum())
    m=1<<int(np.ceil(np.log2(len(x)+n)))
    return np.fft.irfft(np.fft.rfft(x,m)*np.fft.rfft(ir,m),m)[:len(x)]
wetL,wetR=reverb(L),reverb(Rr)
outL=L+.35*wetL; outR=Rr+.35*wetR
fade=np.clip((DUR-np.arange(N)/SR)/.6,0,1); outL*=fade; outR*=fade
pk=max(abs(outL).max(),abs(outR).max()); outL/=pk/0.89; outR/=pk/0.89
st=np.empty(2*N); st[0::2]=outL; st[1::2]=outR
w=wave.open('music.wav','wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
w.writeframes((st*32767).astype('<i2').tobytes()); w.close()
