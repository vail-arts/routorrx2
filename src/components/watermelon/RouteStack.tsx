'use client';
import {motion} from 'motion/react';
import {speeds,type Preference} from '@/types/walk';
import type {WalkRoute} from '@/lib/core';

export function RouteStack({routes,selected,select,pref}:{routes:WalkRoute[];selected:number;select:(i:number)=>void;pref:Preference}){
  const times=routes.map(r=>r.distance/speeds[pref.pace]*60);
  const match=times.reduce((best,v,i)=>Math.abs(v-pref.minutes)<Math.abs(times[best]-pref.minutes)?i:best,0);
  
  // Define the 3 types based on the index (since our backend returns shortest, safer, accessible)
  const types = [
    { label: 'Shortest', icon: '🚶‍♂️' },
    { label: 'Safer', icon: '🛡️' },
    { label: 'Accessible', icon: '♿' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
      {routes.map((r, i) => {
        const isSelected = selected === i;
        const typeInfo = types[i] || { label: 'Alternative', icon: '🛣️' };
        
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
            {/* Left side: Icon and Type */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ 
                width: '48px', height: '48px', borderRadius: '50%', 
                background: isSelected ? '#fff' : '#222',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '24px',
                color: isSelected ? '#000' : '#fff' // Fix emoji color visibility on white bg
              }}>
                {typeInfo.icon}
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

            {/* Right side: Time and Hazards */}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff' }}>
                {Math.round(times[i])} <span style={{fontSize: '12px', color: '#aaa'}}>min</span>
              </div>
              
              {/* CHANGED HAZARD COLOR TO WHITE */}
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