'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Briefcase,
  Check,
  LogOut,
  MapPin,
  QrCode,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Truck,
  X,
} from 'lucide-react';
import CorbataEmpresarioScroll3D from '@/src/components/CorbataEmpresarioScroll3D';
import DeliveryMotoScroll3D from '@/src/components/DeliveryMotoScroll3D';
import FeatureIllustrationCard from '@/src/components/FeatureIllustrationCard';
import LandingFoodBackground3D from '@/src/components/LandingFoodBackground3D';
import LazyScrollSection from '@/src/components/LazyScrollSection';
import MobileShowcase3D from '@/src/components/MobileShowcase3D';
import PalomaMensajeraScroll3D from '@/src/components/PalomaMensajeraScroll3D';
import { lazyWithRetry, ViewErrorBoundary } from '@/src/components/ResilientLazy';
import {
  Canvas3DSkeleton,
  FeaturePairSkeleton,
  HeroSkeleton,
  PlansGridSkeleton,
  SkeletonBlock,
} from '@/src/components/Skeletons';
import BlurText from '@/src/components/reactbits/BlurText';
import ClickSpark from '@/src/components/reactbits/ClickSpark';
import CountUp from '@/src/components/reactbits/CountUp';
import Magnet from '@/src/components/reactbits/Magnet';
import ShinyText from '@/src/components/reactbits/ShinyText';
import SpotlightCard from '@/src/components/reactbits/SpotlightCard';
import VinchiDocsDriveModal from '@/src/components/VinchiDocsDriveModal';
import type { AuthUser, SaaSPlan, VinchiRoute } from '@/src/types/vinchi';

const Showcase3D = lazyWithRetry(() => import('@/src/components/Showcase3D'));

export interface LandingPageProps {
  /** Planes inyectados por props */
  plans: SaaSPlan[];
  /** Precio único de activación en COP (por defecto 35000) */
  setupFeeCop?: number;
  /** Usuario autenticado para actualizar la navegación hacia portales privados */
  currentUser?: AuthUser | null;
  /** Etiqueta legible del rol activo */
  roleLabel?: string;
  /** Callbacks de navegación y conversión */
  onDigitalizeClick?: () => void;
  onExploreAgentsClick?: () => void;
  onWorkClick?: () => void;
  onSelectPlan?: (planId: SaaSPlan['id']) => void;
  onNavigate?: (route: VinchiRoute) => void;
  onLogout?: () => void;
}

const formatCop = (value: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);

const FOCUS_STEPS = [
  'hero',
  'como-funciona-1',
  'como-funciona-2',
  'como-funciona-3',
  'como-pedir-1',
  'como-pedir-2',
  'como-pedir-3',
  'para-empresarios-1',
  'para-empresarios-2',
  'para-empresarios-3',
  'agentes-1',
  'agentes-2',
  'planes-1',
  'footer',
] as const;

type FocusStepId = (typeof FOCUS_STEPS)[number];

