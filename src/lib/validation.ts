/** Runtime checks for data crossing provider/browser-storage boundaries. */
export const record=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
const number=(value:unknown)=>typeof value==='number'&&Number.isFinite(value);
const text=(value:unknown,max:number)=>typeof value==='string'&&value.length>0&&value.length<=max;
export function isPlace(value:unknown):boolean{return record(value)&&text(value.name,2000)&&number(value.lat)&&Math.abs(value.lat as number)<=90&&number(value.lon)&&Math.abs(value.lon as number)<=180;}
export function isRoute(value:unknown):boolean{
 if(!record(value)||(value.id!==undefined&&!text(value.id,180))||!number(value.distance)||(value.distance as number)<0||!number(value.duration)||(value.duration as number)<0)return false;
 return Array.isArray(value.coordinates)&&value.coordinates.length>=2&&value.coordinates.length<=50000&&value.coordinates.every(p=>Array.isArray(p)&&p.length===2&&number(p[0])&&Math.abs(p[0])<=180&&number(p[1])&&Math.abs(p[1])<=90)&&Array.isArray(value.steps)&&value.steps.length<=1000&&value.steps.every(s=>text(s,2000));
}
export function validResponse(service:string,value:unknown):boolean{
 if(service==='search')return Array.isArray(value)&&value.length<=50&&value.every(isPlace);
 if(service==='route')return Array.isArray(value)&&value.length<=10&&value.every(isRoute);
 if(service==='weather')return record(value)&&number(value.temperature_2m)&&number(value.relative_humidity_2m)&&(value.relative_humidity_2m as number)>=0&&(value.relative_humidity_2m as number)<=100&&text(value.time,50)&&number(value.weather_code);
 if(service==='assistant')return record(value)&&text(value.answer,6000)&&!!(value.answer as string).trim();
 return false;
}
export const isRating=(n:unknown)=>typeof n==='number'&&Number.isInteger(n)&&n>=1&&n<=5;
export const isPhoto=(p:unknown)=>typeof p==='string'&&p.length<=220000&&/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(p);
export function isDraft(value:unknown):boolean{return record(value)&&(value.photo===undefined||isPhoto(value.photo))&&(value.rating===undefined||isRating(value.rating))&&(value.routeId===undefined||text(value.routeId,180))&&text(value.id,100)&&text(value.type,80)&&text(value.note,500)&&isPlace(value.point)&&text(value.created,50)&&Number.isFinite(Date.parse(value.created as string))&&value.status==='Unverified local draft';}
