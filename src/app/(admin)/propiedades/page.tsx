/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

import { PropertyCover } from "@/components/maps/property-cover";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input, Select } from "@/components/ui/form-controls";
import { PageHeader } from "@/components/ui/page-header";
import { getSystemUser, WRITE_ROLES } from "@/lib/auth/authorization";
import { formatCurrency } from "@/lib/format";
import {
  type FiltroDisponibilidadPropiedad,
  type OrdenPropiedades,
  listarPropiedades,
  listarPropietariosParaFiltroPropiedades,
} from "@/lib/services/foundation";

export const dynamic = "force-dynamic";

type PropertySearchParams = {
  estado?: string;
  buscar?: string;
  propietario?: string;
  disponibilidad?: string;
  ordenar?: string;
  pagina?: string;
};

const PROPERTY_PAGE_SIZE = 10;

const availabilityOptions: { value: FiltroDisponibilidadPropiedad; label: string }[] = [
  { value: "TODAS", label: "Todas las disponibilidades" },
  { value: "CON_DISPONIBILIDAD", label: "Con unidades disponibles" },
  { value: "SIN_DISPONIBILIDAD", label: "Sin unidades disponibles" },
];

const orderOptions: { value: OrdenPropiedades; label: string }[] = [
  { value: "DIRECCION_ASC", label: "Dirección: A a Z" },
  { value: "DIRECCION_DESC", label: "Dirección: Z a A" },
  { value: "DISPONIBILIDAD_DESC", label: "Mayor disponibilidad" },
  { value: "VALOR_DESC", label: "Mayor valor comercial" },
  { value: "VALOR_ASC", label: "Menor valor comercial" },
];

function getAvailability(value?: string): FiltroDisponibilidadPropiedad {
  return availabilityOptions.some((option) => option.value === value) ? value as FiltroDisponibilidadPropiedad : "TODAS";
}

function getOrder(value?: string): OrdenPropiedades {
  return orderOptions.some((option) => option.value === value) ? value as OrdenPropiedades : "DIRECCION_ASC";
}

