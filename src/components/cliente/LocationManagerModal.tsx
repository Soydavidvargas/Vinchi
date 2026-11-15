'use client';

import { useState, type FormEvent } from 'react';
import {
  Briefcase,
  Building2,
  Check,
  DoorOpen,
  HandHeart,
  Home,
  MapPin,
  Pencil,
  Plus,
  Store,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import type { ClientDeliveryLocation, DeliveryHandoffMode } from '@/src/types/vinchi';

export interface LocationManagerModalProps {
  open: boolean;
  locations: ClientDeliveryLocation[];
  selectedLocationId: string | null;
  maxLocations: number;
  isBusy?: boolean;
  onClose: () => void;
  onSelectActive: (locationId: string) => void;
  onCreateLocation: (payload: {
    nombreLugar: string;
    etiqueta: string;
    esConjuntoPrivado: boolean;
    nombreConjunto?: string;
    apartamento?: string;
    direccion?: string;
    estructuraYCercania?: string;
    indicacionesEdificio?: string;
    modoEntrega: DeliveryHandoffMode;
    predeterminada?: boolean;
  }) => Promise<boolean>;
  onUpdateLocation: (
    locationId: string,
    payload: {
      setAsDefault?: boolean;
      nombreLugar?: string;
      etiqueta?: string;
      esConjuntoPrivado?: boolean;
      nombreConjunto?: string;
      apartamento?: string;
      direccion?: string;
      estructuraYCercania?: string;
      indicacionesEdificio?: string;
      modoEntrega?: DeliveryHandoffMode;
    }
  ) => Promise<boolean>;
  onDeleteLocation: (locationId: string) => Promise<void>;
}

const LABEL_EXAMPLES = [
  { label: 'Casa', icon: Home },
  { label: 'Trabajo', icon: Briefcase },
  { label: 'Familiar', icon: Users },
];

const DELIVERY_HANDOFF_OPTIONS: {
  mode: DeliveryHandoffMode;
  description: string;
  icon: typeof HandHeart;
}[] = [
  {
    mode: 'Recibir a la mano',
    description: 'El domiciliario te entrega el pedido personalmente (tarifa fija de domicilio).',
    icon: HandHeart,
  },
  {
    mode: 'Dejar en la puerta',
    description: 'Lo dejamos en la entrada o portería con foto o aviso (tarifa fija de domicilio).',
    icon: DoorOpen,
  },
  {
    mode: 'Yo mismo lo recojo',
    description: 'Pasas directo a recogerlo en el comercio (tarifa fija de $ 1.000 COP).',
    icon: Store,
  },
];

export default function LocationManagerModal({
  open,
  locations,
  selectedLocationId,
  maxLocations,
  isBusy = false,
  onClose,
  onSelectActive,
  onCreateLocation,
  onUpdateLocation,
  onDeleteLocation,
}: LocationManagerModalProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nombreLugar, setNombreLugar] = useState('');
  const [etiqueta, setEtiqueta] = useState('Casa');
  const [esConjuntoPrivado, setEsConjuntoPrivado] = useState(false);
  const [nombreConjunto, setNombreConjunto] = useState('');
  const [apartamento, setApartamento] = useState('');
  const [direccion, setDireccion] = useState('');
  const [estructuraYCercania, setEstructuraYCercania] = useState('');
  const [indicacionesEdificio, setIndicacionesEdificio] = useState('');
  const [modoEntrega, setModoEntrega] = useState<DeliveryHandoffMode>('Recibir a la mano');
  const [formError, setFormError] = useState('');

  if (!open) return null;

  const limitReached = locations.length >= maxLocations && !editingId;

  const resetForm = () => {
    setEditingId(null);
    setNombreLugar('');
    setEtiqueta('Casa');
    setEsConjuntoPrivado(false);
    setNombreConjunto('');
    setApartamento('');
    setDireccion('');
    setEstructuraYCercania('');
    setIndicacionesEdificio('');
    setModoEntrega('Recibir a la mano');
    setFormError('');
  };

  const startEdit = (loc: ClientDeliveryLocation) => {
    setEditingId(loc.id);
    setNombreLugar(loc.nombreLugar);
    setEtiqueta(loc.etiqueta);
    setEsConjuntoPrivado(loc.esConjuntoPrivado);
    setNombreConjunto(loc.nombreConjunto || '');
    setApartamento(loc.apartamento || '');
    setDireccion(loc.direccion || '');
    setEstructuraYCercania(loc.estructuraYCercania || '');
    setIndicacionesEdificio(loc.indicacionesEdificio || '');
    setModoEntrega(loc.modoEntrega);
    setFormError('');
  };

  const handleToggleConjunto = (nextValue: boolean) => {
    setEsConjuntoPrivado(nextValue);
    setFormError('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (limitReached) {
      setFormError(`Ya alcanzaste el máximo de ${maxLocations} ubicaciones guardadas.`);
      return;
    }

    if (nombreLugar.trim().length < 2) {
      setFormError('Escribe el nombre del lugar (ej. Apartamento Norte u Oficina).');
      return;
    }
    if (!etiqueta.trim()) {
      setFormError('Asigna una etiqueta como Casa, Trabajo o Familiar.');
      return;
    }

    if (esConjuntoPrivado) {
      if (nombreConjunto.trim().length < 2 || !apartamento.trim()) {
        setFormError('Indica el nombre del conjunto privado y el número de apartamento.');
        return;
      }
    } else if (direccion.trim().length < 4) {
      setFormError('Ingresa la dirección exacta para poder ubicar tu pedido.');
      return;
    }

    const payload = {
      nombreLugar: nombreLugar.trim(),
      etiqueta: etiqueta.trim(),
      esConjuntoPrivado,
      nombreConjunto: esConjuntoPrivado ? nombreConjunto.trim() : undefined,
      apartamento: esConjuntoPrivado ? apartamento.trim() : undefined,
      direccion: esConjuntoPrivado ? undefined : direccion.trim(),
      estructuraYCercania: esConjuntoPrivado
        ? undefined
        : estructuraYCercania.trim() || undefined,
      indicacionesEdificio: esConjuntoPrivado
        ? undefined
        : indicacionesEdificio.trim() || undefined,
      modoEntrega,
      predeterminada: true,
    };

    const ok = editingId
      ? await onUpdateLocation(editingId, payload)
      : await onCreateLocation(payload);

    if (ok) {
      resetForm();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ubicaciones-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1e1033]/68 px-4 py-6"
    >
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[28px] border-2 border-[#bc8ae1]/75 bg-[#ffffff] shadow-2xl">
        {/* Cabecera */}
        <div className="flex items-center justify-between gap-4 border-b-2 border-[#543b6c] bg-[#442c61] px-5 py-4 text-[#ffffff] sm:px-7">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#9c44dc] text-[#ffffff]">
                <MapPin className="h-5 w-5 stroke-[2.25]" aria-hidden="true" />
              </span>
              <h2
                id="ubicaciones-modal-title"
                className="font-display text-lg font-semibold tracking-[-0.02em] text-[#ffffff] sm:text-xl"
              >
                Mis ubicaciones de entrega
              </h2>
            </div>
            <p className="mt-1 text-xs text-[#e9d5ff]">
              Puedes guardar hasta {maxLocations} ubicaciones. Toda esta información llegará directo a
              la empresa y al domiciliario al pedir.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="rounded-[10px] border border-[#bc8ae1]/50 bg-[#ffffff]/14 px-3 py-1.5 font-mono text-xs font-semibold text-[#ffffff]">
              {locations.length} / {maxLocations}
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar ventana de ubicaciones"
              className="inline-flex h-10 w-10 items-center justify-center rounded-[12px] border border-[#bc8ae1]/45 bg-[#ffffff]/14 text-[#ffffff] hover:bg-[#9c44dc] cursor-pointer"
            >
              <X className="h-5 w-5 stroke-[2.4]" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Contenido scrollable */}
        <div className="grid flex-1 gap-6 overflow-y-auto p-5 sm:p-7 lg:grid-cols-12">
          {/* Columna izquierda: ubicaciones guardadas */}
          <div className="space-y-3 lg:col-span-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#543b6c]">
                Guardadas ({locations.length})
              </h3>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex min-h-[38px] items-center gap-1.5 rounded-[10px] border border-[#bc8ae1] bg-[#faf5ff] px-3.5 py-1.5 text-xs font-semibold text-[#442c61] hover:border-[#9c44dc] cursor-pointer"
                >
                  <Plus className="h-4 w-4 stroke-[2.4] text-[#9c44dc]" aria-hidden="true" />
                  <span>Nueva ubicación</span>
                </button>
              )}
            </div>

            {locations.length === 0 ? (
              <div className="rounded-[20px] border border-dashed border-[#bc8ae1] bg-[#faf5ff] p-5 text-center">
                <Home className="mx-auto h-8 w-8 text-[#9c44dc]" aria-hidden="true" />
                <p className="mt-2 text-sm font-medium text-[#442c61]">
                  Aún no tienes ubicaciones
                </p>
                <p className="mt-1 text-xs text-[#543b6c]">
                  Agrega tu primera ubicación para actualizar el encabezado y recibir pedidos.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {locations.map((loc) => {
                  const isActive =
                    loc.id === selectedLocationId || (!selectedLocationId && loc.predeterminada);
                  return (
                    <div
                      key={loc.id}
                      className={`rounded-[18px] border p-3.5 transition-colors ${
                        isActive
                          ? 'border-2 border-[#9c44dc] bg-[#f3e8ff]/75'
                          : 'border-[#d8c2ef] bg-[#ffffff] hover:border-[#9c44dc]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => onSelectActive(loc.id)}
                          className="min-w-0 flex-1 text-left cursor-pointer"
                        >
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="rounded-[6px] bg-[#442c61] px-2 py-0.5 text-[10px] font-semibold text-[#ffffff]">
                              {loc.etiqueta}
                            </span>
                            {isActive && (
                              <span className="inline-flex items-center gap-1 rounded-[6px] bg-[#16a34a]/15 px-2 py-0.5 text-[11px] font-semibold text-[#166534]">
                                <Check className="h-4 w-4 stroke-[2.5]" aria-hidden="true" />
                                En uso
                              </span>
                            )}
                          </div>
                          <p className="mt-1.5 truncate text-sm font-semibold text-[#0a0a0a]">
                            {loc.nombreLugar}
                          </p>
                          <p className="mt-0.5 text-xs text-[#543b6c]">
                            {loc.esConjuntoPrivado
                              ? `Conjunto ${loc.nombreConjunto} · Apto ${loc.apartamento}`
                              : loc.direccion}
                          </p>
                          <p className="mt-1 text-[11px] font-medium text-[#9c44dc]">
                            Entrega: {loc.modoEntrega}
                          </p>
                        </button>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => startEdit(loc)}
                            aria-label={`Editar ${loc.nombreLugar}`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#d8c2ef] bg-[#ffffff] text-[#442c61] hover:border-[#9c44dc] hover:bg-[#faf5ff] cursor-pointer"
                          >
                            <Pencil className="h-4.5 w-4.5 stroke-[2.25]" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void onDeleteLocation(loc.id)}
                            aria-label={`Eliminar ${loc.nombreLugar}`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#d8c2ef] bg-[#ffffff] text-[#b91c1c] hover:border-[#dc2626] hover:bg-[#fef2f2] cursor-pointer"
                          >
                            <Trash2 className="h-4.5 w-4.5 stroke-[2.25]" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Columna derecha: formulario completo */}
          <form onSubmit={handleSubmit} className="space-y-4 lg:col-span-7">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#543b6c]">
                {editingId ? 'Editando ubicación' : 'Agregar nueva ubicación'}
              </h3>
              {limitReached && (
                <span className="text-xs font-semibold text-[#991b1b]">
                  Límite de 6 alcanzado
                </span>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="loc-nombre" className="block text-xs font-medium text-[#442c61]">
                  Nombre del lugar <span className="text-[#9c44dc]">*</span>
                </label>
                <input
                  id="loc-nombre"
                  type="text"
                  disabled={limitReached}
                  value={nombreLugar}
                  onChange={(e) => setNombreLugar(e.target.value)}
                  placeholder="Ej. Apartamento Mirador"
                  className="mt-1 h-11 w-full rounded-[14px] border border-[#d8c2ef] bg-[#faf5ff] px-3.5 text-sm text-[#0a0a0a] focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none disabled:opacity-50"
                />
              </div>

              <div>
                <label htmlFor="loc-etiqueta" className="block text-xs font-medium text-[#442c61]">
                  Etiqueta <span className="text-[#9c44dc]">*</span>
                </label>
                <input
                  id="loc-etiqueta"
                  type="text"
                  disabled={limitReached}
                  value={etiqueta}
                  onChange={(e) => setEtiqueta(e.target.value)}
                  placeholder="Casa, Trabajo o Familiar"
                  className="mt-1 h-11 w-full rounded-[14px] border border-[#d8c2ef] bg-[#faf5ff] px-3.5 text-sm text-[#0a0a0a] focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none disabled:opacity-50"
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {LABEL_EXAMPLES.map(({ label: ex, icon: ExIcon }) => {
                    const selectedEx = etiqueta.toLowerCase() === ex.toLowerCase();
                    return (
                      <button
                        key={ex}
                        type="button"
                        disabled={limitReached}
                        onClick={() => setEtiqueta(ex)}
                        className={`inline-flex min-h-[40px] items-center gap-2 rounded-[10px] px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                          selectedEx
                            ? 'bg-[#442c61] text-[#ffffff]'
                            : 'border border-[#d8c2ef] bg-[#faf5ff] text-[#442c61] hover:border-[#9c44dc]'
                        }`}
                      >
                        <ExIcon
                          className={`h-4.5 w-4.5 stroke-[2.25] ${
                            selectedEx ? 'text-[#fde68a]' : 'text-[#9c44dc]'
                          }`}
                          aria-hidden="true"
                        />
                        <span>{ex}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Pregunta Conjunto Privado */}
            <div className="rounded-[18px] border border-[#d8c2ef] bg-[#faf5ff] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-[#442c61]">
                    ¿Vives en un conjunto privado?
                  </p>
                  <p className="text-[11px] text-[#543b6c]">
                    {esConjuntoPrivado
                      ? 'Solo se te pedirá el nombre del conjunto y el apartamento; el resto queda deshabilitado.'
                      : 'Indícanos tu dirección, estructura del edificio y referencia cercana.'}
                  </p>
                </div>

                <div className="inline-flex gap-1.5 rounded-[12px] border border-[#d8c2ef] bg-[#ffffff] p-1">
                  <button
                    type="button"
                    disabled={limitReached}
                    onClick={() => handleToggleConjunto(false)}
                    className={`inline-flex min-h-[38px] items-center gap-2 rounded-[9px] px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                      !esConjuntoPrivado
                        ? 'bg-[#442c61] text-[#ffffff]'
                        : 'text-[#543b6c] hover:text-[#0a0a0a]'
                    }`}
                  >
                    <MapPin className="h-4 w-4 stroke-[2.25]" aria-hidden="true" />
                    <span>No</span>
                  </button>
                  <button
                    type="button"
                    disabled={limitReached}
                    onClick={() => handleToggleConjunto(true)}
                    className={`inline-flex min-h-[38px] items-center gap-2 rounded-[9px] px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                      esConjuntoPrivado
                        ? 'bg-[#9c44dc] text-[#ffffff]'
                        : 'text-[#543b6c] hover:text-[#0a0a0a]'
                    }`}
                  >
                    <Building2 className="h-4 w-4 stroke-[2.25]" aria-hidden="true" />
                    <span>Sí, conjunto privado</span>
                  </button>
                </div>
              </div>

              {/* Campos exclusivos de Conjunto Privado */}
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="loc-conjunto"
                    className={`block text-xs font-medium ${
                      esConjuntoPrivado ? 'text-[#442c61]' : 'text-[#737373]'
                    }`}
                  >
                    Nombre del conjunto
                  </label>
                  <input
                    id="loc-conjunto"
                    type="text"
                    disabled={limitReached || !esConjuntoPrivado}
                    value={nombreConjunto}
                    onChange={(e) => setNombreConjunto(e.target.value)}
                    placeholder="Ej. Conjunto Torres del Parque"
                    className="mt-1 h-10 w-full rounded-[14px] border border-[#d8c2ef] bg-[#ffffff] px-3.5 text-sm text-[#0a0a0a] focus:border-[#9c44dc] focus:outline-none disabled:cursor-not-allowed disabled:bg-[#f3e8ff]/50 disabled:text-[#6b5a82] disabled:opacity-55"
                  />
                </div>

                <div>
                  <label
                    htmlFor="loc-apto"
                    className={`block text-xs font-medium ${
                      esConjuntoPrivado ? 'text-[#442c61]' : 'text-[#6b5a82]'
                    }`}
                  >
                    Número de apartamento
                  </label>
                  <input
                    id="loc-apto"
                    type="text"
                    disabled={limitReached || !esConjuntoPrivado}
                    value={apartamento}
                    onChange={(e) => setApartamento(e.target.value)}
                    placeholder="Ej. Torre 3 - Apto 504"
                    className="mt-1 h-10 w-full rounded-[14px] border border-[#d8c2ef] bg-[#ffffff] px-3.5 text-sm text-[#0a0a0a] focus:border-[#9c44dc] focus:outline-none disabled:cursor-not-allowed disabled:bg-[#f3e8ff]/50 disabled:text-[#6b5a82] disabled:opacity-55"
                  />
                </div>
              </div>
            </div>

            {/* Campos de calle / edificio (se deshabilitan si esConjuntoPrivado = true) */}
            <div
              className={`space-y-3 rounded-[18px] border p-4 transition-opacity ${
                esConjuntoPrivado
                  ? 'border-[#d8c2ef] bg-[#f3e8ff]/40 opacity-55'
                  : 'border-[#d8c2ef] bg-[#ffffff]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2 text-xs font-semibold text-[#442c61]">
                  <Building2 className="h-4.5 w-4.5 stroke-[2.25] text-[#9c44dc]" aria-hidden="true" />
                  Dirección e indicaciones del edificio
                </span>
                {esConjuntoPrivado && (
                  <span className="text-[11px] font-medium text-[#543b6c]">
                    Deshabilitado por conjunto privado
                  </span>
                )}
              </div>

              <div>
                <label htmlFor="loc-dir" className="block text-xs font-medium text-[#442c61]">
                  Dirección exacta
                </label>
                <input
                  id="loc-dir"
                  type="text"
                  disabled={limitReached || esConjuntoPrivado}
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Ej. Cra 15 # 88-32"
                  className="mt-1 h-11 w-full rounded-[14px] border border-[#d8c2ef] bg-[#faf5ff] px-3.5 text-sm text-[#0a0a0a] focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none disabled:cursor-not-allowed disabled:bg-[#f3e8ff]"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="loc-estructura"
                    className="block text-xs font-medium text-[#442c61]"
                  >
                    ¿Cómo es la estructura o cerca de quién?
                  </label>
                  <input
                    id="loc-estructura"
                    type="text"
                    disabled={limitReached || esConjuntoPrivado}
                    value={estructuraYCercania}
                    onChange={(e) => setEstructuraYCercania(e.target.value)}
                    placeholder="Ej. Edificio ladrillo gris, junto a panadería"
                    className="mt-1 h-11 w-full rounded-[14px] border border-[#d8c2ef] bg-[#faf5ff] px-3.5 text-sm text-[#0a0a0a] focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none disabled:cursor-not-allowed disabled:bg-[#f3e8ff]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="loc-indicaciones"
                    className="block text-xs font-medium text-[#442c61]"
                  >
                    Indicaciones para encontrar el edificio
                  </label>
                  <input
                    id="loc-indicaciones"
                    type="text"
                    disabled={limitReached || esConjuntoPrivado}
                    value={indicacionesEdificio}
                    onChange={(e) => setIndicacionesEdificio(e.target.value)}
                    placeholder="Ej. Portón negro, timbre 201 frente al parque"
                    className="mt-1 h-11 w-full rounded-[14px] border border-[#d8c2ef] bg-[#faf5ff] px-3.5 text-sm text-[#0a0a0a] focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none disabled:cursor-not-allowed disabled:bg-[#f3e8ff]"
                  />
                </div>
              </div>
            </div>

            {/* Modalidad de entrega con iconos visibles */}
            <div className="space-y-2.5">
              <p className="text-xs font-semibold text-[#442c61]">
                ¿Cómo entregar tu pedido?
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                {DELIVERY_HANDOFF_OPTIONS.map(({ mode, description, icon: ModeIcon }) => {
                  const isModeSelected = modoEntrega === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      disabled={limitReached}
                      onClick={() => setModoEntrega(mode)}
                      className={`vinchi-transition flex flex-col items-start gap-2.5 rounded-[18px] border-2 p-4 text-left cursor-pointer ${
                        isModeSelected
                          ? 'border-[#9c44dc] bg-[#f3e8ff] shadow-[0_8px_20px_-8px_rgba(156,68,220,0.45)]'
                          : 'border-[#d8c2ef] bg-[#ffffff] hover:border-[#9c44dc] hover:bg-[#faf5ff]'
                      }`}
                    >
                      <span
                        className={`inline-flex h-12 w-12 items-center justify-center rounded-[14px] ${
                          isModeSelected
                            ? 'bg-[#9c44dc] text-[#ffffff] shadow-xs'
                            : 'bg-[#f3e8ff] text-[#9c44dc]'
                        }`}
                      >
                        <ModeIcon className="h-6 w-6 stroke-[2.25]" aria-hidden="true" />
                      </span>
                      <div>
                        <p className="text-sm font-bold text-[#0a0a0a]">{mode}</p>
                        <p className="mt-1 text-xs leading-relaxed text-[#543b6c]">
                          {description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {formError && (
              <p
                role="alert"
                className="rounded-[12px] border border-[#9c645c]/50 bg-[#d0b7b0]/25 px-3.5 py-2.5 text-xs font-medium text-[#5c302a]"
              >
                {formError}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-[16px] border border-[#d8c2ef] bg-[#ffffff] px-5 py-2.5 text-xs font-semibold text-[#442c61] hover:border-[#9c44dc] cursor-pointer"
                >
                  <X className="h-5 w-5 stroke-[2.25]" aria-hidden="true" />
                  <span>Cancelar edición</span>
                </button>
              )}
              <button
                type="submit"
                disabled={isBusy || limitReached}
                className="inline-flex min-h-[46px] items-center gap-2 rounded-[16px] bg-[#9c44dc] px-6 text-xs font-semibold text-[#ffffff] hover:bg-[#543b6c] disabled:opacity-50 cursor-pointer"
              >
                {editingId ? (
                  <Check className="h-5 w-5 stroke-[2.4]" aria-hidden="true" />
                ) : (
                  <Plus className="h-5 w-5 stroke-[2.4]" aria-hidden="true" />
                )}
                <span>
                  {isBusy
                    ? 'Guardando...'
                    : editingId
                      ? 'Actualizar ubicación'
                      : 'Guardar ubicación'}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
