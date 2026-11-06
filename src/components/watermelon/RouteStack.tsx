'use client';
import {motion} from 'motion/react';
import {speeds,type Preference} from '@/types/walk';
import type {WalkRoute} from '@/lib/core';

// --- CUSTOM ICONS ---
const ShortestIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="url(#grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <defs>
      <linearGradient id="grad" x1="0" y1="0" x2="24" y2="24">
        <stop offset="0%" stopColor="#d8b4fe" />
        <stop offset="100%" stopColor="#7e22ce" />
      </linearGradient>
    </defs>
    <path d="M12 2a10 10 0 1 0 10 10" />
    <path d="M12 12l4-4" />
    <path d="M4 16h2M6 20h4M8 12h2" />
  </svg>
);

const SaferIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="url(#grad2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <defs>
      <linearGradient id="grad2" x1="0" y1="0" x2="24" y2="24">
        <stop offset="0%" stopColor="#d8b4fe" />
        <stop offset="100%" stopColor="#7e22ce" />
      </linearGradient>
    </defs>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

const AccessibleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="url(#grad3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <defs>
      <linearGradient id="grad3" x1="0" y1="0" x2="24" y2="24">
        <stop offset="0%" stopColor="#d8b4fe" />
        <stop offset="100%" stopColor="#7e22ce" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="5" r="2" />
    <path d="M12 7v6l4 4" />
    <path d="M8 13a4 4 0 1 0 4 4" />
  </svg>
);

export function RouteStack({routes,selected,select,pref}:{routes:WalkRoute[];selected:number;select:(i:number)=>void;pref:Preference}){
  const times=routes.map(r=>r.distance/speeds[pref.pace]*60);
  const match=times.reduce((best,v,i)=>Math.abs(v-pref.minutes)<Math.abs(times[best]-pref.minutes)?i:best,0);
  
  // Map the index to the specific icon and label
  const types = [
    { label: 'Shortest', Icon: ShortestIcon },
    { label: 'Safer', Icon: SaferIcon },
    { label: 'Accessible', Icon: AccessibleIcon }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
      {routes.map((r, i) => {
        const isSelected = selected === i;
        const typeInfo = types[i] || types[0];
        
        return (
          <motion.button 
            key={i} 
            onClick={() => select(i)}
            whileTap={{ scale: 0.98 }}
            style={{
              width: '100%',
              background: isSelected ? '#1a1a1a' : 'transparent',
              border: isSelected ? '1px solid #fff' : '1px solid #333',
              borderRadius: '20px',
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#fff',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ 
                width: '48px', height: '48px', borderRadius: '50%', 
                background: isSelected ? '#fff' : '#1a1a1a',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: isSelected ? 'none' : '1px solid #333'
              }}>
                <typeInfo.Icon />
              </div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: isSelected ? '#fff' : '#888', marginBottom: '4px' }}>
                  {typeInfo.label}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {r.distance.toFixed(2)} km · {Math.ceil(r.duration/60)} min
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff' }}>
                {Math.round(times[i])} <span style={{fontSize: '12px', color: '#aaa'}}>min</span>
              </div>
              
              {(r as any).hazards && (r as any).hazards.length > 0 && (
                <div style={{ color: '#ffffff', fontSize: '11px', marginTop: '6px', fontWeight: 'bold' }}>
                  ⚠️ {(r as any).hazards.length} Hazard{(r as any).hazards.length > 1 ? 's' : ''}
                </div>
              )}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}