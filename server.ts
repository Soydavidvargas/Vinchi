import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { GoogleGenAI, Type } from '@google/genai';
import express from 'express';
import QRCode from 'qrcode';
import { createServer as createViteServer } from 'vite';
import { WebSocket, WebSocketServer } from 'ws';
import { SEEDED_CLIENT_COMPANIES } from './src/data/clientCatalogSeed.ts';
import type {
  ActivationMode,
  AgentApplicationRecord,
  AgentDetailedStats,
  AgentProfileDetails,
  AgentRequestRecord,
  AgentWalletState,
  AuthUser,
  BusinessAdCampaign,
  BusinessPermissions,
  BusinessPlanId,
  BusinessProfileSettings,
  BusinessQrCode,
  BusinessTeamMember,
  BusinessWorkspaceState,
  ClientAiQuotaState,
  ClientCatalogProduct,
  ClientCompanyCatalog,
  ClientCompanyLogoIcon,
  ClientDeliveryLocation,
  ClientPortalOrder,
  CourierApplicationRecord,
  CourierChatMessage,
  CourierCompanyContract,
  CourierDeliveryOrder,
  CourierDetailedStats,
  CourierProfileDetails,
  DeliveryHandoffMode,
  OrderRecord,
  PortalChatMessage,
  VinchiRole,
} from './src/types/vinchi.ts';

interface StoredUser extends AuthUser {
  passwordHash: string;
}

interface StoredSession {
  token: string;
  userId: string;
  createdAt: string;
}

interface StoredAgentProfile {
  userId: string;
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
  disponible: boolean;
  comerciosVinculados: number;
  setupFeesCobrados: number;
  comisionAcumuladaCop: number;
  tasaConversion: string;
  stats: AgentDetailedStats;
  wallet: AgentWalletState;
}

interface StoredCourierProfile {
  userId: string;
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
  activo: boolean;
  lastToggleDate: string;
  togglesUsedToday: number;
  vinchiAutoContract: boolean;
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
  lastCompletedNotice?: string;
}

interface StoredRequestInternal extends AgentRequestRecord {
  earningsAppliedCop?: number;
  vinchiAppliedCop?: number;
  rejectedByAgentIds?: string[];
}

interface StoredClientOrder extends ClientPortalOrder {
  userId: string;
}

interface StoredClientAiQuota {
  monthKey: string;
  usesThisMonth: number;
  adBonusUses: number;
  isClientPremium: boolean;
  premiumSince?: string;
  premiumPaymentMethod?: string;
}

interface VinchiDatabase {
  users: StoredUser[];
  sessions: StoredSession[];
  agents: StoredAgentProfile[];
  agentApplications: AgentApplicationRecord[];
  couriers: StoredCourierProfile[];
  courierApplications: CourierApplicationRecord[];
  vinchiTotalCop: number;
  requests: StoredRequestInternal[];
  messages: Record<string, PortalChatMessage[]>;
  orders: OrderRecord[];
  clientLocationsByUser: Record<string, ClientDeliveryLocation[]>;
  clientOrders: StoredClientOrder[];
  clientAiQuotaByUser: Record<string, StoredClientAiQuota>;
  businessesByUser: Record<string, BusinessWorkspaceState>;
}

const PORT = Number(process.env.PORT || 3000);
const HOST = '0.0.0.0';
const DATA_FILE = path.resolve(process.cwd(), '.vinchi-data.json');

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('La clave del asistente inteligente no está configurada en el servidor.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  const keyBuf = Buffer.from(keyHex, 'hex');
  const derived = scryptSync(password, salt, 64);
  if (keyBuf.length !== derived.length) return false;
  return timingSafeEqual(keyBuf, derived);
}

function buildFullName(parts: {
  primerNombre: string;
  segundoNombre?: string;
  primerApellido: string;
  segundoApellido?: string;
}): string {
  return [
    parts.primerNombre.trim(),
    (parts.segundoNombre || '').trim(),
    parts.primerApellido.trim(),
    (parts.segundoApellido || '').trim(),
  ]
    .filter(Boolean)
    .join(' ');
}

function splitNameFallback(fullName: string): {
  primerNombre: string;
  segundoNombre?: string;
  primerApellido: string;
  segundoApellido?: string;
} {
  const tokens = fullName.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return { primerNombre: 'Usuario', primerApellido: 'Vinchi' };
  if (tokens.length === 1) return { primerNombre: tokens[0], primerApellido: 'Vinchi' };
  if (tokens.length === 2) return { primerNombre: tokens[0], primerApellido: tokens[1] };
  if (tokens.length === 3) {
    return { primerNombre: tokens[0], segundoNombre: tokens[1], primerApellido: tokens[2] };
  }
  return {
    primerNombre: tokens[0],
    segundoNombre: tokens[1],
    primerApellido: tokens[2],
    segundoApellido: tokens.slice(3).join(' '),
  };
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function createDefaultAgentProfile(params: {
  userId: string;
  nombre: string;
  primerNombre?: string;
  segundoNombre?: string;
  primerApellido?: string;
  segundoApellido?: string;
  avatarDataUrl?: string;
  telefono?: string;
  email: string;
  departamento?: string;
  municipio?: string;
  seeded?: boolean;
}): StoredAgentProfile {
  const isSeeded = Boolean(params.seeded);
  const split = splitNameFallback(params.nombre);
  const primerNombre = params.primerNombre || split.primerNombre;
  const primerApellido = params.primerApellido || split.primerApellido;
  const segundoNombre = params.segundoNombre ?? split.segundoNombre;
  const segundoApellido = params.segundoApellido ?? split.segundoApellido;
  const fullName = buildFullName({ primerNombre, segundoNombre, primerApellido, segundoApellido });

  return {
    userId: params.userId,
    nombre: fullName,
    primerNombre,
    segundoNombre,
    primerApellido,
    segundoApellido,
    avatarDataUrl: params.avatarDataUrl,
    email: params.email,
    telefono: params.telefono || (isSeeded ? '+57 312 489 2010' : ''),
    departamento: params.departamento || 'Cundinamarca',
    municipio: params.municipio || 'Bogotá D.C.',
    horario: 'Lunes a Sábado · 8:00 a.m. - 7:00 p.m.',
    bio: 'Agente comercial certificado Vinchi en vinculación presencial y virtual de comercios locales.',
    disponible: true,
    comerciosVinculados: isSeeded ? 18 : 0,
    setupFeesCobrados: isSeeded ? 18 : 0,
    comisionAcumuladaCop: isSeeded ? 630000 : 0,
    tasaConversion: isSeeded ? '64%' : '0%',
    stats: {
      clientesAceptados: isSeeded ? 18 : 0,
      clientesNegados: isSeeded ? 2 : 0,
      activacionesVirtuales: isSeeded ? 6 : 0,
      activacionesPresenciales: isSeeded ? 12 : 0,
      horasTrabajadasMes: isSeeded ? 142 : 1,
      diasActivosMes: isSeeded ? 21 : 1,
    },
    wallet: {
      saldoDisponibleCop: isSeeded ? 240000 : 0,
      totalRetiradoCop: isSeeded ? 390000 : 0,
      autoMonthlyEnabled: isSeeded,
      autoMonthlyDay: 1,
      cards: isSeeded
        ? [
            {
              id: 'card-seed-1',
              alias: 'Bancolombia Principal',
              banco: 'Bancolombia',
              ultimos4: '4821',
              titular: fullName,
              expiracion: '09/28',
              tipo: 'Debito',
              predeterminada: true,
            },
          ]
        : [],
      withdrawals: isSeeded
        ? [
            {
              id: 'wd-seed-1',
              montoCop: 390000,
              cardLabel: 'Bancolombia •••• 4821',
              tipo: 'Automatico Mensual',
              estado: 'Procesado',
              createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
            },
          ]
        : [],
    },
  };
}

function createDefaultCompaniesCatalog(): CourierCompanyContract[] {
  return [
    {
      id: 'emp-bistro',
      empresaNombre: 'Bistró Central',
      ciudad: 'Bogotá D.C.',
      categoria: 'Restaurante',
      tarifaBaseCop: 8500,
      estado: 'Contratado',
    },
    {
      id: 'emp-mercado84',
      empresaNombre: 'Mercado Urbano 84',
      ciudad: 'Medellín',
      categoria: 'Supermercado',
      tarifaBaseCop: 9200,
      estado: 'Contratado',
    },
    {
      id: 'emp-parrilla',
      empresaNombre: 'Parrilla del Norte',
      ciudad: 'Bogotá D.C.',
      categoria: 'Restaurante',
      tarifaBaseCop: 8900,
      estado: 'Disponible',
    },
    {
      id: 'emp-sushi93',
      empresaNombre: 'Sushi House 93',
      ciudad: 'Bogotá D.C.',
      categoria: 'Gastronomía',
      tarifaBaseCop: 9500,
      estado: 'Disponible',
    },
    {
      id: 'emp-cafe-parque',
      empresaNombre: 'Café del Parque',
      ciudad: 'Chía',
      categoria: 'Cafetería',
      tarifaBaseCop: 7800,
      estado: 'Disponible',
    },
  ];
}

function createDefaultCourierProfile(params: {
  userId: string;
  nombre: string;
  primerNombre?: string;
  segundoNombre?: string;
  primerApellido?: string;
  segundoApellido?: string;
  avatarDataUrl?: string;
  telefono?: string;
  email: string;
  departamento?: string;
  municipio?: string;
  direccionCasa?: string;
  vehiculo?: string;
  seeded?: boolean;
}): StoredCourierProfile {
  const isSeeded = Boolean(params.seeded);
  const split = splitNameFallback(params.nombre);
  const primerNombre = params.primerNombre || split.primerNombre;
  const primerApellido = params.primerApellido || split.primerApellido;
  const segundoNombre = params.segundoNombre ?? split.segundoNombre;
  const segundoApellido = params.segundoApellido ?? split.segundoApellido;
  const fullName = buildFullName({ primerNombre, segundoNombre, primerApellido, segundoApellido });

  return {
    userId: params.userId,
    nombre: fullName,
    primerNombre,
    segundoNombre,
    primerApellido,
    segundoApellido,
    avatarDataUrl: params.avatarDataUrl,
    email: params.email,
    telefono: params.telefono || (isSeeded ? '+57 315 740 8821' : ''),
    departamento: params.departamento || 'Cundinamarca',
    municipio: params.municipio || 'Bogotá D.C.',
    direccionCasa: params.direccionCasa || (isSeeded ? 'Calle 85 # 14-20' : ''),
    vehiculo: params.vehiculo || 'Motocicleta',
    activo: false,
    lastToggleDate: todayKey(),
    togglesUsedToday: 0,
    vinchiAutoContract: isSeeded,
    stats: {
      enviadosTotal: isSeeded ? 34 : 0,
      entregadosTotal: isSeeded ? 34 : 0,
      gananciasTotalesCop: isSeeded ? 312000 : 0,
      entregasHoy: isSeeded ? 3 : 0,
    },
    wallet: {
      saldoDisponibleCop: isSeeded ? 124000 : 0,
      totalRetiradoCop: isSeeded ? 188000 : 0,
      autoMonthlyEnabled: isSeeded,
      autoMonthlyDay: 5,
      cards: isSeeded
        ? [
            {
              id: 'c-card-seed-1',
              alias: 'Nequi Domicilio',
              banco: 'Nequi',
              ultimos4: '8821',
              titular: fullName,
              expiracion: '12/29',
              tipo: 'Cuenta Bancaria',
              predeterminada: true,
            },
          ]
        : [],
      withdrawals: isSeeded
        ? [
            {
              id: 'c-wd-seed-1',
              montoCop: 188000,
              cardLabel: 'Nequi •••• 8821',
              tipo: 'Automatico Mensual',
              estado: 'Procesado',
              createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
            },
          ]
        : [],
    },
    activeOrder: null,
    chatMessages: [],
    companies: createDefaultCompaniesCatalog(),
    completedHistory: isSeeded
      ? [
          {
            id: 'hist-1',
            codigoOrden: '#DM-4091',
            empresaNombre: 'Bistró Central',
            pagoDomicilioCop: 9200,
            completedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
          },
          {
            id: 'hist-2',
            codigoOrden: '#DM-4098',
            empresaNombre: 'Mercado Urbano 84',
            pagoDomicilioCop: 10500,
            completedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
          },
        ]
      : [],
  };
}

function createInitialDb(): VinchiDatabase {
  const demoPass = hashPassword('Vinchi2026!');
  return {
    users: [
      {
        id: 'usr-agente-1',
        nombre: 'Camila Andrea Vargas',
        primerNombre: 'Camila',
        segundoNombre: 'Andrea',
        primerApellido: 'Vargas',
        email: 'agente@vinchi.co',
        telefono: '+57 312 489 2010',
        role: 'agente',
        businessActivated: true,
        agentApplicationStatus: 'approved',
        courierApplicationStatus: 'none',
        passwordHash: demoPass,
      },
      {
        id: 'usr-comercio-1',
        nombre: 'Mateo Rojas',
        primerNombre: 'Mateo',
        primerApellido: 'Rojas',
        negocioNombre: 'Bistró Central',
        email: 'comercio@vinchi.co',
        role: 'comercio',
        businessActivated: true,
        agentApplicationStatus: 'none',
        courierApplicationStatus: 'none',
        passwordHash: demoPass,
      },
      {
        id: 'usr-repartidor-1',
        nombre: 'Sebastián Díaz',
        primerNombre: 'Sebastián',
        primerApellido: 'Díaz',
        email: 'repartidor@vinchi.co',
        telefono: '+57 315 740 8821',
        role: 'repartidor',
        businessActivated: true,
        agentApplicationStatus: 'none',
        courierApplicationStatus: 'approved',
        passwordHash: demoPass,
      },
      {
        id: 'usr-admin-1',
        nombre: 'Dirección Vinchi',
        primerNombre: 'Dirección',
        primerApellido: 'Vinchi',
        email: 'admin@vinchi.co',
        role: 'superadmin',
        businessActivated: true,
        agentApplicationStatus: 'none',
        courierApplicationStatus: 'none',
        passwordHash: demoPass,
      },
      {
        id: 'usr-cliente-1',
        nombre: 'Valeria Gómez',
        primerNombre: 'Valeria',
        primerApellido: 'Gómez',
        email: 'cliente@vinchi.co',
        telefono: '+57 318 552 1044',
        role: 'cliente',
        businessActivated: false,
        agentApplicationStatus: 'none',
        courierApplicationStatus: 'none',
        passwordHash: demoPass,
      },
    ],
    sessions: [],
    agents: [
      createDefaultAgentProfile({
        userId: 'usr-agente-1',
        nombre: 'Camila Andrea Vargas',
        primerNombre: 'Camila',
        segundoNombre: 'Andrea',
        primerApellido: 'Vargas',
        email: 'agente@vinchi.co',
        seeded: true,
      }),
    ],
    agentApplications: [],
    couriers: [
      createDefaultCourierProfile({
        userId: 'usr-repartidor-1',
        nombre: 'Sebastián Díaz',
        primerNombre: 'Sebastián',
        primerApellido: 'Díaz',
        email: 'repartidor@vinchi.co',
        seeded: true,
      }),
    ],
    courierApplications: [],
    vinchiTotalCop: 90000,
    requests: [],
    messages: {},
    orders: [
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
    ],
    clientLocationsByUser: {},
    clientOrders: [],
    clientAiQuotaByUser: {},
    businessesByUser: {},
  };
}

function loadDb(): VinchiDatabase {
  const base = createInitialDb();
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      const parsed = JSON.parse(raw) as Partial<VinchiDatabase>;
      const usersRaw = Array.isArray(parsed.users) && parsed.users.length > 0 ? parsed.users : base.users;
      const hydratedUsers: StoredUser[] = usersRaw.map((u) => {
        const split = splitNameFallback(u.nombre || 'Usuario Vinchi');
        return {
          ...u,
          primerNombre: u.primerNombre || split.primerNombre,
          segundoNombre: u.segundoNombre ?? split.segundoNombre,
          primerApellido: u.primerApellido || split.primerApellido,
          segundoApellido: u.segundoApellido ?? split.segundoApellido,
          courierApplicationStatus:
            u.courierApplicationStatus ?? (u.role === 'repartidor' ? 'approved' : 'none'),
        };
      });
      if (!hydratedUsers.some((u) => u.email === 'cliente@vinchi.co')) {
        const seededClient = base.users.find((u) => u.email === 'cliente@vinchi.co');
        if (seededClient) hydratedUsers.push(seededClient);
      }

      const agentsRaw = Array.isArray(parsed.agents) && parsed.agents.length > 0 ? parsed.agents : base.agents;
      const hydratedAgents: StoredAgentProfile[] = agentsRaw.map((ag) => {
        const defaults = createDefaultAgentProfile({
          userId: ag.userId,
          nombre: ag.nombre,
          email: ag.email,
          seeded: ag.userId === 'usr-agente-1',
        });
        return {
          ...defaults,
          ...ag,
          stats: { ...defaults.stats, ...(ag.stats || {}) },
          wallet: { ...defaults.wallet, ...(ag.wallet || {}) },
        };
      });

      const couriersRaw =
        Array.isArray(parsed.couriers) && parsed.couriers.length > 0 ? parsed.couriers : base.couriers;
      const hydratedCouriers: StoredCourierProfile[] = couriersRaw.map((cr) => {
        const defaults = createDefaultCourierProfile({
          userId: cr.userId,
          nombre: cr.nombre,
          email: cr.email,
          seeded: cr.userId === 'usr-repartidor-1',
        });
        return {
          ...defaults,
          ...cr,
          stats: { ...defaults.stats, ...(cr.stats || {}) },
          wallet: { ...defaults.wallet, ...(cr.wallet || {}) },
          companies:
            Array.isArray(cr.companies) && cr.companies.length > 0 ? cr.companies : defaults.companies,
          chatMessages: Array.isArray(cr.chatMessages) ? cr.chatMessages : [],
          completedHistory: Array.isArray(cr.completedHistory) ? cr.completedHistory : [],
        };
      });

      return {
        users: hydratedUsers,
        sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
        agents: hydratedAgents,
        agentApplications: Array.isArray(parsed.agentApplications) ? parsed.agentApplications : [],
        couriers: hydratedCouriers,
        courierApplications: Array.isArray(parsed.courierApplications) ? parsed.courierApplications : [],
        vinchiTotalCop:
          typeof parsed.vinchiTotalCop === 'number' ? parsed.vinchiTotalCop : base.vinchiTotalCop,
        requests: Array.isArray(parsed.requests) ? parsed.requests : [],
        messages: parsed.messages && typeof parsed.messages === 'object' ? parsed.messages : {},
        orders: Array.isArray(parsed.orders) && parsed.orders.length > 0 ? parsed.orders : base.orders,
        clientLocationsByUser:
          parsed.clientLocationsByUser && typeof parsed.clientLocationsByUser === 'object'
            ? parsed.clientLocationsByUser
            : {},
        clientOrders: Array.isArray(parsed.clientOrders) ? parsed.clientOrders : [],
        clientAiQuotaByUser:
          parsed.clientAiQuotaByUser && typeof parsed.clientAiQuotaByUser === 'object'
            ? parsed.clientAiQuotaByUser
            : {},
        businessesByUser:
          parsed.businessesByUser && typeof parsed.businessesByUser === 'object'
            ? parsed.businessesByUser
            : {},
      };
    }
  } catch (err) {
    console.warn('[vinchi] No se pudo leer archivo de persistencia, reiniciando base inicial.', err);
  }
  saveDb(base);
  return base;
}

