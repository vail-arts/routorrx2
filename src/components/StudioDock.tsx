'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useEffect,useRef,useState} from 'react';
import {AnimatePresence,motion,useReducedMotion} from 'motion/react';

const icons=[
 'M3 11 12 3l9 8M5 10v11h5v-7h4v7h5V10',
 'M9 20v-3c-4 1-4-2-5-2M15 20v-3c0-1-.3-1.5-1-2 3-.3 5-1.5 5-5 0-1-.3-2-1-3 .3-1 .3-2 0-3-2 0-3 1-4 1a10 10 0 0 0-4 0C9 4 8 4 6 4c-.4 1-.4 2 0 3-1 1-1 2-1 3 0 3.5 2 4.7 5 5-.7.5-1 1-1 2',
 'M3 7q0-2 2-2h14q2 0 2 2v10q0 2-2 2H5q-2 0-2-2z M10 9l5 3-5 3z',
 'M3 6h18v13H3z M3 6l9 7 9-7'
];
const links=[
 ['Home','/'],['GitHub repository','https://github.com/vail-arts'],
 ['Vail Arts YouTube','https://www.youtube.com/channel/UCxPeusWSqJ9QQFZyko0jLVg'],
 ['Compose in Gmail','https://mail.google.com/mail/?view=cm&fs=1&su=routorrX'+(process.env.NEXT_PUBLIC_STUDIO_EMAIL?'&to='+encodeURIComponent(process.env.NEXT_PUBLIC_STUDIO_EMAIL):'')]
];
export default function StudioDock(){
 const path=usePathname();
 return <DockRail key={path} home={path==='/'}/>;
}

type Mode='open'|'parked'|'intro';
function DockRail({home}:{home:boolean}){
 const [mode,setMode]=useState<Mode>(home?'intro':'open');
 const nav=useRef<HTMLElement>(null);
 useEffect(()=>{
   const intro=home?document.querySelector('.studio-opening'):null;
   let anchor=scrollY,frame=0,covered=false;
   function sync(){frame=0;const y=scrollY;
     if(intro&&intro.getBoundingClientRect().bottom>0){covered=true;anchor=y;setMode('intro');return;}
     if(covered){covered=false;anchor=y;setMode('open');return;}
     const delta=y-anchor;
     if(Math.abs(delta)<18)return;
     anchor=y;
     if(delta>0)setMode('open');
     else if(!nav.current?.contains(document.activeElement))setMode('parked');
   }
   function scroll(){if(!frame)frame=requestAnimationFrame(sync);}
   if(home&&intro&&intro.getBoundingClientRect().bottom<=0)setMode('open');
   sync();addEventListener('scroll',scroll,{passive:true});addEventListener('resize',scroll);
   return()=>{cancelAnimationFrame(frame);removeEventListener('scroll',scroll);removeEventListener('resize',scroll);};
 },[home]);
 const [hover,setHover]=useState<number|null>(null),[focus,setFocus]=useState<number|null>(null);
 const i=hover??focus,quiet=useReducedMotion();
 const expanded=mode==='open';
 function reopen(){setMode('open');requestAnimationFrame(()=>nav.current?.querySelector('a')?.focus());}
 return <div className="dock-shell" data-mode={mode}><motion.nav ref={nav} inert={!expanded} aria-hidden={!expanded}
 initial={quiet||!expanded?false:{opacity:0,scaleY:.2,scaleX:.72,y:9}} animate={{opacity:expanded?1:0,scaleY:expanded?1:.2,scaleX:expanded?1:.72,y:expanded?0:9}}
 transition={quiet?{duration:0}:{type:'spring',stiffness:expanded?325:400,damping:expanded?23:32}}
 className="studio-dock glass-rail" aria-label="Studio shortcuts" onPointerLeave={()=>setHover(null)} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))setFocus(null);}}>
 {links.map(([label,url],index)=><Link href={url} prefetch={false} key={label} aria-label={label} onFocus={()=>setFocus(index)} onPointerEnter={e=>{if(e.pointerType!=='touch')setHover(index);}}>
 <motion.span className="dock-icon" animate={{scale:quiet?1:i===index?1.22:i!==null&&Math.abs(i-index)===1?1.06:1,x:!quiet&&i===index?-2:0}} transition={{type:'spring',stiffness:320,damping:24}}><svg viewBox="0 0 24 24" aria-hidden="true"><path d={icons[index]}/></svg></motion.span></Link>)}
 <AnimatePresence>{expanded&&i!==null&&<motion.span key="hint" className="dock-hint" aria-hidden="true" initial={{opacity:0,scale:.92}} animate={{opacity:1,scale:1,y:i*46}} exit={{opacity:0,scale:.92}} transition={quiet?{duration:0}:{type:'spring',stiffness:120,damping:18}}>{links[i][0]}</motion.span>}</AnimatePresence>
 </motion.nav>
 <motion.button type="button" className="dock-launch" aria-label="Open studio shortcuts" inert={mode!=='parked'} aria-hidden={mode!=='parked'} onClick={reopen}
 initial={false} animate={{opacity:mode==='parked'?1:0,scale:mode==='parked'?1:.55}} transition={quiet?{duration:0}:{type:'spring',stiffness:340,damping:25}}>•••</motion.button></div>;
}
