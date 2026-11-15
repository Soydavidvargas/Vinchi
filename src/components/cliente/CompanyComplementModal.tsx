'use client';

import { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  CupSoda,
  Flame,
  LayoutGrid,
  Minus,
  PackagePlus,
  Plus,
  ShoppingBag,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import CompanyLogoMark from '@/src/components/cliente/CompanyLogoMark';
import { getFoodPhotoUrl } from '@/src/data/clientVisualAssets';
import type {
  ClientCatalogProduct,
  ClientCompanyCatalog,
  ClientMenuSection,
} from '@/src/types/vinchi';

export interface CompanyComplementModalProps {
  company: ClientCompanyCatalog | null;
  addedProduct: ClientCatalogProduct | null;
  cartQuantities: Record<string, number>;
  totalCartItems: number;
  cartSubtotalCop: number;
  onClose: () => void;
  onAddProduct: (product: ClientCatalogProduct) => void;
  onUpdateQty: (productId: string, delta: number) => void;
  onGoToCart: () => void;
}

type ComplementTab = 'Todos' | 'Bebidas' | 'Porciones' | 'Salsas' | 'Otros';

const formatCop = (value: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);

export function resolveProductMenuSection(product: ClientCatalogProduct): ClientMenuSection {
  if (product.seccionMenu) return product.seccionMenu;
  if (product.categoriaFiltro === 'Bebidas') return 'Bebidas';
  return 'Principal';
}

export default function CompanyComplementModal({
  company,
  addedProduct,
  cartQuantities,
  totalCartItems,
  cartSubtotalCop,
  onClose,
  onAddProduct,
  onUpdateQty,
  onGoToCart,
}: CompanyComplementModalProps) {
  const [selectedTab, setSelectedTab] = useState<ComplementTab>('Todos');

  if (!company || !addedProduct) return null;

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

  const sections: {
    id: Exclude<ComplementTab, 'Todos'>;
    title: string;
    subtitle: string;
    icon: typeof CupSoda;
    items: ClientCatalogProduct[];
  }[] = [
    {
      id: 'Bebidas' as const,
      title: 'Bebidas disponibles',
      subtitle: 'Agrega bebidas frías o calientes de esta empresa al carrito',
      icon: CupSoda,
      items: bebidas,
    },
    ...(porciones.length > 0
      ? [
          {
            id: 'Porciones' as const,
            title: 'Porciones disponibles',
            subtitle: 'Acompañamientos y porciones que vende esta empresa',
            icon: UtensilsCrossed,
            items: porciones,
          },
        ]
      : []),
    {
      id: 'Salsas' as const,
      title: 'Salsas',
      subtitle: 'Salsas y aderezos preparados por la empresa',
      icon: Flame,
      items: salsas,
    },
    {
      id: 'Otros' as const,
      title: 'Otros',
      subtitle: 'Otras opciones y extras que vende esta empresa',
      icon: PackagePlus,
      items: otros,
    },
  ].filter((sec) => sec.items.length > 0);

  const tabs: { id: ComplementTab; label: string; count: number; icon: typeof LayoutGrid }[] = [
    {
      id: 'Todos',
      label: 'Todos los extras',
      count: bebidas.length + porciones.length + salsas.length + otros.length,
      icon: LayoutGrid,
    },
    ...(bebidas.length > 0
      ? [{ id: 'Bebidas' as const, label: 'Bebidas', count: bebidas.length, icon: CupSoda }]
      : []),
    ...(porciones.length > 0
      ? [
          {
            id: 'Porciones' as const,
            label: 'Porciones',
            count: porciones.length,
            icon: UtensilsCrossed,
          },
        ]
      : []),
    ...(salsas.length > 0
      ? [{ id: 'Salsas' as const, label: 'Salsas', count: salsas.length, icon: Flame }]
      : []),
    ...(otros.length > 0
      ? [{ id: 'Otros' as const, label: 'Otros', count: otros.length, icon: PackagePlus }]
      : []),
  ];

  const activeTab: ComplementTab = tabs.some((t) => t.id === selectedTab)
    ? selectedTab
    : 'Todos';

  const visibleSections =
    activeTab === 'Todos' ? sections : sections.filter((s) => s.id === activeTab);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="company-complement-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1e1033]/70 px-3 py-4 sm:px-6"
    >
      <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] border-2 border-[#bc8ae1]/80 bg-[#ffffff] shadow-2xl">
        {/* Cabecera Vinchi Púrpura */}
        <div className="flex items-start justify-between gap-4 border-b-2 border-[#543b6c] bg-[#442c61] px-5 py-4 text-[#ffffff] sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <CompanyLogoMark
              initials={company.emblemaIniciales}
              name={company.nombre}
              bannerTone={company.bannerTone}
              logoIcon={company.logoIcon}
              logoDataUrl={company.logoDataUrl}
              size="md"
            />
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 rounded-[8px] bg-[#16a34a]/25 px-2.5 py-0.5 text-[11px] font-bold text-[#bbf7d0]">
                <CheckCircle2 className="h-4 w-4 stroke-[2.25]" aria-hidden="true" />
                <span className="truncate">Agregado: {addedProduct.nombre}</span>
              </div>
              <h2
                id="company-complement-title"
                className="mt-1 truncate font-display text-lg font-bold tracking-[-0.02em] text-[#ffffff] sm:text-xl"
              >
                Completa tu pedido en {company.nombre}
              </h2>
              <p className="text-xs text-[#e9d5ff]">
                Agrega bebidas, porciones, salsas u otros productos directo al carrito.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar complementos"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border border-[#bc8ae1]/45 bg-[#ffffff]/14 text-[#ffffff] hover:bg-[#9c44dc] cursor-pointer"
          >
            <X className="h-5 w-5 stroke-[2.4]" aria-hidden="true" />
          </button>
        </div>

        {/* Pestañas: Todos / Bebidas / Porciones (si vende) / Salsas / Otros */}
        <div className="flex flex-wrap gap-2 border-b border-[#d8c2ef] bg-[#faf5ff] px-5 py-3 sm:px-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedTab(tab.id)}
                className={`inline-flex min-h-[40px] items-center gap-2 rounded-[12px] px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                  selected
                    ? 'bg-[#9c44dc] text-[#ffffff] shadow-xs'
                    : 'border border-[#d8c2ef] bg-[#ffffff] text-[#442c61] hover:border-[#9c44dc]'
                }`}
              >
                <Icon
                  className={`h-4.5 w-4.5 stroke-[2.25] ${
                    selected ? 'text-[#fde68a]' : 'text-[#9c44dc]'
                  }`}
                  aria-hidden="true"
                />
                <span>
                  {tab.label} ({tab.count})
                </span>
              </button>
            );
          })}
        </div>

        {/* Contenido scrollable por categoría */}
        <div className="flex-1 space-y-6 overflow-y-auto bg-[#ffffff] p-5 sm:p-6">
          {visibleSections.map((section) => {
            const SecIcon = section.icon;
            return (
              <section key={section.id} className="space-y-3">
                <div className="flex items-center gap-2.5 border-b border-[#d8c2ef]/70 pb-2">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#f3e8ff] text-[#9c44dc]">
                    <SecIcon className="h-5 w-5 stroke-[2.25]" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="font-display text-base font-bold text-[#442c61]">
                      {section.title}
                    </h3>
                    <p className="text-[11px] text-[#543b6c]">{section.subtitle}</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {section.items.map((item) => {
                    const qty = cartQuantities[item.id] || 0;
                    const photo = getFoodPhotoUrl(item.imagenKey || company.imagenKey);

                    return (
                      <article
                        key={item.id}
                        className="flex items-center justify-between gap-3 rounded-[18px] border border-[#d8c2ef] bg-[#faf5ff]/75 p-3 transition-colors hover:border-[#9c44dc] hover:bg-[#ffffff]"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={photo}
                            alt={item.nombre}
                            referrerPolicy="no-referrer"
                            className="h-14 w-14 shrink-0 rounded-[12px] border border-[#d8c2ef] object-cover"
                          />
                          <div className="min-w-0">
                            <p className="truncate font-display text-sm font-bold text-[#0a0a0a]">
                              {item.nombre}
                            </p>
                            <p className="line-clamp-2 text-[11px] text-[#543b6c]">
                              {item.descripcion}
                            </p>
                            <p className="mt-1 font-mono text-xs font-bold text-[#442c61]">
                              {formatCop(item.precioCop)}
                            </p>
                          </div>
                        </div>

                        {qty > 0 ? (
                          <div className="inline-flex shrink-0 items-center gap-1 rounded-[10px] border border-[#9c44dc] bg-[#ffffff] p-1">
                            <button
                              type="button"
                              onClick={() => onUpdateQty(item.id, -1)}
                              aria-label={`Quitar uno de ${item.nombre}`}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-[7px] border border-[#d8c2ef] text-[#442c61] hover:border-[#9c44dc] cursor-pointer"
                            >
                              <Minus className="h-4 w-4 stroke-[2.4]" aria-hidden="true" />
                            </button>
                            <span className="min-w-[18px] text-center font-mono text-xs font-bold text-[#0a0a0a]">
                              {qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => onAddProduct(item)}
                              aria-label={`Agregar otro ${item.nombre}`}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-[7px] bg-[#9c44dc] text-[#ffffff] hover:bg-[#543b6c] cursor-pointer"
                            >
                              <Plus className="h-4 w-4 stroke-[2.4]" aria-hidden="true" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onAddProduct(item)}
                            className="inline-flex min-h-[38px] shrink-0 items-center gap-1.5 rounded-[12px] bg-[#442c61] px-3.5 py-2 text-xs font-semibold text-[#ffffff] hover:bg-[#9c44dc] cursor-pointer"
                          >
                            <Plus className="h-4 w-4 stroke-[2.4]" aria-hidden="true" />
                            <span>Agregar</span>
                          </button>
                        )}
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        {/* Pie fijo con resumen y botones */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#d8c2ef] bg-[#faf5ff] px-5 py-3.5 sm:px-6">
          <div className="text-xs">
            <p className="font-bold text-[#442c61]">
              {totalCartItems} {totalCartItems === 1 ? 'producto' : 'productos'} en tu carrito ·{' '}
              {formatCop(cartSubtotalCop)}
            </p>
            <p className="text-[11px] font-medium text-[#166534]">
              Comisión Vinchi $ 0 para siempre · Tarifa fija domicilio o $ 1.000 si recoges
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-[42px] items-center gap-2 rounded-[14px] border border-[#bc8ae1] bg-[#ffffff] px-4 py-2 text-xs font-semibold text-[#442c61] hover:border-[#9c44dc] cursor-pointer"
            >
              <ShoppingBag className="h-4.5 w-4.5 stroke-[2.25] text-[#9c44dc]" aria-hidden="true" />
              <span>Seguir comprando</span>
            </button>
            <button
              type="button"
              onClick={onGoToCart}
              className="inline-flex min-h-[42px] items-center gap-2 rounded-[14px] bg-[#9c44dc] px-5 py-2 text-xs font-semibold text-[#ffffff] shadow-sm hover:bg-[#543b6c] cursor-pointer"
            >
              <span>Ir al carrito</span>
              <ArrowRight className="h-4.5 w-4.5 stroke-[2.4]" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
