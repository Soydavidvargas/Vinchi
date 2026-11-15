import type { ClientCompanyCatalog, ClientCompanyLogoIcon, ClientFoodImageKey } from '@/src/types/vinchi';

import bandejaImg from '@/src/assets/images/bandeja_colombiana_1794730014735.jpg';
import burgerImg from '@/src/assets/images/hamburguesa_artesanal_1794730013798.jpg';
import cafeImg from '@/src/assets/images/cafe_postre_bebidas_1794730015549.jpg';
import ramenImg from '@/src/assets/images/ramen_sushi_1794730014018.jpg';
import ribeyeImg from '@/src/assets/images/ribeye_parrilla_1794730012796.jpg';
import veganoImg from '@/src/assets/images/bowl_vegano_1794730014879.jpg';

export const FOOD_IMAGE_MAP: Record<ClientFoodImageKey, string> = {
  ribeye: ribeyeImg,
  burger: burgerImg,
  ramen: ramenImg,
  bandeja: bandejaImg,
  vegano: veganoImg,
  cafe: cafeImg,
};

export function getFoodPhotoUrl(key?: ClientFoodImageKey): string {
  if (key && FOOD_IMAGE_MAP[key]) {
    return FOOD_IMAGE_MAP[key];
  }
  return ribeyeImg;
}

export function getCompanyLogoBadgeMeta(company: ClientCompanyCatalog): {
  initials: string;
  icon: ClientCompanyLogoIcon;
  tone: string;
} {
  return {
    initials: company.emblemaIniciales,
    icon: company.logoIcon || 'store',
    tone: company.bannerTone,
  };
}
