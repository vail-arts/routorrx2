'use client';
import {useId} from 'react';
import {LayoutGroup,motion,useReducedMotion} from 'motion/react';
const paths:Record<string,string>={plan:'M5 18V8a3 3 0 0 1 6 0v8a3 3 0 0 0 6 0V6m-3 3 3-3 3 3',safety:'M12 3 4 6v5c0 5 4 8 8 10 4-2 8-5 8-10V6z M8 12l3 3 5-6',reports:'M5 21V4m0 1c5-4 8 4 14 0v10c-6 4-10-4-14 0',activities:'M2 13h5l3-8 4 14 3-6h5'};
interface Props<T extends string>{items:readonly {id:T;label:string}[];value:T;onChange:(id:T)=>void;label:string;panels?:boolean}
export default function ContinuousTabs<T extends string>({items,value,onChange,label,panels=false}:Props<T>){
 const id=useId(); const reduced=useReducedMotion();
 return <LayoutGroup id={id}><div className={'continuous-tabs '+(panels?'planner-tabs':'')} role={panels?'tablist':'group'} aria-label={label} onKeyDown={e=>{ 
   const i=items.findIndex(item=>item.id===value);
   const next=({ArrowRight:(i+1)%items.length,ArrowLeft:(i+items.length-1)%items.length,Home:0,End:items.length-1} as Record<string,number>)[e.key];
   if(next===undefined)return;e.preventDefault();onChange(items[next].id);e.currentTarget.querySelectorAll('button')[next]?.focus();
 }}>
 {items.map(item=><button type="button" key={item.id} {...(panels?{role:'tab',id:'tab-'+item.id,'aria-selected':value===item.id,'aria-controls':'panel-'+item.id,tabIndex:value===item.id?0:-1}:{'aria-pressed':value===item.id})} onClick={()=>onChange(item.id)}>
 {value===item.id&&<motion.span className="active-pill" layoutId="active-pill" transition={reduced?{duration:0}:{type:'spring',stiffness:380,damping:30}}/>}<span className="tab-label">{panels&&<svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round"><path d={paths[item.id]}/></svg>}{item.label}</span></button>)}
 </div></LayoutGroup>;
}
