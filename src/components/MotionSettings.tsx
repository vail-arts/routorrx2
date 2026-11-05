'use client';
import {MotionConfig} from 'motion/react';
export default function MotionSettings({children}:{children:React.ReactNode}){return <MotionConfig reducedMotion="user">{children}</MotionConfig>;}
