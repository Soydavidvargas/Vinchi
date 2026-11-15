'use client';

import { useEffect } from 'react';
import { ArrowRight, Briefcase, KeyRound, Truck, X } from 'lucide-react';

export interface WorkRoleModalProps {
  open: boolean;
  onClose: () => void;
  onChooseAgentApply: () => void;
  onChooseAgentEnter: () => void;
  onChooseDelivery: () => void;
  onChooseDeliveryEnter: () => void;
}

export default function WorkRoleModal({
  open,
  onClose,
  onChooseAgentApply,
  onChooseAgentEnter,
  onChooseDelivery,
  onChooseDeliveryEnter,
}: WorkRoleModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (evt: KeyboardEvent) => {
      if (evt.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="work-role-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0a]/45 px-4 py-6"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl rounded-[28px] border-2 border-[#bc8ae1]/75 bg-[#ffffff] p-6 shadow-[0_24px_60px_-15px_rgba(68,44,97,0.38)] sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar ventana"
          className="vinchi-transition absolute right-5 top-5 inline-flex h-10 w-10 items-center justify-center rounded-[12px] border border-[#d8c2ef] bg-[#faf5ff] text-[#442c61] hover:border-[#9c44dc] hover:bg-[#f3e8ff] cursor-pointer"
        >
          <X className="h-5 w-5 stroke-[2.25]" aria-hidden="true" />
        </button>

        <div className="pr-10">
          <p className="text-xs font-semibold tracking-[0.02em] text-[#9c44dc]">
            Trabajar en Vinchi
          </p>
          <h2
            id="work-role-modal-title"
            className="mt-1.5 font-display text-2xl font-semibold tracking-[-0.025em] text-[#442c61] sm:text-3xl"
          >
            ¿Cómo deseas trabajar con nosotros?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#543b6c]">
            Elige si quieres postularte como Agente comercial para vincular negocios o como
            Domicilio para realizar entregas verificadas.
          </p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {/* Opción 1: Como Agente + link debajo para ingresar cuando ya tenga autorización */}
          <div className="flex flex-col justify-between rounded-[22px] border-2 border-[#bc8ae1] bg-[#faf5ff] p-5">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#9c44dc] text-[#ffffff]">
                <Briefcase className="h-6 w-6 stroke-[2.25]" aria-hidden="true" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-[#442c61]">
                Como Agente
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-[#543b6c]">
                Asesora y vincula comercios de tu ciudad, realiza visitas presenciales y gana por
                cada activación.
              </p>
            </div>

            <div className="mt-5 space-y-2.5">
              <button
                type="button"
                onClick={onChooseAgentApply}
                className="vinchi-transition inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-[14px] bg-[#9c44dc] px-4 py-2.5 text-xs font-semibold text-[#ffffff] hover:bg-[#543b6c] cursor-pointer"
              >
                <span>Postularme como Agente</span>
                <ArrowRight className="h-5 w-5 stroke-[2.25] shrink-0" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={onChooseAgentEnter}
                className="vinchi-transition inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[12px] border border-[#bc8ae1] bg-[#ffffff] px-4 py-2 text-xs font-semibold text-[#442c61] hover:border-[#9c44dc] hover:bg-[#f3e8ff] cursor-pointer"
              >
                <KeyRound className="h-5 w-5 stroke-[2.25] shrink-0 text-[#9c44dc]" aria-hidden="true" />
                <span>Ya tengo autorización · Entrar a mi espacio</span>
              </button>
            </div>
          </div>

          {/* Opción 2: Como Domicilio */}
          <div className="flex flex-col justify-between rounded-[22px] border-2 border-[#bc8ae1]/75 bg-[#faf5ff] p-5">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#442c61] text-[#ffffff]">
                <Truck className="h-6 w-6 stroke-[2.25]" aria-hidden="true" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-[#442c61]">
                Como Domicilio
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-[#543b6c]">
                Activa tu turno con verificación de identidad y entrega pedidos directos en tu zona
                sin intermediarios.
              </p>
            </div>

            <div className="mt-5 space-y-2.5">
              <button
                type="button"
                onClick={onChooseDelivery}
                className="vinchi-transition inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-[14px] bg-[#442c61] px-4 py-2.5 text-xs font-semibold text-[#ffffff] hover:bg-[#543b6c] cursor-pointer"
              >
                <span>Entrar como Domicilio</span>
                <ArrowRight className="h-5 w-5 stroke-[2.25] shrink-0" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={onChooseDeliveryEnter}
                className="vinchi-transition inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[12px] border border-[#bc8ae1] bg-[#ffffff] px-4 py-2 text-xs font-semibold text-[#442c61] hover:border-[#9c44dc] hover:bg-[#f3e8ff] cursor-pointer"
              >
                <KeyRound className="h-5 w-5 stroke-[2.25] shrink-0 text-[#9c44dc]" aria-hidden="true" />
                <span>Ya tengo perfil · Entrar a trabajar</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
