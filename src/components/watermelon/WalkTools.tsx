'use client';
import {AnimatePresence, LayoutGroup, motion} from 'motion/react';
import {useState, useEffect} from 'react'; // <-- FIXED IMPORT HERE
import {useDeviceList} from '@/hooks/useDeviceList';
import {isPlace, record} from '@/lib/validation';
import type {Place} from '@/lib/core';
import {speeds,type Preference,type Pace,type Routine,type Reminder,type SavedWalk} from '@/types/walk';
import WalkInvites from './WalkInvites';
import {KnobSlider} from './KnobSlider';
import AIAnalysisButton from '../AIAnalysisButton';

const routines:Routine[]=[
  {id:'morning',name:'Morning walk',pinned:true,pace:'Walking'},
  {id:'evening',name:'Evening walk',pinned:false,pace:'Brisk walking'},
  {id:'jog',name:'Jogging session',pinned:false,pace:'Jogging'},
  {id:'commute',name:'Daily commute',pinned:false,pace:'Walking'}
];
const routineOK=(v:unknown):v is Routine=>record(v)&&routines.some(r=>r.id===v.id&&r.name===v.name&&r.pace===v.pace)&&typeof v.pinned==='boolean';
const reminderOK=(v:unknown):v is Reminder=>record(v)&&typeof v.id==='string'&&typeof v.name==='string'&&typeof v.when==='string'&&Number.isFinite(Date.parse(v.when))&&['Once','Daily','Weekly'].includes(String(v.repeat));
const walkOK=(v:unknown):v is SavedWalk=>record(v)&&typeof v.id==='string'&&isPlace(v.from)&&isPlace(v.to);

export function Activities({pref,change}:{pref:Preference;change:(next:Preference)=>void}){
  const {items,save,ready,error}=useDeviceList('rx-routines',routines,routineOK);
  const [selected,setSelected]=useState('');
  const pinned=items.filter(r=>r.pinned);
  const select=(r:Routine)=>{setSelected(r.id);change({...pref,pace:r.pace});};
  function move(id:string){
    const next=[...items];const index=next.findIndex(r=>r.id===id);
    if(index>0){[next[index-1],next[index]]=[next[index],next[index-1]];save(next);}
  }
  
  return <section className="walk-tools"><h3>Activity preferences</h3>
    <div className="pace-controls"><KnobSlider value={pref.minutes} onChange={minutes=>change({...pref,minutes})} min={5} max={120}/>
    <div><label>Activity<select value={pref.pace} onChange={e=>change({...pref,pace:e.target.value as Pace})}>{Object.keys(speeds).map(k=><option key={k}>{k}</option>)}</select></label>
    <p>{pref.minutes} minutes at {speeds[pref.pace]} km/h. Route matches use distance and this estimated pace.</p></div></div>
    
    <h4>Pinned activities</h4>
    {pinned.length>0&&<button className="routine-hero" onClick={()=>select(pinned[(pinned.findIndex(r=>r.id===selected)+1)%pinned.length])}>Cycle pinned · <AnimatePresence mode="wait" initial={false}><motion.span key={selected} initial={{opacity:0,scale:.7,filter:'blur(8px)'}} animate={{opacity:1,scale:1,filter:'blur(0px)'}} exit={{opacity:0}} transition={{type:'spring',bounce:0,duration:.6}}>{items.find(r=>r.id===selected)?.name||'Choose a routine'}</motion.span></AnimatePresence></button>}
    
    <LayoutGroup>{items.map((r,i)=><motion.div layout key={r.id} className="routine-row" transition={{type:'spring',stiffness:400,damping:40}}>
      <button aria-pressed={selected===r.id} onClick={()=>select(r)}>{r.name}</button>
      <motion.button disabled={!ready} aria-label={'Pin '+r.name} aria-pressed={r.pinned} whileTap={{scale:.85}} transition={{type:'spring',stiffness:400,damping:30}} onClick={()=>save(items.map(entry=>entry.id===r.id?{...entry,pinned:!entry.pinned}:entry))}>{r.pinned?'Pinned':'Pin'}</motion.button>
      <button disabled={!i||!ready} aria-label={'Move '+r.name+' up'} onClick={()=>move(r.id)}>↑</button>
    </motion.div>)}</LayoutGroup>
    
    <WalkInvites/>
    
    {/* --- AI ACTIVITY PLANNER --- */}
    <div style={{ marginTop: '24px', padding: '20px', background: '#111', borderRadius: '24px', border: '1px solid #333' }}>
      <h4 style={{ fontSize: '16px', color: '#fff', marginBottom: '8px' }}>routorrX AI Coach</h4>
      <p style={{ fontSize: '12px', color: '#888', marginBottom: '16px' }}>Get a personalized plan for your walk today based on your preferences.</p>
      
      <AIAnalysisButton 
        label="Generate Daily Plan" 
        disabled={false}
        run={async (signal) => {
          const pinnedNames = items.filter(r => r.pinned).map(r => r.name);
          
          const res = await fetch('/api/activity-plan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              activity: pref.pace,
              duration: pref.minutes,
              pinned: pinnedNames.length > 0 ? pinnedNames : ["Morning walk"],
              reminders: 'None' 
            }),
            signal
          });
          if (!res.ok) throw new Error("Failed to generate plan");
          const data = await res.json();
          return data.plan;
        }}
      />
    </div>

    {error&&<p role="status">{error}</p>}
  </section>;
}

