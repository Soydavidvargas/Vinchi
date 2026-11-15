'use client';

import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

export function ScrollToTopButton({ align = 'right' }: { align?: 'left' | 'right' }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 260);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Subir al inicio"
      className={`vinchi-transition fixed bottom-5 ${align === 'left' ? 'left-5' : 'right-5'} z-40 inline-flex min-h-[44px] items-center gap-1.5 rounded-[18px] border border-[#bc8ae1]/35 bg-[#442c61] px-4 py-2 text-xs font-medium text-[#ffffff] shadow-[0_6px_18px_rgba(68,44,97,0.28)] hover:bg-[#9c44dc] cursor-pointer ${
        visible
          ? 'translate-y-0 opacity-100 pointer-events-auto'
          : 'translate-y-4 opacity-0 pointer-events-none'
      }`}
    >
      <ArrowUp className="h-4 w-4" aria-hidden="true" />
      <span>Subir</span>
    </button>
  );
}

export default ScrollToTopButton;
