import numpy as np, wave
SR=44100; DUR=26.0; N=int(SR*DUR); B=60/124
L=np.zeros(N); Rr=np.zeros(N); rng=np.random.default_rng(3)
def hz(n): return 440*2**((n-69)/12)
def add(sig,t0,pan=0.0,g=1.0):
    i=int(t0*SR); j=min(N,i+len(sig))
    if j<=i or i<0: return
    s=sig[:j-i]*g; L[i:j]+=s*np.sqrt((1-pan)/2); Rr[i:j]+=s*np.sqrt((1+pan)/2)
def tone(f,dur,harm=(1,),amps=(1,),det=0.0):
    t=np.arange(int(dur*SR))/SR; s=np.zeros_like(t)
    for h,a in zip(harm,amps):
        for dd in ((0,) if det==0 else (-det,det)): s+=a*np.sin(2*np.pi*f*h*(1+dd)*t+rng.random()*6.28)
    return s
def dec(n,a,d): t=np.arange(n)/SR; return np.minimum(1,t/max(a,1e-4))*np.exp(-np.maximum(0,t-a)/d)
def pluck(f,dur=.5,b=1.0): s=tone(f,dur,(1,2,3,4),(1,.5*b,.25*b,.12*b)); return s*dec(len(s),.004,.16)
def bell(f,dur=2.0): s=tone(f,dur,(1,2.76,5.4,8.9),(1,.45,.25,.12)); return s*dec(len(s),.002,.5)
def pad(notes,dur,att=.3):
    s=sum(tone(hz(n),dur,(1,2,3),(1,.3,.12),det=.004) for n in notes)/len(notes); t=np.arange(len(s))/SR
    return s*np.clip(np.minimum(t/att,(dur-t)/.25),0,1)
def noise(d): return rng.standard_normal(int(d*SR))
def hp(x): y=x.copy(); y[1:]-=0.97*x[:-1]; return y
def kick(dur=.32,f0=120,f1=45):
    t=np.arange(int(dur*SR))/SR; f=f1+(f0-f1)*np.exp(-t*32); return np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*9)
def hat(d=.05,open_=False): n=noise(.22 if open_ else d); return hp(hp(n))*np.exp(-np.arange(len(n))/SR*(14 if open_ else 70))
def clap(): n=noise(.18); e=np.exp(-np.arange(len(n))/SR*22); return hp(n)*e
def bass(f,d): s=tone(f,d,(1,2,3),(1,.45,.2)); return s*dec(len(s),.005,d*.6)

def groove(t0,t1,chords,bassline,light=False,gain=1.0):
    k=0; t=t0
    while t<t1-1e-6:
        bar=k//4; ch=chords[bar%len(chords)]
        if not light or k%2==0: add(kick(),t,0,.55*gain)
        add(hat(open_=True),t+B/2,.25,.06*gain)
        if not light and k%4 in (1,3): add(clap(),t,-.1,.16*gain)
        for h in range(2): add(hat(),t+h*B/2+B/4,-.3,.035*gain)
        bf=hz(bassline[bar%len(bassline)]);add(bass(bf,B*.45),t,0,.22*gain);add(bass(bf,B*.4),t+B/2,0,.16*gain)
        if k%4==0: add(pad(ch,4*B,.05),t,0,.13*gain)
        if k%2==1: add(sum(pluck(hz(n+12),.3,.9) for n in ch)/3,t+B/2,.2,.09*gain)
        t+=B; k+=1

# ---- party: A minor four-on-the-floor (0 → 9.4) ----
groove(0.0,3.05,[[57,60,64],[53,57,60],[60,64,67],[55,59,62]],[45,41,48,43])
groove(3.05,6.2,[[57,60,64],[53,57,60],[60,64,67],[55,59,62]],[45,41,48,43],light=True,gain=.8)   # the walk: half-time, headphones
groove(6.2,9.4,[[57,60,64],[53,57,60],[60,64,67],[55,59,62]],[45,41,48,43],gain=1.1)
# page tears
for f in [1.3,2.6,3.9,5.2,6.5,7.9]:
    n=noise(.35); add(hp(n)*np.exp(-np.arange(len(n))/SR*12)*np.linspace(1,.3,len(n)),f,.4,.07)
