'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  CheckCircle2,
  CreditCard,
  KeyRound,
  Lock,
  Mail,
  MessageSquare,
  Phone,
  PhoneCall,
  PhoneOff,
  Search,
  Send,
  ShieldCheck,
  Store,
  UserCheck,
} from 'lucide-react';
import {
  connectRealtime,
  fetchPortalState,
  getStoredToken,
  matchAvailableAgent,
  paySearchFee,
  payVisitFee,
  sendClientMessage,
  triggerClientCall,
  verifyBusinessToken,
} from '@/src/lib/vinchiClient';
import type {
  AgentRequestRecord,
  AuthUser,
  PortalChatMessage,
  VinchiRoute,
} from '@/src/types/vinchi';

export interface ExplorarAgentesPortalProps {
  user: AuthUser;
  onUserUpdated: (user: AuthUser) => void;
  onNavigate: (route: VinchiRoute) => void;
}

type PaymentViewMode = null | 'search_15k' | 'visit_20k';

const PAYMENT_METHODS = [
  { id: 'PSE', label: 'PSE · Transferencia bancaria', detail: 'Débito inmediato desde tu banco' },
  { id: 'Nequi', label: 'Nequi', detail: 'Aprobación instantánea desde tu celular' },
  { id: 'Tarjeta', label: 'Tarjeta débito o crédito', detail: 'Visa, Mastercard o Amex' },
  { id: 'Daviplata', label: 'Daviplata', detail: 'Confirmación rápida en línea' },
];

const formatCop = (value: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);

function playCallCue(kind: 'ring' | 'connect' | 'end') {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = kind === 'connect' ? 660 : kind === 'ring' ? 520 : 340;
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.start();
    osc.stop(ctx.currentTime + 0.26);
  } catch {
    // Audio opcional
  }
}

