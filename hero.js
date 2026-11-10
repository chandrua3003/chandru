'use strict';
(() => {
  const hero = document.querySelector('.reference-hero');
  const image = document.getElementById('hero-portrait');
  const canvas = document.getElementById('hero-tiles');
  const header = document.querySelector('.reference-navigation');
  const menu = document.querySelector('.hero-menu-toggle');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const ctx = canvas.getContext('2d');
  let particles = [], texture, frame = 0, started = 0, width = 0, height = 0;
  let inView = true, progress = 0, resizeTimer;
  const pointer = {x:-10000,y:-10000};
  const clamp = x => Math.max(0,Math.min(1,x));
  const ease = x => 1-Math.pow(1-clamp(x),3);
  let seed = 25;
  const random = () => {seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};

  menu.addEventListener('click', () => {
    const open=menu.getAttribute('aria-expanded')!=='true';
    menu.setAttribute('aria-expanded',String(open));
    menu.setAttribute('aria-label',open?'Close navigation':'Open navigation');
    header.classList.toggle('menu-open',open);
  });
  function closeMenu() {menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Open navigation');header.classList.remove('menu-open');}
  header.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeMenu();menu.focus();}});
  function scroll() {header.classList.toggle('scrolled',scrollY>24);progress=reduce.matches?0:clamp(-hero.getBoundingClientRect().top/(height*.7));requestDraw();}
  addEventListener('scroll',scroll,{passive:true});
  hero.addEventListener('pointermove',e=>{if(e.pointerType==='touch'||reduce.matches)return;const r=hero.getBoundingClientRect();pointer.x=e.clientX-r.left;pointer.y=e.clientY-r.top;requestDraw();},{passive:true});
  hero.addEventListener('pointerleave',()=>{pointer.x=pointer.y=-10000;requestDraw();});

  function buildTiles() {
    if(!ctx||!image.naturalWidth)return;
    width=hero.clientWidth;height=hero.clientHeight;
    const dpr=Math.min(devicePixelRatio||1,1.5);
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
    const box=image.getBoundingClientRect(),root=hero.getBoundingClientRect();
    const cell=width<768?4:6;
    const cols=Math.ceil(box.width/cell),rows=Math.ceil(Math.min(box.height,height-(box.top-root.top))/cell);
    const source=document.createElement('canvas');source.width=cols;source.height=Math.ceil(box.height/cell);
    const sourceCtx=source.getContext('2d',{willReadFrequently:true});
    sourceCtx.drawImage(image,0,0,source.width,source.height);
    let rgba;
    try {rgba=sourceCtx.getImageData(0,0,source.width,source.height).data;} catch {return;}
    // Original miniature interface artwork supplies the mosaic, not third-party assets.
    texture=document.createElement('canvas');texture.width=256;texture.height=64;
    const tc=texture.getContext('2d');
    for(let i=0;i<4;i++){
      const x=i*64;
      tc.fillStyle=['#cbd5e6','#e0e7ee','#a9bdcf','#c1cbdc'][i];tc.fillRect(x,0,64,64);
      tc.fillStyle='#f5f7fa';tc.fillRect(x+4,4,40,7);tc.fillRect(x+5,17,54,28);
      tc.fillStyle=['#6584ac','#7a91b8','#466d94','#839cc4'][i];tc.fillRect(x+8,20,20,22);
      tc.fillStyle='#263e61';tc.fillRect(x+33,20,22,4);tc.fillRect(x+33,29,18,3);
      tc.fillStyle='#6d87aa';tc.fillRect(x+5,51,54,8);
    }
    particles=[];seed=25;
    for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
      const i=(y*cols+x)*4;if(rgba[i+3]<45)continue;
      const px=box.left-root.left+x*cell,py=box.top-root.top+y*cell;
      if(py>height+cell)continue;
      particles.push({x:px,y:py,sx:x*cell,sy:y*cell,cell,
        airX:random()*width,airY:random()*height,
        dx:(random()-.5)*width*1.7,dy:(random()-.4)*height*1.6,
        delay:random()*.7,spin:(random()-.5)*6,
        luma:(rgba[i]*.2126+rgba[i+1]*.7152+rgba[i+2]*.0722)/255,thumb:Math.floor(random()*4),
        color:['#b0b8c8','#d0d5df','#707b92','#7e8a9e'][Math.floor(random()*4)],
        fade:clamp((height-py)/(height*.14))});
    }
    hero.classList.add('tiles-enabled');
  }
  function draw(now) {
    frame=0;if(!inView||!texture)return;
    ctx.clearRect(0,0,width,height);
    const elapsed=reduce.matches?100:(now-started)/1000;
    const reveal=reduce.matches?1:ease((elapsed-1.8)/2.6);
    let moving=false;
    for(const p of particles){
      const arrival=reduce.matches?1:ease((elapsed-1.8-p.delay)/2.0);
      let x=p.airX+(p.x-p.airX)*arrival+p.dx*progress;
      let y=p.airY+(p.y-p.airY)*arrival+p.dy*progress;
      const dx=x-pointer.x,dy=y-pointer.y,dist=Math.hypot(dx,dy),radius=95;
      let push=0;if(!reduce.matches&&dist<radius){push=(1-dist/radius)*24;x+=(dx/(dist||1))*push;y+=(dy/(dist||1))*push;}
      const shade=Math.pow(p.luma,1.25);
      const size=p.cell*(.18+.95*shade)*(.28+.72*arrival)*(1-progress*.65);
      ctx.globalAlpha=p.fade*(1-progress)*Math.min(1,elapsed/1.2)*Math.min(1,.25+shade*1.3);
      if(arrival<.9||progress>.1){ctx.fillStyle=p.color;ctx.fillRect(x,y,size,size);}
      else ctx.drawImage(texture,p.thumb*64,0,64,64,x,y,size,size);
      if(arrival<1)moving=true;
    }
    ctx.globalAlpha=1;
    canvas.dataset.state=progress>=1?'gone':progress>0?'scattering':moving?'gathering':'formed';
    if((moving||reveal<1)&&!reduce.matches)requestDraw();
  }
  function requestDraw(){if(!frame&&inView)frame=requestAnimationFrame(draw);}
  async function start() {
    if(!image.complete)await new Promise(resolve=>{image.addEventListener('load',resolve,{once:true});image.addEventListener('error',resolve,{once:true});});
    started=performance.now();
    if(!reduce.matches){
      hero.classList.add('hero-animating');
      const name=document.querySelector('.hero-intro-name');
      const finalName='CHANDRU';let step=0;
      const chars='·:+CHANDRU';
      const scramble=setInterval(()=>{name.textContent=finalName.split('').map((c,i)=>step>i*3?c:chars[(step+i)%chars.length]).join('');if(++step>17){clearInterval(scramble);name.textContent=finalName;}},45);
      setTimeout(()=>{hero.classList.add('hero-title-visible');},1000);
      setTimeout(()=>{hero.classList.remove('hero-animating');hero.classList.add('hero-positioned');},1600);
    }else hero.classList.add('hero-positioned');
    buildTiles();scroll();requestDraw();
  }
  let observer;
  if('IntersectionObserver'in window){observer=new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;if(inView)requestDraw();else if(frame){cancelAnimationFrame(frame);frame=0;}},{threshold:0});observer.observe(hero);}
  addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{buildTiles();scroll();},100);},{passive:true});
  reduce.addEventListener('change',()=>{hero.classList.remove('hero-animating');hero.classList.add('hero-positioned');pointer.x=pointer.y=-10000;scroll();requestDraw();});
  start();
})();
