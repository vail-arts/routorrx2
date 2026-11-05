export type Place = {name:string; lat:number; lon:number};
export type WalkRoute = {
  id?:string;
  distance:number; 
  duration:number; 
  coordinates:[number,number][]; 
  steps:string[];
  hazards?: any[]; // <--- ADDED THIS LINE
};

export function point(value:unknown): Place {
 const p=value as Place;
 if(!p || !Number.isFinite(p.lat)||!Number.isFinite(p.lon)||Math.abs(p.lat)>90||Math.abs(p.lon)>180) throw new Error('Choose a valid location.');
 return {lat:p.lat,lon:p.lon,name:String(p.name||'Selected location').slice(0,160)};
}

export function withinCity(a:Place,b:Place){return Math.hypot((a.lat-b.lat)*111,(a.lon-b.lon)*104)<30;}

export function decodePolyline(str:string):[number,number][]{
 let i=0,lat=0,lon=0; const points:[number,number][]=[];
 while(i<str.length){const read=()=>{let result=0,shift=0,byte; do {if(i>=str.length||shift>30)throw new Error('Invalid route geometry');byte=str.charCodeAt(i++)-63;result|=(byte&31)<<shift;shift+=5;}while(byte>=32);return result&1?~(result>>1):result>>1;};lat+=read();lon+=read();points.push([lon/1e6,lat/1e6]);}return points;
}

export function weatherAdvice(temp:number){return temp>=35?'High heat: carry water, take breaks and consider a cooler time to walk.':temp>=28?'Warm conditions: carry water and take shade breaks.':'Check local conditions before setting off.';}

export class Budget {
 private calls=0; private window=0; private last:Record<string,number>={};
 take(service:string,now:number,limit=200){if(now-this.window>=86400000){this.calls=0;this.window=now;}if(this.calls>=limit)throw new Error('Daily service budget reached. Try again tomorrow.');if(now-(this.last[service]||0)<1100)throw new Error('Please wait a moment before trying again.');this.last[service]=now;this.calls++;}
}