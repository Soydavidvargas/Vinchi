export type VinchiRole =
  | 'cliente'
  | 'empresario_en_espera'
  | 'comercio'
  | 'agente'
  | 'repartidor'
  | 'superadmin';

export type VinchiRoute =
  | '/(public)'
  | '/(auth)/login'
  | '/(portal)/explorar-agentes'
  | '/(portal)/postular-agente'
  | '/(portal)/postular-domicilio'
  | '/(dashboards)/admin'
  | '/(dashboards)/comercio'
  | '/(dashboards)/agente'
  | '/(dashboards)/repartidor'
  | '/(public)/cliente';

export type LoginEntryContext =
  | 'general'
  | 'pedir_ahora'
  | 'explorar_agentes'
  | 'crear_espacio'
  | 'trabajar'
  | 'postular_agente'
  | 'entrar_agente'
  | 'postular_domicilio'
  | 'entrar_domicilio';

export type AgentApplicationStatus = 'none' | 'pending' | 'approved' | 'rejected';
export type CourierApplicationStatus = 'none' | 'approved';

export interface AuthUser {
  id: string;
  nombre: string;
  primerNombre: string;
  segundoNombre?: string;
  primerApellido: string;
  segundoApellido?: string;
  telefono?: string;
  avatarDataUrl?: string;
  negocioNombre?: string;
  email: string;
  role: VinchiRole;
  businessActivated: boolean;
  agentApplicationStatus?: AgentApplicationStatus;
  courierApplicationStatus?: CourierApplicationStatus;
}

export type ActivationMode = 'virtual' | 'presencial' | null;

export type AgentRequestStatus =
  | 'unpaid'
  | 'paid_ready'
  | 'pending_agent_decision'
  | 'rejected_by_agent'
  | 'matched'
  | 'activated_virtual'
  | 'awaiting_visit_payment'
  | 'awaiting_visit_completion'
  | 'activated_presencial'
  | 'business_opened';

export interface PortalChatMessage {
  id: string;
  requestId: string;
  senderId: string;
  senderName: string;
  senderRole: 'cliente' | 'agente' | 'sistema';
  text: string;
  createdAt: string;
}

export interface PortalEmailNotice {
  id: string;
  toEmail: string;
  subject: string;
  body: string;
  sentAt: string;
}

export interface PortalCallState {
  status: 'idle' | 'ringing' | 'connected';
  initiatorRole?: 'cliente' | 'agente';
  startedAt?: string;
}

export interface AgentRequestRecord {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  businessName: string;
  searchPaid: boolean;
  searchPaymentMethod?: string;
  assignedAgentId?: string;
  assignedAgentName?: string;
  assignedAgentEmail?: string;
  status: AgentRequestStatus;
  activationMode: ActivationMode;
  activationToken?: string;
  tokenUnlocked: boolean;
  requiresVisitWarning: boolean;
  visitPaid: boolean;
  visitCompleted: boolean;
  agentEarningsCop: number;
  vinchiFeeCop: number;
  announcementTitle?: string;
  announcementBody?: string;
  emailNotice?: PortalEmailNotice;
  callState: PortalCallState;
  updatedAt: string;
}

export interface PortalBootstrapState {
  request: AgentRequestRecord | null;
  messages: PortalChatMessage[];
  availableAgentsCount: number;
  user?: AuthUser;
}

export interface AgentProfileDetails {
  nombre: string;
  primerNombre: string;
  segundoNombre?: string;
  primerApellido: string;
  segundoApellido?: string;
  avatarDataUrl?: string;
  email: string;
  telefono: string;
  departamento: string;
  municipio: string;
  horario: string;
  bio: string;
}

export interface AgentWalletCard {
  id: string;
  alias: string;
  banco: string;
  ultimos4: string;
  titular: string;
  expiracion: string;
  tipo: 'Debito' | 'Credito' | 'Cuenta Bancaria';
  predeterminada: boolean;
}

export interface AgentWithdrawalRecord {
  id: string;
  montoCop: number;
  cardLabel: string;
  tipo: 'Manual' | 'Automatico Mensual';
  estado: 'Procesado' | 'Programado';
  createdAt: string;
}

export interface AgentWalletState {
  saldoDisponibleCop: number;
  totalRetiradoCop: number;
  autoMonthlyEnabled: boolean;
  autoMonthlyDay: number;
  cards: AgentWalletCard[];
  withdrawals: AgentWithdrawalRecord[];
}

