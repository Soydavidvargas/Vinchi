'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import {
  Award,
  Beef,
  CakeSlice,
  Camera,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Compass,
  Crown,
  CupSoda,
  Eye,
  Flame,
  HeartHandshake,
  Home,
  LayoutGrid,
  Leaf,
  LogOut,
  MapPin,
  Minus,
  Package,
  Plus,
  RotateCcw,
  Save,
  Search,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Soup,
  Sparkles,
  Star,
  Store,
  Trash2,
  User,
  X,
  Zap,
} from 'lucide-react';
import ClienteAiChatbot from '@/src/components/cliente/ClienteAiChatbot';
import CompanyComplementModal, {
  resolveProductMenuSection,
} from '@/src/components/cliente/CompanyComplementModal';
import CompanyLogoMark from '@/src/components/cliente/CompanyLogoMark';
import CompanyProfileModal from '@/src/components/cliente/CompanyProfileModal';
import ForoInstagramFeed from '@/src/components/cliente/ForoInstagramFeed';
import LocationManagerModal from '@/src/components/cliente/LocationManagerModal';
import SpotlightCard from '@/src/components/reactbits/SpotlightCard';
import { getFoodPhotoUrl } from '@/src/data/clientVisualAssets';
import {
  createClientLocation,
  deleteClientLocation,
  fetchClientWorkspace,
  submitClientOrder,
  updateClientLocation,
  updateClientProfile,
} from '@/src/lib/vinchiClient';
import type {
  AuthUser,
  ClientCarouselTag,
  ClientCartItem,
  ClientCatalogProduct,
  ClientCompanyCatalog,
  ClientQuickCategory,
  ClientWorkspaceState,
  DeliveryHandoffMode,
  VinchiRoute,
} from '@/src/types/vinchi';

export interface ClienteMenuPageProps {
  user?: AuthUser | null;
  canReturnHome?: boolean;
  onUserUpdated?: (user: AuthUser) => void;
  onOrderCreated?: () => void;
  onNavigate?: (route: VinchiRoute) => void;
  onLogout?: () => void;
}

type ClientTab = 'catalogo' | 'foro' | 'pedidos' | 'carrito' | 'perfil';

const QUICK_FILTER_BUTTONS: {
  id: 'Todos' | ClientQuickCategory;
  label: string;
  tagline: string;
  icon: typeof LayoutGrid;
  activeBg: string;
  iconTint: string;
}[] = [
  {
    id: 'Todos',
    label: 'Todos',
    tagline: 'Catálogo completo',
    icon: LayoutGrid,
    activeBg: 'bg-gradient-to-br from-[#442c61] to-[#6d28d9] text-[#ffffff] border-[#442c61]',
    iconTint: 'bg-[#442c61]/10 text-[#442c61]',
  },
  {
    id: 'Bebidas',
    label: 'Bebidas',
    tagline: 'Cafés y jugos fríos',
    icon: CupSoda,
    activeBg: 'bg-gradient-to-br from-[#0284c7] to-[#0369a1] text-[#ffffff] border-[#0284c7]',
    iconTint: 'bg-[#0284c7]/10 text-[#0284c7]',
  },
  {
    id: 'Comida rápida',
    label: 'Comida rápida',
    tagline: 'Burgers y combos',
    icon: Flame,
    activeBg: 'bg-gradient-to-br from-[#d97706] to-[#b45309] text-[#ffffff] border-[#d97706]',
    iconTint: 'bg-[#d97706]/10 text-[#b45309]',
  },
  {
    id: 'Vegana',
    label: 'Vegana',
    tagline: 'Bowls y natural',
    icon: Leaf,
    activeBg: 'bg-gradient-to-br from-[#15803d] to-[#166534] text-[#ffffff] border-[#15803d]',
    iconTint: 'bg-[#15803d]/10 text-[#15803d]',
  },
  {
    id: 'Comida Asiática',
    label: 'Comida Asiática',
    tagline: 'Ramen, sushi y wok',
    icon: Soup,
    activeBg: 'bg-gradient-to-br from-[#6d28d9] to-[#4c1d95] text-[#ffffff] border-[#6d28d9]',
    iconTint: 'bg-[#6d28d9]/10 text-[#6d28d9]',
  },
  {
    id: 'Carnes',
    label: 'Carnes',
    tagline: 'Parrilla y cortes',
    icon: Beef,
    activeBg: 'bg-gradient-to-br from-[#b91c1c] to-[#991b1b] text-[#ffffff] border-[#b91c1c]',
    iconTint: 'bg-[#b91c1c]/10 text-[#b91c1c]',
  },
  {
    id: 'Comida locales',
    label: 'Comida locales',
    tagline: 'Sazón de ciudad',
    icon: Store,
    activeBg: 'bg-gradient-to-br from-[#9c44dc] to-[#543b6c] text-[#ffffff] border-[#9c44dc]',
    iconTint: 'bg-[#9c44dc]/10 text-[#9c44dc]',
  },
  {
    id: 'Postres',
    label: 'Postres',
    tagline: 'Tortas y dulces',
    icon: CakeSlice,
    activeBg: 'bg-gradient-to-br from-[#be185d] to-[#9d174d] text-[#ffffff] border-[#be185d]',
    iconTint: 'bg-[#be185d]/10 text-[#be185d]',
  },
];

const COURIER_BONUS_TIERS = [
  {
    amountCop: 300 as const,
    nombre: 'Paso Solidario',
    mensaje: 'Mínimo obligatorio · Cada aporte suma para su ruta',
    icon: ShieldCheck,
  },
  {
    amountCop: 500 as const,
    nombre: '¡Buena Energía en Ruta!',
    mensaje: 'Apoya su camino, tiempo y entrega bajo sol o lluvia',
    icon: Zap,
  },
  {
    amountCop: 750 as const,
    nombre: 'Héroe de tu Entrega',
    mensaje: 'Impulso directo por cuidar tu pedido impecable',
    icon: HeartHandshake,
  },
  {
    amountCop: 1000 as const,
    nombre: 'Estrella del Repartidor',
    mensaje: 'Reconocimiento total directo al domiciliario',
    icon: Award,
  },
];

const CAROUSEL_SECTIONS: { tag: ClientCarouselTag; title: string; subtitle: string }[] = [
  {
    tag: 'Carnes',
    title: 'Carnes & Parrilla',
    subtitle: 'Cortes madurados, asados al carbón y hamburguesas especiales.',
  },
  {
    tag: 'Comida locales',
    title: 'Comida locales',
    subtitle: 'Cocina tradicional y sabores auténticos de cada ciudad.',
  },
  {
    tag: 'Comida de marcas',
    title: 'Comida de marcas',
    subtitle: 'Tiendas reconocidas y favoritos de entrega rápida.',
  },
  {
    tag: 'Comida Asiática',
    title: 'Comida Asiática',
    subtitle: 'Ramen artesanal, sushi fresco, wok y baos.',
  },
  {
    tag: 'Bebidas y Café',
    title: 'Bebidas & Café',
    subtitle: 'Métodos filtrados, cold brew, jugos naturales y malteadas.',
  },
  {
    tag: 'Vegana y Saludable',
    title: 'Vegana & Saludable',
    subtitle: 'Opciones plant-based frescas, bowls nutritivos y cold press.',
  },
];

const PAYMENT_METHODS = ['Efectivo contra entrega', 'Nequi', 'Daviplata', 'Tarjeta'];

const formatCop = (value: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);

// Selecciona exactamente UN platillo representativo por empresa según filtro/búsqueda
function pickCompanySignatureDish(
  company: ClientCompanyCatalog,
  activeFilter: 'Todos' | ClientQuickCategory,
  normalizedSearch: string
): ClientCatalogProduct | null {
  const principalItems = company.productos.filter(
    (p) => resolveProductMenuSection(p) === 'Principal'
  );
  const beverageItems = company.productos.filter(
    (p) => resolveProductMenuSection(p) === 'Bebidas' || p.categoriaFiltro === 'Bebidas'
  );

  if (normalizedSearch) {
    const principalSearchMatch = principalItems.find(
      (p) =>
        p.nombre.toLowerCase().includes(normalizedSearch) ||
        p.descripcion.toLowerCase().includes(normalizedSearch) ||
        p.categoriaFiltro.toLowerCase().includes(normalizedSearch)
    );
    if (principalSearchMatch) return principalSearchMatch;

    const anySearchMatch = company.productos.find(
      (p) =>
        p.nombre.toLowerCase().includes(normalizedSearch) ||
        p.descripcion.toLowerCase().includes(normalizedSearch) ||
        p.categoriaFiltro.toLowerCase().includes(normalizedSearch)
    );
    if (anySearchMatch) return anySearchMatch;
  }

  if (activeFilter === 'Bebidas') {
    if (beverageItems.length > 0) {
      return beverageItems.find((p) => p.destacado) || beverageItems[0];
    }
  } else if (activeFilter !== 'Todos') {
    const principalCategoryMatch = principalItems.find(
      (p) => p.categoriaFiltro === activeFilter
    );
    if (principalCategoryMatch) return principalCategoryMatch;

    const anyCategoryMatch = company.productos.find(
      (p) => p.categoriaFiltro === activeFilter
    );
    if (anyCategoryMatch) return anyCategoryMatch;
  }

  return (
    principalItems.find((p) => p.destacado) ||
    principalItems[0] ||
    company.productos.find((p) => p.destacado) ||
    company.productos[0] ||
    null
  );
}

