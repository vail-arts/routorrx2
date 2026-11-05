'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { supabase } from '@/lib/supabase';

// Fix for default Leaflet marker icons in Next.js
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function SafetyMap() {
  const [hazards, setHazards] = useState<any[]>([]);
  const [center, setCenter] = useState<[number, number]>([20.27, 73.0]); // Default to Silvassa

  useEffect(() => {
    // 1. Get user location for the map center
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setCenter([pos.coords.latitude, pos.coords.longitude]);
      });
    }

    // 2. Fetch hazards from Supabase
    async function fetchHazards() {
      const { data, error } = await supabase.from('road_hazards').select('*');
      if (data) setHazards(data);
      if (error) console.error("Error fetching hazards:", error);
    }
    fetchHazards();
  }, []);

  return (
    <div className="w-full h-[500px] rounded-xl overflow-hidden shadow-lg border border-gray-200 relative z-0">
      <MapContainer center={center} zoom={15} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Render the Hazards */}
        {hazards.map((hazard) => {
          // Skip if we didn't get GPS properly
          if (!hazard.latitude || !hazard.longitude) return null;

          return (
            <Marker 
              key={hazard.id} 
              position={[hazard.latitude, hazard.longitude]}
              icon={icon}
            >
              <Popup>
                <div className="text-sm">
                  <strong>{hazard.condition}</strong>
                  <p className="text-xs text-gray-500 mt-1">Status: {hazard.status}</p>
                  <ul className="mt-2 list-disc pl-4">
                    {hazard.observations?.map((obs: any, i: number) => (
                      <li key={i} className="text-xs">
                        <span className="font-bold text-red-500">[{obs.severity}]</span> {obs.title}
                      </li>
                    ))}
                  </ul>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}