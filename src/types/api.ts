import type {Place,WalkRoute} from '@/lib/core';
export type {Place,WalkRoute};
export interface Weather {temperature_2m:number;relative_humidity_2m:number;time:string;weather_code:number}
export interface ReportDraft {id:string;type:string;note:string;point:Place;created:string;status:'Unverified local draft';photo?:string;rating?:number;routeId?:string}
export interface CommunityReport {id:string;type:string;note:string;point:Place;created:string;status:'published'|'verified';rating?:number;routeId?:string}
export interface Session {user:{id:string;displayName:string}|null}
export interface ApiError {error:string;code?:string;requestId?:string}
export interface PageResult<T> {items:T[];nextCursor:string|null}
export interface ServiceMap {assistant:{request:{question:string;route:Pick<WalkRoute,'distance'|'duration'|'steps'>;reportIds?:string[]};response:{answer:string}};search:{request:{query:string};response:Place[]};route:{request:{from:Place|null;to:Place|null};response:WalkRoute[]};weather:{request:{point:Place|null};response:Weather}}
