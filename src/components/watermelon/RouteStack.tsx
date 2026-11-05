'use client';
import {useState} from 'react';
import {motion} from 'motion/react';
import {speeds,type Preference} from '@/types/walk';
import type {WalkRoute} from '@/lib/core';

export function RouteStack({routes,selected,select,pref}:{routes:WalkRoute[];selected:number;select:(i:number)=>void;pref:Preference}){
  const [expanded,setExpanded]=useState(false);
  const times=routes.map(r=>r.distance/speeds[pref.pace]*60);
  const match=times.reduce((best,v,i)=>Math.abs(v-pref.minutes)<Math.abs(times[best]-pref.minutes)?i:best,0);
  const order=[selected,...routes.map((_,i)=>i).filter(i=>i!==selected)];
  
  return <div className="route-stack">
    {routes.length>1&&<button className="text-button" aria-expanded={expanded} onClick={()=>setExpanded(!expanded)}>{expanded?'Collapse routes':'Compare routes'}</button>}
    <div className="stack-deck" style={{height:expanded?routes.length*86:86}}>
      {routes.map((r,i)=>{const pos=order.indexOf(i);return <motion.button key={i} className={'route-option '+(selected===i?'selected':'')} aria-pressed={selected===i} tabIndex={expanded||!pos?0:-1} aria-hidden={!expanded&&pos>0} style={{zIndex:routes.length-pos,pointerEvents:expanded||!pos?'auto':'none'}}
        animate={{y:expanded?i*86:pos*-7,scale:expanded?1:1-pos*.025}} transition={{type:'spring',stiffness:200,damping:23}} onClick={()=>select(i)}>
        
        <span>Route {i+1}{i===match&&routes.length>1?' · Closest time match':''}</span>
        <strong>{r.distance.toFixed(2)} km</strong>
        <small>{Math.round(times[i])} min at your pace · {Math.ceil(r.duration/60)} min provider estimate</small>
        
        {/* HAZARD WARNING ADDED HERE */}
        {(r as any).hazards && (r as any).hazards.length > 0 && (
          <div style={{color: '#ff4d4f', fontSize: '11px', marginTop: '4px', fontWeight: 'bold'}}>
            ⚠️ { (r as any).hazards.length } Hazard{(r as any).hazards.length > 1 ? 's' : ''} Reported
          </div>
        )}
        
      </motion.button>})}
    </div>
  </div>;
}