function saveDb(db: VinchiDatabase) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (err) {
    console.error('[vinchi] Error guardando estado:', err);
  }
}

function sanitizeUser(user: StoredUser): AuthUser {
  const split = splitNameFallback(user.nombre);
  return {
    id: user.id,
    nombre: user.nombre,
    primerNombre: user.primerNombre || split.primerNombre,
    segundoNombre: user.segundoNombre,
    primerApellido: user.primerApellido || split.primerApellido,
    segundoApellido: user.segundoApellido,
    telefono: user.telefono,
    avatarDataUrl: user.avatarDataUrl,
    negocioNombre: user.negocioNombre,
    email: user.email,
    role: user.role,
    businessActivated: user.businessActivated,
    agentApplicationStatus: user.agentApplicationStatus ?? (user.role === 'agente' ? 'approved' : 'none'),
    courierApplicationStatus:
      user.courierApplicationStatus ?? (user.role === 'repartidor' ? 'approved' : 'none'),
  };
}

function stripInternalRequest(reqRecord: StoredRequestInternal): AgentRequestRecord {
  const {
    earningsAppliedCop: _e,
    vinchiAppliedCop: _v,
    rejectedByAgentIds: _r,
    ...publicRecord
  } = reqRecord;
  return publicRecord;
}

function generateActivationToken(): string {
  const num = 1000 + Math.floor(Math.random() * 9000);
  return `VNC-${num}`;
}

