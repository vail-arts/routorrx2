'use client';
import {useEffect,useState} from 'react';
export type MapTheme='light'|'dark'|'auto';
const KEY='rx-map-theme';const valid=(x:unknown):x is MapTheme=>['light','dark','auto'].includes(String(x));
export default function useMapTheme(){const [theme,setTheme]=useState<MapTheme>('auto');const [dark,setDark]=useState(false);
 useEffect(()=>{const media=matchMedia('(prefers-color-scheme: dark)');const read=()=>{let value:unknown;try{value=localStorage.getItem(KEY);}catch{}const t=valid(value)?value:'auto';setTheme(t);setDark(t==='dark'||t==='auto'&&media.matches);};read();addEventListener('storage',read);addEventListener('rx-map-theme',read);media.addEventListener('change',read);return()=>{removeEventListener('storage',read);removeEventListener('rx-map-theme',read);media.removeEventListener('change',read);};},[]);
 const update=(value:MapTheme)=>{setTheme(value);setDark(value==='dark'||value==='auto'&&matchMedia('(prefers-color-scheme: dark)').matches);try{localStorage.setItem(KEY,value);}catch{}dispatchEvent(new Event('rx-map-theme'));};
 return {theme,dark,update};
}