export default function ExplorarAgentesPortalPage({
  user,
  onUserUpdated,
  onNavigate,
}: ExplorarAgentesPortalProps) {
  const [request, setRequest] = useState<AgentRequestRecord | null>(null);
  const [messages, setMessages] = useState<PortalChatMessage[]>([]);
  const [availableAgentsCount, setAvailableAgentsCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Flujo de pago ($15.000 búsqueda / $20.000 visita)
  const [paymentView, setPaymentView] = useState<PaymentViewMode>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('PSE');

  // Chat
  const [chatText, setChatText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Flujo de token + advertencia de 5 segundos
  const [showVisitWarningCard, setShowVisitWarningCard] = useState(false);
  const [warningCountdown, setWarningCountdown] = useState(5);
  const [showTokenEntry, setShowTokenEntry] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [tokenError, setTokenError] = useState('');

  const loadState = async () => {
    try {
      const data = await fetchPortalState();
      setRequest(data.request);
      setMessages(data.messages);
      setAvailableAgentsCount(data.availableAgentsCount);
      if (data.user) {
        onUserUpdated(data.user);
      }
      setErrorMsg('');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error cargando el portal.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadState();

    const token = getStoredToken();
    if (!token) return;

    const disconnect = connectRealtime(token, (evt) => {
      if (evt.type === 'portal:update') {
        setRequest(evt.request);
        setMessages(evt.messages);
        setAvailableAgentsCount(evt.availableAgentsCount);
        if (!evt.request.tokenUnlocked) {
          setShowVisitWarningCard(false);
          setShowTokenEntry(false);
        }
      } else if (evt.type === 'chat:message') {
        setMessages((prev) =>
          prev.some((m) => m.id === evt.message.id) ? prev : [...prev, evt.message]
        );
      }
    });

    return () => disconnect();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cuenta regresiva obligatoria de 5 segundos para el botón "Sí" en la advertencia de activación virtual
  useEffect(() => {
    if (!showVisitWarningCard) return;
    if (warningCountdown <= 0) return;

    const timer = window.setTimeout(() => {
      setWarningCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [showVisitWarningCard, warningCountdown]);

  const handleBuscarAgenteClick = async () => {
    setErrorMsg('');
    if (!request?.searchPaid) {
      setPaymentView('search_15k');
      return;
    }

    setIsBusy(true);
    try {
      const data = await matchAvailableAgent();
      setRequest(data.request);
      setMessages(data.messages);
      setAvailableAgentsCount(data.availableAgentsCount);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No hay agentes disponibles ahora.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleConfirmPayment = async (event: FormEvent) => {
    event.preventDefault();
    setErrorMsg('');
    setIsBusy(true);
    try {
      if (paymentView === 'search_15k') {
        const data = await paySearchFee(selectedPaymentMethod);
        setRequest(data.request);
        setMessages(data.messages);
        setAvailableAgentsCount(data.availableAgentsCount);
        setPaymentView(null);
      } else if (paymentView === 'visit_20k') {
        const data = await payVisitFee(selectedPaymentMethod);
        setRequest(data.request);
        setMessages(data.messages);
        setShowVisitWarningCard(false);
        setShowTokenEntry(false);
        setPaymentView(null);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo procesar el pago.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleSendMessage = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = chatText.trim();
    if (!trimmed) return;
    setChatText('');
    try {
      const { message } = await sendClientMessage(trimmed);
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo enviar el mensaje.');
    }
  };

  const handleCallAction = async (action: 'start' | 'answer' | 'end') => {
    try {
      playCallCue(action === 'start' ? 'ring' : action === 'answer' ? 'connect' : 'end');
      const { request: updated } = await triggerClientCall(action);
      setRequest(updated);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo gestionar la llamada.');
    }
  };

  const handleOpenTokenStep = () => {
    setTokenError('');
    if (!request?.tokenUnlocked) return;

    if (request.requiresVisitWarning && !request.visitPaid) {
      setWarningCountdown(5);
      setShowVisitWarningCard(true);
      setShowTokenEntry(false);
      return;
    }

    setShowVisitWarningCard(false);
    setShowTokenEntry(true);
  };

  const handleVerifyTokenSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setTokenError('');
    if (!tokenInput.trim()) {
      setTokenError('Ingresa el token de activación entregado por tu agente.');
      return;
    }
    setIsBusy(true);
    try {
      const res = await verifyBusinessToken(tokenInput.trim());
      onUserUpdated(res.user);
      setRequest(res.request);
      onNavigate('/(dashboards)/comercio');
    } catch (err) {
      setTokenError(err instanceof Error ? err.message : 'Token incorrecto.');
    } finally {
      setIsBusy(false);
    }
  };

  // Vista dedicada de Método de Pago ($15.000 búsqueda / $20.000 visita presencial)
  if (paymentView !== null) {
    const isVisit = paymentView === 'visit_20k';
    const amountCop = isVisit ? 20000 : 15000;
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f3e8ff] via-[#faf5ff] to-[#f4ecfb] px-4 py-8 text-[#0a0a0a] sm:px-6 sm:py-12">
        <div className="mx-auto max-w-xl">
          <button
            type="button"
            onClick={() => setPaymentView(null)}
            className="vinchi-transition mb-5 inline-flex min-h-[44px] items-center gap-2 rounded-[18px] bg-[#442c61] px-4 text-sm font-medium text-[#ffffff] shadow-sm hover:bg-[#9c44dc] cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            <span>Volver a Explorar Portal Agentes</span>
          </button>

          <form
            onSubmit={handleConfirmPayment}
            className="rounded-[24px] border-2 border-[#bc8ae1]/75 bg-[#ffffff] p-6 shadow-[0_14px_34px_-12px_rgba(68,44,97,0.22)] sm:p-8"
          >
            <div className="flex items-start justify-between gap-4 border-b border-[#bc8ae1]/45 pb-5">
              <div>
                <p className="text-xs font-semibold text-[#9c44dc]">Método de pago seguro</p>
                <h1 className="mt-1 font-display text-2xl font-semibold tracking-[-0.025em] text-[#442c61]">
                  {isVisit
                    ? 'Pago de visita presencial'
                    : 'Habilitar búsqueda automática de agente'}
                </h1>
                <p className="mt-1.5 text-sm text-[#543b6c]">
                  {isVisit
                    ? 'Completa los $20.000 COP adicionales para la visita presencial ($35.000 COP en total).'
                    : 'Pago único de $15.000 COP para habilitar la búsqueda automática y asesoría segura.'}
                </p>
              </div>
              <div className="rounded-[16px] bg-[#442c61] px-4 py-2.5 text-right text-[#ffffff] shrink-0">
                <p className="text-[11px] text-[#e9d5ff]">Total a pagar</p>
                <p className="font-mono tabular-nums text-lg font-semibold">
                  {formatCop(amountCop)}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-2.5">
              <p className="text-xs font-medium text-[#442c61]">Selecciona tu método de pago</p>
              {PAYMENT_METHODS.map((method) => {
                const selected = selectedPaymentMethod === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setSelectedPaymentMethod(method.id)}
                    className={`vinchi-transition flex w-full items-center justify-between gap-3 rounded-[16px] border p-4 text-left cursor-pointer ${
                      selected
                        ? 'border-2 border-[#9c44dc] bg-[#f3e8ff]/65'
                        : 'border-[#bc8ae1]/55 bg-[#faf5ff] hover:border-[#9c44dc]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard
                        className={`h-5 w-5 ${selected ? 'text-[#9c44dc]' : 'text-[#543b6c]'}`}
                        aria-hidden="true"
                      />
                      <div>
                        <p className="text-sm font-semibold text-[#0a0a0a]">{method.label}</p>
                        <p className="text-xs text-[#543b6c]">{method.detail}</p>
                      </div>
                    </div>
                    <span
                      className={`h-4 w-4 rounded-full border-2 ${
                        selected ? 'border-[#9c44dc] bg-[#9c44dc]' : 'border-[#bc8ae1]'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {errorMsg && (
              <p className="mt-4 rounded-[12px] border border-[#9c645c]/50 bg-[#d0b7b0]/25 px-4 py-3 text-xs font-medium text-[#5c302a]">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={isBusy}
              className="vinchi-transition mt-6 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[18px] bg-[#9c44dc] px-5 text-sm font-medium text-[#ffffff] hover:bg-[#543b6c] disabled:opacity-60 cursor-pointer"
            >
              <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
              <span>
                {isBusy
                  ? 'Confirmando pago...'
                  : `Confirmar pago (${formatCop(amountCop)} COP)`}
              </span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  const searchPaid = Boolean(request?.searchPaid);
  const isWaitingDecision = request?.status === 'pending_agent_decision';
  const isRejected = request?.status === 'rejected_by_agent';
  const matched = Boolean(request?.assignedAgentId) && !isRejected;
  const chatEnabled = matched && !isWaitingDecision;
  const tokenUnlocked = Boolean(request?.tokenUnlocked);
  const callStatus = request?.callState?.status ?? 'idle';

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f3e8ff]/75 via-[#faf5ff] to-[#f4ecfb] text-[#0a0a0a]">
      <header className="border-b border-[#9c44dc]/55 bg-[#442c61] px-4 py-3.5 text-[#ffffff] shadow-[0_6px_22px_-8px_rgba(68,44,97,0.45)] sm:px-6">
        <div className="mx-auto flex max-w-[1360px] flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('/(public)')}
              className="vinchi-transition inline-flex min-h-[42px] items-center gap-2 rounded-[14px] border border-[#bc8ae1]/45 bg-[#ffffff]/14 px-4 py-2 text-xs font-semibold text-[#ffffff] hover:bg-[#9c44dc] cursor-pointer"
              aria-label="Salir al inicio con cuenta abierta"
            >
              <ArrowLeft className="h-4.5 w-4.5 stroke-[2.25]" aria-hidden="true" />
              <span>Salir</span>
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-semibold text-[#e9d5ff]">Explorar Portal Agentes</p>
                <span className="rounded-[6px] border border-[#bc8ae1]/50 bg-[#9c44dc]/55 px-2 py-0.5 text-[10px] font-bold text-[#ffffff]">
                  {user.businessActivated ? 'Empresario' : 'Empresario en espera'}
                </span>
              </div>
              <h1 className="font-display text-lg font-semibold tracking-[-0.025em] text-[#ffffff] sm:text-xl">
                Vinculación segura para {request?.businessName || user.negocioNombre || user.nombre}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-[#f3e8ff]">
            <span className="inline-flex items-center gap-2 rounded-[12px] border border-[#bc8ae1]/45 bg-[#ffffff]/12 px-3.5 py-2">
              <UserCheck className="h-5 w-5 stroke-[2.25] text-[#86efac]" aria-hidden="true" />
              <span>
                Agentes disponibles:{' '}
                <strong className="font-mono text-[#ffffff]">{availableAgentsCount}</strong>
              </span>
            </span>
            {user.businessActivated && (
              <button
                type="button"
                onClick={() => onNavigate('/(dashboards)/comercio')}
                className="vinchi-transition inline-flex min-h-[42px] items-center gap-2 rounded-[14px] bg-[#9c44dc] px-4 py-2 text-xs font-semibold text-[#ffffff] hover:bg-[#bc8ae1] hover:text-[#442c61] cursor-pointer"
              >
                <Store className="h-5 w-5 stroke-[2.25]" aria-hidden="true" />
                <span>Ir a mi negocio</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1360px] px-4 py-6 sm:px-6 sm:py-8">
        {isLoading ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="h-[480px] animate-pulse rounded-[24px] border border-[#bc8ae1]/55 bg-[#ffffff]" />
            <div className="h-[480px] animate-pulse rounded-[24px] border border-[#bc8ae1]/55 bg-[#ffffff]" />
          </div>
        ) : (
          /* División exacta a la mitad: Izquierda controles y token / Derecha chat y llamada */
          <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
            {/* MITAD IZQUIERDA */}
            <section
              aria-label="Gestión de agente y activación de negocio"
              className="flex flex-col justify-between gap-6 rounded-[24px] border-2 border-[#bc8ae1]/65 bg-[#ffffff] p-6 shadow-[0_12px_30px_-14px_rgba(68,44,97,0.18)] sm:p-8"
            >
              <div className="space-y-6">
                {/* Anuncio en la página + Notificación al correo cuando el agente verifica/activa */}
                {request?.announcementTitle && (
                  <div
                    role="status"
                    className="rounded-[18px] border-2 border-[#9c44dc] bg-[#bc8ae1]/12 p-4 space-y-2"
                  >
                    <div className="flex items-start gap-3">
                      <Bell className="mt-0.5 h-5 w-5 shrink-0 text-[#9c44dc]" aria-hidden="true" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#442c61]">
                          {request.announcementTitle}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-[#0a0a0a]">
                          {request.announcementBody}
                        </p>
                      </div>
                    </div>

                    {request.emailNotice && (
                      <div className="mt-2 rounded-[12px] border border-[#bc8ae1]/60 bg-[#ffffff] px-3.5 py-2.5 text-xs text-[#543b6c]">
                        <div className="flex items-center gap-2 font-semibold text-[#442c61]">
                          <Mail className="h-4 w-4 stroke-[2.25] text-[#9c44dc]" aria-hidden="true" />
                          <span>Notificación enviada a tu correo: {request.emailNotice.toEmail}</span>
                        </div>
                        <p className="mt-1 text-xs text-[#543b6c]">
                          {request.emailNotice.subject}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Bloque 1: Botón Buscar agente automático + explicación debajo */}
                <div className="rounded-[20px] border border-[#bc8ae1]/55 bg-[#faf5ff] p-5">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-semibold text-[#442c61]">
                      Paso 1 · Conexión con agente certificado
                    </span>
                    <span
                      className={`rounded-[6px] px-2 py-0.5 font-mono text-[11px] font-medium ${
                        searchPaid
                          ? 'bg-[#16a34a]/12 text-[#166534]'
                          : 'bg-[#d97706]/12 text-[#92400e]'
                      }`}
                    >
                      {searchPaid ? 'Pago $15.000 confirmado' : 'Requiere pago $15.000'}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={isBusy || matched}
                    onClick={handleBuscarAgenteClick}
                    className={`vinchi-transition inline-flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-[18px] px-5 text-sm font-semibold cursor-pointer disabled:cursor-not-allowed ${
                      matched
                        ? 'bg-[#16a34a]/12 text-[#166534] border border-[#16a34a]/30'
                        : searchPaid
                          ? 'bg-[#9c44dc] text-[#ffffff] hover:bg-[#543b6c]'
                          : 'bg-[#442c61] text-[#ffffff] hover:bg-[#543b6c]'
                    }`}
                  >
                    <Search className="h-5 w-5" aria-hidden="true" />
                    <span>
                      {isWaitingDecision
                        ? `Esperando aceptación de ${request?.assignedAgentName}...`
                        : chatEnabled
                          ? `Agente conectado: ${request?.assignedAgentName}`
                          : isRejected
                            ? 'Buscar otro agente automático'
                            : searchPaid
                              ? isBusy
                                ? 'Buscando agente disponible...'
                                : 'Buscar agente automático'
                              : 'Buscar agente automático ($15.000 COP)'}
                    </span>
                  </button>

                  <p className="mt-3 text-xs leading-relaxed text-[#543b6c]">
                    Sirve para buscar automáticamente agentes certificados que te asesoren y vinculen
                    tu negocio de forma segura. Al iniciar la búsqueda realizas un aporte único de{' '}
                    <strong className="font-mono text-[#0a0a0a]">$15.000 COP</strong>; una vez
                    aprobado el pago, el botón queda habilitado para conectarte de inmediato en el
                    chat de la derecha.
                  </p>
                </div>

                {/* Bloque 2 (debajo de Buscar agente automático): Botón para colocar el token */}
                <div className="rounded-[20px] border border-[#bc8ae1]/55 bg-[#faf5ff] p-5">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-semibold text-[#442c61]">
                      Paso 2 · Abrir negocio con token de activación
                    </span>
                    <span
                      className={`rounded-[6px] px-2 py-0.5 font-mono text-[11px] font-medium ${
                        tokenUnlocked
                          ? 'bg-[#bc8ae1]/25 text-[#442c61]'
                          : 'bg-[#e9d5ff]/55 text-[#543b6c]'
                      }`}
                    >
                      {tokenUnlocked ? 'Habilitado' : 'Deshabilitado'}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={!tokenUnlocked || isBusy}
                    onClick={handleOpenTokenStep}
                    className={`vinchi-transition inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-[18px] px-5 text-sm font-semibold ${
                      tokenUnlocked
                        ? 'bg-[#9c44dc] text-[#ffffff] hover:bg-[#543b6c] cursor-pointer'
                        : 'bg-[#e9d5ff]/70 text-[#6b5a82] cursor-not-allowed'
                    }`}
                  >
                    {tokenUnlocked ? (
                      <KeyRound className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <Lock className="h-5 w-5" aria-hidden="true" />
                    )}
                    <span>Ingresar token y abrir mi negocio</span>
                  </button>

                  <p className="mt-2.5 text-xs leading-relaxed text-[#543b6c]">
                    {request?.visitPaid && !request?.visitCompleted
                      ? 'Pagaste por la visita presencial. Este botón permanecerá deshabilitado hasta que el agente realice la visita a tu negocio y lo habilite.'
                      : tokenUnlocked
                        ? 'Tu solicitud ya fue aceptada por el agente. Ingresa tu token para pasar al rol de Empresario y abrir tu negocio.'
                        : 'Este botón se habilitará únicamente cuando tu agente verifique tu espacio y acepte la solicitud.'}
                  </p>

                  {/* Card de advertencia si la activación fue Virtual sin pago de visita */}
                  {showVisitWarningCard && (
                    <div
                      role="alertdialog"
                      aria-labelledby="warning-visita-title"
                      className="mt-4 rounded-[18px] border-2 border-[#d97706]/60 bg-[#ffffff] p-5 shadow-sm"
                    >
                      <div className="flex items-start gap-3">
                        <AlertTriangle
                          className="mt-0.5 h-5 w-5 shrink-0 text-[#d97706]"
                          aria-hidden="true"
                        />
                        <div>
                          <h3
                            id="warning-visita-title"
                            className="text-sm font-semibold text-[#0a0a0a]"
                          >
                            Solo pagaste por la activación de la cuenta y no la visita, ¿deseas
                            continuar?
                          </h3>
                          <p className="mt-1 text-xs text-[#543b6c]">
                            Tu cuenta fue verificada de manera virtual. Puedes continuar ahora o
                            pagar por la visita presencial ($20.000 COP adicionales).
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                        <button
                          type="button"
                          disabled={warningCountdown > 0}
                          onClick={() => {
                            setShowVisitWarningCard(false);
                            setShowTokenEntry(true);
                          }}
                          className={`vinchi-transition inline-flex min-h-[44px] items-center justify-center rounded-[14px] px-4 text-xs font-semibold ${
                            warningCountdown > 0
                              ? 'bg-[#e5e5e5] text-[#737373] cursor-not-allowed'
                              : 'bg-[#442c61] text-[#ffffff] hover:bg-[#543b6c] cursor-pointer'
                          }`}
                        >
                          {warningCountdown > 0 ? `Sí (${warningCountdown}s)` : 'Sí'}
                        </button>

                        <button
                          type="button"
                          onClick={() => setPaymentView('visit_20k')}
                          className="vinchi-transition inline-flex min-h-[44px] items-center justify-center rounded-[14px] border border-[#9c44dc] bg-[#bc8ae1]/15 px-4 text-xs font-semibold text-[#442c61] hover:bg-[#9c44dc] hover:text-[#ffffff] cursor-pointer"
                        >
                          Pagar por la visita ($20.000)
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Formulario para ingresar el token */}
                  {showTokenEntry && tokenUnlocked && (
                    <form
                      onSubmit={handleVerifyTokenSubmit}
                      className="mt-4 space-y-3 rounded-[18px] border border-[#9c44dc]/40 bg-[#ffffff] p-4"
                    >
                      <label
                        htmlFor="business-activation-token"
                        className="block text-xs font-semibold text-[#442c61]"
                      >
                        Ingresa tu token de activación
                      </label>
                      <input
                        id="business-activation-token"
                        type="text"
                        value={tokenInput}
                        onChange={(e) => setTokenInput(e.target.value)}
                        placeholder="Ej. VNC-4829"
                        className="h-11 w-full rounded-[14px] border border-[#e5e5e5] bg-[#f5f5f5] px-4 font-mono text-sm uppercase tracking-wider text-[#0a0a0a] focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none"
                      />
                      {tokenError && (
                        <p className="text-xs font-medium text-[#991b1b]">{tokenError}</p>
                      )}
                      <button
                        type="submit"
                        disabled={isBusy}
                        className="vinchi-transition inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[14px] bg-[#9c44dc] px-4 text-sm font-medium text-[#ffffff] hover:bg-[#543b6c] cursor-pointer"
                      >
                        <Store className="h-4 w-4" aria-hidden="true" />
                        <span>{isBusy ? 'Validando token...' : 'Confirmar y abrir mi negocio'}</span>
                      </button>
                    </form>
                  )}
                </div>

                {errorMsg && (
                  <p
                    role="alert"
                    className="rounded-[12px] border border-[#9c645c]/50 bg-[#d0b7b0]/25 px-4 py-3 text-xs font-medium text-[#5c302a]"
                  >
                    {errorMsg}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-[#bc8ae1]/40 pt-4 text-xs text-[#543b6c]">
                <span>Cuenta: {user.email}</span>
                <span className="font-mono font-semibold text-[#442c61]">
                  {request?.activationMode === 'presencial'
                    ? 'Modo Presencial'
                    : request?.activationMode === 'virtual'
                      ? 'Modo Virtual'
                      : 'En verificación'}
                </span>
              </div>
            </section>

            {/* MITAD DERECHA: CHAT + LLAMADA EN TIEMPO REAL */}
            <section
              aria-label="Chat y llamada con el agente"
              className="flex min-h-[540px] flex-col justify-between rounded-[24px] border-2 border-[#bc8ae1]/65 bg-[#ffffff] shadow-[0_12px_30px_-14px_rgba(68,44,97,0.18)]"
            >
              {/* Encabezado del chat + botón de llamada */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#bc8ae1]/45 bg-[#faf5ff] px-5 py-4 rounded-t-[22px]">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#442c61] text-[#ffffff]">
                    <ShieldCheck className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0a0a0a]">
                      {matched ? request?.assignedAgentName : 'Chat con Agente Vinchi'}
                    </p>
                    <p className="text-xs text-[#543b6c]">
                      {matched
                        ? callStatus === 'connected'
                          ? 'En llamada en vivo'
                          : callStatus === 'ringing'
                            ? 'Llamando...'
                            : 'Disponible en línea'
                        : 'Esperando conexión automática'}
                    </p>
                  </div>
                </div>

                {chatEnabled && (
                  <div className="flex items-center gap-2">
                    {callStatus === 'idle' && (
                      <button
                        type="button"
                        onClick={() => handleCallAction('start')}
                        className="vinchi-transition inline-flex min-h-[42px] items-center gap-2 rounded-[14px] bg-[#442c61] px-4 py-2 text-xs font-semibold text-[#ffffff] hover:bg-[#543b6c] cursor-pointer"
                      >
                        <Phone className="h-5 w-5 stroke-[2.25]" aria-hidden="true" />
                        <span>Llamar</span>
                      </button>
                    )}
                    {callStatus === 'ringing' && request?.callState?.initiatorRole === 'agente' && (
                      <button
                        type="button"
                        onClick={() => handleCallAction('answer')}
                        className="vinchi-transition inline-flex min-h-[42px] items-center gap-2 rounded-[14px] bg-[#16a34a] px-4 py-2 text-xs font-semibold text-[#ffffff] hover:bg-[#15803d] cursor-pointer"
                      >
                        <PhoneCall className="h-5 w-5 stroke-[2.25]" aria-hidden="true" />
                        <span>Contestar</span>
                      </button>
                    )}
                    {callStatus !== 'idle' && (
                      <button
                        type="button"
                        onClick={() => handleCallAction('end')}
                        className="vinchi-transition inline-flex min-h-[42px] items-center gap-2 rounded-[14px] bg-[#9c645c] px-4 py-2 text-xs font-semibold text-[#ffffff] hover:bg-[#7f4d46] cursor-pointer"
                      >
                        <PhoneOff className="h-5 w-5 stroke-[2.25]" aria-hidden="true" />
                        <span>{callStatus === 'ringing' ? 'Cancelar' : 'Colgar'}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Cuerpo de mensajes */}
              {!chatEnabled ? (
                <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-[#f3e8ff] text-[#442c61]">
                    <MessageSquare className="h-8 w-8 text-[#9c44dc]" aria-hidden="true" />
                  </div>
                  <h2 className="mt-4 font-display text-lg font-semibold text-[#0a0a0a]">
                    {isWaitingDecision
                      ? `Solicitud enviada a ${request?.assignedAgentName}`
                      : isRejected
                        ? 'El agente anterior no pudo tomar la solicitud'
                        : 'El chat se abrirá al conectar tu agente'}
                  </h2>
                  <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-[#543b6c]">
                    {isWaitingDecision
                      ? 'El agente está revisando tu solicitud en su panel. En cuanto la acepte, se abrirá aquí el chat y la llamada en vivo.'
                      : isRejected
                        ? 'Pulsa nuevamente "Buscar otro agente automático" a la izquierda sin ningún costo adicional.'
                        : 'Completa el pago de $15.000 COP y pulsa Buscar agente automático a la izquierda. En cuanto el agente acepte, podrás escribirle y llamarlo aquí.'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4 max-h-[420px]">
                    {messages.map((msg) => {
                      const isClient = msg.senderRole === 'cliente';
                      const isSystem = msg.senderRole === 'sistema';
                      if (isSystem) {
                        return (
                          <div
                            key={msg.id}
                            className="mx-auto max-w-md rounded-[12px] border border-[#bc8ae1]/45 bg-[#faf5ff] px-3.5 py-2 text-center text-[11px] text-[#543b6c]"
                          >
                            {msg.text}
                          </div>
                        );
                      }
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isClient ? 'items-end' : 'items-start'}`}
                        >
                          <span className="mb-1 text-[11px] font-medium text-[#543b6c]">
                            {msg.senderName}
                          </span>
                          <div
                            className={`max-w-[82%] rounded-[18px] px-4 py-2.5 text-sm leading-relaxed ${
                              isClient
                                ? 'bg-[#9c44dc] text-[#ffffff]'
                                : 'border border-[#bc8ae1]/45 bg-[#faf5ff] text-[#0a0a0a]'
                            }`}
                          >
                            {msg.text}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Caja de texto para enviar mensajes */}
                  <form
                    onSubmit={handleSendMessage}
                    className="flex items-center gap-2.5 border-t border-[#bc8ae1]/45 px-4 py-3.5"
                  >
                    <input
                      type="text"
                      aria-label="Escribe un mensaje para el agente"
                      value={chatText}
                      onChange={(e) => setChatText(e.target.value)}
                      placeholder="Escribe tu mensaje para el agente..."
                      className="h-11 flex-1 rounded-[16px] border border-[#bc8ae1]/55 bg-[#faf5ff] px-4 text-sm text-[#0a0a0a] placeholder:text-[#6b5a82] focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="vinchi-transition inline-flex h-11 items-center justify-center gap-1.5 rounded-[16px] bg-[#9c44dc] px-4 text-sm font-medium text-[#ffffff] hover:bg-[#543b6c] cursor-pointer"
                    >
                      <Send className="h-5 w-5" aria-hidden="true" />
                      <span className="hidden sm:inline">Enviar</span>
                    </button>
                  </form>
                </>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
