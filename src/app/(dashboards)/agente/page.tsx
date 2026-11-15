'use client';

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  ArrowLeft,
  BarChart3,
  CalendarClock,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  DollarSign,
  KeyRound,
  MapPinCheck,
  MessageSquare,
  Phone,
  PhoneCall,
  PhoneOff,
  Plus,
  Radio,
  Send,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserCog,
  UserX,
  Wallet,
} from 'lucide-react';
import {
  activateClientAccount,
  addAgentWalletCard,
  completePresencialVisit,
  connectRealtime,
  decideClientRequest,
  deleteAgentWalletCard,
  fetchAgentWorkspace,
  getStoredToken,
  sendAgentMessage,
  setAgentAvailability,
  triggerAgentCall,
  updateAgentAutoPay,
  updateAgentProfile,
  withdrawAgentFunds,
} from '@/src/lib/vinchiClient';
import type {
  AgentKpis,
  AgentProfileDetails,
  AgentRequestRecord,
  AgentWorkspaceState,
  AuthUser,
  PortalChatMessage,
  VinchiRoute,
} from '@/src/types/vinchi';

export interface AgentePortalPageProps {
  kpis: AgentKpis;
  generatedLink?: string;
  agenteNombre?: string;
  onUserUpdated?: (user: AuthUser) => void;
  onGenerateLink?: () => void;
  onCopyLink?: (link: string) => void;
  onNavigate?: (route: VinchiRoute) => void;
}

type AgentSectionTab = 'operacion' | 'estadisticas' | 'billetera' | 'perfil';

const formatCop = (value: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);

function getRequestStatusLabel(req: AgentRequestRecord): {
  label: string;
  tone: string;
} {
  switch (req.status) {
    case 'pending_agent_decision':
      return { label: 'Por aceptar / negar', tone: 'bg-[#d97706]/14 text-[#92400e]' };
    case 'business_opened':
      return { label: 'Negocio abierto', tone: 'bg-[#16a34a]/12 text-[#166534]' };
    case 'activated_presencial':
      return { label: 'Presencial habilitada', tone: 'bg-[#16a34a]/12 text-[#166534]' };
    case 'awaiting_visit_completion':
      return { label: 'Visita pagada · Por visitar', tone: 'bg-[#d97706]/14 text-[#92400e]' };
    case 'awaiting_visit_payment':
      return { label: 'Pendiente pago de visita', tone: 'bg-[#d97706]/14 text-[#92400e]' };
    case 'activated_virtual':
      return { label: 'Activada Virtual', tone: 'bg-[#bc8ae1]/22 text-[#442c61]' };
    case 'matched':
      return { label: 'Aceptado · En chat', tone: 'bg-[#bc8ae1]/22 text-[#442c61]' };
    default:
      return { label: 'En espera', tone: 'bg-[#f3e8ff] text-[#543b6c]' };
  }
}

