'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

export interface LazyScrollSectionProps {
  children: ReactNode;
  /** Esqueleto mostrado antes de hidratarse al entrar en pantalla */
  skeleton?: ReactNode;
  /** Clases adicionales en el contenedor */
  className?: string;
  /** Margen de anticipación del IntersectionObserver */
  rootMargin?: string;
  /** Duración breve de skeleton al hidratar por lazy scroll (ms) */
  hydrationDelayMs?: number;
  /** Si está en true, fuerza mostrar inmediatamente sin esperar intersección (ej. Above the fold) */
  eager?: boolean;
}

export function LazyScrollSection({
  children,
  skeleton,
  className = '',
  rootMargin = '240px 0px',
  hydrationDelayMs = 70,
  eager = false,
}: LazyScrollSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasEntered, setHasEntered] = useState(eager);
  const [isHydrated, setIsHydrated] = useState(eager);

  useEffect(() => {
    if (eager) {
      setHasEntered(true);
      setIsHydrated(true);
      return;
    }
    const node = containerRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setHasEntered(true);
      setIsHydrated(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;

        if (entry.isIntersecting) {
          setHasEntered(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.01,
        rootMargin,
      }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [eager, rootMargin]);

  useEffect(() => {
    if (!hasEntered || isHydrated) return;

    const timer = window.setTimeout(() => {
      setIsHydrated(true);
    }, hydrationDelayMs);

    return () => window.clearTimeout(timer);
  }, [hasEntered, isHydrated, hydrationDelayMs]);

  return (
    <div
      ref={containerRef}
      className={`transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none motion-reduce:translate-y-0 motion-reduce:opacity-100 ${
        hasEntered ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
      } ${className}`}
    >
      {!isHydrated && skeleton ? skeleton : children}
    </div>
  );
}

export default LazyScrollSection;
