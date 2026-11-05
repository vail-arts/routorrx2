'use client';
import {useEffect,useState} from 'react';

export function useDeviceList<T>(key:string,initial:T[],valid:(value:unknown)=>value is T){
  const [items,setItems]=useState<T[]>(initial);
  const [ready,setReady]=useState(false);
  const [error,setError]=useState('');
  useEffect(()=>{
    try{const stored=localStorage.getItem(key);if(stored){const rows:unknown=JSON.parse(stored);if(Array.isArray(rows))setItems(rows.filter(valid).slice(0,30));}}
    catch{setError('Device storage is unavailable. Changes last for this visit.');}
    setReady(true);
  },[key,valid]);
  function save(next:T[]){
    if(!ready)return;
    setItems(next);
    try{localStorage.setItem(key,JSON.stringify(next));}catch{setError('Device storage is unavailable. Changes last for this visit.');}
  }
  return {items,save,ready,error};
}
