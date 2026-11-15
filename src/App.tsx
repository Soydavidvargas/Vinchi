import { Suspense, useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import LandingPage from '@/src/app/(public)/page';
import { lazyWithRetry, ViewErrorBoundary } from '@/src/components/ResilientLazy';
import ScrollToTopButton from '@/src/components/ScrollToTopButton';
import WorkRoleModal from '@/src/components/WorkRoleModal';
import {
  DashboardPageSkeleton,
  HeroSkeleton,
  LoginPageSkeleton,
} from '@/src/components/Skeletons';
import {
  anularServerOrder,
  cobrarServerOrder,
  fetchCurrentUser,
  fetchServerOrders,
  loginAccount,
  loginWithBiometricCourier,
  loginWithStaffToken,
  logoutAccount,
  registerAccount,
} from '@/src/lib/vinchiClient';
import type {
  AgentKpis,
  AuthUser,
  ComercioSummary,
  LoginEntryContext,
  MenuCatalogItem,
  OrderRecord,
  RepartidorShiftState,
  SaaSPlan,
  SuperadminKpis,
  VinchiRole,
  VinchiRoute,
} from '@/src/types/vinchi';

const ClienteMenuPage = lazyWithRetry(() => import('@/src/app/(public)/cliente/page'));
const LoginPage = lazyWithRetry(() => import('@/src/app/(auth)/login/page'));
const ExplorarAgentesPortalPage = lazyWithRetry(
  () => import('@/src/app/(portal)/explorar-agentes/page')
);
const PostularAgentePage = lazyWithRetry(
  () => import('@/src/app/(portal)/postular-agente/page')
);
const PostularDomicilioPage = lazyWithRetry(
  () => import('@/src/app/(portal)/postular-domicilio/page')
);
const AdminDashboardPage = lazyWithRetry(() => import('@/src/app/(dashboards)/admin/page'));
const ComercioPosPage = lazyWithRetry(() => import('@/src/app/(dashboards)/comercio/page'));
const AgentePortalPage = lazyWithRetry(() => import('@/src/app/(dashboards)/agente/page'));
const RepartidorAppPage = lazyWithRetry(() => import('@/src/app/(dashboards)/repartidor/page'));

const SAAS_PLANS: SaaSPlan[] = [
  {
    id: 'basico',
    name: 'Básico',
    priceCop: 0,
    annualPriceCop: 0,
    billingCycle: '/ mes',
    targetAudience: 'Inicio digital',
    description:
      'Carta digital sencilla en mesa para empezar. Sin control de caja, mesas ni despacho a domicilio.',
    limits: [
      '0% comisión por orden',
      'Hasta 15 productos en catálogo de mesa',
    ],
    excluded: [
      'Sin control de caja ni cierre de turno',
      'Sin gestión de mesas ni App Domiciliario',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    priceCop: 60900,
    annualPriceCop: 669900,
    annualSavingsLabel: 'Ahorras $ 60.900 al año',
    annualSubnote: 'Equivale a $ 55.825 / mes (1 mes gratis al año)',
    billingCycle: 'COP / mes',
    targetAudience: 'Operación completa',
    badgeLabel: 'Más elegido',
    highlighted: true,
    description: 'Control total de caja en salón, gestión de mesas y despacho con flota propia.',
    limits: [
      '0% comisión por orden',
      'Catálogo ilimitado y múltiples cajas',
      'Gestión de mesas y despacho con App Domiciliario',
    ],
  },
  {
    id: 'ultra',
    name: 'Ultra',
    priceCop: 185900,
    annualPriceCop: 1673100,
    annualSavingsLabel: '3 meses gratis · Ahorras $ 557.700',
    annualSubnote: 'Equivale a $ 139.425 / mes (pagas solo 9 meses)',
    billingCycle: 'COP / mes',
    targetAudience: 'Experiencia total con IA',
    badgeLabel: 'Todo incluido + IA',
    description:
      'Todas las funciones del plan Premium con carta inmersiva e IA integrada para maximizar pedidos en cada mesa.',
    featuredCapability: 'Todas las funciones Premium + IA integrada',
    limits: [
      'Todo lo del plan Premium incluido (cajas, mesas y domicilios)',
      'IA integrada para sugerencias inteligentes y optimización de carta',
      'Platos interactivos inmersivos en tu menú digital',
      'Soporte prioritario y reportes avanzados',
    ],
  },
];

const INITIAL_ADMIN_KPIS: SuperadminKpis = {
  totalComercios: 148,
  totalAgentes: 24,
  totalDomiciliarios: 92,
  mrrCop: 11840000,
};

const INITIAL_COMERCIOS: ComercioSummary[] = [
  {
    id: 'com-1',
    nombre: 'Bistró Central',
    plan: 'Ultra',
    ciudad: 'Bogotá',
    estado: 'Activo',
    pedidosMes: 842,
  },
  {
    id: 'com-2',
    nombre: 'Mercado Urbano 84',
    plan: 'Premium',
    ciudad: 'Medellín',
    estado: 'Activo',
    pedidosMes: 1210,
  },
];

const INITIAL_ORDERS: OrderRecord[] = [
  {
    id: 'ord-101',
    codigo: '#VN-1042',
    mesaOOrigen: 'Mesa 04',
    clienteNombre: 'Laura Méndez',
    hora: '19:14',
    estado: 'Lista para cobro',
    totalCop: 78000,
    items: [
      { id: 'i1', nombre: 'Bowl Proteico Especial', cantidad: 2, precioUnitarioCop: 32000 },
      { id: 'i2', nombre: 'Limonada Hierbabuena', cantidad: 2, precioUnitarioCop: 7000 },
    ],
  },
  {
    id: 'ord-102',
    codigo: '#VN-1043',
    mesaOOrigen: 'Domicilio Directo',
    clienteNombre: 'Carlos Restrepo',
    hora: '19:22',
    estado: 'En preparación',
    totalCop: 54000,
    items: [
      { id: 'i3', nombre: 'Hamburguesa Artesanal Doble', cantidad: 1, precioUnitarioCop: 38000 },
      { id: 'i4', nombre: 'Papas Trufadas', cantidad: 1, precioUnitarioCop: 16000 },
    ],
  },
];

const INITIAL_AGENT_KPIS: AgentKpis = {
  comerciosVinculados: 18,
  setupFeesCobrados: 18,
  comisionAcumuladaCop: 630000,
  tasaConversion: '64%',
};

const INITIAL_MENU_ITEMS: MenuCatalogItem[] = [
  {
    id: 'm1',
    nombre: 'Corte Ribeye Madurado',
    categoria: 'Platos Fuertes',
    descripcion: '350g a la parrilla con mantequilla de romero y papas rústicas.',
    precioCop: 68000,
    soporta3D: true,
  },
  {
    id: 'm2',
    nombre: 'Ramen Tonkotsu Clásico',
    categoria: 'Especiales',
    descripcion: 'Caldo de cocción lenta 12 horas, chashu y huevo marinado.',
    precioCop: 42000,
    soporta3D: true,
  },
];

const PRIVATE_ROUTES: VinchiRoute[] = [
  '/(public)/cliente',
  '/(portal)/explorar-agentes',
  '/(portal)/postular-agente',
  '/(portal)/postular-domicilio',
  '/(dashboards)/admin',
  '/(dashboards)/comercio',
  '/(dashboards)/agente',
  '/(dashboards)/repartidor',
];

const ROLE_LABELS: Record<VinchiRole, string> = {
  cliente: 'Cliente',
  empresario_en_espera: 'Empresario en espera',
  comercio: 'Empresario',
  agente: 'Agente Certificado',
  repartidor: 'Repartidor Verificado',
  superadmin: 'Superadmin',
};

function isClientLockedToCatalog(user: AuthUser | null): boolean {
  if (!user) return false;
  return (
    user.role === 'cliente' &&
    !user.businessActivated &&
    user.agentApplicationStatus !== 'approved' &&
    user.courierApplicationStatus !== 'approved'
  );
}

function getDefaultRouteForUser(user: AuthUser, context: LoginEntryContext): VinchiRoute {
  if (context === 'pedir_ahora') return '/(public)/cliente';
  if (user.role === 'agente') return '/(dashboards)/agente';
  if (user.role === 'repartidor') return '/(dashboards)/repartidor';
  if (user.role === 'superadmin') return '/(dashboards)/admin';
  if (context === 'postular_agente') return '/(portal)/postular-agente';
  if (context === 'postular_domicilio' || context === 'entrar_domicilio') {
    return '/(portal)/postular-domicilio';
  }
  if (user.role === 'empresario_en_espera') {
    return user.businessActivated ? '/(dashboards)/comercio' : '/(portal)/explorar-agentes';
  }
  if (user.role === 'comercio') {
    if (context === 'explorar_agentes') return '/(portal)/explorar-agentes';
    return user.businessActivated ? '/(dashboards)/comercio' : '/(portal)/explorar-agentes';
  }
  if (context === 'explorar_agentes' || context === 'crear_espacio') {
    return '/(portal)/explorar-agentes';
  }
  return '/(public)/cliente';
}

function canAccessRoute(user: AuthUser | null, route: VinchiRoute): boolean {
  if (!PRIVATE_ROUTES.includes(route)) return true;
  if (!user) return false;
  if (route === '/(public)/cliente') return true;
  if (user.role === 'superadmin') return true;
  if (route === '/(portal)/explorar-agentes') {
    return (
      user.role === 'cliente' ||
      user.role === 'empresario_en_espera' ||
      user.role === 'comercio'
    );
  }
  if (route === '/(portal)/postular-agente') {
    return (
      user.role === 'cliente' ||
      user.role === 'empresario_en_espera' ||
      user.role === 'comercio' ||
      user.role === 'agente'
    );
  }
  if (route === '/(portal)/postular-domicilio') {
    return (
      user.role === 'cliente' ||
      user.role === 'empresario_en_espera' ||
      user.role === 'comercio' ||
      user.role === 'repartidor'
    );
  }
  if (route === '/(dashboards)/comercio') {
    return (
      Boolean(user.businessActivated) &&
      (user.role === 'comercio' ||
        user.role === 'empresario_en_espera' ||
        user.role === 'cliente')
    );
  }
  if (route === '/(dashboards)/agente') {
    return user.role === 'agente' || user.agentApplicationStatus === 'approved';
  }
  if (route === '/(dashboards)/repartidor') {
    return user.role === 'repartidor' || user.courierApplicationStatus === 'approved';
  }
  if (route === '/(dashboards)/admin') {
    return false;
  }
  return false;
}

function RouteSkeletonFallback({ route }: { route: VinchiRoute }) {
  if (route === '/(public)') {
    return (
      <div className="min-h-screen bg-[#f6f1fc] px-4 py-16 sm:px-6 sm:py-24">
        <HeroSkeleton />
      </div>
    );
  }
  if (route === '/(auth)/login') {
    return <LoginPageSkeleton />;
  }
  return <DashboardPageSkeleton />;
}

export default function App() {
  const [activeRoute, setActiveRoute] = useState<VinchiRoute>('/(public)');
  const [loginContext, setLoginContext] = useState<LoginEntryContext>('general');
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authBootstrapped, setAuthBootstrapped] = useState(false);
  const [showWorkModal, setShowWorkModal] = useState(false);

  const [isRouteLoading, setIsRouteLoading] = useState<boolean>(true);
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [loginStatus, setLoginStatus] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');

  const [orders, setOrders] = useState<OrderRecord[]>(INITIAL_ORDERS);
  const [selectedOrderId, setSelectedOrderId] = useState<string>(INITIAL_ORDERS[0].id);
  const [generatedLink, setGeneratedLink] = useState<string>('');
  const [shiftState, setShiftState] = useState<RepartidorShiftState>({
    turnoActivo: false,
    ultimoCheckIn: 'Sin registro',
  });
  const [selectedMenuItemId, setSelectedMenuItemId] = useState<string>(INITIAL_MENU_ITEMS[0].id);

  // Restaurar sesión real y órdenes guardadas al iniciar
  useEffect(() => {
    let mounted = true;
    Promise.all([fetchCurrentUser(), fetchServerOrders().catch(() => ({ orders: INITIAL_ORDERS }))])
      .then(([user, orderRes]) => {
        if (!mounted) return;
        setCurrentUser(user);
        if (isClientLockedToCatalog(user)) {
          setActiveRoute('/(public)/cliente');
        }
        if (orderRes.orders?.length) {
          setOrders(orderRes.orders);
        }
      })
      .finally(() => {
        if (mounted) setAuthBootstrapped(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setIsRouteLoading(true);
    window.scrollTo({ top: 0 });
    const timer = window.setTimeout(() => {
      setIsRouteLoading(false);
    }, 200);
    return () => window.clearTimeout(timer);
  }, [activeRoute]);

  const navigateWithGuard = (route: VinchiRoute, contextOverride?: LoginEntryContext) => {
    if (route === '/(public)' && isClientLockedToCatalog(currentUser)) {
      setActiveRoute('/(public)/cliente');
      return;
    }

    if (!PRIVATE_ROUTES.includes(route)) {
      if (route === '/(auth)/login' && contextOverride) {
        setLoginContext(contextOverride);
      }
      setLoginError('');
      setActiveRoute(route);
      return;
    }

    if (!currentUser) {
      const nextContext: LoginEntryContext =
        contextOverride ??
        (route === '/(public)/cliente'
          ? 'pedir_ahora'
          : route === '/(portal)/explorar-agentes'
            ? 'explorar_agentes'
            : route === '/(dashboards)/repartidor'
              ? 'trabajar'
              : 'crear_espacio');
      setLoginContext(nextContext);
      setLoginError('');
      setLoginStatus('Inicia sesión con tu cuenta para acceder a esta sección privada.');
      setActiveRoute('/(auth)/login');
      return;
    }

    if (
      route === '/(dashboards)/comercio' &&
      (currentUser.role === 'cliente' || currentUser.role === 'empresario_en_espera') &&
      !currentUser.businessActivated
    ) {
      setActiveRoute('/(portal)/explorar-agentes');
      return;
    }

    setActiveRoute(route);
  };

  const handleOpenExplorarPortalAgentes = () => {
    if (
      currentUser &&
      (currentUser.role === 'cliente' ||
        currentUser.role === 'empresario_en_espera' ||
        currentUser.role === 'comercio')
    ) {
      setActiveRoute('/(portal)/explorar-agentes');
      return;
    }
    setLoginContext('explorar_agentes');
    setLoginError('');
    setLoginStatus('');
    setActiveRoute('/(auth)/login');
  };

  const handleRegister = async (payload: {
    primerNombre: string;
    segundoNombre?: string;
    primerApellido: string;
    segundoApellido?: string;
    negocioNombre?: string;
    email: string;
    password: string;
    entryContext?: LoginEntryContext;
  }): Promise<boolean> => {
    setIsAuthSubmitting(true);
    setLoginError('');
    setLoginStatus('');
    try {
      const ctx = payload.entryContext ?? loginContext;
      const intendedRole =
        ctx === 'explorar_agentes' || ctx === 'crear_espacio'
          ? 'empresario_en_espera'
          : 'cliente';
      const res = await registerAccount({
        ...payload,
        intendedRole,
        entryContext: ctx,
      });
      setLoginStatus(res.message);
      return true;
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'No se pudo completar el registro.');
      return false;
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleLogin = async (payload: {
    email: string;
    password: string;
    expectedRole?: VinchiRole;
  }) => {
    setIsAuthSubmitting(true);
    setLoginError('');
    setLoginStatus('');
    try {
      const { user } = await loginAccount(payload);
      setCurrentUser(user);
      const target = getDefaultRouteForUser(user, loginContext);
      setActiveRoute(target);
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'No fue posible iniciar sesión.');
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleStaffLogin = async (staffToken: string) => {
    setIsAuthSubmitting(true);
    setLoginError('');
    try {
      const { user } = await loginWithStaffToken(staffToken);
      setCurrentUser(user);
      setActiveRoute('/(dashboards)/comercio');
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Código de caja inválido.');
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleBiometricLogin = async () => {
    setIsAuthSubmitting(true);
    setLoginError('');
    try {
      const { user } = await loginWithBiometricCourier();
      setCurrentUser(user);
      setActiveRoute('/(dashboards)/repartidor');
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'No se pudo verificar tu identidad.');
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logoutAccount();
    setCurrentUser(null);
    setLoginStatus('');
    setLoginError('');
    setLoginContext('general');
    setActiveRoute('/(public)');
  };

  const handleCobrarOrder = async (orderId: string) => {
    try {
      const res = await cobrarServerOrder(orderId);
      setOrders(res.orders);
    } catch {
      setOrders((prev) =>
        prev.map((order) => (order.id === orderId ? { ...order, estado: 'Cobrada' } : order))
      );
    }
  };

  const handleAnularOrder = async (orderId: string) => {
    try {
      const res = await anularServerOrder(orderId);
      setOrders(res.orders);
    } catch {
      setOrders((prev) =>
        prev.map((order) => (order.id === orderId ? { ...order, estado: 'Anulada' } : order))
      );
    }
  };

  const handleToggleShift = () => {
    setShiftState((prev) =>
      prev.turnoActivo
        ? {
            turnoActivo: false,
            ultimoCheckIn: prev.ultimoCheckIn,
          }
        : {
            turnoActivo: true,
            ultimoCheckIn: 'Hoy · 19:25',
            pedidoAsignado: {
              codigo: '#VN-1043',
              comercio: 'Bistró Central',
              direccionEntrega: 'Cra 11 # 84-20, Apto 402',
              distanciaKm: '1.8 km',
            },
          }
    );
  };

  const handleAddOrderItem = (itemId: string) => {
    const catalogItem = INITIAL_MENU_ITEMS.find((i) => i.id === itemId);
    if (!catalogItem) return;

    setOrders((prev) => {
      const existingMesaOrder = prev.find(
        (o) => o.mesaOOrigen === 'Mesa 04' && o.estado !== 'Cobrada' && o.estado !== 'Anulada'
      );
      if (existingMesaOrder) {
        return prev.map((order) => {
          if (order.id !== existingMesaOrder.id) return order;
          const hasItem = order.items.some((i) => i.id === catalogItem.id);
          const nextItems = hasItem
            ? order.items.map((i) =>
                i.id === catalogItem.id ? { ...i, cantidad: i.cantidad + 1 } : i
              )
            : [
                ...order.items,
                {
                  id: catalogItem.id,
                  nombre: catalogItem.nombre,
                  cantidad: 1,
                  precioUnitarioCop: catalogItem.precioCop,
                },
              ];
          return {
            ...order,
            items: nextItems,
            totalCop: nextItems.reduce(
              (sum, i) => sum + i.cantidad * i.precioUnitarioCop,
              0
            ),
          };
        });
      }

      const newOrder: OrderRecord = {
        id: `ord-${Date.now()}`,
        codigo: `#VN-${1044 + prev.length}`,
        mesaOOrigen: 'Mesa 04',
        clienteNombre: 'Cliente QR',
        hora: 'Ahora',
        estado: 'Lista para cobro',
        totalCop: catalogItem.precioCop,
        items: [
          {
            id: catalogItem.id,
            nombre: catalogItem.nombre,
            cantidad: 1,
            precioUnitarioCop: catalogItem.precioCop,
          },
        ],
      };
      setSelectedOrderId(newOrder.id);
      return [newOrder, ...prev];
    });
  };

  const isRoleAllowed = canAccessRoute(currentUser, activeRoute);

  return (
    <div className="min-h-screen overflow-x-clip bg-[#f6f1fc] text-[#0a0a0a]">
      {isRouteLoading || !authBootstrapped ? (
        <RouteSkeletonFallback route={activeRoute} />
      ) : !isRoleAllowed ? (
        <main className="flex min-h-[70vh] items-center justify-center bg-gradient-to-b from-[#f3e8ff] via-[#faf5ff] to-[#f4ecfb] px-4 py-12">
          <div className="max-w-md rounded-[24px] border-2 border-[#bc8ae1]/75 bg-[#ffffff] p-8 text-center shadow-[0_18px_40px_-14px_rgba(68,44,97,0.22)]">
            <ShieldAlert className="mx-auto h-12 w-12 text-[#9c44dc]" aria-hidden="true" />
            <h1 className="mt-4 font-display text-xl font-semibold text-[#442c61]">
              Sección privada restringida por rol
            </h1>
            <p className="mt-2 text-sm text-[#543b6c]">
              {currentUser
                ? `Tu sesión actual (${ROLE_LABELS[currentUser.role]}) no tiene permisos para abrir esta vista.`
                : 'Debes iniciar sesión con una cuenta autorizada para ingresar aquí.'}
            </p>
            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() =>
                  currentUser
                    ? setActiveRoute(getDefaultRouteForUser(currentUser, loginContext))
                    : setActiveRoute('/(auth)/login')
                }
                className="vinchi-transition rounded-[16px] bg-[#9c44dc] px-5 py-2.5 text-sm font-medium text-[#ffffff] hover:bg-[#543b6c] cursor-pointer"
              >
                {currentUser ? 'Ir a mi espacio permitido' : 'Iniciar sesión'}
              </button>
              {!isClientLockedToCatalog(currentUser) && (
                <button
                  type="button"
                  onClick={() => setActiveRoute('/(public)')}
                  className="vinchi-transition rounded-[16px] border border-[#e5e5e5] bg-[#ffffff] px-5 py-2.5 text-sm font-medium text-[#442c61] hover:border-[#bc8ae1] cursor-pointer"
                >
                  Volver al inicio
                </button>
              )}
            </div>
          </div>
        </main>
      ) : (
        <ViewErrorBoundary resetKey={activeRoute}>
          <Suspense fallback={<RouteSkeletonFallback route={activeRoute} />}>
            {activeRoute === '/(public)' && (
              <LandingPage
                plans={SAAS_PLANS}
                setupFeeCop={35000}
                currentUser={currentUser}
                roleLabel={currentUser ? ROLE_LABELS[currentUser.role] : undefined}
                onDigitalizeClick={handleOpenExplorarPortalAgentes}
                onExploreAgentsClick={handleOpenExplorarPortalAgentes}
                onWorkClick={() => setShowWorkModal(true)}
                onSelectPlan={() => handleOpenExplorarPortalAgentes()}
                onNavigate={(route) => navigateWithGuard(route)}
                onLogout={handleLogout}
              />
            )}

            {activeRoute === '/(auth)/login' && (
              <LoginPage
                entryContext={loginContext}
                isSubmitting={isAuthSubmitting}
                statusMessage={loginStatus}
                errorMessage={loginError}
                onRegisterAccount={handleRegister}
                onLoginAccount={handleLogin}
                onSubmitStaffToken={handleStaffLogin}
                onBiometricCheckIn={handleBiometricLogin}
                onNavigate={(route) => navigateWithGuard(route)}
              />
            )}

            {activeRoute === '/(portal)/explorar-agentes' && currentUser && (
              <ExplorarAgentesPortalPage
                user={currentUser}
                onUserUpdated={(updatedUser) => setCurrentUser(updatedUser)}
                onNavigate={(route) => navigateWithGuard(route)}
              />
            )}

            {activeRoute === '/(portal)/postular-agente' && currentUser && (
              <PostularAgentePage
                user={currentUser}
                onUserUpdated={(updatedUser) => setCurrentUser(updatedUser)}
                onNavigate={(route) => navigateWithGuard(route)}
              />
            )}

            {activeRoute === '/(portal)/postular-domicilio' && currentUser && (
              <PostularDomicilioPage
                user={currentUser}
                onUserUpdated={(updatedUser) => setCurrentUser(updatedUser)}
                onNavigate={(route) => navigateWithGuard(route)}
              />
            )}

            {activeRoute === '/(dashboards)/admin' && (
              <AdminDashboardPage
                kpis={INITIAL_ADMIN_KPIS}
                comercios={INITIAL_COMERCIOS}
                onExportReport={() => {
                  const csv = [
                    'Comercio,Ciudad,Plan,Estado,PedidosMes',
                    ...INITIAL_COMERCIOS.map(
                      (c) => `${c.nombre},${c.ciudad},${c.plan},${c.estado},${c.pedidosMes}`
                    ),
                  ].join('\n');
                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const anchor = document.createElement('a');
                  anchor.href = url;
                  anchor.download = 'vinchi-corte-comercios.csv';
                  anchor.click();
                  URL.revokeObjectURL(url);
                }}
                onNavigate={(route) => navigateWithGuard(route)}
              />
            )}

            {activeRoute === '/(dashboards)/comercio' && (
              <ComercioPosPage
                plans={SAAS_PLANS}
                user={currentUser}
                comercioNombre={currentUser?.negocioNombre || 'Bistró Central'}
                orders={orders}
                selectedOrderId={selectedOrderId}
                onUserUpdated={(updatedUser) => setCurrentUser(updatedUser)}
                onSelectOrder={setSelectedOrderId}
                onCobrarOrder={handleCobrarOrder}
                onAnularOrder={handleAnularOrder}
                onNavigate={(route) => navigateWithGuard(route)}
                onLogout={handleLogout}
              />
            )}

            {activeRoute === '/(dashboards)/agente' && (
              <AgentePortalPage
                kpis={INITIAL_AGENT_KPIS}
                agenteNombre={currentUser?.nombre || 'Portal Comercial'}
                generatedLink={generatedLink}
                onUserUpdated={(updatedUser) => setCurrentUser(updatedUser)}
                onGenerateLink={() =>
                  setGeneratedLink('https://vinchi.app/onboarding/setup-35k?ref=AG-018')
                }
                onCopyLink={(link) => navigator.clipboard?.writeText(link)}
                onNavigate={(route) => navigateWithGuard(route)}
              />
            )}

            {activeRoute === '/(dashboards)/repartidor' && (
              <RepartidorAppPage
                user={currentUser ?? undefined}
                shiftState={shiftState}
                onUserUpdated={(updatedUser) => setCurrentUser(updatedUser)}
                onToggleBiometricShift={handleToggleShift}
                onNavigate={(route) => navigateWithGuard(route)}
              />
            )}

            {activeRoute === '/(public)/cliente' && currentUser && (
              <ClienteMenuPage
                user={currentUser}
                canReturnHome={!isClientLockedToCatalog(currentUser)}
                onUserUpdated={(updatedUser) => setCurrentUser(updatedUser)}
                onOrderCreated={() => {
                  void fetchServerOrders()
                    .then((r) => {
                      if (r.orders?.length) setOrders(r.orders);
                    })
                    .catch(() => {});
                }}
                onNavigate={(route) => navigateWithGuard(route)}
                onLogout={handleLogout}
              />
            )}
          </Suspense>
        </ViewErrorBoundary>
      )}

      <WorkRoleModal
        open={showWorkModal}
        onClose={() => setShowWorkModal(false)}
        onChooseAgentApply={() => {
          setShowWorkModal(false);
          if (currentUser && currentUser.role !== 'repartidor') {
            setActiveRoute('/(portal)/postular-agente');
          } else {
            setLoginContext('postular_agente');
            setLoginError('');
            setLoginStatus('');
            setActiveRoute('/(auth)/login');
          }
        }}
        onChooseAgentEnter={() => {
          setShowWorkModal(false);
          if (currentUser && (currentUser.role === 'agente' || currentUser.role === 'superadmin')) {
            setActiveRoute('/(dashboards)/agente');
          } else {
            setLoginContext('entrar_agente');
            setLoginError('');
            setLoginStatus('');
            setActiveRoute('/(auth)/login');
          }
        }}
        onChooseDelivery={() => {
          setShowWorkModal(false);
          if (currentUser && currentUser.role === 'repartidor') {
            setActiveRoute('/(dashboards)/repartidor');
          } else if (currentUser) {
            setActiveRoute('/(portal)/postular-domicilio');
          } else {
            setLoginContext('postular_domicilio');
            setLoginError('');
            setLoginStatus('');
            setActiveRoute('/(auth)/login');
          }
        }}
        onChooseDeliveryEnter={() => {
          setShowWorkModal(false);
          if (currentUser && (currentUser.role === 'repartidor' || currentUser.role === 'superadmin')) {
            setActiveRoute('/(dashboards)/repartidor');
          } else {
            setLoginContext('entrar_domicilio');
            setLoginError('');
            setLoginStatus('');
            setActiveRoute('/(auth)/login');
          }
        }}
      />

      <ScrollToTopButton align={activeRoute === '/(public)/cliente' ? 'left' : 'right'} />
    </div>
  );
}
