'use client';
import {useEffect,useRef} from 'react';
import {paintStreet,streetAspect} from '@/lib/paintStreet';

export default function PedestrianScene(){
  const canvas=useRef<HTMLCanvasElement>(null);
  const figure=useRef<HTMLElement>(null);
  useEffect(()=>{
    const el=canvas.current!, host=figure.current!, ctx=el.getContext('2d');
    if(!ctx)return;
    const reduce=matchMedia('(prefers-reduced-motion: reduce)');
    let frame=0,visible=false,last=-100,clock=0;
    function draw(now:number){
      frame=0;
      if(!visible||document.hidden)return;
      if(now-last>=32||reduce.matches){
        clock+=Math.min(60,now-last)/1000;last=now;
        paintStreet(ctx!,el.width,el.height,reduce.matches?0:clock);
      }
      if(!reduce.matches)frame=requestAnimationFrame(draw);
    }
    function wake(){if(!frame&&visible&&!document.hidden)frame=requestAnimationFrame(draw);}
    function resize(){
      const dpr=Math.min(devicePixelRatio,1.6);
      el.width=Math.max(1,Math.round(el.clientWidth*dpr));el.height=Math.max(1,Math.round(el.clientHeight*dpr));
      last=-100;wake();
    }
    const seen=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;wake();});
    const sizes=new ResizeObserver(resize);
    sizes.observe(el);seen.observe(host);resize();
    reduce.addEventListener('change',resize);document.addEventListener('visibilitychange',wake);
    return ()=>{seen.disconnect();sizes.disconnect();cancelAnimationFrame(frame);reduce.removeEventListener('change',resize);document.removeEventListener('visibilitychange',wake);};
  },[]);
  return <figure ref={figure} className="pedestrian-scene" data-pedestrian-scene="">
    <div className="scene-index"><span>STREET STUDIES</span><span>FIG. 01</span></div>
    <canvas ref={canvas} width="640" height="440" style={{aspectRatio:streetAspect}} role="img" aria-label="An isometric street corner with moving pedestrians, a zebra crossing, trees and a shop."/>
    <figcaption><strong>The neighbourhood crossing</strong><span>PEDESTRIAN STREET STUDY</span></figcaption>
  </figure>;
}