function getPage(value?: string) {
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

function getPropertiesHref({
  archived,
  buscar,
  propietario,
  disponibilidad,
  ordenar,
  pagina,
  pathname = "/propiedades",
}: {
  archived: boolean;
  buscar?: string;
  propietario?: string;
  disponibilidad?: FiltroDisponibilidadPropiedad;
  ordenar?: OrdenPropiedades;
  pagina?: number;
  pathname?: string;
}) {
  const params = new URLSearchParams();
  if (archived) params.set("estado", "archivadas");
  if (buscar) params.set("buscar", buscar);
  if (propietario) params.set("propietario", propietario);
  if (disponibilidad && disponibilidad !== "TODAS") params.set("disponibilidad", disponibilidad);
  if (ordenar && ordenar !== "DIRECCION_ASC") params.set("ordenar", ordenar);
  if (pagina && pagina > 1) params.set("pagina", String(pagina));
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export default async function PropertiesPage({ searchParams }: { searchParams: Promise<PropertySearchParams> }) {
  const query = await searchParams;
  const archived = query.estado === "archivadas";
  const buscar = query.buscar?.trim().slice(0, 100) || undefined;
  const propietario = query.propietario || undefined;
  const disponibilidad = getAvailability(query.disponibilidad);
  const ordenar = getOrder(query.ordenar);
  const requestedPage = getPage(query.pagina);
  const [{ user }, propertyResult, propietarios] = await Promise.all([
    getSystemUser(),
    listarPropiedades({ archivadas: archived, busqueda: buscar, propietarioId: propietario, disponibilidad, orden: ordenar, paginacion: { pagina: requestedPage, limite: PROPERTY_PAGE_SIZE } }),
    listarPropietariosParaFiltroPropiedades({ archivadas: archived }),
  ]);
  const properties = propertyResult.propiedades;
  const totalPages = propertyResult.paginas;
  const firstProperty = propertyResult.total ? (propertyResult.pagina - 1) * PROPERTY_PAGE_SIZE + 1 : 0;
  const lastProperty = Math.min(propertyResult.pagina * PROPERTY_PAGE_SIZE, propertyResult.total);
  const firstVisiblePage = Math.max(1, Math.min(propertyResult.pagina - 2, totalPages - 4));
  const visiblePages = Array.from({ length: Math.min(totalPages, 5) }, (_, index) => firstVisiblePage + index);
  const canWrite = WRITE_ROLES.includes(user.rol as (typeof WRITE_ROLES)[number]);
  const newLink = canWrite ? <Link className="inline-flex rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover" href="/propiedades/nueva">Agregar propiedad</Link> : null;
  const hasFilters = Boolean(buscar || propietario || disponibilidad !== "TODAS" || ordenar !== "DIRECCION_ASC");
  const currentQuery = { buscar, propietario, disponibilidad, ordenar };
  const activeOwnerName = propietarios.find((owner) => owner.id === propietario)?.nombre;
  const availabilityLabel = availabilityOptions.find((option) => option.value === disponibilidad)?.label;
  const orderLabel = orderOptions.find((option) => option.value === ordenar)?.label;
  const exportLink = !archived ? <a className="inline-flex rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-bg" href={getPropertiesHref({ archived: false, ...currentQuery, pathname: "/api/propiedades/exportar" })}>Exportar XLSX</a> : null;

  return <>
    <PageHeader action={exportLink || newLink ? <div className="flex flex-wrap gap-2">{exportLink}{newLink}</div> : null} description={archived ? "Consulta inmuebles archivados y su historial conservado." : "Explora tu portafolio como un catálogo: ubicación, valor y espacios disponibles en una sola vista."} eyebrow="Portafolio inmobiliario" title="Propiedades" />
    <section className="mt-7">
      <nav aria-label="Estado de propiedades" className="mb-5 flex flex-wrap gap-2">
        <Link aria-current={!archived ? "page" : undefined} className={`rounded-pill px-4 py-2 text-sm font-semibold transition-colors ${!archived ? "bg-brand text-white" : "border border-border bg-surface text-ink-secondary hover:border-brand/30 hover:text-brand"}`} href={getPropertiesHref({ archived: false, ...currentQuery })}>Activas</Link>
        <Link aria-current={archived ? "page" : undefined} className={`rounded-pill px-4 py-2 text-sm font-semibold transition-colors ${archived ? "bg-brand text-white" : "border border-border bg-surface text-ink-secondary hover:border-brand/30 hover:text-brand"}`} href={getPropertiesHref({ archived: true, ...currentQuery })}>Archivadas</Link>
      </nav>
      <form action="/propiedades" className="mb-4 rounded-2xl border border-border bg-surface p-4 sm:p-5" method="get">
        {archived ? <input name="estado" type="hidden" value="archivadas" /> : null}
        <div className={`grid gap-4 md:grid-cols-2 ${propietarios.length > 0 ? "2xl:grid-cols-[minmax(230px,1.5fr)_minmax(190px,1fr)_minmax(210px,1fr)_minmax(190px,1fr)_auto]" : "2xl:grid-cols-4"}`}>
          <Field label="Buscar propiedad">
            <div className="flex items-center gap-2 rounded border border-border bg-surface px-3 text-ink focus-within:border-brand">
              <svg aria-hidden="true" className="h-4 w-4 shrink-0 text-brand" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/></svg>
              <Input className="h-11 min-w-0 flex-1 border-0 bg-transparent px-0 focus:border-transparent" defaultValue={buscar} name="buscar" placeholder="Dirección, propietario o marca" type="search" />
            </div>
          </Field>
          {propietarios.length > 0 ? <Field label="Propietario"><Select defaultValue={propietario ?? ""} name="propietario"><option value="">Todos los propietarios</option>{propietarios.map((owner) => <option key={owner.id} value={owner.id}>{owner.nombre}</option>)}</Select></Field> : null}
          <Field label="Disponibilidad"><Select defaultValue={disponibilidad} name="disponibilidad">{availabilityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</Select></Field>
          <Field label="Ordenar por"><Select defaultValue={ordenar} name="ordenar">{orderOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</Select></Field>
          <div className="flex items-end gap-2">
            <Button className="h-11 flex-1" type="submit">Aplicar filtros</Button>
            {hasFilters ? <Link className="inline-flex h-11 items-center justify-center rounded border border-border bg-surface px-3 text-sm font-semibold text-ink hover:bg-bg" href={getPropertiesHref({ archived })}>Limpiar</Link> : null}
          </div>
        </div>
      </form>
      {hasFilters ? (
        <nav aria-label="Filtros activos" className="mb-6 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-semibold text-ink-secondary">Filtros activos:</span>
          {buscar ? <Link aria-label={`Quitar búsqueda: ${buscar}`} className="rounded-pill bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand/15" href={getPropertiesHref({ archived, propietario, disponibilidad, ordenar })}>Búsqueda: {buscar} <span aria-hidden="true">×</span></Link> : null}
          {propietario && activeOwnerName ? <Link aria-label={`Quitar filtro de propietario: ${activeOwnerName}`} className="rounded-pill bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand/15" href={getPropertiesHref({ archived, buscar, disponibilidad, ordenar })}>Propietario: {activeOwnerName} <span aria-hidden="true">×</span></Link> : null}
          {disponibilidad !== "TODAS" ? <Link aria-label={`Quitar filtro de disponibilidad: ${availabilityLabel}`} className="rounded-pill bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand/15" href={getPropertiesHref({ archived, buscar, propietario, ordenar })}>{availabilityLabel} <span aria-hidden="true">×</span></Link> : null}
          {ordenar !== "DIRECCION_ASC" ? <Link aria-label={`Quitar orden: ${orderLabel}`} className="rounded-pill bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand/15" href={getPropertiesHref({ archived, buscar, propietario, disponibilidad })}>Orden: {orderLabel} <span aria-hidden="true">×</span></Link> : null}
        </nav>
      ) : null}
      {properties.length === 0 ? <EmptyState action={hasFilters ? <Link className="inline-flex rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover" href={getPropertiesHref({ archived })}>Limpiar filtros</Link> : archived ? undefined : newLink} description={hasFilters ? "No encontramos inmuebles que coincidan con los filtros elegidos." : archived ? "No hay propiedades archivadas." : "Agrega el primer inmueble para comenzar a registrar sus unidades y contratos."} title={hasFilters ? "Sin resultados" : archived ? "Sin propiedades archivadas" : "Tu portafolio está vacío"} /> : <>
        <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-ink-secondary">Mostrando <span className="font-bold text-ink">{firstProperty}–{lastProperty}</span> de <span className="font-bold text-ink">{propertyResult.total}</span> {propertyResult.total === 1 ? "inmueble" : "inmuebles"}</p>
          <p className="text-sm text-ink-secondary">Selecciona una propiedad para ver sus unidades y contratos.</p>
        </div>
        <div className="space-y-5">
          {properties.map((property) => {
            const availableUnits = property.unidades.length;
            const totalUnits = property._count.unidades;
            const availabilityText = availableUnits === 0 ? "Sin unidades disponibles" : `${availableUnits} ${availableUnits === 1 ? "unidad disponible" : "unidades disponibles"}`;
            return <Link className="group grid overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-colors hover:border-brand/30 md:grid-cols-[minmax(220px,30%)_1fr]" href={`/propiedades/${property.id}`} key={property.id}>
            <div className="relative min-h-52 overflow-hidden bg-brand md:min-h-full">{property.archivos[0] ? <img alt={`Foto de ${property.direccion}`} className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" src={property.archivos[0].url} /> : <PropertyCover />}{property.marca?.nombreComercial ? <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold text-brand shadow-sm backdrop-blur">{property.marca.nombreComercial}</span> : null}{property.archivadaEn ? <span className="absolute right-4 top-4 rounded-full bg-warning px-3 py-1 text-[11px] font-bold text-white shadow-sm">Archivada</span> : null}<span className={`absolute bottom-4 left-4 rounded-full px-3 py-1.5 text-xs font-bold text-white shadow-lg ${availableUnits > 0 ? "bg-brand" : "bg-ink-secondary"}`}>{availabilityText}</span></div>
            <div className="flex min-w-0 flex-col p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-brand/70">Inmueble</p><h2 className="mt-1 font-serif text-2xl font-semibold leading-snug text-ink transition-colors group-hover:text-brand">{property.direccion}</h2><p className="mt-2 flex items-center gap-1.5 text-sm text-ink-secondary"><svg aria-hidden="true" className="h-4 w-4 shrink-0 text-brand" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z"/><circle cx="12" cy="9" r="2.3"/></svg>{property.latitud && property.longitud ? "Ubicación verificada" : "Ubicación pendiente"}</p><p className="mt-2 text-sm text-ink-secondary"><span className="font-semibold text-ink">Propietario:</span> {property.propietario.nombre}</p></div><span className="hidden rounded-xl bg-brand/8 px-3 py-2 text-sm font-bold text-brand sm:block">Ver detalle <span aria-hidden="true">→</span></span></div>
              <dl className="mt-6 grid border-y border-brand/10 py-4 sm:grid-cols-3"><div className="pb-4 sm:border-r sm:border-brand/10 sm:pb-0 sm:pr-5"><dt className="text-[10px] font-bold uppercase tracking-[.1em] text-ink-secondary">Valor comercial</dt><dd className="mt-1 text-lg font-bold text-brand [font-variant-numeric:tabular-nums]">{formatCurrency(property.valorComercialTotal)}</dd></div><div className="border-t border-brand/10 py-4 sm:border-t-0 sm:px-5 sm:py-0"><dt className="text-[10px] font-bold uppercase tracking-[.1em] text-ink-secondary">Valor catastral</dt><dd className="mt-1 text-sm font-semibold text-ink [font-variant-numeric:tabular-nums]">{formatCurrency(property.valorCatastral)}</dd></div><div className="border-t border-brand/10 pt-4 sm:border-l sm:border-t-0 sm:border-brand/10 sm:pl-5 sm:pt-0"><dt className="text-[10px] font-bold uppercase tracking-[.1em] text-ink-secondary">Predial anual</dt><dd className="mt-1 text-sm font-semibold text-ink [font-variant-numeric:tabular-nums]">{formatCurrency(property.predialAnual)}</dd></div></dl>
              <div className="mt-4 flex items-center justify-between text-sm"><span className="text-ink-secondary">{availableUnits} disponibles de {totalUnits} {totalUnits === 1 ? "unidad" : "unidades"}</span><span className="font-bold text-brand sm:hidden">Ver detalle →</span></div>
            </div>
          </Link>;
          })}
        </div>
        {totalPages > 1 ? <nav aria-label="Paginación de propiedades" className="mt-7 flex flex-wrap items-center justify-center gap-2">
          <Link aria-disabled={propertyResult.pagina === 1} className={`rounded border border-border px-3 py-2 text-sm font-semibold ${propertyResult.pagina === 1 ? "pointer-events-none text-ink-secondary/50" : "text-ink hover:bg-bg"}`} href={getPropertiesHref({ archived, ...currentQuery, pagina: propertyResult.pagina - 1 })} tabIndex={propertyResult.pagina === 1 ? -1 : undefined}>Anterior</Link>
          {visiblePages.map((page) => page === propertyResult.pagina
            ? <span aria-current="page" className="rounded bg-brand px-3 py-2 text-sm font-semibold text-white" key={page}>{page}</span>
            : <Link className="rounded border border-border px-3 py-2 text-sm font-semibold text-ink hover:bg-bg" href={getPropertiesHref({ archived, ...currentQuery, pagina: page })} key={page}>{page}</Link>)}
          <Link aria-disabled={propertyResult.pagina === totalPages} className={`rounded border border-border px-3 py-2 text-sm font-semibold ${propertyResult.pagina === totalPages ? "pointer-events-none text-ink-secondary/50" : "text-ink hover:bg-bg"}`} href={getPropertiesHref({ archived, ...currentQuery, pagina: propertyResult.pagina + 1 })} tabIndex={propertyResult.pagina === totalPages ? -1 : undefined}>Siguiente</Link>
        </nav> : null}
      </>}
    </section>
  </>;
}
