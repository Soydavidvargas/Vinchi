'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  Bot,
  Check,
  Crown,
  MessageSquarePlus,
  Play,
  Plus,
  Send,
  Sparkles,
  Tv,
  X,
} from 'lucide-react';
import { getFoodPhotoUrl } from '@/src/data/clientVisualAssets';
import {
  sendClientAiChat,
  subscribeClientPremium,
  watchClientAiAd,
} from '@/src/lib/vinchiClient';
import type {
  ClientAiChatMessage,
  ClientAiQuotaState,
  ClientCatalogProduct,
} from '@/src/types/vinchi';

export interface ClienteAiChatbotProps {
  isAuthenticated?: boolean;
  aiQuota: ClientAiQuotaState | null;
  activeFilter: string;
  cartQuantities: Record<string, number>;
  onAddToCart: (product: ClientCatalogProduct) => void;
  onQuotaUpdated: (quota: ClientAiQuotaState) => void;
  onRequireLogin?: () => void;
}

const QUICK_PROMPTS = [
  '¿Qué me recomiendas rápido para hoy?',
  'Quiero algo vegano y una bebida fría',
  'Muéstrame carnes a la parrilla',
  'Antojo de comida asiática',
];

const PREMIUM_PAYMENT_METHODS = ['Nequi', 'Daviplata', 'Tarjeta'];

const formatCop = (value: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);

