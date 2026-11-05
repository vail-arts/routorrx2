'use client';
// Adapted from Watermelon adaptive-slider, card-swipe and carousel-navigator base sources (MIT).
import {motion,useReducedMotion,type PanInfo} from 'motion/react';
import {useEffect,type ReactNode} from 'react';
export function AdaptiveSlider({value,onChange,calories=false}:{value:number;onChange:(v:number)=>void;calories?:boolean}){
 const min=calories?50:1,max=calories?350:10,ratio=(value-min)/(max-min),reduced=useReducedMotion();
 const spring=reduced?{duration:0}:{type:'spring' as const,stiffness:300,damping:30};
 const label=calories?'Illustrative calorie goal':'Walking distance preference preview';
 return <label className="adaptive-slider"><span>{calories?'Calories':'Preview a walking-distance preference'}</span> <output>{value} {calories?'kcal':'km'}</output>
 <span className="energy-track"><motion.span className="energy-fill" animate={{width:`calc(${ratio*100}% + ${(1-ratio)*44}px)`,backgroundColor:ratio<.5?'#777':ratio<.7?'#a8a8a8':'#dadada'}} transition={spring}/>
 <motion.span className="energy-thumb" animate={{left:`calc(${ratio*100}% - ${ratio*44}px)`}} transition={spring}>Ⅱ</motion.span>
 <input aria-label={label} aria-valuetext={value+(calories?' kilocalories':' kilometres')} type="range" min={min} max={max} step={calories?25:1} value={value} onChange={e=>onChange(Number(e.target.value))}/></span></label>;
}
export function CardSwipe({children,onMove}:{children:ReactNode;onMove:(delta:number)=>void}){
 const reduced=useReducedMotion();
 function end(_:unknown,info:PanInfo){if(info.offset.x< -50||info.velocity.x< -500)onMove(1);else if(info.offset.x>50||info.velocity.x>500)onMove(-1);}
 return <motion.div className="swipe-card" drag="x" dragConstraints={{left:0,right:0}} dragElastic={reduced?0:.14} onDragEnd={end} transition={reduced?{duration:0}:{type:'spring',stiffness:330,damping:30}}>{children}</motion.div>;
}
export function CarouselNavigator({labels,index,onChange,playing=false}:{labels:readonly string[];index:number;onChange:(i:number)=>void;playing?:boolean}){
 const reduced=useReducedMotion();
 useEffect(()=>{if(!playing||reduced)return;const timer=setTimeout(()=>onChange((index+1)%labels.length),5000);return()=>clearTimeout(timer);},[playing,index,onChange,labels.length,reduced]);
 return <motion.div className="slide-controls" animate={{backgroundColor:['#272727','#363636','#202020'][index%3]}}>
 <motion.button whileTap={{scale:.9}} aria-label="Previous capability" onClick={()=>onChange((index+labels.length-1)%labels.length)}>←</motion.button>
 {labels.map((label,i)=><motion.button layout key={label} className={'slide-dot '+(i===index?'chosen':'')} transition={reduced?{duration:0}:{type:'spring',stiffness:300,damping:30}} aria-label={'Show '+label} aria-pressed={index===i} onClick={()=>onChange(i)}>{i===index&&<motion.i key={playing?'timer':'selected'} initial={{scaleX:playing?0:1}} animate={{scaleX:1}} transition={{duration:playing?5:0,ease:'linear'}}/>}</motion.button>)}
 <motion.button whileTap={{scale:.9}} aria-label="Next capability" onClick={()=>onChange((index+1)%labels.length)}>→</motion.button></motion.div>;
}
