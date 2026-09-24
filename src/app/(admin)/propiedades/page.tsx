/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

import { PropertyCover } from "@/components/maps/property-cover";
import { EmptyState } from "@/components/ui/empty-state";
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
};

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

function getPropertiesHref({
  archived,
  buscar,
  propietario,
  disponibilidad,
  ordenar,
}: {
  archived: boolean;
  buscar?: string;
  propietario?: string;
  disponibilidad?: FiltroDisponibilidadPropiedad;
  ordenar?: OrdenPropiedades;
}) {
  const params = new URLSearchParams();
  if (archived) params.set("estado", "archivadas");
  if (buscar) params.set("buscar", buscar);
  if (propietario) params.set("propietario", propietario);
  if (disponibilidad && disponibilidad !== "TODAS") params.set("disponibilidad", disponibilidad);
  if (ordenar && ordenar !== "DIRECCION_ASC") params.set("ordenar", ordenar);
  const query = params.toString();
  return query ? `/propiedades?${query}` : "/propiedades";
}

export default async function PropertiesPage({ searchParams }: { searchParams: Promise<PropertySearchParams> }) {
  const query = await searchParams;
  const archived = query.estado === "archivadas";
  const buscar = query.buscar?.trim().slice(0, 100) || undefined;
  const propietario = query.propietario || undefined;
  const disponibilidad = getAvailability(query.disponibilidad);
  const ordenar = getOrder(query.ordenar);
  const [{ user }, properties, propietarios] = await Promise.all([
    getSystemUser(),
    listarPropiedades({ archivadas: archived, busqueda: buscar, propietarioId: propietario, disponibilidad, orden: ordenar }),
    listarPropietariosParaFiltroPropiedades({ archivadas: archived }),
  ]);
  const canWrite = WRITE_ROLES.includes(user.rol as (typeof WRITE_ROLES)[number]);
  const newLink = canWrite ? <Link className="inline-flex rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-[4px_4px_9px_#b8c2cd] hover:bg-brand-hover" href="/propiedades/nueva">Agregar propiedad</Link> : null;
  const hasFilters = Boolean(buscar || propietario || disponibilidad !== "TODAS" || ordenar !== "DIRECCION_ASC");
  const currentQuery = { buscar, propietario, disponibilidad, ordenar };

  return <>
    <PageHeader action={newLink} description={archived ? "Consulta inmuebles archivados y su historial conservado." : "Explora tu portafolio como un catálogo: ubicación, valor y espacios disponibles en una sola vista."} eyebrow="Portafolio inmobiliario" title="Propiedades" />
    <section className="mt-7">
      <nav aria-label="Estado de propiedades" className="mb-5 flex flex-wrap gap-2"><Link className={`rounded-pill px-3 py-1.5 text-sm font-semibold transition-colors ${!archived ? "bg-brand text-white" : "bg-bg text-ink-secondary hover:bg-brand-soft hover:text-brand"}`} href={getPropertiesHref({ archived: false, ...currentQuery })}>Activas</Link><Link className={`rounded-pill px-3 py-1.5 text-sm font-semibold transition-colors ${archived ? "bg-brand text-white" : "bg-bg text-ink-secondary hover:bg-brand-soft hover:text-brand"}`} href={getPropertiesHref({ archived: true, ...currentQuery })}>Archivadas</Link></nav>
      <form action="/propiedades" className="mb-6 rounded-3xl bg-bg p-4 shadow-[6px_6px_14px_#c6cdd6,-6px_-6px_14px_#fff] sm:p-5">
        {archived ? <input name="estado" type="hidden" value="archivadas" /> : null}
        <div className="grid gap-3 lg:grid-cols-[minmax(230px,1.5fr)_minmax(190px,1fr)_minmax(210px,1fr)_minmax(190px,1fr)_auto]">
          <label className="min-w-0"><span className="sr-only">Buscar propiedad</span><div className="flex items-center gap-2 rounded-xl border border-brand/15 bg-white px-3 text-ink shadow-inner"><svg aria-hidden="true" className="h-4 w-4 shrink-0 text-brand" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/></svg><input className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-secondary" defaultValue={buscar} name="buscar" placeholder="Buscar dirección, propietario o marca" type="search" /></div></label>
          {propietarios.length > 0 ? <label><span className="sr-only">Propietario</span><select className="h-11 w-full rounded-xl border border-brand/15 bg-white px-3 text-sm text-ink outline-none focus:border-brand" defaultValue={propietario ?? ""} name="propietario"><option value="">Todos los propietarios</option>{propietarios.map((owner) => <option key={owner.id} value={owner.id}>{owner.nombre}</option>)}</select></label> : null}
          <label><span className="sr-only">Disponibilidad</span><select className="h-11 w-full rounded-xl border border-brand/15 bg-white px-3 text-sm text-ink outline-none focus:border-brand" defaultValue={disponibilidad} name="disponibilidad">{availabilityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          <label><span className="sr-only">Ordenar propiedades</span><select className="h-11 w-full rounded-xl border border-brand/15 bg-white px-3 text-sm text-ink outline-none focus:border-brand" defaultValue={ordenar} name="ordenar">{orderOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          <div className="flex gap-2"><button className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-hover" type="submit">Aplicar</button>{hasFilters ? <Link aria-label="Limpiar filtros" className="inline-flex h-11 items-center justify-center rounded-xl border border-brand/15 bg-white px-3 text-sm font-semibold text-brand hover:bg-brand-soft" href={getPropertiesHref({ archived })}>Limpiar</Link> : null}</div>
        </div>
      </form>
      {properties.length === 0 ? <EmptyState action={hasFilters ? <Link className="inline-flex rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover" href={getPropertiesHref({ archived })}>Limpiar filtros</Link> : archived ? undefined : newLink} description={hasFilters ? "No encontramos inmuebles que coincidan con los filtros elegidos." : archived ? "No hay propiedades archivadas." : "Agrega el primer inmueble para comenzar a registrar sus unidades y contratos."} title={hasFilters ? "Sin resultados" : archived ? "Sin propiedades archivadas" : "Tu portafolio está vacío"} /> : <>
        <div className="mb-5 flex items-center justify-between"><p className="text-sm text-ink-secondary"><span className="font-bold text-ink">{properties.length}</span> {properties.length === 1 ? "inmueble encontrado" : "inmuebles encontrados"}</p><p className="hidden text-sm text-ink-secondary sm:block">Selecciona una propiedad para ver sus unidades</p></div>
        <div className="space-y-5">
          {properties.map((property) => {
            const availableUnits = property.unidades.length;
            const totalUnits = property._count.unidades;
            const availabilityText = availableUnits === 0 ? "Sin unidades disponibles" : `${availableUnits} ${availableUnits === 1 ? "unidad disponible" : "unidades disponibles"}`;
            return <Link className="group grid overflow-hidden rounded-3xl bg-bg shadow-[8px_8px_18px_#c6cdd6,-8px_-8px_18px_#fff] transition duration-200 hover:-translate-y-0.5 hover:shadow-[11px_11px_22px_#c2c9d2,-9px_-9px_20px_#fff] md:grid-cols-[minmax(220px,30%)_1fr]" href={`/propiedades/${property.id}`} key={property.id}>
            <div className="relative min-h-52 overflow-hidden bg-brand md:min-h-full">{property.archivos[0] ? <img alt={`Foto de ${property.direccion}`} className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" src={property.archivos[0].url} /> : <PropertyCover />}{property.marca?.nombreComercial ? <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold text-brand shadow-sm backdrop-blur">{property.marca.nombreComercial}</span> : null}{property.archivadaEn ? <span className="absolute right-4 top-4 rounded-full bg-warning px-3 py-1 text-[11px] font-bold text-white shadow-sm">Archivada</span> : null}<span className={`absolute bottom-4 left-4 rounded-full px-3 py-1.5 text-xs font-bold text-white shadow-lg ${availableUnits > 0 ? "bg-brand" : "bg-ink-secondary"}`}>{availabilityText}</span></div>
            <div className="flex min-w-0 flex-col p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-brand/70">Inmueble</p><h2 className="mt-1 font-serif text-2xl font-semibold leading-snug text-ink transition-colors group-hover:text-brand">{property.direccion}</h2><p className="mt-2 flex items-center gap-1.5 text-sm text-ink-secondary"><svg aria-hidden="true" className="h-4 w-4 shrink-0 text-brand" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z"/><circle cx="12" cy="9" r="2.3"/></svg>{property.latitud && property.longitud ? "Ubicación verificada" : "Ubicación pendiente"}</p><p className="mt-2 text-sm text-ink-secondary"><span className="font-semibold text-ink">Propietario:</span> {property.propietario.nombre}</p></div><span className="hidden rounded-xl bg-brand/8 px-3 py-2 text-sm font-bold text-brand sm:block">Ver detalle <span aria-hidden="true">→</span></span></div>
              <dl className="mt-6 grid border-y border-brand/10 py-4 sm:grid-cols-3"><div className="pb-4 sm:border-r sm:border-brand/10 sm:pb-0 sm:pr-5"><dt className="text-[10px] font-bold uppercase tracking-[.1em] text-ink-secondary">Valor comercial</dt><dd className="mt-1 text-lg font-bold text-brand [font-variant-numeric:tabular-nums]">{formatCurrency(property.valorComercialTotal)}</dd></div><div className="border-t border-brand/10 py-4 sm:border-t-0 sm:px-5 sm:py-0"><dt className="text-[10px] font-bold uppercase tracking-[.1em] text-ink-secondary">Valor catastral</dt><dd className="mt-1 text-sm font-semibold text-ink [font-variant-numeric:tabular-nums]">{formatCurrency(property.valorCatastral)}</dd></div><div className="border-t border-brand/10 pt-4 sm:border-l sm:border-t-0 sm:border-brand/10 sm:pl-5 sm:pt-0"><dt className="text-[10px] font-bold uppercase tracking-[.1em] text-ink-secondary">Predial anual</dt><dd className="mt-1 text-sm font-semibold text-ink [font-variant-numeric:tabular-nums]">{formatCurrency(property.predialAnual)}</dd></div></dl>
              <div className="mt-4 flex items-center justify-between text-sm"><span className="text-ink-secondary">{availableUnits} disponibles de {totalUnits} {totalUnits === 1 ? "unidad" : "unidades"}</span><span className="font-bold text-brand sm:hidden">Ver detalle →</span></div>
            </div>
          </Link>;
          })}
        </div>
      </>}
    </section>
  </>;
}
