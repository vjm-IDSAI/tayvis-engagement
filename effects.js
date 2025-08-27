(function(){
  function boot(){
    const hero=document.getElementById('heroBox');
    const canvas=document.getElementById('sparkle');
    const btn=document.getElementById('showerBtn');
    const badge=document.getElementById('countBadge');
    const bk=document.getElementById('backGlow');
    const br=document.getElementById('bridgeGlow');
    const inr=document.getElementById('innerGlow');
    const arch=document.getElementById('archGlow');
    if(!hero||!canvas) return;
    const ctx=canvas.getContext('2d'); if(!ctx) return;

    // sizing
    let w=0,h=0,dpr=1; const TAU=Math.PI*2;
    function resize(){
      const r=hero.getBoundingClientRect();
      dpr=Math.min(window.devicePixelRatio||1,2);
      w=r.width; h=r.height;
      canvas.width=Math.floor(w*dpr); canvas.height=Math.floor(h*dpr);
      canvas.style.width=w+'px'; canvas.style.height=h+'px';
      ctx.setTransform(dpr,0,0,dpr,0,0);
    }
    window.addEventListener('resize',resize,{passive:true});
    resize();

    // state
    let intensity=0, glowLevel=0, targetGlow=0, lastClick=0, archPulse=0;
    let count=parseInt(localStorage.getItem('wishesCount')||'0',10);
    function renderCount(){ if(badge) badge.textContent='Wishes Sent: '+count; }
    renderCount();

    // soft glow rain particles
    const base=['#FFF7D1','#FFE9A6','#FFD166','#F6C27A','#FFB457','#FFA040'];
    const near=[], far=[], twinkles=[], glowRain=[];
    
    function makeGlow(layer){
      const isNear=layer==='near';
      const off=w*0.15;
      return {
        x:-off+Math.random()*(w+off*2),
        y:-Math.random()*h*0.12,
        r:(isNear?1.3:1.0)+Math.random()*(isNear?0.8:0.6),
        vy:(isNear?0.34:0.28)+Math.random()*(isNear?0.10:0.08),
        vx:(Math.random()-.5)*(isNear?0.16:0.10),
        life:(isNear?5+Math.random()*2:8+Math.random()*3),
        age:0,
        pulse:0.7+Math.random()*0.6,
        col:base[Math.floor(Math.random()*base.length)]
      };
    }
    
    function makeGlowRain(){
      return {
        x: Math.random() * w,
        y: -Math.random() * h * 0.2,
        r: 2 + Math.random() * 4,
        vy: 0.8 + Math.random() * 1.2,
        vx: (Math.random() - 0.5) * 0.5,
        life: 3 + Math.random() * 4,
        age: 0,
        pulse: 0.5 + Math.random() * 0.8,
        col: base[Math.floor(Math.random() * base.length)],
        glow: 0.3 + Math.random() * 0.7
      };
    }
    function makeTwinkle(x,y){
      const by=(y!==undefined)?y:(h*(0.72+Math.random()*0.24));
      const bx=(x!==undefined)?x+(Math.random()-0.5)*12:Math.random()*w;
      return {x:bx,y:by,r0:0.5+Math.random()*0.6,r1:4+Math.random()*6,age:0,dur:1.0+Math.random()*0.5};
    }

    function drawGlow(g,isNear,speed){
      g.x+=(g.vx+Math.sin(g.age*g.pulse)*0.04)*(1+0.12*intensity);
      g.y+=g.vy*speed; g.age+=0.016*(1+0.10*intensity);
      if(g.y>=h*0.995){
        const jx=g.x+(Math.random()-0.5)*14; const jy=h*(0.97+Math.random()*0.03);
        twinkles.push(makeTwinkle(jx,jy)); g.age=g.life+1;
      }
      const bottomFade=(g.y>h*0.975)?1-(g.y-h*0.975)/(h*0.025):1;
      const a=Math.max(0,(1-g.age/g.life)*bottomFade);
      const R=(g.r+Math.sin(g.age*g.pulse)*0.05)*(isNear?8:6);
      const grad=ctx.createRadialGradient(g.x,g.y,0,g.x,g.y,R);
      grad.addColorStop(0,g.col); grad.addColorStop(1,'transparent');
      ctx.globalAlpha=a*(isNear?0.9:0.65);
      ctx.globalCompositeOperation='lighter';
      ctx.fillStyle=grad; ctx.beginPath(); ctx.arc(g.x,g.y,R,0,TAU); ctx.fill();
      ctx.globalCompositeOperation='source-over';
    }
    function drawTwinkle(t){
      const tnorm=Math.min(1,t.age/t.dur);
      const ease=tnorm<0.5?2*tnorm*tnorm:1-Math.pow(-2*tnorm+2,2)/2;
      const R=t.r0+(t.r1-t.r0)*ease; const alpha=(1-tnorm)*0.9;
      const grad=ctx.createRadialGradient(t.x,t.y,0,t.x,t.y,R);
      grad.addColorStop(0,'#FFFBEA'); grad.addColorStop(0.4,'#FFE7A8'); grad.addColorStop(1,'transparent');
      ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=alpha;
      ctx.fillStyle=grad; ctx.beginPath(); ctx.arc(t.x,t.y,R,0,TAU); ctx.fill();
      ctx.globalCompositeOperation='source-over';
    }
    
    function drawGlowRain(g){
      g.x += g.vx;
      g.y += g.vy;
      g.age += 0.016;
      
      if(g.y >= h + 20 || g.age > g.life) return false;
      
      const alpha = Math.max(0, (1 - g.age / g.life)) * g.glow;
      const R = g.r + Math.sin(g.age * g.pulse) * 0.3;
      
      // Create soft glow effect
      const grad = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, R * 3);
      grad.addColorStop(0, g.col);
      grad.addColorStop(0.3, g.col + '80');
      grad.addColorStop(1, 'transparent');
      
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = alpha * 0.8;
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(g.x, g.y, R * 3, 0, TAU);
      ctx.fill();
      
      // Add inner bright core
      const coreGrad = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, R);
      coreGrad.addColorStop(0, '#FFFFFF');
      coreGrad.addColorStop(0.5, g.col);
      coreGrad.addColorStop(1, 'transparent');
      
      ctx.globalAlpha = alpha;
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(g.x, g.y, R, 0, TAU);
      ctx.fill();
      
      ctx.globalCompositeOperation = 'source-over';
      return true;
    }

    function loop(){
      ctx.clearRect(0,0,w,h);
      const targetNear=12+Math.floor(intensity*5), targetFar=18+Math.floor(intensity*5), speed=1.35+0.28*intensity;
      const targetGlowRain=25+Math.floor(intensity*10);
      
      while(near.length<targetNear) near.push(makeGlow('near'));
      while(far.length<targetFar)   far.push(makeGlow('far'));
      while(glowRain.length<targetGlowRain) glowRain.push(makeGlowRain());
      
      for(let i=far.length-1;i>=0;i--){ const g=far[i]; drawGlow(g,false,speed); if(g.y>h+20||g.age>g.life) far.splice(i,1);}        
      for(let i=near.length-1;i>=0;i--){ const g=near[i]; drawGlow(g,true,speed); if(g.y>h+20||g.age>g.life) near.splice(i,1);}        
      for(let i=glowRain.length-1;i>=0;i--){ const g=glowRain[i]; if(!drawGlowRain(g)) glowRain.splice(i,1); }
      
      if(Math.random()<0.015+intensity*0.02) twinkles.push(makeTwinkle());
      for(let i=twinkles.length-1;i>=0;i--){ const t=twinkles[i]; t.age+=0.016*(1+0.20*intensity); drawTwinkle(t); if(t.age>t.dur) twinkles.splice(i,1);}        

      if(arch){ archPulse+=0.03; arch.style.opacity=String(0.20+0.16*Math.sin(archPulse)); }
      { const follow=0.18; let diff=(targetGlow-glowLevel)*follow; const md=0.06; if(diff>md) diff=md; else if(diff<-md) diff=-md; glowLevel+=diff; }
      if(bk)  bk.style.opacity  = String(0.10 + Math.min(0.20, intensity*0.06));
      if(br)  br.style.opacity  = String(Math.min(0.60, 0.05 + glowLevel*0.55));
      if(inr) inr.style.opacity = String(Math.min(0.70, 0.06 + glowLevel*0.55));

      intensity=Math.max(0,intensity*0.90-0.010);
      targetGlow=Math.max(0,targetGlow*0.94-0.006);
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    function hype(){
      const now=(performance&&performance.now)?performance.now():Date.now();
      const since=now-lastClick; lastClick=now; const fast=since<140;
      // Increment global counter
      if(window.globalCounter) {
        window.globalCounter.incrementCount();
      }
      intensity=Math.min(3,intensity+(fast?0.35:0.6));
      targetGlow=Math.min(0.9,targetGlow+(fast?0.16:0.28));
      for(let i=0;i<(fast?6:8);i++) near.push(makeGlow('near'));
      for(let i=0;i<(fast?5:7);i++)  far.push(makeGlow('far'));
      for(let i=0;i<(fast?6:8);i++)  twinkles.push(makeTwinkle());
      for(let i=0;i<(fast?12:15);i++) glowRain.push(makeGlowRain());
      
      // Show lyric while clicking (your daughter's tribute)
      const lyric=document.getElementById('lyric');
      if(lyric){
        const lyricText = '"I didn\'t know if you knew, so I\'m taking this chance to say that I had then best day with you today."';
        
        // Show lyric if not already visible
        if(!lyric.classList.contains('show')) {
          lyric.classList.add('show');
          lyric.textContent = lyricText;
        }
        
        // Clear existing timeout and set new one
        if(lyric.timeoutId) clearTimeout(lyric.timeoutId);
        lyric.timeoutId = setTimeout(()=>{
          lyric.classList.remove('show');
        }, 800);
      }
      
      // Subtle glow effect for their names
      const title = document.querySelector('h1');
      if(title){
        // Get current glow intensity
        let currentGlow = parseFloat(getComputedStyle(title).getPropertyValue('--glow-intensity')) || 0;
        
        // Add a small amount of glow with each click
        const glowIncrement = 0.15;
        const newGlow = Math.min(1, currentGlow + glowIncrement);
        
        // Set the new glow intensity
        title.style.setProperty('--glow-intensity', newGlow);
        title.classList.add('glowing');
        
        // Clear existing timeout and set new one
        if(title.glowTimeout) clearTimeout(title.glowTimeout);
        title.glowTimeout = setTimeout(()=>{
          title.classList.remove('glowing');
          title.style.setProperty('--glow-intensity', '0');
        }, 1200);
      }
    }

    hero.addEventListener('click',hype); hero.addEventListener('pointerdown',hype);
    if(btn){ btn.addEventListener('click',hype); btn.addEventListener('pointerdown',hype); }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();

