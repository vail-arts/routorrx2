'use client';
import {useEffect,useId,useRef,useState} from 'react';

const words=['a crossing.','a choice.','a first step.'];
export default function MorphText(){
 const id='threshold-'+useId().replace(/:/g,''),ref=useRef<HTMLSpanElement>(null);
 const [visible,setVisible]=useState(false),[paused,setPaused]=useState(false);
 useEffect(()=>{const o=new IntersectionObserver(([e])=>setVisible(e.isIntersecting));o.observe(ref.current!);return()=>o.disconnect();},[]);
 return <span className="morph-block" ref={ref}><svg width="0" height="0" aria-hidden="true"><defs><filter id={id}><feColorMatrix in="SourceGraphic" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 25 -9" result="goo"/><feComposite in="SourceGraphic" in2="goo" operator="atop"/></filter></defs></svg>
 <span className="morph-words" aria-hidden="true" style={{filter:'url(#'+id+')'}}>{words.map((word,i)=><span key={word} style={{animationDelay:(i*3-1.5)+'s',animationPlayState:visible&&!paused?'running':'paused'}}>{word}</span>)}</span>
 <button type="button" aria-pressed={paused} aria-label="Pause word rotation" className="morph-control" onClick={()=>setPaused(!paused)}>{paused?'▶':'Ⅱ'}</button></span>;
}
