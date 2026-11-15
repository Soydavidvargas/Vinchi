'use client';

import { useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';

export interface BlurTextProps {
  text: string;
  className?: string;
  delayMs?: number;
  stepDelayMs?: number;
  immediate?: boolean;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
}

export function BlurText({
  text,
  className = '',
  delayMs = 0,
  stepDelayMs = 45,
  immediate = false,
  as = 'h2',
}: BlurTextProps) {
  const shouldReduceMotion = useReducedMotion();
  const words = useMemo(() => text.split(' '), [text]);

  const MotionTag = motion[as];

  if (shouldReduceMotion) {
    const StaticTag = as;
    return <StaticTag className={className}>{text}</StaticTag>;
  }

  return (
    <MotionTag className={className}>
      {words.map((word, index) => (
        <motion.span
          key={`${word}-${index}`}
          initial={{ opacity: 0, y: 8, filter: 'blur(6px)' }}
          {...(immediate
            ? { animate: { opacity: 1, y: 0, filter: 'blur(0px)' } }
            : {
                whileInView: { opacity: 1, y: 0, filter: 'blur(0px)' },
                viewport: { once: true, amount: 0.25 },
              })}
          transition={{
            duration: 0.38,
            delay: (delayMs + index * stepDelayMs) / 1000,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="inline-block will-change-[transform,opacity,filter]"
        >
          {word}
          {index < words.length - 1 ? '\u00A0' : ''}
        </motion.span>
      ))}
    </MotionTag>
  );
}

export default BlurText;
