'use client';
import {AnimatePresence,LayoutGroup,motion,useReducedMotion} from 'motion/react';
import {useId,useRef,useState} from 'react';

// Watermelon invite-disclosure: shared shell, heading, badge and two spring masses.
export default function WalkInvites(){
 const id=useId(),title=useRef<HTMLButtonElement>(null);
 const [open,setOpen]=useState(false),[walks,setWalks]=useState<{id:string;name:string}[]>([]),[status,setStatus]=useState('');
 const reduced=useReducedMotion();
 const spring=reduced?{duration:0}:{type:'spring' as const,stiffness:800,damping:80,mass:open?5:4};
 return <LayoutGroup id={id}><motion.section layout className="walk-invites" transition={spring}>
 <button ref={title} className="invite-title" aria-controls={id} aria-expanded={open} onClick={()=>setOpen(!open)}>
 <motion.span layout="position" transition={spring}>Walk invitations</motion.span><motion.b layout="position" transition={spring}>{walks.length}</motion.b><span aria-hidden>{open?'−':'+'}</span></button>
 <AnimatePresence initial={false}>{open&&<motion.div id={id} key="invites" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onKeyDown={e=>{if(e.key==='Escape'){setOpen(false);title.current?.focus();}}}>
 <p>Prepare invitation text to share yourself. Drafts last for this visit.</p>
 <form onSubmit={e=>{e.preventDefault();const form=e.currentTarget;const name=String(new FormData(form).get('walk')).trim();if(!name||walks.length>=8)return;setWalks([...walks,{id:crypto.randomUUID(),name}]);form.reset();setStatus('Invitation drafted.');}}>
 <label>Walk invitation<input name="walk" placeholder="Evening walk · Friday at 6" maxLength={100} required/></label><button className="button" disabled={walks.length>=8}>Add draft</button></form>
 {walks.map(w=><motion.div layout key={w.id} className="invite-row" transition={spring}><span>{w.name}</span>
 <button onClick={async()=>{try{await navigator.clipboard.writeText('Join me for '+w.name+'. '+location.origin+'/app');setStatus('Invitation copied.');}catch{setStatus('Copy unavailable. Select the walk text to share it.');}}}>Copy invitation</button>
 <button aria-label={'Remove '+w.name} onClick={()=>setWalks(walks.filter(item=>item.id!==w.id))}>Remove</button></motion.div>)}
 <small role="status">{status}</small></motion.div>}</AnimatePresence></motion.section></LayoutGroup>;
}
