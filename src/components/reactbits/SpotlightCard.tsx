'use client';

import { useRef, useState, type MouseEvent, type ReactNode } from 'react';

export interface SpotlightCardProps {
  children: ReactNode;
  className?: string;
  spotlightColor?: string;
  as?: 'div' | 'article';
}

export function SpotlightCard({
  children,
  className = '',
  spotlightColor = 'rgba(156, 68, 220, 0.12)',
  as = 'div',
}: SpotlightCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: MouseEvent<HTMLElement>) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const Tag = as;

  return (
    <Tag
      ref={containerRef as never}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative overflow-hidden ${className}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300 ease-out"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(460px circle at ${coords.x}px ${coords.y}px, ${spotlightColor}, transparent 68%)`,
        }}
      />
      {children}
    </Tag>
  );
}

export default SpotlightCard;
