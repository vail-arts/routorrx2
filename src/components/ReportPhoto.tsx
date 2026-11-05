'use client';
import {useEffect,useRef,useState} from 'react';
import {analysisEnabled,analyzePhoto} from '@/lib/community';
import AIAnalysisButton from './AIAnalysisButton';

// Re-encode rather than retain the original camera file and its location metadata.
async function prepare(file:File){
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>12*1024*1024)throw new Error('Choose a JPEG, PNG or WebP under 12 MB.');
 const url=URL.createObjectURL(file);
 try{
  const img=new Image();img.src=url;await img.decode();
  const scale=Math.min(1,960/Math.max(img.width,img.height)),canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));
  const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Photo processing unavailable.');
  ctx.drawImage(img,0,0,canvas.width,canvas.height);
  for(const quality of [.76,.55,.35]){
   const jpeg=canvas.toDataURL('image/jpeg',quality);if(jpeg.length<=220000)return jpeg;
  }
  throw new Error('Choose a smaller photo.');
 }finally{URL.revokeObjectURL(url);}
}

export default function ReportPhoto({photo,change}:{photo:string;change:(s:string)=>void}){
 const dialog=useRef<HTMLDialogElement>(null),trigger=useRef<HTMLButtonElement>(null),animation=useRef<Animation|null>(null),revision=useRef(0);
 const [error,fail]=useState('');
 
 useEffect(()=>()=>{revision.current++;animation.current?.cancel();},[]);
 
 async function choose(file?:File){
  if(!file)return;
  const stamp=++revision.current;fail('');
  try{const value=await prepare(file);if(stamp===revision.current){change(value);toggle(false);}}
  catch(e){if(stamp===revision.current)fail(e instanceof Error?e.message:'Could not open that photo.');}
 }
 
 function toggle(open:boolean){
  const el=dialog.current!,button=trigger.current!;
  if(open){fail('');el.showModal();}
  if(!el.open)return;
  if(!open)revision.current++;
  const current=getComputedStyle(el).transform;
  animation.current?.cancel();
  if(matchMedia('(prefers-reduced-motion:reduce)').matches){if(!open)el.close();return;}
  const start=button.getBoundingClientRect(),end=el.getBoundingClientRect();
  const contracted={transform:`translate(${start.left+start.width/2-end.left-end.width/2}px,${start.top+start.height/2-end.top-end.height/2}px) scale(${start.width/end.width},${start.height/end.height})`,opacity:.15};
  const run=el.animate(open?[contracted,{transform:'none',opacity:1}]:[{transform:current,opacity:1},contracted],
    {duration:open?245:185,easing:'cubic-bezier(.22,.8,.24,1)'});
  animation.current=run;run.onfinish=()=>{if(!open)el.close();animation.current=null;};
 }
 
 return (
   <section className="photo-field">
     <button type="button" ref={trigger} onClick={()=>toggle(true)}>{photo?'Change issue photo':'Add issue photo'}</button>
     
     {photo&&<>
       <img className="report-thumb" src={photo} alt="Selected road issue"/>
       <button type="button" onClick={()=>change('')}>Remove photo</button>
     </>}
     
     <dialog className="issue-sheet" ref={dialog} aria-label="Issue photo" onCancel={e=>{e.preventDefault();toggle(false);}}>
       <h3>Issue photo</h3><p>Choose one clear photo of the road. Avoid faces, number plates and private addresses.</p>
       {['Choose from device','Take a photo'].map((name,i)=><label key={name} className="photo-choice">{name}<input type="file" aria-label={name} accept="image/jpeg,image/png,image/webp" capture={i?'environment':undefined} onChange={e=>{const f=e.target.files?.[0];e.target.value='';void choose(f);}}/></label>)}
       <small>Camera availability depends on your device.</small><p role="alert">{error}</p><button type="button" onClick={()=>toggle(false)}>Close</button>
     </dialog>
     
     <details className="app-details">
       <summary>routorrX AI · Photo analysis</summary>
       <p>{analysisEnabled?'Send this photo for a suggested observation. Review the result before using it.':'Photo analysis is awaiting a server connection.'}</p>
       
       <AIAnalysisButton 
         key={photo} 
         label="Send photo for analysis" 
         disabled={!photo||!analysisEnabled} 
         run={async (signal) => {
           // 1. Grab the user's location
           let lat = 0, lon = 0;
           if (navigator.geolocation) {
             try {
               const pos = await new Promise<GeolocationPosition>((res, rej) => {
                 navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000, enableHighAccuracy: true });
               });
               lat = pos.coords.latitude;
               lon = pos.coords.longitude;
             } catch (e) {
               console.warn("Location denied or timed out.");
             }
           }
           // 2. Send the photo, location, and signal to the API
           return await analyzePhoto(photo, lat, lon, signal);
         }} 
       />
     </details>
   </section>
 );
}