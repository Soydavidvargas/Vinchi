'use client';

import { useMemo, useState } from 'react';
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Crown,
  Heart,
  LayoutGrid,
  Minus,
  Plus,
  ShoppingBag,
  Sparkles,
  Store,
} from 'lucide-react';
import CompanyLogoMark from '@/src/components/cliente/CompanyLogoMark';
import { getFoodPhotoUrl } from '@/src/data/clientVisualAssets';
import type { ClientCatalogProduct, ClientCompanyCatalog } from '@/src/types/vinchi';

export interface ForoInstagramFeedProps {
  companies: ClientCompanyCatalog[];
  cartQuantities: Record<string, number>;
  onAddProduct: (product: ClientCatalogProduct) => void;
  onUpdateQty: (productId: string, delta: number) => void;
  onInspectCompany: (company: ClientCompanyCatalog) => void;
  onGoToCart: () => void;
}

type ForoFilter = 'todos' | 'ultra' | 'anuncios';

const formatCop = (value: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);

function getForoPriorityRank(company: ClientCompanyCatalog): number {
  const isUltra = Boolean(company.esUltra);
  const isAd = Boolean(company.pagadoAnuncio);
  if (isUltra && isAd) return 4;
  if (isUltra) return 3;
  if (isAd) return 2;
  return 0;
}

