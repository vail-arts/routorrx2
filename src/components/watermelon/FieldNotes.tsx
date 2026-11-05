'use client';
import {AnimatePresence, LayoutGroup, motion} from 'motion/react';
import {useId, useRef, useState} from 'react';
import {RippleText} from '../StudioMotion';
import {plates} from '@/content/plates';

export function ExpandDetails({title,children,initialOpen=false}:{title:string;children:React.ReactNode;initialOpen?:boolean}){
  const [open,setOpen]=useState(initialOpen);
  const id=useId();
  return <div className="expand-detail">
    <button aria-label={title} aria-expanded={open} aria-controls={id} onClick={()=>setOpen(!open)}>
      <RippleText text={title}/><motion.span aria-hidden animate={{rotate:open?0:-90}} transition={{duration:.2}}>⌄</motion.span>
    </button>
    <AnimatePresence initial={false}>{open&&<motion.div id={id} initial={{height:0}} animate={{height:'auto'}} exit={{height:0}} transition={{type:'spring',stiffness:200,damping:22,mass:1.2}}>
      <motion.div className="detail-copy" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} exit={{opacity:0}}>{children}</motion.div>
    </motion.div>}</AnimatePresence>
  </div>;
}

export function PlateCard({plate}:{plate:typeof plates[number]}){
  const [open,setOpen]=useState(false);
  const id=useId();
  const dialog=useRef<HTMLDialogElement>(null);
  function close(){setOpen(false);}
  const picture=(large:boolean)=><>
    <motion.img layoutId={'image-'+id} src={plate.url} alt={plate.alt} loading="lazy" width="640" height="400"/>
    <motion.span layoutId={'subtitle-'+id} className="eyebrow">{plate.label}</motion.span>
    <motion.strong layoutId={'title-'+id}>{plate.title}</motion.strong>
    {large&&<motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.2}}>{plate.detail}</motion.p>}
  </>;
  return <LayoutGroup id={id}><motion.button className="plate-card" layoutId={id} aria-haspopup="dialog" onClick={()=>{dialog.current?.showModal();setOpen(true);}}>{picture(false)}</motion.button>
    <dialog ref={dialog} aria-label={plate.title} className="plate-dialog" onCancel={e=>{e.preventDefault();close()}} onClick={e=>{if(e.target===dialog.current)close()}}>
      <AnimatePresence onExitComplete={()=>dialog.current?.close()}>{open&&<motion.article layoutId={id} className="plate-card enlarged" exit={{opacity:0}}>
        {picture(true)}<button onClick={close} className="close" aria-label="Close field note">×</button>
      </motion.article>}</AnimatePresence>
    </dialog>
  </LayoutGroup>;
}
