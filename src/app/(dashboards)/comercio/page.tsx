'use client';

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  ArrowLeft,
  BarChart3,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  CreditCard,
  Crown,
  Download,
  Lock,
  LogOut,
  Megaphone,
  Palette,
  Plus,
  QrCode,
  Save,
  Search,
  Shield,
  Sparkles,
  Store,
  Trash2,
  Truck,
  Users,
  XCircle,
} from 'lucide-react';
import CompanyLogoMark from '@/src/components/cliente/CompanyLogoMark';
import LazyScrollSection from '@/src/components/LazyScrollSection';
import { SkeletonBlock } from '@/src/components/Skeletons';
import {
  createBusinessAd,
  createBusinessQr,
  createBusinessTeamMember,
  deleteBusinessQr,
  deleteBusinessTeamMember,
  fetchBusinessWorkspace,
  selectBusinessPlan,
  updateBusinessProfile,
  updateBusinessTeamMember,
} from '@/src/lib/vinchiClient';
import type {
  AuthUser,
  BusinessPermissions,
  BusinessPlanId,
  BusinessProfileSettings,
  BusinessWorkspaceState,
  ClientCompanyLogoIcon,
  OrderRecord,
  SaaSPlan,
  VinchiRoute,
} from '@/src/types/vinchi';

export interface OrderCardProps {
  order: OrderRecord;
  isSelected: boolean;
  onSelect: (orderId: string) => void;
}

const formatCop = (value: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);

const PAYMENT_METHODS = [
  { id: 'PSE', label: 'PSE · Transferencia bancaria' },
  { id: 'Nequi', label: 'Nequi · Pago móvil inmediato' },
  { id: 'Tarjeta', label: 'Tarjeta Crédito o Débito' },
  { id: 'Daviplata', label: 'Daviplata' },
] as const;

const LOGO_ICONS: { id: ClientCompanyLogoIcon; label: string }[] = [
  { id: 'store', label: 'Tienda' },
  { id: 'steak', label: 'Parrilla' },
  { id: 'burger', label: 'Burger' },
  { id: 'soup', label: 'Cocina' },
  { id: 'sushi', label: 'Oriental' },
  { id: 'coffee', label: 'Café' },
  { id: 'leaf', label: 'Saludable' },
  { id: 'cake', label: 'Repostería' },
  { id: 'flame', label: 'Brasa' },
  { id: 'utensils', label: 'Restaurante' },
];

const BANNER_TONES: { value: string; label: string; preview: string }[] = [
  {
    value: 'from-[#442c61] via-[#7c3aed] to-[#9c44dc]',
    label: 'Púrpura Real Vinchi',
    preview: 'bg-gradient-to-br from-[#442c61] via-[#7c3aed] to-[#9c44dc]',
  },
  {
    value: 'from-[#3b1d5e] via-[#6d28d9] to-[#a855f7]',
    label: 'Violeta Intenso',
    preview: 'bg-gradient-to-br from-[#3b1d5e] via-[#6d28d9] to-[#a855f7]',
  },
  {
    value: 'from-[#78350f] via-[#b45309] to-[#d97706]',
    label: 'Ámbar Dorado',
    preview: 'bg-gradient-to-br from-[#78350f] via-[#b45309] to-[#d97706]',
  },
  {
    value: 'from-[#064e3b] via-[#047857] to-[#10b981]',
    label: 'Verde Botánico',
    preview: 'bg-gradient-to-br from-[#064e3b] via-[#047857] to-[#10b981]',
  },
  {
    value: 'from-[#0f172a] via-[#1e293b] to-[#475569]',
    label: 'Carbón Elegante',
    preview: 'bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#475569]',
  },
];

const PERMISSION_LABELS: { key: keyof BusinessPermissions; label: string }[] = [
  { key: 'cobrarOrdenes', label: 'Cobrar órdenes' },
  { key: 'anularOrdenes', label: 'Anular órdenes' },
  { key: 'gestionarDomicilios', label: 'Gestionar domicilios' },
  { key: 'editarPerfilYMenu', label: 'Editar perfil y marca' },
  { key: 'verEstadisticas', label: 'Ver estadísticas' },
  { key: 'crearAnuncios', label: 'Publicar anuncios' },
  { key: 'crearQr', label: 'Crear códigos QR' },
  { key: 'gestionarEquipo', label: 'Gestionar permisos de equipo' },
];

const DEFAULT_PERMISSIONS: BusinessPermissions = {
  cobrarOrdenes: true,
  anularOrdenes: false,
  gestionarDomicilios: true,
  editarPerfilYMenu: false,
  verEstadisticas: true,
  crearAnuncios: false,
  crearQr: false,
  gestionarEquipo: false,
};

function OrderStatusTag({ estado }: { estado: OrderRecord['estado'] }) {
  if (estado === 'Anulada') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-[8px] bg-[#dc2626]/10 px-2.5 py-1 text-xs font-semibold text-[#991b1b]">
        <XCircle className="h-4 w-4 stroke-[2.25] text-[#dc2626]" aria-hidden="true" />
        <span>Anulada</span>
      </span>
    );
  }
  if (estado === 'Cobrada') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-[8px] bg-[#16a34a]/10 px-2.5 py-1 text-xs font-semibold text-[#166534]">
        <CheckCircle2 className="h-4 w-4 stroke-[2.25] text-[#16a34a]" aria-hidden="true" />
        <span>Cobrada</span>
      </span>
    );
  }
  if (estado === 'Lista para cobro') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-[8px] bg-[#bc8ae1]/18 px-2.5 py-1 text-xs font-semibold text-[#442c61]">
        <span className="h-2.5 w-2.5 rounded-full bg-[#9c44dc]" aria-hidden="true" />
        <span>Lista para cobro</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-[8px] bg-[#d97706]/12 px-2.5 py-1 text-xs font-semibold text-[#92400e]">
      <Clock className="h-4 w-4 stroke-[2.25] text-[#d97706]" aria-hidden="true" />
      <span>{estado}</span>
    </span>
  );
}

export function OrderCard({ order, isSelected, onSelect }: OrderCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(order.id)}
      className={`vinchi-transition w-full rounded-[24px] border p-5 text-left cursor-pointer shadow-[0_0_0_1px_rgba(68,44,97,0.08),0_2px_8px_0_rgba(68,44,97,0.08)] ${
        isSelected
          ? 'border-2 border-[#9c44dc] bg-[#faf5ff]'
          : 'border-[#bc8ae1]/60 bg-[#ffffff] hover:border-[#9c44dc] hover:bg-[#faf5ff]'
      }`}
    >
      <div className="flex items-baseline justify-between gap-4">
        <span className="font-mono tabular-nums text-base font-semibold text-[#442c61]">
          {order.codigo}
        </span>
        <span className="font-mono tabular-nums text-sm font-semibold text-[#0a0a0a]">
          {formatCop(order.totalCop)}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#543b6c]">
        <span className="font-medium text-[#0a0a0a]">{order.mesaOOrigen}</span>
        <span aria-hidden="true">·</span>
        <span>{order.clienteNombre}</span>
        <span aria-hidden="true">·</span>
        <span className="font-mono tabular-nums">{order.hora}</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <OrderStatusTag estado={order.estado} />
        {order.deliveryDetails && (
          <span className="inline-flex items-center gap-1 rounded-[7px] bg-[#f3e8ff] px-2 py-0.5 text-[11px] font-semibold text-[#442c61]">
            <Truck className="h-3.5 w-3.5 stroke-[2.2]" aria-hidden="true" />
            <span>{order.deliveryDetails.modoEntrega}</span>
          </span>
        )}
      </div>
    </button>
  );
}

type OrderFilter = 'all' | 'pending' | 'closed';
type WorkspaceTab = 'ordenes' | 'estadisticas' | 'perfil' | 'anuncios' | 'qr' | 'equipo';

