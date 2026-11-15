'use client';

import { useState } from 'react';
import {
  ArrowRight,
  Clock,
  Crown,
  CupSoda,
  Flame,
  MapPin,
  Minus,
  PackagePlus,
  Plus,
  ShoppingBag,
  Star,
  Truck,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { resolveProductMenuSection } from '@/src/components/cliente/CompanyComplementModal';
import CompanyLogoMark from '@/src/components/cliente/CompanyLogoMark';
import { getFoodPhotoUrl } from '@/src/data/clientVisualAssets';
import type { ClientCatalogProduct, ClientCompanyCatalog } from '@/src/types/vinchi';

export interface CompanyProfileModalProps {
  company: ClientCompanyCatalog | null;
  cartQuantities: Record<string, number>;
  totalCartItems: number;
  cartSubtotalCop: number;
  onClose: () => void;
  onAddProduct: (product: ClientCatalogProduct) => void;
  onUpdateQty: (productId: string, delta: number) => void;
  onProceedToPay: () => void;
}

const formatCop = (value: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);

export default function CompanyProfileModal({
  company,
  cartQuantities,
  totalCartItems,
  cartSubtotalCop,
  onClose,
  onAddProduct,
  onUpdateQty,
  onProceedToPay,
}: CompanyProfileModalProps) {
  const [menuCategory, setMenuCategory] = useState<string>('Todo');

  if (!company) return null;

  const bebidas = company.productos.filter(
    (p) => resolveProductMenuSection(p) === 'Bebidas'
  );
  const porciones = company.productos.filter(
    (p) => resolveProductMenuSection(p) === 'Porciones'
  );
  const salsas = company.productos.filter(
    (p) => resolveProductMenuSection(p) === 'Salsas'
  );
  const otros = company.productos.filter(
    (p) => resolveProductMenuSection(p) === 'Otros'
  );
  const principalCategories = Array.from(
    new Set(
      company.productos
        .filter((p) => resolveProductMenuSection(p) === 'Principal')
        .map((p) => p.categoriaFiltro)
    )
  );

  const complementTabs: string[] = [
    ...(bebidas.length > 0 ? ['Bebidas'] : []),
    ...(porciones.length > 0 ? ['Porciones'] : []),
    ...(salsas.length > 0 ? ['Salsas'] : []),
    ...(otros.length > 0 ? ['Otros'] : []),
  ];

  const categories = ['Todo', ...principalCategories, ...complementTabs];

  const activeCategory = categories.includes(menuCategory) ? menuCategory : 'Todo';
  const visibleProducts =
    activeCategory === 'Todo'
      ? company.productos
      : activeCategory === 'Bebidas' ||
          activeCategory === 'Porciones' ||
          activeCategory === 'Salsas' ||
          activeCategory === 'Otros'
        ? company.productos.filter((p) => resolveProductMenuSection(p) === activeCategory)
        : company.productos.filter(
            (p) =>
              resolveProductMenuSection(p) === 'Principal' &&
              p.categoriaFiltro === activeCategory
          );

  const coverPhoto = getFoodPhotoUrl(company.imagenKey || company.productos[0]?.imagenKey);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="company-profile-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0a]/60 px-3 py-4 backdrop-blur-[2px] sm:px-6"
    >
      <div className="relative flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-[28px] border-2 border-[#bc8ae1]/75 bg-[#ffffff] shadow-2xl">
        {/* Portada de la empresa con foto del producto principal y botón cerrar */}
        <div className="relative h-44 w-full shrink-0 overflow-hidden bg-[#442c61] sm:h-52">
          <img
            src={coverPhoto}
            alt={`Especialidad de ${company.nombre}`}
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/85 via-[#0a0a0a]/35 to-transparent" />

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar perfil de empresa"
            className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#e5e5e5] bg-[#ffffff]/95 text-[#0a0a0a] shadow-md hover:bg-[#ffffff] cursor-pointer"
          >
            <X className="h-5 w-5 stroke-[2.4]" aria-hidden="true" />
          </button>

          <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-end justify-between gap-3 sm:left-6 sm:right-6">
            <div className="flex items-center gap-3.5 min-w-0">
              <CompanyLogoMark
                initials={company.emblemaIniciales}
                name={company.nombre}
                bannerTone={company.bannerTone}
                logoIcon={company.logoIcon}
                logoDataUrl={company.logoDataUrl}
                size="lg"
              />
              <div className="min-w-0 text-[#ffffff]">
                <div className="flex flex-wrap items-center gap-2">
                  <h2
                    id="company-profile-title"
                    className="truncate font-display text-xl font-bold sm:text-2xl"
                  >
                    {company.nombre}
                  </h2>
                  {company.esUltra && (
                    <span className="inline-flex items-center gap-1.5 rounded-[8px] bg-[#9c44dc] px-2.5 py-0.5 text-[11px] font-semibold text-[#ffffff]">
                      <Crown className="h-4 w-4 stroke-[2.25] text-[#fde68a]" aria-hidden="true" />
                      Licencia Ultra
                    </span>
                  )}
                  {company.pagadoAnuncio && (
                    <span className="inline-flex items-center gap-1.5 rounded-[8px] bg-[#b45309] px-2.5 py-0.5 text-[11px] font-semibold text-[#ffffff]">
                      <Crown className="h-4 w-4 stroke-[2.25] text-[#fde68a]" aria-hidden="true" />
                      Anuncio Dorado
                    </span>
                  )}
                </div>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#f5f5f5]">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 stroke-[2.2] text-[#bc8ae1]" aria-hidden="true" />
                    {company.direccionLocal} · {company.barrio}, {company.ciudad}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-[#ffffff]">
              <span className="inline-flex items-center gap-1.5 rounded-[10px] bg-[#0a0a0a]/65 px-2.5 py-1 font-semibold backdrop-blur-xs">
                <Star className="h-4 w-4 stroke-[2.2] fill-[#fbbf24] text-[#fbbf24]" aria-hidden="true" />
                {company.calificacion}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-[10px] bg-[#0a0a0a]/65 px-2.5 py-1 backdrop-blur-xs">
                <Clock className="h-4 w-4 stroke-[2.2] text-[#bc8ae1]" aria-hidden="true" />
                {company.tiempoEntregaMin} min
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-[10px] bg-[#0a0a0a]/65 px-2.5 py-1 font-mono font-semibold backdrop-blur-xs">
                <Truck className="h-4 w-4 stroke-[2.2] text-[#bc8ae1]" aria-hidden="true" />
                {formatCop(company.costoDomicilioCop)}
              </span>
            </div>
          </div>
        </div>

        {/* Descripción + Pestañas de menú */}
        <div className="border-b border-[#d8c2ef] bg-[#faf5ff] px-4 py-3 sm:px-6">
          <p className="text-xs text-[#543b6c]">{company.descripcion}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {categories.map((cat) => {
              const selected = activeCategory === cat;
              const CatIcon =
                cat === 'Bebidas'
                  ? CupSoda
                  : cat === 'Salsas'
                    ? Flame
                    : cat === 'Otros'
                      ? PackagePlus
                      : UtensilsCrossed;
              const count =
                cat === 'Todo'
                  ? company.productos.length
                  : cat === 'Bebidas'
                    ? bebidas.length
                    : cat === 'Porciones'
                      ? porciones.length
                      : cat === 'Salsas'
                        ? salsas.length
                        : cat === 'Otros'
                          ? otros.length
                          : company.productos.filter(
                              (p) =>
                                resolveProductMenuSection(p) === 'Principal' &&
                                p.categoriaFiltro === cat
                            ).length;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setMenuCategory(cat)}
                  className={`inline-flex min-h-[40px] items-center gap-2 rounded-[12px] px-4 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                    selected
                      ? 'bg-[#442c61] text-[#ffffff]'
                      : 'border border-[#d8c2ef] bg-[#ffffff] text-[#442c61] hover:border-[#9c44dc]'
                  }`}
                >
                  <CatIcon
                    className={`h-4.5 w-4.5 stroke-[2.25] ${
                      selected ? 'text-[#fde68a]' : 'text-[#9c44dc]'
                    }`}
                    aria-hidden="true"
                  />
                  <span>{cat === 'Todo' ? `Todo el menú (${count})` : `${cat} (${count})`}</span>
                </button>
              );
            })}
          </div>

          {complementTabs.length > 0 && (
            <div className="mt-2.5 flex flex-wrap items-center gap-2 rounded-[12px] border border-[#bc8ae1]/60 bg-[#ffffff] px-3 py-2 text-[11px]">
              <span className="font-semibold text-[#442c61]">
                Completa tu pedido al carrito:
              </span>
              {complementTabs.map((sec) => (
                <button
                  key={`quick-${sec}`}
                  type="button"
                  onClick={() => setMenuCategory(sec)}
                  className={`rounded-[8px] px-2.5 py-1 font-semibold transition-colors cursor-pointer ${
                    activeCategory === sec
                      ? 'bg-[#9c44dc] text-[#ffffff]'
                      : 'bg-[#f3e8ff] text-[#442c61] hover:bg-[#9c44dc] hover:text-[#ffffff]'
                  }`}
                >
                  + {sec}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Lista completa del menú con imagen por producto */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {visibleProducts.map((product) => {
              const qty = cartQuantities[product.id] || 0;
              const photoUrl = getFoodPhotoUrl(product.imagenKey || company.imagenKey);
              const menuSection = resolveProductMenuSection(product);

              return (
                <article
                  key={product.id}
                  className="flex flex-col overflow-hidden rounded-[20px] border border-[#d8c2ef] bg-[#ffffff] shadow-2xs transition-colors hover:border-[#9c44dc]"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#faf5ff]">
                    <img
                      src={photoUrl}
                      alt={product.nombre}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute left-3 top-3 rounded-[8px] bg-[#ffffff]/95 px-2.5 py-0.5 text-[11px] font-semibold text-[#442c61] shadow-xs">
                      {menuSection !== 'Principal' ? menuSection : product.categoriaFiltro}
                    </span>
                    <span className="absolute right-3 top-3 rounded-[8px] bg-[#0a0a0a]/75 px-2 py-0.5 text-[10px] font-medium text-[#ffffff]">
                      {product.tiempoPrepMin} min
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col justify-between p-4">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-display text-base font-semibold text-[#0a0a0a]">
                          {product.nombre}
                        </h3>
                        <span className="shrink-0 rounded-[6px] bg-[#f3e8ff] px-2 py-0.5 text-[10px] font-semibold text-[#442c61]">
                          {product.etiquetaPopular}
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-[#543b6c]">
                        {product.descripcion}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#d8c2ef]/70 pt-3">
                      <span className="font-mono tabular-nums text-base font-bold text-[#442c61]">
                        {formatCop(product.precioCop)}
                      </span>

                      {qty > 0 ? (
                        <div className="inline-flex items-center gap-1.5 rounded-[12px] border border-[#9c44dc] bg-[#faf5ff] p-1">
                          <button
                            type="button"
                            onClick={() => onUpdateQty(product.id, -1)}
                            aria-label={`Quitar uno de ${product.nombre}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] border border-[#d8c2ef] bg-[#ffffff] text-[#442c61] hover:border-[#9c44dc] cursor-pointer"
                          >
                            <Minus className="h-4 w-4 stroke-[2.4]" aria-hidden="true" />
                          </button>
                          <span className="min-w-[22px] text-center font-mono text-xs font-bold text-[#0a0a0a]">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => onAddProduct(product)}
                            aria-label={`Agregar otro ${product.nombre}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#9c44dc] text-[#ffffff] hover:bg-[#543b6c] cursor-pointer"
                          >
                            <Plus className="h-4 w-4 stroke-[2.4]" aria-hidden="true" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onAddProduct(product)}
                          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-[12px] bg-[#442c61] px-4 text-xs font-semibold text-[#ffffff] hover:bg-[#9c44dc] cursor-pointer"
                        >
                          <Plus className="h-4.5 w-4.5 stroke-[2.4]" aria-hidden="true" />
                          <span>Agregar</span>
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {/* Barra inferior fija: Pedir más o "No quiero más · Ir a pagar" */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#d8c2ef] bg-[#faf5ff] px-4 py-3.5 sm:px-6">
          <div className="text-xs">
            <p className="font-semibold text-[#442c61]">
              {totalCartItems > 0
                ? `${totalCartItems} ${totalCartItems === 1 ? 'producto' : 'productos'} en tu carrito · ${formatCop(cartSubtotalCop)}`
                : 'Agrega platos de este menú para armar tu pedido'}
            </p>
            <p className="text-[11px] font-medium text-[#166534]">
              Comisión $ 0 para siempre · Tarifa fija domicilio o $ 1.000 si recoges · Bono mín. $ 300.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-[14px] border border-[#bc8ae1] bg-[#ffffff] px-5 py-2.5 text-xs font-semibold text-[#442c61] hover:border-[#9c44dc] cursor-pointer"
            >
              <ShoppingBag className="h-5 w-5 stroke-[2.25] text-[#9c44dc]" aria-hidden="true" />
              <span>Seguir pidiendo más</span>
            </button>
            <button
              type="button"
              onClick={onProceedToPay}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-[14px] bg-[#9c44dc] px-5 py-2.5 text-xs font-semibold text-[#ffffff] shadow-sm hover:bg-[#543b6c] cursor-pointer"
            >
              <span>No quiero más · Ir a pagar</span>
              <ArrowRight className="h-5 w-5 stroke-[2.4]" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
