'use client';

import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  Briefcase,
  Building2,
  Camera,
  CheckCircle2,
  CreditCard,
  DollarSign,
  KeyRound,
  Lock,
  MapPin,
  MessageSquare,
  Navigation,
  PackageCheck,
  Phone,
  Plus,
  Power,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  Truck,
  UserCheck,
  Wallet,
} from 'lucide-react';
import {
  addCourierWalletCard,
  advanceCourierDistance,
  applyCourierCompany,
  deleteCourierWalletCard,
  fetchCourierWorkspace,
  requestNewCourierOrder,
  sendCourierChatMessage,
  toggleCourierActive,
  toggleVinchiAutoContract,
  updateCourierAutoPay,
  updateCourierProfile,
  verifyCourierDeliveryCode,
  verifyCourierPickupCode,
  withdrawCourierFunds,
} from '@/src/lib/vinchiClient';
import type {
  AuthUser,
  CourierWorkspaceState,
  RepartidorShiftState,
  VinchiRoute,
} from '@/src/types/vinchi';

export interface RepartidorAppPageProps {
  user?: AuthUser;
  shiftState?: RepartidorShiftState;
  onUserUpdated?: (user: AuthUser) => void;
  onToggleBiometricShift?: () => void;
  onNavigate?: (route: VinchiRoute) => void;
}

type CourierTab = 'operacion' | 'dashboard' | 'billetera' | 'empresas' | 'perfil';

const COLOMBIA_DEPTS = [
  'Antioquia',
  'Atlántico',
  'Bogotá D.C.',
  'Bolívar',
  'Boyacá',
  'Caldas',
  'Cundinamarca',
  'Huila',
  'Meta',
  'Nariño',
  'Norte de Santander',
  'Quindío',
  'Risaralda',
  'Santander',
  'Tolima',
  'Valle del Cauca',
];

function formatCop(value: number): string {
  return `$ ${value.toLocaleString('es-CO')}`;
}

