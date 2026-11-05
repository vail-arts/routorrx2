import "leaflet/dist/leaflet.css";
import type { Metadata, Viewport } from 'next';
import './globals.css';import Effects from '@/components/Effects';import MotionSettings from '@/components/MotionSettings';
export const metadata:Metadata={title:{default:'routorrX V2 — Intelligence Beyond Imagination',template:'%s · routorrX'},description:'A more considered way to walk. Pedestrian navigation, personal safety tools and an accessible city vision, starting in Silvassa.',manifest:'/manifest.webmanifest',icons:{icon:'/icon.svg',apple:'/icon-192.png'}};
export const viewport:Viewport={width:'device-width',initialScale:1,themeColor:'#080808'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en" data-scroll-behavior="smooth"><body><Effects/><a className="skip" href="#main">Skip to content</a><MotionSettings>{children}</MotionSettings></body></html>}
