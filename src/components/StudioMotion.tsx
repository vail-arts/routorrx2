'use client';
import {Fragment,useEffect,useRef,useState} from 'react';
import {usePathname} from 'next/navigation';
import WordmarkParticles from './WordmarkParticles';

export function StudioOpening(){
 const path=usePathname(),host=useRef<HTMLElement>(null);
 useEffect(()=>{
   const el=host.current;if(!el)return;
   const observer=new IntersectionObserver(([entry])=>{el.dataset.visible=String(entry.isIntersecting);});
   observer.observe(el);
   const media=matchMedia('(prefers-reduced-motion: reduce)');
   let frame=0;
   function paint(){frame=0;const p=media.matches?0:Math.min(1,Math.max(0,-el!.getBoundingClientRect().top/(innerHeight*.86)));el!.style.setProperty('--studio-exit',String(p));}
   function tick(){if(!frame)frame=requestAnimationFrame(paint);}
   paint();addEventListener('scroll',tick,{passive:true});addEventListener('resize',tick);media.addEventListener('change',tick);
   return()=>{observer.disconnect();cancelAnimationFrame(frame);removeEventListener('scroll',tick);removeEventListener('resize',tick);media.removeEventListener('change',tick);};
 },[path]);
 useEffect(()=>{
   const fine=matchMedia('(hover:hover) and (prefers-reduced-motion:no-preference)');if(!fine.matches)return;
   let surface:HTMLElement|null=null,frame=0,x=0,y=0;
   function settle(){if(surface){surface.style.removeProperty('translate');surface=null;}}
   function move(e:PointerEvent){
     const next=(e.target as Element)?.closest<HTMLElement>('.page-intro,.hero-grid,.closing');
     const panel=next?.querySelector<HTMLElement>('h1,h2')||null;
     if(panel!==surface){settle();surface=panel;}if(!surface)return;
     x=(e.clientX/innerWidth-.5)*8;y=(e.clientY/innerHeight-.5)*6;
     if(!frame)frame=requestAnimationFrame(()=>{frame=0;if(surface)surface.style.translate=x+'px '+y+'px';});
   }
   document.addEventListener('pointermove',move,{passive:true});window.addEventListener('blur',settle);
   return()=>{document.removeEventListener('pointermove',move);window.removeEventListener('blur',settle);cancelAnimationFrame(frame);settle();};
 },[path]);
 useEffect(()=>{
   const file=process.env.NEXT_PUBLIC_STUDIO_FONT_URL;
   if(!file||path!=='/')return;
   let mounted=true;const font=new FontFace('Vail Studio Web',`url(${JSON.stringify(file)})`,{weight:'100'});
   font.load().then(()=>{if(mounted)document.fonts.add(font);}).catch(()=>{});
   return()=>{mounted=false;document.fonts.delete(font);};
 },[path]);
 if(path!=='/')return null;
 return <section ref={host} className="studio-opening" data-visible="true" aria-label="Vail Arts studio introduction"><div className="studio-frame">
 <WordmarkParticles/></div></section>;
}

const phrases=['Choose where to walk.','See what lies ahead.','Walk at your own pace.'];
export function FlipClosing(){
 const [i,set]=useState(0),[visible,show]=useState(false);const ref=useRef<HTMLHeadingElement>(null);
 useEffect(()=>{const o=new IntersectionObserver(([e])=>show(e.isIntersecting));o.observe(ref.current!);return()=>o.disconnect();},[]);
 useEffect(()=>{if(!visible||i===2||matchMedia('(prefers-reduced-motion:reduce)').matches)return;const t=setTimeout(()=>set(i+1),2800);return()=>clearTimeout(t);},[i,visible]);
 return <h2 ref={ref} className="flip-closing" aria-label={phrases[i]}><span key={i} aria-hidden>{phrases[i].split(' ').map((word,w)=><span className="flip-word" key={w}>{[...word].map((c,j)=><i key={j} style={{animationDelay:Math.sin((w*4+j)/phrases[i].length*Math.PI/2)*.21+'s'}}>{c}</i>)} </span>)}</span></h2>;
}

export function RippleText({text}:{text:string}){
 const ref=useRef<HTMLSpanElement>(null);
 useEffect(()=>{
   const el=ref.current!,host=el.closest<HTMLElement>('button,[data-feature-point],[data-ripple]')||el;
   const letters=Array.from(el.querySelectorAll<HTMLElement>('[data-glyph] b'));
   const media=matchMedia('(prefers-reduced-motion:reduce)');
   let frame=0;
   function reset(){cancelAnimationFrame(frame);frame=0;for(const letter of letters){letter.textContent=letter.parentElement!.dataset.glyph!;letter.style.opacity='1';}}
   function wave(event:Event){
     if(frame||media.matches)return;
     const rect=el.getBoundingClientRect();
     const origin=event instanceof PointerEvent?Math.max(0,Math.min(1,(event.clientX-rect.left)/Math.max(rect.width,1)))*(letters.length-1):0;
     const start=performance.now();
     function draw(now:number){
       const progress=(now-start)/540;
       if(progress>=1||media.matches){reset();return;}
       letters.forEach((letter,i)=>{
         const distance=Math.abs(Math.abs(i-origin)-progress*(letters.length+2));
         const mix=Math.max(0,1-distance/1.8);
         const glyph=mix>.45?'/·:+'[i%4]:letter.parentElement!.dataset.glyph!;
         if(letter.textContent!==glyph)letter.textContent=glyph;
         letter.style.opacity=String(1-.45*mix);
       });
       frame=requestAnimationFrame(draw);
     }
     frame=requestAnimationFrame(draw);
   }
   function track(event:PointerEvent){if(el.closest('[data-ripple]'))wave(event);}
   host.addEventListener('pointerenter',wave);host.addEventListener('focus',wave);host.addEventListener('pointerdown',wave);host.addEventListener('pointermove',track);
   return()=>{reset();host.removeEventListener('pointerenter',wave);host.removeEventListener('focus',wave);host.removeEventListener('pointerdown',wave);host.removeEventListener('pointermove',track);};
 },[text]);
 return <span ref={ref} aria-hidden className="ripple-line">{text.split(' ').map((word,w)=><Fragment key={w}>{w>0?' ':''}<span className="ripple-word">{[...word].map((c,i)=><span key={i} data-glyph={c}><b>{c}</b></span>)}</span></Fragment>)}</span>;
}
