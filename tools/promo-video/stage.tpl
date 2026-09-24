<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=540,initial-scale=1">
<style>
@font-face{font-family:V;src:url(vazir.woff2) format('woff2');font-weight:100 900}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:540px;height:960px;overflow:hidden;background:#070d19;font-family:V,sans-serif;color:#eaf1ff}
#bg{position:absolute;inset:0;overflow:hidden}
.glow{position:absolute;border-radius:50%;filter:blur(60px);opacity:.55}
.g1{width:420px;height:420px;background:#1d4ed8;top:-120px;right:-140px;animation:d1 14s ease-in-out infinite alternate}
.g2{width:360px;height:360px;background:#0ea5a4;bottom:-120px;left:-120px;opacity:.35;animation:d2 17s ease-in-out infinite alternate}
.g3{width:260px;height:260px;background:#6d28d9;top:45%;left:30%;opacity:.18;animation:d1 11s ease-in-out infinite alternate-reverse}
@keyframes d1{to{transform:translate(-90px,120px) scale(1.15)}}
@keyframes d2{to{transform:translate(110px,-140px) scale(1.2)}}
#grid{position:absolute;inset:0;background-image:linear-gradient(rgba(120,160,255,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(120,160,255,.07) 1px,transparent 1px);background-size:28px 28px;-webkit-mask-image:radial-gradient(ellipse at 50% 30%,#000 20%,transparent 75%)}
#top{position:absolute;top:22px;left:0;right:0;height:86px;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:5}
.brand{display:flex;align-items:center;gap:9px;direction:ltr;font-weight:800;font-size:17px;letter-spacing:.3px;opacity:.95}
.brand img{width:26px;height:26px;border-radius:7px;background:#fff;padding:2px}
#cap{margin-top:8px;height:34px;position:relative;width:100%}
.c{position:absolute;inset:0;text-align:center;font-size:21px;font-weight:700;opacity:0;transform:translateY(10px);filter:blur(6px);transition:all .55s cubic-bezier(.2,.8,.2,1)}
.c.on{opacity:1;transform:none;filter:none}
.c b{background:linear-gradient(90deg,#60a5fa,#5eead4);-webkit-background-clip:text;color:transparent}
#camwrap{position:absolute;left:0;right:0;top:112px;bottom:0;display:flex;justify-content:center;padding-top:6px;overflow:hidden;-webkit-mask-image:linear-gradient(transparent 0,#000 18px)}
#cam{position:relative;width:390px;height:844px;transform-origin:50% 0;transform:scale(.93);transition:transform 1.1s cubic-bezier(.65,0,.25,1)}
#phone{position:absolute;inset:0;border-radius:52px;padding:0;box-shadow:0 0 0 9px #0f172a,0 0 0 10.5px #334155,0 40px 90px rgba(0,0,0,.6),0 0 120px rgba(59,130,246,.25);overflow:hidden;background:#fff}
#phone iframe{border:0;width:390px;height:797px;display:block;position:absolute;top:47px;left:0}
#sbar{position:absolute;top:0;left:0;right:0;height:47px;background:#fff;display:flex;justify-content:space-between;align-items:center;padding:4px 34px 0 40px;direction:ltr;font:600 15px -apple-system,system-ui,sans-serif;color:#0f172a;transition:background .3s}
#sbar .ic{display:flex;gap:6px;align-items:center}
#island{pointer-events:none;position:absolute;top:10px;left:50%;width:108px;height:30px;margin-left:-54px;background:#000;border-radius:20px;z-index:4}
#veil{position:absolute;inset:0;background:#f5f8ff;opacity:0;pointer-events:none;transition:opacity .35s;z-index:3;border-radius:52px}
#finger{pointer-events:none;position:absolute;left:0;top:0;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;background:rgba(255,255,255,.35);border:2px solid rgba(255,255,255,.9);box-shadow:0 6px 24px rgba(15,23,42,.35),inset 0 0 12px rgba(37,99,235,.35);z-index:6;opacity:0;transition:opacity .3s,transform .15s;backdrop-filter:blur(2px)}
#finger.press{transform:scale(.78)}
.ripple{position:absolute;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;border:3px solid rgba(37,99,235,.8);z-index:6;animation:rp .6s ease-out forwards;pointer-events:none}
@keyframes rp{to{transform:scale(2.6);opacity:0}}
#eq{position:absolute;bottom:18px;left:50%;transform:translateX(-50%) translateY(20px);display:flex;gap:9px;align-items:center;z-index:7;opacity:0;transition:all .6s;background:rgba(15,23,42,.78);border:1px solid rgba(148,163,184,.25);padding:10px 16px 10px 18px;border-radius:999px;backdrop-filter:blur(10px);box-shadow:0 10px 40px rgba(0,0,0,.4)}
#eq.on{opacity:1;transform:translateX(-50%)}
#eq .bars{display:flex;gap:3px;align-items:flex-end;height:22px;direction:ltr}
#eq .bars i{display:block;width:4px;border-radius:2px;background:linear-gradient(#5eead4,#3b82f6);animation:eqb 1s ease-in-out infinite}
@keyframes eqb{0%,100%{height:4px}50%{height:22px}}
#eq span{font-size:13.5px;font-weight:600;white-space:nowrap}
#outro{position:absolute;inset:0;z-index:9;display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(ellipse at 50% 40%,rgba(12,24,52,.82),rgba(5,9,18,.96));opacity:0;transition:opacity .9s;gap:14px}
#outro.on{opacity:1}
#outro img{width:84px;height:84px;border-radius:22px;background:#fff;padding:8px;box-shadow:0 0 80px rgba(59,130,246,.55)}
#outro h1{font-size:34px;font-weight:900;direction:ltr}
#outro p{font-size:19px;font-weight:600;color:#bcd0f5}
#outro .url{margin-top:10px;font-size:18px;direction:ltr;padding:8px 22px;border-radius:999px;border:1px solid rgba(147,197,253,.4);color:#93c5fd;font-weight:700}
#outro > *{opacity:0;transform:translateY(14px);transition:all .7s cubic-bezier(.2,.8,.2,1)}
#outro.on > *{opacity:1;transform:none}
#outro.on > *:nth-child(2){transition-delay:.15s}#outro.on > *:nth-child(3){transition-delay:.3s}#outro.on > *:nth-child(4){transition-delay:.5s}
#intro{position:absolute;inset:0;z-index:8;background:#070d19;transition:opacity 1s}
</style></head><body>
<div id="bg"><div class="glow g1"></div><div class="glow g2"></div><div class="glow g3"></div><div id="grid"></div></div>
<div id="top"><div class="brand"><img src="logo-v2.png">DentCast</div><div id="cap"></div></div>
<div id="camwrap"><div id="cam"><div id="phone"><div id="sbar"><span>9:41</span><span class="ic"><svg width="18" height="12" viewBox="0 0 18 12"><rect x="0" y="8" width="3" height="4" rx="1" fill="#0f172a"/><rect x="5" y="5.5" width="3" height="6.5" rx="1" fill="#0f172a"/><rect x="10" y="3" width="3" height="9" rx="1" fill="#0f172a"/><rect x="15" y="0" width="3" height="12" rx="1" fill="#0f172a"/></svg><svg width="16" height="12" viewBox="0 0 16 12"><path d="M8 2.5c2.3 0 4.4.9 6 2.4l1.2-1.3A10.4 10.4 0 0 0 8 .7 10.4 10.4 0 0 0 .8 3.6L2 4.9A8.6 8.6 0 0 1 8 2.5zm0 3.6c1.4 0 2.6.5 3.5 1.4l1.2-1.3A6.7 6.7 0 0 0 8 4.3a6.7 6.7 0 0 0-4.7 1.9l1.2 1.3c.9-.9 2.1-1.4 3.5-1.4zM8 9.6l1.9-2a2.7 2.7 0 0 0-3.8 0z" fill="#0f172a"/></svg><svg width="27" height="13" viewBox="0 0 27 13"><rect x=".5" y=".5" width="22" height="12" rx="3.5" fill="none" stroke="#0f172a" opacity=".4"/><rect x="2" y="2" width="17" height="9" rx="2" fill="#0f172a"/><rect x="24" y="4.5" width="2" height="4" rx="1" fill="#0f172a" opacity=".4"/></svg></span></div><iframe id="f" src="about:blank"></iframe><div id="veil"></div></div><div id="island"></div><div id="finger"></div></div></div>
<div id="eq"><div class="bars"><i style="animation-delay:-.2s"></i><i style="animation-delay:-.5s"></i><i style="animation-delay:-.1s"></i><i style="animation-delay:-.7s"></i><i style="animation-delay:-.35s"></i><i style="animation-delay:-.6s"></i></div><span id="eqt">در حال پخش · دنتوپدیا ۱۱</span></div>
<div id="outro"><img src="logo-v2.png"><h1>DentCast</h1><p>جامع‌ترین منبع فارسی پروتز</p><div class="url">dentcast.ir</div></div>
<div id="intro"></div>
<script>
const cam=document.getElementById('cam'),finger=document.getElementById('finger'),capEl=document.getElementById('cap');
window.S={
 cap(html){capEl.querySelectorAll('.c').forEach(c=>{c.classList.remove('on');setTimeout(()=>c.remove(),600)});const d=document.createElement('div');d.className='c';d.innerHTML=html;capEl.appendChild(d);requestAnimationFrame(()=>requestAnimationFrame(()=>d.classList.add('on')));},
 camera(s,ox,oy){cam.style.transformOrigin=ox+'px '+oy+'px';cam.style.transform='scale('+s+')';},
 camDur(ms){cam.style.transitionDuration=ms+'ms'},
 fingerShow(x,y){finger.style.transition='none';finger.style.left=x+'px';finger.style.top=y+'px';finger.offsetWidth;finger.style.transition='opacity .3s,transform .15s,left .7s cubic-bezier(.45,0,.2,1),top .7s cubic-bezier(.45,0,.2,1)';finger.style.opacity=1},
 fingerMove(x,y,ms=700){finger.style.transition=`opacity .3s,transform .15s,left ${ms}ms cubic-bezier(.45,0,.2,1),top ${ms}ms cubic-bezier(.45,0,.2,1)`;finger.style.left=x+'px';finger.style.top=y+'px'},
 fingerHide(){finger.style.opacity=0},
 press(on){finger.classList.toggle('press',on)},
 ripple(){const r=document.createElement('div');r.className='ripple';r.style.left=finger.style.left;r.style.top=finger.style.top;cam.appendChild(r);setTimeout(()=>r.remove(),700)},
 veil(o){document.getElementById('veil').style.opacity=o},
 eq(on){document.getElementById('eq').classList.toggle('on',on)},
 intro(){document.getElementById('intro').style.opacity=0},
 outro(){document.getElementById('outro').classList.add('on')}
};
</script></body></html>