export default function RepartidorAppPage({
  user,
  onUserUpdated,
  onNavigate,
}: RepartidorAppPageProps) {
  const [workspace, setWorkspace] = useState<CourierWorkspaceState | null>(null);
  const [activeTab, setActiveTab] = useState<CourierTab>('operacion');
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [bannerMsg, setBannerMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Inputs de códigos y chat
  const [pickupCodeInput, setPickupCodeInput] = useState('');
  const [deliveryCodeInput, setDeliveryCodeInput] = useState('');
  const [chatInput, setChatInput] = useState('');

  // Billetera & Retiros
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawCardId, setWithdrawCardId] = useState('');
  const [showAddCard, setShowAddCard] = useState(false);
  const [cardAlias, setCardAlias] = useState('');
  const [cardBanco, setCardBanco] = useState('Bancolombia');
  const [cardNumero, setCardNumero] = useState('');
  const [cardExpiracion, setCardExpiracion] = useState('12/29');
  const [cardTipo, setCardTipo] = useState<'Debito' | 'Credito' | 'Cuenta Bancaria'>(
    'Cuenta Bancaria'
  );
  const [autoPayDay, setAutoPayDay] = useState(5);

  // Editar perfil
  const [profPrimerNombre, setProfPrimerNombre] = useState(user?.primerNombre || '');
  const [profSegundoNombre, setProfSegundoNombre] = useState(user?.segundoNombre || '');
  const [profPrimerApellido, setProfPrimerApellido] = useState(user?.primerApellido || '');
  const [profSegundoApellido, setProfSegundoApellido] = useState(user?.segundoApellido || '');
  const [profAvatar, setProfAvatar] = useState(user?.avatarDataUrl || '');
  const [profTelefono, setProfTelefono] = useState(user?.telefono || '');
  const [profDepartamento, setProfDepartamento] = useState('Bogotá D.C.');
  const [profMunicipio, setProfMunicipio] = useState('Bogotá D.C.');
  const [profDireccion, setProfDireccion] = useState('');
  const [profVehiculo, setProfVehiculo] = useState('Motocicleta');

  const syncWorkspaceState = (ws: CourierWorkspaceState) => {
    setWorkspace(ws);
    setAutoPayDay(ws.wallet.autoMonthlyDay || 5);
    const defCard = ws.wallet.cards.find((c) => c.predeterminada) || ws.wallet.cards[0];
    if (defCard) setWithdrawCardId(defCard.id);

    setProfPrimerNombre(ws.profile.primerNombre);
    setProfSegundoNombre(ws.profile.segundoNombre || '');
    setProfPrimerApellido(ws.profile.primerApellido);
    setProfSegundoApellido(ws.profile.segundoApellido || '');
    setProfAvatar(ws.profile.avatarDataUrl || '');
    setProfTelefono(ws.profile.telefono);
    setProfDepartamento(ws.profile.departamento);
    setProfMunicipio(ws.profile.municipio);
    setProfDireccion(ws.profile.direccionCasa);
    setProfVehiculo(ws.profile.vehiculo);
  };

  useEffect(() => {
    fetchCourierWorkspace()
      .then((ws) => {
        syncWorkspaceState(ws);
      })
      .catch((err) => {
        setErrorMsg(err instanceof Error ? err.message : 'No se pudo cargar tu espacio.');
      })
      .finally(() => setIsLoading(false));
  }, []);

  const clearAlerts = () => {
    setBannerMsg('');
    setErrorMsg('');
  };

  const handleToggleActive = async () => {
    clearAlerts();
    setIsBusy(true);
    try {
      const ws = await toggleCourierActive();
      syncWorkspaceState(ws);
      setBannerMsg(
        ws.activo
          ? 'Estado Activo habilitado. Tienes un domicilio listo en tu mapa.'
          : 'Estado cambiado a No activo.'
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No fue posible cambiar tu estado.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleNewOrder = async () => {
    clearAlerts();
    setIsBusy(true);
    try {
      const ws = await requestNewCourierOrder();
      syncWorkspaceState(ws);
      setPickupCodeInput('');
      setDeliveryCodeInput('');
      setBannerMsg('Nuevo domicilio asignado en tu ruta.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo solicitar nuevo pedido.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleAdvanceDistance = async (targetKm?: number) => {
    clearAlerts();
    setIsBusy(true);
    try {
      const ws = await advanceCourierDistance(targetKm);
      syncWorkspaceState(ws);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No fue posible actualizar tu posición.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleVerifyPickupCode = async (e: FormEvent) => {
    e.preventDefault();
    clearAlerts();
    if (!pickupCodeInput.trim()) {
      setErrorMsg('Ingresa el código de recogida entregado por la empresa.');
      return;
    }
    setIsBusy(true);
    try {
      const ws = await verifyCourierPickupCode(pickupCodeInput.trim());
      syncWorkspaceState(ws);
      setPickupCodeInput('');
      setBannerMsg(
        'Recogida confirmada. El mapa se actualizó hacia el cliente. El chat cambiará al cliente al estar a 5 km o menos.'
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Código de empresa incorrecto.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleVerifyDeliveryCode = async (e: FormEvent) => {
    e.preventDefault();
    clearAlerts();
    if (!deliveryCodeInput.trim()) {
      setErrorMsg('Ingresa el código de confirmación que te entrega el cliente.');
      return;
    }
    setIsBusy(true);
    try {
      const ws = await verifyCourierDeliveryCode(deliveryCodeInput.trim());
      syncWorkspaceState(ws);
      setDeliveryCodeInput('');
      setBannerMsg(
        ws.completedMessage ||
          'Entrega completada con éxito. El chat se cerró y tu ganancia fue acreditada.'
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Código de entrega incorrecto.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleSendChat = async (e: FormEvent) => {
    e.preventDefault();
    clearAlerts();
    const text = chatInput.trim();
    if (!text) return;
    setIsBusy(true);
    try {
      const ws = await sendCourierChatMessage(text);
      syncWorkspaceState(ws);
      setChatInput('');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo enviar el mensaje.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleAvatarUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setProfAvatar(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    clearAlerts();
    if (profPrimerNombre.trim().length < 2 || profPrimerApellido.trim().length < 2) {
      setErrorMsg('Tu primer nombre y primer apellido son obligatorios.');
      return;
    }
    setIsBusy(true);
    try {
      const res = await updateCourierProfile({
        primerNombre: profPrimerNombre.trim(),
        segundoNombre: profSegundoNombre.trim() || undefined,
        primerApellido: profPrimerApellido.trim(),
        segundoApellido: profSegundoApellido.trim() || undefined,
        avatarDataUrl: profAvatar,
        telefono: profTelefono.trim(),
        departamento: profDepartamento,
        municipio: profMunicipio.trim(),
        direccionCasa: profDireccion.trim(),
        vehiculo: profVehiculo,
      });
      if (workspace) {
        setWorkspace({ ...workspace, profile: res.profile });
      }
      onUserUpdated?.(res.user);
      setBannerMsg('Perfil actualizado correctamente.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo actualizar tu perfil.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleAddCard = async (e: FormEvent) => {
    e.preventDefault();
    clearAlerts();
    setIsBusy(true);
    try {
      const res = await addCourierWalletCard({
        alias: cardAlias.trim(),
        banco: cardBanco.trim(),
        numero: cardNumero.trim(),
        titular: workspace?.profile.nombre || user?.nombre || 'Domiciliario',
        expiracion: cardExpiracion.trim(),
        tipo: cardTipo,
        predeterminada: true,
      });
      if (workspace) setWorkspace({ ...workspace, wallet: res.wallet });
      setCardAlias('');
      setCardNumero('');
      setShowAddCard(false);
      setBannerMsg('Tarjeta o cuenta agregada a tu billetera.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo guardar la tarjeta.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    clearAlerts();
    setIsBusy(true);
    try {
      const res = await deleteCourierWalletCard(cardId);
      if (workspace) setWorkspace({ ...workspace, wallet: res.wallet });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al eliminar tarjeta.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleToggleAutoPay = async () => {
    if (!workspace) return;
    clearAlerts();
    setIsBusy(true);
    try {
      const res = await updateCourierAutoPay({
        autoMonthlyEnabled: !workspace.wallet.autoMonthlyEnabled,
        autoMonthlyDay: autoPayDay,
        defaultCardId: withdrawCardId || undefined,
      });
      setWorkspace({ ...workspace, wallet: res.wallet });
      setBannerMsg(
        res.wallet.autoMonthlyEnabled
          ? `Retiro automático mensual programado para el día ${res.wallet.autoMonthlyDay}.`
          : 'Retiro automático mensual desactivado.'
      );
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'No se pudo actualizar el retiro automático.'
      );
    } finally {
      setIsBusy(false);
    }
  };

  const handleWithdraw = async (e: FormEvent) => {
    e.preventDefault();
    clearAlerts();
    const monto = Number(withdrawAmount);
    setIsBusy(true);
    try {
      const res = await withdrawCourierFunds({
        montoCop: monto,
        cardId: withdrawCardId || undefined,
      });
      if (workspace) setWorkspace({ ...workspace, wallet: res.wallet });
      setWithdrawAmount('');
      setBannerMsg(`Retiro por ${formatCop(monto)} COP procesado con éxito.`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No fue posible realizar el retiro.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleVinchiAutoContract = async () => {
    if (!workspace) return;
    clearAlerts();
    setIsBusy(true);
    try {
      const ws = await toggleVinchiAutoContract(!workspace.vinchiAutoContract);
      syncWorkspaceState(ws);
      setBannerMsg(
        ws.vinchiAutoContract
          ? 'Contratación automática con Vinchi ACTIVADA. Ahora responderás automáticamente a cualquier empresa que busque domiciliarios.'
          : 'Contratación automática con Vinchi desactivada.'
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al cambiar contratación automática.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleApplyCompany = async (companyId: string) => {
    clearAlerts();
    setIsBusy(true);
    try {
      const ws = await applyCourierCompany(companyId);
      syncWorkspaceState(ws);
      setBannerMsg('¡Postulación aprobada! Ya estás contratado con esta empresa.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo completar la postulación.');
    } finally {
      setIsBusy(false);
    }
  };

  const activeOrder = workspace?.activeOrder || null;
  const isStep1 = activeOrder?.step === 'to_company';
  const isStep2 = activeOrder?.step === 'to_client';
  const within5Km = activeOrder ? activeOrder.distanciaClienteKm <= 5 : false;
  const chatEnabled = Boolean(activeOrder && (isStep1 || (isStep2 && within5Km)));

  const currentChannel = isStep1 ? 'empresa' : 'cliente';
  const visibleMessages = (workspace?.chatMessages || []).filter(
    (m) => m.channel === currentChannel
  );

  // Progreso visual en el mapa
  const courierSvgPos = !activeOrder
    ? { x: 120, y: 200 }
    : isStep1
      ? {
          x: Math.round(120 + (1 - Math.min(1, activeOrder.distanciaEmpresaKm / 2)) * 165),
          y: Math.round(215 - (1 - Math.min(1, activeOrder.distanciaEmpresaKm / 2)) * 85),
        }
      : {
          x: Math.round(290 + (1 - Math.min(1, activeOrder.distanciaClienteKm / 7)) * 200),
          y: Math.round(125 + (1 - Math.min(1, activeOrder.distanciaClienteKm / 7)) * 65),
        };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f3e8ff]/75 via-[#faf5ff] to-[#f4ecfb] text-[#0a0a0a]">
      <header className="sticky top-0 z-30 border-b-2 border-[#543b6c] bg-[#442c61] px-4 py-3.5 text-[#ffffff] sm:px-6">
        <div className="mx-auto flex max-w-[1340px] flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => onNavigate?.('/(public)')}
              className="vinchi-transition inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border border-[#bc8ae1]/40 bg-[#ffffff]/14 text-[#ffffff] hover:bg-[#9c44dc] cursor-pointer"
              aria-label="Volver al inicio"
            >
              <ArrowLeft className="h-5 w-5 stroke-[2.25]" aria-hidden="true" />
            </button>

            {workspace?.profile.avatarDataUrl ? (
              <img
                src={workspace.profile.avatarDataUrl}
                alt={workspace.profile.nombre}
                className="h-11 w-11 shrink-0 rounded-full border-2 border-[#bc8ae1] object-cover"
              />
            ) : (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#bc8ae1]/50 bg-[#9c44dc] text-sm font-semibold text-[#ffffff]">
                {(workspace?.profile.primerNombre || user?.primerNombre || 'D')[0]}
              </div>
            )}

            <div className="min-w-0">
              <p className="text-[11px] font-medium text-[#e9d5ff]">Espacio Privado · Domicilio</p>
              <h1 className="truncate font-display text-base font-semibold text-[#ffffff] sm:text-lg">
                {workspace?.profile.nombre || user?.nombre || 'Domiciliario Verificado'}
              </h1>
            </div>
          </div>

          <nav aria-label="Secciones de Domicilio" className="flex flex-wrap gap-2">
            {(
              [
                { id: 'operacion', label: 'Mapa y Chat', icon: Navigation },
                { id: 'dashboard', label: 'Dashboard', icon: PackageCheck },
                { id: 'billetera', label: 'Billetera y Retiros', icon: Wallet },
                { id: 'empresas', label: 'Empresas y Contratos', icon: Building2 },
                { id: 'perfil', label: 'Editar Perfil', icon: UserCheck },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const selected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    clearAlerts();
                    setActiveTab(tab.id);
                  }}
                  className={`vinchi-transition inline-flex min-h-[44px] items-center gap-2 rounded-[14px] px-4 py-2 text-xs font-semibold cursor-pointer ${
                    selected
                      ? 'bg-[#9c44dc] text-[#ffffff] shadow-[0_6px_16px_-6px_rgba(156,68,220,0.7)]'
                      : 'border border-[#bc8ae1]/40 bg-[#ffffff]/12 text-[#f3e8ff] hover:bg-[#ffffff]/20'
                  }`}
                >
                  <Icon className="h-5 w-5 stroke-[2.25]" aria-hidden="true" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-[1340px] px-4 py-6 sm:px-6">
        {bannerMsg && (
          <div
            role="status"
            className="mb-5 flex items-center justify-between gap-3 rounded-[16px] border border-[#16a34a]/40 bg-[#16a34a]/10 px-4 py-3 text-xs font-medium text-[#166534]"
          >
            <span>{bannerMsg}</span>
            <button
              type="button"
              onClick={() => setBannerMsg('')}
              className="text-[11px] underline cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        )}
        {errorMsg && (
          <div
            role="alert"
            className="mb-5 flex items-center justify-between gap-3 rounded-[16px] border border-[#9c645c]/50 bg-[#d0b7b0]/30 px-4 py-3 text-xs font-medium text-[#5c302a]"
          >
            <span>{errorMsg}</span>
            <button
              type="button"
              onClick={() => setErrorMsg('')}
              className="text-[11px] underline cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        )}

        {isLoading || !workspace ? (
          <div className="h-[460px] animate-pulse rounded-[24px] border border-[#e5e5e5] bg-[#ffffff]" />
        ) : (
          <>
            {/* TAB 1: OPERACIÓN EN VIVO (MITAD IZQUIERDA MAPA / MITAD DERECHA CHATS) */}
            {activeTab === 'operacion' && (
              <div className="grid gap-6 lg:grid-cols-12">
                {/* MITAD IZQUIERDA (6 cols): Info pedido encima + Mapa + Códigos abajo */}
                <section
                  aria-label="Mapa de entregas y códigos"
                  className="flex flex-col gap-4 lg:col-span-6"
                >
                  {/* Encima del mapa: quién pidió comida + qué empresa pidió domicilio + 3 procesos */}
                  <div className="rounded-[24px] border-2 border-[#bc8ae1]/60 bg-[#ffffff] p-5">
                    {activeOrder ? (
                      <>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <span className="inline-flex items-center gap-1.5 rounded-[8px] bg-[#f3e8ff] px-2.5 py-1 font-mono text-[11px] font-semibold text-[#9c44dc]">
                              {activeOrder.codigoOrden} · Pago {formatCop(activeOrder.pagoDomicilioCop)}
                            </span>
                            <h2 className="mt-2 font-display text-lg font-semibold text-[#442c61]">
                              Empresa: {activeOrder.empresaNombre}
                            </h2>
                            <p className="text-xs text-[#543b6c]">
                              Recogida: {activeOrder.empresaDireccion} ({activeOrder.empresaBarrio})
                            </p>
                          </div>

                          <div className="rounded-[14px] border border-[#d8c2ef] bg-[#faf5ff] px-3.5 py-2.5 text-xs space-y-0.5">
                            <p className="font-semibold text-[#442c61]">
                              Cliente: {activeOrder.clienteNombre}
                            </p>
                            <p className="text-[11px] text-[#543b6c]">
                              Comida: {activeOrder.comidaResumen}
                            </p>
                            <p className="text-[11px] text-[#543b6c]">
                              Destino: {activeOrder.clienteDireccion} ({activeOrder.clienteBarrio})
                            </p>
                            {activeOrder.bonoDomiciliarioCop && activeOrder.bonoDomiciliarioCop > 0 ? (
                              <p className="font-semibold text-[#166534]">
                                Bono cliente: +{formatCop(activeOrder.bonoDomiciliarioCop)}{' '}
                                {activeOrder.bonoNombre ? `(${activeOrder.bonoNombre})` : ''}
                              </p>
                            ) : null}
                            {activeOrder.deliveryDetails && (
                              <div className="mt-1.5 border-t border-[#e5e5e5] pt-1.5 text-[11px] text-[#442c61]">
                                {activeOrder.deliveryDetails.esConjuntoPrivado ? (
                                  <p>
                                    Conjunto: <strong>{activeOrder.deliveryDetails.nombreConjunto}</strong> · Apto{' '}
                                    <strong>{activeOrder.deliveryDetails.apartamento}</strong>
                                  </p>
                                ) : (
                                  <>
                                    {activeOrder.deliveryDetails.estructuraYCercania && (
                                      <p>
                                        Estructura / cerca de: {activeOrder.deliveryDetails.estructuraYCercania}
                                      </p>
                                    )}
                                    {activeOrder.deliveryDetails.indicacionesEdificio && (
                                      <p>
                                        Indicaciones: {activeOrder.deliveryDetails.indicacionesEdificio}
                                      </p>
                                    )}
                                  </>
                                )}
                                <p className="font-semibold text-[#9c44dc]">
                                  Entrega: {activeOrder.deliveryDetails.modoEntrega}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 3 Procesos */}
                        <div className="mt-4 grid grid-cols-3 gap-2">
                          <div
                            className={`rounded-[12px] border px-3 py-2 text-[11px] font-semibold ${
                              isStep1
                                ? 'border-[#9c44dc] bg-[#442c61] text-[#ffffff]'
                                : 'border-[#16a34a]/40 bg-[#16a34a]/10 text-[#166534]'
                            }`}
                          >
                            1. Ir a la empresa
                          </div>
                          <div
                            className={`rounded-[12px] border px-3 py-2 text-[11px] font-semibold ${
                              isStep2
                                ? 'border-[#9c44dc] bg-[#442c61] text-[#ffffff]'
                                : 'border-[#e5e5e5] bg-[#fafafa] text-[#543b6c]'
                            }`}
                          >
                            2. Enviar al cliente
                          </div>
                          <div className="rounded-[12px] border border-[#e5e5e5] bg-[#fafafa] px-3 py-2 text-[11px] font-semibold text-[#543b6c]">
                            3. Entrega final
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-medium text-[#9c44dc]">Estado de servicio</p>
                          <h2 className="mt-1 font-display text-lg font-semibold text-[#0a0a0a]">
                            Sin servicio activo en este momento
                          </h2>
                          <p className="mt-0.5 text-xs text-[#543b6c]">
                            {workspace.activo
                              ? 'Tu turno está activo. Solicita el siguiente domicilio cuando estés listo.'
                              : 'Activa el botón "Activo" arriba del chat para recibir un domicilio.'}
                          </p>
                        </div>

                        {workspace.activo && (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={handleNewOrder}
                            className="vinchi-transition inline-flex min-h-[42px] items-center gap-2 rounded-[14px] bg-[#9c44dc] px-4 py-2 text-xs font-semibold text-[#ffffff] hover:bg-[#543b6c] cursor-pointer"
                          >
                            <Truck className="h-4 w-4 stroke-[2.25]" aria-hidden="true" />
                            <span>Recibir nuevo domicilio</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Mapa interactivo */}
                  <div className="relative overflow-hidden rounded-[24px] border-2 border-[#bc8ae1]/70 bg-[#faf5ff] p-5 min-h-[300px] flex flex-col justify-between">
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0"
                      style={{
                        backgroundImage:
                          'linear-gradient(to right, rgba(156,68,220,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(156,68,220,0.12) 1px, transparent 1px)',
                        backgroundSize: '36px 36px',
                      }}
                    />

                    <svg
                      viewBox="0 0 600 300"
                      aria-label="Mapa de ruta en tiempo real"
                      className="pointer-events-none absolute inset-0 h-full w-full"
                    >
                      {/* Anillo de 5 km alrededor del cliente en etapa 2 */}
                      {activeOrder && isStep2 && (
                        <circle
                          cx="490"
                          cy="190"
                          r="82"
                          fill={within5Km ? '#16a34a' : '#9c44dc'}
                          fillOpacity="0.08"
                          stroke={within5Km ? '#16a34a' : '#9c44dc'}
                          strokeWidth="1.5"
                          strokeDasharray="6 4"
                        />
                      )}

                      {/* Ruta Empresa <-> Cliente */}
                      {activeOrder && isStep1 && (
                        <path
                          d={`M ${courierSvgPos.x} ${courierSvgPos.y} Q 200 130 290 125`}
                          fill="none"
                          stroke="#9c44dc"
                          strokeWidth="4"
                          strokeLinecap="round"
                        />
                      )}
                      {activeOrder && isStep2 && (
                        <path
                          d={`M ${courierSvgPos.x} ${courierSvgPos.y} Q 390 120 490 190`}
                          fill="none"
                          stroke={within5Km ? '#16a34a' : '#442c61'}
                          strokeWidth="4"
                          strokeLinecap="round"
                        />
                      )}

                      {/* Pin Empresa */}
                      {activeOrder && (
                        <g>
                          <circle cx="290" cy="125" r="11" fill="#442c61" />
                          <circle cx="290" cy="125" r="20" fill="#442c61" fillOpacity="0.16" />
                          <text
                            x="290"
                            y="98"
                            textAnchor="middle"
                            fontSize="11"
                            fontWeight="600"
                            fill="#442c61"
                          >
                            Empresa
                          </text>
                        </g>
                      )}

                      {/* Pin Cliente (solo cuando hay orden) */}
                      {activeOrder && (
                        <g>
                          <circle
                            cx="490"
                            cy="190"
                            r="11"
                            fill={isStep2 ? '#16a34a' : '#737373'}
                          />
                          <circle
                            cx="490"
                            cy="190"
                            r="20"
                            fill={isStep2 ? '#16a34a' : '#737373'}
                            fillOpacity="0.16"
                          />
                          <text
                            x="490"
                            y="222"
                            textAnchor="middle"
                            fontSize="11"
                            fontWeight="600"
                            fill="#0a0a0a"
                          >
                            Cliente (Radio 5 km)
                          </text>
                        </g>
                      )}

                      {/* Pin Domiciliario */}
                      <g>
                        <circle cx={courierSvgPos.x} cy={courierSvgPos.y} r="10" fill="#9c44dc" />
                        <circle
                          cx={courierSvgPos.x}
                          cy={courierSvgPos.y}
                          r="18"
                          fill="#9c44dc"
                          fillOpacity="0.24"
                        />
                        <text
                          x={courierSvgPos.x}
                          y={courierSvgPos.y + 28}
                          textAnchor="middle"
                          fontSize="11"
                          fontWeight="700"
                          fill="#9c44dc"
                        >
                          Tú
                        </text>
                      </g>
                    </svg>

                    <div className="relative z-10 flex flex-wrap items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-2 rounded-[12px] border border-[#e5e5e5] bg-[#ffffff]/96 px-3.5 py-2 text-xs font-medium text-[#442c61]">
                        <MapPin className="h-4 w-4 stroke-[2.25] text-[#9c44dc]" aria-hidden="true" />
                        <span>
                          {!activeOrder
                            ? 'Mapa en espera'
                            : isStep1
                              ? `Ruta hacia ${activeOrder.empresaNombre} (${activeOrder.distanciaEmpresaKm} km)`
                              : `Ruta hacia ${activeOrder.clienteNombre} (${activeOrder.distanciaClienteKm} km)`}
                        </span>
                      </span>

                      {activeOrder && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleAdvanceDistance(isStep2 && !within5Km ? 3.4 : undefined)}
                          className="vinchi-transition inline-flex min-h-[40px] items-center gap-2 rounded-[12px] bg-[#442c61] px-4 py-2 text-xs font-semibold text-[#ffffff] hover:bg-[#9c44dc] cursor-pointer"
                        >
                          <Navigation className="h-4 w-4 stroke-[2.25]" aria-hidden="true" />
                          <span>
                            {isStep1
                              ? 'Avanzar a la empresa'
                              : within5Km
                                ? 'Ya estás dentro de 5 km'
                                : 'Avanzar a < 5 km del cliente'}
                          </span>
                        </button>
                      )}
                    </div>

                    <div className="relative z-10 mt-auto rounded-[16px] border border-[#d8c2ef] bg-[#ffffff] p-3.5 text-xs">
                      {!activeOrder ? (
                        <p className="text-[#543b6c]">
                          No mostramos solicitudes de clientes hasta que actives tu turno y tomes un
                          servicio.
                        </p>
                      ) : isStep1 ? (
                        <p className="text-[#442c61]">
                          <strong>Proceso 1:</strong> Dirígete a <strong>{activeOrder.empresaNombre}</strong>{' '}
                          y solicita el código de recogida en el chat derecho.
                        </p>
                      ) : (
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className={within5Km ? 'text-[#166534] font-medium' : 'text-[#92400e]'}>
                            {within5Km
                              ? `Estás a ${activeOrder.distanciaClienteKm} km del cliente (≤ 5 km). Chat con ${activeOrder.clienteNombre} habilitado.`
                              : `Estás a ${activeOrder.distanciaClienteKm} km. Al llegar a 5 km o menos se actualizará el chat con el cliente.`}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Abajo del mapa: validación de códigos por etapa */}
                  {activeOrder && isStep1 && (
                    <form
                      onSubmit={handleVerifyPickupCode}
                      className="rounded-[24px] border-2 border-[#bc8ae1] bg-[#ffffff] p-5 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-[#442c61]">
                          Código para recibir el producto de la empresa
                        </p>
                        <span className="font-mono text-[11px] text-[#9c44dc]">
                          Proceso 1 de 3
                        </span>
                      </div>
                      <p className="text-xs text-[#543b6c]">
                        Escribe el código que te entregó <strong>{activeOrder.empresaNombre}</strong>{' '}
                        en el chat al recibir el pedido para actualizar el mapa hacia el cliente.
                      </p>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <KeyRound
                            className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9c44dc]"
                            aria-hidden="true"
                          />
                          <input
                            type="text"
                            value={pickupCodeInput}
                            onChange={(e) => setPickupCodeInput(e.target.value)}
                            placeholder={`Ej. ${activeOrder.pickupCodeExpected}`}
                            className="h-11 w-full rounded-[14px] border border-[#d8c2ef] bg-[#faf5ff] pl-10 pr-3 font-mono text-sm uppercase text-[#0a0a0a] focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={isBusy}
                          className="vinchi-transition rounded-[14px] bg-[#9c44dc] px-4 text-xs font-semibold text-[#ffffff] hover:bg-[#543b6c] cursor-pointer"
                        >
                          Validar recogida
                        </button>
                      </div>
                    </form>
                  )}

                  {activeOrder && isStep2 && (
                    <form
                      onSubmit={handleVerifyDeliveryCode}
                      className="rounded-[24px] border border-[#16a34a]/50 bg-[#ffffff] p-5 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-[#166534]">
                          Código del cliente para confirmar entrega
                        </p>
                        <span className="font-mono text-[11px] text-[#166534]">
                          Proceso 2 de 3
                        </span>
                      </div>
                      <p className="text-xs text-[#543b6c]">
                        Solicita a <strong>{activeOrder.clienteNombre}</strong> su código de
                        recepción para asegurar que recibió el pedido y finalizar el servicio.
                      </p>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <KeyRound
                            className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#166534]"
                            aria-hidden="true"
                          />
                          <input
                            type="text"
                            value={deliveryCodeInput}
                            onChange={(e) => setDeliveryCodeInput(e.target.value)}
                            placeholder={`Ej. ${activeOrder.deliveryCodeExpected}`}
                            className="h-11 w-full rounded-[14px] border border-[#d8c2ef] bg-[#faf5ff] pl-10 pr-3 font-mono text-sm uppercase text-[#0a0a0a] focus:border-[#16a34a] focus:bg-[#ffffff] focus:outline-none"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={isBusy}
                          className="vinchi-transition rounded-[14px] bg-[#16a34a] px-4 text-xs font-semibold text-[#ffffff] hover:bg-[#15803d] cursor-pointer"
                        >
                          Confirmar entrega
                        </button>
                      </div>
                    </form>
                  )}
                </section>

                {/* MITAD DERECHA (6 cols): Botón Activo/No activo arriba (3 veces/día) + Chats */}
                <section
                  aria-label="Disponibilidad y chats de entrega"
                  className="flex min-h-[580px] flex-col rounded-[24px] border-2 border-[#bc8ae1]/60 bg-[#ffffff] lg:col-span-6"
                >
                  {/* Barra superior arriba del chat: Activo / No activo (máx 3 veces al día) */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d8c2ef] px-5 py-4">
                    <div>
                      <p className="text-xs font-semibold text-[#442c61]">
                        Disponibilidad diaria
                      </p>
                      <p className="text-[11px] text-[#543b6c]">
                        Disponible solo 3 veces al día · Cambios usados hoy:{' '}
                        <strong className="font-mono text-[#442c61]">
                          {workspace.togglesUsedToday} / {workspace.maxTogglesPerDay}
                        </strong>
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={isBusy || workspace.togglesUsedToday >= workspace.maxTogglesPerDay}
                      onClick={handleToggleActive}
                      className={`vinchi-transition inline-flex min-h-[44px] items-center gap-2 rounded-[14px] px-4 text-xs font-semibold cursor-pointer disabled:opacity-50 ${
                        workspace.activo
                          ? 'bg-[#16a34a] text-[#ffffff] hover:bg-[#15803d]'
                          : 'bg-[#442c61] text-[#ffffff] hover:bg-[#543b6c]'
                      }`}
                    >
                      <Power className="h-5 w-5 stroke-[2.25]" aria-hidden="true" />
                      <span>{workspace.activo ? 'Activo' : 'No activo'}</span>
                    </button>
                  </div>

                  {/* Cabecera del chat activo */}
                  <div className="border-b border-[#d8c2ef] bg-[#faf5ff] px-5 py-3">
                    {!activeOrder ? (
                      <div className="flex items-center gap-2 text-xs text-[#543b6c]">
                        <Lock className="h-5 w-5 text-[#9c44dc]" aria-hidden="true" />
                        <span>Chat deshabilitado · Sin entregas activas</span>
                      </div>
                    ) : isStep1 ? (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-[#442c61]">
                            Chat con la empresa: {activeOrder.empresaNombre}
                          </p>
                          <p className="text-[11px] text-[#543b6c]">
                            Etapa de recogida · Coordina y recibe el código del paquete
                          </p>
                        </div>
                        <span className="rounded-[8px] bg-[#9c44dc]/12 px-2.5 py-1 text-[11px] font-semibold text-[#9c44dc]">
                          En vivo
                        </span>
                      </div>
                    ) : !within5Km ? (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-[#92400e]">
                            Chat en espera de proximidad (≤ 5 km)
                          </p>
                          <p className="text-[11px] text-[#543b6c]">
                            Distancia actual al cliente: {activeOrder.distanciaClienteKm} km
                          </p>
                        </div>
                        <Lock className="h-4 w-4 text-[#d97706]" aria-hidden="true" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-[#166534]">
                            Chat con el cliente: {activeOrder.clienteNombre}
                          </p>
                          <p className="text-[11px] text-[#543b6c]">
                            Dentro de 5 km ({activeOrder.distanciaClienteKm} km) · Solicita el código
                            final al entregar
                          </p>
                        </div>
                        <span className="rounded-[8px] bg-[#16a34a]/12 px-2.5 py-1 text-[11px] font-semibold text-[#166534]">
                          Habilitado
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Cuerpo del chat */}
                  <div className="flex-1 space-y-3 overflow-y-auto p-5 max-h-[380px]">
                    {!activeOrder ? (
                      <div className="flex h-full flex-col items-center justify-center py-12 text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#f3e8ff] text-[#9c44dc]">
                          <MessageSquare className="h-7 w-7 stroke-[2.25]" aria-hidden="true" />
                        </div>
                        <p className="mt-3 text-sm font-semibold text-[#442c61]">
                          Chat deshabilitado
                        </p>
                        <p className="mt-1 max-w-xs text-xs text-[#543b6c]">
                          Cuando finalizas una entrega o no tienes pedidos asignados, el chat se
                          deshabilita y no muestra información de clientes.
                        </p>
                      </div>
                    ) : isStep2 && !within5Km ? (
                      <div className="flex h-full flex-col items-center justify-center rounded-[18px] border border-[#d97706]/30 bg-[#d97706]/6 p-6 text-center">
                        <Lock className="h-8 w-8 text-[#d97706]" aria-hidden="true" />
                        <p className="mt-3 text-sm font-semibold text-[#0a0a0a]">
                          Acércate a 5 kilómetros o menos del cliente
                        </p>
                        <p className="mt-1 max-w-sm text-xs leading-relaxed text-[#543b6c]">
                          Ya recogiste el producto en la empresa. El chat se actualizará
                          automáticamente para hablar con el cliente cuando estés a{' '}
                          <strong>5 km o menos</strong> (ahora estás a{' '}
                          <strong>{activeOrder.distanciaClienteKm} km</strong>).
                        </p>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleAdvanceDistance(3.4)}
                          className="vinchi-transition mt-4 rounded-[14px] bg-[#442c61] px-4 py-2 text-xs font-semibold text-[#ffffff] hover:bg-[#9c44dc] cursor-pointer"
                        >
                          Avanzar en ruta a 3.4 km
                        </button>
                      </div>
                    ) : (
                      visibleMessages.map((m) => {
                        const isMe = m.senderRole === 'domiciliario';
                        const isSys = m.senderRole === 'sistema';
                        if (isSys) {
                          return (
                            <div
                              key={m.id}
                              className="rounded-[12px] border border-[#bc8ae1]/40 bg-[#bc8ae1]/12 px-3.5 py-2 text-center text-[11px] font-medium text-[#442c61]"
                            >
                              {m.text}
                            </div>
                          );
                        }
                        return (
                          <div
                            key={m.id}
                            className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                          >
                            <span className="mb-1 text-[10px] font-medium text-[#543b6c]">
                              {m.senderName}
                            </span>
                            <div
                              className={`max-w-[85%] rounded-[16px] px-3.5 py-2.5 text-xs leading-relaxed ${
                                isMe
                                  ? 'bg-[#442c61] text-[#ffffff]'
                                  : 'border border-[#d8c2ef] bg-[#faf5ff] text-[#0a0a0a]'
                              }`}
                            >
                              {m.text}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Caja de envío de chat */}
                  <form
                    onSubmit={handleSendChat}
                    className="flex items-center gap-2 border-t border-[#d8c2ef] p-4"
                  >
                    <input
                      type="text"
                      disabled={!chatEnabled || isBusy}
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder={
                        !activeOrder
                          ? 'Chat deshabilitado sin domicilio activo'
                          : isStep2 && !within5Km
                            ? 'Disponible al estar a 5 km o menos del cliente...'
                            : isStep1
                              ? `Escribir a ${activeOrder.empresaNombre}...`
                              : `Escribir a ${activeOrder.clienteNombre}...`
                      }
                      className="h-11 flex-1 rounded-[14px] border border-[#d8c2ef] bg-[#faf5ff] px-4 text-xs text-[#0a0a0a] focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                    />
                    <button
                      type="submit"
                      disabled={!chatEnabled || isBusy}
                      aria-label="Enviar mensaje"
                      className="vinchi-transition inline-flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#9c44dc] text-[#ffffff] hover:bg-[#543b6c] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                    >
                      <Send className="h-5 w-5 stroke-[2.25]" aria-hidden="true" />
                    </button>
                  </form>
                </section>
              </div>
            )}

            {/* TAB 2: DASHBOARD DE ENVÍOS, ENTREGAS Y GANANCIAS */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <article className="rounded-[22px] border-2 border-[#bc8ae1]/60 bg-[#ffffff] p-5">
                    <p className="text-xs font-medium text-[#543b6c]">Pedidos enviados</p>
                    <p className="mt-2 font-mono text-3xl font-semibold text-[#442c61]">
                      {workspace.stats.enviadosTotal}
                    </p>
                  </article>
                  <article className="rounded-[22px] border-2 border-[#bc8ae1]/60 bg-[#ffffff] p-5">
                    <p className="text-xs font-medium text-[#543b6c]">Pedidos entregados</p>
                    <p className="mt-2 font-mono text-3xl font-semibold text-[#166534]">
                      {workspace.stats.entregadosTotal}
                    </p>
                  </article>
                  <article className="rounded-[22px] border-2 border-[#bc8ae1]/60 bg-[#ffffff] p-5">
                    <p className="text-xs font-medium text-[#543b6c]">Ganancias acumuladas</p>
                    <p className="mt-2 font-mono text-3xl font-semibold text-[#9c44dc]">
                      {formatCop(workspace.stats.gananciasTotalesCop)}
                    </p>
                  </article>
                  <article className="rounded-[22px] border-2 border-[#9c44dc] bg-gradient-to-br from-[#442c61] to-[#543b6c] p-5 text-[#ffffff]">
                    <p className="text-xs font-medium text-[#e9d5ff]">Disponible para retirar</p>
                    <p className="mt-2 font-mono text-3xl font-semibold text-[#ffffff]">
                      {formatCop(workspace.wallet.saldoDisponibleCop)}
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('billetera')}
                      className="mt-2 text-xs font-semibold text-[#e9d5ff] underline hover:text-[#ffffff] cursor-pointer"
                    >
                      Ir a retirar dinero →
                    </button>
                  </article>
                </div>

                <section className="rounded-[24px] border-2 border-[#bc8ae1]/60 bg-[#ffffff] p-6">
                  <h2 className="font-display text-lg font-semibold text-[#0a0a0a]">
                    Historial de domicilios entregados
                  </h2>
                  {workspace.completedHistory.length === 0 ? (
                    <p className="mt-3 text-xs text-[#543b6c]">
                      Aún no has finalizado domicilios con esta cuenta.
                    </p>
                  ) : (
                    <div className="mt-4 space-y-2.5">
                      {workspace.completedHistory.map((item) => (
                        <div
                          key={item.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-[#e5e5e5] bg-[#fafafa] px-4 py-3 text-xs"
                        >
                          <div>
                            <p className="font-semibold text-[#0a0a0a]">
                              {item.codigoOrden} · {item.empresaNombre}
                            </p>
                            <p className="text-[11px] text-[#543b6c]">
                              {new Date(item.completedAt).toLocaleString('es-CO')}
                            </p>
                          </div>
                          <span className="font-mono text-sm font-semibold text-[#166534]">
                            +{formatCop(item.pagoDomicilioCop)} COP
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}

            {/* TAB 3: BILLETERA Y RETIROS AUTOMÁTICOS MENSUALES */}
            {activeTab === 'billetera' && (
              <div className="grid gap-6 lg:grid-cols-12">
                <section className="space-y-6 rounded-[24px] border-2 border-[#bc8ae1]/60 bg-[#ffffff] p-6 lg:col-span-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-[#9c44dc]">Saldo disponible</p>
                      <p className="mt-1 font-mono text-3xl font-semibold text-[#442c61]">
                        {formatCop(workspace.wallet.saldoDisponibleCop)} COP
                      </p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#f3e8ff] text-[#9c44dc]">
                      <DollarSign className="h-7 w-7 stroke-[2.25]" aria-hidden="true" />
                    </div>
                  </div>

                  <form onSubmit={handleWithdraw} className="space-y-3 border-t border-[#d8c2ef] pt-5">
                    <h3 className="text-sm font-semibold text-[#442c61]">Retirar dinero</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label htmlFor="dm-wd-amount" className="block text-xs text-[#543b6c]">
                          Monto a retirar (COP)
                        </label>
                        <input
                          id="dm-wd-amount"
                          type="number"
                          min={1000}
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          placeholder="Ej. 50000"
                          className="mt-1 h-11 w-full rounded-[14px] border border-[#d8c2ef] bg-[#faf5ff] px-3.5 font-mono text-sm text-[#0a0a0a]"
                        />
                      </div>
                      <div>
                        <label htmlFor="dm-wd-card" className="block text-xs text-[#543b6c]">
                          Cuenta o tarjeta destino
                        </label>
                        <select
                          id="dm-wd-card"
                          value={withdrawCardId}
                          onChange={(e) => setWithdrawCardId(e.target.value)}
                          className="mt-1 h-11 w-full rounded-[14px] border border-[#d8c2ef] bg-[#faf5ff] px-3 text-xs text-[#0a0a0a]"
                        >
                          {workspace.wallet.cards.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.alias} · {c.banco} •••• {c.ultimos4}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={isBusy || workspace.wallet.cards.length === 0}
                      className="vinchi-transition inline-flex min-h-[46px] w-full items-center justify-center rounded-[14px] bg-[#9c44dc] text-xs font-semibold text-[#ffffff] hover:bg-[#543b6c] disabled:opacity-50 cursor-pointer"
                    >
                      Retirar ahora
                    </button>
                  </form>

                  <div className="rounded-[18px] border border-[#bc8ae1] bg-[#fafafa] p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold text-[#442c61]">
                          Retiro automático mensual
                        </p>
                        <p className="text-[11px] text-[#543b6c]">
                          Transfiere automáticamente tu saldo el día elegido de cada mes.
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={handleToggleAutoPay}
                        className={`inline-flex min-h-[38px] items-center rounded-[10px] px-4 py-2 text-xs font-semibold cursor-pointer ${
                          workspace.wallet.autoMonthlyEnabled
                            ? 'bg-[#16a34a] text-[#ffffff]'
                            : 'bg-[#442c61] text-[#ffffff]'
                        }`}
                      >
                        {workspace.wallet.autoMonthlyEnabled ? 'Activado' : 'Activar'}
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-[#543b6c]">Día mensual de pago:</span>
                      {[1, 5, 15, 28].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setAutoPayDay(d)}
                          className={`min-h-[36px] rounded-[8px] px-3 py-1.5 font-mono text-xs cursor-pointer ${
                            autoPayDay === d
                              ? 'bg-[#9c44dc] text-[#ffffff]'
                              : 'border border-[#e5e5e5] bg-[#ffffff] text-[#442c61]'
                          }`}
                        >
                          Día {d}
                        </button>
                      ))}
                    </div>
                  </div>
                </section>

                <section className="space-y-4 rounded-[24px] border-2 border-[#bc8ae1]/60 bg-[#ffffff] p-6 lg:col-span-6">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-display text-lg font-semibold text-[#442c61]">
                      Tarjetas y cuentas inscritas
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowAddCard((v) => !v)}
                      className="inline-flex min-h-[42px] items-center gap-2 rounded-[12px] bg-[#442c61] px-4 py-2 text-xs font-semibold text-[#ffffff] hover:bg-[#543b6c] cursor-pointer"
                    >
                      <Plus className="h-5 w-5 stroke-[2.25]" aria-hidden="true" />
                      <span>Agregar tarjeta</span>
                    </button>
                  </div>

                  {showAddCard && (
                    <form
                      onSubmit={handleAddCard}
                      className="rounded-[16px] border border-[#bc8ae1] bg-[#fafafa] p-4 space-y-3 text-xs"
                    >
                      <div className="grid gap-2.5 sm:grid-cols-2">
                        <input
                          type="text"
                          required
                          placeholder="Alias (Ej. Mi Nequi)"
                          value={cardAlias}
                          onChange={(e) => setCardAlias(e.target.value)}
                          className="h-10 rounded-[10px] border border-[#e5e5e5] bg-[#ffffff] px-3"
                        />
                        <input
                          type="text"
                          required
                          placeholder="Banco o billetera"
                          value={cardBanco}
                          onChange={(e) => setCardBanco(e.target.value)}
                          className="h-10 rounded-[10px] border border-[#e5e5e5] bg-[#ffffff] px-3"
                        />
                        <input
                          type="text"
                          required
                          placeholder="Número de cuenta o tarjeta"
                          value={cardNumero}
                          onChange={(e) => setCardNumero(e.target.value)}
                          className="h-10 rounded-[10px] border border-[#e5e5e5] bg-[#ffffff] px-3 font-mono"
                        />
                        <select
                          value={cardTipo}
                          onChange={(e) =>
                            setCardTipo(
                              e.target.value as 'Debito' | 'Credito' | 'Cuenta Bancaria'
                            )
                          }
                          className="h-10 rounded-[10px] border border-[#e5e5e5] bg-[#ffffff] px-3"
                        >
                          <option value="Cuenta Bancaria">Cuenta Bancaria / Nequi</option>
                          <option value="Debito">Tarjeta Débito</option>
                          <option value="Credito">Tarjeta Crédito</option>
                        </select>
                      </div>
                      <button
                        type="submit"
                        disabled={isBusy}
                        className="w-full rounded-[10px] bg-[#9c44dc] py-2 font-semibold text-[#ffffff] cursor-pointer"
                      >
                        Guardar tarjeta en billetera
                      </button>
                    </form>
                  )}

                  <div className="space-y-2.5">
                    {workspace.wallet.cards.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between rounded-[14px] border border-[#d8c2ef] bg-[#faf5ff] px-4 py-3 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <CreditCard className="h-5 w-5 stroke-[2.25] text-[#9c44dc]" aria-hidden="true" />
                          <div>
                            <p className="font-semibold text-[#0a0a0a]">
                              {c.alias} {c.predeterminada ? '(Principal)' : ''}
                            </p>
                            <p className="font-mono text-[11px] text-[#543b6c]">
                              {c.banco} · •••• {c.ultimos4} · {c.tipo}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteCard(c.id)}
                          aria-label="Eliminar tarjeta"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] text-[#9c645c] hover:bg-[#ffffff] hover:text-[#5c302a] cursor-pointer"
                        >
                          <Trash2 className="h-5 w-5 stroke-[2.25]" aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {/* TAB 4: EMPRESAS QUE LO TIENEN CONTRATADO + POSTULARSE + AUTO-CONTRATO VINCHI */}
            {activeTab === 'empresas' && (
              <div className="space-y-6">
                {/* Botón contratación automática con Vinchi */}
                <section className="flex flex-col justify-between gap-4 rounded-[24px] border-2 border-[#9c44dc] bg-[#ffffff] p-6 sm:flex-row sm:items-center">
                  <div className="max-w-2xl">
                    <div className="inline-flex items-center gap-2 rounded-[8px] bg-[#9c44dc]/12 px-3 py-1 text-xs font-semibold text-[#9c44dc]">
                      <Sparkles className="h-4 w-4 stroke-[2.25]" aria-hidden="true" />
                      <span>Contratación automática Vinchi</span>
                    </div>
                    <h2 className="mt-2 font-display text-xl font-semibold text-[#0a0a0a]">
                      Ser contratado automáticamente por Vinchi
                    </h2>
                    <p className="mt-1 text-xs leading-relaxed text-[#543b6c]">
                      Al activar esta opción quedarás contratado en automático para responder a
                      cualquier empresa aliada que busque domiciliarios disponibles en tu zona.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={handleVinchiAutoContract}
                    className={`vinchi-transition inline-flex min-h-[48px] shrink-0 items-center justify-center gap-2.5 rounded-[16px] px-6 text-xs font-semibold cursor-pointer ${
                      workspace.vinchiAutoContract
                        ? 'bg-[#16a34a] text-[#ffffff] hover:bg-[#15803d]'
                        : 'bg-[#9c44dc] text-[#ffffff] hover:bg-[#543b6c]'
                    }`}
                  >
                    <BadgeCheck className="h-5 w-5 stroke-[2.25]" aria-hidden="true" />
                    <span>
                      {workspace.vinchiAutoContract
                        ? 'Auto-contrato Vinchi Activo'
                        : 'Activar contrato automático Vinchi'}
                    </span>
                  </button>
                </section>

                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Empresas que ya lo tienen contratado */}
                  <section className="rounded-[24px] border-2 border-[#bc8ae1]/60 bg-[#ffffff] p-6">
                    <div className="flex items-center gap-2.5">
                      <Briefcase className="h-5 w-5 stroke-[2.25] text-[#166534]" aria-hidden="true" />
                      <h3 className="font-display text-lg font-semibold text-[#442c61]">
                        Empresas que te tienen contratado
                      </h3>
                    </div>
                    <div className="mt-4 space-y-3">
                      {workspace.companies
                        .filter((c) => c.estado === 'Contratado')
                        .map((c) => (
                          <div
                            key={c.id}
                            className="flex items-center justify-between rounded-[16px] border border-[#16a34a]/35 bg-[#16a34a]/6 px-4 py-3 text-xs"
                          >
                            <div>
                              <p className="font-semibold text-[#0a0a0a]">{c.empresaNombre}</p>
                              <p className="text-[11px] text-[#543b6c]">
                                {c.categoria} · {c.ciudad}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="inline-block rounded-[6px] bg-[#16a34a]/15 px-2 py-0.5 text-[10px] font-semibold text-[#166534]">
                                Contratado
                              </span>
                              <p className="mt-1 font-mono font-semibold text-[#0a0a0a]">
                                {formatCop(c.tarifaBaseCop)} / envío
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </section>

                  {/* Postularse a más empresas */}
                  <section className="rounded-[24px] border-2 border-[#bc8ae1]/60 bg-[#ffffff] p-6">
                    <div className="flex items-center gap-2.5">
                      <Building2 className="h-5 w-5 stroke-[2.25] text-[#9c44dc]" aria-hidden="true" />
                      <h3 className="font-display text-lg font-semibold text-[#442c61]">
                        Postularse a más empresas
                      </h3>
                    </div>
                    <div className="mt-4 space-y-3">
                      {workspace.companies.filter((c) => c.estado !== 'Contratado').length === 0 ? (
                        <p className="text-xs text-[#543b6c]">
                          Ya estás vinculado con todas las empresas disponibles en este momento.
                        </p>
                      ) : (
                        workspace.companies
                          .filter((c) => c.estado !== 'Contratado')
                          .map((c) => (
                            <div
                              key={c.id}
                              className="flex items-center justify-between gap-3 rounded-[16px] border border-[#d8c2ef] bg-[#faf5ff] px-4 py-3 text-xs"
                            >
                              <div>
                                <p className="font-semibold text-[#0a0a0a]">{c.empresaNombre}</p>
                                <p className="text-[11px] text-[#543b6c]">
                                  {c.categoria} · {c.ciudad} · {formatCop(c.tarifaBaseCop)} / envío
                                </p>
                              </div>
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleApplyCompany(c.id)}
                                className="vinchi-transition shrink-0 inline-flex min-h-[40px] items-center justify-center rounded-[12px] bg-[#442c61] px-4 py-2 text-xs font-semibold text-[#ffffff] hover:bg-[#9c44dc] cursor-pointer"
                              >
                                Postularme
                              </button>
                            </div>
                          ))
                      )}
                    </div>
                  </section>
                </div>
              </div>
            )}

            {/* TAB 5: EDITAR PERFIL (FOTO, NOMBRE COMPLETO OBLIGATORIO, TELÉFONO, DIRECCIÓN) */}
            {activeTab === 'perfil' && (
              <form
                onSubmit={handleSaveProfile}
                className="mx-auto max-w-2xl rounded-[24px] border-2 border-[#bc8ae1]/65 bg-[#ffffff] p-6 sm:p-8 space-y-5"
              >
                <div className="flex flex-wrap items-center gap-4 border-b border-[#d8c2ef] pb-5">
                  {profAvatar ? (
                    <img
                      src={profAvatar}
                      alt="Foto de perfil"
                      className="h-16 w-16 rounded-full border-2 border-[#9c44dc] object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#442c61] text-lg font-semibold text-[#ffffff]">
                      {(profPrimerNombre || 'D')[0]}
                    </div>
                  )}
                  <div>
                    <p className="font-display text-lg font-semibold text-[#442c61]">
                      Editar tu perfil de Domicilio
                    </p>
                    <label
                      htmlFor="courier-avatar-upload"
                      className="mt-2 inline-flex min-h-[42px] cursor-pointer items-center gap-2 rounded-[12px] border border-[#bc8ae1] bg-[#faf5ff] px-4 py-2 text-xs font-semibold text-[#442c61] hover:bg-[#f3e8ff]"
                    >
                      <Camera className="h-5 w-5 stroke-[2.25] text-[#9c44dc]" aria-hidden="true" />
                      <span>Cambiar foto de perfil</span>
                      <input
                        id="courier-avatar-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="sr-only"
                      />
                    </label>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-[#442c61]">
                      Primer nombre <span className="text-[#9c44dc]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={profPrimerNombre}
                      onChange={(e) => setProfPrimerNombre(e.target.value)}
                      className="mt-1 h-11 w-full rounded-[14px] border border-[#d8c2ef] bg-[#faf5ff] px-3.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#442c61]">
                      Segundo nombre (opcional)
                    </label>
                    <input
                      type="text"
                      value={profSegundoNombre}
                      onChange={(e) => setProfSegundoNombre(e.target.value)}
                      className="mt-1 h-11 w-full rounded-[14px] border border-[#d8c2ef] bg-[#faf5ff] px-3.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#442c61]">
                      Primer apellido <span className="text-[#9c44dc]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={profPrimerApellido}
                      onChange={(e) => setProfPrimerApellido(e.target.value)}
                      className="mt-1 h-11 w-full rounded-[14px] border border-[#d8c2ef] bg-[#faf5ff] px-3.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#442c61]">
                      Segundo apellido (opcional)
                    </label>
                    <input
                      type="text"
                      value={profSegundoApellido}
                      onChange={(e) => setProfSegundoApellido(e.target.value)}
                      className="mt-1 h-11 w-full rounded-[14px] border border-[#d8c2ef] bg-[#faf5ff] px-3.5 text-sm"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-[#442c61]">
                      Número de teléfono
                    </label>
                    <div className="relative mt-1">
                      <Phone
                        className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9c44dc]"
                        aria-hidden="true"
                      />
                      <input
                        type="tel"
                        value={profTelefono}
                        onChange={(e) => setProfTelefono(e.target.value)}
                        className="h-11 w-full rounded-[14px] border border-[#d8c2ef] bg-[#faf5ff] pl-10 pr-3.5 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#442c61]">Vehículo</label>
                    <select
                      value={profVehiculo}
                      onChange={(e) => setProfVehiculo(e.target.value)}
                      className="mt-1 h-11 w-full rounded-[14px] border border-[#d8c2ef] bg-[#faf5ff] px-3 text-sm"
                    >
                      <option value="Motocicleta">Motocicleta</option>
                      <option value="Bicicleta">Bicicleta</option>
                      <option value="Automóvil">Automóvil</option>
                      <option value="A pie">A pie</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-medium text-[#442c61]">Departamento</label>
                    <select
                      value={profDepartamento}
                      onChange={(e) => setProfDepartamento(e.target.value)}
                      className="mt-1 h-11 w-full rounded-[14px] border border-[#d8c2ef] bg-[#faf5ff] px-3 text-sm"
                    >
                      {COLOMBIA_DEPTS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#442c61]">Municipio</label>
                    <input
                      type="text"
                      value={profMunicipio}
                      onChange={(e) => setProfMunicipio(e.target.value)}
                      className="mt-1 h-11 w-full rounded-[14px] border border-[#d8c2ef] bg-[#faf5ff] px-3.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#442c61]">
                      Dirección de casa
                    </label>
                    <input
                      type="text"
                      value={profDireccion}
                      onChange={(e) => setProfDireccion(e.target.value)}
                      className="mt-1 h-11 w-full rounded-[14px] border border-[#d8c2ef] bg-[#faf5ff] px-3.5 text-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isBusy}
                  className="vinchi-transition inline-flex min-h-[48px] w-full items-center justify-center gap-2.5 rounded-[16px] bg-[#9c44dc] text-sm font-semibold text-[#ffffff] hover:bg-[#543b6c] cursor-pointer"
                >
                  <CheckCircle2 className="h-5 w-5 stroke-[2.25]" aria-hidden="true" />
                  <span>{isBusy ? 'Guardando cambios...' : 'Guardar cambios del perfil'}</span>
                </button>
              </form>
            )}
          </>
        )}
      </main>
    </div>
  );
}
