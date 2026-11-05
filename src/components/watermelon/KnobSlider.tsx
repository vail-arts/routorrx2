'use client';

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  useId,
} from 'react';
import {
  motion,
  MotionValue,
  useSpring,
  useTransform,
  motionValue,
} from 'motion/react';


const DIGIT_SPRING = {
  type: 'spring' as const,
  stiffness: 280,
  damping: 24,
  mass: 0.3,
};

function Digit({ value, place }: { value: number; place: number }) {
  const digit = Math.floor(value / place) % 10;
  const mv = useMemo(() => motionValue(digit), [digit]);
  const spring = useSpring(mv, DIGIT_SPRING);

  useEffect(() => {
    spring.set(digit);
  }, [digit, spring]);

  return (
    <div
      className="knob-digit"
      style={{ width: '0.6em' }}
    >
      <div className="digit-spacer">0</div>
      {Array.from({ length: 10 }, (_, i) => (
        <SlotDigit key={i} mv={spring} number={i} />
      ))}
    </div>
  );
}

function SlotDigit({
  mv,
  number,
}: {
  mv: MotionValue<number>;
  number: number;
}) {
  const id = useId();


  const y = useTransform(mv, (latest) => {

    const offset = (10 + number - (latest % 10)) % 10;
    let pos = offset * 100;
    if (offset > 5) pos -= 1000;
    return pos + "%";
  });

  return (
    <motion.span
      style={{ y }}
      layoutId={`${id}-${number}`}
      transition={DIGIT_SPRING}
      className="digit-slot"
    >
      {number}
    </motion.span>
  );
}

function SlidingNumber({ value, blur }: { value: number; blur: number }) {
  const str = Math.abs(value).toString();
  const int = parseInt(str, 10);
  const places = str.split('').map((_, i) => Math.pow(10, str.length - i - 1));

  return (
    <motion.div
      animate={{ filter: `blur(${blur}px)` }}
      transition={{ duration: 0.15 }}
      className="digits"
      style={{
        fontFamily: 'ui-rounded, SF Pro Rounded, system-ui, sans-serif',
      }}
    >
      {places.map((place, i) => (
        <Digit key={`${place}-${i}`} value={int} place={place} />
      ))}
    </motion.div>
  );
}

interface KnobSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: number;
}

export const KnobSlider: React.FC<KnobSliderProps> = ({
  value,
  onChange,
  min = 0,
  max = 100,
  size = 146,
}) => {
  const knobRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const [dragging, setDragging] = useState(false);

  const tickCount = 72;
  const innerSize = size * 0.68;

  const [prev, setPrev] = useState(value);
  const [blur, setBlur] = useState(0);
  if (prev !== value) {
    setBlur(dragging ? Math.min(10, Math.abs(value - prev)) : 0);
    setPrev(value);
  }

  const updateFromPointer = useCallback(
    (x: number, y: number) => {
      if (!knobRef.current) return;

      const rect = knobRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      let angle = (Math.atan2(y - cy, x - cx) * 180) / Math.PI + 90;
      if (angle < 0) angle += 360;

      const tickAngle = 360 / tickCount;
      const snappedAngle = Math.round(angle / tickAngle) * tickAngle;

      const percent = snappedAngle / 360;
      const newValue = Math.round(percent * (max - min) + min);

      onChange(newValue);
    },
    [min, max, onChange],
  );

  const currentAngle = ((value - min) / (max - min)) * 360;

  return (
    <div
      ref={knobRef}
      role="slider" tabIndex={0} aria-label="Preferred duration" aria-valuemin={min} aria-valuemax={max} aria-valuenow={value} aria-valuetext={value+' minutes'}
      onKeyDown={e=>{const next=({ArrowRight:value+1,ArrowUp:value+1,ArrowLeft:value-1,ArrowDown:value-1,Home:min,End:max} as Record<string,number>)[e.key];if(next!==undefined){e.preventDefault();onChange(Math.max(min,Math.min(max,next)));}}}
      onPointerMove={e=>{if(draggingRef.current)updateFromPointer(e.clientX,e.clientY)}}
      onLostPointerCapture={()=>{draggingRef.current=false;setDragging(false);setBlur(0)}}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        draggingRef.current = true;
        setDragging(true);
        updateFromPointer(e.clientX, e.clientY);
      }}
      className="duration-knob"
      style={{ width: size, height: size }}
    >
      <svg aria-hidden="true"
        viewBox="0 0 100 100"
        className="knob-ticks"
      >
        {Array.from({ length: tickCount }).map((_, i) => {
          const angle = (i * 360) / tickCount;
          return (
            <line
              key={i}
              x1="50"
              y1="4"
              x2="50"
              y2="9"
              transform={`rotate(${angle} 50 50)`}
              stroke="currentColor"
              strokeWidth="0.7"
              strokeLinecap="round"
              opacity="0.7"
            />
          );
        })}
      </svg>

      <div
        className="knob-hand"
        style={{ transform: `rotate(${currentAngle}deg)` }}
      >
        <div
          className="knob-tip"
          style={{
            top: size * 0.12,
            borderLeftWidth: size * 0.025,
            borderRightWidth: size * 0.025,
            borderBottomWidth: size * 0.045,
            borderStyle: 'solid',
          }}
        />
      </div>

      <div
        aria-hidden="true" className="knob-disc"
        style={{
          width: innerSize,
          height: innerSize,
        }}
      >

        <div
          className="text-muted-foreground"
          style={{ fontSize: innerSize * 0.28 }}
        >
          <SlidingNumber value={value} blur={blur} />
        </div>
      </div>
    </div>
  );
};
