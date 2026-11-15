'use client';

import { Suspense, useState, type FormEvent } from 'react';
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Fingerprint,
  KeyRound,
  Lock,
  LogIn,
  Mail,
  Shield,
  Store,
  User,
  UserPlus,
} from 'lucide-react';
import LazyScrollSection from '@/src/components/LazyScrollSection';
import { lazyWithRetry, ViewErrorBoundary } from '@/src/components/ResilientLazy';
import { Canvas3DSkeleton, SkeletonBlock } from '@/src/components/Skeletons';
import type { LoginEntryContext, VinchiRole, VinchiRoute } from '@/src/types/vinchi';

const Hero3D = lazyWithRetry(() => import('@/src/components/Hero3D'));

export type LoginAccessTab = 'owner_client' | 'staff_pos' | 'courier' | 'agent' | 'admin';

export interface LoginPageProps {
  /** Contexto desde donde llegó el usuario */
  entryContext?: LoginEntryContext;
  /** Pestaña inicial seleccionada */
  initialTab?: LoginAccessTab;
  /** Estado de envío controlado por el padre */
  isSubmitting?: boolean;
  /** Mensaje de confirmación o error externo */
  statusMessage?: string;
  /** Error externo del servidor */
  errorMessage?: string;
  /** Callbacks reales de autenticación */
  onRegisterAccount?: (payload: {
    primerNombre: string;
    segundoNombre?: string;
    primerApellido: string;
    segundoApellido?: string;
    negocioNombre?: string;
    email: string;
    password: string;
    entryContext?: LoginEntryContext;
  }) => Promise<boolean>;
  onLoginAccount?: (payload: {
    email: string;
    password: string;
    expectedRole?: VinchiRole;
  }) => Promise<void>;
  onSubmitStaffToken?: (token: string) => Promise<void>;
  onBiometricCheckIn?: () => Promise<void>;
  onNavigate?: (route: VinchiRoute) => void;
}

const ACCESS_TABS: {
  id: LoginAccessTab;
  label: string;
  audience: string;
  icon: typeof Store;
}[] = [
  {
    id: 'owner_client',
    label: 'Cuenta Vinchi',
    audience: 'Iniciar sesión o crear cuenta',
    icon: Store,
  },
  {
    id: 'staff_pos',
    label: 'Cajeros y Salón',
    audience: 'Acceso directo a caja del local',
    icon: KeyRound,
  },
  {
    id: 'courier',
    label: 'Domicilios',
    audience: 'Ingreso de repartidores activos',
    icon: Fingerprint,
  },
  {
    id: 'agent',
    label: 'Agentes',
    audience: 'Equipo comercial Vinchi',
    icon: Briefcase,
  },
];

