'use client';
import {motion,useReducedMotion} from 'motion/react';
import {useRouter} from 'next/navigation';
import {useState} from 'react';
import {CarouselNavigator,AdaptiveSlider} from './DiscoveryControls';

export function ImpactSlider(){
 const [calories,setCalories]=useState(200),[rate,setRate]=useState('5'),[error,setError]=useState('');
 const router=useRouter(),minutes=Number(rate)>0?Math.ceil(calories/Number(rate)):0;
 function plan(){try{localStorage.setItem('rx-pace',JSON.stringify({pace:'Walking',minutes}));router.push('/app');}catch{setError('Allow device storage to carry this plan into the app.');}}
 return <section className="section impact-energy"><span className="eyebrow">WALKING GOALS / INTERACTIVE STUDY</span><h2>Your energy goal.</h2>
 <p>Use your own activity tracker’s kcal per minute to turn a goal into a walking duration. The starting rate is an editable example.</p>
 <AdaptiveSlider value={calories} onChange={setCalories} calories/><label>Tracker rate (kcal/min)<input type="number" min=".1" max="50" step=".1" value={rate} onChange={e=>setRate(e.target.value)}/></label>
 <p aria-live="polite">{minutes>0?minutes+' minutes at your entered rate.':'Enter a positive rate.'} The planner supports walks of 5–120 minutes.</p><button className="button" disabled={minutes<5||minutes>120||Number(rate)>50} onClick={plan}>Use duration in planner ↗</button><small role="status">{error}</small></section>;
}

const panels=[
 {tab:'plan',title:'Choose your endpoints',text:'Pick two points or search for a landmark to request a walking route.'},
 {tab:'safety',title:'Set up your safety tools',text:'Choose a trusted contact or share a fixed starting point.'},
 {tab:'activities',title:'Make it a routine',text:'Choose a pace, pin an activity or plan your next walk.'}
];
const labels=panels.map(p=>p.title);
export function PlannerGuide({select}:{select:(tab:string)=>void}){
 const [index,setIndex]=useState(0);const [playing,setPlaying]=useState(false);const reduce=useReducedMotion();
 const panel=panels[index];
 return <section className="planner-guide" aria-label="Walking guide carousel" onFocusCapture={()=>setPlaying(false)}>
 <span className="eyebrow">WALKING GUIDE / 0{index+1}</span>
 <motion.div key={index} initial={{opacity:.5,x:reduce?0:8}} animate={{opacity:1,x:0}}><h3>{panel.title}</h3><p>{panel.text}</p>
 <button className="text-button" onClick={()=>{select(panel.tab);requestAnimationFrame(()=>document.getElementById('tab-'+panel.tab)?.focus());}}>Open tool ↗</button></motion.div>
 <CarouselNavigator labels={labels} index={index} onChange={setIndex} playing={playing&&!reduce}/>
 {!reduce&&<button className="text-button" aria-pressed={playing} onClick={()=>setPlaying(!playing)}>{playing?'Pause slides':'Play slides'}</button>}
 </section>;
}
