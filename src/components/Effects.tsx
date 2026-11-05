'use client';
import dynamic from 'next/dynamic';
const Metal=dynamic(()=>import('./LiquidMetal'),{ssr:false});
export default function Effects(){return <Metal/>}
