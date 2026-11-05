'use client';
import {LayoutGroup,motion} from 'motion/react';
import {useId,useRef} from 'react';
const spring={type:'spring',stiffness:400,damping:30,mass:.8} as const;
export default function MapReveal({open,activate,collapse,directions,children}:{open:boolean;activate:()=>void;collapse?:()=>void;directions?:()=>void;children:React.ReactNode}){
 const id=useId();const opener=useRef<HTMLButtonElement>(null);
 return <LayoutGroup id={id}>{open?
   <motion.div layoutId="map-container" className="map-reveal" transition={spring}>{children}{collapse&&<div className="map-actions">{directions&&<button onClick={directions}>Directions ↓</button>}<button aria-label="Close map" onClick={()=>{collapse();requestAnimationFrame(()=>opener.current?.focus({preventScroll:true}));}}>Close ×</button></div>}</motion.div>:
   <div className="map-consent"><span className="eyebrow">SILVASSA / WALKING MAP</span><h2>Explore the streets.</h2><p>Map tiles are requested when you open the map. The tile provider receives your IP address and the area you view.</p>
   <motion.button ref={opener} layoutId="map-container" className="button" transition={spring} whileHover={{scale:1.02}} whileTap={{scale:.98}} onClick={activate}>{collapse?'View on map':'Load interactive map ↗'}</motion.button></div>
 }</LayoutGroup>;
}