const DEFAULT_PLANS: SaaSPlan[] = [
  {
    id: 'basico',
    name: 'Básico',
    priceCop: 0,
    annualPriceCop: 0,
    billingCycle: '/ mes',
    targetAudience: 'Inicio digital',
    description:
      'Perfil comercial gratuito para comenzar a recibir pedidos y organizar entregas sin costo mensual.',
    limits: ['0% comisión por orden', 'Gestión de domicilios y estadísticas', 'Edición de logotipo y descripción'],
    excluded: ['Anuncios destacados con pago único de $25.000 COP', 'Sin generación de códigos QR'],
  },
  {
    id: 'premium',
    name: 'Premium',
    priceCop: 60900,
    annualPriceCop: 669900,
    annualSavingsLabel: 'Ahorras $ 60.900 al año',
    billingCycle: 'COP / mes',
    targetAudience: 'Operación completa',
    badgeLabel: 'Más elegido',
    highlighted: true,
    description:
      'Control completo de domicilios, generación ilimitada de códigos QR en mesas y gestión de permisos del equipo.',
    limits: [
      '0% comisión por orden',
      'Códigos QR descargables para mesas y barra',
      'Control completo de equipo y domicilios',
    ],
  },
  {
    id: 'ultra',
    name: 'Ultra',
    priceCop: 185900,
    annualPriceCop: 1673100,
    annualSavingsLabel: '3 meses gratis · Ahorras $ 557.700',
    billingCycle: 'COP / mes',
    targetAudience: 'Experiencia total',
    badgeLabel: 'Anuncios incluidos',
    description:
      'Incluye todo lo de Premium más presencia prioritaria en Foro y publicación de anuncios sin pagos adicionales.',
    limits: [
      'Todo lo de Premium + Códigos QR ilimitados',
      'Publicación de anuncios incluida sin costo extra',
      'Sello dorado y posicionamiento en Catálogo y Foro',
    ],
  },
];

export interface ComercioPosPageProps {
  plans?: SaaSPlan[];
  user?: AuthUser | null;
  orders: OrderRecord[];
  selectedOrderId?: string;
  comercioNombre?: string;
  onUserUpdated?: (user: AuthUser) => void;
  onSelectOrder?: (orderId: string) => void;
  onCobrarOrder?: (orderId: string) => void;
  onAnularOrder?: (orderId: string) => void;
  onNavigate?: (route: VinchiRoute) => void;
  onLogout?: () => void;
}

