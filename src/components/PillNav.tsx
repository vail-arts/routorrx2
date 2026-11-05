'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useLayoutEffect,useRef,useState} from 'react';
import CommandSearch from './watermelon/CommandSearch';

export const pages=[['/','Home'],['/features','Features'],['/technology','Technology'],['/impact','Impact'],['/experience','Experience']];

function alignMarker(nav:HTMLElement,link:HTMLElement|null){
  const mark=nav.querySelector<HTMLElement>('.spotlight-mark')!;
  mark.hidden=!link||!link.offsetWidth;
  if(mark.hidden||!link)return;
  const vertical=getComputedStyle(nav).flexDirection==='column';
  const x=link.offsetLeft+(vertical?2:link.offsetWidth/2);
  const y=link.offsetTop+(vertical?link.offsetHeight/2:link.offsetHeight-2);
  mark.style.transform=`translate(${x}px,${y}px)`;
}

export default function PillNav(){
  const path=usePathname();
  const [open,setOpen]=useState(false);
  const menu=useRef<HTMLButtonElement>(null),rail=useRef<HTMLElement>(null);
  const light=useRef<HTMLSpanElement>(null),tick=useRef(0);
  const pointer=useRef({x:0,y:0});

  useLayoutEffect(()=>{
    const nav=rail.current!;
    function sync(){alignMarker(nav,nav.querySelector('a[aria-current="page"]'));}
    sync();
    const observer=new ResizeObserver(sync);
    observer.observe(nav);
    for(const link of nav.querySelectorAll('a'))observer.observe(link);
    return ()=>{observer.disconnect();cancelAnimationFrame(tick.current);tick.current=0;};
  },[path,open]);

  function moveLight(x:number,y:number){
    pointer.current={x,y};
    if(tick.current)return;
    tick.current=requestAnimationFrame(()=>{
      tick.current=0;
      const nav=rail.current,spot=light.current;
      if(!nav||!spot)return;
      const rect=nav.getBoundingClientRect();
      spot.style.transform=`translate(${pointer.current.x-rect.left+nav.scrollLeft}px,${pointer.current.y-rect.top+nav.scrollTop}px)`;
    });
  }

  return <header className="header">
    <Link className="brand" href="/" aria-label="routorrX home"><small className="studio-label">VAIL ARTS</small>routorr<span>X</span><sup>V2</sup></Link>
    <CommandSearch/>
    <button ref={menu} className="menu" aria-expanded={open} aria-controls="primary-nav" onClick={()=>setOpen(!open)}>{open?'Close':'Menu'}</button>
    <nav ref={rail} id="primary-nav" aria-label="Main navigation" className={'pillnav spotlight-nav'+(open?' open':'')}
      onPointerMove={e=>{if(e.pointerType!=='touch')moveLight(e.clientX,e.clientY);}}
      onFocus={e=>{const r=e.target.getBoundingClientRect();moveLight(r.left+r.width/2,r.bottom);}}
      onKeyDown={e=>{if(open&&e.key==='Escape'){setOpen(false);menu.current?.focus();}}}>
      <span ref={light} aria-hidden="true" className="spotlight-light"/>
      <b hidden aria-hidden="true" className="spotlight-mark"/>
      {pages.map(([url,label])=><Link key={url} href={url} aria-current={path===url?'page':undefined}
        onNavigate={()=>{const nav=rail.current!;alignMarker(nav,nav.querySelector(`a[href="${url}"]`));setOpen(false);}}>{label}</Link>)}
    </nav>
    <Link className="header-cta" href="/app">Try Out</Link>
  </header>;
}