export default function LandingPage({
  plans,
  setupFeeCop = 35000,
  currentUser,
  roleLabel,
  onDigitalizeClick,
  onExploreAgentsClick,
  onWorkClick,
  onSelectPlan,
  onNavigate,
  onLogout,
}: LandingPageProps) {
  const [billingCycle, setBillingCycle] = useState<'mensual' | 'anual'>('mensual');
  const [activeStepId, setActiveStepId] = useState<FocusStepId>('hero');
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);
  const [showDocsModal, setShowDocsModal] = useState<boolean>(false);

  const motoCorridorRef = useRef<HTMLDivElement>(null);
  const pigeonCorridorRef = useRef<HTMLDivElement>(null);
  const tieCorridorRef = useRef<HTMLDivElement>(null);
  const activeStepRef = useRef<FocusStepId>('hero');
  const lockUntilRef = useRef<number>(0);
  const wheelDeltaAccRef = useRef<number>(0);
  const wheelResetTimerRef = useRef<number | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const hasAgentPermission =
    currentUser?.role === 'agente' || currentUser?.agentApplicationStatus === 'approved';
  const hasCourierPermission =
    currentUser?.role === 'repartidor' || currentUser?.courierApplicationStatus === 'approved';
  const hasSpacePermission =
    Boolean(currentUser?.businessActivated) || currentUser?.role === 'comercio';
  const isWaitingEntrepreneur =
    currentUser?.role === 'empresario_en_espera' && !hasSpacePermission;
  const isSuperadmin = currentUser?.role === 'superadmin';

  const handleNav = (route: VinchiRoute) => {
    if (onNavigate) {
      onNavigate(route);
    }
  };

  useEffect(() => {
    activeStepRef.current = activeStepId;
  }, [activeStepId]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setPrefersReducedMotion(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  // Calcular límites verticales del paso (incluye encabezado de sección cuando aplica)
  const getStepBounds = useCallback((stepId: FocusStepId) => {
    const stepEl = document.querySelector<HTMLElement>(`[data-focus-step="${stepId}"]`);
    if (!stepEl) return null;

    const headingEl = document.querySelector<HTMLElement>(`[data-focus-heading="${stepId}"]`);
    const stepRect = stepEl.getBoundingClientRect();

    if (headingEl) {
      const headingRect = headingEl.getBoundingClientRect();
      const top = Math.min(headingRect.top, stepRect.top);
      const bottom = Math.max(headingRect.bottom, stepRect.bottom);
      return {
        top,
        bottom,
        height: bottom - top,
      };
    }

    return {
      top: stepRect.top,
      bottom: stepRect.bottom,
      height: stepRect.height,
    };
  }, []);

  const scrollToStep = useCallback(
    (stepId: FocusStepId) => {
      if (typeof window === 'undefined') return;
      const bounds = getStepBounds(stepId);
      if (!bounds && stepId !== 'hero') return;

      lockUntilRef.current = Date.now() + 580;
      wheelDeltaAccRef.current = 0;
      activeStepRef.current = stepId;
      setActiveStepId(stepId);

      if (stepId === 'hero' || !bounds) {
        window.scrollTo({
          top: 0,
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
        });
        return;
      }

      const headerHeight =
        document.querySelector('header')?.getBoundingClientRect().height ?? 68;
      const bottomMargin = 16;
      const availableVh = Math.max(240, window.innerHeight - headerHeight - bottomMargin);
      const absTop = bounds.top + window.scrollY;
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

      let targetTop: number;
      if (bounds.height <= availableVh) {
        // Centrar el bloque completo (100% visible) debajo de la barra superior
        const verticalCenterOffset = Math.max(
          10,
          Math.round((availableVh - bounds.height) / 2),
        );
        targetTop = absTop - headerHeight - verticalCenterOffset;
      } else {
        targetTop = absTop - headerHeight - 12;
      }

      window.scrollTo({
        top: Math.max(0, Math.min(maxScroll, targetTop)),
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      });
    },
    [getStepBounds, prefersReducedMotion],
  );

  // Siempre iniciar enfocando el Hero al entrar en la landing
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!window.location.hash) {
      activeStepRef.current = 'hero';
      setActiveStepId('hero');
      if (window.scrollY > 0) {
        window.scrollTo({ top: 0, behavior: 'auto' });
      }
    }
  }, []);

  // Sincronizar el paso enfocado cuando el usuario usa la barra de scroll o el botón Subir
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncFromScroll = () => {
      if (Date.now() < lockUntilRef.current) return;
      if (window.scrollY <= 48) {
        if (activeStepRef.current !== 'hero') {
          activeStepRef.current = 'hero';
          setActiveStepId('hero');
        }
        return;
      }

      const headerHeight =
        document.querySelector('header')?.getBoundingClientRect().height ?? 68;
      const readingCenter = headerHeight + (window.innerHeight - headerHeight) * 0.45;

      let bestStep: FocusStepId = activeStepRef.current;
      let bestDistance = Number.POSITIVE_INFINITY;

      for (const stepId of FOCUS_STEPS) {
        const bounds = getStepBounds(stepId);
        if (!bounds) continue;
        const center = (bounds.top + bounds.bottom) / 2;
        const dist = Math.abs(center - readingCenter);
        if (dist < bestDistance) {
          bestDistance = dist;
          bestStep = stepId;
        }
      }

      if (bestStep !== activeStepRef.current) {
        activeStepRef.current = bestStep;
        setActiveStepId(bestStep);
      }
    };

    window.addEventListener('scroll', syncFromScroll, { passive: true });
    return () => window.removeEventListener('scroll', syncFromScroll);
  }, [getStepBounds]);

  // Controlador permanente de enfoque 100% por bloque/div con un solo scroll
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isInsideScrollableChild = (target: EventTarget | null): boolean => {
      let node = target as HTMLElement | null;
      while (node && node !== document.body && node !== document.documentElement) {
        const style = window.getComputedStyle(node);
        const overflowY = style.overflowY;
        if (
          (overflowY === 'auto' || overflowY === 'scroll') &&
          node.scrollHeight > node.clientHeight + 4
        ) {
          return true;
        }
        node = node.parentElement;
      }
      return false;
    };

    const resolveActiveStepIndex = (): number => {
      if (window.scrollY <= 40) return 0;
      const activeIdx = FOCUS_STEPS.indexOf(activeStepRef.current);
      if (activeIdx >= 0) return activeIdx;
      return 0;
    };

    const stepDirection = (direction: 1 | -1, e?: Event) => {
      const currentIndex = resolveActiveStepIndex();
      const currentStepId = FOCUS_STEPS[currentIndex];
      const bounds = getStepBounds(currentStepId);

      const headerHeight =
        document.querySelector('header')?.getBoundingClientRect().height ?? 68;
      const availableVh = Math.max(240, window.innerHeight - headerHeight - 16);
      const isTallStep = Boolean(bounds && bounds.height > availableVh + 28);

      if (direction === 1) {
        if (currentIndex >= FOCUS_STEPS.length - 1) return;
        const nearBottom = !bounds || bounds.bottom <= window.innerHeight + 36;
        if (!isTallStep || nearBottom) {
          e?.preventDefault();
          scrollToStep(FOCUS_STEPS[currentIndex + 1]);
        }
      } else {
        if (currentIndex <= 0 && window.scrollY <= 12) return;
        const nearTop = !bounds || bounds.top >= headerHeight - 36;
        if (currentIndex > 0 && (!isTallStep || nearTop)) {
          e?.preventDefault();
          scrollToStep(FOCUS_STEPS[currentIndex - 1]);
        } else if (currentIndex === 0 && window.scrollY > 12) {
          e?.preventDefault();
          scrollToStep('hero');
        }
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      if (isInsideScrollableChild(e.target)) return;

      // Bloquear inercia residual durante la transición enfocada
      if (Date.now() < lockUntilRef.current) {
        e.preventDefault();
        return;
      }

      if (Math.abs(e.deltaY) < 4) return;

      wheelDeltaAccRef.current += e.deltaY;
      if (wheelResetTimerRef.current !== null) {
        window.clearTimeout(wheelResetTimerRef.current);
      }
      wheelResetTimerRef.current = window.setTimeout(() => {
        wheelDeltaAccRef.current = 0;
      }, 120);

      if (Math.abs(wheelDeltaAccRef.current) < 12) return;

      const direction: 1 | -1 = wheelDeltaAccRef.current > 0 ? 1 : -1;
      wheelDeltaAccRef.current = 0;
      stepDirection(direction, e);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key !== 'PageDown' &&
        e.key !== 'PageUp' &&
        e.key !== 'ArrowDown' &&
        e.key !== 'ArrowUp'
      ) {
        return;
      }
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON') {
        return;
      }

      if (Date.now() < lockUntilRef.current) {
        e.preventDefault();
        return;
      }

      const direction: 1 | -1 = e.key === 'PageDown' || e.key === 'ArrowDown' ? 1 : -1;
      stepDirection(direction, e);
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current || e.changedTouches.length !== 1) return;
      if (Date.now() < lockUntilRef.current) {
        touchStartRef.current = null;
        return;
      }

      const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
      const dy = touchStartRef.current.y - e.changedTouches[0].clientY;
      touchStartRef.current = null;

      if (Math.abs(dy) < 36 || Math.abs(dy) < Math.abs(dx) * 1.3) return;
      stepDirection(dy > 0 ? 1 : -1);
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      if (wheelResetTimerRef.current !== null) {
        window.clearTimeout(wheelResetTimerRef.current);
      }
    };
  }, [getStepBounds, scrollToStep]);

  const getFocusStepClass = (stepId: FocusStepId) => {
    if (prefersReducedMotion) {
      return 'scroll-mt-[68px]';
    }
    const isFocused = activeStepId === stepId;
    return `scroll-mt-[68px] transition-[opacity,transform] duration-300 ease-out origin-center ${
      isFocused ? 'opacity-100 scale-100' : 'opacity-[0.84] scale-[0.992]'
    }`;
  };

  return (
    <ClickSpark
      sparkColor="#9c44dc"
      sparkSize={8}
      sparkRadius={16}
      sparkCount={8}
      duration={360}
      className="relative min-h-screen bg-gradient-to-b from-[#f3e8ff] via-[#faf5ff] to-[#f4ecfb] text-[#0a0a0a]"
    >
      {/* Fondo Three.js en tonos púrpura con comidas y cajas de domicilio en parallax */}
      <ViewErrorBoundary fallback={null}>
        <LandingFoodBackground3D />
      </ViewErrorBoundary>

      {/* Sticky Top Navigation: Marca Vinchi en Púrpura Real + Accesos rápidos */}
      <header className="sticky top-0 z-40 border-b border-[#9c44dc]/55 bg-[#442c61] text-[#ffffff] shadow-[0_6px_24px_-8px_rgba(68,44,97,0.5)]">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-2 px-4 py-2.5 sm:gap-3 sm:px-6">
          <a
            href="#hero"
            onClick={(e) => {
              e.preventDefault();
              scrollToStep('hero');
            }}
            className="vinchi-transition inline-flex min-h-[42px] items-center font-display text-2xl font-bold tracking-[-0.04em] text-[#ffffff] hover:text-[#e9d5ff] whitespace-nowrap shrink-0"
          >
            vinchi
          </a>

          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-2.5 shrink-0">
            {currentUser ? (
              <>
                <div className="inline-flex min-h-[42px] items-center gap-2 rounded-[16px] border border-[#bc8ae1]/40 bg-[#ffffff]/10 px-3 py-1.5 text-xs text-[#ffffff]">
                  {currentUser.avatarDataUrl && (
                    <img
                      src={currentUser.avatarDataUrl}
                      alt={currentUser.nombre}
                      className="h-6 w-6 rounded-full border border-[#bc8ae1]/60 object-cover"
                    />
                  )}
                  <span className="max-w-[140px] truncate font-semibold">{currentUser.nombre}</span>
                  <span className="rounded-[8px] border border-[#bc8ae1]/40 bg-[#9c44dc]/55 px-2 py-0.5 text-[11px] font-semibold text-[#ffffff]">
                    {roleLabel ||
                      (currentUser.role === 'empresario_en_espera'
                        ? 'Empresario en espera'
                        : currentUser.role === 'comercio'
                          ? 'Empresario'
                          : currentUser.role === 'agente'
                            ? 'Agente Certificado'
                            : currentUser.role === 'repartidor'
                              ? 'Repartidor Verificado'
                              : currentUser.role === 'superadmin'
                                ? 'Superadmin'
                                : 'Cliente')}
                  </span>
                </div>

                {isSuperadmin && (
                  <button
                    type="button"
                    onClick={() => handleNav('/(dashboards)/admin')}
                    className="vinchi-transition inline-flex min-h-[42px] items-center gap-2 rounded-[16px] bg-[#9c44dc] px-4 py-2 text-xs font-semibold text-[#ffffff] shadow-xs hover:bg-[#bc8ae1] hover:text-[#442c61] sm:text-sm whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <ShieldCheck className="h-5 w-5 stroke-[2.2]" aria-hidden="true" />
                    <span>Panel Admin</span>
                  </button>
                )}

                {hasAgentPermission && (
                  <button
                    type="button"
                    onClick={() => handleNav('/(dashboards)/agente')}
                    className="vinchi-transition inline-flex min-h-[42px] items-center gap-2 rounded-[16px] bg-[#9c44dc] px-4 py-2 text-xs font-semibold text-[#ffffff] shadow-xs hover:bg-[#bc8ae1] hover:text-[#442c61] sm:text-sm whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Briefcase className="h-5 w-5 stroke-[2.2]" aria-hidden="true" />
                    <span>Portal Agente</span>
                  </button>
                )}

                {hasCourierPermission && (
                  <button
                    type="button"
                    onClick={() => handleNav('/(dashboards)/repartidor')}
                    className="vinchi-transition inline-flex min-h-[42px] items-center gap-2 rounded-[16px] bg-[#9c44dc] px-4 py-2 text-xs font-semibold text-[#ffffff] shadow-xs hover:bg-[#bc8ae1] hover:text-[#442c61] sm:text-sm whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Truck className="h-5 w-5 stroke-[2.2]" aria-hidden="true" />
                    <span>Portal Domicilio</span>
                  </button>
                )}

                {(hasSpacePermission || isWaitingEntrepreneur) && (
                  <button
                    type="button"
                    onClick={
                      hasSpacePermission
                        ? () => handleNav('/(dashboards)/comercio')
                        : onExploreAgentsClick ?? (() => handleNav('/(portal)/explorar-agentes'))
                    }
                    className="vinchi-transition inline-flex min-h-[42px] items-center gap-2 rounded-[16px] bg-[#9c44dc] px-4 py-2 text-xs font-semibold text-[#ffffff] shadow-xs hover:bg-[#bc8ae1] hover:text-[#442c61] sm:text-sm whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Store className="h-5 w-5 stroke-[2.2]" aria-hidden="true" />
                    <span>{hasSpacePermission ? 'Mi espacio' : 'Mi espacio en espera'}</span>
                  </button>
                )}

                {!isSuperadmin &&
                  !hasAgentPermission &&
                  !hasCourierPermission &&
                  !hasSpacePermission &&
                  !isWaitingEntrepreneur && (
                    <button
                      type="button"
                      onClick={() => handleNav('/(public)/cliente')}
                      className="vinchi-transition inline-flex min-h-[42px] items-center gap-2 rounded-[16px] bg-[#9c44dc] px-4 py-2 text-xs font-semibold text-[#ffffff] shadow-xs hover:bg-[#bc8ae1] hover:text-[#442c61] sm:text-sm whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <ShoppingBag className="h-5 w-5 stroke-[2.2]" aria-hidden="true" />
                      <span>Catálogo y compras</span>
                    </button>
                  )}

                {onLogout && (
                  <button
                    type="button"
                    onClick={onLogout}
                    className="vinchi-transition inline-flex min-h-[42px] items-center gap-2 rounded-[16px] border border-[#bc8ae1]/45 bg-[#ffffff]/12 px-4 py-2 text-xs font-semibold text-[#ffffff] hover:bg-[#ffffff]/20 sm:text-sm whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <LogOut className="h-4.5 w-4.5 stroke-[2.2] text-[#e9d5ff]" aria-hidden="true" />
                    <span>Cerrar sesión</span>
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onWorkClick ?? (() => handleNav('/(auth)/login'))}
                  className="vinchi-transition hidden md:inline-flex min-h-[42px] items-center gap-2 rounded-[16px] border border-[#bc8ae1]/45 bg-[#ffffff]/10 px-4 py-2 text-sm font-medium text-[#ffffff] hover:border-[#e9d5ff] hover:bg-[#9c44dc] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Briefcase className="h-5 w-5 stroke-[2.2] text-[#fde68a]" aria-hidden="true" />
                  <span>Trabajar en Vinchi</span>
                </button>

                <button
                  type="button"
                  onClick={onExploreAgentsClick ?? (() => handleNav('/(portal)/explorar-agentes'))}
                  className="vinchi-transition inline-flex min-h-[42px] items-center gap-2 rounded-[16px] border border-[#bc8ae1]/55 bg-[#ffffff]/14 px-4 py-2 text-xs font-semibold text-[#ffffff] hover:border-[#ffffff] hover:bg-[#543b6c] sm:text-sm whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Store className="h-5 w-5 stroke-[2.2] text-[#e9d5ff]" aria-hidden="true" />
                  <span>Crear mi espacio</span>
                </button>

                <Magnet padding={16} strength={0.18}>
                  <button
                    type="button"
                    onClick={() => handleNav('/(public)/cliente')}
                    className="vinchi-transition inline-flex min-h-[44px] items-center gap-2 rounded-[18px] bg-[#9c44dc] px-5 py-2 text-xs font-semibold text-[#ffffff] shadow-[0_6px_20px_-3px_rgba(156,68,220,0.65)] hover:bg-[#bc8ae1] hover:text-[#442c61] sm:text-sm whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <ShoppingBag className="h-5 w-5 stroke-[2.2]" aria-hidden="true" />
                    <span>Pedir Ahora</span>
                  </button>
                </Magnet>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 1. Hero Section + 3D Mobile Showcase a la derecha */}
      <section
        id="hero"
        data-focus-step="hero"
        className={`${getFocusStepClass('hero')} relative z-10 flex min-h-[calc(100svh-104px)] items-center overflow-hidden bg-transparent px-4 py-10 sm:px-6 sm:py-16`}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-0 bg-[radial-gradient(circle_at_20%_35%,rgba(156,68,220,0.20),transparent_55%),radial-gradient(circle_at_78%_55%,rgba(68,44,97,0.16),transparent_52%)]"
        />
        <LazyScrollSection
          eager
          hydrationDelayMs={240}
          skeleton={<HeroSkeleton />}
          className="relative z-10 mx-auto w-full max-w-[1280px]"
        >
          <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-10">
            {/* Tarjeta Hero a la izquierda */}
            <SpotlightCard
              spotlightColor="rgba(156, 68, 220, 0.14)"
              className="rounded-[28px] border-2 border-[#bc8ae1]/80 bg-gradient-to-br from-[#ffffff] via-[#faf5ff] to-[#f3e8ff]/90 p-6 shadow-[0_18px_48px_-14px_rgba(68,44,97,0.24)] sm:p-10 lg:col-span-7 lg:p-12"
            >
              <div className="inline-flex items-center gap-2 rounded-[12px] border border-[#9c44dc]/30 bg-[#9c44dc]/10 px-3.5 py-1.5 text-xs font-semibold text-[#442c61]">
                <Sparkles className="h-5 w-5 stroke-[2.25] text-[#9c44dc]" aria-hidden="true" />
                <ShinyText text="0% comisión por pedido · Pedidos en mesa y domicilio" tone="orchid" />
              </div>

              <BlurText
                as="h1"
                immediate
                stepDelayMs={42}
                text="El menú digital que se sale de la pantalla"
                className="mt-4 text-balance font-display text-[34px] font-semibold leading-[1.06] tracking-[-0.04em] text-[#442c61] sm:text-5xl sm:tracking-[-0.05em] lg:text-[60px]"
              />

              <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#543b6c] sm:mt-5 sm:text-lg">
                Deja de entregar hasta el 30% de cada venta a las aplicaciones tradicionales.
                Digitaliza tus pedidos en mesa, caja y domicilios sin intermediarios.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center">
                <Magnet padding={24} strength={0.2} className="w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={
                      hasSpacePermission
                        ? () => handleNav('/(dashboards)/comercio')
                        : hasAgentPermission
                          ? () => handleNav('/(dashboards)/agente')
                          : hasCourierPermission
                            ? () => handleNav('/(dashboards)/repartidor')
                            : onDigitalizeClick ?? (() => handleNav('/(auth)/login'))
                    }
                    className="vinchi-transition inline-flex min-h-[48px] w-full items-center justify-center gap-2.5 rounded-[18px] bg-gradient-to-r from-[#9c44dc] to-[#543b6c] px-6 py-2.5 text-sm font-semibold text-[#ffffff] shadow-[0_8px_22px_-6px_rgba(156,68,220,0.55)] hover:from-[#543b6c] hover:to-[#442c61] whitespace-nowrap sm:w-auto shrink-0 cursor-pointer"
                  >
                    <span>
                      {hasSpacePermission
                        ? 'Ir a mi espacio privado'
                        : hasAgentPermission
                          ? 'Ir a mi Portal Agente'
                          : hasCourierPermission
                            ? 'Ir a mi Portal Domicilio'
                            : `Digitaliza tu local · ${formatCop(setupFeeCop)} COP`}
                    </span>
                    <ArrowRight className="h-5 w-5 stroke-[2.3]" aria-hidden="true" />
                  </button>
                </Magnet>

                <a
                  href="#planes"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToStep('planes-1');
                  }}
                  className="vinchi-transition inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[18px] border-2 border-[#bc8ae1] bg-[#ffffff] px-5 py-2.5 text-sm font-semibold text-[#442c61] hover:border-[#9c44dc] hover:bg-[#f3e8ff]/70 whitespace-nowrap sm:w-auto shrink-0"
                >
                  <MapPin className="h-5 w-5 stroke-[2.25] text-[#9c44dc]" aria-hidden="true" />
                  <span>Ver planes mensuales</span>
                </a>
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#bc8ae1]/40 pt-5 text-xs text-[#543b6c] sm:mt-8 sm:pt-6">
                <span>
                  Comisión por pedido:{' '}
                  <strong className="font-mono tabular-nums font-semibold text-[#442c61]">0%</strong>
                </span>
                <span aria-hidden="true" className="h-3.5 w-px bg-[#bc8ae1]/55" />
                <span>
                  Setup único:{' '}
                  <strong className="font-mono tabular-nums font-semibold text-[#9c44dc]">
                    <CountUp to={setupFeeCop} formatter={formatCop} /> COP
                  </strong>
                </span>
                <span aria-hidden="true" className="h-3.5 w-px bg-[#bc8ae1]/55" />
                <span>
                  Planes desde{' '}
                  <strong className="font-mono tabular-nums font-semibold text-[#442c61]">
                    $0 / mes
                  </strong>
                </span>
              </div>
            </SpotlightCard>

            {/* Modelo 3D del teléfono sin marco ni botones a la derecha del Hero */}
            <div className="lg:col-span-5">
              <ViewErrorBoundary
                fallback={
                  <div
                    aria-hidden="true"
                    className="flex h-[440px] items-center justify-center sm:h-[500px] lg:h-[560px]"
                  >
                    <div className="h-[360px] w-[180px] rounded-[36px] bg-[#bc8ae1]/20 sm:h-[410px] sm:w-[205px]" />
                  </div>
                }
              >
                <MobileShowcase3D />
              </ViewErrorBoundary>
            </div>
          </div>
        </LazyScrollSection>
      </section>

      {/* 2. Sección "¿Cómo Funciona?" en Zig-Zag con Lazy Scroll + Moto 3D central */}
      <section
        id="como-funciona"
        className="relative z-10 border-t border-[#bc8ae1]/45 bg-gradient-to-b from-[#ede9fe]/36 via-[#faf5ff]/26 to-[#f3e8ff]/40 px-4 pt-16 sm:px-6 sm:pt-24"
      >
        <div className="mx-auto max-w-[1280px] space-y-12 sm:space-y-14">
          <div data-focus-heading="como-funciona-1" className={getFocusStepClass('como-funciona-1')}>
            <LazyScrollSection
              skeleton={
                <div className="max-w-3xl space-y-3">
                  <SkeletonBlock className="h-3.5 w-36" />
                  <SkeletonBlock className="h-10 w-3/4" />
                </div>
              }
            >
              <div className="max-w-3xl">
                <p className="inline-flex items-center gap-2 rounded-[10px] bg-[#9c44dc]/12 px-3 py-1 text-xs font-semibold tracking-[0.02em] text-[#9c44dc]">
                  Arquitectura operativa
                </p>
                <BlurText
                  as="h2"
                  text="¿Cómo funciona Vinchi en tu operación diaria?"
                  className="mt-2 text-balance font-display text-3xl font-semibold leading-[1.12] tracking-[-0.025em] text-[#442c61] sm:text-5xl sm:tracking-[-0.05em]"
                />
              </div>
            </LazyScrollSection>
          </div>

          <div ref={motoCorridorRef} className="relative space-y-16 pb-16 sm:space-y-20 sm:pb-24">
            <ViewErrorBoundary fallback={null}>
              <DeliveryMotoScroll3D corridorRef={motoCorridorRef} />
            </ViewErrorBoundary>

            {/* Bloque 1: QR en Mesa */}
            <div data-focus-step="como-funciona-1" className={getFocusStepClass('como-funciona-1')}>
              <LazyScrollSection skeleton={<FeaturePairSkeleton />}>
                <div className="grid items-stretch gap-6 lg:grid-cols-2 lg:gap-24">
                  <SpotlightCard
                    spotlightColor="rgba(156, 68, 220, 0.14)"
                    className="flex flex-col justify-center rounded-[24px] border-2 border-[#bc8ae1]/70 bg-gradient-to-br from-[#ffffff] to-[#faf5ff] p-6 shadow-[0_12px_32px_-10px_rgba(68,44,97,0.16)] sm:p-10"
                  >
                    <div className="inline-flex w-fit items-center gap-2 border-b border-[#9c44dc]/45 pb-1.5 text-xs font-semibold text-[#442c61]">
                      <QrCode className="h-5 w-5 stroke-[2.25] text-[#9c44dc]" aria-hidden="true" />
                      <span className="font-mono tabular-nums">01. QR en Mesa</span>
                    </div>
                    <h3 className="mt-4 text-balance font-display text-2xl font-semibold leading-[1.2] tracking-[-0.025em] text-[#442c61] sm:mt-5 sm:text-3xl">
                      Carta interactiva sin fricción ni descargas
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-[#543b6c] sm:text-base">
                      El cliente escanea el código QR de la mesa o vitrina y explora platos y
                      productos en alta fidelidad, enviando la orden directamente a cocina o caja sin
                      intermediarios.
                    </p>
                  </SpotlightCard>

                  <FeatureIllustrationCard kind="qr" className="min-h-[260px] sm:min-h-[340px]" />
                </div>
              </LazyScrollSection>
            </div>

            {/* Bloque 2: Dashboard Cajero */}
            <div data-focus-step="como-funciona-2" className={getFocusStepClass('como-funciona-2')}>
              <LazyScrollSection skeleton={<FeaturePairSkeleton reversed />}>
                <div className="grid items-stretch gap-6 lg:grid-cols-2 lg:gap-24">
                  <FeatureIllustrationCard
                    kind="pos"
                    className="order-2 min-h-[260px] sm:min-h-[340px] lg:order-1"
                  />

                  <SpotlightCard
                    spotlightColor="rgba(156, 68, 220, 0.14)"
                    className="order-1 flex flex-col justify-center rounded-[24px] border-2 border-[#bc8ae1]/70 bg-gradient-to-br from-[#ffffff] to-[#faf5ff] p-6 shadow-[0_12px_32px_-10px_rgba(68,44,97,0.16)] sm:p-10 lg:order-2"
                  >
                    <div className="inline-flex w-fit items-center gap-2 border-b border-[#9c44dc]/45 pb-1.5 text-xs font-semibold text-[#442c61]">
                      <Store className="h-5 w-5 stroke-[2.25] text-[#9c44dc]" aria-hidden="true" />
                      <span className="font-mono tabular-nums">02. Dashboard Cajero</span>
                    </div>
                    <h3 className="mt-4 text-balance font-display text-2xl font-semibold leading-[1.2] tracking-[-0.025em] text-[#442c61] sm:mt-5 sm:text-3xl">
                      Control total de salón y caja en tiempo real
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-[#543b6c] sm:text-base">
                      Un panel de caja de alta legibilidad diseñado para turnos exigentes. Revisa
                      pedidos entrantes, verifica detalles por mesa y ejecuta cobros o anulaciones en
                      un solo clic.
                    </p>
                  </SpotlightCard>
                </div>
              </LazyScrollSection>
            </div>

            {/* Bloque 3: Flota Segura */}
            <div data-focus-step="como-funciona-3" className={getFocusStepClass('como-funciona-3')}>
              <LazyScrollSection skeleton={<FeaturePairSkeleton />}>
                <div className="grid items-stretch gap-6 lg:grid-cols-2 lg:gap-24">
                  <SpotlightCard
                    spotlightColor="rgba(156, 68, 220, 0.14)"
                    className="flex flex-col justify-center rounded-[24px] border-2 border-[#bc8ae1]/70 bg-gradient-to-br from-[#ffffff] to-[#faf5ff] p-6 shadow-[0_12px_32px_-10px_rgba(68,44,97,0.16)] sm:p-10"
                  >
                    <div className="inline-flex w-fit items-center gap-2 border-b border-[#9c44dc]/45 pb-1.5 text-xs font-semibold text-[#442c61]">
                      <Truck className="h-5 w-5 stroke-[2.25] text-[#9c44dc]" aria-hidden="true" />
                      <span className="font-mono tabular-nums">03. Flota Segura</span>
                    </div>
                    <h3 className="mt-4 text-balance font-display text-2xl font-semibold leading-[1.2] tracking-[-0.025em] text-[#442c61] sm:mt-5 sm:text-3xl">
                      Domicilios propios con verificación de identidad
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-[#543b6c] sm:text-base">
                      Asigna repartidores verificados con huella o rostro desde su dispositivo y
                      sigue cada ruta desde el despacho hasta la entrega final sin pagar porcentajes
                      por kilómetro.
                    </p>
                  </SpotlightCard>

                  <FeatureIllustrationCard kind="fleet" className="min-h-[260px] sm:min-h-[340px]" />
                </div>
              </LazyScrollSection>
            </div>
          </div>
        </div>
      </section>

      {/* 2B. Sección Clientes en Púrpura Real Vinchi (Carril izquierdo con Paloma Mensajera 3D) */}
      <section
        id="como-pedir"
        className="relative z-10 border-t border-[#9c44dc]/45 bg-gradient-to-br from-[#442c61]/80 via-[#543b6c]/74 to-[#442c61]/80 px-4 py-16 text-[#ffffff] sm:px-6 sm:py-24"
      >
        <div className="mx-auto max-w-[1280px] space-y-10 sm:space-y-12">
          <div data-focus-heading="como-pedir-1" className={getFocusStepClass('como-pedir-1')}>
            <LazyScrollSection
              skeleton={
                <div className="max-w-3xl space-y-3">
                  <SkeletonBlock className="h-3.5 w-40" />
                  <SkeletonBlock className="h-10 w-3/4" />
                  <SkeletonBlock className="h-4 w-1/2" />
                </div>
              }
            >
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div className="max-w-2xl">
                  <p className="inline-flex items-center gap-2 rounded-[10px] border border-[#bc8ae1]/40 bg-[#ffffff]/12 px-3 py-1 text-xs font-semibold tracking-[0.02em] text-[#fde68a]">
                    Experiencia para compradores
                  </p>
                  <BlurText
                    as="h2"
                    text="¿Cómo pedir en línea o desde la app?"
                    className="mt-2 text-balance font-display text-3xl font-semibold leading-[1.12] tracking-[-0.025em] text-[#ffffff] sm:text-5xl sm:tracking-[-0.05em]"
                  />
                  <p className="mt-3 text-sm text-[#e9d5ff] sm:text-base">
                    Comprar en tus restaurantes y comercios favoritos toma menos de un minuto, sin
                    recargos escondidos y directo con la tienda.
                  </p>
                </div>

                <Magnet padding={20} strength={0.18}>
                  <button
                    type="button"
                    onClick={() => handleNav('/(public)/cliente')}
                    className="vinchi-transition inline-flex min-h-[46px] w-fit items-center gap-2.5 rounded-[18px] bg-[#9c44dc] px-6 py-2.5 text-xs font-semibold text-[#ffffff] shadow-[0_8px_22px_-4px_rgba(156,68,220,0.65)] hover:bg-[#bc8ae1] hover:text-[#442c61] sm:text-sm shrink-0 cursor-pointer"
                  >
                    <ShoppingBag className="h-5 w-5 stroke-[2.25]" aria-hidden="true" />
                    <span>Pedir Ahora</span>
                  </button>
                </Magnet>
              </div>
            </LazyScrollSection>
          </div>

          <div ref={pigeonCorridorRef} className="relative space-y-10 sm:space-y-12 lg:pl-32">
            <ViewErrorBoundary fallback={null}>
              <PalomaMensajeraScroll3D corridorRef={pigeonCorridorRef} />
            </ViewErrorBoundary>

            {/* Paso Cliente 1 */}
            <div data-focus-step="como-pedir-1" className={getFocusStepClass('como-pedir-1')}>
              <LazyScrollSection skeleton={<FeaturePairSkeleton />}>
                <SpotlightCard
                  as="article"
                  spotlightColor="rgba(156, 68, 220, 0.14)"
                  className="grid items-center gap-6 rounded-[28px] border-2 border-[#bc8ae1]/75 bg-[#ffffff] p-5 text-[#0a0a0a] shadow-[0_16px_38px_-12px_rgba(20,10,36,0.45)] sm:p-8 lg:grid-cols-12"
                >
                  <div className="space-y-3 lg:col-span-7">
                    <span className="inline-flex items-center gap-2 rounded-[10px] bg-[#bc8ae1]/28 px-3.5 py-1.5 font-mono text-xs font-semibold text-[#442c61]">
                      Paso 01 · Elige tu antojo
                    </span>
                    <h3 className="font-display text-2xl font-semibold tracking-[-0.025em] text-[#442c61] sm:text-3xl">
                      Explora la carta o tienda en línea al instante
                    </h3>
                    <p className="text-sm leading-relaxed text-[#543b6c] sm:text-base">
                      Entra a <strong>Pedir Ahora</strong> desde el enlace del comercio o tu
                      teléfono, revisa platos, precios reales, acompañamientos y combos disponibles en
                      segundos.
                    </p>
                  </div>
                  <div className="lg:col-span-5">
                    <FeatureIllustrationCard
                      kind="client_browse"
                      className="border-[#bc8ae1]/45 bg-[#faf5ff]"
                    />
                  </div>
                </SpotlightCard>
              </LazyScrollSection>
            </div>

            {/* Paso Cliente 2 */}
            <div data-focus-step="como-pedir-2" className={getFocusStepClass('como-pedir-2')}>
              <LazyScrollSection skeleton={<FeaturePairSkeleton />}>
                <SpotlightCard
                  as="article"
                  spotlightColor="rgba(156, 68, 220, 0.14)"
                  className="grid items-center gap-6 rounded-[28px] border-2 border-[#bc8ae1]/75 bg-[#ffffff] p-5 text-[#0a0a0a] shadow-[0_16px_38px_-12px_rgba(20,10,36,0.45)] sm:p-8 lg:grid-cols-12"
                >
                  <div className="space-y-3 lg:col-span-7">
                    <span className="inline-flex items-center gap-2 rounded-[10px] bg-[#9c44dc]/16 px-3.5 py-1.5 font-mono text-xs font-semibold text-[#9c44dc]">
                      Paso 02 · Confirma sin recargos
                    </span>
                    <h3 className="font-display text-2xl font-semibold tracking-[-0.025em] text-[#442c61] sm:text-3xl">
                      Personaliza y envía tu pedido directo a cocina
                    </h3>
                    <p className="text-sm leading-relaxed text-[#543b6c] sm:text-base">
                      Elige entrega a domicilio o consumo en mesa, agrega indicaciones especiales y
                      confirma con tarifa justa desde el primer producto hasta el total final.
                    </p>
                  </div>
                  <div className="lg:col-span-5">
                    <FeatureIllustrationCard
                      kind="client_checkout"
                      className="border-[#bc8ae1]/45 bg-[#faf5ff]"
                    />
                  </div>
                </SpotlightCard>
              </LazyScrollSection>
            </div>

            {/* Paso Cliente 3 */}
            <div data-focus-step="como-pedir-3" className={getFocusStepClass('como-pedir-3')}>
              <LazyScrollSection skeleton={<FeaturePairSkeleton />}>
                <SpotlightCard
                  as="article"
                  spotlightColor="rgba(156, 68, 220, 0.14)"
                  className="grid items-center gap-6 rounded-[28px] border-2 border-[#bc8ae1]/75 bg-[#ffffff] p-5 text-[#0a0a0a] shadow-[0_16px_38px_-12px_rgba(20,10,36,0.45)] sm:p-8 lg:grid-cols-12"
                >
                  <div className="space-y-3 lg:col-span-7">
                    <span className="inline-flex items-center gap-2 rounded-[10px] bg-[#442c61]/12 px-3.5 py-1.5 font-mono text-xs font-semibold text-[#442c61]">
                      Paso 03 · Entrega segura
                    </span>
                    <h3 className="font-display text-2xl font-semibold tracking-[-0.025em] text-[#442c61] sm:text-3xl">
                      Sigue tu compra hasta la puerta de tu casa
                    </h3>
                    <p className="text-sm leading-relaxed text-[#543b6c] sm:text-base">
                      Cuando el repartidor esté a menos de 5 km se habilita un chat directo para
                      coordinar tu entrega, y solo se cierra cuando confirmas con tu código personal.
                    </p>
                  </div>
                  <div className="lg:col-span-5">
                    <FeatureIllustrationCard
                      kind="client_tracking"
                      className="border-[#bc8ae1]/45 bg-[#faf5ff]"
                    />
                  </div>
                </SpotlightCard>
              </LazyScrollSection>
            </div>
          </div>
        </div>
      </section>

      {/* 2C. Sección Empresarios: Cómo operan los dueños de negocio (Carril derecho con Corbata 3D) */}
      <section
        id="para-empresarios"
        className="relative z-10 border-t border-[#bc8ae1]/50 bg-gradient-to-b from-[#f3e8ff]/38 via-[#faf5ff]/28 to-[#ede9fe]/40 px-4 py-16 sm:px-6 sm:py-24"
      >
        <div className="mx-auto max-w-[1280px] space-y-10 sm:space-y-12">
          <div
            data-focus-heading="para-empresarios-1"
            className={getFocusStepClass('para-empresarios-1')}
          >
            <LazyScrollSection
              skeleton={
                <div className="max-w-3xl space-y-3">
                  <SkeletonBlock className="h-3.5 w-40" />
                  <SkeletonBlock className="h-10 w-3/4" />
                  <SkeletonBlock className="h-4 w-1/2" />
                </div>
              }
            >
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div className="max-w-2xl">
                  <p className="inline-flex items-center gap-2 rounded-[10px] bg-[#442c61]/10 px-3 py-1 text-xs font-semibold tracking-[0.02em] text-[#442c61]">
                    Gestión para dueños y empresarios
                  </p>
                  <BlurText
                    as="h2"
                    text="¿Cómo operan los empresarios dentro de la app?"
                    className="mt-2 text-balance font-display text-3xl font-semibold leading-[1.12] tracking-[-0.025em] text-[#442c61] sm:text-5xl sm:tracking-[-0.05em]"
                  />
                  <p className="mt-3 text-sm text-[#543b6c] sm:text-base">
                    Toma el control completo de tus ingresos, mesas, cajas y domicilios manteniendo
                    el 100% de cada venta para tu empresa.
                  </p>
                </div>

                <Magnet padding={20} strength={0.18}>
                  <button
                    type="button"
                    onClick={
                      hasSpacePermission
                        ? () => handleNav('/(dashboards)/comercio')
                        : onExploreAgentsClick ?? (() => handleNav('/(portal)/explorar-agentes'))
                    }
                    className="vinchi-transition inline-flex min-h-[46px] w-fit items-center gap-2.5 rounded-[18px] bg-[#442c61] px-6 py-2.5 text-xs font-semibold text-[#ffffff] shadow-[0_8px_22px_-6px_rgba(68,44,97,0.45)] hover:bg-[#9c44dc] sm:text-sm shrink-0 cursor-pointer"
                  >
                    <Store className="h-5 w-5 stroke-[2.25]" aria-hidden="true" />
                    <span>{hasSpacePermission ? 'Ir a mi espacio' : 'Activar mi negocio'}</span>
                  </button>
                </Magnet>
              </div>
            </LazyScrollSection>
          </div>

          <div ref={tieCorridorRef} className="relative space-y-10 sm:space-y-12 lg:pr-32">
            <ViewErrorBoundary fallback={null}>
              <CorbataEmpresarioScroll3D corridorRef={tieCorridorRef} />
            </ViewErrorBoundary>

            {/* Bloque Empresario 1 */}
            <div
              data-focus-step="para-empresarios-1"
              className={getFocusStepClass('para-empresarios-1')}
            >
              <LazyScrollSection skeleton={<FeaturePairSkeleton reversed />}>
                <SpotlightCard
                  as="article"
                  spotlightColor="rgba(156, 68, 220, 0.12)"
                  className="grid items-center gap-6 rounded-[28px] border-2 border-[#bc8ae1]/70 bg-gradient-to-br from-[#ffffff] to-[#faf5ff] p-5 shadow-[0_12px_30px_-10px_rgba(68,44,97,0.16)] sm:p-8 lg:grid-cols-12"
                >
                  <div className="order-2 lg:order-1 lg:col-span-5">
                    <FeatureIllustrationCard
                      kind="biz_launch"
                      className="border-[#bc8ae1]/45 bg-[#faf5ff]"
                    />
                  </div>
                  <div className="order-1 space-y-3 lg:order-2 lg:col-span-7">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="inline-flex items-center rounded-[10px] bg-[#442c61] px-3.5 py-1.5 font-mono text-xs font-semibold text-[#ffffff]">
                        01 · Apertura acompañada
                      </span>
                      <span className="font-mono text-xs font-semibold text-[#9c44dc]">
                        Activación en el día
                      </span>
                    </div>
                    <h3 className="font-display text-2xl font-semibold tracking-[-0.025em] text-[#442c61] sm:text-3xl">
                      Vincula tu empresa con respaldo comercial real
                    </h3>
                    <p className="text-sm leading-relaxed text-[#543b6c] sm:text-base">
                      Un agente certificado configura contigo tu catálogo, verifica tu local de
                      forma virtual o presencial y te entrega tu código de activación para empezar a
                      vender sin fricciones.
                    </p>
                  </div>
                </SpotlightCard>
              </LazyScrollSection>
            </div>

            {/* Bloque Empresario 2 */}
            <div
              data-focus-step="para-empresarios-2"
              className={getFocusStepClass('para-empresarios-2')}
            >
              <LazyScrollSection skeleton={<FeaturePairSkeleton reversed />}>
                <SpotlightCard
                  as="article"
                  spotlightColor="rgba(156, 68, 220, 0.12)"
                  className="grid items-center gap-6 rounded-[28px] border-2 border-[#bc8ae1]/70 bg-gradient-to-br from-[#ffffff] to-[#faf5ff] p-5 shadow-[0_12px_30px_-10px_rgba(68,44,97,0.16)] sm:p-8 lg:grid-cols-12"
                >
                  <div className="order-2 lg:order-1 lg:col-span-5">
                    <FeatureIllustrationCard
                      kind="biz_control"
                      className="border-[#bc8ae1]/45 bg-[#faf5ff]"
                    />
                  </div>
                  <div className="order-1 space-y-3 lg:order-2 lg:col-span-7">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="inline-flex items-center rounded-[10px] bg-[#9c44dc] px-3.5 py-1.5 font-mono text-xs font-semibold text-[#ffffff]">
                        02 · Rentabilidad directa
                      </span>
                      <span className="font-mono text-xs font-semibold text-[#9c44dc]">
                        0% comisión por orden
                      </span>
                    </div>
                    <h3 className="font-display text-2xl font-semibold tracking-[-0.025em] text-[#442c61] sm:text-3xl">
                      Dirige cajas, mesas y ganancias en un solo lugar
                    </h3>
                    <p className="text-sm leading-relaxed text-[#543b6c] sm:text-base">
                      Supervisa órdenes de salón y envíos en vivo, asigna códigos de acceso para tus
                      cajeros y conserva la totalidad de tus utilidades pagando solo tu plan elegido.
                    </p>
                  </div>
                </SpotlightCard>
              </LazyScrollSection>
            </div>

            {/* Bloque Empresario 3 */}
            <div
              data-focus-step="para-empresarios-3"
              className={getFocusStepClass('para-empresarios-3')}
            >
              <LazyScrollSection skeleton={<FeaturePairSkeleton reversed />}>
                <SpotlightCard
                  as="article"
                  spotlightColor="rgba(156, 68, 220, 0.12)"
                  className="grid items-center gap-6 rounded-[28px] border-2 border-[#bc8ae1]/70 bg-gradient-to-br from-[#ffffff] to-[#faf5ff] p-5 shadow-[0_12px_30px_-10px_rgba(68,44,97,0.16)] sm:p-8 lg:grid-cols-12"
                >
                  <div className="order-2 lg:order-1 lg:col-span-5">
                    <FeatureIllustrationCard
                      kind="biz_scale"
                      className="border-[#bc8ae1]/45 bg-[#faf5ff]"
                    />
                  </div>
                  <div className="order-1 space-y-3 lg:order-2 lg:col-span-7">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="inline-flex items-center rounded-[10px] bg-[#442c61] px-3.5 py-1.5 font-mono text-xs font-semibold text-[#ffffff]">
                        03 · Despacho y expansión
                      </span>
                      <span className="font-mono text-xs font-semibold text-[#9c44dc]">
                        Códigos de entrega seguros
                      </span>
                    </div>
                    <h3 className="font-display text-2xl font-semibold tracking-[-0.025em] text-[#442c61] sm:text-3xl">
                      Escala tus envíos con repartidores contratados y trazables
                    </h3>
                    <p className="text-sm leading-relaxed text-[#543b6c] sm:text-base">
                      Cada pedido sale de tu local con código de recogida y confirmación final al
                      cliente, dándote tranquilidad operativa mientras creces en una o múltiples
                      sedes.
                    </p>
                  </div>
                </SpotlightCard>
              </LazyScrollSection>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Sección "Nuestros Agentes" con Lazy Scroll */}
      <section
        id="agentes"
        className="relative z-10 overflow-hidden border-t border-[#bc8ae1]/50 bg-gradient-to-b from-[#faf5ff]/34 via-[#f3e8ff]/28 to-[#ede9fe]/36 px-4 py-16 sm:px-6 sm:py-24"
      >
        <div className="pointer-events-none absolute inset-0 -z-10">
          <Suspense fallback={<Canvas3DSkeleton className="h-full w-full rounded-none border-0" />}>
            <Showcase3D
              scene="agents"
              transparent
              className="h-full w-full rounded-none border-0 shadow-none"
            />
          </Suspense>
        </div>

        <div data-focus-step="agentes-1" className={getFocusStepClass('agentes-1')}>
          <LazyScrollSection
            skeleton={
              <div className="mx-auto max-w-3xl rounded-[24px] border border-[#bc8ae1]/60 bg-[#ffffff] p-8 sm:p-14">
                <div className="mx-auto flex flex-col items-center space-y-4">
                  <SkeletonBlock className="h-6 w-48 rounded-[18px]" />
                  <SkeletonBlock className="h-10 w-64" />
                  <SkeletonBlock className="h-4 w-full max-w-lg" />
                  <SkeletonBlock className="h-4 w-5/6 max-w-md" />
                  <SkeletonBlock className="mt-4 h-11 w-52 rounded-[18px]" />
                </div>
              </div>
            }
          >
            <SpotlightCard
              spotlightColor="rgba(156, 68, 220, 0.14)"
              className="relative z-10 mx-auto max-w-3xl rounded-[28px] border-2 border-[#9c44dc]/55 bg-gradient-to-br from-[#ffffff] via-[#faf5ff] to-[#f3e8ff]/95 p-6 text-center shadow-[0_16px_42px_-12px_rgba(68,44,97,0.20)] sm:p-14"
            >
              <div className="mx-auto inline-flex items-center gap-2 rounded-[10px] border border-[#bc8ae1]/50 bg-[#9c44dc]/10 px-3.5 py-1.5 text-xs font-semibold text-[#442c61]">
                <ShieldCheck className="h-5 w-5 stroke-[2.25] text-[#9c44dc]" aria-hidden="true" />
                <span>Red comercial territorial</span>
              </div>

              <BlurText
                as="h2"
                text="Nuestros Agentes"
                className="mt-3 text-balance font-display text-3xl font-semibold leading-[1.08] tracking-[-0.04em] text-[#442c61] sm:mt-4 sm:text-5xl"
              />

              <p className="mt-4 text-sm leading-relaxed text-[#543b6c] sm:text-base">
                Cada comercio se incorpora acompañado por un agente Vinchi certificado. El cobro
                único de activación (Setup Fee de{' '}
                <span className="font-mono tabular-nums font-semibold text-[#442c61]">
                  <CountUp to={setupFeeCop} formatter={formatCop} /> COP
                </span>
                ) cubre el despliegue inicial del catálogo, la vinculación del local y el
                acompañamiento presencial para que empieces a operar el mismo día.
              </p>

              <div className="mt-7 flex flex-wrap items-center justify-center gap-3 sm:mt-8">
                <Magnet padding={24} strength={0.2}>
                  <button
                    type="button"
                    onClick={onExploreAgentsClick ?? (() => handleNav('/(portal)/explorar-agentes'))}
                    className="vinchi-transition inline-flex min-h-[48px] items-center gap-2.5 rounded-[18px] bg-[#9c44dc] px-6 py-2.5 text-sm font-semibold text-[#ffffff] shadow-[0_8px_22px_-6px_rgba(156,68,220,0.55)] hover:bg-[#442c61] whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <span>Explorar Portal Agentes</span>
                    <ArrowRight className="h-5 w-5 stroke-[2.3]" aria-hidden="true" />
                  </button>
                </Magnet>
              </div>
            </SpotlightCard>
          </LazyScrollSection>
        </div>

        {/* Botones de acción rápida debajo de la card de Nuestros Agentes */}
        <div
          data-focus-step="agentes-2"
          className={`${getFocusStepClass('agentes-2')} relative z-10 mx-auto mt-10 max-w-4xl sm:mt-12`}
        >
          <LazyScrollSection
            skeleton={
              <div className="grid gap-4 sm:grid-cols-3">
                <SkeletonBlock className="h-44 w-full rounded-[24px]" />
                <SkeletonBlock className="h-44 w-full rounded-[24px]" />
                <SkeletonBlock className="h-44 w-full rounded-[24px]" />
              </div>
            }
          >
            <div className="grid gap-4 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => handleNav('/(public)/cliente')}
                className="vinchi-transition group flex flex-col justify-between rounded-[24px] border-2 border-[#bc8ae1]/70 bg-gradient-to-br from-[#ffffff] to-[#faf5ff] p-6 text-left shadow-[0_10px_28px_-10px_rgba(68,44,97,0.14)] hover:-translate-y-0.5 hover:border-[#9c44dc] cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#9c44dc]/14 text-[#9c44dc]">
                      <ShoppingBag className="h-5 w-5 stroke-[2.25]" aria-hidden="true" />
                    </span>
                    <span className="font-mono tabular-nums text-[11px] font-semibold text-[#9c44dc]">
                      0% recargo
                    </span>
                  </div>
                  <p className="mt-4 font-display text-lg font-semibold tracking-[-0.02em] text-[#442c61]">
                    Pedir ahora
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-[#543b6c]">
                    Explora la carta interactiva y ordena en mesa o domicilio sin intermediarios.
                  </p>
                </div>
                <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-[#9c44dc] group-hover:text-[#442c61]">
                  <span>Explorar menú</span>
                  <ArrowRight
                    className="h-4.5 w-4.5 stroke-[2.3] transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </span>
              </button>

              <button
                type="button"
                onClick={
                  hasAgentPermission
                    ? () => handleNav('/(dashboards)/agente')
                    : hasCourierPermission
                      ? () => handleNav('/(dashboards)/repartidor')
                      : onWorkClick ?? (() => handleNav('/(auth)/login'))
                }
                className="vinchi-transition group flex flex-col justify-between rounded-[24px] border-2 border-[#bc8ae1]/70 bg-gradient-to-br from-[#ffffff] to-[#faf5ff] p-6 text-left shadow-[0_10px_28px_-10px_rgba(68,44,97,0.14)] hover:-translate-y-0.5 hover:border-[#9c44dc] cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#442c61] text-[#ffffff]">
                      {hasCourierPermission ? (
                        <Truck className="h-5 w-5 stroke-[2.25]" aria-hidden="true" />
                      ) : (
                        <Briefcase className="h-5 w-5 stroke-[2.25]" aria-hidden="true" />
                      )}
                    </span>
                    <span className="font-mono text-[11px] font-semibold text-[#442c61]">
                      {hasAgentPermission
                        ? 'Agente aprobado'
                        : hasCourierPermission
                          ? 'Domicilio activo'
                          : 'Flota y agentes'}
                    </span>
                  </div>
                  <p className="mt-4 font-display text-lg font-semibold tracking-[-0.02em] text-[#442c61]">
                    {hasAgentPermission
                      ? 'Mi Portal Agente'
                      : hasCourierPermission
                        ? 'Mi Portal Domicilio'
                        : 'Trabajar con Vinchi'}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-[#543b6c]">
                    {hasAgentPermission
                      ? 'Entra directamente a tus solicitudes, chat comercial, estadísticas y billetera.'
                      : hasCourierPermission
                        ? 'Entra directamente a tu mapa de entregas, chat en ruta y ganancias.'
                        : 'Únete como repartidor verificado o impulsa comercios en tu zona.'}
                  </p>
                </div>
                <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-[#442c61] group-hover:text-[#9c44dc]">
                  <span>
                    {hasAgentPermission || hasCourierPermission
                      ? 'Entrar a mi portal privado'
                      : 'Postularme ahora'}
                  </span>
                  <ArrowRight
                    className="h-4.5 w-4.5 stroke-[2.3] transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </span>
              </button>

              <button
                type="button"
                onClick={
                  hasSpacePermission
                    ? () => handleNav('/(dashboards)/comercio')
                    : onExploreAgentsClick ?? (() => handleNav('/(portal)/explorar-agentes'))
                }
                className="vinchi-transition group flex flex-col justify-between rounded-[24px] border-2 border-[#9c44dc]/70 bg-gradient-to-br from-[#ffffff] to-[#f3e8ff] p-6 text-left shadow-[0_10px_28px_-10px_rgba(156,68,220,0.22)] hover:-translate-y-0.5 hover:border-[#442c61] cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#9c44dc] text-[#ffffff]">
                      <Store className="h-5 w-5 stroke-[2.25]" aria-hidden="true" />
                    </span>
                    <span className="font-mono text-[11px] font-semibold text-[#442c61]">
                      {hasSpacePermission
                        ? 'Empresario activo'
                        : isWaitingEntrepreneur
                          ? 'Empresario en espera'
                          : 'Para comercios'}
                    </span>
                  </div>
                  <p className="mt-4 font-display text-lg font-semibold tracking-[-0.02em] text-[#442c61]">
                    {hasSpacePermission
                      ? 'Mi espacio privado'
                      : isWaitingEntrepreneur
                        ? 'Mi espacio en espera'
                        : 'Crear mi espacio'}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-[#543b6c]">
                    {hasSpacePermission
                      ? 'Abre tu panel privado de ventas, órdenes en mesa y control de despacho.'
                      : isWaitingEntrepreneur
                        ? 'Vuelve al portal para esperar a tu agente certificado o ingresar tu token de Empresario.'
                        : 'Digitaliza tu restaurante o tienda con carta en mesa, control de caja y flota propia.'}
                  </p>
                </div>
                <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-[#9c44dc] group-hover:text-[#442c61]">
                  <span>
                    {hasSpacePermission
                      ? 'Ir a mi espacio'
                      : isWaitingEntrepreneur
                        ? 'Entrar a esperar / activar token'
                        : 'Activar mi local'}
                  </span>
                  <ArrowRight
                    className="h-4.5 w-4.5 stroke-[2.3] transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </span>
              </button>
            </div>
          </LazyScrollSection>
        </div>
      </section>

      {/* 4. Sección de Planes con Pago Mensual / Anual */}
      <section
        id="planes"
        className="relative z-10 border-t border-[#bc8ae1]/50 bg-gradient-to-b from-[#ede9fe]/36 via-[#f3e8ff]/38 to-[#faf5ff]/46 px-4 py-14 sm:px-6 sm:py-20"
      >
        <div
          data-focus-step="planes-1"
          className={`${getFocusStepClass('planes-1')} mx-auto max-w-[1280px] space-y-6 sm:space-y-8`}
        >
          <LazyScrollSection
            skeleton={
              <div className="max-w-3xl space-y-3">
                <SkeletonBlock className="h-3.5 w-40" />
                <SkeletonBlock className="h-10 w-3/4" />
                <SkeletonBlock className="h-4 w-1/2" />
              </div>
            }
          >
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="inline-flex items-center gap-2 rounded-[10px] bg-[#9c44dc]/12 px-3 py-1 text-xs font-semibold tracking-[0.02em] text-[#9c44dc]">
                  Suscripciones flexibles
                </p>
                <BlurText
                  as="h2"
                  text="Cero comisiones en todos los planes"
                  className="mt-2 text-balance font-display text-3xl font-semibold leading-[1.12] tracking-[-0.025em] text-[#442c61] sm:text-5xl sm:tracking-[-0.05em]"
                />
                <p className="mt-3 text-sm text-[#543b6c] sm:text-base">
                  Elige pago mensual o anual según la etapa de tu restaurante o supermercado.
                </p>
              </div>

              {/* Botón de cambio Mensual / Anual */}
              <div className="flex flex-col items-start gap-2 lg:items-end">
                <div
                  role="group"
                  aria-label="Frecuencia de pago"
                  className="inline-flex gap-1.5 rounded-[18px] border-2 border-[#bc8ae1] bg-[#ffffff] p-1.5 shadow-[0_6px_18px_-6px_rgba(68,44,97,0.14)]"
                >
                  <button
                    type="button"
                    onClick={() => setBillingCycle('mensual')}
                    className={`vinchi-transition min-h-[42px] rounded-[13px] px-5 py-2 text-xs font-semibold sm:text-sm cursor-pointer ${
                      billingCycle === 'mensual'
                        ? 'bg-[#442c61] text-[#ffffff]'
                        : 'text-[#543b6c] hover:bg-[#faf5ff] hover:text-[#442c61]'
                    }`}
                  >
                    Pago mensual
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingCycle('anual')}
                    className={`vinchi-transition inline-flex min-h-[42px] items-center gap-2 rounded-[13px] px-5 py-2 text-xs font-semibold sm:text-sm cursor-pointer ${
                      billingCycle === 'anual'
                        ? 'bg-[#9c44dc] text-[#ffffff]'
                        : 'text-[#543b6c] hover:bg-[#faf5ff] hover:text-[#442c61]'
                    }`}
                  >
                    <span>Pago anual</span>
                    <span
                      className={`rounded-[6px] px-2 py-0.5 text-[11px] font-semibold ${
                        billingCycle === 'anual'
                          ? 'bg-[#ffffff]/20 text-[#ffffff]'
                          : 'bg-[#bc8ae1]/28 text-[#442c61]'
                      }`}
                    >
                      <ShinyText
                        text="Hasta 3 meses gratis"
                        tone={billingCycle === 'anual' ? 'light' : 'orchid'}
                      />
                    </span>
                  </button>
                </div>
                <p className="text-xs text-[#543b6c]">
                  {billingCycle === 'anual'
                    ? 'Ahorro aplicado en Premium (1 mes gratis) y Ultra (3 meses gratis).'
                    : 'Cambia a anual para ahorrar en Premium y llevarte 3 meses gratis en Ultra.'}
                </p>
              </div>
            </div>
          </LazyScrollSection>

          <LazyScrollSection skeleton={<PlansGridSkeleton />}>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => {
                const isMostChosen = Boolean(plan.highlighted);
                const isUltra = plan.id === 'ultra';
                const isAnnual = billingCycle === 'anual';
                const hasPaidAnnual = isAnnual && plan.priceCop > 0 && plan.annualPriceCop !== undefined;
                const displayPrice =
                  isAnnual && plan.annualPriceCop !== undefined ? plan.annualPriceCop : plan.priceCop;
                const displayCycle = isAnnual
                  ? plan.priceCop > 0
                    ? 'COP / año'
                    : '/ año'
                  : plan.billingCycle;

                return (
                  <SpotlightCard
                    as="article"
                    key={plan.id}
                    spotlightColor={
                      isMostChosen
                        ? 'rgba(156, 68, 220, 0.16)'
                        : isUltra
                          ? 'rgba(68, 44, 97, 0.14)'
                          : 'rgba(188, 138, 225, 0.16)'
                    }
                    className={`vinchi-transition flex flex-col justify-between rounded-[24px] p-6 sm:p-7 ${
                      isMostChosen
                        ? 'border-2 border-[#9c44dc] bg-gradient-to-b from-[#ffffff] to-[#faf5ff] shadow-[0_14px_34px_-8px_rgba(156,68,220,0.22)]'
                        : isUltra
                          ? 'border-2 border-[#442c61] bg-gradient-to-b from-[#faf5ff] to-[#f3e8ff] shadow-[0_14px_34px_-8px_rgba(68,44,97,0.20)] md:col-span-2 lg:col-span-1'
                          : 'border-2 border-[#bc8ae1]/70 bg-[#ffffff] shadow-[0_8px_24px_-8px_rgba(68,44,97,0.12)]'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-medium text-[#543b6c]">
                            {plan.targetAudience}
                          </p>
                          <h3 className="mt-1 font-display text-2xl font-semibold tracking-[-0.025em] text-[#442c61]">
                            {plan.name}
                          </h3>
                        </div>
                        {plan.badgeLabel && (
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-[8px] px-3 py-1 text-xs font-semibold shrink-0 ${
                              isMostChosen
                                ? 'bg-[#9c44dc] text-[#ffffff]'
                                : 'bg-[#442c61] text-[#ffffff]'
                            }`}
                          >
                            {isUltra && <Sparkles className="h-4 w-4 stroke-[2.25] text-[#fde68a]" aria-hidden="true" />}
                            <span>{plan.badgeLabel}</span>
                          </span>
                        )}
                      </div>

                      <div className="mt-6">
                        {hasPaidAnnual && (
                          <p className="mb-1 text-xs font-medium text-[#543b6c]/75">
                            Antes{' '}
                            <span className="font-mono line-through">
                              {formatCop(plan.priceCop * 12)}
                            </span>{' '}
                            / año
                          </p>
                        )}
                        <div className="flex flex-wrap items-baseline gap-2">
                          <span className="font-mono tabular-nums text-3xl font-semibold tracking-[-0.03em] text-[#442c61] sm:text-4xl">
                            <CountUp to={displayPrice} formatter={formatCop} durationMs={460} />
                          </span>
                          <span className="text-sm text-[#543b6c]">{displayCycle}</span>
                        </div>

                        {plan.priceCop > 0 && (
                          <div
                            className={`mt-3 rounded-[10px] px-3 py-2 text-xs ${
                              isAnnual
                                ? isUltra
                                  ? 'border border-[#442c61]/30 bg-[#442c61]/10 text-[#442c61]'
                                  : 'border border-[#9c44dc]/35 bg-[#bc8ae1]/20 text-[#442c61]'
                                : 'border border-[#bc8ae1]/40 bg-[#faf5ff] text-[#543b6c]'
                            }`}
                          >
                            {isAnnual ? (
                              <>
                                <p className="font-semibold text-[#442c61]">
                                  {plan.annualSavingsLabel}
                                </p>
                                {plan.annualSubnote && (
                                  <p className="mt-0.5 text-[11px] text-[#543b6c]">
                                    {plan.annualSubnote}
                                  </p>
                                )}
                              </>
                            ) : (
                              <p className="text-xs">
                                {isUltra
                                  ? 'Plan anual disponible con 3 meses gratis incluidos.'
                                  : 'Plan anual disponible con 1 mes gratis de ahorro.'}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <p className="mt-4 text-sm leading-relaxed text-[#543b6c]">
                        {plan.description}
                      </p>

                      {plan.featuredCapability && (
                        <div className="mt-5 rounded-[12px] border border-[#9c44dc]/30 bg-[#9c44dc]/10 px-4 py-3 text-xs font-medium text-[#442c61]">
                          Diferenciador clave:{' '}
                          <span className="font-semibold text-[#442c61]">
                            {plan.featuredCapability}
                          </span>
                        </div>
                      )}

                      <ul className="mt-6 space-y-3 border-t border-[#bc8ae1]/40 pt-6 text-sm text-[#171717]">
                        {plan.limits.map((item) => (
                          <li key={item} className="flex items-start gap-3">
                            <Check
                              className={`mt-0.5 h-4.5 w-4.5 shrink-0 stroke-[2.5] ${
                                isUltra ? 'text-[#442c61]' : 'text-[#9c44dc]'
                              }`}
                              aria-hidden="true"
                            />
                            <span>{item}</span>
                          </li>
                        ))}
                        {plan.excluded?.map((item) => (
                          <li key={item} className="flex items-start gap-3 text-[#543b6c]/75">
                            <X
                              className="mt-0.5 h-4.5 w-4.5 shrink-0 stroke-[2.25] text-[#543b6c]/60"
                              aria-hidden="true"
                            />
                            <span className="line-through decoration-[#543b6c]/40">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        onSelectPlan ? onSelectPlan(plan.id) : handleNav('/(auth)/login')
                      }
                      className={`vinchi-transition mt-8 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[18px] px-5 py-2.5 text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
                        isMostChosen
                          ? 'bg-[#9c44dc] text-[#ffffff] hover:bg-[#543b6c]'
                          : isUltra
                            ? 'bg-[#442c61] text-[#ffffff] hover:bg-[#9c44dc]'
                            : 'border-2 border-[#bc8ae1] bg-[#faf5ff] text-[#442c61] hover:border-[#9c44dc] hover:bg-[#9c44dc] hover:text-[#ffffff]'
                      }`}
                    >
                      <span>
                        {isAnnual && plan.priceCop > 0
                          ? `Comprar ${plan.name} anual`
                          : `Seleccionar ${plan.name}`}
                      </span>
                      <ArrowRight className="h-5 w-5 stroke-[2.25]" aria-hidden="true" />
                    </button>
                  </SpotlightCard>
                );
              })}
            </div>
          </LazyScrollSection>
        </div>
      </section>

      {/* 5. Footer corporativo en Púrpura Real Vinchi */}
      <div data-focus-step="footer" className={getFocusStepClass('footer')}>
        <LazyScrollSection
          skeleton={
            <div className="border-t border-[#9c44dc]/45 bg-[#442c61] px-6 py-12">
              <div className="mx-auto max-w-[1280px] space-y-4">
                <SkeletonBlock className="h-6 w-24" />
                <SkeletonBlock className="h-4 w-64" />
              </div>
            </div>
          }
        >
          <footer className="relative z-10 border-t border-[#9c44dc]/50 bg-[#442c61] px-4 py-12 text-[#ffffff] sm:px-6 sm:py-14">
            <div className="mx-auto flex max-w-[1280px] flex-col items-start justify-between gap-8 md:flex-row md:items-center">
              <div>
                <span className="font-display text-2xl font-bold tracking-[-0.04em] text-[#ffffff]">
                  vinchi
                </span>
                <p className="mt-1.5 text-sm text-[#e9d5ff]">
                  Soluciones para restaurantes, supermercados y comercios locales.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-sm text-[#e9d5ff]">
                <button
                  type="button"
                  onClick={() => handleNav('/(auth)/login')}
                  className="vinchi-transition min-h-[42px] rounded-[12px] px-3 py-1.5 hover:bg-[#ffffff]/10 hover:text-[#ffffff] cursor-pointer"
                >
                  Acceso Unificado
                </button>
                <button
                  type="button"
                  onClick={() => handleNav('/(dashboards)/comercio')}
                  className="vinchi-transition min-h-[42px] rounded-[12px] px-3 py-1.5 hover:bg-[#ffffff]/10 hover:text-[#ffffff] cursor-pointer"
                >
                  Panel Comercio
                </button>
                <button
                  type="button"
                  onClick={onExploreAgentsClick ?? (() => handleNav('/(portal)/explorar-agentes'))}
                  className="vinchi-transition min-h-[42px] rounded-[12px] px-3 py-1.5 hover:bg-[#ffffff]/10 hover:text-[#ffffff] cursor-pointer"
                >
                  Portal Agentes
                </button>
                <button
                  type="button"
                  onClick={() => handleNav('/(dashboards)/repartidor')}
                  className="vinchi-transition min-h-[42px] rounded-[12px] px-3 py-1.5 hover:bg-[#ffffff]/10 hover:text-[#ffffff] cursor-pointer"
                >
                  App Domiciliario
                </button>
                <button
                  type="button"
                  onClick={() => handleNav('/(dashboards)/admin')}
                  className="vinchi-transition min-h-[42px] rounded-[12px] px-3 py-1.5 hover:bg-[#ffffff]/10 hover:text-[#ffffff] cursor-pointer"
                >
                  Superadmin
                </button>
                <button
                  type="button"
                  onClick={() => handleNav('/(public)/cliente')}
                  className="vinchi-transition min-h-[42px] rounded-[12px] px-3 py-1.5 font-semibold text-[#fde68a] hover:bg-[#9c44dc] hover:text-[#ffffff] cursor-pointer"
                >
                  Carta Interactiva
                </button>
                <button
                  type="button"
                  onClick={() => setShowDocsModal(true)}
                  className="vinchi-transition min-h-[42px] rounded-[12px] border border-[#bc8ae1]/40 bg-[#ffffff]/10 px-3 py-1.5 font-semibold text-[#ffffff] hover:bg-[#9c44dc] cursor-pointer"
                >
                  SRS y Docs Drive
                </button>
              </div>
            </div>

            <div className="mx-auto mt-8 max-w-[1280px] border-t border-[#bc8ae1]/25 pt-6 text-xs text-[#d8b4fe]">
              © {new Date().getFullYear()} Vinchi. Todos los derechos reservados.
            </div>
          </footer>
        </LazyScrollSection>
      </div>

      <VinchiDocsDriveModal open={showDocsModal} onClose={() => setShowDocsModal(false)} />
    </ClickSpark>
  );
}