export interface AgentDetailedStats {
  clientesAceptados: number;
  clientesNegados: number;
  activacionesVirtuales: number;
  activacionesPresenciales: number;
  horasTrabajadasMes: number;
  diasActivosMes: number;
}

export interface AgentWorkspaceState {
  disponible: boolean;
  kpis: AgentKpis;
  vinchiTotalCop: number;
  profile: AgentProfileDetails;
  stats: AgentDetailedStats;
  wallet: AgentWalletState;
  requests: AgentRequestRecord[];
  messagesByRequest: Record<string, PortalChatMessage[]>;
}

export interface AgentApplicationRecord {
  id: string;
  userId: string;
  applicantName: string;
  applicantEmail: string;
  status: Exclude<AgentApplicationStatus, 'none'>;
  answers: Record<string, string>;
  cedulaNumero: string;
  cedulaExpedicion: string;
  cedulaArchivoNombre: string;
  hojaVidaArchivoNombre: string;
  experienciaResumen: string;
  departamento: string;
  municipio: string;
  direccionCasa: string;
  barrio: string;
  facialVerified: boolean;
  facialSnapshotDataUrl?: string;
  submittedAt: string;
  reviewedAt?: string;
  authorizationNotice?: string;
}

// --- DOMICILIO / REPARTIDOR TYPES ---
export type CourierDeliveryStep = 'to_company' | 'to_client' | 'delivered';

export interface CourierChatMessage {
  id: string;
  orderId: string;
  channel: 'empresa' | 'cliente';
  senderRole: 'domiciliario' | 'empresa' | 'cliente' | 'sistema';
  senderName: string;
  text: string;
  createdAt: string;
}

export type DeliveryHandoffMode =
  | 'Recibir a la mano'
  | 'Dejar en la puerta'
  | 'Yo mismo lo recojo';

export interface ClientDeliveryLocation {
  id: string;
  nombreLugar: string;
  etiqueta: string;
  esConjuntoPrivado: boolean;
  nombreConjunto?: string;
  apartamento?: string;
  direccion?: string;
  estructuraYCercania?: string;
  indicacionesEdificio?: string;
  modoEntrega: DeliveryHandoffMode;
  predeterminada: boolean;
  createdAt: string;
}

export interface CourierDeliveryOrder {
  id: string;
  codigoOrden: string;
  step: CourierDeliveryStep;
  empresaNombre: string;
  empresaDireccion: string;
  empresaBarrio: string;
  clienteNombre: string;
  clienteTelefono: string;
  clienteDireccion: string;
  clienteBarrio: string;
  comidaResumen: string;
  pagoDomicilioCop: number;
  distanciaEmpresaKm: number;
  distanciaClienteKm: number;
  pickupCodeExpected: string;
  deliveryCodeExpected: string;
  pickupVerified: boolean;
  deliveryVerified: boolean;
  deliveryDetails?: ClientDeliveryLocation;
  bonoDomiciliarioCop?: number;
  bonoNombre?: string;
  createdAt: string;
}

export interface CourierCompanyContract {
  id: string;
  empresaNombre: string;
  ciudad: string;
  categoria: string;
  tarifaBaseCop: number;
  estado: 'Contratado' | 'Postulado' | 'Disponible';
}

export interface CourierProfileDetails {
  nombre: string;
  primerNombre: string;
  segundoNombre?: string;
  primerApellido: string;
  segundoApellido?: string;
  avatarDataUrl?: string;
  email: string;
  telefono: string;
  departamento: string;
  municipio: string;
  direccionCasa: string;
  vehiculo: string;
}

export interface CourierDetailedStats {
  enviadosTotal: number;
  entregadosTotal: number;
  gananciasTotalesCop: number;
  entregasHoy: number;
}

export interface CourierWorkspaceState {
  activo: boolean;
  togglesUsedToday: number;
  maxTogglesPerDay: number;
  vinchiAutoContract: boolean;
  profile: CourierProfileDetails;
  stats: CourierDetailedStats;
  wallet: AgentWalletState;
  activeOrder: CourierDeliveryOrder | null;
  chatMessages: CourierChatMessage[];
  companies: CourierCompanyContract[];
  completedHistory: {
    id: string;
    codigoOrden: string;
    empresaNombre: string;
    pagoDomicilioCop: number;
    completedAt: string;
  }[];
}

