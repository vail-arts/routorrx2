'use client';
import { supabase } from '@/lib/supabase';
import {PlannerGuide} from './watermelon/PlannerGuide';
import ContinuousTabs from './watermelon/ContinuousTabs';
import {ExpandDetails} from './watermelon/FieldNotes';
import dynamic from 'next/dynamic';
import MapReveal from './watermelon/MapReveal';
import {speeds,type Preference,type SavedWalk} from '@/types/walk';
import { AnimatePresence, motion } from 'motion/react';

const Activities=dynamic(()=>import('./watermelon/WalkTools').then(m=>m.Activities));
const Reminders=dynamic(()=>import('./watermelon/WalkTools').then(m=>m.Reminders));
const SavedWalks=dynamic(()=>import('./watermelon/WalkTools').then(m=>m.SavedWalks));
const RouteStack=dynamic(()=>import('./watermelon/RouteStack').then(m=>m.RouteStack));
const WalkingMap=dynamic(()=>import('./Map'),{ssr:false,loading:()=> <div className="map-loading">Loading the map…</div>});
const ReportPanel=dynamic(()=>import('./ReportPanel'));

import GuardianSOS from './GuardianSOS';
import NavigationCard from './NavigationCard';
import {useRouter} from 'next/navigation';
import {isDraft} from '@/lib/validation';
import {saveJourney,takeJourney} from '@/lib/journey';
import Link from 'next/link';
import {useCallback,useEffect,useRef,useState} from 'react';
import {type Place,type WalkRoute,weatherAdvice} from '@/lib/core';
import PWA from './PWA';
import RouteAssistant from './RouteAssistant';
import {api} from '@/lib/api';
import type {ReportDraft} from '@/types/api';

