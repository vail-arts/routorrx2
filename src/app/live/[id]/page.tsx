'use client';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

const LiveMapViewer = dynamic(() => import('@/components/LiveMapViewer'), { ssr: false });

export default function LiveViewerPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  if (!lat || !lon) {
    return <div style={{ color: 'white', padding: '20px' }}>Waiting for location data...</div>;
  }

  return (
    <div style={{ height: '100dvh', width: '100vw', background: '#000' }}>
      <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 1000, background: '#111', padding: '12px 20px', borderRadius: '12px', border: '1px solid #333' }}>
        <h1 style={{ fontSize: '16px', color: '#fff', margin: 0 }}>routorrX <span style={{ color: '#4caf50' }}>Live Tracking</span></h1>
        <p style={{ fontSize: '11px', color: '#aaa', margin: 0 }}>Watching location...</p>
      </div>
      <LiveMapViewer lat={parseFloat(lat)} lon={parseFloat(lon)} />
    </div>
  );
}