export default function AgentePortalPage({
  kpis: initialKpis,
  agenteNombre = 'Portal Comercial',
  onUserUpdated,
  onNavigate,
}: AgentePortalPageProps) {
  const [activeTab, setActiveTab] = useState<AgentSectionTab>('operacion');
  const [workspace, setWorkspace] = useState<AgentWorkspaceState>({
    disponible: true,
    kpis: initialKpis,
    vinchiTotalCop: 90000,
    profile: {
      nombre: agenteNombre,
      primerNombre: 'Camila',
      segundoNombre: 'Andrea',
      primerApellido: 'Vargas',
      segundoApellido: '',
      email: 'agente@vinchi.co',
      telefono: '+57 312 489 2010',
      departamento: 'Cundinamarca',
      municipio: 'Bogotá D.C.',
      horario: 'Lunes a Sábado · 8:00 a.m. - 7:00 p.m.',
      bio: 'Agente comercial certificado Vinchi en vinculación presencial y virtual de comercios locales.',
    },
    stats: {
      clientesAceptados: 18,
      clientesNegados: 2,
      activacionesVirtuales: 6,
      activacionesPresenciales: 12,
      horasTrabajadasMes: 142,
      diasActivosMes: 21,
    },
    wallet: {
      saldoDisponibleCop: 240000,
      totalRetiradoCop: 390000,
      autoMonthlyEnabled: true,
      autoMonthlyDay: 1,
      cards: [],
      withdrawals: [],
    },
    requests: [],
    messagesByRequest: {},
  });

  const [selectedRequestId, setSelectedRequestId] = useState<string>('');
  const [chatText, setChatText] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Estado formulario Perfil
  const [profileForm, setProfileForm] = useState<AgentProfileDetails>(workspace.profile);
  const [profileSaved, setProfileSaved] = useState('');

  // Estado Billetera y Retiro
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawCardId, setWithdrawCardId] = useState('');
  const [newCardAlias, setNewCardAlias] = useState('');
  const [newCardBanco, setNewCardBanco] = useState('');
  const [newCardNumero, setNewCardNumero] = useState('');
  const [newCardTitular, setNewCardTitular] = useState('');
  const [newCardExp, setNewCardExp] = useState('12/29');
  const [newCardTipo, setNewCardTipo] = useState<'Debito' | 'Credito' | 'Cuenta Bancaria'>(
    'Debito'
  );
  const [walletFeedback, setWalletFeedback] = useState('');

  const loadWorkspace = async () => {
    try {
      const data = await fetchAgentWorkspace();
      setWorkspace(data);
      setProfileForm(data.profile);
      setSelectedRequestId((prev) =>
        prev && data.requests.some((r) => r.id === prev) ? prev : data.requests[0]?.id || ''
      );
      if (!withdrawCardId && data.wallet.cards.length > 0) {
        const def = data.wallet.cards.find((c) => c.predeterminada) ?? data.wallet.cards[0];
        setWithdrawCardId(def.id);
      }
      setErrorMsg('');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No fue posible cargar las solicitudes.');
    }
  };

  useEffect(() => {
    void loadWorkspace();

    const token = getStoredToken();
    if (!token) return;

    const disconnect = connectRealtime(token, (evt) => {
      if (evt.type === 'agent:workspace') {
        void loadWorkspace();
      } else if (evt.type === 'chat:message') {
        setWorkspace((prev) => {
          const current = prev.messagesByRequest[evt.message.requestId] ?? [];
          if (current.some((m) => m.id === evt.message.id)) return prev;
          return {
            ...prev,
            messagesByRequest: {
              ...prev.messagesByRequest,
              [evt.message.requestId]: [...current, evt.message],
            },
          };
        });
      }
    });

    return () => disconnect();
  }, []);

  const selectedRequest =
    workspace.requests.find((r) => r.id === selectedRequestId) ?? workspace.requests[0] ?? null;
  const activeMessages: PortalChatMessage[] = selectedRequest
    ? workspace.messagesByRequest[selectedRequest.id] ?? []
    : [];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages.length, selectedRequestId]);

  const handleToggleAvailability = async () => {
    setIsBusy(true);
    try {
      const next = !workspace.disponible;
      const res = await setAgentAvailability(next);
      setWorkspace((prev) => ({ ...prev, disponible: res.disponible }));
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error actualizando disponibilidad.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleDecision = async (requestId: string, decision: 'accept' | 'reject') => {
    setIsBusy(true);
    setErrorMsg('');
    setActionMsg('');
    try {
      await decideClientRequest(requestId, decision);
      await loadWorkspace();
      setActionMsg(
        decision === 'accept'
          ? 'Solicitud aceptada. Ya puedes hablar y llamar al cliente en el panel derecho.'
          : 'Solicitud negada. El usuario podrá buscar otro agente disponible.'
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo procesar la decisión.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleActivateMode = async (mode: 'virtual' | 'presencial') => {
    if (!selectedRequest) return;
    setIsBusy(true);
    setErrorMsg('');
    setActionMsg('');
    try {
      const { request } = await activateClientAccount(selectedRequest.id, mode);
      await loadWorkspace();
      setActionMsg(
        mode === 'virtual'
          ? `Cuenta activada en modo Virtual. Código emitido: ${request.activationToken}. Tu ganancia: $10.000 COP.`
          : 'Activación Presencial asignada (Tu ganancia: $30.000 COP). El código se habilitará cuando completes la visita.'
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo activar la cuenta.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleCompleteVisit = async () => {
    if (!selectedRequest) return;
    setIsBusy(true);
    setErrorMsg('');
    setActionMsg('');
    try {
      const { request } = await completePresencialVisit(selectedRequest.id);
      await loadWorkspace();
      setActionMsg(
        `Visita confirmada. El comercio ya tiene habilitado su código (${request.activationToken}) para abrir su negocio.`
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo confirmar la visita.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleSendChat = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedRequest) return;
    const trimmed = chatText.trim();
    if (!trimmed) return;
    setChatText('');
    try {
      const { message } = await sendAgentMessage(selectedRequest.id, trimmed);
      setWorkspace((prev) => {
        const list = prev.messagesByRequest[selectedRequest.id] ?? [];
        if (list.some((m) => m.id === message.id)) return prev;
        return {
          ...prev,
          messagesByRequest: {
            ...prev.messagesByRequest,
            [selectedRequest.id]: [...list, message],
          },
        };
      });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error enviando mensaje.');
    }
  };

  const handleCall = async (action: 'start' | 'answer' | 'end') => {
    if (!selectedRequest) return;
    try {
      await triggerAgentCall(selectedRequest.id, action);
      await loadWorkspace();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error en llamada.');
    }
  };

  const handleAgentAvatarUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const result = reader.result;
        setProfileForm((p) => ({ ...p, avatarDataUrl: result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setProfileSaved('');
    setErrorMsg('');
    if (
      profileForm.primerNombre.trim().length < 2 ||
      profileForm.primerApellido.trim().length < 2
    ) {
      setErrorMsg('Tu primer nombre y primer apellido son obligatorios.');
      return;
    }
    setIsBusy(true);
    try {
      const res = await updateAgentProfile({
        ...profileForm,
        primerNombre: profileForm.primerNombre.trim(),
        segundoNombre: profileForm.segundoNombre?.trim() || undefined,
        primerApellido: profileForm.primerApellido.trim(),
        segundoApellido: profileForm.segundoApellido?.trim() || undefined,
      });
      setWorkspace((prev) => ({ ...prev, profile: res.profile }));
      setProfileForm(res.profile);
      onUserUpdated?.(res.user);
      setProfileSaved('Perfil comercial actualizado correctamente.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo guardar el perfil.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleAddCard = async (e: FormEvent) => {
    e.preventDefault();
    setWalletFeedback('');
    setErrorMsg('');
    setIsBusy(true);
    try {
      const res = await addAgentWalletCard({
        alias: newCardAlias,
        banco: newCardBanco,
        numero: newCardNumero,
        titular: newCardTitular || workspace.profile.nombre,
        expiracion: newCardExp,
        tipo: newCardTipo,
        predeterminada: workspace.wallet.cards.length === 0,
      });
      setWorkspace((prev) => ({ ...prev, wallet: res.wallet }));
      setNewCardAlias('');
      setNewCardBanco('');
      setNewCardNumero('');
      setWalletFeedback('Tarjeta agregada a tu billetera de pagos.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo agregar la tarjeta.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    setIsBusy(true);
    try {
      const res = await deleteAgentWalletCard(cardId);
      setWorkspace((prev) => ({ ...prev, wallet: res.wallet }));
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo eliminar la tarjeta.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleToggleAutoPay = async (nextEnabled: boolean, nextDay?: number, cardId?: string) => {
    setWalletFeedback('');
    setErrorMsg('');
    setIsBusy(true);
    try {
      const res = await updateAgentAutoPay({
        autoMonthlyEnabled: nextEnabled,
        autoMonthlyDay: nextDay ?? workspace.wallet.autoMonthlyDay,
        defaultCardId: cardId,
      });
      setWorkspace((prev) => ({ ...prev, wallet: res.wallet }));
      setWalletFeedback(
        nextEnabled
          ? `Retiro automático mensual activado para el día ${res.wallet.autoMonthlyDay} de cada mes.`
          : 'Retiro automático mensual desactivado.'
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo actualizar el retiro automático.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleWithdraw = async (e: FormEvent) => {
    e.preventDefault();
    setWalletFeedback('');
    setErrorMsg('');
    const monto = Number(withdrawAmount);
    setIsBusy(true);
    try {
      const res = await withdrawAgentFunds({
        montoCop: monto,
        cardId: withdrawCardId,
      });
      setWorkspace((prev) => ({ ...prev, wallet: res.wallet }));
      setWithdrawAmount('');
      setWalletFeedback(`Retiro de ${formatCop(monto)} procesado a tu tarjeta seleccionada.`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo procesar el retiro.');
    } finally {
      setIsBusy(false);
    }
  };

  const pendingDecisionsCount = workspace.requests.filter(
    (r) => r.status === 'pending_agent_decision'
  ).length;

  const navTabs: { id: AgentSectionTab; label: string; icon: typeof Radio; badge?: number }[] = [
    {
      id: 'operacion',
      label: 'Operación (3 secciones)',
      icon: Radio,
      badge: pendingDecisionsCount,
    },
    {
      id: 'estadisticas',
      label: 'Dashboard y Estadísticas',
      icon: BarChart3,
    },
    {
      id: 'billetera',
      label: 'Retiros y Billetera',
      icon: Wallet,
    },
    {
      id: 'perfil',
      label: 'Editar Perfil',
      icon: UserCog,
    },
  ];

  const isSelectedPendingDecision = selectedRequest?.status === 'pending_agent_decision';

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f3e8ff]/75 via-[#faf5ff] to-[#f4ecfb] text-[#0a0a0a]">
      <header className="border-b-2 border-[#543b6c] bg-[#442c61] px-4 py-4 text-[#ffffff] sm:px-6">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0 sm:gap-4">
            <button
              type="button"
              onClick={() => onNavigate?.('/(public)')}
              className="vinchi-transition inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] border border-[#bc8ae1]/40 bg-[#ffffff]/14 text-[#ffffff] hover:bg-[#9c44dc] cursor-pointer"
              aria-label="Volver al inicio"
            >
              <ArrowLeft className="h-5 w-5 stroke-[2.25]" aria-hidden="true" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-[#e9d5ff]">
                <span>Vinchi</span>
                <ChevronRight className="h-4 w-4 stroke-[2.25] text-[#bc8ae1]" aria-hidden="true" />
                <span className="font-semibold text-[#ffffff]">Espacio del Agente</span>
              </div>
              <h1 className="truncate font-display text-xl font-semibold tracking-[-0.025em] text-[#ffffff]">
                {workspace.profile.nombre} · {workspace.profile.municipio}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-[14px] border border-[#bc8ae1]/45 bg-[#ffffff]/12 px-4 py-2 text-xs text-[#e9d5ff]">
              <span>Disponible para retiro: </span>
              <strong className="font-mono font-semibold text-[#ffffff]">
                {formatCop(workspace.wallet.saldoDisponibleCop)}
              </strong>
            </div>

            <button
              type="button"
              disabled={isBusy}
              onClick={handleToggleAvailability}
              className={`vinchi-transition inline-flex min-h-[44px] items-center gap-2.5 rounded-[14px] px-4 py-2 text-xs font-semibold cursor-pointer ${
                workspace.disponible
                  ? 'bg-[#16a34a] text-[#ffffff] border border-[#22c55e]/50 hover:bg-[#15803d]'
                  : 'bg-[#ffffff]/12 text-[#f3e8ff] border border-[#bc8ae1]/45 hover:bg-[#ffffff]/20'
              }`}
            >
              <Radio className="h-5 w-5 stroke-[2.25]" aria-hidden="true" />
              <span>
                {workspace.disponible ? 'Disponible para comercios' : 'No disponible ahora'}
              </span>
            </button>
          </div>
        </div>

        {/* Navegación interna de las vistas del Agente */}
        <div className="mx-auto mt-4 flex max-w-[1440px] flex-wrap gap-2.5 border-t border-[#bc8ae1]/25 pt-3.5">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`vinchi-transition inline-flex min-h-[44px] items-center gap-2.5 rounded-[14px] px-4 py-2 text-xs font-semibold cursor-pointer ${
                  active
                    ? 'bg-[#9c44dc] text-[#ffffff] shadow-[0_6px_16px_-6px_rgba(156,68,220,0.75)]'
                    : 'border border-[#bc8ae1]/40 bg-[#ffffff]/12 text-[#f3e8ff] hover:bg-[#ffffff]/20'
                }`}
              >
                <Icon className="h-5 w-5 stroke-[2.25]" aria-hidden="true" />
                <span>{tab.label}</span>
                {typeof tab.badge === 'number' && tab.badge > 0 && (
                  <span className="rounded-[6px] bg-[#ffffff] px-2 py-0.5 font-mono text-[11px] font-bold text-[#442c61]">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8">
        {/* VISTA 1: OPERACIÓN DIVIDIDA EN 3 PANELES (Izquierda aceptar/negar, Centro control, Derecha chat y llamada) */}
        {activeTab === 'operacion' && (
          <div className="grid gap-5 lg:grid-cols-12">
            {/* PANEL IZQUIERDO (4 cols): Usuarios que buscaron con "Buscar agente automático" para Aceptar o Negar */}
            <section
              aria-label="Solicitudes para aceptar o negar"
              className="flex flex-col gap-3 rounded-[24px] border-2 border-[#bc8ae1]/60 bg-[#ffffff] p-5 lg:col-span-4"
            >
              <div className="flex items-center justify-between border-b border-[#d8c2ef] pb-3">
                <div>
                  <h2 className="font-display text-base font-semibold text-[#442c61]">
                    Solicitudes entrantes y clientes
                  </h2>
                  <p className="text-[11px] text-[#543b6c]">
                    Acepta o niega comercios que usaron "Buscar agente automático".
                  </p>
                </div>
                <span className="font-mono text-xs font-semibold text-[#9c44dc]">
                  {workspace.requests.length}
                </span>
              </div>

              {workspace.requests.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#f3e8ff] text-[#9c44dc]">
                    <UserCheck className="h-7 w-7 stroke-[2.25]" aria-hidden="true" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-[#442c61]">
                    Sin solicitudes en cola
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-[#543b6c]">
                    Cuando un usuario pague y pulse "Buscar agente automático", aparecerá aquí para
                    que decidas aceptarlo o negarlo.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 overflow-y-auto max-h-[600px] pr-1">
                  {workspace.requests.map((reqItem) => {
                    const statusInfo = getRequestStatusLabel(reqItem);
                    const selected = selectedRequest?.id === reqItem.id;
                    const needsDecision = reqItem.status === 'pending_agent_decision';
                    return (
                      <div
                        key={reqItem.id}
                        className={`vinchi-transition rounded-[18px] border p-4 ${
                          selected
                            ? 'border-2 border-[#9c44dc] bg-[#faf5ff]'
                            : 'border-[#d8c2ef] bg-[#faf5ff]/55'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedRequestId(reqItem.id)}
                          className="w-full text-left cursor-pointer"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-sm text-[#0a0a0a]">
                                {reqItem.businessName}
                              </p>
                              <p className="truncate text-xs text-[#543b6c]">
                                {reqItem.clientName} · {reqItem.clientEmail}
                              </p>
                            </div>
                            <span
                              className={`rounded-[6px] px-2 py-0.5 text-[10px] font-semibold shrink-0 ${statusInfo.tone}`}
                            >
                              {statusInfo.label}
                            </span>
                          </div>
                        </button>

                        {needsDecision && (
                          <div className="mt-3 grid grid-cols-2 gap-2.5 border-t border-[#e5e5e5] pt-3">
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleDecision(reqItem.id, 'accept')}
                              className="vinchi-transition inline-flex min-h-[42px] items-center justify-center gap-2 rounded-[12px] bg-[#16a34a] px-4 py-2 text-xs font-semibold text-[#ffffff] hover:bg-[#15803d] cursor-pointer"
                            >
                              <Check className="h-4 w-4 stroke-[2.25]" aria-hidden="true" />
                              <span>Aceptar</span>
                            </button>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleDecision(reqItem.id, 'reject')}
                              className="vinchi-transition inline-flex min-h-[42px] items-center justify-center gap-2 rounded-[12px] bg-[#9c645c] px-4 py-2 text-xs font-semibold text-[#ffffff] hover:bg-[#7f4d46] cursor-pointer"
                            >
                              <UserX className="h-4 w-4 stroke-[2.25]" aria-hidden="true" />
                              <span>Negar</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* PANEL CENTRAL (4 cols): Control de activación Virtual / Presencial del comercio */}
            <section
              aria-label="Activación y gestión del comercio"
              className="flex flex-col justify-between rounded-[24px] border-2 border-[#bc8ae1]/60 bg-[#ffffff] p-5 lg:col-span-4"
            >
              {!selectedRequest ? (
                <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#f3e8ff] text-[#9c44dc]">
                    <ShieldCheck className="h-7 w-7 stroke-[2.25]" aria-hidden="true" />
                  </div>
                  <p className="mt-3 text-sm font-medium text-[#442c61]">
                    Selecciona un comercio a la izquierda para gestionarlo.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border-b border-[#d8c2ef] pb-3">
                    <p className="text-xs font-medium text-[#9c44dc]">Verificación de espacio</p>
                    <h2 className="mt-1 font-display text-lg font-semibold text-[#0a0a0a]">
                      {selectedRequest.businessName}
                    </h2>
                    <p className="text-xs text-[#543b6c]">
                      {selectedRequest.clientName} · {selectedRequest.clientEmail}
                    </p>
                  </div>

                  {isSelectedPendingDecision ? (
                    <div className="rounded-[16px] border border-[#d97706]/40 bg-[#d97706]/10 p-4 text-xs text-[#92400e] space-y-3">
                      <p className="font-semibold">
                        Esta solicitud está pendiente de tu decisión.
                      </p>
                      <p>
                        Acepta al cliente para habilitar el chat en vivo, la llamada y las opciones
                        de activación de cuenta.
                      </p>
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleDecision(selectedRequest.id, 'accept')}
                          className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-[12px] bg-[#16a34a] px-4 py-2 font-semibold text-[#ffffff] hover:bg-[#15803d] cursor-pointer"
                        >
                          <Check className="h-4 w-4 stroke-[2.25]" aria-hidden="true" />
                          <span>Aceptar cliente</span>
                        </button>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleDecision(selectedRequest.id, 'reject')}
                          className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-[12px] bg-[#9c645c] px-4 py-2 font-semibold text-[#ffffff] hover:bg-[#7f4d46] cursor-pointer"
                        >
                          <UserX className="h-4 w-4 stroke-[2.25]" aria-hidden="true" />
                          <span>Negar cliente</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2 rounded-[16px] border border-[#d8c2ef] bg-[#faf5ff] p-4 text-xs">
                        <p className="font-semibold text-[#442c61]">Tu ganancia por activación:</p>
                        <div className="flex items-center justify-between text-[#543b6c]">
                          <span>Virtual (activa ya):</span>
                          <span className="font-mono font-semibold text-[#0a0a0a]">
                            $10.000 COP
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[#543b6c]">
                          <span>Presencial (con visita):</span>
                          <span className="font-mono font-semibold text-[#0a0a0a]">
                            $30.000 COP
                          </span>
                        </div>
                      </div>

                      {selectedRequest.activationToken && (
                        <div className="rounded-[14px] border border-[#bc8ae1] bg-[#f3e8ff] p-3.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-[#442c61]">Token de activación:</span>
                            <span className="font-mono text-sm font-bold text-[#0a0a0a]">
                              {selectedRequest.activationToken}
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] text-[#543b6c]">
                            {selectedRequest.tokenUnlocked
                              ? 'Habilitado para el comercio.'
                              : 'Deshabilitado hasta completar la visita presencial.'}
                          </p>
                        </div>
                      )}

                      <div className="space-y-2.5">
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleActivateMode('virtual')}
                          className="vinchi-transition inline-flex min-h-[46px] w-full items-center justify-center gap-2.5 rounded-[14px] bg-[#9c44dc] px-4 text-xs font-semibold text-[#ffffff] hover:bg-[#543b6c] disabled:opacity-50 cursor-pointer"
                        >
                          <ShieldCheck className="h-5 w-5 stroke-[2.25]" aria-hidden="true" />
                          <span>Activar cuenta virtual ($10.000)</span>
                        </button>

                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleActivateMode('presencial')}
                          className="vinchi-transition inline-flex min-h-[46px] w-full items-center justify-center gap-2.5 rounded-[14px] bg-[#442c61] px-4 text-xs font-semibold text-[#ffffff] hover:bg-[#543b6c] disabled:opacity-50 cursor-pointer"
                        >
                          <KeyRound className="h-5 w-5 stroke-[2.25]" aria-hidden="true" />
                          <span>Activar cuenta presencial ($30.000)</span>
                        </button>

                        {selectedRequest.visitPaid && !selectedRequest.visitCompleted && (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={handleCompleteVisit}
                            className="vinchi-transition inline-flex min-h-[46px] w-full items-center justify-center gap-2.5 rounded-[14px] bg-[#16a34a] px-4 text-xs font-semibold text-[#ffffff] hover:bg-[#15803d] disabled:opacity-50 cursor-pointer"
                          >
                            <MapPinCheck className="h-5 w-5 stroke-[2.25]" aria-hidden="true" />
                            <span>Confirmar visita realizada y habilitar token</span>
                          </button>
                        )}
                      </div>
                    </>
                  )}

                  {actionMsg && (
                    <p className="rounded-[12px] border border-[#16a34a]/30 bg-[#16a34a]/10 px-3.5 py-2.5 text-xs font-medium text-[#166534]">
                      {actionMsg}
                    </p>
                  )}
                  {errorMsg && (
                    <p className="rounded-[12px] border border-[#9c645c]/40 bg-[#d0b7b0]/25 px-3.5 py-2.5 text-xs font-medium text-[#5c302a]">
                      {errorMsg}
                    </p>
                  )}
                </div>
              )}
            </section>

            {/* PANEL DERECHO (4 cols): Chat y Llamada en tiempo real con el usuario */}
            <section
              aria-label="Chat y llamada con el cliente"
              className="flex min-h-[540px] flex-col justify-between rounded-[24px] border-2 border-[#bc8ae1]/60 bg-[#ffffff] lg:col-span-4"
            >
              {!selectedRequest || isSelectedPendingDecision ? (
                <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#f3e8ff] text-[#9c44dc]">
                    <MessageSquare className="h-7 w-7 stroke-[2.25]" aria-hidden="true" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-[#442c61]">
                    {isSelectedPendingDecision
                      ? 'Acepta la solicitud para abrir el chat y llamada'
                      : 'Chat y llamada en vivo'}
                  </p>
                  <p className="mt-1 text-xs text-[#543b6c]">
                    Al aceptar un comercio a la izquierda podrás escribirle y llamarlo aquí al
                    instante.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-2 border-b border-[#d8c2ef] bg-[#faf5ff] px-4 py-3.5 rounded-t-[22px]">
                    <div>
                      <p className="text-sm font-semibold text-[#0a0a0a]">
                        {selectedRequest.clientName}
                      </p>
                      <p className="text-[11px] text-[#543b6c]">
                        {selectedRequest.callState.status === 'connected'
                          ? 'En llamada en vivo'
                          : selectedRequest.callState.status === 'ringing'
                            ? 'Llamando...'
                            : 'Chat en vivo'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {selectedRequest.callState.status === 'idle' && (
                        <button
                          type="button"
                          onClick={() => handleCall('start')}
                          className="vinchi-transition inline-flex min-h-[40px] items-center gap-2 rounded-[12px] bg-[#442c61] px-4 py-2 text-xs font-semibold text-[#ffffff] hover:bg-[#543b6c] cursor-pointer"
                        >
                          <Phone className="h-4 w-4 stroke-[2.25]" aria-hidden="true" />
                          <span>Llamar</span>
                        </button>
                      )}
                      {selectedRequest.callState.status === 'ringing' &&
                        selectedRequest.callState.initiatorRole === 'cliente' && (
                          <button
                            type="button"
                            onClick={() => handleCall('answer')}
                            className="vinchi-transition inline-flex min-h-[40px] items-center gap-2 rounded-[12px] bg-[#16a34a] px-4 py-2 text-xs font-semibold text-[#ffffff] hover:bg-[#15803d] cursor-pointer"
                          >
                            <PhoneCall className="h-4 w-4 stroke-[2.25]" aria-hidden="true" />
                            <span>Contestar</span>
                          </button>
                        )}
                      {selectedRequest.callState.status !== 'idle' && (
                        <button
                          type="button"
                          onClick={() => handleCall('end')}
                          className="vinchi-transition inline-flex min-h-[40px] items-center gap-2 rounded-[12px] bg-[#9c645c] px-4 py-2 text-xs font-semibold text-[#ffffff] hover:bg-[#7f4d46] cursor-pointer"
                        >
                          <PhoneOff className="h-4 w-4 stroke-[2.25]" aria-hidden="true" />
                          <span>Colgar</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 space-y-2.5 overflow-y-auto px-4 py-3.5 max-h-[410px]">
                    {activeMessages.map((msg) => {
                      const isAgent = msg.senderRole === 'agente';
                      const isSystem = msg.senderRole === 'sistema';
                      if (isSystem) {
                        return (
                          <div
                            key={msg.id}
                            className="rounded-[10px] border border-[#e5e5e5] bg-[#fafafa] px-3 py-1.5 text-center text-[11px] text-[#543b6c]"
                          >
                            {msg.text}
                          </div>
                        );
                      }
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isAgent ? 'items-end' : 'items-start'}`}
                        >
                          <span className="mb-0.5 text-[10px] font-medium text-[#543b6c]">
                            {msg.senderName}
                          </span>
                          <div
                            className={`max-w-[85%] rounded-[16px] px-3.5 py-2 text-xs leading-relaxed ${
                              isAgent
                                ? 'bg-[#442c61] text-[#ffffff]'
                                : 'border border-[#e5e5e5] bg-[#fafafa] text-[#0a0a0a]'
                            }`}
                          >
                            {msg.text}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={chatEndRef} />
                  </div>

                  <form
                    onSubmit={handleSendChat}
                    className="flex items-center gap-2 border-t border-[#d8c2ef] px-3.5 py-3"
                  >
                    <input
                      type="text"
                      value={chatText}
                      onChange={(e) => setChatText(e.target.value)}
                      placeholder="Escribir al cliente..."
                      className="h-11 flex-1 rounded-[14px] border border-[#d8c2ef] bg-[#faf5ff] px-3.5 text-xs text-[#0a0a0a] focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="vinchi-transition inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#9c44dc] text-xs font-medium text-[#ffffff] hover:bg-[#543b6c] cursor-pointer"
                      aria-label="Enviar mensaje"
                    >
                      <Send className="h-5 w-5 stroke-[2.25]" aria-hidden="true" />
                    </button>
                  </form>
                </>
              )}
            </section>
          </div>
        )}

        {/* VISTA 2: DASHBOARD COMPLETO DE ESTADÍSTICAS, GANANCIAS Y TRABAJO */}
        {activeTab === 'estadisticas' && (
          <div className="space-y-6">
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <article className="rounded-[24px] border-2 border-[#9c44dc] bg-gradient-to-br from-[#442c61] to-[#543b6c] p-5 text-[#ffffff]">
                <p className="text-xs font-medium text-[#e9d5ff]">Ganancias totales acumuladas</p>
                <p className="mt-3 font-mono text-3xl font-semibold">
                  {formatCop(workspace.kpis.comisionAcumuladaCop)}
                </p>
                <p className="mt-1 text-xs text-[#e9d5ff]">
                  Saldo disponible ahora: {formatCop(workspace.wallet.saldoDisponibleCop)}
                </p>
              </article>

              <article className="rounded-[24px] border-2 border-[#bc8ae1]/60 bg-[#ffffff] p-5">
                <p className="text-xs font-medium text-[#543b6c]">Clientes aceptados</p>
                <p className="mt-3 font-mono text-3xl font-semibold text-[#442c61]">
                  {workspace.stats.clientesAceptados}
                </p>
                <p className="mt-1 text-xs text-[#543b6c]">
                  Clientes negados: {workspace.stats.clientesNegados} · Conversión:{' '}
                  {workspace.kpis.tasaConversion}
                </p>
              </article>

              <article className="rounded-[24px] border-2 border-[#bc8ae1]/60 bg-[#ffffff] p-5">
                <p className="text-xs font-medium text-[#543b6c]">Tiempo trabajado este mes</p>
                <p className="mt-3 font-mono text-3xl font-semibold text-[#442c61]">
                  {workspace.stats.horasTrabajadasMes} h
                </p>
                <p className="mt-1 text-xs text-[#543b6c]">
                  {workspace.stats.diasActivosMes} días activos con jornada registrada
                </p>
              </article>

              <article className="rounded-[24px] border-2 border-[#bc8ae1]/60 bg-[#ffffff] p-5">
                <p className="text-xs font-medium text-[#543b6c]">Activaciones por modalidad</p>
                <p className="mt-3 font-mono text-3xl font-semibold text-[#9c44dc]">
                  {workspace.stats.activacionesVirtuales + workspace.stats.activacionesPresenciales}
                </p>
                <p className="mt-1 text-xs text-[#543b6c]">
                  Virtual: {workspace.stats.activacionesVirtuales} · Presencial:{' '}
                  {workspace.stats.activacionesPresenciales}
                </p>
              </article>
            </section>

            <section className="rounded-[24px] border-2 border-[#bc8ae1]/60 bg-[#ffffff] p-6">
              <div className="flex items-center justify-between border-b border-[#d8c2ef] pb-4">
                <div>
                  <h2 className="font-display text-lg font-semibold text-[#442c61]">
                    Detalle de comercios atendidos y tus ganancias
                  </h2>
                  <p className="text-xs text-[#543b6c]">
                    Historial completo de comercios vinculados con el cálculo de tu ganancia por activación.
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#f3e8ff] text-[#9c44dc]">
                  <Clock className="h-5 w-5 stroke-[2.25]" aria-hidden="true" />
                </div>
              </div>

              {workspace.requests.length === 0 ? (
                <p className="py-8 text-center text-xs text-[#543b6c]">
                  Tus vinculaciones recientes aparecerán aquí con el cálculo exacto de ganancia.
                </p>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="border-b border-[#d8c2ef] bg-[#faf5ff] text-xs text-[#442c61]">
                      <tr>
                        <th className="py-2.5 pr-4">Comercio</th>
                        <th className="py-2.5 pr-4">Modalidad</th>
                        <th className="py-2.5 pr-4">Estado</th>
                        <th className="py-2.5 text-right">Tu ganancia</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#d8c2ef]/70">
                      {workspace.requests.map((r) => (
                        <tr key={r.id}>
                          <td className="py-3 pr-4 font-medium text-[#0a0a0a]">{r.businessName}</td>
                          <td className="py-3 pr-4 text-[#543b6c]">
                            {r.activationMode === 'presencial'
                              ? 'Presencial'
                              : r.activationMode === 'virtual'
                                ? 'Virtual'
                                : 'En asesoría'}
                          </td>
                          <td className="py-3 pr-4 text-[#543b6c]">
                            {getRequestStatusLabel(r).label}
                          </td>
                          <td className="py-3 text-right font-mono font-semibold text-[#166534]">
                            {formatCop(r.agentEarningsCop)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}

        {/* VISTA 3: RETIRAR DINERO Y BILLETERA DE TARJETAS CON RETIRO AUTOMÁTICO MENSUAL */}
        {activeTab === 'billetera' && (
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Columna izquierda: Saldo + Retiro manual + Retiro Automático Mensual */}
            <section className="space-y-6 lg:col-span-6">
              <div className="rounded-[24px] border-2 border-[#9c44dc] bg-gradient-to-br from-[#442c61] to-[#543b6c] p-6 text-[#ffffff]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium text-[#e9d5ff]">Saldo disponible para retirar</p>
                    <p className="mt-2 font-mono text-4xl font-semibold">
                      {formatCop(workspace.wallet.saldoDisponibleCop)}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#ffffff]/14 text-[#e9d5ff]">
                    <DollarSign className="h-7 w-7 stroke-[2.25]" aria-hidden="true" />
                  </div>
                </div>
                <p className="mt-3 text-xs text-[#e9d5ff]">
                  Total retirado histórico: {formatCop(workspace.wallet.totalRetiradoCop)}
                </p>
              </div>

              {/* Formulario de retiro inmediato */}
              <form
                onSubmit={handleWithdraw}
                className="rounded-[24px] border-2 border-[#bc8ae1]/60 bg-[#ffffff] p-6 space-y-4"
              >
                <h2 className="font-display text-lg font-semibold text-[#442c61]">
                  Retirar dinero a tu tarjeta
                </h2>

                <div>
                  <label htmlFor="wd-amount" className="block text-xs font-medium text-[#442c61]">
                    Monto a retirar (COP)
                  </label>
                  <input
                    id="wd-amount"
                    type="number"
                    min={1000}
                    max={workspace.wallet.saldoDisponibleCop || 10000000}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Ej. 100000"
                    className="mt-1.5 h-11 w-full rounded-[14px] border border-[#d8c2ef] bg-[#faf5ff] px-4 font-mono text-sm text-[#0a0a0a] focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="wd-card" className="block text-xs font-medium text-[#442c61]">
                    Tarjeta o cuenta destino
                  </label>
                  <select
                    id="wd-card"
                    value={withdrawCardId}
                    onChange={(e) => setWithdrawCardId(e.target.value)}
                    className="mt-1.5 h-11 w-full rounded-[14px] border border-[#d8c2ef] bg-[#faf5ff] px-3 text-sm text-[#0a0a0a] focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none"
                  >
                    {workspace.wallet.cards.length === 0 ? (
                      <option value="">Agrega una tarjeta a la derecha primero</option>
                    ) : (
                      workspace.wallet.cards.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.alias} · {c.banco} •••• {c.ultimos4}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isBusy || workspace.wallet.cards.length === 0}
                  className="vinchi-transition inline-flex min-h-[48px] w-full items-center justify-center gap-2.5 rounded-[16px] bg-[#9c44dc] px-5 text-sm font-semibold text-[#ffffff] hover:bg-[#543b6c] disabled:opacity-50 cursor-pointer"
                >
                  <Wallet className="h-5 w-5 stroke-[2.25]" aria-hidden="true" />
                  <span>Retirar dinero ahora</span>
                </button>
              </form>

              {/* Configuración de Retiro Automático Mensual */}
              <div className="rounded-[24px] border-2 border-[#bc8ae1]/60 bg-[#ffffff] p-6 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#f3e8ff] text-[#9c44dc]">
                      <CalendarClock className="h-5 w-5 stroke-[2.25]" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="font-display text-base font-semibold text-[#442c61]">
                        Pago automático mensual a tu tarjeta
                      </h3>
                      <p className="mt-0.5 text-xs text-[#543b6c]">
                        Transfiere automáticamente todo tu saldo acumulado cada mes a tu tarjeta
                        predeterminada.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleToggleAutoPay(!workspace.wallet.autoMonthlyEnabled)}
                    className={`rounded-[12px] px-4 py-2 text-xs font-semibold cursor-pointer ${
                      workspace.wallet.autoMonthlyEnabled
                        ? 'bg-[#16a34a]/14 text-[#166534]'
                        : 'bg-[#f3e8ff] text-[#543b6c]'
                    }`}
                  >
                    {workspace.wallet.autoMonthlyEnabled ? 'Activado' : 'Desactivado'}
                  </button>
                </div>

                <div className="flex items-center justify-between gap-4 border-t border-[#d8c2ef] pt-4 text-xs">
                  <label htmlFor="autopay-day" className="font-medium text-[#442c61]">
                    Día de retiro mensual automático:
                  </label>
                  <select
                    id="autopay-day"
                    value={workspace.wallet.autoMonthlyDay}
                    onChange={(e) =>
                      handleToggleAutoPay(workspace.wallet.autoMonthlyEnabled, Number(e.target.value))
                    }
                    className="h-10 rounded-[10px] border border-[#d8c2ef] bg-[#faf5ff] px-3 font-mono text-xs text-[#0a0a0a]"
                  >
                    <option value={1}>Día 1 de cada mes</option>
                    <option value={5}>Día 5 de cada mes</option>
                    <option value={15}>Día 15 de cada mes</option>
                    <option value={28}>Día 28 de cada mes</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Columna derecha: Billetera de Tarjetas + Historial de Retiros */}
            <section className="space-y-6 lg:col-span-6">
              <div className="rounded-[24px] border-2 border-[#bc8ae1]/60 bg-[#ffffff] p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-lg font-semibold text-[#442c61]">
                    Billetera de tarjetas y cuentas
                  </h2>
                  <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#f3e8ff] text-[#9c44dc]">
                    <CreditCard className="h-5 w-5 stroke-[2.25]" aria-hidden="true" />
                  </div>
                </div>

                <div className="space-y-3">
                  {workspace.wallet.cards.map((card) => (
                    <div
                      key={card.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-[#d8c2ef] bg-[#faf5ff] p-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-[#0a0a0a]">{card.alias}</p>
                          {card.predeterminada && (
                            <span className="rounded-[6px] bg-[#bc8ae1]/28 px-2 py-0.5 text-[10px] font-semibold text-[#442c61]">
                              Automática mensual
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 font-mono text-xs text-[#543b6c]">
                          {card.banco} · {card.tipo} •••• {card.ultimos4} · Vence {card.expiracion}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {!card.predeterminada && (
                          <button
                            type="button"
                            onClick={() =>
                              handleToggleAutoPay(
                                workspace.wallet.autoMonthlyEnabled,
                                workspace.wallet.autoMonthlyDay,
                                card.id
                              )
                            }
                            className="inline-flex min-h-[40px] items-center rounded-[10px] border border-[#bc8ae1] bg-[#ffffff] px-3.5 py-2 text-xs font-semibold text-[#442c61] hover:bg-[#f3e8ff] cursor-pointer"
                          >
                            Usar para automático
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteCard(card.id)}
                          aria-label="Eliminar tarjeta"
                          className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#d8c2ef] bg-[#ffffff] text-[#9c645c] hover:border-[#9c645c] cursor-pointer"
                        >
                          <Trash2 className="h-5 w-5 stroke-[2.25]" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Agregar tarjeta nueva */}
                <form
                  onSubmit={handleAddCard}
                  className="space-y-3 border-t border-[#d8c2ef] pt-5"
                >
                  <p className="text-xs font-semibold text-[#442c61]">
                    Vincular nueva tarjeta o cuenta bancaria
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      type="text"
                      value={newCardAlias}
                      onChange={(e) => setNewCardAlias(e.target.value)}
                      placeholder="Alias (Ej. Nequi / Davivienda)"
                      className="h-10 rounded-[12px] border border-[#d8c2ef] bg-[#faf5ff] px-3 text-xs text-[#0a0a0a]"
                    />
                    <input
                      type="text"
                      value={newCardBanco}
                      onChange={(e) => setNewCardBanco(e.target.value)}
                      placeholder="Banco o entidad"
                      className="h-10 rounded-[12px] border border-[#d8c2ef] bg-[#faf5ff] px-3 text-xs text-[#0a0a0a]"
                    />
                    <input
                      type="text"
                      value={newCardNumero}
                      onChange={(e) => setNewCardNumero(e.target.value)}
                      placeholder="Número de tarjeta o cuenta"
                      className="h-10 rounded-[12px] border border-[#d8c2ef] bg-[#faf5ff] px-3 font-mono text-xs text-[#0a0a0a]"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={newCardExp}
                        onChange={(e) => setNewCardExp(e.target.value)}
                        placeholder="MM/AA"
                        className="h-10 rounded-[12px] border border-[#d8c2ef] bg-[#faf5ff] px-3 font-mono text-xs text-[#0a0a0a]"
                      />
                      <select
                        value={newCardTipo}
                        onChange={(e) =>
                          setNewCardTipo(
                            e.target.value as 'Debito' | 'Credito' | 'Cuenta Bancaria'
                          )
                        }
                        className="h-10 rounded-[12px] border border-[#d8c2ef] bg-[#faf5ff] px-2 text-xs text-[#0a0a0a]"
                      >
                        <option value="Debito">Débito</option>
                        <option value="Credito">Crédito</option>
                        <option value="Cuenta Bancaria">Cuenta</option>
                      </select>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={newCardTitular}
                    onChange={(e) => setNewCardTitular(e.target.value)}
                    placeholder="Nombre del titular"
                    className="h-10 w-full rounded-[12px] border border-[#d8c2ef] bg-[#faf5ff] px-3 text-xs text-[#0a0a0a]"
                  />
                  <button
                    type="submit"
                    disabled={isBusy}
                    className="vinchi-transition inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[14px] bg-[#442c61] px-4 text-xs font-semibold text-[#ffffff] hover:bg-[#543b6c] cursor-pointer"
                  >
                    <Plus className="h-5 w-5 stroke-[2.25]" aria-hidden="true" />
                    <span>Agregar a mi billetera</span>
                  </button>
                </form>

                {walletFeedback && (
                  <p className="rounded-[12px] border border-[#16a34a]/30 bg-[#16a34a]/10 px-3.5 py-2.5 text-xs font-medium text-[#166534]">
                    {walletFeedback}
                  </p>
                )}
                {errorMsg && (
                  <p className="rounded-[12px] border border-[#9c645c]/40 bg-[#d0b7b0]/25 px-3.5 py-2.5 text-xs font-medium text-[#5c302a]">
                    {errorMsg}
                  </p>
                )}
              </div>

              {/* Historial de retiros */}
              <div className="rounded-[24px] border-2 border-[#bc8ae1]/60 bg-[#ffffff] p-6">
                <h3 className="font-display text-base font-semibold text-[#442c61]">
                  Historial de retiros
                </h3>
                {workspace.wallet.withdrawals.length === 0 ? (
                  <p className="mt-3 text-xs text-[#543b6c]">
                    Aún no has realizado retiros manuales o automáticos.
                  </p>
                ) : (
                  <ul className="mt-4 divide-y divide-[#d8c2ef]/70 text-xs">
                    {workspace.wallet.withdrawals.map((w) => (
                      <li key={w.id} className="flex items-center justify-between gap-3 py-3">
                        <div>
                          <p className="font-semibold text-[#0a0a0a]">
                            {w.cardLabel} · {w.tipo}
                          </p>
                          <p className="text-[11px] text-[#543b6c]">
                            {new Date(w.createdAt).toLocaleDateString('es-CO')}
                          </p>
                        </div>
                        <span className="font-mono font-semibold text-[#166534]">
                          {formatCop(w.montoCop)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </div>
        )}

        {/* VISTA 4: EDITAR PERFIL DEL AGENTE */}
        {activeTab === 'perfil' && (
          <form
            onSubmit={handleSaveProfile}
            className="mx-auto max-w-2xl rounded-[24px] border-2 border-[#bc8ae1]/65 bg-[#ffffff] p-6 space-y-5 sm:p-8"
          >
            <div>
              <p className="text-xs font-semibold text-[#9c44dc]">Perfil comercial</p>
              <h2 className="mt-1 font-display text-2xl font-semibold text-[#442c61]">
                Editar perfil de Agente
              </h2>
              <p className="mt-1 text-xs text-[#543b6c]">
                Esta información es visible cuando asesoras comercios en tu zona. Tu primer nombre y
                primer apellido son obligatorios.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 rounded-[18px] border border-[#d8c2ef] bg-[#faf5ff] p-4">
              {profileForm.avatarDataUrl ? (
                <img
                  src={profileForm.avatarDataUrl}
                  alt={profileForm.nombre}
                  className="h-16 w-16 rounded-[18px] border border-[#bc8ae1] object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-[18px] bg-[#9c44dc]/12 font-display text-xl font-semibold text-[#9c44dc]">
                  {(profileForm.primerNombre?.[0] || 'A').toUpperCase()}
                  {(profileForm.primerApellido?.[0] || '').toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-[200px]">
                <p className="text-xs font-semibold text-[#0a0a0a]">Foto de perfil</p>
                <p className="text-[11px] text-[#543b6c]">
                  Visible para comercios cuando te asignamos una solicitud.
                </p>
                <label className="vinchi-transition mt-2 inline-flex min-h-[42px] cursor-pointer items-center gap-2 rounded-[12px] border border-[#bc8ae1] bg-[#ffffff] px-4 py-2 text-xs font-semibold text-[#442c61] hover:border-[#9c44dc] hover:bg-[#f3e8ff]">
                  <Camera className="h-5 w-5 stroke-[2.25] text-[#9c44dc]" aria-hidden="true" />
                  <span>Subir foto de perfil</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAgentAvatarUpload}
                    className="sr-only"
                  />
                </label>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="ag-pnombre" className="block text-xs font-medium text-[#442c61]">
                  Primer nombre *
                </label>
                <input
                  id="ag-pnombre"
                  type="text"
                  required
                  value={profileForm.primerNombre}
                  onChange={(e) =>
                    setProfileForm((p) => ({ ...p, primerNombre: e.target.value }))
                  }
                  className="mt-1.5 h-11 w-full rounded-[14px] border border-[#d8c2ef] bg-[#faf5ff] px-4 text-sm text-[#0a0a0a] focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="ag-snombre" className="block text-xs font-medium text-[#442c61]">
                  Segundo nombre (opcional)
                </label>
                <input
                  id="ag-snombre"
                  type="text"
                  value={profileForm.segundoNombre ?? ''}
                  onChange={(e) =>
                    setProfileForm((p) => ({ ...p, segundoNombre: e.target.value }))
                  }
                  className="mt-1.5 h-11 w-full rounded-[14px] border border-[#d8c2ef] bg-[#faf5ff] px-4 text-sm text-[#0a0a0a] focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="ag-papellido" className="block text-xs font-medium text-[#442c61]">
                  Primer apellido *
                </label>
                <input
                  id="ag-papellido"
                  type="text"
                  required
                  value={profileForm.primerApellido}
                  onChange={(e) =>
                    setProfileForm((p) => ({ ...p, primerApellido: e.target.value }))
                  }
                  className="mt-1.5 h-11 w-full rounded-[14px] border border-[#d8c2ef] bg-[#faf5ff] px-4 text-sm text-[#0a0a0a] focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="ag-sapellido" className="block text-xs font-medium text-[#442c61]">
                  Segundo apellido (opcional)
                </label>
                <input
                  id="ag-sapellido"
                  type="text"
                  value={profileForm.segundoApellido ?? ''}
                  onChange={(e) =>
                    setProfileForm((p) => ({ ...p, segundoApellido: e.target.value }))
                  }
                  className="mt-1.5 h-11 w-full rounded-[14px] border border-[#d8c2ef] bg-[#faf5ff] px-4 text-sm text-[#0a0a0a] focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="ag-tel" className="block text-xs font-medium text-[#442c61]">
                  Teléfono / WhatsApp
                </label>
                <input
                  id="ag-tel"
                  type="text"
                  value={profileForm.telefono}
                  onChange={(e) => setProfileForm((p) => ({ ...p, telefono: e.target.value }))}
                  className="mt-1.5 h-11 w-full rounded-[14px] border border-[#d8c2ef] bg-[#faf5ff] px-4 text-sm text-[#0a0a0a] focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="ag-dept" className="block text-xs font-medium text-[#442c61]">
                  Departamento de cobertura
                </label>
                <input
                  id="ag-dept"
                  type="text"
                  value={profileForm.departamento}
                  onChange={(e) => setProfileForm((p) => ({ ...p, departamento: e.target.value }))}
                  className="mt-1.5 h-11 w-full rounded-[14px] border border-[#d8c2ef] bg-[#faf5ff] px-4 text-sm text-[#0a0a0a] focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="ag-muni" className="block text-xs font-medium text-[#442c61]">
                  Municipio o ciudad
                </label>
                <input
                  id="ag-muni"
                  type="text"
                  value={profileForm.municipio}
                  onChange={(e) => setProfileForm((p) => ({ ...p, municipio: e.target.value }))}
                  className="mt-1.5 h-11 w-full rounded-[14px] border border-[#d8c2ef] bg-[#faf5ff] px-4 text-sm text-[#0a0a0a] focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="ag-horario" className="block text-xs font-medium text-[#442c61]">
                Horario de atención presencial y virtual
              </label>
              <input
                id="ag-horario"
                type="text"
                value={profileForm.horario}
                onChange={(e) => setProfileForm((p) => ({ ...p, horario: e.target.value }))}
                className="mt-1.5 h-11 w-full rounded-[14px] border border-[#d8c2ef] bg-[#faf5ff] px-4 text-sm text-[#0a0a0a] focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="ag-bio" className="block text-xs font-medium text-[#442c61]">
                Presentación comercial
              </label>
              <textarea
                id="ag-bio"
                rows={3}
                value={profileForm.bio}
                onChange={(e) => setProfileForm((p) => ({ ...p, bio: e.target.value }))}
                className="mt-1.5 w-full rounded-[14px] border border-[#d8c2ef] bg-[#faf5ff] p-3.5 text-sm text-[#0a0a0a] focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none"
              />
            </div>

            {profileSaved && (
              <p className="inline-flex items-center gap-2 rounded-[12px] border border-[#16a34a]/30 bg-[#16a34a]/10 px-4 py-2.5 text-xs font-medium text-[#166534]">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                <span>{profileSaved}</span>
              </p>
            )}

            <button
              type="submit"
              disabled={isBusy}
              className="vinchi-transition inline-flex min-h-[46px] w-full items-center justify-center rounded-[16px] bg-[#9c44dc] px-5 text-sm font-semibold text-[#ffffff] hover:bg-[#543b6c] cursor-pointer"
            >
              {isBusy ? 'Guardando cambios...' : 'Guardar perfil de Agente'}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
