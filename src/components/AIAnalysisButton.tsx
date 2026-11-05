'use client';
import {useEffect,useLayoutEffect,useId,useRef,useState} from 'react';
import {AnimatePresence,motion,useReducedMotion} from 'motion/react';
import styles from './AIAnalysisButton.module.css';

/** Pop Button + Generate Button adaptation. See THIRD_PARTY_NOTICES.md. */
export interface AIAnalysisButtonProps {
 label?:string;
 disabled?:boolean;
 /** Return a real server response; reject on failure. Never put provider keys here. */
 run:(signal:AbortSignal)=>Promise<string>;
}
export default function AIAnalysisButton({label='Analyze issue',disabled=false,run}:AIAnalysisButtonProps){
 const [busy,setBusy]=useState(false),[result,setResult]=useState<{text:string;error:boolean}|null>(null);
 const job=useRef<AbortController|null>(null),button=useRef<HTMLButtonElement>(null);
 const title=useId(),surface=title+'-surface';
 const panel=useRef<HTMLElement>(null),restoreFocus=useRef(false);
 const [height,setHeight]=useState(112);
 const reduced=useReducedMotion();
 useEffect(()=>()=>{job.current?.abort();},[]);
 const spring=reduced?{duration:0}:{type:'spring' as const,stiffness:280,damping:34,mass:1};
 useLayoutEffect(()=>{
  if(!result){setHeight(112);if(restoreFocus.current){button.current?.focus({preventScroll:true});restoreFocus.current=false;}return;}
  const el=panel.current;if(!el)return;
  const measure=()=>setHeight(Math.max(112,el.offsetHeight));
  measure();const observer=new ResizeObserver(measure);observer.observe(el);
  el.focus({preventScroll:true});return()=>observer.disconnect();
 },[result]);
 function close(){restoreFocus.current=true;setResult(null);}
 async function start(){
  if(disabled||job.current)return;
  const controller=new AbortController();job.current=controller;setBusy(true);setResult(null);
  try{
   const text=await run(controller.signal);
   if(!controller.signal.aborted){
    if(typeof text!=='string'||!text.trim())throw new Error('No analysis was returned. Please try again.');
    setResult({text,error:false});
   }
  }catch(e){if(!controller.signal.aborted)setResult({text:e instanceof Error?e.message:'Analysis unavailable. Please try again.',error:true});}
  finally{if(job.current===controller){job.current=null;if(!controller.signal.aborted)setBusy(false);}}
 }
 function cancel(){job.current?.abort();job.current=null;setBusy(false);}
 const caption=busy?'Analyzing…':label;
 return <motion.div className={styles.root} initial={false} animate={{height}} transition={spring}>
  <span className={styles.status} role="status">{busy?'Analyzing your photo…':result?'Analysis completed. Result available.':''}</span>
  <AnimatePresence initial={false} mode="sync">
  {!result?<motion.button key="button" layoutId={surface} ref={button} type="button" className={styles.button}
   style={{borderRadius:32,originX:0,originY:0}} transition={spring}
   aria-label={caption} aria-busy={busy} aria-expanded={false} disabled={disabled||busy} data-busy={busy} onClick={()=>void start()}>
   <motion.span layout="position" className={styles.star} aria-hidden="true">✦</motion.span>
   <span className={styles.pulse} aria-hidden="true"/>
  </motion.button>:<motion.section key="result" layoutId={surface} ref={panel} id={title+'-panel'} role="region" tabIndex={-1} aria-labelledby={title}
   className={styles.panel} style={{borderRadius:24,originX:0,originY:0}} transition={spring}
   onLayoutAnimationComplete={()=>{if(panel.current)panel.current.dataset.settled='true';}}
   onKeyDown={e=>{if(e.key==='Escape')close();}}>
   <motion.div layout="position" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:reduced?0:.18,delay:reduced?0:.12}}>
    <span className={styles.kicker}>{result.error?'REQUEST NOT COMPLETED':'AI-GENERATED · REVIEW REQUIRED'}</span>
    <h3 id={title}>{result.error?'Analysis unavailable':'Analysis ready'}</h3>
    <p className={styles.answer}>{result.text}</p>
    {!result.error&&<p>Check this suggestion against the actual road. It is not a verified safety assessment.</p>}
    <button type="button" className={styles.close} onClick={close}>Close</button>
   </motion.div>
  </motion.section>}
  </AnimatePresence>
  {!result&&<div className={styles.caption} aria-hidden="true">{Array.from(caption).map((letter,i)=><span className={styles.letter} data-busy={busy} style={{animationDelay:`${i*65}ms`}} key={i}>{letter===' '?'\u00a0':letter}</span>)}</div>}
  {busy&&<button type="button" className={styles.cancel} onClick={cancel}>Cancel analysis</button>}
 </motion.div>;
}