function occurrence(reminder:Reminder){
  const date=new Date(reminder.when);
  const now=new Date();
  if(reminder.repeat==='Once')return (date<now?'Past · ':'Scheduled · ')+date.toLocaleString();
  if(date<now){
    const step=reminder.repeat==='Weekly'?7:1;
    const days=Math.floor((Date.UTC(now.getFullYear(),now.getMonth(),now.getDate())-Date.UTC(date.getFullYear(),date.getMonth(),date.getDate()))/86400000);
    date.setDate(date.getDate()+Math.floor(days/step)*step);
    if(date<now)date.setDate(date.getDate()+step);
  }
  return 'Next · '+date.toLocaleString();
}

export function Reminders(){
  const {items,save,ready,error}=useDeviceList<Reminder>('rx-reminders',[],reminderOK);
  const [edit,setEdit]=useState<Reminder|null>(null);

  // 1. Ask for notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // 2. Background timer to check if it's time
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      items.forEach(rem => {
        const remDate = new Date(rem.when);
        
        // Check if current time matches reminder time
        if (
          remDate.getHours() === now.getHours() && 
          remDate.getMinutes() === now.getMinutes() && 
          !rem.triggered
        ) {
           if ('Notification' in window && Notification.permission === 'granted') {
             new Notification('Time for your walk!', { body: rem.name });
           } else {
             alert(`Reminder: ${rem.name}`);
           }
           // Mark as triggered
           save(items.map(i => i.id === rem.id ? { ...i, triggered: true } : i));
        }
      });
    }, 10000);
    return () => clearInterval(interval);
  }, [items, save]);

  return <section className="walk-tools"><h3>Walk reminders</h3><p>A schedule on this device. No background notifications.</p>
    <form key={edit?.id||'new'} onSubmit={e=>{
      e.preventDefault();
      const f=e.currentTarget;
      const data=new FormData(f);
      
      const timeVal = String(data.get('time'));
      const [hours, mins] = timeVal.split(':');
      const today = new Date();
      today.setHours(Number(hours), Number(mins), 0, 0);
      
      // When editing, reset the triggered flag so it can fire again
      const entry:Reminder={
        id:edit?.id||crypto.randomUUID(),
        name:String(data.get('name')).trim(),
        when:today.toISOString(), 
        repeat:data.get('repeat') as Reminder['repeat'],
        triggered: false 
      };
      
      if(!entry.name||!reminderOK(entry))return;
      save(edit?items.map(r=>r.id===edit.id?entry:r):[...items,entry]);
      setEdit(null);
      f.reset();
    }}>
      
      <label>Walk name<input name="name" required pattern=".*\S.*" maxLength={60} defaultValue={edit?.name} placeholder="Evening walk"/></label>
      
      <label>Time<input type="time" name="time" required defaultValue={edit ? new Date(edit.when).toTimeString().substring(0,5) : '18:00'}/></label>
      
      <label>Repeat<select name="repeat" defaultValue={edit?.repeat}>{['Once','Daily','Weekly'].map(x=><option key={x}>{x}</option>)}</select></label>
      
      <button className="button" disabled={!ready||(!edit&&items.length>=30)}>{edit?'Save changes':'Add reminder'}</button>
      {edit&&<button type="button" onClick={()=>setEdit(null)}>Cancel edit</button>}
    </form>
    
    <LayoutGroup>
      <AnimatePresence initial={false}>
        {items.map(r=><motion.article key={r.id} className="local-row" layout initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} transition={{type:'spring',bounce:.2,duration:.5}}>
          <strong>{r.name}</strong><small>{occurrence(r)} · {r.repeat}</small>
          <button onClick={()=>setEdit(r)}>Edit</button>
          <button onClick={()=>{save(items.filter(x=>x.id!==r.id));if(edit?.id===r.id)setEdit(null);}}>Delete</button>
        </motion.article>)}
      </AnimatePresence>
    </LayoutGroup>
    
    {error&&<p role="status">{error}</p>}
  </section>;
}

export function SavedWalks({from,to,restore}:{from:Place|null;to:Place|null;restore:(walk:SavedWalk)=>void}){
  const {items,save,ready,error}=useDeviceList<SavedWalk>('rx-saved-walks',[],walkOK);
  return <section className="walk-tools"><h3>Saved endpoints</h3><p>Saved on this device. Request a fresh route after opening a walk.</p>
    <button className="button" disabled={!ready||!from||!to||items.length>=30} onClick={()=>{if(from&&to)save([...items,{id:crypto.randomUUID(),from,to}]);}}>Save these endpoints</button>
    {items.map(w=><div className="local-row" key={w.id}><button onClick={()=>restore(w)}>{w.from.name} → {w.to.name}</button><button onClick={()=>save(items.filter(x=>x.id!==w.id))}>Remove</button></div>)}{error&&<p>{error}</p>}</section>;
}