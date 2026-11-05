import { NextRequest, NextResponse } from 'next/server';
import { Budget, decodePolyline, point, withinCity } from '@/lib/core';
export const runtime='nodejs';
const budget=new Budget();
const searches=new Map<string,{expires:number;data:unknown}>();
const reply=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{'Cache-Control':'no-store'}});
async function upstream(url:string,init?:RequestInit){const r=await fetch(url,{...init,cache:'no-store',signal:AbortSignal.timeout(10000)});if(!r.ok)throw new Error('The map service is unavailable. Please try later.');return r.json();}
export async function POST(req:NextRequest,{params}:{params:Promise<{service:string}>}){
 const {service}=await params;
 if(!['search','route','weather'].includes(service))return reply({error:'This feature is not connected. No AI requests are made.'},503);
 const origin=req.headers.get('origin');
 let sameOrigin=false;try{sameOrigin=!!origin&&new URL(origin).host===req.headers.get('host')&&['http:','https:'].includes(new URL(origin).protocol);}catch{}
 if(!sameOrigin)return reply({error:'Request origin not allowed.'},403);
 if(Number(req.headers.get('content-length')||0)>4096)return reply({error:'Request too large.'},413);
 try{
 const raw=await req.text();if(raw.length>4096)return reply({error:'Request too large.'},413);
 const b=JSON.parse(raw);
 if(process.env.NODE_ENV==='production'&&process.env.SERVICES_ENABLED!=='true')return reply({error:'Live services await operator configuration. See the deployment handoff.'},503);
 const configured=Number(process.env.DAILY_REQUEST_LIMIT??200);
 budget.take(service,Date.now(),Number.isFinite(configured)?Math.min(2000,Math.max(0,configured)):0);
 if(service==='search'){
 const q=String(b.query||'').trim();if(q.length<3||q.length>120)return reply({error:'Enter between 3 and 120 characters.'},400);
 const cached=searches.get(q.toLowerCase());if(cached&&cached.expires>Date.now())return reply(cached.data);
 const url=new URL(process.env.GEOCODER_URL||'https://nominatim.openstreetmap.org/search');url.search=new URLSearchParams({q,format:'jsonv2',limit:'5',viewbox:'72.85,20.40,73.15,20.10',bounded:'1'}).toString();
 const data=await upstream(url.toString(),{headers:{'User-Agent':process.env.PROVIDER_USER_AGENT||'routorrX-local-development/0.1'}});
 const places=data.map((p:{display_name:string;lat:string;lon:string})=>({name:p.display_name,lat:Number(p.lat),lon:Number(p.lon)}));
 if(searches.size>=100)searches.delete(searches.keys().next().value!);searches.set(q.toLowerCase(),{expires:Date.now()+300000,data:places});return reply(places);
 }
 if(service==='weather'){
 const p=point(b.point);const url=new URL(process.env.WEATHER_URL||'https://api.open-meteo.com/v1/forecast');url.search=new URLSearchParams({latitude:String(p.lat),longitude:String(p.lon),current:'temperature_2m,relative_humidity_2m,weather_code',timezone:'Asia/Kolkata'}).toString();const d=await upstream(url.toString());return reply(d.current);
 }
 const from=point(b.from),to=point(b.to);if(!withinCity(from,to))return reply({error:'This pilot supports walks under 30 km.'},400);
 const routeURL=process.env.VALHALLA_URL||(process.env.NODE_ENV==='development'?'https://valhalla1.openstreetmap.de/route':'');
 if(!routeURL)return reply({error:'Walking routes need a Valhalla endpoint. Your operator must set VALHALLA_URL; no route has been fabricated.'},503);
 const data=await upstream(routeURL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({locations:[{lat:from.lat,lon:from.lon},{lat:to.lat,lon:to.lon}],costing:'pedestrian',alternates:2,units:'kilometers',language:'en-US'})});
 const trips=[data.trip,...(data.alternates||[]).map((a:{trip:unknown})=>a.trip)].filter(Boolean);
 return reply(trips.map(t=>({distance:t.summary.length,duration:t.summary.time,coordinates:t.legs.flatMap((l:{shape:string})=>decodePolyline(l.shape)),steps:t.legs.flatMap((l:{maneuvers:{instruction:string}[]})=>l.maneuvers.map(m=>m.instruction))})));
 }catch(e){const message=e instanceof Error?e.message:'Request failed';return reply({error:message.includes('budget')||message.includes('wait')?message:'Unable to complete this request. Check your input, connection and provider configuration.'},message.includes('budget')||message.includes('wait')?429:400);}
}
