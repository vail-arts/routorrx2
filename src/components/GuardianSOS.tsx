'use client';
import { useState, useEffect, useRef } from 'react';

export default function GuardianSOS({ 
  emergencyNumber, 
  contactNumber,
  onEmergencyAlert // NEW: Triggers the SMS sending
}: { 
  emergencyNumber: string, 
  contactNumber: string,
  onEmergencyAlert: (message: string) => void
}) {
  const [sosState, setSosState] = useState<'idle' | 'countdown' | 'active'>('idle');
  const [countdown, setCountdown] = useState(3);
  const [location, setLocation] = useState<{ lat: number, lon: number } | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [fallDetectionEnabled, setFallDetectionEnabled] = useState(false);

  // --- 1. FALL DETECTION LOGIC ---
  useEffect(() => {
    if (!fallDetectionEnabled) return;
    let isFreefall = false;
    function handleMotion(event: DeviceMotionEvent) {
      const acc = event.accelerationIncludingGravity;
      if (!acc || acc.z === null) return;
      const z = Math.abs(acc.z);
      if (z < 2.5 && !isFreefall) isFreefall = true;
      if (z > 25 && isFreefall) {
        isFreefall = false;
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
        triggerFallPrompt();
      }
      if (z >= 2.5 && z <= 25) isFreefall = false;
    }
    if (typeof window !== 'undefined' && window.DeviceMotionEvent) {
      if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
        (DeviceMotionEvent as any).requestPermission().then((p: string) => { if (p === 'granted') window.addEventListener('devicemotion', handleMotion); }).catch(console.error);
      } else {
        window.addEventListener('devicemotion', handleMotion);
      }
    }
    return () => { if (typeof window !== 'undefined') window.removeEventListener('devicemotion', handleMotion); };
  }, [fallDetectionEnabled]);

  // --- 2. COUNTDOWN TIMER ---
  useEffect(() => {
    if (sosState === 'countdown') {
      if (countdown > 0) {
        timerRef.current = setTimeout(() => setCountdown(c => c - 1), 1000);
      } else {
        setSosState('active');
        // Trigger the alert automatically
        const mapLink = location ? `https://www.google.com/maps?q=${location.lat},${location.lon}` : 'Location unavailable';
        onEmergencyAlert(`EMERGENCY: I need help. My location is: ${mapLink}`);
      }
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [sosState, countdown, location, onEmergencyAlert]);

  // --- 3. HELPERS & ACTIONS ---
  function getLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        (err) => console.warn("SOS Location error:", err),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }

  function triggerFallPrompt() {
    setSosState('countdown');
    setCountdown(3);
    getLocation();
  }

  function triggerManualSOS() {
    setSosState('countdown');
    setCountdown(3);
    getLocation();
  }

  function cancelSOS() {
    setSosState('idle');
    if (timerRef.current) clearTimeout(timerRef.current);
  }

  function resolveSOS() {
    setSosState('idle');
  }

  return (
    <>
      {/* FULL SCREEN OVERLAY */}
      {sosState !== 'idle' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#090909', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'sans-serif' }}>
          
          {sosState === 'countdown' && (
            <div style={{ textAlign: 'center', width: '100%', maxWidth: '350px' }}>
              <div style={{ margin: '0 auto 30px', width: '64px', height: '64px', background: 'rgba(255,77,79,0.1)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,77,79,0.3)' }}>
                <span style={{ fontSize: '32px' }}>⚠️</span>
              </div>
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '10px' }}>Activate SOS?</h2>
              <p style={{ color: '#aaa', fontSize: '15px', marginBottom: '40px', lineHeight: '1.5' }}>This will alert your trusted contacts, share your live location, and show emergency options.</p>
              
              <div style={{ position: 'relative', width: '140px', height: '140px', margin: '0 auto 50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid #ff4d4f', opacity: 0.3 }}></div>
                <div style={{ position: 'absolute', inset: 10, borderRadius: '50%', border: '2px solid #ff4d4f', opacity: 0.6 }}></div>
                <div style={{ width: '100px', height: '100px', background: '#111', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(255,77,79,0.2)' }}>
                  <span style={{ fontSize: '36px', fontWeight: 'bold', color: '#ff4d4f' }}>{countdown}</span>
                  <span style={{ fontSize: '12px', color: '#aaa' }}>seconds</span>
                </div>
              </div>

              <button onClick={() => { setSosState('active'); const mapLink = location ? `https://www.google.com/maps?q=${location.lat},${location.lon}` : 'Location unavailable'; onEmergencyAlert(`EMERGENCY: I need help. My location is: ${mapLink}`); }} style={{ width: '100%', background: '#ff4d4f', color: 'white', padding: '18px', fontSize: '16px', fontWeight: 'bold', borderRadius: '16px', border: 'none', cursor: 'pointer', marginBottom: '15px' }}>
                Send SOS Now →
              </button>
              <button onClick={cancelSOS} style={{ width: '100%', background: '#222', color: '#fff', padding: '18px', fontSize: '16px', fontWeight: 'bold', borderRadius: '16px', border: 'none', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          )}

          {sosState === 'active' && (
            <div style={{ textAlign: 'center', width: '100%', maxWidth: '350px' }}>
              <div style={{ margin: '0 auto 30px', width: '64px', height: '64px', background: 'rgba(255,77,79,0.1)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '32px' }}>🚨</span>
              </div>
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#ff4d4f', marginBottom: '10px' }}>SOS Active</h2>
              <p style={{ color: '#aaa', fontSize: '15px', marginBottom: '30px' }}>Your trusted contacts have been alerted and can see your live location.</p>

              <div style={{ background: '#141414', borderRadius: '16px', padding: '20px', textAlign: 'left', marginBottom: '30px', border: '1px solid #333' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '14px' }}>
                  <span style={{ color: '#aaa' }}>Alert sent to contacts</span>
                  <span style={{ color: '#4caf50' }}>✓</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '14px' }}>
                  <span style={{ color: '#aaa' }}>Live location sharing</span>
                  <span style={{ color: '#4caf50' }}>✓</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: '#aaa' }}>Emergency options ready</span>
                  <span style={{ color: '#4caf50' }}>✓</span>
                </div>
              </div>

              <a href={`tel:${emergencyNumber}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', background: '#ff4d4f', color: 'white', padding: '18px', fontSize: '16px', fontWeight: 'bold', borderRadius: '16px', textDecoration: 'none', marginBottom: '15px' }}>
                📞 Call {emergencyNumber}
              </a>
              <button onClick={resolveSOS} style={{ width: '100%', background: 'transparent', color: '#aaa', padding: '18px', fontSize: '16px', fontWeight: 'bold', borderRadius: '16px', border: '1px solid #444', cursor: 'pointer' }}>
                ✓ I'm Safe
              </button>
            </div>
          )}
        </div>
      )}

      {/* INLINE SAFETY TAB UI */}
      <div style={{ marginTop: '20px', padding: '24px', border: '1px solid #333', borderRadius: '24px', background: '#111', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>SOS & Safety</h3>
                <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>SOS & Safety</h3>
        
        {/* --- ADD THIS TEST BUTTON --- */}
        <button 
          onClick={triggerFallPrompt} 
          style={{ fontSize: '10px', background: '#333', color: '#fff', padding: '4px 8px', borderRadius: '4px', border: 'none', marginBottom: '10px' }}
        >
          [Dev] Force Fall
        </button>
        {/* ---------------------------- */}

        <p style={{ color: '#888', fontSize: '13px', marginBottom: '24px', textAlign: 'center' }}>Quick help, trusted contacts, and real-time location sharing when you need it most.</p>
        <p style={{ color: '#888', fontSize: '13px', marginBottom: '24px', textAlign: 'center' }}>Quick help, trusted contacts, and real-time location sharing when you need it most.</p>

        <button 
          onClick={triggerManualSOS}
          style={{ 
            width: '120px', height: '120px', borderRadius: '50%', 
            background: 'radial-gradient(circle, #ff4d4f 0%, #cc0000 100%)', 
            color: 'white', fontSize: '24px', fontWeight: '900', 
            border: '8px solid #222', cursor: 'pointer', 
            boxShadow: '0 0 30px rgba(255, 77, 79, 0.4)',
            marginBottom: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          SOS
        </button>

        <label 
          htmlFor="fall-toggle" 
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: '#1a1a1a', padding: '16px', borderRadius: '16px', cursor: 'pointer', border: '1px solid #333' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '18px' }}>🛡️</span>
            <span style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>Fall Detection</span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <input type="checkbox" id="fall-toggle" checked={fallDetectionEnabled} onChange={(e) => setFallDetectionEnabled(e.target.checked)} style={{ display: 'none' }} />
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: fallDetectionEnabled ? '2px solid #ff4d4f' : '2px solid #555', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {fallDetectionEnabled && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff4d4f" strokeWidth="4"><polyline points="20 6 9 17 4 12"></polyline></svg>}
            </div>
          </div>
        </label>

      </div>
    </>
  );
}