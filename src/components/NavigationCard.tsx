'use client';
import { useState, useId, useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { WalkRoute } from '@/lib/core';
import { getDistanceToNextTurn, getDistanceFromLatLonInM } from '@/lib/navigation';

export default function NavigationCard({ 
  active, 
  routes, 
  selected, 
  setSelected 
}: { 
  active: WalkRoute | null, 
  routes: WalkRoute[], 
  selected: number, 
  setSelected: (i: number) => void 
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [distanceToTurn, setDistanceToTurn] = useState<number | null>(null);
  const [isOnRoute, setIsOnRoute] = useState(false);
  
  const reduced = useReducedMotion();
  const id = useId();
  const lastSpokenStep = useRef<number>(-1);

  if (!active) return null;

  const idxShort = routes.findIndex(r => (r as any).type === 'shortest');
  const idxSafer = routes.findIndex(r => (r as any).type === 'safer');
  const idxAccess = routes.findIndex(r => (r as any).type === 'accessible');

  const tabs = [
    { id: 'shortest', label: 'Shortest', icon: '🚶‍♂️', route: routes[idxShort] || active, index: idxShort !== -1 ? idxShort : 0 },
    { id: 'safer', label: 'Safer', icon: '🛡️', route: routes[idxSafer] || active, index: idxSafer !== -1 ? idxSafer : 0 },
    { id: 'accessible', label: 'Accessible', icon: '♿', route: routes[idxAccess] || active, index: idxAccess !== -1 ? idxAccess : 0 }
  ];

  const activeTab = tabs.find(t => t.index === selected) || tabs[0];

  // --- LIVE GPS & VOICE TRACKING ENGINE ---
  useEffect(() => {
    if (!isNavigating) {
      lastSpokenStep.current = -1;
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const userLat = pos.coords.latitude;
        const userLon = pos.coords.longitude;

        // 1. FIND THE CLOSEST POINT ON THE ROUTE
        let minDistance = Infinity;
        let closestIndex = 0;
        activeTab.route.coordinates.forEach((coord, index) => {
          const dist = getDistanceFromLatLonInM(userLat, userLon, coord[1], coord[0]);
          if (dist < minDistance) {
            minDistance = dist;
            closestIndex = index;
          }
        });

        // 2. IF FAR AWAY, DON'T START YET
        if (minDistance > 50) {
          setIsOnRoute(false);
          setDistanceToTurn(minDistance);
          return;
        }

        // 3. WE ARE ON THE ROUTE! 
        setIsOnRoute(true);

        // Snap to the nearest step
        const stepRatio = closestIndex / activeTab.route.coordinates.length;
        const calculatedStep = Math.floor(stepRatio * activeTab.route.steps.length);
        if (calculatedStep > currentStep) setCurrentStep(calculatedStep);

        // Calculate distance to the end of the step
        const distance = getDistanceToNextTurn(
          userLat, userLon, 
          activeTab.route.coordinates, 
          currentStep, 
          activeTab.route.steps.length
        );
        setDistanceToTurn(distance);
      },
      (err) => console.warn("GPS error:", err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isNavigating, currentStep, activeTab]);

  // Speak the instructions (Only if we are on the route!)
  useEffect(() => {
    if (!isNavigating || !isOnRoute) return;

    if (lastSpokenStep.current !== currentStep) {
      const text = activeTab.route.steps[currentStep];
      if (text) {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'en-IN';
        u.rate = 0.95;
        window.speechSynthesis.speak(u);
        lastSpokenStep.current = currentStep;
      }
    }
  }, [isNavigating, currentStep, activeTab, isOnRoute]);

  const spring = reduced ? { duration: 0 } : { type: 'spring' as const, stiffness: 300, damping: 30 };

  return (
    <div style={{ position: 'relative', marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
      <AnimatePresence initial={false} mode="wait">
        {!isExpanded ? (
          <motion.button
            key="button" layoutId={id} onClick={() => setIsExpanded(true)} transition={spring}
            style={{ width: '100%', padding: '16px', borderRadius: '16px', background: '#4caf50', color: 'white', fontSize: '16px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
          >
            ▶ View Safe Route
          </motion.button>
        ) : (
          <motion.div
            key="card" layoutId={id} transition={spring}
            style={{ width: '100%', borderRadius: '24px', background: '#111', border: '1px solid #333', padding: '20px', overflow: 'hidden' }}
          >
            {!isNavigating ? (
              // --- ROUTE SELECTION UI ---
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div style={{ fontSize: '11px', color: '#888', fontWeight: 'bold', letterSpacing: '1px' }}>YOUR WALK</div>
                  <div style={{ background: 'rgba(76, 175, 80, 0.1)', color: '#4caf50', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', border: '1px solid rgba(76, 175, 80, 0.3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>✨</span> routorrX AI
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
                  {tabs.map((tab) => {
                    const isActive = activeTab.id === tab.id;
                    const time = Math.round(tab.route.distance * 12);
                    return (
                      <div 
                        key={tab.id} onClick={() => setSelected(tab.index)}
                        style={{ flex: 1, padding: '12px 6px', borderRadius: '12px', textAlign: 'center', cursor: 'pointer', background: isActive ? '#222' : 'transparent', border: '1px solid ' + (isActive ? '#444' : 'transparent'), transition: 'all 0.2s' }}
                      >
                        <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '4px' }}>{tab.icon} {tab.label}</div>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: isActive ? '#4caf50' : '#fff' }}>{time} min</div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
                  <div>
                    <div style={{ fontSize: '42px', fontWeight: 'bold', color: '#fff', lineHeight: '1' }}>
                      {Math.round(activeTab.route.distance * 12)} <span style={{fontSize:'20px', color:'#aaa'}}>min</span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#888', marginTop: '4px' }}>🚶‍♂️ {activeTab.route.distance.toFixed(1)} km</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#4caf50' }}>
                      {activeTab.id === 'safer' ? '95' : activeTab.id === 'shortest' ? '75' : '88'}<span style={{fontSize:'12px', color:'#aaa'}}>/100</span>
                    </div>
                    <div style={{ fontSize: '10px', color: '#888', letterSpacing: '1px' }}>WALKABILITY</div>
                  </div>
                </div>

                <div style={{ width: '100%', height: '4px', background: '#333', borderRadius: '2px', marginBottom: '20px' }}>
                  <div style={{ width: `${activeTab.id === 'safer' ? '95' : activeTab.id === 'shortest' ? '75' : '88'}%`, height: '100%', background: '#4caf50', borderRadius: '2px', transition: 'width 0.3s ease' }}></div>
                </div>

                <button onClick={() => { setIsNavigating(true); setCurrentStep(0); }} style={{ width: '100%', padding: '16px', borderRadius: '16px', background: '#4caf50', color: 'white', fontSize: '16px', fontWeight: 'bold', border: 'none', cursor: 'pointer', marginBottom: '10px' }}>
                  ▶ Start Navigation
                </button>
                <button onClick={() => setIsExpanded(false)} style={{ width: '100%', padding: '12px', borderRadius: '16px', background: 'transparent', color: '#aaa', fontSize: '14px', border: 'none', cursor: 'pointer' }}>
                  Close
                </button>
              </>
            ) : (
              // --- GOOGLE MAPS LIVE NAVIGATION UI ---
              <div style={{ textAlign: 'center' }}>
                
                {!isOnRoute ? (
                  // STATE: User is far away from the route
                  <div style={{ padding: '20px 0' }}>
                    <div style={{ fontSize: '48px', marginBottom: '10px' }}>🚶‍♂️</div>
                    <h2 style={{ fontSize: '20px', color: '#fff', marginBottom: '10px' }}>
                      You are {distanceToTurn ? Math.round(distanceToTurn) : '...'} meters away from the route.
                    </h2>
                    <p style={{ color: '#aaa', fontSize: '14px', marginBottom: '20px' }}>
                      Walk towards the blue line on the map to start turn-by-turn navigation.
                    </p>
                  </div>
                ) : (
                  // STATE: User is on the route
                  <>
                    <div style={{ fontSize: '64px', marginBottom: '10px', color: '#4caf50' }}>↰</div>
                    
                    {distanceToTurn !== null && (
                      <div style={{ fontSize: '20px', color: '#888', marginBottom: '5px' }}>
                        in {Math.round(distanceToTurn)} meters
                      </div>
                    )}

                    <h2 style={{ fontSize: '26px', color: '#fff', marginBottom: '10px', lineHeight: '1.3' }}>
                      {activeTab.route.steps[currentStep] || 'Arrived!'}
                    </h2>
                    <p style={{ color: '#4caf50', marginBottom: '20px', fontWeight: 'bold' }}>
                      Step {currentStep + 1} of {activeTab.route.steps.length}
                    </p>
                  </>
                )}
                
                {/* DEV BUTTON: Simulate walking */}
                {currentStep < activeTab.route.steps.length - 1 && (
                  <button onClick={() => setCurrentStep(c => c + 1)} style={{ width: '100%', padding: '12px', background: '#333', color: 'white', borderRadius: '12px', marginBottom: '10px', border: 'none' }}>
                    (Dev) Simulate Walking to Next Step
                  </button>
                )}

                <button onClick={() => { setIsNavigating(false); setCurrentStep(0); setDistanceToTurn(null); setIsOnRoute(false); window.speechSynthesis.cancel(); }} style={{ width: '100%', padding: '16px', borderRadius: '16px', background: '#ff4d4f', color: 'white', fontSize: '16px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>
                  Stop Navigation
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}