export interface CourierApplicationRecord {
  id: string;
  userId: string;
  applicantName: string;
  applicantEmail: string;
  answers: Record<string, string>;
  cedulaNumero: string;
  cedulaExpedicion: string;
  cedulaArchivoNombre: string;
  departamento: string;
  municipio: string;
  direccionCasa: string;
  barrio: string;
  telefono: string;
  vehiculo: string;
  facialVerified: boolean;
  facialSnapshotDataUrl?: string;
  submittedAt: string;
}

export interface SaaSPlan {
  id: 'basico' | 'premium' | 'ultra';
  name: string;
  priceCop: number;
  annualPriceCop?: number;
  annualSavingsLabel?: string;
  annualSubnote?: string;
  billingCycle: string;
  targetAudience: string;
  description: string;
  limits: string[];
  excluded?: string[];
  featuredCapability?: string;
  badgeLabel?: string;
  highlighted?: boolean;
}

export interface SuperadminKpis {
  totalComercios: number;
  totalAgentes: number;
  totalDomiciliarios: number;
  mrrCop: number;
}

export interface ComercioSummary {
  id: string;
  nombre: string;
  plan: 'Básico' | 'Premium' | 'Ultra';
  ciudad: string;
  estado: 'Activo' | 'Pendiente Setup' | 'Suspendido';
  pedidosMes: number;
}

export interface OrderItem {
  id: string;
  nombre: string;
  cantidad: number;
  precioUnitarioCop: number;
}

export interface OrderRecord {
  id: string;
  codigo: string;
  mesaOOrigen: string;
  clienteNombre: string;
  hora: string;
  estado: 'Pendiente' | 'En preparación' | 'Lista para cobro' | 'Cobrada' | 'Anulada';
  totalCop: number;
  items: OrderItem[];
  deliveryDetails?: ClientDeliveryLocation;
  empresaId?: string;
  empresaNombre?: string;
  bonoDomiciliarioCop?: number;
  bonoNombre?: string;
}

export interface AgentKpis {
  comerciosVinculados: number;
  setupFeesCobrados: number;
  comisionAcumuladaCop: number;
  tasaConversion: string;
}

export interface RepartidorShiftState {
  turnoActivo: boolean;
  ultimoCheckIn?: string;
  pedidoAsignado?: {
    codigo: string;
    comercio: string;
    direccionEntrega: string;
    distanciaKm: string;
  };
}

export interface MenuCatalogItem {
  id: string;
  nombre: string;
  categoria: string;
  descripcion: string;
  precioCop: number;
  soporta3D: boolean;
}

// --- CLIENTE PORTAL PRIVADO TYPES ---
export type ClientQuickCategory =
  | 'Bebidas'
  | 'Comida rápida'
  | 'Vegana'
  | 'Comida Asiática'
  | 'Carnes'
  | 'Postres'
  | 'Comida locales';

export type ClientCarouselTag =
  | 'Carnes'
  | 'Comida locales'
  | 'Comida de marcas'
  | 'Comida Asiática'
  | 'Bebidas y Café'
  | 'Vegana y Saludable';

export type ClientFoodImageKey =
  | 'ribeye'
  | 'burger'
  | 'ramen'
  | 'bandeja'
  | 'vegano'
  | 'cafe';

export type ClientCompanyLogoIcon =
  | 'flame'
  | 'soup'
  | 'utensils'
  | 'leaf'
  | 'burger'
  | 'steak'
  | 'sushi'
  | 'coffee'
  | 'cake'
  | 'store';

export type ClientMenuSection =
  | 'Principal'
  | 'Bebidas'
  | 'Porciones'
  | 'Salsas'
  | 'Otros';

export interface ClientCatalogProduct {
  id: string;
  companyId: string;
  companyName: string;
  nombre: string;
  descripcion: string;
  precioCop: number;
  categoriaFiltro: ClientQuickCategory;
  seccionMenu?: ClientMenuSection;
  etiquetaPopular: string;
  tiempoPrepMin: number;
  destacado?: boolean;
  acentoColor: string;
  imagenKey?: ClientFoodImageKey;
}

