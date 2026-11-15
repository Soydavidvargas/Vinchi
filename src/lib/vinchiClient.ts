import type {
  ActivationMode,
  AgentApplicationRecord,
  AgentProfileDetails,
  AgentRequestRecord,
  AgentWalletState,
  AgentWorkspaceState,
  AuthUser,
  BusinessPermissions,
  BusinessPlanId,
  BusinessProfileSettings,
  BusinessWorkspaceState,
  ClientAiQuotaState,
  ClientCatalogProduct,
  ClientPortalOrder,
  ClientProfileDetails,
  ClientWorkspaceState,
  CourierApplicationRecord,
  CourierProfileDetails,
  CourierWorkspaceState,
  DeliveryHandoffMode,
  OrderRecord,
  PortalBootstrapState,
  PortalChatMessage,
  VinchiRole,
} from '@/src/types/vinchi';

const TOKEN_STORAGE_KEY = 'vinchi_auth_token';

export function getStoredToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignorar en entornos sin almacenamiento local
  }
}

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(path, {
    ...options,
    headers,
  });

  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    throw new Error(data.error || 'No fue posible completar la solicitud.');
  }
  return data;
}

export async function registerAccount(payload: {
  primerNombre: string;
  segundoNombre?: string;
  primerApellido: string;
  segundoApellido?: string;
  negocioNombre?: string;
  email: string;
  password: string;
  intendedRole?: 'cliente' | 'empresario_en_espera';
  entryContext?: string;
}): Promise<{ ok: boolean; email: string; message: string }> {
  return apiRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function loginAccount(payload: {
  email: string;
  password: string;
  expectedRole?: VinchiRole;
}): Promise<{ token: string; user: AuthUser }> {
  const res = await apiRequest<{ token: string; user: AuthUser }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  setStoredToken(res.token);
  return res;
}

export async function loginWithStaffToken(
  staffToken: string
): Promise<{ token: string; user: AuthUser }> {
  const res = await apiRequest<{ token: string; user: AuthUser }>('/api/auth/staff-login', {
    method: 'POST',
    body: JSON.stringify({ staffToken }),
  });
  setStoredToken(res.token);
  return res;
}

export async function loginWithBiometricCourier(): Promise<{ token: string; user: AuthUser }> {
  const res = await apiRequest<{ token: string; user: AuthUser }>('/api/auth/biometric-login', {
    method: 'POST',
  });
  setStoredToken(res.token);
  return res;
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  const token = getStoredToken();
  if (!token) return null;
  try {
    const res = await apiRequest<{ user: AuthUser }>('/api/auth/me');
    return res.user;
  } catch {
    setStoredToken(null);
    return null;
  }
}

export async function logoutAccount(): Promise<void> {
  try {
    await apiRequest('/api/auth/logout', { method: 'POST' });
  } catch {
    // Ignorar error de red al cerrar sesión
  } finally {
    setStoredToken(null);
  }
}

// --- Postulación de Agente ---
export async function fetchMyAgentApplication(): Promise<{
  application: AgentApplicationRecord | null;
  user: AuthUser;
}> {
  return apiRequest('/api/agent-application/me');
}

export async function submitAgentApplication(payload: {
  primerNombre: string;
  segundoNombre?: string;
  primerApellido: string;
  segundoApellido?: string;
  telefono?: string;
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
}): Promise<{ application: AgentApplicationRecord; user: AuthUser }> {
  return apiRequest('/api/agent-application/submit', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchAdminAgentApplications(): Promise<{
  applications: AgentApplicationRecord[];
}> {
  return apiRequest('/api/admin/agent-applications');
}

export async function reviewAdminAgentApplication(
  id: string,
  decision: 'approved' | 'rejected'
): Promise<{ application: AgentApplicationRecord }> {
  return apiRequest(`/api/admin/agent-applications/${id}/review`, {
    method: 'POST',
    body: JSON.stringify({ decision }),
  });
}

// --- Postulación y Espacio de Domicilio ---
export async function fetchMyCourierApplication(): Promise<{
  application: CourierApplicationRecord | null;
  user: AuthUser;
}> {
  return apiRequest('/api/courier-application/me');
}

export async function submitCourierApplication(payload: {
  primerNombre: string;
  segundoNombre?: string;
  primerApellido: string;
  segundoApellido?: string;
  telefono: string;
  vehiculo: string;
  answers: Record<string, string>;
  cedulaNumero: string;
  cedulaExpedicion: string;
  cedulaArchivoNombre: string;
  departamento: string;
  municipio: string;
  direccionCasa: string;
  barrio: string;
  facialVerified: boolean;
  facialSnapshotDataUrl?: string;
}): Promise<{
  ok: boolean;
  message: string;
  application: CourierApplicationRecord;
  user: AuthUser;
}> {
  return apiRequest('/api/courier-application/submit', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchCourierWorkspace(): Promise<CourierWorkspaceState> {
  return apiRequest('/api/courier/workspace');
}

export async function toggleCourierActive(): Promise<CourierWorkspaceState> {
  return apiRequest('/api/courier/toggle-active', { method: 'POST' });
}

export async function requestNewCourierOrder(): Promise<CourierWorkspaceState> {
  return apiRequest('/api/courier/new-order', { method: 'POST' });
}

export async function advanceCourierDistance(
  distanciaKm?: number
): Promise<CourierWorkspaceState> {
  return apiRequest('/api/courier/advance-distance', {
    method: 'POST',
    body: JSON.stringify(distanciaKm !== undefined ? { distanciaKm } : {}),
  });
}

export async function verifyCourierPickupCode(code: string): Promise<CourierWorkspaceState> {
  return apiRequest('/api/courier/verify-pickup-code', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

export async function verifyCourierDeliveryCode(
  code: string
): Promise<CourierWorkspaceState & { completedMessage?: string }> {
  return apiRequest('/api/courier/verify-delivery-code', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

export async function sendCourierChatMessage(text: string): Promise<CourierWorkspaceState> {
  return apiRequest('/api/courier/chat', {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}

export async function updateCourierProfile(
  profile: Partial<CourierProfileDetails>
): Promise<{ profile: CourierProfileDetails; user: AuthUser }> {
  return apiRequest('/api/courier/profile', {
    method: 'PUT',
    body: JSON.stringify(profile),
  });
}

export async function addCourierWalletCard(payload: {
  alias: string;
  banco: string;
  numero: string;
  titular: string;
  expiracion: string;
  tipo: 'Debito' | 'Credito' | 'Cuenta Bancaria';
  predeterminada?: boolean;
}): Promise<{ wallet: AgentWalletState }> {
  return apiRequest('/api/courier/wallet/cards', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deleteCourierWalletCard(cardId: string): Promise<{ wallet: AgentWalletState }> {
  return apiRequest(`/api/courier/wallet/cards/${cardId}`, {
    method: 'DELETE',
  });
}

export async function updateCourierAutoPay(payload: {
  autoMonthlyEnabled: boolean;
  autoMonthlyDay: number;
  defaultCardId?: string;
}): Promise<{ wallet: AgentWalletState }> {
  return apiRequest('/api/courier/wallet/autopay', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function withdrawCourierFunds(payload: {
  montoCop: number;
  cardId?: string;
}): Promise<{ wallet: AgentWalletState }> {
  return apiRequest('/api/courier/wallet/withdraw', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function toggleVinchiAutoContract(
  enabled: boolean
): Promise<CourierWorkspaceState> {
  return apiRequest('/api/courier/vinchi-auto-contract', {
    method: 'POST',
    body: JSON.stringify({ enabled }),
  });
}

export async function applyCourierCompany(companyId: string): Promise<CourierWorkspaceState> {
  return apiRequest('/api/courier/apply-company', {
    method: 'POST',
    body: JSON.stringify({ companyId }),
  });
}

// --- Portal Cliente ---
export async function fetchPortalState(): Promise<PortalBootstrapState> {
  return apiRequest('/api/portal/state');
}

export async function paySearchFee(paymentMethod: string): Promise<PortalBootstrapState> {
  return apiRequest('/api/portal/pay-search', {
    method: 'POST',
    body: JSON.stringify({ paymentMethod }),
  });
}

export async function matchAvailableAgent(): Promise<PortalBootstrapState> {
  return apiRequest('/api/portal/match-agent', {
    method: 'POST',
  });
}

export async function sendClientMessage(text: string): Promise<{ message: PortalChatMessage }> {
  return apiRequest('/api/portal/messages', {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}

export async function triggerClientCall(
  action: 'start' | 'answer' | 'end'
): Promise<{ request: AgentRequestRecord }> {
  return apiRequest('/api/portal/call', {
    method: 'POST',
    body: JSON.stringify({ action }),
  });
}

export async function payVisitFee(paymentMethod: string): Promise<PortalBootstrapState> {
  return apiRequest('/api/portal/pay-visit', {
    method: 'POST',
    body: JSON.stringify({ paymentMethod }),
  });
}

export async function verifyBusinessToken(
  token: string
): Promise<{ ok: boolean; user: AuthUser; request: AgentRequestRecord }> {
  return apiRequest('/api/portal/verify-token', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

// --- Portal Agente ---
export async function fetchAgentWorkspace(): Promise<AgentWorkspaceState> {
  return apiRequest('/api/agent/workspace');
}

export async function decideClientRequest(
  requestId: string,
  decision: 'accept' | 'reject'
): Promise<{ request: AgentRequestRecord }> {
  return apiRequest('/api/agent/decision', {
    method: 'POST',
    body: JSON.stringify({ requestId, decision }),
  });
}

export async function setAgentAvailability(disponible: boolean): Promise<{ disponible: boolean }> {
  return apiRequest('/api/agent/availability', {
    method: 'POST',
    body: JSON.stringify({ disponible }),
  });
}

export async function updateAgentProfile(
  profile: Partial<AgentProfileDetails>
): Promise<{ profile: AgentProfileDetails; user: AuthUser }> {
  return apiRequest('/api/agent/profile', {
    method: 'PUT',
    body: JSON.stringify(profile),
  });
}

export async function addAgentWalletCard(payload: {
  alias: string;
  banco: string;
  numero: string;
  titular: string;
  expiracion: string;
  tipo: 'Debito' | 'Credito' | 'Cuenta Bancaria';
  predeterminada?: boolean;
}): Promise<{ wallet: AgentWalletState }> {
  return apiRequest('/api/agent/wallet/cards', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deleteAgentWalletCard(cardId: string): Promise<{ wallet: AgentWalletState }> {
  return apiRequest(`/api/agent/wallet/cards/${cardId}`, {
    method: 'DELETE',
  });
}

export async function updateAgentAutoPay(payload: {
  autoMonthlyEnabled: boolean;
  autoMonthlyDay: number;
  defaultCardId?: string;
}): Promise<{ wallet: AgentWalletState }> {
  return apiRequest('/api/agent/wallet/autopay', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function withdrawAgentFunds(payload: {
  montoCop: number;
  cardId?: string;
}): Promise<{ wallet: AgentWalletState }> {
  return apiRequest('/api/agent/wallet/withdraw', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function sendAgentMessage(
  requestId: string,
  text: string
): Promise<{ message: PortalChatMessage }> {
  return apiRequest('/api/agent/messages', {
    method: 'POST',
    body: JSON.stringify({ requestId, text }),
  });
}

export async function triggerAgentCall(
  requestId: string,
  action: 'start' | 'answer' | 'end'
): Promise<{ request: AgentRequestRecord }> {
  return apiRequest('/api/agent/call', {
    method: 'POST',
    body: JSON.stringify({ requestId, action }),
  });
}

export async function activateClientAccount(
  requestId: string,
  mode: Exclude<ActivationMode, null>
): Promise<{ request: AgentRequestRecord }> {
  return apiRequest('/api/agent/activate', {
    method: 'POST',
    body: JSON.stringify({ requestId, mode }),
  });
}

export async function completePresencialVisit(
  requestId: string
): Promise<{ request: AgentRequestRecord }> {
  return apiRequest('/api/agent/complete-visit', {
    method: 'POST',
    body: JSON.stringify({ requestId }),
  });
}

export async function fetchServerOrders(): Promise<{ orders: OrderRecord[] }> {
  return apiRequest('/api/orders');
}

export async function cobrarServerOrder(orderId: string): Promise<{ orders: OrderRecord[] }> {
  return apiRequest(`/api/orders/${orderId}/cobrar`, { method: 'POST' });
}

export async function anularServerOrder(orderId: string): Promise<{ orders: OrderRecord[] }> {
  return apiRequest(`/api/orders/${orderId}/anular`, { method: 'POST' });
}

// --- Portal Privado Cliente ("Pedir Ahora") ---
export async function fetchClientWorkspace(): Promise<ClientWorkspaceState> {
  return apiRequest('/api/cliente/workspace');
}

export async function createClientLocation(payload: {
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
}): Promise<ClientWorkspaceState> {
  return apiRequest('/api/cliente/locations', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateClientLocation(
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
): Promise<ClientWorkspaceState> {
  return apiRequest(`/api/cliente/locations/${locationId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteClientLocation(locationId: string): Promise<ClientWorkspaceState> {
  return apiRequest(`/api/cliente/locations/${locationId}`, {
    method: 'DELETE',
  });
}

export async function updateClientProfile(
  profile: Partial<ClientProfileDetails>
): Promise<{ workspace: ClientWorkspaceState; user: AuthUser }> {
  return apiRequest('/api/cliente/profile', {
    method: 'PUT',
    body: JSON.stringify(profile),
  });
}

export async function submitClientOrder(payload: {
  items: Array<{ productId: string; cantidad: number }>;
  locationId: string;
  metodoPago: string;
  bonoDomiciliarioCop: number;
  bonoNombre: string;
}): Promise<{
  workspace: ClientWorkspaceState;
  createdOrders: ClientPortalOrder[];
  message: string;
}> {
  return apiRequest('/api/cliente/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function sendClientAiChat(payload: {
  message: string;
  activeFilter: string;
  history: Array<{ role: 'user' | 'assistant'; text: string }>;
}): Promise<{
  reply: string;
  recommendations: ClientCatalogProduct[];
  aiQuota: ClientAiQuotaState;
}> {
  return apiRequest('/api/ai/cliente-chat', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function watchClientAiAd(): Promise<{
  aiQuota: ClientAiQuotaState;
  message: string;
}> {
  return apiRequest('/api/cliente/ai/watch-ad', {
    method: 'POST',
  });
}

export async function subscribeClientPremium(paymentMethod: string): Promise<{
  aiQuota: ClientAiQuotaState;
  message: string;
}> {
  return apiRequest('/api/cliente/premium/subscribe', {
    method: 'POST',
    body: JSON.stringify({ paymentMethod }),
  });
}

// --- COMERCIO / EMPRESARIO API ---
export async function fetchBusinessWorkspace(): Promise<{ workspace: BusinessWorkspaceState }> {
  return apiRequest('/api/comercio/workspace');
}

export async function selectBusinessPlan(payload: {
  planId: BusinessPlanId;
  billingCycle: 'mensual' | 'anual';
  paymentMethod?: string;
}): Promise<{ workspace: BusinessWorkspaceState; message: string }> {
  return apiRequest('/api/comercio/plan/select', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateBusinessProfile(
  payload: Partial<BusinessProfileSettings>
): Promise<{ workspace: BusinessWorkspaceState; user: AuthUser; message: string }> {
  return apiRequest('/api/comercio/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function createBusinessAd(payload: {
  titulo: string;
  mensaje: string;
  paymentMethod?: string;
}): Promise<{ workspace: BusinessWorkspaceState; message: string }> {
  return apiRequest('/api/comercio/ads', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createBusinessQr(payload: {
  nombre: string;
  mesaORef: string;
}): Promise<{ workspace: BusinessWorkspaceState; message: string }> {
  return apiRequest('/api/comercio/qr', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deleteBusinessQr(
  qrId: string
): Promise<{ workspace: BusinessWorkspaceState; message: string }> {
  return apiRequest(`/api/comercio/qr/${encodeURIComponent(qrId)}`, {
    method: 'DELETE',
  });
}

export async function createBusinessTeamMember(payload: {
  nombre: string;
  cargo: string;
  pinAcceso: string;
  permisos: BusinessPermissions;
}): Promise<{ workspace: BusinessWorkspaceState; message: string }> {
  return apiRequest('/api/comercio/team', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateBusinessTeamMember(
  memberId: string,
  payload: { activo?: boolean; permisos?: Partial<BusinessPermissions> }
): Promise<{ workspace: BusinessWorkspaceState; message: string }> {
  return apiRequest(`/api/comercio/team/${encodeURIComponent(memberId)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteBusinessTeamMember(
  memberId: string
): Promise<{ workspace: BusinessWorkspaceState; message: string }> {
  return apiRequest(`/api/comercio/team/${encodeURIComponent(memberId)}`, {
    method: 'DELETE',
  });
}

export type RealtimeEvent =
  | {
      type: 'portal:update';
      request: AgentRequestRecord;
      messages: PortalChatMessage[];
      availableAgentsCount: number;
    }
  | {
      type: 'chat:message';
      message: PortalChatMessage;
    }
  | {
      type: 'agent:workspace';
    }
  | {
      type: 'application:reviewed';
      application: AgentApplicationRecord;
      user: AuthUser;
    };

export function connectRealtime(
  token: string,
  onEvent: (event: RealtimeEvent) => void
): () => void {
  let active = true;
  let socket: globalThis.WebSocket | null = null;
  let reconnectTimer: number | null = null;

  const connect = () => {
    if (!active) return;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${protocol}//${window.location.host}/ws?token=${encodeURIComponent(token)}`;
    socket = new window.WebSocket(url);

    socket.onmessage = (evt) => {
      try {
        const parsed = JSON.parse(String(evt.data)) as RealtimeEvent;
        onEvent(parsed);
      } catch {
        // Ignorar payload inválido
      }
    };

    socket.onclose = () => {
      if (!active) return;
      reconnectTimer = window.setTimeout(connect, 1800);
    };
  };

  connect();

  return () => {
    active = false;
    if (reconnectTimer !== null) {
      window.clearTimeout(reconnectTimer);
    }
    if (socket && socket.readyState <= 1) {
      socket.close();
    }
  };
}