export default function LoginPage({
  entryContext = 'general',
  initialTab = 'owner_client',
  isSubmitting = false,
  statusMessage,
  errorMessage,
  onRegisterAccount,
  onLoginAccount,
  onSubmitStaffToken,
  onNavigate,
}: LoginPageProps) {
  const [activeTab, setActiveTab] = useState<LoginAccessTab>(
    entryContext === 'entrar_domicilio'
      ? 'courier'
      : entryContext === 'entrar_agente'
        ? 'agent'
        : initialTab
  );
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Campos de Iniciar sesión (Comercio / Cliente / Postulante)
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Campos de Registro obligatorios para todo el mundo
  const [regPrimerNombre, setRegPrimerNombre] = useState('');
  const [regSegundoNombre, setRegSegundoNombre] = useState('');
  const [regPrimerApellido, setRegPrimerApellido] = useState('');
  const [regSegundoApellido, setRegSegundoApellido] = useState('');
  const [regNegocio, setRegNegocio] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Campos de otros roles
  const [staffToken, setStaffToken] = useState('');
  const [corpEmail, setCorpEmail] = useState('');
  const [corpPassword, setCorpPassword] = useState('');

  const [localStatus, setLocalStatus] = useState('');
  const [validationError, setValidationError] = useState('');
  const [showDemoCreds, setShowDemoCreds] = useState(false);

  const isWorkerOnboarding =
    entryContext === 'postular_agente' || entryContext === 'postular_domicilio';
  const hideBusinessField = isWorkerOnboarding || entryContext === 'pedir_ahora';

  const switchTab = (tabId: LoginAccessTab) => {
    setActiveTab(tabId);
    setValidationError('');
    setLocalStatus('');
  };

  const handleClientLoginSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = loginEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      setValidationError('Ingresa un correo electrónico válido.');
      return;
    }
    if (loginPassword.length < 6) {
      setValidationError('Ingresa tu contraseña (mínimo 6 caracteres).');
      return;
    }
    setValidationError('');
    setLocalStatus('');
    await onLoginAccount?.({ email, password: loginPassword });
  };

  const handleClientRegisterSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const primerNombre = regPrimerNombre.trim();
    const segundoNombre = regSegundoNombre.trim();
    const primerApellido = regPrimerApellido.trim();
    const segundoApellido = regSegundoApellido.trim();
    const negocioNombre = regNegocio.trim();
    const email = regEmail.trim().toLowerCase();

    if (primerNombre.length < 2) {
      setValidationError('Tu primer nombre es obligatorio (mínimo 2 letras).');
      return;
    }
    if (primerApellido.length < 2) {
      setValidationError('Tu primer apellido es obligatorio (mínimo 2 letras).');
      return;
    }
    if (!hideBusinessField && negocioNombre.length < 2) {
      setValidationError('Ingresa el nombre de tu negocio o restaurante.');
      return;
    }
    if (!email || !email.includes('@')) {
      setValidationError('Ingresa un correo electrónico válido.');
      return;
    }
    if (regPassword.length < 6) {
      setValidationError('Crea una contraseña de al menos 6 caracteres.');
      return;
    }

    setValidationError('');
    setLocalStatus('');

    const ok = await onRegisterAccount?.({
      primerNombre,
      segundoNombre: segundoNombre || undefined,
      primerApellido,
      segundoApellido: segundoApellido || undefined,
      negocioNombre: negocioNombre || undefined,
      email,
      password: regPassword,
      entryContext,
    });

    // Crítico: al registrarse, lo envía inmediatamente a la pestaña de Iniciar sesión
    if (ok) {
      setAuthMode('login');
      setLoginEmail(email);
      setLoginPassword('');
      setRegPassword('');
      setLocalStatus(
        `Cuenta creada para ${email}. Ahora inicia sesión con tu contraseña para continuar.`
      );
    }
  };

  const handleStaffTokenSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = staffToken.trim();
    if (trimmed.length < 4) {
      setValidationError(
        'Ingresa el código de acceso o PIN de al menos 4 caracteres asignado por el dueño.'
      );
      return;
    }
    setValidationError('');
    await onSubmitStaffToken?.(trimmed);
  };

  const handleCorpSubmit = async (
    event: FormEvent<HTMLFormElement>,
    expectedRole: 'agente' | 'superadmin' | 'repartidor'
  ) => {
    event.preventDefault();
    const emailTrimmed = corpEmail.trim().toLowerCase();
    if (!emailTrimmed || !emailTrimmed.includes('@')) {
      setValidationError('Ingresa tu correo registrado.');
      return;
    }
    if (corpPassword.length < 6) {
      setValidationError('Ingresa tu contraseña (mínimo 6 caracteres).');
      return;
    }
    setValidationError('');
    await onLoginAccount?.({
      email: emailTrimmed,
      password: corpPassword,
      expectedRole,
    });
  };

  const activeMeta = ACCESS_TABS.find((tab) => tab.id === activeTab);
  const displayedError = validationError || errorMessage || '';
  const displayedStatus = localStatus || statusMessage || '';

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#ede4fb] px-4 py-8 text-[#0a0a0a] sm:px-6 sm:py-12">
      <ViewErrorBoundary fallback={null}>
        <Suspense
          fallback={<Canvas3DSkeleton className="absolute inset-0 -z-10 rounded-none border-0" />}
        >
          <Hero3D className="absolute inset-0 -z-10" geometryType="roundedBox" />
        </Suspense>
      </ViewErrorBoundary>

      <div className="relative z-10 w-full max-w-xl">
        <button
          type="button"
          onClick={() => onNavigate?.('/(public)')}
          className="vinchi-transition mb-5 inline-flex min-h-[44px] items-center gap-2 rounded-[18px] border-2 border-[#bc8ae1]/80 bg-[#442c61] px-4 text-sm font-semibold text-[#ffffff] shadow-sm hover:border-[#e9d5ff] hover:bg-[#543b6c] cursor-pointer"
        >
          <ArrowLeft className="h-5 w-5 text-[#e9d5ff]" aria-hidden="true" />
          <span>Volver a Vinchi</span>
        </button>

        <LazyScrollSection
          eager
          hydrationDelayMs={200}
          skeleton={
            <div className="blueprint-card space-y-6 p-6 sm:p-9">
              <SkeletonBlock className="h-8 w-56" />
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {[0, 1, 2, 3].map((i) => (
                  <SkeletonBlock key={i} className="h-14 w-full rounded-[18px]" />
                ))}
              </div>
              <SkeletonBlock className="h-11 w-full rounded-[18px]" />
              <SkeletonBlock className="h-11 w-full rounded-[18px]" />
            </div>
          }
        >
          <section
            aria-labelledby="portal-acceso-title"
            className="rounded-[24px] border-2 border-[#bc8ae1]/80 bg-[#ffffff]/96 p-5 shadow-[0_22px_54px_-16px_rgba(68,44,97,0.28)] sm:p-9"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-medium tracking-[0.02em] text-[#9c44dc]">
                  {entryContext === 'pedir_ahora'
                    ? 'Acceso privado para comprar y pedir'
                    : entryContext === 'explorar_agentes'
                      ? 'Acceso a Explorar Portal Agentes'
                      : entryContext === 'postular_agente'
                        ? 'Postulación a Agente Vinchi'
                        : entryContext === 'entrar_agente'
                          ? 'Ingreso a espacio de Agente'
                          : entryContext === 'postular_domicilio' || entryContext === 'trabajar'
                            ? 'Postulación como Domicilio Vinchi'
                            : entryContext === 'entrar_domicilio'
                              ? 'Ingreso a espacio de Domicilio'
                              : 'Portal de acceso Vinchi'}
                </p>
                <h1
                  id="portal-acceso-title"
                  className="mt-1.5 font-display text-2xl font-semibold leading-[1.2] tracking-[-0.025em] text-[#0a0a0a] sm:text-3xl"
                >
                  {entryContext === 'pedir_ahora'
                    ? 'Inicia sesión para ver los catálogos'
                    : entryContext === 'explorar_agentes'
                      ? 'Ingresa o registra tu negocio'
                      : entryContext === 'postular_agente' ||
                          entryContext === 'postular_domicilio' ||
                          entryContext === 'trabajar'
                        ? 'Crea tu cuenta o inicia sesión para postularte'
                        : entryContext === 'entrar_agente' || entryContext === 'entrar_domicilio'
                          ? 'Ingresa con tu cuenta activa'
                          : 'Elige tu perfil de ingreso'}
                </h1>
              </div>
              <span className="font-display text-lg font-semibold tracking-[-0.04em] text-[#442c61] shrink-0">
                vinchi
              </span>
            </div>

            {entryContext === 'pedir_ahora' && (
              <div className="mt-4 rounded-[14px] border border-[#bc8ae1]/60 bg-[#bc8ae1]/12 px-4 py-3 text-xs leading-relaxed text-[#442c61]">
                Ingresa con tu cuenta para explorar todas las empresas registradas, guardar hasta 6
                ubicaciones de entrega y hacer tus pedidos sin recargos.
              </div>
            )}

            {(entryContext === 'explorar_agentes' || entryContext === 'crear_espacio') && (
              <div className="mt-4 rounded-[14px] border border-[#bc8ae1]/60 bg-[#bc8ae1]/12 px-4 py-3 text-xs leading-relaxed text-[#442c61]">
                Para solicitar un agente certificado y crear tu espacio, regístrate o inicia sesión.
                Entrarás con el rol de <strong>Empresario en espera</strong> y, cuando actives tu
                token, pasarás a <strong>Empresario</strong>.
              </div>
            )}

            {entryContext === 'postular_agente' && (
              <div className="mt-4 rounded-[14px] border border-[#bc8ae1]/60 bg-[#bc8ae1]/12 px-4 py-3 text-xs leading-relaxed text-[#442c61]">
                Antes de llenar el formulario de 30 preguntas y subir tu documentación, regístrate
                para crear tu cuenta y luego inicia sesión.
              </div>
            )}

            {(entryContext === 'postular_domicilio' || entryContext === 'trabajar') && (
              <div className="mt-4 rounded-[14px] border border-[#bc8ae1]/60 bg-[#bc8ae1]/12 px-4 py-3 text-xs leading-relaxed text-[#442c61]">
                Antes de responder el formulario de 30 preguntas como Domicilio y completar tu
                verificación facial, regístrate e inicia sesión con tu cuenta.
              </div>
            )}

            {entryContext === 'entrar_agente' && (
              <div className="mt-4 rounded-[14px] border border-[#bc8ae1]/60 bg-[#bc8ae1]/12 px-4 py-3 text-xs leading-relaxed text-[#442c61]">
                Si ya recibiste la autorización en tu correo electrónico, inicia sesión como Agente
                para abrir tu espacio de trabajo.
              </div>
            )}

            <div
              role="tablist"
              aria-label="Tipo de usuario"
              className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2"
            >
              {ACCESS_TABS.map((tab) => {
                const Icon = tab.icon;
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    role="tab"
                    type="button"
                    aria-selected={isSelected}
                    onClick={() => switchTab(tab.id)}
                    className={`flex min-h-[60px] items-center gap-3.5 rounded-[18px] px-4 py-2.5 text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#442c61] text-[#ffffff] shadow-[0_8px_20px_-8px_rgba(68,44,97,0.55)]'
                        : 'border border-[#bc8ae1]/55 bg-[#faf5ff] text-[#442c61] hover:border-[#9c44dc] hover:bg-[#f3e8ff]'
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] ${
                        isSelected
                          ? 'bg-[#9c44dc] text-[#ffffff]'
                          : 'border border-[#bc8ae1]/60 bg-[#ffffff] text-[#442c61]'
                      }`}
                    >
                      <Icon className="h-5 w-5 stroke-[2.2]" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{tab.label}</p>
                      <p
                        className={`truncate text-xs ${
                          isSelected ? 'text-[#e9d5ff]' : 'text-[#543b6c]'
                        }`}
                      >
                        {tab.audience}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 border-t border-[#bc8ae1]/45 pt-6">
              {activeMeta && (
                <p className="text-xs text-[#543b6c]">
                  Perfil seleccionado:{' '}
                  <span className="font-semibold text-[#442c61]">{activeMeta.label}</span>
                </p>
              )}

              {/* TAB 1: Cuenta Vinchi (Comercios, Clientes, Postulantes Agente/Domicilio) */}
              {activeTab === 'owner_client' && (
                <div className="mt-4 space-y-5">
                  <div className="grid grid-cols-2 gap-2 rounded-[16px] border border-[#bc8ae1]/55 bg-[#faf5ff] p-1">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('login');
                        setValidationError('');
                      }}
                      className={`inline-flex min-h-[42px] items-center justify-center gap-2 rounded-[12px] px-3 text-xs font-semibold transition-colors cursor-pointer ${
                        authMode === 'login'
                          ? 'bg-[#442c61] text-[#ffffff] shadow-xs'
                          : 'text-[#543b6c] hover:text-[#442c61]'
                      }`}
                    >
                      <LogIn className="h-4 w-4 stroke-[2.25]" aria-hidden="true" />
                      <span>Iniciar sesión</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('register');
                        setValidationError('');
                        setLocalStatus('');
                      }}
                      className={`inline-flex min-h-[42px] items-center justify-center gap-2 rounded-[12px] px-3 text-xs font-semibold transition-colors cursor-pointer ${
                        authMode === 'register'
                          ? 'bg-[#442c61] text-[#ffffff] shadow-xs'
                          : 'text-[#543b6c] hover:text-[#442c61]'
                      }`}
                    >
                      <UserPlus className="h-4 w-4 stroke-[2.25]" aria-hidden="true" />
                      <span>Registrarse</span>
                    </button>
                  </div>

                  {authMode === 'login' ? (
                    <form onSubmit={handleClientLoginSubmit} noValidate className="space-y-4">
                      <div>
                        <label
                          htmlFor="client-login-email"
                          className="block text-xs font-medium text-[#442c61]"
                        >
                          Correo electrónico
                        </label>
                        <div className="relative mt-1.5">
                          <Mail
                            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#543b6c]"
                            aria-hidden="true"
                          />
                          <input
                            id="client-login-email"
                            type="email"
                            autoComplete="email"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            placeholder="tucorreo@vinchi.co"
                            className="h-11 w-full rounded-[16px] border border-[#e5e5e5] bg-[#f5f5f5] pl-10 pr-4 text-sm text-[#0a0a0a] placeholder:text-[#737373] focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="client-login-password"
                          className="block text-xs font-medium text-[#442c61]"
                        >
                          Contraseña
                        </label>
                        <div className="relative mt-1.5">
                          <Lock
                            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#543b6c]"
                            aria-hidden="true"
                          />
                          <input
                            id="client-login-password"
                            type="password"
                            autoComplete="current-password"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            placeholder="••••••••"
                            className="h-11 w-full rounded-[16px] border border-[#e5e5e5] bg-[#f5f5f5] pl-10 pr-4 text-sm text-[#0a0a0a] placeholder:text-[#737373] focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-[18px] bg-[#9c44dc] px-5 py-2.5 text-sm font-medium text-[#ffffff] transition-colors hover:bg-[#543b6c] disabled:opacity-60 cursor-pointer"
                      >
                        <LogIn className="h-4 w-4 stroke-[2.25]" aria-hidden="true" />
                        <span>{isSubmitting ? 'Iniciando sesión...' : 'Iniciar sesión'}</span>
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleClientRegisterSubmit} noValidate className="space-y-3.5">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label
                            htmlFor="reg-primer-nombre"
                            className="block text-xs font-medium text-[#442c61]"
                          >
                            Primer nombre <span className="text-[#9c44dc]">*</span>
                          </label>
                          <div className="relative mt-1">
                            <User
                              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#543b6c]"
                              aria-hidden="true"
                            />
                            <input
                              id="reg-primer-nombre"
                              type="text"
                              required
                              value={regPrimerNombre}
                              onChange={(e) => setRegPrimerNombre(e.target.value)}
                              placeholder="Obligatorio"
                              className="h-11 w-full rounded-[16px] border border-[#e5e5e5] bg-[#f5f5f5] pl-10 pr-3 text-sm text-[#0a0a0a] placeholder:text-[#737373] focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label
                            htmlFor="reg-segundo-nombre"
                            className="block text-xs font-medium text-[#442c61]"
                          >
                            Segundo nombre <span className="text-[#737373]">(opcional)</span>
                          </label>
                          <input
                            id="reg-segundo-nombre"
                            type="text"
                            value={regSegundoNombre}
                            onChange={(e) => setRegSegundoNombre(e.target.value)}
                            placeholder="Opcional"
                            className="mt-1 h-11 w-full rounded-[16px] border border-[#e5e5e5] bg-[#f5f5f5] px-3.5 text-sm text-[#0a0a0a] placeholder:text-[#737373] focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="reg-primer-apellido"
                            className="block text-xs font-medium text-[#442c61]"
                          >
                            Primer apellido <span className="text-[#9c44dc]">*</span>
                          </label>
                          <input
                            id="reg-primer-apellido"
                            type="text"
                            required
                            value={regPrimerApellido}
                            onChange={(e) => setRegPrimerApellido(e.target.value)}
                            placeholder="Obligatorio"
                            className="mt-1 h-11 w-full rounded-[16px] border border-[#e5e5e5] bg-[#f5f5f5] px-3.5 text-sm text-[#0a0a0a] placeholder:text-[#737373] focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="reg-segundo-apellido"
                            className="block text-xs font-medium text-[#442c61]"
                          >
                            Segundo apellido <span className="text-[#737373]">(opcional)</span>
                          </label>
                          <input
                            id="reg-segundo-apellido"
                            type="text"
                            value={regSegundoApellido}
                            onChange={(e) => setRegSegundoApellido(e.target.value)}
                            placeholder="Opcional"
                            className="mt-1 h-11 w-full rounded-[16px] border border-[#e5e5e5] bg-[#f5f5f5] px-3.5 text-sm text-[#0a0a0a] placeholder:text-[#737373] focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none"
                          />
                        </div>
                      </div>

                      {!hideBusinessField && (
                        <div>
                          <label
                            htmlFor="reg-negocio"
                            className="block text-xs font-medium text-[#442c61]"
                          >
                            Nombre del negocio
                          </label>
                          <div className="relative mt-1">
                            <Building2
                              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#543b6c]"
                              aria-hidden="true"
                            />
                            <input
                              id="reg-negocio"
                              type="text"
                              value={regNegocio}
                              onChange={(e) => setRegNegocio(e.target.value)}
                              placeholder="Ej. Café del Parque"
                              className="h-11 w-full rounded-[16px] border border-[#e5e5e5] bg-[#f5f5f5] pl-10 pr-3 text-sm text-[#0a0a0a] placeholder:text-[#737373] focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none"
                            />
                          </div>
                        </div>
                      )}

                      <div>
                        <label
                          htmlFor="reg-email"
                          className="block text-xs font-medium text-[#442c61]"
                        >
                          Correo electrónico
                        </label>
                        <div className="relative mt-1">
                          <Mail
                            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#543b6c]"
                            aria-hidden="true"
                          />
                          <input
                            id="reg-email"
                            type="email"
                            autoComplete="email"
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                            placeholder="tucorreo@vinchi.co"
                            className="h-11 w-full rounded-[16px] border border-[#e5e5e5] bg-[#f5f5f5] pl-10 pr-4 text-sm text-[#0a0a0a] placeholder:text-[#737373] focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="reg-password"
                          className="block text-xs font-medium text-[#442c61]"
                        >
                          Contraseña
                        </label>
                        <div className="relative mt-1">
                          <Lock
                            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#543b6c]"
                            aria-hidden="true"
                          />
                          <input
                            id="reg-password"
                            type="password"
                            autoComplete="new-password"
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            placeholder="Mínimo 6 caracteres"
                            className="h-11 w-full rounded-[16px] border border-[#e5e5e5] bg-[#f5f5f5] pl-10 pr-4 text-sm text-[#0a0a0a] placeholder:text-[#737373] focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex min-h-[46px] w-full items-center justify-center rounded-[18px] bg-[#442c61] px-5 text-sm font-medium text-[#ffffff] transition-colors hover:bg-[#543b6c] disabled:opacity-60 cursor-pointer"
                      >
                        {isSubmitting
                          ? 'Registrando cuenta...'
                          : 'Crear cuenta y pasar a iniciar sesión'}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* TAB 2: Empleados / Cajeros */}
              {activeTab === 'staff_pos' && (
                <form onSubmit={handleStaffTokenSubmit} noValidate className="mt-4 space-y-4">
                  <p className="text-sm leading-relaxed text-[#543b6c]">
                    Uso exclusivo para cajeros y personal de salón. Ingresa el código o PIN que te
                    entregó el administrador del local.
                  </p>

                  <div>
                    <label
                      htmlFor="staff-magic-token"
                      className="block text-xs font-medium text-[#442c61]"
                    >
                      Código de acceso o PIN
                    </label>
                    <div className="relative mt-2">
                      <KeyRound
                        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#543b6c]"
                        aria-hidden="true"
                      />
                      <input
                        id="staff-magic-token"
                        type="password"
                        autoComplete="one-time-code"
                        value={staffToken}
                        onChange={(e) => setStaffToken(e.target.value)}
                        placeholder="Ej. CAJA-8492 o PIN de 6 dígitos"
                        className="h-11 w-full rounded-[18px] border border-[#e5e5e5] bg-[#f5f5f5] pl-10 pr-4 font-mono tabular-nums text-sm tracking-wider text-[#0a0a0a] placeholder:font-sans placeholder:tracking-normal placeholder:text-[#737373] focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex min-h-[46px] w-full items-center justify-center rounded-[18px] bg-[#9c44dc] px-5 text-sm font-medium text-[#ffffff] transition-colors hover:bg-[#543b6c] disabled:opacity-60 cursor-pointer"
                  >
                    {isSubmitting ? 'Validando PIN...' : 'Acceder al Panel de Caja'}
                  </button>
                </form>
              )}

              {/* TAB 3, 4 & 5: Domicilio / Agentes / Superadmin (Todos requieren iniciar sesión) */}
              {(activeTab === 'courier' || activeTab === 'agent' || activeTab === 'admin') && (
                <form
                  onSubmit={(e) =>
                    void handleCorpSubmit(
                      e,
                      activeTab === 'admin'
                        ? 'superadmin'
                        : activeTab === 'courier'
                          ? 'repartidor'
                          : 'agente'
                    )
                  }
                  noValidate
                  className="mt-4 space-y-4"
                >
                  <p className="text-sm leading-relaxed text-[#543b6c]">
                    {activeTab === 'admin'
                      ? 'Acceso privado exclusivo para dirección general y control operativo.'
                      : activeTab === 'courier'
                        ? 'Ingresa con tu correo y contraseña de domiciliario para abrir tu mapa de entregas, chats y ganancias.'
                        : 'Acceso corporativo para agentes comerciales certificados Vinchi.'}
                  </p>

                  <div>
                    <label
                      htmlFor="corp-email"
                      className="block text-xs font-medium text-[#442c61]"
                    >
                      Correo electrónico
                    </label>
                    <div className="relative mt-2">
                      <Mail
                        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#543b6c]"
                        aria-hidden="true"
                      />
                      <input
                        id="corp-email"
                        type="email"
                        autoComplete="username"
                        value={corpEmail}
                        onChange={(e) => setCorpEmail(e.target.value)}
                        placeholder={
                          activeTab === 'admin'
                            ? 'admin@vinchi.co'
                            : activeTab === 'courier'
                              ? 'repartidor@vinchi.co'
                              : 'agente@vinchi.co'
                        }
                        className="h-11 w-full rounded-[18px] border border-[#e5e5e5] bg-[#f5f5f5] pl-10 pr-4 text-sm text-[#0a0a0a] placeholder:text-[#737373] focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="corp-password"
                      className="block text-xs font-medium text-[#442c61]"
                    >
                      Contraseña
                    </label>
                    <div className="relative mt-2">
                      <Lock
                        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#543b6c]"
                        aria-hidden="true"
                      />
                      <input
                        id="corp-password"
                        type="password"
                        autoComplete="current-password"
                        value={corpPassword}
                        onChange={(e) => setCorpPassword(e.target.value)}
                        placeholder="••••••••"
                        className="h-11 w-full rounded-[18px] border border-[#e5e5e5] bg-[#f5f5f5] pl-10 pr-4 text-sm text-[#0a0a0a] placeholder:text-[#737373] focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex min-h-[46px] w-full items-center justify-center rounded-[18px] bg-[#9c44dc] px-5 text-sm font-medium text-[#ffffff] transition-colors hover:bg-[#543b6c] disabled:opacity-60 cursor-pointer"
                  >
                    {isSubmitting
                      ? 'Autenticando...'
                      : activeTab === 'admin'
                        ? 'Ingresar a Superadmin'
                        : activeTab === 'courier'
                          ? 'Ingresar a mi espacio de Domicilio'
                          : 'Ingresar al Portal de Agente'}
                  </button>
                </form>
              )}

              {displayedError && (
                <p
                  role="alert"
                  className="mt-4 rounded-[10px] border border-[#9c645c]/50 bg-[#d0b7b0]/28 px-4 py-3 text-xs font-medium text-[#5c302a]"
                >
                  {displayedError}
                </p>
              )}

              {displayedStatus && !displayedError && (
                <p
                  role="status"
                  className="mt-4 rounded-[10px] border border-[#bc8ae1] bg-[#bc8ae1]/18 px-4 py-3 text-xs font-medium text-[#442c61]"
                >
                  {displayedStatus}
                </p>
              )}
            </div>

            <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-[#bc8ae1]/45 pt-5 text-xs text-[#543b6c]">
              <button
                type="button"
                onClick={() => setShowDemoCreds((v) => !v)}
                className="inline-flex min-h-[40px] items-center rounded-[12px] px-3 py-1.5 text-left font-medium text-[#543b6c] hover:bg-[#faf5ff] hover:text-[#9c44dc] transition-colors cursor-pointer"
              >
                {showDemoCreds ? 'Ocultar accesos de prueba' : 'Ver accesos de prueba por rol'}
              </button>

              <button
                type="button"
                onClick={() => switchTab(activeTab === 'admin' ? 'owner_client' : 'admin')}
                className="inline-flex min-h-[40px] items-center gap-2 rounded-[12px] px-3 py-1.5 font-medium hover:bg-[#faf5ff] hover:text-[#9c44dc] transition-colors cursor-pointer"
              >
                <Shield className="h-4 w-4 stroke-[2.25] text-[#9c44dc]" aria-hidden="true" />
                <span>{activeTab === 'admin' ? 'Acceso Principal' : 'Acceso Superadmin'}</span>
              </button>
            </div>

            {showDemoCreds && (
              <div className="mt-4 grid gap-2.5 rounded-[16px] border border-[#bc8ae1]/60 bg-[#faf5ff] p-4 text-xs text-[#543b6c] sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    switchTab('owner_client');
                    setAuthMode('login');
                    setLoginEmail('cliente@vinchi.co');
                    setLoginPassword('Vinchi2026!');
                  }}
                  className="rounded-[12px] border border-[#bc8ae1] bg-[#ffffff] p-3.5 text-left hover:border-[#9c44dc] cursor-pointer"
                >
                  <p className="font-semibold text-[#9c44dc]">Cliente Comprador</p>
                  <p className="mt-0.5 font-mono text-xs">cliente@vinchi.co · Vinchi2026!</p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    switchTab('agent');
                    setCorpEmail('agente@vinchi.co');
                    setCorpPassword('Vinchi2026!');
                  }}
                  className="rounded-[12px] border border-[#e5e5e5] bg-[#ffffff] p-3.5 text-left hover:border-[#9c44dc] cursor-pointer"
                >
                  <p className="font-semibold text-[#442c61]">Agente Vinchi</p>
                  <p className="mt-0.5 font-mono text-xs">agente@vinchi.co · Vinchi2026!</p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    switchTab('courier');
                    setCorpEmail('repartidor@vinchi.co');
                    setCorpPassword('Vinchi2026!');
                  }}
                  className="rounded-[12px] border border-[#e5e5e5] bg-[#ffffff] p-3.5 text-left hover:border-[#9c44dc] cursor-pointer"
                >
                  <p className="font-semibold text-[#442c61]">Domicilio Activo</p>
                  <p className="mt-0.5 font-mono text-xs">repartidor@vinchi.co · Vinchi2026!</p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    switchTab('owner_client');
                    setAuthMode('login');
                    setLoginEmail('comercio@vinchi.co');
                    setLoginPassword('Vinchi2026!');
                  }}
                  className="rounded-[12px] border border-[#e5e5e5] bg-[#ffffff] p-3.5 text-left hover:border-[#9c44dc] cursor-pointer"
                >
                  <p className="font-semibold text-[#442c61]">Comercio Activo</p>
                  <p className="mt-0.5 font-mono text-xs">comercio@vinchi.co · Vinchi2026!</p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    switchTab('admin');
                    setCorpEmail('admin@vinchi.co');
                    setCorpPassword('Vinchi2026!');
                  }}
                  className="rounded-[12px] border border-[#e5e5e5] bg-[#ffffff] p-3.5 text-left hover:border-[#9c44dc] cursor-pointer"
                >
                  <p className="font-semibold text-[#442c61]">Superadmin</p>
                  <p className="mt-0.5 font-mono text-xs">admin@vinchi.co · Vinchi2026!</p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    switchTab('staff_pos');
                    setStaffToken('CAJA-8492');
                  }}
                  className="rounded-[12px] border border-[#e5e5e5] bg-[#ffffff] p-3.5 text-left hover:border-[#9c44dc] cursor-pointer"
                >
                  <p className="font-semibold text-[#442c61]">Cajero PIN</p>
                  <p className="mt-0.5 font-mono text-xs">Código: CAJA-8492</p>
                </button>
              </div>
            )}
          </section>
        </LazyScrollSection>
      </div>
    </main>
  );
}
