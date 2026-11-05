'use client';
import {useRef,useState} from 'react';
import {AnimatePresence,LayoutGroup,motion} from 'motion/react';

function Reaction({up,filled=false}:{up:boolean;filled?:boolean}){
 return <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" style={{transform:up?'none':'rotate(180deg)'}} fill={filled?'currentColor':'none'} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"><path d="M3 10h4v11H3zM8 10l5-7c1-1 3 0 2.6 2L15 9h5a2 2 0 012 2.5L20 19a2 2 0 01-2 1.5H8z"/></svg>;
}
export default function Feedback(){
  const [rating,setRating]=useState<'up'|'down'|null>(null);
  const [status,setStatus]=useState('');
  const [topic,setTopic]=useState('Website experience'),[note,setNote]=useState('');
  async function shareNote(){try{const text=topic+' — '+note.trim();if(navigator.share)await navigator.share({title:'routorrX feedback',text});else{await navigator.clipboard.writeText(text);setStatus('Feedback copied to share.');}}catch(e){if(!(e instanceof DOMException&&e.name==='AbortError'))setStatus('Sharing unavailable. Download the draft instead.');}}
  const opener=useRef<HTMLButtonElement|null>(null);
  const root=useRef<HTMLElement>(null);
  const transition={ease:'easeInOut',duration:.3} as const;
  function finish(){setRating(null);requestAnimationFrame(()=>root.current?.querySelector<HTMLButtonElement>('[data-rating="'+opener.current?.dataset.rating+'"]')?.focus());}
  return <section id="feedback" className="feedback feature-card" ref={root}><span className="eyebrow">FIELD FEEDBACK / LOCAL EXPORT</span><h2>How was your walk?</h2><p>Choose a topic and describe what happened. Save a draft for this tab, share it yourself or download a copy.</p><LayoutGroup id="field-feedback"><AnimatePresence initial={false}>
    {!rating?<div className="rating-buttons" key="buttons">{(['up','down'] as const).map(value=><motion.button key={value} data-rating={value} layoutId={'feedback-'+value} transition={transition} whileHover={{scale:1.05}} whileTap={{scale:.95}} onClick={e=>{opener.current=e.currentTarget;setRating(value);setStatus('');try{const draft=JSON.parse(sessionStorage.getItem('rx-feedback-'+value)||'null');setTopic(draft?.topic||'Website experience');setNote(draft?.note||'');}catch{setNote('');}}}><motion.span layoutId={'reaction-'+value}><Reaction up={value==='up'}/></motion.span>{value==='up'?'Worked well':'Needs work'}</motion.button>)}</div>:
    <motion.form key="form" className="feedback-sheet" layoutId={'feedback-'+rating} transition={transition} onSubmit={e=>{
      e.preventDefault();const data=new FormData(e.currentTarget);
      const url=URL.createObjectURL(new Blob([JSON.stringify({rating,category:data.get('topic'),message:data.get('note'),created:new Date().toISOString()},null,2)],{type:'application/json'}));
      const a=document.createElement('a');a.href=url;a.download='routorrx-feedback.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setStatus('Feedback draft exported to your downloads.');finish();
    }}>
      <motion.span layoutId={'reaction-'+rating} aria-hidden initial={{scale:1}} animate={{scale:[1,1.8,1],rotate:[0,rating==='up'?-35:35,rating==='up'?-35:35,0],y:[0,-4,0]}} transition={{duration:.5,ease:'easeOut'}}><Reaction up={rating==='up'} filled/></motion.span>
      <label>Feedback topic<select autoFocus name="topic" value={topic} onChange={e=>setTopic(e.target.value)}>{['Website experience','Navigation problem','Incorrect route','Missing pedestrian information','Feature suggestion','Other'].map(s=><option key={s}>{s}</option>)}</select></label>
      <label>Your feedback<textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Where were you, what did you expect, and what happened? Omit private details." name="note" minLength={5} maxLength={2000} required/></label><div className="feedback-actions"><button type="button" disabled={!note.trim()} onClick={()=>{try{sessionStorage.setItem('rx-feedback-'+rating,JSON.stringify({topic,note}));setStatus('Draft saved in this tab.');}catch{setStatus('Storage unavailable. Download a copy.');}}}>Save draft</button><button type="button" disabled={note.trim().length<5} onClick={()=>void shareNote()}>Share feedback</button><button className="button">Download draft</button></div><button type="button" onClick={finish}>Cancel</button>
    </motion.form>}
    </AnimatePresence></LayoutGroup><p role="status">{status}</p></section>;
}
