'use client';

import {
  Beef,
  CakeSlice,
  Coffee,
  Flame,
  Leaf,
  Sandwich,
  Soup,
  Store,
  Utensils,
  UtensilsCrossed,
} from 'lucide-react';
import type { ClientCompanyLogoIcon } from '@/src/types/vinchi';

export interface CompanyLogoMarkProps {
  initials: string;
  name: string;
  bannerTone: string;
  logoIcon?: ClientCompanyLogoIcon;
  logoDataUrl?: string;
  size?: 'sm' | 'md' | 'lg';
}

const ICON_MAP: Record<ClientCompanyLogoIcon, typeof Store> = {
  flame: Flame,
  soup: Soup,
  utensils: Utensils,
  leaf: Leaf,
  burger: Sandwich,
  steak: Beef,
  sushi: UtensilsCrossed,
  coffee: Coffee,
  cake: CakeSlice,
  store: Store,
};

export default function CompanyLogoMark({
  initials,
  name,
  bannerTone,
  logoIcon = 'store',
  logoDataUrl,
  size = 'md',
}: CompanyLogoMarkProps) {
  const Icon = ICON_MAP[logoIcon] || Store;

  const boxSize =
    size === 'lg'
      ? 'h-16 w-16 rounded-[20px]'
      : size === 'sm'
        ? 'h-10 w-10 rounded-[12px]'
        : 'h-12 w-12 rounded-[16px]';

  const iconSize =
    size === 'lg' ? 'h-7 w-7 stroke-[2.2]' : size === 'sm' ? 'h-5 w-5 stroke-[2.2]' : 'h-6 w-6 stroke-[2.2]';
  const badgeText = size === 'lg' ? 'text-[10px] px-1.5' : 'text-[9px] px-1';

  return (
    <div
      aria-label={`Logo de ${name}`}
      className={`relative inline-flex shrink-0 items-center justify-center bg-gradient-to-br ${bannerTone} text-[#ffffff] shadow-sm ring-2 ring-[#ffffff] ${boxSize}`}
    >
      {logoDataUrl ? (
        <img
          src={logoDataUrl}
          alt={`Logo de ${name}`}
          className="h-full w-full rounded-[inherit] object-cover"
        />
      ) : (
        <Icon className={iconSize} aria-hidden="true" />
      )}
      <span
        className={`absolute -bottom-1 -right-1 rounded-[6px] border border-[#ffffff] bg-[#0a0a0a] font-display font-bold tracking-tight text-[#ffffff] ${badgeText}`}
      >
        {initials}
      </span>
    </div>
  );
}