export default function ForoInstagramFeed({
  companies,
  cartQuantities,
  onAddProduct,
  onUpdateQty,
  onInspectCompany,
}: ForoInstagramFeedProps) {
  const [foroFilter, setForoFilter] = useState<ForoFilter>('todos');
  const [slideIndexByCompany, setSlideIndexByCompany] = useState<Record<string, number>>({});
  const [likedCompanyIds, setLikedCompanyIds] = useState<Record<string, boolean>>({});
  const [savedCompanyIds, setSavedCompanyIds] = useState<Record<string, boolean>>({});

  // Solo aparecen en el Foro empresas con Licencia Ultra o empresas que pagaron anuncio
  const eligibleCompanies = useMemo(
    () =>
      companies
        .filter((c) => Boolean(c.esUltra || c.pagadoAnuncio))
        .sort((a, b) => {
          const rankDiff = getForoPriorityRank(b) - getForoPriorityRank(a);
          if (rankDiff !== 0) return rankDiff;
          return (b.likesIniciales || 0) - (a.likesIniciales || 0);
        }),
    [companies]
  );

  const orderedCompanies = useMemo(() => {
    if (foroFilter === 'ultra') {
      return eligibleCompanies.filter((c) => Boolean(c.esUltra));
    }
    if (foroFilter === 'anuncios') {
      return eligibleCompanies.filter((c) => Boolean(c.pagadoAnuncio));
    }
    return eligibleCompanies;
  }, [eligibleCompanies, foroFilter]);

  const ultraCount = useMemo(
    () => eligibleCompanies.filter((c) => Boolean(c.esUltra)).length,
    [eligibleCompanies]
  );
  const adsCount = useMemo(
    () => eligibleCompanies.filter((c) => Boolean(c.pagadoAnuncio)).length,
    [eligibleCompanies]
  );

  const setSlide = (companyId: string, nextIndex: number, total: number) => {
    if (total <= 0) return;
    const wrapped = ((nextIndex % total) + total) % total;
    setSlideIndexByCompany((prev) => ({ ...prev, [companyId]: wrapped }));
  };

  const toggleLike = (companyId: string) => {
    setLikedCompanyIds((prev) => ({ ...prev, [companyId]: !prev[companyId] }));
  };

  const toggleSave = (companyId: string) => {
    setSavedCompanyIds((prev) => ({ ...prev, [companyId]: !prev[companyId] }));
  };

  return (
    <div className="space-y-6">
      {/* Encabezado limpio del Foro: solo publicaciones */}
      <section className="mx-auto max-w-3xl rounded-[24px] border-2 border-[#bc8ae1]/65 bg-gradient-to-br from-[#ffffff] via-[#faf5ff] to-[#f3e8ff]/55 p-5 shadow-xs sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold text-[#9c44dc]">
              Foro Comercial Vinchi · Licencia Ultra y Anuncios
            </p>
            <h1 className="mt-0.5 font-display text-2xl font-semibold tracking-[-0.025em] text-[#442c61] sm:text-3xl">
              Publicaciones de marcas
            </h1>
            <p className="mt-1 text-xs text-[#543b6c]">
              Explora las publicaciones de comercios con Licencia Ultra y anuncios activos. Toca el
              perfil de cada marca para ver su carta completa e información.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { id: 'todos', label: `Todos (${eligibleCompanies.length})`, icon: LayoutGrid },
                { id: 'ultra', label: `Licencia Ultra (${ultraCount})`, icon: Crown },
                { id: 'anuncios', label: `Anuncios (${adsCount})`, icon: Sparkles },
              ] as const
            ).map((opt) => {
              const active = foroFilter === opt.id;
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setForoFilter(opt.id)}
                  className={`whitespace-nowrap shrink-0 inline-flex min-h-[42px] items-center gap-2 rounded-[14px] px-4 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#442c61] text-[#ffffff]'
                      : 'border border-[#bc8ae1]/60 bg-[#ffffff] text-[#543b6c] hover:border-[#9c44dc] hover:bg-[#faf5ff]'
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 stroke-[2.25] ${
                      active ? 'text-[#fde68a]' : 'text-[#9c44dc]'
                    }`}
                    aria-hidden="true"
                  />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {orderedCompanies.length === 0 ? (
        <div className="mx-auto max-w-2xl rounded-[24px] border-2 border-[#bc8ae1]/60 bg-[#ffffff] p-10 text-center">
          <p className="text-sm font-semibold text-[#442c61]">
            No hay publicaciones en esta categoría del Foro todavía.
          </p>
          <button
            type="button"
            onClick={() => setForoFilter('todos')}
            className="mt-4 inline-flex min-h-[42px] items-center gap-2 rounded-[14px] bg-[#442c61] px-5 py-2.5 text-xs font-semibold text-[#ffffff] hover:bg-[#9c44dc] cursor-pointer"
          >
            <LayoutGrid className="h-5 w-5 stroke-[2.25]" aria-hidden="true" />
            <span>Ver todas las publicaciones</span>
          </button>
        </div>
      ) : (
        <div className="mx-auto max-w-2xl space-y-6">
            {orderedCompanies.map((company) => {
              const isUltra = Boolean(company.esUltra);
              const isAd = Boolean(company.pagadoAnuncio);
              const products = company.productos;
              const currentIdx = Math.min(
                slideIndexByCompany[company.id] ?? 0,
                Math.max(0, products.length - 1)
              );
              const activeProduct = products[currentIdx];
              const activeQty = activeProduct ? cartQuantities[activeProduct.id] || 0 : 0;
              const liked = Boolean(likedCompanyIds[company.id]);
              const saved = Boolean(savedCompanyIds[company.id]);
              const totalLikes = (company.likesIniciales || 120) + (liked ? 1 : 0);

              const frameStyle = isUltra
                ? 'border-2 border-[#9c44dc]/55 bg-[#ffffff] shadow-[0_14px_34px_-16px_rgba(156,68,220,0.38)]'
                : 'border-2 border-[#d4af37] bg-gradient-to-b from-[#fffbeb]/70 to-[#ffffff] shadow-[0_12px_28px_-14px_rgba(217,119,6,0.35)]';

              return (
                <article
                  key={`foro-post-${company.id}`}
                  className={`scroll-mt-32 overflow-hidden rounded-[26px] ${frameStyle}`}
                >
                  {/* Header del post (Acceso al perfil de la marca) */}
                  <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
                    <button
                      type="button"
                      onClick={() => onInspectCompany(company)}
                      className="flex items-center gap-3 min-w-0 text-left group cursor-pointer"
                    >
                      <div
                        className={`rounded-full p-[2px] transition-transform group-hover:scale-105 ${
                          isUltra
                            ? 'bg-gradient-to-tr from-[#9c44dc] to-[#f59e0b]'
                            : 'bg-gradient-to-tr from-[#b45309] to-[#fbbf24]'
                        }`}
                      >
                        <div className="rounded-full bg-[#ffffff] p-[1.5px]">
                          <CompanyLogoMark
                            initials={company.emblemaIniciales}
                            name={company.nombre}
                            bannerTone={company.bannerTone}
                            logoIcon={company.logoIcon}
                            logoDataUrl={company.logoDataUrl}
                            size="sm"
                          />
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h2 className="truncate font-display text-base font-bold text-[#0a0a0a] group-hover:text-[#9c44dc]">
                            {company.nombre}
                          </h2>
                          {isUltra && isAd ? (
                            <span className="inline-flex items-center gap-1.5 rounded-[7px] bg-gradient-to-r from-[#442c61] to-[#b45309] px-2.5 py-0.5 text-[11px] font-bold text-[#ffffff]">
                              <Crown className="h-4 w-4 stroke-[2.25] text-[#fde68a]" aria-hidden="true" />
                              Ultra · Anuncio
                            </span>
                          ) : isUltra ? (
                            <span className="inline-flex items-center gap-1.5 rounded-[7px] bg-[#442c61] px-2.5 py-0.5 text-[11px] font-bold text-[#ffffff]">
                              <Crown className="h-4 w-4 stroke-[2.25] text-[#fde68a]" aria-hidden="true" />
                              Licencia Ultra
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-[7px] bg-[#b45309] px-2.5 py-0.5 text-[11px] font-bold text-[#ffffff]">
                              <Sparkles className="h-4 w-4 stroke-[2.25] text-[#fde68a]" aria-hidden="true" />
                              Anuncio Dorado
                            </span>
                          )}
                        </div>
                        <p className="truncate text-xs text-[#543b6c]">
                          {company.barrio}, {company.ciudad}
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => onInspectCompany(company)}
                      className="whitespace-nowrap shrink-0 inline-flex min-h-[42px] items-center gap-2 rounded-[12px] border border-[#bc8ae1] bg-[#faf5ff] px-4 py-2 text-xs font-semibold text-[#442c61] hover:border-[#442c61] hover:bg-[#442c61] hover:text-[#ffffff] transition-colors cursor-pointer"
                    >
                      <Store className="h-5 w-5 stroke-[2.25]" aria-hidden="true" />
                      <span>Ver perfil</span>
                    </button>
                  </div>

                  {/* Carrusel de fotos estilo Instagram (recorre todos los productos de la empresa) */}
                  {activeProduct && (
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#111111]">
                      <img
                        src={getFoodPhotoUrl(activeProduct.imagenKey || company.imagenKey)}
                        alt={`${activeProduct.nombre} de ${company.nombre}`}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/85 via-[#0a0a0a]/20 to-transparent" />

                      {products.length > 1 && (
                        <div className="absolute right-3.5 top-3.5 rounded-full bg-[#0a0a0a]/75 px-3 py-1 font-mono tabular-nums text-[11px] font-semibold text-[#ffffff]">
                          {currentIdx + 1} / {products.length}
                        </div>
                      )}

                      {products.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={() => setSlide(company.id, currentIdx - 1, products.length)}
                            aria-label={`Producto anterior de ${company.nombre}`}
                            className="absolute left-3 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#ffffff]/60 bg-[#ffffff]/95 text-[#0a0a0a] shadow-lg hover:bg-[#ffffff] cursor-pointer"
                          >
                            <ChevronLeft className="h-5 w-5 stroke-[2.5]" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSlide(company.id, currentIdx + 1, products.length)}
                            aria-label={`Siguiente producto de ${company.nombre}`}
                            className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#ffffff]/60 bg-[#ffffff]/95 text-[#0a0a0a] shadow-lg hover:bg-[#ffffff] cursor-pointer"
                          >
                            <ChevronRight className="h-5 w-5 stroke-[2.5]" aria-hidden="true" />
                          </button>
                        </>
                      )}

                      <div className="absolute bottom-3.5 left-4 right-4 flex flex-wrap items-end justify-between gap-3 text-[#ffffff]">
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-semibold text-[#fde68a]">
                            {activeProduct.categoriaFiltro} · {activeProduct.etiquetaPopular}
                          </p>
                          <h3 className="truncate font-display text-lg font-bold sm:text-xl">
                            {activeProduct.nombre}
                          </h3>
                          <p className="line-clamp-2 text-xs text-[#f5f5f5]">
                            {activeProduct.descripcion}
                          </p>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          <span className="font-mono tabular-nums text-base font-bold text-[#fde68a]">
                            {formatCop(activeProduct.precioCop)}
                          </span>
                          {activeQty > 0 ? (
                            <div className="inline-flex items-center gap-1.5 rounded-[12px] bg-[#ffffff] p-1 text-[#0a0a0a] shadow-md">
                              <button
                                type="button"
                                onClick={() => onUpdateQty(activeProduct.id, -1)}
                                aria-label={`Quitar uno de ${activeProduct.nombre}`}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] hover:bg-[#f5f5f5] cursor-pointer"
                              >
                                <Minus className="h-4 w-4 stroke-[2.4]" aria-hidden="true" />
                              </button>
                              <span className="min-w-[20px] text-center font-mono text-xs font-bold">
                                {activeQty}
                              </span>
                              <button
                                type="button"
                                onClick={() => onAddProduct(activeProduct)}
                                aria-label={`Agregar otro ${activeProduct.nombre}`}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#442c61] text-[#ffffff] cursor-pointer"
                              >
                                <Plus className="h-4 w-4 stroke-[2.4]" aria-hidden="true" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onAddProduct(activeProduct)}
                              className="inline-flex min-h-[42px] items-center gap-2 rounded-[12px] bg-[#9c44dc] px-4 py-2 text-xs font-semibold text-[#ffffff] shadow-md hover:bg-[#442c61] cursor-pointer"
                            >
                              <Plus className="h-5 w-5 stroke-[2.4]" aria-hidden="true" />
                              <span>Pedir plato</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Indicadores + Barra de interacciones estilo Instagram */}
                  <div className="space-y-3.5 px-4 py-4 sm:px-5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => toggleLike(company.id)}
                          aria-label={`Me gusta a ${company.nombre}`}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0a0a0a] hover:text-[#be185d] cursor-pointer"
                        >
                          <Heart
                            className={`h-5 w-5 transition-transform active:scale-110 ${
                              liked ? 'fill-[#e11d48] text-[#e11d48]' : 'text-[#442c61]'
                            }`}
                            aria-hidden="true"
                          />
                          <span className="font-mono tabular-nums">{totalLikes}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onInspectCompany(company)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#442c61] hover:text-[#9c44dc] cursor-pointer"
                        >
                          <ShoppingBag className="h-5 w-5" aria-hidden="true" />
                          <span>Carta completa</span>
                        </button>
                      </div>

                      {products.length > 1 && (
                        <div className="flex items-center gap-1.5" aria-label="Selector de productos">
                          {products.map((prod, idx) => (
                            <button
                              key={prod.id}
                              type="button"
                              onClick={() => setSlide(company.id, idx, products.length)}
                              aria-label={`Ver ${prod.nombre}`}
                              className={`h-2 rounded-full transition-all cursor-pointer ${
                                idx === currentIdx
                                  ? 'w-5 bg-[#9c44dc]'
                                  : 'w-2 bg-[#d8c2ef] hover:bg-[#bc8ae1]'
                              }`}
                            />
                          ))}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => toggleSave(company.id)}
                        aria-label={`Guardar ${company.nombre}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#442c61] hover:text-[#9c44dc] cursor-pointer"
                      >
                        <Bookmark
                          className={`h-5 w-5 ${
                            saved ? 'fill-[#442c61] text-[#442c61]' : 'text-[#543b6c]'
                          }`}
                          aria-hidden="true"
                        />
                      </button>
                    </div>

                    {/* Caption promocional de la publicación */}
                    <div className="space-y-2 text-xs leading-relaxed text-[#0a0a0a]">
                      <p>
                        <button
                          type="button"
                          onClick={() => onInspectCompany(company)}
                          className="mr-1.5 font-display font-bold text-[#442c61] hover:text-[#9c44dc] cursor-pointer"
                        >
                          {company.nombre}
                        </button>
                        {company.foroPromo || company.descripcion}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
      )}
    </div>
  );
}
