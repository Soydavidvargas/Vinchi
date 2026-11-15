'use client';

import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  DollarSign,
  Download,
  FileText,
  IdCard,
  MapPin,
  Search,
  Truck,
  UserCheck,
  XCircle,
} from 'lucide-react';
import LazyScrollSection from '@/src/components/LazyScrollSection';
import { SkeletonBlock } from '@/src/components/Skeletons';
import VinchiDocsDriveModal from '@/src/components/VinchiDocsDriveModal';
import {
  fetchAdminAgentApplications,
  reviewAdminAgentApplication,
} from '@/src/lib/vinchiClient';
import type {
  AgentApplicationRecord,
  ComercioSummary,
  SuperadminKpis,
  VinchiRoute,
} from '@/src/types/vinchi';

export interface AdminDashboardProps {
  /** Métricas gerenciales consolidadas */
  kpis: SuperadminKpis;
  /** Listado de comercios registrados */
  comercios?: ComercioSummary[];
  /** Estado de carga opcional */
  isLoading?: boolean;
  /** Callback para exportar corte */
  onExportReport?: () => void;
  onNavigate?: (route: VinchiRoute) => void;
}

type PlanFilter = 'Todos' | ComercioSummary['plan'];

const formatCop = (value: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);

export default function AdminDashboardPage({
  kpis,
  comercios = [],
  isLoading = false,
  onExportReport,
  onNavigate,
}: AdminDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState<PlanFilter>('Todos');
  const [exported, setExported] = useState(false);
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [applications, setApplications] = useState<AgentApplicationRecord[]>([]);
  const [reviewingId, setReviewingId] = useState<string>('');

  const loadApplications = async () => {
    try {
      const res = await fetchAdminAgentApplications();
      setApplications(res.applications);
    } catch {
      // Ignorar si no aplica
    }
  };

  useEffect(() => {
    void loadApplications();
  }, []);

  const handleReviewApplication = async (id: string, decision: 'approved' | 'rejected') => {
    setReviewingId(id);
    try {
      await reviewAdminAgentApplication(id, decision);
      await loadApplications();
    } finally {
      setReviewingId('');
    }
  };

  const handleExport = () => {
    onExportReport?.();
    setExported(true);
    window.setTimeout(() => setExported(false), 2200);
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredComercios = comercios.filter((c) => {
    if (planFilter !== 'Todos' && c.plan !== planFilter) return false;
    if (!normalizedQuery) return true;
    return (
      c.nombre.toLowerCase().includes(normalizedQuery) ||
      c.ciudad.toLowerCase().includes(normalizedQuery)
    );
  });

  const kpiCards = [
    {
      label: 'Total comercios',
      value: kpis.totalComercios.toLocaleString('es-CO'),
      icon: Building2,
      detail: 'Restaurantes y supermercados activos',
    },
    {
      label: 'Agentes comerciales',
      value: kpis.totalAgentes.toLocaleString('es-CO'),
      icon: UserCheck,
      detail: 'Red comercial habilitada',
    },
    {
      label: 'Domiciliarios',
      value: kpis.totalDomiciliarios.toLocaleString('es-CO'),
      icon: Truck,
      detail: 'Flota con identidad verificada',
    },
    {
      label: 'Ingresos mensuales',
      value: formatCop(kpis.mrrCop),
      icon: DollarSign,
      detail: 'Facturación mensual recurrente',
    },
  ];

  const planOptions: PlanFilter[] = ['Todos', 'Básico', 'Premium', 'Ultra'];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f3e8ff]/70 via-[#faf5ff] to-[#f4ecfb] text-[#0a0a0a]">
      <header className="border-b border-[#9c44dc]/55 bg-[#442c61] px-4 py-4 text-[#ffffff] shadow-[0_6px_22px_-8px_rgba(68,44,97,0.45)] sm:px-6">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0 sm:gap-4">
            <button
              type="button"
              onClick={() => onNavigate?.('/(public)')}
              className="vinchi-transition inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-[#ffffff]/14 text-[#ffffff] hover:bg-[#9c44dc] sm:h-10 sm:w-10 cursor-pointer"
              aria-label="Volver al inicio"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-1 text-xs text-[#e9d5ff] sm:text-sm">
                <span>Vinchi</span>
                <ChevronRight className="h-4 w-4 stroke-[2.25] text-[#bc8ae1]" aria-hidden="true" />
                <span className="font-semibold text-[#ffffff]">Superadmin</span>
              </div>
              <h1 className="truncate font-display text-xl font-semibold tracking-[-0.025em] text-[#ffffff] sm:text-2xl">
                Dashboard Gerencial
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowDocsModal(true)}
              className="vinchi-transition inline-flex min-h-[44px] items-center gap-2 rounded-[18px] border border-[#bc8ae1]/55 bg-[#ffffff]/14 px-4 py-2 text-sm font-semibold text-[#ffffff] hover:bg-[#543b6c] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <FileText className="h-5 w-5 stroke-[2.25] text-[#fde68a]" aria-hidden="true" />
              <span>SRS y Drive</span>
            </button>

            <button
              type="button"
              onClick={handleExport}
              className="vinchi-transition inline-flex min-h-[44px] items-center gap-2 rounded-[18px] bg-[#9c44dc] px-5 py-2 text-sm font-semibold text-[#ffffff] hover:bg-[#bc8ae1] hover:text-[#442c61] whitespace-nowrap shrink-0 cursor-pointer"
            >
              {exported ? (
                <Check className="h-5 w-5 stroke-[2.25]" aria-hidden="true" />
              ) : (
                <Download className="h-5 w-5 stroke-[2.25]" aria-hidden="true" />
              )}
              <span>{exported ? 'Corte descargado' : 'Exportar Corte'}</span>
            </button>
          </div>
        </div>
      </header>

      <VinchiDocsDriveModal open={showDocsModal} onClose={() => setShowDocsModal(false)} />

      <main className="mx-auto max-w-[1280px] px-4 py-6 space-y-6 sm:px-6 sm:py-8">
        <LazyScrollSection
          eager
          hydrationDelayMs={180}
          skeleton={
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="blueprint-card space-y-4 p-5">
                  <SkeletonBlock className="h-3.5 w-24" />
                  <SkeletonBlock className="h-8 w-28" />
                  <SkeletonBlock className="h-3 w-40" />
                </div>
              ))}
            </div>
          }
        >
          <section
            aria-label="Indicadores principales"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {kpiCards.map((card, idx) => {
              const Icon = card.icon;
              const isMrr = idx === 3;
              return (
                <article
                  key={card.label}
                  className={`rounded-[24px] border-2 p-5 shadow-[0_10px_28px_-12px_rgba(68,44,97,0.2)] ${
                    isMrr
                      ? 'border-[#bc8ae1] bg-gradient-to-br from-[#442c61] to-[#543b6c] text-[#ffffff]'
                      : 'border-[#bc8ae1]/65 bg-[#ffffff]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={`text-xs font-semibold ${
                        isMrr ? 'text-[#e9d5ff]' : 'text-[#442c61]'
                      }`}
                    >
                      {card.label}
                    </span>
                    <span
                      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] ${
                        isMrr ? 'bg-[#ffffff]/15 text-[#fde68a]' : 'bg-[#9c44dc]/12 text-[#9c44dc]'
                      }`}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                  </div>
                  <p
                    className={`mt-4 font-mono tabular-nums text-2xl font-semibold tracking-[-0.025em] sm:text-3xl ${
                      isMrr ? 'text-[#ffffff]' : 'text-[#0a0a0a]'
                    }`}
                  >
                    {card.value}
                  </p>
                  <p className={`mt-2 text-xs ${isMrr ? 'text-[#e9d5ff]' : 'text-[#543b6c]'}`}>
                    {card.detail}
                  </p>
                </article>
              );
            })}
          </section>
        </LazyScrollSection>

        <LazyScrollSection
          skeleton={
            <div className="blueprint-card space-y-4 p-6">
              <SkeletonBlock className="h-6 w-48" />
              <SkeletonBlock className="h-12 w-full" />
              <SkeletonBlock className="h-12 w-full" />
            </div>
          }
        >
          <section aria-labelledby="comercios-heading" className="blueprint-card overflow-hidden">
            <div className="flex flex-col gap-4 border-b border-[#bc8ae1]/45 bg-[#faf5ff] px-5 py-4 rounded-t-[24px] sm:px-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-baseline gap-3">
                <h2
                  id="comercios-heading"
                  className="font-display text-lg font-semibold tracking-[-0.025em] text-[#442c61]"
                >
                  Comercios registrados
                </h2>
                <span className="font-mono tabular-nums text-xs font-semibold text-[#9c44dc]">
                  {filteredComercios.length} de {comercios.length}
                </span>
              </div>

              <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                <div className="relative sm:w-60">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 stroke-[2.25] -translate-y-1/2 text-[#9c44dc]"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    aria-label="Filtrar comercios por nombre o ciudad"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar comercio o ciudad..."
                    className="h-10 w-full rounded-[14px] border border-[#bc8ae1]/60 bg-[#ffffff] pl-9 pr-3.5 text-xs text-[#0a0a0a] placeholder:text-[#6b5a82] focus:border-[#9c44dc] focus:outline-none"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrar por plan">
                  {planOptions.map((option) => {
                    const active = planFilter === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setPlanFilter(option)}
                        className={`vinchi-transition min-h-[40px] rounded-[14px] px-4 py-2 text-xs font-semibold cursor-pointer ${
                          active
                            ? 'bg-[#442c61] text-[#ffffff]'
                            : 'border border-[#bc8ae1]/60 bg-[#ffffff] text-[#442c61] hover:border-[#9c44dc]'
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-3 p-5 sm:p-6">
                <div className="h-10 w-full rounded-[10px] bg-[#f5f5f5]" />
                <div className="h-10 w-full rounded-[10px] bg-[#f5f5f5]" />
                <div className="h-10 w-full rounded-[10px] bg-[#f5f5f5]" />
              </div>
            ) : filteredComercios.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="text-sm font-medium text-[#0a0a0a]">
                  No hay comercios que coincidan con el filtro actual.
                </p>
                <p className="mt-1 text-xs text-[#543b6c]">
                  Ajusta el criterio de búsqueda o selecciona otro plan para ver registros.
                </p>
              </div>
            ) : (
              <>
                {/* Vista en tarjetas para pantallas móviles (< md) */}
                <ul className="divide-y divide-[#bc8ae1]/35 md:hidden">
                  {filteredComercios.map((comercio) => (
                    <li key={comercio.id} className="space-y-2 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium text-[#0a0a0a]">{comercio.nombre}</span>
                        <span className="font-mono text-xs font-medium text-[#442c61]">
                          Plan {comercio.plan}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#543b6c]">
                        <span className="inline-flex items-center gap-1.5">
                          <span
                            className={`h-2 w-2 rounded-full ${
                              comercio.estado === 'Activo' ? 'bg-[#16a34a]' : 'bg-[#d97706]'
                            }`}
                            aria-hidden="true"
                          />
                          {comercio.ciudad} · {comercio.estado}
                        </span>
                        <span className="font-mono tabular-nums font-semibold text-[#0a0a0a]">
                          {comercio.pedidosMes.toLocaleString('es-CO')} pedidos/mes
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>

                {/* Vista tabular para tablet y escritorio (>= md) */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-[#bc8ae1]/45 text-xs font-semibold text-[#442c61]">
                      <tr>
                        <th scope="col" className="px-6 py-3">
                          Comercio
                        </th>
                        <th scope="col" className="px-6 py-3">
                          Ciudad
                        </th>
                        <th scope="col" className="px-6 py-3">
                          Plan
                        </th>
                        <th scope="col" className="px-6 py-3">
                          Estado
                        </th>
                        <th scope="col" className="px-6 py-3 text-right">
                          Pedidos / mes
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#bc8ae1]/30">
                      {filteredComercios.map((comercio) => (
                        <tr key={comercio.id} className="transition-colors hover:bg-[#faf5ff]">
                          <td className="px-6 py-3.5 font-medium text-[#0a0a0a]">
                            {comercio.nombre}
                          </td>
                          <td className="px-6 py-3.5 text-[#543b6c]">{comercio.ciudad}</td>
                          <td className="px-6 py-3.5 font-medium text-[#442c61]">
                            {comercio.plan}
                          </td>
                          <td className="px-6 py-3.5">
                            <span className="inline-flex items-center gap-2 text-[#171717]">
                              <span
                                className={`h-2 w-2 rounded-full ${
                                  comercio.estado === 'Activo' ? 'bg-[#16a34a]' : 'bg-[#d97706]'
                                }`}
                                aria-hidden="true"
                              />
                              {comercio.estado}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-right font-mono tabular-nums font-medium text-[#0a0a0a]">
                            {comercio.pedidosMes.toLocaleString('es-CO')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
        </LazyScrollSection>

        {/* Postulaciones de aspirantes a Agentes (Autorización por correo 3 a 7 días) */}
        <section
          aria-labelledby="postulaciones-agentes-heading"
          className="blueprint-card overflow-hidden"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#bc8ae1]/45 bg-[#faf5ff] px-5 py-4 sm:px-6">
            <div>
              <h2
                id="postulaciones-agentes-heading"
                className="font-display text-lg font-semibold tracking-[-0.025em] text-[#442c61]"
              >
                Postulaciones de Agentes por autorizar
              </h2>
              <p className="text-xs text-[#543b6c]">
                Revisa las 30 respuestas, cédula, hoja de vida, dirección y reconocimiento facial
                para autorizar por correo.
              </p>
            </div>
            <span className="font-mono text-xs font-semibold text-[#9c44dc]">
              {applications.length} registradas
            </span>
          </div>

          {applications.length === 0 ? (
            <div className="px-6 py-10 text-center text-xs text-[#543b6c]">
              No hay postulaciones de agentes pendientes en este momento.
            </div>
          ) : (
            <div className="divide-y divide-[#bc8ae1]/35">
              {applications.map((appItem) => (
                <div
                  key={appItem.id}
                  className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                >
                  <div className="flex items-start gap-4">
                    {appItem.facialSnapshotDataUrl && (
                      <img
                        src={appItem.facialSnapshotDataUrl}
                        alt={`Rostro de ${appItem.applicantName}`}
                        className="h-14 w-14 shrink-0 rounded-[12px] border border-[#bc8ae1]/60 object-cover"
                      />
                    )}
                    <div className="space-y-1 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-[#0a0a0a]">
                          {appItem.applicantName}
                        </span>
                        <span className="text-[#543b6c]">({appItem.applicantEmail})</span>
                        <span
                          className={`rounded-[6px] px-2 py-0.5 text-[11px] font-semibold ${
                            appItem.status === 'approved'
                              ? 'bg-[#16a34a]/12 text-[#166534]'
                              : appItem.status === 'rejected'
                                ? 'bg-[#dc2626]/12 text-[#991b1b]'
                                : 'bg-[#d97706]/12 text-[#92400e]'
                          }`}
                        >
                          {appItem.status === 'approved'
                            ? 'Autorizado'
                            : appItem.status === 'rejected'
                              ? 'Rechazado'
                              : 'Pendiente'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[#543b6c]">
                        <span className="inline-flex items-center gap-1.5">
                          <IdCard className="h-4 w-4 stroke-[2.25] text-[#9c44dc]" aria-hidden="true" />
                          CC {appItem.cedulaNumero} ({appItem.cedulaArchivoNombre})
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <FileText className="h-4 w-4 stroke-[2.25] text-[#9c44dc]" aria-hidden="true" />
                          {appItem.hojaVidaArchivoNombre}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="h-4 w-4 stroke-[2.25] text-[#9c44dc]" aria-hidden="true" />
                          {appItem.direccionCasa}, {appItem.municipio}, {appItem.departamento}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#543b6c]">
                        30/30 preguntas completadas · Reconocimiento facial verificado
                      </p>
                    </div>
                  </div>

                  {appItem.status === 'pending' && (
                    <div className="flex shrink-0 items-center gap-2.5">
                      <button
                        type="button"
                        disabled={reviewingId === appItem.id}
                        onClick={() => handleReviewApplication(appItem.id, 'approved')}
                        className="vinchi-transition inline-flex min-h-[42px] items-center gap-2 rounded-[12px] bg-[#16a34a] px-4 py-2 text-xs font-semibold text-[#ffffff] hover:bg-[#15803d] cursor-pointer"
                      >
                        <CheckCircle2 className="h-5 w-5 stroke-[2.25]" aria-hidden="true" />
                        <span>Autorizar por correo</span>
                      </button>
                      <button
                        type="button"
                        disabled={reviewingId === appItem.id}
                        onClick={() => handleReviewApplication(appItem.id, 'rejected')}
                        className="vinchi-transition inline-flex min-h-[42px] items-center gap-2 rounded-[12px] bg-[#9c645c] px-4 py-2 text-xs font-semibold text-[#ffffff] hover:bg-[#7f4d46] cursor-pointer"
                      >
                        <XCircle className="h-5 w-5 stroke-[2.25]" aria-hidden="true" />
                        <span>Rechazar</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
