'use client';

import { useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { useReducedMotion } from 'motion/react';

export interface MagnetProps {
  children: ReactNode;
  padding?: number;
  strength?: number;
  disabled?: boolean;
  className?: string;
}

export function Magnet({
  children,
  padding = 28,
  strength = 0.22,
  disabled = false,
  className = '',
}: MagnetProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const shouldReduceMotion = useReducedMotion();

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (disabled || shouldReduceMotion || !wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;

    if (
      Math.abs(dx) < rect.width / 2 + padding &&
      Math.abs(dy) < rect.height / 2 + padding
    ) {
      setOffset({
        x: Math.max(-7, Math.min(7, dx * strength)),
        y: Math.max(-5, Math.min(5, dy * strength)),
      });
    }
  };

  const handleMouseLeave = () => {
    setOffset({ x: 0, y: 0 });
  };

  return (
    <div
      ref={wrapperRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`inline-block ${className}`}
      style={{
        transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
        transition:
          offset.x === 0 && offset.y === 0
            ? 'transform 320ms cubic-bezier(0.16, 1, 0.3, 1)'
            : 'transform 110ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {children}
    </div>
  );
}

export default Magnet;
