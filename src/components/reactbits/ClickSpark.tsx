'use client';

import { useEffect, useRef, type MouseEvent, type ReactNode } from 'react';
import { useReducedMotion } from 'motion/react';

export interface ClickSparkProps {
  children: ReactNode;
  sparkColor?: string;
  sparkSize?: number;
  sparkRadius?: number;
  sparkCount?: number;
  duration?: number;
  className?: string;
}

interface Spark {
  x: number;
  y: number;
  angle: number;
  startTime: number;
}

export function ClickSpark({
  children,
  sparkColor = '#9c44dc',
  sparkSize = 9,
  sparkRadius = 18,
  sparkCount = 8,
  duration = 360,
  className = '',
}: ClickSparkProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sparksRef = useRef<Spark[]>([]);
  const rafRef = useRef<number | null>(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      canvas.width = Math.max(1, Math.floor(vw * dpr));
      canvas.height = Math.max(1, Math.floor(vh * dpr));
      canvas.style.width = `${vw}px`;
      canvas.style.height = `${vh}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    };

    resize();
    window.addEventListener('resize', resize, { passive: true });

    return () => {
      window.removeEventListener('resize', resize);
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const drawSparks = (now: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    sparksRef.current = sparksRef.current.filter((spark) => {
      const elapsed = now - spark.startTime;
      if (elapsed >= duration) return false;

      const t = elapsed / duration;
      const eased = 1 - Math.pow(1 - t, 2);
      const distance = eased * sparkRadius;
      const lineLen = sparkSize * (1 - t);
      const alpha = 1 - t;

      const x1 = spark.x + Math.cos(spark.angle) * distance;
      const y1 = spark.y + Math.sin(spark.angle) * distance;
      const x2 = spark.x + Math.cos(spark.angle) * (distance + lineLen);
      const y2 = spark.y + Math.sin(spark.angle) * (distance + lineLen);

      ctx.strokeStyle = sparkColor;
      ctx.globalAlpha = alpha * 0.85;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      return true;
    });

    ctx.globalAlpha = 1;

    if (sparksRef.current.length > 0) {
      rafRef.current = window.requestAnimationFrame(drawSparks);
    } else {
      rafRef.current = null;
    }
  };

  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    if (shouldReduceMotion) return;
    const target = e.target as HTMLElement | null;
    if (!target?.closest('button, a')) return;

    const now = performance.now();
    for (let i = 0; i < sparkCount; i++) {
      sparksRef.current.push({
        x: e.clientX,
        y: e.clientY,
        angle: (2 * Math.PI * i) / sparkCount,
        startTime: now,
      });
    }

    if (rafRef.current === null) {
      rafRef.current = window.requestAnimationFrame(drawSparks);
    }
  };

  return (
    <div onClick={handleClick} className={className}>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-50"
      />
      {children}
    </div>
  );
}

export default ClickSpark;