export default function ComercioPosPage({
  plans = DEFAULT_PLANS,
  user,
  orders,
  selectedOrderId,
  comercioNombre = 'Mi Espacio Comercial',
  onUserUpdated,
  onSelectOrder,
  onCobrarOrder,
  onAnularOrder,
  onNavigate,
  onLogout,
}: ComercioPosPageProps) {
  const [workspace, setWorkspace] = useState<BusinessWorkspaceState | null>(null);
  const [isLoadingWs, setIsLoadingWs] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Plan selector & checkout states
  const [showPlanSelector, setShowPlanSelector] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'mensual' | 'anual'>('mensual');
  const [pendingPaidPlan, setPendingPaidPlan] = useState<SaaSPlan | null>(null);
  const [planPaymentMethod, setPlanPaymentMethod] = useState<string>('PSE');

  // Navigation & order states
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('ordenes');
  const [filter, setFilter] = useState<OrderFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Profile editor state
  const [profileForm, setProfileForm] = useState<BusinessProfileSettings>({
    negocioNombre: comercioNombre,
    descripcion: '',
    ciudad: 'Bogotá',
    barrio: 'Zona Activa',
    direccionLocal: '',
    tiempoEntregaMin: 25,
    costoDomicilioCop: 4000,
    logoIcon: 'store',
    bannerTone: BANNER_TONES[0].value,
    logoDataUrl: undefined,
  });

  // Ads creation & payment state
  const [adTitle, setAdTitle] = useState('');
  const [adMessage, setAdMessage] = useState('');
  const [showAdPayment, setShowAdPayment] = useState(false);
  const [adPaymentMethod, setAdPaymentMethod] = useState('Nequi');

  // QR generator state
  const [qrName, setQrName] = useState('');
  const [qrRef, setQrRef] = useState('');
  const [copiedQrId, setCopiedQrId] = useState('');

  // Team & permissions state
  const [memberName, setMemberName] = useState('');
  const [memberRole, setMemberRole] = useState('');
  const [memberPin, setMemberPin] = useState('');
  const [memberPerms, setMemberPerms] = useState<BusinessPermissions>(DEFAULT_PERMISSIONS);

  useEffect(() => {
    let mounted = true;
    setIsLoadingWs(true);
    fetchBusinessWorkspace()
      .then(({ workspace: ws }) => {
        if (!mounted) return;
        setWorkspace(ws);
        setProfileForm(ws.profile);
        setBillingCycle(ws.planBillingCycle);
      })
      .catch((err) => {
        if (!mounted) return;
        setErrorMsg(err instanceof Error ? err.message : 'No fue posible cargar tu espacio comercial.');
      })
      .finally(() => {
        if (mounted) setIsLoadingWs(false);
      });
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  const clearFeedback = () => {
    setStatusMsg('');
    setErrorMsg('');
  };

  const handleChooseFreePlan = async () => {
    clearFeedback();
    setIsBusy(true);
    try {
      const res = await selectBusinessPlan({
        planId: 'basico',
        billingCycle,
      });
      setWorkspace(res.workspace);
      setShowPlanSelector(false);
      setPendingPaidPlan(null);
      setStatusMsg(res.message);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo activar el plan gratuito.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleConfirmPaidPlan = async (e: FormEvent) => {
    e.preventDefault();
    if (!pendingPaidPlan) return;
    clearFeedback();
    setIsBusy(true);
    try {
      const res = await selectBusinessPlan({
        planId: pendingPaidPlan.id,
        billingCycle,
        paymentMethod: planPaymentMethod,
      });
      setWorkspace(res.workspace);
      setPendingPaidPlan(null);
      setShowPlanSelector(false);
      setStatusMsg(res.message);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No fue posible procesar el pago del plan.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1_500_000) {
      setErrorMsg('El logotipo no debe superar 1.5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (result) {
        setProfileForm((prev) => ({ ...prev, logoDataUrl: result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    clearFeedback();
    setIsBusy(true);
    try {
      const res = await updateBusinessProfile(profileForm);
      setWorkspace(res.workspace);
      setProfileForm(res.workspace.profile);
      onUserUpdated?.(res.user);
      setStatusMsg(res.message);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo actualizar el perfil.');
    } finally {
      setIsBusy(false);
    }
  };

  const handlePublishAdSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearFeedback();
    if (adTitle.trim().length < 3 || adMessage.trim().length < 8) {
      setErrorMsg('Completa el título y el mensaje promocional de tu anuncio.');
      return;
    }
    if (workspace?.plan !== 'ultra' && !showAdPayment) {
      setShowAdPayment(true);
      return;
    }
    setIsBusy(true);
    try {
      const res = await createBusinessAd({
        titulo: adTitle.trim(),
        mensaje: adMessage.trim(),
        paymentMethod: workspace?.plan === 'ultra' ? 'Incluido en Ultra' : adPaymentMethod,
      });
      setWorkspace(res.workspace);
      setAdTitle('');
      setAdMessage('');
      setShowAdPayment(false);
      setStatusMsg(res.message);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo publicar el anuncio.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleCreateQr = async (e: FormEvent) => {
    e.preventDefault();
    clearFeedback();
    setIsBusy(true);
    try {
      const res = await createBusinessQr({
        nombre: qrName.trim(),
        mesaORef: qrRef.trim(),
      });
      setWorkspace(res.workspace);
      setQrName('');
      setQrRef('');
      setStatusMsg(res.message);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo generar el código QR.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleDeleteQr = async (qrId: string) => {
    clearFeedback();
    setIsBusy(true);
    try {
      const res = await deleteBusinessQr(qrId);
      setWorkspace(res.workspace);
      setStatusMsg(res.message);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo eliminar el QR.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleCreateTeamMember = async (e: FormEvent) => {
    e.preventDefault();
    clearFeedback();
    setIsBusy(true);
    try {
      const res = await createBusinessTeamMember({
        nombre: memberName.trim(),
        cargo: memberRole.trim(),
        pinAcceso: memberPin.trim(),
        permisos: memberPerms,
      });
      setWorkspace(res.workspace);
      setMemberName('');
      setMemberRole('');
      setMemberPin('');
      setMemberPerms(DEFAULT_PERMISSIONS);
      setStatusMsg(res.message);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo agregar al colaborador.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleToggleMemberPermission = async (
    memberId: string,
    key: keyof BusinessPermissions,
    currentVal: boolean
  ) => {
    clearFeedback();
    try {
      const res = await updateBusinessTeamMember(memberId, {
        permisos: { [key]: !currentVal },
      });
      setWorkspace(res.workspace);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error actualizando permisos.');
    }
  };

  const handleToggleMemberActive = async (memberId: string, currentActive: boolean) => {
    clearFeedback();
    try {
      const res = await updateBusinessTeamMember(memberId, {
        activo: !currentActive,
      });
      setWorkspace(res.workspace);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error cambiando estado del colaborador.');
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    clearFeedback();
    try {
      const res = await deleteBusinessTeamMember(memberId);
      setWorkspace(res.workspace);
      setStatusMsg(res.message);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo eliminar el colaborador.');
    }
  };

  const displayName = workspace?.profile.negocioNombre || user?.negocioNombre || comercioNombre;
  const initials =
    displayName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() || '')
      .join('') || 'VN';

  // Statistics derived from real orders
  const stats = useMemo(() => {
    const cobradas = orders.filter((o) => o.estado === 'Cobrada');
    const pendientes = orders.filter((o) => o.estado !== 'Cobrada' && o.estado !== 'Anulada');
    const anuladas = orders.filter((o) => o.estado === 'Anulada');
    const totalCobradoCop = cobradas.reduce((s, o) => s + o.totalCop, 0);
    const totalProyectadoCop = orders
      .filter((o) => o.estado !== 'Anulada')
      .reduce((s, o) => s + o.totalCop, 0);
    const ticketPromedioCop =
      cobradas.length > 0 ? Math.round(totalCobradoCop / cobradas.length) : 0;
    const deliveryCount = orders.filter(
      (o) =>
        Boolean(o.deliveryDetails) || o.mesaOOrigen.toLowerCase().includes('domicilio')
    ).length;
    const pickupOrTableCount = orders.length - deliveryCount;
    const ahorroComisionCop = Math.round(totalProyectadoCop * 0.28);

    const productCounts = new Map<string, { nombre: string; qty: number; ingresos: number }>();
    for (const o of orders) {
      if (o.estado === 'Anulada') continue;
      for (const item of o.items) {
        const cur = productCounts.get(item.nombre) ?? {
          nombre: item.nombre,
          qty: 0,
          ingresos: 0,
        };
        cur.qty += item.cantidad;
        cur.ingresos += item.cantidad * item.precioUnitarioCop;
        productCounts.set(item.nombre, cur);
      }
    }
    const topProducts = Array.from(productCounts.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    return {
      totalCobradoCop,
      totalProyectadoCop,
      ticketPromedioCop,
      cobradasCount: cobradas.length,
      pendientesCount: pendientes.length,
      anuladasCount: anuladas.length,
      deliveryCount,
      pickupOrTableCount,
      ahorroComisionCop,
      topProducts,
    };
  }, [orders]);

  const pendingCount = orders.filter(
    (o) => o.estado !== 'Cobrada' && o.estado !== 'Anulada'
  ).length;
  const closedCount = orders.length - pendingCount;
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredOrders = orders.filter((order) => {
    const isClosed = order.estado === 'Cobrada' || order.estado === 'Anulada';
    if (filter === 'pending' && isClosed) return false;
    if (filter === 'closed' && !isClosed) return false;
    if (!normalizedQuery) return true;
    return (
      order.codigo.toLowerCase().includes(normalizedQuery) ||
      order.clienteNombre.toLowerCase().includes(normalizedQuery) ||
      order.mesaOOrigen.toLowerCase().includes(normalizedQuery)
    );
  });

  const selectedOrder =
    filteredOrders.find((order) => order.id === selectedOrderId) ??
    filteredOrders[0] ??
    null;

  const isActionable =
    selectedOrder !== null &&
    selectedOrder.estado !== 'Cobrada' &&
    selectedOrder.estado !== 'Anulada';

  const filterTabs: { id: OrderFilter; label: string; count: number }[] = [
    { id: 'all', label: 'Todas', count: orders.length },
    { id: 'pending', label: 'Por cobrar', count: pendingCount },
    { id: 'closed', label: 'Finalizadas', count: closedCount },
  ];

  const activePlanLabel: Record<BusinessPlanId, string> = {
    basico: 'Básico Gratis',
    premium: 'Premium',
    ultra: 'Ultra',
  };

  if (isLoadingWs) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f3e8ff]/75 via-[#faf5ff] to-[#f4ecfb] p-6">
        <div className="mx-auto max-w-[1280px] space-y-5">
          <SkeletonBlock className="h-24 w-full rounded-[24px]" />
          <div className="grid gap-5 md:grid-cols-3">
            <SkeletonBlock className="h-72 w-full rounded-[24px]" />
            <SkeletonBlock className="h-72 w-full rounded-[24px]" />
            <SkeletonBlock className="h-72 w-full rounded-[24px]" />
          </div>
        </div>
      </div>
    );
  }

  // Pantalla de selección de los 3 planes antes de iniciar (o al elegir cambiar plan)
  if (!workspace?.planSelected || showPlanSelector) {
    const selectedPaidPrice = pendingPaidPlan
      ? billingCycle === 'anual'
        ? pendingPaidPlan.annualPriceCop ?? pendingPaidPlan.priceCop * 12
        : pendingPaidPlan.priceCop
      : 0;

    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f3e8ff]/80 via-[#faf5ff] to-[#f4ecfb] text-[#0a0a0a]">
        <header className="border-b-2 border-[#543b6c] bg-[#442c61] px-4 py-4 text-[#ffffff] sm:px-6">
          <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => {
                  if (workspace?.planSelected) {
                    setShowPlanSelector(false);
                    setPendingPaidPlan(null);
                  } else {
                    onNavigate?.('/(public)');
                  }
                }}
                className="vinchi-transition inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] border border-[#bc8ae1]/40 bg-[#ffffff]/14 text-[#ffffff] hover:bg-[#9c44dc] cursor-pointer"
                aria-label="Volver"
              >
                <ArrowLeft className="h-5 w-5 stroke-[2.25]" aria-hidden="true" />
              </button>
              <div className="min-w-0">
                <p className="text-xs font-medium text-[#e9d5ff]">
                  Empresario · Selección inicial de plan
                </p>
                <h1 className="truncate font-display text-xl font-semibold text-[#ffffff] sm:text-2xl">
                  {displayName}
                </h1>
              </div>
            </div>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="vinchi-transition inline-flex min-h-[42px] items-center gap-2 rounded-[14px] border border-[#bc8ae1]/45 bg-[#ffffff]/12 px-4 text-xs font-semibold text-[#ffffff] hover:bg-[#ffffff]/20 cursor-pointer"
              >
                <LogOut className="h-4.5 w-4.5 stroke-[2.2]" aria-hidden="true" />
                <span>Cerrar sesión</span>
              </button>
            )}
          </div>
        </header>

        <main className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 sm:py-12">
          {errorMsg && (
            <div className="mb-6 rounded-[16px] border border-[#dc2626]/35 bg-[#dc2626]/10 px-4 py-3 text-xs font-medium text-[#991b1b]">
              {errorMsg}
            </div>
          )}

          {pendingPaidPlan ? (
            <section className="mx-auto max-w-xl rounded-[28px] border-2 border-[#9c44dc]/70 bg-[#ffffff] p-6 shadow-lg sm:p-8">
              <button
                type="button"
                onClick={() => setPendingPaidPlan(null)}
                className="inline-flex items-center gap-2 text-xs font-semibold text-[#543b6c] hover:text-[#442c61] cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4 stroke-[2.2]" aria-hidden="true" />
                <span>Volver a los 3 planes</span>
              </button>

              <div className="mt-4 flex items-start justify-between gap-4 border-b border-[#e9d5ff] pb-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-[8px] bg-[#f3e8ff] px-2.5 py-1 text-[11px] font-bold text-[#442c61]">
                    <Crown className="h-3.5 w-3.5 stroke-[2.2] text-[#9c44dc]" aria-hidden="true" />
                    <span>Plan {pendingPaidPlan.name}</span>
                  </span>
                  <h2 className="mt-2 font-display text-2xl font-bold text-[#442c61]">
                    Método de pago
                  </h2>
                  <p className="mt-1 text-xs text-[#543b6c]">
                    Al confirmar el pago recibirás acceso inmediato con tu licencia {pendingPaidPlan.name} ({billingCycle}).
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[11px] text-[#543b6c]">Total a pagar</p>
                  <p className="font-mono text-2xl font-bold text-[#9c44dc]">
                    {formatCop(selectedPaidPrice)}
                  </p>
                </div>
              </div>

              <form onSubmit={handleConfirmPaidPlan} className="mt-5 space-y-4">
                <div className="space-y-2.5">
                  <p className="text-xs font-semibold text-[#442c61]">
                    Elige tu método de pago:
                  </p>
                  {PAYMENT_METHODS.map((pm) => {
                    const active = planPaymentMethod === pm.id;
                    return (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => setPlanPaymentMethod(pm.id)}
                        className={`vinchi-transition flex w-full items-center justify-between rounded-[16px] border px-4 py-3.5 text-left text-xs font-semibold cursor-pointer ${
                          active
                            ? 'border-2 border-[#9c44dc] bg-[#faf5ff] text-[#442c61]'
                            : 'border-[#e5e5e5] bg-[#ffffff] text-[#543b6c] hover:border-[#bc8ae1]'
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <CreditCard className="h-4.5 w-4.5 stroke-[2.2] text-[#9c44dc]" aria-hidden="true" />
                          <span>{pm.label}</span>
                        </span>
                        {active && <CheckCircle2 className="h-5 w-5 text-[#16a34a]" aria-hidden="true" />}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="submit"
                  disabled={isBusy}
                  className="vinchi-transition inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[18px] bg-[#9c44dc] px-6 text-sm font-semibold text-[#ffffff] shadow-sm hover:bg-[#543b6c] disabled:opacity-50 cursor-pointer"
                >
                  <CheckCircle2 className="h-5 w-5 stroke-[2.25]" aria-hidden="true" />
                  <span>
                    {isBusy
                      ? 'Confirmando pago...'
                      : `Pagar ${formatCop(selectedPaidPrice)} y activar ${pendingPaidPlan.name}`}
                  </span>
                </button>
              </form>
            </section>
          ) : (
            <section>
              <div className="text-center max-w-2xl mx-auto">
                <span className="inline-flex items-center gap-2 rounded-[10px] border border-[#bc8ae1]/60 bg-[#ffffff] px-3.5 py-1.5 text-xs font-semibold text-[#442c61]">
                  <Sparkles className="h-4 w-4 text-[#9c44dc]" aria-hidden="true" />
                  <span>Tu perfil inicia gratis · Elige cómo empezar</span>
                </span>
                <h2 className="mt-4 font-display text-3xl font-bold tracking-[-0.03em] text-[#442c61]">
                  Elige el plan de tu empresa antes de ingresar
                </h2>
                <p className="mt-2 text-sm text-[#543b6c]">
                  Si eliges Básico Gratis entras directo a tu espacio privado. Si prefieres Premium o Ultra, completas el método de pago y recibes el plan elegido al instante.
                </p>

                <div className="mt-6 inline-flex items-center rounded-[16px] border border-[#bc8ae1]/60 bg-[#ffffff] p-1">
                  <button
                    type="button"
                    onClick={() => setBillingCycle('mensual')}
                    className={`rounded-[12px] px-4 py-2 text-xs font-semibold cursor-pointer ${
                      billingCycle === 'mensual'
                        ? 'bg-[#442c61] text-[#ffffff]'
                        : 'text-[#543b6c] hover:text-[#442c61]'
                    }`}
                  >
                    Mensual
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingCycle('anual')}
                    className={`rounded-[12px] px-4 py-2 text-xs font-semibold cursor-pointer ${
                      billingCycle === 'anual'
                        ? 'bg-[#442c61] text-[#ffffff]'
                        : 'text-[#543b6c] hover:text-[#442c61]'
                    }`}
                  >
                    Anual (con ahorro)
                  </button>
                </div>
              </div>

              <div className="mt-8 grid gap-6 lg:grid-cols-3">
                {plans.map((plan) => {
                  const isFree = plan.id === 'basico';
                  const isUltra = plan.id === 'ultra';
                  const price =
                    billingCycle === 'anual'
                      ? plan.annualPriceCop ?? plan.priceCop * 12
                      : plan.priceCop;

                  return (
                    <article
                      key={plan.id}
                      className={`flex flex-col justify-between rounded-[26px] border-2 bg-[#ffffff] p-6 shadow-sm ${
                        isUltra
                          ? 'border-[#442c61] bg-gradient-to-b from-[#ffffff] to-[#faf5ff]'
                          : plan.highlighted
                            ? 'border-[#9c44dc]'
                            : 'border-[#d8c2ef]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-display text-2xl font-bold text-[#442c61]">
                            {plan.name}
                          </h3>
                          {plan.badgeLabel && (
                            <span className="rounded-[8px] bg-[#9c44dc] px-2.5 py-1 text-[11px] font-bold text-[#ffffff]">
                              {plan.badgeLabel}
                            </span>
                          )}
                        </div>

                        <p className="mt-2 text-xs text-[#543b6c]">{plan.description}</p>

                        <div className="mt-5 flex items-baseline gap-1.5">
                          <span className="font-mono text-3xl font-bold text-[#0a0a0a]">
                            {isFree ? '$0 COP' : formatCop(price)}
                          </span>
                          <span className="text-xs text-[#543b6c]">
                            {isFree ? 'Gratis para siempre' : billingCycle === 'anual' ? '/ año' : '/ mes'}
                          </span>
                        </div>

                        <ul className="mt-5 space-y-2.5 text-xs text-[#442c61]">
                          <li className="flex items-start gap-2">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#16a34a]" aria-hidden="true" />
                            <span>Manejo de domicilios, órdenes y estadísticas</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#16a34a]" aria-hidden="true" />
                            <span>Edición de logotipo y descripción comercial</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#16a34a]" aria-hidden="true" />
                            <span>Gestión de permisos para colaboradores</span>
                          </li>
                          <li className="flex items-start gap-2">
                            {isFree ? (
                              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-[#9c645c]" aria-hidden="true" />
                            ) : (
                              <QrCode className="mt-0.5 h-4 w-4 shrink-0 text-[#9c44dc]" aria-hidden="true" />
                            )}
                            <span className={isFree ? 'text-[#9c645c]' : 'font-semibold'}>
                              {isFree ? 'Sin generación de códigos QR' : 'Generación de códigos QR ilimitados'}
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Megaphone
                              className={`mt-0.5 h-4 w-4 shrink-0 ${
                                isUltra ? 'text-[#d97706]' : 'text-[#543b6c]'
                              }`}
                              aria-hidden="true"
                            />
                            <span className={isUltra ? 'font-bold text-[#442c61]' : ''}>
                              {isUltra
                                ? 'Crear anuncios incluido ($0 extra)'
                                : 'Crear anuncios ($25.000 COP por campaña)'}
                            </span>
                          </li>
                        </ul>
                      </div>

                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => {
                          if (isFree) {
                            void handleChooseFreePlan();
                          } else {
                            setPendingPaidPlan(plan);
                          }
                        }}
                        className={`vinchi-transition mt-6 inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-[16px] px-5 text-xs font-semibold cursor-pointer ${
                          isFree
                            ? 'border-2 border-[#9c44dc] bg-[#faf5ff] text-[#442c61] hover:bg-[#9c44dc] hover:text-[#ffffff]'
                            : 'bg-[#9c44dc] text-[#ffffff] hover:bg-[#543b6c]'
                        }`}
                      >
                        <span>
                          {isFree ? 'Continuar con Básico Gratis' : `Elegir ${plan.name} e ir al pago`}
                        </span>
                        <ChevronRight className="h-4 w-4 stroke-[2.25]" aria-hidden="true" />
                      </button>
                    </article>
                  );
                })}
              </div>
            </section>
          )}
        </main>
      </div>
    );
  }

  const workspaceTabs: { id: WorkspaceTab; label: string; icon: typeof Store }[] = [
    { id: 'ordenes', label: 'Órdenes y Domicilios', icon: Truck },
    { id: 'estadisticas', label: 'Estadísticas', icon: BarChart3 },
    { id: 'perfil', label: 'Logo y Perfil', icon: Palette },
    { id: 'anuncios', label: 'Anuncios', icon: Megaphone },
    { id: 'qr', label: 'Códigos QR', icon: QrCode },
    { id: 'equipo', label: 'Permisos y Equipo', icon: Users },
  ];

  const isBasicPlan = workspace.plan === 'basico';
  const isUltraPlan = workspace.plan === 'ultra';

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f3e8ff]/75 via-[#faf5ff] to-[#f4ecfb] text-[#0a0a0a]">
      <header className="border-b-2 border-[#543b6c] bg-[#442c61] px-4 py-4 text-[#ffffff] sm:px-6">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0 sm:gap-4">
            <button
              type="button"
              onClick={() => onNavigate?.('/(public)')}
              className="vinchi-transition inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] border border-[#bc8ae1]/40 bg-[#ffffff]/14 text-[#ffffff] hover:bg-[#9c44dc] cursor-pointer"
              aria-label="Volver al inicio"
            >
              <ArrowLeft className="h-5 w-5 stroke-[2.25]" aria-hidden="true" />
            </button>

            <CompanyLogoMark
              initials={initials}
              name={displayName}
              bannerTone={workspace.profile.bannerTone}
              logoIcon={workspace.profile.logoIcon}
              logoDataUrl={workspace.profile.logoDataUrl}
              size="md"
            />

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#e9d5ff]">
                <span>Espacio Privado Empresario</span>
                <span className="inline-flex items-center gap-1 rounded-[7px] bg-[#9c44dc] px-2 py-0.5 text-[11px] font-bold text-[#ffffff]">
                  {isUltraPlan && <Crown className="h-3.5 w-3.5 text-[#fde68a]" aria-hidden="true" />}
                  <span>Plan {activePlanLabel[workspace.plan]}</span>
                </span>
              </div>
              <h1 className="truncate font-display text-xl font-semibold tracking-[-0.025em] text-[#ffffff] sm:text-2xl">
                {displayName}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                clearFeedback();
                setShowPlanSelector(true);
              }}
              className="vinchi-transition inline-flex min-h-[42px] items-center gap-2 rounded-[14px] border border-[#bc8ae1]/55 bg-[#ffffff]/14 px-4 text-xs font-semibold text-[#ffffff] hover:bg-[#9c44dc] cursor-pointer"
            >
              <Crown className="h-4 w-4 text-[#fde68a]" aria-hidden="true" />
              <span>Cambiar plan</span>
            </button>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="vinchi-transition inline-flex min-h-[42px] items-center gap-2 rounded-[14px] border border-[#bc8ae1]/45 bg-[#ffffff]/10 px-4 text-xs font-semibold text-[#ffffff] hover:bg-[#ffffff]/20 cursor-pointer"
              >
                <LogOut className="h-4.5 w-4.5 stroke-[2.2]" aria-hidden="true" />
                <span>Cerrar sesión</span>
              </button>
            )}
          </div>
        </div>

        {/* Pestañas privadas del Empresario */}
        <nav
          aria-label="Herramientas privadas del empresario"
          className="mx-auto mt-4 flex max-w-[1280px] flex-wrap gap-2 border-t border-[#bc8ae1]/25 pt-3.5"
        >
          {workspaceTabs.map((tab) => {
            const Icon = tab.icon;
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  clearFeedback();
                  setActiveTab(tab.id);
                }}
                className={`vinchi-transition inline-flex min-h-[42px] items-center gap-2 rounded-[14px] px-4 py-2 text-xs font-semibold cursor-pointer ${
                  selected
                    ? 'bg-[#9c44dc] text-[#ffffff] shadow-[0_6px_16px_-6px_rgba(156,68,220,0.7)]'
                    : 'border border-[#bc8ae1]/40 bg-[#ffffff]/10 text-[#f3e8ff] hover:bg-[#ffffff]/20'
                }`}
              >
                <Icon className="h-4.5 w-4.5 stroke-[2.25]" aria-hidden="true" />
                <span>{tab.label}</span>
                {tab.id === 'qr' && isBasicPlan && (
                  <Lock className="h-3.5 w-3.5 text-[#fde68a]" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-[1280px] px-4 py-6 space-y-5 sm:px-6 sm:py-8">
        {statusMsg && (
          <div
            role="status"
            className="flex items-center gap-2 rounded-[16px] border border-[#16a34a]/35 bg-[#16a34a]/10 px-4 py-3 text-xs font-semibold text-[#166534]"
          >
            <CheckCircle2 className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
            <span>{statusMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-[16px] border border-[#dc2626]/35 bg-[#dc2626]/10 px-4 py-3 text-xs font-semibold text-[#991b1b]"
          >
            <XCircle className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* TAB 1: ÓRDENES Y DOMICILIOS */}
        {activeTab === 'ordenes' && (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div role="tablist" aria-label="Filtrar órdenes" className="flex flex-wrap items-center gap-2.5">
                {filterTabs.map((tab) => {
                  const isActive = filter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      role="tab"
                      type="button"
                      aria-selected={isActive}
                      onClick={() => setFilter(tab.id)}
                      className={`vinchi-transition inline-flex min-h-[44px] items-center gap-2.5 rounded-[18px] px-5 py-2.5 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
                        isActive
                          ? 'bg-[#9c44dc] text-[#ffffff] shadow-[0_6px_16px_-6px_rgba(156,68,220,0.65)]'
                          : 'border border-[#bc8ae1]/60 bg-[#ffffff] text-[#442c61] hover:border-[#9c44dc] hover:bg-[#faf5ff]'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={`font-mono tabular-nums text-xs font-semibold ${
                          isActive ? 'text-[#f3e8ff]' : 'text-[#543b6c]'
                        }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="relative w-full sm:max-w-xs">
                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9c44dc]"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  aria-label="Buscar orden por código, mesa o cliente"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar código, mesa o cliente..."
                  className="h-11 w-full rounded-[18px] border border-[#bc8ae1]/70 bg-[#ffffff] pl-11 pr-4 text-sm text-[#0a0a0a] placeholder:text-[#6b5a82] focus:border-[#9c44dc] focus:outline-none"
                />
              </div>
            </div>

            <LazyScrollSection
              eager
              hydrationDelayMs={140}
              skeleton={<SkeletonBlock className="h-80 w-full rounded-[24px]" />}
            >
              <div className="grid gap-6 lg:grid-cols-12">
                <section aria-label="Lista de órdenes" className="space-y-3 lg:col-span-5">
                  {filteredOrders.length === 0 ? (
                    <div className="blueprint-card p-8 text-center">
                      <p className="text-sm font-medium text-[#0a0a0a]">
                        Sin órdenes en esta categoría.
                      </p>
                      <p className="mt-1 text-xs text-[#543b6c]">
                        Los pedidos de domicilio o recogida aparecerán aquí al instante.
                      </p>
                    </div>
                  ) : (
                    filteredOrders.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        isSelected={selectedOrder?.id === order.id}
                        onSelect={(id) => onSelectOrder?.(id)}
                      />
                    ))
                  )}
                </section>

                <section aria-label="Detalle de la orden" className="lg:col-span-7">
                  {selectedOrder ? (
                    <div className="blueprint-card flex h-full flex-col justify-between p-5 sm:p-8">
                      <div>
                        <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-[#d8c2ef] pb-5 sm:pb-6">
                          <div>
                            <p className="text-xs text-[#543b6c]">
                              {selectedOrder.mesaOOrigen} · {selectedOrder.hora}
                            </p>
                            <h2 className="mt-1 font-mono tabular-nums text-2xl font-semibold tracking-[-0.025em] text-[#442c61]">
                              Orden {selectedOrder.codigo}
                            </h2>
                            <p className="mt-1 text-sm text-[#543b6c]">
                              Cliente:{' '}
                              <span className="font-medium text-[#0a0a0a]">
                                {selectedOrder.clienteNombre}
                              </span>
                            </p>
                          </div>

                          <div className="text-left sm:text-right">
                            <p className="text-xs font-medium text-[#543b6c]">Estado actual</p>
                            <div className="mt-1.5">
                              <OrderStatusTag estado={selectedOrder.estado} />
                            </div>
                          </div>
                        </div>

                        <div className="mt-6">
                          <h3 className="text-xs font-medium text-[#543b6c]">
                            Detalle de productos
                          </h3>
                          <ul className="mt-4 divide-y divide-[#d8c2ef]/70">
                            {selectedOrder.items.map((item) => (
                              <li
                                key={item.id}
                                className="flex items-center justify-between gap-4 py-3.5 text-sm"
                              >
                                <div className="flex items-baseline gap-3 min-w-0">
                                  <span className="font-mono tabular-nums font-semibold text-[#9c44dc] shrink-0">
                                    {item.cantidad}x
                                  </span>
                                  <span className="font-medium text-[#0a0a0a] truncate">
                                    {item.nombre}
                                  </span>
                                </div>
                                <span className="font-mono tabular-nums text-[#543b6c] shrink-0">
                                  {formatCop(item.cantidad * item.precioUnitarioCop)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {selectedOrder.deliveryDetails && (
                          <div className="mt-5 rounded-[16px] border border-[#bc8ae1]/60 bg-[#faf5ff] p-4 text-xs space-y-1">
                            <p className="font-semibold text-[#442c61]">
                              Dirección y entrega de domicilio
                            </p>
                            <p className="text-[#0a0a0a]">
                              <strong>{selectedOrder.deliveryDetails.etiqueta}:</strong>{' '}
                              {selectedOrder.deliveryDetails.nombreLugar}
                            </p>
                            {selectedOrder.deliveryDetails.esConjuntoPrivado ? (
                              <p className="text-[#543b6c]">
                                Conjunto privado{' '}
                                <strong>{selectedOrder.deliveryDetails.nombreConjunto}</strong> · Apto{' '}
                                <strong>{selectedOrder.deliveryDetails.apartamento}</strong>
                              </p>
                            ) : (
                              <p className="text-[#543b6c]">
                                Dirección: {selectedOrder.deliveryDetails.direccion}
                              </p>
                            )}
                            <p className="font-semibold text-[#9c44dc]">
                              Modalidad: {selectedOrder.deliveryDetails.modoEntrega}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="mt-8 border-t border-[#d8c2ef] pt-5">
                        <div className="flex items-center justify-between text-xs text-[#543b6c]">
                          <span>Comisión Vinchi</span>
                          <span className="font-mono tabular-nums font-medium text-[#166534]">
                            $0 COP (0%)
                          </span>
                        </div>
                        <div className="mt-2.5 flex items-baseline justify-between">
                          <span className="text-sm font-medium text-[#543b6c]">
                            Total neto para el negocio
                          </span>
                          <span className="font-mono tabular-nums text-2xl font-semibold tracking-[-0.025em] text-[#442c61] sm:text-3xl">
                            {formatCop(selectedOrder.totalCop)}
                          </span>
                        </div>

                        {!isActionable && (
                          <p
                            role="status"
                            className="mt-4 rounded-[10px] border border-[#bc8ae1]/60 bg-[#faf5ff] px-4 py-2.5 text-xs font-medium text-[#442c61]"
                          >
                            {selectedOrder.estado === 'Cobrada'
                              ? 'Orden cobrada y conciliada sin descuentos de comisión.'
                              : 'Esta orden fue anulada.'}
                          </p>
                        )}

                        <div className="mt-5 grid gap-3 sm:grid-cols-2">
                          <button
                            type="button"
                            disabled={!isActionable}
                            onClick={() => onCobrarOrder?.(selectedOrder.id)}
                            className="vinchi-transition inline-flex min-h-[48px] items-center justify-center gap-2.5 rounded-[18px] bg-[#9c44dc] px-6 text-sm font-semibold text-[#ffffff] hover:bg-[#543b6c] disabled:opacity-40 whitespace-nowrap shrink-0 cursor-pointer disabled:cursor-not-allowed"
                          >
                            <CheckCircle2 className="h-5 w-5 stroke-[2.25]" aria-hidden="true" />
                            <span>{selectedOrder.estado === 'Cobrada' ? 'Cobrada' : 'Cobrar'}</span>
                          </button>

                          <button
                            type="button"
                            disabled={!isActionable}
                            onClick={() => onAnularOrder?.(selectedOrder.id)}
                            className="vinchi-transition inline-flex min-h-[48px] items-center justify-center gap-2.5 rounded-[18px] bg-[#9c645c] px-6 text-sm font-semibold text-[#ffffff] hover:bg-[#7f4d46] disabled:opacity-40 whitespace-nowrap shrink-0 cursor-pointer disabled:cursor-not-allowed"
                          >
                            <XCircle className="h-5 w-5 stroke-[2.25]" aria-hidden="true" />
                            <span>{selectedOrder.estado === 'Anulada' ? 'Anulada' : 'Anular'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="blueprint-card flex min-h-[320px] items-center justify-center p-8 text-center">
                      <p className="text-sm text-[#543b6c]">
                        Selecciona una orden para gestionar el cobro y domicilio.
                      </p>
                    </div>
                  )}
                </section>
              </div>
            </LazyScrollSection>
          </>
        )}

        {/* TAB 2: ESTADÍSTICAS */}
        {activeTab === 'estadisticas' && (
          <section className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="blueprint-card p-5">
                <p className="text-xs font-medium text-[#543b6c]">Ingresos cobrados</p>
                <p className="mt-2 font-mono text-2xl font-bold text-[#442c61]">
                  {formatCop(stats.totalCobradoCop)}
                </p>
                <p className="mt-1 text-[11px] text-[#166534]">
                  {stats.cobradasCount} órdenes conciliadas
                </p>
              </div>
              <div className="blueprint-card p-5">
                <p className="text-xs font-medium text-[#543b6c]">Ticket promedio</p>
                <p className="mt-2 font-mono text-2xl font-bold text-[#442c61]">
                  {formatCop(stats.ticketPromedioCop)}
                </p>
                <p className="mt-1 text-[11px] text-[#543b6c]">
                  {stats.pendientesCount} por cobrar ahora
                </p>
              </div>
              <div className="blueprint-card p-5">
                <p className="text-xs font-medium text-[#543b6c]">Domicilios vs Local</p>
                <p className="mt-2 font-mono text-2xl font-bold text-[#442c61]">
                  {stats.deliveryCount} / {stats.pickupOrTableCount}
                </p>
                <p className="mt-1 text-[11px] text-[#543b6c]">
                  A domicilio vs recogida o mesa
                </p>
              </div>
              <div className="blueprint-card border-2 border-[#16a34a]/40 bg-[#f0fdf4] p-5">
                <p className="text-xs font-medium text-[#166534]">Ahorro por 0% comisión</p>
                <p className="mt-2 font-mono text-2xl font-bold text-[#166534]">
                  {formatCop(stats.ahorroComisionCop)}
                </p>
                <p className="mt-1 text-[11px] text-[#166534]">
                  Frente a intermediarios del 28%
                </p>
              </div>
            </div>

            <div className="blueprint-card p-6">
              <h2 className="font-display text-lg font-semibold text-[#442c61]">
                Productos con mayor salida
              </h2>
              {stats.topProducts.length === 0 ? (
                <p className="mt-3 text-xs text-[#543b6c]">
                  Aún no hay ventas registradas en este periodo.
                </p>
              ) : (
                <ul className="mt-4 divide-y divide-[#e9d5ff]">
                  {stats.topProducts.map((p) => (
                    <li
                      key={p.nombre}
                      className="flex items-center justify-between gap-4 py-3 text-sm"
                    >
                      <span className="font-medium text-[#0a0a0a]">{p.nombre}</span>
                      <div className="flex items-center gap-4 font-mono text-xs">
                        <span className="rounded-[8px] bg-[#f3e8ff] px-2.5 py-1 font-bold text-[#442c61]">
                          {p.qty} uds
                        </span>
                        <span className="font-semibold text-[#543b6c]">
                          {formatCop(p.ingresos)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}

        {/* TAB 3: LOGO Y PERFIL DE EMPRESA */}
        {activeTab === 'perfil' && (
          <section className="blueprint-card p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e9d5ff] pb-5">
              <div>
                <h2 className="font-display text-xl font-bold text-[#442c61]">
                  Logotipo y descripción pública
                </h2>
                <p className="mt-1 text-xs text-[#543b6c]">
                  Los cambios se reflejan de inmediato en el Catálogo y en el Foro para tus compradores.
                </p>
              </div>
              <CompanyLogoMark
                initials={initials}
                name={profileForm.negocioNombre || displayName}
                bannerTone={profileForm.bannerTone}
                logoIcon={profileForm.logoIcon}
                logoDataUrl={profileForm.logoDataUrl}
                size="lg"
              />
            </div>

            <form onSubmit={handleSaveProfile} className="mt-6 space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <label className="vinchi-transition inline-flex min-h-[42px] items-center gap-2 rounded-[14px] border border-[#9c44dc] bg-[#faf5ff] px-4 text-xs font-semibold text-[#442c61] hover:bg-[#9c44dc] hover:text-[#ffffff] cursor-pointer">
                  <Camera className="h-4.5 w-4.5 stroke-[2.2]" aria-hidden="true" />
                  <span>Subir imagen de logotipo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="sr-only"
                  />
                </label>

                {profileForm.logoDataUrl && (
                  <button
                    type="button"
                    onClick={() => setProfileForm((prev) => ({ ...prev, logoDataUrl: undefined }))}
                    className="inline-flex min-h-[42px] items-center gap-1.5 rounded-[14px] border border-[#e5e5e5] px-4 text-xs font-medium text-[#9c645c] hover:bg-[#faf5ff] cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    <span>Quitar imagen</span>
                  </button>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[#442c61]">
                    Nombre comercial
                  </label>
                  <input
                    type="text"
                    required
                    value={profileForm.negocioNombre}
                    onChange={(e) =>
                      setProfileForm((p) => ({ ...p, negocioNombre: e.target.value }))
                    }
                    className="mt-1 h-11 w-full rounded-[14px] border border-[#d8c2ef] bg-[#faf5ff] px-3.5 text-sm focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#442c61]">
                    Ciudad
                  </label>
                  <input
                    type="text"
                    value={profileForm.ciudad}
                    onChange={(e) => setProfileForm((p) => ({ ...p, ciudad: e.target.value }))}
                    className="mt-1 h-11 w-full rounded-[14px] border border-[#d8c2ef] bg-[#faf5ff] px-3.5 text-sm focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#442c61]">
                    Barrio o zona
                  </label>
                  <input
                    type="text"
                    value={profileForm.barrio}
                    onChange={(e) => setProfileForm((p) => ({ ...p, barrio: e.target.value }))}
                    className="mt-1 h-11 w-full rounded-[14px] border border-[#d8c2ef] bg-[#faf5ff] px-3.5 text-sm focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#442c61]">
                    Dirección del local
                  </label>
                  <input
                    type="text"
                    value={profileForm.direccionLocal}
                    onChange={(e) =>
                      setProfileForm((p) => ({ ...p, direccionLocal: e.target.value }))
                    }
                    className="mt-1 h-11 w-full rounded-[14px] border border-[#d8c2ef] bg-[#faf5ff] px-3.5 text-sm focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#442c61]">
                    Tiempo estimado de entrega (min)
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={120}
                    value={profileForm.tiempoEntregaMin}
                    onChange={(e) =>
                      setProfileForm((p) => ({
                        ...p,
                        tiempoEntregaMin: Number(e.target.value) || 25,
                      }))
                    }
                    className="mt-1 h-11 w-full rounded-[14px] border border-[#d8c2ef] bg-[#faf5ff] px-3.5 text-sm focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#442c61]">
                    Tarifa fija de domicilio (COP)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    value={profileForm.costoDomicilioCop}
                    onChange={(e) =>
                      setProfileForm((p) => ({
                        ...p,
                        costoDomicilioCop: Number(e.target.value) || 0,
                      }))
                    }
                    className="mt-1 h-11 w-full rounded-[14px] border border-[#d8c2ef] bg-[#faf5ff] px-3.5 text-sm focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#442c61]">
                  Descripción de tu empresa
                </label>
                <textarea
                  rows={3}
                  required
                  value={profileForm.descripcion}
                  onChange={(e) =>
                    setProfileForm((p) => ({ ...p, descripcion: e.target.value }))
                  }
                  placeholder="Cuéntales a tus clientes qué hace especial tu menú..."
                  className="mt-1 w-full rounded-[14px] border border-[#d8c2ef] bg-[#faf5ff] p-3.5 text-sm focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold text-[#442c61]">Ícono emblema</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {LOGO_ICONS.map((ic) => (
                      <button
                        key={ic.id}
                        type="button"
                        onClick={() => setProfileForm((p) => ({ ...p, logoIcon: ic.id }))}
                        className={`rounded-[10px] border px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                          profileForm.logoIcon === ic.id
                            ? 'border-[#9c44dc] bg-[#9c44dc] text-[#ffffff]'
                            : 'border-[#d8c2ef] bg-[#ffffff] text-[#442c61]'
                        }`}
                      >
                        {ic.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-[#442c61]">Color de marca</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {BANNER_TONES.map((tone) => (
                      <button
                        key={tone.value}
                        type="button"
                        onClick={() => setProfileForm((p) => ({ ...p, bannerTone: tone.value }))}
                        className={`inline-flex items-center gap-2 rounded-[10px] border px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                          profileForm.bannerTone === tone.value
                            ? 'border-2 border-[#442c61] bg-[#faf5ff] text-[#442c61]'
                            : 'border-[#d8c2ef] bg-[#ffffff] text-[#543b6c]'
                        }`}
                      >
                        <span className={`h-3.5 w-3.5 rounded-full ${tone.preview}`} />
                        <span>{tone.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isBusy}
                className="vinchi-transition inline-flex min-h-[46px] items-center gap-2 rounded-[16px] bg-[#9c44dc] px-6 text-xs font-semibold text-[#ffffff] hover:bg-[#543b6c] disabled:opacity-50 cursor-pointer"
              >
                <Save className="h-4.5 w-4.5 stroke-[2.25]" aria-hidden="true" />
                <span>{isBusy ? 'Guardando...' : 'Guardar logotipo y perfil'}</span>
              </button>
            </form>
          </section>
        )}

        {/* TAB 4: CREAR ANUNCIOS */}
        {activeTab === 'anuncios' && (
          <section className="grid gap-6 lg:grid-cols-12">
            <div className="blueprint-card p-6 lg:col-span-7">
              <div className="flex items-start justify-between gap-3 border-b border-[#e9d5ff] pb-4">
                <div>
                  <h2 className="font-display text-xl font-bold text-[#442c61]">
                    Publicar Anuncio Dorado
                  </h2>
                  <p className="mt-1 text-xs text-[#543b6c]">
                    Destaca tu marca arriba del Catálogo y en las publicaciones del Foro.
                  </p>
                </div>
                <span
                  className={`rounded-[8px] px-3 py-1 text-xs font-bold ${
                    isUltraPlan
                      ? 'bg-[#442c61] text-[#fde68a]'
                      : 'bg-[#fef3c7] text-[#92400e]'
                  }`}
                >
                  {isUltraPlan ? '$0 COP · Incluido en Ultra' : '$25.000 COP / anuncio'}
                </span>
              </div>

              <form onSubmit={handlePublishAdSubmit} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#442c61]">
                    Título promocional
                  </label>
                  <input
                    type="text"
                    required
                    value={adTitle}
                    onChange={(e) => setAdTitle(e.target.value)}
                    placeholder="Ej. 2x1 en Parrilla de Fin de Semana"
                    className="mt-1 h-11 w-full rounded-[14px] border border-[#d8c2ef] bg-[#faf5ff] px-3.5 text-sm focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#442c61]">
                    Mensaje para los compradores
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={adMessage}
                    onChange={(e) => setAdMessage(e.target.value)}
                    placeholder="Describe tu promoción o platillo insignia para atraer nuevos clientes..."
                    className="mt-1 w-full rounded-[14px] border border-[#d8c2ef] bg-[#faf5ff] p-3.5 text-sm focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none"
                  />
                </div>

                {!isUltraPlan && showAdPayment && (
                  <div className="rounded-[18px] border-2 border-[#d97706]/60 bg-[#fffbeb] p-4 space-y-3">
                    <p className="text-xs font-bold text-[#92400e]">
                      Tu plan actual ({activePlanLabel[workspace.plan]}) requiere pago de $25.000 COP por anuncio
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {PAYMENT_METHODS.map((pm) => (
                        <button
                          key={pm.id}
                          type="button"
                          onClick={() => setAdPaymentMethod(pm.id)}
                          className={`rounded-[12px] border px-3 py-2 text-left text-xs font-semibold cursor-pointer ${
                            adPaymentMethod === pm.id
                              ? 'border-[#9c44dc] bg-[#ffffff] text-[#442c61]'
                              : 'border-[#fde68a] bg-[#ffffff]/60 text-[#92400e]'
                          }`}
                        >
                          {pm.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={isBusy}
                    className="vinchi-transition inline-flex min-h-[46px] items-center gap-2 rounded-[16px] bg-[#9c44dc] px-6 text-xs font-semibold text-[#ffffff] hover:bg-[#543b6c] disabled:opacity-50 cursor-pointer"
                  >
                    <Megaphone className="h-4.5 w-4.5 stroke-[2.2]" aria-hidden="true" />
                    <span>
                      {isUltraPlan
                        ? 'Publicar anuncio gratis (Ultra)'
                        : showAdPayment
                          ? `Pagar $25.000 vía ${adPaymentMethod} y publicar`
                          : 'Continuar al pago ($25.000 COP)'}
                    </span>
                  </button>

                  {showAdPayment && (
                    <button
                      type="button"
                      onClick={() => setShowAdPayment(false)}
                      className="rounded-[16px] border border-[#e5e5e5] px-4 text-xs font-semibold text-[#543b6c] cursor-pointer"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="blueprint-card p-6 lg:col-span-5">
              <h3 className="font-display text-lg font-bold text-[#442c61]">
                Anuncios activos ({workspace.ads.length})
              </h3>
              {workspace.ads.length === 0 ? (
                <p className="mt-3 text-xs text-[#543b6c]">
                  Todavía no has publicado anuncios. Crea el primero para destacar tu marca.
                </p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {workspace.ads.map((ad) => (
                    <li
                      key={ad.id}
                      className="rounded-[16px] border border-[#fde68a] bg-[#fffbeb] p-4 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <strong className="text-sm text-[#442c61]">{ad.titulo}</strong>
                        <span className="rounded-[6px] bg-[#b45309] px-2 py-0.5 text-[10px] font-bold text-[#ffffff]">
                          {ad.incluidoEnPlan ? 'Ultra' : formatCop(ad.montoPagadoCop)}
                        </span>
                      </div>
                      <p className="mt-1.5 text-[#543b6c]">{ad.mensaje}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}

        {/* TAB 5: CÓDIGOS QR */}
        {activeTab === 'qr' && (
          <section className="blueprint-card p-6 sm:p-8">
            {isBasicPlan ? (
              <div className="mx-auto max-w-lg py-8 text-center">
                <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#f3e8ff] text-[#9c44dc]">
                  <Lock className="h-7 w-7 stroke-[2.2]" aria-hidden="true" />
                </span>
                <h2 className="mt-4 font-display text-2xl font-bold text-[#442c61]">
                  Códigos QR bloqueados en Básico Gratis
                </h2>
                <p className="mt-2 text-xs leading-relaxed text-[#543b6c]">
                  La creación de códigos QR para mesas y mostrador está habilitada a partir de los planes Premium y Ultra.
                </p>
                <button
                  type="button"
                  onClick={() => setShowPlanSelector(true)}
                  className="vinchi-transition mt-5 inline-flex min-h-[46px] items-center gap-2 rounded-[16px] bg-[#9c44dc] px-6 text-xs font-semibold text-[#ffffff] hover:bg-[#543b6c] cursor-pointer"
                >
                  <Crown className="h-4.5 w-4.5 text-[#fde68a]" aria-hidden="true" />
                  <span>Actualizar a Premium o Ultra</span>
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="border-b border-[#e9d5ff] pb-4">
                  <h2 className="font-display text-xl font-bold text-[#442c61]">
                    Generador de Códigos QR
                  </h2>
                  <p className="mt-1 text-xs text-[#543b6c]">
                    Crea códigos QR reales escaneables para tus mesas, barra o empaques de domicilio.
                  </p>
                </div>

                <form onSubmit={handleCreateQr} className="grid gap-3 sm:grid-cols-3">
                  <input
                    type="text"
                    required
                    value={qrName}
                    onChange={(e) => setQrName(e.target.value)}
                    placeholder="Nombre (ej. Terraza Norte)"
                    className="h-11 rounded-[14px] border border-[#d8c2ef] bg-[#faf5ff] px-3.5 text-sm focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none"
                  />
                  <input
                    type="text"
                    required
                    value={qrRef}
                    onChange={(e) => setQrRef(e.target.value)}
                    placeholder="Mesa o punto (ej. Mesa 08)"
                    className="h-11 rounded-[14px] border border-[#d8c2ef] bg-[#faf5ff] px-3.5 text-sm focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isBusy}
                    className="vinchi-transition inline-flex h-11 items-center justify-center gap-2 rounded-[14px] bg-[#9c44dc] px-5 text-xs font-semibold text-[#ffffff] hover:bg-[#543b6c] disabled:opacity-50 cursor-pointer"
                  >
                    <Plus className="h-4.5 w-4.5 stroke-[2.3]" aria-hidden="true" />
                    <span>Generar QR</span>
                  </button>
                </form>

                {workspace.qrCodes.length === 0 ? (
                  <p className="text-xs text-[#543b6c]">
                    Aún no has creado códigos QR. Escribe el nombre y la mesa para generar el primero.
                  </p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {workspace.qrCodes.map((qr) => (
                      <article
                        key={qr.id}
                        className="rounded-[20px] border border-[#d8c2ef] bg-[#faf5ff] p-4 flex flex-col items-center text-center"
                      >
                        <img
                          src={qr.qrDataUrl}
                          alt={`QR ${qr.nombre}`}
                          className="h-40 w-40 rounded-[14px] border border-[#bc8ae1]/60 bg-[#ffffff] p-2"
                        />
                        <h3 className="mt-3 font-display text-base font-bold text-[#442c61]">
                          {qr.nombre}
                        </h3>
                        <p className="text-xs font-medium text-[#543b6c]">{qr.mesaORef}</p>
                        <div className="mt-3 flex flex-wrap justify-center gap-2">
                          <a
                            href={qr.qrDataUrl}
                            download={`vinchi-qr-${qr.mesaORef.toLowerCase().replace(/\s+/g, '-')}.png`}
                            className="inline-flex items-center gap-1.5 rounded-[10px] bg-[#442c61] px-3 py-1.5 text-xs font-semibold text-[#ffffff] hover:bg-[#9c44dc]"
                          >
                            <Download className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Descargar</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => {
                              void navigator.clipboard?.writeText(qr.urlDestino);
                              setCopiedQrId(qr.id);
                              window.setTimeout(() => setCopiedQrId(''), 1800);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-[10px] border border-[#d8c2ef] bg-[#ffffff] px-3 py-1.5 text-xs font-semibold text-[#442c61] cursor-pointer"
                          >
                            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>{copiedQrId === qr.id ? 'Copiado' : 'Enlace'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteQr(qr.id)}
                            aria-label={`Eliminar ${qr.nombre}`}
                            className="inline-flex items-center justify-center rounded-[10px] border border-[#e5e5e5] bg-[#ffffff] px-2.5 py-1.5 text-xs text-[#9c645c] hover:bg-[#fef2f2] cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* TAB 6: PERMISOS Y EQUIPO */}
        {activeTab === 'equipo' && (
          <section className="grid gap-6 lg:grid-cols-12">
            <div className="blueprint-card p-6 lg:col-span-5">
              <div className="flex items-center gap-2 border-b border-[#e9d5ff] pb-4">
                <Shield className="h-5 w-5 text-[#9c44dc]" aria-hidden="true" />
                <h2 className="font-display text-lg font-bold text-[#442c61]">
                  Crear acceso para colaborador
                </h2>
              </div>

              <form onSubmit={handleCreateTeamMember} className="mt-4 space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[#442c61]">
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    required
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                    placeholder="Ej. Andrés Pardo"
                    className="mt-1 h-10 w-full rounded-[12px] border border-[#d8c2ef] bg-[#faf5ff] px-3 text-sm focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-[#442c61]">
                      Cargo
                    </label>
                    <input
                      type="text"
                      required
                      value={memberRole}
                      onChange={(e) => setMemberRole(e.target.value)}
                      placeholder="Ej. Cajero / Despachador"
                      className="mt-1 h-10 w-full rounded-[12px] border border-[#d8c2ef] bg-[#faf5ff] px-3 text-sm focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#442c61]">
                      PIN de acceso (mín. 4)
                    </label>
                    <input
                      type="text"
                      required
                      minLength={4}
                      value={memberPin}
                      onChange={(e) => setMemberPin(e.target.value.toUpperCase())}
                      placeholder="CAJA-02"
                      className="mt-1 h-10 w-full rounded-[12px] border border-[#d8c2ef] bg-[#faf5ff] px-3 font-mono text-sm uppercase focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-[#442c61]">Permisos habilitados</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {PERMISSION_LABELS.map((perm) => (
                      <label
                        key={perm.key}
                        className="flex items-center gap-2 rounded-[10px] border border-[#e9d5ff] bg-[#faf5ff] px-3 py-2 text-xs text-[#442c61] cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={memberPerms[perm.key]}
                          onChange={(e) =>
                            setMemberPerms((prev) => ({ ...prev, [perm.key]: e.target.checked }))
                          }
                          className="accent-[#9c44dc]"
                        />
                        <span>{perm.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isBusy}
                  className="vinchi-transition inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[14px] bg-[#9c44dc] px-5 text-xs font-semibold text-[#ffffff] hover:bg-[#543b6c] disabled:opacity-50 cursor-pointer"
                >
                  <Plus className="h-4.5 w-4.5" aria-hidden="true" />
                  <span>Guardar colaborador y permisos</span>
                </button>
              </form>
            </div>

            <div className="blueprint-card p-6 lg:col-span-7">
              <h3 className="font-display text-lg font-bold text-[#442c61]">
                Equipo con acceso activo ({workspace.teamMembers.length})
              </h3>
              {workspace.teamMembers.length === 0 ? (
                <p className="mt-3 text-xs text-[#543b6c]">
                  Aún no has creado colaboradores. Agrega cajeros, administradores o encargados de domicilio con su propio PIN.
                </p>
              ) : (
                <div className="mt-4 space-y-4">
                  {workspace.teamMembers.map((member) => (
                    <article
                      key={member.id}
                      className="rounded-[18px] border border-[#d8c2ef] bg-[#faf5ff] p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <strong className="text-sm text-[#442c61]">{member.nombre}</strong>
                            <span className="rounded-[6px] bg-[#442c61] px-2 py-0.5 font-mono text-[10px] font-bold text-[#ffffff]">
                              PIN: {member.pinAcceso}
                            </span>
                          </div>
                          <p className="text-xs text-[#543b6c]">{member.cargo}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => void handleToggleMemberActive(member.id, member.activo)}
                            className={`rounded-[10px] px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                              member.activo
                                ? 'bg-[#16a34a]/15 text-[#166534]'
                                : 'bg-[#e5e5e5] text-[#543b6c]'
                            }`}
                          >
                            {member.activo ? 'Activo' : 'Pausado'}
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteMember(member.id)}
                            aria-label={`Eliminar acceso de ${member.nombre}`}
                            className="rounded-[10px] border border-[#e5e5e5] bg-[#ffffff] p-2 text-[#9c645c] hover:bg-[#fef2f2] cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {PERMISSION_LABELS.map((perm) => {
                          const enabled = member.permisos[perm.key];
                          return (
                            <button
                              key={perm.key}
                              type="button"
                              onClick={() =>
                                void handleToggleMemberPermission(member.id, perm.key, enabled)
                              }
                              className={`rounded-[8px] border px-2.5 py-1 text-[11px] font-semibold cursor-pointer ${
                                enabled
                                  ? 'border-[#9c44dc] bg-[#9c44dc] text-[#ffffff]'
                                  : 'border-[#d8c2ef] bg-[#ffffff] text-[#543b6c]'
                              }`}
                            >
                              {perm.label}
                            </button>
                          );
                        })}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