# graduation: riser, crash, cheer bells
r=noise(.6)*np.linspace(0,1,int(.6*SR))**2; add(hp(r),9.2,0,.08)
c=noise(1.8); add(hp(c)*np.exp(-np.arange(len(c))/SR*2.2),9.8,0,.16)
add(pad([57,61,64,69,73],1.1,.02),9.8,0,.25)
for i,n in enumerate([81,85,88,93]): add(bell(hz(n),1.2),9.8+i*.08,(i-1.5)*.3,.12)
groove(9.8,10.85,[[57,61,64]],[45],gain=.9)
# lights out: tape-stop
t=np.arange(int(.55*SR))/SR; f=hz(57)*np.exp(-t*4.5); s=np.sin(2*np.pi*np.cumsum(f)/SR)+.5*np.sin(4*np.pi*np.cumsum(f)/SR)
add(s*np.exp(-t*3),10.86,0,.28)

# ---- confusion (11.4 → 14.4): clock ticks, a dissonant drone ----
tt=11.4;i=0
while tt<14.4:
    s=tone(2400 if i%2 else 1800,.03)*dec(int(.03*SR),.001,.008); add(s,tt,.3 if i%2 else -.3,.25); tt+=.5; i+=1
d=3.2; tt_=np.arange(int(d*SR))/SR
dr=(tone(hz(40),d,(1,2,3),(1,.4,.2),det=.003)+.6*tone(hz(46),d,(1,2),(1,.3),det=.004))*(1+.3*np.sin(2*np.pi*3*tt_))
add(dr*np.clip(np.minimum(tt_/.6,(d-tt_)/.4),0,1),11.3,0,.13)
for tp in [11.9,12.6,13.0,13.6,13.9]: add(pluck(hz(rng.choice([63,66,69,70,75])),.6),tp,rng.uniform(-.6,.6),.08)

# ---- the rail (14.5 → 18): light, curious ----
for i in range(7): add(pluck(hz([72,76,79,84,79,76,74][i]),.4,.6),14.6+i*.07,(i-3)*.12,.07)
w=noise(.9)*np.sin(np.linspace(0,np.pi,int(.9*SR)))**2; add(hp(w),15.25,0,.05)
for k in range(6):
    add(pluck(hz([60,64,67,72,67,64][k]),.5,.5),15.0+k*B,0,.1)
add(pad([48,55,60,64],3.0,.8),15.0,0,.2)
add(bell(hz(84),1.0),16.65,.1,.18)
add(bell(hz(84),1.5),17.62,.1,.22); add(bell(hz(91),1.5),17.72,-.1,.18)

# ---- the sprint (18 → 20): 16th-note run up, double-time hats ----
w=noise(.6)*np.sin(np.linspace(0,np.pi,int(.6*SR)))**2; add(hp(w),18.0,0,.09)
add(kick(.8,80,32),18.6,0,.5)
run=[60,64,67,72,76,79,84,88]; tt=18.7;k=0
while tt<19.9:
    add(pluck(hz(run[k%8]+(12 if k>=16 else 0)),.25,1.0),tt,(-.4 if k%2 else .4),.14); add(hat(),tt,.2,.06); tt+=B/4; k+=1
add(pad([48,52,55,60],1.3,.2),18.6,0,.2)
add(bell(hz(84),1.6),19.9,0,.2); add(bell(hz(88),1.6),19.98,0,.14)

# ---- the long road (20 → 22.6): the same groove, now in C major and steady ----
groove(20.0,24.4,[[60,64,67],[55,59,62],[57,60,64],[53,57,60]],[48,43,45,41],gain=.95)
# end chord
add(pad([48,55,60,64,67,71,74],2.6,.1),24.35,0,.24); add(kick(1.1,60,30),24.35,0,.45); add(bell(hz(84),2.4),24.4,0,.16)

def reverb(x,dec_=1.6):
    n=int(dec_*SR); ir=rng.standard_normal(n)*np.exp(-np.arange(n)/SR*4/dec_); ir/=np.sqrt((ir**2).sum())
    m=1<<int(np.ceil(np.log2(len(x)+n))); return np.fft.irfft(np.fft.rfft(x,m)*np.fft.rfft(ir,m),m)[:len(x)]
oL=L+.28*reverb(L); oR=Rr+.28*reverb(Rr)
fade=np.clip((DUR-np.arange(N)/SR)/.8,0,1); oL*=fade; oR*=fade
pk=max(abs(oL).max(),abs(oR).max()); oL/=pk/.89; oR/=pk/.89
st=np.empty(2*N); st[0::2]=oL; st[1::2]=oR
w=wave.open('music2.wav','wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st*32767).astype('<i2').tobytes()); w.close()