export default function ClienteAiChatbot({
  isAuthenticated = true,
  aiQuota,
  activeFilter,
  cartQuantities,
  onAddToCart,
  onQuotaUpdated,
}: ClienteAiChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [statusNotice, setStatusNotice] = useState('');

  // Flujo de anuncio para desbloquear +1 uso cuando se acaban los 3 del mes
  const [watchingAdSeconds, setWatchingAdSeconds] = useState<number | null>(null);
  const [isUnlockingAd, setIsUnlockingAd] = useState(false);

  // Flujo de pago mensual Cliente Premium dentro del bot
  const [showPremiumBox, setShowPremiumBox] = useState(false);
  const [premiumPayMethod, setPremiumPayMethod] = useState(PREMIUM_PAYMENT_METHODS[0]);
  const [isSubscribing, setIsSubscribing] = useState(false);

  const [messages, setMessages] = useState<ClientAiChatMessage[]>([
    {
      id: 'ai-welcome',
      role: 'assistant',
      text: '¡Hola! Soy tu asistente de compras Vinchi con IA. Cuéntame qué se te antoja, tu presupuesto o tipo de comida y te ayudo a elegir y agregar directo a tu carrito.',
      createdAt: new Date().toISOString(),
    },
  ]);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [isOpen, messages, showPremiumBox, watchingAdSeconds]);

  // Temporizador del anuncio patrocinado de 5 segundos
  useEffect(() => {
    if (watchingAdSeconds === null) return;
    if (watchingAdSeconds <= 0) {
      let active = true;
      setIsUnlockingAd(true);
      watchClientAiAd()
        .then((res) => {
          if (!active) return;
          onQuotaUpdated(res.aiQuota);
          setStatusNotice(res.message);
          setErrorMsg('');
          setWatchingAdSeconds(null);
        })
        .catch((err) => {
          if (!active) return;
          setErrorMsg(
            err instanceof Error ? err.message : 'No pudimos validar el anuncio.'
          );
          setWatchingAdSeconds(null);
        })
        .finally(() => {
          if (active) setIsUnlockingAd(false);
        });
      return () => {
        active = false;
      };
    }

    const timer = window.setTimeout(() => {
      setWatchingAdSeconds((s) => (s !== null ? s - 1 : null));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [watchingAdSeconds, onQuotaUpdated]);

  const isPremium = Boolean(aiQuota?.isClientPremium);
  const monthlyLimit = aiQuota?.monthlyLimit ?? 3;
  const remainingUses = aiQuota ? aiQuota.remainingUses : 3;
  const quotaExhausted = !isPremium && remainingUses <= 0;

  const sendMessageText = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isSending) return;

    if (quotaExhausted) {
      setErrorMsg('Ya usaste tus consultas disponibles. Mira un anuncio corto o activa Cliente Premium.');
      return;
    }

    setErrorMsg('');
    setStatusNotice('');
    const userMsg: ClientAiChatMessage = {
      id: `usr-ai-${Date.now()}`,
      role: 'user',
      text: trimmed,
      createdAt: new Date().toISOString(),
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput('');
    setIsSending(true);

    try {
      const res = await sendClientAiChat({
        message: trimmed,
        activeFilter,
        history: nextHistory.map((m) => ({ role: m.role, text: m.text })),
      });

      if (res.aiQuota) {
        onQuotaUpdated(res.aiQuota);
      }

      const assistantMsg: ClientAiChatMessage = {
        id: `ast-ai-${Date.now()}`,
        role: 'assistant',
        text: res.reply,
        recommendations: res.recommendations,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'No se pudo conectar con el asistente IA.'
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void sendMessageText(input);
  };

  const handleStartAd = () => {
    if (watchingAdSeconds !== null || isUnlockingAd) return;
    setErrorMsg('');
    setStatusNotice('');
    setWatchingAdSeconds(5);
  };

  const handleSubscribePremium = async () => {
    setIsSubscribing(true);
    setErrorMsg('');
    try {
      const res = await subscribeClientPremium(premiumPayMethod);
      onQuotaUpdated(res.aiQuota);
      setShowPremiumBox(false);
      setStatusNotice(res.message);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'No se pudo activar Cliente Premium.'
      );
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {isOpen && (
        <section
          aria-label="Asistente de compras con IA"
          className="flex h-[560px] max-h-[82vh] w-[calc(100vw-2rem)] max-w-[405px] flex-col overflow-hidden rounded-[26px] border-2 border-[#bc8ae1] bg-[#ffffff] shadow-[0_20px_50px_-12px_rgba(68,44,97,0.42)]"
        >
          {/* Header con detección de sesión y estado de cuota */}
          <div className="border-b border-[#543b6c] bg-gradient-to-r from-[#442c61] to-[#7c3aed] px-4 py-3 text-[#ffffff]">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-[#ffffff]/18 text-[#fbbf24]">
                  <Sparkles className="h-5 w-5 stroke-[2.25]" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">Asistente de Compras IA</p>
                  <p className="truncate text-[11px] text-[#e9d5ff]">
                    {isPremium
                      ? 'Cliente Premium Activo · Uso ilimitado'
                      : `Te quedan ${remainingUses} de ${monthlyLimit} usos este mes`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Cerrar asistente IA"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#ffffff]/15 text-[#ffffff] hover:bg-[#ffffff]/25 cursor-pointer"
              >
                <X className="h-4.5 w-4.5 stroke-[2.4]" aria-hidden="true" />
              </button>
            </div>

            {/* Franja directa dentro del bot para pagar mensualmente Cliente Premium */}
            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 rounded-[12px] bg-[#0a0a0a]/25 px-3 py-2 text-xs">
              {isPremium ? (
                <span className="inline-flex items-center gap-2 font-semibold text-[#fde68a]">
                  <Crown className="h-4 w-4 stroke-[2.25]" aria-hidden="true" />
                  Cliente Premium mensual activo · Consultas ilimitadas
                </span>
              ) : (
                <>
                  <span className="truncate text-[11px] text-[#f3e8ff]">
                    ¿Uso ilimitado todo el mes?
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPremiumBox((v) => !v)}
                    className="inline-flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-[10px] bg-[#fbbf24] px-3 py-1.5 text-xs font-bold text-[#0a0a0a] hover:bg-[#f59e0b] cursor-pointer"
                  >
                    <Crown className="h-4 w-4 stroke-[2.25]" aria-hidden="true" />
                    <span>Cliente Premium · $9.900/mes</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Panel inline para pagar mensualmente Cliente Premium */}
          {showPremiumBox && !isPremium && (
            <div className="border-b border-[#fbbf24]/50 bg-[#fffbeb] p-3.5 text-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-display text-sm font-bold text-[#92400e]">
                    Plan Mensual Cliente Premium
                  </p>
                  <p className="text-[11px] text-[#543b6c]">
                    Asistente IA ilimitado todo el mes sin límite de 3 usos ni anuncios.
                  </p>
                </div>
                <span className="shrink-0 font-mono text-xs font-bold text-[#0a0a0a]">
                  {formatCop(aiQuota?.premiumMonthlyPriceCop ?? 9900)}/mes
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {PREMIUM_PAYMENT_METHODS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPremiumPayMethod(m)}
                    className={`min-h-[36px] rounded-[10px] px-3.5 py-1.5 text-xs font-semibold cursor-pointer ${
                      premiumPayMethod === m
                        ? 'bg-[#442c61] text-[#ffffff]'
                        : 'border border-[#e5e5e5] bg-[#ffffff] text-[#442c61]'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isSubscribing}
                  onClick={() => void handleSubscribePremium()}
                  className="inline-flex min-h-[42px] flex-1 items-center justify-center gap-2 rounded-[12px] bg-[#b45309] px-4 py-2.5 text-xs font-bold text-[#ffffff] hover:bg-[#92400e] disabled:opacity-50 cursor-pointer"
                >
                  <Crown className="h-4 w-4 stroke-[2.25] text-[#fde68a]" aria-hidden="true" />
                  <span>
                    {isSubscribing
                      ? 'Activando plan...'
                      : `Pagar mensual con ${premiumPayMethod}`}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPremiumBox(false)}
                  className="min-h-[42px] rounded-[12px] border border-[#e5e5e5] bg-[#ffffff] px-4 py-2 text-xs font-semibold text-[#543b6c] cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}

          {/* Chat activo para la cuenta conectada */}
          <>
            {/* Mensajes */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-[#faf5ff] p-4">
                {statusNotice && (
                  <div
                    role="status"
                    className="rounded-[12px] border border-[#16a34a]/40 bg-[#16a34a]/10 px-3 py-2 text-[11px] font-semibold text-[#166534]"
                  >
                    {statusNotice}
                  </div>
                )}

                {messages.map((msg) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[88%] rounded-[18px] px-3.5 py-2.5 text-xs leading-relaxed ${
                          isUser
                            ? 'bg-[#442c61] text-[#ffffff]'
                            : 'border border-[#d8c2ef] bg-[#ffffff] text-[#0a0a0a] shadow-2xs'
                        }`}
                      >
                        {msg.text}
                      </div>

                      {!isUser && msg.recommendations && msg.recommendations.length > 0 && (
                        <div className="mt-2 w-full space-y-2">
                          {msg.recommendations.map((prod) => {
                            const qty = cartQuantities[prod.id] || 0;
                            return (
                              <div
                                key={prod.id}
                                className="flex items-center justify-between gap-2.5 rounded-[16px] border border-[#bc8ae1]/50 bg-[#ffffff] p-2.5 shadow-2xs"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <img
                                    src={getFoodPhotoUrl(prod.imagenKey)}
                                    alt={prod.nombre}
                                    referrerPolicy="no-referrer"
                                    className="h-11 w-11 shrink-0 rounded-[10px] object-cover"
                                  />
                                  <div className="min-w-0">
                                    <p className="truncate text-[11px] font-medium text-[#9c44dc]">
                                      {prod.companyName}
                                    </p>
                                    <p className="truncate text-xs font-semibold text-[#0a0a0a]">
                                      {prod.nombre}
                                    </p>
                                    <p className="font-mono tabular-nums text-[11px] font-semibold text-[#442c61]">
                                      {formatCop(prod.precioCop)}
                                    </p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => onAddToCart(prod)}
                                  className={`inline-flex min-h-[38px] shrink-0 items-center gap-1.5 rounded-[12px] px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                                    qty > 0
                                      ? 'bg-[#16a34a]/15 text-[#166534] hover:bg-[#16a34a]/25'
                                      : 'bg-[#9c44dc] text-[#ffffff] hover:bg-[#543b6c]'
                                  }`}
                                >
                                  {qty > 0 ? (
                                    <>
                                      <Check className="h-4 w-4 stroke-[2.4]" aria-hidden="true" />
                                      <span>+{qty}</span>
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="h-4 w-4 stroke-[2.4]" aria-hidden="true" />
                                      <span>Agregar</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}

                {isSending && (
                  <div className="flex items-center gap-2 rounded-[14px] border border-[#e5e5e5] bg-[#ffffff] px-3 py-2 text-xs text-[#543b6c]">
                    <Bot className="h-4 w-4 animate-pulse text-[#9c44dc]" aria-hidden="true" />
                    <span>Buscando las mejores opciones para ti...</span>
                  </div>
                )}

                {errorMsg && (
                  <p
                    role="alert"
                    className="rounded-[12px] border border-[#9c645c]/50 bg-[#d0b7b0]/25 px-3 py-2 text-[11px] font-medium text-[#5c302a]"
                  >
                    {errorMsg}
                  </p>
                )}

                {/* Gate de 3 usos mensuales agotados: Ver anuncio o Pagar Cliente Premium */}
                {quotaExhausted && (
                  <div className="rounded-[18px] border-2 border-[#f59e0b] bg-[#fffbeb] p-3.5 text-xs space-y-2.5">
                    <div className="flex items-center gap-2">
                      <Tv className="h-4 w-4 shrink-0 text-[#b45309]" aria-hidden="true" />
                      <p className="font-bold text-[#92400e]">
                        Agotaste tus {monthlyLimit} usos gratis del mes
                      </p>
                    </div>

                    {watchingAdSeconds !== null ? (
                      <div className="space-y-2 rounded-[12px] border border-[#fde68a] bg-[#ffffff] p-3">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-[#442c61]">
                          <span>Anuncio patrocinado · Brasa & Carbón Premium</span>
                          <span className="font-mono text-[#b45309]">
                            {isUnlockingAd ? 'Validando...' : `${watchingAdSeconds} s`}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#543b6c]">
                          Pide hoy cortes madurados sin comisiones extra directo desde tu catálogo
                          Vinchi.
                        </p>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-[#fef3c7]">
                          <div
                            className="h-full bg-[#b45309] transition-all duration-500"
                            style={{
                              width: `${Math.min(100, ((5 - watchingAdSeconds) / 5) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-[11px] text-[#543b6c]">
                          Mira un anuncio corto para desbloquear otro uso o suscríbete a{' '}
                          <strong>Cliente Premium</strong> por mes.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={handleStartAd}
                            className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-2 rounded-[12px] bg-[#442c61] px-3.5 py-2 text-xs font-semibold text-[#ffffff] hover:bg-[#9c44dc] cursor-pointer"
                          >
                            <Play className="h-4 w-4 stroke-[2.25]" aria-hidden="true" />
                            <span>Ver anuncio (5 s) · +1 uso</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowPremiumBox(true)}
                            className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-[12px] bg-[#fbbf24] px-3.5 py-2 text-xs font-bold text-[#0a0a0a] hover:bg-[#f59e0b] cursor-pointer"
                          >
                            <Crown className="h-4 w-4 stroke-[2.25]" aria-hidden="true" />
                            <span>Cliente Premium</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Sugerencias rápidas */}
              <div className="flex gap-2 overflow-x-auto border-t border-[#d8c2ef] bg-[#ffffff] px-3 py-2.5">
                {QUICK_PROMPTS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    disabled={isSending || quotaExhausted}
                    onClick={() => void sendMessageText(q)}
                    className="inline-flex min-h-[38px] shrink-0 items-center gap-2 rounded-[10px] border border-[#d8c2ef] bg-[#faf5ff] px-3.5 py-1.5 text-xs font-medium text-[#442c61] hover:border-[#9c44dc] disabled:opacity-45 cursor-pointer"
                  >
                    <MessageSquarePlus className="h-4.5 w-4.5 stroke-[2.2] text-[#9c44dc]" aria-hidden="true" />
                    <span>{q}</span>
                  </button>
                ))}
              </div>

              {/* Input */}
              <form
                onSubmit={handleSubmit}
                className="flex items-center gap-2 border-t border-[#d8c2ef] bg-[#ffffff] p-3"
              >
                <input
                  type="text"
                  value={input}
                  disabled={quotaExhausted}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    quotaExhausted
                      ? 'Mira un anuncio arriba para seguir chateando...'
                      : 'Ej. Quiero algo con carne y bebida fría...'
                  }
                  className="h-11 flex-1 rounded-[14px] border border-[#d8c2ef] bg-[#faf5ff] px-3.5 text-xs text-[#0a0a0a] placeholder:text-[#6b5a82] focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none disabled:opacity-55"
                />
                <button
                  type="submit"
                  disabled={isSending || quotaExhausted || !input.trim()}
                  aria-label="Enviar mensaje al asistente"
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#9c44dc] text-[#ffffff] hover:bg-[#543b6c] disabled:opacity-45 cursor-pointer"
                >
                  <Send className="h-5 w-5 stroke-[2.3]" aria-hidden="true" />
                </button>
              </form>
            </>
        </section>
      )}

      {/* Botón flotante IA */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? 'Ocultar asistente IA' : 'Abrir asistente de compras IA'}
        className="vinchi-transition group inline-flex min-h-[54px] items-center gap-2.5 rounded-[20px] border border-[#fbbf24]/65 bg-gradient-to-r from-[#442c61] via-[#6d28d9] to-[#9c44dc] px-5 py-2.5 text-sm font-semibold text-[#ffffff] shadow-[0_12px_30px_-6px_rgba(68,44,97,0.48)] hover:scale-[1.03] cursor-pointer"
      >
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-[11px] bg-[#ffffff]/20 text-[#fbbf24]">
          <Sparkles className="h-5 w-5 stroke-[2.3]" aria-hidden="true" />
        </span>
        <span>Asistente IA</span>
        {(isAuthenticated || aiQuota) && (
          <span className="rounded-[8px] bg-[#ffffff]/20 px-2 py-0.5 font-mono text-[11px] font-bold text-[#fde68a]">
            {isPremium ? 'PRO' : `${remainingUses}/${monthlyLimit}`}
          </span>
        )}
      </button>
    </div>
  );
}