export interface ClientCompanyCatalog {
  id: string;
  nombre: string;
  ciudad: string;
  barrio: string;
  direccionLocal: string;
  descripcion: string;
  tiempoEntregaMin: number;
  costoDomicilioCop: number;
  calificacion: string;
  pagadoAnuncio: boolean;
  etiquetasCarrusel: ClientCarouselTag[];
  categoriasFiltro: ClientQuickCategory[];
  bannerTone: string;
  emblemaIniciales: string;
  logoIcon?: ClientCompanyLogoIcon;
  logoDataUrl?: string;
  imagenKey?: ClientFoodImageKey;
  esUltra?: boolean;
  foroPromo?: string;
  likesIniciales?: number;
  productos: ClientCatalogProduct[];
}

export interface ClientCartItem {
  productId: string;
  companyId: string;
  companyName: string;
  nombre: string;
  precioCop: number;
  cantidad: number;
  acentoColor: string;
  imagenKey?: ClientFoodImageKey;
}

export interface ClientPortalOrder {
  id: string;
  codigo: string;
  empresaId: string;
  empresaNombre: string;
  empresaDireccion: string;
  estado: 'Recibido en tienda' | 'En preparación' | 'En camino' | 'Listo para recoger' | 'Entregado';
  metodoPago: string;
  subtotalCop: number;
  costoDomicilioCop: number;
  bonoDomiciliarioCop: number;
  bonoNombre: string;
  totalCop: number;
  items: OrderItem[];
  location: ClientDeliveryLocation;
  enviadoADomiciliario: boolean;
  enviadoAEmpresa: boolean;
  createdAt: string;
}

export interface ClientProfileDetails {
  nombre: string;
  primerNombre: string;
  segundoNombre?: string;
  primerApellido: string;
  segundoApellido?: string;
  email: string;
  telefono: string;
  avatarDataUrl?: string;
}

export interface ClientAiQuotaState {
  monthKey: string;
  monthlyLimit: number;
  usesThisMonth: number;
  adBonusUses: number;
  remainingUses: number;
  isClientPremium: boolean;
  premiumMonthlyPriceCop: number;
  premiumSince?: string;
}

export interface ClientWorkspaceState {
  profile: ClientProfileDetails;
  locations: ClientDeliveryLocation[];
  maxLocations: number;
  companies: ClientCompanyCatalog[];
  ordersInProgress: ClientPortalOrder[];
  aiQuota: ClientAiQuotaState;
}

export interface ClientAiChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  recommendations?: ClientCatalogProduct[];
  createdAt: string;
}

export type BusinessPlanId = 'basico' | 'premium' | 'ultra';

export interface BusinessPermissions {
  cobrarOrdenes: boolean;
  anularOrdenes: boolean;
  gestionarDomicilios: boolean;
  editarPerfilYMenu: boolean;
  verEstadisticas: boolean;
  crearAnuncios: boolean;
  crearQr: boolean;
  gestionarEquipo: boolean;
}

export interface BusinessTeamMember {
  id: string;
  nombre: string;
  cargo: string;
  pinAcceso: string;
  activo: boolean;
  permisos: BusinessPermissions;
  createdAt: string;
}

export interface BusinessQrCode {
  id: string;
  nombre: string;
  mesaORef: string;
  urlDestino: string;
  qrDataUrl: string;
  createdAt: string;
}

export interface BusinessAdCampaign {
  id: string;
  titulo: string;
  mensaje: string;
  montoPagadoCop: number;
  metodoPago: string;
  incluidoEnPlan: boolean;
  activo: boolean;
  createdAt: string;
}

export interface BusinessProfileSettings {
  negocioNombre: string;
  descripcion: string;
  ciudad: string;
  barrio: string;
  direccionLocal: string;
  tiempoEntregaMin: number;
  costoDomicilioCop: number;
  logoIcon: ClientCompanyLogoIcon;
  bannerTone: string;
  logoDataUrl?: string;
}

export interface BusinessWorkspaceState {
  businessId: string;
  plan: BusinessPlanId;
  planSelected: boolean;
  planBillingCycle: 'mensual' | 'anual';
  planPaymentMethod?: string;
  planActivatedAt?: string;
  profile: BusinessProfileSettings;
  ads: BusinessAdCampaign[];
  qrCodes: BusinessQrCode[];
  teamMembers: BusinessTeamMember[];
}
