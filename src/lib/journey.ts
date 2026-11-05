import type {Place} from './core';
import {isPlace,record} from './validation';
const KEY='rx-journey-handoff';
/** Explicit one-time, same-tab transfer; never stores routes, contacts or a history. */
export function saveJourney(from:Place|null,to:Place|null):boolean{
 try{sessionStorage.setItem(KEY,JSON.stringify({from,to,expires:Date.now()+5*60*1000}));return true;}catch{return false;}
}
export function takeJourney():{from:Place|null;to:Place|null}|null{
 try{const raw=sessionStorage.getItem(KEY);sessionStorage.removeItem(KEY);if(!raw)return null;const data:unknown=JSON.parse(raw);if(!record(data)||typeof data.expires!=='number'||data.expires<Date.now()||data.expires>Date.now()+300000)return null;if(data.from!==null&&!isPlace(data.from)||data.to!==null&&!isPlace(data.to))return null;return {from:data.from as Place|null,to:data.to as Place|null};}catch{return null;}
}
