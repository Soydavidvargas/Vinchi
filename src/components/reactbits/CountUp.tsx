'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';

export interface CountUpProps {
  to: number;
  from?: number;
  durationMs?: number;
  formatter?: (value: number) => string;
  className?: string;
}

export function CountUp({
  to,
  from = 0,
  durationMs = 520,
  formatter = (val) => Math.round(val).toString(),
  className = '',
}: CountUpProps) {
  const shouldReduceMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState<number>(to);
  const currentRef = useRef<number>(from);
  const hasMountedRef = useRef<boolean>(false);

  useEffect(() => {
    if (shouldReduceMotion) {
      currentRef.current = to;
      setDisplayValue(to);
      return;
    }

    const startValue = hasMountedRef.current ? currentRef.current : from;
    hasMountedRef.current = true;

    if (startValue === to) {
      setDisplayValue(to);
      return;
    }

    let rafId = 0;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      // Cubic ease-out settling curve
      const eased = 1 - Math.pow(1 - progress, 3);
      const nextValue = startValue + (to - startValue) * eased;
      currentRef.current = nextValue;
      setDisplayValue(nextValue);

      if (progress < 1) {
        rafId = window.requestAnimationFrame(tick);
      } else {
        currentRef.current = to;
        setDisplayValue(to);
      }
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [to, from, durationMs, shouldReduceMotion]);

  return <span className={`tabular-nums ${className}`}>{formatter(displayValue)}</span>;
}

export default CountUp;