export default function Navigator({embedded=false}:{embedded?:boolean}) {
  const [from,setFrom]=useState<Place|null>(null),
        [to,setTo]=useState<Place|null>(null),
        [target,setTarget]=useState<'from'|'to'>('from'),
        [query,setQuery]=useState(''),
        [results,setResults]=useState<Place[]>([]),
        [routes,setRoutes]=useState<WalkRoute[]>([]),
        [selected,setSelected]=useState(0),
        [busy,setBusy]=useState(false),
        [message,setMessage]=useState('Choose a starting point and destination. Search or select a point on the map.'),
        [tab,setTab]=useState('plan'),
        [contact,setContact]=useState(''),
        [emergency,setEmergency]=useState('112'),
        [reports,setReports]=useState<ReportDraft[]>([]),
        [weather,setWeather]=useState<{temperature_2m:number;relative_humidity_2m:number;time:string;weather_code:number}|null>(null),
        [consent,setConsent]=useState(false),
        [storageReady,setStorageReady]=useState(false);

  // --- LIVE SHARING STATES ---
  const [liveShareUrl, setLiveShareUrl] = useState<string | null>(null);
  const [sharingLive, setSharingLive] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  const Title=embedded?'h2':'h1';
  const router=useRouter();
  const targetRef=useRef(target);targetRef.current=target;
  const version=useRef(0);
  const active=routes[selected]||null;
  const [preference,setPreference]=useState<Preference>({pace:'Walking',minutes:30});
  const [focus,setFocus]=useState<Place|null>(null);
  const [frameRoute,setFrameRoute]=useState(0);
  const directionsList=useRef<HTMLOListElement>(null);
  const mapPanel=useRef<HTMLElement>(null);
  const pending=useRef<AbortController|null>(null);
  const routeStamp=useRef(0);
  const routeCache=useRef(null as MapCache|null);
  
  if(!routeCache.current)routeCache.current=new MapCache();

  function changePreference(next:Preference){if(next.pace===preference.pace&&next.minutes===preference.minutes)return;setPreference(next);save('rx-pace',JSON.stringify(next));}
  function invalidate(){version.current++;pending.current?.abort();}
  function restore(walk:SavedWalk){invalidate();routeCache.current!.clear();setFrom(walk.from);setTo(walk.to);setFocus(null);setWeather(null);setRoutes([]);setResults([]);setTab('plan');setMessage('Saved places restored. Request a fresh route.');}
  function viewPoint(point:Place){setConsent(true);setFocus({...point});mapPanel.current?.scrollIntoView({block:'center',behavior:'instant'});}
  function viewRoute(){setFocus(null);setConsent(true);setFrameRoute(n=>n+1);mapPanel.current?.focus({preventScroll:true});mapPanel.current?.scrollIntoView({block:'center',behavior:'instant'});}
  function viewDirections(){setTab('plan');requestAnimationFrame(()=>directionsList.current?.focus());}

  useEffect(()=>{
    try{
      const pref=JSON.parse(localStorage.getItem('rx-pace')||'null');
      if(pref&&Object.hasOwn(speeds,pref.pace)&&Number.isInteger(pref.minutes)&&pref.minutes>=5&&pref.minutes<=120)setPreference(pref);
      setContact(localStorage.getItem('rx-contact')||'');
      setEmergency(localStorage.getItem('rx-emergency')||'112');
      const saved:unknown=JSON.parse(localStorage.getItem('rx-reports')||'[]');
      setReports(Array.isArray(saved)?saved.filter(isDraft).slice(0,20):[]);
    }catch{
      setMessage('Local storage unavailable; saved data could not be read.');
    }
    if(!embedded){
      const journey=takeJourney();
      if(journey){
        setFrom(journey.from);setTo(journey.to);setTarget(journey.from?'to':'from');setMessage('Your selected places are ready. Request a fresh walking route when you are ready.');
      }
    }
    setStorageReady(true);
    return()=>{pending.current?.abort();globalThis.speechSynthesis?.cancel();};
  },[embedded]);

  function save(key:string,value:string){try{localStorage.setItem(key,value);return true;}catch{setMessage('Unable to save on this device. Storage may be full or disabled.');return false;}}

  const pick=useCallback((p:Place)=>{
    version.current++;pending.current?.abort();setFocus(null);
    if(targetRef.current==='from'){setFrom(p);setWeather(null);}else {setTo(p);setWeather(null);}
    setRoutes([]);globalThis.speechSynthesis?.cancel();setResults([]);
    setMessage(`${targetRef.current==='from'?'Starting point':'Destination'} selected.`);
    if(targetRef.current==='from')setTarget('to');
  },[]);

  // --- AUTO-SET STARTING POINT TO LIVE LOCATION ---
  useEffect(() => {
    if (!from && !embedded && navigator.geolocation) {
      setMessage('Locating you…');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFrom({
            name: 'My current location',
            lat: pos.coords.latitude,
            lon: pos.coords.longitude
          });
          setTarget('to');
          setMessage('Location found. Search for a destination.');
        },
        (err) => {
          console.warn("Auto-location error:", err);
          setMessage('Choose a starting point or search.');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, [from, embedded]);

  async function task(fn:(signal:AbortSignal)=>Promise<void>){
    pending.current?.abort();const controller=new AbortController();pending.current=controller;setBusy(true);
    try{await fn(controller.signal);}catch(e){if(!controller.signal.aborted)setMessage(e instanceof Error?e.message:'Please try again.');}
    finally{if(pending.current===controller){pending.current=null;setBusy(false);}}
  }

  function locate(){
    if(!navigator.geolocation){setMessage('Location is not supported. Search or select a map point instead.');return;}
    setMessage('Waiting for location permission…');
    navigator.geolocation.getCurrentPosition(
      (p) => {
        pick({name:'My current location',lat:p.coords.latitude,lon:p.coords.longitude});
        setConsent(true);
        setFocus({name:'My current location', lat:p.coords.latitude, lon:p.coords.longitude});
      },
      (err) => {
        setMessage('Location was unavailable or permission was denied. Search or select a map point instead.');
      },
      {timeout:10000,maximumAge:0,enableHighAccuracy:true}
    );
  }

  async function share(){
    if(!from){setMessage('Set your starting point first. Sharing uses that point, not live tracking.');return;}
    const url=`https://www.openstreetmap.org/?mlat=${from.lat}&mlon=${from.lon}#map=17/${from.lat}/${from.lon}`;
    try{
      if(navigator.share)await navigator.share({title:'My selected location · routorrX',text:'This is a selected point, not a live location feed.',url});
      else{await navigator.clipboard.writeText(url);setMessage('Selected location link copied. It is not live tracking.');}
    }catch{setMessage('Sharing cancelled or unavailable. Nothing was sent by this app.');}
  }

  // --- THE MISSING FUNCTION ---
  async function sendEmergencyAlert(messageText: string) {
    let liveLink = liveShareUrl || '';
    if (!liveLink) {
      const shareId = Math.random().toString(36).substring(2, 9);
      const baseUrl = window.location.origin;
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
            liveLink = `${baseUrl}/live/${shareId}?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`;
            setLiveShareUrl(liveLink);
        });
      }
    }

    const fullMessage = liveLink ? `EMERGENCY: I need help. Track my live location here: ${liveLink}` : messageText;

    if (contact) {
      window.location.href = `sms:${contact}?body=${encodeURIComponent(fullMessage)}`;
    } else {
      alert("Please add a trusted contact number first!");
    }
  }

  // --- LIVE SHARE WITH AUTO-SEND ---
  function startLiveShare() {
    if (!navigator.geolocation) {
      setMessage('❌ Location is not supported on this browser.');
      return;
    }

    setMessage('⏳ Getting your GPS location...');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        
        const shareId = Math.random().toString(36).substring(2, 9);
        const baseUrl = window.location.origin;
        const link = `${baseUrl}/live/${shareId}?lat=${lat}&lon=${lon}`;
        
        setLiveShareUrl(link);
        setSharingLive(true);
        setMessage('✅ Live location sharing started!');

        // --- AUTO-SEND TO CONTACTS ---
        if (contact && navigator.share) {
          try {
            await navigator.share({
              title: 'routorrX · Live Location',
              text: `I am walking and sharing my live location with you. Follow me here:`,
              url: link
            });
          } catch (err) {
            console.log('Share cancelled');
          }
        } else if (contact) {
            window.location.href = `sms:${contact}?body=${encodeURIComponent(`I am sharing my live location: ${link}`)}`;
        }

        watchIdRef.current = navigator.geolocation.watchPosition(
          (watchPos) => {
            const newLink = `${baseUrl}/live/${shareId}?lat=${watchPos.coords.latitude}&lon=${watchPos.coords.longitude}`;
            setLiveShareUrl(newLink);
          },
          (err) => console.warn("Live share GPS error:", err),
          { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
        );
      },
      (err) => {
        setMessage('❌ GPS Error: Location permission denied or unavailable. Please allow location access.');
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );
  }

  function stopLiveShare() {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setSharingLive(false);
    setLiveShareUrl(null);
    setMessage('Live location sharing stopped.');
  }

  return (
    <div className={'navigation-app '+(embedded?'embedded-planner':'')}>
      <PWA/>
      {!embedded&&<header className="app-header"><Link href="/" className="brand">routorrX <sup>V2</sup></Link><span className="eyebrow">SILVASSA / WALKING PILOT</span><Link href="/experience#privacy">Privacy ↗</Link></header>}
      <div id={embedded?undefined:"main"} className="app-workspace">
        <section ref={mapPanel} tabIndex={-1} aria-label="Walking map" className="map-panel">
          <MapReveal collapse={embedded?undefined:()=>setConsent(false)} directions={active?viewDirections:undefined} open={consent} activate={()=>setConsent(true)}>
            {consent&&<WalkingMap frameRoute={frameRoute} from={from} to={to} focus={focus} route={active} onPick={pick}/>}
          </MapReveal>
          <div className="map-label"><span className="status-dot"/> SILVASSA · {consent?'SELECT A POINT ON THE MAP':'MAP NOT LOADED'}</div>
        </section>
        
        <aside className="planner" aria-label="Walking planner">
          <div className="planner-heading">
            <div><span className="eyebrow">A MORE CONSIDERED JOURNEY</span><Title>Where to?</Title></div>
            <span className="walk-icon">↗</span>
          </div>
          
          <ContinuousTabs panels label="Tools" value={tab} onChange={setTab} items={[{id:'plan',label:'Plan a walk'},{id:'safety',label:'Safety'},{id:'reports',label:'Reports'},...(!embedded?[{id:'activities',label:'Activities'}]:[])]}/>
          <p className="app-status" role="status" aria-live="polite">{busy?'Working…':message}</p>
          
          <div id={'panel-'+tab} role="tabpanel" aria-labelledby={'tab-'+tab}>
            {tab==='plan'&&<>
              <div className="point-fields">
                {(['from','to'] as const).map((id,i)=>
                  <button key={id} className={'point-field '+(target===id?'selected':'')} onClick={()=>{invalidate();setTarget(id);setResults([]);}}>
                    <span>{i?'◉':'○'}</span><span><small>{i?'DESTINATION':'STARTING POINT'}</small>{(i?to:from)?.name||'Search or choose on the map'}</span>
                  </button>
                )}
              </div>
              <button className="text-button" onClick={locate}>◎ Use my location for {target==='from'?'start':'destination'}</button>
              
              <form onSubmit={e=>{e.preventDefault();const captured=target;const stamp=version.current;void task(async signal=>{const data=await api('search',{query},signal);if(captured!==targetRef.current||stamp!==version.current)return;setResults(data);setMessage(data.length?'Select a result below.':'No places found in the Silvassa pilot area. Try a nearby landmark.');});}}>
                <label>Search {target==='from'?'starting point':'destination'}
                  <div className="search-row">
                    <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="A place in Silvassa" minLength={3} maxLength={120} required/>
                    <button disabled={busy} aria-label="Search places">↗</button>
                  </div>
                </label>
              </form>
              
              <div className="search-results">
                {results.map((p,i)=><button key={i} onClick={()=>pick(p)}>{p.name}</button>)}
              </div>
              
              <small className="muted">Search only on submit · © OpenStreetMap contributors</small>
              
              <button className="button full" disabled={!from||!to||busy} onClick={()=>void task(async signal=>{
                const stamp=version.current;const key=JSON.stringify([from?.lon,from?.lat,to?.lon,to?.lat]);
                const cached=routeCache.current!.read(key);const data=cached||await api('route',{from,to},signal);
                if(stamp!==version.current)return;if(!cached)routeCache.current!.put(key,data);
                routeStamp.current++;setRoutes(data);setSelected(0);
                setMessage(data.length?'Walking routes returned by your routing provider. Check conditions on the ground.':'No walking route was found. Try different points.');
              })}>Find walking routes ↗</button>
              
              <p className="fine-print">Search sends your query to the geocoder. Routing sends the selected endpoints to the configured walking provider.</p>
              
              {routes.length>0&&<section aria-label="Route alternatives">
                <h3>Walking routes</h3>
                {!embedded&&<button className="button" onClick={viewRoute}>View route on map ↗</button>}
                
                <RouteStack pref={preference} routes={routes} selected={selected} select={i=>{setSelected(i);globalThis.speechSynthesis?.cancel();}}/>
                
                <NavigationCard 
                  active={active} 
                  routes={routes} 
                  selected={selected} 
                  setSelected={setSelected} 
                />

                {/* --- WEATHER MOVED UP HERE --- */}
                {to&&<ExpandDetails key={to.lat+','+to.lon} initialOpen title={'Destination weather · '+to.name}>
                  <p>Check conditions at your destination. Refresh sends its coordinates to Open-Meteo.</p>
                  <button className="text-button" disabled={busy} onClick={()=>void task(async signal=>{const stamp=version.current;const data=await api('weather',{point:to},signal);if(stamp!==version.current)return;setWeather(data);setMessage('Weather updated from Open-Meteo.');})}>Refresh weather ↻</button>
                  {weather&&<div><h3>{weather.temperature_2m}°C <small>· {weather.relative_humidity_2m}% humidity</small></h3><p>{weatherAdvice(weather.temperature_2m)}</p><small>Open-Meteo · {weather.time} IST · WMO code {weather.weather_code}</small></div>}
                </ExpandDetails>}

                <div className="notice">Footpath quality, crossings, shade and wheelchair access are not verified. This is not a safety rating.</div>
                <button className="text-button" onClick={()=>{if(!('speechSynthesis'in window)){setMessage('Speech is unavailable in this browser.');return;}speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(active.steps.join('. '));u.lang='en-IN';speechSynthesis.speak(u);}}>◖ Read directions</button>
                <button className="text-button" onClick={()=>globalThis.speechSynthesis?.cancel()}>Stop speech</button>
                <ol ref={directionsList} tabIndex={-1} aria-label="Walking directions" className="directions">{active.steps.map((s,i)=><li key={i}>{s}</li>)}</ol>
              </section>}
              
              <RouteAssistant key={active?routeStamp.current+'-'+selected:'none'} route={active} rate={()=>setTab('reports')}/>
              <details className="app-details"><summary>Accessibility & feature availability</summary><p>Verified wheelchair routing, nearby facility discovery, live position tracking and Visual AI are not implemented. Spoken instructions read the returned route; they are not automatic turn alerts.</p></details>
            </>}

            {tab==='activities'&&<>
              <Activities pref={preference} change={changePreference}/>
              <Reminders/>
              <SavedWalks from={from} to={to} restore={restore}/>
            </>}

            {tab==='safety'&&<>
              <h3>Your safety, your control.</h3>
              <GuardianSOS 
                emergencyNumber={emergency} 
                contactNumber={contact} 
                onEmergencyAlert={sendEmergencyAlert} 
              />

              {/* --- ANIMATED LIVE SHARING UI --- */}
              <div style={{ marginTop: '20px' }}>
                <AnimatePresence initial={false} mode="wait">
                  {!sharingLive ? (
                    <motion.button
                      key="share-btn"
                      layoutId="share-card"
                      onClick={startLiveShare}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      style={{ 
                        width: '100%', padding: '16px', borderRadius: '16px', 
                        background: '#1890ff', color: 'white', fontSize: '16px', 
                        fontWeight: 'bold', border: 'none', cursor: 'pointer',
                        display: 'flex', justifyContent: 'center', gap: '8px'
                      }}
                    >
                      📍 Start Live Sharing
                    </motion.button>
                  ) : (
                    <motion.div
                      key="share-card"
                      layoutId="share-card"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      style={{ 
                        width: '100%', padding: '20px', background: '#151515', 
                        borderRadius: '24px', border: '1px solid #333' 
                      }}
                    >
                      <h3 style={{ fontSize: '16px', marginBottom: '10px', color: '#fff' }}>Live Location Active</h3>
                      <p style={{ fontSize: '12px', color: '#888', marginBottom: '15px' }}>
                        Anyone with this link can track your live journey in real-time.
                      </p>
                      
                      <div style={{ padding: '12px', background: '#222', borderRadius: '8px', border: '1px solid #444', marginBottom: '15px' }}>
                        <p style={{ fontSize: '11px', color: '#aaa', marginBottom: '5px' }}>Share this link:</p>
                        <a 
                          href={liveShareUrl || '#'} 
                          target="_blank" 
                          style={{ color: '#1890ff', fontSize: '12px', wordBreak: 'break-all' }}
                        >
                          {liveShareUrl}
                        </a>
                      </div>
                      
                      <button 
                        onClick={stopLiveShare} 
                        style={{ width: '100%', padding: '16px', borderRadius: '16px', background: '#ff4d4f', color: 'white', fontSize: '16px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
                      >
                        🛑 Stop Live Sharing
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <p>Configure numbers you trust. The app never calls or shares automatically.</p>
              <label>Emergency phone number<input type="tel" value={emergency} maxLength={20} placeholder="Enter your local emergency number" onChange={e=>setEmergency(e.target.value.replace(/[^+0-9]/g,''))}/></label>
              <label>Trusted contact phone number<input type="tel" value={contact} maxLength={20} placeholder="Include country code" onChange={e=>setContact(e.target.value.replace(/[^+0-9]/g,''))}/></label>
              <button className="button secondary full" disabled={!storageReady} onClick={()=>{if(save('rx-contact',contact)&&save('rx-emergency',emergency))setMessage('Contact numbers saved only on this browser.');}}>Save on this device</button>
              <div className="safety-actions">
                {emergency&&<a className="button" href={'tel:'+emergency}>Call emergency number ↗</a>}
                {contact&&<a className="button secondary" href={'tel:'+contact}>Call trusted contact ↗</a>}
                <button className="button secondary" onClick={()=>void share()}>Share selected start point ↗</button>
              </div>
              <p className="fine-print">Calling opens your device’s dialler. Sharing sends a fixed selected point, not a continuously updated location. This app does not contact emergency services for you.</p>
              <button className="text-button" onClick={()=>{if(save('rx-contact','')&&save('rx-emergency','')&&save('rx-reports','[]')){for(const key of ['rx-feedback-up','rx-feedback-down'])sessionStorage.removeItem(key);for(const key of ['rx-routines','rx-reminders','rx-saved-walks','rx-pace'])localStorage.removeItem(key);routeCache.current!.clear();setPreference({pace:'Walking',minutes:30});setFocus(null);setContact('');setEmergency('');setReports([]);setFrom(null);setTo(null);setRoutes([]);setWeather(null);version.current++;setMessage('Local contacts, routines, schedules, drafts and saved endpoints cleared.');}}}>Clear local personal data</button>
            </>}

            {tab==='reports'&&<ReportPanel point={from} route={active} reports={reports} ready={storageReady} notify={setMessage} view={viewPoint} save={rows=>{if(!save('rx-reports',JSON.stringify(rows)))return false;setReports(rows);return true;}}/>}
          </div>

          {embedded&&(from||to)&&<>
            <button className="button full" onClick={()=>{if(saveJourney(from,to))router.push('/app');else setMessage('This browser cannot transfer your selected places. Open the app and select them again.');}}>Continue this walk in app ↗</button>
            <p className="fine-print">Transfers the selected places in this tab only. They expire after five minutes and are removed when the app reads them.</p>
          </>}
          
          {!embedded&&<PlannerGuide select={setTab}/>}
          
          <div className="planner-footer">ROAD OBSERVATIONS · CHECK CONDITIONS ON SITE</div>
          <nav className="app-legal" aria-label="App legal"><Link href="/privacy">Privacy</Link><Link href="/disclaimer">Safety</Link><Link href="/accessibility">Accessibility</Link></nav>
        </aside>
      </div>
    </div>
  );
}

class MapCache extends Map<string,{expires:number;routes:WalkRoute[]}> {
  read(key:string){const entry=super.get(key);return entry && entry.expires>Date.now()?entry.routes:undefined;}
  put(key:string,routes:WalkRoute[]){if(this.size>=8)this.delete(this.keys().next().value!);this.set(key,{expires:Date.now()+60_000,routes});}
}