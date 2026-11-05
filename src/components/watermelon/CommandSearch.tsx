'use client';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {motion,AnimatePresence,LayoutGroup} from 'motion/react';
import {useEffect,useRef,useState} from 'react';
import {api} from '@/lib/api';
import {saveJourney} from '@/lib/journey';
import type {Place} from '@/lib/core';

const sections=[
  {name:'Pages',links:[['Home','/'],['Features','/features'],['Technology','/technology'],['Impact','/impact'],['Experience','/experience']]},
  {name:'Tools',links:[['Walking planner','/app'],['Safety & privacy','/privacy'],['Share feedback','/experience#feedback']]}
];
const shared={type:'tween',ease:'easeOut',duration:.15} as const;
export default function CommandSearch(){
  const [open,setOpen]=useState(false);
  const [query,setQuery]=useState('');
  const [places,setPlaces]=useState<Place[]>([]);
  const [status,setStatus]=useState('');
  const dialog=useRef<HTMLDialogElement>(null);
  const request=useRef<AbortController|null>(null);
  const router=useRouter();
  function show(){if(!dialog.current?.open){dialog.current?.showModal();setOpen(true);}}
  function close(){request.current?.abort();setOpen(false);setPlaces([]);setStatus('');}
  useEffect(()=>{
    function shortcut(e:KeyboardEvent){if((e.ctrlKey||e.metaKey)&&e.key==='k'){e.preventDefault();show();}}
    addEventListener('keydown',shortcut);return()=>{removeEventListener('keydown',shortcut);request.current?.abort();};
  },[]);
  async function search(){
    request.current?.abort();const control=new AbortController();request.current=control;
    setStatus('Searching Silvassa…');
    try{const found=await api('search',{query},control.signal);if(!control.signal.aborted){setPlaces(found);setStatus(found.length?'Select a destination.':'No places found. Try another landmark.');}}
    catch(e){if(!control.signal.aborted)setStatus(e instanceof Error?e.message:'Search unavailable.');}
  }
  function results(){return Array.from(dialog.current?.querySelectorAll<HTMLElement>('[data-result]')||[]);}
  return <LayoutGroup id="site-command">
    <motion.button layoutId="command-palette" transition={shared} className="command-trigger" onClick={show} aria-haspopup="dialog"><motion.span layoutId="search-text" transition={shared}>Search</motion.span> <kbd>⌘K</kbd></motion.button>
    <dialog ref={dialog} className="command-dialog" aria-label="Search routorrX" onCancel={e=>{e.preventDefault();close();}} onClick={e=>{if(e.target===dialog.current)close()}}>
    <AnimatePresence onExitComplete={()=>dialog.current?.close()}>{open&&<motion.div key="search" layoutId="command-palette" transition={shared} className="command-body" exit={{opacity:0}}
      onKeyDown={e=>{const all=results();if(!all.length)return;const index=all.indexOf(document.activeElement as HTMLElement);if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();all[(index+(e.key==='ArrowDown'?1:-1)+all.length)%all.length].focus();}}}>
      <button className="close" onClick={close} aria-label="Close search">×</button><motion.h2 layoutId="search-text" transition={shared}>Find your way.</motion.h2>
      <label>Search pages and tools<input autoFocus value={query} maxLength={120} onChange={e=>{request.current?.abort();setQuery(e.target.value);setPlaces([]);setStatus('');}} onKeyDown={e=>{if(e.key==='Enter'){const first=results()[0];if(first)first.click();else if(query.trim().length>=3)void search();}}}/></label>
      <nav aria-label="Search results">{sections.map(group=>{const links=group.links.filter(([name])=>name.toLowerCase().includes(query.toLowerCase()));return links.length>0&&<div key={group.name}><small>{group.name}</small>{links.map(([name,url])=><Link data-result key={url} href={url} onClick={close}>{name} ↗</Link>)}</div>;})}</nav>
      <small>Destinations · Silvassa</small><button className="button" disabled={query.trim().length<3} onClick={()=>void search()}>Search places</button><p role="status">{status}</p>
      {places.map((p,i)=><button data-result key={i} onClick={()=>{if(saveJourney(null,p)){close();router.push('/app');}else setStatus('Storage is unavailable. Search in the walking planner.');}}>{p.name}</button>)}
    </motion.div>}</AnimatePresence></dialog>
  </LayoutGroup>;
}