function CarouselRow({
  title,
  subtitle,
  companies,
  activeFilter,
  normalizedSearch,
  cartQuantities,
  onAddProduct,
  onUpdateQty,
  onInspectCompany,
  onOpenInForo,
}: {
  title: string;
  subtitle: string;
  companies: ClientCompanyCatalog[];
  activeFilter: 'Todos' | ClientQuickCategory;
  normalizedSearch: string;
  cartQuantities: Record<string, number>;
  onAddProduct: (product: ClientCatalogProduct) => void;
  onUpdateQty: (productId: string, delta: number) => void;
  onInspectCompany: (companyId: string) => void;
  onOpenInForo: () => void;
}) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  if (companies.length === 0) return null;

  // Empresas Licencia Ultra primero y luego anuncios pagados en diseño dorado
  const ordered = [...companies].sort((a, b) => {
    const scoreA = (a.esUltra ? 2 : 0) + (a.pagadoAnuncio ? 1 : 0);
    const scoreB = (b.esUltra ? 2 : 0) + (b.pagadoAnuncio ? 1 : 0);
    return scoreB - scoreA;
  });

  const scrollRow = (dir: -1 | 1) => {
    if (!scrollerRef.current) return;
    scrollerRef.current.scrollBy({ left: dir * 340, behavior: 'smooth' });
  };

  return (
    <section aria-label={title} className="space-y-3">
      <div>
        <h3 className="font-display text-lg font-semibold tracking-[-0.02em] text-[#0a0a0a] sm:text-xl">
          {title}
        </h3>
        <p className="text-xs text-[#543b6c]">{subtitle}</p>
      </div>

      <div className="relative flex items-center">
        <button
          type="button"
          onClick={() => scrollRow(-1)}
          aria-label={`Desplazar ${title} a la izquierda`}
          className="vinchi-transition absolute left-1.5 top-1/2 z-20 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#bc8ae1] bg-[#ffffff]/95 text-[#442c61] shadow-[0_10px_24px_-6px_rgba(68,44,97,0.34)] hover:border-[#9c44dc] hover:bg-[#442c61] hover:text-[#ffffff] sm:-left-4 cursor-pointer"
        >
          <ChevronLeft className="h-6 w-6 stroke-[2.5]" aria-hidden="true" />
        </button>

        <div
          ref={scrollerRef}
          className="flex w-full snap-x snap-mandatory gap-4 overflow-x-auto px-2 pb-2 sm:px-3"
        >
        {ordered.map((company) => {
          const heroProd = pickCompanySignatureDish(company, activeFilter, normalizedSearch);
          if (!heroProd) return null;
          const isGold = company.pagadoAnuncio;
          const isUltra = Boolean(company.esUltra);
          const qty = cartQuantities[heroProd.id] || 0;
          const photoUrl = getFoodPhotoUrl(heroProd.imagenKey || company.imagenKey);

          return (
            <article
              key={`${title}-${company.id}`}
              className={`flex w-[312px] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-[22px] transition-shadow sm:w-[348px] ${
                isGold
                  ? 'border-2 border-[#d4af37] bg-gradient-to-br from-[#fffbeb] via-[#ffffff] to-[#fef3c7]/70 shadow-[0_8px_24px_-6px_rgba(217,119,6,0.28)]'
                  : 'border-2 border-[#d8c2ef] bg-[#ffffff] shadow-[0_2px_8px_rgba(68,44,97,0.07)] hover:border-[#9c44dc]'
              }`}
            >
              <div>
                {/* Foto real del producto en venta */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#faf5ff]">
                  <img
                    src={photoUrl}
                    alt={`${heroProd?.nombre || company.nombre} en ${company.nombre}`}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/65 via-transparent to-transparent" />
                  <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between gap-2 text-xs text-[#ffffff]">
                    <span className="truncate font-semibold">
                      {heroProd?.nombre || company.nombre}
                    </span>
                    <span className="shrink-0 font-mono font-bold text-[#fde68a]">
                      {heroProd ? formatCop(heroProd.precioCop) : ''}
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CompanyLogoMark
                        initials={company.emblemaIniciales}
                        name={company.nombre}
                        bannerTone={company.bannerTone}
                        logoIcon={company.logoIcon}
                        logoDataUrl={company.logoDataUrl}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-display text-sm font-semibold text-[#0a0a0a]">
                          {company.nombre}
                        </p>
                        <p className="truncate text-[11px] text-[#543b6c]">
                          {company.barrio} · {company.tiempoEntregaMin} min
                        </p>
                      </div>
                    </div>

                    {isUltra ? (
                      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-[8px] bg-[#442c61] px-2.5 py-0.5 text-[11px] font-semibold text-[#ffffff]">
                        <Crown className="h-4 w-4 stroke-[2.25] text-[#fde68a]" aria-hidden="true" />
                        <span>{isGold ? 'Ultra · Anuncio' : 'Licencia Ultra'}</span>
                      </span>
                    ) : isGold ? (
                      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-[8px] bg-[#b45309] px-2.5 py-0.5 text-[11px] font-semibold text-[#ffffff]">
                        <Crown className="h-4 w-4 stroke-[2.25] text-[#fde68a]" aria-hidden="true" />
                        <span>Anuncio Dorado</span>
                      </span>
                    ) : (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-[8px] border border-[#d8c2ef] bg-[#faf5ff] px-2.5 py-0.5 font-mono text-[11px] font-semibold text-[#442c61]">
                        <Star className="h-4 w-4 stroke-[2.2] fill-[#d97706] text-[#d97706]" aria-hidden="true" />
                        {company.calificacion}
                      </span>
                    )}
                  </div>

                  {heroProd && (
                    <div className="mt-3.5 space-y-2">
                      {qty > 0 ? (
                        <div className="flex w-full items-center justify-between rounded-[12px] border border-[#9c44dc] bg-[#faf5ff] px-2.5 py-1.5">
                          <button
                            type="button"
                            onClick={() => onUpdateQty(heroProd.id, -1)}
                            aria-label={`Quitar uno de ${heroProd.nombre}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] border border-[#d8c2ef] bg-[#ffffff] text-[#442c61] hover:border-[#9c44dc] cursor-pointer"
                          >
                            <Minus className="h-4 w-4 stroke-[2.4]" aria-hidden="true" />
                          </button>
                          <span className="font-mono text-xs font-bold text-[#0a0a0a]">
                            {qty} en carrito
                          </span>
                          <button
                            type="button"
                            onClick={() => onAddProduct(heroProd)}
                            aria-label={`Agregar otro ${heroProd.nombre}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#9c44dc] text-[#ffffff] hover:bg-[#543b6c] cursor-pointer"
                          >
                            <Plus className="h-4 w-4 stroke-[2.4]" aria-hidden="true" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onAddProduct(heroProd)}
                          className={`inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-[12px] px-4 py-2.5 text-xs font-semibold transition-colors cursor-pointer ${
                            isGold
                              ? 'bg-[#b45309] text-[#ffffff] hover:bg-[#92400e]'
                              : 'bg-[#442c61] text-[#ffffff] hover:bg-[#9c44dc]'
                          }`}
                        >
                          <ShoppingBag className="h-5 w-5 stroke-[2.25]" aria-hidden="true" />
                          <span>Pedir platillo</span>
                        </button>
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => onInspectCompany(company.id)}
                          className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-[12px] border border-[#d8c2ef] bg-[#faf5ff] px-3.5 py-2 text-xs font-semibold text-[#442c61] hover:border-[#9c44dc] hover:bg-[#ffffff] cursor-pointer"
                        >
                          <Eye className="h-5 w-5 stroke-[2.25] text-[#9c44dc]" aria-hidden="true" />
                          <span>Ver perfil</span>
                        </button>
                        <button
                          type="button"
                          onClick={onOpenInForo}
                          className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-[12px] border border-[#d97706]/50 bg-[#fffbeb] px-3.5 py-2 text-xs font-semibold text-[#92400e] hover:bg-[#fef3c7] cursor-pointer"
                        >
                          <Sparkles className="h-5 w-5 stroke-[2.25] text-[#d97706]" aria-hidden="true" />
                          <span>Foro</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </article>
          );
        })}
        </div>

        <button
          type="button"
          onClick={() => scrollRow(1)}
          aria-label={`Desplazar ${title} a la derecha`}
          className="vinchi-transition absolute right-1.5 top-1/2 z-20 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#bc8ae1] bg-[#ffffff]/95 text-[#442c61] shadow-[0_10px_24px_-6px_rgba(68,44,97,0.34)] hover:border-[#9c44dc] hover:bg-[#442c61] hover:text-[#ffffff] sm:-right-4 cursor-pointer"
        >
          <ChevronRight className="h-6 w-6 stroke-[2.5]" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}

export default function ClienteMenuPage({
  user,
  canReturnHome = false,
  onUserUpdated,
  onOrderCreated,
  onNavigate,
  onLogout,
}: ClienteMenuPageProps) {
  const [workspace, setWorkspace] = useState<ClientWorkspaceState | null>(null);
  const [activeTab, setActiveTab] = useState<ClientTab>('catalogo');
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [bannerMsg, setBannerMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Filtros y búsqueda del catálogo
  const [activeFilter, setActiveFilter] = useState<'Todos' | ClientQuickCategory>('Todos');
  const [searchQuery, setSearchQuery] = useState('');

  // Scroll infinito de platillos (uno por empresa) de arriba hacia abajo
  const [visibleCount, setVisibleCount] = useState(6);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const goldScrollerRef = useRef<HTMLDivElement | null>(null);
  const companySectionRefs = useRef<Record<string, HTMLElement | null>>({});

  // Ubicaciones (máx 6)
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);

  // Perfil completo de la empresa para ver toda su carta y comprar más
  const [profileCompany, setProfileCompany] = useState<ClientCompanyCatalog | null>(null);
  // Modal automático de complementos al comprar (Bebidas, Porciones, Salsas, Otros)
  const [complementTrigger, setComplementTrigger] = useState<{
    company: ClientCompanyCatalog;
    product: ClientCatalogProduct;
  } | null>(null);

  // Carrito de compras persistente en sesión de componente + bono solidario obligatorio ($300-$1000)
  const [cart, setCart] = useState<ClientCartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [selectedBonusCop, setSelectedBonusCop] = useState<300 | 500 | 750 | 1000>(300);

  // Formulario Perfil
  const [profPrimerNombre, setProfPrimerNombre] = useState(user?.primerNombre || '');
  const [profSegundoNombre, setProfSegundoNombre] = useState(user?.segundoNombre || '');
  const [profPrimerApellido, setProfPrimerApellido] = useState(user?.primerApellido || '');
  const [profSegundoApellido, setProfSegundoApellido] = useState(user?.segundoApellido || '');
  const [profTelefono, setProfTelefono] = useState(user?.telefono || '');
  const [profAvatar, setProfAvatar] = useState(user?.avatarDataUrl || '');

  const syncWorkspace = (ws: ClientWorkspaceState) => {
    setWorkspace(ws);
    const defaultLoc =
      ws.locations.find((l) => l.predeterminada) || ws.locations[0] || null;
    setSelectedLocationId((curr) =>
      curr && ws.locations.some((l) => l.id === curr) ? curr : defaultLoc?.id || null
    );
    setProfPrimerNombre(ws.profile.primerNombre);
    setProfSegundoNombre(ws.profile.segundoNombre || '');
    setProfPrimerApellido(ws.profile.primerApellido);
    setProfSegundoApellido(ws.profile.segundoApellido || '');
    setProfTelefono(ws.profile.telefono || '');
    setProfAvatar(ws.profile.avatarDataUrl || '');
  };

  useEffect(() => {
    fetchClientWorkspace()
      .then((ws) => syncWorkspace(ws))
      .catch((err) => {
        setErrorMsg(err instanceof Error ? err.message : 'No se pudo cargar tu portal.');
      })
      .finally(() => setIsLoading(false));
  }, []);

  const companies = workspace?.companies || [];
  const locations = workspace?.locations || [];
  const ordersInProgress = workspace?.ordersInProgress || [];

  const activeLocation =
    locations.find((l) => l.id === selectedLocationId) ||
    locations.find((l) => l.predeterminada) ||
    locations[0] ||
    null;

  const promotedCompanies = useMemo(
    () =>
      companies
        .filter((c) => Boolean(c.esUltra || c.pagadoAnuncio))
        .sort((a, b) => {
          const scoreA = (a.esUltra ? 2 : 0) + (a.pagadoAnuncio ? 1 : 0);
          const scoreB = (b.esUltra ? 2 : 0) + (b.pagadoAnuncio ? 1 : 0);
          return scoreB - scoreA;
        }),
    [companies]
  );

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const filteredCompanies = useMemo(() => {
    return companies
      .filter((comp) => {
        const matchesCategory =
          activeFilter === 'Todos' ||
          comp.categoriasFiltro.includes(activeFilter) ||
          comp.productos.some((p) => p.categoriaFiltro === activeFilter);
        if (!matchesCategory) return false;
        if (!normalizedSearch) return true;
        return (
          comp.nombre.toLowerCase().includes(normalizedSearch) ||
          comp.ciudad.toLowerCase().includes(normalizedSearch) ||
          comp.barrio.toLowerCase().includes(normalizedSearch) ||
          comp.etiquetasCarrusel.some((t) => t.toLowerCase().includes(normalizedSearch)) ||
          comp.productos.some(
            (p) =>
              p.nombre.toLowerCase().includes(normalizedSearch) ||
              p.descripcion.toLowerCase().includes(normalizedSearch)
          )
        );
      })
      .sort((a, b) => {
        const scoreA = (a.esUltra ? 2 : 0) + (a.pagadoAnuncio ? 1 : 0);
        const scoreB = (b.esUltra ? 2 : 0) + (b.pagadoAnuncio ? 1 : 0);
        return scoreB - scoreA;
      });
  }, [companies, activeFilter, normalizedSearch]);

  // Reiniciar el lote de scroll infinito al cambiar filtro/búsqueda
  useEffect(() => {
    setVisibleCount(6);
  }, [activeFilter, normalizedSearch]);

  // IntersectionObserver para scroll infinito de platillos (uno por empresa)
  useEffect(() => {
    if (activeTab !== 'catalogo') return;
    const node = loadMoreRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((prev) => Math.min(filteredCompanies.length, prev + 6));
        }
      },
      { rootMargin: '180px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [activeTab, filteredCompanies.length]);

  const visibleCompanies = filteredCompanies.slice(0, visibleCount);
  const hasMoreCompanies = visibleCount < filteredCompanies.length;

  const cartQuantities = useMemo(() => {
    const map: Record<string, number> = {};
    for (const item of cart) {
      map[item.productId] = item.cantidad;
    }
    return map;
  }, [cart]);

  const totalCartItems = useMemo(
    () => cart.reduce((sum, item) => sum + item.cantidad, 0),
    [cart]
  );

  const cartSubtotalCop = useMemo(
    () => cart.reduce((sum, item) => sum + item.precioCop * item.cantidad, 0),
    [cart]
  );

  // Sumar tarifa fija por empresa única en el carrito ($ 1.000 COP c/u si es "Yo mismo lo recojo", o tarifa fija de domicilio de cada tienda)
  const cartDeliveryCop = useMemo(() => {
    const seen = new Set<string>();
    let fee = 0;
    const isSelfPickup = activeLocation?.modoEntrega === 'Yo mismo lo recojo';
    for (const item of cart) {
      if (seen.has(item.companyId)) continue;
      seen.add(item.companyId);
      if (isSelfPickup) {
        fee += 1000;
      } else {
        const comp = companies.find((c) => c.id === item.companyId);
        fee += comp?.costoDomicilioCop || 4000;
      }
    }
    return fee;
  }, [cart, companies, activeLocation]);

  const selectedBonus =
    COURIER_BONUS_TIERS.find((t) => t.amountCop === selectedBonusCop) || COURIER_BONUS_TIERS[0];

  const handleAddToCart = (product: ClientCatalogProduct) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id ? { ...i, cantidad: i.cantidad + 1 } : i
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          companyId: product.companyId,
          companyName: product.companyName,
          nombre: product.nombre,
          precioCop: product.precioCop,
          cantidad: 1,
          acentoColor: product.acentoColor,
          imagenKey: product.imagenKey,
        },
      ];
    });
    setBannerMsg(`"${product.nombre}" agregado al carrito.`);
    setErrorMsg('');
  };

  const handleBuyFromCatalog = (product: ClientCatalogProduct) => {
    handleAddToCart(product);
    const comp = companies.find((c) => c.id === product.companyId) || null;
    if (comp) {
      setComplementTrigger({ company: comp, product });
    }
  };

  const handleUpdateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.productId === productId ? { ...item, cantidad: item.cantidad + delta } : item
        )
        .filter((item) => item.cantidad > 0)
    );
  };

  const handleInspectCompany = (companyId: string) => {
    const target = companies.find((c) => c.id === companyId) || null;
    if (target) {
      setProfileCompany(target);
      return;
    }
    const idx = filteredCompanies.findIndex((c) => c.id === companyId);
    if (idx >= 0 && idx + 1 > visibleCount) {
      setVisibleCount(idx + 2);
    }
    window.setTimeout(() => {
      const el = companySectionRefs.current[companyId];
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  const handleCreateLocation = async (payload: {
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
  }) => {
    setIsBusy(true);
    setErrorMsg('');
    try {
      const ws = await createClientLocation(payload);
      syncWorkspace(ws);
      setBannerMsg('Ubicación guardada y actualizada en el encabezado.');
      return true;
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo guardar la ubicación.');
      return false;
    } finally {
      setIsBusy(false);
    }
  };

  const handleUpdateLocation = async (
    locationId: string,
    payload: Parameters<typeof updateClientLocation>[1]
  ) => {
    setIsBusy(true);
    setErrorMsg('');
    try {
      const ws = await updateClientLocation(locationId, payload);
      syncWorkspace(ws);
      setBannerMsg('Ubicación actualizada correctamente.');
      return true;
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo actualizar la ubicación.');
      return false;
    } finally {
      setIsBusy(false);
    }
  };

  const handleDeleteLocation = async (locationId: string) => {
    setIsBusy(true);
    setErrorMsg('');
    try {
      const ws = await deleteClientLocation(locationId);
      syncWorkspace(ws);
      setBannerMsg('Ubicación eliminada.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo eliminar la ubicación.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleConfirmOrder = async () => {
    setErrorMsg('');
    setBannerMsg('');
    if (cart.length === 0) {
      setErrorMsg('Agrega productos al carrito antes de confirmar tu pedido.');
      return;
    }
    if (!activeLocation) {
      setShowLocationModal(true);
      setErrorMsg('Agrega y selecciona una ubicación de entrega primero.');
      return;
    }

    setIsBusy(true);
    try {
      const res = await submitClientOrder({
        items: cart.map((i) => ({ productId: i.productId, cantidad: i.cantidad })),
        locationId: activeLocation.id,
        metodoPago: paymentMethod,
        bonoDomiciliarioCop: selectedBonus.amountCop,
        bonoNombre: selectedBonus.nombre,
      });
      syncWorkspace(res.workspace);
      setCart([]);
      setBannerMsg(res.message);
      setActiveTab('pedidos');
      onOrderCreated?.();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No fue posible confirmar el pedido.');
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
    setErrorMsg('');
    setBannerMsg('');
    if (profPrimerNombre.trim().length < 2 || profPrimerApellido.trim().length < 2) {
      setErrorMsg('Tu primer nombre y primer apellido son obligatorios.');
      return;
    }

    setIsBusy(true);
    try {
      const res = await updateClientProfile({
        primerNombre: profPrimerNombre.trim(),
        segundoNombre: profSegundoNombre.trim() || undefined,
        primerApellido: profPrimerApellido.trim(),
        segundoApellido: profSegundoApellido.trim() || undefined,
        telefono: profTelefono.trim(),
        avatarDataUrl: profAvatar || undefined,
      });
      syncWorkspace(res.workspace);
      onUserUpdated?.(res.user);
      setBannerMsg('Tu perfil fue actualizado correctamente.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo actualizar tu perfil.');
    } finally {
      setIsBusy(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f3e8ff]/75 via-[#faf5ff] to-[#f4ecfb]">
        <div className="mx-auto max-w-[1280px] space-y-5 px-4 py-10 sm:px-6">
          <div className="h-20 animate-pulse rounded-[24px] bg-[#e9d5ff]" />
          <div className="h-56 animate-pulse rounded-[24px] bg-[#e9d5ff]" />
          <div className="grid gap-4 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-44 animate-pulse rounded-[24px] bg-[#e9d5ff]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f3e8ff]/75 via-[#faf5ff] to-[#f4ecfb] pb-28 text-[#0a0a0a]">
      {/* Header privado con "Agregar ubicaciones" y actualización en vivo */}
      <header className="sticky top-0 z-30 border-b-2 border-[#543b6c] bg-[#442c61] text-[#ffffff] shadow-sm">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setActiveTab('catalogo')}
              aria-label="Ir al catálogo"
              className="vinchi-transition inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#9c44dc] text-[#ffffff] shadow-xs hover:bg-[#bc8ae1] hover:text-[#442c61] cursor-pointer"
            >
              <Store className="h-6 w-6 stroke-[2.25]" aria-hidden="true" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-display text-lg font-semibold tracking-[-0.03em] text-[#ffffff]">
                  vinchi
                </span>
                <span className="text-xs text-[#d8c2ef] font-medium">· Tu espacio de pedidos</span>
              </div>
              <p className="truncate text-xs text-[#e9d5ff]">
                Hola, <strong className="text-[#ffffff]">{workspace?.profile.primerNombre}</strong>
              </p>
            </div>
          </div>

          {/* Bloque de Ubicación Activa / Botón Agregar ubicaciones */}
          <div className="flex flex-wrap items-center gap-2.5">
            {activeLocation ? (
              <button
                type="button"
                onClick={() => setShowLocationModal(true)}
                className="vinchi-transition flex max-w-[340px] items-center gap-2.5 rounded-[16px] border border-[#bc8ae1]/45 bg-[#ffffff]/14 px-3.5 py-2 text-left text-[#ffffff] hover:border-[#fde68a]/70 hover:bg-[#ffffff]/22 cursor-pointer"
              >
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#9c44dc] text-[#fde68a]">
                  <MapPin className="h-5 w-5 stroke-[2.25]" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-[5px] bg-[#fde68a] px-1.5 py-0.2 text-[10px] font-bold text-[#442c61]">
                      {activeLocation.etiqueta}
                    </span>
                    <span className="truncate text-xs font-semibold text-[#ffffff]">
                      {activeLocation.nombreLugar}
                    </span>
                  </div>
                  <p className="truncate text-[11px] text-[#e9d5ff]">
                    {activeLocation.esConjuntoPrivado
                      ? `Conjunto ${activeLocation.nombreConjunto} · Apto ${activeLocation.apartamento}`
                      : activeLocation.direccion}{' '}
                    · {activeLocation.modoEntrega}
                  </p>
                </div>
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => setShowLocationModal(true)}
              className={`vinchi-transition inline-flex min-h-[42px] items-center gap-2 rounded-[16px] px-4 text-xs font-semibold cursor-pointer ${
                activeLocation
                  ? 'border border-[#bc8ae1]/45 bg-[#ffffff]/14 text-[#ffffff] hover:bg-[#ffffff]/22'
                  : 'bg-[#9c44dc] text-[#ffffff] shadow-sm hover:bg-[#bc8ae1] hover:text-[#442c61]'
              }`}
            >
              <MapPin className="h-5 w-5 stroke-[2.25]" aria-hidden="true" />
              <span>
                {activeLocation
                  ? `Agregar ubicaciones (${locations.length}/6)`
                  : 'Agregar ubicaciones'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('carrito')}
              className="vinchi-transition relative inline-flex min-h-[42px] items-center gap-2 rounded-[16px] bg-[#9c44dc] px-4 text-xs font-semibold text-[#ffffff] hover:bg-[#bc8ae1] hover:text-[#442c61] cursor-pointer"
            >
              <ShoppingCart className="h-5 w-5 stroke-[2.25]" aria-hidden="true" />
              <span>Carrito</span>
              {totalCartItems > 0 && (
                <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#fbbf24] px-1.5 font-mono text-[11px] font-bold text-[#0a0a0a]">
                  {totalCartItems}
                </span>
              )}
            </button>

            {canReturnHome && onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('/(public)')}
                className="vinchi-transition inline-flex min-h-[42px] items-center gap-2 rounded-[16px] border border-[#bc8ae1]/45 bg-[#ffffff]/12 px-3.5 text-xs font-semibold text-[#ffffff] hover:bg-[#ffffff]/20 cursor-pointer"
              >
                <Home className="h-4.5 w-4.5 stroke-[2.25] text-[#e9d5ff]" aria-hidden="true" />
                <span>Inicio</span>
              </button>
            )}

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="vinchi-transition inline-flex min-h-[42px] items-center gap-2 rounded-[16px] border border-[#bc8ae1]/45 bg-[#ffffff]/10 px-3.5 text-xs font-semibold text-[#ffffff] hover:bg-[#ffffff]/20 cursor-pointer"
              >
                <LogOut className="h-4.5 w-4.5 stroke-[2.25] text-[#e9d5ff]" aria-hidden="true" />
                <span>Cerrar sesión</span>
              </button>
            )}
          </div>
        </div>

        {/* Navegación principal con botón llamativo de Foro al lado de Catálogo */}
        <div className="border-t border-[#bc8ae1]/25 bg-[#543b6c]">
          <nav
            aria-label="Apartados de cliente"
            className="mx-auto flex max-w-[1280px] items-center gap-2 overflow-x-auto px-4 py-2.5 sm:px-6"
          >
            <button
              type="button"
              onClick={() => setActiveTab('catalogo')}
              className={`whitespace-nowrap shrink-0 inline-flex items-center gap-2 rounded-[14px] px-4 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'catalogo'
                  ? 'bg-[#9c44dc] text-[#ffffff] shadow-xs'
                  : 'text-[#e9d5ff] hover:bg-[#ffffff]/12 hover:text-[#ffffff]'
              }`}
            >
              <Store className="h-5 w-5 stroke-[2.25]" aria-hidden="true" />
              <span>Catálogo</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('foro')}
              className={`whitespace-nowrap shrink-0 inline-flex items-center gap-2 rounded-[14px] px-4.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'foro'
                  ? 'bg-gradient-to-r from-[#9c44dc] via-[#bc8ae1] to-[#d97706] text-[#ffffff] shadow-[0_8px_20px_-6px_rgba(156,68,220,0.65)] ring-2 ring-[#fde68a]/45'
                  : 'border border-[#fde68a]/75 bg-gradient-to-r from-[#fffbeb] via-[#faf5ff] to-[#fef3c7] text-[#442c61] shadow-xs hover:from-[#9c44dc] hover:to-[#d97706] hover:text-[#ffffff]'
              }`}
            >
              <Sparkles
                className={`h-5 w-5 stroke-[2.25] ${
                  activeTab === 'foro' ? 'text-[#fde68a]' : 'text-[#d97706]'
                }`}
                aria-hidden="true"
              />
              <span>Foro</span>
            </button>

            {(
              [
                {
                  id: 'pedidos',
                  label: `Pedidos en proceso${ordersInProgress.length ? ` (${ordersInProgress.length})` : ''}`,
                  icon: Package,
                },
                {
                  id: 'carrito',
                  label: `Carrito${totalCartItems ? ` (${totalCartItems})` : ''}`,
                  icon: ShoppingBag,
                },
                { id: 'perfil', label: 'Perfil', icon: User },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap shrink-0 inline-flex items-center gap-2 rounded-[14px] px-4 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#9c44dc] text-[#ffffff] shadow-xs'
                      : 'text-[#e9d5ff] hover:bg-[#ffffff]/12 hover:text-[#ffffff]'
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

      <main className="mx-auto max-w-[1280px] space-y-6 px-4 py-6 sm:px-6">
        {bannerMsg && (
          <div
            role="status"
            className="flex items-center justify-between gap-3 rounded-[16px] border border-[#16a34a]/35 bg-[#16a34a]/10 px-4 py-3 text-xs font-medium text-[#166534]"
          >
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 stroke-[2.25]" aria-hidden="true" />
              <span>{bannerMsg}</span>
            </span>
            <button
              type="button"
              onClick={() => setBannerMsg('')}
              className="inline-flex min-h-[34px] shrink-0 items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-xs font-semibold hover:bg-[#16a34a]/15 cursor-pointer"
            >
              <X className="h-4 w-4 stroke-[2.4]" aria-hidden="true" />
              <span>Cerrar</span>
            </button>
          </div>
        )}

        {errorMsg && (
          <div
            role="alert"
            className="rounded-[16px] border border-[#9c645c]/50 bg-[#d0b7b0]/25 px-4 py-3 text-xs font-medium text-[#5c302a]"
          >
            {errorMsg}
          </div>
        )}

        {/* APARTADO 1: CATÁLOGO (Solo platillos, uno de cada empresa) */}
        {activeTab === 'catalogo' && (
          <div className="space-y-8">
            {/* Tarjeta GRANDE de ubicación de entrega encima de "Explora todas las empresas registradas" */}
            <section
              aria-label="Ubicación de entrega activa"
              className={`rounded-[26px] border-2 p-5 sm:p-7 transition-colors ${
                activeLocation
                  ? 'border-[#9c44dc]/55 bg-gradient-to-r from-[#ffffff] via-[#faf5ff] to-[#f3e8ff]/70 shadow-sm'
                  : 'border-dashed border-[#9c44dc] bg-[#ffffff] shadow-xs'
              }`}
            >
              {activeLocation ? (
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4 min-w-0">
                    <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-[#442c61] text-[#fde68a] shadow-sm">
                      <MapPin className="h-7 w-7" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="rounded-[8px] bg-[#9c44dc] px-3 py-1 text-xs font-bold text-[#ffffff]">
                          {activeLocation.etiqueta}
                        </span>
                        <span className="text-xs font-semibold text-[#543b6c]">
                          {activeLocation.nombreLugar} · {locations.length}/6 guardadas
                        </span>
                      </div>
                      <h2 className="font-display text-xl font-bold tracking-[-0.02em] text-[#0a0a0a] sm:text-2xl">
                        {activeLocation.esConjuntoPrivado
                          ? `Conjunto ${activeLocation.nombreConjunto} · Apto ${activeLocation.apartamento}`
                          : activeLocation.direccion}
                      </h2>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowLocationModal(true)}
                      className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-[16px] bg-[#442c61] px-5 text-xs font-bold text-[#ffffff] shadow-sm hover:bg-[#9c44dc] cursor-pointer"
                    >
                      <MapPin className="h-5 w-5 stroke-[2.3] text-[#fde68a]" aria-hidden="true" />
                      <span>Cambiar ubicación</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-[#bc8ae1]/20 text-[#442c61]">
                      <MapPin className="h-7 w-7 stroke-[2.2]" aria-hidden="true" />
                    </span>
                    <div>
                      <h2 className="font-display text-xl font-bold text-[#0a0a0a]">
                        ¿A dónde enviamos tu pedido hoy?
                      </h2>
                      <p className="mt-0.5 text-xs text-[#543b6c]">
                        Agrega y selecciona una ubicación (Casa, Trabajo o Familiar) para mostrarla
                        aquí y gestionar tus entregas.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowLocationModal(true)}
                    className="inline-flex min-h-[46px] shrink-0 items-center justify-center gap-2 rounded-[16px] bg-[#9c44dc] px-5 text-xs font-bold text-[#ffffff] shadow-sm hover:bg-[#442c61] cursor-pointer"
                  >
                    <Plus className="h-5 w-5 stroke-[2.5]" aria-hidden="true" />
                    <span>Agregar ubicación</span>
                  </button>
                </div>
              )}
            </section>

            {/* Buscador + Botones de Filtros Rápidos arriba de los catálogos */}
            <section
              aria-label="Filtros rápidos y búsqueda"
              className="space-y-4 rounded-[24px] border-2 border-[#bc8ae1]/60 bg-[#ffffff] p-4 shadow-sm sm:p-6"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="font-display text-xl font-semibold tracking-[-0.025em] text-[#442c61] sm:text-2xl">
                    Explora todas las empresas registradas
                  </h1>
                  <p className="text-xs text-[#543b6c]">
                    Aquí ves un platillo destacado por cada empresa. Visita el{' '}
                    <button
                      type="button"
                      onClick={() => setActiveTab('foro')}
                      className="font-bold text-[#9c44dc] underline cursor-pointer"
                    >
                      Foro
                    </button>{' '}
                    para explorar cada comercio completo.
                  </p>
                </div>

                <div className="relative w-full sm:max-w-xs">
                  <Search
                    className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9c44dc]"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar empresa, plato o sabor..."
                    className="h-11 w-full rounded-[14px] border border-[#d8c2ef] bg-[#faf5ff] pl-11 pr-3.5 text-xs text-[#0a0a0a] focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none"
                  />
                </div>
              </div>

              {/* Botones GIGANTES de categoría dentro de Explora todas las empresas registradas */}
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
                {QUICK_FILTER_BUTTONS.map((btn) => {
                  const Icon = btn.icon;
                  const active = activeFilter === btn.id;
                  const matchingCount =
                    btn.id === 'Todos'
                      ? companies.length
                      : companies.filter(
                          (c) =>
                            c.categoriasFiltro.includes(btn.id as ClientQuickCategory) ||
                            c.productos.some((p) => p.categoriaFiltro === btn.id)
                        ).length;

                  return (
                    <button
                      key={btn.id}
                      type="button"
                      onClick={() => setActiveFilter(btn.id)}
                      className={`vinchi-transition group flex min-h-[116px] items-center justify-between gap-4 rounded-[24px] border-2 p-5 text-left cursor-pointer sm:min-h-[128px] sm:p-6 ${
                        active
                          ? `${btn.activeBg} shadow-[0_14px_30px_-10px_rgba(68,44,97,0.42)] scale-[1.01]`
                          : 'border-[#bc8ae1]/60 bg-[#faf5ff]/85 text-[#442c61] hover:border-[#9c44dc] hover:bg-[#ffffff] hover:shadow-sm'
                      }`}
                    >
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <span
                          className={`inline-flex items-center rounded-[8px] px-2 py-0.5 font-mono tabular-nums text-[11px] font-bold ${
                            active
                              ? 'bg-[#ffffff]/18 text-[#ffffff]'
                              : 'bg-[#442c61]/8 text-[#543b6c]'
                          }`}
                        >
                          {matchingCount} {matchingCount === 1 ? 'empresa' : 'empresas'}
                        </span>
                        <p className="font-display text-lg font-bold tracking-[-0.02em] leading-tight sm:text-xl">
                          {btn.label}
                        </p>
                        <p
                          className={`text-xs font-medium ${
                            active ? 'text-[#ffffff]/85' : 'text-[#543b6c]'
                          }`}
                        >
                          {btn.tagline}
                        </p>
                      </div>

                      <span
                        className={`inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] ring-1 ring-inset transition-transform group-hover:scale-105 sm:h-16 sm:w-16 ${
                          active
                            ? 'bg-[#ffffff]/20 text-[#ffffff] ring-[#ffffff]/30 shadow-xs'
                            : `${btn.iconTint} ring-[#442c61]/12`
                        }`}
                      >
                        <Icon className="h-7 w-7 stroke-[2.25] sm:h-8 sm:w-8" aria-hidden="true" />
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Sección Especial GRANDE arriba de todos los catálogos: Platillo destacado de empresas con anuncio (Dorado) */}
            {promotedCompanies.length > 0 && (
              <section
                aria-label="Platillos destacados dorados"
                className="rounded-[28px] border-2 border-[#d4af37] bg-gradient-to-br from-[#fffbeb] via-[#ffffff] to-[#fef3c7]/75 p-5 shadow-[0_14px_34px_-12px_rgba(217,119,6,0.28)] sm:p-7"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#b45309] text-[#fde68a]">
                      <Crown className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#b45309]">
                        Vitrina Dorada · Un platillo por empresa
                      </span>
                      <h2 className="font-display text-xl font-semibold text-[#0a0a0a] sm:text-2xl">
                        Platillos recomendados de hoy
                      </h2>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('foro')}
                    className="inline-flex min-h-[40px] items-center gap-2 rounded-[12px] border border-[#f59e0b] bg-[#fef3c7] px-4 py-2 text-xs font-semibold text-[#92400e] hover:bg-[#fde68a] cursor-pointer"
                  >
                    <Compass className="h-5 w-5 stroke-[2.25]" aria-hidden="true" />
                    <span>Ver marcas completas en Foro</span>
                  </button>
                </div>

                <div className="relative mt-5 flex items-center">
                  <button
                    type="button"
                    onClick={() => goldScrollerRef.current?.scrollBy({ left: -380, behavior: 'smooth' })}
                    aria-label="Desplazar platillos recomendados a la izquierda"
                    className="vinchi-transition absolute left-1.5 top-1/2 z-20 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#f59e0b] bg-[#ffffff]/95 text-[#92400e] shadow-[0_10px_24px_-6px_rgba(180,83,9,0.34)] hover:bg-[#b45309] hover:text-[#ffffff] sm:-left-4 cursor-pointer"
                  >
                    <ChevronLeft className="h-6 w-6 stroke-[2.5]" aria-hidden="true" />
                  </button>

                  <div
                    ref={goldScrollerRef}
                    className="flex w-full snap-x snap-mandatory gap-5 overflow-x-auto px-2 pb-2 sm:px-3"
                  >
                  {promotedCompanies.map((comp) => {
                    const featured = pickCompanySignatureDish(comp, activeFilter, normalizedSearch);
                    if (!featured) return null;
                    const qty = cartQuantities[featured.id] || 0;
                    const featuredPhoto = getFoodPhotoUrl(featured.imagenKey || comp.imagenKey);
                    const isUltra = Boolean(comp.esUltra);
                    const isGold = Boolean(comp.pagadoAnuncio);

                    return (
                      <div
                        key={`gold-hero-${comp.id}`}
                        className="flex w-[320px] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-[24px] border-2 border-[#f59e0b]/80 bg-[#ffffff] shadow-md sm:w-[390px]"
                      >
                        <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#fffbeb]">
                          <img
                            src={featuredPhoto}
                            alt={`${featured.nombre} en ${comp.nombre}`}
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/80 via-transparent to-transparent" />
                          <span
                            className={`absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-[8px] px-2.5 py-1 text-[11px] font-bold text-[#ffffff] shadow-sm ${
                              isUltra
                                ? 'bg-gradient-to-r from-[#442c61] to-[#9c44dc]'
                                : 'bg-[#b45309]'
                            }`}
                          >
                            <Sparkles className="h-4 w-4 stroke-[2.25] text-[#fde68a]" aria-hidden="true" />
                            {isUltra && isGold
                              ? 'Ultra · Anuncio'
                              : isUltra
                                ? 'Licencia Ultra'
                                : 'Anuncio Dorado'}
                          </span>
                          <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-2 text-[#ffffff]">
                            <div className="min-w-0">
                              <span className="text-[11px] font-semibold text-[#fde68a]">
                                {featured.categoriaFiltro} · {featured.tiempoPrepMin} min
                              </span>
                              <p className="truncate font-display text-base font-bold">
                                {featured.nombre}
                              </p>
                            </div>
                            <span className="shrink-0 font-mono tabular-nums text-sm font-bold text-[#fde68a]">
                              {formatCop(featured.precioCop)}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-1 flex-col justify-between p-5">
                          <div>
                            <div className="flex items-center gap-2.5 min-w-0">
                              <CompanyLogoMark
                                initials={comp.emblemaIniciales}
                                name={comp.nombre}
                                bannerTone={comp.bannerTone}
                                logoIcon={comp.logoIcon}
                                logoDataUrl={comp.logoDataUrl}
                                size="sm"
                              />
                              <div className="min-w-0">
                                <h3 className="truncate font-display text-sm font-bold text-[#0a0a0a]">
                                  {comp.nombre}
                                </h3>
                                <p className="truncate text-[11px] text-[#543b6c]">
                                  {comp.ciudad} · {comp.barrio} · {comp.tiempoEntregaMin} min
                                </p>
                              </div>
                            </div>

                            <p className="mt-3 text-xs leading-relaxed text-[#543b6c]">
                              {featured.descripcion}
                            </p>
                          </div>

                          <div className="mt-4 flex flex-wrap items-center gap-2.5 border-t border-[#fde68a] pt-3.5">
                            {qty > 0 ? (
                              <div className="inline-flex min-h-[42px] flex-1 items-center justify-between rounded-[12px] border border-[#b45309] bg-[#fffbeb] px-2.5 py-1">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateQty(featured.id, -1)}
                                  aria-label={`Quitar uno de ${featured.nombre}`}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] border border-[#fde68a] bg-[#ffffff] text-[#92400e] hover:bg-[#fef3c7] cursor-pointer"
                                >
                                  <Minus className="h-4 w-4 stroke-[2.4]" aria-hidden="true" />
                                </button>
                                <span className="font-mono text-xs font-bold text-[#0a0a0a]">
                                  {qty} en carrito
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleAddToCart(featured)}
                                  aria-label={`Agregar otro ${featured.nombre}`}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#b45309] text-[#ffffff] hover:bg-[#92400e] cursor-pointer"
                                >
                                  <Plus className="h-4 w-4 stroke-[2.4]" aria-hidden="true" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleBuyFromCatalog(featured)}
                                className="inline-flex min-h-[42px] flex-1 items-center justify-center gap-2 rounded-[12px] bg-[#b45309] px-4 py-2.5 text-xs font-semibold text-[#ffffff] hover:bg-[#92400e] cursor-pointer"
                              >
                                <ShoppingBag className="h-5 w-5 stroke-[2.25]" aria-hidden="true" />
                                <span>Pedir platillo</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setProfileCompany(comp)}
                              className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-[12px] border border-[#b45309] bg-[#fffbeb] px-4 py-2.5 text-xs font-bold text-[#92400e] hover:bg-[#fef3c7] cursor-pointer"
                            >
                              <Eye className="h-5 w-5 stroke-[2.25]" aria-hidden="true" />
                              <span>Ver perfil</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  </div>

                  <button
                    type="button"
                    onClick={() => goldScrollerRef.current?.scrollBy({ left: 380, behavior: 'smooth' })}
                    aria-label="Desplazar platillos recomendados a la derecha"
                    className="vinchi-transition absolute right-1.5 top-1/2 z-20 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#f59e0b] bg-[#ffffff]/95 text-[#92400e] shadow-[0_10px_24px_-6px_rgba(180,83,9,0.34)] hover:bg-[#b45309] hover:text-[#ffffff] sm:-right-4 cursor-pointer"
                  >
                    <ChevronRight className="h-6 w-6 stroke-[2.5]" aria-hidden="true" />
                  </button>
                </div>
              </section>
            )}

            {/* Carruseles separados por etiquetas populares (1 platillo por empresa) */}
            <div className="space-y-8">
              {CAROUSEL_SECTIONS.map((row) => {
                const matching = filteredCompanies.filter((c) =>
                  c.etiquetasCarrusel.includes(row.tag)
                );
                return (
                  <CarouselRow
                    key={row.tag}
                    title={row.title}
                    subtitle={row.subtitle}
                    companies={matching}
                    activeFilter={activeFilter}
                    normalizedSearch={normalizedSearch}
                    cartQuantities={cartQuantities}
                    onAddProduct={handleBuyFromCatalog}
                    onUpdateQty={handleUpdateQty}
                    onInspectCompany={handleInspectCompany}
                    onOpenInForo={() => setActiveTab('foro')}
                  />
                );
              })}
            </div>

            {/* Grilla de platillos: estrictamente UNO por cada empresa registrada */}
            <section aria-label="Platillos destacados uno por empresa" className="space-y-5 pt-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#d8c2ef] pb-3">
                <div>
                  <h2 className="font-display text-xl font-semibold tracking-[-0.02em] text-[#442c61] sm:text-2xl">
                    Platillos del catálogo · Uno por empresa ({filteredCompanies.length})
                  </h2>
                  <p className="text-xs text-[#543b6c]">
                    Cada empresa muestra su platillo insignia. Entra al{' '}
                    <button
                      type="button"
                      onClick={() => setActiveTab('foro')}
                      className="font-bold text-[#9c44dc] underline cursor-pointer"
                    >
                      Foro
                    </button>{' '}
                    para ver toda la carta completa en formato visual.
                  </p>
                </div>
                {activeFilter !== 'Todos' && (
                  <button
                    type="button"
                    onClick={() => setActiveFilter('Todos')}
                    className="inline-flex min-h-[38px] items-center gap-2 rounded-[12px] border border-[#bc8ae1] bg-[#faf5ff] px-4 py-2 text-xs font-semibold text-[#442c61] hover:border-[#9c44dc] cursor-pointer"
                  >
                    <RotateCcw className="h-5 w-5 stroke-[2.25] text-[#9c44dc]" aria-hidden="true" />
                    <span>Ver todas las categorías</span>
                  </button>
                )}
              </div>

              {filteredCompanies.length === 0 ? (
                <div className="rounded-[24px] border-2 border-[#d8c2ef] bg-[#ffffff] p-10 text-center">
                  <p className="text-sm font-semibold text-[#442c61]">
                    No encontramos platillos con ese filtro o búsqueda.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveFilter('Todos');
                      setSearchQuery('');
                    }}
                    className="mt-3 inline-flex items-center gap-2 rounded-[14px] bg-[#442c61] px-4 py-2 text-xs font-semibold text-[#ffffff] hover:bg-[#9c44dc] cursor-pointer"
                  >
                    <RotateCcw className="h-5 w-5 stroke-[2.25]" aria-hidden="true" />
                    <span>Limpiar filtros</span>
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {visibleCompanies.map((company) => {
                      const dish = pickCompanySignatureDish(
                        company,
                        activeFilter,
                        normalizedSearch
                      );
                      if (!dish) return null;
                      const isGold = company.pagadoAnuncio;
                      const isUltra = Boolean(company.esUltra);
                      const qty = cartQuantities[dish.id] || 0;
                      const prodPhoto = getFoodPhotoUrl(dish.imagenKey || company.imagenKey);

                      return (
                        <SpotlightCard
                          key={`dish-grid-${company.id}-${dish.id}`}
                          as="article"
                          spotlightColor={
                            isGold ? 'rgba(217, 119, 6, 0.14)' : 'rgba(156, 68, 220, 0.12)'
                          }
                          className={`flex flex-col justify-between overflow-hidden rounded-[24px] ${
                            isGold
                              ? 'border-2 border-[#d4af37] bg-gradient-to-br from-[#fffbeb] via-[#ffffff] to-[#fef3c7]/45 shadow-sm'
                              : isUltra
                                ? 'border-2 border-[#9c44dc]/65 bg-[#ffffff] shadow-sm'
                                : 'border-2 border-[#d8c2ef] bg-[#ffffff] shadow-xs'
                          }`}
                        >
                          <div
                            ref={(node) => {
                              companySectionRefs.current[company.id] = node;
                            }}
                            className="flex flex-1 flex-col justify-between scroll-mt-32"
                          >
                            <div>
                              <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#faf5ff]">
                                <img
                                  src={prodPhoto}
                                  alt={`${dish.nombre} · ${company.nombre}`}
                                  referrerPolicy="no-referrer"
                                  className="h-full w-full object-cover"
                                />
                                {(isUltra || isGold) && (
                                  <span
                                    className={`absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-[8px] px-2.5 py-1 text-[11px] font-bold text-[#ffffff] shadow-xs ${
                                      isUltra
                                        ? 'bg-gradient-to-r from-[#442c61] to-[#9c44dc]'
                                        : 'bg-[#b45309]'
                                    }`}
                                  >
                                    <Crown className="h-4 w-4 stroke-[2.25] text-[#fde68a]" aria-hidden="true" />
                                    {isUltra && isGold
                                      ? 'Ultra · Anuncio'
                                      : isUltra
                                        ? 'Licencia Ultra'
                                        : 'Anuncio Dorado'}
                                  </span>
                                )}
                              </div>

                              <div className="p-5 pb-0">
                                {/* Atribución compacta de la empresa dueña de este único platillo */}
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <CompanyLogoMark
                                      initials={company.emblemaIniciales}
                                      name={company.nombre}
                                      bannerTone={company.bannerTone}
                                      logoIcon={company.logoIcon}
                                      logoDataUrl={company.logoDataUrl}
                                      size="sm"
                                    />
                                    <span className="truncate text-xs font-semibold text-[#442c61]">
                                      {company.nombre}
                                    </span>
                                  </div>
                                  <span className="shrink-0 text-[11px] text-[#543b6c]">
                                    {company.tiempoEntregaMin} min
                                  </span>
                                </div>

                                <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[#543b6c]">
                                  <span className="font-semibold text-[#9c44dc]">
                                    {dish.categoriaFiltro}
                                  </span>
                                  <span aria-hidden="true">·</span>
                                  <span>{dish.etiquetaPopular}</span>
                                </div>

                                <h3 className="mt-1 font-display text-base font-bold text-[#0a0a0a]">
                                  {dish.nombre}
                                </h3>
                                <p className="mt-1 text-xs leading-relaxed text-[#543b6c]">
                                  {dish.descripcion}
                                </p>
                              </div>
                            </div>

                            <div className="p-5 pt-4 space-y-3">
                              <div className="flex items-center justify-between border-t border-[#d8c2ef] pt-3.5">
                                <span className="text-xs font-medium text-[#543b6c]">Precio</span>
                                <span className="font-mono tabular-nums text-base font-bold text-[#0a0a0a]">
                                  {formatCop(dish.precioCop)}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-2.5">
                                <button
                                  type="button"
                                  onClick={() => setProfileCompany(company)}
                                  className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-[12px] border border-[#d8c2ef] bg-[#faf5ff] px-3.5 py-2 text-xs font-semibold text-[#442c61] hover:border-[#9c44dc] hover:bg-[#ffffff] cursor-pointer"
                                >
                                  <Eye className="h-5 w-5 stroke-[2.25] text-[#9c44dc]" aria-hidden="true" />
                                  <span>Ver empresa</span>
                                </button>

                                {qty > 0 ? (
                                  <div className="inline-flex min-h-[42px] items-center justify-between rounded-[12px] border border-[#bc8ae1] bg-[#faf5ff] px-2 py-1">
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateQty(dish.id, -1)}
                                      aria-label={`Quitar uno de ${dish.nombre}`}
                                      className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] border border-[#d8c2ef] bg-[#ffffff] text-[#442c61] hover:border-[#9c44dc] cursor-pointer"
                                    >
                                      <Minus className="h-4 w-4 stroke-[2.4]" aria-hidden="true" />
                                    </button>
                                    <span className="min-w-[20px] text-center font-mono text-xs font-bold text-[#0a0a0a]">
                                      {qty}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleAddToCart(dish)}
                                      aria-label={`Agregar otro ${dish.nombre}`}
                                      className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#9c44dc] text-[#ffffff] hover:bg-[#543b6c] cursor-pointer"
                                    >
                                      <Plus className="h-4 w-4 stroke-[2.4]" aria-hidden="true" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleBuyFromCatalog(dish)}
                                    className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-[12px] bg-[#442c61] px-4 py-2 text-xs font-semibold text-[#ffffff] hover:bg-[#9c44dc] cursor-pointer"
                                  >
                                    <Plus className="h-5 w-5 stroke-[2.4]" aria-hidden="true" />
                                    <span>Agregar</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </SpotlightCard>
                      );
                    })}
                  </div>

                  {/* Sentinel del scroll infinito */}
                  <div ref={loadMoreRef} className="flex flex-col items-center py-4">
                    {hasMoreCompanies ? (
                      <button
                        type="button"
                        onClick={() =>
                          setVisibleCount((prev) =>
                            Math.min(filteredCompanies.length, prev + 6)
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-[14px] border border-[#bc8ae1] bg-[#faf5ff] px-5 py-2.5 text-xs font-semibold text-[#442c61] hover:bg-[#f3e8ff] cursor-pointer"
                      >
                        <Plus className="h-5 w-5 stroke-[2.3] text-[#9c44dc]" aria-hidden="true" />
                        <span>
                          Cargar más platillos ({filteredCompanies.length - visibleCount} empresas restantes)
                        </span>
                      </button>
                    ) : (
                      <p className="text-xs text-[#543b6c]">
                        Has visto un platillo destacado de las {filteredCompanies.length} empresas disponibles.
                      </p>
                    )}
                  </div>
                </>
              )}
            </section>
          </div>
        )}

        {/* APARTADO 2: FORO (Feed estilo Instagram con empresas completas: Premium primero + Anuncios) */}
        {activeTab === 'foro' && (
          <ForoInstagramFeed
            companies={companies}
            cartQuantities={cartQuantities}
            onAddProduct={handleAddToCart}
            onUpdateQty={handleUpdateQty}
            onInspectCompany={(comp) => setProfileCompany(comp)}
            onGoToCart={() => setActiveTab('carrito')}
          />
        )}

        {/* APARTADO 2: PEDIDOS EN PROCESO */}
        {activeTab === 'pedidos' && (
          <section aria-label="Pedidos en proceso" className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="font-display text-2xl font-semibold text-[#442c61]">
                  Pedidos en proceso
                </h1>
                <p className="text-xs text-[#543b6c]">
                  Seguimiento en vivo de las órdenes enviadas a cada comercio y domiciliario.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('catalogo')}
                className="inline-flex items-center gap-2 rounded-[14px] bg-[#9c44dc] px-4 py-2 text-xs font-semibold text-[#ffffff] hover:bg-[#543b6c] cursor-pointer"
              >
                <Store className="h-5 w-5 stroke-[2.25]" aria-hidden="true" />
                <span>Seguir pidiendo</span>
              </button>
            </div>

            {ordersInProgress.length === 0 ? (
              <div className="rounded-[24px] border-2 border-[#bc8ae1]/60 bg-[#ffffff] p-10 text-center">
                <Package className="mx-auto h-11 w-11 text-[#9c44dc]" aria-hidden="true" />
                <h2 className="mt-3 font-display text-lg font-semibold text-[#442c61]">
                  No tienes pedidos activos todavía
                </h2>
                <p className="mt-1 text-xs text-[#543b6c]">
                  Agrega platos desde el catálogo y confirma en tu carrito para verlos aquí.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {ordersInProgress.map((ord) => (
                  <article
                    key={ord.id}
                    className="rounded-[24px] border-2 border-[#bc8ae1]/60 bg-[#ffffff] p-5 shadow-xs space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3 border-b border-[#d8c2ef] pb-3.5">
                      <div>
                        <span className="font-mono text-xs font-bold text-[#9c44dc]">
                          {ord.codigo}
                        </span>
                        <h2 className="mt-0.5 font-display text-lg font-semibold text-[#0a0a0a]">
                          {ord.empresaNombre}
                        </h2>
                        <p className="text-xs text-[#543b6c]">{ord.empresaDireccion}</p>
                      </div>
                      <span className="rounded-[10px] bg-[#16a34a]/12 px-3 py-1 text-xs font-semibold text-[#166534]">
                        {ord.estado}
                      </span>
                    </div>

                    <ul className="space-y-1.5 text-xs">
                      {ord.items.map((it) => (
                        <li key={it.id} className="flex justify-between gap-2">
                          <span className="text-[#0a0a0a]">
                            <strong className="font-mono text-[#9c44dc]">{it.cantidad}x</strong>{' '}
                            {it.nombre}
                          </span>
                          <span className="font-mono font-semibold text-[#442c61]">
                            {formatCop(it.cantidad * it.precioUnitarioCop)}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* Resumen completo de ubicación enviada a tienda y domiciliario */}
                    <div className="rounded-[16px] border border-[#bc8ae1]/60 bg-[#faf5ff] p-3.5 text-xs space-y-1">
                      <p className="font-semibold text-[#442c61]">
                        Datos compartidos con empresa y domiciliario:
                      </p>
                      <p className="text-[#0a0a0a]">
                        <strong>{ord.location.etiqueta}:</strong> {ord.location.nombreLugar}
                      </p>
                      {ord.location.esConjuntoPrivado ? (
                        <p className="text-[#543b6c]">
                          Conjunto privado <strong>{ord.location.nombreConjunto}</strong> · Apto{' '}
                          <strong>{ord.location.apartamento}</strong>
                        </p>
                      ) : (
                        <>
                          <p className="text-[#543b6c]">Dirección: {ord.location.direccion}</p>
                          {ord.location.estructuraYCercania && (
                            <p className="text-[#543b6c]">
                              Estructura / cerca de: {ord.location.estructuraYCercania}
                            </p>
                          )}
                          {ord.location.indicacionesEdificio && (
                            <p className="text-[#543b6c]">
                              Indicaciones edificio: {ord.location.indicacionesEdificio}
                            </p>
                          )}
                        </>
                      )}
                      <p className="font-semibold text-[#9c44dc]">
                        Entrega: {ord.location.modoEntrega} · Pago: {ord.metodoPago}
                      </p>
                      {ord.bonoDomiciliarioCop > 0 && (
                        <p className="font-semibold text-[#166534]">
                          Bono al domiciliario: +{formatCop(ord.bonoDomiciliarioCop)} (
                          {ord.bonoNombre})
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between border-t border-[#d8c2ef] pt-3 text-sm">
                      <span className="text-xs text-[#543b6c]">Total pagado</span>
                      <span className="font-mono font-bold text-[#0a0a0a]">
                        {formatCop(ord.totalCop)}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* APARTADO 3: CARRITO */}
        {activeTab === 'carrito' && (
          <section aria-label="Carrito de compras" className="grid gap-6 lg:grid-cols-12">
            <div className="space-y-3 lg:col-span-7">
              <h1 className="font-display text-2xl font-semibold text-[#442c61]">Tu carrito</h1>

              {cart.length === 0 ? (
                <div className="rounded-[24px] border-2 border-[#bc8ae1]/60 bg-[#ffffff] p-10 text-center">
                  <ShoppingCart className="mx-auto h-11 w-11 text-[#9c44dc]" aria-hidden="true" />
                  <h2 className="mt-3 font-display text-lg font-semibold text-[#442c61]">
                    Tu carrito está vacío
                  </h2>
                  <p className="mt-1 text-xs text-[#543b6c]">
                    Explora el catálogo o pregúntale al Asistente IA para añadir productos.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('catalogo')}
                    className="mt-4 inline-flex items-center gap-2 rounded-[14px] bg-[#9c44dc] px-5 py-2.5 text-xs font-semibold text-[#ffffff] hover:bg-[#543b6c] cursor-pointer"
                  >
                    <Store className="h-5 w-5 stroke-[2.25]" aria-hidden="true" />
                    <span>Ir al catálogo</span>
                  </button>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.productId}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-[20px] border-2 border-[#d8c2ef] bg-[#ffffff] p-4 shadow-2xs"
                  >
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-[#9c44dc]">
                        {item.companyName}
                      </p>
                      <h2 className="font-display text-base font-semibold text-[#0a0a0a]">
                        {item.nombre}
                      </h2>
                      <p className="font-mono text-xs font-semibold text-[#543b6c]">
                        {formatCop(item.precioCop)} c/u
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="inline-flex items-center gap-1 rounded-[12px] border border-[#d8c2ef] bg-[#faf5ff] p-1">
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.productId, -1)}
                          aria-label={`Disminuir cantidad de ${item.nombre}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] border border-[#d8c2ef] bg-[#ffffff] text-[#442c61] hover:border-[#9c44dc] cursor-pointer"
                        >
                          <Minus className="h-4 w-4 stroke-[2.4]" aria-hidden="true" />
                        </button>
                        <span className="min-w-[24px] text-center font-mono text-xs font-bold">
                          {item.cantidad}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.productId, 1)}
                          aria-label={`Aumentar cantidad de ${item.nombre}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#442c61] text-[#ffffff] hover:bg-[#9c44dc] cursor-pointer"
                        >
                          <Plus className="h-4 w-4 stroke-[2.4]" aria-hidden="true" />
                        </button>
                      </div>

                      <span className="min-w-[84px] text-right font-mono text-sm font-bold text-[#0a0a0a]">
                        {formatCop(item.precioCop * item.cantidad)}
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          const comp = companies.find((c) => c.id === item.companyId) || null;
                          const prod = comp?.productos.find((p) => p.id === item.productId) || comp?.productos[0] || null;
                          if (comp && prod) {
                            setComplementTrigger({ company: comp, product: prod });
                          }
                        }}
                        className="inline-flex min-h-[34px] items-center gap-1.5 rounded-[10px] border border-[#bc8ae1] bg-[#faf5ff] px-3 py-1 text-[11px] font-semibold text-[#442c61] hover:border-[#9c44dc] hover:bg-[#f3e8ff] cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5 stroke-[2.4] text-[#9c44dc]" aria-hidden="true" />
                        <span>Bebidas / Porciones / Salsas / Otros</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleUpdateQty(item.productId, -item.cantidad)}
                        aria-label={`Eliminar ${item.nombre}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#d8c2ef] bg-[#ffffff] text-[#b91c1c] hover:border-[#dc2626] hover:bg-[#fef2f2] cursor-pointer"
                      >
                        <Trash2 className="h-4.5 w-4.5 stroke-[2.25]" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Columna derecha: Ubicación + Pago + Confirmar */}
            <aside className="space-y-4 lg:col-span-5">
              <div className="rounded-[24px] border-2 border-[#bc8ae1]/60 bg-[#ffffff] p-5 shadow-xs space-y-5">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-display text-base font-semibold text-[#442c61]">
                      Ubicación de entrega
                    </h2>
                    <button
                      type="button"
                      onClick={() => setShowLocationModal(true)}
                      className="inline-flex min-h-[36px] items-center gap-1.5 rounded-[10px] border border-[#bc8ae1] bg-[#faf5ff] px-3.5 py-1.5 text-xs font-semibold text-[#442c61] hover:border-[#9c44dc] cursor-pointer"
                    >
                      <MapPin className="h-4.5 w-4.5 stroke-[2.25] text-[#9c44dc]" aria-hidden="true" />
                      <span>{activeLocation ? 'Cambiar / Agregar' : 'Agregar ubicación'}</span>
                    </button>
                  </div>

                  {activeLocation ? (
                    <div className="mt-2.5 rounded-[16px] border border-[#bc8ae1] bg-[#faf5ff] p-3.5 text-xs space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="rounded-[5px] bg-[#442c61] px-2 py-0.5 text-[10px] font-semibold text-[#ffffff]">
                          {activeLocation.etiqueta}
                        </span>
                        <span className="font-semibold text-[#0a0a0a]">
                          {activeLocation.nombreLugar}
                        </span>
                      </div>
                      <p className="text-[#543b6c]">
                        {activeLocation.esConjuntoPrivado
                          ? `Conjunto ${activeLocation.nombreConjunto} · Apto ${activeLocation.apartamento}`
                          : activeLocation.direccion}
                      </p>
                      <p className="font-medium text-[#9c44dc]">
                        Entrega: {activeLocation.modoEntrega}
                      </p>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowLocationModal(true)}
                      className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-[16px] border border-dashed border-[#9c44dc] bg-[#faf5ff] px-4 py-4 text-xs font-semibold text-[#442c61] hover:bg-[#f3e8ff] cursor-pointer"
                    >
                      <MapPin className="h-5 w-5 stroke-[2.25] text-[#9c44dc]" aria-hidden="true" />
                      <span>Agregar una ubicación para pedir</span>
                    </button>
                  )}
                </div>

                <div>
                  <label htmlFor="pago-select" className="block text-xs font-semibold text-[#442c61]">
                    Método de pago
                  </label>
                  <select
                    id="pago-select"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mt-1.5 h-10 w-full rounded-[14px] border border-[#d8c2ef] bg-[#faf5ff] px-3 text-xs font-medium text-[#0a0a0a] focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Bono obligatorio al domiciliario ($300 COP sí o sí, con opciones mayores para motivar al repartidor) */}
                <div className="space-y-3 border-t border-[#d8c2ef] pt-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="flex items-center gap-1.5 font-display text-sm font-semibold text-[#442c61]">
                        <HeartHandshake className="h-5 w-5 text-[#9c44dc]" aria-hidden="true" />
                        <span>Bono al domiciliario (mín. $ 300 obligatorio)</span>
                      </h3>
                      <p className="text-[11px] text-[#543b6c]">
                        Sí o sí incluye $ 300 COP, y puedes elegir más para motivar al domiciliario. El 100% es para él.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {COURIER_BONUS_TIERS.map((tier) => {
                      const active = selectedBonusCop === tier.amountCop;
                      const TierIcon = tier.icon;
                      return (
                        <button
                          key={tier.amountCop}
                          type="button"
                          onClick={() => setSelectedBonusCop(tier.amountCop)}
                          className={`vinchi-transition flex flex-col items-start justify-between rounded-[14px] border p-2.5 text-left cursor-pointer ${
                            active
                              ? 'border-[#9c44dc] bg-[#442c61] text-[#ffffff] shadow-xs'
                              : 'border-[#d8c2ef] bg-[#faf5ff] text-[#0a0a0a] hover:border-[#9c44dc]'
                          }`}
                        >
                          <div className="flex w-full items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] ${
                                  active
                                    ? 'bg-[#ffffff]/15 text-[#fde68a]'
                                    : 'bg-[#9c44dc]/12 text-[#9c44dc]'
                                }`}
                              >
                                <TierIcon className="h-4 w-4 stroke-[2.25]" aria-hidden="true" />
                              </span>
                              <span className="font-mono text-xs font-bold">
                                {formatCop(tier.amountCop)}
                              </span>
                            </div>
                            {tier.amountCop === 300 && (
                              <span
                                className={`text-[10px] font-semibold ${
                                  active ? 'text-[#fde68a]' : 'text-[#9c44dc]'
                                }`}
                              >
                                Obligatorio
                              </span>
                            )}
                          </div>
                          <p
                            className={`mt-1.5 text-xs font-semibold leading-tight ${
                              active ? 'text-[#ffffff]' : 'text-[#442c61]'
                            }`}
                          >
                            {tier.nombre}
                          </p>
                          <p
                            className={`mt-0.5 text-[10px] leading-snug ${
                              active ? 'text-[#e9d5ff]' : 'text-[#543b6c]'
                            }`}
                          >
                            {tier.mensaje}
                          </p>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedBonusCop(300)}
                    className="inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-[12px] border border-dashed border-[#bc8ae1] bg-[#faf5ff] px-4 py-2.5 text-xs font-semibold text-[#442c61] hover:bg-[#f3e8ff] cursor-pointer"
                  >
                    <ShieldCheck className="h-5 w-5 shrink-0 stroke-[2.25] text-[#9c44dc]" aria-hidden="true" />
                    <span>Aplicar bono mínimo obligatorio ($ 300 COP sí o sí)</span>
                  </button>
                </div>

                <div className="space-y-2 border-t border-[#d8c2ef] pt-4 text-xs">
                  <div className="flex justify-between text-[#543b6c]">
                    <span>Productos</span>
                    <span className="font-mono font-semibold text-[#0a0a0a]">
                      {formatCop(cartSubtotalCop)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#543b6c]">
                    <span>
                      {activeLocation?.modoEntrega === 'Yo mismo lo recojo'
                        ? 'Tarifa fija · Recoger en tienda ($ 1.000 c/u)'
                        : 'Tarifa fija de domicilio'}
                    </span>
                    <span className="font-mono font-semibold text-[#0a0a0a]">
                      {formatCop(cartDeliveryCop)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#442c61] font-medium">
                    <span>Bono al domiciliario ({selectedBonus.nombre})</span>
                    <span className="font-mono font-semibold text-[#442c61]">
                      {formatCop(selectedBonus.amountCop)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#166534] font-semibold">
                    <span>Comisión Vinchi (para siempre)</span>
                    <span className="font-mono">$ 0</span>
                  </div>
                  <div className="flex justify-between border-t border-[#d8c2ef] pt-3 text-base font-bold text-[#442c61]">
                    <span>Total</span>
                    <span className="font-mono text-[#442c61]">
                      {formatCop(cartSubtotalCop + cartDeliveryCop + selectedBonus.amountCop)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isBusy || cart.length === 0}
                  onClick={() => void handleConfirmOrder()}
                  className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[18px] bg-[#9c44dc] px-5 text-sm font-semibold text-[#ffffff] hover:bg-[#543b6c] disabled:opacity-45 cursor-pointer"
                >
                  <Check className="h-5 w-5 stroke-[2.5]" aria-hidden="true" />
                  <span>{isBusy ? 'Enviando pedido...' : 'Confirmar y enviar pedido'}</span>
                </button>
              </div>
            </aside>
          </section>
        )}

        {/* APARTADO 5: PERFIL (Sin gestión de ubicaciones, enfocada únicamente en datos personales) */}
        {activeTab === 'perfil' && (
          <section aria-label="Perfil del cliente" className="mx-auto max-w-2xl">
            <form
              onSubmit={handleSaveProfile}
              className="space-y-5 rounded-[24px] border-2 border-[#bc8ae1]/60 bg-[#ffffff] p-6 shadow-xs"
            >
              <div className="flex flex-wrap items-center gap-4 border-b border-[#d8c2ef] pb-5">
                <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-[#9c44dc] bg-[#faf5ff]">
                  {profAvatar ? (
                    <img
                      src={profAvatar}
                      alt={workspace?.profile.nombre || 'Foto de perfil'}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center font-display text-2xl font-bold text-[#442c61]">
                      {profPrimerNombre.slice(0, 1).toUpperCase() || 'V'}
                    </span>
                  )}
                </div>
                <div>
                  <h1 className="font-display text-xl font-semibold text-[#442c61]">
                    Mi perfil de comprador
                  </h1>
                  <p className="text-xs text-[#543b6c]">{workspace?.profile.email}</p>
                  <label className="mt-2 inline-flex items-center gap-2 rounded-[12px] border border-[#d8c2ef] bg-[#faf5ff] px-3.5 py-2 text-xs font-semibold text-[#442c61] hover:border-[#9c44dc] hover:bg-[#ffffff] cursor-pointer">
                    <Camera className="h-5 w-5 stroke-[2.25] text-[#9c44dc]" aria-hidden="true" />
                    <span>Cambiar foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="sr-only"
                    />
                  </label>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="cli-primer-nombre"
                    className="block text-xs font-medium text-[#442c61]"
                  >
                    Primer nombre <span className="text-[#9c44dc]">*</span>
                  </label>
                  <input
                    id="cli-primer-nombre"
                    type="text"
                    required
                    value={profPrimerNombre}
                    onChange={(e) => setProfPrimerNombre(e.target.value)}
                    className="mt-1 h-10 w-full rounded-[14px] border border-[#d8c2ef] bg-[#faf5ff] px-3.5 text-sm text-[#0a0a0a] focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="cli-segundo-nombre"
                    className="block text-xs font-medium text-[#442c61]"
                  >
                    Segundo nombre <span className="text-[#6b5a82]">(opcional)</span>
                  </label>
                  <input
                    id="cli-segundo-nombre"
                    type="text"
                    value={profSegundoNombre}
                    onChange={(e) => setProfSegundoNombre(e.target.value)}
                    className="mt-1 h-10 w-full rounded-[14px] border border-[#d8c2ef] bg-[#faf5ff] px-3.5 text-sm text-[#0a0a0a] focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="cli-primer-apellido"
                    className="block text-xs font-medium text-[#442c61]"
                  >
                    Primer apellido <span className="text-[#9c44dc]">*</span>
                  </label>
                  <input
                    id="cli-primer-apellido"
                    type="text"
                    required
                    value={profPrimerApellido}
                    onChange={(e) => setProfPrimerApellido(e.target.value)}
                    className="mt-1 h-10 w-full rounded-[14px] border border-[#d8c2ef] bg-[#faf5ff] px-3.5 text-sm text-[#0a0a0a] focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="cli-segundo-apellido"
                    className="block text-xs font-medium text-[#442c61]"
                  >
                    Segundo apellido <span className="text-[#6b5a82]">(opcional)</span>
                  </label>
                  <input
                    id="cli-segundo-apellido"
                    type="text"
                    value={profSegundoApellido}
                    onChange={(e) => setProfSegundoApellido(e.target.value)}
                    className="mt-1 h-10 w-full rounded-[14px] border border-[#d8c2ef] bg-[#faf5ff] px-3.5 text-sm text-[#0a0a0a] focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="cli-telefono" className="block text-xs font-medium text-[#442c61]">
                  Teléfono de contacto
                </label>
                <input
                  id="cli-telefono"
                  type="tel"
                  value={profTelefono}
                  onChange={(e) => setProfTelefono(e.target.value)}
                  placeholder="+57 300 000 0000"
                  className="mt-1 h-10 w-full rounded-[14px] border border-[#d8c2ef] bg-[#faf5ff] px-3.5 text-sm text-[#0a0a0a] focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isBusy}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[16px] bg-[#9c44dc] px-6 text-xs font-semibold text-[#ffffff] hover:bg-[#543b6c] disabled:opacity-50 cursor-pointer"
              >
                <Save className="h-5 w-5 stroke-[2.25]" aria-hidden="true" />
                <span>{isBusy ? 'Guardando...' : 'Guardar cambios de perfil'}</span>
              </button>
            </form>
          </section>
        )}
      </main>

      {/* Modal de Perfil Completo de Empresa y toda su carta */}
      <CompanyProfileModal
        company={profileCompany}
        cartQuantities={cartQuantities}
        totalCartItems={totalCartItems}
        cartSubtotalCop={cartSubtotalCop}
        onClose={() => setProfileCompany(null)}
        onAddProduct={handleAddToCart}
        onUpdateQty={handleUpdateQty}
        onProceedToPay={() => {
          setProfileCompany(null);
          setActiveTab('carrito');
        }}
      />

      {/* Modal automático de complementos al comprar (Bebidas, Porciones si vende, Salsas y Otros) */}
      <CompanyComplementModal
        company={complementTrigger?.company || null}
        addedProduct={complementTrigger?.product || null}
        cartQuantities={cartQuantities}
        totalCartItems={totalCartItems}
        cartSubtotalCop={cartSubtotalCop}
        onClose={() => setComplementTrigger(null)}
        onAddProduct={handleAddToCart}
        onUpdateQty={handleUpdateQty}
        onGoToCart={() => {
          setComplementTrigger(null);
          setActiveTab('carrito');
        }}
      />

      {/* Modal de Ubicaciones (máx 6 + lógica conjunto privado) */}
      <LocationManagerModal
        open={showLocationModal}
        locations={locations}
        selectedLocationId={selectedLocationId}
        maxLocations={workspace?.maxLocations || 6}
        isBusy={isBusy}
        onClose={() => setShowLocationModal(false)}
        onSelectActive={(id) => {
          setSelectedLocationId(id);
          void handleUpdateLocation(id, { setAsDefault: true });
        }}
        onCreateLocation={handleCreateLocation}
        onUpdateLocation={handleUpdateLocation}
        onDeleteLocation={handleDeleteLocation}
      />

      {/* Botón flotante IA siempre habilitado para la cuenta activa */}
      <ClienteAiChatbot
        isAuthenticated
        aiQuota={workspace?.aiQuota || null}
        activeFilter={activeFilter}
        cartQuantities={cartQuantities}
        onAddToCart={handleAddToCart}
        onQuotaUpdated={(q) => setWorkspace((prev) => (prev ? { ...prev, aiQuota: q } : prev))}
      />
    </div>
  );
}
