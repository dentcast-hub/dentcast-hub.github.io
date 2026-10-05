import numpy as np, wave
SR=44100; DUR=26.0; N=int(SR*DUR); B=60/110
L=np.zeros(N); Rr=np.zeros(N); rng=np.random.default_rng(8)
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
def pizz(f,b=1.0): s=tone(f,.35,(1,2,3),(1,.35*b,.12*b)); return s*dec(len(s),.003,.09)
def marimba(f): s=tone(f,.8,(1,4,10),(1,.25,.05)); return s*dec(len(s),.002,.22)
def bell(f,dur=2.0): s=tone(f,dur,(1,2.76,5.4,8.9),(1,.45,.25,.12)); return s*dec(len(s),.002,.5)
def pad(notes,dur,att=.4):
    s=sum(tone(hz(n),dur,(1,2,3),(1,.25,.08),det=.003) for n in notes)/len(notes); t=np.arange(len(s))/SR
    return s*np.clip(np.minimum(t/att,(dur-t)/.3),0,1)
def noise(d): return rng.standard_normal(int(d*SR))
def hp(x): y=x.copy(); y[1:]-=0.97*x[:-1]; return y
def kick(dur=.3,f0=110,f1=48):
    t=np.arange(int(dur*SR))/SR; f=f1+(f0-f1)*np.exp(-t*30); return np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*10)
def shaker(): n=noise(.07); return hp(hp(n))*np.exp(-np.arange(len(n))/SR*55)
def whoosh(d=.5): w=noise(d)*np.sin(np.linspace(0,np.pi,int(d*SR)))**2; return hp(w)
def thud():
    k=kick(.25,90,50); n=hp(noise(.08))*np.exp(-np.arange(int(.08*SR))/SR*40)*.3; k[:len(n)]+=n; return k
def wrong(t0,g=1.0):   # the "nope" — two falling notes with a buzzy edge
    for k,(n,d) in enumerate([(58,.18),(55,.38)]):
        t=np.arange(int(d*SR))/SR; f=hz(n)*np.exp(-t*.6)
        s=sum(np.sin(2*np.pi*f*h*t)/h for h in range(1,8))*dec(len(t),.01,d*.6)
        add(s,t0+k*.17,0,.2*g)

# hook: a clash and a held breath
add(kick(.6,90,40),0,0,.6); add(bell(hz(76),1.6),0,-.2,.18); add(bell(hz(77),1.6),0,.2,.15)
add(pad([52,59,64,65],2.6,.05),0,0,.16)
for k in range(5): add(marimba(hz(88 if k%2 else 83)),.3+k*.45,.3,.05)
wrong(.55,.8)
# the clinic: cheerful pizzicato, F major
mel=[65,69,72,69,70,69,67,65, 65,69,72,77,76,72,69,67]
for k in range(16):
    tt=2.6+k*B/2
    if tt>9.3: break
    if tt<5.0 or (tt>5.9 and tt<6.6) or tt>7.9: add(pizz(hz(mel[k%16])),tt,(-.3 if k%2 else .3),.16)
    if k%2==0: add(pizz(hz(41 if (k//4)%2==0 else 46),.6),tt,0,.2)
for tt in np.arange(2.6,9.3,B):
    if tt<5.0: add(kick(),tt,0,.25)
add(bell(hz(81),1.0),2.95,0,.1)   # the A2 tab
# three round trips
for o,b in [(4.0,5.0),(5.9,6.6),(6.95,7.6)]:
    add(whoosh(.5),o,.4,.12); add(thud(),b-.05,.3,.35); wrong(b+.12,1.0 if b<7 else 1.2)
# DentCast on the phone
add(bell(hz(84),1.2),7.95,0,.14); add(bell(hz(88),1.0),8.8,0,.2); add(bell(hz(91),1.0),8.88,0,.14); add(whoosh(.6),9.15,0,.12)
# reading: soft groove in C, a chime each time a light goes on
ch=[[48,55,60,64],[45,52,57,60],[41,48,53,57],[43,50,55,59]]
for k,tt in enumerate(np.arange(9.7,19.3,4*B)): add(pad(ch[k%4],4*B,.3),tt,0,.14)
for k,tt in enumerate(np.arange(9.7,22.6,B)):
    add(kick(.3,100,48),tt,0,.32); add(shaker(),tt+B/2,.3,.05); add(shaker(),tt+B/4,-.3,.025); add(shaker(),tt+3*B/4,-.3,.025)
for k,tt in enumerate(np.arange(9.7,19.0,B/2)):
    add(marimba(hz([72,76,79,76][k%4])),tt,(-.3 if k%2 else .3),.05)
for i,a in enumerate([10.115,11.496,13.406,14.789,16.699,18.082]):
    n=[72,74,76,79,81,84][i]; add(bell(hz(n+12),1.6),a,(-.3 if i%2 else .3),.22); add(bell(hz(n+19),1.2),a+.06,0,.08)
# payoff: shutter, send, box, success
add(hp(noise(.03))*np.exp(-np.arange(int(.03*SR))/SR*80),20.0,0,.4); add(hp(noise(.05))*np.exp(-np.arange(int(.05*SR))/SR*60),20.08,0,.3)
add(whoosh(.55),20.35,.4,.12); add(thud(),21.3,.3,.35)
for k,n in enumerate([72,76,79,84]): add(bell(hz(n),1.6),21.5+k*.07,(k-1.5)*.25,.16)
add(pad([48,55,60,64],3.1,.2),19.3,0,.14)
# end
add(pad([48,55,60,64,67,71,74],3.4,.15),22.6,0,.24); add(kick(1.0,70,32),22.6,0,.4); add(bell(hz(84),2.6),22.65,0,.16)

def reverb(x,d=1.4):
    n=int(d*SR); ir=rng.standard_normal(n)*np.exp(-np.arange(n)/SR*4/d); ir/=np.sqrt((ir**2).sum())
    m=1<<int(np.ceil(np.log2(len(x)+n))); return np.fft.irfft(np.fft.rfft(x,m)*np.fft.rfft(ir,m),m)[:len(x)]
oL=L+.25*reverb(L); oR=Rr+.25*reverb(Rr)
fade=np.clip((DUR-np.arange(N)/SR)/1.0,0,1); oL*=fade; oR*=fade
pk=max(abs(oL).max(),abs(oR).max()); oL/=pk/.89; oR/=pk/.89
st=np.empty(2*N); st[0::2]=oL; st[1::2]=oR
w=wave.open('music3.wav','wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st*32767).astype('<i2').tobytes()); w.close()