async function startServer() {
  const db = loadDb();
  const app = express();
  app.use(express.json({ limit: '6mb' }));

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  const clientsByUserId = new Map<string, Set<WebSocket>>();

  function attachSocket(userId: string, ws: WebSocket) {
    let set = clientsByUserId.get(userId);
    if (!set) {
      set = new Set();
      clientsByUserId.set(userId, set);
    }
    set.add(ws);
  }

  function detachSocket(userId: string, ws: WebSocket) {
    const set = clientsByUserId.get(userId);
    if (!set) return;
    set.delete(ws);
    if (set.size === 0) {
      clientsByUserId.delete(userId);
    }
  }

  function emitToUser(userId: string, event: unknown) {
    const set = clientsByUserId.get(userId);
    if (!set) return;
    const payload = JSON.stringify(event);
    for (const ws of set) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    }
  }

  function emitToAllAgents(event: unknown) {
    for (const agent of db.agents) {
      emitToUser(agent.userId, event);
    }
  }

  function getAuthFromHeader(req: express.Request): StoredUser | null {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) return null;
    const token = header.slice(7).trim();
    if (!token) return null;
    const session = db.sessions.find((s) => s.token === token);
    if (!session) return null;
    return db.users.find((u) => u.id === session.userId) ?? null;
  }

  function createSessionForUser(user: StoredUser): string {
    const token = randomBytes(24).toString('hex');
    db.sessions.push({
      token,
      userId: user.id,
      createdAt: new Date().toISOString(),
    });
    saveDb(db);
    return token;
  }

  function ensureRequestForClient(user: StoredUser): StoredRequestInternal {
    let existing = db.requests.find((r) => r.clientId === user.id);
    if (!existing) {
      existing = {
        id: `req-${Date.now()}-${randomBytes(3).toString('hex')}`,
        clientId: user.id,
        clientName: user.nombre,
        clientEmail: user.email,
        businessName: user.negocioNombre || `Comercio de ${user.nombre}`,
        searchPaid: false,
        status: 'unpaid',
        activationMode: null,
        tokenUnlocked: false,
        requiresVisitWarning: false,
        visitPaid: false,
        visitCompleted: false,
        agentEarningsCop: 0,
        vinchiFeeCop: 0,
        callState: { status: 'idle' },
        updatedAt: new Date().toISOString(),
        earningsAppliedCop: 0,
        vinchiAppliedCop: 0,
        rejectedByAgentIds: [],
      };
      db.requests.push(existing);
      db.messages[existing.id] = [];
      saveDb(db);
    }
    return existing;
  }

  function appendChatMessage(
    requestId: string,
    senderId: string,
    senderName: string,
    senderRole: 'cliente' | 'agente' | 'sistema',
    text: string
  ): PortalChatMessage {
    const msg: PortalChatMessage = {
      id: `msg-${Date.now()}-${randomBytes(3).toString('hex')}`,
      requestId,
      senderId,
      senderName,
      senderRole,
      text,
      createdAt: new Date().toISOString(),
    };
    if (!db.messages[requestId]) {
      db.messages[requestId] = [];
    }
    db.messages[requestId].push(msg);
    return msg;
  }

  function applyEarningsDelta(
    reqRecord: StoredRequestInternal,
    targetAgentCop: number,
    targetVinchiCop: number,
    mode: 'virtual' | 'presencial'
  ) {
    const prevAgent = reqRecord.earningsAppliedCop ?? 0;
    const prevVinchi = reqRecord.vinchiAppliedCop ?? 0;
    const agentDelta = targetAgentCop - prevAgent;
    const vinchiDelta = targetVinchiCop - prevVinchi;

    const agent = db.agents.find((a) => a.userId === reqRecord.assignedAgentId);
    if (agent) {
      if (prevAgent === 0 && targetAgentCop > 0) {
        agent.comerciosVinculados += 1;
        agent.setupFeesCobrados += 1;
        if (mode === 'virtual') agent.stats.activacionesVirtuales += 1;
        else agent.stats.activacionesPresenciales += 1;
      } else if (prevAgent === 10000 && targetAgentCop === 30000) {
        agent.stats.activacionesVirtuales = Math.max(0, agent.stats.activacionesVirtuales - 1);
        agent.stats.activacionesPresenciales += 1;
      }
      agent.comisionAcumuladaCop += agentDelta;
      agent.wallet.saldoDisponibleCop += agentDelta;
      const totalDecisions = agent.stats.clientesAceptados + agent.stats.clientesNegados;
      if (totalDecisions > 0) {
        agent.tasaConversion = `${Math.round((agent.comerciosVinculados / totalDecisions) * 100)}%`;
      }
    }
    db.vinchiTotalCop += vinchiDelta;
    reqRecord.earningsAppliedCop = targetAgentCop;
    reqRecord.vinchiAppliedCop = targetVinchiCop;
    reqRecord.agentEarningsCop = targetAgentCop;
    reqRecord.vinchiFeeCop = targetVinchiCop;
  }

  function broadcastRequestSync(reqRecord: StoredRequestInternal) {
    const publicReq = stripInternalRequest(reqRecord);
    const msgs = db.messages[reqRecord.id] ?? [];
    emitToUser(reqRecord.clientId, {
      type: 'portal:update',
      request: publicReq,
      messages: msgs,
      availableAgentsCount: db.agents.filter((a) => a.disponible).length,
    });
    if (reqRecord.assignedAgentId) {
      emitToUser(reqRecord.assignedAgentId, {
        type: 'agent:workspace',
      });
    } else {
      emitToAllAgents({
        type: 'agent:workspace',
      });
    }
  }

  function getAgentProfilePayload(agent: StoredAgentProfile): AgentProfileDetails {
    return {
      nombre: agent.nombre,
      primerNombre: agent.primerNombre,
      segundoNombre: agent.segundoNombre,
      primerApellido: agent.primerApellido,
      segundoApellido: agent.segundoApellido,
      avatarDataUrl: agent.avatarDataUrl,
      email: agent.email,
      telefono: agent.telefono,
      departamento: agent.departamento,
      municipio: agent.municipio,
      horario: agent.horario,
      bio: agent.bio,
    };
  }

  function getCourierProfilePayload(courier: StoredCourierProfile): CourierProfileDetails {
    return {
      nombre: courier.nombre,
      primerNombre: courier.primerNombre,
      segundoNombre: courier.segundoNombre,
      primerApellido: courier.primerApellido,
      segundoApellido: courier.segundoApellido,
      avatarDataUrl: courier.avatarDataUrl,
      email: courier.email,
      telefono: courier.telefono,
      departamento: courier.departamento,
      municipio: courier.municipio,
      direccionCasa: courier.direccionCasa,
      vehiculo: courier.vehiculo,
    };
  }

  function buildSimulatedCourierOrder(courier: StoredCourierProfile): CourierDeliveryOrder {
    const contracted = courier.companies.filter((c) => c.estado === 'Contratado');
    const availablePool = courier.vinchiAutoContract ? courier.companies : contracted;
    const picked =
      availablePool[Math.floor(Math.random() * availablePool.length)] || courier.companies[0];

    const customerPools = [
      {
        nombre: 'Valentina Gómez',
        tel: '+57 314 820 4411',
        dir: 'Carrera 11 # 93-40, Apto 502',
        barrio: 'Chicó Norte',
        comida: '2x Bowl Proteico Especial + 2x Limonada Hierbabuena',
      },
      {
        nombre: 'Andrés Felipe Castro',
        tel: '+57 301 552 1930',
        dir: 'Calle 79B # 7-35, Torre B',
        barrio: 'El Nogal',
        comida: '1x Hamburguesa Artesanal Doble + 1x Papas Trufadas + 1x Gaseosa',
      },
      {
        nombre: 'Sofía Martínez',
        tel: '+57 320 918 7742',
        dir: 'Av. 19 # 104-18, Casa 4',
        barrio: 'Santa Bárbara',
        comida: '1x Ramen Tonkotsu Clásico + 2x Gyozas al Vapor',
      },
    ];
    const cust = customerPools[Math.floor(Math.random() * customerPools.length)];
    const orderNum = 4100 + Math.floor(Math.random() * 899);
    const pickupCode = `EMP-${1000 + Math.floor(Math.random() * 8999)}`;
    const deliveryCode = `CLI-${1000 + Math.floor(Math.random() * 8999)}`;

    return {
      id: `dord-${Date.now()}-${randomBytes(2).toString('hex')}`,
      codigoOrden: `#DM-${orderNum}`,
      step: 'to_company',
      empresaNombre: picked.empresaNombre,
      empresaDireccion: 'Calle 85 # 15-24, Local 102',
      empresaBarrio: picked.ciudad,
      clienteNombre: cust.nombre,
      clienteTelefono: cust.tel,
      clienteDireccion: cust.dir,
      clienteBarrio: cust.barrio,
      comidaResumen: cust.comida,
      pagoDomicilioCop: picked.tarifaBaseCop,
      distanciaEmpresaKm: 1.8,
      distanciaClienteKm: 6.4,
      pickupCodeExpected: pickupCode,
      deliveryCodeExpected: deliveryCode,
      pickupVerified: false,
      deliveryVerified: false,
      createdAt: new Date().toISOString(),
    };
  }

  wss.on('connection', (ws, req) => {
    try {
      const url = new URL(req.url || '/ws', `http://${req.headers.host || 'localhost'}`);
      const token = url.searchParams.get('token') || '';
      const session = db.sessions.find((s) => s.token === token);
      if (!session) {
        ws.close(4001, 'No autorizado');
        return;
      }
      const userId = session.userId;
      attachSocket(userId, ws);

      ws.on('close', () => {
        detachSocket(userId, ws);
      });
    } catch {
      ws.close(4000, 'Error de conexión');
    }
  });

  // --- AUTH ROUTES ---
  app.post('/api/auth/register', (req, res) => {
    const rawPrimerNombre = String(req.body?.primerNombre || '').trim();
    const rawSegundoNombre = String(req.body?.segundoNombre || '').trim();
    const rawPrimerApellido = String(req.body?.primerApellido || '').trim();
    const rawSegundoApellido = String(req.body?.segundoApellido || '').trim();
    const rawNombre = String(req.body?.nombre || '').trim();

    let primerNombre = rawPrimerNombre;
    let segundoNombre = rawSegundoNombre || undefined;
    let primerApellido = rawPrimerApellido;
    let segundoApellido = rawSegundoApellido || undefined;

    if (!primerNombre && !primerApellido && rawNombre) {
      const split = splitNameFallback(rawNombre);
      primerNombre = split.primerNombre;
      segundoNombre = split.segundoNombre;
      primerApellido = split.primerApellido;
      segundoApellido = split.segundoApellido;
    }

    const negocioNombre = String(req.body?.negocioNombre || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (primerNombre.length < 2) {
      res.status(400).json({ error: 'Tu primer nombre es obligatorio (mínimo 2 letras).' });
      return;
    }
    if (primerApellido.length < 2) {
      res.status(400).json({ error: 'Tu primer apellido es obligatorio (mínimo 2 letras).' });
      return;
    }
    if (!email || !email.includes('@')) {
      res.status(400).json({ error: 'Ingresa un correo electrónico válido.' });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
      return;
    }
    if (db.users.some((u) => u.email === email)) {
      res.status(409).json({
        error: 'Este correo ya tiene una cuenta registrada. Inicia sesión con tu contraseña.',
      });
      return;
    }

    const fullName = buildFullName({
      primerNombre,
      segundoNombre,
      primerApellido,
      segundoApellido,
    });

    const intendedRole = req.body?.intendedRole;
    const entryContext = req.body?.entryContext;
    const initialRole: VinchiRole =
      intendedRole === 'empresario_en_espera' ||
      entryContext === 'explorar_agentes' ||
      entryContext === 'crear_espacio'
        ? 'empresario_en_espera'
        : 'cliente';

    const newUser: StoredUser = {
      id: `usr-${Date.now()}-${randomBytes(3).toString('hex')}`,
      nombre: fullName,
      primerNombre,
      segundoNombre,
      primerApellido,
      segundoApellido,
      negocioNombre: negocioNombre || `Espacio de ${primerNombre}`,
      email,
      role: initialRole,
      businessActivated: false,
      agentApplicationStatus: 'none',
      courierApplicationStatus: 'none',
      passwordHash: hashPassword(password),
    };
    db.users.push(newUser);
    saveDb(db);

    res.status(201).json({
      ok: true,
      email: newUser.email,
      message: 'Cuenta creada con éxito. Ahora inicia sesión con tu correo y contraseña.',
    });
  });

  app.post('/api/auth/login', (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const expectedRole = req.body?.expectedRole as VinchiRole | undefined;

    const user = db.users.find((u) => u.email === email);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
      return;
    }
    if (expectedRole && user.role !== expectedRole) {
      res.status(403).json({
        error:
          expectedRole === 'agente'
            ? 'Tu cuenta aún no tiene autorización de Agente aprobada por correo.'
            : `Esta cuenta pertenece al rol "${user.role}" y no corresponde al acceso seleccionado.`,
      });
      return;
    }

    const token = createSessionForUser(user);
    res.json({
      token,
      user: sanitizeUser(user),
    });
  });

  app.post('/api/auth/staff-login', (req, res) => {
    const staffToken = String(req.body?.staffToken || '').trim().toUpperCase();
    if (staffToken.length < 4) {
      res.status(400).json({ error: 'Código de acceso de caja inválido.' });
      return;
    }

    let matchedOwner: StoredUser | undefined;
    for (const [ownerId, ws] of Object.entries(db.businessesByUser)) {
      const member = ws.teamMembers.find(
        (m) => m.activo && m.pinAcceso.trim().toUpperCase() === staffToken
      );
      if (member) {
        matchedOwner = db.users.find((u) => u.id === ownerId);
        if (matchedOwner) break;
      }
    }

    const comercioUser = matchedOwner || db.users.find((u) => u.role === 'comercio');
    if (!comercioUser) {
      res.status(404).json({ error: 'No hay un comercio habilitado para este código.' });
      return;
    }
    const token = createSessionForUser(comercioUser);
    res.json({
      token,
      user: sanitizeUser(comercioUser),
    });
  });

  app.post('/api/auth/biometric-login', (_req, res) => {
    const courierUser = db.users.find((u) => u.role === 'repartidor');
    if (!courierUser) {
      res.status(404).json({ error: 'Perfil de repartidor no encontrado.' });
      return;
    }
    const token = createSessionForUser(courierUser);
    res.json({
      token,
      user: sanitizeUser(courierUser),
    });
  });

  app.get('/api/auth/me', (req, res) => {
    const user = getAuthFromHeader(req);
    if (!user) {
      res.status(401).json({ error: 'Sesión no válida o expirada.' });
      return;
    }
    res.json({ user: sanitizeUser(user) });
  });

  app.post('/api/auth/logout', (req, res) => {
    const header = req.headers.authorization;
    if (header && header.startsWith('Bearer ')) {
      const token = header.slice(7).trim();
      db.sessions = db.sessions.filter((s) => s.token !== token);
      saveDb(db);
    }
    res.json({ ok: true });
  });

  // --- AGENT ONBOARDING APPLICATION ROUTES ---
  app.get('/api/agent-application/me', (req, res) => {
    const user = getAuthFromHeader(req);
    if (!user) {
      res.status(401).json({ error: 'Debes iniciar sesión primero.' });
      return;
    }
    const existing = db.agentApplications.find((a) => a.userId === user.id) ?? null;
    res.json({
      application: existing,
      user: sanitizeUser(user),
    });
  });

  app.post('/api/agent-application/submit', (req, res) => {
    const user = getAuthFromHeader(req);
    if (!user) {
      res.status(401).json({ error: 'Debes iniciar sesión para enviar tu postulación.' });
      return;
    }

    const primerNombre = String(req.body?.primerNombre || user.primerNombre || '').trim();
    const segundoNombre = String(req.body?.segundoNombre ?? user.segundoNombre ?? '').trim() || undefined;
    const primerApellido = String(req.body?.primerApellido || user.primerApellido || '').trim();
    const segundoApellido =
      String(req.body?.segundoApellido ?? user.segundoApellido ?? '').trim() || undefined;

    if (primerNombre.length < 2 || primerApellido.length < 2) {
      res.status(400).json({
        error: 'Tu primer nombre y primer apellido son obligatorios.',
      });
      return;
    }

    const answers = (req.body?.answers || {}) as Record<string, string>;
    const answerKeys = Object.keys(answers);
    if (answerKeys.length < 30 || answerKeys.some((k) => !String(answers[k] || '').trim())) {
      res.status(400).json({ error: 'Debes responder todas las 30 preguntas de evaluación.' });
      return;
    }

    const cedulaNumero = String(req.body?.cedulaNumero || '').trim();
    const cedulaExpedicion = String(req.body?.cedulaExpedicion || '').trim();
    const cedulaArchivoNombre = String(req.body?.cedulaArchivoNombre || '').trim();
    const hojaVidaArchivoNombre = String(req.body?.hojaVidaArchivoNombre || '').trim();
    const experienciaResumen = String(req.body?.experienciaResumen || '').trim();
    const departamento = String(req.body?.departamento || '').trim();
    const municipio = String(req.body?.municipio || '').trim();
    const direccionCasa = String(req.body?.direccionCasa || '').trim();
    const barrio = String(req.body?.barrio || '').trim();
    const telefono = String(req.body?.telefono || user.telefono || '').trim();
    const facialVerified = Boolean(req.body?.facialVerified);
    const facialSnapshotDataUrl = req.body?.facialSnapshotDataUrl
      ? String(req.body.facialSnapshotDataUrl)
      : undefined;

    if (!cedulaNumero || !cedulaArchivoNombre) {
      res.status(400).json({ error: 'Completa el registro y archivo de tu cédula.' });
      return;
    }
    if (!hojaVidaArchivoNombre) {
      res.status(400).json({ error: 'Adjunta tu hoja de vida para continuar.' });
      return;
    }
    if (!departamento || !municipio || !direccionCasa) {
      res.status(400).json({
        error: 'Ingresa la dirección de tu casa junto con el departamento y municipio.',
      });
      return;
    }
    if (!facialVerified) {
      res.status(400).json({
        error: 'Debes completar la verificación por reconocimiento facial.',
      });
      return;
    }

    user.primerNombre = primerNombre;
    user.segundoNombre = segundoNombre;
    user.primerApellido = primerApellido;
    user.segundoApellido = segundoApellido;
    user.nombre = buildFullName({ primerNombre, segundoNombre, primerApellido, segundoApellido });
    if (telefono) user.telefono = telefono;

    const record: AgentApplicationRecord = {
      id: `app-ag-${Date.now()}-${randomBytes(3).toString('hex')}`,
      userId: user.id,
      applicantName: user.nombre,
      applicantEmail: user.email,
      status: 'pending',
      answers,
      cedulaNumero,
      cedulaExpedicion,
      cedulaArchivoNombre,
      hojaVidaArchivoNombre,
      experienciaResumen,
      departamento,
      municipio,
      direccionCasa,
      barrio,
      facialVerified,
      facialSnapshotDataUrl,
      submittedAt: new Date().toISOString(),
    };

    const existingIdx = db.agentApplications.findIndex((a) => a.userId === user.id);
    if (existingIdx >= 0) {
      db.agentApplications[existingIdx] = record;
    } else {
      db.agentApplications.push(record);
    }
    user.agentApplicationStatus = 'pending';
    saveDb(db);

    res.status(201).json({
      application: record,
      user: sanitizeUser(user),
    });
  });

  // Admin review of pending agent applications
  app.get('/api/admin/agent-applications', (req, res) => {
    const user = getAuthFromHeader(req);
    if (!user || user.role !== 'superadmin') {
      res.status(403).json({ error: 'Acceso exclusivo de dirección.' });
      return;
    }
    res.json({ applications: db.agentApplications });
  });

  app.post('/api/admin/agent-applications/:id/review', (req, res) => {
    const user = getAuthFromHeader(req);
    if (!user || user.role !== 'superadmin') {
      res.status(403).json({ error: 'Acceso exclusivo de dirección.' });
      return;
    }
    const decision = String(req.body?.decision || '');
    if (decision !== 'approved' && decision !== 'rejected') {
      res.status(400).json({ error: 'Decisión inválida.' });
      return;
    }
    const appRec = db.agentApplications.find((a) => a.id === req.params.id);
    if (!appRec) {
      res.status(404).json({ error: 'Postulación no encontrada.' });
      return;
    }

    appRec.status = decision;
    appRec.reviewedAt = new Date().toISOString();
    const applicant = db.users.find((u) => u.id === appRec.userId);
    if (applicant) {
      applicant.agentApplicationStatus = decision;
      if (decision === 'approved') {
        applicant.role = 'agente';
        appRec.authorizationNotice = `Correo de autorización enviado a ${applicant.email}. Ya puede ingresar desde el botón "Trabajar en Vinchi" -> "Entrar a mi espacio de Agente".`;
        if (!db.agents.some((ag) => ag.userId === applicant.id)) {
          db.agents.push(
            createDefaultAgentProfile({
              userId: applicant.id,
              nombre: applicant.nombre,
              email: applicant.email,
              departamento: appRec.departamento,
              municipio: appRec.municipio,
              seeded: false,
            })
          );
        }
      } else {
        appRec.authorizationNotice = `Notificación de rechazo enviada a ${applicant.email}.`;
      }
      emitToUser(applicant.id, {
        type: 'application:reviewed',
        application: appRec,
        user: sanitizeUser(applicant),
      });
    }

    saveDb(db);
    res.json({ application: appRec });
  });

  // --- CLIENT PORTAL ROUTES (Explorar Portal Agentes) ---
  app.get('/api/portal/state', (req, res) => {
    const user = getAuthFromHeader(req);
    if (!user) {
      res.status(401).json({ error: 'Debes iniciar sesión para ingresar.' });
      return;
    }
    if (
      user.role !== 'cliente' &&
      user.role !== 'empresario_en_espera' &&
      user.role !== 'comercio'
    ) {
      res.status(403).json({ error: 'Esta vista es exclusiva para solicitantes y comercios.' });
      return;
    }

    if (user.role === 'cliente' && !user.businessActivated) {
      user.role = 'empresario_en_espera';
      saveDb(db);
    }

    const reqRecord = ensureRequestForClient(user);
    res.json({
      request: stripInternalRequest(reqRecord),
      messages: db.messages[reqRecord.id] ?? [],
      availableAgentsCount: db.agents.filter((a) => a.disponible).length,
      user: sanitizeUser(user),
    });
  });

  app.post('/api/portal/pay-search', (req, res) => {
    const user = getAuthFromHeader(req);
    if (
      !user ||
      (user.role !== 'cliente' &&
        user.role !== 'empresario_en_espera' &&
        user.role !== 'comercio')
    ) {
      res.status(401).json({ error: 'No autorizado.' });
      return;
    }

    const paymentMethod = String(req.body?.paymentMethod || 'PSE').trim();
    const reqRecord = ensureRequestForClient(user);

    reqRecord.searchPaid = true;
    reqRecord.searchPaymentMethod = paymentMethod;
    if (reqRecord.status === 'unpaid') {
      reqRecord.status = 'paid_ready';
    }
    reqRecord.updatedAt = new Date().toISOString();

    appendChatMessage(
      reqRecord.id,
      'sistema',
      'Vinchi',
      'sistema',
      `Pago de $15.000 COP confirmado (${paymentMethod}). Ya puedes usar "Buscar agente automático".`
    );

    saveDb(db);
    broadcastRequestSync(reqRecord);

    res.json({
      request: stripInternalRequest(reqRecord),
      messages: db.messages[reqRecord.id] ?? [],
      availableAgentsCount: db.agents.filter((a) => a.disponible).length,
    });
  });

  app.post('/api/portal/match-agent', (req, res) => {
    const user = getAuthFromHeader(req);
    if (
      !user ||
      (user.role !== 'cliente' &&
        user.role !== 'empresario_en_espera' &&
        user.role !== 'comercio')
    ) {
      res.status(401).json({ error: 'No autorizado.' });
      return;
    }

    const reqRecord = ensureRequestForClient(user);
    if (!reqRecord.searchPaid) {
      res.status(402).json({
        error: 'Debes completar primero el pago de $15.000 COP para buscar un agente automático.',
      });
      return;
    }

    if (
      reqRecord.assignedAgentId &&
      reqRecord.status !== 'rejected_by_agent'
    ) {
      res.json({
        request: stripInternalRequest(reqRecord),
        messages: db.messages[reqRecord.id] ?? [],
        availableAgentsCount: db.agents.filter((a) => a.disponible).length,
      });
      return;
    }

    const rejectedIds = reqRecord.rejectedByAgentIds ?? [];
    const availableAgent =
      db.agents.find((a) => a.disponible && !rejectedIds.includes(a.userId)) ||
      db.agents.find((a) => a.disponible);

    if (!availableAgent) {
      res.status(409).json({
        error: 'No hay agentes disponibles en este momento. Intenta nuevamente en unos segundos.',
      });
      return;
    }

    reqRecord.assignedAgentId = availableAgent.userId;
    reqRecord.assignedAgentName = availableAgent.nombre;
    reqRecord.assignedAgentEmail = availableAgent.email;
    reqRecord.status = 'pending_agent_decision';
    reqRecord.updatedAt = new Date().toISOString();

    appendChatMessage(
      reqRecord.id,
      'sistema',
      'Vinchi',
      'sistema',
      `Solicitud enviada a ${availableAgent.nombre}. Esperando que el agente acepte atender tu negocio.`
    );

    saveDb(db);
    broadcastRequestSync(reqRecord);

    res.json({
      request: stripInternalRequest(reqRecord),
      messages: db.messages[reqRecord.id] ?? [],
      availableAgentsCount: db.agents.filter((a) => a.disponible).length,
    });
  });

  app.post('/api/portal/messages', (req, res) => {
    const user = getAuthFromHeader(req);
    if (
      !user ||
      (user.role !== 'cliente' &&
        user.role !== 'empresario_en_espera' &&
        user.role !== 'comercio')
    ) {
      res.status(401).json({ error: 'No autorizado.' });
      return;
    }
    const text = String(req.body?.text || '').trim();
    if (!text) {
      res.status(400).json({ error: 'Escribe un mensaje antes de enviar.' });
      return;
    }
    const reqRecord = ensureRequestForClient(user);
    if (
      !reqRecord.assignedAgentId ||
      reqRecord.status === 'pending_agent_decision' ||
      reqRecord.status === 'rejected_by_agent'
    ) {
      res.status(400).json({ error: 'Espera a que el agente acepte la solicitud para chatear.' });
      return;
    }

    const msg = appendChatMessage(reqRecord.id, user.id, user.nombre, 'cliente', text);
    reqRecord.updatedAt = new Date().toISOString();
    saveDb(db);

    emitToUser(reqRecord.clientId, { type: 'chat:message', message: msg });
    emitToUser(reqRecord.assignedAgentId, { type: 'chat:message', message: msg });
    emitToUser(reqRecord.assignedAgentId, { type: 'agent:workspace' });

    res.json({ message: msg });
  });

  app.post('/api/portal/call', (req, res) => {
    const user = getAuthFromHeader(req);
    if (
      !user ||
      (user.role !== 'cliente' &&
        user.role !== 'empresario_en_espera' &&
        user.role !== 'comercio')
    ) {
      res.status(401).json({ error: 'No autorizado.' });
      return;
    }
    const action = String(req.body?.action || '');
    const reqRecord = ensureRequestForClient(user);
    if (!reqRecord.assignedAgentId || reqRecord.status === 'pending_agent_decision') {
      res.status(400).json({ error: 'Espera a que el agente acepte la solicitud para llamar.' });
      return;
    }

    if (action === 'start') {
      reqRecord.callState = {
        status: 'ringing',
        initiatorRole: 'cliente',
        startedAt: new Date().toISOString(),
      };
      appendChatMessage(
        reqRecord.id,
        'sistema',
        'Llamada',
        'sistema',
        `${user.nombre} inició una llamada de voz con el agente.`
      );
    } else if (action === 'answer') {
      reqRecord.callState = {
        status: 'connected',
        initiatorRole: reqRecord.callState.initiatorRole || 'agente',
        startedAt: new Date().toISOString(),
      };
      appendChatMessage(reqRecord.id, 'sistema', 'Llamada', 'sistema', 'Llamada conectada en vivo.');
    } else {
      reqRecord.callState = { status: 'idle' };
      appendChatMessage(reqRecord.id, 'sistema', 'Llamada', 'sistema', 'Llamada finalizada.');
    }

    reqRecord.updatedAt = new Date().toISOString();
    saveDb(db);
    broadcastRequestSync(reqRecord);

    res.json({ request: stripInternalRequest(reqRecord) });
  });

  app.post('/api/portal/pay-visit', (req, res) => {
    const user = getAuthFromHeader(req);
    if (
      !user ||
      (user.role !== 'cliente' &&
        user.role !== 'empresario_en_espera' &&
        user.role !== 'comercio')
    ) {
      res.status(401).json({ error: 'No autorizado.' });
      return;
    }
    const paymentMethod = String(req.body?.paymentMethod || 'PSE').trim();
    const reqRecord = ensureRequestForClient(user);

    reqRecord.visitPaid = true;
    reqRecord.visitCompleted = false;
    reqRecord.activationMode = 'presencial';
    reqRecord.requiresVisitWarning = false;
    reqRecord.tokenUnlocked = false;
    reqRecord.status = 'awaiting_visit_completion';
    reqRecord.announcementTitle = 'Visita presencial pagada · Esperando visita del agente';
    reqRecord.announcementBody = `Confirmamos tu pago de visita presencial (${paymentMethod}). Tu botón para ingresar el código de activación permanecerá deshabilitado hasta que el agente visite tu local y lo habilite.`;
    reqRecord.updatedAt = new Date().toISOString();

    applyEarningsDelta(reqRecord, 30000, 5000, 'presencial');

    appendChatMessage(
      reqRecord.id,
      'sistema',
      'Vinchi',
      'sistema',
      `El comercio pagó la visita presencial ($20.000 COP adicionales, total $35.000 COP). El acceso con código quedará habilitado cuando el agente confirme la visita en sitio.`
    );

    saveDb(db);
    broadcastRequestSync(reqRecord);

    res.json({
      request: stripInternalRequest(reqRecord),
      messages: db.messages[reqRecord.id] ?? [],
    });
  });

  app.post('/api/portal/verify-token', (req, res) => {
    const user = getAuthFromHeader(req);
    if (
      !user ||
      (user.role !== 'cliente' &&
        user.role !== 'empresario_en_espera' &&
        user.role !== 'comercio')
    ) {
      res.status(401).json({ error: 'No autorizado.' });
      return;
    }
    const submittedToken = String(req.body?.token || '').trim().toUpperCase();
    const reqRecord = ensureRequestForClient(user);

    if (!reqRecord.tokenUnlocked || !reqRecord.activationToken) {
      res.status(403).json({
        error: 'El botón de activación aún no está habilitado por tu agente.',
      });
      return;
    }
    if (submittedToken !== reqRecord.activationToken.toUpperCase()) {
      res.status(400).json({
        error: 'El código de activación no coincide. Verifica el código enviado a tu correo o en el anuncio.',
      });
      return;
    }

    user.role = 'comercio';
    user.businessActivated = true;
    reqRecord.status = 'business_opened';
    reqRecord.updatedAt = new Date().toISOString();
    ensureBusinessWorkspace(user);

    appendChatMessage(
      reqRecord.id,
      'sistema',
      'Vinchi',
      'sistema',
      `Negocio "${reqRecord.businessName}" activado y abierto con éxito con la misma cuenta.`
    );

    saveDb(db);
    broadcastRequestSync(reqRecord);

    res.json({
      ok: true,
      user: sanitizeUser(user),
      request: stripInternalRequest(reqRecord),
    });
  });

  // --- AGENT WORKSPACE ROUTES ---
  app.get('/api/agent/workspace', (req, res) => {
    const user = getAuthFromHeader(req);
    if (!user || user.role !== 'agente') {
      res.status(403).json({ error: 'Acceso restringido al rol de Agente.' });
      return;
    }
    let agent = db.agents.find((a) => a.userId === user.id);
    if (!agent) {
      agent = createDefaultAgentProfile({
        userId: user.id,
        nombre: user.nombre,
        email: user.email,
      });
      db.agents.push(agent);
      saveDb(db);
    }

    const relevantRequests = db.requests
      .filter((r) => r.assignedAgentId === user.id && r.status !== 'rejected_by_agent')
      .map(stripInternalRequest)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    const messagesByRequest: Record<string, PortalChatMessage[]> = {};
    for (const r of relevantRequests) {
      messagesByRequest[r.id] = db.messages[r.id] ?? [];
    }

    res.json({
      disponible: agent.disponible,
      kpis: {
        comerciosVinculados: agent.comerciosVinculados,
        setupFeesCobrados: agent.setupFeesCobrados,
        comisionAcumuladaCop: agent.comisionAcumuladaCop,
        tasaConversion: agent.tasaConversion,
      },
      vinchiTotalCop: db.vinchiTotalCop,
      profile: getAgentProfilePayload(agent),
      stats: agent.stats,
      wallet: agent.wallet,
      requests: relevantRequests,
      messagesByRequest,
    });
  });

  app.post('/api/agent/decision', (req, res) => {
    const user = getAuthFromHeader(req);
    if (!user || user.role !== 'agente') {
      res.status(403).json({ error: 'No autorizado.' });
      return;
    }
    const requestId = String(req.body?.requestId || '');
    const decision = String(req.body?.decision || '');
    if (decision !== 'accept' && decision !== 'reject') {
      res.status(400).json({ error: 'Decisión inválida.' });
      return;
    }

    const reqRecord = db.requests.find((r) => r.id === requestId && r.assignedAgentId === user.id);
    const agent = db.agents.find((a) => a.userId === user.id);
    if (!reqRecord || !agent) {
      res.status(404).json({ error: 'Solicitud no encontrada.' });
      return;
    }

    if (decision === 'accept') {
      reqRecord.status = 'matched';
      agent.stats.clientesAceptados += 1;
      appendChatMessage(
        reqRecord.id,
        user.id,
        agent.nombre,
        'agente',
        `Hola ${reqRecord.clientName}, acepté tu solicitud. Soy ${agent.nombre}, agente certificado Vinchi. Cuéntame sobre "${reqRecord.businessName}" para verificar tu espacio.`
      );
    } else {
      agent.stats.clientesNegados += 1;
      reqRecord.rejectedByAgentIds = [...(reqRecord.rejectedByAgentIds ?? []), user.id];
      reqRecord.assignedAgentId = undefined;
      reqRecord.assignedAgentName = undefined;
      reqRecord.assignedAgentEmail = undefined;
      reqRecord.status = 'rejected_by_agent';
      appendChatMessage(
        reqRecord.id,
        'sistema',
        'Vinchi',
        'sistema',
        'El agente no pudo tomar la solicitud en este momento. Pulsa nuevamente "Buscar agente automático" para conectarte con otro agente disponible.'
      );
    }

    reqRecord.updatedAt = new Date().toISOString();
    saveDb(db);
    broadcastRequestSync(reqRecord);

    res.json({ request: stripInternalRequest(reqRecord) });
  });

  app.post('/api/agent/availability', (req, res) => {
    const user = getAuthFromHeader(req);
    if (!user || user.role !== 'agente') {
      res.status(403).json({ error: 'No autorizado.' });
      return;
    }
    const agent = db.agents.find((a) => a.userId === user.id);
    if (!agent) {
      res.status(404).json({ error: 'Agente no encontrado.' });
      return;
    }
    agent.disponible = Boolean(req.body?.disponible);
    saveDb(db);
    emitToUser(user.id, { type: 'agent:workspace' });
    for (const r of db.requests) {
      emitToUser(r.clientId, {
        type: 'portal:update',
        request: stripInternalRequest(r),
        messages: db.messages[r.id] ?? [],
        availableAgentsCount: db.agents.filter((a) => a.disponible).length,
      });
    }
    res.json({ disponible: agent.disponible });
  });

  app.put('/api/agent/profile', (req, res) => {
    const user = getAuthFromHeader(req);
    if (!user || user.role !== 'agente') {
      res.status(403).json({ error: 'No autorizado.' });
      return;
    }
    const agent = db.agents.find((a) => a.userId === user.id);
    if (!agent) {
      res.status(404).json({ error: 'Perfil no encontrado.' });
      return;
    }

    const primerNombre = String(req.body?.primerNombre ?? agent.primerNombre).trim();
    const segundoNombre =
      String(req.body?.segundoNombre ?? agent.segundoNombre ?? '').trim() || undefined;
    const primerApellido = String(req.body?.primerApellido ?? agent.primerApellido).trim();
    const segundoApellido =
      String(req.body?.segundoApellido ?? agent.segundoApellido ?? '').trim() || undefined;

    if (primerNombre.length < 2 || primerApellido.length < 2) {
      res.status(400).json({ error: 'Primer nombre y primer apellido son obligatorios.' });
      return;
    }

    const fullName = buildFullName({
      primerNombre,
      segundoNombre,
      primerApellido,
      segundoApellido,
    });

    agent.primerNombre = primerNombre;
    agent.segundoNombre = segundoNombre;
    agent.primerApellido = primerApellido;
    agent.segundoApellido = segundoApellido;
    agent.nombre = fullName;
    if (typeof req.body?.avatarDataUrl === 'string') {
      agent.avatarDataUrl = req.body.avatarDataUrl || undefined;
      user.avatarDataUrl = agent.avatarDataUrl;
    }
    user.primerNombre = primerNombre;
    user.segundoNombre = segundoNombre;
    user.primerApellido = primerApellido;
    user.segundoApellido = segundoApellido;
    user.nombre = fullName;

    agent.telefono = String(req.body?.telefono ?? agent.telefono).trim();
    user.telefono = agent.telefono;
    agent.departamento = String(req.body?.departamento ?? agent.departamento).trim();
    agent.municipio = String(req.body?.municipio ?? agent.municipio).trim();
    agent.horario = String(req.body?.horario ?? agent.horario).trim();
    agent.bio = String(req.body?.bio ?? agent.bio).trim();

    saveDb(db);
    res.json({
      profile: getAgentProfilePayload(agent),
      user: sanitizeUser(user),
    });
  });

  app.post('/api/agent/wallet/cards', (req, res) => {
    const user = getAuthFromHeader(req);
    if (!user || user.role !== 'agente') {
      res.status(403).json({ error: 'No autorizado.' });
      return;
    }
    const agent = db.agents.find((a) => a.userId === user.id);
    if (!agent) {
      res.status(404).json({ error: 'Agente no encontrado.' });
      return;
    }

    const alias = String(req.body?.alias || '').trim();
    const banco = String(req.body?.banco || '').trim();
    const numero = String(req.body?.numero || '').replace(/\D/g, '');
    const titular = String(req.body?.titular || agent.nombre).trim();
    const expiracion = String(req.body?.expiracion || '12/29').trim();
    const tipo = (req.body?.tipo || 'Debito') as 'Debito' | 'Credito' | 'Cuenta Bancaria';

    if (!alias || !banco || numero.length < 4) {
      res.status(400).json({ error: 'Ingresa alias, banco y los dígitos de la tarjeta o cuenta.' });
      return;
    }

    const isFirst = agent.wallet.cards.length === 0;
    const makeDefault = Boolean(req.body?.predeterminada) || isFirst;
    if (makeDefault) {
      for (const c of agent.wallet.cards) c.predeterminada = false;
    }

    agent.wallet.cards.push({
      id: `card-${Date.now()}-${randomBytes(2).toString('hex')}`,
      alias,
      banco,
      ultimos4: numero.slice(-4),
      titular,
      expiracion,
      tipo,
      predeterminada: makeDefault,
    });

    saveDb(db);
    res.status(201).json({ wallet: agent.wallet });
  });

  app.delete('/api/agent/wallet/cards/:cardId', (req, res) => {
    const user = getAuthFromHeader(req);
    if (!user || user.role !== 'agente') {
      res.status(403).json({ error: 'No autorizado.' });
      return;
    }
    const agent = db.agents.find((a) => a.userId === user.id);
    if (!agent) {
      res.status(404).json({ error: 'Agente no encontrado.' });
      return;
    }
    agent.wallet.cards = agent.wallet.cards.filter((c) => c.id !== req.params.cardId);
    if (agent.wallet.cards.length > 0 && !agent.wallet.cards.some((c) => c.predeterminada)) {
      agent.wallet.cards[0].predeterminada = true;
    }
    saveDb(db);
    res.json({ wallet: agent.wallet });
  });

  app.put('/api/agent/wallet/autopay', (req, res) => {
    const user = getAuthFromHeader(req);
    if (!user || user.role !== 'agente') {
      res.status(403).json({ error: 'No autorizado.' });
      return;
    }
    const agent = db.agents.find((a) => a.userId === user.id);
    if (!agent) {
      res.status(404).json({ error: 'Agente no encontrado.' });
      return;
    }
    const enabled = Boolean(req.body?.autoMonthlyEnabled);
    const day = Math.min(28, Math.max(1, Number(req.body?.autoMonthlyDay || 1)));
    const defaultCardId = req.body?.defaultCardId ? String(req.body.defaultCardId) : undefined;

    if (enabled && agent.wallet.cards.length === 0) {
      res.status(400).json({
        error: 'Agrega primero al menos una tarjeta o cuenta a tu billetera para activar el retiro automático mensual.',
      });
      return;
    }

    if (defaultCardId) {
      for (const c of agent.wallet.cards) {
        c.predeterminada = c.id === defaultCardId;
      }
    }

    agent.wallet.autoMonthlyEnabled = enabled;
    agent.wallet.autoMonthlyDay = day;
    saveDb(db);
    res.json({ wallet: agent.wallet });
  });

  app.post('/api/agent/wallet/withdraw', (req, res) => {
    const user = getAuthFromHeader(req);
    if (!user || user.role !== 'agente') {
      res.status(403).json({ error: 'No autorizado.' });
      return;
    }
    const agent = db.agents.find((a) => a.userId === user.id);
    if (!agent) {
      res.status(404).json({ error: 'Agente no encontrado.' });
      return;
    }

    const amount = Number(req.body?.montoCop || 0);
    const cardId = String(req.body?.cardId || '');
    const card =
      agent.wallet.cards.find((c) => c.id === cardId) ??
      agent.wallet.cards.find((c) => c.predeterminada);

    if (!card) {
      res.status(400).json({ error: 'Agrega o selecciona una tarjeta en tu billetera para retirar.' });
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      res.status(400).json({ error: 'Ingresa un monto válido para retirar.' });
      return;
    }
    if (amount > agent.wallet.saldoDisponibleCop) {
      res.status(400).json({ error: 'El monto supera tu saldo disponible.' });
      return;
    }

    agent.wallet.saldoDisponibleCop -= amount;
    agent.wallet.totalRetiradoCop += amount;
    agent.wallet.withdrawals.unshift({
      id: `wd-${Date.now()}-${randomBytes(2).toString('hex')}`,
      montoCop: amount,
      cardLabel: `${card.banco} •••• ${card.ultimos4}`,
      tipo: 'Manual',
      estado: 'Procesado',
      createdAt: new Date().toISOString(),
    });

    saveDb(db);
    res.json({ wallet: agent.wallet });
  });

  app.post('/api/agent/messages', (req, res) => {
    const user = getAuthFromHeader(req);
    if (!user || user.role !== 'agente') {
      res.status(403).json({ error: 'No autorizado.' });
      return;
    }
    const requestId = String(req.body?.requestId || '');
    const text = String(req.body?.text || '').trim();
    const reqRecord = db.requests.find((r) => r.id === requestId && r.assignedAgentId === user.id);
    if (!reqRecord) {
      res.status(404).json({ error: 'Solicitud no encontrada.' });
      return;
    }
    if (reqRecord.status === 'pending_agent_decision') {
      res.status(400).json({ error: 'Acepta primero la solicitud para iniciar el chat.' });
      return;
    }
    if (!text) {
      res.status(400).json({ error: 'Escribe un mensaje.' });
      return;
    }

    const msg = appendChatMessage(reqRecord.id, user.id, user.nombre, 'agente', text);
    reqRecord.updatedAt = new Date().toISOString();
    saveDb(db);

    emitToUser(reqRecord.clientId, { type: 'chat:message', message: msg });
    emitToUser(user.id, { type: 'chat:message', message: msg });

    res.json({ message: msg });
  });

  app.post('/api/agent/call', (req, res) => {
    const user = getAuthFromHeader(req);
    if (!user || user.role !== 'agente') {
      res.status(403).json({ error: 'No autorizado.' });
      return;
    }
    const requestId = String(req.body?.requestId || '');
    const action = String(req.body?.action || '');
    const reqRecord = db.requests.find((r) => r.id === requestId && r.assignedAgentId === user.id);
    if (!reqRecord) {
      res.status(404).json({ error: 'Solicitud no encontrada.' });
      return;
    }

    if (action === 'start') {
      reqRecord.callState = {
        status: 'ringing',
        initiatorRole: 'agente',
        startedAt: new Date().toISOString(),
      };
      appendChatMessage(
        reqRecord.id,
        'sistema',
        'Llamada',
        'sistema',
        `${user.nombre} está llamando al comercio.`
      );
    } else if (action === 'answer') {
      reqRecord.callState = {
        status: 'connected',
        initiatorRole: reqRecord.callState.initiatorRole || 'cliente',
        startedAt: new Date().toISOString(),
      };
      appendChatMessage(reqRecord.id, 'sistema', 'Llamada', 'sistema', 'Llamada conectada en vivo.');
    } else {
      reqRecord.callState = { status: 'idle' };
      appendChatMessage(reqRecord.id, 'sistema', 'Llamada', 'sistema', 'Llamada finalizada.');
    }

    reqRecord.updatedAt = new Date().toISOString();
    saveDb(db);
    broadcastRequestSync(reqRecord);
    res.json({ request: stripInternalRequest(reqRecord) });
  });

  app.post('/api/agent/activate', (req, res) => {
    const user = getAuthFromHeader(req);
    if (!user || user.role !== 'agente') {
      res.status(403).json({ error: 'No autorizado.' });
      return;
    }
    const requestId = String(req.body?.requestId || '');
    const mode = req.body?.mode as ActivationMode;
    if (mode !== 'virtual' && mode !== 'presencial') {
      res.status(400).json({ error: 'Modo de activación inválido.' });
      return;
    }

    const reqRecord = db.requests.find((r) => r.id === requestId && r.assignedAgentId === user.id);
    if (!reqRecord) {
      res.status(404).json({ error: 'Solicitud asignada no encontrada.' });
      return;
    }

    const tokenCode = reqRecord.activationToken || generateActivationToken();
    reqRecord.activationToken = tokenCode;
    reqRecord.activationMode = mode;
    reqRecord.updatedAt = new Date().toISOString();

    if (mode === 'virtual') {
      applyEarningsDelta(reqRecord, 10000, 5000, 'virtual');
      reqRecord.tokenUnlocked = !reqRecord.visitPaid || reqRecord.visitCompleted;
      reqRecord.requiresVisitWarning = !reqRecord.visitPaid;
      reqRecord.status = 'activated_virtual';
      reqRecord.announcementTitle = 'Espacio verificado · Cuenta activada en modo virtual';
      reqRecord.announcementBody = `Tu agente ${user.nombre} verificó "${reqRecord.businessName}". Ya puedes abrir tu negocio usando el código de activación ${tokenCode}.`;
      reqRecord.emailNotice = {
        id: `mail-${Date.now()}`,
        toEmail: reqRecord.clientEmail,
        subject: `Tu espacio en Vinchi fue verificado · Código ${tokenCode}`,
        body: `Hola ${reqRecord.clientName}, tu agente ${user.nombre} activó tu cuenta virtual para "${reqRecord.businessName}". Ingresa el código ${tokenCode} en Explorar Portal Agentes para abrir tu negocio con esta misma cuenta.`,
        sentAt: new Date().toISOString(),
      };
      appendChatMessage(
        reqRecord.id,
        'sistema',
        'Vinchi',
        'sistema',
        `Agente activó la cuenta en modo Virtual (Ganancia agente: $10.000 COP). Código enviado al correo ${reqRecord.clientEmail}: ${tokenCode}.`
      );
    } else {
      applyEarningsDelta(reqRecord, 30000, 5000, 'presencial');
      if (!reqRecord.visitPaid) {
        reqRecord.status = 'awaiting_visit_payment';
        reqRecord.tokenUnlocked = false;
        reqRecord.requiresVisitWarning = false;
        reqRecord.announcementTitle = 'Activación presencial asignada · Pago de visita requerido';
        reqRecord.announcementBody = `Tu agente ${user.nombre} programó la activación presencial para "${reqRecord.businessName}". Completa el pago de la visita ($20.000 COP adicionales) y espera la visita para habilitar el ingreso con código.`;
        reqRecord.emailNotice = {
          id: `mail-${Date.now()}`,
          toEmail: reqRecord.clientEmail,
          subject: 'Activación presencial asignada en Vinchi',
          body: `Hola ${reqRecord.clientName}, tu agente asignó la modalidad presencial para "${reqRecord.businessName}". Completa el pago de la visita para agendar al agente y habilitar tu código de apertura.`,
          sentAt: new Date().toISOString(),
        };
        appendChatMessage(
          reqRecord.id,
          'sistema',
          'Vinchi',
          'sistema',
          `Agente seleccionó Activar cuenta presencial (Ganancia agente: $30.000 COP). Esperando pago y realización de la visita.`
        );
      } else if (!reqRecord.visitCompleted) {
        reqRecord.status = 'awaiting_visit_completion';
        reqRecord.tokenUnlocked = false;
        reqRecord.requiresVisitWarning = false;
        reqRecord.announcementTitle = 'Visita presencial confirmada · Pendiente de visita en sitio';
        reqRecord.announcementBody = `El pago de la visita está listo. El botón para ingresar tu código de activación permanecerá deshabilitado hasta que ${user.nombre} complete la visita presencial y lo habilite.`;
      } else {
        reqRecord.status = 'activated_presencial';
        reqRecord.tokenUnlocked = true;
        reqRecord.requiresVisitWarning = false;
      }
    }

    saveDb(db);
    broadcastRequestSync(reqRecord);

    res.json({ request: stripInternalRequest(reqRecord) });
  });

  app.post('/api/agent/complete-visit', (req, res) => {
    const user = getAuthFromHeader(req);
    if (!user || user.role !== 'agente') {
      res.status(403).json({ error: 'No autorizado.' });
      return;
    }
    const requestId = String(req.body?.requestId || '');
    const reqRecord = db.requests.find((r) => r.id === requestId && r.assignedAgentId === user.id);
    if (!reqRecord) {
      res.status(404).json({ error: 'Solicitud no encontrada.' });
      return;
    }
    if (!reqRecord.visitPaid) {
      res.status(400).json({ error: 'El cliente aún no ha pagado la visita presencial.' });
      return;
    }

    const tokenCode = reqRecord.activationToken || generateActivationToken();
    reqRecord.activationToken = tokenCode;
    reqRecord.visitCompleted = true;
    reqRecord.tokenUnlocked = true;
    reqRecord.requiresVisitWarning = false;
    reqRecord.status = 'activated_presencial';
    reqRecord.announcementTitle = 'Visita presencial completada · Código habilitado';
    reqRecord.announcementBody = `El agente ${user.nombre} finalizó la visita en "${reqRecord.businessName}" y habilitó tu acceso. Ingresa el código ${tokenCode} para abrir tu negocio.`;
    reqRecord.emailNotice = {
      id: `mail-${Date.now()}`,
      toEmail: reqRecord.clientEmail,
      subject: `Visita completada · Código de apertura ${tokenCode}`,
      body: `Hola ${reqRecord.clientName}, tu agente completó la visita presencial a "${reqRecord.businessName}". Ya tienes habilitado el botón en Explorar Portal Agentes para ingresar tu código ${tokenCode}.`,
      sentAt: new Date().toISOString(),
    };
    reqRecord.updatedAt = new Date().toISOString();

    appendChatMessage(
      reqRecord.id,
      'sistema',
      'Vinchi',
      'sistema',
      `Visita presencial completada. Botón de código de activación habilitado (${tokenCode}). Notificación enviada a ${reqRecord.clientEmail}.`
    );

    saveDb(db);
    broadcastRequestSync(reqRecord);

    res.json({ request: stripInternalRequest(reqRecord) });
  });

  // --- ORDERS ROUTES ---
  app.get('/api/orders', (_req, res) => {
    res.json({ orders: db.orders });
  });

  app.post('/api/orders/:id/cobrar', (req, res) => {
    const user = getAuthFromHeader(req);
    if (!user || (user.role !== 'comercio' && user.role !== 'superadmin')) {
      res.status(403).json({ error: 'No autorizado.' });
      return;
    }
    db.orders = db.orders.map((o) => (o.id === req.params.id ? { ...o, estado: 'Cobrada' } : o));
    saveDb(db);
    res.json({ orders: db.orders });
  });

  app.post('/api/orders/:id/anular', (req, res) => {
    const user = getAuthFromHeader(req);
    if (!user || (user.role !== 'comercio' && user.role !== 'superadmin')) {
      res.status(403).json({ error: 'No autorizado.' });
      return;
    }
    db.orders = db.orders.map((o) => (o.id === req.params.id ? { ...o, estado: 'Anulada' } : o));
    saveDb(db);
    res.json({ orders: db.orders });
  });

  // --- COMERCIO / EMPRESARIO WORKSPACE ROUTES ---
  function ensureBusinessWorkspace(user: StoredUser): BusinessWorkspaceState {
    const existing = db.businessesByUser[user.id];
    if (existing) {
      return existing;
    }
    const isSeededBistro = user.id === 'usr-comercio-1';
    const bistro = SEEDED_CLIENT_COMPANIES[0];
    const initialProfile: BusinessProfileSettings = isSeededBistro
      ? {
          negocioNombre: user.negocioNombre || bistro.nombre,
          descripcion: bistro.descripcion,
          ciudad: bistro.ciudad,
          barrio: bistro.barrio,
          direccionLocal: bistro.direccionLocal,
          tiempoEntregaMin: bistro.tiempoEntregaMin,
          costoDomicilioCop: bistro.costoDomicilioCop,
          logoIcon: (bistro.logoIcon || 'steak') as ClientCompanyLogoIcon,
          bannerTone: bistro.bannerTone,
          logoDataUrl: bistro.logoDataUrl,
        }
      : {
          negocioNombre: user.negocioNombre || `Espacio de ${user.primerNombre}`,
          descripcion: 'Comercio registrado y activo en la red directa Vinchi con 0% comisión.',
          ciudad: 'Bogotá',
          barrio: 'Zona Activa',
          direccionLocal: 'Dirección comercial verificada',
          tiempoEntregaMin: 25,
          costoDomicilioCop: 4000,
          logoIcon: 'store',
          bannerTone: 'from-[#442c61] to-[#9c44dc]',
        };

    const created: BusinessWorkspaceState = {
      businessId: isSeededBistro ? 'emp-bistro-central' : `emp-user-${user.id}`,
      plan: 'basico',
      planSelected: false,
      planBillingCycle: 'mensual',
      profile: initialProfile,
      ads: [],
      qrCodes: [],
      teamMembers: [],
    };
    db.businessesByUser[user.id] = created;
    saveDb(db);
    return created;
  }

  function canManageBusiness(user: StoredUser | null): user is StoredUser {
    if (!user) return false;
    return user.role === 'comercio' || user.role === 'superadmin' || Boolean(user.businessActivated);
  }

  app.get('/api/comercio/workspace', (req, res) => {
    const user = getAuthFromHeader(req);
    if (!canManageBusiness(user)) {
      res.status(403).json({ error: 'Acceso reservado para cuentas de Empresario.' });
      return;
    }
    const workspace = ensureBusinessWorkspace(user);
    res.json({ workspace });
  });

  app.post('/api/comercio/plan/select', (req, res) => {
    const user = getAuthFromHeader(req);
    if (!canManageBusiness(user)) {
      res.status(403).json({ error: 'No autorizado.' });
      return;
    }
    const ws = ensureBusinessWorkspace(user);
    const planId = req.body?.planId as BusinessPlanId;
    const billingCycle = req.body?.billingCycle === 'anual' ? 'anual' : 'mensual';
    const paymentMethod = String(req.body?.paymentMethod || '').trim();

    if (planId !== 'basico' && planId !== 'premium' && planId !== 'ultra') {
      res.status(400).json({ error: 'Plan seleccionado no válido.' });
      return;
    }
    if ((planId === 'premium' || planId === 'ultra') && !paymentMethod) {
      res.status(400).json({ error: 'Selecciona y confirma un método de pago para activar este plan.' });
      return;
    }

    ws.plan = planId;
    ws.planSelected = true;
    ws.planBillingCycle = billingCycle;
    ws.planPaymentMethod = planId === 'basico' ? 'Gratis' : paymentMethod;
    ws.planActivatedAt = new Date().toISOString();
    saveDb(db);

    const planNames: Record<BusinessPlanId, string> = {
      basico: 'Básico Gratis',
      premium: 'Premium',
      ultra: 'Ultra',
    };
    res.json({
      workspace: ws,
      message:
        planId === 'basico'
          ? 'Plan Básico Gratis activado. Ya puedes gestionar tu espacio privado.'
          : `Pago aprobado vía ${paymentMethod}. Plan ${planNames[planId]} (${billingCycle}) activado con éxito.`,
    });
  });

  app.put('/api/comercio/profile', (req, res) => {
    const user = getAuthFromHeader(req);
    if (!canManageBusiness(user)) {
      res.status(403).json({ error: 'No autorizado.' });
      return;
    }
    const ws = ensureBusinessWorkspace(user);
    const negocioNombre = String(req.body?.negocioNombre || ws.profile.negocioNombre).trim();
    const descripcion = String(req.body?.descripcion || ws.profile.descripcion).trim();
    const ciudad = String(req.body?.ciudad || ws.profile.ciudad).trim();
    const barrio = String(req.body?.barrio || ws.profile.barrio).trim();
    const direccionLocal = String(req.body?.direccionLocal || ws.profile.direccionLocal).trim();
    const tiempoEntregaMin = Math.max(10, Math.min(120, Number(req.body?.tiempoEntregaMin ?? ws.profile.tiempoEntregaMin) || 25));
    const costoDomicilioCop = Math.max(0, Math.min(50000, Number(req.body?.costoDomicilioCop ?? ws.profile.costoDomicilioCop) || 4000));
    const logoIcon = (req.body?.logoIcon || ws.profile.logoIcon || 'store') as ClientCompanyLogoIcon;
    const bannerTone = String(req.body?.bannerTone || ws.profile.bannerTone);
    const logoDataUrl =
      req.body?.logoDataUrl === null
        ? undefined
        : typeof req.body?.logoDataUrl === 'string'
          ? req.body.logoDataUrl
          : ws.profile.logoDataUrl;

    if (negocioNombre.length < 2 || descripcion.length < 6) {
      res.status(400).json({ error: 'Ingresa un nombre comercial y una descripción válida.' });
      return;
    }

    ws.profile = {
      negocioNombre,
      descripcion,
      ciudad,
      barrio,
      direccionLocal,
      tiempoEntregaMin,
      costoDomicilioCop,
      logoIcon,
      bannerTone,
      logoDataUrl,
    };
    user.negocioNombre = negocioNombre;
    saveDb(db);

    res.json({
      workspace: ws,
      user: sanitizeUser(user),
      message: 'Perfil comercial y logotipo actualizados en vivo en el catálogo de clientes.',
    });
  });

  app.post('/api/comercio/ads', (req, res) => {
    const user = getAuthFromHeader(req);
    if (!canManageBusiness(user)) {
      res.status(403).json({ error: 'No autorizado.' });
      return;
    }
    const ws = ensureBusinessWorkspace(user);
    const titulo = String(req.body?.titulo || '').trim();
    const mensaje = String(req.body?.mensaje || '').trim();
    const paymentMethod = String(req.body?.paymentMethod || '').trim();

    if (titulo.length < 3 || mensaje.length < 8) {
      res.status(400).json({ error: 'Escribe el título y el mensaje promocional de tu anuncio.' });
      return;
    }

    const isUltra = ws.plan === 'ultra';
    if (!isUltra && !paymentMethod) {
      res.status(400).json({
        error: 'En los planes Básico y Premium debes completar el pago de $25.000 COP para publicar tu anuncio.',
      });
      return;
    }

    const newAd: BusinessAdCampaign = {
      id: `ad-${Date.now()}-${randomBytes(2).toString('hex')}`,
      titulo,
      mensaje,
      montoPagadoCop: isUltra ? 0 : 25000,
      metodoPago: isUltra ? 'Incluido en Plan Ultra' : paymentMethod,
      incluidoEnPlan: isUltra,
      activo: true,
      createdAt: new Date().toISOString(),
    };
    ws.ads.unshift(newAd);
    saveDb(db);

    res.status(201).json({
      workspace: ws,
      message: isUltra
        ? 'Anuncio publicado sin costo adicional gracias a tu Plan Ultra.'
        : `Pago de $25.000 COP aprobado (${paymentMethod}). Tu Anuncio Dorado ya está visible en Catálogo y Foro.`,
    });
  });

  app.post('/api/comercio/qr', async (req, res) => {
    const user = getAuthFromHeader(req);
    if (!canManageBusiness(user)) {
      res.status(403).json({ error: 'No autorizado.' });
      return;
    }
    const ws = ensureBusinessWorkspace(user);
    if (ws.plan === 'basico') {
      res.status(403).json({
        error: 'El plan Básico Gratis no permite generar códigos QR. Mejora a Premium o Ultra para desbloquear esta función.',
      });
      return;
    }

    const nombre = String(req.body?.nombre || '').trim();
    const mesaORef = String(req.body?.mesaORef || '').trim();
    if (nombre.length < 2 || mesaORef.length < 1) {
      res.status(400).json({ error: 'Ingresa el nombre y la mesa o referencia del código QR.' });
      return;
    }

    const slug = mesaORef
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'mesa';
    const urlDestino = `https://vinchi.app/carta/${ws.businessId}?punto=${encodeURIComponent(slug)}`;

    try {
      const qrDataUrl = await QRCode.toDataURL(urlDestino, {
        margin: 2,
        width: 320,
        color: { dark: '#442c61', light: '#ffffff' },
      });
      const newQr: BusinessQrCode = {
        id: `qr-${Date.now()}-${randomBytes(2).toString('hex')}`,
        nombre,
        mesaORef,
        urlDestino,
        qrDataUrl,
        createdAt: new Date().toISOString(),
      };
      ws.qrCodes.unshift(newQr);
      saveDb(db);
      res.status(201).json({
        workspace: ws,
        message: `Código QR "${nombre}" generado y listo para imprimir o descargar.`,
      });
    } catch {
      res.status(500).json({ error: 'No fue posible generar la imagen del código QR.' });
    }
  });

  app.delete('/api/comercio/qr/:id', (req, res) => {
    const user = getAuthFromHeader(req);
    if (!canManageBusiness(user)) {
      res.status(403).json({ error: 'No autorizado.' });
      return;
    }
    const ws = ensureBusinessWorkspace(user);
    ws.qrCodes = ws.qrCodes.filter((q) => q.id !== req.params.id);
    saveDb(db);
    res.json({ workspace: ws, message: 'Código QR eliminado.' });
  });

  app.post('/api/comercio/team', (req, res) => {
    const user = getAuthFromHeader(req);
    if (!canManageBusiness(user)) {
      res.status(403).json({ error: 'No autorizado.' });
      return;
    }
    const ws = ensureBusinessWorkspace(user);
    const nombre = String(req.body?.nombre || '').trim();
    const cargo = String(req.body?.cargo || '').trim();
    const pinAcceso = String(req.body?.pinAcceso || '').trim().toUpperCase();
    const rawPerms = (req.body?.permisos || {}) as Partial<BusinessPermissions>;

    if (nombre.length < 2 || cargo.length < 2 || pinAcceso.length < 4) {
      res.status(400).json({ error: 'Completa nombre, cargo y un PIN de acceso de al menos 4 caracteres.' });
      return;
    }

    const member: BusinessTeamMember = {
      id: `tm-${Date.now()}-${randomBytes(2).toString('hex')}`,
      nombre,
      cargo,
      pinAcceso,
      activo: true,
      permisos: {
        cobrarOrdenes: Boolean(rawPerms.cobrarOrdenes),
        anularOrdenes: Boolean(rawPerms.anularOrdenes),
        gestionarDomicilios: Boolean(rawPerms.gestionarDomicilios),
        editarPerfilYMenu: Boolean(rawPerms.editarPerfilYMenu),
        verEstadisticas: Boolean(rawPerms.verEstadisticas),
        crearAnuncios: Boolean(rawPerms.crearAnuncios),
        crearQr: Boolean(rawPerms.crearQr),
        gestionarEquipo: Boolean(rawPerms.gestionarEquipo),
      },
      createdAt: new Date().toISOString(),
    };
    ws.teamMembers.unshift(member);
    saveDb(db);
    res.status(201).json({
      workspace: ws,
      message: `Colaborador "${nombre}" agregado con PIN ${pinAcceso}.`,
    });
  });

  app.put('/api/comercio/team/:id', (req, res) => {
    const user = getAuthFromHeader(req);
    if (!canManageBusiness(user)) {
      res.status(403).json({ error: 'No autorizado.' });
      return;
    }
    const ws = ensureBusinessWorkspace(user);
    ws.teamMembers = ws.teamMembers.map((m) => {
      if (m.id !== req.params.id) return m;
      return {
        ...m,
        activo: typeof req.body?.activo === 'boolean' ? req.body.activo : m.activo,
        permisos: req.body?.permisos ? { ...m.permisos, ...req.body.permisos } : m.permisos,
      };
    });
    saveDb(db);
    res.json({ workspace: ws, message: 'Permisos actualizados correctamente.' });
  });

  app.delete('/api/comercio/team/:id', (req, res) => {
    const user = getAuthFromHeader(req);
    if (!canManageBusiness(user)) {
      res.status(403).json({ error: 'No autorizado.' });
      return;
    }
    const ws = ensureBusinessWorkspace(user);
    ws.teamMembers = ws.teamMembers.filter((m) => m.id !== req.params.id);
    saveDb(db);
    res.json({ workspace: ws, message: 'Colaborador removido del equipo.' });
  });

  // --- COURIER ONBOARDING & WORKSPACE ROUTES ---
  app.get('/api/courier-application/me', (req, res) => {
    const user = getAuthFromHeader(req);
    if (!user) {
      res.status(401).json({ error: 'Debes iniciar sesión primero.' });
      return;
    }
    const existing = db.courierApplications.find((a) => a.userId === user.id) ?? null;
    res.json({
      application: existing,
      user: sanitizeUser(user),
    });
  });

  app.post('/api/courier-application/submit', (req, res) => {
    const user = getAuthFromHeader(req);
    if (!user) {
      res.status(401).json({ error: 'Debes iniciar sesión para completar tu perfil de domicilio.' });
      return;
    }

    const primerNombre = String(req.body?.primerNombre || user.primerNombre || '').trim();
    const segundoNombre =
      String(req.body?.segundoNombre ?? user.segundoNombre ?? '').trim() || undefined;
    const primerApellido = String(req.body?.primerApellido || user.primerApellido || '').trim();
    const segundoApellido =
      String(req.body?.segundoApellido ?? user.segundoApellido ?? '').trim() || undefined;

    if (primerNombre.length < 2 || primerApellido.length < 2) {
      res.status(400).json({ error: 'Tu primer nombre y primer apellido son obligatorios.' });
      return;
    }

    const answers = (req.body?.answers || {}) as Record<string, string>;
    const answerKeys = Object.keys(answers);
    if (answerKeys.length < 30 || answerKeys.some((k) => !String(answers[k] || '').trim())) {
      res.status(400).json({ error: 'Debes responder todas las 30 preguntas del formulario.' });
      return;
    }

    const cedulaNumero = String(req.body?.cedulaNumero || '').trim();
    const cedulaExpedicion = String(req.body?.cedulaExpedicion || '').trim();
    const cedulaArchivoNombre = String(req.body?.cedulaArchivoNombre || '').trim();
    const departamento = String(req.body?.departamento || '').trim();
    const municipio = String(req.body?.municipio || '').trim();
    const direccionCasa = String(req.body?.direccionCasa || '').trim();
    const barrio = String(req.body?.barrio || '').trim();
    const telefono = String(req.body?.telefono || user.telefono || '').trim();
    const vehiculo = String(req.body?.vehiculo || 'Motocicleta').trim();
    const facialVerified = Boolean(req.body?.facialVerified);
    const facialSnapshotDataUrl = req.body?.facialSnapshotDataUrl
      ? String(req.body.facialSnapshotDataUrl)
      : undefined;

    if (!cedulaNumero || !cedulaArchivoNombre) {
      res.status(400).json({ error: 'Completa tu cédula y adjunta el documento.' });
      return;
    }
    if (!departamento || !municipio || !direccionCasa) {
      res.status(400).json({
        error: 'Ingresa la dirección de tu casa junto con tu departamento y municipio.',
      });
      return;
    }
    if (!telefono || telefono.length < 7) {
      res.status(400).json({ error: 'Ingresa un número de teléfono válido.' });
      return;
    }
    if (!facialVerified) {
      res.status(400).json({ error: 'Debes completar el reconocimiento facial para ingresar.' });
      return;
    }

    const fullName = buildFullName({
      primerNombre,
      segundoNombre,
      primerApellido,
      segundoApellido,
    });

    user.primerNombre = primerNombre;
    user.segundoNombre = segundoNombre;
    user.primerApellido = primerApellido;
    user.segundoApellido = segundoApellido;
    user.nombre = fullName;
    user.telefono = telefono;
    if (facialSnapshotDataUrl && !user.avatarDataUrl) {
      user.avatarDataUrl = facialSnapshotDataUrl;
    }
    user.role = 'repartidor';
    user.courierApplicationStatus = 'approved';

    const record: CourierApplicationRecord = {
      id: `app-dm-${Date.now()}-${randomBytes(3).toString('hex')}`,
      userId: user.id,
      applicantName: fullName,
      applicantEmail: user.email,
      answers,
      cedulaNumero,
      cedulaExpedicion,
      cedulaArchivoNombre,
      departamento,
      municipio,
      direccionCasa,
      barrio,
      telefono,
      vehiculo,
      facialVerified,
      facialSnapshotDataUrl,
      submittedAt: new Date().toISOString(),
    };

    const existingIdx = db.courierApplications.findIndex((a) => a.userId === user.id);
    if (existingIdx >= 0) {
      db.courierApplications[existingIdx] = record;
    } else {
      db.courierApplications.push(record);
    }

    if (!db.couriers.some((c) => c.userId === user.id)) {
      db.couriers.push(
        createDefaultCourierProfile({
          userId: user.id,
          nombre: fullName,
          primerNombre,
          segundoNombre,
          primerApellido,
          segundoApellido,
          avatarDataUrl: user.avatarDataUrl,
          telefono,
          email: user.email,
          departamento,
          municipio,
          direccionCasa,
          vehiculo,
          seeded: false,
        })
      );
    }

    saveDb(db);
    res.status(201).json({
      ok: true,
      message: 'Perfil enviado · Ya puedes entrar a trabajar',
      application: record,
      user: sanitizeUser(user),
    });
  });

  function ensureCourierProfile(user: StoredUser): StoredCourierProfile {
    let courier = db.couriers.find((c) => c.userId === user.id);
    if (!courier) {
      courier = createDefaultCourierProfile({
        userId: user.id,
        nombre: user.nombre,
        primerNombre: user.primerNombre,
        segundoNombre: user.segundoNombre,
        primerApellido: user.primerApellido,
        segundoApellido: user.segundoApellido,
        avatarDataUrl: user.avatarDataUrl,
        telefono: user.telefono,
        email: user.email,
      });
      db.couriers.push(courier);
    }
    const today = todayKey();
    if (courier.lastToggleDate !== today) {
      courier.lastToggleDate = today;
      courier.togglesUsedToday = 0;
    }
    return courier;
  }

  function formatCourierWorkspace(courier: StoredCourierProfile) {
    return {
      activo: courier.activo,
      togglesUsedToday: courier.togglesUsedToday,
      maxTogglesPerDay: 3,
      vinchiAutoContract: courier.vinchiAutoContract,
      profile: getCourierProfilePayload(courier),
      stats: courier.stats,
      wallet: courier.wallet,
      activeOrder: courier.activeOrder,
      chatMessages: courier.chatMessages,
      companies: courier.companies,
      completedHistory: courier.completedHistory,
    };
  }

  app.get('/api/courier/workspace', (req, res) => {
    const user = getAuthFromHeader(req);
    if (!user || user.role !== 'repartidor') {
      res.status(403).json({ error: 'Acceso exclusivo para repartidores verificados.' });
      return;
    }
    const courier = ensureCourierProfile(user);
    saveDb(db);
    res.json(formatCourierWorkspace(courier));
  });

  app.post('/api/courier/toggle-active', (req, res) => {
    const user = getAuthFromHeader(req);
    if (!user || user.role !== 'repartidor') {
      res.status(403).json({ error: 'No autorizado.' });
      return;
    }
    const courier = ensureCourierProfile(user);
    if (courier.togglesUsedToday >= 3) {
      res.status(429).json({
        error: 'Alcanzaste el límite de 3 cambios de estado (Activo / No activo) por hoy.',
      });
      return;
    }

    courier.activo = !courier.activo;
    courier.togglesUsedToday += 1;

    if (courier.activo && !courier.activeOrder) {
      const order = buildSimulatedCourierOrder(courier);
      courier.activeOrder = order;
      courier.chatMessages = [
        {
          id: `cmsg-${Date.now()}-1`,
          orderId: order.id,
          channel: 'empresa',
          senderRole: 'empresa',
          senderName: order.empresaNombre,
          text: `Hola ${courier.primerNombre}, tenemos el pedido ${order.codigoOrden} (${order.comidaResumen}) listo para recoger en ${order.empresaDireccion}. Cuando llegues al local te damos el código de entrega.`,
          createdAt: new Date().toISOString(),
        },
        {
          id: `cmsg-${Date.now()}-2`,
          orderId: order.id,
          channel: 'empresa',
          senderRole: 'sistema',
          senderName: 'Despacho',
          text: `Código de recogida generado en caja para validación: ${order.pickupCodeExpected}`,
          createdAt: new Date().toISOString(),
        },
      ];
    }

    saveDb(db);
    res.json(formatCourierWorkspace(courier));
  });

  app.post('/api/courier/new-order', (req, res) => {
    const user = getAuthFromHeader(req);
    if (!user || user.role !== 'repartidor') {
      res.status(403).json({ error: 'No autorizado.' });
      return;
    }
    const courier = ensureCourierProfile(user);
    if (!courier.activo) {
      res.status(400).json({ error: 'Activa tu estado arriba del chat para recibir un domicilio.' });
      return;
    }
    if (courier.activeOrder) {
      res.json(formatCourierWorkspace(courier));
      return;
    }

    const order = buildSimulatedCourierOrder(courier);
    courier.activeOrder = order;
    courier.chatMessages = [
      {
        id: `cmsg-${Date.now()}-1`,
        orderId: order.id,
        channel: 'empresa',
        senderRole: 'empresa',
        senderName: order.empresaNombre,
        text: `¡Nuevo domicilio asignado! Recoge ${order.comidaResumen} en ${order.empresaDireccion}. Código de caja: ${order.pickupCodeExpected}.`,
        createdAt: new Date().toISOString(),
      },
    ];
    saveDb(db);
    res.json(formatCourierWorkspace(courier));
  });

  app.post('/api/courier/advance-distance', (req, res) => {
    const user = getAuthFromHeader(req);
    if (!user || user.role !== 'repartidor') {
      res.status(403).json({ error: 'No autorizado.' });
      return;
    }
    const courier = ensureCourierProfile(user);
    if (!courier.activeOrder) {
      res.status(404).json({ error: 'No tienes un domicilio activo en curso.' });
      return;
    }

    const order = courier.activeOrder;
    const requestedKm =
      typeof req.body?.distanciaKm === 'number' ? Number(req.body.distanciaKm) : undefined;

    if (order.step === 'to_company') {
      order.distanciaEmpresaKm =
        requestedKm !== undefined
          ? Math.max(0.1, Number(requestedKm.toFixed(1)))
          : Math.max(0.1, Number((order.distanciaEmpresaKm - 0.8).toFixed(1)));
    } else if (order.step === 'to_client') {
      const prevDist = order.distanciaClienteKm;
      order.distanciaClienteKm =
        requestedKm !== undefined
          ? Math.max(0.2, Number(requestedKm.toFixed(1)))
          : Math.max(0.4, Number((order.distanciaClienteKm - 1.8).toFixed(1)));

      if (prevDist > 5 && order.distanciaClienteKm <= 5) {
        courier.chatMessages.push({
          id: `cmsg-${Date.now()}-unlock`,
          orderId: order.id,
          channel: 'cliente',
          senderRole: 'cliente',
          senderName: order.clienteNombre,
          text: `Hola ${courier.primerNombre}, veo en el mapa que ya estás a ${order.distanciaClienteKm} km de mi ubicación (${order.clienteDireccion}). Cuando llegues te confirmo el código ${order.deliveryCodeExpected}.`,
          createdAt: new Date().toISOString(),
        });
      }
    }

    saveDb(db);
    res.json(formatCourierWorkspace(courier));
  });

  app.post('/api/courier/verify-pickup-code', (req, res) => {
    const user = getAuthFromHeader(req);
    if (!user || user.role !== 'repartidor') {
      res.status(403).json({ error: 'No autorizado.' });
      return;
    }
    const courier = ensureCourierProfile(user);
    const order = courier.activeOrder;
    if (!order || order.step !== 'to_company') {
      res.status(400).json({ error: 'No hay un pedido pendiente de recogida en empresa.' });
      return;
    }

    const code = String(req.body?.code || '').trim().toUpperCase();
    if (!code || code !== order.pickupCodeExpected.toUpperCase()) {
      res.status(400).json({
        error: `El código de recogida no coincide con el entregado por ${order.empresaNombre}.`,
      });
      return;
    }

    order.pickupVerified = true;
    order.step = 'to_client';
    order.distanciaEmpresaKm = 0;
    courier.stats.enviadosTotal += 1;

    if (order.distanciaClienteKm <= 5) {
      courier.chatMessages.push({
        id: `cmsg-${Date.now()}-cli`,
        orderId: order.id,
        channel: 'cliente',
        senderRole: 'cliente',
        senderName: order.clienteNombre,
        text: `Hola ${courier.primerNombre}, ¡gracias por recoger mi pedido! Mi código de recepción es ${order.deliveryCodeExpected}.`,
        createdAt: new Date().toISOString(),
      });
    }

    saveDb(db);
    res.json(formatCourierWorkspace(courier));
  });

  app.post('/api/courier/verify-delivery-code', (req, res) => {
    const user = getAuthFromHeader(req);
    if (!user || user.role !== 'repartidor') {
      res.status(403).json({ error: 'No autorizado.' });
      return;
    }
    const courier = ensureCourierProfile(user);
    const order = courier.activeOrder;
    if (!order || order.step !== 'to_client') {
      res.status(400).json({ error: 'No hay un pedido en camino hacia el cliente.' });
      return;
    }

    const code = String(req.body?.code || '').trim().toUpperCase();
    if (!code || code !== order.deliveryCodeExpected.toUpperCase()) {
      res.status(400).json({
        error: `El código de entrega del cliente no coincide. Verifica con ${order.clienteNombre}.`,
      });
      return;
    }

    courier.stats.entregadosTotal += 1;
    courier.stats.entregasHoy += 1;
    courier.stats.gananciasTotalesCop += order.pagoDomicilioCop;
    courier.wallet.saldoDisponibleCop += order.pagoDomicilioCop;

    courier.completedHistory.unshift({
      id: order.id,
      codigoOrden: order.codigoOrden,
      empresaNombre: order.empresaNombre,
      pagoDomicilioCop: order.pagoDomicilioCop,
      completedAt: new Date().toISOString(),
    });

    // Al terminar todo: deshabilita el chat y limpia la vista para no mostrar quien necesita servicio
    courier.activeOrder = null;
    courier.chatMessages = [];

    saveDb(db);
    res.json({
      ...formatCourierWorkspace(courier),
      completedMessage: `Entrega ${order.codigoOrden} confirmada. Ganaste $${order.pagoDomicilioCop.toLocaleString('es-CO')} COP.`,
    });
  });

  app.post('/api/courier/chat', (req, res) => {
    const user = getAuthFromHeader(req);
    if (!user || user.role !== 'repartidor') {
      res.status(403).json({ error: 'No autorizado.' });
      return;
    }
    const courier = ensureCourierProfile(user);
    const order = courier.activeOrder;
    if (!order || order.step === 'delivered') {
      res.status(400).json({ error: 'El chat está deshabilitado porque no hay un domicilio activo.' });
      return;
    }

    const text = String(req.body?.text || '').trim();
    if (!text) {
      res.status(400).json({ error: 'Escribe un mensaje antes de enviar.' });
      return;
    }

    if (order.step === 'to_client' && order.distanciaClienteKm > 5) {
      res.status(403).json({
        error: `El chat con el cliente se actualizará y habilitará cuando estés a 5 km o menos (actualmente a ${order.distanciaClienteKm} km).`,
      });
      return;
    }

    const channel = order.step === 'to_company' ? 'empresa' : 'cliente';
    const msg: CourierChatMessage = {
      id: `cmsg-${Date.now()}`,
      orderId: order.id,
      channel,
      senderRole: 'domiciliario',
      senderName: courier.nombre,
      text,
      createdAt: new Date().toISOString(),
    };
    courier.chatMessages.push(msg);

    // Respuesta contextual automática de la empresa o cliente para facilitar coordinación
    if (channel === 'empresa') {
      courier.chatMessages.push({
        id: `cmsg-${Date.now()}-reply`,
        orderId: order.id,
        channel: 'empresa',
        senderRole: 'empresa',
        senderName: order.empresaNombre,
        text: `Recibido. En mostrador tenemos listo el paquete ${order.codigoOrden}. Tu código de entrega en tienda es ${order.pickupCodeExpected}.`,
        createdAt: new Date().toISOString(),
      });
    } else {
      courier.chatMessages.push({
        id: `cmsg-${Date.now()}-reply`,
        orderId: order.id,
        channel: 'cliente',
        senderRole: 'cliente',
        senderName: order.clienteNombre,
        text: `¡Perfecto! Aquí te espero en ${order.clienteDireccion}. Mi código para confirmar tu entrega es ${order.deliveryCodeExpected}.`,
        createdAt: new Date().toISOString(),
      });
    }

    saveDb(db);
    res.json(formatCourierWorkspace(courier));
  });

  app.put('/api/courier/profile', (req, res) => {
    const user = getAuthFromHeader(req);
    if (!user || user.role !== 'repartidor') {
      res.status(403).json({ error: 'No autorizado.' });
      return;
    }
    const courier = ensureCourierProfile(user);

    const primerNombre = String(req.body?.primerNombre ?? courier.primerNombre).trim();
    const segundoNombre =
      String(req.body?.segundoNombre ?? courier.segundoNombre ?? '').trim() || undefined;
    const primerApellido = String(req.body?.primerApellido ?? courier.primerApellido).trim();
    const segundoApellido =
      String(req.body?.segundoApellido ?? courier.segundoApellido ?? '').trim() || undefined;

    if (primerNombre.length < 2 || primerApellido.length < 2) {
      res.status(400).json({ error: 'Primer nombre y primer apellido son obligatorios.' });
      return;
    }

    const fullName = buildFullName({
      primerNombre,
      segundoNombre,
      primerApellido,
      segundoApellido,
    });

    courier.primerNombre = primerNombre;
    courier.segundoNombre = segundoNombre;
    courier.primerApellido = primerApellido;
    courier.segundoApellido = segundoApellido;
    courier.nombre = fullName;
    if (typeof req.body?.avatarDataUrl === 'string') {
      courier.avatarDataUrl = req.body.avatarDataUrl || undefined;
      user.avatarDataUrl = courier.avatarDataUrl;
    }
    courier.telefono = String(req.body?.telefono ?? courier.telefono).trim();
    courier.departamento = String(req.body?.departamento ?? courier.departamento).trim();
    courier.municipio = String(req.body?.municipio ?? courier.municipio).trim();
    courier.direccionCasa = String(req.body?.direccionCasa ?? courier.direccionCasa).trim();
    courier.vehiculo = String(req.body?.vehiculo ?? courier.vehiculo).trim();

    user.primerNombre = primerNombre;
    user.segundoNombre = segundoNombre;
    user.primerApellido = primerApellido;
    user.segundoApellido = segundoApellido;
    user.nombre = fullName;
    user.telefono = courier.telefono;

    saveDb(db);
    res.json({
      profile: getCourierProfilePayload(courier),
      user: sanitizeUser(user),
    });
  });

  app.post('/api/courier/wallet/cards', (req, res) => {
    const user = getAuthFromHeader(req);
    if (!user || user.role !== 'repartidor') {
      res.status(403).json({ error: 'No autorizado.' });
      return;
    }
    const courier = ensureCourierProfile(user);
    const alias = String(req.body?.alias || '').trim();
    const banco = String(req.body?.banco || '').trim();
    const numero = String(req.body?.numero || '').replace(/\D/g, '');
    const titular = String(req.body?.titular || courier.nombre).trim();
    const expiracion = String(req.body?.expiracion || '12/29').trim();
    const tipo = (req.body?.tipo || 'Cuenta Bancaria') as 'Debito' | 'Credito' | 'Cuenta Bancaria';

    if (!alias || !banco || numero.length < 4) {
      res.status(400).json({ error: 'Ingresa alias, banco y los dígitos de la tarjeta o cuenta.' });
      return;
    }

    const isFirst = courier.wallet.cards.length === 0;
    const makeDefault = Boolean(req.body?.predeterminada) || isFirst;
    if (makeDefault) {
      for (const c of courier.wallet.cards) c.predeterminada = false;
    }

    courier.wallet.cards.push({
      id: `c-card-${Date.now()}-${randomBytes(2).toString('hex')}`,
      alias,
      banco,
      ultimos4: numero.slice(-4),
      titular,
      expiracion,
      tipo,
      predeterminada: makeDefault,
    });
    saveDb(db);
    res.status(201).json({ wallet: courier.wallet });
  });

  app.delete('/api/courier/wallet/cards/:cardId', (req, res) => {
    const user = getAuthFromHeader(req);
    if (!user || user.role !== 'repartidor') {
      res.status(403).json({ error: 'No autorizado.' });
      return;
    }
    const courier = ensureCourierProfile(user);
    courier.wallet.cards = courier.wallet.cards.filter((c) => c.id !== req.params.cardId);
    if (courier.wallet.cards.length > 0 && !courier.wallet.cards.some((c) => c.predeterminada)) {
      courier.wallet.cards[0].predeterminada = true;
    }
    saveDb(db);
    res.json({ wallet: courier.wallet });
  });

  app.put('/api/courier/wallet/autopay', (req, res) => {
    const user = getAuthFromHeader(req);
    if (!user || user.role !== 'repartidor') {
      res.status(403).json({ error: 'No autorizado.' });
      return;
    }
    const courier = ensureCourierProfile(user);
    const enabled = Boolean(req.body?.autoMonthlyEnabled);
    const day = Math.min(28, Math.max(1, Number(req.body?.autoMonthlyDay || 1)));
    const defaultCardId = req.body?.defaultCardId ? String(req.body.defaultCardId) : undefined;

    if (enabled && courier.wallet.cards.length === 0) {
      res.status(400).json({
        error: 'Agrega primero al menos una tarjeta o cuenta para activar el retiro automático mensual.',
      });
      return;
    }
    if (defaultCardId) {
      for (const c of courier.wallet.cards) {
        c.predeterminada = c.id === defaultCardId;
      }
    }
    courier.wallet.autoMonthlyEnabled = enabled;
    courier.wallet.autoMonthlyDay = day;
    saveDb(db);
    res.json({ wallet: courier.wallet });
  });

  app.post('/api/courier/wallet/withdraw', (req, res) => {
    const user = getAuthFromHeader(req);
    if (!user || user.role !== 'repartidor') {
      res.status(403).json({ error: 'No autorizado.' });
      return;
    }
    const courier = ensureCourierProfile(user);
    const amount = Number(req.body?.montoCop || 0);
    const cardId = String(req.body?.cardId || '');
    const card =
      courier.wallet.cards.find((c) => c.id === cardId) ??
      courier.wallet.cards.find((c) => c.predeterminada);

    if (!card) {
      res.status(400).json({ error: 'Agrega o selecciona una tarjeta en tu billetera para retirar.' });
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      res.status(400).json({ error: 'Ingresa un monto válido para retirar.' });
      return;
    }
    if (amount > courier.wallet.saldoDisponibleCop) {
      res.status(400).json({ error: 'El monto supera tu saldo disponible.' });
      return;
    }

    courier.wallet.saldoDisponibleCop -= amount;
    courier.wallet.totalRetiradoCop += amount;
    courier.wallet.withdrawals.unshift({
      id: `c-wd-${Date.now()}-${randomBytes(2).toString('hex')}`,
      montoCop: amount,
      cardLabel: `${card.banco} •••• ${card.ultimos4}`,
      tipo: 'Manual',
      estado: 'Procesado',
      createdAt: new Date().toISOString(),
    });
    saveDb(db);
    res.json({ wallet: courier.wallet });
  });

  app.post('/api/courier/vinchi-auto-contract', (req, res) => {
    const user = getAuthFromHeader(req);
    if (!user || user.role !== 'repartidor') {
      res.status(403).json({ error: 'No autorizado.' });
      return;
    }
    const courier = ensureCourierProfile(user);
    courier.vinchiAutoContract = Boolean(req.body?.enabled);
    if (courier.vinchiAutoContract) {
      courier.companies = courier.companies.map((c) =>
        c.estado === 'Disponible' ? { ...c, estado: 'Contratado' } : c
      );
    }
    saveDb(db);
    res.json(formatCourierWorkspace(courier));
  });

  app.post('/api/courier/apply-company', (req, res) => {
    const user = getAuthFromHeader(req);
    if (!user || user.role !== 'repartidor') {
      res.status(403).json({ error: 'No autorizado.' });
      return;
    }
    const courier = ensureCourierProfile(user);
    const companyId = String(req.body?.companyId || '');
    courier.companies = courier.companies.map((c) =>
      c.id === companyId ? { ...c, estado: 'Contratado' } : c
    );
    saveDb(db);
    res.json(formatCourierWorkspace(courier));
  });

  // --- PORTAL PRIVADO DEL CLIENTE ("Pedir Ahora") ---
  function getAllRegisteredCompanies(): ClientCompanyCatalog[] {
    const seededWs = db.businessesByUser['usr-comercio-1'];
    const companies: ClientCompanyCatalog[] = SEEDED_CLIENT_COMPANIES.map((company) => {
      if (company.id === 'emp-bistro-central' && seededWs) {
        const activeAd = seededWs.ads.find((a) => a.activo);
        const initials =
          seededWs.profile.negocioNombre
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((w) => w[0]?.toUpperCase() || '')
            .join('') || company.emblemaIniciales;
        return {
          ...company,
          nombre: seededWs.profile.negocioNombre,
          descripcion: seededWs.profile.descripcion,
          ciudad: seededWs.profile.ciudad,
          barrio: seededWs.profile.barrio,
          direccionLocal: seededWs.profile.direccionLocal,
          tiempoEntregaMin: seededWs.profile.tiempoEntregaMin,
          costoDomicilioCop: seededWs.profile.costoDomicilioCop,
          logoIcon: seededWs.profile.logoIcon,
          bannerTone: seededWs.profile.bannerTone,
          logoDataUrl: seededWs.profile.logoDataUrl,
          emblemaIniciales: initials,
          esUltra: seededWs.planSelected ? seededWs.plan === 'ultra' : company.esUltra,
          pagadoAnuncio: Boolean(activeAd) || company.pagadoAnuncio,
          foroPromo: activeAd ? `${activeAd.titulo}: ${activeAd.mensaje}` : company.foroPromo,
        };
      }
      return company;
    });
    const knownNames = new Set(companies.map((c) => c.nombre.trim().toLowerCase()));

    for (const u of db.users) {
      if (u.id === 'usr-comercio-1') continue;
      if (u.businessActivated && u.negocioNombre) {
        const ws = db.businessesByUser[u.id];
        const displayName = ws?.profile.negocioNombre || u.negocioNombre;
        const norm = displayName.trim().toLowerCase();
        if (!norm || knownNames.has(norm)) continue;
        knownNames.add(norm);
        const initials =
          displayName
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((w) => w[0]?.toUpperCase() || '')
            .join('') || 'VN';
        const companyId = ws?.businessId || `emp-user-${u.id}`;
        const activeAd = ws?.ads.find((a) => a.activo);
        companies.push({
          id: companyId,
          nombre: displayName,
          ciudad: ws?.profile.ciudad || 'Colombia',
          barrio: ws?.profile.barrio || 'Zona Activa',
          direccionLocal: ws?.profile.direccionLocal || 'Comercio verificado Vinchi',
          descripcion:
            ws?.profile.descripcion ||
            'Comercio registrado y activo en la red directa Vinchi con 0% comisión.',
          tiempoEntregaMin: ws?.profile.tiempoEntregaMin ?? 25,
          costoDomicilioCop: ws?.profile.costoDomicilioCop ?? 4000,
          calificacion: '4.8',
          pagadoAnuncio: Boolean(activeAd),
          etiquetasCarrusel: ['Comida locales', 'Carnes'],
          categoriasFiltro: ['Comida locales', 'Comida rápida', 'Bebidas'],
          bannerTone: ws?.profile.bannerTone || 'from-[#442c61] to-[#9c44dc]',
          emblemaIniciales: initials,
          logoIcon: ws?.profile.logoIcon || 'store',
          logoDataUrl: ws?.profile.logoDataUrl,
          imagenKey: 'bandeja',
          esUltra: ws?.plan === 'ultra',
          foroPromo: activeAd
            ? `${activeAd.titulo}: ${activeAd.mensaje}`
            : `${displayName} opera directo en Vinchi con cocina verificada y entrega sin recargos.`,
          likesIniciales: 84,
          productos: [
            {
              id: `prod-${companyId}-1`,
              companyId,
              companyName: displayName,
              nombre: `Menú Especial ${displayName}`,
              descripcion: 'Plato principal preparado al instante directamente desde la cocina.',
              precioCop: 28000,
              categoriaFiltro: 'Comida locales',
              etiquetaPopular: 'Nuevo en Vinchi',
              tiempoPrepMin: 18,
              acentoColor: '#9c44dc',
              imagenKey: 'bandeja',
              seccionMenu: 'Principal',
              destacado: true,
            },
            {
              id: `prod-${companyId}-2`,
              companyId,
              companyName: displayName,
              nombre: `Bebida Refrescante de la Casa`,
              descripcion: 'Acompañamiento frío recién preparado sin azúcar añadida.',
              precioCop: 7500,
              categoriaFiltro: 'Bebidas',
              etiquetaPopular: 'Bebida fresca',
              tiempoPrepMin: 5,
              acentoColor: '#16a34a',
              imagenKey: 'cafe',
              seccionMenu: 'Bebidas',
            },
            {
              id: `prod-${companyId}-3`,
              companyId,
              companyName: displayName,
              nombre: `Salsa Especial de la Casa`,
              descripcion: 'Salsa artesanal preparada para acompañar tus platillos favoritos.',
              precioCop: 2500,
              categoriaFiltro: 'Comida locales',
              etiquetaPopular: 'Salsa de la casa',
              tiempoPrepMin: 2,
              acentoColor: '#d97706',
              imagenKey: 'bandeja',
              seccionMenu: 'Salsas',
            },
            {
              id: `prod-${companyId}-4`,
              companyId,
              companyName: displayName,
              nombre: `Empaque Térmico & Cubiertos`,
              descripcion: 'Set adicional ecológico y sellado térmico para llevar.',
              precioCop: 2000,
              categoriaFiltro: 'Comida locales',
              etiquetaPopular: 'Extra útil',
              tiempoPrepMin: 2,
              acentoColor: '#442c61',
              imagenKey: 'bandeja',
              seccionMenu: 'Otros',
            },
          ],
        });
      }
    }

    return companies;
  }

  function formatLocationAddressForDispatch(loc: ClientDeliveryLocation): string {
    if (loc.esConjuntoPrivado) {
      return `Conjunto ${loc.nombreConjunto || 'Privado'}, Apto ${loc.apartamento || 'S/N'} (${loc.modoEntrega})`;
    }
    return `${loc.direccion || loc.nombreLugar} · ${loc.estructuraYCercania || ''} (${loc.modoEntrega})`.trim();
  }

  const AI_FREE_MONTHLY_LIMIT = 3;
  const CLIENT_PREMIUM_MONTHLY_PRICE_COP = 9900;

  function getCurrentMonthKey(): string {
    return new Date().toISOString().slice(0, 7);
  }

  function ensureStoredAiQuota(userId: string): StoredClientAiQuota {
    const currentMonth = getCurrentMonthKey();
    const existing = db.clientAiQuotaByUser[userId];
    if (!existing) {
      const created: StoredClientAiQuota = {
        monthKey: currentMonth,
        usesThisMonth: 0,
        adBonusUses: 0,
        isClientPremium: false,
      };
      db.clientAiQuotaByUser[userId] = created;
      return created;
    }
    if (existing.monthKey !== currentMonth) {
      existing.monthKey = currentMonth;
      existing.usesThisMonth = 0;
      existing.adBonusUses = 0;
    }
    return existing;
  }

  function getClientAiQuota(userId: string): ClientAiQuotaState {
    const raw = ensureStoredAiQuota(userId);
    const totalAvailable = AI_FREE_MONTHLY_LIMIT + raw.adBonusUses;
    const remainingUses = raw.isClientPremium
      ? 999
      : Math.max(0, totalAvailable - raw.usesThisMonth);
    return {
      monthKey: raw.monthKey,
      monthlyLimit: AI_FREE_MONTHLY_LIMIT,
      usesThisMonth: raw.usesThisMonth,
      adBonusUses: raw.adBonusUses,
      remainingUses,
      isClientPremium: raw.isClientPremium,
      premiumMonthlyPriceCop: CLIENT_PREMIUM_MONTHLY_PRICE_COP,
      premiumSince: raw.premiumSince,
    };
  }

  function resolveCourierBonus(rawAmount: unknown): { amountCop: number; label: string } {
    const num = Number(rawAmount);
    const clamped = Number.isFinite(num) ? Math.min(1000, Math.max(300, Math.round(num))) : 300;
    if (clamped >= 1000) {
      return { amountCop: 1000, label: 'Estrella del Repartidor' };
    }
    if (clamped >= 750) {
      return { amountCop: 750, label: 'Héroe de tu Entrega' };
    }
    if (clamped >= 500) {
      return { amountCop: 500, label: '¡Buena Energía en Ruta!' };
    }
    return { amountCop: 300, label: 'Paso Solidario' };
  }

  function buildClientWorkspacePayload(user: StoredUser) {
    const locations = db.clientLocationsByUser[user.id] || [];
    const ordersInProgress = db.clientOrders
      .filter((o) => o.userId === user.id)
      .map(({ userId: _uid, ...rest }) => ({
        ...rest,
        bonoDomiciliarioCop: typeof rest.bonoDomiciliarioCop === 'number' ? rest.bonoDomiciliarioCop : 0,
        bonoNombre: rest.bonoNombre || 'Paso Solidario',
      }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return {
      profile: {
        nombre: user.nombre,
        primerNombre: user.primerNombre,
        segundoNombre: user.segundoNombre,
        primerApellido: user.primerApellido,
        segundoApellido: user.segundoApellido,
        email: user.email,
        telefono: user.telefono || '',
        avatarDataUrl: user.avatarDataUrl,
      },
      locations,
      maxLocations: 6,
      companies: getAllRegisteredCompanies(),
      ordersInProgress,
      aiQuota: getClientAiQuota(user.id),
    };
  }

  app.get('/api/cliente/workspace', (req, res) => {
    const user = getAuthFromHeader(req);
    if (!user) {
      res.status(401).json({ error: 'Debes iniciar sesión para ingresar a Pedir Ahora.' });
      return;
    }
    res.json(buildClientWorkspacePayload(user));
  });

  app.post('/api/cliente/locations', (req, res) => {
    const user = getAuthFromHeader(req);
    if (!user) {
      res.status(401).json({ error: 'Debes iniciar sesión primero.' });
      return;
    }
    const existing = db.clientLocationsByUser[user.id] || [];
    if (existing.length >= 6) {
      res.status(400).json({ error: 'Solo puedes guardar un máximo de 6 ubicaciones.' });
      return;
    }

    const nombreLugar = String(req.body?.nombreLugar || '').trim();
    const etiqueta = String(req.body?.etiqueta || '').trim() || 'Casa';
    const esConjuntoPrivado = Boolean(req.body?.esConjuntoPrivado);
    const nombreConjunto = String(req.body?.nombreConjunto || '').trim();
    const apartamento = String(req.body?.apartamento || '').trim();
    const direccion = String(req.body?.direccion || '').trim();
    const estructuraYCercania = String(req.body?.estructuraYCercania || '').trim();
    const indicacionesEdificio = String(req.body?.indicacionesEdificio || '').trim();
    const modoEntregaRaw = String(req.body?.modoEntrega || 'Recibir a la mano').trim();
    const allowedModes: DeliveryHandoffMode[] = [
      'Recibir a la mano',
      'Dejar en la puerta',
      'Yo mismo lo recojo',
    ];
    const modoEntrega: DeliveryHandoffMode = allowedModes.includes(
      modoEntregaRaw as DeliveryHandoffMode
    )
      ? (modoEntregaRaw as DeliveryHandoffMode)
      : 'Recibir a la mano';

    if (nombreLugar.length < 2) {
      res.status(400).json({ error: 'Ingresa el nombre del lugar.' });
      return;
    }
    if (esConjuntoPrivado) {
      if (nombreConjunto.length < 2 || !apartamento) {
        res.status(400).json({
          error: 'Al marcar conjunto privado debes ingresar el nombre del conjunto y el número de apartamento.',
        });
        return;
      }
    } else if (direccion.length < 4) {
      res.status(400).json({
        error: 'Ingresa la dirección de entrega y las indicaciones del edificio.',
      });
      return;
    }

    const makeDefault = existing.length === 0 || Boolean(req.body?.predeterminada);
    const updatedList = existing.map((l) => (makeDefault ? { ...l, predeterminada: false } : l));

    const newLoc: ClientDeliveryLocation = {
      id: `loc-${Date.now()}-${randomBytes(2).toString('hex')}`,
      nombreLugar,
      etiqueta,
      esConjuntoPrivado,
      nombreConjunto: esConjuntoPrivado ? nombreConjunto : undefined,
      apartamento: esConjuntoPrivado ? apartamento : undefined,
      direccion: esConjuntoPrivado ? undefined : direccion,
      estructuraYCercania: esConjuntoPrivado ? undefined : estructuraYCercania || undefined,
      indicacionesEdificio: esConjuntoPrivado ? undefined : indicacionesEdificio || undefined,
      modoEntrega,
      predeterminada: makeDefault,
      createdAt: new Date().toISOString(),
    };

    db.clientLocationsByUser[user.id] = [newLoc, ...updatedList];
    saveDb(db);
    res.status(201).json(buildClientWorkspacePayload(user));
  });

  app.put('/api/cliente/locations/:id', (req, res) => {
    const user = getAuthFromHeader(req);
    if (!user) {
      res.status(401).json({ error: 'No autorizado.' });
      return;
    }
    const existing = db.clientLocationsByUser[user.id] || [];
    const target = existing.find((l) => l.id === req.params.id);
    if (!target) {
      res.status(404).json({ error: 'Ubicación no encontrada.' });
      return;
    }

    if (req.body?.setAsDefault) {
      db.clientLocationsByUser[user.id] = existing.map((l) => ({
        ...l,
        predeterminada: l.id === req.params.id,
      }));
      saveDb(db);
      res.json(buildClientWorkspacePayload(user));
      return;
    }

    const esConjuntoPrivado =
      req.body?.esConjuntoPrivado !== undefined
        ? Boolean(req.body.esConjuntoPrivado)
        : target.esConjuntoPrivado;
    const nombreLugar = String(req.body?.nombreLugar ?? target.nombreLugar).trim();
    const etiqueta = String(req.body?.etiqueta ?? target.etiqueta).trim() || 'Casa';
    const nombreConjunto = String(req.body?.nombreConjunto ?? target.nombreConjunto ?? '').trim();
    const apartamento = String(req.body?.apartamento ?? target.apartamento ?? '').trim();
    const direccion = String(req.body?.direccion ?? target.direccion ?? '').trim();
    const estructuraYCercania = String(
      req.body?.estructuraYCercania ?? target.estructuraYCercania ?? ''
    ).trim();
    const indicacionesEdificio = String(
      req.body?.indicacionesEdificio ?? target.indicacionesEdificio ?? ''
    ).trim();
    const modoEntregaRaw = String(req.body?.modoEntrega ?? target.modoEntrega).trim();
    const allowedModes: DeliveryHandoffMode[] = [
      'Recibir a la mano',
      'Dejar en la puerta',
      'Yo mismo lo recojo',
    ];
    const modoEntrega: DeliveryHandoffMode = allowedModes.includes(
      modoEntregaRaw as DeliveryHandoffMode
    )
      ? (modoEntregaRaw as DeliveryHandoffMode)
      : target.modoEntrega;

    if (nombreLugar.length < 2) {
      res.status(400).json({ error: 'Ingresa el nombre del lugar.' });
      return;
    }
    if (esConjuntoPrivado && (nombreConjunto.length < 2 || !apartamento)) {
      res.status(400).json({
        error: 'Ingresa el nombre del conjunto y el apartamento.',
      });
      return;
    }
    if (!esConjuntoPrivado && direccion.length < 4) {
      res.status(400).json({ error: 'Ingresa la dirección de entrega.' });
      return;
    }

    db.clientLocationsByUser[user.id] = existing.map((l) =>
      l.id === req.params.id
        ? {
            ...l,
            nombreLugar,
            etiqueta,
            esConjuntoPrivado,
            nombreConjunto: esConjuntoPrivado ? nombreConjunto : undefined,
            apartamento: esConjuntoPrivado ? apartamento : undefined,
            direccion: esConjuntoPrivado ? undefined : direccion,
            estructuraYCercania: esConjuntoPrivado ? undefined : estructuraYCercania || undefined,
            indicacionesEdificio: esConjuntoPrivado ? undefined : indicacionesEdificio || undefined,
            modoEntrega,
          }
        : l
    );

    saveDb(db);
    res.json(buildClientWorkspacePayload(user));
  });

  app.delete('/api/cliente/locations/:id', (req, res) => {
    const user = getAuthFromHeader(req);
    if (!user) {
      res.status(401).json({ error: 'No autorizado.' });
      return;
    }
    const existing = db.clientLocationsByUser[user.id] || [];
    const remaining = existing.filter((l) => l.id !== req.params.id);
    if (remaining.length > 0 && !remaining.some((l) => l.predeterminada)) {
      remaining[0] = { ...remaining[0], predeterminada: true };
    }
    db.clientLocationsByUser[user.id] = remaining;
    saveDb(db);
    res.json(buildClientWorkspacePayload(user));
  });

  app.put('/api/cliente/profile', (req, res) => {
    const user = getAuthFromHeader(req);
    if (!user) {
      res.status(401).json({ error: 'No autorizado.' });
      return;
    }
    const primerNombre = String(req.body?.primerNombre ?? user.primerNombre).trim();
    const segundoNombre =
      String(req.body?.segundoNombre ?? user.segundoNombre ?? '').trim() || undefined;
    const primerApellido = String(req.body?.primerApellido ?? user.primerApellido).trim();
    const segundoApellido =
      String(req.body?.segundoApellido ?? user.segundoApellido ?? '').trim() || undefined;

    if (primerNombre.length < 2 || primerApellido.length < 2) {
      res.status(400).json({ error: 'Tu primer nombre y primer apellido son obligatorios.' });
      return;
    }

    const fullName = buildFullName({
      primerNombre,
      segundoNombre,
      primerApellido,
      segundoApellido,
    });
    user.primerNombre = primerNombre;
    user.segundoNombre = segundoNombre;
    user.primerApellido = primerApellido;
    user.segundoApellido = segundoApellido;
    user.nombre = fullName;
    if (req.body?.telefono !== undefined) {
      user.telefono = String(req.body.telefono || '').trim();
    }
    if (req.body?.avatarDataUrl !== undefined) {
      user.avatarDataUrl = String(req.body.avatarDataUrl || '') || undefined;
    }

    saveDb(db);
    res.json({
      workspace: buildClientWorkspacePayload(user),
      user: sanitizeUser(user),
    });
  });

  app.post('/api/cliente/orders', (req, res) => {
    const user = getAuthFromHeader(req);
    if (!user) {
      res.status(401).json({ error: 'Debes iniciar sesión para confirmar tu pedido.' });
      return;
    }

    const rawItems = Array.isArray(req.body?.items)
      ? (req.body.items as Array<{ productId: string; cantidad: number }>)
      : [];
    const locationId = String(req.body?.locationId || '').trim();
    const metodoPago = String(req.body?.metodoPago || 'Efectivo').trim();

    if (rawItems.length === 0) {
      res.status(400).json({ error: 'Tu carrito está vacío.' });
      return;
    }

    const userLocations = db.clientLocationsByUser[user.id] || [];
    const selectedLocation =
      userLocations.find((l) => l.id === locationId) ||
      userLocations.find((l) => l.predeterminada) ||
      userLocations[0];

    if (!selectedLocation) {
      res.status(400).json({
        error: 'Agrega y selecciona una ubicación de entrega antes de confirmar tu pedido.',
      });
      return;
    }

    const companies = getAllRegisteredCompanies();
    const productLookup = new Map<
      string,
      { company: ClientCompanyCatalog; product: ClientCatalogProduct }
    >();
    for (const comp of companies) {
      for (const prod of comp.productos) {
        productLookup.set(prod.id, { company: comp, product: prod });
      }
    }

    // Agrupar productos del carrito por empresa para generar órdenes directas a cada tienda y domiciliario
    const itemsByCompany = new Map<
      string,
      { company: ClientCompanyCatalog; items: Array<{ product: ClientCatalogProduct; cantidad: number }> }
    >();

    for (const entry of rawItems) {
      const found = productLookup.get(String(entry.productId || ''));
      const qty = Math.max(1, Math.floor(Number(entry.cantidad || 1)));
      if (!found) continue;
      let group = itemsByCompany.get(found.company.id);
      if (!group) {
        group = { company: found.company, items: [] };
        itemsByCompany.set(found.company.id, group);
      }
      group.items.push({ product: found.product, cantidad: qty });
    }

    if (itemsByCompany.size === 0) {
      res.status(400).json({ error: 'No se encontraron productos válidos en el carrito.' });
      return;
    }

    const isSelfPickup = selectedLocation.modoEntrega === 'Yo mismo lo recojo';
    const resolvedBonus = resolveCourierBonus(req.body?.bonoDomiciliarioCop);
    const createdOrders: ClientPortalOrder[] = [];
    const nowTime = new Date().toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    let companyOrderIdx = 0;
    for (const { company, items } of itemsByCompany.values()) {
      const subtotalCop = items.reduce((sum, i) => sum + i.product.precioCop * i.cantidad, 0);
      const costoDomicilioCop = isSelfPickup ? 1000 : company.costoDomicilioCop;
      const orderBonusCop = companyOrderIdx === 0 ? resolvedBonus.amountCop : 0;
      const orderBonusName = companyOrderIdx === 0 ? resolvedBonus.label : '';
      companyOrderIdx += 1;

      const totalCop = subtotalCop + costoDomicilioCop + orderBonusCop;
      const orderNum = 2100 + Math.floor(Math.random() * 7899);
      const codigo = `#VN-${orderNum}`;

      const orderItems = items.map((i) => ({
        id: i.product.id,
        nombre: i.product.nombre,
        cantidad: i.cantidad,
        precioUnitarioCop: i.product.precioCop,
      }));

      const clientOrder: StoredClientOrder = {
        id: `cli-ord-${Date.now()}-${randomBytes(2).toString('hex')}`,
        userId: user.id,
        codigo,
        empresaId: company.id,
        empresaNombre: company.nombre,
        empresaDireccion: `${company.direccionLocal} · ${company.barrio}`,
        estado: 'En preparación',
        metodoPago,
        subtotalCop,
        costoDomicilioCop,
        bonoDomiciliarioCop: orderBonusCop,
        bonoNombre: orderBonusName || resolvedBonus.label,
        totalCop,
        items: orderItems,
        location: selectedLocation,
        enviadoADomiciliario: !isSelfPickup,
        enviadoAEmpresa: true,
        createdAt: new Date().toISOString(),
      };

      db.clientOrders.unshift(clientOrder);
      const { userId: _uid, ...publicOrder } = clientOrder;
      createdOrders.push(publicOrder);

      // Enviar orden con ubicación completa e indicaciones a la caja de la empresa (ComercioPosPage)
      const companyPosOrder: OrderRecord = {
        id: `pos-${clientOrder.id}`,
        codigo,
        mesaOOrigen: isSelfPickup
          ? `Recoge cliente (${selectedLocation.etiqueta})`
          : `Domicilio · ${selectedLocation.etiqueta}`,
        clienteNombre: user.nombre,
        hora: nowTime,
        estado: 'En preparación',
        totalCop,
        items: orderItems,
        deliveryDetails: selectedLocation,
        empresaId: company.id,
        empresaNombre: company.nombre,
        bonoDomiciliarioCop: orderBonusCop,
        bonoNombre: orderBonusName || resolvedBonus.label,
      };
      db.orders.unshift(companyPosOrder);

      // Si requiere domicilio, enviar ubicación + conjunto/apartamento + indicaciones + bono al domiciliario disponible
      if (!isSelfPickup) {
        const targetCourier =
          db.couriers.find((c) => c.activo && !c.activeOrder) ||
          db.couriers.find((c) => !c.activeOrder);

        const comidaResumen = items.map((i) => `${i.cantidad}x ${i.product.nombre}`).join(' + ');
        const pickupCode = `EMP-${1000 + Math.floor(Math.random() * 8999)}`;
        const deliveryCode = `CLI-${1000 + Math.floor(Math.random() * 8999)}`;

        const courierOrder: CourierDeliveryOrder = {
          id: `dord-${clientOrder.id}`,
          codigoOrden: codigo,
          step: 'to_company',
          empresaNombre: company.nombre,
          empresaDireccion: company.direccionLocal,
          empresaBarrio: `${company.barrio}, ${company.ciudad}`,
          clienteNombre: user.nombre,
          clienteTelefono: user.telefono || 'Sin teléfono registrado',
          clienteDireccion: formatLocationAddressForDispatch(selectedLocation),
          clienteBarrio: `${selectedLocation.etiqueta} · ${selectedLocation.nombreLugar}`,
          comidaResumen,
          pagoDomicilioCop: Math.max(company.costoDomicilioCop, 7500) + orderBonusCop,
          distanciaEmpresaKm: 1.4,
          distanciaClienteKm: 4.2,
          pickupCodeExpected: pickupCode,
          deliveryCodeExpected: deliveryCode,
          pickupVerified: false,
          deliveryVerified: false,
          deliveryDetails: selectedLocation,
          bonoDomiciliarioCop: orderBonusCop,
          bonoNombre: orderBonusName || resolvedBonus.label,
          createdAt: new Date().toISOString(),
        };

        if (targetCourier) {
          targetCourier.activeOrder = courierOrder;
          targetCourier.chatMessages = [
            {
              id: `cmsg-${Date.now()}-1`,
              orderId: courierOrder.id,
              channel: 'empresa',
              senderRole: 'empresa',
              senderName: company.nombre,
              text: `Pedido real ${codigo} confirmado por ${user.nombre}: ${comidaResumen}. Entrega: ${courierOrder.clienteDireccion}.`,
              createdAt: new Date().toISOString(),
            },
            {
              id: `cmsg-${Date.now()}-2`,
              orderId: courierOrder.id,
              channel: 'empresa',
              senderRole: 'sistema',
              senderName: 'Despacho',
              text: `Modo de entrega: ${selectedLocation.modoEntrega}. Bono del cliente: +$${orderBonusCop} COP (${orderBonusName || resolvedBonus.label}). Código de recogida: ${pickupCode}`,
              createdAt: new Date().toISOString(),
            },
          ];
        }
      }
    }

    saveDb(db);
    res.status(201).json({
      workspace: buildClientWorkspacePayload(user),
      createdOrders,
      message: isSelfPickup
        ? `Pedido enviado a la tienda (tarifa fija de recogida $1.000 COP, comisión $0, bono de $${resolvedBonus.amountCop} COP).`
        : `Pedido enviado con tarifa fija de domicilio, comisión $0 y bono al domiciliario de $${resolvedBonus.amountCop} COP (${resolvedBonus.label}).`,
    });
  });

  app.post('/api/cliente/ai/watch-ad', (req, res) => {
    const user = getAuthFromHeader(req);
    if (!user) {
      res.status(401).json({ error: 'Debes iniciar sesión para desbloquear usos adicionales.' });
      return;
    }
    const raw = ensureStoredAiQuota(user.id);
    raw.adBonusUses += 1;
    saveDb(db);
    res.json({
      aiQuota: getClientAiQuota(user.id),
      message: 'Anuncio completado. Desbloqueaste +1 consulta nueva para el asistente IA.',
    });
  });

  app.post('/api/cliente/premium/subscribe', (req, res) => {
    const user = getAuthFromHeader(req);
    if (!user) {
      res.status(401).json({ error: 'Debes iniciar sesión para activar Cliente Premium.' });
      return;
    }
    const paymentMethod = String(req.body?.paymentMethod || 'Nequi').trim() || 'Nequi';
    const raw = ensureStoredAiQuota(user.id);
    raw.isClientPremium = true;
    raw.premiumSince = new Date().toISOString();
    raw.premiumPaymentMethod = paymentMethod;
    saveDb(db);
    res.json({
      aiQuota: getClientAiQuota(user.id),
      message: `Cliente Premium mensual activado con ${paymentMethod}. Ya tienes uso ilimitado del asistente IA.`,
    });
  });

  app.post('/api/ai/cliente-chat', async (req, res) => {
    const user = getAuthFromHeader(req);
    if (!user) {
      res.status(401).json({ error: 'Debes iniciar sesión para usar el asistente.' });
      return;
    }

    const quota = getClientAiQuota(user.id);
    if (!quota.isClientPremium && quota.remainingUses <= 0) {
      res.status(429).json({
        error:
          'Alcanzaste tus 3 usos gratuitos de este mes. Mira un anuncio para desbloquear otro uso o activa Cliente Premium.',
        code: 'QUOTA_EXCEEDED',
        aiQuota: quota,
      });
      return;
    }

    const message = String(req.body?.message || '').trim();
    const activeFilter = String(req.body?.activeFilter || 'Todos').trim();
    const historyRaw = Array.isArray(req.body?.history)
      ? (req.body.history as Array<{ role: string; text: string }>).slice(-6)
      : [];

    if (!message) {
      res.status(400).json({ error: 'Escribe una pregunta o lo que se te antoje pedir.' });
      return;
    }

    const companies = getAllRegisteredCompanies();
    const allProducts = companies.flatMap((c) => c.productos);
    const catalogContext = companies
      .map((c) => {
        const promo = c.pagadoAnuncio ? ' [DESTACADO DORADO]' : '';
        const prods = c.productos
          .map(
            (p) =>
              `  - ID:${p.id} | ${p.nombre} ($${p.precioCop} COP, categoría:${p.categoriaFiltro}, desc:${p.descripcion})`
          )
          .join('\n');
        return `Empresa: ${c.nombre} (${c.ciudad}, domicilio $${c.costoDomicilioCop} COP, ${c.tiempoEntregaMin} min)${promo}\n${prods}`;
      })
      .join('\n\n');

    const historyContext = historyRaw
      .map((h) => `${h.role === 'user' ? 'Cliente' : 'Asistente'}: ${h.text}`)
      .join('\n');

    try {
      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Historial reciente:\n${historyContext || 'Sin mensajes previos'}\n\nFiltro activo del cliente: ${activeFilter}\nMensaje actual del cliente (${user.primerNombre}): "${message}"\n\nCatálogo real disponible en Vinchi:\n${catalogContext}`,
        config: {
          systemInstruction:
            'Eres el asistente virtual de compras de Vinchi. Ayudas al cliente a escoger comida, bebidas y restaurantes del catálogo real que se te entrega. Responde siempre en español natural, cercano y conciso (máximo 85 palabras en "reply"). Menciona precios en COP cuando sea útil y sugiere entre 1 y 3 productos exactos devolviendo sus IDs reales en "recommendedProductIds". Nunca inventes IDs ni productos fuera del catálogo.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: {
                type: Type.STRING,
                description: 'Respuesta amable y breve para ayudar al cliente a elegir qué comprar.',
              },
              recommendedProductIds: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description:
                  'Lista de IDs exactos (como prod-bc-1) de hasta 3 productos recomendados del catálogo.',
              },
            },
            required: ['reply', 'recommendedProductIds'],
          },
        },
      });

      const rawText = response.text?.trim() || '{}';
      let parsed: { reply?: string; recommendedProductIds?: string[] } = {};
      try {
        parsed = JSON.parse(rawText) as { reply?: string; recommendedProductIds?: string[] };
      } catch {
        parsed = { reply: rawText, recommendedProductIds: [] };
      }

      const validIds = new Set(
        Array.isArray(parsed.recommendedProductIds) ? parsed.recommendedProductIds : []
      );
      const recommendations = allProducts.filter((p) => validIds.has(p.id)).slice(0, 4);

      const rawQuota = ensureStoredAiQuota(user.id);
      if (!rawQuota.isClientPremium) {
        rawQuota.usesThisMonth += 1;
        saveDb(db);
      }

      res.json({
        reply:
          parsed.reply ||
          'Aquí tienes opciones del catálogo que combinan muy bien con lo que buscas:',
        recommendations,
        aiQuota: getClientAiQuota(user.id),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error consultando al asistente de compras.';
      res.status(500).json({ error: msg });
    }
  });

  // --- VITE / STATIC FRONTEND ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  server.listen(PORT, HOST, () => {
    console.log(`[vinchi] Servidor activo en http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[vinchi] Error fatal iniciando el servidor:', err);
  process.exit(1);
});
