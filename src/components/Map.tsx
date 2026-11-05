'use client';

import {memo, useEffect, useRef, useState} from 'react';
import * as ml from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import ContinuousTabs from './watermelon/ContinuousTabs';
import useMapTheme from '@/hooks/useMapTheme';
import type {Place, WalkRoute} from '@/lib/core';

const modes = [{id:'light',label:'Light'}, {id:'dark',label:'Dark'}, {id:'auto',label:'Auto'}] as const;
const attribution = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>';
const empty = {type:'FeatureCollection' as const, features:[]};
const base = process.env.NEXT_PUBLIC_MAP_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const light = process.env.NEXT_PUBLIC_MAP_LIGHT_TILE_URL;
const darkStyle = process.env.NEXT_PUBLIC_MAP_DARK_TILE_URL;

function Map({from,to,route,onPick,focus,frameRoute}:{frameRoute:number;from:Place|null;to:Place|null;route:WalkRoute|null;onPick:(p:Place)=>void;focus?:Place|null}) {
  const {theme,dark,update} = useMapTheme();
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<ml.Map|null>(null);
  const markers = useRef<(ml.Marker|null)[]>([null,null]);
  const userMarker = useRef<ml.Marker | null>(null);
  
  const currentPos = useRef<[number, number] | null>(null);
  const isFollowing = useRef(true);

  const pick = useRef(onPick);
  pick.current = onPick;
  const [ready,setReady] = useState(false);
  const [error,setError] = useState('');

  // --- LOCATE BUTTON FUNCTION ---
  function locateUser() {
    isFollowing.current = true; // Re-enable follow mode
    if (currentPos.current && map.current) {
      map.current.flyTo({
        center: currentPos.current,
        zoom: 16,
        duration: 1000
      });
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const lngLat: [number, number] = [pos.coords.longitude, pos.coords.latitude];
        currentPos.current = lngLat;
        if (map.current) {
          map.current.flyTo({ center: lngLat, zoom: 16, duration: 1000 });
        }
      }, (err) => alert("Could not get your location. Please allow location access."), { enableHighAccuracy: true, maximumAge: 0 });
    }
  }

  useEffect(() => {
    const host=container.current!;
    let instance: ml.Map;
    try {
      ml.setWorkerUrl('/vendor/maplibre-gl-worker.mjs');
      ml.setWorkerCount(1);
      instance = new ml.Map({container:host,center:[73.008,20.276],zoom:13,
        pixelRatio: Math.min(devicePixelRatio, 2), dragRotate:false, pitchWithRotate:false,
        style:{version:8,sources:{
          streets:{type:'raster',tiles:[base],tileSize:256,attribution:process.env.NEXT_PUBLIC_MAP_ATTRIBUTION||attribution},
          walk:{type:'geojson',data:empty}
        },layers:[{id:'streets',type:'raster',source:'streets'},
          {id:'walk',type:'line',source:'walk',layout:{'line-cap':'round','line-join':'round'},paint:{'line-width':5,'line-color':'#3b3b3b'}}]}});
    } catch {setError('Interactive map unavailable. Search and safety tools are still available.');return;}
    
    map.current=instance;
    instance.addControl(new ml.NavigationControl({showCompass:false}),'top-left');
    instance.on('style.load',()=>setReady(true));
    instance.on('error',()=>setError('Some map data could not load. Search and safety tools are still available.'));
    instance.on('click',({lngLat})=>pick.current({lon:lngLat.lng,lat:lngLat.lat,name:`Map point ${lngLat.lat.toFixed(4)}, ${lngLat.lng.toFixed(4)}`}));

    // Turn off follow mode if user drags map
    instance.on('dragstart', () => {
      isFollowing.current = false;
    });

    // Live GPS Tracking
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const lngLat: [number, number] = [pos.coords.longitude, pos.coords.latitude];
        currentPos.current = lngLat;

        // ONLY move the map if Follow Mode is active!
        if (instance && isFollowing.current) {
          instance.easeTo({ center: lngLat });
        }

        if (!userMarker.current) {
          const el = document.createElement('div');
          el.className = 'user-location-dot';
          userMarker.current = new ml.Marker({ element: el }).setLngLat(lngLat).addTo(instance);
        } else {
          userMarker.current.setLngLat(lngLat);
        }
      },
      (err) => console.warn("Live tracking error:", err),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );

    let frame=0;
    const observer=new ResizeObserver(()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>instance.resize());});
    observer.observe(host);
    
    const pins=markers.current;
    
    return ()=>{
      observer.disconnect();
      cancelAnimationFrame(frame);
      pins.forEach(pin=>pin?.remove());
      pins.fill(null);
      userMarker.current?.remove();
      userMarker.current = null;
      navigator.geolocation.clearWatch(watchId);
      instance.remove();
      map.current=null;
    };
  },[]);

  useEffect(()=>{
    const m=map.current;
    if(!ready||!m)return;
    [from,to].forEach((point,index)=>{
      const pin=markers.current[index];
      if(!point){pin?.remove();markers.current[index]=null;return;}
      if(pin)pin.setLngLat([point.lon,point.lat]);
      else markers.current[index]=new ml.Marker({color:index?'#3b3b3b':'#626262'}).setLngLat([point.lon,point.lat]).addTo(m);
    });
  },[ready,from,to]);

  useEffect(()=>{
    const m=map.current;
    if(!m||!ready)return;
    const src=m.getSource('walk') as ml.GeoJSONSource;
    src.setData(route?{type:'Feature',properties:{},geometry:{type:'LineString',coordinates:route.coordinates}}:empty);
  },[route,ready]);

  useEffect(()=>{
    const m=map.current;if(!m||!ready)return;
    const duration=matchMedia('(prefers-reduced-motion: reduce)').matches?0:260;
    
    // If there is a route, fit the map to the route (e.g., Mumbai to Delhi)
    if(route){
      const bounds=new ml.LngLatBounds();
      for(const pt of route.coordinates) bounds.extend(pt);
      m.fitBounds(bounds,{padding:40,maxZoom:16,duration});
      isFollowing.current = false; // STOP following the user so the map stays on the route!
    } 
    else if(to||from){
      const point=(to||from)!;
      m.easeTo({center:[point.lon,point.lat],duration});
    }
  },[from,to,route,ready,frameRoute]);

  useEffect(()=>{
    if(!ready||!focus)return;
    map.current?.easeTo({center:[focus.lon,focus.lat],zoom:16,duration:matchMedia('(prefers-reduced-motion: reduce)').matches?0:260});
  },[focus,ready]);

  useEffect(()=>{
    const m=map.current;
    if(!m||!ready)return;
    const url=(dark?darkStyle:light)||base;
    const streets=m.getSource('streets') as ml.RasterTileSource;
    if(streets.tiles?.[0]!==url)streets.setTiles([url]);
    const night=dark&&!darkStyle;
    m.setPaintProperty('streets','raster-brightness-min',night?.88:0);
    m.setPaintProperty('streets','raster-brightness-max',night?.055:1);
    m.setPaintProperty('streets','raster-saturation',night?-1:url===base?-.55:0);
    m.setPaintProperty('walk','line-color',dark?'#e5e5e5':'#3b3b3b');
  },[ready,dark]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* MAP CANVAS */}
      <div ref={container} className="live-map" role="region" aria-label="Interactive Silvassa map" style={{ width: '100%', height: '100%' }} />

      {/* THEME TOGGLE (Top Right) */}
      <div style={{ position: 'absolute', top: '16px', right: '12px', zIndex: 100 }}>
        <ContinuousTabs label="Map appearance" value={theme} onChange={update} items={modes}/>
      </div>
      
      {/* LOCATE ME BUTTON (Bottom Right) */}
            {/* LOCATE ME BUTTON (Bottom Right) */}
      <button 
        onClick={locateUser}
        title="Recenter location"
        aria-label="Recenter map to my location"
        className="group"
        style={{
          position: 'absolute', bottom: '100px', right: '20px', zIndex: 100,
          width: '44px', height: '44px', borderRadius: '12px',
          background: '#30243B', color: 'white', border: '1px solid rgba(255,255,255,0.1)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)', transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#453452'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = '#30243B'; }}
        onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.95)'; }}
        onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 64 64"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transition: 'transform 0.3s' }}
          aria-hidden="true"
        >
          <path d="M16 23a19 19 0 0 1 32 0M16 41a19 19 0 0 0 32 0" />
          <path d="M32 11v8M32 45v8M11 32h8M45 32h8" />
          <circle cx="32" cy="32" r="5" />
        </svg>
      </button>

      {error && (
        <p style={{ position: 'absolute', bottom: '20px', left: '20px', zIndex: 100, background: '#111', padding: '10px', borderRadius: '8px', color: '#ff4d4f', fontSize: '12px' }}>
          {error}
        </p>
      )}
    </div>
  );
}
export default memo(Map);