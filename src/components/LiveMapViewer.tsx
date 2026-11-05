'use client';
import { useEffect, useRef } from 'react';
import * as ml from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export default function LiveMapViewer({ lat, lon }: { lat: number, lon: number }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<ml.Map | null>(null);
  const marker = useRef<ml.Marker | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // --- ADDED THESE TWO LINES TO FIX THE WORKER ERROR ---
    ml.setWorkerUrl('/vendor/maplibre-gl-worker.mjs');
    ml.setWorkerCount(1);
    // -----------------------------------------------------
    
    map.current = new ml.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: [lon, lat],
      zoom: 16,
    });

    const el = document.createElement('div');
    el.className = 'user-location-dot';
    marker.current = new ml.Marker({ element: el }).setLngLat([lon, lat]).addTo(map.current);

    return () => {
      map.current?.remove();
    };
  }, []); // Empty dependency array so it only runs once

  // Update map when coordinates change (for live tracking)
  useEffect(() => {
    if (map.current && marker.current) {
      map.current.flyTo({ center: [lon, lat], zoom: 16 });
      marker.current.setLngLat([lon, lat]);
    }
  }, [lat, lon]);

  return <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />;
}