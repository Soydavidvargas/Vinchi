'use client';

interface SkeletonBlockProps {
  className?: string;
}

export function SkeletonBlock({ className = '' }: SkeletonBlockProps) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-[10px] bg-[#bc8ae1]/18 ${className}`}
    />
  );
}

export function Canvas3DSkeleton({ className = 'min-h-[260px] sm:min-h-[340px]' }: SkeletonBlockProps) {
  return (
    <div
      aria-hidden="true"
      className={`relative flex w-full items-center justify-center overflow-hidden rounded-[24px] border border-[#e5e5e5] bg-[#fafafa] p-6 shadow-[0_0_0_1px_rgba(68,44,97,0.08),0_1px_3px_0_rgba(68,44,97,0.08)] ${className}`}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="h-24 w-24 animate-pulse rounded-full border-2 border-[#bc8ae1]/40 bg-[#bc8ae1]/18" />
        <div className="h-3 w-32 animate-pulse rounded-[18px] bg-[#d0b7b0]/40" />
      </div>
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div
      aria-label="Cargando contenido principal"
      className="mx-auto grid w-full max-w-[1280px] items-center gap-8 lg:grid-cols-12"
    >
      <div className="rounded-[24px] border border-[#e5e5e5] bg-[#ffffff]/90 p-6 shadow-[0_0_0_1px_rgba(68,44,97,0.08),0_1px_3px_0_rgba(68,44,97,0.08)] sm:p-10 lg:col-span-7 lg:p-12">
        <SkeletonBlock className="h-6 w-52 rounded-[18px]" />
        <div className="mt-5 space-y-3">
          <SkeletonBlock className="h-10 w-11/12 sm:h-14" />
          <SkeletonBlock className="h-10 w-3/4 sm:h-14" />
        </div>
        <div className="mt-5 space-y-2">
          <SkeletonBlock className="h-4 w-full max-w-xl" />
          <SkeletonBlock className="h-4 w-4/5 max-w-md" />
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <SkeletonBlock className="h-11 w-full rounded-[18px] sm:w-64" />
          <SkeletonBlock className="h-11 w-full rounded-[18px] sm:w-44" />
        </div>
        <div className="mt-8 flex gap-6 border-t border-[#e5e5e5] pt-6">
          <SkeletonBlock className="h-3.5 w-28" />
          <SkeletonBlock className="h-3.5 w-32" />
          <SkeletonBlock className="h-3.5 w-24" />
        </div>
      </div>

      <div
        aria-hidden="true"
        className="flex h-[440px] items-center justify-center sm:h-[500px] lg:col-span-5 lg:h-[560px]"
      >
        <div className="h-[360px] w-[180px] animate-pulse rounded-[36px] bg-[#bc8ae1]/20 sm:h-[410px] sm:w-[205px]" />
      </div>
    </div>
  );
}

export function FeaturePairSkeleton({ reversed = false }: { reversed?: boolean }) {
  return (
    <div aria-hidden="true" className="grid items-stretch gap-6 lg:grid-cols-2 lg:gap-24">
      <div
        className={`blueprint-card flex flex-col justify-center space-y-4 p-6 sm:p-10 ${
          reversed ? 'lg:order-2' : ''
        }`}
      >
        <SkeletonBlock className="h-6 w-32 rounded-[18px]" />
        <SkeletonBlock className="h-8 w-5/6" />
        <SkeletonBlock className="h-4 w-full" />
        <SkeletonBlock className="h-4 w-4/5" />
      </div>
      <Canvas3DSkeleton
        className={`min-h-[260px] sm:min-h-[340px] ${reversed ? 'lg:order-1' : ''}`}
      />
    </div>
  );
}

export function PlansGridSkeleton() {
  return (
    <div aria-hidden="true" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2].map((idx) => (
        <div key={idx} className="blueprint-card flex flex-col justify-between p-6 sm:p-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <SkeletonBlock className="h-7 w-24" />
              <SkeletonBlock className="h-5 w-28 rounded-[18px]" />
            </div>
            <SkeletonBlock className="h-10 w-36" />
            <SkeletonBlock className="h-4 w-full" />
            <div className="space-y-3 border-t border-[#e5e5e5] pt-5">
              <SkeletonBlock className="h-4 w-5/6" />
              <SkeletonBlock className="h-4 w-3/4" />
              <SkeletonBlock className="h-4 w-4/5" />
            </div>
          </div>
          <SkeletonBlock className="mt-8 h-11 w-full rounded-[18px]" />
        </div>
      ))}
    </div>
  );
}

export function LoginPageSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f5f5] px-4 py-12">
      <div className="w-full max-w-xl space-y-5">
        <SkeletonBlock className="h-10 w-36 rounded-[18px]" />
        <div className="blueprint-card space-y-6 p-6 sm:p-9">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <SkeletonBlock className="h-3.5 w-36" />
              <SkeletonBlock className="h-8 w-56" />
            </div>
            <SkeletonBlock className="h-6 w-16" />
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <SkeletonBlock key={i} className="h-14 w-full rounded-[18px]" />
            ))}
          </div>
          <div className="space-y-4 border-t border-[#e5e5e5] pt-6">
            <SkeletonBlock className="h-4 w-40" />
            <SkeletonBlock className="h-11 w-full rounded-[18px]" />
            <SkeletonBlock className="h-11 w-full rounded-[18px]" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function DashboardPageSkeleton() {
  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <div className="border-b border-[#e5e5e5] bg-[#ffffff] px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <SkeletonBlock className="h-10 w-10 rounded-[18px]" />
            <div className="space-y-2">
              <SkeletonBlock className="h-3.5 w-28" />
              <SkeletonBlock className="h-6 w-48" />
            </div>
          </div>
          <SkeletonBlock className="h-10 w-32 rounded-[18px]" />
        </div>
      </div>

      <div className="mx-auto max-w-[1280px] space-y-6 px-4 py-8 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((idx) => (
            <div key={idx} className="blueprint-card space-y-4 p-5">
              <div className="flex items-center justify-between">
                <SkeletonBlock className="h-3.5 w-24" />
                <SkeletonBlock className="h-4 w-4 rounded-full" />
              </div>
              <SkeletonBlock className="h-8 w-28" />
              <SkeletonBlock className="h-3 w-40" />
            </div>
          ))}
        </div>

        <div className="blueprint-card space-y-4 p-6">
          <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-4">
            <SkeletonBlock className="h-5 w-44" />
            <SkeletonBlock className="h-5 w-20 rounded-[18px]" />
          </div>
          <SkeletonBlock className="h-12 w-full" />
          <SkeletonBlock className="h-12 w-full" />
          <SkeletonBlock className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}
