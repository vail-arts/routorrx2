'use client';
import {useEffect,useRef,useState} from 'react';
import {communityEnabled,listReports} from '@/lib/community';
import type {CommunityReport} from '@/types/api';
export default function CommunityFeed({routeId,onRead}:{routeId?:string;onRead?:(ids:string[])=>void}){
 const [items,setItems]=useState<CommunityReport[]>([]),[cursor,setCursor]=useState<string|null>(null),[status,setStatus]=useState(''),[busy,setBusy]=useState(false);
 const job=useRef<AbortController|null>(null);
 useEffect(()=>()=>job.current?.abort(),[]);
 async function load(next?:string){
  job.current?.abort();const c=new AbortController();job.current=c;setBusy(true);setStatus('');
  try{const page=await listReports(routeId,next,c.signal);if(c.signal.aborted)return;
   const rows=Array.from(new Map([...(next?items:[]),...page.items].map(r=>[r.id,r])).values());
   setItems(rows);setCursor(page.nextCursor);onRead?.(rows.slice(0,8).map(r=>r.id));setStatus(rows.length?'':'No published reports here yet.');
  }catch(e){if(!c.signal.aborted)setStatus(e instanceof Error?e.message:'Could not load reports.');}
  finally{if(!c.signal.aborted)setBusy(false);}
 }
 return <section className="community-feed"><h4>{routeId?'Reports and ratings for this route':'Silvassa community reports'}</h4>
 <p>{communityEnabled?'Published observations from other walkers. Star ratings describe their walking experience.':'Public reports and route ratings will appear once the shared reporting service is connected.'}</p>
 {communityEnabled&&<button type="button" disabled={busy} onClick={()=>void load()}>{busy?'Loading reports…':'Refresh reports'}</button>}
 {items.map(r=><article className="report" key={r.id}><small>{r.status==='verified'?'Verified observation':'Community observation · unverified'}</small><h4>{r.type}</h4><p>{r.note}</p><small>{r.point.name} · {new Date(r.created).toLocaleDateString()}{r.rating?' · Walker rating '+r.rating+'/5':''}</small></article>)}
 {cursor&&<button type="button" disabled={busy} onClick={()=>void load(cursor)}>More reports</button>}<div role="status">{status}</div></section>;
}
