import type {Place} from '@/lib/core';
export const speeds = {Walking:4.5, 'Brisk walking':5.5, Jogging:7, Running:9} as const;
export type Pace = keyof typeof speeds;
export type Preference = {pace:Pace;minutes:number};
export type Routine = {id:string;name:string;pinned:boolean;pace:Pace};
export interface Reminder {
  id: string;
  name: string;
  when: string;
  repeat: 'Once' | 'Daily' | 'Weekly';
  triggered?: boolean;
}
export type SavedWalk = {id:string;from:Place;to:Place};
