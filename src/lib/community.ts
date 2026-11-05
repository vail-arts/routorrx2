import type {CommunityReport,PageResult,ReportDraft} from '@/types/api';
import {requestJSON} from './api';
import {record,isPlace,isRating} from './validation';

export const communityEnabled = process.env.NEXT_PUBLIC_COMMUNITY_ENABLED === 'true';
export const analysisEnabled = process.env.NEXT_PUBLIC_PHOTO_ANALYSIS_ENABLED === 'true';

const short=(v:unknown,max:number)=>typeof v==='string'&&v.trim().length>0&&v.length<=max;

export async function listReports(routeId?:string,cursor?:string,signal?:AbortSignal):Promise<PageResult<CommunityReport>>{
 const query=new URLSearchParams({limit:'10',area:'silvassa'});
 if(routeId)query.set('routeId',routeId);
 if(cursor)query.set('cursor',cursor);
 const result=await requestJSON('reports?'+query,undefined,signal);
 if(!record(result)||!(result.nextCursor===null||short(result.nextCursor,500))||!Array.isArray(result.items)||result.items.length>10||
 !result.items.every(r=>record(r)&&short(r.id,100)&&short(r.type,80)&&short(r.note,500)&&isPlace(r.point)&&short(r.created,50)&&Number.isFinite(Date.parse(String(r.created)))&&
 (r.status==='published'||r.status==='verified')&&(!routeId||r.routeId===routeId)&&(r.rating===undefined||isRating(r.rating))))throw new Error('Unreadable community reports. Please retry.');
 return result as unknown as PageResult<CommunityReport>;
}

export async function submitReport(draft:ReportDraft,signal:AbortSignal){
 const {id,type,note,point,rating,routeId,photo}=draft;
 const receipt=await requestJSON('reports',{clientId:id,type,note,point,rating,routeId,photo},signal,'include');
 if(!record(receipt)||!short(receipt.id,100)||receipt.status!=='pending')throw new Error('Submission could not be confirmed. Retry with the same draft.');
}

// Notice the arguments: photo, lat, lon, signal.
export async function analyzePhoto(photo: string, lat: number, lon: number, signal: AbortSignal): Promise<string> {
  // @ts-ignore
  const data: any = await requestJSON('reports/analyze', { photo, lat, lon }, signal, 'include');

  if (!data || !data.observation) {
    throw new Error('Photo analysis unavailable.');
  }

  let obs = data.observation;

  if (typeof obs === 'string') {
    try {
      const cleanText = obs.replace(/```(?:json)?/gi, "").trim();
      obs = JSON.parse(cleanText);
    } catch (e) {
      return String(obs);
    }
  }

  if (typeof obs === 'object' && obs !== null) {
    let finalString = '';
    if (obs.condition) finalString += `Condition: ${obs.condition}\n\n`;

    if (Array.isArray(obs.observations) && obs.observations.length > 0) {
      finalString += obs.observations.map((item: any) => {
        const title = item.title || 'Hazard';
        const desc = item.description || '';
        const sev = (item.severity || 'moderate').toUpperCase();
        return `• [${sev}] ${title}: ${desc}`;
      }).join('\n');
    } else {
      finalString += "No specific hazards observed.";
    }
    return finalString.trim() || "Analysis complete.";
  }

  return "Analysis complete.";
}