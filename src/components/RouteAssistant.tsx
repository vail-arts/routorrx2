'use client';
import {useEffect,useRef,useState} from 'react';
import CommunityFeed from './CommunityFeed';
import {api} from '@/lib/api';
import type {WalkRoute} from '@/lib/core';

/** Frontend only: the backend owns OpenRouter credentials, authentication and quotas. */
export default function RouteAssistant({route,rate}:{route:WalkRoute|null;rate:()=>void}) {
 const [question,setQuestion]=useState('Explain this walk in plain language.');
 const [consent,setConsent]=useState(false);
 const [busy,setBusy]=useState(false);
 const [answer,setAnswer]=useState('');
 const [error,setError]=useState('');
 const [reportIds,setReportIds]=useState<string[]>([]);
 const generation=useRef(0);
 const connected=process.env.NEXT_PUBLIC_ASSISTANT_ENABLED==='true';
 useEffect(()=>{generation.current++;setAnswer('');setError('');setConsent(false);},[route]);
 useEffect(()=>()=>{generation.current++;},[]);
 async function explain() {
  if(!route||!consent||busy||!connected)return;
  const stamp=generation.current;
  setBusy(true);setError('');setAnswer('');
  try {
   const result=await api('assistant',{question:question.trim(),...(reportIds.length&&{reportIds}),route:{distance:route.distance,duration:route.duration,steps:route.steps.slice(0,30)}});
   if(stamp===generation.current)setAnswer(result.answer);
  } catch(e) {if(stamp===generation.current)setError(e instanceof Error?e.message:'Assistant unavailable.');}
  finally {setBusy(false);}
 }
 return <details className="app-details assistant-panel"><summary>Explain my route · routorrX AI</summary>
 <p>Get a plain-language explanation of your selected walk. AI answers can be wrong; they do not verify street safety or accessibility.</p>
 {!connected?<p className="notice">Not connected yet. Your backend developer must enable the assistant service. No question or route is sent.</p>:!route?<p>Choose a walking route first.</p>:<form onSubmit={e=>{e.preventDefault();void explain();}}>
 <label>Your question<textarea maxLength={500} minLength={5} required value={question} onChange={e=>setQuestion(e.target.value)}/></label>
 <label className="consent-check"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/> Send my question and route instructions to the configured OpenRouter service. Instructions may include street names; exact coordinates and contacts are excluded. {reportIds.length>0&&'The displayed public report references are included.'}</label>
 <button className="button full" disabled={!consent||busy}>{busy?'Requesting explanation…':'Explain this route'}</button>
 </form>}
 <div aria-live="polite">{error&&<p role="alert">{error}</p>}{answer&&<div className="assistant-answer"><span className="badge">AI-GENERATED · CHECK BEFORE RELYING</span><p>{answer}</p></div>}</div>
 {route&&<><button className="text-button" type="button" onClick={rate}>Rate or report this walk ↗</button>{route.id?<CommunityFeed key={route.id} routeId={route.id} onRead={setReportIds}/>:<p>Route-specific community reports need a shared ID from the routing service.</p>}</>}
 </details>;
}
